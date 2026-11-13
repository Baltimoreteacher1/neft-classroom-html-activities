// Spanish for the practice bank's own wording: the hint, the worked steps and the explanation a skill's generator
// writes for one problem. Generators write English only, so a sentence is matched by its shape: every number is
// lifted out in reading order, the rest is looked up in bank-es-data.js, and the numbers go back in. A line with no
// words (an equation such as "3 × 4 = 12") reads the same in both languages and is returned unchanged. null means
// no Spanish exists, and the caller then shows the English marked "en inglés" rather than hiding it.
import { isWordy } from "../question-es.js";
import { BANK_ES } from "./bank-es-data.js";

// The same number shape in the sentence key and in the fill. A list comma ("2, 3, 4", "into 1, so") is swallowed
// by its number and travels with it; the fill below takes it back off where the Spanish writes its own.
const NUMBER = /-?\d[\d,]*(?:\.\d+)?/g;
// "The answer is x + 3." / "The answer is c ≤ 12." / "The answer is B.": only symbols, numbers and one-letter variables.
const ANSWER = /^The answer is (?:[A-B]|(?:[^A-Za-z]|(?<![A-Za-z])[a-z](?![A-Za-z]))*)\.?$/;

export const sentenceKey = (text) => {
  const numbers = [];
  const key = String(text).replace(NUMBER, (n) => (numbers.push(n), `{${numbers.length}}`));
  return { key, numbers };
};

export function bankEs(text) {
  const raw = String(text ?? "");
  if (!raw.trim() || !isWordy(raw)) return raw;
  if (ANSWER.test(raw)) return raw.replace(/^The answer is /, "La respuesta es ");
  const { key, numbers } = sentenceKey(raw);
  const es = BANK_ES[key];
  if (es === undefined) return null;
  // A number that carries its list comma gives it up when the Spanish already puts a comma or stop right after it.
  return es.replace(/\{(\d+)\}/g, (whole, n, at) => {
    const number = numbers[Number(n) - 1];
    if (number === undefined) return whole;
    return /[,;.:]/.test(es[at + whole.length] ?? "") ? number.replace(/,+$/, "") : number;
  });
}

// A list of lines (steps) in Spanish, or null when any line has none: half a worked solution in each language
// would read worse than all of it marked English.
export const stepsEs = (steps) => {
  const out = (steps || []).map(bankEs);
  return out.every((line) => line !== null) ? out : null;
};
