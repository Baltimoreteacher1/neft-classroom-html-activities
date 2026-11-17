import { P, SKIN, HAIR, rect, rrect, ellipse, line, stroke, circle, g, vgrad, shade, light, ground, wallWindow, clock, person, tr } from "../kit.mjs";
import { bin, tray, servingCounter, milkCarton, apple } from "../lib/d.mjs";

// School lunchroom. At the long table, left to right: a girl holding up milk, the boy next to her holding up
// an apple, two friends talking to each other. Behind the counter a lunch worker serves food. A gray trash
// can and a blue recycling bin stand by the wall on the left.
const TOP = 296;
const KH = 140;
const KY = TOP + 44;
const ladle = tr(0, 0, line(0, 0, 16, 12, "#9aa3ad", 2.4) + ellipse(18, 15, 6, 3.4, "#aeb7c1"));

const kids = [
  { x: 172, o: { pose: "wave", facing: 1, skin: SKIN[1], hair: HAIR[0], hairStyle: "puffs", top: P.coral, item: milkCarton(1.1), mouth: "open" } },
  { x: 246, o: { pose: "reach", facing: 1, skin: SKIN[0], hair: HAIR[2], hairStyle: "short", top: P.blue, item: apple(1.1) } },
  { x: 326, o: { pose: "stand", facing: 1, skin: SKIN[4], hair: HAIR[0], hairStyle: "short", top: P.teal, mouth: "open" } },
  { x: 398, o: { pose: "stand", facing: -1, skin: SKIN[2], hair: "#2f6b7a", hairStyle: "hijab", top: P.purple, mouth: "smile" } },
];

const longTable = () =>
  rect(112, TOP + 8, 342, 40, vgrad([[0, "#5b4a3c"], [1, "#7a6450"]])) +
  rrect(110, TOP - 6, 346, 14, 4, light(P.wood, 0.1)) +
  rect(110, TOP + 6, 346, 4, shade(P.wood, 0.25)) +
  ellipse(283, 394, 190, 8, "#1c2f4a", 'opacity=".16"') +
  rrect(102, TOP + 44, 362, 12, 4, "#3f7fa6") +
  rect(102, TOP + 54, 362, 4, shade("#3f7fa6", 0.3)) +
  rect(126, TOP + 58, 8, 32, "#5d6772") +
  rect(432, TOP + 58, 8, 32, "#5d6772") +
  "";

export default {
  file: "35t-lunchroom.svg",
  w: 640,
  h: 400,
  title: "A school lunchroom. Four students sit at a long table with lunch trays. One girl holds up a carton of milk, a boy holds up an apple, and two friends talk to each other. A lunch worker serves food behind a counter. A gray trash can and a blue recycling bin stand by the wall.",
  draw: () =>
    rect(0, 0, 640, 300, vgrad([[0, "#f4e7cf"], [1, "#ecdcc2"]])) +
    rect(0, 222, 640, 8, "#d8c4a2") +
    wallWindow(150, 46, 130, 90, { frame: P.ivory }) +
    wallWindow(320, 46, 130, 90, { frame: P.ivory }) +
    clock(560, 60, 18) +
    stroke(`M0 18 ${[20, 60, 100, 140, 180, 220, 260, 300, 340, 380, 420, 460, 500].map((px) => `L${px} ${(18 + 18 * Math.sin(((px % 240) / 240) * Math.PI) - 1).toFixed(1)}`).join(" ")}`, "#9aa3ad", 1.4) +
    [20, 60, 100, 140, 180, 220, 260, 300, 340, 380, 420, 460].map((px, k) => {
      const py = 18 + 18 * Math.sin(((px % 240) / 240) * Math.PI);
      return `<polygon points="${px - 10},${(py - 1).toFixed(1)} ${px + 10},${(py - 1).toFixed(1)} ${px},${(py + 18).toFixed(1)}" fill="${[P.coral, P.gold, P.teal, P.blue][k % 4]}"/>`;
    }).join("") +
    ground(640, 300, 100, "tile", { seed: 2 }) +
    rect(0, 296, 640, 6, "#cbbfa8") +
    bin(14, 330, 50, 70, { kind: "trash" }) +
    bin(72, 330, 50, 70, { kind: "recycle" }) +
    kids.map((k) => person(k.x, KY, KH, { bottom: P.navy, sleeve: "short", ...k.o })).join("") +
    longTable() +
    tray(176, TOP - 6, 52, { seed: 1 }) +
    tray(250, TOP - 6, 52, { seed: 2 }) +
    tray(328, TOP - 6, 52, { seed: 3 }) +
    tray(402, TOP - 6, 52, { seed: 4 }) +
    stroke("M350 236 q5 -6 10 0M352 226 q7 -8 14 0", P.ink, 1.6, 'opacity=".5"') +
    stroke("M376 236 q-5 -6 -10 0M374 226 q-7 -8 -14 0", P.ink, 1.6, 'opacity=".5"') +
    person(586, 352, 156, { pose: "hold", facing: -1, age: "adult", skin: SKIN[3], hair: HAIR[0], hairStyle: "bun", top: "#ffffff", bottom: "#4e5d6c", apron: "#e9eef2", item: ladle, mouth: "smile" }) +
        servingCounter(486, 382, 150, 80),
};
