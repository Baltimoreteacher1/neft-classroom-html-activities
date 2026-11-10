// error-analysis-match.js — does what a student typed repair the broken step?
//
// The Find-the-Error "fix the step" prompt used to compare the typed text with
// the LAST NUMBER in `correctWork`. `correctWork` is a teaching paragraph, and
// its last number is often the WRONG value ("...= 81. So the track plays 81
// beats, not 12."): a student who typed 81 was told "Not quite" twice, and one
// who typed 12 was told they had fixed it. Measured on the 978 authored items
// in the 84 lesson configs, the old rule pointed at a number from the broken
// work in 241 of them (tools/error-analysis-match.test.mjs).
//
// The expected value is now what the paragraph states that the BROKEN WORK does
// not already contain, with "not 12" / "instead of $129.00" clauses removed
// first (they name the wrong value, never the fix). A typed answer matches when
// its value, or the value of its right-hand side, is one of those numbers, so
// "81", "3 × 3 × 3 × 3" and "3 × 3 × 3 × 3 = 81" all pass and "12" and "3 × 4"
// do not. Pure and DOM-free so the test can sweep every authored item.

const NUMBER = /\d[\d,]*(?:\.\d+)?(?:\/\d+)?/g;

/** @param {string} token one match of NUMBER */
function toValue(token) {
  const plain = token.replace(/,/g, "");
  if (!plain.includes("/")) return Number(plain);
  const [top, bottom] = plain.split("/");
  return Number(top) / Number(bottom);
}

/**
 * Every number in a string, as a value: "$1,290.50" -> 1290.5, "3/4" -> 0.75.
 * @param {unknown} text
 * @returns {number[]}
 */
export function numbersIn(text) {
  return (String(text ?? "").match(NUMBER) || []).map(toValue).filter(Number.isFinite);
}

// "…, not 12" / "instead of $129.00" / "rather than 8" name the WRONG value. The
// clause ends at the sentence end: a full stop followed by a space or the end of
// the text, so the point inside "129.00" does not end it.
const NEGATED = /[,;—–-]?\s*\b(?:not|instead of|rather than|never)\b(?:(?![.!?](?:\s|$)).)*/gi;

/**
 * `text` without its "not N" / "instead of N" clauses.
 * @param {unknown} text
 */
export function stripNegated(text) {
  return String(text ?? "").replace(NEGATED, "");
}

/** @type {Record<string, string>} */
const SUPERSCRIPT = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
};

/**
 * Value of a plain arithmetic expression (+ − × ÷ ^ superscripts, brackets,
 * decimals, $ and thousands commas), or null when it is anything else. A small
 * parser rather than eval: this runs on what a student typed.
 * @param {unknown} text
 * @returns {number | null}
 */
export function evaluateExpression(text) {
  const source = String(text ?? "")
    .replace(/[$\s]/g, "")
    .replace(/(?<=\d),(?=\d{3}(?!\d))/g, "")
    .replace(/[×x*·]/g, "*")
    .replace(/[÷:]/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/([\d.)])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, base, sup) => {
      const exponent = [...sup].map((c) => SUPERSCRIPT[c]).join("");
      return `${base}^${exponent}`;
    });
  if (!source || !/^[\d.+\-*/()^]+$/.test(source)) return null;

  let at = 0;
  /** @returns {number} */
  const expression = () => {
    let value = term();
    while (source[at] === "+" || source[at] === "-") {
      const op = source[at++];
      const right = term();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  };
  /** @returns {number} */
  const term = () => {
    let value = power();
    while (source[at] === "*" || source[at] === "/") {
      const op = source[at++];
      const right = power();
      value = op === "*" ? value * right : value / right;
    }
    return value;
  };
  /** @returns {number} */
  const power = () => {
    const base = unary();
    if (source[at] !== "^") return base;
    at++;
    return base ** power();
  };
  /** @returns {number} */
  const unary = () => {
    if (source[at] === "-") {
      at++;
      return -unary();
    }
    if (source[at] === "(") {
      at++;
      const inner = expression();
      if (source[at] !== ")") throw new Error("unbalanced");
      at++;
      return inner;
    }
    const start = at;
    while (at < source.length && /[\d.]/.test(source[at])) at++;
    const number = Number(source.slice(start, at));
    if (start === at || !Number.isFinite(number)) throw new Error("number expected");
    return number;
  };

  try {
    const value = expression();
    return at === source.length && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * The values `correctWork` states for the repaired step.
 * `fresh` = numbers the paragraph states that the broken work (from the error
 * step onward) does not; `last` = no such number, so the last number the
 * paragraph states once the negated clauses are removed; `none` = no numbers.
 * @param {unknown} correctWork
 * @param {{ work?: string }[] | undefined} workedExample
 * @param {number | undefined} errorStep zero-based
 * @returns {{ values: number[], basis: "fresh" | "last" | "none" }}
 */
export function expectedValues(correctWork, workedExample, errorStep) {
  const broken = new Set(
    (workedExample || [])
      .slice(Math.max(0, errorStep ?? 0))
      .flatMap((step) => numbersIn(step.work)),
  );
  const stated = numbersIn(stripNegated(correctWork));
  const fresh = stated.filter((n) => !broken.has(n));
  if (fresh.length) return { values: [...new Set(fresh)], basis: "fresh" };
  const last = stated[stated.length - 1];
  return last === undefined ? { values: [], basis: "none" } : { values: [last], basis: "last" };
}

/**
 * @param {number} a
 * @param {number} b
 */
const sameValue = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/** @param {unknown} s */
const squash = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[.;,]+$/, "");

/**
 * True when `typed` repairs the step.
 * @param {string} typed
 * @param {{ correctWork?: string, workedExample?: { work?: string }[], errorStep?: number }} item
 */
export function repairMatches(typed, { correctWork, workedExample, errorStep }) {
  if (!correctWork) return true;
  const a = squash(typed);
  if (!a) return false;
  const b = squash(correctWork);
  // Whole-text equivalence only for a real attempt at the sentence: a bare "2"
  // is a suffix of any paragraph that ends in "...12".
  if (a === b || (a.length >= 12 && (b.endsWith(a) || a.endsWith(b)))) return true;

  const { values } = expectedValues(correctWork, workedExample, errorStep);
  if (!values.length) return false;
  const sides = String(typed)
    .split("=")
    .map((side) => side.trim())
    .filter(Boolean);
  const candidates = [];
  const right = sides.length ? evaluateExpression(sides[sides.length - 1]) : null;
  if (right !== null) candidates.push(right);
  const typedNumbers = numbersIn(typed);
  if (typedNumbers.length) candidates.push(typedNumbers[typedNumbers.length - 1]);
  return candidates.some((c) => values.some((v) => sameValue(c, v)));
}
