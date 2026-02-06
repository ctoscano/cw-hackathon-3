import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  timeout: 120000, // 2 minutes default timeout for tests with LLM generation
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3020",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10000, // 10 seconds for individual actions
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Run dev server before starting tests */
  // Uncomment if you want Playwright to auto-start the dev server
  // webServer: {
  //   command: "pnpm dev",
  //   url: "http://localhost:3020",
  //   reuseExistingServer: !process.env.CI,
  // },
});
