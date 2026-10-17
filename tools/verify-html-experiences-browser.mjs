// Representative student HTML smoke check. Run against `npm run dev` or preview:
// node tools/verify-html-experiences-browser.mjs http://localhost:4199
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { preview } from "vite";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const server = process.argv[2]
  ? null
  : await preview({ root: REPO_ROOT, preview: { host: "127.0.0.1", port: 0, strictPort: true } });
const base = process.argv[2] || `http://127.0.0.1:${server.httpServer.address().port}`;
const out = "/tmp/eduwonderlab-html-browser";
mkdirSync(out, { recursive: true });
const routes = [
  ["launcher", "/curriculum/student-launch/?lesson=4-1", "#mission-stages li"],
  ["lesson", "/lessons/4-1/", "#app"],
  ["worksheet", "/lessons/4-1/worksheet.html", ".ws-page"],
  ["homework", "/lessons/4-1/homework.html", "h1"],
  ["practice", "/lessons/4-1-group1/practice.html", "h1"],
  ["lab", "/curriculum/learning-labs/hundred-square-studio/", "#tab-investigate"],
  ["misconception", "/curriculum/almost-right-lab/", "h1"],
  ["fluency", "/curriculum/fluency/", "#fluencyHeroHeading"],
  ["game", "/curriculum/class-boss/", "h1"],
];
let browser;
const results = [];
try {
  browser = await chromium.launch({ headless: true });
  for (const width of [1365, 1024, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      serviceWorkers: "block",
      reducedMotion: "reduce",
    });
    for (const [name, path, marker] of routes) {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const response = await page.goto(base + path, { waitUntil: "domcontentloaded" });
      assert.equal(response?.status(), 200, `${name} HTTP response`);
      await page.locator(marker).first().waitFor({ timeout: 15000 });
      if (name === "worksheet") {
        await page.locator("[data-worksheet-screen]").waitFor({ state: "attached" });
        assert.equal(await page.locator("[data-worksheet-screen]").getAttribute("media"), "screen");
        await page.waitForFunction(() => {
          const sheet = document.querySelector("[data-worksheet-screen]");
          const stem = document.querySelector(".ws-stem");
          return sheet?.sheet && stem && Number.parseFloat(getComputedStyle(stem).fontSize) >= 16;
        });
        assert.ok(
          Number.parseFloat(
            await page
              .locator(".ws-stem")
              .first()
              .evaluate((el) => getComputedStyle(el).fontSize),
          ) >= 16,
        );
      }
      if (name === "launcher") assert.equal(await page.locator("#mission-stages li").count(), 4);
      if (name === "misconception") {
        const guidance = page.locator("details.teacher-note");
        assert.equal(
          await guidance.getAttribute("open"),
          null,
          "teacher guidance starts collapsed",
        );
        await guidance.locator("summary").focus();
        await page.keyboard.press("Enter");
        await guidance.locator(".note-box").waitFor({ state: "visible" });
        await page.keyboard.press("Enter");
      }
      if (name === "lab") {
        await page.locator("#tab-investigate").click();
        await page.locator("#panel-investigate .model-workspace").first().waitFor();
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: false });
      results.push({
        name,
        width,
        overflow,
        pageErrors: errors,
        axe: axe.violations.map((v) => v.id),
      });
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
}
console.log(JSON.stringify(results, null, 2));
assert.equal(
  results.filter((r) => r.overflow || r.pageErrors.length).length,
  0,
  "representative HTML pages have no overflow or runtime errors",
);
assert.equal(
  results.filter((r) => r.axe.length).length,
  0,
  "representative HTML pages have no sampled automated accessibility violations",
);
