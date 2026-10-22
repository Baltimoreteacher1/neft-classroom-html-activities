import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  analyzeEvidence,
  independentRecoveryCount,
  recordInstructionalEvidence,
} from "@eduwonderlab/engine/core/instructional-intelligence.js";

const unclear = analyzeEvidence({ activity: "/math/game", correct: false });
assert.equal(unclear.kind, "unclear", "a wrong answer without a named signal stays unclear");
assert.equal(
  analyzeEvidence({ correct: false, misconception: "inverse-operation" }).kind,
  "misconception",
);
assert.equal(
  analyzeEvidence({ correct: false, computationalSlip: true }).kind,
  "computational-slip",
);
assert.equal(analyzeEvidence({ correct: true, misconception: "ignored" }).kind, "correct");

let saved = {};
const state = { get: () => saved, set: (value) => (saved = { ...saved, ...value }) };
recordInstructionalEvidence(state, { activity: "fraction-game", correct: false });
recordInstructionalEvidence(state, { activity: "fraction-game", correct: true, supported: true });
recordInstructionalEvidence(state, { activity: "fraction-game", correct: true });
assert.equal(saved.instructionalEvidence.events[0].kind, "unclear");
assert.equal(saved.instructionalEvidence.events[1].condition, "supported");
assert.equal(independentRecoveryCount(saved.instructionalEvidence.events, "fraction-game"), 1);

const runtime = await readFile(new URL("../assets/game-studio.js", import.meta.url), "utf8");
assert.match(runtime, /import\("\/assets\/game-studio-intelligence\.js"\)/);
assert.match(runtime, /recordInstructionalFeedback\(detail\)/);
assert.match(runtime, /instructionalEvidence: prevGame\.instructionalEvidence/);
console.log("GameStudio instructional evidence checks passed.");
