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
const EXTERNAL_BASE_URL = process.env.PLAYWRIGHT_BASE_URL;
const BASE_URL = EXTERNAL_BASE_URL || `http://localhost:${PORT}`;

// PW_CHROMIUM_PATH — the same escape hatch tools/validate-lesson-boot.mjs and
// tools/validate-lesson-visibility.mjs already honour, and for the same reason:
// when Playwright's own download is absent or its build number does not match
// the installed @playwright/test, EVERY spec fails at browserType.launch with
// "Executable doesn't exist at …/chromium_headless_shell-<n>". That failure is
// indistinguishable, in a results list, from every spec genuinely breaking — a
// whole run of red that says nothing about the code. It cost a wrong reading of
// this suite once already (a base-vs-head comparison where both sides failed to
// launch, so the diff was empty for a reason that had nothing to do with either
// commit). Opt-in only: unset, Playwright resolves its browser exactly as before.
const CHROMIUM_PATH = process.env.PW_CHROMIUM_PATH;

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
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(CHROMIUM_PATH ? { launchOptions: { executablePath: CHROMIUM_PATH } } : {}),
      },
    },
  ],
  // Build once, then serve the static dist on the contract port. `vite preview`
  // serves the production build; `--strictPort` makes a port clash fail loudly
  // instead of silently picking another port.
  webServer: EXTERNAL_BASE_URL
    ? undefined
    : {
        command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
