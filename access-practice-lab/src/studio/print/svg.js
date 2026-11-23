// Inline SVG figures for paper: number line and coordinate grid. Sizes are chosen so that, at the printed width,
// every label is at least 12pt (the viewBox is 0.75pt per unit at full text width).

import { esc } from "./html.js";
import { numberLineModel, plotModel } from "./paper-model.js";

const INK = "#111";
const GRID = "#b9c0c6";

/** A number line to mark on. The ticks and labels are positions only; nothing reveals the answer. */
export function numberLineSvg(q) {
  const m = numberLineModel(q);
  const W = 672;
  const x0 = 36;
  const x1 = W - 36;
  const y = 44;
  const at = (i) => x0 + ((x1 - x0) * i) / m.count;
  const ticks = m.ticks
    .map((t) => {
      const h = t.label ? 12 : 8;
      const label = t.label
        ? `<text x="${at(t.i).toFixed(1)}" y="${y + 34}" text-anchor="middle" font-size="17" fill="${INK}">${esc(t.label.replace(/^-/, "\u2212"))}</text>`
        : "";
      return `<line x1="${at(t.i).toFixed(1)}" y1="${y - h}" x2="${at(t.i).toFixed(1)}" y2="${y + h}" stroke="${INK}" stroke-width="2"/>${label}`;
    })
    .join("");
  const label = `Number line from ${m.min} to ${m.max}, with tick marks every ${Number(m.step.toFixed(6))}`;
  return `<svg class="fig numberline" viewBox="0 0 ${W} 92" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><line x1="${x0 - 14}" y1="${y}" x2="${x1 + 14}" y2="${y}" stroke="${INK}" stroke-width="2.5"/><polygon points="${x0 - 22},${y} ${x0 - 12},${y - 6} ${x0 - 12},${y + 6}" fill="${INK}"/><polygon points="${x1 + 22},${y} ${x1 + 12},${y - 6} ${x1 + 12},${y + 6}" fill="${INK}"/>${ticks}</svg>`;
}

/** A square coordinate grid on whole numbers. One viewBox unit is 0.75pt, so labels stay at 12pt. */
export function gridSvg(q) {
  const m = plotModel(q);
  const pad = 34;
  const cell = Math.min(36, 340 / m.span);
  const size = Math.round(cell * m.span + pad * 2);
  const px = (v) => pad + (v - m.min) * cell;
  const py = (v) => size - pad - (v - m.min) * cell;
  const f = (n) => n.toFixed(1);
  const lines = m.values
    .map(
      (t) =>
        `<line x1="${f(px(t.v))}" y1="${pad}" x2="${f(px(t.v))}" y2="${size - pad}" stroke="${GRID}" stroke-width="1"/><line x1="${pad}" y1="${f(py(t.v))}" x2="${size - pad}" y2="${f(py(t.v))}" stroke="${GRID}" stroke-width="1"/>`,
    )
    .join("");
  const ax = m.axisX ? px(0) : pad;
  const ay = m.axisY ? py(0) : size - pad;
  const axes = `<line x1="${pad}" y1="${f(ay)}" x2="${size - pad}" y2="${f(ay)}" stroke="${INK}" stroke-width="2.5"/><line x1="${f(ax)}" y1="${pad}" x2="${f(ax)}" y2="${size - pad}" stroke="${INK}" stroke-width="2.5"/>`;
  const text = (x, y, anchor, label, extra = "") =>
    `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" font-size="16" fill="${INK}" stroke="#fff" stroke-width="4" paint-order="stroke"${extra}>${esc(label.replace(/^-/, "\u2212"))}</text>`;
  const labelsX = m.values
    .filter((t) => t.label && t.v !== 0)
    .map((t) => text(px(t.v), ay + 21, "middle", t.label))
    .join("");
  const labelsY = m.values
    .filter((t) => t.label && t.v !== 0)
    .map((t) => text(ax - 8, py(t.v) + 5, "end", t.label))
    .join("");
  const origin = m.values.some((t) => t.v === 0 && t.label) ? text(ax - 8, ay + 21, "end", "0") : "";
  const names =
    text(size - pad + 8, ay + 6, "start", "x", ' font-style="italic"') +
    text(ax + 9, pad - 12, "start", "y", ' font-style="italic"');
  const label = `Coordinate grid from ${m.min} to ${m.max} on both axes`;
  return `<svg class="fig grid" viewBox="0 0 ${size + 14} ${size}" style="width:${Math.round((size + 14) * 0.75)}pt" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">${lines}${axes}${labelsX}${labelsY}${origin}${names}</svg>`;
}
