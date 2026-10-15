import { test as base, expect, type Page } from '@playwright/test'

export const SEED_EMAIL = process.env.E2E_EMAIL ?? 'owner@example.com'
export const SEED_PASSWORD = process.env.E2E_PASSWORD ?? 'ChangeMe123!'

/** Logs in via the UI. The resulting cookie session is used for subsequent nav. */
export async function loginAs(page: Page, email = SEED_EMAIL, password = SEED_PASSWORD) {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

/** A test fixture that starts already-authenticated. */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await loginAs(page)
    await use(page)
  },
})

export { expect }
