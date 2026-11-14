import assert from "node:assert/strict";
import { masterySummary, REVIEW_GAPS_DAYS } from "./mastery-model.js";

const day = 86_400_000;
const at = (dayNumber, sessionId, extra = {}) => ({
  at: dayNumber * day,
  sessionId,
  correct: true,
  independent: true,
  hintsUsed: 0,
  ...extra,
});

assert.equal(masterySummary([], 100 * day).state, "Explore");
const supported = [at(1, "guided", { independent: false, hintsUsed: 2 })];
assert.equal(masterySummary(supported, 100 * day).evidence.independentSessions, 0);

const accuracyOnly = [at(1, "a"), at(2, "b"), at(3, "c")];
assert.deepEqual(masterySummary(accuracyOnly, 100 * day).dimensions, {
  accuracy: true,
  flexibility: false,
  efficiency: false,
});

const fluent = [
  at(1, "a", { strategy: "visual", explained: true, strategyHelped: true, responseMs: 9000 }),
  at(2, "b", { strategy: "decomposition", explained: true, strategyHelped: true, responseMs: 7000 }),
  at(3, "c", { strategy: "visual", explained: true, strategyHelped: false, responseMs: 6000 }),
];
const ready = masterySummary(fluent, 100 * day);
assert.equal(ready.state, "Fluent");
assert.deepEqual(ready.dimensions, { accuracy: true, flexibility: true, efficiency: true });
assert.equal(ready.privateMetrics.medianResponseMs, 7000);
assert.equal(ready.retention.nextDueAt, 4 * day);

const spaced = [...fluent];
let reviewDay = 3;
for (const [index, gap] of REVIEW_GAPS_DAYS.entries()) {
  reviewDay += gap;
  spaced.push(at(reviewDay, `review-${index}`, { retrieval: true }));
  const result = masterySummary(spaced, 100 * day);
  assert.equal(result.retention.completedGaps, index + 1);
  assert.equal(result.state, index === REVIEW_GAPS_DAYS.length - 1 ? "Maintained" : "Fluent");
}
assert.equal(masterySummary([...fluent, at(3.5, "too-soon", { retrieval: true })], 100 * day).retention.completedGaps, 0);
assert.equal(masterySummary([...fluent, at(4, "helped", { retrieval: true, independent: false })], 100 * day).retention.completedGaps, 0);
assert.equal(masterySummary([...fluent, at(200, "future", { retrieval: true })], 100 * day).retention.completedGaps, 0);

const extraHints = [...fluent, at(4, "helped", { independent: false, hintsUsed: 5 })];
assert.equal(masterySummary(extraHints, 100 * day).dimensions.efficiency, false);
assert.equal(masterySummary(extraHints, 100 * day).state, "Strategy");
console.log("mastery model: accuracy, flexibility, private efficiency, help exclusion, and five spaced reviews passed");
