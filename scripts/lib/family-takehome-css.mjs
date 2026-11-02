/**
 * family-takehome-css.mjs: the print stylesheet of the Family Take-Home Sheet.
 *
 * One sheet, three outputs: the PDF (a standalone document that links nothing), the DOCX (same type scale and
 * colors, see family-takehome-docx.mjs) and the web page's "Print this plan" (`WEB_PRINT_CSS` shows the same
 * sheet markup under @media print). Rules the gates hold: Letter, >= 0.5in margins, nothing under 11pt, body 12pt,
 * answer lines >= 0.4in, black on white (grayscale-safe: every role also differs in shape, outline or label).
 *
 * Color is a build-time print token set below; it is NOT the screen design system, which prints badly.
 */

/** Unit accent: a dark mid-tone that stays distinct in grayscale. Units run 1-10. */
export const UNIT_ACCENT = [
  "#1f2933", // fallback / unnumbered
  "#17406b",
  "#0b6b68",
  "#8a4b08",
  "#2d6a1f",
  "#9a3412",
  "#334155",
  "#1e56a0",
  "#0f5f5c",
  "#7c4a03",
  "#1f2937",
];
export const accentFor = (unit) => UNIT_ACCENT[unit] ?? UNIT_ACCENT[0];

export const PAGE_MARGIN_IN = 0.55;

const FONT = '"Atkinson Hyperlegible", "Helvetica Neue", Arial, sans-serif';

/** Selectors are all under .fm-th (the sheet) or .fm-gd (the grown-up page). */
export const SHEET_CSS = `
.fm-th, .fm-gd { --ink: #14181d; --soft: #f3f3f1; --rule: #14181d; --ds-font-text: ${FONT};
  font: 400 12pt/1.38 ${FONT}; color: var(--ink); background: #fff; }
.fm-th *, .fm-gd * { box-sizing: border-box; }
.fm-th .fi, .fm-gd .fi { width: 20pt; height: 20pt; flex: none; }
.fm-th .fi-d, .fm-gd .fi-d { fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
.fm-th .fi-f, .fm-gd .fi-f { fill: currentColor; stroke: currentColor; }
.fm-th a, .fm-gd a { color: inherit; text-decoration: none; }

.fm-th-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12pt;
  border-bottom: 3pt solid var(--accent); padding-bottom: 4pt; }
.fm-th-mark { margin: 0; font-weight: 700; font-size: 12pt; color: var(--accent); }
.fm-th-where { margin: 0; font-size: 12pt; text-align: right; }
.fm-th-std { display: inline-block; margin-left: 6pt; padding: 0 5pt; border: 1.25pt solid var(--ink); border-radius: 4pt; font-weight: 700; }
.fm-th h1, .fm-th .fm-th-h1, .fm-gd h1 { margin: 6pt 0 1pt; font-size: 21pt; line-height: 1.15; font-weight: 700; break-after: avoid; }
.fm-th-plain { margin: 0 0 4pt; font-size: 12pt; }
.fm-th-name { display: flex; gap: 20pt; margin: 6pt 0 2pt; align-items: flex-end; }
.fm-th-field { display: flex; gap: 5pt; align-items: flex-end; font-weight: 700; flex: 1 1 62%; }
.fm-th-field.short { flex-basis: 30%; }
.fm-th-field i { flex: 1; border-bottom: 1pt solid var(--ink); height: 0.3in; }

.fm-th h2, .fm-th .fm-th-h2, .fm-gd h2 { margin: 0 0 3pt; font-size: 14pt; line-height: 1.2; font-weight: 700; display: flex; align-items: center; gap: 6pt; break-after: avoid; }
.fm-th-box { border: 1.25pt solid var(--ink); border-radius: 6pt; padding: 7pt 10pt 8pt; margin: 8pt 0; break-inside: avoid; }
.fm-th-box p, .fm-gd p { margin: 0; }
.fm-th-hook { background: var(--soft); }
.fm-th-hook .style { display: inline-block; margin-bottom: 2pt; font-weight: 700; letter-spacing: .02em; }
.fm-th-hook .fm-th-guess { margin-top: 4pt; font-weight: 700; }
.fm-th-fig { margin: 6pt 0; padding: 0; text-align: center; break-inside: avoid; }
.fm-th-fig [role="img"] { display: block; }
/* 4.1in keeps the model's 14-unit labels at >= 11pt (14 x 4.1in/360 x 0.75); never cap its height */
.fm-th-fig svg { width: 4.1in; max-width: 100%; height: auto; }
.fm-th-fig figcaption { font-size: 12pt; font-weight: 700; margin-top: 2pt; }

.fm-th-top { display: grid; grid-template-columns: 1fr 4.1in; gap: 10pt; align-items: start; }
.fm-th-top .fm-th-box { margin-right: 0; }
.fm-th-note { margin: 0 0 5pt; }
.fm-th ol.fm-th-items { margin: 0; padding: 0; list-style: none; counter-reset: item; }
.fm-th-items > li { counter-increment: item; position: relative; padding-left: 24pt; margin: 0 0 7pt; break-inside: avoid; }
.fm-th-items > li::before { content: counter(item); position: absolute; left: 0; top: 0; width: 18pt; height: 18pt; border: 1.5pt solid var(--ink);
  border-radius: 50%; text-align: center; font-weight: 700; font-size: 12pt; line-height: 15pt; }
.fm-th-stem { font-weight: 700; }
.fm-th-choices { display: flex; flex-wrap: wrap; gap: 3pt 18pt; margin: 2pt 0 0; padding: 0; list-style: none; }
.fm-th-choices li { white-space: nowrap; }
.fm-th .b, .fm-gd .b { font-weight: 700; }
.fm-th-choices .b { display: inline-block; min-width: 14pt; }
.fm-th-qr .d { display: block; }
.fm-th-ans { display: flex; align-items: flex-end; gap: 6pt; margin-top: 3pt; }
.fm-th-ans span { font-size: 11pt; font-weight: 700; }
.fm-th-ans i { flex: 1; border-bottom: 1pt solid var(--ink); height: 0.4in; }

.fm-th-split > .fm-th-pair { break-before: page; }
.fm-th-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10pt; }
.fm-th-pair .fm-th-box { margin: 6pt 0; }
.fm-th-stuck ul { margin: 0; padding-left: 16pt; }
.fm-th-stuck li { margin: 0 0 1pt; }
.fm-th-stuck .sub { font-weight: 400; }

.fm-th-foot { display: grid; grid-template-columns: auto 1fr auto; gap: 14pt; align-items: center; margin-top: 4pt; break-inside: avoid; }
.fm-th-qr { display: flex; gap: 8pt; align-items: center; }
.fm-th-qr svg { width: 0.85in; height: 0.85in; }
.fm-th-qr p { font-size: 12pt; }
.fm-th-link { display: block; font-weight: 700; font-size: 11pt; margin-top: 2pt; }
.fm-th-feel { text-align: center; }
.fm-th-feel .b { display: block; margin-bottom: 2pt; font-size: 11pt; }
.fm-th-faces { display: flex; gap: 10pt; justify-content: center; }
.fm-th-faces span { display: flex; flex-direction: column; align-items: center; font-size: 11pt; }
.fm-th-faces svg { width: 26pt; height: 26pt; }
.fm-th-faces .face { fill: none; stroke: var(--ink); stroke-width: 1.6; stroke-linecap: round; }
.fm-th-small { font-size: 11pt; }

.fm-gd { font-size: 11pt; line-height: 1.3; }
.fm-gd h2 { margin-top: 8pt; font-size: 13pt; }
.fm-gd .fm-th-plain { font-size: 11pt; }
.fm-gd-ans { margin: 0; padding: 0; list-style: none; counter-reset: ans; }
.fm-gd-ans > li { counter-increment: ans; margin: 0 0 5pt; padding-left: 24pt; position: relative; break-inside: avoid; }
.fm-gd-ans > li::before { content: counter(ans); position: absolute; left: 0; top: 0; width: 18pt; height: 18pt; border: 1.5pt solid var(--ink);
  border-radius: 50%; text-align: center; font-weight: 700; line-height: 15pt; }
.fm-gd ul { margin: 0; padding-left: 16pt; }
.fm-gd li { margin: 0 0 2pt; }
.fm-gd .fm-th-box { margin: 6pt 0; }
`;

/** The standalone PDF document: Letter, 0.6in margins, running footer in the margin boxes (real text, 11pt). */
export const pdfPageCss = ({ footerLeft }) => `
@page { size: Letter; margin: ${PAGE_MARGIN_IN}in ${PAGE_MARGIN_IN}in 0.65in;
  @bottom-left { content: ${JSON.stringify(footerLeft)}; font: 400 11pt ${FONT}; color: #14181d; vertical-align: top; padding-top: 4pt; }
  @bottom-right { content: counter(page) " / " counter(pages); font: 400 11pt ${FONT}; color: #14181d; vertical-align: top; padding-top: 4pt; } }
html, body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

/**
 * Web: the sheet is in the page but invisible; "Print this plan" (or Ctrl+P) shows only the sheet.
 * Documented print override: the rest of the page is interactive chrome and must not reach paper.
 */
export const WEB_PRINT_CSS = `
/* ===== Family Take-Home Sheet on the web (scripts/lib/family-takehome-css.mjs) ===== */
.fm-th-web { display: none; }
.fm-print-cta { margin: 16px 0; text-align: center; }
.fm-print-btn { min-height: 44px; padding: 8px 18px; border: 2px solid currentColor; border-radius: 8px; background: transparent; color: inherit; font: inherit; font-weight: 700; cursor: pointer; }
@media print {
  .fm-print-cta { display: none !important; }
  body.fm-print-plan > *:not(.fm-th-web) { display: none !important; }
  body.fm-print-plan > .fm-th-web { display: block !important; }
  body.fm-print-plan { background: #fff !important; color: #14181d !important; margin: 0 !important; padding: 0 !important; }
  body.fm-print-plan.lang-mode-es > .fm-th-web .fm-th.lang-en,
  body.fm-print-plan:not(.lang-mode-es) > .fm-th-web .fm-th.lang-es { display: none !important; }
  ${SHEET_CSS}
}
`;
