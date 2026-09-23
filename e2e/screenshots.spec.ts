import { expect, fixClock, test } from './fixtures';

// Run with `npm run screenshots` — writes README images at a pinned time.
const PAGES = [
  ['home', '/'],
  ['on-track', '/orders/SW-40211'],
  ['running-late', '/orders/SW-39870'],
  ['significantly-delayed', '/orders/SW-39215'],
  ['not-received', '/orders/SW-40107'],
  ['tracking-pending', '/orders/SW-40290'],
] as const;

test.describe('@screens', () => {
  test.beforeEach(async ({ page }) => fixClock(page));

  for (const [name, path] of PAGES) {
    test(name, async ({ page }, info) => {
      await page.goto(path);
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await page.locator('[data-demo-switcher]').evaluate((el) => (el.style.visibility = 'hidden'));
      await page.screenshot({ path: `docs/screenshots/${name}-${info.project.name}.png` });
    });
  }

  test('report-flow', async ({ page }, info) => {
    await page.goto('/orders/SW-40107');
    await page.getByRole('button', { name: 'I didn’t receive it' }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `docs/screenshots/report-flow-${info.project.name}.png` });
  });

  test('support-sheet', async ({ page }, info) => {
    await page.goto('/orders/SW-39870');
    await page.getByRole('button', { name: 'Help' }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `docs/screenshots/support-sheet-${info.project.name}.png` });
  });
});
