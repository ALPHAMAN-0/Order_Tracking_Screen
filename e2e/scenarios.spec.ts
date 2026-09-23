import { expectNoHorizontalOverflow, expect, test } from './fixtures';
import { SCENARIOS } from './scenarios';

// Real clock on purpose: proves the now-relative fixtures hold at any time of day.
for (const s of SCENARIOS) {
  test(`${s.id} renders its scenario clearly`, async ({ page }) => {
    await page.goto(`/orders/${s.id}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(s.headline);
    await expect(page.getByRole('main').getByText(s.pill, { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Help' })).toBeEnabled();
    await expect(
      page.getByRole('list', { name: 'Delivery steps' }).getByRole('listitem'),
    ).toHaveCount(5);
    if (s.primary) await expect(page.getByRole('button', { name: s.primary })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Contact support' }).last()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}

test('home lists every order grouped by progress', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'My orders' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'In progress' }).getByRole('listitem')).toHaveCount(
    4,
  );
  await expect(page.getByRole('region', { name: 'Delivered' }).getByRole('listitem')).toHaveCount(
    2,
  );
  await expectNoHorizontalOverflow(page);
  await page.getByRole('link', { name: /jamdani saree/ }).click();
  await expect(page).toHaveURL(/\/orders\/SW-39870$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Running late' })).toBeVisible();
});
