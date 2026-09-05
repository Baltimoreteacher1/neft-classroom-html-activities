import assert from "node:assert/strict";
import test from "node:test";

import {
  bringInExtendingItems,
  collectPracticeItems,
  orderItemsForAdaptivePath,
} from "@eduwonderlab/engine/core/small-group-practice.js";

const sample = {
  variant: "group1",
  practice: {
    approaching: [
      { stem: "A1", answer: "1" },
      { stem: "A2", answer: "2" },
    ],
    onLevel: [
      { stem: "O1", answer: "3" },
      { stem: "O2", answer: "4" },
    ],
    extending: [
      { stem: "E1", answer: "5" },
      { stem: "E2", answer: "6" },
    ],
    optional: [],
  },
};

test("collectPracticeItems tags tier and stable practice indices", () => {
  const items = collectPracticeItems(sample);
  assert.equal(items.length, 6);
  assert.equal(items[0]._tier, "approaching");
  assert.equal(items[0]._practiceIndex, 0);
  assert.equal(items[2]._tier, "onLevel");
  assert.equal(items[4]._tier, "extending");
  assert.equal(items[5]._practiceIndex, 5);
});

test("stabilize promotes approaching / scaffold-friendly items without dropping any", () => {
  const items = collectPracticeItems(sample);
  const ordered = orderItemsForAdaptivePath(items, "stabilize");
  assert.equal(ordered.length, items.length);
  assert.equal(ordered[0]._tier, "approaching");
  assert.equal(ordered[1]._tier, "approaching");
  // Original indices preserved for Save/Resume.
  assert.deepEqual(
    ordered.map((item) => item._practiceIndex).sort((a, b) => a - b),
    [0, 1, 2, 3, 4, 5],
  );
});

test("stretch promotes extending items without dropping any", () => {
  const items = collectPracticeItems(sample);
  const ordered = orderItemsForAdaptivePath(items, "stretch");
  assert.equal(ordered.length, items.length);
  assert.equal(ordered[0]._tier, "extending");
  assert.equal(ordered[1]._tier, "extending");
});

test("connect keeps original order", () => {
  const items = collectPracticeItems(sample);
  const ordered = orderItemsForAdaptivePath(items, "connect");
  assert.deepEqual(
    ordered.map((item) => item.stem),
    items.map((item) => item.stem),
  );
});

test("bringInExtendingItems is additive and assigns fresh indices", () => {
  const base = collectPracticeItems(sample).slice(0, 2);
  const enriched = bringInExtendingItems(base, sample);
  assert.ok(enriched.length > base.length);
  assert.ok(enriched.some((item) => item._tier === "extending"));
  const indices = enriched.map((item) => item._practiceIndex);
  assert.equal(new Set(indices).size, indices.length);
});
