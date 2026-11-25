// Row heights for the cut-apart kits, computed from the text instead of guessed. A fixed row height clips the longest card in a
// unit, and a grid row that is too tall wastes the page. The estimate wraps words greedily at a conservative glyph width, so a
// row is never shorter than its tallest card; tools/packet-print-check.mjs measures the real result in a browser.
// Plain browser-safe ESM, no I/O.

const GLYPH_EM = 0.56; // average glyph width in em, rounded up for a humanist sans
const GAP_PT = 62; // the Studio write-in blank is at least this wide

/** Lines needed to set `text` in a column `widthIn` wide at `pt`. */
export function lineCount(text, pt, widthIn) {
  const perLine = Math.max(4, Math.floor((widthIn * 72) / (pt * GLYPH_EM)));
  let lines = 1;
  let used = 0;
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const n = word.length;
    if (used && used + 1 + n > perLine) {
      lines += 1;
      used = n;
    } else used += used ? n + 1 : n;
  }
  return lines;
}

/** Frame text as it is set on paper: each [gap] becomes a blank at least GAP_PT wide. */
export function frameAsSet(frame, pt) {
  const blank = "x".repeat(Math.ceil(GAP_PT / (pt * GLYPH_EM)));
  return String(frame).replace(/\[[^\]]+\]/g, blank);
}

/**
 * Inches for one block of text: lines x line height + the paragraph gap. `para` entries are { text, pt, lh }.
 */
export function stackHeightIn(paras, widthIn, { gapPt = 7 } = {}) {
  const pt = paras.reduce(
    (sum, p) => sum + lineCount(p.text, p.pt, widthIn) * p.pt * p.lh + gapPt,
    0,
  );
  return pt / 72;
}
