import { CanceledError, isAxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { ApiError } from './api-error';

export type AccessGrant = { token: string; epoch: number; version: number };
export type ApiSession = {
  isAuthorizationCurrent: (grant: AccessGrant) => boolean;
  authorization: (epoch?: number) => Promise<AccessGrant>;
  recoverAuthorization: (grant: AccessGrant) => Promise<AccessGrant>;
  expireAuthorization: (grant: AccessGrant) => Promise<void>;
};
type Attempt = { owner: ApiSession; grant: AccessGrant; retried: boolean };

declare module 'axios' {
  interface AxiosRequestConfig { _sessionAttempt?: Attempt }
}

export function sessionEnded() {
  return new ApiError('Your session changed. Please sign in again.', 401, 'http');
}

// Stop waiting when this request is canceled, without canceling a shared refresh.
async function whileActive<T>(work: Promise<T>, config: AxiosRequestConfig): Promise<T> {
  const signal = config.signal;
  if (!signal) return work;
  let onAbort: () => void = () => undefined;
  const canceled = new Promise<never>((_, reject) => {
    onAbort = () => reject(new CanceledError('Request canceled'));
    signal.addEventListener?.('abort', onAbort);
    if (signal.aborted) onAbort();
  });
  try { return await Promise.race([work, canceled]); }
  finally { signal.removeEventListener?.('abort', onAbort); }
}

// Identify auth endpoints so login, refresh, and logout can never refresh themselves.
function isAuthEndpoint(client: AxiosInstance, config: AxiosRequestConfig) {
  return /\/auth\/(login|register|refresh|logout)\/?$/.test(new URL(client.getUri(config)).pathname);
}

// Attach credentials only to the configured API, and keep retries in the same session.
export async function authorizeRequest(client: AxiosInstance, config: InternalAxiosRequestConfig, getSession: () => ApiSession | undefined) {
  const target = new URL(client.getUri(config));
  const base = new URL(`${config.baseURL?.replace(/\/+$/, '')}/`);
  if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) {
    throw new ApiError('Authenticated requests must stay within the configured API URL.', 0, 'configuration');
  }
  if (isAuthEndpoint(client, config)) {
    config.headers.delete('Authorization');
    delete config._sessionAttempt;
    return;
  }
  if (config.signal?.aborted) throw new CanceledError('Request canceled');
  const owner = getSession();
  if (!owner || (config._sessionAttempt && config._sessionAttempt.owner !== owner)) throw sessionEnded();
  const grant = await whileActive(owner.authorization(config._sessionAttempt?.grant.epoch), config);
  if (getSession() !== owner) throw sessionEnded();
  config._sessionAttempt = { owner, grant, retried: config._sessionAttempt?.retried ?? false };
  config.headers.set('Authorization', `Bearer ${grant.token}`);
}

// Retry only HTTP 401 once; keep other failures and canceled requests unchanged.
export async function recoverRequest(error: unknown, client: AxiosInstance, getSession: () => ApiSession | undefined): Promise<AxiosResponse | undefined> {
  if (!isAxiosError(error) || error.response?.status !== 401 || !error.config?._sessionAttempt) return;
  const config = error.config;
  const attempt = config._sessionAttempt!;
  if (config.signal?.aborted) throw new CanceledError('Request canceled');
  if (config.data && typeof config.data === 'object' && (typeof config.data.pipe === 'function' || typeof config.data.getReader === 'function')) {
    throw new ApiError('This request body cannot be retried automatically.', 401, 'http');
  }
  if (getSession() !== attempt.owner) throw sessionEnded();
  if (attempt.retried) {
    await attempt.owner.expireAuthorization(attempt.grant);
    return;
  }
  await whileActive(attempt.owner.recoverAuthorization(attempt.grant), config);
  if (config.signal?.aborted) throw new CanceledError('Request canceled');
  if (getSession() !== attempt.owner) throw sessionEnded();
  config._sessionAttempt = { ...attempt, retried: true };
  return client.request(config);
}
