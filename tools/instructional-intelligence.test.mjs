import assert from "node:assert/strict";
import {
  analyzeEvidence,
  decideInstruction,
  independentRecoveryCount,
  readInstructionalEvidence,
  recordInstructionalEvidence,
} from "@eduwonderlab/engine/core/instructional-intelligence.js";

const unknown = analyzeEvidence({ correct: false });
assert.equal(
  unknown.kind,
  "unclear",
  "an incorrect answer alone does not diagnose a misconception",
);
assert.equal(
  unknown.languageAccess,
  "none",
  "language difficulty is never inferred from correctness",
);

const tagged = analyzeEvidence({ correct: false, misconception: "ratio-inverted" });
assert.equal(tagged.kind, "misconception");
assert.equal(decideInstruction(tagged).move, "targeted-repair");
assert.equal(decideInstruction(tagged).transferRequired, true);

const selfReportedLanguage = analyzeEvidence({
  correct: false,
  learnerSignal: "language-access",
  languageAccess: "learner-requested",
});
assert.equal(
  selfReportedLanguage.kind,
  "unclear",
  "self-report does not become a proficiency diagnosis",
);
assert.equal(
  decideInstruction(selfReportedLanguage, { hasAuthoredTranslation: true }).offerTranslation,
  true,
);
assert.equal(
  decideInstruction(selfReportedLanguage, { hasAuthoredTranslation: false }).offerTranslation,
  false,
);

const computational = analyzeEvidence({ correct: false, computationalSlip: true });
assert.equal(computational.kind, "computational-slip");
assert.equal(decideInstruction(computational).move, "check-the-calculation");

const secure = analyzeEvidence({ correct: true, independent: true });
assert.equal(secure.confidence, "verified");
assert.equal(decideInstruction(secure).scaffold, "maintain");
assert.equal(decideInstruction(secure, { nextIndependent: true }).move, "independent-transfer");
assert.equal(analyzeEvidence({ correct: true, independent: false }).condition, "supported");

const state = {
  value: {},
  get() {
    return this.value;
  },
  set(patch) {
    this.value = { ...this.value, ...patch };
  },
};
for (let index = 0; index < 45; index += 1) {
  recordInstructionalEvidence(state, {
    activity: "lesson-1:practice",
    correct: true,
    independent: true,
    at: index,
  });
}
const events = readInstructionalEvidence(state);
assert.equal(events.length, 40, "persisted evidence is bounded");
assert.equal(events[0].at, 5, "oldest entries are dropped first");
assert.equal(
  independentRecoveryCount(events, "lesson-1:practice"),
  0,
  "successes without observed prior support are not called recovery",
);
const repeatedTask = [
  { activity: "lesson-2:practice", kind: "unclear", condition: "supported" },
  { activity: "lesson-2:practice", itemId: "task-a", kind: "correct", condition: "independent" },
  { activity: "lesson-2:practice", itemId: "task-a", kind: "correct", condition: "independent" },
];
assert.equal(
  independentRecoveryCount(repeatedTask, "lesson-2:practice"),
  1,
  "repeated submissions to one task do not count as transfer to a new problem",
);
const recovery = [
  { activity: "lesson-3:practice", kind: "unclear", condition: "supported" },
  { activity: "lesson-3:practice", itemId: "task-a", kind: "correct", condition: "independent" },
  { activity: "lesson-3:practice", itemId: "task-b", kind: "correct", condition: "independent" },
];
assert.equal(independentRecoveryCount(recovery, "lesson-3:practice"), 2);
assert.equal(
  recordInstructionalEvidence(null, { correct: true }),
  null,
  "missing persistence is safe",
);

console.log("instructional-intelligence.test.mjs: all checks passed");
