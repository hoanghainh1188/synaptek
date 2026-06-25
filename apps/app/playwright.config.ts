import { defineConfig, devices } from "@playwright/test";

// E2E web (US1). Dev server Expo web tại :8081 (bundling lần đầu chậm → timeout rộng).
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: "http://localhost:8081", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run web",
    url: "http://localhost:8081",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
