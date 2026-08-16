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

/**
 * The lessons a dated plan actually TEACHES under one pacing unit key, in the
 * order it teaches them.
 *
 * This exists because the authored sequence had two rendering surfaces checked
 * against it — the hub picker and the district crosswalk — and the one surface
 * nobody compared was the dated plan itself. So the Teach dropdown offered
 * 1-1, 2-6, 2-7, 6-1, 6-2 while the planner, the pacing guide and every
 * Today/Week/Month/Year view still scheduled 1-1 … 1-6: two Pre-Units in
 * production, disagreeing, with neither able to see the other.
 *
 * Sorted by date rather than trusting file order, so a re-import that emits the
 * rows in a different order is compared on what a teacher would teach.
 * Consecutive repeats collapse: a lesson held over a second day is one lesson.
 */
export function scheduledLessonSequence(days, unitKey) {
  const out = [];
  const mine = (days || [])
    .filter((d) => d?.plan?.unitKey === unitKey && d.plan.dayType === "Core Lesson")
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  for (const d of mine) {
    const id = d.plan.lessonId;
    if (!id || out[out.length - 1] === id) continue;
    out.push(id);
  }
  return out;
}

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
  /* The dated-plan detector. Each case is a way the Pre-Unit disagreement could
   * come back and be reported as agreement. */
  [
    "the scheduled sequence is read in date order, not file order",
    () =>
      scheduledLessonSequence(
        [
          { date: "2026-08-27", plan: { unitKey: "PRE", dayType: "Core Lesson", lessonId: "2-7" } },
          { date: "2026-08-26", plan: { unitKey: "PRE", dayType: "Core Lesson", lessonId: "2-6" } },
        ],
        "PRE",
      ).join() === "2-6,2-7",
  ],
  [
    "only Core Lesson days count toward the sequence",
    () =>
      scheduledLessonSequence(
        [
          { date: "2026-08-26", plan: { unitKey: "PRE", dayType: "Core Lesson", lessonId: "2-6" } },
          {
            date: "2026-09-01",
            plan: { unitKey: "PRE", dayType: "Catch-Up", lessonId: "6-2-catchup" },
          },
          { date: "2026-09-02", plan: { unitKey: "PRE", dayType: "Review", lessonId: null } },
        ],
        "PRE",
      ).join() === "2-6",
  ],
  [
    "another unit's days never leak into the sequence",
    () =>
      scheduledLessonSequence(
        [
          { date: "2026-08-26", plan: { unitKey: "PRE", dayType: "Core Lesson", lessonId: "2-6" } },
          { date: "2026-11-05", plan: { unitKey: "U6", dayType: "Core Lesson", lessonId: "6-1" } },
        ],
        "PRE",
      ).join() === "2-6",
  ],
  [
    "a lesson held over a second day is still one lesson",
    () =>
      scheduledLessonSequence(
        [
          { date: "2026-08-24", plan: { unitKey: "PRE", dayType: "Core Lesson", lessonId: "1-1" } },
          { date: "2026-08-25", plan: { unitKey: "PRE", dayType: "Core Lesson", lessonId: "1-1" } },
          { date: "2026-08-26", plan: { unitKey: "PRE", dayType: "Core Lesson", lessonId: "2-6" } },
        ],
        "PRE",
      ).join() === "1-1,2-6",
  ],
  [
    "a re-ordered plan does not match the authored sequence",
    () =>
      scheduledLessonSequence(
        [
          { date: "2026-08-26", plan: { unitKey: "PRE", dayType: "Core Lesson", lessonId: "2-7" } },
          { date: "2026-08-27", plan: { unitKey: "PRE", dayType: "Core Lesson", lessonId: "2-6" } },
        ],
        "PRE",
      ).join() !== "2-6,2-7",
  ],
  [
    "the exact disagreement this gate was written for is caught",
    () =>
      scheduledLessonSequence(
        ["1-1", "1-2", "1-3", "1-4", "1-5", "1-6"].map((id, i) => ({
          date: `2026-08-${24 + i}`,
          plan: { unitKey: "PRE", dayType: "Core Lesson", lessonId: id },
        })),
        "PRE",
      ).join() !== "1-1,2-6,2-7,6-1,6-2",
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

/* 5. AUTHORED UNIT MEMBERSHIP — one definition, resolved against the manifest.
 *
 * Some paced units are ASSEMBLED rather than inherited from the curriculum's
 * numbering. The Pre-Unit is one: a Grade 5 review sequence drawn from several
 * canonical units. Before data/pacing-unit-lessons.json existed there were TWO
 * definitions of it rendering on the same page — the Teach picker derived
 * 1-1 … 1-6 from the `unit` field, while assets/curriculum-district-pacing.js
 * carried its own hardcoded nine-lesson list. Neither knew about the other.
 *
 * This holds the single source and the two consumers together. */
const authored = read("data/pacing-unit-lessons.json");
const manifestIds = new Set(lessons.map((l) => l.id));
const byId = new Map(lessons.map((l) => [l.id, l]));
const pacedKeys = new Set((pacing.units || []).map((u) => u.key));

for (const [key, entry] of Object.entries(authored.units || {})) {
  if (!pacedKeys.has(key)) {
    fail(`data/pacing-unit-lessons.json authors "${key}", which the pacing plan does not schedule`);
  }
  if (!entry.reason || entry.reason.length < 40) {
    fail(`authored unit "${key}" has no substantive reason — an assembled unit must say why`);
  }
  if (!Array.isArray(entry.lessons) || entry.lessons.length === 0) {
    fail(`authored unit "${key}" lists no lessons`);
    continue;
  }
  if (new Set(entry.lessons).size !== entry.lessons.length) {
    fail(`authored unit "${key}" lists a lesson twice`);
  }
  for (const id of entry.lessons) {
    if (!manifestIds.has(id)) {
      fail(`authored unit "${key}" lists ${id}, which the curriculum manifest does not have`);
    }
  }
  /* Ids only. A title stored here is a second source of truth that goes stale
   * the moment the curriculum is renamed. */
  const blob = JSON.stringify(entry.lessons);
  for (const id of entry.lessons) {
    const title = byId.get(id)?.title;
    if (title && blob.includes(title)) {
      fail(`authored unit "${key}" stores the title for ${id}; store ids only`);
    }
  }
}

/* The district-pacing crosswalk must agree with the authored sequence, exactly,
 * and its inline titles/standards for those lessons must match the manifest. */
{
  const src = readFileSync(join(ROOT, "assets/curriculum-district-pacing.js"), "utf8");
  for (const [key, entry] of Object.entries(authored.units || {})) {
    const paced = (pacing.units || []).find((u) => u.key === key);
    const label = paced?.districtLabel?.split(":")[0];
    if (!label) continue;
    /* Match on letters and digits only: the pacing plan says "Pre-Unit" and the
     * crosswalk says "Pre Unit". A literal comparison reported "not checked",
     * which is the safe failure but still leaves the two files unchecked. */
    const squash = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
    const titles = [...src.matchAll(/district_title: "([^"]+)"/g)];
    const hit = titles.find((m) => squash(m[1]).startsWith(squash(label)));
    if (!hit) {
      fail(`the district-pacing crosswalk has no entry for "${label}" — it cannot be reconciled`);
      continue;
    }
    const at = hit.index;
    const block = src.slice(at, src.indexOf("sequence:", at + 10));
    /* Formatting-independent: Biome wraps a long entry across lines, so the ids
     * are matched on `id:` alone rather than on `{ id:` with its brace and
     * spacing. A brittle regex here reports a drift that is only a reflow. */
    const ids = [...block.matchAll(/\bid:\s*"([0-9]+-[0-9]+)"/g)].map((m) => m[1]);
    if (ids.join(",") !== entry.lessons.join(",")) {
      fail(
        `the district-pacing crosswalk lists [${ids.join(", ")}] for ${key} but the authored ` +
          `sequence is [${entry.lessons.join(", ")}] — two definitions of the same unit`,
      );
    }
    /* No title-equality check here any more, and its absence is the point: the
     * crosswalk no longer STORES titles for canonical lessons, so there is
     * nothing to compare. Check 6 below enforces that structurally, which is
     * strictly stronger than asserting two copies agree. */
  }
}

/* 6. NO DUPLICATED CURRICULUM METADATA IN THE PACING CROSSWALK.
 *
 * assets/curriculum-district-pacing.js carried an inline title and standards for
 * all 59 canonical lessons. They were copies, so they drifted: 2-6 read "Divide
 * Multi-Digit Whole Numbers (Computation Bridge)" against a manifest saying
 * "Divide Multi-Digit Numbers Using an Algorithm", with the 2010 code 6.NS.B.2
 * against a registry re-coded to 6.NOS.2.
 *
 * This is STRUCTURAL prevention rather than an equality list: a list of 59
 * expected titles is itself a duplicate that goes stale. A canonical lesson entry
 * must be an id and nothing else, so there is nowhere for a stale copy to live.
 *
 * Two things stay inline on purpose and are exempt: the unit's `district_title`
 * (pacing owns the district's own name for a unit) and the MSTAR prep entries,
 * whose ids are not canonical lessons and have no manifest counterpart. */
{
  const src = readFileSync(join(ROOT, "assets/curriculum-district-pacing.js"), "utf8");
  const blocks = [...src.matchAll(/lessons:\s*\[([\s\S]*?)\]\s*,?\n/g)];
  if (!blocks.length) fail("could not read any lessons block out of the pacing crosswalk");

  for (const [, block] of blocks) {
    for (const entry of block.matchAll(/\{\s*id:\s*"([^"]+)"([^}]*)\}/g)) {
      const [, id, rest] = entry;
      const canonical = /^[0-9]+-[0-9]+$/.test(id);
      if (!canonical) continue; // MSTAR: pacing-owned, no manifest counterpart.
      if (/title\s*:/.test(rest) || /standards\s*:/.test(rest)) {
        fail(
          `the pacing crosswalk stores metadata for canonical lesson ${id}. Canonical ` +
            `entries must be { id } only — title and standards resolve from the manifest ` +
            `at render time, which is the only way they cannot go stale.`,
        );
      }
      if (!manifestIds.has(id)) {
        fail(`the pacing crosswalk lists ${id}, which the curriculum manifest does not have`);
      }
    }
  }

  /* And the resolution step must still be wired: id-only entries with no
   * reconcile would render "Lesson 3-1" with no title at all. */
  if (!/curriculum-launch-manifest\.json/.test(src)) {
    fail(
      "the pacing crosswalk no longer loads the curriculum manifest, so its id-only " +
        "lesson entries have nothing to resolve their titles from",
    );
  }
  if (!/lesson\.title = canonical\.title/.test(src)) {
    fail("the pacing crosswalk loads the manifest but no longer assigns canonical titles");
  }
}

/* 7. THE DATED PLAN IS A SURFACE OF THE AUTHORED SEQUENCE TOO.
 *
 * Checks 5 and 6 hold the hub picker and the district crosswalk to
 * data/pacing-unit-lessons.json. Neither of them is what a teacher teaches
 * from. The plan in data/pacing-baseline-2026-27.json is — it drives the
 * planner's Today, Week, Month, Units and Year views, and the printed pacing
 * guide — and until this check existed nothing compared it to the authored
 * sequence at all. The Pre-Unit was corrected in the picker and left wrong in
 * the plan for the whole of that window; the two could not see each other. */
{
  const baseline = read("data/pacing-baseline-2026-27.json");
  for (const [key, entry] of Object.entries(authored.units || {})) {
    const taught = scheduledLessonSequence(baseline.days, key);
    if (!taught.length) {
      fail(
        `the dated plan schedules no lessons under "${key}", but ${key} has an authored sequence — ` +
          `the plan and data/pacing-unit-lessons.json cannot both be describing this unit`,
      );
      continue;
    }
    if (taught.join(",") !== entry.lessons.join(",")) {
      fail(
        `the dated plan teaches [${taught.join(", ")}] for ${key} but the authored sequence is ` +
          `[${entry.lessons.join(", ")}]. The Teach dropdown and the pacing guide would show ` +
          `different Pre-Units. Repair the SOURCE (docs/pacing-sources/plan-baseline.json) and ` +
          `re-run \`node tools/import-pacing-baseline.mjs\` — never hand-edit the generated plan.`,
      );
    }
  }
}

// 8. The picker actually consumes the plan.
const picker = readFileSync(join(ROOT, "assets", "curriculum-teacher-planning.js"), "utf8");
if (!picker.includes("/data/pacing-unit-lessons.json")) {
  fail("the hub picker no longer reads the authored unit sequences");
}
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
