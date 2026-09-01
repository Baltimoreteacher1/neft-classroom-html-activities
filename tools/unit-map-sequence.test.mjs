#!/usr/bin/env node
/* =============================================================================
 * unit-map-sequence.test.mjs — the Teacher Command Center's Unit Map follows
 * the DISTRICT's sequence, not the curriculum's numbering.
 *
 * WHY THIS GATE EXISTS. /curriculum/ shows two views of one year on one page:
 * the Teach band's Class → Unit → Lesson picker, and the Command Center's Unit
 * Map. The picker was ordered by the district plan and pinned by
 * validate:pacing-unit-order; the Unit Map was not. It listed units 1, 2, 3 …
 * and read membership off `lesson.unit`, so it disagreed with the picker
 * directly above it about the order of the year: a teacher in November scrolled
 * past six units they teach in spring, and "Unit 1" showed the Unit 1
 * "Math Is…" arc rather than the Pre-Unit review sequence the district
 * actually paces there (Joel, 2026-09-01).
 *
 * Ordering by doing nothing is the failure mode — manifest order and any
 * `.sort()` both produce it — so this drives the REAL script in a real DOM
 * against the REAL manifest and pacing files, and asserts the rendered rows.
 * Expectations are derived from the same generated files the code reads, never
 * retyped here, which would only prove two typists agreed.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = readFileSync(join(ROOT, "assets", "curriculum-teacher-planning.js"), "utf8");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const MANIFEST = read("data/curriculum-launch-manifest.json");
const PACING = read("data/pacing-unit-ranges.json");
const AUTHORED = read("data/pacing-unit-lessons.json");

/* MSTAR carries no curriculumUnit and owns no lessons, so it is a pacing entry,
 * not a unit of this map. */
const DISTRICT_UNIT_ORDER = PACING.units
  .filter((u) => u.curriculumUnit != null)
  .map((u) => String(u.curriculumUnit));

let pass = 0;
async function t(name, fn) {
  await fn();
  pass++;
  console.log(`  ok  ${name}`);
}

/** Boot the real planning script and render the Unit Map into a stage. */
async function renderMap({ pacing = PACING, authored = AUTHORED, selected = null } = {}) {
  const dom = new JSDOM(`<!doctype html><html><body><div id="stage"></div></body></html>`, {
    url: "https://eduwonderlab.com/curriculum/",
    runScripts: "outside-only",
  });
  const { window } = dom;
  window.NTJsonCache = {
    json: (path) => {
      if (String(path).includes("pacing-unit-lessons")) {
        return authored ? Promise.resolve(authored) : Promise.reject(new Error("no authored"));
      }
      if (String(path).includes("pacing-unit-ranges")) {
        return pacing ? Promise.resolve(pacing) : Promise.reject(new Error("no pacing"));
      }
      return Promise.resolve(MANIFEST);
    },
  };
  window.eval(SCRIPT);

  const doc = window.document;
  const lessons = MANIFEST.lessons || [];
  const lessonsById = Object.create(null);
  for (const l of lessons) lessonsById[l.id] = l;

  /* The same helpers curriculum-teacher-workflow.js hands the renderer. */
  const el = (tag, className, text) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  const context = {
    state: { selected: selected || lessons[0].id, view: "unit" },
    saveState: () => {},
    lessons,
    lessonsById,
    data: { launch: MANIFEST },
    studentUrl: (lesson) => `/curriculum/student-launch/?lesson=${lesson.id}`,
    button: (label, action, className) => {
      const b = el("button", className, label);
      b.addEventListener("click", action);
      return b;
    },
    link: (label, href, className) => {
      const a = el("a", className, label);
      a.href = href;
      return a;
    },
    el,
  };

  const stage = doc.querySelector("#stage");
  window.CurriculumTeacherPlanning.render("unit", stage, context);
  await new Promise((r) => setTimeout(r, 40));

  const select = stage.querySelector("select");
  const rowTitles = () =>
    [...stage.querySelectorAll(".ctw-unit-row .ctw-row-title")].map((n) => n.textContent);
  return {
    window,
    stage,
    select,
    unitValues: () => [...select.options].map((o) => o.value),
    unitLabels: () => [...select.options].map((o) => o.textContent),
    rowTitles,
    /* Row titles read "2-6 · Divide Multi-Digit Numbers"; the id is what the
     * sequence assertions are about. A project row has no id and is excluded
     * here — its placement is asserted on its own. */
    rowIds: () => rowTitles().map((s) => s.split(" · ")[0]),
    pick: (value) => {
      select.value = value;
      select.dispatchEvent(new window.Event("change", { bubbles: true }));
    },
  };
}

/* ── 1. Units follow the district plan ─────────────────────────────────────── */

await t("the Unit dropdown is in district order, not curriculum numbering", async () => {
  const map = await renderMap();
  assert.deepEqual(map.unitValues(), DISTRICT_UNIT_ORDER);
});

await t("that order is neither numeric nor alphabetical — stated as a property", async () => {
  const map = await renderMap();
  const shown = map.unitValues();
  const numeric = [...shown].sort((a, b) => Number(a) - Number(b));
  const alpha = [...shown].sort();
  assert.notDeepEqual(shown, numeric, "the Unit Map is back on numeric unit order");
  assert.notDeepEqual(shown, alpha, "the Unit Map is back on alphabetical unit order");
});

await t("each unit carries the district's own label, not a composed 'Unit N'", async () => {
  const map = await renderMap();
  const labels = map.unitLabels();
  for (const entry of PACING.units) {
    if (entry.curriculumUnit == null || !entry.districtLabel) continue;
    assert.ok(
      labels.includes(entry.districtLabel),
      `the Unit Map does not show the district label "${entry.districtLabel}"`,
    );
  }
  // The Pre-Unit is not called "Unit 1" on the plan the teacher is following.
  assert.ok(!labels.includes("Unit 1"), 'the Pre-Unit is labelled "Unit 1" again');
});

/* ── 2. Assembled membership ───────────────────────────────────────────────── */

await t("the Pre-Unit lists its AUTHORED sequence, not the Unit 1 arc", async () => {
  const map = await renderMap();
  const preKey = String(
    PACING.units.find((u) => u.key === "PRE" || /pre/i.test(u.key || "")).curriculumUnit,
  );
  map.pick(preKey);
  const expected = AUTHORED.units.PRE.lessons;
  assert.deepEqual(
    map.rowIds().slice(0, expected.length),
    expected,
    "the Pre-Unit is showing curriculum unit 1 membership instead of the paced sequence",
  );
});

await t("a lesson pulled into an assembled unit still appears in its own unit", async () => {
  const map = await renderMap();
  map.pick("2");
  assert.ok(map.rowIds().includes("2-6"), "2-6 vanished from Unit 2 when the Pre-Unit claimed it");
});

/* ── 3. Lesson order and the project's place ───────────────────────────────── */

await t("lessons inside a unit are in instructional order, never lexical", async () => {
  const map = await renderMap();
  for (const unit of DISTRICT_UNIT_ORDER) {
    map.pick(unit);
    const ids = map.rowIds().filter((id) => /^\d+-\d+$/.test(id));
    if (ids.length < 2) continue;
    const expected = MANIFEST.lessons
      .filter((l) => String(l.unit) === unit)
      .map((l) => l.id)
      .filter((id) => ids.includes(id));
    // Unit 1 is the assembled Pre-Unit; its order is authored, asserted above.
    if (unit === "1") continue;
    assert.deepEqual(ids, expected, `unit ${unit} rows are not in instructional order`);
    const lexical = [...ids].sort();
    if (ids.length > 9) {
      assert.notDeepEqual(ids, lexical, `unit ${unit} fell back to a lexical id sort`);
    }
  }
});

await t("the culminating project is the LAST row of its unit, never lesson zero", async () => {
  const map = await renderMap();
  let checked = 0;
  for (const project of MANIFEST.endOfUnit || []) {
    if (!project.resources?.lesson) continue;
    const unit = String(project.unit);
    if (!DISTRICT_UNIT_ORDER.includes(unit)) continue;
    map.pick(unit);
    const titles = map.rowTitles();
    assert.ok(titles.length, `unit ${unit} rendered no rows`);
    assert.ok(
      titles[titles.length - 1].includes(project.title),
      `unit ${unit}'s culminating project is not the last row`,
    );
    checked++;
  }
  assert.ok(checked > 0, "no culminating projects were checked — the fixture found none");
});

/* ── 4. The map opens where the teacher is ─────────────────────────────────── */

await t("selecting a lesson opens the map on the unit that TEACHES it", async () => {
  // 2-6 is a Unit 2 lesson the district teaches in the Pre-Unit. The map must
  // open on the Pre-Unit, not send the teacher to a unit they teach in spring.
  const map = await renderMap({ selected: "2-6" });
  const preKey = String(PACING.units.find((u) => u.key === "PRE").curriculumUnit);
  assert.equal(map.select.value, preKey);
  assert.ok(map.rowIds().includes("2-6"));
});

/* ── 5. Pacing is advisory, never fatal ────────────────────────────────────── */

await t("an unreadable pacing plan leaves a full map, not an empty one", async () => {
  const map = await renderMap({ pacing: null, authored: null });
  assert.ok(map.unitValues().length >= 10, "the Unit Map emptied when pacing failed to load");
  assert.ok(map.rowTitles().length > 0, "the Unit Map rendered no lessons when pacing failed");
});

/* ── 5b. MUTATION PROOF ────────────────────────────────────────────────────
 * The assertions above pass if the order happens to be right. This one proves
 * the map READS the plan: hand it a deliberately different plan and the map has
 * to follow it. A gate that has quietly stopped firing reports a perfectly
 * ordered curriculum. */

await t(
  "a different plan produces a different map — the order is sourced, not baked in",
  async () => {
    const scrambled = {
      ...PACING,
      units: [...PACING.units].reverse(),
    };
    const map = await renderMap({ pacing: scrambled });
    const expected = scrambled.units
      .filter((u) => u.curriculumUnit != null)
      .map((u) => String(u.curriculumUnit));
    assert.deepEqual(map.unitValues(), expected);
    assert.notDeepEqual(
      map.unitValues(),
      DISTRICT_UNIT_ORDER,
      "the Unit Map ignored the plan it was given — its order is hardcoded",
    );
  },
);

/* ── 6. Both views share ONE derivation ────────────────────────────────────── */

await t("the picker and the Unit Map read the same derivation, not two copies", async () => {
  const calls = SCRIPT.match(/deriveUnitSequence\(/g) || [];
  assert.ok(
    calls.length >= 3,
    "deriveUnitSequence is no longer called by both the picker and the Unit Map — " +
      "a second copy of the district order is exactly the drift this gate exists to stop",
  );
  assert.ok(
    !/context\.lessons[\s\S]{0,200}?lesson\.unit === Number\(/.test(SCRIPT),
    "the Unit Map is filtering by lesson.unit again instead of the paced membership",
  );
});

console.log(`unit-map-sequence: ${pass} assertions passed`);
