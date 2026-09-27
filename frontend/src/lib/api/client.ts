import { ApiError, normalizeError } from './errors'
import { env } from '../config/env'

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
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

async function request<T>(
  method: string,
  path: string,
  options?: {
    params?: Record<string, string | number | boolean | undefined>
    body?: unknown
  },
): Promise<T> {
  const url = buildUrl(path, options?.params)
  let response: Response

  try {
    response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch (err) {
    throw normalizeError(err)
  }

  if (!response.ok) {
    let errorData: { message?: string; code?: string; details?: unknown } = {}
    try {
      errorData = (await response.json()) as typeof errorData
    } catch {
      // ignore parse error
    }
    throw new ApiError({
      status: response.status,
      message: errorData.message ?? response.statusText,
      code: errorData.code,
      details: errorData.details,
    })
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return request<T>('GET', path, { params })
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('POST', path, { body })
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('PUT', path, { body })
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('PATCH', path, { body })
  },

  delete<T>(path: string): Promise<T> {
    return request<T>('DELETE', path)
  },
}
