// Language Studio Word renderer: colors, fonts, glyph icons and inline runs. Mirrors the .hl/.gap/.blank/.chip rules of studio-print-css.js.

import { wGap, wRun, wTbl } from "./docx-kit.js";
import { palette, TOKENS } from "./studio-doc.js";

export const FONT = {
  body: "Calibri",
  head: "Arial Rounded MT Bold",
  emoji: "Segoe UI Emoji",
  symbol: "Segoe UI Symbol",
};

export const hex = (c) =>
  String(c || "")
    .replace("#", "")
    .toUpperCase();

export const INK = hex(TOKENS.ink);
export const MUTED = hex(TOKENS.muted);
export const RULE = hex(TOKENS.rule);
export const WASH = hex(TOKENS.wash);
export const CUT = "7D8AA0";
export const HAND = "1D4FB5";
export const WRITE_LINE = "AAB4C4";

/** { ink, mid, bg } as 6-digit hex for any palette tone (domain, chunk, highlight, neutral). */
export function tone(name) {
  const p = palette(name);
  return {
    ink: hex(p.ink),
    mid: hex(p.mid),
    bg: hex(p.bg),
    highlight: Boolean(TOKENS.highlights[name]),
  };
}

/** Mixes a hex color toward white by `amount` (0..1): the band's translucent white pills. */
export function tint(color, amount) {
  const n = Number.parseInt(color, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(v + (255 - v) * amount)
      .toString(16)
      .padStart(2, "0"),
  );
  return ch.join("").toUpperCase();
}

// Text glyphs for the SVG icon set (studio-icons.js). Emoji render in Segoe UI Emoji / Apple Color Emoji in Word.
export const GLYPH = {
  ear: "\u{1F442}",
  speech: "\u{1F4AC}",
  book: "\u{1F4D6}",
  pencil: "✏️",
  abc: "\u{1F524}",
  game: "\u{1F3B2}",
  scissors: "✂",
  check: "✔",
  star: "★",
  people: "\u{1F465}",
  bulb: "\u{1F4A1}",
};

const PICTO = /(\p{Extended_Pictographic}️?(?:‍\p{Extended_Pictographic}️?)*)/u;

/** Base text size in points for a document (matches body / body.early / body.dense / body.fam in the print CSS). */
export function baseSize(doc) {
  if (doc.early) return 14;
  if (doc.dense) return 9.6;
  if (doc.bodyClass === "fam") return 10;
  return 11;
}

const hp = (pt) => Math.max(2, Math.round(pt * 2));
export const halfPts = hp;

/** One styled text run; any emoji inside gets the emoji font so it never falls back to a text face. */
export function textRuns(text, o = {}) {
  const parts = String(text ?? "").split(PICTO);
  return parts
    .filter((s) => s !== "")
    .map((s, k) => {
      const isEmoji = k % 2 === 1;
      return wRun(s, isEmoji ? { ...o, font: FONT.emoji, bold: false, italic: false } : o);
    })
    .join("");
}

const NB = "\u00A0";

/** Inline run list (studio-doc.js Run[]) -> w:r xml. o = { size (pt), color, font, bold, italic } defaults. */
export function runsXml(list, o = {}) {
  const size = o.size || 11;
  return (list || []).map((r) => oneRun(r, { ...o, size })).join("");
}

function oneRun(run, o) {
  const base = {
    font: o.font,
    bold: o.bold,
    italic: o.italic,
    color: o.color || INK,
    size: hp(o.size),
  };
  if (typeof run === "string") return textRuns(run, base);
  if (run.icon)
    return wRun(GLYPH[run.icon] || GLYPH.star, {
      ...base,
      font:
        run.icon === "star" || run.icon === "check" || run.icon === "scissors"
          ? FONT.symbol
          : FONT.emoji,
      size: hp(run.size ? run.size * 0.9 : o.size * 1.15),
    });
  if (run.badge !== undefined)
    return wRun(`${NB}${run.badge}${NB}`, {
      ...base,
      bold: true,
      color: "FFFFFF",
      shade: INK,
      size: hp(o.size * 0.85),
    });
  if (run.gap !== undefined) {
    if (run.gap === "…") return wRun("_".repeat(11), { ...base, color: INK });
    return wRun(`    ${run.gap}    `, {
      ...base,
      italic: true,
      color: MUTED,
      size: hp(o.size * 0.75),
      underline: { color: INK },
    });
  }
  if (run.blank !== undefined) {
    const tag = wRun(`${NB}${run.blank}${NB}`, {
      ...base,
      bold: true,
      color: "FFFFFF",
      shade: INK,
      size: hp(o.size * 0.7),
    });
    if (run.fill)
      return `${tag}${wRun(` ${run.fill} `, { ...base, bold: true, color: HAND, underline: { color: INK } })}`;
    return `${tag}${wRun(` ${"_".repeat(13)}`, { ...base, color: INK })}`;
  }
  let color = base.color;
  let size = base.size;
  const extra = {};
  if (run.small) {
    color = MUTED;
    size = hp(o.size * 0.86);
  }
  if (run.fill) {
    color = HAND;
    extra.bold = true;
  }
  if (run.hl) {
    const p = tone(run.hl);
    extra.shade = p.bg;
    if (!p.highlight) extra.underline = { val: "thick", color: p.mid };
  }
  return textRuns(run.t, {
    ...base,
    color,
    size,
    bold: run.b || extra.bold || base.bold,
    italic: run.i || base.italic,
    ...extra,
  });
}

/** Text of a run list with no formatting (alt text / tests). */
export const plain = (list) =>
  (list || []).map((r) => (typeof r === "string" ? r : (r.t ?? r.gap ?? r.fill ?? ""))).join("");

// ---- shared container helpers (context-aware widths, cell bodies)
export const innerW = (ctx) => ctx.w - 2 * (ctx.ind || 0);
/** Child blocks of a cell; a cell must end with a paragraph, so a trailing table gets a hairline one. */
export function cellBody(blocks, ctx) {
  const xml = ctx.blocks(blocks, ctx);
  return !xml || xml.endsWith("</w:tbl>") ? xml + wGap(20) : xml;
}

export const sub = (ctx, w, extra = {}) => ({
  ...ctx,
  w,
  ind: 0,
  tight: true,
  align: undefined,
  ...extra,
});
export const wrap = (ctx, rows, widths, opts = {}) =>
  wTbl({ widths, rows, indent: ctx.ind || 0, ...opts });
