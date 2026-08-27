/**
 * svg-manipulatives.mjs — Pure Programmatic Inline SVG Math Engine
 *
 * Generates print-safe, high-contrast, accessible inline SVGs with explicit dimensions
 * and style="background:white" adhering to Global Development Rule #3.
 *
 * Covers:
 *  - Statistics (Dot plots, Box plots, Histograms)
 *  - Ratios & Proportions (Tape diagrams, Double number lines, Ratio grids)
 *  - Percents (10x10 decimal grids, 10-segment benchmark bars)
 *  - Geometry (Polygon decompositions with 90° marks, 3D nets)
 *  - Expressions & Division (Fraction strips, Distributive area models)
 *  - Integers & Plane (Horizontal/vertical number lines, 4-quadrant coordinate grids)
 *  - Equations & Inequalities (Balance scales, Inequality ray graphs)
 */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const BRAND = {
  navy: "#0f172a",
  navyLight: "#1e293b",
  teal: "#0f766e",
  tealLight: "#ccfbf1",
  amber: "#b45309",
  amberLight: "#fef3c7",
  blue: "#1d4ed8",
  blueLight: "#eff6ff",
  purple: "#6b21a8",
  purpleLight: "#f5f3ff",
  clay: "#c2603f",
  gray: "#64748b",
  grayLight: "#e2e8f0",
  line: "#cbd5e1",
};

export function wrapFigure(svgHtml, title = "", caption = "") {
  if (!svgHtml) return "";
  const titleHtml = title
    ? `<div class="ws-fig-title" style="font-weight:700;font-size:11.5px;color:${BRAND.navy};margin-bottom:4px;text-align:center;">${esc(title)}</div>`
    : "";
  const capHtml = caption
    ? `<div class="ws-fig-cap" style="font-size:10.5px;color:${BRAND.gray};font-style:italic;margin-top:4px;text-align:center;">${esc(caption)}</div>`
    : "";
  return `<div class="ws-figure-wrap" style="margin:10px auto;display:flex;flex-direction:column;align-items:center;page-break-inside:avoid;">${titleHtml}${svgHtml}${capHtml}</div>`;
}

/* ── 1. NUMBER LINES & INEQUALITIES ───────────────────────────────────────── */
export function renderNumberLineSvg(cfg = {}) {
  const min = Number(cfg.min ?? -5);
  const max = Number(cfg.max ?? 5);
  const step = Number(cfg.step ?? 1);
  const W = 460,
    H = 80,
    padL = 30,
    padR = 30,
    y = 38;
  const span = Math.max(1, max - min);
  const plotW = W - padL - padR;
  const xOf = (v) => padL + ((v - min) / span) * plotW;

  let ticks = "";
  const stride = (max - min) / step > 14 ? Math.ceil((max - min) / step / 10) * step : step;
  for (let v = min; v <= max + 1e-9; v += step) {
    const px = xOf(v);
    const isZero = Math.abs(v) < 1e-6;
    const tickH = isZero ? 9 : 6;
    const strokeW = isZero ? 2.4 : 1.4;
    const strokeColor = isZero ? BRAND.teal : BRAND.navyLight;
    ticks += `<line x1="${px.toFixed(1)}" y1="${y - tickH}" x2="${px.toFixed(1)}" y2="${y + tickH}" stroke="${strokeColor}" stroke-width="${strokeW}"/>`;

    if (
      Math.abs(Math.round((v - min) / stride) * stride - (v - min)) < 1e-6 ||
      v === min ||
      v === max ||
      isZero
    ) {
      ticks += `<text x="${px.toFixed(1)}" y="${y + 20}" text-anchor="middle" font-size="${isZero ? 11.5 : 10}" font-weight="${isZero ? 800 : 600}" fill="${isZero ? BRAND.teal : BRAND.navyLight}" font-family="'Hanken Grotesk',Arial,sans-serif">${+v.toFixed(2)}</text>`;
    }
  }

  // Inequality Ray
  let rayHtml = "";
  if (cfg.inequality) {
    const val = Number(cfg.inequality.value ?? 0);
    const px = xOf(val);
    const isGreater =
      cfg.inequality.op === ">" || cfg.inequality.op === ">=" || cfg.inequality.dir === "right";
    const isClosed =
      cfg.inequality.op === ">=" || cfg.inequality.op === "<=" || cfg.inequality.closed;
    const endX = isGreater ? W - padR + 12 : padL - 12;
    rayHtml += `<line x1="${px.toFixed(1)}" y1="${y}" x2="${endX}" y2="${y}" stroke="${BRAND.blue}" stroke-width="4.5" stroke-linecap="round"/>`;
    if (isGreater) {
      rayHtml += `<polygon points="${endX + 6},${y} ${endX - 3},${y - 5} ${endX - 3},${y + 5}" fill="${BRAND.blue}"/>`;
    } else {
      rayHtml += `<polygon points="${endX - 6},${y} ${endX + 3},${y - 5} ${endX + 3},${y + 5}" fill="${BRAND.blue}"/>`;
    }
    rayHtml += `<circle cx="${px.toFixed(1)}" cy="${y}" r="6" fill="${isClosed ? BRAND.blue : "#ffffff"}" stroke="${BRAND.blue}" stroke-width="2.5"/>`;
  }

  // Highlight Points
  let pts = "";
  (cfg.points || []).forEach((p) => {
    const val = Number(p.value ?? p);
    if (!Number.isFinite(val)) return;
    const px = xOf(val);
    const color = p.color || BRAND.amber;
    pts += `<circle cx="${px.toFixed(1)}" cy="${y}" r="6.5" fill="${color}" stroke="#ffffff" stroke-width="2"/>`;
    if (p.label) {
      pts += `<text x="${px.toFixed(1)}" y="${y - 12}" text-anchor="middle" font-size="11" font-weight="800" fill="${color}" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(p.label)}</text>`;
    }
  });

  const axis =
    `<line x1="${padL - 12}" y1="${y}" x2="${W - padR + 12}" y2="${y}" stroke="${BRAND.navy}" stroke-width="2.2"/>` +
    `<polygon points="${W - padR + 16},${y} ${W - padR + 7},${y - 4.5} ${W - padR + 7},${y + 4.5}" fill="${BRAND.navy}"/>` +
    `<polygon points="${padL - 16},${y} ${padL - 7},${y - 4.5} ${padL - 7},${y + 4.5}" fill="${BRAND.navy}"/>`;

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Number line from ${min} to ${max}" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${axis}${rayHtml}${ticks}${pts}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}

export function renderVerticalNumberLineSvg(cfg = {}) {
  const min = Number(cfg.min ?? -10);
  const max = Number(cfg.max ?? 10);
  const step = Number(cfg.step ?? 2);
  const W = 140,
    H = 220,
    x = 60,
    padT = 24,
    padB = 24;
  const span = Math.max(1, max - min);
  const plotH = H - padT - padB;
  const yOf = (v) => padT + ((max - v) / span) * plotH;

  let ticks = "";
  for (let v = min; v <= max + 1e-9; v += step) {
    const py = yOf(v);
    const isZero = Math.abs(v) < 1e-6;
    ticks += `<line x1="${x - 6}" y1="${py.toFixed(1)}" x2="${x + 6}" y2="${py.toFixed(1)}" stroke="${isZero ? BRAND.teal : BRAND.navy}" stroke-width="${isZero ? 2.5 : 1.5}"/>`;
    ticks += `<text x="${x + 12}" y="${(py + 3.5).toFixed(1)}" font-size="${isZero ? 11 : 9.5}" font-weight="${isZero ? 800 : 600}" fill="${isZero ? BRAND.teal : BRAND.navy}" font-family="'Hanken Grotesk',Arial,sans-serif">${v}</text>`;
  }

  const axis =
    `<line x1="${x}" y1="${padT - 10}" x2="${x}" y2="${H - padB + 10}" stroke="${BRAND.navy}" stroke-width="2.2"/>` +
    `<polygon points="${x},${padT - 14} ${x - 4.5},${padT - 5} ${x + 4.5},${padT - 5}" fill="${BRAND.navy}"/>` +
    `<polygon points="${x},${H - padB + 14} ${x - 4.5},${H - padB + 5} ${x + 4.5},${H - padB + 5}" fill="${BRAND.navy}"/>`;

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Vertical number line" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${axis}${ticks}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}

/* ── 2. COORDINATE PLANES ─────────────────────────────────────────────────── */
export function renderCoordPlaneSvg(cfg = {}) {
  const m = Number(cfg.max ?? 5);
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
    grid += `<line x1="${X(i)}" y1="${pad}" x2="${X(i)}" y2="${H - pad}" stroke="${BRAND.grayLight}" stroke-width="1"/>`;
    grid += `<line x1="${pad}" y1="${Y(i)}" x2="${W - pad}" y2="${Y(i)}" stroke="${BRAND.grayLight}" stroke-width="1"/>`;
    if (i !== 0 && i % stride === 0) {
      grid += `<text x="${X(i)}" y="${cy + 12}" text-anchor="middle" font-size="8" fill="${BRAND.gray}" font-family="'Hanken Grotesk',Arial,sans-serif">${i}</text>`;
      grid += `<text x="${cx - 4}" y="${Y(i) + 3}" text-anchor="end" font-size="8" fill="${BRAND.gray}" font-family="'Hanken Grotesk',Arial,sans-serif">${i}</text>`;
    }
  }

  // Quadrants
  const quads = `
    <text x="${W - pad - 16}" y="${pad + 16}" font-size="10" font-weight="800" fill="#94a3b8" font-family="'Hanken Grotesk',Arial,sans-serif">I</text>
    <text x="${pad + 10}" y="${pad + 16}" font-size="10" font-weight="800" fill="#94a3b8" font-family="'Hanken Grotesk',Arial,sans-serif">II</text>
    <text x="${pad + 10}" y="${H - pad - 8}" font-size="10" font-weight="800" fill="#94a3b8" font-family="'Hanken Grotesk',Arial,sans-serif">III</text>
    <text x="${W - pad - 16}" y="${H - pad - 8}" font-size="10" font-weight="800" fill="#94a3b8" font-family="'Hanken Grotesk',Arial,sans-serif">IV</text>
  `;

  const axes =
    `<line x1="${pad}" y1="${cy}" x2="${W - pad}" y2="${cy}" stroke="${BRAND.navy}" stroke-width="1.8"/>` +
    `<line x1="${cx}" y1="${pad}" x2="${cx}" y2="${H - pad}" stroke="${BRAND.navy}" stroke-width="1.8"/>` +
    `<text x="${W - pad + 6}" y="${cy + 3}" font-size="10" font-weight="800" fill="${BRAND.navy}" font-family="'Hanken Grotesk',Arial,sans-serif">x</text>` +
    `<text x="${cx + 3}" y="${pad - 6}" font-size="10" font-weight="800" fill="${BRAND.navy}" font-family="'Hanken Grotesk',Arial,sans-serif">y</text>`;

  let polyHtml = "";
  if (Array.isArray(cfg.polygon) && cfg.polygon.length >= 3) {
    const pointsStr = cfg.polygon
      .map((pt) => `${X(pt[0]).toFixed(1)},${Y(pt[1]).toFixed(1)}`)
      .join(" ");
    polyHtml = `<polygon points="${pointsStr}" fill="rgba(15,118,110,0.14)" stroke="${BRAND.teal}" stroke-width="2"/>`;
  }

  let pts = "";
  (cfg.points || []).forEach((p) => {
    const px = X(p.x),
      py = Y(p.y);
    const lbl = p.label || `(${p.x}, ${p.y})`;
    pts += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4.5" fill="${BRAND.amber}" stroke="#fff" stroke-width="1.8"/>`;
    pts += `<text x="${(px + 6).toFixed(1)}" y="${(py - 5).toFixed(1)}" font-size="9" font-weight="800" fill="${BRAND.navy}" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(lbl)}</text>`;
  });

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Coordinate plane grid" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${grid}${quads}${axes}${polyHtml}${pts}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}

/* ── 3. TAPE DIAGRAMS & DOUBLE NUMBER LINES ───────────────────────────────── */
export function renderTapeDiagramSvg(cfg = {}) {
  const rows = Array.isArray(cfg.rows) ? cfg.rows : [];
  if (!rows.length) return "";
  const W = 460,
    padL = 12,
    padR = 12,
    rowH = 32,
    gap = 14,
    labelW = 90;
  const H = 16 + rows.length * (rowH + gap);
  const trackW = W - padL - padR - labelW;
  const maxVal = Math.max(
    ...rows.map((r) => (r.parts || []).reduce((s, p) => s + Number(p.value ?? p), 0)),
    1,
  );

  let y = 10;
  let body = "";
  rows.forEach((r, rIdx) => {
    let x = padL + labelW;
    let segs = "";
    (r.parts || []).forEach((p) => {
      const val = Number(p.value ?? p);
      const w = (val / maxVal) * trackW;
      const fill = p.fill || (rIdx === 0 ? BRAND.teal : BRAND.amber);
      const lbl = p.label ?? val;
      segs += `<rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(0, w - 2).toFixed(1)}" height="${rowH}" rx="4" fill="${fill}"/>`;
      segs += `<text x="${(x + w / 2).toFixed(1)}" y="${y + rowH / 2 + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(lbl)}</text>`;
      x += w;
    });
    body += `<text x="${padL}" y="${y + rowH / 2 + 4}" font-size="11" font-weight="700" fill="${BRAND.navy}" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(r.label || "")}</text>${segs}`;
    y += rowH + gap;
  });

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tape diagram model" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${body}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}

export function renderDoubleNumberLineSvg(cfg = {}) {
  const W = 460,
    H = 100,
    padL = 80,
    padR = 24,
    y1 = 30,
    y2 = 70;
  const ticks1 = cfg.topTicks || [0, 2, 4, 6, 8];
  const ticks2 = cfg.bottomTicks || [0, 5, 10, 15, 20];
  const n = Math.min(ticks1.length, ticks2.length);
  const plotW = W - padL - padR;

  let body = `
    <text x="${padL - 10}" y="${y1 + 4}" text-anchor="end" font-size="11" font-weight="800" fill="${BRAND.teal}" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(cfg.topLabel || "Quantity A")}</text>
    <text x="${padL - 10}" y="${y2 + 4}" text-anchor="end" font-size="11" font-weight="800" fill="${BRAND.amber}" font-family="'Hanken Grotesk',Arial,sans-serif">${esc(cfg.bottomLabel || "Quantity B")}</text>
    <line x1="${padL}" y1="${y1}" x2="${W - padR}" y2="${y1}" stroke="${BRAND.navy}" stroke-width="2"/>
    <line x1="${padL}" y1="${y2}" x2="${W - padR}" y2="${y2}" stroke="${BRAND.navy}" stroke-width="2"/>
  `;

  for (let i = 0; i < n; i++) {
    const px = padL + (i / (n - 1)) * plotW;
    body += `
      <line x1="${px.toFixed(1)}" y1="${y1 - 6}" x2="${px.toFixed(1)}" y2="${y1 + 6}" stroke="${BRAND.navy}" stroke-width="1.6"/>
      <line x1="${px.toFixed(1)}" y1="${y2 - 6}" x2="${px.toFixed(1)}" y2="${y2 + 6}" stroke="${BRAND.navy}" stroke-width="1.6"/>
      <line x1="${px.toFixed(1)}" y1="${y1 + 6}" x2="${px.toFixed(1)}" y2="${y2 - 6}" stroke="${BRAND.grayLight}" stroke-width="1" stroke-dasharray="2 2"/>
      <text x="${px.toFixed(1)}" y="${y1 - 10}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${BRAND.teal}" font-family="'Hanken Grotesk',Arial,sans-serif">${ticks1[i]}</text>
      <text x="${px.toFixed(1)}" y="${y2 + 18}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${BRAND.amber}" font-family="'Hanken Grotesk',Arial,sans-serif">${ticks2[i]}</text>
    `;
  }

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Double number line model" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${body}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}

/* ── 4. PERCENTS: 10x10 GRIDS & BENCHMARK BARS ────────────────────────────── */
export function renderDecimalGridSvg(cfg = {}) {
  const shaded = Math.min(100, Math.max(0, Number(cfg.shaded ?? 65)));
  const size = 18,
    pad = 12;
  const W = size * 10 + pad * 2,
    H = size * 10 + pad * 2;
  let cells = "";

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const idx = r * 10 + c;
      const isShaded = idx < shaded;
      const x = pad + c * size;
      const y = pad + r * size;
      cells += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${isShaded ? BRAND.teal : "#ffffff"}" stroke="${BRAND.line}" stroke-width="1"/>`;
    }
  }

  const label = `<text x="${W / 2}" y="${H - 2}" text-anchor="middle" font-size="11" font-weight="800" fill="${BRAND.navy}" font-family="'Hanken Grotesk',Arial,sans-serif">${shaded}% (${shaded}/100)</text>`;
  const svg = `<svg width="${W}" height="${H + 10}" viewBox="0 0 ${W} ${H + 10}" role="img" aria-label="10 by 10 decimal grid showing ${shaded} percent shaded" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${cells}${label}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}

export function renderPercentBarSvg(cfg = {}) {
  const percent = Number(cfg.percent ?? 75);
  const W = 420,
    H = 64,
    padL = 20,
    padR = 20,
    y = 20,
    barH = 22;
  const plotW = W - padL - padR;
  const fillW = Math.min(plotW, (percent / 100) * plotW);

  let ticks = "";
  for (let p = 0; p <= 100; p += 10) {
    const px = padL + (p / 100) * plotW;
    ticks += `<line x1="${px.toFixed(1)}" y1="${y}" x2="${px.toFixed(1)}" y2="${y + barH}" stroke="#cbd5e1" stroke-width="1"/>`;
    if (p % 25 === 0) {
      ticks += `<text x="${px.toFixed(1)}" y="${y + barH + 14}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${BRAND.navy}" font-family="'Hanken Grotesk',Arial,sans-serif">${p}%</text>`;
    }
  }

  const bar = `
    <rect x="${padL}" y="${y}" width="${plotW}" height="${barH}" rx="4" fill="#f8fafc" stroke="${BRAND.navy}" stroke-width="2"/>
    <rect x="${padL}" y="${y}" width="${fillW.toFixed(1)}" height="${barH}" rx="4" fill="${BRAND.teal}"/>
    ${ticks}
  `;

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Percent benchmark bar showing ${percent} percent" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${bar}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}

/* ── 5. GEOMETRY: POLYGON DECOMPOSITION & 3D NETS ─────────────────────────── */
export function renderParallelogramDecompSvg(cfg = {}) {
  const b = Number(cfg.base ?? 10);
  const h = Number(cfg.height ?? 6);
  const s = Number(cfg.slant ?? 3);
  const W = 320,
    H = 180,
    padX = 40,
    padY = 30;
  const scale = 220 / (b + s);
  const bx = b * scale,
    hx = h * scale,
    sx = s * scale;
  const x1 = padX,
    y1 = H - padY;
  const x2 = padX + bx,
    y2 = H - padY;
  const x3 = padX + bx + sx,
    y3 = H - padY - hx;
  const x4 = padX + sx,
    y4 = H - padY - hx;

  const poly = `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}" fill="rgba(15,118,110,0.12)" stroke="${BRAND.teal}" stroke-width="2.5"/>`;
  const heightLine = `<line x1="${x4}" y1="${y4}" x2="${x4}" y2="${y1}" stroke="${BRAND.amber}" stroke-width="2" stroke-dasharray="4 3"/>`;
  const rightAngle = `<rect x="${x4}" y="${y1 - 10}" width="10" height="10" fill="none" stroke="${BRAND.amber}" stroke-width="1.5"/>`;

  const labels = `
    <text x="${(x1 + bx / 2).toFixed(1)}" y="${y1 + 18}" text-anchor="middle" font-size="12" font-weight="800" fill="${BRAND.navy}" font-family="'Hanken Grotesk',Arial,sans-serif">b = ${b} ${cfg.unit || "cm"}</text>
    <text x="${x4 - 8}" y="${(y4 + hx / 2).toFixed(1)}" text-anchor="end" font-size="12" font-weight="800" fill="${BRAND.amber}" font-family="'Hanken Grotesk',Arial,sans-serif">h = ${h} ${cfg.unit || "cm"}</text>
  `;

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Parallelogram with base ${b} and perpendicular height ${h}" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${poly}${heightLine}${rightAngle}${labels}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}

export function renderTriangleDecompSvg(cfg = {}) {
  const b = Number(cfg.base ?? 8);
  const h = Number(cfg.height ?? 5);
  const W = 300,
    H = 170,
    padX = 40,
    padY = 28;
  const scale = 200 / b;
  const bx = b * scale,
    hx = h * scale;
  const x1 = padX,
    y1 = H - padY;
  const x2 = padX + bx,
    y2 = H - padY;
  const x3 = padX + bx * 0.4,
    y3 = H - padY - hx;

  const triangle = `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="rgba(107,33,168,0.12)" stroke="${BRAND.purple}" stroke-width="2.5"/>`;
  const heightLine = `<line x1="${x3}" y1="${y3}" x2="${x3}" y2="${y1}" stroke="${BRAND.amber}" stroke-width="2" stroke-dasharray="4 3"/>`;
  const rightAngle = `<rect x="${x3}" y="${y1 - 10}" width="10" height="10" fill="none" stroke="${BRAND.amber}" stroke-width="1.5"/>`;

  const labels = `
    <text x="${(x1 + bx / 2).toFixed(1)}" y="${y1 + 18}" text-anchor="middle" font-size="12" font-weight="800" fill="${BRAND.navy}" font-family="'Hanken Grotesk',Arial,sans-serif">b = ${b} ${cfg.unit || "cm"}</text>
    <text x="${x3 - 8}" y="${(y3 + hx / 2).toFixed(1)}" text-anchor="end" font-size="12" font-weight="800" fill="${BRAND.amber}" font-family="'Hanken Grotesk',Arial,sans-serif">h = ${h} ${cfg.unit || "cm"}</text>
  `;

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Triangle with base ${b} and height ${h}" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${triangle}${heightLine}${rightAngle}${labels}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}

export function renderNetPrismSvg(cfg = {}) {
  const W = 320,
    H = 220;
  const w = 60,
    l = 90,
    h = 45;
  const cx = 110,
    cy = 90;

  const net = `
    <!-- Top Face -->
    <rect x="${cx}" y="${cy - h}" width="${w}" height="${h}" fill="#f1f5f9" stroke="${BRAND.navy}" stroke-width="1.5"/>
    <!-- Bottom Face -->
    <rect x="${cx}" y="${cy + l}" width="${w}" height="${h}" fill="#f1f5f9" stroke="${BRAND.navy}" stroke-width="1.5"/>
    <!-- Left Face -->
    <rect x="${cx - h}" y="${cy}" width="${h}" height="${l}" fill="#e2e8f0" stroke="${BRAND.navy}" stroke-width="1.5"/>
    <!-- Front Face -->
    <rect x="${cx}" y="${cy}" width="${w}" height="${l}" fill="rgba(15,118,110,0.18)" stroke="${BRAND.teal}" stroke-width="2"/>
    <!-- Right Face -->
    <rect x="${cx + w}" y="${cy}" width="${h}" height="${l}" fill="#e2e8f0" stroke="${BRAND.navy}" stroke-width="1.5"/>
    <!-- Back Face -->
    <rect x="${cx + w + h}" y="${cy}" width="${w}" height="${l}" fill="#f1f5f9" stroke="${BRAND.navy}" stroke-width="1.5"/>
    <!-- Labels -->
    <text x="${cx + w / 2}" y="${cy + l / 2 + 4}" text-anchor="middle" font-size="10" font-weight="800" fill="${BRAND.teal}">Front (${w}×${l})</text>
    <text x="${cx + w / 2}" y="${cy - h / 2 + 4}" text-anchor="middle" font-size="9" font-weight="700" fill="${BRAND.navy}">Top</text>
  `;

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Net of a rectangular prism" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${net}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}

/* ── 6. FRACTION STRIPS & DISTRIBUTIVE AREA MODELS ─────────────────────────── */
export function renderFractionDivisionModelSvg(cfg = {}) {
  const whole = Number(cfg.whole ?? 3);
  const fracDenom = Number(cfg.denom ?? 4);
  const W = 460,
    H = 110,
    padL = 30,
    padR = 30,
    y = 20,
    barH = 34;
  const plotW = W - padL - padR;
  const unitW = plotW / whole;
  const partW = unitW / fracDenom;

  let wholes = "";
  for (let i = 0; i < whole; i++) {
    const wx = padL + i * unitW;
    wholes += `<rect x="${wx}" y="${y}" width="${unitW}" height="${barH}" fill="#ffffff" stroke="${BRAND.navy}" stroke-width="2"/>`;
    wholes += `<text x="${wx + unitW / 2}" y="${y + barH / 2 + 4}" text-anchor="middle" font-size="12" font-weight="800" fill="${BRAND.navy}">1 Whole</text>`;
  }

  let parts = "";
  const totalParts = whole * fracDenom;
  for (let i = 0; i < totalParts; i++) {
    const px = padL + i * partW;
    parts += `<rect x="${px}" y="${y + barH + 12}" width="${partW}" height="${barH}" fill="${i % 2 === 0 ? BRAND.tealLight : "#ffffff"}" stroke="${BRAND.teal}" stroke-width="1.5"/>`;
    parts += `<text x="${px + partW / 2}" y="${y + barH + 12 + barH / 2 + 4}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${BRAND.teal}">1/${fracDenom}</text>`;
  }

  const label = `<text x="${W / 2}" y="${H - 4}" text-anchor="middle" font-size="11" font-weight="800" fill="${BRAND.navy}">${whole} ÷ (1/${fracDenom}) = ${totalParts} pieces</text>`;
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Fraction division model: ${whole} divided by 1/${fracDenom}" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${wholes}${parts}${label}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}

export function renderDistributiveAreaSvg(cfg = {}) {
  const a = Number(cfg.a ?? 4);
  const b = Number(cfg.b ?? 10);
  const c = Number(cfg.c ?? 3);
  const W = 320,
    H = 150,
    padL = 36,
    padT = 24;
  const w1 = 160,
    w2 = 70,
    h = 80;

  const rects = `
    <!-- Rect 1 -->
    <rect x="${padL}" y="${padT}" width="${w1}" height="${h}" fill="rgba(29,78,216,0.14)" stroke="${BRAND.blue}" stroke-width="2"/>
    <text x="${padL + w1 / 2}" y="${padT + h / 2 + 4}" text-anchor="middle" font-size="13" font-weight="800" fill="${BRAND.blue}">${a} × ${b} = ${a * b}</text>
    <!-- Rect 2 -->
    <rect x="${padL + w1}" y="${padT}" width="${w2}" height="${h}" fill="rgba(180,83,9,0.14)" stroke="${BRAND.amber}" stroke-width="2"/>
    <text x="${padL + w1 + w2 / 2}" y="${padT + h / 2 + 4}" text-anchor="middle" font-size="13" font-weight="800" fill="${BRAND.amber}">${a} × ${c} = ${a * c}</text>
    <!-- Dimensions -->
    <text x="${padL - 10}" y="${padT + h / 2 + 4}" text-anchor="end" font-size="12" font-weight="800" fill="${BRAND.navy}">${a}</text>
    <text x="${padL + w1 / 2}" y="${padT - 6}" text-anchor="middle" font-size="12" font-weight="800" fill="${BRAND.blue}">${b}</text>
    <text x="${padL + w1 + w2 / 2}" y="${padT - 6}" text-anchor="middle" font-size="12" font-weight="800" fill="${BRAND.amber}">${c}</text>
    <text x="${padL + (w1 + w2) / 2}" y="${padT + h + 22}" text-anchor="middle" font-size="12" font-weight="800" fill="${BRAND.navy}">Total Area = ${a * b} + ${a * c} = ${a * (b + c)}</text>
  `;

  const svg = `<svg width="${W}" height="${H + 10}" viewBox="0 0 ${W} ${H + 10}" role="img" aria-label="Distributive property area model" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${rects}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}

/* ── 7. EQUATIONS: BALANCE SCALES ─────────────────────────────────────────── */
export function renderBalanceScaleSvg(cfg = {}) {
  const W = 360,
    H = 160;
  const fulcrumX = 180,
    fulcrumY = 120;
  const beamY = 50;

  const scale = `
    <!-- Fulcrum Base -->
    <polygon points="${fulcrumX},${beamY} ${fulcrumX - 25},${fulcrumY} ${fulcrumX + 25},${fulcrumY}" fill="${BRAND.navy}"/>
    <rect x="${fulcrumX - 45}" y="${fulcrumY}" width="90" height="8" rx="2" fill="${BRAND.navy}"/>
    <!-- Beam -->
    <line x1="50" y1="${beamY}" x2="310" y2="${beamY}" stroke="${BRAND.navy}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${fulcrumX}" cy="${beamY}" r="5" fill="${BRAND.amber}"/>
    <!-- Left Pan -->
    <line x1="80" y1="${beamY}" x2="80" y2="${beamY + 35}" stroke="${BRAND.gray}" stroke-width="1.5"/>
    <path d="M 45 ${beamY + 35} Q 80 ${beamY + 50} 115 ${beamY + 35} Z" fill="#e2e8f0" stroke="${BRAND.navy}" stroke-width="1.5"/>
    <text x="80" y="${beamY + 30}" text-anchor="middle" font-size="11" font-weight="800" fill="${BRAND.blue}">${esc(cfg.left || "x + 4")}</text>
    <!-- Right Pan -->
    <line x1="280" y1="${beamY}" x2="280" y2="${beamY + 35}" stroke="${BRAND.gray}" stroke-width="1.5"/>
    <path d="M 245 ${beamY + 35} Q 280 ${beamY + 50} 315 ${beamY + 35} Z" fill="#e2e8f0" stroke="${BRAND.navy}" stroke-width="1.5"/>
    <text x="280" y="${beamY + 30}" text-anchor="middle" font-size="11" font-weight="800" fill="${BRAND.teal}">${esc(cfg.right || "12")}</text>
    <!-- Equal Sign -->
    <text x="${fulcrumX}" y="${beamY - 14}" text-anchor="middle" font-size="18" font-weight="900" fill="${BRAND.amber}">=</text>
  `;

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Algebra balance scale equation model" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${scale}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}

/* ── 8. STATISTICS: DOT PLOTS, BOX PLOTS, HISTOGRAMS ──────────────────────── */
export function renderDotPlotSvg(cfg = {}) {
  const min = Number(cfg.min ?? 0);
  const max = Number(cfg.max ?? 10);
  const step = Number(cfg.step ?? 1);
  const data = Array.isArray(cfg.data) ? cfg.data : [1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 5, 6, 7];
  const W = 460,
    H = 140,
    padL = 32,
    padR = 32,
    axisY = 110;
  const span = Math.max(1, max - min);
  const plotW = W - padL - padR;
  const xOf = (v) => padL + ((v - min) / span) * plotW;

  const counts = {};
  data.forEach((val) => {
    counts[val] = (counts[val] || 0) + 1;
  });

  let dots = "";
  Object.entries(counts).forEach(([valStr, count]) => {
    const val = Number(valStr);
    const px = xOf(val);
    for (let i = 0; i < count; i++) {
      const py = axisY - 10 - i * 14;
      dots += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5.5" fill="${BRAND.teal}" stroke="#ffffff" stroke-width="1.5"/>`;
    }
  });

  let ticks = "";
  for (let v = min; v <= max + 1e-9; v += step) {
    const px = xOf(v);
    ticks += `<line x1="${px.toFixed(1)}" y1="${axisY - 4}" x2="${px.toFixed(1)}" y2="${axisY + 4}" stroke="${BRAND.navy}" stroke-width="1.5"/>`;
    ticks += `<text x="${px.toFixed(1)}" y="${axisY + 16}" text-anchor="middle" font-size="10" font-weight="700" fill="${BRAND.navy}">${v}</text>`;
  }

  const axis = `<line x1="${padL - 10}" y1="${axisY}" x2="${W - padR + 10}" y2="${axisY}" stroke="${BRAND.navy}" stroke-width="2"/>`;
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dot plot data display" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${axis}${ticks}${dots}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}

export function renderBoxPlotSvg(cfg = {}) {
  const min = Number(cfg.min ?? 10);
  const q1 = Number(cfg.q1 ?? 20);
  const med = Number(cfg.median ?? 30);
  const q3 = Number(cfg.q3 ?? 45);
  const max = Number(cfg.max ?? 55);
  const axisMin = Number(cfg.axisMin ?? Math.floor(min / 10) * 10);
  const axisMax = Number(cfg.axisMax ?? Math.ceil(max / 10) * 10);

  const W = 460,
    H = 120,
    padL = 32,
    padR = 32,
    axisY = 90,
    boxY = 32,
    boxH = 34;
  const span = Math.max(1, axisMax - axisMin);
  const plotW = W - padL - padR;
  const xOf = (v) => padL + ((v - axisMin) / span) * plotW;

  const boxPlot = `
    <!-- Whiskers -->
    <line x1="${xOf(min)}" y1="${boxY + boxH / 2}" x2="${xOf(q1)}" y2="${boxY + boxH / 2}" stroke="${BRAND.navy}" stroke-width="2"/>
    <line x1="${xOf(q3)}" y1="${boxY + boxH / 2}" x2="${xOf(max)}" y2="${boxY + boxH / 2}" stroke="${BRAND.navy}" stroke-width="2"/>
    <line x1="${xOf(min)}" y1="${boxY + 6}" x2="${xOf(min)}" y2="${boxY + boxH - 6}" stroke="${BRAND.navy}" stroke-width="2"/>
    <line x1="${xOf(max)}" y1="${boxY + 6}" x2="${xOf(max)}" y2="${boxY + boxH - 6}" stroke="${BRAND.navy}" stroke-width="2"/>
    <!-- Box (IQR) -->
    <rect x="${xOf(q1)}" y="${boxY}" width="${xOf(q3) - xOf(q1)}" height="${boxH}" fill="rgba(15,118,110,0.18)" stroke="${BRAND.teal}" stroke-width="2"/>
    <!-- Median Line -->
    <line x1="${xOf(med)}" y1="${boxY}" x2="${xOf(med)}" y2="${boxY + boxH}" stroke="${BRAND.amber}" stroke-width="3"/>
  `;

  let ticks = "";
  const step = (axisMax - axisMin) / 5;
  for (let v = axisMin; v <= axisMax + 1e-9; v += step) {
    const px = xOf(v);
    ticks += `<line x1="${px.toFixed(1)}" y1="${axisY - 4}" x2="${px.toFixed(1)}" y2="${axisY + 4}" stroke="${BRAND.navy}" stroke-width="1.5"/>`;
    ticks += `<text x="${px.toFixed(1)}" y="${axisY + 16}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${BRAND.navy}">${Math.round(v)}</text>`;
  }

  const axis = `<line x1="${padL - 10}" y1="${axisY}" x2="${W - padR + 10}" y2="${axisY}" stroke="${BRAND.navy}" stroke-width="2"/>`;
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Box and whisker plot" style="background:white;max-width:100%;height:auto;border:1.5px solid ${BRAND.line};border-radius:8px;padding:4px;">${axis}${ticks}${boxPlot}</svg>`;
  return wrapFigure(svg, cfg.title, cfg.caption);
}
