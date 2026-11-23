// `cycle` (stages in a circle, arrows between, last leads back to first) and `flow` (linear steps with arrows,
// wrapping to a second row when crowded, or `vertical`). Each node carries a number badge so order never depends
// on position or colour alone.
import { VisualError, arrow, arrowHead, box, fitText, r1, seriesOf, textEl } from "./pal.js";
import { iconAt } from "./shapes.js";

function listOf(spec, key, min, max) {
  const list = spec[key];
  if (!Array.isArray(list) || list.length < min || list.length > max)
    throw new VisualError(`${spec.kind}: ${key} needs ${min} to ${max} entries`);
  for (const s of list)
    if (!s || s.label == null || s.label === "")
      throw new VisualError(`${spec.kind}: every entry needs a label`);
  return list;
}

/** One node: rounded box (centre cx,cy), optional icon on the left or top, label fitted, number badge on the corner. */
function node(c, st, i, cx, cy, nw, nh, { iconTop = false, tone = "surface" } = {}) {
  const ink = c.paint("ink");
  const x = cx - nw / 2;
  const y = cy - nh / 2;
  let out = box(x, y, nw, nh, { fill: c.paint(tone), stroke: ink, sw: 2.5, rx: 10 });
  const label = String(st.label);
  if (st.icon) {
    if (iconTop) {
      const is = Math.min(nh * 0.5, nw - 24, 56);
      out += iconAt(st.icon, cx - is / 2, y + 8, is);
      const f = fitText(label, nw - 14, { size: 15, min: 11, maxLines: 3, weight: 700 });
      out += textEl(cx, y + 8 + is + (nh - is - 8) / 2, f.lines, {
        size: f.size,
        fill: ink,
        weight: 700,
      });
    } else {
      const is = Math.min(nh - 14, 40);
      out += iconAt(st.icon, x + 8, cy - is / 2, is);
      const f = fitText(label, nw - is - 26, { size: 14, min: 10, maxLines: 3, weight: 700 });
      out += textEl(x + is + 16, cy, f.lines, {
        size: f.size,
        fill: ink,
        weight: 700,
        anchor: "start",
      });
    }
  } else {
    const f = fitText(label, nw - 18, { size: 16, min: 10, maxLines: 3, weight: 700 });
    out += textEl(cx, cy + 3, f.lines, { size: f.size, fill: ink, weight: 700 });
  }
  out += `<circle cx="${r1(x + 2)}" cy="${r1(y + 2)}" r="11" fill="${c.paint("navy")}" stroke="${c.paint("surface")}" stroke-width="2"/>`;
  out += textEl(x + 2, y + 2, String(i + 1), { size: 13, fill: c.on("navy"), weight: 700 });
  return out;
}

export function drawCycle(spec, { c, w, h }) {
  const stages = listOf(spec, "stages", 2, 8);
  const n = stages.length;
  const hasIcon = stages.some((s) => s.icon);
  const nw = n <= 4 ? 140 : n <= 6 ? 108 : 92;
  const nh = hasIcon ? 54 : 46;
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2 - nw / 2 - 14;
  const ry = h / 2 - nh / 2 - 12;
  const ink = c.paint("ink");
  const series = seriesOf(spec);
  // angle along the ellipse needed to leave a node's box (plus a small margin)
  const exitAngle = (a) =>
    Math.min(
      0.9,
      (nw / 2 + 8) / (rx * Math.abs(Math.sin(a)) + 1e-6),
      (nh / 2 + 8) / (ry * Math.abs(Math.cos(a)) + 1e-6),
    );
  const at = (a) => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  const ang = (i) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  let arrows = "";
  let nodes = "";
  for (let i = 0; i < n; i++) {
    const a0 = ang(i);
    const a1 = ang(i + 1);
    const s = a0 + exitAngle(a0);
    const e = a1 - exitAngle(a1);
    if (e > s) {
      const pts = Array.from({ length: 13 }, (_, k) => at(s + ((e - s) * k) / 12));
      arrows += `<path d="M${pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join("L")}" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
      const [px, py] = pts[12];
      const [qx, qy] = pts[11];
      arrows += arrowHead(px, py, Math.atan2(py - qy, px - qx), 11, ink);
    }
    const [x, y] = at(a0);
    nodes += node(c, stages[i], i, x, y, nw, nh, {
      tone: series[i % series.length] === "teal" ? "teal-soft" : "surface",
    });
  }
  return arrows + nodes;
}

export function drawFlow(spec, { c, w, h }) {
  const steps = listOf(spec, "steps", 2, 8);
  const n = steps.length;
  const hasIcon = steps.some((s) => s.icon);
  const ink = c.paint("ink");
  let out = "";
  if (spec.vertical) {
    const nh = Math.min(hasIcon ? 64 : 48, (h - 24 - (n - 1) * 22) / n);
    const nw = Math.min(w - 40, 340);
    const total = nh * n + (n - 1) * 22;
    let y = (h - total) / 2;
    for (let i = 0; i < n; i++) {
      out += node(c, steps[i], i, w / 2, y + nh / 2, nw, nh);
      if (i < n - 1)
        out += arrow(w / 2, y + nh + 2, w / 2, y + nh + 20, { stroke: ink, sw: 3, head: 10 });
      y += nh + 22;
    }
    return out;
  }
  const perRow = n <= 4 ? n : Math.ceil(n / 2);
  const rows = Math.ceil(n / perRow);
  const gap = 28;
  const nw = Math.min(150, (w - 32 - gap * (perRow - 1)) / perRow);
  const nh = Math.min(hasIcon ? 116 : 64, (h - 24 - (rows - 1) * 46) / rows);
  const rowY = (r) => (h - (nh * rows + 46 * (rows - 1))) / 2 + nh / 2 + r * (nh + 46);
  const colX = (k, count) => (w - (nw * count + gap * (count - 1))) / 2 + nw / 2 + k * (nw + gap);
  steps.forEach((st, i) => {
    const r = Math.floor(i / perRow);
    const k = i % perRow;
    const count = Math.min(perRow, n - r * perRow);
    const x = colX(k, count);
    const y = rowY(r);
    out += node(c, st, i, x, y, nw, nh, { iconTop: hasIcon });
    const last = k === count - 1;
    if (!last)
      out += arrow(x + nw / 2 + 2, y, x + nw / 2 + gap - 2, y, { stroke: ink, sw: 3, head: 10 });
    else if (i < n - 1) {
      const nx = colX(0, Math.min(perRow, n - (r + 1) * perRow));
      const my = y + nh / 2 + 23;
      out += `<path d="M${r1(x)} ${r1(y + nh / 2 + 2)}V${r1(my)}H${r1(nx)}V${r1(rowY(r + 1) - nh / 2 - 12)}" fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`;
      out += arrowHead(nx, rowY(r + 1) - nh / 2 - 2, Math.PI / 2, 11, ink);
    }
  });
  return out;
}
