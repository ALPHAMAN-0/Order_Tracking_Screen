import { expectNoHorizontalOverflow, expect, fixClock, test } from './fixtures';

test.beforeEach(async ({ page }) => fixClock(page));

test('delivered but not received → report → investigation persists → demo reset', async ({
  page,
}) => {
  await page.goto('/orders/SW-40107');
  await page.getByRole('button', { name: 'I didn’t receive it' }).click();

  const sheet = page.getByRole('dialog');
  await expect(sheet).toHaveAccessibleName('Before you report');
  await expect(sheet).toContainText('The carrier marked this delivered today at 12:14 PM');
  await expectNoHorizontalOverflow(page);
  await sheet.getByRole('button', { name: 'It’s still missing' }).click();

  await sheet.getByRole('radio', { name: /Nothing arrived/ }).check();
  await sheet.getByLabel('Anything else? (optional)').fill('Checked with reception.');
  await sheet.getByRole('button', { name: 'Submit report' }).click();
  await expect(sheet).toHaveAccessibleName('Report submitted');
  const caseId = (await sheet.getByText(/^CASE-[A-Z0-9]{6}$/).textContent())!;
  await sheet.getByRole('button', { name: 'Done' }).click();
  await expect(sheet).toBeHidden();

  const banner = page.getByRole('heading', { name: `Investigation open · ${caseId}` });
  await expect(banner).toBeFocused();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('We’re looking into it');

  await page.reload();
  await expect(page.getByRole('heading', { name: `Investigation open · ${caseId}` })).toBeVisible();

  await page.locator('[data-demo-switcher]').click();
  await page.getByRole('button', { name: 'Reset demo data' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Delivered today');
});

test('significant delay → cancel with refund', async ({ page }) => {
  await page.goto('/orders/SW-39215');
  await page.getByRole('button', { name: 'Request refund or cancel' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByRole('radio', { name: /Cancel and refund ৳12,480/ }).check();
  await sheet.getByRole('button', { name: 'Confirm' }).click();
  await expect(sheet).toHaveAccessibleName('Cancellation requested');
  await sheet.getByRole('button', { name: 'Done' }).click();
  await expect(sheet).toBeHidden();
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'Cancellation requested' }),
  ).toBeFocused();
  await expect(page.getByRole('button', { name: 'Request refund or cancel' })).toHaveCount(0);
});

test('support sheet: Esc and backdrop close it, focus returns, links are prefilled', async ({
  page,
}) => {
  await page.goto('/orders/SW-39870');
  await expect(page.getByRole('heading', { level: 1, name: 'Running late' })).toBeVisible();
  const help = page.getByRole('button', { name: 'Help' });
  await help.click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toHaveAccessibleName('How can we help?');
  await expect(sheet.getByRole('button', { name: 'Delayed delivery' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(sheet.getByRole('link', { name: /Call/ })).toHaveAttribute(
    'href',
    'tel:+8801000123456',
  );
  await expect(sheet.getByRole('link', { name: /Email us/ })).toHaveAttribute(
    'href',
    /^mailto:care@haatbox\.example\?subject=Order%20%23SW-39870/,
  );
  await expectNoHorizontalOverflow(page);

  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(help).toBeFocused();

  await help.click();
  await page.mouse.click(200, 40); // backdrop above the sheet
  await expect(sheet).toBeHidden();
});

test('mock chat replies in context', async ({ page }) => {
  await page.goto('/orders/SW-39870');
  await page.getByRole('button', { name: 'Ask about this delay' }).click();
  await page.getByRole('button', { name: /Live chat/ }).click();
  const log = page.getByRole('log');
  await expect(log).toContainText('I’m sorry order #SW-39870 is running late');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(log).toContainText('flagged your parcel as a priority');
});

test('notify toggle persists across reloads', async ({ page }) => {
  await page.goto('/orders/SW-40290');
  const toggle = page.getByRole('switch', { name: 'Notify me when tracking is live' });
  await toggle.click();
  await expect(page.getByRole('status').filter({ hasText: 'tracking goes live' })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('switch', { name: 'Notify me when tracking is live' }),
  ).toHaveAttribute('aria-checked', 'true');
});

test('order details sheet shows totals and address', async ({ page }) => {
  await page.goto('/orders/SW-40211');
  await page.getByRole('button', { name: 'View order details' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toHaveAccessibleName('Order details');
  await expect(sheet).toContainText('Total৳3,360');
  await expect(sheet).toContainText('Card •••• 4242');
  await expectNoHorizontalOverflow(page);
});
