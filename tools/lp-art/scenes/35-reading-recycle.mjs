import { P, rect, rrect, path, ellipse, circle, g, board, wallWindow, clock, stroke, shade, light, rng, contact } from "../../../access-practice-lab/src/art/kit.js";
import { room, lightPool, recycleBin } from "../lib/b.mjs";

const FLOOR = 300;

function papers(x, y, w) {
  const sheets = [[-56, -10, -24], [-34, -26, -10], [-8, -36, 4], [20, -30, 14], [46, -14, 28], [-46, -2, -34], [-20, -14, -8], [8, -18, 10], [34, -4, 22], [-2, -2, -2]];
  return sheets
    .map(([dx, dy, a], i) => {
      const cx = x + w / 2 + dx;
      const cy = y + dy;
      const fill = i % 3 === 1 ? "#f3efe6" : "#ffffff";
      return `<g transform="rotate(${a} ${cx} ${cy})">${rect(cx - 15, cy - 20, 30, 38, fill, 'rx="1.5"')}${stroke(`M${cx - 10} ${cy - 12}h20M${cx - 10} ${cy - 6}h20M${cx - 10} ${cy}h14M${cx - 10} ${cy + 6}h18`, "#a9b4c0", 1.4)}</g>`;
    })
    .join("");
}

function cans(x, y, w) {
  const cols = ["#c9cfd5", P.coral, "#c9cfd5", P.gold, "#b7bec6", P.teal, "#d3d8dd", "#c9cfd5", P.coral, "#b7bec6"];
  const pos = [[-54, -6, -14], [-30, -8, 6], [-6, -6, -4], [18, -8, 10], [44, -4, 16], [-40, -32, -22], [-16, -36, 4], [8, -38, -10], [32, -30, 18], [-4, -60, 12]];
  return pos
    .map(([dx, dy, a], i) => {
      const cx = x + w / 2 + dx;
      const cy = y + dy;
      const c = cols[i];
      return `<g transform="rotate(${a} ${cx} ${cy})">${rect(cx - 11, cy - 16, 22, 30, c, 'rx="3"')}${rect(cx + 3, cy - 16, 8, 30, shade(c, 0.18), 'opacity=".7"')}${rect(cx - 11, cy - 6, 22, 10, light(c, 0.35), 'opacity=".6"')}${ellipse(cx, cy - 16, 11, 3.6, "#e9edf0")}${ellipse(cx, cy - 16, 7, 2, "#b3bac2")}</g>`;
    })
    .join("");
}

export default {
  file: "35-reading-recycle.svg",
  w: 640,
  h: 400,
  title: "A blue recycling bin full of paper and a green recycling bin full of cans in a classroom.",
  draw: () =>
    room(640, 400, FLOOR) +
    wallWindow(36, 60, 110, 130, { view: "day", curtain: P.teal }) +
    board(220, 44, 260, 130, { marks: stroke("M244 74h120M244 98h170M244 122h90", "#9fb0c2", 4) }) +
    clock(560, 70, 20) +
    rect(520, 120, 92, 120, "#e8d7bd") +
    rect(528, 128, 34, 30, P.goldLight) + rect(568, 132, 36, 26, "#bfe0ee") + rect(530, 168, 72, 30, "#f6c8b6") + rect(540, 206, 54, 26, "#cde3c4") +
    circle(545, 128, 3, P.coral) + circle(586, 132, 3, P.teal) + circle(566, 168, 3, P.navy) + circle(567, 206, 3, P.gold) +
    lightPool(160, 340, 170, 30, 0.3) +
    recycleBin(112, 372, 168, 176, P.blue, papers(112, 196, 168)) +
    recycleBin(360, 372, 168, 176, P.green, cans(360, 196, 168)),
};
