import { P, SKIN, HAIR, rect, rrect, circle, ground, wallWindow, board, table, person, contact, shade, vgrad, tuft } from "../../../access-practice-lab/src/art/kit.js";
import { bin, bottle, sodaCan, cardboardBox, newspaper, handAt } from "../lib/c.mjs";

const FLOOR = 300;
const boy = { pose: "reach", facing: -1, skin: SKIN[3], hair: HAIR[0], hairStyle: "short", top: P.coral, bottom: P.navy, sleeve: "short" };
const BX = 476;
const BY = 350;
const BH = 150;
const [hx, hy] = handAt(BX, BY, BH, boy);

export default {
  file: "35-speaking-recycling.svg",
  w: 640,
  h: 400,
  title:
    "Two students sort recycling at school. There are three bins labeled Paper, Plastic, and Cans. A boy puts a plastic bottle in the Plastic bin, and a girl holds a newspaper. A table next to them has a cardboard box, a can, and another bottle waiting to be sorted.",
  draw: () =>
    rect(0, 0, 640, FLOOR, vgrad([[0, "#eef0e4"], [1, "#e2e6d4"]])) +
    rect(0, FLOOR - 92, 640, 92, "#cfd8c4") +
    rect(0, FLOOR - 96, 640, 6, "#b9c4ad") +
    wallWindow(60, 40, 120, 92, { view: "day" }) +
    rrect(250, 44, 150, 100, 4, "#b98a5a") +
    rect(256, 50, 138, 88, "#d9b48a") +
    rect(268, 60, 34, 42, "#ffffff", 'transform="rotate(-4 285 81)"') +
    rect(316, 58, 30, 30, P.goldLight) +
    rect(354, 66, 30, 40, "#cfe3f1", 'transform="rotate(5 369 86)"') +
    rect(300, 100, 40, 30, "#f3c9c0") +
    circle(285, 62, 3, P.red) + circle(331, 60, 3, P.blue) + circle(369, 68, 3, P.green) + circle(320, 102, 3, P.red) +
    board(470, 34, 130, 84, { kind: "white" }) +
    ground(640, FLOOR, 100, "tile") +
    // table with items to sort
    table(20, 336, 170, 70) +
    cardboardBox(34, 258, 62, 46) +
    sodaCan(120, 258, 1.4) +
    bottle(162, 258, 1.25) +
    // girl with newspaper
    person(232, 370, 146, { pose: "hold", facing: 1, skin: SKIN[1], hair: HAIR[1], hairStyle: "bun", top: P.teal, bottom: "#3e4a5c", skirt: false, item: newspaper(), mouth: "smile" }) +
    // boy behind the bins drops a bottle into the Plastic bin
    person(BX, BY, BH, boy) +
    `<g transform="translate(${(hx + 2).toFixed(1)} ${(hy + 6).toFixed(1)}) rotate(168)">${bottle(0, 0, 1.05, { color: "#9fd3e6" })}</g>` +
    bin(300, 376, 80, 104, P.blue, "Paper") +
    bin(388, 376, 80, 104, P.yellow, "Plastic") +
    bin(476, 376, 80, 104, P.green, "Cans"),
};
