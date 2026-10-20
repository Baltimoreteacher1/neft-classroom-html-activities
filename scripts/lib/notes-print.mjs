// Print stylesheet for the Notes Packet (notes.html / notes-teacher.html).
//
// The packet is an interactive page first and a printed document second, and for a
// long time the print path was "the web page, with the colours stripped": the whole
// My Notes section was one unbreakable block (so page 1 held only the header), the
// Name/Date/Class inputs printed their web placeholders, the fill-in blanks were
// 120px boxes, body type was 9.5-13px Georgia, and a forced break before the answer
// key left half-empty pages. This block is the print design, written as print:
//
//   - Atkinson Hyperlegible (the site's own face, self-hosted under /assets/fonts/)
//     at >= 12pt body and >= 11pt captions, headings larger;
//   - sections flow across pages; only small cards (a fill-in line, a response
//     card, a word-bank) refuse to split, so no page is left mostly white;
//   - Name / Date / Class print as ruled lines, never as placeholder text;
//   - fill-in blanks are ruled lines long enough to write a word, response areas
//     are ruled at a handwriting size (0.4in) and never shorter than three lines (1.2in).
//
// It must be emitted AFTER every other print rule in the page (the page's own
// <style> blocks carry `@media print` rules that would otherwise win on source
// order), and it reuses the web markup unchanged: no content is added or removed
// here except two pieces of screen-only help text ("Tap any word...", the info
// glyph), which mean nothing on paper.
//
// The font URLs are root-absolute, which is how the site serves them. The PDF
// generator renders from file://, so it rewrites `/assets/fonts/` to the repo's
// public/assets/fonts (scripts/generate-pdf.mjs, `localizeFonts`).

const FACE = "Atkinson Hyperlegible";
const FONT_FILES = [
  { style: "normal", weight: 400, file: "atkinson-hyperlegible-0aa3443e.woff2" },
  { style: "normal", weight: 700, file: "atkinson-hyperlegible-ef295152.woff2" },
  { style: "italic", weight: 400, file: "atkinson-hyperlegible-2f9137da.woff2" },
];
// Latin range: covers every Spanish support string (á é í ó ú ñ ¿ ¡).
const LATIN_RANGE =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";

const fontFaces = FONT_FILES.map(
  ({ style, weight, file }) =>
    `@font-face{font-family:"${FACE}";font-style:${style};font-weight:${weight};font-display:block;` +
    `src:url(/assets/fonts/${file}) format("woff2");unicode-range:${LATIN_RANGE};}`,
).join("\n");

const FONT = `"${FACE}",Verdana,Arial,sans-serif`;
const RULE_IN = 0.4; // inches between handwriting rules

export function notesPrintCss(printTitle = "") {
  const title = String(printTitle).replace(/["\\]/g, "");
  return `<style id="notes-print">
${fontFaces}
@media print{
  @page{
    size:letter;margin:0.6in 0.75in 0.8in;
    @bottom-left{content:"Neft Teacher";font:11pt ${FONT};color:#333;}
    @bottom-center{content:"${title}";font:11pt ${FONT};color:#333;}
    @bottom-right{content:"Page " counter(page) " of " counter(pages);font:11pt ${FONT};color:#333;}
  }
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  html,body{font-family:${FONT};font-size:12pt;line-height:1.4;}
  main.sheet{padding:0;margin:0;max-width:none;}
  main.sheet.sheet,main.sheet.sheet *{font-family:${FONT} !important;}
  main.sheet *{font-size:12pt !important;}

  /* Headings */
  main.sheet header.packet h1{font-size:24pt !important;line-height:1.2;margin:0 0 4pt;}
  main.sheet header.packet h1::after{display:none;}
  main.sheet .section>h2,main.sheet .answer-key h2{font-size:18pt !important;line-height:1.25;
    margin:0 0 10pt;break-after:avoid;}
  main.sheet h3{font-size:14pt !important;break-after:avoid;}
  main.sheet h4{font-size:13pt !important;break-after:avoid;}
  main.sheet .example-head,main.sheet .twr-block h3{font-size:14pt !important;}
  main.sheet .eyebrow,main.sheet header.packet .meta{font-size:12pt !important;}

  /* Captions and support text: never below 11pt */
  main.sheet .twr-es-support,main.sheet .gn-bank-label,main.sheet .notes-learning-label,
  main.sheet .twr-level-support,main.sheet .level-tag,main.sheet .twr-tag,main.sheet .twr-conj-es,
  main.sheet .vocab-caption,main.sheet .gn-num,main.sheet .tt-stems-label{font-size:11pt !important;}

  /* Sections flow across pages; only small cards stay whole. */
  main.sheet .section{margin:0 0 14pt;break-inside:auto;page-break-inside:auto;}
  main.sheet .answer-key{break-before:auto;page-break-before:auto;margin-top:18pt;break-inside:auto;}
  main.sheet .gn-line,main.sheet .gn-bank,main.sheet .notes-learning,main.sheet .twr-focus-question,
  main.sheet .twr-model-parts,main.sheet .twr-level-card,main.sheet .twr-word,main.sheet .twr-check,
  main.sheet .example,main.sheet .twr-block,main.sheet .twr-guide-step,main.sheet .mission,
  main.sheet .vocab-card,main.sheet .tt-card,main.sheet .think-block{
    break-inside:avoid;page-break-inside:avoid;}
  main.sheet p,main.sheet li{orphans:3;widows:3;}

  /* Name / Date / Class: ruled lines, no placeholder text */
  main.sheet .name-line{display:flex;flex-wrap:nowrap;gap:18pt;margin:10pt 0 0;align-items:flex-end;}
  main.sheet .nl-field{min-width:0;gap:6pt;align-items:flex-end;}
  main.sheet .nl-field:nth-child(1){flex:3 1 0;}
  main.sheet .nl-field:nth-child(2){flex:2 1 0;}
  main.sheet .nl-field:nth-child(3){flex:1.4 1 0;}
  main.sheet .nl-input{display:block;flex:1 1 auto;min-width:0;height:30pt;padding:0;border:0;
    border-bottom:1.25pt solid #000;border-radius:0;background:transparent;color:#000;}
  main.sheet .nl-input::placeholder{color:transparent;opacity:0;}

  /* Screen-only help */
  main.sheet .gn-info,main.sheet .gn-bank-hint:not(.l3-only){display:none !important;}

  /* Word bank */
  main.sheet .gn-bank{padding:10pt 12pt;margin:0 0 12pt;}
  main.sheet .gn-bank-words{gap:6pt 8pt;}
  main.sheet .gn-bank-word{padding:3pt 10pt;font-weight:700;}

  /* Fill-in lines: a ruled line long enough to write a word */
  main.sheet .gn-lines{margin:0;}
  main.sheet .gn-line{padding:6pt 10pt;margin:0 0 6pt;gap:10pt;align-items:flex-start;}
  main.sheet .gn-sentence{font-size:13pt !important;line-height:2.2;}
  main.sheet input.gn-blank{display:inline-block;width:1.55in;min-width:1.55in;height:1.5em;
    margin:0 6pt;padding:0;border:0;border-bottom:1.5pt solid #000;border-radius:0;
    background:transparent;vertical-align:bottom;color:#000;}

  /* Written responses: handwriting-sized ruled lines, at least 1.25in tall */
  main.sheet textarea.writeline-area{display:block;width:100%;min-height:${(3 * RULE_IN).toFixed(2)}in;
    padding:0;margin:6pt 0 0;border:0;border-radius:0;resize:none;overflow:hidden;
    line-height:${RULE_IN}in;font-size:13pt !important;color:#000;background-color:transparent;
    background-image:repeating-linear-gradient(to bottom,transparent 0,
      transparent calc(${RULE_IN}in - 1.25pt),#000 calc(${RULE_IN}in - 1.25pt),#000 ${RULE_IN}in);}
  main.sheet .twr-level-card textarea.writeline-area{min-height:${(3 * RULE_IN).toFixed(2)}in;}

  /* Write About the Math */
  main.sheet .twr-level-grid{grid-template-columns:1fr;gap:10pt;}
  main.sheet .twr-level-card{padding:8pt 12pt;}
  main.sheet .twr-level-card ul{margin:3pt 0;line-height:1.3;}
  main.sheet .twr-level-card li{margin:2pt 0;}
  main.sheet .twr-level-card h4{margin:0 0 2pt;}
  main.sheet .twr-es-support{margin-top:0;}
  main.sheet .twr-level-card textarea.writeline-area{margin-top:3pt;}
  main.sheet .twr-level-card p{margin:0 0 4pt;}
  main.sheet .twr-word-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6pt 8pt;margin:6pt 0 10pt;}
  main.sheet .twr-word{padding:6pt 8pt;}
  main.sheet .twr-checklist{grid-template-columns:1fr;gap:6pt;}
  main.sheet .twr-check{min-height:0;}
  main.sheet .twr-word input,main.sheet .twr-check input{width:14pt;height:14pt;}
  main.sheet .twr-model-parts p{line-height:1.4;}
}
</style>`;
}
