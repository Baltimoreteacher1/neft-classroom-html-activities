// The exact statistics behind every data figure. Pure and deterministic: whole-number observations in, rational results out.
// The lab's own rule is followed everywhere (curriculum/learning-labs/shared/models/util.mjs statistics()):
//   median  the middle value, or halfway between the two middle values
//   Q1, Q3  the median of the lower half and of the upper half; with an odd count the middle value belongs to neither half
//   MAD     the mean of the distances from the mean
import { int, Rat } from "../exact.mjs";

/** The labs start with eight observations, one control each, 0 to 50 in steps of 1. */
export const OBSERVATIONS = 8;
export const LIMITS = Object.freeze({ min: 0, max: 50, nMin: 3, nMax: 12, medianNMax: 9 });

/** What each lab model reports as its headline number (math.mjs evaluate() and data-median.mjs evaluate()). */
export const HEADLINE = Object.freeze({
  "data:histogram": "range",
  "data:median": "median",
  "data:box": "median",
  "data:spread": "iqr",
  "data:mean-mad": "mad",
  "data:outlier": "median",
});

const LABELS = {
  range: { en: "Range", es: "Rango" },
  median: { en: "Median", es: "Mediana" },
  iqr: { en: "Interquartile range (IQR)", es: "Rango intercuartílico (RIC)" },
  mad: { en: "Mean absolute deviation (MAD)", es: "Desviación media absoluta (DAM)" },
};

/**
 * The one number the lesson asks for, in the language given: what evaluate() returns for the key. value reads back exactly through parse().
 * @param {{ key: string, headline: Rat }} m @param {"en" | "es"} lang
 * @returns {{ label: string, value: string, approx?: boolean }}
 */
export function headlineOf(m, lang) {
  const d = decimal(m.headline);
  const label = LABELS[/** @type {"range" | "median" | "iqr" | "mad"} */ (HEADLINE[/** @type {keyof typeof HEADLINE} */ (m.key)])][lang === "es" ? "es" : "en"];
  return d.exact ? { label, value: d.text } : { label, value: d.text, approx: true };
}

/** The lab's controls for any data model: Observation 1..8, 0 to 50. */
export function dataControls() {
  return Array.from({ length: OBSERVATIONS }, (_, i) => ({ label: `Observation ${i + 1}`, labelEs: `Observación ${i + 1}`, min: LIMITS.min, max: LIMITS.max, step: 1 }));
}

/** @param {Rat} a @param {Rat} b */
export const cmp = (a, b) => {
  const l = a.n * b.d;
  const r = b.n * a.d;
  return l < r ? -1 : l > r ? 1 : 0;
};
/** @param {Rat} a */
export const abs = (a) => (a.n < 0n ? new Rat(-a.n, a.d) : a);
/** @param {Rat[]} xs */
export const sumOf = (xs) => xs.reduce((s, x) => s.add(x), int(0));

/**
 * Exact decimal text of a rational: "4.25", "−3", "0.03125". A value with no short decimal is rounded to two places and
 * flagged inexact so the caller writes ≈ instead of =.
 * @param {Rat} r @returns {{ text: string, exact: boolean }}
 */
export function decimal(r) {
  const neg = r.n < 0n;
  const an = neg ? -r.n : r.n;
  let rest = r.d;
  let twos = 0;
  let fives = 0;
  while (rest % 2n === 0n) {
    rest /= 2n;
    twos++;
  }
  while (rest % 5n === 0n) {
    rest /= 5n;
    fives++;
  }
  const exact = rest === 1n && Math.max(twos, fives) <= 6;
  const places = exact ? Math.max(twos, fives) : 2;
  const scale = 10n ** BigInt(places);
  const scaled = exact ? (an * scale) / r.d : (an * scale * 2n + r.d) / (2n * r.d);
  const digits = scaled.toString().padStart(places + 1, "0");
  const whole = places ? digits.slice(0, -places) : digits;
  const frac = places ? digits.slice(-places).replace(/0+$/, "") : "";
  const body = frac ? `${whole}.${frac}` : whole;
  return { text: (neg && scaled !== 0n ? "−" : "") + body, exact };
}
/** @param {Rat} r */
export const fmt = (r) => decimal(r).text;
/** "=" when the decimal is exact, "≈" when it was rounded. @param {Rat} r */
export const eqSign = (r) => (decimal(r).exact ? "=" : "≈");
/** "2, 4, 5" @param {Array<Rat | number>} xs */
export const list = (xs) => xs.map((x) => fmt(typeof x === "number" ? int(x) : x)).join(", ");
/** "2 + 4 + 5" with non-breaking spaces so a wrapped line never splits an operator from its number. @param {Array<Rat | number>} xs @param {string} [op] */
export const joined = (xs, op = "+") => xs.map((x) => fmt(typeof x === "number" ? int(x) : x)).join(` ${op} `);
/** Keep a short expression on one line. @param {string} s */
export const nb = (s) => s.replace(/ /g, " ");

/**
 * Median of an ordered list, with the sentence a student can read.
 * @param {Rat[]} sorted
 * @returns {{ value: Rat, mid: number[], expr: string }}
 */
export function medianOf(sorted) {
  const n = sorted.length;
  if (n % 2) {
    const k = (n - 1) / 2;
    return { value: sorted[k], mid: [k], expr: fmt(sorted[k]) };
  }
  const a = sorted[n / 2 - 1];
  const b = sorted[n / 2];
  const value = a.add(b).div(int(2));
  return { value, mid: [n / 2 - 1, n / 2], expr: `(${fmt(a)} + ${fmt(b)}) ÷ 2 ${eqSign(value)} ${fmt(value)}` };
}

/** @param {unknown} values @param {string} key */
function validate(values, key) {
  const nMax = key === "data:median" ? LIMITS.medianNMax : LIMITS.nMax;
  if (!Array.isArray(values) || values.length < LIMITS.nMin || values.length > nMax) throw new RangeError(`Use ${LIMITS.nMin} to ${nMax} observations.`);
  for (const v of values) {
    if (typeof v !== "number" || !Number.isInteger(v) || v < LIMITS.min || v > LIMITS.max) throw new RangeError(`Every observation is a whole number from ${LIMITS.min} to ${LIMITS.max}.`);
  }
}

/**
 * Everything the five data figures draw. Arrays named `sorted*` are in ascending order; `order[j]` is the entered position
 * (0-based) of the j-th smallest value, ties kept in the order entered.
 * @param {string} key @param {number[]} values
 */
export function dataModel(key, values) {
  if (!(key in HEADLINE)) throw new RangeError(`${key} is not a data model`);
  validate(values, key);
  const n = values.length;
  const order = values.map((_, i) => i).sort((a, b) => values[a] - values[b] || a - b);
  const sorted = order.map((i) => values[i]);
  const R = sorted.map((v) => int(v));
  const sum = sumOf(R);
  const mean = sum.div(int(n));
  const med = medianOf(R);
  const h = Math.floor(n / 2);
  const lower = R.slice(0, h);
  const upper = R.slice(n - h);
  const q1 = medianOf(lower);
  const q3 = medianOf(upper);
  const min = R[0];
  const max = R[n - 1];
  const range = max.sub(min);
  const iqr = q3.value.sub(q1.value);
  const devs = R.map((x) => {
    const dev = x.sub(mean);
    return { v: x, dev, abs: abs(dev) };
  });
  const absSum = sumOf(devs.map((d) => d.abs));
  const mad = absSum.div(int(n));
  const stats = { range, median: med.value, iqr, mad };
  const stat = /** @type {"range" | "median" | "iqr" | "mad"} */ (HEADLINE[/** @type {keyof typeof HEADLINE} */ (key)]);
  return {
    key,
    values: [...values],
    n,
    order,
    sorted,
    R,
    sum,
    mean,
    median: med,
    lower,
    upper,
    q1,
    q3,
    min,
    max,
    range,
    iqr,
    devs,
    absSum,
    mad,
    headline: stats[stat],
    axisMax: Math.max(10, Math.ceil(sorted[n - 1] / 10) * 10),
  };
}

/** @typedef {ReturnType<typeof dataModel>} DataModel */
