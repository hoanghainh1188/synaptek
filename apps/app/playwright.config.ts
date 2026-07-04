import { defineConfig, devices } from "@playwright/test";

// E2E web. CI: serve bản export TĨNH `dist/` (server zero-dep có SPA fallback mirror Vercel) — tránh dev
// server `expo start --web` bundle JIT chậm + từng rò rỉ bộ nhớ → OOM (D53). CI job phải `build:web`
// TRƯỚC (cả 2 job đều build: verify có sẵn bước build; e2e-auth thêm bước build). Local: giữ dev server
// (DX nhanh, reuse server đang chạy). Cùng port 8081. Local mô phỏng CI: `CI=1 npm run e2e:static`.
const CI = !!process.env.CI;
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: "http://localhost:8081", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: CI ? "npm run serve:dist" : "npm run web",
    url: "http://localhost:8081",
    reuseExistingServer: !CI,
    // Dev server bundle lần đầu chậm → timeout rộng; serve tĩnh gần như tức thì.
    timeout: 240_000,
  },
});
