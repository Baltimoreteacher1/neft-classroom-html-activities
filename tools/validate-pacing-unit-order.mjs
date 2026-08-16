#!/usr/bin/env node
/**
 * validate:pacing-unit-order — the Unit dropdown follows district pacing, and
 * lessons inside it follow instructional order.
 *
 * TWO ORDERINGS, BOTH EASY TO GET WRONG BY DOING NOTHING.
 *
 * 1. UNITS. The curriculum numbers its units 1..10. This district does not teach
 *    them in that order — Pre, 3, 4, 6, 7, 8, 9, 5, 2, 10 — so a dropdown that
 *    lists them 1, 2, 3, 4 is not neutral. It is an assertion about the sequence,
 *    it is wrong, and it costs a teacher in November six units of scrolling to
 *    reach the one they are in. The failure needs no bad code to occur: reading
 *    the manifest in its own order produces it, and so does any `.sort()`.
 *
 * 2. LESSONS. Lesson ids are strings, so the default comparison puts 6-10 and
 *    6-11 between 6-1 and 6-2. That is not a hypothetical — it is what every
 *    lexical sort of this id space does.
 *
 * WHAT THIS GATE CHECKS, and why each check is here rather than assumed:
 *
 *   - the generated pacing plan is internally sound (contiguous sequence, no
 *     duplicate unit, dates in order)
 *   - RECONCILIATION: every paced curriculum unit exists in the manifest, and
 *     every manifest unit is paced. A paced unit the curriculum does not have is
 *     a dropdown entry with no lessons; a curriculum unit the plan forgets must
 *     still be reachable, so the picker appends it — this gate reports it rather
 *     than letting it pass unnoticed.
 *   - the resulting order is neither numeric nor alphabetical. Stated as a
 *     property so it keeps working if the district changes its plan.
 *   - lesson order inside every unit is instructional, never lexical.
 *   - the picker still READS the pacing file and does not sort units.
 *
 * MUTATION-TESTED. Each detector is run against a deliberately wrong fixture
 * before the real data is looked at, because a gate that has quietly stopped
 * firing reports a perfectly ordered curriculum.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const failures = [];
const notes = [];
const fail = (m) => failures.push(m);

/* ── Detectors, as pure functions so they can be mutation-tested ───────────── */

/** The unit sequence a pacing plan implies for the Unit dropdown. */
export function pacedUnitOrder(pacing, unitsWithLessons) {
  const order = [];
  for (const entry of pacing.units || []) {
    if (entry.curriculumUnit == null) continue;
    const key = String(entry.curriculumUnit);
    if (!unitsWithLessons.has(key) || order.includes(key)) continue;
    order.push(key);
  }
  return order;
}

/** True when the order is just the numbers in ascending order. */
export const isNumericOrder = (order) =>
  order.length > 1 && order.every((v, i) => i === 0 || Number(order[i - 1]) <= Number(v));

/** True when the order is just the strings sorted. */
export const isAlphabeticalOrder = (order) =>
  order.length > 1 && order.every((v, i) => i === 0 || order[i - 1] <= v);

/** Lesson ids in instructional order: same unit, ascending numeric suffix. */
export function lexicalLessonBreaks(ids) {
  const breaks = [];
  for (let i = 1; i < ids.length; i++) {
    const prev = Number(String(ids[i - 1]).split("-")[1]);
    const curr = Number(String(ids[i]).split("-")[1]);
    if (!Number.isFinite(prev) || !Number.isFinite(curr)) continue;
    if (curr < prev) breaks.push(`${ids[i - 1]} is followed by ${ids[i]}`);
  }
  return breaks;
}

/* ── Mutation tests: prove every detector still fires ──────────────────────── */

const MUTATIONS = [
  ["numeric order is recognised as numeric", () => isNumericOrder(["1", "2", "3", "4"]) === true],
  [
    "the district order is not mistaken for numeric",
    () => isNumericOrder(["1", "3", "4", "6", "7", "8", "9", "5", "2", "10"]) === false,
  ],
  [
    "alphabetical order is recognised as alphabetical",
    () => isAlphabeticalOrder(["1", "10", "2", "3"]) === true,
  ],
  [
    "lexical lesson order is caught",
    () => lexicalLessonBreaks(["6-1", "6-10", "6-11", "6-2"]).length === 1,
  ],
  [
    "instructional lesson order is not flagged",
    () => lexicalLessonBreaks(["6-1", "6-2", "6-10", "6-11"]).length === 0,
  ],
  [
    "a pacing entry with no curriculum unit yields no dropdown entry",
    () =>
      pacedUnitOrder({ units: [{ key: "MSTAR", curriculumUnit: null }] }, new Set(["1"])).length ===
      0,
  ],
  [
    "a paced unit the curriculum lacks yields no dropdown entry",
    () => pacedUnitOrder({ units: [{ curriculumUnit: 99 }] }, new Set(["1"])).length === 0,
  ],
];

for (const [name, run] of MUTATIONS) {
  let ok = false;
  try {
    ok = run();
  } catch (err) {
    ok = false;
    notes.push(`mutation test "${name}" threw: ${err.message}`);
  }
  if (!ok) fail(`mutation test failed — a detector has stopped firing: ${name}`);
}

/* ── The real data ─────────────────────────────────────────────────────────── */

const pacing = read("data/pacing-unit-ranges.json");
const manifest = read("data/curriculum-launch-manifest.json");
const lessons = manifest.lessons || [];

const unitsWithLessons = new Set(lessons.map((l) => String(l.unit)));

// 1. The plan is internally sound.
const seen = new Set();
let previousSequence = 0;
let previousEnd = "";
for (const entry of pacing.units || []) {
  if (entry.sequence !== previousSequence + 1) {
    fail(`pacing sequence jumps at ${entry.key}: ${previousSequence} -> ${entry.sequence}`);
  }
  previousSequence = entry.sequence;
  if (entry.curriculumUnit != null) {
    const key = String(entry.curriculumUnit);
    if (seen.has(key)) fail(`curriculum unit ${key} is paced twice (${entry.key})`);
    seen.add(key);
  }
  if (previousEnd && entry.startDate < previousEnd) {
    fail(`${entry.key} starts ${entry.startDate}, before the previous unit ends ${previousEnd}`);
  }
  previousEnd = entry.endDate;
}

// 2. Reconciliation, both directions.
for (const entry of pacing.units || []) {
  if (entry.curriculumUnit == null) continue;
  if (!unitsWithLessons.has(String(entry.curriculumUnit))) {
    fail(
      `${entry.key} paces curriculum unit ${entry.curriculumUnit}, which owns no lessons in the manifest`,
    );
  }
}
for (const unit of unitsWithLessons) {
  if (!seen.has(unit)) {
    fail(
      `curriculum unit ${unit} has lessons but no place in the district plan — the picker will append it, but the plan should say where it goes`,
    );
  }
}

// 3. The resulting order is a real sequence, not a sort.
const order = pacedUnitOrder(pacing, unitsWithLessons);
if (order.length !== unitsWithLessons.size) {
  fail(`the paced order covers ${order.length} of ${unitsWithLessons.size} units with lessons`);
}
if (isNumericOrder(order)) {
  fail(`the unit order is ascending numeric (${order.join(", ")}) — that is a sort, not a plan`);
}
if (isAlphabeticalOrder(order)) {
  fail(`the unit order is alphabetical (${order.join(", ")}) — that is a sort, not a plan`);
}

// 4. Lesson order inside every unit.
const byUnit = new Map();
for (const l of lessons) {
  const key = String(l.unit);
  if (!byUnit.has(key)) byUnit.set(key, []);
  byUnit.get(key).push(l.id);
}
for (const [unit, ids] of byUnit) {
  for (const problem of lexicalLessonBreaks(ids)) {
    fail(`unit ${unit} lists lessons out of instructional order: ${problem}`);
  }
}

// 5. The picker actually consumes the plan.
const picker = readFileSync(join(ROOT, "assets", "curriculum-teacher-planning.js"), "utf8");
if (!picker.includes("/data/pacing-unit-ranges.json")) {
  fail("the hub picker no longer reads the district pacing plan — its Unit order is unsourced");
}
if (/unitOrder\s*\.\s*sort\s*\(/.test(picker)) {
  fail("the hub picker sorts unitOrder, which destroys the district sequence");
}

/* ── Report ────────────────────────────────────────────────────────────────── */

for (const n of notes) console.warn(`   ! ${n}`);
if (failures.length) {
  console.error("✗ validate:pacing-unit-order");
  for (const f of failures) console.error(`   - ${f}`);
  process.exit(1);
}
console.log(
  `✓ district pacing order holds (${order.length} units in plan sequence ${order.join(" → ")}, ` +
    `${lessons.length} lessons in instructional order, ${MUTATIONS.length} mutation tests).`,
);
