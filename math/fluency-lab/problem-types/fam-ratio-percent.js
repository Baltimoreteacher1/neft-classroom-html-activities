// Ratios, rates, proportions and percent. Calculations use exact rational values.
import { bi, int, pick } from "./kit.js";
import { Q, add, sub, mul, div, decText, gcd, qs } from "./rational.js";

const SPECS = {
  "6:ratios": { mode: "ratio", maxPart: 12 },
  "6:unit-rates": { mode: "unit-rate", maxCount: 12, maxRate: 25 },
  "6:percent": { mode: "percent", maxPart: 100 },
  "7:proportions": { mode: "proportion" },
  "7:unit-rate": { mode: "unit-rate", maxCount: 15, maxRate: 99 },
  "7:percent-change": { mode: "percent-change" },
};
const fmt = (q) => decText(q) ?? qs(q);
const opAscii = { "+": "+", "−": "-", "×": "*", "÷": "/" };
const compute = (a, op, b) => (op === "+" ? add(a, b) : op === "−" ? sub(a, b) : op === "×" ? mul(a, b) : div(a, b));
const wrongs = (answer, a, b) => {
  const candidates = [
    { v: add(answer, Q(1, answer.d)), why: "changed the result by one unit" },
    { v: sub(answer, Q(1, answer.d)), why: "changed the result by one unit in the other direction" },
    { v: compute(a, "−", b), why: "subtracted the parts instead of using the requested operation" },
  ];
  const seen = new Set([fmt(answer)]);
  return candidates.filter((w) => {
    const key = fmt(w.v);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const fact = (rng, max = 12) => int(rng, 2, max);

function ratioItem({ rng, level, spec }) {
  let a = fact(rng, Math.min(spec.maxPart, level + 8));
  let b = fact(rng, Math.min(spec.maxPart, level + 8));
  let g = gcd(a, b);
  if (g === 1) {
    a *= 2;
    b *= 2;
    g = 2;
  }
  const ratio = [a / g, b / g];
  const answer = `${ratio[0]}:${ratio[1]}`;
  const key = qs(Q(a, b));
  return {
    q: bi(`Write ${a}:${b} as a ratio in simplest form.`, `Escribe ${a}:${b} como una razón en su forma más simple.`),
    form: "ratio",
    answer: ratio,
    simplest: true,
    check: [{ kind: "expr", expr: `${a}/${b}`, role: "answer", map: { [key]: answer } }],
    wrong: [
      { v: [a, b], why: "kept the equivalent ratio without reducing both parts" },
      { v: [ratio[1], ratio[0]], why: "reversed the order of the compared parts" },
      { v: [ratio[0] + 1, ratio[1]], why: "changed only one part" },
    ],
    steps: ["The two parts must keep the same multiplicative relationship.", "Divide both parts by their greatest common factor.", `The simplest ratio is ${answer}.`],
  };
}

function percentItem({ rng, level }) {
  const percent = pick(rng, [10, 20, 25, 30, 40, 50, 60, 75, 80]);
  const whole = int(rng, 2, 10 + level * 5) * 4;
  const answer = Q(percent * whole, 100);
  const ex = `${percent}*${whole}/100`;
  return {
    q: bi(`Find ${percent}% of ${whole}.`, `Encuentra el ${percent}% de ${whole}.`),
    form: "decimal",
    answer,
    check: [{ kind: "expr", expr: ex, role: "answer" }],
    wrong: wrongs(answer, Q(percent), Q(whole)),
    steps: ["A percent is a rate out of one hundred.", "Multiply the whole by the rate and divide by one hundred.", `${percent}% of ${whole} is ${fmt(answer)}.`],
  };
}

function rateItem({ rng, level, spec }) {
  const count = int(rng, 2, Math.min(spec.maxCount || 15, level * 3 + 4));
  const unit = int(rng, 2, Math.min(spec.maxRate || 99, level * 18 + 20));
  const total = count * unit;
  const answer = Q(total, count);
  const ex = `${total}/${count}`;
  return {
    q: bi(`${total} dollars for ${count} items: what is the unit rate?`, `${total} dólares por ${count} artículos: ¿cuál es la tarifa unitaria?`),
    form: "int",
    answer,
    unit: "dollars per item",
    check: [{ kind: "expr", expr: ex, role: "answer" }],
    wrong: wrongs(answer, Q(total), Q(count)),
    steps: ["A unit rate compares a quantity with one unit.", "Divide the total amount by the number of equal groups.", `The unit rate is ${unit} dollars per item.`],
  };
}

function percentChange({ rng, level }) {
  const start = int(rng, 2, 5 + level * 5) * 10;
  const rate = pick(rng, [10, 20, 25, 50, 100]);
  const rise = rng() < 0.5;
  const change = start * rate / 100;
  const end = rise ? start + change : start - change;
  const answer = Q(rate);
  const ex = rise ? `(${end}-${start})/${start}*100` : `(${start}-${end})/${start}*100`;
  return {
    q: bi(`A value changes from ${start} to ${end}. What is the percent ${rise ? "increase" : "decrease"}?`, `Un valor cambia de ${start} a ${end}. ¿Cuál es el porcentaje de ${rise ? "aumento" : "disminución"}?`),
    form: "percent",
    answer,
    check: [{ kind: "expr", expr: ex, role: "answer", map: { [String(rate)]: `${rate}` } }],
    wrong: [{ v: Q(rate + 1), why: "changed the percent by one point" }, { v: Q(Math.max(0, rate - 1)), why: "changed the percent by one point in the other direction" }],
    steps: ["Find the amount of change from the starting value.", "Compare that change with the starting value, then express the rate per hundred.", `The percent change is ${rate}%.`],
  };
}

function proportion({ rng, level }) {
  const a = int(rng, 2, 5 + level * 3);
  const b = int(rng, 2, 8 + level * 4);
  const factor = int(rng, 2, 3 + level);
  const c = a * factor;
  const answer = b * factor;
  return {
    q: bi(`Solve the proportion: ${a}/${b} = ${c}/x.`, `Resuelve la proporción: ${a}/${b} = ${c}/x.`),
    form: "int",
    answer: Q(answer),
    check: [{ kind: "solve", var: "x", lhs: `${a}*x`, rhs: String(b * c), role: "answer" }],
    wrong: [{ v: Q(answer + 1), why: "changed the missing term by one" }, { v: Q(Math.max(1, answer - 1)), why: "changed the missing term by one in the other direction" }, { v: Q(c + b), why: "added corresponding terms instead of using a scale factor" }],
    steps: ["Equivalent ratios use the same scale factor in both parts.", "Find the factor that changes the first numerator into the second.", `Apply that factor to ${b}; the missing term is ${answer}.`],
  };
}

function computeItem(ctx) {
  const mode = SPECS[`${ctx.skill.grade}:${ctx.skill.id}`].mode;
  if (mode === "ratio") return ratioItem(ctx);
  if (mode === "unit-rate") return rateItem(ctx);
  if (mode === "percent") return percentItem(ctx);
  if (mode === "percent-change") return percentChange(ctx);
  if (mode === "proportion") return proportion(ctx);
  throw new Error(`Unknown ratio mode: ${mode}`);
}

function missingNumber(ctx) {
  const mode = SPECS[`${ctx.skill.grade}:${ctx.skill.id}`].mode;
  if (mode === "proportion") return proportion(ctx);
  if (mode === "ratio") return ratioItem(ctx);
  const whole = int(ctx.rng, 2, 8 + ctx.level * 5) * 10;
  const pct = pick(ctx.rng, [10, 20, 25, 50]);
  const part = whole * pct / 100;
  return {
    q: bi(`${pct}% of ${whole} is x. Find x.`, `El ${pct}% de ${whole} es x. Encuentra x.`),
    form: "int",
    answer: Q(part),
    check: [{ kind: "solve", var: "x", lhs: `${pct}*${whole}/100`, rhs: "x", role: "answer" }],
    wrong: [{ v: Q(part + 1), why: "changed the part by one" }, { v: Q(Math.max(0, part - 1)), why: "changed the part by one in the other direction" }],
    steps: ["Write the percent as a rate out of one hundred.", "Multiply by the whole amount.", `The missing part is ${part}.`],
  };
}

function contextItem(ctx, type) {
  const mode = SPECS[`${ctx.skill.grade}:${ctx.skill.id}`].mode;
  if (mode === "unit-rate") return rateItem(ctx);
  if (mode === "percent" || mode === "percent-change") return percentItem(ctx);
  if (mode === "proportion") return proportion(ctx);
  return ratioItem(ctx);
}

function explain({ rng, level }) {
  const a = int(rng, 2, level + 6);
  const b = int(rng, 3, level + 9);
  const c = a * b;
  return {
    q: bi(`Which statement explains why ${a}/${b} and ${c}/${b * 2} are equivalent ratios?`, `¿Qué afirmación explica por qué ${a}/${b} y ${c}/${b * 2} son razones equivalentes?`),
    form: "choice",
    answer: "Both parts are multiplied by the same factor.",
    answerEs: "Ambas partes se multiplican por el mismo factor.",
    options: [
      { text: "Only the first part changes, so the ratio becomes larger.", es: "Solo cambia la primera parte, así que la razón aumenta.", why: "does not preserve the relationship between the parts" },
      { text: "The two denominators are added to make equivalent ratios.", es: "Se suman los dos denominadores para formar razones equivalentes.", why: "adds terms instead of scaling both parts" },
    ],
    check: [{ kind: "expr", expr: `${a}/${b}`, value: fmt(Q(a, b)) }],
    steps: ["Equivalent ratios preserve the relationship between their parts.", "Multiply or divide both parts by the same nonzero number.", "That keeps the quotient of the two parts unchanged."],
  };
}

export const family = {
  id: "ratio-percent",
  skills: SPECS,
  types: {
    compute: computeItem,
    "missing-number": missingNumber,
    "real-world": (ctx) => contextItem(ctx, "real-world"),
    "word-problem": (ctx) => contextItem(ctx, "word-problem"),
    "multi-step": computeItem,
    equation: missingNumber,
    explain,
  },
};
