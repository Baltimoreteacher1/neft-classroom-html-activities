#!/usr/bin/env node
/**
 * Runtime check for the Reasoning Studio, in a real browser.
 *
 *   MWB_PAGE_URL=http://127.0.0.1:4499/curriculum/math-workbench/ node tools/math-workbench-reasoning-studio.runtime.mjs
 *
 * Serves from `npm run preview` (the built site) or any static server rooted at
 * the repo. Drives all six steps, the Evidence/teacher round trip, Spanish and
 * docking; runs axe on every step and on the teacher view; checks the phone
 * layout and that nothing throws.
 * (A source-tree static server cannot resolve nt-usage.js's `web-vitals` import;
 * that one unrelated error is ignored.)
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const axeSource = require("node:fs").readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const base = process.env.MWB_PAGE_URL || "http://127.0.0.1:5173/curriculum/math-workbench/";
const browser = await chromium.launch({ headless: true });
const errors = [];
const watch = (page) => {
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message)) errors.push(e.message);
  });
};

async function axe(page, label) {
  await page.evaluate(axeSource);
  const result = await page.evaluate(() =>
    axe.run(document.querySelector("#reasoningStudio"), {
      runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"],
    }),
  );
  assert.deepEqual(
    result.violations.map((v) => `${v.id}: ${v.nodes.length}`),
    [],
    `axe violations on ${label}`,
  );
}

try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  watch(page);
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.removeItem("neft.mathWorkbench.reasoning.v1");
    localStorage.removeItem("neft.mathWorkbench.reasoning.draft");
    localStorage.removeItem("neft.mathWorkbench.reasoning.prefs");
    localStorage.removeItem("nt-teacher-mode");
  });
  await page.reload({ waitUntil: "domcontentloaded" });

  await page.locator("#reasoningStudioBtn").click();
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.field),
    "prompt",
    "focus starts on the first task field",
  );
  await axe(page, "step 1 (first run, with the tour)");
  await page.locator('[data-action="tour-done"]').click();
  await page
    .locator('[data-field="prompt"]')
    .fill("For every 2 cups of juice, use 3 cups of water. Explain the relationship.");
  await page.locator('[data-action="next"]').click();

  await page.locator('[data-action="rep"][data-value="ratio table"]').click();
  await page.locator('[data-action="rep"][data-value="double number line"]').click();
  await page.locator('[data-field="linked.factor"]').fill("5");
  await page.locator('[data-action="stamp"]').click();
  let digest = await page.evaluate(() => window.MathWorkbenchAPI.getBoardDigest());
  assert.equal(
    digest.items.filter((i) => i.filled).length,
    0,
    "stamping alone fills nothing in: the student still has to do the work",
  );
  await axe(page, "step 2");

  // Fill the stamped objects the way a student would, through the board.
  // Page-scope globals of the Workbench's own script, so this goes in as source text.
  await page.evaluate(`(() => {
    const t = state.objects.find((o) => o.type === "ratiotable");
    t.top = ["2", "4", "6", "8"];
    t.bottom = ["3", "6", "9", "12"];
    const d = state.objects.find((o) => o.type === "dblnumline");
    d.top = ["", "2", "4"];
    d.bottom = ["", "3", "6"];
    renderAll();
    persist();
  })()`);
  digest = await page.evaluate(() => window.MathWorkbenchAPI.getBoardDigest());
  assert.equal(digest.items.filter((i) => i.filled).length, 2);

  await page.locator('[data-action="next"]').click();
  await page
    .locator('[data-field="firstDraft"]')
    .fill(
      "For every 2 cups there are 3 cups so I scaled both by 5 because the ratio table matches the double number line.",
    );
  await page.locator('[data-action="analyze"]').click();
  await page.locator(".mwr-signal").waitFor();
  await axe(page, "step 3 with a signal");
  await page.locator('[data-action="next"]').click();
  await axe(page, "step 4");
  await page.locator('[data-action="next"]').click();
  await axe(page, "step 5");
  await page.locator('[data-action="next"]').click();
  await page.getByRole("heading", { name: "6. Evidence of growth" }).waitFor();
  await axe(page, "step 6");

  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("neft.mathWorkbench.reasoning.v1") || "[]"),
  );
  assert.equal(saved.length, 1);
  assert.equal(saved[0].analysis.status, "connected-reasoning-visible");
  assert.ok(saved[0].firstAnalysis, "the first-draft signal is stored as well as the final one");

  // Teacher view is locked for a student, unlocks with the sticky flag, and the round trip works.
  await page.locator("#mwrViewBtn").click();
  await page.getByRole("heading", { name: "Teacher view needs Teacher Mode" }).waitFor();
  await axe(page, "locked teacher view");
  await page.locator("#mwrViewBtn").click();
  await page.getByRole("heading", { name: "6. Evidence of growth" }).waitFor();
  await page.evaluate(() => localStorage.setItem("nt-teacher-mode", "1"));
  await page.locator("#mwrViewBtn").click();
  await page.getByRole("heading", { name: "Teacher view", exact: true }).waitFor();
  await axe(page, "teacher view");
  await page.locator("#mwrViewBtn").click();
  await page.getByRole("heading", { name: "6. Evidence of growth" }).waitFor();

  // Spanish follows the Workbench switch; docking does not trap the board.
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent("mwb:lang", { detail: { lang: "es" } })),
  );
  await page.getByRole("heading", { name: "6. Evidencia de crecimiento" }).waitFor();
  await axe(page, "Spanish step 6");
  await page.locator("#mwrDock").click();
  const dialog = await page.locator(".mwr-dialog").boundingBox();
  assert.ok(dialog && dialog.width <= 1366, "dialog fits the viewport");
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent("mwb:lang", { detail: { lang: "en" } })),
  );

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  watch(mobile);
  await mobile.goto(base, { waitUntil: "domcontentloaded" });
  await mobile.locator("#reasoningStudioBtn").click();
  const box = await mobile.locator(".mwr-dialog").boundingBox();
  assert.ok(box && box.width <= 390 && box.height <= 844, "phone layout fits");
  const overflow = await mobile.evaluate(() => {
    const body = document.querySelector(".mwr-body");
    return body.scrollWidth > body.clientWidth + 1;
  });
  assert.equal(overflow, false, "no sideways scrolling on a phone");
  const continueBox = await mobile.locator('[data-action="next"]').boundingBox();
  assert.ok(
    continueBox && continueBox.height < 60,
    "the Continue button does not wrap into a tall column",
  );
  await axe(mobile, "phone step 1");

  assert.deepEqual(errors, [], "no uncaught errors");
  console.log(
    "✓ Reasoning Studio: six steps, evidence, teacher gate, Spanish, docking, axe on every view, phone layout",
  );
} finally {
  await browser.close();
}
