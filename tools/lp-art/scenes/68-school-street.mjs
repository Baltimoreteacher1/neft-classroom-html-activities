import {
  circle,
  cloud,
  contact,
  ellipse,
  g,
  HAIR,
  haze,
  light,
  line,
  P,
  path,
  person,
  poly,
  rect,
  rrect,
  SKIN,
  shade,
  sky,
  stroke,
  sun,
  tag,
  tr,
  tree,
  vgrad,
} from "../../../access-practice-lab/src/art/kit.js";
import { wallClock } from "../lib/e.mjs";

// A brick school with a SCHOOL sign over the doors, trees along the sidewalk in front,
// and a zebra crosswalk on the street in the foreground. Two students cross; one waits.
const brick = "#b5583f";
const win = (x, y, w = 34, h = 40) =>
  rect(x - 3, y - 3, w + 6, h + 8, "#f1e6d2") +
  rect(
    x,
    y,
    w,
    h,
    vgrad([
      [0, "#cfe9f2"],
      [1, "#86b8cf"],
    ]),
  ) +
  line(x + w / 2, y, x + w / 2, y + h, "#f1e6d2", 3) +
  line(x, y + h * 0.45, x + w, y + h * 0.45, "#f1e6d2", 3) +
  poly(
    [
      [x, y + h],
      [x + w * 0.5, y],
      [x + w * 0.7, y],
      [x + w * 0.2, y + h],
    ],
    "#ffffff",
    'opacity=".25"',
  ) +
  rect(x - 5, y + h + 3, w + 10, 4, shade("#f1e6d2", 0.15));

const school = () => {
  let b = contact(320, 262, 270, 8, 0.2);
  // wings
  b += rect(70, 120, 500, 142, brick) + rect(430, 120, 140, 142, shade(brick, 0.1), 'opacity=".7"');
  b += rect(64, 112, 512, 10, shade(brick, 0.35));
  // mortar courses
  let d = "";
  for (let y = 132; y < 262; y += 10) d += `M70 ${y}H570`;
  b += stroke(d, shade(brick, 0.18), 1, 'opacity=".35"');
  for (const x of [92, 146, 200, 404, 458, 512]) b += win(x, 138) + win(x, 200);
  // central entrance bay
  b +=
    rect(246, 84, 148, 178, light(brick, 0.06)) +
    rect(350, 84, 44, 178, shade(brick, 0.08), 'opacity=".7"');
  b +=
    poly(
      [
        [236, 88],
        [320, 34],
        [404, 88],
      ],
      shade(brick, 0.3),
    ) +
    poly(
      [
        [320, 34],
        [404, 88],
        [320, 88],
      ],
      shade(brick, 0.42),
      'opacity=".6"',
    );
  b += wallClock(320, 66, 15, { hr: 8, min: 0 });
  b += tag(320, 112, "SCHOOL", { size: 18, fill: "#fbf6ec", pad: 10 });
  // doors + steps
  b +=
    rect(282, 160, 76, 102, "#f1e6d2") +
    rect(288, 166, 64, 96, P.navy) +
    line(320, 166, 320, 262, "#0c2840", 2.5);
  b +=
    rect(294, 174, 20, 30, "#9cc6d8", 'opacity=".7"') +
    rect(326, 174, 20, 30, "#9cc6d8", 'opacity=".7"');
  b += circle(314, 216, 2, P.goldLight) + circle(326, 216, 2, P.goldLight);
  b += rect(270, 262, 100, 6, "#d9d5cc") + rect(262, 268, 116, 6, "#cbc6bb");
  // flagpole
  b +=
    rect(584, 96, 4, 172, "#8a929b") +
    circle(586, 94, 4, P.goldLight) +
    path("M588 102 l30 7 l-30 9Z", P.coral);
  return b;
};

const zebra = () => {
  // crosswalk stripes drawn in perspective across the road (road y 300..400)
  let b = "";
  for (let i = 0; i < 7; i++) {
    const t0 = 214 + i * 34;
    b += poly(
      [
        [t0 + 4, 304],
        [t0 + 22, 304],
        [t0 + 22 + (t0 - 320) * 0.32, 400],
        [t0 + 4 + (t0 - 320) * 0.32 - 8, 400],
      ],
      "#f6f3ea",
    );
  }
  return b;
};

export default {
  file: "68-school-street.svg",
  w: 640,
  h: 400,
  title: "A school building with trees in front and a crosswalk on the street.",
  draw: () =>
    sky(640, 280) +
    sun(70, 52, 20) +
    cloud(520, 50, 0.7) +
    cloud(190, 34, 0.5) +
    // far trees behind the school
    tree(40, 270, 0.9, { seed: 3, tone: haze(P.leaf, 0.3) }) +
    tree(620, 270, 0.8, { seed: 5, tone: haze(P.leaf, 0.3) }) +
    rect(0, 256, 640, 14, "#8fb87a") +
    school() +
    // sidewalk
    rect(
      0,
      266,
      640,
      30,
      vgrad([
        [0, "#dcd8cf"],
        [1, "#c9c4b8"],
      ]),
    ) +
    stroke(
      "M40 266v30M140 266v30M240 266v30M400 266v30M500 266v30M600 266v30",
      "#b3ad9f",
      1.2,
      'opacity=".7"',
    ) +
    // street trees in front of the school, standing on the sidewalk
    tree(36, 288, 0.86, { seed: 7 }) +
    tree(214, 284, 0.74, { seed: 11, tone: "#5f9a6a" }) +
    tree(428, 284, 0.74, { seed: 13, tone: "#5a9461" }) +
    tree(606, 288, 0.86, { seed: 17 }) +
    // road
    rect(0, 296, 640, 6, "#d9d5cc") +
    rect(
      0,
      302,
      640,
      98,
      vgrad([
        [0, "#6a7078"],
        [1, "#545a61"],
      ]),
    ) +
    stroke("M10 352h36M90 352h36M514 352h36M594 352h36", "#f3dd8a", 4) +
    zebra() +
    // students: one waits at the curb, two cross together
    person(128, 300, 122, {
      pose: "wave",
      age: "adult",
      skin: SKIN[2],
      hair: "#5b6b8c",
      hairStyle: "hijab",
      top: P.teal,
      bottom: "#3e4a5c",
      skirt: false,
      backpack: P.gold,
      facing: 1,
    }) +
    person(300, 382, 132, {
      pose: "walk",
      age: "adult",
      skin: SKIN[4],
      hair: HAIR[0],
      hairStyle: "curly",
      top: P.gold,
      bottom: P.navy,
      backpack: P.coral,
      facing: -1,
    }) +
    person(352, 372, 126, {
      pose: "walk",
      age: "adult",
      skin: SKIN[0],
      hair: HAIR[3],
      hairStyle: "long",
      top: P.coral,
      bottom: "#4e5d6c",
      backpack: P.blue,
      facing: -1,
    }),
};
