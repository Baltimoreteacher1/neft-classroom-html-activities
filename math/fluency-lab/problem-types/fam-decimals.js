// Decimal place value and operations. All values remain exact terminating rationals.
import { bi, int, pick } from "./kit.js";
import { Q, add, sub, mul, div, decText, gcd } from "./rational.js";

const SPECS = {
  "5:decimal-place": { mode: "place", places: 3 },
  "5:decimal-add": { mode: "add", places: 2 },
  "5:decimal-sub": { mode: "sub", places: 2 },
  "5:decimal-mul": { mode: "mul", places: 2 },
  "6:decimal-ops": { mode: "mixed", places: 3 },
};

const fmt = (q) => decText(q) ?? `${q.n}/${q.d}`;
const opAscii = { "+": "+", "−": "-", "×": "*", "÷": "/" };
const compute = (a, op, b) => (op === "+" ? add(a, b) : op === "−" ? sub(a, b) : op === "×" ? mul(a, b) : div(a, b));
const distinctWrong = (answer, candidates) => {
  const used = new Set([fmt(answer)]);
  return candidates.filter((w) => {
    const k = fmt(w.v);
    if (used.has(k)) return false;
    used.add(k);
    return true;
  });
};
const wrongs = (answer, a, b) => distinctWrong(answer, [
  { v: add(a, b), why: "combined the values as if every digit had the same place value" },
  { v: sub(a, b), why: "subtracted instead of using the requested operation" },
  { v: add(answer, Q(1, 10)), why: "changed the result by one tenth" },
]);

function drawDecimal(rng, level, maxPlaces, min = 1, maxWhole = 20) {
  const places = int(rng, 1, Math.min(maxPlaces, Math.max(1, level)));
  const scale = 10 ** places;
  return Q(int(rng, min * scale, maxWhole * scale - 1), scale);
}

function decimalCompute({ rng, level, skill, spec }) {
  if (spec.mode === "place") {
    const value = drawDecimal(rng, level, spec.places, 1, 30);
    const p = int(rng, 1, Math.min(spec.places, level));
    const power = Q(1, 10 ** p);
    const digit = Math.floor((Math.abs(value.n) * power.d) / (value.d * power.n)) % 10;
    const expr = `digit(${fmt(value)},${fmt(power)})`;
    return {
      q: bi(`What digit is in the ${["tenths", "hundredths", "thousandths"][p - 1]} place in ${fmt(value)}?`, `¿Qué dígito ocupa el lugar de las ${["décimas", "centésimas", "milésimas"][p - 1]} en ${fmt(value)}?`),
      form: "int",
      answer: Q(digit),
      check: [{ kind: "expr", expr, role: "answer" }],
      wrong: [{ v: Q((digit + 1) % 10), why: "read the digit next to the target place" }, { v: Q((digit + 9) % 10), why: "read the digit next to the target place" }],
      steps: ["Start at the decimal point and count places to the right.", "Stop at the named place and read its digit.", `The digit is ${digit}.`],
    };
  }
  const mode = spec.mode;
  const op = mode === "add" ? "+" : mode === "sub" ? "−" : mode === "mul" ? "×" : pick(rng, ["+", "−", "×", "÷"]);
  let a = drawDecimal(rng, level, spec.places, 1, 30);
  let b = drawDecimal(rng, level, spec.places, 1, 12);
  if (op === "−" && a.n * b.d < b.n * a.d) [a, b] = [b, a];
  if (op === "÷") {
    // A quotient of a terminating decimal and a small whole number remains exact and terminating.
    b = Q(int(rng, 2, 9));
    a = mul(drawDecimal(rng, level, spec.places, 1, 12), b);
  }
  const answer = compute(a, op, b);
  const expression = `${fmt(a)}${opAscii[op]}${fmt(b)}`;
  return {
    q: bi(`${fmt(a)} ${op} ${fmt(b)} = ?`, `${fmt(a)} ${op} ${fmt(b)} = ?`),
    form: "decimal",
    answer,
    bare: expression,
    check: [{ kind: "expr", expr: expression, role: "answer" }],
    wrong: wrongs(answer, a, b),
    steps: ["Line up matching place values or write the operation as an exact expression.", "Apply the operation, keeping each digit in its place.", `${fmt(a)} ${op} ${fmt(b)} = ${fmt(answer)}.`],
  };
}

function missingNumber({ rng, level, skill, spec }) {
  const op = spec.mode === "sub" ? "−" : spec.mode === "mul" ? "×" : "+";
  let a = drawDecimal(rng, level, spec.places, 1, 20);
  const b = drawDecimal(rng, level, spec.places, 1, 10);
  if (op === "−" && a.n * b.d < b.n * a.d) [a] = [add(a, b)];
  const answer = compute(a, op, b);
  const lhs = `${fmt(a)}${opAscii[op]}x`;
  return {
    q: bi(`Find the missing number: ${fmt(a)} ${op} x = ${fmt(answer)}.`, `Encuentra el número que falta: ${fmt(a)} ${op} x = ${fmt(answer)}.`),
    form: "decimal",
    answer: b,
    check: [{ kind: "solve", var: "x", lhs, rhs: fmt(answer), role: "answer" }],
    wrong: [{ v: add(b, Q(1, 10)), why: "changed the missing value by one tenth" }, { v: sub(b, Q(1, 10)), why: "changed the missing value by one tenth in the other direction" }],
    steps: ["Keep the two sides of the equation equal.", "Undo the operation on the number beside x.", `The missing number is ${fmt(b)}.`],
  };
}

function contextItem({ rng, level, skill, spec }, type) {
  const mode = spec.mode;
  const op = mode === "sub" ? "−" : mode === "mul" ? "×" : "+";
  let a = drawDecimal(rng, level, spec.places, 1, 20);
  let b = drawDecimal(rng, level, spec.places, 1, 10);
  if (op === "−" && a.n * b.d < b.n * a.d) [a, b] = [b, a];
  const answer = compute(a, op, b);
  const expression = `${fmt(a)}${opAscii[op]}${fmt(b)}`;
  const story = type === "real-world"
    ? [`A notebook costs $${fmt(a)}. What is the cost of ${fmt(b)} notebooks?`, `Un cuaderno cuesta $${fmt(a)}. ¿Cuánto cuestan ${fmt(b)} cuadernos?`]
    : [`A tank contains ${fmt(a)} liters. ${fmt(b)} liters are added. How many liters are there now?`, `Un tanque contiene ${fmt(a)} litros. Se agregan ${fmt(b)} litros. ¿Cuántos litros hay ahora?`];
  return {
    q: bi(story[0], story[1]),
    form: "decimal",
    answer,
    check: [{ kind: "expr", expr: expression, role: "answer" }],
    wrong: wrongs(answer, a, b),
    steps: ["Choose the operation that matches the situation.", "Align the decimal places before calculating.", `The result is ${fmt(answer)}.`],
  };
}

function explain({ rng, level, skill, spec }) {
  const a = drawDecimal(rng, level, spec.places, 1, 20);
  const b = drawDecimal(rng, level, spec.places, 1, 10);
  const result = add(a, b);
  const ex = `${fmt(a)}+${fmt(b)}`;
  return {
    q: bi(`Which statement explains how to add ${fmt(a)} and ${fmt(b)}?`, `¿Qué afirmación explica cómo sumar ${fmt(a)} y ${fmt(b)}?`),
    form: "choice",
    answer: "Align equal place values before adding.",
    answerEs: "Alinea los valores posicionales iguales antes de sumar.",
    options: [
      { text: "Put every digit in the same column, regardless of its place.", es: "Coloca cada dígito en la misma columna, sin importar su lugar.", why: "ignores the value of each decimal place" },
      { text: "Add the decimal points to find where the answer's point goes.", es: "Suma los puntos decimales para saber dónde va el punto del resultado.", why: "treats decimal points as numbers to add" },
    ],
    check: [{ kind: "expr", expr: ex, value: fmt(result) }],
    steps: ["The digits have values based on their places.", "Matching tenths, hundredths and other places keeps the sum equivalent.", "Then add each column and place the decimal point in line."],
  };
}

export const family = {
  id: "decimals",
  skills: SPECS,
  types: {
    compute: decimalCompute,
    "missing-number": missingNumber,
    "real-world": (ctx) => contextItem(ctx, "real-world"),
    "word-problem": (ctx) => contextItem(ctx, "word-problem"),
    "multi-step": contextItem,
    equation: missingNumber,
    explain,
  },
};
