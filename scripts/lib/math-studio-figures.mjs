// Pure-Node SVG and figure builders for Math Studio's Apply stage (`connect.diagram`).
// Mirrors engine/core/visual-figures.js without DOM dependencies, adding bilingual title/caption support.

const DATA_1 = "#0f8a84";
const DATA_2 = "#c2603f";
const DATA_3 = "#b07d12";
const DATA_4 = "#3b6ea5";

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const bi = (en, es) =>
  `<span class="t-en">${esc(en)}</span>${es && es !== en ? `<span class="t-es" lang="es">${esc(es)}</span>` : ""}`;

function figureAria(cfg, fallback = "Data figure") {
  const base = cfg?.title || fallback;
  const parts = [];
  if (Array.isArray(cfg?.bars) && cfg.bars.length) {
    parts.push(
      `Values — ${cfg.bars.map((b) => `${b.label != null ? `${b.label}: ` : ""}${b.value}`).join(", ")}`,
    );
  } else if (Array.isArray(cfg?.values) && cfg.values.length) {
    parts.push(`Values — ${cfg.values.join(", ")}`);
  }
  if (cfg && ["q1", "median", "q3"].some((k) => cfg[k] != null)) {
    parts.push(
      `five-number summary: minimum ${cfg.min}, Q1 ${cfg.q1}, median ${cfg.median}, Q3 ${cfg.q3}, maximum ${cfg.max}`,
    );
  }
  if (cfg?.xLabel) parts.push(`x-axis: ${cfg.xLabel}`);
  if (cfg?.yLabel) parts.push(`y-axis: ${cfg.yLabel}`);
  return parts.length ? `${base}. ${parts.join(". ")}` : base;
}

function wrapFigure(cfg, inner, W, H, padT = 16, cls = "ms-diagram") {
  const title = cfg.title ? `<p class="ms-diagram__title">${bi(cfg.title, cfg.titleEs)}</p>` : "";
  const caption = cfg.caption
    ? `<p class="ms-diagram__caption">${bi(cfg.caption, cfg.captionEs)}</p>`
    : "";
  return `<figure class="${cls}">${title}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(figureAria(cfg))}" class="ms-diagram__svg"><g transform="translate(0,${padT - 16})">${inner}</g></svg>${caption}</figure>`;
}

function barChart(cfg) {
  const bars = Array.isArray(cfg.bars) ? cfg.bars : [];
  if (!bars.length) return "";
  const W = 520,
    H = 250,
    padL = 40,
    padR = 16,
    padT = 24,
    padB = 48;
  const plotW = W - padL - padR,
    plotH = H - padT - padB;
  const values = bars.map((b) => Number(b.value) || 0);
  const minV = Math.min(0, ...values);
  const maxV = minV < 0 ? Math.max(0, ...values) : Math.max(...values, 1);
  const span = maxV - minV || 1;
  const yOf = (v) => padT + (plotH * (maxV - v)) / span;
  const zeroY = yOf(0);
  const slot = plotW / bars.length,
    bw = slot * 0.6,
    baseY = padT + plotH;
  const rects = bars
    .map((b, i) => {
      const v = Number(b.value) || 0;
      const vy = yOf(v);
      const y = Math.min(vy, zeroY);
      const h = Math.abs(vy - zeroY);
      const x = padL + i * slot + (slot - bw) / 2;
      const labelY = v < 0 ? vy + 15 : vy - 6;
      return (
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${DATA_1}"/>` +
        `<text x="${(x + bw / 2).toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="#17323f">${v}</text>` +
        `<text x="${(x + bw / 2).toFixed(1)}" y="${(baseY + (minV < 0 ? 30 : 18)).toFixed(1)}" text-anchor="middle" font-size="11" fill="#334155">${esc(b.label ?? "")}</text>`
      );
    })
    .join("");
  const axis =
    `<line x1="${padL}" y1="${zeroY.toFixed(1)}" x2="${W - padR}" y2="${zeroY.toFixed(1)}" stroke="#334155" stroke-width="1.5"/>` +
    (minV < 0
      ? `<text x="${padL - 6}" y="${(zeroY + 4).toFixed(1)}" text-anchor="end" font-size="11" font-weight="700" fill="#334155">0</text>`
      : "");
  return wrapFigure(cfg, `${axis}${rects}`, W, H, padT);
}

function histogram(cfg) {
  const bars = Array.isArray(cfg.bars) ? cfg.bars : [];
  if (!bars.length) return "";
  const W = 520,
    H = 260,
    padL = 44,
    padR = 16,
    padT = 24,
    padB = 52;
  const plotW = W - padL - padR,
    plotH = H - padT - padB;
  const maxV = Math.max(...bars.map((b) => Number(b.value) || 0), 1);
  const bw = plotW / bars.length;
  const baseY = padT + plotH;
  const step = maxV <= 10 ? 1 : Math.ceil(maxV / 8);
  let grid = "";
  for (let v = 0; v <= maxV; v += step) {
    const y = baseY - (v / maxV) * plotH;
    grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${(W - padR).toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>`;
    grid += `<text x="${padL - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#52606d">${v}</text>`;
  }
  const rects = bars
    .map((b, i) => {
      const v = Number(b.value) || 0;
      const h = (v / maxV) * plotH;
      const x = padL + i * bw;
      const y = baseY - h;
      return (
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${DATA_1}" stroke="#fff" stroke-width="1.5"/>` +
        `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#17323f">${v}</text>` +
        `<text x="${(x + bw / 2).toFixed(1)}" y="${(baseY + 18).toFixed(1)}" text-anchor="middle" font-size="11" fill="#334155">${esc(b.label ?? "")}</text>`
      );
    })
    .join("");
  const axes = `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${baseY}" stroke="#334155" stroke-width="1.5"/><line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="#334155" stroke-width="1.5"/>`;
  return wrapFigure(cfg, `${grid}${rects}${axes}`, W, H, padT);
}

function tapeDiagram(cfg) {
  const rows = Array.isArray(cfg.rows) ? cfg.rows : [];
  if (!rows.length) return "";
  const W = 520,
    padL = 8,
    padR = 8,
    rowH = 44,
    gap = 12,
    labelW = 104;
  const H = 8 + rows.length * (rowH + gap);
  const palette = [DATA_1, DATA_2, DATA_3, DATA_4];
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
          const rect = `<rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(0, w - 2).toFixed(1)}" height="${rowH}" rx="4" fill="${fill}"/><text x="${(x + w / 2).toFixed(1)}" y="${y + rowH / 2 + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${esc(p.label != null ? p.label : p.value)}</text>`;
          x += w;
          return rect;
        })
        .join("");
      const rowLabel = `<text x="${padL}" y="${y + rowH / 2 + 4}" font-size="12" font-weight="700" fill="#17323f">${esc(r.label || "")}</text>`;
      y += rowH + gap;
      return rowLabel + segs;
    })
    .join("");
  return wrapFigure(cfg, body, W, H, 16);
}

function numberLine(cfg) {
  const min = Number(cfg.min ?? 0),
    max = Number(cfg.max ?? 10),
    step = Number(cfg.step ?? 1);
  const W = 520,
    H = 112,
    padL = 24,
    padR = 24,
    y = 54;
  const span = Math.max(1, max - min),
    plotW = W - padL - padR;
  const xOf = (v) => padL + ((v - min) / span) * plotW;
  let ticks = "";
  for (let v = min; v <= max + 1e-9; v += step) {
    ticks += `<line x1="${xOf(v).toFixed(1)}" y1="${y - 6}" x2="${xOf(v).toFixed(1)}" y2="${y + 6}" stroke="#334155" stroke-width="1.5"/><text x="${xOf(v).toFixed(1)}" y="${y + 22}" text-anchor="middle" font-size="11" fill="#334155">${+v.toFixed(2)}</text>`;
  }
  const pts = (cfg.points || [])
    .map(
      (p) =>
        `<circle cx="${xOf(Number(p.value)).toFixed(1)}" cy="${y}" r="6.5" fill="${DATA_2}" stroke="#fff" stroke-width="2"/>` +
        (p.label
          ? `<text x="${xOf(Number(p.value)).toFixed(1)}" y="${y - 13}" text-anchor="middle" font-size="11" font-weight="700" fill="${DATA_2}">${esc(p.label)}</text>`
          : ""),
    )
    .join("");
  const line = `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#334155" stroke-width="2"/>`;
  return wrapFigure(cfg, `${line}${ticks}${pts}`, W, H, 8);
}

function coordPlane(cfg) {
  const m = Number(cfg.max ?? 6);
  const W = 340,
    H = 340,
    pad = 24;
  const span = 2 * m,
    plot = W - 2 * pad,
    unit = plot / span;
  const cx = pad + m * unit,
    cy = pad + m * unit;
  const X = (x) => pad + (x + m) * unit;
  const Y = (y) => pad + (m - y) * unit;
  const tickPx = Math.max(8, Math.min(10, Math.floor(unit * 0.6)));
  let grid = "";
  for (let i = -m; i <= m; i++) {
    grid += `<line x1="${X(i)}" y1="${pad}" x2="${X(i)}" y2="${H - pad}" stroke="rgba(0,0,0,0.07)"/>`;
    grid += `<line x1="${pad}" y1="${Y(i)}" x2="${W - pad}" y2="${Y(i)}" stroke="rgba(0,0,0,0.07)"/>`;
    if (i !== 0) {
      grid += `<text x="${X(i)}" y="${cy + 13}" text-anchor="middle" font-size="${tickPx}" fill="#52606d">${i}</text>`;
      grid += `<text x="${cx - 6}" y="${Y(i) + 4}" text-anchor="end" font-size="${tickPx}" fill="#52606d">${i}</text>`;
    }
  }
  grid += `<text x="${cx - 6}" y="${cy + 13}" text-anchor="end" font-size="${tickPx}" fill="#52606d">0</text>`;
  const axes = `<line x1="${pad}" y1="${cy}" x2="${W - pad}" y2="${cy}" stroke="#334155" stroke-width="2"/><line x1="${cx}" y1="${pad}" x2="${cx}" y2="${H - pad}" stroke="#334155" stroke-width="2"/><text x="${W - pad + 6}" y="${cy + 4}" font-size="10" fill="#52606d">x</text><text x="${cx + 6}" y="${pad + 2}" font-size="10" fill="#52606d">y</text>`;
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
    outline = `<polygon points="${ring.map((p) => `${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(" ")}" fill="rgba(15,138,132,0.1)" stroke="${DATA_1}" stroke-width="2"/>`;
  }
  const pts = rawPts
    .map((p) => {
      const px = X(p.x),
        py = Y(p.y);
      const lbl = p.label || `(${p.x}, ${p.y})`;
      return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5.5" fill="${DATA_2}" stroke="#fff" stroke-width="2"/><text x="${(px + 7).toFixed(1)}" y="${(py - 7).toFixed(1)}" font-size="11" font-weight="700" fill="#17323f">${esc(lbl)}</text>`;
    })
    .join("");
  return wrapFigure(cfg, `${grid}${axes}${outline}${pts}`, W, H, 16);
}

function dotPlot(cfg) {
  const vals = Array.isArray(cfg.values) ? cfg.values.map(Number).filter(Number.isFinite) : [];
  if (!vals.length) return "";
  const min = Math.min(...vals),
    max = Math.max(...vals),
    span = Math.max(1, max - min);
  const W = 520,
    H = 150,
    padL = 28,
    padR = 28,
    baseY = 112;
  const xOf = (v) => padL + ((v - min) / span) * (W - padL - padR);
  const counts = new Map();
  let dots = "";
  for (const v of vals) {
    const c = (counts.get(v) || 0) + 1;
    counts.set(v, c);
    dots += `<circle cx="${xOf(v).toFixed(1)}" cy="${baseY - c * 14}" r="5.5" fill="${DATA_1}"/>`;
  }
  let ticks = "";
  const step = span <= 12 ? 1 : Math.ceil(span / 10);
  for (let v = min; v <= max; v += step) {
    ticks += `<line x1="${xOf(v).toFixed(1)}" y1="${baseY - 4}" x2="${xOf(v).toFixed(1)}" y2="${baseY + 4}" stroke="#334155"/><text x="${xOf(v).toFixed(1)}" y="${baseY + 20}" text-anchor="middle" font-size="11" fill="#334155">${v}</text>`;
  }
  const line = `<line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="#334155" stroke-width="1.5"/>`;
  return wrapFigure(cfg, `${line}${ticks}${dots}`, W, H, 12);
}

function boxPlot(cfg) {
  const { min, q1, median, q3, max } = cfg;
  if ([min, q1, median, q3, max].some((v) => !Number.isFinite(Number(v)))) return "";
  const W = 520,
    H = 130,
    padL = 28,
    padR = 28,
    cy = 48,
    axisY = 96;
  const span = Math.max(1, max - min);
  const xOf = (v) => padL + ((v - min) / span) * (W - padL - padR);
  const inner =
    `<line x1="${xOf(min)}" y1="${cy}" x2="${xOf(q1)}" y2="${cy}" stroke="${DATA_1}" stroke-width="2"/>` +
    `<line x1="${xOf(q3)}" y1="${cy}" x2="${xOf(max)}" y2="${cy}" stroke="${DATA_1}" stroke-width="2"/>` +
    `<line x1="${xOf(min)}" y1="${cy - 10}" x2="${xOf(min)}" y2="${cy + 10}" stroke="${DATA_1}" stroke-width="2"/>` +
    `<line x1="${xOf(max)}" y1="${cy - 10}" x2="${xOf(max)}" y2="${cy + 10}" stroke="${DATA_1}" stroke-width="2"/>` +
    `<rect x="${xOf(q1)}" y="${cy - 16}" width="${Math.max(2, xOf(q3) - xOf(q1))}" height="32" rx="3" fill="rgba(15,138,132,0.16)" stroke="${DATA_1}" stroke-width="2"/>` +
    `<line x1="${xOf(median)}" y1="${cy - 16}" x2="${xOf(median)}" y2="${cy + 16}" stroke="${DATA_2}" stroke-width="2.5"/>` +
    `<line x1="${padL}" y1="${axisY}" x2="${W - padR}" y2="${axisY}" stroke="#334155"/>` +
    [min, q1, median, q3, max]
      .map(
        (v) =>
          `<text x="${xOf(v).toFixed(1)}" y="${axisY + 16}" text-anchor="middle" font-size="11" fill="#334155">${v}</text>`,
      )
      .join("");
  return wrapFigure(cfg, inner, W, H, 12);
}

function ratioTableCard(cfg) {
  const a = Number(cfg.a) || 1,
    b = Number(cfg.b) || 1;
  const la = cfg.labelA || "Quantity A",
    lb = cfg.labelB || "Quantity B";
  const rows = [1, 2, 3, 4].map((k) => `<tr><td>${a * k}</td><td>${b * k}</td></tr>`).join("");
  return `<div class="ms-diagram ms-diagram--card"><table class="ms-mini-table"><thead><tr><th>${esc(la)}</th><th>${esc(lb)}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function calcCard(cfg) {
  if (cfg.kind === "long-division-builder") {
    return `<div class="ms-diagram ms-diagram--card"><p class="ms-diagram__expr">${esc(cfg.dividend)} ÷ ${esc(cfg.divisor)}</p></div>`;
  }
  if (cfg.kind === "decimal-columns") {
    return `<div class="ms-diagram ms-diagram--card"><p class="ms-diagram__expr">${esc(cfg.a)} ${esc(cfg.op || "+")} ${esc(cfg.b)}</p></div>`;
  }
  if (cfg.kind === "decimal-product") {
    return `<div class="ms-diagram ms-diagram--card"><p class="ms-diagram__expr">${esc(cfg.a)} × ${esc(cfg.b)}</p></div>`;
  }
  if (cfg.kind === "factor-tree-lab") {
    return `<div class="ms-diagram ms-diagram--card"><p class="ms-diagram__expr">${esc((cfg.mode || "gcf").toUpperCase())}: ${esc(cfg.start)}${cfg.startB != null ? ` &amp; ${esc(cfg.startB)}` : ""}</p></div>`;
  }
  return "";
}

export function renderDiagram(cfg) {
  if (!cfg || !cfg.kind) return "";
  switch (cfg.kind) {
    case "bar-chart":
      return barChart(cfg);
    case "histogram":
      return histogram(cfg);
    case "tape-diagram":
      return tapeDiagram(cfg);
    case "number-line":
      return numberLine(cfg);
    case "coordinate-plane":
      return coordPlane(cfg);
    case "dot-plot":
      return dotPlot(cfg);
    case "box-plot":
      return boxPlot(cfg);
    case "ratio-table-builder":
      return ratioTableCard(cfg);
    case "long-division-builder":
    case "decimal-columns":
    case "decimal-product":
    case "factor-tree-lab":
      return calcCard(cfg);
    default:
      return "";
  }
}
