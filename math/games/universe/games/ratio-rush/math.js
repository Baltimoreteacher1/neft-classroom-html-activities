// Ratio Rush — the mathematics. Pure functions, no DOM, no game state.
// Lessons 3-1/3-2 (ratios, rates, unit rates), 3-3/3-4 (equivalent ratios in
// tables and graphs), 3-5 (compare ratio relationships), 3-8 (unit-rate
// problems). A rate is always a pair { d, t }: d miles in t minutes. Nothing is
// ever stored as a rounded decimal; comparisons use cross-products.

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

/** Simplest form of d : t. */
export function simplest(r) {
  const g = gcd(r.d, r.t);
  return { d: r.d / g, t: r.t / g };
}

/** True when a : b and c : d name the same rate (a·d = b·c). */
export function equivalent(r1, r2) {
  return r1.d * r2.t === r2.d * r1.t;
}

/** -1, 0, 1: is r1 slower, equal, faster than r2. */
export function compare(r1, r2) {
  const x = r1.d * r2.t - r2.d * r1.t;
  return x < 0 ? -1 : x > 0 ? 1 : 0;
}

/** Unit rate (miles per minute) as an exact fraction { n, d }. */
export function unitRate(r) {
  const s = simplest(r);
  return { n: s.d, d: s.t };
}

/** Distance covered after `minutes` at rate r, as an exact fraction { n, d }. */
export function distanceAt(r, minutes) {
  const g = gcd(r.d * minutes, r.t);
  return { n: (r.d * minutes) / g, d: r.t / g };
}

/** Minutes to cover `miles` at rate r, as an exact fraction { n, d }. */
export function timeFor(r, miles) {
  const g = gcd(miles * r.t, r.d);
  return { n: (miles * r.t) / g, d: r.d / g };
}

/** The ratio table a rate generates: k = 1..n rows of (k·d, k·t). */
export function table(r, n) {
  return Array.from({ length: n }, (_, i) => ({
    d: r.d * (i + 1),
    t: r.t * (i + 1),
  }));
}

/** "Add the same amount" — the additive misconception: from d:t to (d+k):(t+k). */
export function additive(r, k) {
  return { d: r.d + k, t: r.t + k };
}

/** A fraction as text: "3", "3/2", "1 1/2" when mixed. */
export function fracText(f, mixed = false) {
  const g = gcd(f.n, f.d);
  const n = f.n / g;
  const d = f.d / g;
  if (d === 1) return String(n);
  if (mixed && n > d) return `${Math.floor(n / d)} ${n % d}/${d}`;
  return `${n}/${d}`;
}

/** Value of an exact fraction. */
export const val = (f) => f.n / f.d;
