// Round generators for grades 4 through 6. @fm2 FM-051 FM-060 FM-061
import { int, pick } from "../../rng.js";
import { gcd, lcm } from "./measure.js";
import { prompt } from "./copy.js";

const geometry = { mark: "squares", show: { perim: true, eq: "none" } };
const dim = (whole, mode = "none", extra = {}) => ({ mode, whole: String(whole), ...extra });
const model = (rows, cols, ask, text, extra = {}) => ({ kind: "model", task: { mode: "num", rows, cols, ...extra }, prompt: text, ask });
const coprime = (a, b) => gcd(a, b) === 1;

export const MID = {
  "g4-area-perim": (level, rng) => {
    const grid = { rows: 12, cols: 12 };
    if (level === 1) {
      const side = int(rng, 2, 9);
      const other = int(rng, 3, 12);
      const area = side * other;
      return { kind: "rect", task: { area, side }, grid, ...geometry, prompt: prompt("areaSide", { area, side }) };
    }
    if (level === 2) {
      const a = int(rng, 3, 9);
      const b = int(rng, a, 12);
      return { kind: "rect", task: { area: a * b, perim: 2 * (a + b) }, grid, ...geometry, prompt: prompt("areaPerim", { area: a * b, perim: 2 * (a + b) }) };
    }
    const perim = 2 * int(rng, 8, 20);
    return { kind: "rect", task: { perim, maxArea: true }, grid: { rows: perim / 2 - 1, cols: perim / 2 - 1 }, ...geometry, prompt: prompt("maxArea", { perim }) };
  },

  "g4-factor-pairs": (level, rng) => {
    const pool =
      level === 1
        ? [12, 14, 15, 16, 18, 20, 21, 24]
        : level === 2
          ? [25, 27, 28, 30, 32, 34, 35, 38, 39, 40, 44, 45, 23, 29, 31, 37, 41, 43]
          : [36, 40, 42, 45, 48, 50, 54, 56, 60, 63, 64, 66, 72];
    const area = pick(rng, pool);
    const side = area <= 12 ? 12 : area;
    return { kind: "collect", mark: "squares", show: { perim: false, eq: "none" }, task: { mode: "factors", area }, grid: { rows: side, cols: side }, prompt: prompt("factors", { area }) };
  },

  "g4-area-model": (level, rng) => {
    const a = level === 1 ? int(rng, 2, 5) : level === 2 ? int(rng, 2, 9) : int(rng, 3, 9);
    const tens = level === 1 ? int(rng, 1, 3) : level === 2 ? int(rng, 2, 6) : int(rng, 4, 9);
    let ones = level === 3 ? int(rng, Math.ceil(10 / a), 9) : int(rng, 2, 9);
    ones = Math.max(ones, 2);
    const b = tens * 10 + ones;
    if (level === 1) {
      return model(dim(a), dim(b, "given", { parts: [String(tens * 10), String(ones)] }), "total", prompt("modelGiven", { a, b, p: tens * 10, q: ones }));
    }
    return model(dim(a), dim(b, "place", { unit: "10" }), "total", prompt("modelPlace", { a, b }));
  },

  "g5-area-model": (level, rng) => {
    if (level < 3) {
      const a = level === 1 ? int(rng, 2, 9) : int(rng, 3, 9);
      const whole = int(rng, level === 1 ? 1 : 2, 9);
      const tenth = int(rng, level === 1 ? 1 : 2, 9);
      const b = `${whole}.${tenth}`;
      if (level === 1) return model(dim(a), dim(b, "given", { parts: [String(whole), `0.${tenth}`] }), "total", prompt("modelDecimalGiven", { a, b, p: whole, q: `0.${tenth}` }));
      return model(dim(a), dim(b, "place", { unit: "1" }), "total", prompt("modelDecimal", { a, b }));
    }
    const a = int(rng, 1, 4) * 10 + int(rng, 2, 9);
    const b = int(rng, 1, 5) * 10 + int(rng, 3, 9);
    return model(dim(a, "place", { unit: "10" }), dim(b, "place", { unit: "10" }), "total", prompt("modelTwoDigit", { a, b }));
  },

  "g5-volume": (level, rng) => {
    const grid = { rows: 6, cols: 6 };
    const base = { mark: "squares", show: { perim: false, eq: "none" } };
    if (level === 1) {
      const rows = int(rng, 2, 4);
      const cols = int(rng, 2, 4);
      const layers = int(rng, 2, 4);
      return { kind: "prism", ...base, task: { rows, cols, layers }, grid, ask: { kind: "volume" }, prompt: prompt("prismBuild", { rows, cols, layers }) };
    }
    if (level === 2) {
      const layers = int(rng, 2, 6);
      const volume = int(rng, 2, 5) * int(rng, 2, 5) * layers;
      return { kind: "prism", ...base, task: { volume, layers }, grid, prompt: prompt("prismLayers", { volume, layers }) };
    }
    const volume = pick(rng, [24, 30, 36, 40, 48, 60, 72, 90]);
    return { kind: "prism", ...base, task: { volume, minLayers: 2, minSide: 2 }, grid, prompt: prompt("prismAny", { volume }) };
  },

  "g6-composite": (level, rng) => {
    const shapeKind = level < 3 ? "L" : pick(rng, ["U", "stairs"]);
    let H = level === 1 ? int(rng, 3, 5) : level === 2 ? int(rng, 4, 7) : int(rng, 5, 8);
    let W = level === 1 ? int(rng, 4, 7) : level === 2 ? int(rng, 5, 9) : int(rng, 6, 9);
    const shape = [];
    if (shapeKind === "L") {
      const h = int(rng, 1, H - 1);
      const w = int(rng, 1, W - 2);
      const top = pick(rng, [true, false]);
      const left = pick(rng, [true, false]);
      for (let r = 0; r < H; r += 1) for (let c = 0; c < W; c += 1) if (!((top ? r < h : r >= H - h) && (left ? c < w : c >= W - w))) shape.push([r, c]);
    } else if (shapeKind === "U") {
      const h = int(rng, 1, H - 2);
      const w = int(rng, 1, W - 3);
      const at = int(rng, 1, W - w - 1);
      for (let r = 0; r < H; r += 1) for (let c = 0; c < W; c += 1) if (!(r < h && c >= at && c < at + w)) shape.push([r, c]);
    } else {
      const sw = Math.max(1, Math.floor(W / 3));
      const sh = Math.max(1, Math.floor(H / 3));
      W = sw * 3;
      H = sh * 3;
      for (let r = 0; r < H; r += 1) for (let c = 0; c < W; c += 1) if (c < (Math.floor(r / sh) + 1) * sw) shape.push([r, c]);
    }
    const parts = shapeKind === "L" ? 2 : 3;
    return { kind: "paint", mark: "squares", show: { perim: false, eq: "none" }, task: { rule: "decompose", shape, parts }, grid: { rows: H, cols: W }, ask: { kind: "area" }, prompt: prompt("decompose", { parts }) };
  },

  "g6-distribute": (level, rng) => {
    if (level === 1) {
      const a = int(rng, 3, 9);
      const o = int(rng, 2, 9);
      return model(dim(a), dim(10 + o, "given", { parts: ["10", String(o)] }), "total", prompt("distGiven", { a, p: 10, q: o }));
    }
    if (level === 2) {
      const a = int(rng, 4, 12);
      const b = int(rng, 2, 7) * 10 + int(rng, 2, 9);
      return model(dim(a), dim(b, "place", { unit: "10" }), "total", prompt("distPlace", { a, b }));
    }
    const a = int(rng, 6, 15);
    const b = int(rng, 31, 99);
    return model(dim(a), dim(b, "free"), "total", prompt("distFree", { a, b }));
  },

  "g6-gcf": (level, rng) => {
    const limit = level === 1 ? 24 : level === 2 ? 48 : 60;
    for (let tries = 0; tries < 200; tries += 1) {
      const g = int(rng, level === 3 ? 1 : 2, level === 1 ? 6 : 12);
      const p = int(rng, 2, 7);
      const q = int(rng, 2, 9);
      const a = g * p;
      const b = g * q;
      if (p === q || !coprime(p, q) || a > limit || b > limit) continue;
      const [lo, hi] = a < b ? [a, b] : [b, a];
      return { kind: "tiling", task: { mode: "gcf", a: hi, b: lo }, prompt: prompt("gcf", { a: hi, b: lo }) };
    }
    return { kind: "tiling", task: { mode: "gcf", a: 18, b: 12 }, prompt: prompt("gcf", { a: 18, b: 12 }) };
  },

  "g6-lcm": (level, rng) => {
    const cap = level === 1 ? 30 : level === 2 ? 72 : 120;
    const hi = level === 1 ? 6 : level === 2 ? 9 : 12;
    for (let tries = 0; tries < 200; tries += 1) {
      const a = int(rng, 2, hi);
      const b = int(rng, 2, hi);
      if (a === b || lcm(a, b) > cap || lcm(a, b) === Math.max(a, b)) continue;
      const [lo, big] = a < b ? [a, b] : [b, a];
      return { kind: "tiling", task: { mode: "lcm", a: lo, b: big }, prompt: prompt("lcm", { a: lo, b: big }) };
    }
    return { kind: "tiling", task: { mode: "lcm", a: 4, b: 6 }, prompt: prompt("lcm", { a: 4, b: 6 }) };
  },
};
