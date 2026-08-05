#!/usr/bin/env node

import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const base = process.env.MWB_PAGE_URL || "http://127.0.0.1:5173/curriculum/math-workbench/";
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.removeItem("neft.mathWorkbench.reasoning.v1"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#reasoningStudioBtn").click();
  await page
    .locator('[data-field="prompt"]')
    .fill("For every 2 cups of juice, use 3 cups of water. Explain the relationship.");
  await page.locator('[data-action="next"]').click();
  await page.locator('[data-action="rep"][data-value="ratio table"]').click();
  await page.locator('[data-action="rep"][data-value="words"]').click();
  await page.locator('[data-field="linked.factor"]').fill("5");
  await page.locator('[data-action="stamp"]').click();

  const snapshot = await page.evaluate(() => window.MathWorkbenchAPI.getSnapshot());
  assert.equal(snapshot.modelCount, 1);
  assert.ok(snapshot.objectCount >= 3);

  await page.locator('[data-action="next"]').click();
  await page
    .locator('[data-field="firstDraft"]')
    .fill(
      "The ratio table and words match because for every 2 cups of juice there are 3 cups of water.",
    );
  await page.locator('[data-action="analyze"]').click();
  await page.locator('[data-action="next"]').click();
  await page
    .locator('[data-field="revised"]')
    .fill(
      "The ratio table and words match because scaling both cup quantities by the same factor keeps 2 for every 3 equivalent.",
    );
  await page.locator('[data-field="afterConfidence"]').selectOption("4");
  await page.locator('[data-action="finish"]').click();
  await page.getByRole("heading", { name: "5. Evidence of growth" }).waitFor();

  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("neft.mathWorkbench.reasoning.v1") || "[]"),
  );
  assert.equal(saved.length, 1);
  assert.equal(saved[0].events.at(-1).type, "finish");
  assert.equal(saved[0].analysis.status, "connected-reasoning-visible");

  const accessibility = await new AxeBuilder({ page }).include("#reasoningStudio").analyze();
  assert.deepEqual(
    accessibility.violations.map(({ id, impact }) => ({ id, impact })),
    [],
  );
  assert.deepEqual(errors, []);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const mobileErrors = [];
  mobile.on("pageerror", (error) => mobileErrors.push(error.message));
  await mobile.goto(base, { waitUntil: "domcontentloaded" });
  await mobile.locator("#reasoningStudioBtn").click();
  const box = await mobile.locator(".mwr-dialog").boundingBox();
  assert.ok(box);
  assert.ok(box.width <= 390 && box.height <= 844);
  assert.deepEqual(mobileErrors, []);

  console.log("✓ Reasoning Studio desktop flow, native models, evidence, axe, and mobile reflow");
} finally {
  await browser.close();
}
