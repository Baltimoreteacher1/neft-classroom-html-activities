// Number comparisons and even/odd reasoning.
import { bi, fmt, int, pick } from "./kit.js";
import { numberLine, statsDisplay } from "./models.js";
import { Q } from "./rational.js";

export const SPECS = {
  "0:compare-20": { mode: "compare", max: 20 },
  "1:compare-100": { mode: "compare", max: 100 },
  "2:compare-1000": { mode: "compare", max: 1000 },
  "2:even-odd": { mode: "parity", max: 100 },
};

const RELATIONS = ["<", "=", ">"];
const RELATION_REASONS = {
  "<": ["treated the left number as greater", "treated equal digits as equal values"],
  "=": ["compared only one place value", "reversed the comparison"],
  ">": ["treated the right number as greater", "compared only one place value"],
};
const PARITY_OPTIONS = [
  { text: "even", es: "par", why: "counts a group that can be split into pairs" },
  { text: "odd", es: "impar", why: "counts a group with one left over" },
  { text: "neither", es: "ni par ni impar", why: "assumes a whole number can have neither parity" },
];
const uniqueWrongs = (answer) => [
  { v: Q(answer + 1), why: "changed the answer by one" },
  { v: Q(answer === 0 ? 2 : answer - 1), why: "changed the answer by one in the other direction" },
];

function comparison(rng, spec, level) {
  const limit = Math.max(10, Math.floor(spec.max * Math.min(1, 0.2 + level * 0.2)));
  const a = int(rng, 0, limit);
  let b = int(rng, 0, limit);
  if (b === a) b = (b + 1) % (limit + 1);
  const relation = a < b ? "<" : a > b ? ">" : "=";
  return { a, b, relation, limit };
}
function parity(rng, spec, level, max = spec.max) {
  const limit = Math.max(12, Math.floor(max * Math.min(1, 0.25 + level * 0.18)));
  const n = int(rng, 2, Math.min(max, limit));
  const answer = n % 2 === 0 ? "even" : "odd";
  return { n, answer, pairCount: Math.floor(n / 2), remainder: n % 2 };
}
function relationOptions(key) {
  const reasons = RELATION_REASONS[key];
  return RELATIONS.filter((text) => text !== key).map((text, i) => ({ text, why: reasons[i] }));
}
function parityDraft(n, answer, question, questionEs, steps, model = null) {
  return {
    q: bi(question, questionEs),
    form: "choice",
    answer,
    answerEs: answer === "even" ? "par" : "impar",
    options: PARITY_OPTIONS.filter((o) => o.text !== answer),
    check: [{ kind: "expr", expr: `even(${n})`, map: { "0": "odd", "1": "even" }, role: "answer" }],
    steps,
    ...(model ? { model } : {}),
  };
}

function compute({ rng, level, spec }) {
  if (spec.mode === "parity") {
    const { n, answer } = parity(rng, spec, level);
    return parityDraft(
      n,
      answer,
      `Is ${fmt(n)} even or odd?`,
      `¿${fmt(n)} es par o impar?`,
      [`Look at the ones digit in ${fmt(n)}.`, "A number with 0, 2, 4, 6, or 8 in the ones place is even.", `${fmt(n)} is ${answer}.`],
    );
  }
  const { a, b, relation } = comparison(rng, spec, level);
  return {
    q: bi(`Compare ${fmt(a)} and ${fmt(b)}. Which symbol makes the statement true?`, `Compara ${fmt(a)} y ${fmt(b)}. ¿Qué símbolo hace verdadera la comparación?`),
    form: "choice",
    answer: relation,
    options: relationOptions(relation),
    check: [{ kind: "rel", a: String(a), b: String(b), role: "answer" }],
    steps: [`Compare the digits in the greatest place value first.`, `If those digits match, compare the next place.`, `${fmt(a)} ${relation} ${fmt(b)}.`],
  };
}

function missingNumber({ rng, level, spec }) {
  if (spec.mode === "parity") {
    const { n, pairCount, remainder } = parity(rng, spec, level);
    return {
      q: bi(`Write ${fmt(n)} as 2 × ___ + ${remainder}. How many complete pairs are there?`, `Escribe ${fmt(n)} como 2 × ___ + ${remainder}. ¿Cuántos pares completos hay?`),
      form: "int",
      answer: Q(pairCount),
      check: [{ kind: "expr", expr: `floor(${n}/2)`, role: "answer" }],
      wrong: uniqueWrongs(pairCount),
      steps: [`Each complete pair uses 2 objects.`, `Group the objects in pairs and check whether one is left over.`, `${n} makes ${pairCount} complete pairs with ${remainder} left over.`],
    };
  }
  const n = int(rng, 0, Math.max(1, spec.max - 1));
  const answer = n + 1;
  return {
    q: bi(`What is the least whole number greater than ${fmt(n)}?`, `¿Cuál es el menor número entero mayor que ${fmt(n)}?`),
    form: "int",
    answer: Q(answer),
    check: [{ kind: "expr", expr: `${n}+1`, role: "answer" }],
    wrong: uniqueWrongs(answer),
    steps: [`A greater whole number is one step to the right on the number line.`, `Add 1 to ${n}.`, `${n} + 1 = ${answer}.`],
  };
}

function visualModel({ rng, level, spec }) {
  if (spec.mode === "parity") {
    const { n, answer } = parity(rng, spec, level, Math.min(12, spec.max));
    const dots = Array.from({ length: n }, () => 1);
    return parityDraft(
      n,
      answer,
      `Can the ${n} dots be paired with none left over?`,
      `¿Se pueden agrupar los ${n} puntos en pares sin que sobre ninguno?`,
      [`Group the dots two at a time.`, `Check whether every dot belongs to a pair.`, `${n} is ${answer}, so ${answer === "even" ? "no dot is left over" : "one dot is left over"}.`],
      statsDisplay("dot-plot", dots, "Dots to group in pairs"),
    );
  }
  const { a, b, relation } = comparison(rng, spec, level);
  const tick = spec.max > 100 ? 100 : spec.max > 20 ? 10 : 1;
  return {
    q: bi(`Use the number line to compare ${fmt(a)} and ${fmt(b)}. Choose the correct symbol.`, `Usa la recta numérica para comparar ${fmt(a)} y ${fmt(b)}. Elige el símbolo correcto.`),
    form: "choice",
    answer: relation,
    options: relationOptions(relation),
    check: [{ kind: "rel", a: String(a), b: String(b), role: "answer" }],
    steps: [`Locate both numbers on the line.`, `The point farther right has the greater value.`, `${fmt(a)} ${relation} ${fmt(b)}.`],
    model: numberLine(Q(0), Q(spec.max), Q(tick), [{ value: Q(a), label: "A" }, { value: Q(b), label: "B" }], "Compare the points"),
  };
}

function realWorld({ rng, level, spec }) {
  if (spec.mode === "parity") {
    const { n, answer } = parity(rng, spec, level);
    return parityDraft(
      n,
      answer,
      `A team has ${n} badges. Can every badge be matched into a pair?`,
      `Un equipo tiene ${n} insignias. ¿Se puede formar un par con cada insignia?`,
      [`Make pairs of badges.`, `Check whether any badge is left without a partner.`, `${n} is ${answer}.`],
    );
  }
  const { a, b, relation } = comparison(rng, spec, level);
  const [thing, thingEs] = pick(rng, [
    ["books", "libros"],
    ["tickets", "boletos"],
    ["steps", "pasos"],
  ]);
  return {
    q: bi(`One group has ${fmt(a)} ${thing}; another has ${fmt(b)}. Which symbol compares the amounts?`, `Un grupo tiene ${fmt(a)} ${thingEs} y otro tiene ${fmt(b)}. ¿Qué símbolo compara las cantidades?`),
    form: "choice",
    answer: relation,
    options: relationOptions(relation),
    check: [{ kind: "rel", a: String(a), b: String(b), role: "answer" }],
    steps: [`Compare the two amounts.`, `The greater amount is farther right on a number line.`, `${fmt(a)} ${relation} ${fmt(b)}.`],
  };
}

export const family = {
  id: "compare-parts",
  skills: SPECS,
  types: { compute, "missing-number": missingNumber, "visual-model": visualModel, "real-world": realWorld },
  range: { "visual-model": [1, 4], "real-world": [2, 5] },
};
