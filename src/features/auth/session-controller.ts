import { createStore } from 'zustand/vanilla';

import { sessionEnded, type AccessGrant } from '@/lib/api/authentication';
import { ApiError } from '@/lib/api/api-error';
import type { createAuthApi } from './api';
import type { AuthTokensResponse, LoginInput, PublicUser, RegisterInput } from './types';

export type StoredCredential = { refreshToken: string; refreshExpiresAt: string };
export type SessionStorage = {
  read: () => Promise<StoredCredential | null>;
  write: (value: StoredCredential) => Promise<void>;
  clear: () => Promise<void>;
};
export type SessionSnapshot = {
  status: 'restoring' | 'restore-error' | 'signed-out' | 'signed-in';
  user: PublicUser | null;
  message: string | null;
};
type Session = AuthTokensResponse & { accessExpiresAt: number };
type AuthApi = ReturnType<typeof createAuthApi>;

export class SessionController {
  private session: Session | null = null;
  private epoch = 0;
  private version = 0;
  private signingOut = false;
  private pendingAuthorization: Promise<AccessGrant> | null = null;
  private recovery: { epoch: number; version: number; promise: Promise<AccessGrant> } | null = null;
  readonly store = createStore<SessionSnapshot>(() => ({
    status: 'restoring', user: null, message: null,
  }));
  private queue: Promise<unknown> = Promise.resolve();

  // Use the API and storage provided by the app.
  constructor(private api: AuthApi, private storage: SessionStorage) {}

  // Run session changes one at a time so they do not use the same refresh token twice.
  private exclusive<T>(operation: () => Promise<T>): Promise<T> {
    const pending = this.queue.then(operation);
    this.queue = pending.catch(() => undefined);
    return pending;
  }

  // Remove saved credentials and update the app to signed out.
  private async clear(message: string | null = null) {
    this.epoch++;
    this.session = null;
    try {
      await this.storage.clear();
      this.store.setState({ status: 'signed-out', user: null, message });
    } catch {
      this.store.setState({ status: 'restore-error', user: null, message: 'Could not clear the saved sign-in. Please try again.' });
      throw new Error('Could not clear the saved sign-in. Please try again.');
    }
  }

  // Save the new refresh token before marking the user as signed in.
  private async accept(tokens: AuthTokensResponse) {
    try {
      await this.storage.write({ refreshToken: tokens.refreshToken, refreshExpiresAt: tokens.refreshExpiresAt });
    } catch {
      await this.api.logout({ refreshToken: tokens.refreshToken }).catch(() => undefined);
      await this.clear('Could not securely save your sign-in. Please try again.').catch(() => undefined);
      throw new Error('Could not securely save your sign-in. Please try again.');
    }
    this.version++;
    this.session = { ...tokens, accessExpiresAt: Date.now() + tokens.expiresIn * 1000 };
    this.store.setState({ status: 'signed-in', user: tokens.user, message: null });
    return this.session;
  }

  // Get fresh tokens and wait for any minimum loading time before updating the app.
  private async rotate(credential: StoredCredential, ready: Promise<void> = Promise.resolve()) {
    if (Date.parse(credential.refreshExpiresAt) <= Date.now()) {
      await ready;
      await this.clear('Your session expired. Please sign in again.');
      throw new ApiError('Your session expired. Please sign in again.', 401, 'http');
    }
    try {
      const tokens = await this.api.refresh({ refreshToken: credential.refreshToken });
      await ready;
      return await this.accept(tokens);
    } catch (error) {
      await ready;
      if (error instanceof ApiError && (error.status === 400 || error.status === 401)) {
        await this.clear('Your session expired. Please sign in again.');
      }
      throw error;
    }
  }

  // Restore saved sign-in details and keep the loader visible for the requested time.
  restore = (minimumDurationMs = 0) => this.exclusive(async () => {
    if (this.store.getState().status !== 'restoring' && this.store.getState().status !== 'restore-error') return;
    this.store.setState({ status: 'restoring', user: null, message: null });
    const ready = minimumDurationMs > 0
      ? new Promise<void>(resolve => setTimeout(resolve, minimumDurationMs))
      : Promise.resolve();
    try {
      const credential = await this.storage.read();
      if (!credential) {
        await ready;
        this.store.setState({ status: 'signed-out', user: null, message: null });
        return;
      }
      await this.rotate(credential, ready);
    } catch (error) {
      await ready;
      if (this.store.getState().status === 'signed-out') return;
      this.store.setState({ status: 'restore-error', user: null, message: error instanceof ApiError
        ? error.message : 'Could not restore your saved sign-in. Please try again.' });
    }
  });

  // Remove sign-in details from this device without calling server logout.
  clearSavedSignIn = () => this.exclusive(() => this.clear());

  // Sign in with an email and password, then save the session.
  login = (input: LoginInput) => this.exclusive(async () => {
    this.epoch++;
    await this.accept(await this.api.login(input));
  });

  // Create an account, then save its signed-in session.
  register = (input: RegisterInput) => this.exclusive(async () => {
    this.epoch++;
    await this.accept(await this.api.register(input));
  });

  // Block old requests as soon as logout starts, even while refresh is finishing.
  logout = () => {
    this.signingOut = true;
    this.epoch++;
    return this.exclusive(async () => {
      try {
        if (this.session) await this.api.logout({ refreshToken: this.session.refreshToken });
        await this.clear();
      } finally { this.signingOut = false; }
    });
  };

  // Reject results from an account that has signed out or been replaced.
  isAuthorizationCurrent = (grant: AccessGrant) => !this.signingOut && this.session !== null && grant.epoch === this.epoch;

  // Share token preparation so concurrent callers also share a failed refresh.
  authorization = (expectedEpoch?: number): Promise<AccessGrant> => {
    if (expectedEpoch !== undefined && expectedEpoch !== this.epoch) return Promise.reject(sessionEnded());
    if (!this.pendingAuthorization) {
      const pending = this.loadAuthorization();
      this.pendingAuthorization = pending;
      void pending.finally(() => { if (this.pendingAuthorization === pending) this.pendingAuthorization = null; }).catch(() => undefined);
    }
    return this.pendingAuthorization.then(grant => {
      if (!this.isAuthorizationCurrent(grant) || (expectedEpoch !== undefined && expectedEpoch !== grant.epoch)) throw sessionEnded();
      return grant;
    });
  };

  // Read a token, refreshing it first if it is close to expiry.
  private loadAuthorization = () => this.exclusive(async (): Promise<AccessGrant> => {
    if (this.signingOut || !this.session) throw sessionEnded();
    const epoch = this.epoch;
    if (Date.parse(this.session.refreshExpiresAt) <= Date.now() || this.session.accessExpiresAt <= Date.now() + 30_000) {
      await this.rotate(this.session);
    }
    if (this.signingOut || !this.session || epoch !== this.epoch) throw sessionEnded();
    return { token: this.session.accessToken, epoch, version: this.version };
  });

  // Share a refresh between requests that failed with the same session version.
  recoverAuthorization = (grant: AccessGrant): Promise<AccessGrant> => {
    if (this.recovery?.epoch === grant.epoch && this.recovery.version === grant.version) return this.recovery.promise;
    const promise = this.exclusive(async () => {
      if (this.signingOut || !this.session || grant.epoch !== this.epoch) throw sessionEnded();
      if (grant.version === this.version) await this.rotate(this.session);
      if (this.signingOut || !this.session || grant.epoch !== this.epoch) throw sessionEnded();
      return { token: this.session.accessToken, epoch: this.epoch, version: this.version };
    });
    const recovery = { epoch: grant.epoch, version: grant.version, promise };
    this.recovery = recovery;
    void promise.finally(() => { if (this.recovery === recovery) this.recovery = null; }).catch(() => undefined);
    return promise;
  };

  // A failed retry may expire only the session that actually sent that request.
  expireAuthorization = (grant: AccessGrant) => this.exclusive(async () => {
    if (this.session && grant.epoch === this.epoch && grant.version === this.version) {
      await this.clear('Your session expired. Please sign in again.');
    }
  });

  // Profile uses the same authenticated client and retry rules as every other API.
  profile = async (signal?: AbortSignal): Promise<PublicUser> => (await this.api.me(signal)).user;
}
