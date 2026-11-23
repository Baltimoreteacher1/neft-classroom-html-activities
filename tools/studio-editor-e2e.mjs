#!/usr/bin/env node
/**
 * Activity Studio, driven the way a teacher drives it, in a real browser (`/activity-studio`):
 *   choose a type -> grade and subject -> describe an idea -> the math generators make verified questions ->
 *   the editor opens with them -> "Preview as student" renders the real player in a sandboxed frame ->
 *   the draft survives a reload and appears under My activities.
 * Also holds: no script error on any studio route, no horizontal overflow at 375px, and nothing is sent anywhere
 * (the only requests are same-origin GETs for the lab's own files; the studio's AI helper may be probed and fail).
 * Serves the source tree, where Vite-only `web-vitals` and the Pages Functions do not exist, so those two are
 * ignored. A missing browser is a SKIP locally and a FAIL in CI.
 */
import assert from "node:assert/strict";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("studio-editor-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}

const LAB = "/access-practice-lab";
const { server, base } = await serveAccess();
const browser = await chromium.launch().catch((error) => {
  console.warn(`studio-editor-e2e: SKIP — no browser (${error.message.split("\n")[0]}).`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
});

const problems = [];
const watch = (page, label) => {
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message))
      problems.push(`${label}: script error: ${e.message.slice(0, 200)}`);
  });
  page.on("console", (m) => {
    if (m.type() === "error" && !/status of 404|Failed to load resource/.test(m.text()))
      problems.push(`${label}: console error: ${m.text().slice(0, 200)}`);
  });
  page.on("request", (r) => {
    if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:"))
      problems.push(`${label}: left the origin: ${r.url().slice(0, 100)}`);
    if (r.method() !== "GET" && !/\/api\/studio\/ai/.test(r.url()))
      problems.push(`${label}: ${r.method()} ${r.url().slice(0, 100)}`);
  });
};
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  watch(page, "studio");

  // 1. Landing: the four types.
  await page.goto(`${base}${LAB}/activity-studio`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "What would you like to create?" }).waitFor();
  assert.equal(await page.locator(".st-kind").count(), 4, "four types to choose from");

  // 2. Interactive activity -> grade 6 Math -> describe an idea.
  await page.locator(".st-kind").first().click();
  await page.getByLabel("Grade", { exact: true }).selectOption({ label: "Grade 6" });
  await page.getByLabel("Subject", { exact: true }).selectOption({ label: "Mathematics" });
  await page.getByRole("tab", { name: "Describe My Idea" }).click();
  await page.locator("textarea").first().fill("Practice with equivalent ratios and unit rates");
  await page.getByRole("button", { name: "Create My Activity" }).click();

  // 3. The editor opens with generated questions.
  await page.getByRole("button", { name: "Preview as student" }).waitFor({ timeout: 15000 });
  assert.match(page.url(), /activity-studio\/[a-z0-9]+/i, "the editor has its own address");
  const questions = await page.locator("section.st-card[data-block]").count();
  assert.ok(questions >= 4, `the editor lists generated questions (found ${questions})`);

  // 4. The student preview is the real player, sandboxed, with the first question showing.
  await page.getByRole("button", { name: "Preview as student" }).click();
  const frameEl = page.locator("iframe[sandbox]").first();
  await frameEl.waitFor({ timeout: 15000 });
  const sandbox = (await frameEl.getAttribute("sandbox")).split(/\s+/);
  assert.ok(sandbox.includes("allow-scripts"), "the preview frame runs the player");
  for (const risky of ["allow-same-origin", "allow-top-navigation", "allow-popups", "allow-forms"])
    assert.ok(!sandbox.includes(risky), `the preview frame must not have ${risky}`);
  await page
    .frameLocator("iframe[sandbox]")
    .first()
    .locator(".sp-q")
    .first()
    .waitFor({ timeout: 15000 });

  // 5. The draft is saved on this device: reload keeps it, My activities lists it.
  const editorUrl = page.url();
  await page.goto(editorUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Preview as student" }).waitFor({ timeout: 15000 });
  await page.goto(`${base}${LAB}/activity-studio/mine`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "My activities" }).first().waitFor();
  const listed = await page.locator("main").innerText();
  assert.match(
    listed,
    /Grade 6 · Math/,
    `My activities lists the new draft (saw: ${listed.slice(0, 300).replace(/\s+/g, " ")})`,
  );

  // 6. The sample opens, and the routes stay inside the phone width.
  await page.goto(`${base}${LAB}/activity-studio/sample`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Preview as student" }).waitFor({ timeout: 15000 });
  await page.setViewportSize({ width: 375, height: 800 });
  for (const path of ["activity-studio", "activity-studio/mine", "activity-studio/sample"]) {
    await page.goto(`${base}${LAB}/${path}`, { waitUntil: "networkidle" });
    assert.ok((await overflow(page)) <= 1, `${path}: no horizontal scroll at 375px`);
  }

  await context.close();
  assert.deepEqual(problems, [], problems.join("\n"));
  console.log(
    "studio-editor-e2e: PASS — create, generate, edit, preview, save, list, sample, phone width",
  );
} catch (error) {
  console.error(`studio-editor-e2e: FAIL — ${error.message}`);
  if (problems.length) console.error(problems.join("\n"));
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
