import { begin, wash, halo, blob, floorShadow, star, sparkle, confetti, rot, grad, path, rect, rrect, ellipse, circle, vgrad, P, light, shade, mix } from "../lib/g.mjs";

const GOLD = P.gold;
// Trophy cup, centre x 240, cup rim at y 70, plinth on y 236.
function trophy() {
  const cup = "M186 70 H294 V92 C294 140 270 166 240 170 C210 166 186 140 186 92Z";
  let s = "";
  // handles (behind the cup)
  s += path("M188 82 C150 80 146 132 196 140 L200 128 C166 122 168 96 190 96Z", shade(GOLD, 0.16));
  s += path("M292 82 C330 80 334 132 284 140 L280 128 C314 122 312 96 290 96Z", shade(GOLD, 0.24));
  // cup body: lit left, shade right
  s += path(cup, vgrad([[0, light(GOLD, 0.2)], [1, shade(GOLD, 0.12)]]));
  s += path("M246 70 H294 V92 C294 140 270 166 240 170 C262 150 266 120 266 92 V70Z", shade(GOLD, 0.16), 'opacity=".7"');
  s += path("M198 76 H210 V100 C210 128 220 146 232 158 C210 150 198 128 198 100Z", "#fff6d8", 'opacity=".55"');
  s += ellipse(240, 70, 54, 7, light(GOLD, 0.35)) + ellipse(240, 71, 46, 4.5, shade(GOLD, 0.25));
  s += star(240, 112, 19, "#fff4d0") + star(240, 112, 13, light(GOLD, 0.45));
  // stem and knot
  s += path("M230 168 H250 L246 192 H234Z", shade(GOLD, 0.12)) + ellipse(240, 192, 18, 5, light(GOLD, 0.15));
  s += path("M222 194 H258 L262 206 H218Z", grad(GOLD, 0.1, 0.2));
  // plinth
  s += rrect(196, 206, 88, 30, 6, vgrad([[0, P.tealLight], [1, P.teal]]));
  s += rrect(196, 206, 88, 6, 3, light(P.tealLight, 0.25));
  s += rect(258, 212, 26, 24, shade(P.teal, 0.18), 'opacity=".55"');
  s += rrect(216, 216, 48, 10, 3, "#e9f4f2", 'opacity=".9"');
  return s;
}

export default {
  file: "ds/complete.svg",
  w: 480,
  h: 300,
  title: "A trophy cup on a stand",
  draw: () =>
    begin() +
    wash(480, 300, "#eaf7f5", "#d4eeea", { glow: "#ffffff", gy: 0.42 }) +
    halo(240, 140, 136, "#bfe6df", 0.85) +
    circle(240, 140, 100, "#c6ebe4", 'opacity=".7"') +
    floorShadow(242, 257, 90, 10, 0.24) +
    `<g transform="translate(240 146) scale(1.22) translate(-240 -146)">${trophy()}</g>` +
    confetti([
      [120, 74, "r", P.coral, 30], [356, 64, "r", GOLD, -20], [96, 168, "d", P.teal], [392, 150, "s", GOLD],
      [146, 226, "r", "#7f9fd6", 60], [348, 214, "d", P.coral], [168, 44, "d", GOLD], [318, 36, "r", P.tealLight, 15],
      [76, 114, "s", "#7f9fd6"], [410, 236, "r", P.teal, -40], [404, 92, "d", "#7f9fd6"],
    ]) +
    sparkle(296, 60, 8, "#ffffff") + sparkle(178, 118, 5, "#ffffff"),
};
