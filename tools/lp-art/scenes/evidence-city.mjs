import {
  bars,
  begin,
  blur,
  card,
  circle,
  DOM,
  dots,
  floorShadow,
  grad,
  INK,
  light,
  line,
  magnifier,
  mix,
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
} from "../lib/g.mjs";

const D = DOM.reading;
// A block building: front face, lit windows, shade side, flat roof cap.
function tower(x, w, h, c, { cols = 2, rows = 5 } = {}) {
  const y = 302;
  let s = blur(rect(x + 8, y - h + 8, w, h, INK), 6, 0.2);
  s += rect(
    x,
    y - h,
    w,
    h,
    vgrad([
      [0, light(c, 0.12)],
      [1, shade(c, 0.08)],
    ]),
  );
  s += rect(x + w - 12, y - h, 12, h, shade(c, 0.18), 'opacity=".7"');
  s += rect(x - 4, y - h - 8, w + 8, 10, shade(c, 0.25));
  const ww = (w - 20 - (cols - 1) * 10) / cols;
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++) {
      const wx = x + 10 + k * (ww + 10);
      const wy = y - h + 16 + r * 30;
      if (wy + 18 > y - 18) continue;
      s += rrect(wx, wy, ww - 2, 18, 2, (r + k) % 3 === 0 ? "#fde7a6" : light(c, 0.65));
    }
  return s;
}
function chart() {
  let s = card(410, 84, 160, 112, 14, "#ffffff");
  s += rrect(426, 100, 70, 8, 4, D);
  s += line(430, 180, 554, 180, "#d6dce4", 2);
  [
    [436, 24, "#9fb0d6"],
    [466, 40, "#9fb0d6"],
    [496, 56, D],
    [526, 46, P.gold],
  ].forEach(
    ([x, h, c]) =>
      (s += rrect(
        x,
        180 - h,
        22,
        h,
        4,
        vgrad([
          [0, light(c, 0.15)],
          [1, c],
        ]),
      )),
  );
  s += circle(562, 92, 8, P.coral) + circle(562, 92, 3, "#ffffff");
  return s;
}

export default {
  file: "worlds/evidence-city.svg",
  w: 640,
  h: 360,
  title: "Evidence City",
  draw: () =>
    begin() +
    stage(D) +
    tower(108, 76, 140, "#6b85b8", { cols: 2, rows: 4 }) +
    tower(194, 92, 214, D, { cols: 2, rows: 7 }) +
    path(
      "M240 88 v-22",
      "none",
      `stroke="${shade(D, 0.2)}" stroke-width="3" stroke-linecap="round"`,
    ) +
    path("M240 66 l18 6 l-18 6Z", P.coral) +
    tower(296, 80, 118, "#3f5f8f", { cols: 2, rows: 3 }) +
    chart() +
    magnifier(474, 252, 34, {
      deg: 45,
      inner: path(
        "M452 256 C462 236 486 236 496 256",
        "none",
        `stroke="${D}" stroke-width="4" stroke-linecap="round"`,
      ),
    }) +
    dots(D),
};
