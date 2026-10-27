// Number-to-text helpers shared by prompts, hints, feedback and the interface. Amounts are exact fractions.
import { frac, toDecimalString, toMixedString } from "../../rational.js";

export const ms = toMixedString;

// "3/4 cup", "1 cup", "1 1/2 cups"  /  "3/4 de taza", "1 taza", "1 1/2 tazas"
export function cupsText(x, lang) {
  const text = toMixedString(x);
  const more = x.n > x.d;
  if (lang === "es") return x.n === x.d ? `${text} taza` : more ? `${text} tazas` : x.n > 0 && x.d > 1 ? `${text} de taza` : `${text} tazas`;
  return more ? `${text} cups` : `${text} cup`;
}

export const decimalOf = (x) => toDecimalString(x) ?? toMixedString(x);
export const signed = (x) => (x.n > 0 ? `+${toMixedString(x)}` : toMixedString(x));
export const tolText = (x) => toDecimalString(x);

// 3 apart from the answer: used to keep worked examples from echoing the round's own answer.
export const wordIn = (text, token) => new RegExp(`(?<![\\w/.,])${String(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w/.])`).test(text);
export const one = frac(1);
