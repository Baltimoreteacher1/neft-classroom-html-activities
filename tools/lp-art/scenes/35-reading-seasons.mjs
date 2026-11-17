import { P, rect, ellipse, circle, path, g, vgrad, panels, tree, ground, sun, cloud, tr, stroke, rng, tuft, flower, mix } from "../kit.mjs";

const S = 0.86;
const BARE = "M-2 -70 Q-18 -86 -30 -100M2 -78 Q18 -92 28 -108M-30 -100 Q-38 -120 -34 -138M-30 -100 Q-50 -108 -60 -122M28 -108 Q40 -126 36 -146M28 -108 Q48 -112 58 -128M0 -88 Q2 -120 -4 -150M-4 -150 Q-14 -162 -20 -170M-4 -150 Q6 -164 12 -172";

function falling(x, y, w, h, seed, cols, n = 9) {
  const R = rng(seed);
  let s = "";
  for (let i = 0; i < n; i++) {
    const cx = x + R() * w;
    const cy = y + R() * h;
    s += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="5" ry="2.6" fill="${cols[i % cols.length]}" transform="rotate(${Math.round(R() * 180)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
  }
  return s;
}
function flakes(x, y, w, h, seed, n = 30) {
  const R = rng(seed);
  let s = "";
  for (let i = 0; i < n; i++) s += circle(x + R() * w, y + R() * h, 1.4 + R() * 2, "#ffffff", 'opacity=".9"');
  return s;
}

const SEASON = [
  // spring
  (x, y, w, h, gy, cx) =>
    rect(x, y, w, h, vgrad([[0, "#a9d6e8"], [1, "#eaf5ec"]])) +
    cloud(cx - 20, y + 60, 0.55) +
    ground(640, gy, h, "grass", { seed: 2 }).replace(/width="640"/, `width="${w}"`).replace(/x="0"/, `x="${x}"`) +
    tree(cx, gy + 6, S, { kind: "blossom", tone: "#f2a9c2", seed: 3 }) +
    falling(x + 6, gy - 30, w - 12, 40, 4, ["#f7c6d6", "#ffffff"], 5) +
    flower(x + 22, y + h - 14, 0.7, { color: P.pink }) + flower(x + w - 24, y + h - 20, 0.6, { color: "#ffffff", center: P.gold }),
  // summer
  (x, y, w, h, gy, cx) =>
    rect(x, y, w, h, vgrad([[0, P.skyTop], [1, P.skyLow]])) +
    sun(x + w - 30, y + 52, 16) +
    ground(640, gy, h, "grass", { seed: 3 }).replace(/width="640"/, `width="${w}"`).replace(/x="0"/, `x="${x}"`) +
    tree(cx, gy + 6, S, { kind: "round", tone: "#3f8f50", seed: 5 }) +
    tuft(x + 20, y + h - 12) + tuft(x + w - 20, y + h - 18, 1.1),
  // fall
  (x, y, w, h, gy, cx) =>
    rect(x, y, w, h, vgrad([[0, "#b9d3df"], [1, "#f6e3c4"]])) +
    ground(640, gy, h, "grass", { seed: 5 }).replace(/width="640"/, `width="${w}"`).replace(/x="0"/, `x="${x}"`) +
    rect(x, gy, w, h, "#c9a057", 'opacity=".35"') +
    tree(cx, gy + 6, S, { kind: "autumn", tone: "#e08a36", seed: 6 }) +
    falling(x + 8, gy - 70, w - 16, 70, 7, [P.orange, P.coral, P.gold, "#c8553d"], 10) +
    falling(x + 6, gy + 10, w - 12, h - (gy - y) - 24, 8, [P.orange, P.coral, P.gold], 12),
  // winter
  (x, y, w, h, gy, cx) =>
    rect(x, y, w, h, vgrad([[0, "#b6c6d4"], [1, "#e6edf2"]])) +
    ground(640, gy, h, "snow", { seed: 6 }).replace(/width="640"/, `width="${w}"`).replace(/x="0"/, `x="${x}"`) +
    tree(cx, gy + 6, S, { kind: "bare", seed: 7 }) +
    tr(cx, gy + 3, stroke(BARE, "#ffffff", 2.4) + ellipse(-30, -101, 7, 3, "#ffffff") + ellipse(28, -110, 7, 3, "#ffffff"), S) +
    ellipse(cx, gy + 8, 44, 7, "#ffffff") +
    flakes(x + 4, y + 4, w - 8, h - 8, 9, 34),
];

export default {
  file: "35-reading-seasons.svg",
  w: 640,
  h: 400,
  title:
    "The same tree in four seasons: pink flowers in spring, green leaves in summer, orange leaves falling in fall, and bare branches with snow in winter.",
  draw: () =>
    panels(640, 400, 4, (i, x, y, w, h) => SEASON[i](x, y, w, h, y + h - 66, x + w / 2), { numbered: false, gutter: 12, pad: 12 }),
};
