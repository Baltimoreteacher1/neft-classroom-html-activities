// Shared Playwright harness for Family Math 2.0 browser suites: serves the source tree with Vite, collects console
// and network problems, and opens pages at a chosen viewport, language, profile and clean storage.
import { chromium } from "playwright";
import { createServer } from "vite";

export const WIDTHS = [320, 375, 390, 768, 1024, 1440];
const FAMILY = "/math/fluency-lab/family";

export async function launch() {
  const server = await createServer({
    root: new URL("../../", import.meta.url).pathname,
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0 },
  });
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  const browser = await chromium.launch({ headless: true });
  const problems = [];
  return {
    base,
    problems,
    // A new isolated context: empty storage, chosen viewport, optional touch emulation and reduced motion.
    async context({ width = 1024, height = 800, touch = false, locale = "en-US" } = {}) {
      const context = await browser.newContext({
        viewport: { width, height },
        hasTouch: touch,
        isMobile: touch,
        locale,
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      context.on("page", (page) => {
        page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
        page.on("console", (message) => {
          if (message.type() === "error") problems.push(`console: ${message.text()}`);
        });
        page.on("requestfailed", (request) => problems.push(`requestfailed: ${request.url()}`));
        page.on("response", (response) => {
          if (response.status() >= 400 && !response.url().includes("favicon"))
            problems.push(`http ${response.status()}: ${response.url()}`);
        });
      });
      return context;
    },
    url: (path) => `${base}${FAMILY}/${path}`,
    play(params) {
      const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
      return `${base}${FAMILY}/play.html?${query}`;
    },
    async close() {
      await browser.close();
      await server.close();
    },
  };
}

export const hasOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
export const smallTargets = (page) =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll(
        "button, a[href], select, input:not([type=hidden]), [role=button]",
      ),
    ]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        const v = r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden";
        return v && (r.width < 44 || r.height < 44) && !e.closest("[hidden]");
      })
      .map(
        (e) =>
          `${e.tagName.toLowerCase()}:${(e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 24)}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`,
      ),
  );

// Read the live round from the shell's test seam.
export const currentRound = (page) =>
  page.evaluate(() => JSON.parse(JSON.stringify(window.__fm2?.round ?? null)));

export function assertClean(problems, label = "") {
  const real = problems.filter((p) => !/ERR_ABORTED|web-vitals|favicon/.test(p));
  if (real.length) throw new Error(`${label} browser problems:\n${real.slice(0, 8).join("\n")}`);
}
