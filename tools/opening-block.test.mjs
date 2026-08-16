#!/usr/bin/env node
/* The opening instructional block, asserted rather than eyeballed.
 *
 * tools/opening-block-report.mjs prints the Aug 24 – Sep 8 table with the
 * PACING unit and the CANONICAL unit side by side. This runs its assertions in
 * `npm test`: the block still teaches the authored sequence, still occupies its
 * 11-day budget, and still contains borrowed days — a Pre-Unit date teaching a
 * lesson another unit owns, which is the property every defect in this area
 * destroyed in one direction or another.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { openingBlock, problems, roleOf } from "./opening-block-report.mjs";

test("the opening block holds together", () => {
  assert.deepEqual(problems(), []);
});

test("the block is the eleven Pre-Unit dates, in date order", () => {
  const rows = openingBlock();
  assert.equal(rows.length, 11);
  assert.equal(rows[0].date, "2026-08-24");
  assert.equal(rows[rows.length - 1].date, "2026-09-08");
  const dates = rows.map((r) => r.date);
  assert.deepEqual(dates, [...dates].sort());
});

test("every lesson day names BOTH the pacing unit and the canonical unit", () => {
  /* The two-answers property. A row that reports only one of them is how the
   * planner came to label the second week of school "Unit 2". */
  for (const r of openingBlock()) {
    if (!r.lessonId) continue;
    assert.ok(r.pacingUnit, `${r.date} has no pacing unit`);
    assert.match(r.pacingUnit, /Pre-Unit/, `${r.date} is not reported as a Pre-Unit day`);
    assert.match(r.canonicalUnit, /^Unit \d+$/, `${r.date} has no canonical unit`);
  }
});

test("the borrowed days are visible as borrowed", () => {
  const rows = openingBlock();
  const borrowed = rows.filter((r) => r.lessonId && r.canonicalUnit !== "Unit 1");
  assert.ok(borrowed.length >= 4, `only ${borrowed.length} borrowed days`);
  for (const r of borrowed.filter((x) => x.dayType === "Core Lesson")) {
    assert.match(
      r.role,
      /repeats later/,
      `${r.lessonId} is borrowed but not reported as repeating in its own unit`,
    );
  }
});

test("roleOf tells an earlier occurrence from a later one", () => {
  const days = [
    { date: "2026-08-26", plan: { lessonId: "2-6", dayType: "Core Lesson" } },
    { date: "2027-04-30", plan: { lessonId: "2-6", dayType: "Core Lesson" } },
  ];
  assert.match(roleOf(days[0], days), /repeats later/);
  assert.match(roleOf(days[1], days), /taught earlier/);
});

test("a lesson taught once is plain first instruction", () => {
  const days = [{ date: "2026-09-14", plan: { lessonId: "3-1", dayType: "Core Lesson" } }];
  assert.equal(roleOf(days[0], days), "first instruction");
});
