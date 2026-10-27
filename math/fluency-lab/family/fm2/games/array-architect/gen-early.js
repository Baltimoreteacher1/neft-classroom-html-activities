// Round generators for kindergarten through grade 3. Each returns the kind-specific part of a round; makeRound adds
// the shared fields. Rounds hold only numbers and shapes (JSON), never learner state. @fm2 FM-051 FM-060 FM-061
import { int, pick } from "../../rng.js";
import { prompt } from "./copy.js";

const rect = (task, grid, extra, text) => ({ kind: "rect", task, grid, ...extra, prompt: text });
const counters = { mark: "counters", show: { perim: false, eq: "add" } };
const squares = { mark: "squares", show: { perim: false, eq: "none" } };
const geometry = { mark: "squares", show: { perim: true, eq: "none" } };
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const composites = (cap) => range(8, cap).filter((n) => range(2, n - 1).some((d) => n % d === 0 && n / d >= 2));

export const EARLY = {
  "k-rows": (level, rng, grade) => {
    const cap = (grade === 0 ? [10, 15, 20] : [12, 18, 20])[level - 1];
    if (level === 1) {
      const rows = int(rng, 2, 5);
      const cols = int(rng, 2, Math.min(5, Math.floor(cap / rows)));
      return rect({ rows, cols }, { rows: 5, cols: 6 }, counters, prompt("rowsColsCounters", { rows, cols }));
    }
    if (level === 2) {
      const rows = int(rng, 2, 5);
      const cols = int(rng, 2, Math.min(5, Math.floor(cap / rows)));
      const grid = { rows: 5, cols: 8 };
      if (rng() < 0.5) return rect({ area: rows * cols, cols }, grid, counters, prompt("equalRowsOf", { area: rows * cols, cols }));
      return rect({ area: rows * cols, rows }, grid, counters, prompt("totalRows", { area: rows * cols, rows }));
    }
    const area = pick(rng, composites(cap));
    return rect({ area, minSide: 2 }, { rows: 5, cols: 10 }, counters, prompt("equalRowsMin", { area }));
  },

  "k-count": (level, rng) => {
    if (level === 3) {
      const perRow = pick(rng, [2, 3, 4, 5]);
      const total = perRow * int(rng, 2, Math.floor(20 / perRow));
      return { kind: "paint", mark: "counters", task: { rule: "count", total, perRow }, grid: { rows: 5, cols: 10 }, prompt: prompt("paintPerRow", { total, perRow }) };
    }
    const total = level === 1 ? int(rng, 3, 10) : int(rng, 11, 20);
    const grid = level === 1 ? { rows: 2, cols: 5 } : { rows: 4, cols: 5 };
    return { kind: "paint", mark: "counters", task: { rule: "count", total }, grid, prompt: prompt("paintCount", { total }) };
  },

  "g1-equal-rows": (level, rng) => {
    const grid = { rows: 5, cols: 10 };
    if (level === 1) {
      const rows = int(rng, 2, 4);
      const cols = int(rng, 2, Math.min(5, Math.floor(12 / rows)));
      return rect({ rows, cols }, grid, counters, prompt("rowsColsCounters", { rows, cols }));
    }
    const rows = int(rng, 2, 5);
    const cols = int(rng, 2, Math.min(10, Math.floor(20 / rows)));
    if (level === 2) return rect({ area: rows * cols, rows }, grid, counters, prompt("totalRows", { area: rows * cols, rows }));
    return rect({ area: rows * cols, cols }, grid, counters, prompt("equalRowsOf", { area: rows * cols, cols }));
  },

  "g1-repeat-add": (level, rng, grade) => {
    const grid = { rows: 5, cols: 10 };
    const maxCols = grade >= 2 ? 5 : 10;
    const rows = level === 1 ? int(rng, 2, 4) : int(rng, 3, 5);
    const cols = int(rng, 2, Math.min(level === 1 ? 5 : maxCols, Math.floor((grade >= 2 ? 25 : 20) / rows)));
    if (level < 3) {
      const eq = Array(rows).fill(cols).join(" + ");
      return rect({ rows, cols }, grid, counters, prompt("repeatAdd", { eq }));
    }
    const seq = Array.from({ length: rows }, (_, i) => cols * (i + 1)).join(", ");
    return rect({ rows, cols }, grid, counters, prompt("skipCount", { step: cols, seq }));
  },

  "g2-array-eq": (level, rng) => {
    const hi = level === 1 ? 3 : 5;
    const rows = int(rng, 2, hi);
    const cols = int(rng, 2, hi);
    const grid = { rows: 5, cols: 5 };
    if (level < 3) return rect({ rows, cols }, grid, { ...counters, ask: { kind: "total" } }, prompt("arrayAsk", { rows, cols }));
    return rect({ area: rows * cols, rows }, grid, { ...counters, ask: { kind: "cols" } }, prompt("arrayAskCols", { rows, area: rows * cols }));
  },

  "g2-even-odd": (level, rng) => {
    const total = level === 1 ? int(rng, 3, 10) : level === 2 ? int(rng, 7, 16) : int(rng, 11, 20);
    const axis = pick(rng, ["rows", "cols"]);
    const grid = axis === "rows" ? { rows: 2, cols: 10 } : { rows: 10, cols: 2 };
    return { kind: "paint", mark: "counters", task: { rule: "pairs", total, axis }, grid, ask: { kind: "parity" }, prompt: prompt(axis === "rows" ? "pairs" : "pairsSide", { total }) };
  },

  "g3-mult-array": (level, rng) => {
    const grid = { rows: 10, cols: 10 };
    if (level === 1) {
      const rows = int(rng, 2, 5);
      const cols = int(rng, 2, 5);
      return rect({ rows, cols }, grid, { ...squares, ask: { kind: "total" } }, prompt("multArray", { rows, cols }));
    }
    if (level === 2) {
      const rows = int(rng, 2, 9);
      const cols = rows < 6 ? int(rng, 6, 9) : int(rng, 2, 9);
      return rect({ rows, cols }, grid, { ...squares, ask: { kind: "total" } }, prompt("multArray", { rows, cols }));
    }
    const rows = int(rng, 3, 9);
    const cols = int(rng, 3, 9);
    return rect({ area: rows * cols, rows }, grid, { ...squares, ask: { kind: "cols" } }, prompt("multDiv", { rows, area: rows * cols }));
  },

  "g3-commute": (level, rng) => {
    const grid = { rows: 12, cols: 12 };
    if (level === 3) {
      const area = pick(rng, [12, 16, 18, 20, 24]);
      return { kind: "collect", mark: "squares", show: { perim: false, eq: "none" }, task: { mode: "turns", area, minSide: 2 }, grid, prompt: prompt("commuteAll", { area }) };
    }
    const hi = level === 1 ? 5 : 9;
    const a = int(rng, 2, hi);
    let b = int(rng, 2, hi);
    if (b === a) b = a === hi ? a - 1 : a + 1;
    return { kind: "collect", mark: "squares", show: { perim: false, eq: "none" }, task: { mode: "commute", a, b }, grid, prompt: prompt("commute", { a, b }) };
  },

  "g3-area-tile": (level, rng) => {
    const H = level === 1 ? int(rng, 2, 4) : level === 2 ? int(rng, 3, 5) : int(rng, 3, 5);
    const W = level === 1 ? int(rng, 2, 5) : level === 2 ? int(rng, 4, 6) : int(rng, 4, 7);
    let shape = [];
    for (let r = 0; r < H; r += 1) for (let c = 0; c < W; c += 1) shape.push([r, c]);
    if (level === 3) {
      const h = int(rng, 1, H - 1);
      const w = int(rng, 1, W - 2);
      const top = pick(rng, [true, false]);
      const left = pick(rng, [true, false]);
      shape = shape.filter(([r, c]) => !((top ? r < h : r >= H - h) && (left ? c < w : c >= W - w)));
    }
    return { kind: "paint", mark: "squares", show: { perim: false, eq: "none" }, task: { rule: "target", shape }, grid: { rows: H, cols: W }, ask: { kind: "area" }, prompt: prompt("tileShape", {}) };
  },

  "g3-perimeter": (level, rng) => {
    const grid = { rows: 8, cols: 8 };
    if (level === 1) {
      const perim = 2 * int(rng, 4, 8);
      return rect({ perim }, grid, geometry, prompt("perim", { perim }));
    }
    if (level === 2) {
      const half = int(rng, 6, 12);
      const side = int(rng, 1, Math.min(7, half - 1));
      return rect({ perim: 2 * half, side }, { rows: 12, cols: 12 }, geometry, prompt("perimSide", { perim: 2 * half, side }));
    }
    const a = int(rng, 2, 6);
    const b = int(rng, a, 8);
    return rect({ area: a * b, perim: 2 * (a + b) }, { rows: 10, cols: 10 }, geometry, prompt("areaPerim", { area: a * b, perim: 2 * (a + b) }));
  },
};
