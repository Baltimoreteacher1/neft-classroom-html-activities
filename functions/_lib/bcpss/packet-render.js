// Mixed-band class packets: renders a packet document model (packet-doc.js, packet-kits.js) to HTML/PDF and Word.
// It reuses the Studio renderers (renderDocumentHtml, documentBody, docxPackage) and changes only what a single-flow
// packet document needs:
//   - no page breaks anywhere: the per-section break rule is dropped from the stylesheet and Word gets one section;
//   - a student paper's footer is its opaque variant code and nothing else (no unit title, brand or page number);
//   - the document title and Word core title are the unit title only.

import { CODE_RE } from "../../../shared/packets/bands.js";
import { docxPackage, wDocument, wFooter, wGap, wParagraph } from "./docx-kit.js";
import { documentBody, stylesXml } from "./studio-docx.js";
import { textRuns } from "./studio-docx-runs.js";
import { printCss } from "./studio-print-css.js";
import { renderDocumentHtml } from "./studio-print-html.js";

const MUTED = "586274";
const BREAK_DECL = /break-(?:before|after):[a-z]+;?/g;

/** The Studio stylesheet minus its page-break declarations, plus the packet's own @page footer. */
export function packetCss(unitTitle, code = null) {
  // A heading stays with what follows it: "avoid" is not a break.
  // Write-in labels stay readable on paper (the Studio sheet sizes them at .62em, under 6pt in a 10pt document).
  const base = `${printCss(unitTitle).replace(BREAK_DECL, "")}\nh1,h2,h3{break-after:avoid}\n.gap span{font-size:7pt}`;
  if (!code) return base;
  if (!CODE_RE.test(code)) throw new Error("packet: bad variant code");
  const box = (side, content) =>
    `@bottom-${side}{content:${content};font:600 7pt/1 Arial,Helvetica,sans-serif;color:#586274;border:0;padding:0;vertical-align:top}`;
  return `${base}\n@page{${box("left", "none")}${box("center", "none")}${box("right", `"${code}"`)}}`;
}

export function renderPacketHtml(doc) {
  const css = printCss(doc.unitTitle);
  const html = renderDocumentHtml(doc);
  const tag = `<style>${css}</style>`;
  if (!html.includes(tag))
    throw new Error("packet: Studio stylesheet not found in the rendered page");
  return html.replace(tag, () => `<style>${packetCss(doc.unitTitle, doc.packet?.code)}</style>`);
}

function footerXml(doc) {
  const o = { size: 14, color: MUTED };
  const code = doc.packet?.code;
  const text = code || `${doc.unitTitle} · The Language Page`;
  return wFooter(
    wParagraph(textRuns(text, o), {
      style: "Footer",
      align: code ? "right" : "left",
      spaceBefore: 0,
      spaceAfter: 0,
    }),
  );
}

export function renderPacketDocx(doc) {
  const footer = footerXml(doc);
  return docxPackage({
    documentXml: wDocument(documentBody(doc)),
    stylesXml: stylesXml(),
    footers: { footerP: footer, footerL: footer, footerNone: wFooter(wGap(20)) },
    title: doc.title,
  });
}
