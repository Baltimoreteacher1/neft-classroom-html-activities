import { P, SKIN, HAIR, tr, person } from "../kit.mjs";
import { room, wallClock, whiteboard, shelf, schoolDesk, chairBack, seatedBack, lightShaft } from "../lib/e.mjs";

// A lesson in progress, seen from the back of the room: the teacher stands next to the board and points at it;
// students sit at their desks facing the front; books stand on a shelf; a round clock hangs on the wall.
const seat = (x, y, s, st, chair) => tr(x, y, schoolDesk(-60, -18, 120) + seatedBack(0, -26, 168, st) + chairBack(0, 12, { color: chair }), s);

export default {
  file: "68-classroom-lesson.svg",
  w: 640,
  h: 400,
  title: "A teacher points at the board. Students sit at desks. Books are on a shelf and a clock hangs on the wall.",
  draw: () =>
    room(640, 400, 258, { wall: "#efe3cc" }) +
    lightShaft([[640, 30], [590, 30], [470, 258], [640, 258]], 0.14) +
    whiteboard(196, 54, 266, 140) +
    wallClock(560, 52, 22, { hr: 10, min: 40 }) +
    shelf(500, 258, 120, 150, { seed: 33, color: "#9a6a44", shelves: 3, top: false }) +
    person(128, 262, 168, { pose: "point", age: "adult", skin: SKIN[3], hair: HAIR[0], hairStyle: "curly", top: P.coral, bottom: "#2f4858", glasses: true, facing: 1, mouth: "open" }) +
    // back row (farther, smaller)
    seat(232, 306, 0.82, { skin: SKIN[0], hair: HAIR[3], hairStyle: "long", top: P.teal }, P.gold) +
    seat(420, 306, 0.82, { skin: SKIN[4], hair: HAIR[0], hairStyle: "puffs", top: P.gold }, P.teal) +
    // front row
    seat(112, 372, 1.08, { skin: SKIN[2], hair: HAIR[1], hairStyle: "short", top: P.blue }, P.coral) +
    seat(326, 372, 1.08, { skin: SKIN[3], hair: "#5b6b8c", hairStyle: "hijab", top: P.purple }, P.gold) +
    seat(540, 372, 1.08, { skin: SKIN[1], hair: HAIR[0], hairStyle: "curly", top: P.green }, P.teal),
};
