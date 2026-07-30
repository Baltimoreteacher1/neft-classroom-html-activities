#!/usr/bin/env node
// Self-test for the misconception detector.
//
// This exists for the same reason validate:math self-tests before it runs: a
// detector that silently stops firing reports a clean classroom, which is the
// most expensive possible failure mode here. Half of these cases assert that we
// stay SILENT — those are the ones that protect students from being mislabelled,
// and they are the first thing a well-meaning "improvement" to the regexes will
// break.

import assert from "node:assert/strict";
import {
  MISCONCEPTIONS,
  detectMisconception,
  diagnoseChoice,
  recordMisconception,
  scanExpression,
  studentExplanation,
  topMisconceptions,
} from "../engine/core/misconceptions.js";

let checks = 0;
const detects = (item, typed, expected, note) => {
  checks += 1;
  const got = detectMisconception(item, typed);
  assert.equal(got, expected, `${note}\n  stem: ${item.stem}\n  typed: ${typed}\n  got: ${got}`);
};

// ---------------------------------------------------------------- operations
detects(
  { stem: "4.51 × 1.2 = ?", answer: "5.412" },
  "5.71",
  "op-added-instead-of-multiplied",
  "added the operands instead of multiplying",
);
detects(
  { stem: "What is 7 + 8?", answer: "15" },
  "56",
  "op-multiplied-instead-of-added",
  "multiplied instead of adding",
);
detects(
  { stem: "Find 12 − 30.", answer: "-18" },
  "18",
  "op-reversed-subtraction",
  "reversed the subtraction (also a sign loss — reversed order is the specific claim)",
);
detects(
  { stem: "Compute 3 ÷ 12.", answer: "0.25" },
  "4",
  "op-reversed-division",
  "reversed the division",
);
detects(
  { stem: "Compute 24 ÷ 4.", answer: "6" },
  "96",
  "op-multiplied-instead-of-divided",
  "multiplied instead of dividing",
);

// ------------------------------------------------------------- decimal place
// Both mechanisms (digits-only arithmetic, misplaced point) collapse into one
// claim on purpose; these two cases prove the merge holds from both directions.
detects(
  { stem: "4.51 × 1.2 = ?", answer: "5.412" },
  "5412",
  "decimal-place-value",
  "digits right, magnitude wrong — the whole-number route",
);
detects(
  { stem: "4.51 × 1.2 = ?", answer: "5.412" },
  "54.12",
  "decimal-place-value",
  "digits right, magnitude wrong — the shifted-point route",
);
detects(
  { stem: "What is 7 + 8?", answer: "15" },
  "150",
  null,
  "no decimals in the stem → never claim a decimal misconception",
);

// ------------------------------------------------------------------ fractions
detects(
  { stem: "Add 1/3 + 1/5.", answer: "8/15" },
  "2/8",
  "fraction-added-denominators",
  "added numerators and denominators",
);
detects(
  { stem: "Divide 7/2 ÷ 1/4.", answer: "14" },
  "7/8",
  "fraction-no-reciprocal",
  "multiplied straight across instead of inverting",
);

// -------------------------------------------------------------------- percent
detects(
  { stem: "What is 15% of 60?", answer: "9" },
  "15",
  "percent-used-as-whole-number",
  "handed back the percent itself",
);
detects(
  { stem: "What is 15% of 60?", answer: "9" },
  "900",
  "percent-scale-off-by-100",
  "scale error by a factor of 100",
);

// ------------------------------------------------------------------ exponents
detects(
  { stem: "Evaluate 2³.", answer: "8" },
  "6",
  "exponent-as-multiplication",
  "base times exponent",
);
detects(
  { stem: "A square is 52 in² in area.", answer: "52" },
  "104",
  null,
  "a unit superscript is not an exponent — no digit sits before in²",
);

// -------------------------------------------------------- order of operations
detects(
  { stem: "3 + 4 × 5", answer: "23" },
  "35",
  "order-of-operations-left-to-right",
  "worked strictly left to right",
);

// ----------------------------------------------------------------- statistics
detects(
  { stem: "Find the mean of 4, 8, 12, 16.", answer: "10" },
  "40",
  "stat-summed-instead-of-averaged",
  "summed the set instead of averaging",
);

// ---------------------------------------------------------------- measurement
detects(
  { stem: "Find the area of a rectangle 8 by 3 units.", answer: "24" },
  "22",
  "measure-area-perimeter-swap",
  "gave the perimeter when asked for area",
);

// --------------------------------------------------------- silence contracts
// Everything below MUST return null. These are the guardrails, not the feature.
detects(
  { stem: "4.51 × 1.2 = ?", answer: "5.412" },
  "5.412",
  null,
  "a correct answer is never a misconception",
);
detects(
  { stem: "4.51 × 1.2 = ?", answer: "5.412" },
  "99.99",
  null,
  "an unexplained wrong answer stays unexplained",
);
detects(
  { stem: "Solve x + 2 = 9 for x.", answer: "7" },
  "11",
  null,
  "'x' is a variable here, not a multiplication sign — no expression should be scanned",
);
detects({ stem: "Explain why the model works.", answer: "7" }, "", null, "empty input");
detects(
  { stem: "Which statement is true?", answer: "The ratio is 3:4" },
  "3",
  null,
  "non-numeric answer → nothing to predict against",
);
detects(
  { stem: "6 × 2 and 4 + 8 both appear here", answer: "12" },
  "8",
  null,
  "two candidate expressions is ambiguous → scan refuses",
);

// ------------------------------------------------------- authored tags win
{
  checks += 1;
  const item = {
    stem: "What is 3.4 × 2.6?",
    answer: "8.84",
    misconceptionTags: [null, "place-value", "place-value", null],
  };
  // Choice index 1 is authored as a place-value error; the author's call stands
  // even though inference would also have to work this out.
  assert.equal(detectMisconception(item, "88.4", 1), "decimal-place-value");
  // An unauthored distractor falls through to inference and stays silent when
  // nothing identifies it.
  assert.equal(detectMisconception(item, "8.48", 3), null);
}

// ---------------------------------------------------------------- scanner API
{
  checks += 1;
  const scanned = scanExpression("3/4 + 1/2");
  assert.ok(scanned, "fraction addition should scan");
  assert.equal(scanned.op, "+", "the + is the operator, not the fraction bars");
  assert.equal(scanned.aText, "3/4");
  assert.equal(scanned.bText, "1/2");
}
checks += 1;
assert.equal(scanExpression("no math here"), null, "prose scans to nothing");

// ------------------------------------------------------------ aggregation API
{
  checks += 1;
  const bag = new Map();
  const store = { get: (k) => bag.get(k), set: (k, v) => bag.set(k, v) };
  recordMisconception(store, "fraction-added-denominators");
  recordMisconception(store, "fraction-added-denominators");
  recordMisconception(store, "decimal-place-value");
  recordMisconception(store, "not-a-real-id");
  const counts = bag.get("misconceptions");
  assert.deepEqual(counts, { "fraction-added-denominators": 2, "decimal-place-value": 1 });
  const top = topMisconceptions(counts, 2);
  assert.equal(top[0].id, "fraction-added-denominators");
  assert.equal(top[0].count, 2);
  assert.ok(top[0].watchFor, "every reported misconception carries a teacher move");
}

// Every entry in the taxonomy must be fully populated — a half-authored entry
// would render a blank chip in the facilitation console.
for (const [id, entry] of Object.entries(MISCONCEPTIONS)) {
  checks += 1;
  assert.ok(entry.label, `${id} needs a label`);
  assert.ok(entry.labelEs, `${id} needs a Spanish label`);
  assert.ok(entry.watchFor, `${id} needs a teacher move`);
  assert.ok(entry.student, `${id} needs a student-facing explanation`);
  assert.ok(entry.studentEs, `${id} needs a Spanish student-facing explanation`);
}

// ------------------------------------------------- multiple-choice item shape
//
// The lesson renderer passes items shaped `choices` + `correctIndex`, with no
// `answer` field at all. Before diagnoseChoice existed, every one of those
// 1,840 items fell straight through the detector and reported nothing, so these
// cases are the ones standing between the main lesson path and silence.
{
  const item = {
    stem: "A recipe needs 3/4 ÷ 1/4 cups of flour per batch. What is the quotient?",
    choices: ["3", "3/16", "1/3", "4"],
    correctIndex: 0,
  };
  checks += 1;
  assert.equal(
    diagnoseChoice(item, 1)?.id,
    "fraction-no-reciprocal",
    "multiplying 3/4 by 1/4 instead of inverting is 3/16",
  );
  checks += 1;
  assert.equal(diagnoseChoice(item, 0), null, "the correct choice is never diagnosed");
  checks += 1;
  assert.equal(diagnoseChoice(item, 9), null, "an out-of-range choice index is not a diagnosis");
  checks += 1;
  assert.equal(diagnoseChoice(item, null), null, "a null choice index is not a diagnosis");
}

{
  // Authored tags still outrank inference on the choice path.
  const item = {
    stem: "What is 4.51 × 1.2?",
    choices: ["5.412", "54.12", "5.71", "3.31"],
    correctIndex: 0,
    misconceptionTags: [null, "place-value", null, null],
  };
  checks += 1;
  assert.equal(diagnoseChoice(item, 1)?.id, "decimal-place-value", "authored tag wins");
  checks += 1;
  assert.ok(diagnoseChoice(item, 1)?.student, "a diagnosis always carries student copy");
}

{
  // A distractor no named misconception predicts must produce NO diagnosis —
  // this is the case that keeps the chip from mislabelling a student's thinking.
  const item = { stem: "What is 12 + 5?", choices: ["17", "19", "60", "7"], correctIndex: 0 };
  checks += 1;
  assert.equal(diagnoseChoice(item, 1), null, "an unexplained distractor stays unnamed");
  checks += 1;
  assert.equal(
    diagnoseChoice(item, 2)?.id,
    "op-multiplied-instead-of-added",
    "12 × 5 = 60 is the named multiply-for-add error",
  );
}

// studentExplanation falls back to English rather than to blank.
checks += 1;
assert.ok(studentExplanation("ratio-inverted", "es").length > 0, "Spanish copy resolves");
checks += 1;
assert.equal(
  studentExplanation("not-a-real-id"),
  "",
  "unknown ids resolve to empty, not undefined",
);
checks += 1;
assert.equal(
  studentExplanation("sign-dropped", "fr"),
  MISCONCEPTIONS["sign-dropped"].student,
  "an unsupported language falls back to English",
);

console.log(`misconception detector: ${checks} checks passed.`);
