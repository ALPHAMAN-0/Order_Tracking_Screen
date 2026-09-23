import { expect, test } from './fixtures';

test('loading state is announced and holds', async ({ page }) => {
  await page.goto('/orders/SW-40211?simulate=loading');
  const status = page.getByRole('status').filter({ hasText: 'Loading your order' });
  await expect(status).toHaveAttribute('aria-busy', 'true');
  await page.waitForTimeout(1500);
  await expect(status).toBeVisible();
});

test('error state offers retry that recovers, and support stays reachable', async ({ page }) => {
  await page.goto('/orders/SW-40211?simulate=error');
  const alert = page.getByRole('alert').filter({ hasText: 'We couldn’t load tracking' });
  await expect(alert).toBeVisible();
  await expect(page.getByRole('button', { name: 'Help' })).toBeEnabled();
  await alert.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Arriving tomorrow' })).toBeVisible();
});

test.describe('unknown order', () => {
  // The browser logs the 404 document response itself; that one is expected.
  test.use({ allowedConsole: [/status of 404/] });

  test('returns a real 404 with a way back', async ({ page }) => {
    const response = await page.goto('/orders/SW-00000');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'We can’t find that order' })).toBeVisible();
    await page.getByRole('link', { name: 'Go to my orders' }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test('simulated not-found shows the same friendly state', async ({ page }) => {
  await page.goto('/orders/SW-40211?simulate=notfound');
  await expect(page.getByRole('heading', { name: 'We can’t find that order' })).toBeVisible();
});

test('empty order list', async ({ page }) => {
  await page.goto('/?simulate=empty');
  await expect(page.getByRole('heading', { name: 'No orders yet' })).toBeVisible();
});
