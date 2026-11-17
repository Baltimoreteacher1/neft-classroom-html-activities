import {
  bead,
  begin,
  blob,
  blur,
  check,
  circle,
  DOM,
  floorShadow,
  INK,
  light,
  line,
  mix,
  P,
  path,
  poly,
  rect,
  rot,
  rrect,
  shade,
  sparkle,
  star,
  vgrad,
  wash,
} from "../lib/g.mjs";

// A folded paper map (three panels), route, four coloured stops, flag and compass.
function map() {
  const pan = [
    [
      [84, 92],
      [190, 74],
      [190, 276],
      [84, 292],
    ],
    [
      [190, 74],
      [296, 92],
      [296, 292],
      [190, 276],
    ],
    [
      [296, 92],
      [402, 74],
      [402, 276],
      [296, 292],
    ],
  ];
  const tones = ["#fbf3e0", "#f1e6cc", "#fbf3e0"];
  let s = blur(
    poly(
      [
        [90, 104],
        [196, 86],
        [302, 104],
        [408, 86],
        [408, 290],
        [302, 306],
        [196, 290],
        [90, 306],
      ],
      INK,
    ),
    9,
    0.22,
  );
  pan.forEach((p, i) => (s += poly(p, tones[i])));
  // terrain on the map: river, park, water patches
  s += path(
    "M84 230 C130 214 150 250 190 236 C230 222 250 196 296 206 C340 216 360 180 402 186",
    "none",
    `stroke="#a9d3e4" stroke-width="10" stroke-linecap="round" opacity=".9"`,
  );
  s += path("M110 120 c20 -10 46 -4 50 14 c4 18 -30 26 -48 18 c-14 -6 -14 -26 -2 -32Z", "#cfe3c2");
  s += path("M318 112 c26 -8 54 4 52 22 c-2 14 -38 20 -54 10 c-12 -8 -10 -26 2 -32Z", "#cfe3c2");
  s += path("M216 120 h40 v26 h-40Z", "#efd9c7", 'opacity=".9"');
  // fold shading
  s += poly(pan[1], "#1c2f4a", 'opacity=".05"');
  return s;
}
function flag(x, y) {
  return (
    floorShadow(x + 2, y + 2, 10, 3, 0.25) +
    line(x, y, x, y - 54, P.navy, 3.4) +
    path(
      `M${x + 1} ${y - 54} C${x + 14} ${y - 60} ${x + 22} ${y - 46} ${x + 38} ${y - 52} V${y - 30} C${x + 22} ${y - 24} ${x + 14} ${y - 38} ${x + 1} ${y - 32}Z`,
      vgrad([
        [0, light(P.coral, 0.15)],
        [1, P.coral],
      ]),
    ) +
    circle(x, y - 56, 3.4, P.gold)
  );
}
function compass(x, y, r) {
  return (
    blur(circle(x + 4, y + 9, r, INK), 7, 0.25) +
    circle(
      x,
      y,
      r,
      vgrad([
        [0, light(P.gold, 0.2)],
        [1, shade(P.gold, 0.15)],
      ]),
    ) +
    circle(
      x,
      y,
      r * 0.8,
      vgrad([
        [0, "#ffffff"],
        [1, "#eef2f6"],
      ]),
    ) +
    [0, 1, 2, 3]
      .map((i) => rot(x, y, i * 90, rect(x - 1, y - r * 0.76, 2, 6, "#9aa7b4")))
      .join("") +
    poly(
      [
        [x, y - r * 0.6],
        [x + 7, y],
        [x - 7, y],
      ],
      P.coral,
    ) +
    poly(
      [
        [x, y + r * 0.6],
        [x + 7, y],
        [x - 7, y],
      ],
      P.navy,
    ) +
    circle(x, y, 3.4, "#ffffff") +
    rrect(x - 6, y - r - 8, 12, 9, 4, shade(P.gold, 0.15))
  );
}
const STOPS = [
  [124, 238, DOM.listening],
  [184, 176, DOM.reading],
  [262, 196, DOM.speaking],
  [318, 140, DOM.writing],
];

export default {
  file: "ds/studio-mission.svg",
  w: 480,
  h: 360,
  title: "A mission map with a dotted route through four coloured stops, a flag and a compass",
  draw: () =>
    begin() +
    wash(480, 360, "#eef2fc", "#dbe3f6", { glow: "#ffffff", gy: 0.42 }) +
    blob(244, 186, 206, 142, "#d9e2f6", { tilt: 6 }) +
    rot(
      244,
      184,
      -3,
      map() +
        path(
          "M124 238 C146 196 160 186 184 176 C214 164 236 206 262 196 C288 186 296 150 318 140 C336 132 344 112 350 96",
          "none",
          `stroke="${P.navy}" stroke-width="3.4" stroke-dasharray="1 9" stroke-linecap="round"`,
        ) +
        STOPS.map(([x, y, c]) => check(x, y, 15, c)).join("") +
        flag(352, 96),
    ) +
    compass(388, 278, 36) +
    sparkle(64, 98, 9, P.gold) +
    sparkle(432, 70, 7, P.coral) +
    circle(54, 260, 4.5, P.teal) +
    circle(436, 182, 4, P.gold) +
    sparkle(84, 318, 6, P.navy),
};
