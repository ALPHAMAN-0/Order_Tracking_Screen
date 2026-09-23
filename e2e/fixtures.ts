import { test as base, expect, type Page } from '@playwright/test';

/** Wed 23 Sep 2026, 2:00 PM Dhaka — used where exact dates are asserted. */
export const FIXED_NOW = new Date('2026-09-23T08:00:00Z');

/** Fails any test that logs a console error, page error or hydration warning. */
export const test = base.extend<{ allowedConsole: RegExp[]; consoleGuard: void }>({
  allowedConsole: [[], { option: true }],
  consoleGuard: [
    async ({ page, allowedConsole }, use) => {
      const problems: string[] = [];
      page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
      page.on('console', (msg) => {
        const text = msg.text();
        if (allowedConsole.some((re) => re.test(text))) return;
        if (msg.type() === 'error' || /hydrat/i.test(text)) problems.push(`${msg.type()}: ${text}`);
      });
      await use();
      expect(problems, 'console errors / hydration warnings').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function fixClock(page: Page) {
  await page.clock.setFixedTime(FIXED_NOW);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll('body *')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > width + 1 && getComputedStyle(el).position !== 'fixed';
      })
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
    return { scroll: document.documentElement.scrollWidth - width, offenders };
  });
  expect(
    overflow.scroll,
    `horizontal overflow from: ${overflow.offenders.join(', ')}`,
  ).toBeLessThanOrEqual(0);
}
