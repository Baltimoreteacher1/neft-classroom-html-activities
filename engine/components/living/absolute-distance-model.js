// living/absolute-distance-model.js — the mathematics and the words of the
// absolute-distance play (Lesson 7-3: absolute value as distance from 0).
//
// Pure functions only (no DOM): every number the play shows a student is
// computed here so absolute-distance.test.mjs can check each one in node.

import { count, fracText, near, num, okInt, pairOf, placeCorrect } from "./numline-model.js";

export { placeCorrect };

export const abs = (x) => Math.abs(x);
/** |n| with word joiners so a line never breaks inside the bars. */
export const ab = (n) => `|\u2060${typeof n === "number" ? num(n) : n}\u2060|`;

const onGrid = (v, den) => Number.isFinite(v) && near(v * den, Math.round(v * den));

function validItems(list, max) {
  if (!Array.isArray(list) || list.length < 4 || list.length > 6) return null;
  const items = list.map((it) => ({ v: Number(it?.v), name: pairOf(it?.name, 24) }));
  if (items.some((it) => !it.name || !okInt(it.v, -max, max) || it.v === 0)) return null;
  const sizes = items.map((it) => abs(it.v));
  if (new Set(sizes).size !== items.length) return null; // one clear farthest, no ties
  const xs = items.map((it) => it.v).sort((p, q) => p - q);
  if (xs.some((x, i) => i && x - xs[i - 1] < 2)) return null; // labels must not collide
  const far = items.reduce((m, it) => (abs(it.v) > abs(m.v) ? it : m));
  const greatest = items.reduce((m, it) => (it.v > m.v ? it : m));
  // The trap needs to exist: the greatest number is NOT the farthest from 0.
  if (far === greatest) return null;
  return { items, far, greatest };
}

export function validateAbsoluteDistance(cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  const max = Number(cfg.max);
  if (!okInt(max, 6, 12) || Number(cfg.min) !== -max) return null;
  const value = Number(cfg.value);
  if (!okInt(value, -max, max) || abs(value) < 2) return null;
  const decimal = Number(cfg.decimal?.value);
  if (!onGrid(decimal, 2) || Number.isInteger(decimal) || abs(decimal) >= max || abs(decimal) < 1.5)
    return null;
  if (near(abs(decimal), abs(value))) return null;
  const fv = Number(cfg.fraction?.value);
  const fden = Number(cfg.fraction?.den);
  if (!okInt(fden, 2, 10) || !onGrid(fv, fden) || fv === 0 || abs(fv) >= 1) return null;
  const t = validItems(cfg.transfer?.items, max);
  if (!t) return null;
  return {
    min: -max,
    max,
    value,
    decimal,
    fraction: { value: fv, den: fden },
    labelEvery: okInt(Number(cfg.labelEvery), 1, 4) ? Number(cfg.labelEvery) : 1,
    story: pairOf(cfg.story, 240),
    prefix: typeof cfg.prefix === "string" && cfg.prefix.length <= 2 ? cfg.prefix : "",
    neg: pairOf(cfg.neg, 24) || { en: "below 0", es: "debajo del 0" },
    pos: pairOf(cfg.pos, 24) || { en: "above 0", es: "arriba del 0" },
    transfer: t,
  };
}

/** The predict choices for value x: the distance and two real mistakes. */
export function predictChoices(x) {
  return [
    { kind: "distance", value: abs(x), correct: true },
    { kind: "negative", value: -abs(x) },
    { kind: "span", value: 2 * abs(x) },
  ];
}

/** The decimal choices for d: the distance, the signed value, the part after the point. */
export function decimalChoices(d) {
  return [
    { kind: "distance", value: abs(d), correct: true },
    { kind: "signed", value: d },
    { kind: "fraction", value: abs(d) - Math.floor(abs(d)) },
  ];
}

/** True once the visited values include a number and its opposite (both ≠ 0). */
export const foundPair = (seen) => seen.some((x) => x !== 0 && seen.includes(-x));

export function absoluteCopy(v) {
  const { value: x, decimal: d, fraction: f, transfer: tr } = v;
  const P = (n) => `${v.prefix}${abs(n)}`;
  const both = (en, es) => ({ en, es });
  const units = (n) => count(n, both("units", "unidades"));
  const fr = fracText(f.value, f.den);
  const story = v.story || {
    en: `The dot is at ${num(x)}.`,
    es: `El punto está en ${num(x)}.`,
  };
  const far = tr.far;
  const grt = tr.greatest;
  const sizes = tr.items.map((it) => `${ab(num(it.v))} = ${abs(it.v)}`).join(" · ");
  const sizesPrint = tr.items.map((it) => `${ab(num(it.v))} = ${abs(it.v)}`).join(", ");
  return {
    kicker: both("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: both("Absolute value is distance", "El valor absoluto es distancia"),
    ariaLabel: both(
      `A horizontal number line from ${num(v.min)} to ${v.max}. ${num(x)} is ${units(x).en} from 0, and so is ${num(-x)}: ${ab(num(x))} = ${ab(num(-x))} = ${abs(x)}. Distance is never negative.`,
      `Una recta numérica horizontal de ${num(v.min)} a ${v.max}. ${num(x)} está a ${units(x).es} del 0, igual que ${num(-x)}: ${ab(num(x))} = ${ab(num(-x))} = ${abs(x)}. La distancia nunca es negativa.`,
    ),
    printSummary: both(
      `${ab(num(x))} = ${abs(x)} and ${ab(num(-x))} = ${abs(x)}: absolute value is the distance from 0, and distance is never negative. A debt of ${abs(x)} and a balance of ${abs(x)} have the same size but different values. ${ab(num(d))} = ${abs(d)}, ${ab(fr)} = ${fracText(abs(f.value), f.den)}. ${sizesPrint}: the farthest from 0 is ${num(far.v)}.`,
      `${ab(num(x))} = ${abs(x)} y ${ab(num(-x))} = ${abs(x)}: el valor absoluto es la distancia desde el 0, y la distancia nunca es negativa. Una deuda de ${abs(x)} y un saldo de ${abs(x)} tienen el mismo tamaño pero valores distintos. ${ab(num(d))} = ${abs(d)}, ${ab(fr)} = ${fracText(abs(f.value), f.den)}. ${sizesPrint}: el más lejano del 0 es ${num(far.v)}.`,
    ),
    scene: {
      situate: both("The situation", "La situación"),
      predict: both("Predict", "Predice"),
      explore: both("Same distance", "Misma distancia"),
      symbols: both("Value and size", "Valor y tamaño"),
      decimal: both("Decimals and fractions", "Decimales y fracciones"),
      transfer: both("On your own", "Por tu cuenta"),
    },
    unitsOf: (n) => units(n),
    situateSay: both(
      `${story.en} Zero is where you start.`,
      `${story.es} El cero es donde empiezas.`,
    ),
    predictSay: both(
      `How far is the dot from 0? Count the steps from 0 to the dot.`,
      `¿A qué distancia del 0 está el punto? Cuenta los pasos del 0 al punto.`,
    ),
    predictQ: both(`The distance from 0 to ${num(x)} is…`, `La distancia del 0 a ${num(x)} es…`),
    predictLabel: (c) => both(`${num(c.value)} units`, `${num(c.value)} unidades`),
    predictCue(kind) {
      const cues = {
        negative: both(
          `Count the steps from 0 to the dot. Can you walk −${abs(x)} steps? What kind of number is a distance?`,
          `Cuenta los pasos del 0 al punto. ¿Puedes caminar −${abs(x)} pasos? ¿Qué tipo de número es una distancia?`,
        ),
        span: both(
          `${2 * abs(x)} is the distance from ${num(x)} all the way to ${abs(x)} (the dashed ring). Absolute value measures from 0 only. How far is ${num(x)} from 0?`,
          `${2 * abs(x)} es la distancia de ${num(x)} hasta ${abs(x)} (el aro de rayas). El valor absoluto mide solo desde el 0. ¿A qué distancia del 0 está ${num(x)}?`,
        ),
      };
      return cues[kind];
    },
    predictOk: both(
      `Yes: ${num(x)} is ${units(x).en} from 0, so ${ab(num(x))} = ${abs(x)}. The bar is its distance, and a distance is never negative.`,
      `Sí: ${num(x)} está a ${units(x).es} del 0, así que ${ab(num(x))} = ${abs(x)}. La barra es su distancia, y una distancia nunca es negativa.`,
    ),
    exploreSay: both(
      "Slide the dot. Find two different spots that are the same distance from 0.",
      "Desliza el punto. Encuentra dos lugares distintos que estén a la misma distancia del 0.",
    ),
    exploreLabel: both("Move the dot", "Mueve el punto"),
    exploreRow: (n) => ({
      en: `The dot is at ${num(n)}: ${units(n).en} from 0, so ${ab(num(n))} = ${abs(n)}.`,
      es: `El punto está en ${num(n)}: a ${units(n).es} del 0, así que ${ab(num(n))} = ${abs(n)}.`,
    }),
    exploreCue: (visited) =>
      visited < 2
        ? both("Slide the dot to a new spot.", "Desliza el punto a un lugar nuevo.")
        : both(
            "Look at the length of the bar. Can you land on a different spot with a bar the same length?",
            "Mira el largo de la barra. ¿Puedes llegar a un lugar distinto con una barra del mismo largo?",
          ),
    exploreOk: (n) =>
      both(
        `${num(n)} and ${num(-n)} are both ${units(n).en} from 0: ${ab(num(n))} = ${ab(num(-n))} = ${abs(n)}. The sign tells the side; the bar tells the distance.`,
        `${num(n)} y ${num(-n)} están a ${units(n).es} del 0: ${ab(num(n))} = ${ab(num(-n))} = ${abs(n)}. El signo dice el lado; la barra dice la distancia.`,
      ),
    symbolsSay: both(
      `Owing ${P(x)} and having ${P(x)} are different values, ${num(-abs(x))} and ${abs(x)}. But the amount, how far from 0, is the same: ${abs(x)}.`,
      `Deber ${P(x)} y tener ${P(x)} son valores distintos, ${num(-abs(x))} y ${abs(x)}. Pero la cantidad, la distancia al 0, es la misma: ${abs(x)}.`,
    ),
    owe: both(`${num(-abs(x))}: owe ${P(x)}`, `${num(-abs(x))}: debes ${P(x)}`),
    have: both(`${abs(x)}: have ${P(x)}`, `${abs(x)}: tienes ${P(x)}`),
    symbolsExpr: `${ab(num(-abs(x)))} = ${abs(x)}   ·   ${ab(abs(x))} = ${abs(x)}`,
    symbolsFb: both(
      `Value tells the side of 0 (debt or balance). Absolute value tells the size: ${abs(x)} either way. ${ab(num(-abs(x)))} = ${abs(x)} and ${ab(abs(x))} = ${abs(x)}.`,
      `El valor dice el lado del 0 (deuda o saldo). El valor absoluto dice el tamaño: ${abs(x)} en los dos casos. ${ab(num(-abs(x)))} = ${abs(x)} y ${ab(abs(x))} = ${abs(x)}.`,
    ),
    decimalSay: both(
      `Distance does not care whether a number is whole. What is ${ab(num(d))}?`,
      `A la distancia no le importa si el número es entero. ¿Cuánto es ${ab(num(d))}?`,
    ),
    decimalQ: both(`${ab(num(d))} is…`, `${ab(num(d))} es…`),
    decimalCue(kind) {
      const cues = {
        signed: both(
          `${num(d)} is where the dot sits. ${ab(num(d))} asks how far that spot is from 0. Count the bar, not the sign. Can a distance be negative?`,
          `${num(d)} es donde está el punto. ${ab(num(d))} pregunta a qué distancia del 0 está ese lugar. Cuenta la barra, no el signo. ¿Puede una distancia ser negativa?`,
        ),
        fraction: both(
          `${num(abs(d) - Math.floor(abs(d)))} is only the part after the decimal point. The bar starts at 0 and goes past ${Math.floor(abs(d))} whole steps. How long is the whole bar?`,
          `${num(abs(d) - Math.floor(abs(d)))} es solo la parte después del punto decimal. La barra empieza en 0 y pasa de ${Math.floor(abs(d))} pasos enteros. ¿Cuánto mide toda la barra?`,
        ),
      };
      return cues[kind];
    },
    decimalOk: both(
      `Yes: ${ab(num(d))} = ${abs(d)}. Fractions work the same way: ${fr} is ${fracText(abs(f.value), f.den)} of a unit from 0, so ${ab(fr)} = ${fracText(abs(f.value), f.den)}, and ${ab(fracText(-abs(f.value), f.den))} = ${fracText(abs(f.value), f.den)} too.`,
      `Sí: ${ab(num(d))} = ${abs(d)}. Las fracciones funcionan igual: ${fr} está a ${fracText(abs(f.value), f.den)} de una unidad del 0, así que ${ab(fr)} = ${fracText(abs(f.value), f.den)}, y ${ab(fracText(-abs(f.value), f.den))} = ${fracText(abs(f.value), f.den)} también.`,
    ),
    decimalExpr: (solved) =>
      solved
        ? `${ab(num(d))} = ${abs(d)}   ·   ${ab(fr)} = ${fracText(abs(f.value), f.den)}`
        : `${ab(num(d))} = ?`,
    transferSay: both(
      "Five treasures sit on this line. Their depths and heights are the numbers you see.",
      "Cinco tesoros están en esta recta. Sus profundidades y alturas son los números que ves.",
    ),
    transferQ: both("Which treasure is farthest from 0?", "¿Qué tesoro está más lejos del 0?"),
    transferLabel: (it) => both(`${it.name.en} (${num(it.v)})`, `${it.name.es} (${num(it.v)})`),
    transferCue(item) {
      return item === grt
        ? both(
            `${num(item.v)} is the greatest number here, but greatest is not the same as farthest from 0. Count the steps from 0 to each dot.`,
            `${num(item.v)} es el número mayor aquí, pero mayor no es lo mismo que más lejos del 0. Cuenta los pasos del 0 a cada punto.`,
          )
        : both(
            `Count the steps from 0 to ${item.name.en}: ${units(item.v).en}. Is there a dot farther away?`,
            `Cuenta los pasos del 0 a ${item.name.es}: ${units(item.v).es}. ¿Hay un punto más lejos?`,
          );
    },
    transferOk: both(
      `Yes: ${far.name.en} is farthest. ${sizes}. The size of a number is its distance from 0, so the greatest number (${num(grt.v)}) is not always the farthest.`,
      `Sí: ${far.name.es} es el más lejano. ${sizes}. El tamaño de un número es su distancia desde el 0, así que el número mayor (${num(grt.v)}) no siempre es el más lejano.`,
    ),
    transferExpr: sizes,
    explainLabel: both(
      "Explain: what is absolute value, and why is it never negative?",
      "Explica: ¿qué es el valor absoluto y por qué nunca es negativo?",
    ),
    explainFrame: both(
      `Absolute value is ___. ${ab(num(x))} = ___ because ___.`,
      `El valor absoluto es ___. ${ab(num(x))} = ___ porque ___.`,
    ),
  };
}
