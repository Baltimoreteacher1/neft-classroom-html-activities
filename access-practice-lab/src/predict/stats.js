// Small, dependency-free statistics used by the forecasting engine. Every function is pure and deterministic.

export const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
export function sd(a) {
  if (a.length < 2) return NaN;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
}
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** Error function, Abramowitz and Stegun 7.1.26 (|error| < 1.5e-7), enough for 0.1-level probabilities. */
function erf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
export const normalCdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));

/** Inverse normal CDF (Acklam's rational approximation, relative error ~1e-9). */
export function normalInv(p) {
  if (!(p > 0 && p < 1)) return p <= 0 ? -Infinity : Infinity;
  const a = [
    -39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716,
    2.506628277459239,
  ];
  const b = [
    -54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972,
    -13.28068155288572,
  ];
  const c = [
    -0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (p < lo) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > 1 - lo) return -normalInv(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

/** Seeded generator (mulberry32) and a standard normal draw (Box-Muller), so demonstrations and tests reproduce exactly. */
export function rng(seed) {
  let s = seed >>> 0;
  const uniform = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = () => Math.sqrt(-2 * Math.log(1 - uniform())) * Math.cos(2 * Math.PI * uniform());
  return { uniform, normal };
}

/** A stable 32-bit hash of a string, used to assign students to folds without leaking by row order. */
export function hash32(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Simple least squares y = a + b x. */
export function ols(xs, ys) {
  const n = xs.length;
  const mx = mean(xs);
  const my = mean(ys);
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) ** 2;
    sxy += (xs[i] - mx) * (ys[i] - my);
  }
  const slope = sxx ? sxy / sxx : 0;
  const intercept = my - slope * mx;
  const rss = ys.reduce((s, y, i) => s + (y - (intercept + slope * xs[i])) ** 2, 0);
  return { intercept, slope, n, rss, sxx };
}

function solve(A, y) {
  const n = y.length;
  const M = A.map((row, i) => [...row, y[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    if (Math.abs(M[c][c]) < 1e-12) throw new Error("singular system");
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

/** Ridge regression on standardised features; the intercept is never penalised. Returns a predictor. */
export function ridge(X, y, lambda) {
  const p = X[0].length;
  const mx = Array.from({ length: p }, (_, j) => mean(X.map((r) => r[j])));
  const sx = Array.from({ length: p }, (_, j) => sd(X.map((r) => r[j])) || 1);
  const my = mean(y);
  const Z = X.map((r) => r.map((v, j) => (v - mx[j]) / sx[j]));
  const A = Array.from({ length: p }, (_, i) =>
    Array.from(
      { length: p },
      (_, j) => Z.reduce((s, r) => s + r[i] * r[j], 0) + (i === j ? lambda : 0),
    ),
  );
  const b = Array.from({ length: p }, (_, i) => Z.reduce((s, r, k) => s + r[i] * (y[k] - my), 0));
  const beta = solve(A, b);
  return {
    beta,
    predict: (row) => my + row.reduce((s, v, j) => s + ((v - mx[j]) / sx[j]) * beta[j], 0),
  };
}
