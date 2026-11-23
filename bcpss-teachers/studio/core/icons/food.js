import { C, E, INK, ic, Ln, N, Pa, Pg, R, T, bar, dot, light, shade } from "./dsl.js";

const GREEN = "#5aa84e";
const TAN = "#d9a05b";

// prettier-ignore
export default [
  ic("apple", "food", "fruit red snack healthy", "#d0473a", (c) =>
    Pa("M32 20C24 12 8 16 8 34c0 12 10 24 18 24 4 0 4-2 6-2s2 2 6 2c8 0 18-12 18-24 0-18-16-22-24-14Z", c.m) + Ln("M32 20q0-8 4-13", "#7a5236", 3) + Pa("M35 14q6-9 15-4-4 9-15 4Z", GREEN) +
    N(Pa("M15 30q2-8 8-9", "none", 'stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"'))),

  ic("banana", "food", "fruit yellow snack peel", "#f2c335", (c) =>
    Pa("M9 14Q8 50 40 56q14 2 18-10-14 4-26-8Q18 28 17 10Z", c.m) + Pa("M9 14q2-5 8-4l-0 2Z", "#7a5236") + Pa("M54 48l5-4q2 8-5 12Z", "#7a5236") + Ln("M20 18Q22 38 38 46", c.d, 2)),

  ic("bread", "food", "loaf bakery wheat toast sandwich", TAN, (c) =>
    Pa("M8 32q-2-16 24-16t24 16q0 5-5 6v16Q43 56 32 56T13 54V38q-5-1-5-6Z", c.m) + Ln("M22 25l4 8M32 23l4 8M42 25l4 8", shade(c.m, 0.3), 2.5)),

  ic("milk", "food", "dairy drink carton cow calcium", "#3b7dc4", (c) =>
    Pg([[17, 22], [23, 8], [41, 8], [47, 22]], "#e8eef6") + R(17, 22, 30, 36, 1, "#fff") + R(17, 32, 30, 14, 0, c.m) + Ln("M23 8h18", INK, 2) + C(32, 39, 4, "#fff", 'stroke="none"')),

  ic("carrot", "food", "vegetable orange root", "#ea8a2b", (c) =>
    T(31, 37, Pa("M-4-22q-9-12-6-21 9 6 6 21ZM0-22q0-15 2-22 5 9-2 22ZM4-22q6-10 13-12 0 9-13 12Z", GREEN) + Pa("M-10-20Q0-26 10-20L2 28Q0 31-2 28Z", c.m) + Ln("M-6-9h6M-3 3h6M-1 15h3", c.d, 2), 1, 32)),

  ic("orange", "food", "fruit citrus juice vitamin c", "#ea8a2b", (c) =>
    C(32, 36, 23, c.m) + Pa("M34 14q4-8 14-6-2 10-14 6Z", GREEN) + Ln("M32 14v4", "#7a5236", 3) + N(Pa("M16 38q0-12 10-16", "none", 'stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"'))),

  ic("grapes", "food", "fruit purple bunch vine", "#7b5aa6", (c) =>
    Ln("M32 14v6", "#7a5236", 3) + Pa("M33 14q8-8 18-4-4 10-18 4Z", GREEN) +
    [[20, 26], [32, 26], [44, 26], [26, 37], [38, 37], [20, 37 + 0.1], [44, 37], [32, 48], [26, 48 + 0.1], [38, 48]].filter((_, i) => i !== 5 && i !== 8).map(([x, y]) => C(x, y, 7, c.m)).join("") + C(32, 57, 6, c.m) + N(C(30, 24, 2, "#fff")) + N(C(42, 24, 2, "#fff"))),

  ic("strawberry", "food", "fruit berry red seeds", "#d0473a", (c) =>
    Pa("M9 26Q9 14 22 14h20q13 0 13 12 0 16-23 32Q9 42 9 26Z", c.m) + Pg([[32, 14], [22, 8], [28, 14], [20, 14], [28, 17], [32, 12], [36, 17], [44, 14], [36, 14], [42, 8]], GREEN) +
    [[20, 28], [32, 26], [44, 28], [26, 38], [38, 38], [32, 48]].map(([x, y]) => N(E(x, y, 1.6, 2.4, "#f2c335"))).join("")),

  ic("egg", "food", "fried breakfast protein yolk", "#f2c335", (c) =>
    Pa("M10 30Q6 12 26 10t28 12q10 18-6 28T18 52Q4 46 10 30Z", "#fff") + C(30, 32, 10, c.m) + N(C(27, 28, 3, "#fff6cf"))),

  ic("cheese", "food", "dairy wedge yellow snack", "#f2c335", (c) =>
    Pg([[6, 26], [56, 12], [58, 22], [6, 36]], light(c.m, 0.4)) + Pg([[6, 26], [58, 22], [58, 50], [6, 50]], c.m) + C(18, 40, 4, c.d, 'stroke="none"') + C(36, 36, 5, c.d, 'stroke="none"') + C(48, 44, 3.5, c.d, 'stroke="none"') + C(26, 45, 2.5, c.d, 'stroke="none"')),

  ic("pizza", "food", "slice cheese pepperoni lunch", "#f2c335", (c) =>
    Pa("M6 16Q32 2 58 16L32 60Z", c.m) + Pa("M6 16Q32 2 58 16l-3 7Q32 11 9 23Z", TAN) + [[24, 28], [38, 30], [32, 42]].map(([x, y]) => C(x, y, 4.5, "#d0473a")).join("")),

  ic("cookie", "food", "dessert chocolate chip sweet snack", TAN, (c) =>
    C(32, 32, 24, c.m) + [[22, 22], [38, 20], [44, 34], [30, 34], [20, 40], [36, 46]].map(([x, y]) => N(E(x, y, 3.2, 2.6, "#5a3b26"))).join("")),

  ic("corn", "food", "vegetable maize kernel cob", "#f2c335", (c) =>
    T(32, 32, E(0, -3, 10, 24, c.m) + Ln("M-10 -10h20M-10 0h20M-10 10h20M-5-24v44M5-24v44", c.d, 1.5) + Pa("M0 26q-16-10-12-30 4 14 12 18 8-4 12-18 4 20-12 30Z", GREEN), 1, 28)),

  ic("watermelon", "food", "fruit summer slice seeds", "#e0475b", (c) =>
    Pa("M3 22a29 29 0 0 0 58 0Z", GREEN) + Pa("M8 22a24 24 0 0 0 48 0Z", "#f4f0d0") + Pa("M11 22a21 21 0 0 0 42 0Z", c.m) +
    [[22, 30], [32, 36], [42, 30], [27, 42], [37, 44]].map(([x, y]) => N(E(x, y, 1.8, 3, INK))).join("")),

  ic("sandwich", "food", "lunch bread lettuce tomato meal", TAN, (c) =>
    Pa("M7 26Q7 10 32 10t25 16Z", c.m) + Pa("M5 26h54l-5 6-6-4-6 4-6-4-6 4-6-4-6 4-6-4Z", GREEN) + R(7, 32, 50, 6, 0, "#d0473a") + Pg([[7, 38], [57, 38], [50, 44], [14, 44]], "#f2c335") + Pa("M8 44h48v6q0 6-8 6H16q-8 0-8-6Z", c.m)),

  ic("juice", "food", "drink cup straw glass beverage", "#ea8a2b", (c) =>
    bar(40, 4, 34, 24, 4, "#3b7dc4") + Pa("M14 18h36l-4 40H18Z", "#eaf3f8") + Pa("M16 32h32l-2 26H18Z", c.m) + N(Pa("M20 22l2 28", "none", 'stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"'))),
];
