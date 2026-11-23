// Package parts of a .docx: styles, numbering, header and footer, properties, content types and relationships.
// Kept apart from the block conversion in docx.js so each file stays small.
import { NS, XML_HEAD, field, para, run, xesc } from "./docx-xml.js";
import { HEX } from "./style.js";

export const REVIEW_LINE = "Teacher review recommended before classroom use.";
export const BRAND = "The Language Page";
const RID = { styles: "rIdStyles", numbering: "rIdNum", settings: "rIdSet", header: "rIdHead", footer: "rIdFoot" };
export const HEADER_RID = RID.header;
export const FOOTER_RID = RID.footer;

export const stylesXml = (c) => {
  const font = '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/>';
  const head = (id, name, lvl, pt, color) =>
    `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="120" w:after="60"/><w:outlineLvl w:val="${lvl}"/></w:pPr><w:rPr><w:b/><w:bCs/><w:color w:val="${color}"/><w:sz w:val="${Math.round(pt * 2)}"/><w:szCs w:val="${Math.round(pt * 2)}"/></w:rPr></w:style>`;
  const body = Math.round(c.st.bodyPt * 2);
  return (
    `${XML_HEAD}<w:styles xmlns:w="${NS.w}"><w:docDefaults><w:rPrDefault><w:rPr>${font}<w:sz w:val="${body}"/><w:szCs w:val="${body}"/><w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>` +
    `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>` +
    head("Heading1", "heading 1", 0, c.st.headPt, c.acc) +
    head("Heading2", "heading 2", 1, c.st.bodyPt * 1.2, c.acc) +
    head("Heading3", "heading 3", 2, c.st.bodyPt * 1.08, HEX.ink) +
    `<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:rPr><w:color w:val="${HEX.ink2}"/></w:rPr></w:style>` +
    `<w:style w:type="paragraph" w:styleId="Header"><w:name w:val="header"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0"/></w:pPr></w:style></w:styles>`
  );
};

const numberingXml = (c) => {
  const lvl = (fmt, text, font) =>
    `<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${text}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="540" w:hanging="360"/></w:pPr>${font ? `<w:rPr>${font}</w:rPr>` : ""}</w:lvl>`;
  const nums = c.nums
    .map(
      (id) =>
        `<w:num w:numId="${id}"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>`,
    )
    .join("");
  return `${XML_HEAD}<w:numbering xmlns:w="${NS.w}"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/>${lvl("bullet", "•", '<w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>')}</w:abstractNum><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="singleLevel"/>${lvl("decimal", "%1.")}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>${nums}</w:numbering>`;
};

function headerFooter(c) {
  const small = `<w:sz w:val="17"/><w:szCs w:val="17"/><w:color w:val="${HEX.ink2}"/>`;
  const f = (t, o = {}) => run(t, { pt: 8.5, color: o.color || HEX.ink2, b: o.b });
  const right = Math.round(c.tw);
  const header = `${XML_HEAD}<w:hdr xmlns:w="${NS.w}" xmlns:r="${NS.r}">${para(f(BRAND, { b: true, color: c.acc }) + `<w:r><w:tab/></w:r>${f(c.doc.meta.shortTitle || c.doc.title)}`, { style: "Header", tabs: [{ pos: right, val: "right" }], borders: { bottom: { sz: 6, color: HEX.control, space: 4 } } })}</w:hdr>`;
  const pg = field("PAGE", "1", { rpr: small });
  const total = field("NUMPAGES", "1", { rpr: small });
  const footer = `${XML_HEAD}<w:ftr xmlns:w="${NS.w}" xmlns:r="${NS.r}">${para(f(`${REVIEW_LINE} ${(c.doc.meta.sourceLine || "").replace(/^Teacher review recommended\.\s*/i, "")}`.trim()), { style: "Footer", borders: { top: { sz: 6, color: HEX.control, space: 4 } } })}${para(`${f("Page ")}${pg}${f(" of ")}${total}`, { style: "Footer", align: "right" })}</w:ftr>`;
  return { header, footer };
}

const coreXml = (c) =>
  `${XML_HEAD}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xesc(c.doc.title)}</dc:title><dc:subject>${xesc(`${c.doc.meta.subject} grade ${c.doc.meta.grade}`)}</dc:subject><dc:creator>${BRAND}</dc:creator><dc:description>${xesc(REVIEW_LINE)}</dc:description><dc:language>en-US</dc:language><dcterms:created xsi:type="dcterms:W3CDTF">2026-01-01T00:00:00Z</dcterms:created></cp:coreProperties>`;

/** Every part of the package as { path: xml | bytes }. `document` is the finished word/document.xml. */
export function packageParts(c, document) {
  const { header, footer } = headerFooter(c);
  const rel = (id, type, target) =>
    `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/>`;
  const imgRels = Object.keys(c.media)
    .map((n, i) => rel(`rIdImg${i + 1}`, "image", `media/${n}`))
    .join("");
  const rels = (inner) =>
    `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${inner}</Relationships>`;
  const types = `${XML_HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  const files = {
    "[Content_Types].xml": types,
    "_rels/.rels": rels(
      `${rel("rId1", "officeDocument", "word/document.xml")}<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>`,
    ),
    "docProps/core.xml": coreXml(c),
    "word/document.xml": document,
    "word/_rels/document.xml.rels": rels(
      rel(RID.styles, "styles", "styles.xml") +
        rel(RID.numbering, "numbering", "numbering.xml") +
        rel(RID.settings, "settings", "settings.xml") +
        rel(RID.header, "header", "header1.xml") +
        rel(RID.footer, "footer", "footer1.xml") +
        imgRels,
    ),
    "word/styles.xml": stylesXml(c),
    "word/numbering.xml": numberingXml(c),
    "word/settings.xml": `${XML_HEAD}<w:settings xmlns:w="${NS.w}"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:themeFontLang w:val="en-US"/></w:settings>`,
    "word/header1.xml": header,
    "word/footer1.xml": footer,
  };
  for (const [name, bytes] of Object.entries(c.media)) files[`word/media/${name}`] = bytes;
  return files;
}
