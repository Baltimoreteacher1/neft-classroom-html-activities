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
 *   • lessons/<id>/worksheet.html                — Set A student practice printable
 *   • lessons/<id>/worksheet-answer-key.html     — Set A misconception-aware Teacher Answer Key
 *   • lessons/<id>/worksheet-2.html              — Set B student practice printable
 *   • lessons/<id>/worksheet-2-answer-key.html   — Set B Teacher Answer Key
 *
 * Set B is the second form of the same lesson — for re-teach, homework, a retake
 * or day two. It is composed ONLY of problems the lesson's author already wrote
 * and Set A does not print; see scripts/lib/worksheet-set-b.mjs for which pools
 * those are and why nothing here re-numbers an authored stem.
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
} from "@eduwonderlab/engine/core/division-walk-figure.js";
import { LESSONS_DIR as LESSONS, listLessonDirs } from "../tools/lib/curriculum-source.mjs";
import { EDITORIAL_OVERRIDES } from "./lib/editorial-print.mjs";
import { isGeneratedFresh, writeGenerated } from "./lib/preserve-injected.mjs";
import { scaffoldFor } from "./lib/worksheet-scaffolds.mjs";
import { kindOf, partTwoSplit, setBPages } from "./lib/worksheet-set-b.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
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
  return workBox("Workspace & Solution Steps", supported);
}

/* "Workspace & Solution Steps:" over ruled lines — the model worksheets give
   every problem somewhere to actually write, and a labelled dotted box was not
   that. The lines are the same .ws-line rule the rest of this sheet uses. */
function workBox(label = "Workspace & Solution Steps", tall = false) {
  const rules = tall ? 4 : 3;
  return `<div class="ws-work${tall ? " ws-work-tall" : ""}">
    <span class="ws-work-label">✏️ ${esc(label)}</span>
    <div class="ws-lines">${'<span class="ws-line"></span>'.repeat(rules)}</div>
  </div>`;
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
  // The choices come BEFORE the workspace: a student reads the question, sees
  // what kind of answer is wanted, and then works. The model worksheets put
  // "Workspace & Solution Steps" under the (A)–(D) block for the same reason.
  const work = key ? "" : workArea(it, { supported });
  return `<p class="ws-stem">${esc(stem)}</p><ol class="ws-opts">${opts}</ol>${work}${notes}`;
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

/**
 * guided-fill — a scaffolded solve: the question, then named steps the student
 * completes one at a time, then the final answer.
 *
 * Without this it fell to renderGeneric, which prints the stem over a blank box
 * and throws the scaffold away — on Apply Day, where the whole point of the item
 * is the steps. The key prints each step's own answer, so a teacher can see
 * WHERE a student came off, not only that the total was wrong.
 */
function renderGuidedFill(it, _n, key) {
  const stem = getStem(it);
  const steps = Array.isArray(it.steps) ? it.steps : [];

  const rows = steps
    .map((st, i) => {
      const prompt = esc(st.prompt || st.label || `Step ${i + 1}`);
      const filled = key ? esc(st.answer ?? "") : "";
      return `<li class="ws-gf-step"><span class="ws-step-n">${i + 1}</span><span class="ws-gf-prompt">${prompt}</span><span class="ws-blank${key ? " ws-correct" : ""}">${filled}</span></li>`;
    })
    .join("");

  const stepsHtml = rows ? `<ol class="ws-gf-steps">${rows}</ol>` : "";
  const finalLabel = key ? esc(it.answer ?? "") : "";
  const finalHtml = `<div class="ws-gf-final"><b>Final answer:</b> <span class="ws-blank ws-blank-lg${key ? " ws-correct" : ""}">${finalLabel}</span></div>`;

  let notes = "";
  if (key && it.explanation) {
    notes = `<p class="ws-keynote">💡 <b>Solution Rationale:</b> ${esc(it.explanation)}</p>`;
  }

  // No steps authored means there is no scaffold to print — fall back to a
  // workspace rather than an empty ordered list.
  const body = stepsHtml || (key ? "" : workBox("Workspace & Solution Steps", true));
  return `<p class="ws-stem">${esc(stem)}</p>${body}${finalHtml}${notes}`;
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
  else if (t === "guided-fill") body = renderGuidedFill(it, n, key);
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

/* ── Sections ──────────────────────────────────────────────────────────────
 *
 * Both model worksheets march through named sections rather than one flat run
 * of problems: conceptual/visual first, then computation, then contexts, then
 * writing and error analysis. The classifier below reads each item's own type
 * and stem, so a lesson's problems land where they belong without any authoring
 * change; a section with no problems is not printed. */
const WS_SECTIONS = [
  {
    key: "visual",
    name: "CONCEPTUAL UNDERSTANDING &amp; VISUAL MODELS",
    tag: "Visual Modeling",
  },
  {
    key: "fluency",
    name: "COMPUTATION &amp; PROCEDURAL FLUENCY",
    tag: "Show Every Step",
  },
  {
    key: "context",
    name: "REAL-WORLD CONTEXTS &amp; PROBLEM SOLVING",
    tag: "Applications",
  },
  {
    key: "writing",
    name: "MATHEMATICAL WRITING &amp; ERROR ANALYSIS",
    tag: "Reasoning &amp; Critique",
  },
];

const VISUAL_TYPES = new Set([
  "bar-model",
  "number-line",
  "area-model",
  "tape-diagram",
  "fraction-model",
  "drag-sort",
  "matching-game",
  "matching",
  "fill-table",
  "percent-grid",
  "balance-scale",
  "coordinate-plane",
  "dot-plot",
  "box-plot",
  "histogram",
  "bar-chart",
  "factor-tree",
]);
const WRITING_TYPES = new Set(["error-analysis", "open-response", "constructed-response"]);

function sectionOf(item) {
  const type = String(item?.type || "");
  if (WRITING_TYPES.has(type)) return "writing";
  if (VISUAL_TYPES.has(type)) return "visual";
  const stem = String(item?.stem || item?.prompt || "").trim();
  // "What does 3 ÷ 1/4 mean?", "Which expression means…" — meaning, not answer.
  if (
    /\b(what does|which expression|what is the meaning|which model|which real-world|which statement|matches)\b/i.test(
      stem,
    )
  )
    return "visual";
  // FLUENCY IS THE NARROW CASE, and it is recognised positively: a bare
  // computation is an instruction word (or nothing) wrapped around an
  // expression — "Calculate: 5 ÷ (1/2)", "What is 6 ÷ 1/5?". Listing context
  // verbs instead and defaulting to fluency put "A half-pan of brownies is
  // shared equally among 4 people" under Computation, because "shared" was not
  // on the list. Anything with prose in it is a context; that is what prose is.
  const bare = stem
    .replace(/^(what is|calculate|simplify|evaluate|solve|find|compute)\b[:\s]*/i, "")
    .replace(/[?.]$/, "")
    .trim();
  if (bare && /^[\d\s/×÷+\-*=().,^%$]+$/.test(bare)) return "fluency";
  if (!stem) return "fluency";
  return "context";
}

/** The problems grouped under their section headers, numbered continuously. */
function sectionedProblems(pool, renderOne) {
  const buckets = new Map(WS_SECTIONS.map((sc) => [sc.key, []]));
  pool.forEach((item) => buckets.get(sectionOf(item)).push(item));
  // A worksheet whose problems all land in one section gains nothing from a
  // header announcing it — print the plain list instead.
  const used = WS_SECTIONS.filter((sc) => buckets.get(sc.key).length);
  let n = 0;
  if (used.length < 2) {
    return `<ol class="ws-problems-grid">${pool.map((it) => renderOne(it, ++n)).join("")}</ol>`;
  }
  return used
    .map((sc, i) => {
      const items = buckets
        .get(sc.key)
        .map((it) => renderOne(it, ++n))
        .join("");
      return `<div class="ws-section-head"><span class="ws-section-n">SECTION ${i + 1}</span>
          <span class="ws-section-name">${sc.name}</span>
          <span class="ws-section-tag">[${sc.tag}]</span>
        </div>
        <ol class="ws-problems-grid">${items}</ol>`;
    })
    .join("");
}

/* ── Concept Summary & Guided Notes ────────────────────────────────────────
 *
 * The numbered notes block both model worksheets open with (Joel, 2026-08-28,
 * with Lesson 6-1 Core Practice and Advanced/GT as the models): the meanings or
 * laws, each with its worked example and key rule, then the strategy model,
 * then the word bank, then the trap.
 *
 * It replaces a one-line "Key Takeaway" which — because it read cfg.conceptIntro
 * on configs that store the worked example at cfg.launch.conceptIntro — was the
 * lesson's objective and nothing else on every worksheet in the fleet.
 *
 * Every line is the LESSON's own authored text. This composes; it does not
 * write mathematics. */

/* Reveal configs carry the worked example at launch.conceptIntro; reading only
   the top-level key is what emptied this block fleet-wide. */
function conceptIntroOf(cfg) {
  return (cfg && cfg.launch && cfg.launch.conceptIntro) || (cfg && cfg.conceptIntro) || {};
}

/** keyIdea is often "Title. 1. step 2. step 3. step" — split it into both. */
function splitKeyIdea(keyIdea) {
  const raw = String(keyIdea || "").trim();
  if (!raw) return { lead: "", steps: [] };
  const at = raw.search(/\b1\.\s/);
  if (at < 0) return { lead: raw, steps: [] };
  const lead = raw
    .slice(0, at)
    .replace(/[.\s]+$/, "")
    .trim();
  const steps = raw
    .slice(at)
    .split(/\s(?=\d+\.\s)/)
    .map((x) => x.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
  return { lead, steps };
}

function conceptSummaryBlock(cfg, { advanced = false } = {}) {
  const intro = conceptIntroOf(cfg);
  const heading = intro.heading || cfg.title || "Core Mathematical Strategy";
  let { lead, steps } = splitKeyIdea(intro.keyIdea);

  // Apply Day has no `launch.conceptIntro` — it states the rule it is applying
  // in `reviewHighlights` instead (rule + numbered steps + watchOut). Without
  // this the notes block on all 76 Part 2 sheets is a word bank and nothing
  // else, while the lesson's own worked procedure sits unread in the config.
  const highlights = cfg.reviewHighlights || {};
  if (!lead && highlights.rule) lead = highlights.rule;
  if (!steps.length && Array.isArray(highlights.steps)) {
    // The authored steps carry their own "1. " / "2. " prefixes; the renderer
    // numbers them, so printing both gives "1. 1. Put a 1 under…".
    steps = highlights.steps
      .map((x) =>
        String(x || "")
          .replace(/^\s*\d+[.)]\s*/, "")
          .trim(),
      )
      .filter(Boolean);
  }
  const iDoLines = Array.isArray(intro.iDo && intro.iDo.lines) ? intro.iDo.lines : [];
  const weDoLines = Array.isArray(intro.weDo && intro.weDo.lines) ? intro.weDo.lines : [];
  const vocab = (cfg.vocabulary || []).filter((v) => v && v.term).slice(0, 6);
  const mistake =
    cfg.practice?.commonMistake ||
    cfg.commonMistake ||
    cfg.reflect?.commonMistake ||
    highlights.watchOut ||
    "";
  const mistakeText =
    typeof mistake === "string" ? mistake : mistake?.text || mistake?.description || "";

  const points = [];

  if (intro.intro || lead) {
    points.push({
      title: lead || "The Big Idea",
      bullets: [intro.intro].filter(Boolean),
    });
  }

  if (steps.length) {
    points.push({
      title: advanced ? "The Structural Procedure" : "Strategy Model — step by step",
      bullets: steps,
      ordered: true,
    });
  }

  if (iDoLines.length) {
    points.push({
      title: `Worked Example${intro.iDo && intro.iDo.title ? ` — ${intro.iDo.title}` : ""}`,
      bullets: iDoLines,
      ordered: true,
    });
  }

  // The GT edition gets the "let's do one together" problem as a second model;
  // the core edition keeps the notes short so the practice starts sooner.
  if (advanced && weDoLines.length) {
    points.push({
      title: `Second Model${intro.weDo && intro.weDo.title ? ` — ${intro.weDo.title}` : ""}`,
      bullets: weDoLines,
      ordered: true,
    });
  }

  if (vocab.length) {
    points.push({
      title: "Mathematical Word Bank",
      bullets: vocab.map(
        (v) =>
          `${v.term}${v.termEs ? ` (${v.termEs})` : ""}${v.definition ? ` — ${v.definition}` : ""}`,
      ),
    });
  }

  if (mistakeText) {
    points.push({ title: "Watch out", bullets: [mistakeText], warn: true });
  }

  if (!points.length) return "";

  const body = points
    .map((pt, i) => {
      const tag = pt.ordered ? "ol" : "ul";
      const items = pt.bullets
        .map((b) => `<li>${esc(String(b).replace(/^\d+\.\s*/, ""))}</li>`)
        .join("");
      return `<div class="ws-note-point${pt.warn ? " ws-note-warn" : ""}">
        <div class="ws-note-head"><span class="ws-note-n">${i + 1}</span>${esc(pt.title)}</div>
        ${items ? `<${tag} class="ws-note-list">${items}</${tag}>` : ""}
      </div>`;
    })
    .join("");

  return `
    <section class="ws-anchor-box ws-notes-box">
      <div class="ws-anchor-title">&#9632; ${advanced ? "ADVANCED CONCEPT ANCHOR" : "CONCEPT SUMMARY &amp; GUIDED NOTES"}: ${esc(heading)}</div>
      ${body}
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

/* "Visual Models · Reciprocals · Keep-Change-Flip · Real-World Applications" —
   the strategy strip both model worksheets carry under the title. Built from
   the lesson's own vocabulary and the shapes of its practice items, so it names
   what this worksheet actually asks for and never a generic list. */
function strategyLine(cfg) {
  const parts = [];
  const pool = []
    .concat(
      cfg.practice?.approaching || [],
      cfg.practice?.onLevel || [],
      cfg.practice?.extending || [],
    )
    .filter(Boolean);
  const types = new Set(pool.map((p) => String(p.type || "")));
  const has = (...t) => t.some((x) => types.has(x));
  if (has("bar-model", "number-line", "area-model", "tape-diagram", "fraction-model"))
    parts.push("Visual Models");
  const terms = (cfg.vocabulary || [])
    .map((v) => v && v.term)
    .filter(Boolean)
    .slice(0, 2);
  parts.push(...terms);
  if (has("multiple-choice", "fill-table")) parts.push("Procedural Fluency");
  if (
    pool.some((p) => /\b(he|she|they|has|had|buys|cuts|makes|shares)\b/i.test(String(p.stem || "")))
  )
    parts.push("Real-World Applications");
  if (has("error-analysis", "open-response")) parts.push("Reasoning & Critique");
  return [...new Set(parts)].slice(0, 4).join(" · ");
}

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
          <div class="ws-rubric-score">MASTERY CHECK</div>
          <div class="ws-rubric-badges"><span class="ws-mastery">&#9744; Exceeds</span><span class="ws-mastery">&#9744; Meets Target</span><span class="ws-mastery">&#9744; Needs Practice</span></div>
        </div>
      </div>
      <div class="ws-title-group">
        <div class="ws-title-text-box">
          <h1 class="ws-main-title">${title}</h1>
          <p class="ws-sub-title">${esc(levelSub)}</p>
          ${strategyLine(cfg) ? `<p class="ws-strategy-line">${esc(strategyLine(cfg))}</p>` : ""}
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

  const itemsHtml = sectionedProblems(problems, (p, n) =>
    renderProblem(p, n, { key: isKey, supported: true, commonMistake }),
  );

  const anchorHtml = !isKey ? conceptSummaryBlock(cfg) : "";
  const bankHtml = "";
  const discHtml = cfg.explore?.discourse ? discourseCard(cfg.explore.discourse, true) : "";
  const cerHtml = cerWritingMatrix(cfg.cerWriting, true);
  const twrHtml = renderTWRSection(cfg);

  return `
    <section class="ws-page ws-group1-page">
      ${publisherHeader(cfg, "🟡 Group 1 · Support &amp; Scaffolding", "Tier 2 Intervention · Concrete-Representational-Abstract (CRA) · Dual-Language Anchors", isKey)}
      ${anchorHtml}
      ${bankHtml}
      ${itemsHtml}
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

  const itemsHtml = sectionedProblems(problems, (p, n) =>
    renderProblem(p, n, { key: isKey, supported: false, commonMistake }),
  );

  const anchorHtml = !isKey ? conceptSummaryBlock(cfg, { advanced: true }) : "";
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
      ${itemsHtml}
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

  const itemsHtml = sectionedProblems(problems, (p, n) =>
    renderProblem(p, n, { key: isKey, supported: true, commonMistake }),
  );

  return `
    <section class="ws-page ws-catchup-page">
      ${publisherHeader(cfg, "🔵 Prerequisite Catch-Up &amp; Skill Bridge", "Targeted Prerequisite Reinforcement · Visual Bridge to Grade 6 Standard", isKey)}
      ${!isKey ? conceptSummaryBlock(cfg) : ""}
      ${itemsHtml}
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
  { supported = false, isKey = false, extraScaffold = false, pageClass = "ws-core-tier-page" } = {},
) {
  const commonMistake = isKey ? cfg.practice?.commonMistake || "" : "";
  const itemsHtml = sectionedProblems(pool, (p, n) =>
    renderProblem(p, n, { key: isKey, supported, commonMistake }),
  );

  // The guided notes open EVERY edition now, not only the supported tiers —
  // both model worksheets carry them, and the Challenge tier is the one where
  // a student most needs the rule stated before a non-routine problem. The
  // stretch tier gets the fuller "Advanced Concept Anchor" shape.
  const notesHtml = isKey ? "" : conceptSummaryBlock(cfg, { advanced: !supported });
  const scaffoldBanner =
    extraScaffold && !isKey
      ? `<div class="ws-scaffold-note">🧩 <b>Built-in Scaffolding:</b> Use the visual word bank and worked models. Sentence frames are provided under each problem.</div>`
      : "";

  return `
    <section class="ws-page ${pageClass}">
      ${publisherHeader(cfg, label, sub, isKey)}
      ${notesHtml}
      ${scaffoldBanner}
      ${itemsHtml}
      ${cerWritingMatrix(cfg.cerWriting, supported)}
      ${!isKey ? studentSelfCheckBar() : ""}
    </section>
  `;
}

/* The page tint Set B keeps, so a Group 2 Set B still reads as Group 2 material
   rather than as a core sheet that wandered into the folder. */
const SET_B_PAGE_CLASS = {
  partTwo: "ws-core-tier-page",
  group1: "ws-group1-page",
  group2: "ws-group2-page",
  catchup: "ws-catchup-page",
  core: "ws-core-tier-page",
};

function buildWorksheet(cfg, { key = false, set = "A" } = {}) {
  const lessonId = cfg.lessonId || "";
  const title = esc(cfg.title || lessonId);
  const audience = key ? "teacher" : "student";
  const suffixBase = set === "B" ? "Practice Set B" : "Practice";
  const titleSuffix = key ? `${suffixBase} Answer Key` : `${suffixBase} Worksheet`;

  let pages = "";

  if (set === "B") {
    // Every Set B page runs through the one core builder: the reserve is a flat
    // list of practice items regardless of lesson kind, and the group-specific
    // extras on Set A (discourse card, author-your-own challenge) are once-per-
    // lesson activities, not something to hand out a second time.
    const pageClass = SET_B_PAGE_CLASS[kindOf(lessonId, cfg)] || "ws-core-tier-page";
    pages = setBPages(cfg)
      .map((p) =>
        buildCoreTierPage(cfg, p.pool, p.label, p.sub, {
          supported: p.supported,
          isKey: key,
          extraScaffold: false,
          pageClass,
        }),
      )
      .join("\n");
  } else if (lessonId.includes("-part2") || kindOf(lessonId, cfg) === "partTwo") {
    // Apply Day. Its practice is authored under `groupLevels.level1/2/3` rather
    // than under `practice.*`, which is why the generator skipped all 76 of
    // these lessons in silence. The tiers overlap as authored, so the split is
    // computed once in worksheet-set-b.mjs and both sheets read it — including
    // the decision NOT to print tier pages for a lesson whose "three tiers" are
    // one pool copied three times.
    const split = partTwoSplit(cfg);
    const TIER_META = [
      {
        label: "Apply Day · Version A",
        sub: "Supported Application · Guided Entry to Today's Problem",
        supported: true,
      },
      {
        label: "Apply Day · Version B",
        sub: "On-Level Application · Standard Rigor",
        supported: false,
      },
      {
        label: "Apply Day · Challenge",
        sub: "Extension &amp; Non-Routine Application",
        supported: false,
      },
    ];
    const SINGLE_META = {
      label: "Apply Day · Practice",
      sub: "Application Practice for Today's Problem",
      supported: true,
    };
    pages = split.setA
      .map((pool, i) => ({ pool, ...(split.tiered ? TIER_META[i] : SINGLE_META) }))
      .filter((t) => t.pool.length)
      .map((t) =>
        buildCoreTierPage(cfg, t.pool, t.label, t.sub, {
          supported: t.supported,
          isKey: key,
          extraScaffold: false,
        }),
      )
      .join("\n");
  } else if (lessonId.includes("-group1")) {
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
  padding: 8px 10px 2px;
  margin-top: 8px;
  background: #fafbfc;
}
.ws-work-tall { min-height: 110px; }
.ws-work-label {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
/* ── Mastery check, guided notes and sections (model-worksheet shape) ── */
.ws-rubric-badges { display: flex; gap: 10px; }
.ws-mastery { white-space: nowrap; font-weight: 700; }
.ws-strategy-line {
  margin: 3px 0 0;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--muted);
  letter-spacing: 0.02em;
}
.ws-notes-box { break-inside: avoid; }
.ws-note-point { margin-top: 8px; }
.ws-note-head {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  font-weight: 800;
  color: var(--navy);
}
.ws-note-n {
  display: inline-grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--navy);
  color: #fff;
  font-size: 9.5px;
  font-weight: 800;
}
.ws-note-list {
  margin: 4px 0 0;
  padding-left: 30px;
  font-size: 11px;
  line-height: 1.5;
}
.ws-note-list > li { margin-bottom: 2px; }
.ws-note-warn .ws-note-head { color: #9a3412; }
.ws-note-warn .ws-note-n { background: #9a3412; }
.ws-section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 0 6px;
  padding: 5px 10px;
  border-radius: 5px;
  background: var(--navy);
  color: #fff;
  break-after: avoid;
}
.ws-section-n {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  opacity: 0.75;
  white-space: nowrap;
}
.ws-section-name { font-size: 11.5px; font-weight: 800; letter-spacing: 0.02em; }
.ws-section-tag {
  margin-left: auto;
  font-size: 9.5px;
  font-weight: 700;
  opacity: 0.85;
  white-space: nowrap;
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
.ws-gf-steps { list-style: none; margin: 8px 0 0; padding: 0; }
.ws-gf-step { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px dotted var(--line); }
.ws-gf-prompt { flex: 0 1 auto; font-size: 12.5px; }
.ws-gf-step .ws-blank { flex: 1 1 90px; min-width: 90px; }
.ws-gf-final { margin-top: 10px; font-size: 12.5px; }
.ws-blank-lg { display: inline-block; min-width: 150px; }
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
  return listLessonDirs();
}

function main() {
  const CHECK = process.argv.includes("--check");
  const stale = [];
  const missingSetB = [];
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
      ) ||
      // Apply Day authors its practice under groupLevels, not practice.*. Asking
      // only about `practice` is what skipped all 76 of these lessons silently.
      ["level1", "level2", "level3"].some((lvl) =>
        (cfg.groupLevels?.[lvl] || []).some((p) => p && (p.type || p.stem || p.prompt)),
      );

    if (!hasAny) {
      skipped++;
      continue;
    }

    // Set B is skipped, not emitted empty, when a lesson has no reserve — a
    // worksheet with a header and no problems is worse than no second sheet.
    const hasSetB = setBPages(cfg).length > 0;
    const outputs = [
      ["worksheet.html", buildWorksheet(cfg, { key: false })],
      ["worksheet-answer-key.html", buildWorksheet(cfg, { key: true })],
    ];
    if (hasSetB) {
      outputs.push(
        ["worksheet-2.html", buildWorksheet(cfg, { key: false, set: "B" })],
        ["worksheet-2-answer-key.html", buildWorksheet(cfg, { key: true, set: "B" })],
      );
    } else {
      missingSetB.push(d);
    }

    if (CHECK) {
      for (const [name, html] of outputs) {
        if (!isGeneratedFresh(join(LESSONS, d, name), html)) stale.push(`lessons/${d}/${name}`);
      }
      continue;
    }

    for (const [name, html] of outputs) writeGenerated(join(LESSONS, d, name), html);
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
  console.log(
    `Worksheets generated: ${written} lessons × Set A + Set B  (skipped ${skipped})` +
      (missingSetB.length
        ? `\n  no Set B reserve (Set A only): ${missingSetB.join(", ")}`
        : "\n  every lesson has a Set B."),
  );
}

main();
