#!/usr/bin/env node
/**
 * The operand tagger writes ground truth into the diagnosis pipeline: a tag it
 * authors is what detectMisconception() tells a student their thinking was. So
 * the contract under test is not "does it tag a lot" — it is "does it refuse
 * every reading it cannot prove".
 *
 * Each case below is either a shape that MUST be named or a shape that MUST
 * stay silent. The silent cases are the ones that matter.
 */
import { MISCONCEPTIONS, resolveAuthoredTag } from "@eduwonderlab/engine/core/misconceptions.js";
import { tagsFor } from "./author-misconception-tags.mjs";
import {
  binaryModel,
  deriveOperandTags,
  parseQuantity,
  stemNumbers,
} from "./lib/operand-misconception-tagger.mjs";

let failures = 0;
function check(label, actual, expected) {
  const got = JSON.stringify(actual);
  const want = JSON.stringify(expected);
  if (got !== want) {
    failures++;
    console.error(`FAIL ${label}\n  expected ${want}\n  got      ${got}`);
  }
}

// ---------------------------------------------------------------- primitives
check("parseQuantity money", parseQuantity("$12.75"), 12.75);
check("parseQuantity percent", parseQuantity("45%"), 45);
check("parseQuantity units", parseQuantity("60 miles"), 60);
check("parseQuantity fraction", parseQuantity("3/4"), 0.75);
check("parseQuantity prose", parseQuantity("Runner B"), null);
check("stemNumbers", stemNumbers("Mia buys 4 packs at $2.50 each."), [4, 2.5]);
check("binaryModel ambiguous 2+2 vs 2x2", binaryModel([2, 2], 4), null);
check("binaryModel unambiguous", binaryModel([4, 12], 48)?.op, "*");

// ------------------------------------------------------------- named errors
check(
  "added instead of multiplied",
  deriveOperandTags({
    stem: "A crate holds 6 rows of 7 apples. How many apples are in the crate?",
    choices: ["42", "13", "1"],
    correctIndex: 0,
  }),
  [null, "op-added-instead-of-multiplied", null],
);
check(
  "multiplied instead of divided + unit rate total",
  deriveOperandTags({
    stem: "3 notebooks cost 12 dollars. What is the cost per notebook?",
    choices: ["4", "36", "12"],
    correctIndex: 0,
  }),
  [null, "op-multiplied-instead-of-divided", "rate-not-per-one"],
);
check(
  "reversed subtraction",
  deriveOperandTags({
    stem: "The temperature fell from 9 degrees to 4 degrees. How many degrees did it drop?",
    choices: ["5", "-5"],
    correctIndex: 0,
  }),
  [null, "op-reversed-subtraction"],
);
check(
  "flipped ratio, named as a ratio error",
  deriveOperandTags({
    stem: "A recipe uses 8 cups of flour to 2 cups of sugar. What is the ratio of flour to sugar as a number?",
    choices: ["4", "0.25"],
    correctIndex: 0,
  }),
  [null, "ratio-inverted"],
);
check(
  "summed instead of averaged",
  deriveOperandTags({
    stem: "Scores were 8, 6, and 10. What is the mean score?",
    choices: ["8", "24"],
    correctIndex: 0,
  }),
  [null, "stat-summed-instead-of-averaged"],
);
check(
  "triangle area without the half",
  deriveOperandTags({
    stem: "A triangle has a base of 10 cm and a height of 6 cm. What is its area?",
    choices: ["30", "60"],
    correctIndex: 0,
  }),
  [null, "geom-triangle-area-no-half"],
);
check(
  "volume by adding the dimensions",
  deriveOperandTags({
    stem: "A box measures 2 ft by 3 ft by 5 ft. What is its volume?",
    choices: ["30", "10"],
    correctIndex: 0,
  }),
  [null, "geom-volume-added-dimensions"],
);

// -------------------------------------------------------------- must refuse
check(
  "refuses when the model is ambiguous",
  deriveOperandTags({ stem: "2 and 2", choices: ["4", "0"], correctIndex: 0 }),
  null,
);
check(
  "refuses prose choices",
  deriveOperandTags({
    stem: "Runner A runs 4 laps in 12 minutes; Runner B runs 5 laps in 14 minutes. Who is faster?",
    choices: ["Runner B", "Runner A"],
    correctIndex: 0,
  }),
  null,
);
check(
  "refuses a distractor with two possible names",
  // 12 ÷ 4 = 3 with a "per" stem; the distractor 4 is BOTH an operand (the
  // rate-not-per-one reading) and b/a = 4/... — any second reading must silence it.
  deriveOperandTags({
    stem: "12 pens cost 12 dollars split over 4 packs and 12 boxes. Cost per pack?",
    choices: ["3", "48"],
    correctIndex: 0,
  })?.filter(Boolean).length ?? 0,
  1,
);
check(
  "never overwrites authored tags",
  deriveOperandTags({
    stem: "6 rows of 7 apples?",
    choices: ["42", "13"],
    correctIndex: 0,
    misconceptionTags: [null, null],
  }),
  null,
);
check(
  "refuses a stem with fewer than two numbers",
  deriveOperandTags({ stem: "Double 8.", choices: ["16", "10"], correctIndex: 0 }),
  null,
);
check(
  "no rate-not-per-one without a per-one question",
  deriveOperandTags({
    stem: "A rope 12 feet long is cut into 3 equal pieces. How long is one piece in feet?",
    choices: ["4", "12"],
    correctIndex: 0,
  }),
  null,
);

// --------------------------------------------- per-choice family merging
// 12.5 × 10 = 125: the ×10 twins are place-value, and 12.5 + 10 = 22.5 is the
// added-instead-of-multiplied distractor sitting beside them. Both must survive.
const tramItem = {
  stem: "One tram ride takes 12.5 minutes. How many minutes do 10 rides take?",
  choices: ["125 minutes", "22.5 minutes", "1.25 minutes", "1,250 minutes"],
  correctIndex: 0,
};
check("merges both families per choice", tagsFor(tramItem), [
  null,
  "op-added-instead-of-multiplied",
  "place-value",
  "place-value",
]);
check(
  "fills nulls left by this tool's own earlier output",
  tagsFor({ ...tramItem, misconceptionTags: [null, null, "place-value", "place-value"] }),
  [null, "op-added-instead-of-multiplied", "place-value", "place-value"],
);
check(
  "never talks over a human's deliberate silence",
  tagsFor({ ...tramItem, misconceptionTags: [null, null, null, null] }),
  null,
);
check(
  "idempotent once merged",
  tagsFor({ ...tramItem, misconceptionTags: tagsFor(tramItem) }),
  null,
);

// ------------------------------------------------- every tag must be real
const emitted = new Set();
for (const item of [
  { stem: "6 rows of 7 apples?", choices: ["42", "13"], correctIndex: 0 },
  {
    stem: "3 notebooks cost 12 dollars. Cost per notebook?",
    choices: ["4", "36", "12"],
    correctIndex: 0,
  },
  { stem: "Fell from 9 to 4 degrees. Drop?", choices: ["5", "-5"], correctIndex: 0 },
  { stem: "Ratio of 8 cups flour to 2 cups sugar?", choices: ["4", "0.25"], correctIndex: 0 },
  { stem: "Scores 8, 6, 10. Mean?", choices: ["8", "24"], correctIndex: 0 },
  { stem: "Triangle base 10 cm, height 6 cm. Area?", choices: ["30", "60"], correctIndex: 0 },
  { stem: "Box 2 ft by 3 ft by 5 ft. Volume?", choices: ["30", "10"], correctIndex: 0 },
]) {
  for (const tag of deriveOperandTags(item) || []) if (tag) emitted.add(tag);
}
for (const tag of emitted) {
  const resolved = resolveAuthoredTag(tag);
  if (!resolved || !MISCONCEPTIONS[resolved]) {
    failures++;
    console.error(`FAIL emitted tag "${tag}" does not resolve to a taxonomy entry`);
  }
}
if (emitted.size < 7) {
  failures++;
  console.error(`FAIL expected 7+ distinct emitted tags, got ${emitted.size}`);
}

if (failures) {
  console.error(`operand misconception tagger: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`operand misconception tagger: all checks pass (${emitted.size} tag kinds exercised)`);
