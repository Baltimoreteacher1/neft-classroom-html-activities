import {
  clipRect,
  contact,
  g,
  ground,
  light,
  P,
  rect,
  rrect,
  shade,
  tag,
  wallWindow,
} from "../../../access-practice-lab/src/art/kit.js";
import { cage, fishTank, goldfish, hamster, wheel } from "../lib/c.mjs";

// Two side-by-side choice cards, each a little classroom shelf scene.
const card = (x, w, wall, body) =>
  rrect(x + 2, 22, w, 356, 16, "#1c2f4a", 'opacity=".12"') +
  clipRect(x, 18, w, 356, 16, rect(x, 18, w, 356, wall) + ground(640, 300, 80, "floor") + body) +
  rrect(x, 18, w, 356, 16, "none", 'stroke="#1c2f4a" stroke-opacity=".18" stroke-width="1.5"');

const shelf = (x, w, y) =>
  contact(x + w / 2, y + 60, w * 0.5, 6, 0.18) +
  rect(x + 10, y + 10, 10, 50, P.woodDark) +
  rect(x + w - 20, y + 10, 10, 50, P.woodDark) +
  rrect(x, y, w, 12, 3, P.wood) +
  rect(x, y + 9, w, 4, shade(P.wood, 0.25));

export default {
  file: "35-writing-class-pet.svg",
  w: 640,
  h: 400,
  title:
    "Two choices for a class pet: a goldfish in a fish tank and a hamster in a cage with a wheel.",
  draw: () =>
    rect(0, 0, 640, 400, P.ivory) +
    card(
      16,
      296,
      "#dcecf0",
      wallWindow(64, 52, 80, 62, { view: "day" }) +
        shelf(36, 256, 288) +
        fishTank(56, 286, 216, 150) +
        goldfish(150, 200, 1.55),
    ) +
    card(
      328,
      296,
      "#f6e3d3",
      shelf(348, 256, 288) +
        cage(368, 286, 216, 160) +
        wheel(536, 274, 34) +
        hamster(440, 274, 1.45) +
        rect(392, 262, 26, 10, "#c9d6df", 'rx="3"') +
        rect(472, 266, 30, 8, "#e9c38a", 'rx="2"'),
    ),
};
