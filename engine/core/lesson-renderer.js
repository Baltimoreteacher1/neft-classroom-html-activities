import { createApp } from "./app.js";
import { createAdaptiveSequence } from "./adaptive.js";
import { levelOverride, mountLevelSelector } from "./levels.js";
import {
  renderMultipleChoice,
  renderDragSort,
  renderOpenResponse,
  renderErrorAnalysis,
  renderFillTable,
  renderNumberLine,
  renderCoordinateGrid,
  renderMatchingGame,
  renderBarModel,
  renderBalanceScale,
  renderAlgebraTiles,
  renderFractionBars,
  renderNetFolder,
  renderCoordinatePlane,
  renderRemediation,
  renderTwrWriting,
} from "../components/index.js";
import {
  renderActivityChooser,
  renderOptionalPracticeOptIn,
} from "../components/activity-chooser.js";
import { buildGradeCard } from "./grade.js";
import { createProblemCard, problemTypeLabel } from "./problem-shell.js";
import { enableWordProblemAnnotation } from "./annotate.js";
import { renderThemeIllustration } from "./theme-illustrations.js";
import { deriveWorkedSteps } from "./worked-steps.js";
import { isTeacherMode } from "./teacher-mode.js";
import { mountStuckSupport } from "./stuck-support.js";
import {
  buildPhaseTransitionMeta,
  buildPrintableSummary,
  checkBadges,
  getBadgeDefs,
} from "./premium.js";
import { deriveCommonMistake } from "./content-enrichment.js";
import { mountHintLadder } from "./hint-ladder.js";
import { renderMathText } from "./math-typography.js";
import { t, stackHtml, phaseName, badgeName } from "./i18n.js";
import { mountCertificateDownload } from "./certificate-export.js";
import resolveVocabImage, { vocabImageAlt } from "./vocab-images.js";

export function bootLesson(config) {
  createApp({
    ...config,
    // Vocabulary lives only in the Vocab tab now (the Vocab Explorer), so it is
    // no longer a graded phase. Phases: Launch, Explore, Practice, Connect,
    // Reflect (indices 0–4). See migrateVocabPhaseRemoval in state.js.
    phases: [
      (el, state, ctx) => renderLaunchPhase(el, state, ctx, config),
      (el, state, ctx) => renderExplorePhase(el, state, ctx, config),
      (el, state, ctx) => renderPracticePhase(el, state, ctx, config),
      (el, state, ctx) => renderConnectPhase(el, state, ctx, config),
      (el, state, ctx) => renderReflectPhase(el, state, ctx, config),
    ],
  });
}

// ── Helpers ──
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// Derive a SHORT, non-answer-giving scaffold hint for a Level 1 practice item.
// Prefers an authored item.scaffold/item.hint; otherwise builds a type-aware
// nudge ("what to look at / what to ask yourself") from the item's shape. It
// NEVER reveals the choice/index/answer/explanation. Degrades to a generic
// process cue if the item has no usable fields.
function deriveScaffold(prob) {
  if (!prob) return "";
  if (prob.scaffold) return String(prob.scaffold).trim();
  if (prob.hint) return String(prob.hint).trim();

  switch (prob.type) {
    case "multiple-choice":
      return "Read each choice carefully. Cross out the ones you can rule out first, then check the rest against the question.";
    case "drag-sort":
      return "Read each category label first. For every card, ask which label it matches best before you drag it.";
    case "matching-game":
    case "matching":
      return "Start with the pair you are most sure about. Match those first, then use what is left to figure out the rest.";
    case "number-line":
      return "Find 0 and the end points first. Count the equal spaces between the marks before you place your point.";
    case "fill-table":
      return "Fill in the cells you already know first. Look for the pattern or rule between the rows or columns to find the rest.";
    case "coordinate-grid":
    case "coordinate-plane":
      return "Start at the origin (0, 0). Move across for the x value, then up or down for the y value.";
    case "open-response":
      return "Underline what the question is asking. Show your steps and use one number or word from the problem as evidence.";
    case "error-analysis":
      return "Read each step and check it against the rule. Find the first step where the work stops being true.";
    default:
      return "Re-read the question and underline what it is asking. Plan your first step before you answer.";
  }
}

function phaseHeader(el, icon, iconClass, title, desc) {
  const h = document.createElement("div");
  h.className = "section-header";
  h.innerHTML = `
    <div class="section-icon ${iconClass}">${icon}</div>
    <div>
      <div class="section-title">${esc(title)}</div>
      <div class="section-desc">${esc(desc)}</div>
    </div>`;
  el.append(h);
}

function instructionCallout(el, icon, html) {
  const box = document.createElement("div");
  box.className = "instruction-callout";
  box.innerHTML = `<span class="instruction-callout-icon" aria-hidden="true">${icon}</span><span>${html}</span>`;
  el.append(box);
  return box;
}

// ── Inline data visuals (opt-in via config) ─────────────────────────────────
// Draw a real, accessible SVG histogram from authored interval/frequency data.
// Opt-in only: a lesson supplies `{ bars:[{label,value}], xLabel, yLabel,
// highlightIndex, title, caption }`. Lessons without this field are unaffected.
// Bars touch (no gaps) to match the definition of a histogram, the tallest (or
// highlighted) bar is tinted, and each bar shows its frequency on top.
// Build an accessible label that includes the figure's data, so a screen
// reader announces the actual values rather than just the chart title.
function figureAria(cfg, fallback = "Data figure") {
  const base = cfg && cfg.title ? cfg.title : fallback;
  const parts = [];
  if (Array.isArray(cfg?.bars) && cfg.bars.length) {
    parts.push(
      "Values — " +
        cfg.bars.map((b) => `${b.label != null ? b.label + ": " : ""}${b.value}`).join(", "),
    );
  } else if (Array.isArray(cfg?.values) && cfg.values.length) {
    parts.push("Values — " + cfg.values.join(", "));
  }
  if (cfg && ["min", "q1", "median", "q3", "max"].some((k) => cfg[k] != null)) {
    parts.push(
      `five-number summary: minimum ${cfg.min}, Q1 ${cfg.q1}, median ${cfg.median}, Q3 ${cfg.q3}, maximum ${cfg.max}`,
    );
  }
  if (cfg?.xLabel) parts.push(`x-axis: ${cfg.xLabel}`);
  if (cfg?.yLabel) parts.push(`y-axis: ${cfg.yLabel}`);
  return parts.length ? `${base}. ${parts.join(". ")}` : base;
}

function histogramSVG(cfg) {
  const bars = Array.isArray(cfg?.bars) ? cfg.bars : [];
  if (!bars.length) return "";
  const W = 520,
    H = 280,
    padL = 44,
    padR = 16,
    padT = 28,
    padB = 56;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxV = Math.max(...bars.map((b) => Number(b.value) || 0), 1);
  const bw = plotW / bars.length;
  const baseY = padT + plotH;
  let hi = Number.isInteger(cfg.highlightIndex) ? cfg.highlightIndex : -1;
  if (hi < 0) {
    // Default highlight = tallest bar so "the tallest bar" discourse lands.
    let m = -1;
    bars.forEach((b, i) => {
      if ((Number(b.value) || 0) > m) {
        m = Number(b.value) || 0;
        hi = i;
      }
    });
  }
  // Horizontal gridlines + y-axis ticks (one per unit up to a sane cap).
  const step = maxV <= 10 ? 1 : Math.ceil(maxV / 8);
  let grid = "";
  for (let v = 0; v <= maxV; v += step) {
    const y = baseY - (v / maxV) * plotH;
    grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${(W - padR).toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>`;
    grid += `<text x="${padL - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="var(--muted)">${v}</text>`;
  }
  const rects = bars
    .map((b, i) => {
      const v = Number(b.value) || 0;
      const h = (v / maxV) * plotH;
      const x = padL + i * bw;
      const y = baseY - h;
      const fill = i === hi ? "var(--coral, #d9795d)" : "var(--teal, #2a9d8f)";
      return (
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 1).toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}" stroke="#fff" stroke-width="1"/>` +
        `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--navy, #264653)">${v}</text>` +
        `<text x="${(x + bw / 2).toFixed(1)}" y="${(baseY + 18).toFixed(1)}" text-anchor="middle" font-size="11" fill="var(--ink, #333)">${esc(b.label ?? "")}</text>`
      );
    })
    .join("");
  const xLabel = cfg.xLabel
    ? `<text x="${(padL + plotW / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--muted)">${esc(cfg.xLabel)}</text>`
    : "";
  const yLabel = cfg.yLabel
    ? `<text x="14" y="${(padT + plotH / 2).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--muted)" transform="rotate(-90 14 ${(padT + plotH / 2).toFixed(1)})">${esc(cfg.yLabel)}</text>`
    : "";
  const axis = `<line x1="${padL}" y1="${baseY}" x2="${(W - padR).toFixed(1)}" y2="${baseY}" stroke="var(--ink,#333)" stroke-width="1.5"/>`;
  const title = cfg.title
    ? `<div style="font-weight:700; color:var(--navy,#264653); margin-bottom:var(--sp-2); text-align:center;">${esc(cfg.title)}</div>`
    : "";
  const caption = cfg.caption
    ? `<div style="font-size:0.82rem; color:var(--muted); margin-top:var(--sp-2); text-align:center; font-style:italic;">${esc(cfg.caption)}</div>`
    : "";
  return `<div class="histogram-figure" style="margin:var(--sp-3) 0;">${title}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(figureAria(cfg, "Histogram"))}" style="width:100%; height:auto; max-width:560px; display:block; margin:0 auto;">${grid}${axis}${rects}${xLabel}${yLabel}</svg>${caption}</div>`;
}

// Render a styled "data display" for the Launch scenario so the I-notice /
// I-wonder routine has something concrete to observe. Opt-in via
// `launch.visual = { kind:"data-chips", title, values:[...], unit }`.
// Dot plot: one dot per value, stacked over a simple number axis. Good for
// small data sets where individual values matter (mean/median/MAD lessons).
function dotPlotSVG(cfg) {
  const values = (cfg.values || []).map(Number).filter((n) => !isNaN(n));
  if (!values.length) return "";
  const W = 520,
    H = 220,
    padL = 30,
    padR = 20,
    padB = 46,
    padT = 20;
  const min = cfg.min != null ? cfg.min : Math.min(...values);
  const max = cfg.max != null ? cfg.max : Math.max(...values);
  const span = Math.max(1, max - min);
  const plotW = W - padL - padR;
  const baseY = H - padB;
  const xOf = (v) => padL + ((v - min) / span) * plotW;
  const counts = {};
  const dots = values
    .map((v) => {
      counts[v] = (counts[v] || 0) + 1;
      const cy = baseY - 12 - (counts[v] - 1) * 16;
      return `<circle cx="${xOf(v).toFixed(1)}" cy="${cy.toFixed(1)}" r="6" fill="var(--teal,#2a9d8f)" stroke="#fff" stroke-width="1.5"/>`;
    })
    .join("");
  // axis ticks at each integer (capped) or at the distinct values
  const ticks = [];
  const tickStep = span <= 20 ? 1 : Math.ceil(span / 12);
  for (let v = min; v <= max; v += tickStep) {
    ticks.push(
      `<line x1="${xOf(v).toFixed(1)}" y1="${baseY}" x2="${xOf(v).toFixed(1)}" y2="${baseY + 5}" stroke="var(--ink,#333)" stroke-width="1"/>` +
        `<text x="${xOf(v).toFixed(1)}" y="${baseY + 20}" text-anchor="middle" font-size="11" fill="var(--ink,#333)">${v}</text>`,
    );
  }
  const axis = `<line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="var(--ink,#333)" stroke-width="1.5"/>`;
  const xLabel = cfg.xLabel
    ? `<text x="${(padL + plotW / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--muted)">${esc(cfg.xLabel)}</text>`
    : "";
  return svgFigure(cfg, `${axis}${ticks.join("")}${dots}${xLabel}`, W, H, padT);
}

// Box-and-whisker plot from a five-number summary.
function boxPlotSVG(cfg) {
  const { min, q1, median, q3, max } = cfg;
  if ([min, q1, median, q3, max].some((v) => v == null)) return "";
  const W = 520,
    H = 180,
    padL = 30,
    padR = 20;
  const lo = cfg.axisMin != null ? cfg.axisMin : min;
  const hi = cfg.axisMax != null ? cfg.axisMax : max;
  const span = Math.max(1, hi - lo);
  const plotW = W - padL - padR;
  const xOf = (v) => padL + ((v - lo) / span) * plotW;
  const midY = 80,
    boxH = 54,
    top = midY - boxH / 2,
    bot = midY + boxH / 2;
  const teal = "var(--teal,#2a9d8f)";
  const parts = [
    `<line x1="${xOf(min)}" y1="${midY}" x2="${xOf(q1)}" y2="${midY}" stroke="var(--ink,#333)" stroke-width="2"/>`,
    `<line x1="${xOf(q3)}" y1="${midY}" x2="${xOf(max)}" y2="${midY}" stroke="var(--ink,#333)" stroke-width="2"/>`,
    `<line x1="${xOf(min)}" y1="${top + 10}" x2="${xOf(min)}" y2="${bot - 10}" stroke="var(--ink,#333)" stroke-width="2"/>`,
    `<line x1="${xOf(max)}" y1="${top + 10}" x2="${xOf(max)}" y2="${bot - 10}" stroke="var(--ink,#333)" stroke-width="2"/>`,
    `<rect x="${xOf(q1)}" y="${top}" width="${(xOf(q3) - xOf(q1)).toFixed(1)}" height="${boxH}" fill="${teal}" fill-opacity="0.25" stroke="${teal}" stroke-width="2"/>`,
    `<line x1="${xOf(median)}" y1="${top}" x2="${xOf(median)}" y2="${bot}" stroke="var(--coral,#d9795d)" stroke-width="3"/>`,
  ];
  const labels = [
    [min, "Min"],
    [q1, "Q1"],
    [median, "Med"],
    [q3, "Q3"],
    [max, "Max"],
  ]
    .map(
      ([v, t]) =>
        `<text x="${xOf(v)}" y="${bot + 22}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--navy,#264653)">${v}</text>` +
        `<text x="${xOf(v)}" y="${top - 8}" text-anchor="middle" font-size="9" fill="var(--muted)">${t}</text>`,
    )
    .join("");
  return svgFigure(cfg, `${parts.join("")}${labels}`, W, H, 10);
}

// Categorical bar chart (bars have GAPS — contrast with a histogram).
function barChartSVG(cfg) {
  const bars = Array.isArray(cfg.bars) ? cfg.bars : [];
  if (!bars.length) return "";
  const W = 520,
    H = 260,
    padL = 40,
    padR = 16,
    padT = 24,
    padB = 50;
  const plotW = W - padL - padR,
    plotH = H - padT - padB;
  const maxV = Math.max(...bars.map((b) => Number(b.value) || 0), 1);
  const slot = plotW / bars.length,
    bw = slot * 0.6,
    baseY = padT + plotH;
  const rects = bars
    .map((b, i) => {
      const v = Number(b.value) || 0;
      const h = (v / maxV) * plotH;
      const x = padL + i * slot + (slot - bw) / 2;
      const y = baseY - h;
      return (
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="var(--teal,#2a9d8f)"/>` +
        `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--navy,#264653)">${v}</text>` +
        `<text x="${(x + bw / 2).toFixed(1)}" y="${(baseY + 18).toFixed(1)}" text-anchor="middle" font-size="11" fill="var(--ink,#333)">${esc(b.label ?? "")}</text>`
      );
    })
    .join("");
  const axis = `<line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="var(--ink,#333)" stroke-width="1.5"/>`;
  return svgFigure(cfg, `${axis}${rects}`, W, H, padT);
}

// Simple labeled number line with optional marked points.
function numberLineSVG(cfg) {
  const min = Number(cfg.min ?? 0),
    max = Number(cfg.max ?? 10);
  const step = Number(cfg.step ?? 1);
  const W = 520,
    H = 120,
    padL = 24,
    padR = 24,
    y = 56;
  const span = Math.max(1, max - min),
    plotW = W - padL - padR;
  const xOf = (v) => padL + ((v - min) / span) * plotW;
  let ticks = "";
  for (let v = min; v <= max + 1e-9; v += step) {
    ticks += `<line x1="${xOf(v).toFixed(1)}" y1="${y - 6}" x2="${xOf(v).toFixed(1)}" y2="${y + 6}" stroke="var(--ink,#333)" stroke-width="1.5"/><text x="${xOf(v).toFixed(1)}" y="${y + 24}" text-anchor="middle" font-size="11" fill="var(--ink,#333)">${+v.toFixed(2)}</text>`;
  }
  const pts = (cfg.points || [])
    .map(
      (p) =>
        `<circle cx="${xOf(Number(p.value)).toFixed(1)}" cy="${y}" r="7" fill="var(--coral,#d9795d)" stroke="#fff" stroke-width="2"/>` +
        (p.label
          ? `<text x="${xOf(Number(p.value)).toFixed(1)}" y="${y - 14}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--coral,#d9795d)">${esc(p.label)}</text>`
          : ""),
    )
    .join("");
  const line = `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--ink,#333)" stroke-width="2"/>`;
  return svgFigure(cfg, `${line}${ticks}${pts}`, W, H, 8);
}

// Shared figure wrapper: optional title + responsive SVG + optional caption.
function svgFigure(cfg, inner, W, H, padT = 16) {
  const title = cfg.title
    ? `<div style="font-weight:700; color:var(--navy,#264653); margin-bottom:var(--sp-2); text-align:center;">${esc(cfg.title)}</div>`
    : "";
  const caption = cfg.caption
    ? `<div style="font-size:0.82rem; color:var(--muted); margin-top:var(--sp-2); text-align:center; font-style:italic;">${esc(cfg.caption)}</div>`
    : "";
  return `<div class="data-figure" style="margin:var(--sp-3) 0;">${title}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(figureAria(cfg))}" style="width:100%; height:auto; max-width:560px; display:block; margin:0 auto;"><g transform="translate(0,${padT - 16})">${inner}</g></svg>${caption}</div>`;
}

// Tape / bar diagram: stacked labeled segments per row. Models part–whole,
// ratios, rates, and percents (e.g. two rows whose lengths form a ratio).
function tapeDiagramSVG(cfg) {
  const rows = Array.isArray(cfg.rows) ? cfg.rows : [];
  if (!rows.length) return "";
  const W = 520,
    padL = 8,
    padR = 8,
    rowH = 46,
    gap = 14,
    labelW = 96;
  const H = 8 + rows.length * (rowH + gap);
  const palette = [
    "var(--teal,#2a9d8f)",
    "var(--coral,#d9795d)",
    "var(--amber,#e9c46a)",
    "var(--navy,#264653)",
  ];
  // Scale so the longest row (by total) fills the track.
  const totals = rows.map((r) => (r.parts || []).reduce((s, p) => s + (Number(p.value) || 0), 0));
  const maxTotal = Math.max(...totals, 1);
  const trackW = W - padL - padR - labelW;
  let y = 8;
  const body = rows
    .map((r) => {
      let x = padL + labelW;
      const segs = (r.parts || [])
        .map((p, i) => {
          const w = ((Number(p.value) || 0) / maxTotal) * trackW;
          const fill = p.fill || palette[i % palette.length];
          const rect = `<rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(0, w - 2).toFixed(1)}" height="${rowH}" rx="4" fill="${fill}"/><text x="${(x + w / 2).toFixed(1)}" y="${y + rowH / 2 + 4}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${esc(p.label != null ? p.label : p.value)}</text>`;
          x += w;
          return rect;
        })
        .join("");
      const rowLabel = `<text x="${padL}" y="${y + rowH / 2 + 4}" font-size="12" font-weight="700" fill="var(--navy,#264653)">${esc(r.label || "")}</text>`;
      y += rowH + gap;
      return rowLabel + segs;
    })
    .join("");
  return svgFigure(cfg, body, W, H, 16);
}

// Static four-quadrant coordinate plane with optional plotted points.
function coordPlaneSVG(cfg) {
  const m = Number(cfg.max ?? 6);
  const W = 360,
    H = 360,
    pad = 24;
  const span = 2 * m;
  const plot = W - 2 * pad;
  const unit = plot / span;
  const cx = pad + m * unit,
    cy = pad + m * unit;
  const X = (x) => pad + (x + m) * unit;
  const Y = (y) => pad + (m - y) * unit;
  let grid = "";
  for (let i = -m; i <= m; i++) {
    grid += `<line x1="${X(i)}" y1="${pad}" x2="${X(i)}" y2="${H - pad}" stroke="rgba(0,0,0,0.06)"/>`;
    grid += `<line x1="${pad}" y1="${Y(i)}" x2="${W - pad}" y2="${Y(i)}" stroke="rgba(0,0,0,0.06)"/>`;
  }
  const axes = `<line x1="${pad}" y1="${cy}" x2="${W - pad}" y2="${cy}" stroke="var(--ink,#333)" stroke-width="2"/><line x1="${cx}" y1="${pad}" x2="${cx}" y2="${H - pad}" stroke="var(--ink,#333)" stroke-width="2"/>`;
  const pts = (cfg.points || [])
    .map((p) => {
      const px = X(Number(p.x)),
        py = Y(Number(p.y));
      const lbl = p.label || `(${p.x}, ${p.y})`;
      return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" fill="var(--coral,#d9795d)" stroke="#fff" stroke-width="2"/><text x="${(px + 8).toFixed(1)}" y="${(py - 8).toFixed(1)}" font-size="11" font-weight="700" fill="var(--navy,#264653)">${esc(lbl)}</text>`;
    })
    .join("");
  return svgFigure(cfg, `${grid}${axes}${pts}`, W, H, 16);
}

// Unified visual builder → HTML string. Returns "" for unknown/empty kinds.
function buildVisual(v) {
  if (!v) return "";
  switch (v.kind) {
    case "histogram":
      return histogramSVG(v);
    case "dot-plot":
      return dotPlotSVG(v);
    case "box-plot":
      return boxPlotSVG(v);
    case "bar-chart":
      return barChartSVG(v);
    case "number-line":
      return numberLineSVG(v);
    case "tape-diagram":
      return tapeDiagramSVG(v);
    case "coordinate-plane":
      return coordPlaneSVG(v);
    default:
      return "";
  }
}

function renderLaunchVisual(host, visual) {
  if (!visual) return;
  if (visual.kind === "data-chips" && Array.isArray(visual.values)) {
    const card = document.createElement("div");
    card.style.cssText =
      "margin-top:var(--sp-4); padding:var(--sp-4); background:var(--cream,#fdf6ec); border:1px solid rgba(0,0,0,0.06); border-radius:var(--radius-md,12px);";
    const chips = visual.values
      .map(
        (v) =>
          `<span style="display:inline-flex; align-items:center; justify-content:center; min-width:34px; padding:4px 8px; background:#fff; border:1px solid rgba(42,157,143,0.4); border-radius:8px; font-weight:700; color:var(--navy,#264653); font-size:0.9rem;">${esc(v)}</span>`,
      )
      .join("");
    card.innerHTML =
      (visual.title
        ? `<div style="font-weight:700; color:var(--navy,#264653); margin-bottom:var(--sp-3); display:flex; align-items:center; gap:8px;"><span>📊</span><span>${esc(visual.title)}</span></div>`
        : "") +
      `<div style="display:flex; flex-wrap:wrap; gap:8px;">${chips}</div>` +
      (visual.unit
        ? `<div style="font-size:0.8rem; color:var(--muted); margin-top:var(--sp-2);">${esc(visual.unit)}</div>`
        : "");
    host.append(card);
  } else {
    const html = buildVisual(visual);
    if (html) {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = html;
      host.append(card);
    }
  }
}

// (The Launch concept-teaching block was removed: the lesson's conceptIntro now
// renders in exactly one student-facing place — the Learn It page — instead of
// triple-rendering across Launch, Learn It, and Notes. The Launch hands off to
// it via renderLearnItBridge.)

// Bridge the Launch hook straight into the full step-by-step Learn It page.
// Opens the Learn It view inline (ctx.openExtra), so the launch scenario and
// the teaching read as one connected flow. Learn It lives here (off the Launch)
// rather than as its own sidebar tab.
function renderLearnItBridge(host, ctx, config) {
  const intro = (config.launch && config.launch.conceptIntro) || null;
  const heading = intro && intro.heading ? intro.heading : "how to solve it";
  const card = document.createElement("div");
  card.className = "card learnit-bridge-card";
  card.style.cssText =
    "border-left:4px solid var(--gold,#d4952a); background:rgba(233,196,106,0.12); display:flex; flex-wrap:wrap; gap:var(--sp-3,12px); align-items:center; justify-content:space-between;";
  card.innerHTML = `
    <div style="flex:1 1 260px;">
      <h4 style="color:var(--navy,#264653); margin:0 0 4px;">📖 Now learn ${esc(heading)
        .replace(/^What is /i, "")
        .replace(/\?$/, "")}</h4>
      <p style="margin:0; font-size:0.95rem; line-height:1.5;">You've seen the problem. Open <strong>Learn It</strong> to see exactly how to solve it — step by step, with examples you can work through — then come back and keep going.</p>
    </div>
    <button type="button" class="btn btn-primary" data-open-learn style="flex:0 0 auto;">Open Learn It →</button>`;
  const btn = card.querySelector("[data-open-learn]");
  if (btn) {
    // Open Learn It as its own page in a new tab so students keep the lesson
    // open behind it (rather than replacing the Launch view inline).
    btn.addEventListener("click", () => {
      window.open(`/lessons/${config.lessonId}/learn.html`, "_blank", "noopener");
    });
  }
  host.append(card);
}

// ── Turn & Talk (non-graded student discussion moments) ──────────────────────
// A reusable, visually distinct "🗣️ Turn & Talk" block. It is driven by an
// optional config field `config.turnAndTalk` (array of
// `{ phase, question, stems:[...] }`) but ALWAYS falls back to engine defaults
// so every lesson surfaces at least one discussion moment per supported phase.
// Turn & Talk never affects phase completion, scoring, stars, or XP — it is a
// purely formative prompt the student confirms with a "We talked! ✓" button.

// Bilingual sentence stems used when a lesson supplies none of its own.
const DEFAULT_TURN_TALK_STEMS = [
  { en: "I think ___ because ___.", es: "Pienso que ___ porque ___." },
  { en: "First I ___, then I ___.", es: "Primero ___, luego ___." },
  {
    en: "I agree / disagree because ___.",
    es: "Estoy de acuerdo / en desacuerdo porque ___.",
  },
];

// Build a generic, topic-aware prompt for a phase when the lesson has no
// authored turn-and-talk entry. Keeps language simple for English learners.
function defaultTurnTalkPrompt(phase, config) {
  const topic = config.title || "today's math";
  if (phase === "explore") {
    return {
      phase,
      question: `Turn and talk: explain your thinking about ${topic} to your partner.`,
      stems: DEFAULT_TURN_TALK_STEMS,
    };
  }
  return {
    phase,
    question: `Turn and talk: how does ${topic} connect to the real world or to what you already know?`,
    stems: DEFAULT_TURN_TALK_STEMS,
  };
}

// Resolve the turn-and-talk prompt for a given phase: prefer the authored
// config entry, otherwise return the engine default so the block always shows.
function resolveTurnTalk(phase, config) {
  const authored = Array.isArray(config.turnAndTalk)
    ? config.turnAndTalk.find((t) => t && t.phase === phase)
    : null;
  if (authored && authored.question) {
    // Normalize stems: accept ["..."] strings or {en, es} objects.
    const stems =
      Array.isArray(authored.stems) && authored.stems.length
        ? authored.stems.map((s) =>
            typeof s === "string" ? { en: s, es: "" } : { en: s.en || "", es: s.es || "" },
          )
        : DEFAULT_TURN_TALK_STEMS;
    // Surface the richer authored fields so the live lesson mirrors the notes:
    // a Level 1 "Start here" kernel + word bank, and a Level 2 extend prompt
    // with stretch stems. `listenFor` is intentionally omitted (teacher-only).
    const wordBank = Array.isArray(authored.wordBank) ? authored.wordBank.filter(Boolean) : [];
    const kernel = typeof authored.kernel === "string" ? authored.kernel.trim() : "";
    const extend = typeof authored.extend === "string" ? authored.extend.trim() : "";
    const extendStems = Array.isArray(authored.extendStems)
      ? authored.extendStems.filter(Boolean)
      : [];
    return {
      phase,
      question: authored.question,
      stems,
      kernel,
      wordBank,
      extend,
      extendStems,
    };
  }
  return defaultTurnTalkPrompt(phase, config);
}

let turnTalkSeq = 0;

// Render the Turn & Talk card into `host`. Calls `onDone` (if given) when the
// student confirms they talked. Fully keyboard- and screen-reader-accessible.
function renderTurnAndTalk(host, prompt, state, phaseId, onDone) {
  const uid = `tt-${phaseId}-${turnTalkSeq++}`;
  const respKey = `turntalk_${prompt.phase}`;
  const alreadyDone = state.getResponse(phaseId, respKey) === "done";

  const card = document.createElement("section");
  card.className = "card card-coral turn-talk speech-bubble-card";
  card.setAttribute("aria-labelledby", `${uid}-title`);

  const stemsHtml = prompt.stems
    .map(
      (s) => `
      <li class="sentence-frame" style="margin-bottom:var(--sp-2); list-style:none;">
        <span style="font-weight:700;">${esc(s.en)}</span>
        ${s.es ? `<span style="display:block; color:var(--muted); font-style:italic; font-weight:600;">${esc(s.es)}</span>` : ""}
      </li>`,
    )
    .join("");

  // Level 1 (support): a "Start here" kernel + a word-bank chip strip. Both are
  // optional — older configs without these fields simply render nothing here.
  const kernelHtml = prompt.kernel
    ? `<p style="margin:0 0 var(--sp-3); font-weight:600;"><span style="display:inline-block; font-weight:800; color:var(--coral); margin-right:var(--sp-2);">Start here:</span>${esc(prompt.kernel)}</p>`
    : "";
  const wordBankHtml =
    Array.isArray(prompt.wordBank) && prompt.wordBank.length
      ? `<div style="margin:0 0 var(--sp-3);">
      <span style="font-weight:700; margin-right:var(--sp-2);">Word bank:</span>
      <span style="display:inline-flex; flex-wrap:wrap; gap:var(--sp-2); vertical-align:middle;">${prompt.wordBank
        .map((w) => `<span class="badge badge-teal">${esc(w)}</span>`)
        .join("")}</span>
    </div>`
      : "";
  const supportHtml =
    kernelHtml || wordBankHtml || stemsHtml
      ? `<div style="border-left:4px solid var(--teal); padding-left:var(--sp-3); margin:0 0 var(--sp-4);">
      <span class="badge badge-teal" style="margin-bottom:var(--sp-2);">Level 1 support</span>
      ${kernelHtml}
      <p style="font-weight:700; margin:var(--sp-2) 0 var(--sp-2);">Use a sentence starter / <span style="font-style:italic;">Usa un inicio de oración</span>:</p>
      <ul style="margin:0 0 var(--sp-3); padding:0;">${stemsHtml}</ul>
      ${wordBankHtml}
    </div>`
      : "";

  // Level 2 (enrichment): a deeper "extend" push question + stretch stems.
  const extendStemsHtml =
    Array.isArray(prompt.extendStems) && prompt.extendStems.length
      ? `<ul style="margin:var(--sp-2) 0 0; padding-left:var(--sp-4);">${prompt.extendStems
          .map((s) => `<li style="margin-bottom:var(--sp-1);">${esc(s)}</li>`)
          .join("")}</ul>`
      : "";
  const extendHtml =
    prompt.extend || extendStemsHtml
      ? `<div style="border-left:4px solid var(--amber); padding-left:var(--sp-3); margin:0 0 var(--sp-3);">
      <span class="badge badge-amber" style="margin-bottom:var(--sp-2);">Level 2</span>
      ${prompt.extend ? `<p style="font-weight:700; margin:0;">${esc(prompt.extend)}</p>` : ""}
      ${extendStemsHtml}
    </div>`
      : "";

  card.innerHTML = `
    <div style="display:flex; align-items:center; gap:var(--sp-2); margin-bottom:var(--sp-2);">
      <span style="font-size:1.6rem;" aria-hidden="true">🗣️</span>
      <h4 id="${uid}-title" style="color:var(--coral); margin:0;">Turn &amp; Talk</h4>
    </div>
    <p style="font-weight:700; font-size:1.05rem; margin:0 0 var(--sp-3);">${esc(prompt.question)}</p>
    <div style="display:flex; flex-wrap:wrap; gap:var(--sp-2); margin-bottom:var(--sp-3);">
      <span class="badge badge-teal">🅰️ Partner A shares first</span>
      <span class="badge badge-amber">🅱️ Partner B goes next</span>
    </div>
    ${supportHtml}
    ${extendHtml}
  `;

  // Optional ~60s talk timer (low-friction, fully optional).
  const timerRow = document.createElement("div");
  timerRow.style.cssText =
    "display:flex; align-items:center; gap:var(--sp-3); flex-wrap:wrap; margin-bottom:var(--sp-3);";
  const timerBtn = document.createElement("button");
  timerBtn.type = "button";
  timerBtn.className = "btn btn-secondary";
  timerBtn.textContent = "⏱️ Start 60s timer";
  const timerLabel = document.createElement("span");
  timerLabel.setAttribute("role", "timer");
  timerLabel.setAttribute("aria-live", "polite");
  timerLabel.style.cssText = "font-weight:800; color:var(--coral);";
  let timerId = null;
  timerBtn.addEventListener("click", () => {
    if (timerId) return;
    let remaining = 60;
    timerLabel.textContent = `0:${String(remaining).padStart(2, "0")}`;
    timerBtn.disabled = true;
    timerBtn.style.opacity = "0.6";
    timerId = setInterval(() => {
      remaining--;
      timerLabel.textContent = `0:${String(Math.max(remaining, 0)).padStart(2, "0")}`;
      if (remaining <= 0) {
        clearInterval(timerId);
        timerId = null;
        timerLabel.textContent = "⏰ Time! Wrap up your ideas.";
        timerBtn.disabled = false;
        timerBtn.style.opacity = "1";
        timerBtn.textContent = "⏱️ Restart 60s timer";
      }
    }, 1000);
  });
  timerRow.append(timerBtn, timerLabel);
  card.append(timerRow);

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "btn btn-primary";
  const markDone = () => {
    confirmBtn.textContent = "We talked! ✓";
    confirmBtn.classList.add("btn-success");
    confirmBtn.setAttribute("aria-pressed", "true");
    confirmBtn.disabled = true;
    state.saveResponse(phaseId, respKey, "done");
  };
  if (alreadyDone) {
    markDone();
  } else {
    confirmBtn.textContent = "We talked! ✓";
    confirmBtn.setAttribute("aria-pressed", "false");
    confirmBtn.addEventListener("click", () => {
      markDone();
      onDone?.();
    });
  }
  card.append(confirmBtn);

  host.append(card);
  return card;
}

async function completePhase(el, ctx, state, phaseIdx, name, correct, total) {
  // Participation coins for non-practice phases
  if (phaseIdx !== 3) {
    state.awardPhaseParticipation(phaseIdx, 2);
  }
  const xp = ctx.engagement.awardXP(phaseIdx, { correct, total });
  const stars = state.get().phases[phaseIdx]?.stars ?? 0;
  const transitionMeta = buildPhaseTransitionMeta(state, phaseIdx, name, xp, stars);
  await ctx.engagement.showPhaseComplete(el, name, xp, stars, transitionMeta);
  ctx.navigateTo(phaseIdx + 1);
}

export function renderComponent(container, problemDef, onAnswer, shellOpts) {
  const useShell = shellOpts && shellOpts.number != null;
  let body = container;
  let setResult = () => {};

  if (useShell) {
    const shell = createProblemCard({
      number: shellOpts.number,
      total: shellOpts.total,
      tier: shellOpts.tier,
      typeLabel: problemTypeLabel(problemDef),
      stem: problemDef.stem || problemDef.prompt || problemDef.label,
    });
    container.append(shell.card);
    body = shell.body;
    setResult = shell.setResult;

    if (shellOpts.state && !shellOpts.skipHints) {
      mountHintLadder(shell.card, {
        problem: problemDef,
        state: shellOpts.state,
      });
    }
    // Hide duplicate stem inside child components when shell shows it
    if (problemDef.stem || problemDef.prompt) {
      problemDef = { ...problemDef, hideStem: true };
    }
  }

  const wrappedOnAnswer = (isCorrect) => {
    if (useShell) setResult(isCorrect ? "correct" : "incorrect");
    onAnswer?.(isCorrect);
  };

  switch (problemDef.type) {
    case "multiple-choice":
      renderMultipleChoice(body, { ...problemDef, onAnswer: wrappedOnAnswer });
      break;
    case "drag-sort":
      if (problemDef.instructions) {
        const p = document.createElement("p");
        p.style.cssText = "font-weight:600; margin-bottom:var(--sp-3);";
        p.textContent = problemDef.instructions;
        body.append(p);
      }
      renderDragSort(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "error-analysis":
      renderErrorAnalysis(body, {
        ...problemDef,
        onAnswer: (ok) => wrappedOnAnswer(ok),
      });
      break;
    case "fill-table":
      renderFillTable(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "number-line":
      renderNumberLine(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "coordinate-grid":
      renderCoordinateGrid(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "matching-game":
      renderMatchingGame(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "matching": {
      const pairs = (problemDef.pairs || []).map((p) => ({
        term: p.left || p.term || p.prompt || "",
        match: p.right || p.match || p.answer || "",
      }));
      renderMatchingGame(body, {
        pairs,
        columns: problemDef.columns || 2,
        label: problemDef.hideStem ? problemDef.label : problemDef.stem || problemDef.label,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    }
    case "bar-model":
      renderBarModel(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "balance-scale":
      renderBalanceScale(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "algebra-tiles":
      renderAlgebraTiles(body, {
        ...problemDef,
        onComplete: (c) => wrappedOnAnswer(c > 0),
      });
      break;
    case "fraction-bars":
      renderFractionBars(body, {
        ...problemDef,
        onComplete: (c) => wrappedOnAnswer(c > 0),
      });
      break;
    case "net-folder":
      renderNetFolder(body, {
        ...problemDef,
        onComplete: (c) => wrappedOnAnswer(c > 0),
      });
      break;
    case "coordinate-plane":
      renderCoordinatePlane(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "open-response":
      renderOpenResponse(body, {
        ...problemDef,
        onSubmit: (text, ok) => wrappedOnAnswer(ok),
      });
      break;
    default:
      renderUnknownComponentFallback(body, problemDef);
      {
        const continueBtn = document.createElement("button");
        continueBtn.type = "button";
        continueBtn.className = "btn btn-secondary mt-4";
        continueBtn.textContent = "Continue";
        continueBtn.addEventListener("click", () => wrappedOnAnswer(true));
        body.append(continueBtn);
      }
  }

  // Teacher Mode: let a teacher advance past any item WITHOUT doing the work,
  // so they can walk/project the whole lesson freely. Students never see this.
  // It runs the same completion path as a correct answer, so the practice
  // sequence (and phase) advances normally.
  if (isTeacherMode()) {
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "btn btn-secondary btn-sm teacher-skip no-print";
    skip.textContent = "⏭ Next (teacher)";
    skip.title = "Teacher Mode — advance without answering";
    skip.addEventListener("click", () => wrappedOnAnswer(true));
    body.append(skip);
  }
}

// Readable, non-blank fallback for component types the renderer does not know.
// Shows instructions and any items/rows as text instead of rendering nothing.
function renderUnknownComponentFallback(container, def = {}) {
  const card = document.createElement("div");
  card.className = "card";

  const text = def.instructions || def.label || def.prompt || def.stem;
  if (text) {
    const p = document.createElement("p");
    p.style.cssText = "font-weight:600; margin-bottom:var(--sp-3);";
    p.textContent = text;
    card.append(p);
  }

  const source = Array.isArray(def.items) ? def.items : Array.isArray(def.rows) ? def.rows : [];
  const cols = Array.isArray(def.columns)
    ? def.columns
    : Array.isArray(def.headers)
      ? def.headers
      : [];

  if (source.length) {
    const list = document.createElement("ul");
    list.style.cssText = "margin:0; padding-left:1.2rem; line-height:1.6;";
    source.forEach((row) => {
      const li = document.createElement("li");
      if (row && typeof row === "object" && !Array.isArray(row)) {
        const keys = Object.keys(row);
        li.textContent = keys.map((k, i) => `${cols[i] || k}: ${row[k]}`).join("  ·  ");
      } else if (Array.isArray(row)) {
        li.textContent = row.map((v, i) => `${cols[i] ? cols[i] + ": " : ""}${v}`).join("  ·  ");
      } else {
        li.textContent = String(row);
      }
      list.append(li);
    });
    card.append(list);
  } else if (!text) {
    card.innerHTML = `<p class="feedback feedback-hint visible"><span>Content type "${esc(
      def.type,
    )}" is not yet interactive here.</span></p>`;
  }

  container.append(card);
}

// ── Reveal Math slides (inline, additive) ───────────────────────────────────
// A sibling pipeline may write `config.revealSlides`: an array of
//   { src, caption?, placement, page? }
// where `placement` is one of the canonical sections:
//   launch | explore | vocabulary | instruction | practice | connect | closure
//
// Each lesson section renders the slides whose placement maps to it, appended
// at the END of that section's content. Section ↔ placement mapping:
//   Launch  ← launch, instruction   (no dedicated "instruction" phase exists;
//                                     Launch holds the teaching/concept block,
//                                     so it is the nearest sensible home)
//   Vocab   ← vocabulary            (the Vocab phase IS rendered separately)
//   Explore ← explore
//   Practice← practice
//   Connect ← connect
//   Reflect ← closure               (Reflect is the closing/reflect section)
// Every placement therefore surfaces in exactly one rendered section; none are
// silently dropped.
//
// STRICT no-op guarantee: when `config.revealSlides` is missing, not an array,
// or contains no slide for the requested placement(s), this appends NOTHING —
// no container, no heading, no console output. Lessons without the field render
// byte-for-byte as before.
function revealSlidesFor(config, placements) {
  const all = Array.isArray(config?.revealSlides) ? config.revealSlides : [];
  if (!all.length) return [];
  const wanted = Array.isArray(placements) ? placements : [placements];
  return all.filter((s) => s && typeof s.src === "string" && s.src && wanted.includes(s.placement));
}

// Append an accessible Reveal Math figure list for the given placement(s) to
// `host`. Returns early (no DOM) when there are no matching slides.
function renderRevealSlides(host, config, placements) {
  const slides = revealSlidesFor(config, placements);
  if (!slides.length) return;

  const section = document.createElement("section");
  section.className = "reveal-slides";
  section.setAttribute("aria-label", "Reveal Math slides");

  const heading = document.createElement("div");
  heading.className = "reveal-slides-heading";
  heading.innerHTML = `<span class="reveal-slides-tag" aria-hidden="true">📘 Reveal Math</span>`;
  section.append(heading);

  slides.forEach((slide, i) => {
    const fig = document.createElement("figure");
    fig.className = "reveal-slides-figure";

    const img = document.createElement("img");
    img.className = "reveal-slides-img";
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    img.src = slide.src;
    const pageNum = Number.isFinite(slide.page) ? slide.page : i + 1;
    img.alt = slide.caption ? String(slide.caption) : `Reveal Math slide ${pageNum}`;
    fig.append(img);

    if (slide.caption) {
      const cap = document.createElement("figcaption");
      cap.className = "reveal-slides-caption";
      cap.textContent = String(slide.caption);
      fig.append(cap);
    }

    section.append(fig);
  });

  host.append(section);
}

// ── Notice & Wonder (Reveal data-context) ───────────────────────────────────
// Opt-in card driven by `config.noticeAndWonder`. Rendered immediately after the
// Launch Objectives block. Shows a data-context image, a framing sentence, then
// two columns ("What do you notice?" / "What do you wonder?"), each with tappable
// sentence-starter chips that insert into a typeable textarea. The textareas
// persist via the lesson's canonical save/resume API (state.saveResponse /
// state.getResponse on phaseId 0 — the Launch phase — with stable keys), so
// answers survive reload exactly like every other lesson input.
//
// STRICT no-op: when `config.noticeAndWonder` is absent or not an object, this
// renders NOTHING — no container, no heading, no console output.
function renderNoticeAndWonder(host, config, state) {
  const nw = config && config.noticeAndWonder;
  if (!nw || typeof nw !== "object") return;

  const noticeStarters = Array.isArray(nw.noticeStarters)
    ? nw.noticeStarters.filter((s) => typeof s === "string" && s.trim())
    : [];
  const wonderStarters = Array.isArray(nw.wonderStarters)
    ? nw.wonderStarters.filter((s) => typeof s === "string" && s.trim())
    : [];

  const card = document.createElement("section");
  card.className = "card nw-card";
  card.setAttribute("aria-label", "Notice and Wonder");

  const head = document.createElement("div");
  head.className = "nw-head";
  head.innerHTML = `
    <h3 class="nw-title">👀 Notice &amp; Wonder</h3>`;
  card.append(head);

  if (nw.context) {
    const ctxP = document.createElement("p");
    ctxP.className = "nw-context";
    ctxP.textContent = String(nw.context);
    card.append(ctxP);
  }

  if (nw.image) {
    const fig = document.createElement("figure");
    fig.className = "nw-figure";
    const img = document.createElement("img");
    img.className = "nw-img";
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    img.src = String(nw.image);
    img.alt = nw.context ? String(nw.context) : "Notice and Wonder data display";
    fig.append(img);
    card.append(fig);
  }

  const grid = document.createElement("div");
  grid.className = "nw-grid";

  // Build one column (notice or wonder): starter chips + a save/resume textarea.
  const buildColumn = (opts) => {
    const col = document.createElement("div");
    col.className = `nw-col ${opts.colClass}`;

    const h4 = document.createElement("h4");
    h4.className = "nw-col-title";
    h4.innerHTML = `${opts.icon} ${esc(opts.heading)}`;
    col.append(h4);

    const ta = document.createElement("textarea");
    ta.className = "text-input nw-textarea";
    ta.rows = 4;
    ta.placeholder = opts.placeholder;
    ta.id = `nw-${opts.key}`;
    ta.value = (state && state.getResponse && state.getResponse(0, opts.responseKey)) || "";

    if (opts.starters.length) {
      const chips = document.createElement("div");
      chips.className = "nw-chips";
      chips.setAttribute("role", "group");
      chips.setAttribute("aria-label", "Sentence starters — tap one to add it to your answer");
      opts.starters.forEach((starter) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "nw-chip";
        chip.textContent = starter;
        chip.title = "Tap to add this sentence starter";
        chip.addEventListener("click", () => {
          const needsSpace = ta.value && !/\s$/.test(ta.value);
          ta.value = `${ta.value}${needsSpace ? " " : ""}${starter} `;
          ta.focus();
          // Route persistence through the single input handler below.
          ta.dispatchEvent(new Event("input", { bubbles: true }));
        });
        chips.append(chip);
      });
      col.append(chips);
    }

    ta.addEventListener("input", () => {
      if (state && state.saveResponse) {
        state.saveResponse(0, opts.responseKey, ta.value);
      }
    });
    col.append(ta);

    return col;
  };

  grid.append(
    buildColumn({
      colClass: "nw-col-notice",
      icon: "👁",
      heading: "What do you notice?",
      placeholder: "I notice that…",
      key: "notice",
      responseKey: "nw_notice",
      starters: noticeStarters,
    }),
    buildColumn({
      colClass: "nw-col-wonder",
      icon: "💭",
      heading: "What do you wonder?",
      placeholder: "I wonder…",
      key: "wonder",
      responseKey: "nw_wonder",
      starters: wonderStarters,
    }),
  );

  card.append(grid);
  host.append(card);
}

// ── Show Your Work (Launch "Apply" + guided solve-it) ───────────────────────
// Renders, inside the Launch, the application problem the student works on PLUS a
// guided, typeable "Show Your Work" scaffold. This is where students actually do
// and show math — replacing the old display-only word-problem card that had no
// place to type.
//
// It maps directly to the BCPS UIFR (Instructional Framework Rubric) Level 4
// "Highly Effective" student-agency moves:
//   • TEACH 2 (L4): students DETERMINE AND SELECT a strategy   → strategy chips
//   • TEACH 3 (L4): students JUSTIFY answers using evidence     → "How I know" box
//   • TEACH 4 (L4): students CORRECT/CLARIFY/EXPAND/REDO work
//     in response to feedback                                   → self-check + Revise
//
// The problem text/image come from `config.revealWordProblem` when present (the
// 52 lessons that ship an authored Apply problem); otherwise the scaffold points
// back at the Launch scenario already shown above, so EVERY lesson gets a
// typeable show-your-work area. All fields persist via the lesson's canonical
// save/resume API on phaseId 0 (Launch) with stable keys.
function renderShowYourWork(host, config, state) {
  const wp = config && config.revealWordProblem;
  const hasAuthored = wp && typeof wp === "object" && (wp.text || wp.image);
  const get = (k) => (state && state.getResponse && state.getResponse(0, k)) || "";
  const set = (k, v) => state && state.saveResponse && state.saveResponse(0, k, v);

  const card = document.createElement("section");
  card.className = "card wp-card syw-card";
  card.setAttribute("aria-label", "Show your work");

  const head = document.createElement("div");
  head.className = "wp-head";
  head.innerHTML = `
    <span class="wp-badge" aria-hidden="true">✏️ Apply</span>
    <h3 class="wp-title">${esc((hasAuthored && wp.title) || "Show Your Work")}</h3>`;
  card.append(head);

  // The problem to solve.
  if (hasAuthored && wp.text) {
    const p = document.createElement("p");
    p.className = "wp-text";
    p.setAttribute("data-annotate", "word-problem");
    p.textContent = String(wp.text);
    card.append(p);
  } else {
    const p = document.createElement("p");
    p.className = "wp-text";
    p.textContent = "Use the scenario above. Work it out step by step below.";
    card.append(p);
  }
  if (hasAuthored && wp.image) {
    const fig = document.createElement("figure");
    fig.className = "wp-figure";
    const img = document.createElement("img");
    img.className = "wp-img";
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    img.src = String(wp.image);
    img.alt = wp.title ? String(wp.title) : "Word problem image";
    fig.append(img);
    card.append(fig);
  }

  // Helper: a labeled, persisted text field (textarea or single-line input).
  const field = (key, label, hint, opts = {}) => {
    const wrap = document.createElement("div");
    wrap.className = "syw-field";
    const lab = document.createElement("label");
    lab.className = "syw-label";
    lab.setAttribute("for", `syw-${key}`);
    lab.innerHTML = `${label}${hint ? ` <span class="syw-hint">${hint}</span>` : ""}`;
    wrap.append(lab);
    const input = opts.single
      ? document.createElement("input")
      : document.createElement("textarea");
    if (opts.single) input.type = "text";
    else input.rows = opts.rows || 3;
    input.id = `syw-${key}`;
    input.className = "text-input syw-input";
    input.placeholder = opts.placeholder || "";
    input.value = get(key);
    input.addEventListener("input", () => set(key, input.value));
    wrap.append(input);
    // Optional minimum-word goal with a live counter (writing scaffold #4).
    if (opts.minWords) {
      const counter = document.createElement("div");
      counter.className = "syw-wordcount";
      const countWords = (v) => (v.trim() ? v.trim().split(/\s+/).length : 0);
      const update = () => {
        const n = countWords(input.value);
        counter.textContent = `${n} / ${opts.minWords} words`;
        counter.classList.toggle("is-ready", n >= opts.minWords);
      };
      input.addEventListener("input", update);
      update();
      wrap.append(counter);
    }
    return wrap;
  };

  // Shared "I'm stuck" support bar — hint / first step / example / vocab /
  // sentence starter / simpler words, available on every lesson's solve.
  mountStuckSupport(card, { config, state });

  const steps = document.createElement("div");
  steps.className = "syw-steps";
  steps.append(
    field("know", "1 · What I know", "facts and numbers from the problem", {
      placeholder: "I know that…",
    }),
    field("find", "2 · What I need to find", "", {
      placeholder: "I need to find…",
    }),
    field("work", "3 · My work", "show each step", {
      rows: 5,
      minWords: 15,
      placeholder: "Step 1…\nStep 2…",
    }),
    field("answer", "4 · My answer", "label your units", {
      single: true,
      placeholder: "My answer is…",
    }),
  );
  card.append(steps);

  // TEACH 4 (L4): self-check feedback that prompts students to revise their work.
  const checkBtn = document.createElement("button");
  checkBtn.type = "button";
  checkBtn.className = "btn btn-secondary syw-check-btn";
  checkBtn.textContent = "✅ Check my thinking";
  const checklist = document.createElement("div");
  checklist.className = "syw-checklist";
  checklist.hidden = true;
  checklist.innerHTML = `
    <p class="syw-check-title">Reread your work and fix anything that's off:</p>
    <ul>
      <li>Did you answer <strong>everything</strong> the question asked?</li>
      <li>Did you <strong>label the units</strong> (people, $, packs, halves…)?</li>
      <li>Does your answer <strong>make sense</strong> for the situation?</li>
      <li>Could you <strong>explain your steps</strong> to a partner?</li>
    </ul>
    <p class="syw-check-note">If something's off, go back up and <strong>revise</strong> — good mathematicians redo their work.</p>`;
  checkBtn.addEventListener("click", () => {
    checklist.hidden = !checklist.hidden;
  });
  card.append(checkBtn, checklist);

  host.append(card);
}

// ── Phase 1: Launch ──
// Resolve the "I can ..." Content Objective with graceful fallbacks.
export function resolveContentObjective(config) {
  if (config.contentObjective) return esc(config.contentObjective);
  // Fallbacks to any pre-existing objective field, prefixed with "I can ".
  const legacy = config.objective || (config.launch && config.launch.objective) || "";
  if (legacy) {
    const trimmed = String(legacy).trim();
    return /^i can\b/i.test(trimmed) ? esc(trimmed) : `I can ${esc(trimmed)}`;
  }
  // Last-resort friendly placeholder using the lesson topic.
  return `I can solve problems about ${esc(config.title || "this topic")}.`;
}

// Resolve the "I can ..." Language Objective with a friendly placeholder.
export function resolveLanguageObjective(config) {
  if (config.languageObjective) return esc(config.languageObjective);
  return `I can talk and write about ${esc(config.title || "this topic")} using math words.`;
}

// Top-of-launch block: Name/Period fields and Homework download. The Content /
// Language objectives are rendered separately by renderObjectives so the
// "Be Curious" (Notice & Wonder) card can sit BETWEEN the identity fields and
// the objectives — curiosity first, then the formal "I can…" goals.
// Pre-lesson materials (Get Ready / Notes) now live as their own sidebar tabs
// under "Before the lesson" — see app.js preLessonNavHtml / openExtra.
function renderLaunchHeader(el, state, config) {
  const s = state.get();
  const homeworkHref = `/lessons/${encodeURIComponent(config.lessonId)}/homework.docx`;

  const block = document.createElement("div");
  block.className = "card launch-intro";
  block.innerHTML = `
    ${
      config.readiness
        ? `<div class="launch-prelesson-hint" style="display:flex; align-items:center; gap:var(--sp-3); background:var(--cream, #fdf3e0); border:1px solid var(--gold, #d4952a); border-radius:var(--radius-md, 12px); padding:var(--sp-3, 14px) var(--sp-4, 18px); margin-bottom:var(--sp-4, 18px);">
            <span style="font-size:1.6rem;">📚</span>
            <span>New to this skill? Open <strong>Get Ready</strong> and <strong>Notes</strong> under <em>Before the lesson</em> in the sidebar first — they're quick and not graded.</span>
          </div>`
        : ""
    }
    <div class="launch-identity" style="display:flex; flex-wrap:wrap; gap:var(--sp-3); align-items:flex-end; margin-bottom:var(--sp-4);">
      <div class="launch-field" style="flex:1 1 220px;">
        <label for="launch-name" style="display:block; font-weight:600; margin-bottom:var(--sp-1);">Name</label>
        <input id="launch-name" class="text-input" type="text"
          placeholder="First name Last initial" autocomplete="off"
          value="${esc(s.studentName || "")}" />
      </div>
      <div class="launch-field launch-field-period" style="flex:0 1 120px;">
        <label for="launch-period" style="display:block; font-weight:600; margin-bottom:var(--sp-1);">Period</label>
        <input id="launch-period" class="text-input" type="text"
          placeholder="e.g. 3" autocomplete="off"
          value="${esc(s.studentPeriod || "")}" />
      </div>
      <a class="btn btn-secondary launch-homework-link" href="${homeworkHref}"
        download>📄 Homework (Word doc)</a>
    </div>
  `;
  el.append(block);

  const nameInput = block.querySelector("#launch-name");
  const periodInput = block.querySelector("#launch-period");
  nameInput.addEventListener("change", () => {
    const name = nameInput.value.trim();
    if (name) state.set({ studentName: name });
  });
  periodInput.addEventListener("change", () => {
    state.set({ studentPeriod: periodInput.value.trim() });
  });
}

// Escape a string for safe use inside a RegExp.
function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Underline every lesson-vocabulary term that appears inside an objective and
// turn it into a tap-to-open button. `escapedText` is the already-HTML-escaped
// objective string (from resolveContentObjective / resolveLanguageObjective);
// the vocab terms are plain words, so matching on the escaped text is safe.
// Each match is wrapped in <button class="obj-term" data-term-idx="…"> so a
// single delegated handler can open the glossary popup for that term. Terms not
// present in the objective are simply left untouched.
export function linkifyObjectiveTerms(escapedText, vocab) {
  if (!escapedText || !Array.isArray(vocab) || !vocab.length) return escapedText;
  // Only linkify terms that actually have something to show in the popup —
  // otherwise students tap an underlined word and get an empty/dead popup. A
  // term needs a definition (EN or ES) or an authored visual/example to qualify.
  const hasPopupContent = (v) => !!(v && (v.definition || v.definitionEs || v.visual || v.example));
  // Skip very short terms to avoid noisy matches inside ordinary words.
  const entries = vocab
    .map((v, i) => ({ i, term: String((v && v.term) || "").trim() }))
    .filter((e) => e.term.length > 2 && hasPopupContent(vocab[e.i]));
  if (!entries.length) return escapedText;
  // Normalize for lookup: lowercase and drop a single trailing plural "s".
  const norm = (s) => s.toLowerCase().replace(/s$/, "").trim();
  const lookup = new Map();
  for (const e of entries) {
    if (!lookup.has(norm(e.term))) lookup.set(norm(e.term), e.i);
  }
  // Longest term first so "composite number" wins over "number".
  const alt = [...entries]
    .sort((a, b) => b.term.length - a.term.length)
    .map((e) => escapeRegExp(e.term))
    .join("|");
  const re = new RegExp(`\\b(?:${alt})(?:es|s)?\\b`, "gi");
  return escapedText.replace(re, (match) => {
    const idx = lookup.has(norm(match)) ? lookup.get(norm(match)) : -1;
    if (idx < 0) return match;
    return `<button type="button" class="obj-term" data-term-idx="${idx}" aria-haspopup="dialog">${match}</button>`;
  });
}

// Singleton glossary popup shared across all objective terms on the page.
let objectivePopupEl = null;
let objectivePopupKeyHandler = null;
let objectivePopupLastFocus = null;

function getObjectivePopup() {
  if (objectivePopupEl) return objectivePopupEl;
  const backdrop = document.createElement("div");
  backdrop.className = "obj-popup-backdrop";
  backdrop.hidden = true;
  backdrop.innerHTML = `
    <div class="obj-popup" role="dialog" aria-modal="true" aria-labelledby="obj-popup-term">
      <button type="button" class="obj-popup-close" aria-label="Close">&times;</button>
      <h3 id="obj-popup-term" class="obj-popup-term"></h3>
      <p class="obj-popup-translation">
        <span class="obj-popup-tr-label">Español:</span>
        <span class="obj-popup-tr-es" lang="es"></span>
      </p>
      <figure class="obj-popup-visual">
        <img class="obj-popup-img" alt="" />
        <figcaption class="obj-popup-example"></figcaption>
      </figure>
      <p class="obj-popup-def"></p>
      <p class="obj-popup-def-es" lang="es"></p>
    </div>`;
  document.body.append(backdrop);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeObjectivePopup();
  });
  backdrop.querySelector(".obj-popup-close").addEventListener("click", () => closeObjectivePopup());
  objectivePopupEl = backdrop;
  return backdrop;
}

function openObjectiveTermPopup(entry) {
  if (!entry) return;
  const backdrop = getObjectivePopup();
  const term = String(entry.term || "").trim();
  backdrop.querySelector(".obj-popup-term").textContent = term;

  // Spanish translation of the word itself (e.g. Ratio → Razón). Hidden when
  // the vocab entry has no termEs so we never show an empty "Español:" row.
  const trRow = backdrop.querySelector(".obj-popup-translation");
  const trEs = backdrop.querySelector(".obj-popup-tr-es");
  const termEs = entry.termEs ? String(entry.termEs).trim() : "";
  if (termEs) {
    trEs.textContent = termEs;
    trRow.hidden = false;
  } else {
    trEs.textContent = "";
    trRow.hidden = true;
  }

  const img = backdrop.querySelector(".obj-popup-img");
  img.src = resolveVocabImage(term, entry.image);
  img.alt = vocabImageAlt(term, entry.definition);

  const ex = backdrop.querySelector(".obj-popup-example");
  const visual = entry.visual ? String(entry.visual) : "";
  ex.textContent = visual;
  ex.hidden = !visual;

  backdrop.querySelector(".obj-popup-def").textContent = entry.definition
    ? String(entry.definition)
    : "";

  const esEl = backdrop.querySelector(".obj-popup-def-es");
  if (entry.definitionEs) {
    esEl.textContent = String(entry.definitionEs);
    esEl.hidden = false;
  } else {
    esEl.textContent = "";
    esEl.hidden = true;
  }

  objectivePopupLastFocus = document.activeElement;
  backdrop.hidden = false;
  document.body.classList.add("obj-popup-open");
  backdrop.querySelector(".obj-popup-close").focus();
  objectivePopupKeyHandler = (e) => {
    if (e.key === "Escape") closeObjectivePopup();
  };
  document.addEventListener("keydown", objectivePopupKeyHandler);
}

function closeObjectivePopup() {
  if (!objectivePopupEl) return;
  objectivePopupEl.hidden = true;
  document.body.classList.remove("obj-popup-open");
  if (objectivePopupKeyHandler) {
    document.removeEventListener("keydown", objectivePopupKeyHandler);
    objectivePopupKeyHandler = null;
  }
  if (objectivePopupLastFocus && typeof objectivePopupLastFocus.focus === "function") {
    objectivePopupLastFocus.focus();
  }
  objectivePopupLastFocus = null;
}

// Delegate clicks on underlined objective terms to the shared glossary popup.
export function wireObjectiveTermPopups(block, vocab) {
  if (!block.querySelector(".obj-term")) return;
  block.addEventListener("click", (e) => {
    const btn = e.target.closest(".obj-term");
    if (!btn || !block.contains(btn)) return;
    const idx = Number(btn.dataset.termIdx);
    if (Number.isInteger(idx)) openObjectiveTermPopup(vocab[idx]);
  });
}

// Content / Language "I can…" objectives. Rendered AFTER the "Be Curious"
// Notice & Wonder card so students get curious about the scenario before they
// read the formal goals (see renderLaunchPhase ordering). Key vocabulary words
// named in the objectives are underlined and open a tap-to-view popup with a
// simple kid-friendly explanation + a visual (see linkifyObjectiveTerms).
function renderObjectives(el, config) {
  const vocab = Array.isArray(config.vocabulary) ? config.vocabulary : [];
  const contentHtml = linkifyObjectiveTerms(resolveContentObjective(config), vocab);
  const languageHtml = linkifyObjectiveTerms(resolveLanguageObjective(config), vocab);
  const block = document.createElement("div");
  block.className = "launch-objectives grid-2";
  block.innerHTML = `
    <div class="card card-teal launch-objective">
      <h4 style="color:var(--teal-ink); margin-bottom:var(--sp-2);">Content Objective</h4>
      <p style="margin:0; font-weight:600;">${contentHtml}</p>
    </div>
    <div class="card card-coral launch-objective">
      <h4 style="color:var(--coral); margin-bottom:var(--sp-2);">Language Objective</h4>
      <p style="margin:0; font-weight:600;">${languageHtml}</p>
    </div>
  `;
  el.append(block);
  wireObjectiveTermPopups(block, vocab);
}

function renderLaunchPhase(el, state, ctx, config) {
  const cfg = config.launch;

  // When the lesson ships a richer Reveal "Notice & Wonder" card (rendered by
  // renderNoticeAndWonder, which has its own response boxes), it owns the
  // notice/wonder capture and we skip the generic grid below — no duplicates.
  const hasRevealNW = !!(config.noticeAndWonder && typeof config.noticeAndWonder === "object");

  // Top: student identity (name / period), homework link, pre-lesson hint.
  renderLaunchHeader(el, state, config);

  // Objectives sit directly under the header — the formal "I can…" goals.
  renderObjectives(el, config);

  // ── Be Curious ────────────────────────────────────────────────────────────
  // Its own part, right under the objectives: the Reveal Notice & Wonder
  // routine. Students get curious about today's math BEFORE the formal Launch
  // problem below. No-op when the lesson has no Notice & Wonder.
  phaseHeader(
    el,
    "🔭",
    "section-icon-teal",
    "Be Curious",
    "Look at today's scene. What do you notice? What do you wonder?",
  );

  // Notice & Wonder (Reveal data-context). No-op when absent.
  renderNoticeAndWonder(el, config, state);

  // The observation visual + generic Notice/Wonder belong with the "Be Curious"
  // image — the thing students observe — NOT the Launch word problem. They are
  // rendered here, before Launch, so "I notice / I wonder" matches the Be Curious
  // visual rather than the scenario.
  // Opt-in concrete data visual so "I notice / I wonder" has something to see.
  renderLaunchVisual(el, cfg.visual);

  // Generic Notice / Wonder capture — only when the lesson has no richer Reveal
  // Notice & Wonder card (see hasRevealNW), so students never see two identical
  // notice/wonder prompts.
  let noticeTA = null;
  let wonderTA = null;
  if (!hasRevealNW) {
    const grid = document.createElement("div");
    grid.className = "grid-2";

    const noticeCard = document.createElement("div");
    noticeCard.className = "card card-teal";
    noticeCard.innerHTML = `<h4 style="color:var(--teal-ink); margin-bottom:var(--sp-3);">👀 I Notice...</h4>
      ${(cfg.noticePrompts || []).map((p) => `<div class="sentence-frame" style="margin-bottom:var(--sp-2);"><span style="font-weight:600;">${esc(p)}</span></div>`).join("")}`;
    noticeTA = document.createElement("textarea");
    noticeTA.className = "text-input";
    noticeTA.rows = 3;
    noticeTA.placeholder = "I notice that...";
    noticeTA.value = state.getResponse(0, "notice") || "";
    noticeTA.addEventListener("input", () => state.saveResponse(0, "notice", noticeTA.value));
    noticeCard.append(noticeTA);

    const wonderCard = document.createElement("div");
    wonderCard.className = "card card-coral";
    wonderCard.innerHTML = `<h4 style="color:var(--coral); margin-bottom:var(--sp-3);">🤔 I Wonder...</h4>
      ${(cfg.wonderPrompts || []).map((p) => `<div class="sentence-frame" style="margin-bottom:var(--sp-2); border-color:rgba(217,121,93,0.25); background:rgba(217,121,93,0.06);"><span style="font-weight:600;">${esc(p)}</span></div>`).join("")}`;
    wonderTA = document.createElement("textarea");
    wonderTA.className = "text-input";
    wonderTA.rows = 3;
    wonderTA.placeholder = "I wonder if...";
    wonderTA.value = state.getResponse(0, "wonder") || "";
    wonderTA.addEventListener("input", () => state.saveResponse(0, "wonder", wonderTA.value));
    wonderCard.append(wonderTA);

    grid.append(noticeCard, wonderCard);
    el.append(grid);
  }

  // ── Launch ────────────────────────────────────────────────────────────────
  // Now the application scenario and the guided solve — the word problem lives
  // here, after Be Curious / Notice & Wonder.
  phaseHeader(el, "🚀", "section-icon-amber", "Launch", "Read the problem, then show your work.");

  const scenario = document.createElement("div");
  scenario.className = "card launch-scenario-card";
  scenario.innerHTML = `
    <div class="badge badge-amber mb-4">${esc(cfg.badge || config.title)}</div>
    <p class="launch-narrative" data-annotate="word-problem">${renderMathText(cfg.narrative)}</p>`;
  if (cfg.contextImage || config.theme) {
    renderThemeIllustration(scenario, config.theme, cfg.contextImage || null);
  }
  el.append(scenario);

  // Hand off to the full step-by-step Learn It page — the single place the
  // concept is taught. (Concept teaching no longer renders inside Launch; it
  // used to triple-render here, in Learn It, and in Notes.)
  renderLearnItBridge(el, ctx, config);

  // Show Your Work — the application problem + a guided, typeable solve-it
  // scaffold (strategy choice, steps, answer, justification, self-check + revise).
  // This is where students DO and SHOW math in the Launch (UIFR TEACH 2/3/4 L4).
  renderShowYourWork(el, config, state);

  // Launch Turn & Talk — speech-bubble discussion moment (non-graded).
  const launchTT = resolveTurnTalk("launch", config);
  if (launchTT) {
    renderTurnAndTalk(el, launchTT, state, 0);
  }

  // Inline Reveal Math slides for this section (launch + instruction).
  renderRevealSlides(el, config, ["launch", "instruction"]);

  // Let students mark up the word problems (highlight / underline / bold).
  enableWordProblemAnnotation(el);

  const btn = document.createElement("button");
  btn.className = "btn btn-primary btn-lg mt-6";
  btn.textContent = "Continue to Explore →";
  btn.addEventListener("click", async () => {
    if (
      noticeTA &&
      wonderTA &&
      (noticeTA.value.trim().length < 5 || wonderTA.value.trim().length < 5)
    ) {
      let fb = el.querySelector(".launch-fb");
      if (!fb) {
        fb = ctx.engagement.createFeedback(
          "hint",
          "Write at least a short response in both boxes.",
        );
        fb.classList.add("launch-fb");
        el.append(fb);
      }
      return;
    }
    el.querySelector(".launch-fb")?.remove();
    await completePhase(el, ctx, state, 0, "Launch", 1, 1);
  });
  el.append(btn);
}

// ── Phase 3: Explore ──
function renderExplorePhase(el, state, ctx, config) {
  const cfg = config.explore;
  phaseHeader(
    el,
    "🔍",
    "section-icon-teal",
    "Explore",
    cfg.instructions || "Investigate the concept with an interactive tool.",
  );

  // Opt-in data diagram shown up front so students can SEE and read the visual
  // while they work the interaction below it. `diagram` accepts any visual kind
  // (histogram, dot-plot, box-plot, bar-chart, number-line); `histogram` kept
  // for back-compat.
  const exploreDiagram = cfg.diagram || cfg.histogram;
  if (exploreDiagram) {
    const figCard = document.createElement("div");
    figCard.className = "card";
    figCard.innerHTML = cfg.diagram ? buildVisual(cfg.diagram) : histogramSVG(cfg.histogram);
    el.append(figCard);
  }

  // Surface a Turn & Talk discussion moment after the Explore interaction.
  // It is non-graded: confirming it advances the phase. A "Skip / Continue"
  // affordance is built into the button flow so it never blocks progress.
  const showTurnTalkThenComplete = () => {
    renderTurnAndTalk(el, resolveTurnTalk("explore", config), state, 2, () => {
      completePhase(el, ctx, state, 1, "Explore", 1, 1);
    });
    const cont = document.createElement("button");
    cont.type = "button";
    cont.className = "btn btn-primary btn-lg mt-4";
    cont.textContent = "Continue to Practice →";
    cont.addEventListener("click", () => completePhase(el, ctx, state, 1, "Explore", 1, 1));
    el.append(cont);
  };

  const exploreShell = document.createElement("div");
  exploreShell.className = "explore-problem-wrap";
  el.append(exploreShell);

  // Inline Reveal Math slides for the Explore section.
  renderRevealSlides(el, config, "explore");

  renderComponent(
    exploreShell,
    { ...cfg, stem: cfg.instructions || cfg.stem },
    () => {
      if (cfg.discourse) {
        const disc = document.createElement("div");
        disc.className = "card card-teal mt-6";
        disc.innerHTML = `<h4 style="color:var(--teal-ink); margin-bottom:var(--sp-3);">💬 Discuss</h4>`;
        renderOpenResponse(disc, {
          prompt: cfg.discourse.prompt,
          sentenceFrame: cfg.discourse.sentenceFrame,
          keywords: cfg.discourse.keywords,
          minLength: 20,
          onSubmit() {
            showTurnTalkThenComplete();
          },
        });
        el.append(disc);
      } else {
        showTurnTalkThenComplete();
      }
    },
    { number: 1, total: 1, skipHints: true },
  );
}

// ── Phase 4: Practice (adaptive) ──
const TIER_LABELS = {
  level1: { name: "Level 1", badge: "badge-teal" },
  core: { name: "On Level", badge: "badge-amber" },
  level2: { name: "Level 2", badge: "badge-navy" },
};

function renderWorkedExamplePanel(host, config) {
  const worked = deriveWorkedSteps(config);
  if (!worked.iDo) return;

  const panel = document.createElement("details");
  panel.className = "worked-example-panel";
  panel.open = true;

  const steps = (worked.iDo.steps || [])
    .map(
      (s, i) =>
        `<li class="worked-step"><span class="worked-step-num">${i + 1}</span><span>${esc(s)}</span></li>`,
    )
    .join("");

  panel.innerHTML = `
    <summary class="worked-example-summary">
      <span class="worked-example-icon" aria-hidden="true">📝</span>
      <span><strong>Worked Example</strong> — watch how it's done before you practice</span>
    </summary>
    <div class="worked-example-body">
      <p class="worked-example-problem">${esc(worked.iDo.problem)}</p>
      <ol class="worked-example-steps">${steps}</ol>
      ${worked.iDo.answer ? `<div class="worked-example-answer"><strong>Answer:</strong> ${esc(worked.iDo.answer)}</div>` : ""}
    </div>`;
  host.append(panel);
}

function renderCommonMistakeCallout(host, config) {
  const text = deriveCommonMistake(config);
  if (!text) return;

  const box = document.createElement("div");
  box.className = "common-mistake-callout";
  box.innerHTML = `
    <span class="common-mistake-icon" aria-hidden="true">⚠️</span>
    <div>
      <strong>${stackHtml(t("commonMistake", "en"), t("commonMistake", "es"))}</strong>
      <p>${esc(text)}</p>
    </div>`;
  host.append(box);
}

// Normalize a typed math answer for comparison: lowercase, strip spaces, unify
// the many multiplication symbols, and turn unicode superscripts into ^n.
function normalizeAnswer(s) {
  return String(s == null ? "" : s)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[×x*·•]/g, "*")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/⁴/g, "^4")
    .replace(/[.,;]+$/, "");
}

// Decide whether a typed answer can be auto-graded, and if so whether it's
// correct. Returns {graded:false} for complex expressions (formatting varies too
// much to grade fairly) so the UI falls back to a self-check reveal.
function gradeSkillAnswer(student, correct) {
  const a = normalizeAnswer(student);
  const b = normalizeAnswer(correct);
  if (!a) return { graded: false };
  if (a === b) return { graded: true, correct: true };
  const isNum = (s) => /^-?\d+(?:\.\d+)?$/.test(s);
  if (isNum(a) && isNum(b)) return { graded: true, correct: Number(a) === Number(b) };
  // Short, simple answers (one word/number, no operators) are safe to mark.
  if (b.length <= 12 && !/[*^/+]/.test(b)) return { graded: true, correct: false };
  return { graded: false };
}

// Real skill practice: a few of the lesson's own problems presented as "solve
// it" — show your steps, write the answer, then check. Numbers and short answers
// are auto-graded (✅/❌); complex expressions fall back to a self-check reveal.
// Genuinely practices the skill (not only matching/sorting games), and saves
// work to the Practice phase responses. No-op when there are no solvable items.
function renderSkillPractice(host, config, state) {
  const p = config.practice || {};
  const pool = []
    .concat(p.approaching || [], p.onLevel || [], p.extending || [])
    .filter(
      (it) =>
        it &&
        it.stem &&
        (Array.isArray(it.choices) || it.sampleAnswer || it.answer) &&
        (it.type === "multiple-choice" || it.type === "open-response" || !it.type),
    )
    .slice(0, 3);
  if (!pool.length) return;

  const total = pool.length;
  const card = document.createElement("div");
  card.className = "card skill-practice";
  card.innerHTML = `
    <h4 style="color:var(--navy,#264653); margin:0 0 var(--sp-2,8px);">✏️ Practice the skill — solve these</h4>
    <p class="sp-intro">Work each problem. Show your steps, write your answer, then tap <strong>Check answer</strong>.</p>`;

  pool.forEach((it, i) => {
    const answer =
      Array.isArray(it.choices) && typeof it.correctIndex === "number"
        ? it.choices[it.correctIndex]
        : it.sampleAnswer || it.answer || "";
    const wrap = document.createElement("div");
    wrap.className = "sp-problem";
    wrap.innerHTML = `
      <p class="sp-stem"><span class="sp-num" aria-hidden="true">${i + 1}</span><span class="sp-stem-text" data-annotate="word-problem"><span class="sr-only">Problem ${i + 1} of ${total}. </span>${esc(it.stem)}</span></p>
      <textarea class="sp-work text-input" rows="3" placeholder="Show your steps here…"></textarea>
      <div class="sp-row">
        <label class="sp-answer-label">My answer: <input class="sp-answer" type="text" /></label>
        <button type="button" class="btn btn-secondary sp-check">Check answer</button>
      </div>
      <div class="sp-reveal" hidden></div>`;

    const workEl = wrap.querySelector(".sp-work");
    const ansEl = wrap.querySelector(".sp-answer");
    const reveal = wrap.querySelector(".sp-reveal");
    workEl.value = state.getResponse(2, `sp-work-${i}`) || "";
    ansEl.value = state.getResponse(2, `sp-ans-${i}`) || "";
    workEl.addEventListener("input", () => state.saveResponse(2, `sp-work-${i}`, workEl.value));
    ansEl.addEventListener("input", () => state.saveResponse(2, `sp-ans-${i}`, ansEl.value));
    wrap.querySelector(".sp-check").addEventListener("click", () => {
      reveal.hidden = false;
      const why = it.explanation
        ? `<br><span style="color:var(--muted,#5f6f80);">${esc(it.explanation)}</span>`
        : "";
      const r = gradeSkillAnswer(ansEl.value, answer);
      if (r.graded && r.correct) {
        reveal.style.background = "rgba(46,158,91,0.10)";
        reveal.style.borderColor = "#2e9e5b";
        reveal.innerHTML = `<strong>✅ Correct!</strong> ${esc(answer)}${why}`;
      } else if (r.graded) {
        reveal.style.background = "rgba(217,83,79,0.08)";
        reveal.style.borderColor = "#d9534f";
        reveal.innerHTML = `<strong>❌ Not quite.</strong> The answer is <strong>${esc(answer)}</strong>. Check your work and try again.${why}`;
      } else {
        reveal.style.background = "rgba(42,157,143,0.08)";
        reveal.style.borderColor = "var(--teal,#2a9d8f)";
        reveal.innerHTML = `<strong>✅ Answer:</strong> ${esc(answer)}${why}`;
      }
    });
    card.append(wrap);
  });

  host.append(card);
  // Let students mark up each problem stem (highlight / underline / bold).
  enableWordProblemAnnotation(card);
}

function renderPracticePhase(el, state, ctx, config) {
  phaseHeader(
    el,
    "✏️",
    "section-icon-navy",
    "Practice",
    "Problems adapt to how you're doing — keep going!",
  );

  instructionCallout(
    el,
    "🎯",
    "<strong>Adaptive practice:</strong> Pick <strong>Level 1</strong> for step-by-step hints, <strong>Level 2</strong> for a stretch challenge, or <strong>Adaptive</strong> to let the activity adjust. Wrong answers teach — read the feedback and try again.",
  );

  renderWorkedExamplePanel(el, config);
  renderCommonMistakeCallout(el, config);

  // Lead with real skill practice — solve problems, show steps — before the
  // interactive games/sorts below.
  renderSkillPractice(el, config, state);

  // Non-stigmatizing Level 1 / Level 2 / Adaptive selector. Changing the level
  // immediately re-serves a problem at the chosen tier — without an onChange the
  // pick only took effect on the next item, so the selector looked broken.
  const selectorSlot = document.createElement("div");
  el.append(selectorSlot);
  mountLevelSelector(selectorSlot, state, () => {
    if (seq.servedCount < seq.total) next();
  });

  // Sticky practice score bar
  const scoreBar = document.createElement("div");
  scoreBar.className = "practice-score-bar";
  scoreBar.innerHTML = `
    <span class="practice-score-coins" aria-live="polite">🪙 <span class="coin-count">0</span></span>
    <span class="practice-score-streak" aria-live="polite"></span>
    <span class="practice-score-accuracy" aria-live="polite"></span>`;
  el.append(scoreBar);

  const tierBadge = document.createElement("div");
  tierBadge.className = "badge badge-amber mb-4";
  el.append(tierBadge);

  const area = document.createElement("div");
  el.append(area);

  // Inline Reveal Math slides for the Practice section. Appended after the
  // (dynamically replaced) problem area so they remain visible as a stable
  // reference while problems cycle through `area`.
  renderRevealSlides(el, config, "practice");

  const seq = createAdaptiveSequence(config, state);
  let totalCorrect = 0,
    totalAttempts = 0,
    shown = 0,
    coins = 0;

  function updateScoreBar() {
    const coinEl = scoreBar.querySelector(".coin-count");
    const accEl = scoreBar.querySelector(".practice-score-accuracy");
    const streakEl = scoreBar.querySelector(".practice-score-streak");
    if (coinEl) coinEl.textContent = String(coins);
    if (accEl && totalAttempts > 0) {
      accEl.textContent = `${Math.round((totalCorrect / totalAttempts) * 100)}% correct`;
    }
    const s = state.get();
    if (streakEl && s.streak >= 2) {
      streakEl.textContent = `🔥 ${s.streak} streak`;
    } else if (streakEl) {
      streakEl.textContent = "";
    }
  }

  function finishPractice() {
    area.innerHTML = "";
    completePhase(el, ctx, state, 2, "Practice", totalCorrect, totalAttempts);
  }

  // Run the ungraded optional items through the shared component loop, then
  // finish. Correctness is intentionally ignored — these never affect scoring.
  function runOptionalPractice(host, items, done) {
    let i = 0;
    function step() {
      if (i >= items.length) {
        done();
        return;
      }
      host.innerHTML = "";
      const label = document.createElement("div");
      label.style.cssText =
        "font-size:0.82rem; font-weight:700; color:var(--muted); margin-bottom:var(--sp-3);";
      const stepWord = config.practice?.optionalActivity?.stepLabel || "Extra Practice";
      label.textContent = `${stepWord} ${i + 1} of ${items.length}`;
      host.append(label);
      const slot = document.createElement("div");
      host.append(slot);
      renderComponent(slot, items[i], () => {
        i++;
        setTimeout(step, 800);
      });
    }
    step();
  }

  function next() {
    const prob = seq.nextProblem(levelOverride(state));
    if (!prob) {
      area.innerHTML = "";
      // Optional, ungraded Extra Practice opt-in. Does not touch scoring,
      // stars, or adaptive logic. Lessons without practice.optional finish
      // exactly as before.
      const optional = config.practice?.optional;
      if (optional?.length) {
        tierBadge.textContent = "";
        tierBadge.className = "";
        renderOptionalPracticeOptIn(area, {
          activity: config.practice?.optionalActivity,
          onSkip: finishPractice,
          onTry: () => runOptionalPractice(area, optional, finishPractice),
        });
        return;
      }
      finishPractice();
      return;
    }
    shown++;
    const tl = TIER_LABELS[prob.tier] || TIER_LABELS.core;
    tierBadge.className = `badge ${tl.badge} mb-4`;
    tierBadge.textContent = tl.name;

    area.innerHTML = "";

    // Level 1 items get an always-visible scaffold hint. Uses an authored
    // scaffold/hint when present, otherwise derives a short, type-aware,
    // non-answer-giving nudge so every support item is scaffolded.
    if (prob.tier === "level1") {
      const scaffoldText = deriveScaffold(prob);
      if (scaffoldText) {
        const hint = document.createElement("details");
        hint.className = "scaffold-panel";
        hint.open = true;
        hint.innerHTML = `<summary>💡 Hint — read this first</summary><p style="margin:var(--sp-2) 0 0;">${esc(scaffoldText)}</p>`;
        area.append(hint);
      }
    }

    renderComponent(
      area,
      prob,
      (isCorrect) => {
        totalAttempts++;
        if (isCorrect) {
          totalCorrect++;
          coins++;
          state.awardCoin(1);
          const result = ctx.engagement.recordCorrect(null);
          if (result.streakMessage) {
            const toast = document.createElement("div");
            toast.className = "feedback feedback-success visible practice-toast";
            toast.style.animation = "feedbackIn 0.3s var(--ease-spring)";
            toast.innerHTML = `<span class="feedback-icon">✓</span><span>${result.message} ${result.streakMessage}</span>`;
            area.append(toast);
          }
          updateScoreBar();
          setTimeout(() => next(), 1500);
        } else {
          ctx.engagement.recordIncorrect(null);
          updateScoreBar();
          // Run the scaffolded remediation sequence (hint -> worked example ->
          // guided steps -> easier retry) before advancing. The flow also biases
          // the adaptive tier toward Level 1 on repeated misses via state hooks.
          const remSlot = document.createElement("div");
          remSlot.className = "mt-4";
          area.append(remSlot);
          renderRemediation(remSlot, {
            question: prob,
            state,
            level: prob.tier,
            onComplete() {
              setTimeout(() => next(), 600);
            },
          });
        }
      },
      { number: shown, total: seq.total, tier: prob.tier, state },
    );
  }
  next();
}

// ── Phase 5: Connect ──
function renderConnectPhase(el, state, ctx, config) {
  const cfg = config.connect;
  phaseHeader(
    el,
    "🌎",
    "section-icon-teal",
    "Real-World Connection",
    "Where does this math live in the wild?",
  );

  const card = document.createElement("div");
  card.className = "card connect-scenario-card";
  card.innerHTML = `
    <div class="connect-scenario-header">
      <span class="connect-scenario-icon" aria-hidden="true">${config.themeEmoji || "🌎"}</span>
      <div>
        <div class="badge badge-amber mb-2">Math in the Wild</div>
        <div class="connect-scenario-theme">${esc(config.theme?.replace(/-/g, " ") || "Real World")}</div>
      </div>
    </div>
    <p class="connect-scenario-text">${renderMathText(cfg.scenario)}</p>`;
  if (cfg.diagram) card.innerHTML += buildVisual(cfg.diagram);
  else if (cfg.histogram) card.innerHTML += histogramSVG(cfg.histogram);
  el.append(card);

  // Turn & Talk primes the written response below. Non-graded; does not gate
  // the Connect submit, so phase completion/scoring are unaffected.
  renderTurnAndTalk(el, resolveTurnTalk("connect", config), state, 4);

  // The Writing Revolution (TWR) writing step. Auto-derived from config; shows
  // on every lesson. Formative only — persisted but never gates phase scoring.
  renderTwrWriting(el, config, {
    getResponse: (key) => state.getResponse(3, key),
    saveResponse: (key, val) => state.saveResponse(3, key, val),
  });

  // Inline Reveal Math slides for the Connect section.
  renderRevealSlides(el, config, "connect");

  // Editable response box (core-owned), mirroring Launch/Reflect persistence.
  const minLength = 25;
  const promptText = cfg.promptQuestion || "How does this connect to what we learned?";

  const respCard = document.createElement("div");
  respCard.className = "card card-teal";

  const fieldId = "connect-response";

  const label = document.createElement("label");
  label.setAttribute("for", fieldId);
  label.className = "connect-prompt-label";
  label.textContent = promptText;
  respCard.append(label);

  if (cfg.prompt) {
    const frame = document.createElement("div");
    frame.className = "sentence-frame";
    frame.innerHTML = String(cfg.prompt).replace(/___/g, '<span class="blank">&nbsp;</span>');
    respCard.append(frame);
  }

  const textarea = document.createElement("textarea");
  textarea.id = fieldId;
  textarea.className = "text-input";
  textarea.rows = 4;
  textarea.placeholder = "Type your response here...";
  textarea.setAttribute("aria-label", promptText);
  textarea.value = state.getResponse(3, "connect") || "";
  respCard.append(textarea);

  const charCount = document.createElement("div");
  charCount.className = "connect-charcount";
  const updateCount = () => {
    const len = textarea.value.trim().length;
    charCount.textContent = `${len} / ${minLength} characters minimum`;
    charCount.classList.toggle("is-ready", len >= minLength);
  };
  updateCount();
  respCard.append(charCount);

  // Persist on every keystroke and restore on reload.
  textarea.addEventListener("input", () => {
    state.saveResponse(3, "connect", textarea.value);
    updateCount();
  });

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  respCard.append(feedbackSlot);

  const submitBtn = document.createElement("button");
  submitBtn.className = "btn btn-primary mt-4";
  submitBtn.textContent = "Submit Response";

  let submitted = false;

  const showFeedback = (type, message) => {
    feedbackSlot.innerHTML = "";
    const fb = document.createElement("div");
    fb.className = `feedback feedback-${type} visible`;
    fb.setAttribute("role", "alert");
    fb.innerHTML = `<span class="feedback-icon">${
      type === "success" ? "✓" : "💡"
    }</span><span>${esc(message)}</span>`;
    feedbackSlot.append(fb);
  };

  submitBtn.addEventListener("click", () => {
    if (submitted) return;
    const text = textarea.value.trim();

    if (text.length < minLength) {
      showFeedback("hint", `Write at least ${minLength} characters. You have ${text.length}.`);
      return;
    }

    let valid = true;
    if (cfg.keywords && cfg.keywords.length > 0) {
      const lower = text.toLowerCase();
      const found = cfg.keywords.filter((kw) => lower.includes(String(kw).toLowerCase()));
      if (found.length === 0) {
        showFeedback(
          "hint",
          `Try using math vocabulary in your response. Think about: ${cfg.keywords
            .slice(0, 3)
            .join(", ")}.`,
        );
        return;
      }
      const missing = cfg.keywords.length - found.length;
      valid = missing <= Math.ceil(cfg.keywords.length / 2);
    }

    submitted = true;
    state.saveResponse(3, "connect", textarea.value);
    textarea.readOnly = true;
    submitBtn.style.display = "none";
    showFeedback("success", "Great response! Your thinking is recorded.");
    completePhase(el, ctx, state, 3, "Connect", valid ? 1 : 0, 1);
  });

  respCard.append(submitBtn);
  el.append(respCard);
}

// ── Phase 6: Reflect ──
function renderReflectPhase(el, state, ctx, config) {
  const cfg = config.reflect;
  phaseHeader(el, "💡", "section-icon-coral", phaseName(4), t("reflectDesc"));

  // One thing I learned (exit ticket prep)
  const learnedCard = document.createElement("div");
  learnedCard.className = "card card-amber";
  learnedCard.innerHTML = `<h4 style="color:var(--amber-ink); margin-bottom:var(--sp-3);">✨ ${stackHtml(t("oneThingToday", "en"), t("oneThingToday", "es"))}</h4>`;
  const learnedTA = document.createElement("textarea");
  learnedTA.className = "text-input";
  learnedTA.rows = 2;
  learnedTA.placeholder = t("oneThingPlaceholder");
  learnedTA.value = state.getResponse(4, "one_thing_learned") || "";
  learnedTA.addEventListener("input", () =>
    state.saveResponse(4, "one_thing_learned", learnedTA.value),
  );
  learnedCard.append(learnedTA);
  el.append(learnedCard);

  // Confidence slider (1–5)
  const confCard = document.createElement("div");
  confCard.className = "card card-teal confidence-card";
  const savedConf = Number(state.getResponse(4, "confidence")) || 3;
  confCard.innerHTML = `
    <h4 style="color:var(--teal-ink); margin-bottom:var(--sp-3);">${t("howConfident")} ${esc(config.title)}?</h4>
    <div class="confidence-slider-wrap">
      <input type="range" class="confidence-slider" min="1" max="5" step="1" value="${savedConf}" aria-label="Confidence level 1 to 5" />
      <div class="confidence-labels">
        <span>😅 ${stackHtml(t("notYet", "en"), t("notYet", "es"))}</span><span>🤔 ${stackHtml(t("gettingThere", "en"), t("gettingThere", "es"))}</span><span>😊 ${stackHtml(t("gotIt", "en"), t("gotIt", "es"))}</span>
      </div>
      <output class="confidence-output" aria-live="polite">${savedConf}/5</output>
    </div>
    <div class="self-assess-quick" style="display:flex; gap:var(--sp-2); margin-top:var(--sp-3); justify-content:center;">
      ${[`😊 ${t("gotIt")}|5`, `🤔 ${t("almost")}|3`, `😅 ${t("needHelp")}|1`]
        .map((s) => {
          const [txt, lv] = s.split("|");
          return `<button type="button" class="btn btn-secondary self-assess" data-level="${lv}" style="flex:1; max-width:140px;">${txt}</button>`;
        })
        .join("")}
    </div>`;
  const slider = confCard.querySelector(".confidence-slider");
  const output = confCard.querySelector(".confidence-output");
  slider.addEventListener("input", () => {
    output.textContent = `${slider.value}/5`;
    state.saveResponse(4, "confidence", slider.value);
    state.saveResponse(4, "self-assess", slider.value);
  });
  confCard.querySelectorAll(".self-assess").forEach((btn) => {
    btn.addEventListener("click", () => {
      slider.value = btn.dataset.level;
      output.textContent = `${btn.dataset.level}/5`;
      state.saveResponse(4, "confidence", btn.dataset.level);
      state.saveResponse(4, "self-assess", btn.dataset.level);
      confCard.querySelectorAll(".self-assess").forEach((b) => {
        b.classList.toggle("is-selected", b === btn);
      });
    });
  });
  el.append(confCard);

  el.append(buildPrintableSummary(state, config));

  // Inline Reveal Math slides for the closing/reflect section.
  renderRevealSlides(el, config, "closure");

  // Exit ticket
  phaseHeader(el, "🎯", "section-icon-navy", "Exit Ticket", "Show what you know!");
  renderMultipleChoice(el, {
    ...cfg.exitTicket,
    onAnswer(isCorrect) {
      setTimeout(async () => {
        const xp = ctx.engagement.awardXP(4, {
          correct: isCorrect ? 1 : 0,
          total: 1,
        });
        const stars = state.get().phases[4]?.stars ?? 0;
        await ctx.engagement.showPhaseComplete(el, "Reflect", xp, stars);
        showFinalSummary(el, state, config);
      }, 1000);
    },
  });
}

// End-of-lesson objective self-review ("Did I get it?"). Reuses the same
// objective resolvers as the launch header so the text matches exactly.
function renderObjectiveReview(state, config) {
  const card = document.createElement("section");
  card.className = "card card-teal objective-review";
  card.setAttribute("aria-labelledby", "obj-review-title");
  card.style.cssText = "text-align:left; margin-top:var(--sp-6);";

  const items = [
    {
      key: "review_content",
      label: t("contentObjective"),
      // resolveContentObjective returns HTML-escaped text; show as text node.
      html: resolveContentObjective(config),
    },
    {
      key: "review_language",
      label: t("languageObjective"),
      html: resolveLanguageObjective(config),
    },
  ];

  card.innerHTML = `
    <h4 id="obj-review-title" style="color:var(--teal-ink); margin-bottom:var(--sp-2);">✅ ${stackHtml(t("didIGetIt", "en"), t("didIGetIt", "es"))}</h4>
    <p style="color:var(--muted); margin:0 0 var(--sp-4); font-size:0.92rem;">Check off each goal you can do. Be honest — it helps you know what to practice!</p>
  `;

  items.forEach((item) => {
    const checked = state.getResponse(4, item.key) === "yes";
    const row = document.createElement("label");
    row.style.cssText =
      "display:flex; align-items:flex-start; gap:var(--sp-3); padding:var(--sp-3); background:white; border-radius:var(--radius-sm); margin-bottom:var(--sp-3); cursor:pointer; border:1px solid var(--line);";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = checked;
    cb.style.cssText =
      "width:1.4rem; height:1.4rem; margin-top:2px; flex:0 0 auto; cursor:pointer;";
    cb.setAttribute("aria-label", `I can do this — ${item.label}`);

    const text = document.createElement("div");
    text.innerHTML = `
      <div style="font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:0.04em; color:var(--teal-ink); margin-bottom:2px;">${item.label}</div>
      <div style="font-weight:600;">${item.html}</div>
    `;

    cb.addEventListener("change", () => {
      state.saveResponse(4, item.key, cb.checked ? "yes" : "no");
      row.style.borderColor = cb.checked ? "var(--teal)" : "var(--line)";
      row.style.background = cb.checked ? "var(--teal-light)" : "white";
    });
    if (checked) {
      row.style.borderColor = "var(--teal)";
      row.style.background = "var(--teal-light)";
    }

    row.append(cb, text);
    card.append(row);
  });

  return card;
}

function showFinalSummary(el, state, config) {
  el.innerHTML = "";
  const s = state.get();
  const totalStars = s.phases.reduce((sum, p) => sum + p.stars, 0);
  const pct = totalStars / 18;
  const grade =
    pct >= 0.9
      ? `🏆 ${t("gradeOutstanding")}`
      : pct >= 0.7
        ? `⭐ ${t("gradeGreat")}`
        : pct >= 0.5
          ? `👍 ${t("gradeGood")}`
          : `💪 ${t("gradeKeep")}`;
  const streakText = s.bestStreak >= 3 ? `🔥 Best streak: ${s.bestStreak} in a row` : "";
  const accuracy = s.totalAttempts > 0 ? Math.round((s.totalCorrect / s.totalAttempts) * 100) : 100;
  checkBadges(state);
  const earnedBadges = (s.badges || [])
    .map((id) => getBadgeDefs().find((b) => b.id === id))
    .filter(Boolean);

  const paceBadge =
    s.totalAttempts > 0 && s.totalCorrect / s.totalAttempts >= 0.85
      ? "🎯 Sharpshooter"
      : s.totalAttempts >= 8
        ? "🧠 Deep Thinker"
        : "";

  const badgeRow = earnedBadges.length
    ? `<div class="certificate-badges">${earnedBadges.map((b) => `<span class="cert-badge-pill">${b.emoji} ${esc(badgeName(b.id))}</span>`).join("")}</div>`
    : "";

  const summary = document.createElement("div");
  summary.className = "completion-certificate";
  summary.style.animation = "phaseIn 0.5s var(--ease-out)";
  summary.innerHTML = `
    <div class="certificate-ribbon" aria-hidden="true">🏆</div>
    <div class="certificate-header">
      <div class="certificate-badge">${stackHtml(t("lessonComplete", "en"), t("lessonComplete", "es"))}</div>
      <h2 class="certificate-title">${esc(config.title)}</h2>
      <p class="certificate-subtitle">${grade}</p>
    </div>
    <div class="certificate-student">
      <span class="certificate-label">${stackHtml(t("awardedTo", "en"), t("awardedTo", "es"))}</span>
      <span class="certificate-name">${esc(s.studentName || t("mathematician"))}</span>
      ${s.studentPeriod ? `<span class="certificate-period">Period ${esc(s.studentPeriod)}</span>` : ""}
    </div>
    <div class="certificate-stats">
      <div class="cert-stat"><div class="cert-stat-value xp-counter">0</div><div class="cert-stat-label">${stackHtml(t("xpEarned", "en"), t("xpEarned", "es"))}</div></div>
      <div class="cert-stat"><div class="cert-stat-value cert-stars">${totalStars}<span class="cert-stat-denom">/18</span></div><div class="cert-stat-label">${stackHtml(t("stars", "en"), t("stars", "es"))}</div></div>
      <div class="cert-stat"><div class="cert-stat-value">${s.coins || 0}</div><div class="cert-stat-label">${stackHtml(t("coins", "en"), t("coins", "es"))}</div></div>
      <div class="cert-stat"><div class="cert-stat-value">${accuracy}%</div><div class="cert-stat-label">${stackHtml(t("accuracy", "en"), t("accuracy", "es"))}</div></div>
    </div>
    ${badgeRow}
    ${streakText ? `<div class="certificate-streak">${esc(streakText)}</div>` : ""}
    ${paceBadge ? `<div class="certificate-pace">${paceBadge}</div>` : ""}
    <div class="certificate-phases">
      ${s.phases.map((p) => `<div class="cert-phase-row"><span class="cert-phase-name">${esc(p.name)}</span><span class="cert-phase-stars" aria-label="${p.stars} of 3 stars">${"★".repeat(p.stars)}${"☆".repeat(3 - p.stars)}</span></div>`).join("")}
    </div>
    <div class="certificate-footer">
      <span class="certificate-standard badge badge-teal">${esc(config.standard)}</span>
      <span class="certificate-date">${new Date().toLocaleDateString()}</span>
      <span class="certificate-brand">Neft Teacher</span>
    </div>
    <button type="button" class="btn btn-secondary certificate-print-btn" onclick="window.print()">🖨️ ${stackHtml(t("printCertificate", "en"), t("printCertificate", "es"))}</button>`;
  el.append(summary);
  mountCertificateDownload(summary, config, state);

  if (window.fireConfetti) window.fireConfetti();

  // "Did I get it?" objective self-review. Re-shows the same Content + Language
  // objectives from the launch header, each with a checkbox the student ticks
  // to self-assess. Checks persist to state (localStorage). No new config —
  // reuses the existing objective fields and the launch-header fallbacks.
  el.append(renderObjectiveReview(state, config));

  // Auto-grade + save/export (additive; does not affect scoring above).
  // Grades the student, persists to the localStorage gradebook, and offers
  // CSV/JSON/Print exports for the teacher. Local-first only — no network.
  try {
    el.append(buildGradeCard(state, config));
  } catch (_) {
    /* grading/export must never break the completion screen */
  }

  // Optional "Choose an Activity" menu — surfaced at completion on every
  // lesson. Auto-populated from existing lesson data (vocab terms +
  // optional practice); everything here is ungraded and does not affect
  // the summary above. Renders nothing if the lesson has no eligible
  // activities.
  const chooserSlot = document.createElement("div");
  chooserSlot.style.cssText = "margin-top:var(--sp-6);";
  renderActivityChooser(chooserSlot, { config, renderComponent });
  if (chooserSlot.childNodes.length) el.append(chooserSlot);

  const counterEl = summary.querySelector(".xp-counter");
  if (counterEl && s.xp > 0) {
    let current = 0;
    const step = Math.max(1, Math.ceil(s.xp / 30));
    const interval = setInterval(() => {
      current = Math.min(current + step, s.xp);
      counterEl.textContent = current;
      if (current >= s.xp) clearInterval(interval);
    }, 30);
  }
}
