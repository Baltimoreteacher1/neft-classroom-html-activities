import { P, rect, rrect, ellipse, path, sky, sun, cloud, ground, badge, arrow, vgrad, shade, light, g } from "../../../access-practice-lab/src/art/kit.js";
import { pot, plant, wateringCan } from "../lib/c.mjs";

const XS = [85, 245, 405, 565];
const TOP = 316; // table top / pot base

const seedPot = (x) =>
  pot(x, TOP, 1.5) +
  // cut-away window into the soil showing the planted seed
  rrect(x - 26, TOP - 56, 52, 32, 7, "#5a3a24") +
  rrect(x - 26, TOP - 56, 52, 7, 3, "#6b452b") +
  ellipse(x, TOP - 39, 10, 7, "#c79a5a") +
  ellipse(x - 3, TOP - 42, 4.5, 2.5, "#e6c48a") +
  path(`M${x - 8} ${TOP - 40} q8 4 16 0`, "none", 'stroke="#8a6438" stroke-width="1.4"');

export default {
  file: "35-speaking-seed-steps.svg",
  w: 640,
  h: 400,
  title:
    "Four pots in a row show how a plant grows. First, a seed is planted in the soil and watered. Next, a small sprout with two leaves comes up. Then, the plant grows taller with more leaves in the sun. Last, a yellow flower opens.",
  draw: () =>
    sky(640, 330, "morning") +
    sun(330, 60, 26) +
    cloud(150, 64, 0.7) +
    cloud(520, 50, 0.6) +
    ground(640, 300, 100, "grass", { seed: 2 }) +
    // potting bench
    rect(0, TOP - 4, 640, 14, P.wood) +
    rect(0, TOP - 4, 640, 4, P.woodLight) +
    rect(0, TOP + 10, 640, 90, vgrad([[0, "#c99b6c"], [1, "#a97b4f"]])) +
    rect(0, TOP + 10, 640, 6, shade(P.wood, 0.35), 'opacity=".5"') +
    // 1 seed + water
    seedPot(XS[0]) +
    wateringCan(XS[0] + 52, TOP - 168, 1.5, { color: P.blue, facing: -1 }) +
    [0, 1, 2, 3, 4].map((i) => path(`M${XS[0] - 4 + (i % 2) * 6} ${TOP - 130 + i * 11} q-2 4 0 6 q2 -2 0 -6Z`, P.waterLight)).join("") +
    // 2 sprout
    pot(XS[1], TOP, 1.5) +
    plant(XS[1], TOP - 75, 38, { pairs: 1, leaf: 26 }) +
    // 3 taller with more leaves
    pot(XS[2], TOP, 1.5) +
    plant(XS[2], TOP - 75, 140, { pairs: 4, leaf: 30, seed: 4 }) +
    // 4 flower
    pot(XS[3], TOP, 1.5) +
    plant(XS[3], TOP - 75, 170, { pairs: 4, leaf: 30, seed: 6, flowerColor: P.yellow }) +
    arrow(`M${XS[0] + 52} 270 H${XS[1] - 56}`, P.navy, 4) +
    arrow(`M${XS[1] + 52} 270 H${XS[2] - 56}`, P.navy, 4) +
    arrow(`M${XS[2] + 52} 270 H${XS[3] - 56}`, P.navy, 4) +
    XS.map((x, i) => badge(x, 362, i + 1, { r: 17 })).join(""),
};
