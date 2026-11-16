// The fraction partition-and-count model: pure, exact, deterministic. supply a (in halves) divided by the share size b/c.
//   1. the supply is `rows` bars of 1 unit (the last may be half a bar)
//   2. every bar is cut into c equal parts: a x c parts in all
//   3. parts are put b at a time into shares: (a x c) / b shares = a / (b/c)
// Everything the picture and the text equivalent show is computed here from (key, a, b, c) with Rat; no float arithmetic is displayed.
import { Rat, int } from "../exact.mjs";
import { CONTEXT } from "./fractions-words.mjs";

/** The lab's own control bounds (curriculum/learning-labs/shared/math.mjs, case 'fraction'). */
export const BOUNDS = Object.freeze({ aMin: 0.5, aMax: 8, aStep: 0.5, bMin: 1, bMax: 5, cMin: 2, cMax: 8 });

/** @param {string} key @returns {import("./mount.mjs").Control[]} */
export function controlsFor(key) {
  const ctx = CONTEXT[key];
  if (!ctx) throw new RangeError(`not a fraction lab model: ${key}`);
  const [a, b, c] = ctx.labels;
  return [
    { label: a[0], labelEs: a[1], min: BOUNDS.aMin, max: BOUNDS.aMax, step: BOUNDS.aStep },
    { label: b[0], labelEs: b[1], min: BOUNDS.bMin, max: BOUNDS.bMax, step: 1 },
    { label: c[0], labelEs: c[1], min: BOUNDS.cMin, max: BOUNDS.cMax, step: 1 },
  ];
}

/** @param {Rat} x @param {Rat} y */
const cmp = (x, y) => {
  const d = x.n * y.d - y.n * x.d;
  return d < 0n ? -1 : d > 0n ? 1 : 0;
};
/** Geometry only (never displayed). @param {Rat} r */
const asNumber = (r) => Number(r.n) / Number(r.d);

/**
 * @param {string} key "fraction:servings" | "fraction:ribbon" | "fraction:field"
 * @param {number[]} values [supply, share numerator, share denominator], the lab's order
 */
export function build(key, values) {
  const ctx = CONTEXT[key];
  if (!ctx) throw new RangeError(`not a fraction lab model: ${key}`);
  if (!Array.isArray(values) || values.length !== 3) throw new RangeError("Three values: supply, numerator, denominator.");
  const [av, b, c] = values;
  const twice = Math.round(av * 2);
  if (!Number.isFinite(av) || Math.abs(av * 2 - twice) > 1e-9 || twice < BOUNDS.aMin * 2 || twice > BOUNDS.aMax * 2) throw new RangeError(`Supply must be ${BOUNDS.aMin} to ${BOUNDS.aMax}, in halves.`);
  if (!Number.isInteger(b) || b < BOUNDS.bMin || b > BOUNDS.bMax) throw new RangeError(`Numerator must be a whole number from ${BOUNDS.bMin} to ${BOUNDS.bMax}.`);
  if (!Number.isInteger(c) || c < BOUNDS.cMin || c > BOUNDS.cMax) throw new RangeError(`Denominator must be a whole number from ${BOUNDS.cMin} to ${BOUNDS.cMax}.`);

  const a = new Rat(BigInt(twice), 2n);
  const size = new Rat(BigInt(b), BigInt(c));
  const q = a.div(size);
  const parts = a.mul(int(c));
  const complete = Number(q.n / q.d);
  const leftover = q.sub(int(complete));
  const rows = Math.ceil(twice / 2);
  const check = q.mul(size);
  if (!check.eq(a)) throw new Error("fraction model invariant: quotient x share size must equal the supply");

  /** Bars: how much of each unit bar the supply fills (1, or 1/2 for the last). */
  const bars = Array.from({ length: rows }, (_, i) => asNumber(cmp(a, int(i + 1)) >= 0 ? int(1) : a.sub(int(i))));
  const count = leftover.n === 0n ? complete : complete + 1;
  const groups = Array.from({ length: count }, (_, g) => {
    const start = size.mul(int(g));
    const end0 = start.add(size);
    const end = cmp(end0, a) > 0 ? a : end0;
    /** @type {Array<{ row: number, from: number, to: number }>} */
    const segs = [];
    for (let i = 0; i < rows; i++) {
      const lo = cmp(start, int(i)) > 0 ? start : int(i);
      const hi = cmp(end, int(i + 1)) < 0 ? end : int(i + 1);
      if (cmp(hi, lo) > 0) segs.push({ row: i, from: asNumber(lo.sub(int(i))), to: asNumber(hi.sub(int(i))) });
    }
    return { n: g + 1, complete: g < complete, segs };
  });

  const multiplied = a.mul(size);
  const flipped = size.div(a);
  /** The wrong move this lesson family warns about; null when it happens to give the right answer, so it never states something untrue. */
  const wrong =
    ctx.wrong === "multiply" ? (multiplied.eq(q) ? null : { kind: "multiply", value: multiplied })
    : ctx.wrong === "flip" ? (flipped.eq(q) ? null : { kind: "flip", value: flipped })
    : leftover.n === 0n ? null : { kind: "leftover", value: leftover };

  return { key, ctx, a, b, c, size, q, parts, complete, leftover, rows, bars, groups, check, wrong };
}

/** @typedef {ReturnType<typeof build>} FractionModel */
