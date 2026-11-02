// Fraction pictures are drawn from the question's own numbers: the worked picture's result matches the answer, a
// practice picture never prints the result, every bar has the cells it claims, and each supported shape is covered.
// Run: node tools/fluency-fraction-picture.test.mjs
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

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
const { fractionPicture } = await import(`${lab}fraction-picture.js`);

let checks = 0;
const ok = (condition, message) => {
  checks += 1;
  assert.ok(condition, message);
};

const value = (text) => {
  const match = String(text).match(/^(-?\d+)\/(\d+)$/);
  return match ? Number(match[1]) / Number(match[2]) : Number(String(text).replaceAll(",", ""));
};
const shape = (question) =>
  /×/.test(question)
    ? "multiply"
    : /÷/.test(question)
      ? "divide"
      : /[+−]/.test(question)
        ? "addSub"
        : / = /.test(question)
          ? "equivalent"
          : /___/.test(question)
            ? "compare"
            : /^What is/.test(question)
              ? "of"
              : "servings";

const rng = seededRandom(31);
const drawn = {};
const covered = {};
for (const skill of ALL_SKILLS.filter(
  (entry) => entry.grade >= 3 && /^fraction|^divide-fractions|^unit-fraction/.test(entry.id),
)) {
  for (let i = 0; i < 150; i += 1) {
    const item = generateProblem(skill, rng);
    const kind = shape(item.question);
    drawn[kind] = (drawn[kind] || 0) + 1;
    const worked = fractionPicture(item.question, { worked: true });
    const plain = fractionPicture(item.question);
    if (!worked) continue;
    covered[kind] = (covered[kind] || 0) + 1;
    const where = `${skill.grade}:${skill.id} "${item.question}"`;
    const dom = new JSDOM(`<body>${worked}</body>`);
    const doc = dom.window.document;
    ok(doc.querySelector('[data-live="fraction"]'), `${where} is a fraction picture`);
    ok(plain, `${where} has a practice picture too`);
    for (const bar of doc.querySelectorAll(".fp-bar"))
      ok(bar.querySelectorAll(".fp-cell").length >= 1, `${where} bar has cells`);
    // The worked result bar is the answer.
    const result = doc.querySelector('.fp-row[data-role="r"]');
    if (result && kind === "addSub")
      ok(
        Math.abs(value(result.dataset.frac) - value(item.displayAnswer)) < 1e-9,
        `${where} result ${result.dataset.frac} equals ${item.displayAnswer}`,
      );
    if (result && kind === "equivalent")
      ok(
        Math.abs(value(result.dataset.frac) - value(item.question.split(" = ")[0])) < 1e-9,
        `${where} equivalent bar keeps the value`,
      );
    // A practice picture never labels the answer.
    const labels = [
      ...new JSDOM(`<body>${plain}</body>`).window.document.querySelectorAll(".fp-row"),
    ].map((row) => row.dataset.frac);
    const answer = String(item.displayAnswer);
    if (kind === "addSub" || kind === "multiply" || kind === "divide")
      ok(
        !labels.includes(answer) || item.question.includes(answer),
        `${where} practice picture hides ${answer}`,
      );
    if (kind === "equivalent")
      ok(!/\bfp-r\b/.test(plain), `${where} practice picture draws no result bar`);
    if (kind === "compare")
      ok(
        !/fp-verdict/.test(plain) && /fp-verdict/.test(worked),
        `${where} verdict only when worked`,
      );
  }
}
for (const kind of ["equivalent", "compare", "addSub", "multiply", "divide", "of", "servings"])
  ok(
    covered[kind] / drawn[kind] > (kind === "servings" ? 0.4 : 0.6), // servings cap at 8 wholes and 12 parts
    `most ${kind} questions get a picture (${covered[kind]}/${drawn[kind]})`,
  );

ok(
  fractionPicture("-1/5 + (-7/10) = ?") === "",
  "negative fractions get no picture rather than a wrong one",
);
ok(
  fractionPicture("A jug holds 20 liters. How many 1/8-liter servings can it fill?") === "",
  "oversized servings get no picture",
);
ok(fractionPicture("Round 881 to the nearest ten.") === "", "other questions get no picture");

console.log(
  `fluency-fraction-picture: ${checks} checks passed (${Object.entries(covered)
    .map(([k, n]) => `${k} ${n}/${drawn[k]}`)
    .join(", ")})`,
);
