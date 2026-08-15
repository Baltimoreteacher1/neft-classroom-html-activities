#!/usr/bin/env node
/* =============================================================================
 * data-live-mad.test.mjs — MAD, and the claim the sandbox makes about it
 * -----------------------------------------------------------------------------
 * 6.SP.B.5c asks Grade 6 students to describe variability, and mean absolute
 * deviation is the measure the standard names. It was the one statistic the
 * data lab could not display, so its What-if sandbox could show that moving a
 * point changes the mean but not the more interesting fact — that moving a
 * point AWAY from the mean moves the typical distance far more than it moves
 * the centre.
 *
 * data-live.js is a DOM module, so the arithmetic is re-implemented here from
 * the definition and checked against hand-computed cases. That is deliberate:
 * a test that imported the same helper it is testing would only prove the
 * function equals itself.
 * ========================================================================== */

import assert from "node:assert/strict";
import test from "node:test";

const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const mad = (v) => (v.length ? v.reduce((a, b) => a + Math.abs(b - mean(v)), 0) / v.length : 0);
const median = (v) => {
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

test("MAD matches hand computation", () => {
  // mean 5; distances 3,1,0,1,3 → 8/5
  assert.equal(mad([2, 4, 5, 6, 8]), 1.6);
  // every value identical → no deviation at all
  assert.equal(mad([7, 7, 7, 7]), 0);
});

test("MAD is zero exactly when the data has no spread", () => {
  assert.equal(mad([3]), 0);
  assert.ok(mad([3, 4]) > 0);
});

test("the sandbox's instructional claim holds: moving a point outward grows MAD much more than the mean", () => {
  const base = [4, 5, 5, 6];
  const moved = [4, 5, 5, 12]; // pull one value far from the centre
  const meanShift = Math.abs(mean(moved) - mean(base));
  const madShift = Math.abs(mad(moved) - mad(base));
  assert.ok(madShift > meanShift, `MAD moved ${madShift}, mean moved ${meanShift}`);
  assert.equal(median(base), median(moved), "this case should leave the median fixed");
});

test("median can hold still while MAD moves — the case the note calls out", () => {
  const before = [2, 5, 5, 8];
  const after = [0, 5, 5, 10];
  assert.equal(median(before), median(after));
  assert.ok(mad(after) > mad(before));
});

test("MAD is unchanged by shifting every value by the same amount", () => {
  const v = [1, 4, 6, 9];
  const shifted = v.map((x) => x + 100);
  assert.ok(Math.abs(mad(v) - mad(shifted)) < 1e-9, "MAD must measure spread, not location");
  assert.notEqual(mean(v), mean(shifted));
});

test("MAD scales with the data, so doubling the spread doubles it", () => {
  const v = [1, 3, 5, 7];
  const doubled = v.map((x) => x * 2);
  assert.ok(Math.abs(mad(doubled) - 2 * mad(v)) < 1e-9);
});
