import { INK, Ln, Pa, Pg, T, ic } from "./dsl.js";

// Right-pointing block arrow centred on the origin; T rotates it.
const block = (fill) =>
  Pg(
    [
      [-26, -9],
      [4, -9],
      [4, -20],
      [27, 0],
      [4, 20],
      [4, 9],
      [-26, 9],
    ],
    fill,
  );
const thick = (d, w, fill) =>
  Ln(d, INK, w + 4, 'stroke-linecap="butt"') + Ln(d, fill, w, 'stroke-linecap="butt"');

// prettier-ignore
export default [
  ic("arrow-right", "arrows", "next forward direction go", "#3b7dc4", (c) => T(32, 32, block(c.m), 1, 0)),
  ic("arrow-left", "arrows", "back previous direction", "#3b7dc4", (c) => T(32, 32, block(c.m), 1, 180)),
  ic("arrow-up", "arrows", "increase rise up direction", "#4f9d5d", (c) => T(32, 32, block(c.m), 1, -90)),
  ic("arrow-down", "arrows", "decrease fall down direction", "#d0473a", (c) => T(32, 32, block(c.m), 1, 90)),

  ic("arrow-both", "arrows", "left right two-way exchange", "#6b7f3a", (c) =>
    Pg([[2, 32], [19, 15], [19, 25], [45, 25], [45, 15], [62, 32], [45, 49], [45, 39], [19, 39], [19, 49]], c.m)),

  ic("arrow-turn", "arrows", "u-turn curve return bend", "#ea8a2b", (c) =>
    thick("M14 54V28Q14 14 28 14H40", 11, c.m) + Pg([[38, 3], [58, 14], [38, 25]], c.m)),

  ic("arrows-cycle", "arrows", "repeat cycle loop again recycle", "#3fa79a", (c) =>
    thick("M12 30A21 21 0 0 1 46 14", 8, c.m) + Pg([[40, 4], [56, 16], [38, 24]], c.m) +
    thick("M52 34A21 21 0 0 1 18 50", 8, c.d) + Pg([[24, 60], [8, 48], [26, 40]], c.d)),

  ic("plus", "arrows", "add more positive increase", "#4f9d5d", (c) =>
    Pg([[24, 6], [40, 6], [40, 24], [58, 24], [58, 40], [40, 40], [40, 58], [24, 58], [24, 40], [6, 40], [6, 24], [24, 24]], c.m)),

  ic("minus", "arrows", "subtract less negative decrease", "#d0473a", (c) =>
    Pg([[6, 24], [58, 24], [58, 40], [6, 40]], c.m)),

  ic("check", "arrows", "correct yes done tick right", "#4f9d5d", (c) =>
    Pa("M6 34L16 24L26 34L48 10L58 20L26 54Z", c.m)),

  ic("cross", "arrows", "wrong no incorrect close x", "#d0473a", (c) =>
    Pg([[14, 6], [32, 24], [50, 6], [58, 14], [40, 32], [58, 50], [50, 58], [32, 40], [14, 58], [6, 50], [24, 32], [6, 14]], c.m)),

  ic("question", "arrows", "ask wonder why how what help", "#3b7dc4", (c) =>
    Pa("M18 22Q18 6 32 6T46 21Q46 30 36 36Q32 39 32 44V46H22V42Q22 34 30 29Q35 26 35 21Q35 16 32 16T26 22Z", c.m) + Pa("M21 52H33V62H21Z", c.m, 'transform="translate(2 -1)"')),
];
