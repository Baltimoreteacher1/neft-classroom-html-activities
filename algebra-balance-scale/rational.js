/**
 * Exact rational numbers for the Balance Builder. A balance move can divide
 * 3x + 2 = 11 by 3 before clearing the 2, so intermediate states are fractions;
 * floating point would make "x + 2/3 = 11/3" depend on rounding.
 * A rational is a frozen { n, d } with d > 0 and gcd(n, d) = 1.
 */

const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));

export function rat(n, d = 1) {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new RangeError("bad rational");
  const g = gcd(n, d) || 1;
  const sign = d < 0 ? -1 : 1;
  return Object.freeze({ n: (sign * n) / g, d: (sign * d) / g });
}

export const ZERO = rat(0);
export const ONE = rat(1);

export const add = (x, y) => rat(x.n * y.d + y.n * x.d, x.d * y.d);
export const sub = (x, y) => rat(x.n * y.d - y.n * x.d, x.d * y.d);
export const mul = (x, y) => rat(x.n * y.n, x.d * y.d);
export const div = (x, y) => {
  if (y.n === 0) throw new RangeError("divide by zero");
  return rat(x.n * y.d, x.d * y.n);
};
export const neg = (x) => rat(-x.n, x.d);
export const abs = (x) => rat(Math.abs(x.n), x.d);
export const eq = (x, y) => x.n === y.n && x.d === y.d;
export const isZero = (x) => x.n === 0;
export const isInt = (x) => x.d === 1;
export const sign = (x) => Math.sign(x.n);
export const cmp = (x, y) => Math.sign(x.n * y.d - y.n * x.d);
export const toNumber = (x) => x.n / x.d;

/** Largest magnitude any numerator or denominator may reach before a move is refused. */
export const LIMIT = 9999;
export const withinLimit = (x) => Math.abs(x.n) <= LIMIT && x.d <= 99;

/** "3", "−3", "3/2". Uses U+2212 so the minus is a minus, not a hyphen. */
export function fmt(x) {
  const body = x.d === 1 ? String(Math.abs(x.n)) : `${Math.abs(x.n)}/${x.d}`;
  return x.n < 0 ? `−${body}` : body;
}

/** Parses "12", "0.25" or "3/4" (unsigned) into a rational, or null. */
export function parseUnsigned(text) {
  const m = /^(\d+(?:\.\d+)?)(?:\/(\d+))?$/.exec(text);
  if (!m) return null;
  const [whole, frac = ""] = m[1].split(".");
  const scale = 10 ** frac.length;
  if (scale > 1e6 || whole.length > 6) return null;
  let value = rat(Number(whole + frac), scale);
  if (m[2] !== undefined) {
    if (Number(m[2]) === 0) return null;
    value = div(value, rat(Number(m[2])));
  }
  return value;
}
