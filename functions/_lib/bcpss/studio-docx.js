// Language Studio Word renderer: turns the neutral document model (studio-doc.js) into a .docx, the visual twin of studio-print-html.js.
// Entry point: renderStudioDocx(detail, { part, wida }) -> Uint8Array. Every part the HTML side supports works here too.

import {
  docxPackage,
  trimTail,
  wDocument,
  wField,
  wFooter,
  wGap,
  withSectPr,
  wParagraph,
  wRun,
  wSectPr,
} from "./docx-kit.js";
import { blocksXml } from "./studio-docx-blocks.js";
import { baseSize, FONT, INK, MUTED, RULE, textRuns } from "./studio-docx-runs.js";
import { buildStudioDocument } from "./studio-print-html.js";

const MARGINS = { top: 864, right: 864, bottom: 936, left: 864 };
const WIDTH = {
  portrait: 12240 - MARGINS.left - MARGINS.right,
  landscape: 15840 - MARGINS.left - MARGINS.right,
};
const FOOTERS = { portrait: "footerP", landscape: "footerL", bleed: "footerNone" };

const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

export function stylesXml() {
  const head = (id, name, size, before, after) =>
    `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="${before}" w:after="${after}"/><w:outlineLvl w:val="${id.slice(-1) - 1}"/></w:pPr><w:rPr><w:rFonts w:ascii="${FONT.head}" w:hAnsi="${FONT.head}"/><w:color w:val="${INK}"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr></w:style>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${FONT.body}" w:hAnsi="${FONT.body}" w:eastAsia="${FONT.body}" w:cs="${FONT.body}"/><w:color w:val="${INK}"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
${head("Heading1", "heading 1", 50, 0, 160)}${head("Heading2", "heading 2", 34, 240, 120)}${head("Heading3", "heading 3", 26, 180, 80)}
<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="99"/></w:style></w:styles>`;
}

function footerXml(unitTitle, width) {
  const o = { bold: true, size: 16, color: MUTED };
  return wFooter(
    wParagraph(
      textRuns(unitTitle, o) +
        wRun("", { ...o, tab: true }) +
        wRun("The Language Page", o) +
        wRun("", { ...o, tab: true }) +
        wRun("Page ", o) +
        wField("PAGE", o),
      {
        style: "Footer",
        borders: { top: { sz: 6, space: 6, color: RULE } },
        tabs: [
          { val: "center", pos: Math.round(width / 2) },
          { val: "right", pos: width },
        ],
        spaceBefore: 0,
        spaceAfter: 0,
      },
    ),
  );
}

/** Converts a document model to the body xml (one Word section per model section). */
export function documentBody(doc) {
  const base = baseSize(doc);
  const last = doc.sections.length - 1;
  const parts = doc.sections.map((s, k) => {
    const kind = s.bleed ? "bleed" : s.layout === "landscape" ? "landscape" : "portrait";
    const w = kind === "bleed" ? 12240 : WIDTH[kind];
    const ctx = {
      w,
      ind: 0,
      base,
      early: doc.early,
      dense: doc.dense,
      fam: doc.bodyClass === "fam",
      tone: s.tone || "Reading",
      blocks: blocksXml,
    };
    const sectPr = wSectPr({
      layout: s.layout === "landscape" ? "landscape" : "portrait",
      margins: s.bleed ? { top: 0, right: 0, bottom: 0, left: 0 } : MARGINS,
      footer: FOOTERS[kind],
      header: s.bleed ? 0 : 360,
      footerDist: s.bleed ? 0 : 360,
    });
    const body = trimTail(blocksXml(s.blocks, ctx));
    return {
      body:
        k === last
          ? body.endsWith("</w:tbl>")
            ? body + wGap(20)
            : body
          : withSectPr(body, sectPr),
      sectPr,
    };
  });
  const finalSect = parts[last].sectPr;
  return parts.map((p) => p.body).join("") + finalSect;
}

export function renderStudioDocx(
  detail,
  { part = "packet", wida = "3_4", answerKey = false, work = null } = {},
) {
  const doc = buildStudioDocument(detail, { part, level: wida, answerKey, work });
  return docxPackage({
    documentXml: wDocument(documentBody(doc)),
    stylesXml: stylesXml(),
    footers: {
      [FOOTERS.portrait]: footerXml(doc.unitTitle, WIDTH.portrait),
      [FOOTERS.landscape]: footerXml(doc.unitTitle, WIDTH.landscape),
      [FOOTERS.bleed]: wFooter(wGap(20)),
    },
    title: doc.title,
  });
}
