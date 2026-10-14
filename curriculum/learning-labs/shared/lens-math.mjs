// Pure mathematics behind each lab "lens" (the second picture under a lab's model).
// No DOM here: tools/learning-labs.test.mjs re-derives these numbers independently.
import { gcd, median, statistics } from './math.mjs';

const round = (n, places = 4) => Number(n.toFixed(places));

/** Histogram counts for equal-width intervals starting at 0. The data never changes, only the bins. */
export function bins(values, width) {
  const count = Math.max(1, Math.floor(Math.max(...values) / width) + 1);
  const counts = Array(count).fill(0);
  values.forEach((v) => { counts[Math.floor(v / width)]++; });
  return counts.map((n, i) => ({ from: i * width, to: i * width + width - 1, n }));
}
export function shapeWord(counts) {
  const n = counts.map((c) => c.n), total = n.reduce((a, b) => a + b, 0), peak = Math.max(...n);
  const at = n.indexOf(peak), mid = (n.length - 1) / 2;
  if (n.length <= 2) return 'too few bars to describe a shape';
  if (at < mid - 0.75) return 'piled up on the low side, with a tail toward high values';
  if (at > mid + 0.75) return 'piled up on the high side, with a tail toward low values';
  return total ? 'roughly centered' : 'empty';
}

/** Compare a data set with and without its largest value (the outlier). */
export function outlierEffect(values) {
  const all = statistics(values), without = statistics([...values].sort((a, b) => a - b).slice(0, -1));
  return { outlier: all.max, all, without,
    meanShift: round(all.mean - without.mean), medianShift: round(all.median - without.median), iqrShift: round(all.iqr - without.iqr) };
}

/** Front-end estimation bounds for price × quantity: truncate the price down, round it up. */
export function receiptBounds(price, qty) {
  const lowPrice = Math.floor(price), highPrice = Math.ceil(price);
  return { low: lowPrice * qty, high: highPrice * qty, exact: round(price * qty, 2), lowPrice, highPrice };
}
export function boundsCheck(low, high, exact) {
  if (![low, high].every(Number.isFinite)) return 'missing';
  if (low > high) return 'swapped';
  if (exact < low) return 'too-high-low';
  if (exact > high) return 'too-low-high';
  return high - low > exact * 0.5 ? 'wide' : 'good';
}

/** Concentration of the first ingredient in a mixture, and the same mixture scaled by k. */
export const concentration = (a, b) => a / (a + b);
export const scaledMix = (a, b, k) => ({ a: a * k, b: b * k, same: Math.abs(concentration(a, b) - concentration(a * k, b * k)) < 1e-12 });

/** A 3:2 blueprint grown by multiplying (similar) and by adding (distorted). */
export function blueprint(k, w = 3, h = 2) {
  const mult = { w: w * k, h: h * k }, add = { w: w + k, h: h + k };
  return { mult, add, original: w / h, multRatio: mult.w / mult.h, addRatio: add.w / add.h, distorted: Math.abs(add.w / add.h - w / h) > 1e-12 };
}

/** Best pack under a budget and a storage limit. Packs are whole; a pack is {price, items}. */
export function bestBuy(packs, budget, storage) {
  return packs.map((p) => {
    const n = Math.max(0, Math.min(Math.floor(budget / p.price), Math.floor(storage / p.items)));
    return { ...p, packs: n, items: n * p.items, cost: n * p.price, unit: p.price / p.items, limit: Math.floor(budget / p.price) <= Math.floor(storage / p.items) ? 'budget' : 'storage' };
  });
}

/** Percent → every form of the same number. */
export function percentForms(p) {
  const g = gcd(p, 100);
  return { fraction: `${p}/100`, simple: `${p / g}/${100 / g}`, decimal: p / 100, percent: `${p}%`, ratio: `${p}:100`, simpleRatio: `${p / g}:${100 / g}`, simpleOnly: g === 1 };
}
/** Zoom one square (1%) into tenths. A fractional percent like 12.5 shades whole squares plus tenths. */
export function zoomPercent(f) {
  const whole = Math.floor(f + 1e-9), tenths = Math.round((f - whole) * 10);
  return { whole, tenths, thousandths: Math.round(f * 10), per1000: `${Math.round(f * 10)}/1000` };
}

/** "a% off, then d% off" against one combined discount. */
export function successive(price, first, second) {
  const after1 = price * (1 - first / 100), after2 = after1 * (1 - second / 100);
  const naive = price * (1 - (first + second) / 100);
  return { after1, after2, naive, equivalentOff: round((1 - after2 / price) * 100, 4), gap: round(after2 - naive, 4), whole2: after1 };
}

/** The 1% unit block: part is p% of an unknown whole. */
export function unitBlock(part, p) {
  const one = part / p;
  return { one, whole: one * 100, at: (s) => one * s };
}

/** A parallelogram with a slanted side: the perpendicular cut works, the slanted cut does not. */
export function parallelogramCut(base, height, offset = 3) {
  return { slant: Math.hypot(offset, height), area: base * height, rectangleFromAltitude: true, rectangleFromSlant: offset === 0, triangleArea: base * height / 2 };
}

/** Two rectangles on a grid: double-counted overlap and the empty corner of the bounding box. */
export function overlapScan(w1, h1, w2, h2, dx, dy) {
  const ox = Math.max(0, Math.min(w1, dx + w2) - Math.max(0, dx)), oy = Math.max(0, Math.min(h1, dy + h2) - Math.max(0, dy));
  const overlap = ox * oy, union = w1 * h1 + w2 * h2 - overlap;
  const bw = Math.max(w1, dx + w2) - Math.min(0, dx), bh = Math.max(h1, dy + h2) - Math.min(0, dy);
  return { overlap, union, sum: w1 * h1 + w2 * h2, bounding: bw * bh, gap: bw * bh - union, bw, bh };
}

/** Fraction division: how much of one serving ("scoop") is left over. Supply is in halves. */
export function remainderOfScoop(supplyHalves, num, den) {
  const N = supplyHalves * den, D = 2 * num, whole = Math.floor(N / D), r = N - whole * D, g = gcd(r, D) || 1;
  return { whole, remN: r / g, remD: r ? D / g : 1, fractionOfScoop: r / D };
}

/** Value of three algebra forms at x, so the area model and the table agree. */
export const expressionRow = (a, b, x) => ({ x, factored: a * (x + b), distributed: a * x + a * b, wrong: a * x + b });

/** Signed position from a movable zero, against absolute distance from it. */
export const fromReference = (x, ref) => ({ signed: x - ref, distance: Math.abs(x - ref), fromZero: Math.abs(x) });

/** L-shaped street route between two points. */
export const taxicab = (x1, y1, x2, y2) => ({ dx: Math.abs(x1 - x2), dy: Math.abs(y1 - y2), total: Math.abs(x1 - x2) + Math.abs(y1 - y2) });

/** Balance tape: undo "x + a = b" or "a·x = b" the same way on both sides. */
export function balanceTape(mode, a, b) {
  const op = mode === 'add' ? `− ${a}` : `÷ ${a}`;
  const x = mode === 'add' ? b - a : b / a;
  return { op, x, left: mode === 'add' ? `x + ${a} ${op}` : `${a}x ${op}`, right: `${b} ${op}` };
}
/** Plug a candidate back into the equation. */
export function lockTest(mode, a, b, c) {
  const lhs = mode === 'add' ? c + a : a * c;
  return { lhs, rhs: b, open: Math.abs(lhs - b) < 1e-9 };
}

/** Which whole, non-negative values satisfy x ≤ boundary (or <)? */
export function wholeDomain(boundary, symbol, max = 30) {
  const ok = (n) => ({ '<=': n <= boundary, '<': n < boundary, '>=': n >= boundary, '>': n > boundary }[symbol]);
  return Array.from({ length: max + 1 }, (_, n) => n).filter(ok);
}

/** y = m·n + k tested against the pattern's real cases. */
export function ruleCheck(a, b, m, k, cases = 6) {
  const rows = Array.from({ length: cases }, (_, i) => ({ n: i + 1, actual: a * (i + 1) + b, guess: m * (i + 1) + k }));
  const firstMiss = rows.find((r) => r.actual !== r.guess);
  return { rows, ok: !firstMiss, firstMiss };
}

/** An estimate with real-world assumptions: expected count and honest bounds. */
export function assumedEstimate(total, fillPercent, spread = 10) {
  const low = Math.floor(total * Math.max(0, fillPercent - spread) / 100), high = Math.ceil(total * Math.min(100, fillPercent + spread) / 100);
  return { expected: round(total * fillPercent / 100, 2), low, high };
}

export { median };
