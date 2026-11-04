// Small helpers for writing experiences: every learner-facing string is a bilingual L(en, es).
import { L, R, Rational } from "./kernel.js";
import { decimalAddition, fractionAddition } from "./misconceptions.js";

export { L, R, Rational, decimalAddition, fractionAddition };

export const opt = (id, en, es, ok = false, whyEn = "", whyEs = "") => ({ id, text: L(en, es), ok, why: L(whyEn, whyEs) });
export const hint = (en, es) => L(en, es);
export const word = (id, en, es) => ({ id, text: L(en, es) });

// An ask step: graded false makes it a prediction that the journey revisits.
export const ask = (id, prompt, options, extra = {}) => ({ kind: "ask", id, prompt, options, ...extra });
export const task = (id, goal, check, hints = [], extra = {}) => ({ kind: "task", id, goal, check, hints, ...extra });
export const explain = (id, prompt, frames, ideas, extra = {}) => ({ kind: "explain", id, prompt, frames, ideas, need: 2, ...extra });
export const transfer = (id, make, extra = {}) => ({ kind: "transfer", id, make, ...extra });

export const idea = (id, words) => ({ id, words });
export const frame = (before, bank, after = ".") => ({
  before,
  after: typeof after === "string" ? L(after, after) : after,
  bank: bank.map((b, i) => ({ id: `w${i}`, text: b[0] })),
  ok: bank.flatMap((b, i) => (b[1] ? [`w${i}`] : [])),
});
// bank rows are [L(...), isCorrect]
export const w = (en, es, ok = false) => [L(en, es), ok];

export const done = (note) => ({ done: true, note });
export const notYet = (note, progress) => ({ done: false, note, progress });
export const gcd = (a, b) => (b ? gcd(b, a % b) : a);
