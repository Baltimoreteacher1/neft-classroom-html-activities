import {
  arrow,
  cloud,
  ellipse,
  g,
  haze,
  light,
  P,
  path,
  poly,
  rain,
  shade,
  sky,
  stroke,
  sun,
  tree,
  vgrad,
} from "../../../access-practice-lab/src/art/kit.js";

// Label-free water-cycle diagram (students write the labels in words). Read the arrows in order:
// sun warms ocean -> vapor rises -> cloud forms -> moves over the mountain and rains -> river back to the ocean.
const ARROW = "#123a5c";
const VAPOR = "#ffffff";

const mountain = () =>
  path("M250 400 L420 200 L500 128 L560 190 L640 150 L640 400Z", haze("#7f9a6a", 0.55)) +
  path(
    "M300 400 L430 214 L506 120 L590 230 L640 270 L640 400Z",
    vgrad([
      [0, "#8a9a7c"],
      [0.5, "#6f8f5a"],
      [1, "#5c8a4c"],
    ]),
  ) +
  path(
    "M506 120 L590 230 L640 270 L640 400 L520 400 L540 260Z",
    shade("#6f8f5a", 0.2),
    'opacity=".55"',
  ) +
  path("M506 120 L470 166 L486 160 L496 172 L510 158 L524 170 L536 148Z", "#ffffff") +
  path("M506 120 L536 148 L524 170 L516 150Z", "#dfe8ee");

const ocean = () =>
  path(
    "M0 296 Q120 288 230 296 Q300 300 352 318 Q380 340 372 400 L0 400Z",
    vgrad([
      [0, "#5fb0d4"],
      [1, "#2f7ea6"],
    ]),
  ) +
  path(
    "M0 296 Q120 288 230 296 Q300 300 352 318",
    "none",
    `stroke="${light(P.water, 0.6)}" stroke-width="3"`,
  ) +
  stroke(
    "M40 330 q10 -6 20 0 q10 6 20 0M150 350 q10 -6 20 0 q10 6 20 0M250 334 q10 -6 20 0 q10 6 20 0M90 378 q10 -6 20 0 q10 6 20 0M220 382 q10 -6 20 0 q10 6 20 0",
    "#d4eef7",
    2.2,
    'opacity=".8"',
  );

const river = () =>
  stroke("M478 226 C470 262 430 268 432 296 C434 322 392 330 360 340", "#4c9fc4", 14) +
  stroke(
    "M478 226 C470 262 430 268 432 296 C434 322 392 330 360 340",
    P.waterLight,
    5,
    'opacity=".7"',
  );

const vapor = (x) =>
  stroke(
    `M${x} 284 q-10 -14 0 -28 q10 -14 0 -28 q-10 -14 0 -28 q10 -14 0 -28 q-10 -14 0 -28`,
    VAPOR,
    3.2,
    'stroke-dasharray="6 6" opacity=".95"',
  ) +
  poly(
    [
      [x - 8, 148],
      [x + 8, 148],
      [x, 133],
    ],
    VAPOR,
  );

export default {
  file: "35-writing-water-cycle.svg",
  w: 640,
  h: 400,
  title:
    "The water cycle: the sun warms the ocean, water rises as vapor, clouds form, rain falls on a mountain, and a river flows back to the ocean.",
  draw: () =>
    sky(640, 400) +
    sun(78, 72, 30) +
    stroke(
      "M70 114 L58 270M96 110 L140 268M112 96 L206 262",
      "#f3c54e",
      3,
      'opacity=".75" stroke-dasharray="10 9"',
    ) +
    mountain() +
    g(
      path(
        "M330 400 Q400 330 470 300 Q560 280 640 300 L640 400Z",
        vgrad([
          [0, P.grassLight],
          [1, P.grass],
        ]),
      ),
    ) +
    tree(600, 330, 0.32, { kind: "pine" }) +
    tree(560, 344, 0.36, { kind: "pine" }) +
    river() +
    ocean() +
    vapor(222) +
    vapor(292) +
    cloud(262, 98, 1.0) +
    cloud(508, 70, 1.05, { dark: true }) +
    rain(462, 92, 96, 70, { n: 22, seed: 4, color: "#4c9fc4", o: 0.95 }) +
    arrow("M322 78 Q390 46 446 62", ARROW, 4) +
    arrow("M436 300 Q412 326 372 338", ARROW, 4),
};
