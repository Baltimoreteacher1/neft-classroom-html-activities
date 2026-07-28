import "../shai-school/reward-rules.js";
import assert from "node:assert/strict";

const { pushupRewardIncrement, pushupWeeklyTarget } = globalThis.ShaiRewardRules;

assert.equal(pushupWeeklyTarget(0), 0);
assert.equal(pushupWeeklyTarget(1), 0.5);
assert.equal(pushupWeeklyTarget(2), 2);
assert.equal(pushupWeeklyTarget(3), 2);
assert.equal(pushupWeeklyTarget(4), 5);
assert.equal(pushupWeeklyTarget(7), 5);

assert.equal(pushupRewardIncrement(1, 0), 0.5);
assert.equal(pushupRewardIncrement(2, 0.5), 1.5);
assert.equal(pushupRewardIncrement(3, 2), 0);
assert.equal(pushupRewardIncrement(4, 2), 3);
assert.equal(pushupRewardIncrement(4, 5), 0);

console.log("Shai push-up reward rules passed");
