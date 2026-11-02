// Fraction equivalence, comparison and operations. Questions use exact rational arithmetic throughout.
import { bi, int, pick } from "./kit.js";
import { Q, add, sub, mul, div, qs, gcd } from "./rational.js";

const SPECS = {
  "3:fraction-equivalence": { mode: "equivalence", maxDenominator: 10 },
  "3:fraction-compare": { mode: "compare", maxDenominator: 10 },
  "4:fraction-equiv": { mode: "equivalence", maxDenominator: 12 },
  "4:fraction-compare": { mode: "compare", maxDenominator: 12 },
  "5:fraction-add": { mode: "add", maxDenominator: 12 },
  "5:fraction-mul": { mode: "mul", maxDenominator: 12 },
  "5:fraction-of": { mode: "of", maxDenominator: 10 },
  "5:unit-fraction-division": { mode: "unit-division", maxDenominator: 10 },
  "6:divide-fractions": { mode: "div", maxDenominator: 10 },
  "7:fraction-ops": { mode: "rational", maxDenominator: 10 },
};

const text = (q) => (q.d === 1 ? String(q.n) : `${q.n}/${q.d}`);
const opValue = (a, b, op) => (op === "+" ? add(a, b) : op === "−" ? sub(a, b) : op === "×" ? mul(a, b) : div(a, b));
const opAscii = { "+": "+", "−": "-", "×": "*", "÷": "/" };
const expression = (a, op, b) => `(${text(a)})${opAscii[op]}(${text(b)})`;
const uniqueWrong = (answer, candidates) => {
  const seen = new Set([text(answer)]);
  return candidates.filter((w) => {
    const key = text(w.v);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const errorChoices = (correct, a, b) => [
  { v: add(a, b), why: "added the numerators and denominators separately" },
  { v: sub(a, b), why: "subtracted the second fraction instead of multiplying" },
  { v: add(correct, Q(1, correct.d)), why: "changed the result by one unit fraction" },
];

function operationFor({ skill, rng }) {
  const mode = SPECS[`${skill.grade}:${skill.id}`].mode;
  if (mode === "add") return "+";
  if (mode === "of") return "×";
  if (mode === "unit-division") return "÷";
  if (mode === "mul") return "×";
  if (mode === "div") return "÷";
  if (mode === "rational") return pick(rng, ["+", "−", "×", "÷"]);
  return pick(rng, ["+", "−"]);
}

function pair(rng, level, maxDenominator, op) {
  const topDen = Math.min(maxDenominator, 3 + level * 2);
  const d1 = int(rng, 2, topDen);
  let d2 = level === 1 ? d1 : int(rng, 2, topDen);
  if (level > 1 && d2 === d1) d2 = d2 === topDen ? 2 : d2 + 1;
  const n1 = int(rng, 1, d1 - 1);
  const n2 = int(rng, 1, d2 - 1);
  let a = Q(n1, d1);
  let b = Q(n2, d2);
  if ((op === "−" || op === "÷") && (op === "÷" ? b.n === 0 : sub(a, b).n < 0)) [a, b] = [b, a];
  if (op === "÷" && b.n === 0) b = Q(1, b.d);
  return [a, b];
}

function fractionCompute({ rng, level, skill, spec }) {
  const mode = SPECS[`${skill.grade}:${skill.id}`].mode;
  const maxDen = spec.maxDenominator;
  if (mode === "equivalence") {
    const d = int(rng, 2, Math.min(maxDen, level + 4));
    const n = int(rng, 1, d - 1);
    const factor = int(rng, 2, level + 2);
    const answer = n * factor;
    const left = `${n}/${d}`;
    const right = `x/${d * factor}`;
    const lhs = `x/${d * factor}`;
    const rhs = left;
    return {
      q: bi(`Complete the equivalent fraction: ${left} = ${right}.`, `Completa la fracción equivalente: ${left} = ${right}.`),
      form: "int",
      answer: Q(answer),
      check: [{ kind: "solve", var: "x", lhs, rhs, role: "answer" }],
      wrong: [{ v: Q(answer + 1), why: "changed one term by one instead of scaling both terms" }, { v: Q(answer - 1), why: "scaled by one less" }, { v: Q(answer + factor), why: "added the factor instead of multiplying" }],
      steps: ["Equivalent fractions name the same part of a whole.", "Find the scale factor between the known terms.", `The missing term is ${answer}.`],
    };
  }
  if (mode === "compare") {
    const [a, b] = pair(rng, level, maxDen, "+");
    const cmp = a.n * b.d - b.n * a.d;
    const answer = cmp < 0 ? "<" : cmp > 0 ? ">" : "=";
    const choices = ["<", "=", ">"].filter((x) => x !== answer);
    return {
      q: bi(`Compare the fractions: ${text(a)} ___ ${text(b)}.`, `Compara las fracciones: ${text(a)} ___ ${text(b)}.`),
      form: "choice",
      answer,
      options: choices.map((x) => ({ text: x, why: "compared the numerators without accounting for the size of each part" })),
      check: [{ kind: "rel", a: text(a), b: text(b), role: "answer" }],
      steps: ["The denominators tell the size of the parts.", "Rewrite with a common denominator or compare the values.", `${text(a)} ${answer} ${text(b)}.`],
    };
  }
  let op = operationFor({ skill, rng });
  let a, b;
  if (mode === "of") {
    const d = int(rng, 2, Math.min(maxDen, 6 + level));
    const n = int(rng, 1, d - 1);
    const whole = d * int(rng, 2, 5 + level);
    a = Q(n, d);
    b = Q(whole);
    op = "×";
  } else if (mode === "unit-division") {
    const d = int(rng, 2, Math.min(maxDen, 5 + level));
    a = Q(int(rng, 2, 5 + level));
    b = Q(1, d);
    op = "÷";
  } else {
    [a, b] = pair(rng, level, maxDen, op);
  }
  const answer = opValue(a, b, op);
  const ex = expression(a, op, b);
  const wrong = uniqueWrong(answer, errorChoices(answer, a, b));
  return {
    q: bi(`${text(a)} ${op} ${text(b)} = ?`, `${text(a)} ${op} ${text(b)} = ?`),
    form: "fraction",
    answer,
    bare: ex,
    check: [{ kind: "expr", expr: ex, role: "answer" }],
    wrong,
    steps: ["Identify the operation and the values in the expression.", "Use equivalent parts when needed, then apply the operation.", `${text(a)} ${op} ${text(b)} = ${text(answer)}.`],
  };
}

function missingNumber({ rng, level, skill, spec }) {
  const mode = SPECS[`${skill.grade}:${skill.id}`].mode;
  const op = mode === "mul" || mode === "of" ? "×" : mode === "div" || mode === "unit-division" ? "÷" : "+";
  let a, b, answer, target, left, rhs, lhs;
  if (mode === "unit-division" || mode === "div") {
    if (mode === "unit-division") {
      const d = int(rng, 2, Math.min(spec.maxDenominator, 5 + level));
      a = Q(int(rng, 2, 5 + level));
      b = Q(1, d);
    } else [a, b] = pair(rng, level, spec.maxDenominator, "÷");
    answer = mul(a, b);
    target = a;
    left = `x ÷ (${text(b)})`;
    rhs = text(a);
    lhs = `x/(${text(b)})`;
  } else {
    [a, b] = mode === "of" ? [Q(int(rng, 1, 4), 5), Q(int(rng, 5, 10))] : pair(rng, level, spec.maxDenominator, op);
    answer = b;
    target = opValue(a, b, op);
    left = `${text(a)} ${op} x`;
    rhs = text(target);
    lhs = `${text(a)}${opAscii[op]}x`;
  }
  return {
    q: bi(`Find the missing number: ${left} = ${rhs}.`, `Encuentra el número que falta: ${left} = ${rhs}.`),
    form: "fraction",
    answer,
    check: [{ kind: "solve", var: "x", lhs, rhs, role: "answer" }],
    wrong: [{ v: add(answer, Q(1, answer.d)), why: "changed the missing value by one unit" }, { v: sub(answer, Q(1, answer.d)), why: "changed the missing value by one unit in the other direction" }],
    steps: ["The equation must stay balanced.", "Undo the operation attached to the missing number.", `The missing number is ${text(answer)}.`],
  };
}

function contextual({ rng, level, skill, spec }, type) {
  const mode = SPECS[`${skill.grade}:${skill.id}`].mode;
  const op = mode === "mul" || mode === "of" ? "×" : mode === "div" || mode === "unit-division" ? "÷" : "+";
  let a, b;
  if (mode === "of") [a, b] = [Q(int(rng, 1, 4), 5), Q(int(rng, 5, 10))];
  else if (mode === "unit-division") [a, b] = [Q(int(rng, 2, 5 + level)), Q(1, int(rng, 2, Math.min(spec.maxDenominator, 5 + level)))];
  else [a, b] = pair(rng, level, spec.maxDenominator, op);
  const answer = opValue(a, b, op);
  const ex = expression(a, op, b);
  let story;
  if (op === "×") story = [`A recipe uses ${text(a)} cup of flour for each batch. How much flour is needed for ${text(b)} batches?`, `Una receta usa ${text(a)} taza de harina por cada tanda. ¿Cuánta harina se necesita para ${text(b)} tandas?`];
  else if (op === "÷") story = [`A length of ${text(a)} meter is cut into pieces that are each ${text(b)} meter long. How many pieces are made?`, `Una longitud de ${text(a)} metro se corta en partes de ${text(b)} metro cada una. ¿Cuántas partes se forman?`];
  else if (type === "real-world") story = [`A recipe uses ${text(a)} cup of flour, then ${text(b)} more cup. How many cups are used?`, `Una receta usa ${text(a)} taza de harina y luego ${text(b)} taza más. ¿Cuántas tazas se usan?`];
  else story = [`A ribbon is ${text(a)} meter long and another is ${text(b)} meter long. What is their total length?`, `Una cinta mide ${text(a)} metro y otra mide ${text(b)} metro. ¿Cuál es la longitud total?`];
  return {
    q: bi(story[0], story[1]),
    form: "fraction",
    answer,
    check: [{ kind: "expr", expr: ex, role: "answer" }],
    wrong: uniqueWrong(answer, errorChoices(answer, a, b)),
    steps: ["Choose the operation that matches what happens in the story.", "Represent the amounts with fractions and combine them.", `The result is ${text(answer)}.`],
  };
}

function multiStep({ rng, level, skill, spec }) {
  const [a, b] = pair(rng, level, spec.maxDenominator, "+");
  const sum = add(a, b);
  const take = Q(int(rng, 1, Math.max(1, sum.n)), sum.d);
  const answer = sub(sum, take);
  const ex = `(${text(a)}+${text(b)})-${text(take)}`;
  return {
    q: bi(`A recipe uses ${text(a)} cup of one ingredient and ${text(b)} cup of another, then ${text(take)} cup is used. How much remains?`, `Una receta usa ${text(a)} taza de un ingrediente y ${text(b)} taza de otro; luego se usan ${text(take)} taza. ¿Cuánto queda?`),
    form: "fraction",
    answer,
    check: [{ kind: "expr", expr: ex, role: "answer" }],
    wrong: uniqueWrong(answer, errorChoices(answer, a, b)),
    steps: ["Combine the two ingredient amounts first.", "Subtract the amount that was used from that total.", `The amount remaining is ${text(answer)} cup.`],
  };
}

function explain({ rng, level, skill, spec }) {
  const [a, b] = pair(rng, level, spec.maxDenominator, "+");
  const answer = add(a, b);
  const ex = expression(a, "+", b);
  return {
    q: bi(`Which statement explains how to add ${text(a)} and ${text(b)}?`, `¿Qué afirmación explica cómo sumar ${text(a)} y ${text(b)}?`),
    form: "choice",
    answer: "Use equal-size parts before combining the numerators.",
    answerEs: "Usa partes del mismo tamaño antes de sumar los numeradores.",
    options: [
      { text: "Add the denominators to make the new denominator.", es: "Suma los denominadores para formar el nuevo denominador.", why: "adds the denominators instead of finding equal-size parts" },
      { text: "Multiply both numerators and denominators, then add.", es: "Multiplica los numeradores y denominadores, luego suma.", why: "changes both fractions before combining them" },
    ],
    check: [{ kind: "expr", expr: ex, value: text(answer) }],
    steps: ["The denominators name the size of the parts.", "Equivalent fractions let the parts have a shared size.", "Then combine the numerators and keep that denominator."],
  };
}

const types = {
  compute: fractionCompute,
  "missing-number": missingNumber,
  "real-world": (ctx) => contextual(ctx, "real-world"),
  "word-problem": (ctx) => contextual(ctx, "word-problem"),
  "multi-step": multiStep,
  equation: missingNumber,
  explain,
};

export const family = { id: "fractions", skills: SPECS, types };
