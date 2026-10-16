import { test, expect } from './fixtures'

/**
 * Regression test for the UI-freeze bug: rapid sidebar clicks accumulated
 * zombie fetches that filled the browser's 6-connection pool. The fix
 * aborts in-flight requests on nav. This test rapidly clicks sidebar
 * items with no waits and asserts the final destination still becomes
 * interactive within a reasonable budget.
 */
test('rapid sidebar nav does not freeze the UI', async ({ authedPage: page }) => {
  await page.goto('/dashboard')
  await expect(page.getByRole('main').getByRole('heading', { name: /dashboard/i })).toBeVisible()

  const routes = [
    '/members',
    '/memberships',
    '/attendance',
    '/trainers',
    '/leads',
    '/payments',
    '/expenses',
    '/inventory',
    '/equipment',
    '/reports',
  ]

  // Spam clicks with no awaits — stresses the fetch cancellation path.
  for (const to of routes) {
    const link = page.locator(`aside a[href="${to}"]`).first()
    await link.click({ noWaitAfter: true, force: true })
  }

  // After the storm, land on a known page and confirm it actually renders.
  await page.goto('/members')
  await expect(page.getByRole('main').getByRole('heading', { name: /members/i })).toBeVisible({
    timeout: 15_000,
  })
  // The page should be interactive (no stuck spinner).
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 15_000 })
})

test('reports tabs switch cleanly under rapid clicks', async ({ authedPage: page }) => {
  await page.goto('/reports')
  await expect(page.getByRole('main').getByRole('heading', { name: /reports/i })).toBeVisible()

  const tabs = ['overview', 'members', 'memberships', 'revenue', 'attendance', 'expenses', 'leads']
  for (const label of tabs) {
    const btn = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') })
    await btn.click({ noWaitAfter: true, force: true })
  }

  // End on 'overview' and ensure it loads without errors.
  await page.getByRole('button', { name: /^overview$/i }).click()
  await expect(page.getByText(/Revenue/i).first()).toBeVisible({ timeout: 15_000 })
})
