// Exact statistics for the stats display: data are rationals, every summary is computed with exact arithmetic.
// Quartiles use the median of the lower and upper halves (the middle value is left out when n is odd).
import { ZERO, abs, add, clamp, div, eq, floorInt, mul, parse, rat, sane, sortRats, sub, sum } from "./b-rational.js";

export const KINDS = ["dot", "histogram", "box", "bar"];
export const STAT_NAMES = ["mean", "median", "mode", "range", "iqr"];
export const MAX_VALUES = 40;
export const MAX_COLUMNS = 21;
const DEFAULT_VALUES = [2, 3, 3, 4, 4, 4, 5, 6, 8];
const DEFAULT_CATS = [
  { label: "Cats", count: 4 },
  { label: "Dogs", count: 7 },
  { label: "Fish", count: 3 },
  { label: "Birds", count: 5 },
];

export const medianOf = (sorted) => {
  const n = sorted.length;
  if (!n) return null;
  const mid = Math.floor(n / 2);
  return n % 2 ? sorted[mid] : div(add(sorted[mid - 1], sorted[mid]), rat(2));
};

export function summary(values) {
  const sorted = sortRats(values);
  const n = sorted.length;
  if (!n) return { n: 0 };
  const total = sum(sorted);
  const mean = div(total, rat(n));
  const freq = new Map();
  for (const v of sorted) freq.set(`${v.n}/${v.d}`, { v, count: (freq.get(`${v.n}/${v.d}`)?.count ?? 0) + 1 });
  const top = Math.max(...[...freq.values()].map((f) => f.count));
  const allSame = [...freq.values()].every((f) => f.count === top);
  const modes = allSame ? [] : [...freq.values()].filter((f) => f.count === top).map((f) => f.v);
  const half = Math.floor(n / 2);
  const lower = sorted.slice(0, half);
  const upper = sorted.slice(n % 2 ? half + 1 : half);
  const q1 = lower.length ? medianOf(lower) : null;
  const q3 = upper.length ? medianOf(upper) : null;
  return {
    n,
    sorted,
    sum: total,
    mean,
    median: medianOf(sorted),
    modes,
    modeCount: top,
    min: sorted[0],
    max: sorted[n - 1],
    range: sub(sorted[n - 1], sorted[0]),
    q1,
    q3,
    lower,
    upper,
    iqr: q1 && q3 ? sub(q3, q1) : null,
    mad: div(sum(sorted.map((v) => abs(sub(v, mean)))), rat(n)),
  };
}

export function sanitize(input = {}, config = {}) {
  const src = { ...config, ...input };
  const kind = KINDS.includes(src.kind) ? src.kind : "dot";
  const min = sane(src.min, ZERO, rat(-1000), rat(1000));
  let step = sane(src.step, rat(1), rat(1, 100), rat(100));
  let max = sane(src.max, rat(10), add(min, step), add(min, rat(2000)));
  while (kind !== "histogram" && floorInt(div(sub(max, min), step)) + 1 > MAX_COLUMNS) step = mul(step, rat(2));
  const bwRaw = sane(src.bw, mul(step, rat(2)), step, sub(max, min));
  const bw = mul(step, rat(Math.max(1, Math.round(bwRaw.n * step.d / (bwRaw.d * step.n)))));
  const nb = Math.min(12, Math.max(1, Math.ceil(sub(max, min).n / sub(max, min).d / (bw.n / bw.d) - 1e-12)));
  if (kind === "histogram") max = add(min, mul(bw, rat(nb)));
  const top = kind === "histogram" ? sub(max, step) : max;
  const raw = Array.isArray(input.values) ? input.values : (config.values ?? DEFAULT_VALUES);
  const values = sortRats(
    raw
      .slice(0, MAX_VALUES)
      .map((v) => {
        const p = parse(v, min);
        if (kind === "histogram") return clamp(p, min, top);
        const k = Math.round((p.n * step.d) / (p.d * step.n) - (min.n * step.d) / (min.d * step.n));
        return clamp(add(min, mul(step, rat(k))), min, top);
      }),
  );
  const catsRaw = Array.isArray(input.cats) ? input.cats : (config.cats ?? DEFAULT_CATS);
  const cats = catsRaw.slice(0, 8).map((c) => ({ label: String(c.label ?? "").slice(0, 24), count: Math.min(30, Math.max(0, Math.round(Number(c.count) || 0))) }));
  const stats = (Array.isArray(input.stats) ? input.stats : (config.stats ?? ["mean", "median"])).filter((n) => STAT_NAMES.includes(n));
  const st = { kind, min, max, step, bw, values, cats, stats: [...new Set(stats)], selected: 0 };
  st.selected = Math.min(Math.max(Math.round(Number(input.selected)) || 0, 0), Math.max(0, columnCount(st) - 1));
  return st;
}

// ---- columns -------------------------------------------------------------------------------------------------
export const colWidth = (state) => (state.kind === "histogram" ? state.bw : state.step);
export function columnCount(state) {
  if (state.kind === "bar") return state.cats.length;
  const w = colWidth(state);
  return state.kind === "histogram" ? Math.round(sub(state.max, state.min).n / sub(state.max, state.min).d / (w.n / w.d)) : floorInt(div(sub(state.max, state.min), w)) + 1;
}
export const columnValue = (state, c) => add(state.min, mul(colWidth(state), rat(c)));
export const columnOf = (state, v) => floorInt(div(sub(v, state.min), colWidth(state)));
export function counts(state) {
  if (state.kind === "bar") return state.cats.map((c) => c.count);
  const out = Array.from({ length: columnCount(state) }, () => 0);
  for (const v of state.values) out[columnOf(state, v)] += 1;
  return out;
}

export function setCount(state, c, n) {
  const want = Math.max(0, Math.min(30, n));
  if (state.kind === "bar") return { ...state, selected: c, cats: state.cats.map((cat, i) => (i === c ? { ...cat, count: want } : cat)) };
  let values = state.values.slice();
  const inCol = values.filter((v) => columnOf(state, v) === c);
  if (want > inCol.length) {
    const room = MAX_VALUES - values.length;
    values = sortRats([...values, ...Array.from({ length: Math.min(room, want - inCol.length) }, () => columnValue(state, c))]);
  } else if (want < inCol.length) {
    for (let k = 0; k < inCol.length - want; k += 1) {
      const idx = values.map((v, i) => [v, i]).filter(([v]) => columnOf(state, v) === c).pop()[1];
      values.splice(idx, 1);
    }
  }
  return { ...state, values, selected: c };
}
export const addAt = (state, c) => setCount(state, c, counts(state)[c] + 1);
export const removeAt = (state, c) => setCount(state, c, counts(state)[c] - 1);
export function moveBetween(state, from, to) {
  if (from === to || to < 0 || to >= columnCount(state) || counts(state)[from] === 0) return state;
  const removed = removeAt(state, from);
  const added = addAt(removed, to);
  return { ...added, selected: to };
}

// ---- check ---------------------------------------------------------------------------------------------------
const sameList = (a, b) => a.length === b.length && a.every((v, i) => eq(v, b[i]));
export function isCorrect(state, target) {
  if (!target) return false;
  if (state.kind === "bar" && target.counts) return sameList(state.cats.map((c) => rat(c.count)), target.counts.map((c) => rat(c)));
  const s = summary(state.values);
  const keys = ["values", "mean", "median", "mode", "range", "iqr", "n"].filter((k) => target[k] !== undefined);
  if (!keys.length || s.n === 0) return false;
  return keys.every((key) => {
    if (key === "values") return sameList(sortRats(target.values.map((v) => parse(v))), s.sorted);
    if (key === "n") return s.n === Number(target.n);
    if (key === "mode") return sameList(sortRats((Array.isArray(target.mode) ? target.mode : [target.mode]).map((v) => parse(v))), s.modes);
    return s[key] !== null && eq(s[key], parse(target[key]));
  });
}
