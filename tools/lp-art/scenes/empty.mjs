import {
  bars,
  begin,
  blob,
  card,
  check,
  circle,
  floorShadow,
  halo,
  light,
  P,
  rot,
  rrect,
  sparkle,
  wash,
} from "../lib/g.mjs";

// Empty state: a fresh practice sheet waiting to be filled in, with a check badge.
export default {
  file: "ds/empty.svg",
  w: 480,
  h: 300,
  title: "A blank practice sheet with a check badge",
  draw: () =>
    begin() +
    wash(480, 300, "#f6f8fd", "#e6ecf7", { glow: "#ffffff", gy: 0.4 }) +
    blob(240, 150, 128, 112, "#dce5f5", { tilt: -8 }) +
    floorShadow(244, 262, 120, 10, 0.16) +
    // back sheet
    rot(240, 150, -7, card(168, 62, 150, 186, 12, "#e9eef6", { o: 0.12 })) +
    // front sheet
    rot(
      240,
      150,
      3,
      card(170, 52, 150, 192, 12, "#ffffff") +
        rrect(170, 52, 150, 30, 12, P.navy) +
        rrect(170, 70, 150, 12, 0, P.navy) +
        circle(186, 67, 3.6, P.gold) +
        circle(198, 67, 3.6, light(P.teal, 0.3)) +
        circle(210, 67, 3.6, "#e98a6c") +
        rrect(188, 100, 64, 8, 4, "#cdd6e2") +
        bars(188, 124, 114, [1, 1, 0.82, 1, 0.6], { gap: 20, h: 3, color: "#e2e8f0" }) +
        rrect(188, 214, 40, 14, 7, "#eef2f7"),
    ) +
    check(318, 214, 30, P.teal) +
    sparkle(126, 92, 9, P.gold) +
    sparkle(368, 70, 7, "#7f9fd6") +
    circle(110, 196, 4, "#e98a6c") +
    circle(380, 122, 3.5, P.gold) +
    sparkle(392, 236, 5, P.navy),
};
