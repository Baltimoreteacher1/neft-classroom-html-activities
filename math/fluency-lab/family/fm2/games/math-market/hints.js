// Hint ladder. Tier 0 nudges, tier 1 names a strategy, tier 2 works a parallel or partial step with other numbers, and
// tier 3 (Show me) states the full solution. Tiers 0-2 are filtered so they never print the answer: each tier offers
// candidate texts and the first one that does not contain the round's answer is used; the last candidate is always
// number-free. Hints must be true for THIS round, so they branch on the round's own parameters. @fm2 FM-062
import { answerText, cartTotal, pieces, solveCart } from "./logic.js";
import { DENOM_NAMES } from "./copy.js";
import { aHints } from "./hints-a.js";
import { bHints } from "./hints-b.js";
import { h } from "./hint-tools.js";

const WORDS = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split(" ");
const WORDS_ES = "cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte".split(" ");

// Numeric values mentioned in a text: $x as dollars, x¢ as dollars/100, bare numbers raw, and number words up to twenty.
export function mentioned(text, lang = "en") {
  const values = new Set();
  for (const m of text.matchAll(/(\$)?(\d+(?:\.\d+)?)(¢)?/g)) {
    const value = Number(m[2]);
    values.add(value);
    if (m[3]) values.add(value / 100);
  }
  const lower = text.toLowerCase();
  for (const list of [lang === "es" ? WORDS_ES : WORDS]) list.forEach((word, i) => new RegExp(`(?<![a-záéíóúñ])${word}(?![a-záéíóúñ])`).test(lower) && values.add(i));
  return values;
}

export function leaks(round, copy) {
  const answer = answerText(round);
  const wanted = mentioned(answer);
  const words = answer.split(/[^A-Za-zÁ-ú]+/).filter((w) => w.length > 3);
  for (const lang of ["en", "es"]) {
    const text = copy[lang];
    if ([...mentioned(text, lang)].some((value) => wanted.has(value))) return true;
    if (words.some((w) => text.toLowerCase().includes(w.toLowerCase()) && round.kind === "pick")) return true;
  }
  return false;
}

export const piecesText = (list) => {
  const counts = new Map();
  for (const piece of list) counts.set(piece, (counts.get(piece) || 0) + 1);
  const part = (lang) => [...counts].map(([piece, n]) => `${DENOM_NAMES[piece][lang]} × ${n}`).join(", ");
  return h(part("en"), part("es"));
};

const TABLE = { ...aHints, ...bHints };

export function hint(round, tier) {
  const spec = TABLE[round.skillId];
  if (!spec) throw new RangeError(`No hints for ${round.skillId}`);
  if (tier >= 3) {
    // The full solution always ends by stating the answer in the form answerText() uses.
    const full = spec[3](round, { pieces, solveCart, cartTotal, piecesText });
    const answer = answerText(round);
    const say = (text) => (text.includes(answer) ? text : `${text} (${answer})`);
    return h(say(`Solution: ${full.en}`), say(`Solución: ${full.es}`));
  }
  const candidates = [spec[tier](round)].flat();
  return candidates.find((copy) => !leaks(round, copy)) || candidates.at(-1);
}
