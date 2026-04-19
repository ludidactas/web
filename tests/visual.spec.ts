import { test, expect } from '@playwright/test'

const routes = ['/', '/identidad']

for (const route of routes) {
  test(`visual stability: ${route}`, async ({ page }) => {
    await page.goto(route)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot({
      fullPage: true,
      animations: 'disabled',
    })
  })
}
