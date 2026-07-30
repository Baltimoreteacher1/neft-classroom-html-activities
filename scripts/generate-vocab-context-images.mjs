#!/usr/bin/env node
// Generate the CONTEXT-SPECIFIC vocab images in assets/vocab-images/.
//
// Why this exists: several math words are overloaded across the curriculum.
// "Base" is the bottom side of a triangle in 5.1/5.3, the flat bottom of a
// pyramid in 10.5, the number being multiplied in 6.1, and the number you take
// a percent OF in 4.4 — but `resolveVocabImage()` maps the slug "base" to ONE
// file, so four of those five lessons showed a picture that contradicted their
// own definition. Same story for "part" (fell through to the 3/4 pie in
// fraction.svg) and "equation" (a generic x + 2 = 7 in every lesson that
// teaches a different equation).
//
// The fix is a per-lesson `image` override in lessons/<id>/config.json pointing
// at one of the cards below. This script is the single place those cards are
// authored so they stay visually consistent with each other and with the
// hand-drawn SVGs already in the folder.
//
//   node scripts/generate-vocab-context-images.mjs        # write the files
//   node scripts/generate-vocab-context-images.mjs --check # fail if stale (CI)
//
// Adding a card: append to CARDS, run the script, commit the SVG, and point the
// lesson's vocab entry at it with `"image": "/assets/vocab-images/<slug>.svg"`.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "vocab-images");

// Palette shared with the hand-authored cards in the same folder.
const INK = "#12355b";
const PAPER = "#f7f4ec";
const TEAL = "#1fa6a2";
const CORAL = "#d9795d";
const HILITE = "#ffe6dd";

const VIEW_W = 160;
const VIEW_H = 120;
const MAX_ROW_W = 146; // leave a 7px gutter on each side
const FONT = "Outfit, system-ui, sans-serif";

// Rough advance widths as a fraction of font-size. Outfit has no metrics here,
// so this is a deliberate over-estimate: a highlight pill that is a hair wide
// reads fine, one that clips the digit does not.
function charWidth(ch) {
  if (ch === " ") return 0.3;
  if (/[.,'’]/.test(ch)) return 0.28;
  if (/[iIl1|]/.test(ch)) return 0.34;
  if (/[%]/.test(ch)) return 0.86;
  if (/[×÷+\-−=]/.test(ch)) return 0.66;
  if (/[²³]/.test(ch)) return 0.42;
  if (/[mwMW]/.test(ch)) return 0.86;
  return 0.58;
}

function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += charWidth(ch) * size;
  return w;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Every run of text is emitted with an explicit `textLength`, so the glyphs are
// laid out to a width WE choose instead of a width the font decides. That
// matters twice over: Outfit is a webfont (a viewer without it gets a fallback
// with different metrics) and the highlight pill is a separate <rect> that has
// to line up with the digits it circles. With textLength the estimator below
// only has to be close enough to avoid visible squeezing — it can never let a
// pill drift off its number or a caption run past the card edge.
function textRun(text, x, baseline, fontSize, width, fill, extra = "") {
  return (
    `<text x="${round(x)}" y="${round(baseline)}" font-family="${FONT}" font-size="${round(fontSize)}"` +
    ` font-weight="800" fill="${fill}" textLength="${round(width)}" lengthAdjust="spacingAndGlyphs"` +
    `${extra} xml:space="preserve">${esc(text)}</text>`
  );
}

// Shrink a font size until the whole run fits inside MAX_ROW_W.
function fitFontSize(parts, size, min = 8) {
  let fontSize = size;
  const total = () => parts.reduce((sum, p) => sum + textWidth(p, fontSize), 0);
  while (total() > MAX_ROW_W && fontSize > min) fontSize -= 0.5;
  return fontSize;
}

// A row is an array of tokens: { t, hi, accent } — `hi` draws the coral
// highlight pill around the word being defined, `accent` just tints the glyph
// coral (used for the equals sign). Tokens render on one baseline.
function renderRow(tokens, baseline, size) {
  const fontSize = fitFontSize(
    tokens.map((tok) => tok.t),
    size,
  );
  const widths = tokens.map((tok) => textWidth(tok.t, fontSize));
  const total = widths.reduce((sum, w) => sum + w, 0);

  const parts = [];
  let x = (VIEW_W - total) / 2;
  tokens.forEach((tok, i) => {
    const w = widths[i];
    if (tok.hi) {
      // The pill wraps the highlighted run itself, so highlighted tokens carry
      // no padding spaces — those live in the neighbouring token.
      const padX = fontSize * 0.24;
      const padTop = fontSize * 0.92;
      const padBottom = fontSize * 0.3;
      parts.push(
        `<rect x="${round(x - padX)}" y="${round(baseline - padTop)}" width="${round(w + padX * 2)}" height="${round(padTop + padBottom)}" rx="${round(fontSize * 0.28)}" fill="${HILITE}" stroke="${CORAL}" stroke-width="1.5"/>`,
      );
    }
    parts.push(
      textRun(tok.t, x, baseline, fontSize, w, tok.hi || tok.accent ? CORAL : INK, ' class="row"'),
    );
    x += w;
  });
  return parts;
}

function round(n) {
  return Math.round(n * 10) / 10;
}

function renderCard(card) {
  const rows = card.rows;
  const size = card.size || (rows.length > 1 ? 14 : 16);
  // Two rows sit above the caption; one row centers in the same space.
  const baselines = rows.length > 1 ? [48, 76] : [60];
  const body = rows.flatMap((tokens, i) => renderRow(tokens, baselines[i], size));

  let caption = "";
  if (card.caption) {
    const capSize = fitFontSize([card.caption], 9.5, 7);
    const capWidth = Math.min(textWidth(card.caption, capSize), MAX_ROW_W);
    caption = textRun(
      card.caption,
      (VIEW_W - capWidth) / 2,
      rows.length > 1 ? 104 : 92,
      capSize,
      capWidth,
      TEAL,
    );
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" role="img" aria-labelledby="t">`,
    `<title id="t">${esc(card.title)}</title>`,
    `<rect x="0" y="0" width="${VIEW_W}" height="${VIEW_H}" rx="10" fill="${PAPER}"/>`,
    ...body,
    caption,
    "</svg>",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n")
    .concat("\n");
}

// ─────────────────────────────────────────────────────────────────────────
// The cards. Every equation shown here is lifted from the lesson that points
// at it, so the picture, the definition, and the problems agree.
// ─────────────────────────────────────────────────────────────────────────
export const CARDS = [
  // ── "Base" and "Part" in the percent lessons (4.4, 4.7 catch-up). Defined
  // positionally so they survive percents over 100%, where the part is BIGGER
  // than the base — which is exactly what the second row shows.
  {
    slug: "percent-base",
    title: "Base: the number right after the word of",
    rows: [
      [{ t: "25% of  " }, { t: "80", hi: true }],
      [{ t: "140% of  " }, { t: "145", hi: true }],
    ],
    caption: "the number right after “of”",
  },
  {
    slug: "percent-part",
    title: "Part: the answer to percent times base",
    rows: [
      [{ t: "25% of 80 =  " }, { t: "20", hi: true }],
      [{ t: "140% of 145 =  " }, { t: "203", hi: true }],
    ],
    caption: "part = percent × base",
  },
  // ── The lesson title term in 4.4. Without a card it fell through to the
  // generic cat-number.svg, which is a literal "#" tile.
  {
    slug: "percent-of-a-number",
    title: "Percent of a number: multiply by the percent as a decimal",
    rows: [[{ t: "25% of 80" }], [{ t: "= 0.25 × 80 =  " }, { t: "20", hi: true }]],
    caption: "multiply by the percent as a decimal",
  },
  // ── "Base" in 6.1 Powers and Exponents: the number being multiplied.
  {
    slug: "exponent-base",
    title: "Base: the number that gets multiplied by itself",
    rows: [[{ t: "5² = 5 × 5 = 25" }], [{ t: "base =  " }, { t: "5", hi: true }]],
    caption: "the number being multiplied",
  },
  // ── "Equation" — one card per lesson, each showing that lesson's own work.
  {
    slug: "equation-fraction-division",
    title: "Equation: 3/4 divided by 1/8 equals 6",
    rows: [[{ t: "3/4 ÷ 1/8 " }, { t: "=", accent: true }, { t: " 6" }]],
    caption: "both sides name the same amount",
  },
  {
    slug: "equation-percent-formula",
    title: "Equation: part equals percent times base",
    rows: [[{ t: "part " }, { t: "=", accent: true }, { t: " percent × base" }]],
    caption: "both sides name the same amount",
  },
  {
    slug: "equation-n-plus-8",
    title: "Equation: n plus 8 equals 20",
    rows: [[{ t: "n + 8 " }, { t: "=", accent: true }, { t: " 20" }]],
    caption: "both sides are the same",
  },
  {
    slug: "equation-x-plus-25",
    title: "Equation: x plus 25 equals 60",
    rows: [[{ t: "x + 25 " }, { t: "=", accent: true }, { t: " 60" }]],
    caption: "both sides equal 60 when x = 35",
  },
  {
    slug: "equation-x-plus-3",
    title: "Equation: x plus 3 equals 6",
    rows: [[{ t: "x + 3 " }, { t: "=", accent: true }, { t: " 6" }]],
    caption: "both sides equal 6 when x = 3",
  },
  {
    slug: "equation-x-plus-8",
    title: "Equation: x plus 8 equals 15",
    rows: [[{ t: "x + 8 " }, { t: "=", accent: true }, { t: " 15" }]],
    caption: "both sides equal 15 when x = 7",
  },
  {
    slug: "equation-p-plus-12",
    title: "Equation: p plus 12 equals 45",
    rows: [[{ t: "p + 12 " }, { t: "=", accent: true }, { t: " 45" }]],
    caption: "both sides equal 45 when p = 33",
  },
];

const check = process.argv.includes("--check");
let stale = 0;

for (const card of CARDS) {
  const file = join(OUT_DIR, `${card.slug}.svg`);
  const svg = renderCard(card);
  let current = null;
  try {
    current = readFileSync(file, "utf8");
  } catch {
    /* new card */
  }
  if (current === svg) continue;
  stale += 1;
  if (check) {
    console.error(`stale: assets/vocab-images/${card.slug}.svg`);
  } else {
    writeFileSync(file, svg);
    console.log(
      `${current === null ? "created" : "updated"}: assets/vocab-images/${card.slug}.svg`,
    );
  }
}

if (check && stale > 0) {
  console.error(
    `\n${stale} context vocab image(s) out of date — run: node scripts/generate-vocab-context-images.mjs`,
  );
  process.exit(1);
}
if (!check && stale === 0) console.log("all context vocab images up to date");
