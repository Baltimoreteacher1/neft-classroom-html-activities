import {
  clipRect,
  cloud,
  flower,
  ground,
  haze,
  sky,
  sun,
  tree,
  tuft,
} from "../../../access-practice-lab/src/art/kit.js";
import {
  bars,
  begin,
  blur,
  card,
  check,
  circle,
  DOM,
  ellipse,
  floorShadow,
  grad,
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
  vgrad,
} from "../lib/g.mjs";

// Science Expedition: a watershed (snowy peaks, a river into a lake, forest) and a field research station
// with a sensor post; a field-notes card shows the readings.
function mountains() {
  let s = poly(
    [
      [-20, 210],
      [110, 78],
      [190, 160],
      [262, 96],
      [380, 210],
    ],
    haze("#7d97ad", 0.25),
  );
  s += poly(
    [
      [110, 78],
      [190, 160],
      [150, 210],
      [120, 210],
    ],
    haze("#5f7c95", 0.3),
    'opacity=".55"',
  );
  s += poly(
    [
      [262, 96],
      [380, 210],
      [300, 210],
    ],
    haze("#5f7c95", 0.3),
    'opacity=".55"',
  );
  s +=
    poly(
      [
        [110, 78],
        [132, 100],
        [120, 98],
        [110, 108],
        [98, 96],
        [90, 98],
      ],
      "#ffffff",
    ) +
    poly(
      [
        [262, 96],
        [280, 114],
        [270, 112],
        [260, 120],
        [252, 110],
        [244, 112],
      ],
      "#ffffff",
    );
  s += poly(
    [
      [300, 210],
      [420, 120],
      [540, 210],
    ],
    haze("#6f8aa1", 0.45),
  );
  return s;
}
function river() {
  return (
    path(
      "M262 206 C250 230 300 236 280 256 C262 274 196 272 214 300 C226 318 290 318 300 360 H220 C206 330 160 318 172 290 C186 260 238 258 232 240 C228 226 236 214 262 206Z",
      vgrad([
        [0, P.waterLight],
        [1, P.water],
      ]),
    ) +
    ellipse(
      120,
      330,
      150,
      34,
      vgrad([
        [0, P.waterLight],
        [1, P.water],
      ]),
    ) +
    path(
      "M60 326 h50 M140 338 h40 M240 280 h24",
      "none",
      `stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity=".7"`,
    )
  );
}
function station(x, y) {
  let s = floorShadow(x + 40, y + 2, 64, 6, 0.24);
  s +=
    rect(
      x,
      y - 54,
      80,
      54,
      vgrad([
        [0, "#f6efe2"],
        [1, "#e6d8c0"],
      ]),
    ) + rect(x + 58, y - 54, 22, 54, "#d9c8aa", 'opacity=".8"');
  s += poly(
    [
      [x - 8, y - 52],
      [x + 40, y - 84],
      [x + 88, y - 52],
    ],
    vgrad([
      [0, P.teal],
      [1, shade(P.teal, 0.15)],
    ]),
  );
  s +=
    rect(x + 12, y - 40, 22, 18, "#cfe9f2") +
    rect(x + 22, y - 40, 2, 18, "#ffffff") +
    rrect(x + 46, y - 36, 18, 36, 2, P.navy);
  // solar panel + antenna
  s += poly(
    [
      [x + 52, y - 74],
      [x + 76, y - 60],
      [x + 72, y - 56],
      [x + 48, y - 70],
    ],
    "#2d4f7a",
  );
  s +=
    line(x + 18, y - 70, x + 18, y - 106, "#9aa7b4", 2.4) + circle(x + 18, y - 108, 3.4, P.coral);
  s += path(
    `M${x + 8} ${y - 114} q10 -10 20 0 M${x + 3} ${y - 120} q15 -16 30 0`,
    "none",
    `stroke="${P.coral}" stroke-width="2" stroke-linecap="round" opacity=".8"`,
  );
  return s;
}
function sensor(x, y) {
  return (
    line(x, y, x, y - 46, "#7d8a96", 3) +
    rrect(x - 9, y - 58, 18, 16, 3, "#ffffff") +
    circle(x, y - 50, 4, P.teal) +
    floorShadow(x, y + 1, 10, 2.5, 0.25)
  );
}
function notes() {
  let s = card(430, 48, 186, 168, 14, "#ffffff", { sd: 9, o: 0.24, dy: 10 });
  s += rrect(446, 64, 84, 9, 4.5, DOM.reading) + rrect(446, 80, 130, 6, 3, "#d3dae3");
  s += rrect(446, 96, 154, 64, 8, "#f1f4fa");
  s += path(
    "M454 146 C474 140 484 112 504 118 C524 124 532 138 552 126 C568 116 578 108 594 110",
    "none",
    `stroke="${DOM.reading}" stroke-width="3" stroke-linecap="round"`,
  );
  s += circle(504, 118, 3.6, DOM.reading) + circle(552, 126, 3.6, DOM.reading);
  s +=
    check(458, 184, 9, P.teal, { shadow: false, ring: false }) +
    bars(476, 180, 116, [1], { h: 7, color: "#d3dae3" });
  s +=
    check(458, 202, 9, P.gold, { shadow: false, ring: false }) +
    bars(476, 198, 90, [1], { h: 7, color: "#d3dae3" });
  return s;
}

export default {
  file: "ds/reality-science.svg",
  w: 640,
  h: 360,
  title: "Science Expedition — Watershed and Ecological Research Station",
  grain: false,
  draw: () =>
    begin() +
    clipRect(
      0,
      0,
      640,
      360,
      20,
      sky(640, 230, "day") +
        sun(392, 62, 20) +
        cloud(170, 50, 0.6) +
        mountains() +
        ground(640, 206, 154, "grass") +
        tree(26, 214, 0.38, { kind: "pine", tone: "#3f7a5c" }) +
        tree(52, 218, 0.46, { kind: "pine" }) +
        tree(352, 220, 0.4, { kind: "pine", tone: "#3f7a5c" }) +
        tree(380, 226, 0.5, { kind: "pine" }) +
        river() +
        station(312, 300) +
        sensor(244, 254) +
        tree(556, 340, 0.56, { tone: "#5f9a6e", seed: 6 }) +
        tuft(330, 330) +
        tuft(612, 344) +
        flower(420, 340, 0.9, { color: P.gold, center: P.coral }) +
        flower(36, 268, 0.8, { color: P.pink }) +
        notes(),
    ),
};
