import { isAxiosError, isCancel, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

const sensitiveKey = /password|passphrase|token|authorization|cookie|secret|api[-_]?key/i;
const redacted = '[REDACTED]';
const requests = new WeakMap<AxiosRequestConfig, {
  id: number;
  startedAt: number;
  method: string;
  url: string;
  secrets: Set<string>;
}>();
let nextId = 0;

function parseBody(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); }
  catch { return value; }
}

function collectSecrets(value: unknown, secrets: Set<string>, seen = new WeakSet<object>()) {
  const parsed = parseBody(value);
  if (!parsed || typeof parsed !== 'object' || seen.has(parsed)) return;
  seen.add(parsed);
  for (const [key, item] of Object.entries(parsed)) {
    if (sensitiveKey.test(key) && typeof item === 'string' && item) {
      secrets.add(item);
      if (/authorization/i.test(key)) {
        const credential = item.match(/^\S+\s+(.+)$/)?.[1];
        if (credential) secrets.add(credential);
      }
    } else collectSecrets(item, secrets, seen);
  }
}

function sanitize(value: unknown, secrets: Set<string>, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') {
    let text = value;
    for (const secret of secrets) text = text.split(secret).join(redacted);
    return text.replace(/Bearer\s+\S+/gi, `Bearer ${redacted}`)
      .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, redacted)
      .replace(/\b[0-9a-f-]{36}\.[0-9a-f]{64}\b/gi, redacted);
  }
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.map(item => sanitize(item, secrets, seen));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key, sensitiveKey.test(key) ? redacted : sanitize(item, secrets, seen),
  ]));
}

function requestSecrets(config?: AxiosRequestConfig): Set<string> {
  const secrets = new Set<string>();
  collectSecrets(config?.data, secrets);
  collectSecrets(config?.params, secrets);
  collectSecrets(config?.headers, secrets);
  if (config?.auth?.password) secrets.add(config.auth.password);
  return secrets;
}

function safeUrl(uri: string, secrets: Set<string>): string {
  try {
    const url = new URL(uri);
    if (url.username) url.username = redacted;
    if (url.password) {
      secrets.add(decodeURIComponent(url.password));
      url.password = redacted;
    }
    url.searchParams.forEach((value, key) => {
      if (sensitiveKey.test(key)) {
        if (value) secrets.add(value);
        url.searchParams.set(key, redacted);
      } else {
        url.searchParams.set(key, String(sanitize(value, secrets)));
      }
    });
    url.hash = '';
    return String(sanitize(url.toString(), secrets));
  } catch {
    return String(sanitize(uri.split('?')[0].replace(/\/\/[^/@]+@/, `//${redacted}@`), secrets));
  }
}

export function logApiRequest(client: AxiosInstance, config: AxiosRequestConfig) {
  try {
    const id = ++nextId;
    const startedAt = Date.now();
    const secrets = requestSecrets(config);
    const url = safeUrl(client.getUri(config), secrets);
    const method = config.method?.toUpperCase() ?? 'GET';
    requests.set(config, { id, startedAt, method, url, secrets });
    console.log(`[API #${id}] REQUEST`, {
      method,
      url,
      ...(config.params !== undefined ? { params: sanitize(config.params, secrets) } : {}),
      ...(config.data !== undefined ? { body: sanitize(parseBody(config.data), secrets) } : {}),
    });
  } catch {
    // Logging must not prevent dispatching the request.
  }
}

export function logApiResponse(response: AxiosResponse) {
  try {
    const request = requests.get(response.config);
    console.log(`[API #${request?.id ?? '?'}] RESPONSE`, {
      status: response.status,
      ...(request ? { durationMs: Date.now() - request.startedAt } : {}),
    });
  } catch {
    // Logging must not replace a successful response.
  }
}

export function logApiError(error: unknown) {
  try {
    const config = isAxiosError(error) ? error.config : undefined;
    const request = config ? requests.get(config) : undefined;
    const label = `[API #${request?.id ?? '?'}] ${isCancel(error) ? 'CANCELED' : 'ERROR'}`;
    const secrets = request?.secrets ?? requestSecrets(config);
    const details = {
      ...(request ? { method: request.method, url: request.url }
        : config ? { method: config.method?.toUpperCase(), url: safeUrl(config.url ?? '', secrets) } : {}),
      ...(isAxiosError(error) ? {
        code: error.code,
        status: error.response?.status,
        backend: sanitize(parseBody(error.response?.data), secrets),
        retryAfter: sanitize(error.response?.headers['retry-after'], secrets),
      } : {}),
      message: sanitize(error instanceof Error ? error.message : String(error), secrets),
      ...(request ? { durationMs: Date.now() - request.startedAt } : {}),
    };
    if (isCancel(error)) console.log(label, details);
    else console.error(label, details);
  } catch {
    // Logging must not replace the original API error.
  }
}
