// Shared grammar for the "Picture it" engine (picture.mjs): text normalising, number parsing, the SVG shell and
// a few drawing helpers. Pure: string in, string out, no DOM, no clock, no randomness.
//
// Colour roles (never colour alone: each role also differs in outline or glyph):
//   ink      labels, axes, outlines                  var(--fs-ink)
//   accent   the givens we are looking at (fills)    var(--fs-accent) on var(--fs-soft)
//   unknown  DASHED amber outline + the glyph "?"    var(--fs-unknown)

import { esc, hash, n1 } from "../design/family/art/math-kit.mjs";

export { esc, n1 };

export const W = 360; // viewBox width
export const PAD = 16;

const INK = "var(--fs-ink,#1f2a44)";
const ACC = "var(--fs-accent,#0f766e)";
const UNK = "var(--fs-unknown,#b45309)";
const SOFT = "var(--fs-soft,#e6f2ef)";

/** One stylesheet for every picture; class names carry an fp- prefix so they cannot meet the page's own. */
export const STYLE = `.fp-t{font:600 14px system-ui,-apple-system,"Segoe UI",sans-serif;fill:${INK}}.fp-n{font-weight:700;font-size:15px}.fp-s{font-size:13px;font-weight:600}.fp-q{font-weight:800;font-size:18px;fill:${UNK}}.fp-ta{fill:${ACC}}.fp-ln{fill:none;stroke:${INK};stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.fp-gr{fill:none;stroke:${INK};stroke-opacity:.18;stroke-width:1}.fp-ax{fill:none;stroke:${INK};stroke-opacity:.7;stroke-width:1.5}.fp-dash{fill:none;stroke:${INK};stroke-opacity:.6;stroke-width:1.5;stroke-dasharray:4 4}.fp-p{fill:${SOFT};stroke:${ACC};stroke-width:2;stroke-linejoin:round}.fp-g{fill:none;stroke:${INK};stroke-width:2;stroke-linejoin:round}.fp-u{fill:none;stroke:${UNK};stroke-width:2;stroke-dasharray:5 4;stroke-linejoin:round}.fp-ul{fill:none;stroke:${UNK};stroke-width:2.5;stroke-dasharray:5 4;stroke-linecap:round}.fp-dot{fill:${ACC}}.fp-ink{fill:${INK}}.fp-ray{fill:none;stroke:${ACC};stroke-width:5;stroke-linecap:round}.fp-open{fill:${SOFT};stroke:${ACC};stroke-width:3}.fp-off{opacity:.38}`;

/** Pick the language half of an {en, es} pair. */
export const tr = (lang, en, es) => (lang === "es" ? es : en);

// ---------------------------------------------------------------- text

const SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
const TO_SUP = Object.fromEntries(Object.entries(SUP).map(([k, v]) => [v, k]));

/**
 * Normalise a stem for matching: U+2212 / U+2010 minus -> "-", superscripts -> "^n", "½" -> "1/2",
 * no-break spaces -> spaces. The en dash "–" is left alone because stems use it for ranges ("0–9").
 */
export function norm(stem) {
  return String(stem ?? "")
    .replace(/[−‐‑]/g, "-")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => `^${[...m].map((c) => SUP[c]).join("")}`)
    .replace(/(\d) ?½/g, "$1 1/2")
    .replace(/½/g, "1/2")
    .replace(/[   ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Typeset for display: "-" before a digit -> "−", "^n" -> superscript. */
export const show = (s) =>
  String(s)
    .replace(/\^(\d+)/g, (_, d) => [...d].map((c) => TO_SUP[c]).join(""))
    .replace(/(^|[^\w)])-(?=\d|\.\d)/g, "$1−");

// ---------------------------------------------------------------- numbers

/** A plain number token: thousands commas, decimals, optional leading minus. */
export const NUM = String.raw`-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|-?\.\d+`;

/** "1,344" -> 1344, "-2.5" -> -2.5; NaN when not a number. */
export const num = (s) => Number(String(s).replace(/,/g, ""));

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a, b) => (a / gcd(a, b)) * b;

/**
 * Parse "3/4", "2 1/2", "5", "0.75" into { n, d, v, text } with integer n/d where exact (decimals: d = 10^k).
 * Returns null for anything else.
 */
export function frac(s) {
  const t = String(s).trim();
  let m = t.match(/^(-)?(\d+) (\d+)\/(\d+)$/);
  if (m) {
    const w = +m[2];
    const a = +m[3];
    const b = +m[4];
    if (!b || a >= b) return null;
    const n = (w * b + a) * (m[1] ? -1 : 1);
    return { n, d: b, v: n / b, text: t, mixed: true };
  }
  m = t.match(/^(-)?(\d+)\/(\d+)$/);
  if (m) {
    const b = +m[3];
    if (!b) return null;
    const n = +m[2] * (m[1] ? -1 : 1);
    return { n, d: b, v: n / b, text: t };
  }
  m = t.match(/^-?\d+(\.\d+)?$/);
  if (m) {
    const k = m[1] ? m[1].length - 1 : 0;
    const d = 10 ** k;
    return { n: Math.round(num(t) * d), d, v: num(t), text: t, decimal: k > 0 };
  }
  return null;
}

/** Count how many times a regex (global) matches. */
export const count = (s, re) => (s.match(re) || []).length;

/** Short numeric label: at most 3 decimals, unicode minus. */
export function fmt(v) {
  const r = Math.round(v * 1000) / 1000;
  const s = String(Object.is(r, -0) ? 0 : r);
  return s.startsWith("-") ? `−${s.slice(1)}` : s;
}

// ---------------------------------------------------------------- drawing

export const textW = (s, size = 14) => Math.ceil(String(s).length * size * 0.58) + 4;

export function text(x, y, s, { anchor = "middle", cls = "fp-t", extra = "" } = {}) {
  if (s === "" || s === undefined || s === null) return "";
  return `<text class="${cls}" x="${n1(x)}" y="${n1(y)}" text-anchor="${anchor}"${extra}>${esc(s)}</text>`;
}

export const line = (x1, y1, x2, y2, cls = "fp-ln") =>
  `<line class="${cls}" x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}"/>`;

export const rect = (x, y, w, h, cls, rx = 4) =>
  `<rect class="${cls}" x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="${rx}"/>`;

export const dot = (x, y, r = 5, cls = "fp-dot") => `<circle class="${cls}" cx="${n1(x)}" cy="${n1(y)}" r="${r}"/>`;

/** Arrow head pointing right (dir=1) or left (dir=-1) at (x, y). */
export const arrow = (x, y, dir, cls = "fp-ink") =>
  `<polygon class="${cls}" points="${n1(x)},${n1(y)} ${n1(x - 9 * dir)},${n1(y - 5)} ${n1(x - 9 * dir)},${n1(y + 5)}"/>`;

/** A "?" in a dashed amber pill centred at (cx, cy). */
export function qPill(cx, cy, label = "?") {
  const w = Math.max(30, textW(label, 16) + 12);
  return `${rect(cx - w / 2, cy - 14, w, 26, "fp-u", 6)}${text(cx, cy + 5, label, { cls: "fp-t fp-q" })}`;
}

/** Keep a label of width w centred near cx inside the frame. */
export const clampX = (cx, w) => Math.max(PAD + w / 2, Math.min(W - PAD - w / 2, cx));

/** Square bracket over (dir=-1) or under (dir=1) the span [x1, x2] at y. */
export const bracket = (x1, x2, y, dir) =>
  `<path class="fp-ln" d="M${n1(x1)} ${n1(y)}v${6 * dir}H${n1(x2)}v${-6 * dir}"/>`;

/**
 * Build steps. A draw() leaves the FRAME untagged (step 1) and wraps the givens in S(2, ...) and the unknown in
 * S(3, ...) (S(4, ...) for a second given set). shell() turns them into <g data-build="n"> groups, numbered
 * consecutively from 1, so a "build it one piece at a time" control can reveal the picture in order.
 */
export const S = (n, ...parts) => {
  const body = parts.flat().join("");
  return body ? `<!--b${n}-->${body}<!--/b-->` : "";
};

/** Collect S()-tagged chunks into ordered <g data-build> groups; untagged drawing is step 1. */
export function buildSteps(body) {
  const groups = new Map([[1, ""]]);
  const rest = String(body).replace(/<!--b(\d)-->([\s\S]*?)<!--\/b-->/g, (_, n, chunk) => {
    groups.set(+n, (groups.get(+n) || "") + chunk);
    return "";
  });
  groups.set(1, rest + groups.get(1));
  return [...groups.keys()]
    .sort((a, b) => a - b)
    .filter((k) => groups.get(k))
    .map((k, i) => `<g data-build="${i + 1}">${groups.get(k)}</g>`)
    .join("");
}

/**
 * The one wrapper every picture uses: role=img, <title>, <desc>. Ids are "fp-<hash of kind+key>-<lang>-t/-d", so the
 * English and Spanish copies of one picture, and two pictures on one page, never share an id.
 */
export function shell({ kind, key, lang, title, desc, h, body }) {
  const id = `fp-${hash(`${kind}|${key}`)}-${lang}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="fs-picture fs-picture-${kind}" lang="${lang}" viewBox="0 0 ${W} ${n1(h)}" role="img" aria-labelledby="${id}-t ${id}-d"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc><style>${STYLE}</style>${buildSteps(body)}</svg>`;
}
