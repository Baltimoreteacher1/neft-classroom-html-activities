#!/usr/bin/env node
// Assertions for the Do-Now spiral sampler (scripts/lib/spiral-node.mjs).
// Plain node test: exits non-zero on the first failed assertion.

import assert from "node:assert/strict";
import { loadBank, pickSpiral, unitsInScope } from "../scripts/lib/spiral-node.mjs";

const bank = loadBank();

// Bank sanity
assert.ok(Array.isArray(bank.questions) && bank.questions.length > 100, "bank has questions");

// Deterministic with a seed
const seed = "2026-09-08";
const a = pickSpiral(bank, { count: 4, scope: { mode: "all" }, seed });
const b = pickSpiral(bank, { count: 4, scope: { mode: "all" }, seed });
assert.deepEqual(
  a.map((q) => q.id),
  b.map((q) => q.id),
  "same seed → same picks",
);

// Different seed usually differs (not a hard guarantee, but for this bank it does)
const c = pickSpiral(bank, { count: 4, scope: { mode: "all" }, seed: "different" });
assert.notDeepEqual(
  a.map((q) => q.id),
  c.map((q) => q.id),
  "different seed → different picks",
);

// Count respected
assert.equal(
  pickSpiral(bank, { count: 3, scope: { mode: "all" }, seed }).length,
  3,
  "count honored",
);

// Scope: upto
const upto3 = pickSpiral(bank, { count: 8, scope: { mode: "upto", upto: 3 }, seed });
assert.ok(
  upto3.every((q) => q.unit <= 3),
  "upto:3 keeps units ≤ 3",
);

// Scope: range
const r56 = pickSpiral(bank, { count: 6, scope: { mode: "range", from: 5, to: 6 }, seed });
assert.ok(
  r56.every((q) => q.unit >= 5 && q.unit <= 6),
  "range 5-6 stays in range",
);

// unitsInScope helper
assert.deepEqual(
  unitsInScope([3, 1, 2, 4], { mode: "upto", upto: 2 }),
  [1, 2],
  "unitsInScope upto",
);
assert.deepEqual(
  unitsInScope([1, 2, 3, 4, 5], { mode: "range", from: 4, to: 2 }),
  [2, 3, 4],
  "range normalizes",
);

// correctIndex stays valid and points at the intended answer after shuffling
for (const q of a) {
  assert.ok(q.correctIndex >= 0 && q.correctIndex < q.choices.length, "correctIndex in range");
  const original = bank.questions.find((o) => o.id === q.id);
  assert.equal(
    q.choices[q.correctIndex],
    original.choices[original.correctIndex],
    "shuffled correct choice matches original correct answer",
  );
}

console.log("spiral-do-now.test.mjs: all assertions passed ✓");
