import assert from "node:assert/strict";
import {
  describe,
  exactSignTest,
  medianInterval,
  pairedSummary,
} from "../access-teacher/predictive/analysis.js";

assert.deepEqual(describe([1, 2, 3, 4]), {
  n: 4,
  mean: 2.5,
  sd: 1.29,
  median: 2.5,
  q1: 1.75,
  q3: 3.25,
  min: 1,
  max: 4,
});
assert.deepEqual(exactSignTest([1, 1, 1, 1, 1]), {
  n: 5,
  positive: 5,
  negative: 0,
  p: 0.0625,
  effect: 1,
});
assert.equal(exactSignTest([1, 1, 1, 1, 1, 1]).p, 0.03125);
assert.deepEqual(exactSignTest([1, 0, -1]), { n: 2, positive: 1, negative: 1, p: 1, effect: 0 });
assert.deepEqual(medianInterval([1, 2, 3, 4, 5, 6]), { lo: 1, hi: 6, exactCoverage: 0.96875 });
assert.equal(pairedSummary([1, 1, 1, 1, 1]).median, 1);
console.log("PASS ACCESS Statistical Lab calculations");
