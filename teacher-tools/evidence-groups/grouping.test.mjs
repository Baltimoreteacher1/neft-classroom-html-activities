// Groups composed from evidence have to be defensible to the teacher running
// them and to the student sitting in them. These tests pin the properties that
// make them defensible:
//
//   • a student lands in exactly ONE group (you cannot attend two at once)
//   • the group is chosen by the error they made MOST, deterministically
//   • a lone student is surfaced, never silently dropped — that is exactly the
//     student who otherwise goes unseen
//   • no link is ever invented; an unrunnable group says so
//   • the trend is real arithmetic on two windows, so "clearing" means cleared
//
// Everything is pure, so "now" is injected and there is no clock flake.

import assert from "node:assert/strict";
import test from "node:test";

import { balancedChunks, baseLessonOf, buildPlan, resolveLesson } from "./grouping.mjs";

const NOW = Date.parse("2026-03-10T15:00:00Z");
const daysAgo = (n) => new Date(NOW - n * 86400000).toISOString();

const TAXONOMY = {
  "ratio-inverted": {
    label: "Flipped the ratio",
    labelEs: "Invirtió la razón",
    watchFor: "Ask which quantity the question asks for FIRST.",
    student: "The ratio is flipped.",
    studentEs: "La razón está invertida.",
  },
  "op-added-instead-of-multiplied": {
    label: "Added when the problem multiplies",
    labelEs: "Sumó cuando el problema multiplica",
    watchFor: "Ask what the operation does to the quantity.",
    student: "It looks like you added.",
    studentEs: "Parece que sumaste.",
  },
};

const VARIANTS = {
  "3-2": { title: "Ratio Tables", variants: ["group1", "group2"] },
  "1-2": { title: "Greatest Common Factor", variants: ["group1", "group2", "catchup"] },
  "9-9": { title: "No Variants Lesson", variants: [] },
};

/** Terse event builder. */
const ev = (student, tag, opts = {}) => ({
  studentName: student,
  section: opts.section ?? "3",
  lessonSlug: opts.lesson ?? "3-2",
  type: opts.type ?? "misconception",
  props: { tag },
  at: opts.at ?? daysAgo(1),
});

const plan = (events, opts) =>
  buildPlan(events, { now: NOW, taxonomy: TAXONOMY, variants: VARIANTS, ...opts });

test("clusters students by the error they share", () => {
  const p = plan([
    ev("Ana R", "ratio-inverted"),
    ev("Ben T", "ratio-inverted"),
    ev("Cam L", "ratio-inverted"),
    ev("Dee M", "op-added-instead-of-multiplied"),
    ev("Eli P", "op-added-instead-of-multiplied"),
  ]);

  assert.equal(p.groups.length, 2);
  const ratio = p.groups.find((g) => g.tag === "ratio-inverted");
  assert.deepEqual(ratio.students, ["Ana R", "Ben T", "Cam L"]);
  assert.equal(ratio.label, "Flipped the ratio");
  assert.equal(ratio.labelEs, "Invirtió la razón");
  assert.equal(ratio.watchFor, "Ask which quantity the question asks for FIRST.");
  // Biggest group first — that is where the teacher's first block should go.
  assert.equal(p.groups[0].tag, "ratio-inverted");
});

test("a student joins the group for the error they made MOST", () => {
  const p = plan([
    ev("Ana R", "ratio-inverted"),
    ev("Ana R", "ratio-inverted"),
    ev("Ana R", "ratio-inverted"),
    ev("Ana R", "op-added-instead-of-multiplied"),
    ev("Ben T", "ratio-inverted"),
  ]);
  const inGroups = p.groups.flatMap((g) => g.students);
  // Exactly one group, exactly once — you cannot attend two groups at once.
  assert.equal(inGroups.filter((s) => s === "Ana R").length, 1);
  assert.equal(p.groups[0].tag, "ratio-inverted");
  assert.ok(p.groups[0].students.includes("Ana R"));
});

test("ties on count are broken by the most recent hit, not by input order", () => {
  const events = [
    ev("Ana R", "ratio-inverted", { at: daysAgo(5) }),
    ev("Ana R", "op-added-instead-of-multiplied", { at: daysAgo(1) }),
    ev("Ben T", "op-added-instead-of-multiplied"),
  ];
  const forward = plan(events);
  const reversed = plan([...events].reverse());
  assert.equal(forward.groups[0].tag, "op-added-instead-of-multiplied");
  assert.deepEqual(
    forward.groups.map((g) => [g.tag, g.students]),
    reversed.groups.map((g) => [g.tag, g.students]),
    "the plan must not depend on the order rows arrive in",
  );
});

test("a lone student becomes a check-in, never a dropped row", () => {
  const p = plan([
    ev("Ana R", "ratio-inverted"),
    ev("Ben T", "ratio-inverted"),
    ev("Zed Q", "op-added-instead-of-multiplied"),
  ]);
  assert.equal(p.groups.length, 1);
  assert.equal(p.soloCheckIns.length, 1);
  assert.equal(p.soloCheckIns[0].student, "Zed Q");
  assert.equal(p.soloCheckIns[0].label, "Added when the problem multiplies");
  // And they are still counted as needing something.
  assert.equal(p.stats.studentsGrouped, 3);
});

test("oversized clusters split into BALANCED parts with parallel variants", () => {
  const students = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  const p = plan(
    students.map((s) => ev(s, "ratio-inverted")),
    { maxGroup: 6 },
  );
  assert.equal(p.groups.length, 2);
  const sizes = p.groups.map((g) => g.size).sort();
  assert.deepEqual(sizes, [4, 5], "9 students split 5+4, not 6+3");
  // Two groups running at once must not get the identical worksheet.
  const ids = p.groups.map((g) => g.lesson.id);
  assert.deepEqual([...new Set(ids)].length, 2, `parallel groups got the same lesson: ${ids}`);
  assert.deepEqual(p.groups.map((g) => g.part.of), [2, 2]);
});

test("routes the group to the lesson the error actually happened on", () => {
  const p = plan([
    ev("Ana R", "ratio-inverted", { lesson: "1-2" }),
    ev("Ben T", "ratio-inverted", { lesson: "1-2" }),
    ev("Cam L", "ratio-inverted", { lesson: "3-2" }),
  ]);
  assert.equal(p.groups[0].lesson.base, "1-2", "majority lesson wins");
  assert.equal(p.groups[0].lesson.url, "/lessons/1-2-group1/");
  assert.equal(p.groups[0].lesson.title, "Greatest Common Factor");
});

test("a lesson with no small-group variant yields NO link rather than a guess", () => {
  const p = plan([
    ev("Ana R", "ratio-inverted", { lesson: "9-9" }),
    ev("Ben T", "ratio-inverted", { lesson: "9-9" }),
  ]);
  assert.equal(p.groups[0].lesson, null, "must not invent /lessons/9-9-group1/");
  // Same rule at the unit level.
  assert.equal(resolveLesson("9-9", VARIANTS["9-9"]), null);
  assert.equal(resolveLesson("", null), null);
  assert.equal(resolveLesson("4-4", undefined), null);
});

test("trend compares this window against the one immediately before it", () => {
  const p = plan(
    [
      // prior window (8-14 days ago): 3 hits
      ev("Ana R", "ratio-inverted", { at: daysAgo(9) }),
      ev("Ben T", "ratio-inverted", { at: daysAgo(10) }),
      ev("Cam L", "ratio-inverted", { at: daysAgo(11) }),
      // current window: 2 hits → clearing
      ev("Ana R", "ratio-inverted", { at: daysAgo(2) }),
      ev("Ben T", "ratio-inverted", { at: daysAgo(1) }),
    ],
    { windowDays: 7 },
  );
  const g = p.groups[0];
  assert.deepEqual(g.trend, { current: 2, prior: 3, direction: "clearing" });
});

test("trend directions: growing, holding, and new", () => {
  const mk = (priorN, nowN) => {
    const rows = [];
    for (let i = 0; i < priorN; i++) rows.push(ev(`P${i}`, "ratio-inverted", { at: daysAgo(9) }));
    for (let i = 0; i < nowN; i++) rows.push(ev(`N${i}`, "ratio-inverted", { at: daysAgo(2) }));
    return plan(rows).groups[0]?.trend ?? plan(rows).soloCheckIns[0]?.trend;
  };
  assert.equal(mk(1, 3).direction, "growing");
  assert.equal(mk(2, 2).direction, "holding");
  assert.equal(mk(0, 2).direction, "new");
});

test("events outside the window do not create groups", () => {
  const p = plan([
    ev("Ana R", "ratio-inverted", { at: daysAgo(30) }),
    ev("Ben T", "ratio-inverted", { at: daysAgo(40) }),
  ]);
  assert.equal(p.groups.length, 0);
  assert.equal(p.soloCheckIns.length, 0);
});

test("section filter restricts the plan to one class period", () => {
  const rows = [
    ev("Ana R", "ratio-inverted", { section: "3" }),
    ev("Ben T", "ratio-inverted", { section: "3" }),
    ev("Cam L", "ratio-inverted", { section: "5" }),
    ev("Dee M", "ratio-inverted", { section: "5" }),
  ];
  const p3 = plan(rows, { section: "3" });
  assert.deepEqual(p3.groups[0].students, ["Ana R", "Ben T"]);
  assert.equal(p3.groups[0].size, 2);
});

test("students seen with no misconception are reported as on track", () => {
  const p = plan([
    ev("Ana R", "ratio-inverted"),
    ev("Ben T", "ratio-inverted"),
    { studentName: "Kai W", section: "3", type: "answer", props: {}, at: daysAgo(1) },
  ]);
  assert.deepEqual(p.onTrack, ["Kai W"]);
  assert.equal(p.stats.studentsSeen, 3);
});

test("an unknown tag still groups, showing its raw id rather than vanishing", () => {
  const p = plan([ev("Ana R", "brand-new-error"), ev("Ben T", "brand-new-error")]);
  assert.equal(p.groups.length, 1);
  assert.equal(p.groups[0].label, "brand-new-error");
  assert.equal(p.groups[0].known, false);
});

test("nameless events count toward the trend but cannot be grouped", () => {
  const p = plan([
    ev("", "ratio-inverted"),
    ev("", "ratio-inverted"),
    ev("Ana R", "ratio-inverted"),
    ev("Ben T", "ratio-inverted"),
  ]);
  assert.deepEqual(p.groups[0].students, ["Ana R", "Ben T"]);
  assert.equal(p.groups[0].trend.current, 4, "anonymous hits still count class-wide");
});

test("junk input is survived, not crashed on", () => {
  assert.doesNotThrow(() => plan([]));
  assert.doesNotThrow(() => buildPlan(null, { now: NOW }));
  assert.doesNotThrow(() => buildPlan(undefined));
  const p = plan([
    { type: "misconception", props: { tag: "ratio-inverted" }, at: "not-a-date" },
    { type: "misconception", props: {}, at: daysAgo(1), studentName: "Ana R" },
    null,
    {},
  ]);
  assert.equal(p.groups.length, 0);
});

test("balancedChunks distributes the remainder instead of stranding it", () => {
  assert.deepEqual(balancedChunks([1, 2, 3], 6), [[1, 2, 3]]);
  assert.deepEqual(balancedChunks([1, 2, 3, 4, 5, 6, 7], 6), [
    [1, 2, 3, 4],
    [5, 6, 7],
  ]);
  assert.deepEqual(
    balancedChunks(Array.from({ length: 13 }, (_, i) => i), 6).map((c) => c.length),
    [5, 4, 4],
  );
  // Every element survives the split, exactly once.
  const src = Array.from({ length: 17 }, (_, i) => i);
  assert.deepEqual(balancedChunks(src, 6).flat().sort((a, b) => a - b), src);
});

test("baseLessonOf strips variant suffixes and rejects non-lessons", () => {
  assert.equal(baseLessonOf("3-2"), "3-2");
  assert.equal(baseLessonOf("3-2-group1"), "3-2");
  assert.equal(baseLessonOf("10-5-catchup"), "10-5");
  assert.equal(baseLessonOf("access-practice-lab"), "");
  assert.equal(baseLessonOf(""), "");
  assert.equal(baseLessonOf(null), "");
});
