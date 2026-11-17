import {
  building,
  cloud,
  ellipse,
  g,
  ground,
  HAIR,
  haze,
  P,
  person,
  puddle,
  rain,
  rect,
  road,
  SKIN,
  sky,
  stroke,
  tree,
  umbrella,
} from "../../../access-practice-lab/src/art/kit.js";
import { bus, busStop, hands } from "../lib/b.mjs";

const girl = { x: 222, y: 388, h: 126, pose: "reach", facing: 1 };
const gh = hands(girl.x, girl.y, girl.h, girl).front;
const far = (c) => haze(c, 0.62, "#c3ccd3");

export default {
  file: "35-reading-rain.svg",
  w: 640,
  h: 400,
  title:
    "A girl holds a red umbrella in the rain next to her dad at a bus stop. A yellow school bus is coming down the street.",
  draw: () =>
    sky(640, 260, "overcast") +
    cloud(110, 54, 1.3, { dark: true }) +
    cloud(330, 40, 1.1, { dark: true }) +
    cloud(540, 60, 1.4, { dark: true }) +
    building(-10, 236, 120, 150, { color: far(P.brick), windows: [2, 3], door: false }) +
    building(120, 236, 100, 118, { color: far("#c9a46a"), windows: [2, 3], door: false }) +
    building(232, 236, 140, 168, { color: far(P.navy), windows: [3, 3], door: false }) +
    building(384, 236, 110, 128, { color: far(P.teal), windows: [3, 3], door: false }) +
    building(506, 236, 150, 150, { color: far("#b07a62"), windows: [3, 3], door: false }) +
    tree(600, 236, 0.5, { tone: far(P.leaf) }) +
    rain(0, 60, 640, 190, { n: 70, seed: 3, o: 0.55 }) +
    road(640, 242, 68, { curb: true }) +
    ellipse(320, 276, 330, 6, "#ffffff", 'opacity=".08"') +
    bus(330, 302, 0.82, { facing: -1 }) +
    ground(640, 316, 84, "pavement") +
    stroke(
      "M0 352 H640M70 316 L40 400M230 316 L214 400M400 316 L404 400M560 316 L590 400",
      "#a19e96",
      1.2,
      'opacity=".55"',
    ) +
    rect(0, 316, 640, 84, "#4c6c86", 'opacity=".08"') +
    puddle(330, 372, 54) +
    puddle(70, 386, 40) +
    busStop(66, 378, 168) +
    person(140, 386, 176, {
      age: "adult",
      skin: SKIN[2],
      hair: HAIR[0],
      hairStyle: "short",
      top: "#46607a",
      coat: "#3f6b8a",
      bottom: "#2f3b4a",
      beard: HAIR[0],
      facing: 1,
    }) +
    rain(0, 250, 640, 140, { n: 40, seed: 8, o: 0.5 }) +
    umbrella(gh[0], gh[1], 50, "#d0473a") +
    person(girl.x, girl.y, girl.h, {
      pose: girl.pose,
      facing: girl.facing,
      skin: SKIN[1],
      hair: HAIR[1],
      hairStyle: "braid",
      top: P.gold,
      coat: P.gold,
      bottom: P.navy,
      shoes: "#3b7dc4",
      backpack: P.teal,
    }) +
    stroke("M300 376 q8 -6 16 0M352 370 q8 -6 16 0", "#e8f3fa", 1.6, 'opacity=".8"'),
};
