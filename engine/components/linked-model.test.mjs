#!/usr/bin/env node
/* =============================================================================
 * linked-model.test.mjs — the shared state behind the linked ratio views.
 * -----------------------------------------------------------------------------
 * The model is only worth having if its three promises hold:
 *   1. it holds ONLY what a student entered (it starts empty, refuses nonsense,
 *      and derives nothing but pure readings of those entries);
 *   2. the readings agree — pair k, the percent and the grid shading are one
 *      relationship, whatever the scale;
 *   3. it never echoes: a write that changes nothing is silent, and a view can
 *      tell its own write from someone else's.
 * Component-level sync (table column k == double number line pair k == tape) is
 * proved in linked-lab.test.mjs.
 * ========================================================================== */

import assert from "node:assert/strict";
import test from "node:test";

import {
  columns,
  createLinkedModel,
  fmt,
  linkedLabToolFor,
  MAX_SCALE,
  MAX_TERM,
  pairAt,
  percentOf,
  ratioForSquares,
  shadedSquares,
  simplestForm,
} from "./linked-model.js";

test("starts empty: no number arrives from anywhere but the student", () => {
  const m = createLinkedModel();
  assert.deepEqual(m.get(), { a: null, b: null, k: 1, relation: "part-part" });
  assert.equal(pairAt(m.get()), null);
  assert.equal(percentOf(m.get()), null);
  assert.equal(shadedSquares(m.get()), null);
  assert.deepEqual(columns(m.get(), 6), []);
});

test("refuses states no picture can draw, and keeps its last good state", () => {
  const m = createLinkedModel();
  assert.equal(m.set({ a: 2, b: 3 }), true);
  const good = m.get();
  for (const bad of [
    { a: 0, b: 3 },
    { a: -1, b: 3 },
    { a: 2, b: MAX_TERM + 1 },
    { a: Number.NaN, b: 3 },
    { a: "x", b: 3 },
    { a: null }, // a without b
    { k: 0 },
    { k: MAX_SCALE + 1 },
    { k: 2.5 },
    { relation: "whole-part" },
  ]) {
    assert.equal(m.set(bad), false, `accepted ${JSON.stringify(bad)}`);
    assert.deepEqual(m.get(), good, `state moved after ${JSON.stringify(bad)}`);
  }
  assert.throws(() => createLinkedModel({ a: 1 }), RangeError, "half a ratio is not a state");
});

test("a write that changes nothing is silent — the only way two views cannot ping-pong", () => {
  const m = createLinkedModel();
  const heard = [];
  m.subscribe((state, meta) => heard.push({ state, meta }));
  assert.equal(m.set({ a: 2, b: 3 }, "table"), true);
  assert.equal(m.set({ a: 2, b: 3 }, "tape"), false);
  assert.equal(m.set({ k: 1 }), false, "k is already 1");
  assert.equal(heard.length, 1);
  assert.deepEqual(heard[0].meta, { source: "table", changed: ["a", "b"] });
});

test("subscribers see who wrote and what moved, and unsubscribing stops the calls", () => {
  const m = createLinkedModel({ a: 1, b: 4 });
  const seen = [];
  const off = m.subscribe((_s, meta) => seen.push(meta));
  m.set({ k: 3 }, "tape");
  m.set({ relation: "part-whole" }, "lab");
  off();
  m.set({ k: 4 }, "tape");
  assert.deepEqual(seen, [
    { source: "tape", changed: ["k"] },
    { source: "lab", changed: ["relation"] },
  ]);
});

test("a subscriber that throws cannot break the others or the write", () => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    const m = createLinkedModel();
    let reached = false;
    m.subscribe(() => {
      throw new Error("boom");
    });
    m.subscribe(() => {
      reached = true;
    });
    assert.equal(m.set({ a: 1, b: 2 }), true);
    assert.equal(reached, true);
    assert.equal(m.get().a, 1);
  } finally {
    console.warn = warn;
  }
});

test("clear forgets the ratio but keeps the scale and the reading", () => {
  const m = createLinkedModel({ a: 2, b: 3, k: 4, relation: "part-whole" });
  assert.equal(m.clear("grid"), true);
  assert.deepEqual(m.get(), { a: null, b: null, k: 4, relation: "part-whole" });
  assert.equal(m.clear("grid"), false, "clearing an empty model is a no-op");
});

test("get returns a copy: a view cannot move the model by mutating what it was handed", () => {
  const m = createLinkedModel({ a: 2, b: 3 });
  const snap = m.get();
  snap.a = 99;
  assert.equal(m.get().a, 2);
});

test("pair k is the student's ratio scaled by k, for every scale", () => {
  const m = createLinkedModel({ a: 2.5, b: 4 });
  for (let k = 1; k <= MAX_SCALE; k += 1) {
    m.set({ k });
    assert.deepEqual(pairAt(m.get()), { x: 2.5 * k, y: 4 * k });
  }
});

test("columns are the pairs a table and a number line both draw, in order", () => {
  const cols = columns({ a: 3, b: 5, k: 1, relation: "part-part" }, 4);
  assert.deepEqual(cols, [
    { k: 1, x: 3, y: 5 },
    { k: 2, x: 6, y: 10 },
    { k: 3, x: 9, y: 15 },
    { k: 4, x: 12, y: 20 },
  ]);
});

test("every column is the same ratio: x / y never moves with k", () => {
  for (const [a, b] of [
    [2, 3],
    [5, 20],
    [7, 1],
    [1.5, 4],
    [99, 100],
  ]) {
    const state = { a, b, k: 1, relation: "part-part" };
    for (const col of columns(state, MAX_SCALE)) {
      assert.ok(Math.abs(col.x / col.y - a / b) < 1e-9, `${a}:${b} drifted at ×${col.k}`);
    }
  }
});

test("percent: two parts read a / (a + b); a part of a whole reads a / b", () => {
  assert.equal(percentOf({ a: 2, b: 3, k: 1, relation: "part-part" }), 40);
  assert.equal(percentOf({ a: 1, b: 4, k: 1, relation: "part-whole" }), 25);
  assert.equal(percentOf({ a: 3, b: 2, k: 1, relation: "part-whole" }), 150);
  assert.equal(percentOf({ a: 1, b: 7, k: 1, relation: "part-part" }), 12.5);
});

test("percent does not depend on the scale — that is what scaling preserves", () => {
  for (const relation of ["part-part", "part-whole"]) {
    const base = percentOf({ a: 3, b: 8, k: 1, relation });
    for (let k = 1; k <= MAX_SCALE; k += 1) {
      assert.equal(percentOf({ a: 3, b: 8, k, relation }), base, `${relation} moved at ×${k}`);
    }
  }
});

test("the grid shades whole squares and never more than a hundred", () => {
  assert.equal(shadedSquares({ a: 2, b: 3, k: 1, relation: "part-part" }), 40);
  assert.equal(shadedSquares({ a: 1, b: 7, k: 1, relation: "part-part" }), 13, "12.5 rounds up");
  assert.equal(shadedSquares({ a: 3, b: 2, k: 1, relation: "part-whole" }), 100, "150% clamps");
});

test("shading n squares and reading the ratio back gives n percent, under both readings", () => {
  for (const relation of ["part-part", "part-whole"]) {
    for (let n = 1; n <= 99; n += 1) {
      const r = ratioForSquares(n, relation);
      assert.ok(r, `${relation} ${n}`);
      const state = { a: r.a, b: r.b, k: 1, relation };
      assert.equal(percentOf(state), n, `${relation}: ${n} squares came back as ${percentOf(state)}`);
      assert.equal(shadedSquares(state), n);
    }
  }
});

test("a full grid has no ratio of two parts, and an empty grid has no ratio at all", () => {
  assert.equal(ratioForSquares(100, "part-part"), null);
  assert.deepEqual(ratioForSquares(100, "part-whole"), { a: 100, b: 100 });
  assert.equal(ratioForSquares(0, "part-whole"), null);
  assert.equal(ratioForSquares(1.5, "part-whole"), null);
  assert.equal(ratioForSquares(101, "part-whole"), null);
});

test("the lowest-terms form declines decimals instead of rounding them", () => {
  assert.deepEqual(simplestForm(6, 10), { a: 3, b: 5 });
  assert.deepEqual(simplestForm(3, 5), { a: 3, b: 5 });
  assert.equal(simplestForm(2.5, 5), null);
});

test("numbers print the way a student writes them", () => {
  assert.equal(fmt(0.1 + 0.2), "0.3");
  assert.equal(fmt(12), "12");
  assert.equal(fmt(2.5), "2.5");
});

test("the lab is offered to Unit 3 and Unit 4 lessons only, and takes nothing from the lesson", () => {
  const block = (lessonId) => linkedLabToolFor({ lessonId, title: "x", unit: 9 });
  assert.deepEqual(block("3-1"), { kind: "linked-lab", mode: "ratio" });
  assert.deepEqual(block("3-10-group2"), { kind: "linked-lab", mode: "ratio" });
  assert.deepEqual(block("4-3"), { kind: "linked-lab", mode: "percent" });
  assert.deepEqual(block("4-3-part2"), { kind: "linked-lab", mode: "percent" });
  for (const other of ["1-1", "2-3", "5-1", "13-1", "6-13", "30-1", "", undefined]) {
    assert.equal(block(other), null, `offered on ${other}`);
  }
  assert.equal(linkedLabToolFor(null), null);
});
