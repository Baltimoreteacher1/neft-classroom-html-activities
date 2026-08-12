// The two-minute diagnostic's selection rules, which are the part that can go
// quietly wrong. A rendering bug is visible the first time a teacher opens the
// studio; a selection bug is not — it silently eats practice items, or asks a
// question whose wrong answers cannot be named, which reports "missed" and calls
// it a diagnosis.

import assert from "node:assert/strict";
import {
  correctIndexOf,
  diagnose,
  isDiagnosable,
  MAX_DIAGNOSTIC_ITEMS,
  repeatPhrase,
  selectDiagnosticItems,
  summarize,
} from "./small-group-diagnostic.js";

// An item whose distractor the author named: always diagnosable.
const TAGGED = {
  type: "multiple-choice",
  stem: "A recipe uses 3 cups of flour for every 5 cups of water. What is the ratio of flour to water?",
  choices: ["5:3", "3:5", "8:5", "3:8"],
  correctIndex: 1,
  misconceptionTags: ["ratio-inverted", null, null, null],
};

// A perfectly good practice item with nothing nameable behind any wrong answer.
const PLAIN = {
  type: "multiple-choice",
  stem: "Which of these is a prime number?",
  choices: ["9", "7", "15", "21"],
  correctIndex: 1,
};

const OPEN = { type: "open-response", stem: "Explain your reasoning." };

// ── correctIndexOf: the three ways items spell their answer ──
{
  assert.equal(correctIndexOf({ correctIndex: 2 }), 2);
  assert.equal(correctIndexOf({ answerIndex: 0 }), 0);
  assert.equal(correctIndexOf({ choices: ["a", "b", "c"], answer: "b" }), 1);
  assert.equal(correctIndexOf({ choices: ["a", "b"], answer: "zzz" }), null);
  assert.equal(correctIndexOf({}), null);
}

// ── diagnose: authored tags win, unknown tags report nothing ──
{
  assert.equal(diagnose(TAGGED, 0), "ratio-inverted");
  // The correct choice is never diagnosed by the caller, but asking is harmless.
  assert.equal(diagnose(PLAIN, 0), null);
  // A tag with no taxonomy entry is not a diagnosis — reporting a label nobody
  // can look up is worse than silence.
  assert.equal(diagnose({ ...PLAIN, misconceptionTag: "invented-tag" }, 0), null);
}

// ── isDiagnosable ──
{
  assert.equal(isDiagnosable(TAGGED), true);
  assert.equal(isDiagnosable(PLAIN), false, "an unnameable miss is not a diagnosis");
  assert.equal(isDiagnosable(OPEN), false, "open response cannot be auto-diagnosed");
  assert.equal(isDiagnosable({ type: "multiple-choice", choices: ["only one"] }), false);
  assert.equal(isDiagnosable(null), false);
}

// ── selectDiagnosticItems ──

const pool = (n, diagnosableAt = []) =>
  Array.from({ length: n }, (_, i) =>
    diagnosableAt.includes(i) ? { ...TAGGED, id: i } : { ...PLAIN, id: i },
  );

// It draws from the TAIL — the overflow items a short rotation rarely reaches.
{
  const items = pool(8, [1, 6, 7]);
  const { picked } = selectDiagnosticItems(items);
  assert.deepEqual(
    picked.map((p) => p.id),
    [1, 6, 7],
    "picks the diagnosable items, asked in curriculum order",
  );
}

// Nothing is lost and nothing is duplicated: picked + remaining is the pool.
{
  const items = pool(9, [2, 7, 8]);
  const { picked, remaining } = selectDiagnosticItems(items);
  assert.equal(picked.length + remaining.length, items.length);
  const ids = [...picked, ...remaining].map((x) => x.id).sort((a, b) => a - b);
  assert.deepEqual(ids, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
}

// Order of what's left is preserved, so the practice sequence is unchanged apart
// from the absence of items already answered.
{
  const items = pool(8, [6, 7]);
  const { remaining } = selectDiagnosticItems(items);
  assert.deepEqual(
    remaining.map((r) => r.id),
    [0, 1, 2, 3, 4, 5],
  );
}

// It never asks more than the two-minute budget allows.
{
  const items = pool(12, [3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const { picked } = selectDiagnosticItems(items);
  assert.equal(picked.length, MAX_DIAGNOSTIC_ITEMS);
}

// It never strips the practice pool bare: a diagnostic that consumes the lesson
// has replaced it rather than opened it.
{
  for (const n of [0, 1, 2, 3]) {
    const items = pool(n, [0, 1, 2]);
    const { picked, remaining } = selectDiagnosticItems(items);
    assert.ok(remaining.length >= Math.min(n, 2), `pool of ${n} keeps its practice items`);
    assert.ok(picked.length <= Math.max(0, n - 2), `pool of ${n} does not over-draw`);
  }
}

// No diagnosable item anywhere → the pool is returned untouched and the studio
// renders exactly as it did before this feature existed.
{
  const items = pool(6);
  const { picked, remaining } = selectDiagnosticItems(items);
  assert.equal(picked.length, 0);
  assert.deepEqual(
    remaining.map((r) => r.id),
    [0, 1, 2, 3, 4, 5],
  );
}

// ── summarize ──
{
  const s = summarize([
    { correct: false, tag: "ratio-inverted" },
    { correct: false, tag: "ratio-inverted" },
    { correct: true, tag: null },
  ]);
  assert.equal(s.answered, 3);
  assert.equal(s.correct, 1);
  assert.equal(s.missed, 2);
  assert.equal(s.clean, false);
  assert.equal(s.focus.tag, "ratio-inverted");
  assert.equal(s.focus.count, 2);
  assert.ok(s.focus.label && s.focus.label !== "ratio-inverted", "the focus carries a real label");
}

// One focus, not a list — a teacher mid-rotation can change one thing.
{
  const s = summarize([
    { correct: false, tag: "ratio-inverted" },
    { correct: false, tag: "ratio-inverted" },
    { correct: false, tag: "sign-dropped" },
  ]);
  assert.equal(s.focus.tag, "ratio-inverted", "the most frequent error wins");
  assert.equal(s.named.length, 2, "the rest are still available to the teacher view");
}

// All correct is "clean"; answering nothing is not.
{
  assert.equal(summarize([{ correct: true }, { correct: true }]).clean, true);
  assert.equal(summarize([]).clean, false, "an empty run has proved nothing");
  assert.equal(summarize([]).focus, null);
}

// A miss nobody can name still counts as a miss, and still yields no focus —
// the card must say so rather than invent one.
{
  const s = summarize([{ correct: false, tag: null }]);
  assert.equal(s.missed, 1);
  assert.equal(s.focus, null);
}

// ── repeatPhrase ──
{
  assert.equal(repeatPhrase(1), "");
  assert.equal(repeatPhrase(0), "");
  assert.equal(repeatPhrase(2), " — twice");
  assert.equal(repeatPhrase(3), " — 3 times");
}

console.log("PASS small-group-diagnostic: selection, diagnosis and summary contracts");
