import { P, SKIN, HAIR, sky, sun, cloud, hills, ground, tree, bench, person, panels, flower, tuft, g } from "../../../access-practice-lab/src/art/kit.js";
import { bottle, sodaCan, wrapper, crumpledPaper, trashBag, gloved, handAt } from "../lib/c.mjs";

// The same two neighbors in every panel.
const GIRL = { skin: SKIN[2], hair: HAIR[1], hairStyle: "braid", top: P.teal, bottom: P.navy, sleeve: "short" };
const MAN = { age: "adult", skin: SKIN[4], hair: HAIR[0], hairStyle: "short", top: P.gold, bottom: "#4e5d6c", beard: true };
const GLOVE = "#f2a93b";

const park = (x, y, w, sunny = true) =>
  sky(640, 400, sunny ? "day" : "morning") +
  sun(x + w - 36, y + 54, 18) +
  cloud(x + 60, y + 64, 0.5) +
  hills(640, y + 208, { seed: 5 }) +
  tree(x + 150, y + 226, 0.85, { seed: 4 }) +
  ground(640, y + 204, 200, "grass", { seed: 6 }) +
  bench(x + 10, y + 252, 96);

const litter = (x, y) =>
  sodaCan(x + 40, y + 316, 1, { lying: true }) +
  bottle(x + 150, y + 352, 0.9, { lying: true }) +
  wrapper(x + 96, y + 296, 1.1) +
  crumpledPaper(x + 30, y + 360, 1.2) +
  wrapper(x + 170, y + 290, 0.9, P.coral) +
  crumpledPaper(x + 120, y + 330, 1) +
  sodaCan(x + 74, y + 372, 0.9, { band: P.blue, lying: true });

const p1 = (x, y, w) => park(x, y, w, false) + litter(x, y) + person(x + 120, y + 350, 132, { ...GIRL, pose: "stand", facing: -1, mouth: "flat" });

const p2 = (x, y, w) => {
  const man = { ...MAN, pose: "stand", facing: 1, item: trashBag(0, 46, 0.62) };
  const girl = { ...GIRL, pose: "point", facing: -1, mouth: "open" };
  const [hx, hy] = handAt(x + 156, y + 360, 124, girl);
  return (
    park(x, y, w, true) +
    sodaCan(x + 30, y + 368, 0.9, { lying: true }) +
    crumpledPaper(x + 170, y + 372, 1) +
    gloved(person(x + 50, y + 344, 156, man), MAN.skin, GLOVE, "adult") +
    trashBag(x + 110, y + 374, 1) +
    gloved(person(x + 156, y + 360, 124, girl), GIRL.skin, GLOVE) +
    sodaCan(hx - 2, hy + 22, 0.9)
  );
};

const p3 = (x, y, w) =>
  park(x, y, w, true) +
  [16, 36, 56, 76, 96].map((dx, i) => flower(x + dx, y + 270 + (i % 2) * 6, 1.1, { color: P.pink, center: P.gold })).join("") +
  flower(x + 170, y + 380, 1, { color: P.pink }) +
  person(x + 66, y + 356, 156, { ...MAN, pose: "cheer", facing: 1 }) +
  person(x + 146, y + 362, 124, { ...GIRL, pose: "wave", facing: -1, mouth: "open" }) +
  tuft(x + 20, y + 380);

export default {
  file: "35-writing-cleanup.svg",
  w: 640,
  h: 400,
  title:
    "Three panels: 1) a park with trash on the grass, 2) neighbors wearing gloves pick up the trash and put it in bags, 3) the clean park has new flowers and the neighbors smile.",
  draw: () => panels(640, 400, 3, (i, x, y, w, h) => [p1, p2, p3][i](x, y, w)),
};
