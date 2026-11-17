import { begin, blob, bubble, bars, sparkle, floorShadow, grad, path, rect, rrect, circle, ellipse, poly, vgrad, P, light, shade, mix } from "../lib/g.mjs";
import { tree } from "../kit.mjs";

// A warm family home (three-quarter view) with two speech bubbles: the family hub picture.
function house() {
  const wall = "#f4e6cf";
  let s = "";
  // side wall (shade side, right)
  s += poly([[268, 150], [318, 128], [318, 226], [268, 244]], shade(wall, 0.16));
  s += poly([[268, 150], [318, 128], [318, 136], [268, 158]], shade(wall, 0.24), 'opacity=".6"');
  // side window
  s += poly([[284, 168], [304, 160], [304 , 186], [284, 194]], "#f6c86a") + poly([[284, 168], [304, 160], [304, 166], [284, 174]], "#fbe2a0");
  // front wall
  s += rect(140, 150, 128, 94, vgrad([[0, light(wall, 0.2)], [1, wall]]));
  // front gable
  s += poly([[132, 154], [204, 92], [276, 154]], vgrad([[0, light(wall, 0.25)], [1, wall]]));
  // roof: front edge and side slope
  s += poly([[204, 84], [262, 62], [330, 128], [276, 154]], vgrad([[0, P.coral], [1, shade(P.coral, 0.18)]]));
  s += poly([[204, 84], [262, 62], [266, 70], [210, 92]], light(P.coral, 0.25));
  s += poly([[124, 158], [204, 84], [212, 92], [132, 164]], shade(P.coral, 0.1)) + poly([[204, 84], [284, 158], [276, 164], [204, 98]], shade(P.coral, 0.3));
  // chimney
  s += rect(282, 64, 18, 36, shade(P.brick, 0.05)) + rect(278, 60, 26, 8, shade(P.brick, 0.2));
  // round attic window
  s += circle(204, 126, 13, "#ffffff") + circle(204, 126, 10, "#f6c86a") + rect(203, 116, 2, 20, "#ffffff") + rect(194, 125, 20, 2, "#ffffff");
  // door
  s += rrect(188, 186, 34, 58, 4, vgrad([[0, P.tealLight], [1, P.teal]])) + path("M188 204 a17 17 0 0 1 34 0Z", "none") + circle(214, 216, 2.6, P.goldLight);
  s += rect(182, 242, 46, 6, "#d9cfc0");
  // windows with warm light
  for (const wx of [152, 236]) {
    if (wx > 230) {
      s += rect(wx - 2, 176, 30, 34, "#ffffff") + rect(wx + 1, 179, 24, 28, vgrad([[0, "#fde7a6"], [1, "#f2b955"]])) + rect(wx + 12, 179, 2, 28, "#ffffff") + rect(wx + 1, 192, 24, 2, "#ffffff") + rect(wx - 4, 210, 34, 4, "#e2d6c4");
    } else {
      s += rect(wx - 2, 176, 30, 34, "#ffffff") + rect(wx + 1, 179, 24, 28, vgrad([[0, "#fde7a6"], [1, "#f2b955"]])) + rect(wx + 12, 179, 2, 28, "#ffffff") + rect(wx + 1, 192, 24, 2, "#ffffff") + rect(wx - 4, 210, 34, 4, "#e2d6c4");
    }
  }
  return s;
}

export default {
  file: "ds/family-home.svg",
  w: 420,
  h: 300,
  title: "A home with two speech bubbles",
  grain: false,
  draw: () =>
    begin() +
    blob(214, 168, 150, 118, "#fbecd2", { tilt: 6 }) +
    floorShadow(228, 248, 130, 12, 0.2) +
    ellipse(224, 250, 140, 14, "#cfe3c2") +
    tree(122, 250, 0.55, { kind: "bush", tone: "#6aa275" }) +
    house() +
    tree(330, 252, 0.5, { kind: "bush", tone: "#5f9a6e" }) +
    bubble(36, 54, 98, 58, P.blue, { tail: "br" }) + bars(52, 72, 66, [1, 0.62], { gap: 14, h: 6, color: "#ffffff" }) +
    bubble(300, 28, 92, 54, P.teal, { tail: "bl" }) + bars(316, 45, 60, [1, 0.6], { gap: 13, h: 6, color: "#ffffff" }) +
    sparkle(48, 168, 8, P.gold) + circle(374, 168, 4.5, P.coral) + sparkle(392, 214, 6, P.navy) + circle(64, 232, 4, P.gold),
};
