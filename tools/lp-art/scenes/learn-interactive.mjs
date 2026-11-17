import {
  bars,
  begin,
  blob,
  blur,
  card,
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
  vgrad,
  wash,
} from "../lib/g.mjs";

// A learning-app screen: four stage chips (Notice, Predict, Interact, Respond), three linked cards
// (Feedback, Revise, Apply) and an answer bar with a check and a go arrow. Seven stages, no printed words.
const CH = [DOM.listening, DOM.reading, DOM.speaking, DOM.writing];
const CARDS = [P.teal, P.gold, P.coral];
function screen() {
  let s = blur(rrect(46, 52, 272, 190, 20, INK), 9, 0.24);
  s += rrect(
    40,
    40,
    280,
    192,
    20,
    vgrad([
      [0, "#24476b"],
      [1, P.navyDeep],
    ]),
  );
  s += rrect(
    50,
    50,
    260,
    172,
    12,
    vgrad([
      [0, "#ffffff"],
      [1, "#f4f1ea"],
    ]),
  );
  CH.forEach((c, i) => {
    const x = 62 + i * 61;
    s +=
      rrect(x, 62, 52, 20, 10, light(c, 0.82)) +
      circle(x + 11, 72, 5, c) +
      rrect(x + 20, 69.5, 24, 5, 2.5, light(c, 0.45));
  });
  s += line(98, 128, 262, 128, "#d6dce4", 3);
  CARDS.forEach((c, i) => {
    const x = 64 + i * 80;
    s +=
      rrect(x + 2, 100, 68, 56, 10, "#1c2f4a", 'opacity=".08"') +
      rrect(x, 96, 68, 56, 10, "#ffffff") +
      rrect(x, 96, 68, 6, 3, c) +
      circle(x + 15, 118, 7, light(c, 0.7)) +
      circle(x + 15, 118, 3.5, c) +
      bars(x + 10, 132, 48, [1, 0.6], { gap: 8, h: 4, color: "#d3dae3" });
  });
  s += rrect(64, 170, 232, 38, 12, light(P.teal, 0.88));
  s +=
    check(84, 189, 11, P.teal, { shadow: false, ring: false }) +
    bars(102, 182, 124, [1, 0.62], { gap: 9, h: 5, color: light(P.teal, 0.45) });
  s +=
    rrect(246, 178, 40, 22, 8, P.navy) +
    path(
      "M258 189 h14 m-5 -5 l5 5 l-5 5",
      "none",
      `stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`,
    );
  return s;
}
// pointing hand-cursor tapping the arrow button
const cursor = (x, y) =>
  blur(path(`M${x + 3} ${y + 5} l0 30 l8 -7 l6 13 l6 -3 l-6 -12 l11 -1Z`, INK), 2.5, 0.3) +
  path(
    `M${x} ${y} l0 30 l8 -7 l6 13 l6 -3 l-6 -12 l11 -1Z`,
    "#ffffff",
    `stroke="${P.navy}" stroke-width="2.4" stroke-linejoin="round"`,
  );

export default {
  file: "ds/learn-interactive.svg",
  w: 360,
  h: 270,
  title:
    "Interactive Language Learning Engine showing Notice, Predict, Interact, Respond, Feedback, Revise, and Apply",
  grain: false,
  draw: () =>
    begin() +
    wash(360, 270, "#fcf8f0", "#f1e8d6", { r: 22, glow: "#ffffff", gy: 0.4 }) +
    blob(180, 140, 150, 112, "#efe2c8", { tilt: -6 }) +
    floorShadow(184, 246, 130, 8, 0.18) +
    screen() +
    circle(274, 196, 14, "#ffffff", 'opacity=".35"') +
    cursor(272, 192) +
    sparkle(26, 46, 7, P.gold) +
    sparkle(338, 112, 6, P.coral) +
    circle(22, 196, 4, P.teal) +
    circle(336, 34, 3.5, "#7f9fd6"),
};
