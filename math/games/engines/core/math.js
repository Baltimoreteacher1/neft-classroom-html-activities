// Pure helpers shared by engine games and their node tests. No DOM.

/** Seeded PRNG (mulberry32): same seed, same rounds — tests replay exactly. */
export function rng(seed) {
  let a = seed >>> 0 || 1;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [lo, hi] inclusive. */
export function randInt(next, lo, hi) {
  return lo + Math.floor(next() * (hi - lo + 1));
}

/** @template T @param {() => number} next @param {T[]} list @returns {T} */
export function pick(next, list) {
  return list[Math.floor(next() * list.length)];
}

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

export function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

/** Reduced fraction {n, d} with d > 0. */
export function frac(n, d) {
  if (d === 0) throw new Error("frac: zero denominator");
  const g = gcd(n, d);
  const s = d < 0 ? -1 : 1;
  return { n: (s * n) / g, d: (s * d) / g };
}

/** "a/b", or "w a/b" mixed when improper and mixed=true, or "w" when whole. */
export function fracText(f, mixed = false) {
  const { n, d } = frac(f.n, f.d);
  if (d === 1) return String(n);
  if (mixed && Math.abs(n) > d) {
    const w = Math.trunc(n / d);
    const r = Math.abs(n % d);
    return `${w} ${r}/${d}`;
  }
  return `${n}/${d}`;
}

/** Round to a number of decimal places without binary noise (0.1+0.2 → 0.3). */
export function roundTo(x, places) {
  const m = 10 ** places;
  return Math.round((x + Number.EPSILON) * m) / m;
}

/** Decimal text that never prints binary noise or a trailing ".0". */
export function decText(x, places = 3) {
  return String(roundTo(x, places));
}
