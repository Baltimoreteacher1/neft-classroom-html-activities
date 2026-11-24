// Shared OOXML (.docx) helpers: XML escaping, runs, paragraphs, cells, tables, page sections, footers and the zip package.
// Used by the legacy unit packet (unit-packet.js) and the Language Studio renderer (studio-docx*.js).
// Pure Web-runtime code (Workers + Node 18+). Element order inside every *Pr follows the OOXML schema so Word never repairs the file.

import { zipStore } from "../../../assets/lib/zip-store.js";

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships";
const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Strip illegal XML 1.0 control characters (no regex control-char literals), keeping valid surrogate pairs. */
export function sanitizeXmlText(value) {
  const str = String(value ?? "");
  let out = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (
      code === 0x09 ||
      code === 0x0a ||
      code === 0x0d ||
      (code >= 0x20 && code <= 0xd7ff) ||
      (code >= 0xe000 && code <= 0xfffd)
    ) {
      out += str[i];
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += str[i] + str[i + 1];
        i++;
      }
    }
  }
  return out;
}

export function escapeXml(value) {
  return sanitizeXmlText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ---- runs --------------------------------------------------------------------------------------------
// opts: font, bold, italic, caps, color, spacing (twips), size (half-points), underline {val,color}|true,
//       border {val,sz,color,space}, shade (hex fill), rtl, rfonts (full w:rFonts attribute string)
export function wRun(text, opts = {}) {
  const p = [];
  const fonts = opts.font
    ? `<w:rFonts w:ascii="${opts.font}" w:hAnsi="${opts.font}" w:eastAsia="${opts.font}" w:cs="${opts.font}"/>`
    : "";
  if (fonts) p.push(fonts);
  if (opts.bold) p.push("<w:b/><w:bCs/>");
  if (opts.italic) p.push("<w:i/><w:iCs/>");
  if (opts.caps) p.push("<w:caps/>");
  if (opts.color) p.push(`<w:color w:val="${opts.color}"/>`);
  if (opts.spacing) p.push(`<w:spacing w:val="${opts.spacing}"/>`);
  if (opts.size) p.push(`<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>`);
  if (opts.underline) {
    const u = opts.underline === true ? {} : opts.underline;
    p.push(`<w:u w:val="${u.val || "single"}"${u.color ? ` w:color="${u.color}"` : ""}/>`);
  }
  if (opts.border) {
    const b = opts.border;
    p.push(
      `<w:bdr w:val="${b.val || "single"}" w:sz="${b.sz || 8}" w:space="${b.space ?? 0}" w:color="${b.color || "auto"}"/>`,
    );
  }
  if (opts.shade) p.push(`<w:shd w:val="clear" w:color="auto" w:fill="${opts.shade}"/>`);
  if (opts.rtl) p.push("<w:rtl/>");
  const rPr = p.length ? `<w:rPr>${p.join("")}</w:rPr>` : "";
  if (opts.tab) return `<w:r>${rPr}<w:tab/></w:r>`;
  if (opts.br) return `<w:r>${rPr}<w:br/></w:r>`;
  return `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

/** A field (PAGE, NUMPAGES) as begin/separate/end runs with a cached result, so every renderer keeps the run formatting. */
export function wField(instr, opts = {}, cached = "1") {
  const fc = (type) => {
    const run = wRun("", opts);
    return run.replace(/<w:t [^>]*><\/w:t>/, `<w:fldChar w:fldCharType="${type}"/>`);
  };
  const code = wRun("", opts).replace(
    /<w:t [^>]*><\/w:t>/,
    `<w:instrText xml:space="preserve"> ${instr} </w:instrText>`,
  );
  return `${fc("begin")}${code}${fc("separate")}${wRun(cached, opts)}${fc("end")}`;
}

// ---- paragraphs --------------------------------------------------------------------------------------
const pBorder = (side, b) =>
  `<w:${side} w:val="${b.val || "single"}" w:sz="${b.sz || 4}" w:space="${b.space ?? 0}" w:color="${b.color || "auto"}"/>`;

// opts: style, keepNext, keepLines, pageBreakBefore, rtl, align, shading, borders {top,bottom,left,right,between},
//       tabs [{val,pos,leader}], indentLeft, indentRight, hanging, spaceBefore, spaceAfter, line {val,rule}, markSize, sectPr
//       legacy flags: borderLeft, borderBottomDashed, boxBorder
export function wParagraph(runs, opts = {}) {
  const p = [];
  if (opts.style) p.push(`<w:pStyle w:val="${opts.style}"/>`);
  if (opts.keepNext) p.push("<w:keepNext/>");
  if (opts.keepLines) p.push("<w:keepLines/>");
  if (opts.pageBreakBefore) p.push("<w:pageBreakBefore/>");
  const b = { ...(opts.borders || {}) };
  if (opts.borderLeft) b.left = { sz: 18, space: 8, color: opts.borderLeft };
  if (opts.borderBottomDashed) b.bottom = { val: "dashed", sz: 10, space: 6, color: "64748B" };
  if (opts.boxBorder) {
    const o = opts.boxBorder;
    Object.assign(b, {
      top: { sz: 6, space: 4, color: o },
      left: { sz: 6, space: 6, color: o },
      bottom: { sz: 6, space: 4, color: o },
      right: { sz: 6, space: 6, color: o },
    });
  }
  const sides = ["top", "left", "bottom", "right", "between"].filter((s) => b[s]);
  if (sides.length) p.push(`<w:pBdr>${sides.map((s) => pBorder(s, b[s])).join("")}</w:pBdr>`);
  if (opts.shading) p.push(`<w:shd w:val="clear" w:color="auto" w:fill="${opts.shading}"/>`);
  if (opts.tabs?.length)
    p.push(
      `<w:tabs>${opts.tabs
        .map(
          (t) =>
            `<w:tab w:val="${t.val || "left"}"${t.leader ? ` w:leader="${t.leader}"` : ""} w:pos="${t.pos}"/>`,
        )
        .join("")}</w:tabs>`,
    );
  if (opts.rtl) p.push("<w:bidi/>");
  const hasSpacing =
    opts.spaceBefore !== undefined || opts.spaceAfter !== undefined || opts.line !== undefined;
  if (hasSpacing) {
    const line = opts.line || { val: 252, rule: "auto" };
    const before = opts.spaceBefore !== undefined ? ` w:before="${opts.spaceBefore}"` : "";
    const after = opts.spaceAfter !== undefined ? ` w:after="${opts.spaceAfter}"` : "";
    p.push(`<w:spacing${before}${after} w:line="${line.val}" w:lineRule="${line.rule}"/>`);
  }
  if (opts.indentLeft || opts.indentRight || opts.hanging) {
    const l = opts.indentLeft ? ` w:left="${opts.indentLeft}"` : "";
    const r = opts.indentRight ? ` w:right="${opts.indentRight}"` : "";
    const h = opts.hanging ? ` w:hanging="${opts.hanging}"` : "";
    p.push(`<w:ind${l}${r}${h}/>`);
  }
  if (opts.align) p.push(`<w:jc w:val="${opts.align}"/>`);
  if (opts.markSize)
    p.push(`<w:rPr><w:sz w:val="${opts.markSize}"/><w:szCs w:val="${opts.markSize}"/></w:rPr>`);
  if (opts.sectPr) p.push(opts.sectPr);
  const pPr = p.length ? `<w:pPr>${p.join("")}</w:pPr>` : "";
  // A string is plain text, unless it is already run xml (wRun output starts with "<w:").
  const content =
    typeof runs === "string"
      ? runs.startsWith("<w:")
        ? runs
        : wRun(runs, opts.runOpts)
      : (runs || []).join("");
  return `<w:p>${pPr}${content}</w:p>`;
}

/** An empty paragraph exactly `twips` tall: vertical gap between tables, and the mandatory last paragraph of a cell. */
export const wGap = (twips = 20, opts = {}) =>
  wParagraph([], {
    spaceBefore: 0,
    spaceAfter: 0,
    line: { val: Math.max(20, twips), rule: "exact" },
    markSize: 2,
    ...opts,
  });

/** Shrinks a trailing spacer paragraph to a hairline so block spacing at the end of a page cannot push a blank page. */
export function trimTail(bodyXml) {
  if (!bodyXml.endsWith("</w:p>")) return bodyXml;
  const start = Math.max(bodyXml.lastIndexOf("<w:p>"), bodyXml.lastIndexOf("<w:p "));
  const para = bodyXml.slice(start);
  if (para.includes("<w:r>") || !para.includes('w:lineRule="exact"')) return bodyXml;
  return (
    bodyXml.slice(0, start) +
    para.replace(/w:line="\d+" w:lineRule="exact"/, 'w:line="20" w:lineRule="exact"')
  );
}

/** Puts a section break on the last paragraph of `bodyXml` (adds a hairline paragraph when it ends in a table). */
export function withSectPr(bodyXml, sectPr) {
  if (!bodyXml.endsWith("</w:p>")) return bodyXml + wGap(20, { sectPr });
  const at = bodyXml.lastIndexOf("<w:p>");
  const at2 = bodyXml.lastIndexOf("<w:p ");
  const start = Math.max(at, at2);
  const para = bodyXml.slice(start);
  const tail = para.startsWith("<w:p>")
    ? para.includes("<w:pPr>")
      ? para.replace("</w:pPr>", `${sectPr}</w:pPr>`)
      : para.replace("<w:p>", `<w:p><w:pPr>${sectPr}</w:pPr>`)
    : para;
  return bodyXml.slice(0, start) + tail;
}

// ---- cells + tables ----------------------------------------------------------------------------------
const cellBorder = (side, b) =>
  b === "nil" || b === null
    ? `<w:${side} w:val="nil"/>`
    : `<w:${side} w:val="${b.val || "single"}" w:sz="${b.sz || 4}" w:space="0" w:color="${b.color || "auto"}"/>`;

// opts: widthDxa, fill, vAlign, span, borders {top,left,bottom,right}, margins {top,bottom,left,right}
export function wCell(paragraphs, opts = {}) {
  const { widthDxa, fill, vAlign = "top", span, borders } = opts;
  const m = { top: 90, bottom: 90, left: 130, right: 130, ...(opts.margins || {}) };
  const p = [];
  if (widthDxa) p.push(`<w:tcW w:w="${widthDxa}" w:type="dxa"/>`);
  if (span > 1) p.push(`<w:gridSpan w:val="${span}"/>`);
  if (borders) {
    const sides = ["top", "left", "bottom", "right"].filter((s) => borders[s] !== undefined);
    if (sides.length)
      p.push(`<w:tcBorders>${sides.map((s) => cellBorder(s, borders[s])).join("")}</w:tcBorders>`);
  }
  if (fill) p.push(`<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>`);
  p.push(
    `<w:tcMar><w:top w:w="${m.top}" w:type="dxa"/><w:left w:w="${m.left}" w:type="dxa"/><w:bottom w:w="${m.bottom}" w:type="dxa"/><w:right w:w="${m.right}" w:type="dxa"/></w:tcMar>`,
  );
  p.push(`<w:vAlign w:val="${vAlign}"/>`);
  const body = Array.isArray(paragraphs) ? paragraphs.join("") : paragraphs;
  return `<w:tc><w:tcPr>${p.join("")}</w:tcPr>${body}</w:tc>`;
}

/**
 * Generic fixed-layout table. rows: [{ cells: [tcXml], height?, rule?: "exact"|"atLeast", header?, cantSplit? }]
 * borders: { top,bottom,left,right,insideH,insideV } each {val,sz,color}. indent/jc position the table; spacing = cell spacing.
 */
export function wTbl({ widths, rows, borders, indent = 0, jc, spacing = 0 }) {
  const total = widths.reduce((a, b) => a + b, 0);
  const tblB = borders
    ? `<w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"]
        .filter((s) => borders[s])
        .map((s) => cellBorder(s, borders[s]))
        .join("")}</w:tblBorders>`
    : "";
  const tblPr = `<w:tblPr><w:tblW w:w="${total}" w:type="dxa"/>${jc ? `<w:jc w:val="${jc}"/>` : ""}${
    spacing ? `<w:tblCellSpacing w:w="${spacing}" w:type="dxa"/>` : ""
  }${indent ? `<w:tblInd w:w="${indent}" w:type="dxa"/>` : ""}${tblB}<w:tblLayout w:type="fixed"/><w:tblLook w:val="0000"/></w:tblPr>`;
  const grid = `<w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;
  const trs = rows.map((r) => {
    const pr = [];
    if (r.cantSplit !== false) pr.push("<w:cantSplit/>");
    if (r.height) pr.push(`<w:trHeight w:val="${r.height}" w:hRule="${r.rule || "atLeast"}"/>`);
    if (r.header) pr.push("<w:tblHeader/>");
    return `<w:tr>${pr.length ? `<w:trPr>${pr.join("")}</w:trPr>` : ""}${r.cells.join("")}</w:tr>`;
  });
  return `<w:tbl>${tblPr}${grid}${trs.join("")}</w:tbl>`;
}

// ---- sections, footers, package ---------------------------------------------------------------------
/** Section properties. layout: "portrait"|"landscape"; margins in twips; footer = relationship id name from docxPackage. */
export function wSectPr({
  layout = "portrait",
  margins,
  footer,
  header = 360,
  footerDist = 360,
  type,
}) {
  const land = layout === "landscape";
  const [pw, ph] = land ? [15840, 12240] : [12240, 15840];
  const m = { top: 864, right: 864, bottom: 936, left: 864, ...(margins || {}) };
  return `<w:sectPr>${footer ? `<w:footerReference w:type="default" r:id="${footerRelId(footer)}"/>` : ""}${
    type ? `<w:type w:val="${type}"/>` : ""
  }<w:pgSz w:w="${pw}" w:h="${ph}"${land ? ' w:orient="landscape"' : ""}/><w:pgMar w:top="${m.top}" w:right="${m.right}" w:bottom="${m.bottom}" w:left="${m.left}" w:header="${header}" w:footer="${footerDist}" w:gutter="0"/></w:sectPr>`;
}

export const footerRelId = (name) => `rId_${name}`;

export const wFooter = (paragraphs) =>
  `${XML_HEAD}<w:ftr xmlns:w="${W_NS}" xmlns:r="${R_NS}">${paragraphs}</w:ftr>`;

export const wDocument = (bodyXml) =>
  `${XML_HEAD}<w:document xmlns:w="${W_NS}" xmlns:r="${R_NS}"><w:body>${bodyXml}</w:body></w:document>`;

const SETTINGS_XML = `${XML_HEAD}<w:settings xmlns:w="${W_NS}"><w:defaultTabStop w:val="720"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;

/** Assemble the .docx zip. footers: { name: footerXml } become word/<name>.xml with relationship id footerRelId(name). */
export function docxPackage({ documentXml, stylesXml, footers = {}, title = "" }) {
  const names = Object.keys(footers);
  const types = `${XML_HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>${names
    .map(
      (n) =>
        `<Override PartName="/word/${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>`,
    )
    .join("")}</Types>`;
  const rootRels = `${XML_HEAD}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${R_NS}/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
  const docRels = `${XML_HEAD}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${R_NS}/styles" Target="styles.xml"/><Relationship Id="rId2" Type="${R_NS}/settings" Target="settings.xml"/>${names
    .map((n) => `<Relationship Id="${footerRelId(n)}" Type="${R_NS}/footer" Target="${n}.xml"/>`)
    .join("")}</Relationships>`;
  const core = `${XML_HEAD}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${escapeXml(title)}</dc:title><dc:creator>The Language Page</dc:creator></cp:coreProperties>`;
  const files = {
    "[Content_Types].xml": types,
    "_rels/.rels": rootRels,
    "word/_rels/document.xml.rels": docRels,
    "word/document.xml": documentXml,
    "word/styles.xml": stylesXml,
    "word/settings.xml": SETTINGS_XML,
    "docProps/core.xml": core,
  };
  for (const n of names) files[`word/${n}.xml`] = footers[n];
  return zipStore(files);
}
