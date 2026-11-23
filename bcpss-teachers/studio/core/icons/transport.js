import { C, E, INK, Ln, N, Pa, Pg, R, T, bar, dot, ic, ring } from "./dsl.js";

const GLASS = "#cfe8f2";
const DARK = "#3a4552";
const wheel = (x, y, r = 6.5) => C(x, y, r, DARK) + N(C(x, y, r * 0.4, "#cbd5e1"));

// prettier-ignore
export default [
  ic("sailboat", "transport", "boat sail water wind harbor", "#3b7dc4", (c) =>
    Pg([[32, 6], [32, 40], [10, 40]], "#ffffff") + Pg([[34, 14], [34, 40], [52, 40]], c.m) + Ln("M32 4V46", INK, 2.5) + Pa("M6 44H58L50 56H14Z", "#b5583f") + Ln("M4 60q7-5 14 0t14 0 14 0 14 0", "#4c9fc4", 2.5)),

  ic("ship", "transport", "cargo container harbor port freight", "#d0473a", (c) =>
    R(14, 22, 10, 8, 1, "#3b7dc4") + R(24, 22, 10, 8, 1, "#f2c335") + R(34, 22, 10, 8, 1, "#4f9d5d") + R(8, 14, 12, 8, 1, "#ea8a2b") + R(44, 14, 10, 16, 2, "#fff") + R(46, 18, 6, 4, 1, GLASS) +
    Pa("M3 32H61L52 52H13Z", c.m) + Ln("M4 59q7-5 14 0t14 0 14 0 14 0", "#4c9fc4", 2.5)),

  ic("canoe", "transport", "paddle boat river lake", "#ea8a2b", (c) =>
    bar(18, 6, 42, 38, 4, "#b9824c") + Pa("M3 32H61Q56 48 32 48T3 32Z", c.m) + Ln("M8 36H56", c.d, 2) + Ln("M4 58q7-5 14 0t14 0 14 0 14 0", "#4c9fc4", 2.5)),

  ic("helicopter", "transport", "fly rescue blades air", "#d0473a", (c) =>
    Ln("M6 12H50", INK, 3) + Ln("M28 12V20", INK, 3) + Pa("M12 36Q12 20 30 20Q46 20 46 34V42H12Z", c.m) + Pa("M46 30L60 26V34L46 38Z", c.d) + Pa("M18 28H32V36H18Z", GLASS) + Ln("M10 52H46M18 42V52M38 42V52", INK, 3)),

  ic("truck", "transport", "delivery cargo haul freight", "#3b7dc4", (c) =>
    R(3, 14, 36, 34, 3, c.m) + Pa("M39 24H52L61 34V48H39Z", c.d) + Pa("M43 28H51L56 34H43Z", GLASS) + wheel(16, 50, 7.5) + wheel(50, 50, 7.5)),

  ic("tractor", "transport", "farm field plow", "#4f9d5d", (c) =>
    R(34, 8, 3, 12, 1, INK) + Pa("M30 18H48L50 32H30Z", c.d) + Pa("M10 24H30V42H8V30Q8 24 10 24Z", c.m) + R(30, 30, 24, 14, 3, c.m) + C(18, 46, 13, DARK) + N(C(18, 46, 6, "#ea8a2b")) + C(50, 50, 8, DARK) + N(C(50, 50, 3.5, "#ea8a2b"))),

  ic("motorcycle", "transport", "ride engine two wheels", "#d0473a", (c) =>
    ring(14, 44, 10, 4, DARK) + ring(50, 44, 10, 4, DARK) + Pa("M14 44L26 28H40L50 44L34 44L28 38Z", c.m) + Ln("M40 28L46 18H54", INK, 3.5) + R(22, 24, 14, 6, 3, INK)),

  ic("scooter", "transport", "kick ride push", "#3fa79a", (c) =>
    ring(12, 50, 7, 3, DARK) + ring(52, 50, 7, 3, DARK) + R(10, 40, 40, 5, 2.5, c.m) + Ln("M50 44L46 8H38", INK, 3.5) + Ln("M50 44L52 50", INK, 3)),

  ic("hot-air-balloon", "transport", "fly float sky basket", "#ea8a2b", (c) =>
    Pa("M32 4Q58 4 56 26Q54 38 40 44H24Q10 38 8 26Q6 4 32 4Z", c.m) + Pa("M32 4Q20 14 24 44H40Q44 14 32 4Z", "#f2c335") + Ln("M24 44L26 52M40 44L38 52", INK, 2) + R(24, 52, 16, 9, 2, "#b9824c")),

  ic("skateboard", "transport", "board ride trick wheels", "#f2c335", (c) =>
    Pa("M4 24Q4 36 12 36H52Q60 36 60 24L56 32H8Z", c.m) + wheel(18, 44, 5.5) + wheel(46, 44, 5.5) + Ln("M18 36V40M46 36V40", INK, 2.5)),
];
