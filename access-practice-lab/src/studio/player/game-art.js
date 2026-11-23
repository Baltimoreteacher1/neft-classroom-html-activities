// The picture the puzzle game builds, drawn as SVG. A piece is a window onto the same scene, so pieces that belong
// side by side visibly continue each other (hill lines, the roof, the path).

import { nid, sv } from "./util.js";

export const SCENE_W = 300;
export const SCENE_H = 200;

function scene() {
  const sky = nid("sky");
  const g = sv("g");
  g.append(
    sv(
      "defs",
      null,
      sv("linearGradient", { id: sky, x1: "0", y1: "0", x2: "0", y2: "1" }, sv("stop", { offset: "0", "stop-color": "#7cc4f0" }), sv("stop", { offset: "1", "stop-color": "#ffe8b0" })),
    ),
    sv("rect", { width: SCENE_W, height: SCENE_H, fill: `url(#${sky})` }),
    sv("circle", { cx: 244, cy: 44, r: 22, fill: "#ffd24a" }),
    sv("circle", { cx: 244, cy: 44, r: 30, fill: "#ffd24a", opacity: "0.25" }),
    sv("ellipse", { cx: 70, cy: 38, rx: 30, ry: 11, fill: "#ffffff", opacity: "0.95" }),
    sv("ellipse", { cx: 92, cy: 46, rx: 24, ry: 9, fill: "#ffffff", opacity: "0.95" }),
    sv("path", { d: "M0 128 Q60 88 130 118 T300 104 V200 H0Z", fill: "#9ed7aa" }),
    sv("path", { d: "M0 156 Q90 126 170 150 T300 140 V200 H0Z", fill: "#5db26f" }),
    sv("path", { d: "M120 200 Q150 170 168 150 L184 150 Q172 176 190 200Z", fill: "#d9b27c" }),
    sv("rect", { x: 112, y: 104, width: 78, height: 54, fill: "#f0d3a8" }),
    sv("polygon", { points: "104,106 151,70 198,106", fill: "#b84a3a" }),
    sv("rect", { x: 140, y: 126, width: 22, height: 32, fill: "#7a4b2a" }),
    sv("rect", { x: 120, y: 118, width: 16, height: 16, fill: "#bfe6ff" }),
    sv("rect", { x: 168, y: 118, width: 16, height: 16, fill: "#bfe6ff" }),
    sv("rect", { x: 44, y: 112, width: 8, height: 46, fill: "#7a5230" }),
    sv("circle", { cx: 48, cy: 100, r: 24, fill: "#3f9a5a" }),
    sv("circle", { cx: 38, cy: 108, r: 14, fill: "#4cae69" }),
    ...[
      [214, 172, "#e0568a"],
      [236, 166, "#f2b441"],
      [258, 176, "#ffffff"],
      [80, 176, "#e0568a"],
      [100, 170, "#ffffff"],
    ].map(([cx, cy, fill]) => sv("circle", { cx, cy, r: 5, fill, stroke: "#2a5a35", "stroke-width": "1" })),
  );
  return g;
}

/** The grid for n pieces: columns and rows. */
export function gridFor(n) {
  const cols = n <= 4 ? 2 : n <= 9 ? 3 : 4;
  return { cols, rows: Math.ceil(n / cols) };
}

/** An SVG window onto one cell of the scene. */
export function fragment(cell, cols, rows, extra = {}) {
  const w = SCENE_W / cols;
  const hgt = SCENE_H / rows;
  const x = (cell % cols) * w;
  const y = Math.floor(cell / cols) * hgt;
  return sv("svg", { class: "sp-frag", viewBox: `${x} ${y} ${w} ${hgt}`, "aria-hidden": "true", focusable: "false", preserveAspectRatio: "xMidYMid slice", ...extra }, scene());
}
