// living/lcm-lanes-model.js — the mathematics and every sentence of the
// lcm-lanes play (6-12, and the multiples scene of 6-7). Pure functions only
// (no DOM): the multiples, the common ones, the least, the prediction choice
// sets and all EN/ES copy are computed here so lcm-lanes.test.mjs can check
// each one in node.
//
// The idea: two things repeat, one every `a` and one every `b`. Each is a lane
// of dots at its multiples. They start together at 0; the first time dots
// stand at the same place again is the least common multiple.

import { placeCorrect } from "./ratio-scale-model.js";

export { placeCorrect };

export const W = 480;
export const H = 300;
export const X0 = 40;
export const X1 = 440;
export const REPS = 3; // the lanes run to REPS × LCM so "the next time" is on stage
export const MAX_DOTS = 16; // most dots a lane may carry (keeps the dots 26+ units apart)
export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

const P = (en, es) => ({ en, es });
const cleanPair = (v, max = 160) => {
  const en = typeof v === "string" ? v.trim() : typeof v?.en === "string" ? v.en.trim() : "";
  const es = typeof v?.es === "string" && v.es.trim() ? v.es.trim() : en;
  return en && en.length <= max && es.length <= max ? { en, es } : null;
};

export const gcd = (x, y) => (y ? gcd(y, x % y) : x);
export const lcm = (x, y) => (x / gcd(x, y)) * y;

/** 0, a, 2a, … up to span (the dot at 0 is the shared start). */
export const multiples = (a, span) =>
  Array.from({ length: Math.floor(span / a) + 1 }, (_, k) => k * a);

/** Positive common multiples up to span. */
export const commonMultiples = (a, b, span) =>
  multiples(a, span).filter((t) => t > 0 && t % b === 0);

/** Stage x of time t on a lane that runs 0 … span. */
export const xOf = (t, span) => X0 + (t / span) * (X1 - X0);

/**
 * @typedef {{ a: number, b: number, nameA: {en:string,es:string}, nameB: {en:string,es:string}, L: number, span: number }} Setting
 */

/**
 * One two-lane setting. Neither number may divide the other (the first meeting
 * would just be the larger number) and the lanes must stay drawable.
 * @param {any} c @param {number} reps
 * @returns {Setting | null}
 */
function setting(c, reps) {
  const a = Number(c?.a);
  const b = Number(c?.b);
  if (!okInt(a, 2, 12) || !okInt(b, 2, 12) || a === b || a % b === 0 || b % a === 0) return null;
  const L = lcm(a, b);
  const span = reps * L;
  if (span / Math.min(a, b) > MAX_DOTS) return null;
  const nameA = c.nameA == null ? P(`Every ${a}`, `Cada ${a}`) : cleanPair(c.nameA, 40);
  const nameB = c.nameB == null ? P(`Every ${b}`, `Cada ${b}`) : cleanPair(c.nameB, 40);
  if (!nameA || !nameB) return null;
  return { a, b, nameA, nameB, L, span };
}

/**
 * @param {any} cfg
 */
export function validateLcmLanes(cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  const main = setting(cfg, REPS);
  if (!main) return null;
  const unit = cleanPair(cfg.unit ?? P("hours", "horas"), 24);
  const story = cleanPair(cfg.story, 260);
  if (!unit || !story) return null;
  const t = cfg.transfer ?? { a: 3, b: 5 };
  const transfer = setting(t, 2);
  if (!transfer || (transfer.a === main.a && transfer.b === main.b)) return null;
  const tUnit = t.unit == null ? unit : cleanPair(t.unit, 24);
  const tStory = t.story == null ? null : cleanPair(t.story, 260);
  if (!tUnit || (t.story != null && !tStory)) return null;
  const cap = Math.max(
    Math.floor(main.span / Math.min(main.a, main.b)),
    Math.floor(transfer.span / Math.min(transfer.a, transfer.b)),
  );
  return { main, unit, story, transfer: { ...transfer, unit: tUnit, story: tStory }, cap: cap + 1 };
}

/**
 * The "first time both" choices: the LCM plus the real mistakes — add the two
 * numbers, take a later common multiple (the product, or twice the LCM when the
 * product IS the LCM), and the greatest common factor (or the larger number).
 * @param {Setting} s
 */
export function firstChoices(s) {
  const { a, b, L } = s;
  const g = gcd(a, b);
  const later = a * b !== L ? a * b : 2 * L;
  /** @type {{ value: number, kind: string, correct: boolean }[]} */
  const raw = [
    { value: L, kind: "least", correct: true },
    { value: a + b, kind: "sum", correct: false },
    { value: later, kind: "later", correct: false },
    g >= 2
      ? { value: g, kind: "factor", correct: false }
      : { value: Math.max(a, b), kind: "larger", correct: false },
  ];
  const seen = new Set();
  return raw.filter((o) => o.value > 0 && !seen.has(o.value) && seen.add(o.value));
}

/**
 * "The next time after the first two": 3L plus three real mistakes — a step of
 * `a` or of `b` past the last meeting (one lane only), and one more LCM skipped.
 * @param {Setting} s
 */
export function nextChoices(s) {
  const { a, b, L } = s;
  const raw = [
    { value: 3 * L, kind: "pattern", correct: true },
    { value: 2 * L + a, kind: "oneLane", correct: false },
    { value: 2 * L + b, kind: "oneLane", correct: false },
    { value: 4 * L, kind: "skip", correct: false },
  ];
  const seen = new Set();
  return raw.filter((o) => !seen.has(o.value) && seen.add(o.value));
}

/** Where the hopping dots are after `ka` hops of a and `kb` hops of b. */
export const hopState = (s, ka, kb) => {
  const pa = ka * s.a;
  const pb = kb * s.b;
  return { pa, pb, meet: pa === pb && pa > 0, first: pa === pb && pa === s.L };
};

const join = (xs) => xs.join(", ");

/**
 * Every bilingual line the play speaks, from the validated config.
 * @param {NonNullable<ReturnType<typeof validateLcmLanes>>} v
 */
export function lcmLanesCopy(v) {
  const { main, unit, story, transfer: t } = v;
  const { a, b, L, nameA, nameB } = main;
  const ma = multiples(a, 2 * L).slice(1);
  const mb = multiples(b, 2 * L).slice(1);
  const common = commonMultiples(a, b, 2 * L);
  const tl = t.L;
  const tma = multiples(t.a, tl).slice(1);
  const tmb = multiples(t.b, tl).slice(1);
  const tCommon = commonMultiples(t.a, t.b, 2 * tl);
  const when = (n, u) => P(`${n} ${u.en}`, `${n} ${u.es}`);
  return {
    kicker: P("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: P(`When do both happen? ${a} and ${b}`, `¿Cuándo coinciden? ${a} y ${b}`),
    ariaLabel: P(
      `Two lanes of dots. The top lane has a dot at every multiple of ${a}, the bottom lane at every multiple of ${b}, both starting at 0. The first time dots stand at the same place after 0 is ${L}, the least common multiple.`,
      `Dos carriles de puntos. El carril de arriba tiene un punto en cada múltiplo de ${a}, el de abajo en cada múltiplo de ${b}, y los dos empiezan en 0. La primera vez que los puntos coinciden después de 0 es ${L}, el mínimo común múltiplo.`,
    ),
    printSummary: P(
      `Multiples of ${a}: ${join(ma)}. Multiples of ${b}: ${join(mb)}. Common multiples: ${join(common)}. The least common multiple is ${L}, because ${L} ÷ ${a} = ${L / a} and ${L} ÷ ${b} = ${L / b}. Then ${t.a} and ${t.b}: the least common multiple is ${tl}.`,
      `Múltiplos de ${a}: ${join(ma)}. Múltiplos de ${b}: ${join(mb)}. Múltiplos comunes: ${join(common)}. El mínimo común múltiplo es ${L}, porque ${L} ÷ ${a} = ${L / a} y ${L} ÷ ${b} = ${L / b}. Luego ${t.a} y ${t.b}: el mínimo común múltiplo es ${tl}.`,
    ),
    scene: {
      situate: P("Two lanes", "Dos carriles"),
      predict: P("Predict", "Predice"),
      hop: P("Hop along", "Salta"),
      connect: P("The lists", "Las listas"),
      next: P("What next?", "¿Y después?"),
      transfer: P("On your own", "Por tu cuenta"),
    },
    laneLabel: (
      /** @type {Setting & {unit?: any}} */ s,
      /** @type {"a"|"b"} */ which,
      /** @type {any} */ un,
    ) => {
      const nm = which === "a" ? s.nameA : s.nameB;
      const n = which === "a" ? s.a : s.b;
      return P(`${nm.en} · every ${n} ${un.en}`, `${nm.es} · cada ${n} ${un.es}`);
    },
    situateSay: P(
      `${story.en} The dots mark every ${a} ${unit.en} on the top lane and every ${b} ${unit.en} on the bottom lane.`,
      `${story.es} Los puntos marcan cada ${a} ${unit.es} en el carril de arriba y cada ${b} ${unit.es} en el de abajo.`,
    ),
    predictSay: P(
      "Both start together at 0. Predict before you hop.",
      "Los dos empiezan juntos en 0. Predice antes de saltar.",
    ),
    predictQ: P(
      "When is the next time both happen together?",
      "¿Cuándo es la próxima vez que los dos coinciden?",
    ),
    firstLabel: (/** @type {number} */ x) => when(x, unit),
    firstCue: {
      sum: (/** @type {number} */ x) =>
        P(
          `Look at the dashed line at ${x}. Is there a dot on BOTH lanes there?`,
          `Mira la línea punteada en ${x}. ¿Hay un punto en LOS DOS carriles ahí?`,
        ),
      factor: (/** @type {number} */ x) =>
        P(
          `Look at the dashed line at ${x}. Is there a dot on BOTH lanes there?`,
          `Mira la línea punteada en ${x}. ¿Hay un punto en LOS DOS carriles ahí?`,
        ),
      larger: (/** @type {number} */ x) =>
        P(
          `Look at the dashed line at ${x}. Is there a dot on BOTH lanes there?`,
          `Mira la línea punteada en ${x}. ¿Hay un punto en LOS DOS carriles ahí?`,
        ),
      later: (/** @type {number} */ x) =>
        P(
          `Both lanes have a dot at ${x}, but is it the FIRST time? Look at the dots before it.`,
          `Los dos carriles tienen un punto en ${x}, pero ¿es la PRIMERA vez? Mira los puntos anteriores.`,
        ),
    },
    predictOk: P(
      `Yes: the lanes meet again at ${L} ${unit.en}. That is the least common multiple of ${a} and ${b}.`,
      `Sí: los carriles vuelven a coincidir en ${L} ${unit.es}. Ese es el mínimo común múltiplo de ${a} y ${b}.`,
    ),
    hopSay: P(
      `Hop along the lanes. Every hop adds ${a} ${unit.en} to the top lane or ${b} ${unit.en} to the bottom lane. Find where the dots meet.`,
      `Salta por los carriles. Cada salto suma ${a} ${unit.es} al carril de arriba o ${b} ${unit.es} al de abajo. Halla dónde coinciden los puntos.`,
    ),
    hopBtn: (/** @type {"a"|"b"} */ w) =>
      w === "a"
        ? P(`${nameA.en} +${a}`, `${nameA.es} +${a}`)
        : P(`${nameB.en} +${b}`, `${nameB.es} +${b}`),
    startOver: P("Start over", "Empezar de nuevo"),
    hopAt: (/** @type {number} */ pa, /** @type {number} */ pb) =>
      P(
        `${nameA.en}: ${pa}. ${nameB.en}: ${pb}. The lane that is behind can hop to catch up.`,
        `${nameA.es}: ${pa}. ${nameB.es}: ${pb}. El carril que va atrás puede saltar para alcanzar.`,
      ),
    hopTooFar: P(
      "That lane has no more room. Hop the other lane, or start over.",
      "Ese carril ya no tiene más espacio. Salta con el otro carril o empieza de nuevo.",
    ),
    hopLater: (/** @type {number} */ x) =>
      P(
        `The dots meet at ${x}, but that is not the first time. Start over and look for the first place they land together.`,
        `Los puntos coinciden en ${x}, pero no es la primera vez. Empieza de nuevo y busca el primer lugar donde caen juntos.`,
      ),
    hopOk: P(
      `The dots meet at ${L}: ${L / a} hops of ${a} and ${L / b} hops of ${b}. It is the first place both lanes have a dot, so ${L} is the least common multiple.`,
      `Los puntos coinciden en ${L}: ${L / a} saltos de ${a} y ${L / b} saltos de ${b}. Es el primer lugar donde los dos carriles tienen un punto, así que ${L} es el mínimo común múltiplo.`,
    ),
    connectSay: [
      P(
        `The numbers on each lane are its multiples. A number in BOTH lists is a common multiple: ${join(common)}.`,
        `Los números de cada carril son sus múltiplos. Un número que está en LAS DOS listas es un múltiplo común: ${join(common)}.`,
      ),
      P(
        `The smallest common multiple is the LCM: ${L}. Check: ${L} ÷ ${a} = ${L / a} and ${L} ÷ ${b} = ${L / b}, so both go into ${L} evenly.`,
        `El menor múltiplo común es el mínimo común múltiplo: ${L}. Comprueba: ${L} ÷ ${a} = ${L / a} y ${L} ÷ ${b} = ${L / b}, así que los dos caben exactamente en ${L}.`,
      ),
    ],
    listA: ma,
    listB: mb,
    common,
    listLabel: (/** @type {number} */ n) => P(`Multiples of ${n}:`, `Múltiplos de ${n}:`),
    nextSay: P(
      `The dots meet at ${L} and again at ${2 * L}. Does it keep happening?`,
      `Los puntos coinciden en ${L} y otra vez en ${2 * L}. ¿Sigue pasando?`,
    ),
    nextQ: P(
      `When is the next time after ${2 * L} that both happen together?`,
      `¿Cuándo es la próxima vez después de ${2 * L} que los dos coinciden?`,
    ),
    nextCue: {
      oneLane: (/** @type {number} */ x) =>
        P(
          `Check the dashed line at ${x}. Is there a dot on BOTH lanes there?`,
          `Revisa la línea punteada en ${x}. ¿Hay un punto en LOS DOS carriles ahí?`,
        ),
      skip: P(
        `Look at the times already marked: ${L} and ${2 * L}. How far apart are they? Does a time fit between ${2 * L} and that number?`,
        `Mira los momentos ya marcados: ${L} y ${2 * L}. ¿Cuánto los separa? ¿Cabe un momento entre ${2 * L} y ese número?`,
      ),
    },
    nextOk: P(
      `Yes: the dots meet every ${L} ${unit.en}: ${L}, ${2 * L}, ${3 * L}. The least common multiple is the first of them.`,
      `Sí: los puntos coinciden cada ${L} ${unit.es}: ${L}, ${2 * L}, ${3 * L}. El mínimo común múltiplo es el primero de ellos.`,
    ),
    transferSay: P(
      `${t.story?.en ? `${t.story.en} ` : ""}Now two things repeat: one every ${t.a} and one every ${t.b}, both starting at 0.`,
      `${t.story?.es ? `${t.story.es} ` : ""}Ahora se repiten dos cosas: una cada ${t.a} y otra cada ${t.b}, las dos desde 0.`,
    ),
    transferQ: P(
      `What is the first time both happen together?`,
      `¿Cuál es la primera vez que los dos coinciden?`,
    ),
    transferLabel: (/** @type {number} */ x) => P(String(x), String(x)),
    transferOk: P(
      `Yes: multiples of ${t.a}: ${join(tma)}. Multiples of ${t.b}: ${join(tmb)}. The first number in both lists is ${tl}, so the LCM of ${t.a} and ${t.b} is ${tl}.`,
      `Sí: múltiplos de ${t.a}: ${join(tma)}. Múltiplos de ${t.b}: ${join(tmb)}. El primer número que está en las dos listas es ${tl}, así que el mínimo común múltiplo de ${t.a} y ${t.b} es ${tl}.`,
    ),
    transferCommon: tCommon,
    explainLabel: P(
      "Explain: what does the LCM tell you?",
      "Explica: ¿qué te dice el mínimo común múltiplo?",
    ),
    explainFrame: P(
      `The LCM is the ___ number that is in both lists. For ${t.a} and ${t.b} it is ___.`,
      `El mínimo común múltiplo es el ___ número que está en las dos listas. Para ${t.a} y ${t.b} es ___.`,
    ),
  };
}
