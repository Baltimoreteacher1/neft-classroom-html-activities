import { P, rect, rrect, circle, poly, path, line, stroke, text, tag, g, shade, light, vgrad } from "../kit.mjs";
import { mapTree } from "../lib/c.mjs";

// Geometry kept from the original map: Main St y 180-220; Oak St x 260-300; Pine Ave x 460-500.
const ROAD = "#7d8794";
const drop = (x, y, w, h, r = 4) => rrect(x + 4, y + 5, w, h, r, "#1c2f4a", 'opacity=".18"');

/** Top-down hip roof. */
const roof = (x, y, w, h, c) => {
  const inset = Math.min(w, h) * 0.42;
  return (
    drop(x, y, w, h, 2) +
    rect(x, y, w, h, c) +
    poly([[x, y], [x + w, y], [x + w - inset, y + h / 2], [x + inset, y + h / 2]], light(c, 0.22)) +
    poly([[x + w, y], [x + w, y + h], [x + w - inset, y + h / 2]], shade(c, 0.12)) +
    poly([[x, y + h], [x + w, y + h], [x + w - inset, y + h / 2], [x + inset, y + h / 2]], shade(c, 0.2)) +
    line(x + inset, y + h / 2, x + w - inset, y + h / 2, shade(c, 0.3), 1.4)
  );
};
const house = (x, y, c) => roof(x, y, 40, 34, c) + rect(x + 26, y + 6, 6, 8, "#8a5a44");

const lot = (x, y, w, h, label) =>
  rrect(x, y, w, h, 6, "#e3d9b8") +
  rrect(x, y, w, h, 6, "none", `stroke="${P.navy}" stroke-width="2" stroke-dasharray="7 5"`) +
  [[0.2, 0.3], [0.75, 0.7], [0.4, 0.8], [0.85, 0.25]].map(([a, b]) => path(`M${x + w * a} ${y + h * b} l-3 -6 M${x + w * a} ${y + h * b} l3 -7`, "none", `stroke="#9bb07a" stroke-width="1.6"`)).join("") +
  tag(x + w / 2, y + h / 2 + 2, label, { size: 14 });

const roadLabel = (x, y, str, rot = 0) =>
  `<g transform="translate(${x} ${y})${rot ? ` rotate(${rot})` : ""}">${rrect(-str.length * 4.6 - 8, -11, str.length * 9.2 + 16, 22, 11, P.navy, 'opacity=".85"')}${text(0, 5, str, { size: 14, fill: P.white })}</g>`;

const compass = (x, y) =>
  g(
    circle(x + 2, y + 3, 26, "#1c2f4a", 'opacity=".16"') +
      circle(x, y, 26, P.ivory) +
      circle(x, y, 26, "none", `stroke="${P.navy}" stroke-width="2"`) +
      poly([[x, y - 21], [x + 6, y], [x - 6, y]], P.red) +
      poly([[x, y + 21], [x + 6, y], [x - 6, y]], P.navy) +
      circle(x, y, 2.5, P.ivory) +
      rrect(x - 9, y - 50, 18, 18, 4, P.navy) +
      text(x, y - 36, "N", { size: 14, fill: P.white }),
  );

export default {
  file: "35-speaking-neighborhood-map.svg",
  w: 640,
  h: 400,
  title:
    "A map of a neighborhood. Main Street goes across the middle, and Oak Street and Pine Avenue go up and down. The school is at the corner of Main Street and Oak Street. The library is across Main Street from the school, and the park with trees is next to the library. A store and a fire station are on Pine Avenue. Two empty lots are marked Lot 1, next to the school, and Lot 2, next to the store. Houses fill the middle blocks. A compass shows north at the top.",
  draw: () =>
    rect(0, 0, 640, 400, "#efe6cf") +
    // sidewalks
    rect(0, 172, 640, 56, "#ddd5c2") +
    rect(252, 0, 56, 400, "#ddd5c2") +
    rect(452, 0, 56, 400, "#ddd5c2") +
    // roads
    rect(0, 180, 640, 40, ROAD) +
    rect(260, 0, 40, 400, ROAD) +
    rect(460, 0, 40, 400, ROAD) +
    stroke("M0 200H240M320 200H440M520 200H640M280 0V160M280 240V400M480 0V160M480 240V400", "#f3dd8a", 2.6, 'stroke-dasharray="12 10"') +
    // crosswalks
    [280, 480].map((cx) => [-1, 1].map((sd) => {
      let d = "";
      for (let i = -16; i <= 16; i += 8) d += `M${cx + i} ${200 + sd * 26}v${sd * 8}`;
      return stroke(d, "#f6f3ea", 4);
    }).join("")).join("") +
    // Lot 1 (next to the school)
    lot(20, 90, 96, 80, "Lot 1") +
    // School with flag
    drop(130, 60, 120, 110) +
    rect(130, 60, 120, 110, "#e8a49a") +
    rect(140, 70, 100, 72, "#d98478") +
    rect(140, 70, 100, 36, light("#d98478", 0.15)) +
    line(140, 106, 240, 106, shade("#d98478", 0.3), 1.4) +
    rect(160, 148, 60, 22, "#cfd8dc") +
    line(150, 72, 150, 44, P.ink, 2) +
    path("M150 44 l18 6 l-18 6Z", P.red) +
    tag(190, 126, "School", { size: 15 }) +
    // houses, upper middle block
    house(320, 80, "#c98b5a") +
    house(400, 80, "#8fa6b8") +
    house(320, 132, "#b07a8c") +
    house(400, 132, "#7f9f7a") +
    mapTree(380, 60, 9) +
    // Lot 2 and Store
    lot(516, 20, 114, 66, "Lot 2") +
    drop(516, 96, 114, 76) +
    rect(516, 96, 114, 76, "#f0c45a") +
    rect(516, 96, 114, 22, "#e0a92e") +
    stroke("M516 118h114", "#c98f1e", 2) +
    [528, 556, 584, 612].map((x, i) => rect(x, 118, 14, 8, i % 2 ? P.white : P.coral)).join("") +
    tag(573, 148, "Store", { size: 15 }) +
    // Park with trees
    drop(12, 236, 128, 152, 10) +
    rrect(12, 236, 128, 152, 10, "#9ccf8e") +
    path("M20 380 C60 340 50 300 132 258", "none", 'stroke="#e8d6b4" stroke-width="10"') +
    mapTree(40, 262, 15) +
    mapTree(98, 290, 16) +
    mapTree(44, 324, 14) +
    mapTree(104, 344, 13) +
    circle(76, 300, 9, P.waterLight) +
    tag(76, 370, "Park", { size: 14 }) +
    // Library
    drop(150, 236, 100, 90) +
    rect(150, 236, 100, 90, "#9cc3e6") +
    poly([[150, 236], [250, 236], [230, 266], [170, 266]], light("#9cc3e6", 0.2)) +
    rect(170, 266, 60, 44, "#7fa9d0") +
    [178, 192, 206, 220].map((x) => rect(x, 300, 6, 22, P.ivory)).join("") +
    tag(200, 282, "Library", { size: 15 }) +
    // houses, lower middle block
    house(320, 252, "#c98b5a") +
    house(400, 252, "#b07a8c") +
    mapTree(436, 340, 11) +
    // Fire station
    drop(516, 236, 114, 90) +
    rect(516, 236, 114, 90, "#d9473f") +
    rect(516, 236, 114, 24, shade("#d9473f", 0.15)) +
    rect(528, 282, 38, 40, "#f2efe6") +
    rect(576, 282, 38, 40, "#f2efe6") +
    stroke("M528 292h38M528 302h38M528 312h38M576 292h38M576 302h38M576 312h38", "#c9c3b8", 1.4) +
    tag(573, 262, "Fire Station", { size: 13, fill: P.white }) +
    // compass
    compass(380, 352) +
    // street names
    roadLabel(100, 200, "Main St") +
    roadLabel(280, 100, "Oak St", -90) +
    roadLabel(480, 330, "Pine Ave", -90),
};
