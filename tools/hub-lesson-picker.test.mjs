#!/usr/bin/env node
/* =============================================================================
 * hub-lesson-picker.test.mjs — the Teach band's Section → Unit → Lesson control.
 *
 * Drives the real script in a real DOM against the REAL launch manifest, so the
 * filtering is checked against the curriculum that actually ships rather than a
 * fixture that can quietly stop resembling it.
 *
 * What it does NOT check is spacing or appearance. A snapshot of a dropdown's
 * layout breaks on every unrelated edit and gets regenerated without being
 * read, which is worse than no test.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = readFileSync(join(ROOT, "assets", "curriculum-teacher-planning.js"), "utf8");
const MANIFEST = JSON.parse(
  readFileSync(join(ROOT, "data", "curriculum-launch-manifest.json"), "utf8"),
);
const STANDARDS = JSON.parse(readFileSync(join(ROOT, "data", "ccss-standards.json"), "utf8"));

let pass = 0;
async function t(name, fn) {
  await fn();
  pass++;
  console.log(`  ok  ${name}`);
}

/** Boot the hub script in a DOM that looks enough like /curriculum/ for the
 * workspace to build, and hand back the three selects. */
async function mount({
  savedPick = null,
  manifest = MANIFEST,
  failFetch = false,
  teacherState = null,
} = {}) {
  const dom = new JSDOM(
    `<!doctype html><html><body>
       <header class="curriculum-guide"><h1>Curriculum Hub</h1></header>
       <div id="hub-content"></div>
       <input id="curr-search" />
       <div class="curriculum-tools-bar"></div>
     </body></html>`,
    { url: "https://eduwonderlab.com/curriculum/", runScripts: "outside-only" },
  );
  const { window } = dom;
  if (savedPick) window.localStorage.setItem("nt-hub-lesson-pick", JSON.stringify(savedPick));
  if (teacherState) {
    window.localStorage.setItem("curriculumTeacherWorkflow:v1", JSON.stringify(teacherState));
  }
  window.NTJsonCache = {
    json: () => (failFetch ? Promise.reject(new Error("offline")) : Promise.resolve(manifest)),
    text: () => Promise.resolve({ ok: true, status: 200, text: "" }),
  };
  window.eval(SCRIPT);
  // The workspace is built by organizeTools(), which the hub calls once the
  // tools bar exists — the same entry point the page uses.
  window.CurriculumTeacherPlanning.organizeTools();
  await new Promise((r) => setTimeout(r, 40));
  const q = (sel) => window.document.querySelector(sel);
  return {
    window,
    section: q("#tws-section"),
    unit: q("#tws-unit"),
    lesson: q("#tws-lesson"),
    open: q("#tws-open"),
    values: (el) => [...el.options].map((o) => o.value).filter(Boolean),
    labels: (el) => [...el.options].map((o) => o.textContent),
    change: (el, value) => {
      el.value = value;
      el.dispatchEvent(new window.Event("change", { bubbles: true }));
    },
  };
}

/* ===========================================================================
 * CLASS SECTION — the first control is 601 / 602 / 603, never a standards
 * domain. The first cut of this picker read "section" as the MCCRS domain and
 * filtered units by it; these tests exist so that cannot come back.
 * ======================================================================== */
await t("the first control offers the class sections, from the canonical source", async () => {
  const schema = readFileSync(
    join(ROOT, "assets", "learning-supports", "supports-schema.js"),
    "utf8",
  );
  const canonical = /var SECTIONS = \[([^\]]*)\]/.exec(schema);
  assert.ok(canonical, "supports-schema.js no longer declares SECTIONS");
  const expected = [...canonical[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(expected, ["601", "602", "603"]);

  // The picker's fallback list must equal the schema's, or the two drift.
  const fallback = /var SECTION_FALLBACK = \[([^\]]*)\]/.exec(SCRIPT);
  assert.ok(fallback, "the picker no longer declares SECTION_FALLBACK");
  assert.deepEqual(
    [...fallback[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]),
    expected,
  );

  const p = await mount();
  assert.deepEqual(p.values(p.section), expected);
  assert.equal(p.labels(p.section)[0], "Select class");
});

await t("no standards domain appears in the class control, ever", async () => {
  const p = await mount();
  const labels = p.labels(p.section).join(" | ");
  for (const domain of Object.values(STANDARDS.domains)) {
    assert.ok(
      !labels.includes(domain),
      `the standards domain "${domain}" is back in the Class Section control`,
    );
  }
  for (const key of Object.keys(STANDARDS.domains)) {
    assert.ok(!p.values(p.section).includes(key), `domain key ${key} is a class option`);
  }
});

await t("the visible label says Class Section, not Section", async () => {
  const p = await mount();
  const label = p.window.document.querySelector('label[for="tws-section"]');
  assert.equal(label.textContent.trim(), "Class Section");
});

/* ===========================================================================
 * CLASS DOES NOT FILTER THE CURRICULUM
 * ======================================================================== */
await t("every unit is available whichever class is selected", async () => {
  const p = await mount();
  const allUnits = [...new Set(MANIFEST.lessons.map((l) => String(l.unit)))];
  for (const cls of ["601", "602", "603"]) {
    p.change(p.section, cls);
    assert.deepEqual(
      p.values(p.unit),
      allUnits,
      `class ${cls} changed which units exist — class is context, not curriculum`,
    );
  }
});

await t("units are offered in the curriculum's own order, not re-sorted", async () => {
  const p = await mount();
  const manifestOrder = [];
  for (const l of MANIFEST.lessons) {
    const u = String(l.unit);
    if (!manifestOrder.includes(u)) manifestOrder.push(u);
  }
  assert.deepEqual(p.values(p.unit), manifestOrder);
});

await t("unit and lesson do not wait on a class being chosen", async () => {
  // The curriculum exists whether or not a class is selected. Gating it behind
  // the class is exactly the mistake the domain version made.
  const p = await mount();
  assert.equal(p.unit.disabled, false, "units were gated behind the class control");
  assert.equal(p.lesson.disabled, true, "lessons opened before a unit was chosen");
  p.change(p.unit, "5");
  assert.equal(p.lesson.disabled, false);
});

await t("selecting a unit shows only that unit's lessons, in order", async () => {
  const p = await mount();
  p.change(p.unit, "5");
  const expected = MANIFEST.lessons.filter((l) => String(l.unit) === "5").map((l) => l.id);
  assert.deepEqual(p.values(p.lesson), expected);
  const first = MANIFEST.lessons.find((l) => l.id === expected[0]);
  assert.ok(p.labels(p.lesson).includes(`${first.id} · ${first.title}`));
});

await t("changing unit resets the lesson; changing class does not", async () => {
  const p = await mount();
  p.change(p.section, "601");
  p.change(p.unit, "5");
  p.change(p.lesson, "5-1");
  assert.ok(p.open.textContent.includes("5-1"));

  // Changing class KEEPS the lesson — "the same lesson for my next class" is
  // the main reason to touch this control.
  p.change(p.section, "602");
  assert.equal(p.unit.value, "5", "changing class cleared the unit");
  assert.equal(p.lesson.value, "5-1", "changing class cleared the lesson");
  assert.ok(p.open.textContent.includes("5-1"));
  assert.ok(p.open.textContent.includes("602"), "the expansion did not pick up the new class");

  // Changing unit DOES reset the lesson.
  p.change(p.unit, "6");
  assert.equal(p.lesson.value, "");
  assert.equal(p.open.textContent.trim(), "");
});

/* ===========================================================================
 * CLASS CONTEXT
 * ======================================================================== */
await t("the class is read from and written to the existing teacher state", async () => {
  const p = await mount({ teacherState: { section: "603", keepMe: 1 } });
  assert.equal(p.section.value, "603", "the class already in teacher state was ignored");

  p.change(p.section, "602");
  const state = JSON.parse(p.window.localStorage.getItem("curriculumTeacherWorkflow:v1"));
  assert.equal(state.section, "602");
  assert.equal(state.keepMe, 1, "writing the class clobbered other teacher state");
});

await t("the supports link carries the lesson AND the class", async () => {
  const p = await mount();
  p.change(p.section, "601");
  p.change(p.unit, "5");
  p.change(p.lesson, "5-1");
  const supports = [...p.open.querySelectorAll("a")]
    .map((a) => a.getAttribute("href"))
    .find((h) => h.startsWith("/curriculum/student-supports/"));
  assert.equal(supports, "/curriculum/student-supports/?lesson=5-1&section=601");

  p.change(p.section, "603");
  const after = [...p.open.querySelectorAll("a")]
    .map((a) => a.getAttribute("href"))
    .find((h) => h.startsWith("/curriculum/student-supports/"));
  assert.equal(after, "/curriculum/student-supports/?lesson=5-1&section=603");
});

await t("with no class chosen the supports link is still valid, just class-less", async () => {
  const p = await mount();
  p.change(p.unit, "5");
  p.change(p.lesson, "5-1");
  const supports = [...p.open.querySelectorAll("a")]
    .map((a) => a.getAttribute("href"))
    .find((h) => h.startsWith("/curriculum/student-supports/"));
  assert.equal(supports, "/curriculum/student-supports/?lesson=5-1");
});

await t("an invalid stored class is ignored rather than shown", async () => {
  const p = await mount({ teacherState: { section: "Other" } });
  assert.equal(p.section.value, "", '"Other" is not one of the three classes');
  const q = await mount({ teacherState: { section: "GR" } });
  assert.equal(q.section.value, "", "a standards domain was accepted as a class");
});

/* ===========================================================================
 * THE EXPANSION
 * ======================================================================== */
await t("a selected lesson resolves its own routes, and only real ones", async () => {
  const p = await mount();
  p.change(p.unit, "5");
  p.change(p.lesson, "5-3");
  const hrefs = [...p.open.querySelectorAll("a")].map((a) => a.getAttribute("href"));
  assert.ok(hrefs.includes("/lessons/5-3/"), "whole-group route missing");
  assert.ok(hrefs.some((h) => h.startsWith("/curriculum/student-supports/?lesson=5-3")));
  const expectedVariants = [
    ...(MANIFEST.smallGroups || []).filter((g) => g.parent === "5-3"),
    ...(MANIFEST.catchUps || []).filter((c) => c.parent === "5-3"),
  ].map((v) => v.resources.lesson);
  for (const href of expectedVariants) assert.ok(hrefs.includes(href), `variant ${href} missing`);
  for (const href of hrefs) {
    assert.ok(
      href === "/lessons/5-3/" ||
        href.startsWith("/curriculum/student-supports/?lesson=5-3") ||
        expectedVariants.includes(href),
      `unexpected route in the expansion: ${href}`,
    );
  }
});

await t("a lesson with no small-group version shows no small-group buttons", async () => {
  const withNone = MANIFEST.lessons.find(
    (l) =>
      !(MANIFEST.smallGroups || []).some((g) => g.parent === l.id) &&
      !(MANIFEST.catchUps || []).some((c) => c.parent === l.id),
  );
  if (!withNone) return;
  const p = await mount();
  p.change(p.unit, String(withNone.unit));
  p.change(p.lesson, withNone.id);
  assert.equal(p.open.querySelectorAll(".tws-open-variants").length, 0);
});

/* ===========================================================================
 * MEMORY + FAILURE
 * ======================================================================== */
await t("a remembered unit and lesson are restored; a retired one is discarded", async () => {
  const p = await mount({ savedPick: { unit: "5", lesson: "5-3" } });
  assert.equal(p.unit.value, "5");
  assert.equal(p.lesson.value, "5-3");
  assert.ok(p.open.textContent.includes("5-3"));

  const stale = await mount({ savedPick: { unit: "5", lesson: "5-99" } });
  assert.equal(stale.lesson.value, "", "a retired lesson id selected something anyway");
  assert.equal(stale.open.textContent.trim(), "");
});

await t("only identifiers are remembered — never lesson metadata", async () => {
  const p = await mount();
  p.change(p.section, "601");
  p.change(p.unit, "5");
  p.change(p.lesson, "5-3");
  const raw = p.window.localStorage.getItem("nt-hub-lesson-pick");
  assert.deepEqual(Object.keys(JSON.parse(raw)).sort(), ["lesson", "section", "unit"]);
  assert.ok(!/Trapezoid|title|href|\/lessons\//i.test(raw), `stored metadata: ${raw}`);
});

await t("a manifest failure is confined to the Teach band", async () => {
  const p = await mount({ failFetch: true });
  assert.equal(p.section.disabled, true);
  assert.match(p.open.textContent, /could not be loaded/i);
  assert.ok(p.open.querySelector("button"), "no retry offered");
  const band = p.window.document.querySelector(".tws-lead");
  assert.ok(band.querySelector('a[href="/curriculum/units/"]'), "browse link lost");
  assert.ok(band.querySelector('[data-tws="search"]'), "search action lost");
});

/* ===========================================================================
 * WHAT MUST NOT HAVE CHANGED
 * ======================================================================== */
await t("the Teach band keeps browse, search and the Plan/Support pair", async () => {
  const p = await mount();
  const doc = p.window.document;
  assert.ok(doc.querySelector('.tws-lead a[href="/curriculum/units/"]'), "browse link gone");
  assert.ok(doc.querySelector('.tws-lead [data-tws="search"]'), "search action gone");
  assert.ok(doc.querySelector('.tws-pair a[href="/curriculum/planning/"]'), "planner link gone");
  assert.ok(
    doc.querySelector('.tws-pair a[href="/curriculum/student-supports/"]'),
    "supports link gone",
  );
  assert.ok(doc.querySelector('.tws-more [data-tws="more"]'), "more-tools link gone");
  assert.ok(doc.querySelector(".tws").classList.contains("hub-teacher-only"));
});

await t("every control is labelled and keyboard-reachable", async () => {
  const p = await mount();
  for (const sel of [p.section, p.unit, p.lesson]) {
    const label = p.window.document.querySelector(`label[for="${sel.id}"]`);
    assert.ok(label && label.textContent.trim(), `${sel.id} has no visible label`);
    assert.equal(sel.tagName, "SELECT", "not a native select");
  }
  assert.equal(
    p.window.document.querySelector(".tws-pick").getAttribute("aria-label"),
    "Choose a lesson",
  );
});

console.log(`hub-lesson-picker: ${pass} assertions passed`);
