#!/usr/bin/env node
// Replacement Notice & Wonder displays for Unit 3.
//
// Unit 3's publisher images were decoration or belonged to another lesson: 3-1's
// "recipe card" was a photograph of cranberries with three apples in it, 3-5's two
// cups of hot cocoa was a purple paint swirl, and 3-3 and 3-4 shipped the SAME
// staircase of soccer-ball bags as each other — a picture about neither sundae
// sauce nor a paprika-and-cumin spice mix.
//
// Unit 3 is ratios, so the drawings here are the three pictures ratios are read
// from: a two-quantity card, a ratio table with its plotted points, and two mixes
// side by side. Every one stops short of the comparison the lesson asks for.
import { writeFileSync } from "node:fs";

const NAVY = "#264653";
const TEAL = "#2a9d8f";
const AMBER = "#e9c46a";
const CORAL = "#d9795d";
const INK = "#264653";
const MUTED = "#6b7f88";

const wrap = (w, h, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" font-family="'Hanken Grotesk','Segoe UI',sans-serif">` +
  `<rect width="${w}" height="${h}" fill="#ffffff"/>${inner}</svg>\n`;

const head = (t, s) =>
  `<text x="28" y="34" font-size="17" font-weight="700" fill="${INK}">${t}</text>` +
  `<text x="28" y="58" font-size="15" font-weight="700" fill="${TEAL}">${s}</text>`;

// ── A recipe card: ingredient name on the left, amount on the right ─────────
function recipeCard(title, subtitle, cardTitle, rows) {
  const W = 620;
  const H = 120 + rows.length * 46;
  const x0 = 90;
  const cw = 440;
  const y0 = 92;
  const rh = 44;

  let body = `<rect x="${x0}" y="${y0}" width="${cw}" height="${rows.length * rh + 44}" rx="10" fill="#fffdf6" stroke="${NAVY}" stroke-width="2"/>`;
  body += `<rect x="${x0}" y="${y0}" width="${cw}" height="42" rx="10" fill="${NAVY}"/>`;
  body += `<text x="${x0 + cw / 2}" y="${y0 + 28}" font-size="17" font-weight="800" fill="#ffffff" text-anchor="middle">${cardTitle}</text>`;
  rows.forEach((r, i) => {
    const y = y0 + 44 + i * rh;
    body += `<line x1="${x0}" y1="${y}" x2="${x0 + cw}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
    body += `<text x="${x0 + 20}" y="${y + 29}" font-size="16" font-weight="700" fill="${INK}">${r[0]}</text>`;
    body += `<text x="${x0 + cw - 20}" y="${y + 29}" font-size="17" font-weight="800" fill="${TEAL}" text-anchor="end">${r[1]}</text>`;
  });
  return wrap(W, H, head(title, subtitle) + body);
}

// ── A ratio table beside the grid its pairs are plotted on ─────────────────
function tableAndGrid(title, subtitle, colA, colB, pairs) {
  const W = 820;
  const H = 380;

  // table
  const tx = 40;
  const ty = 96;
  const tw = 250;
  const rh = 42;
  let table = `<rect x="${tx}" y="${ty}" width="${tw}" height="${(pairs.length + 1) * rh}" rx="8" fill="#ffffff" stroke="${NAVY}" stroke-width="2"/>`;
  table += `<rect x="${tx}" y="${ty}" width="${tw}" height="${rh}" fill="rgba(42,157,143,0.18)"/>`;
  table += `<text x="${tx + tw / 4}" y="${ty + 27}" font-size="14" font-weight="800" fill="${INK}" text-anchor="middle">${colA}</text>`;
  table += `<text x="${tx + (3 * tw) / 4}" y="${ty + 27}" font-size="14" font-weight="800" fill="${INK}" text-anchor="middle">${colB}</text>`;
  table += `<line x1="${tx + tw / 2}" y1="${ty}" x2="${tx + tw / 2}" y2="${ty + (pairs.length + 1) * rh}" stroke="${NAVY}" stroke-width="1.5"/>`;
  pairs.forEach((p, i) => {
    const y = ty + (i + 1) * rh;
    table += `<line x1="${tx}" y1="${y}" x2="${tx + tw}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
    table += `<text x="${tx + tw / 4}" y="${y + 28}" font-size="17" font-weight="800" fill="${NAVY}" text-anchor="middle">${p[0]}</text>`;
    table += `<text x="${tx + (3 * tw) / 4}" y="${y + 28}" font-size="17" font-weight="800" fill="${NAVY}" text-anchor="middle">${p[1]}</text>`;
  });

  // grid
  const gx = 380;
  const gy = 96;
  const gw = 380;
  const gh = 240;
  const maxX = 4;
  const maxY = 8;
  let grid = "";
  for (let i = 0; i <= maxX; i++) {
    const x = gx + (i / maxX) * gw;
    grid += `<line x1="${x}" y1="${gy}" x2="${x}" y2="${gy + gh}" stroke="#dbe6ec" stroke-width="1"/>`;
    grid += `<text x="${x}" y="${gy + gh + 20}" font-size="12" font-weight="700" fill="${MUTED}" text-anchor="middle">${i}</text>`;
  }
  for (let j = 0; j <= maxY; j += 2) {
    const y = gy + gh - (j / maxY) * gh;
    grid += `<line x1="${gx}" y1="${y}" x2="${gx + gw}" y2="${y}" stroke="#dbe6ec" stroke-width="1"/>`;
    grid += `<text x="${gx - 10}" y="${y + 5}" font-size="12" font-weight="700" fill="${MUTED}" text-anchor="end">${j}</text>`;
  }
  grid += `<line x1="${gx}" y1="${gy}" x2="${gx}" y2="${gy + gh}" stroke="${NAVY}" stroke-width="2"/>`;
  grid += `<line x1="${gx}" y1="${gy + gh}" x2="${gx + gw}" y2="${gy + gh}" stroke="${NAVY}" stroke-width="2"/>`;
  // Only the pairs the table already lists are plotted — the picture never
  // extends the pattern, because extending it is the lesson.
  for (const p of pairs) {
    const x = gx + (Number(p[0]) / maxX) * gw;
    const y = gy + gh - (Number(p[1]) / maxY) * gh;
    grid += `<circle cx="${x}" cy="${y}" r="7" fill="${CORAL}" stroke="${NAVY}" stroke-width="1.5"/>`;
  }
  grid += `<text x="${gx + gw / 2}" y="${gy + gh + 42}" font-size="13" font-weight="700" fill="${INK}" text-anchor="middle">${colA}</text>`;

  return wrap(W, H, head(title, subtitle) + table + grid);
}

// ── Two mixes side by side, each drawn as a stack of two-colour units ───────
function twoMixes(title, subtitle, mixes, labelA, labelB) {
  const W = 800;
  const H = 360;
  const boxW = 300;
  const boxH = 210;
  const y0 = 100;

  let out = "";
  mixes.forEach((m, i) => {
    const x = 60 + i * (boxW + 80);
    const total = m.a + m.b;
    const unit = boxH / total;
    out += `<rect x="${x}" y="${y0}" width="${boxW}" height="${boxH}" rx="8" fill="#ffffff" stroke="${NAVY}" stroke-width="2"/>`;
    for (let k = 0; k < total; k++) {
      const isA = k < m.a;
      out += `<rect x="${x}" y="${y0 + k * unit}" width="${boxW}" height="${unit}" fill="${isA ? "rgba(217,121,93,0.55)" : "rgba(233,196,106,0.45)"}" stroke="${NAVY}" stroke-width="0.9"/>`;
    }
    out += `<text x="${x + boxW / 2}" y="${y0 - 14}" font-size="17" font-weight="800" fill="${NAVY}" text-anchor="middle">${m.name}</text>`;
    out += `<text x="${x + boxW / 2}" y="${y0 + boxH + 26}" font-size="15" font-weight="800" fill="${CORAL}" text-anchor="middle">${m.a} ${labelA}</text>`;
    out += `<text x="${x + boxW / 2}" y="${y0 + boxH + 48}" font-size="15" font-weight="800" fill="#b8860b" text-anchor="middle">${m.b} ${labelB}</text>`;
  });
  return wrap(W, H, head(title, subtitle) + out);
}

const out = {
  "3-1": recipeCard(
    "One batch of sparkling cranberry-apple fruit drink",
    "This is what the recipe card lists for a single batch.",
    "SPARKLING CRANBERRY-APPLE DRINK — 1 batch",
    [
      ["Cranberry juice", "3 cups"],
      ["Apple juice", "2 cups"],
      ["Sparkling water", "4 cups"],
    ],
  ),
  "3-3": tableAndGrid(
    "Chef Reyes's sundae sauce table, part-way onto the grid",
    "Each row is one pair: sundaes, then ounces of chocolate sauce.",
    "Sundaes",
    "Ounces",
    [
      ["1", "2"],
      ["2", "4"],
      ["3", "6"],
    ],
  ),
  "3-4": twoMixes(
    "Chef Kowalski's spice mix, in two batch sizes",
    "The small batch and the big batch are meant to taste the same.",
    [
      { name: "Small batch", a: 3, b: 5 },
      { name: "Big batch", a: 18, b: 30 },
    ],
    "tsp paprika",
    "tsp cumin",
  ),
  "3-5": twoMixes(
    "Two chefs, two cups of hot cocoa",
    "Each chef used a different ratio of cocoa to milk.",
    [
      { name: "Chef 1", a: 3, b: 5 },
      { name: "Chef 2", a: 4, b: 7 },
    ],
    "scoops cocoa",
    "cups milk",
  ),
  "3-6": twoMixes(
    "Two trays of vinaigrette at the tasting table",
    "Tray A and Tray B were each mixed from vinegar and oil.",
    [
      { name: "Tray A", a: 3, b: 9 },
      { name: "Tray B", a: 5, b: 15 },
    ],
    "tbsp vinegar",
    "tbsp oil",
  ),
  "3-7": recipeCard(
    "Two smoothie stands report their morning",
    "Each stand sold a different number of smoothies over a different number of hours.",
    "CHEF ACADEMY — MORNING SALES",
    [
      ["Stand A", "45 smoothies in 9 hours"],
      ["Stand B", "56 smoothies in 8 hours"],
    ],
  ),
};

for (const [id, svg] of Object.entries(out)) {
  const p = `lessons/${id}/reveal-assets/notice-wonder.svg`;
  writeFileSync(p, svg);
  console.log("wrote", p, svg.length, "bytes");
}
