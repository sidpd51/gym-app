// Centralized env config.
// VITE_API_BASE_URL is intentionally empty in Docker — nginx proxies /api/* to the backend.
// Set it in .env.local only when running the frontend outside Docker (npm run dev).
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const
