#!/usr/bin/env node
/* =============================================================================
 * tape-ratio.test.mjs — which tape diagrams can be made manipulable, and which
 * must be left alone.
 * -----------------------------------------------------------------------------
 * 73 of the 99 tape-diagram lessons render the two-parallel-rows ratio shape,
 * which readModel() cannot read, so they were drawn and then left static.
 * readRatioModel() recognises the subset whose meaning is unambiguous — both
 * rows internally uniform, same group count — and returns null for everything
 * else. That null is the important half: an authored figure whose structure we
 * cannot infer must keep rendering exactly as it does today rather than get a
 * scaling control that describes it wrongly.
 * ========================================================================== */

import assert from "node:assert/strict";
import test from "node:test";

import { readRatioModel, simplestRatio } from "./tape-diagram-lab.js";

const row = (label, ...values) => ({ label, parts: values.map((v) => ({ value: v, label: String(v) })) });

test("reads the ratio shape the curriculum actually authors", () => {
  // lessons/1-1 — Ferris wheel cars to riders.
  const m = readRatioModel([row("cars", 5, 5, 5, 5), row("riders", 20, 20, 20, 20)]);
  assert.deepEqual({ a: m.a, b: m.b, groups: m.groups }, { a: 5, b: 20, groups: 4 });
});

test("refuses shapes whose meaning it cannot infer", () => {
  assert.equal(readRatioModel([row("a", 1, 2, 3), row("b", 4, 5, 6)]), null, "non-uniform rows");
  assert.equal(readRatioModel([row("a", 5, 5), row("b", 20, 20, 20)]), null, "group counts differ");
  assert.equal(readRatioModel([row("a", 5, 5)]), null, "single row");
  assert.equal(
    readRatioModel([row("a", 5, 5), row("b", 20, 20), row("c", 1, 1)]),
    null,
    "three rows",
  );
  assert.equal(readRatioModel([row("a", 5), row("b", 20)]), null, "one group is not a pattern");
  assert.equal(readRatioModel([row("a", 0, 0), row("b", 2, 2)]), null, "zero quantity");
  assert.equal(readRatioModel([row("a", -5, -5), row("b", 2, 2)]), null, "negative quantity");
});

test("the whole/parts shape is not mistaken for a ratio", () => {
  // A single-part whole row has length 1, so the group counts differ.
  assert.equal(readRatioModel([row("total", 24), row("parts", 6, 6, 6, 6)]), null);
});

test("simplest form states the invariant in lowest terms", () => {
  assert.deepEqual(simplestRatio(5, 20), [1, 4]);
  assert.deepEqual(simplestRatio(30, 120), [1, 4]);
  assert.deepEqual(simplestRatio(3, 5), [3, 5], "already lowest");
  assert.deepEqual(simplestRatio(6, 10), [3, 5]);
});

test("simplest form declines non-integers rather than rounding them", () => {
  assert.equal(simplestRatio(2.5, 5), null);
});

test("scaling preserves the simplified ratio — the invariant the control exists to show", () => {
  const [a, b] = [5, 20];
  const base = simplestRatio(a, b);
  for (let k = 1; k <= 8; k += 1) {
    assert.deepEqual(simplestRatio(a * k, b * k), base, `k=${k} changed the ratio`);
  }
});
