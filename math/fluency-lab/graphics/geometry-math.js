// Exact math for the geometry graphic: integer-vertex shapes on a grid (area by the shoelace formula, perimeter as an
// exact sum of whole numbers and square roots), vertex-drag constraints per shape, shape classification by exact
// squared lengths and dot/cross products, protractor angle facts, and ruler snapping in cm and inches.
import { ZERO, cmp, eq, mul, parse, rat, sane } from "./b-rational.js";

export const SHAPES = ["rectangle", "triangle", "parallelogram", "trapezoid", "composite"];
export const TOOLS = ["shape", "angle", "ruler", "classify"];
export const UNITS = ["cm", "in"];
export const GRID = { w: 12, h: 9 };

export const DEFAULT_VERTS = {
  rectangle: [
    [2, 2],
    [8, 2],
    [8, 6],
    [2, 6],
  ],
  triangle: [
    [2, 2],
    [9, 2],
    [5, 7],
  ],
  parallelogram: [
    [1, 2],
    [7, 2],
    [10, 6],
    [4, 6],
  ],
  trapezoid: [
    [1, 2],
    [10, 2],
    [8, 6],
    [3, 6],
  ],
  composite: [
    [1, 1],
    [9, 1],
    [9, 4],
    [5, 4],
    [5, 8],
    [1, 8],
  ],
};
export const DEFAULT_CLASSIFY = {
  triangle: [
    [2, 2],
    [9, 2],
    [5, 7],
  ],
  quadrilateral: [
    [2, 2],
    [8, 2],
    [8, 6],
    [2, 6],
  ],
};
const toV = (list) => list.map(([x, y]) => ({ x, y }));
export const defaultVerts = (shape) => toV(DEFAULT_VERTS[shape]);

// ---- polygon facts -------------------------------------------------------------------------------------------
export const cross = (a, b) => a.x * b.y - a.y * b.x;
export const sub = (p, q) => ({ x: p.x - q.x, y: p.y - q.y });
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const len2 = (a) => a.x * a.x + a.y * a.y;
export const edges = (verts) => verts.map((p, i) => [p, verts[(i + 1) % verts.length]]);

// Twice the signed area (shoelace); the area is |value| / 2, an exact rational.
export const area2 = (verts) =>
  edges(verts).reduce((sum, [p, q]) => sum + (p.x * q.y - q.x * p.y), 0);
export const area = (verts) => rat(Math.abs(area2(verts)), 2);

export function sqrtForm(m) {
  let k = 1;
  let r = m;
  for (let f = 2; f * f <= r; f += 1)
    while (r % (f * f) === 0) {
      r /= f * f;
      k *= f;
    }
  return { k, r };
}
// Perimeter as { int, terms: [{ c, r }] } meaning int + sum of c * sqrt(r), with r squarefree and > 1.
export function perimeter(verts) {
  let int = 0;
  const byRoot = new Map();
  for (const [p, q] of edges(verts)) {
    const { k, r } = sqrtForm(len2(sub(q, p)));
    if (r === 1) int += k;
    else byRoot.set(r, (byRoot.get(r) ?? 0) + k);
  }
  return { int, terms: [...byRoot].sort((a, b) => a[0] - b[0]).map(([r, c]) => ({ c, r })) };
}
export const perimeterNumber = (p) =>
  p.int + p.terms.reduce((sum, { c, r }) => sum + c * Math.sqrt(r), 0);
export function perimeterText(p) {
  const parts = [];
  if (p.int || !p.terms.length) parts.push(String(p.int));
  for (const { c, r } of p.terms) parts.push(`${c === 1 ? "" : c}√${r}`);
  return parts.join(" + ");
}

// ---- shape construction and validity -------------------------------------------------------------------------
const inGrid = (verts, grid) =>
  verts.every(
    ({ x, y }) =>
      Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x <= grid.w && y <= grid.h,
  );

// composite L-shape parameters: corner (x0, y0), bottom width a, bottom height b, top width c, total height d
export const lParams = (v) => ({
  x0: v[0].x,
  y0: v[0].y,
  a: v[1].x - v[0].x,
  b: v[2].y - v[0].y,
  c: v[3].x - v[0].x,
  d: v[4].y - v[0].y,
});
export const lVerts = ({ x0, y0, a, b, c, d }) =>
  toV([
    [x0, y0],
    [x0 + a, y0],
    [x0 + a, y0 + b],
    [x0 + c, y0 + b],
    [x0 + c, y0 + d],
    [x0, y0 + d],
  ]);

export function isValidShape(shape, v, grid = GRID) {
  if (!Array.isArray(v) || !inGrid(v, grid)) return false;
  switch (shape) {
    case "rectangle":
      return (
        v.length === 4 &&
        v[0].y === v[1].y &&
        v[2].y === v[3].y &&
        v[0].x === v[3].x &&
        v[1].x === v[2].x &&
        v[1].x > v[0].x &&
        v[2].y > v[0].y
      );
    case "triangle":
      return v.length === 3 && area2(v) !== 0;
    case "parallelogram":
      return (
        v.length === 4 &&
        v[0].y === v[1].y &&
        v[2].y === v[3].y &&
        v[2].x - v[3].x === v[1].x - v[0].x &&
        v[1].x > v[0].x &&
        v[3].y > v[0].y
      );
    case "trapezoid":
      return (
        v.length === 4 &&
        v[0].y === v[1].y &&
        v[2].y === v[3].y &&
        v[1].x > v[0].x &&
        v[2].x > v[3].x &&
        v[3].y > v[0].y
      );
    case "composite": {
      if (v.length !== 6) return false;
      const p = lParams(v);
      return (
        p.c >= 1 &&
        p.c < p.a &&
        p.b >= 1 &&
        p.b < p.d &&
        JSON.stringify(v) === JSON.stringify(lVerts(p))
      );
    }
    default:
      return false;
  }
}

const clampTo = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

// Drag vertex `i` toward (X, Y). Each shape keeps its own invariants; an impossible move leaves the shape unchanged.
export function moveVertex(shape, verts, i, target, grid = GRID) {
  const X = clampTo(Math.round(target.x), 0, grid.w);
  const Y = clampTo(Math.round(target.y), 0, grid.h);
  const v = verts.map((p) => ({ ...p }));
  let next = null;
  if (shape === "triangle") {
    v[i] = { x: X, y: Y };
    next = v;
  } else if (shape === "rectangle") {
    let [x1, x2, y1, y2] = [v[0].x, v[1].x, v[0].y, v[2].y];
    if (i === 0 || i === 3) x1 = Math.min(X, x2 - 1);
    else x2 = Math.max(X, x1 + 1);
    if (i === 0 || i === 1) y1 = Math.min(Y, y2 - 1);
    else y2 = Math.max(Y, y1 + 1);
    next = toV([
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2],
    ]);
  } else if (shape === "parallelogram") {
    const [x, y1, y2] = [v[0].x, v[0].y, v[2].y];
    const base = v[1].x - x;
    const shear = v[3].x - x;
    let [nx, ny1, nb, ns, ny2] = [x, y1, base, shear, y2];
    if (i === 0) {
      nx = clampTo(X, -Math.min(0, shear), grid.w - Math.max(base, base + shear));
      ny1 = clampTo(Y, 0, grid.h - (y2 - y1));
      ny2 = ny1 + (y2 - y1);
    } else if (i === 1) nb = Math.max(1, X - x);
    else if (i === 2) {
      nb = Math.max(1, X - v[3].x);
      ny2 = Math.max(y1 + 1, Y);
    } else {
      ns = X - x;
      ny2 = Math.max(y1 + 1, Y);
    }
    next = toV([
      [nx, ny1],
      [nx + nb, ny1],
      [nx + ns + nb, ny2],
      [nx + ns, ny2],
    ]);
  } else if (shape === "trapezoid") {
    let [a, b, c, d, y1, y2] = [v[0].x, v[1].x, v[2].x, v[3].x, v[0].y, v[2].y];
    if (i === 0) a = Math.min(X, b - 1);
    else if (i === 1) b = Math.max(X, a + 1);
    else if (i === 2) c = Math.max(X, d + 1);
    else d = Math.min(X, c - 1);
    if (i < 2) y1 = Math.min(Y, y2 - 1);
    else y2 = Math.max(Y, y1 + 1);
    next = toV([
      [a, y1],
      [b, y1],
      [c, y2],
      [d, y2],
    ]);
  } else if (shape === "composite") {
    const p = lParams(v);
    if (i === 0) {
      p.x0 = clampTo(X, 0, grid.w - p.a);
      p.y0 = clampTo(Y, 0, grid.h - p.d);
    } else if (i === 1) p.a = Math.max(p.c + 1, X - p.x0);
    else if (i === 2) {
      p.a = Math.max(p.c + 1, X - p.x0);
      p.b = clampTo(Y - p.y0, 1, p.d - 1);
    } else if (i === 3) {
      p.c = clampTo(X - p.x0, 1, p.a - 1);
      p.b = clampTo(Y - p.y0, 1, p.d - 1);
    } else if (i === 4) {
      p.c = clampTo(X - p.x0, 1, p.a - 1);
      p.d = Math.max(p.b + 1, Y - p.y0);
    } else p.d = Math.max(p.b + 1, Y - p.y0);
    next = lVerts(p);
  }
  return next && isValidShape(shape, next, grid) ? next : verts;
}

// ---- working shown beside the live measurements --------------------------------------------------------------
export function measures(shape, v) {
  const A = area(v);
  const out = { area: A, perimeter: perimeter(v), parts: null };
  if (shape === "rectangle") out.parts = { b: v[1].x - v[0].x, h: v[2].y - v[0].y };
  else if (shape === "parallelogram") out.parts = { b: v[1].x - v[0].x, h: v[3].y - v[0].y };
  else if (shape === "trapezoid")
    out.parts = { b1: v[1].x - v[0].x, b2: v[2].x - v[3].x, h: v[3].y - v[0].y };
  else if (shape === "composite") out.parts = lParams(v);
  else if (shape === "triangle") out.parts = triangleBaseHeight(v);
  return out;
}
// A triangle with a horizontal or vertical side has a base and a perpendicular height on the grid.
export function triangleBaseHeight(v) {
  for (let i = 0; i < 3; i += 1) {
    const p = v[i];
    const q = v[(i + 1) % 3];
    const o = v[(i + 2) % 3];
    if (p.y === q.y) return { b: Math.abs(q.x - p.x), h: Math.abs(o.y - p.y) };
    if (p.x === q.x) return { b: Math.abs(q.y - p.y), h: Math.abs(o.x - p.x) };
  }
  return null;
}

// ---- classification ------------------------------------------------------------------------------------------
export function classifyTriangle(v) {
  const sides = [0, 1, 2].map((i) => len2(sub(v[(i + 1) % 3], v[i])));
  const equal = new Set(sides).size;
  const bySides = equal === 1 ? "equilateral" : equal === 2 ? "isosceles" : "scalene";
  const dots = [0, 1, 2].map((i) => dot(sub(v[(i + 1) % 3], v[i]), sub(v[(i + 2) % 3], v[i])));
  const byAngles = dots.some((d) => d === 0)
    ? "right"
    : dots.some((d) => d < 0)
      ? "obtuse"
      : "acute";
  return { bySides, byAngles };
}

const segCross = (a, b, c, d) => {
  const d1 = cross(sub(b, a), sub(c, a));
  const d2 = cross(sub(b, a), sub(d, a));
  const d3 = cross(sub(d, c), sub(a, c));
  const d4 = cross(sub(d, c), sub(b, c));
  return Math.sign(d1) * Math.sign(d2) < 0 && Math.sign(d3) * Math.sign(d4) < 0;
};
export function isSimpleQuad(v) {
  if (v.length !== 4) return false;
  for (let i = 0; i < 4; i += 1)
    if (cross(sub(v[(i + 1) % 4], v[i]), sub(v[(i + 2) % 4], v[(i + 1) % 4])) === 0) return false;
  return !segCross(v[0], v[1], v[2], v[3]) && !segCross(v[1], v[2], v[3], v[0]);
}

// Inclusive classes (a square is also a rectangle, rhombus, parallelogram and trapezoid; a trapezoid has at least
// one pair of parallel sides) plus the most specific name.
export function classifyQuad(v) {
  const e = [0, 1, 2, 3].map((i) => sub(v[(i + 1) % 4], v[i]));
  const parAB = cross(e[0], e[2]) === 0;
  const parBC = cross(e[1], e[3]) === 0;
  const para = parAB && parBC;
  const rightAngle = [0, 1, 2, 3].some((i) => dot(e[i], e[(i + 1) % 4]) === 0);
  const rect = para && rightAngle;
  const rhombus = para && len2(e[0]) === len2(e[1]);
  const l = e.map(len2);
  const kite = (l[0] === l[3] && l[1] === l[2]) || (l[0] === l[1] && l[2] === l[3]);
  const classes = ["quadrilateral"];
  if (parAB || parBC) classes.push("trapezoid");
  if (para) classes.push("parallelogram");
  if (rect) classes.push("rectangle");
  if (rhombus) classes.push("rhombus");
  if (rect && rhombus) classes.push("square");
  if (kite) classes.push("kite");
  const best = [
    "square",
    "rectangle",
    "rhombus",
    "parallelogram",
    "kite",
    "trapezoid",
    "quadrilateral",
  ].find((c) => classes.includes(c));
  return { classes, best };
}

export function isValidClassify(v, grid = GRID) {
  if (!Array.isArray(v) || !inGrid(v, grid)) return false;
  return v.length === 3 ? area2(v) !== 0 : isSimpleQuad(v);
}
export function moveClassifyVertex(verts, i, target, grid = GRID) {
  const next = verts.map((p, k) =>
    k === i
      ? { x: clampTo(Math.round(target.x), 0, grid.w), y: clampTo(Math.round(target.y), 0, grid.h) }
      : { ...p },
  );
  return isValidClassify(next, grid) ? next : verts;
}

// ---- angle and ruler -----------------------------------------------------------------------------------------
export function angleKind(degrees) {
  if (degrees === 0) return "zero";
  if (degrees < 90) return "acute";
  if (degrees === 90) return "right";
  if (degrees < 180) return "obtuse";
  return "straight";
}
export const RULER = {
  cm: { step: rat(1, 10), max: rat(15) },
  in: { step: rat(1, 16), max: rat(6) },
};
export function snapLength(unit, value) {
  const { step, max } = RULER[unit];
  const k = Math.round((value.n * step.d) / (value.d * step.n));
  const snapped = mul(step, rat(k));
  return cmp(snapped, ZERO) < 0 ? ZERO : cmp(snapped, max) > 0 ? max : snapped;
}

// ---- state ---------------------------------------------------------------------------------------------------
export function sanitize(input = {}, config = {}) {
  const src = { ...config, ...input };
  const grid = {
    w: clampTo(Number(src.grid?.w) || GRID.w, 4, 20),
    h: clampTo(Number(src.grid?.h) || GRID.h, 4, 16),
  };
  const tool = TOOLS.includes(src.tool) ? src.tool : "shape";
  const shape = SHAPES.includes(src.shape) ? src.shape : "rectangle";
  const fromList = (list) =>
    Array.isArray(list)
      ? list.map((p) => (Array.isArray(p) ? { x: p[0], y: p[1] } : { x: p?.x, y: p?.y }))
      : null;
  const given = fromList(input.verts) ?? fromList(config.verts);
  const verts = given && isValidShape(shape, given, grid) ? given : defaultVerts(shape);
  const cgiven = fromList(input.cverts) ?? fromList(config.cverts);
  const cverts =
    cgiven && isValidClassify(cgiven, grid) ? cgiven : toV(DEFAULT_CLASSIFY.quadrilateral);
  const degrees = clampTo(Math.round(Number(src.degrees)), 0, 180);
  const unit = UNITS.includes(src.unit) ? src.unit : "cm";
  const length = snapLength(unit, sane(src.length, rat(unit === "cm" ? 7 : 3)));
  const marker = snapLength(unit, sane(src.marker, length));
  return {
    tool,
    shape,
    grid,
    verts,
    cverts,
    degrees: Number.isFinite(degrees) ? degrees : 45,
    unit,
    length,
    marker,
  };
}

export function isCorrect(state, target) {
  if (!target) return false;
  if (state.tool === "angle")
    return target.degrees !== undefined && state.degrees === Number(target.degrees);
  if (state.tool === "ruler") {
    const want =
      target.marker !== undefined
        ? parse(target.marker)
        : target.length !== undefined
          ? parse(target.length)
          : null;
    return Boolean(want) && eq(state.marker, want);
  }
  if (state.tool === "classify")
    return (
      Boolean(target.classification) &&
      (state.cverts.length === 3
        ? [classifyTriangle(state.cverts).bySides, classifyTriangle(state.cverts).byAngles]
        : classifyQuad(state.cverts).classes
      ).includes(target.classification)
    );
  const keys = ["shape", "area", "perimeter"].filter((key) => target[key] !== undefined);
  if (!keys.length) return false;
  const p = perimeter(state.verts);
  return keys.every((key) => {
    if (key === "shape") return state.shape === target.shape;
    if (key === "area") return eq(area(state.verts), parse(target.area));
    return p.terms.length === 0 && p.int === Number(target.perimeter);
  });
}
