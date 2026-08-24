#!/usr/bin/env node
/**
 * generate-worksheets.mjs — print-ready practice worksheets, one per lesson.
 *
 * Each lesson gets two print files:
 *   • lessons/<id>/worksheet.html              — student practice pages only
 *   • lessons/<id>/worksheet-answer-key.html   — matching Answer Key per page
 *
 * Keys used to live in the student file. That route is public (hub search,
 * small-group launcher, student download presets) and isTeacherSurface() does
 * not match "worksheet". The key filename contains "answer-key", which the
 * frozen teacher-surface predicate already gates — so this split does not
 * retouch the auth pin. Up to FOUR practice pages per file:
 *   • Level 0    — most-supported (3-4 gentlest items, word bank + worked
 *                  example + sentence frames on every problem). From the easiest
 *                  slice of practice.approaching with an extra-scaffold banner.
 *   • Version A  — built-in support (word bank, worked example, sentence frames).
 *                  Sourced from practice.approaching.
 *   • Version B  — on-level practice. Sourced from practice.onLevel.
 *   • Challenge  — enrichment. Sourced from practice.extending.
 * This mirrors the repo-wide L0 < L1 < L2 tiering. Labels are intentionally
 * neutral ("Level 0 / Version A / Version B / Challenge") — no IEP/ESOL wording
 * is shown to students.
 *
 * Answer keys are misconception-aware: multiple-choice keys append a "Watch for"
 * cue from the item's watchFor/distractorRationale or the lesson's shared
 * practice.commonMistake; open-response keys surface sampleAnswer + keywords;
 * error-analysis keys use the canonical errorStep + correctWork + explanation
 * schema (see ERROR_ANALYSIS_SCHEMA below).
 *
 * Source of truth: each lessons/<id>/config.json (practice tiers + vocabulary).
 * Re-run after editing configs:  npm run generate-worksheets
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
/* The same drawer the lesson and the small-group shell use for the vertical
 * tableau. Importing it rather than re-drawing one here is the point: a worked
 * example that models a DIFFERENT house from the one on screen is the drift
 * this repo keeps paying for. Dependency-free by design, so a print script can
 * use it. */
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

/**
 * ERROR_ANALYSIS_SCHEMA — canonical config shape for `type: "error-analysis"`
 * practice items, shared by generate-worksheets.mjs, generate-homework.mjs, and
 * generate-homework-html.mjs so the same config produces consistent keys:
 *   {
 *     type: "error-analysis",
 *     title: string,                 // student-facing prompt heading
 *     workedExample: [{ label, work }],
 *     errorStep: number,             // 0-based index into workedExample (the wrong step)
 *     correctWork: string,           // the corrected calculation / fix
 *     explanation?: string           // optional: WHY the step is wrong (misconception)
 *   }
 * Legacy fields `correction`/`it.explanation`-as-fix are NOT read anymore.
 */

/* ---------- SVG mathematical model builders (print-safe, inline) ---------- */
const DATA_1 = "#0f8a84"; // teal - primary series
const DATA_2 = "#c2603f"; // clay - second series
const DATA_3 = "#b07d12"; // ochre - third series
const DATA_4 = "#3b6ea5"; // blue - fourth series

function figureWrap(svgHtml, title = "", caption = "") {
  if (!svgHtml) return "";
  const titleHtml = title
    ? `<div class="ws-fig-title" style="font-weight:700;font-size:12px;color:var(--navy);margin-bottom:4px;text-align:center;">${esc(title)}</div>`
    : "";
  const capHtml = caption
    ? `<div class="ws-fig-cap" style="font-size:11px;color:var(--muted);font-style:italic;margin-top:4px;text-align:center;">${esc(caption)}</div>`
    : "";
  return `<div class="ws-figure-wrap" style="margin:8px 0;display:flex;flex-direction:column;align-items:center;">${titleHtml}${svgHtml}${capHtml}</div>`;
}

function renderNumberLineSvg(cfg) {
  const min = Number(cfg.min ?? 0);
  const max = Number(cfg.max ?? 10);
  const step = Number(cfg.step ?? 1);
  const W = 480,
    H = 80,
    padL = 28,
    padR = 28,
    y = 38;
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
    ticks += `<line x1="${xOf(v).toFixed(1)}" y1="${y - 5}" x2="${xOf(v).toFixed(1)}" y2="${y + 5}" stroke="#263238" stroke-width="1.5"/>`;
    if (showLabel) {
      ticks += `<text x="${xOf(v).toFixed(1)}" y="${y + 19}" text-anchor="middle" font-size="11" fill="#263238" font-family="Hanken Grotesk,sans-serif">${+v.toFixed(2)}</text>`;
    }
  }

  let pts = "";
  (cfg.points || []).forEach((p) => {
    const val = Number(p.value != null ? p.value : p);
    if (!Number.isFinite(val)) return;
    const px = xOf(val);
    pts += `<circle cx="${px.toFixed(1)}" cy="${y}" r="6" fill="${DATA_2}" stroke="#ffffff" stroke-width="2"/>`;
    if (p.label) {
      pts += `<text x="${px.toFixed(1)}" y="${y - 10}" text-anchor="middle" font-size="11" font-weight="700" fill="${DATA_2}" font-family="Hanken Grotesk,sans-serif">${esc(p.label)}</text>`;
    }
  });

  const axis =
    `<line x1="${padL - 8}" y1="${y}" x2="${W - padR + 8}" y2="${y}" stroke="#263238" stroke-width="2"/>` +
    `<polygon points="${W - padR + 12},${y} ${W - padR + 4},${y - 4} ${W - padR + 4},${y + 4}" fill="#263238"/>` +
    `<polygon points="${padL - 12},${y} ${padL - 4},${y - 4} ${padL - 4},${y + 4}" fill="#263238"/>`;

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Number line from ${min} to ${max}" style="background:white;max-width:100%;height:auto;border:1px solid #d7e2ed;border-radius:8px;padding:4px;">${axis}${ticks}${pts}</svg>`;
  return figureWrap(svg, cfg.title, cfg.caption);
}

function renderCoordPlaneSvg(cfg) {
  const m = Number(cfg.max ?? 6);
  const W = 280,
    H = 280,
    pad = 20;
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
    grid += `<line x1="${X(i)}" y1="${pad}" x2="${X(i)}" y2="${H - pad}" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>`;
    grid += `<line x1="${pad}" y1="${Y(i)}" x2="${W - pad}" y2="${Y(i)}" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>`;
    if (i !== 0 && i % stride === 0) {
      grid += `<text x="${X(i)}" y="${cy + 12}" text-anchor="middle" font-size="9" fill="#64748b">${i}</text>`;
      grid += `<text x="${cx - 4}" y="${Y(i) + 3}" text-anchor="end" font-size="9" fill="#64748b">${i}</text>`;
    }
  }

  const axes =
    `<line x1="${pad}" y1="${cy}" x2="${W - pad}" y2="${cy}" stroke="#1e293b" stroke-width="1.75"/>` +
    `<line x1="${cx}" y1="${pad}" x2="${cx}" y2="${H - pad}" stroke="#1e293b" stroke-width="1.75"/>` +
    `<text x="${W - pad + 6}" y="${cy + 3}" font-size="10" font-weight="700" fill="#1e293b">x</text>` +
    `<text x="${cx + 4}" y="${pad - 4}" font-size="10" font-weight="700" fill="#1e293b">y</text>`;

  const rawPts = (cfg.points || []).map((p) => ({
    x: Number(p.x),
    y: Number(p.y),
    label: p.label,
  }));

  let outline = "";
  if (rawPts.length >= 3) {
    const gx = rawPts.reduce((s, p) => s + p.x, 0) / rawPts.length;
    const gy = rawPts.reduce((s, p) => s + p.y, 0) / rawPts.length;
    const ring = rawPts
      .slice()
      .sort((a, b) => Math.atan2(a.y - gy, a.x - gx) - Math.atan2(b.y - gy, b.x - gx));
    const poly = ring.map((p) => `${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(" ");
    outline = `<polygon points="${poly}" fill="rgba(31,166,162,0.12)" stroke="#0d9488" stroke-width="2"/>`;
  }

  let pts = "";
  rawPts.forEach((p) => {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const px = X(p.x),
      py = Y(p.y);
    const lbl = p.label || `(${p.x}, ${p.y})`;
    pts +=
      `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5" fill="${DATA_2}" stroke="#fff" stroke-width="1.5"/>` +
      `<text x="${(px + 6).toFixed(1)}" y="${(py - 6).toFixed(1)}" font-size="10" font-weight="700" fill="#0f172a">${esc(lbl)}</text>`;
  });

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Coordinate plane from -${m} to ${m}" style="background:white;max-width:100%;height:auto;border:1px solid #d7e2ed;border-radius:8px;padding:4px;">${grid}${axes}${outline}${pts}</svg>`;
  return figureWrap(svg, cfg.title, cfg.caption);
}

function renderTapeDiagramSvg(cfg) {
  const rows = Array.isArray(cfg.rows) ? cfg.rows : [];
  if (!rows.length) return "";
  const W = 460,
    padL = 8,
    padR = 8,
    rowH = 34,
    gap = 10,
    labelW = 80;
  const H = 16 + rows.length * (rowH + gap);
  const palette = [DATA_1, DATA_2, DATA_3, DATA_4];
  const totals = rows.map((r) => (r.parts || []).reduce((s, p) => s + (Number(p.value) || 0), 0));
  const maxTotal = Math.max(...totals, 1);
  const trackW = W - padL - padR - labelW;

  let y = 10;
  let body = "";
  rows.forEach((r) => {
    let x = padL + labelW;
    let segs = "";
    (r.parts || []).forEach((p, i) => {
      const w = ((Number(p.value) || 0) / maxTotal) * trackW;
      const fill = p.fill || palette[i % palette.length];
      const lbl = p.label != null ? p.label : p.value;
      segs +=
        `<rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(0, w - 2).toFixed(1)}" height="${rowH}" rx="3" fill="${fill}"/>` +
        `<text x="${(x + w / 2).toFixed(1)}" y="${y + rowH / 2 + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Hanken Grotesk,sans-serif">${esc(lbl)}</text>`;
      x += w;
    });
    const rowLabel = `<text x="${padL}" y="${y + rowH / 2 + 4}" font-size="11" font-weight="700" fill="#1e293b" font-family="Hanken Grotesk,sans-serif">${esc(r.label || "")}</text>`;
    body += rowLabel + segs;
    y += rowH + gap;
  });

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tape diagram model" style="background:white;max-width:100%;height:auto;border:1px solid #d7e2ed;border-radius:8px;padding:4px;">${body}</svg>`;
  return figureWrap(svg, cfg.title, cfg.caption);
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
        `<circle cx="${el.x}" cy="${el.y}" r="14" fill="${el.fill}" stroke="${el.stroke}" stroke-width="1.75"/>` +
        `<text x="${el.x}" y="${el.y + 4}" font-size="11" font-weight="700" fill="${el.textColor}" text-anchor="middle" font-family="Hanken Grotesk,sans-serif">${esc(el.value)}</text>`;
    }
  });

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Factor tree diagram" style="background:white;max-width:100%;height:auto;border:1px solid #d7e2ed;border-radius:8px;padding:4px;">${inner}</svg>`;
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
      `<text x="${(x + w / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#1e293b">${v}</text>` +
      `<text x="${(x + w / 2).toFixed(1)}" y="${(baseY + 14).toFixed(1)}" text-anchor="middle" font-size="10" fill="#475569">${esc(b.label ?? "")}</text>`;
  });

  const axis = `<line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="#334155" stroke-width="1.5"/>`;
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart" style="background:white;max-width:100%;height:auto;border:1px solid #d7e2ed;border-radius:8px;padding:4px;">${axis}${rects}</svg>`;
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
      `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#1e293b">${v}</text>` +
      `<text x="${(x + bw / 2).toFixed(1)}" y="${(baseY + 14).toFixed(1)}" text-anchor="middle" font-size="9" fill="#475569">${esc(b.label ?? "")}</text>`;
  });

  const axis = `<line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="#334155" stroke-width="1.5"/>`;
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Histogram" style="background:white;max-width:100%;height:auto;border:1px solid #d7e2ed;border-radius:8px;padding:4px;">${axis}${rects}</svg>`;
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
      `<text x="${x.toFixed(1)}" y="${baseY + 16}" text-anchor="middle" font-size="10" fill="#334155">${v}</text>`;
  }

  const axis = `<line x1="${padL - 6}" y1="${baseY}" x2="${W - padR + 6}" y2="${baseY}" stroke="#334155" stroke-width="2"/>`;
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dot plot" style="background:white;max-width:100%;height:auto;border:1px solid #d7e2ed;border-radius:8px;padding:4px;">${axis}${ticks}${dots}</svg>`;
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
      `<text x="${x.toFixed(1)}" y="${axisY + 14}" text-anchor="middle" font-size="9" fill="#64748b">${v}</text>`;
  }
  const axis = `<line x1="${padL}" y1="${axisY}" x2="${W - padR}" y2="${axisY}" stroke="#64748b" stroke-width="1.5"/>`;

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Box plot" style="background:white;max-width:100%;height:auto;border:1px solid #d7e2ed;border-radius:8px;padding:4px;">${box}${axis}${ticks}</svg>`;
  return figureWrap(svg, cfg.title, cfg.caption);
}

function renderPercentGridSvg(cfg) {
  const pct = Math.max(0, Math.min(100, Number(cfg.percent ?? cfg.value ?? 25)));
  const size = 160,
    pad = 10,
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
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="100-square grid with ${pct} squares shaded" style="background:white;border:1px solid #d7e2ed;border-radius:6px;padding:2px;">${cells}</svg>`;
  return figureWrap(svg, cfg.title, cfg.caption);
}

function renderFractionModelSvg(cfg) {
  const num = Number(cfg.numerator ?? 1);
  const den = Math.max(1, Number(cfg.denominator ?? 4));
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
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Fraction bar showing ${num} out of ${den} parts" style="background:white;max-width:100%;height:auto;border:1px solid #d7e2ed;border-radius:6px;">${parts}</svg>`;
  return figureWrap(svg, cfg.title, cfg.caption);
}

function renderPolygonSvg(spec) {
  const sides = Number(spec.sides || 6);
  const size = 100,
    c = size / 2,
    r = c - 8;
  const pt = (i) => {
    const a = (2 * Math.PI * i) / sides - Math.PI / 2;
    return [
      Math.round((c + Math.cos(a) * r) * 10) / 10,
      Math.round((c + Math.sin(a) * r) * 10) / 10,
    ];
  };
  let wedges = "";
  for (let i = 0; i < sides; i++) {
    const [x1, y1] = pt(i),
      [x2, y2] = pt(i + 1);
    wedges += `<polygon points="${c},${c} ${x1},${y1} ${x2},${y2}" fill="${i % 2 === 0 ? "rgba(31,166,162,0.12)" : "rgba(31,166,162,0.06)"}" stroke="#0d9488" stroke-width="1.5"/>`;
  }
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Regular polygon with ${sides} sides" style="background:white;display:block;margin:4px auto;">${wedges}</svg>`;
  return figureWrap(svg, spec.title, spec.caption);
}

function renderDataChipsHtml(cfg) {
  const values = Array.isArray(cfg.values) ? cfg.values : [];
  if (!values.length) return "";
  const chips = values
    .map(
      (v) =>
        `<span style="background:#eef6ff;border:1px solid #b9d5f7;border-radius:6px;padding:3px 8px;font-weight:700;font-size:12px;color:var(--navy);">${esc(v)}</span>`,
    )
    .join(" ");
  return `<div style="margin:6px 0;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">${cfg.title ? `<span style="font-weight:600;font-size:11px;color:var(--muted);">${esc(cfg.title)}:</span> ` : ""}${chips}</div>`;
}

function renderProblemDiagram(it) {
  const d = it.diagram || it.visual || it.figure;
  if (d && typeof d === "object") {
    const kind = d.kind || d.type || "";
    if (kind === "number-line" || kind === "numberLine") return renderNumberLineSvg(d);
    if (kind === "coordinate-plane" || kind === "coord-plane" || kind === "coordPlane")
      return renderCoordPlaneSvg(d);
    if (kind === "tape-diagram" || kind === "tapeDiagram" || kind === "bar-model")
      return renderTapeDiagramSvg(d);
    if (kind === "factor-tree" || kind === "factorTree") return renderFactorTreeSvg(d);
    if (kind === "histogram") return renderHistogramSvg(d);
    if (kind === "bar-chart" || kind === "barChart") return renderBarChartSvg(d);
    if (kind === "dot-plot" || kind === "dotPlot") return renderDotPlotSvg(d);
    if (kind === "box-plot" || kind === "boxPlot") return renderBoxPlotSvg(d);
    if (kind === "regular-polygon") return renderPolygonSvg(d);
    if (kind === "percent-grid") return renderPercentGridSvg(d);
    if (kind === "fraction-model" || kind === "area-model") return renderFractionModelSvg(d);
    if (kind === "data-chips") return renderDataChipsHtml(d);
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
  if (it.shape === "regular-polygon") {
    return renderPolygonSvg(it);
  }
  return "";
}

/* ---------- helpers ------------------------------------------------------- */
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

function lessonDirs() {
  return readdirSync(LESSONS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(LESSONS, d.name, "config.json")))
    .map((d) => d.name)
    .sort();
}

/* ---------- vertical work space ------------------------------------------
 *
 * The gap this closes: a computational multiple-choice item rendered as a stem
 * and four bubbles, and nothing else. A student asked "What is 936 ÷ 12?" has
 * to run the long-division algorithm somewhere, and the sheet gave them
 * nowhere — so they either work in the margin, on a separate page, or (the
 * common case in a support group) guess between the four numbers. The answer
 * bubbles are the LAST step of the work; the sheet has to hold the rest of it.
 */

/** Parse "a ÷ b" (or "a divided by b") out of a stem. Commas and $ stripped. */
function divisionInStem(stem) {
  const text = String(stem || "").replace(/[,$]/g, "");
  /* `÷` and "divided by" only — NOT a slash. "5/6 as tall as One World Trade
   * Center" is a fraction, and reading its slash as division printed a
   * long-division house on every fraction item in the lesson: the wrong
   * scaffold, which tells a student the problem is a kind of problem it is
   * not. This curriculum writes long division with ÷ throughout. */
  const m = /(\d+(?:\.\d+)?)\s*(?:÷|\bdivided by\b)\s*(\d+(?:\.\d+)?)/i.exec(text) || null;
  if (!m) return null;
  const dividend = m[1];
  const divisor = m[2];
  // A decimal on either side is a different algorithm with a different frame;
  // this one is the whole-number tableau only.
  if (dividend.includes(".") || divisor.includes(".")) return null;
  if (dividend.length > 7 || divisor.length > 3) return null;
  return { dividend, divisor };
}

/* The long-division house, drawn empty for the student to fill.
 *
 * Deliberately a PLACE-COLUMN grid rather than an open box: one faint cell per
 * dividend digit, above the bar and below it. That is the scaffold the
 * algorithm actually needs — `division-quotient-missing-zero` (a dropped
 * placeholder zero) is this lesson's named error, and it happens precisely
 * because a digit gets written in the wrong column or not at all. A blank
 * rectangle cannot catch that; a column can. */
function longDivisionFrame({ dividend, divisor }, { extraRows = 0 } = {}) {
  const U = 30; // one place column
  const R = 34; // one work row
  const digits = String(dividend).split("");
  const quotientDigits = Math.max(
    1,
    String(Math.floor(Number(dividend) / Math.max(1, Number(divisor)))).length,
  );
  const rows = Math.min(9, Math.max(3, quotientDigits * 2 + extraRows));
  const left = (String(divisor).length + 1) * U;
  const width = left + digits.length * U + U / 2;
  const top = R; // quotient row sits above the bar
  const height = top + R + rows * R + 8;
  const barY = top + 6;
  const colX = (i) => left + i * U + U / 2;

  const parts = [];
  // Quotient cells — one per place, so a missing digit is visible as a gap.
  digits.forEach((_, i) => {
    parts.push(
      `<rect class="wsd-cell" x="${colX(i) - U / 2 + 3}" y="${top - R + 8}" width="${U - 6}" height="${R - 12}" rx="3"/>`,
    );
  });
  // The house: divisor outside, curved bracket, bar over the dividend.
  // Right-aligned so it sits against the bracket. Drawing it from the left
  // margin instead leaves a gap the width of the longest divisor the sheet
  // happens to contain, which reads as a missing digit.
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
  // Work rows, ruled by column so subtraction stacks stay in place value.
  for (let r = 0; r < rows; r += 1) {
    const y = top + R + r * R;
    digits.forEach((_, i) => {
      parts.push(
        `<rect class="wsd-cell" x="${colX(i) - U / 2 + 3}" y="${y + 4}" width="${U - 6}" height="${R - 12}" rx="3"/>`,
      );
    });
  }
  return `<svg class="wsd" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Blank long-division frame for ${esc(dividend)} divided by ${esc(divisor)}, with one column per place value.">${parts.join("")}</svg>`;
}

/* The cycle, written down the page instead of across it. Support tiers get the
 * four moves as labelled rails beside the frame so the student can see which
 * move they are on; on-level gets the frame alone. */
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

/**
 * The work space for one problem, chosen by what the problem actually asks.
 * Returns "" for items where a work box is noise (matching, sorting, a written
 * explanation that already has ruled lines).
 */
function workArea(it, { supported = false } = {}) {
  const div = divisionInStem(it?.stem);
  if (div) {
    return `<div class="wsd-wrap${supported ? " wsd-supported" : ""}">
      <div class="wsd-frame">${longDivisionFrame(div, { extraRows: supported ? 1 : 0 })}</div>
      ${supported ? divisionCycleRail() : ""}
    </div>`;
  }
  /* Everything else the library can recognise — a ratio table grown down the
   * page, a formula/substitute/unit frame, a solve ledger, a 10% ladder. It
   * returns null unless the item is unambiguously that kind of problem, and a
   * plain box is the right answer for the rest: a scaffold that guesses tells
   * the student the problem is a kind of problem it is not. */
  const scaffold = scaffoldFor(it, { supported });
  if (scaffold) return scaffold.html;
  return workBox(supported ? "Show every step here" : "Show your work");
}

function blankLines(n = 3) {
  return `<div class="ws-lines">${'<span class="ws-line"></span>'.repeat(n)}</div>`;
}
function workBox(label = "Show your work") {
  return `<div class="ws-work"><span class="ws-work-label">${esc(label)}</span></div>`;
}

/* ---------- per-problem print renderers ----------------------------------- */
function renderMC(it, _n, key, commonMistake, supported = false) {
  const opts = (it.choices || [])
    .map((c, i) => {
      const correct = key && i === it.correctIndex;
      return `<li class="ws-opt${correct ? " ws-correct" : ""}"><span class="ws-bub">${letters[i]}</span>${esc(c)}</li>`;
    })
    .join("");
  let notes = "";
  if (key) {
    if (it.explanation) notes += `<p class="ws-keynote">${esc(it.explanation)}</p>`;
    // Misconception-aware teacher cue: prefer an item-level watch-for, else the
    // lesson's shared commonMistake. Distinct styling so it reads as a warning.
    const watch = it.watchFor || it.distractorRationale || commonMistake;
    if (watch) notes += `<p class="ws-watch"><b>Watch for:</b> ${esc(watch)}</p>`;
  }
  /* The bubbles are the last step, not the work. A computational stem gets the
   * space its algorithm needs BEFORE the choices, so the sheet reads
   * problem → work → answer rather than problem → guess. The key skips it:
   * a teacher copy does not need blank space. */
  const work = key ? "" : workArea(it, { supported });
  return `<p class="ws-stem">${esc(it.stem)}</p>${work}<ol class="ws-opts">${opts}</ol>${notes}`;
}

function renderMatching(it, _n, key) {
  const pairs = it.pairs || [];
  // One deterministic bank order, shared by the practice sheet and the key, so
  // the answer-key letters line up with what the student sees.
  const bank = shuffle(pairs.map((p) => p.match));
  const terms = pairs
    .map((p) => {
      const letter = letters[bank.indexOf(p.match)] || "";
      return `<li class="ws-match-term"><span class="ws-blank ws-blank-sm">${key ? esc(letter) : ""}</span>${esc(p.term)}</li>`;
    })
    .join("");
  const bankHtml = bank
    .map((m, i) => `<li><span class="ws-bub ws-bub-sm">${letters[i]}</span>${esc(m)}</li>`)
    .join("");
  return `<p class="ws-stem">Write the letter of the matching answer next to each.</p>
  <div class="ws-match"><ol class="ws-match-terms">${terms}</ol><ul class="ws-match-bank">${bankHtml}</ul></div>`;
}

function renderErrorAnalysis(it, _n, key) {
  const steps = (it.workedExample || [])
    .map(
      (s, i) =>
        `<li><span class="ws-step-n">${i + 1}</span><span class="ws-step-l">${esc(s.label)}</span><span class="ws-step-w">${esc(s.work)}</span></li>`,
    )
    .join("");
  // Canonical error-analysis schema (see ERROR_ANALYSIS_SCHEMA): errorStep
  // (0-based index of the wrong step) + correctWork (the fix) + explanation
  // (why it's wrong). Build a misconception-aware key from those fields.
  let keyHtml = "";
  if (key) {
    const parts = [];
    if (typeof it.errorStep === "number") parts.push(`The mistake is in Step ${it.errorStep + 1}.`);
    if (it.correctWork) parts.push(`Correct work: ${it.correctWork}`);
    if (it.explanation) parts.push(it.explanation);
    keyHtml = `<p class="ws-keynote">${esc(parts.join(" ") || "See worked solution.")}</p>`;
  }
  return `<p class="ws-stem">${esc(it.title || "Find the mistake")}</p>
  <ol class="ws-steps">${steps}</ol>
  <p class="ws-prompt">Which step has the mistake? Explain it and write the correct work.</p>
  ${key ? keyHtml : blankLines(3)}`;
}

function renderFillTable(it, _n, key) {
  const cols = it.columns || [];
  const head = cols.map((c) => `<th>${esc(c)}</th>`).join("");
  const rows = (it.rows || [])
    .map((r) => {
      const keys = Object.keys(r);
      const cells = keys
        .map((k, i) => {
          // first column is "given"; later columns blank for student (filled in key)
          if (i === 0) return `<td>${esc(r[k])}</td>`;
          return `<td>${key ? esc(r[k]) : ""}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<p class="ws-stem">${esc(it.label || "Complete the table.")}</p>
  <table class="ws-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

function renderOpen(it, _n, key, supported) {
  const frame =
    supported && it.sentenceFrame ? `<p class="ws-frame">${esc(it.sentenceFrame)}</p>` : "";
  let keyHtml = "";
  if (key) {
    // Actionable rubric instead of a generic "answers vary": surface a sample
    // answer and the look-for keywords the teacher should check against.
    const parts = [];
    if (it.sampleAnswer) parts.push(`Sample: ${it.sampleAnswer}`);
    if (Array.isArray(it.keywords) && it.keywords.length)
      parts.push(`Look for: ${it.keywords.join(", ")}.`);
    keyHtml = parts.length
      ? `<p class="ws-keynote">${esc(parts.join(" "))}</p>`
      : `<p class="ws-keynote">Answers vary — look for correct reasoning.</p>`;
  }
  return `<p class="ws-stem">${esc(it.prompt)}</p>${frame}${key ? keyHtml : blankLines(4)}`;
}

function renderSort(it, _n, key) {
  const cats = [...new Set((it.items || []).map((i) => i.category))];
  const items = (it.items || [])
    .map(
      (i) =>
        `<li><span class="ws-blank ws-blank-sm">${key ? esc(i.category) : ""}</span>${esc(i.text)}</li>`,
    )
    .join("");
  return `<p class="ws-stem">${esc(it.instructions || "Sort each item into the correct group.")}</p>
  <p class="ws-prompt">Categories: <b>${cats.map(esc).join(" · ")}</b></p>
  <ul class="ws-sort">${items}</ul>`;
}

function renderGeneric(it, _n, key) {
  const stem = it.prompt || it.label || it.stem || it.instructions || "Solve. Show your work.";
  return `<p class="ws-stem">${esc(stem)}</p>${key ? "" : workBox()}`;
}

function renderProblem(it, n, { key = false, supported = false, commonMistake = "" } = {}) {
  if (!it || !it.type) return renderGeneric(it || {}, n, key);
  const diagramHtml = renderProblemDiagram(it);
  let body;
  switch (it.type) {
    case "multiple-choice":
      body = renderMC(it, n, key, commonMistake, supported);
      break;
    case "matching-game":
    case "matching":
      body = renderMatching(it, n, key);
      break;
    case "error-analysis":
      body = renderErrorAnalysis(it, n, key);
      break;
    case "fill-table":
      body = renderFillTable(it, n, key);
      break;
    case "open-response":
      body = renderOpen(it, n, key, supported);
      break;
    case "drag-sort":
      body = renderSort(it, n, key);
      break;
    default:
      body = renderGeneric(it, n, key);
  }
  return `<li class="ws-problem"><span class="ws-pnum">${n}</span><div class="ws-pbody">${diagramHtml}${body}</div></li>`;
}

/* deterministic shuffle (seedless but stable enough for print bank order) */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (i * 7 + 3) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- version + page builders -------------------------------------- */
function wordBank(vocab = []) {
  if (!vocab || !vocab.length) return "";
  const chips = vocab
    .slice(0, 8)
    .map((v) => {
      const en = esc(v.term || v.en || "");
      const es = v.spanish || v.es || v.termEs || "";
      const esBadge = es
        ? ` <span class="ws-es-term" style="font-weight:500;color:var(--muted);font-style:italic">(${esc(es)})</span>`
        : "";
      return `<span class="ws-bankword">${en}${esBadge}</span>`;
    })
    .join("");
  return `<section class="ws-bank">
    <h2 class="ws-bank-h">📕 Word Bank / Banco de Palabras</h2>
    <div class="ws-bankwords">${chips}</div>
  </section>`;
}

function workedExample(cfg) {
  /* THE MODEL AND ITS PICTURE MUST BE THE SAME PROBLEM.
   *
   * This used to source the model from an `error-analysis` item — an item whose
   * whole purpose is to contain a deliberate mistake. Printing the lesson's
   * canonical tableau beside that produced a "Worked Example" showing
   * 1,134 ÷ 9 narrated to a wrong quotient on the left and a correct
   * 1,344 ÷ 12 house on the right, under one heading, as if the second were
   * the answer to the first.
   *
   * So the lesson's own `launch.conceptIntro.iDo` wins: it is the canonical
   * correct walk, and it is the field the tableau is derived from, which makes
   * the words and the picture the same problem by construction rather than by
   * luck. Only when a lesson has no concept intro does the old error-analysis
   * prose stand in — and then it stands alone, with no picture. */
  const iDo = cfg.launch?.conceptIntro?.iDo;
  const lines = Array.isArray(iDo?.lines) ? iDo.lines.filter(Boolean) : [];
  if (lines.length) {
    let tableau = "";
    try {
      const svg = (carriedDivisionFigures(lines) || []).filter(Boolean).pop();
      if (svg)
        tableau = `<figure class="ws-example-fig">${svg}<figcaption>The finished division</figcaption></figure>`;
    } catch (_error) {
      tableau = "";
    }
    const steps = lines.map((line) => `<li>${esc(line)}</li>`).join("");
    return `<section class="ws-example">
      <h2 class="ws-example-h">✏️ Worked Example</h2>
      <div class="ws-example-body">
        <ol class="ws-example-steps">${steps}</ol>
        ${tableau}
      </div>
    </section>`;
  }

  const pools = [cfg.practice?.extending, cfg.practice?.onLevel, cfg.practice?.optional].filter(
    Boolean,
  );
  let ex = null;
  for (const pool of pools) {
    ex = pool.find((p) => p.type === "error-analysis" && (p.workedExample || []).length);
    if (ex) break;
  }
  if (!ex) return "";
  const steps = (ex.workedExample || [])
    .map((step) => `<li><b>${esc(step.label)}:</b> ${esc(step.work)}</li>`)
    .join("");
  return `<section class="ws-example">
    <h2 class="ws-example-h">✏️ Worked Example</h2>
    <ol class="ws-example-steps">${steps}</ol>
  </section>`;
}
function pageHeader(cfg, versionLabel, sub) {
  const wbUrl = `/curriculum/math-workbench/?lesson=${esc(cfg.lessonId)}`;
  return `<header class="ws-head">
    <div class="ws-head-top">
      <span class="ws-std">${esc(cfg.standard || "")}</span>
      <span class="ws-ver">${esc(versionLabel)}</span>
    </div>
    <div class="ws-title-row" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
      <div>
        <h1 class="ws-title">${esc(cfg.title || cfg.lessonId || "Practice")}</h1>
        <p class="ws-sub">${esc(sub)}</p>
      </div>
      <div class="ws-digital-badge" style="background:#eef6ff;border:1px solid #c7dcf7;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:600;color:var(--blue);">
        <span aria-hidden="true">⚡</span> <a href="${wbUrl}" target="_blank" rel="noopener" style="color:var(--blue);text-decoration:none;"><b>Interactive Workbench &amp; Models</b> &rarr;</a>
      </div>
    </div>
    <div class="ws-meta"><span>Name: <span class="ws-fill"></span></span><span>Date: <span class="ws-fill ws-fill-sm"></span></span><span>Period: <span class="ws-fill ws-fill-sm" style="width:70px"></span></span></div>
  </header>`;
}

function versionPage(cfg, problems, { label, sub, supported, key, extraScaffold }) {
  const commonMistake = key ? cfg.practice?.commonMistake || "" : "";
  const items = problems
    .map((p, i) => renderProblem(p, i + 1, { supported, key, commonMistake }))
    .join("");
  const scaffolds = supported && !key ? wordBank(cfg.vocabulary) + workedExample(cfg) : "";
  // Level 0 (most-supported) page leads with an extra-scaffold banner so the
  // teacher knows every item is paired with a word bank, worked model, and
  // sentence frames.
  const banner =
    extraScaffold && !key
      ? `<p class="ws-scaffold-note">🧩 Extra support: use the word bank and the worked example. A sentence starter is given under each problem.</p>`
      : "";
  return `<section class="ws-page">
    ${pageHeader(cfg, key ? label + " — Answer Key" : label, sub)}
    ${scaffolds}
    ${banner}
    <ol class="ws-problems">${items}</ol>
  </section>`;
}

/* ---------- full document ------------------------------------------------- */
function buildWorksheet(cfg, { key = false } = {}) {
  const printable = (pool) => (pool || []).filter((p) => p && p.type);
  const approaching = printable(cfg.practice?.approaching);
  const onLevel = printable(cfg.practice?.onLevel);
  const extending = printable(cfg.practice?.extending);
  // Level 0 (most-supported): the 3-4 gentlest approaching items, every one
  // paired with word bank + worked example + sentence frames. Drawn from
  // approaching so it stays the easiest tier (L0 < L1 < L2).
  const levelZero = approaching.slice(0, 4);
  const title = esc(cfg.title || cfg.lessonId);
  const audience = key ? "teacher" : "student";
  const titleSuffix = key ? "Practice Answer Key" : "Practice Worksheet";

  // One page definition per tier. Each is gated on its own pool being
  // non-empty, so a lesson with only some tiers still produces a valid sheet
  // instead of being skipped wholesale.
  const tiers = [
    {
      pool: levelZero,
      label: "Level 0",
      sub: "Practice — Level 0",
      supported: true,
      extraScaffold: true,
    },
    { pool: approaching, label: "Version A", sub: "Practice — Version A", supported: true },
    { pool: onLevel, label: "Version B", sub: "Practice — Version B", supported: false },
    { pool: extending, label: "Challenge", sub: "Practice — Challenge", supported: false },
  ].filter((t) => t.pool.length);

  const practicePages = tiers.map((t) => versionPage(cfg, t.pool, { ...t, key: false }));
  const keyPages = tiers.map((t) =>
    versionPage(cfg, t.pool, { ...t, sub: "Answer Key", key: true }),
  );
  const pages = (key ? keyPages : practicePages).join("\n");

  return `<!DOCTYPE html>
<html lang="en" data-ewl-supports-lesson="${esc(cfg.lessonId)}" data-support-audience="${audience}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} — ${titleSuffix}</title>
<link href="/assets/fonts/worksheet-pages.css" rel="stylesheet" />
<style>
:root{
  --navy:#143a6b; --blue:#1f5fa6; --teal:#1c7a64; --ink:#16243d; --muted:#5a6b82;
  --line:#d7e2ed; --soft:#eef3f9; --bank:#fff8e8; --bank-line:#f0d9a0; --ex:#eaf4ff;
}
*{box-sizing:border-box;}
body{margin:0;background:#e9eef5;color:var(--ink);font-family:"Hanken Grotesk",system-ui,sans-serif;font-size:13.5px;line-height:1.5;}
.ws-page{background:#fff;max-width:760px;margin:18px auto;padding:34px 40px 44px;box-shadow:0 6px 24px rgba(20,40,75,.12);border-radius:6px;}
.ws-head{border-bottom:3px solid var(--navy);padding-bottom:12px;margin-bottom:18px;}
.ws-head-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.ws-std{background:var(--navy);color:#fff;font-weight:700;font-size:11px;letter-spacing:.04em;padding:4px 11px;border-radius:999px;}
.ws-ver{font-family:"Fraunces",serif;font-weight:700;color:var(--blue);font-size:14px;}
.ws-title{font-family:"Fraunces",serif;font-weight:700;font-size:25px;margin:4px 0 2px;color:var(--navy);line-height:1.1;}
.ws-sub{margin:0;color:var(--muted);font-weight:600;font-size:13px;}
.ws-meta{display:flex;gap:28px;margin-top:12px;font-weight:600;color:var(--ink);font-size:13px;}
.ws-fill{display:inline-block;width:220px;border-bottom:1.5px solid var(--ink);}
.ws-fill-sm{width:120px;}
.ws-bank{background:var(--bank);border:1.5px solid var(--bank-line);border-radius:12px;padding:12px 16px;margin:0 0 16px;}
.ws-bank-h,.ws-example-h{font-family:"Fraunces",serif;font-size:14px;margin:0 0 8px;color:var(--navy);}
.ws-bankwords{display:flex;flex-wrap:wrap;gap:8px;}
.ws-bankword{background:#fff;border:1.5px solid var(--bank-line);border-radius:999px;padding:4px 12px;font-weight:700;font-size:12.5px;}
.ws-example{background:var(--ex);border:1.5px solid #cfe2f6;border-radius:12px;padding:12px 16px;margin:0 0 16px;}
.ws-example-steps{margin:0;padding-left:18px;}
.ws-example-steps li{margin:2px 0;}
.ws-problems{list-style:none;margin:0;padding:0;counter-reset:none;}
.ws-problem{display:flex;gap:12px;padding:14px 0;border-bottom:1px dashed var(--line);break-inside:avoid;page-break-inside:avoid;}
.ws-problem:last-child{border-bottom:0;}
.ws-pnum{flex:0 0 auto;width:26px;height:26px;border-radius:50%;background:var(--navy);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:13px;}
.ws-pbody{flex:1;min-width:0;}
.ws-stem{margin:0 0 8px;font-weight:600;}
.ws-prompt{margin:6px 0;color:var(--muted);font-size:12.5px;}
.ws-opts{list-style:none;margin:6px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;}
.ws-opt{display:flex;align-items:flex-start;gap:8px;}
.ws-bub{flex:0 0 auto;width:22px;height:22px;border:2px solid var(--navy);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;}
.ws-bub-sm{width:20px;height:20px;font-size:11px;}
.ws-correct .ws-bub{background:var(--teal);border-color:var(--teal);color:#fff;}
.ws-correct{font-weight:700;color:var(--teal);}
.ws-keynote{margin:6px 0 0;color:var(--teal);font-size:12px;font-style:italic;}
.ws-watch{margin:4px 0 0;color:#9a4a12;font-size:12px;background:#fff3e6;border-left:3px solid #e08a3c;padding:5px 10px;border-radius:0 8px 8px 0;}
.ws-scaffold-note{margin:0 0 14px;background:var(--soft);border:1.5px solid var(--line);border-radius:10px;padding:8px 12px;font-weight:600;color:var(--navy);font-size:12.5px;}
.ws-match{display:flex;gap:24px;flex-wrap:wrap;}
.ws-match-terms{list-style:none;margin:0;padding:0;flex:1;min-width:180px;}
.ws-match-term{display:flex;align-items:center;gap:8px;margin:5px 0;font-weight:600;}
.ws-match-bank{list-style:none;margin:0;padding:10px 12px;background:var(--soft);border:1px solid var(--line);border-radius:10px;flex:1;min-width:180px;}
.ws-match-bank li{display:flex;align-items:center;gap:8px;margin:4px 0;}
.ws-blank{display:inline-block;min-width:54px;border-bottom:1.5px solid var(--ink);text-align:center;font-weight:700;}
.ws-blank-sm{min-width:40px;}
.ws-steps{list-style:none;margin:6px 0;padding:0;}
.ws-steps li{display:flex;gap:10px;align-items:baseline;padding:4px 0;}
.ws-step-n{flex:0 0 auto;width:20px;height:20px;border-radius:50%;background:var(--soft);font-weight:700;font-size:11px;display:inline-flex;align-items:center;justify-content:center;}
.ws-step-l{flex:0 0 38%;font-weight:600;}
.ws-step-w{flex:1;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}
.ws-table{width:100%;border-collapse:collapse;margin:8px 0;}
.ws-table th{background:var(--navy);color:#fff;font-size:12px;padding:7px 9px;text-align:left;}
.ws-table td{border:1px solid var(--line);padding:9px;height:34px;font-weight:600;}
.ws-lines{margin:8px 0 0;}
.ws-line{display:block;border-bottom:1.5px solid var(--line);height:24px;}
.ws-work{margin:8px 0 0;border:1.5px dashed var(--line);border-radius:10px;min-height:70px;padding:6px 10px;position:relative;}
/* Vertical work space. The frame and the cycle rail sit side by side on paper
   and stack on a narrow screen; both are print-first, so no shadows, no fills
   that cost toner, and hairlines that survive a classroom copier. */
.wsd-wrap{display:flex;gap:14px;align-items:flex-start;margin:10px 0 2px;flex-wrap:wrap;}
.ws-example-body{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;}
.ws-example-body .ws-example-steps{flex:1 1 320px;margin:0;}
.ws-example-fig{flex:0 0 auto;margin:0;text-align:center;}
.ws-example-fig figcaption{margin-top:4px;font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);}
${DIVISION_FIGURE_CSS}
.wsd-frame{flex:0 0 auto;}
.wsd{display:block;}
.wsd .wsd-rule{stroke:#0f172a;stroke-width:1.8;fill:none;}
.wsd .wsd-cell{fill:none;stroke:#c8d2e0;stroke-width:1;stroke-dasharray:3 3;}
.wsd .wsd-given{font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;font-size:19px;fill:#0f172a;}
.wsd-rail{list-style:none;margin:0;padding:0;display:grid;gap:5px;min-width:150px;}
/* ── scaffolds ──────────────────────────────────────────────────────────
   All print-first: hairlines, no fills, nothing that costs toner. Every one
   is BLANK STRUCTURE — labels and room, never a quantity the item did not
   state. */
.wss-body{flex:1 1 300px;min-width:250px;}
.wss-panel{border:1.5px dashed var(--line);border-radius:10px;padding:6px 10px 4px;}
.wss-panel-tight{margin-top:8px;}
.wss-panel-t{display:block;color:var(--muted);font-size:11px;font-weight:700;margin-bottom:2px;}
.wss-rules{display:grid;gap:0;}
.wss-rule{display:block;border-bottom:1px solid #dbe3ee;height:26px;}
.wss-ledger{width:100%;border-collapse:collapse;margin:2px 0 0;}
.wss-ledger th{font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);
  text-align:left;font-weight:700;padding:0 6px 3px;border-bottom:1.5px solid var(--line);}
.wss-cell{height:30px;border-bottom:1px solid #dbe3ee;padding:0 6px;}
.wss-cell-why{width:42%;border-left:1px dashed #dbe3ee;}
.wss-steps{display:grid;gap:7px;}
.wss-slot{display:grid;grid-template-columns:auto 1fr;gap:8px;align-items:end;}
.wss-slot-t{font-size:11.5px;font-weight:700;color:#12355b;white-space:nowrap;padding-bottom:2px;}
.wss-slot-w{border-bottom:1.5px solid var(--line);height:26px;}
.wss-ratio{border-collapse:collapse;margin:0;min-width:210px;}
.wss-ratio th{height:22px;border:1px solid var(--line);border-bottom-width:1.5px;width:105px;}
.wss-ratio .wss-cell{border:1px solid #dbe3ee;height:30px;}
.wss-row-per .wss-cell{border-color:var(--blue);border-width:1.5px;}
.wss-per{font-size:10.5px;font-weight:800;color:var(--blue);letter-spacing:.04em;}
.wss-bar{display:grid;grid-template-columns:repeat(10,1fr);border:1.5px solid var(--line);border-radius:6px;overflow:hidden;height:26px;}
.wss-bar span{border-right:1px solid #dbe3ee;}
.wss-bar span:last-child{border-right:0;}
.wss-barlab{display:flex;justify-content:space-between;font-size:10px;color:var(--muted);font-weight:700;margin-top:2px;}
.wss-cols{display:grid;grid-template-columns:repeat(6,1fr);gap:0;border:1.5px dashed var(--line);border-radius:8px;height:34px;}
.wss-col{border-right:1px dashed #dbe3ee;}
.wss-col:last-child{border-right:0;}
.wsd-step{display:grid;grid-template-columns:20px 1fr;row-gap:0;column-gap:7px;align-items:baseline;
  border-left:2.5px solid var(--blue);padding:2px 0 3px 8px;}
.wsd-step-n{grid-row:span 2;font-weight:800;font-size:12px;color:var(--blue);
  border:1.5px solid var(--blue);border-radius:50%;width:20px;height:20px;line-height:17px;text-align:center;}
.wsd-step-t{font-weight:700;font-size:12.5px;color:#12355b;}
.wsd-step-h{grid-column:2;font-size:11px;color:var(--muted);}
@media print{
  .wsd-wrap{break-inside:avoid;page-break-inside:avoid;}
}
.ws-work-label{color:var(--muted);font-size:11px;font-weight:600;}
.ws-frame{background:var(--soft);border-left:3px solid var(--blue);padding:6px 10px;margin:6px 0;font-style:italic;color:var(--muted);border-radius:0 8px 8px 0;}
.ws-sort{list-style:none;margin:6px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:5px 18px;}
.ws-sort li{display:flex;align-items:center;gap:8px;font-weight:600;}
.ws-figure-wrap{margin:10px auto;max-width:100%;display:flex;flex-direction:column;align-items:center;}
.ws-figure-wrap svg{max-width:100%;height:auto;}

@media print{
  body{background:#fff;font-size:12pt;}
  .ws-page{box-shadow:none;border-radius:0;margin:0;max-width:none;padding:0;page-break-after:always;}
  .ws-page:last-child{page-break-after:auto;}
  .ws-digital-badge{background:transparent !important;border:none !important;padding:0 !important;}
  @page{margin:1.5cm;}
  a{color:#000;}
}
${EDITORIAL_OVERRIDES}
</style>
</head>
<body>
<main data-support-slot="practice">
${pages}
</main>
<!-- Same effective support configuration as the interactive lesson; see
     shared/supports/print-supports.js. Inert until supports are configured. -->
<script src="/shared/supports/print-supports.js" defer></script>
</body>
</html>`;
}

/* ---------- main ---------------------------------------------------------- */
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
    // Emit a worksheet if ANY practice tier has printable problems — each page
    // is gated independently inside buildWorksheet, so a lesson with only one
    // populated tier still gets a usable (single-version) sheet.
    const hasAny = ["approaching", "onLevel", "extending"].some((tier) =>
      (cfg.practice?.[tier] || []).some((p) => p && p.type),
    );
    if (!hasAny) {
      skipped++;
      continue;
    }
    // writeGenerated, not writeFileSync: the injectors (Save/Resume,
    // mobile-access, math-workbench, enterprise-head) splice sentinel blocks
    // into this page AFTER it is generated, and a plain overwrite silently
    // deletes every one of them. validate:injection only checks that begin/end
    // sentinels BALANCE, and zero blocks balance perfectly — so the loss is
    // invisible until a student's saved work stops resuming.
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
