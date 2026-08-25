/* =============================================================================
 * instructional-sequence.test.mjs — the order students actually meet lessons in.
 * -----------------------------------------------------------------------------
 * The bug this suite exists to prevent has one shape: someone derives "the
 * previous lesson" from the lesson NUMBER. `ids[i - 1]` over a sorted list, a
 * `lesson - 1`, a filename comparison — all of them agree with each other and
 * all of them are wrong here, because the Pre-Unit is assembled:
 *
 *     1-1 → 2-6 → 2-7 → 6-1 → 6-2
 *
 * Numeric adjacency puts 2-5 (interquartile range) before 2-6 and 5-10 (volume)
 * before 6-1. No student has sat in either. Every assertion below is written as
 * a SEMANTIC lesson-id claim rather than against rendered prose, so a copy edit
 * cannot break it and a sequencing regression cannot hide behind one.
 *
 * The fixtures are deliberately small and hand-built where the property being
 * checked is structural (supplementary filtering, duplicates, aliases). The
 * live-data assertions run against the real pacing files, because a synthetic
 * Pre-Unit would only prove the fixture agreed with itself.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  baseLessonId,
  buildInstructionalSequence,
  getPreviousTaughtLesson,
  isCourseOpener,
  supplementaryIds,
} from "../shared/curriculum/instructional-sequence.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const ranges = read("data/pacing-unit-ranges.json");
const authored = read("data/pacing-unit-lessons.json");
const manifest = read("data/curriculum-launch-manifest.json");
const live = buildInstructionalSequence({ ranges, authored, manifest });
const prev = (id) => getPreviousTaughtLesson(id, live);

let pass = 0;
const t = (name, fn) => {
  fn();
  pass++;
  console.log(`  ok  ${name}`);
};

/* ── 1. THE REGRESSION CASE. Non-numerical ordering, live data ────────────── */

t("the Pre-Unit is taught 1-1 → 2-6 → 2-7 → 6-1 → 6-2", () => {
  assert.deepEqual(authored.units.PRE.lessons, ["1-1", "2-6", "2-7", "6-1", "6-2"]);
  assert.deepEqual(live.order.slice(0, 5), ["1-1", "2-6", "2-7", "6-1", "6-2"]);
});

t("previous(2-6) is 1-1, not 2-5", () => {
  assert.equal(prev("2-6"), "1-1");
  assert.notEqual(prev("2-6"), "2-5");
});

t("previous(2-7) is 2-6", () => assert.equal(prev("2-7"), "2-6"));

t("previous(6-1) is 2-7, not 5-10", () => {
  assert.equal(prev("6-1"), "2-7");
  assert.notEqual(prev("6-1"), "5-10");
});

t("previous(6-2) is 6-1", () => assert.equal(prev("6-2"), "6-1"));

t("1-1 opens the course and has no previous taught lesson", () => {
  assert.equal(prev("1-1"), null);
  assert.equal(isCourseOpener("1-1", live), true);
  assert.equal(isCourseOpener("2-6", live), false);
});

/* ── 2. Normal sequential lessons ─────────────────────────────────────────── */

t("mid-unit lessons follow their unit in order", () => {
  assert.equal(prev("8-3"), "8-2");
  assert.equal(prev("7-4"), "7-3");
  assert.equal(prev("9-4"), "9-3");
  assert.equal(prev("6-11"), "6-10");
});

t("a two-digit lesson number does not sort between 6-1 and 6-2", () => {
  assert.equal(prev("6-10"), "6-9");
  assert.equal(prev("6-11"), "6-10");
  assert.notEqual(prev("6-2"), "6-11");
});

/* ── 3. Unit transitions follow the district plan, not the numbering ───────── */

t("a unit opener retrieves from the last lesson of the PREVIOUS PACED unit", () => {
  // The district teaches Pre, 3, 4, 6, 7, 8, 9, 5, 2, 10.
  assert.equal(prev("3-1"), "6-2"); // Pre-Unit ends on 6-2, then Unit 3 opens
  assert.equal(prev("4-1"), "3-10");
  assert.equal(prev("7-1"), "6-15");
  assert.equal(prev("8-1"), "7-9");
  assert.equal(prev("9-1"), "8-7");
  assert.equal(prev("5-1"), "9-4"); // Unit 5 is taught in spring, after Unit 9
  assert.equal(prev("2-1"), "5-10");
  assert.equal(prev("10-1"), "2-12"); // Unit 10 closes the year, after Unit 2
});

t("a unit whose opening lessons were taught early opens on its first NEW lesson", () => {
  // 6-1 and 6-2 were taught in the Pre-Unit in August, so Unit 6 in November
  // begins at 6-3 — whose predecessor is the last Unit 4 lesson.
  assert.equal(prev("6-3"), "4-5");
  // Likewise 2-6 and 2-7 sat in the Pre-Unit, so Unit 2 runs 2-5 → 2-8.
  assert.equal(prev("2-8"), "2-5");
  assert.notEqual(prev("2-8"), "2-7");
});

/* ── 4. Every canonical lesson appears exactly once ───────────────────────── */

t("no lesson occupies two positions in the sequence", () => {
  assert.equal(new Set(live.order).size, live.order.length);
});

t("every manifest lesson is placed, and nothing else is", () => {
  const canonical = manifest.lessons.map((l) => l.id).sort();
  assert.deepEqual([...live.order].sort(), canonical);
});

t("a lesson the plan schedules twice is recorded as a repeat, not duplicated", () => {
  const repeated = live.repeats.map((r) => r.id).sort();
  assert.deepEqual(repeated, ["2-6", "2-7", "6-1", "6-2"]);
  for (const { id, firstUnitKey } of live.repeats) {
    assert.equal(firstUnitKey, "PRE", `${id} should first be taught in the Pre-Unit`);
    assert.equal(live.entries.get(id).unitKey, "PRE");
  }
});

/* ── 5. Supplementary entries are never predecessors ──────────────────────── */

t("small groups, catch-ups and culminating projects are not in the sequence", () => {
  const supplementary = supplementaryIds(manifest);
  assert.ok(supplementary.size > 200, "expected the supplementary families to be populated");
  for (const id of live.order) {
    assert.equal(supplementary.has(id), false, `${id} is supplementary and must not be sequenced`);
  }
  for (const id of ["3-3-catchup", "unit-3-project", "1-1-group1"]) {
    assert.equal(supplementary.has(id), true, `${id} should be a supplementary id`);
    assert.equal(prev(id), null, `${id} must resolve to no predecessor`);
  }
});

t("a supplementary entry between two lessons does not break their adjacency", () => {
  // 3-3-catchup is scheduled between 3-3 and 3-4 in the district calendar.
  assert.equal(prev("3-4"), "3-3");
});

/* ── 6. Aliases and variants do not corrupt adjacency ─────────────────────── */

t("variant folder names resolve to their parent and take no position", () => {
  assert.equal(baseLessonId("4-1-catchup"), "4-1");
  assert.equal(baseLessonId("1-1-group2"), "1-1");
  assert.equal(baseLessonId("6-15"), "6-15");
  assert.equal(live.entries.has("4-1-catchup"), false);
  assert.equal(prev("4-1-catchup"), null);
});

t("an unknown id resolves to null rather than to a guess", () => {
  assert.equal(prev("99-1"), null);
  assert.equal(prev(""), null);
  assert.equal(prev(undefined), null);
});

/* ── 7. Lessons the plan does not schedule are placed, not dropped ────────── */

t("the displaced Unit 1 arc keeps its own adjacency and is flagged unpaced", () => {
  assert.deepEqual(live.unpaced, ["1-2", "1-3", "1-4", "1-5", "1-6"]);
  assert.equal(prev("1-2"), "1-1");
  assert.equal(prev("1-6"), "1-5");
  // and it never becomes the predecessor of a paced lesson
  for (const id of live.unpaced) {
    assert.equal(live.entries.get(id).paced, false);
    assert.equal(live.order.filter((x) => x === id).length, 1);
  }
  assert.notEqual(prev("10-1"), "1-6");
});

/* ── 8. The two teacher-facing surfaces read the same order ───────────────── */

t("the Lesson dropdown's unit order is the district plan's order", () => {
  const dropdownOrder = ranges.units
    .filter((u) => u.curriculumUnit != null)
    .sort((a, b) => a.sequence - b.sequence)
    .map((u) => String(u.curriculumUnit));
  // The sequence walks units in exactly that order.
  const walked = [];
  for (const id of live.order) {
    const entry = live.entries.get(id);
    if (!entry.paced) continue;
    const unit = String(entry.curriculumUnit);
    const key = entry.unitKey;
    if (walked.length && walked[walked.length - 1].key === key) continue;
    walked.push({ key, unit });
  }
  // PRE is assembled from several units, so it is identified by its pacing key.
  const pacedKeys = walked.map((w) => w.key);
  assert.deepEqual(pacedKeys, ["PRE", "U3", "U4", "U6", "U7", "U8", "U9", "U5", "U2", "U10"]);
  assert.deepEqual(dropdownOrder, ["1", "3", "4", "6", "7", "8", "9", "5", "2", "10"]);
});

t("the dated pacing plan schedules the Pre-Unit the authored way", () => {
  const baseline = read("data/pacing-baseline-2026-27.json");
  const preLessons = [];
  for (const day of baseline.days) {
    const p = day.plan || {};
    if (p.unitKey !== "PRE" || !p.lessonId) continue;
    if (preLessons[preLessons.length - 1] !== p.lessonId) preLessons.push(p.lessonId);
  }
  assert.deepEqual(
    preLessons,
    authored.units.PRE.lessons,
    "the planner's day-by-day Pre-Unit must be the authored Pre-Unit — two Pre-Units on one " +
      "screen is how the warmups drifted in the first place",
  );
});

t("every lesson the dated plan schedules is in the instructional sequence", () => {
  const baseline = read("data/pacing-baseline-2026-27.json");
  const supplementary = supplementaryIds(manifest);
  for (const day of baseline.days) {
    const id = day.plan?.lessonId;
    if (!id || supplementary.has(id)) continue;
    assert.ok(live.entries.has(id), `${day.date} schedules ${id}, which is not in the sequence`);
  }
});

/* ── 9. Structural properties, on fixtures ────────────────────────────────── */

const fixture = (units, lessons, authoredUnits = {}) =>
  buildInstructionalSequence({
    ranges: { units },
    authored: { units: authoredUnits },
    manifest: { lessons, smallGroups: [], catchUps: [], endOfUnit: [] },
  });

t("a pacing block with no curriculum unit schedules nothing (MSTAR)", () => {
  const seq = fixture(
    [
      { sequence: 1, key: "U1", curriculumUnit: 1 },
      { sequence: 2, key: "MSTAR", curriculumUnit: null },
      { sequence: 3, key: "U2", curriculumUnit: 2 },
    ],
    [
      { id: "1-1", unit: 1 },
      { id: "2-1", unit: 2 },
    ],
  );
  assert.deepEqual(seq.order, ["1-1", "2-1"]);
  assert.equal(getPreviousTaughtLesson("2-1", seq), "1-1");
});

t("an authored id the curriculum no longer has is dropped, not faked", () => {
  const seq = fixture(
    [{ sequence: 1, key: "PRE", curriculumUnit: 1 }],
    [
      { id: "1-1", unit: 1 },
      { id: "1-2", unit: 1 },
    ],
    { PRE: { lessons: ["1-1", "9-9", "1-2"] } },
  );
  assert.deepEqual(seq.order, ["1-1", "1-2"]);
  assert.equal(getPreviousTaughtLesson("1-2", seq), "1-1");
});

t("changing the plan changes adjacency, with no other edit", () => {
  const lessons = [
    { id: "1-1", unit: 1 },
    { id: "2-1", unit: 2 },
    { id: "2-2", unit: 2 },
  ];
  const forward = fixture(
    [
      { sequence: 1, key: "U1", curriculumUnit: 1 },
      { sequence: 2, key: "U2", curriculumUnit: 2 },
    ],
    lessons,
  );
  const reversed = fixture(
    [
      { sequence: 1, key: "U2", curriculumUnit: 2 },
      { sequence: 2, key: "U1", curriculumUnit: 1 },
    ],
    lessons,
  );
  assert.equal(getPreviousTaughtLesson("2-1", forward), "1-1");
  assert.equal(getPreviousTaughtLesson("1-1", reversed), "2-2");
});

console.log(
  `PASS instructional-sequence: ${pass} assertions over the live curriculum and fixtures`,
);
