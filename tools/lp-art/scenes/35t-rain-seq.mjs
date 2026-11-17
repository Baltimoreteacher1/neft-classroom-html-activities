import {
  circle,
  cloud,
  contact,
  ellipse,
  g,
  ground,
  HAIR,
  light,
  line,
  P,
  panels,
  path,
  person,
  poly,
  puddle,
  rain,
  rect,
  rrect,
  SKIN,
  shade,
  sky,
  stroke,
  sun,
  tr,
  tree,
  tuft,
  umbrella,
  vgrad,
} from "../../../access-practice-lab/src/art/kit.js";
import { frown } from "../lib/e.mjs";

// Four pictures in order. 1: a girl with a backpack walks to school in the sunshine. 2: dark clouds, rain pours,
// she is wet and sad. 3: her friend comes over with a red umbrella. 4: the two friends share the umbrella and
// arrive at school together, smiling. Same girl and friend in every panel; exactly one umbrella (red), panels 3-4.
const GIRL = {
  age: "child",
  skin: SKIN[4],
  hair: HAIR[0],
  hairStyle: "puffs",
  top: P.gold,
  bottom: P.navy,
  backpack: P.teal,
  sleeve: "short",
};
const FRIEND = {
  age: "child",
  skin: SKIN[1],
  hair: HAIR[2],
  hairStyle: "long",
  top: P.teal,
  bottom: "#3f4a52",
  skirt: false,
};
const RED = P.red;

const sidewalk = (w, gy, h, wet) => {
  let b = rect(
    0,
    gy,
    w,
    h - gy,
    vgrad([
      [0, wet ? "#9aa3ab" : "#d6d2c8"],
      [1, wet ? "#7d868f" : "#bdb8ac"],
    ]),
  );
  b += stroke(
    `M${w * 0.3} ${gy}l-14 ${h - gy}M${w * 0.78} ${gy}l10 ${h - gy}`,
    wet ? "#6f7880" : "#aaa496",
    1.4,
    'opacity=".7"',
  );
  b += rect(0, gy - 6, w, 6, wet ? "#5f8a5a" : P.grass);
  return b;
};
const drips = (x, y) =>
  stroke(`M${x - 12} ${y}v6M${x + 14} ${y + 4}v6M${x} ${y - 6}v5`, "#cfe6f3", 2);

const school = (x, gy, w) =>
  g(
    rect(x, gy - 150, w, 150, P.brick) +
      poly(
        [
          [x - 6, gy - 150],
          [x + w / 2, gy - 196],
          [x + w + 6, gy - 150],
        ],
        shade(P.brick, 0.35),
      ) +
      rect(x + w / 2 - 18, gy - 56, 36, 56, P.navy) +
      rect(x + w / 2 - 22, gy - 60, 44, 4, "#f1e6d2") +
      rect(x + 10, gy - 128, 26, 30, "#cfe4ec") +
      rect(x + w - 36, gy - 128, 26, 30, "#cfe4ec") +
      line(x + w / 2, gy - 196, x + w / 2, gy - 230, "#8a929b", 2.4) +
      path(`M${x + w / 2} ${gy - 230} l22 6 l-22 6Z`, P.coral),
  );

const frame = (i, w, h) => {
  const gy = h - 84;
  const wet = i > 0;
  let b = sky(w, gy, wet ? (i === 3 ? "overcast" : "storm") : "day");
  if (i === 0) b += sun(w - 36, 62, 22) + tree(26, gy, 0.7, { seed: 3 });
  if (i === 1) b += cloud(46, 70, 0.75, { dark: true }) + cloud(112, 100, 0.6, { dark: true });
  if (i === 2) b += cloud(70, 64, 0.8, { dark: true });
  if (i === 3) b += cloud(40, 56, 0.55, { dark: true }) + school(18, gy, 112);
  b += sidewalk(w, gy, h, wet);
  if (i === 1 || i === 2)
    b += rain(0, 40, w, h - 60, { n: 70, seed: 3 + i, color: "#dcecf6", o: 0.75 });
  if (i === 3) b += rain(0, 40, w, h - 80, { n: 26, seed: 9, color: "#e6f0f6", o: 0.55 });
  if (wet) b += puddle(i === 3 ? 40 : 96, h - 34, 34, 7);
  if (i === 0) b += person(64, h - 40, 140, { ...GIRL, pose: "walk", facing: 1 });
  if (i === 1) {
    b += person(72, h - 40, 140, { ...GIRL, pose: "stand", facing: 1, mouth: "flat" });
    b +=
      frown(72, h - 40, 140, { facing: 1, skin: GIRL.skin }) +
      drips(72, h - 196) +
      drips(60, h - 120) +
      drips(92, h - 116);
  }
  if (i === 2) {
    b +=
      person(44, h - 40, 136, { ...GIRL, pose: "stand", facing: 1, mouth: "flat" }) +
      frown(44, h - 40, 136, { facing: 1, skin: GIRL.skin }) +
      drips(44, h - 190);
    b += umbrella(76, h - 156, 36, RED);
    b += person(110, h - 34, 132, { ...FRIEND, pose: "reach", facing: -1, mouth: "smile" });
  }
  if (i === 3) {
    b += umbrella(84, h - 158, 44, RED);
    b += person(52, h - 36, 134, { ...FRIEND, pose: "reach", facing: 1, mouth: "smile" });
    b += person(100, h - 38, 138, { ...GIRL, pose: "walk", facing: -1, mouth: "smile" });
  }
  return b;
};

export default {
  file: "35t-rain-seq.svg",
  w: 640,
  h: 400,
  title:
    "Four pictures in order. 1: A girl with a backpack walks to school in the sunshine. 2: Dark clouds come, rain pours down, and the girl gets wet and looks sad. 3: Her friend comes over with a red umbrella. 4: The two friends share the umbrella and arrive at school together, smiling.",
  draw: () => panels(640, 400, 4, (i, x, y, w, h) => tr(x, y, frame(i, w, h))),
};
