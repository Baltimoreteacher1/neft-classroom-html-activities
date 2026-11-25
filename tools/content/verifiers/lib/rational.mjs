// Exact rational arithmetic on BigInt. No floats anywhere: every value is { n, d } with d > 0 and gcd(n, d) = 1.

const abs = (a) => (a < 0n ? -a : a);
export function gcd(a, b) {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function make(n, d = 1n) {
  n = BigInt(n);
  d = BigInt(d);
  if (d === 0n) throw new RangeError("division by zero");
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}

/** "12", "0.25", "1,234.5" -> rational. Returns null for anything else. */
export function fromDecimal(text) {
  const m = /^(\d+)(?:\.(\d+))?$/.exec(String(text).replace(/,/g, ""));
  if (!m) return null;
  const frac = m[2] || "";
  return make(BigInt(m[1] + frac), 10n ** BigInt(frac.length));
}

export const add = (a, b) => make(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => make(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => make(a.n * b.n, a.d * b.d);
export const div = (a, b) => make(a.n * b.d, a.d * b.n);
export const neg = (a) => make(-a.n, a.d);
export const isZero = (a) => a.n === 0n;
export const isInt = (a) => a.d === 1n;
export const cmp = (a, b) => {
  const l = a.n * b.d;
  const r = b.n * a.d;
  return l < r ? -1 : l > r ? 1 : 0;
};
export const eq = (a, b) => a.n === b.n && a.d === b.d;

export function pow(a, k) {
  if (!Number.isInteger(k) || Math.abs(k) > 12) throw new RangeError("exponent out of range");
  let r = make(1n);
  for (let i = 0; i < Math.abs(k); i += 1) r = mul(r, a);
  return k < 0 ? div(make(1n), r) : r;
}

export const toString = (a) => (a.d === 1n ? `${a.n}` : `${a.n}/${a.d}`);

/** True when the value has a terminating decimal expansion (denominator is 2^a * 5^b). */
export function terminates(a) {
  let d = a.d;
  while (d % 2n === 0n) d /= 2n;
  while (d % 5n === 0n) d /= 5n;
  return d === 1n;
}

/** Number of decimal places needed to write a terminating value exactly (2^x * 5^y needs max(x, y)). */
export function decimalPlaces(a) {
  let x = 0;
  let y = 0;
  let d = a.d;
  while (d % 2n === 0n) {
    d /= 2n;
    x += 1;
  }
  while (d % 5n === 0n) {
    d /= 5n;
    y += 1;
  }
  return Math.max(x, y);
}
