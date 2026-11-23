import { C, E, INK, Ln, N, Pa, Pg, R, dot, ic } from "./dsl.js";

const GLASS = "#cfe8f2";

// prettier-ignore
export default [
  ic("crab", "baltimore", "blue crab maryland chesapeake bay seafood claws", "#3b7dc4", (c) =>
    Ln("M20 36L8 30M20 42L6 42M44 36L56 30M44 42L58 42", INK, 3) +
    Pa("M18 28Q10 26 8 14Q8 6 16 6Q22 10 20 16Q24 18 26 24Z", "#d0473a") + Pa("M46 28Q54 26 56 14Q56 6 48 6Q42 10 44 16Q40 18 38 24Z", "#d0473a") +
    E(32, 38, 21, 15, c.m) + Ln("M20 30Q32 22 44 30", c.d, 2) + dot(27, 25, 2.4) + dot(37, 25, 2.4) + Ln("M27 25V21M37 25V21", INK, 1.8)),

  ic("row-house", "baltimore", "rowhouse brick home city street baltimore", "#b5583f", (c) =>
    R(6, 14, 22, 44, 1, c.m) + R(28, 14, 22, 44, 1, "#c8695a") + R(50, 14, 10, 44, 1, c.d) +
    R(10, 20, 8, 10, 1, GLASS) + R(10, 36, 8, 10, 1, GLASS) + R(32, 20, 8, 10, 1, GLASS) + R(32, 36, 8, 10, 1, GLASS) + R(18, 46, 8, 12, 1, "#3a4552") + R(40, 46, 8, 12, 1, "#3a4552") +
    Pg([[4, 14], [17, 6], [30, 14]], "#6b4a3a") + Pg([[26, 14], [39, 6], [52, 14]], "#6b4a3a") + Ln("M4 58H60", INK, 2.5)),

  ic("lighthouse", "baltimore", "harbor bay light beacon coast shore", "#ffffff", (c) =>
    Pa("M22 58L26 22H38L42 58Z", c.m) + Pa("M24 38H40L41 46H23Z", "#d0473a") + Pa("M23 54H41L42 58H22Z", "#d0473a") + R(23, 14, 18, 9, 1, "#3a4552") + R(26, 5, 12, 10, 2, "#f2c335") + Pa("M23 5L32 -1L41 5Z", "#d0473a", 'transform="translate(0 3)"') +
    Ln("M20 9L8 6M20 13L8 14M44 9L56 6M44 13L56 14", "#f2c335", 2.5) + Ln("M4 60q7-5 14 0t14 0 14 0 14 0", "#4c9fc4", 2.5)),
];
