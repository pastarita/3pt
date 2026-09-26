/**
 * Capture suite config. See docs/17-ui-capture.md for the conventions.
 * Chromium only: the iPhone project keeps iPhone size, touch and user agent, but runs in Chromium
 * so no WebKit download is needed. @playwright/test is pinned to 1.61.1 to match the browser build
 * already in ~/Library/Caches/ms-playwright (chromium-1228).
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.CAPTURE_PORT ?? 4317);

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  reporter: [['list']],
  globalTeardown: './e2e/teardown.ts',
  use: { baseURL: `http://127.0.0.1:${PORT}/`, colorScheme: 'light', reducedMotion: 'reduce', locale: 'en-US', timezoneId: 'America/New_York' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'iphone', use: { ...devices['iPhone 15'], browserName: 'chromium' } },
  ],
  webServer: { command: `npx vite build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`, url: `http://127.0.0.1:${PORT}/`, reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
