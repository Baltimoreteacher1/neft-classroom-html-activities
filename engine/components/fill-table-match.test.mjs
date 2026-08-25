// Guards how generously a fill-table cell is judged.
//
// WHY THIS EXISTS. Until 2026-08-23 a fill-table printed the student's working
// and asked only for the final number. Making the working typeable was the
// right fix, and it moved the risk: a column of working has no single correct
// spelling. "Divide both sides by 3", "divide by 3" and "÷ 3" are one answer;
// so are "3x ÷ 3 = 21 ÷ 3" and "21 ÷ 3"; so are "x = 7" and "7". Judged
// literally — which is what the shared answer matcher does, correctly, for a
// multiple-choice stem — every one of those reads as wrong.
//
// Joel reported it on lesson 8.3: "this table should be a lot more flexible in
// accepting answers… I don't want the tables to be so strict throughout."
//
// The rule this test pins: NOTATION and PHRASING are forgiven, MATHEMATICS is
// not. Both halves matter — a matcher that accepts everything is worse than a
// strict one, because it tells a student their wrong answer was right. So the
// rejections below are as load-bearing as the acceptances.

import assert from "node:assert/strict";
import { cellMatches } from "./fill-table.js";

// [ authored answer, what the student typed ]
const ACCEPT = [
  // Same words, less of them.
  ["Divide both sides by 3", "divide both sides by 3"],
  ["Divide both sides by 3", "divide by 3"],
  ["Divide both sides by 3", "Divide both sides by 3."],
  ["Divide both sides by 3", "divide by three"],
  ["Multiply both sides by 4", "multiply by 4"],
  // The symbol instead of the word.
  ["Divide both sides by 3", "÷ 3"],
  ["Multiply both sides by 4", "× 4"],
  // Notation a keyboard can actually produce.
  ["84 ÷ 21", "84÷21"],
  ["84 ÷ 21", "84 / 21"],
  ["84 ÷ 21", "84 divided by 21"],
  ["94.5 ÷ 15", "94.5/15"],
  ["8 × 7 = 56 ✓", "8 × 7 = 56"],
  ["8 × 7 = 56 ✓", "8x7=56"],
  // Only the half of the equation that does the arithmetic.
  ["3x ÷ 3 = 21 ÷ 3", "21 ÷ 3"],
  ["3x ÷ 3 = 21 ÷ 3", "21/3"],
  ["3x ÷ 3 = 21 ÷ 3", "3x/3 = 21/3"],
  // The value that working arrives at.
  ["3x ÷ 3 = 21 ÷ 3", "7"],
  ["56 ÷ 8", "7"],
  ["x = 7", "7"],
  ["x = 7", "x=7"],
  // An equivalent rewrite that lands on the same quotient is correct work too.
  ["94.5 ÷ 15", "945 ÷ 150"],
  ["6.3", "6.30"],
];

const REJECT = [
  // The wrong operation is the wrong answer, however it is spelled.
  ["Divide both sides by 3", "multiply both sides by 3"],
  ["Multiply both sides by 4", "divide by 4"],
  // The wrong number is the wrong answer.
  ["Divide both sides by 3", "divide by 7"],
  ["3x ÷ 3 = 21 ÷ 3", "21 ÷ 7"],
  ["84 ÷ 21", "84 ÷ 12"],
  ["x = 7", "8"],
  ["4", "5"],
  // The divisor is not the quotient.
  ["56 ÷ 8", "8"],
  // Nothing typed is not an answer.
  ["x = 7", ""],
  ["x = 7", "   "],
];

for (const [expected, typed] of ACCEPT) {
  assert.equal(
    cellMatches(typed, expected),
    true,
    `should ACCEPT ${JSON.stringify(typed)} for ${JSON.stringify(expected)}`,
  );
}

for (const [expected, typed] of REJECT) {
  assert.equal(
    cellMatches(typed, expected),
    false,
    `should REJECT ${JSON.stringify(typed)} for ${JSON.stringify(expected)}`,
  );
}

// A free-text column ("Why?", "Reasonable?") must not be reduced to a bag of
// words, or two different explanations would compare equal.
assert.equal(
  cellMatches("because the mean is pulled up", "because the median is in the middle"),
  false,
  "free-text columns are not reduced to a bag of words",
);

// A list of accepted forms is honoured.
assert.equal(cellMatches("94.5 ÷ 15", ["94.5 ÷ 15", "945 ÷ 150"]), true);

console.log(
  `fill-table matching: ${ACCEPT.length} generous forms accepted, ${REJECT.length + 1} wrong answers still rejected.`,
);
