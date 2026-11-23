// WordprocessingML primitives. Every string is escaped here; nothing else writes raw XML text.
export const NS = {
  w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  pic: "http://schemas.openxmlformats.org/drawingml/2006/picture",
};
export const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

// Characters XML 1.0 cannot carry are dropped; the rest are entity-escaped.
const BAD = /[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g;
export const xesc = (s) => String(s ?? "").replace(BAD, "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

const FONT = "Arial";
export const FONTS = `<w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}" w:eastAsia="${FONT}"/>`;

/** One run. Newlines become line breaks. size is in points. */
export function run(text, o = {}) {
  const pr = [
    o.style ? `<w:rStyle w:val="${o.style}"/>` : "",
    o.font === false ? "" : FONTS,
    o.b ? "<w:b/><w:bCs/>" : "",
    o.i ? "<w:i/><w:iCs/>" : "",
    o.outline ? "<w:outline/>" : "",
    o.color ? `<w:color w:val="${o.color}"/>` : "",
    o.pt ? `<w:sz w:val="${Math.round(o.pt * 2)}"/><w:szCs w:val="${Math.round(o.pt * 2)}"/>` : "",
    o.u ? '<w:u w:val="single"/>' : "",
  ].join("");
  const parts = String(text ?? "").split("\n");
  const body = parts.map((p, i) => `${i ? "<w:br/>" : ""}<w:t xml:space="preserve">${xesc(p)}</w:t>`).join("");
  return `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ""}${body}</w:r>`;
}

const border = (side, b) => (b ? `<w:${side} w:val="${b.val || "single"}" w:sz="${b.sz ?? 8}" w:space="${b.space ?? 1}" w:color="${b.color || "auto"}"/>` : "");

/**
 * One paragraph. o: style, align, before/after (twips), line (twips, exact), keepNext, pageBreakBefore,
 * indent {left, hanging}, num {id, lvl}, shade (hex), borders {top,bottom,left,right,between}, tabs [{pos, leader, val}].
 */
export function para(runs, o = {}) {
  const ppr = [
    o.style ? `<w:pStyle w:val="${o.style}"/>` : "",
    o.keepNext ? "<w:keepNext/>" : "",
    o.keepLines ? "<w:keepLines/>" : "",
    o.pageBreakBefore ? "<w:pageBreakBefore/>" : "",
    o.num ? `<w:numPr><w:ilvl w:val="${o.num.lvl || 0}"/><w:numId w:val="${o.num.id}"/></w:numPr>` : "",
    o.borders ? `<w:pBdr>${["top", "left", "bottom", "right", "between"].map((s) => border(s, o.borders[s])).join("")}</w:pBdr>` : "",
    o.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>` : "",
    o.tabs ? `<w:tabs>${o.tabs.map((t) => `<w:tab w:val="${t.val || "left"}"${t.leader ? ` w:leader="${t.leader}"` : ""} w:pos="${t.pos}"/>`).join("")}</w:tabs>` : "",
    o.before != null || o.after != null || o.line ? `<w:spacing${o.before != null ? ` w:before="${o.before}"` : ""}${o.after != null ? ` w:after="${o.after}"` : ""}${o.line ? ` w:line="${o.line}" w:lineRule="${o.lineRule || "exact"}"` : ""}/>` : "",
    o.indent ? `<w:ind${o.indent.left != null ? ` w:left="${o.indent.left}"` : ""}${o.indent.hanging != null ? ` w:hanging="${o.indent.hanging}"` : ""}/>` : "",
    o.align ? `<w:jc w:val="${o.align}"/>` : "",
  ].join("");
  return `<w:p>${ppr ? `<w:pPr>${ppr}</w:pPr>` : ""}${runs || ""}</w:p>`;
}

export const emptyPara = (o = {}) => para("", { ...o, line: o.line || 20, before: 0, after: 0 });

/** Table cell. o: w (twips), span, shade, borders {top,left,bottom,right}, vAlign, margins {top,bottom,left,right}. content = XML. */
export function cell(content, o = {}) {
  const tcpr = [
    `<w:tcW w:w="${o.w}" w:type="dxa"/>`,
    o.span > 1 ? `<w:gridSpan w:val="${o.span}"/>` : "",
    o.borders ? `<w:tcBorders>${["top", "left", "bottom", "right"].map((s) => border(s, o.borders[s])).join("")}</w:tcBorders>` : "",
    o.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>` : "",
    o.margins ? `<w:tcMar>${["top", "left", "bottom", "right"].map((s) => (o.margins[s] != null ? `<w:${s} w:w="${o.margins[s]}" w:type="dxa"/>` : "")).join("")}</w:tcMar>` : "",
    o.vAlign ? `<w:vAlign w:val="${o.vAlign}"/>` : "",
  ].join("");
  const body = content && /<w:p[ >]/.test(content.slice(-2000)) && content.trimEnd().endsWith("</w:p>") ? content : `${content || ""}${emptyPara()}`;
  return `<w:tc><w:tcPr>${tcpr}</w:tcPr>${body}</w:tc>`;
}

/** Table row. o: height (twips), rule "exact"|"atLeast", header (repeat), cantSplit. */
export const row = (cells, o = {}) =>
  `<w:tr><w:trPr>${o.cantSplit === false ? "" : "<w:cantSplit/>"}${o.height ? `<w:trHeight w:val="${o.height}" w:hRule="${o.rule || "atLeast"}"/>` : ""}${o.header ? "<w:tblHeader/>" : ""}</w:trPr>${cells.join("")}</w:tr>`;

/** Table. widths = grid column widths (twips). o.borders: "none" | "grid" | border map. */
export function table(rows, widths, o = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const b = o.borders === "none" ? "" : `<w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map((s) => border(s, o.borderSpec || { sz: 8, color: o.color || "475467", space: 0 })).join("")}</w:tblBorders>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/>${o.align ? `<w:jc w:val="${o.align}"/>` : ""}${b}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar>${o.caption ? `<w:tblCaption w:val="${xesc(o.caption)}"/>` : ""}</w:tblPr><w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${rows.join("")}</w:tbl>`;
}

/** Inline picture. emu sizes; rid is the relationship id. */
export function picture(rid, id, wEmu, hEmu, alt) {
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${wEmu}" cy="${hEmu}"/><wp:docPr id="${id}" name="Picture ${id}" descr="${xesc(alt)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="${NS.a}" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="${NS.a}"><a:graphicData uri="${NS.pic}"><pic:pic xmlns:pic="${NS.pic}"><pic:nvPicPr><pic:cNvPr id="${id}" name="Picture ${id}" descr="${xesc(alt)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${wEmu}" cy="${hEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}

/** Field (PAGE / NUMPAGES) with a cached value so viewers that do not recalculate still show a number. */
export const field = (instr, cached = "1", o = {}) =>
  `<w:r>${o.rpr ? `<w:rPr>${o.rpr}</w:rPr>` : ""}<w:fldChar w:fldCharType="begin"/></w:r><w:r>${o.rpr ? `<w:rPr>${o.rpr}</w:rPr>` : ""}<w:instrText xml:space="preserve"> ${instr} </w:instrText></w:r><w:r>${o.rpr ? `<w:rPr>${o.rpr}</w:rPr>` : ""}<w:fldChar w:fldCharType="separate"/></w:r><w:r>${o.rpr ? `<w:rPr>${o.rpr}</w:rPr>` : ""}<w:t>${cached}</w:t></w:r><w:r>${o.rpr ? `<w:rPr>${o.rpr}</w:rPr>` : ""}<w:fldChar w:fldCharType="end"/></w:r>`;

/** PNG width/height from the IHDR chunk, so a picture keeps its aspect ratio without decoding it. */
export function pngSize(bytes) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || sig.some((b, i) => bytes[i] !== b)) throw new Error("Not a PNG");
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { w: dv.getUint32(16), h: dv.getUint32(20) };
}
