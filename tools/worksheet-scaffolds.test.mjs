#!/usr/bin/env node
/**
 * The work space a printed problem gets must match the mathematics it asks for.
 *
 * WHY THIS EXISTS. A scaffold is a claim about what KIND of problem this is,
 * printed in front of a student. Getting it wrong is worse than printing a
 * plain box: a long-division house on a fraction question tells the student to
 * run an algorithm the problem does not want. Every case pinned below is one
 * this code actually got wrong, in order:
 *
 *   • "5/6 as tall as One World Trade Center" → a long-division house, because
 *     the division reader accepted `/` as a division sign. 157 instances of it
 *     reached production on 2026-08-24.
 *   • "What does it MEAN that a butterfly is symmetric?" → a statistics frame,
 *     off the verb "mean".
 *   • "the fewest moves to SOLVE a three-disc Tower of Hanoi puzzle" → an
 *     equation ledger, off the verb "solve".
 *   • "A box plot shows: Min = 10, Q1 = 15, Median = 20…" → an equation
 *     ledger, because an equals sign followed by a number looked like algebra.
 *   • "A rope is 4 feet long. How many 1/2-foot pieces can be cut from it?" →
 *     the add/subtract fraction rail ("common denominator first, only then add
 *     or subtract") on a DIVISION problem, because the division rule needs a ÷
 *     sign and this one has none. Unit 6 teaches Keep-Change-Flip and nothing
 *     else, so it gets the Keep-Change-Flip frame.
 *
 * The classifier answers with null whenever it is unsure, so the negative
 * cases matter more than the positive ones and are listed first.
 */
import { strict as assert } from "node:assert";
import { classify } from "../scripts/lib/worksheet-scaffolds.mjs";

const mc = (stem, choices) => ({ type: "multiple-choice", stem, choices });
const NUMS = ["12", "18", "24", "30"];
const WORDS = [
  "It has one fixed answer",
  "It varies from person to person",
  "It is always true",
  "It cannot be measured",
];

let failures = 0;
let checked = 0;
const check = (label, actual, expected) => {
  checked += 1;
  if (actual === expected) return;
  failures += 1;
  console.error(
    `   ✗ ${label}\n       expected ${expected === null ? "null" : `"${expected}"`}, got ${actual === null ? "null" : `"${actual}"`}`,
  );
};

console.log("worksheet scaffolds — the wrong frame is worse than none");

/* ── dividing BY a fraction is never "find a common denominator" ─────────── */
check(
  "a fraction division word problem with no ÷ sign is not fraction addition",
  classify(mc("A rope is 4 feet long. How many 1/2-foot pieces can be cut from it?", NUMS)),
  "fractionDivision",
);
check(
  "sharing a fraction among a whole number is fraction division",
  classify(
    mc("A half-pan of brownies is 1/2 pan, shared equally among 4 people. How much each?", NUMS),
  ),
  "fractionDivision",
);
check(
  "a fraction with no division language stays fraction",
  classify(mc("Add 1/3 and 1/4. Write the sum in simplest form.", NUMS)),
  "fraction",
);

/* ── negatives: these must get NO computational scaffold ─────────────────── */
check(
  "a fraction written with a slash is not long division",
  classify(
    mc(
      "The London building will be 5/6 as tall as One World Trade Center (1,776 ft). How tall?",
      NUMS,
    ),
  ),
  "fraction",
);
check(
  '"what does it mean" is the verb, not the average',
  classify(mc("What does it mean that a butterfly is symmetric?", WORDS)),
  null,
);
check(
  '"solve a puzzle" is not an equation',
  classify(
    mc(
      "What is the fewest number of moves needed to solve a three-disc Tower of Hanoi puzzle?",
      NUMS,
    ),
  ),
  null,
);
check(
  "a reasoning item with sentence choices gets no computational frame",
  classify(mc("Which statement best explains why the answer is reasonable?", WORDS)),
  null,
);
check(
  "an item with no choices at all is not computational",
  classify({ type: "multiple-choice", stem: "What is 936 ÷ 12?" }),
  null,
);

/* ── the box-plot case: statistics, never algebra ────────────────────────── */
check(
  "labelled quartiles are not an equation to solve",
  classify(
    mc(
      "A box plot shows: Min = 10, Q1 = 15, Median = 20, Q3 = 28, Max = 35. What is the interquartile range?",
      NUMS,
    ),
  ),
  "statistics",
);

/* ── positives ───────────────────────────────────────────────────────────── */
check("÷ is long division", classify(mc("What is 936 ÷ 12?", NUMS)), "division");
check(
  '"divided by" is long division',
  classify(mc("What is 4,896 divided by 12?", NUMS)),
  "division",
);
check(
  "a real variable is an equation",
  classify(mc("Evaluate 4.25s + 23.50 when s = 10.", NUMS)),
  "equation",
);
check(
  "a named measure is measurement",
  classify(
    mc("A planter is 4 feet long and 2 feet wide. What is its area?", [
      "8 square feet",
      "6 square feet",
      "12 square feet",
      "4 square feet",
    ]),
  ),
  "measure",
);
check(
  "a per-unit rate is a ratio",
  classify(
    mc("How many minutes do 50 tram rides take, at 12.5 minutes per ride?", [
      "625 minutes",
      "62.5 minutes",
      "600 minutes",
      "6.25 minutes",
    ]),
  ),
  "ratio",
);
check(
  "a percent of a number is percent",
  classify(mc("What is 50% of 157?", ["78.5", "77.5", "31.4", "157"])),
  "percent",
);
check(
  "the mean of a list is statistics",
  classify(mc("Find the mean of: 4, 6, 8, 10", NUMS)),
  "statistics",
);

if (failures) {
  console.error(`worksheet scaffolds FAILED: ${failures} case(s)`);
  process.exit(1);
}
console.log(`   ✓ ${checked} cases — every scaffold matches the mathematics its item asks for`);
