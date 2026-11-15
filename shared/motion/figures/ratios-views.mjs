// The other pictures of the ratio figures: the coordinate graph, the one-tape part/whole picture, labelled ratio rows and the chain of
// fraction tiles whose units cancel. Pure string output.
import { COLOR, COPY_FILLS } from "../tokens.mjs";
import { f1, GREY, inline, PAD, step, tall, tw, tx, wrap } from "./ratios-draw.mjs";

/** @typedef {import("./ratios-draw.mjs").Atom} Atom */

/** A friendly axis step so there are at most about 6 labels. @param {number} max */
function niceStep(max) {
  for (const s of [1, 2, 5, 10, 20, 25, 50, 100]) if (max / s <= 6) return s;
  return 100;
}

/**
 * The graph of a table: axes, the line, a small dot at each whole input, and a ring and label for each table row (revealed with its row).
 * @param {number} W @param {number} y
 * @param {{ X: number, Y: number, s: number, r: number, names: [string, string], rows: Array<{ x: number, y: number, step: number }>, labelAt: number[], wrong: null | { kind: "add" | "origin", x: number, y: number, step: number, r: number, c: number } }} spec
 */
export function graph(W, y, spec) {
  const left = 46;
  const right = 24;
  const top = 26;
  const H = 176;
  const px = (/** @type {number} */ v) => left + (v / spec.X) * (W - left - right);
  const py = (/** @type {number} */ v) => y + top + H - (v / spec.Y) * H;
  const ink = COLOR.ink;
  let svg = `<g>${tx(PAD, y + 14, spec.names[1], { size: 13, weight: 700, anchor: "start" })}`;
  const sy = niceStep(spec.Y);
  for (let v = 0; v <= spec.Y; v += sy) {
    svg += `<line x1="${left}" y1="${f1(py(v))}" x2="${f1(W - right)}" y2="${f1(py(v))}" stroke="${GREY}" stroke-width="0.6"/>${tx(left - 8, py(v) + 5, String(v), { size: 13, anchor: "end" })}`;
  }
  const sx = spec.X > 8 ? 2 : 1;
  for (let v = 0; v <= spec.X; v += sx) {
    svg += `<line x1="${f1(px(v))}" y1="${y + top}" x2="${f1(px(v))}" y2="${f1(py(0))}" stroke="${GREY}" stroke-width="0.6"/>${tx(px(v), py(0) + 18, String(v), { size: 13 })}`;
  }
  svg += `<line x1="${left}" y1="${y + top - 4}" x2="${left}" y2="${f1(py(0))}" stroke="${ink}" stroke-width="2"/><line x1="${left}" y1="${f1(py(0))}" x2="${W - right + 6}" y2="${f1(py(0))}" stroke="${ink}" stroke-width="2"/>`;
  svg += tx(px(spec.X / 2) + 10, py(0) + 38, spec.names[0], { size: 13, weight: 700 });
  const line = `<line x1="${f1(px(0))}" y1="${f1(py(spec.s))}" x2="${f1(px(spec.X))}" y2="${f1(py(spec.r * spec.X + spec.s))}" stroke="${COLOR.tealInk}" stroke-width="3"/>`;
  svg += line;
  for (let v = 0; v <= spec.X; v++) svg += `<circle cx="${f1(px(v))}" cy="${f1(py(spec.r * v + spec.s))}" r="3.5" fill="${COLOR.white}" stroke="${ink}" stroke-width="1.5"/>`;
  svg += "</g>";
  const lab = (/** @type {number} */ x, /** @type {number} */ yy, /** @type {string} */ t, /** @type {string} */ anchor, /** @type {string} */ fill = ink) => {
    const w = tw(t, 13, true);
    if (anchor === "end" && px(x) - 9 - w < left + 2) return "";
    const cx = anchor === "end" ? Math.max(PAD + w, px(x) - 9) : Math.min(W - PAD - w, px(x) + 9);
    return tx(cx, anchor === "end" ? py(yy) - 10 : Math.min(py(yy) + 18, py(0) - 5), t, { size: 13, weight: 700, anchor, fill, halo: true });
  };
  spec.rows.forEach((r, i) => {
    let g = `<circle cx="${f1(px(r.x))}" cy="${f1(py(r.y))}" r="7.5" fill="${COPY_FILLS[0]}" stroke="${ink}" stroke-width="2"/>`;
    if (spec.labelAt.includes(i)) g += lab(r.x, r.y, `(${r.x}, ${r.y})`, i === spec.labelAt[0] && spec.labelAt.length > 1 && spec.s === 0 ? "start" : "end");
    svg += step(r.step, g);
  });
  const w = spec.wrong;
  if (w) {
    let g = "";
    if (w.kind === "add") {
      g += `<line x1="${f1(px(0))}" y1="${f1(py(w.r - 1))}" x2="${f1(px(w.x))}" y2="${f1(py(w.y))}" stroke="${COLOR.error}" stroke-width="2.5" stroke-dasharray="6 4"/>`;
      g += `<circle cx="${f1(px(w.x))}" cy="${f1(py(w.y))}" r="7.5" fill="${COLOR.white}" stroke="${COLOR.error}" stroke-width="2.5" stroke-dasharray="3 2"/><path d="M${f1(px(w.x) - 4)} ${f1(py(w.y) - 4)} l8 8 M${f1(px(w.x) + 4)} ${f1(py(w.y) - 4)} l-8 8" stroke="${COLOR.error}" stroke-width="2" fill="none"/>`;
      g += lab(w.x, w.y, `(${w.x}, ${w.y})`, "start", COLOR.error);
    } else {
      g += `<line x1="${f1(px(0))}" y1="${f1(py(0))}" x2="${f1(px(w.x))}" y2="${f1(py(w.y))}" stroke="${COLOR.error}" stroke-width="2.5" stroke-dasharray="6 4"/>`;
      g += `<circle cx="${f1(px(0))}" cy="${f1(py(0))}" r="7" fill="${COLOR.white}" stroke="${COLOR.error}" stroke-width="2.5" stroke-dasharray="3 2"/>`;
    }
    svg += step(w.step, g);
  }
  return { svg, h: top + H + 46 };
}

/**
 * One tape of single boxes: solid teal for the first part, amber with a slash for the second, a bracket for the whole.
 * @param {number} W @param {number} y @param {number} a @param {number} b @param {string} wholeLabel @param {number} stepTape @param {number} stepWhole
 */
export function tape(W, y, a, b, wholeLabel, stepTape, stepWhole) {
  const n = a + b;
  const bw = Math.min(26, (W - 2 * PAD) / n);
  const x0 = (W - bw * n) / 2;
  let boxes = "";
  for (let i = 0; i < n; i++) {
    const x = x0 + i * bw;
    const juice = i < a;
    boxes += `<rect x="${f1(x + 0.75)}" y="${y + 6}" width="${f1(bw - 1.5)}" height="34" rx="3" fill="${COPY_FILLS[juice ? 0 : 1]}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
    if (!juice) boxes += `<line x1="${f1(x + 3)}" y1="${y + 36}" x2="${f1(x + bw - 3)}" y2="${y + 10}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
  }
  const by = y + 48;
  const bracket = `<path d="M${f1(x0 + 1)} ${by - 5} L${f1(x0 + 1)} ${by} L${f1(x0 + bw * n - 1)} ${by} L${f1(x0 + bw * n - 1)} ${by - 5}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/>${tx(W / 2, by + 20, wholeLabel, { size: 14, weight: 700 })}`;
  return { svg: step(stepTape, boxes) + step(stepWhole, bracket), h: 76 };
}
/** A legend swatch: the same fill and the slash for the second part. @param {number} x @param {number} y @param {boolean} second @param {string} label */
export function swatch(x, y, second, label) {
  let s = `<rect x="${f1(x)}" y="${y}" width="22" height="18" rx="3" fill="${COPY_FILLS[second ? 1 : 0]}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
  if (second) s += `<line x1="${f1(x + 3)}" y1="${y + 15}" x2="${f1(x + 19)}" y2="${y + 3}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
  return s + tx(x + 30, y + 14, label, { size: 14, weight: 700, anchor: "start" });
}

/**
 * Labelled ratio lines: a description on the left, the ratio on the right.
 * @param {number} x @param {number} y @param {number} w
 * @param {Array<{ desc: string, atoms: Atom[], step: number }>} items
 */
export function ratioRows(x, y, w, items) {
  let ry = y;
  let svg = "";
  for (const it of items) {
    const lines = wrap(it.desc, 14, w * 0.64 - 16, true);
    const h = Math.max(lines.length * 18 + 14, tall(it.atoms) ? 44 : 38);
    let g = `<rect x="${f1(x)}" y="${f1(ry)}" width="${f1(w)}" height="${h}" rx="6" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
    lines.forEach((l, i) => {
      g += tx(x + 10, ry + h / 2 - ((lines.length - 1) * 18) / 2 + i * 18 + 5, l, { size: 14, weight: 700, anchor: "start" });
    });
    g += inline(x + w * 0.64 + (w * 0.36) / 2, ry + h / 2, it.atoms, 17).svg;
    svg += step(it.step, g);
    ry += h + 8;
  }
  return { svg, h: ry - y - 8 };
}

/**
 * @typedef {{ top: string, topUnit: string, bot: string, botUnit: string, cancelTop?: boolean, cancelBot?: boolean, dashed?: boolean }} Tile
 * A tile: number and unit over a bar over number and unit. A cancelled unit carries a line through it as well as the words around the chain.
 * Returns the tile and, apart, the cancellation lines so the motion can draw them as their own step.
 * @param {number} x @param {number} cy @param {number} w @param {Tile} t @param {number} size
 */
function tile(x, cy, w, t, size) {
  const cx = x + w / 2;
  let cuts = "";
  const dash = t.dashed ? ` stroke-dasharray="5 3"` : "";
  let svg = `<rect x="${f1(x)}" y="${f1(cy - 27)}" width="${f1(w)}" height="54" rx="8" fill="${COLOR.white}" stroke="${t.dashed ? COLOR.error : COLOR.ink}" stroke-width="2"${dash}/>`;
  svg += `<line x1="${f1(x + 7)}" y1="${f1(cy)}" x2="${f1(x + w - 7)}" y2="${f1(cy)}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
  /** @param {string} n @param {string} u @param {number} by @param {boolean | undefined} cut */
  const half = (n, u, by, cut) => {
    const nw = tw(n, size, true);
    const uw = u ? tw(u, size, true) : 0;
    const total = nw + (u ? 5 + uw : 0);
    const sx = cx - total / 2;
    let s = tx(sx, by, n, { size, weight: 700, anchor: "start" });
    if (u) {
      s += tx(sx + nw + 5, by, u, { size, weight: 700, anchor: "start", fill: cut ? COLOR.muted : COLOR.ink });
      if (cut) cuts += `<line x1="${f1(sx + nw + 2)}" y1="${f1(by - 3)}" x2="${f1(sx + nw + 8 + uw)}" y2="${f1(by - 3)}" stroke="${COLOR.error}" stroke-width="2.5"/>`;
    }
    return s;
  };
  svg += half(t.top, t.topUnit, cy - 8, t.cancelTop) + half(t.bot, t.botUnit, cy + 19, t.cancelBot);
  return { svg, cuts };
}

/**
 * The conversion chain: tile × tile = tile. Returns the parts as three step groups so the motion can reveal them in order.
 * @param {number} W @param {number} y
 * @param {{ tiles: [Tile, Tile, Tile], steps: [number, number], ops: [string, string] }} spec
 */
export function chain(W, y, spec) {
  let size = 14;
  const avail = W - 2 * PAD;
  const widths = () => spec.tiles.map((t) => Math.max(tw(`${t.top} ${t.topUnit}`, size, true), tw(`${t.bot} ${t.botUnit}`, size, true)) + 18);
  let gap = 24;
  let ws = widths();
  if (ws.reduce((s, v) => s + v, 0) + 2 * gap > avail) {
    size = 13;
    gap = 18;
    ws = widths();
  }
  const total = ws.reduce((s, v) => s + v, 0) + 2 * gap;
  let x = (W - total) / 2;
  const cy = y + 32;
  const xs = ws.map((w) => {
    const px = x;
    x += w + gap;
    return px;
  });
  const op = (/** @type {number} */ i, /** @type {string} */ s) => tx(xs[i] + ws[i] + gap / 2, cy + 6, s, { size: 20, weight: 700 });
  const t0 = tile(xs[0], cy, ws[0], spec.tiles[0], size);
  const t1 = tile(xs[1], cy, ws[1], spec.tiles[1], size);
  const t2 = tile(xs[2], cy, ws[2], spec.tiles[2], size);
  const first = t0.svg + op(0, spec.ops[0]) + t1.svg;
  const second = t0.cuts + t1.cuts + op(1, spec.ops[1]) + t2.svg;
  return { first: step(spec.steps[0], first), second: step(spec.steps[1], second), h: 68 };
}

/**
 * The wrong way round: tile, ×, a dashed tile with the factor upside down. The units sit side by side, so nothing cancels.
 * @param {number} W @param {number} y @param {[Tile, Tile]} tiles @param {number} stepNo
 */
export function flipped(W, y, tiles, stepNo) {
  const size = 14;
  const ws = tiles.map((t) => Math.max(tw(`${t.top} ${t.topUnit}`, size, true), tw(`${t.bot} ${t.botUnit}`, size, true)) + 18);
  const total = ws[0] + ws[1] + 24 + 34;
  let x = (W - total) / 2;
  const cy = y + 32;
  const a = tile(x, cy, ws[0], tiles[0], size);
  x += ws[0] + 24;
  const b = tile(x, cy, ws[1], tiles[1], size);
  const mark = `<path d="M${f1(x + ws[1] + 10)} ${f1(cy - 8)} l14 14 M${f1(x + ws[1] + 24)} ${f1(cy - 8)} l-14 14" stroke="${COLOR.error}" stroke-width="3" fill="none"/>`;
  return { svg: step(stepNo, a.svg + tx(x - 12, cy + 6, "×", { size: 20, weight: 700 }) + b.svg + mark), h: 68 };
}
