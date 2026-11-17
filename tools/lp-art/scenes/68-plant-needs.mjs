import { P, g, tr, rect, rrect, circle, ellipse, path, poly, stroke, line, vgrad, rgrad, shade, light, contact, sun, hills, tree, cloud } from "../kit.mjs";
import { plantPot, lightShaft } from "../lib/e.mjs";

// A window-garden sill: a small potted plant (soil visible) in a beam of sunshine, a watering can beside it.
const can = (x, y, s = 1, c = "#3f9a8f") =>
  tr(
    x,
    y,
    contact(0, 0, 56, 7, 0.22) +
      stroke("M-34 -70 Q0 -112 34 -70", shade(c, 0.25), 7) +
      path("M-40 0 L-36 -76 L36 -76 L40 0Z", c) +
      path("M10 -76 L36 -76 L40 0 L14 0Z", shade(c, 0.16), 'opacity=".8"') +
      rect(-38, -82, 76, 8, light(c, 0.2)) +
      rect(-36, -40, 72, 6, shade(c, 0.12), 'opacity=".6"') +
      path("M-38 -22 L-92 -78 L-84 -84 L-34 -38Z", c) +
      `<g transform="rotate(-42 -92 -82)">${rrect(-104, -90, 26, 16, 4, shade(c, 0.1))}${ellipse(-104, -82, 4, 8, shade(c, 0.35))}</g>` +
      path("M-30 -70 Q-34 -40 -30 -6", "none", `stroke="${light(c, 0.35)}" stroke-width="4" opacity=".6"`),
    s,
  );

export default {
  file: "68-plant-needs.svg",
  w: 640,
  h: 400,
  title: "A small plant in a pot sits in the sunshine next to a watering can.",
  draw: () =>
    // wall
    rect(0, 0, 640, 400, vgrad([[0, "#f3e7d2"], [1, "#e8d6ba"]])) +
    // window with outdoor view and sun
    rect(96, 22, 448, 262, "#f7f1e4") +
    `<g>${rect(112, 38, 416, 230, vgrad([[0, "#8ec5e0"], [0.7, "#cfe6ee"], [1, "#eef4e6"]]))}${sun(430, 96, 30)}${cloud(220, 92, 0.6)}${hills(640, 238, { seed: 4, amp: 18 }).replace(/<path/g, '<path clip-path="none"')}</g>`.replace(
      /<g>/,
      `<g clip-path="url(#winclip)"><clipPath id="winclip"><rect x="112" y="38" width="416" height="230"/></clipPath>`,
    ) +
    rect(316, 38, 8, 230, "#f7f1e4") +
    rect(112, 150, 416, 8, "#f7f1e4") +
    poly([[150, 268], [250, 38], [290, 38], [190, 268]], "#ffffff", 'opacity=".14"') +
    // sill
    rect(70, 284, 500, 20, "#efe3cc") +
    rect(70, 284, 500, 5, "#fff8ea") +
    rect(70, 304, 500, 8, "#d7c4a3") +
    // lower wall
    rect(0, 312, 640, 88, vgrad([[0, "#e2cfb1"], [1, "#d4bf9d"]])) +
    // sunbeam across the sill toward the plant
    lightShaft([[420, 60], [470, 60], [330, 296], [214, 296]], 0.22) +
    ellipse(272, 292, 92, 10, "#fff3d6", 'opacity=".55"') +
    plantPot(270, 292, 1.85, { pot: "#c8704f", leaf: "#5c9a5e", sprout: true }) +
    can(454, 292, 1.05),
};
