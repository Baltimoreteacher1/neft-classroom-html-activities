// Representative student HTML smoke check. Run against `npm run dev` or preview:
// node tools/verify-html-experiences-browser.mjs http://localhost:4199
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
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
  ...[1, 2, 3, 5, 6, 7, 8, 9, 10].map((unit) => [
    `worksheet-unit-${unit}`,
    `/lessons/${unit}-1/worksheet.html`,
    ".ws-page",
  ]),
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
      if (name === "homework") {
        const pathNav = page.getByRole("navigation", { name: "Tonight's path" });
        assert.equal(await pathNav.count(), 1, "homework steps remain a named navigation landmark");
        assert.equal(await page.locator(".homework-tab-bar[role='tablist']").count(), 0);
        const currentTab = page.locator(".homework-tab-btn[aria-current='step']");
        const nextTab = page.locator(".homework-tab-btn:not([hidden])").nth(1);
        const currentId = await currentTab.getAttribute("data-tab");
        const nextId = await nextTab.getAttribute("data-tab");
        await nextTab.click();
        await page.locator(`#hw_panel_${nextId}`).waitFor({ state: "visible" });
        assert.equal(await nextTab.getAttribute("aria-current"), "step");
        assert.equal(await page.locator(`#hw_tab_${currentId}`).getAttribute("aria-current"), null);
      }
      if (name.startsWith("worksheet")) {
        await page.locator("[data-worksheet-screen]").waitFor({ state: "attached" });
        assert.equal(await page.locator("[data-worksheet-screen]").getAttribute("media"), "all");
        await page.locator("[data-worksheet-work]").waitFor();
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
        assert.equal(
          await page.locator(".ws-problem-card").count(),
          await page.locator(".ws-problem-card textarea").count(),
        );
        const reveal = page.locator(".ws-example-reveal").first();
        if (await reveal.count()) {
          await reveal.focus();
          await page.keyboard.press("Enter");
          assert.match(await page.locator(".ws-step-status").first().innerText(), /1 of/);
        }
        if (name === "worksheet") {
          await page.locator("#nsr-launcher").click();
          if (await page.locator("#nsr-start").isVisible())
            await page.locator("#nsr-start").click();
          await page.locator("#nsr-close").click();
          const input = page.locator(".ws-problem-card textarea").first();
          const id = await input.getAttribute("id");
          await input.fill("3/5 = 60/100 = 0.6 = 60%. The whole stays the same.");
          const radio = page.locator(".ws-digital-choice input").first();
          const radioId = await radio.getAttribute("id");
          await radio.check();
          await page.locator("#nsr-launcher").click();
          await page.locator("#nsr-savebtn").click();
          await page.locator("#nsr-close").click();
          await page.reload();
          await page.locator(`#${id}`).waitFor();
          await page.waitForFunction(
            ({ id }) => document.getElementById(id)?.value?.includes("whole stays"),
            { id },
          );
          assert.equal(await page.locator(`#${radioId}`).isChecked(), true);
          const pending = page.waitForEvent("download");
          await page.getByRole("button", { name: "Download my reasoning" }).click();
          const file = await pending;
          const text = readFileSync(await file.path(), "utf8");
          assert.match(text, /whole stays/);
          assert.match(text, /Selected option:/);
          await page.emulateMedia({ media: "print" });
          assert.equal(await page.locator("[data-worksheet-work]").isVisible(), false);
          assert.equal(await page.locator(".ws-example-steps > li").first().isVisible(), true);
          assert.equal(await page.locator(".ws-opts").first().isVisible(), true);
          await page.emulateMedia({ media: "screen" });
        }
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
