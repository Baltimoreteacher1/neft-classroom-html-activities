// The exact numbers behind the GCF and LCM figures: factor lists, shared factors, prime splits, hops. Computed from the two numbers; nothing typed.
// GCF is found as the largest shared factor in the lists and LCM as the first multiple of a that b also divides (a different route from the lab's
// gcd formula), so tests can compare the two routes.
import { commas, int } from "../exact.mjs";

export const FACTOR_BOUNDS = Object.freeze([2, 36]);

/** @param {string} name @param {unknown} v */
function whole(name, v) {
  if (typeof v !== "number" || !Number.isInteger(v) || v < FACTOR_BOUNDS[0] || v > FACTOR_BOUNDS[1]) throw new RangeError(`${name} must be a whole number from ${FACTOR_BOUNDS[0]} to ${FACTOR_BOUNDS[1]}`);
  return v;
}

/** Every factor of n, ascending. @param {number} n */
export function factorsOf(n) {
  const out = [];
  for (let d = 1; d <= n; d++) if (n % d === 0) out.push(d);
  return out;
}

/** Prime factors with repeats, ascending: 12 -> [2, 2, 3]. @param {number} n */
export function primesOf(n) {
  const out = [];
  let r = n;
  for (let p = 2; r > 1; p++) {
    while (r % p === 0) {
      out.push(p);
      r /= p;
    }
  }
  return out;
}

/** @param {number} n */
export const show = (n) => commas(n);

/**
 * @param {number[]} values [first number, second number]
 */
export function factorsModel(values) {
  const a = whole("First number", values[0]);
  const b = whole("Second number", values[1]);
  const fa = factorsOf(a);
  const fb = factorsOf(b);
  const shared = fa.filter((f) => fb.includes(f));
  const gcf = Math.max(...shared);
  let lcm = a;
  while (lcm % b !== 0) lcm += a;
  const qa = Number(int(a).div(int(gcf)).n);
  const qb = Number(int(b).div(int(gcf)).n);
  const pa = primesOf(a);
  const pb = primesOf(b);
  /** One column per prime of the LCM: both numbers have it (shared) or only one does. @type {Array<{ p: number, inA: boolean, inB: boolean }>} */
  const cols = [];
  for (const p of [...new Set([...pa, ...pb])].sort((x, y) => x - y)) {
    const ea = pa.filter((q) => q === p).length;
    const eb = pb.filter((q) => q === p).length;
    for (let i = 0; i < Math.max(ea, eb); i++) cols.push({ p, inA: i < ea, inB: i < eb });
  }
  return { a, b, fa, fb, shared, gcf, lcm, qa, qb, hopsA: lcm / a, hopsB: lcm / b, sum: a + b, pa, pb, cols, productCols: cols.reduce((t, c) => t * c.p, 1) };
}

/** @typedef {ReturnType<typeof factorsModel>} FactorsModel */

export const factorsControls = () => [
  { label: "First number", labelEs: "Primer número", min: 2, max: 36, step: 1 },
  { label: "Second number", labelEs: "Segundo número", min: 2, max: 36, step: 1 },
];
