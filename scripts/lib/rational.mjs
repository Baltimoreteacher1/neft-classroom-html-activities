/**
 * Exact rational arithmetic + a small math-expression parser.
 *
 * Backs scripts/validate-math.mjs: curriculum answers are written the way a
 * 6th grader writes them ("2 1/2", "2³ × 3²", "2,578", "90 in³", "50%"), and
 * floating point cannot decide "0.1 + 0.2 === 0.3". Everything here is BigInt
 * fractions, so equality is exact.
 *
 * Every parse returns null rather than throwing on input it does not
 * understand. The validator treats null as "not machine-checkable" and skips
 * it — an unparseable answer is never reported as a wrong answer.
 */

const SUPERSCRIPTS = {
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

function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Exact rational. Always stored normalized with a positive denominator. */
export class Rat {
  constructor(n, d = 1n) {
    if (d === 0n) throw new Error("division by zero");
    if (d < 0n) [n, d] = [-n, -d];
    const g = gcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }
  static from(value) {
    if (value instanceof Rat) return value;
    if (typeof value === "bigint") return new Rat(value);
    if (typeof value === "number" && Number.isFinite(value)) return Rat.fromDecimal(String(value));
    return null;
  }
  /** Parse a plain decimal/integer literal ("12", "-2.50") exactly. */
  static fromDecimal(text) {
    const m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(text);
    if (!m || (!m[2] && !m[3])) return null;
    const sign = m[1] === "-" ? -1n : 1n;
    const whole = m[2] || "0";
    const frac = m[3] || "";
    const scale = 10n ** BigInt(frac.length);
    return new Rat(sign * (BigInt(whole) * scale + BigInt(frac || "0")), scale);
  }
  add(o) {
    return new Rat(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  sub(o) {
    return new Rat(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o) {
    return new Rat(this.n * o.n, this.d * o.d);
  }
  div(o) {
    if (o.n === 0n) return null;
    return new Rat(this.n * o.d, this.d * o.n);
  }
  neg() {
    return new Rat(-this.n, this.d);
  }
  /** Integer exponents only — fractional powers are not curriculum content here. */
  pow(o) {
    if (o.d !== 1n) return null;
    let e = o.n;
    const invert = e < 0n;
    if (invert) e = -e;
    if (e > 4096n) return null;
    let n = 1n,
      d = 1n;
    for (let i = 0n; i < e; i++) {
      n *= this.n;
      d *= this.d;
    }
    if (invert) {
      if (n === 0n) return null;
      return new Rat(d, n);
    }
    return new Rat(n, d);
  }
  eq(o) {
    return this.n === o.n && this.d === o.d;
  }
  isInt() {
    return this.d === 1n;
  }
  toNumber() {
    return Number(this.n) / Number(this.d);
  }
  toString() {
    return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`;
  }
}

/**
 * Normalize the many ways the curriculum writes the same operator, then hand a
 * plain ASCII expression to the parser.
 */
export function normalizeExpression(input) {
  if (typeof input !== "string") return "";
  let s = input.trim();
  s = s.replace(/[   ]/g, " ");
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (run) => "^" + [...run].map((c) => SUPERSCRIPTS[c]).join(""));
  // "÷" is deliberately NOT folded into "/": an explicit division operator has
  // to stay distinguishable from a fraction slash, or "12 ÷ 1/2" reads as
  // "(12/1)/2" = 6 instead of 12 ÷ (1/2) = 24.
  s = s.replace(/[×∙·*]/g, "*").replace(/[∕⁄]/g, "/");
  s = s.replace(/[−–—]/g, "-");
  s = s.replace(/(\d),(?=\d{3}(\D|$))/g, "$1");
  s = s.replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");
  // Mixed numbers: "2 1/2" and "-2 1/2" → (2+1/2) / -(2+1/2).
  s = s.replace(
    /(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)/g,
    (_, sign, w, n, d) => `${sign ? "-" : ""}(${w}+${n}/${d})`,
  );
  return s.trim();
}

/**
 * Evaluate a normalized arithmetic expression exactly.
 * Returns a Rat, or null when the text is not a pure arithmetic expression
 * (contains variables, words, blanks, comparison operators, …).
 */
export function evaluateExpression(input) {
  const src = normalizeExpression(input);
  if (!src || !/\d/.test(src)) return null;
  // Words or variables → not arithmetic. The Latin-1 ranges deliberately skip
  // U+00D7 (×) and U+00F7 (÷), which are operators, not letters.
  if (/[A-Za-zÀ-ÖØ-öø-ÿ_]/.test(src)) return null;
  if (/[=<>≤≥≠?_]/.test(src)) return null; // equations/blanks are handled by callers
  let i = 0;
  const peek = () => {
    while (src[i] === " ") i++;
    return src[i];
  };

  function parseExpr() {
    let left = parseTerm();
    if (left === null) return null;
    for (;;) {
      const c = peek();
      if (c !== "+" && c !== "-") return left;
      i++;
      const right = parseTerm();
      if (right === null) return null;
      left = c === "+" ? left.add(right) : left.sub(right);
    }
  }
  function parseTerm() {
    let left = parseUnary();
    if (left === null) return null;
    for (;;) {
      const c = peek();
      // Implicit multiplication: "2(9 - 4)" is standard order-of-operations
      // notation throughout the Reveal content.
      if (c === "(") {
        const right = parseUnary();
        if (right === null) return null;
        left = left.mul(right);
        continue;
      }
      if (c !== "*" && c !== "/" && c !== "÷") return left;
      i++;
      const right = parseUnary();
      if (right === null) return null;
      left = c === "*" ? left.mul(right) : left.div(right);
      if (left === null) return null;
    }
  }
  function parseUnary() {
    const c = peek();
    if (c === "-") {
      i++;
      const v = parseUnary();
      return v === null ? null : v.neg();
    }
    if (c === "+") {
      i++;
      return parseUnary();
    }
    return parsePower();
  }
  function parsePower() {
    const base = parsePrimary();
    if (base === null) return null;
    if (peek() !== "^") return base;
    i++;
    const exp = parseUnary(); // right-associative, binds tighter than * and /
    if (exp === null) return null;
    return base.pow(exp);
  }
  function parsePrimary() {
    const c = peek();
    if (c === "(") {
      i++;
      const v = parseExpr();
      if (v === null || peek() !== ")") return null;
      i++;
      return v;
    }
    // A bare "a/b" is a single fraction literal, not a division at term level.
    // The curriculum writes "3/4 ÷ 1/8" meaning (3/4) ÷ (1/8); plain
    // left-associative division would read that as 3/4/1/8. Binding the
    // fraction here is both correct for that intent and harmless for chained
    // division ("100/5/2" evaluates the same either way).
    const frac = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/.exec(src.slice(i));
    if (frac) {
      const num = Rat.fromDecimal(frac[1]);
      const den = Rat.fromDecimal(frac[2]);
      if (num === null || den === null || den.n === 0n) return null;
      i += frac[0].length;
      return num.div(den);
    }
    const m = /^\d+(?:\.\d+)?/.exec(src.slice(i));
    if (!m) return null;
    i += m[0].length;
    return Rat.fromDecimal(m[0]);
  }

  const value = parseExpr();
  if (value === null) return null;
  return peek() === undefined ? value : null; // trailing junk → not a clean expression
}

/** Unit/label suffixes that may trail a numeric answer without changing it. */
const UNIT_RE =
  /\s*(square |cubic )?(in|inch|inches|ft|feet|foot|yd|yard|yards|mi|miles|cm|centimeters?|m|meters?|km|kilometers?|mm|g|grams?|kg|lb|lbs|pounds?|oz|ounces?|mL|L|liters?|cups?|pints?|quarts?|gallons?|units?|students?|people|points?|dollars?|cents?|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?|degrees?|°)(\^?[²³0-9])?\.?$/i;
// "%" is deliberately absent: it scales the value (50% = 0.5), so it is parsed
// by normalizeExpression, not stripped as a label.

/**
 * Strip a trailing unit from an answer string ("90 in³" → "90", "$4.50" → "4.50").
 * Returns { text, unit } so callers can report unit-only mismatches separately.
 */
export function stripUnits(input) {
  if (typeof input !== "string") return { text: "", unit: "" };
  let text = input.trim();
  let unit = "";
  const money = /^\$\s*(-?[\d,]+(?:\.\d+)?)$/.exec(text);
  if (money) return { text: money[1], unit: "$" };
  const m = UNIT_RE.exec(text);
  if (m && /\d/.test(text.slice(0, m.index))) {
    unit = m[0].trim();
    text = text.slice(0, m.index).trim();
  }
  return { text, unit };
}

/**
 * Curriculum answers often list equivalent forms ("5/2 = 2 1/2", "3 or 3.0").
 * Split them so a check passes when ANY listed form matches — and so we can
 * additionally verify the forms are genuinely equal to each other.
 */
export function splitEquivalents(input) {
  if (typeof input !== "string") return [];
  return input
    .split(/\s*(?:=|,|;|\bor\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Does `answerText` state `exact` correctly, allowing for deliberate rounding?
 *
 * Curriculum answers to non-terminating divisions are written rounded
 * ("5 ÷ 3 = 1.6667"), so exact equality alone would flag correct content. A
 * rounded answer is accepted only when it is the CORRECT rounding of the exact
 * value to the precision the answer itself states — "1.7" passes for 5/3,
 * "1.6" does not.
 */
export function matchesAnswer(exact, answerText) {
  const stated = parseAnswerValue(answerText);
  if (exact === null || stated === null) return null;
  if (exact.eq(stated)) return true;
  const decimals = /\.(\d+)/.exec(stripUnits(String(answerText).trim()).text);
  if (!decimals) return false;
  const places = BigInt(decimals[1].length);
  const scale = 10n ** places;
  // Round half away from zero, in exact integer arithmetic.
  const num = exact.n * scale;
  const twice = 2n * num;
  const sign = exact.n < 0n ? -1n : 1n;
  const rounded = (twice + sign * exact.d) / (2n * exact.d);
  return new Rat(rounded, scale).eq(stated);
}

/**
 * Parse an answer string to an exact value.
 * Handles "x = 7", "5/2 = 2 1/2", "90 in³", "$4.50", "50%".
 */
export function parseAnswerValue(input) {
  if (typeof input === "number" || typeof input === "bigint") return Rat.from(input);
  if (typeof input !== "string") return null;
  let text = input.trim();
  if (!text) return null;
  // "x = 7" / "n = 4" → keep the right-hand side.
  const assign = /^[A-Za-z]\s*=\s*(.+)$/.exec(text);
  if (assign) text = assign[1].trim();
  for (const part of [text, ...splitEquivalents(text)]) {
    const { text: bare } = stripUnits(part);
    const value = evaluateExpression(bare);
    if (value !== null) return value;
  }
  return null;
}
