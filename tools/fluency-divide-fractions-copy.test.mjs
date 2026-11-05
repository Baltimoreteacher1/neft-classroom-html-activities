// Dividing by a fraction is explained from one module. This pins what a learner reads on every Fluency Lab surface:
// the reason (how many groups fit, so multiply by the reciprocal), the reciprocal of the DIVISOR only, three steps in the
// Keep, Find, Change order, and no worked step that states the answer.
// Run: node tools/fluency-divide-fractions-copy.test.mjs
import assert from "node:assert/strict";
import {
  cardCaptions,
  divideSteps,
  HINT,
  MISTAKE,
  RULE,
} from "../math/fluency-lab/fraction-division-copy.js";
import { generateProblem, getGrade, seededRandom } from "../math/fluency-lab/problem-bank.js";
import { VERBS } from "../math/fluency-lab/step-moves.js";

const steps = divideSteps(2, 3, 4, 5);
assert.equal(steps.length, 3, "three steps before the worked line");
assert.match(
  steps[0],
  /how many groups of 4\/5 fit in 2\/3/,
  "the first step reads ÷ as a question",
);
assert.match(steps[1], /reciprocal of 4\/5.*5\/4/, "the divisor is the fraction that is flipped");
assert.match(
  steps[1],
  /One whole holds 5\/4 groups of 4\/5/,
  "the reason is stated, not just the move",
);
assert.match(
  steps[2],
  /2\/3 × 5\/4/,
  "the first fraction is kept and multiplied by the reciprocal",
);
assert.doesNotMatch(steps.join(" "), /5\/6|10\/12/, "no step states the answer");
assert.deepEqual(
  steps.map((step) => /^(\w+)/.exec(step)[1]),
  ["Keep", "Find", "Change"],
  "steps open on Keep, Find, Change",
);
assert.ok(VERBS.includes("Find"), "the step lens still knows the Find move");

assert.match(RULE, /how many groups/i);
assert.match(RULE, /reciprocal/);
assert.match(MISTAKE, /only the divisor/i);
assert.match(HINT, /reciprocal/);
for (const text of [RULE, HINT, ...steps, ...Object.values(cardCaptions(2, 3, 4, 5))])
  assert.doesNotMatch(
    text,
    /never divide fractions directly/i,
    "no false claim that fractions cannot be divided",
  );

const captions = cardCaptions(2, 3, 4, 5);
assert.deepEqual(Object.keys(captions).sort(), [
  "change",
  "flip",
  "keep",
  "solve",
  "summary",
  "why",
]);
assert.match(
  captions.summary,
  /Keep-Change-Flip is a memory aid/,
  "the nickname is kept, labelled as a memory aid",
);
assert.match(captions.flip, /only the divisor 4\/5/);
assert.match(captions.why, /2\/3 × 5\/4/);

// The worked steps a learner sees for a generated fraction-division problem come from this module.
const skill = getGrade(6).skills.find((s) => s.id === "divide-fractions");
let checked = 0;
for (let seed = 1; seed <= 60; seed++) {
  const problem = generateProblem(skill, seededRandom(seed));
  const match = /^(\d+)\/(\d+) ÷ (\d+)\/(\d+) = \?$/.exec(problem.question);
  if (!match) continue;
  const [, a, b, c, d] = match;
  assert.deepEqual(
    problem.steps.slice(0, 3),
    divideSteps(a, b, c, d),
    `steps for ${problem.question}`,
  );
  checked += 1;
}
assert.ok(checked > 0, "the sweep found fraction-division problems");
console.log(`fluency-divide-fractions-copy: ok (${checked} generated problems)`);
