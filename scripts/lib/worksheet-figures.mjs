/**
 * worksheet-figures.mjs — print-safe inline SVG models for the practice
 * worksheets (number lines, coordinate planes, tape diagrams, data displays,
 * long-division frames). Every figure carries explicit dimensions and a white
 * background so it prints the same in every browser.
 *
 * Moved verbatim out of scripts/generate-worksheets.mjs in the 2026-09-19
 * publisher overhaul; the drawing code did not change.
 */
import { DIVISION_FIGURE_CSS } from "@eduwonderlab/engine/core/division-walk-figure.js";

export { DIVISION_FIGURE_CSS };

/* ==========================================================================
   1. INLINE SVG MATHEMATICAL MODELS (Print-Safe, Rule #3 Compliant)
   ========================================================================== */
const DATA_1 = "#0f8a84"; // teal - primary series
const DATA_2 = "#c2603f"; // clay - second series
const DATA_3 = "#b07d12"; // ochre - third series
const DATA_4 = "#3b6ea5"; // blue - fourth series
const DATA_PURPLE = "#6b21a8";

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function figureWrap(svgHtml, title = "", caption = "") {
  if (!svgHtml) return "";
  const titleHtml = title
    ? `<div class="ws-fig-title" style="font-weight:700;font-size:11.5px;color:var(--brand-dark,#0f172a);margin-bottom:4px;text-align:center;">${esc(title)}</div>`
    : "";
  const capHtml = caption
    ? `<div class="ws-fig-cap" style="font-size:10.5px;color:var(--muted,#475569);font-style:italic;margin-top:4px;text-align:center;">${esc(caption)}</div>`
    : "";
  return `<div class="ws-figure-wrap" style="margin:10px auto;display:flex;flex-direction:column;align-items:center;">${titleHtml}${svgHtml}${capHtml}</div>`;
}

export function renderNumberLineSvg(cfg) {
  const min = Number(cfg.min ?? 0);
  const max = Number(cfg.max ?? 10);
  const step = Number(cfg.step ?? 1);
  const W = 480,
    H = 84,
    padL = 32,
    padR = 32,
    y = 40;
  const span = Math.max(1, max - min);
  const plotW = W - padL - padR;
  const xOf = (v) => padL + ((v - min) / span) * plotW;

  let ticks = "";
  const stride = (max - min) / step > 15 ? Math.ceil((max - min) / step / 10) * step : step;
  for (let v = min; v <= max + 1e-9; v += step) {
    const showLabel =
      Math.abs(Math.round((v - min) / stride) * stride - (v - min)) < 1e-6 ||
      v === min ||
      v === max;
    ticks += `<line x1="${xOf(v).toFixed(1)}" y1="${y - 6}" x2="${xOf(v).toFixed(1)}" y2="${y + 6}" stroke="#1e293b" stroke-width="1.6"/>`;
    if (showLabel) {
      ticks += `<text x="${xOf(v).toFixed(1)}" y="${y + 20}" text-anchor="middle" font-size="10.5" fill="#1e293b" font-family="'Hanken Grotesk',Arial,sans-serif" font-weight="600">${+v.toFixed(2)}</text>`;
    }
  }

  let pts = "";
  (cfg.points || cfg.targets || []).forEach((p) => {
    const val = Number(p.value != null ? p.value : typeof p === "number" ? p : p.x);
    if (!Number.isFinite(val)) return;
    const px = xOf(val);
    pts += `<circle cx="${px.toFixed(1)}" cy="${y}" r="6.5" fill="${DATA_2}" stroke="#ffffff" stroke-width="2.2"/>`;
    if (p.label) {
      pts += `<text x="${px.toFixed(1)}" y="${y - 11}" text-anchor="middle" font-size="11" font-weight="800" fill="${DATA_2}" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(p.label)}</text>`;
    }
  });

  const axis =
    `<line x1="${padL - 12}" y1="${y}" x2="${W - padR + 12}" y2="${y}" stroke="#1e293b" stroke-width="2.2"/>` +
    `<polygon points="${W - padR + 16},${y} ${W - padR + 7},${y - 4.5} ${W - padR + 7},${y + 4.5}" fill="#1e293b"/>` +
    `<polygon points="${padL - 16},${y} ${padL - 7},${y - 4.5} ${padL - 7},${y + 4.5}" fill="#1e293b"/>`;

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Number line from ${min} to ${max}" style="background:white;max-width:100%;height:auto;border:1.5px solid #cbd5e1;border-radius:8px;padding:4px;">${axis}${ticks}${pts}</svg>`;
  return figureWrap(svg, cfg.title || cfg.questionText, cfg.caption);
}

export function renderCoordPlaneSvg(cfg) {
  const m = Number(cfg.max ?? cfg.xMax ?? 6);
  const W = 280,
    H = 280,
    pad = 24;
  const span = 2 * m;
  const plot = W - 2 * pad;
  const unit = plot / span;
  const cx = pad + m * unit,
    cy = pad + m * unit;
  const X = (x) => pad + (x + m) * unit;
  const Y = (y) => pad + (m - y) * unit;
  const stride = m > 6 ? 2 : 1;

  let grid = "";
  for (let i = -m; i <= m; i++) {
    grid += `<line x1="${X(i)}" y1="${pad}" x2="${X(i)}" y2="${H - pad}" stroke="#e2e8f0" stroke-width="1"/>`;
    grid += `<line x1="${pad}" y1="${Y(i)}" x2="${W - pad}" y2="${Y(i)}" stroke="#e2e8f0" stroke-width="1"/>`;
    if (i !== 0 && i % stride === 0) {
      grid += `<text x="${X(i)}" y="${cy + 12}" text-anchor="middle" font-size="8.5" fill="#64748b" font-family="'Hanken Grotesk',Arial,sans-serif">${i}</text>`;
      grid += `<text x="${cx - 4}" y="${Y(i) + 3}" text-anchor="end" font-size="8.5" fill="#64748b" font-family="'Hanken Grotesk',Arial,sans-serif">${i}</text>`;
    }
  }

  const axes =
    `<line x1="${pad}" y1="${cy}" x2="${W - pad}" y2="${cy}" stroke="#0f172a" stroke-width="2"/>` +
    `<line x1="${cx}" y1="${pad}" x2="${cx}" y2="${H - pad}" stroke="#0f172a" stroke-width="2"/>` +
    `<text x="${W - pad + 6}" y="${cy + 3}" font-size="10.5" font-weight="800" fill="#0f172a" font-family="'Hanken Grotesk',Arial,sans-serif">x</text>` +
    `<text x="${cx + 4}" y="${pad - 5}" font-size="10.5" font-weight="800" fill="#0f172a" font-family="'Hanken Grotesk',Arial,sans-serif">y</text>`;

  const rawPts = (cfg.points || cfg.targets || []).map((p) => ({
    x: Number(p.x != null ? p.x : Array.isArray(p) ? p[0] : 0),
    y: Number(p.y != null ? p.y : Array.isArray(p) ? p[1] : 0),
    label: p.label || (p.name ? p.name : ""),
  }));

  let outline = "";
  if (rawPts.length >= 3) {
    const gx = rawPts.reduce((s, p) => s + p.x, 0) / rawPts.length;
    const gy = rawPts.reduce((s, p) => s + p.y, 0) / rawPts.length;
    const ring = rawPts
      .slice()
      .sort((a, b) => Math.atan2(a.y - gy, a.x - gx) - Math.atan2(b.y - gy, b.x - gx));
    const poly = ring.map((p) => `${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(" ");
    outline = `<polygon points="${poly}" fill="rgba(15,138,132,0.12)" stroke="${DATA_1}" stroke-width="2"/>`;
  }

  let pts = "";
  rawPts.forEach((p) => {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const px = X(p.x),
      py = Y(p.y);
    const lbl = p.label || `(${p.x}, ${p.y})`;
    pts +=
      `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5" fill="${DATA_2}" stroke="#fff" stroke-width="1.8"/>` +
      `<text x="${(px + 6).toFixed(1)}" y="${(py - 6).toFixed(1)}" font-size="9.5" font-weight="800" fill="#0f172a" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(lbl)}</text>`;
  });

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Coordinate plane" style="background:white;max-width:100%;height:auto;border:1.5px solid #cbd5e1;border-radius:8px;padding:4px;">${grid}${axes}${outline}${pts}</svg>`;
  return figureWrap(svg, cfg.title || cfg.label, cfg.caption);
}

export function renderTapeDiagramSvg(cfg) {
  let rows = Array.isArray(cfg.rows) ? cfg.rows : [];
  if (!rows.length && (cfg.parts || cfg.total)) {
    rows = [
      {
        label: cfg.totalLabel || "Total",
        parts: Array.isArray(cfg.parts)
          ? cfg.parts
          : [{ value: cfg.total || 10, label: `${cfg.total || 10}` }],
      },
    ];
  }
  if (!rows.length) return "";
  const W = 460,
    padL = 10,
    padR = 10,
    rowH = 34,
    gap = 12,
    labelW = 84;
  const H = 20 + rows.length * (rowH + gap);
  const palette = [DATA_1, DATA_2, DATA_3, DATA_4];
  const totals = rows.map((r) =>
    (r.parts || []).reduce((s, p) => s + (Number(p.value != null ? p.value : p) || 0), 0),
  );
  const maxTotal = Math.max(...totals, 1);
  const trackW = W - padL - padR - labelW;

  let y = 10;
  let body = "";
  rows.forEach((r) => {
    let x = padL + labelW;
    let segs = "";
    (r.parts || []).forEach((p, i) => {
      const v = Number(p.value != null ? p.value : p) || 0;
      const w = (v / maxTotal) * trackW;
      const fill = p.fill || palette[i % palette.length];
      const lbl = p.label != null ? p.label : p.value != null ? p.value : p;
      segs +=
        `<rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(0, w - 2).toFixed(1)}" height="${rowH}" rx="4" fill="${fill}"/>` +
        `<text x="${(x + w / 2).toFixed(1)}" y="${y + rowH / 2 + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(lbl)}</text>`;
      x += w;
    });
    const rowLabel = `<text x="${padL}" y="${y + rowH / 2 + 4}" font-size="11" font-weight="700" fill="#1e293b" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(r.label || "")}</text>`;
    body += rowLabel + segs;
    y += rowH + gap;
  });

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tape diagram model" style="background:white;max-width:100%;height:auto;border:1.5px solid #cbd5e1;border-radius:8px;padding:4px;">${body}</svg>`;
  return figureWrap(svg, cfg.title || cfg.questionText || cfg.label, cfg.caption);
}

function renderFactorTreeSvg(cfg) {
  const W = 320,
    H = 160;
  let elements = [];
  function traverse(node, x, y, dx) {
    if (!node) return;
    const isPrime = !node.left && !node.right;
    const fill = isPrime ? "#e2f9f5" : "#fbf4e6";
    const stroke = isPrime ? "#0d7a76" : "#d4952a";
    const textColor = isPrime ? "#095350" : "#8a5800";
    elements.push({ type: "node", x, y, value: node.value, fill, stroke, textColor });
    if (node.left) {
      const lx = x - dx,
        ly = y + 42;
      elements.push({ type: "line", x1: x, y1: y + 14, x2: lx, y2: ly - 14 });
      traverse(node.left, lx, ly, dx * 0.5);
    }
    if (node.right) {
      const rx = x + dx,
        ry = y + 42;
      elements.push({ type: "line", x1: x, y1: y + 14, x2: rx, y2: ry - 14 });
      traverse(node.right, rx, ry, dx * 0.5);
    }
  }
  traverse(cfg, W / 2, 22, W / 4);

  let inner = "";
  elements.forEach((el) => {
    if (el.type === "line") {
      inner += `<line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="#cbd5e1" stroke-width="2"/>`;
    } else if (el.type === "node") {
      inner +=
        `<circle cx="${el.x}" cy="${el.y}" r="14" fill="${el.fill}" stroke="${el.stroke}" stroke-width="1.8"/>` +
        `<text x="${el.x}" y="${el.y + 4}" font-size="11" font-weight="800" fill="${el.textColor}" text-anchor="middle" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(el.value)}</text>`;
    }
  });

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Factor tree diagram" style="background:white;max-width:100%;height:auto;border:1.5px solid #cbd5e1;border-radius:8px;padding:4px;">${inner}</svg>`;
  return figureWrap(svg, cfg.title, cfg.caption);
}

function renderBarChartSvg(cfg) {
  const bars = Array.isArray(cfg.bars) ? cfg.bars : [];
  if (!bars.length) return "";
  const W = 420,
    H = 180,
    padL = 36,
    padR = 16,
    padT = 20,
    padB = 36;
  const plotW = W - padL - padR,
    plotH = H - padT - padB;
  const maxV = Math.max(...bars.map((b) => Number(b.value) || 0), 1);
  const bw = plotW / bars.length;
  const baseY = padT + plotH;

  let rects = "";
  bars.forEach((b, i) => {
    const v = Number(b.value) || 0;
    const h = (v / maxV) * plotH;
    const x = padL + i * bw + bw * 0.15;
    const y = baseY - h;
    const w = bw * 0.7;
    rects +=
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${DATA_1}"/>` +
      `<text x="${(x + w / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#1e293b" font-family="'Hanken Grotesk',Arial,sans-serif">${v}</text>` +
      `<text x="${(x + w / 2).toFixed(1)}" y="${(baseY + 14).toFixed(1)}" text-anchor="middle" font-size="10" fill="#475569" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(b.label ?? "")}</text>`;
  });

  const axis = `<line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="#334155" stroke-width="1.5"/>`;
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart" style="background:white;max-width:100%;height:auto;border:1.5px solid #cbd5e1;border-radius:8px;padding:4px;">${axis}${rects}</svg>`;
  return figureWrap(svg, cfg.title, cfg.caption);
}

function renderHistogramSvg(cfg) {
  const bars = Array.isArray(cfg.bars) ? cfg.bars : [];
  if (!bars.length) return "";
  const W = 420,
    H = 180,
    padL = 36,
    padR = 16,
    padT = 20,
    padB = 36;
  const plotW = W - padL - padR,
    plotH = H - padT - padB;
  const maxV = Math.max(...bars.map((b) => Number(b.value) || 0), 1);
  const bw = plotW / bars.length;
  const baseY = padT + plotH;

  let rects = "";
  bars.forEach((b, i) => {
    const v = Number(b.value) || 0;
    const h = (v / maxV) * plotH;
    const x = padL + i * bw;
    const y = baseY - h;
    rects +=
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${DATA_1}" stroke="#ffffff" stroke-width="1"/>` +
      `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#1e293b" font-family="'Hanken Grotesk',Arial,sans-serif">${v}</text>` +
      `<text x="${(x + bw / 2).toFixed(1)}" y="${(baseY + 14).toFixed(1)}" text-anchor="middle" font-size="9" fill="#475569" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(b.label ?? "")}</text>`;
  });

  const axis = `<line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="#334155" stroke-width="1.5"/>`;
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Histogram" style="background:white;max-width:100%;height:auto;border:1.5px solid #cbd5e1;border-radius:8px;padding:4px;">${axis}${rects}</svg>`;
  return figureWrap(svg, cfg.title, cfg.caption);
}

function renderDotPlotSvg(cfg) {
  const vals = Array.isArray(cfg.values) ? cfg.values.map(Number).filter(Number.isFinite) : [];
  if (!vals.length) return "";
  const min = Number(cfg.min ?? Math.min(...vals));
  const max = Number(cfg.max ?? Math.max(...vals));
  const W = 420,
    H = 140,
    padL = 28,
    padR = 28,
    baseY = 100;
  const span = Math.max(1, max - min);
  const plotW = W - padL - padR;
  const xOf = (v) => padL + ((v - min) / span) * plotW;

  const counts = {};
  vals.forEach((v) => {
    counts[v] = (counts[v] || 0) + 1;
  });

  let dots = "";
  Object.entries(counts).forEach(([vStr, cnt]) => {
    const v = Number(vStr);
    const x = xOf(v);
    for (let c = 0; c < cnt; c++) {
      const y = baseY - 12 - c * 14;
      dots += `<circle cx="${x.toFixed(1)}" cy="${y}" r="5" fill="${DATA_2}"/>`;
    }
  });

  let ticks = "";
  for (let v = min; v <= max; v++) {
    const x = xOf(v);
    ticks +=
      `<line x1="${x.toFixed(1)}" y1="${baseY - 4}" x2="${x.toFixed(1)}" y2="${baseY + 4}" stroke="#334155" stroke-width="1.5"/>` +
      `<text x="${x.toFixed(1)}" y="${baseY + 16}" text-anchor="middle" font-size="10" fill="#334155" font-family="'Hanken Grotesk',Arial,sans-serif">${v}</text>`;
  }

  const axis = `<line x1="${padL - 6}" y1="${baseY}" x2="${W - padR + 6}" y2="${baseY}" stroke="#334155" stroke-width="2"/>`;
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dot plot" style="background:white;max-width:100%;height:auto;border:1.5px solid #cbd5e1;border-radius:8px;padding:4px;">${axis}${ticks}${dots}</svg>`;
  return figureWrap(svg, cfg.title, cfg.caption);
}

function renderBoxPlotSvg(cfg) {
  const min = Number(cfg.min ?? 0);
  const max = Number(cfg.max ?? 10);
  const q1 = Number(cfg.q1 ?? min + (max - min) * 0.25);
  const med = Number(cfg.median ?? min + (max - min) * 0.5);
  const q3 = Number(cfg.q3 ?? min + (max - min) * 0.75);
  const W = 420,
    H = 110,
    padL = 28,
    padR = 28,
    boxY = 28,
    boxH = 36,
    axisY = 82;
  const span = Math.max(1, max - min);
  const plotW = W - padL - padR;
  const xOf = (v) => padL + ((v - min) / span) * plotW;

  const box =
    `<rect x="${xOf(q1).toFixed(1)}" y="${boxY}" width="${(xOf(q3) - xOf(q1)).toFixed(1)}" height="${boxH}" fill="rgba(15,138,132,0.18)" stroke="${DATA_1}" stroke-width="2"/>` +
    `<line x1="${xOf(med).toFixed(1)}" y1="${boxY}" x2="${xOf(med).toFixed(1)}" y2="${boxY + boxH}" stroke="${DATA_2}" stroke-width="2.5"/>` +
    `<line x1="${xOf(min).toFixed(1)}" y1="${boxY + boxH / 2}" x2="${xOf(q1).toFixed(1)}" y2="${boxY + boxH / 2}" stroke="#334155" stroke-width="1.5"/>` +
    `<line x1="${xOf(q3).toFixed(1)}" y1="${boxY + boxH / 2}" x2="${xOf(max).toFixed(1)}" y2="${boxY + boxH / 2}" stroke="#334155" stroke-width="1.5"/>` +
    `<line x1="${xOf(min).toFixed(1)}" y1="${boxY + 6}" x2="${xOf(min).toFixed(1)}" y2="${boxY + boxH - 6}" stroke="#334155" stroke-width="2"/>` +
    `<line x1="${xOf(max).toFixed(1)}" y1="${boxY + 6}" x2="${xOf(max).toFixed(1)}" y2="${boxY + boxH - 6}" stroke="#334155" stroke-width="2"/>`;

  let ticks = "";
  const step = Math.max(1, Math.round((max - min) / 8));
  for (let v = min; v <= max; v += step) {
    const x = xOf(v);
    ticks +=
      `<line x1="${x.toFixed(1)}" y1="${axisY - 3}" x2="${x.toFixed(1)}" y2="${axisY + 3}" stroke="#64748b" stroke-width="1"/>` +
      `<text x="${x.toFixed(1)}" y="${axisY + 14}" text-anchor="middle" font-size="9" fill="#64748b" font-family="'Hanken Grotesk',Arial,sans-serif">${v}</text>`;
  }
  const axis = `<line x1="${padL}" y1="${axisY}" x2="${W - padR}" y2="${axisY}" stroke="#64748b" stroke-width="1.5"/>`;

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Box plot" style="background:white;max-width:100%;height:auto;border:1.5px solid #cbd5e1;border-radius:8px;padding:4px;">${box}${axis}${ticks}</svg>`;
  return figureWrap(svg, cfg.title, cfg.caption);
}

function renderPercentGridSvg(cfg) {
  const pct = Math.max(0, Math.min(100, Number(cfg.percent ?? cfg.value ?? 25)));
  const size = 150,
    pad = 8,
    gridW = size - 2 * pad,
    cell = gridW / 10;
  let cells = "";
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const idx = r * 10 + c;
      const shaded = idx < pct;
      const x = pad + c * cell,
        y = pad + r * cell;
      cells += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(cell - 1).toFixed(1)}" height="${(cell - 1).toFixed(1)}" fill="${shaded ? DATA_1 : "#f8fafc"}" stroke="#cbd5e1" stroke-width="0.5"/>`;
    }
  }
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="100-square grid with ${pct} squares shaded" style="background:white;border:1.5px solid #cbd5e1;border-radius:6px;padding:2px;">${cells}</svg>`;
  return figureWrap(svg, cfg.title || `${pct}% Model`, cfg.caption);
}

function renderFractionModelSvg(cfg) {
  const num = Number(cfg.numerator ?? cfg.shaded ?? 1);
  const den = Math.max(1, Number(cfg.denominator ?? cfg.total ?? 4));
  const W = 320,
    H = 50,
    pad = 8,
    w = (W - 2 * pad) / den;
  let parts = "";
  for (let i = 0; i < den; i++) {
    const x = pad + i * w;
    const shaded = i < num;
    parts += `<rect x="${x.toFixed(1)}" y="${pad}" width="${(w - 2).toFixed(1)}" height="${H - 2 * pad}" rx="3" fill="${shaded ? DATA_1 : "#f8fafc"}" stroke="#94a3b8" stroke-width="1.2"/>`;
  }
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Fraction bar showing ${num} out of ${den} parts" style="background:white;max-width:100%;height:auto;border:1.5px solid #cbd5e1;border-radius:6px;">${parts}</svg>`;
  return figureWrap(svg, cfg.title || `${num}/${den} Bar Model`, cfg.caption);
}

function renderAreaModelSvg(cfg) {
  const W = 340,
    H = 130,
    startX = 60,
    startY = 30,
    h = 60;
  const factor1 = cfg.factor1 || "3";
  const p1 = cfg.part1 || "2x",
    p2 = cfg.part2 || "4";
  const val1 = cfg.val1 || "6x",
    val2 = cfg.val2 || "12";
  const svg = `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Algebraic Area Model" style="background:white;border:1.5px solid #cbd5e1;border-radius:8px;padding:4px;">
      <text x="${startX - 20}" y="${startY + h / 2 + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="${DATA_PURPLE}" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(factor1)}</text>
      <rect x="${startX}" y="${startY}" width="140" height="${h}" fill="#ede9fe" stroke="${DATA_PURPLE}" stroke-width="1.6" rx="2"/>
      <rect x="${startX + 140}" y="${startY}" width="100" height="${h}" fill="#f5f3ff" stroke="${DATA_PURPLE}" stroke-width="1.6" rx="2"/>
      <text x="${startX + 70}" y="${startY - 8}" text-anchor="middle" font-size="12" font-weight="bold" fill="#6d28d9" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(p1)}</text>
      <text x="${startX + 190}" y="${startY - 8}" text-anchor="middle" font-size="12" font-weight="bold" fill="#6d28d9" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(p2)}</text>
      <text x="${startX + 70}" y="${startY + h / 2 + 5}" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#5b21b6" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(val1)}</text>
      <text x="${startX + 190}" y="${startY + h / 2 + 5}" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#5b21b6" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(val2)}</text>
    </svg>`;
  return figureWrap(svg, cfg.title || "Distributive Area Model", cfg.caption);
}

function renderBalanceScaleSvg(cfg) {
  const W = 360,
    H = 130;
  const left = cfg.left || "x + 9.8";
  const right = cfg.right || "24.5";
  const svg = `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Algebraic Balance Scale" style="background:white;border:1.5px solid #cbd5e1;border-radius:8px;padding:4px;">
      <line x1="60" y1="50" x2="300" y2="50" stroke="#1e293b" stroke-width="3.5"/>
      <polygon points="180,50 160,95 200,95" fill="#64748b"/>
      <rect x="140" y="95" width="80" height="8" fill="#334155" rx="3"/>
      <line x1="100" y1="50" x2="100" y2="76" stroke="#2563eb" stroke-width="1.8"/>
      <rect x="50" y="76" width="100" height="28" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5" rx="4"/>
      <text x="100" y="94" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(left)}</text>
      <line x1="260" y1="50" x2="260" y2="76" stroke="#2563eb" stroke-width="1.8"/>
      <rect x="210" y="76" width="100" height="28" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5" rx="4"/>
      <text x="260" y="94" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(right)}</text>
    </svg>`;
  return figureWrap(svg, cfg.title || "Algebraic Balance Model", cfg.caption);
}

export function renderProblemDiagram(it) {
  const d = it.diagram || it.visual || it.figure;
  if (d && typeof d === "object") {
    const kind = d.kind || d.type || "";
    if (kind === "number-line" || kind === "numberLine") return renderNumberLineSvg(d);
    if (
      kind === "coordinate-plane" ||
      kind === "coord-plane" ||
      kind === "coordPlane" ||
      kind === "coordinate-grid"
    )
      return renderCoordPlaneSvg(d);
    if (kind === "tape-diagram" || kind === "tapeDiagram" || kind === "bar-model")
      return renderTapeDiagramSvg(d);
    if (kind === "factor-tree" || kind === "factorTree") return renderFactorTreeSvg(d);
    if (kind === "histogram") return renderHistogramSvg(d);
    if (kind === "bar-chart" || kind === "barChart") return renderBarChartSvg(d);
    if (kind === "dot-plot" || kind === "dotPlot") return renderDotPlotSvg(d);
    if (kind === "box-plot" || kind === "boxPlot") return renderBoxPlotSvg(d);
    if (kind === "percent-grid") return renderPercentGridSvg(d);
    if (kind === "fraction-model" || kind === "fraction-bars") return renderFractionModelSvg(d);
    if (kind === "area-model") return renderAreaModelSvg(d);
    if (kind === "balance-scale") return renderBalanceScaleSvg(d);
  }
  if (it.type === "balance-scale") {
    return renderBalanceScaleSvg({ left: it.left || it.equation, right: it.right || it.answer });
  }
  if (it.type === "bar-model") {
    // Two authored shapes: `parts` (one row of labelled parts) and `bars`
    // (every unit piece listed, with an `annotation` on the first piece of
    // each whole). Both print as one tape.
    const parts = Array.isArray(it.parts)
      ? it.parts
      : Array.isArray(it.bars)
        ? it.bars.map((b) => ({ value: b.value ?? 1, label: b.label ?? "" }))
        : null;
    if (!parts || !parts.length) return "";
    return renderTapeDiagramSvg({
      parts,
      total: it.total ?? it.whole,
      totalLabel: it.totalLabel || (Array.isArray(it.bars) ? (it.whole ?? "") : ""),
    });
  }
  if (it.type === "fraction-bars") {
    return renderFractionModelSvg({ numerator: it.target || 1, denominator: it.compare || 4 });
  }
  if (Array.isArray(it.points) && it.points.length && (it.min != null || it.max != null)) {
    return renderNumberLineSvg({
      min: it.min,
      max: it.max,
      step: it.step,
      points: it.points,
      title: it.figureTitle,
    });
  }
  return "";
}

/* ==========================================================================
   2. LONG DIVISION FRAMES & PLACE-VALUE WORKSPACES
   ========================================================================== */

export function divisionInStem(stem) {
  const text = String(stem || "").replace(/[,$]/g, "");
  // A FRACTION anywhere in the expression means this is not long division.
  // "3 ÷ 1/4" matched as dividend 3, divisor 1, so a fraction-division problem
  // printed a long-division frame AND the Divide/Multiply/Subtract/Bring-down
  // rail — in Unit 6, which teaches one method and it is Keep-Change-Flip.
  if (/\d\s*\/\s*\d/.test(text)) return null;
  const m = /(\d+(?:\.\d+)?)\s*(?:÷|\bdivided by\b)\s*(\d+(?:\.\d+)?)/i.exec(text) || null;
  if (!m) return null;
  const dividend = m[1];
  const divisor = m[2];
  if (dividend.includes(".") || divisor.includes(".")) return null;
  if (dividend.length > 7 || divisor.length > 3) return null;
  return { dividend, divisor };
}

export function longDivisionFrame({ dividend, divisor }, { extraRows = 0 } = {}) {
  const U = 30;
  const R = 34;
  const digits = String(dividend).split("");
  const quotientDigits = Math.max(
    1,
    String(Math.floor(Number(dividend) / Math.max(1, Number(divisor)))).length,
  );
  const rows = Math.min(9, Math.max(3, quotientDigits * 2 + extraRows));
  const left = (String(divisor).length + 1) * U;
  const width = left + digits.length * U + U / 2;
  const top = R;
  const height = top + R + rows * R + 8;
  const barY = top + 6;
  const colX = (i) => left + i * U + U / 2;

  const parts = [];
  digits.forEach((_, i) => {
    parts.push(
      `<rect class="wsd-cell" x="${colX(i) - U / 2 + 3}" y="${top - R + 8}" width="${U - 6}" height="${R - 12}" rx="3"/>`,
    );
  });
  const dvs = String(divisor).split("");
  dvs.forEach((d, i) => {
    const x = left - 16 - (dvs.length - 1 - i) * U;
    parts.push(
      `<text class="wsd-given" x="${x}" y="${top + R - 10}" text-anchor="middle">${esc(d)}</text>`,
    );
  });
  parts.push(
    `<path class="wsd-rule" d="M ${left - 6} ${barY} q 8 ${R / 2} 0 ${R}" fill="none"/>`,
    `<line class="wsd-rule" x1="${left - 6}" y1="${barY}" x2="${width - U / 2 + 6}" y2="${barY}"/>`,
  );
  digits.forEach((d, i) => {
    parts.push(
      `<text class="wsd-given" x="${colX(i)}" y="${top + R - 10}" text-anchor="middle">${esc(d)}</text>`,
    );
  });
  for (let r = 0; r < rows; r += 1) {
    const y = top + R + r * R;
    digits.forEach((_, i) => {
      parts.push(
        `<rect class="wsd-cell" x="${colX(i) - U / 2 + 3}" y="${y + 4}" width="${U - 6}" height="${R - 12}" rx="3"/>`,
      );
    });
  }
  return `<svg class="wsd" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Blank long-division frame for ${esc(dividend)} divided by ${esc(divisor)}" style="background:white;">${parts.join("")}</svg>`;
}

const DIVISION_CYCLE = [
  ["Divide", "How many fit?"],
  ["Multiply", "Multiply back."],
  ["Subtract", "What is left?"],
  ["Bring down", "Next digit."],
];
export function divisionCycleRail() {
  const items = DIVISION_CYCLE.map(
    ([name, hint], i) =>
      `<li class="wsd-step"><span class="wsd-step-n">${i + 1}</span><span class="wsd-step-t">${esc(name)}</span><span class="wsd-step-h">${esc(hint)}</span></li>`,
  ).join("");
  return `<ol class="wsd-rail">${items}</ol>`;
}

/**
 * A first-quadrant coordinate grid with labelled axes, for `coordinate-grid`
 * practice items ("Plot (1, 2), (2, 4), (3, 6)"). The student sheet prints it
 * empty; the answer key passes `points` to show the plotted targets.
 */
export function renderFirstQuadrantGridSvg(cfg, points = []) {
  const xMin = Number(cfg.xMin ?? 0);
  const xMax = Number(cfg.xMax ?? 10);
  const yMin = Number(cfg.yMin ?? 0);
  const yMax = Number(cfg.yMax ?? 10);
  const xStep = Number(cfg.xStep ?? 1) || 1;
  const yStep = Number(cfg.yStep ?? 1) || 1;
  const xSpan = Math.max(1, xMax - xMin);
  const ySpan = Math.max(1, yMax - yMin);
  const plotW = 300;
  const plotH = Math.max(160, Math.min(300, (plotW * ySpan) / Math.max(xSpan, ySpan / 1.6)));
  const padL = 46;
  const padB = 40;
  const padT = 14;
  const padR = 16;
  const W = padL + plotW + padR;
  const H = padT + plotH + padB;
  const X = (x) => padL + ((x - xMin) / xSpan) * plotW;
  const Y = (y) => padT + plotH - ((y - yMin) / ySpan) * plotH;
  const font = "font-family=\"'Hanken Grotesk',Arial,sans-serif\"";

  let grid = "";
  const xLabelEvery = Math.ceil(xSpan / xStep / 10) * xStep;
  const yLabelEvery = Math.ceil(ySpan / yStep / 10) * yStep;
  for (let x = xMin; x <= xMax + 1e-9; x += xStep) {
    grid += `<line x1="${X(x).toFixed(1)}" y1="${padT}" x2="${X(x).toFixed(1)}" y2="${padT + plotH}" stroke="#dbe3ea" stroke-width="1"/>`;
    if (Math.abs(((x - xMin) / xLabelEvery) % 1) < 1e-6)
      grid += `<text x="${X(x).toFixed(1)}" y="${padT + plotH + 14}" text-anchor="middle" font-size="9.5" fill="#334155" ${font}>${+x.toFixed(2)}</text>`;
  }
  for (let y = yMin; y <= yMax + 1e-9; y += yStep) {
    grid += `<line x1="${padL}" y1="${Y(y).toFixed(1)}" x2="${padL + plotW}" y2="${Y(y).toFixed(1)}" stroke="#dbe3ea" stroke-width="1"/>`;
    if (Math.abs(((y - yMin) / yLabelEvery) % 1) < 1e-6)
      grid += `<text x="${padL - 6}" y="${(Y(y) + 3.5).toFixed(1)}" text-anchor="end" font-size="9.5" fill="#334155" ${font}>${+y.toFixed(2)}</text>`;
  }
  const axes =
    `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#1e293b" stroke-width="1.8"/>` +
    `<line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" stroke="#1e293b" stroke-width="1.8"/>` +
    (cfg.xLabel
      ? `<text x="${padL + plotW / 2}" y="${H - 8}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#1e293b" ${font}>${esc(cfg.xLabel)}</text>`
      : "") +
    (cfg.yLabel
      ? `<text transform="translate(11 ${padT + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="10.5" font-weight="700" fill="#1e293b" ${font}>${esc(cfg.yLabel)}</text>`
      : "");
  let pts = "";
  for (const p of points || []) {
    const x = Number(p.x);
    const y = Number(p.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    pts += `<circle cx="${X(x).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="5" fill="${DATA_2}" stroke="#fff" stroke-width="1.8"/>`;
    if (p.label)
      pts += `<text x="${(X(x) + 7).toFixed(1)}" y="${(Y(y) - 6).toFixed(1)}" font-size="10" font-weight="800" fill="${DATA_2}" ${font}>${esc(p.label)}</text>`;
  }
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Coordinate grid" style="background:white;max-width:100%;height:auto;border:1.5px solid #cbd5e1;border-radius:8px;padding:4px;">${grid}${axes}${pts}</svg>`;
  return figureWrap(svg, cfg.title || "", cfg.caption || "");
}
