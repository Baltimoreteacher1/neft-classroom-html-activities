import { C, E, INK, Ln, N, Pa, Pg, R, T, bar, dot, ic, ngon, ring } from "./dsl.js";

const STEEL = "#cbd5e1";
const WOOD = "#b9824c";

// prettier-ignore
export default [
  ic("soccer-ball", "sports", "football game play kick team", "#ffffff", (c) =>
    C(32, 32, 26, c.m) + Pg(ngon(32, 32, 8, 5), INK) + Ln("M32 24V8M39.6 29.5L54 25M36.7 38.5L45 51M27.3 38.5L19 51M24.4 29.5L10 25", INK, 2)),

  ic("basketball", "sports", "hoop game play team", "#e8954a", (c) =>
    C(32, 32, 26, c.m) + Ln("M6 32H58M32 6V58M13 14Q24 32 13 50M51 14Q40 32 51 50", INK, 2)),

  ic("baseball", "sports", "bat game play team", "#ffffff", (c) =>
    C(32, 32, 26, c.m) + Ln("M16 12Q26 32 16 52M48 12Q38 32 48 52", "#d0473a", 2) + Ln("M18 20l5 1M20 28l5 0M20 36l5 0M18 44l5-1M46 20l-5 1M44 28l-5 0M44 36l-5 0M46 44l-5-1", "#d0473a", 1.8)),

  ic("football", "sports", "game play team touchdown", "#b5583f", (c) =>
    T(32, 32, E(0, 0, 28, 16, c.m) + Ln("M-12 0H12M-6-4v8M0-4v8M6-4v8", "#ffffff", 2) + Ln("M-22-8Q-18 0-22 8M22-8Q18 0 22 8", "#ffffff", 2.5), 1, -35)),

  ic("tennis-racket", "sports", "racquet game play net", "#4f9d5d", (c) =>
    T(32, 32, bar(0, 6, 0, 30, 5, WOOD) + E(0, -12, 15, 19, "#ffffff", `stroke="${c.m}" stroke-width="5"`) + Ln("M-14-12H14M-10-22H10M-10-2H10M0-30V6", INK, 1.2, 'opacity=".5"'), 1, 35)),

  ic("medal", "sports", "award winner prize first place", "#f2c335", (c) =>
    Pg([[16, 4], [30, 4], [34, 26], [22, 30]], "#3b7dc4") + Pg([[48, 4], [34, 4], [30, 26], [42, 30]], "#d0473a") + C(32, 42, 17, c.m) + C(32, 42, 11, c.l) + Pg(ngon(32, 42, 7, 5), c.m)),

  ic("guitar", "arts", "music instrument strings play", "#b5583f", (c) =>
    T(32, 32, bar(0, -30, 0, -6, 6, WOOD) + R(-5, -34, 10, 8, 2, INK) + Pa("M0 -8Q12-8 12 6Q12 12 16 18Q18 30 0 30Q-18 30-16 18Q-12 12-12 6Q-12-8 0-8Z", c.m) + C(0, 12, 5, INK) + R(-8, 22, 16, 3, 1, INK), 1, 38)),

  ic("piano-keys", "arts", "music instrument keyboard play notes", "#ffffff", (c) =>
    R(4, 12, 56, 40, 3, c.m) + Ln("M18 12V52M32 12V52M46 12V52", INK, 2) + R(14, 12, 8, 24, 1.5, INK) + R(28, 12, 8, 24, 1.5, INK) + R(42, 12, 8, 24, 1.5, INK)),

  ic("drum", "arts", "music instrument beat rhythm sticks", "#d0473a", (c) =>
    Pa("M8 22V44Q8 54 32 54T56 44V22Z", c.m) + E(32, 22, 24, 8, "#fff") + Ln("M12 28L22 50M24 31L32 53M40 31L32 53M52 28L42 50", "#fff", 2) + bar(18, 4, 34, 18, 3.5, WOOD) + bar(46, 4, 30, 18, 3.5, WOOD)),

  ic("microphone", "arts", "speak sing voice record sound", "#3b7dc4", (c) =>
    R(22, 4, 20, 34, 10, c.m) + Ln("M22 16h20M22 24h20", c.d, 2) + Ln("M14 28Q14 46 32 46T50 28", INK, 3) + Ln("M32 46V56M22 58H42", INK, 3.5)),

  ic("theater-mask", "arts", "drama acting play stage perform", "#f2c335", (c) =>
    Pa("M6 10H40V34Q40 52 23 54Q6 52 6 34Z", c.m) + Pa("M42 20H58V38Q58 52 50 56Q42 58 36 48", c.d) + Ln("M13 24q4-3 8 0M26 24q4-3 8 0", INK, 2.4) + Ln("M13 38q10 10 20 0", INK, 2.4) + Ln("M44 32q3-2 5 0M52 32q3-2 4 0M44 46q6-5 12 0", INK, 2)),

  ic("palette", "arts", "paint colors art mix", "#e8c987", (c) =>
    Pa("M32 6C14 6 4 18 4 32S16 58 30 58C38 58 38 50 33 46C28 42 32 36 40 36H50C58 36 60 30 60 28C60 14 48 6 32 6Z", c.m) + C(18, 28, 5, "#d0473a") + C(30, 18, 5, "#f2c335") + C(44, 20, 5, "#4f9d5d") + C(50, 30, 4.5, "#3b7dc4")),

  ic("camera", "arts", "photo picture snap film", "#3a4552", (c) =>
    R(4, 18, 56, 36, 6, c.m) + R(20, 10, 20, 10, 3, c.m) + C(32, 36, 13, "#fff") + C(32, 36, 8, "#3b7dc4") + dot(46, 26, 2.4, "#f2c335")),

  ic("headphones", "arts", "listen music audio sound", "#3b7dc4", (c) =>
    Ln("M10 38V32Q10 8 32 8T54 32V38", INK, 7) + Ln("M10 38V32Q10 8 32 8T54 32V38", STEEL, 3) + R(5, 34, 14, 22, 6, c.m) + R(45, 34, 14, 22, 6, c.m)),
];
