// Words for the fraction-division figure, in English and in Spanish as a mathematics teacher says them (not word for word).
// Context per lab key: what the supply is measured in and what one share is called (the lab's own portionNoun).

/** @typedef {"en" | "es"} Lang */
/** @typedef {{ en: [string, string], es: [string, string], g: "m" | "f" }} Noun  [singular, plural] and the Spanish gender */

/**
 * @typedef {object} Context
 * @property {Noun} unit what the supply is measured in
 * @property {Noun} noun what one share is called
 * @property {"multiply" | "flip" | "leftover"} wrong the well-known wrong move this lesson family shows
 * @property {Array<[string, string]>} labels [en, es] for the three controls
 */

/** @type {Record<string, Context>} */
export const CONTEXT = {
  "fraction:servings": {
    unit: { en: ["cup", "cups"], es: ["taza", "tazas"], g: "f" },
    noun: { en: ["serving", "servings"], es: ["porción", "porciones"], g: "f" },
    wrong: "multiply",
    labels: [
      ["Supply (cups)", "Total (tazas)"],
      ["Serving size: numerator", "Tamaño de la porción: numerador"],
      ["Serving size: denominator", "Tamaño de la porción: denominador"],
    ],
  },
  "fraction:ribbon": {
    unit: { en: ["unit", "units"], es: ["unidad", "unidades"], g: "f" },
    noun: { en: ["piece", "pieces"], es: ["trozo", "trozos"], g: "m" },
    wrong: "leftover",
    labels: [
      ["Ribbon length (units)", "Largo de la cinta (unidades)"],
      ["Piece size: numerator", "Tamaño del trozo: numerador"],
      ["Piece size: denominator", "Tamaño del trozo: denominador"],
    ],
  },
  "fraction:field": {
    unit: { en: ["liter", "liters"], es: ["litro", "litros"], g: "m" },
    noun: { en: ["group", "groups"], es: ["grupo", "grupos"], g: "m" },
    wrong: "flip",
    labels: [
      ["Supply (liters)", "Total (litros)"],
      ["Group size: numerator", "Tamaño del grupo: numerador"],
      ["Group size: denominator", "Tamaño del grupo: denominador"],
    ],
  },
};

const NUM = {
  en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"],
  es: ["cero", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce"],
};
/** @type {Record<Lang, Record<number, [string, string]>>} */
const DEN = {
  en: { 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["fourth", "fourths"], 5: ["fifth", "fifths"], 6: ["sixth", "sixths"], 7: ["seventh", "sevenths"], 8: ["eighth", "eighths"], 9: ["ninth", "ninths"], 10: ["tenth", "tenths"] },
  es: { 2: ["medio", "medios"], 3: ["tercio", "tercios"], 4: ["cuarto", "cuartos"], 5: ["quinto", "quintos"], 6: ["sexto", "sextos"], 7: ["séptimo", "séptimos"], 8: ["octavo", "octavos"], 9: ["noveno", "novenos"], 10: ["décimo", "décimos"] },
};

/** "three fourths", "un tercio"; never digits over digits. @param {number} n @param {number} d @param {Lang} lang */
export function fracWords(n, d, lang) {
  const den = DEN[lang][d];
  if (!den || n < 1 || n > 12) return lang === "es" ? `${n} de ${d} partes iguales` : `${n} out of ${d} equal parts`;
  return `${NUM[lang][n]} ${den[n === 1 ? 0 : 1]}`;
}

/** "7 and one third", "7 y un tercio", "5". @param {import("../exact.mjs").Rat} r @param {Lang} lang */
export function mixedWords(r, lang) {
  const whole = r.n / r.d;
  const rem = r.n % r.d;
  if (rem === 0n) return String(whole);
  const f = fracWords(Number(rem), Number(r.d), lang);
  if (whole === 0n) return f;
  return lang === "es" ? `${whole} y ${f}` : `${whole} and ${f}`;
}

/** @param {Context} ctx @param {Lang} lang @param {boolean} plural */
export const unitFor = (ctx, lang, plural) => ctx.unit[lang][plural ? 1 : 0];
/** @param {Context} ctx @param {Lang} lang @param {boolean} plural */
export const nounFor = (ctx, lang, plural) => ctx.noun[lang][plural ? 1 : 0];

/** "5 and a half cups", "half a cup", "5 tazas y media": the supply is always a whole number of halves. @param {import("../exact.mjs").Rat} a @param {Context} ctx @param {Lang} lang */
export function supplyWords(a, ctx, lang) {
  const whole = Number(a.n / a.d);
  const half = a.d === 2n;
  const es = lang === "es";
  const halfWord = es ? (ctx.unit.g === "f" ? "media" : "medio") : "a half";
  if (!half) return `${whole} ${unitFor(ctx, lang, whole !== 1)}`;
  if (whole === 0) return es ? `${halfWord} ${unitFor(ctx, lang, false)}` : `half a ${unitFor(ctx, lang, false)}`;
  return es ? `${whole} ${unitFor(ctx, lang, whole !== 1)} y ${halfWord}` : `${whole} and ${halfWord} ${unitFor(ctx, lang, true)}`;
}

/** "three fourths of a cup", "tres cuartos de taza". @param {number} b @param {number} c @param {Context} ctx @param {Lang} lang */
export const servingWords = (b, c, ctx, lang) => (lang === "es" ? `${fracWords(b, c, lang)} de ${unitFor(ctx, lang, false)}` : `${fracWords(b, c, lang)} of a ${unitFor(ctx, lang, false)}`);

/** "complete" agreeing with the noun. @param {Context} ctx @param {Lang} lang @param {boolean} plural */
export function completeWord(ctx, lang, plural) {
  if (lang === "en") return "complete";
  return `complet${ctx.noun.g === "m" ? "o" : "a"}${plural ? "s" : ""}`;
}
/** Spanish "un/una" and "otro/otra" for the noun. @param {Context} ctx */
export const unA = (ctx) => (ctx.noun.g === "m" ? "un" : "una");
/** @param {Context} ctx */
export const otherA = (ctx) => (ctx.noun.g === "m" ? "otro" : "otra");
