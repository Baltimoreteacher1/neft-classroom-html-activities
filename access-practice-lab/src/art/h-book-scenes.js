// Book Studio backgrounds (400x300, cover-safe: the subject sits in the central 60% and the lower third stays open
// enough for characters to stand on). Drawn with the illustration kit; call inside noDefs() so every copy is id-free.
// Gradients are replaced by soft stepped bands. Only src/book/art.js imports this file.

import {
  P,
  shade,
  light,
  haze,
  mix,
  rng,
  rect,
  rrect,
  circle,
  ellipse,
  path,
  line,
  stroke,
  contact,
  cloud,
  sun,
  moon,
  stars,
  hills,
  ground,
  pathway,
  tree,
  flower,
  tuft,
  bench,
  building,
  house,
  road,
  wallWindow,
  board,
  clock,
  stall,
  umbrella,
} from "./kit.js";

const W = 400;
const wide = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><g stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;

/** Soft vertical blend from c0 to c1 in n flat steps (no gradient ids). */
const bands = (y, h, c0, c1, n0 = 8, x = 0, w = W) => {
  const n = Math.max(n0, Math.round(h / 9));
  let s = "";
  for (let i = 0; i < n; i++) {
    const y0 = Math.round(y + (h / n) * i);
    s += rect(x, y0, w, Math.round(y + (h / n) * (i + 1)) - y0 + 1, mix(c0, c1, i / (n - 1)));
  }
  return `<g shape-rendering="crispEdges">${s}</g>`;
};
const daySky = (h = 300) => bands(0, h, "#8ec5e0", "#e8f3f1", 14);
/** Soft warm light pooling on an interior wall. */
const glow = (x, y, rx, ry, c = "#fff4d6", o = 0.2) => ellipse(x, y, rx, ry, c, `opacity="${o}"`);
const baseboard = (y, c = P.ivory) => rect(0, y - 8, W, 9, c) + rect(0, y, W, 3, shade(c, 0.18));
/** Small potted plant standing on (x, y). */
const plant = (x, y, s = 1, pot = P.coral) =>
  `<g transform="translate(${x} ${y}) scale(${s})">${contact(0, 0, 18, 3.5, 0.2)}${path("M-14 -24h28l-4 24h-20z", pot)}${path("M3 -24h11l-4 24h-7z", shade(pot, 0.2))}${rect(-16, -28, 32, 6, light(pot, 0.12))}${path("M0 -28q-24-14-18-40q14 10 18 40z", P.leaf)}${path("M0 -28q22-18 14-44q-16 14-14 44z", P.leafDark)}${path("M0 -28q-4-30 6-50q8 26-6 50z", P.leafLight)}</g>`;
/** Shelf board with simple jars and books (palette-safe, no violet). */
const shelfItems = (x, y, w, seed, tall = 30) => {
  const R = rng(seed);
  const cols = [P.coral, P.teal, P.gold, P.navy, "#3fa79a", P.orange, "#e9e2d0"];
  let s = rect(x, y, w, 7, P.woodDark) + rect(x, y, w, 2.5, P.wood);
  let bx = x + 6;
  while (bx < x + w - 14) {
    const bw = 8 + R() * 9;
    const bh = tall * (0.55 + R() * 0.45);
    const c = cols[Math.floor(R() * cols.length)];
    s +=
      rect(bx, y - bh, bw - 1.5, bh, c) +
      rect(bx + bw - 4.5, y - bh, 3, bh, shade(c, 0.2)) +
      rect(bx + 1, y - bh + 3, bw - 5, 2, light(c, 0.35), 'opacity=".7"');
    bx += bw + (R() < 0.25 ? 8 : 0);
  }
  return s;
};
const frame = (x, y, w, h, art, c = P.gold) =>
  contact(x + w / 2 + 3, y + h + 3, w * 0.5, 3, 0.12) +
  rect(x, y, w, h, c) +
  rect(x + w - 5, y, 5, h, shade(c, 0.2)) +
  rect(x + 6, y + 6, w - 12, h - 12, P.ivory) +
  art;
const mini = (x, y, w, h) =>
  rect(x, y, w, h, "#bfe0ee") +
  path(
    `M${x} ${y + h} l${w * 0.3} ${-h * 0.5} l${w * 0.2} ${h * 0.25} l${w * 0.2} ${-h * 0.2} l${w * 0.3} ${h * 0.45}z`,
    P.grass,
  ) +
  circle(x + w * 0.75, y + h * 0.3, h * 0.12, P.gold);
const sailboat = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})">${path("M-16 0h32l-6 8h-20z", P.coral)}${line(0, 0, 0, -30, P.ink, 1.6)}${path("M1 -30l16 26h-16z", P.ivory)}${path("M-1 -24l-12 20h12z", "#e6dccb")}</g>`;
const waves = (pts, c = "#ffffff", o = 0.6) =>
  stroke(pts.map(([x, y]) => `M${x} ${y}q8-5 16 0t16 0`).join(""), c, 2, `opacity="${o}"`);
const seaBands = (y, h) => bands(y, h, "#5fb4cf", "#2f8fb3", 5);
const lamp = (x, y, h = 120) =>
  contact(x, y, 14, 3, 0.2) +
  rect(x - 2.5, y - h, 5, h, "#3d4a57") +
  rrect(x - 9, y - h - 16, 18, 18, 4, "#3d4a57") +
  rect(x - 6, y - h - 12, 12, 10, "#ffe7a1") +
  glow(x, y - h - 7, 20, 18, "#fff2c2", 0.35);

/** Compact city building standing on y=248: lit face, shade strip, one path of windows, roof cap, optional door. */
const tower = (x, w, h, c, cols, rows, door = false) => {
  const y = 248;
  const ww = Math.min(20, (w - 16) / cols - 8);
  const wh = 18;
  let glass = "";
  let lit = "";
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++) {
      const wx = Math.round(x + ((k + 0.5) * w) / cols - ww / 2);
      const wy = y - h + 16 + r * 30;
      if (wy + wh > y - (door ? 52 : 14)) continue;
      glass += `M${wx} ${wy}h${ww}v${wh}h${-ww}z`;
      lit += `M${wx} ${wy + wh}l${Math.round(ww * 0.6)} ${-wh}h${Math.round(ww * 0.35)}l${-Math.round(ww * 0.6)} ${wh}z`;
    }
  let b = contact(x + w / 2, y, w * 0.56, 5, 0.18) + rect(x, y - h, w, h, c) + rect(x + w * 0.74, y - h, w * 0.26, h, shade(c, 0.14)) + rect(x - 3, y - h - 7, w + 6, 8, shade(c, 0.3));
  b += path(glass, "#bcdcea") + path(lit, "#ffffff", 'opacity=".35"');
  if (door) b += rect(x + w / 2 - 12, y - 42, 24, 42, P.ivory) + rect(x + w / 2 - 9, y - 39, 18, 39, P.navyDeep);
  return b;
};
/** Grass from y down: soft bands and a few tufts (lighter than the kit's blade field). */
const lawn = (y, tufts = []) => bands(y, 300 - y, P.grassLight, P.grassDark, 4) + tufts.map(([x, ty, s]) => tuft(x, ty, s)).join("");

function classroom() {
  let b = bands(0, 228, "#f6ead6", "#ecd9bd", 6) + glow(200, 110, 190, 90);
  b += ground(W, 228, 72, "floor") + baseboard(230, "#e8d3ad");
  b += wallWindow(26, 64, 62, 80, { view: "day" }) + cloud(52, 96, 0.28);
  b +=
    rect(116, 50, 168, 104, "#8f6140") +
    rect(116, 50, 168, 5, light("#8f6140", 0.2)) +
    board(124, 58, 152, 88, { kind: "chalk" });
  b +=
    stroke(
      "M146 126l18-32l18 32zM228 104h22M228 116h16M228 128h24",
      "#f4f1e8",
      2.2,
      'opacity=".9"',
    ) + circle(206, 104, 13, "none", 'stroke="#f4f1e8" stroke-width="2.2" opacity=".9"');
  b += rect(124, 146, 152, 4, "#a8754e") + rect(160, 145, 14, 3, "#ffffff");
  b += clock(200, 28, 13);
  b +=
    contact(342, 226, 44, 5, 0.2) +
    rect(304, 104, 76, 122, P.woodDark) +
    rect(310, 110, 64, 110, shade(P.woodDark, 0.3));
  b +=
    shelfItems(310, 146, 64, 4, 30) +
    shelfItems(310, 184, 64, 8, 30) +
    shelfItems(310, 220, 64, 12, 28);
  b += plant(350, 104, 0.7, P.teal);
  b +=
    contact(200, 252, 56, 5, 0.18) +
    rect(160, 214, 6, 38, "#5d6772") +
    rect(234, 214, 6, 38, "#5d6772") +
    rrect(150, 206, 100, 10, 3, P.woodLight) +
    rect(150, 213, 100, 3, shade(P.woodLight, 0.25));
  b +=
    rrect(176, 196, 22, 10, 2, P.coral) +
    rrect(178, 190, 18, 7, 2, P.gold) +
    rrect(206, 200, 18, 6, 1.5, P.ivory);
  return wide(b);
}

function city() {
  let b = daySky(250) + cloud(70, 56, 0.6) + cloud(300, 40, 0.5);
  const far = [
    [0, 120, 60],
    [56, 96, 50],
    [110, 130, 40],
    [170, 84, 46],
    [300, 110, 56],
    [350, 90, 50],
  ];
  for (const [x, h, w] of far) b += rect(x, 250 - h - 40, w, h + 40, haze(P.navy, 0.72));
  b += tower(6, 72, 132, P.coral, 2, 3) + tower(82, 70, 176, P.teal, 2, 4, true) + tower(156, 62, 150, P.gold, 2, 3);
  b += tower(222, 76, 196, P.navy, 2, 5, true) + tower(302, 66, 146, P.brick, 2, 3) + tower(372, 44, 116, "#4f9d5d", 1, 3);
  b +=
    rect(0, 246, W, 18, "#d9d5cc") +
    rect(0, 246, W, 3, "#ece9e1") +
    road(W, 264, 36, { curb: false });
  b += lamp(118, 248, 86) + tree(186, 252, 0.42, { seed: 5 }) + tree(352, 252, 0.36, { seed: 8 });
  return wide(b);
}

function park() {
  let b = daySky(220) + sun(326, 58, 22) + cloud(80, 62, 0.75) + cloud(230, 40, 0.5);
  b += hills(W, 196, { seed: 3, amp: 22 });
  b +=
    tree(268, 196, 0.42, { kind: "pine", tone: "#5f9a74" }) +
    tree(30, 200, 0.5, { kind: "pine", tone: "#4f8a6a" });
  b += lawn(194, [[120, 250, 0.9], [290, 230, 0.8]]);
  b += pathway(250, 300, 300, 196, 120, 18);
  b += tree(70, 238, 0.92, { seed: 4 }) + tree(352, 228, 0.74, { seed: 9, tone: "#5f9a5f" });
  b += bench(118, 236, 84);
  b +=
    flower(26, 280, 0.9, { color: P.pink }) +
    flower(196, 268, 0.8, { color: P.gold, center: P.coral }) +
    flower(380, 286, 0.9, { color: P.coral });
  b += tuft(160, 290) + tuft(330, 276, 0.9) + tuft(14, 250, 0.8);
  return wide(b);
}

function kitchen() {
  let b = bands(0, 200, "#fbefd8", "#f4e2c4", 5);
  let tiles = "";
  for (let y = 146; y <= 196; y += 16) tiles += `M0 ${y}H400`;
  for (let x = 20; x < W; x += 32) tiles += `M${x} 146V198`;
  b += rect(0, 140, W, 60, "#f6ead2") + stroke(tiles, "#e3cfa9", 1.2, 'opacity=".8"');
  const cab = (x, w) =>
    contact(x + w / 2, 112, w * 0.5, 3, 0.14) +
    rect(x, 28, w, 82, "#2c8c86") +
    rect(x + w / 2, 28, w / 2, 82, shade("#2c8c86", 0.12)) +
    rect(x + 6, 34, w / 2 - 9, 70, light("#2c8c86", 0.08)) +
    rect(x + w / 2 + 3, 34, w / 2 - 9, 70, shade("#2c8c86", 0.06)) +
    rrect(x + w / 2 - 8, 70, 4, 14, 2, P.goldLight) +
    rrect(x + w / 2 + 4, 70, 4, 14, 2, P.goldLight);
  b += cab(-6, 122) + cab(284, 122);
  b +=
    wallWindow(152, 34, 96, 72, { view: "day" }) +
    plant(186, 118, 0.6, P.coral) +
    rrect(140, 116, 120, 6, 2, P.ivory);
  b +=
    rect(0, 196, W, 14, "#efe7d8") +
    rect(0, 196, W, 3, "#ffffff") +
    rect(0, 210, W, 90, P.teal) +
    rect(0, 210, W, 6, shade(P.teal, 0.25));
  for (const x of [0, 80, 240, 320])
    b += rect(x + 4, 222, 72, 70, light(P.teal, 0.06)) + rect(x + 36, 236, 10, 3, P.goldLight);
  b +=
    rect(160, 210, 80, 90, "#c3ccd2") +
    rect(222, 210, 18, 90, shade("#c3ccd2", 0.12)) +
    rrect(170, 230, 60, 46, 5, "#3d4652") +
    rect(176, 236, 22, 4, "#ffffff", 'opacity=".25"') +
    rect(170, 218, 60, 5, "#3d4652");
  b +=
    contact(200, 196, 30, 3, 0.2) +
    path("M176 176h48l-3 20h-42z", P.coral) +
    rect(176, 176, 48, 5, light(P.coral, 0.2)) +
    rect(204, 176, 20, 20, shade(P.coral, 0.15), 'opacity=".6"') +
    rect(170, 179, 8, 3, P.ink) +
    rect(222, 179, 8, 3, P.ink);
  b += stroke("M190 168q-6-8 0-16M206 168q-6-8 0-16", "#ffffff", 2.2, 'opacity=".8"');
  b +=
    contact(96, 196, 14, 2.5, 0.2) +
    circle(96, 184, 12, P.red) +
    circle(100, 188, 8, shade(P.red, 0.15), 'opacity=".6"') +
    circle(91, 180, 3, "#ffffff", 'opacity=".5"') +
    path("M96 172q2-7 8-7q-1 6-8 7z", P.leaf);
  b +=
    contact(312, 196, 22, 3, 0.2) +
    rrect(292, 178, 40, 18, 9, P.woodLight) +
    path(
      "M298 182q4-4 8 0M310 182q4-4 8 0M322 182q4-4 8 0",
      "none",
      `stroke="${shade(P.woodLight, 0.3)}" stroke-width="2"`,
    );
  return wide(b);
}

function forest() {
  let b = bands(0, 240, "#cfe6ec", "#eef5ee", 6);
  b += path(
    "M-10 178L50 108L96 150L150 82L214 162L262 112L320 168L370 120L410 160V300H-10Z",
    haze("#6f9a8a", 0.55),
  );
  for (const [x, s] of [
    [20, 0.6],
    [92, 0.7],
    [170, 0.55],
    [250, 0.68],
    [326, 0.6],
    [392, 0.7],
  ])
    b += tree(x, 214, s, { kind: "pine", tone: haze("#2f6b4f", 0.45) });
  b += lawn(220, [[90, 240, 0.8], [330, 236, 0.8]]);
  b += pathway(200, 300, 230, 222, 140, 20, "#d8bf92");
  for (const [x, s] of [
    [46, 1.15],
    [128, 0.95],
    [306, 1.0],
    [372, 1.25],
  ])
    b += tree(x, 254 + (s - 1) * 30, s, { kind: "pine", tone: "#2f6b4f" });
  const shroom = (x, y, c) =>
    contact(x, y, 10, 2, 0.2) +
    rect(x - 3, y - 10, 6, 10, P.ivory) +
    path(`M${x - 11} ${y - 9}q11-16 22 0z`, c) +
    circle(x - 3, y - 13, 1.8, "#ffffff") +
    circle(x + 4, y - 12, 1.4, "#ffffff");
  b += shroom(220, 268, P.coral) + shroom(176, 286, P.gold);
  b +=
    tuft(18, 290) + tuft(250, 296, 1.1) + flower(390, 296, 0.8, { color: P.gold, center: P.coral });
  return wide(b);
}

function beach() {
  let b = daySky(150) + sun(312, 62, 24) + cloud(80, 54, 0.6);
  b +=
    seaBands(140, 80) +
    rect(0, 140, W, 3, "#bfe3ee") +
    waves([
      [20, 162],
      [140, 178],
      [280, 158],
      [80, 200],
      [320, 196],
    ]);
  b += sailboat(154, 146, 0.75);
  b +=
    path("M-10 214q60-12 120 0t120 0t180 0V300H-10z", "#ecd3a0") +
    path(
      "M-10 214q60-12 120 0t120 0t180 0v8q-90 6-180 0t-120 0t-120 0z",
      "#ffffff",
      'opacity=".55"',
    );
  b += bands(232, 68, "#ecd3a0", "#dfbd83", 4);
  b += contact(244, 282, 34, 5, 0.2) + umbrella(244, 282, 50, P.coral);
  b +=
    contact(178, 266, 40, 4, 0.12) +
    rrect(140, 250, 74, 18, 4, P.gold) +
    rect(164, 250, 12, 18, P.ivory, 'opacity=".8"') +
    rect(188, 250, 12, 18, P.ivory, 'opacity=".8"');
  b +=
    contact(100, 272, 18, 3, 0.2) +
    path("M84 272l4-22h24l4 22z", P.teal) +
    rect(84, 248, 32, 4, light(P.teal, 0.2)) +
    stroke("M88 250q12-16 24 0", shade(P.teal, 0.2), 2);
  b += path("M318 276l9-14l9 14l-9 5z", P.coralLight) + stroke("M327 262v18", P.coral, 1.4);
  return wide(b);
}

function space() {
  let b = bands(0, 300, "#0c1d36", "#1d3c66", 8) + stars(W, 300, 46, 9);
  const spark = (x, y, r) =>
    path(
      `M${x} ${y - r}Q${x + r * 0.2} ${y - r * 0.2} ${x + r} ${y}Q${x + r * 0.2} ${y + r * 0.2} ${x} ${y + r}Q${x - r * 0.2} ${y + r * 0.2} ${x - r} ${y}Q${x - r * 0.2} ${y - r * 0.2} ${x} ${y - r}z`,
      P.goldLight,
    );
  b += spark(292, 104, 8) + spark(66, 66, 6) + spark(352, 230, 5);
  b += ellipse(
    182,
    152,
    100,
    22,
    "none",
    `stroke="${shade(P.gold, 0.15)}" stroke-width="5" opacity=".9" transform="rotate(-14 182 152)"`,
  );
  b +=
    circle(182, 150, 56, P.coral) +
    path("M196 96a56 56 0 0 1 0 108q34-52 0-108z", shade(P.coral, 0.25)) +
    ellipse(160, 126, 22, 13, light(P.coral, 0.25), 'opacity=".7"');
  b += stroke("M134 140q24 6 40-2M140 170q30 8 70-4", shade(P.coral, 0.15), 5, 'opacity=".8"');
  b += path(
    "M82 152a100 22 0 0 0 200 0",
    "none",
    `stroke="${P.gold}" stroke-width="5" transform="rotate(-14 182 152)"`,
  );
  b +=
    circle(306, 206, 24, "#c9cfd6") +
    path("M318 186a24 24 0 0 1 0 40q14-20 0-40z", shade("#c9cfd6", 0.2)) +
    circle(298, 200, 5, shade("#c9cfd6", 0.15)) +
    circle(312, 214, 4, shade("#c9cfd6", 0.15));
  b += circle(78, 210, 13, "#3fa79a") + circle(74, 206, 4, light("#3fa79a", 0.4), 'opacity=".6"');
  return wide(b);
}

function museum() {
  let b = bands(0, 228, "#f3e7d6", "#eadac3", 6) + glow(200, 120, 200, 100);
  b += rect(0, 18, W, 16, P.teal) + rect(0, 32, W, 3, shade(P.teal, 0.25));
  b += ground(W, 228, 72, "tile") + baseboard(230);
  b +=
    frame(38, 70, 74, 58, mini(46, 78, 58, 42)) +
    frame(
      288,
      70,
      74,
      58,
      rect(296, 78, 58, 42, P.navy) +
        circle(325, 98, 12, P.coral) +
        rect(300, 112, 50, 3, P.tealLight),
    );
  const col = (x) =>
    rect(x - 4, 46, 30, 10, P.ivory) +
    rect(x, 56, 22, 166, "#f6f0e4") +
    rect(x + 14, 56, 8, 166, shade("#f6f0e4", 0.1)) +
    stroke(`M${x + 5} 62v154M${x + 10} 62v154`, shade("#f6f0e4", 0.12), 1.4) +
    rect(x - 4, 220, 30, 8, P.ivory);
  b += col(134) + col(244);
  b +=
    contact(200, 228, 34, 4, 0.2) +
    rect(174, 168, 52, 60, "#f6f0e4") +
    rect(210, 168, 16, 60, shade("#f6f0e4", 0.1)) +
    rect(170, 164, 60, 6, P.ivory);
  b +=
    path("M184 164q-8-20 8-34q-6-10 2-16h12q8 6 2 16q16 14 8 34z", P.teal) +
    path("M200 114h6q8 6 2 16q16 14 8 34h-16z", shade(P.teal, 0.2)) +
    rect(186, 146, 28, 4, P.gold);
  const post = (x) =>
    contact(x, 228, 9, 2, 0.2) + rect(x - 2, 194, 4, 34, P.gold) + circle(x, 192, 4, P.goldLight);
  b += post(110) + post(290) + stroke("M110 198q30 16 60 0M230 198q30 16 60 0", P.coral, 4);
  return wide(b);
}

function lab() {
  let b = bands(0, 200, "#e3f1ee", "#d3e8e3", 5);
  b += wallWindow(144, 34, 112, 74, { view: "day" });
  const jar = (x, y, w, h, c) =>
    rrect(x, y - h, w, h, 3, c) +
    rect(x + w - 4, y - h, 4, h, shade(c, 0.2)) +
    rect(x + 2, y - h + 3, 3, h - 6, "#ffffff", 'opacity=".35"');
  const flask = (x, y, c) =>
    path(`M${x - 4} ${y - 24}h8v8l9 12q2 4-2 4h-22q-4 0-2-4l9-12z`, "#eef6f4") +
    path(`M${x - 8} ${y - 8}h16l4 6q2 2-2 2h-20q-4 0-2-2z`, c);
  b +=
    rect(12, 66, 104, 7, P.woodDark) +
    rect(284, 66, 104, 7, P.woodDark) +
    rect(12, 124, 104, 7, P.woodDark) +
    rect(284, 124, 104, 7, P.woodDark);
  b +=
    jar(22, 66, 16, 24, P.coral) +
    jar(44, 66, 12, 30, P.gold) +
    flask(78, 66, "#3fa79a") +
    jar(96, 66, 14, 20, P.navy);
  b +=
    flask(304, 124, P.grass) +
    jar(326, 124, 14, 28, P.coral) +
    jar(348, 124, 24, 20, "#3fa79a") +
    jar(298, 66, 14, 24, "#3fa79a") +
    jar(320, 66, 22, 20, P.gold);
  b += jar(24, 124, 24, 24, P.grass) + jar(56, 124, 12, 20, P.coral) + flask(90, 124, P.gold);
  b +=
    rect(0, 196, W, 14, P.navy) +
    rect(0, 196, W, 3, light(P.navy, 0.25)) +
    rect(0, 210, W, 90, "#c3ccd2");
  for (const x of [0, 100, 200, 300])
    b += rect(x + 4, 218, 92, 76, light("#c3ccd2", 0.08)) + rect(x + 40, 234, 20, 4, "#8a959e");
  b +=
    contact(170, 196, 30, 3, 0.2) +
    rrect(144, 186, 46, 10, 2, P.navy) +
    stroke("M164 186v-14q0-8 8-12l18-12", P.navy, 6) +
    rrect(184, 132, 16, 34, 5, P.tealLight, 'transform="rotate(30 192 149)"') +
    rrect(170, 168, 30, 4, 2, "#9aa6b1");
  b +=
    contact(250, 196, 22, 3, 0.2) +
    path("M244 150h14v14l14 24q3 8-6 8h-30q-9 0-6-8l14-24z", "#eef6f4", 'opacity=".95"') +
    path("M236 178h34l4 8q3 10-6 10h-30q-9 0-6-10z", P.coral) +
    circle(248, 172, 3, P.coralLight) +
    circle(254, 162, 2, P.coralLight);
  return wide(b);
}

function night() {
  let b = bands(0, 240, "#0c1d36", "#2c4f7c", 8) + stars(W, 170, 30, 4) + moon(306, 62, 24);
  b += path("M-10 204q100-34 200 0t220-8V300H-10z", "#1a3152");
  const home = (x, w, h, wall, roof) => {
    let s = house(x, 250, w, h, { color: wall, roof, door: shade(wall, 0.3), window: false });
    s +=
      rect(x + w * 0.16, 250 - h * 0.7, 18, 18, "#ffd36e") +
      rect(x + w * 0.16, 250 - h * 0.7, 18, 4, "#fff0b8") +
      glow(x + w * 0.16 + 9, 250 - h * 0.7 + 9, 20, 18, "#ffd36e", 0.22);
    return s;
  };
  b +=
    home(56, 70, 66, "#2d5a6e", "#8a3f35") +
    home(156, 96, 60, "#294466", "#6e4a2e") +
    home(284, 62, 78, "#2d5a6e", "#8a3f35");
  b +=
    rect(0, 250, W, 50, "#142640") +
    tree(30, 252, 0.4, { kind: "pine", tone: "#16364a" }) +
    tree(378, 254, 0.46, { kind: "pine", tone: "#16364a" });
  return wide(b);
}

function market() {
  let b = daySky(240) + cloud(200, 34, 0.5);
  b += stroke("M-10 22q60 22 120 6t120 6t180-4", "#7a8590", 1.4);
  const flag = (x, y, c) => path(`M${x} ${y}l9 16l9-14z`, c);
  b +=
    flag(20, 26, P.coral) +
    flag(78, 30, P.gold) +
    flag(138, 30, P.teal) +
    flag(258, 32, P.green) +
    flag(328, 28, P.coral);
  b += ground(W, 240, 60, "pavement");
  const fruit = (xs, y, c) =>
    xs
      .map((x) => circle(x, y, 9, c) + circle(x - 3, y - 3, 2.5, "#ffffff", 'opacity=".45"'))
      .join("");
  b += stall(14, 244, 172, {
    awning: P.coral,
    goods: fruit([34, 52, 70, 88], 186, P.red) + fruit([118, 136, 154], 186, P.orange),
  });
  b += stall(214, 244, 172, {
    awning: P.teal,
    goods:
      fruit([234, 252, 270], 186, P.green) +
      path("M300 194q20-30 40 0z", P.gold) +
      path("M346 194q10-26 30 0z", P.coral),
  });
  return wide(b);
}

function home() {
  let b = bands(0, 232, "#f6e3cf", "#eed5bb", 6) + glow(170, 120, 200, 100);
  b += ground(W, 232, 68, "floor") + baseboard(234);
  b += wallWindow(32, 56, 70, 84, { view: "day", curtain: P.coral });
  b += frame(166, 56, 72, 56, mini(172, 62, 60, 44));
  b +=
    ellipse(200, 246, 100, 12, P.coral, 'opacity=".85"') +
    ellipse(200, 244, 84, 8, light(P.coral, 0.2), 'opacity=".6"');
  const sofa = P.teal;
  b +=
    contact(200, 232, 98, 6, 0.2) +
    rrect(114, 150, 172, 56, 18, sofa) +
    rect(114, 150, 172, 8, light(sofa, 0.15), 'rx="8"');
  b += rrect(126, 186, 148, 36, 8, light(sofa, 0.12)) + rect(198, 188, 2, 32, shade(sofa, 0.2));
  b +=
    rrect(100, 170, 30, 58, 13, shade(sofa, 0.1)) +
    rrect(270, 170, 30, 58, 13, sofa) +
    rect(108, 226, 6, 8, P.woodDark) +
    rect(286, 226, 6, 8, P.woodDark);
  b += rrect(140, 162, 32, 26, 7, P.gold) + rect(160, 164, 10, 22, shade(P.gold, 0.15), 'rx="4"');
  b += contact(334, 232, 16, 3, 0.2) + rect(332, 120, 4, 112, "#3d4652") + rrect(322, 228, 24, 5, 2, "#3d4652") + glow(334, 112, 40, 34, "#fff2c2", 0.3);
  b += path("M318 120h32l-7-30h-18z", P.gold) + path("M334 90h9l7 30h-16z", shade(P.gold, 0.15));
  b += plant(62, 232, 1.05, P.woodLight);
  return wide(b);
}

function island() {
  let b = daySky(160) + sun(84, 64, 22) + cloud(270, 52, 0.7);
  b +=
    seaBands(156, 144) +
    rect(0, 156, W, 3, "#bfe3ee") +
    waves([
      [24, 186],
      [316, 198],
      [60, 262],
      [300, 270],
      [190, 286],
    ]);
  b +=
    ellipse(200, 236, 100, 16, "#8fd0e6", 'opacity=".6"') +
    path("M110 234q22-48 90-50t90 50z", "#ecd3a0") +
    path("M210 184q70 4 80 50h-40q-10-34-40-50z", shade("#ecd3a0", 0.12));
  b += tree(196, 214, 0.78, { kind: "palm" }) + tree(250, 218, 0.5, { kind: "palm" });
  b += circle(204, 98, 4, P.barkDark) + circle(211, 96, 4, P.barkDark);
  b += sailboat(338, 220, 1);
  return wide(b);
}

function newsroom() {
  let b = bands(0, 200, "#163556", P.navy, 5);
  b += rect(0, 0, W, 18, P.navyDeep);
  for (const x of [60, 140, 260, 340])
    b += circle(x, 14, 5, P.goldLight);
  b += rrect(108, 36, 184, 114, 8, "#0f2b45") + rrect(116, 44, 168, 98, 4, P.teal);
  b +=
    circle(200, 92, 34, "#8fd0e6") +
    path(
      "M180 69q14 8 8 20q-10 4-6 16q-12-6-14-20zM210 63q14 4 18 18q-10-2-12 10q-10 2-12-8q8-6 6-20zM200 107q12-2 16 10q-10 8-18 2z",
      P.grass,
    ) +
    path("M216 62a34 34 0 0 1 0 60q16-30 0-60z", shade("#8fd0e6", 0.2), 'opacity=".6"');
  b += rect(126, 124, 52, 8, P.coral);
  const mon = (x, c) =>
    rrect(x, 68, 62, 46, 4, "#0f2b45") +
    rect(x + 6, 74, 50, 34, c) +
    rect(x + 6, 74, 50, 6, light(c, 0.2));
  b += mon(18, P.coral) + mon(320, P.gold);
  b += rect(0, 196, W, 104, "#24364d");
  b +=
    contact(200, 268, 140, 7, 0.25) +
    path("M60 192h280l-14 72H74z", "#f4efe4") +
    path("M300 202h40l-14 62h-40z", shade("#f4efe4", 0.12)) +
    rect(60, 192, 280, 10, P.coral) +
    rect(110, 216, 180, 5, P.gold);
  b +=
    rrect(92, 166, 52, 28, 3, "#3d4652") +
    rect(97, 170, 42, 20, "#8fd0e6") +
    rect(86, 192, 64, 3, "#3d4652");
  b += rrect(256, 176, 50, 18, 2, P.ivory) + stroke("M262 182h36M262 188h24", "#9aa7b4", 1.6);
  b +=
    line(200, 192, 200, 176, "#9aa6b1", 3) +
    circle(200, 172, 7, "#9aa6b1") +
    circle(198, 170, 2, "#ffffff", 'opacity=".6"');
  return wide(b);
}

/** The 14 backgrounds, in the library's order. */
export const bookScenes = () => [
  ["bg-classroom", "Classroom", "Salón de clases", classroom()],
  ["bg-city", "City street", "Calle de la ciudad", city()],
  ["bg-park", "Park", "Parque", park()],
  ["bg-kitchen", "Kitchen", "Cocina", kitchen()],
  ["bg-forest", "Forest", "Bosque", forest()],
  ["bg-beach", "Beach", "Playa", beach()],
  ["bg-space", "Outer space", "Espacio", space()],
  ["bg-museum", "Museum", "Museo", museum()],
  ["bg-lab", "Science lab", "Laboratorio", lab()],
  ["bg-night", "Night sky", "Cielo de noche", night()],
  ["bg-market", "Market", "Mercado", market()],
  ["bg-home", "Living room", "Sala de la casa", home()],
  ["bg-island", "Island", "Isla", island()],
  ["bg-newsroom", "Newsroom", "Sala de noticias", newsroom()],
];
