import {
  begin,
  blob,
  circle,
  ellipse,
  floorShadow,
  grad,
  light,
  P,
  path,
  poly,
  rect,
  rrect,
  shade,
  sparkle,
  vgrad,
} from "../lib/g.mjs";

// Rising steps (front face + top face + side face) and a sprout in a pot.
function step(x, y, w, h, c) {
  const d = 14; // depth offset up-right
  return (
    poly(
      [
        [x, y],
        [x + d, y - d * 0.6],
        [x + w + d, y - d * 0.6],
        [x + w, y],
      ],
      light(c, 0.35),
    ) +
    poly(
      [
        [x + w, y],
        [x + w + d, y - d * 0.6],
        [x + w + d, y + h - d * 0.6],
        [x + w, y + h],
      ],
      shade(c, 0.22),
    ) +
    rect(
      x,
      y,
      w,
      h,
      vgrad([
        [0, light(c, 0.12)],
        [1, c],
      ]),
    )
  );
}
function sprout(x, y) {
  let s = path(
    `M${x} ${y} C${x - 2} ${y - 30} ${x + 4} ${y - 52} ${x} ${y - 74}`,
    "none",
    `stroke="${P.leafDark}" stroke-width="4" stroke-linecap="round"`,
  );
  s += path(
    `M${x} ${y - 44} C${x - 14} ${y - 70} ${x - 50} ${y - 64} ${x - 48} ${y - 44} C${x - 34} ${y - 34} ${x - 12} ${y - 34} ${x} ${y - 44}Z`,
    grad(P.leaf, 0.2, 0.05),
  );
  s += path(
    `M${x} ${y - 44} C${x - 16} ${y - 52} ${x - 32} ${y - 52} ${x - 44} ${y - 46}`,
    "none",
    `stroke="${light(P.leaf, 0.35)}" stroke-width="1.6" opacity=".8"`,
  );
  s += path(
    `M${x} ${y - 66} C${x + 10} ${y - 98} ${x + 52} ${y - 98} ${x + 54} ${y - 74} C${x + 40} ${y - 60} ${x + 14} ${y - 58} ${x} ${y - 66}Z`,
    grad(P.tealLight, 0.15, 0.1),
  );
  s += path(
    `M${x} ${y - 66} C${x + 16} ${y - 76} ${x + 34} ${y - 78} ${x + 50} ${y - 74}`,
    "none",
    `stroke="${light(P.tealLight, 0.4)}" stroke-width="1.6" opacity=".8"`,
  );
  return s;
}
function pot(x, y) {
  return (
    path(
      `M${x - 30} ${y - 40} H${x + 30} L${x + 24} ${y} H${x - 24}Z`,
      vgrad([
        [0, light(P.coral, 0.12)],
        [1, shade(P.coral, 0.12)],
      ]),
    ) +
    path(
      `M${x + 8} ${y - 40} H${x + 30} L${x + 24} ${y} H${x + 6}Z`,
      shade(P.coral, 0.18),
      'opacity=".55"',
    ) +
    rrect(
      x - 35,
      y - 48,
      70,
      12,
      4,
      vgrad([
        [0, light(P.coral, 0.25)],
        [1, P.coral],
      ]),
    ) +
    ellipse(x, y - 47, 30, 3.5, P.soilDark)
  );
}

export default {
  file: "ds/progress-growth.svg",
  w: 360,
  h: 270,
  title: "A sprout growing from a pot beside rising steps",
  grain: false,
  draw: () =>
    begin() +
    blob(184, 140, 128, 108, "#dcefe9", { tilt: -6 }) +
    floorShadow(186, 220, 128, 10, 0.2) +
    step(66, 186, 46, 34, "#c8d8f0") +
    step(112, 150, 46, 70, "#f3cdbf") +
    step(158, 110, 46, 110, "#f6dfa6") +
    pot(260, 220) +
    sprout(260, 172) +
    sparkle(78, 92, 9, P.navy) +
    sparkle(306, 58, 7, P.gold) +
    circle(56, 150, 4.5, P.gold) +
    circle(318, 196, 4.5, "#7f9fd6") +
    sparkle(222, 54, 5, P.coral),
};
