import { test, expect } from './fixtures'

/**
 * Minimal smoke: visit each top-level page and assert its heading renders
 * and no 5xx responses leaked to the browser. Fast canary for deploys.
 */
const PAGES: Array<[path: string, heading: RegExp]> = [
  ['/dashboard', /dashboard/i],
  ['/members', /members/i],
  ['/memberships', /memberships/i],
  ['/attendance', /attendance/i],
  ['/trainers', /trainers/i],
  ['/leads', /leads/i],
  ['/payments', /payments/i],
  ['/expenses', /expenses/i],
  ['/inventory', /inventory/i],
  ['/equipment', /equipment/i],
  ['/reports', /reports/i],
  ['/notifications', /notifications/i],
]

for (const [path, heading] of PAGES) {
  test(`smoke: ${path} renders`, async ({ authedPage: page }) => {
    const serverErrors: number[] = []
    page.on('response', (r) => {
      if (r.status() >= 500) serverErrors.push(r.status())
    })

    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({
      timeout: 10_000,
    })
    expect(serverErrors, 'no 5xx responses').toEqual([])
  })
}
