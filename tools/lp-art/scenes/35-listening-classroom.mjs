import { P, sky, ground, rect, rrect, path, poly, circle, ellipse, line, stroke, g, wallWindow, bookshelf, board, clock, desk, chair, contact, vgrad, shade, light, PROPS, tr } from "../kit.mjs";
import { rug, door, cubbies, apple } from "../lib/a.mjs";

const FLOOR = 272;

function teacherDesk(x, y, w = 190) {
  const c = P.wood;
  let s = contact(x + w / 2, y, w * 0.55, 6, 0.2);
  s += rect(x + 6, y - 58, 58, 58, shade(c, 0.08)) + rect(x + 54, y - 58, 10, 58, shade(c, 0.22));
  s += rect(x + 12, y - 50, 46, 20, light(c, 0.1)) + rect(x + 12, y - 26, 46, 20, light(c, 0.1));
  s += rrect(x + 29, y - 42, 12, 3, 1.5, P.woodDark) + rrect(x + 29, y - 18, 12, 3, 1.5, P.woodDark);
  s += rect(x + w - 16, y - 58, 9, 58, shade(c, 0.25));
  s += rect(x + 64, y - 58, w - 80, 26, shade(c, 0.32), 'opacity=".55"');
  s += rrect(x - 4, y - 68, w + 8, 12, 3, c) + rect(x - 4, y - 68, w + 8, 4, light(c, 0.25));
  // things on the desk: papers, a mug of pencils, an apple
  const top = y - 68;
  s += rect(x + 22, top - 4, 40, 4, "#ffffff") + rect(x + 24, top - 7, 38, 3, "#eef1f4");
  s += line(x + 118, top - 6, x + 114, top - 26, P.yellow, 3) + line(x + 124, top - 6, x + 128, top - 24, P.coral, 3) + line(x + 121, top - 6, x + 121, top - 28, P.blue, 3);
  s += path(`M${x + 112} ${top - 18} H${x + 130} L${x + 128} ${top} H${x + 114}Z`, P.teal) + rect(x + 112, top - 18, 18, 3, light(P.teal, 0.3));
  s += apple(x + 160, top - 8, 8);
  return s;
}

export default {
  file: "35-listening-classroom.svg",
  w: 640,
  h: 400,
  title:
    "A classroom with a window and a bookshelf under it, a whiteboard, a teacher's desk, cubbies by the door, and a round reading rug on the floor.",
  draw: () =>
    sky(640, FLOOR, "indoor") +
    rect(0, 196, 640, FLOOR - 196, "#ead8bc", 'opacity=".55"') +
    rect(0, 194, 640, 4, "#d9c19c") +
    ground(640, FLOOR, 400 - FLOOR, "floor") +
    rect(0, FLOOR - 6, 640, 8, "#c9a77c") +
    // window light falling on the floor
    poly([[60, FLOOR + 2], [196, FLOOR + 2], [250, 400], [70, 400]], "#fff6dc", 'opacity=".28"') +
    wallWindow(52, 40, 132, 100, { view: "day", curtain: "#e9b65a" }) +
    bookshelf(46, FLOOR, 144, 96, { seed: 4 }) +
    tr(150, FLOOR - 96, path("M-9 0 H9 L7 -16 H-7Z", P.coral) + ellipse(-6, -24, 9, 6, P.leaf) + ellipse(6, -26, 9, 6, P.leafLight) + ellipse(0, -32, 7, 6, P.leaf)) +
    board(226, 38, 206, 110, {
      marks:
        stroke("M250 78 q14 -16 28 0 t28 0", P.teal, 3.5) +
        circle(372, 74, 15, "none", `stroke="${P.coral}" stroke-width="3.5"`) +
        stroke("M262 128 l14 -24 l14 24Z", P.navy, 3.5) +
        rect(340, 108, 36, 22, "none", `stroke="${P.gold}" stroke-width="3.5"`),
    }) +
    clock(470, 50, 17) +
    cubbies(452, FLOOR, 94, 128, { cols: 2, rows: 3, fill: ["coat", "coat", "bag", "coat", "bag", "bag"] }) +
    door(560, FLOOR, 66, 176) +
    teacherDesk(238, FLOOR + 30, 196) +
    rug(150, 346, 118, 36) +
    chair(452, 382, { color: P.teal, facing: -1 }) +
    desk(380, 388, 92) +
    tr(426, 342, PROPS.paper()) +
    chair(566, 382, { color: P.coral, facing: -1 }) +
    desk(494, 388, 92) +
    tr(536, 342, PROPS.pencil()),
};
