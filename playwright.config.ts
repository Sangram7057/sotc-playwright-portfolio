import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.SOTC_BASE_URL || 'https://www.sotc.in';
const outputDir = process.env.PLAYWRIGHT_OUTPUT_DIR || 'test-results';
const allureResultsDir = process.env.ALLURE_RESULTS_DIR || 'allure-results';

export default defineConfig({
  testDir: './tests',
  outputDir,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['allure-playwright', { outputFolder: allureResultsDir }],
  ],
  use: {
    baseURL,
    headless: true,
    ignoreHTTPSErrors: true,
    navigationTimeout: 45_000,
    actionTimeout: 20_000,
    screenshot: 'on',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
});
