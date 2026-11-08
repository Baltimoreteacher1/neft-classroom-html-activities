// Long division in the Fluency Lab: the work, the guided steps (with and without a remainder) and the bracket picture.
import assert from "node:assert/strict";
import { longDivisionBoard } from "../math/fluency-lab/long-division-board.js";
import {
  longDivisionSteps,
  longDivisionWork,
  needsLongDivision,
} from "../math/fluency-lab/long-division-work.js";
import {
  ALL_SKILLS,
  generateProblem,
  getSkill,
  seededRandom,
  validateAnswer,
} from "../math/fluency-lab/problem-bank.js";

// The cycles rebuild the quotient digit by digit and leave the true remainder.
for (let dividend = 1; dividend <= 2500; dividend += 7)
  for (const divisor of [2, 3, 6, 7, 9, 12, 16, 24, 48]) {
    const work = longDivisionWork(dividend, divisor);
    assert.equal(
      Number(work.cycles.map((c) => c.qDigit).join("")),
      Math.floor(dividend / divisor),
      `${dividend} ÷ ${divisor}`,
    );
    assert.equal(work.cycles.at(-1).remainder, dividend % divisor);
    for (const c of work.cycles)
      assert.ok(c.remainder >= 0 && c.remainder < divisor && c.qDigit <= 9);
  }

// 1,392 ÷ 16 walks divide, multiply, subtract, bring down, with the ÷ symbol and the bracket.
const exact = longDivisionSteps(1392, 16);
assert.match(exact[0], /^Set up: write 1,392 ÷ 16 as 16 \) 1,392\./);
assert.ok(exact.some((s) => s === "Multiply: 8 × 16 = 128"));
assert.ok(exact.some((s) => s === "Subtract: 139 − 128 = 11"));
assert.ok(
  exact.some((s) => /^Bring down: bring down the 2 next to 11\. That makes 112\.$/.test(s)),
);
assert.match(exact.at(-1), /1,392 ÷ 16 = 87\. Check: 87 × 16 = 1,392$/);

// With a remainder the last step names it and checks the work.
const left = longDivisionSteps(1397, 16, "remainder");
assert.match(
  left.at(-1),
  /1,397 ÷ 16 = 87 R 5\. The remainder is 5\. Check: 87 × 16 \+ 5 = 1,397$/,
);
assert.match(longDivisionSteps(1397, 16).at(-1), /The quotient is 87\./);

// The trail shows at most four steps.
for (const [dividend, divisor] of [
  [287, 7],
  [864, 6],
  [1397, 16],
  [4056, 24],
  [94, 2],
])
  assert.ok(
    longDivisionSteps(dividend, divisor, "quotient", { compact: true }).length <= 4,
    `${dividend} ÷ ${divisor}`,
  );

assert.equal(needsLongDivision(56, 7), false);
assert.equal(needsLongDivision(57, 7), true);
assert.equal(needsLongDivision(1392, 16), true);

// The bracket: empty for practice, complete when worked, revealed in stages for a lesson.
const empty = longDivisionBoard(1392, 16);
assert.ok(
  !empty.includes("ldb-quotient") && empty.includes("ldb-divisor") && empty.includes("ldb-first"),
);
const quotientOf = (html) => html.match(/ldb-quotient[^>]*>(\d+)</)?.[1] ?? null;
const worked = longDivisionBoard(1397, 16, { worked: true });
assert.equal(quotientOf(worked), "87");
assert.ok(worked.includes("R 5") && worked.includes("remainder 5"));
const staged = (stage) => longDivisionBoard(384, 6, { stage });
assert.equal(quotientOf(staged(0)), null);
assert.equal(quotientOf(staged(1)), "6");
assert.equal(quotientOf(staged(3)), "64");

// Every long-division skill draws the bracket and mixes whole quotients with remainders; answers check out.
let remainders = 0;
let exactItems = 0;
for (const id of ["division", "divide-whole", "multi-digit-division"]) {
  const skill = ALL_SKILLS.find((s) => s.id === id);
  for (let seed = 1; seed <= 200; seed += 1) {
    const item = generateProblem(skill, seededRandom(seed));
    assert.equal(item.model?.type, "longDivision", `${id}: ${item.question}`);
    assert.ok(item.steps[0].startsWith("Set up:"), item.question);
    assert.ok(validateAnswer(item.answers[0], item), item.question);
    const [, dividend, divisor] = item.question.replaceAll(",", "").match(/^(\d+) ÷ (\d+)/);
    if (/has a remainder/.test(item.question)) {
      remainders += 1;
      const want = item.question.includes("What is the remainder")
        ? dividend % divisor
        : Math.floor(dividend / divisor);
      assert.equal(Number(item.answers[0]), want, item.question);
      assert.ok(item.questionEs?.includes("÷"), "remainder stems carry Spanish");
    } else {
      exactItems += 1;
      assert.equal(Number(item.answers[0]), dividend / divisor, item.question);
    }
  }
}
assert.ok(
  remainders > 100 && exactItems > 200,
  `mix of remainder (${remainders}) and exact (${exactItems}) items`,
);

// Basic facts keep the multiplication framing, now with the ÷ symbol.
const fact = generateProblem(getSkill(3, "division-facts"), seededRandom(5));
assert.ok(fact.steps[0].includes("÷"), fact.steps[0]);
console.log(`Long division: ${remainders} remainder and ${exactItems} exact items checked.`);
