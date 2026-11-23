import { C, E, INK, Ln, N, Pa, Pg, R, T, bar, dot, ic, ngon, ring } from "./dsl.js";

const grid = (x, y, w, h, cols, rows, color = "#00000040") =>
  Array.from({ length: cols - 1 }, (_, i) =>
    Ln(`M${x + ((i + 1) * w) / cols} ${y}v${h}`, color, 1.2),
  ).join("") +
  Array.from({ length: rows - 1 }, (_, i) =>
    Ln(`M${x} ${y + ((i + 1) * h) / rows}h${w}`, color, 1.2),
  ).join("");

// prettier-ignore
export default [
  ic("base-ten-rod", "math", "tens ten place value block manipulative", "#3fa79a", (c) =>
    R(26, 3, 12, 58, 2, c.m) + grid(26, 3, 12, 58, 1, 10, "#ffffff90")),

  ic("base-ten-flat", "math", "hundreds hundred place value block manipulative", "#3b7dc4", (c) =>
    R(8, 8, 48, 48, 3, c.m) + grid(8, 8, 48, 48, 10, 10, "#ffffff70")),

  ic("unit-cube", "math", "ones one cube place value volume manipulative", "#f2c335", (c) =>
    Pg([[32, 10], [54, 22], [32, 34], [10, 22]], c.l) + Pg([[10, 22], [32, 34], [32, 58], [10, 46]], c.m) + Pg([[54, 22], [32, 34], [32, 58], [54, 46]], c.d)),

  ic("two-color-counter", "math", "counters positive negative integers red yellow", "#d0473a", (c) =>
    C(23, 26, 18, "#f2c335") + C(41, 40, 18, c.m) + N(E(36, 33, 7, 4, "#ffffff", 'opacity=".4"'))),

  ic("fraction-circle", "math", "pie parts whole fourths piece", "#ea8a2b", (c) =>
    C(32, 32, 26, "#ffffff") + Pa("M32 32V6A26 26 0 0 1 58 32Z", c.m) + Pa("M32 32H58A26 26 0 0 1 32 58Z", c.l) + Ln("M32 6V58M6 32H58", INK, 2)),

  ic("fraction-bar", "math", "fraction strip parts whole thirds", "#4f9d5d", (c) =>
    R(5, 14, 54, 15, 1, "#ffffff") + R(5, 14, 36, 15, 1, c.m) + Ln("M23 14V29M41 14V29", INK, 2) + R(5, 35, 54, 15, 1, "#ffffff") + R(5, 35, 27, 15, 1, c.l) + Ln("M32 35V50", INK, 2)),

  ic("dice", "math", "probability chance roll game number cube", "#ffffff", (c) =>
    R(8, 8, 48, 48, 9, c.m) + [[20, 20], [44, 20], [32, 32], [20, 44], [44, 44]].map(([x, y]) => dot(x, y, 4)).join("")),

  ic("domino", "math", "tile game dots counting pairs", "#fbf6ec", (c) =>
    T(32, 32, R(-13, -28, 26, 56, 5, c.m) + Ln("M-13 0H13", INK, 2.2) + [[-6, -18], [6, -8], [-6, -8], [6, -18]].map(([x, y]) => dot(x, y, 3)).join("") + [[0, 14], [-6, 20], [6, 20], [-6, 8], [6, 8]].map(([x, y]) => dot(x, y, 3)).join(""), 1, 28)),

  ic("abacus", "math", "counting beads place value frame", "#b9824c", (c) =>
    R(5, 6, 54, 52, 4, "#fbf6ec") + [14, 25, 36, 47].map((y, i) => Ln(`M8 ${y}H56`, INK, 1.8) + [0, 1, 2, 3].map((k) => ring(15 + k * 7 + (i % 2 ? 22 : 0), y, 3.2, 3, i % 2 ? "#3b7dc4" : "#d0473a")).join("")).join("") + R(3, 4, 58, 4, 2, c.m) + R(3, 56, 58, 4, 2, c.m)),

  ic("ten-frame", "math", "ten frame counting five ten subitize", "#3b7dc4", (c) =>
    R(5, 14, 54, 36, 2, "#ffffff") + grid(5, 14, 54, 36, 5, 2, INK) + [0, 1, 2, 3, 4].map((i) => C(10.8 + i * 10.8, 23, 4.2, c.m)).join("") + [0, 1, 2].map((i) => C(10.8 + i * 10.8, 41, 4.2, c.m)).join("")),

  ic("tally-marks", "math", "count tally data groups of five", "#3a4552", (c) =>
    Ln("M10 12V50M20 12V50M30 12V50M40 12V50M4 40L46 22", INK, 3.5) + Ln("M52 12V50", INK, 3.5)),

  ic("coin", "math", "money cents dollars penny quarter", "#f2c335", (c) =>
    C(32, 32, 26, c.m) + C(32, 32, 19, "none", `stroke="${c.d}" stroke-width="2"`) + Pa("M32 18V46M25 26Q25 22 32 22T39 27Q39 31 32 32T25 38Q25 42 32 42T39 38", "none", `stroke="${INK}" stroke-width="3"`)),

  ic("dollar-bill", "math", "money paper cash dollar bill", "#4f9d5d", (c) =>
    R(3, 14, 58, 36, 3, c.m) + R(8, 19, 48, 26, 2, c.l) + C(32, 32, 9, c.m) + Ln("M32 26V38M29 29Q29 27 32 27T35 30Q35 32 32 32T29 35Q29 37 32 37T35 35", INK, 1.8) + dot(14, 32, 3, c.d) + dot(50, 32, 3, c.d)),

  ic("protractor", "math", "angle degrees measure geometry", "#3b7dc4", (c) =>
    Pa("M4 46A28 28 0 0 1 60 46Z", "#cfe8f2", `stroke-linejoin="round"`) + Pa("M16 46A16 16 0 0 1 48 46Z", "#ffffff") + Ln("M32 46V20M32 46L12 28M32 46L52 28M32 46L16 18M32 46L48 18", INK, 1.4) + dot(32, 46, 2.6)),

  ic("drawing-compass", "math", "circle draw geometry arc radius", "#d0473a", (c) =>
    Pa("M29 6H35V14H29Z", c.m) + bar(32, 14, 14, 56, 5, "#cbd5e1") + bar(32, 14, 50, 56, 5, "#cbd5e1") + R(26, 10, 12, 9, 3, c.m) + Pg([[10, 56], [16, 56], [11, 62]], INK)),

  ic("geoboard", "math", "pegs rubber band shape perimeter area", "#b9824c", (c) =>
    R(4, 4, 56, 56, 4, c.m) + [14, 24, 34, 44, 54].map((x) => [14, 24, 34, 44, 54].map((y) => dot(x, y, 2.2, "#fbf6ec")).join("")).join("") + Pg([[24, 24], [44, 24], [44, 44]], "none", 'stroke="#d0473a" stroke-width="3" stroke-linejoin="round"')),

  ic("spinner", "math", "probability chance spin game wheel", "#ea8a2b", (c) =>
    C(32, 32, 26, "#ffffff") + Pa("M32 32V6A26 26 0 0 1 54.5 19Z", "#d0473a") + Pa("M32 32L54.5 19A26 26 0 0 1 54.5 45Z", "#f2c335") + Pa("M32 32L54.5 45A26 26 0 0 1 32 58Z", "#4f9d5d") + Pa("M32 32L32 58A26 26 0 0 1 9.5 45Z", "#3b7dc4") + Pa("M32 32L9.5 45A26 26 0 0 1 9.5 19Z", "#ea8a2b") + Pa("M32 32L9.5 19A26 26 0 0 1 32 6Z", "#a24f72") + Pg([[28, 34], [47, 15], [50, 18], [34, 38]], INK) + dot(32, 32, 4, "#ffffff")),

  ic("measuring-cup", "math", "capacity volume liquid measure cups", "#3fa79a", (c) =>
    Pa("M10 10H48L44 56Q44 60 40 60H18Q14 60 14 56Z", "#e8f4f6") + Pa("M12 34H46L44 56Q44 60 40 60H18Q14 60 14 56Z", c.m) + Ln("M10 18h8M10 26h12M10 34h8M10 42h12", INK, 1.8) + Ln("M48 14Q62 14 60 28Q58 40 46 42", INK, 4)),
];
