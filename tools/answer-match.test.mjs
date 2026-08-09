// Contract for the site-wide answer matcher (engine/core/answer-match.js).
//
// Written after lesson 7-3 ("Solve Multiplication and Division Equations")
// marked a correct answer wrong: the authored answer was "m = 7" and a student
// who typed "7" got a red X. The variable label and the unit are bookkeeping —
// worth suggesting, never worth withholding credit for. The negative cases
// below are the other half of the contract: loosening the match must not start
// crediting answers that are genuinely incomplete.

import assert from "node:assert/strict";
import { fullerFormHint, isRight, numericValue, stripLabel } from "../engine/core/answer-match.js";

let passed = 0;
const accepts = (input, answer, why) => {
  assert.equal(
    isRight(input, answer),
    true,
    `should ACCEPT ${JSON.stringify(input)} for ${JSON.stringify(answer)} — ${why}`,
  );
  passed += 1;
};
const rejects = (input, answer, why) => {
  assert.equal(
    isRight(input, answer),
    false,
    `should REJECT ${JSON.stringify(input)} for ${JSON.stringify(answer)} — ${why}`,
  );
  passed += 1;
};

// ── The reported bug: a variable label is optional, in either direction ──
accepts("7", "m = 7", "bare number against a labelled answer");
accepts("m = 7", "7", "labelled answer against a bare number");
accepts("m=7", "m = 7", "spacing around = is irrelevant");
accepts("M = 7", "m = 7", "case is irrelevant");
accepts("b = 12", "12 boxes", "label on one side, unit on the other");
accepts("n is 8", "8", "students write 'is' for '='");
accepts("7 = m", "m = 7", "reversed label");
accepts("x = 4", "m = 4", "the letter the student picks is not the answer");

// ── Units are optional, in either direction ──
accepts("24", "24 sq. ft.", "unit omitted");
accepts("24 sq ft", "24", "unit added");
accepts("24 square feet", "24 sq. ft.", "unit spelled out");
accepts("12 cm²", "12", "unit with a superscript");
accepts("3.5", "3.5 meters", "decimal with a unit");
accepts("$4.50", "4.5", "currency formatting");
accepts("4.50", "$4.50", "currency omitted");
accepts("50", "50%", "percent omitted");
accepts("1,000", "1000", "thousands separator");

// ── Equivalent numeric spellings ──
accepts(".5", "1/2", "decimal against a fraction");
accepts("0.50", "1/2", "trailing zero");
accepts("1 1/2", "1.5", "mixed number");
accepts("-3", "−3", "unicode minus");

// ── A dropped leading zero, inside a COMPOSITE answer ──
// `numberOf` accepted a bare ".5" from the start, but only when that number was
// the ENTIRE answer. 39 authored answers across the decimal/percent lessons are
// written as an equation ("0.5 = 50%"), where the whole-string numeric parse
// never applies — so a student who typed ".5 = 50%" got a red X for exactly the
// habit the matcher already set out to forgive.
accepts(".5 = 50%", "0.5 = 50%", "leading zero dropped inside an equation");
accepts("0.5 = 50%", ".5 = 50%", "and in the other direction");
accepts(".25 = 25%", "0.25 = 25%", "same, two decimal places");
accepts("2.5", "2.5", "an interior decimal point is left alone");
rejects("5 = 50%", "0.5 = 50%", "dropping the POINT is a different number, not a typo");

// ── Multiple accepted forms ──
accepts("7", ["m = 7", "7 mice"], "any listed form counts");
accepts("7 mice", ["m = 7", "7 mice"], "any listed form counts");
rejects("8", ["m = 7", "7 mice"], "a wrong value is still wrong");

// ── Non-numeric answers still compare as text ──
accepts("2 × 3 × 7", "2*3*7", "multiplication glyphs unify");
accepts("area", "Área", "accents and case are irrelevant");
rejects("42", "2 × 3 × 7", "a bare product must not credit a factorization");
rejects("2", "2³", "an exponent is not a unit — 2³ is not 2");
rejects("12", "12 r 3", "a quotient with a remainder needs the remainder");
rejects("5", "x > 5", "an inequality needs its relation");
rejects("5", "x ≥ 5", "an inequality needs its relation");
rejects("3x", "12", "an unsolved expression is not the value");
rejects("", "7", "a blank answer is never correct");
rejects("   ", "7", "whitespace is never correct");
rejects("7", null, "no authored answer means nothing to grade against");

// ── Wrong values stay wrong ──
rejects("4", "m = 7", "wrong number with the right label");
rejects("m = 4", "m = 7", "wrong number with the right label");
rejects("25 sq ft", "24 sq. ft.", "wrong number with the right unit");

// ── Helpers used by the UI ──
assert.equal(stripLabel("m = 7"), "7");
assert.equal(stripLabel("3x = 12"), "3x = 12", "an equation is not a labelled value");
assert.equal(stripLabel("x > 5"), "x > 5", "inequalities keep their relation");
assert.equal(numericValue("24 sq. ft."), 24);
assert.equal(numericValue("2³"), null, "no letter in the tail, so nothing is stripped");
assert.equal(numericValue("quotient"), null, "a word answer is not hollowed out");
assert.equal(fullerFormHint("7", "m = 7"), "m = 7", "suggest the labelled form");
assert.equal(fullerFormHint("24", "24 sq. ft."), "24 sq. ft.", "suggest the unit");
assert.equal(fullerFormHint("m = 7", "m = 7"), null, "nothing to add");
assert.equal(fullerFormHint("7", "7"), null, "nothing to add");
passed += 9;

console.log(`answer-match: ${passed} assertions passed`);
