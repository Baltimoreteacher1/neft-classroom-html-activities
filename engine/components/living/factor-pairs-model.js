// living/factor-pairs-model.js — the mathematics and every sentence of the
// factor-pairs play (6-7). Pure functions only (no DOM): the factors, the
// rectangles, the leftovers, the choice sets and all EN/ES copy are computed
// here so factor-pairs.test.mjs can check each one in node.
//
// The idea: split two quantities into the same number of equal packs. The
// number of packs is the WIDTH of a rectangle of items; a width is possible
// exactly when it is a factor, so a width that works for BOTH quantities is a
// common factor and the widest one is the greatest common factor. The second
// half of the lesson asks the opposite question — when do two repeating things
// land together — and that is a multiple, drawn with the lcm-lanes cast.

import { lcmLanesCopy, validateLcmLanes } from "./lcm-lanes-model.js";
import { placeCorrect } from "./ratio-scale-model.js";

export { placeCorrect };

export const W = 480;
export const H = 300;
export const PANEL = 210; // width of one array panel
export const MAX_ITEMS = 60;
export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

const P = (en, es) => ({ en, es });
const cleanPair = (v, max = 260) => {
  const en = typeof v === "string" ? v.trim() : typeof v?.en === "string" ? v.en.trim() : "";
  const es = typeof v?.es === "string" && v.es.trim() ? v.es.trim() : en;
  return en && en.length <= max && es.length <= max ? { en, es } : null;
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const gcd = (x, y) => (y ? gcd(y, x % y) : x);
export const lcm = (x, y) => (x / gcd(x, y)) * y;

/** All factors of n, smallest first. */
export const factorsOf = (n) =>
  Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);

/** Factors of both, smallest first. */
export const commonFactors = (a, b) => factorsOf(a).filter((d) => b % d === 0);

/**
 * What the two arrays look like with `n` packs (columns): complete rows are the
 * rectangle; anything past the last complete row is left over.
 * @param {number} a @param {number} b @param {number} n
 */
export function arrayView(a, b, n) {
  const f = (/** @type {number} */ x) => ({
    rows: Math.floor(x / n),
    left: x % n,
    per: Math.floor(x / n),
    complete: x % n === 0,
  });
  const A = f(a);
  const B = f(b);
  return { A, B, works: A.complete && B.complete };
}

/**
 * Stage geometry for n columns: one cell size for both arrays, so the two
 * rectangles can be compared by eye. Items fill row by row.
 * @param {number} a @param {number} b @param {number} n
 */
export function arrayGeometry(a, b, n) {
  const rows = Math.max(Math.ceil(a / n), Math.ceil(b / n));
  const cell = Math.min(PANEL / n, 170 / rows, 26);
  const x0 = (panel, /** @type {number} */ w = n) =>
    18 + panel * (PANEL + 24) + (PANEL - w * cell) / 2;
  return { cell, rows, x0A: x0(0), x0B: x0(1), y0: 84 };
}

/** Where item i of an array with n columns sits (cell units). */
export const cellOf = (i, n) => ({ col: i % n, row: Math.floor(i / n) });

/**
 * One two-quantity setting: the packs are the columns.
 * @param {any} c
 */
function setting(c) {
  const a = Number(c?.a);
  const b = Number(c?.b);
  if (!okInt(a, 6, MAX_ITEMS) || !okInt(b, 6, MAX_ITEMS) || a === b) return null;
  if (a % b === 0 || b % a === 0) return null;
  const common = commonFactors(a, b);
  const g = common[common.length - 1];
  // Need at least three common factors (1, something, the greatest) so that a
  // smaller common factor is a real wrong answer.
  if (common.length < 3) return null;
  const nameA = cleanPair(c.nameA ?? P("items", "artículos"), 24);
  const nameB = cleanPair(c.nameB ?? P("things", "cosas"), 24);
  const story = c.story == null ? null : cleanPair(c.story);
  if (!nameA || !nameB || (c.story != null && !story)) return null;
  return {
    a,
    b,
    nameA,
    nameB,
    story,
    g,
    common,
    startN: common[common.length - 2],
    maxN: Math.min(24, g + 4),
    L: lcm(a, b),
  };
}

/**
 * @param {any} cfg
 */
export function validateFactorPairs(cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  const main = setting(cfg);
  const transfer = setting(cfg.transfer);
  if (!main || !transfer || (main.a === transfer.a && main.b === transfer.b)) return null;
  if (!main.story) return null;
  const l = cfg.lcm;
  if (!l || typeof l !== "object") return null;
  const lanes = validateLcmLanes({
    a: l.a,
    b: l.b,
    nameA: l.nameA,
    nameB: l.nameB,
    unit: l.unit,
    story: l.story,
    transfer: { a: 3, b: 5 },
  });
  if (!lanes) return null;
  const question = cleanPair(l.question);
  if (!question) return null;
  return { main, transfer, lcm: { v: lanes, question } };
}

/**
 * "The most packs with nothing left over": the greatest common factor and the
 * real mistakes — a smaller common factor, a factor of only one quantity, and
 * the least common multiple (the other half of the lesson).
 * @param {NonNullable<ReturnType<typeof setting>>} s
 */
export function packChoices(s) {
  const { a, b, g, common, L } = s;
  const smaller = common[common.length - 2];
  // The biggest proper factor of either number that does NOT divide the other.
  const onlyOne = [
    ...factorsOf(a).filter((d) => b % d && d < a),
    ...factorsOf(b).filter((d) => a % d && d < b),
  ].sort((x, y) => y - x)[0];
  /** @type {{ value: number, kind: string, correct: boolean }[]} */
  const raw = [
    { value: g, kind: "greatest", correct: true },
    { value: smaller, kind: "smaller", correct: false },
    { value: onlyOne, kind: "oneOnly", correct: false },
    { value: L, kind: "lcm", correct: false },
  ];
  const seen = new Set();
  return raw.filter((o) => o.value != null && !seen.has(o.value) && seen.add(o.value));
}

/** Which quantity a pack count fails on, with its leftover. */
export function failure(s, n) {
  const v = arrayView(s.a, s.b, n);
  if (!v.A.complete) return { which: /** @type {"A"} */ ("A"), left: v.A.left };
  if (!v.B.complete) return { which: /** @type {"B"} */ ("B"), left: v.B.left };
  return null;
}

/** The caption under an array: the factor pair, or the division with its remainder. */
export function caption(x, n) {
  const per = Math.floor(x / n);
  const left = x % n;
  return left === 0
    ? P(`${x} = ${n} × ${per}`, `${x} = ${n} × ${per}`)
    : P(`${x} ÷ ${n} = ${per} R ${left}`, `${x} ÷ ${n} = ${per}, sobran ${left}`);
}

const join = (xs) => xs.join(", ");

/**
 * Every bilingual line the play speaks, from the validated config.
 * @param {NonNullable<ReturnType<typeof validateFactorPairs>>} v
 */
export function factorPairsCopy(v) {
  const { main, transfer: t, lcm: lc } = v;
  const { a, b, nameA, nameB, g, common } = main;
  const LT = lcmLanesCopy(lc.v);
  const lm = lc.v.main;
  const unit = lc.v.unit;
  const fa = factorsOf(a);
  const fb = factorsOf(b);
  const perA = a / g;
  const perB = b / g;
  const tPerA = t.a / t.g;
  const tPerB = t.b / t.g;
  return {
    kicker: P("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: P(`Equal packs: ${a} and ${b}`, `Paquetes iguales: ${a} y ${b}`),
    ariaLabel: P(
      `${a} ${nameA.en} and ${b} ${nameB.en} laid out in rectangles with the same number of columns. A number of packs works when both rectangles are complete. The greatest such number is ${g}, the greatest common factor of ${a} and ${b}.`,
      `${a} ${nameA.es} y ${b} ${nameB.es} acomodados en rectángulos con el mismo número de columnas. Un número de paquetes sirve cuando los dos rectángulos están completos. El mayor es ${g}, el máximo común divisor de ${a} y ${b}.`,
    ),
    printSummary: P(
      `Factors of ${a}: ${join(fa)}. Factors of ${b}: ${join(fb)}. Common factors: ${join(common)}. The greatest common factor is ${g}: ${g} packs, each with ${perA} ${nameA.en} and ${perB} ${nameB.en}. Multiples: ${lm.a} and ${lm.b} first meet at ${lm.L}.`,
      `Factores de ${a}: ${join(fa)}. Factores de ${b}: ${join(fb)}. Factores comunes: ${join(common)}. El máximo común divisor es ${g}: ${g} paquetes, cada uno con ${perA} ${nameA.es} y ${perB} ${nameB.es}. Múltiplos: ${lm.a} y ${lm.b} coinciden por primera vez en ${lm.L}.`,
    ),
    scene: {
      situate: P("The packs", "Los paquetes"),
      predict: P("Predict", "Predice"),
      build: P("Build the packs", "Arma los paquetes"),
      connect: P("The lists", "Las listas"),
      lcm: P("Repeating", "Que se repite"),
      transfer: P("On your own", "Por tu cuenta"),
    },
    nameA,
    nameB,
    packWord: (/** @type {number} */ n) => P(`${n} packs`, `${n} paquetes`),
    situateSay: P(
      `${main.story?.en} Every pack is one column of the rectangles.`,
      `${main.story?.es} Cada paquete es una columna de los rectángulos.`,
    ),
    predictSay: P(
      "The number of packs has to divide BOTH quantities evenly. Predict before you build.",
      "El número de paquetes tiene que dividir EXACTAMENTE las DOS cantidades. Predice antes de armar.",
    ),
    predictQ: P(
      "What is the most packs the manager can make with nothing left over?",
      "¿Cuál es la mayor cantidad de paquetes que se pueden armar sin que sobre nada?",
    ),
    packLabel: (/** @type {number} */ n) => P(`${n} packs`, `${n} paquetes`),
    packCue: {
      smaller: (/** @type {number} */ x) =>
        P(
          `${x} packs works, but is it the MOST? Can you find more packs that still leave nothing over?`,
          `${x} paquetes sirve, pero ¿es el MÁXIMO? ¿Puedes hallar más paquetes que sigan sin dejar nada?`,
        ),
      oneOnly: (/** @type {number} */ x) => {
        const f = failure(main, x);
        const [bad, ok] = f?.which === "B" ? [nameB, nameA] : [nameA, nameB];
        return P(
          `${x} packs uses all the ${ok.en} evenly, but what happens to the ${bad.en}? Look at the picture with ${x} columns.`,
          `${x} paquetes usa todos los ${ok.es} sin que sobre ninguno, pero ¿qué pasa con los ${bad.es}? Mira el dibujo con ${x} columnas.`,
        );
      },
      lcm: (/** @type {number} */ x) =>
        P(
          `There are only ${Math.min(a, b)} of the smaller quantity. Could ${x} packs each hold at least one of everything?`,
          `Solo hay ${Math.min(a, b)} de la cantidad menor. ¿Podrían ${x} paquetes tener al menos uno de cada cosa?`,
        ),
    },
    predictOk: P(
      `Yes: ${g} packs, each with ${perA} ${nameA.en} and ${perB} ${nameB.en}. Now test it yourself.`,
      `Sí: ${g} paquetes, cada uno con ${perA} ${nameA.es} y ${perB} ${nameB.es}. Ahora pruébalo tú.`,
    ),
    buildSay: P(
      `Choose how many packs to make. A pack count works only when BOTH rectangles are complete.`,
      `Elige cuántos paquetes armar. Un número de paquetes sirve solo cuando LOS DOS rectángulos están completos.`,
    ),
    buildLabel: P("Packs", "Paquetes"),
    leftOver: (
      /** @type {number} */ la,
      /** @type {number} */ lb,
      /** @type {any} */ A,
      /** @type {any} */ B,
    ) =>
      P(
        `${cap(A.en)} left over: ${la}. ${cap(B.en)} left over: ${lb}.`,
        `Sobran ${A.es}: ${la}. Sobran ${B.es}: ${lb}.`,
      ),
    worksNote: (/** @type {number} */ n, /** @type {number[]} */ seen) =>
      P(
        `Nothing left over with ${n} packs. Packs that worked so far: ${join(seen)}. Can you make even more?`,
        `No sobra nada con ${n} paquetes. Paquetes que han servido: ${join(seen)}. ¿Puedes armar todavía más?`,
      ),
    buildOk: P(
      `${g} packs and nothing left over: ${a} = ${g} × ${perA} and ${b} = ${g} × ${perB}. Try ${g + 1} or more: something is always left over, so ${g} is the greatest.`,
      `${g} paquetes y no sobra nada: ${a} = ${g} × ${perA} y ${b} = ${g} × ${perB}. Prueba ${g + 1} o más: siempre sobra algo, así que ${g} es el mayor.`,
    ),
    connectSteps: [
      {
        say: P(
          `Each rectangle you can make is a factor pair. List every factor of ${a} and of ${b}, smallest first.`,
          `Cada rectángulo que puedes armar es un par de factores. Escribe todos los factores de ${a} y de ${b}, del menor al mayor.`,
        ),
      },
      {
        say: P(
          `The numbers in BOTH lists are the common factors: ${join(common)}.`,
          `Los números que están en LAS DOS listas son los factores comunes: ${join(common)}.`,
        ),
      },
      {
        say: P(
          `The greatest common factor is ${g}. So ${g} packs: ${a} ÷ ${g} = ${perA} ${nameA.en} and ${b} ÷ ${g} = ${perB} ${nameB.en} in each pack.`,
          `El máximo común divisor es ${g}. Entonces ${g} paquetes: ${a} ÷ ${g} = ${perA} ${nameA.es} y ${b} ÷ ${g} = ${perB} ${nameB.es} en cada paquete.`,
        ),
      },
    ],
    factorsLabel: (/** @type {number} */ n) => P(`Factors of ${n}`, `Factores de ${n}`),
    gcfTag: P("GCF", "MCD"),
    nextStep: P("Next step", "Siguiente paso"),
    lcmSay: P(
      `${lc.v.story.en} This time the question is about repeating, not about sharing.`,
      `${lc.v.story.es} Esta vez la pregunta es sobre algo que se repite, no sobre repartir.`,
    ),
    lcmQ: lc.question,
    lcmLabel: LT.firstLabel,
    lcmCue: LT.firstCue,
    lcmLanes: lc.v,
    lcmOk: P(
      `Yes: ${lm.L} ${unit.en}. Multiples of ${lm.a}: ${join([1, 2, 3].map((k) => k * lm.a))}. Multiples of ${lm.b}: ${join([1, 2, 3, 4].map((k) => k * lm.b))}. ${lm.L} is the first number in both lists, so it is the least common multiple. ${2 * lm.L} is a common multiple too, but it is not the first.`,
      `Sí: ${lm.L} ${unit.es}. Múltiplos de ${lm.a}: ${join([1, 2, 3].map((k) => k * lm.a))}. Múltiplos de ${lm.b}: ${join([1, 2, 3, 4].map((k) => k * lm.b))}. ${lm.L} es el primer número que está en las dos listas, así que es el mínimo común múltiplo. ${2 * lm.L} también es un múltiplo común, pero no es el primero.`,
    ),
    lcmExplainLabel: P(
      "Explain: what does the LCM mean here?",
      "Explica: ¿qué significa aquí el mínimo común múltiplo?",
    ),
    lcmExplainFrame: P(
      `The LCM is ___ ${unit.en}. It means ___.`,
      `El mínimo común múltiplo es ___ ${unit.es}. Significa ___.`,
    ),
    transferSay: P(
      `${t.story ? `${t.story.en} ` : ""}That is ${t.a} ${t.nameA.en} and ${t.b} ${t.nameB.en}.`,
      `${t.story ? `${t.story.es} ` : ""}Son ${t.a} ${t.nameA.es} y ${t.b} ${t.nameB.es}.`,
    ),
    transferCue: {
      smaller: (/** @type {number} */ x) =>
        P(
          `${x} packs works, but is it the MOST? Can you find more packs that still leave nothing over?`,
          `${x} paquetes sirve, pero ¿es el MÁXIMO? ¿Puedes hallar más paquetes que sigan sin dejar nada?`,
        ),
      oneOnly: (/** @type {number} */ x) => {
        const f = failure(t, x);
        const [bad, ok] = f?.which === "B" ? [t.nameB, t.nameA] : [t.nameA, t.nameB];
        return P(
          `${x} packs uses all the ${ok.en} evenly, but what happens to the ${bad.en}? Look at the picture with ${x} columns.`,
          `${x} paquetes usa todos los ${ok.es} sin que sobre ninguno, pero ¿qué pasa con los ${bad.es}? Mira el dibujo con ${x} columnas.`,
        );
      },
      lcm: (/** @type {number} */ x) =>
        P(
          `There are only ${Math.min(t.a, t.b)} of the smaller quantity. Could ${x} packs each hold at least one of everything?`,
          `Solo hay ${Math.min(t.a, t.b)} de la cantidad menor. ¿Podrían ${x} paquetes tener al menos uno de cada cosa?`,
        ),
    },
    transferOk: P(
      `Yes: ${t.g} packs. Check: ${t.a} ÷ ${t.g} = ${tPerA} ${t.nameA.en} and ${t.b} ÷ ${t.g} = ${tPerB} ${t.nameB.en} in each pack.`,
      `Sí: ${t.g} paquetes. Comprueba: ${t.a} ÷ ${t.g} = ${tPerA} ${t.nameA.es} y ${t.b} ÷ ${t.g} = ${tPerB} ${t.nameB.es} en cada paquete.`,
    ),
    explainLabel: P(
      "Explain: what does the GCF tell you?",
      "Explica: ¿qué te dice el máximo común divisor?",
    ),
    explainFrame: P(
      `The GCF is the ___ number that goes into both. For ${t.a} and ${t.b} it is ___.`,
      `El máximo común divisor es el ___ número que cabe en los dos. Para ${t.a} y ${t.b} es ___.`,
    ),
  };
}
