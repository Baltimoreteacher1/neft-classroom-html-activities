// Practice must match the skill it is filed under. Each case here shipped mismatched: "Multiply and divide
// decimals" divided only whole numbers, "Solve one-step equations" never multiplied or divided, "Operations
// with rational numbers" was positive subtraction, and "Factors and multiples" asked only for a GCF.
import assert from "node:assert/strict";
import { createLesson } from "../math/fluency-lab/lesson-content.js";
import {
  generateProblem,
  getSkill,
  seededRandom,
  validateAnswer,
} from "../math/fluency-lab/problem-bank.js";

const draw = (grade, id, count = 1200) => {
  const skill = getSkill(grade, id);
  const rng = seededRandom(grade * 1000 + id.length);
  return Array.from({ length: count }, () => generateProblem(skill, rng));
};
const share = (items, test) => items.filter((item) => test(item.question)).length / items.length;
const hasDecimal = (question) => /\d\.\d/.test(question);

// G6 decimal-ops: both operations, and division must involve decimals.
const decimals = draw(6, "decimal-ops");
assert.ok(share(decimals, (q) => q.includes("×")) > 0.35, "decimal-ops multiplies");
assert.ok(share(decimals, (q) => q.includes("÷")) > 0.35, "decimal-ops divides");
const divisions = decimals.filter((item) => item.question.includes("÷"));
assert.ok(
  share(divisions, hasDecimal) > 0.95,
  "decimal-ops division uses a decimal dividend or divisor",
);
assert.ok(
  divisions.some((item) => /^\d+\.\d+ ÷ 0\.\d =/.test(item.question)),
  "a decimal divisor appears",
);
assert.ok(
  divisions.every((item) => !/multiply as whole numbers/i.test(item.steps.join(" "))),
  "division steps do not borrow multiplication wording",
);

// G6 one-step: add, subtract, multiply and divide, all with nonnegative numbers.
const oneStep = draw(6, "one-step");
for (const [name, pattern] of [
  ["add", /^x \+/],
  ["subtract", /^x −/],
  ["multiply", /^\dx =/],
  ["divide", /^x ÷/],
]) {
  assert.ok(share(oneStep, (q) => pattern.test(q)) > 0.1, `one-step ${name}`);
}
assert.ok(
  oneStep.every((item) => !item.question.includes("-") && !item.displayAnswer.startsWith("-")),
  "one-step stays nonnegative",
);

// G7 fraction-ops: all four operations, mostly signed.
const rational = draw(7, "fraction-ops");
for (const symbol of ["+", "−", "×", "÷"])
  assert.ok(share(rational, (q) => q.includes(` ${symbol} `)) > 0.1, `fraction-ops ${symbol}`);
assert.ok(share(rational, (q) => q.includes("-")) > 0.6, "fraction-ops is mostly signed");

// G4 factors: factors AND multiples, plus prime/composite; no GCF.
const factors = draw(4, "factors");
assert.ok(share(factors, (q) => /factor/.test(q)) > 0.2, "factors question");
assert.ok(share(factors, (q) => /multiple/.test(q)) > 0.2, "multiples question");
assert.ok(share(factors, (q) => /prime or composite/.test(q)) > 0.1, "prime or composite question");
assert.ok(share(factors, (q) => /GCF|LCM/.test(q)) === 0, "no GCF/LCM at grade 4");

// Every answer is accepted as typed, and every skill still has a lesson for each variant.
for (const item of [...decimals, ...oneStep, ...rational, ...factors])
  assert.ok(validateAnswer(item.displayAnswer, item), item.question);
for (const [grade, id] of [
  [6, "decimal-ops"],
  [6, "one-step"],
  [7, "fraction-ops"],
  [4, "factors"],
]) {
  for (let variant = 0; variant < 5; variant += 1)
    assert.ok(
      createLesson({ ...getSkill(grade, id), grade }, variant).steps.length >= 3,
      `${id} lesson ${variant}`,
    );
}
console.log("fluency skill match: ok");
