// living/ratio-parts-model.js — the numbers and words of the ratio-parts play
// (lesson 3-1, Understand Ratios), with no DOM. Validation, the prediction
// choice sets, the four readings of one picture and every bilingual line the
// play speaks are computed here from a validated config, so
// `ratio-parts.test.mjs` can prove them without a browser.
//
// The idea: ONE strip of tiles is read two ways. Part to part compares two
// amounts (a : b); part to whole compares one amount with all of the parts
// (a : a + b). Either way the order the amounts are NAMED is the order the
// numbers are written, so a : b and b : a are different ratios.

import { okInt, placeCorrect } from "./ratio-scale-model.js";

export { okInt, placeCorrect };

/**
 * Like placeCorrect, but the correct choice is never first, and the slot is a
 * stable function of the deal's own numbers rather than of habit.
 * @template {{ correct?: boolean }} T
 * @param {T[]} options
 * @param {number} seed
 * @returns {T[]}
 */
export const placeAway = (options, seed) =>
  placeCorrect(options, 1 + (seed % (options.length - 1)));

export const W = 440;
export const H = 240;

/**
 * @typedef {{ en: string, es: string }} Pair
 * @typedef {{ a: number, b: number, labelA: Pair, labelB: Pair, whole: Pair, story: Pair }} PartsCore
 * @typedef {PartsCore & { transfer: PartsCore }} PartsConfig
 */

/**
 * A string or {en, es}; missing es falls back to en; empty or too long → null.
 * @param {unknown} v
 * @param {number} max
 * @returns {Pair | null}
 */
export function cleanText(v, max) {
  if (v == null) return null;
  const pair = typeof v === "string" ? { en: v, es: v } : v;
  if (typeof pair !== "object") return null;
  const p = /** @type {{ en?: unknown, es?: unknown }} */ (pair);
  const en = typeof p.en === "string" ? p.en.trim() : "";
  const es = typeof p.es === "string" && p.es.trim() ? p.es.trim() : en;
  return en && en.length <= max && es.length <= max ? { en, es } : null;
}

/**
 * @param {any} t
 * @returns {PartsCore | null}
 */
function core(t) {
  if (!t || typeof t !== "object") return null;
  const a = Number(t.a);
  const b = Number(t.b);
  // a === b would make "order matters" invisible: 3 : 3 reads the same both ways.
  if (!okInt(a, 1, 8) || !okInt(b, 1, 8) || a === b || a + b > 10) return null;
  const labelA = cleanText(t.labelA, 24);
  const labelB = cleanText(t.labelB, 24);
  const whole = cleanText(t.whole, 24);
  const story = cleanText(t.story, 160);
  return labelA && labelB && whole && story ? { a, b, labelA, labelB, whole, story } : null;
}

/**
 * @param {any} cfg
 * @returns {PartsConfig | null}
 */
export function validateRatioParts(cfg) {
  const main = core(cfg);
  const transfer = core(cfg?.transfer);
  if (!main || !transfer) return null;
  if (transfer.a === main.a && transfer.b === main.b) return null;
  return { ...main, transfer };
}

/** The four readings of one strip: which amount is named first, which second (A, B, or the whole W). */
export const READINGS = {
  ab: { first: "A", second: "B" },
  ba: { first: "B", second: "A" },
  aw: { first: "A", second: "W" },
  bw: { first: "B", second: "W" },
};

/** The number each reading writes for A, B or the whole W. */
export const partValue = (core, key) =>
  key === "A" ? core.a : key === "B" ? core.b : core.a + core.b;

/**
 * Prediction choices for "first to second". The correct pair plus the
 * order-swapped pair and the part-to-whole pair.
 * @param {number} a
 * @param {number} b
 */
export function partToPartChoices(a, b) {
  return [
    { x: a, y: b, correct: true, kind: "right" },
    { x: b, y: a, correct: false, kind: "reversed" },
    { x: a, y: a + b, correct: false, kind: "whole" },
  ];
}

/**
 * Transfer choices for "A to the whole".
 * @param {number} a
 * @param {number} b
 */
export function partToWholeChoices(a, b) {
  return [
    { x: a, y: a + b, correct: true, kind: "right" },
    { x: a, y: b, correct: false, kind: "partToPart" },
    { x: b, y: a + b, correct: false, kind: "otherPart" },
    { x: a + b, y: a, correct: false, kind: "wholeFirst" },
  ];
}

const to = (x, y) => `${x} : ${y}`;
const cap = (/** @type {string} */ s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Every bilingual line the play speaks, from the validated config.
 * @param {PartsConfig} v
 */
export function ratioPartsCopy(v) {
  const { a, b, labelA: A, labelB: B, whole: Wh, story } = v;
  const t = v.transfer;
  const n = a + b;
  return {
    title: {
      en: `Ratios: ${to(a, b)} is not ${to(b, a)}`,
      es: `Razones: ${to(a, b)} no es ${to(b, a)}`,
    },
    ariaLabel: {
      en: `One batch drawn as tiles: ${a} square tiles for ${A.en} and ${b} round tiles for ${B.en}. The tiles line up in one strip of ${n} parts.`,
      es: `Una tanda dibujada con fichas: ${a} fichas cuadradas de ${A.es} y ${b} fichas redondas de ${B.es}. Las fichas forman una sola barra de ${n} partes.`,
    },
    printSummary: {
      en: `${story.en} ${cap(A.en)} to ${B.en} is ${to(a, b)} (part to part). ${cap(A.en)} to ${Wh.en} is ${to(a, n)} (part to whole). Order matters: ${to(b, a)} compares the same amounts the other way round.`,
      es: `${story.es} ${cap(A.es)} a ${B.es} es ${to(a, b)} (parte a parte). ${cap(A.es)} a ${Wh.es} es ${to(a, n)} (parte a total). El orden importa: ${to(b, a)} compara las mismas cantidades al revés.`,
    },
    partsWord: { en: "parts", es: "partes" },
    ordinal: { first: { en: "1st", es: "1.º" }, second: { en: "2nd", es: "2.º" } },
    situate: {
      en: `${story.en} Squares are ${A.en}; circles are ${B.en}. A ratio compares two amounts.`,
      es: `${story.es} Los cuadrados son ${A.es}; los círculos son ${B.es}. Una razón compara dos cantidades.`,
    },
    predict: {
      say: {
        en: `Write the ratio of ${A.en} to ${B.en}, in that order. Predict before you build.`,
        es: `Escribe la razón de ${A.es} a ${B.es}, en ese orden. Predice antes de construir.`,
      },
      question: { en: `${A.en} to ${B.en} =`, es: `${A.es} a ${B.es} =` },
      cues: {
        reversed: {
          en: `That writes ${B.en} first. Which amount does the question name first? Look at the ringed tiles.`,
          es: `Eso escribe primero ${B.es}. ¿Qué cantidad nombra primero la pregunta? Mira las fichas marcadas.`,
        },
        whole: {
          en: `Count every tile in the strip: ${n}. Does this ratio compare ${A.en} with ${B.en}, or with everything?`,
          es: `Cuenta todas las fichas de la barra: ${n}. ¿Esta razón compara ${A.es} con ${B.es}, o con todo?`,
        },
      },
      ok: {
        en: `Yes: ${A.en} is named first, so ${a} goes first. ${a} to ${b}, or ${to(a, b)}.`,
        es: `Sí: ${A.es} se nombra primero, así que ${a} va primero. ${a} a ${b}, o ${to(a, b)}.`,
      },
    },
    readings: {
      say: {
        en: "One strip, four ratios. Pick a reading: the picture shows which amounts you compare and which one is named first.",
        es: "Una barra, cuatro razones. Elige una lectura: el dibujo muestra qué cantidades comparas y cuál se nombra primero.",
      },
      labels: {
        ab: { en: `${A.en} to ${B.en}`, es: `${A.es} a ${B.es}` },
        ba: { en: `${B.en} to ${A.en}`, es: `${B.es} a ${A.es}` },
        aw: { en: `${A.en} to ${Wh.en}`, es: `${A.es} a ${Wh.es}` },
        bw: { en: `${B.en} to ${Wh.en}`, es: `${B.es} a ${Wh.es}` },
      },
      say1: {
        ab: {
          en: `Part to part: ${A.en} to ${B.en} is ${a} to ${b}. Two parts of the same picture, compared.`,
          es: `Parte a parte: ${A.es} a ${B.es} es ${a} a ${b}. Dos partes del mismo dibujo, comparadas.`,
        },
        ba: {
          en: `Same two amounts, opposite order: ${B.en} to ${A.en} is ${b} to ${a}. It is a different ratio from ${to(a, b)}.`,
          es: `Las mismas dos cantidades, en orden contrario: ${B.es} a ${A.es} es ${b} a ${a}. Es una razón distinta de ${to(a, b)}.`,
        },
        aw: {
          en: `Part to whole: ${A.en} to ${Wh.en} is ${a} to ${n}. The whole is all ${n} parts.`,
          es: `Parte a total: ${A.es} a ${Wh.es} es ${a} a ${n}. El total son las ${n} partes.`,
        },
        bw: {
          en: `Part to whole: ${B.en} to ${Wh.en} is ${b} to ${n}. The whole is all ${n} parts.`,
          es: `Parte a total: ${B.es} a ${Wh.es} es ${b} a ${n}. El total son las ${n} partes.`,
        },
      },
      progress: (/** @type {number} */ k) => ({
        en: `Try all four readings (${k}/4).`,
        es: `Prueba las cuatro lecturas (${k}/4).`,
      }),
      done: {
        en: `One picture, four ratios: ${to(a, b)}, ${to(b, a)}, ${to(a, n)} and ${to(b, n)}. The order you name the amounts is the order you write the numbers.`,
        es: `Un dibujo, cuatro razones: ${to(a, b)}, ${to(b, a)}, ${to(a, n)} y ${to(b, n)}. El orden en que nombras las cantidades es el orden en que escribes los números.`,
      },
    },
    write: {
      say: {
        en: `Three ways to write the ratio of ${A.en} to ${B.en}: ${to(a, b)}, ${a} to ${b}, and ${a}/${b}. The number for the amount named first always goes first. Part to whole works the same way: ${A.en} to ${Wh.en} is ${to(a, n)}.`,
        es: `Tres formas de escribir la razón de ${A.es} a ${B.es}: ${to(a, b)}, ${a} a ${b} y ${a}/${b}. El número de la cantidad que se nombra primero va siempre primero. Parte a total funciona igual: ${A.es} a ${Wh.es} es ${to(a, n)}.`,
      },
      to: { en: "to", es: "a" },
    },
    transfer: {
      say: {
        en: `${t.story.en} Now compare one part with the whole.`,
        es: `${t.story.es} Ahora compara una parte con el total.`,
      },
      question: { en: `${t.labelA.en} to ${t.whole.en} =`, es: `${t.labelA.es} a ${t.whole.es} =` },
      cues: {
        partToPart: {
          en: `That compares ${t.labelA.en} with ${t.labelB.en} only. Count every tile in the strip: how many parts are in the whole?`,
          es: `Eso compara solo ${t.labelA.es} con ${t.labelB.es}. Cuenta todas las fichas de la barra: ¿cuántas partes tiene el total?`,
        },
        otherPart: {
          en: `That puts ${t.labelB.en} first. Which amount does the question name first?`,
          es: `Eso pone primero ${t.labelB.es}. ¿Qué cantidad nombra primero la pregunta?`,
        },
        wholeFirst: {
          en: `That writes the whole first. The question names ${t.labelA.en} first.`,
          es: `Eso escribe primero el total. La pregunta nombra primero ${t.labelA.es}.`,
        },
      },
      ok: {
        en: `Yes: ${t.a} of the ${t.a + t.b} parts are ${t.labelA.en}. ${cap(t.labelA.en)} to ${t.whole.en} is ${t.a} to ${t.a + t.b}.`,
        es: `Sí: ${t.a} de las ${t.a + t.b} partes son ${t.labelA.es}. ${cap(t.labelA.es)} a ${t.whole.es} es ${t.a} a ${t.a + t.b}.`,
      },
      explain: {
        en: `Explain: why is ${to(a, b)} not the same as ${to(b, a)}?`,
        es: `Explica: ¿por qué ${to(a, b)} no es lo mismo que ${to(b, a)}?`,
      },
      frame: {
        en: `${to(a, b)} puts ___ first. ${to(b, a)} puts ___ first. A part-to-whole ratio compares ___ with ___.`,
        es: `${to(a, b)} pone primero ___. ${to(b, a)} pone primero ___. Una razón de parte a total compara ___ con ___.`,
      },
    },
  };
}
