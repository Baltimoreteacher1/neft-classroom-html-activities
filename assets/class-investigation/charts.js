// Our Class Investigation — the live class graphs.
//
// Pure functions that return SVG strings for a dot plot, a histogram, a scatter
// plot and a bar graph. No DOM, no network, so they are testable and the same
// drawing serves the page and the family card.
//
// What these deliberately do NOT draw: a mean, a median, a percent or a line of
// best fit. Those are the answers the unit tools ask a student to find, so the
// picture shows the data and leaves the finding to the student.
//
// Every figure carries a text alternative, never relies on color alone (a dot
// that is yours gets a ring, not a different fill), and has a table twin that
// the page offers under it.

import { tr } from "./i18n.js";
import { niceBins } from "./stats.js";

const W = 560;
const H = 300;
const M = { l: 52, r: 18, t: 18, b: 56 };
const INK = "#17202a";
const MUTED = "#4a5663";
const GRID = "#dfe6e4";
const DOT = "#0f766e";
const MINE = "#12355b";
const BAR = "#2f7f78";
const AMBER = "#8a5a00";

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const r1 = (n) => Math.round(n * 10) / 10;
const fmtTick = (n) => String(Math.round(n * 100) / 100);

/** Tick positions at a round step so the axis reads 0, 5, 10... never 3.7, 7.4. */
export function niceTicks(lo, hi, maxTicks = 8) {
  const span = Math.max(hi - lo, 1e-9);
  const step = [0.5, 1, 2, 5, 10, 20, 50, 100, 200].find((s) => span / s <= maxTicks) ?? 500;
  const ticks = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step)
    ticks.push(r1(t * 100) / 100);
  return { step, ticks };
}

const frame = (alt, inner) =>
  `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(alt)}" xmlns="http://www.w3.org/2000/svg" class="ci-svg">` +
  `<title>${esc(alt)}</title>${inner}</svg>`;

const axisLabel = (text, x, y, anchor = "middle", rotate = false) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="13" font-weight="700" fill="${INK}"${
    rotate ? ` transform="rotate(-90 ${x} ${y})"` : ""
  }>${esc(text)}</text>`;

const withUnit = (label, unit) => (unit ? `${label} (${unit})` : label);

/** Shared horizontal numeric axis with ticks. */
function xAxis(lo, hi, label) {
  const { ticks } = niceTicks(lo, hi);
  const x = (v) => M.l + ((v - lo) / (hi - lo)) * (W - M.l - M.r);
  let out = `<line x1="${M.l}" y1="${H - M.b}" x2="${W - M.r}" y2="${H - M.b}" stroke="${INK}" stroke-width="1.6"/>`;
  for (const t of ticks) {
    out +=
      `<line x1="${r1(x(t))}" y1="${H - M.b}" x2="${r1(x(t))}" y2="${H - M.b + 5}" stroke="${INK}"/>` +
      `<text x="${r1(x(t))}" y="${H - M.b + 19}" text-anchor="middle" font-size="12" fill="${INK}">${fmtTick(t)}</text>`;
  }
  return { x, svg: out + axisLabel(label, (M.l + W - M.r) / 2, H - 10) };
}

/**
 * @param {{ v: number, mine?: boolean }[]} points
 * @param {{ label: string, unit?: string, step?: number, lang: string }} o
 */
export function dotPlotSvg(points, o) {
  const vals = points.map((p) => p.v);
  const alt = tr("altDot", o.lang, {
    n: points.length,
    label: o.label,
    min: points.length ? Math.min(...vals) : "–",
    max: points.length ? Math.max(...vals) : "–",
  });
  if (!points.length) return frame(alt, emptyNote(o.lang));
  const step = o.step ?? 1;
  const lo = Math.floor(Math.min(...vals) / step) * step - step;
  const hi = Math.max(Math.ceil(Math.max(...vals) / step) * step + step, lo + step * 2);
  const { x, svg: axis } = xAxis(lo, hi, withUnit(o.label, o.unit));

  const stacks = new Map();
  for (const p of points) {
    const key = Math.round(p.v / step);
    stacks.set(key, [...(stacks.get(key) ?? []), p]);
  }
  const tallest = Math.max(...[...stacks.values()].map((s) => s.length));
  const gap = (W - M.l - M.r) / ((hi - lo) / step);
  const r = Math.max(2.4, Math.min(8, gap / 2 - 0.5, (H - M.t - M.b) / (2.2 * tallest)));
  let dots = "";
  for (const [key, stack] of stacks) {
    const cx = r1(x(key * step));
    stack.forEach((p, i) => {
      const cy = r1(H - M.b - r - 2 - i * (2 * r + 1));
      dots += p.mine
        ? `<circle cx="${cx}" cy="${cy}" r="${r + 1.5}" fill="${DOT}" stroke="${MINE}" stroke-width="3"/>`
        : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${DOT}" stroke="#fff" stroke-width="1"/>`;
    });
  }
  return frame(alt, axis + dots);
}

/**
 * @param {{ v: number, mine?: boolean }[]} points
 * @param {{ label: string, unit?: string, lang: string }} o
 */
export function histogramSvg(points, o) {
  const vals = points.map((p) => p.v);
  const alt = tr("altHist", o.lang, {
    n: points.length,
    label: o.label,
    min: points.length ? Math.min(...vals) : "–",
    max: points.length ? Math.max(...vals) : "–",
  });
  if (!points.length) return frame(alt, emptyNote(o.lang));
  const { start, width, bins } = niceBins(vals);
  const end = bins.length ? bins[bins.length - 1].hi : start + width;
  const top = Math.max(...bins.map((b) => b.count), 1);
  const yMax = top <= 5 ? top + 1 : Math.ceil(top * 1.15);
  const { x, svg: axis } = xAxis(start, end, withUnit(o.label, o.unit));
  const y = (n) => H - M.b - (n / yMax) * (H - M.t - M.b);
  let grid = "";
  const { ticks } = niceTicks(0, yMax, 6);
  for (const t of ticks.filter((n) => Number.isInteger(n))) {
    grid +=
      `<line x1="${M.l}" y1="${r1(y(t))}" x2="${W - M.r}" y2="${r1(y(t))}" stroke="${GRID}"/>` +
      `<text x="${M.l - 8}" y="${r1(y(t)) + 4}" text-anchor="end" font-size="12" fill="${INK}">${t}</text>`;
  }
  grid += axisLabel(
    tr("tableDot", o.lang) === "" ? "" : countLabel(o.lang),
    14,
    (H - M.b + M.t) / 2,
    "middle",
    true,
  );
  const mineVals = points.filter((p) => p.mine).map((p) => p.v);
  let bars = "";
  for (const b of bins) {
    const bx = r1(x(b.lo)) + 1;
    const bw = r1(x(b.hi) - x(b.lo)) - 2;
    const has = mineVals.some((v) => v >= b.lo && v < b.hi);
    bars += `<rect x="${bx}" y="${r1(y(b.count))}" width="${bw}" height="${r1(H - M.b - y(b.count))}" fill="${BAR}" stroke="${has ? MINE : "#fff"}" stroke-width="${has ? 3 : 1}"/>`;
    if (b.count) {
      bars += `<text x="${r1(bx + bw / 2)}" y="${r1(y(b.count)) - 5}" text-anchor="middle" font-size="12" font-weight="700" fill="${INK}">${b.count}</text>`;
    }
  }
  return frame(alt, grid + bars + axis);
}

/**
 * @param {{ x: number, y: number, mine?: boolean }[]} pairs
 * @param {{ xLabel: string, yLabel: string, xUnit?: string, yUnit?: string, lang: string,
 *   target?: number, ringed?: number[] }} o  target = index drawn as the diamond to read
 */
export function scatterSvg(pairs, o) {
  const alt = tr("altScatter", o.lang, { n: pairs.length, x: o.xLabel, y: o.yLabel });
  if (!pairs.length) return frame(alt, emptyNote(o.lang));
  const pad = (a, b) => Math.max((b - a) * 0.08, 0.5);
  const xs = pairs.map((p) => p.x);
  const ys = pairs.map((p) => p.y);
  const xLo = Math.floor(Math.min(...xs) - pad(Math.min(...xs), Math.max(...xs)));
  const xHi = Math.ceil(Math.max(...xs) + pad(Math.min(...xs), Math.max(...xs)));
  const yLo = Math.floor(Math.min(...ys) - pad(Math.min(...ys), Math.max(...ys)));
  const yHi = Math.ceil(Math.max(...ys) + pad(Math.min(...ys), Math.max(...ys)));
  const { x, svg: axis } = xAxis(xLo, xHi, withUnit(o.xLabel, o.xUnit));
  const y = (v) => H - M.b - ((v - yLo) / (yHi - yLo)) * (H - M.t - M.b);
  let left = `<line x1="${M.l}" y1="${M.t}" x2="${M.l}" y2="${H - M.b}" stroke="${INK}" stroke-width="1.6"/>`;
  for (const t of niceTicks(yLo, yHi, 7).ticks) {
    left +=
      `<line x1="${M.l}" y1="${r1(y(t))}" x2="${W - M.r}" y2="${r1(y(t))}" stroke="${GRID}"/>` +
      `<text x="${M.l - 8}" y="${r1(y(t)) + 4}" text-anchor="end" font-size="12" fill="${INK}">${fmtTick(t)}</text>`;
  }
  left += axisLabel(withUnit(o.yLabel, o.yUnit), 14, (H - M.b + M.t) / 2, "middle", true);
  const ringed = new Set(o.ringed ?? []);
  let dots = "";
  pairs.forEach((p, i) => {
    const cx = r1(x(p.x));
    const cy = r1(y(p.y));
    if (i === o.target) {
      dots +=
        `<path d="M${cx},${cy - 11} L${cx + 11},${cy} L${cx},${cy + 11} L${cx - 11},${cy} Z" fill="${AMBER}" stroke="${INK}" stroke-width="3"/>` +
        `<text x="${cx + 15}" y="${cy - 10}" font-size="13" font-weight="800" fill="${INK}">?</text>`;
    } else if (ringed.has(i) || p.mine) {
      dots += `<circle cx="${cx}" cy="${cy}" r="7" fill="${DOT}" stroke="${MINE}" stroke-width="3"/>`;
    } else {
      dots += `<circle cx="${cx}" cy="${cy}" r="5" fill="${DOT}" fill-opacity="0.8" stroke="#fff" stroke-width="1"/>`;
    }
  });
  return frame(alt, left + dots + axis);
}

/**
 * @param {{ id: string, label: string, n: number, mine?: boolean }[]} bars
 * @param {{ label: string, lang: string }} o
 */
export function barSvg(bars, o) {
  const total = bars.reduce((a, b) => a + b.n, 0);
  const alt = tr("altBar", o.lang, { n: total, label: o.label });
  if (!total) return frame(alt, emptyNote(o.lang));
  const top = Math.max(...bars.map((b) => b.n), 1);
  const yMax = top <= 5 ? top + 1 : Math.ceil(top * 1.15);
  const slot = (W - M.l - M.r) / bars.length;
  const y = (n) => H - M.b - (n / yMax) * (H - M.t - M.b);
  let out = `<line x1="${M.l}" y1="${H - M.b}" x2="${W - M.r}" y2="${H - M.b}" stroke="${INK}" stroke-width="1.6"/>`;
  for (const t of niceTicks(0, yMax, 6).ticks.filter((n) => Number.isInteger(n))) {
    out +=
      `<line x1="${M.l}" y1="${r1(y(t))}" x2="${W - M.r}" y2="${r1(y(t))}" stroke="${GRID}"/>` +
      `<text x="${M.l - 8}" y="${r1(y(t)) + 4}" text-anchor="end" font-size="12" fill="${INK}">${t}</text>`;
  }
  out += axisLabel(countLabel(o.lang), 14, (H - M.b + M.t) / 2, "middle", true);
  bars.forEach((b, i) => {
    const bw = Math.min(slot * 0.62, 70);
    const bx = r1(M.l + slot * i + (slot - bw) / 2);
    out += `<rect x="${bx}" y="${r1(y(b.n))}" width="${r1(bw)}" height="${r1(H - M.b - y(b.n))}" fill="${BAR}" stroke="${b.mine ? MINE : "#fff"}" stroke-width="${b.mine ? 3 : 1}"/>`;
    out += `<text x="${r1(bx + bw / 2)}" y="${r1(y(b.n)) - 5}" text-anchor="middle" font-size="13" font-weight="800" fill="${INK}">${b.n}</text>`;
    const words = b.label.split(" ");
    const half = Math.ceil(words.length / 2);
    const lines =
      words.length > 2 ? [words.slice(0, half).join(" "), words.slice(half).join(" ")] : [b.label];
    lines.forEach((line, k) => {
      out += `<text x="${r1(bx + bw / 2)}" y="${H - M.b + 18 + k * 15}" text-anchor="middle" font-size="12" fill="${INK}">${esc(line)}</text>`;
    });
  });
  return frame(alt, out);
}

const countLabel = (lang) => tr("yCount", lang);

function emptyNote(lang) {
  return `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="16" fill="${MUTED}">${esc(tr("emptyData", lang))}</text>`;
}
