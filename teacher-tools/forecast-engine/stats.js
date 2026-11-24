/* Forecast Engine — statistics library.
 * Pure math, no DOM, no state. Loaded by the page (window.NFEStats), by the
 * background worker (importScripts) and by tools/forecast-stats.test.mjs
 * (require), so there is exactly one implementation of every formula. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.NFEStats = factory();
})(typeof self !== "undefined" ? self : this, () => {
  "use strict";

  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const mean = (a) => (a.length ? sum(a) / a.length : Number.NaN);
  function variance(a) {
    if (a.length < 2) return Number.NaN;
    const m = mean(a);
    return sum(a.map((v) => (v - m) ** 2)) / (a.length - 1);
  }
  const sd = (a) => Math.sqrt(variance(a));
  function quantile(a, p) {
    if (!a.length) return Number.NaN;
    const s = a.slice().sort((x, y) => x - y);
    const h = (s.length - 1) * p;
    const lo = Math.floor(h);
    const hi = Math.ceil(h);
    return s[lo] + (s[hi] - s[lo]) * (h - lo);
  }
  const median = (a) => quantile(a, 0.5);
  /** Median absolute deviation scaled to match a standard deviation. */
  function madSd(a) {
    if (a.length < 2) return Number.NaN;
    const m = median(a);
    return 1.4826 * median(a.map((v) => Math.abs(v - m)));
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* ── Normal distribution ─────────────────────────────────────────────── */
  function erfc(x) {
    // Numerical Recipes erfcc, fractional error < 1.2e-7 everywhere.
    const z = Math.abs(x);
    const t = 1 / (1 + 0.5 * z);
    const r =
      t *
      Math.exp(
        -z * z -
          1.26551223 +
          t *
            (1.00002368 +
              t *
                (0.37409196 +
                  t *
                    (0.09678418 +
                      t *
                        (-0.18628806 +
                          t *
                            (0.27886807 +
                              t *
                                (-1.13520398 +
                                  t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
      );
    return x >= 0 ? r : 2 - r;
  }
  const normCdf = (z) => 0.5 * erfc(-z / Math.SQRT2);
  function normPpf(p) {
    // Acklam's rational approximation, relative error < 1.2e-9.
    if (p <= 0) return Number.NEGATIVE_INFINITY;
    if (p >= 1) return Number.POSITIVE_INFINITY;
    const a = [
      -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
      -3.066479806614716e1, 2.506628277459239,
    ];
    const b = [
      -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
      -1.328068155288572e1,
    ];
    const c = [
      -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
      4.374664141464968, 2.938163982698783,
    ];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
    const lo = 0.02425;
    let q;
    let r;
    if (p < lo) {
      q = Math.sqrt(-2 * Math.log(p));
      return (
        (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
      );
    }
    if (p > 1 - lo) return -normPpf(1 - p);
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }

  /* ── Student t distribution ──────────────────────────────────────────── */
  function lnGamma(x) {
    const g = [
      76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
      0.1208650973866179e-2, -0.5395239384953e-5,
    ];
    let y = x;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j += 1) {
      y += 1;
      ser += g[j] / y;
    }
    return -tmp + Math.log((2.5066282746310005 * ser) / x);
  }
  function betaCf(a, b, x) {
    const tiny = 1e-30;
    let c = 1;
    let d = 1 - ((a + b) * x) / (a + 1);
    if (Math.abs(d) < tiny) d = tiny;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= 200; m += 1) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < tiny) d = tiny;
      c = 1 + aa / c;
      if (Math.abs(c) < tiny) c = tiny;
      d = 1 / d;
      h *= d * c;
      aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
      d = 1 + aa * d;
      if (Math.abs(d) < tiny) d = tiny;
      c = 1 + aa / c;
      if (Math.abs(c) < tiny) c = tiny;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 3e-12) break;
    }
    return h;
  }
  function betaInc(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(
      lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
    );
    return x < (a + 1) / (a + b + 2)
      ? (bt * betaCf(a, b, x)) / a
      : 1 - (bt * betaCf(b, a, 1 - x)) / b;
  }
  function tCdf(t, df) {
    if (!Number.isFinite(t)) return t > 0 ? 1 : 0;
    const x = df / (df + t * t);
    const tail = 0.5 * betaInc(df / 2, 0.5, x);
    return t > 0 ? 1 - tail : tail;
  }
  function tPpf(p, df) {
    if (p <= 0) return Number.NEGATIVE_INFINITY;
    if (p >= 1) return Number.POSITIVE_INFINITY;
    if (df > 1e6) return normPpf(p);
    let lo = -1e3;
    let hi = 1e3;
    for (let i = 0; i < 90; i += 1) {
      const mid = (lo + hi) / 2;
      if (tCdf(mid, df) < p) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }
  /** Two-sided critical value, e.g. 0.95 → 2.57 at df = 5. */
  const tCrit = (level, df) => tPpf(1 - (1 - level) / 2, df);

  /* ── Regression ──────────────────────────────────────────────────────── */
  /** Ordinary least squares y = a + b·x with the pieces needed for intervals. */
  function linReg(xs, ys) {
    const n = xs.length;
    if (n < 2) return null;
    const xbar = mean(xs);
    const ybar = mean(ys);
    let sxx = 0;
    let sxy = 0;
    let syy = 0;
    for (let i = 0; i < n; i += 1) {
      sxx += (xs[i] - xbar) ** 2;
      sxy += (xs[i] - xbar) * (ys[i] - ybar);
      syy += (ys[i] - ybar) ** 2;
    }
    if (sxx === 0) return null;
    const slope = sxy / sxx;
    const intercept = ybar - slope * xbar;
    const sse = Math.max(0, syy - slope * sxy);
    const df = n - 2;
    const sigma = df > 0 ? Math.sqrt(sse / df) : Number.NaN;
    const seSlope = df > 0 ? sigma / Math.sqrt(sxx) : Number.NaN;
    const r2 = syy > 0 ? 1 - sse / syy : 0;
    const tSlope = seSlope > 0 ? slope / seSlope : slope === 0 ? 0 : Number.POSITIVE_INFINITY;
    const slopeP = df > 0 ? 2 * (1 - tCdf(Math.abs(tSlope), df)) : Number.NaN;
    return {
      n,
      df,
      slope,
      intercept,
      r2,
      sigma,
      seSlope,
      slopeP,
      xbar,
      ybar,
      sxx,
      predict: (x) => intercept + slope * x,
      /** Standard error of one NEW observation at x (what a forecast needs). */
      sePredict: (x) =>
        df > 0 ? sigma * Math.sqrt(1 + 1 / n + (x - xbar) ** 2 / sxx) : Number.NaN,
      /** Standard error of the line itself at x. */
      seLine: (x) => (df > 0 ? sigma * Math.sqrt(1 / n + (x - xbar) ** 2 / sxx) : Number.NaN),
    };
  }
  function pearson(xs, ys) {
    const n = xs.length;
    if (n < 3) return null;
    const reg = linReg(xs, ys);
    if (!reg) return null;
    const syy = sum(ys.map((y) => (y - reg.ybar) ** 2));
    if (syy === 0) return null;
    const r = Math.sign(reg.slope) * Math.sqrt(clamp(reg.r2, 0, 1));
    const fz = Math.atanh(clamp(r, -0.999999, 0.999999));
    const se = 1 / Math.sqrt(Math.max(1, n - 3));
    return {
      n,
      r,
      r2: r * r,
      reg,
      lo95: Math.tanh(fz - 1.96 * se),
      hi95: Math.tanh(fz + 1.96 * se),
      p: reg.slopeP,
    };
  }

  /* ── Group comparison ────────────────────────────────────────────────── */
  function welch(a, b, level = 0.95) {
    if (a.length < 2 || b.length < 2) return null;
    const va = variance(a);
    const vb = variance(b);
    const se = Math.sqrt(va / a.length + vb / b.length);
    const diff = mean(a) - mean(b);
    if (se === 0) return { diff, t: 0, df: a.length + b.length - 2, p: 1, lo: diff, hi: diff };
    const df =
      se ** 4 / ((va / a.length) ** 2 / (a.length - 1) + (vb / b.length) ** 2 / (b.length - 1));
    const t = diff / se;
    const crit = tCrit(level, df);
    return {
      diff,
      t,
      df,
      p: 2 * (1 - tCdf(Math.abs(t), df)),
      lo: diff - crit * se,
      hi: diff + crit * se,
    };
  }
  function pairedT(a, b, level = 0.95) {
    if (a.length !== b.length || a.length < 3) return null;
    const d = a.map((v, i) => v - b[i]);
    const n = d.length;
    const md = mean(d);
    const sdd = sd(d);
    const se = sdd / Math.sqrt(n);
    if (se === 0) return { diff: md, t: 0, df: n - 1, p: 1, lo: md, hi: md, n };
    const t = md / se;
    const crit = tCrit(level, n - 1);
    return {
      diff: md,
      t,
      df: n - 1,
      p: 2 * (1 - tCdf(Math.abs(t), n - 1)),
      lo: md - crit * se,
      hi: md + crit * se,
      n,
    };
  }
  /** Hedges' g (small-sample corrected Cohen's d) with an approximate 95% CI. */
  function hedgesG(a, b) {
    const n1 = a.length;
    const n2 = b.length;
    if (n1 < 2 || n2 < 2) return null;
    const sp = Math.sqrt(((n1 - 1) * variance(a) + (n2 - 1) * variance(b)) / (n1 + n2 - 2));
    if (!sp) return { g: 0, lo: 0, hi: 0 };
    const j = 1 - 3 / (4 * (n1 + n2) - 9);
    const g = ((mean(a) - mean(b)) / sp) * j;
    const se = Math.sqrt((n1 + n2) / (n1 * n2) + (g * g) / (2 * (n1 + n2)));
    return { g, lo: g - 1.96 * se, hi: g + 1.96 * se };
  }
  /** Wilson score interval for a proportion k / n. */
  function wilson(k, n, level = 0.95) {
    if (!n) return { p: 0, lo: 0, hi: 0 };
    const z = normPpf(1 - (1 - level) / 2);
    const p = k / n;
    const den = 1 + (z * z) / n;
    const centre = (p + (z * z) / (2 * n)) / den;
    const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / den;
    return { p, lo: Math.max(0, centre - half), hi: Math.min(1, centre + half) };
  }
  /** Mean with a t-based confidence interval. */
  function meanCI(a, level = 0.95) {
    const n = a.length;
    if (!n) return { n, mean: Number.NaN, lo: Number.NaN, hi: Number.NaN, sd: Number.NaN };
    const m = mean(a);
    if (n < 2) return { n, mean: m, lo: m, hi: m, sd: Number.NaN };
    const s = sd(a);
    const half = tCrit(level, n - 1) * (s / Math.sqrt(n));
    return { n, mean: m, lo: m - half, hi: m + half, sd: s };
  }

  /* ── Distribution helpers ────────────────────────────────────────────── */
  function histogram(values, width, min = 0, max = 100) {
    const w = Math.max(1, width);
    const bins = [];
    for (let lo = min; lo < max; lo += w) bins.push({ lo, hi: Math.min(max, lo + w), count: 0 });
    values.forEach((v) => {
      const i = clamp(Math.floor((v - min) / w), 0, bins.length - 1);
      bins[i].count += 1;
    });
    return bins;
  }
  function boxStats(values) {
    if (!values.length) return null;
    const q1 = quantile(values, 0.25);
    const q3 = quantile(values, 0.75);
    const iqr = q3 - q1;
    const fenceLo = q1 - 1.5 * iqr;
    const fenceHi = q3 + 1.5 * iqr;
    const inside = values.filter((v) => v >= fenceLo && v <= fenceHi);
    return {
      n: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      q1,
      median: median(values),
      q3,
      mean: mean(values),
      sd: sd(values),
      whiskerLo: Math.min(...inside),
      whiskerHi: Math.max(...inside),
      outliers: values.filter((v) => v < fenceLo || v > fenceHi),
    };
  }

  /* ── Random numbers (seeded so a scenario can be repeated exactly) ───── */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function randNormal(rng) {
    let u = 0;
    while (u === 0) u = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  }
  /** One draw from a Student t distribution (df capped: beyond 30 it is normal). */
  function randT(rng, df) {
    const d = Math.max(1, Math.min(30, Math.round(df)));
    let chi = 0;
    for (let i = 0; i < d; i += 1) chi += randNormal(rng) ** 2;
    return randNormal(rng) / Math.sqrt(chi / d);
  }

  return {
    sum,
    mean,
    variance,
    sd,
    median,
    quantile,
    madSd,
    clamp,
    erfc,
    normCdf,
    normPpf,
    lnGamma,
    betaInc,
    tCdf,
    tPpf,
    tCrit,
    linReg,
    pearson,
    welch,
    pairedT,
    hedgesG,
    wilson,
    meanCI,
    histogram,
    boxStats,
    mulberry32,
    randNormal,
    randT,
  };
});
