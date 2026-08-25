#!/usr/bin/env node
/* =============================================================================
 * equation-progress.test.mjs
 * -----------------------------------------------------------------------------
 * The balance lab already refuses to let a student break equality: operations
 * apply to both sides by construction. So "still balanced" is never news — it
 * is the rule the student just followed. What they cannot easily judge is
 * whether the move brought them nearer to `x = something`, and the lab holds
 * the symbolic state (a·x + b per side) to answer that.
 *
 * A side is {a, b} meaning a·x + b. Isolation is a = 1, b = 0 on the variable
 * side.
 * ========================================================================== */

import assert from "node:assert/strict";
import test from "node:test";

import { describeProgress } from "./equation-balance-lab.js";

const st = (la, lb, ra, rb) => ({ left: { a: la, b: lb }, right: { a: ra, b: rb } });

test("clearing the constant is reported as clearing the constant", () => {
  // x + 2 = 6  --( -2 )-->  x = 4
  const r = describeProgress(st(1, 2, 0, 6), st(1, 0, 0, 4), "x");
  assert.equal(r.tone, "ok");
  assert.match(r.text, /number is gone/);
});

test("partial progress on the constant names both values", () => {
  // x + 5 = 9  --( -2 )-->  x + 3 = 7
  const r = describeProgress(st(1, 5, 0, 9), st(1, 3, 0, 7), "x");
  assert.equal(r.tone, "ok");
  assert.match(r.text, /5/);
  assert.match(r.text, /3/);
});

test("reaching a coefficient of 1 is called out", () => {
  // 3x = 12  --( ÷3 )-->  x = 4
  const r = describeProgress(st(3, 0, 0, 12), st(1, 0, 0, 4), "x");
  assert.equal(r.tone, "ok");
  assert.match(r.text, /coefficient of 1/);
});

test("a LEGAL move in the wrong direction is named as such, not praised", () => {
  // x + 2 = 6  --( +3 )-->  x + 5 = 9. Balanced, and further away.
  const r = describeProgress(st(1, 2, 0, 6), st(1, 5, 0, 9), "x");
  assert.equal(r.tone, "warn", "a backwards move was reported as progress");
  assert.match(r.text, /wrong way/);
  assert.match(r.text, /inverse/);
});

test("multiplying up when the coefficient was already closer is flagged", () => {
  // 2x = 8  --( x3 )-->  6x = 24
  const r = describeProgress(st(2, 0, 0, 8), st(6, 0, 0, 24), "x");
  assert.equal(r.tone, "warn");
  assert.match(r.text, /coefficient/);
});

test("the variable is tracked to whichever side holds it", () => {
  // 6 = x + 2  --( -2 )-->  4 = x
  const r = describeProgress(st(0, 6, 1, 2), st(0, 4, 1, 0), "n");
  assert.equal(r.tone, "ok");
  assert.match(r.text, /number is gone/);
  assert.match(r.text, /\bn\b/, "the authored variable letter was not used");
});

test("a move that changes nothing says so rather than claiming progress", () => {
  const r = describeProgress(st(1, 2, 0, 6), st(1, 2, 0, 6), "x");
  assert.match(r.text, /nothing about the equation changed/);
});

test("negative constants are compared by distance from zero, not by sign", () => {
  // x - 5 = 1  --( +2 )-->  x - 3 = 3 : |b| shrank, so this is progress.
  const r = describeProgress(st(1, -5, 0, 1), st(1, -3, 0, 3), "x");
  assert.equal(r.tone, "ok");
  // x - 3 = 3  --( -2 )-->  x - 5 = 1 : |b| grew, so this is not.
  const back = describeProgress(st(1, -3, 0, 3), st(1, -5, 0, 1), "x");
  assert.equal(back.tone, "warn");
});
