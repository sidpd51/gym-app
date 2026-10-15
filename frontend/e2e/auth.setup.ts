import { test as setup, expect } from '@playwright/test'
import { SEED_EMAIL, SEED_PASSWORD } from './fixtures'

/**
 * Logs in once and persists the session cookie. All non-auth tests reuse this
 * via the `storageState` on the chromium project — avoiding the login
 * rate-limit (5/min/IP) that otherwise fires for ~15 parallel test logins.
 */
export const STORAGE_STATE = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill(SEED_EMAIL)
  await page.locator('#password').fill(SEED_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await page.context().storageState({ path: STORAGE_STATE })
})
