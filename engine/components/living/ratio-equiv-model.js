// living/ratio-equiv-model.js — the numbers and words of the ratio-equiv play
// (lesson 3-9, Equivalent Ratios), with no DOM. Validation, the scale factor,
// the equivalence check, the choice sets and every bilingual line the play
// speaks are computed here from a validated config.
//
// The idea: a ratio keeps its meaning when BOTH numbers are multiplied (or
// divided) by the same factor. The factor is found by dividing a known pair of
// corresponding terms (32 people ÷ 8 people = 4), and two ratios are
// equivalent only when the factor between corresponding terms is the same.

import { cleanText, okInt, placeAway, placeCorrect } from "./ratio-parts-model.js";

export { okInt, placeAway, placeCorrect };

export const W = 440;
export const H = 276;
export const MAX_FACTOR = 8; // slider range for the scaling scene

/**
 * @typedef {{ en: string, es: string }} Pair
 * @typedef {{ a: number, b: number, from: number, to: number, k: number, labelA: Pair, labelB: Pair,
 *   labelS: Pair, story: Pair }} EquivCore
 * @typedef {{ a: number, b: number, second: number, k: number, story: Pair }} EquivTransfer
 * @typedef {EquivCore & { transfer: EquivTransfer }} EquivConfig
 */

/** @param {any} t @returns {EquivTransfer | null} */
function transferOf(t) {
  if (!t || typeof t !== "object") return null;
  const a = Number(t.a);
  const b = Number(t.b);
  const second = Number(t.second);
  const story = cleanText(t.story, 160);
  if (!okInt(a, 1, 9) || !okInt(b, 1, 9) || a === b || !okInt(second, 2, 99) || !story) return null;
  if (second % b !== 0) return null;
  const k = second / b;
  return k >= 2 && k <= 9 && a * k <= 99 ? { a, b, second, k, story } : null;
}

/**
 * @param {any} cfg
 * @returns {EquivConfig | null}
 */
export function validateRatioEquiv(cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  const a = Number(cfg.a);
  const b = Number(cfg.b);
  const from = Number(cfg.from);
  const to = Number(cfg.to);
  // a === b would make "add the same to both" accidentally equivalent.
  if (!okInt(a, 1, 9) || !okInt(b, 1, 9) || a === b) return null;
  if (!okInt(from, 2, 20) || !okInt(to, 4, 400) || to % from !== 0) return null;
  const k = to / from;
  if (k < 2 || k > MAX_FACTOR - 2) return null;
  const labelA = cleanText(cfg.labelA, 14);
  const labelB = cleanText(cfg.labelB, 14);
  const labelS = cleanText(cfg.labelS, 14);
  const story = cleanText(cfg.story, 200);
  const transfer = transferOf(cfg.transfer);
  if (!labelA || !labelB || !labelS || !story || !transfer) return null;
  if (transfer.a === a && transfer.b === b) return null;
  return { a, b, from, to, k, labelA, labelB, labelS, story, transfer };
}

/** Two pairs are equivalent when the same factor takes each first term to the other. */
export const isEquivalent = (
  /** @type {{ a: number, b: number }} */ p,
  /** @type {{ a: number, b: number }} */ q,
) => p.a * q.b === p.b * q.a;

/** The plausible-but-wrong card: the first number scaled by k, the second by one factor less. */
export const wrongCard = (
  /** @type {number} */ a,
  /** @type {number} */ b,
  /** @type {number} */ k,
) => ({
  a: a * k,
  b: b * (k - 1),
});

/**
 * "How many times bigger?": the right factor (to ÷ from), the difference, the
 * sum and the product.
 * @param {number} from
 * @param {number} to
 */
export function factorChoices(from, to) {
  const raw = [
    { n: to / from, correct: true, kind: "right" },
    { n: to - from, correct: false, kind: "difference" },
    { n: to + from, correct: false, kind: "sum" },
    { n: to * from, correct: false, kind: "product" },
  ];
  const seen = new Set();
  return raw.filter((o) => !seen.has(o.n) && seen.add(o.n));
}

/**
 * "2 : 5 = ? : 15": the missing first term and the named mistakes.
 * @param {EquivTransfer} t
 */
export function missingChoices(t) {
  const raw = [
    { n: t.a * t.k, correct: true, kind: "right" },
    { n: t.a + (t.second - t.b), correct: false, kind: "additive" },
    { n: t.k, correct: false, kind: "factor" },
    { n: t.second - t.b, correct: false, kind: "difference" },
  ];
  const seen = new Set();
  return raw.filter((o) => o.n > 0 && !seen.has(o.n) && seen.add(o.n));
}

const mix = (/** @type {number} */ x, /** @type {number} */ y) => `${x} : ${y}`;

/**
 * Every bilingual line the play speaks, from the validated config.
 * @param {EquivConfig} v
 */
export function ratioEquivCopy(v) {
  const { a, b, from, to, k, labelA: A, labelB: B, labelS: S, story } = v;
  const t = v.transfer;
  const card = wrongCard(a, b, k);
  return {
    card,
    title: {
      en: `Equivalent ratios: ${mix(a, b)} = ${mix(a * k, b * k)}`,
      es: `Razones equivalentes: ${mix(a, b)} = ${mix(a * k, b * k)}`,
    },
    ariaLabel: {
      en: `A ratio table and two strips. The recipe ${mix(a, b)} (${A.en} to ${B.en}) serving ${from} becomes ${mix(a * k, b * k)} serving ${to} when both numbers are multiplied by ${k}; the two strips show the same mix.`,
      es: `Una tabla de razones y dos barras. La receta ${mix(a, b)} (${A.es} a ${B.es}) para ${from} se vuelve ${mix(a * k, b * k)} para ${to} al multiplicar los dos números por ${k}; las dos barras muestran la misma mezcla.`,
    },
    printSummary: {
      en: `${story.en} The scale factor is ${to} ÷ ${from} = ${k}. Multiply BOTH numbers by ${k}: ${a} × ${k} = ${a * k} and ${b} × ${k} = ${b * k}, so ${mix(a, b)} and ${mix(a * k, b * k)} are equivalent ratios. Dividing both by ${k} goes back. A card such as ${mix(card.a, card.b)} uses ×${k} on one number and ×${k - 1} on the other, so it is not equivalent.`,
      es: `${story.es} El factor de escala es ${to} ÷ ${from} = ${k}. Multiplica LOS DOS números por ${k}: ${a} × ${k} = ${a * k} y ${b} × ${k} = ${b * k}, así que ${mix(a, b)} y ${mix(a * k, b * k)} son razones equivalentes. Dividir los dos entre ${k} regresa. Una tarjeta como ${mix(card.a, card.b)} usa ×${k} en un número y ×${k - 1} en el otro, así que no es equivalente.`,
    },
    head: { s: S, a: A, b: B },
    situate: {
      en: `${story.en} The strip shows the mix: ${mix(a, b)}.`,
      es: `${story.es} La barra muestra la mezcla: ${mix(a, b)}.`,
    },
    predict: {
      say: {
        en: `The recipe serves ${from}. The new row must serve ${to}. Predict the scale factor: how many times bigger is the recipe?`,
        es: `La receta rinde para ${from}. La fila nueva debe rendir para ${to}. Predice el factor de escala: ¿cuántas veces más grande es la receta?`,
      },
      question: { en: "The scale factor is", es: "El factor de escala es" },
      cues: {
        difference: {
          en: `${to - from} is how many MORE ${S.en}. Check it: would making the recipe ${to - from} times serve ${to}?`,
          es: `${to - from} es cuántas ${S.es} MÁS. Compruébalo: ¿serviría a ${to} hacer la receta ${to - from} veces?`,
        },
        sum: {
          en: `That would serve far more than ${to} ${S.en}. What do you do to ${from} to get ${to}?`,
          es: `Eso serviría a muchas más de ${to} ${S.es}. ¿Qué haces con ${from} para obtener ${to}?`,
        },
        product: {
          en: `${from} × ${to} = ${from * to}: a huge pot. How many times bigger than ${from} is ${to}?`,
          es: `${from} × ${to} = ${from * to}: una olla enorme. ¿Cuántas veces más grande que ${from} es ${to}?`,
        },
      },
      ok: {
        en: `Yes: ${to} ÷ ${from} = ${k}. The recipe is ${k} times bigger, so the scale factor is ${k}.`,
        es: `Sí: ${to} ÷ ${from} = ${k}. La receta es ${k} veces más grande, así que el factor de escala es ${k}.`,
      },
    },
    scale: {
      say: {
        en: `Scale each ingredient with its own slider. The strips show the mix: when the boundaries line up, the mix is the same. Find the factor the soup needs.`,
        es: `Escala cada ingrediente con su propio control. Las barras muestran la mezcla: cuando los límites coinciden, la mezcla es la misma. Halla el factor que necesita la sopa.`,
      },
      labelA: { en: `${A.en} ×`, es: `${A.es} ×` },
      labelB: { en: `${B.en} ×`, es: `${B.es} ×` },
      status: (/** @type {number} */ x, /** @type {number} */ y) => ({
        en:
          x === y
            ? `Same factor, × ${x} on both: ${mix(a * x, b * y)}. The mix matches ${mix(a, b)}, but this is not yet the soup that serves ${to}.`
            : `× ${x} on ${A.en} but × ${y} on ${B.en}: ${mix(a * x, b * y)}. The boundaries do not line up, so the mix changed.`,
        es:
          x === y
            ? `Mismo factor, × ${x} en los dos: ${mix(a * x, b * y)}. La mezcla coincide con ${mix(a, b)}, pero aún no es la sopa para ${to}.`
            : `× ${x} en ${A.es} pero × ${y} en ${B.es}: ${mix(a * x, b * y)}. Los límites no coinciden, así que la mezcla cambió.`,
      }),
      progress: (/** @type {boolean} */ sawDifferent) => ({
        en: sawDifferent
          ? `Now set BOTH sliders to the scale factor for ${to} ${S.en}.`
          : "First try different factors on the two sliders and watch the strips.",
        es: sawDifferent
          ? `Ahora pon LOS DOS controles en el factor de escala para ${to} ${S.es}.`
          : "Primero prueba factores distintos en los dos controles y mira las barras.",
      }),
      done: {
        en: `× ${k} on both: ${a} × ${k} = ${a * k} and ${b} × ${k} = ${b * k}. The mix is the same, and the row serves ${to}.`,
        es: `× ${k} en los dos: ${a} × ${k} = ${a * k} y ${b} × ${k} = ${b * k}. La mezcla es la misma y la fila rinde para ${to}.`,
      },
    },
    connect: {
      say: {
        en: `Multiplying both by ${k} makes ${mix(a * k, b * k)}. Dividing both by ${k} goes back: ${mix(a * k, b * k)} ÷ ${k} = ${mix(a, b)}. To check, find the factor between corresponding terms: ${a} → ${a * k} is × ${k}, ${b} → ${b * k} is × ${k}. The same factor, so the ratios are equivalent.`,
        es: `Multiplicar los dos por ${k} da ${mix(a * k, b * k)}. Dividir los dos entre ${k} regresa: ${mix(a * k, b * k)} ÷ ${k} = ${mix(a, b)}. Para comprobar, halla el factor entre términos correspondientes: ${a} → ${a * k} es × ${k}, ${b} → ${b * k} es × ${k}. El mismo factor, así que las razones son equivalentes.`,
      },
    },
    check: {
      say: {
        en: `A helper writes ${mix(card.a, card.b)} for the same soup. Find the factor on ${A.en} and the factor on ${B.en}.`,
        es: `Un ayudante escribe ${mix(card.a, card.b)} para la misma sopa. Halla el factor en ${A.es} y el factor en ${B.es}.`,
      },
      question: {
        en: `Is ${mix(card.a, card.b)} equivalent to ${mix(a, b)}?`,
        es: `¿${mix(card.a, card.b)} es equivalente a ${mix(a, b)}?`,
      },
      options: placeAway(
        [
          {
            label: {
              en: `No — × ${k} on one number, × ${k - 1} on the other`,
              es: `No: × ${k} en un número y × ${k - 1} en el otro`,
            },
            correct: true,
            cue: null,
          },
          {
            label: { en: "Yes — both numbers got bigger", es: "Sí: los dos números crecieron" },
            correct: false,
            cue: {
              en: `Bigger is not the test. Compare the two arrows: is the factor on ${A.en} the same as on ${B.en}?`,
              es: `Crecer no es la prueba. Compara las dos flechas: ¿el factor de ${A.es} es el mismo que el de ${B.es}?`,
            },
          },
          {
            label: { en: "Not enough to tell", es: "No hay suficiente para saber" },
            correct: false,
            cue: {
              en: `You have what you need: ${a} → ${card.a} and ${b} → ${card.b}. What was each one multiplied by?`,
              es: `Tienes lo necesario: ${a} → ${card.a} y ${b} → ${card.b}. ¿Por cuánto se multiplicó cada uno?`,
            },
          },
        ],
        a + b + k,
      ),
      ok: {
        en: `No: ${a} × ${k} = ${card.a} but ${b} × ${k - 1} = ${card.b}. Different factors change the mix, so ${mix(card.a, card.b)} is not equivalent to ${mix(a, b)}.`,
        es: `No: ${a} × ${k} = ${card.a} pero ${b} × ${k - 1} = ${card.b}. Factores distintos cambian la mezcla, así que ${mix(card.a, card.b)} no es equivalente a ${mix(a, b)}.`,
      },
    },
    transfer: {
      say: {
        en: `${t.story.en} Find the missing first number: ${mix(t.a, t.b)} = ? : ${t.second}.`,
        es: `${t.story.es} Halla el primer número que falta: ${mix(t.a, t.b)} = ? : ${t.second}.`,
      },
      question: {
        en: `${mix(t.a, t.b)} = ? : ${t.second}, so ? =`,
        es: `${mix(t.a, t.b)} = ? : ${t.second}, así que ? =`,
      },
      cues: {
        additive: {
          en: `Adding the same amount to both numbers is not scaling. What was ${t.b} multiplied by to make ${t.second}?`,
          es: `Sumar lo mismo a los dos números no es escalar. ¿Por cuánto se multiplicó ${t.b} para obtener ${t.second}?`,
        },
        factor: {
          en: `${t.k} is the scale factor, not the new first number. What do you do with ${t.a} and the factor?`,
          es: `${t.k} es el factor de escala, no el primer número nuevo. ¿Qué haces con ${t.a} y el factor?`,
        },
        difference: {
          en: `${t.second - t.b} is how much MORE ${t.second} is than ${t.b}. Scaling multiplies: what times ${t.b} is ${t.second}?`,
          es: `${t.second - t.b} es cuánto MÁS es ${t.second} que ${t.b}. Escalar multiplica: ¿qué número por ${t.b} da ${t.second}?`,
        },
      },
      ok: {
        en: `Yes: ${t.second} ÷ ${t.b} = ${t.k}, and ${t.a} × ${t.k} = ${t.a * t.k}. So ${mix(t.a, t.b)} = ${mix(t.a * t.k, t.second)}.`,
        es: `Sí: ${t.second} ÷ ${t.b} = ${t.k}, y ${t.a} × ${t.k} = ${t.a * t.k}. Así que ${mix(t.a, t.b)} = ${mix(t.a * t.k, t.second)}.`,
      },
      explain: {
        en: "Explain: how do you know two ratios are equivalent?",
        es: "Explica: ¿cómo sabes que dos razones son equivalentes?",
      },
      frame: {
        en: "Two ratios are equivalent when ___. To find a missing number I divide ___ by ___ and then multiply.",
        es: "Dos razones son equivalentes cuando ___. Para hallar un número que falta divido ___ entre ___ y luego multiplico.",
      },
      first: { en: "first number", es: "primer número" },
      second: { en: "second number", es: "segundo número" },
    },
  };
}
