import { C, INK, ic, Ln, N, Pa, Pg, P, rays, star5, shade } from "./dsl.js";

const CLOUD = "#e4eef6";
// Cloud outline in a 64 box; (dx, dy, s) place and scale it so rain/snow/storm icons reuse one shape.
const cloud = (fill = CLOUD, dx = 0, dy = 0, s = 1) =>
  `<g transform="translate(${dx} ${dy}) scale(${s})">${Pa("M16 46a10 10 0 0 1-1-19.9 14 14 0 0 1 26.5-3.6A11 11 0 0 1 49.5 46Z", fill)}</g>`;
const drop = (x, y, s = 1, fill = "#3b8fc4") =>
  `<g transform="translate(${x} ${y}) scale(${s})">${Pa("M0-8Q-6 0-6 3a6 6 0 0 0 12 0Q6 0 0-8Z", fill)}</g>`;
const bolt = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})">${Pg(
    [
      [2, 0],
      [-8, 14],
      [-1, 14],
      [-4, 26],
      [9, 8],
      [2, 8],
      [6, 0],
    ],
    "#f2c335",
  )}</g>`;

// prettier-ignore
export default [
  ic("sun", "weather", "sunny day warm light hot summer", "#f2c335", (c) =>
    rays(32, 32, 16, 28, 12, P.orange) + C(32, 32, 15, c.m) + N(C(27, 27, 4, "#fff6cf"))),

  ic("cloud", "weather", "cloudy sky overcast", CLOUD, (c) => cloud(c.m, 0, 4, 1.05)),

  ic("partly-cloudy", "weather", "sun cloud mild fair", "#f2c335", (c) =>
    rays(24, 24, 13, 23, 8, P.orange) + C(24, 24, 11, c.m) + cloud(CLOUD, 8, 10, 0.95)),

  ic("rain", "weather", "rainy shower storm wet precipitation", "#3b8fc4", (c) =>
    cloud("#c8d6e2", 0, -6, 1) + drop(20, 50, 1, c.m) + drop(32, 56, 1, c.m) + drop(44, 50, 1, c.m)),

  ic("storm", "weather", "thunder lightning stormy weather", "#7d8a96", (c) =>
    cloud(c.m, 0, -8, 1) + bolt(32, 36, 1)),

  ic("snow", "weather", "snowy winter cold flakes", "#dbe8f2", (c) =>
    cloud(c.m, 0, -6, 1) + [[18, 50], [32, 56], [46, 50], [25, 60], [39, 60]].map(([x, y]) => N(C(x, y, 3, "#7fb0d8"))).join("")),

  ic("wind", "weather", "windy breeze blow air gust", "#3b8fc4", (c) =>
    Ln("M6 22h30a8 8 0 1 0-8-8", INK, 8) + Ln("M6 22h30a8 8 0 1 0-8-8", c.m, 4) + Ln("M6 34h44a8 8 0 1 1-8 8", INK, 8) + Ln("M6 34h44a8 8 0 1 1-8 8", c.l, 4) + Ln("M10 46h18a6 6 0 1 1-6 6", INK, 8) + Ln("M10 46h18a6 6 0 1 1-6 6", c.m, 4)),

  ic("moon", "weather", "night crescent sky lunar", "#f2c335", (c) =>
    Pa("M40 6A26 26 0 1 0 58 40 20 20 0 0 1 40 6Z", c.m) + N(Pg(star5(50, 14, 5, 2.2), "#f2c335")) + N(Pg(star5(56, 28, 3.4, 1.5), "#f2c335"))),

  ic("star", "weather", "night sky shine favorite", "#f2c335", (c) =>
    Pg(star5(32, 34, 28, 12), c.m) + N(Pg(star5(32, 34, 12, 5), c.l))),

  ic("rainbow", "weather", "colors sky arc spectrum", "#d0473a", (c) =>
    ["#d0473a", "#ea8a2b", "#f2c335", "#4f9d5d", "#3b7dc4", "#6b5aa6"].map((col, i) => Ln(`M${6 + i * 4.4} 50A${26 - i * 4.4} ${26 - i * 4.4} 0 0 1 ${58 - i * 4.4} 50`, col, 5, 'stroke-linecap="butt"')).join("") +
    Ln("M4 50h8", INK, 0.1) + cloud("#fff", -10, 20, 0.5) + cloud("#fff", 38, 20, 0.5)),

  ic("snowflake", "weather", "ice winter frozen crystal", "#8fb8d8", (c) =>
    [0, 60, 120].map((a) => Ln("M32 4V60", INK, 7, `transform="rotate(${a} 32 32)"`)).join("") +
    [0, 60, 120].map((a) => Ln("M32 4V60M26 12l6 6 6-6M26 52l6-6 6 6", c.m, 3.5, `transform="rotate(${a} 32 32)"`)).join("")),

  ic("umbrella", "weather", "rain rainy wet shelter", "#d0473a", (c) =>
    Pa("M4 34A28 26 0 0 1 60 34Q52 28 46 34 40 28 32 34 24 28 18 34 12 28 4 34Z", c.m) + Ln("M32 8V4M32 34V52a5 5 0 0 1-10 0", INK, 3) + Ln("M32 34Q28 18 18 12M32 34Q36 18 46 12", shade(c.m, 0.35), 2)),

  ic("drop", "weather", "water raindrop liquid", "#3b8fc4", (c) =>
    Pa("M32 4Q12 30 12 40a20 20 0 0 0 40 0Q52 30 32 4Z", c.m) + Ln("M20 42q0 8 8 11", "#fff", 3)),

  ic("earth", "weather", "planet world globe space", "#3b8fc4", (c) =>
    C(32, 32, 26, c.m) + Pa("M18 16q8-4 14 0-2 6-8 6-2 6-8 2Z", "#5aa84e") + Pa("M36 30q8-4 14 2 0 10-6 14-4 6-6 0 0-8-4-10Z", "#5aa84e") + Pa("M16 38q6-2 8 4-2 6-6 4Z", "#5aa84e")),
];
