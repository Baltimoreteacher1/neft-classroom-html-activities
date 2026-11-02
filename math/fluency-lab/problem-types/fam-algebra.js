import { bi, int } from "./kit.js";
import { Q } from "./rational.js";

const skills = { "6:evaluate": {}, "6:one-step": {}, "7:equations": {}, "7:inequalities": {}, "8:linear-equations": {}, "8:functions": {}, "8:systems": {} };
const key = (skill) => `${skill.grade}:${skill.id}`;
const signed = (rng, low, high) => { let n = int(rng, low, high); return n || 1; };
function data(ctx, type) {
  const { rng, level, skill } = ctx;
  const id = skill.id;
  if (id === "evaluate" || id === "functions") {
    const x = int(rng, 2, 6 + level);
    const a = int(rng, 2, 4 + level);
    const b = int(rng, 1, 8 + level);
    const answer = a * x + b;
    const expr = `${a}*${x}+${b}`;
    const en = id === "functions" ? `For f(x) = ${a}x + ${b}, find f(${x}).` : `Evaluate ${a}x + ${b} when x = ${x}.`;
    const es = id === "functions" ? `Si f(x) = ${a}x + ${b}, encuentra f(${x}).` : `Evalúa ${a}x + ${b} cuando x = ${x}.`;
    return { a, b, x, answer, expr, en, es, value: String(answer), steps: [`Substitute ${x} for x.`, `Multiply ${a} by ${x}, then add ${b}.`, `${expr} = ${answer}.`] };
  }
  if (id === "systems") {
    const x = int(rng, 2, 8 + level);
    const y = int(rng, 2, 8 + level);
    const a = int(rng, 2, 5);
    const b = int(rng, 1, 4);
    const c = int(rng, 1, 4);
    const d = int(rng, 2, 5);
    // Choose the constants from a known integer solution, then check both equations independently.
    const m = a * x + b * y;
    const n = c * x + d * y;
    if (a * d === b * c) return data(ctx, type);
    return { x, y, a, b, c, d, m, n: n, answer: x, en: `Solve the system: ${a}x + ${b}y = ${m} and ${c}x + ${d}y = ${n}. What is x?`, es: `Resuelve el sistema: ${a}x + ${b}y = ${m} y ${c}x + ${d}y = ${n}. ¿Cuánto vale x?`, check: { kind: "system", vars: ["x", "y"], eqs: [[`${a}*x+${b}*y`, String(m)], [`${c}*x+${d}*y`, String(n)]], ask: "x", role: "answer" }, value: String(x), steps: [`Look for values that satisfy both equations.`, `Substitute x = ${x} and y = ${y} into each equation.`, `Both equations are true, so x = ${x}.`] };
  }
  if (id === "one-step") {
    const x = signed(rng, 2, 10 + level);
    const b = signed(rng, -15, 15);
    const rhs = x + b;
    const lhs = `x${b < 0 ? b : `+${b}`}`;
    return { x, b, rhs, answer: x, en: `Solve ${lhs} = ${rhs}.`, es: `Resuelve ${lhs} = ${rhs}.`, lhs, check: { kind: "solve", var: "x", lhs, rhs: String(rhs), role: "answer" }, value: String(x), steps: [`Keep the equation balanced by undoing the added amount.`, `Subtract ${b} from both sides.`, `The solution is x = ${x}.`] };
  }
  if (id === "inequalities") {
    const a = int(rng, 2, 9);
    const b = int(rng, 2, 9);
    const sign = a < b ? "<" : a > b ? ">" : "=";
    return { a, b, answer: sign, en: `Compare ${a} and ${b}. Choose the correct relation symbol.`, es: `Compara ${a} y ${b}. Elige el símbolo de relación correcto.`, relation: { kind: "rel", a: String(a), b: String(b), role: "answer" }, value: sign, steps: [`Compare the values of the two numbers.`, `A smaller value goes before the relation symbol.`, `${a} ${sign} ${b}.`] };
  }
  const x = signed(rng, 2, 9 + level);
  const a = int(rng, 2, 8);
  const b = signed(rng, -12, 12);
  const rhs = a * x + b;
  const lhs = `${a}*x${b < 0 ? b : `+${b}`}`;
  return { x, a, b, rhs, answer: x, en: `Solve ${lhs} = ${rhs}.`, es: `Resuelve ${lhs} = ${rhs}.`, lhs, rhs, check: { kind: "solve", var: "x", lhs, rhs: String(rhs), role: "answer" }, value: String(x), steps: [`Keep the equation balanced on both sides.`, `Undo the added or subtracted amount, then undo multiplication by ${a}.`, `The solution is x = ${x}.`] };
}
function compute(ctx) {
  const n = data(ctx, "compute");
  if (n.relation) return relationDraft(n);
  return typed(n);
}
function realWorld(ctx) {
  const n = data(ctx, "real-world");
  if (n.relation) return relationDraft(n, true);
  if (n.expr && n.x !== undefined && n.a !== undefined) {
    return typed({ ...n, en: `A game gives ${n.a} points for each of ${n.x} rounds, then adds ${n.b} bonus points. What is the score?`, es: `Un juego da ${n.a} puntos por cada una de ${n.x} rondas y luego suma ${n.b} puntos de bonificación. ¿Cuál es el puntaje?`, steps: [`Multiply the points per round by the number of rounds.`, `Add the bonus points.`, `The score is ${n.answer}.`] });
  }
  if (n.check?.kind === "system") {
    return typed({ ...n, en: `An adult ticket costs x dollars and a child ticket costs y dollars. One family buys ${n.a} adult and ${n.b} child tickets for ${n.m} dollars. Another buys ${n.c} adult and ${n.d} child tickets for ${n.n} dollars. What is the adult ticket price?`, es: `Un boleto de adulto cuesta x dólares y uno de niño cuesta y dólares. Una familia compra ${n.a} boletos de adulto y ${n.b} de niño por ${n.m} dólares. Otra compra ${n.c} de adulto y ${n.d} de niño por ${n.n} dólares. ¿Cuál es el precio del boleto de adulto?`, steps: [`Represent both purchases with the two equations.`, `Check the ticket values in each equation.`, `The adult ticket costs ${n.x} dollars.`] });
  }
  if (n.x !== undefined && n.a === undefined) {
    const amount = Math.abs(n.b);
    const verb = n.b < 0 ? "is reduced by" : "increases by";
    const verbEs = n.b < 0 ? "disminuye en" : "aumenta en";
    return typed({ ...n, en: `An amount ${verb} ${amount} and becomes ${n.rhs}. What was the amount before the change?`, es: `Una cantidad ${verbEs} ${amount} y queda en ${n.rhs}. ¿Cuál era la cantidad antes del cambio?`, steps: [`Represent the change with an equation.`, `Undo the change to find the starting amount.`, `The starting amount was ${n.x}.`] });
  }
  const change = Math.abs(n.b);
  const action = n.b < 0 ? `removes ${change}` : `adds ${change}`;
  const actionEs = n.b < 0 ? `quita ${change}` : `agrega ${change}`;
  const en = `There are ${n.a} equal bags with x tiles in each. A helper ${action} tiles, and there are ${n.rhs} tiles in all. How many tiles are in each bag?`;
  const es = `Hay ${n.a} bolsas iguales con x fichas en cada una. Una persona ${actionEs} fichas y hay ${n.rhs} fichas en total. ¿Cuántas fichas hay en cada bolsa?`;
  return typed({ ...n, en, es, steps: [`Represent the equal groups and the change with an equation.`, `Undo the change, then divide by the number of groups.`, `There are ${n.x} tiles in each bag.`] });
}
function typed(n) {
  const answer = n.answer;
  const check = n.check || { kind: "expr", expr: n.expr, role: "answer" };
  return {
    q: bi(n.en, n.es), form: "int", answer: Q(answer), bare: n.expr,
    check,
    wrong: [
      { v: Q(answer + 1), why: "made a one-count error" },
      { v: Q(answer - 1), why: "made a one-count error" },
      { v: Q(answer + 2), why: "stopped before undoing both operations" },
    ],
    steps: n.steps,
  };
}
function relationDraft(n, story = false) {
  const answer = n.answer;
  const alternatives = ["<", "=", ">"].filter((value) => value !== answer);
  const en = story ? `A number line shows ${n.a} and ${n.b}. Which comparison is correct?` : n.en;
  const es = story ? `Una recta numérica muestra ${n.a} y ${n.b}. ¿Qué comparación es correcta?` : n.es;
  return { q: bi(en, es), form: "choice", answer, options: alternatives.map((value) => ({ text: value, why: "reversed the order or treated unequal values as equal" })), check: [n.relation], steps: n.steps };
}
function explain(ctx) {
  const n = data(ctx, "compute");
  if (n.relation) return relationDraft(n);
  const answer = n.answer;
  const alternatives = [...new Set([answer + 1, answer - 1, answer + 2].filter((v) => v !== answer))].slice(0, 2);
  return {
    q: bi(`Which value solves this problem? ${n.en}`, `¿Qué valor resuelve este problema? ${n.es}`),
    form: "choice", answer: String(answer), options: alternatives.map((v, i) => ({ text: String(v), why: i ? "stopped before undoing both operations" : "made a one-count error" })),
    check: n.check ? [n.check] : [{ kind: "expr", expr: n.expr, role: "answer" }],
    steps: [`Identify the variable and the relationship in the prompt.`, `Use the equation or expression to check a candidate value.`, `The value is ${answer}.`],
  };
}
export const family = { id: "algebra", skills, types: { compute, "real-world": realWorld, explain }, range: { "real-world": [1, 5], explain: [1, 5] } };
