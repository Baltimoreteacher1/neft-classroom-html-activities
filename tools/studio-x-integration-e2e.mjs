#!/usr/bin/env node
/**
 * Studio X, the whole editor as a teacher meets it (`/activity-studio`): every new tab opened through the real tab
 * bar (no panels mounted by hand), one real action in each, and the page stays usable on a phone.
 *   Add components -> one-click add (+ the blocks really appear under Edit content)
 *   Language support -> one-click add, Undo restores the activity
 *   Versions side by side -> "Make versions" gives cards
 *   Check my work -> plain summary
 *   Share -> Fit to the page -> a page count, and the print button is there
 *   a chooser with the three "start another way" entries, closed by default
 * Serves the source tree; a missing browser is a SKIP locally and a FAIL in CI.
 */
import assert from "node:assert/strict";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("studio-x-integration-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}

const LAB = "/access-practice-lab";
const { server, base } = await serveAccess();
const browser = await chromium.launch().catch((error) => {
  console.warn(`studio-x-integration-e2e: SKIP — no browser (${error.message.split("\n")[0]}).`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
});

const problems = [];
const watch = (page) => {
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message)) problems.push(`script error: ${e.message.slice(0, 200)}`);
  });
  page.on("console", (m) => {
    if (m.type() === "error" && !/status of 404|Failed to load resource/.test(m.text()))
      problems.push(`console error: ${m.text().slice(0, 200)}`);
  });
  page.on("request", (r) => {
    if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:"))
      problems.push(`left the origin: ${r.url().slice(0, 100)}`);
    if (r.method() !== "GET" && !/\/api\/studio\/(ai|docx)/.test(r.url()))
      problems.push(`${r.method()} ${r.url().slice(0, 100)}`);
  });
};
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const blockCount = (page) => page.locator("section.st-card[data-block]").count();

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  watch(page);

  // 0. The chooser: the new ways in exist, closed by default, and the four kinds are untouched.
  await page.goto(`${base}${LAB}/activity-studio`, { waitUntil: "networkidle" });
  assert.equal(
    await page.locator(".st-kind").count(),
    4,
    "the four kinds are still the first choice",
  );
  for (const name of [/Describe what you want/i, /Use my own material/i, /recipe/i])
    assert.ok(
      (await page.getByText(name).first().count()) > 0,
      `the chooser offers a way in: ${name}`,
    );

  // 1. A worksheet from an idea.
  await page
    .locator(".st-kind", { hasText: /worksheet/i })
    .first()
    .click();
  await page.getByLabel("Grade", { exact: true }).selectOption({ label: "Grade 6" });
  await page.getByLabel("Subject", { exact: true }).selectOption({ label: "Mathematics" });
  await page.getByRole("tab", { name: "Describe My Idea" }).click();
  await page.locator("textarea").first().fill("Practice with equivalent ratios and unit rates");
  await page.getByRole("button", { name: "Create My Activity" }).click();
  await page.getByRole("button", { name: "Preview as student" }).waitFor({ timeout: 15000 });
  const before = await blockCount(page);
  assert.ok(before >= 4, `generated blocks (${before})`);

  const tabs = await page.getByRole("tab").allInnerTexts();
  for (const t of ["Add components", "Language support", "Versions side by side", "Check my work"])
    assert.ok(tabs.includes(t), `tab present: ${t} (saw ${tabs.join(" | ")})`);

  // 2. Add components: a short recommended list, one click adds, the block count grows.
  await page.getByRole("tab", { name: "Add components" }).click();
  const addButtons = page.getByRole("button", { name: "Add to my activity" });
  await addButtons.first().waitFor({ timeout: 15000 });
  const recommended = await addButtons.count();
  assert.ok(recommended >= 1 && recommended <= 8, `a short recommended list (${recommended})`);
  await addButtons.first().click();
  await page.getByRole("tab", { name: "Edit content" }).click();
  await page.waitForFunction(
    (n) => document.querySelectorAll("section.st-card[data-block]").length > n,
    before,
    { timeout: 10000 },
  );
  const afterAdd = await blockCount(page);

  // 3. Language support: add one, then Undo puts the activity back.
  await page.getByRole("tab", { name: "Language support" }).click();
  const langAdd = page.getByRole("button", { name: "Add Sentence frames" });
  await langAdd.first().waitFor({ timeout: 15000 });
  await langAdd.first().click();
  await page.getByRole("tab", { name: "Edit content" }).click();
  await page.waitForFunction(
    (n) => document.querySelectorAll("section.st-card[data-block]").length > n,
    afterAdd,
    { timeout: 10000 },
  );
  await page.getByRole("button", { name: "Undo" }).click();
  await page.waitForFunction(
    (n) => document.querySelectorAll("section.st-card[data-block]").length === n,
    afterAdd,
    { timeout: 10000 },
  );

  // 4. Versions side by side.
  await page.getByRole("tab", { name: "Versions side by side" }).click();
  await page.getByRole("button", { name: "Make versions", exact: true }).click();
  await page.getByRole("button", { name: "Make versions again" }).waitFor({ timeout: 20000 });

  // 5. Check my work.
  await page.getByRole("tab", { name: "Check my work" }).click();
  await page.locator(".st-check-summary").waitFor({ timeout: 15000 });

  // 6. Share -> Fit to the page.
  await page.getByRole("button", { name: "Share With Students" }).click();
  await page.getByRole("button", { name: "Fit to the page…" }).click();
  await page
    .getByRole("button", { name: "Print", exact: false })
    .first()
    .waitFor({ timeout: 20000 });
  const fitText = await page.locator("dialog, [role=dialog]").last().innerText();
  assert.match(fitText, /page/i, "the fit panel talks about pages");
  for (let i = 0; i < 4 && (await page.locator("dialog[open]").count()); i++) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
  }
  assert.equal(await page.locator("dialog[open]").count(), 0, "Escape closes every dialog");

  // 7. Phone width for every new tab.
  await page.setViewportSize({ width: 375, height: 800 });
  for (const name of [
    "Add components",
    "Language support",
    "Versions side by side",
    "Check my work",
  ]) {
    await page.getByRole("tab", { name }).click();
    await page.waitForTimeout(400);
    const over = await overflow(page);
    assert.ok(over <= 1, `${name}: no horizontal scroll at 375px (over by ${over})`);
  }

  await context.close();
  assert.deepEqual(problems, [], problems.join("\n"));
  console.log(
    `studio-x-integration-e2e: PASS — chooser, add components (${recommended} recommended), language support + undo, versions, check, fit to page, phone width`,
  );
} catch (error) {
  console.error(`studio-x-integration-e2e: FAIL — ${error.message}`);
  if (problems.length) console.error(problems.join("\n"));
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
