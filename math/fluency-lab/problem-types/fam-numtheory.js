import { bi, int } from "./kit.js";
import { Q } from "./rational.js";

const skills = { "4:factors": {}, "6:gcf": {}, "6:lcm": {} };
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const lcm = (a, b) => (a / gcd(a, b)) * b;
const mode = (skill) => skill.id === "gcf" ? "gcf" : skill.id === "lcm" ? "lcm" : "factor";
const target = (rng, kind, level) => {
  if (kind === "factor") {
    const a = int(rng, 3, 12 + level * 2);
    const b = int(rng, 2, 8 + level);
    return { a: a * b, b: a, answer: b, op: "factor" };
  }
  const a = int(rng, 4, 20 + level * 3);
  const b = int(rng, 4, 20 + level * 3);
  return { a, b, answer: kind === "gcf" ? gcd(a, b) : lcm(a, b), op: kind };
};
const calc = (n) => n.op === "gcf" ? `gcd(${n.a},${n.b})` : n.op === "lcm" ? `lcm(${n.a},${n.b})` : `${n.a}/${n.b}`;
function compute(ctx) {
  const n = target(ctx.rng, mode(ctx.skill), ctx.level);
  const prompt = n.op === "gcf" ? `Find the greatest common factor of ${n.a} and ${n.b}.` : n.op === "lcm" ? `Find the least common multiple of ${n.a} and ${n.b}.` : `How many equal groups of ${n.b} can be made from ${n.a}?`;
  const es = n.op === "gcf" ? `Encuentra el máximo común divisor de ${n.a} y ${n.b}.` : n.op === "lcm" ? `Encuentra el mínimo común múltiplo de ${n.a} y ${n.b}.` : `¿Cuántos grupos iguales de ${n.b} se pueden formar con ${n.a}?`;
  return {
    q: bi(prompt, es), form: "int", answer: Q(n.answer), bare: calc(n),
    check: [{ kind: "expr", expr: calc(n), role: "answer" }],
    wrong: [
      { v: Q(n.op === "gcf" ? n.a * n.b : n.op === "lcm" ? gcd(n.a, n.b) : n.a - n.b), why: "used a related but different operation" },
      { v: Q(n.answer + 1), why: "counted one too many" },
      { v: Q(Math.max(0, n.answer - 1)), why: "counted one too few" },
    ],
    steps: [
      n.op === "gcf" ? `List factors shared by ${n.a} and ${n.b}.` : n.op === "lcm" ? `List multiples of ${n.a} and ${n.b}.` : `Identify the total and the number in each equal group.`,
      n.op === "gcf" ? `Choose the greatest factor in both lists.` : n.op === "lcm" ? `Choose the first multiple that appears in both lists.` : `Divide the total by the group size to find the number of groups.`,
      `${prompt.replace(/[.]$/, "")} The value is ${n.answer}.`,
    ],
  };
}
function realWorld(ctx) {
  const n = target(ctx.rng, mode(ctx.skill), ctx.level);
  let en; let es; let steps;
  if (n.op === "gcf") {
    en = `A teacher has ${n.a} red tiles and ${n.b} blue tiles. What is the greatest number of identical sets she can make with no tiles left over?`;
    es = `Una maestra tiene ${n.a} fichas rojas y ${n.b} fichas azules. ¿Cuál es el mayor número de conjuntos iguales que puede hacer sin que sobren fichas?`;
    steps = [`Find the factors shared by ${n.a} and ${n.b}.`, `Choose the greatest shared factor.`, `The greatest number of identical sets is ${n.answer}.`];
  } else if (n.op === "lcm") {
    en = `One signal repeats every ${n.a} minutes and another every ${n.b} minutes. After how many minutes will they repeat together?`;
    es = `Una señal se repite cada ${n.a} minutos y otra cada ${n.b} minutos. ¿Después de cuántos minutos volverán a coincidir?`;
    steps = [`List multiples of ${n.a} and ${n.b}.`, `Find the first shared multiple after zero.`, `They repeat together after ${n.answer} minutes.`];
  } else {
    en = `${n.a} tiles are arranged in rows of ${n.b}. How many rows are there?`;
    es = `Se acomodan ${n.a} fichas en filas de ${n.b}. ¿Cuántas filas hay?`;
    steps = [`Use the total of ${n.a} tiles.`, `Put ${n.b} tiles in each row.`, `${n.a} ÷ ${n.b} = ${n.answer} rows.`];
  }
  return {
    q: bi(en, es), form: "int", answer: Q(n.answer), bare: calc(n),
    check: [{ kind: "expr", expr: calc(n), role: "answer" }],
    wrong: [
      { v: Q(n.op === "gcf" ? n.a + n.b : n.op === "lcm" ? n.a * n.b : n.a + n.b), why: "combined the numbers instead of finding the shared factor or multiple" },
      { v: Q(n.answer + 1), why: "counted one too many" },
      { v: Q(Math.max(0, n.answer - 1)), why: "counted one too few" },
    ], steps,
  };
}
function explain(ctx) {
  const n = target(ctx.rng, mode(ctx.skill), ctx.level);
  const key = n.answer;
  const distractors = [...new Set([n.op === "gcf" ? n.a * n.b : n.op === "lcm" ? gcd(n.a, n.b) : n.a - n.b, key + 1, Math.max(0, key - 1)].filter((v) => v !== key))].slice(0, 2);
  while (distractors.length < 2) distractors.push(key + 10 + distractors.length);
  const choices = [key, ...distractors];
  return {
    q: bi(`Which value completes ${n.op === "factor" ? `${n.a} ÷ ${n.b}` : n.op === "gcf" ? `the greatest common factor of ${n.a} and ${n.b}` : `the least common multiple of ${n.a} and ${n.b}`}?`, `¿Qué valor completa ${n.op === "factor" ? `${n.a} ÷ ${n.b}` : n.op === "gcf" ? `el máximo común divisor de ${n.a} y ${n.b}` : `el mínimo común múltiplo de ${n.a} y ${n.b}`}?`),
    form: "choice", answer: String(key), options: distractors.map((v, i) => ({ text: String(v), why: i ? "made a one-count error" : "used a related operation" })),
    check: choices.map((v) => ({ kind: "expr", expr: String(v), role: v === key ? "key" : "distractor" })),
    meta: { value: String(key) },
    steps: [`Identify whether the task asks for a shared factor, a shared multiple, or an equal group size.`, `Use the matching factor or multiple relationship.`, `The value is ${key}.`],
  };
}
export const family = { id: "numtheory", skills, types: { compute, "real-world": realWorld, explain }, range: { "real-world": [1, 5], explain: [1, 5] } };
