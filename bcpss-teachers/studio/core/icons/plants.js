import { C, E, ic, Ln, N, Pa, Pg, R, dot, light } from "./dsl.js";

const LEAF = "#5a9a52";
const SOIL = "#8b5e3c";
const petals = (cx, cy, n, d, rx, ry, fill, rot0 = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = rot0 + (360 / n) * i;
    return E(cx, cy - d, rx, ry, fill, `transform="rotate(${a} ${cx} ${cy})"`);
  }).join("");

// prettier-ignore
export default [
  ic("seed", "plants", "bean germinate plant start", "#b07a43", (c) =>
    E(32, 34, 14, 21, c.m, 'transform="rotate(25 32 34)"') + Ln("M24 22q-3 8 0 16", c.l, 3) + Ln("M36 20q8 2 12 8", c.d, 2)),

  ic("sprout", "plants", "seedling grow growth germinate", "#5a9a52", (c) =>
    Pa("M5 56q27-18 54 0Z", SOIL) + R(30, 30, 4, 22, c.d) + Pa("M31 36q-2-16-20-17 0 16 20 17Z", c.m) + Pa("M33 30q2-14 20-14 0 14-20 14Z", c.l)),

  ic("flower", "plants", "bloom petals garden blossom", "#e58fb0", (c) =>
    R(30, 30, 4, 28, LEAF) + Pa("M32 48q-12-2-14-12 12 0 14 12Z", LEAF) + Pa("M32 42q10 0 14-10-10-2-14 10Z", LEAF) +
    petals(32, 22, 5, 10, 7.5, 8.5, c.m) + C(32, 22, 6.5, "#f2c335")),

  ic("sunflower", "plants", "seeds tall yellow garden", "#f2c335", (c) =>
    R(30, 34, 4, 26, LEAF) + Pa("M32 52q-14 0-18-12 14-2 18 12Z", LEAF) + petals(32, 22, 12, 13, 4.5, 8, c.m) + C(32, 22, 9.5, "#7a4a2a") +
    dot(29, 20, 1.2, "#e0c070") + dot(35, 20, 1.2, "#e0c070") + dot(32, 25, 1.2, "#e0c070")),

  ic("tree", "plants", "forest oak shade wood", "#4f9d5d", (c) =>
    Pa("M27 58l2-22h6l2 22Z", "#7a5236") + C(20, 30, 12, c.m) + C(44, 30, 12, c.m) + C(32, 20, 14, c.m) + C(32, 34, 13, c.m) +
    N(C(26, 16, 4, c.l)) + Ln("M32 44v-6M32 38l-5-4M32 40l5-4", "#5a3b26")),

  ic("pine-tree", "plants", "evergreen conifer fir christmas forest", "#2f7a55", (c) =>
    R(28, 50, 8, 10, "#7a5236") + Pg([[32, 4], [48, 24], [16, 24]], c.m) + Pg([[32, 14], [52, 38], [12, 38]], c.m) + Pg([[32, 26], [56, 52], [8, 52]], c.m)),

  ic("leaf", "plants", "foliage green photosynthesis autumn", "#5aa84e", (c) =>
    Pa("M10 52Q6 14 54 8Q60 52 14 56Z", c.m) + Ln("M12 54Q28 34 50 14", c.d) + Ln("M28 38l-2-14M38 28l-2-12M22 44l-10-6M32 34l12 2", c.d) + Ln("M10 54l-4 4")),

  ic("root", "plants", "roots underground soil plant parts", "#e8d3a8", (c) =>
    R(4, 34, 56, 24, SOIL) + R(30, 12, 4, 26, LEAF) + Pa("M31 20q-2-12-18-12 0 12 18 12Z", LEAF) + Pa("M33 16q2-10 16-10 0 10-16 10Z", light(LEAF, 0.3)) +
    Ln("M32 36v18M32 40q-10 2-14 10M32 44q10 2 14 10M32 38q-6 0-12 4M32 38q6 0 12 4", c.m, 3)),

  ic("cactus", "plants", "desert prickly succulent", "#4f9a55", (c) =>
    Pa("M26 54V18q0-8 6-8t6 8v36Z", c.m) + Pa("M26 40h-8q-4 0-4-4V26q0-4 4-4t4 4v6h4Z", c.m) + Pa("M38 34h8q4 0 4-4v-8q0-4-4-4t-4 4v4h-4Z", c.m) +
    Pa("M18 52h28l-3 8H21Z", "#c8553d") + Ln("M32 18v30M30 24h-3M36 32h3M30 40h-3", c.l, 2) + C(32, 8, 3, "#e58fb0")),

  ic("mushroom", "plants", "fungus forest toadstool fungi", "#d0473a", (c) =>
    Pa("M26 36h12l2 20H24Z", "#f4ead0") + Pa("M6 38Q6 8 32 8t26 30Z", c.m) + N(C(20, 22, 4.5, "#fff")) + N(C(36, 16, 4, "#fff")) + N(C(46, 28, 3.6, "#fff")) + N(C(30, 30, 2.8, "#fff"))),

  ic("acorn", "plants", "oak nut seed squirrel autumn", "#c08a4a", (c) =>
    Pa("M16 28q0 28 16 30 16-2 16-30Z", c.m) + Pa("M12 28q0-14 20-14t20 14Z", "#7a5236") + Ln("M32 14V8") + Ln("M20 22q4-4 8-4M36 18q6 0 10 4", "#a87c52", 2)),

  ic("clover", "plants", "shamrock luck green meadow", "#4f9d5d", (c) =>
    C(24, 22, 9, c.m) + C(40, 22, 9, c.m) + C(24, 36, 9, c.m) + C(40, 36, 9, c.m) + C(32, 29, 4, c.l) + Ln("M32 40q0 12 8 18", c.d, 3)),

  ic("grass", "plants", "meadow lawn blades field", "#6fb061", (c) =>
    Pa("M6 56Q10 30 16 18q2 18 6 38Z", c.m) + Pa("M20 56Q24 22 32 8q4 22 4 48Z", c.l) + Pa("M34 56q4-22 14-34 0 20 2 34Z", c.m) + Pa("M46 56q4-14 12-20 0 12-2 20Z", c.d) + R(4, 56, 56, 4, SOIL, 1.5)),
];
