import { env } from '@/config/env';

/**
 * Thin typed fetch wrapper. Every network call in the app goes through here so
 * that auth headers, error shape, and PHI-access logging concerns live in one
 * place rather than being re-implemented per query.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly detail: unknown;

  constructor(status: number, message: string, code?: string, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }
}

/** Session token accessor, set by the auth provider. Kept out of module state
 *  that components can reach directly. */
let tokenProvider: () => string | null = () => null;

/** Called on any 401 from an authenticated request so the auth provider can end the session. */
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export function setTokenProvider(provider: () => string | null): void {
  tokenProvider = provider;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = env.apiBaseUrl.replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function formatDetail(detail: unknown): string | undefined {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (typeof item === 'object' && item !== null ? (item as { msg?: unknown }).msg : undefined))
      .filter((msg): msg is string => typeof msg === 'string');
    return messages.length ? messages.join('; ') : undefined;
  }
  return undefined;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, query } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = tokenProvider();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    signal,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 204) return undefined as T;

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload: unknown = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // FastAPI errors are `{ detail, code?, request_id? }`; `detail` is a string
    // for domain errors and an array of `{ msg, loc }` for 422 validation errors.
    const shape = (typeof payload === 'object' && payload !== null ? payload : {}) as {
      detail?: unknown;
      message?: string;
      code?: string;
    };
    const message =
      typeof payload === 'string'
        ? payload || response.statusText
        : formatDetail(shape.detail) ?? shape.message ?? response.statusText;

    // A 401 on a request that carried a token means the session is gone. Login
    // itself also returns 401 for bad credentials, but it sends no token.
    if (response.status === 401 && token) unauthorizedHandler?.();

    throw new ApiError(response.status, message, shape.code, shape.detail);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
