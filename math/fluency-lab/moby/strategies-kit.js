// Shared helpers for the strategy lessons: translatable text, fact normalising and the small builders that the
// lesson files use. Pure: no DOM, no clock, no randomness.
//
// Text is stored as { k, v }: `k` is the English sentence (it is also the key in ES_MOBY_STRATEGIES), `v` the
// {placeholders}. Nothing is translated until `say()` runs, so a lesson built in English still reads in Spanish
// the moment the learner switches language.
import { getLang, t } from "../i18n.js";
import { ES_MOBY_STRATEGIES } from "./i18n-es-strategies.js";

export const tx = (k, v = null) => ({ k, v });

// i18n.js `t()` first (the lead merges ES_MOBY_STRATEGIES there). The direct lookup keeps this layer readable in
// Spanish even before that merge, and is a no-op afterwards.
export function tr(k, v = null) {
  let text = t(k);
  if (text === k && getLang() === "es" && ES_MOBY_STRATEGIES[k] !== undefined)
    text = ES_MOBY_STRATEGIES[k];
  return v ? text.replace(/\{(\w+)\}/g, (m, name) => (name in v ? String(v[name]) : m)) : text;
}
export const say = (x) => (x == null ? "" : typeof x === "string" ? x : tr(x.k, x.v));
export const plural = (n, one, many, v = null) => tx(n === 1 ? one : many, v);

// ---- facts: { op: "+" | "−" | "×" | "÷", a, b } meaning "a op b = ?" ----
const OPS = {
  "+": "+",
  "-": "−",
  "−": "−",
  "–": "−",
  "*": "×",
  x: "×",
  X: "×",
  "×": "×",
  "/": "÷",
  "÷": "÷",
  ":": "÷",
};
const ASCII = { "+": "+", "−": "-", "×": "x", "÷": "/" };
export function normalizeFact(raw) {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const m = raw.replace(/\s+/g, "").match(/^(\d+)([+\-−–*x×/÷:])(\d+)(?:=\??\d*)?$/i);
    return m ? normalizeFact({ a: Number(m[1]), op: m[2], b: Number(m[3]) }) : null;
  }
  const op = OPS[raw.op ?? raw.operation ?? raw.o];
  const a = Number(raw.a ?? raw.x ?? raw.left);
  const b = Number(raw.b ?? raw.y ?? raw.right);
  if (!op || !Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) return null;
  if (op === "÷" && (b === 0 || a % b !== 0)) return null;
  if (op === "−" && b > a) return null;
  return { op, a, b };
}
export function answerOf(f) {
  if (f.op === "+") return f.a + f.b;
  if (f.op === "−") return f.a - f.b;
  if (f.op === "×") return f.a * f.b;
  return f.b ? f.a / f.b : null;
}
export const factText = (f) => `${f.a} ${f.op} ${f.b}`;
export const factKey = (f) => `${f.a}${ASCII[f.op]}${f.b}`;
export const sameFact = (f, g) =>
  f.op === g.op &&
  ((f.a === g.a && f.b === g.b) || ((f.op === "+" || f.op === "×") && f.a === g.b && f.b === g.a));
// The same fact as a lab item, so answer-masking code (step-leak.js) can judge any sentence about it.
export const itemOf = (f) => ({
  question: `${factText(f)} = ?`,
  answers: [String(answerOf(f))],
  displayAnswer: String(answerOf(f)),
});

// ---- model states ----
// Ten-frame cells: first `n1` of frame 1 get kind 1, first `n2` of frame 2 get kind 2 (frames hold 10 each).
export function cellsFor(n1, n2 = 0, frames = 2) {
  const cells = new Array(10 * frames).fill(0);
  for (let i = 0; i < n1; i += 1) cells[i] = 1;
  for (let i = 0; i < n2; i += 1) cells[10 + i] = frames > 1 ? 2 : 0;
  return cells;
}
export const frameCount = (cells, f) => cells.slice(f * 10, f * 10 + 10).filter(Boolean).length;
export const mat = (tens, ones, outT = 0, outO = 0) => ({ tens, ones, outT, outO });
export const hopsOf = (n, size) => new Array(n).fill(size);
export const sumOf = (list) => list.reduce((s, v) => s + v, 0);
export const range = (lo, hi) => Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);
