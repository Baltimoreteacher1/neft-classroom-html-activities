import { P, wallWindow, rect, rrect, path, line, stroke, ellipse, circle, sky, cloud, tree, ground, panels, contact, shade, light, vgrad, bird, g } from "../kit.mjs";
import { pinecone, butterJar, seedPlate } from "../lib/c.mjs";

const tableBg = (x, y, w, h) =>
  rect(x, y, w, h, vgrad([[0, "#f6ead6"], [1, "#efdcc0"]])) +
  rect(x, y + 218, w, h, vgrad([[0, "#c99b6c"], [1, "#a97b4f"]])) +
  rect(x, y + 218, w, 6, light("#c99b6c", 0.2)) +
  wallWindow(x + 44, y + 66, 108, 92, { view: "day" });

// A child's hand and forearm reaching in from the frame edge.
const arm = (x0, y0, x1, y1, skin = "#c98e62", sleeve = P.teal) =>
  stroke(`M${x0} ${y0} L${x1} ${y1}`, skin, 15) + stroke(`M${x0} ${y0} L${x0 + (x1 - x0) * 0.4} ${y0 + (y1 - y0) * 0.4}`, sleeve, 19) + circle(x1, y1, 11, skin) + ellipse(x1 + 6, y1 - 6, 6, 4, shade(skin, 0.15));

const p1 = (x, y, w, h) =>
  tableBg(x, y, w, h) +
  butterJar(x + 46, y + 290, 1.2) +
  ellipse(x + 46, y + 238, 20, 4, "#c99a5c") +
  contact(x + 120, y + 330, 30, 6, 0.22) +
  pinecone(x + 120, y + 296, 1.45, { coat: "butter", rot: -12 }) +
  // spreader with butter on the blade
  `<g transform="translate(${x + 124} ${y + 262}) rotate(-28)">${rrect(-6, -4, 66, 9, 4, "#c9ced4")}${rrect(50, -5, 40, 11, 5, P.coral)}${ellipse(4, 0, 12, 5, "#d9a35e")}</g>` +
  arm(x + w + 14, y + 190, x + 186, y + 228, "#c98e62");

const p2 = (x, y, w, h) =>
  tableBg(x, y, w, h) +
  seedPlate(x + w / 2, y + 312, 170) +
  pinecone(x + w / 2, y + 286, 1.45, { coat: "seed", rot: 70 }) +
  stroke(`M${x + 44} ${y + 252} q20 -22 46 -10 M${x + 150} ${y + 250} q-18 -20 -42 -12`, P.navy, 3, 'opacity=".55"') +
  path(`M${x + 90} ${y + 242} l-9 -6 l1 10Z M${x + 108} ${y + 238} l9 -4 l-3 9Z`, P.navy, 'opacity=".55"') +
  rrect(x + 22, y + 330, 40, 26, 4, "#e9dfc8") +
  ellipse(x + 42, y + 330, 20, 5, "#c79a5a");

const p3 = (x, y, w, h) =>
  sky(640, 400) +
  ground(640, y + 330, 80, "grass", { seed: 2 }) +
  tree(x + 30, y + 400, 2.6, { seed: 8 }) +
  path(`M${x - 10} ${y + 104} C${x + 60} ${y + 92} ${x + 130} ${y + 100} ${x + w + 10} ${y + 88} L${x + w + 10} ${y + 104} C${x + 130} ${y + 116} ${x + 60} ${y + 110} ${x - 10} ${y + 122}Z`, P.bark) +
  path(`M${x - 10} ${y + 114} C${x + 60} ${y + 104} ${x + 130} ${y + 110} ${x + w + 10} ${y + 98} L${x + w + 10} ${y + 104} C${x + 130} ${y + 116} ${x + 60} ${y + 110} ${x - 10} ${y + 122}Z`, P.barkDark, 'opacity=".6"') +
  line(x + 104, y + 108, x + 104, y + 176, "#f2efe6", 2.4) +
  pinecone(x + 104, y + 208, 1.4, { coat: "seed" }) +
  path(`M${x + 120} ${y + 219} h46`, "none", `stroke="${P.barkDark}" stroke-width="3"`) +
  bird(x + 150, y + 196, 2.1, { color: P.red, facing: -1 });

export default {
  file: "35-writing-bird-feeder.svg",
  w: 640,
  h: 400,
  title:
    "Three steps to make a bird feeder: 1) spread sunflower butter on a pinecone, 2) roll the pinecone in birdseed on a plate, 3) hang the pinecone on a tree branch where a bird eats.",
  draw: () => panels(640, 400, 3, (i, x, y, w, h) => [p1, p2, p3][i](x, y, w, h)),
};
