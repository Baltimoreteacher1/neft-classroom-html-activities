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

/** Lower-case, no spaces, one spelling per symbol, no leading "=" or trailing full stop. @param {unknown} s */
const squash = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[×·*]/g, "x")
    .replace(/[−–]/g, "-")
    .replace(/<=|=<|≦/g, "≤")
    .replace(/>=|=>|≧/g, "≥")
    .replace(/\s+to\s+(?=\d)/g, ":")
    .replace(/\s+/g, "")
    .replace(/^=+/, "")
    .replace(/[.;,!]+$/, "");

const LEAD =
  /^\s*(?:the\s+)?correct\s+(?:answer|equation|step|work|value|result|sum|total|difference|product|quotient|expression|inequality|rule|reason|statement|choice|ratio|rate|response)\s+(?:is|are|was)\s*:?\s+/i;

/**
 * The short answer a paragraph states up front ("The correct answer is x ≤ 8. Closed circle…" -> "x ≤ 8"), or null.
 * @param {unknown} correctWork
 * @returns {string | null}
 */
export function statedAnswer(correctWork) {
  const text = String(correctWork ?? "").trim();
  const lead = LEAD.exec(text);
  if (!lead) return null;
  const rest = text.slice(lead[0].length);
  const end = rest.search(/(?:\.(?:\s|$)|[!?](?:\s|$)|,\s*because\b|;\s|\s—\s)/i);
  const answer = (end === -1 ? rest : rest.slice(0, end)).trim().replace(/^["“']|["”']$/g, "");
  return answer || null;
}

const STOP = new Set([
  "the",
  "and",
  "that",
  "this",
  "with",
  "for",
  "are",
  "was",
  "you",
  "your",
  "from",
  "not",
  "can",
  "has",
  "have",
  "its",
  "when",
  "what",
  "each",
]);
/** @param {string} s */
const contentWords = (s) =>
  new Set(
    (s.toLowerCase().match(/[a-záéíóúñü]{3,}/g) || [])
      .filter((w) => !STOP.has(w))
      .map((w) => w.replace(/(?:ing|ed|es|s)$/, "")),
  );

/**
 * Does a typed word answer match a stated word answer? Containment either way, or most of the key words.
 * @param {string} typed
 * @param {string} answer
 */
function wordsMatch(typed, answer) {
  const a = squash(typed);
  const b = squash(answer);
  if (!a) return false;
  if (a === b || a.includes(b) || (b.includes(a) && a.length >= 0.6 * b.length)) return true;
  const want = contentWords(answer);
  if (!want.size) return false;
  const got = contentWords(typed);
  let hit = 0;
  for (const w of want) if (got.has(w)) hit++;
  return hit / want.size >= 0.6 && hit >= Math.min(2, want.size);
}

/**
 * `needle` inside `haystack` as its own token: "x≤8" is in "x≤8(closedcircle)" but not in "x≤80", and "8" is not in "18".
 * @param {string} haystack
 * @param {string} needle
 */
function containsToken(haystack, needle) {
  if (!needle) return false;
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + 1)) {
    const before = haystack[at - 1];
    const after = haystack[at + needle.length];
    const glued = (/** @type {string | undefined} */ c) => c !== undefined && /[\d.]/.test(c);
    if (
      !(glued(before) && /\d/.test(needle[0])) &&
      !(glued(after) && /\d/.test(needle[needle.length - 1]))
    )
      return true;
  }
  return false;
}

/**
 * Does typed math match a stated math answer ("8", "$12.90", "x ≤ 8", "2n = 16", "1 to 1")?
 * @param {string} typed
 * @param {string} answer
 */
function mathMatches(typed, answer) {
  const a = squash(typed);
  const b = squash(answer);
  if (a === b || containsToken(a, b)) return true;
  const target = evaluateExpression(answer);
  if (target !== null) {
    const sides = String(typed)
      .split("=")
      .map((x) => x.trim())
      .filter(Boolean);
    const right = sides.length ? evaluateExpression(sides[sides.length - 1]) : null;
    const typedNumbers = numbersIn(typed);
    const last = typedNumbers.length ? typedNumbers[typedNumbers.length - 1] : null;
    return [right, last].some((c) => c !== null && sameValue(c, target));
  }
  return false;
}

/** @param {string} answer */
const isWordAnswer = (answer) => /[A-Za-z]{4,}/.test(answer.replace(/\b(?:and|the)\b/gi, ""));

/**
 * "match": the typed text repairs the step. "model": the item states nothing a program can check, so the attempt is
 * accepted and the authored model is shown to compare with. "no": try again.
 * @param {string} typed
 * @param {{ correctWork?: string, workedExample?: { work?: string }[], errorStep?: number }} item
 * @returns {"match" | "model" | "no"}
 */
export function repairVerdict(typed, { correctWork, workedExample, errorStep }) {
  if (!correctWork) return "match";
  const a = squash(typed);
  if (!a) return "no";
  const b = squash(correctWork);
  if (a === b || (a.length >= 12 && (b.endsWith(a) || a.endsWith(b)))) return "match";

  const stated = statedAnswer(correctWork);
  // Typing the broken work back is not a repair, unless that IS the stated answer.
  const brokenText = (workedExample || [])
    .slice(Math.max(0, errorStep ?? 0))
    .map((step) => squash(step.work));
  if (brokenText.includes(a) && !(stated && squash(stated) === a)) return "no";

  if (stated) {
    const ok = isWordAnswer(stated) ? wordsMatch(typed, stated) : mathMatches(typed, stated);
    return ok ? "match" : "no";
  }

  const { values, basis } = expectedValues(correctWork, workedExample, errorStep);
  if (basis === "none") {
    // Nothing checkable: a real attempt (about a short sentence) gets the model to compare with.
    return String(typed).trim().split(/\s+/).length >= 3 ? "model" : "no";
  }
  const sides = String(typed)
    .split("=")
    .map((side) => side.trim())
    .filter(Boolean);
  const candidates = [];
  const right = sides.length ? evaluateExpression(sides[sides.length - 1]) : null;
  if (right !== null) candidates.push(right);
  const typedNumbers = numbersIn(typed);
  if (typedNumbers.length) candidates.push(typedNumbers[typedNumbers.length - 1]);
  return candidates.some((c) => values.some((v) => sameValue(c, v))) ? "match" : "no";
}

/** Back-compatible boolean: true only for a verified repair. */
export const repairMatches = (/** @type {string} */ typed, /** @type {any} */ item) =>
  repairVerdict(typed, item) === "match";
