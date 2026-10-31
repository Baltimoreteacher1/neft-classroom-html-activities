// Drawing and working text for the geometry shape and classify tools. Pure: state in, SVG parts, handles and
// readout lines out. Learner-facing words go through t().
import { s, t } from "./b-core.js";
import * as G from "./geometry-math.js";

const PAD = 24;
const letter = (i) => String.fromCharCode(65 + i);
const lenText = (p, q) => {
  const { k, r } = G.sqrtForm(G.len2(G.sub(q, p)));
  return r === 1 ? String(k) : `${k === 1 ? "" : k}√${r}`;
};

export function layout(width, grid) {
  const u = Math.min(48, (width - 2 * PAD) / grid.w, 440 / grid.h);
  const ox = Math.max(PAD, (width - grid.w * u) / 2);
  return {
    u,
    height: Math.round(grid.h * u + 2 * PAD),
    px: (x) => ox + x * u,
    py: (y) => PAD + (grid.h - y) * u,
    fromPoint: (pt) => ({ x: (pt.x - ox) / u, y: grid.h - (pt.y - PAD) / u }),
  };
}

function drawGrid(parts, grid, lay) {
  parts.push(
    s("rect", {
      class: "gb-gridbg",
      x: lay.px(0),
      y: lay.py(grid.h),
      width: grid.w * lay.u,
      height: grid.h * lay.u,
    }),
  );
  for (let x = 0; x <= grid.w; x += 1)
    parts.push(
      s("line", {
        class: "gb-gridline",
        x1: lay.px(x),
        x2: lay.px(x),
        y1: lay.py(0),
        y2: lay.py(grid.h),
      }),
    );
  for (let y = 0; y <= grid.h; y += 1)
    parts.push(
      s("line", {
        class: "gb-gridline",
        y1: lay.py(y),
        y2: lay.py(y),
        x1: lay.px(0),
        x2: lay.px(grid.w),
      }),
    );
}

function edgeLabels(parts, verts, lay) {
  const cx = verts.reduce((a, p) => a + p.x, 0) / verts.length;
  const cy = verts.reduce((a, p) => a + p.y, 0) / verts.length;
  for (const [p, q] of G.edges(verts)) {
    const mx = (p.x + q.x) / 2;
    const my = (p.y + q.y) / 2;
    const dx = lay.px(mx) - lay.px(cx);
    const dy = lay.py(my) - lay.py(cy);
    const norm = Math.hypot(dx, dy) || 1;
    parts.push(
      s("text", {
        class: "gb-edgelabel",
        x: lay.px(mx) + (dx / norm) * 16,
        y: lay.py(my) + (dy / norm) * 16 + 4,
        "text-anchor": "middle",
        text: lenText(p, q),
      }),
    );
  }
}

const poly = (verts, lay, cls) =>
  s("polygon", { class: cls, points: verts.map((p) => `${lay.px(p.x)},${lay.py(p.y)}`).join(" ") });
function handles(verts, lay, prefix) {
  const cx = verts.reduce((a, p) => a + lay.px(p.x), 0) / verts.length;
  const cy = verts.reduce((a, p) => a + lay.py(p.y), 0) / verts.length;
  return verts.map((p, i) => {
    const x = lay.px(p.x);
    const y = lay.py(p.y);
    const norm = Math.hypot(x - cx, y - cy) || 1;
    return {
      id: `${prefix}${i}`,
      x,
      y,
      lx: ((x - cx) / norm) * 19,
      ly: ((y - cy) / norm) * 19 + 5,
      label: letter(i),
      aria: t("Vertex {name} at ({x}, {y}). Arrow keys move it one square.", { name: letter(i), x: p.x, y: p.y }),
    };
  });
}

function heightLine(parts, shape, v, lay) {
  const m = G.measures(shape, v).parts;
  if (!m) return;
  const dash = (x1, y1, x2, y2) =>
    parts.push(
      s("line", {
        class: "gb-height",
        x1: lay.px(x1),
        y1: lay.py(y1),
        x2: lay.px(x2),
        y2: lay.py(y2),
      }),
    );
  if (shape === "parallelogram" || shape === "trapezoid") {
    dash(v[3].x, v[3].y, v[3].x, v[0].y);
    parts.push(
      s("text", {
        class: "gb-edgelabel",
        x: lay.px(v[3].x) + 6,
        y: lay.py((v[3].y + v[0].y) / 2) + 4,
        text: `h = ${m.h}`,
      }),
    );
  } else if (shape === "triangle" && m) {
    const horizontal = v.findIndex((p, i) => p.y === v[(i + 1) % 3].y);
    if (horizontal >= 0) {
      const o = v[(horizontal + 2) % 3];
      dash(o.x, o.y, o.x, v[horizontal].y);
      parts.push(
        s("text", {
          class: "gb-edgelabel",
          x: lay.px(o.x) + 6,
          y: lay.py((o.y + v[horizontal].y) / 2) + 4,
          text: `h = ${m.h}`,
        }),
      );
    }
  } else if (shape === "composite") {
    dash(v[3].x, v[3].y, v[0].x, v[3].y);
  }
}

export function formulas(shape, v) {
  const m = G.measures(shape, v);
  const p = m.parts;
  const A = m.area;
  const value =
    A.d === 1 ? String(A.n) : `${A.n / A.d}`.length < 6 ? String(A.n / A.d) : `${A.n}/${A.d}`;
  let working;
  if (shape === "rectangle" || shape === "parallelogram") working = `b × h = ${p.b} × ${p.h}`;
  else if (shape === "trapezoid") working = `½ × (b₁ + b₂) × h = ½ × (${p.b1} + ${p.b2}) × ${p.h}`;
  else if (shape === "composite")
    working = `${p.a} × ${p.b} + ${p.c} × (${p.d} − ${p.b}) = ${p.a * p.b} + ${p.c * (p.d - p.b)}`;
  else if (p) working = `½ × b × h = ½ × ${p.b} × ${p.h}`;
  else working = `½ × |${G.area2(v)}|`;
  const per = m.perimeter;
  const sides = G.edges(v)
    .map(([a, b]) => lenText(a, b))
    .join(" + ");
  const approx = per.terms.length ? ` ≈ ${G.perimeterNumber(per).toFixed(2)}` : "";
  return {
    area: `${working} = ${value}`,
    perimeter: `${sides} = ${G.perimeterText(per)}${approx}`,
  };
}

export function drawShape(state, lay) {
  const parts = [];
  const v = state.verts;
  drawGrid(parts, state.grid, lay);
  parts.push(poly(v, lay, "gb-poly"));
  heightLine(parts, state.shape, v, lay);
  edgeLabels(parts, v, lay);
  return { parts, handles: handles(v, lay, "v") };
}

function rightAngles(parts, v, lay) {
  const n = v.length;
  for (let i = 0; i < n; i += 1) {
    const p = v[i];
    const a = G.sub(v[(i + n - 1) % n], p);
    const b = G.sub(v[(i + 1) % n], p);
    if (G.dot(a, b) !== 0) continue;
    const la = Math.hypot(a.x, a.y);
    const lb = Math.hypot(b.x, b.y);
    const ua = { x: a.x / la, y: a.y / la };
    const ub = { x: b.x / lb, y: b.y / lb };
    const k = 0.35;
    const pt = (dx, dy) => `${lay.px(p.x + dx)},${lay.py(p.y + dy)}`;
    parts.push(
      s("polyline", {
        class: "gb-rightmark",
        points: `${pt(ua.x * k, ua.y * k)} ${pt((ua.x + ub.x) * k, (ua.y + ub.y) * k)} ${pt(ub.x * k, ub.y * k)}`,
      }),
    );
  }
}

function equalTicks(parts, v, lay) {
  const lens = G.edges(v).map(([p, q]) => G.len2(G.sub(q, p)));
  const groups = [...new Set(lens)].filter((l) => lens.filter((x) => x === l).length > 1);
  G.edges(v).forEach(([p, q], i) => {
    const count = groups.indexOf(lens[i]) + 1;
    if (!count) return;
    const mx = lay.px((p.x + q.x) / 2);
    const my = lay.py((p.y + q.y) / 2);
    const dx = lay.px(q.x) - lay.px(p.x);
    const dy = lay.py(q.y) - lay.py(p.y);
    const n = Math.hypot(dx, dy) || 1;
    for (let k = 0; k < count; k += 1) {
      const off = (k - (count - 1) / 2) * 6;
      const cx = mx + (dx / n) * off;
      const cy = my + (dy / n) * off;
      parts.push(
        s("line", {
          class: "gb-equaltick",
          x1: cx - (dy / n) * 7,
          y1: cy + (dx / n) * 7,
          x2: cx + (dy / n) * 7,
          y2: cy - (dx / n) * 7,
        }),
      );
    }
  });
}

export function drawClassify(state, lay) {
  const parts = [];
  const v = state.cverts;
  drawGrid(parts, state.grid, lay);
  parts.push(poly(v, lay, "gb-poly"));
  rightAngles(parts, v, lay);
  equalTicks(parts, v, lay);
  edgeLabels(parts, v, lay);
  return { parts, handles: handles(v, lay, "c") };
}

export const className = (name) =>
  ({
    quadrilateral: t("quadrilateral"),
    trapezoid: t("trapezoid"),
    parallelogram: t("parallelogram"),
    rectangle: t("rectangle"),
    rhombus: t("rhombus"),
    square: t("square"),
    kite: t("kite"),
    equilateral: t("equilateral"),
    isosceles: t("isosceles"),
    scalene: t("scalene"),
    right: t("right"),
    acute: t("acute"),
    obtuse: t("obtuse"),
  })[name];

export function classifyLines(v, reveal) {
  const lines = [];
  if (v.length === 3) {
    const c = G.classifyTriangle(v);
    if (reveal)
      lines.push(
        t("This triangle is {sides} and {angles}.", {
          sides: className(c.bySides),
          angles: className(c.byAngles),
        }),
      );
  } else {
    const c = G.classifyQuad(v);
    if (reveal) {
      lines.push(t("Best name: {name}.", { name: className(c.best) }));
      lines.push(
        t("It also fits: {list}.", {
          list:
            c.classes
              .filter((n) => n !== c.best && n !== "quadrilateral")
              .map(className)
              .join(", ") || t("no other names"),
        }),
      );
    }
  }
  const n = v.length;
  const e = G.edges(v).map(([p, q]) => G.sub(q, p));
  const side = (i) => `${letter(i)}${letter((i + 1) % n)}`;
  const parallel = [];
  const equal = [];
  for (let i = 0; i < n; i += 1)
    for (let j = i + 1; j < n; j += 1) {
      const adjacent = j === (i + 1) % n || i === (j + 1) % n;
      if (!adjacent && G.cross(e[i], e[j]) === 0) parallel.push(`${side(i)} \u2225 ${side(j)}`);
      if (G.len2(e[i]) === G.len2(e[j])) equal.push(`${side(i)} = ${side(j)}`);
    }
  const right = v.map((_, i) => i).filter((i) => G.dot(G.sub(v[(i + n - 1) % n], v[i]), G.sub(v[(i + 1) % n], v[i])) === 0).map(letter);
  if (parallel.length) lines.push(t("Parallel sides: {list}.", { list: parallel.join(", ") }));
  if (equal.length) lines.push(t("Equal sides: {list}.", { list: equal.join(", ") }));
  if (right.length) lines.push(t("Right angles at: {list}.", { list: right.join(", ") }));
  if (!parallel.length && !equal.length && !right.length) lines.push(t("No parallel sides, equal sides or right angles yet."));
  return lines;
}
export { letter };
