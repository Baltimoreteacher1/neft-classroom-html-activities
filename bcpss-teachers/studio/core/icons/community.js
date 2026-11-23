import { C, E, INK, Ln, N, Pa, Pg, R, T, bar, dot, ic, ngon, ring } from "./dsl.js";

const WALL = "#f1e4cf";
const GLASS = "#cfe8f2";
const DARK = "#3a4552";
const wheel = (x, y, r = 6.5) => C(x, y, r, DARK) + N(C(x, y, r * 0.4, "#cbd5e1"));

// prettier-ignore
export default [
  ic("house", "community", "home family building live", "#c8553d", (c) =>
    R(41, 10, 7, 14, "#b5583f") + R(12, 28, 40, 30, WALL) + Pg([[5, 31], [32, 7], [59, 31]], c.m) + R(27, 41, 10, 17, "#0f766e") + R(16, 35, 8, 8, GLASS) + R(40, 35, 8, 8, GLASS)),

  ic("school", "community", "school building learn class education", "#b5583f", (c) =>
    R(10, 26, 44, 32, c.m) + R(24, 10, 16, 18, c.m) + Pg([[22, 11], [32, 3], [42, 11]], "#3a4552") + C(32, 19, 4.5, "#fff") + R(26, 44, 12, 14, "#f1e4cf") + R(14, 32, 7, 9, GLASS) + R(43, 32, 7, 9, GLASS) + R(14, 46, 7, 7, GLASS) + R(43, 46, 7, 7, GLASS) + Ln("M32 3V-1")),

  ic("bus", "community", "school bus transport ride yellow", "#f2c335", (c) =>
    R(3, 14, 58, 36, 6, c.m) + [8, 20, 32, 44].map((x) => R(x, 19, 9, 10, 1.5, GLASS)).join("") + Ln("M4 38H60", INK, 2) + R(52, 19, 6, 12, 1.5, GLASS) + wheel(17, 50, 7) + wheel(46, 50, 7) + dot(59, 40, 2.4, "#ea8a2b")),

  ic("car", "community", "vehicle drive auto transport", "#3b7dc4", (c) =>
    Pa("M3 42q0-8 8-9l8-14q2-4 8-4h12q6 0 8 4l7 11q10 1 10 12v3H3Z", c.m) + Pa("M21 21h9v12H16Zm13 0h8l6 12H34Z", GLASS) + wheel(18, 48, 7.5) + wheel(48, 48, 7.5) + dot(58, 40, 2.4, "#f2c335")),

  ic("store", "community", "shop market buy sell grocery", "#d0473a", (c) =>
    R(8, 28, 48, 30, WALL) + [0, 1, 2, 3, 4, 5].map((i) => Pg([[3 + i * 9.7, 12], [12.7 + i * 9.7, 12], [14 + i * 9.7, 28], [1.3 + i * 9.7, 28]], i % 2 ? "#fff" : c.m)).join("") + R(26, 38, 12, 20, "#3b7dc4") + R(12, 34, 10, 12, GLASS) + R(42, 34, 10, 12, GLASS)),

  ic("park", "community", "playground bench trees outdoor grass", "#4f9d5d", (c) =>
    R(4, 52, 56, 6, "#7fb069", 2) + R(29, 32, 6, 20, "#7a5236") + C(32, 22, 15, c.m) + C(21, 30, 9, c.m) + C(43, 30, 9, c.m) + R(8, 44, 18, 4, "#b9824c", 1.5) + R(10, 48, 3, 6, "#7a5236") + R(21, 48, 3, 6, "#7a5236")),

  ic("bridge", "community", "cross river span harbor", "#d0473a", (c) =>
    R(4, 40, 56, 6, 2, "#aab4be") + R(12, 10, 6, 36, c.m) + R(46, 10, 6, 36, c.m) + Ln("M4 40Q15 40 15 12M15 12Q32 44 49 12M49 12Q49 40 60 40", INK, 3) + Ln("M24 22v18M32 29v11M40 22v18", INK, 2) + Ln("M2 54q6-4 12 0t12 0 12 0 12 0 12 0", "#3b8fc4", 3)),

  ic("fire-truck", "community", "firefighter emergency ladder rescue", "#d0473a", (c) =>
    R(3, 24, 38, 26, 3, c.m) + R(41, 28, 20, 22, 3, c.m) + R(45, 31, 11, 9, 1.5, GLASS) + Ln("M7 20H38M7 15H38M12 15v9M20 15v9M28 15v9M36 15v9", INK, 2) + R(30, 18, 12, 4, 1, "#f2c335") + wheel(16, 51, 7) + wheel(48, 51, 7) + Ln("M5 38H40", "#f2c335", 3)),

  ic("hospital", "community", "doctor nurse health care emergency", "#d0473a", (c) =>
    R(8, 18, 48, 40, "#fff") + R(26, 44, 12, 14, "#3b7dc4") + Pa("M28 22h8v6h6v8h-6v6h-8v-6h-6v-8h6Z", c.m) + R(13, 24, 7, 8, GLASS) + R(44, 24, 7, 8, GLASS) + R(13, 44, 7, 8, GLASS) + R(44, 44, 7, 8, GLASS) + Ln("M8 18H56", INK, 2)),

  ic("library", "community", "books reading building borrow", "#3b7dc4", (c) =>
    Pg([[4, 22], [32, 6], [60, 22]], c.m) + R(8, 22, 48, 4, WALL) + [11, 22, 34, 45].map((x) => R(x, 26, 8, 24, "#fff")).join("") + R(4, 50, 56, 4, WALL) + R(2, 54, 60, 5, "#aab4be") + C(32, 17, 3.5, "#fff")),

  ic("train", "community", "locomotive railway rail travel", "#4f7fa8", (c) =>
    R(10, 10, 9, 14, DARK) + R(6, 22, 36, 26, 3, c.m) + R(36, 12, 22, 36, 3, c.m) + R(41, 17, 11, 11, 1.5, GLASS) + Pg([[58, 48], [62, 54], [52, 54], [52, 48]], "#f2c335") + R(2, 48, 56, 4, DARK) + wheel(16, 52, 5.5) + wheel(30, 52, 5.5) + wheel(48, 52, 5.5)),

  ic("bicycle", "community", "bike ride wheels pedal", "#d0473a", (c) =>
    ring(14, 42, 11, 3, DARK) + ring(50, 42, 11, 3, DARK) + Ln("M14 42L26 22H42L50 42M26 22L34 42H14M34 42L42 22", c.m, 4) + Ln("M22 20h8", INK, 4) + Ln("M42 22l-3-8h7", INK, 3) + dot(34, 42, 3.5, "#aab4be")),

  ic("airplane", "community", "plane fly travel airport sky", "#3b7dc4", (c) =>
    T(32, 32, E(0, 0, 5.5, 28, "#fff") + Pg([[-4, -6], [-28, 10], [-28, 17], [-4, 6]], c.m) + Pg([[4, -6], [28, 10], [28, 17], [4, 6]], c.m) + Pg([[-3, 22], [-12, 30], [-12, 34], [-3, 29]], c.m) + Pg([[3, 22], [12, 30], [12, 34], [3, 29]], c.m) + dot(0, -22, 2.5, GLASS), 1, 45)),

  ic("stop-sign", "community", "traffic safety road octagon", "#d0473a", (c) =>
    R(30, 40, 4, 20, "#aab4be") + Pg(ngon(32, 27, 26, 8, -67.5), c.m) + Pg(ngon(32, 27, 22, 8, -67.5), "none", 'stroke="#fff" stroke-width="2"') + `<text x="32" y="32" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="14" fill="#fff" stroke="none">STOP</text>`),

  ic("traffic-light", "community", "signal road safety stop go", "#3a4552", (c) =>
    R(30, 52, 4, 8, "#aab4be") + R(18, 4, 28, 50, 7, c.m) + C(32, 16, 6, "#d0473a") + C(32, 29, 6, "#f2c335") + C(32, 42, 6, "#4f9d5d")),

  ic("mailbox", "community", "mail post letter send", "#3b7dc4", (c) =>
    R(28, 44, 7, 16, "#7a5236") + Pa("M8 46V32q0-13 22-13t22 13v14Z", c.m) + R(20, 31, 20, 4, 2, "#0b2339") + R(46, 10, 4, 18, 1, "#aab4be") + Pg([[50, 10], [60, 14], [50, 18]], "#d0473a")),

  ic("ambulance", "community", "emergency medical rescue hospital", "#ffffff", (c) =>
    R(3, 18, 40, 32, 3, c.m) + R(43, 26, 18, 24, 3, c.m) + R(47, 29, 10, 9, 1.5, GLASS) + Pa("M20 22h6v6h6v6h-6v6h-6v-6h-6v-6h6Z", "#d0473a") + R(14, 12, 12, 6, 2, "#d0473a") + wheel(16, 51, 7) + wheel(50, 51, 7)),

  ic("bank", "community", "money savings building coins", "#3b7dc4", (c) =>
    Pg([[4, 24], [32, 6], [60, 24]], c.m) + R(6, 24, 52, 5, "#f1e4cf") + [10, 20, 30, 40, 50].map((x) => R(x - 2, 29, 6, 20, "#fff")).join("") + R(4, 49, 56, 5, "#f1e4cf") + R(2, 54, 60, 5, "#aab4be")),

  ic("farm", "community", "barn farmer countryside agriculture", "#d0473a", (c) =>
    Pa("M6 56V28L32 8l26 20v28Z", c.m) + Pa("M18 56V34h28v22Z", "#fff") + Ln("M18 34L46 56M46 34L18 56", c.m, 2) + R(26, 14, 12, 8, 1, "#f1e4cf") + Ln("M3 30L32 8l29 22", "#7a5236", 3)),
];
