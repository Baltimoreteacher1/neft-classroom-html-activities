import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolveYear } from "../../../shared/pacing/engine.js";
import { normalizeLessons, weekHomework, createDefaultSnapshot } from "./model.js";
import { buildWeekFromPacing, pacingWeekStarts, weekStartFor } from "./pacing-week.js";

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
assert.equal(week.days[0].note, "Wellness Day", "a closed day explains itself to families");

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
assert.equal(editedWeek.days[1].note, "Unit 3 Quiz");
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

assert.throws(() => buildWeekFromPacing(resolved, "nope", known), /YYYY-MM-DD/);

console.log("Pacing-to-family week tests passed.");
