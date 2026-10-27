// Round generators for grades 7 and 8: area models with numbers and variables, scaling, and algebra tiles.
// Polynomials are [constant, x, x^2] integer arrays. @fm2 FM-058 FM-051 FM-060 FM-061
import { int, pick, shuffle } from "../../rng.js";
import { prompt } from "./copy.js";
import { polyText } from "./poly.js";

const dim = (whole, mode = "none", extra = {}) => ({ mode, whole: String(whole), ...extra });
const nonzero = (rng, lo, hi) => (pick(rng, [true, false]) ? 1 : -1) * int(rng, lo, hi);

function polyModel(rows, cols, text) {
  return { kind: "model", task: { mode: "poly", rows: { mode: "given", parts: rows }, cols: { mode: "given", parts: cols } }, ask: "total", prompt: text };
}
const bracket = (parts) => parts.map((p) => polyText(p)).join(" + ").replaceAll("+ −", "− ");

export const LATE = {
  "g7-expand": (level, rng) => {
    if (level === 1) {
      const a = int(rng, 3, 12);
      const p = int(rng, 2, 9) * 10;
      const q = int(rng, 2, 9);
      return {
        kind: "model",
        task: { mode: "num", rows: dim(a), cols: dim(p + q, "given", { parts: [String(p), String(q)] }) },
        ask: "total",
        prompt: prompt("expand", { expr: `${a}(${p} + ${q})` }),
      };
    }
    const a = int(rng, 2, level === 2 ? 9 : 6);
    if (level === 2) {
      const b = int(rng, 1, 9);
      return polyModel([[a]], [[0, 1], [b]], prompt("expand", { expr: `${a}(x + ${b})` }));
    }
    const k = int(rng, 2, 5);
    const c = int(rng, 1, 9);
    return polyModel([[a]], [[0, k], [-c]], prompt("expand", { expr: `${a}(${k}x − ${c})` }));
  },

  "g7-scale": (level, rng) => {
    const choices = level === 1 ? [[2, 1]] : level === 2 ? [[2, 1], [3, 1]] : [[3, 1], [4, 1], [1, 2]];
    const [n, d] = pick(rng, choices);
    let rows;
    let cols;
    if (d === 2) {
      rows = 2 * int(rng, 1, 5);
      cols = 2 * int(rng, 1, 6);
    } else {
      const cap = Math.floor(12 / n);
      rows = int(rng, level === 1 ? 2 : 1, Math.min(level === 1 ? 4 : 5, cap));
      cols = int(rng, 2, Math.min(level === 1 ? 5 : 6, cap));
    }
    const k2 = d === 2 ? "1/4" : String(n * n);
    const wrong = d === 2 ? ["1/2", "1/8", "2"] : [String(n), String(n * n * n), String(n * (n + 1))].filter((v) => v !== k2);
    const options = shuffle(rng, [k2, ...wrong.slice(0, 3)]);
    const k = d === 1 ? String(n) : `${n}/${d}`;
    return { kind: "scale", mark: "squares", show: { perim: false, eq: "none" }, task: { rows, cols, k: [n, d] }, options, grid: { rows: 12, cols: 12 }, prompt: prompt("scale", { rows, cols, k }) };
  },

  "g8-expand": (level, rng) => {
    let w;
    let h;
    if (level === 1) {
      w = [[0, 1], [int(rng, 1, 6)]];
      h = [[0, 1], [int(rng, 1, 6)]];
    } else if (level === 2) {
      w = [[0, 1], [pick(rng, [1, -1]) * int(rng, 1, 9)]];
      h = [[0, 1], [int(rng, 1, 9)]];
    } else {
      w = [[0, int(rng, 2, 3)], [nonzero(rng, 1, 6)]];
      h = [[0, int(rng, 1, 2)], [nonzero(rng, 1, 6)]];
    }
    return polyModel(w, h, prompt("expand", { expr: `(${bracket(w)})(${bracket(h)})` }));
  },

  "g8-factor": (level, rng) => {
    const p = int(rng, 1, level === 1 ? 5 : 9);
    const q = int(rng, 1, level === 1 ? 5 : 9);
    const lead = level === 3 ? pick(rng, [2, 3]) : 1;
    const target = [p * q, lead * q + p, lead];
    return { kind: "tiles", task: { target }, prompt: prompt("tiles", { poly: polyText(target) }) };
  },
};
