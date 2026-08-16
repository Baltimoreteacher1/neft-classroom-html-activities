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
const PACING = JSON.parse(readFileSync(join(ROOT, "data", "pacing-unit-ranges.json"), "utf8"));
const AUTHORED = JSON.parse(readFileSync(join(ROOT, "data", "pacing-unit-lessons.json"), "utf8"));

/** The district sequence the Unit dropdown must follow, derived from the same
 *  generated file the picker reads — never a list retyped into this test, which
 *  would only prove the two typists agreed. MSTAR carries no curriculumUnit and
 *  owns no lessons, so it is not an option. */
const DISTRICT_UNIT_ORDER = PACING.units
  .filter((u) => u.curriculumUnit != null)
  .map((u) => String(u.curriculumUnit));

/** The Lesson dropdown offers the unit's lessons AND, at the bottom, its
 *  culminating project. Assertions about LESSON membership take the lesson
 *  portion — identified from the manifest's own endOfUnit ids, never from an id
 *  shape, so a lesson that starts looking like a project id cannot be dropped
 *  silently. The project's own placement is asserted separately below. */
const PROJECT_IDS = new Set((MANIFEST.endOfUnit || []).map((p) => p.id));
const lessonsOnly = (values) => values.filter((v) => !PROJECT_IDS.has(v));

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
  pacing = PACING,
  authored = AUTHORED,
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
    // Route by path. The picker asks for two different files and they answer two
    // different questions; a stub that returns the manifest for both made the
    // unit-order assertion pass by accident, on manifest order, for weeks.
    json: (path) => {
      if (failFetch) return Promise.reject(new Error("offline"));
      if (String(path).includes("pacing-unit-lessons")) {
        return authored ? Promise.resolve(authored) : Promise.reject(new Error("no authored"));
      }
      if (String(path).includes("pacing-unit-ranges")) {
        return pacing ? Promise.resolve(pacing) : Promise.reject(new Error("no pacing"));
      }
      return Promise.resolve(manifest);
    },
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
  const allUnits = new Set(MANIFEST.lessons.map((l) => String(l.unit)));
  for (const cls of ["601", "602", "603"]) {
    p.change(p.section, cls);
    // A SET, deliberately: which units exist is this assertion's subject, and
    // the order they appear in is the district's, not the manifest's. Comparing
    // arrays here would silently re-pin numbering as the sequence.
    assert.deepEqual(
      new Set(p.values(p.unit)),
      allUnits,
      `class ${cls} changed which units exist — class is context, not curriculum`,
    );
  }
});

await t("units follow the district pacing sequence, not the numbering", async () => {
  const p = await mount();
  assert.deepEqual(p.values(p.unit), DISTRICT_UNIT_ORDER);
  // Stated as a property, so this fails even if the generated plan changes to
  // some other non-numeric order: the point is that the dropdown is NOT sorted.
  const shown = p.values(p.unit);
  const numeric = [...shown].sort((a, b) => Number(a) - Number(b));
  assert.notDeepEqual(shown, numeric, "the unit dropdown fell back to numeric order");
  const alphabetical = [...shown].sort();
  assert.notDeepEqual(shown, alphabetical, "the unit dropdown fell back to alphabetical order");
});

await t("a pacing entry with no curriculum unit is not offered as a unit", async () => {
  // MSTAR is a pacing entry: real instructional days, no curriculum unit, no
  // lessons. Offering it would produce a Unit whose Lesson dropdown is empty.
  const p = await mount();
  const nonUnits = PACING.units.filter((u) => u.curriculumUnit == null);
  assert.ok(nonUnits.length > 0, "the fixture no longer covers this case");
  for (const entry of nonUnits) {
    for (const value of p.values(p.unit)) {
      assert.notEqual(value, entry.key, `${entry.key} was offered as a unit`);
    }
  }
});

await t("units the pacing plan omits are appended, never dropped", async () => {
  // The curriculum decides what exists; a schedule that forgets a unit must not
  // be able to hide it. Pacing is the ORDER, not the allow-list.
  const thin = { ...PACING, units: PACING.units.slice(0, 2) };
  const p = await mount({ pacing: thin });
  const shown = p.values(p.unit);
  const everyUnit = new Set(MANIFEST.lessons.map((l) => String(l.unit)));
  assert.equal(shown.length, everyUnit.size, "a real unit disappeared from the picker");
  assert.deepEqual(shown.slice(0, 2), ["1", "3"], "the paced units did not lead");
});

await t("unreadable pacing data leaves the lesson list working", async () => {
  // Teaching continues when planning data does not. The order degrades to the
  // manifest's; the picker does not.
  const p = await mount({ pacing: null });
  const manifestOrder = [];
  for (const l of MANIFEST.lessons) {
    const u = String(l.unit);
    if (!manifestOrder.includes(u)) manifestOrder.push(u);
  }
  assert.deepEqual(p.values(p.unit), manifestOrder);
  assert.equal(p.unit.disabled, false);
});

await t("the unit dropdown uses the district's own label for a unit", async () => {
  const p = await mount();
  const labels = [...p.unit.options].map((o) => o.textContent).filter(Boolean);
  const pre = PACING.units.find((u) => u.curriculumUnit === 1);
  assert.ok(
    labels.includes(pre.districtLabel),
    `the Pre-Unit is shown as something other than "${pre.districtLabel}"`,
  );
});

/* ===========================================================================
 * AUTHORED UNIT MEMBERSHIP — the Pre-Unit is assembled, not inherited
 * ======================================================================== */

/** The Pre-Unit's instructional sequence, read from the authored source rather
 *  than retyped here — a list typed into the test only proves two typists
 *  agreed. */
const PRE_SEQUENCE = AUTHORED.units.PRE.lessons;

await t("the Pre-Unit lesson list is the authored sequence, in order", async () => {
  const p = await mount();
  p.change(p.unit, "1"); // the Pre-Unit maps to curriculum unit 1
  /* The culminating project is appended after the lessons (asserted separately
   * below), so the LESSON portion is what this assertion is about — compared by
   * taking the same number of leading entries rather than by filtering on an id
   * shape, which would keep passing if a lesson silently vanished. */
  assert.deepEqual(
    lessonsOnly(p.values(p.lesson)),
    PRE_SEQUENCE,
    "the Pre-Unit dropdown does not match the authored instructional sequence",
  );
  // And the exact expected order, so a change to the authored file is a
  // deliberate act that has to update this line too.
  assert.deepEqual(PRE_SEQUENCE, ["1-1", "2-6", "2-7", "6-1", "6-2"]);
});

await t("the Pre-Unit list is authored, not derived from unit membership", async () => {
  /* NOT stated as "is not sorted": this particular sequence happens to ascend
   * (1-1 < 2-6 < 2-7 < 6-1 < 6-2), so a not-sorted assertion would be false for
   * the correct answer and would have to be deleted the moment it mattered. The
   * real property is where the list COMES FROM — the authored file, not the
   * manifest's `unit` field, which is what produced 1-1 … 1-6. */
  const p = await mount();
  p.change(p.unit, "1");
  const shown = lessonsOnly(p.values(p.lesson));
  const fromUnitField = MANIFEST.lessons.filter((l) => String(l.unit) === "1").map((l) => l.id);
  assert.deepEqual(shown, PRE_SEQUENCE);
  assert.notDeepEqual(
    shown,
    fromUnitField,
    "the Pre-Unit fell back to curriculum unit-1 membership instead of the authored sequence",
  );
  assert.ok(
    shown.some((id) => !id.startsWith("1-")),
    "the Pre-Unit shows only unit-1 lessons, so it is not the assembled review sequence",
  );
});

await t("Pre-Unit lesson titles come from the manifest, never the authored file", async () => {
  const p = await mount();
  p.change(p.unit, "1");
  const labels = [...p.lesson.options].map((o) => o.textContent).filter(Boolean);
  for (const id of PRE_SEQUENCE) {
    const lesson = MANIFEST.lessons.find((l) => l.id === id);
    assert.ok(
      labels.some((label) => label.includes(lesson.title)),
      `${id} is not labelled with its manifest title "${lesson.title}"`,
    );
  }
  // The authored file must carry ids only — a title in it would be a second
  // source of truth that silently goes stale when the curriculum is renamed.
  assert.ok(
    !JSON.stringify(AUTHORED.units).includes(MANIFEST.lessons.find((l) => l.id === "2-6").title),
    "the authored sequence file has started storing lesson titles",
  );
});

await t("every authored lesson id exists in the manifest", () => {
  for (const [key, entry] of Object.entries(AUTHORED.units)) {
    for (const id of entry.lessons) {
      assert.ok(
        MANIFEST.lessons.some((l) => l.id === id),
        `${key} lists ${id}, which the curriculum manifest does not have`,
      );
    }
    assert.equal(new Set(entry.lessons).size, entry.lessons.length, `${key} lists a lesson twice`);
    assert.ok(entry.reason && entry.reason.length > 40, `${key} has no substantive reason`);
  }
});

await t("borrowing a lesson into the Pre-Unit does not move it", async () => {
  // 2-6 and 6-1 appear in the Pre-Unit sequence AND must still appear in their
  // own canonical units, in those units' normal order. Assembling a review
  // sequence is not a re-filing of the curriculum.
  const p = await mount();
  for (const [unit, expectedId] of [
    ["2", "2-6"],
    ["6", "6-1"],
  ]) {
    p.change(p.unit, unit);
    const shown = lessonsOnly(p.values(p.lesson));
    assert.ok(shown.includes(expectedId), `${expectedId} vanished from Unit ${unit}`);
    const manifestOrder = MANIFEST.lessons.filter((l) => String(l.unit) === unit).map((l) => l.id);
    assert.deepEqual(
      shown,
      manifestOrder,
      `Unit ${unit}'s own lesson list changed when the Pre-Unit borrowed from it`,
    );
  }
});

await t("switching away from the Pre-Unit restores normal membership", async () => {
  const p = await mount();
  p.change(p.unit, "1");
  assert.deepEqual(lessonsOnly(p.values(p.lesson)), PRE_SEQUENCE);
  p.change(p.unit, "5");
  assert.deepEqual(
    lessonsOnly(p.values(p.lesson)),
    MANIFEST.lessons.filter((l) => String(l.unit) === "5").map((l) => l.id),
    "Unit 5 inherited the Pre-Unit's authored sequence",
  );
  p.change(p.unit, "1");
  assert.deepEqual(
    lessonsOnly(p.values(p.lesson)),
    PRE_SEQUENCE,
    "returning to the Pre-Unit lost its sequence",
  );
});

await t("an unreadable authored file falls back to manifest membership", async () => {
  const p = await mount({ authored: null });
  p.change(p.unit, "1");
  assert.deepEqual(
    lessonsOnly(p.values(p.lesson)),
    MANIFEST.lessons.filter((l) => String(l.unit) === "1").map((l) => l.id),
    "a missing authored file emptied the Pre-Unit instead of falling back",
  );
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
  assert.deepEqual(lessonsOnly(p.values(p.lesson)), expected);
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

  /* EVERY part the manifest carries for this lesson is offered. Derived from the
   * manifest rather than listed here, so adding a resource to the curriculum
   * without surfacing it in the expansion fails this test instead of quietly
   * shipping a lesson whose homework the teacher cannot reach from the picker. */
  const own = MANIFEST.lessons.find((l) => l.id === "5-3").resources;
  for (const [key, href] of Object.entries(own)) {
    assert.ok(hrefs.includes(href), `the lesson's ${key} (${href}) is not offered`);
  }

  /* And nothing else. The expansion may only contain routes this lesson owns —
   * a hand-built path or another lesson's URL is the class of bug that sends a
   * teacher to the wrong homework at 7:55am. */
  const allowed = new Set([...Object.values(own), ...expectedVariants]);
  for (const href of hrefs) {
    assert.ok(
      allowed.has(href) || href.startsWith("/curriculum/student-supports/?lesson=5-3"),
      `unexpected route in the expansion: ${href}`,
    );
  }
});

/* ===========================================================================
 * CULMINATING PROJECTS — offered at the BOTTOM of the Lesson dropdown
 * ======================================================================== */
await t("each unit's culminating project is the LAST option in the Lesson list", async () => {
  const p = await mount();
  for (const project of MANIFEST.endOfUnit || []) {
    const unit = String(project.unit);
    p.change(p.unit, unit);
    const values = p.values(p.lesson);
    if (!values.length) continue; // a unit this district does not pace
    assert.equal(
      values[values.length - 1],
      project.id,
      `Unit ${unit}'s culminating project is not the last option`,
    );
    assert.ok(
      lessonsOnly(values).length > 0,
      `Unit ${unit} lost its lessons when the project was appended`,
    );
  }
});

await t("the project option is labelled from the manifest, not composed here", async () => {
  const p = await mount();
  const project = (MANIFEST.endOfUnit || []).find((x) => String(x.unit) === "5");
  p.change(p.unit, "5");
  assert.ok(
    p.labels(p.lesson).includes(project.title),
    `the Lesson dropdown does not offer "${project.title}"`,
  );
});

await t("choosing a project expands to the project, not to nothing", async () => {
  /* The expansion used to resolve the selection against `lessons` only, so a
   * project was selectable and then expanded to an empty box — which reads as a
   * broken picker rather than as a missing feature. */
  const p = await mount();
  const project = (MANIFEST.endOfUnit || []).find((x) => String(x.unit) === "5");
  p.change(p.unit, "5");
  p.change(p.lesson, project.id);
  const hrefs = [...p.open.querySelectorAll("a")].map((a) => a.getAttribute("href"));
  assert.ok(hrefs.includes(project.resources.lesson), "the project route is missing");
  assert.ok(
    p.open.textContent.includes(project.title),
    "the expansion does not name the project it opened",
  );
  // Supports are keyed by lesson id and resolve to nothing for a project.
  assert.ok(
    !hrefs.some((h) => h.startsWith("/curriculum/student-supports/")),
    "a project offered a supports link that would open an empty surface",
  );
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
