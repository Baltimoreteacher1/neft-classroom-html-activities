// Fraction drawing helpers shared by Family Math 2.0 games: pizza (circle) and bar partitions, measuring cups and
// pitchers, number-line strips and a row of serving cups. Every proportion is computed from exact fractions, so a
// drawn slice angle, bar width, liquid height or marker position equals the value it shows. Colors are inline
// (PALETTE) so these figures never depend on a game's stylesheet. @fm2 FM-059 FM-036 FM-009
import { frac, sub, toMixedString, toNumber, toString } from "../rational.js";
import { label, line, PALETTE, svg } from "./base.js";

const TAU = Math.PI * 2;
const r3 = (x) => Math.round(x * 1000) / 1000;

export const PIZZA = { cx: 110, cy: 110, r: 96, crust: 105, pitch: 224, height: 220 };
export const BAR = { x: 24, w: 520, h: 64, gap: 20, width: 568 };
export const VESSEL = { x: 76, y: 26, w: 100, h: 236, width: 250, height: 290 };
export const STRIP = { x0: 36, x1: 536, y: 78, width: 572, height: 150 };

// The cut positions of n equal parts: n - 1 fractions strictly between 0 and 1.
export const evenCuts = (n) => Array.from({ length: n - 1 }, (_, i) => frac(i + 1, n));
export const edgesOf = (cuts) => [frac(0), ...cuts, frac(1)];
export const sizesOf = (cuts) => {
  const edges = edgesOf(cuts);
  return edges.slice(1).map((edge, i) => sub(edge, edges[i]));
};

export function sectorPath(cx, cy, r, from, to) {
  const point = (turn) =>
    `${r3(cx + r * Math.sin(turn * TAU))} ${r3(cy - r * Math.cos(turn * TAU))}`;
  return `M ${cx} ${cy} L ${point(from)} A ${r} ${r} 0 ${to - from > 0.5 ? 1 : 0} 1 ${point(to)} Z`;
}

const pieceFill = (served, outside) =>
  outside ? PALETTE.mist : served ? PALETTE.mint : PALETTE.goldSoft;
const pieceData = (index, whole, from, size) =>
  `data-piece="${index}" data-whole="${whole}" data-start="${toString(from)}" data-size="${toString(size)}"`;

// `served[i]` is per piece, whole by whole. `base` (a fraction) draws a dashed "leftover" region from 0 to base and
// greys out the pieces that lie wholly beyond it. `labels` writes each piece's size inside it.
export function pizzaSvg({
  cuts,
  served = [],
  wholes = 1,
  base = null,
  labels = true,
  label: aria,
  tag = {},
}) {
  const edges = edgesOf(cuts);
  const sizes = sizesOf(cuts);
  const parts = sizes.length;
  const width = (wholes - 1) * PIZZA.pitch + 2 * PIZZA.cx;
  let body = "";
  for (let w = 0; w < wholes; w += 1) {
    const cx = PIZZA.cx + w * PIZZA.pitch;
    const { cy, r } = PIZZA;
    body += `<circle class="fk-crust" cx="${cx}" cy="${cy}" r="${PIZZA.crust}" fill="${PALETTE.gold}" stroke="${PALETTE.ink}" stroke-width="2"/>`;
    sizes.forEach((size, i) => {
      const index = w * parts + i;
      const from = toNumber(edges[i]);
      const to = toNumber(edges[i + 1]);
      const outside = base && toNumber(edges[i]) >= toNumber(base) - 1e-9;
      const on = Boolean(served[index]);
      const attrs = `class="fk-piece" ${pieceData(index, w, edges[i], size)} fill="${pieceFill(on, outside)}" stroke="${PALETTE.ink}" stroke-width="2.5" stroke-linejoin="round"`;
      body +=
        parts === 1
          ? `<circle ${attrs} cx="${cx}" cy="${cy}" r="${r}"/>`
          : `<path ${attrs} d="${sectorPath(cx, cy, r, from, to)}"/>`;
    });
    sizes.forEach((size, i) => {
      const mid = ((toNumber(edges[i]) + toNumber(edges[i + 1])) / 2) * TAU;
      const reach = parts === 1 ? 0 : size.n * 2 >= size.d ? 0.42 * r : 0.62 * r;
      const x = r3(cx + reach * Math.sin(mid));
      const y = r3(cy - reach * Math.cos(mid));
      const on = Boolean(served[w * parts + i]);
      if (on)
        body += `<text x="${x}" y="${labels && parts <= 8 ? y - 6 : y + 8}" text-anchor="middle" font-size="22" font-weight="700" fill="${PALETTE.paper}" stroke="${PALETTE.ink}" stroke-width="0.8" paint-order="stroke" font-family="Atkinson Hyperlegible, system-ui, sans-serif">✓</text>`;
      if (labels && parts <= 8)
        body += label(x, y + (on ? 14 : 6), toString(size), 15, PALETTE.ink);
    });
    if (base) {
      const from = 0;
      const to = toNumber(base);
      body += `<path class="fk-base" d="${sectorPath(cx, cy, r + 1, from, to)}" fill="none" stroke="${PALETTE.sky}" stroke-width="4" stroke-dasharray="9 6"/>`;
    }
  }
  const baseNote = base ? label(width / 2, PIZZA.height + 18, tag.base || "", 14, PALETTE.sky) : "";
  return svg(width, PIZZA.height + (base ? 26 : 0), body + baseNote, aria);
}

export function barSvg({
  cuts,
  served = [],
  wholes = 1,
  base = null,
  labels = true,
  label: aria,
  tag = {},
}) {
  const edges = edgesOf(cuts);
  const sizes = sizesOf(cuts);
  const parts = sizes.length;
  const rowHeight = BAR.h + BAR.gap;
  let body = "";
  for (let w = 0; w < wholes; w += 1) {
    const y = 8 + w * rowHeight;
    sizes.forEach((size, i) => {
      const index = w * parts + i;
      const x = BAR.x + toNumber(edges[i]) * BAR.w;
      const outside = base && toNumber(edges[i]) >= toNumber(base) - 1e-9;
      const on = Boolean(served[index]);
      body += `<rect class="fk-piece" ${pieceData(index, w, edges[i], size)} x="${r3(x)}" y="${y}" width="${r3(toNumber(size) * BAR.w)}" height="${BAR.h}" fill="${pieceFill(on, outside)}" stroke="${PALETTE.ink}" stroke-width="2.5"/>`;
      const cx = r3(x + (toNumber(size) * BAR.w) / 2);
      if (on)
        body += `<text x="${cx}" y="${y + (labels && parts <= 8 ? 26 : 40)}" text-anchor="middle" font-size="22" font-weight="700" fill="${PALETTE.paper}" stroke="${PALETTE.ink}" stroke-width="0.8" paint-order="stroke" font-family="Atkinson Hyperlegible, system-ui, sans-serif">✓</text>`;
      if (labels && parts <= 8 && toNumber(size) * BAR.w >= 30)
        body += label(cx, y + (on ? 52 : 40), toString(size), 15, PALETTE.ink);
    });
    body += `<rect class="fk-whole" x="${BAR.x}" y="${y}" width="${BAR.w}" height="${BAR.h}" fill="none" stroke="${PALETTE.ink}" stroke-width="4" rx="6"/>`;
    if (base)
      body += `<rect class="fk-base" x="${BAR.x}" y="${y - 4}" width="${r3(toNumber(base) * BAR.w)}" height="${BAR.h + 8}" fill="none" stroke="${PALETTE.sky}" stroke-width="4" stroke-dasharray="9 6"/>`;
  }
  const note = base
    ? label(BAR.x + 4, 8 + wholes * rowHeight, tag.base || "", 14, PALETTE.sky, "start")
    : "";
  return svg(BAR.width, 8 + wholes * rowHeight + (base ? 10 : -6), body + note, aria);
}

// A measuring cup or pitcher: the liquid is exactly level/cap of the vessel height. `marks` draws a line at every
// 1/marks of a cup; `goal` draws a dashed goal line. `tickText` overrides the label for mark i (default a fraction).
export function vesselSvg({
  level,
  cap = 1,
  marks = 0,
  goal = null,
  pitcher = false,
  label: aria,
  tickText = null,
  labelEvery = 1,
}) {
  const { x, y, w, h } = VESSEL;
  const bottom = y + h;
  const at = (value) => r3(bottom - h * (toNumber(value) / cap));
  const lift = h * (toNumber(level) / cap);
  let body = `<rect class="fk-liquid" x="${x}" y="${r3(bottom - lift)}" width="${w}" height="${r3(lift)}" fill="${PALETTE.sky}" fill-opacity="0.55"/>`;
  if (pitcher)
    body += `<path d="M ${x} ${y + 30} C ${x - 44} ${y + 30} ${x - 44} ${y + 120} ${x} ${y + 120}" fill="none" stroke="${PALETTE.ink}" stroke-width="5" stroke-linecap="round"/>`;
  body += `<rect class="fk-vessel" x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${PALETTE.ink}" stroke-width="4" rx="6"/>`;
  const count = marks * cap;
  for (let i = 1; i <= count; i += 1) {
    const value = frac(i, marks);
    const whole = i % marks === 0;
    body += line(
      x + w,
      at(value),
      x + w - (whole ? 30 : 18),
      at(value),
      PALETTE.ink,
      whole ? 3 : 2,
    );
    if (i % labelEvery === 0 || whole)
      body += label(
        x + w + 8,
        at(value) + 5,
        tickText ? tickText(i) : toMixedString(value),
        13,
        PALETTE.ink,
        "start",
      );
  }
  if (goal) {
    body += `<line class="fk-goal" x1="${x - 12}" y1="${at(goal)}" x2="${x + w}" y2="${at(goal)}" stroke="${PALETTE.coral}" stroke-width="3" stroke-dasharray="8 5"/>`;
    body += label(x - 16, at(goal) + 5, "▶", 14, PALETTE.coral, "end");
  }
  return svg(
    VESSEL.width,
    VESSEL.height,
    body,
    aria,
    `data-level="${toString(level)}" data-cap="${cap}"`,
  );
}

// A number-line strip from lo to hi (integers) with a tick at every 1/marks, a marker at `marker` (a fraction) and
// optional named points (`points`: [{ value: number, text, color }]), e.g. an irrational constant.
export function stripSvg({
  lo,
  hi,
  marks,
  marker,
  start = null,
  points = [],
  label: aria,
  goal = null,
}) {
  const { x0, x1, y } = STRIP;
  const at = (value) => r3(x0 + ((value - lo) / (hi - lo)) * (x1 - x0));
  let body = line(x0, y, x1, y, PALETTE.ink, 4);
  const total = (hi - lo) * marks;
  const labelEvery = marks <= 4 ? 1 : 0;
  for (let i = 0; i <= total; i += 1) {
    const value = lo + i / marks;
    const whole = i % marks === 0;
    body += line(
      at(value),
      y - (whole ? 16 : 9),
      at(value),
      y + (whole ? 16 : 9),
      PALETTE.ink,
      whole ? 3 : 2,
    );
    if (whole) body += label(at(value), y + 40, String(Math.round(value)), 19, PALETTE.ink);
    else if (labelEvery)
      body += label(
        at(value),
        y + 40,
        toMixedString(frac(lo * marks + i, marks)),
        16,
        PALETTE.muted,
      );
  }
  if (start)
    body += `<line class="fk-start" x1="${at(toNumber(start))}" y1="${y - 26}" x2="${at(toNumber(start))}" y2="${y + 4}" stroke="${PALETTE.muted}" stroke-width="3" stroke-dasharray="4 4"/>`;
  if (goal)
    body += `<line class="fk-goal" x1="${at(toNumber(goal))}" y1="${y - 40}" x2="${at(toNumber(goal))}" y2="${y + 20}" stroke="${PALETTE.coral}" stroke-width="3" stroke-dasharray="6 4"/>`;
  for (const point of points) {
    body += `<line class="fk-point" x1="${at(point.value)}" y1="${y - 44}" x2="${at(point.value)}" y2="${y + 22}" stroke="${point.color || PALETTE.coral}" stroke-width="3"/>`;
    body += label(at(point.value), y - 50, point.text, 15, point.color || PALETTE.coral);
  }
  const mx = at(toNumber(marker));
  body += `<line class="fk-marker-line" x1="${mx}" y1="${y - 30}" x2="${mx}" y2="${y}" stroke="${PALETTE.violet}" stroke-width="5" stroke-linecap="round"/>`;
  body += `<circle class="fk-marker" cx="${mx}" cy="${y - 34}" r="10" fill="${PALETTE.violet}" stroke="${PALETTE.ink}" stroke-width="2"/>`;
  return svg(
    STRIP.width,
    STRIP.height,
    body,
    aria,
    `data-marker="${toString(marker)}" data-lo="${lo}" data-hi="${hi}"`,
  );
}

// `count` small cups in rows, each holding one serving of `size` (a fraction of a cup, drawn to scale of a 1-cup cup).
export function servingsSvg({ count, size, per = 6, label: aria }) {
  const cell = 74;
  const cupH = 56;
  const rows = Math.max(1, Math.ceil(count / per));
  let body = "";
  for (let i = 0; i < count; i += 1) {
    const x = 8 + (i % per) * cell;
    const yTop = 6 + Math.floor(i / per) * (cupH + 26);
    const lift = r3(cupH * Math.min(1, toNumber(size)));
    body += `<rect class="fk-serving-fill" x="${x}" y="${yTop + cupH - lift}" width="46" height="${lift}" fill="${PALETTE.sky}" fill-opacity="0.55"/>`;
    body += `<rect class="fk-serving" x="${x}" y="${yTop}" width="46" height="${cupH}" fill="none" stroke="${PALETTE.ink}" stroke-width="3" rx="5"/>`;
    body += label(x + 23, yTop + cupH + 17, toString(size), 13, PALETTE.ink);
  }
  return svg(8 + per * cell, rows * (cupH + 26) + 10, body, aria);
}
