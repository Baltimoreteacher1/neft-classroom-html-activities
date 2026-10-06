// Authored figures for the small-group "Build the idea" examples.
//
// Every figure is DRAWN FROM A SPEC the lesson author wrote beside the example
// (data/small-group-build/<lesson>.json → figure), never inferred from the
// step text. The old approach parsed "a × b = c" out of prose and drew a
// rectangle, so a ratio scale factor became an area model, two areas being
// added became a number-line jump, and the ordered pair (1, 45) became a solid
// block. tools/lib/small-group-build-figure-rules.mjs validates every spec, so
// these functions only draw — they never guess.
//
// Pure string builders (no DOM), so node tests can render every figure on disk.
// Graph-like kinds live here; shapes, solids, bars and tables live in
// small-group-build-figures-shapes.js.

import { esc, fmt, mathHtml, svg, text, textWidth } from "./small-group-build-figure-kit.js";
import { SHAPE_FIGURE_CSS, SHAPE_FIGURES } from "./small-group-build-figures-shapes.js";

/** Choose a label interval so at most ~12 tick labels print. */
function labelInterval(min, max, step, requested) {
  if (requested) return requested;
  const ticks = Math.round((max - min) / step);
  return step * Math.max(1, Math.ceil(ticks / 12));
}

const onMultiple = (v, base, every) =>
  Math.abs(((v - base) / every) % 1) < 1e-6 || Math.abs(((v - base) / every) % 1) > 1 - 1e-6;

/** A horizontal axis with ticks; returns { body, x } where x(value) maps to px. */
function axis({ x0, x1, y, min, max, step, labelEvery, arrows = false }) {
  const x = (v) => x0 + ((v - min) / (max - min)) * (x1 - x0);
  const every = labelInterval(min, max, step, labelEvery);
  let body = `<line class="sgf-axis" x1="${x0 - (arrows ? 14 : 0)}" y1="${y}" x2="${x1 + (arrows ? 14 : 0)}" y2="${y}"/>`;
  if (arrows) {
    body += `<path class="sgf-axis-head" d="M${x0 - 20},${y} l9,-6 v12 z"/>`;
    body += `<path class="sgf-axis-head" d="M${x1 + 20},${y} l-9,-6 v12 z"/>`;
  }
  const count = Math.round((max - min) / step);
  for (let i = 0; i <= count; i++) {
    const v = min + i * step;
    const major = onMultiple(v, min, every);
    body += `<line class="sgf-tick" x1="${x(v).toFixed(1)}" y1="${y - (major ? 7 : 4)}" x2="${x(v).toFixed(1)}" y2="${y + (major ? 7 : 4)}"/>`;
    if (major) body += text(x(v), y + 26, fmt(v), "sgf-t sgf-num");
  }
  return { body, x };
}

/** Spread labels that would collide: returns a row index (0, 1, …) per item. */
function stagger(xs, minGap = 46) {
  const rows = [];
  const order = xs.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]);
  const lastX = [];
  for (const [x, i] of order) {
    let r = 0;
    while (lastX[r] !== undefined && x - lastX[r] < minGap) r++;
    lastX[r] = x;
    rows[i] = r;
  }
  return rows;
}

/** Arc level per jump: 0 for the shortest, one more than any shorter overlapping jump. */
function jumpLevels(jumps, x) {
  const spans = jumps.map((j) => [Math.min(x(j.from), x(j.to)), Math.max(x(j.from), x(j.to))]);
  const order = spans
    .map((_, i) => i)
    .sort((p, q) => spans[p][1] - spans[p][0] - (spans[q][1] - spans[q][0]));
  const level = [];
  for (const i of order) {
    let l = 0;
    for (const k of order) {
      if (level[k] === undefined || k === i) continue;
      const overlap = spans[k][0] < spans[i][1] - 2 && spans[k][1] > spans[i][0] + 2;
      if (overlap) l = Math.max(l, level[k] + 1);
    }
    level[i] = l;
  }
  return level;
}

function dotPlot(f) {
  const step = f.step || 1;
  const W = 560;
  const counts = new Map();
  for (const v of f.values) counts.set(v, (counts.get(v) || 0) + 1);
  const tall = Math.max(...counts.values());
  // Dots may never overlap sideways: size them to the closest pair of values.
  const distinct = [...counts.keys()].sort((p, q) => p - q);
  const pxPerUnit = (W - 68) / (f.max - f.min);
  const gap =
    distinct.length > 1
      ? Math.min(...distinct.slice(1).map((v, k) => v - distinct[k]))
      : f.max - f.min;
  const r = Math.max(4, Math.min(9, (gap * pxPerUnit) / 2 - 1));
  const top = f.mark ? 34 : 14;
  const y = top + tall * (2 * r + 4) + 10;
  const H = y + 58;
  const a = axis({ x0: 34, x1: W - 34, y, min: f.min, max: f.max, step });
  let body = a.body;
  const seen = new Map();
  for (const v of [...f.values].sort((p, q) => p - q)) {
    const k = seen.get(v) || 0;
    seen.set(v, k + 1);
    const on = f.mark && f.mark.value === v;
    body += `<circle class="${on ? "sgf-dot sgf-on" : "sgf-dot"}" cx="${a.x(v).toFixed(1)}" cy="${(y - 12 - k * (2 * r + 4)).toFixed(1)}" r="${r}"/>`;
  }
  if (f.mark) {
    const k = counts.get(f.mark.value) || 0;
    if (!k) body += `<path class="sgf-marker" d="M${a.x(f.mark.value)},${y - 14} l-7,-12 h14 z"/>`;
    // Above the tallest stack, so the label never lands on a dot.
    const my = Math.min(y - 12 - tall * (2 * r + 4) - 4, y - 34);
    body += text(a.x(f.mark.value), my, f.mark.text || fmt(f.mark.value), "sgf-t sgf-callout");
  }
  body += text(W / 2, H - 6, f.label, "sgf-t sgf-axis-title");
  return svg(W, H, body, `Dot plot of ${f.values.map(fmt).join(", ")}`);
}

function numberLine(f) {
  const W = 580;
  const points = f.points || [];
  const jumps = f.jumps || [];
  const tmp = axis({ x0: 40, x1: W - 40, y: 0, min: f.min, max: f.max, step: f.step });
  const rows = stagger(
    points.map((p) => tmp.x(p.value)),
    54,
  );
  const labelRows = Math.max(0, ...rows.filter((_, i) => points[i].text).map((r) => r + 1));
  // With jumps, the arcs own the space above the line, so point labels move
  // under the tick numbers instead of printing on the arcs.
  const below = jumps.length > 0;
  const jumpRowsMax = Math.max(0, ...jumpLevels(jumps, tmp.x));
  const top = 16 + (jumps.length ? 46 + 26 * jumpRowsMax : 0) + (below ? 0 : labelRows * 24);
  const y = top + 18;
  const H = y + 44 + (below ? labelRows * 24 + 6 : 0);
  const a = axis({
    x0: 40,
    x1: W - 40,
    y,
    min: f.min,
    max: f.max,
    step: f.step,
    labelEvery: f.labelEvery,
    arrows: true,
  });
  let body = a.body;
  if (f.ray) {
    const end = f.ray.dir === "right" ? W - 22 : 22;
    body += `<line class="sgf-ray" x1="${a.x(f.ray.from)}" y1="${y}" x2="${end}" y2="${y}"/>`;
    body += `<path class="sgf-ray-head" d="M${end},${y} l${f.ray.dir === "right" ? -12 : 12},-8 v16 z"/>`;
    body += `<circle class="${f.ray.open ? "sgf-pt sgf-open" : "sgf-pt sgf-on"}" cx="${a.x(f.ray.from)}" cy="${y}" r="8"/>`;
  }
  // Nested or overlapping jumps: a longer jump arcs over a shorter one, so
  // the arcs never cross and each label sits clear at its own apex.
  const jumpRows = jumpLevels(jumps, a.x);
  jumps.forEach((j, n) => {
    const x1 = a.x(j.from);
    const x2 = a.x(j.to);
    const h = Math.min(42, 14 + Math.abs(x2 - x1) / 4) + jumpRows[n] * 26;
    body += `<path class="sgf-jump" d="M${x1},${y - 6} Q${(x1 + x2) / 2},${y - 6 - 2 * h} ${x2},${y - 6}"/>`;
    body += `<path class="sgf-jump-head" d="M${x2},${y - 6} l${x2 > x1 ? -9 : 9},-6 l${x2 > x1 ? 2 : -2},9 z"/>`;
    if (j.text) body += text((x1 + x2) / 2, y - 12 - h, j.text, "sgf-t sgf-callout");
  });
  points.forEach((p, i) => {
    body += `<circle class="${p.open ? "sgf-pt sgf-open" : "sgf-pt"}" cx="${a.x(p.value)}" cy="${y}" r="7"/>`;
    if (p.text)
      body += text(
        a.x(p.value),
        below ? y + 52 + rows[i] * 24 : y - 16 - rows[i] * 24,
        p.text,
        "sgf-t sgf-callout",
      );
  });
  const what = points.map((p) => (p.text ? `${p.text} at ${fmt(p.value)}` : fmt(p.value)));
  return svg(
    W,
    H,
    body,
    `Number line from ${fmt(f.min)} to ${fmt(f.max)}${what.length ? `: ${what.join(", ")}` : ""}`,
  );
}

function doubleNumberLine(f) {
  const L0 = Math.max(110, textWidth(f.top.label, 14) + 26, textWidth(f.bottom.label, 14) + 26);
  const W = L0 + 430;
  const n = f.top.values.length;
  const nums = f.top.values.map(Number);
  const proportional = nums.every((v) => Number.isFinite(v) && v >= 0);
  const hi = Math.max(...nums);
  const x = (i) => L0 + (proportional && hi > 0 ? nums[i] / hi : i / (n - 1)) * (W - L0 - 40);
  const yt = 40;
  const yb = 110;
  let body = "";
  for (const [y, row] of [
    [yt, f.top],
    [yb, f.bottom],
  ]) {
    body += text(14, y + 5, row.label, "sgf-t sgf-row-label", "start");
    body += `<line class="sgf-axis" x1="${L0}" y1="${y}" x2="${W - 30}" y2="${y}"/>`;
    row.values.forEach((v, i) => {
      body += `<line class="sgf-tick" x1="${x(i)}" y1="${y - 8}" x2="${x(i)}" y2="${y + 8}"/>`;
      body += text(
        x(i),
        y === yt ? y - 14 : y + 28,
        typeof v === "number" ? fmt(v) : v,
        "sgf-t sgf-num",
      );
    });
  }
  for (let i = 0; i < n; i++)
    body += `<line class="sgf-link" x1="${x(i)}" y1="${yt + 10}" x2="${x(i)}" y2="${yb - 10}"/>`;
  return svg(W, 150, body, `Double number line: ${f.top.label} and ${f.bottom.label}`);
}

function coordGrid(f) {
  const nx = Math.round((f.xMax - f.xMin) / f.xStep);
  const ny = Math.round((f.yMax - f.yMin) / f.yStep);
  const cell = Math.max(16, Math.min(60, Math.floor(400 / Math.max(nx, ny))));
  const left = 64;
  const top = 24;
  const W = left + nx * cell + 40;
  const H = top + ny * cell + 64;
  const X = (v) => left + ((v - f.xMin) / f.xStep) * cell;
  const Y = (v) => top + ((f.yMax - v) / f.yStep) * cell;
  const ax = f.yMin <= 0 && f.yMax >= 0 ? Y(0) : Y(f.yMin);
  const ay = f.xMin <= 0 && f.xMax >= 0 ? X(0) : X(f.xMin);
  const everyX = Math.max(1, Math.ceil(nx / 12));
  const everyY = Math.max(1, Math.ceil(ny / 12));
  let body = "";
  for (let i = 0; i <= nx; i++)
    body += `<line class="sgf-grid" x1="${X(f.xMin + i * f.xStep)}" y1="${top}" x2="${X(f.xMin + i * f.xStep)}" y2="${top + ny * cell}"/>`;
  for (let j = 0; j <= ny; j++)
    body += `<line class="sgf-grid" x1="${left}" y1="${Y(f.yMin + j * f.yStep)}" x2="${left + nx * cell}" y2="${Y(f.yMin + j * f.yStep)}"/>`;
  body += `<line class="sgf-axis" x1="${left}" y1="${ax}" x2="${left + nx * cell}" y2="${ax}"/>`;
  body += `<line class="sgf-axis" x1="${ay}" y1="${top}" x2="${ay}" y2="${top + ny * cell}"/>`;
  for (let i = 0; i <= nx; i += everyX) {
    const v = f.xMin + i * f.xStep;
    if (v === 0 && f.yMin < 0) continue;
    body += text(X(v), ax + 20, fmt(v), "sgf-t sgf-num sgf-small");
  }
  for (let j = 0; j <= ny; j += everyY) {
    const v = f.yMin + j * f.yStep;
    if (v === 0 && f.xMin < 0) continue;
    body += text(ay - 8, Y(v) + 5, fmt(v), "sgf-t sgf-num sgf-small", "end");
  }
  if (f.xLabel) body += text(left + (nx * cell) / 2, H - 8, f.xLabel, "sgf-t sgf-axis-title");
  if (f.yLabel)
    body += `<text class="sgf-t sgf-axis-title" transform="translate(16 ${top + (ny * cell) / 2}) rotate(-90)" text-anchor="middle">${esc(f.yLabel)}</text>`;
  const pts = f.points.map((p) => [X(p.x), Y(p.y)]);
  if (f.polygon && pts.length > 2)
    body += `<polygon class="sgf-poly" points="${pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ")}"/>`;
  else if (f.connect && pts.length > 1)
    body += `<polyline class="sgf-connect" points="${pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ")}"/>`;
  f.points.forEach((p, i) => {
    const [px, py] = pts[i];
    body += `<circle class="sgf-pt sgf-on" cx="${px}" cy="${py}" r="6"/>`;
    const label = p.text ?? `(${fmt(p.x)}, ${fmt(p.y)})`;
    if (label) {
      const right = px + 10 + textWidth(label, 14) < left + nx * cell + 30;
      body += text(
        px + (right ? 10 : -10),
        py - 10,
        label,
        "sgf-t sgf-callout sgf-halo",
        right ? "start" : "end",
      );
    }
  });
  return svg(
    W,
    H,
    body,
    `Coordinate grid with points ${f.points.map((p) => `(${fmt(p.x)}, ${fmt(p.y)})`).join(", ")}`,
  );
}

function boxPlot(f) {
  const W = 560;
  const y = 86;
  const a = axis({ x0: 34, x1: W - 34, y, min: f.axisMin, max: f.axisMax, step: f.step });
  const [mn, q1, md, q3, mx] = [f.min, f.q1, f.median, f.q3, f.max].map(a.x);
  const by = 20;
  const bh = 36;
  let body = a.body;
  body += `<line class="sgf-whisker" x1="${mn}" y1="${by + bh / 2}" x2="${q1}" y2="${by + bh / 2}"/>`;
  body += `<line class="sgf-whisker" x1="${q3}" y1="${by + bh / 2}" x2="${mx}" y2="${by + bh / 2}"/>`;
  body += `<line class="sgf-whisker" x1="${mn}" y1="${by + 8}" x2="${mn}" y2="${by + bh - 8}"/>`;
  body += `<line class="sgf-whisker" x1="${mx}" y1="${by + 8}" x2="${mx}" y2="${by + bh - 8}"/>`;
  body += `<rect class="sgf-box" x="${q1}" y="${by}" width="${q3 - q1}" height="${bh}"/>`;
  body += `<line class="sgf-median" x1="${md}" y1="${by}" x2="${md}" y2="${by + bh}"/>`;
  return svg(
    W,
    130,
    body,
    `Box plot: minimum ${fmt(f.min)}, Q1 ${fmt(f.q1)}, median ${fmt(f.median)}, Q3 ${fmt(f.q3)}, maximum ${fmt(f.max)}`,
  );
}

function histogram(f) {
  const bins = f.bins;
  const maxC = Math.max(1, ...bins.map((b) => b.count));
  const left = 64;
  const top = 18;
  const w = Math.min(80, Math.floor(440 / bins.length));
  const ph = 190;
  const W = left + w * bins.length + 30;
  const H = top + ph + 64;
  const yStep = maxC > 12 ? Math.ceil(maxC / 6) : maxC > 6 ? 2 : 1;
  const yMax = Math.ceil(maxC / yStep) * yStep;
  const Y = (c) => top + ph - (c / yMax) * ph;
  let body = "";
  for (let c = 0; c <= yMax; c += yStep) {
    body += `<line class="sgf-grid" x1="${left}" y1="${Y(c)}" x2="${left + w * bins.length}" y2="${Y(c)}"/>`;
    body += text(left - 8, Y(c) + 5, fmt(c), "sgf-t sgf-num sgf-small", "end");
  }
  bins.forEach((b, i) => {
    body += `<rect class="sgf-bar" x="${left + i * w}" y="${Y(b.count)}" width="${w}" height="${top + ph - Y(b.count)}"/>`;
    body += text(left + i * w, top + ph + 20, fmt(b.from), "sgf-t sgf-num sgf-small");
  });
  body += text(
    left + bins.length * w,
    top + ph + 20,
    fmt(bins[bins.length - 1].to),
    "sgf-t sgf-num sgf-small",
  );
  body += `<line class="sgf-axis" x1="${left}" y1="${top + ph}" x2="${left + w * bins.length}" y2="${top + ph}"/>`;
  body += `<line class="sgf-axis" x1="${left}" y1="${top}" x2="${left}" y2="${top + ph}"/>`;
  body += text(left + (w * bins.length) / 2, H - 8, f.xLabel, "sgf-t sgf-axis-title");
  body += `<text class="sgf-t sgf-axis-title" transform="translate(16 ${top + ph / 2}) rotate(-90)" text-anchor="middle">${esc(f.yLabel)}</text>`;
  return svg(W, H, body, `Histogram of ${f.xLabel}`);
}

const GRAPH_FIGURES = { dotPlot, numberLine, doubleNumberLine, coordGrid, boxPlot, histogram };

/** Figure spec → `<figure>` markup, or "" for an unknown kind (validated upstream). */
export function figureMarkup(spec, { caption } = {}) {
  const draw = GRAPH_FIGURES[spec?.kind] || SHAPE_FIGURES[spec?.kind];
  if (!draw) return "";
  const art = draw(spec);
  // `caption` is pre-rendered by the caller (which knows whether the Spanish
  // lane is on); without one, the English caption is typeset here.
  const capHtml = caption ?? (spec.caption ? mathHtml(spec.caption) : "");
  const cap = capHtml ? `<figcaption class="sgf-cap">${capHtml}</figcaption>` : "";
  return `<figure class="sgf sgf--${esc(spec.kind)}">${art}${cap}</figure>`;
}

export const FIGURE_CSS = `
.sgf{margin:0;padding:14px 16px 10px;background:var(--sg-figure,#fff);border:1px solid var(--sg-line,#dde3ea);border-radius:var(--sg-radius,12px);display:flex;flex-direction:column;align-items:center;gap:6px;max-width:100%;overflow-x:auto}
.sgf-svg{max-width:100%;height:auto;font-family:var(--sg-body,inherit);font-variant-numeric:tabular-nums lining-nums}
.sgf-cap{font-size:15px;color:var(--sg-muted,#516175);text-align:center;line-height:1.4}
.sgf-t{fill:var(--sg-text,#1d2a36);font-size:15px}
.sgf-frac{font-size:12px}
.sgf-fracbar{stroke:var(--sg-text,#1d2a36);stroke-width:1.4}
.sgf-num{font-size:15px;font-weight:600}
.sgf-small{font-size:13px}
.sgf-axis-title,.sgf-row-label{font-size:14px;font-weight:700;fill:var(--sg-muted,#516175)}
.sgf-callout{font-size:14px;font-weight:700;fill:var(--sg-deep,#0b2540)}
.sgf-halo{paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}
.sgf-axis,.sgf-tick{stroke:var(--sg-text,#1d2a36);stroke-width:2;fill:none}
.sgf-axis-head{fill:var(--sg-text,#1d2a36)}
.sgf-grid{stroke:#d5dce5;stroke-width:1}
.sgf-dot{fill:#9aa9b9}
.sgf-dot.sgf-on,.sgf-pt.sgf-on{fill:var(--sg,#1f6fb2)}
.sgf-pt{fill:var(--sg-text,#1d2a36);stroke:#fff;stroke-width:2}
.sgf-pt.sgf-open{fill:#fff;stroke:var(--sg,#1f6fb2);stroke-width:3}
.sgf-marker{fill:var(--sg,#1f6fb2)}
.sgf-jump,.sgf-connect{fill:none;stroke:var(--sg,#1f6fb2);stroke-width:2.5}
.sgf-jump-head,.sgf-ray-head{fill:var(--sg,#1f6fb2)}
.sgf-ray{stroke:var(--sg,#1f6fb2);stroke-width:6;stroke-linecap:round}
.sgf-link{stroke:#b9c4d0;stroke-width:1.5;stroke-dasharray:4 4}
.sgf-poly{fill:color-mix(in srgb,var(--sg,#1f6fb2) 16%,transparent);stroke:var(--sg,#1f6fb2);stroke-width:2.5}
.sgf-box{fill:color-mix(in srgb,var(--sg,#1f6fb2) 16%,transparent);stroke:var(--sg-text,#1d2a36);stroke-width:2}
.sgf-whisker{stroke:var(--sg-text,#1d2a36);stroke-width:2}
.sgf-median{stroke:var(--sg,#1f6fb2);stroke-width:4}
.sgf-bar{fill:color-mix(in srgb,var(--sg,#1f6fb2) 30%,#fff);stroke:var(--sg-text,#1d2a36);stroke-width:1.5}
`;

/** Everything a page outside the studio needs to draw any Build figure. */
export const ALL_FIGURE_CSS = `${FIGURE_CSS}${SHAPE_FIGURE_CSS}`;
