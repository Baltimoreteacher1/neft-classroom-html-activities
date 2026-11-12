// Shared helpers for the K–5 authored explanations (band-k2.js, band-35.js).
// Misconception detectors read the bank's own question shapes; every detector is wrapped by `mis()` so it
// (1) never fires on a transfer item, (2) never fires on an answer the app grades as right, and (3) never throws.
import { validateAnswer } from "../../problem-bank.js";

export const L = (en, es) => ({ en, es });

export function mis(id, detect, en, es) {
  return {
    id,
    detect(item, raw) {
      if (!item || item.transfer || raw == null || String(raw).trim() === "")
        return false;
      try {
        if (validateAnswer(raw, item)) return false;
        return Boolean(detect(item, String(raw).trim()));
      } catch {
        return false;
      }
    },
    feedback: L(en, es),
  };
}

// Numbers --------------------------------------------------------------------------------------------------------
const clean = (s) =>
  String(s ?? "")
    .replaceAll("−", "-")
    .replace(/(\d),(?=\d{3}\b)/g, "$1");
export const q = (item) => clean(item.question);
/** Every number in a question, in order (decimals kept, thousands commas removed). */
export const nums = (text) =>
  (clean(text).match(/\d+(?:\.\d+)?/g) || []).map(Number);
/** A typed whole or decimal number, or NaN. */
export function num(raw) {
  const s = clean(raw)
    .replace(/\s+/g, "")
    .replace(/[°¢]|cents?$/i, "");
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : Number.NaN;
}
export const isNum = (raw, value) =>
  Number.isFinite(value) &&
  Math.abs(num(raw) - value) < 1e-9 &&
  Number.isFinite(num(raw));
/** "a op b = ?" → [a, op, b] (op normalised to + - × ÷) or null. */
export function binop(item) {
  const m = q(item).match(
    /^\s*(\d+(?:\.\d+)?)\s*([+\-×÷])\s*(\d+(?:\.\d+)?)\s*=\s*\?/,
  );
  return m ? [Number(m[1]), m[2], Number(m[3])] : null;
}
/** A typed fraction, whole number or mixed number as a value, or NaN. */
export function fracValue(raw) {
  const s = clean(raw).trim().replace(/\s+/g, " ");
  let m = s.match(/^(\d+) (\d+)\/(\d+)$/);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (m) return Number(m[2]) ? Number(m[1]) / Number(m[2]) : Number.NaN;
  return num(s);
}
export const isFrac = (raw, value) =>
  Number.isFinite(value) && Math.abs(fracValue(raw) - value) < 1e-9;
export const sym = (a, b) => (a < b ? "<" : a > b ? ">" : "=");
const digits = (n) => String(n).split("").reverse().map(Number);
const fromDigits = (ds) => Number(ds.slice().reverse().join("")) || 0;
/** Column addition that never regroups: each column keeps only its ones digit. */
export function addNoCarry(a, b) {
  const x = digits(a);
  const y = digits(b);
  const out = [];
  for (let i = 0; i < Math.max(x.length, y.length); i += 1)
    out.push(((x[i] || 0) + (y[i] || 0)) % 10);
  return fromDigits(out);
}
/** Column subtraction that takes the smaller digit from the larger in every column. */
export function subFlip(a, b) {
  const x = digits(a);
  const y = digits(b);
  return fromDigits(x.map((d, i) => Math.abs(d - (y[i] || 0))));
}
/** Column subtraction that regroups (adds 10) but never takes the ten away from the next column. */
export function subNoDecrement(a, b) {
  const x = digits(a);
  const y = digits(b);
  return fromDigits(
    x.map((d, i) => (d < (y[i] || 0) ? d + 10 - y[i] : d - (y[i] || 0))),
  );
}
/** Decimal places of a number written in the question. */
export const places = (x) => (String(x).split(".")[1] || "").length;
export const round = (x, p = 10) => Math.round(x * 10 ** p) / 10 ** p;

// "What time is m minutes after h:mm?" ---------------------------------------------------------------------------
export function laterTime(item) {
  const m = q(item).match(/(\d+) minutes after (\d{1,2}):(\d{2})/);
  return m ? { add: Number(m[1]), h: Number(m[2]), m: Number(m[3]) } : null;
}
export function typedTime(raw) {
  const m = String(raw)
    .trim()
    .match(/^(\d{1,2}):(\d{1,3})$/);
  return m ? { h: Number(m[1]), m: Number(m[2]) } : null;
}
/** Over-60 minutes: 8:45 + 15 written as 8:60. */
export const minutesOver60 = (t, raw) => {
  const r = typedTime(raw);
  return Boolean(
    t && r && t.m + t.add >= 60 && r.h === t.h && r.m === t.m + t.add,
  );
};
/** Minutes wrapped past 60 but the hour never moved: 8:45 + 40 written as 8:25. */
export const hourStuck = (t, raw) => {
  const r = typedTime(raw);
  return Boolean(
    t && r && t.m + t.add >= 60 && r.h === t.h && r.m === (t.m + t.add) % 60,
  );
};

// Place value questions: "What digit / What is the value of the digit in the X place of N?" -----------------------
const PLACES = {
  ones: 1,
  tens: 10,
  hundreds: 100,
  thousands: 1000,
  "ten-thousands": 10000,
  "hundred-thousands": 100000,
};
export function placeQuestion(item) {
  const text = q(item);
  const m = text.match(/in the ([a-z-]+) place of (\d+)\?/);
  const place = m && PLACES[m[1]];
  if (!place) return null;
  const n = Number(m[2]);
  const digitAt = (p) => Math.floor(n / p) % 10;
  return { n, place, digit: digitAt(place), value: /value of the digit/.test(text), digitAt };
}

// Rounding: "Round N to the nearest ten|hundred|thousand." ----------------------------------------------------------
export function roundQuestion(item) {
  const m = q(item).match(
    /Round (\d+) to the nearest (ten|hundred|thousand)\b/,
  );
  if (!m) return null;
  return {
    n: Number(m[1]),
    to: { ten: 10, hundred: 100, thousand: 1000 }[m[2]],
  };
}

// Fractions "a/b = □/d" or "a/b = c/□" ---------------------------------------------------------------------------
export function equivQuestion(item) {
  const m = q(item).match(/^(\d+)\/(\d+)\s*=\s*(\d+|□)\/(\d+|□)$/);
  if (!m) return null;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return m[3] === "□"
    ? { a, b, known: Number(m[4]), missing: "top" }
    : { a, b, known: Number(m[3]), missing: "bottom" };
}
export function compareFractions(item) {
  const m = q(item).match(/^(\d+)\/(\d+)\s*___\s*(\d+)\/(\d+)$/);
  return m ? m.slice(1).map(Number) : null;
}
export function compareWholes(item) {
  const m = q(item).match(/^(\d+)\s*___\s*(\d+)$/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}
export const right = (item) => String(item.answers?.[0] ?? "");

// Shared detectors used by several skills (one definition, so one wording) ----------------------------------------
export const compareReversed = (parse) =>
  mis(
    "reversed",
    (item, raw) => {
      const p = parse(item);
      const r = right(item);
      return p && r !== "=" && raw === (r === "<" ? ">" : "<");
    },
    "The symbol points the wrong way. The open side faces the BIGGER number, and the point faces the smaller one. Read it left to right: “is less than” or “is greater than.”",
    "El símbolo apunta al revés. El lado abierto mira al número MAYOR y la punta mira al menor. Léelo de izquierda a derecha: «es menor que» o «es mayor que».",
  );
export const compareEqual = (parse) =>
  mis(
    "said-equal",
    (item, raw) => Boolean(parse(item)) && right(item) !== "=" && raw === "=",
    "These two amounts are not the same, so = does not fit. Find which one is more, then choose < or >.",
    "Estas dos cantidades no son iguales, así que = no sirve. Busca cuál es más y luego elige < o >.",
  );
