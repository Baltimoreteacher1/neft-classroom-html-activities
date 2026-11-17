import { P, SKIN, HAIR, rect, rrect, path, ellipse, circle, g, vgrad, panels, cloud, sun, hills, ground, tree, fence, house, person, dog, tuft, flower, tr, shade, contact, stroke } from "../kit.mjs";
import { BP, openGate, heart, hands } from "../lib/b.mjs";

// The same girl, dad and dog in every panel.
const GIRL = { skin: SKIN[3], hair: HAIR[0], hairStyle: "puffs", top: P.coral, bottom: "#3e4a5c", sleeve: "short" };
const DAD = { age: "adult", skin: SKIN[3], hair: HAIR[0], hairStyle: "short", top: P.teal, bottom: "#2f3b4a", beard: HAIR[0] };
const NEIGHBOR = { age: "adult", skin: SKIN[0], hair: HAIR[4], hairStyle: "long", top: P.gold, bottom: P.navy };
const DOG = "#a8703f";

const backdrop = (x, y, w, h, gy, seed) =>
  rect(x, y, w, h, vgrad([[0, P.skyTop], [0.7, P.sky], [1, P.skyLow]])) +
  cloud(x + w * 0.6, y + 60, 0.5) +
  hills(640, gy, { seed }) +
  ground(640, gy, h, "grass", { seed });

function one(x, y, w, h) {
  const gy = y + 236;
  return (
    backdrop(x, y, w, h, gy, 3) +
    house(x + 72, gy + 4, 112, 80, { color: "#f2dcc0", roof: P.coral, door: P.navy }) +
    rect(x + 10, gy + 2, 7, 38, shade("#f4efe6", 0.2)) +
    fence(x + 66, x + w + 10, gy + 40, 36) +
    openGate(x + 62, gy + 40, 34) +
    flower(x + 78, gy + 80, 0.9, { color: P.pink }) + flower(x + 92, gy + 86, 0.9, { color: P.gold, center: P.coral }) + flower(x + 106, gy + 82, 0.9, { color: P.purple }) +
    person(x + 160, gy + 122, 110, { ...GIRL, pose: "hold", facing: -1, item: BP.wateringCan(P.teal, true), mouth: "o" }) +
    dog(x + 58, gy + 128, 0.9, { color: DOG, pose: "run", facing: -1 }) +
    tuft(x + w - 16, gy + 132)
  );
}

function two(x, y, w, h) {
  const gy = y + 236;
  const tx = x + 96;
  return (
    backdrop(x, y, w, h, gy, 5) +
    tree(tx, gy + 30, 1.2, { seed: 6 }) +
    `<g transform="translate(${tx} ${gy - 46}) scale(1.35)">${BP.poster()}</g>` +
    person(x + 152, gy + 124, 162, { ...DAD, pose: "reach", facing: -1 }) +
    person(x + 44, gy + 128, 118, { ...GIRL, pose: "point", facing: 1, mouth: "flat" }) +
    tuft(x + 16, gy + 130)
  );
}

function three(x, y, w, h) {
  const gy = y + 236;
  const girl = { x: x + 70, y: gy + 126, h: 118 };
  const nh = hands(x + 158, gy + 120, 158, { pose: "stand", facing: -1, age: "adult" }).front;
  return (
    backdrop(x, y, w, h, gy, 7) +
    house(x + 60, gy + 4, 112, 80, { color: "#f2dcc0", roof: P.coral, door: P.navy }) +
    person(x + 158, gy + 120, 158, { ...NEIGHBOR, pose: "stand", facing: -1 }) +
    person(girl.x, girl.y, girl.h, { ...GIRL, pose: "hold", facing: 1, mouth: "open" }) +
    // the dog jumps up into the girl's hug
    stroke(`M${nh[0]} ${nh[1]} Q${nh[0] - 14} ${nh[1] + 50} ${girl.x + 31} ${girl.y - 54}`, P.coral, 2) +
    `<g transform="translate(${girl.x + 42} ${girl.y}) rotate(45) translate(-20 0)">${dog(0, 0, 0.92, { color: DOG, facing: -1 }).replace(/<ellipse[^>]*opacity="0.2"\/>/, "")}</g>` +
    heart(girl.x + 44, girl.y - 104, 1.4) + heart(girl.x + 64, girl.y - 120, 1) +
    tuft(x + 16, gy + 130)
  );
}

export default {
  file: "35-speaking-lost-dog.svg",
  w: 640,
  h: 400,
  title:
    "A picture story in three parts. 1: A brown dog runs out of an open gate while a girl waters flowers. 2: The girl and her father put a Lost Dog poster on a tree. 3: A neighbor brings the dog back, and the girl hugs her dog.",
  draw: () => panels(640, 400, 3, (i, x, y, w, h) => [one, two, three][i](x, y, w, h)),
};
