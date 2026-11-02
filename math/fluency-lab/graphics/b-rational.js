// Exact rational arithmetic for the interactive graphics: plain {n, d} objects, d > 0, lowest terms.
// Floats appear only when a pointer position is turned into a snapped grid value; state never holds them.
export const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
};

export function rat(n, d = 1) {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0)
    throw new RangeError(`Bad rational ${n}/${d}`);
  const g = gcd(n, d) || 1;
  const sign = d < 0 ? -1 : 1;
  return { n: (sign * n) / g, d: (sign * d) / g };
}

export const ZERO = Object.freeze(rat(0));
export const ONE = Object.freeze(rat(1));
export const isRat = (v) => Boolean(v) && Number.isInteger(v.n) && Number.isInteger(v.d) && v.d > 0;
export const add = (a, b) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => rat(a.n * b.n, a.d * b.d);
export const div = (a, b) => {
  if (b.n === 0) throw new RangeError("Division by zero");
  return rat(a.n * b.d, a.d * b.n);
};
export const neg = (a) => rat(-a.n, a.d);
export const abs = (a) => rat(Math.abs(a.n), a.d);
export const cmp = (a, b) => Math.sign(a.n * b.d - b.n * a.d);
export const eq = (a, b) => a.n === b.n && a.d === b.d;
export const isInt = (a) => a.d === 1;
export const min = (a, b) => (cmp(a, b) <= 0 ? a : b);
export const max = (a, b) => (cmp(a, b) >= 0 ? a : b);
export const clamp = (v, lo, hi) => max(lo, min(hi, v));
export const sum = (list) => list.reduce(add, ZERO);
export const floorInt = (a) => Math.floor(a.n / a.d);
export const toNumber = (a) => a.n / a.d;
export const sortRats = (list) => [...list].sort(cmp);

// Nearest multiple of `step` (ties round up), exact.
export function snapTo(value, step) {
  const q = div(value, step);
  const k = Math.floor((2 * q.n + q.d) / (2 * q.d));
  return mul(step, rat(k));
}

// A pointer coordinate (float) to the nearest multiple of `step`, as an exact rational.
export function snapFloat(x, step) {
  return mul(step, rat(Math.round(x / toNumber(step))));
}

// Accepts {n, d}, an integer, or text such as "3/4", "1.25", "-2", "1 1/2"; otherwise returns the fallback.
export function parse(value, fallback = null) {
  if (isRat(value)) return rat(value.n, value.d);
  if (Number.isInteger(value)) return rat(value);
  if (typeof value !== "string") return fallback;
  const text = value.trim();
  let m = text.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (m && Number(m[3])) {
    const whole = Number(m[1]);
    const part = rat(Number(m[2]), Number(m[3]));
    return whole < 0 || text.startsWith("-") ? sub(rat(whole), part) : add(rat(whole), part);
  }
  m = text.match(/^(-?\d+)\/(\d+)$/);
  if (m && Number(m[2])) return rat(Number(m[1]), Number(m[2]));
  m = text.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (m) {
    const digits = m[3] || "";
    const value10 = rat(Number(`${m[2]}${digits}`), 10 ** digits.length);
    return m[1] ? neg(value10) : value10;
  }
  return fallback;
}

// Sanitizer for stored state: a rational inside [lo, hi], else the fallback.
export function sane(value, fallback, lo = null, hi = null) {
  let r = parse(value, null);
  if (!r || Math.abs(r.n) > 1e9 || r.d > 1e6) r = fallback;
  if (lo && cmp(r, lo) < 0) r = lo;
  if (hi && cmp(r, hi) > 0) r = hi;
  return r;
}

export const fmt = (a) => (isInt(a) ? String(a.n) : `${a.n}/${a.d}`);

export function mixed(a) {
  if (isInt(a) || Math.abs(a.n) < a.d) return fmt(a);
  const whole = Math.trunc(a.n / a.d);
  return `${whole} ${Math.abs(a.n) - Math.abs(whole) * a.d}/${a.d}`;
}

// Exact decimal text when the expansion terminates, else null.
export function decimalText(a) {
  let d = a.d;
  let twos = 0;
  let fives = 0;
  while (d % 2 === 0) {
    d /= 2;
    twos += 1;
  }
  while (d % 5 === 0) {
    d /= 5;
    fives += 1;
  }
  if (d !== 1) return null;
  const places = Math.max(twos, fives);
  if (places === 0) return String(a.n);
  const scaled = Math.abs(a.n) * (10 ** places / a.d);
  const digits = String(scaled).padStart(places + 1, "0");
  const text = `${digits.slice(0, -places)}.${digits.slice(-places)}`.replace(/0+$/, "");
  return `${a.n < 0 ? "-" : ""}${text}`;
}

// Display text for a rational: exact decimal if short, else a fraction.
export const show = (a) => {
  const dec = decimalText(a);
  return dec !== null && dec.length <= 8 ? dec : fmt(a);
};
