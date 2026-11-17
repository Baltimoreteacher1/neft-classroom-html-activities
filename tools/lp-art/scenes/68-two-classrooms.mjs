import { P, panels, tr, board, wallWindow, desk, chair, stroke, rect, rrect, circle, path, clock } from "../kit.mjs";
import { room, computer, easel, palette, brushCup, paintJar, lightPatch } from "../lib/f.mjs";

// Two classrooms, numbered 1 and 2. Both have desks and a board at the front.
// 1: computers on the desks (and a window). 2: paint and art supplies (and a smart board).
const floorY = 236;
const deskY = 336;

/** A pair of desks with chairs tucked behind; `top(x)` draws what sits on each desk top. */
const desks = (top) =>
  chair(84, deskY - 6, { color: P.teal, facing: -1 }) +
  chair(222, deskY - 6, { color: P.teal, facing: -1 }) +
  desk(18, deskY, 118) +
  desk(158, deskY, 118) +
  top(77) +
  top(217);

const room1 = (w, h) =>
  room(w, h, floorY) +
  board(30, 52, 172, 104, {
    marks: stroke("M50 78h70M50 96h104M50 114h86", P.blue, 5) + stroke("M50 132h52", P.teal, 5),
  }) +
  wallWindow(226, 58, 50, 96, { view: "day" }) +
  lightPatch([[226, 166], [276, 166], [299, 236], [240, 236]], 0.12) +
  desks((x) => computer(x, deskY - 46, 0.92) + tr(x + 34, deskY - 47, rrect(-6, -4, 12, 5, 2.5, "#5d6772"), 1));

/** Smart board: dark bezel, a lit screen showing a painting. */
const smartBoard = (x, y, w, h) =>
  rrect(x - 7, y - 7, w + 14, h + 14, 7, "#2c3a4a") +
  rect(x, y, w, h, "#e9f1f4") +
  circle(x + w * 0.24, y + h * 0.34, 12, P.gold) +
  path(`M${x} ${y + h} L${x + w * 0.36} ${y + h * 0.42} L${x + w * 0.56} ${y + h * 0.72} L${x + w * 0.74} ${y + h * 0.5} L${x + w} ${y + h}Z`, P.tealLight) +
  rect(x + w * 0.45, y + h + 9, w * 0.1, 4, "#5d6772") +
  circle(x + w - 8, y + h + 3.5, 1.6, P.tealLight);

const room2 = (w, h) =>
  room(w, h, floorY, { wall: "#f3e2d4" }) +
  smartBoard(34, 54, 162, 94) +
  // shelf of paint and supplies
  rect(222, 112, 66, 6, P.woodDark) +
  paintJar(236, 112, P.red, 0.9) +
  paintJar(256, 112, P.blue, 0.9) +
  paintJar(276, 112, P.gold, 0.9) +
  rect(222, 168, 66, 6, P.woodDark) +
  paintJar(236, 168, P.purple, 0.9) +
  brushCup(256, 168, 0.7) +
  paintJar(278, 168, P.green, 0.9) +
  easel(147, 296, 0.8, { art: "hills" }) +
  desks((x) => (x < 100 ? palette(x - 10, deskY - 47, 1.25) + brushCup(x + 38, deskY - 46, 0.95) : paintJar(x - 30, deskY - 46, P.red) + paintJar(x - 10, deskY - 46, P.blue) + paintJar(x + 10, deskY - 46, P.gold) + brushCup(x + 38, deskY - 46, 0.95)));

export default {
  file: "68-two-classrooms.svg",
  w: 640,
  h: 400,
  title: "Two classrooms side by side. Both have desks and a board. The first has computers. The second has paint and art supplies.",
  draw: () =>
    panels(640, 400, 2, (i, x, y, w, h) => tr(x, y, i === 0 ? room1(w, h) : room2(w, h)), { bg: "#e6edf1" }) +
    "",
};
