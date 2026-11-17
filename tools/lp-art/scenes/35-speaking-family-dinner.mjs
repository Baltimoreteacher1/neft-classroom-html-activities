import {
  circle,
  contact,
  ellipse,
  g,
  HAIR,
  light,
  P,
  path,
  person,
  rect,
  rrect,
  SKIN,
  shade,
  stroke,
  vgrad,
  wallWindow,
} from "../../../access-practice-lab/src/art/kit.js";
import { BP, hands, pendantLamp, room } from "../lib/b.mjs";

const TOP = 318; // front edge of the table top
const BACK = 280; // back edge of the table top
const DAD = { x: 522, y: 374, h: 194, pose: "hold", facing: -1, age: "adult" };
const pour = `<g transform="rotate(40) translate(16 2) scale(-1 1)">${BP.pitcher("#d9eef5")}</g>`;
const dh = hands(DAD.x, DAD.y, DAD.h, DAD).front;
const spout = [dh[0] - 66, dh[1] + 12];
const chairBack = (x, c = P.woodDark) =>
  rrect(x - 30, 186, 60, 100, 12, c) + rrect(x - 23, 195, 46, 80, 9, shade(c, 0.15));

const plateAt = (x, y, food = "") =>
  ellipse(x, y + 2, 26, 6, "#1c2f4a", 'opacity=".12"') +
  ellipse(x, y, 26, 7, "#ffffff") +
  ellipse(x, y, 18, 4.5, "#eef2f4") +
  food;
const chicken = (x, y) =>
  [
    [-10, -3, -20],
    [4, -4, 15],
    [-2, -8, 0],
    [12, -2, 30],
  ]
    .map(
      ([dx, dy, a]) =>
        `<g transform="rotate(${a} ${x + dx} ${y + dy})">${ellipse(x + dx, y + dy, 9, 5.5, "#c97b3a")}${ellipse(x + dx - 2, y + dy - 2, 5, 2.4, "#e3a05c", 'opacity=".8"')}${rect(x + dx + 7, y + dy - 1.2, 6, 2.4, "#f3ead8")}</g>`,
    )
    .join("");
const salad = (x, y) =>
  path(
    `M${x - 24} ${y - 6} Q${x - 22} ${y + 10} ${x} ${y + 11} Q${x + 22} ${y + 10} ${x + 24} ${y - 6}Z`,
    "#e8eef0",
  ) +
  [
    [-14, -10, P.leaf],
    [-4, -14, P.leafLight],
    [8, -12, P.leaf],
    [16, -8, P.leafLight],
    [-8, -6, P.red],
    [6, -6, P.red],
    [0, -10, P.orange],
  ]
    .map(([dx, dy, c]) => circle(x + dx, y + dy, c === P.red || c === P.orange ? 3.6 : 6, c))
    .join("");
const bread = (x, y) =>
  path(
    `M${x - 26} ${y - 8} L${x + 26} ${y - 8} L${x + 20} ${y + 8} L${x - 20} ${y + 8}Z`,
    "#b98457",
  ) +
  stroke(`M${x - 22} ${y - 2}h44M${x - 20} ${y + 3}h40`, "#9a6a40", 1.4) +
  ellipse(x - 10, y - 12, 12, 7, "#d9a25a") +
  ellipse(x + 9, y - 13, 12, 7, "#c8873f") +
  ellipse(x, y - 17, 11, 6, "#e0ae66");
export default {
  file: "35-speaking-family-dinner.svg",
  w: 640,
  h: 400,
  title:
    "A family eats dinner together at a table. A grandmother passes a bowl of rice, a father pours water, and two children smile. There is a plate of chicken, a salad, and a basket of bread on the table. A lamp hangs over the table.",
  draw: () =>
    room(640, 400, 330, { wall: "#efd9c2" }) +
    wallWindow(54, 70, 120, 104, { view: "dusk", curtain: P.teal }) +
    rect(468, 64, 104, 76, P.woodDark) +
    rect(475, 71, 90, 62, "#f3d9a0") +
    path("M479 129 L506 98 L524 116 L536 104 L561 129Z", P.teal) +
    circle(546, 86, 8, P.coralLight) +
    pendantLamp(320, 96) +
    chairBack(262) +
    chairBack(378) +
    person(146, 374, 186, {
      pose: "hold",
      age: "elder",
      facing: 1,
      skin: SKIN[0],
      hair: HAIR[5],
      hairStyle: "bun",
      top: P.purple,
      bottom: P.navy,
      glasses: true,
      item: BP.bowlRice(),
    }) +
    person(262, 300, 172, {
      pose: "sit",
      skin: SKIN[2],
      hair: HAIR[0],
      hairStyle: "short",
      top: P.gold,
      bottom: P.navy,
      facing: -1,
    }) +
    person(378, 300, 168, {
      pose: "sit",
      skin: SKIN[2],
      hair: HAIR[1],
      hairStyle: "long",
      top: P.pink,
      bottom: P.navy,
      facing: 1,
    }) +
    person(DAD.x, DAD.y, DAD.h, {
      ...DAD,
      skin: SKIN[3],
      hair: HAIR[0],
      hairStyle: "short",
      top: P.teal,
      bottom: P.navy,
      beard: HAIR[0],
      item: pour,
    }) +
    // table top
    path(`M58 ${TOP} L92 ${BACK} L548 ${BACK} L582 ${TOP}Z`, "#fbf6ec") +
    // tablecloth front
    path(
      `M54 ${TOP} L586 ${TOP} L590 404 L50 404Z`,
      vgrad([
        [0, "#f1e7d6"],
        [1, "#e0d1b8"],
      ]),
    ) +
    rect(54, TOP, 532, 5, "#e2d4bc") +
    stroke(
      "M150 324 Q148 360 146 404M262 324V404M378 324V404M490 324 Q492 360 494 404",
      "#d6c4a6",
      1.4,
      'opacity=".8"',
    ) +
    // food and dishes
    salad(200, 290) +
    plateAt(320, 288, chicken(320, 286)) +
    bread(496, 296) +
    plateAt(250, 306) +
    plateAt(336, 306) +
    plateAt(150, 308) +
    plateAt(452, 308) +
    stroke(
      `M${spout[0]} ${spout[1]} Q${spout[0] - 3} ${spout[1] + 30} ${spout[0] - 2} 298`,
      P.waterLight,
      3,
      'opacity=".9"',
    ) +
    `<g transform="translate(${spout[0] - 2} 306)">${BP.glass()}</g>` +
    `<g transform="translate(206 310)">${BP.glass()}</g>`,
};
