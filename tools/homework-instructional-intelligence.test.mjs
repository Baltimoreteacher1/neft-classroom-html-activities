import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  analyzeEvidence,
  decideInstruction,
  independentRecoveryCount,
  recordInstructionalEvidence,
} from "@eduwonderlab/engine/core/instructional-intelligence.js";

const generator = await readFile(
  new URL("../scripts/generate-homework-html.mjs", import.meta.url),
  "utf8",
);

test("homework sends only categorical evidence through its current per-lesson save key", () => {
  assert.match(generator, /import\("\/assets\/game-studio-intelligence\.js"\)/);
  assert.match(generator, /activity,\s*itemId,/);
  assert.match(generator, /const itemId = "problem-" \+ String\(idx\)/);
  assert.match(generator, /STORAGE_KEY\s*=\s*"hw_state_lesson_" \+ window\.LESSON_ID/);
  assert.match(generator, /state\.instructionalEvidence\s*=\s*previous\.instructionalEvidence/);
  assert.match(generator, /window\.__HW_INSTRUCTIONAL_EVIDENCE__ = state\.instructionalEvidence/);
  assert.match(generator, /data-choice-evidence=/);
  assert.match(
    generator,
    /data-topic="\$\{esc\(it\.topic \|\| it\.skill \|\| it\.standard \|\| topic\)\}"/,
  );
  assert.match(generator, /event\.activity === activity && event\.itemId !== itemId/);
  assert.match(
    generator,
    /hwRecordInstructionalEvidence\(idx, section, isProblemCorrect, priorAttempts\)/,
  );
  assert.match(generator, /const priorAttempts = problemAttempts\[idx\] \|\| 0/);
  assert.match(generator, /const supported = priorAttempts > 0 \|\| revealForced\[idx\] === true/);
  const recordBlock =
    generator.match(
      /engine\.recordInstructionalEvidence\(hwEvidenceState\(\),\s*\{([^}]+)\}/,
    )?.[1] || "";
  assert.ok(recordBlock, "the shared recorder receives a structured categorical object");
  assert.doesNotMatch(recordBlock, /studentName|textarea|responseText|studentResponse/);
});

test("a retry stays tied to its item; transfer requires a different item after support", () => {
  let saved = {};
  const state = { get: () => saved, set: (patch) => (saved = { ...saved, ...patch }) };
  const activity = "family-homework-6-1";
  const itemA = "problem-2";
  const itemB = "problem-3";

  const firstMiss = recordInstructionalEvidence(state, { activity, itemId: itemA, correct: false });
  const retry = recordInstructionalEvidence(state, {
    activity,
    itemId: itemA,
    correct: true,
    supported: true,
  });
  const transfer = recordInstructionalEvidence(state, { activity, itemId: itemB, correct: true });
  recordInstructionalEvidence(state, { activity, itemId: itemB, correct: true });

  assert.equal(firstMiss.kind, "unclear", "a miss does not imply a misconception");
  assert.equal(retry.condition, "supported");
  assert.equal(transfer.condition, "independent");
  assert.equal(transfer.itemId, itemB, "the stable task ID is persisted with each event");
  assert.equal(independentRecoveryCount(saved.instructionalEvidence.events, activity), 1);
  assert.equal(
    decideInstruction(transfer, { nextIndependent: false }).move,
    "fade-one-support",
    "a lone correct answer does not get announced as transfer",
  );
  assert.equal(decideInstruction(transfer, { nextIndependent: true }).move, "independent-transfer");
});

test("a repair in another authored topic cannot enable transfer language", () => {
  let saved = {};
  const state = { get: () => saved, set: (patch) => (saved = { ...saved, ...patch }) };
  const fractions = "family-homework-6-1:fractions";
  const percent = "family-homework-6-1:percent";
  recordInstructionalEvidence(state, { activity: fractions, itemId: "problem-2", correct: false });
  const unrelatedSuccess = recordInstructionalEvidence(state, {
    activity: percent,
    itemId: "problem-3",
    correct: true,
  });
  assert.equal(independentRecoveryCount(saved.instructionalEvidence.events, percent), 0);
  assert.equal(
    decideInstruction(unrelatedSuccess, { nextIndependent: false }).move,
    "fade-one-support",
  );
});

test("diagnostic choices route calculation, strategy, and language support separately", () => {
  const base = analyzeEvidence({ activity: "family-homework-6-1:problem-1", correct: false });
  assert.equal(
    decideInstruction({ ...base, learnerSignal: "calculation-check" }).move,
    "check-the-calculation",
  );
  assert.equal(
    decideInstruction({ ...base, learnerSignal: "strategy-clarification" }).move,
    "ask-targeted-math-question",
  );
  assert.equal(
    decideInstruction(
      { ...base, learnerSignal: "language-access", languageAccess: "learner-requested" },
      { hasAuthoredTranslation: true },
    ).move,
    "language-access",
  );
  assert.match(generator, /Check my calculation/);
  assert.match(generator, /See a model/);
  assert.match(generator, /Read in Spanish/);
  assert.match(generator, /I noticed ___ \. I chose ___ because ___\./);
  assert.match(generator, /Family coach:/);
});

test("next practice reuses an authored item of the same type and falls back to the existing Play tab", () => {
  assert.match(generator, /item\.dataset\.problemType === current\.dataset\.problemType/);
  assert.match(generator, /switchHomeworkTab\("play"\)/);
  assert.match(generator, /next\.closest\("\.more-practice"\)/);
});

console.log("Family homework instructional intelligence checks passed.");
