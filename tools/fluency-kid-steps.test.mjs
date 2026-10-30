// Kindergarten to Grade 3 guided steps are in a young child's words: no vocabulary words, short sentences, true
// number sentences, the answer only on the last step, at most four steps.
// Run: node tools/fluency-kid-steps.test.mjs
import assert from "node:assert/strict";

const store = new Map();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  },
});
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { dispatchEvent() {}, addEventListener() {} },
});
globalThis.CustomEvent = class {};

const lab = "../math/fluency-lab/";
const { ALL_SKILLS, generateProblem, seededRandom } = await import(`${lab}problem-bank.js`);
const { kidSteps } = await import(`${lab}kid-steps.js`);
const { leakCap } = await import(`${lab}step-leak.js`);

let checks = 0;
const ok = (condition, message) => {
  checks += 1;
  assert.ok(condition, message);
};

const TECHNICAL =
  /\b(addends?|digits?|regroup\w*|quotient|interval|cardinality|benchmark|decompos\w*|partial|numerator|denominator|cross-multipl\w*|greatest place|place value)\b/i;
const rng = seededRandom(23);
const covered = new Set();
const num = (text) => Number(String(text).replaceAll(",", "").replace("−", "-"));

for (const skill of ALL_SKILLS.filter((entry) => entry.grade <= 3)) {
  for (let i = 0; i < 200; i += 1) {
    const item = generateProblem(skill, rng);
    const steps = item.steps;
    const where = `${skill.grade}:${skill.id} "${item.question}"`;
    ok(steps.length >= 2 && steps.length <= 4, `${where} has two to four steps`);
    if (kidSteps(item, skill)) covered.add(skill.id);
    if (!kidSteps(item, skill)) continue;
    ok(
      leakCap(item) === steps.length - 1,
      `${where} states its answer only on the last step: ${steps}`,
    );
    for (const step of steps) {
      ok(!TECHNICAL.test(step), `${where} uses a vocabulary word: ${step}`);
      for (const sentence of step.split(/(?<=[.?!])\s+/))
        ok(
          sentence
            .replace(/\d+(?:,\s?\d+)*/g, "n")
            .replace(/[:+−×÷=]+/g, " ")
            .split(/\s+/).length <= 16,
          `${where} sentence too long: ${sentence}`,
        );
      // Every plain "a op b = c" in a step is true.
      for (const [, a, op, b, c] of step.matchAll(
        /(?<![+−×÷] )(\d[\d,]*) ([+−×÷]) (\d[\d,]*) = (\d[\d,]*)(?!\s*[+−×÷\d])/g,
      )) {
        const [x, y, z] = [num(a), num(b), num(c)];
        const want = op === "+" ? x + y : op === "−" ? x - y : op === "×" ? x * y : x / y;
        ok(want === z, `${where} arithmetic: ${a} ${op} ${b} = ${c}`);
      }
    }
  }
}
// The "big idea" and "watch out" lines: every Kindergarten to Grade 3 skill has them, short, in both languages.
const { kidLearnFor } = await import(`${lab}kid-learn.js`);
for (const skill of ALL_SKILLS.filter((entry) => entry.grade <= 3)) {
  const row = kidLearnFor(skill, skill.grade);
  ok(row, `${skill.grade}:${skill.id} has young-learner learn lines`);
  ok(
    skill.learn.rule === row.idea.en && skill.learn.watch === row.watch.en,
    `${skill.id} learn lines are applied`,
  );
  for (const pair of [row.idea, row.watch]) {
    ok(pair.es && pair.es !== pair.en, `${skill.id} has Spanish: ${pair.en}`);
    ok(pair.en.split(/\s+/).length <= 16, `${skill.id} line is short: ${pair.en}`);
    ok(!TECHNICAL.test(pair.en), `${skill.id} line avoids vocabulary words: ${pair.en}`);
  }
}
ok(covered.size >= 34, `young-learner steps cover ${covered.size} skills`);

console.log(`fluency-kid-steps: ${checks} checks passed, ${covered.size} skills covered`);
