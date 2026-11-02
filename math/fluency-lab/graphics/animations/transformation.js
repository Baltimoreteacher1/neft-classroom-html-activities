// Translate, reflect, rotate and dilate a polygon on the coordinate plane, one move at a time.
// Config: { polygon: [[x, y], ...3-5 vertices], steps: [{type: "translate", dx, dy} | {type: "reflect", axis: "x" | "y" |
// "y=x" | "y=-x" | "vertical" | "horizontal", at} | {type: "rotate", deg: 90 | 180 | 270, center: [x, y]} |
// {type: "dilate", k: 2-4 | {n, d}, center: [x, y]}], lang }. Every image must stay on the grid (-6..6).
import { cap, gcd, intIn, label, polygon, signed } from "./anim-kit.js";
import { createPlayer } from "./player.js";

const C = {
  title: "Transforming a polygon on the coordinate plane",
  start: "This is the starting polygon. Its vertices are {list}.",
  translate:
    "Translate (slide) the polygon. Every vertex moves so that x changes by {dx} and y changes by {dy}. For example, {v} {p} moves to {w} {q}.",
  reflectX:
    "Reflect (flip) the polygon across the x-axis. Each point keeps its x and its y changes sign: (x, y) becomes (x, −y). For example, {v} {p} goes to {w} {q}.",
  reflectY:
    "Reflect (flip) the polygon across the y-axis. Each point keeps its y and its x changes sign: (x, y) becomes (−x, y). For example, {v} {p} goes to {w} {q}.",
  reflectD:
    "Reflect (flip) the polygon across the line y = x. The two coordinates swap: (x, y) becomes (y, x). For example, {v} {p} goes to {w} {q}.",
  reflectA:
    "Reflect (flip) the polygon across the line y = −x. The coordinates swap and change sign: (x, y) becomes (−y, −x). For example, {v} {p} goes to {w} {q}.",
  reflectV:
    "Reflect (flip) the polygon across the vertical line x = {at}. Each point lands the same distance from the line on the other side. For example, {v} {p} goes to {w} {q}.",
  reflectH:
    "Reflect (flip) the polygon across the horizontal line y = {at}. Each point lands the same distance from the line on the other side. For example, {v} {p} goes to {w} {q}.",
  rotate90:
    "Rotate (turn) the polygon 90° counterclockwise about the origin: (x, y) becomes (−y, x). For example, {v} {p} goes to {w} {q}.",
  rotate180:
    "Rotate (turn) the polygon 180° about the origin: (x, y) becomes (−x, −y). For example, {v} {p} goes to {w} {q}.",
  rotate270:
    "Rotate (turn) the polygon 270° counterclockwise about the origin: (x, y) becomes (y, −x). For example, {v} {p} goes to {w} {q}.",
  rotateAny:
    "Rotate (turn) the polygon {deg}° counterclockwise about the point ({cx}, {cy}). That point stays fixed and every other point turns around it. For example, {v} {p} goes to {w} {q}.",
  dilate:
    "Dilate (resize) the polygon with scale factor {k} from the center ({cx}, {cy}). Each vertex ends up {k} times as far from the center, on the same ray. For example, {v} {p} goes to {w} {q}.",
  done: "After all the moves, the final polygon has vertices {list}.",
  before: "Before",
  after: "After",
  vertices: "Vertices",
};
export const KEYS = Object.values(C);

export const GRID = { range: 6, cell: 24, ox: 240, oy: 168 };
const px = (x) => GRID.ox + x * GRID.cell;
const py = (y) => GRID.oy - y * GRID.cell;
const TABLE_TOP_VIEW = 380;
const NAMES = ["A", "B", "C", "D", "E"];
const PRIMES = ["", "′", "″", "‴", "⁗"];
const AXES = { x: C.reflectX, y: C.reflectY, "y=x": C.reflectD, "y=-x": C.reflectA };

// Exact rationals { n, d } with d > 0 in lowest terms.
const R = (n, d = 1) => {
  const g = gcd(n, d) || 1;
  const s = d < 0 ? -1 : 1;
  return { n: (s * n) / g, d: (s * d) / g };
};
const add = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => add(a, R(-b.n, b.d));
const mul = (a, b) => R(a.n * b.n, a.d * b.d);
const neg = (a) => R(-a.n, a.d);
const num = (a) => a.n / a.d;
const rtext = (a) => (a.d === 1 ? signed(a.n) : `${a.n < 0 ? "−" : ""}${Math.abs(a.n)}/${a.d}`);
const ptext = (p) => `(${rtext(p.x)}, ${rtext(p.y)})`;
const inRange = (p) => Math.abs(num(p.x)) <= GRID.range && Math.abs(num(p.y)) <= GRID.range;

const DEFAULT = {
  polygon: [[1, 1], [3, 1], [1, 2]],
  steps: [
    { type: "translate", dx: 1, dy: 2 },
    { type: "reflect", axis: "y" },
    { type: "rotate", deg: 90, center: [0, 0] },
    { type: "dilate", k: 2, center: [-3, -2] },
  ],
};

const readPoint = (p) => {
  const x = intIn(p?.[0], -GRID.range, GRID.range, null);
  const y = intIn(p?.[1], -GRID.range, GRID.range, null);
  return x === null || y === null ? null : [x, y];
};
function readStep(s) {
  if (s?.type === "translate") {
    const dx = intIn(s.dx, -12, 12, null);
    const dy = intIn(s.dy, -12, 12, null);
    return dx === null || dy === null || (!dx && !dy) ? null : { type: "translate", dx, dy };
  }
  if (s?.type === "reflect") {
    if (s.axis in AXES) return { type: "reflect", axis: s.axis };
    const at = intIn(s.at, -GRID.range, GRID.range, null);
    return (s.axis === "vertical" || s.axis === "horizontal") && at !== null ? { type: "reflect", axis: s.axis, at } : null;
  }
  const center = readPoint(s?.center) || (s?.center === undefined ? [0, 0] : null);
  if (s?.type === "rotate") {
    const deg = ((Number(s.deg) % 360) + 360) % 360;
    return center && [90, 180, 270].includes(deg) ? { type: "rotate", deg, center } : null;
  }
  if (s?.type === "dilate") {
    const k = typeof s.k === "number" ? { n: s.k, d: 1 } : s.k;
    const n = intIn(k?.n, 1, 4, null);
    const d = intIn(k?.d, 1, 4, null);
    return center && n !== null && d !== null && n !== d ? { type: "dilate", k: R(n, d), center } : null;
  }
  return null;
}

function applyStep(step, p) {
  const at = (n) => R(n);
  switch (step.type) {
    case "translate":
      return { x: add(p.x, at(step.dx)), y: add(p.y, at(step.dy)) };
    case "reflect":
      if (step.axis === "x") return { x: p.x, y: neg(p.y) };
      if (step.axis === "y") return { x: neg(p.x), y: p.y };
      if (step.axis === "y=x") return { x: p.y, y: p.x };
      if (step.axis === "y=-x") return { x: neg(p.y), y: neg(p.x) };
      if (step.axis === "vertical") return { x: sub(at(2 * step.at), p.x), y: p.y };
      return { x: p.x, y: sub(at(2 * step.at), p.y) };
    case "rotate": {
      const [cx, cy] = step.center;
      const dx = sub(p.x, at(cx));
      const dy = sub(p.y, at(cy));
      const turned = step.deg === 90 ? [neg(dy), dx] : step.deg === 180 ? [neg(dx), neg(dy)] : [dy, neg(dx)];
      return { x: add(at(cx), turned[0]), y: add(at(cy), turned[1]) };
    }
    default: {
      const [cx, cy] = step.center;
      return { x: add(at(cx), mul(step.k, sub(p.x, at(cx)))), y: add(at(cy), mul(step.k, sub(p.y, at(cy)))) };
    }
  }
}

const doubleArea = (pts) => pts.reduce((s, p, i) => s + (pts[i].x * pts[(i + 1) % pts.length].y - pts[(i + 1) % pts.length].x * pts[i].y), 0);

function runSteps(polygonPts, source) {
  let current = polygonPts.map(([x, y]) => ({ x: R(x), y: R(y) }));
  const steps = [];
  for (const s of source.slice(0, 5)) {
    const step = readStep(s);
    if (!step) break;
    const next = current.map((p) => applyStep(step, p));
    if (!next.every(inRange)) break;
    steps.push(step);
    current = next;
  }
  return steps;
}

export function normalizeConfig(config = {}) {
  const raw = Array.isArray(config.polygon) ? config.polygon.slice(0, 5).map(readPoint) : [];
  const unique = new Set(raw.map((p) => p?.join(",")));
  const polyOk =
    raw.length >= 3 && raw.every(Boolean) && unique.size === raw.length && doubleArea(raw.map(([x, y]) => ({ x, y }))) !== 0;
  if (!polyOk) return { polygon: DEFAULT.polygon, steps: runSteps(DEFAULT.polygon, DEFAULT.steps) };
  let steps = Array.isArray(config.steps) ? runSteps(raw, config.steps) : [];
  if (!steps.length) steps = runSteps(raw, DEFAULT.steps);
  // A reflection over the y-axis always stays on the grid, so it is a safe last resort.
  if (!steps.length) steps = [{ type: "reflect", axis: "y" }];
  return { polygon: raw, steps };
}

// Channels the renderer tweens, expressed in SVG pixels: translate by (tx, ty); rotate and dilate about p; mirror
// across the line through p whose svg direction is ma degrees.
function channels(step) {
  const base = { tx: 0, ty: 0, rot: 0, dil: 1, mir: 1, px: 0, py: 0, ma: 0 };
  if (step.type === "translate") return { ...base, tx: step.dx * GRID.cell, ty: -step.dy * GRID.cell };
  if (step.type === "rotate") return { ...base, rot: -step.deg, px: px(step.center[0]), py: py(step.center[1]) };
  if (step.type === "dilate") return { ...base, dil: num(step.k), px: px(step.center[0]), py: py(step.center[1]) };
  const line = {
    x: { x: 0, y: 0, ma: 0 },
    y: { x: 0, y: 0, ma: 90 },
    "y=x": { x: 0, y: 0, ma: -45 },
    "y=-x": { x: 0, y: 0, ma: 45 },
    vertical: { x: step.at, y: 0, ma: 90 },
    horizontal: { x: 0, y: step.at, ma: 0 },
  }[step.axis];
  return { ...base, mir: -1, px: px(line.x), py: py(line.y), ma: line.ma };
}
const identity = (ch) => ({ ...ch, tx: 0, ty: 0, rot: 0, dil: 1, mir: 1 });

function captionFor(step, v, p, w, q) {
  const names = { v, p, w, q };
  if (step.type === "translate") return cap(C.translate, { ...names, dx: signed(step.dx), dy: signed(step.dy) });
  if (step.type === "reflect") {
    if (step.axis === "vertical") return cap(C.reflectV, { ...names, at: signed(step.at) });
    if (step.axis === "horizontal") return cap(C.reflectH, { ...names, at: signed(step.at) });
    return cap(AXES[step.axis], names);
  }
  if (step.type === "rotate") {
    const [cx, cy] = step.center;
    if (!cx && !cy) return cap(C[`rotate${step.deg}`], names);
    return cap(C.rotateAny, { ...names, deg: step.deg, cx: signed(cx), cy: signed(cy) });
  }
  const [cx, cy] = step.center;
  return cap(C.dilate, { ...names, k: step.k.d === 1 ? step.k.n : `${step.k.n}/${step.k.d}`, cx: signed(cx), cy: signed(cy) });
}

export function buildModel(config = {}) {
  const { polygon: start, steps: moves } = normalizeConfig(config);
  const stages = [start.map(([x, y]) => ({ x: R(x), y: R(y) }))];
  for (const s of moves) stages.push(stages[stages.length - 1].map((p) => applyStep(s, p)));
  const svgPoints = (pts) => pts.flatMap((p) => [px(num(p.x)), py(num(p.y))]);
  const nameAt = (v, stage) => `${NAMES[v]}${PRIMES[stage]}`;
  const list = (stage) => stages[stage].map((p, v) => `${NAMES[v]}${PRIMES[stage]} ${ptext(p)}`).join(", ");

  const grid = () => {
    const items = [];
    for (let k = -GRID.range; k <= GRID.range; k += 1) {
      const cls = k === 0 ? "an-axis" : "an-grid";
      items.push(
        { id: `gx${k}`, tag: "line", cls, a: { x1: px(k), y1: py(GRID.range), x2: px(k), y2: py(-GRID.range) } },
        { id: `gy${k}`, tag: "line", cls, a: { x1: px(-GRID.range), y1: py(k), x2: px(GRID.range), y2: py(k) } },
      );
      if (k !== 0 && k % 2 === 0)
        items.push(
          label(`tx${k}`, px(k), GRID.oy + 18, signed(k), "an-tick", { a: { "text-anchor": "middle" } }),
          label(`ty${k}`, GRID.ox - 6, py(k) + 5, signed(k), "an-tick", { a: { "text-anchor": "end" } }),
        );
    }
    return items;
  };
  const TABLE_TOP = 358;
  const tableItems = (stage) => {
    const rows = stages[stage].map((p, v) => `${nameAt(v, stage)} ${ptext(p)}`);
    const prev = stage > 0 ? stages[stage - 1].map((p, v) => `${nameAt(v, stage - 1)} ${ptext(p)}`) : [];
    const size = Math.max(14, Math.min(21, 190 / (Math.max(...rows.map((t) => t.length), ...prev.map((t) => t.length)) * 0.6)));
    const at = (x, y, text, cls, extra) => label(extra.id, x, y, text, cls, { a: { "text-anchor": "start", ...extra.a } });
    const items = [];
    if (stage === 0) items.push(at(40, TABLE_TOP, cap(C.vertices), "an-note", { id: "th1" }));
    else items.push(at(40, TABLE_TOP, cap(C.before), "an-note", { id: "th1" }), at(260, TABLE_TOP, cap(C.after), "an-note", { id: "th2" }));
    rows.forEach((text, v) => {
      const y = TABLE_TOP + 32 + v * 30;
      if (stage === 0) items.push(at(40, y, text, "an-cell-text", { id: `tr${v}`, a: { "font-size": size } }));
      else
        items.push(
          at(40, y, prev[v], "an-cell-text", { id: `tp${v}`, a: { "font-size": size } }),
          at(260, y, text, "an-cell-text", { id: `tq${v}`, a: { "font-size": size } }),
        );
    });
    return items;
  };
  const centroid = (pts) => ({ x: pts.reduce((s, p) => s + num(p.x), 0) / pts.length, y: pts.reduce((s, p) => s + num(p.y), 0) / pts.length });
  const vertexLabels = (stage, prefix) => {
    const pts = stages[stage];
    const c = centroid(pts);
    return pts.map((p, v) => {
      const dx = num(p.x) - c.x;
      const dy = num(p.y) - c.y;
      const len = Math.hypot(dx, dy) || 1;
      return label(`${prefix}${v}`, px(num(p.x)) + (dx / len) * 13, py(num(p.y)) - (dy / len) * 13 + 5, nameAt(v, stage), "an-vlabel", { a: { "text-anchor": "middle" } });
    });
  };

  const sceneAt = (stage) => {
    const items = grid();
    items.push(polygon("img0", svgPoints(stages[0]), stage === 0 ? "an-poly an-poly-now" : "an-poly an-poly-old", { role: "image:0" }));
    for (let m = 1; m <= stage; m += 1) {
      const ch = channels(moves[m - 1]);
      items.push(
        polygon(`img${m}`, svgPoints(stages[m - 1]), m === stage ? "an-poly an-poly-now" : "an-poly an-poly-old", {
          role: `image:${m}`,
          xf: ch,
          from: { xf: identity(ch), o: 1 },
        }),
      );
    }
    items.push(...vertexLabels(stage, "vl"), ...tableItems(stage));
    if (stage > 0) items.push(...vertexLabels(0, "v0"));
    return items;
  };

  const steps = stages.map((pts, stage) => {
    if (stage === 0) return { caption: cap(C.start, { list: list(0) }), scene: sceneAt(0), state: { stage, vertices: pts } };
    const s = moves[stage - 1];
    return {
      caption: captionFor(s, nameAt(0, stage - 1), ptext(stages[stage - 1][0]), nameAt(0, stage), ptext(pts[0])),
      scene: sceneAt(stage),
      state: { stage, vertices: pts, move: s },
    };
  });
  const last = stages.length - 1;
  steps.push({ caption: cap(C.done, { list: list(last) }), scene: sceneAt(last), state: { stage: last, vertices: stages[last], final: true } });
  return {
    kind: "transformation",
    title: cap(C.title),
    view: [480, TABLE_TOP_VIEW + start.length * 30],
    steps,
    grid: GRID,
    result: { start, moves, stages },
  };
}

export const play = (container, config = {}) => createPlayer(container, buildModel(config), config);
