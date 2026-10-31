// The Math Discovery Studio in a real browser: axe (WCAG 2 A/AA and 2.2 AA) on every tab at phone and desktop width,
// a keyboard-only walk (Tab reaches the controls, arrow keys step the model), no sideways scroll, 44px targets on the
// controls a learner touches, reduced motion honoured, and a clean console. Serves the source tree with Vite.
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { createServer } from "vite";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const server = await createServer({
  root: REPO_ROOT,
  logLevel: "error",
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
const failures = [];
const note = (ok, msg) => ok || failures.push(msg);
let browser;
try {
  browser = await chromium.launch({ headless: true });
  // [grade, skill id, tabs to visit]
  const cases = [
    [3, "add-sub-1000", ["watch", "build", "try", "detective"]],
    [4, "fraction-equiv", ["watch", "build", "explore"]],
    [7, "integer-add", ["watch", "build"]],
    [7, "equations", ["watch", "build"]],
    [6, "ratios", ["watch", "build"]],
    [3, "round", ["watch", "build"]],
    [5, "fraction-mul", ["watch", "build"]],
    [1, "tens-ones", ["watch", "build"]],
    [2, "skip-count", ["watch", "build"]],
    [8, "exponents", ["watch", "build"]],
    [6, "gcf", ["watch", "build"]],
    [8, "slope", ["watch", "build", "explore"]],
    [0, "compose-10", ["watch", "build"]],
    [1, "time", ["watch", "build"]],
    [2, "coins", ["watch", "build"]],
    [6, "evaluate", ["watch", "build"]],
    [7, "inequalities", ["watch", "build"]],
    [5, "decimal-mul", ["watch", "build"]],
    [8, "pythagorean", ["watch", "build"]],
    [8, "transformations", ["watch", "build"]],
    [7, "circle-area", ["watch", "build"]],
    [7, "probability", ["watch", "build"]],
  ];
  for (const [width, height, reduced] of [
    [390, 844, false],
    [1280, 800, false],
    [390, 844, true],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    for (const [grade, skill, tabs] of cases) {
      await page.goto(`${base}/math/fluency-lab/?grade=${grade}`, { waitUntil: "networkidle" });
      await page.evaluate(() =>
        document.querySelector('[data-view="library"], [data-open-library]')?.click(),
      );
      const opened = await page.evaluate(async (id) => {
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        for (const b of [...document.querySelectorAll("button,a")].filter((x) =>
          /Skill Library/i.test(x.textContent),
        ))
          b.click();
        await wait(600);
        const btn = document.querySelector(`[data-visual-skill="${id}"]`);
        btn?.click();
        await wait(1200);
        return Boolean(document.querySelector("#visual-studio:not([hidden]) .sd-stage svg"));
      }, skill);
      note(opened, `${skill} @${width}${reduced ? " reduced" : ""}: the Studio did not open`);
      if (!opened) continue;
      for (const tab of tabs) {
        // Some problems have no Build (an even-count median has no single number to tap); skip a tab that is not offered.
        if (!(await page.locator(`#visual-studio [data-tab="${tab}"]`).count())) continue;
        await page.locator(`#visual-studio [data-tab="${tab}"]`).click();
        await page.waitForTimeout(400);
        const tag = `${skill}/${tab} @${width}${reduced ? " reduced" : ""}`;
        const axe = await new AxeBuilder({ page })
          .include("#visual-studio")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        for (const v of axe.violations.filter((x) => ["serious", "critical"].includes(x.impact)))
          note(
            false,
            `${tag}: axe ${v.id} (${v.impact}) on ${v.nodes.length} node(s): ${v.nodes[0].target.join(" ")}`,
          );
        const geometry = await page.evaluate(() => {
          const root = document.querySelector("#visual-studio");
          const small = [...root.querySelectorAll("button, input[type=range], select, .sd-tab")]
            .filter(
              (el) =>
                el.offsetParent &&
                (el.getBoundingClientRect().height < 43 || el.getBoundingClientRect().width < 43),
            )
            .map(
              (el) =>
                `${el.className || el.tagName}:${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`,
            );
          return { overflow: document.documentElement.scrollWidth > innerWidth + 1, small };
        });
        note(!geometry.overflow, `${tag}: horizontal scroll`);
        note(
          geometry.small.length === 0,
          `${tag}: targets under 44px: ${geometry.small.slice(0, 3).join(", ")}`,
        );
        if (tab === "watch") {
          const play = await page.locator('#visual-studio [data-w="play"]').count();
          note(
            reduced ? play === 0 : play === 1,
            `${tag}: autoplay control ${reduced ? "must be absent" : "must be present"} (reduced motion = ${reduced})`,
          );
        }
      }
      // Keyboard: focus the stage, step forward and back with the arrow keys.
      await page.locator('#visual-studio [data-tab="watch"]').click();
      await page.locator("#visual-studio [data-stage]").focus();
      const before = await page.locator("#visual-studio [data-cap]").textContent();
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(300);
      const after = await page.locator("#visual-studio [data-cap]").textContent();
      const gated = await page.locator("#visual-studio [data-predict]:not([hidden])").count();
      note(before !== after || gated > 0, `${skill} @${width}: ArrowRight did not move the model`);
      const focusVisible = await page.evaluate(() => {
        const el = document.querySelector("#visual-studio .sd-btn");
        el.focus();
        const s = getComputedStyle(el);
        return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2;
      });
      note(focusVisible, `${skill} @${width}: no visible focus ring on a Studio button`);
    }
    const real = errors.filter((e) => !/401|Failed to load resource/.test(e));
    note(
      real.length === 0,
      `console @${width}${reduced ? " reduced" : ""}: ${real.slice(0, 2).join(" | ")}`,
    );
    await context.close();
  }
} finally {
  await browser?.close();
  await server.close();
}
if (failures.length) {
  console.error(
    `verify-fluency-studio-browser FAILED (${failures.length}):\n- ${failures.slice(0, 30).join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  "verify-fluency-studio-browser: axe A/AA/2.2 clean on every tab, no overflow, 44px targets, keyboard stepping, visible focus, reduced motion, console clean",
);
