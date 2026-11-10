// The four MathSense pictures as SVG strings, all drawn from the same state. Exact amounts decide what is shaded;
// floats are used only for coordinates. Quantity A is solid teal with a circle marker; B is hatched amber with a
// diamond marker, so the two never depend on colour alone.
import { t } from "../i18n.js";
import {
  decimalText,
  floor,
  fractionText,
  make,
  mul,
  percentText,
  piecesOf,
  toNumber,
} from "./exact.js";
import { extent, shownKeys } from "./model.js";

export const VB_W = 360;
const PAD = 6;
const GAP = 8;
const AXIS_W = VB_W - PAD * 2;
const num = (value) => Math.round(value * 100) / 100;

const svg = (id, height, body, label) =>
  `<svg viewBox="0 0 ${VB_W} ${height}" width="100%" focusable="false" aria-hidden="true" data-picture="${id}"><title>${label}</title>
<defs><pattern id="ms-hatch-${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="ms-hatch-bg"/><line x1="0" y1="0" x2="0" y2="6" class="ms-hatch-line" stroke-width="2.4"/></pattern></defs>${body}</svg>`;

const fillAttr = (which, id) => (which === "b" ? `fill="url(#ms-hatch-${id})"` : "");
const fillClass = (which) => (which === "b" ? "ms-fill-b" : "ms-fill-a");
const marker = (which, x, y, dir) => {
  const up = dir === "up";
  const tip = up ? y - 11 : y + 11;
  return which === "b"
    ? `<path class="ms-mark ms-mark-b" d="M${num(x)} ${tip - (up ? 7 : -7)} l7 7 l-7 7 l-7 -7 z"/>`
    : `<path class="ms-mark ms-mark-a" d="M${num(x)} ${y} l-7 ${up ? -12 : 12} h14 z"/>`;
};

// ---- Fraction bar: one bar per whole, cut into equal pieces, rows for A and B -----------------------------------
export function barSegments(wholes) {
  const w = (AXIS_W - GAP * (wholes - 1)) / wholes;
  return Array.from({ length: wholes }, (_, i) => ({ x0: PAD + i * (w + GAP), w }));
}
export function barValueAt(x, wholes) {
  const segs = barSegments(wholes);
  let best = 0;
  let nearest = Infinity;
  segs.forEach((seg, i) => {
    const inside = x >= seg.x0 && x <= seg.x0 + seg.w;
    const distance = inside ? 0 : Math.min(Math.abs(x - seg.x0), Math.abs(x - seg.x0 - seg.w));
    if (distance < nearest) {
      nearest = distance;
      best = i + Math.min(1, Math.max(0, (x - seg.x0) / seg.w));
    }
  });
  return best / wholes; // 0..1 across the whole axis
}

export function fractionBar(state) {
  const wholes = extent(state);
  const segs = barSegments(wholes);
  const rows = shownKeys(state);
  let body = "";
  rows.forEach((which, row) => {
    const q = state[which];
    const parts = state.parts[which];
    const top = 26 + row * 76;
    const value = toNumber(q);
    const k = piecesOf(q, parts);
    const caption =
      k === null
        ? t("{name}: {fraction}, between two lines of the {parts}-piece cut", {
            name: which.toUpperCase(),
            fraction: fractionText(q),
            parts,
          })
        : t("{name}: {k} of {parts} pieces = {fraction}", {
            name: which.toUpperCase(),
            k,
            parts,
            fraction: fractionText(q),
          });
    body += `<text x="${PAD}" y="${top - 8}" class="ms-cap">${caption}</text>`;
    segs.forEach((seg, i) => {
      const filled = Math.min(1, Math.max(0, value - i));
      const wide = seg.w / parts >= 2.2;
      const every = wide ? 1 : 10;
      let lines = "";
      for (let j = every; j < parts; j += every)
        lines += `<line x1="${num(seg.x0 + (seg.w * j) / parts)}" x2="${num(seg.x0 + (seg.w * j) / parts)}" y1="${top}" y2="${top + 34}" class="ms-cut"/>`;
      body += `<g><rect x="${num(seg.x0)}" y="${top}" width="${num(seg.w)}" height="34" class="ms-well"/>
<rect x="${num(seg.x0)}" y="${top}" width="${num(seg.w * filled)}" height="34" class="${fillClass(which)}" ${fillAttr(which, "bar")}/>${lines}
<rect x="${num(seg.x0)}" y="${top}" width="${num(seg.w)}" height="34" class="ms-outline"/></g>`;
    });
  });
  return svg("bar", rows.length * 76 + 6, body, t("Fraction bar"));
}

// ---- Number line: A above the line, B below ------------------------------------------------------------------------
export const lineX = (valueOverWholes) => PAD + valueOverWholes * AXIS_W;
export const lineValueAt = (x) => Math.min(1, Math.max(0, (x - PAD) / AXIS_W));

export function numberLine(state) {
  const wholes = extent(state);
  const both = state.compare;
  const axisY = both ? 78 : 62;
  const parts = state.parts[state.active];
  const spacing = AXIS_W / (wholes * parts);
  const every = spacing >= 4 ? 1 : 10;
  const labelEvery = spacing >= 26 ? 1 : 0;
  let body = `<line x1="${PAD}" x2="${VB_W - PAD}" y1="${axisY}" y2="${axisY}" class="ms-axis"/>`;
  for (let i = 0; i <= wholes * parts; i += every) {
    const whole = i % parts === 0;
    const x = lineX(i / (wholes * parts));
    body += `<line x1="${num(x)}" x2="${num(x)}" y1="${axisY - (whole ? 9 : 5)}" y2="${axisY + (whole ? 9 : 5)}" class="${whole ? "ms-tick-major" : "ms-tick"}"/>`;
    if (whole)
      body += `<text x="${num(x)}" y="${axisY + 24}" text-anchor="middle" class="ms-tick-label">${i / parts}</text>`;
    else if (labelEvery)
      body += `<text x="${num(x)}" y="${axisY + 22}" text-anchor="middle" class="ms-tick-small">${i % parts}/${parts}</text>`;
  }
  shownKeys(state).forEach((which) => {
    const q = state[which];
    const x = lineX(toNumber(q) / wholes);
    const above = which === "a";
    const label = `${which.toUpperCase()} ${fractionText(q)} = ${decimalText(q).text}`;
    const anchor = x > VB_W - 90 ? "end" : x < 90 ? "start" : "middle";
    body += `<line x1="${num(x)}" x2="${num(x)}" y1="${axisY}" y2="${above ? axisY - 12 : axisY + 12}" class="ms-stem ms-stem-${which}"/>${marker(which, x, above ? axisY - 12 : axisY + 12, above ? "up" : "down")}
<text x="${num(x)}" y="${above ? axisY - 31 : axisY + 58}" text-anchor="${anchor}" class="ms-line-label">${label}</text>`;
  });
  body += `<rect x="0" y="0" width="${VB_W}" height="${axisY * 2 + 22}" class="ms-hit"/>`;
  return svg("line", axisY * 2 + 22, body, t("Number line"));
}

// ---- Decimal grid: ten columns of ten hundredths, filled column by column ----------------------------------------------
const gridCell = (wholes) => (wholes === 1 ? 24 : wholes === 2 ? 15 : 11);
export function gridLayout(wholes) {
  const cell = gridCell(wholes);
  const size = cell * 10;
  const perRow = Math.min(wholes, 3);
  const gap = wholes === 1 ? 0 : 14;
  const rowWidth = perRow * size + (perRow - 1) * gap;
  const left = Math.max(PAD, (VB_W - rowWidth) / 2);
  return { cell, size, perRow, gap, left, groupHeight: Math.ceil(wholes / 3) * (size + 14) + 22 };
}
export function gridCountAt(x, y, row, wholes) {
  const { cell, size, perRow, gap, left, groupHeight } = gridLayout(wholes);
  const localY = y - row * groupHeight - 22;
  const g = Math.floor(localY / (size + 14)) * perRow + Math.floor((x - left) / (size + gap));
  const gx = x - left - (g % perRow) * (size + gap);
  const gy = localY - Math.floor(g / perRow) * (size + 14);
  if (g < 0 || g >= wholes || gx < 0 || gx >= size || gy < 0 || gy >= size) return null;
  return g * 100 + Math.floor(gx / cell) * 10 + Math.floor(gy / cell) + 1;
}

export function decimalGrid(state) {
  const wholes = extent(state);
  const L = gridLayout(wholes);
  const rows = shownKeys(state);
  let body = "";
  rows.forEach((which, row) => {
    const q = state[which];
    const hundredths = mul(q, make(100n));
    const full = Number(floor(hundredths));
    const rest = toNumber(make(hundredths.n - BigInt(full) * hundredths.d, hundredths.d));
    const top = row * L.groupHeight;
    body += `<text x="${PAD}" y="${top + 14}" class="ms-cap">${t("{name}: {count} of {total} squares = {decimal}", { name: which.toUpperCase(), count: decimalText(hundredths).text, total: wholes * 100, decimal: decimalText(q).text })}</text>`;
    for (let g = 0; g < wholes; g += 1) {
      const gx = L.left + (g % L.perRow) * (L.size + L.gap);
      const gy = top + 22 + Math.floor(g / L.perRow) * (L.size + 14);
      body += `<rect x="${gx}" y="${gy}" width="${L.size}" height="${L.size}" class="ms-well"/>`;
      for (let index = 0; index < 100; index += 1) {
        const at = g * 100 + index;
        const x = gx + Math.floor(index / 10) * L.cell;
        const y = gy + (index % 10) * L.cell;
        if (at < full)
          body += `<rect x="${x}" y="${y}" width="${L.cell}" height="${L.cell}" class="${fillClass(which)}" ${fillAttr(which, "grid")}/>`;
        else if (at === full && rest > 0)
          body += `<rect x="${x}" y="${num(y + L.cell * (1 - rest))}" width="${L.cell}" height="${num(L.cell * rest)}" class="${fillClass(which)}" ${fillAttr(which, "grid")}/>`;
      }
      let cells = "";
      for (let i = 1; i < 10; i += 1)
        cells += `<line x1="${gx + i * L.cell}" x2="${gx + i * L.cell}" y1="${gy}" y2="${gy + L.size}" class="ms-cut"/><line x1="${gx}" x2="${gx + L.size}" y1="${gy + i * L.cell}" y2="${gy + i * L.cell}" class="ms-cut"/>`;
      body += `${cells}<rect x="${gx}" y="${gy}" width="${L.size}" height="${L.size}" class="ms-outline"/>`;
    }
  });
  return svg("grid", rows.length * L.groupHeight + 4, body, t("Decimal grid"));
}

// ---- Percent bar: 100% is the whole; the part beyond it is hatched and labelled -----------------------------------------
export function percentBar(state) {
  const wholes = extent(state);
  const rows = shownKeys(state);
  const step = wholes <= 2 ? 25 : 50;
  const oneX = lineX(1 / wholes);
  let body = "";
  rows.forEach((which, row) => {
    const q = state[which];
    const top = 26 + row * 78;
    const value = toNumber(q);
    const shade = Math.min(1, value / wholes);
    body += `<text x="${PAD}" y="${top - 8}" class="ms-cap">${t("{name}: {percent} of one whole", { name: which.toUpperCase(), percent: percentText(q).text })}</text>
<rect x="${PAD}" y="${top}" width="${AXIS_W}" height="30" class="ms-well"/>`;
    if (wholes > 1)
      body += `<rect x="${num(oneX)}" y="${top}" width="${num(VB_W - PAD - oneX)}" height="30" class="ms-over"/>`;
    body += `<rect x="${PAD}" y="${top}" width="${num(AXIS_W * shade)}" height="30" class="${fillClass(which)}" ${fillAttr(which, "percent")}/>`;
    for (let p = 10; p < wholes * 100; p += 10)
      body += `<line x1="${num(lineX(p / (wholes * 100)))}" x2="${num(lineX(p / (wholes * 100)))}" y1="${top}" y2="${top + 30}" class="ms-cut"/>`;
    body += `<rect x="${PAD}" y="${top}" width="${AXIS_W}" height="30" class="ms-outline"/>`;
    if (row === 0) {
      for (let p = 0; p <= wholes * 100; p += step)
        body += `<text x="${num(lineX(p / (wholes * 100)))}" y="${top + 46}" text-anchor="${p === 0 ? "start" : p === wholes * 100 ? "end" : "middle"}" class="ms-tick-label">${p}%</text>`;
    }
    body += `<line x1="${num(oneX)}" x2="${num(oneX)}" y1="${top - 4}" y2="${top + 34}" class="ms-whole-mark"/>`;
  });
  return svg("percent", rows.length * 78 + 22, body, t("Percent bar"));
}

// Which quantity a vertical position belongs to: rows are stacked A then B (the number line puts A above, B below).
export function rowAt(picture, y, state) {
  if (!state.compare) return "a";
  if (picture === "bar") return y < 26 + 76 - 14 ? "a" : "b";
  if (picture === "percent") return y < 26 + 78 - 14 ? "a" : "b";
  if (picture === "grid") return y < gridLayout(extent(state)).groupHeight ? "a" : "b";
  return y < 78 ? "a" : "b";
}
export const gridRowOf = (y, wholes) => Math.floor(y / gridLayout(wholes).groupHeight);
