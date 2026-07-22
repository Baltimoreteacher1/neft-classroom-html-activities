/**
 * Playwright config for the Neft Teacher lesson platform tests.
 *
 * The repo already declares the `e2e` script (`playwright test`) and depends on
 * `@axe-core/playwright`. This config wires up a single Chromium project and a
 * `webServer` that builds + serves the static `dist/` output on port 4178 (the
 * reference lesson is at /math/unit-1/1-1-math-is-mine/).
 *
 * NOTE: `@playwright/test` must be installed (`npm i -D @playwright/test` +
 * `npx playwright install chromium`). It is the peer of the already-present
 * `@axe-core/playwright`; this config does not add it for you.
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = 4178;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    [process.env.CI ? "github" : "list"],
    ["json", { outputFile: "playwright-results.json" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Monster Math Academy registers a PWA service worker whose fetch
    // handler can stall reload navigations under parallel test load; no
    // spec exercises SW behavior, so keep tests deterministic without it.
    serviceWorkers: "block",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Build once, then serve the static dist on the contract port. `vite preview`
  // serves the production build; `--strictPort` makes a port clash fail loudly
  // instead of silently picking another port.
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
