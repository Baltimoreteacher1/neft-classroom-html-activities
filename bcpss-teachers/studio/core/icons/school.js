import { C, E, INK, ic, Ln, N, Pa, Pg, R, T, bar, dot, ring, light, shade } from "./dsl.js";

const WOOD = "#b9824c";

// prettier-ignore
export default [
  ic("book", "school", "read reading open pages library", "#3b7dc4", (c) =>
    Pa("M3 16V55Q18 51 32 58 46 51 61 55V16Z", c.m) + Pa("M7 13q13-2 25 5v36Q20 47 7 51Z", "#fff") + Pa("M57 13q-13-2-25 5v36q12-7 25-3Z", "#fff") +
    Ln("M12 23q8-1 14 2M12 31q8-1 14 2M12 39q8-1 14 2M52 23q-8-1-14 2M52 31q-8-1-14 2M52 39q-8-1-14 2", "#9fb4cc")),

  ic("pencil", "school", "write writing draw yellow", "#f2c335", (c) =>
    T(32, 32, R(-5, -26, 10, 36, c.m) + Ln("M-1.5 -26V10M1.5 -26V10", c.d, 1.5, 'stroke-linecap="butt"') + Pg([[-5, 10], [5, 10], [0, 24]], "#f0d6b0") + Pg([[-2, 19.5], [2, 19.5], [0, 24]], INK) +
      R(-5, -26, 10, 5, "#b9c2cc") + R(-5, -33, 10, 7, "#e58fb0", 2.5), 1.05, 45)),

  ic("backpack", "school", "bag school carry straps", "#d0473a", (c) =>
    R(10, 28, 6, 20, c.d, 2.5) + R(48, 28, 6, 20, c.d, 2.5) + Ln("M26 16v-4q0-4 6-4t6 4v4", INK, 3) + R(14, 14, 36, 44, 11, c.m) +
    R(19, 36, 26, 17, 5, c.l) + Ln("M20 26h24", INK, 2) + R(29, 41, 6, 5, 1.5, "#f2c335")),

  ic("ruler", "school", "measure length inches centimeters math", "#e8c987", (c) =>
    T(32, 32, R(-31, -9, 62, 18, c.m, 2) + Ln("M-25-9v7M-17-9v5M-9-9v7M-1-9v5M7-9v7M15-9v5M23-9v7", INK, 2, 'stroke-linecap="butt"'), 1, -35)),

  ic("clock", "school", "time hours minutes schedule", "#3b7dc4", (c) =>
    C(32, 32, 26, "#fff", `stroke="${c.m}" stroke-width="5"`) + Ln("M32 11v5M32 48v5M11 32h5M48 32h5") + Ln("M32 32V19", INK, 3.5) + Ln("M32 32l10 7", INK, 3.5) + dot(32, 32, 3)),

  ic("desk", "school", "table classroom furniture work", "#b9824c", (c) =>
    R(8, 30, 5, 28, c.d, 2) + R(51, 30, 5, 28, c.d, 2) + R(14, 30, 36, 14, 2, c.l) + R(29, 35, 6, 4, 1.5, INK) + R(4, 22, 56, 9, 3, c.m) +
    R(34, 11, 16, 11, 1.5, "#3b7dc4") + Ln("M34 16h16", "#fff", 1.5)),

  ic("scissors", "school", "cut craft paper snip", "#ea8a2b", (c) =>
    bar(20, 44, 54, 6, 5, "#cbd5e1") + bar(44, 44, 10, 6, 5, "#aab4be") + ring(16, 52, 7, 4, c.m) + ring(48, 52, 7, 4, c.m) + dot(32, 29, 3, "#fff")),

  ic("notebook", "school", "journal write spiral paper", "#3b7dc4", (c) =>
    R(10, 6, 44, 52, 4, c.m) + R(17, 10, 34, 44, 2, "#fff") + Ln("M23 22h22M23 30h22M23 38h22M23 46h14", "#9fb4cc") +
    [12, 22, 32, 42, 52].map((y) => R(6, y - 2, 14, 4, 2, "#cbd5e1")).join("")),

  ic("calculator", "school", "math numbers compute add", "#4a5568", (c) =>
    R(13, 5, 38, 54, 6, c.m) + R(18, 10, 28, 12, 2, "#cfe8d8") +
    [0, 1, 2].map((i) => [0, 1, 2, 3].map((j) => R(18 + i * 10, 27 + j * 8, 7, 5.5, 2, i === 2 && j === 3 ? "#ea8a2b" : "#e2e8f0")).join("")).join("")),

  ic("globe", "school", "world map geography earth", "#3b8fc4", (c) =>
    R(29, 46, 6, 8, 0, WOOD) + R(18, 53, 28, 6, 2.5, WOOD) + C(32, 27, 22, c.m) + Pa("M18 14q8-4 14 0 0 8-8 8-4 4-8-2Z", "#5aa84e") + Pa("M36 28q10-4 14 4 0 8-8 10-6-4-6-14Z", "#5aa84e") +
    Ln("M54 12a28 28 0 0 1 2 22", INK, 2)),

  ic("paintbrush", "school", "art paint draw color", "#d0473a", (c) =>
    T(32, 32, R(-3.5, -4, 7, 36, WOOD, 3) + R(-5.5, -14, 11, 10, 1, "#aab4be") + Pa("M-5 -14Q-9 -30 0 -38q9 8 5 24Z", c.m), 1, 38)),

  ic("eraser", "school", "rubber fix mistake erase", "#e58fb0", (c) =>
    T(32, 32, R(-25, -11, 28, 22, 4, c.m) + R(-1, -11, 25, 22, 4, "#3b7dc4") + Ln("M3 -11v22", INK, 2), 1, -30)),

  ic("glue", "school", "paste stick craft adhesive", "#3b7dc4", (c) =>
    Pg([[28, 12], [36, 12], [32, 4]], "#ea8a2b") + R(26, 11, 12, 11, 2, "#ea8a2b") + R(19, 21, 26, 38, 5, "#fff") + R(19, 33, 26, 16, 0, c.m) + Ln("M25 41h14", "#fff", 2.5)),

  ic("crayon", "school", "color draw coloring wax", "#3b7dc4", (c) =>
    T(32, 32, R(-6, -22, 12, 36, c.m) + R(-6, -14, 12, 22, shade(c.m, 0.25)) + Ln("M-6 -8h12M-6 2h12", "#fff", 2) + Pg([[-6, 14], [6, 14], [0, 28]], c.m) + Pg([[-6, -22], [6, -22], [3, -28], [-3, -28]], c.m), 1, 38)),

  ic("chalkboard", "school", "board teacher classroom lesson", "#2f6b57", (c) =>
    R(4, 8, 56, 40, 3, WOOD) + R(9, 13, 46, 30, 1, c.m) + Ln("M14 21h22M14 29h14M14 37h18", "#fff", 2.5) + Ln("M42 36l4 4 8-12", "#f2c335", 3) + R(4, 47, 56, 6, 2, WOOD) + R(38, 45, 9, 3, 1, "#fff")),

  ic("bell", "school", "ring alarm recess sound", "#f2c335", (c) =>
    C(32, 11, 4, c.d) + Pa("M12 46Q12 14 32 14T52 46Z", c.m) + R(8, 45, 48, 7, 3.5, c.d) + C(32, 56, 4, c.d) + N(Pa("M20 40Q20 24 28 20", "none", `stroke="${c.l}" stroke-width="3" stroke-linecap="round"`))),

  ic("lunchbox", "school", "food lunch pack meal", "#3b7dc4", (c) =>
    Ln("M22 24v-6q0-5 5-5h10q5 0 5 5v6", INK, 3.5) + R(7, 22, 50, 34, 6, c.m) + R(7, 34, 50, 4, 0, c.d, 'stroke="none"') + R(28, 30, 8, 10, 2, "#f2c335")),

  ic("trophy", "school", "award win prize first place", "#f2c335", (c) =>
    ring(15, 22, 7, 3, c.m) + ring(49, 22, 7, 3, c.m) + Pa("M14 8h36v14q0 16-18 18Q14 38 14 22Z", c.m) + R(28, 38, 8, 10, 0, c.d) + R(18, 48, 28, 9, 3, "#7a5236") + N(Pa("M20 12v10q0 8 6 12", "none", 'stroke="#fff6cf" stroke-width="3" stroke-linecap="round"'))),
];
