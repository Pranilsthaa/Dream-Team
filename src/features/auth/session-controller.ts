import { createStore } from 'zustand/vanilla';

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
    this.session = { ...tokens, accessExpiresAt: Date.now() + tokens.expiresIn * 1000 };
    this.store.setState({ status: 'signed-in', user: tokens.user, message: null });
    return this.session;
  }

  // Get fresh tokens and wait for any minimum loading time before updating the app.
  private async rotate(credential: StoredCredential, ready: Promise<void> = Promise.resolve()) {
    if (Date.parse(credential.refreshExpiresAt) <= Date.now()) {
      await ready;
      await this.clear('Your session expired. Please sign in again.');
      throw new Error('Your session expired. Please sign in again.');
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
    await this.accept(await this.api.login(input));
  });

  // Create an account, then save its signed-in session.
  register = (input: RegisterInput) => this.exclusive(async () => {
    await this.accept(await this.api.register(input));
  });

  // End the session on the server, then remove saved sign-in details.
  logout = () => this.exclusive(async () => {
    if (this.session) await this.api.logout({ refreshToken: this.session.refreshToken });
    await this.clear();
  });

  // Return the current session, refreshing tokens if they expire within 30 seconds.
  private validSession = () => this.exclusive(async () => {
    if (!this.session) throw new Error('Please sign in again.');
    if (Date.parse(this.session.refreshExpiresAt) <= Date.now() || this.session.accessExpiresAt <= Date.now() + 30_000) {
      return this.rotate(this.session);
    }
    return this.session;
  });

  // Load the user profile and retry once with fresh tokens if access is rejected.
  profile = async (signal?: AbortSignal): Promise<PublicUser> => {
    const session = await this.validSession();
    try {
      const { user } = await this.api.me(session.accessToken, signal);
      return user;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
    }

    const refreshed = await this.exclusive(async () => {
      if (!this.session) throw new Error('Please sign in again.');
      return this.session === session ? this.rotate(this.session) : this.session;
    });
    try {
      return (await this.api.me(refreshed.accessToken, signal)).user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await this.exclusive(async () => {
          if (this.session === refreshed) await this.clear('Your session expired. Please sign in again.');
        });
      }
      throw error;
    }
  };
}
