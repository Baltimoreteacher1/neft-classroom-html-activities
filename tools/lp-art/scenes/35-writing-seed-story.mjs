import {
  circle,
  cloud,
  ellipse,
  fence,
  flower,
  ground,
  HAIR,
  P,
  panels,
  person,
  SKIN,
  sky,
  stroke,
  sun,
  table,
  tr,
  tuft,
} from "../../../access-practice-lab/src/art/kit.js";
import { joints, pot, potTop, sprout, wateringCan } from "../lib/d.mjs";

// One girl, one pot on a garden table, three moments: plant the seed, water the sprout, the flower blooms.
const GIRL = {
  skin: SKIN[4],
  hair: HAIR[0],
  hairStyle: "braid",
  top: P.coral,
  bottom: P.navy,
  sleeve: "short",
};
const GH = 168;

const step = (i, x, y, w, h) => {
  const gy = y + h - 44;
  const gx = x + 58;
  const tx = x + w - 92;
  const tableTop = gy - 36;
  const potX = tx + 40;
  let s =
    sky(x + w, y + h, "morning").replace('<rect x="0"', `<rect x="${x}"`) +
    sun(x + 80, y + 62, 17) +
    (i < 2 ? cloud(x + w - 50, y + 52, 0.5) : "");
  s +=
    fence(x - 10, x + w + 10, gy - 40, 46) +
    ground(x + w, gy - 44, h, "grass", { seed: 3 + i }).replace(/<rect x="0"/, `<rect x="${x}"`);
  s += table(tx, gy, 80, 28, { color: P.wood });
  s += pot(potX, tableTop, 56);
  const top = potTop(tableTop, 56);
  if (i === 0) {
    const o = { ...GIRL, pose: "point" };
    const [hx, hy] = joints(gx, gy, GH, o).hand;
    s +=
      person(gx, gy, GH, o) +
      ellipse(hx + 2, hy + 9, 4.2, 5.6, "#8a5a2b") +
      circle(hx + 1, hy + 7, 1.4, "#c99a62") +
      stroke(
        `M${hx + 2} ${hy + 18} q-2 10 ${potX - hx - 6} ${top - hy - 22}`,
        "#8a5a2b",
        1.6,
        'stroke-dasharray="2 5" opacity=".7"',
      ) +
      ellipse(potX - 4, top - 1, 4, 2.6, "#8a5a2b");
  }
  if (i === 1) {
    const o = { ...GIRL, pose: "hold" };
    const [hx, hy] = joints(gx, gy, GH, o).hand;
    s += sprout(potX, top, 1.3) + person(gx, gy, GH, o);
    s += `<g transform="translate(${hx.toFixed(1)} ${hy.toFixed(1)}) rotate(22) scale(1.0)">${wateringCan(1, { color: P.teal, pour: false })}</g>`;
    const sx = hx + 29;
    const sy = hy + 1;
    s += stroke(
      `M${sx} ${sy} q6 8 6 ${top - sy - 2}M${sx + 4} ${sy - 1} q9 8 10 ${top - sy - 2}M${sx - 3} ${sy + 1} q3 8 2 ${top - sy - 2}`,
      "#5fb3d6",
      2.2,
      'stroke-dasharray="5 4"',
    );
  }
  if (i === 2) {
    const o = { ...GIRL, pose: "cheer", mouth: "open" };
    s += tr(potX, top + 2, flower(0, 0, 2.3, { kind: "sunflower" })) + person(gx, gy, GH, o);
  }
  s += tuft(x + 14, gy + 30, 1) + tuft(x + w - 14, gy + 36, 0.9);
  return s;
};

export default {
  file: "35-writing-seed-story.svg",
  w: 640,
  h: 400,
  title:
    "Three panels: 1) a girl puts a seed in a pot of soil, 2) she waters the pot and a small sprout grows, 3) a tall yellow flower blooms in the pot and she smiles.",
  draw: () => panels(640, 400, 3, step),
};
