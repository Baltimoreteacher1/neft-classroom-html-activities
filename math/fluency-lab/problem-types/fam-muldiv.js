import { bi, fmt, int, pick } from "./kit.js";
import { array } from "./models.js";
import { Q } from "./rational.js";

const KEYS = [
  "3:mul-0-5", "3:mul-6-9", "3:mul-10-12", "3:division-facts", "4:mul-11-12", "4:multiply-1digit",
  "4:multiply-2digit", "4:division", "5:multiply-whole", "5:divide-whole", "6:multi-digit-division",
];
const specs = Object.fromEntries(KEYS.map((key) => {
  const [grade, id] = key.split(":");
  return [key, { grade: Number(grade), id }];
}));
const keyOf = (skill) => `${skill.grade}:${skill.id}`;
const configOf = (skill) => skill.config || {};

function operands({ rng, skill }) {
  const config = configOf(skill);
  const division = config.op === "div" || /division|divide/.test(skill.id);
  let a;
  let b;
  if (division) {
    a = int(rng, config.minDivisor || 2, config.maxDivisor || 9);
    b = int(rng, config.minQuotient || 2, config.maxQuotient || 12);
    return { a: a * b, b: a, answer: b, op: "div" };
  }
  const [minA, maxA] = [config.minA ?? (config.factors ? Math.min(...config.factors) : 2), config.maxA ?? (config.factors ? Math.max(...config.factors) : 12)];
  const [minB, maxB] = [config.minB ?? 2, config.maxB ?? 12];
  if (config.factors) a = pick(rng, config.factors.filter((n) => n >= minA && n <= maxA));
  else a = int(rng, minA, maxA);
  b = int(rng, minB, maxB);
  if (config.tens) b *= 10;
  return { a, b, answer: a * b, op: "mul" };
}
const expr = ({ a, b, op }) => op === "mul" ? `${a}*${b}` : `${a}/${b}`;
const sign = ({ op }) => op === "mul" ? "×" : "÷";
const compute = (ctx) => {
  const n = operands(ctx);
  const shown = `${fmt(n.a)} ${sign(n)} ${fmt(n.b)}`;
  return {
    q: bi(`${shown} = ?`, `${shown} = ?`), form: "int", answer: Q(n.answer), bare: expr(n),
    check: [{ kind: "expr", expr: expr(n), role: "answer" }],
    wrong: [
      { v: Q(n.op === "mul" ? n.a + n.b : n.a * n.b), why: n.op === "mul" ? "added instead of multiplying" : "multiplied instead of dividing" },
      { v: Q(n.answer + 1), why: "counted one too many" },
      { v: Q(Math.max(0, n.answer - 1)), why: "counted one too few" },
    ],
    steps: [
      n.op === "mul" ? `Think of ${fmt(n.a)} groups with ${fmt(n.b)} in each group.` : `Use the related multiplication fact with ${fmt(n.b)} and the quotient.`,
      n.op === "mul" ? `Multiply the number of groups by the amount in each group.` : `Find the number that multiplied by ${fmt(n.b)} makes ${fmt(n.a)}.`,
      `${shown} = ${fmt(n.answer)}.`,
    ],
  };
};

function realWorld(ctx) {
  const n = operands(ctx);
  const { a, b, answer, op } = n;
  const shown = `${fmt(a)} ${sign(n)} ${fmt(b)}`;
  const prompt = op === "mul"
    ? [`There are ${fmt(a)} boxes with ${fmt(b)} tiles in each box. How many tiles are there?`, `Hay ${fmt(a)} cajas con ${fmt(b)} fichas en cada caja. ¿Cuántas fichas hay?`]
    : [`${fmt(a)} tiles are shared equally among ${fmt(b)} boxes. How many tiles go in each box?`, `Se reparten ${fmt(a)} fichas por igual entre ${fmt(b)} cajas. ¿Cuántas fichas van en cada caja?`];
  return {
    q: bi(prompt[0], prompt[1]), form: "int", answer: Q(answer), bare: expr(n),
    check: [{ kind: "expr", expr: expr(n), role: "answer" }],
    wrong: [
      { v: Q(op === "mul" ? a + b : a), why: "combined the group count and group size" },
      { v: Q(answer + 1), why: "counted one too many" },
      { v: Q(Math.max(0, answer - 1)), why: "counted one too few" },
    ],
    steps: [
      op === "mul" ? `Identify the ${fmt(a)} equal groups.` : `Identify the total of ${fmt(a)} tiles and ${fmt(b)} equal groups.`,
      op === "mul" ? `Each group has ${fmt(b)} tiles, so multiply.` : `Divide the total into ${fmt(b)} equal groups.`,
      `${shown} = ${fmt(answer)}.`,
    ],
  };
}

function visualModel(ctx) {
  const n = operands(ctx);
  if (n.op === "mul" && n.a === 0) {
    n.a = 1;
    n.answer = n.b;
  }
  const rows = n.op === "mul" ? n.a : n.answer;
  const cols = n.op === "mul" ? n.b : n.b;
  const shown = `${fmt(n.a)} ${sign(n)} ${fmt(n.b)}`;
  const prompt = n.op === "mul"
    ? [`The array has ${rows} rows with ${cols} tiles in each row. How many tiles are there?`, `El arreglo tiene ${rows} filas con ${cols} fichas en cada fila. ¿Cuántas fichas hay?`]
    : [`The array shows ${n.a} tiles in rows of ${n.b}. How many rows are there?`, `El arreglo muestra ${n.a} fichas en filas de ${n.b}. ¿Cuántas filas hay?`];
  return {
    q: bi(prompt[0], prompt[1]), form: "int", answer: Q(n.answer), bare: expr(n),
    check: [{ kind: "expr", expr: expr(n), role: "answer" }],
    wrong: [
      { v: Q(n.op === "mul" ? n.a + n.b : n.a), why: "combined the group count and group size" },
      { v: Q(n.answer + 1), why: "counted one too many" },
      { v: Q(Math.max(0, n.answer - 1)), why: "counted one too few" },
    ],
    steps: [
      n.op === "mul" ? `Count the equal rows and the tiles in each row.` : `Read the total number of tiles and the number in each row.`,
      n.op === "mul" ? `Multiply the number of rows by the number in each row.` : `Divide the total by the number in each row.`,
      `${shown} = ${fmt(n.answer)}.`,
    ],
    model: array(rows, cols, "Equal groups shown as an array"),
  };
}

function explain(ctx) {
  const n = operands(ctx);
  const right = n.answer;
  const options = [...new Set([right + 1, Math.max(0, right - 1), n.op === "mul" ? n.a + n.b : n.a * n.b].filter((v) => v !== right))].slice(0, 2);
  while (options.length < 2) options.push(right + 10 + options.length);
  const choices = [right, ...options];
  const check = choices.map((value) => ({ kind: "expr", expr: String(value), role: value === right ? "key" : "distractor" }));
  return {
    q: bi(`Which number makes ${fmt(n.a)} ${sign(n)} ${fmt(n.b)} true?`, `¿Qué número hace verdadera esta operación: ${fmt(n.a)} ${sign(n)} ${fmt(n.b)}?`),
    form: "choice", answer: String(right), options: options.map((value, i) => ({ text: String(value), why: i ? "used the other operation" : "made a one-count error" })),
    check, meta: { value: String(right) },
    steps: [`Read the operation sign and identify the groups or equal shares.`, `Use the related multiplication or division fact.`, `The value is ${fmt(right)}.`],
  };
}

export const family = {
  id: "muldiv",
  skills: specs,
  types: { compute, "visual-model": visualModel, "real-world": realWorld, explain },
  range: { "visual-model": [1, 4], "real-world": [1, 5], explain: [1, 5] },
  supports: { "visual-model": (spec) => spec.grade === 3 && spec.id !== "mul-10-12" },
};
