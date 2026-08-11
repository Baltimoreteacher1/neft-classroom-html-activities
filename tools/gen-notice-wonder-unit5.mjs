#!/usr/bin/env node
// Replacement Notice & Wonder displays for Unit 5 (area).
//
// 5-1 is NOT here and was not touched: its image is a photograph of the Dockland
// building in Hamburg leaning over the water, and the prompt describes exactly
// that. 5-5 is not here either; it already had an accurate SVG.
//
// The other three needed figures rather than photographs. 5-2 asks about a
// trapezoidal window measuring 4 ft, 8 ft and 5 ft, and shipped a photo of the
// Casa Milan facade with no measurements on it. 5-3 asks about a rectangular
// park plot split by a diagonal path and shipped a wood-tile texture. 5-4 asks
// about a regular pentagon plaza divided from its centre and had no picture at
// all.
//
// Each figure carries only the measurements the prompt states. No area is
// computed, no formula is printed, and the diagonal/radii are drawn but never
// labelled with what they prove — that is the lesson.
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

// A right-angle tick, so "height" reads as perpendicular rather than slanted.
const rightAngle = (x, y, dx, dy) =>
  `<path d="M ${x} ${y - dy} L ${x + dx} ${y - dy} L ${x + dx} ${y}" fill="none" stroke="${NAVY}" stroke-width="1.6"/>`;

// ── 5-2: a trapezoid window, 4 ft top / 8 ft bottom / 5 ft tall ────────────
function trapezoidWindow() {
  const W = 660;
  const H = 340;
  const scale = 46;
  const bottom = 8 * scale;
  const top = 4 * scale;
  const height = 5 * scale;
  const cx = W / 2 + 20;
  const yb = 300;
  const yt = yb - height;
  const xbl = cx - bottom / 2;
  const xbr = cx + bottom / 2;
  const xtl = cx - top / 2;
  const xtr = cx + top / 2;

  const shape = `<polygon points="${xtl},${yt} ${xtr},${yt} ${xbr},${yb} ${xbl},${yb}" fill="rgba(42,157,143,0.18)" stroke="${NAVY}" stroke-width="2.5"/>`;
  // The height is drawn INSIDE the figure, from the top edge straight down.
  const hLine =
    `<line x1="${cx}" y1="${yt}" x2="${cx}" y2="${yb}" stroke="${CORAL}" stroke-width="2" stroke-dasharray="6 5"/>` +
    rightAngle(cx, yb, 14, 14) +
    `<text x="${cx + 12}" y="${(yt + yb) / 2}" font-size="16" font-weight="800" fill="${CORAL}">5 ft</text>`;
  const labels =
    `<text x="${cx}" y="${yt - 12}" font-size="16" font-weight="800" fill="${NAVY}" text-anchor="middle">4 ft</text>` +
    `<text x="${cx}" y="${yb + 26}" font-size="16" font-weight="800" fill="${NAVY}" text-anchor="middle">8 ft</text>`;

  return wrap(
    W,
    H,
    head(
      "The firm's trapezoidal window",
      "The two parallel edges are 4 ft and 8 ft. The height is measured straight up.",
    ) +
      shape +
      hLine +
      labels,
  );
}

// ── 5-3: a rectangular plot split corner-to-corner by a path ──────────────
function parkPlot() {
  const W = 680;
  const H = 330;
  const x0 = 120;
  const y0 = 96;
  const w = 420;
  const h = 180;

  const rect = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="none" stroke="${NAVY}" stroke-width="2.5"/>`;
  const bedA = `<polygon points="${x0},${y0} ${x0 + w},${y0} ${x0},${y0 + h}" fill="rgba(42,157,143,0.22)"/>`;
  const bedB = `<polygon points="${x0 + w},${y0} ${x0 + w},${y0 + h} ${x0},${y0 + h}" fill="rgba(233,196,106,0.35)"/>`;
  const path = `<line x1="${x0 + w}" y1="${y0}" x2="${x0}" y2="${y0 + h}" stroke="${CORAL}" stroke-width="3"/>`;
  const labels =
    `<text x="${x0 + w * 0.3}" y="${y0 + h * 0.32}" font-size="15" font-weight="800" fill="${NAVY}" text-anchor="middle">bed A</text>` +
    `<text x="${x0 + w * 0.7}" y="${y0 + h * 0.72}" font-size="15" font-weight="800" fill="${NAVY}" text-anchor="middle">bed B</text>` +
    `<text x="${x0 + w / 2}" y="${y0 + h + 28}" font-size="16" font-weight="800" fill="${NAVY}" text-anchor="middle">20 ft</text>` +
    `<text x="${x0 - 14}" y="${y0 + h / 2}" font-size="16" font-weight="800" fill="${NAVY}" text-anchor="end">14 ft</text>` +
    `<text x="${x0 + w - 8}" y="${y0 - 12}" font-size="14" font-weight="800" fill="${CORAL}" text-anchor="end">diagonal path</text>` +
    rightAngle(x0, y0 + h, 16, 16);

  return wrap(
    W,
    H,
    head(
      "Blueprint: a rectangular park plot, split by a diagonal path",
      "The path runs corner to corner, making two triangular garden beds.",
    ) +
      bedA +
      bedB +
      rect +
      path +
      labels,
  );
}

// ── 5-4: a regular pentagon plaza cut into 5 triangles from the centre ────
function pentagonPlaza() {
  const W = 620;
  const H = 380;
  const cx = W / 2;
  const cy = 220;
  const R = 120;

  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  const poly = `<polygon points="${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}" fill="rgba(42,157,143,0.16)" stroke="${NAVY}" stroke-width="2.5"/>`;
  const spokes = pts
    .map(
      (p) =>
        `<line x1="${cx}" y1="${cy}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}" stroke="${MUTED}" stroke-width="1.8" stroke-dasharray="6 5"/>`,
    )
    .join("");
  const centre = `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${NAVY}"/>`;

  // The apothem is drawn to the midpoint of the BOTTOM edge. With a vertex at
  // the top, that edge is horizontal and the apothem is exactly vertical, so it
  // reads as perpendicular at a glance. Drawn to an arbitrary edge it landed at
  // a slant and stopped short of the boundary.
  const yBottom = Math.max(...pts.map((q) => q[1]));
  const apothem =
    `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${yBottom.toFixed(1)}" stroke="${CORAL}" stroke-width="2.5"/>` +
    rightAngle(cx, yBottom, 14, 14) +
    `<text x="${cx + 12}" y="${((cy + yBottom) / 2).toFixed(1)}" font-size="14" font-weight="800" fill="${CORAL}">apothem</text>`;

  const side = `<text x="${cx}" y="${cy + R + 34}" font-size="16" font-weight="800" fill="${NAVY}" text-anchor="middle">each side: 10 ft</text>`;

  return wrap(
    W,
    H,
    head(
      "Blueprint: a regular pentagon plaza",
      "Dashed lines run from the centre to each of the 5 corners.",
    ) +
      poly +
      spokes +
      apothem +
      centre +
      side,
  );
}

const out = {
  "5-2": trapezoidWindow(),
  "5-3": parkPlot(),
  "5-4": pentagonPlaza(),
};

for (const [id, svg] of Object.entries(out)) {
  const p = `lessons/${id}/reveal-assets/notice-wonder.svg`;
  writeFileSync(p, svg);
  console.log("wrote", p, svg.length, "bytes");
}
