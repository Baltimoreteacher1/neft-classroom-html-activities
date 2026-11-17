import {
  circle,
  ellipse,
  g,
  light,
  line,
  mix,
  P,
  path,
  rect,
  rgrad,
  rng,
  shade,
  stroke,
  tag,
  tuft,
  vgrad,
} from "../../../access-practice-lab/src/art/kit.js";

const X = 330;
const SOIL = 252;

function petals() {
  let s = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 360;
    s += `<ellipse cx="${X}" cy="${78 - 25}" rx="9" ry="21" fill="${i % 2 ? P.coral : P.coralLight}" transform="rotate(${a} ${X} 78)"/>`;
  }
  return (
    s +
    circle(X, 78, 15, P.gold) +
    circle(X - 4, 74, 6, P.goldLight) +
    circle(X, 78, 15, "none", `stroke="${shade(P.gold, 0.2)}" stroke-width="2"`)
  );
}

function roots() {
  const R = rng(5);
  let d = "M330 252 C328 290 334 320 328 360";
  const main = [
    [-1, 270, 60],
    [1, 278, 66],
    [-1, 296, 52],
    [1, 304, 50],
    [-1, 318, 40],
    [1, 326, 34],
  ];
  for (const [s, y, len] of main)
    d += ` M${X - 1} ${y} q${s * len * 0.5} ${len * 0.15} ${s * len} ${len * 0.75}`;
  let fine = "";
  for (let i = 0; i < 18; i++) {
    const x = X + (R() - 0.5) * 120;
    const y = 290 + R() * 70;
    fine += `M${x.toFixed(1)} ${y.toFixed(1)} q${((R() - 0.5) * 16).toFixed(1)} 8 ${((R() - 0.5) * 14).toFixed(1)} 16`;
  }
  return stroke(d, "#efe2c4", 4.2) + stroke(fine, "#e3d3ad", 1.6, 'opacity=".9"');
}

function pebbles() {
  const R = rng(9);
  let s = "";
  for (let i = 0; i < 26; i++) {
    const x = R() * 640;
    const y = SOIL + 20 + R() * 130;
    if (Math.abs(x - X) < 90 && y < 370) continue;
    s += ellipse(x, y, 3 + R() * 5, 2 + R() * 3, mix(P.soilDark, "#c9b79a", 0.4 + R() * 0.3));
  }
  return s;
}

const leader = (x1, y1, x2, y2) =>
  line(x1, y1, x2, y2, P.navy, 2) + circle(x2, y2, 4, P.navy) + circle(x2, y2, 1.6, "#ffffff");

export default {
  file: "35-reading-plant-parts.svg",
  w: 640,
  h: 400,
  title: "A plant with four labels: flower, leaf, stem, and roots. The roots are under the soil.",
  draw: () =>
    rect(
      0,
      0,
      640,
      SOIL,
      vgrad([
        [0, P.skyTop],
        [0.7, P.sky],
        [1, P.skyLow],
      ]),
    ) +
    circle(
      70,
      40,
      120,
      rgrad([
        [0, "#fff4c9", 0.7],
        [1, "#fff4c9", 0],
      ]),
    ) +
    rect(
      0,
      SOIL,
      640,
      148,
      vgrad([
        [0, "#9a6b45"],
        [0.4, P.soil],
        [1, "#5e3c25"],
      ]),
    ) +
    pebbles() +
    rect(0, SOIL - 6, 640, 10, P.grass) +
    rect(0, SOIL + 2, 640, 4, P.grassDark, 'opacity=".6"') +
    tuft(60, SOIL - 2, 1.2) +
    tuft(150, SOIL - 2) +
    tuft(520, SOIL - 2, 1.1) +
    tuft(600, SOIL - 2) +
    roots() +
    // stem
    path(
      `M${X - 5} ${SOIL + 2} C${X - 7} 200 ${X + 3} 140 ${X - 3} 90 L${X + 4} 90 C${X + 10} 140 ${X} 200 ${X + 5} ${SOIL + 2}Z`,
      P.leafDark,
    ) +
    path(
      `M${X - 1} ${SOIL} C${X - 2} 200 ${X + 6} 140 ${X + 1} 92 L${X + 4} 92 C${X + 9} 140 ${X + 2} 200 ${X + 5} ${SOIL}Z`,
      shade(P.leafDark, 0.2),
      'opacity=".6"',
    ) +
    // leaves
    path(
      `M${X - 2} 196 C${X - 30} 170 ${X - 86} 168 ${X - 112} 186 C${X - 84} 208 ${X - 30} 212 ${X - 2} 196Z`,
      P.leaf,
    ) +
    path(
      `M${X - 2} 196 C${X - 40} 192 ${X - 80} 188 ${X - 112} 186 C${X - 84} 208 ${X - 30} 212 ${X - 2} 196Z`,
      shade(P.leaf, 0.15),
    ) +
    stroke(`M${X - 4} 196 Q${X - 60} 188 ${X - 104} 187`, light(P.leaf, 0.35), 1.6) +
    path(
      `M${X + 2} 150 C${X + 30} 122 ${X + 88} 118 ${X + 116} 132 C${X + 90} 160 ${X + 32} 166 ${X + 2} 150Z`,
      P.leaf,
    ) +
    path(
      `M${X + 2} 150 C${X + 40} 144 ${X + 84} 138 ${X + 116} 132 C${X + 90} 160 ${X + 32} 166 ${X + 2} 150Z`,
      shade(P.leaf, 0.15),
    ) +
    stroke(`M${X + 4} 150 Q${X + 60} 140 ${X + 108} 133`, light(P.leaf, 0.35), 1.6) +
    path(
      `M${X - 2} 94 Q${X - 18} 102 ${X - 20} 92 Q${X - 10} 88 ${X - 2} 94Z M${X + 2} 94 Q${X + 18} 102 ${X + 20} 92 Q${X + 10} 88 ${X + 2} 94Z`,
      P.leafDark,
    ) +
    petals() +
    // labels
    leader(214, 62, X - 26, 70) +
    tag(170, 62, "flower", { size: 20 }) +
    leader(214, 150, X - 3, 160) +
    tag(178, 150, "stem", { size: 20 }) +
    leader(506, 100, X + 82, 136) +
    tag(544, 100, "leaf", { size: 20 }) +
    leader(506, 318, X + 40, 316) +
    tag(548, 318, "roots", { size: 20 }),
};
