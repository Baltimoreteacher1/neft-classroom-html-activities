// Exact rational arithmetic and small integer helpers shared by the graphics-a components. Pure: no DOM, no i18n.
// A rational is the plain JSON object {n, d} with integer n, integer d > 0, always reduced by frac().
export const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
};
export const lcm = (a, b) => (a === 0 || b === 0 ? 0 : (Math.abs(a) / gcd(a, b)) * Math.abs(b));
const safe = (value) => {
  if (!Number.isSafeInteger(value)) throw new RangeError("Rational overflow");
  return value;
};

export function frac(n, d = 1) {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new RangeError(`Invalid rational ${n}/${d}`);
  const sign = d < 0 ? -1 : 1;
  const g = gcd(n, d);
  return { n: safe((sign * n) / g) || 0, d: safe((sign * d) / g) };
}
// Accepts a number (integer), {n, d} (any non-reduced form) or an integer string; returns a reduced rational.
export function asFrac(value) {
  if (typeof value === "number") return frac(value, 1);
  if (value && typeof value === "object") return frac(value.n, value.d);
  throw new RangeError(`Not a rational: ${JSON.stringify(value)}`);
}
export const add = (a, b) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => frac(a.n * b.n, a.d * b.d);
export const div = (a, b) => {
  if (b.n === 0) throw new RangeError("Division by zero");
  return frac(a.n * b.d, a.d * b.n);
};
export const neg = (a) => frac(-a.n, a.d);
export const cmp = (a, b) => {
  const left = BigInt(a.n) * BigInt(b.d);
  const right = BigInt(b.n) * BigInt(a.d);
  return left === right ? 0 : left < right ? -1 : 1;
};
export const eq = (a, b) => cmp(a, b) === 0;
export const isInt = (a) => a.d === 1;
export const floorFrac = (a) => Math.floor(a.n / a.d);
// Exact floor and ceiling of a / b for rationals a and b > 0, by integer arithmetic (no float rounding).
export function floorQ(a, b) {
  const num = a.n * b.d;
  const den = a.d * b.n;
  let q = Math.floor(num / den);
  while (q * den > num) q -= 1;
  while ((q + 1) * den <= num) q += 1;
  return q;
}
export const ceilQ = (a, b) => -floorQ(neg(a), b);
export const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));
export const toNumber = (a) => a.n / a.d; // display geometry only, never state

// "3/4" or "3" (no spaces so it reads the same in every language).
export const ratText = (a) => (a.d === 1 ? String(a.n) : `${a.n}/${a.d}`);
// Mixed number text: 7/4 -> "1 3/4", -7/4 -> "-1 3/4", 2 -> "2", 3/4 -> "3/4".
export function mixedText(a) {
  if (a.d === 1 || Math.abs(a.n) < a.d) return ratText(a);
  const whole = Math.trunc(a.n / a.d);
  return `${whole} ${Math.abs(a.n) % a.d}/${a.d}`;
}
// Exact decimal text when the denominator is 2^a * 5^b, otherwise null.
export function decimalText(a) {
  let rest = a.d;
  let twos = 0;
  let fives = 0;
  while (rest % 2 === 0) [rest, twos] = [rest / 2, twos + 1];
  while (rest % 5 === 0) [rest, fives] = [rest / 5, fives + 1];
  if (rest !== 1) return null;
  const places = Math.max(twos, fives);
  const scaled = safe(Math.abs(a.n) * (10 ** places / a.d));
  const digits = String(scaled).padStart(places + 1, "0");
  const text = places ? `${digits.slice(0, -places)}.${digits.slice(-places)}` : digits;
  return a.n < 0 ? `-${text}` : text;
}
// Parse "3/4", "-1 1/2", "0.25", ".5", "1,5", "12" into a reduced rational, or null.
export function parseRational(text) {
  const s = String(text ?? "")
    .trim()
    .replace(/−/g, "-")
    .replace(",", ".");
  let match = s.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (match) {
    const [, sign, whole, n, d] = match;
    if (Number(d) === 0) return null;
    return frac((sign ? -1 : 1) * (Number(whole) * Number(d) + Number(n)), Number(d));
  }
  match = s.match(/^(-?)(\d+)\s*\/\s*(\d+)$/);
  if (match) return Number(match[3]) === 0 ? null : frac((match[1] ? -1 : 1) * Number(match[2]), Number(match[3]));
  match = s.match(/^(-?)(\d*)\.?(\d*)$/);
  if (match && (match[2] || match[3])) {
    const places = match[3].length;
    if (places > 9 || match[2].length > 9) return null;
    return frac((match[1] ? -1 : 1) * Number(`${match[2] || "0"}${match[3]}`), 10 ** places);
  }
  return null;
}
// Reduced equivalent fractions {n, d} of a value with denominators up to maxD (lowest terms first).
export function equivalents(a, maxD) {
  const list = [];
  for (let k = 1; a.d * k <= maxD; k += 1) list.push({ n: a.n * k, d: a.d * k });
  return list;
}
export const isRational = (v) => Boolean(v) && Number.isInteger(v.n) && Number.isInteger(v.d) && v.d > 0;
export const must = (condition, message) => {
  if (!condition) throw new RangeError(message);
};
export const plain = (value) => JSON.parse(JSON.stringify(value));
