import {
  cloud,
  ellipse,
  fence,
  flower,
  ground,
  HAIR,
  haze,
  P,
  panels,
  person,
  SKIN,
  sky,
  stroke,
  sun,
  tr,
  tree,
  tuft,
} from "../../../access-practice-lab/src/art/kit.js";
import { bee, joints, shovel, tomatoPlant, wateringCan } from "../lib/d.mjs";

// Four panels, same two students: 1 Rosa and Malik dig with small shovels; 2 Rosa drops seeds in the holes;
// 3 Malik waters the soil; 4 weeks later tall tomato plants and a sunflower, a bee flies by, Rosa cheers.
const ROSA = {
  skin: SKIN[2],
  hair: HAIR[1],
  hairStyle: "long",
  top: P.coral,
  bottom: P.navy,
  sleeve: "short",
};
const MALIK = { skin: SKIN[4], hair: HAIR[0], hairStyle: "short", top: P.teal, bottom: "#3e4a5c" };
const KH = 158;
const hole = (x, y) => ellipse(x, y, 9, 3.2, "#4f3420") + ellipse(x + 8, y - 2, 5, 2.4, "#9b6b45");

const step = (i, x, y, w, h) => {
  const gy = y + h - 36;
  let s =
    sky(x + w, gy - 100, "day") +
    sun(x + w - 32, y + 50, 14) +
    (i % 2 ? cloud(x + 50, y + 92, 0.4) : cloud(x + 96, y + 100, 0.4));
  s +=
    tree(x + (i % 2 ? 30 : 110), gy - 110, 0.55, { seed: i + 1, tone: haze(P.leaf, 0.35) }) +
    ground(x + w, gy - 112, 90, "grass", { seed: i + 2 }) +
    fence(x - 10, x + w + 10, gy - 70, 40) +
    ground(x + w, gy - 30, 80, "soil", { seed: i });
  if (i === 0) {
    const r = { ...ROSA, pose: "hold" };
    const m = { ...MALIK, pose: "hold", facing: -1 };
    const [rx, ry] = joints(x + 28, gy, KH, r).hand;
    const [mx, my] = joints(x + 122, gy - 16, KH * 0.9, m).hand;
    s += ellipse(x + 62, gy - 12, 11, 3.5, "#9b6b45") + ellipse(x + 104, gy + 4, 12, 4, "#9b6b45");
    s += person(x + 122, gy - 16, KH * 0.9, m) + shovel(mx, my, x + 60, gy - 12, { color: P.blue });
    s += person(x + 28, gy, KH, r) + shovel(rx, ry, x + 96, gy + 4, { color: P.gold });
  }
  if (i === 1) {
    const r = { ...ROSA, pose: "point" };
    const [hx, hy] = joints(x + 26, gy, KH, r).hand;
    s += hole(x + 86, gy + 8) + hole(x + 110, gy + 16) + hole(x + 128, gy + 4);
    s += person(x + 26, gy, KH, r);
    s +=
      [0, 1, 2]
        .map((k) => ellipse(hx + 2 + k * 2, hy + 14 + k * 20, 3.4, 4.4, "#d9c27e"))
        .join("") + ellipse(x + 86, gy + 7, 3.4, 2.4, "#d9c27e");
  }
  if (i === 2) {
    const m = { ...MALIK, pose: "hold" };
    const [hx, hy] = joints(x + 26, gy, KH, m).hand;
    s += hole(x + 98, gy + 8) + hole(x + 126, gy + 4);
    s +=
      person(x + 26, gy, KH, m) +
      `<g transform="translate(${hx.toFixed(1)} ${hy.toFixed(1)}) rotate(24)">${wateringCan(1, { color: P.blue })}</g>`;
    const sx = hx + 28;
    const sy = hy + 8;
    s += stroke(
      `M${sx} ${sy} q6 14 8 ${gy - sy}M${sx + 5} ${sy - 2} q10 14 14 ${gy - sy + 4}M${sx - 3} ${sy + 2} q3 12 2 ${gy - sy + 2}`,
      "#5fb3d6",
      2.2,
      'stroke-dasharray="5 4"',
    );
    s += ellipse(sx + 12, gy + 6, 18, 4, "#4f3420", 'opacity=".5"');
  }
  if (i === 3) {
    const r = { ...ROSA, pose: "cheer", mouth: "open" };
    s +=
      tr(x + 128, gy + 10, flower(0, 0, 2.1, { kind: "sunflower" })) +
      tomatoPlant(x + 104, gy + 6, 176, { seed: 4, fruit: 8 });
    s += person(x + 46, gy, KH, r);
    s +=
      stroke(
        `M${x + 16} ${y + 96} q20 -20 36 -4 q14 14 30 -6`,
        P.ink,
        1.3,
        'stroke-dasharray="3 4" opacity=".5"',
      ) + bee(x + 96, y + 96, 0.42, { flying: true, pollen: false });
  }
  s += tuft(x + 10, gy + 30, 0.9) + tuft(x + w - 10, gy + 32, 0.8);
  return s;
};

export default {
  file: "35t-garden-seq.svg",
  w: 640,
  h: 400,
  title:
    "Four pictures in order. 1: Two students dig in the soil with small shovels. 2: A student drops seeds into the holes. 3: A student waters the soil with a watering can. 4: Weeks later, tall tomato plants with red tomatoes and a sunflower have grown, a bee flies by, and the student cheers.",
  draw: () => panels(640, 400, 4, step),
};
