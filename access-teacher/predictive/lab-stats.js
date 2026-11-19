// Statistics for the Deeper tools (pure; no DOM, no storage). Everything is seeded, so a result a teacher prints today
// is the result they get tomorrow. Small classes are the norm here, so the methods are the ones that stay honest at
// n = 8 to 40: ranks instead of raw values, medians instead of means, resampling instead of bell-curve formulas, and
// intervals measured on the class's own data rather than assumed.
import { mean, ols, rng } from "../../access-practice-lab/src/predict/stats.js";

export const round = (n, places = 2) => (Number.isFinite(n) ? Number(n.toFixed(places)) : null);
const finite = (a) => a.filter(Number.isFinite);

export function median(values) {
  const a = finite(values).sort((x, y) => x - y);
  if (!a.length) return null;
  const mid = a.length >> 1;
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

/** Quantile with linear interpolation. */
export function quantile(values, p) {
  const a = finite(values).sort((x, y) => x - y);
  if (!a.length) return null;
  const i = (a.length - 1) * p;
  const lo = Math.floor(i);
  return a[lo] + (a[Math.ceil(i)] - a[lo]) * (i - lo);
}

/**
 * Robust z-scores: how far each value is from the middle, in units of typical spread. The spread is the median
 * absolute deviation (x 1.4826, which makes it match a standard deviation for bell-shaped data); when more than half
 * the values tie it falls back to the interquartile range, and to 0 (everyone "typical") when there is no spread.
 */
export function robustZ(values) {
  const center = median(values);
  if (center == null) return { center: null, scale: 0, z: [] };
  let scale = 1.4826 * median(values.map((v) => Math.abs(v - center)));
  if (!scale) scale = (quantile(values, 0.75) - quantile(values, 0.25)) / 1.349;
  return { center, scale: scale || 0, z: values.map((v) => (scale ? (v - center) / scale : 0)) };
}

/** Average ranks (ties share the mean of the ranks they occupy). */
export function ranks(values) {
  const order = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const out = new Array(values.length);
  for (let i = 0; i < order.length;) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    for (let k = i; k <= j; k++) out[order[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return out;
}

function pearson(x, y) {
  const mx = mean(x);
  const my = mean(y);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

/** Spearman rank correlation: do two skills rise together, whatever the exact numbers? null when it cannot be told. */
export function spearman(x, y) {
  if (x.length < 4 || x.length !== y.length) return null;
  return pearson(ranks(x), ranks(y));
}

/** Percentile bootstrap interval for Spearman: resample students, recompute, take the middle 95%. */
export function spearmanInterval(x, y, { B = 1000, seed = 7, alpha = 0.05 } = {}) {
  const { uniform } = rng(seed);
  const n = x.length;
  const draws = [];
  for (let b = 0; b < B; b++) {
    const idx = Array.from({ length: n }, () => Math.floor(uniform() * n));
    const r = spearman(
      idx.map((i) => x[i]),
      idx.map((i) => y[i]),
    );
    if (r != null) draws.push(r);
  }
  if (draws.length < B / 2) return null;
  return { lo: quantile(draws, alpha / 2), hi: quantile(draws, 1 - alpha / 2) };
}

const dist2 = (a, b) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

/** k-means with k-means++ starts from a seeded generator; the best of several starts. */
export function kmeans(points, k, { seed = 11, starts = 8, iters = 60 } = {}) {
  const { uniform } = rng(seed);
  let best = null;
  for (let s = 0; s < starts; s++) {
    const centers = [points[Math.floor(uniform() * points.length)]];
    while (centers.length < k) {
      const d = points.map((p) => Math.min(...centers.map((c) => dist2(p, c))));
      const total = d.reduce((a, b) => a + b, 0);
      if (!total) break;
      let pick = uniform() * total;
      let i = 0;
      while (i < d.length - 1 && (pick -= d[i]) > 0) i++;
      centers.push(points[i]);
    }
    if (centers.length < k) continue;
    let assign = [];
    for (let it = 0; it < iters; it++) {
      const next = points.map((p) =>
        centers.map((c) => dist2(p, c)).reduce((m, v, i, a) => (v < a[m] ? i : m), 0),
      );
      if (it && next.every((v, i) => v === assign[i])) break;
      assign = next;
      for (let c = 0; c < k; c++) {
        const members = points.filter((_, i) => assign[i] === c);
        if (members.length) centers[c] = members[0].map((_, j) => mean(members.map((m) => m[j])));
      }
    }
    const inertia = points.reduce((sum, p, i) => sum + dist2(p, centers[assign[i]]), 0);
    if (!best || inertia < best.inertia)
      best = { assign, centers: centers.map((c) => [...c]), inertia };
  }
  return best;
}

/** Mean silhouette: 1 = tight, well separated groups; 0 = overlapping; below 0 = students sit in the wrong group. */
export function silhouette(points, assign) {
  const groups = [...new Set(assign)];
  if (groups.length < 2) return 0;
  const score = points.map((p, i) => {
    const own = points.filter((_, j) => j !== i && assign[j] === assign[i]);
    if (!own.length) return 0;
    const a = mean(own.map((q) => Math.sqrt(dist2(p, q))));
    const b = Math.min(
      ...groups
        .filter((g) => g !== assign[i])
        .map((g) =>
          mean(points.filter((_, j) => assign[j] === g).map((q) => Math.sqrt(dist2(p, q)))),
        ),
    );
    return Math.max(a, b) ? (b - a) / Math.max(a, b) : 0;
  });
  return mean(score);
}

/** Try k = kMin..kMax (never more than one group per three students) and keep the clearest split. */
export function bestGrouping(points, { kMin = 2, kMax = 4, seed = 11 } = {}) {
  let best = null;
  for (let k = kMin; k <= Math.min(kMax, Math.floor(points.length / 3)); k++) {
    const fit = kmeans(points, k, { seed });
    if (!fit || new Set(fit.assign).size < k) continue;
    const sil = silhouette(points, fit.assign);
    if (!best || sil > best.silhouette + 1e-9) best = { k, ...fit, silhouette: sil };
  }
  return best;
}

/** Cliff's delta: of all pairs (one from A, one from B), how much more often is A higher than B? -1 to +1. */
export function cliffsDelta(a, b) {
  let gt = 0;
  let lt = 0;
  for (const x of a)
    for (const y of b) {
      if (x > y) gt++;
      else if (x < y) lt++;
    }
  return a.length && b.length ? (gt - lt) / (a.length * b.length) : null;
}

/**
 * Permutation test for "did this group move more than the rest?": shuffle who is in the group many times and count
 * how often a difference at least this big appears by luck alone. Exact when the shuffles are few enough to list.
 */
export function permutationTest(group, rest, { B = 5000, seed = 5 } = {}) {
  const diff = (a, b) => mean(a) - mean(b);
  const observed = diff(group, rest);
  const pool = [...group, ...rest];
  const k = group.length;
  let extreme = 0;
  let total = 0;
  const choose = (n, r) => {
    let c = 1;
    for (let i = 1; i <= r; i++) c = (c * (n - r + i)) / i;
    return Math.round(c);
  };
  if (choose(pool.length, k) <= 20000) {
    const pick = (start, left, chosen) => {
      if (!left) {
        const inGroup = new Set(chosen);
        const g = chosen.map((i) => pool[i]);
        const r = pool.filter((_, i) => !inGroup.has(i));
        total++;
        if (Math.abs(diff(g, r)) >= Math.abs(observed) - 1e-12) extreme++;
        return;
      }
      for (let i = start; i <= pool.length - left; i++) pick(i + 1, left - 1, [...chosen, i]);
    };
    pick(0, k, []);
    return { diff: observed, p: extreme / total, exact: true, delta: cliffsDelta(group, rest) };
  }
  const { uniform } = rng(seed);
  for (let b = 0; b < B; b++) {
    const idx = pool.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(uniform() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    const g = idx.slice(0, k).map((i) => pool[i]);
    const r = idx.slice(k).map((i) => pool[i]);
    if (Math.abs(diff(g, r)) >= Math.abs(observed) - 1e-12) extreme++;
  }
  return {
    diff: observed,
    p: (extreme + 1) / (B + 1),
    exact: false,
    delta: cliffsDelta(group, rest),
  };
}

/**
 * A straight-line projection with an honest range. The range is measured on this class: every student is left out in
 * turn, predicted from the others, and the size of those misses sets the width (split-conformal style, finite-sample
 * corrected), so "about 8 in 10 land inside" is a fact about these students, not an assumption.
 */
export function projectionLine(xs, ys, { coverage = 0.8 } = {}) {
  const n = xs.length;
  if (n < 6 || new Set(xs).size < 3) return null;
  const fit = ols(xs, ys);
  const misses = xs.map((_, i) => {
    const f = ols(
      xs.filter((__, j) => j !== i),
      ys.filter((__, j) => j !== i),
    );
    return Math.abs(ys[i] - (f.intercept + f.slope * xs[i]));
  });
  const sorted = [...misses].sort((a, b) => a - b);
  const rank = Math.min(n, Math.ceil((n + 1) * coverage));
  const half = rank > n ? Infinity : sorted[rank - 1];
  // "Just carrying today's level forward" is the bar a model has to beat.
  const naive = mean(xs.map((x, i) => Math.abs(ys[i] - x)));
  return {
    n,
    intercept: fit.intercept,
    slope: fit.slope,
    half,
    typicalMiss: mean(misses),
    naiveMiss: naive,
    predict: (x) => fit.intercept + fit.slope * x,
  };
}
