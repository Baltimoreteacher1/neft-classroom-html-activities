/* Tests for the pacing engine and the baseline it runs on.
 *
 * Two halves, deliberately:
 *   1. CALENDAR + BASELINE — facts about the real SY26-27 data, so a bad
 *      re-import cannot pass. These read the shipped JSON, not a fixture.
 *   2. ENGINE — behaviour, on small hand-built years where the barrier under
 *      test is the only thing in the way. A cascade test run on the real year
 *      proves the real year, not the rule.
 *
 * The negative cases matter more than the positive ones here. A cascade that
 * quietly walks through a locked assessment is worse than one that refuses to
 * run, so each safeguard has a test that FAILS if the safeguard stops firing.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  continueTomorrow,
  convertFlex,
  flexCapacity,
  insertAt,
  moveEarlier,
  moveLater,
  moveToDate,
  pacingPosition,
  resolveYear,
  toWrites,
  unitSummary,
} from "./engine.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const baseline = JSON.parse(readFileSync(`${ROOT}/data/pacing-baseline-2026-27.json`, "utf8"));
const launch = JSON.parse(readFileSync(`${ROOT}/data/curriculum-launch-manifest.json`, "utf8"));
/* The authored sequences for units the district ASSEMBLES rather than inherits
 * from the curriculum's numbering, plus the lessons that displaces. Read here so
 * the exceptions below are checked against a reviewed decision rather than
 * against a list retyped into this file. */
const authored = JSON.parse(readFileSync(`${ROOT}/data/pacing-unit-lessons.json`, "utf8"));

/* ════════════════════════════════════════════════════════════════════════════
 * 1. Calendar correctness — the official calendar, as shipped
 * ══════════════════════════════════════════════════════════════════════════ */

test("first and last student day match the official calendar", () => {
  assert.equal(baseline.firstStudentDay, "2026-08-24");
  assert.equal(baseline.lastStudentDay, "2027-06-11");
});

test("every planned date is a weekday", () => {
  const weekend = baseline.days.filter((d) => d.weekday === "Sat" || d.weekday === "Sun");
  assert.deepEqual(weekend, [], "the school year contains no weekend dates");
});

test("dates are unique and strictly ascending", () => {
  const dates = baseline.days.map((d) => d.date);
  assert.equal(new Set(dates).size, dates.length, "no date appears twice");
  assert.deepEqual(dates, [...dates].sort(), "dates are in order");
});

test("every closure the calendar names is closed, and nothing is taught on it", () => {
  /* Read straight off the source calendar document. If a re-import ever loses
   * one of these, a lesson lands on a day with no students in it. */
  const closed = {
    "2026-09-07": "holiday", // Labor Day
    "2026-09-21": "wellness-day",
    "2026-10-16": "pd", // BTU / PSASA / Quest
    "2026-11-03": "holiday", // Election Day
    "2026-11-06": "pd",
    "2026-11-25": "wellness-day",
    "2026-11-26": "holiday", // Thanksgiving
    "2026-11-27": "holiday",
    "2026-12-23": "break",
    "2027-01-01": "break",
    "2027-01-08": "pd",
    "2027-01-18": "holiday", // MLK
    "2027-02-05": "pd",
    "2027-02-15": "holiday", // Presidents' Day
    "2027-03-05": "pd",
    "2027-03-10": "wellness-day",
    "2027-03-26": "break", // Spring Break opens
    "2027-04-02": "break", // Spring Break closes
    "2027-05-07": "pd",
    "2027-05-31": "holiday", // Memorial Day
  };
  for (const [date, kind] of Object.entries(closed)) {
    const day = baseline.days.find((d) => d.date === date);
    assert.ok(day, `${date} is missing from the calendar`);
    assert.equal(day.schoolStatus, "no-school", `${date} must be a no-school day`);
    assert.equal(day.eventKind, kind, `${date} should be a ${kind}`);
    assert.equal(day.plan.lessonId, null, `nothing may be scheduled on ${date}`);
    assert.equal(day.plan.dayType, "No Instruction");
  }
});

test("the five early-release days are the ones the calendar prints", () => {
  const early = baseline.days.filter((d) => d.earlyRelease).map((d) => d.date);
  assert.deepEqual(early, [
    "2026-10-15",
    "2026-10-23",
    "2027-01-15",
    "2027-03-25",
    "2027-06-11",
  ]);
});

test("quarter boundaries match the calendar's printed quarter starts", () => {
  assert.deepEqual(
    baseline.quarters.map((q) => [q.quarter, q.start, q.end]),
    [
      ["Q1", "2026-08-24", "2026-10-23"],
      ["Q2", "2026-10-26", "2027-01-18"],
      ["Q3", "2027-01-19", "2027-04-02"],
      ["Q4", "2027-04-05", "2027-06-11"],
    ],
  );
});

test("the MCAP window covers exactly the dates the calendar states", () => {
  assert.deepEqual(baseline.mcapWindow, { start: "2027-03-29", end: "2027-05-28" });
  for (const d of baseline.days) {
    const inside = d.date >= "2027-03-29" && d.date <= "2027-05-28";
    assert.equal(d.mcapWindow, inside, `${d.date} MCAP flag`);
  }
});

test("180 instructional dates, of which 5 are shortened", () => {
  assert.equal(baseline.totals.schoolDays, 180);
  assert.equal(baseline.totals.earlyReleaseDays, 5);
});

/* ════════════════════════════════════════════════════════════════════════════
 * 2. Canonical mapping — the plan points at curriculum that exists
 * ══════════════════════════════════════════════════════════════════════════ */

/* This used to read "all 84 canonical lessons are scheduled exactly once", which
 * was true of a plan whose Pre-Unit was INFERRED to be the Unit 1 arc. The
 * confirmed Pre-Unit is assembled: it borrows 2-6, 2-7, 6-1 and 6-2 for August
 * prerequisite fluency while Units 2 and 6 still teach them in place, and it
 * displaces 1-2 … 1-6, which the district paces nowhere.
 *
 * "Exactly once" cannot state that, so it is replaced rather than relaxed — and
 * the replacement is tighter, because both exceptions must be DECLARED in
 * data/pacing-unit-lessons.json rather than merely tolerated. A lesson that
 * falls out of the plan, or gets scheduled twice, with no authored entry
 * behind it still fails here. */
test("every scheduled lesson is canonical, and repeats are only authored borrowings", () => {
  const core = baseline.days
    .filter((d) => d.plan.dayType === "Core Lesson")
    .map((d) => d.plan.lessonId);
  const canonical = new Set(launch.lessons.map((l) => l.id));
  assert.equal(canonical.size, 84);
  for (const id of core) assert.ok(canonical.has(id), `${id} is a canonical lesson`);

  const borrowable = new Set(Object.values(authored.units).flatMap((u) => u.lessons));
  const counts = new Map();
  for (const id of core) counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const [id, n] of counts) {
    if (n === 1) continue;
    assert.ok(
      borrowable.has(id),
      `${id} is scheduled ${n} times but no assembled unit authors it — that is a duplicate, not a borrowing`,
    );
  }
});

test("the lessons the plan never schedules are exactly the declared displaced set", () => {
  const scheduled = new Set(
    baseline.days.filter((d) => d.plan.dayType === "Core Lesson").map((d) => d.plan.lessonId),
  );
  const unscheduled = launch.lessons.map((l) => l.id).filter((id) => !scheduled.has(id));
  const declared = Object.keys(authored.displaced ?? {});
  /* Both directions. A lesson dropped from the plan with no declaration is a
   * lesson taught nowhere that nobody decided to stop teaching; a declaration
   * for a lesson the plan does teach is a stale absolution. */
  assert.deepEqual(
    [...unscheduled].sort(),
    [...declared].sort(),
    "the plan's unscheduled lessons and data/pacing-unit-lessons.json's `displaced` block disagree",
  );
  for (const [id, reason] of Object.entries(authored.displaced ?? {})) {
    assert.ok(
      typeof reason === "string" && reason.length >= 20,
      `displaced lesson ${id} has no substantive reason`,
    );
  }
});

test("every scheduled id resolves to a real curriculum surface", () => {
  const known = new Set(
    [...launch.lessons, ...launch.smallGroups, ...launch.catchUps, ...launch.endOfUnit].map(
      (e) => e.id,
    ),
  );
  for (const d of baseline.days) {
    if (!d.plan.lessonId) continue;
    assert.ok(known.has(d.plan.lessonId), `${d.date} → ${d.plan.lessonId} exists in the manifest`);
  }
});

test("lesson order is preserved within every unit", () => {
  /* Scoped to each unit's OWN paced block. An assembled unit teaches lessons out
   * of their home unit's numbering on purpose — the Pre-Unit runs 2-6 in August
   * and Unit 2 still opens with 2-1 in April — so walking the whole year in one
   * pass reports that intent as a violation. The assembled sequences have their
   * own order check: validate:pacing-unit-order, against the authored file. */
  const assembled = new Set(Object.keys(authored.units));
  const seen = new Map();
  for (const d of baseline.days) {
    if (d.plan.dayType !== "Core Lesson") continue;
    if (assembled.has(d.plan.unitKey)) continue;
    const lesson = launch.lessons.find((l) => l.id === d.plan.lessonId);
    const prev = seen.get(lesson.unit);
    if (prev !== undefined) {
      assert.ok(
        lesson.lesson > prev,
        `unit ${lesson.unit}: ${d.plan.lessonId} comes after lesson ${prev}`,
      );
    }
    seen.set(lesson.unit, lesson.lesson);
  }
  assert.ok(seen.size >= 9, "the order check walked almost no units — it has stopped looking");
});

test("no lesson title is stored in the baseline — titles come from the curriculum", () => {
  /* A stored title is how a plan keeps showing a name the curriculum has since
   * changed. planTitle survives only where it states a planning decision. */
  const titles = new Map(launch.lessons.map((l) => [l.id, l.title]));
  for (const d of baseline.days) {
    if (!d.plan.planTitle || !d.plan.lessonId) continue;
    assert.notEqual(
      d.plan.planTitle,
      titles.get(d.plan.lessonId),
      `${d.date} stores the curriculum's own title for ${d.plan.lessonId}`,
    );
  }
});

test("continued lessons are contiguous with the lesson they continue", () => {
  const school = baseline.days.filter((d) => d.schoolStatus === "school");
  for (let i = 0; i < school.length; i++) {
    if (school[i].plan.dayType !== "Continued Lesson") continue;
    assert.ok(i > 0, "a continuation cannot be the first day of the year");
    assert.equal(
      school[i - 1].plan.lessonId,
      school[i].plan.lessonId,
      `${school[i].date} continues the previous instructional day`,
    );
  }
});

test("no new content launches on a shortened day", () => {
  for (const d of baseline.days) {
    if (!d.earlyRelease) continue;
    assert.notEqual(d.plan.dayType, "Core Lesson", `${d.date} is a half day`);
    assert.notEqual(d.plan.dayType, "Assessment", `${d.date} is a half day`);
  }
});

test("every unit the scope and sequence marks has an assessment day", () => {
  for (const u of baseline.units) {
    if (!u.assessmentMarker) continue;
    const has = baseline.days.some((d) => d.plan.unitKey === u.key && d.plan.dayType === "Assessment");
    assert.ok(has, `${u.key} has an assessment day`);
  }
});

/* ════════════════════════════════════════════════════════════════════════════
 * 3. Engine behaviour
 * ══════════════════════════════════════════════════════════════════════════ */

/** A small hand-built year. `spec` is one entry per date: a day type, `X` for a
 * closed day, or `L:<type>` for a locked one. */
function year(spec) {
  return spec.map((s, i) => {
    const locked = s.startsWith("L:");
    const type = locked ? s.slice(2) : s;
    const closed = type === "X";
    return {
      date: `2026-09-${String(i + 1).padStart(2, "0")}`,
      weekday: "Mon",
      week: 1,
      quarter: i < spec.length / 2 ? "Q1" : "Q2",
      schoolStatus: closed ? "no-school" : "school",
      eventKind: closed ? "holiday" : null,
      earlyRelease: false,
      statusLabel: closed ? "Holiday / School Closed" : "Full Instructional Day",
      calendarNote: null,
      mcapWindow: false,
      original: { dayType: closed ? "No Instruction" : type, lessonId: closed ? null : `id-${i}` },
      plan: { dayType: closed ? "No Instruction" : type, lessonId: closed ? null : `id-${i}` },
      actual: null,
      note: null,
      locked,
      updatedAt: null,
      origin: "planning-decision",
    };
  });
}

const at = (op, date) => op.changes.find((c) => c.date === date);

test("a ripple stops at the first Flex day", () => {
  const days = year(["Core Lesson", "Core Lesson", "Core Lesson", "Flex", "Core Lesson"]);
  const op = moveLater(days, "2026-09-01");
  assert.equal(op.ok, true);
  assert.equal(op.absorbedAt, "2026-09-04");
  assert.equal(at(op, "2026-09-01").to.dayType, "Lost Day");
  assert.equal(at(op, "2026-09-02").to.lessonId, "id-0", "day 1's lesson lands on day 2");
  assert.equal(at(op, "2026-09-03").to.lessonId, "id-1");
  assert.equal(at(op, "2026-09-04").to.lessonId, "id-2");
  assert.equal(at(op, "2026-09-05"), undefined, "nothing past the flex day moves");
});

test("a Catch-Up day absorbs a ripple just as a Flex day does", () => {
  const days = year(["Core Lesson", "Core Lesson", "Catch-Up", "Core Lesson"]);
  const op = moveLater(days, "2026-09-01");
  assert.equal(op.absorbedAt, "2026-09-03");
  assert.equal(at(op, "2026-09-04"), undefined);
});

test("NEGATIVE: a cascade never moves a locked assessment", () => {
  const days = year(["Core Lesson", "Core Lesson", "L:Assessment", "Flex"]);
  const op = moveLater(days, "2026-09-01");
  assert.equal(op.ok, true);
  assert.deepEqual(op.routedAround, ["2026-09-03"]);
  assert.equal(at(op, "2026-09-03"), undefined, "the locked assessment is untouched");
  assert.equal(at(op, "2026-09-04").to.lessonId, "id-1", "the ripple resumed after it");
  assert.equal(op.absorbedAt, "2026-09-04");
});

test("NEGATIVE: nothing is ever scheduled onto a closed day", () => {
  const days = year(["Core Lesson", "X", "X", "Core Lesson", "Flex"]);
  const op = moveLater(days, "2026-09-01");
  assert.equal(at(op, "2026-09-02"), undefined);
  assert.equal(at(op, "2026-09-03"), undefined);
  assert.equal(at(op, "2026-09-04").to.lessonId, "id-0");
  for (const c of op.changes) {
    const day = days.find((d) => d.date === c.date);
    if (c.to.lessonId) assert.equal(day.schoolStatus, "school", `${c.date} is a school day`);
  }
});

test("NEGATIVE: moving onto a closed day is refused with a reason", () => {
  const days = year(["Core Lesson", "X", "Core Lesson"]);
  const op = moveToDate(days, "2026-09-01", "2026-09-02");
  assert.equal(op.ok, false);
  assert.match(op.reason, /not a school day/);
  assert.deepEqual(op.changes, []);
});

test("NEGATIVE: moving a locked day is refused", () => {
  const days = year(["L:Assessment", "Flex"]);
  const op = moveLater(days, "2026-09-01");
  assert.equal(op.ok, false);
  assert.match(op.reason, /locked/);
});

test("NEGATIVE: a ripple with no absorber and no room is refused, not truncated", () => {
  const days = year(["Core Lesson", "Core Lesson", "Core Lesson"]);
  const op = moveLater(days, "2026-09-01");
  assert.equal(op.ok, false);
  assert.match(op.reason, /no room|nowhere to go/);
});

test("an unlocked assessment moves, but says so", () => {
  const days = year(["Core Lesson", "Assessment", "Flex"]);
  const op = moveLater(days, "2026-09-01");
  assert.equal(op.ok, true);
  assert.equal(op.warnings.length, 1);
  assert.match(op.warnings[0], /Lock it if it must hold its date/);
});

test("Continue Tomorrow keeps today's record and inserts a continuation", () => {
  const days = year(["Core Lesson", "Core Lesson", "Flex"]);
  const op = continueTomorrow(days, "2026-09-01");
  assert.equal(op.ok, true);
  assert.equal(op.markContinued, "2026-09-01");
  assert.equal(at(op, "2026-09-01"), undefined, "today's plan is not rewritten");
  assert.equal(at(op, "2026-09-02").to.dayType, "Continued Lesson");
  assert.equal(at(op, "2026-09-02").to.lessonId, "id-0");
  assert.equal(at(op, "2026-09-03").to.lessonId, "id-1", "tomorrow's lesson rippled into the flex day");
  assert.equal(op.absorbedAt, "2026-09-03");

  const { writes } = toWrites(op, 111);
  const continued = writes.find((w) => w.date === "2026-09-01");
  assert.deepEqual(continued.actual, { status: "continued" });
  const { inverse } = toWrites(op, 111);
  const undone = inverse.find((w) => w.date === "2026-09-01");
  assert.equal(undone.actual, null, "undo clears the continued marker it set");
});

test("Move Earlier is a local swap, never a backwards cascade", () => {
  const days = year(["Core Lesson", "Core Lesson", "Core Lesson"]);
  const op = moveEarlier(days, "2026-09-03");
  assert.equal(op.ok, true);
  assert.equal(op.changes.length, 2);
  assert.equal(at(op, "2026-09-02").to.lessonId, "id-2");
  assert.equal(at(op, "2026-09-03").to.lessonId, "id-1");
});

test("a flex day only converts through an explicit action", () => {
  const days = year(["Flex", "Core Lesson"]);
  const ok = convertFlex(days, "2026-09-01", { dayType: "Core Lesson", lessonId: "3-4" });
  assert.equal(ok.ok, true);
  assert.equal(at(ok, "2026-09-01").to.lessonId, "3-4");

  const no = convertFlex(days, "2026-09-02", { dayType: "Core Lesson" });
  assert.equal(no.ok, false);
  assert.match(no.reason, /not a flex day/);
});

test("undo is the exact inverse of what the preview showed", () => {
  const days = year(["Core Lesson", "Core Lesson", "Flex"]);
  const op = moveLater(days, "2026-09-01");
  const { writes, inverse } = toWrites(op, 5);
  assert.equal(writes.length, inverse.length, "every write has an inverse");
  for (const c of op.changes) {
    const w = writes.find((x) => x.date === c.date);
    const i = inverse.find((x) => x.date === c.date);
    assert.deepEqual(w.plan, c.to);
    assert.deepEqual(i.plan, c.from, `undoing ${c.date} restores exactly what was there`);
  }
});

test("a preview never mutates the year it was computed from", () => {
  const days = year(["Core Lesson", "Core Lesson", "Flex"]);
  const before = JSON.stringify(days);
  moveLater(days, "2026-09-01");
  continueTomorrow(days, "2026-09-01");
  insertAt(days, 0, { dayType: "Core Lesson", lessonId: "zzz" });
  assert.equal(JSON.stringify(days), before);
});

test("crossing a quarter boundary is reported, not blocked", () => {
  const days = year(["Core Lesson", "Core Lesson", "Core Lesson", "Flex"]);
  const op = moveLater(days, "2026-09-01");
  assert.equal(op.ok, true);
  assert.equal(op.crossesQuarter, true);
});

/* ── Overlay, read models ──────────────────────────────────────────────────── */

test("resolveYear keeps the original plan beside the current one", () => {
  const resolved = resolveYear(baseline, {
    "2026-08-24": { plan: { dayType: "Flex", lessonId: null }, updatedAt: 9 },
  });
  const day = resolved.find((d) => d.date === "2026-08-24");
  assert.equal(day.original.lessonId, "1-1", "the August baseline is intact");
  assert.equal(day.plan.dayType, "Flex", "the current plan reflects the edit");
  assert.equal(day.origin, "teacher-edit");
  assert.equal(resolved.find((d) => d.date === "2026-08-26").origin, "planning-decision");
});

test("flex capacity counts the real reserve in the shipped plan", () => {
  const resolved = resolveYear(baseline, {});
  const cap = flexCapacity(resolved);
  assert.equal(cap.flex, 3);
  /* 22, not 21: the Pre-Unit's surplus day became a catch-up station when the
   * confirmed five-lesson sequence freed it. */
  assert.equal(cap.catchUp, 22);
  assert.equal(cap.total, 25);
});

test("pacing position is stated in days and neutral language", () => {
  const resolved = resolveYear(baseline, {
    "2026-08-24": { actual: { status: "taught-as-planned" } },
    "2026-08-25": { actual: { status: "taught-as-planned" } },
  });
  const p = pacingPosition(resolved, "2026-08-27");
  assert.equal(p.instructionalDaysElapsed, 3, "today itself is not counted as elapsed");
  assert.equal(p.daysCovered, 2);
  assert.equal(p.drift, -1);
  assert.equal(p.label, "behind plan");
  assert.doesNotMatch(p.label, /fail|late|bad/i);
});

test("an unrecorded year is never called behind", () => {
  /* The planner opened on the first morning of the year announcing "behind plan
   * (1 day)" — it was counting today, and counting silence as a miss. Neither
   * is a pacing fact. */
  const resolved = resolveYear(baseline, {});
  const first = pacingPosition(resolved, "2026-08-24");
  assert.equal(first.instructionalDaysElapsed, 0);
  assert.equal(first.label, "not started");
  assert.equal(first.drift, 0);

  const later = pacingPosition(resolved, "2026-10-01");
  assert.ok(later.instructionalDaysElapsed > 20);
  assert.equal(later.daysRecorded, 0);
  assert.equal(later.label, "nothing recorded yet");
  assert.equal(later.drift, 0, "silence produces no drift figure");
});

test("unit summary reports planned vs current range", () => {
  const resolved = resolveYear(baseline, {});
  const u = unitSummary(resolved, "U3");
  assert.equal(u.plannedStart, "2026-09-09");
  assert.equal(u.plannedEnd, "2026-10-08");
  assert.equal(u.currentStart, u.plannedStart, "an unedited plan matches its baseline");
  assert.equal(u.assessments, 1);
  assert.ok(u.lessons > 0);
  assert.equal(u.completed, 0);
  assert.equal(u.remaining, u.days);
});
