// headline() and wrong() for the ratio figures: the one number the lesson asks for, and the wrong result of the move the figure draws as
// its dashed "not this" card (null exactly when that card is not drawn). Values are strings shared/motion/exact.mjs parse() reads exactly.
import { exactText, txt } from "./ratios-calc.mjs";

/** @typedef {"en" | "es"} Lang */
const T = (/** @type {Lang} */ lang) => (/** @type {string} */ en, /** @type {string} */ es) => (lang === "es" ? es : en);

/** @param {ReturnType<typeof import("./ratios-calc.mjs").tapeModel>} m @param {Lang} lang */
export const tapeHeadline = (m, lang) => ({ label: T(lang)("How many cups are in the whole drink?", "¿Cuántas tazas hay en la bebida completa?"), value: String(m.total) });
/** The card is always drawn: a : b read as part to whole makes the second part the whole. @param {ReturnType<typeof import("./ratios-calc.mjs").tapeModel>} m @param {Lang} lang */
export const tapeWrong = (m, lang) => ({
  value: String(m.b),
  say: T(lang)(`Wrote ${m.a} : ${m.b} for part to whole, so the ${m.b} cups of water became the whole drink.`, `Escribió ${m.a} : ${m.b} para parte a todo, y las ${m.b} tazas de agua quedaron como la bebida completa.`),
});

/** @param {ReturnType<typeof import("./ratios-calc.mjs").doubleLine>} m @param {Lang} lang */
export const doubleHeadline = (m, lang) => ({ label: T(lang)("How many cups of juice for 1 cup of water?", "¿Cuántas tazas de jugo hay por 1 taza de agua?"), value: exactText(m.value) });
/** @param {ReturnType<typeof import("./ratios-calc.mjs").doubleLine>} m @param {Lang} lang */
export function doubleWrong(m, lang) {
  if (!m.wrong) return null;
  const { a, b, d } = m.wrong;
  return {
    value: exactText(a.div(b)),
    say: T(lang)(`Added ${d} to both amounts, ${m.a + d} : ${m.b + d}, instead of multiplying or dividing both by the same number.`, `Sumó ${d} a las dos cantidades, ${m.a + d} : ${m.b + d}, en vez de multiplicar o dividir las dos por el mismo número.`),
  };
}

/** @param {ReturnType<typeof import("./ratios-calc.mjs").compareModel>} m @param {Lang} lang */
export const compareHeadline = (m, lang) => ({ label: T(lang)("How much color for 1 cup of white?", "¿Cuánto color hay por 1 taza de blanco?"), value: exactText(m.value) });
/** @param {ReturnType<typeof import("./ratios-calc.mjs").compareModel>} m @param {Lang} lang */
export function compareWrong(m, lang) {
  if (!m.wrong) return null;
  const k = Math.abs(m.wrong.t);
  return {
    value: exactText(m.wrong.color.div(m.wrong.white)),
    say: T(lang)(
      `${m.wrong.t > 0 ? `Added ${k}` : `Took ${k} off`} both numbers of ${m.a} : ${m.b} to reach 5 cups of white, instead of multiplying or dividing.`,
      `${m.wrong.t > 0 ? `Sumó ${k}` : `Quitó ${k}`} a los dos números de ${m.a} : ${m.b} para llegar a 5 tazas de blanco, en vez de multiplicar o dividir.`,
    ),
  };
}

/** @param {ReturnType<typeof import("./ratios-calc.mjs").rateModel>} m @param {Lang} lang */
export const rateHeadline = (m, lang) => ({ label: T(lang)("What is the unit price, in dollars for 1 item?", "¿Cuál es el precio unitario, en dólares por 1 artículo?"), value: exactText(m.unit) });
/** @param {ReturnType<typeof import("./ratios-calc.mjs").rateModel>} m @param {Lang} lang */
export function rateWrong(m, lang) {
  if (!m.wrong) return null;
  return {
    value: exactText(m.wrong.dollars),
    say: T(lang)(`Took ${m.wrong.off} off both the dollars and the items instead of dividing by ${m.n}.`, `Quitó ${m.wrong.off} a los dólares y a los artículos en vez de dividir entre ${m.n}.`),
  };
}

/** @param {ReturnType<typeof import("./ratios-calc.mjs").graphModel>} m @param {Lang} lang */
export const graphHeadline = (m, lang) => ({ label: T(lang)(`How many passengers are on ${m.c} ${m.c === 1 ? "carriage" : "carriages"}?`, `¿Cuántos pasajeros hay en ${m.c} ${m.c === 1 ? "vagón" : "vagones"}?`), value: exactText(m.value) });
/** @param {ReturnType<typeof import("./ratios-calc.mjs").graphModel>} m @param {Lang} lang */
export function graphWrong(m, lang) {
  const w = m.wrong;
  if (!w) return null;
  if ("through" in w) {
    return {
      value: String(m.r * m.c),
      say: T(lang)(`Left out the ${m.s} passengers already aboard, treating the line as if it went through (0, 0).`, `Ignoró los ${m.s} pasajeros que ya estaban a bordo, como si la recta pasara por (0, 0).`),
    };
  }
  return {
    value: String(w.y),
    say: T(lang)(`Added ${w.add} to both the carriages and the passengers instead of multiplying both by ${m.c}.`, `Sumó ${w.add} a los vagones y a los pasajeros en vez de multiplicar los dos por ${m.c}.`),
  };
}

/** The upside-down factor is drawn for every length, so this is never null. @param {ReturnType<typeof import("./ratios-calc.mjs").convModel>} m @param {Lang} lang */
export const convHeadline = (m, lang) => {
  const to = m.scale ? T(lang)("inches", "pulgadas") : T(lang)("centimeters", "centímetros");
  return { label: T(lang)(`How many ${to} is it?`, `¿Cuántos ${to} son?`), value: exactText(m.result) };
};
/** @param {ReturnType<typeof import("./ratios-calc.mjs").convModel>} m @param {Lang} lang */
export const convWrong = (m, lang) => ({
  value: exactText(m.flipped),
  say: T(lang)(`Used the conversion factor upside down, so divided ${m.L} by ${txt(m.f)} instead of multiplying.`, `Usó el factor de conversión al revés, y dividió ${m.L} entre ${txt(m.f)} en vez de multiplicar.`),
});
