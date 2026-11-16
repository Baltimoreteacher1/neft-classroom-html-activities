// Drawing and motion primitives shared by the data figures: text that wraps to the width it is given, numbered step headers,
// "not this" and "this is it" boxes, a number line with stacked dots, and the box-and-whisker strip.
// Pure string output; every number a student reads comes from data-model.mjs.
import { COLOR } from "../tokens.mjs";
import { fmt } from "./data-model.mjs";

export const PAD = 14;
const CHAR = 0.58; // average glyph width per font-size unit, for fitting text; layouts leave slack for it

/** @param {unknown} s */
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c);
/** @param {number} n */
export const f1 = (n) => {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) ? 0 : r;
};

/** @typedef {{ size?: number, weight?: number, anchor?: string, fill?: string, cls?: string, halo?: boolean }} TextOpts */

/** One <text>; fill is always set. @param {number} x @param {number} y @param {string} s @param {TextOpts} [o] */
export function T(x, y, s, o = {}) {
  const { size = 14, weight = 400, anchor = "middle", fill = COLOR.ink, cls = "", halo = false } = o;
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}"${halo ? ` stroke="${COLOR.white}" stroke-width="4" stroke-linejoin="round" paint-order="stroke"` : ""}${cls ? ` class="${cls}"` : ""}>${esc(s)}</text>`;
}

/** Greedy word wrap to a pixel width; no line exceeds 78 characters. @param {string} s @param {number} size @param {number} maxW */
export function wrap(s, size, maxW) {
  const maxCh = Math.max(8, Math.min(78, Math.floor(maxW / (size * CHAR))));
  /** @type {string[]} */
  const lines = [];
  let cur = "";
  for (const w of s.split(" ")) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxCh && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  lines.push(cur);
  return lines;
}

/** Wrapped paragraph; y is the first baseline. @param {number} x @param {number} y @param {string} s @param {TextOpts & { maxW: number, lh?: number }} o */
export function para(x, y, s, o) {
  const size = o.size ?? 13;
  const lh = o.lh ?? Math.round(size * 1.35);
  const lines = wrap(s, size, o.maxW);
  return { svg: lines.map((ln, i) => T(x, y + i * lh, ln, { size, weight: o.weight ?? 400, anchor: o.anchor ?? "start", fill: o.fill ?? COLOR.muted })).join(""), h: lines.length * lh };
}

/** Numbered step header: navy badge plus a wrapped title. @param {number} W @param {number} y @param {number} n @param {string} title */
export function header(W, y, n, title) {
  const lines = wrap(title, 15, W - 2 * PAD - 30);
  const svg = `<circle cx="${PAD + 11}" cy="${f1(y + 12)}" r="11" fill="${COLOR.navy}"/>${T(PAD + 11, y + 17, String(n), { size: 14, weight: 700, fill: COLOR.white })}${lines.map((ln, i) => T(PAD + 30, y + 17 + i * 19, ln, { size: 15, weight: 700, anchor: "start" })).join("")}`;
  return { svg, h: Math.max(26, 8 + lines.length * 19) };
}

/** A step panel the scene can address. @param {number} n @param {string} inner */
export const step = (n, inner) => `<g class="dm-step" data-step="${n}">${inner}</g>`;

/**
 * A boxed sentence: dashed red box with a cross for "not this", solid green box with a check for "this is it".
 * @param {number} W @param {number} y @param {string} s @param {"not" | "yes"} kind @param {string} [cls]
 */
export function note(W, y, s, kind, cls = "dm-note") {
  const colour = kind === "not" ? COLOR.error : COLOR.success;
  const lines = wrap(s, 14, W - 2 * PAD - 44);
  const h = lines.length * 18 + 14;
  const mark = kind === "not" ? `<path d="M${PAD + 12} ${f1(y + h / 2 - 7)} l14 14 M${PAD + 26} ${f1(y + h / 2 - 7)} l-14 14" stroke="${colour}" stroke-width="3" fill="none"/>` : `<path d="M${PAD + 12} ${f1(y + h / 2)} l5 6 l10 -12" stroke="${colour}" stroke-width="3" fill="none"/>`;
  const box = `<rect x="${PAD}" y="${f1(y)}" width="${W - 2 * PAD}" height="${h}" rx="8" fill="none" stroke="${colour}" stroke-width="2"${kind === "not" ? ' stroke-dasharray="6 4"' : ""}/>`;
  const txt = lines.map((ln, i) => T(PAD + 40, y + 19 + i * 18, ln, { size: 14, weight: 700, anchor: "start" })).join("");
  return { svg: `<g class="${cls}">${box}${mark}${txt}</g>`, h: h + 8 };
}

// ---- scene primitives -------------------------------------------------------------------------------------------------

/** @param {ParentNode} root @param {string} s */
export const sel = (root, s) => [...root.querySelectorAll(s)];
/** @type {Keyframe[]} */
export const FADE = [{ opacity: 0 }, { opacity: 1 }];
/** @type {Keyframe[]} */
export const RISE = [
  { opacity: 0, transform: "translateY(8px)" },
  { opacity: 1, transform: "none" },
];
/** @type {Keyframe[]} */
export const POP = [
  { opacity: 0, transform: "scale(0.6)", transformBox: "fill-box", transformOrigin: "center" },
  { opacity: 1, transform: "none", transformBox: "fill-box", transformOrigin: "center" },
];
/** Start displaced by (dx, dy) and slide home. @param {number} dx @param {number} dy @param {number} [o0] */
export const SLIDE = (dx, dy, o0 = 1) => [
  { opacity: o0, transform: `translate(${f1(dx)}px, ${f1(dy)}px)` },
  { opacity: 1, transform: "none" },
];
/** Grow from nothing along x about `origin` ("center", "left center", "right center"). @param {string} origin */
export const GROW = (origin) => [
  { opacity: 0, transform: "scaleX(0)", transformBox: "fill-box", transformOrigin: origin },
  { opacity: 1, transform: "none", transformBox: "fill-box", transformOrigin: origin },
];
/** An element's data-dx / data-dy as numbers. @param {Element} el @param {string} a */
export const num = (el, a) => Number(el.getAttribute(a) || 0);

/**
 * Reveal `els` one after another between fractions from and to; each gets a window of `span` of its share.
 * @param {Array<import("../motion.mjs").Track & { els: Element[] }>} tracks
 * @param {Element[]} els @param {number} from @param {number} to @param {Keyframe[] | ((el: Element) => Keyframe[])} frames @param {number} [span]
 */
export function stagger(tracks, els, from, to, frames, span = 0.6) {
  const k = Math.max(1, els.length);
  const slot = (to - from) / k;
  els.forEach((el, i) => {
    const a = from + slot * i;
    tracks.push({ els: [el], from: a, to: Math.min(to, a + Math.max(slot * span * 1.6, 0.04)), keyframes: typeof frames === "function" ? frames(el) : frames });
  });
}

// ---- number line and dots ---------------------------------------------------------------------------------------------

/** Smallest tick step (1, 2, 5, 10, 20, 25) whose labels are at least 30px apart. @param {number} pxPerUnit */
const tickStepFor = (pxPerUnit) => [1, 2, 5, 10, 20, 25].find((s) => s * pxPerUnit >= 30) ?? 25;

/**
 * A number line from 0 to `hi` with one dot per value, equal or close values stacked so no two dots touch.
 * @param {{ W: number, y: number, xs: number[], hi: number, offset?: number, boundaries?: boolean, r?: number, top?: number, x0?: number, tickStep?: number, tickMax?: number }} o
 * xs: ascending values. offset: draw each value at v + offset (the middle of its unit cell). boundaries: dashed lines at multiples of 5.
 */
export function dotPlot(o) {
  const { W, y, xs, hi, offset = 0, boundaries = false, r = 6, top = 0 } = o;
  const x0 = o.x0 ?? PAD + 12;
  const x1 = W - PAD - 12;
  const sx = (/** @type {number} */ v) => x0 + (v / hi) * (x1 - x0);
  const pitch = 2 * r + 2;
  /** @type {Array<{ x: number, level: number }>} */
  const placed = [];
  for (const v of xs) {
    const x = sx(v + offset);
    let level = 0;
    while (placed.some((p) => p.level === level && Math.abs(p.x - x) < 2 * r + 1.5)) level++;
    placed.push({ x, level });
  }
  const levels = Math.max(1, ...placed.map((p) => p.level + 1));
  const axisY = y + top + levels * pitch + 6;
  let svg = "";
  if (boundaries) for (let v = 0; v <= hi; v += 5) svg += `<line x1="${f1(sx(v))}" y1="${f1(y + top)}" x2="${f1(sx(v))}" y2="${f1(axisY)}" stroke="${COLOR.muted}" stroke-width="1" stroke-dasharray="3 3"/>`;
  svg += `<line x1="${f1(x0)}" y1="${f1(axisY)}" x2="${f1(x1)}" y2="${f1(axisY)}" stroke="${COLOR.ink}" stroke-width="2"/>`;
  const stepV = o.tickStep ?? tickStepFor((x1 - x0) / hi);
  const last = o.tickMax ?? hi;
  for (let v = 0; v <= last; v += stepV) svg += `<line x1="${f1(sx(v + offset))}" y1="${f1(axisY)}" x2="${f1(sx(v + offset))}" y2="${f1(axisY + 6)}" stroke="${COLOR.ink}" stroke-width="1.5"/>${T(sx(v + offset), axisY + 21, String(v), { size: 13, fill: COLOR.muted })}`;
  const pts = placed.map((p, i) => ({ x: p.x, y: axisY - 3 - r - p.level * pitch, i }));
  const dots = pts.map((p) => `<g class="dm-dot" data-i="${p.i}"><circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${r}" fill="${COLOR.teal}" stroke="${COLOR.ink}" stroke-width="1.2"/></g>`).join("");
  return { svg: svg + dots, axisY, bottom: axisY + 28, dotTop: axisY - 3 - levels * pitch, x0, x1, sx, pts, r, levels };
}

/** A bracket under a span with a centred label; the label is kept inside the page. @param {number} W @param {number} xa @param {number} xb @param {number} y @param {string} label @param {string} [cls] */
export function bracket(W, xa, xb, y, label, cls = "dm-bracket") {
  const lw = label.length * 13 * CHAR + 4;
  const cx = Math.max(PAD + lw / 2, Math.min(W - PAD - lw / 2, (xa + xb) / 2));
  const line = `<path d="M${f1(xa)} ${f1(y - 6)} L${f1(xa)} ${f1(y)} L${f1(xb)} ${f1(y)} L${f1(xb)} ${f1(y - 6)}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/>`;
  return `<g class="${cls}">${line}${T(cx, y + 17, label, { size: 13, weight: 700 })}</g>`;
}

/** Marker for a mean: a pointing triangle with its tip on the line. @param {number} x @param {number} tipY @param {boolean} [ghost] */
export function meanTriangle(x, tipY, ghost = false) {
  const d = `M${f1(x)} ${f1(tipY)} L${f1(x - 8)} ${f1(tipY + 14)} L${f1(x + 8)} ${f1(tipY + 14)} Z`;
  return ghost ? `<path d="${d}" fill="none" stroke="${COLOR.ink}" stroke-width="1.8" stroke-dasharray="3 2.5"/>` : `<path d="${d}" fill="${COLOR.navy}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
}

/** @param {Record<string, string>} names @param {"en" | "es"} lang @param {string} k */
const nameOf = (names, lang, k) => (lang === "es" ? names[`${k}Es`] : names[k]);
const FIVE = { min: "Min", minEs: "Mínimo", q1: "Q1", q1Es: "Q1", median: "Median", medianEs: "Mediana", q3: "Q3", q3Es: "Q3", max: "Max", maxEs: "Máximo" };

/**
 * Box-and-whisker strip on a scale. Five groups (class dm-five, data-k 0..4: minimum, Q1, median, Q3, maximum) so a scene can reveal them in order.
 * @param {{ y: number, sx: (v: number) => number, nums: import("../exact.mjs").Rat[], cls?: string }} o cls: group class (dm-five is animated). nums: [min, q1, median, q3, max]
 */
export function boxStrip({ y, sx, nums, cls = "dm-five" }) {
  const [mn, q1, md, q3, mx] = nums.map((r) => Number(r.n) / Number(r.d));
  const mid = y + 19;
  const k = (/** @type {number} */ i, /** @type {string} */ inner) => `<g class="${cls}" data-k="${i}">${inner}</g>`;
  const ln = (/** @type {number} */ xa, /** @type {number} */ ya, /** @type {number} */ xb, /** @type {number} */ yb, /** @type {number} */ w) => `<line x1="${f1(xa)}" y1="${f1(ya)}" x2="${f1(xb)}" y2="${f1(yb)}" stroke="${COLOR.ink}" stroke-width="${w}"/>`;
  const bw = Math.max(2, sx(q3) - sx(q1));
  const svg =
    k(0, ln(sx(mn), mid - 10, sx(mn), mid + 10, 3)) +
    k(1, ln(sx(mn), mid, sx(q1), mid, 2) + ln(sx(q1), y + 4, sx(q1), y + 34, 2.5)) +
    k(2, ln(sx(md), y, sx(md), y + 38, 4)) +
    k(3, `<rect x="${f1(sx(q1))}" y="${y + 4}" width="${f1(bw)}" height="30" fill="${COLOR.teal}" fill-opacity="0.3" stroke="none"/>` + ln(sx(q3), y + 4, sx(q3), y + 34, 2.5) + ln(sx(q1), y + 4, sx(q3), y + 4, 2) + ln(sx(q1), y + 34, sx(q3), y + 34, 2)) +
    k(4, ln(sx(q3), mid, sx(mx), mid, 2) + ln(sx(mx), mid - 10, sx(mx), mid + 10, 3));
  return { svg, bottom: y + 40 };
}

/**
 * The five numbers in a row of labelled cells, each tied to its marker on the strip by a thin leader line.
 * @param {{ W: number, y: number, plotBottom: number, sx: (v: number) => number, nums: import("../exact.mjs").Rat[], lang: "en" | "es" }} o
 */
export function fiveTable({ W, y, plotBottom, sx, nums, lang }) {
  const cellW = (W - 2 * PAD) / 5;
  const keys = ["min", "q1", "median", "q3", "max"];
  let svg = "";
  nums.forEach((r, i) => {
    const cx = PAD + cellW * (i + 0.5);
    const px = sx(Number(r.n) / Number(r.d));
    svg += `<g class="dm-five" data-k="${i}"><line x1="${f1(px)}" y1="${f1(plotBottom)}" x2="${f1(cx)}" y2="${f1(y - 2)}" stroke="${COLOR.muted}" stroke-width="1" stroke-dasharray="2 2"/>${T(cx, y + 14, nameOf(FIVE, lang, keys[i]), { size: 13, fill: COLOR.muted })}${T(cx, y + 34, fmt(r), { size: 15, weight: 700 })}</g>`;
  });
  return { svg, bottom: y + 42 };
}
