import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolveYear } from "../../../shared/pacing/engine.js";
import { normalizeLessons, weekHomework, createDefaultSnapshot } from "./model.js";
import {
  buildWeekFromPacing,
  pacingMonthGrid,
  pacingMonths,
  pacingWeekStarts,
  weekStartFor,
} from "./pacing-week.js";

const baseline = JSON.parse(
  await readFile(new URL("../../../data/pacing-baseline-2026-27.json", import.meta.url), "utf8"),
);
const manifest = JSON.parse(
  await readFile(new URL("../../../data/curriculum-manifest.json", import.meta.url), "utf8"),
);
const lessons = normalizeLessons(manifest.lessons);
const known = lessons.map((lesson) => lesson.id);
const resolved = resolveYear(baseline, {});

assert.equal(weekStartFor("2026-09-21"), "2026-09-21", "Monday is its own week start");
assert.equal(weekStartFor("2026-09-24"), "2026-09-21", "a Thursday belongs to its Monday");
assert.equal(weekStartFor("2026-09-26"), "2026-09-28", "Saturday rolls forward to the next week");
assert.equal(weekStartFor("2026-09-27"), "2026-09-28", "Sunday rolls forward to the next week");
assert.equal(weekStartFor("not-a-date"), "");

const starts = pacingWeekStarts(resolved);
assert.ok(starts.length > 30, "the school year should offer every planned week");
assert.deepEqual(
  starts.map((week) => week.startDate),
  [...starts.map((week) => week.startDate)].sort(),
  "weeks are offered in date order, the direction a teacher scans",
);
assert.ok(starts.every((week) => week.label && !week.label.includes("undefined")));

// A real week with a closed Monday, three core lessons, and a catch-up Friday.
const week = buildWeekFromPacing(resolved, "2026-09-21", known);
assert.equal(week.startDate, "2026-09-21");
assert.equal(week.label, "September 21-25");
assert.deepEqual(
  week.days.map((day) => [day.day, day.status, day.lessonId]),
  [
    ["Monday", "no-class", ""],
    ["Tuesday", "lesson", "3-5"],
    ["Wednesday", "lesson", "3-6"],
    ["Thursday", "lesson", "3-7"],
    ["Friday", "review", ""],
  ],
);
assert.equal(week.lessonCount, 3);
assert.ok(
  week.needsReview.some((item) => item.day === "Friday" && /Catch-Up/i.test(item.reason)),
  "a catch-up day must be flagged, not silently posted as a lesson",
);
assert.equal(week.days[0].note, "Wellness day — no school");
assert.equal(week.days[0].noteEs, "Día de bienestar — no hay clases");
assert.equal(week.days[4].note, "Catch-up and practice", "the day type names itself to families");
assert.equal(week.days[4].noteEs, "Repaso y práctica adicional");
for (const start of ["2026-08-24", "2026-09-21", "2026-11-23", "2027-01-04", "2027-04-05"]) {
  for (const day of buildWeekFromPacing(resolved, start, known).days) {
    assert.equal(
      Boolean(day.note),
      Boolean(day.noteEs),
      `${start} ${day.day}: a day note must exist in both languages or neither`,
    );
  }
}

// The planner's private working language must never reach a family draft.
const privateNotes = baseline.days
  .map((day) => day.plan?.note)
  .filter(Boolean)
  .map((note) => note.toLowerCase());
for (const start of ["2026-08-24", "2026-09-21", "2026-10-19", "2027-01-04"]) {
  for (const day of buildWeekFromPacing(resolved, start, known).days) {
    const note = day.note.toLowerCase();
    assert.ok(
      !note || !privateNotes.some((secret) => secret.includes(note) || note.includes(secret)),
      `family draft leaked planner working note: ${day.note}`,
    );
  }
}

// A teacher edit in D1 wins, exactly as it does in the planner itself.
const edited = resolveYear(baseline, {
  "2026-09-22": { plan: { dayType: "Assessment", lessonId: null, planTitle: "Unit 3 Quiz" } },
});
const editedWeek = buildWeekFromPacing(edited, "2026-09-21", known);
assert.equal(editedWeek.days[1].status, "assessment");
assert.equal(editedWeek.days[1].lessonId, "");
assert.equal(editedWeek.days[1].note, "Learning check");
assert.equal(editedWeek.days[1].noteEs, "Evaluación de aprendizaje");
assert.equal(editedWeek.lessonCount, 2);

// A lesson the family page cannot open becomes an honest review day.
const unknown = resolveYear(baseline, {
  "2026-09-23": { plan: { dayType: "Core Lesson", lessonId: "99-9" } },
});
const unknownWeek = buildWeekFromPacing(unknown, "2026-09-21", known);
assert.equal(unknownWeek.days[2].status, "review");
assert.equal(unknownWeek.days[2].lessonId, "");
assert.ok(unknownWeek.needsReview.some((item) => item.day === "Wednesday"));

// A filled week feeds the family practice list without any further editing.
const snapshot = createDefaultSnapshot();
snapshot.sections[0].week = { ...snapshot.sections[0].week, ...week };
assert.deepEqual(
  weekHomework(snapshot, manifest.lessons, {}, "all-families").map((item) => item.id),
  ["3-5", "3-6", "3-7"],
  "filling from the plan is enough to post this week's family practice",
);

// The calendar picker: a real month, so a week is recognised rather than recalled.
const months = pacingMonths(resolved);
assert.ok(months.length >= 10, `expected a school year of months, got ${months.length}`);
assert.equal(months[0].key, "2026-08");
assert.match(months[0].label, /August 2026/);
assert.deepEqual(
  months.map((month) => month.key),
  [...months.map((month) => month.key)].sort(),
  "months are offered in date order",
);

const grid = pacingMonthGrid(resolved, "2026-09");
assert.ok(grid.length >= 4 && grid.length <= 6, `unexpected week count: ${grid.length}`);
for (const week of grid) {
  assert.equal(week.cells.length, 5, "the publisher plans Monday to Friday");
  assert.equal(week.weekStart, weekStartFor(week.cells[0].date));
  assert.deepEqual(
    week.cells.map((cell) => cell.dayName),
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  );
}
const september21 = grid.find((week) => week.weekStart === "2026-09-21");
assert.ok(september21, "the grid must contain the week the fill test uses");
assert.deepEqual(
  september21.cells.map((cell) => cell.lessonId),
  ["", "3-5", "3-6", "3-7", ""],
  "a calendar cell shows the family lesson id, and nothing for a catch-up day",
);
assert.equal(september21.cells[0].school, false, "Monday is closed that week");
assert.equal(september21.cells[4].rawLessonId, "3-7-catchup");
assert.ok(
  grid.some((week) => week.cells.some((cell) => !cell.inMonth)),
  "a straddling week still renders its out-of-month days so it stays pickable",
);
assert.deepEqual(pacingMonthGrid(resolved, "nope"), []);
assert.deepEqual(pacingMonthGrid(resolved, "2099-01"), [], "a month with no plan is empty");

assert.throws(() => buildWeekFromPacing(resolved, "nope", known), /YYYY-MM-DD/);

console.log("Pacing-to-family week tests passed.");
