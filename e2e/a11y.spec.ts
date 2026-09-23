import AxeBuilder from '@axe-core/playwright';
import { expect, fixClock, test } from './fixtures';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function audit(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
  ).toEqual([]);
}

test.beforeEach(async ({ page }) => fixClock(page));

for (const path of [
  '/',
  '/orders/SW-40211',
  '/orders/SW-39870',
  '/orders/SW-39215',
  '/orders/SW-40107',
  '/orders/SW-40290',
]) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    await audit(page);
  });
}

test('axe: dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  for (const path of ['/orders/SW-39870', '/orders/SW-39215']) {
    await page.goto(path);
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    await audit(page);
  }
});

test('axe: open sheets', async ({ page }) => {
  await page.goto('/orders/SW-40107');
  await page.getByRole('button', { name: 'I didn’t receive it' }).click();
  await page.getByRole('button', { name: 'It’s still missing' }).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('What happened?');
  await audit(page);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('How can we help?');
  await audit(page);
});

test('reduced motion removes sheet transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/orders/SW-40211');
  await page.getByRole('button', { name: 'Help' }).click();
  const duration = await page
    .locator('dialog[open] .sheet-panel')
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(duration).toBe('0s');
});
