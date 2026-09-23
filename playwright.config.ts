import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  grepInvert: process.env.SCREENSHOTS ? undefined : /@screens/,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    // A non-Dhaka browser zone proves every date is formatted for Asia/Dhaka explicitly.
    timezoneId: 'America/New_York',
    locale: 'en-US',
  },
  projects: [
    {
      name: 'mobile-360',
      use: { ...devices['Pixel 7'], viewport: { width: 360, height: 780 } },
    },
    {
      name: 'mobile-430',
      use: { ...devices['Pixel 7'], viewport: { width: 430, height: 932 } },
    },
  ],
  webServer: {
    command: isCI ? `npm run start -- -p ${PORT}` : `npm run build && npm run start -- -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
