// Shared plumbing for the procedural diagrams: validation helpers, the SVG frame, accessible colors and patterns,
// number formatting, text measurement. Pure functions, no DOM. Every diagram module builds on this file.

import { esc } from "../print/html.js";

export { esc };

/** Thrown for every input a diagram refuses. `code` is stable for tests and callers; `message` is for a teacher. */
export class DiagramError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = "DiagramError";
    this.code = code;
    Object.assign(this, extra);
  }
}
export const fail = (code, message, extra) => {
  throw new DiagramError(code, message, extra);
};

/** Size caps. Past these a figure stops being legible on a Letter page or a phone. */
export const CAPS = Object.freeze({
  categories: 40,
  points: 60,
  events: 24,
  dotValues: 60,
  histogramValues: 500,
  bins: 40,
  nodes: 24,
  edges: 60,
  parts: 12,
  denominator: 16,
  wholes: 4,
  title: 60,
  label: 40,
  axisSpan: 100,
});

// Every color below is at least 4.5:1 on white (checked in the tests). Light tints are only ever backgrounds for
// INK text and are listed in LIGHT so the tests can check them against ink instead.
export const COLOR = Object.freeze({
  ink: "#111827",
  muted: "#4b5563",
  grid: "#6b7280",
  blue: "#1d4ed8",
  orange: "#b45309",
  green: "#047857",
  red: "#b91c1c",
  teal: "#0f766e",
  white: "#ffffff",
});
export const LIGHT = Object.freeze({ faceTop: "#e5e7eb", faceSide: "#d1d5db" });
export const SERIES = Object.freeze([
  COLOR.blue,
  COLOR.orange,
  COLOR.green,
  COLOR.red,
  COLOR.teal,
  COLOR.ink,
]);

// ── contrast (WCAG 2.x) ──────────────────────────────────────────────────────

const channel = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
};
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ── language ─────────────────────────────────────────────────────────────────

export const langOf = (opts) => (opts?.lang === "es" ? "es" : "en");
/** `{en, es}` from one function of the language. */
export const both = (fn) => ({ en: fn("en"), es: fn("es") });

const MINUS = "−";
/** A number for a label: at most 6 decimals, a real minus sign, a decimal comma in Spanish. */
export function fmt(n, lang = "en") {
  const s = String(Number(Number(n).toFixed(6))).replace("-", MINUS);
  return lang === "es" ? s.replace(".", ",") : s;
}
export const round = (n, d = 2) => Number(Number(n).toFixed(d));
export const f1 = (n) => round(n, 1);

// ── validation helpers ───────────────────────────────────────────────────────

const CONTROL = /[\u0000-\u001f\u007f]/g;
/** Plain text: control characters removed, whitespace collapsed, trimmed. Escaped later by the renderer. */
export const cleanText = (v) =>
  String(v ?? "")
    .replace(CONTROL, " ")
    .replace(/\s+/g, " ")
    .trim();

export function textIn(v, name, { max = CAPS.label, required = true } = {}) {
  const s = cleanText(v);
  if (!s && required) fail("empty-text", `${name} is required.`);
  if (s.length > max)
    fail("text-too-long", `${name} is ${s.length} characters; the limit is ${max}.`);
  return s;
}
export function numberIn(v, name, { min = -1e9, max = 1e9 } = {}) {
  const n = typeof v === "string" && v.trim() === "" ? Number.NaN : Number(v);
  if (!Number.isFinite(n)) fail("not-a-number", `${name} must be a number.`);
  if (n < min || n > max) fail("out-of-range", `${name} must be between ${min} and ${max}.`);
  return n;
}
export function intIn(v, name, { min, max }) {
  const n = numberIn(v, name, { min, max });
  if (!Number.isInteger(n)) fail("not-an-integer", `${name} must be a whole number.`);
  return n;
}
export function listIn(v, name, { min = 1, max }) {
  if (!Array.isArray(v)) fail("not-a-list", `${name} must be a list.`);
  if (v.length < min) fail("too-few", `${name} needs at least ${min} item${min === 1 ? "" : "s"}.`);
  if (v.length > max) fail("too-many", `${name} has ${v.length} items; the limit is ${max}.`);
  return v;
}
export function rangeIn(v, name) {
  if (!Array.isArray(v) || v.length !== 2) fail("bad-range", `${name} must be [min, max].`);
  const [lo, hi] = v.map((x, i) => numberIn(x, `${name}[${i}]`, { min: -1e6, max: 1e6 }));
  if (hi <= lo) fail("bad-range", `${name} must have min below max.`);
  if (hi - lo > CAPS.axisSpan)
    fail("range-too-wide", `${name} spans ${hi - lo}; the limit is ${CAPS.axisSpan}.`);
  return [lo, hi];
}

// ── axis ticks derived from data ─────────────────────────────────────────────

/** A 1-2-5 step so that about `target` ticks cover `span`. */
export function niceStep(span, target = 6) {
  const raw = span / Math.max(1, target);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
}
/** Ticks at multiples of a nice step that cover [min, max]. Nothing is invented: only the scale is rounded out. */
export function axisTicks(min, max, { target = 6, integer = false } = {}) {
  let step = niceStep(max - min || 1, target);
  if (integer) step = Math.max(1, Math.round(step));
  const start = round(Math.floor(min / step + 1e-9) * step, 9);
  const end = round(Math.ceil(max / step - 1e-9) * step, 9);
  const ticks = [];
  for (let i = 0; start + i * step <= end + step * 1e-9; i++)
    ticks.push(round(start + i * step, 9));
  return { step, start, end, ticks };
}

// ── text measurement and wrapping (an estimate that errs wide) ───────────────

export const textWidth = (s, size = 14, bold = false) =>
  String(s).length * size * (bold ? 0.62 : 0.58);

/** Greedy word wrap by character count; words longer than `max` are split. */
export function wrap(text, max) {
  const lines = [];
  let line = "";
  for (let word of text.split(" ")) {
    while (word.length > max) {
      if (line) lines.push(line);
      lines.push(word.slice(0, max));
      line = "";
      word = word.slice(max);
    }
    if (!line) line = word;
    else if (line.length + 1 + word.length <= max) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ── SVG pieces ───────────────────────────────────────────────────────────────

export const FONT = "Helvetica, Arial, sans-serif";

export function text(
  x,
  y,
  s,
  { size = 14, anchor = "start", weight = "400", fill = COLOR.ink, halo = false, extra = "" } = {},
) {
  const h = halo ? ` stroke="${COLOR.white}" stroke-width="4" paint-order="stroke"` : "";
  return `<text x="${f1(x)}" y="${f1(y)}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}"${h}${extra}>${esc(s)}</text>`;
}
export const line = (
  x1,
  y1,
  x2,
  y2,
  { stroke = COLOR.ink, width = 1.5, dash = "", extra = "" } = {},
) =>
  `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ""}${extra}/>`;

/**
 * Fill patterns that stay distinguishable in grayscale. Index 0 is a solid dark fill; the rest are different
 * textures on white. `p` is a per-diagram id prefix so two figures on one page cannot collide.
 */
export function patternDefs(p) {
  const hatch = (id, color, body) =>
    `<pattern id="${p}-${id}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="${COLOR.white}"/>${body(color)}</pattern>`;
  return [
    `<pattern id="${p}-solid" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="${COLOR.blue}"/><line x1="0" y1="4" x2="8" y2="4" stroke="${COLOR.white}" stroke-width="1.2"/></pattern>`,
    hatch(
      "hatch",
      COLOR.orange,
      (c) => `<line x1="0" y1="0" x2="0" y2="8" stroke="${c}" stroke-width="3"/>`,
    ),
    `<pattern id="${p}-dots" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${COLOR.white}"/><circle cx="4" cy="4" r="2.4" fill="${COLOR.green}"/></pattern>`,
    `<pattern id="${p}-cross" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${COLOR.white}"/><path d="M0 0H8M0 0V8" stroke="${COLOR.red}" stroke-width="2"/></pattern>`,
    `<pattern id="${p}-vert" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${COLOR.white}"/><line x1="3" y1="0" x2="3" y2="6" stroke="${COLOR.teal}" stroke-width="2.4"/></pattern>`,
    `<pattern id="${p}-horiz" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${COLOR.white}"/><line x1="0" y1="3" x2="6" y2="3" stroke="${COLOR.ink}" stroke-width="2.4"/></pattern>`,
  ].join("");
}
export const PATTERNS = ["solid", "hatch", "dots", "cross", "vert", "horiz"];
export const patternFill = (p, i) => `url(#${p}-${PATTERNS[i % PATTERNS.length]})`;

/**
 * The standalone SVG: viewBox, role="img", <title> and <desc> from the alt text, white background. No scripts, no
 * external references, no foreignObject. (The xmlns attribute is the XML namespace, not a request.)
 */
export function frame({ p, w, h, title, desc, lang, defs = "", body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f1(w)} ${f1(h)}" width="${f1(w)}" height="${f1(h)}" role="img" aria-labelledby="${p}-t ${p}-d" lang="${lang}" font-family="${FONT}"><title id="${p}-t">${esc(title)}</title><desc id="${p}-d">${esc(desc)}</desc><defs>${defs}</defs><rect width="${f1(w)}" height="${f1(h)}" fill="${COLOR.white}"/>${body}</svg>`;
}

/** The result every diagram returns. `table` is the same information as plain rows, for a screen reader or paper. */
export const result = ({ svg, alt, caption, data, table }) => ({ svg, alt, caption, data, table });

export const isPositive = (n) => Number.isFinite(n) && n > 0;
