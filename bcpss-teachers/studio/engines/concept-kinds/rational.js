// Exact rational arithmetic for concept-builder. Never compare floats: every value that matters is a Fraction.
// Fractions are immutable {n, d} pairs of BigInt, always reduced with d > 0.

const gcd = (a, b) => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};

export class Fraction {
  constructor(n, d = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    if (d === 0n) throw new RangeError("Fraction denominator is zero");
    if (d < 0n) [n, d] = [-n, -d];
    const g = gcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
    Object.freeze(this);
  }

  static of(n, d = 1) {
    return new Fraction(n, d);
  }

  /** Parse "3/4", "-2", "1.25", "1 1/2", "-1 1/2", "75%", or an integer/decimal JS number. Returns null when it is not a rational. */
  static parse(v) {
    if (v instanceof Fraction) return v;
    if (typeof v === "bigint") return new Fraction(v);
    if (typeof v === "number") {
      if (!Number.isFinite(v)) return null;
      return Fraction.parse(String(v).includes("e") ? v.toFixed(12).replace(/0+$/, "").replace(/\.$/, "") : String(v));
    }
    if (typeof v !== "string") return null;
    let s = v.trim().replace(/−/g, "-").replace(/,/g, "");
    if (!s) return null;
    let m = /^(-?)(\d+(?:\.\d+)?)\s*%$/.exec(s);
    if (m) {
      const f = Fraction.parse(m[2]);
      return f ? (m[1] ? f.mul(new Fraction(-1, 100)) : f.mul(new Fraction(1, 100))) : null;
    }
    m = /^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s);
    if (m) {
      if (BigInt(m[4]) === 0n) return null;
      const whole = new Fraction(BigInt(m[2]));
      const frac = new Fraction(BigInt(m[3]), BigInt(m[4]));
      const total = whole.add(frac);
      return m[1] ? total.neg() : total;
    }
    m = /^(-?\d+)\s*\/\s*(-?\d+)$/.exec(s);
    if (m) return BigInt(m[2]) === 0n ? null : new Fraction(BigInt(m[1]), BigInt(m[2]));
    m = /^(-?)(\d*)\.?(\d*)$/.exec(s);
    if (m && (m[2] || m[3])) {
      const digits = m[3] || "";
      const n = BigInt((m[2] || "0") + digits);
      const f = new Fraction(m[1] ? -n : n, 10n ** BigInt(digits.length));
      return f;
    }
    return null;
  }

  static must(v) {
    const f = Fraction.parse(v);
    if (!f) throw new TypeError(`"${v}" is not a rational number`);
    return f;
  }

  add(o) {
    o = Fraction.must(o);
    return new Fraction(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  sub(o) {
    o = Fraction.must(o);
    return new Fraction(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o) {
    o = Fraction.must(o);
    return new Fraction(this.n * o.n, this.d * o.d);
  }
  div(o) {
    o = Fraction.must(o);
    if (o.n === 0n) throw new RangeError("Division by zero");
    return new Fraction(this.n * o.d, this.d * o.n);
  }
  neg() {
    return new Fraction(-this.n, this.d);
  }
  abs() {
    return this.n < 0n ? this.neg() : this;
  }
  cmp(o) {
    o = Fraction.must(o);
    const l = this.n * o.d;
    const r = o.n * this.d;
    return l < r ? -1 : l > r ? 1 : 0;
  }
  eq(o) {
    const f = Fraction.parse(o);
    return !!f && this.n === f.n && this.d === f.d;
  }
  lt(o) {
    return this.cmp(o) < 0;
  }
  le(o) {
    return this.cmp(o) <= 0;
  }
  gt(o) {
    return this.cmp(o) > 0;
  }
  ge(o) {
    return this.cmp(o) >= 0;
  }
  isZero() {
    return this.n === 0n;
  }
  isInt() {
    return this.d === 1n;
  }
  sign() {
    return this.n === 0n ? 0 : this.n < 0n ? -1 : 1;
  }
  floor() {
    const q = this.n / this.d;
    return this.n < 0n && this.n % this.d !== 0n ? q - 1n : q;
  }
  /** Nearest multiple of `step` (ties round up). */
  snap(step) {
    step = Fraction.must(step);
    return this.div(step).add(new Fraction(1, 2)).floorFrac().mul(step);
  }
  floorFrac() {
    return new Fraction(this.floor());
  }
  /** Integer value as a JS number (throws when not an integer or out of safe range). */
  toInt() {
    if (!this.isInt()) throw new RangeError(`${this} is not an integer`);
    return Number(this.n);
  }
  /** For drawing only (pixel positions). Never use the result for a comparison. */
  toNumber() {
    return Number(this.n) / Number(this.d);
  }
  toString() {
    return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`;
  }
  toMixed() {
    if (this.d === 1n) return String(this.n);
    const neg = this.n < 0n;
    const a = neg ? -this.n : this.n;
    const whole = a / this.d;
    const rem = a % this.d;
    if (whole === 0n) return `${neg ? "-" : ""}${rem}/${this.d}`;
    return `${neg ? "-" : ""}${whole} ${rem}/${this.d}`;
  }
  /** Terminating decimal text, rounded half up to `dp` places. Display only. */
  toDecimal(dp = 2) {
    const neg = this.n < 0n;
    const a = neg ? -this.n : this.n;
    const scale = 10n ** BigInt(dp);
    let q = (a * scale * 2n + this.d) / (this.d * 2n);
    const whole = q / scale;
    const frac = String(q % scale).padStart(dp, "0");
    const s = dp ? `${whole}.${frac}` : String(whole);
    return neg && q !== 0n ? `-${s}` : s;
  }
  toJSON() {
    return this.toString();
  }
}

export const frac = (v) => Fraction.parse(v);
export const ZERO = new Fraction(0);
export const ONE = new Fraction(1);

export function sum(list) {
  return list.reduce((a, b) => a.add(b), ZERO);
}

/** Format for learners. format: fraction | mixed | decimal | integer */
export function fmt(f, format = "fraction", decimals = 2) {
  f = Fraction.must(f);
  if (format === "mixed") return f.toMixed();
  if (format === "decimal") return f.toDecimal(decimals);
  if (format === "integer") return f.toDecimal(0);
  return f.toString();
}

/**
 * fmt with the display format an author asked for. Each config (an item, then the model) may set `format`
 * ("fraction" | "mixed" | "decimal" | "integer") and `decimals`; the first config that sets one wins.
 * Display only: values are still stored and compared as exact fractions.
 */
export function fmtFor(f, ...configs) {
  return fmt(f, configs.find((c) => c?.format)?.format, configs.find((c) => c?.decimals != null)?.decimals);
}
export const FORMATS = ["fraction", "mixed", "decimal", "integer"];

/** Spoken form: "3/4" -> "3 over 4"; mixed numbers "1 and 1 over 2". */
export function say(f) {
  f = Fraction.must(f);
  if (f.isInt()) return String(f.n);
  const m = f.toMixed().replace("/", " over ");
  return m.replace(/^(-?\d+) (\d+ over)/, "$1 and $2");
}
