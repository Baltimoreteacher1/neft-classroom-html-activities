#!/usr/bin/env node
/* =============================================================================
 * engine.invariants.test.mjs — the promises the pacing engine makes to a teacher
 * -----------------------------------------------------------------------------
 * `validate:planning` proves the planner's FILES and VOCABULARY hold together.
 * It cannot prove the engine still behaves, because behaviour is not a string:
 * "the ripple routes around a locked assessment" is a claim about what happens
 * to a year, and the only way to check it is to ripple a year and look.
 *
 * These are the invariants a teacher's plan depends on. Each one has a concrete
 * cost if it breaks:
 *
 *   baseline immutability   the original August plan is the thing every "what
 *                           changed?" answer is measured against. Mutate it and
 *                           the year silently rewrites its own history.
 *   preview-before-apply    the planner shows a preview first. If previewing
 *                           wrote, a teacher exploring an option would have
 *                           already committed it.
 *   undo completeness       a move ripples across many days. An undo that
 *                           restores only the first one is worse than no undo.
 *   locked days             a locked assessment keeps its DATE and its CONTENT.
 *   closures                holidays are not dates to route around; they are
 *                           not dates at all.
 *   absorbers               Flex / Catch-Up / Lost Day / Review stop the ripple.
 *   refusal over truncation a ripple with nowhere to go must be refused with a
 *                           reason. Silently dropping the tail loses a lesson.
 *   actual vs plan          recording what happened must not rewrite the plan.
 *
 * The fixtures are hand-built miniature years, not the real 210-day baseline, so
 * a failure names one behaviour instead of one date in September.
 * ========================================================================== */

import assert from "node:assert/strict";
import test from "node:test";

import {
  continueTomorrow,
  insertAt,
  isInstructional,
  moveLater,
  resolveYear,
  toWrites,
} from "./engine.js";

/* ── Fixtures ──────────────────────────────────────────────────────────────── */

/** One baseline day. `spec` is a compact string: "L:1-1" a lesson, "Flex",
 * "Assessment", "closed" a non-school day. */
function day(date, spec, extra = {}) {
  const closed = spec === "closed";
  const [kind, lessonId] = spec.split(":");
  return {
    date,
    weekday: "Mon",
    week: 1,
    quarter: extra.quarter ?? "Q1",
    schoolStatus: closed ? "closed" : "school",
    eventKind: null,
    earlyRelease: false,
    statusLabel: closed ? "Holiday" : "School day",
    calendarNote: null,
    mcapWindow: false,
    plan: closed
      ? { unitKey: null, dayType: "No School", lessonId: null, planTitle: null }
      : {
          unitKey: "U1",
          dayType: kind === "L" ? "Lesson" : kind,
          lessonId: lessonId || null,
          planTitle: lessonId ? `Lesson ${lessonId}` : kind,
        },
  };
}

const baselineOf = (specs) => ({
  schoolYear: "2026-2027",
  days: specs.map(([date, spec, extra]) => day(date, spec, extra)),
});

/** Apply overlay writes the way the store does, so undo can be checked end to
 * end rather than by inspecting the inverse array's shape. */
function applyWrites(overlay, writes) {
  const next = structuredClone(overlay);
  for (const w of writes) {
    const entry = next[w.date] || (next[w.date] = {});
    if ("plan" in w) entry.plan = w.plan;
    if ("actual" in w) entry.actual = w.actual;
    if ("locked" in w) entry.locked = w.locked;
    entry.updatedAt = w.updatedAt;
  }
  return next;
}

const planOn = (days, date) => days.find((d) => d.date === date).plan;

/* A straightforward week: four lessons then a Flex day to absorb a slip. */
const SIMPLE = baselineOf([
  ["2026-09-01", "L:1-1"],
  ["2026-09-02", "L:1-2"],
  ["2026-09-03", "L:1-3"],
  ["2026-09-04", "L:1-4"],
  ["2026-09-05", "Flex"],
]);

/* ── Baseline immutability ─────────────────────────────────────────────────── */

test("resolving and rippling a year never mutates the baseline", () => {
  const before = JSON.stringify(SIMPLE);
  const days = resolveYear(SIMPLE, {});
  const op = moveLater(days, "2026-09-01");
  toWrites(op, 1);
  assert.equal(JSON.stringify(SIMPLE), before, "the baseline object was written through");
});

test("the resolved year keeps `original` even after the plan is overlaid", () => {
  const days = resolveYear(SIMPLE, {
    "2026-09-02": { plan: { unitKey: "U1", dayType: "Flex", lessonId: null, planTitle: "Flex" } },
  });
  const d = days.find((x) => x.date === "2026-09-02");
  assert.equal(d.plan.dayType, "Flex", "the overlay did not win");
  assert.equal(d.original.lessonId, "1-2", "the original August plan was lost");
});

/* ── Preview before apply ──────────────────────────────────────────────────── */

test("previewing writes nothing and is repeatable", () => {
  const days = resolveYear(SIMPLE, {});
  const snapshot = JSON.stringify(days);
  const first = moveLater(days, "2026-09-02");
  const second = moveLater(days, "2026-09-02");
  assert.equal(JSON.stringify(days), snapshot, "preview mutated the resolved year");
  assert.deepEqual(first.changes, second.changes, "preview is not deterministic");
});

test("a refused operation produces no writes at all", () => {
  // No absorber anywhere: the ripple runs out of year.
  const noRoom = resolveYear(baselineOf([["2026-09-01", "L:1-1"], ["2026-09-02", "L:1-2"]]), {});
  const op = moveLater(noRoom, "2026-09-01");
  assert.equal(op.ok, false, "an unabsorbable ripple was accepted");
  assert.match(op.reason || op.summary, /\S/, "refusal carries no reason");
  assert.deepEqual(toWrites(op, 1).writes, [], "a refused op still emitted writes");
});

/* ── Undo completeness ─────────────────────────────────────────────────────── */

test("undo restores every day a multi-day ripple touched", () => {
  const days = resolveYear(SIMPLE, {});
  const op = moveLater(days, "2026-09-01");
  assert.ok(op.ok, op.reason);
  assert.ok(op.changes.length >= 3, `expected a multi-day ripple, got ${op.changes.length}`);

  const { writes, inverse } = toWrites(op, 100);
  const applied = applyWrites({}, writes);
  const afterApply = resolveYear(SIMPLE, applied);
  assert.notDeepEqual(
    afterApply.map((d) => d.plan),
    days.map((d) => d.plan),
    "applying the op changed nothing",
  );

  const undone = resolveYear(SIMPLE, applyWrites(applied, inverse));
  assert.deepEqual(
    undone.map((d) => ({ date: d.date, plan: d.plan })),
    days.map((d) => ({ date: d.date, plan: d.plan })),
    "undo left the year different from where it started",
  );
});

test("undo covers the same dates the preview showed — no more, no less", () => {
  const days = resolveYear(SIMPLE, {});
  const op = moveLater(days, "2026-09-01");
  const { writes, inverse } = toWrites(op, 100);
  assert.deepEqual(
    inverse.map((w) => w.date).sort(),
    writes.map((w) => w.date).sort(),
    "the inverse touches a different set of dates than the operation",
  );
});

/* ── Locked days ───────────────────────────────────────────────────────────── */

test("a locked day keeps its date and its content, and the ripple routes around it", () => {
  const b = baselineOf([
    ["2026-09-01", "L:1-1"],
    ["2026-09-02", "Assessment"],
    ["2026-09-03", "L:1-3"],
    ["2026-09-04", "Flex"],
  ]);
  const days = resolveYear(b, { "2026-09-02": { locked: true } });
  const op = moveLater(days, "2026-09-01");
  assert.ok(op.ok, op.reason);
  assert.ok(op.routedAround.includes("2026-09-02"), "the locked day was not reported as routed around");
  assert.ok(
    !op.changes.some((c) => c.date === "2026-09-02"),
    "the locked assessment was rewritten",
  );

  const after = resolveYear(b, applyWrites({ "2026-09-02": { locked: true } }, toWrites(op, 1).writes));
  assert.equal(planOn(after, "2026-09-02").dayType, "Assessment", "the locked day lost its content");
});

test("moving what is ON a locked day is refused rather than silently allowed", () => {
  const days = resolveYear(SIMPLE, { "2026-09-01": { locked: true } });
  const op = moveLater(days, "2026-09-01");
  assert.equal(op.ok, false);
  assert.match(op.reason, /locked/i);
});

/* ── Closures ──────────────────────────────────────────────────────────────── */

test("closures are skipped entirely — never changed, never 'routed around'", () => {
  /* The holiday must sit INSIDE the ripple path, not before it. With the
   * closure at index 1 the ripple starts at index 2 and never visits it, so the
   * test passes no matter what the loop does with non-instructional days —
   * which is exactly how a first draft of this test passed against an engine
   * whose closure check had been deleted. */
  const b = baselineOf([
    ["2026-09-01", "L:1-1"],
    ["2026-09-02", "L:1-2"],
    ["2026-09-03", "closed"],
    ["2026-09-04", "L:1-4"],
    ["2026-09-05", "Flex"],
  ]);
  const days = resolveYear(b, {});
  const op = moveLater(days, "2026-09-01");
  assert.ok(op.ok, op.reason);
  assert.ok(
    op.changes.some((c) => c.date === "2026-09-04"),
    "the ripple never reached past the holiday — fixture no longer exercises the skip",
  );
  assert.ok(!op.changes.some((c) => c.date === "2026-09-03"), "a holiday was scheduled onto");
  assert.ok(
    !op.routedAround.includes("2026-09-03"),
    "a holiday was reported as an obstacle; it is simply not a date",
  );
  const after = resolveYear(b, applyWrites({}, toWrites(op, 1).writes));
  assert.equal(planOn(after, "2026-09-03").dayType, "No School", "the holiday lost its identity");
});

/* ── Absorbers ─────────────────────────────────────────────────────────────── */

for (const absorber of ["Flex", "Catch-Up", "Lost Day", "Review"]) {
  test(`a ${absorber} day absorbs the ripple and nothing past it moves`, () => {
    const b = baselineOf([
      ["2026-09-01", "L:1-1"],
      ["2026-09-02", "L:1-2"],
      ["2026-09-03", absorber],
      ["2026-09-04", "L:1-4"],
    ]);
    const days = resolveYear(b, {});
    const op = insertAt(days, 1, { unitKey: "U1", dayType: "Lesson", lessonId: "X", planTitle: "X" });
    assert.equal(op.absorbedAt, "2026-09-03", `the ${absorber} day did not absorb`);
    assert.ok(
      !op.changes.some((c) => c.date === "2026-09-04"),
      `the ripple continued past the ${absorber} day`,
    );
  });
}

test("an unabsorbable ripple is refused with a reason, not truncated", () => {
  const days = resolveYear(
    baselineOf([
      ["2026-09-01", "L:1-1"],
      ["2026-09-02", "L:1-2"],
      ["2026-09-03", "L:1-3"],
    ]),
    {},
  );
  const op = insertAt(days, 0, { unitKey: "U1", dayType: "Lesson", lessonId: "X", planTitle: "X" });
  assert.equal(op.absorbedAt, null);
  assert.match(op.blocked || "", /\S/, "an overflowing ripple reported no reason");
});

/* ── Actual vs plan ────────────────────────────────────────────────────────── */

test("recording what actually happened leaves the planned schedule alone", () => {
  const overlay = { "2026-09-02": { actual: { status: "taught-as-planned" } } };
  const days = resolveYear(SIMPLE, overlay);
  const d = days.find((x) => x.date === "2026-09-02");
  assert.equal(d.actual.status, "taught-as-planned");
  assert.equal(d.plan.lessonId, "1-2", "recording an actual overwrote the plan");
});

test("Continue Tomorrow records the continuation, and undo un-records it", () => {
  const days = resolveYear(SIMPLE, {});
  const op = continueTomorrow(days, "2026-09-01");
  assert.ok(op.ok, op.reason);
  const { writes, inverse } = toWrites(op, 100);
  const applied = applyWrites({}, writes);
  assert.equal(
    applied["2026-09-01"].actual?.status,
    "continued",
    "the day was not marked continued",
  );
  const undone = applyWrites(applied, inverse);
  assert.notEqual(
    undone["2026-09-01"].actual?.status,
    "continued",
    "undo left the day marked continued — the year keeps a record of a rolled-back change",
  );
});

/* ── Delta-only storage ────────────────────────────────────────────────────── */

test("writes carry only overlay fields — no resolved curriculum metadata", () => {
  const days = resolveYear(SIMPLE, {});
  const { writes } = toWrites(moveLater(days, "2026-09-01"), 100);
  const allowedTop = new Set(["date", "plan", "actual", "locked", "note", "updatedAt"]);
  for (const w of writes) {
    for (const k of Object.keys(w)) {
      assert.ok(allowedTop.has(k), `write for ${w.date} carries unexpected field "${k}"`);
    }
    // The resolved day carries weekday/quarter/statusLabel/original — all of
    // which come from the baseline and must never be copied into a delta.
    for (const k of ["weekday", "quarter", "statusLabel", "original", "week", "schoolStatus"]) {
      assert.ok(!(k in (w.plan || {})), `write for ${w.date} duplicates baseline field "${k}"`);
    }
  }
});

/* ── Sanity on the fixture helper itself ───────────────────────────────────── */

test("the fixture builder produces days the engine recognises", () => {
  const days = resolveYear(SIMPLE, {});
  assert.equal(days.filter(isInstructional).length, 5);
  assert.equal(days.length, 5);
});
