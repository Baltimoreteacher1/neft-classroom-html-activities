import { P, rgrad, rect, rrect, sky, sun, cloud, hills, ground, tree, fence, clipRect, contact, shade, light, vgrad, person, SKIN, HAIR } from "../kit.mjs";
import { dinoSkeleton, barn, cow } from "../lib/c.mjs";

const frame = (x, w, body) =>
  rrect(x + 2, 22, w, 356, 16, "#1c2f4a", 'opacity=".12"') + clipRect(x, 18, w, 356, 16, body) + rrect(x, 18, w, 356, 16, "none", 'stroke="#1c2f4a" stroke-opacity=".18" stroke-width="1.5"');

const column = (x, y0, y1) => rect(x, y0, 22, y1 - y0, "#efe6d4") + rect(x + 14, y0, 8, y1 - y0, "#ddd1b9") + rect(x - 5, y0, 32, 10, "#e3d8c2") + rect(x - 5, y1 - 10, 32, 10, "#e3d8c2");

const museum = (x, w) =>
  rect(x, 18, w, 356, vgrad([[0, "#2f5566"], [1, "#3c6a7c"]])) +
  rect(x, 18, w, 26, "#264755") +
  rect(x + 40, 60, w - 80, 240, rgrad([[0, "#fff6dc", 0.32], [1, "#fff6dc", 0]], { cx: 0.5, cy: 0.55, r: 0.55 })) +
  column(x + 22, 44, 300) +
  column(x + w - 44, 44, 300) +
  rect(x, 296, w, 80, vgrad([[0, "#cdb08a"], [1, "#b8966b"]])) +
  rect(x, 296, w, 4, "#a98a62") +
  dinoSkeleton(x + w / 2 - 6, 300, 1.12);

const farm = (x, w) =>
  sky(640, 400) +
  sun(x + w - 40, 60, 20) +
  cloud(x + 110, 64, 0.6) +
  hills(640, 236, { seed: 8 }) +
  ground(640, 230, 170, "grass", { seed: 9 }) +
  barn(x + 20, 262, 132, 100) +
  tree(x + 210, 252, 0.7, { kind: "fruit", seed: 3 }) +
  tree(x + 262, 262, 0.6, { kind: "fruit", seed: 5 }) +
  fence(x - 4, x + w + 10, 300, 30) +
  cow(x + 140, 352, 0.95, { facing: 1 });

export default {
  file: "35-writing-field-trip-choice.svg",
  w: 640,
  h: 400,
  title: "Two field trip choices: a museum with a dinosaur skeleton and a farm with a red barn, a cow, and apple trees.",
  draw: () => rect(0, 0, 640, 400, P.ivory) + frame(16, 296, museum(16, 296)) + frame(328, 296, farm(328, 296)),
};
