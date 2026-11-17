// Language Expeditions world art (illustrator M): the land landmarks and the explorer, drawn in the site illustration
// kit's style (flat layered shapes, a lit side toward the light, a shade side away from it, soft contact shadows, no
// dark outlines). World units: 1000 tall, ground line y = 790. Night lands (Grades 3-5) are lit by the moon from the
// upper right and by warm lamps; canyon lands (Grades 6-8) by a low sun on the right. Only the world module imports
// this file. Every string is id-free: the scene is one inline strip, but nothing here needs <defs>.

const GROUND = 790;
const n = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
const R = (x, y, w, h, fill, extra = "") =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}"${extra ? ` ${extra}` : ""}/>`;
const P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}"${extra ? ` ${extra}` : ""}/>`;
const O = (cx, cy, rx, ry, fill, extra = "") =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}"${extra ? ` ${extra}` : ""}/>`;
const Ci = (cx, cy, r, fill, extra = "") =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}"${extra ? ` ${extra}` : ""}/>`;
const L = (d, color, w, extra = "") =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra ? ` ${extra}` : ""}/>`;
/** Soft contact shadow where a thing meets the ground. */
export const foot = (x, rx, o = 0.32, y = GROUND + 4) =>
  O(x, y, rx, rx * 0.09, "#050d16", `opacity="${o}"`);

// Night materials (moonlit: light from the upper right) and canyon materials (low sun on the right).
const N = {
  stone: "#6f7f8c",
  stoneL: "#94a3ae",
  stoneD: "#4c5b67",
  wood: "#6b4a30",
  woodL: "#8a6343",
  woodD: "#46301f",
  leaf: "#1f4538",
  leafL: "#2f6150",
  leafD: "#163328",
  water: "#2b5c86",
  waterL: "#5d93b8",
  cream: "#cfc6b0",
  creamD: "#a49b86",
  warm: "#f2c15b",
  warmL: "#ffe9a0",
  coral: "#c8553d",
  teal: "#1fa6a2",
  ivory: "#f7f4ec",
};
const D = {
  rock: "#9a4f3a",
  rockL: "#c46f4c",
  rockD: "#6e3428",
  sand: "#e8d3a8",
  sandD: "#c7ad7c",
  adobe: "#b8704a",
  adobeL: "#d38c60",
  adobeD: "#8e5236",
  metal: "#2a3a48",
  metalL: "#4d6273",
  cave: "#2a140c",
  teal: "#1fa6a2",
  amber: "#f2c15b",
  ivory: "#f7f4ec",
};

/** A stone block wall seam pattern (thin, low-contrast line detail). */
const seams = (x0, y0, w, h, rowH, color) => {
  let d = "";
  for (let y = y0 + rowH, i = 0; y < y0 + h - 4; y += rowH, i += 1) {
    d += `M${n(x0 + 4)} ${n(y)}H${n(x0 + w - 4)}`;
    const off = i % 2 ? rowH * 0.9 : rowH * 0.3;
    for (let x = x0 + off; x < x0 + w - 8; x += rowH * 1.8) d += `M${n(x)} ${n(y)}v${n(-rowH)}`;
  }
  return L(d, color, 3, 'opacity=".35"');
};

/** A two-tone column: shade on the left, lit face on the right, a capital and a broken top. */
const pillar = (x, top, w, c) =>
  foot(x + w / 2, w * 0.9) +
  R(x, top, w, GROUND - top, c.stone) +
  R(x + w * 0.62, top, w * 0.38, GROUND - top, c.stoneL) +
  R(x, top, w * 0.18, GROUND - top, c.stoneD, 'opacity=".7"') +
  R(x - 8, top - 12, w + 16, 16, c.stoneL) +
  R(x - 8, top + 1, w + 16, 5, c.stoneD, 'opacity=".6"') +
  P(`M${x - 4} ${top - 12}l10 -10 8 6 10 -12 6 16Z`, c.stone);

const bridge = (o) => {
  const x0 = o + 2060;
  const x1 = o + 2350;
  const mid = (x0 + x1) / 2;
  return (
    P(
      `M${o + 2080} 1000Q${o + 2140} 880 ${o + 2170} 790L${o + 2240} 790Q${o + 2260} 880 ${o + 2340} 1000Z`,
      N.water,
    ) +
    P(
      `M${o + 2150} 1000Q${o + 2185} 880 ${o + 2196} 800L${o + 2214} 800Q${o + 2216} 880 ${o + 2230} 1000Z`,
      N.waterL,
      'opacity=".5"',
    ) +
    L(
      `M${o + 2170} 850q16 -6 30 0M${o + 2160} 920q20 -8 44 0M${o + 2150} 975q28 -8 60 0`,
      "#bfe3f2",
      4,
      'opacity=".55"',
    ) +
    P(`M${x0} 790Q${mid} 680 ${x1} 790L${x1 - 26} 790Q${mid} 724 ${x0 + 26} 790Z`, N.stone) +
    P(
      `M${mid} 690Q${x1 - 50} 712 ${x1} 790L${x1 - 26} 790Q${x1 - 70} 740 ${mid} 724Z`,
      N.stoneL,
      'opacity=".8"',
    ) +
    P(
      `M${x0 + 26} 790Q${mid} 724 ${x1 - 26} 790`,
      "none",
      `stroke="${N.stoneD}" stroke-width="6" opacity=".55"`,
    ) +
    R(x0, 764, x1 - x0, 16, N.stoneL, 'rx="6"') +
    R(x0, 776, x1 - x0, 6, N.stoneD, 'rx="3" opacity=".7"') +
    [0, 1, 2, 3, 4].map((i) => R(x0 + 18 + i * 56, 748, 14, 18, N.stone, 'rx="3"')).join("")
  );
};

const bigTree = (o) => {
  const x = o + 3100;
  const blobs = [
    [-90, 560, 80],
    [80, 552, 86],
    [0, 430, 104],
    [-50, 490, 90],
    [56, 470, 84],
    [0, 560, 96],
  ];
  return (
    `<circle class="lexp-pulse" cx="${x}" cy="520" r="170" fill="${N.warm}" opacity=".18"/>` +
    foot(x, 120, 0.35) +
    P(
      `M${x - 34} 790C${x - 20} 720 ${x - 24} 640 ${x - 16} 560H${x + 16}C${x + 24} 640 ${x + 20} 720 ${x + 36} 790Z`,
      N.woodD,
    ) +
    P(
      `M${x + 2} 560H${x + 16}C${x + 24} 640 ${x + 20} 720 ${x + 36} 790H${x + 8}C${x + 10} 700 ${x + 6} 630 ${x + 2} 560Z`,
      N.wood,
    ) +
    blobs.map(([dx, cy, r]) => Ci(x + dx, cy, r, N.leafD)).join("") +
    blobs.map(([dx, cy, r]) => Ci(x + dx + r * 0.16, cy - r * 0.18, r * 0.78, N.leaf)).join("") +
    blobs
      .slice(0, 5)
      .map(([dx, cy, r]) =>
        O(x + dx + r * 0.34, cy - r * 0.4, r * 0.4, r * 0.24, N.leafL, 'opacity=".8"'),
      )
      .join("") +
    [
      [-60, 520],
      [40, 440],
      [90, 560],
      [-10, 600],
      [-100, 470],
    ]
      .map(([dx, y]) => Ci(x + dx, y, 6, N.warmL, 'opacity=".85"'))
      .join("")
  );
};

const signpost = (o) => {
  const x = o + 1300;
  return (
    foot(x, 34) +
    R(x - 7, 640, 14, 150, N.woodD) +
    R(x, 640, 7, 150, N.wood) +
    P(`M${x - 60} 650h110l20 20 -20 20h-110z`, N.wood) +
    P(`M${x - 60} 650h110l20 20h-130z`, N.woodL) +
    L(`M${x - 44} 664h70M${x - 44} 676h50`, N.ivory, 5, 'opacity=".85"') +
    Ci(x, 646, 4, N.woodD)
  );
};

const bookcase = (o) => {
  const x = o + 2100;
  const books = [0, 1, 2, 3, 4, 5, 6]
    .map((i) => {
      const c = ["#c94f3b", "#1fa6a2", "#f2c15b"][i % 3];
      const by = 640 + (i % 3) * 4;
      const bh = 50 - (i % 3) * 6;
      return (
        R(x + 12 + i * 28, by, 18, bh, c) +
        R(x + 24 + i * 28, by, 6, bh, "#1c2f4a", 'opacity=".22"') +
        R(x + 12 + i * 28, by + 8, 18, 4, N.ivory, 'opacity=".45"')
      );
    })
    .join("");
  return (
    foot(x + 110, 140) +
    R(x, 560, 220, 230, N.woodD) +
    R(x + 10, 570, 200, 210, "#2e2016") +
    R(x + 196, 560, 24, 230, N.wood) +
    R(x - 8, 548, 236, 16, N.woodL, 'rx="4"') +
    [630, 700, 776]
      .map((y) => R(x + 6, y - 6, 208, 12, N.wood) + R(x + 6, y - 6, 208, 4, N.woodL))
      .join("") +
    books +
    R(x + 20, 712, 46, 58, "#3a2a1e", 'opacity=".7"') +
    R(x + 150, 718, 40, 52, "#3a2a1e", 'opacity=".7"')
  );
};

const owlHouse = (o) => {
  const x = o + 3100;
  return (
    foot(x, 170) +
    P(`M${x - 150} ${GROUND}V560L${x} 470L${x + 150} 560V${GROUND}Z`, N.stone) +
    P(`M${x} 470L${x + 150} 560V${GROUND}H${x + 60}V560Z`, N.stoneL, 'opacity=".55"') +
    seams(x - 150, 560, 300, 230, 34, N.stoneD) +
    P(`M${x - 168} 566L${x} 458L${x + 168} 566L${x + 160} 578L${x} 474L${x - 160} 578Z`, N.stoneD) +
    P(`M${x - 60} ${GROUND}V640Q${x} 590 ${x + 60} 640V${GROUND}Z`, "#0b1a28") +
    P(`M${x + 80} 470l50 -40 20 60Z`, N.coral) +
    L(`M${x + 80} 470V540`, N.woodD, 5) +
    `<g transform="translate(${x} 530)">${Ci(0, 0, 34, "#0b1a28")}${O(0, 4, 21, 25, "#178a87")}${O(5, 2, 15, 21, N.teal)}${O(0, 14, 11, 12, "#bfe9e6", 'opacity=".6"')}${Ci(-7, -6, 6.5, N.ivory)}${Ci(7, -6, 6.5, N.ivory)}${Ci(-6, -6, 3.2, "#17324d")}${Ci(8, -6, 3.2, "#17324d")}${P("M-4 2l4 6 4 -6Z", N.warm)}${P("M-16 -20l6 -10 4 9ZM16 -20l-6 -10 -4 9Z", "#178a87")}</g>`
  );
};

const mesaLedge = (o) =>
  foot(o + 1360, 190, 0.3) +
  P(`M${o + 1200} ${GROUND}L${o + 1260} 420H${o + 1460}L${o + 1520} ${GROUND}Z`, N.stone) +
  P(`M${o + 1380} 420H${o + 1460}L${o + 1520} ${GROUND}H${o + 1430}Z`, N.stoneL, 'opacity=".6"') +
  R(o + 1252, 412, 216, 14, N.stoneL, 'rx="6"') +
  L(`M${o + 1240} 520h120M${o + 1226} 640h160M${o + 1214} 720h200`, N.stoneD, 4, 'opacity=".5"') +
  R(o + 1286, 560, 78, 14, N.stoneD, 'rx="4"') +
  R(o + 1286, 558, 78, 5, N.stoneL, 'rx="2"') +
  P(`M${o + 1298} 560q20 -22 40 0Z`, "#8a5a2f") +
  O(o + 1318, 552, 6, 4, N.ivory, 'opacity=".8"') +
  P(
    `M${o + 1408} 470Q${o + 1396} 620 ${o + 1414} ${GROUND}H${o + 1446}Q${o + 1424} 620 ${o + 1432} 470Z`,
    "#7fbfdc",
    'opacity=".85"',
  ) +
  L(`M${o + 1418} 500Q${o + 1410} 640 ${o + 1424} 780`, "#d6f0fa", 4, 'opacity=".7"') +
  O(o + 1430, GROUND + 2, 44, 10, "#bfe3f2", 'opacity=".55"');

const spireBed = (o) =>
  foot(o + 2660, 120, 0.3) +
  P(`M${o + 2560} ${GROUND}L${o + 2620} 470H${o + 2700}L${o + 2760} ${GROUND}Z`, N.stone) +
  P(`M${o + 2662} 470H${o + 2700}L${o + 2760} ${GROUND}H${o + 2700}Z`, N.stoneL, 'opacity=".6"') +
  L(`M${o + 2600} 600h80M${o + 2586} 700h120`, N.stoneD, 4, 'opacity=".5"') +
  foot(o + 2820, 70, 0.3) +
  R(o + 2760, GROUND - 16, 120, 16, N.wood) +
  R(o + 2760, GROUND - 16, 120, 5, N.woodL) +
  L(`M${o + 2800} 774q-2 -18 0 -30M${o + 2840} 774q2 -16 0 -26`, "#3f9b5f", 6) +
  P(
    `M${o + 2800} 748q-14 -10 -18 2q8 4 18 -2ZM${o + 2840} 752q14 -10 18 2q-8 4 -18 -2Z`,
    "#5fbf7a",
  );

const cottage = (o) => {
  const x = o + 1380;
  return (
    foot(x + 70, 100) +
    P(`M${x} ${GROUND}V650l70 -50 70 50V${GROUND}Z`, N.cream) +
    P(`M${x + 70} 600l70 50V${GROUND}H${x + 92}V620Z`, N.creamD, 'opacity=".55"') +
    P(
      `M${x - 14} 656L${x + 70} 592L${x + 154} 656L${x + 146} 666L${x + 70} 608L${x - 6} 666Z`,
      N.coral,
    ) +
    R(x + 46, 694, 42, 58, "#3d2b1e", 'rx="3"') +
    `<rect x="${x + 50}" y="700" width="34" height="50" fill="${N.warm}" opacity=".85"/>` +
    R(x + 66, 700, 2.5, 50, "#3d2b1e") +
    R(x + 50, 723, 34, 2.5, "#3d2b1e") +
    O(x + 67, 760, 40, 8, N.warm, 'opacity=".25"')
  );
};

const lighthouse = (o) => {
  const x = o + 2810;
  return (
    `<path class="lexp-pulse" d="M${x} 340L${o + 2400} 260V420Z" fill="${N.warm}" opacity=".2"/>` +
    foot(x, 90, 0.35) +
    P(`M${x - 70} ${GROUND}L${x - 40} 360H${x + 40}L${x + 70} ${GROUND}Z`, N.ivory) +
    P(`M${x + 6} 360H${x + 40}L${x + 70} ${GROUND}H${x + 18}Z`, "#cfd6dc") +
    `<path d="M${x - 54} 560h112M${x - 62} 680h128" stroke="#c94f3b" stroke-width="40"/>` +
    `<path d="M${x + 8} 560h50M${x + 14} 680h60" stroke="#9e3a2d" stroke-width="40" opacity=".55"/>` +
    R(x - 52, 356, 104, 8, "#3a4a58", 'rx="3"') +
    R(x - 42, 320, 84, 40, N.warm) +
    R(x - 42, 320, 84, 40, N.warmL, 'opacity=".5"') +
    L(`M${x - 14} 322v36M${x + 14} 322v36`, "#3a4a58", 4) +
    P(`M${x - 50} 320h100l-50 -40Z`, "#c94f3b") +
    P(`M${x} 280l50 40h-50Z`, "#9e3a2d") +
    Ci(x, 276, 6, "#3a4a58") +
    R(x - 10, 720, 20, 40, "#3a4a58", 'rx="8"')
  );
};

const coast = (o) =>
  P(`M${o + 1000} ${GROUND + 6}H${o + 4000}V1000H${o + 1000}Z`, "#1f4a63") +
  P(`M${o + 1000} ${GROUND + 6}H${o + 4000}V${GROUND + 22}H${o + 1000}Z`, "#2f6a86") +
  L(
    [1200, 1700, 2300, 2900, 3400]
      .map((x, i) => `M${o + x} ${GROUND + 44 + (i % 2) * 30}h${80 + (i % 3) * 30}`)
      .join(""),
    "#8fc1d8",
    4,
    'opacity=".4"',
  ) +
  O(o + 2810, GROUND + 60, 160, 18, N.warm, 'opacity=".14"');

// ── Grades 6-8 canyon pieces ─────────────────────────────────────────────────────────
const rockFace = (d, lit, c = D) => P(d, c.rock) + P(lit, c.rockL, 'opacity=".75"');

const tent = (o) =>
  foot(o + 1250, 80) +
  P(`M${o + 1180} ${GROUND}L${o + 1250} 690L${o + 1320} ${GROUND}Z`, D.sand) +
  P(`M${o + 1250} 690L${o + 1320} ${GROUND}H${o + 1262}Z`, "#f6e6c2") +
  P(`M${o + 1250} 690L${o + 1262} ${GROUND}H${o + 1232}Z`, D.sandD) +
  P(`M${o + 1250} 730L${o + 1258} ${GROUND}H${o + 1238}Z`, "#3a2418") +
  L(`M${o + 1250} 690l-6 -14`, D.metal, 4);

const mast = (o) => {
  const x = o + 1384;
  return (
    foot(x, 40) +
    R(x - 4, 560, 8, 230, D.metal) +
    R(x, 560, 4, 230, D.metalL) +
    L(`M${x} 560l-30 60M${x} 560l30 60M${x - 24} 620h48M${x - 30} 700l30 -80 30 80`, D.metal, 4) +
    `<circle class="lexp-pulse" cx="${x}" cy="556" r="9" fill="${D.teal}"/>` +
    Ci(x, 556, 20, D.teal, 'opacity=".25"')
  );
};

const pillarCave = (o) =>
  foot(o + 2172, 50) +
  rockFace(
    `M${o + 2140} ${GROUND}L${o + 2152} 470H${o + 2192}L${o + 2204} ${GROUND}Z`,
    `M${o + 2176} 470H${o + 2192}L${o + 2204} ${GROUND}H${o + 2182}Z`,
  ) +
  R(o + 2148, 462, 50, 12, D.rockL, 'rx="5"') +
  L(`M${o + 2150} 560h40M${o + 2146} 660h50`, D.rockD, 3, 'opacity=".6"') +
  P(`M${o + 2240} ${GROUND}Q${o + 2300} 680 ${o + 2360} ${GROUND}Z`, D.rock) +
  P(
    `M${o + 2300} 688Q${o + 2340} 720 ${o + 2360} ${GROUND}H${o + 2330}Z`,
    D.rockL,
    'opacity=".7"',
  ) +
  P(`M${o + 2260} ${GROUND}Q${o + 2300} 700 ${o + 2340} ${GROUND}Z`, D.cave);

const warnPass = (o) =>
  foot(o + 3010, 70) +
  foot(o + 3190, 70) +
  rockFace(
    `M${o + 2960} ${GROUND}L${o + 2990} 420L${o + 3040} 430L${o + 3060} ${GROUND}Z`,
    `M${o + 3016} 425L${o + 3040} 430L${o + 3060} ${GROUND}H${o + 3030}Z`,
  ) +
  rockFace(
    `M${o + 3140} ${GROUND}L${o + 3160} 430L${o + 3210} 420L${o + 3240} ${GROUND}Z`,
    `M${o + 3186} 424L${o + 3210} 420L${o + 3240} ${GROUND}H${o + 3206}Z`,
  ) +
  L(
    `M${o + 2980} 540h56M${o + 2972} 660h74M${o + 3158} 520h50M${o + 3152} 640h74`,
    D.rockD,
    3,
    'opacity=".55"',
  ) +
  `<g transform="translate(${o + 3100} 690)">${foot(0, 26, 0.3, 102)}${R(-4, 0, 8, 100, D.metal)}${R(0, 0, 4, 100, D.metalL)}${P("M0 -52L46 28H-46Z", "#c98b2a")}${P("M0 -50L44 26H-44Z", D.amber)}${P("M0 -50L44 26H6Z", "#f7d27a", 'opacity=".7"')}${L("M0 -24v26", D.metal, 7)}${Ci(0, 14, 4, D.metal)}</g>`;

const archive = (o) => {
  const x = o + 1120;
  return (
    foot(x + 180, 220) +
    R(x, 520, 360, 270, D.adobe) +
    R(x + 250, 520, 110, 270, D.adobeL, 'opacity=".7"') +
    P(`M${x - 20} 520L${x + 180} 440L${x + 380} 520Z`, D.adobeD) +
    P(`M${x + 180} 440L${x + 380} 520H${x + 180}Z`, "#a8623f") +
    R(x - 20, 516, 400, 10, "#7a4530") +
    [0, 1, 2, 3]
      .map(
        (i) =>
          R(x + 30 + i * 85, 560, 28, GROUND - 560, "#e4b48a") +
          R(x + 46 + i * 85, 560, 12, GROUND - 560, "#f2cba3") +
          R(x + 24 + i * 85, 552, 40, 10, "#e4b48a"),
      )
      .join("") +
    P(`M${x + 150} ${GROUND}V660Q${x + 180} 630 ${x + 210} 660V${GROUND}Z`, "#2a140c")
  );
};

const drawers = (o) => {
  const x = o + 2110;
  let s =
    foot(x + 100, 130) +
    R(x, 590, 200, 200, "#6e4a2e") +
    R(x + 150, 590, 50, 200, "#87603e") +
    R(x - 6, 582, 212, 12, "#8a5f3c", 'rx="3"');
  for (let r = 0; r < 3; r += 1)
    for (let c = 0; c < 3; c += 1)
      s +=
        R(x + 14 + c * 62, 604 + r * 60, 50, 46, "#8a5f3c") +
        R(x + 14 + c * 62, 604 + r * 60, 50, 6, "#a5764d") +
        R(x + 30 + c * 62, 622 + r * 60, 18, 6, "#f2c15b", 'rx="2"');
  return s;
};

const vents = (o) => {
  const x = o + 2940;
  let s =
    foot(x + 160, 200) +
    R(x, 500, 320, 290, "#a0614a") +
    R(x + 220, 500, 100, 290, "#b8704a", 'opacity=".8"') +
    R(x - 8, 490, 336, 14, "#7a4232");
  for (let r = 0; r < 4; r += 1)
    for (let c = 0; c < 4; c += 1)
      s +=
        R(x + 40 + c * 72, 540 + r * 60, 30, 20, "#5a2f25", 'rx="3"') +
        R(x + 40 + c * 72, 556 + r * 60, 30, 4, "#c88560", 'rx="2" opacity=".6"');
  return s;
};

const windCave = (o) =>
  foot(o + 1500, 300, 0.25) +
  P(
    `M${o + 1200} ${GROUND}Q${o + 1300} 540 ${o + 1500} 520Q${o + 1700} 540 ${o + 1800} ${GROUND}Z`,
    "#8a4a36",
  ) +
  P(
    `M${o + 1520} 522Q${o + 1700} 540 ${o + 1800} ${GROUND}H${o + 1640}Q${o + 1640} 600 ${o + 1520} 540Z`,
    "#b0603f",
    'opacity=".7"',
  ) +
  L(
    `M${o + 1260} 660q120 -20 240 -10M${o + 1240} 730q160 -16 300 -6`,
    "#6e3428",
    4,
    'opacity=".5"',
  ) +
  P(`M${o + 1420} ${GROUND}Q${o + 1500} 650 ${o + 1580} ${GROUND}Z`, D.cave) +
  `<path class="lexp-wind" d="M${o + 1250} 620q60 -20 120 0t120 0" stroke="${D.ivory}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".5"/>`;

const overhang = (o) =>
  foot(o + 2800, 260, 0.25) +
  P(
    `M${o + 2560} ${GROUND}L${o + 2600} 460Q${o + 2800} 400 ${o + 3000} 470L${o + 3040} ${GROUND}Z`,
    "#8a4a36",
  ) +
  P(
    `M${o + 2860} 432Q${o + 2940} 444 ${o + 3000} 470L${o + 3040} ${GROUND}H${o + 2920}Q${o + 2920} 560 ${o + 2860} 470Z`,
    "#b0603f",
    'opacity=".7"',
  ) +
  P(
    `M${o + 2600} 460Q${o + 2800} 400 ${o + 3000} 470L${o + 2996} 486Q${o + 2800} 420 ${o + 2604} 478Z`,
    "#c46f4c",
    'opacity=".7"',
  ) +
  P(
    `M${o + 2700} ${GROUND}Q${o + 2700} 600 ${o + 2800} 580Q${o + 2900} 600 ${o + 2900} ${GROUND}Z`,
    D.cave,
  ) +
  `<path class="lexp-wind" d="M${o + 2600} 520q60 -20 120 0t120 0" stroke="${D.ivory}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".5"/>`;

const outcrop = (o) =>
  foot(o + 1480, 90, 0.3) +
  P(`M${o + 1400} ${GROUND}l40 -90 40 30 40 -60 40 120Z`, "#7a5a48") +
  P(`M${o + 1520} 670l40 120h-30Z`, "#9a7660", 'opacity=".8"');

const station = (o) =>
  foot(o + 2760, 260, 0.25) +
  P(`M${o + 2500} ${GROUND}L${o + 2700} 560L${o + 3000} ${GROUND}Z`, "#6e3428") +
  P(`M${o + 2700} 560L${o + 3000} ${GROUND}H${o + 2800}Z`, "#8e4733", 'opacity=".7"') +
  R(o + 2690, 500, 160, 90, D.ivory) +
  R(o + 2800, 500, 50, 90, "#d9d3c4") +
  R(o + 2682, 492, 176, 12, D.metal, 'rx="3"') +
  R(o + 2710, 520, 30, 30, D.teal) +
  R(o + 2712, 522, 12, 12, "#bfe9e6", 'opacity=".6"') +
  R(o + 2760, 530, 26, 60, D.metalL) +
  L(`M${o + 2920} 440l-40 60`, D.metal, 8) +
  P(`M${o + 2876} 486a70 70 0 0 1 94 -86l-6 14a56 56 0 0 0 -76 70Z`, D.ivory) +
  P(`M${o + 2876} 486a70 70 0 0 1 20 -60l10 10a56 56 0 0 0 -18 46Z`, "#d9d3c4") +
  `<circle class="lexp-pulse" cx="${o + 2925}" cy="430" r="14" fill="${D.teal}"/>`;

/** Landmarks: one function per land, drawn at the land's slots (offset o = land * 4000). */
export const LANDMARKS = {
  "3-5": [
    (o) => signpost(o) + bridge(o) + bigTree(o),
    (o) =>
      pillar(o + 1180, 560, 46, N) +
      pillar(o + 1260, 600, 46, N) +
      pillar(o + 1400, 640, 46, N) +
      bookcase(o) +
      owlHouse(o),
    (o) => mesaLedge(o) + spireBed(o),
    (o) => coast(o) + cottage(o) + lighthouse(o),
  ],
  "6-8": [
    (o) => tent(o) + mast(o) + pillarCave(o) + warnPass(o),
    (o) => archive(o) + drawers(o) + vents(o),
    (o) => windCave(o) + overhang(o),
    (o) => outcrop(o) + station(o),
  ],
};

/** The stone gate at the end of a land; its opening (.lexp-gate) is filled by CSS (dark, then lit when open). */
export const gateArch = (x, band, land) => {
  const c =
    band === "6-8"
      ? { s: "#a0614a", l: "#c47a58", d: "#7a4232" }
      : { s: N.stone, l: N.stoneL, d: N.stoneD };
  return (
    foot(x, 130) +
    P(
      `M${x - 100} ${GROUND}V600Q${x} 480 ${x + 100} 600V${GROUND}H${x + 70}V610Q${x} 530 ${x - 70} 610V${GROUND}Z`,
      c.s,
    ) +
    P(
      `M${x + 70} ${GROUND}V610Q${x + 60} 560 ${x + 30} 546L${x + 40} 514Q${x + 92} 540 ${x + 100} 600V${GROUND}Z`,
      c.l,
      'opacity=".8"',
    ) +
    L(
      `M${x - 100} 680h30M${x - 100} 740h30M${x + 70} 660h30M${x + 70} 720h30M${x - 88} 600l26 10M${x + 88} 600l-26 10`,
      c.d,
      3,
      'opacity=".6"',
    ) +
    P(`M${x - 16} 512h32l-4 34h-24Z`, c.l) +
    `<path class="lexp-gate" data-gate="${land}" d="M${x - 70} ${GROUND}V610Q${x} 530 ${x + 70} 610V${GROUND}Z"/>`
  );
};

/** A stop lantern on a post. Its light (.lexp-mark-glow) is filled by CSS: dark until the stop is finished. */
export const stopLamp = (x, land, k, band) => {
  const r = band === "6-8" ? 10 : 14;
  const post = band === "6-8" ? D.metal : "#3a2a20";
  const lit = band === "6-8" ? D.metalL : "#5a4130";
  return `<g class="lexp-mark" data-mark="${land}-${k}">${foot(x, 22, 0.3)}<rect x="${x - 4}" y="${GROUND - 120}" width="8" height="120" fill="${post}"/><rect x="${x}" y="${GROUND - 120}" width="4" height="120" fill="${lit}"/><rect x="${x - r - 4}" y="${GROUND - 128 - r - 8}" width="${(r + 4) * 2}" height="6" rx="3" fill="${post}"/><rect x="${x - r - 4}" y="${GROUND - 128 + r + 2}" width="${(r + 4) * 2}" height="6" rx="3" fill="${post}"/><circle class="lexp-mark-glow" cx="${x}" cy="${GROUND - 128}" r="${r}"/><path d="M${x - 4} ${GROUND - 136}a6 6 0 0 1 6 -4" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
};

/** The explorer (viewBox 0 0 100 150, facing right). Leg groups and the halo keep their classes for the CSS walk. */
export const HERO = {
  "3-5": [
    `<circle class="lexp-halo" cx="78" cy="94" r="30" fill="#f2c15b" opacity=".35"/>`,
    O(50, 141, 22, 3.5, "#050d16", 'opacity=".35"'),
    `<g class="lexp-leg-l"><rect x="36" y="102" width="11" height="34" rx="5" fill="#244a66"/><ellipse cx="44" cy="137" rx="7" ry="3.6" fill="#1b2a38"/></g>`,
    `<g class="lexp-leg-r"><rect x="52" y="102" width="11" height="34" rx="5" fill="#2d5a7b"/><ellipse cx="60" cy="137" rx="7" ry="3.6" fill="#22313f"/></g>`,
    P("M30 66Q30 58 40 58H60Q70 58 70 66V108H30Z", "#c8553d"),
    P("M54 58H60Q70 58 70 66V108H56Z", "#a8432f"),
    P("M43 58H57L50 72Z", "#f7f4ec"),
    L("M50 72V106", "#a8432f", 2),
    R(30, 98, 40, 8, "#7a3324", 'rx="3"'),
    P("M33 64Q24 80 30 96", "none", 'stroke="#a8432f" stroke-width="9" stroke-linecap="round"'),
    L("M66 66Q78 74 76 84", "#c8553d", 9),
    Ci(76, 86, 4.6, "#a86b45"),
    L("M72 86Q78 78 84 86", "#5a4130", 2.2),
    R(71, 86, 14, 18, "#f2c15b", 'rx="4"'),
    R(78, 86, 7, 18, "#d99a2b", 'rx="3"'),
    R(73, 90, 6, 10, "#ffe9a0", 'rx="2"'),
    R(47, 54, 7, 6, "#8d5638"),
    Ci(52, 40, 17, "#a86b45"),
    P("M54 23A17 17 0 0 1 54 57A13 17 0 0 0 54 23Z", "#8d5638", 'opacity=".45"'),
    Ci(41, 26, 9, "#2a1d17"),
    Ci(50, 21, 10, "#2a1d17"),
    Ci(61, 24, 8.5, "#2a1d17"),
    Ci(36, 36, 8, "#2a1d17"),
    Ci(38, 46, 6.5, "#2a1d17"),
    Ci(47, 42, 3.4, "#8d5638"),
    Ci(57, 40, 1.9, "#1d2b3a"),
    Ci(64, 40, 1.9, "#1d2b3a"),
    O(56, 46.5, 2.6, 1.6, "#e98a6c", 'opacity=".5"'),
    L("M57 49Q60.5 51.5 64 49", "#5a3420", 1.5),
    L("M44 17Q50 13 56 16", "#5a4a40", 2, 'opacity=".6"'),
  ].join(""),
  "6-8": [
    `<circle class="lexp-halo" cx="80" cy="54" r="26" fill="#1fa6a2" opacity=".35"/>`,
    O(51, 147, 22, 3.5, "#1a0c08", 'opacity=".35"'),
    `<g class="lexp-leg-l"><rect x="37" y="100" width="11" height="42" rx="5" fill="#22313f"/><ellipse cx="45" cy="143" rx="7.5" ry="3.6" fill="#4a2e22"/></g>`,
    `<g class="lexp-leg-r"><rect x="53" y="100" width="11" height="42" rx="5" fill="#2a3a48"/><ellipse cx="61" cy="143" rx="7.5" ry="3.6" fill="#5a3826"/></g>`,
    R(24, 52, 26, 40, "#b67a32", 'rx="8"'),
    R(24, 52, 9, 40, "#94622a", 'rx="6"'),
    R(27, 62, 20, 10, "#d09a4a", 'rx="3"'),
    P("M32 58Q32 48 44 48H58Q70 48 70 58V106H32Z", "#126e6c"),
    P("M56 48H58Q70 48 70 58V106H58Z", "#0d5856"),
    P("M45 48H57L51 60Z", "#e9eef2"),
    R(32, 96, 38, 8, "#0b4746", 'rx="3"'),
    L("M40 52L36 92", "#7a5226", 3),
    L("M68 62Q78 66 80 58", "#126e6c", 8),
    Ci(80, 56, 4.4, "#a86b45"),
    R(76, 46, 9, 16, "#2a3a48", 'rx="2"'),
    R(81, 46, 4, 16, "#4d6273", 'rx="1.5"'),
    Ci(80.5, 50, 1.6, "#1fa6a2"),
    R(79, 36, 2, 10, "#2a3a48"),
    R(48, 44, 7, 6, "#8d5638"),
    Ci(53, 32, 15, "#a86b45"),
    P("M55 17A15 15 0 0 1 55 47A11 15 0 0 0 55 17Z", "#8d5638", 'opacity=".45"'),
    P("M38 34Q36 18 52 16Q64 16 68 26Q58 22 48 26Q42 30 38 34Z", "#3a2418"),
    P("M38 30Q38 34 41 44Q36 42 36 34Z", "#3a2418"),
    P("M36 26Q52 6 70 26L77 28L36 30Z", "#c94f3b"),
    P("M54 14Q66 16 70 26L77 28L58 29Z", "#a8432f"),
    Ci(47, 34, 3, "#8d5638"),
    Ci(57, 32, 1.8, "#1d2b3a"),
    Ci(63, 32, 1.8, "#1d2b3a"),
    O(57, 38, 2.4, 1.5, "#e98a6c", 'opacity=".5"'),
    L("M57 41Q60 43 63 41", "#5a3420", 1.5),
  ].join(""),
};
