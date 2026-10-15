// CSRF token manager for gorilla/csrf.
//
// Backend contract (internal/app/app.go):
// - Cookie: `gym_csrf`, Path=/, HttpOnly, SameSite=Strict
// - Mutating requests (POST/PATCH/PUT/DELETE) under /api/v1 need
//   `X-CSRF-Token` header with value from GET /api/v1/csrf-token.
// - Login/logout are outside CSRF; /csrf-token itself is public.
// - Cookie is sent automatically via `credentials: include`.
//
// This module caches the token in memory and de-duplicates concurrent fetches.
import { env } from '../config/env'

let cachedToken: string | null = null
let inflight: Promise<string | null> | null = null

function buildUrl(path: string): string {
  if (!env.apiBaseUrl) return path
  try {
    return new URL(path, env.apiBaseUrl).toString()
  } catch {
    return path
  }
}

async function fetchToken(): Promise<string | null> {
  try {
    const res = await fetch(buildUrl('/api/v1/csrf-token'), {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { token?: string }
    if (data.token) {
      cachedToken = data.token
      return cachedToken
    }
    return null
  } catch {
    return null
  }
}

export function getCachedCsrfToken(): string | null {
  return cachedToken
}

export function setCachedCsrfToken(token: string | null): void {
  cachedToken = token
}

export function ensureCsrfToken(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh && cachedToken) return Promise.resolve(cachedToken)
  if (!forceRefresh && inflight) return inflight
  inflight = fetchToken().finally(() => {
    inflight = null
  })
  return inflight
}

export function clearCsrfToken(): void {
  cachedToken = null
  inflight = null
}
