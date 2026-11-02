// Exact rational arithmetic (BigInt) for every model, solver, generator check and answer-equivalence test in
// Enterprise 8. A Rational is always stored in lowest terms with a positive denominator, so equality is
// structural and no floating-point rounding can make two equal values differ.

const abs = (n) => (n < 0n ? -n : n);
const gcd = (a, b) => {
  let x = abs(a);
  let y = abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
};

export class Rational {
  constructor(n, d = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    if (d === 0n) throw new RangeError("Division by zero");
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }
  static of(value) {
    if (value instanceof Rational) return value;
    if (typeof value === "bigint") return new Rational(value, 1n);
    if (typeof value === "number") return Rational.fromNumber(value);
    if (typeof value === "string") {
      const parsed = parseRational(value);
      if (!parsed) throw new TypeError(`Not a number: ${value}`);
      return parsed;
    }
    throw new TypeError(`Cannot make a Rational from ${typeof value}`);
  }
  // Floats are accepted only when they are short decimals; this keeps 0.1 exactly 1/10.
  static fromNumber(x) {
    if (!Number.isFinite(x)) throw new RangeError("Not finite");
    if (Number.isInteger(x)) return new Rational(BigInt(x), 1n);
    const text = String(x);
    if (/e/i.test(text)) throw new RangeError(`Use a string for ${text}`);
    return parseRational(text);
  }
  add(o) {
    o = Rational.of(o);
    return new Rational(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  sub(o) {
    o = Rational.of(o);
    return new Rational(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o) {
    o = Rational.of(o);
    return new Rational(this.n * o.n, this.d * o.d);
  }
  div(o) {
    o = Rational.of(o);
    return new Rational(this.n * o.d, this.d * o.n);
  }
  neg() {
    return new Rational(-this.n, this.d);
  }
  abs() {
    return new Rational(abs(this.n), this.d);
  }
  pow(k) {
    if (!Number.isInteger(k)) throw new RangeError("Integer exponent required");
    if (k >= 0) return new Rational(this.n ** BigInt(k), this.d ** BigInt(k));
    return new Rational(this.d ** BigInt(-k), this.n ** BigInt(-k));
  }
  cmp(o) {
    o = Rational.of(o);
    const l = this.n * o.d;
    const r = o.n * this.d;
    return l < r ? -1 : l > r ? 1 : 0;
  }
  eq(o) {
    return this.cmp(o) === 0;
  }
  lt(o) {
    return this.cmp(o) < 0;
  }
  gt(o) {
    return this.cmp(o) > 0;
  }
  lte(o) {
    return this.cmp(o) <= 0;
  }
  gte(o) {
    return this.cmp(o) >= 0;
  }
  isInteger() {
    return this.d === 1n;
  }
  isZero() {
    return this.n === 0n;
  }
  sign() {
    return this.n < 0n ? -1 : this.n > 0n ? 1 : 0;
  }
  floor() {
    const q = this.n / this.d;
    return this.n < 0n && this.n % this.d !== 0n ? q - 1n : q;
  }
  toNumber() {
    return Number(this.n) / Number(this.d);
  }
  toString() {
    return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`;
  }
  // Decimal expansion rounded half away from zero to `places`; exact because it works on BigInt.
  toDecimal(places = 2) {
    const scale = 10n ** BigInt(places);
    const scaled = this.n * scale;
    let q = abs(scaled) / this.d;
    const r = abs(scaled) % this.d;
    if (r * 2n >= this.d) q += 1n;
    if (this.n < 0n && q !== 0n) q = -q;
    const negative = q < 0n;
    const digits = abs(q)
      .toString()
      .padStart(places + 1, "0");
    const whole = digits.slice(0, digits.length - places);
    const frac = places ? `.${digits.slice(digits.length - places)}` : "";
    return `${negative ? "-" : ""}${whole}${frac}`;
  }
  // True when the decimal expansion terminates (denominator has only the prime factors 2 and 5).
  isTerminating() {
    let d = this.d;
    while (d % 2n === 0n) d /= 2n;
    while (d % 5n === 0n) d /= 5n;
    return d === 1n;
  }
  // Mixed-number parts for display: 7/3 -> { whole: 2, num: 1, den: 3 }.
  mixed() {
    const sign = this.n < 0n ? -1n : 1n;
    const whole = abs(this.n) / this.d;
    return {
      sign: Number(sign),
      whole: Number(whole),
      num: Number(abs(this.n) % this.d),
      den: Number(this.d),
    };
  }
}

export const R = (n, d = 1) => new Rational(n, d);
export const ZERO = R(0);
export const ONE = R(1);

// Parses "3", "-3", "1/2", "-6/8", "0.75", ".5", "1,250", "2 1/3", "-2 1/3", "50%", "3/4%" and unicode vulgar fractions.
const VULGAR = {
  "½": "1/2",
  "⅓": "1/3",
  "⅔": "2/3",
  "¼": "1/4",
  "¾": "3/4",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};
export function parseRational(input) {
  if (input instanceof Rational) return input;
  let text = String(input ?? "")
    .trim()
    .replace(/[−–—]/g, "-")
    .replace(/ /g, " ");
  if (!text) return null;
  for (const [glyph, ascii] of Object.entries(VULGAR)) text = text.replace(glyph, ` ${ascii}`);
  text = text.trim();
  let percent = false;
  if (text.endsWith("%")) {
    percent = true;
    text = text.slice(0, -1).trim();
  }
  text = text.replace(/(?<=\d),(?=\d{3}(\D|$))/g, "");
  let m;
  let value = null;
  if ((m = /^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(text))) {
    if (BigInt(m[4]) === 0n) return null;
    const mixed = new Rational(BigInt(m[2]), 1n).add(new Rational(BigInt(m[3]), BigInt(m[4])));
    value = m[1] ? mixed.neg() : mixed;
  } else if ((m = /^(-?\d+)\s*\/\s*(-?\d+)$/.exec(text))) {
    if (BigInt(m[2]) === 0n) return null;
    value = new Rational(BigInt(m[1]), BigInt(m[2]));
  } else if ((m = /^(-?)(\d*)\.(\d+)$/.exec(text)) || (m = /^(-?)(\d+)()$/.exec(text))) {
    const frac = m[3] || "";
    const whole = m[2] || "0";
    const n = BigInt(whole + frac);
    value = new Rational(m[1] ? -n : n, 10n ** BigInt(frac.length));
  }
  if (!value) return null;
  return percent ? value.div(100) : value;
}

export const sum = (list) => list.reduce((acc, x) => acc.add(x), ZERO);
export const product = (list) => list.reduce((acc, x) => acc.mul(x), ONE);

// Statistics over exact data.
export const mean = (list) => sum(list.map(Rational.of)).div(list.length);
export function median(list) {
  const sorted = list.map(Rational.of).sort((a, b) => a.cmp(b));
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : sorted[mid - 1].add(sorted[mid]).div(2);
}
// Quartiles by the "median of halves" method taught in Grade 6 (the median is excluded from both halves).
export function quartiles(list) {
  const sorted = list.map(Rational.of).sort((a, b) => a.cmp(b));
  const half = sorted.length >> 1;
  const lower = sorted.slice(0, half);
  const upper = sorted.slice(sorted.length % 2 ? half + 1 : half);
  return {
    min: sorted[0],
    q1: median(lower.length ? lower : sorted),
    median: median(sorted),
    q3: median(upper.length ? upper : sorted),
    max: sorted.at(-1),
  };
}
export function modes(list) {
  const counts = new Map();
  for (const x of list.map(Rational.of))
    counts.set(x.toString(), (counts.get(x.toString()) || 0) + 1);
  const top = Math.max(...counts.values());
  return top === 1 ? [] : [...counts].filter(([, c]) => c === top).map(([k]) => Rational.of(k));
}

// Equivalence of a learner's response to the target, with optional requirements (simplified form, whole number).
export function equivalent(
  response,
  target,
  { simplified = false, allowPercent = true, allowDecimal = true, allowMixed = true } = {},
) {
  const text = String(response ?? "").trim();
  const r = parseRational(text);
  if (!r) return false;
  if (!allowPercent && text.includes("%")) return false;
  if (!allowDecimal && /\./.test(text)) return false;
  if (!allowMixed && /\d\s+\d+\s*\/\s*\d+/.test(text)) return false;
  if (!r.eq(Rational.of(target))) return false;
  if (simplified && /\//.test(text)) {
    const m = /(-?\d+)\s*\/\s*(\d+)\s*$/.exec(text);
    if (!m || gcd(BigInt(m[1]), BigInt(m[2])) !== 1n) return false;
  }
  return true;
}
