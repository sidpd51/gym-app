// Centralized env config. Validates required vars at startup.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

if (!apiBaseUrl && import.meta.env.PROD) {
  console.warn('[env] VITE_API_BASE_URL is not set in production')
}

export const env = {
  apiBaseUrl,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const
