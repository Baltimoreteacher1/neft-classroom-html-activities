// Exact math for the four-quadrant coordinate grid: snapping, quadrants, axis distances, and the four
// transformations (translation, reflection, rotation about a centre, dilation about a centre) as rational maps.
import {
  ONE,
  ZERO,
  abs,
  add,
  clamp,
  cmp,
  eq,
  fmt,
  isInt,
  mul,
  neg,
  parse,
  rat,
  sane, show,
  snapTo,
  sub,
} from "./b-rational.js";

export const MAX_POINTS = 12;
export const AXES = ["x", "y", "y=x", "y=-x"];
export const ANGLES = [90, 180, 270];
export const TRANSFORM_TYPES = ["none", "translate", "reflect", "rotate", "dilate"];

const WORLD = { xmin: -6, xmax: 6, ymin: -6, ymax: 6 };
const ptOf = (p, fb = ZERO) => ({ x: sane(p?.x, fb), y: sane(p?.y, fb) });

export function sanitizeRange(range = {}) {
  const pick = (v, fb) => Math.max(-20, Math.min(20, Number.isInteger(Number(v)) ? Number(v) : fb));
  let { xmin, xmax, ymin, ymax } = {
    xmin: pick(range.xmin, WORLD.xmin),
    xmax: pick(range.xmax, WORLD.xmax),
    ymin: pick(range.ymin, WORLD.ymin),
    ymax: pick(range.ymax, WORLD.ymax),
  };
  if (xmax - xmin < 2) [xmin, xmax] = [xmin, xmin + 2];
  if (ymax - ymin < 2) [ymin, ymax] = [ymin, ymin + 2];
  return { xmin, xmax, ymin, ymax };
}

export function sanitizeTransform(tr = {}) {
  const type = TRANSFORM_TYPES.includes(tr.type) ? tr.type : "none";
  if (type === "translate")
    return {
      type,
      dx: sane(tr.dx, ZERO, rat(-40), rat(40)),
      dy: sane(tr.dy, ZERO, rat(-40), rat(40)),
    };
  if (type === "reflect") return { type, axis: AXES.includes(tr.axis) ? tr.axis : "y" };
  if (type === "rotate")
    return {
      type,
      angle: ANGLES.includes(Number(tr.angle)) ? Number(tr.angle) : 90,
      ...ptOfCenter(tr),
    };
  if (type === "dilate")
    return { type, k: sane(tr.k, rat(2), rat(-10), rat(10)), ...ptOfCenter(tr) };
  return { type };
}
const ptOfCenter = (tr) => ({
  cx: sane(tr.cx, ZERO, rat(-20), rat(20)),
  cy: sane(tr.cy, ZERO, rat(-20), rat(20)),
});

export function sanitize(input = {}, config = {}) {
  const src = { ...config, ...input };
  const range = sanitizeRange(src.range);
  const step = sane(src.step, ONE, rat(1, 8), rat(5));
  const clampPt = (p) => ({
    x: clamp(p.x, rat(range.xmin), rat(range.xmax)),
    y: clamp(p.y, rat(range.ymin), rat(range.ymax)),
  });
  const seen = new Set();
  const points = (Array.isArray(input.points) ? input.points : (config.points ?? []))
    .slice(0, MAX_POINTS)
    .map((p, i) => {
      let id = typeof p.id === "string" && /^p\d+$/.test(p.id) && !seen.has(p.id) ? p.id : null;
      if (!id) {
        let n = i + 1;
        while (seen.has(`p${n}`)) n += 1;
        id = `p${n}`;
      }
      seen.add(id);
      return { id, ...clampPt(ptOf(p)) };
    });
  const selected = points.some((p) => p.id === input.selected) ? input.selected : null;
  return {
    range,
    step,
    points,
    closed: Boolean(src.closed),
    transform: sanitizeTransform(input.transform ?? config.transform),
    selected,
    cursor: clampPt(ptOf(input.cursor)),
  };
}

export function applyTransform(p, tr) {
  const { x, y } = p;
  switch (tr.type) {
    case "translate":
      return { x: add(x, tr.dx), y: add(y, tr.dy) };
    case "reflect": {
      const [rx, ry] = { x: [x, neg(y)], y: [neg(x), y], "y=x": [y, x], "y=-x": [neg(y), neg(x)] }[tr.axis];
      return { x: rx, y: ry };
    }
    case "rotate": {
      const rx = sub(x, tr.cx);
      const ry = sub(y, tr.cy);
      const [ox, oy] =
        tr.angle === 90 ? [neg(ry), rx] : tr.angle === 180 ? [neg(rx), neg(ry)] : [ry, neg(rx)];
      return { x: add(tr.cx, ox), y: add(tr.cy, oy) };
    }
    case "dilate":
      return { x: add(tr.cx, mul(tr.k, sub(x, tr.cx))), y: add(tr.cy, mul(tr.k, sub(y, tr.cy))) };
    default:
      return { x, y };
  }
}

export const imagePoints = (state) => state.points.map((p) => applyTransform(p, state.transform));

export function quadrant(p) {
  const sx = Math.sign(p.x.n);
  const sy = Math.sign(p.y.n);
  if (sx === 0 && sy === 0) return "origin";
  if (sy === 0) return "x-axis";
  if (sx === 0) return "y-axis";
  return sx > 0 ? (sy > 0 ? "I" : "IV") : sy > 0 ? "II" : "III";
}

// Distance facts between two points: the legs along the axes and the squared straight-line distance.
export function legs(p, q) {
  const dx = abs(sub(q.x, p.x));
  const dy = abs(sub(q.y, p.y));
  const kind =
    dx.n === 0 && dy.n === 0
      ? "same"
      : dy.n === 0
        ? "horizontal"
        : dx.n === 0
          ? "vertical"
          : "diagonal";
  return { dx, dy, kind, squared: add(mul(dx, dx), mul(dy, dy)) };
}

export const samePoint = (p, q) => eq(p.x, q.x) && eq(p.y, q.y);
export function samePointSet(a, b) {
  if (a.length !== b.length) return false;
  const rest = b.slice();
  for (const p of a) {
    const i = rest.findIndex((q) => samePoint(p, q));
    if (i < 0) return false;
    rest.splice(i, 1);
  }
  return true;
}
const asPoints = (list) =>
  (list ?? []).map((p) => ({ x: parse(p.x ?? p[0]), y: parse(p.y ?? p[1]) }));

export function isCorrect(state, target) {
  if (!target) return false;
  if (target.image)
    return (
      state.transform.type !== "none" && samePointSet(imagePoints(state), asPoints(target.image))
    );
  if (target.points) return samePointSet(state.points, asPoints(target.points));
  return false;
}

export const snapPoint = (p, step, range) => ({
  x: clamp(snapTo(p.x, step), rat(range.xmin), rat(range.xmax)),
  y: clamp(snapTo(p.y, step), rat(range.ymin), rat(range.ymax)),
});

export function withPoint(state, p) {
  if (state.points.length >= MAX_POINTS || state.points.some((q) => samePoint(q, p))) return state;
  let n = 1;
  while (state.points.some((q) => q.id === `p${n}`)) n += 1;
  return {
    ...state,
    points: [...state.points, { id: `p${n}`, x: p.x, y: p.y }],
    selected: `p${n}`,
  };
}
export function movedPoint(state, id, p) {
  const snapped = snapPoint(p, state.step, state.range);
  if (state.points.some((q) => q.id !== id && samePoint(q, snapped))) return state;
  return {
    ...state,
    points: state.points.map((q) => (q.id === id ? { id, ...snapped } : q)),
    selected: id,
  };
}
export function withoutPoint(state, id) {
  const points = state.points.filter((p) => p.id !== id);
  return { ...state, points, selected: points[0]?.id ?? null };
}

export const letter = (index) => String.fromCharCode(65 + (index % 26));

// The rule shown beside a transformation, written as an ordered-pair map with every constant worked out.
const MINUS = "−";
const coefText = (k, name) => {
  if (eq(k, ONE)) return name;
  if (eq(k, neg(ONE))) return `${MINUS}${name}`;
  const body = fmt(abs(k));
  return `${k.n < 0 ? MINUS : ""}${k.d === 1 ? body : `(${body})`}${name}`;
};
const linear = (k, name, c) => `${coefText(k, name)}${c.n === 0 ? "" : c.n < 0 ? ` ${MINUS} ${show(abs(c))}` : ` + ${show(c)}`}`;

export function ruleText(tr) {
  const arrow = "(x, y) → ";
  const one = ONE;
  const m = neg(ONE);
  switch (tr.type) {
    case "translate":
      return `${arrow}(${linear(one, "x", tr.dx)}, ${linear(one, "y", tr.dy)})`;
    case "reflect":
      return `${arrow}${{ x: "(x, −y)", y: "(−x, y)", "y=x": "(y, x)", "y=-x": "(−y, −x)" }[tr.axis]}`;
    case "rotate": {
      const { cx, cy } = tr;
      if (tr.angle === 90) return `${arrow}(${linear(m, "y", add(cx, cy))}, ${linear(one, "x", sub(cy, cx))})`;
      if (tr.angle === 180) return `${arrow}(${linear(m, "x", mul(rat(2), cx))}, ${linear(m, "y", mul(rat(2), cy))})`;
      return `${arrow}(${linear(one, "y", sub(cx, cy))}, ${linear(m, "x", add(cx, cy))})`;
    }
    case "dilate": {
      const keep = sub(ONE, tr.k);
      return `${arrow}(${linear(tr.k, "x", mul(tr.cx, keep))}, ${linear(tr.k, "y", mul(tr.cy, keep))})`;
    }
    default:
      return "";
  }
}
