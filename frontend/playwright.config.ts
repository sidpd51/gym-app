import { defineConfig, devices } from '@playwright/test'

const CI = !!process.env.CI
const FRONTEND_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'
const BACKEND_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080'

/**
 * E2E tests assume MySQL + backend + frontend are all reachable.
 *
 * Local dev:
 *   docker compose -f ../docker-compose.dev.yml up -d
 *   (seed owner if first run — see README)
 *   cd ../backend-fastify && npm run dev   # :8080
 *   cd ../frontend && npm run dev           # :5173
 *   cd ../frontend && npm run test:e2e
 *
 * CI starts everything via the workflow and sets CI=1.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: !CI,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: CI ? 'retain-on-failure' : 'off',
  },

  projects: [
    // Runs once; produces playwright/.auth/user.json
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    // Auth spec exercises login flows — must start signed-out.
    {
      name: 'auth',
      testMatch: /auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },
    },

    // Everything else reuses the saved session.
    {
      name: 'chromium',
      testIgnore: /auth\.(spec|setup)\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],

  // CI starts services itself; locally users already run dev servers.
  webServer: CI
    ? undefined
    : {
        command: 'echo "assuming frontend+backend are running"',
        url: FRONTEND_URL,
        reuseExistingServer: true,
        timeout: 5_000,
      },

  // Expose the backend URL to tests via process.env.
  metadata: { BACKEND_URL },
})
