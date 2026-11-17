import {
  bars,
  begin,
  card,
  check,
  circle,
  floorShadow,
  grad,
  halo,
  light,
  P,
  path,
  rect,
  rot,
  rrect,
  shade,
  sparkle,
  star,
  vgrad,
  wash,
} from "../lib/g.mjs";

function clipboard(x, y, w, h, color) {
  return (
    card(x, y, w, h, 16, color, { flat: true, edge: false }) +
    rrect(
      x,
      y,
      w,
      h,
      16,
      vgrad([
        [0, light(color, 0.14)],
        [1, shade(color, 0.12)],
      ]),
    ) +
    rrect(x + w - 22, y + 10, 12, h - 20, 6, shade(color, 0.14), 'opacity=".5"')
  );
}
function rosette(x, y) {
  const C = P.gold;
  let s = path(
    `M${x - 16} ${y + 10} L${x - 30} ${y + 58} L${x - 18} ${y + 50} L${x - 10} ${y + 62} L${x - 2} ${y + 16}Z`,
    shade(P.coral, 0.08),
  );
  s += path(
    `M${x + 16} ${y + 10} L${x + 30} ${y + 58} L${x + 18} ${y + 50} L${x + 10} ${y + 62} L${x + 2} ${y + 16}Z`,
    shade(P.coral, 0.22),
  );
  let d = "";
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const r = i % 2 ? 26 : 30;
    d += `${i ? "L" : "M"}${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)}`;
  }
  s += path(`${d}Z`, grad(C, 0.2, 0.15));
  s +=
    circle(x, y, 20, "#fff7e2") +
    circle(x, y, 17, grad(C, 0.25, 0.05)) +
    star(x, y + 1, 10, "#fff7e2");
  return s;
}

export default {
  file: "ds/test-complete.svg",
  w: 480,
  h: 300,
  title: "A finished answer sheet with a check mark and a ribbon",
  draw: () =>
    begin() +
    wash(480, 300, "#eaf7f5", "#d6eeea", { glow: "#ffffff" }) +
    halo(238, 150, 118, "#c3e8e1", 0.8) +
    floorShadow(246, 272, 96, 8, 0.18) +
    rot(
      240,
      150,
      -3,
      clipboard(178, 42, 128, 226, P.teal) +
        card(190, 66, 104, 186, 8, "#ffffff", { sd: 3, o: 0.16, dy: 3 }) +
        rrect(
          214,
          32,
          56,
          24,
          8,
          vgrad([
            [0, "#3b4e66"],
            [1, P.navy],
          ]),
        ) +
        rrect(228, 26, 28, 14, 7, "#3b4e66") +
        circle(242, 33, 3.5, "#d7e0ea") +
        check(242, 118, 30, P.gold, { shadow: false, ring: false }) +
        bars(208, 166, 68, [1, 0.8, 1, 0.55], { gap: 15, h: 6, color: "#cfd8e2" }),
    ) +
    rot(318, 196, 10, rosette(318, 196)) +
    sparkle(142, 80, 9, P.gold) +
    sparkle(352, 70, 7, P.coral) +
    circle(126, 196, 4.5, "#7f9fd6") +
    circle(372, 132, 4, P.gold) +
    sparkle(390, 252, 5, P.navy) +
    circle(150, 252, 3.5, P.coral),
};
