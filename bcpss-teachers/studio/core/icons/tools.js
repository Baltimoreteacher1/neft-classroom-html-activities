import { C, E, INK, Ln, N, Pa, Pg, R, T, bar, dot, ic, ring } from "./dsl.js";

const STEEL = "#cbd5e1";
const STEEL_D = "#9aa8b6";
const WOOD = "#b9824c";

// prettier-ignore
export default [
  ic("hammer", "tools", "build nail fix construct", "#d0473a", (c) =>
    T(32, 32, R(-3.5, -4, 7, 36, WOOD, 2) + R(-17, -22, 30, 14, 3, STEEL) + Pg([[13, -22], [24, -25], [24, -5], [13, -8]], STEEL_D) + R(-17, -22, 10, 14, 3, c.m), 1, 40)),

  ic("wrench", "tools", "fix repair bolt tighten", "#3b7dc4", (c) =>
    T(32, 32, bar(0, -4, 0, 24, 9, STEEL) + Pa("M-9 -6V-24Q-9 -30 -4 -30V-20H4V-30Q9 -30 9 -24V-6Z", STEEL) + ring(0, 28, 4, 3, c.m), 1, 38)),

  ic("screwdriver", "tools", "screw fix turn", "#ea8a2b", (c) =>
    T(32, 32, R(-5, 6, 10, 26, 5, c.m) + R(-2.2, -22, 4.4, 28, STEEL) + Pg([[-3, -26], [3, -26], [2.2, -22], [-2.2, -22]], STEEL_D) + Ln("M-5 14h10M-5 20h10", c.d, 1.5), 1, 40)),

  ic("saw", "tools", "cut wood carpenter", "#b9824c", (c) =>
    Pa("M24 16L60 22V30L56 34L52 30L48 34L44 30L40 34L36 30L32 34L28 30L24 34Z", STEEL) + R(4, 12, 22, 30, 7, c.m) + C(15, 27, 4.5, "#fff")),

  ic("paint-roller", "tools", "paint wall decorate", "#3fa79a", (c) =>
    R(8, 8, 40, 16, 5, c.m) + R(46, 12, 8, 8, 2, "#fff") + Ln("M54 16h4v14H34v8", INK, 2.5) + R(30, 36, 8, 22, 3, WOOD)),

  ic("ladder", "tools", "climb steps rungs", "#b9824c", (c) =>
    R(14, 4, 6, 56, 2, c.m) + R(44, 4, 6, 56, 2, c.m) + [14, 26, 38, 50].map((y) => R(20, y, 24, 5, 1.5, c.d)).join("")),

  ic("pliers", "tools", "grip pinch fix wire", "#d0473a", (c) =>
    T(32, 32, Pa("M-4 -28L-9 -6L-3 2L0 -6Z", STEEL) + Pa("M4 -28L9 -6L3 2L0 -6Z", STEEL_D) + Pa("M-3 2L-12 30Q-14 36-9 36Q-5 36-4 30L0 8Z", c.m) + Pa("M3 2L12 30Q14 36 9 36Q5 36 4 30L0 8Z", c.d) + dot(0, -2, 2.4, "#fff"), 1, 20)),

  ic("tape-measure", "tools", "measure length inches centimeters", "#f2c335", (c) =>
    R(8, 12, 40, 40, 8, c.m) + C(28, 32, 11, "#fff") + R(44, 40, 16, 12, 2, "#fff") + Ln("M50 40v5M54 40v7M58 40v5", INK, 1.5) + dot(28, 32, 3.5, INK)),

  ic("shovel", "tools", "dig garden soil", "#6b7f3a", (c) =>
    T(32, 32, R(-3, -30, 6, 34, WOOD, 2) + R(-8, -32, 16, 5, 2.5, c.m) + Pa("M-11 4H11L10 22Q0 36-10 22Z", STEEL), 1, 38)),

  ic("bucket", "tools", "pail carry water sand", "#3b7dc4", (c) =>
    Ln("M12 22Q32-6 52 22", INK, 2.5) + Pa("M9 20H55L50 56Q32 60 14 56Z", c.m) + E(32, 20, 23, 5, c.d) + Ln("M16 36h32", c.d, 2)),

  ic("flashlight", "tools", "light torch dark beam", "#ea8a2b", (c) =>
    T(32, 32, R(-8, -2, 16, 32, 4, c.m) + Pa("M-8 -2L-14 -16H14L8 -2Z", STEEL) + R(-15, -22, 30, 7, 3, STEEL_D) + R(-3, 8, 6, 9, 2, "#fff") + Ln("M-18 -27l-5-6M0 -29v-8M18 -27l5-6", "#f2c335", 3), 1, 0)),

  ic("key", "tools", "lock open unlock", "#f2c335", (c) =>
    ring(20, 24, 12, 7, c.m) + bar(31, 31, 55, 55, 6, c.m) + Ln("M44 44l5-5M50 50l5-5", INK, 3)),

  ic("lock", "tools", "secure padlock safe locked", "#6b7f3a", (c) =>
    Ln("M20 28V20Q20 8 32 8T44 20V28", INK, 5) + Ln("M20 28V20Q20 8 32 8T44 20V28", STEEL, 2) + R(12, 28, 40, 28, 5, c.m) + C(32, 41, 4.5, INK) + R(30.5, 41, 3, 8, 1, INK)),

  ic("toolbox", "tools", "tools carry fix build", "#d0473a", (c) =>
    Ln("M22 20V14Q22 10 26 10H38Q42 10 42 14V20", INK, 3) + R(5, 20, 54, 36, 5, c.m) + R(5, 32, 54, 5, 0, c.d) + R(27, 28, 10, 13, 2, STEEL)),
];
