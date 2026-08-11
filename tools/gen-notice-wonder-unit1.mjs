#!/usr/bin/env node
// Replacement Notice & Wonder displays for Unit 1.
//
// Unit 1 shipped the images the Reveal Math extractor pulled off the publisher's
// slides, and none of them were about the lesson's own prompt: 1-3's "two robotic
// arms reset every 9 and 15 minutes" sat next to a stock photo of ski gondolas,
// 1-5's fuel-tank arithmetic next to a jar of coins, and 1-6's "$12.60 per meter"
// next to a photo of six students around a tablet. A student was asked to notice
// things about a picture that had nothing to do with the question.
//
// Each SVG below draws the lesson's ACTUAL scenario, and deliberately stops short
// of the answer — the branches, the totals and the products are left blank, so the
// picture asks the question the sentence starters are framed around instead of
// answering it. Writes lessons/<id>/reveal-assets/notice-wonder.svg.
//
// 1-2 and 1-7 are NOT here: their publisher images are real math visuals (a factor
// Venn diagram, three equal stacks of money), so those two lessons had their
// prompt text corrected to the picture instead.
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

const title = (x, y, text) =>
  `<text x="${x}" y="${y}" font-size="17" font-weight="700" fill="${INK}">${text}</text>`;

// ── 1-1 / 1-1-flagship: a factor tree with the branches left EMPTY ──────────
// The starters are "I notice 84 splits into ___ × ___", so the picture shows the
// number and the shape of the split, never the factors.
function blankFactorTree(n, caption) {
  const W = 560;
  // Tall enough that the root node clears the two heading lines — at H 320 the
  // "84" circle sat on top of the subtitle.
  const H = 360;
  const cx = W / 2;
  const node = (x, y, label, filled) =>
    `<circle cx="${x}" cy="${y}" r="30" fill="${filled ? TEAL : "#ffffff"}" stroke="${NAVY}" stroke-width="2.5"/>` +
    `<text x="${x}" y="${y + 8}" font-size="${filled ? 22 : 26}" font-weight="800" fill="${filled ? "#ffffff" : MUTED}" text-anchor="middle">${label}</text>`;
  const branch = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${NAVY}" stroke-width="2.5"/>`;

  const top = node(cx, 118, String(n), true);
  const mid = branch(cx - 16, 142, cx - 110, 206) + branch(cx + 16, 142, cx + 110, 206);
  const kids = node(cx - 130, 228, "?", false) + node(cx + 130, 228, "?", false);
  const low =
    branch(cx + 114, 252, cx + 60, 300) +
    branch(cx + 146, 252, cx + 200, 300) +
    node(cx + 46, 320, "?", false) +
    node(cx + 214, 320, "?", false);

  return wrap(
    W,
    H,
    title(28, 34, caption) +
      `<text x="28" y="58" font-size="15" font-weight="700" fill="${TEAL}">What two numbers could go in the first split?</text>` +
      top +
      mid +
      kids +
      low,
  );
}

// ── 1-3: two repeating cycles on one timeline (LCM of 9 and 15) ─────────────
function twoCycles() {
  const W = 820;
  const H = 300;
  const x0 = 60;
  const x1 = 760;
  const maxT = 50;
  const px = (t) => x0 + (t / maxT) * (x1 - x0);
  const rowA = 120;
  const rowB = 200;

  let axis = `<line x1="${x0}" y1="${rowA}" x2="${x1}" y2="${rowA}" stroke="${NAVY}" stroke-width="2"/>`;
  axis += `<line x1="${x0}" y1="${rowB}" x2="${x1}" y2="${rowB}" stroke="${NAVY}" stroke-width="2"/>`;

  let marks = "";
  for (let t = 9; t <= maxT; t += 9) {
    marks += `<circle cx="${px(t)}" cy="${rowA}" r="9" fill="${TEAL}" stroke="${NAVY}" stroke-width="1.5"/>`;
    marks += `<text x="${px(t)}" y="${rowA - 18}" font-size="14" font-weight="700" fill="${INK}" text-anchor="middle">${t}</text>`;
  }
  for (let t = 15; t <= maxT; t += 15) {
    marks += `<rect x="${px(t) - 9}" y="${rowB - 9}" width="18" height="18" fill="${AMBER}" stroke="${NAVY}" stroke-width="1.5"/>`;
    marks += `<text x="${px(t)}" y="${rowB + 32}" font-size="14" font-weight="700" fill="${INK}" text-anchor="middle">${t}</text>`;
  }
  // Deliberately NO guide line at 45. Both arms do reset together there, and
  // spotting that is the whole noticing — a dashed rule through it would hand the
  // answer over before a student had looked.
  const align = "";

  const labels =
    `<text x="${x0 - 8}" y="${rowA + 6}" font-size="15" font-weight="800" fill="${TEAL}" text-anchor="end">Arm A</text>` +
    `<text x="${x0 - 8}" y="${rowB + 6}" font-size="15" font-weight="800" fill="#b8860b" text-anchor="end">Arm B</text>` +
    `<text x="${x1}" y="${rowB + 70}" font-size="15" fill="${MUTED}" text-anchor="end">minutes since both arms last reset together</text>`;

  return wrap(
    W,
    H,
    title(28, 36, "Arm A resets every 9 minutes. Arm B resets every 15 minutes.") +
      `<text x="28" y="60" font-size="15" font-weight="700" fill="${TEAL}">Both just reset at the same moment. When does that happen again?</text>` +
      align +
      axis +
      marks +
      labels,
  );
}

// ── 1-4: 13,275 students shared equally among 15 schools ────────────────────
function shareBar() {
  const W = 800;
  const H = 300;
  const x0 = 50;
  const x1 = 750;
  const y = 120;
  const h = 62;
  const parts = 15;
  const pw = (x1 - x0) / parts;

  let cells = "";
  for (let i = 0; i < parts; i++) {
    cells += `<rect x="${x0 + i * pw}" y="${y}" width="${pw}" height="${h}" fill="${i % 2 ? "rgba(42,157,143,0.16)" : "rgba(233,196,106,0.28)"}" stroke="${NAVY}" stroke-width="1.2"/>`;
    cells += `<text x="${x0 + i * pw + pw / 2}" y="${y + h / 2 + 7}" font-size="17" font-weight="800" fill="${MUTED}" text-anchor="middle">?</text>`;
  }
  const brace =
    `<line x1="${x0}" y1="${y - 16}" x2="${x1}" y2="${y - 16}" stroke="${NAVY}" stroke-width="2"/>` +
    `<line x1="${x0}" y1="${y - 24}" x2="${x0}" y2="${y - 8}" stroke="${NAVY}" stroke-width="2"/>` +
    `<line x1="${x1}" y1="${y - 24}" x2="${x1}" y2="${y - 8}" stroke="${NAVY}" stroke-width="2"/>` +
    `<text x="${(x0 + x1) / 2}" y="${y - 30}" font-size="22" font-weight="800" fill="${NAVY}" text-anchor="middle">13,275 students in all</text>`;

  return wrap(
    W,
    H,
    title(28, 36, "One school district, 15 elementary schools, shared equally") +
      `<text x="28" y="60" font-size="15" font-weight="700" fill="${TEAL}">Every school gets the same number of students.</text>` +
      brace +
      cells +
      `<text x="${(x0 + x1) / 2}" y="${y + h + 34}" font-size="16" font-weight="700" fill="${INK}" text-anchor="middle">15 equal groups — how many students in each?</text>`,
  );
}

// ── 1-5: fuel tank, one amount added and one burned ─────────────────────────
function fuelTank() {
  const W = 760;
  const H = 320;
  const y = 150;
  const h = 66;
  const x0 = 60;
  const startW = 300;
  const addW = 110;

  const start = `<rect x="${x0}" y="${y}" width="${startW}" height="${h}" fill="rgba(42,157,143,0.28)" stroke="${NAVY}" stroke-width="2"/><text x="${x0 + startW / 2}" y="${y + h / 2 + 8}" font-size="22" font-weight="800" fill="${NAVY}" text-anchor="middle">128.75 L</text>`;
  const add = `<rect x="${x0 + startW}" y="${y}" width="${addW}" height="${h}" fill="rgba(233,196,106,0.45)" stroke="${NAVY}" stroke-width="2"/><text x="${x0 + startW + addW / 2}" y="${y + h / 2 + 7}" font-size="17" font-weight="800" fill="${NAVY}" text-anchor="middle">+46.8</text>`;
  const burn = `<rect x="${x0 + startW + addW}" y="${y}" width="70" height="${h}" fill="rgba(217,121,93,0.30)" stroke="${NAVY}" stroke-width="2" stroke-dasharray="6 4"/><text x="${x0 + startW + addW + 35}" y="${y + h / 2 + 7}" font-size="17" font-weight="800" fill="${CORAL}" text-anchor="middle">−19.35</text>`;
  const end = `<rect x="${x0 + startW + addW + 70}" y="${y}" width="130" height="${h}" fill="#ffffff" stroke="${NAVY}" stroke-width="2" stroke-dasharray="4 5"/><text x="${x0 + startW + addW + 135}" y="${y + h / 2 + 8}" font-size="26" font-weight="800" fill="${MUTED}" text-anchor="middle">?</text>`;

  // The last two captions sit over 70px and 130px of bar, so they are staggered
  // onto two rows — side by side they collided ("thrusters butank after").
  const caps =
    `<text x="${x0}" y="${y - 14}" font-size="14" font-weight="800" fill="${TEAL}">tank now</text>` +
    `<text x="${x0 + startW}" y="${y - 14}" font-size="14" font-weight="800" fill="#b8860b">shuttle delivers</text>` +
    `<text x="${x0 + startW + addW + 35}" y="${y - 34}" font-size="14" font-weight="800" fill="${CORAL}" text-anchor="middle">thrusters burn</text>` +
    `<line x1="${x0 + startW + addW + 35}" y1="${y - 28}" x2="${x0 + startW + addW + 35}" y2="${y - 4}" stroke="${CORAL}" stroke-width="1.5"/>` +
    `<text x="${x0 + startW + addW + 135}" y="${y - 14}" font-size="14" font-weight="800" fill="${MUTED}" text-anchor="middle">tank after</text>`;

  return wrap(
    W,
    H,
    title(28, 40, "Station fuel tank: one delivery in, one burn out") +
      `<text x="28" y="64" font-size="15" font-weight="700" fill="${TEAL}">128.75 L, then +46.8 L, then −19.35 L. Every amount is in liters.</text>` +
      caps +
      start +
      add +
      burn +
      end +
      `<text x="${W / 2}" y="${y + h + 46}" font-size="16" font-weight="700" fill="${INK}" text-anchor="middle">The decimal points have to line up before you can add or subtract.</text>`,
  );
}

// ── 1-6: 4.5 meters of shielding at $12.60 per meter (area model) ───────────
function shieldingArea() {
  const W = 700;
  const H = 340;
  const x0 = 150;
  const y0 = 90;
  // Columns split 12 + 0.60, rows split 4 + 0.5 — the decomposition a student
  // needs to see, with none of the four partial products filled in.
  const wWhole = 340;
  const wPart = 70;
  const hWhole = 150;
  const hPart = 40;

  const cell = (x, y, w, h, fill) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${NAVY}" stroke-width="2"/>` +
    `<text x="${x + w / 2}" y="${y + h / 2 + 8}" font-size="22" font-weight="800" fill="${MUTED}" text-anchor="middle">?</text>`;

  const grid =
    cell(x0, y0, wWhole, hWhole, "rgba(42,157,143,0.18)") +
    cell(x0 + wWhole, y0, wPart, hWhole, "rgba(233,196,106,0.35)") +
    cell(x0, y0 + hWhole, wWhole, hPart, "rgba(233,196,106,0.35)") +
    cell(x0 + wWhole, y0 + hWhole, wPart, hPart, "rgba(217,121,93,0.25)");

  const cols =
    `<text x="${x0 + wWhole / 2}" y="${y0 - 14}" font-size="18" font-weight="800" fill="${NAVY}" text-anchor="middle">$12</text>` +
    `<text x="${x0 + wWhole + wPart / 2}" y="${y0 - 14}" font-size="16" font-weight="800" fill="#b8860b" text-anchor="middle">$0.60</text>` +
    "";
  const rows =
    `<text x="${x0 - 16}" y="${y0 + hWhole / 2 + 7}" font-size="18" font-weight="800" fill="${NAVY}" text-anchor="end">4 m</text>` +
    `<text x="${x0 - 16}" y="${y0 + hWhole + hPart / 2 + 6}" font-size="16" font-weight="800" fill="#b8860b" text-anchor="end">0.5 m</text>` +
    `<text x="${x0 - 96}" y="${y0 + (hWhole + hPart) / 2 + 6}" font-size="16" font-weight="700" fill="${INK}" text-anchor="middle">4.5 m of</text>` +
    `<text x="${x0 - 96}" y="${y0 + (hWhole + hPart) / 2 + 26}" font-size="16" font-weight="700" fill="${INK}" text-anchor="middle">shielding</text>`;

  return wrap(
    W,
    H,
    title(28, 34, "4.5 meters of heat shielding at $12.60 per meter") +
      `<text x="28" y="58" font-size="15" font-weight="700" fill="${TEAL}">Each piece of the rectangle is one part of the total cost.</text>` +
      cols +
      rows +
      grid,
  );
}

const out = {
  "1-1": blankFactorTree(84, "84 circuit boards, packed in equal crates"),
  "1-1-flagship": blankFactorTree(126, "126 thruster bolts, sorted into equal groups"),
  "1-3": twoCycles(),
  "1-4": shareBar(),
  "1-5": fuelTank(),
  "1-6": shieldingArea(),
};
for (const [id, svg] of Object.entries(out)) {
  const p = `lessons/${id}/reveal-assets/notice-wonder.svg`;
  writeFileSync(p, svg);
  console.log("wrote", p, svg.length, "bytes");
}
