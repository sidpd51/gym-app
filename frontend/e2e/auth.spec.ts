import { test, expect, loginAs, SEED_EMAIL } from './fixtures'

test('login with valid credentials lands on dashboard', async ({ page }) => {
  await loginAs(page)
  await expect(page).toHaveURL(/\/dashboard/)
})

test('login with invalid credentials shows an error', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill(SEED_EMAIL)
  await page.locator('#password').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByText(/invalid email or password/i)).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})

test('visiting a protected route when signed out redirects to login', async ({ page }) => {
  await page.goto('/members')
  await expect(page).toHaveURL(/\/login/)
})
