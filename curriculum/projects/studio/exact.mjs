/**
 * Exact rational arithmetic for the Studio's in-browser substitution and consistency checks.
 * BigInt fractions, no floating point: 0.1 + 0.2 equals 0.3 here. Values are {n, d} with d > 0, lowest terms.
 * Input text follows the Studio's number rules: whole, decimal, fraction "3/4" or mixed number "2 1/2".
 */
const gcd = (a, b) => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a || 1n;
};
export function frac(n, d = 1n) {
  if (d === 0n) return null;
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}
const decimal = (text) => {
  const m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(text);
  if (!m || (!m[2] && !m[3])) return null;
  const places = (m[3] || "").length;
  const digits = BigInt(`${m[2] || "0"}${m[3] || ""}`);
  return frac(m[1] ? -digits : digits, 10n ** BigInt(places));
};
/** @returns {{n: bigint, d: bigint} | null} null when the text is not a number the Studio accepts. */
export function parse(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s.length > 24) return null;
  let m = /^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(s);
  if (m) {
    const whole = frac(BigInt(m[2]) * BigInt(m[4]) + BigInt(m[3]), BigInt(m[4]));
    return whole && (m[1] ? neg(whole) : whole);
  }
  m = /^(-?\d+)\s*\/\s*(\d+)$/.exec(s);
  if (m) return frac(BigInt(m[1]), BigInt(m[2]));
  return decimal(s);
}
export const num = (x) => parse(String(x));
export const add = (x, y) => frac(x.n * y.d + y.n * x.d, x.d * y.d);
export const sub = (x, y) => frac(x.n * y.d - y.n * x.d, x.d * y.d);
export const mul = (x, y) => frac(x.n * y.n, x.d * y.d);
export const neg = (x) => frac(-x.n, x.d);
export const cmp = (x, y) => {
  const l = x.n * y.d;
  const r = y.n * x.d;
  return l < r ? -1 : l > r ? 1 : 0;
};
export const eq = (x, y) => cmp(x, y) === 0;
export const isInt = (x) => x.d === 1n;
export const toNumber = (x) => Number(x.n) / Number(x.d);
export const abs = (x) => (x.n < 0n ? neg(x) : x);
/** Terminating decimals print as decimals; everything else as n/d. */
export function show(x) {
  if (x.d === 1n) return x.n.toString();
  let d = x.d;
  while (d % 2n === 0n) d /= 2n;
  while (d % 5n === 0n) d /= 5n;
  if (d === 1n) return String(Number(toNumber(x).toFixed(6)));
  return `${x.n}/${x.d}`;
}
export { gcd };
