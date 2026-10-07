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
/* A teacher-gated page cannot be reached anonymously in production, and saying
 * so is the honest outcome — never a PASS, never a FAIL for a check that did
 * not run. Locally (vite preview, no middleware) these pages are reachable and
 * the checks execute for real. */
const skip = (name, detail) => {
  results.push({ name, skipped: true, detail });
  console.log(`  SKIP ${name} — ${detail}`);
};
async function reachable(page, url) {
  const res = await page.goto(url);
  if (res && res.status() === 401) return false;
  return true;
}

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
/* The scope has to be in the confirmation, not just in the store. "Applied."
 * was the old wording, and it is the wording this pass exists to remove: on a
 * page that can be editing one class or all three, a confirmation that does not
 * name the scope leaves the teacher to infer which classes just changed. */
const scopeBefore = await page.locator("#sup-editing-apply").innerText();
check(
  "the scope is stated at the Apply button",
  /Editing:\s*All class sections/i.test(scopeBefore),
  scopeBefore,
);
await page.click("#sup-apply");
const status = await page.locator("#sup-status").innerText();
check(
  "apply confirms, and names its scope",
  /Applied to all class sections\./.test(status),
  status,
);

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

// 6 — teacher notes copy carries provenance (teacher-gated in production)
if (await reachable(page, `${BASE}/lessons/5-3/notes-teacher.html`)) {
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
} else {
  skip("teacher copy provenance", "401 — the teacher gate is active, as it should be");
}

// 7 — the audit surface (teacher-gated in production)
if (await reachable(page, `${BASE}/teacher-tools/support-audit/?decision=teacher-review`)) {
  await page.waitForTimeout(1500);
  const audit = await page.evaluate(() => ({
    rows: document.querySelectorAll("#sa-body tr").length,
    count: document.getElementById("sa-count")?.textContent || "",
  }));
  check("audit table lists decisions flagged for review", audit.rows > 0, audit.count);
} else {
  skip("support audit table", "401 — the teacher gate is active, as it should be");
}

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

/* 9 — CLASS SCOPE, in the browser.
 *
 * The store's isolation is pinned by tools/lesson-supports.test.mjs. What that
 * cannot see is the WIRING: a scope tab that switches the label but saves to
 * the previous scope produces exactly the failure this pass is about — a
 * teacher believing they changed 602 when they changed all three — and it
 * passes every unit test, because the unit under test was never called with
 * the wrong argument. Only clicking through it can tell. */
await page.goto(`${BASE}/curriculum/student-supports/?lesson=5-3`);
await page.waitForSelector(".sup-scope-tab");
await page.evaluate(() => localStorage.removeItem("ewl-lesson-supports:v1"));
await page.reload();
await page.waitForSelector(".sup-scope-tab");

const readStore = () =>
  page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem("ewl-lesson-supports:v1") || "{}");
    } catch {
      return {};
    }
  });

// An all-class default.
await page.locator('[data-scope=""]').click();
await page.waitForTimeout(300);
await page.locator("[data-support]").first().check();
await page.click("#sup-apply");
await page.waitForTimeout(300);
const afterDefault = await readStore();
check(
  "the all-class default is stored as the lesson default, not as a class",
  Object.keys(afterDefault.lessons || {}).includes("5-3") &&
    !Object.keys(afterDefault.sections || {}).length,
  JSON.stringify(afterDefault.sections || {}),
);

// A class with no override reads the default and says so.
await page.locator('[data-scope="602"]').click();
await page.waitForTimeout(400);
const inherit602 = await page.locator("#sup-inherit").innerText();
check(
  "a class with no override says it is using the lesson default",
  /Using the lesson default/i.test(inherit602),
  inherit602,
);
check(
  "a class with no override shows the default it inherits",
  (await page.locator("[data-support]:checked").count()) === 1,
);

// Diverging gives that class — and only that class — its own override.
await page.locator("[data-support]").nth(1).check();
await page.click("#sup-apply");
await page.waitForTimeout(400);
const after602 = await readStore();
check(
  "editing a class writes only that class",
  Object.keys(after602.sections || {}).join(",") === "602",
  JSON.stringify(Object.keys(after602.sections || {})),
);
check(
  "editing a class leaves the lesson default alone",
  (after602.lessons?.["5-3"]?.keys || []).length === 1,
  JSON.stringify(after602.lessons?.["5-3"]?.keys),
);
const override602 = await page.locator("#sup-inherit").innerText();
check(
  "a class that has diverged is labelled an override",
  /override/i.test(override602),
  override602,
);

// Copy 602 → 603 only.
await page.locator('[data-copy-to="603"]').check();
await page.click("#sup-copy-go");
await page.waitForTimeout(500);
const afterCopy = await readStore();
check(
  "copy reaches only the class that was ticked",
  Object.keys(afterCopy.sections || {})
    .sort()
    .join(",") === "602,603",
  JSON.stringify(Object.keys(afterCopy.sections || {})),
);
check(
  "copy does not touch the lesson default",
  (afterCopy.lessons?.["5-3"]?.keys || []).length === 1,
  JSON.stringify(afterCopy.lessons?.["5-3"]?.keys),
);

// Clearing the lesson default leaves the class overrides standing.
await page.locator('[data-scope=""]').click();
await page.waitForTimeout(400);
await page.click("#sup-reset");
await page.waitForTimeout(400);
const afterClear = await readStore();
check(
  "clearing the lesson default does not erase a class override",
  (afterClear.sections?.["603"]?.["5-3"]?.keys || []).length === 2,
  JSON.stringify(afterClear.sections?.["603"]?.["5-3"]?.keys),
);
const warned = await page.locator("#sup-inherit").innerText();
check(
  "the all-class scope warns which classes it will not reach",
  /has an override|have an override/i.test(warned),
  warned,
);

// Leave no state behind for the next run.
await page.evaluate(() => localStorage.removeItem("ewl-lesson-supports:v1"));

await browser.close();
const failed = results.filter((r) => !r.skipped && !r.ok);
const skipped = results.filter((r) => r.skipped);
console.log(
  `\n${results.length - failed.length - skipped.length} passed, ${failed.length} failed, ${skipped.length} skipped — ${BASE}`,
);
if (skipped.length) {
  console.log(
    `\ne2e-supports: ${skipped.length} check(s) SKIPPED — teacher-gated pages are not reachable ` +
      `anonymously. Run against a local preview server to execute them.`,
  );
}
process.exit(failed.length ? 1 : 0);
