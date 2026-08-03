#!/usr/bin/env node
// Replacement Notice & Wonder displays for the three lessons in Units 8-10 that
// had no picture at all: 8-7 (two dot plots), 9-7 (a map folded on the x-axis)
// and 10-1 (two time capsules).
//
// The rest of Units 8, 9 and 10 were checked and left alone — they are where the
// publisher pairings actually hold up. 8-1's five national-park photographs, 8-2
// and 8-4's teacher-experience survey, 8-3's weekly forecast, 8-5's race-time
// table, 8-6's histogram, 9-5's eight-petal flower on the grid, 9-6's town map,
// and Unit 10's prisms, nets, chest and pyramid blueprint all show what their
// prompt describes. (2-1 and 7-7 had been reusing 8-1's and 9-5's slides; those
// were fixed in their own units.)
//
// 9-1 is the exception and is handled as a text fix, not here: its grid is fine,
// but the prompt claimed all three plotted points were right of and above the
// origin when two of them are not.
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

// ── 8-7: two dot plots, one with a far-out value and one tightly packed ────
function twoDotPlots() {
  const W = 840;
  const H = 420;

  // One plot: an axis with a dot stack over each value.
  const plot = (y, values, lo, hi, tickStep, label, colour, fmt) => {
    const x0 = 90;
    const x1 = 800;
    const px = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    let s = `<text x="28" y="${y - 62}" font-size="15" font-weight="800" fill="${colour}">${label}</text>`;
    s += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${NAVY}" stroke-width="2"/>`;
    for (let v = lo; v <= hi + 1e-9; v += tickStep) {
      s += `<line x1="${px(v)}" y1="${y - 6}" x2="${px(v)}" y2="${y + 6}" stroke="${NAVY}" stroke-width="1.4"/>`;
      s += `<text x="${px(v)}" y="${y + 26}" font-size="12" font-weight="700" fill="${INK}" text-anchor="middle">${fmt(v)}</text>`;
    }
    const counts = new Map();
    for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
    for (const [v, n] of counts) {
      for (let k = 0; k < n; k++) {
        s += `<circle cx="${px(v)}" cy="${y - 14 - k * 17}" r="6.5" fill="${colour}" stroke="${NAVY}" stroke-width="1.3"/>`;
      }
    }
    return s;
  };

  const ages = plot(
    160,
    [18, 19, 20, 20, 21, 21, 22, 68],
    15,
    70,
    5,
    "Fan ages at last night's game",
    CORAL,
    (v) => String(v),
  );
  const shoes = plot(
    350,
    [9, 10, 10, 10.5, 11, 11, 11.5],
    8.5,
    12,
    0.5,
    "Roster shoe sizes",
    TEAL,
    (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1)),
  );

  return wrap(
    W,
    H,
    head("Two dot plots from the team's data analyst", "Same kind of picture, two very different shapes.") +
      ages +
      shoes,
  );
}

// ── 9-7: a grid folded along the x-axis, one point and its match ──────────
function foldedMap() {
  const W = 620;
  const H = 420;
  const cx = 300;
  const cy = 210;
  const u = 34;
  const lo = -6;
  const hi = 6;
  const px = (v) => cx + v * u;
  const py = (v) => cy - v * u;

  let grid = "";
  for (let i = lo; i <= hi; i++) {
    grid += `<line x1="${px(i)}" y1="${py(hi)}" x2="${px(i)}" y2="${py(lo)}" stroke="#dbe6ec" stroke-width="1"/>`;
    grid += `<line x1="${px(lo)}" y1="${py(i)}" x2="${px(hi)}" y2="${py(i)}" stroke="#dbe6ec" stroke-width="1"/>`;
  }
  const axes =
    `<line x1="${px(lo)}" y1="${cy}" x2="${px(hi)}" y2="${cy}" stroke="${NAVY}" stroke-width="2.4"/>` +
    `<line x1="${cx}" y1="${py(hi)}" x2="${cx}" y2="${py(lo)}" stroke="${NAVY}" stroke-width="2.4"/>` +
    `<text x="${px(hi) + 10}" y="${cy + 5}" font-size="15" font-weight="800" fill="${NAVY}">x</text>` +
    `<text x="${cx + 8}" y="${py(hi) - 8}" font-size="15" font-weight="800" fill="${NAVY}">y</text>`;

  // The fold line IS the x-axis, drawn over it so the crease is visible.
  const fold = `<line x1="${px(lo)}" y1="${cy}" x2="${px(hi)}" y2="${cy}" stroke="${CORAL}" stroke-width="2.6" stroke-dasharray="9 6"/><text x="${px(lo) + 4}" y="${cy - 10}" font-size="13" font-weight="800" fill="${CORAL}">fold line</text>`;

  const tower = (x, y, fill, label) =>
    `<path d="M ${x - 9} ${y + 9} L ${x} ${y - 12} L ${x + 9} ${y + 9} Z" fill="${fill}" stroke="${NAVY}" stroke-width="1.8"/>` +
    `<text x="${x + 16}" y="${y + 5}" font-size="14" font-weight="800" fill="${NAVY}">${label}</text>`;

  const towers = tower(px(5), py(2), "rgba(42,157,143,0.6)", "(5, 2)") + tower(px(5), py(-2), "rgba(233,196,106,0.7)", "(5, −2)");
  const link = `<line x1="${px(5)}" y1="${py(2)}" x2="${px(5)}" y2="${py(-2)}" stroke="${MUTED}" stroke-width="1.6" stroke-dasharray="4 4"/>`;

  return wrap(
    W,
    H,
    head("Captain Vega's map, folded along the x-axis", "The lookout tower and the tower it lands on.") +
      grid +
      axes +
      fold +
      link +
      towers,
  );
}

// ── 10-1: two time capsules with every edge labelled ─────────────────────
function twoCapsules() {
  const W = 800;
  const H = 380;

  // A simple oblique box: front face plus a depth offset.
  const box = (ox, oy, w, h, d, name, dims, fill) => {
    const s = 1;
    const x = ox;
    const y = oy;
    let g = `<polygon points="${x},${y} ${x + w},${y} ${x + w + d * s},${y - d * s} ${x + d * s},${y - d * s}" fill="${fill}" fill-opacity="0.75" stroke="${NAVY}" stroke-width="2"/>`;
    g += `<polygon points="${x + w},${y} ${x + w},${y + h} ${x + w + d * s},${y + h - d * s} ${x + w + d * s},${y - d * s}" fill="${fill}" fill-opacity="0.5" stroke="${NAVY}" stroke-width="2"/>`;
    g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" fill-opacity="0.9" stroke="${NAVY}" stroke-width="2"/>`;
    g += `<text x="${x + w / 2}" y="${y + h + 34}" font-size="16" font-weight="800" fill="${NAVY}" text-anchor="middle">${name}</text>`;
    g += `<text x="${x + w / 2}" y="${y + h + 56}" font-size="14" font-weight="700" fill="${MUTED}" text-anchor="middle">${dims}</text>`;
    return g;
  };

  // Drawn to scale against each other: A is 4x3x8, B is 6x6x6.
  const k = 17;
  const a = box(120, 140, 4 * k, 8 * k, 3 * k, "Capsule A", "4 in x 3 in x 8 in", "rgba(42,157,143,0.55)");
  const b = box(430, 174, 6 * k, 6 * k, 6 * k, "Capsule B", "6 in x 6 in x 6 in", "rgba(233,196,106,0.75)");

  const aside = `<text x="${W / 2}" y="${H - 18}" font-size="16" font-weight="700" fill="${INK}" text-anchor="middle">A classmate says Capsule A must hold more, because it looks taller.</text>`;

  return wrap(
    W,
    H,
    head("Two time capsules, side by side", "Both are drawn to the same scale.") + a + b + aside,
  );
}

const out = {
  "8-7": twoDotPlots(),
  "9-7": foldedMap(),
  "10-1": twoCapsules(),
};

for (const [id, svg] of Object.entries(out)) {
  const p = `lessons/${id}/reveal-assets/notice-wonder.svg`;
  writeFileSync(p, svg);
  console.log("wrote", p, svg.length, "bytes");
}
