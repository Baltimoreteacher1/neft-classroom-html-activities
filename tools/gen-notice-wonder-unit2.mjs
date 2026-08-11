#!/usr/bin/env node
// Replacement Notice & Wonder displays for Unit 2.
//
// Unit 2's images were whatever the Reveal Math extractor pulled off the
// publisher slides, and none of them showed the lesson's own question: 2-1's
// 3-foot evidence tape sat next to five national-park landscape photos (the same
// slide 8-1 uses), 2-3's fingerprint powder next to a stock photo of people
// holding hands in a park, and 2-5's security footage next to a choropleth map of
// US population density. 2-2 at least had a math picture — a 5/8-pound bag of
// peanuts repacked into small bags — but 2-2 asks about a 3-hour session cut into
// 45-minute activities, so it illustrated the wrong question (and the wrong
// standard: 2-2 divides a WHOLE number by a fraction).
//
// Every Unit 2 lesson asks one shape of question — "how many of this small piece
// fit inside this amount?" — so they share one drawing. The bar is divided at the
// piece size and the count is left as "?": a student can count the pieces, which
// is the noticing, but the picture never states the quotient.
//
// 2-4 is not here; it already had an accurate SVG.
import { writeFileSync } from "node:fs";

const NAVY = "#264653";
const TEAL = "#2a9d8f";
const CORAL = "#d9795d";
const INK = "#264653";
const MUTED = "#6b7f88";

const wrap = (w, h, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" font-family="'Hanken Grotesk','Segoe UI',sans-serif">` +
  `<rect width="${w}" height="${h}" fill="#ffffff"/>${inner}</svg>\n`;

/**
 * One bar showing `amount` of something, divided into `pieces` equal parts.
 *
 * When the amount is less than one whole (5/6 pound, 5/8 hour) the rest of the
 * whole is drawn as a pale outline behind it, so "five sixths" reads as an amount
 * rather than as a full bar — otherwise every one of these pictures would look
 * identical no matter what fraction it showed.
 */
function unitsInAmount(opts) {
  const W = 820;
  const H = 300;
  const x0 = 60;
  const barW = 700;
  const y = 130;
  const h = 74;

  const fill = opts.fillFraction ?? 1;
  const usedW = barW * fill;
  const pw = usedW / opts.pieces;

  // The remainder of the whole, when the amount is a fraction of it.
  const ghost =
    fill < 1
      ? `<rect x="${x0}" y="${y}" width="${barW}" height="${h}" fill="#ffffff" stroke="${MUTED}" stroke-width="1.5" stroke-dasharray="6 5"/>` +
        `<text x="${x0 + barW}" y="${y - 12}" font-size="14" font-weight="700" fill="${MUTED}" text-anchor="end">${opts.wholeLabel}</text>`
      : "";

  let cells = "";
  for (let i = 0; i < opts.pieces; i++) {
    cells += `<rect x="${x0 + i * pw}" y="${y}" width="${pw}" height="${h}" fill="${i % 2 ? "rgba(42,157,143,0.20)" : "rgba(233,196,106,0.32)"}" stroke="${NAVY}" stroke-width="1.4"/>`;
  }
  // One piece is outlined and named, so the unit being counted is unmistakable
  // without numbering all of them (numbering them would print the answer).
  const firstPiece =
    `<rect x="${x0}" y="${y}" width="${pw}" height="${h}" fill="none" stroke="${CORAL}" stroke-width="3"/>` +
    `<text x="${x0 + pw / 2}" y="${y + h + 26}" font-size="15" font-weight="800" fill="${CORAL}" text-anchor="middle">${opts.pieceLabel}</text>` +
    `<text x="${x0 + pw / 2}" y="${y + h + 46}" font-size="13" font-weight="700" fill="${MUTED}" text-anchor="middle">one ${opts.pieceWord}</text>`;

  const brace =
    `<line x1="${x0}" y1="${y - 26}" x2="${x0 + usedW}" y2="${y - 26}" stroke="${NAVY}" stroke-width="2"/>` +
    `<line x1="${x0}" y1="${y - 34}" x2="${x0}" y2="${y - 18}" stroke="${NAVY}" stroke-width="2"/>` +
    `<line x1="${x0 + usedW}" y1="${y - 34}" x2="${x0 + usedW}" y2="${y - 18}" stroke="${NAVY}" stroke-width="2"/>` +
    `<text x="${x0 + usedW / 2}" y="${y - 42}" font-size="21" font-weight="800" fill="${NAVY}" text-anchor="middle">${opts.amountLabel}</text>`;

  const ask = `<text x="${x0 + barW / 2}" y="${H - 26}" font-size="17" font-weight="700" fill="${INK}" text-anchor="middle">How many ${opts.pieceWord}s fit into ${opts.amountLabel}?</text>`;

  return wrap(
    W,
    H,
    `<text x="28" y="34" font-size="17" font-weight="700" fill="${INK}">${opts.title}</text>` +
      `<text x="28" y="58" font-size="15" font-weight="700" fill="${TEAL}">${opts.subtitle}</text>` +
      ghost +
      brace +
      cells +
      firstPiece +
      ask,
  );
}

const out = {
  // 3 feet of evidence tape cut into 1/4-foot sections.
  "2-1": unitsInAmount({
    title: "A 3-foot strip of evidence tape, cut into equal sections",
    subtitle: "Every section is 1/4 foot long.",
    amountLabel: "3 feet",
    wholeLabel: "",
    pieceLabel: "1/4 ft",
    pieceWord: "section",
    pieces: 12,
    fillFraction: 1,
  }),
  // 2-1-flagship runs the same 3-foot / quarter-foot scenario as 2-1 but its
  // starters say "pieces" rather than "sections", so it gets its own wording.
  "2-1-flagship": unitsInAmount({
    title: "A 3-foot strip of evidence tape, cut into equal pieces",
    subtitle: "Every piece is 1/4 foot long.",
    amountLabel: "3 feet",
    wholeLabel: "",
    pieceLabel: "1/4 ft",
    pieceWord: "piece",
    pieces: 12,
    fillFraction: 1,
  }),
  // A 3-hour session filled with 45-minute (3/4-hour) activities.
  "2-2": unitsInAmount({
    title: "A 3-hour afternoon session, filled with equal activities",
    subtitle: "Every activity is 45 minutes — that is 3/4 of an hour.",
    amountLabel: "3 hours",
    wholeLabel: "",
    pieceLabel: "45 min",
    pieceWord: "activity",
    pieces: 4,
    fillFraction: 1,
  }),
  // 5/6 pound of powder poured into 1/12-pound tubes.
  "2-3": unitsInAmount({
    title: "5/6 pound of fingerprint powder, poured into sample tubes",
    subtitle: "Every tube holds 1/12 pound. The dashed outline is one whole pound.",
    amountLabel: "5/6 pound",
    wholeLabel: "1 whole pound",
    pieceLabel: "1/12 lb",
    pieceWord: "tube",
    pieces: 10,
    fillFraction: 5 / 6,
  }),
  // 5/8 of an hour of footage, marked every 1/16 of an hour.
  "2-5": unitsInAmount({
    title: "5/8 of an hour of security footage, marked at equal spacing",
    subtitle: "A marker goes every 1/16 of an hour. The dashed outline is one whole hour.",
    amountLabel: "5/8 hour",
    wholeLabel: "1 whole hour",
    pieceLabel: "1/16 hr",
    pieceWord: "marker gap",
    pieces: 10,
    fillFraction: 5 / 8,
  }),
};

for (const [id, svg] of Object.entries(out)) {
  const p = `lessons/${id}/reveal-assets/notice-wonder.svg`;
  writeFileSync(p, svg);
  console.log("wrote", p, svg.length, "bytes");
}
