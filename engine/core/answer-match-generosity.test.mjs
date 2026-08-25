// Guards the generosity added to the shared answer matcher on 2026-08-23.
//
// WHY THIS EXISTS. `isRight` is the single source of truth for every typed
// answer in the product — lesson practice, Connect blanks, fill-in tables,
// homework pages, SCORM packages, and the small-group studio. It compared
// answers by normalised STRING or by numeric VALUE, which is exactly right for
// "what is the quotient?" and exactly wrong for a cell that asks a student to
// show a move. Division had two spellings that did not unify ("84/21" vs
// "84 ÷ 21"), and a described move has as many spellings as there are students.
//
// Joel, reviewing lesson 8.3: "this table should be a lot more flexible in
// accepting answers… I don't want the tables to be so strict throughout
// (lessons or small-group lessons)."
//
// THE RULE: forgive NOTATION and PHRASING, never the mathematics. The REJECT
// list below is the load-bearing half — a matcher that accepts everything tells
// a student their wrong answer was right, which is worse than one that is too
// strict. In particular, word order is dropped to make phrasing work, so this
// pins the guard that refuses to drop it once two numbers are in play:
// "56 ÷ 8" and "8 ÷ 56" must never compare equal.

import assert from "node:assert/strict";
import { isRight, phraseKey } from "./answer-match.js";

// [ authored answer, what the student typed ]
const ACCEPT = [
  // Division notation finally unifies with the rest of the operators.
  ["84 ÷ 21", "84/21"],
  ["84 ÷ 21", "84 / 21"],
  ["84 ÷ 21", "84÷21"],
  ["84/21", "84 ÷ 21"],
  ["84 ÷ 21", "84 divided by 21"],
  ["3 × 4", "3 times 4"],
  // A described move, however much of the sentence the student writes.
  ["Divide both sides by 3", "divide by 3"],
  ["Divide both sides by 3", "÷ 3"],
  ["Divide both sides by 3", "divide by three"],
  ["Divide both sides by 3", "Divide both sides by 3."],
  ["Multiply both sides by 4", "multiply by 4"],
  ["Multiply both sides by 4", "× 4"],
  // Either half of a stated equation, when that half carries the arithmetic.
  ["3x ÷ 3 = 21 ÷ 3", "21 ÷ 3"],
  ["3x ÷ 3 = 21 ÷ 3", "21/3"],
  // Behaviour that predates this change and must not regress.
  ["x = 7", "7"],
  ["24", "24 sq. ft."],
  ["0.5", ".5"],
  ["1 1/2", "1.5"],
];

const REJECT = [
  // Word order is dropped to make phrasing work. It may only be dropped while
  // there is nothing for the order to mean — these are the cases that prove it.
  ["56 ÷ 8", "8 ÷ 56"],
  ["21 ÷ 3", "3 ÷ 21"],
  ["12 − 5", "5 − 12"],
  // The wrong operation, however it is spelled.
  ["Divide both sides by 3", "multiply both sides by 3"],
  ["Multiply both sides by 4", "divide by 4"],
  // The wrong number.
  ["Divide both sides by 3", "divide by 7"],
  ["84 ÷ 21", "84 ÷ 12"],
  ["x = 7", "8"],
  // A half of the answer with no arithmetic in it is not an answer: "x = 7"
  // must never be satisfied by "x".
  ["x = 7", "x"],
  ["3x = 12", "x"],
  // A bare number still may not be credited against a non-numeric answer.
  ["2 × 3 × 7", "42"],
  // Nothing typed is not an answer.
  ["x = 7", ""],
  ["x = 7", "   "],
];

for (const [expected, typed] of ACCEPT) {
  assert.equal(
    isRight(typed, expected),
    true,
    `should ACCEPT ${JSON.stringify(typed)} for ${JSON.stringify(expected)}`,
  );
}

for (const [expected, typed] of REJECT) {
  assert.equal(
    isRight(typed, expected),
    false,
    `should REJECT ${JSON.stringify(typed)} for ${JSON.stringify(expected)}`,
  );
}

// Free prose must never be reduced to a bag of words, or two different
// explanations built from the same vocabulary would compare equal.
assert.equal(
  isRight("the median is the middle value", "the middle value is the median"),
  false,
  "free prose is not reduced to a bag of words",
);

// A coefficient must survive: "3x" is a term, not "3 multiply x".
assert.ok(phraseKey("3x = 12").includes("3x"), "a trailing x stays part of its term");

// A list of accepted answers still works.
assert.equal(isRight("÷ 3", ["Divide both sides by 3", "divide by 3"]), true);

console.log(
  `answer-match generosity: ${ACCEPT.length} forms accepted, ${REJECT.length + 2} wrong answers still rejected.`,
);
