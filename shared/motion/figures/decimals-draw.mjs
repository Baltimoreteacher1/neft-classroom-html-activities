// Shared drawing and scene helpers for the decimals figures (receipt, columns, division). Pure strings, no DOM.
import { windows } from "../motion.mjs";
import { COLOR } from "../tokens.mjs";
import { Rat, commas } from "../exact.mjs";

export const PAD = 12;
const CHAR = 0.58; // average glyph width per font-size unit; layouts leave slack for it

/** @param {unknown} s */
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c);
/** @param {number} n */
export const f1 = (n) => Math.round(n * 10) / 10;
/** @param {string} lang @param {string} en @param {string} es */
export const pick = (lang, en, es) => (lang === "es" ? es : en);

/**
 * @param {number} x @param {number} y @param {string | number} body
 * @param {{ size?: number, weight?: number, anchor?: string, fill?: string, cls?: string, attrs?: string }} [o]
 */
export function text(x, y, body, o = {}) {
  const { size = 14, weight = 400, anchor = "middle", fill = COLOR.ink, cls = "", attrs = "" } = o;
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}"${cls ? ` class="${cls}"` : ""}${attrs ? ` ${attrs}` : ""}>${esc(body)}</text>`;
}

/** Greedy word wrap by estimated width. @param {string} str @param {number} maxPx @param {number} [size] @param {number} [weight] */
export function wrap(str, maxPx, size = 14, weight = 400) {
  const per = size * CHAR * (weight >= 700 ? 1.06 : 1);
  const max = Math.max(8, Math.floor(maxPx / per));
  /** @type {string[]} */
  const lines = [];
  let cur = "";
  for (const w of str.split(" ")) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * A wrapped paragraph; y is the first baseline.
 * @param {number} x @param {number} y @param {string} str
 * @param {{ maxPx: number, size?: number, weight?: number, anchor?: string, fill?: string, lineH?: number }} o
 */
export function para(x, y, str, o) {
  const { maxPx, size = 14, weight = 400, anchor = "start", fill = COLOR.ink, lineH = 18 } = o;
  const lines = wrap(str, maxPx, size, weight);
  const svg = lines.map((l, i) => text(x, y + i * lineH, l, { size, weight, anchor, fill })).join("");
  return { svg, height: lines.length * lineH, lines: lines.length };
}

/** Numbered panel heading. @param {number} y @param {number} n @param {string} title @param {number} W */
export function panelHead(y, n, title, W) {
  const p = para(PAD + 30, y + 17, title, { maxPx: W - 2 * PAD - 30, weight: 700 });
  const circle = `<circle cx="${PAD + 11}" cy="${f1(y + 12)}" r="11" fill="${COLOR.navy}"/>${text(PAD + 11, y + 17, n, { weight: 700, fill: COLOR.white })}`;
  return { svg: circle + p.svg, height: Math.max(28, p.height + 8) };
}

/** A solid box with a check: the answer. @param {number} y @param {number} W @param {string[]} lines */
export function okBox(y, W, lines) {
  const inner = W - 2 * PAD - 46;
  const wrapped = lines.flatMap((l) => wrap(l, inner, 15, 700));
  const h = wrapped.length * 19 + 16;
  const svg = `<rect x="${PAD}" y="${f1(y)}" width="${W - 2 * PAD}" height="${h}" rx="8" fill="none" stroke="${COLOR.success}" stroke-width="2"/><path d="M${PAD + 12} ${f1(y + h / 2)} l5 6 l10 -12" fill="none" stroke="${COLOR.success}" stroke-width="3"/>${wrapped.map((l, i) => text(PAD + 40, y + 24 + i * 19, l, { size: 15, weight: 700, anchor: "start" })).join("")}`;
  return { svg, height: h + 10 };
}

/** A dashed box with a cross: the "not this" line. @param {number} y @param {number} W @param {string[]} lines */
export function notBox(y, W, lines) {
  const inner = W - 2 * PAD - 46;
  const wrapped = lines.flatMap((l) => wrap(l, inner, 14, 700));
  const h = wrapped.length * 18 + 16;
  const svg = `<rect x="${PAD}" y="${f1(y)}" width="${W - 2 * PAD}" height="${h}" rx="8" fill="none" stroke="${COLOR.error}" stroke-width="2" stroke-dasharray="6 4"/><path d="M${PAD + 12} ${f1(y + h / 2 - 7)} l14 14 M${PAD + 26} ${f1(y + h / 2 - 7)} l-14 14" stroke="${COLOR.error}" stroke-width="3" fill="none"/>${wrapped.map((l, i) => text(PAD + 40, y + 23 + i * 18, l, { size: 14, weight: 700, anchor: "start" })).join("")}`;
  return { svg, height: h + 10 };
}

/** One panel group; `dm-base` children enter with the panel, `dm-anim` children one after another. @param {number} n @param {string} inner */
export const panel = (n, inner) => `<g class="dm-panel" data-panel="${n}">${inner}</g>`;
/** @param {string} inner */
export const base = (inner) => `<g class="dm-base">${inner}</g>`;
/** @param {number} i @param {string} inner */
export const anim = (i, inner) => `<g class="dm-anim" data-i="${i}">${inner}</g>`;

/** The scene shared by the three figures: panels in turn, their animated children one after another. @param {ParentNode} root */
export function panelScene(root) {
  const panels = [...root.querySelectorAll(".dm-panel")];
  const slots = windows(Math.max(1, panels.length));
  /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
  const tracks = [];
  const rise = [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }];
  panels.forEach((p, i) => {
    const { from, to } = slots[i];
    const len = to - from;
    const bases = [...p.querySelectorAll(":scope > .dm-base")];
    if (bases.length) tracks.push({ els: bases, from, to: from + len * 0.3, keyframes: rise });
    const items = [...p.querySelectorAll(".dm-anim")];
    items.forEach((el, j) => {
      const a = from + len * (0.25 + (0.5 * j) / Math.max(1, items.length));
      tracks.push({ els: [el], from: a, to: Math.min(to, a + len * 0.28), keyframes: rise });
    });
  });
  return { durationMs: Math.max(1800, Math.min(8500, 1100 * panels.length + 600)), tracks };
}

/** Exact decimal text of a non-negative or negative Rat, rounded half up to `dp` places, trailing zeros trimmed.
 * @param {Rat} r @param {number} dp @returns {{ text: string, exact: boolean }} */
export function decimalText(r, dp) {
  const neg = r.n < 0n;
  const n = neg ? -r.n : r.n;
  const scale = 10n ** BigInt(dp);
  const scaled = (2n * n * scale + r.d) / (2n * r.d);
  const exact = (n * scale) % r.d === 0n;
  const whole = scaled / scale;
  let frac = String(scaled % scale).padStart(dp, "0").replace(/0+$/, "");
  frac = frac ? `.${frac}` : "";
  const body = `${commas(whole)}${frac}`;
  return { text: neg && scaled !== 0n ? `−${body}` : body, exact };
}

/** Exact value of tenths or hundredths held as an integer. @param {number | bigint} n @param {number} places */
export const scaled = (n, places) => new Rat(BigInt(n), 10n ** BigInt(places));

/** The decimal places a plain written number needs: 46 -> 0, 46.8 -> 1, 46.85 -> 2 (input in hundredths). @param {number} c */
export const placesOf = (c) => (c % 100 === 0 ? 0 : c % 10 === 0 ? 1 : 2);

/** Hundredths as a fixed-point string with `dp` places (0, 1 or 2; the dropped places must be zero). @param {number} c @param {number} dp */
export function fixed(c, dp) {
  const s = String(Math.abs(c) % 100).padStart(2, "0").slice(0, dp);
  return `${c < 0 ? "−" : ""}${commas(Math.floor(Math.abs(c) / 100))}${dp ? `.${s}` : ""}`;
}
