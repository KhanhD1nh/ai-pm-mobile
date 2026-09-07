import { env } from '@/config/env';
import { sessionStorage } from '@/infrastructure/auth/session-storage';
import { ApiError } from '@/shared/errors/api-error';

let requestSequence = 0;
const DEFAULT_TIMEOUT_MS = 15_000;
const LOG_API_BODIES = process.env.EXPO_PUBLIC_DEBUG_API_BODY === 'true';

const sensitiveKeyPattern = /authorization|password|passcode|token|secret|api[-_]?key|cookie/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    if (typeof FormData !== 'undefined' && value instanceof FormData) return '[FormData]';
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      output[key] = sensitiveKeyPattern.test(key) ? '[REDACTED]' : redact(nested);
    }
    return output;
  }
  return value;
}

function parseRequestBody(body: RequestInit['body']): unknown {
  if (body === undefined || body === null) return undefined;
  if (typeof body !== 'string') return redact(body);

  try {
    return redact(JSON.parse(body));
  } catch {
    return body;
  }
}

function safeHeaders(headers: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      sensitiveKeyPattern.test(key) ? '[REDACTED]' : value,
    ]),
  );
}

function summarizePayload(value: unknown): unknown {
  if (Array.isArray(value)) return { type: 'array', count: value.length };
  if (value && typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    return { type: 'object', keys: keys.slice(0, 12), keyCount: keys.length };
  }
  return value;
}

function apiLog(kind: 'request' | 'response' | 'error', id: number, payload: Record<string, unknown>) {
  if (!__DEV__) return;

  const prefix = kind === 'request'
    ? `[API → #${id}]`
    : kind === 'response'
      ? `[API ← #${id}]`
      : `[API ✕ #${id}]`;

  if (kind === 'error') console.error(prefix, payload);
  else console.log(prefix, payload);
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const id = ++requestSequence;
  const startedAt = Date.now();
  const method = (options.method ?? 'GET').toUpperCase();
  const [token, orgId] = await Promise.all([sessionStorage.getToken(), sessionStorage.getOrgId()]);
  const headers: Record<string, string> = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (orgId) headers['x-org-id'] = orgId;

  const url = `${env.apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  apiLog('request', id, {
    method,
    endpoint,
    url,
    headers: safeHeaders(headers),
    body: LOG_API_BODIES ? parseRequestBody(options.body) : options.body ? '[BODY]' : undefined,
  });

  let response: Response;
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    // Always fetch with our controller so the request-level timeout remains
    // effective even when a caller also provides an AbortSignal. Caller aborts
    // are bridged into the same controller above.
    response = await fetch(url, { ...options, headers, signal: controller.signal });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    const callerAborted = Boolean(options.signal?.aborted);
    apiLog('error', id, {
      method,
      endpoint,
      url,
      durationMs: Date.now() - startedAt,
      type: callerAborted ? 'ABORTED' : timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }

  const contentType = response.headers.get('content-type');
  let data: unknown;
  try {
    data = contentType?.includes('application/json') ? await response.json() : await response.text();
  } catch (error) {
    apiLog('error', id, {
      method,
      endpoint,
      url,
      status: response.status,
      statusText: response.statusText,
      durationMs: Date.now() - startedAt,
      type: 'RESPONSE_PARSE_ERROR',
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
    throw error;
  }

  const durationMs = Date.now() - startedAt;

  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'message' in data
      ? String((data as Record<string, unknown>).message)
      : `Request failed with status ${response.status}`;

    apiLog('error', id, {
      method,
      endpoint,
      url,
      status: response.status,
      statusText: response.statusText,
      durationMs,
      response: LOG_API_BODIES ? redact(data) : summarizePayload(data),
    });

    throw new ApiError(response.status, message, data);
  }

  apiLog('response', id, {
    method,
    endpoint,
    url,
    status: response.status,
    statusText: response.statusText,
    durationMs,
    response: LOG_API_BODIES ? redact(data) : summarizePayload(data),
  });

  if (typeof data === 'object' && data !== null && 'success' in data && 'data' in data) {
    return (data as { data: T }).data;
  }
  return data as T;
}
