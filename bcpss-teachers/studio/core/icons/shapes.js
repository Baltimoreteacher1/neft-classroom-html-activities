import { C, E, Ln, N, Pa, Pg, R, ic, light, ngon, shade } from "./dsl.js";

const shine = (d, w = 3) => Ln(d, "#ffffff", w, 'opacity=".7" stroke-linecap="round"');

// prettier-ignore
export default [
  ic("circle", "shapes", "round geometry flat figure two-dimensional", "#3b7dc4", (c) =>
    C(32, 32, 25, c.m) + shine("M17 26a16 16 0 0 1 12-11")),

  ic("square", "shapes", "four equal sides geometry flat figure", "#d0473a", (c) =>
    R(9, 9, 46, 46, 3, c.m) + shine("M15 22V15h7")),

  ic("triangle", "shapes", "three sides geometry flat figure", "#4f9d5d", (c) =>
    Pg([[32, 7], [59, 55], [5, 55]], c.m) + shine("M30 18L14 46")),

  ic("rectangle", "shapes", "four sides geometry flat figure length width", "#ea8a2b", (c) =>
    R(4, 15, 56, 34, 3, c.m) + shine("M10 28v-7h8")),

  ic("pentagon", "shapes", "five sides geometry flat figure", "#6b7f3a", (c) =>
    Pg(ngon(32, 35, 27, 5), c.m)),

  ic("hexagon", "shapes", "six sides geometry flat figure pattern block", "#f2c335", (c) =>
    Pg(ngon(32, 32, 27, 6, 0), c.m)),

  ic("octagon", "shapes", "eight sides geometry flat figure stop", "#c8553d", (c) =>
    Pg(ngon(32, 32, 27, 8, -22.5), c.m)),

  ic("diamond", "shapes", "rhombus geometry flat figure four sides", "#3fa79a", (c) =>
    Pg([[32, 5], [58, 32], [32, 59], [6, 32]], c.m) + shine("M32 14L16 32")),

  ic("oval", "shapes", "ellipse geometry flat figure", "#a24f72", (c) =>
    E(32, 32, 28, 19, c.m) + shine("M14 28a17 11 0 0 1 12-9")),

  ic("trapezoid", "shapes", "geometry flat figure one pair parallel sides", "#3b7dc4", (c) =>
    Pg([[17, 14], [47, 14], [60, 50], [4, 50]], c.m)),

  ic("parallelogram", "shapes", "geometry flat figure slanted sides area", "#ea8a2b", (c) =>
    Pg([[18, 14], [60, 14], [46, 50], [4, 50]], c.m)),

  ic("cube", "shapes", "solid three-dimensional box faces edges vertices", "#4f9d5d", (c) =>
    Pg([[32, 5], [57, 18], [32, 31], [7, 18]], light(c.m, 0.35)) + Pg([[7, 18], [32, 31], [32, 59], [7, 46]], c.m) + Pg([[57, 18], [32, 31], [32, 59], [57, 46]], c.d)),

  ic("cylinder", "shapes", "solid three-dimensional can circular base", "#d0473a", (c) =>
    Pa("M10 16v32q0 9 22 9t22-9V16Z", c.m) + E(32, 16, 22, 9, light(c.m, 0.35)) + shine("M15 26v18", 3)),

  ic("cone", "shapes", "solid three-dimensional point circular base", "#ea8a2b", (c) =>
    Pa("M32 5L55 47q0 10-23 10T9 47Z", c.m) + Pa("M9 47q0 8 23 8t23-8q0-8-23-8T9 47Z", c.d) + shine("M30 16L18 42")),

  ic("sphere", "shapes", "solid three-dimensional ball round", "#3b7dc4", (c) =>
    C(32, 32, 25, c.m) + N(E(23, 22, 9, 6, "#ffffff", 'opacity=".55" transform="rotate(-35 23 22)"')) + Ln("M10 38a25 10 0 0 0 44 0", c.d, 1.5, 'opacity=".6"')),

  ic("pyramid", "shapes", "solid three-dimensional square base triangular faces", "#f2c335", (c) =>
    Pg([[32, 6], [58, 46], [32, 58], [6, 46]], c.m) + Pg([[32, 6], [58, 46], [32, 58]], c.d) + Ln("M32 6V58", "#00000033", 1.5)),

  ic("rectangular-prism", "shapes", "solid three-dimensional box length width height volume", "#6b7f3a", (c) =>
    Pg([[16, 12], [58, 12], [48, 24], [6, 24]], light(c.m, 0.35)) + R(6, 24, 42, 32, c.m) + Pg([[58, 12], [58, 44], [48, 56], [48, 24]], c.d)),
];
