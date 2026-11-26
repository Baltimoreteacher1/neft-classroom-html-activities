// Small building blocks for the Activity Studio Word export, on the `docx` package (the same one the repo's other
// Word builders use). Web-runtime only: no Node APIs, so it runs in Cloudflare Pages Functions and Node alike.

import {
  AlignmentType,
  BorderStyle,
  HeightRule,
  ImageRun,
  LineRuleType,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { mathRuns } from "../../../access-practice-lab/src/studio/core/math.js";
import { safeImageSrc } from "../../../access-practice-lab/src/studio/core/schema.js";

export const FONT = "Arial";
export const SYMBOL_FONT = "Segoe UI Symbol";
export const PT = (n) => Math.round(n * 2); // half-points
export const PAGE = { width: 12240, height: 15840, margin: 1080 };
export const TEXT_W = PAGE.width - PAGE.margin * 2; // 10080 twips = 7in
export const BUBBLE = "○";
export const BOX = "☐";
export const ARROW = "→";
export const FRAC_SLASH = "⁄";

const LIGHT = { style: BorderStyle.SINGLE, size: 6, color: "888888" };
const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
export const INK_BORDER = { style: BorderStyle.SINGLE, size: 10, color: "222222" };
export const allBorders = (b = LIGHT) => ({ top: b, bottom: b, left: b, right: b });
export const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE };

/** Runs for text with the studio math markup: real superscript and subscript runs, fractions as n⁄d. */
export function mathTextRuns(text, base = {}) {
  const size = base.size ?? PT(12);
  const mk = (t, extra = {}) => new TextRun({ text: t, font: FONT, size, ...base, ...extra });
  const grown = Math.round(size * 1.3); // Word shrinks super/subscripts to about 65%: keep them readable
  const out = [];
  const bold = (s) => {
    // **bold** inside plain text
    const parts = String(s).split(/\*\*(.+?)\*\*/g);
    parts.forEach((part, i) => {
      if (part) out.push(mk(part, i % 2 ? { bold: true } : {}));
    });
  };
  for (const r of mathRuns(text)) {
    if (r.t === "text") bold(r.v);
    else if (r.t === "sup") out.push(mk(r.v, { superScript: true, size: grown }));
    else if (r.t === "sub") out.push(mk(r.v, { subScript: true, size: grown }));
    else {
      out.push(mk(r.n, { superScript: true, size: grown }));
      out.push(mk(FRAC_SLASH));
      out.push(mk(r.d, { subScript: true, size: grown }));
    }
  }
  return out;
}

/** A paragraph from markup text. `opts` are Paragraph options; `run` is base run formatting. */
export function para(text, opts = {}, run = {}) {
  return new Paragraph({
    spacing: { after: 100, line: 276 },
    ...opts,
    children: mathTextRuns(text, run),
  });
}

/** A plain run with no markup processing (labels, glyphs). */
export const textRun = (text, extra = {}) =>
  new TextRun({ text, font: FONT, size: PT(12), ...extra });
export const glyphRun = (text, extra = {}) =>
  new TextRun({ text, font: SYMBOL_FONT, size: PT(15), ...extra });

/** A small bold label such as "Answer" or "Word bank". Never below 11pt. */
export const label = (text, extra = {}) =>
  new Paragraph({
    keepNext: true,
    spacing: { before: 60, after: 60 },
    children: [textRun(text, { bold: true, size: PT(11), ...extra })],
  });

/** A line the student writes on: leading underscores. */
export const underline = (n = 18) => "_".repeat(n);

/** An ordinary table with light borders. `rows` are arrays of cell specs: string | { children, span, shade }. */
export function table(rows, { widths, header = false, borders, minHeight, align } = {}) {
  const cols = widths?.length ?? Math.max(...rows.map((r) => r.length));
  const w = widths ?? Array.from({ length: cols }, () => Math.floor(TEXT_W / cols));
  const trs = rows.map(
    (cells, ri) =>
      new TableRow({
        cantSplit: true,
        tableHeader: header && ri === 0,
        height:
          minHeight && !(header && ri === 0)
            ? { value: minHeight, rule: HeightRule.ATLEAST }
            : undefined,
        children: cells.map((spec, ci) =>
          cellFrom(
            spec,
            w,
            ci,
            header && ri === 0,
            borders,
            align,
            rows.length <= 14 && ri < rows.length - 1,
          ),
        ),
      }),
  );
  return new Table({
    width: { size: w.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: w,
    rows: trs,
  });
}

function cellFrom(spec, widths, ci, isHead, borders, align, keep) {
  const s = typeof spec === "string" ? { text: spec } : spec;
  const span = s.span ?? 1;
  let width = 0;
  for (let k = 0; k < span; k++) width += widths[ci + k] ?? 0;
  const children = s.children ?? [
    para(
      s.text ?? "",
      { spacing: { after: 0, line: 264 }, alignment: s.align ?? align, keepNext: keep },
      isHead ? { bold: true } : (s.run ?? {}),
    ),
  ];
  return new TableCell({
    columnSpan: span > 1 ? span : undefined,
    width: { size: width, type: WidthType.DXA },
    borders: s.borders ?? borders ?? allBorders(),
    shading:
      isHead || s.shade ? { fill: s.shade ?? "E9ECEE", type: "clear", color: "auto" } : undefined,
    verticalAlign: s.valign ?? VerticalAlign.TOP,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: children.length ? children : [new Paragraph({ children: [] })],
  });
}

/** A one-cell bordered box of a given minimum height, with an optional small caption. */
export const box = (captionText, minHeight) =>
  table([[{ text: captionText || "", run: { size: PT(11), color: "444444" } }]], {
    widths: [TEXT_W],
    minHeight,
    borders: allBorders(INK_BORDER),
  });

/** N ruled writing lines as a one-column table (reliable in Word and LibreOffice). */
export function ruledLines(n, rowHeight = 520) {
  const line = { style: BorderStyle.SINGLE, size: 6, color: "666666" };
  const b = { top: NONE, left: NONE, right: NONE, bottom: line };
  return table(
    Array.from({ length: n }, () => [{ text: "", borders: b }]),
    { widths: [TEXT_W], minHeight: rowHeight, borders: b },
  );
}

/** Paragraph borders with clearance between frame and text. */
export const padBorders = (b = LIGHT) => ({
  top: { ...b, space: 4 },
  bottom: { ...b, space: 4 },
  left: { ...b, space: 6 },
  right: { ...b, space: 6 },
});

/** A paragraph in a box with breathing room: border space plus a small indent so the frame sits clear of the text. */
export const boxed = (text, opts = {}, run = {}) =>
  para(
    text,
    {
      border: padBorders(),
      indent: { left: 140, right: 140 },
      spacing: { before: 80, after: 200, line: 300 },
      ...opts,
    },
    run,
  );

/** Spacer paragraph. */
/** Vertical space between parts. Tagged so the document's trailing gaps can be dropped (see endParagraph). */
export const gap = (after = 160) =>
  Object.assign(new Paragraph({ spacing: { after, line: 120 }, children: [] }), { isGap: true });

/**
 * A Word document must end with a paragraph, even after a table. When the last table fills the page, an ordinary
 * paragraph is pushed onto a page of its own and the file prints a blank last page. This one is 1pt tall.
 */
export const endParagraph = () =>
  new Paragraph({
    spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT },
    children: [],
  });

// ── images (data: URLs only) ─────────────────────────────────────────────────

function decode(dataUrl) {
  const m = /^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  try {
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { type: m[1] === "jpeg" ? "jpg" : m[1], bytes };
  } catch {
    return null;
  }
}

function dimensions(type, b) {
  try {
    if (type === "png")
      return {
        w: (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19],
        h: (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23],
      };
    if (type === "gif") return { w: b[6] | (b[7] << 8), h: b[8] | (b[9] << 8) };
    if (type === "jpg") {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) return null;
        const marker = b[i + 1];
        const len = (b[i + 2] << 8) | b[i + 3];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
          return { h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8] };
        i += 2 + len;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * An inline image paragraph for a data: URL image, with alt text, or a visible placeholder line for same-site
 * paths and unsupported types. Returns { paragraph, embedded }.
 */
export function imageParagraph(
  image,
  { maxWidth = 380, maxHeight = 260, placeholder = "Picture not embedded" } = {},
) {
  const src = safeImageSrc(image?.src);
  const alt = String(image?.alt || "");
  const data = src.startsWith("data:") ? decode(src) : null;
  const dims = data ? dimensions(data.type, data.bytes) : null;
  if (!data || data.type === "webp" || !dims || dims.w < 1 || dims.h < 1) {
    return {
      embedded: false,
      paragraph: new Paragraph({
        spacing: { after: 120 },
        border: allBorders({ style: BorderStyle.DASHED, size: 6, color: "666666" }),
        children: [
          textRun(`[${placeholder}${alt ? `: ${alt}` : ""}]`, { italics: true, size: PT(11) }),
        ],
      }),
    };
  }
  const scale = Math.min(
    maxWidth / dims.w,
    maxHeight / dims.h,
    Math.max(1, 60 / Math.min(dims.w, dims.h)),
  );
  const w = Math.max(1, Math.round(dims.w * scale));
  const h = Math.max(1, Math.round(dims.h * scale));
  return {
    embedded: true,
    paragraph: new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new ImageRun({
          type: data.type,
          data: data.bytes,
          transformation: { width: w, height: h },
          altText: {
            name: "Activity picture",
            title: alt || "Picture",
            description: alt || "Picture",
          },
        }),
      ],
    }),
  };
}
