// Counting and sequence problems across the early-number skill bank.
import { bi, fmt, int, pick } from "./kit.js";
import { array, numberLine, placeValue } from "./models.js";
import { Q } from "./rational.js";

export const SPECS = {
  "0:count-forward": { mode: "sequence", min: 0, max: 19, steps: [1] },
  "0:count-cardinality": { mode: "quantity", max: 10 },
  "0:subitize": { mode: "quantity", max: 6 },
  "0:compose-10": { mode: "target", target: 10 },
  "0:patterns": { mode: "sequence", min: 1, max: 30, steps: [1, 2, 3] },
  "1:count-patterns": { mode: "sequence", min: 0, max: 100, steps: [1, 2, 5, 10] },
  "1:make-10": { mode: "target", target: 10 },
  "2:skip-count": { mode: "sequence", min: 0, max: 500, steps: [2, 5, 10, 25, 50] },
};

const uniqueWrongs = (answer) => [
  { v: Q(answer + 1), why: "counted one too many" },
  { v: Q(answer === 0 ? 2 : answer - 1), why: "counted one too few" },
];
const countExpr = (n) => `count(${Array.from({ length: n }, () => "1").join(",")})`;
const OBJECTS = [
  ["counters", "fichas", "f"],
  ["dots", "puntos", "m"],
  ["buttons", "botones", "m"],
  ["beads", "cuentas", "f"],
  ["blocks", "bloques", "m"],
  ["shells", "conchas", "f"],
  ["seeds", "semillas", "f"],
  ["stars", "estrellas", "f"],
];
const objectFor = (rng) => {
  const [en, es, gender] = pick(rng, OBJECTS);
  return {
    en,
    es,
    howMany: gender === "f" ? "¿Cuántas" : "¿Cuántos",
    pluralAdjective: gender === "f" ? "listas" : "listos",
    hiddenAdjective: gender === "f" ? "escondidas" : "escondidos",
  };
};

function drawSequence(rng, spec, level) {
  const steps = spec.steps;
  const step = steps.length === 1 ? steps[0] : pick(rng, steps.slice(0, Math.min(steps.length, level + 1)));
  const maxStart = Math.max(spec.min, spec.max - step * 4);
  const start = int(rng, spec.min, maxStart);
  return { start, step, next: start + step, afterThree: start + step * 3 };
}

function compute({ rng, level, spec }) {
  if (spec.mode === "target") {
    const start = int(rng, 1, spec.target - 1);
    const missing = spec.target - start;
    return {
      q: bi(`How many more counters make ${spec.target}? Start with ${start}.`, `¿Cuántas fichas faltan para llegar a ${spec.target}? Empieza con ${start}.`),
      form: "int",
      answer: Q(missing),
      check: [{ kind: "expr", expr: `${spec.target}-${start}`, role: "answer" }],
      wrong: uniqueWrongs(missing),
      steps: [`The counters need to make ${spec.target} altogether.`, `Find the difference between ${spec.target} and ${start}.`, `${spec.target} − ${start} = ${missing}.`],
    };
  }
  if (spec.mode === "quantity") {
    const n = int(rng, 1, spec.max);
    const object = objectFor(rng);
    return {
      q: bi(`How many ${object.en} are shown?`, `${object.howMany} ${object.es} se muestran?`),
      form: "int",
      answer: Q(n),
      check: [{ kind: "expr", expr: countExpr(n), role: "answer" }],
      wrong: uniqueWrongs(n),
      steps: [`Look at each ${object.en} once.`, "Keep a count as you move from one to the next.", `There are ${n} ${object.en}.`],
    };
  }
  const { start, step, afterThree } = drawSequence(rng, spec, level);
  return {
    q: bi(`What number comes next: ${fmt(start)}, ${fmt(start + step)}, ${fmt(start + 2 * step)}, ___?`, `¿Qué número sigue: ${fmt(start)}, ${fmt(start + step)}, ${fmt(start + 2 * step)}, ___?`),
    form: "int",
    answer: Q(afterThree),
    check: [{ kind: "expr", expr: `${start}+${step}*3`, role: "answer" }],
    wrong: uniqueWrongs(afterThree),
    steps: [`Compare the first two numbers: ${fmt(start + step)} is ${step} more than ${fmt(start)}.`, `The same amount is added each time.`, `${fmt(start)} + ${step} × 3 = ${fmt(afterThree)}.`],
  };
}

function missingNumber({ rng, level, spec }) {
  if (spec.mode === "target") {
    const start = int(rng, 1, spec.target - 1);
    const missing = spec.target - start;
    return {
      q: bi(`${start} + ___ = ${spec.target}. What number is missing?`, `${start} + ___ = ${spec.target}. ¿Qué número falta?`),
      form: "int",
      answer: Q(missing),
      check: [{ kind: "expr", expr: `${spec.target}-${start}`, role: "answer" }],
      wrong: uniqueWrongs(missing),
      steps: [`The two parts must make ${spec.target}.`, `Take ${start} away from ${spec.target}.`, `${spec.target} − ${start} = ${missing}.`],
    };
  }
  if (spec.mode === "quantity") {
    const total = int(rng, 2, spec.max);
    const shown = int(rng, 1, total - 1);
    const missing = total - shown;
    const object = objectFor(rng);
    return {
      q: bi(`There are ${fmt(total)} ${object.en} in all. ${fmt(shown)} are easy to see. How many are hidden?`, `Hay ${fmt(total)} ${object.es} en total. Se ven ${fmt(shown)}. ${object.howMany} están ${object.hiddenAdjective}?`),
      form: "int",
      answer: Q(missing),
      check: [{ kind: "expr", expr: `${total}-${shown}`, role: "answer" }],
      wrong: uniqueWrongs(missing),
      steps: [`The visible and hidden groups make ${total} together.`, `Take the ${shown} visible ${object.en} away from the total.`, `${total} − ${shown} = ${missing}.`],
    };
  }
  const { start, step, next } = drawSequence(rng, spec, level);
  return {
    q: bi(`${fmt(start)} + ___ = ${fmt(next)}. What number is missing?`, `${fmt(start)} + ___ = ${fmt(next)}. ¿Qué número falta?`),
    form: "int",
    answer: Q(step),
    check: [{ kind: "expr", expr: `${next}-${start}`, role: "answer" }],
    wrong: uniqueWrongs(step),
    steps: [`The blank is the amount added to ${start}.`, `Find the difference between ${next} and ${start}.`, `${next} − ${start} = ${step}.`],
  };
}

function visualModel({ rng, level, spec }) {
  if (spec.mode === "target") {
    const start = int(rng, 1, spec.target - 1);
    const missing = spec.target - start;
    return {
      q: bi(`A ten-frame has ${start} filled spaces. How many spaces are empty?`, `Un marco de diez tiene ${start} espacios llenos. ¿Cuántos espacios están vacíos?`),
      form: "int",
      answer: Q(missing),
      check: [{ kind: "expr", expr: `${spec.target}-${start}`, role: "answer" }],
      wrong: uniqueWrongs(missing),
      steps: [`A ten-frame has ${spec.target} spaces in all.`, `The filled and empty spaces together make ${spec.target}.`, `${spec.target} − ${start} = ${missing} empty spaces.`],
      model: placeValue([{ unit: Q(1), count: spec.target }], "Ten spaces; subtract the filled spaces", Q(start)),
    };
  }
  if (spec.mode === "quantity") {
    const n = int(rng, 1, spec.max);
    const object = objectFor(rng);
    return {
      q: bi(`The array shows a group of ${object.en}. How many are there?`, `El arreglo muestra un grupo de ${object.es}. ${object.howMany} hay?`),
      form: "int",
      answer: Q(n),
      check: [{ kind: "expr", expr: countExpr(n), role: "answer" }],
      wrong: uniqueWrongs(n),
      steps: [`Count the ${object.en} in the row.`, "Check that each space has one object.", `The group has ${n} ${object.en}.`],
      model: array(1, n, "One object in each space"),
    };
  }
  const { start, step, next } = drawSequence(rng, spec, level);
  return {
    q: bi(`The number line starts at ${fmt(start)} and jumps ${step} to the right. Where does the jump land?`, `La recta numérica empieza en ${fmt(start)} y salta ${step} hacia la derecha. ¿Dónde termina el salto?`),
    form: "int",
    answer: Q(next),
    check: [{ kind: "expr", expr: `${start}+${step}`, role: "answer" }],
    wrong: uniqueWrongs(next),
    steps: [`Find the starting point, ${fmt(start)}.`, `A jump to the right adds ${step}.`, `${fmt(start)} + ${step} = ${fmt(next)}.`],
    model: numberLine(Q(0), Q(Math.max(spec.max, next)), Q(step), [{ value: Q(start), label: "start" }], "Counting forward", [{ from: Q(start), by: Q(step) }]),
  };
}

function realWorld({ rng, level, spec }) {
  if (spec.mode === "target") {
    const start = int(rng, 1, spec.target - 1);
    const missing = spec.target - start;
    return {
      q: bi(`A packet has ${spec.target} seeds. A gardener plants ${start}. How many seeds remain?`, `Un paquete tiene ${spec.target} semillas. Una jardinera planta ${start}. ¿Cuántas semillas quedan?`),
      form: "int",
      answer: Q(missing),
      check: [{ kind: "expr", expr: `${spec.target}-${start}`, role: "answer" }],
      wrong: uniqueWrongs(missing),
      steps: [`The packet starts with ${spec.target} seeds.`, `Take away the ${start} seeds that were planted.`, `${spec.target} − ${start} = ${missing} seeds remain.`],
    };
  }
  if (spec.mode === "quantity") {
    const n = int(rng, 1, spec.max);
    const object = objectFor(rng);
    return {
      q: bi(`A class puts ${n} ${object.en} on a table. How many are ready?`, `Una clase pone ${n} ${object.es} en una mesa. ${object.howMany} están ${object.pluralAdjective}?`),
      form: "int",
      answer: Q(n),
      check: [{ kind: "expr", expr: countExpr(n), role: "answer" }],
      wrong: uniqueWrongs(n),
      steps: [`Count each ${object.en.slice(0, -1)} one time.`, `The last number in the count gives the total.`, `There are ${n} ${object.en}.`],
      model: array(1, n, "One object in each space"),
    };
  }
  const { start, step, next } = drawSequence(rng, spec, level);
  return {
    q: bi(`A reading tracker shows ${fmt(start)} pages, then ${step} more pages are read. What total does it show now?`, `Un registro de lectura muestra ${fmt(start)} páginas. Se leen ${step} páginas más. ¿Qué total muestra ahora?`),
    form: "int",
    answer: Q(next),
    check: [{ kind: "expr", expr: `${start}+${step}`, role: "answer" }],
    wrong: uniqueWrongs(next),
    steps: [`Start with ${start} pages.`, `Add the ${step} new pages.`, `${start} + ${step} = ${next} pages.`],
  };
}

export const family = {
  id: "counting",
  skills: SPECS,
  types: { compute, "missing-number": missingNumber, "visual-model": visualModel, "real-world": realWorld },
  range: { "visual-model": [1, 4], "real-world": [2, 5] },
};
