// The exact numbers behind the two expression figures. Built from the lab's three values (a, b, x) with exact.mjs; nothing here is typed.
// The lab's own readout (math.mjs, case 'expression') is a(x + b); both figures agree with it.
import { commas, int } from "../exact.mjs";

export const EXPR_BOUNDS = Object.freeze({ a: [1, 8], b: [1, 10], x: [1, 10] });

/** @param {string} name @param {unknown} v @param {number[]} range */
function whole(name, v, range) {
  if (typeof v !== "number" || !Number.isInteger(v) || v < range[0] || v > range[1]) throw new RangeError(`${name} must be a whole number from ${range[0]} to ${range[1]}`);
  return v;
}

/**
 * @param {number[]} values [a, b, x] in the lab's order
 */
export function expressionModel(values) {
  const a = whole("Factor a", values[0], EXPR_BOUNDS.a);
  const b = whole("Constant b", values[1], EXPR_BOUNDS.b);
  const c = whole("Value of x", values[2], EXPR_BOUNDS.x);
  const A = int(a);
  const B = int(b);
  const C = int(c);
  const sum = C.add(B);
  const total = A.mul(sum);
  const ax = A.mul(C);
  const ab = A.mul(B);
  const fee = ax.add(B);
  const short = total.sub(fee);
  /** @param {import("../exact.mjs").Rat} r */
  const show = (r) => commas(r.n);
  return {
    a,
    b,
    c,
    /** x + b with x plugged in */
    s: show(sum),
    total: total.n,
    totalText: show(total),
    ax: show(ax),
    ab: show(ab),
    /** a x + a b evaluated; equal to the total */
    expandedText: show(ax.add(ab)),
    /** the look-alike a x + b, where b is not multiplied */
    fee: show(fee),
    feeN: fee.n,
    short: show(short),
    /** the look-alike is a different value only when a is not 1 */
    differs: !fee.eq(total),
    // raw numbers for geometry only (never displayed)
    n: { a, b, c, s: Number(sum.n), total: Number(total.n), ax: Number(ax.n), ab: Number(ab.n), fee: Number(fee.n) },
    /** "3x + 12" (a coefficient of 1 is not written) */
    expandedForm: `${a === 1 ? "" : a}x + ${show(ab)}`,
    groupedForm: `${a}(x + ${b})`,
    feeForm: `${a === 1 ? "" : a}x + ${b}`,
  };
}

/** @typedef {ReturnType<typeof expressionModel>} ExpressionModel */

/** The shared control definitions for the lab's expression kind (same bounds and steps as math.mjs). */
export const expressionControls = () => [
  { label: "Factor a (groups)", labelEs: "Factor a (grupos)", min: 1, max: 8, step: 1 },
  { label: "Constant b", labelEs: "Constante b", min: 1, max: 10, step: 1 },
  { label: "Value of x", labelEs: "Valor de x", min: 1, max: 10, step: 1 },
];
