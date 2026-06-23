#!/usr/bin/env node
// One-off generator for replacement Notice & Wonder data displays on the few
// lessons that shipped a generic placeholder image. Each SVG is a clean,
// accurate math visual matching that lesson's noticeAndWonder.context, in the
// design-system palette. Writes lessons/<id>/reveal-assets/notice-wonder.svg.
import { writeFileSync } from "node:fs";

const NAVY = "#264653";
const TEAL = "#2a9d8f";
const AMBER = "#e9c46a";
const CORAL = "#d9795d";
const GREEN = "#2e9e5b";
const LINE = "#cdd6dd";
const INK = "#264653";

const wrap = (w, h, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" font-family="'Hanken Grotesk','Segoe UI',sans-serif">` +
  `<rect width="${w}" height="${h}" fill="#ffffff"/>${inner}</svg>\n`;

// ── 4-2: 75 of 100 cans — hundred grid (percent/fraction/decimal) ──
function grid100() {
  const x0 = 40,
    y0 = 30,
    c = 26,
    filled = 75;
  let cells = "";
  for (let r = 0; r < 10; r++) {
    for (let col = 0; col < 10; col++) {
      const i = r * 10 + col;
      const fill = i < filled ? TEAL : "#ffffff";
      cells += `<rect x="${x0 + col * c}" y="${y0 + r * c}" width="${c}" height="${c}" fill="${fill}" stroke="${NAVY}" stroke-width="1.2"/>`;
    }
  }
  const label = `<text x="${x0 + 10 * c + 24}" y="${y0 + 110}" font-size="30" font-weight="800" fill="${NAVY}">75</text>` +
    `<text x="${x0 + 10 * c + 24}" y="${y0 + 142}" font-size="18" fill="${INK}">of 100 cans</text>` +
    `<text x="${x0 + 10 * c + 24}" y="${y0 + 176}" font-size="16" fill="${TEAL}" font-weight="700">75/100 = 0.75 = 75%</text>`;
  return wrap(540, 320, `<text x="${x0}" y="22" font-size="16" font-weight="700" fill="${INK}">Cans collected toward this week's goal</text>${cells}${label}`);
}

// ── 2-4: 3½ miles split into ¼-mile segments — number line ──
function numberLine() {
  const x0 = 50,
    x1 = 740,
    y = 150,
    max = 3.5,
    step = 0.25;
  const px = (v) => x0 + (v / max) * (x1 - x0);
  let segs = "";
  for (let i = 0; i < max / step; i++) {
    const a = px(i * step),
      b = px((i + 1) * step);
    segs += `<rect x="${a}" y="${y - 26}" width="${b - a}" height="52" fill="${i % 2 ? "rgba(42,157,143,0.18)" : "rgba(233,196,106,0.30)"}" stroke="${NAVY}" stroke-width="1"/>`;
  }
  let ticks = `<line x1="${x0}" y1="${y}" x2="${x1 + 14}" y2="${y}" stroke="${NAVY}" stroke-width="2.5"/>`;
  for (let v = 0; v <= max + 0.001; v += step) {
    const whole = Math.abs(v - Math.round(v)) < 1e-9;
    ticks += `<line x1="${px(v)}" y1="${y - (whole ? 34 : 26)}" x2="${px(v)}" y2="${y + (whole ? 34 : 26)}" stroke="${NAVY}" stroke-width="${whole ? 2.5 : 1}"/>`;
    if (whole) ticks += `<text x="${px(v)}" y="${y + 56}" font-size="18" font-weight="700" fill="${INK}" text-anchor="middle">${Math.round(v)}</text>`;
  }
  const head = `<text x="${x0}" y="40" font-size="17" font-weight="700" fill="${INK}">A 3½-mile route split into equal ¼-mile segments</text>` +
    `<text x="${x0}" y="64" font-size="15" fill="${TEAL}" font-weight="700">How many ¼-mile markers fit in 3½ miles?</text>`;
  return wrap(780, 240, `${head}${segs}${ticks}<text x="${x1 - 4}" y="${y + 56}" font-size="16" fill="${INK}">miles</text>`);
}

// ── 3-2: clay recipe ratio table ──
function recipeTable() {
  const rows = [
    ["Baking soda", "2 cups"],
    ["Cornstarch", "1 cup"],
    ["Water", "1¼ cups"],
  ];
  const x = 60,
    y = 70,
    w = 420,
    rh = 56;
  let body = "";
  rows.forEach((r, i) => {
    const ry = y + (i + 1) * rh;
    body += `<rect x="${x}" y="${ry}" width="${w}" height="${rh}" fill="${i % 2 ? "#f7f4ec" : "#ffffff"}" stroke="${LINE}"/>`;
    body += `<text x="${x + 18}" y="${ry + 35}" font-size="19" fill="${INK}">${r[0]}</text>`;
    body += `<text x="${x + w - 18}" y="${ry + 35}" font-size="19" font-weight="800" fill="${TEAL}" text-anchor="end">${r[1]}</text>`;
  });
  const head =
    `<text x="${x}" y="40" font-size="20" font-weight="800" fill="${NAVY}">Clay Recipe — 1 batch</text>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${rh}" fill="${NAVY}"/>` +
    `<text x="${x + 18}" y="${y + 35}" font-size="17" font-weight="700" fill="#fff">Ingredient</text>` +
    `<text x="${x + w - 18}" y="${y + 35}" font-size="17" font-weight="700" fill="#fff" text-anchor="end">Amount</text>`;
  const note = `<text x="${x}" y="${y + 4 * rh + 40}" font-size="16" fill="${CORAL}" font-weight="700">How much of each for several batches?</text>`;
  return wrap(540, 360, `${head}${body}${note}`);
}

// ── 6-3: total = (rate × hours) + $23.50 setup ──
function studioCost() {
  const box = (x, y, w, h, fill, stroke) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const y = 90,
    h = 90;
  const inner =
    `<text x="40" y="48" font-size="19" font-weight="800" fill="${NAVY}">Recording session — total cost</text>` +
    box(40, y, 200, h, "rgba(42,157,143,0.12)", TEAL) +
    `<text x="140" y="${y + 38}" font-size="17" font-weight="700" fill="${INK}" text-anchor="middle">price per hour</text>` +
    `<text x="140" y="${y + 66}" font-size="20" font-weight="800" fill="${TEAL}" text-anchor="middle">$? × h</text>` +
    `<text x="262" y="${y + 56}" font-size="34" font-weight="800" fill="${NAVY}" text-anchor="middle">+</text>` +
    box(288, y, 200, h, "rgba(233,196,106,0.22)", AMBER) +
    `<text x="388" y="${y + 38}" font-size="17" font-weight="700" fill="${INK}" text-anchor="middle">one-time setup</text>` +
    `<text x="388" y="${y + 66}" font-size="20" font-weight="800" fill="#b8860b" text-anchor="middle">$23.50</text>` +
    `<text x="510" y="${y + 56}" font-size="30" font-weight="800" fill="${NAVY}" text-anchor="middle">=</text>` +
    box(536, y, 200, h, "rgba(217,121,93,0.12)", CORAL) +
    `<text x="636" y="${y + 38}" font-size="17" font-weight="700" fill="${INK}" text-anchor="middle">total cost</text>` +
    `<text x="636" y="${y + 66}" font-size="22" font-weight="800" fill="${CORAL}" text-anchor="middle">?</text>` +
    `<text x="40" y="${y + h + 50}" font-size="16" fill="${TEAL}" font-weight="700">h = the number of hours (unknown)</text>`;
  return wrap(780, 260, inner);
}

// ── 6-6: same area shown two ways (equivalent expressions area model) ──
function areaModel() {
  const s = 240,
    x0 = 50,
    y0 = 50,
    x1 = 430;
  // left: square split into a green "variable" strip + yellow unit squares
  let left = `<rect x="${x0}" y="${y0}" width="${s}" height="${s}" fill="none" stroke="${NAVY}" stroke-width="2"/>`;
  const stripW = s * 0.35;
  left += `<rect x="${x0}" y="${y0}" width="${stripW}" height="${s}" fill="rgba(46,158,91,0.30)" stroke="${NAVY}"/>`;
  // unit squares region (6 x 8 grid) on the right portion
  const cols = 5,
    rowsN = 8,
    cw = (s - stripW) / cols,
    ch = s / rowsN;
  for (let r = 0; r < rowsN; r++)
    for (let c = 0; c < cols; c++)
      left += `<rect x="${x0 + stripW + c * cw}" y="${y0 + r * ch}" width="${cw}" height="${ch}" fill="rgba(233,196,106,0.45)" stroke="${NAVY}" stroke-width="0.8"/>`;
  left += `<text x="${x0 + stripW / 2}" y="${y0 + s + 28}" font-size="16" font-weight="700" fill="${GREEN}" text-anchor="middle">strips</text>`;
  left += `<text x="${x0 + stripW + (s - stripW) / 2}" y="${y0 + s + 28}" font-size="16" font-weight="700" fill="#b8860b" text-anchor="middle">unit squares</text>`;
  // right: same whole square, one color
  let right = `<rect x="${x1}" y="${y0}" width="${s}" height="${s}" fill="rgba(217,121,93,0.30)" stroke="${NAVY}" stroke-width="2"/>`;
  right += `<text x="${x1 + s / 2}" y="${y0 + s + 28}" font-size="16" font-weight="700" fill="${CORAL}" text-anchor="middle">one whole square</text>`;
  const eq = `<text x="${x0 + s + 30}" y="${y0 + s / 2 + 8}" font-size="34" font-weight="800" fill="${NAVY}" text-anchor="middle">=</text>`;
  const head = `<text x="${x0}" y="34" font-size="17" font-weight="700" fill="${INK}">The same square shown two ways — are the areas equal?</text>`;
  return wrap(720, 360, `${head}${left}${eq}${right}`);
}

const out = {
  "4-2": grid100(),
  "2-4": numberLine(),
  "3-2": recipeTable(),
  "6-3": studioCost(),
  "6-6": areaModel(),
};
for (const [id, svg] of Object.entries(out)) {
  const p = `lessons/${id}/reveal-assets/notice-wonder.svg`;
  writeFileSync(p, svg);
  console.log("wrote", p, svg.length, "bytes");
}
