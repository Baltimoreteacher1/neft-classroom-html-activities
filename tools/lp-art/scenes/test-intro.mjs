import {
  bars,
  begin,
  card,
  check,
  circle,
  DOM,
  floorShadow,
  grad,
  halo,
  light,
  line,
  P,
  path,
  pencil,
  rect,
  rot,
  rrect,
  shade,
  sparkle,
  vgrad,
  wash,
} from "../lib/g.mjs";

function clock(x, y, r) {
  return (
    floorShadow(x + 4, y + r + 6, r * 0.8, 5, 0.18) +
    circle(x + 3, y + 6, r, "#1c2f4a", 'opacity=".12"') +
    circle(x, y, r, grad(P.coral, 0.12, 0.12)) +
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
      .map((i) => {
        const a = (i * Math.PI) / 2;
        return line(
          x + Math.cos(a) * r * 0.62,
          y + Math.sin(a) * r * 0.62,
          x + Math.cos(a) * r * 0.7,
          y + Math.sin(a) * r * 0.7,
          "#9aa7b4",
          2.4,
        );
      })
      .join("") +
    line(x, y, x, y - r * 0.5, P.navy, 3.2) +
    line(x, y, x + r * 0.36, y + r * 0.12, P.navy, 3.2) +
    circle(x, y, 3, P.coral) +
    rrect(x - r * 0.62, y + r * 0.78, 9, 12, 4, shade(P.coral, 0.2)) +
    rrect(x + r * 0.62 - 9, y + r * 0.78, 9, 12, 4, shade(P.coral, 0.25))
  );
}
const ROWS = [DOM.listening, DOM.reading, DOM.speaking, DOM.writing];

export default {
  file: "ds/test-intro.svg",
  w: 480,
  h: 300,
  title: "A clipboard with a four-part answer sheet, a pencil and a clock",
  draw: () =>
    begin() +
    wash(480, 300, "#f1f5fb", "#dfe7f3", { glow: "#ffffff" }) +
    halo(250, 150, 122, "#d3def0", 0.85) +
    floorShadow(250, 272, 96, 8, 0.18) +
    clock(126, 92, 34) +
    rot(
      250,
      150,
      2,
      card(186, 42, 128, 226, 16, P.navy, { flat: true, edge: false }) +
        rrect(
          186,
          42,
          128,
          226,
          16,
          vgrad([
            [0, "#2c5a8a"],
            [1, P.navy],
          ]),
        ) +
        card(198, 66, 104, 186, 8, "#ffffff", { sd: 3, o: 0.16, dy: 3 }) +
        rrect(
          222,
          32,
          56,
          24,
          8,
          vgrad([
            [0, "#c9d3df"],
            [1, "#a7b4c4"],
          ]),
        ) +
        rrect(236, 26, 28, 14, 7, "#c9d3df") +
        circle(250, 33, 3.5, "#6f8094") +
        ROWS.map((c, i) => {
          const yy = 92 + i * 40;
          return (
            (i < 2
              ? check(218, yy, 11, c, { shadow: false, ring: false })
              : circle(218, yy, 11, "none", `stroke="${c}" stroke-width="3"`)) +
            bars(236, yy - 7, 52, [1, 0.62], { gap: 10, h: 5, color: "#cfd8e2" })
          );
        }).join(""),
    ) +
    pencil(318, 236, 170, -62, { body: P.gold }) +
    sparkle(108, 196, 7, P.gold) +
    sparkle(372, 58, 9, P.teal) +
    circle(396, 120, 4, P.coral) +
    circle(140, 250, 3.5, "#7f9fd6") +
    sparkle(414, 214, 5, P.navy),
};
