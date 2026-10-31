import { bi, fmt, int, pick } from "./kit.js";
import { Q } from "./rational.js";

const SPECS = {
  "1:time": { kind: "later-time" },
  "1:measure-length": { kind: "length" },
  "3:elapsed-time": { kind: "elapsed" },
  "4:unit-conversion": { kind: "conversion" },
};

const clockText = (minutes) => {
  const day = ((minutes % 720) + 720) % 720;
  return `${Math.floor(day / 60) || 12}:${String(day % 60).padStart(2, "0")}`;
};
const wrongInts = (answer) =>
  [answer + 1, Math.max(0, answer - 1), answer + 2, answer + 10]
    .filter((value, index, all) => value !== answer && all.indexOf(value) === index)
    .slice(0, 3)
    .map((value, index) => ({ v: Q(value), why: ["counted one unit too many", "counted one unit too few", "used the wrong unit factor"][index] }));
const clockWrong = (answer) =>
  [-30, 30, -60].map((delta, index) => ({ v: clockText(answer + delta), why: ["subtracted instead of adding the time", "added one extra interval", "changed the hour by mistake"][index] }));

function draw(ctx) {
  const { rng, level, spec } = ctx;
  if (spec.kind === "later-time") {
    const start = int(rng, 6 * 60, 10 * 60) + pick(rng, [0, 15, 30, 45]);
    const elapsed = pick(rng, level <= 2 ? [15, 30] : [15, 30, 45, 60]);
    const answer = start + elapsed;
    return {
      form: "clock",
      answer,
      q: bi(`The time is ${clockText(start)}. What time is ${elapsed} minutes later?`, `Son las ${clockText(start)}. ¿Qué hora será ${elapsed} minutos después?`),
      check: { kind: "clock", expr: `${start}+${elapsed}`, role: "answer" },
      wrong: clockWrong(answer),
      steps: ["Read the starting time on the clock.", "Move forward by the stated number of minutes.", `The later time is ${clockText(answer)}.`],
      hint: "Move forward from the starting time, keeping track of the minutes.",
      explanation: `The later time is ${clockText(answer)}.`,
    };
  }

  if (spec.kind === "length") {
    const unitLength = pick(rng, [1, 2, 5]);
    const count = int(rng, level, level + 7);
    const total = unitLength * count;
    return {
      form: "int",
      answer: Q(count),
      unit: "equal units",
      units: ["equal units", "units"],
      q: bi(`A ${total} cm strip is measured with equal units that are ${unitLength} cm long. How many units fit?`, `Una tira de ${total} cm se mide con unidades iguales de ${unitLength} cm. ¿Cuántas unidades caben?`),
      bare: `${total}/${unitLength}`,
      check: { kind: "expr", expr: `${total}/${unitLength}`, role: "answer" },
      wrong: wrongInts(count),
      steps: ["Identify the total length and the length of one equal unit.", "Divide the total length into groups of that unit size.", `${total} ÷ ${unitLength} = ${count} units.`],
      hint: "Count how many equal unit lengths fit into the whole strip.",
      explanation: `${total} divided by ${unitLength} is ${count}.`,
    };
  }

  if (spec.kind === "elapsed") {
    const startHour = int(rng, 8, 11);
    const startMinute = pick(rng, [0, 10, 15, 20, 30, 40, 45, 50]);
    const start = startHour * 60 + startMinute;
    const elapsed = pick(rng, [10, 15, 20, 25, 30, 35, 40, 45, 50, 60]);
    const end = start + elapsed;
    return {
      form: "int",
      answer: Q(elapsed),
      unit: "minutes",
      units: ["minutes", "minute", "min"],
      q: bi(`A class begins at ${clockText(start)} and ends at ${clockText(end)}. How many minutes does it last?`, `Una clase empieza a las ${clockText(start)} y termina a las ${clockText(end)}. ¿Cuántos minutos dura?`),
      bare: `${end}-${start}`,
      check: { kind: "expr", expr: `${end}-${start}`, role: "answer" },
      wrong: wrongInts(elapsed),
      steps: ["Locate the start and end times.", "Count the minutes from the start time to the end time.", `${clockText(end)} − ${clockText(start)} = ${elapsed} minutes.`],
      hint: "Find the difference between the ending time and starting time.",
      explanation: `The class lasts ${elapsed} minutes.`,
    };
  }

  const conversions = [
    ["meters", "meter", "centimeters", "centimeter", "metros", "metro", "centímetros", "centímetro", 100],
    ["kilograms", "kilogram", "grams", "gram", "kilogramos", "kilogramo", "gramos", "gramo", 1000],
    ["liters", "liter", "milliliters", "milliliter", "litros", "litro", "mililitros", "mililitro", 1000],
    ["hours", "hour", "minutes", "minute", "horas", "hora", "minutos", "minuto", 60],
  ];
  const [fromPlural, fromSingular, toPlural, toSingular, fromEsPlural, fromEsSingular, toEsPlural, toEsSingular, factor] = pick(rng, conversions);
  const amount = int(rng, 1, level < 3 ? 5 : 12);
  const answer = amount * factor;
  const from = amount === 1 ? fromSingular : fromPlural;
  const fromEs = amount === 1 ? fromEsSingular : fromEsPlural;
  const to = amount === 1 ? toSingular : toPlural;
  const toEs = amount === 1 ? toEsSingular : toEsPlural;
  return {
    form: "int",
    answer: Q(answer),
    unit: to,
    units: [to, to.slice(0, -1)],
    q: bi(`Convert ${amount} ${from} to ${to}.`, `Convierte ${amount} ${fromEs} a ${toEs}.`),
    bare: `${amount}*${factor}`,
    check: { kind: "expr", expr: `${amount}*${factor}`, role: "answer" },
    wrong: wrongInts(answer),
    steps: ["Identify how many smaller units make one larger unit.", "Multiply the given amount by that conversion factor.", `${amount} × ${factor} = ${fmt(answer)} ${to}.`],
    hint: "Use the conversion factor to change from the larger unit to the smaller unit.",
    explanation: `${amount} × ${factor} = ${fmt(answer)} ${to}.`,
  };
}

const build = (ctx) => draw(ctx);
const contextual = (ctx) => draw(ctx);
const explain = (ctx) => draw(ctx);

export const family = {
  id: "measure",
  skills: SPECS,
  types: {
    compute: build,
    "real-world": contextual,
    "word-problem": contextual,
    explain,
  },
  range: {},
  supports: {},
};
