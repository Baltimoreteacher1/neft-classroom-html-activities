// The Data Chase — the mathematics. No DOM.
// Lessons 2-1 (statistical questions), 2-2 (histograms), 2-3 (median),
// 2-4 (box plots), 2-5 (range and IQR), 2-8 (mean), 2-10 (choose measures).
// Center and spread come from the site's own statistics module, so the game
// and the lessons compute quartiles the same way (median left out of both
// halves when n is odd).

import {
  iqr,
  mean,
  median,
  quartiles,
  range,
} from "../../../../../assets/class-investigation/stats.js";

export { iqr, mean, median, quartiles, range };

/** Five-number summary. */
export function fiveNumbers(values) {
  const q = quartiles(values);
  return {
    min: Math.min(...values),
    q1: q.q1,
    median: q.median,
    q3: q.q3,
    max: Math.max(...values),
  };
}

/** Histogram counts for bins [start + i·width, start + (i+1)·width). */
export function histogram(values, width, start = Math.floor(Math.min(...values) / width) * width) {
  const bins = [];
  const top = Math.max(...values);
  for (let a = start; a <= top; a += width)
    bins.push({ from: a, to: a + width, n: values.filter((v) => v >= a && v < a + width).length });
  return bins;
}

/** Bins with the most values (ties all count as right). */
export function tallest(bins) {
  const m = Math.max(...bins.map((b) => b.n));
  return bins.filter((b) => b.n === m);
}

/** An outlier by the 1.5 × IQR rule. */
export function outliers(values) {
  const q = quartiles(values);
  const k = 1.5 * (q.q3 - q.q1);
  return values.filter((v) => v < q.q1 - k || v > q.q3 + k);
}

/** How many values sit below a number (the fact-checker's line). */
export const countBelow = (values, x) => values.filter((v) => v < x).length;

export const near = (a, b) => Math.abs(a - b) < 1e-9;

/** Display a measure: whole numbers plain, otherwise one decimal place at most two. */
export function num(x) {
  return Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100);
}
