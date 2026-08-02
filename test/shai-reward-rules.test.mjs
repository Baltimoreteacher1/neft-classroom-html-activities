import "../shai-school/reward-rules.js";
import assert from "node:assert/strict";

const { pushupRewardIncrement, pushupWeeklyTarget, normalizePushupTiers, READING_RATE_DEFAULT, READING_ITEM_ID } =
  globalThis.ShaiRewardRules;

assert.equal(READING_RATE_DEFAULT, 0.25);
assert.equal(READING_ITEM_ID, "reading");

// --- factory defaults (no tiers passed) -------------------------------------
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

// --- parent-edited amounts --------------------------------------------------
// A parent raising the ladder in Parent settings must change what gets paid.
const custom = [
  { days: 4, total: 10 },
  { days: 2, total: 4 },
  { days: 1, total: 1 },
];
assert.equal(pushupWeeklyTarget(0, custom), 0);
assert.equal(pushupWeeklyTarget(1, custom), 1);
assert.equal(pushupWeeklyTarget(3, custom), 4);
assert.equal(pushupWeeklyTarget(4, custom), 10);
// Mid-week raise: already paid $2 at the old rate, so only the difference tops up.
assert.equal(pushupRewardIncrement(4, 2, custom), 8);
// Lowering below what was already paid never claws money back.
assert.equal(pushupRewardIncrement(4, 5, [{ days: 4, total: 3 }]), 0);

// --- normalization ----------------------------------------------------------
// Stored order must not matter: highest day requirement always wins first.
assert.deepEqual(
  normalizePushupTiers([
    { days: 1, total: 0.5 },
    { days: 4, total: 5 },
    { days: 2, total: 2 },
  ]),
  [
    { days: 4, total: 5 },
    { days: 2, total: 2 },
    { days: 1, total: 0.5 },
  ],
);
// Garbage in state (empty, non-array, bad numbers) falls back to the defaults.
assert.deepEqual(normalizePushupTiers([]), [
  { days: 4, total: 5 },
  { days: 2, total: 2 },
  { days: 1, total: 0.5 },
]);
assert.deepEqual(normalizePushupTiers(null), normalizePushupTiers([]));
assert.deepEqual(normalizePushupTiers([{ days: "2", total: "3.5" }]), [{ days: 2, total: 3.5 }]);
assert.deepEqual(normalizePushupTiers([{ days: 3, total: -9 }]), [{ days: 3, total: 0 }]);
// A zero-dollar tier is legitimate (parent turns one rung off) and must survive.
assert.equal(pushupWeeklyTarget(1, [{ days: 1, total: 0 }]), 0);

console.log("Shai push-up reward rules passed");
