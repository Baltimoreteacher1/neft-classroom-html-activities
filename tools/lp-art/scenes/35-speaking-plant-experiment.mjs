import { P, rect, rrect, path, poly, ground, wallWindow, sun, contact, shade, light, tag, vgrad, rgrad, circle, line } from "../kit.mjs";
import { pot, plant, calendar } from "../lib/c.mjs";

const SILL = 300;

export default {
  file: "35-speaking-plant-experiment.svg",
  w: 640,
  h: 400,
  title:
    "A science experiment with two bean plants. Plant A sits next to a sunny window and is tall with green leaves. Plant B sits inside a dark closet and is short with yellow, drooping leaves. A calendar on the wall has 14 days crossed out.",
  draw: () =>
    rect(0, 0, 640, 400, vgrad([[0, "#f6ead6"], [1, "#efdfc4"]])) +
    ground(640, 336, 64, "floor") +
    rect(0, 330, 640, 8, "#e3d2b4") +
    // sunny window, left
    wallWindow(46, 44, 150, 150, { view: "day", frame: P.ivory }) +
    sun(88, 82, 18) +
    // sunbeam onto plant A
    poly([[60, 200], [196, 200], [250, SILL], [96, SILL]], "#fff3c4", 'opacity=".45"') +
    // shelf under plant A
    rrect(36, SILL, 240, 12, 3, P.wood) +
    rect(36, SILL + 9, 240, 4, shade(P.wood, 0.25)) +
    rect(60, SILL + 12, 10, 24, P.woodDark) +
    rect(242, SILL + 12, 10, 24, P.woodDark) +
    pot(150, SILL, 1.05) +
    plant(150, SILL - 52, 168, { pairs: 5, leaf: 26, color: "#4f9d5d", seed: 3 }) +
    tag(150, SILL - 18, "Plant A", { size: 14 }) +
    // calendar, centre top
    calendar(222, 40, 146, 112, 14, 21) +
    // closet, right: open door + dark interior
    rect(410, 30, 214, 306, "#e6d4b6") +
    rect(424, 44, 186, 292, vgrad([[0, "#1b2a3c"], [1, "#24364c"]])) +
    rect(424, 44, 186, 292, rgrad([[0, "#3a4f66", 0.5], [1, "#1b2a3c", 0]], { cx: 0.5, cy: 0.85, r: 0.6 })) +
    line(432, 74, 600, 74, "#5d6772", 4) +
    rect(470, 76, 3, 40, "#3e4a5c") +
    path("M462 116 h18 l-9 -12Z", "#2f3b4c") +
    poly([[424, 44], [380, 26], [380, 352], [424, 336]], P.wood) +
    poly([[424, 44], [400, 34], [400, 344], [424, 336]], shade(P.wood, 0.18)) +
    circle(390, 196, 4, P.goldLight) +
    // shelf inside closet with plant B
    rrect(444, SILL, 150, 12, 3, "#4e5d6c") +
    rect(444, SILL + 9, 150, 4, "#3a4654") +
    pot(518, SILL, 1.05) +
    plant(518, SILL - 52, 50, { pairs: 2, leaf: 20, color: "#d8c45a", stem: "#a89a4a", droop: true, seed: 5 }) +
    tag(518, SILL - 18, "Plant B", { size: 14 }),
};
