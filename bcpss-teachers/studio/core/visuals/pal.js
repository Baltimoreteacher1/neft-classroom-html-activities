// Visual kit foundations: palette tokens -> ds.css custom properties, escaping, number guards, text fitting.
// No DOM. Every colour is a ds.css token with a literal fallback (so a visual still draws outside the lab), or a
// plain hex when the caller asks for `resolved` output (print, PNG export), where CSS variables cannot resolve.

export class VisualError extends Error {
  constructor(message) {
    super(message);
    this.name = "VisualError";
  }
}

/** name -> [css custom property, fallback hex, tone]. tone says which text colour sits on the fill. */
export const TOKENS = {
  navy: ["--brand", "#1e3a5f", "dark"],
  teal: ["--teal", "#0f766e", "dark"],
  sage: ["--sage-500", "#5a9481", "light"],
  ochre: ["--accent", "#b45309", "dark"],
  coral: ["--coral", "#9a4a26", "dark"],
  rose: ["--rose-600", "#a24f72", "dark"],
  sky: ["--pearl-blue", "#d5dceb", "light"],
  ink: ["--ink", "#182230", "dark"],
  paper: ["--bg", "#faf9f6", "light"],
  line: ["--line-strong", "#cbd5e1", "light"],
  surface: ["--surface", "#ffffff", "light"],
  "ink-2": ["--ink-2", "#475467", "dark"],
  "teal-soft": ["--teal-soft", "#e1f2ef", "light"],
  "brand-soft": ["--brand-soft", "#e8eef6", "light"],
  "sage-soft": ["--sage-200", "#d0e3cd", "light"],
  "copper-soft": ["--copper-200", "#f5d6a8", "light"],
  listening: ["--listening", "#075568", "dark"],
  speaking: ["--speaking", "#8a3a5c", "dark"],
  reading: ["--reading", "#2e4a94", "dark"],
  writing: ["--writing", "#9a4a26", "dark"],
};
export const PALETTE_NAMES = Object.keys(TOKENS);
/** Default colour order for series (tape parts, bars, venn sets, cycle stages). Distinct in lightness as well as hue. */
export const SERIES = ["teal", "ochre", "navy", "rose", "sage", "coral"];

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const CSS_VAR = /^var\(--[a-z0-9-]+(?:,\s*#[0-9a-fA-F]{3,8})?\)$/;
const LIGHT_TEXT = ["--ivory", "#fffcf5"];
const DARK_TEXT = ["--mi-950", "#061626"];

export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/** Finite number or a clear error; never lets NaN/undefined reach the markup. */
export function num(v, what, fallback) {
  if (v == null && fallback !== undefined) return fallback;
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n))
    throw new VisualError(`${what} must be a finite number, got ${JSON.stringify(v)}`);
  return n;
}
/** Round for compact, deterministic markup. */
export const r1 = (n) => String(Math.round(n * 10) / 10);

function luminance(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Colour factory for one render. `resolved` swaps var() for the literal hex. */
export function makeColors(resolved = false) {
  const tok = (name) => {
    const [v, hex] = TOKENS[name];
    return resolved ? hex : `var(${v},${hex})`;
  };
  const paint = (value, fallbackName = "ink") => {
    if (value == null || value === "") return fallbackName === "none" ? "none" : tok(fallbackName);
    if (value === "none" || value === "transparent") return "none";
    if (value === "currentColor") return resolved ? TOKENS.ink[1] : "currentColor";
    if (TOKENS[value]) return tok(value);
    if (HEX.test(value)) return value;
    if (CSS_VAR.test(value))
      return resolved ? value.match(/#[0-9a-fA-F]{3,8}/)?.[0] || TOKENS.ink[1] : value;
    throw new VisualError(
      `unknown colour ${JSON.stringify(value)}; use a palette name (${PALETTE_NAMES.join(", ")}) or a #hex colour`,
    );
  };
  /** Text colour that stays readable on a fill. */
  const on = (fill) => {
    let dark;
    if (TOKENS[fill]) dark = TOKENS[fill][2] === "dark";
    else if (HEX.test(fill || "")) dark = luminance(fill) < 0.28;
    else dark = false;
    const [v, hex] = dark ? LIGHT_TEXT : DARK_TEXT;
    return resolved ? hex : `var(${v},${hex})`;
  };
  return { paint, on, tok, resolved };
}

/** Validate a spec-level palette override: an array of palette names that replaces SERIES. */
export function seriesOf(spec) {
  if (spec.palette == null) return SERIES;
  if (!Array.isArray(spec.palette) || !spec.palette.length)
    throw new VisualError("palette must be a non-empty array of palette names");
  for (const n of spec.palette)
    if (!TOKENS[n]) throw new VisualError(`palette: unknown token ${JSON.stringify(n)}`);
  return spec.palette;
}

/* ---------------------------------------------------------------- text */

const CHAR_W = 0.56;
export const textWidth = (str, size, weight = 400) =>
  String(str).length * size * (weight >= 600 ? CHAR_W + 0.05 : CHAR_W);

/** Greedy word wrap to maxW; returns lines (long single words stay whole). */
export function wrapLines(str, maxW, size, weight = 400) {
  const words = String(str).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && textWidth(next, size, weight) > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

/** Shrink the font (down to `min`) and wrap (up to maxLines) so text fits a box; returns {lines, size}. */
export function fitText(str, maxW, { size = 16, min = 10, maxLines = 2, weight = 400 } = {}) {
  for (let s = size; s >= min; s -= 1) {
    const lines = wrapLines(str, maxW, s, weight);
    if (lines.length <= maxLines && lines.every((l) => textWidth(l, s, weight) <= maxW))
      return { lines, size: s };
  }
  const lines = wrapLines(str, maxW, min, weight).slice(0, maxLines);
  return { lines, size: min };
}

/**
 * SVG <text> for one or more lines, vertically centred on y.
 * opts: size, fill, anchor, weight, halo (colour string for a paint-order stroke), italic.
 */
export function textEl(
  x,
  y,
  lines,
  { size = 16, fill, anchor = "middle", weight = 400, halo, italic = false, lh = 1.2 } = {},
) {
  const ls = Array.isArray(lines) ? lines : [lines];
  const top = y - ((ls.length - 1) * size * lh) / 2;
  const attrs =
    ` text-anchor="${anchor}" font-size="${r1(size)}"${weight !== 400 ? ` font-weight="${weight}"` : ""}` +
    `${italic ? ' font-style="italic"' : ""} fill="${fill}"` +
    (halo
      ? ` stroke="${halo}" stroke-width="${r1(Math.max(3, size / 4))}" stroke-linejoin="round" paint-order="stroke"`
      : "");
  const spans = ls
    .map(
      (l, i) => `<tspan x="${r1(x)}" y="${r1(top + i * size * lh)}" dy=".35em">${esc(l)}</tspan>`,
    )
    .join("");
  return `<text${attrs}>${spans}</text>`;
}

/** Arrowhead polygon at (x,y) pointing along angle `a` (radians). */
export function arrowHead(x, y, a, size, fill) {
  const p = (da, d) => `${r1(x + Math.cos(a + da) * d)},${r1(y + Math.sin(a + da) * d)}`;
  return `<polygon points="${p(0, 0)} ${p(Math.PI - 0.45, size)} ${p(Math.PI + 0.45, size)}" fill="${fill}"/>`;
}

/** Straight arrow from (x1,y1) to (x2,y2) with a head. */
export function arrow(x1, y1, x2, y2, { stroke, sw = 3, head = 10, dash } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const bx = x2 - Math.cos(a) * head * 0.7;
  const by = y2 - Math.sin(a) * head * 0.7;
  return (
    `<path d="M${r1(x1)} ${r1(y1)}L${r1(bx)} ${r1(by)}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>` +
    arrowHead(x2, y2, a, head, stroke)
  );
}

/** Rounded rectangle with outline. */
export function box(x, y, w, h, { fill, stroke, sw = 2, rx = 8, dash } = {}) {
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
}
