#!/usr/bin/env node
// Replacement Notice & Wonder displays for Unit 6 (expressions).
//
// 6-1 is NOT here and was not touched: its image is three figures built from
// square groups of tiles growing 2x2, 4x4, 8x8, and the prompt describes exactly
// that. 6-2, 6-3 and 6-6 already had accurate SVGs.
//
// 6-4 shipped a blue architectural FLOOR PLAN — living room, kitchen, stairs — for
// a prompt about a sound engineer adding three mixing-board levels four different
// ways. 6-5 and 6-7 had no picture at all.
//
// Each drawing shows the SAME quantity written more than one way, side by side,
// with the totals left blank. Seeing that the arrangements differ but the amount
// does not is the noticing; the picture never says the totals are equal.
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

// ── 6-4: one sum, written four ways, every total left blank ───────────────
function fourWays() {
  const W = 760;
  const H = 340;
  const rows = ["15 + 22 + 8", "8 + 15 + 22", "(15 + 22) + 8", "15 + (22 + 8)"];
  const x0 = 70;
  const y0 = 92;
  const cw = 620;
  const rh = 54;

  let body = "";
  rows.forEach((r, i) => {
    const y = y0 + i * (rh + 8);
    body += `<rect x="${x0}" y="${y}" width="${cw}" height="${rh}" rx="9" fill="${i % 2 ? "rgba(233,196,106,0.22)" : "rgba(42,157,143,0.14)"}" stroke="${NAVY}" stroke-width="1.6"/>`;
    body += `<text x="${x0 + 22}" y="${y + 35}" font-size="22" font-weight="800" fill="${NAVY}">${r}</text>`;
    body += `<text x="${x0 + cw - 90}" y="${y + 35}" font-size="22" font-weight="800" fill="${MUTED}">=</text>`;
    body += `<rect x="${x0 + cw - 68}" y="${y + 11}" width="52" height="32" rx="6" fill="#ffffff" stroke="${MUTED}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
  });

  return wrap(
    W,
    H,
    head(
      "Guitar 15, bass 22, drums 8 — the engineer's sum, written four ways",
      "Same three channels every time. Only the order and the grouping change.",
    ) + body,
  );
}

// ── 6-5: an order form writing 9 bundles two ways ─────────────────────────
function orderForm() {
  const W = 780;
  const H = 360;
  const y0 = 100;
  const bw = 320;
  const bh = 150;

  const bundle =
    `<rect x="60" y="${y0}" width="${bw}" height="${bh}" rx="10" fill="rgba(42,157,143,0.12)" stroke="${NAVY}" stroke-width="2"/>` +
    `<text x="${60 + bw / 2}" y="${y0 + 34}" font-size="16" font-weight="800" fill="${NAVY}" text-anchor="middle">ONE BUNDLE</text>` +
    `<text x="${60 + bw / 2}" y="${y0 + 76}" font-size="19" font-weight="700" fill="${INK}" text-anchor="middle">t-shirt  $18</text>` +
    `<text x="${60 + bw / 2}" y="${y0 + 108}" font-size="19" font-weight="700" fill="${INK}" text-anchor="middle">strap  $7</text>` +
    `<text x="${60 + bw / 2}" y="${y0 + bh + 30}" font-size="16" font-weight="800" fill="${CORAL}" text-anchor="middle">9 band members = 9 bundles</text>`;

  const x1 = 60 + bw + 60;
  const two =
    `<rect x="${x1}" y="${y0}" width="${bw}" height="${bh}" rx="10" fill="#fffdf6" stroke="${NAVY}" stroke-width="2"/>` +
    `<text x="${x1 + bw / 2}" y="${y0 + 34}" font-size="16" font-weight="800" fill="${NAVY}" text-anchor="middle">THE ORDER FORM WRITES IT</text>` +
    `<text x="${x1 + bw / 2}" y="${y0 + 78}" font-size="23" font-weight="800" fill="${TEAL}" text-anchor="middle">9(18 + 7)</text>` +
    `<text x="${x1 + bw / 2}" y="${y0 + 110}" font-size="14" font-weight="700" fill="${MUTED}" text-anchor="middle">and also</text>` +
    `<text x="${x1 + bw / 2}" y="${y0 + 140}" font-size="23" font-weight="800" fill="${CORAL}" text-anchor="middle">9 × 18 + 9 × 7</text>`;

  return wrap(
    W,
    H,
    head(
      "A merch order for 9 band members, written two ways",
      "Same order, same bundles — two different expressions on the form.",
    ) +
      bundle +
      two,
  );
}

// ── 6-7: the same gear listed item by item, then grouped ──────────────────
function gearList() {
  const W = 780;
  const H = 360;
  const y0 = 100;
  const bw = 300;
  const bh = 200;

  const itemRow = (x, y, kind) => {
    const isMic = kind === "mic";
    return isMic
      ? `<circle cx="${x}" cy="${y}" r="13" fill="rgba(42,157,143,0.45)" stroke="${NAVY}" stroke-width="1.8"/><rect x="${x - 2.5}" y="${y + 12}" width="5" height="16" fill="${NAVY}"/>`
      : `<path d="M ${x - 12} ${y + 16} L ${x} ${y - 12} L ${x + 12} ${y + 16} Z" fill="rgba(233,196,106,0.6)" stroke="${NAVY}" stroke-width="1.8"/>`;
  };

  // Left: written out one at a time, in the order the prompt lists them.
  const seq = ["mic", "mic", "stand", "mic", "stand"];
  let left = `<rect x="60" y="${y0}" width="${bw}" height="${bh}" rx="10" fill="#fffdf6" stroke="${NAVY}" stroke-width="2"/>`;
  left += `<text x="${60 + bw / 2}" y="${y0 + 30}" font-size="15" font-weight="800" fill="${NAVY}" text-anchor="middle">LISTED ITEM BY ITEM</text>`;
  seq.forEach((k, i) => {
    left += itemRow(60 + 46 + i * 52, y0 + 92, k);
  });
  left += `<text x="${60 + bw / 2}" y="${y0 + 168}" font-size="15" font-weight="700" fill="${MUTED}" text-anchor="middle">mic, mic, stand, mic, stand</text>`;

  const x1 = 60 + bw + 60;
  let right = `<rect x="${x1}" y="${y0}" width="${bw}" height="${bh}" rx="10" fill="rgba(42,157,143,0.10)" stroke="${NAVY}" stroke-width="2"/>`;
  right += `<text x="${x1 + bw / 2}" y="${y0 + 30}" font-size="15" font-weight="800" fill="${NAVY}" text-anchor="middle">GROUPED TOGETHER</text>`;
  ["mic", "mic", "mic"].forEach((k, i) => {
    right += itemRow(x1 + 62 + i * 44, y0 + 82, k);
  });
  ["stand", "stand"].forEach((k, i) => {
    right += itemRow(x1 + 200 + i * 44, y0 + 82, k);
  });
  right += `<text x="${x1 + 106}" y="${y0 + 140}" font-size="16" font-weight="800" fill="${TEAL}" text-anchor="middle">3 microphones</text>`;
  right += `<text x="${x1 + 222}" y="${y0 + 168}" font-size="16" font-weight="800" fill="#b8860b" text-anchor="middle">2 stands</text>`;

  return wrap(
    W,
    H,
    head(
      "One studio order, listed two different ways",
      "Nothing was added or taken away between the two lists.",
    ) +
      left +
      right,
  );
}

const out = {
  "6-4": fourWays(),
  "6-5": orderForm(),
  "6-7": gearList(),
};

for (const [id, svg] of Object.entries(out)) {
  const p = `lessons/${id}/reveal-assets/notice-wonder.svg`;
  writeFileSync(p, svg);
  console.log("wrote", p, svg.length, "bytes");
}
