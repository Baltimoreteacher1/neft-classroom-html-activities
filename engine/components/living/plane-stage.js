// living/plane-stage.js — the coordinate-plane stage shared by the plane-* plays.
//
// One persistent plane: grid, axes, tick labels, then three pools of reusable
// elements (points, segments, texts) that every scene MOVES instead of
// redrawing, and a keyboard-operable placer (steppers + arrow keys + tap).
// Coordinates here are always DATA coordinates; the layout converts to stage
// units, so the grid is drawn at an exact, equal scale on both axes.

import { svgEl } from "../../core/living-scene.js";
import { fmt, MINUS, pt } from "./plane-model.js";

export function planeLayout(r, W = 440) {
  const xs = r.xmax - r.xmin;
  const ys = r.ymax - r.ymin;
  const my = 26;
  const cell = Math.min((W - 60) / xs, 36);
  const left = (W - xs * cell) / 2;
  return {
    r,
    W,
    H: ys * cell + 2 * my,
    cell,
    px: (x) => left + (x - r.xmin) * cell,
    py: (y) => my + (r.ymax - y) * cell,
  };
}

const POINT_TONE = {
  main: { fill: "var(--lsx-x)", stroke: "var(--lsx-x-edge)", "stroke-dasharray": "none" },
  alt: { fill: "var(--lsx-u)", stroke: "var(--lsx-u-edge)", "stroke-dasharray": "none" },
  ghost: { fill: "var(--lsx-card)", stroke: "var(--lsx-lo)", "stroke-dasharray": "4 3" },
  ink: { fill: "var(--lsx-ink)", stroke: "var(--lsx-ink)", "stroke-dasharray": "none" },
};
const SEG_TONE = {
  hi: { stroke: "var(--lsx-hi)", "stroke-width": 5, "stroke-dasharray": "none" },
  lo: { stroke: "var(--lsx-lo)", "stroke-width": 5, "stroke-dasharray": "9 6" },
  thin: { stroke: "var(--lsx-muted)", "stroke-width": 3, "stroke-dasharray": "6 4" },
  poly: { stroke: "var(--lsx-ink)", "stroke-width": 3, "stroke-dasharray": "none" },
  ghost: { stroke: "var(--lsx-lo)", "stroke-width": 3, "stroke-dasharray": "4 4" },
};
const TEXT_FILL = {
  ink: "var(--lsx-ink)",
  hi: "var(--lsx-hi)",
  lo: "var(--lsx-lo)",
  muted: "var(--lsx-muted)",
};

const HALO = {
  stroke: "var(--lsx-card)",
  "stroke-width": 4,
  "paint-order": "stroke",
  "font-weight": 800,
};

/**
 * Draw the plane into `svg`. Returns the stage: layers, the three pools, the
 * quadrant labels and the tap surface.
 */
export function drawPlane(svg, lay, quadLabels = null) {
  svg.innerHTML = "";
  svg.setAttribute("viewBox", `0 0 ${lay.W} ${lay.H}`);
  const { r, cell, px, py } = lay;
  const base = svgEl("g", {}, svg);
  const line = (x1, y1, x2, y2, attrs) => svgEl("line", { x1, y1, x2, y2, ...attrs }, base);
  const every = cell >= 26 ? 1 : 2;
  for (let x = r.xmin; x <= r.xmax; x++)
    line(px(x), py(r.ymax), px(x), py(r.ymin), { stroke: "var(--lsx-rule)", "stroke-width": 1 });
  for (let y = r.ymin; y <= r.ymax; y++)
    line(px(r.xmin), py(y), px(r.xmax), py(y), { stroke: "var(--lsx-rule)", "stroke-width": 1 });
  const axis = { stroke: "var(--lsx-ink)", "stroke-width": 2.5 };
  line(px(r.xmin), py(0), px(r.xmax), py(0), axis);
  line(px(0), py(r.ymax), px(0), py(r.ymin), axis);
  const head = (pts) => svgEl("polygon", { points: pts, fill: "var(--lsx-ink)" }, base);
  head(`${px(r.xmax) + 10},${py(0)} ${px(r.xmax)},${py(0) - 5} ${px(r.xmax)},${py(0) + 5}`);
  head(`${px(0)},${py(r.ymax) - 10} ${px(0) - 5},${py(r.ymax)} ${px(0) + 5},${py(r.ymax)}`);
  const label = (x, y, text, attrs = {}) =>
    svgEl(
      "text",
      { x, y, text, "font-size": 13, fill: "var(--lsx-muted)", "text-anchor": "middle", ...attrs },
      base,
    );
  for (let x = r.xmin; x <= r.xmax; x++) {
    if (x === 0 || x % every) continue;
    line(px(x), py(0) - 4, px(x), py(0) + 4, axis);
    label(px(x), py(0) + 17, x < 0 ? MINUS + -x : x);
  }
  for (let y = r.ymin; y <= r.ymax; y++) {
    if (y === 0 || y % every) continue;
    line(px(0) - 4, py(y), px(0) + 4, py(y), axis);
    label(px(0) - 8, py(y) + 4, y < 0 ? MINUS + -y : y, { "text-anchor": "end" });
  }
  label(px(0) - 8, py(0) + 17, "0", { "text-anchor": "end" });
  label(px(r.xmax) + 20, py(0) + 5, "x", {
    "font-size": 16,
    "font-weight": 800,
    fill: "var(--lsx-ink)",
  });
  label(px(0) + 14, py(r.ymax) - 5, "y", {
    "font-size": 16,
    "font-weight": 800,
    fill: "var(--lsx-ink)",
    "text-anchor": "start",
  });

  const q = quadLabels ? svgEl("g", {}, svg) : null;
  const qEls = [];
  if (q) {
    const spots = [
      [px(r.xmax) - 8, py(r.ymax) + 20, "end"],
      [px(r.xmin) + 8, py(r.ymax) + 20, "start"],
      [px(r.xmin) + 8, py(r.ymin) - 22, "start"],
      [px(r.xmax) - 8, py(r.ymin) - 22, "end"],
    ];
    quadLabels.forEach((t, i) => {
      const [x, y, anchor] = spots[i];
      qEls.push(
        svgEl(
          "text",
          {
            x,
            y,
            text: t[0],
            "text-anchor": anchor,
            opacity: 0,
            "font-size": 15,
            "font-weight": 800,
            fill: "var(--lsx-muted)",
            ...HALO,
          },
          q,
        ),
        svgEl(
          "text",
          {
            x,
            y: y + 17,
            text: t[1],
            "text-anchor": anchor,
            opacity: 0,
            "font-size": 14,
            "font-weight": 700,
            fill: "var(--lsx-muted)",
            ...HALO,
          },
          q,
        ),
      );
    });
  }
  const segG = svgEl("g", {}, svg);
  const ptG = svgEl("g", {}, svg);
  const txtG = svgEl("g", {}, svg);
  const cursorG = svgEl("g", { opacity: 0 }, svg);
  const hit = svgEl(
    "rect",
    {
      x: px(r.xmin),
      y: py(r.ymax),
      width: (r.xmax - r.xmin) * cell,
      height: (r.ymax - r.ymin) * cell,
      fill: "transparent",
    },
    svg,
  );
  hit.style.pointerEvents = "none";
  const stage = { lay, svg, q, qEls, cursorG, hit };
  Object.assign(stage, makePools({ segG, ptG, txtG }, lay));
  return stage;
}

function growing(parent, make) {
  const items = [];
  return (i) => {
    while (items.length <= i) items.push(make(parent));
    return items[i];
  };
}

/** Where a point's label sits so it stays inside the stage. */
function labelSpot(lay, cx, cy, text, below = false) {
  const w = String(text).length * 7.4 + 12;
  const left = cx + 11 + w > lay.W - 4;
  return {
    x: left ? cx - 11 : cx + 11,
    y: below || cy - 9 < 14 ? cy + 19 : cy - 9,
    anchor: left ? "end" : "start",
  };
}

function makePools(groups, lay) {
  const { px, py } = lay;
  const dotAt = growing(groups.ptG, (g) => ({
    c: svgEl("circle", { cx: 0, cy: 0, r: 7, opacity: 0, "stroke-width": 2.5 }, g),
    t: svgEl(
      "text",
      { x: 0, y: 0, opacity: 0, "font-size": 14, fill: "var(--lsx-ink)", ...HALO },
      g,
    ),
  }));
  const segAt = growing(groups.segG, (g) =>
    svgEl("line", { x1: 0, y1: 0, x2: 0, y2: 0, opacity: 0, "stroke-linecap": "round" }, g),
  );
  const txtAt = growing(groups.txtG, (g) =>
    svgEl("text", { x: 0, y: 0, opacity: 0, "font-size": 14, ...HALO }, g),
  );
  const counts = { pts: 0, segs: 0, txt: 0 };
  const spot = (el, attrs) => {
    // A freshly shown element appears in place rather than flying in from its last spot.
    if (Number(el.getAttribute("opacity")) === 0)
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  };

  /**
   * spec = { pts: [{i, x, y, label?, tone?, r?, lx?, ly?, anchor?}],
   *          segs: [{i, a:{x,y}, b:{x,y}, tone?}],
   *          txt: [{i, x, y, dx?, dy?, text, tone?, anchor?, size?}] }
   * Elements of the same index keep their identity between calls; anything not
   * named is hidden. Returns the tween moves.
   */
  function moves(spec) {
    const m = [];
    const pts = spec.pts || [];
    const segs = spec.segs || [];
    const txt = spec.txt || [];
    for (const p of pts) {
      const d = dotAt(p.i);
      const cx = px(p.x);
      const cy = py(p.y);
      spot(d.c, { cx, cy });
      m.push([d.c, { cx, cy, r: p.r || 7, opacity: 1, ...POINT_TONE[p.tone || "main"] }]);
      const text = p.label || "";
      const s =
        p.lx != null
          ? { x: cx + p.lx, y: cy + p.ly, anchor: p.anchor || "start" }
          : labelSpot(lay, cx, cy, text, p.y < 0 && p.y >= -1.5);
      d.t.setAttribute("text-anchor", s.anchor);
      const at = { x: s.x, y: s.y };
      spot(d.t, at);
      m.push([d.t, { ...at, opacity: text ? 1 : 0, text }]);
    }
    for (let i = 0; i < counts.pts || i < pts.length; i++) {
      if (pts.some((p) => p.i === i)) continue;
      const d = dotAt(i);
      m.push([d.c, { opacity: 0 }], [d.t, { opacity: 0 }]);
    }
    counts.pts = Math.max(counts.pts, pts.length, ...pts.map((p) => p.i + 1));
    for (const s of segs) {
      const el = segAt(s.i);
      const at = { x1: px(s.a.x), y1: py(s.a.y), x2: px(s.b.x), y2: py(s.b.y) };
      spot(el, at);
      m.push([el, { ...at, opacity: 1, ...SEG_TONE[s.tone || "hi"] }]);
    }
    for (let i = 0; i < counts.segs || i < segs.length; i++)
      if (!segs.some((s) => s.i === i)) m.push([segAt(i), { opacity: 0 }]);
    counts.segs = Math.max(counts.segs, ...segs.map((s) => s.i + 1), 0);
    for (const t of txt) {
      const el = txtAt(t.i);
      const at = { x: px(t.x) + (t.dx || 0), y: py(t.y) + (t.dy || 0) };
      el.setAttribute("text-anchor", t.anchor || "middle");
      el.setAttribute("font-size", String(t.size || 14));
      el.setAttribute("fill", TEXT_FILL[t.tone || "ink"]);
      spot(el, at);
      m.push([el, { ...at, opacity: 1, text: t.text }]);
    }
    for (let i = 0; i < counts.txt || i < txt.length; i++)
      if (!txt.some((t) => t.i === i)) m.push([txtAt(i), { opacity: 0 }]);
    counts.txt = Math.max(counts.txt, ...txt.map((t) => t.i + 1), 0);
    return m;
  }
  return { moves };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * A point placer: a crosshair on the plane the student moves with ± steppers,
 * the arrow keys (Shift = whole units) or a tap on the grid. `onPlace(p)` runs
 * when they press the place button. Returns { el, pos, lock, destroy }.
 */
export function makePlacer(ctx, stage, { step = 1, start = { x: 0, y: 0 }, placeLabel, onPlace }) {
  const { lay, cursorG, hit } = stage;
  const { r } = lay;
  let p = { x: clamp(start.x, r.xmin, r.xmax), y: clamp(start.y, r.ymin, r.ymax) };
  let locked = false;
  cursorG.innerHTML = "";
  const guide = { stroke: "var(--lsx-lo)", "stroke-width": 2, "stroke-dasharray": "5 4" };
  const vl = svgEl("line", guide, cursorG);
  const hl = svgEl("line", guide, cursorG);
  const ring = svgEl(
    "circle",
    { r: 10, fill: "none", stroke: "var(--lsx-ink)", "stroke-width": 3, "stroke-dasharray": "5 3" },
    cursorG,
  );
  const tag = svgEl("text", { "font-size": 14, fill: "var(--lsx-ink)", ...HALO }, cursorG);
  const outs = {};

  const paint = () => {
    const cx = lay.px(p.x);
    const cy = lay.py(p.y);
    vl.setAttribute("x1", String(cx));
    vl.setAttribute("x2", String(cx));
    vl.setAttribute("y1", String(cy));
    vl.setAttribute("y2", String(lay.py(0)));
    hl.setAttribute("y1", String(cy));
    hl.setAttribute("y2", String(cy));
    hl.setAttribute("x1", String(cx));
    hl.setAttribute("x2", String(lay.px(0)));
    ring.setAttribute("cx", String(cx));
    ring.setAttribute("cy", String(cy));
    const s = labelSpot(lay, cx, cy + 22, pt(p));
    tag.setAttribute("x", String(s.x));
    tag.setAttribute("y", String(s.y));
    tag.setAttribute("text-anchor", s.anchor);
    tag.textContent = pt(p);
    outs.x.textContent = `x = ${fmt(p.x)}`;
    outs.y.textContent = `y = ${fmt(p.y)}`;
  };
  const set = (x, y) => {
    if (locked) return;
    p = {
      x: clamp(Math.round(x / step) * step, r.xmin, r.xmax),
      y: clamp(Math.round(y / step) * step, r.ymin, r.ymax),
    };
    paint();
  };
  const nudge = (axis, d) => set(p.x + (axis === "x" ? d : 0), p.y + (axis === "y" ? d : 0));

  const wrap = document.createElement("div");
  wrap.className = "lsx-panel";
  const es = ctx.lang === "es";
  const dirs = {
    x: [es ? "a la izquierda" : "left", es ? "a la derecha" : "right", "←", "→"],
    y: [es ? "hacia abajo" : "down", es ? "hacia arriba" : "up", "↓", "↑"],
  };
  const sizes = step < 1 ? [1, step] : [step];
  for (const axis of ["x", "y"]) {
    const row = document.createElement("div");
    row.className = "lsx-range";
    row.style.gap = "4px";
    const [minus, plus, la, ra] = dirs[axis];
    const mk = (dir, amt) => {
      const b = ctx.button({
        label: dir < 0 ? `${la} ${fmt(amt)}` : `${fmt(amt)} ${ra}`,
        onClick: () => nudge(axis, dir * amt),
      });
      b.style.padding = "8px 8px"; // four steppers per row must fit a phone
      b.setAttribute("aria-label", `${axis}: ${fmt(amt)} ${dir < 0 ? minus : plus}`);
      return b;
    };
    const out = document.createElement("output");
    out.style.minWidth = "0";
    out.style.fontSize = "1rem";
    outs[axis] = out;
    for (const a of sizes) row.appendChild(mk(-1, a));
    row.appendChild(out);
    for (const a of [...sizes].reverse()) row.appendChild(mk(1, a));
    wrap.appendChild(row);
  }
  const place = ctx.button({
    label: placeLabel,
    primary: true,
    onClick: () => !locked && onPlace({ ...p }),
  });
  wrap.appendChild(place);
  wrap.addEventListener("keydown", (e) => {
    const k = {
      ArrowLeft: ["x", -1],
      ArrowRight: ["x", 1],
      ArrowDown: ["y", -1],
      ArrowUp: ["y", 1],
    }[e.key];
    if (!k || locked) return;
    e.preventDefault();
    nudge(k[0], k[1] * (e.shiftKey ? 1 : step));
  });
  hit.style.pointerEvents = "all";
  hit.style.cursor = "crosshair";
  hit.onclick = (e) => {
    const box = stage.svg.getBoundingClientRect();
    const sx = ((e.clientX - box.left) / box.width) * lay.W;
    const sy = ((e.clientY - box.top) / box.height) * lay.H;
    set(r.xmin + (sx - lay.px(r.xmin)) / lay.cell, r.ymax - (sy - lay.py(r.ymax)) / lay.cell);
  };
  cursorG.setAttribute("opacity", "1");
  paint();
  return {
    el: wrap,
    pos: () => ({ ...p }),
    lock() {
      locked = true;
      for (const b of wrap.querySelectorAll("button")) b.disabled = true;
      hit.style.pointerEvents = "none";
      hit.onclick = null;
      cursorG.setAttribute("opacity", "0");
    },
    destroy: () => stopPlacer(stage),
  };
}

/** Hide the crosshair and stop taps; every scene calls this on entry. */
export function stopPlacer(stage) {
  stage.cursorG.setAttribute("opacity", "0");
  stage.hit.style.pointerEvents = "none";
  stage.hit.onclick = null;
}
