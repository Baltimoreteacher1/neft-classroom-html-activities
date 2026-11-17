import { P, SKIN, HAIR, sky, sun, cloud, building, ground, tree, person, tuft, flower, ellipse, haze, fence, tr, g, path, line } from "../../../access-practice-lab/src/art/kit.js";
import { BP, tomatoBed, sunflowerBed, hands } from "../lib/b.mjs";

const girl = { x: 286, y: 386, h: 128, pose: "hold", facing: -1 };
const boy = { x: 364, y: 392, h: 124, pose: "hold", facing: 1 };
// A child's garden shovel held at the hand, blade down in the soil in front of the boy.
const shovel = g(line(0, -4, 22, 44, P.woodDark, 3.4) + path("M14 40 L32 36 L36 52 Q30 62 22 58Z", "#8f9aa5") + path("M24 38 L32 36 L36 52 Q33 58 28 59Z", "#6f7a85"));
const bh = hands(boy.x, boy.y, boy.h, boy).front;

export default {
  file: "35-speaking-class-garden.svg",
  w: 640,
  h: 400,
  title:
    "A school garden with two wooden garden beds. Tomato plants grow in one bed, and tall sunflowers grow in the other bed. A girl waters the tomatoes with a watering can, and a boy digs with a small shovel. The school building is behind the garden.",
  draw: () =>
    sky(640, 250) +
    sun(586, 54, 22) +
    cloud(120, 54, 0.8) +
    cloud(400, 40, 0.6) +
    tree(40, 236, 0.7, { tone: haze(P.leaf, 0.35), seed: 2 }) +
    tree(612, 238, 0.66, { tone: haze(P.leaf, 0.35), seed: 5 }) +
    building(90, 238, 460, 150, { color: "#c46a50", windows: [7, 2], door: true, trim: P.ivory }) +
    ground(640, 234, 166, "grass", { seed: 6 }) +
    fence(0, 640, 250, 26, "#f4efe6") +
    sunflowerBed(410, 300, 200, { n: 4, tall: 132 }) +
    tomatoBed(40, 330, 196, { n: 4 }) +
    // soil the boy has dug up
    ellipse(bh[0] + 30, boy.y - 10, 30, 8, P.soil) +
    ellipse(bh[0] + 22, boy.y - 14, 16, 7, "#9a6b45") +
    person(girl.x, girl.y, girl.h, {
      ...girl,
      skin: SKIN[3],
      hair: HAIR[0],
      hairStyle: "puffs",
      top: P.coral,
      bottom: "#3e4a5c",
      sleeve: "short",
      item: BP.wateringCan(P.teal, true),
      mouth: "smile",
    }) +
    person(boy.x, boy.y, boy.h, {
      ...boy,
      skin: SKIN[1],
      hair: HAIR[2],
      hairStyle: "short",
      top: P.gold,
      bottom: P.navy,
      sleeve: "short",
      item: shovel,
    }) +
    tuft(20, 392, 1.2) + tuft(620, 388, 1.1) +
    flower(256, 398, 0.8, { color: P.pink }) + flower(612, 400, 0.8, { color: P.gold, center: P.coral }),
};
