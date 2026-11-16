import { isAxiosError } from 'axios';

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'configuration' | 'unexpected';

export class ApiError extends Error {
  readonly name = 'ApiError';

  constructor(
    message: string,
    readonly status: number,
    readonly kind: ApiErrorKind,
    readonly messages: readonly string[] = [],
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

function retryAfterSeconds(value: unknown): number | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds));
  const date = Date.parse(String(value));
  return Number.isNaN(date) ? undefined : Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!isAxiosError(error)) {
    return new ApiError('Something went wrong. Please try again.', 0, 'unexpected');
  }
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError('The request timed out. Please try again.', 0, 'timeout');
    }
    return new ApiError('Unable to reach the server. Check your connection and try again.', 0, 'network');
  }

  const { status, data, headers } = error.response;
  const message: unknown = data && typeof data === 'object' ? data.message : undefined;
  const messages = (Array.isArray(message) ? message : [message])
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  const retryAfter = retryAfterSeconds(headers['retry-after']);

  if (status >= 500) {
    return new ApiError('The server is unavailable. Please try again later.', status, 'http');
  }
  if (status === 429) {
    return new ApiError('Too many attempts. Please wait before trying again.', status, 'http', messages, retryAfter);
  }
  return new ApiError(messages.join('\n') || 'The request could not be completed.', status, 'http', messages, retryAfter);
}
