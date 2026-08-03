#!/usr/bin/env node
// Replacement Notice & Wonder displays for Unit 4.
//
// 4-5 is NOT here and was not touched: its publisher image is a pie chart of
// snack preferences (45% fruit, 30% cheese sticks, 25% veggie sticks) and the
// prompt describes exactly that, so it is one of the few pairings in the corpus
// that was already right.
//
// 4-4 is not here either. Its image is a row of five phone BATTERY icons at 5/5
// down to 1/5 — a real percent visual — but the prompt called it a storage bar on
// a 200 GB phone, so that lesson had its text corrected to the picture instead.
//
// The rest draw the thing their own prompt names: two arcade token signs, a
// leaderboard showing 150% and a 0.5% boost, a Canadian speed-limit sign, and a
// shelf tag with two juice-box deals (4-7 had no picture at all).
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

// ── Two price signs side by side (4-1 tokens, 4-7 juice boxes) ─────────────
function twoSigns(title, subtitle, signs) {
  const W = 760;
  const H = 320;
  const bw = 300;
  const bh = 180;
  const y0 = 96;
  let out = "";
  signs.forEach((s, i) => {
    const x = 60 + i * (bw + 40);
    const accent = i === 0 ? TEAL : CORAL;
    out += `<rect x="${x}" y="${y0}" width="${bw}" height="${bh}" rx="14" fill="#fffdf6" stroke="${NAVY}" stroke-width="2.5"/>`;
    out += `<rect x="${x}" y="${y0}" width="${bw}" height="44" rx="14" fill="${accent}"/>`;
    out += `<rect x="${x}" y="${y0 + 30}" width="${bw}" height="14" fill="${accent}"/>`;
    out += `<text x="${x + bw / 2}" y="${y0 + 30}" font-size="16" font-weight="800" fill="#ffffff" text-anchor="middle">${s.name}</text>`;
    out += `<text x="${x + bw / 2}" y="${y0 + 102}" font-size="34" font-weight="800" fill="${NAVY}" text-anchor="middle">${s.qty}</text>`;
    out += `<text x="${x + bw / 2}" y="${y0 + 136}" font-size="17" font-weight="700" fill="${MUTED}" text-anchor="middle">for</text>`;
    out += `<text x="${x + bw / 2}" y="${y0 + 168}" font-size="30" font-weight="800" fill="${accent}" text-anchor="middle">${s.price}</text>`;
  });
  out += `<text x="${W / 2}" y="${H - 24}" font-size="16" font-weight="700" fill="${INK}" text-anchor="middle">${subtitle.endsWith("?") ? "" : "Different amounts, different prices."}</text>`;
  return wrap(W, H, head(title, subtitle) + out);
}

// ── 4-3: a leaderboard row showing a percent over 100 and one under 1 ──────
function leaderboard() {
  const W = 720;
  const H = 320;
  const x0 = 60;
  const barW = 400;
  const y = 130;
  const h = 44;

  // 150% of the goal: the goal is one bar-width, and the score runs half again
  // past the end of it.
  const goal = `<rect x="${x0}" y="${y}" width="${barW}" height="${h}" fill="#ffffff" stroke="${MUTED}" stroke-width="1.5" stroke-dasharray="6 5"/><text x="${x0 + barW}" y="${y - 12}" font-size="14" font-weight="800" fill="${MUTED}" text-anchor="middle">weekly goal = 100%</text>`;
  const score = `<rect x="${x0}" y="${y}" width="${barW * 1.5}" height="${h}" fill="rgba(42,157,143,0.35)" stroke="${NAVY}" stroke-width="2"/><text x="${x0 + 16}" y="${y + 30}" font-size="20" font-weight="800" fill="${NAVY}">150% scored</text>`;

  const boostY = y + 110;
  const boost =
    `<rect x="${x0}" y="${boostY}" width="${barW}" height="26" fill="#ffffff" stroke="${MUTED}" stroke-width="1.5"/>` +
    `<rect x="${x0}" y="${boostY}" width="${barW * 0.005}" height="26" fill="${CORAL}" stroke="${CORAL}" stroke-width="1.5"/>` +
    `<text x="${x0 + 14}" y="${boostY + 52}" font-size="16" font-weight="800" fill="${CORAL}">the 0.5% bonus, drawn to the same scale</text>`;

  return wrap(
    W,
    H,
    head(
      "Arcade leaderboard: one score above the goal, one tiny bonus",
      "The dashed box is the whole weekly goal.",
    ) +
      // Score first, then the goal outline on top of it — drawn the other way
      // round the filled bar covered the dashed box it is meant to be compared
      // against, which is the entire point of the picture.
      score +
      goal +
      boost,
  );
}

// ── 4-6: a Canadian speed-limit sign ───────────────────────────────────────
function speedSign() {
  const W = 640;
  const H = 340;
  const cx = W / 2;
  const sign =
    `<rect x="${cx - 90}" y="90" width="180" height="200" rx="10" fill="#ffffff" stroke="${NAVY}" stroke-width="5"/>` +
    `<text x="${cx}" y="140" font-size="20" font-weight="800" fill="${NAVY}" text-anchor="middle">MAXIMUM</text>` +
    `<text x="${cx}" y="222" font-size="72" font-weight="800" fill="${NAVY}" text-anchor="middle">100</text>` +
    `<text x="${cx}" y="262" font-size="26" font-weight="800" fill="${NAVY}" text-anchor="middle">km/h</text>`;
  const aside =
    `<text x="${cx + 140}" y="176" font-size="16" font-weight="700" fill="${MUTED}">Evelyn is used to</text>` +
    `<text x="${cx + 140}" y="200" font-size="16" font-weight="700" fill="${MUTED}">signs in miles per</text>` +
    `<text x="${cx + 140}" y="224" font-size="16" font-weight="700" fill="${MUTED}">hour, not km/h.</text>` +
    `<text x="${cx + 140}" y="256" font-size="26" font-weight="800" fill="${CORAL}">? mi/h</text>`;
  return wrap(
    W,
    H,
    head("A highway sign in Canada", "Same speed limit, a different unit on the sign.") +
      sign +
      aside,
  );
}

const out = {
  "4-1": twoSigns(
    "Two arcade booths, two token deals",
    "Each booth sells a different number of tokens for a different price.",
    [
      { name: "BOOTH 1", qty: "5 tokens", price: "$3.00" },
      { name: "BOOTH 2", qty: "8 tokens", price: "$5.00" },
    ],
  ),
  // 4-1-flagship runs the same two-booth comparison as 4-1 with its own prices.
  "4-1-flagship": twoSigns(
    "Two ticket booths at NeonPlex Arcade",
    "The two signs quote the same thing in opposite orders.",
    [
      { name: "BOOTH A", qty: "5 games", price: "$3.00" },
      { name: "BOOTH B", qty: "8 games", price: "$5.00" },
    ],
  ),
  "4-3": leaderboard(),
  "4-6": speedSign(),
  "4-7": twoSigns(
    "One shelf tag, two deals on the same juice boxes",
    "Same brand, same juice — only the pack size and the price change.",
    [
      { name: "DEAL A", qty: "6-pack", price: "$3.00" },
      { name: "DEAL B", qty: "10-pack", price: "$4.50" },
    ],
  ),
};

for (const [id, svg] of Object.entries(out)) {
  const p = `lessons/${id}/reveal-assets/notice-wonder.svg`;
  writeFileSync(p, svg);
  console.log("wrote", p, svg.length, "bytes");
}
