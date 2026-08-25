#!/usr/bin/env node
/* =============================================================================
 * import-pacing-baseline.mjs — seed the Live Pacing Planner, ONCE.
 * -----------------------------------------------------------------------------
 * IN   docs/pacing-sources/plan-baseline.json   the validated SY26-27 build
 * OUT  data/pacing-baseline-2026-27.json        the planner's ORIGINAL PLAN
 *
 * This is an IMPORT, not a generator. The pacing plan it reads was built,
 * validated (13/13) and print-QA'd against the two district source documents
 * before this planner existed; re-deriving it here would produce a second
 * schedule that drifts from the DOCX and XLSX Joel already has. The build
 * scripts that produced it are kept beside it in docs/pacing-sources/build/ as
 * provenance.
 *
 * WHAT IS DELIBERATELY DROPPED
 *   lesson title / standard / objective / URLs — all four are re-derived at read
 *   time from data/curriculum-launch-manifest.json. A lesson renamed in the
 *   curriculum must not still read by its old name in the planner, and the only
 *   way to guarantee that is to never store the name here. Only `planTitle`
 *   survives, and only where it carries a PLANNING DECISION the curriculum
 *   cannot state — "— Day 2", "Course Showcase & Reflection", a catch-up span.
 *
 * PROVENANCE is stamped per field group, because a teacher edit made in March
 * must never be overwritten by a re-import (see `origin` in the API).
 *
 * Run: node tools/import-pacing-baseline.mjs [--check]
 * ========================================================================== */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildInstructionalSequence } from "../shared/curriculum/instructional-sequence.js";
import { datesFromRanges } from "./lib/pacing-dates.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(readFileSync(`${ROOT}/${rel}`, "utf8"));

const src = read("docs/pacing-sources/plan-baseline.json");
const launch = read("data/curriculum-launch-manifest.json");
const authoredUnits = read("data/pacing-unit-lessons.json").units || {};

/* Every id the planner may schedule, across all four canonical families. A
 * Catch-Up day names `3-3-catchup` and a Project day names `unit-3-project`;
 * both are real curriculum surfaces with their own page, so both are checked
 * against the manifest exactly as a core lesson is. */
const CANONICAL = new Map(
  [...launch.lessons, ...launch.smallGroups, ...launch.catchUps, ...launch.endOfUnit].map((e) => [
    e.id,
    e,
  ]),
);

/* ── School status ────────────────────────────────────────────────────────────
 * The source encodes the calendar in two prose fields (`status`, `minutes`).
 * They become three orthogonal facts, because the planner asks three separate
 * questions of a date: may I teach on it, is it shortened, and what is it
 * called. Prose collapses those and forces string matching at every call site. */
const STATUS_MAP = {
  "Full Instructional Day": { schoolStatus: "school", eventKind: null },
  "Half Day / Early Release": { schoolStatus: "school", eventKind: "early-release" },
  Break: { schoolStatus: "no-school", eventKind: "break" },
  "Holiday / School Closed": { schoolStatus: "no-school", eventKind: "holiday" },
  "PD — No Students": { schoolStatus: "no-school", eventKind: "pd" },
  "Wellness Day": { schoolStatus: "no-school", eventKind: "wellness-day" },
};

/* Day types the planner treats as instructional content. `No Instruction` is
 * the source's marker for a closed date and never reaches the plan side. */
const DAY_TYPES = new Set([
  "Core Lesson",
  "Continued Lesson",
  "Catch-Up",
  "Review",
  "Assessment",
  "Project",
  "Flex",
  "MCAP / Testing",
]);

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdayOf = (isoDate) => WEEKDAYS[new Date(`${isoDate}T12:00:00Z`).getUTCDay()];

/* Fixed calendar events are protected from the cascade engine. Everything the
 * official calendar states about a date lands here; everything the pacing build
 * decided lands in `plan`. That split IS the protection rule. */
function calendarOf(row) {
  const mapped = STATUS_MAP[row.status];
  if (!mapped) throw new Error(`unknown school status: ${row.status}`);
  const isLastDay = /LAST DAY/i.test(row.cal_note || "");
  return {
    schoolStatus: mapped.schoolStatus,
    eventKind: isLastDay ? "last-day" : mapped.eventKind,
    earlyRelease: row.minutes === "Half Day",
    statusLabel: row.status,
    calendarNote: row.cal_note || null,
  };
}

const MCAP_WINDOW = { start: "2027-03-29", end: "2027-05-28" };

const days = src.rows.map((row) => {
  const cal = calendarOf(row);
  const instructional = cal.schoolStatus === "school";
  const dayType = instructional ? row.day_type : "No Instruction";
  if (instructional && !DAY_TYPES.has(dayType)) {
    throw new Error(`unknown day type on ${row.date}: ${dayType}`);
  }
  const lessonId = row.lesson_id || null;
  if (lessonId && !CANONICAL.has(lessonId)) {
    throw new Error(`${row.date} references ${lessonId}, which is not a canonical curriculum id`);
  }

  /* `planTitle` is kept ONLY when it is not simply the lesson's own title —
   * i.e. only when it encodes a planning decision. Storing the curriculum's
   * title here is what lets a plan go stale behind a curriculum rename. */
  const canonical = lessonId ? CANONICAL.get(lessonId) : null;
  const planTitle = row.title && row.title !== canonical?.title ? row.title : null;

  return {
    date: row.date,
    weekday: weekdayOf(row.date),
    week: row.week,
    quarter: row.quarter,
    ...cal,
    mcapWindow: row.date >= MCAP_WINDOW.start && row.date <= MCAP_WINDOW.end,
    plan: {
      unitKey: row.unit_key || null,
      dayType,
      lessonId,
      planTitle,
      note: row.note || null,
      softDayReason: row.soft_day_reason || null,
    },
  };
});

/* ── THE CALENDAR IS THE INSTRUCTIONAL SEQUENCE, LAID OUT ON DATES ────────────
 *
 * The scope-and-sequence this file imports assigns lessons to days by the
 * curriculum's own unit numbering. That is wrong in two places, and both showed
 * up as a warmup reviewing mathematics nobody had been taught:
 *
 *   1. The Pre-Unit is ASSEMBLED, not inherited. The source schedules 1-1 … 1-6
 *      — the Unit 1 "Math Is…" arc — where the district actually paces a Grade 5
 *      review drawn from several units: 1-1, 2-6, 2-7, 6-1, 6-2. That decision
 *      lives in data/pacing-unit-lessons.json and has since 2026-08-16, but only
 *      the Teach picker read it. The planner kept printing 1-1 … 1-6, so the two
 *      surfaces named different lessons for the same eleven days.
 *
 *   2. A lesson taught early is not taught again. Because the Pre-Unit borrows
 *      2-6, 2-7, 6-1 and 6-2 from Units 2 and 6, those units used to schedule
 *      them a second time in November and April. A lesson scheduled twice has no
 *      single "lesson before it", which is the one thing a warmup needs.
 *
 * So membership comes from shared/curriculum/instructional-sequence.js — first
 * teaching wins, every canonical lesson placed exactly once — and this step lays
 * that sequence onto the dates the district plan already fixed.
 *
 * WHAT IS PRESERVED EXACTLY: every date, every unit boundary, every Review,
 * Assessment, Catch-Up, Flex and Project day, and the number of teaching slots
 * each unit owns. Only WHICH lesson sits on a teaching slot changes.
 *
 * SURPLUS SLOTS become Flex days at the END of the unit's teaching block, with
 * the same shape the plan already uses for its own buffer days. A lesson keeps a
 * second day only where the imported plan already gave it one, so running this
 * over the seven units whose membership did not change reproduces the imported
 * calendar exactly — all 24 of its "— Day 2" rows included. Inventing new second
 * days instead would have shifted every lesson in Unit 2 and stranded the
 * 2-3 Catch-Up day on 4/27 ahead of the lesson it catches up on.
 *
 * More lessons than slots is a real scheduling conflict, and it throws rather
 * than truncating.
 */
const TEACHING_DAY_TYPES = new Set(["Core Lesson", "Continued Lesson"]);
const sequence = buildInstructionalSequence({
  ranges: {
    units: src.units.map((u, i) => ({ ...u, sequence: i + 1, curriculumUnit: u.ewl ?? null })),
  },
  authored: { units: authoredUnits },
  manifest: launch,
});

/** School days, in order, so "the next school day" is a lookup rather than a
 *  date calculation that has to know about weekends and holidays. */
const schoolIndex = new Map();
days.filter((d) => d.schoolStatus === "school").forEach((d, i) => schoolIndex.set(d.date, i));
const isNextSchoolDay = (a, b) => schoolIndex.get(b.date) === schoolIndex.get(a.date) + 1;

for (const unit of src.units) {
  const unitKey = String(unit.key);
  const wanted = sequence.order.filter((id) => sequence.entries.get(id).unitKey === unitKey);
  const slots = days.filter(
    (d) => d.plan.unitKey === unitKey && TEACHING_DAY_TYPES.has(d.plan.dayType),
  );
  if (!slots.length) {
    if (wanted.length) {
      throw new Error(
        `${unitKey} owns ${wanted.length} lesson(s) but the calendar gives it no teaching day`,
      );
    }
    continue; // MSTAR and friends: real days, no lessons.
  }

  /* How many days the IMPORTED plan gave each lesson. A lesson the plan already
   * ran across two days keeps them; nothing else gains a second day here. */
  const plannedDays = new Map();
  for (const slot of slots) {
    const id = slot.plan.lessonId;
    if (id) plannedDays.set(id, (plannedDays.get(id) || 0) + 1);
  }

  const perLesson = wanted.map((id) => Math.min(2, plannedDays.get(id) || 1));
  const needed = perLesson.reduce((a, b) => a + b, 0);
  if (needed > slots.length) {
    throw new Error(
      `${unitKey} needs ${needed} teaching days for ${wanted.length} lessons but the calendar ` +
        `holds ${slots.length} — the plan cannot fit the sequence`,
    );
  }

  let at = 0;
  wanted.forEach((lessonId, index) => {
    /* A second day must land on the NEXT school day. Unit 2 has a Catch-Up day
     * sitting inside its teaching block, so two consecutive teaching slots there
     * are not two consecutive school days; a continuation across that gap would
     * read as continuing the catch-up. Drop such a lesson to one day and let the
     * spare slot become Flex. */
    let dayCount = perLesson[index];
    if (dayCount === 2 && !(slots[at + 1] && isNextSchoolDay(slots[at], slots[at + 1]))) {
      dayCount = 1;
    }
    const title = CANONICAL.get(lessonId)?.title || lessonId;
    for (let day = 1; day <= dayCount; day++) {
      const slot = slots[at++];
      slot.plan.lessonId = lessonId;
      slot.plan.dayType = day === 1 ? "Core Lesson" : "Continued Lesson";
      /* A multi-day lesson names its day, because that IS a planning decision.
       * A single-day lesson carries no planTitle at all — storing the
       * curriculum's own title here is exactly what lets a plan go stale behind
       * a rename. */
      slot.plan.planTitle = dayCount > 1 ? `${title} — Day ${day}` : null;
    }
  });

  for (; at < slots.length; at++) {
    const slot = slots[at];
    slot.plan.lessonId = null;
    slot.plan.dayType = "Flex";
    slot.plan.planTitle = "Flex / Catch-Up";
    slot.plan.note = "Unassigned buffer — absorb slippage or extend a lesson";
  }
}

/* Nothing may reference a lesson the sequence does not schedule. A Catch-Up day
 * for a lesson that moved out of this unit is an orphan, and the surface it
 * links to would open on mathematics the class has not reached. */
for (const day of days) {
  const id = day.plan.lessonId;
  if (!id) continue;
  const base = id.replace(/-(catchup|group\d+)$/, "");
  if (base !== id && !sequence.entries.has(base)) {
    throw new Error(`${day.date} schedules ${id}, whose lesson ${base} is not in the sequence`);
  }
}

/* ── Units ─────────────────────────────────────────────────────────────────── */

const units = src.units.map((u, i) => ({
  key: u.key,
  sequence: i + 1,
  districtLabel: u.label,
  curriculumUnit: u.ewl ?? null,
  budgetDays: u.budget,
  assessmentMarker: u.marker || null,
  plannedStart: u.start,
  plannedEnd: u.end,
  plannedSlots: u.slots,
}));

/* ── Assumptions ───────────────────────────────────────────────────────────────
 * Lifted verbatim from the planning notes that shipped with the DOCX, because a
 * teacher reading "why is Statistics in May?" in the planner should get the same
 * answer the printed calendar gives. Tags follow the notes: SOURCE (read from a
 * district document), INFERRED (a planning decision), CONFIRM (needs a human). */
const ASSUMPTIONS = [
  [
    "The Pre-Unit is ASSEMBLED (1-1, 2-6, 2-7, 6-1, 6-2), not EduWonderLab Unit 1 — its membership is authored in data/pacing-unit-lessons.json and projected onto these dates",
    "SOURCE authored / reviewed 2026-08-16",
  ],
  ["Component counts are a day budget, not a lesson count", "INFERRED"],
  [
    "The 2.5-day calendar shortfall is absorbed by Unit 4 (−1.0) and Unit 5 (−1.5) flex",
    "INFERRED",
  ],
  ["One class period per unit assessment", "INFERRED/CONFIRM"],
  ["Two consecutive days per culminating project", "INFERRED/CONFIRM"],
  ["One Review day immediately before each unit assessment", "INFERRED"],
  ["Surplus unit days go to catch-up stations, then lesson second days, then flex", "INFERRED"],
  ["A lesson gets at most 2 days", "INFERRED"],
  ["No new content launches on a half day", "INFERRED"],
  ["No multi-day lesson straddles a long break", "INFERRED"],
  ["Quarter end dates are the day before the next quarter start", "INFERRED"],
  [
    "The MSTAR block sits where the scope and sequence places it (May 18–28), not on real testing dates",
    "SOURCE placement / CONFIRM dates",
  ],
  ["Jun 11 (half day, last day) is a course showcase, not project work", "INFERRED"],
  ["The first week extends Lesson 1.1 across two days for routines and math community", "INFERRED"],
  [
    "A lesson taught early in the Pre-Unit is not taught again in its home unit, so Unit 6 opens on 6-3 and Unit 2 runs 2-5 → 2-8",
    "INFERRED",
  ],
  [
    "Teaching days the sequence does not fill become Flex days at the end of the unit's lesson block",
    "INFERRED",
  ],
];

/* ── Quarters ──────────────────────────────────────────────────────────────── */

const quarters = ["Q1", "Q2", "Q3", "Q4"].map((q) => {
  const inQ = days.filter((d) => d.quarter === q);
  return {
    quarter: q,
    start: inQ[0].date,
    end: inQ[inQ.length - 1].date,
    schoolDays: inQ.filter((d) => d.schoolStatus === "school").length,
  };
});

const out = {
  note: "GENERATED by tools/import-pacing-baseline.mjs from docs/pacing-sources/plan-baseline.json — do not hand-edit. This is the ORIGINAL PLAN; live changes live in D1 via /api/pacing.",
  schemaVersion: 1,
  schoolYear: "2026-2027",
  course: "Course 1 · Grade 6 Mathematics",
  provenance: {
    officialCalendar: "docs/pacing-sources/sy2026-27-school-calendar.docx",
    scopeAndSequence: "docs/pacing-sources/course-1-scope-and-sequence.xls",
    canonicalCurriculum: "data/curriculum-launch-manifest.json",
    planningNotes: "docs/pacing-sources/planning-notes.md",
    buildScripts: "docs/pacing-sources/build/",
  },
  firstStudentDay: days[0].date,
  lastStudentDay: days[days.length - 1].date,
  mcapWindow: MCAP_WINDOW,
  quarters,
  totals: {
    dates: days.length,
    schoolDays: days.filter((d) => d.schoolStatus === "school").length,
    earlyReleaseDays: days.filter((d) => d.earlyRelease).length,
    byDayType: Object.fromEntries(
      [...new Set(days.map((d) => d.plan.dayType))]
        .sort()
        .map((t) => [t, days.filter((d) => d.plan.dayType === t).length]),
    ),
  },
  assumptions: ASSUMPTIONS.map(([text, tag]) => ({ text, tag })),
  sourceValidation: src.validation.map(([check, result, detail]) => ({ check, result, detail })),
  baselineMoves: src.moves.map(([from, to, what]) => ({ from, to, what })),
  units,
  days,
};

/* A tiny second output, for ONE reason: /curriculum/units/ shows district unit
 * date ranges and used to carry its own hardcoded copy of them inside
 * assets/curriculum-district-pacing.js — dates that already disagreed with the
 * validated plan (the Pre-Unit ran to 9/10 there and 9/8 here). Making the
 * student-facing hub fetch the whole 400 KB baseline to fix that would trade a
 * correctness bug for a performance one, so the ranges are emitted separately.
 * Both files come from this one run, so they cannot drift from each other.
 *
 * A third output compiles those same ranges into a blocking hub script so
 * `NTDistrictPacing.today()` is correct even before (and without) the fetch.
 * The inline crosswalk dates are no longer an independently editable calendar. */
const ranges = {
  note: "GENERATED by tools/import-pacing-baseline.mjs — do not hand-edit. The unit date ranges of the ORIGINAL plan, for /curriculum/units/. Live pacing changes live in the planner.",
  schemaVersion: 1,
  schoolYear: out.schoolYear,
  units: units.map((u) => {
    const mine = days.filter((d) => d.plan.unitKey === u.key && d.schoolStatus === "school");
    return {
      sequence: u.sequence,
      key: u.key,
      districtLabel: u.districtLabel,
      curriculumUnit: u.curriculumUnit,
      startDate: mine[0]?.date ?? null,
      endDate: mine[mine.length - 1]?.date ?? null,
      instructionalDays: mine.length,
      budgetDays: u.budgetDays,
    };
  }),
};

const text = `${JSON.stringify(out, null, 2)}\n`;
const rangesText = `${JSON.stringify(ranges, null, 2)}\n`;
const path = `${ROOT}/data/pacing-baseline-2026-27.json`;
const rangesPath = `${ROOT}/data/pacing-unit-ranges.json`;
const datesJsPath = `${ROOT}/assets/pacing-unit-dates.generated.js`;

/* The hub needs the same dates synchronously, before fetch, so a failed
 * `/data/pacing-unit-ranges.json` load cannot open the wrong unit. This file
 * is compiled from `ranges` in the same run, then Biome-formatted so
 * `npm run check` and `--check` agree (same reason generate-plan-vocab does). */
const datesJsRaw = `/* GENERATED by tools/import-pacing-baseline.mjs — do not hand-edit.
 * Fallback unit date ranges for the curriculum hub. Byte-equivalent in meaning
 * to data/pacing-unit-ranges.json from this same import. Live pacing changes
 * live in the planner (D1), not here.
 */
window.__NT_PACING_DATES = ${JSON.stringify(datesFromRanges(ranges), null, 2)};
`;
const datesJsText = execFileSync("npx", ["biome", "format", `--stdin-file-path=${datesJsPath}`], {
  input: datesJsRaw,
  encoding: "utf8",
  cwd: ROOT,
});

const OUTPUTS = [
  [path, text, "data/pacing-baseline-2026-27.json"],
  [rangesPath, rangesText, "data/pacing-unit-ranges.json"],
  [datesJsPath, datesJsText, "assets/pacing-unit-dates.generated.js"],
];

if (process.argv.includes("--check")) {
  let stale = false;
  for (const [file, expected, label] of OUTPUTS) {
    let current = null;
    try {
      current = readFileSync(file, "utf8");
    } catch {
      /* missing counts as stale */
    }
    if (current !== expected) {
      console.error(`FAIL ${label} is stale — run node tools/import-pacing-baseline.mjs`);
      stale = true;
    } else {
      console.log(`ok   ${label}`);
    }
  }
  process.exit(stale ? 1 : 0);
} else {
  for (const [file, body] of OUTPUTS) writeFileSync(file, body);
  console.log(
    `wrote data/pacing-baseline-2026-27.json — ${out.totals.dates} dates, ${out.totals.schoolDays} school days, ${units.length} units`,
  );
  console.log(`wrote data/pacing-unit-ranges.json and assets/pacing-unit-dates.generated.js`);
}
