// The exponent-copies model: pure, deterministic, exact. Same input, same output; no DOM, no clock, no randomness.
//
// A power b^n is built in n steps. Each step makes `base` COPIES of the previous block:
//   step 1   one row of `base` dots
//   even n   copies stack vertically        (rows x cols = b^(n/2) x b^(n/2))
//   odd n    copies sit side by side         (rows x cols = b^((n-1)/2) x b^((n+1)/2))
// so every block is b^floor(n/2) rows by b^ceil(n/2) columns, and the dot at (row, col) belongs to exactly one copy.
// Everything a student reads (labels, the "k copies of m" line, the expanded form, the notation, the misconception
// check and the screen-reader text) is computed here from (base, exponent), never typed.
import { commas, parse, power } from "./exact.mjs";

export const LIMITS = Object.freeze({ baseMin: 1, baseMax: 12, expMin: 1, expMax: 8, dotCap: 256 });
export const DEFAULTS = Object.freeze({ base: 3, exponent: 4 });

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
/** Raised exponent: 4 -> "⁴". @param {number} n */
export const sup = (n) => String(n).replace(/\d/g, (d) => SUP[Number(d)]);

/**
 * Validate and clamp a student's input. Numbers outside the range are clamped (and reported); a value that is not a
 * whole number is rounded; anything that is not a finite number (text, NaN, empty) falls back to the default.
 * @param {unknown} base @param {unknown} exponent
 * @returns {{ base: number, exponent: number, adjusted: string[] }}
 */
export function clampInput(base, exponent) {
  /** @type {string[]} */
  const adjusted = [];
  /** @param {unknown} v @param {number} lo @param {number} hi @param {number} def @param {string} name */
  const one = (v, lo, hi, def, name) => {
    const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
    if (typeof n !== "number" || !Number.isFinite(n)) {
      adjusted.push(`${name}-invalid`);
      return def;
    }
    const r = Math.round(n);
    if (r !== n) adjusted.push(`${name}-rounded`);
    if (r < lo) {
      adjusted.push(`${name}-low`);
      return lo;
    }
    if (r > hi) {
      adjusted.push(`${name}-high`);
      return hi;
    }
    return r;
  };
  return {
    base: one(base, LIMITS.baseMin, LIMITS.baseMax, DEFAULTS.base, "base"),
    exponent: one(exponent, LIMITS.expMin, LIMITS.expMax, DEFAULTS.exponent, "exponent"),
    adjusted,
  };
}

/**
 * Which copy a dot belongs to when step n was made from step n-1 (0-based). Step 1 is a row of single-dot copies.
 * @param {number} base @param {number} n @param {number} row @param {number} col
 */
export function copyOf(base, n, row, col) {
  if (n === 1) return col;
  const prevRows = base ** Math.floor((n - 1) / 2);
  const prevCols = base ** Math.ceil((n - 1) / 2);
  return n % 2 === 0 ? Math.floor(row / prevRows) : Math.floor(col / prevCols);
}

/**
 * @typedef {object} Step
 * @property {number} n step number (number of factors)
 * @property {number} rows
 * @property {number} cols
 * @property {bigint} total dots in the block, exactly base^n
 * @property {bigint} previous dots in each copy (1 for step 1)
 * @property {"row" | "stack" | "side"} layout how the copies are joined
 * @property {"dots" | "blocks"} display dots up to dotCap units, labelled copy blocks above
 * @property {string} factors "3 × 3 × 3"
 * @property {string} equation "3 × 3 × 3 = 27" (step 1 is just the factor, "3")
 * @property {{ en: string, es: string }} copies "3 copies of 9"
 * @property {string | null} arrow "×3" (null for step 1: nothing came before)
 */

/**
 * @param {unknown} baseIn @param {unknown} exponentIn
 */
export function exponentModel(baseIn, exponentIn) {
  const { base, exponent, adjusted } = clampInput(baseIn, exponentIn);
  /** @type {Step[]} */
  const steps = [];
  for (let n = 1; n <= exponent; n++) {
    const total = power(base, n);
    const previous = power(base, n - 1);
    const factors = Array.from({ length: n }, () => String(base)).join(" × ");
    steps.push({
      n,
      rows: base ** Math.floor(n / 2),
      cols: base ** Math.ceil(n / 2),
      total,
      previous,
      layout: n === 1 ? "row" : n % 2 === 0 ? "stack" : "side",
      display: total > BigInt(LIMITS.dotCap) ? "blocks" : "dots",
      factors,
      equation: n === 1 ? factors : `${factors} = ${commas(total)}`,
      copies: {
        en: n === 1 ? `1 row of ${base}` : `${base} ${base === 1 ? "copy" : "copies"} of ${commas(previous)}`,
        es: n === 1 ? `1 fila de ${base}` : `${base} ${base === 1 ? "copia" : "copias"} de ${commas(previous)}`,
      },
      arrow: n === 1 ? null : `×${base}`,
    });
  }
  const value = power(base, exponent);
  const sum = BigInt(base) * BigInt(exponent);
  const expanded = steps[steps.length - 1].factors;
  return {
    base,
    exponent,
    adjusted,
    steps,
    value,
    valueText: commas(value),
    expanded,
    notation: `${base}${sup(exponent)}`,
    /** The "not b × n" check; null when the two happen to agree (2², 3¹) so it never states something untrue. */
    misconception: sum === value ? null : { product: sum, text: `${base}${sup(exponent)} is not ${base} × ${exponent} = ${commas(sum)}`, textEs: `${base}${sup(exponent)} no es ${base} × ${exponent} = ${commas(sum)}` },
    /** The exponent counts factors; it is not a number the base is multiplied by. */
    parts: { base, exponent },
  };
}

/** @typedef {ReturnType<typeof exponentModel>} ExponentModel */

/**
 * A complete text equivalent of the picture, in the student's language. Plain sentences, grade 6.
 * @param {ExponentModel} m @param {"en" | "es"} [lang]
 */
export function describe(m, lang = "en") {
  const es = lang === "es";
  const b = m.base;
  const lines = [];
  lines.push(es ? `Construimos ${m.notation} en ${m.exponent} ${m.exponent === 1 ? "paso" : "pasos"}. Cada paso hace ${b} ${b === 1 ? "copia" : "copias"} del bloque anterior.` : `We build ${m.notation} in ${m.exponent} ${m.exponent === 1 ? "step" : "steps"}. Each step makes ${b} ${b === 1 ? "copy" : "copies"} of the block before it.`);
  for (const s of m.steps) {
    const how = s.layout === "row" ? (es ? "una fila" : "one row") : s.layout === "stack" ? (es ? "las copias se apilan hacia abajo" : "the copies stack downward") : es ? "las copias van una al lado de otra" : "the copies sit side by side";
    const grid = es ? `${s.rows} ${s.rows === 1 ? "fila" : "filas"} por ${s.cols} ${s.cols === 1 ? "columna" : "columnas"}` : `${s.rows} ${s.rows === 1 ? "row" : "rows"} by ${s.cols} ${s.cols === 1 ? "column" : "columns"}`;
    const head = s.n === 1 ? (es ? `un factor, ${s.equation}` : `one factor, ${s.equation}`) : s.equation;
    lines.push(es ? `Paso ${s.n}: ${head}. ${s.copies.es}; ${how}. Bloque de ${grid}.` : `Step ${s.n}: ${head}. ${s.copies.en}; ${how}. A block of ${grid}.`);
  }
  lines.push(es ? `Forma desarrollada: ${m.expanded}. En ${m.notation}, la base ${m.base} es el factor y el exponente ${m.exponent} dice cuántos factores hay. Entonces ${m.notation} = ${m.valueText}.` : `Expanded form: ${m.expanded}. In ${m.notation}, the base ${m.base} is the factor and the exponent ${m.exponent} says how many factors. So ${m.notation} = ${m.valueText}.`);
  if (m.misconception) lines.push(es ? `${m.misconception.textEs}.` : `${m.misconception.text}.`);
  return lines.join(" ");
}

/**
 * Check a student's answer to "what is b^n?" by value: "81", "3^4", "3⁴", "3 × 3 × 3 × 3" and "81.0" all match.
 * Never compares strings. @param {ExponentModel} m @param {string} answer
 */
export function checkValue(m, answer) {
  const v = parse(answer);
  if (!v) return { ok: false, reason: "not-a-number" };
  if (v.isInt() && v.n === m.value) return { ok: true, reason: "equal" };
  if (v.isInt() && v.n === BigInt(m.base) * BigInt(m.exponent)) return { ok: false, reason: "multiplied-base-by-exponent" };
  return { ok: false, reason: "different-value" };
}
