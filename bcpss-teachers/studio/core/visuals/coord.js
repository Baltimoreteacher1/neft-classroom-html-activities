// `coord`: first-quadrant (or xmin/ymin-shifted) coordinate plane. points:[{x,y,label?}], lines:[{m,b,label?,dashed?}],
// grid (default true), connect (join the points in order). Points are circles with a ring; lines can be dashed,
// so graphs stay readable without colour.
import { VisualError, num, r1, textEl, arrowHead } from "./pal.js";

const fmt = (v) => String(Math.round(v * 1e6) / 1e6);

/** A tick step giving at most ~10 intervals on a span. */
function niceStep(span) {
  const raw = span / 10;
  const p = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5, 10]) if (m * p >= raw) return m * p;
  return 10 * p;
}

/** Clip y = m x + b to the box; returns [[x,y],[x,y]] or null. */
function clipLine(m, b, xmin, xmax, ymin, ymax) {
  const pts = [];
  const yAt = (x) => m * x + b;
  for (const x of [xmin, xmax]) {
    const y = yAt(x);
    if (y >= ymin - 1e-9 && y <= ymax + 1e-9) pts.push([x, y]);
  }
  if (m !== 0) {
    for (const y of [ymin, ymax]) {
      const x = (y - b) / m;
      if (x > xmin + 1e-9 && x < xmax - 1e-9) pts.push([x, y]);
    }
  }
  if (pts.length < 2) return null;
  pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  return [pts[0], pts[pts.length - 1]];
}

export function drawCoord(spec, { c, w, h }) {
  const xmin = num(spec.xmin, "coord: xmin", 0);
  const ymin = num(spec.ymin, "coord: ymin", 0);
  const xmax = num(spec.xmax, "coord: xmax");
  const ymax = num(spec.ymax, "coord: ymax");
  if (!(xmax > xmin) || !(ymax > ymin))
    throw new VisualError("coord: xmax and ymax must exceed xmin and ymin");
  const xs = num(spec.xStep, "coord: xStep", niceStep(xmax - xmin));
  const ys = num(spec.yStep, "coord: yStep", niceStep(ymax - ymin));
  if (!(xs > 0) || !(ys > 0)) throw new VisualError("coord: steps must be positive");
  const L = spec.yLabel ? 62 : 44;
  const B = spec.xLabel ? 58 : 38;
  const T = 20;
  const R = 26;
  const px0 = L;
  const px1 = w - R;
  const py0 = h - B;
  const py1 = T;
  const X = (v) => px0 + ((v - xmin) / (xmax - xmin)) * (px1 - px0);
  const Y = (v) => py0 - ((v - ymin) / (ymax - ymin)) * (py0 - py1);
  const ink = c.paint("ink");
  const grid = c.paint("line");
  const surface = c.paint("surface");
  let out = "";
  const showGrid = spec.grid !== false;
  const xn = Math.floor((xmax - xmin) / xs + 1e-9);
  const yn = Math.floor((ymax - ymin) / ys + 1e-9);
  for (let i = 0; i <= xn; i++) {
    const v = xmin + i * xs;
    if (showGrid)
      out += `<line x1="${r1(X(v))}" y1="${r1(py0)}" x2="${r1(X(v))}" y2="${r1(py1)}" stroke="${grid}" stroke-width="1"/>`;
    out += `<line x1="${r1(X(v))}" y1="${r1(py0)}" x2="${r1(X(v))}" y2="${r1(py0 + 6)}" stroke="${ink}" stroke-width="2"/>`;
    out += textEl(X(v), py0 + 19, fmt(v), { size: 13, fill: ink });
  }
  for (let i = 0; i <= yn; i++) {
    const v = ymin + i * ys;
    if (showGrid)
      out += `<line x1="${r1(px0)}" y1="${r1(Y(v))}" x2="${r1(px1)}" y2="${r1(Y(v))}" stroke="${grid}" stroke-width="1"/>`;
    out += `<line x1="${r1(px0 - 6)}" y1="${r1(Y(v))}" x2="${r1(px0)}" y2="${r1(Y(v))}" stroke="${ink}" stroke-width="2"/>`;
    out += textEl(px0 - 10, Y(v), fmt(v), { size: 13, fill: ink, anchor: "end" });
  }
  out += `<path d="M${r1(px0)} ${r1(py1 - 4)}V${r1(py0)}H${r1(px1 + 6)}" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
  out += arrowHead(px0, py1 - 10, -Math.PI / 2, 10, ink) + arrowHead(px1 + 12, py0, 0, 10, ink);
  if (spec.xLabel)
    out += textEl((px0 + px1) / 2, h - 12, String(spec.xLabel), {
      size: 15,
      fill: ink,
      weight: 700,
    });
  if (spec.yLabel)
    out += `<g transform="translate(16 ${r1((py0 + py1) / 2)}) rotate(-90)">${textEl(0, 0, String(spec.yLabel), { size: 15, fill: ink, weight: 700 })}</g>`;
  const teal = c.paint("teal");
  const coral = c.paint("coral");
  const lines = Array.isArray(spec.lines) ? spec.lines : [];
  lines.forEach((ln, i) => {
    const seg = clipLine(
      num(ln.m, "coord: line m"),
      num(ln.b, "coord: line b", 0),
      xmin,
      xmax,
      ymin,
      ymax,
    );
    if (!seg) return;
    const col = i % 2 ? coral : teal;
    out += `<line x1="${r1(X(seg[0][0]))}" y1="${r1(Y(seg[0][1]))}" x2="${r1(X(seg[1][0]))}" y2="${r1(Y(seg[1][1]))}" stroke="${col}" stroke-width="3.5" stroke-linecap="round"${ln.dashed ? ' stroke-dasharray="9 6"' : ""}/>`;
    if (ln.label != null) {
      const [ex, ey] = seg[1];
      out += textEl(Math.min(X(ex) - 6, px1 - 4), Y(ey) - 12, String(ln.label), {
        size: 14,
        fill: ink,
        weight: 700,
        anchor: "end",
        halo: surface,
      });
    }
  });
  const pts = Array.isArray(spec.points) ? spec.points : [];
  if (spec.connect && pts.length > 1)
    out += `<polyline points="${pts.map((p) => `${r1(X(num(p.x, "coord: point x")))},${r1(Y(num(p.y, "coord: point y")))}`).join(" ")}" fill="none" stroke="${ink}" stroke-width="2" stroke-dasharray="4 4"/>`;
  for (const p of pts) {
    const x = num(p.x, "coord: point x");
    const y = num(p.y, "coord: point y");
    if (x < xmin || x > xmax || y < ymin || y > ymax)
      throw new VisualError(`coord: point (${x}, ${y}) is outside the plane`);
    out += `<circle cx="${r1(X(x))}" cy="${r1(Y(y))}" r="6.5" fill="${ink}" stroke="${surface}" stroke-width="2.5"/>`;
    if (p.label != null)
      out += textEl(X(x) + 10, Y(y) - 12, String(p.label), {
        size: 14,
        fill: ink,
        weight: 700,
        anchor: "start",
        halo: surface,
      });
  }
  return out;
}
