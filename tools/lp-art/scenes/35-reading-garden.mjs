import { P, SKIN, HAIR, sky, sun, cloud, ground, rect, fence, building, person, flower, planter, stroke, circle, ellipse, path, tuft, haze } from "../../../access-practice-lab/src/art/kit.js";
import { wateringCan, tomatoPlant } from "../lib/a.mjs";

// water arcing from the spout down onto the first tomato plants
const water = () => {
  let s = stroke("M352 262 Q368 270 376 300", "#8fd0e6", 3.2, 'opacity=".85"') + stroke("M350 266 Q362 278 366 302", "#8fd0e6", 2.4, 'opacity=".75"') + stroke("M354 262 Q378 268 388 294", "#8fd0e6", 2, 'opacity=".7"');
  for (const [x, y] of [[378, 308], [366, 310], [390, 302], [374, 316], [360, 306]]) s += ellipse(x, y, 2.2, 3.2, "#8fd0e6");
  return s;
};

export default {
  file: "35-reading-garden.svg",
  w: 640,
  h: 400,
  title:
    "A girl pours water from a green watering can onto red tomato plants in a school garden. Tall yellow sunflowers grow next to her.",
  draw: () =>
    sky(640, 280) +
    sun(560, 58, 24) +
    cloud(330, 54, 0.7) +
    // the school behind the garden
    building(150, 276, 340, 150, { color: haze(P.brick, 0.45), windows: [6, 2], door: false, trim: haze(P.ivory, 0.3), roof: "flat" }) +
    ground(640, 262, 138, "soil", { seed: 3 }) +
    rect(0, 262, 640, 22, haze(P.grass, 0.25)) +
    fence(0, 640, 290, 40) +
    path("M0 330 H640 V400 H0Z", "#c9b393") +
    // sunflowers on both sides of Amara, all taller than she is
    planter(30, 344, 116, 28) +
    flower(86, 346, 2.95, { kind: "sunflower" }) +
    planter(492, 344, 132, 28) +
    flower(526, 346, 3.1, { kind: "sunflower" }) +
    flower(584, 346, 2.75, { kind: "sunflower" }) +
    // tomato bed
    planter(330, 366, 150, 28) +
    tomatoPlant(372, 368, 0.78, { seed: 3 }) +
    tomatoPlant(414, 370, 0.82, { seed: 8 }) +
    tomatoPlant(454, 368, 0.76, { seed: 5 }) +
    // Amara waters the tomatoes
    person(196, 384, 172, { pose: "point", skin: SKIN[4], hair: HAIR[0], hairStyle: "puffs", top: P.coral, bottom: P.navy, sleeve: "short", item: wateringCan("#3f9a52", 15, 0.78) }) +
    water() +
    tuft(250, 396, 0.9, "#8a7a5a") +
    tuft(18, 396, 1.1, "#8a7a5a"),
};
