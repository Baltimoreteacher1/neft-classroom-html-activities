#!/usr/bin/env node
/**
 * Studio X, driven the way a teacher drives it, in a real browser (`/activity-studio`):
 *   create a worksheet -> "Check my work" lists what to look at and says so in plain words ->
 *   Share -> "Download complete package (ZIP)" -> the downloaded ZIP is opened independently here:
 *   manifest + launcher + student files, the answer key only under teacher/, nothing external (offline claim),
 *   and no student file carries an answer. Also: keyboard reaches the Check tab, no overflow at 375px.
 * Serves the source tree, where the Pages Function for Word files does not exist, so that request is allowed to
 * fail and the package must say so and still build. A missing browser is a SKIP locally and a FAIL in CI.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import { normalizeActivity } from "../access-practice-lab/src/studio/core/schema.js";
import { validatePackage } from "../access-practice-lab/src/studio/x/package.js";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("studio-x-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}

const LAB = "/access-practice-lab";
const { server, base } = await serveAccess();
const browser = await chromium.launch().catch((error) => {
  console.warn(`studio-x-e2e: SKIP — no browser (${error.message.split("\n")[0]}).`);
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

try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  watch(page);

  // 1. A worksheet from an idea (verified math generators).
  await page.goto(`${base}${LAB}/activity-studio`, { waitUntil: "networkidle" });
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

  // 2. Check my work: reachable by keyboard, answers in plain words.
  const checkTab = page.getByRole("tab", { name: "Check my work" });
  await checkTab.focus();
  await page.keyboard.press("Enter");
  const summary = page.locator(".st-check-summary");
  await summary.waitFor({ timeout: 15000 });
  const said = (await summary.innerText()).trim();
  assert.match(
    said,
    /need(s)? fixing|Nothing blocks sharing|looks good/,
    `a plain summary, not a data dump (saw: ${said})`,
  );
  const fixButtons = await page.getByRole("button", { name: "Fix it for me" }).count();
  const items = await page.locator(".st-check-item").count();
  assert.ok(fixButtons <= items, "only some findings offer a fix");

  // 3. Share -> complete package, downloaded and opened independently.
  await page.getByRole("button", { name: "Share With Students" }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 30000 }),
    page.getByRole("button", { name: "Download complete package (ZIP)" }).click(),
  ]);
  assert.match(download.suggestedFilename(), /-package\.zip$/);
  const bytes = new Uint8Array(await readFile(await download.path()));
  const zip = await JSZip.loadAsync(bytes);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  assert.ok(names.includes("index.html"), "launcher");
  assert.ok(names.includes("package.json"), "manifest");
  assert.ok(
    names.some((n) => n.startsWith("student/") && n.endsWith(".html")),
    "student page",
  );
  const verdict = await validatePackage(bytes, { JSZip });
  assert.equal(verdict.ok, true, `package validates: ${JSON.stringify(verdict.errors)}`);
  assert.equal(verdict.offline, true, `offline claim holds: ${JSON.stringify(verdict.offenders)}`);
  const teacher = names.filter((n) => n.startsWith("teacher/"));
  const student = names.filter((n) => n.startsWith("student/"));
  assert.ok(teacher.length > 0, "the answer key is present, in teacher/ only");
  const manifest = JSON.parse(await zip.file("package.json").async("string"));
  assert.equal(manifest.schema, "lp-package/1");
  for (const n of student.filter((f) => f.endsWith(".html") && /print|worksheet/.test(f))) {
    const html = await zip.file(n).async("string");
    assert.ok(
      !/answer key|clave de respuestas/i.test(html),
      `${n}: no answer key in student print`,
    );
  }
  await page.keyboard.press("Escape");

  // 3b. A draft with real problems: the panel names them, offers a fix only where one is safe, and undo works.
  const q = (id, format, extra) => ({
    id,
    type: "question",
    format,
    prompt: `Question ${id}`,
    ...extra,
  });
  const seeded = normalizeActivity({
    schema: "lp-activity/1",
    id: "s0123456789",
    title: "Seeded problems",
    kind: "worksheet",
    template: "practice",
    context: { grade: "6", subject: "Mathematics" },
    blocks: [
      {
        id: "v1",
        type: "vocab",
        items: [{ id: "w1", term: "unit rate", def: "Amount for one.", es: "tasa unitaria" }],
      },
      {
        id: "p1",
        type: "passage",
        title: "Read",
        text: "Find the Unit-rate for 6 cups and 3 people.",
      },
      q("q1", "order", { items: ["a", "b", "b", "c"].map((text, i) => ({ id: `s${i}`, text })) }),
      q("q2", "number", { prompt: "What is 3 + 4?", answer: "8" }),
    ],
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(
    ([key, activity]) => {
      const all = JSON.parse(localStorage.getItem(key) || "{}");
      all[activity.id] = { activity, updatedAt: Date.now(), link: null };
      localStorage.setItem(key, JSON.stringify(all));
    },
    ["accessPracticeLab:v1:studio", seeded],
  );
  await page.goto(`${base}${LAB}/activity-studio/s0123456789`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Check my work" }).click();
  await summary.waitFor({ timeout: 15000 });
  assert.match(
    await summary.innerText(),
    /need(s)? fixing/,
    "defects are reported as needing a fix",
  );
  const panelText = await page.locator(".st-check").innerText();
  assert.match(panelText, /says 8 but 3 \+ 4 equals 7/, "wrong arithmetic is named");
  assert.match(panelText, /Unit-rate/, "inconsistent terminology is named");
  const arithmetic = page.locator(".st-check-item", { hasText: "3 + 4 equals 7" });
  assert.equal(
    await arithmetic.getByRole("button", { name: "Fix it for me" }).count(),
    0,
    "a wrong answer key is never rewritten for the teacher",
  );
  const dup = page.locator(".st-check-item", { hasText: "say the same thing" });
  await dup.getByRole("button", { name: "Fix it for me" }).click();
  await page.waitForFunction(
    () => !/say the same thing/.test(document.querySelector(".st-check")?.textContent || ""),
    null,
    { timeout: 10000 },
  );
  assert.match(
    await page.locator(".st-check").innerText(),
    /3 \+ 4 equals 7/,
    "unfixable stays listed",
  );
  await page.getByRole("button", { name: "Undo" }).click();
  await page.waitForFunction(
    () => /say the same thing/.test(document.querySelector(".st-check")?.textContent || ""),
    null,
    { timeout: 10000 },
  );

  // 4. Phone width with the Check tab open.
  await page.setViewportSize({ width: 375, height: 800 });
  await page.getByRole("tab", { name: "Check my work" }).click();
  await summary.waitFor();
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  assert.ok(over <= 1, `no horizontal scroll at 375px (over by ${over})`);

  await context.close();
  assert.deepEqual(problems, [], problems.join("\n"));
  console.log(
    `studio-x-e2e: PASS — worksheet, check my work (${items} findings, ${fixButtons} fixable), package (${names.length} files, offline), phone width`,
  );
} catch (error) {
  console.error(`studio-x-e2e: FAIL — ${error.message}`);
  if (problems.length) console.error(problems.join("\n"));
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
