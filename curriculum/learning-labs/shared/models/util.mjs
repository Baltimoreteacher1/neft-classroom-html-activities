// Pure helpers shared by math.mjs and the registered models. No imports, so a model can load them without a cycle.
export const fmt = (n) => Number.isInteger(n) ? String(n) : Number(n.toFixed(4)).toLocaleString('en-US', { maximumFractionDigits: 4 });
export const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
export const median = (values) => {
  const s = [...values].sort((a, b) => a - b), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};
export function statistics(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const q1 = median(sorted.slice(0, Math.floor(sorted.length / 2)));
  const q3 = median(sorted.slice(Math.ceil(sorted.length / 2)));
  return { sorted, mean, median: median(sorted), min: sorted[0], max: sorted.at(-1), q1, q3,
    range: sorted.at(-1) - sorted[0], iqr: q3 - q1,
    mad: sorted.reduce((s, x) => s + Math.abs(x - mean), 0) / sorted.length };
}
/** One numeric control of a model: its label, bounds and step. */
export const control = (label, min, max, step = 1) => ({ label, min, max, step });
