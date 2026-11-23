import { C, E, INK, Ln, N, Pa, Pg, R, T, bar, dot, ic, ring } from "./dsl.js";

const GLASS = "#e6f2f8";
const GREY = "#aab4be";

// prettier-ignore
export default [
  ic("beaker", "science", "lab chemistry liquid measure experiment", "#3b8fc4", (c) =>
    Pa("M14 8h36l-3 6v34q0 10-9 10H26q-9 0-9-10V14Z", GLASS) + Pa("M17 32h30v16q0 10-9 10H26q-9 0-9-10Z", c.m) + Ln("M14 8h36", INK, 3) + Ln("M22 18h6M22 25h8M22 32h6", INK, 2) + dot(36, 44, 2.2, "#fff") + dot(30, 49, 1.8, "#fff")),

  ic("flask", "science", "lab chemistry erlenmeyer experiment mixture", "#4f9d5d", (c) =>
    Pa("M24 6h16v16l17 30q3 8-5 8H12q-8 0-5-8l17-30Z", GLASS) + Pa("M17 38h30l10 14q3 8-5 8H12q-8 0-5-8Z", c.m) + Ln("M22 6h20", INK, 3.5) + dot(30, 48, 2.4, "#fff") + dot(38, 44, 1.8, "#fff")),

  ic("test-tube", "science", "lab chemistry sample tube experiment", "#d0473a", (c) =>
    T(32, 32, Pa("M-9-28h18v42a9 9 0 0 1-18 0Z", GLASS) + Pa("M-9 0h18v14a9 9 0 0 1-18 0Z", c.m) + Ln("M-11-28h22", INK, 3) + dot(-2, 8, 2, "#fff"), 1, 25)),

  ic("magnifier", "science", "inspect zoom look investigate search", "#3b8fc4", (c) =>
    bar(40, 40, 57, 57, 8, "#b9824c") + C(26, 26, 18, GLASS, 'stroke="none"') + ring(26, 26, 18, 5, c.m) + N(Pa("M14 24q2-8 10-10", "none", 'stroke="#fff" stroke-width="3" stroke-linecap="round"'))),

  ic("thermometer", "science", "temperature hot cold weather measure", "#d0473a", (c) =>
    R(25, 5, 14, 40, 7, "#fff") + C(32, 49, 10, c.m) + R(30, 16, 4, 32, c.m, 0, 'stroke="none"') + Ln("M42 14h6M42 22h6M42 30h6", INK, 2)),

  ic("magnet", "science", "magnetic attract force physics", "#d0473a", (c) =>
    Ln("M15 14V34a17 17 0 0 0 34 0V14", INK, 18, 'stroke-linecap="butt"') + Ln("M15 14V34a17 17 0 0 0 34 0V14", c.m, 14, 'stroke-linecap="butt"') +
    R(8, 8, 14, 10, "#cbd5e1") + R(42, 8, 14, 10, "#cbd5e1")),

  ic("balance-scale", "science", "weigh mass compare balance fair", "#f2c335", (c) =>
    R(30, 10, 4, 42, "#7a5236") + R(18, 52, 28, 6, 2, "#7a5236") + Ln("M8 16H56", INK, 4) + C(32, 10, 4, c.m) + Ln("M10 16l-5 20M10 16l11 20M54 16l-11 20M54 16l5 20", INK, 2) + Pa("M3 36h20a10 8 0 0 1-20 0Z", c.m) + Pa("M41 36h20a10 8 0 0 1-20 0Z", c.m)),

  ic("microscope", "science", "lab view cells biology magnify", "#4a5568", (c) =>
    R(10, 52, 38, 7, 2, c.m) + Ln("M40 50Q58 38 46 18", INK, 10) + Ln("M40 50Q58 38 46 18", GREY, 6) + R(12, 38, 22, 4, 1, GREY) + bar(20, 6, 32, 30, 10, c.m) + bar(18, 4, 22, 10, 6, "#cbd5e1")),

  ic("cell", "science", "biology nucleus living organism", "#7b5aa6", (c) =>
    E(32, 32, 28, 24, "#d8efd0") + C(28, 30, 10, c.m) + N(C(28, 30, 4, "#4a3a78")) + E(46, 22, 4, 2.6, "#f2c335") + E(48, 42, 5, 3, "#ea8a2b") + E(16, 44, 4, 2.6, "#ea8a2b") + E(18, 18, 4.5, 2.6, "#f2c335") + Ln("M38 46q4 3 8 0", INK, 2)),

  ic("atom", "science", "physics chemistry electron proton nucleus", "#3b7dc4", (c) =>
    [0, 60, 120].map((a) => E(32, 32, 27, 10, "none", `stroke="${c.m}" stroke-width="3" transform="rotate(${a} 32 32)"`)).join("") + C(32, 32, 6, "#d0473a") + C(59, 32, 3.5, c.m) + C(18.5, 8.6, 3.5, c.m) + C(18.5, 55.4, 3.5, c.m)),

  ic("telescope", "science", "stars astronomy space look sky", "#3b7dc4", (c) =>
    Ln("M30 34L18 58M36 34l10 24M33 34V58", INK, 3.5) + T(30, 26, R(-24, -7, 40, 14, 3, c.m) + R(16, -5, 14, 10, 2, GREY) + R(-26, -9, 6, 18, 2, GREY), 1, -22)),

  ic("lightbulb", "science", "idea energy electricity bright think", "#f2c335", (c) =>
    Pa("M32 4a19 19 0 0 0-10 35q3 3 3 8h14q0-5 3-8A19 19 0 0 0 32 4Z", "#fbe9a0") + R(25, 47, 14, 6, 2, GREY) + R(27, 53, 10, 6, 2, "#6b7683") + Ln("M26 30l6 6 6-6M32 36V47", c.m, 3) + N(Pa("M20 20q2-8 9-10", "none", 'stroke="#fff" stroke-width="3" stroke-linecap="round"'))),

  ic("battery", "science", "electricity power circuit energy", "#4f9d5d", (c) =>
    R(5, 20, 48, 26, 4, "#4a5568") + R(53, 28, 6, 10, 2, "#4a5568") + R(9, 24, 26, 18, 2, c.m) + Ln("M44 33h6M47 30v6", "#fff", 2.5)),

  ic("gear", "science", "machine engineering mechanism tool", "#8d9aa8", (c) =>
    T(32, 32, [0, 45, 90, 135].map((a) => R(-5, -29, 10, 58, 2, c.m, `transform="rotate(${a})"`)).join("") + C(0, 0, 21, c.m) + C(0, 0, 8, "#fff"))),

  ic("dna", "science", "genetics helix heredity biology", "#7b5aa6", (c) =>
    Ln("M20 7h24M24 14h16M24 24h16M20 32h24M24 40h16M24 50h16M20 57h24", INK, 3) +
    Ln("M20 4C20 18 44 20 44 32S20 46 20 60", INK, 9) + Ln("M20 4C20 18 44 20 44 32S20 46 20 60", c.m, 5) +
    Ln("M44 4C44 18 20 20 20 32S44 46 44 60", INK, 9) + Ln("M44 4C44 18 20 20 20 32S44 46 44 60", "#3b8fc4", 5)),

  ic("rocket", "science", "space launch flight astronomy", "#d0473a", (c) =>
    T(32, 32, Pg([[-7, 8], [-17, 20], [-7, 18]], c.m) + Pg([[7, 8], [17, 20], [7, 18]], c.m) + Pg([[-5, 20], [5, 20], [0, 33]], "#f2c335") + Pa("M0-30Q12-14 9 10V20H-9V10Q-12-14 0-30Z", "#fff") + C(0, -8, 5, "#3b8fc4") + Pa("M0-30Q8-22 8-14H-8Q-8-22 0-30Z", c.m), 1, 45)),

  ic("planet", "science", "saturn space solar system astronomy", "#ea8a2b", (c) =>
    E(32, 32, 29, 8, "none", 'stroke="#f2c335" stroke-width="5" transform="rotate(-20 32 32)"') + C(32, 32, 16, c.m) + N(Pa("M22 24q4-6 10-6", "none", 'stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"')) +
    Pa("M3 32A29 8 0 0 0 61 32", "none", 'stroke="#f2c335" stroke-width="5" transform="rotate(-20 32 32)"')),
];
