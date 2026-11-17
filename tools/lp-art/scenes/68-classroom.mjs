import { P, g, tr, rect, rrect, circle, ellipse, path, poly, stroke, vgrad, shade, light } from "../../../access-practice-lab/src/art/kit.js";
import { room, wallClock, whiteboard, door, shelf, schoolDesk, chairBack, plantPot, lightShaft } from "../lib/e.mjs";

// An empty classroom seen from the back: rows of desks and chairs face the whiteboard at the front;
// a tall bookshelf full of books stands next to the whiteboard, beside the door.
export const desksRow = (y, s, xs, colors) =>
  xs.map((x, i) => tr(x, y, schoolDesk(-56, 0, 112) + chairBack(0, 12, { color: colors[i % colors.length] }), s)).join("");

export default {
  file: "68-classroom.svg",
  w: 640,
  h: 400,
  title: "A classroom with desks and chairs, a whiteboard, and a bookshelf full of books.",
  draw: () =>
    room(640, 400, 252, { wall: "#efe3cc" }) +
    // window light from the left
    lightShaft([[0, 40], [60, 40], [190, 252], [0, 252]], 0.16) +
    whiteboard(62, 58, 300, 150) +
    wallClock(408, 46, 18, { hr: 9, min: 5 }) +
    shelf(432, 252, 112, 196, { seed: 21, color: "#9a6a44", shelves: 4 }) +
    door(566, 252, 58, 176, { color: "#3f7fb8" }) +
    desksRow(298, 0.8, [130, 300, 470], [P.teal, P.coral, P.gold]) +
    desksRow(366, 1.08, [96, 320, 544], [P.gold, P.teal, P.coral]),
};
