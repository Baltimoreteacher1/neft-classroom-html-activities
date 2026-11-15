import assert from "node:assert/strict";
import test from "node:test";
import pack from "../access-practice-lab/src/content/journey/m08.js";
import { compareCause } from "../access-practice-lab/src/journey/engines/cause-compare.js";
import { init } from "../access-practice-lab/src/journey/engines/scene.js";

const task = pack.bands["3-5"].discover;
test("changing only sunlight compares shade with full sun while water remains daily", () => {
  const result = compareCause(task, "sunlight", "thrive", init(task));
  assert.match(result.before, /small.*yellow/i);
  assert.match(result.after, /tall.*green/i);
  assert.equal(result.matched, true);
  assert.deepEqual(result.scene.controls, { sun: "full", water: "daily" });
});
test("changing only water provides a counterexample to an incorrect prediction", () => {
  const result = compareCause(task, "water", "thrive", init(task));
  assert.match(result.before, /tall.*green/i);
  assert.match(result.after, /droop.*dry/i);
  assert.equal(result.matched, false);
  assert.deepEqual(result.scene.controls, { sun: "full", water: "none" });
});
test("reject missing predictions and comparisons that change multiple variables", () => {
  assert.equal(compareCause(task, "water", "", init(task)), null);
  const unsafe = {
    ...task,
    causalComparisons: [
      {
        id: "bad",
        before: { sun: "shade", water: "daily" },
        after: { sun: "full", water: "none" },
      },
    ],
  };
  assert.equal(compareCause(unsafe, "bad", "thrive", init(task)), null);
});
