import { bi, int } from "./kit.js";
import { Q } from "./rational.js";

const skills = { "6:integers": {}, "7:integer-add": {}, "7:integer-mul": {} };
const signed = (rng, min, max) => {
  let n = int(rng, min, max);
  if (!n) n = rng() < 0.5 ? -1 : 1;
  return n;
};
function make(ctx, type) {
  const { skill, rng, level } = ctx;
  const config = skill.config || {};
  const min = config.min ?? -30;
  const max = config.max ?? 30;
  let a; let b; let answer; let expression; let shown; let verb;
  if (skill.id === "integers") {
    a = signed(rng, min, max);
    answer = Math.abs(a);
    expression = `abs(${a})`;
    shown = `|${a}|`;
    verb = "absolute value";
  } else {
    a = signed(rng, min, max);
    b = signed(rng, min, max);
    if (skill.id === "integer-mul") {
      answer = a * b;
      expression = `${a}*${b}`;
      shown = `${a} × ${b}`;
      verb = "product";
    } else {
      answer = a + b;
      expression = `${a}+${b}`;
      shown = `${a} + (${b})`;
      verb = "sum";
    }
  }
  if (type === "real-world" && skill.id !== "integer-mul") {
    a = signed(rng, min, max);
    b = signed(rng, -12 - level * 2, 12 + level * 2);
    answer = a + b;
    expression = `${a}+${b}`;
    shown = `${a} + (${b})`;
    const en = `A thermometer reads ${a} degrees. The temperature changes by ${b} degrees. What is the new temperature?`;
    const es = `Un termómetro marca ${a} grados. La temperatura cambia ${b} grados. ¿Cuál es la nueva temperatura?`;
    return { a, b, answer, expression, shown, verb, en, es };
  }
  if (type === "real-world" && skill.id === "integer-mul") {
    a = signed(rng, -12, 12);
    b = int(rng, 2, 6);
    answer = a * b;
    expression = `${a}*${b}`;
    shown = `${a} × ${b}`;
    const en = `A game changes a player's score by ${a} points in each round. After ${b} rounds, what is the total change?`;
    const es = `Un juego cambia el puntaje de un jugador ${a} puntos en cada ronda. Después de ${b} rondas, ¿cuál es el cambio total?`;
    return { a, b, answer, expression, shown, verb, en, es };
  }
  const en = skill.id === "integers" ? `Find the ${verb} of ${shown}.` : `Find the ${verb} of ${shown}.`;
  const es = skill.id === "integers" ? `Encuentra el valor absoluto de ${shown}.` : `Encuentra ${verb === "product" ? "el producto" : "la suma"} de ${shown}.`;
  return { a, b, answer, expression, shown, verb, en, es };
}
const compute = (ctx) => draft(ctx, "compute");
const realWorld = (ctx) => draft(ctx, "real-world");
function draft(ctx, type) {
  const n = make(ctx, type);
  return {
    q: bi(n.en, n.es), form: "int", answer: Q(n.answer), bare: n.expression,
    check: [{ kind: "expr", expr: n.expression, role: "answer" }],
    wrong: [
      { v: Q(n.answer + 1), why: "made a one-count error" },
      { v: Q(n.answer - 1), why: "made a one-count error" },
      { v: Q(n.a - (n.b || 0)), why: "used the opposite operation" },
    ],
    steps: [
      n.verb === "absolute value" ? `Distance from zero is counted without a sign.` : `Keep track of the sign of each integer and the operation.`,
      n.verb === "product" ? `Multiply the magnitudes, then decide whether the signs make the product positive or negative.` : n.verb === "absolute value" ? `The distance from zero to ${n.a} is ${Math.abs(n.a)}.` : `Combine the signed amounts in the order shown.`,
      `${n.shown} = ${n.answer}.`,
    ],
  };
}
function explain(ctx) {
  const n = make(ctx, "compute");
  const key = n.answer;
  const choices = [...new Set([key, key + 1, key - 1, n.a - (n.b || 0)].filter((v) => v !== key))].slice(0, 2);
  while (choices.length < 2) choices.push(key + 10 + choices.length);
  return {
    q: bi(`Which value is the ${n.verb} of ${n.shown}?`, `¿Qué valor es ${n.verb === "product" ? "el producto" : n.verb === "absolute value" ? "el valor absoluto" : "la suma"} de ${n.shown}?`),
    form: "choice", answer: String(key), options: choices.map((v, i) => ({ text: String(v), why: i ? "changed the sign rule" : "made a one-count error" })),
    check: [key, ...choices].map((v) => ({ kind: "expr", expr: String(v), role: v === key ? "key" : "distractor" })),
    meta: { value: String(key) },
    steps: [`Read the operation and signs carefully.`, `Apply the integer rule for ${n.verb}.`, `The value is ${key}.`],
  };
}
export const family = { id: "integers", skills, types: { compute, "real-world": realWorld, explain }, range: { "real-world": [1, 5], explain: [1, 5] } };
