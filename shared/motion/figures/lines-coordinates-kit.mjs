// Shared helpers for the number-line and coordinate-plane motion figures: exact formatting (Rat, true minus), text fitting,
// a top-to-bottom flow layout, small markers, and the step scene every figure here uses. No DOM, no clock, no randomness.
import { Rat } from "../exact.mjs";
import { windows } from "../motion.mjs";
import { COLOR } from "../tokens.mjs";

export const PAD = 12;
export const MINUS = "−";

/** @param {unknown} s */
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c);
/** @param {number} n */
export const f1 = (n) => Math.round(n * 10) / 10;
/** Keep an expression on one line when text wraps. @param {string} s */
export const nb = (s) => s.replace(/ /g, " ");
/** @param {"en" | "es"} lang @param {string} en @param {string} es */
export const pick = (lang, en, es) => (lang === "es" ? es : en);
/** @param {number} w the requested width */
export const clampW = (w) => Math.max(300, Math.min(900, Math.round(w || 400)));

// ---- exact numbers -------------------------------------------------------------------------------------------------
/** A number-line reading: whole numbers and halves from -10 to 10. @param {unknown} v @param {string} name */
export function half(v, name) {
  if (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > 10 || !Number.isInteger(v * 2)) throw new RangeError(`${name}: use −10 to 10, in steps of 0.5`);
  return new Rat(BigInt(v * 2), 2n);
}
/** A whole number from -lim to lim. @param {unknown} v @param {string} name @param {number} [lim] */
export function whole(v, name, lim = 6) {
  if (typeof v !== "number" || !Number.isInteger(v) || Math.abs(v) > lim) throw new RangeError(`${name}: use a whole number from −${lim} to ${lim}`);
  return new Rat(BigInt(v));
}
/** @param {Rat} r */
export const neg = (r) => new Rat(-r.n, r.d);
/** @param {Rat} r */
export const abs = (r) => new Rat(r.n < 0n ? -r.n : r.n, r.d);
/** @param {Rat} r */
export const sgn = (r) => (r.n > 0n ? 1 : r.n < 0n ? -1 : 0);
/** @param {Rat} a @param {Rat} b */
export const cmp = (a, b) => sgn(a.sub(b));
/** Layout only (pixels), never displayed. @param {Rat} r */
export const num = (r) => Number(r.n) / Number(r.d);
/** @param {number} c -1, 0 or 1 */
export const sym = (c) => (c < 0 ? "<" : c > 0 ? ">" : "=");
/** Whole numbers and halves as decimals with a true minus: -5/2 -> "−2.5". @param {Rat} r */
export function fmt(r) {
  if (r.d !== 1n && r.d !== 2n) throw new RangeError("only whole numbers and halves");
  const n = r.n < 0n ? -r.n : r.n;
  return (r.n < 0n ? MINUS : "") + (r.d === 1n ? String(n) : `${n / 2n}.5`);
}
/** @param {Rat} x @param {Rat} y */
export const pair = (x, y) => `(${fmt(x)}, ${fmt(y)})`;
/** @param {Rat} r */
export const bars = (r) => `|${fmt(r)}|`;
/** @param {Rat} r */
const wrapNeg = (r) => (r.n < 0n ? `(${fmt(r)})` : fmt(r));
/** "2 − (−3)": a negative second number goes in brackets. @param {Rat} a @param {Rat} b */
export const minus = (a, b) => `${fmt(a)} ${MINUS} ${wrapNeg(b)}`;
/** @param {Rat} a @param {Rat} b */
export const plus = (a, b) => `${fmt(a)} + ${wrapNeg(b)}`;

/** @param {Rat} x @param {Rat} y @returns {"I" | "II" | "III" | "IV" | "x-axis" | "y-axis" | "origin"} */
export function quadrantOf(x, y) {
  const sx = sgn(x);
  const sy = sgn(y);
  if (!sx && !sy) return "origin";
  if (!sy) return "x-axis";
  if (!sx) return "y-axis";
  return sx > 0 ? (sy > 0 ? "I" : "IV") : sy > 0 ? "II" : "III";
}
/** @param {ReturnType<typeof quadrantOf>} q @param {"en" | "es"} lang */
export function quadrantWords(q, lang) {
  if (q === "origin") return pick(lang, "at the origin", "en el origen");
  if (q === "x-axis") return pick(lang, "on the x-axis", "sobre el eje x");
  if (q === "y-axis") return pick(lang, "on the y-axis", "sobre el eje y");
  return pick(lang, `quadrant ${q}`, `cuadrante ${q}`);
}

/**
 * The common wrong move when finding the gap between two coordinates: ADDING them (opposite signs) or adding their distances
 * from 0 (same side). Null when the move would give the right gap (a zero, or equal numbers).
 * @param {Rat} p @param {Rat} q
 */
export function wrongGap(p, q) {
  const right = abs(q.sub(p));
  const opposite = sgn(p) * sgn(q) < 0;
  const same = sgn(p) * sgn(q) > 0 && !p.eq(q);
  if (!opposite && !same) return null;
  const value = opposite ? p.add(q) : abs(p).add(abs(q));
  if (value.eq(right)) return null;
  return { expr: opposite ? plus(p, q) : `${bars(p)} + ${bars(q)}`, value };
}

// ---- text ----------------------------------------------------------------------------------------------------------
/** @param {string} s @param {number} size @param {number} weight */
export const tw = (s, size, weight = 400) => [...s].length * size * (weight >= 600 ? 0.62 : 0.57);

/** @param {number} x @param {number} y @param {string} s @param {{size?: number, weight?: number, anchor?: string, fill?: string, halo?: boolean}} [o] */
export function txt(x, y, s, o = {}) {
  const { size = 14, weight = 400, anchor = "middle", fill = COLOR.ink, halo = false } = o;
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}"${halo ? ` stroke="${COLOR.white}" stroke-width="3" stroke-linejoin="round" paint-order="stroke"` : ""}>${esc(s)}</text>`;
}

/** Greedy word wrap on ordinary spaces (non-breaking spaces stay together). @param {string} s @param {number} maxW @param {number} size @param {number} weight */
export function wrap(s, maxW, size = 14, weight = 400) {
  /** @type {string[]} */
  const lines = [];
  let cur = "";
  for (const w of s.split(" ")) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && tw(next, size, weight) > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** @param {number} n @param {string} svg */
export const step = (n, svg) => (svg ? `<g class="lc-step" data-step="${n}">${svg}</g>` : "");

/** Top-to-bottom layout: paragraphs and boxes advance `y`; each returns SVG, never writes it. */
export class Flow {
  /** @param {number} W */
  constructor(W) {
    this.W = W;
    this.y = PAD;
  }
  /** @param {string} s @param {{size?: number, weight?: number, fill?: string, anchor?: "start" | "middle", after?: number}} [o] */
  para(s, o = {}) {
    const { size = 14, weight = 400, fill = COLOR.ink, anchor = "start", after = 6 } = o;
    const lines = wrap(s, this.W - 2 * PAD, size, weight);
    const x = anchor === "middle" ? this.W / 2 : PAD;
    const lh = size + 4;
    let svg = "";
    lines.forEach((ln, i) => {
      svg += txt(x, this.y + size - 2 + i * lh, ln, { size, weight, fill, anchor });
    });
    this.y += lines.length * lh + after;
    return svg;
  }
  /** A right-answer box (solid, check) or a "not this" box (dashed, cross). @param {"ok" | "wrong"} kind @param {string} s */
  box(kind, s) {
    const ok = kind === "ok";
    const color = ok ? COLOR.success : COLOR.error;
    const x = PAD;
    const w = this.W - 2 * PAD;
    const lines = wrap(s, w - 48, 14, 700);
    const h = Math.max(38, lines.length * 18 + 16);
    const top = this.y;
    const cy = top + h / 2;
    const icon = ok ? `<path d="M${f1(x + 12)} ${f1(cy)} l5 6 l10 -12" fill="none" stroke="${color}" stroke-width="3"/>` : `<path d="M${f1(x + 12)} ${f1(cy - 7)} l14 14 M${f1(x + 26)} ${f1(cy - 7)} l-14 14" fill="none" stroke="${color}" stroke-width="3"/>`;
    let svg = `<rect x="${f1(x)}" y="${f1(top)}" width="${f1(w)}" height="${h}" rx="8" fill="none" stroke="${color}" stroke-width="2"${ok ? "" : ' stroke-dasharray="6 4"'}/>${icon}`;
    lines.forEach((ln, i) => {
      svg += txt(x + 40, top + (h - lines.length * 18) / 2 + 13 + i * 18, ln, { size: 14, weight: 700, anchor: "start" });
    });
    this.y += h + 8;
    return svg;
  }
}

// ---- markers -------------------------------------------------------------------------------------------------------
/** @param {"circle" | "diamond" | "square" | "ring"} shape @param {number} x @param {number} y @param {string} fill */
export function marker(shape, x, y, fill) {
  const sw = `stroke="${COLOR.ink}" stroke-width="1.6"`;
  const r = 6;
  if (shape === "diamond") return `<polygon points="${f1(x)},${f1(y - r - 2)} ${f1(x + r + 2)},${f1(y)} ${f1(x)},${f1(y + r + 2)} ${f1(x - r - 2)},${f1(y)}" fill="${fill}" ${sw}/>`;
  if (shape === "square") return `<rect x="${f1(x - r)}" y="${f1(y - r)}" width="${2 * r}" height="${2 * r}" fill="${fill}" ${sw}/>`;
  if (shape === "ring") return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r + 1}" fill="${COLOR.white}" ${sw}/>`;
  return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r + 1}" fill="${fill}" ${sw}/>`;
}

// ---- scene ---------------------------------------------------------------------------------------------------------
const rise = [
  { opacity: 0, transform: "translateY(8px)" },
  { opacity: 1, transform: "none" },
];
/** @param {number} dx @param {number} dy */
const slideFrames = (dx, dy) => [
  { opacity: 0.35, transform: `translate(${f1(dx)}px, ${f1(dy)}px)` },
  { opacity: 1, transform: "none" },
];
const pop = [
  { opacity: 0, transform: "scale(0.6)", transformBox: "fill-box", transformOrigin: "center" },
  { opacity: 1, transform: "none", transformBox: "fill-box", transformOrigin: "center" },
];

/**
 * Steps 1..count, each in its own window of the scene. In step n: plain elements rise; elements with data-from="dx,dy" slide
 * from that offset to where they are drawn; elements with data-seq="i" data-of="k" pop in one after another (counted steps).
 * Every first keyframe is the transient state and every last one is the drawn state.
 * @param {ParentNode} root @param {number} count @param {number} durationMs
 * @returns {{ durationMs: number, tracks: Array<import("../motion.mjs").Track & { els: Element[] }> }}
 */
export function stepScene(root, count, durationMs) {
  const slots = windows(count);
  /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
  const tracks = [];
  for (let i = 0; i < count; i++) {
    const { from, to } = slots[i];
    const len = to - from;
    const els = [...root.querySelectorAll(`[data-step="${i + 1}"]`)];
    const plain = els.filter((e) => !e.hasAttribute("data-from") && !e.hasAttribute("data-seq") && !e.hasAttribute("data-walk"));
    // a walker moves through two stops across data-span steps: data-walk="x1,y1,x2,y2" are offsets from where it is drawn
    for (const el of els.filter((e) => e.hasAttribute("data-walk"))) {
      const [x1, y1, x2, y2] = String(el.getAttribute("data-walk")).split(",").map(Number);
      const last = slots[Math.min(count, i + Number(el.getAttribute("data-span") || 1)) - 1];
      tracks.push({
        els: [el],
        from: from + len * 0.1,
        to: last.to - len * 0.05,
        keyframes: [
          { transform: `translate(${f1(x1)}px, ${f1(y1)}px)` },
          { offset: 0.5, transform: `translate(${f1(x2)}px, ${f1(y2)}px)` },
          { transform: "none" },
        ],
      });
    }
    if (plain.length) tracks.push({ els: plain, from, to: from + len * 0.45, keyframes: rise });
    for (const el of els.filter((e) => e.hasAttribute("data-from"))) {
      const [dx, dy] = String(el.getAttribute("data-from")).split(",").map(Number);
      tracks.push({ els: [el], from: from + len * 0.1, to: from + len * 0.85, keyframes: slideFrames(dx, dy) });
    }
    for (const el of els.filter((e) => e.hasAttribute("data-seq"))) {
      const k = Number(el.getAttribute("data-seq"));
      const of = Math.max(1, Number(el.getAttribute("data-of")));
      const a = from + len * (0.1 + (0.6 * k) / of);
      tracks.push({ els: [el], from: a, to: Math.min(to, a + len * 0.3), keyframes: pop });
    }
  }
  return { durationMs, tracks };
}
