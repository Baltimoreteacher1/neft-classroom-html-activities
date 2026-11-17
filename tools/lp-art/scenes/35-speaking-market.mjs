import { P, SKIN, HAIR, sky, building, ground, tree, person, tuft, rect, rrect, circle, ellipse, path, g, haze, tag, shade } from "../../../access-practice-lab/src/art/kit.js";
import { BP, stallBack, stallFront, loaf, corn, carrot, banana } from "../lib/b.mjs";

const GY = 262; // stall ground line
const POST = 192;
const W = 168;
const X = [24, 236, 448];

const apples = (x, y) => {
  let s = "";
  const rows = [[0, 7], [1, 6], [2, 5]];
  for (const [r, n] of rows) for (let i = 0; i < n; i++) s += circle(x + i * 11 + r * 5.5, y - r * 8, 6, i % 3 ? P.red : "#b8362b") + circle(x + i * 11 + r * 5.5 - 2, y - r * 8 - 2, 1.8, "#ffffff", 'opacity=".5"');
  return s;
};
const goods = [
  (x, y) => apples(x + 14, y) + banana(x + 120, y - 2, 1.2) + banana(x + 134, y - 8, 1.1) + banana(x + 124, y - 14, 1),
  (x, y) => [0, 1, 2, 3, 4].map((i) => corn(x + 22 + i * 13, y - 10, 0.9, -10 + i * 5)).join("") + [0, 1, 2, 3].map((i) => carrot(x + 106 + i * 14, y - 10, 1, 60 + i * 8)).join(""),
  (x, y) => loaf(x + 30, y - 4, 1.1) + loaf(x + 68, y - 6, 1.1) + loaf(x + 106, y - 4, 1.1) + loaf(x + 142, y - 6, 1.05) + loaf(x + 50, y - 16, 1) + loaf(x + 90, y - 18, 1) + loaf(x + 126, y - 16, 1),
];
const SIGNS = ["Apples 50¢", "Corn 25¢", "Bread $2"];
const AWN = [P.red, P.teal, P.orange];
const SELLERS = [
  { skin: SKIN[2], hair: HAIR[0], hairStyle: "short", top: P.green, apron: "#f4efe6", age: "adult" },
  { skin: SKIN[4], hair: HAIR[0], hairStyle: "curly", top: P.orange, apron: "#f4efe6", age: "adult" },
  { skin: SKIN[1], hair: HAIR[6], hairStyle: "cap", top: P.coral, apron: "#f4efe6", age: "adult" },
];

const stall = (i) => {
  const x = X[i];
  return (
    stallBack(x, GY, W, AWN[i], { post: POST }) +
    rect(x + W / 2 - 1, GY - POST - 30, 2, 12, P.woodDark) +
    person(x + W / 2, GY - 18, 140, { ...SELLERS[i], bottom: P.navy, facing: i === 2 ? -1 : 1 }) +
    stallFront(x, GY, W, goods[i](x, GY - 56)) +
    tag(x + W / 2, GY - POST - 38, SIGNS[i], { size: 17 })
  );
};

export default {
  file: "35-speaking-market.svg",
  w: 640,
  h: 400,
  title:
    "An outdoor community market with three stands. The fruit stand sells apples for 50¢ each and bananas. The vegetable stand sells corn for 25¢ each and carrots. The bread stand sells loaves of bread for $2 each. A seller stands behind each stand. A mother and her son buy apples, and a man carries a shopping bag.",
  draw: () =>
    sky(640, 220) +
    building(-10, 200, 150, 110, { color: haze(P.brick, 0.55), windows: [3, 2], door: false }) +
    building(150, 200, 130, 90, { color: haze("#c9a46a", 0.55), windows: [3, 2], door: false }) +
    building(290, 200, 170, 120, { color: haze(P.teal, 0.55), windows: [4, 2], door: false }) +
    building(470, 200, 180, 100, { color: haze("#b07a62", 0.55), windows: [4, 2], door: false }) +
    ground(640, 196, 204, "pavement") +
    stall(0) + stall(1) + stall(2) +
    // mother and son buying apples
    person(150, 392, 160, { pose: "hold", age: "adult", facing: -1, skin: SKIN[3], hair: HAIR[0], hairStyle: "hijab", top: P.purple, bottom: P.navy, skirt: true, item: BP.apple() }) +
    person(96, 396, 112, { pose: "point", facing: 1, skin: SKIN[3], hair: HAIR[0], hairStyle: "short", top: P.gold, bottom: "#3e4a5c", sleeve: "short" }) +
    // man with a shopping bag
    person(520, 394, 166, { pose: "walk", age: "adult", facing: -1, skin: SKIN[1], hair: HAIR[2], hairStyle: "short", top: P.blue, bottom: "#3e4a5c", beard: HAIR[2], item: `<g transform="translate(0 -2)">${BP.bag(P.gold)}</g>` }) +
    tuft(18, 398) + tuft(626, 394),
};
