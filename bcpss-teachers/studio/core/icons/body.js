import { C, E, ic, Ln, N, Pa, R, T, dot } from "./dsl.js";

// prettier-ignore
export default [
  ic("eye", "body", "see sight vision look senses", "#3b8fc4", (c) =>
    Pa("M3 32Q32 4 61 32 32 60 3 32Z", "#fff") + C(32, 32, 13, c.m) + C(32, 32, 6, "#1d2b3a") + N(C(28, 28, 3, "#fff")) + Ln("M32 6V1M14 14l-3-4M50 14l3-4", "#1d2b3a", 2.5)),

  ic("ear", "body", "hear listen sound senses", "#e9b48a", (c) =>
    Pa("M30 6C46 4 56 18 52 32c-3 10-10 12-10 20a10 10 0 0 1-20 0c0-4 2-6 4-10-6-6-10-14-8-22C20 12 24 7 30 6Z", c.skin) + Ln("M28 16q12-4 16 8-2 8-8 10", "#1d2b3a", 2.5) + Ln("M30 52q-6-6-2-14", "#1d2b3a", 2.5)),

  ic("hand", "body", "palm fingers wave touch senses", "#e9b48a", (c) =>
    R(14, 12, 9, 28, 4.5, c.skin) + R(24, 5, 9, 32, 4.5, c.skin) + R(34, 6, 9, 31, 4.5, c.skin) + R(44, 14, 9, 26, 4.5, c.skin) + E(12, 38, 5.5, 11, c.skin, 'transform="rotate(-38 12 38)"') +
    Pa("M14 32h39v10q0 16-19 16T14 44Z", c.skin) + N(R(15, 30, 37, 8, 0, c.skin))),

  ic("mouth", "body", "speak lips talk say smile", "#d0473a", (c) =>
    Pa("M5 32Q18 18 32 25 46 18 59 32 46 50 32 50T5 32Z", c.m) + Ln("M6 32Q32 40 58 32", "#1d2b3a", 2.5) + N(Pa("M22 26q6-3 10 1", "none", 'stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"'))),

  ic("foot", "body", "toes walk step footprint", "#e9b48a", (c) =>
    E(32, 42, 15, 19, c.skin) + C(18, 14, 4.5, c.skin) + C(27, 9, 4, c.skin) + C(36, 8, 3.8, c.skin) + C(44, 11, 3.4, c.skin) + C(50, 17, 3, c.skin)),

  ic("heart", "body", "love pulse health organ", "#d0473a", (c) =>
    Pa("M32 57C6 38 4 20 15 11 24 5 30 12 32 17c2-5 8-12 17-6 11 9 9 27-17 46Z", c.m) + N(Pa("M14 22q2-6 7-7", "none", 'stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"'))),

  ic("brain", "body", "think mind learn organ", "#f1a6b8", (c) =>
    Pa("M32 10C25 3 13 7 13 19c-6 2-8 10-4 16-2 9 4 15 12 15 2 7 9 8 11 4 2 4 9 3 11-4 8 0 14-6 12-15 4-6 2-14-4-16 0-12-12-16-19-9Z", c.m) +
    Ln("M32 10v41M20 22q6 2 8 8M44 22q-6 2-8 8M19 40q6-2 10 2M45 40q-6-2-10 2", "#c06a82", 2.5)),

  ic("nose", "body", "smell sniff breathe senses", "#e9b48a", (c) =>
    Pa("M32 6Q28 26 22 38 12 50 24 53q4 5 8 1 4 4 8-1 12-3 2-15-6-12-10-32Z", c.skin) + dot(24, 48, 2.4, "#7a3b2a") + dot(40, 48, 2.4, "#7a3b2a")),

  ic("tooth", "body", "dentist teeth brush smile", "#ffffff", (c) =>
    Pa("M14 14Q14 6 24 6q4 0 8 2 4-2 8-2 10 0 10 8 0 12-4 20-2 14-6 22-3 4-6-14-1-5-2-5t-2 5q-3 18-6 14-4-8-6-22-4-8-4-20Z", c.m) + N(Pa("M20 14q0-4 5-4", "none", 'stroke="#c9d6e2" stroke-width="3" stroke-linecap="round"'))),

  ic("bone", "body", "skeleton skull dog support", "#f4ead0", (c) =>
    T(32, 32, C(-26, -8, 7, c.m) + C(-26, 8, 7, c.m) + C(26, -8, 7, c.m) + C(26, 8, 7, c.m) + N(R(-27, -8, 54, 16, 0, c.m)) + Ln("M-19-8H19M-19 8H19"), 1, -35)),

  ic("lungs", "body", "breathe air respiratory organ", "#f1a6b8", (c) =>
    Pa("M28 14v14q-2 8-6 10-12 4-14 20 0 4 6 2 16-4 20-14V28Z", c.m) + Pa("M36 14v14q2 8 6 10 12 4 14 20 0 4-6 2-16-4-20-14V28Z", c.m) + R(30, 4, 4, 22, 2, "#c06a82")),
];
