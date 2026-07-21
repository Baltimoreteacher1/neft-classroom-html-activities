// visual-figures.js — shared, accessible SVG data-figure builders (histogram,
// dot plot, box plot, bar chart, factor tree, number line, tape diagram,
// coordinate plane). Extracted verbatim from lesson-renderer.js so the full
// 5-phase renderer and the small-group studio renderer share ONE source of
// truth for static figures. Pure string builders — no DOM side effects.

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// ── Inline data visuals (opt-in via config) ─────────────────────────────────
// Draw a real, accessible SVG histogram from authored interval/frequency data.
// Opt-in only: a lesson supplies `{ bars:[{label,value}], xLabel, yLabel,
// highlightIndex, title, caption }`. Lessons without this field are unaffected.
// Bars touch (no gaps) to match the definition of a histogram, the tallest (or
// highlighted) bar is tinted, and each bar shows its frequency on top.
// Build an accessible label that includes the figure's data, so a screen
// reader announces the actual values rather than just the chart title.
export function figureAria(cfg, fallback = "Data figure") {
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
  // Only describe a five-number summary for an actual box-plot (authored q1/
  // median/q3). A number-line also carries min/max/step — keying off those made
  // this spuriously announce "Q1 undefined, median undefined" for every number
  // line. Box-plots built from `values` are already covered by the branch above.
  if (cfg && ["q1", "median", "q3"].some((k) => cfg[k] != null)) {
    parts.push(
      `five-number summary: minimum ${cfg.min}, Q1 ${cfg.q1}, median ${cfg.median}, Q3 ${cfg.q3}, maximum ${cfg.max}`,
    );
  }
  if (cfg?.xLabel) parts.push(`x-axis: ${cfg.xLabel}`);
  if (cfg?.yLabel) parts.push(`y-axis: ${cfg.yLabel}`);
  return parts.length ? `${base}. ${parts.join(". ")}` : base;
}

export function histogramSVG(cfg) {
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
        `<rect class="hist-bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 1).toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}" stroke="#fff" stroke-width="1"/>` +
        `<text class="hist-val" x="${(x + bw / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--navy, #264653)">${v}</text>` +
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
export function dotPlotSVG(cfg) {
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
      return `<circle class="dot-mark" cx="${xOf(v).toFixed(1)}" cy="${cy.toFixed(1)}" r="6" fill="var(--teal,#2a9d8f)" stroke="#fff" stroke-width="1.5"/>`;
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
  return svgFigure(cfg, `${axis}${ticks.join("")}${dots}${xLabel}`, W, H, padT, "dot-plot-figure");
}

// Box-and-whisker plot from a five-number summary.
export function boxPlotSVG(cfg) {
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
    `<line class="box-whisker" x1="${xOf(min)}" y1="${midY}" x2="${xOf(q1)}" y2="${midY}" stroke="var(--ink,#333)" stroke-width="2"/>`,
    `<line class="box-whisker" x1="${xOf(q3)}" y1="${midY}" x2="${xOf(max)}" y2="${midY}" stroke="var(--ink,#333)" stroke-width="2"/>`,
    `<line class="box-whisker" x1="${xOf(min)}" y1="${top + 10}" x2="${xOf(min)}" y2="${bot - 10}" stroke="var(--ink,#333)" stroke-width="2"/>`,
    `<line class="box-whisker" x1="${xOf(max)}" y1="${top + 10}" x2="${xOf(max)}" y2="${bot - 10}" stroke="var(--ink,#333)" stroke-width="2"/>`,
    `<rect class="box-body" x="${xOf(q1)}" y="${top}" width="${(xOf(q3) - xOf(q1)).toFixed(1)}" height="${boxH}" fill="${teal}" fill-opacity="0.25" stroke="${teal}" stroke-width="2"/>`,
    `<line class="box-median" x1="${xOf(median)}" y1="${top}" x2="${xOf(median)}" y2="${bot}" stroke="var(--coral,#d9795d)" stroke-width="3"/>`,
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
  return svgFigure(cfg, `${parts.join("")}${labels}`, W, H, 10, "box-plot-figure");
}

// Categorical bar chart (bars have GAPS — contrast with a histogram).
export function barChartSVG(cfg) {
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
        `<rect class="bar-rect" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="var(--teal,#2a9d8f)"/>` +
        `<text class="bar-val" x="${(x + bw / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--navy,#264653)">${v}</text>` +
        `<text x="${(x + bw / 2).toFixed(1)}" y="${(baseY + 18).toFixed(1)}" text-anchor="middle" font-size="11" fill="var(--ink,#333)">${esc(b.label ?? "")}</text>`
      );
    })
    .join("");
  const axis = `<line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="var(--ink,#333)" stroke-width="1.5"/>`;
  return svgFigure(cfg, `${axis}${rects}`, W, H, padT, "bar-chart-figure");
}

// Draw a real, structured SVG factor tree diagram from config tree.
export function factorTreeSVG(cfg) {
  const W = 360;
  const H = 220;

  function getDepth(node) {
    if (!node) return 0;
    return 1 + Math.max(getDepth(node.left), getDepth(node.right));
  }

  const maxDepth = getDepth(cfg);
  let elements = [];

  function traverse(node, x, y, dx, depth) {
    if (!node) return;

    const isPrime = !node.left && !node.right;
    const fill = isPrime ? "#e2f9f5" : "#fbf4e6";
    const stroke = isPrime ? "#0d7a76" : "#d4952a";
    const textColor = isPrime ? "#095350" : "#8a5800";

    elements.push({
      type: "node",
      x,
      y,
      value: node.value,
      fill,
      stroke,
      textColor,
    });

    if (node.left) {
      const lx = x - dx;
      const ly = y + 52;
      elements.push({
        type: "line",
        x1: x,
        y1: y + 16,
        x2: lx,
        y2: ly - 16,
      });
      traverse(node.left, lx, ly, dx * 0.5, depth + 1);
    }

    if (node.right) {
      const rx = x + dx;
      const ry = y + 52;
      elements.push({
        type: "line",
        x1: x,
        y1: y + 16,
        x2: rx,
        y2: ry - 16,
      });
      traverse(node.right, rx, ry, dx * 0.5, depth + 1);
    }
  }

  traverse(cfg, W / 2, 28, W / 4, 1);

  let linesSvg = "";
  let nodesSvg = "";

  elements.forEach((el) => {
    if (el.type === "line") {
      linesSvg += `<line class="ft-branch" x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="#d7e2ed" stroke-width="2.5" />`;
    } else if (el.type === "node") {
      nodesSvg += `
        <g class="ft-node">
          <circle cx="${el.x}" cy="${el.y}" r="16" fill="${el.fill}" stroke="${el.stroke}" stroke-width="2" />
          <text x="${el.x}" y="${el.y}" dy="5" font-family="Segoe UI, sans-serif" font-weight="700" font-size="12px" fill="${el.textColor}" text-anchor="middle">${el.value}</text>
        </g>
      `;
    }
  });

  return `
    <div class="factor-tree-figure" style="margin:var(--sp-3) 0; display:flex; flex-direction:column; align-items:center;">
      ${cfg.title ? `<div style="font-weight:700; color:var(--navy,#12355b); margin-bottom:var(--sp-1); font-size:0.95rem;">${esc(cfg.title)}</div>` : ""}
      <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:auto; max-width:320px; display:block; background:#fff; border:1px solid #d7e2ed; border-radius:12px; padding:10px;">
        ${linesSvg}
        ${nodesSvg}
      </svg>
    </div>
  `;
}

// Simple labeled number line with optional marked points.
export function numberLineSVG(cfg) {
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
        `<circle class="nl-point" cx="${xOf(Number(p.value)).toFixed(1)}" cy="${y}" r="7" fill="var(--coral,#d9795d)" stroke="#fff" stroke-width="2"/>` +
        (p.label
          ? `<text class="nl-point-label" x="${xOf(Number(p.value)).toFixed(1)}" y="${y - 14}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--coral,#d9795d)">${esc(p.label)}</text>`
          : ""),
    )
    .join("");
  const line = `<line class="nl-axis" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--ink,#333)" stroke-width="2"/>`;
  return svgFigure(cfg, `${line}${ticks}${pts}`, W, H, 8, "number-line-figure");
}

// Shared figure wrapper: optional title + responsive SVG + optional caption.
export function svgFigure(cfg, inner, W, H, padT = 16, figureClass = "data-figure") {
  const title = cfg.title
    ? `<div style="font-weight:700; color:var(--navy,#264653); margin-bottom:var(--sp-2); text-align:center;">${esc(cfg.title)}</div>`
    : "";
  const caption = cfg.caption
    ? `<div style="font-size:0.82rem; color:var(--muted); margin-top:var(--sp-2); text-align:center; font-style:italic;">${esc(cfg.caption)}</div>`
    : "";
  return `<div class="${figureClass}" style="margin:var(--sp-3) 0;">${title}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(figureAria(cfg))}" style="width:100%; height:auto; max-width:560px; display:block; margin:0 auto;"><g transform="translate(0,${padT - 16})">${inner}</g></svg>${caption}</div>`;
}

// Tape / bar diagram: stacked labeled segments per row. Models part–whole,
// ratios, rates, and percents (e.g. two rows whose lengths form a ratio).
export function tapeDiagramSVG(cfg) {
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
          const rect = `<rect class="tape-seg" x="${x.toFixed(1)}" y="${y}" width="${Math.max(0, w - 2).toFixed(1)}" height="${rowH}" rx="4" fill="${fill}"/><text class="tape-label" x="${(x + w / 2).toFixed(1)}" y="${y + rowH / 2 + 4}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${esc(p.label != null ? p.label : p.value)}</text>`;
          x += w;
          return rect;
        })
        .join("");
      const rowLabel = `<text x="${padL}" y="${y + rowH / 2 + 4}" font-size="12" font-weight="700" fill="var(--navy,#264653)">${esc(r.label || "")}</text>`;
      y += rowH + gap;
      return rowLabel + segs;
    })
    .join("");
  return svgFigure(cfg, body, W, H, 16, "tape-figure");
}

// Static four-quadrant coordinate plane with optional plotted points.
export function coordPlaneSVG(cfg) {
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
  // Number every axis tick (stride out when the plane is large so labels never
  // crowd). 0 is labeled once at the origin.
  const stride = m > 8 ? 2 : 1;
  const tick = 'style="font-size:10px;fill:#6b7688;font-weight:600"';
  let grid = "";
  for (let i = -m; i <= m; i++) {
    grid += `<line x1="${X(i)}" y1="${pad}" x2="${X(i)}" y2="${H - pad}" stroke="rgba(0,0,0,0.06)"/>`;
    grid += `<line x1="${pad}" y1="${Y(i)}" x2="${W - pad}" y2="${Y(i)}" stroke="rgba(0,0,0,0.06)"/>`;
    if (i !== 0 && i % stride === 0) {
      grid += `<text x="${X(i)}" y="${cy + 13}" text-anchor="middle" ${tick}>${i}</text>`;
      grid += `<text x="${cx - 6}" y="${Y(i) + 4}" text-anchor="end" ${tick}>${i}</text>`;
    }
  }
  grid += `<text x="${cx - 6}" y="${cy + 13}" text-anchor="end" ${tick}>0</text>`;
  const axes = `<line x1="${pad}" y1="${cy}" x2="${W - pad}" y2="${cy}" stroke="var(--ink,#333)" stroke-width="2"/><line x1="${cx}" y1="${pad}" x2="${cx}" y2="${H - pad}" stroke="var(--ink,#333)" stroke-width="2"/><text x="${W - pad + 6}" y="${cy + 4}" ${tick}>x</text><text x="${cx + 6}" y="${pad + 2}" ${tick}>y</text>`;
  const rawPts = (cfg.points || []).map((p) => ({
    x: Number(p.x),
    y: Number(p.y),
    label: p.label,
  }));
  // Closed outline connecting the vertices in cyclic order (sorted around the
  // centroid) so a parallelogram/quadrilateral actually reads as a shape rather
  // than four loose dots, and never self-intersects regardless of point order.
  let outline = "";
  if (rawPts.length >= 3) {
    const gx = rawPts.reduce((s, p) => s + p.x, 0) / rawPts.length;
    const gy = rawPts.reduce((s, p) => s + p.y, 0) / rawPts.length;
    const ring = rawPts
      .slice()
      .sort((a, b) => Math.atan2(a.y - gy, a.x - gx) - Math.atan2(b.y - gy, b.x - gx));
    const poly = ring.map((p) => `${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(" ");
    outline = `<polygon class="cp-outline" points="${poly}" fill="rgba(31,166,162,0.10)" stroke="#1fa6a2" stroke-width="2.5"/>`;
  }
  const pts = rawPts
    .map((p) => {
      const px = X(p.x),
        py = Y(p.y);
      const lbl = p.label || `(${p.x}, ${p.y})`;
      return `<circle class="cp-point" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" fill="var(--coral,#d9795d)" stroke="#fff" stroke-width="2"/><text class="cp-point-label" x="${(px + 8).toFixed(1)}" y="${(py - 8).toFixed(1)}" font-size="11" font-weight="700" fill="var(--navy,#264653)">${esc(lbl)}</text>`;
    })
    .join("");
  return svgFigure(cfg, `${grid}${axes}${outline}${pts}`, W, H, 16, "coord-plane-figure");
}
