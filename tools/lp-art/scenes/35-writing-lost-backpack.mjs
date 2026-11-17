import { P, SKIN, HAIR, sky, cloud, hills, ground, tree, person, panels, rect, rrect, road, building, contact, shade, light, vgrad, g, tr, circle } from "../kit.mjs";
import { bus, backpackShape, handAt } from "../lib/c.mjs";

const BOY = { skin: SKIN[2], hair: HAIR[0], hairStyle: "short", top: P.blue, bottom: P.navy };
const GIRL = { skin: SKIN[4], hair: HAIR[0], hairStyle: "puffs", top: P.coral, bottom: "#3e4a5c", sleeve: "short" };
const pack = (s) => backpackShape(P.green, s);

const p1 = (x, y, w, h) =>
  sky(640, 400) +
  cloud(x + 140, y + 60, 0.55) +
  hills(640, y + 210, { seed: 2 }) +
  tree(x + 150, y + 216, 0.55, { seed: 6 }) +
  ground(640, y + 206, 60, "grass", { seed: 3 }) +
  rect(x, y + 262, w, 120, vgrad([[0, "#cfccc4"], [1, "#b9b6ae"]])) +
  rect(x, y + 258, w, 6, "#e2ded4") +
  bus(x - 60, y + 306, 1, { win2: pack(0.95), winIndex: 2 }) +
  person(x + 150, y + 370, 128, { ...BOY, pose: "walk", facing: 1 });

const seat = (sx, sy, s = 1) => tr(sx, sy, rrect(-26, -64, 52, 70, 10, "#3f6f8c") + rrect(-26, -64, 52, 14, 8, light("#3f6f8c", 0.2)) + rect(-26, 0, 52, 12, shade("#3f6f8c", 0.3)), s);

const girl2 = { ...GIRL, pose: "reach", facing: 1, mouth: "o" };

const p2 = (x, y, w, h) => {
  const gx = x + 74;
  const gy = y + 352;
  const [hx, hy] = handAt(gx, gy, 132, girl2);
  return (
    rect(x, y, w, h, "#f4ecd2") +
    rect(x, y + 50, w, 96, "#e6dcbf") +
    rrect(x + 14, y + 62, w - 28, 70, 8, vgrad([[0, "#bfe0ee"], [1, "#e4f1f2"]])) +
    rect(x + w / 2 - 3, y + 62, 6, 70, "#e6dcbf") +
    hills(640, y + 128, { seed: 9 }) +
    rect(x, y + 132, w, 20, "#e6dcbf") +
    rect(x, y + 290, w, 100, vgrad([[0, "#8a939e"], [1, "#6b7480"]])) +
    seat(x + 150, y + 300, 1.25) +
    rect(x + 118, y + 236, 64, 10, "#355f78") +
    seat(x + 26, y + 336, 1.45) +
    person(gx, gy, 132, girl2) +
    tr(hx + 6, hy + 8, pack(1.35))
  );
};

const p3 = (x, y, w, h) =>
  rect(x, y, w, h, "#e9d2b6") +
  building(x + 30, y + 296, 136, 260, { color: P.brick, windows: [2, 2], door: true, trim: P.ivory }) +
  ground(640, y + 296, 100, "pavement") +
  person(x + 52, y + 356, 128, { ...GIRL, pose: "point", facing: 1 }) +
  tr(x + 98, y + 270, pack(1.35)) +
  person(x + 148, y + 354, 130, { ...BOY, pose: "point", facing: -1 });

export default {
  file: "35-writing-lost-backpack.svg",
  w: 640,
  h: 400,
  title:
    "Three panels: 1) a boy walks away from a school bus and leaves his green backpack on the seat, 2) a girl on the bus finds the green backpack, 3) the girl gives the backpack back to the boy at school and they both smile.",
  draw: () => panels(640, 400, 3, (i, x, y, w, h) => [p1, p2, p3][i](x, y, w, h)),
};
