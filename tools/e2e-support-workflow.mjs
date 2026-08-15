#!/usr/bin/env node
/* =============================================================================
 * e2e-support-workflow.mjs — the whole teacher workflow, in a real browser.
 *
 *   supports surface → preset → preview → apply
 *     → whole-group lesson → small-group variant
 *     → printable → teacher notes copy
 *     → audit table → reset
 *
 * This is the check that the pieces compose. Every individual surface has its
 * own gate; none of them can see a workflow that breaks at a seam.
 *
 * SAFE BY CONSTRUCTION. It runs against a local preview server and everything
 * it writes is localStorage on localhost — no production data, no planner
 * mutation, no account. Needs a server: `npm run preview -- --port 4499`.
 * Override with BASE=… to point it elsewhere.
 * ========================================================================== */
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:4499";
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// 1 — planner reports support status for a scheduled lesson (read-only check
//     of the status helper, which is what the planner day card renders).
await page.goto(`${BASE}/shared/supports/lesson-supports.js`);
await page.goto(`${BASE}/curriculum/student-supports/?lesson=5-3`);
await page.waitForSelector("[data-support]");
check(
  "supports surface offers this lesson's supports",
  (await page.locator("[data-support]").count()) > 10,
);

// 2 — preset → preview → apply
await page.click('[data-preset="wida-entering"]');
const preview = await page.locator("#sup-preview").innerText();
check("preview quotes this lesson's own frame", /trapezoid|Trapecio/i.test(preview));
const targets = await page.locator("#sup-targets").innerText();
check("preview names the paper surface", /Printable, worksheet/i.test(targets));
check("preview explains the paper difference", /delivery note/i.test(targets));
await page.click("#sup-apply");
const status = await page.locator("#sup-status").innerText();
check("apply confirms", /Applied\./.test(status), status);

// 3 — whole-group lesson
await page.goto(`${BASE}/lessons/5-3/`);
await page.waitForTimeout(2500);
const wg = await page.evaluate(() => window.EWLLearningSupports?.lessonSupportStatus());
check("whole-group lesson has the supports", wg.applied.length >= 5, wg.applied.join(","));

// 4 — small group inherits and de-duplicates
await page.goto(`${BASE}/lessons/5-3-group1/`);
await page.waitForTimeout(2500);
const sg = await page.evaluate(() => window.EWLLearningSupports?.lessonSupportStatus());
check("small group inherits", sg.applied.length > 0, sg.applied.join(","));
check(
  "small group de-duplicates its own scaffolds",
  sg.suppressed.length > 0,
  sg.suppressed.join(","),
);

// 5 — printable is support-aware
await page.goto(`${BASE}/lessons/5-3/printable.html`);
await page.waitForTimeout(2000);
const printed = await page.evaluate(() => ({
  blocks: [...document.querySelectorAll("[data-support-key]")].map((n) =>
    n.getAttribute("data-support-key"),
  ),
  text: document.body.innerText,
  provenance: document.querySelectorAll("[data-support-provenance]").length,
}));
check("printable renders support blocks", printed.blocks.length > 0, printed.blocks.join(","));
check("printable carries this lesson's vocabulary", /Trapecio|trapezoid/i.test(printed.text));
check("student printable shows no teacher provenance", printed.provenance === 0);
check("student printable has no plan terminology", !/\bIEP\b|\bWIDA\b|\bESOL\b/.test(printed.text));

// 6 — teacher notes copy carries provenance
await page.goto(`${BASE}/lessons/5-3/notes-teacher.html`);
await page.waitForTimeout(2000);
const teacherCopy = await page.evaluate(() => ({
  provenance: [...document.querySelectorAll("[data-support-provenance]")].map((n) =>
    n.getAttribute("data-support-provenance"),
  ),
  text: document.body.innerText,
}));
check(
  "teacher copy lists supports applied",
  teacherCopy.provenance.includes("supports"),
  teacherCopy.provenance.join(","),
);
check("teacher copy carries the read-aloud delivery note", /aloud/i.test(teacherCopy.text));

// 7 — the audit surface
await page.goto(`${BASE}/teacher-tools/support-audit/?decision=teacher-review`);
await page.waitForTimeout(1500);
const audit = await page.evaluate(() => ({
  rows: document.querySelectorAll("#sa-body tr").length,
  count: document.getElementById("sa-count").textContent,
}));
check("audit table lists decisions flagged for review", audit.rows > 0, audit.count);

// 8 — reset returns everything to canonical
await page.goto(`${BASE}/curriculum/student-supports/?lesson=5-3`);
await page.waitForSelector("#sup-reset");
await page.click("#sup-reset");
await page.goto(`${BASE}/lessons/5-3/printable.html`);
await page.waitForTimeout(1500);
const afterReset = await page.evaluate(
  () => document.querySelectorAll("[data-support-key]").length,
);
check("reset restores the canonical printable", afterReset === 0);
await page.goto(`${BASE}/lessons/5-3/`);
await page.waitForTimeout(2500);
const wgAfter = await page.evaluate(() => window.EWLLearningSupports?.lessonSupportStatus());
check("reset restores the canonical lesson", wgAfter.applied.length === 0);

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
