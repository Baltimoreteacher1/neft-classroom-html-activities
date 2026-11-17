// The lab's one Word (.docx) writer: WordprocessingML in a stored ZIP (assets/lib/zip-store.js), no dependencies, so a
// browser builds a real Word file. Two callers: the lesson kit (src/intro/tour/export-docx.js) and activity downloads
// (src/download/). All text is real paragraphs, tables and hyperlinks, so it edits normally in Word, Pages and Google
// Docs. Text is escaped and stripped of XML-illegal control characters here, once, for every caller.
import { zipStore } from "../../../assets/lib/zip-store.js";

export const esc = (s) =>
  String(s).replace(
    /[<>&"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c],
  );
// Control characters are illegal in XML 1.0.
export const clean = (s) =>
  String(s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");

export const NS =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

export const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="143361"/><w:sz w:val="40"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="100"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="143361"/><w:sz w:val="30"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style></w:styles>`;

/** Accumulates body XML and the hyperlinks it needs. */
export class Body {
  constructor() {
    this.xml = [];
    this.links = [];
  }
  run(text, { bold, italic, size, color, underline } = {}) {
    const rpr = `${bold ? "<w:b/>" : ""}${italic ? "<w:i/>" : ""}${color ? `<w:color w:val="${color}"/>` : ""}${size ? `<w:sz w:val="${size * 2}"/>` : ""}${underline ? '<w:u w:val="single"/>' : ""}`;
    return `<w:r>${rpr ? `<w:rPr>${rpr}</w:rPr>` : ""}<w:t xml:space="preserve">${esc(clean(text))}</w:t></w:r>`;
  }
  pPr({ style, indent, hanging, after, pageBreakBefore, shade, keepNext } = {}) {
    const ppr = `${style ? `<w:pStyle w:val="${style}"/>` : ""}${keepNext ? "<w:keepNext/>" : ""}${pageBreakBefore ? "<w:pageBreakBefore/>" : ""}${shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${shade}"/>` : ""}${after != null ? `<w:spacing w:after="${after}"/>` : ""}${indent ? `<w:ind w:left="${indent}"${hanging ? ` w:hanging="${hanging}"` : ""}/>` : ""}`;
    return ppr ? `<w:pPr>${ppr}</w:pPr>` : "";
  }
  para(
    text,
    { style, bold, italic, size, color, indent, hanging, after, pageBreakBefore, shade, keepNext } = {},
  ) {
    this.xml.push(
      `<w:p>${this.pPr({ style, indent, hanging, after, pageBreakBefore, shade, keepNext })}${this.run(text, { bold, italic, size, color })}</w:p>`,
    );
  }
  /** One paragraph of several runs: [[text, { bold, italic, size }], …]. */
  runs(parts, opts = {}) {
    this.xml.push(`<w:p>${this.pPr(opts)}${parts.map(([t, o]) => this.run(t, o)).join("")}</w:p>`);
  }
  heading(text, level = 1, pageBreakBefore = false) {
    this.para(text, { style: `Heading${level}`, pageBreakBefore });
  }
  bullet(text, box = false) {
    this.para(`${box ? "☐" : "•"}\t${text}`, { indent: 540, hanging: 270, after: 60 });
  }
  link(label, url) {
    const id = `rIdL${this.links.length + 1}`;
    this.links.push({ id, url });
    this.xml.push(
      `<w:p><w:hyperlink r:id="${id}" w:history="1"><w:r><w:rPr><w:color w:val="0B5BD3"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${esc(clean(label))}</w:t></w:r></w:hyperlink></w:p>`,
    );
  }
  /** A bordered table; `headers` (optional) is a bold first row. */
  table(rows, { headers = null, widths = null } = {}) {
    const all = headers ? [headers, ...rows] : rows;
    const cols = Math.max(1, ...all.map((r) => r.length));
    const width = 10080; // 7 in of a Letter page with 0.75 in margins, in twentieths of a point
    const w = widths || Array.from({ length: cols }, () => Math.floor(width / cols));
    const border =
      '<w:top w:val="single" w:sz="4" w:color="8A97A8"/><w:left w:val="single" w:sz="4" w:color="8A97A8"/><w:bottom w:val="single" w:sz="4" w:color="8A97A8"/><w:right w:val="single" w:sz="4" w:color="8A97A8"/><w:insideH w:val="single" w:sz="4" w:color="8A97A8"/><w:insideV w:val="single" w:sz="4" w:color="8A97A8"/>';
    const cell = (text, i, bold) =>
      `<w:tc><w:tcPr><w:tcW w:w="${w[i] || w[0]}" w:type="dxa"/></w:tcPr><w:p>${this.run(text, { bold })}</w:p></w:tc>`;
    const row = (r, bold) =>
      `<w:tr>${Array.from({ length: cols }, (_, i) => cell(r[i] ?? "", i, bold)).join("")}</w:tr>`;
    this.xml.push(
      `<w:tbl><w:tblPr><w:tblW w:w="${width}" w:type="dxa"/><w:tblBorders>${border}</w:tblBorders><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${w.map((x) => `<w:gridCol w:w="${x}"/>`).join("")}</w:tblGrid>${all.map((r, i) => row(r, headers && i === 0)).join("")}</w:tbl>`,
    );
    this.xml.push("<w:p/>"); // Word needs a paragraph between two tables
  }
}

/** The finished package as a .docx (Uint8Array). `title` (optional) goes in the file's properties. */
export function packDocx(b, { title = "", lang = "" } = {}) {
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${b.xml.join("")}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${b.links.map((l) => `<Relationship Id="${l.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${esc(l.url)}" TargetMode="External"/>`).join("")}</Relationships>`;
  const core = title
    ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(clean(title))}</dc:title>${lang ? `<dc:language>${esc(lang)}</dc:language>` : ""}</cp:coreProperties>`
    : "";
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>${core ? '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' : ""}</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>${core ? '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' : ""}</Relationships>`,
    "word/document.xml": doc,
    "word/styles.xml": STYLES,
    "word/_rels/document.xml.rels": rels,
  };
  if (core) files["docProps/core.xml"] = core;
  return zipStore(files);
}
