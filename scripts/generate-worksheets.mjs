#!/usr/bin/env node
/**
 * generate-worksheets.mjs — Top 1% TpT Seller & Publisher-Grade Math Worksheets (v3.0 Masterpiece).
 *
 * Sourced from lessons/<id>/config.json across all 288 lesson directories:
 *   • Whole-Group Core Lessons (4 Tiers: Level 0 Foundation, Version A Support, Version B Core Mastery, Challenge Extension)
 *   • Small-Group Group 1 (Support & Scaffolding / Tier 2 Intervention / CRA Progression)
 *   • Small-Group Group 2 (Challenge & Extension / Tier 1 Extension / DOK 3 Rigor)
 *   • Small-Group Catch-Up (Prerequisite Bridge & Standard Acceleration)
 *
 * Outputs per lesson:
 *   • lessons/<id>/worksheet.html              — Publisher-grade student practice printable
 *   • lessons/<id>/worksheet-answer-key.html   — Misconception-aware Teacher Answer Key
 *
 * Compliant with Global Development Rules:
 *   - Rule #1: Production-ready code in a single deterministic pass.
 *   - Rule #2: Layered architecture, CONFIG block, strict contracts.
 *   - Rule #3: Programmatic inline SVG with style="background:white" and explicit dimensions.
 *   - Audience Gating: Zero key leaks on student sheets.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  carriedDivisionFigures,
  DIVISION_FIGURE_CSS,
} from "../engine/core/division-walk-figure.js";
import { EDITORIAL_OVERRIDES } from "./lib/editorial-print.mjs";
import { isGeneratedFresh, writeGenerated } from "./lib/preserve-injected.mjs";
import { scaffoldFor } from "./lib/worksheet-scaffolds.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LESSONS = join(ROOT, "lessons");
const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

/* ==========================================================================
   1. INLINE SVG MATHEMATICAL MODELS (Print-Safe, Rule #3 Compliant)
   ========================================================================== */
const DATA_1 = "#0f8a84"; // teal - primary series
const DATA_2 = "#c2603f"; // clay - second series
const DATA_3 = "#b07d12"; // ochre - third series
const DATA_4 = "#3b6ea5"; // blue - fourth series
const DATA_PURPLE = "#6b21a8";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function figureWrap(svgHtml, title = "", caption = "") {
  if (!svgHtml) return "";
  const titleHtml = title
    ? `<div class="ws-fig-title" style="font-weight:700;font-size:11.5px;color:var(--brand-dark,#0f172a);margin-bottom:4px;text-align:center;">${esc(title)}</div>`
    : "";
  const capHtml = caption
    ? `<div class="ws-fig-cap" style="font-size:10.5px;color:var(--muted,#475569);font-style:italic;margin-top:4px;text-align:center;">${esc(caption)}</div>`
    : "";
  return `<div class="ws-figure-wrap" style="margin:10px auto;display:flex;flex-direction:column;align-items:center;">${titleHtml}${svgHtml}${capHtml}</div>`;
}

function renderNumberLineSvg(cfg) {
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

function renderCoordPlaneSvg(cfg) {
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

function renderTapeDiagramSvg(cfg) {
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

function renderProblemDiagram(it) {
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
    return renderTapeDiagramSvg({ parts: it.parts, total: it.total, totalLabel: it.totalLabel });
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

function divisionInStem(stem) {
  const text = String(stem || "").replace(/[,$]/g, "");
  const m = /(\d+(?:\.\d+)?)\s*(?:÷|\bdivided by\b)\s*(\d+(?:\.\d+)?)/i.exec(text) || null;
  if (!m) return null;
  const dividend = m[1];
  const divisor = m[2];
  if (dividend.includes(".") || divisor.includes(".")) return null;
  if (dividend.length > 7 || divisor.length > 3) return null;
  return { dividend, divisor };
}

function longDivisionFrame({ dividend, divisor }, { extraRows = 0 } = {}) {
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
function divisionCycleRail() {
  const items = DIVISION_CYCLE.map(
    ([name, hint], i) =>
      `<li class="wsd-step"><span class="wsd-step-n">${i + 1}</span><span class="wsd-step-t">${esc(name)}</span><span class="wsd-step-h">${esc(hint)}</span></li>`,
  ).join("");
  return `<ol class="wsd-rail">${items}</ol>`;
}

function workArea(it, { supported = false } = {}) {
  const div = divisionInStem(it?.stem);
  if (div) {
    return `<div class="wsd-wrap${supported ? " wsd-supported" : ""}">
      <div class="wsd-frame">${longDivisionFrame(div, { extraRows: supported ? 1 : 0 })}</div>
      ${supported ? divisionCycleRail() : ""}
    </div>`;
  }
  const scaffold = scaffoldFor(it, { supported });
  if (scaffold) return scaffold.html;
  return workBox(supported ? "Show every step here" : "Show your work");
}

function workBox(label = "Show Your Work & Mathematical Strategy", tall = false) {
  return `<div class="ws-work${tall ? " ws-work-tall" : ""}"><span class="ws-work-label">✏️ ${esc(label)}</span></div>`;
}

/* ==========================================================================
   3. NORMALIZED PROBLEM RENDERERS
   ========================================================================== */

function getStem(it) {
  return (
    it.stem ||
    it.prompt ||
    it.question ||
    it.task ||
    it.questionText ||
    it.title ||
    it.label ||
    it.instructions ||
    "Solve the mathematical problem. Show all of your work and reasoning."
  );
}

function renderMC(it, _n, key, commonMistake, supported = false) {
  const stem = getStem(it);
  const choices = Array.isArray(it.choices)
    ? it.choices
    : Array.isArray(it.options)
      ? it.options
      : [];
  const opts = choices
    .map((c, i) => {
      const correct = key && i === it.correctIndex;
      return `<li class="ws-opt${correct ? " ws-correct" : ""}"><span class="ws-bub">${LETTERS[i]}</span><span class="ws-opt-text">${esc(c)}</span></li>`;
    })
    .join("");

  let notes = "";
  if (key) {
    if (it.explanation)
      notes += `<p class="ws-keynote">💡 <b>Solution Rationale:</b> ${esc(it.explanation)}</p>`;
    const watch = it.watchFor || it.distractorRationale || commonMistake;
    if (watch) notes += `<p class="ws-watch">⚠️ <b>Watch for (Misconception):</b> ${esc(watch)}</p>`;
  }
  const work = key ? "" : workArea(it, { supported });
  return `<p class="ws-stem">${esc(stem)}</p>${work}<ol class="ws-opts">${opts}</ol>${notes}`;
}

function renderMatching(it, _n, key) {
  const pairs = Array.isArray(it.pairs) ? it.pairs : [];
  const stem = getStem(it) || "Write the letter of the matching item next to each term.";
  const matches = pairs.map((p) => p.match || p.right || p.definition || "");
  const terms = pairs
    .map((p, i) => {
      const term = p.term || p.left || `Item ${i + 1}`;
      const letter = LETTERS[i] || "";
      return `<li class="ws-match-term"><span class="ws-blank ws-blank-sm">${key ? esc(letter) : ""}</span><span class="ws-term-lbl">${esc(term)}</span></li>`;
    })
    .join("");

  const bankHtml = matches
    .map(
      (m, i) =>
        `<li><span class="ws-bub ws-bub-sm">${LETTERS[i]}</span><span class="ws-match-desc">${esc(m)}</span></li>`,
    )
    .join("");

  return `<p class="ws-stem">${esc(stem)}</p>
  <div class="ws-match"><ol class="ws-match-terms">${terms}</ol><ul class="ws-match-bank">${bankHtml}</ul></div>`;
}

function renderErrorAnalysis(it, _n, key) {
  const title = getStem(it) || "Find & Correct the Mathematical Error";
  const steps = (it.workedExample || [])
    .map(
      (s, i) =>
        `<li><span class="ws-step-n">${i + 1}</span><span class="ws-step-l">${esc(s.label || `Step ${i + 1}`)}:</span><span class="ws-step-w">${esc(s.work || s.text || "")}</span></li>`,
    )
    .join("");

  let keyHtml = "";
  if (key) {
    const parts = [];
    if (typeof it.errorStep === "number") parts.push(`Mistake is in Step ${it.errorStep + 1}.`);
    if (it.correctWork) parts.push(`Correct Work: ${it.correctWork}.`);
    if (it.explanation) parts.push(`Misconception: ${it.explanation}`);
    keyHtml = `<div class="ws-keynote"><b>Key Analysis:</b> ${esc(parts.join(" ") || "See worked solution.")}</div>`;
  }

  return `<p class="ws-stem"><b>${esc(title)}</b></p>
  <div class="ws-steps-box"><ol class="ws-steps">${steps}</ol></div>
  <p class="ws-prompt">Which step contains the error? Explain the mathematical misconception and write the correct calculation below.</p>
  ${key ? keyHtml : workBox("Corrected Mathematical Work & Explanation", true)}`;
}

function renderFillTable(it, _n, key) {
  const cols = Array.isArray(it.columns)
    ? it.columns
    : Array.isArray(it.headers)
      ? it.headers
      : ["Item", "Value", "Result"];
  const head = cols.map((c) => `<th>${esc(c)}</th>`).join("");
  const rows = (it.rows || [])
    .map((r) => {
      if (Array.isArray(r)) {
        const cells = r.map((c, i) => `<td>${i === 0 ? esc(c) : key ? esc(c) : ""}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }
      const keys = Object.keys(r);
      const cells = keys
        .map((k, i) => `<td>${i === 0 ? esc(r[k]) : key ? esc(r[k]) : ""}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<p class="ws-stem">${esc(getStem(it))}</p>
  <table class="ws-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>
  ${key ? "" : workBox("Scratchpad / Reasoning")}`;
}

function renderDragSort(it, _n, key) {
  const stem = getStem(it) || "Classify each mathematical statement into the correct category.";
  let catsHtml = "";
  let itemsHtml = "";

  if (
    Array.isArray(it.categories) &&
    it.categories.length &&
    typeof it.categories[0] === "object"
  ) {
    const catLabels = it.categories.map((c) => c.label || c.title || "Group");
    catsHtml = catLabels.map((c) => `<span class="ws-cat-pill">${esc(c)}</span>`).join(" ");
    const allItems = [];
    it.categories.forEach((cat) => {
      (cat.items || []).forEach((itemText) => {
        allItems.push({ text: itemText, category: cat.label });
      });
    });
    itemsHtml = allItems
      .map(
        (i) =>
          `<li class="ws-sort-item"><span class="ws-blank ws-blank-sm">${key ? esc(i.category) : ""}</span><span class="ws-sort-text">${esc(i.text)}</span></li>`,
      )
      .join("");
  } else {
    const cats = Array.isArray(it.categories) ? it.categories : ["Group 1", "Group 2"];
    catsHtml = cats.map((c) => `<span class="ws-cat-pill">${esc(c)}</span>`).join(" ");
    const items = (it.items || it.cards || [])
      .map((i) => {
        const text = typeof i === "string" ? i : i.text || i.label || "";
        const cat =
          typeof i === "object" ? i.category || (i.correct != null ? cats[i.correct] : "") : "";
        return `<li class="ws-sort-item"><span class="ws-blank ws-blank-sm">${key ? esc(cat) : ""}</span><span class="ws-sort-text">${esc(text)}</span></li>`;
      })
      .join("");
    itemsHtml = items;
  }

  return `<p class="ws-stem">${esc(stem)}</p>
  <div class="ws-cats-bar"><b>Target Categories:</b> ${catsHtml}</div>
  <ul class="ws-sort-list">${itemsHtml}</ul>`;
}

function renderOpen(it, _n, key, supported) {
  const stem = getStem(it);
  const frames =
    it.sentenceFrame ||
    (Array.isArray(it.sentenceStems) ? it.sentenceStems.join("<br>") : it.sentenceStems);
  const frameHtml =
    supported && frames
      ? `<div class="ws-frame">💬 <b>Sentence Starter:</b> ${esc(frames)}</div>`
      : "";

  let keyHtml = "";
  if (key) {
    const parts = [];
    if (it.sampleAnswer || it.modelAnswer)
      parts.push(`Sample Answer: ${it.sampleAnswer || it.modelAnswer}`);
    if (Array.isArray(it.keywords) && it.keywords.length)
      parts.push(`Key Terms to Look For: ${it.keywords.join(", ")}`);
    if (it.explanation) parts.push(`Explanation: ${it.explanation}`);
    keyHtml = `<div class="ws-keynote">💡 <b>Exemplar Response:</b> ${esc(parts.join(" ") || "Student demonstrates accurate mathematical justification.")}</div>`;
  }
  return `<p class="ws-stem">${esc(stem)}</p>${frameHtml}${key ? keyHtml : workBox("Mathematical Justification & Response", true)}`;
}

function renderGeneric(it, _n, key) {
  const stem = getStem(it);
  return `<p class="ws-stem">${esc(stem)}</p>${key ? `<div class="ws-keynote">See standard solution method.</div>` : workBox()}`;
}

function renderProblem(it, n, { key = false, supported = false, commonMistake = "" } = {}) {
  if (!it || (!it.type && !it.stem && !it.prompt && !it.question)) return "";
  const diagramHtml = renderProblemDiagram(it);
  let body;
  const t = it.type || "";
  if (t === "multiple-choice") body = renderMC(it, n, key, commonMistake, supported);
  else if (t === "matching" || t === "matching-game") body = renderMatching(it, n, key);
  else if (t === "error-analysis") body = renderErrorAnalysis(it, n, key);
  else if (t === "fill-table") body = renderFillTable(it, n, key);
  else if (t === "drag-sort") body = renderDragSort(it, n, key);
  else if (t === "open-response" || t === "short-answer") body = renderOpen(it, n, key, supported);
  else body = renderGeneric(it, n, key);

  return `
    <li class="ws-problem-card">
      <div class="ws-problem-head">
        <span class="ws-pnum">${n}</span>
        <span class="ws-pbadge">${t ? t.replace(/-/g, " ").toUpperCase() : "PRACTICE"}</span>
      </div>
      <div class="ws-pbody">
        ${diagramHtml}
        ${body}
      </div>
    </li>
  `;
}

/* ==========================================================================
   4. PUBLISHER ANCHORS, WORD BANKS, DISCOURSE & CER MATRIX
   ========================================================================== */

function wordBank(vocab = []) {
  if (!vocab || !vocab.length) return "";
  const chips = vocab
    .slice(0, 8)
    .map((v) => {
      const en = esc(v.term || v.en || "");
      const es = v.termEs || v.spanish || v.es || "";
      const def = v.definition ? ` — ${esc(v.definition)}` : "";
      const esBadge = es ? ` <span class="ws-es-term">(${esc(es)})</span>` : "";
      return `<div class="ws-bank-card"><span class="ws-bankword">${en}${esBadge}</span><span class="ws-bankdef">${def}</span></div>`;
    })
    .join("");
  return `
    <section class="ws-anchor-box ws-vocab-box">
      <div class="ws-anchor-title">📕 Mathematical Word Bank &amp; Spanish Cognates / Banco de Palabras</div>
      <div class="ws-bankgrid">${chips}</div>
    </section>
  `;
}

function conceptAnchorBox(cfg, isGroup1 = true) {
  const intro = cfg.conceptIntro || {};
  const heading = intro.heading || cfg.title || "Core Mathematical Strategy";
  const keyIdea =
    intro.keyIdea ||
    cfg.contentObjective ||
    "Understand and apply the target mathematical relationship with precision.";
  const iDo = intro.iDo || {};
  const steps = Array.isArray(iDo.lines) ? iDo.lines.map((l) => `<li>${esc(l)}</li>`).join("") : "";

  return `
    <section class="ws-anchor-box ${isGroup1 ? "ws-support-anchor" : "ws-challenge-anchor"}">
      <div class="ws-anchor-title">📌 Concept Anchor &amp; Strategy Model: ${esc(heading)}</div>
      <p class="ws-anchor-idea"><b>Key Takeaway:</b> ${esc(keyIdea)}</p>
      ${steps ? `<div class="ws-anchor-steps"><b>Worked Steps ("I Do" Strategy):</b><ol>${steps}</ol></div>` : ""}
    </section>
  `;
}

function getTWRStems(standard) {
  const std = String(standard || "").toUpperCase();
  if (std.includes("DS") || std.includes("SP") || std.includes("STAT")) {
    return {
      because:
        "A question is statistical because it expects varied responses across different subjects rather than a single fixed value.",
      but: "A question might gather numbers, but it is not statistical if there is only one exact unchanging answer.",
      so: "The researcher needed to understand group variation, so she collected data using a statistical survey question.",
    };
  }
  if (std.includes("RP") || std.includes("AT") || std.includes("RATIO") || std.includes("RATE")) {
    return {
      because:
        "The ratio remains equivalent because both quantities are scaled by the exact same multiplicative factor.",
      but: "Two ratios may look similar, but inverting the order of terms fundamentally changes the comparison.",
      so: "The recipe requires 3 parts flour to 2 parts water, so the unit rate is 1.5 cups of flour per cup of water.",
    };
  }
  if (std.includes("PERC") || std.includes("RP.3C")) {
    return {
      because:
        "A percent represents a rate per 100 because the term percent literally means 'per hundred'.",
      but: "A percent can be greater than 100%, but it still represents a proportional ratio based on 100 equal parts.",
      so: "The student answered 18 out of 20 correctly, so the final score was 90% because 18/20 = 90/100.",
    };
  }
  if (std.includes("G.") || std.includes("AREA") || std.includes("VOL")) {
    return {
      because:
        "The area formula base × height applies because a decomposed triangle translates to complete a rectangle.",
      but: "A slanted side has length, but it cannot be used as height because height must be perpendicular (at 90°) to the base.",
      so: "The dimensions are 12 cm base by 7 cm perpendicular height, so the total area is 84 cm².",
    };
  }
  if (std.includes("NS.1") || std.includes("FRAC")) {
    return {
      because:
        "Dividing by a unit fraction yields a larger quotient because smaller fractional pieces are being counted within the whole.",
      but: "Multiplying fractions produces smaller values, but dividing fractions counts the number of groups that fit inside.",
      so: "The chef has 4 cups of sugar and each batch needs 1/2 cup, so 8 full batches can be prepared.",
    };
  }
  if (std.includes("NS") || std.includes("INT") || std.includes("COORD")) {
    return {
      because:
        "Opposite integers have the same absolute value because they are equidistant from zero on the number line.",
      but: "Zero is an integer, but it is neither positive nor negative because it serves as the neutral origin point.",
      so: "The elevation dropped 25 feet below sea level, so the depth is represented by the integer -25.",
    };
  }
  if (std.includes("EE") || std.includes("EQ") || std.includes("EXP")) {
    return {
      because:
        "The equation remains balanced because the exact same inverse operation is applied to both sides.",
      but: "An expression contains variables and constants, but it cannot be solved for a single value without an equal sign.",
      so: "The total cost was $45 for 3 tickets, so the algebraic equation is 3t = 45 and each ticket costs $15.",
    };
  }
  return {
    because:
      "The mathematical model proves the solution because each step preserves quantitative equivalence.",
    but: "An estimate provides a quick benchmark, but an exact proof is required for precision.",
    so: "The quantities follow the standard rule, so the final result is verified with certainty.",
  };
}

function renderTWRSection(cfg) {
  const stems = getTWRStems(cfg.standard);
  return `
    <section class="ws-twr-section" style="background:#f8fafc;border:1.5px solid #cbd5e1;border-left:5px solid #0f766e;border-radius:8px;padding:12px 16px;margin:14px 0;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:11px;font-weight:800;color:#0f766e;letter-spacing:0.04em;text-transform:uppercase;">✍️ The Writing Revolution (TWR) · Sentence Expansion</span>
        <span style="font-size:10px;font-weight:700;color:#475569;">Because · But · So</span>
      </div>
      <p style="font-size:12px;font-weight:600;color:#1e293b;margin-bottom:8px;">Complete each sentence stem to demonstrate precise mathematical reasoning:</p>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;padding:6px 10px;font-size:11.5px;">
          <span style="display:inline-block;background:#ccfbf1;color:#0f766e;font-weight:800;padding:1px 5px;border-radius:4px;font-size:10px;margin-right:4px;">BECAUSE</span>
          ${esc(stems.because)}
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;padding:6px 10px;font-size:11.5px;">
          <span style="display:inline-block;background:#fef3c7;color:#b45309;font-weight:800;padding:1px 5px;border-radius:4px;font-size:10px;margin-right:4px;">BUT</span>
          ${esc(stems.but)}
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;padding:6px 10px;font-size:11.5px;">
          <span style="display:inline-block;background:#eff6ff;color:#1d4ed8;font-weight:800;padding:1px 5px;border-radius:4px;font-size:10px;margin-right:4px;">SO</span>
          ${esc(stems.so)}
        </div>
      </div>
    </section>
  `;
}

function discourseCard(discourse, _isGroup1 = true) {
  const q = discourse?.question || "How does your visual model justify your mathematical solution?";
  const pA =
    discourse?.partnerA || 'Partner A: "I modeled this by identifying the relationship and..."';
  const pB =
    discourse?.partnerB ||
    'Partner B: "I agree with your step because the standard mathematical rule states..."';
  return `
    <section class="ws-discourse-box">
      <div class="ws-disc-header">
        <span class="ws-disc-badge">🗣️ MATHEMATICAL DISCOURSE &amp; TALK MOVES</span>
        <span style="font-size:11px; font-weight:700; color:var(--brand-dark,#0f172a);">SMP.3 / Construct Viable Arguments</span>
      </div>
      <p class="ws-disc-prompt"><b>Group Discussion Prompt:</b> ${esc(q)}</p>
      <div class="ws-disc-grid">
        <div class="ws-disc-card"><b>🗣️ Partner A:</b><br>${esc(pA)}</div>
        <div class="ws-disc-card"><b>👂 Partner B:</b><br>${esc(pB)}</div>
      </div>
    </section>
  `;
}

function cerWritingMatrix(cerData, isGroup1 = true) {
  const q = cerData?.question || "Justify why your mathematical solution is accurate and complete.";
  const claimHint = isGroup1
    ? "Starter: My mathematical claim is that the solution is..."
    : "State your direct mathematical answer/claim with units.";
  const evidHint = isGroup1
    ? "Starter: The evidence from the model/table demonstrates that..."
    : "Cite exact numbers, calculations, dimensions, or graph data.";
  const reasHint = isGroup1
    ? "Starter: This proves my answer because the standard mathematical definition of..."
    : "Explain the mathematical theorem, property, or definition connecting evidence to claim.";

  return `
    <section class="ws-cer-section">
      <div class="ws-cer-header">
        <span class="ws-cer-badge">📐 CER MATHEMATICAL PROOF MATRIX (CER 2.0)</span>
        <span style="font-size:11px; font-weight:700; color:var(--brand-dark,#0f172a);">SMP.3 / Proof &amp; Justification</span>
      </div>
      <p class="ws-cer-prompt"><b>Writing Task:</b> ${esc(q)}</p>
      <div class="ws-cer-table">
        <div class="ws-cer-row">
          <div class="ws-cer-label"><b>C</b> Claim</div>
          <div class="ws-cer-cell"><span class="ws-cer-prompt-hint">${claimHint}</span><div class="ws-lines"><span class="ws-line"></span><span class="ws-line"></span></div></div>
        </div>
        <div class="ws-cer-row">
          <div class="ws-cer-label"><b>E</b> Evidence</div>
          <div class="ws-cer-cell"><span class="ws-cer-prompt-hint">${evidHint}</span><div class="ws-lines"><span class="ws-line"></span><span class="ws-line"></span></div></div>
        </div>
        <div class="ws-cer-row">
          <div class="ws-cer-label"><b>R</b> Reasoning</div>
          <div class="ws-cer-cell"><span class="ws-cer-prompt-hint">${reasHint}</span><div class="ws-lines"><span class="ws-line"></span><span class="ws-line"></span></div></div>
        </div>
      </div>
    </section>
  `;
}

function studentSelfCheckBar() {
  return `
    <div class="ws-self-check-bar">
      <div class="ws-sc-item"><b>Student Mastery Self-Assessment:</b></div>
      <div class="ws-sc-item"><span class="ws-sc-box"></span> 1 · Need More Support</div>
      <div class="ws-sc-item"><span class="ws-sc-box"></span> 2 · Getting Closer</div>
      <div class="ws-sc-item"><span class="ws-sc-box"></span> 3 · Got It / Solid</div>
      <div class="ws-sc-item"><span class="ws-sc-box"></span> 4 · Master / Can Teach It</div>
    </div>
  `;
}

/* ==========================================================================
   5. TOP 1% TPT PUBLISHER HEADER WITH RUBRIC
   ========================================================================== */

function publisherHeader(cfg, levelBadge, levelSub, isKey = false) {
  const wbUrl = `/curriculum/math-workbench/?lesson=${esc(cfg.lessonId)}`;
  const title = esc(cfg.title || cfg.lessonId || "Mathematics Practice");
  const std = esc(cfg.standard || "CCSS.MATH.CONTENT.6.RP / 6.NS");

  return `
    <header class="ws-publisher-header">
      <div class="ws-header-top-ribbon">
        <div class="ws-ribbon-left">
          <span class="ws-pill ws-pill-std">${std}</span>
          <span class="ws-pill ws-pill-lesson">Lesson ${esc(cfg.lessonId)}</span>
          <span class="ws-pill ws-pill-level">${esc(isKey ? levelBadge + " · Answer Key" : levelBadge)}</span>
        </div>
        <div class="ws-rubric-box">
          <div class="ws-rubric-score">SCORE: <span class="ws-score-blank">_______ / 10</span></div>
          <div class="ws-rubric-badges">🌟 Exceeds &nbsp;|&nbsp; ✅ Target &nbsp;|&nbsp; 🔄 Approaching</div>
        </div>
      </div>
      <div class="ws-title-group">
        <div class="ws-title-text-box">
          <h1 class="ws-main-title">${title}</h1>
          <p class="ws-sub-title">${esc(levelSub)}</p>
        </div>
        <div class="ws-digital-link-box">
          <span aria-hidden="true">⚡</span> <a href="${wbUrl}" target="_blank" rel="noopener"><b>Interactive Workbench &amp; Models</b> &rarr;</a>
        </div>
      </div>
      <div class="ws-meta-row">
        <span><b>Name:</b> <span class="ws-fill-line" style="width:230px;"></span></span>
        <span><b>Date:</b> <span class="ws-fill-line" style="width:110px;"></span></span>
        <span><b>Period:</b> <span class="ws-fill-line" style="width:70px;"></span></span>
        <span><b>Learning Goal:</b> <span class="ws-fill-line" style="width:160px;"></span></span>
      </div>
    </header>
  `;
}

/* ==========================================================================
   6. DIFFERENTIATED PAGE BUILDERS
   ========================================================================== */

function buildGroup1SupportWorksheet(cfg, isKey = false) {
  const approaching = (cfg.practice?.approaching || []).filter(
    (p) => p && (p.type || p.stem || p.prompt),
  );
  const onLevel = (cfg.practice?.onLevel || []).filter((p) => p && (p.type || p.stem || p.prompt));
  const combined = approaching.length ? approaching : onLevel;
  const problems = combined.slice(0, 6);
  const commonMistake = isKey ? cfg.practice?.commonMistake || "" : "";

  const itemsHtml = problems
    .map((p, i) => renderProblem(p, i + 1, { key: isKey, supported: true, commonMistake }))
    .join("");

  const anchorHtml = !isKey ? conceptAnchorBox(cfg, true) : "";
  const bankHtml = !isKey ? wordBank(cfg.vocabulary) : "";
  const discHtml = cfg.explore?.discourse ? discourseCard(cfg.explore.discourse, true) : "";
  const cerHtml = cerWritingMatrix(cfg.cerWriting, true);
  const twrHtml = renderTWRSection(cfg);

  return `
    <section class="ws-page ws-group1-page">
      ${publisherHeader(cfg, "🟡 Group 1 · Support &amp; Scaffolding", "Tier 2 Intervention · Concrete-Representational-Abstract (CRA) · Dual-Language Anchors", isKey)}
      ${anchorHtml}
      ${bankHtml}
      <ol class="ws-problems-grid">${itemsHtml}</ol>
      ${discHtml}
      ${twrHtml}
      ${cerHtml}
      ${!isKey ? studentSelfCheckBar() : ""}
    </section>
  `;
}

function buildGroup2ChallengeWorksheet(cfg, isKey = false) {
  const extending = (cfg.practice?.extending || []).filter(
    (p) => p && (p.type || p.stem || p.prompt),
  );
  const onLevel = (cfg.practice?.onLevel || []).filter((p) => p && (p.type || p.stem || p.prompt));
  const combined = extending.length ? extending : onLevel;
  const problems = combined.slice(0, 6);
  const commonMistake = isKey ? cfg.practice?.commonMistake || "" : "";

  const itemsHtml = problems
    .map((p, i) => renderProblem(p, i + 1, { key: isKey, supported: false, commonMistake }))
    .join("");

  const anchorHtml = !isKey ? conceptAnchorBox(cfg, false) : "";
  const discHtml = cfg.explore?.discourse ? discourseCard(cfg.explore.discourse, false) : "";
  const cerHtml = cerWritingMatrix(cfg.cerWriting, false);
  const twrHtml = renderTWRSection(cfg);

  const authorBox = !isKey
    ? `
    <section class="ws-author-challenge-box">
      <div class="ws-author-head">✍️ AUTHOR YOUR OWN EXTENSION CHALLENGE</div>
      <p class="ws-author-prompt">Create an original multi-step word problem aligned to this standard. Include constraints, and write the complete step-by-step mathematical proof below.</p>
      ${workBox("Author Workspace & Complete Solution Key", true)}
    </section>
  `
    : "";

  return `
    <section class="ws-page ws-group2-page">
      ${publisherHeader(cfg, "🟣 Group 2 · Challenge &amp; Extension", "Tier 1 Extension · Non-Routine Synthesis · Misconception Traps · Rigorous CER Proofs", isKey)}
      ${anchorHtml}
      <ol class="ws-problems-grid">${itemsHtml}</ol>
      ${discHtml}
      ${twrHtml}
      ${cerHtml}
      ${authorBox}
      ${!isKey ? studentSelfCheckBar() : ""}
    </section>
  `;
}

function buildCatchupWorksheet(cfg, isKey = false) {
  const approaching = (cfg.practice?.approaching || []).filter(
    (p) => p && (p.type || p.stem || p.prompt),
  );
  const onLevel = (cfg.practice?.onLevel || []).filter((p) => p && (p.type || p.stem || p.prompt));
  const problems = (approaching.length ? approaching : onLevel).slice(0, 5);
  const commonMistake = isKey ? cfg.practice?.commonMistake || "" : "";

  const itemsHtml = problems
    .map((p, i) => renderProblem(p, i + 1, { key: isKey, supported: true, commonMistake }))
    .join("");

  return `
    <section class="ws-page ws-catchup-page">
      ${publisherHeader(cfg, "🔵 Prerequisite Catch-Up &amp; Skill Bridge", "Targeted Prerequisite Reinforcement · Visual Bridge to Grade 6 Standard", isKey)}
      ${!isKey ? conceptAnchorBox(cfg, true) : ""}
      ${!isKey ? wordBank(cfg.vocabulary) : ""}
      <ol class="ws-problems-grid">${itemsHtml}</ol>
      ${cerWritingMatrix(cfg.cerWriting, true)}
      ${!isKey ? studentSelfCheckBar() : ""}
    </section>
  `;
}

function buildCoreTierPage(
  cfg,
  pool,
  label,
  sub,
  { supported = false, isKey = false, extraScaffold = false } = {},
) {
  const commonMistake = isKey ? cfg.practice?.commonMistake || "" : "";
  const itemsHtml = pool
    .map((p, i) => renderProblem(p, i + 1, { key: isKey, supported, commonMistake }))
    .join("");

  const anchorHtml = supported && !isKey ? conceptAnchorBox(cfg, true) : "";
  const bankHtml = supported && !isKey ? wordBank(cfg.vocabulary) : "";
  const scaffoldBanner =
    extraScaffold && !isKey
      ? `<div class="ws-scaffold-note">🧩 <b>Built-in Scaffolding:</b> Use the visual word bank and worked models. Sentence frames are provided under each problem.</div>`
      : "";

  return `
    <section class="ws-page ws-core-tier-page">
      ${publisherHeader(cfg, label, sub, isKey)}
      ${anchorHtml}
      ${bankHtml}
      ${scaffoldBanner}
      <ol class="ws-problems-grid">${itemsHtml}</ol>
      ${cerWritingMatrix(cfg.cerWriting, supported)}
      ${!isKey ? studentSelfCheckBar() : ""}
    </section>
  `;
}

function buildWorksheet(cfg, { key = false } = {}) {
  const lessonId = cfg.lessonId || "";
  const title = esc(cfg.title || lessonId);
  const audience = key ? "teacher" : "student";
  const titleSuffix = key ? "Practice Answer Key" : "Practice Worksheet";

  let pages = "";

  if (lessonId.includes("-group1")) {
    pages = buildGroup1SupportWorksheet(cfg, key);
  } else if (lessonId.includes("-group2")) {
    pages = buildGroup2ChallengeWorksheet(cfg, key);
  } else if (lessonId.includes("-catchup")) {
    pages = buildCatchupWorksheet(cfg, key);
  } else {
    const printable = (pool) => (pool || []).filter((p) => p && (p.type || p.stem || p.prompt));
    const approaching = printable(cfg.practice?.approaching);
    const onLevel = printable(cfg.practice?.onLevel);
    const extending = printable(cfg.practice?.extending);
    const levelZero = approaching.slice(0, 4);

    const tiers = [
      {
        pool: levelZero,
        label: "Level 0",
        sub: "Core Foundation · Step-by-Step Scaffolds",
        supported: true,
        extraScaffold: true,
      },
      {
        pool: approaching,
        label: "Version A",
        sub: "Approaching Standard · Supported Practice",
        supported: true,
        extraScaffold: false,
      },
      {
        pool: onLevel,
        label: "Version B",
        sub: "On-Level Core Mastery · Standard Rigor",
        supported: false,
        extraScaffold: false,
      },
      {
        pool: extending,
        label: "Challenge",
        sub: "Enrichment &amp; Non-Routine Synthesis",
        supported: false,
        extraScaffold: false,
      },
    ].filter((t) => t.pool.length);

    pages = tiers
      .map((t) =>
        buildCoreTierPage(cfg, t.pool, t.label, t.sub, {
          supported: t.supported,
          isKey: key,
          extraScaffold: t.extraScaffold,
        }),
      )
      .join("\n");
  }

  return `<!DOCTYPE html>
<html lang="en" data-ewl-supports-lesson="${esc(cfg.lessonId)}" data-support-audience="${audience}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} — ${titleSuffix}</title>
<link href="/assets/fonts/worksheet-pages.css" rel="stylesheet" />
<style>
:root {
  --navy: #0f172a;
  --navy-light: #1e293b;
  --blue: #1d4ed8;
  --blue-light: #eff6ff;
  --teal: #0f766e;
  --teal-light: #f0fdfa;
  --amber-dark: #b45309;
  --amber-light: #fef3c7;
  --amber-border: #fde68a;
  --purple-dark: #6b21a8;
  --purple-light: #f5f3ff;
  --purple-border: #d8b4fe;
  --ink: #0f172a;
  --muted: #475569;
  --line: #cbd5e1;
  --line-light: #e2e8f0;
  --soft: #f8fafc;
  --card-bg: #ffffff;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Hanken Grotesk', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  margin: 0;
  background: #f1f5f9;
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 13.5px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* Page Container (Publisher Sheet) */
.ws-page {
  background: #ffffff;
  max-width: 820px;
  margin: 24px auto;
  padding: 36px 44px 44px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1);
  border-radius: 8px;
  border: 1.5px solid var(--line-light);
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Tiered Custom Color Themes */
.ws-group1-page { border-top: 6px solid var(--amber-dark); }
.ws-group2-page { border-top: 6px solid var(--purple-dark); }
.ws-catchup-page { border-top: 6px solid var(--teal); }
.ws-core-tier-page { border-top: 6px solid var(--blue); }

/* Publisher Header */
.ws-publisher-header {
  border-bottom: 2.5px solid var(--navy);
  padding-bottom: 14px;
  margin-bottom: 18px;
}
.ws-header-top-ribbon {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.ws-ribbon-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ws-pill {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 3px 10px;
  border-radius: 999px;
}
.ws-pill-std { background: var(--navy); color: #ffffff; }
.ws-pill-lesson { background: #e2e8f0; color: #1e293b; }
.ws-pill-level { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
.ws-group1-page .ws-pill-level { background: var(--amber-light); color: var(--amber-dark); border-color: var(--amber-border); }
.ws-group2-page .ws-pill-level { background: var(--purple-light); color: var(--purple-dark); border-color: var(--purple-border); }

.ws-rubric-box {
  background: var(--soft);
  border: 1.5px solid var(--line);
  border-radius: 6px;
  padding: 4px 10px;
  text-align: right;
  font-size: 11px;
}
.ws-rubric-score { font-weight: 800; color: var(--navy); }
.ws-score-blank { font-family: var(--font-mono); color: var(--blue); }
.ws-rubric-badges { font-size: 10px; color: var(--muted); font-weight: 600; }

.ws-title-group {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.ws-main-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 800;
  color: var(--navy);
  line-height: 1.15;
}
.ws-sub-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--muted);
  margin-top: 2px;
}
.ws-digital-link-box {
  background: var(--blue-light);
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--blue);
}
.ws-digital-link-box a { color: var(--blue); text-decoration: none; }

.ws-meta-row {
  display: flex;
  gap: 20px;
  margin-top: 12px;
  font-weight: 600;
  font-size: 12px;
  color: var(--ink);
  flex-wrap: wrap;
}
.ws-fill-line {
  display: inline-block;
  border-bottom: 1.5px solid var(--ink);
}

/* Anchor Boxes */
.ws-anchor-box {
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1.5px solid var(--line);
}
.ws-support-anchor { background: #fffbeb; border-color: var(--amber-border); border-left: 5px solid var(--amber-dark); }
.ws-challenge-anchor { background: #faf5ff; border-color: var(--purple-border); border-left: 5px solid var(--purple-dark); }
.ws-anchor-title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: var(--navy);
  margin-bottom: 6px;
}
.ws-anchor-idea { font-size: 12.5px; margin-bottom: 6px; }
.ws-anchor-steps ol { margin-left: 20px; font-size: 12px; }
.ws-anchor-steps li { margin: 2px 0; }

/* Word Bank */
.ws-vocab-box { background: #f0fdf4; border-color: #bbf7d0; }
.ws-bankgrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 6px;
}
.ws-bank-card {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 11.5px;
}
.ws-bankword { font-weight: 800; color: #166534; }
.ws-es-term { color: #64748b; font-style: italic; font-weight: 500; }
.ws-bankdef { color: #475569; }

/* Problems Grid & Cards */
.ws-problems-grid {
  list-style: none;
  margin: 0;
  padding: 0;
}
.ws-problem-card {
  background: #ffffff;
  border: 1.5px solid var(--line-light);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 14px;
  break-inside: avoid;
  page-break-inside: avoid;
}
.ws-problem-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.ws-pnum {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--navy);
  color: #ffffff;
  font-weight: 800;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ws-pbadge {
  font-size: 10px;
  font-weight: 800;
  color: var(--muted);
  letter-spacing: 0.05em;
}
.ws-stem {
  font-size: 13.5px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1e293b;
}
.ws-prompt {
  font-size: 12.5px;
  color: var(--muted);
  margin: 6px 0;
}

/* Options */
.ws-opts {
  list-style: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  margin-top: 8px;
}
.ws-opt {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.ws-bub {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border: 1.8px solid var(--navy);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 11px;
}
.ws-bub-sm { width: 19px; height: 19px; font-size: 10px; }
.ws-opt-text { font-size: 13px; font-weight: 500; }
.ws-correct .ws-bub { background: var(--teal); border-color: var(--teal); color: #fff; }
.ws-correct .ws-opt-text { font-weight: 700; color: var(--teal); }

/* Workspaces */
.ws-work {
  border: 1.5px dashed var(--line);
  border-radius: 6px;
  min-height: 75px;
  padding: 8px 10px;
  margin-top: 8px;
  background: #fafbfc;
  background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px);
  background-size: 14px 14px;
}
.ws-work-tall { min-height: 110px; }
.ws-work-label {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ws-lines { margin: 6px 0; }
.ws-line { display: block; border-bottom: 1.5px solid var(--line); height: 24px; }

/* Division Frames */
${DIVISION_FIGURE_CSS}
.wsd-wrap {
  display: flex;
  gap: 16px;
  align-items: stretch;
  margin: 10px 0 12px;
}
.wsd-supported {
  background: #fdfbf7;
  border: 1.5px solid var(--amber-border);
  border-left: 4px solid var(--amber-dark);
  border-radius: 8px;
  padding: 10px 14px;
}
.wsd-frame {
  background: #ffffff;
  border: 1.5px solid var(--line);
  border-radius: 6px;
  padding: 8px;
  display: inline-block;
}
.wsd { display: block; }
.wsd-cell { fill: #f8fafc; stroke: #cbd5e1; stroke-width: 1; stroke-dasharray: 2 2; }
.wsd-rule { stroke: #0f172a; stroke-width: 2; }
.wsd-given { font-family: var(--font-body); font-size: 15px; font-weight: 700; fill: #0f172a; }
.wsd-rail { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0; min-width: 170px; }
.wsd-step { display: flex; align-items: center; gap: 8px; font-size: 11.5px; }
.wsd-step-n { width: 18px; height: 18px; border-radius: 50%; background: var(--navy); color: #ffffff; font-size: 10px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.wsd-step-t { font-weight: 800; color: var(--navy); }
.wsd-step-h { color: var(--muted); font-style: italic; font-size: 10.5px; }

/* ── Task-Responsive Workspace Scaffolds ─────────────────────────────────── */
.wss-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.wss-panel {
  background: #ffffff;
  border: 1.5px solid var(--line);
  border-radius: 6px;
  padding: 8px 12px;
}
.wss-panel-tight {
  padding: 6px 10px;
}
.wss-panel-t {
  display: block;
  font-size: 11px;
  font-weight: 800;
  color: var(--navy);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}
.wss-rules {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 4px 0 6px;
}
.wss-rule {
  display: block;
  border-bottom: 1.5px solid var(--line-light);
  height: 0;
}

/* 2-Column Equation & Algebra Ledger */
.wss-ledger {
  width: 100%;
  border-collapse: collapse;
  border: 1.5px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
  background: #ffffff;
}
.wss-ledger th {
  background: var(--navy);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 10px;
  text-align: left;
  letter-spacing: 0.02em;
}
.wss-ledger th:last-child {
  background: #334155;
  border-left: 1.5px solid #475569;
}
.wss-cell {
  border: 1px solid var(--line-light);
  height: 28px;
  padding: 4px 8px;
  font-family: var(--font-mono);
  font-size: 13px;
}
.wss-cell-why {
  background: #fafbfc;
  border-left: 1.5px solid var(--line);
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 12px;
}

/* Step-by-Step Slot Cards (Measure, Fraction, Statistics) */
.wss-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wss-slot {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1.5px solid var(--line);
  border-radius: 6px;
  padding: 6px 10px;
}
.wss-slot-t {
  flex: 0 0 160px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--navy);
}
.wss-slot-w {
  flex: 1;
  border-bottom: 1.5px solid var(--navy);
  height: 20px;
}

/* Proportional Ratio Table */
.wss-ratio {
  width: 100%;
  border-collapse: collapse;
  border: 1.5px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
  background: #ffffff;
}
.wss-ratio th {
  background: #e2e8f0;
  color: var(--navy);
  font-size: 11.5px;
  font-weight: 800;
  padding: 6px 10px;
  height: 24px;
}
.wss-row-per {
  background: #f0fdf4;
}
.wss-row-per .wss-cell {
  border-top: 1.5px solid #86efac;
  border-bottom: 1.5px solid #86efac;
}
.wss-per {
  display: inline-block;
  background: #166534;
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* 10-Segment Percent Benchmark Bar */
.wss-bar {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  height: 24px;
  border: 2px solid var(--navy);
  border-radius: 4px;
  overflow: hidden;
  background: #ffffff;
  margin-bottom: 4px;
}
.wss-bar span {
  border-right: 1px dashed var(--line);
  background: #ffffff;
}
.wss-bar span:last-child {
  border-right: none;
}
.wss-barlab {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  font-weight: 800;
  color: var(--navy);
  margin-bottom: 6px;
  padding: 0 2px;
}

/* Place Value Decimal Alignment Grid */
.wss-cols {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 6px 0;
}
.wss-col {
  width: 28px;
  height: 36px;
  border: 1px dashed var(--line);
  border-radius: 4px;
  background: #ffffff;
}

/* Tables */
.ws-table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
}
.ws-table th {
  background: var(--navy);
  color: #ffffff;
  font-size: 11.5px;
  padding: 6px 10px;
  text-align: left;
}
.ws-table td {
  border: 1px solid var(--line);
  padding: 8px 10px;
  font-size: 12.5px;
  font-weight: 600;
}

/* Matching & Sorting */
.ws-match { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; }
.ws-match-terms, .ws-match-bank { list-style: none; flex: 1; min-width: 180px; }
.ws-match-term { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-weight: 600; font-size: 12.5px; }
.ws-blank { display: inline-block; min-width: 44px; border-bottom: 1.5px solid var(--ink); text-align: center; font-weight: 800; }
.ws-blank-sm { min-width: 32px; }
.ws-match-bank { background: var(--soft); border: 1px solid var(--line); border-radius: 6px; padding: 8px 12px; }
.ws-match-bank li { display: flex; align-items: center; gap: 8px; margin: 4px 0; font-size: 12px; }

.ws-cats-bar { margin: 6px 0; font-size: 12px; }
.ws-cat-pill { background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 4px; padding: 2px 8px; font-weight: 700; color: #0369a1; }
.ws-sort-list { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin-top: 8px; }
.ws-sort-item { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; }

/* Steps */
.ws-steps-box { background: var(--soft); border: 1px solid var(--line); border-radius: 6px; padding: 8px 12px; margin: 8px 0; }
.ws-steps { list-style: none; }
.ws-steps li { display: flex; gap: 8px; align-items: baseline; padding: 3px 0; font-size: 12.5px; }
.ws-step-n { width: 18px; height: 18px; border-radius: 50%; background: #e2e8f0; font-size: 10.5px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; }
.ws-step-l { font-weight: 700; width: 35%; }
.ws-step-w { font-family: var(--font-mono); font-weight: 600; }

/* Discourse & CER */
.ws-discourse-box {
  background: #f0fdfa;
  border: 1.5px solid #99f6e4;
  border-radius: 8px;
  padding: 12px 16px;
  margin: 16px 0;
}
.ws-disc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.ws-disc-badge { font-size: 11px; font-weight: 800; color: var(--teal); letter-spacing: 0.04em; }
.ws-disc-prompt { font-size: 13px; margin-bottom: 8px; color: #134e4a; }
.ws-disc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ws-disc-card { background: #ffffff; border: 1px solid #ccfbf1; border-radius: 6px; padding: 8px 10px; font-size: 12px; color: #115e59; }

.ws-cer-section {
  background: var(--soft);
  border: 1.5px solid var(--line);
  border-radius: 8px;
  padding: 12px 16px;
  margin: 16px 0;
}
.ws-cer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.ws-cer-badge { font-size: 11px; font-weight: 800; color: var(--navy); letter-spacing: 0.04em; }
.ws-cer-prompt { font-size: 13px; margin-bottom: 8px; font-weight: 600; }
.ws-cer-table { display: flex; flex-direction: column; gap: 6px; }
.ws-cer-row { display: flex; gap: 10px; background: #ffffff; border: 1px solid var(--line-light); border-radius: 6px; padding: 8px 10px; }
.ws-cer-label { width: 90px; font-size: 12px; font-weight: 800; color: var(--navy); }
.ws-cer-cell { flex: 1; }
.ws-cer-prompt-hint { font-size: 11.5px; color: var(--muted); font-style: italic; display: block; margin-bottom: 4px; }

.ws-author-challenge-box {
  background: #faf5ff;
  border: 1.5px solid var(--purple-border);
  border-radius: 8px;
  padding: 12px 16px;
  margin: 16px 0;
}
.ws-author-head { font-size: 11.5px; font-weight: 800; color: var(--purple-dark); margin-bottom: 6px; letter-spacing: 0.04em; }
.ws-author-prompt { font-size: 12.5px; margin-bottom: 8px; color: #3b0764; }

/* Self-Check */
.ws-self-check-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 6px 14px;
  margin-top: 16px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--navy);
  flex-wrap: wrap;
  gap: 8px;
}
.ws-sc-box { display: inline-block; width: 13px; height: 13px; border: 1.5px solid var(--navy); border-radius: 3px; vertical-align: -2px; margin-right: 4px; }

/* Teacher Keys */
.ws-keynote { margin: 6px 0 0; color: var(--teal); font-size: 12px; font-weight: 600; background: #f0fdfa; border-left: 3px solid var(--teal); padding: 4px 8px; border-radius: 0 4px 4px 0; }
.ws-watch { margin: 6px 0 0; color: #9a4a12; font-size: 12px; background: #fff3e6; border-left: 3px solid #e08a3c; padding: 4px 8px; border-radius: 0 4px 4px 0; }

@media print {
  body { background: #ffffff !important; font-size: 11pt; }
  .ws-page { box-shadow: none !important; border: none !important; margin: 0 auto !important; max-width: none !important; padding: 0 !important; page-break-after: always; }
  .ws-page:last-child { page-break-after: auto; }
  .ws-digital-link-box { display: none !important; }
  @page { margin: 1.2cm; }
}
${EDITORIAL_OVERRIDES}
</style>
</head>
<body>
<main data-support-slot="practice">
${pages}
</main>
<script src="/shared/supports/print-supports.js" defer></script>
</body>
</html>`;
}

/* ==========================================================================
   7. MAIN RUNNER
   ========================================================================== */

function lessonDirs() {
  return readdirSync(LESSONS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(LESSONS, d.name, "config.json")))
    .map((d) => d.name)
    .sort();
}

function main() {
  const CHECK = process.argv.includes("--check");
  const stale = [];
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const dirs = lessonDirs().filter((d) => (only.length ? only.includes(d) : true));
  let written = 0,
    skipped = 0;

  for (const d of dirs) {
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(join(LESSONS, d, "config.json"), "utf8"));
    } catch {
      skipped++;
      continue;
    }

    const hasAny =
      ["approaching", "onLevel", "extending", "optional"].some((tier) =>
        (cfg.practice?.[tier] || []).some((p) => p && (p.type || p.stem || p.prompt)),
      ) ||
      Boolean(
        cfg.lessonId && (cfg.lessonId.includes("-group") || cfg.lessonId.includes("-catchup")),
      );

    if (!hasAny) {
      skipped++;
      continue;
    }

    const studentFile = join(LESSONS, d, "worksheet.html");
    const keyFile = join(LESSONS, d, "worksheet-answer-key.html");
    const studentHtml = buildWorksheet(cfg, { key: false });
    const keyHtml = buildWorksheet(cfg, { key: true });

    if (CHECK) {
      if (!isGeneratedFresh(studentFile, studentHtml)) stale.push(`lessons/${d}/worksheet.html`);
      if (!isGeneratedFresh(keyFile, keyHtml)) stale.push(`lessons/${d}/worksheet-answer-key.html`);
      continue;
    }

    writeGenerated(studentFile, studentHtml);
    writeGenerated(keyFile, keyHtml);
    written++;
  }

  if (CHECK) {
    if (stale.length) {
      console.error(
        `${stale.length} worksheet page(s) are STALE — the committed HTML no longer matches its config.json:\n  ${stale
          .slice(0, 15)
          .join("\n  ")}\n\nFix: node scripts/generate-worksheets.mjs`,
      );
      process.exit(1);
    }
    console.log(`Worksheets up to date (${dirs.length} lessons).`);
    return;
  }
  console.log(`Worksheets generated: ${written}  (skipped ${skipped})`);
}

main();
