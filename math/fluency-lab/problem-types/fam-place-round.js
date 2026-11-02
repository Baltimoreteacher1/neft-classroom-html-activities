// Place value and rounding. Each prompt keeps the number domain of its grade-level skill.
import { bi, fmt, int, pick } from "./kit.js";
import { numberLine, placeValue } from "./models.js";
import { Q } from "./rational.js";

export const SPECS = {
  "1:tens-ones": { mode: "place", min: 10, max: 99, units: [1, 10] },
  "2:place-1000": { mode: "place", min: 100, max: 999, units: [1, 10, 100] },
  "4:place-million": { mode: "place", min: 10000, max: 999999, units: [1, 10, 100, 1000, 10000, 100000] },
  "3:round": { mode: "round", min: 20, max: 999, units: [10, 100] },
  "4:round-large": { mode: "round", min: 1000, max: 99999, units: [10, 100, 1000, 10000] },
};

const PLACES = {
  1: ["ones", "unidades"],
  10: ["tens", "decenas"],
  100: ["hundreds", "centenas"],
  1000: ["thousands", "millares"],
  10000: ["ten-thousands", "decenas de millar"],
  100000: ["hundred-thousands", "centenas de millar"],
};
const uniqueWrongs = (answer) => [
  { v: Q(answer + 1), why: "changed the value by one" },
  { v: Q(answer === 0 ? 2 : answer - 1), why: "changed the value by one in the other direction" },
];
const rounded = (n, unit) => Math.floor(n / unit + 0.5) * unit;
const digitAt = (n, unit) => Math.floor(n / unit) % 10;

function number(spec, rng, level) {
  const min = Math.max(spec.min, Math.ceil(spec.min / (level < 3 ? 10 : 1)) * (level < 3 ? 10 : 1));
  return int(rng, min, spec.max);
}
function placeData({ rng, level, spec }) {
  const n = number(spec, rng, level);
  const unit = pick(rng, spec.units);
  return { n, unit, digit: digitAt(n, unit), place: PLACES[unit] };
}
function roundingData({ rng, level, spec }) {
  const n = number(spec, rng, level);
  const unit = pick(rng, spec.units.slice(0, level < 3 ? 2 : spec.units.length));
  const answer = rounded(n, unit);
  return { n, unit, answer, place: PLACES[unit] };
}
function columns(n) {
  return String(n)
    .split("")
    .reverse()
    .map((d, i) => ({ unit: Q(10 ** i), count: Number(d) }));
}
function lineFor(n, unit) {
  const low = Math.floor(n / unit) * unit;
  return numberLine(Q(low), Q(low + unit), Q(unit / 10), [{ value: Q(n), label: "given number" }], "Number between two multiples");
}

function compute(ctx) {
  const { spec } = ctx;
  if (spec.mode === "round") {
    const { n, unit, answer, place } = roundingData(ctx);
    return {
      q: bi(`Round ${fmt(n)} to the nearest ${place[0]}.`, `Redondea ${fmt(n)} a la ${place[1]} más cercana.`),
      form: "int",
      answer: Q(answer),
      check: [{ kind: "expr", expr: `round(${n},${unit})`, role: "answer" }],
      wrong: uniqueWrongs(answer),
      steps: [`Find the two nearest multiples of ${unit} around ${fmt(n)}.`, `Check whether ${fmt(n)} is closer to the lower or upper multiple.`, `${fmt(n)} rounds to ${fmt(answer)}.`],
    };
  }
  const { n, unit, digit, place } = placeData(ctx);
  return {
    q: bi(`In ${fmt(n)}, what digit is in the ${place[0]} place?`, `En ${fmt(n)}, ¿qué dígito está en las ${place[1]}?`),
    form: "int",
    answer: Q(digit),
    check: [{ kind: "expr", expr: `digit(${n},${unit})`, role: "answer" }],
    wrong: uniqueWrongs(digit),
    steps: [`Find the ${place[0]} position in ${fmt(n)}.`, `Read the single digit in that place.`, `The ${place[0]} digit is ${digit}.`],
  };
}

function missingNumber(ctx) {
  const { spec } = ctx;
  if (spec.mode === "round") {
    const { n, unit, answer, place } = roundingData(ctx);
    const distance = Math.abs(n - answer);
    return {
      q: bi(`After ${fmt(n)} is rounded to the nearest ${place[0]}, how far is it from the original number?`, `Después de redondear ${fmt(n)} a la ${place[1]} más cercana, ¿a qué distancia queda del número original?`),
      form: "int",
      answer: Q(distance),
      check: [{ kind: "expr", expr: `abs(${n}-round(${n},${unit}))`, role: "answer" }],
      wrong: uniqueWrongs(distance),
      steps: [`First find the nearest multiple of ${unit}.`, `Compare the rounded value with ${fmt(n)}.`, `The distance is ${distance}.`],
    };
  }
  const { n, unit, digit, place } = placeData(ctx);
  const part = digit * unit;
  const rest = n - part;
  return {
    q: bi(`Complete the expanded form: ${fmt(n)} = ${fmt(rest)} + ___.`, `Completa la forma desarrollada: ${fmt(n)} = ${fmt(rest)} + ___.`),
    form: "int",
    answer: Q(part),
    check: [{ kind: "expr", expr: `digit(${n},${unit})*${unit}`, role: "answer" }],
    wrong: uniqueWrongs(part),
    steps: [`The blank is the part in the ${place[0]} place.`, `Find the ${place[0]} digit and multiply it by ${unit}.`, `${digit} × ${unit} = ${fmt(part)}.`],
  };
}

function visualModel(ctx) {
  const { spec } = ctx;
  if (spec.mode === "round") {
    const { n, unit, answer, place } = roundingData(ctx);
    return {
      q: bi(`Use the number line to round ${fmt(n)} to the nearest ${place[0]}.`, `Usa la recta numérica para redondear ${fmt(n)} a la ${place[1]} más cercana.`),
      form: "int",
      answer: Q(answer),
      check: [{ kind: "expr", expr: `round(${n},${unit})`, role: "answer" }],
      wrong: uniqueWrongs(answer),
      steps: [`Locate ${fmt(n)} between two multiples of ${unit}.`, `Compare the distance to each multiple.`, `${fmt(n)} rounds to ${fmt(answer)}.`],
      model: lineFor(n, unit),
    };
  }
  const { n, unit, digit, place } = placeData(ctx);
  return {
    q: bi(`The blocks represent ${fmt(n)}. What digit is in the ${place[0]} place?`, `Los bloques representan ${fmt(n)}. ¿Qué dígito está en las ${place[1]}?`),
    form: "int",
    answer: Q(digit),
    check: [{ kind: "expr", expr: `digit(${n},${unit})`, role: "answer" }],
    wrong: uniqueWrongs(digit),
    steps: [`Find the column for the ${place[0]} place.`, `Read the digit in that column.`, `The ${place[0]} digit is ${digit}.`],
    model: placeValue(columns(n), "Place-value blocks"),
  };
}

function realWorld(ctx) {
  const { spec, rng } = ctx;
  if (spec.mode === "round") {
    const { n, unit, answer, place } = roundingData(ctx);
    return {
      q: bi(`A trail is ${fmt(n)} meters long. Estimate its length to the nearest ${place[0]}.`, `Un sendero mide ${fmt(n)} metros. Estima su longitud a las ${place[1]} más cercanas.`),
      form: "int",
      answer: Q(answer),
      check: [{ kind: "expr", expr: `round(${n},${unit})`, role: "answer" }],
      wrong: uniqueWrongs(answer),
      steps: [`Use a multiple of ${unit} meters to make an estimate.`, `Find which multiple is closer to ${fmt(n)}.`, `The estimate is ${fmt(answer)} meters.`],
    };
  }
  const { n, unit, digit, place } = placeData(ctx);
  const subject = pick(rng, [
    ["tickets sold", "boletos vendidos"],
    ["books in a library", "libros en una biblioteca"],
    ["visitors this year", "visitantes este año"],
  ]);
  return {
    q: bi(`A museum records ${fmt(n)} ${subject[0]}. What digit is in the ${place[0]} place?`, `Un museo registra ${fmt(n)} ${subject[1]}. ¿Qué dígito está en las ${place[1]}?`),
    form: "int",
    answer: Q(digit),
    check: [{ kind: "expr", expr: `digit(${n},${unit})`, role: "answer" }],
    wrong: uniqueWrongs(digit),
    steps: [`Find the ${place[0]} position in ${fmt(n)}.`, `Read the digit in that place.`, `The ${place[0]} digit is ${digit}.`],
    model: placeValue(columns(n), "Place-value blocks"),
  };
}

export const family = {
  id: "place-round",
  skills: SPECS,
  types: { compute, "missing-number": missingNumber, "visual-model": visualModel, "real-world": realWorld },
  range: { "visual-model": [1, 4], "real-world": [2, 5] },
};
