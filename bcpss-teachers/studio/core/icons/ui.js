import { C, CLOTH, E, INK, Ln, N, Pa, Pg, R, bar, dot, ic, ring, star5 } from "./dsl.js";

// prettier-ignore
export default [
  ic("speech-bubble", "ui", "talk say discuss conversation speak chat", "#3b7dc4", (c) =>
    Pa("M8 10H56Q60 10 60 14V40Q60 44 56 44H30L16 56V44H8Q4 44 4 40V14Q4 10 8 10Z", c.m) + Ln("M14 21H50M14 29H50M14 37H36", "#ffffff", 3)),

  ic("thought-bubble", "ui", "think idea wonder imagine", "#6b7f3a", (c) =>
    Pa("M16 38Q4 36 6 24Q8 14 20 16Q24 4 38 8Q46 2 54 12Q64 16 58 28Q62 38 50 40Q42 46 32 40Q24 44 16 38Z", "#ffffff") + C(20, 50, 4.5, "#ffffff") + C(11, 59, 3, "#ffffff") + Ln("M24 24h16M24 31h22", c.m, 3)),

  ic("speaker", "ui", "sound listen audio volume hear", "#3b7dc4", (c) =>
    Pa("M6 24H18L32 12V52L18 40H6Z", c.m) + Ln("M40 22Q48 32 40 42M46 14Q60 32 46 50", INK, 3)),

  ic("flag", "ui", "mark goal country position", "#d0473a", (c) =>
    R(12, 4, 4, 56, 1.5, "#b9824c") + Pa("M16 8H54L46 20L54 32H16Z", c.m)),

  ic("calendar", "ui", "date day month schedule time", "#d0473a", (c) =>
    R(6, 10, 52, 48, 5, "#ffffff") + Pa("M6 15Q6 10 11 10H53Q58 10 58 15V24H6Z", c.m) + R(16, 4, 5, 12, 2, INK) + R(43, 4, 5, 12, 2, INK) +
    [0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((k) => R(11 + k * 9.4, 29 + r * 7.2, 6, 4.5, 1, r === 1 && k === 2 ? "#d0473a" : "#cbd5e1", 'stroke="none"')).join("")).join("")),

  ic("map-pin", "ui", "location place where here find", "#d0473a", (c) =>
    Pa("M32 60Q10 36 10 24Q10 6 32 6T54 24Q54 36 32 60Z", c.m) + C(32, 24, 8.5, "#ffffff")),

  ic("envelope", "ui", "letter mail message note send", "#3b7dc4", (c) =>
    R(4, 14, 56, 38, 4, "#ffffff") + Ln("M6 17L32 36L58 17", INK, 2.5) + Ln("M6 50L24 31M58 50L40 31", INK, 1.8)),

  ic("hourglass", "ui", "wait time sand patience", "#f2c335", (c) =>
    R(10, 4, 44, 6, 3, "#b9824c") + R(10, 54, 44, 6, 3, "#b9824c") + Pa("M16 10H48Q48 28 36 32Q48 36 48 54H16Q16 36 28 32Q16 28 16 10Z", "#e8f4f6") + Pa("M20 14H44Q43 24 34 28H30Q21 24 20 14Z", c.m) + Pa("M24 52Q26 42 32 40Q38 42 40 52Z", c.m)),
];
