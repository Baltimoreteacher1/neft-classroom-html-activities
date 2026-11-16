// Exact long division for the shipments model: total supply a = A/10 divided by shipment size b = B/10 (A, B whole tenths).
// Slide both points so the divisor is whole, then divide one digit at a time (divide, multiply, subtract, bring down), annexing
// zeros after the point until the remainder is 0 or the quotient has MAX_DP decimal places. Pure BigInt/Rat, no floats.
import { Rat } from "../exact.mjs";

export const MAX_DP = 4;

/**
 * @typedef {object} Step
 * @property {number} k step number, 1-based
 * @property {number} col dividend column this step finishes on
 * @property {bigint} cur the number being divided (remainder with the digit brought down)
 * @property {bigint} q quotient digit
 * @property {bigint} prod q x divisor
 * @property {bigint} rem cur - prod
 * @property {number | null} next the digit brought down next, or null at the end
 * @property {boolean} nextAnnexed whether that digit is an annexed zero
 */

/**
 * @param {number} tenthsA dividend in tenths (whole number) @param {number} tenthsB divisor in tenths (whole number)
 */
export function longDivision(tenthsA, tenthsB) {
  const A = BigInt(tenthsA);
  const B = BigInt(tenthsB);
  if (A <= 0n || B <= 0n) throw new RangeError("both numbers must be positive");
  const quotient = new Rat(A, B);
  const p = B % 10n === 0n ? 0 : 1; // the divisor has a decimal place
  const q = A % 10n === 0n ? 0 : 1; // the dividend has a decimal place
  const D = p ? B : B / 10n;
  const digitsStr = p || q ? String(A) : String(A / 10n);
  const f = p ? 0 : q;
  const typed = digitsStr.length; // digits written in the problem (after the slide)
  const lastInt = typed - f - 1;
  /** @type {number[]} */
  const digits = [...digitsStr].map(Number);
  /** @type {Step[]} */
  const steps = [];
  let r = 0n;
  let started = false;
  let i = 0;
  while (true) {
    const frac = Math.max(0, i - (typed - f));
    if (i >= typed && (r === 0n || frac >= MAX_DP)) break;
    if (i >= digits.length) digits.push(0);
    const cur = r * 10n + BigInt(digits[i]);
    const qd = cur / D;
    if (!started && qd === 0n && i <= lastInt) {
      r = cur;
      i++;
      continue;
    }
    started = true;
    const prod = qd * D;
    r = cur - prod;
    steps.push({ k: steps.length + 1, col: i, cur, q: qd, prod, rem: r, next: null, nextAnnexed: false });
    i++;
  }
  const total = digits.length;
  // what each step brings down next
  for (const s of steps) {
    if (s.col + 1 < total) {
      s.next = digits[s.col + 1];
      s.nextAnnexed = s.col + 1 >= typed;
    }
  }
  const lead = steps.length && steps[0].col <= lastInt ? steps[0].col : lastInt + 1; // first column holding a quotient digit
  const terminates = r === 0n;
  return {
    A, B, p, q, D, digits, typed, f, total, steps, lastInt, lead,
    terminates,
    finalRemainder: r,
    annexed: total - typed,
    point: total > typed - f, // the quotient (and dividend) show a point
    pointAfter: typed - f - 1,
    quotient,
    /** Whole-number reading when both numbers are whole: quotient and remainder. */
    whole: !p && !q ? { q: A / 10n / D, r: (A / 10n) % D } : null,
  };
}

/** @typedef {ReturnType<typeof longDivision>} LongDivision */
