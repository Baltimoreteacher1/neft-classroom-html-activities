// Exact solid measurements: surface area and volume as exact quantities (rational, pi, square roots), face / edge /
// vertex counts, the working with numbers substituted, and state sanitising. Dimensions are rationals.
import { ONE, eq, mul, parse, rat, sane, show } from "./b-rational.js";
import { q, qAdd, qApprox, qEq, qMul, qPi, qScale, qSqrt, qText } from "./solids-quantity.js";
import { isCubeNet } from "./solids-polyomino.js";

export const SOLIDS = [
  "cube",
  "prism",
  "triangular-prism",
  "square-pyramid",
  "triangular-pyramid",
  "cylinder",
  "cone",
  "sphere",
];
export const VIEWS = ["solid", "net", "builder"];
export const FOLD_STEPS = 8;
export const NET_ROWS = 5;
export const NET_COLS = 6;
export const MAX_DIM = 12;

export const DIM_KEYS = {
  cube: ["s"],
  prism: ["l", "w", "h"],
  "triangular-prism": ["a", "b", "length"],
  "square-pyramid": ["s", "h"],
  "triangular-pyramid": ["a", "b", "h"],
  cylinder: ["r", "h"],
  cone: ["r", "h"],
  sphere: ["r"],
};
const DEFAULTS = {
  cube: { s: 3 },
  prism: { l: 4, w: 3, h: 2 },
  "triangular-prism": { a: 3, b: 4, length: 5 },
  "square-pyramid": { s: 4, h: 3 },
  "triangular-pyramid": { a: 3, b: 4, h: 5 },
  cylinder: { r: 2, h: 5 },
  cone: { r: 3, h: 4 },
  sphere: { r: 3 },
};
// Polyhedra satisfy V - E + F = 2. Curved solids list their flat faces, curved faces, edges and vertices.
export const COUNTS = {
  cube: { f: 6, e: 12, v: 8 },
  prism: { f: 6, e: 12, v: 8 },
  "triangular-prism": { f: 5, e: 9, v: 6 },
  "square-pyramid": { f: 5, e: 8, v: 5 },
  "triangular-pyramid": { f: 4, e: 6, v: 4 },
  cylinder: { f: 3, e: 2, v: 0, curved: true },
  cone: { f: 2, e: 1, v: 1, curved: true },
  sphere: { f: 1, e: 0, v: 0, curved: true },
};
export const isPolyhedron = (solid) => !COUNTS[solid].curved;
export const hasNet = (solid) => solid !== "sphere";

const sq = (v) => mul(v, v);
const half = rat(1, 2);
const third = rat(1, 3);

export function surfaceArea(solid, d) {
  switch (solid) {
    case "cube":
      return q(mul(rat(6), sq(d.s)));
    case "prism":
      return q(mul(rat(2), add3(mul(d.l, d.w), mul(d.l, d.h), mul(d.w, d.h))));
    case "triangular-prism": {
      const hyp = qSqrt(add2(sq(d.a), sq(d.b)));
      return qAdd(q(mul(d.a, d.b)), q(mul(add2(d.a, d.b), d.length)), qScale(hyp, d.length));
    }
    case "square-pyramid": {
      const slant = qSqrt(add2(sq(mul(d.s, half)), sq(d.h)));
      return qAdd(q(sq(d.s)), qScale(slant, mul(rat(2), d.s)));
    }
    case "triangular-pyramid": {
      const slanted = qScale(
        qSqrt(add3(sq(mul(d.a, d.b)), sq(mul(d.a, d.h)), sq(mul(d.b, d.h)))),
        half,
      );
      return qAdd(q(mul(half, add3(mul(d.a, d.b), mul(d.a, d.h), mul(d.b, d.h)))), slanted);
    }
    case "cylinder":
      return qPi(mul(mul(rat(2), d.r), add2(d.r, d.h)));
    case "cone": {
      const slant = qSqrt(add2(sq(d.r), sq(d.h)));
      return qAdd(qPi(sq(d.r)), qMul(qPi(d.r), slant));
    }
    default:
      return qPi(mul(rat(4), sq(d.r)));
  }
}
export function volume(solid, d) {
  switch (solid) {
    case "cube":
      return q(mul(sq(d.s), d.s));
    case "prism":
      return q(mul(mul(d.l, d.w), d.h));
    case "triangular-prism":
      return q(mul(half, mul(mul(d.a, d.b), d.length)));
    case "square-pyramid":
      return q(mul(third, mul(sq(d.s), d.h)));
    case "triangular-pyramid":
      return q(mul(rat(1, 6), mul(mul(d.a, d.b), d.h)));
    case "cylinder":
      return qPi(mul(sq(d.r), d.h));
    case "cone":
      return qPi(mul(third, mul(sq(d.r), d.h)));
    default:
      return qPi(mul(rat(4, 3), mul(sq(d.r), d.r)));
  }
}
function add2(a, b) {
  return rat(a.n * b.d + b.n * a.d, a.d * b.d);
}
const add3 = (a, b, c) => add2(add2(a, b), c);

// The working: formula, substitution, exact result (with an approximation for pi and square roots).
export function working(solid, d) {
  const v = (k) => show(d[k]);
  const slant = (name) =>
    qText(qSqrt(name === "pyramid" ? add2(sq(mul(d.s, half)), sq(d.h)) : add2(sq(d.r), sq(d.h))));
  const forms = {
    cube: [`6s² = 6 × ${v("s")}²`, `s³ = ${v("s")}³`],
    prism: [
      `2(lw + lh + wh) = 2(${v("l")}×${v("w")} + ${v("l")}×${v("h")} + ${v("w")}×${v("h")})`,
      `l × w × h = ${v("l")} × ${v("w")} × ${v("h")}`,
    ],
    "triangular-prism": [
      `ab + (a + b + c)L = ${v("a")}×${v("b")} + (${v("a")} + ${v("b")} + ${qText(qSqrt(add2(sq(d.a), sq(d.b))))})×${v("length")}`,
      `½ × a × b × L = ½ × ${v("a")} × ${v("b")} × ${v("length")}`,
    ],
    "square-pyramid": [
      `s² + 2sℓ = ${v("s")}² + 2×${v("s")}×${slant("pyramid")}`,
      `⅓ × s² × h = ⅓ × ${v("s")}² × ${v("h")}`.replace("⅓", "⅓"),
    ],
    "triangular-pyramid": [
      `½(ab + ah + bh) + ½√(a²b² + a²h² + b²h²) with a = ${v("a")}, b = ${v("b")}, h = ${v("h")}`,
      `⅙ × a × b × h = ⅙ × ${v("a")} × ${v("b")} × ${v("h")}`,
    ],
    cylinder: [
      `2πr² + 2πrh = 2π × ${v("r")}² + 2π × ${v("r")} × ${v("h")}`,
      `πr²h = π × ${v("r")}² × ${v("h")}`,
    ],
    cone: [
      `πr² + πrℓ = π × ${v("r")}² + π × ${v("r")} × ${slant("cone")}`,
      `⅓πr²h = ⅓ × π × ${v("r")}² × ${v("h")}`,
    ],
    sphere: [`4πr² = 4π × ${v("r")}²`, `(4/3)πr³ = (4/3) × π × ${v("r")}³`],
  }[solid];
  const sa = surfaceArea(solid, d);
  const vol = volume(solid, d);
  return {
    sa: `${forms[0]} = ${qText(sa)}${qApprox(sa)}`,
    vol: `${forms[1]} = ${qText(vol)}${qApprox(vol)}`,
  };
}

export function sanitize(input = {}, config = {}) {
  const src = { ...config, ...input };
  const solid = SOLIDS.includes(src.solid) ? src.solid : "cube";
  const step = sane(src.step, ONE, rat(1, 4), rat(2));
  const dims = {};
  for (const key of DIM_KEYS[solid]) {
    const fallback = rat(DEFAULTS[solid][key]);
    const given = input.dims?.[key] ?? config.dims?.[key];
    const raw = sane(given, fallback, step, rat(MAX_DIM));
    const k = Math.max(1, Math.round((raw.n * step.d) / (raw.d * step.n)));
    dims[key] = mul(step, rat(k));
  }
  let view = VIEWS.includes(src.view) ? src.view : "solid";
  if (view === "builder" && solid !== "cube") view = "net";
  if (view === "net" && !hasNet(solid)) view = "solid";
  const fold = Math.min(FOLD_STEPS, Math.max(0, Math.round(Number(src.fold ?? FOLD_STEPS))));
  const seen = new Set();
  const cells = (Array.isArray(input.cells) ? input.cells : (config.cells ?? []))
    .map(([r, c]) => [Math.round(Number(r)), Math.round(Number(c))])
    .filter(
      ([r, c]) =>
        r >= 0 &&
        c >= 0 &&
        r < NET_ROWS &&
        c < NET_COLS &&
        !seen.has(`${r},${c}`) &&
        seen.add(`${r},${c}`),
    )
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const yaw = ((Math.round(Number(src.yaw ?? 30)) % 360) + 360) % 360;
  const hl = ["none", "faces", "edges", "vertices"].includes(src.hl) ? src.hl : "none";
  return { solid, dims, step, view, yaw: Number.isFinite(yaw) ? yaw : 30, fold, cells, hl };
}

export function isCorrect(state, target) {
  if (!target) return false;
  const keys = ["solid", "dims", "surfaceArea", "volume", "cubeNet"].filter(
    (k) => target[k] !== undefined,
  );
  if (!keys.length) return false;
  return keys.every((key) => {
    if (key === "solid") return state.solid === target.solid;
    if (key === "dims")
      return Object.entries(target.dims).every(
        ([k, v]) => state.dims[k] && eq(state.dims[k], parse(v)),
      );
    if (key === "cubeNet")
      return state.cells.length === 6 && isCubeNet(state.cells).valid === Boolean(target.cubeNet);
    const want = parse(target[key]);
    return (
      Boolean(want) &&
      qEq(
        key === "volume" ? volume(state.solid, state.dims) : surfaceArea(state.solid, state.dims),
        q(want),
      )
    );
  });
}
