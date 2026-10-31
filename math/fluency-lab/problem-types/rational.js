// Exact rationals for the Fluency Lab 4.0 generators: plain { n, d } objects (d > 0, lowest terms), the same
// shape the graphics registry uses. No floats are ever stored; decimals are read and printed exactly.
export const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
};
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

export function Q(n, d = 1) {
  if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error(`Q needs integers: ${n}/${d}`);
  if (d === 0) throw new Error("Q: division by zero");
  const g = gcd(n, d);
  const sign = d < 0 ? -1 : 1;
  const out = { n: (sign * n) / g + 0, d: Math.abs(d) / g };
  if (!Number.isSafeInteger(out.n) || !Number.isSafeInteger(out.d)) throw new Error("Q: too large");
  return out;
}
export const add = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => Q(a.n * b.n, a.d * b.d);
export const div = (a, b) => Q(a.n * b.d, a.d * b.n);
export const neg = (a) => Q(-a.n, a.d);
export const abs = (a) => Q(Math.abs(a.n), a.d);
export const eq = (a, b) => a.n === b.n && a.d === b.d;
export const cmp = (a, b) => Math.sign(a.n * b.d - b.n * a.d);
export const isInt = (a) => a.d === 1;
export const isZero = (a) => a.n === 0;
export const toNum = (a) => a.n / a.d;
export const isQ = (v) => v && typeof v === "object" && Number.isInteger(v.n) && Number.isInteger(v.d);
export const asQ = (v) => (isQ(v) ? v : Q(v));
export const ZERO = Q(0);
export const ONE = Q(1);

// Exact text forms. Minus is the lab's own sign only where a learner reads it; meta strings use ASCII.
export const qs = (a) => (a.d === 1 ? String(a.n) : `${a.n}/${a.d}`);
export const fracText = qs;

export function mixedText(a) {
  if (a.d === 1 || Math.abs(a.n) < a.d) return qs(a);
  const whole = Math.trunc(Math.abs(a.n) / a.d);
  const rest = Math.abs(a.n) - whole * a.d;
  const sign = a.n < 0 ? "-" : "";
  return rest === 0 ? `${sign}${whole}` : `${sign}${whole} ${rest}/${a.d}`;
}

// The exact decimal text of a rational whose denominator has only factors 2 and 5, else null.
export function decText(a) {
  let d = a.d;
  let twos = 0;
  let fives = 0;
  while (d % 2 === 0) [d, twos] = [d / 2, twos + 1];
  while (d % 5 === 0) [d, fives] = [d / 5, fives + 1];
  if (d !== 1) return null;
  const places = Math.max(twos, fives);
  if (places === 0) return String(a.n);
  const scaled = (Math.abs(a.n) * 10 ** places) / a.d;
  const digits = String(scaled).padStart(places + 1, "0");
  const text = `${digits.slice(0, -places)}.${digits.slice(-places)}`;
  return a.n < 0 ? `-${text}` : text;
}
export const terminates = (a) => decText(a) !== null;

// Reads "3/4", "-2", "1.25" or "1 1/4" exactly. Throws on anything else: generators never guess.
export function parseQ(text) {
  const s = String(text).trim().replaceAll("−", "-");
  let m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/);
  if (m) return Q((m[1] ? -1 : 1) * (Number(m[2]) * Number(m[4]) + Number(m[3])), Number(m[4]));
  m = s.match(/^(-?\d+)\/(\d+)$/);
  if (m) return Q(Number(m[1]), Number(m[2]));
  m = s.match(/^(-?)(\d*)\.?(\d*)$/);
  if (m && (m[2] || m[3])) {
    const places = m[3].length;
    return Q((m[1] ? -1 : 1) * Number(`${m[2] || "0"}${m[3]}`), 10 ** places);
  }
  throw new Error(`parseQ: cannot read "${text}"`);
}
