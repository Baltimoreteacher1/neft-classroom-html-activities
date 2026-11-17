import {
  arrow,
  cloud,
  ellipse,
  g,
  ground,
  haze,
  hills,
  light,
  P,
  path,
  rain,
  rect,
  shade,
  sky,
  stroke,
  sun,
  tree,
  tuft,
  vgrad,
} from "../../../access-practice-lab/src/art/kit.js";
import { mountain, reeds } from "../lib/a.mjs";

const wavy = (x, y0, y1) => {
  let d = `M${x} ${y0}`;
  const step = 26;
  let y = y0;
  let s = 1;
  while (y - step > y1) {
    d += ` q${s * 9} ${-step / 2} 0 ${-step}`;
    y -= step;
    s = -s;
  }
  return d;
};

export default {
  file: "35-listening-water-cycle.svg",
  w: 640,
  h: 400,
  title:
    "The water cycle. The sun shines on a lake. Wavy arrows show water rising from the lake into the sky. Clouds form over a mountain, rain falls on the mountain, and a river flows back down into the lake.",
  draw: () =>
    sky(640, 300) +
    sun(96, 78, 34) +
    hills(640, 286, { seed: 8, amp: 22 }) +
    mountain(370, 292, 260, 120, { color: haze("#7a9f8a", 0.35), snow: false }) +
    mountain(500, 292, 330, 196, { color: "#6f9a82" }) +
    ground(640, 284, 116, "grass", { seed: 6 }) +
    // river from the mountain slope down into the lake
    stroke(
      "M548 186 C530 214 552 236 528 258 C506 278 478 278 452 296 C432 308 410 316 384 326",
      P.waterDark,
      15,
    ) +
    stroke(
      "M548 186 C530 214 552 236 528 258 C506 278 478 278 452 296 C432 308 410 316 384 326",
      P.water,
      11,
    ) +
    stroke(
      "M543 204 C536 222 546 236 532 252M500 276 C484 282 470 286 456 294M430 308 C418 314 404 318 392 322",
      P.waterLight,
      2.4,
      'opacity=".85"',
    ) +
    // lake
    ellipse(236, 338, 200, 50, shade(P.grass, 0.3), 'opacity=".45"') +
    ellipse(
      232,
      334,
      192,
      46,
      vgrad([
        [0, P.waterLight],
        [1, P.waterDark],
      ]),
    ) +
    stroke("M120 330h40M210 346h52M300 326h34M160 356h30", "#ffffff", 2.4, 'opacity=".7"') +
    reeds(54, 336, 0.7, { seed: 2 }) +
    tree(600, 300, 0.42, { kind: "pine", tone: "#3f7a5a" }) +
    tree(624, 306, 0.36, { kind: "pine", tone: "#3f7a5a" }) +
    tree(40, 300, 0.5, { seed: 3 }) +
    // clouds over the mountain and rain falling on it
    rain(452, 104, 120, 90, { n: 34, seed: 4, color: P.waterDark, o: 0.75 }) +
    cloud(500, 82, 1.15, { tone: "#f4f7f9" }) +
    cloud(580, 104, 0.65, { tone: "#eef3f6" }) +
    // evaporation: wavy arrows rising from the lake
    arrow(wavy(170, 302, 168), P.navy, 4) +
    arrow(wavy(232, 296, 150), P.navy, 4) +
    arrow(wavy(294, 302, 168), P.navy, 4) +
    arrow("M300 128 Q360 76 420 86", P.navy, 3.2).replace(
      "<path ",
      '<path stroke-dasharray="7 9" ',
    ) +
    tuft(470, 384, 1.1) +
    tuft(30, 390),
};
