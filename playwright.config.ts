import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end smoke tests run against the web build, which is a dev preview of
 * the same screens the phone shows. They are not a substitute for testing on
 * a device, but they catch a broken critical path in CI in about a minute.
 */
export default defineConfig({
  testDir: './tests/e2e',
  // The first Metro bundle is slow; these are generous on purpose.
  timeout: 180_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8099',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx expo start --web --port 8099',
    url: 'http://127.0.0.1:8099',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
