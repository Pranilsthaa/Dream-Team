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
  private snapshot: SessionSnapshot = { status: 'restoring', user: null, message: null };
  private listeners = new Set<() => void>();
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private api: AuthApi, private storage: SessionStorage) {}

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private publish(snapshot: SessionSnapshot) {
    this.snapshot = snapshot;
    this.listeners.forEach(listener => listener());
  }

  /** Serializes refresh, persistence, sign-in, and logout against one credential. */
  private exclusive<T>(operation: () => Promise<T>): Promise<T> {
    const pending = this.queue.then(operation);
    this.queue = pending.catch(() => undefined);
    return pending;
  }

  private async clear(message: string | null = null) {
    this.session = null;
    try {
      await this.storage.clear();
      this.publish({ status: 'signed-out', user: null, message });
    } catch {
      this.publish({ status: 'restore-error', user: null, message: 'Could not clear the saved sign-in. Please try again.' });
      throw new Error('Could not clear the saved sign-in. Please try again.');
    }
  }

  private async accept(tokens: AuthTokensResponse) {
    try {
      await this.storage.write({ refreshToken: tokens.refreshToken, refreshExpiresAt: tokens.refreshExpiresAt });
    } catch {
      await this.api.logout({ refreshToken: tokens.refreshToken }).catch(() => undefined);
      await this.clear('Could not securely save your sign-in. Please try again.').catch(() => undefined);
      throw new Error('Could not securely save your sign-in. Please try again.');
    }
    this.session = { ...tokens, accessExpiresAt: Date.now() + tokens.expiresIn * 1000 };
    this.publish({ status: 'signed-in', user: tokens.user, message: null });
    return this.session;
  }

  private async rotate(credential: StoredCredential) {
    if (Date.parse(credential.refreshExpiresAt) <= Date.now()) {
      await this.clear('Your session expired. Please sign in again.');
      throw new Error('Your session expired. Please sign in again.');
    }
    try {
      return await this.accept(await this.api.refresh({ refreshToken: credential.refreshToken }));
    } catch (error) {
      if (error instanceof ApiError && (error.status === 400 || error.status === 401)) {
        await this.clear('Your session expired. Please sign in again.');
      }
      throw error;
    }
  }

  restore = () => this.exclusive(async () => {
    if (this.snapshot.status !== 'restoring' && this.snapshot.status !== 'restore-error') return;
    this.publish({ status: 'restoring', user: null, message: null });
    try {
      const credential = await this.storage.read();
      if (!credential) {
        this.publish({ status: 'signed-out', user: null, message: null });
        return;
      }
      await this.rotate(credential);
    } catch (error) {
      if (this.getSnapshot().status === 'signed-out') return;
      this.publish({ status: 'restore-error', user: null, message: error instanceof ApiError
        ? error.message : 'Could not restore your saved sign-in. Please try again.' });
    }
  });

  clearSavedSignIn = () => this.exclusive(() => this.clear());

  login = (input: LoginInput) => this.exclusive(async () => {
    await this.accept(await this.api.login(input));
  });

  register = (input: RegisterInput) => this.exclusive(async () => {
    await this.accept(await this.api.register(input));
  });

  logout = () => this.exclusive(async () => {
    if (this.session) await this.api.logout({ refreshToken: this.session.refreshToken });
    await this.clear();
  });

  private validSession = () => this.exclusive(async () => {
    if (!this.session) throw new Error('Please sign in again.');
    if (Date.parse(this.session.refreshExpiresAt) <= Date.now() || this.session.accessExpiresAt <= Date.now() + 30_000) {
      return this.rotate(this.session);
    }
    return this.session;
  });

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
