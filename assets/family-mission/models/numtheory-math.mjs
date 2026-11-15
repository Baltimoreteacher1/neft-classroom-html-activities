// Integer helpers for the "numtheory" family. Every value is a whole number from 2 to 500 (or a
// product of two of them), so plain integer arithmetic is exact: no floats decide or print anything.

export const MIN = 2;
export const MAX = 500;
/** One-step skip counting must be finishable: no track may need more than this many steps. */
export const MAX_STEPS = 100;

export const gcd = (a, b) => (b ? gcd(b, a % b) : a);
export const lcm = (a, b) => (a / gcd(a, b)) * b;
export const inRange = (n) => Number.isInteger(n) && n >= MIN && n <= MAX;

/** 48, "48" -> 48; anything else -> NaN (never throws). */
export function toInt(x) {
  if (typeof x === "number") return x;
  return typeof x === "string" && /^\d{1,4}$/.test(x.trim()) ? Number(x.trim()) : Number.NaN;
}

export function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let p = 2; p * p <= n; p += 1) if (n % p === 0) return false;
  return true;
}

/** The real factor pairs [p, q] of n with 2 <= p <= q, smallest p first. */
export function pairsOf(n) {
  const out = [];
  for (let p = 2; p * p <= n; p += 1) if (n % p === 0) out.push([p, n / p]);
  return out;
}

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (e) => String(e).replace(/\d/g, (d) => SUP[Number(d)]);

/** [2, 2, 3, 5] -> "2² × 3 × 5". */
export function powerForm(primes) {
  const runs = [];
  for (const p of primes) {
    const last = runs[runs.length - 1];
    if (last && last.p === p) last.e += 1;
    else runs.push({ p, e: 1 });
  }
  return runs.map((r) => (r.e > 1 ? `${r.p}${sup(r.e)}` : String(r.p))).join(" × ");
}

export const sortedNums = (xs) => [...xs].sort((x, y) => x - y);
export const product = (xs) => xs.reduce((acc, x) => acc * x, 1);
