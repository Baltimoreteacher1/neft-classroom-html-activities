import assert from "node:assert/strict";
import fs from "node:fs";
import {
  decideInstruction,
  independentRecoveryCount,
  readInstructionalEvidence,
  recordInstructionalEvidence,
} from "@eduwonderlab/engine/core/instructional-intelligence.js";
import { getProject } from "../curriculum/projects/studio/projects.mjs";
import { clean, fresh } from "../curriculum/projects/studio/state.mjs";

const project = getProject("unit-3-a");
const state = fresh(project);
const store = { get: () => state, set: (patch) => Object.assign(state, patch) };
const activity = `project-studio:${project.id}:rate-a`;

recordInstructionalEvidence(store, { activity, correct: false });
const unclear = readInstructionalEvidence(store).at(-1);
assert.equal(unclear.kind, "unclear");
assert.equal(unclear.confidence, "insufficient");
assert.equal(decideInstruction(unclear).move, "ask-learner-what-would-help");
recordInstructionalEvidence(store, {
  activity,
  correct: false,
  independent: false,
  learnerSignal: "language-access",
  languageAccess: "learner-requested",
});
assert.equal(readInstructionalEvidence(store).at(-1).languageAccess, "learner-requested");
recordInstructionalEvidence(store, { activity, correct: true, independent: false });
recordInstructionalEvidence(store, { activity, correct: true });
assert.equal(independentRecoveryCount(readInstructionalEvidence(store), activity), 1);

const roundTrip = clean(project, {
  ...state,
  vision: "private draft text must not be copied into evidence",
  supportSignals: { "rate-a": "language-access", unexpected: "strategy-clarification" },
});
assert.deepEqual(roundTrip.supportSignals, { "rate-a": "language-access" });
assert.equal(roundTrip.instructionalEvidence.events.length, 4);
assert.ok(
  roundTrip.instructionalEvidence.events.every(
    (event) => !("answer" in event) && !("reasoning" in event),
  ),
);
assert.ok(
  roundTrip.instructionalEvidence.events.every((event) =>
    event.activity.startsWith(`project-studio:${project.id}:`),
  ),
);

const source = fs.readFileSync("curriculum/projects/studio/studio.js", "utf8");
assert.match(source, /Choose a kind of help\. Your answer does not tell us why it was difficult\./);
assert.match(source, /This request is not evidence that your math understanding is weak\./);
assert.match(source, /recordCheck\(q\.id, good, signal\)/);

console.log(
  "PASS: Project Studio records bounded categorical evidence, asks for help preferences without inferring causes, and preserves local privacy on restore.",
);
