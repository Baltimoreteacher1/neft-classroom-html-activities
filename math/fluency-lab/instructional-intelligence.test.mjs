import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  decideInstruction,
  independentRecoveryCount,
  readInstructionalEvidence,
  recordInstructionalEvidence,
} from "../../engine/core/instructional-intelligence.js";

let saved;
const adapter = {
  get: () => ({ instructionalEvidence: saved }),
  set: (value) => { saved = value.instructionalEvidence; },
};

// Fluency Lab records evidence categories only; submitted answers and explanations
// remain in their existing activity flows and are not copied to this contract.
recordInstructionalEvidence(adapter, {
  activity: "6:ratios",
  correct: false,
  independent: false,
  learnerSignal: "language-access",
  languageAccess: "learner-requested",
  responseText: "private explanation text",
  answer: "student answer",
});
const events = readInstructionalEvidence(adapter);
assert.equal(events.length, 1);
assert.equal(events[0].kind, "unclear", "a wrong answer does not invent a diagnosis");
assert.equal(events[0].languageAccess, "learner-requested", "language support is self-requested, never inferred");
assert.equal(events[0].condition, "supported");
assert.equal(JSON.stringify(saved).includes("private explanation text"), false);
assert.equal(JSON.stringify(saved).includes("student answer"), false);
assert.equal(decideInstruction(events[0]).move, "language-access");

recordInstructionalEvidence(adapter, { activity: "6:ratios", correct: true, independent: true });
assert.equal(independentRecoveryCount(readInstructionalEvidence(adapter), "6:ratios"), 1);
assert.equal(decideInstruction(readInstructionalEvidence(adapter).at(-1), { nextIndependent: true }).move, "independent-transfer");

const app = await readFile(new URL("./app.js", import.meta.url), "utf8");
assert.match(app, /instructional-intelligence\.js/);
assert.match(app, /recordInstructionalEvidence\(instructionalEvidenceState, responseInput\)/);
assert.match(app, /languageAccess: state\.instructionalSignal === "language-access" \? "learner-requested" : "none"/);
assert.match(app, /independentRecoveryCount\(activityEvidence, tutorSkillKey\(skill\)\)/);

console.log("Fluency Lab instructional evidence seam passed");
