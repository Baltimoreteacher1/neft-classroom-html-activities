// Fact Trail contract: every grade's trail generates answerable problems whose guided steps end on
// the answer and whose interactive model shows the problem's own numbers.
import assert from "node:assert/strict";
import { seededRandom, validateAnswer } from "../math/fluency-lab/problem-bank.js";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});
const { TRAILS, chartKey, makeProblem, starsFor } = await import(
  "../math/fluency-lab/fact-trail.js"
);

const failures = [];
const check = (condition, message) => condition || failures.push(message);
const number = (text) => Number(String(text).replaceAll(",", "").replace("−", "-"));
let problems = 0;

for (const grade of [1, 2, 3, 4, 5, 6, 7, 8]) {
  const trail = TRAILS[grade];
  check(trail && trail.stations.length >= 6, `Grade ${grade} needs a trail of at least 6 stops.`);
  check(
    new Set(trail.stations.map((s) => s.id)).size === trail.stations.length,
    `Grade ${grade} has duplicate stop ids.`,
  );
  for (const station of trail.stations) {
    check(
      station.idea && station.idea.split(" ").length <= 16,
      `${grade}/${station.id}: the idea must be one short sentence.`,
    );
    const rng = seededRandom(grade * 101 + station.id.length);
    const seen = new Set();
    for (let i = 0; i < 200; i += 1) {
      const item = makeProblem(grade, station, rng);
      problems += 1;
      seen.add(item.question);
      const answer = item.answers[0];
      check(
        validateAnswer(answer, item),
        `${grade}/${station.id}: canonical answer rejected for ${item.question}`,
      );
      check(
        Array.isArray(item.steps) && item.steps.length >= 1 && item.steps.length <= 4,
        `${grade}/${station.id}: needs 1–4 guided steps (${item.question}).`,
      );
      const last = item.steps.at(-1) || "";
      const lastNumbers = (last.replaceAll(",", "").match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      check(
        lastNumbers.includes(number(answer)),
        `${grade}/${station.id}: the last guided step must reach ${answer} (${item.question} → "${last}").`,
      );
      for (const step of item.steps)
        check(!/undefined|NaN/.test(step), `${grade}/${station.id}: broken step "${step}".`);
      const model = item.model;
      const fact = item.question.replaceAll(",", "").match(/^(-?\d+) ([+−×÷]) \(?(-?\d+)\)? = \?$/);
      if (model?.type === "array" && fact) {
        const [a, op, b] = [Number(fact[1]), fact[2], Number(fact[3])];
        const product = op === "÷" ? a : a * b;
        check(
          model.a * model.b * (model.unit || 1) === product,
          `${grade}/${station.id}: array does not show ${item.question}.`,
        );
      }
      if (model?.type === "numberline") {
        const end = model.start + model.jumps.reduce((sum, jump) => sum + jump, 0);
        check(
          Math.abs((model.group ? (end - model.start) / model.group : end) - number(answer)) < 1e-9,
          `${grade}/${station.id}: number line does not land on the answer for ${item.question}.`,
        );
        check(
          model.jumps.every((jump) => jump !== 0),
          `${grade}/${station.id}: zero-size jump for ${item.question}.`,
        );
      }
      if (grade <= 3 && fact && ["+", "×"].includes(fact[2]))
        check(
          Boolean(chartKey(item)),
          `${grade}/${station.id}: fact missing from the chart (${item.question}).`,
        );
    }
    check(seen.size >= 5, `${grade}/${station.id}: too little variety (${seen.size}).`);
  }
}

// Grade 3 stays within basic facts: products within 100, factors at most 10.
for (const station of TRAILS[3].stations) {
  const rng = seededRandom(7);
  for (let i = 0; i < 200; i += 1) {
    const item = makeProblem(3, station, rng);
    const [a, , b] = item.question
      .match(/^(\d+) ([×÷]) (\d+)/)
      .slice(1)
      .map(Number);
    check(
      Math.max(a, b) <= 100 && number(item.answers[0]) <= 100,
      `Grade 3 ${station.id} left basic facts: ${item.question}`,
    );
  }
}

check(
  starsFor(10, 10) === 3 && starsFor(9, 10) === 3 && starsFor(7, 10) === 2 && starsFor(6, 10) === 1,
  "Star thresholds changed.",
);
check(
  chartKey({ question: "42 ÷ 6 = ?", answers: ["7"] }) === "mul:6:7",
  "Division must credit its times fact on the chart.",
);
check(
  chartKey({ question: "15 − 7 = ?", answers: ["8"] }) === "add:7:8",
  "Subtraction must credit its addition fact on the chart.",
);

if (failures.length) {
  console.error(`Fluency trail failed (${failures.length}):`);
  for (const failure of failures.slice(0, 40)) console.error(`  - ${failure}`);
  process.exit(1);
}
assert.ok(problems > 0);
console.log(`Fluency trail: ${problems} problems across 8 grade trails passed.`);
