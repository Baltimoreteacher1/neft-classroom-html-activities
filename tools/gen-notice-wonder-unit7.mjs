#!/usr/bin/env node
// Replacement Notice & Wonder displays for Unit 7 (equations and inequalities).
//
// 7-2 is NOT here and was not touched: its image shows two baseballs and a bat
// totalling 50 above one baseball and a bat totalling 45, which is exactly what
// its prompt describes.
//
// 7-4 and 7-5 are not here either. Their images are genuinely good — three
// balance scales tipping different ways, and four number lines all marked at 5
// with open and closed circles shading in both directions — but their prompts
// talked about the US voting age and the height of Mount Everest, so those two
// lessons had their TEXT corrected to the picture instead.
//
// The three here shipped pictures belonging to other lessons entirely: 7-3 had a
// Garden Grill drive-thru menu board, 7-6 a latitude/longitude map of the United
// States, and 7-7 the eight-petal coordinate-grid flower that belongs to 9-5.
// 7-1 had no picture at all.
import { writeFileSync } from "node:fs";

const NAVY = "#264653";
const TEAL = "#2a9d8f";
const CORAL = "#d9795d";
const INK = "#264653";
const MUTED = "#6b7f88";

const wrap = (w, h, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" font-family="'Hanken Grotesk','Segoe UI',sans-serif">` +
  `<rect width="${w}" height="${h}" fill="#ffffff"/>${inner}</svg>\n`;

const head = (t, s) =>
  `<text x="28" y="34" font-size="17" font-weight="700" fill="${INK}">${t}</text>` +
  `<text x="28" y="58" font-size="15" font-weight="700" fill="${TEAL}">${s}</text>`;

// ── 7-1: the clue as a bar — an unknown part, a known part, a known total ──
function clueBar() {
  const W = 720;
  const H = 300;
  const x0 = 70;
  const y = 140;
  const h = 70;
  const unknownW = 340;
  const knownW = 170;

  const bar =
    `<rect x="${x0}" y="${y}" width="${unknownW}" height="${h}" fill="#ffffff" stroke="${NAVY}" stroke-width="2.5" stroke-dasharray="7 5"/>` +
    `<text x="${x0 + unknownW / 2}" y="${y + h / 2 + 10}" font-size="30" font-weight="800" fill="${MUTED}" text-anchor="middle">?</text>` +
    `<text x="${x0 + unknownW / 2}" y="${y - 14}" font-size="15" font-weight="800" fill="${MUTED}" text-anchor="middle">gems stolen (unknown)</text>` +
    `<rect x="${x0 + unknownW}" y="${y}" width="${knownW}" height="${h}" fill="rgba(233,196,106,0.45)" stroke="${NAVY}" stroke-width="2.5"/>` +
    `<text x="${x0 + unknownW + knownW / 2}" y="${y + h / 2 + 9}" font-size="26" font-weight="800" fill="${NAVY}" text-anchor="middle">8</text>` +
    `<text x="${x0 + unknownW + knownW / 2}" y="${y - 14}" font-size="15" font-weight="800" fill="#b8860b" text-anchor="middle">found in the safe</text>`;

  const total =
    `<line x1="${x0}" y1="${y + h + 22}" x2="${x0 + unknownW + knownW}" y2="${y + h + 22}" stroke="${NAVY}" stroke-width="2"/>` +
    `<line x1="${x0}" y1="${y + h + 14}" x2="${x0}" y2="${y + h + 30}" stroke="${NAVY}" stroke-width="2"/>` +
    `<line x1="${x0 + unknownW + knownW}" y1="${y + h + 14}" x2="${x0 + unknownW + knownW}" y2="${y + h + 30}" stroke="${NAVY}" stroke-width="2"/>` +
    `<text x="${x0 + (unknownW + knownW) / 2}" y="${y + h + 52}" font-size="20" font-weight="800" fill="${NAVY}" text-anchor="middle">20 gems in all</text>`;

  return wrap(
    W,
    H,
    head(
      "The clue on Detective Ruiz's case board",
      "Some gems were stolen, 8 more turned up in the safe, and together they make 20.",
    ) +
      bar +
      total,
  );
}

// ── 7-3: three identical locked boxes holding 21 between them ─────────────
function threeBoxes() {
  const W = 700;
  const H = 320;
  const y0 = 110;
  const bw = 150;
  const bh = 120;
  const gap = 40;
  const startX = (W - (3 * bw + 2 * gap)) / 2;

  let boxes = "";
  for (let i = 0; i < 3; i++) {
    const x = startX + i * (bw + gap);
    boxes += `<rect x="${x}" y="${y0}" width="${bw}" height="${bh}" rx="8" fill="rgba(42,157,143,0.16)" stroke="${NAVY}" stroke-width="2.5"/>`;
    // A padlock, so "locked" is visible and the count inside stays hidden.
    boxes += `<path d="M ${x + bw / 2 - 12} ${y0 + 62} a 12 12 0 0 1 24 0" fill="none" stroke="${NAVY}" stroke-width="3"/>`;
    boxes += `<rect x="${x + bw / 2 - 17}" y="${y0 + 62}" width="34" height="26" rx="4" fill="${NAVY}"/>`;
    boxes += `<text x="${x + bw / 2}" y="${y0 + bh + 26}" font-size="15" font-weight="800" fill="${MUTED}" text-anchor="middle">? pieces</text>`;
  }

  const brace =
    `<line x1="${startX}" y1="${y0 - 22}" x2="${startX + 3 * bw + 2 * gap}" y2="${y0 - 22}" stroke="${NAVY}" stroke-width="2"/>` +
    `<line x1="${startX}" y1="${y0 - 30}" x2="${startX}" y2="${y0 - 14}" stroke="${NAVY}" stroke-width="2"/>` +
    `<line x1="${startX + 3 * bw + 2 * gap}" y1="${y0 - 30}" x2="${startX + 3 * bw + 2 * gap}" y2="${y0 - 14}" stroke="${NAVY}" stroke-width="2"/>` +
    `<text x="${W / 2}" y="${y0 - 38}" font-size="21" font-weight="800" fill="${NAVY}" text-anchor="middle">21 pieces of evidence in all</text>`;

  return wrap(
    W,
    H,
    head(
      "Detective Park's three locked evidence boxes",
      "The boxes are identical, and each holds the same amount.",
    ) +
      brace +
      boxes,
  );
}

// ── 7-6: the stakeout rule and the three logged times on one line ─────────
function stakeoutLine() {
  const W = 800;
  const H = 300;
  const x0 = 70;
  const x1 = 730;
  const y = 170;
  const lo = 0;
  const hi = 40;
  const px = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);

  let axis = `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${NAVY}" stroke-width="2.5"/>`;
  for (let v = lo; v <= hi; v += 5) {
    axis += `<line x1="${px(v)}" y1="${y - 10}" x2="${px(v)}" y2="${y + 10}" stroke="${NAVY}" stroke-width="1.6"/>`;
    axis += `<text x="${px(v)}" y="${y + 32}" font-size="14" font-weight="700" fill="${INK}" text-anchor="middle">${v}</text>`;
  }
  // The three logged times, plotted but NOT judged. Whether 20 itself counts is
  // the question the lesson asks, so the picture does not shade a solution set.
  const logged = [15, 20, 25]
    .map(
      (v) =>
        `<circle cx="${px(v)}" cy="${y}" r="9" fill="${CORAL}" stroke="${NAVY}" stroke-width="1.8"/>` +
        `<text x="${px(v)}" y="${y - 22}" font-size="14" font-weight="800" fill="${CORAL}" text-anchor="middle">${v} min</text>`,
    )
    .join("");

  const rule = `<text x="${x0}" y="${H - 26}" font-size="16" font-weight="800" fill="${NAVY}">Team rule: radio for backup only if the car is parked MORE THAN 20 minutes.</text>`;
  const unit = `<text x="${x1}" y="${y + 54}" font-size="14" font-weight="700" fill="${MUTED}" text-anchor="end">minutes parked</text>`;

  return wrap(
    W,
    H,
    head("Detective Ortiz's stakeout log", "Three cars, three parked times.") +
      axis +
      logged +
      unit +
      rule,
  );
}

// ── 7-7: two case notes, one exact and one a limit ────────────────────────
function twoNotes() {
  const W = 800;
  const H = 320;
  const y0 = 96;
  const bw = 320;
  const bh = 170;

  const note = (x, tag, lines, accent) => {
    let s = `<rect x="${x}" y="${y0}" width="${bw}" height="${bh}" rx="10" fill="#fffdf6" stroke="${NAVY}" stroke-width="2"/>`;
    s += `<rect x="${x}" y="${y0}" width="${bw}" height="38" rx="10" fill="${accent}"/>`;
    s += `<rect x="${x}" y="${y0 + 24}" width="${bw}" height="14" fill="${accent}"/>`;
    s += `<text x="${x + bw / 2}" y="${y0 + 26}" font-size="15" font-weight="800" fill="#ffffff" text-anchor="middle">${tag}</text>`;
    lines.forEach((ln, i) => {
      s += `<text x="${x + 20}" y="${y0 + 76 + i * 30}" font-size="16" font-weight="700" fill="${INK}">${ln}</text>`;
    });
    return s;
  };

  return wrap(
    W,
    H,
    head("Detective Chen's two case notes", "One note fixes an amount. The other sets a limit.") +
      note(
        60,
        "NOTE A",
        ["The evidence locker holds", "EXACTLY 54 files, split", "equally among 6 shelves."],
        TEAL,
      ) +
      note(
        60 + bw + 40,
        "NOTE B",
        ["The surveillance van must", "stay parked NO MORE THAN", "45 minutes."],
        CORAL,
      ),
  );
}

const out = {
  "7-1": clueBar(),
  "7-3": threeBoxes(),
  "7-6": stakeoutLine(),
  "7-7": twoNotes(),
};

for (const [id, svg] of Object.entries(out)) {
  const p = `lessons/${id}/reveal-assets/notice-wonder.svg`;
  writeFileSync(p, svg);
  console.log("wrote", p, svg.length, "bytes");
}
