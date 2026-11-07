// Practice problems answered by building, not typing (graded by response-check.js, drawn by response-widgets.js).
// Each maker returns a normal practice item plus `response`; RESPONSE_SKILLS says which skills mix them in. Only the
// practice screen asks for them (generateProblem(skill, rng, { interactive: true })): games, the trail, the Studio
// and printouts keep drawing typed problems, because their screens have no place to build an answer.
// Every stem carries its Spanish (`questionEs`) with the same numbers, and steps never state the answer before the last.
import { STRAND_SKILLS } from "./strand-skills.js";
import { dotCounts, fiveNumber, inequalityText, pointText, tickText } from "./response-check.js";

const randInt = (min, max, rng) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (list, rng) => list[randInt(0, list.length - 1, rng)];
const listText = (values) => values.map((v) => tickText(v)).join(", ");

function item(question, questionEs, answer, displayAnswer, response, { hint, steps, explanation }) {
  return {
    question,
    questionEs,
    answers: [String(answer)],
    displayAnswer,
    hint,
    explanation: explanation || `The answer is ${displayAnswer}.`,
    kind: "response",
    choices: null,
    unit: "",
    model: null,
    steps,
    response,
  };
}

// A small data set for a dot plot or box plot: whole numbers on a short scale, with a repeat so a column stacks.
export function dataSet(
  rng,
  { size = randInt(7, 11, rng), low = randInt(0, 4, rng), spread = randInt(6, 9, rng) } = {},
) {
  const values = Array.from({ length: size }, () => low + randInt(0, spread, rng));
  if (new Set(values).size === values.length) values[1] = values[0];
  return values.sort((a, b) => a - b);
}

export const MAKERS = {
  tenFrame(rng, { frames = 1 } = {}) {
    const n = frames === 2 ? randInt(11, 20, rng) : randInt(2, 10, rng);
    return item(
      `Show ${n} on the ten-frame${frames === 2 ? "s" : ""}.`,
      `Muestra ${n} en ${frames === 2 ? "los marcos de diez" : "el marco de diez"}.`,
      n,
      String(n),
      { type: "tenFrame", frames, target: n },
      {
        hint: "Fill the boxes in order, one counter in each box. Count as you tap.",
        steps: [
          "Fill the top row first, left to right.",
          frames === 2
            ? "A full frame is 10. Fill the first frame, then keep going in the second."
            : "A full row is 5. Keep counting into the next row.",
          `Stop when you have ${n} counters.`,
        ],
      },
    );
  },

  baseTen(rng, { hundreds = false } = {}) {
    const n = hundreds ? randInt(101, 999, rng) : randInt(11, 99, rng);
    const [h, t, o] = [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10];
    return item(
      `Build ${n} with base-ten blocks.`,
      `Forma ${n} con bloques de base diez.`,
      `${h},${t},${o}`,
      hundreds ? `${h} hundreds, ${t} tens, ${o} ones` : `${t} tens, ${o} ones`,
      {
        type: "baseTen",
        places: hundreds ? ["hundreds", "tens", "ones"] : ["tens", "ones"],
        target: n,
      },
      {
        hint: "Read each digit. The digit tells how many blocks of that size.",
        steps: [
          hundreds
            ? "A flat is 100, a rod is 10 and a small cube is 1."
            : "A rod is 10 and a small cube is 1.",
          "Read the number one digit at a time, from left to right.",
          `${n} is ${hundreds ? `${h} hundreds, ` : ""}${t} tens and ${o} ones.`,
        ],
      },
    );
  },

  fractionShade(rng) {
    const d = pick([2, 3, 4, 5, 6], rng);
    const n = randInt(1, d - 1, rng);
    const k = pick([2, 3], rng);
    const parts = d * k;
    return item(
      `The bar has ${parts} equal parts. Shade ${n}/${d} of the bar.`,
      `La barra tiene ${parts} partes iguales. Sombrea ${n}/${d} de la barra.`,
      `${n * k}/${parts}`,
      `${n * k}/${parts}`,
      { type: "fractionShade", parts, target: [n, d] },
      {
        hint: `First find how many small parts make 1/${d} of the bar.`,
        steps: [
          `The bar is cut into ${parts} equal parts.`,
          `${parts} ÷ ${d} = ${k}, so ${k} small parts make 1/${d}.`,
          `${n}/${d} is ${n} groups of ${k}: shade ${n * k} parts.`,
        ],
      },
    );
  },

  numberLineFraction(rng) {
    const d = pick([2, 3, 4, 6, 8], rng);
    const max = pick([1, 2], rng);
    let n = randInt(1, d * max - 1, rng);
    if (n % d === 0) n += 1;
    const value = n / d;
    const text = tickText(value, d);
    return item(
      `Place ${text} on the number line.`,
      `Ubica ${text} en la recta numérica.`,
      text,
      text,
      { type: "numberLine", min: 0, max, den: d, labelEvery: d, target: value },
      {
        hint: `Each whole is cut into ${d} equal parts. Count parts from 0.`,
        steps: [
          `Find 0 and 1. The space between them is cut into ${d} equal parts.`,
          `Each part is 1/${d}.`,
          `Count ${n} parts from 0 to land on ${text}.`,
        ],
      },
    );
  },

  numberLineInteger(rng) {
    let value = randInt(-9, 9, rng);
    if (value === 0) value = -5;
    const text = tickText(value);
    return item(
      `Place ${text} on the number line.`,
      `Ubica ${text} en la recta numérica.`,
      String(value),
      text,
      { type: "numberLine", min: -10, max: 10, den: 1, labelEvery: 2, target: value },
      {
        hint: "Start at 0. Negative numbers are to the left, positive numbers to the right.",
        steps: [
          "Find 0 on the number line.",
          value < 0
            ? "The number is negative, so move left."
            : "The number is positive, so move right.",
          `Move ${Math.abs(value)} units to reach ${text}.`,
        ],
      },
    );
  },

  point(rng, { quadrant1 = false } = {}) {
    const span = quadrant1 ? [0, 10] : [-6, 6];
    let [x, y] = [randInt(span[0], span[1], rng), randInt(span[0], span[1], rng)];
    if (x === y) x = x === span[1] ? x - 1 : x + 1;
    if (!quadrant1 && x === 0) x = 3;
    const text = pointText(x, y);
    const horiz =
      x === 0
        ? "Stay on the y-axis: x is 0."
        : `x is ${tickText(x)}: move ${Math.abs(x)} ${x > 0 ? "right" : "left"}.`;
    const vert =
      y === 0
        ? "Stay on the x-axis: y is 0."
        : `y is ${tickText(y)}: move ${Math.abs(y)} ${y > 0 ? "up" : "down"}.`;
    return item(
      `Plot the point ${text}.`,
      `Ubica el punto ${text}.`,
      text,
      text,
      { type: "point", min: span[0], max: span[1], target: [x, y] },
      {
        hint: "The first number moves left or right. The second number moves up or down.",
        steps: ["Start at the origin, (0, 0).", horiz, vert, `Mark the point ${text}.`],
      },
    );
  },

  inequality(rng) {
    const op = pick(["<", "<=", ">", ">="], rng);
    const value = randInt(-6, 6, rng);
    const text = inequalityText(op, value);
    const words = {
      "<": "less than",
      "<=": "less than or equal to",
      ">": "greater than",
      ">=": "greater than or equal to",
    }[op];
    return item(
      `Graph ${text} on the number line.`,
      `Representa ${text} en la recta numérica.`,
      `${op} ${value}`,
      text,
      { type: "inequality", min: -10, max: 10, target: { op, value } },
      {
        hint: "Find the boundary number first. Then decide if it is included and which way the true numbers go.",
        steps: [
          `The boundary number is ${tickText(value)}.`,
          op.length === 2
            ? `The symbol includes "equal to", so the circle is closed.`
            : "The symbol does not include equal to, so the circle is open.",
          `x is ${words} ${tickText(value)}: shade ${op[0] === "<" ? "left" : "right"}.`,
        ],
      },
    );
  },

  dotPlot(rng) {
    const values = dataSet(rng);
    const min = Math.max(0, values[0] - 1);
    const max = values.at(-1) + 1;
    const counts = dotCounts(values, min, max);
    const top = counts.indexOf(Math.max(...counts));
    return item(
      `Make a dot plot of the data: ${listText(values)}.`,
      `Haz un diagrama de puntos con los datos: ${listText(values)}.`,
      counts.join(","),
      counts.map((n, i) => (n ? `${min + i} → ${n}` : "")).filter(Boolean).join(", "),
      { type: "dotPlot", min, max, target: counts },
      {
        hint: "Put one dot above the number for each data value. Cross values off as you go.",
        steps: [
          `There are ${values.length} data values, so the plot needs ${values.length} dots.`,
          "Go through the list one value at a time and add a dot above its number.",
          `When a value repeats, stack the dots. The tallest column is above ${min + top}.`,
        ],
      },
    );
  },

  boxPlot(rng) {
    const values = dataSet(rng, { size: pick([7, 9, 11], rng) });
    const five = fiveNumber(values);
    const den = five.some((v) => !Number.isInteger(v)) ? 2 : 1;
    const min = Math.max(0, values[0] - 1);
    const max = values.at(-1) + 1;
    return item(
      `Make a box plot of the data: ${listText(values)}.`,
      `Haz un diagrama de caja con los datos: ${listText(values)}.`,
      five.join(","),
      five.map((v) => tickText(v, den)).join(", "),
      { type: "boxPlot", min, max, den, target: five },
      {
        hint: "Find the minimum, the maximum and the median first. Then find the middle of each half.",
        steps: [
          `The data are already in order. The least value and the greatest value are the ends.`,
          `There are ${values.length} values, so the median is value number ${(values.length + 1) / 2}.`,
          "Q1 is the middle of the values below the median; Q3 is the middle of the values above it.",
          `Five-number summary: ${five.map((v) => tickText(v, den)).join(", ")}.`,
        ],
      },
    );
  },
};

// Multi-line work: a signed number written the way the line shows it.
const signed = (n) => (n < 0 ? `− ${-n}` : `+ ${n}`);
const coef = (n) => (n === 1 ? "" : n === -1 ? "−" : String(n).replace("-", "−"));
const minus = (n) => String(n).replace("-", "−");
const workItem = (question, questionEs, mode, start, lines, display, hint, steps) =>
  item(question, questionEs, lines.join("; "), display, { type: "work", mode, start, variable: "x" }, { hint, steps });

Object.assign(MAKERS, {
  equationWork(rng, { form = "two" } = {}) {
    const x = form === "multi" ? randInt(-6, 9, rng) || 4 : randInt(2, 12, rng);
    if (form === "one") {
      const a = randInt(2, 9, rng);
      if (rng() < 0.5) {
        const b = a + x;
        const start = `x + ${a} = ${b}`;
        return workItem(`Solve ${start}. Write one step per line.`, `Resuelve ${start}. Escribe un paso en cada línea.`, "equation", start, [`x = ${x}`], `x = ${x}`, "Undo the addition. Do the same thing to both sides.", [`The equation adds ${a} to x.`, `Subtract ${a} from both sides to undo it.`, `x = ${x}`]);
      }
      const start = `${a}x = ${a * x}`;
      return workItem(`Solve ${start}. Write one step per line.`, `Resuelve ${start}. Escribe un paso en cada línea.`, "equation", start, [`x = ${x}`], `x = ${x}`, "Undo the multiplication. Do the same thing to both sides.", [`The equation multiplies x by ${a}.`, `Divide both sides by ${a} to undo it.`, `x = ${x}`]);
    }
    if (form === "multi") {
      const [a, b, c] = [randInt(2, 6, rng), randInt(-5, 5, rng) || 3, randInt(1, 5, rng)];
      const k = a === c ? a + 1 : a;
      const d = k * (x + b) - c * x;
      const start = `${k}(x ${signed(b)}) = ${coef(c)}x ${signed(d)}`;
      return workItem(`Solve ${start}. Write one step per line.`, `Resuelve ${start}. Escribe un paso en cada línea.`, "equation", start, [`${k}x ${signed(k * b)} = ${coef(c)}x ${signed(d)}`, `${coef(k - c)}x = ${minus(d - k * b)}`, `x = ${minus(x)}`], `x = ${minus(x)}`, "Distribute first. Then get the x-terms on one side and the numbers on the other.", [`Distribute ${k}: ${k}x ${signed(k * b)} = ${coef(c)}x ${signed(d)}.`, `Subtract ${coef(c)}x from both sides, then undo the ${minus(k * b)}.`, `${coef(k - c)}x = ${minus(d - k * b)}`, `x = ${minus(x)}`]);
    }
    const [a, b] = [randInt(2, 9, rng), randInt(1, 15, rng)];
    const sub = rng() < 0.35;
    const c = sub ? a * x - b : a * x + b;
    const start = `${a}x ${sub ? "−" : "+"} ${b} = ${c}`;
    return workItem(`Solve ${start}. Write one step per line.`, `Resuelve ${start}. Escribe un paso en cada línea.`, "equation", start, [`${a}x = ${a * x}`, `x = ${x}`], `x = ${x}`, "Undo the operations in reverse order, doing the same thing to both sides.", [`${sub ? "Add" : "Subtract"} ${b} ${sub ? "to" : "from"} both sides first.`, `Now ${a}x equals ${a * x}. Divide both sides by ${a}.`, `x = ${x}`]);
  },

  expressionWork(rng) {
    const [a, b, c] = [randInt(2, 9, rng), randInt(1, 9, rng), randInt(1, 9, rng)];
    const form = randInt(0, 2, rng);
    if (form === 0) {
      const start = `${a}(x + ${b}) + ${c}x`;
      const done = `${a + c}x + ${a * b}`;
      return workItem(`Write ${start} as an equivalent expression with no parentheses and like terms combined. Write one step per line.`, `Escribe ${start} como una expresión equivalente sin paréntesis y con los términos semejantes combinados. Escribe un paso en cada línea.`, "expression", start, [`${a}x + ${a * b} + ${c}x`, done], done, "Distribute first, then combine the x-terms.", [`Multiply ${a} by each term inside the parentheses.`, "Now there are two x-terms. Add their coefficients.", done]);
    }
    if (form === 1) {
      const start = `${a}(${b}x + ${c}) − ${c}`;
      const done = `${a * b}x + ${a * c - c}`;
      return workItem(`Write ${start} as an equivalent expression with no parentheses and like terms combined. Write one step per line.`, `Escribe ${start} como una expresión equivalente sin paréntesis y con los términos semejantes combinados. Escribe un paso en cada línea.`, "expression", start, [`${a * b}x + ${a * c} − ${c}`, done], done, "Distribute first, then combine the numbers.", [`Multiply ${a} by each term inside the parentheses.`, "Now there are two numbers without x. Combine them.", done]);
    }
    const start = `${a}x + ${b} + ${c}x + ${a}`;
    const done = `${a + c}x + ${a + b}`;
    return workItem(`Combine like terms: ${start}. Write one step per line.`, `Combina los términos semejantes: ${start}. Escribe un paso en cada línea.`, "expression", start, [done], done, "Group the x-terms together and the numbers together.", ["The x-terms are the ones with x. The other terms are numbers.", "Add the coefficients of the x-terms. Add the numbers.", done]);
  },

  orderOpsWork(rng) {
    const [a, b, c] = [randInt(2, 9, rng), randInt(2, 6, rng), randInt(5, 12, rng)];
    const d = randInt(1, c - 1, rng);
    const form = randInt(0, 1, rng);
    const start = form ? `(${a} + ${b}) × ${c} − ${d}` : `${a} + ${b} × (${c} − ${d})`;
    const lines = form ? [`${a + b} × ${c} − ${d}`, `${(a + b) * c} − ${d}`, String((a + b) * c - d)] : [`${a} + ${b} × ${c - d}`, `${a} + ${b * (c - d)}`, String(a + b * (c - d))];
    return workItem(`Simplify ${start}. Write one step per line.`, `Simplifica ${start}. Escribe un paso en cada línea.`, "numeric", start, lines, lines.at(-1), "Parentheses first, then multiplication, then addition and subtraction.", ["Work inside the parentheses first.", "Multiply before you add or subtract.", "Add or subtract from left to right.", `The value is ${lines.at(-1)}.`]);
  },
});

// Which skills mix built answers into practice ("grade:skill" -> makers and their options).
export const RESPONSE_SKILLS = {
  "0:count-cardinality": [["tenFrame", {}]],
  "0:compose-10": [["tenFrame", {}]],
  "1:make-10": [["tenFrame", {}]],
  "1:tens-ones": [["baseTen", {}]],
  "2:place-1000": [["baseTen", { hundreds: true }]],
  "3:fraction-equivalence": [["fractionShade", {}]],
  "4:fraction-equiv": [["fractionShade", {}]],
  "6:integers": [
    ["numberLineInteger", {}],
    ["point", {}],
  ],
  "7:inequalities": [["inequality", {}]],
  "6:data-displays": [["dotPlot", {}], ["boxPlot", {}]],
  "6:write-inequalities": [["inequality", {}]],
  "6:order-rational": [["numberLineInteger", {}], ["numberLineFraction", {}]],
  "6:equivalent-expressions": [["expressionWork", {}]],
  "6:one-step": [["equationWork", { form: "one" }]],
  "6:evaluate": [["orderOpsWork", {}]],
  "7:equations": [["equationWork", { form: "two" }]],
  "8:linear-equations": [["equationWork", { form: "multi" }]],
};
// Strand skills (strand-skills.js) name their own built answers.
for (const d of STRAND_SKILLS) if (d.responses) RESPONSE_SKILLS[`${d.grade}:${d.id}`] = d.responses;
// One practice problem in three is a built answer in a skill that has them.
export const RESPONSE_SHARE = 1 / 3;

export const responseMakersFor = (skill) =>
  RESPONSE_SKILLS[`${skill?.grade}:${skill?.id}`] || skill?.responses || [];

export function makeResponseItem(skill, rng = Math.random) {
  const makers = responseMakersFor(skill);
  if (!makers.length) return null;
  const [name, options] = makers[Math.floor(rng() * makers.length)];
  return MAKERS[name](rng, options);
}
