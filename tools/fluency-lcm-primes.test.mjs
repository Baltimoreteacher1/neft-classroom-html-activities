// The LCM skill teaches ONE method, prime factorization, on every surface: hint, worked steps, visual lesson, picture.
// Expected values are derived here by brute force, independent of the code under test.
import assert from "node:assert/strict";
import {
  copiesTable,
  factorTreeSvg,
  keptPrimes,
  lcmMultiplyHtml,
  multiplyText,
  parsePrimes,
  powerText,
  primeList,
  splitPair,
  treeCaption,
  treeOf,
} from "../math/fluency-lab/factor-tree.js";
import { createLesson } from "../math/fluency-lab/lesson-content.js";
import {
  ALL_SKILLS,
  generateProblem,
  seededRandom,
  validateAnswer,
} from "../math/fluency-lab/problem-bank.js";
import { stepVisual } from "../math/fluency-lab/trail-pictures.js";
import { renderModel } from "../math/fluency-lab/visual-lab.js";

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};
const isPrime = (n) =>
  n >= 2 &&
  Array.from({ length: Math.floor(Math.sqrt(n)) - 1 }, (_, i) => i + 2).every((d) => n % d);
const bruteLcm = (a, b) => {
  for (let m = Math.max(a, b); ; m += Math.max(a, b)) if (m % a === 0 && m % b === 0) return m;
};
const leaves = (node) => (node.kids.length ? node.kids.flatMap(leaves) : [node.n]);

// Factor trees: every leaf is prime, leaves multiply back to n, each split is an exact product.
for (let n = 2; n <= 200; n += 1) {
  const tree = treeOf(n);
  const found = leaves(tree);
  check(found.every(isPrime), `leaves of ${n} are prime`);
  check(found.reduce((p, x) => p * x, 1) === n, `leaves of ${n} multiply to ${n}`);
  check(
    primeList(n).join() === [...found].sort((x, y) => x - y).join(),
    `primeList(${n}) matches the tree`,
  );
  check((splitPair(n) === null) === isPrime(n), `${n} splits exactly when composite`);
  check(factorTreeSvg(n).includes(`aria-label="Factor tree of ${n}.`), `tree of ${n} is labelled`);
}

// The kept primes multiply to the true LCM, found by brute force.
for (let a = 2; a <= 60; a += 1) {
  for (let b = 2; b <= 60; b += 1) {
    const product = keptPrimes(a, b).reduce((p, x) => p * x, 1);
    check(product === bruteLcm(a, b), `kept primes of ${a},${b} give the LCM`);
  }
}

// Exponent form: re-derived from the leaves, never from the code under test. Repeats become powers, the powers
// parse back to the same primes, and the multiplication chain ends at the true product.
const SUP = { 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶" };
for (const list of [
  [2, 2, 3, 3],
  [2, 3],
  [2, 2, 2, 5],
  [3, 3, 3],
  [2, 2, 2, 2, 2],
  [2, 3, 5, 7],
]) {
  const counts = new Map();
  for (const p of list) counts.set(p, (counts.get(p) ?? 0) + 1);
  const expected = [...counts]
    .sort(([x], [y]) => x - y)
    .map(([p, n]) => (n > 1 ? `${p}${SUP[n]}` : String(p)))
    .join(" × ");
  check(powerText(list) === expected, `powerText(${list.join(",")}) is ${expected}`);
  check(
    parsePrimes(powerText(list)).join() === [...list].sort((x, y) => x - y).join(),
    `${powerText(list)} parses back to the primes`,
  );
  check(
    multiplyText(list).endsWith(`= ${list.reduce((p, x) => p * x, 1)}`),
    `multiplyText(${list.join(",")}) ends at the product`,
  );
}
check(
  multiplyText([2, 2, 3, 3]) === "2² × 3² = 4 × 9 = 36",
  "chain writes powers, values, product",
);
check(multiplyText([2, 2, 2]) === "2³ = 8", "a single power skips the middle step");
check(treeCaption(20) === "20 = 2 × 2 × 5 = 2² × 5", "tree caption shows the exponent form");
check(treeCaption(30) === "30 = 2 × 3 × 5", "no exponent when nothing repeats");
for (let a = 2; a <= 40; a += 1) {
  for (let b = 2; b <= 40; b += 1) {
    if (a === b) continue;
    const kept = keptPrimes(a, b);
    check(
      lcmMultiplyHtml(a, b).includes(`= ${bruteLcm(a, b)}</p>`),
      `multiply line of ${a},${b} ends at the LCM`,
    );
    check(
      lcmMultiplyHtml(a, b, { hideResult: true }).endsWith("= ?</p>"),
      `hidden multiply line of ${a},${b} does not print the LCM`,
    );
    check(kept.length > 0, "kept primes exist");
  }
}
check(
  copiesTable(12, 18).includes("2<sup>2</sup> = 4") &&
    copiesTable(12, 18).includes("3<sup>2</sup> = 9"),
  "table shows each kept power as a number",
);
check(!copiesTable(12, 18, { hideKeep: true }).includes("<sup>"), "hidden table prints no power");

// Answer parsing accepts every sensible way to write a factorization and rejects look-alikes.
const key = { kind: "primes", answers: ["2 × 2 × 3"] };
for (const good of [
  "2 × 2 × 3",
  "2x2x3",
  "2*2*3",
  "3, 2, 2",
  "2 2 3",
  "2^2 × 3",
  "2² × 3",
  "2 and 2 and 3",
])
  check(validateAnswer(good, key), `accepts ${good}`);
for (const bad of ["12", "2 × 6", "2 × 3", "3^2 × 2", "2 × 2 × 3 × 3", "2.5", "two", "1 × 12", ""])
  check(!validateAnswer(bad, key), `rejects ${bad}`);
check(parsePrimes("1 × 3") === null, "1 is not a prime factor");

// The LCM skill: hint, steps, explanation and model all use primes and never ask for lists of multiples.
const lcmSkill = ALL_SKILLS.find((skill) => skill.grade === 6 && skill.id === "lcm");
const rng = seededRandom(20261026);
for (let i = 0; i < 400; i += 1) {
  const item = generateProblem(lcmSkill, rng);
  const [a, b] = item.question.match(/\d+/g).map(Number);
  check(item.answers[0] === String(bruteLcm(a, b)), `LCM(${a}, ${b}) answer`);
  check(
    /prime|factor tree/i.test(item.hint) && !/list multiples/i.test(item.hint),
    "hint teaches primes",
  );
  check(
    item.steps.length === 4 && !item.steps.some((step) => /multiples/i.test(step)),
    "steps never list multiples",
  );
  check(
    item.steps[0].includes(primeList(a).join(" × ")) || item.steps[0].includes("is prime"),
    `step 1 factors ${a}`,
  );
  check(
    item.steps[1].includes(primeList(b).join(" × ")) || item.steps[1].includes("is prime"),
    `step 2 factors ${b}`,
  );
  check(item.steps[3].includes(`= ${item.answers[0]}`), "last step multiplies to the answer");
  check(
    item.steps[2].includes(powerText(keptPrimes(a, b))) &&
      item.steps[3].includes(multiplyText(keptPrimes(a, b))),
    "keep and multiply steps use exponents",
  );
  check(/exponent/i.test(item.hint), "hint mentions exponents");
  // "Watch me solve it": each step draws its own picture, and only the last one shows the product.
  for (const [i, n] of [
    [0, a],
    [1, b],
  ])
    check(
      stepVisual(item.steps[i]).includes("ft-tree") === primeList(n).length > 1,
      `step ${i + 1} draws the factor tree of ${n} unless it is prime`,
    );
  check(
    stepVisual(item.steps[2]).includes("ft-brick") &&
      !stepVisual(item.steps[2]).includes("ft-total"),
    "keep step shows the power bricks without the product",
  );
  check(
    stepVisual(item.steps[3]).includes(`<b class="ft-brick ft-total">${item.answers[0]}</b>`),
    "multiply step shows the product",
  );
  check(
    item.model.type === "primeTrees" && item.model.practice === true,
    "item model is the prime-tree picture",
  );
  check(renderModel(item.model) === "", "a practice item never prints its own factor trees");
}

// The visual lesson: five variants, every step checked, every typed answer accepted, the picture shows trees.
for (let variant = 0; variant < 5; variant += 1) {
  const lesson = createLesson(lcmSkill, variant);
  const { a, b } = lesson.model;
  check(
    lesson.model.type === "primeTrees" && !lesson.model.practice,
    "lesson model shows the trees",
  );
  const html = renderModel(lesson.model);
  check(
    html.includes("ft-tree") && html.includes("ft-copies") && !/multiples/i.test(html),
    "lesson draws trees and the copies table",
  );
  check(
    lesson.steps.every((step) => validateAnswer(step.answers[0], step)),
    "every lesson step accepts its own answer",
  );
  check(
    lesson.steps.at(-1).answers[0] === String(bruteLcm(a, b)),
    `lesson ${a},${b} ends at the LCM`,
  );
  check(lesson.steps.length === 3, "factor a, factor b, keep the powers and multiply");
  const keptList = keptPrimes(a, b);
  check(
    /exponent/i.test(lesson.steps[2].prompt) && /exponent|power/i.test(lesson.steps[2].hint),
    "last step teaches exponents",
  );
  check(
    lesson.steps[2].explanation.includes(multiplyText(keptList)),
    "last step explains with the multiplication chain",
  );
  // The picture follows the steps: the Power column and the multiplication spell out the answer, so they wait for it.
  check(
    !renderModel(lesson.model, { step: 2 }).includes("ft-multiply"),
    "no multiplication while answering",
  );
  check(
    !renderModel(lesson.model, { step: 2 }).includes("<sup>"),
    "no power printed while answering",
  );
  check(
    renderModel(lesson.model, { step: 3 }).includes(`= ${bruteLcm(a, b)}</p>`),
    "finished lesson shows the product",
  );
  check(
    !copiesTable(a, b, { hideKeep: true }).includes("<td>0</td><td>0</td>"),
    "table has no empty rows",
  );
}

console.log(`fluency-lcm-primes: ${checks} checks passed.`);
