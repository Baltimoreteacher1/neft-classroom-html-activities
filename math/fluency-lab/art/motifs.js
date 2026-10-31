// Twenty strand motifs, each drawn around the origin inside roughly x -36..36, y -32..32 with palette `c`.
// skillArt places a motif on a tile, badges reuse them at a smaller scale (and with the MONO palette when unearned).
import { arrowHead, circ, cross, cube, DASH, line, ngon, NOSTROKE, path, poly, rect, star, THIN } from "./core.js";

/** A flat coin seen from the side: ellipse top over a short band. */
const coin = (x, y, rx, fill) =>
  path(`M${x - rx} ${y}v5a${rx} ${rx * 0.4} 0 0 0 ${rx * 2} 0v-5`, fill) +
  path(`M${x - rx} ${y}a${rx} ${rx * 0.4} 0 0 1 ${rx * 2} 0a${rx} ${rx * 0.4} 0 0 1 -${rx * 2} 0Z`, fill);

const dots = (cols, rows, gx, gy, r, fill, x0 = 0, y0 = 0) => {
  let s = "";
  for (let j = 0; j < rows; j += 1)
    for (let i = 0; i < cols; i += 1) s += circ(x0 + i * gx, y0 + j * gy, r, fill);
  return s;
};

export const MOTIFS = {
  counting: (c) =>
    rect(-36, -13, 72, 26, c.white, 5) +
    line(-36, 0, 36, 0, THIN) +
    [-21.6, -7.2, 7.2, 21.6].map((x) => line(x, -13, x, 13, THIN)).join("") +
    dots(5, 1, 14.4, 0, 4.6, c.teal, -28.8, -6.5) +
    dots(3, 1, 14.4, 0, 4.6, c.blue, -28.8, 6.5) +
    circ(0.0, 6.5, 4.6, "none", `${DASH} stroke-width="1.8"`) +
    [4, 7, 10, 13, 16].map((h, i) => rect(-24 + i * 12, 31 - h, 8, h, c.teal, 2)).join(""),

  patterns: (c) =>
    circ(-30, -20, 6.5, c.teal) +
    rect(-21.5, -26.5, 13, 13, c.blue, 3) +
    circ(0, -20, 6.5, c.teal) +
    rect(8.5, -26.5, 13, 13, c.blue, 3) +
    circ(30, -20, 6.5, c.white, `${DASH} stroke-width="1.8"`) +
    path("M-36 -8V-4H-6V-8M-3 -8V-4H27V-8", "none", `${THIN} stroke="${c.amber}"`) +
    [1, 2, 3].map((n) => Array.from({ length: n }, (_, k) => rect(-34 + (n - 1) * 15, 28 - k * 10 - 8, 10, 8, n === 3 ? c.tealSoft : c.teal, 2)).join("")).join("") +
    rect(26, 18, 10, 8, c.white, 2, `${DASH} stroke-width="1.8"`),

  operations: (c) =>
    rect(-33, -30, 31, 28, c.teal, 7) +
    rect(2, -30, 31, 28, c.blue, 7) +
    rect(-33, 3, 31, 28, c.amber, 7) +
    rect(2, 3, 31, 28, c.navy, 7) +
    path("M-23 -16H-12M-17.5 -21.5V-10.5", "none", `stroke="${c.white}" stroke-width="3.5"`) +
    path("M12 -16H23", "none", `stroke="${c.white}" stroke-width="3.5"`) +
    path("M-23 11L-12 22M-12 11L-23 22", "none", `stroke="${c.navy}" stroke-width="3.5"`) +
    path("M12 17H23", "none", `stroke="${c.white}" stroke-width="3.5"`) +
    circ(17.5, 11.5, 1.8, c.white, NOSTROKE) +
    circ(17.5, 22.5, 1.8, c.white, NOSTROKE),

  fluency: (c) =>
    rect(-36, -8, 34, 26, c.white, 5, 'transform="rotate(-12 -19 5)"') +
    rect(-32, -14, 34, 26, c.blueSoft, 5, 'transform="rotate(-2 -15 -1)"') +
    rect(-27, -20, 34, 26, c.white, 5, 'transform="rotate(8 -10 -7)"') +
    dots(3, 1, 7, 0, 2.2, c.teal, -17, -7) +
    path("M-14 3H-2", "none", `stroke="${c.amber}" stroke-width="3.5"`) +
    path("M32 -14A15 15 0 0 0 15 -2", "none", `stroke="${c.teal}" stroke-width="3.2"`) +
    arrowHead(15, -2, -1, 0.7, 5, `stroke="${c.teal}" stroke-width="3.2"`) +
    path("M15 14A15 15 0 0 0 32 2", "none", `stroke="${c.blue}" stroke-width="3.2"`) +
    arrowHead(32, 2, 1, -0.7, 5, `stroke="${c.blue}" stroke-width="3.2"`),

  addition: (c) =>
    rect(-36, -30, 25, 24, c.white, 5) +
    circ(-28, -22, 4.2, c.teal) +
    circ(-19, -22, 4.2, c.teal) +
    circ(-23.5, -13, 4.2, c.teal) +
    path("M-4 -18H6M1 -23V-13", "none", `stroke="${c.amber}" stroke-width="4"`) +
    rect(11, -30, 25, 24, c.white, 5) +
    circ(19.5, -22, 4.2, c.blue) +
    circ(27.5, -13, 4.2, c.blue) +
    line(0, 0, 0, 8, `stroke="${c.navy}"`) +
    arrowHead(0, 9, 0, 1, 4.5) +
    rect(-36, 13, 72, 18, c.blueSoft, 5) +
    [-27, -15, -3].map((x) => circ(x, 22, 4.2, c.teal)).join("") +
    [9, 21].map((x) => circ(x, 22, 4.2, c.blue)).join(""),

  subtraction: (c) =>
    [0, 1, 2, 3].map((i) => circ(-30 + i * 14, -17, 5.4, c.teal)).join("") +
    [4, 5].map((i) => circ(-30 + i * 14, -17, 5.4, c.white, `${DASH} stroke-width="1.8"`)).join("") +
    [4, 5].map((i) => line(-34 + i * 14, -13, -26 + i * 14, -21, `stroke="${c.coral}" stroke-width="2"`)).join("") +
    line(-34, 18, 34, 18) +
    [0, 1, 2, 3, 4, 5, 6].map((i) => line(-34 + i * 11.3, 14, -34 + i * 11.3, 22, THIN)).join("") +
    path("M23.4 12A17 17 0 0 0 -0.2 12", "none", `stroke="${c.amber}" stroke-width="4"`) +
    arrowHead(-0.4, 12, -1, 0.2, 5, `stroke="${c.amber}" stroke-width="3"`) +
    circ(23.4, 18, 3.6, c.blue) +
    circ(-0.2, 18, 3.6, c.white),

  "place-value": (c) =>
    rect(-36, -28, 32, 32, c.blueSoft, 3) +
    [1, 2, 3, 4, 5].map((i) => line(-36 + i * 5.33, -28, -36 + i * 5.33, 4, THIN) + line(-36, -28 + i * 5.33, -4, -28 + i * 5.33, THIN)).join("") +
    rect(5, -28, 8, 32, c.teal, 2) +
    [1, 2, 3, 4].map((i) => line(5, -28 + i * 6.4, 13, -28 + i * 6.4, THIN)).join("") +
    rect(21, -4, 7, 7, c.amber, 1.5) +
    rect(30, -4, 7, 7, c.amber, 1.5) +
    rect(21, -13, 7, 7, c.amber, 1.5) +
    rect(-36, 12, 22, 18, c.blueSoft, 4) +
    rect(-11, 12, 22, 18, c.tealSoft, 4) +
    rect(14, 12, 22, 18, c.amberSoft, 4) +
    circ(-25, 21, 3.4, c.blue) +
    circ(0, 21, 3.4, c.teal) +
    circ(25, 21, 3.4, c.amber),

  multiplication: (c) =>
    rect(-30, -22, 66, 48, c.tealSoft, 6, NOSTROKE) +
    dots(5, 3, 13, 14, 4.8, c.teal, -20, -10) +
    dots(5, 1, 13, 0, 4.8, c.blue, -20, 18) +
    path("M-26 -30H32M-26 -33V-27M32 -33V-27", "none", `stroke="${c.amber}"`) +
    path("M-36 -18V30M-39 -18H-33M-39 30H-33", "none", `stroke="${c.amber}"`),

  division: (c) =>
    rect(-36, -30, 72, 20, c.white, 5) +
    dots(8, 1, 8.6, 0, 2.8, c.teal, -30, -20) +
    [-24, 0, 24].map((x) => line(x, -8, x, -1, "") + arrowHead(x, 0, 0, 1, 4)).join("") +
    [-24, 0, 24].map((x, k) => rect(x - 11, 5, 22, 26, [c.tealSoft, c.blueSoft, c.amberSoft][k], 5)).join("") +
    [-24, 0, 24].map((x, k) => dots(2, 2, 8, 8, 3.2, [c.teal, c.blue, c.amber][k], x - 4, 14)).join(""),

  "number-theory": (c) =>
    line(0, -14, -20, 4) +
    line(0, -14, 20, 4) +
    line(20, 12, 8, 22) +
    line(20, 12, 32, 22) +
    circ(0, -22, 10, c.amber) +
    circ(-20, 8, 8.5, c.teal) +
    circ(20, 8, 8.5, c.white) +
    circ(8, 26, 7, c.teal) +
    circ(32, 26, 7, c.teal) +
    circ(-20, 8, 3, c.white, NOSTROKE) +
    circ(8, 26, 2.4, c.white, NOSTROKE) +
    circ(32, 26, 2.4, c.white, NOSTROKE),

  fractions: (c) =>
    circ(0, -12, 20, c.white) +
    path("M0 -12V-32A20 20 0 1 1 -20 -12Z", c.teal) +
    line(0, -32, 0, 8) +
    line(-20, -12, 20, -12) +
    rect(-36, 16, 18, 14, c.blue, 3) +
    rect(-18, 16, 18, 14, c.blue, 3) +
    rect(0, 16, 18, 14, c.blue, 3) +
    rect(18, 16, 18, 14, c.white, 3),

  decimals: (c) =>
    rect(-36, -26, 44, 44, c.white, 3) +
    rect(-36, -26, 26.4, 44, c.teal, 3) +
    rect(-9.6, -26, 4.4, 17.6, c.blue, 0, NOSTROKE) +
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => line(-36 + i * 4.4, -26, -36 + i * 4.4, 18, `stroke="${c.white}" stroke-width="1"`)).join("") +
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => line(-36, -26 + i * 4.4, 8, -26 + i * 4.4, `stroke="${c.white}" stroke-width="1"`)).join("") +
    rect(-36, -26, 44, 44, "none", 3) +
    circ(19, 12, 5, c.amber) +
    [0, 1, 2].map((i) => rect(18 + i * 7, -26, 6, 30, i === 0 ? c.blue : c.white, 2, THIN)).join("") +
    path("M-36 28H36", "none", `stroke="${c.line}" stroke-width="2"`),

  money: (c) =>
    rect(-36, -30, 50, 28, c.tealSoft, 5, 'transform="rotate(-7 -11 -16)"') +
    circ(-11, -15, 6, c.white, 'transform="rotate(-7 -11 -15)"') +
    circ(-14, 10, 18, c.amber) +
    circ(-14, 10, 12, "none", THIN) +
    poly([[-14, 3.5], [-8, 10], [-14, 16.5], [-20, 10]], c.white, THIN) +
    [0, 1, 2].map((i) => coin(25, 24 - i * 8, 11, c.amber)).join("") +
    circ(18, -12, 9, c.line) +
    circ(18, -12, 5, "none", THIN),

  measurement: (c) =>
    rect(-36, 4, 72, 24, c.amberSoft, 4) +
    Array.from({ length: 13 }, (_, i) => line(-30 + i * 5, 4, -30 + i * 5, i % 4 === 0 ? 20 : i % 2 === 0 ? 15 : 11, THIN)).join("") +
    rect(-36, -18, 52, 13, c.teal, 4) +
    path("M-36 -28H16M-36 -32V-24M16 -32V-24", "none", `stroke="${c.amber}"`) +
    path("M-30 -11.5h6M-12 -11.5h6", "none", `stroke="${c.white}" stroke-width="2"`),

  geometry: (c) =>
    poly([[-36, 28], [-6, 28], [-36, -12]], c.teal) +
    path("M-36 20H-28V28", "none", THIN) +
    path("M-15 28A10 10 0 0 0 -18.4 20.4", "none", `stroke="${c.amber}" stroke-width="3"`) +
    poly(ngon(18, -14, 16, 6, 0), c.blue) +
    circ(22, 18, 11, c.amber) +
    line(22, 18, 33, 18, THIN) +
    circ(22, 18, 2.2, c.navy, NOSTROKE),

  data: (c) =>
    path("M-34 -30V26H36", "none", "") +
    line(-34, -6, 36, -6, `${DASH} stroke="${c.amber}" stroke-width="2.5"`) +
    rect(-27, 0, 12, 26, c.teal, 2) +
    rect(-10, -16, 12, 42, c.blue, 2) +
    rect(7, -4, 12, 30, c.teal, 2) +
    rect(24, -26, 12, 52, c.blue, 2) +
    circ(-21, -10, 2.4, c.white, THIN),

  "number-system": (c) =>
    line(-36, 8, 36, 8) +
    arrowHead(36, 8, 1, 0, 5) +
    arrowHead(-36, 8, -1, 0, 5) +
    [-24, -12, 12, 24].map((x) => line(x, 3, x, 13, THIN)).join("") +
    line(0, 1, 0, 15) +
    path("M-24 0A24 24 0 0 1 24 0", "none", `stroke="${c.amber}" stroke-width="3" ${DASH}`) +
    arrowHead(24, 0, 0, 1, 5, `stroke="${c.amber}" stroke-width="3"`) +
    circ(-24, 8, 6, c.teal) +
    circ(24, 8, 6, c.blue) +
    circ(0, 8, 3, c.white) +
    path("M-30 28H-18", "none", `stroke="${c.soft}" stroke-width="3"`) +
    path("M18 28H30M24 22V34", "none", `stroke="${c.soft}" stroke-width="3"`),

  ratios: (c) =>
    [0, 1].map((i) => rect(-36 + i * 17, -30, 16, 12, c.teal, 3)).join("") +
    [0, 1, 2].map((i) => rect(-36 + i * 17, -15, 16, 12, c.blue, 3)).join("") +
    rect(20, -30, 16, 27, c.white, 3, THIN) +
    path("M12 -17H20", "none", `stroke="${c.amber}" stroke-width="3"`) +
    rect(-36, 10, 72, 14, c.white, 4) +
    rect(-36, 10, 28.8, 14, c.amber, 4) +
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => line(-36 + i * 7.2, 10, -36 + i * 7.2, 24, THIN)).join("") +
    path("M-36 31H36", "none", `stroke="${c.line}" stroke-width="2"`),

  expressions: (c) =>
    line(-34, -16, 34, -16) +
    line(0, -16, 0, 22) +
    rect(-14, 22, 28, 8, c.navy, 3) +
    poly([[0, -23], [-5, -13], [5, -13]], c.amber) +
    path("M-28 -16L-37 4M-28 -16L-19 4M-39 4H-17Q-17 14 -28 14Q-39 14 -39 4Z", c.tealSoft) +
    path("M28 -16L19 4M28 -16L37 4M17 4H39Q39 14 28 14Q17 14 17 4Z", c.blueSoft) +
    rect(-34, -8, 12, 12, c.teal, 3) +
    cross(-28, -2, 3, `stroke="${c.white}" stroke-width="2"`) +
    circ(23, -1, 4.6, c.blue) +
    circ(33, -1, 4.6, c.blue) +
    circ(28, -9.5, 4.6, c.blue),

  exponents: (c) =>
    line(-36, 28, 36, 28, `stroke="${c.line}" stroke-width="2"`) +
    cube(-26, 28, 6, c.tealSoft, c.teal, c.tealInk) +
    cube(-4, 28, 11, c.tealSoft, c.teal, c.tealInk) +
    cube(24, 28, 17, c.tealSoft, c.teal, c.tealInk) +
    line(-30, -14, 28, -30, `stroke="${c.amber}" stroke-width="3.5"`) +
    arrowHead(28, -30, 3.6, -1, 6, `stroke="${c.amber}" stroke-width="3.5"`),

  linear: (c) =>
    path("M-32 -30V26H36", "none", "") +
    [-18, -4, 10, 24].map((x) => line(x, 26, x, 22, THIN)).join("") +
    [-14, -2, 10].map((y) => line(-32, y, -28, y, THIN)).join("") +
    line(-30, 22, 34, -24, `stroke="${c.teal}" stroke-width="4"`) +
    line(-30, -10, 34, 16, `stroke="${c.blue}" stroke-width="4"`) +
    circ(-1.6, 1.5, 6, c.amber),
};

export const MOTIF_KEYS = Object.freeze(Object.keys(MOTIFS));

/** strand name (problem-bank `strand`) -> motif key. Every one of the 34 strands has an entry. */
export const STRAND_MOTIF = Object.freeze({
  "Number sense": "counting",
  Counting: "counting",
  "Number relationships": "counting",
  Patterns: "patterns",
  Fluency: "fluency",
  Operations: "operations",
  Addition: "addition",
  Subtraction: "subtraction",
  "Place value": "place-value",
  Multiplication: "multiplication",
  Division: "division",
  "Number theory": "number-theory",
  Fractions: "fractions",
  Decimals: "decimals",
  Money: "money",
  Measurement: "measurement",
  Geometry: "geometry",
  "Geometry extension": "geometry",
  Data: "data",
  Statistics: "data",
  "Number system": "number-system",
  "Rational numbers": "number-system",
  "Real numbers": "number-system",
  Ratios: "ratios",
  Proportions: "ratios",
  Percents: "ratios",
  Expressions: "expressions",
  Equations: "expressions",
  Exponents: "exponents",
  "Scientific notation": "exponents",
  "Linear relationships": "linear",
  Functions: "linear",
  Systems: "linear",
});
export { star };
