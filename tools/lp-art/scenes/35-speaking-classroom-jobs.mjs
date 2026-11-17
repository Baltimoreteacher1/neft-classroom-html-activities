import {
  board,
  circle,
  clock,
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
  wallWindow,
} from "../../../access-practice-lab/src/art/kit.js";
import { BP, fishTank, frontDesk, lightPool, pottedPlant, room, schoolDesk } from "../lib/b.mjs";

const flakes = stroke("M0 0 l-1 6M3 1 l0 7M-3 2 l-2 6", P.coral, 1.6, 'stroke-dasharray="1.5 3"');
const shaker = `<g transform="rotate(130)">${BP.fishFood()}</g><g transform="translate(6 6)">${flakes}</g>`;

export default {
  file: "35-speaking-classroom-jobs.svg",
  w: 640,
  h: 400,
  title:
    "A classroom where students do jobs. A boy feeds the fish in a fish tank, a girl waters a plant by the window, and another boy hands out papers at two desks. The teacher sits at her desk.",
  draw: () =>
    room(640, 400, 290) +
    wallWindow(34, 56, 112, 120, { view: "day", curtain: P.gold }) +
    board(212, 40, 210, 110, { marks: stroke("M232 70h90M232 92h140M232 114h70", "#9fb0c2", 4) }) +
    clock(470, 64, 18) +
    lightPool(130, 320, 110, 16, 0.22) +
    // plant by the window on a low cabinet, girl watering it
    pottedPlant(104, 306, 1.45, { pot: P.coral }) +
    person(186, 330, 116, {
      pose: "reach",
      facing: -1,
      skin: SKIN[2],
      hair: HAIR[0],
      hairStyle: "puffs",
      top: P.purple,
      bottom: "#3e4a5c",
      sleeve: "short",
      item: `<g transform="rotate(14)">${BP.wateringCan(P.blue, true)}</g>`,
    }) +
    // teacher at her desk (back, centre)
    person(405, 270, 150, {
      pose: "sit",
      age: "adult",
      facing: 1,
      skin: SKIN[4],
      hair: HAIR[0],
      hairStyle: "bun",
      top: P.coral,
      bottom: P.navy,
      glasses: true,
    }) +
    frontDesk(340, 312, 130, 54, { color: P.wood }) +
    `<g transform="translate(362 252)">${BP.book(P.teal)}</g>` +
    rect(430, 250, 22, 6, "#ffffff") +
    rect(432, 245, 20, 6, "#f1f3f5") +
    // fish tank (right) and the boy feeding the fish
    fishTank(504, 318, 120, 64, { cabH: 32, fish: 3, seed: 6 }) +
    person(482, 338, 132, {
      pose: "reach",
      facing: 1,
      skin: SKIN[0],
      hair: HAIR[3],
      hairStyle: "short",
      top: P.green,
      bottom: P.navy,
      sleeve: "short",
      item: shaker,
    }) +
    // two desks with papers; the paper boy behind them
    person(292, 364, 128, {
      pose: "hold",
      facing: 1,
      skin: SKIN[5],
      hair: HAIR[0],
      hairStyle: "short",
      top: P.blue,
      bottom: "#3e4a5c",
      sleeve: "short",
      item: BP.papers(),
    }) +
    schoolDesk(160, 396, 100) +
    schoolDesk(330, 396, 100) +
    rect(196, 341, 28, 4, "#ffffff", 'transform="rotate(-4 210 343)"') +
    rect(366, 341, 28, 4, "#ffffff", 'transform="rotate(3 380 343)"'),
};
