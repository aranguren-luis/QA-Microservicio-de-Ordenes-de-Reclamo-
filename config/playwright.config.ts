import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '../tests',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: '../reports/data/test-results',
  reporter: [
    ['list'],
    ['json', { outputFile: '../reports/data/results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://api.qa.mock.com',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  },
});
