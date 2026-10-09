// Tomorrow's groups: placement must be explainable and deterministic, the next
// lesson must come from the pacing plan (not lesson numbers), and no link may
// be invented for a variant that does not exist.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { nextPacedLesson, planTomorrow } from "./tomorrow-groups.mjs";

const NOW = Date.parse("2026-10-08T20:00:00Z");
const ago = (d) => new Date(NOW - d * 86400000).toISOString();
const mis = (studentName, tag, d = 1) => ({ studentName, section: "3", type: "misconception", props: { tag }, at: ago(d) });
const att = (studentName, result, d = 1) => ({ studentName, section: "3", type: "item_attempt", props: { result }, at: ago(d) });
const phase = (studentName, correct, total, d = 1) => ({
  studentName,
  section: "3",
  type: "phase_complete",
  props: { correct, total },
  at: ago(d),
});

const TAXONOMY = { "pct-of-wrong-whole": { label: "Used the wrong whole", labelEs: "Usó el entero incorrecto" } };
const VARIANTS = { "4-1": { title: "Understand Percent", variants: ["group1", "group2", "catchup"] } };

test("the next lesson comes from the pacing plan, skipping days with no lesson", () => {
  const baseline = JSON.parse(readFileSync(new URL("../../data/pacing-baseline-2026-27.json", import.meta.url)));
  // 2026-10-08 ends Unit 3; the plan opens Unit 4 with 4-1 on 2026-10-09.
  assert.deepEqual(
    { id: nextPacedLesson(baseline.days, "2026-10-08").id, date: nextPacedLesson(baseline.days, "2026-10-08").date },
    { id: "4-1", date: "2026-10-09" },
  );
  const days = [
    { date: "2026-10-09", plan: { lessonId: null, dayType: "Flex" } },
    { date: "2026-10-12", plan: { lessonId: "4-1-catchup", dayType: "Catch-Up" } },
    { date: "2026-10-13", plan: { lessonId: "4-2", dayType: "Core Lesson" } },
  ];
  assert.equal(nextPacedLesson(days, "2026-10-08").id, "4-2");
  assert.equal(nextPacedLesson(days, "2026-10-13"), null);
});

test("placement: repeated misconception → catch-up, single → group 1, partial → group 2", () => {
  const events = [
    mis("Ana", "pct-of-wrong-whole", 1),
    mis("Ana", "pct-of-wrong-whole", 2),
    mis("Ana", "pct-of-wrong-whole", 3),
    mis("Ben", "pct-of-wrong-whole", 1),
    phase("Cam", 3, 5),
    phase("Dee", 1, 5),
    phase("Eli", 5, 5),
    mis("Old", "pct-of-wrong-whole", 30), // outside the window
  ];
  const plan = planTomorrow(events, { lessonId: "4-1", now: NOW, taxonomy: TAXONOMY, variants: VARIANTS });
  const names = (k) => plan.groups[k].students.map((s) => s.student);
  assert.deepEqual(names("catchup"), ["Ana", "Dee"]);
  assert.deepEqual(names("group1"), ["Ben"]);
  assert.deepEqual(names("group2"), ["Cam"]);
  assert.deepEqual(plan.wholeGroup.map((s) => s.student), ["Eli"]);
  assert.equal(plan.groups.catchup.students[0].reason, "repeated");
  assert.equal(plan.groups.catchup.students[1].reason, "low-accuracy");
  assert.equal(plan.groups.group1.students[0].misconception.label, "Used the wrong whole");
  assert.equal(plan.groups.catchup.drivers[0].tag, "pct-of-wrong-whole");
  assert.equal(plan.groups.group1.link.url, "/lessons/4-1-group1/");
  assert.equal(plan.groups.catchup.link.url, "/lessons/4-1-catchup/");
  assert.equal(plan.stats.pulled, 4);
});

test("a student lands in exactly one group, even with several errors", () => {
  const events = [mis("Ana", "a"), mis("Ana", "b"), mis("Ana", "b"), att("Ana", "incorrect")];
  const plan = planTomorrow(events, { lessonId: "4-1", now: NOW, variants: VARIANTS });
  const all = Object.values(plan.groups).flatMap((g) => g.students.map((s) => s.student));
  assert.deepEqual(all, ["Ana"]);
  assert.equal(plan.groups.group1.students[0].misconception.tag, "b", "the most frequent error drives placement");
});

test("too little evidence is not a placement; no variant → no invented link", () => {
  const plan = planTomorrow([att("Kai", "incorrect"), att("Kai", "incorrect")], {
    lessonId: "9-9",
    now: NOW,
    variants: VARIANTS,
  });
  assert.deepEqual(plan.wholeGroup.map((s) => s.student), ["Kai"], "2 attempts is not enough to pull a student");
  assert.equal(plan.groups.group1.link, null);
  assert.equal(plan.groups.catchup.link, null);
});

test("section filter", () => {
  const events = [mis("Ana", "x"), { ...mis("Zed", "x"), section: "5" }];
  const plan = planTomorrow(events, { lessonId: "4-1", now: NOW, section: "5", variants: VARIANTS });
  assert.deepEqual(plan.groups.group1.students.map((s) => s.student), ["Zed"]);
});
