// Shared drawing and number helpers for the geometry motion figures. Pure string output, no DOM.
// Every figure lays itself out from `width` with absolute coordinates (no transform attributes, because the scenes animate
// transforms and a CSS transform would replace an attribute one).
import { Rat, commas } from "../exact.mjs";
import { COLOR, COPY_FILLS } from "../tokens.mjs";
import { windows } from "../motion.mjs";

export const PAD = 14;
export const INNER = 10;
const CW = 0.58;
const CWB = 0.64;

/** @param {unknown} s */
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c);
export const f1 = (/** @type {number} */ n) => Math.round(n * 10) / 10;
/** @param {string} lang @param {string} en @param {string} es */
export const L = (lang, en, es) => (lang === "es" ? es : en);
/** Estimated text width in px. @param {string} s @param {number} [size] @param {boolean} [bold] */
export const textW = (s, size = 14, bold = false) => s.length * size * (bold ? CWB : CW);
export const R = (/** @type {number | bigint} */ n) => new Rat(BigInt(n));

/** Terminating decimal text of a Rat ("7.5", "1,234"); throws when it does not terminate within 4 places. @param {Rat} r */
export function dec(r) {
  for (let k = 0; k <= 4; k++) {
    const p = 10n ** BigInt(k);
    if (p % r.d === 0n) {
      const n = r.n * (p / r.d);
      const whole = n / p;
      const frac = String(n % p).padStart(k, "0").replace(/0+$/, "");
      return commas(whole) + (frac ? `.${frac}` : "");
    }
  }
  throw new RangeError("not a terminating decimal");
}

/** Floor square root of a bigint. @param {bigint} n */
export function isqrt(n) {
  if (n < 2n) return n;
  let x = BigInt(Math.floor(Math.sqrt(Number(n))));
  while (x * x > n) x--;
  while ((x + 1n) * (x + 1n) <= n) x++;
  return x;
}

/**
 * The square root of a non-negative rational as the picture prints it: exact when it terminates, otherwise rounded to the
 * nearest tenth (decided with integers only) and flagged approximate.
 * @param {Rat} r @returns {{ text: string, approx: boolean }}
 */
export function sqrtText(r) {
  const sn = isqrt(r.n);
  const sd = isqrt(r.d);
  if (sn * sn === r.n && sd * sd === r.d) {
    try {
      return { text: dec(new Rat(sn, sd)), approx: false };
    } catch {
      /* repeating decimal: fall through to the rounded form */
    }
  }
  const f = isqrt((100n * r.n) / r.d);
  const t = 400n * r.n >= (2n * f + 1n) ** 2n * r.d ? f + 1n : f;
  return { text: dec(new Rat(t, 10n)), approx: true };
}

/** @param {number} x @param {number} y @param {string} str @param {{ size?: number, weight?: number, anchor?: string, fill?: string, halo?: boolean, cls?: string }} [o] */
export function T(x, y, str, o = {}) {
  const { size = 14, weight = 400, anchor = "middle", fill = COLOR.ink, halo = false, cls = "" } = o;
  const h = halo ? ` stroke="${COLOR.white}" stroke-width="3.5" paint-order="stroke" stroke-linejoin="round"` : "";
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}"${h}${cls ? ` class="${cls}"` : ""}>${esc(str)}</text>`;
}

/** Break a string at spaces into lines that fit maxW px (and 70 characters); an operator stays with its two operands when it fits. @param {string} str @param {number} size @param {boolean} bold @param {number} maxW */
export function wrap(str, size, bold, maxW) {
  const raw = str.split(" ");
  /** @type {string[]} */
  const glued = [];
  for (let i = 0; i < raw.length; i++) {
    let w = raw[i];
    while (i + 2 < raw.length && /^[×÷+−=≈]$/.test(raw[i + 1])) {
      w += ` ${raw[i + 1]} ${raw[i + 2]}`;
      i += 2;
    }
    glued.push(w);
  }
  const words = glued.some((w) => textW(w, size, bold) > maxW || w.length > 70) ? raw : glued;
  /** @type {string[]} */
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && (textW(next, size, bold) > maxW || next.length > 70)) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * A wrapped paragraph whose first line's top is y. anchor "middle" centres on x, "start" starts at x, "end" ends at x.
 * @param {number} x @param {number} y @param {string} str @param {number} maxW
 * @param {{ size?: number, weight?: number, anchor?: string, fill?: string, halo?: boolean }} [o]
 */
export function P(x, y, str, maxW, o = {}) {
  const size = o.size ?? 14;
  const lines = wrap(str, size, (o.weight ?? 400) >= 700, maxW);
  const lh = size + 5;
  const svg = lines.map((s, i) => T(x, y + size + i * lh - 1, s, o)).join("");
  return { svg, h: lines.length * lh };
}

/** @param {number[][]} pts @param {{ fill?: string, fo?: number, stroke?: string, sw?: number, dash?: string, cls?: string, data?: string }} [o] */
export function poly(pts, o = {}) {
  const { fill = "none", fo, stroke = COLOR.ink, sw = 2, dash = "", cls = "", data = "" } = o;
  return `<polygon points="${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(" ")}" fill="${fill}"${fo !== undefined ? ` fill-opacity="${fo}"` : ""} stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linejoin="round"${cls ? ` class="${cls}"` : ""}${data ? ` ${data}` : ""}/>`;
}

/** @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 @param {{ stroke?: string, sw?: number, dash?: string }} [o] */
export function line(x1, y1, x2, y2, o = {}) {
  const { stroke = COLOR.ink, sw = 2, dash = "" } = o;
  return `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
}

/** Right-angle mark at (x, y): arms run along unit vectors (ux, uy) and (vx, vy). */
export function rightMark(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ ux, /** @type {number} */ uy, /** @type {number} */ vx, /** @type {number} */ vy, /** @type {number} */ m) {
  return `<polyline points="${f1(x + ux * m)},${f1(y + uy * m)} ${f1(x + (ux + vx) * m)},${f1(y + (uy + vy) * m)} ${f1(x + vx * m)},${f1(y + vy * m)}" fill="none" stroke="${COLOR.ink}" stroke-width="1.6"/>`;
}

export const FILL = { teal: COPY_FILLS[0], amber: COPY_FILLS[1], slate: COPY_FILLS[2], green: COPY_FILLS[3] };

/**
 * A step card: a white rounded box with a numbered header and the parts stacked inside it.
 * @param {number} x @param {number} y @param {number} w @param {number} num @param {string} title
 * @param {Array<(x: number, y: number, w: number) => { svg: string, h: number }>} parts
 */
export function card(x, y, w, num, title, parts) {
  const ix = x + INNER;
  const iw = w - 2 * INNER;
  const head = P(ix + 30, y + INNER, title, iw - 30, { size: 14, weight: 700, anchor: "start" });
  let cy = y + INNER + Math.max(24, head.h) + 6;
  let inner = "";
  for (const part of parts) {
    const r = part(ix, cy, iw);
    inner += r.svg;
    cy += r.h + 6;
  }
  const h = cy - y + INNER - 6;
  const badge = `<circle cx="${f1(ix + 11)}" cy="${f1(y + INNER + 11)}" r="11" fill="${COLOR.navy}"/>${T(ix + 11, y + INNER + 16, String(num), { weight: 700, fill: COLOR.white })}`;
  const box = `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="10" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
  return { svg: `<g class="gm-step" data-step="${num}">${box}${badge}${head.svg}${inner}</g>`, h };
}

/** Solid green box with a check: the right answer. @param {number} x @param {number} y @param {number} w @param {string} str @param {number} [step] */
export function answerBox(x, y, w, str, step = 0) {
  const t = P(x + 42, y + 10, str, w - 54, { size: 15, weight: 700, anchor: "start" });
  const h = Math.max(38, t.h + 20);
  const svg = `<g class="gm-final" data-step="${step}"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="8" fill="${COLOR.white}" stroke="${COLOR.success}" stroke-width="2"/><path d="M${f1(x + 14)} ${f1(y + h / 2)} l5 6 l10 -12" fill="none" stroke="${COLOR.success}" stroke-width="3"/>${t.svg}</g>`;
  return { svg, h };
}

/** Dashed red box with a cross: the common wrong move. @param {number} x @param {number} y @param {number} w @param {string} str @param {number} [step] */
export function notBox(x, y, w, str, step = 0) {
  const t = P(x + 42, y + 10, str, w - 54, { size: 14, weight: 700, anchor: "start" });
  const h = Math.max(38, t.h + 20);
  const cy = y + h / 2;
  const svg = `<g class="gm-final" data-step="${step}"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="8" fill="${COLOR.white}" stroke="${COLOR.error}" stroke-width="2" stroke-dasharray="6 4"/><path d="M${f1(x + 14)} ${f1(cy - 7)} l14 14 M${f1(x + 28)} ${f1(cy - 7)} l-14 14" stroke="${COLOR.error}" stroke-width="3" fill="none"/>${t.svg}</g>`;
  return { svg, h };
}

/** Stack the closing boxes under the cards. @param {number} x @param {number} y @param {number} w @param {Array<(x: number, y: number, w: number) => { svg: string, h: number }>} boxes */
export function stackBoxes(x, y, w, boxes) {
  let out = "";
  let cy = y;
  for (const b of boxes) {
    const r = b(x, cy, w);
    out += r.svg;
    cy += r.h + 8;
  }
  return { svg: out, bottom: cy - 8 };
}

/** The figure's outer width and inner card width. @param {number} width */
export function frameOf(width) {
  const W = Math.max(300, Math.round(width));
  return { W, x: PAD, w: W - 2 * PAD };
}

// ---- scenes ---------------------------------------------------------------------------------------------------------

/** @param {ParentNode} root @param {string} sel */
export const all = (root, sel) => [...root.querySelectorAll(sel)];
export const RISE = [
  { opacity: 0, transform: "translateY(8px)" },
  { opacity: 1, transform: "none" },
];
export const POP = [
  { opacity: 0, transform: "scale(0.6)", transformBox: "fill-box", transformOrigin: "center" },
  { opacity: 1, transform: "none", transformBox: "fill-box", transformOrigin: "center" },
];
export const FADE = [{ opacity: 0 }, { opacity: 1 }];

/** Keyframes that slide from (dx, dy) to rest. @param {number} dx @param {number} dy */
export const slideFrom = (dx, dy) => [{ transform: `translate(${f1(dx)}px, ${f1(dy)}px)` }, { transform: "none" }];

/** Keyframes that scale in from a hinge point (px) along an axis. @param {"X" | "Y"} axis @param {number} hx @param {number} hy */
export const unfoldFrom = (axis, hx, hy) => [
  { opacity: 0, transform: `scale${axis}(0)`, transformBox: "view-box", transformOrigin: `${f1(hx)}px ${f1(hy)}px` },
  { opacity: 1, transform: "none", transformBox: "view-box", transformOrigin: `${f1(hx)}px ${f1(hy)}px` },
];

/** Half turn about a point (px) back to rest. @param {number} px @param {number} py */
export const halfTurn = (px, py) => [
  { transform: "rotate(180deg)", transformBox: "view-box", transformOrigin: `${f1(px)}px ${f1(py)}px` },
  { transform: "none", transformBox: "view-box", transformOrigin: `${f1(px)}px ${f1(py)}px` },
];

/**
 * The common scene frame: each step card rises in its own window, the closing boxes arrive last, and `extra(windowOf)`
 * adds the piece-level motion inside a step's window.
 * @param {ParentNode} root @param {number} steps
 * @param {(w: (n: number) => { from: number, to: number }) => Array<any>} [extra]
 */
export function sceneOf(root, steps, extra) {
  const ws = windows(steps + 1);
  /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
  const tracks = [];
  for (let n = 1; n <= steps; n++) {
    const { from, to } = ws[n - 1];
    tracks.push({ els: all(root, `.gm-step[data-step="${n}"]`), from, to: from + (to - from) * 0.3, keyframes: RISE });
  }
  const last = ws[steps];
  tracks.push({ els: all(root, ".gm-final"), from: last.from, to: last.from + (last.to - last.from) * 0.8, keyframes: FADE });
  if (extra) for (const t of extra((n) => ws[n - 1])) if (t.els.length) tracks.push(t);
  return { durationMs: Math.max(2400, Math.min(8000, 1100 * (steps + 1))), tracks };
}

/** A sub-window of a step's window: fractions a..b of it. @param {{ from: number, to: number }} win @param {number} a @param {number} b */
export const sub = (win, a, b) => ({ from: win.from + (win.to - win.from) * a, to: win.from + (win.to - win.from) * b });

export const SQ = { en: "square units", es: "unidades cuadradas" };
export const CU = { en: "cubic units", es: "unidades cúbicas" };
