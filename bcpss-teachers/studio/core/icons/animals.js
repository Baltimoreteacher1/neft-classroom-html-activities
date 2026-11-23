import { C, E, INK, ic, Ln, N, Pa, Pg, P, dot, shade, light } from "./dsl.js";

const eyes = (y = 32, dx = 8, r = 2.6) => dot(32 - dx, y, r) + dot(32 + dx, y, r);

// prettier-ignore
export default [
  ic("cat", "animals", "kitten pet feline meow", "#e8954a", (c) =>
    Pg([[12, 6], [28, 18], [12, 31]], c.m) + Pg([[52, 6], [36, 18], [52, 31]], c.m) +
    N(Pg([[15, 13], [23, 19], [15, 25]], P.pink)) + N(Pg([[49, 13], [41, 19], [49, 25]], P.pink)) +
    E(32, 36, 21, 18, c.m) + Ln("M32 19v6M25 20l1.5 5M39 20l-1.5 5", c.d) +
    eyes(33, 8.5, 2.8) + Pg([[28.5, 39], [35.5, 39], [32, 42.5]], P.pink) +
    Ln("M32 42.5v2.5M32 45q-3 3-6.5 1M32 45q3 3 6.5 1") + Ln("M6 36l10 2M6 43l10-3M58 36l-10 2M58 43l-10-3")),

  ic("dog", "animals", "puppy pet canine bark", "#b9824c", (c) =>
    E(14, 30, 8, 16, c.d, 'transform="rotate(12 14 30)"') + E(50, 30, 8, 16, c.d, 'transform="rotate(-12 50 30)"') +
    E(32, 31, 17, 19, c.m) + E(32, 42, 11, 9, light(c.m, 0.45)) + E(32, 37, 4.6, 3.4, INK) +
    eyes(28, 8, 2.8) + Ln("M32 40.5v3M32 43.5q-4 3-7.5 0M32 43.5q4 3 7.5 0") +
    Pa("M29 46q3 9 6 0Z", P.coralLight)),

  ic("fish", "animals", "swim ocean aquarium sea", "#3b8fc4", (c) =>
    Pg([[44, 32], [58, 20], [58, 44]], c.d) + E(28, 32, 21, 14, c.m) +
    Pa("M26 19q8-8 16-2l-4 6Z", c.d) + Pa("M26 45q8 8 16 2l-4-6Z", c.d) +
    Ln("M36 22q4 10 0 20", c.l, 2) + Ln("M28 24q4 8 0 16", c.l, 2) + C(15, 29, 3.6, "#fff") + dot(14.5, 29, 1.8) + Ln("M9 36q3 2 5 0")),

  ic("bird", "animals", "robin sparrow fly feather wing", "#4d8fcf", (c) =>
    Pg([[14, 36], [2, 28], [4, 44]], c.d) + E(30, 38, 18, 13, c.m) + E(33, 42, 10, 6, "#f4ead0") + C(44, 24, 10, c.m) +
    Pg([[52, 22], [62, 26], [52, 29]], P.orange) + dot(46, 22, 2.2) +
    Pa("M18 36q8-10 18-3q-4 10-14 8Z", c.d) + Ln("M28 50v8M36 50v8M24 58h8M32 58h8", P.orange)),

  ic("frog", "animals", "pond amphibian hop green", "#5aa84e", (c) =>
    E(14, 48, 9, 6, c.d) + E(50, 48, 9, 6, c.d) + E(32, 40, 22, 16, c.m) + E(32, 48, 14, 7, light(c.m, 0.4)) +
    C(19, 22, 9, c.m) + C(45, 22, 9, c.m) + C(19, 22, 5.5, "#fff") + C(45, 22, 5.5, "#fff") + dot(20, 23, 2.8) + dot(44, 23, 2.8) +
    Ln("M18 41q14 9 28 0") + dot(28, 34, 1.4) + dot(36, 34, 1.4)),

  ic("butterfly", "animals", "insect wings flutter caterpillar", "#e0802f", (c) =>
    E(18, 22, 14, 14, c.m, 'transform="rotate(-25 18 22)"') + E(46, 22, 14, 14, c.m, 'transform="rotate(25 46 22)"') +
    E(20, 44, 10, 10, "#e5b445", 'transform="rotate(20 20 44)"') + E(44, 44, 10, 10, "#e5b445", 'transform="rotate(-20 44 44)"') +
    dot(16, 22, 4.5, "#fff3dc") + dot(48, 22, 4.5, "#fff3dc") + E(32, 34, 3.4, 17, INK) + Ln("M31 18q-5-9-10-10M33 18q5-9 10-10")),

  ic("bee", "animals", "honey insect buzz sting pollinator", "#f2c335", (c) =>
    E(24, 18, 9, 12, "#dff0f8", 'transform="rotate(-25 24 18)"') + E(40, 18, 9, 12, "#dff0f8", 'transform="rotate(25 40 18)"') +
    E(32, 38, 20, 15, c.m) + N(Pa("M25 25q-4 13 0 26 4 1 5 0-3-13 0-26ZM39 25q4 13 0 26-4 1-5 0 3-13 0-26Z", INK)) +
    Pg([[51, 38], [60, 38], [51, 42]], INK) + dot(18, 34, 2.4, "#fff") + Ln("M14 25q-4-8-9-8M20 23q-2-9-6-12")),

  ic("turtle", "animals", "shell reptile slow tortoise", "#4f9a55", (c) =>
    E(14, 46, 6, 5, c.d) + E(46, 46, 6, 5, c.d) + Pg([[8, 40], [3, 44], [10, 44]], c.d) +
    C(54, 34, 8, c.d) + dot(57, 32, 1.8) + Pa("M10 44q0-24 22-24t22 24Z", c.m) +
    Ln("M32 20v24M20 26l12 8l12-8M14 44l18-10l18 10", shade(c.m, 0.4)) + Ln("M10 44h44")),

  ic("cow", "animals", "farm cattle milk moo", "#ffffff", (c) =>
    Pa("M14 17l-4-9 8 4ZM50 17l4-9-8 4Z", "#f0e6d0") + E(11, 24, 7, 4, "#f0e6d0", 'transform="rotate(20 11 24)"') + E(53, 24, 7, 4, "#f0e6d0", 'transform="rotate(-20 53 24)"') +
    Pa("M16 14q16-8 32 0l2 22q-2 10-18 10t-18-10Z", c.m) + N(Pa("M16 14q6-3 12-3l-2 16q-8-2-10 4Z", INK)) +
    E(32, 44, 14, 10, P.coralLight) + dot(27, 44, 1.8, "#7a3b2a") + dot(37, 44, 1.8, "#7a3b2a") + eyes(26, 10, 2.6) +
    N(E(46, 20, 5, 4, INK))),

  ic("horse", "animals", "farm pony gallop mane stable", "#9a6a3d", (c) =>
    Pa("M20 12q-8 22-4 46h12q-2-20 8-42Z", c.d) + Pg([[20, 58], [24, 26], [40, 26], [40, 40], [36, 58]], c.m) +
    E(44, 34, 10, 20, c.m, 'transform="rotate(-25 44 34)"') + E(51, 48, 6.5, 5.5, light(c.m, 0.5), 'transform="rotate(-25 51 48)"') +
    Pg([[33, 17], [34, 5], [41, 15]], c.m) + dot(41, 28, 2.4) + dot(52, 49, 1.3, c.d)),

  ic("rabbit", "animals", "bunny hop ears pet", "#e6ddd0", (c) =>
    E(23, 15, 6, 14, c.m) + E(41, 15, 6, 14, c.m) + N(E(23, 16, 3, 10, P.pink)) + N(E(41, 16, 3, 10, P.pink)) +
    E(32, 40, 19, 17, c.m) + eyes(36, 8, 2.8) + Pg([[29, 42], [35, 42], [32, 45]], P.pink) + Ln("M32 45v2M32 47q-3 3-6 0M32 47q3 3 6 0")),

  ic("duck", "animals", "pond quack water bird", "#f2c335", (c) =>
    Pa("M6 40q0-12 14-12 0-14 14-14t12 14q0 6-4 8 14 2 16 16 0 14-22 14T6 40Z", c.m) +
    Pg([[44, 20], [58, 24], [44, 28]], P.orange) + dot(36, 20, 2.2) + Pa("M14 42q10-6 20 4-8 6-20-4Z", c.d)),

  ic("pig", "animals", "farm oink pork pink", "#f1a6b8", (c) =>
    Pg([[10, 10], [26, 14], [14, 28]], c.d) + Pg([[54, 10], [38, 14], [50, 28]], c.d) +
    E(32, 36, 22, 20, c.m) + E(32, 42, 10, 7.5, "#f6c4d0") + dot(28.5, 42, 1.8, "#a24f72") + dot(35.5, 42, 1.8, "#a24f72") + eyes(30, 11, 2.8)),

  ic("sheep", "animals", "lamb wool farm baa", "#fbf6ec", (c) =>
    C(16, 26, 9, c.m) + C(48, 26, 9, c.m) + C(22, 16, 10, c.m) + C(42, 16, 10, c.m) + C(32, 13, 10, c.m) + C(14, 38, 9, c.m) + C(50, 38, 9, c.m) +
    E(32, 38, 20, 16, c.m) + E(32, 36, 12, 15, "#4a3b36") + E(19, 33, 5, 3, "#4a3b36", 'transform="rotate(25 19 33)"') + E(45, 33, 5, 3, "#4a3b36", 'transform="rotate(-25 45 33)"') +
    dot(28, 32, 2, "#fff") + dot(36, 32, 2, "#fff") + dot(28, 32, 1) + dot(36, 32, 1) + Ln("M29 42q3 3 6 0", "#fff")),

  ic("ant", "animals", "insect colony small crawl", "#7a3b2a", (c) =>
    Ln("M16 36l-6 14M26 38l-3 14M36 38l3 14M46 34l8 12M16 34l-8-8M46 30l10-6") + Ln("M52 20q3-8 9-9M55 24q7-4 8-13") +
    C(12, 32, 8, c.m) + E(30, 32, 9, 7, c.m) + C(48, 28, 7, c.m) + dot(51, 26, 1.6, "#fff")),

  ic("ladybug", "animals", "insect beetle spots red", "#d0473a", (c) =>
    Ln("M24 12q-6-6-10-4M40 12q6-6 10-4") + Pa("M20 22q12-14 24 0Z", INK) + C(32, 36, 22, c.m) + Ln("M32 14v44") +
    dot(21, 30, 3.6) + dot(43, 30, 3.6) + dot(20, 44, 3.2) + dot(44, 44, 3.2) + dot(29, 24, 1.6, "#fff") + dot(35, 24, 1.6, "#fff")),

  ic("snail", "animals", "slow shell garden slime", "#d98a3d", (c) =>
    Pa("M4 52q-2-8 6-10l40 0q8 0 8 10Z", "#e8d3a8") + Ln("M52 44q4-14 0-24M56 44q6-12 4-22") + dot(52, 18, 3) + dot(60, 20, 3) +
    C(30, 32, 18, c.m) + Ln("M30 32m-1 0a3 3 0 1 1 6 0 8 8 0 1 1-14 0 13 13 0 1 1 26 0", c.d)),

  ic("elephant", "animals", "trunk zoo africa big", "#8d9aa8", (c) =>
    E(14, 30, 11, 15, c.d) + E(50, 30, 11, 15, c.d) + E(32, 28, 15, 17, c.m) + Pa("M26 36q-2 20 4 20 3 0 2-5 3 0 2-15Z", c.m) +
    eyes(24, 8, 2.4) + Pg([[24, 40], [20, 46], [26, 44]], "#fff") + Pg([[40, 40], [44, 46], [38, 44]], "#fff")),
];
