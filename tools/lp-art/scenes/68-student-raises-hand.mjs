import { P, SKIN, HAIR, person, board, wallWindow, clock, stroke, circle, rect, rrect, contact, tr, PROPS, tuft } from "../kit.mjs";
import { room, lightPatch, headAt, mirrorX } from "../lib/f.mjs";

// A teacher stands at the board; across the room a student at a desk raises a hand high.
const floorY = 292;
const st = { pose: "sit", age: "adult", facing: 1 };
const sX = 528;
const sH = 172;
const seatY = 318;
const s = sH / 100;

/** Classroom chair seen from the side, seat top at y. */
const chair = (x, y) =>
  tr(x, y, contact(0, 46, 26, 4, 0.2) + rect(-18, 4, 5, 42, "#4b5866") + rect(14, 4, 5, 42, "#4b5866") + rrect(-22, -2, 44, 8, 3, P.teal) + rrect(14, -50, 8, 50, 3, P.teal) + rect(14, -50, 3, 50, "#5cb3a8"), 1.32);

/** Student desk: top at y, legs to the floor. */
const sdesk = (x, y, w, floor) =>
  contact(x + w / 2, floor, w * 0.55, 5, 0.2) +
  rect(x + 8, y + 8, 6, floor - y - 8, "#5d6772") +
  rect(x + w - 14, y + 8, 6, floor - y - 8, "#5d6772") +
  rect(x + 6, y + 8, w - 12, 26, "#c9cfd4") +
  rrect(x, y, w, 10, 3, P.woodLight) +
  rect(x, y, w, 3, "#e8c9a0") +
  rect(x, y + 8, w, 2, "#a8825c");

/** The raised arm, drawn from the shoulder of the seated student. */
const raisedArm = () => {
  const H = headAt(sX, seatY, sH, st);
  const shX = sX - 10.2 * s;
  const shY = H.y + H.r * 2.2;
  const elX = shX - 4 * s;
  const elY = shY - 20 * s;
  const hX = shX - 2 * s;
  const hY = shY - 40 * s;
  return (
    stroke(`M${shX} ${shY}L${elX} ${elY}L${hX} ${hY}`, P.gold, 8 * s) +
    stroke(`M${elX + 1} ${elY}L${hX + 0.6} ${hY + 4}`, "#f3cd6f", 2.4, 'opacity=".7"') +
    // open palm with fingers up
    rrect(hX - 5.2 * s, hY - 9 * s, 10.4 * s, 12 * s, 4.5 * s, SKIN[1]) +
    rrect(hX + 3.6 * s, hY - 4 * s, 3.4 * s, 7 * s, 1.7 * s, SKIN[1], `transform="rotate(30 ${hX + 5 * s} ${hY})"`)
  );
};

export default {
  file: "68-student-raises-hand.svg",
  w: 640,
  h: 400,
  title: "A student at a desk raises a hand. A teacher stands at the board.",
  draw: () =>
    room(640, 400, floorY) +
    board(36, 62, 246, 150, {
      marks:
        stroke("M60 98 q14 -12 28 0 t28 0 t28 0", P.blue, 4) +
        stroke("M60 132 h120", P.blue, 4) +
        stroke("M60 160 h80", P.coral, 4) +
        stroke("M60 186 h104", "#9aa7b4", 4) +
        circle(232, 140, 26, "none", `stroke="${P.teal}" stroke-width="5"`) +
        stroke("M220 140 h24 M232 128 v24", P.teal, 4),
    }) +
    wallWindow(470, 58, 120, 104, { view: "day" }) +
    lightPatch([[470, 172], [590, 172], [640, 292], [520, 292]], 0.1) +
    clock(380, 82, 18) +
    person(306, 352, 166, {
      pose: "point",
      age: "adult",
      skin: SKIN[3],
      hair: HAIR[0],
      hairStyle: "bun",
      top: P.navy,
      bottom: "#3e4a5c",
      facing: -1,
      item: rrect(-2, -8, 4, 10, 1.5, P.teal),
    }) +
    chair(sX + 14, seatY) +
    mirrorX(sX, person(sX, seatY, sH, {
      ...st,
      skin: SKIN[1],
      hair: HAIR[2],
      hairStyle: "braid",
      top: P.gold,
      bottom: "#4a5a7a",
      mouth: "smile",
    })) +
    raisedArm() +
    sdesk(392, seatY - 20, 142, 388) +
    tr(446, seatY - 20, PROPS.book(P.coral), 1.6),
};
