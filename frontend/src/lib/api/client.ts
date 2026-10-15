import { ApiError, normalizeError } from './errors'
import { clearCsrfToken, ensureCsrfToken } from './csrf'
import { env } from '../config/env'

type QueryParams = Record<string, string | number | boolean | undefined>

interface RequestOptions {
  params?: QueryParams
  body?: unknown
  /** Extra headers (e.g. for future needs). X-CSRF-Token is handled automatically. */
  headers?: Record<string, string>
  /** Skip CSRF for login/logout which live outside the CSRF middleware. */
  skipCsrf?: boolean
  /** AbortSignal to cancel the in-flight request. */
  signal?: AbortSignal
}

const UNSAFE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

// Paths that bypass CSRF on the backend (mounted outside csrf.Protect).
const CSRF_EXEMPT_PATHS = ['/api/v1/auth/login', '/api/v1/auth/logout']

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(path, env.apiBaseUrl || 'http://localhost')
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }
  // If no real base URL, return just the path with query string
  if (!env.apiBaseUrl) {
    return url.pathname + (url.search ? url.search : '')
  }
  return url.toString()
}

function isCsrfExempt(path: string): boolean {
  return CSRF_EXEMPT_PATHS.some((exempt) => path === exempt || path.endsWith(exempt))
}

async function parseBody<T>(response: Response): Promise<T> {
  // 204 / empty bodies (logout, deletes) have no JSON to parse.
  if (response.status === 204) {
    return undefined as T
  }
  const text = await response.text()
  if (!text) {
    return undefined as T
  }
  try {
    return JSON.parse(text) as T
  } catch {
    // Non-JSON success body: return raw text when caller expects unknown/string.
    return text as unknown as T
  }
}

async function request<T>(method: string, path: string, options?: RequestOptions): Promise<T> {
  const url = buildUrl(path, options?.params)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options?.headers ?? {}),
  }
  const hasBody = options?.body !== undefined
  if (hasBody) {
    headers['Content-Type'] = 'application/json'
  }

  const needsCsrf =
    UNSAFE_METHODS.has(method.toUpperCase()) && !options?.skipCsrf && !isCsrfExempt(path)

  if (needsCsrf) {
    const token = await ensureCsrfToken()
    if (token) {
      headers['X-CSRF-Token'] = token
    }
  }

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: hasBody ? JSON.stringify(options?.body) : undefined,
      signal: options?.signal,
    })
  } catch (err) {
    throw normalizeError(err)
  }

  // One retry: CSRF token may be stale/expired (403). Refresh once and retry.
  if (response.status === 403 && needsCsrf) {
    const token = await ensureCsrfToken(true)
    if (token) {
      try {
        response = await fetch(url, {
          method,
          headers: { ...headers, 'X-CSRF-Token': token },
          credentials: 'include',
          body: hasBody ? JSON.stringify(options?.body) : undefined,
          signal: options?.signal,
        })
      } catch (err) {
        throw normalizeError(err)
      }
    }
  }

  if (response.status === 401) {
    // Session expired/invalid. Clear cached CSRF so next login gets a fresh one.
    clearCsrfToken()
  }

  if (!response.ok) {
    let errorData: { message?: string; code?: string; details?: unknown } = {}
    try {
      errorData = (await response.json()) as typeof errorData
    } catch {
      // ignore parse error, fall back to statusText
    }
    throw new ApiError({
      status: response.status,
      message: errorData.message ?? response.statusText,
      code: errorData.code,
      details: errorData.details,
    })
  }

  return parseBody<T>(response)
}

export const apiClient = {
  get<T>(path: string, params?: QueryParams, options?: Omit<RequestOptions, 'params'>): Promise<T> {
    return request<T>('GET', path, { ...options, params })
  },

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return request<T>('POST', path, { ...options, body })
  },

  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return request<T>('PUT', path, { ...options, body })
  },

  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return request<T>('PATCH', path, { ...options, body })
  },

  delete<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return request<T>('DELETE', path, options)
  },
}
