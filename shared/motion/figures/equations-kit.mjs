// Drawing and number helpers shared by the equations motion figures (balance, inequality, growth). Pure string output, no DOM.
import { COLOR } from "../tokens.mjs";

/** @typedef {string | { n: string, d: string }} Seg a piece of a line: plain text or a stacked fraction */

/**
 * A figure plus the two optional methods the Standard flow and Challenge read: `headline` is the one number the lesson asks for, as a
 * string shared/motion/exact.mjs parse() reads exactly; `wrong` is the common wrong move the figure draws as a dashed card (null when none).
 * @typedef {import("./mount.mjs").Figure & {
 *   headline: (model: any, lang: "en" | "es") => { label: string, value: string, approx?: boolean },
 *   wrong: (model: any, lang: "en" | "es") => null | { value: string, say: string },
 * }} EqFigure
 */

export const CHAR = 0.58; // average glyph width per font-size unit, with slack
export const MINUS = "−";

/** @param {unknown} s */
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c);
/** @param {number} n */
export const f1 = (n) => Math.round(n * 10) / 10;
/** @param {string} lang @param {string} en @param {string} es */
export const pick = (lang, en, es) => (lang === "es" ? es : en);
/** @param {string} s @param {number} size @param {number} [weight] */
export const textW = (s, size, weight = 400) => {
  const spaces = s.split(" ").length - 1;
  return (s.length - spaces) * size * (weight >= 600 ? 0.6 : 0.55) + spaces * size * 0.3;
};

/**
 * A text element. Fill and weight go through attributes only.
 * @param {number} x @param {number} y @param {string} body
 * @param {{ size?: number, weight?: number, anchor?: string, fill?: string, cls?: string }} [o]
 */
export function text(x, y, body, o = {}) {
  const { size = 14, weight = 400, anchor = "middle", fill = COLOR.ink, cls = "" } = o;
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}"${cls ? ` class="${cls}"` : ""}>${esc(body)}</text>`;
}

/** Greedy word wrap on character count. @param {string} s @param {number} maxCh */
export function wrap(s, maxCh) {
  /** @type {string[]} */
  const out = [];
  let cur = "";
  for (const w of s.split(" ")) {
    if (cur && `${cur} ${w}`.length > maxCh) {
      out.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) out.push(cur);
  return out;
}

/** Exact terminating decimal of a Rat (true minus), or null when it does not terminate. @param {import("../exact.mjs").Rat} r */
export function dec(r) {
  let d = r.d;
  let twos = 0;
  let fives = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    twos++;
  }
  while (d % 5n === 0n) {
    d /= 5n;
    fives++;
  }
  if (d !== 1n) return null;
  const k = Math.max(twos, fives);
  const scaled = (r.n * 10n ** BigInt(k)) / r.d;
  const neg = scaled < 0n;
  const digits = String(neg ? -scaled : scaled).padStart(k + 1, "0");
  const s = k === 0 ? digits : `${digits.slice(0, -k)}.${digits.slice(-k)}`;
  return (neg ? MINUS : "") + s;
}

/** A Rat as line segments: a decimal, or a stacked fraction. @param {import("../exact.mjs").Rat} r @returns {Seg[]} */
export function segs(r) {
  const s = dec(r);
  if (s !== null) return [s];
  return [...(r.n < 0n ? [MINUS] : []), { n: String(r.n < 0n ? -r.n : r.n), d: String(r.d) }];
}

/** Plain words for a Rat in running text ("36 over 7" for a fraction). @param {import("../exact.mjs").Rat} r @param {string} lang */
export function say(r, lang) {
  const s = dec(r);
  return s !== null ? s : `${r.n} ${pick(lang, "over", "sobre")} ${r.d}`;
}

/** @param {Seg[]} line */
export const hasFrac = (line) => line.some((s) => typeof s !== "string");

/**
 * One line made of text and at most one stacked fraction, placed at x on baseline y. The text before the fraction is anchored at its
 * left edge and the text after at its right edge, so a misjudged glyph width can shift a line but never overlap the fraction.
 * @param {number} x @param {number} y @param {Seg[]} parts
 * @param {{ size?: number, weight?: number, anchor?: string, fill?: string }} [o]
 */
export function rich(x, y, parts, o = {}) {
  const { size = 14, weight = 400, anchor = "middle", fill = COLOR.ink } = o;
  const fs = Math.max(13, size);
  const at = parts.findIndex((s) => typeof s !== "string");
  /** @param {Seg[]} list */
  const join = (list) => list.map((s) => (typeof s === "string" ? s : "")).join("");
  if (at < 0) {
    const body = join(parts).trim();
    return { svg: text(x, y, body, { size, weight, anchor, fill }), width: textW(body, size, weight) };
  }
  const frac = /** @type {{ n: string, d: string }} */ (parts[at]);
  if (parts.some((s, i) => i !== at && typeof s !== "string")) throw new RangeError("a line holds at most one fraction");
  const pre = join(parts.slice(0, at));
  const post = join(parts.slice(at + 1));
  const gap = size * 0.3;
  const wf = Math.max(frac.n.length, frac.d.length) * fs * 0.6 + 6;
  const wPre = pre.trim() ? textW(pre.trim(), size, weight) + (pre.endsWith(" ") ? gap : 0) : 0;
  const wPost = post.trim() ? textW(post.trim(), size, weight) + (post.startsWith(" ") ? gap : 0) : 0;
  const total = wPre + wf + wPost;
  const left = anchor === "middle" ? x - total / 2 : anchor === "end" ? x - total : x;
  const fx = left + wPre;
  const mid = fx + wf / 2;
  let svg = "";
  if (pre.trim()) svg += text(fx - (pre.endsWith(" ") ? gap : 0), y, pre.trim(), { size, weight, anchor: "end", fill });
  svg += text(mid, y - 8, frac.n, { size: fs, weight, fill });
  svg += `<line x1="${f1(fx + 1)}" y1="${f1(y - 5)}" x2="${f1(fx + wf - 1)}" y2="${f1(y - 5)}" stroke="${fill}" stroke-width="1.4"/>`;
  svg += text(mid, y + 10, frac.d, { size: fs, weight, fill });
  if (post.trim()) svg += text(fx + wf + (post.startsWith(" ") ? gap : 0), y, post.trim(), { size, weight, anchor: "start", fill });
  return { svg, width: total };
}

/**
 * Lines of prose from `y` down: strings wrap to `maxW`; segment lines (with fractions) stay whole.
 * @param {number} x @param {number} y first baseline @param {Array<string | Seg[]>} items
 * @param {{ size?: number, weight?: number, anchor?: string, fill?: string, maxW: number }} o
 * @returns {{ svg: string, y: number }} y is the baseline AFTER the last line
 */
export function para(x, y, items, o) {
  const { size = 14, maxW, ...rest } = o;
  const maxCh = Math.max(8, Math.floor(maxW / (size * CHAR)));
  let svg = "";
  let cy = y;
  for (const item of items) {
    if (typeof item === "string") {
      for (const line of wrap(item, maxCh)) {
        svg += text(x, cy, line, { size, ...rest });
        cy += size + 4;
      }
    } else {
      const frac = hasFrac(item);
      if (frac) cy += 9;
      svg += rich(x, cy, item, { size, ...rest }).svg;
      cy += frac ? 24 : size + 4;
    }
  }
  return { svg, y: cy };
}

/** A check mark whose left end is at (x, y). @param {number} x @param {number} y @param {string} [stroke] */
export const checkPath = (x, y, stroke = COLOR.success) => `<path d="M${f1(x)} ${f1(y)} l5 6 l10 -12" fill="none" stroke="${stroke}" stroke-width="3"/>`;
/** A cross whose top-left is (x, y). @param {number} x @param {number} y @param {string} [stroke] */
export const crossPath = (x, y, stroke = COLOR.error) => `<path d="M${f1(x)} ${f1(y)} l12 12 M${f1(x + 12)} ${f1(y)} l-12 12" stroke="${stroke}" stroke-width="3" fill="none"/>`;

/** Scene keyframes shared by the three figures. */
export const KF = {
  rise: [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }],
  fade: [{ opacity: 0 }, { opacity: 1 }],
  pop: [
    { opacity: 0, transform: "scale(0.85)", transformBox: "fill-box", transformOrigin: "center" },
    { opacity: 1, transform: "none", transformBox: "fill-box", transformOrigin: "center" },
  ],
};

/** @param {ParentNode} root @param {string} sel */
export const all = (root, sel) => [...root.querySelectorAll(sel)];

/** Check an integer setting is inside the lab's bounds. @param {unknown} v @param {number} lo @param {number} hi @param {string} name */
export function whole(v, lo, hi, name) {
  if (typeof v !== "number" || !Number.isInteger(v) || v < lo || v > hi) throw new RangeError(`${name} is a whole number from ${lo} to ${hi}.`);
  return v;
}
