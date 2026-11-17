import {
  bars,
  begin,
  blur,
  card,
  circle,
  DOM,
  dots,
  ellipse,
  floorShadow,
  grad,
  INK,
  light,
  line,
  P,
  path,
  poly,
  rect,
  rot,
  rrect,
  shade,
  sparkle,
  stage,
  vgrad,
  wave,
} from "../lib/g.mjs";

const D = DOM.listening;
function monitor() {
  let s = floorShadow(262, 304, 120, 8, 0.28);
  s +=
    path(
      "M244 254 h36 l8 46 h-52Z",
      vgrad([
        [0, "#c9d3df"],
        [1, "#9fadbd"],
      ]),
    ) + rrect(212, 296, 100, 8, 4, "#b5c1ce");
  s += blur(rrect(160, 112, 212, 148, 16, INK), 8, 0.24);
  s += rrect(
    152,
    98,
    220,
    156,
    16,
    vgrad([
      [0, "#2b4a6b"],
      [1, P.navyDeep],
    ]),
  );
  s += rrect(
    164,
    110,
    196,
    126,
    8,
    vgrad([
      [0, "#0e5e6e"],
      [1, "#083f4c"],
    ]),
  );
  s += path(
    "M176 176 h20 l8 -26 l12 52 l12 -64 l12 70 l12 -46 l10 24 h22 l8 -16 l10 30 l8 -14 h26",
    "none",
    `stroke="#7fe3d6" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"`,
  );
  s += rrect(176, 214, 60, 8, 4, "#3fa79a", 'opacity=".7"') + circle(342, 218, 5, P.coral);
  return s;
}
function tower(x, y) {
  let s = floorShadow(x, y + 4, 36, 5, 0.25);
  s += path(
    `M${x - 30} ${y} L${x - 4} ${y - 168} H${x + 4} L${x + 30} ${y}`,
    "none",
    `stroke="#8ea3b6" stroke-width="5" stroke-linejoin="round"`,
  );
  for (let i = 1; i < 6; i++) {
    const yy = y - i * 28;
    const hw = 30 - (i * 26) / 6;
    s += line(x - hw, yy, x + hw, yy, "#a9b8c6", 2.6);
    s += line(x - hw, yy, x + (30 - ((i - 1) * 26) / 6), yy + 28, "#a9b8c6", 1.6);
  }
  s += circle(x, y - 176, 8, P.coral) + circle(x - 2, y - 178, 2.6, "#ffffff", 'opacity=".7"');
  [24, 40, 56].forEach(
    (r, i) =>
      (s += path(
        `M${x - r} ${y - 176 - r * 0.6} A${r} ${r} 0 0 1 ${x + r} ${y - 176 - r * 0.6}`,
        "none",
        `stroke="${D}" stroke-width="3.6" stroke-linecap="round" opacity="${0.85 - i * 0.22}"`,
      )),
  );
  return s;
}
function headphones(x, y) {
  return (
    floorShadow(x, y + 2, 46, 5, 0.25) +
    path(
      `M${x - 34} ${y - 18} A34 34 0 0 1 ${x + 34} ${y - 18}`,
      "none",
      `stroke="${shade(P.gold, 0.15)}" stroke-width="8" stroke-linecap="round"`,
    ) +
    rrect(x - 46, y - 32, 24, 34, 11, grad(P.gold, 0.15, 0.15)) +
    rrect(x + 22, y - 32, 24, 34, 11, grad(P.gold, 0.1, 0.2)) +
    rrect(x - 40, y - 26, 10, 22, 5, shade(P.gold, 0.3)) +
    rrect(x + 30, y - 26, 10, 22, 5, shade(P.gold, 0.35))
  );
}
function message() {
  let s = card(386, 96, 132, 82, 12, "#ffffff");
  s +=
    circle(406, 118, 9, light(D, 0.75)) +
    circle(406, 118, 4.5, D) +
    bars(422, 112, 80, [1, 0.6], { gap: 10, h: 5, color: "#ccd4de" });
  s += wave(452, 154, 96, 20, D, 13);
  s += circle(508, 102, 8, P.coral) + circle(508, 102, 3, "#ffffff");
  return s;
}

export default {
  file: "worlds/signal-station.svg",
  w: 640,
  h: 360,
  title: "Signal Station",
  draw: () =>
    begin() +
    stage(D) +
    tower(548, 300) +
    monitor() +
    message() +
    headphones(110, 300) +
    dots(D, { right: false }),
};
