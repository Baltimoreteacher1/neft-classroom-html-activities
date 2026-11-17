import { P, g, tr, rect, rrect, circle, ellipse, path, poly, stroke, line, vgrad, rgrad, shade, light, mix } from "../kit.mjs";

// A museum display of four Jamestown finds, left to right: an iron fishhook, a small toy horse,
// a pair of brass cymbals, and two bone dice. Each sits on a linen mat under soft case lighting.
const mat = (cx, cy, w = 134, h = 186) =>
  g(rrect(cx - w / 2 + 4, cy - h / 2 + 6, w, h, 10, "#0b1c2c", 'opacity=".35"') + rrect(cx - w / 2, cy - h / 2, w, h, 10, vgrad([[0, "#f1e8d6"], [1, "#e2d5bb"]])) + rrect(cx - w / 2 + 6, cy - h / 2 + 6, w - 12, h - 12, 7, "none", 'stroke="#cbbb9c" stroke-width="1.5"'));

const fishhook = (x, y) => {
  const iron = "#6f6a66";
  return tr(
    x,
    y,
    stroke("M6 -52 L6 18 Q6 46 -16 46 Q-36 46 -36 22 L-36 12", "#1c2f4a", 9, 'opacity=".15" transform="translate(4 4)"') +
      circle(6, -58, 8, "none", `stroke="${iron}" stroke-width="5"`) +
      stroke("M6 -50 L6 18 Q6 46 -16 46 Q-36 46 -36 22 L-36 14", iron, 6) +
      poly([[-39.5, 14], [-36, -6], [-32.5, 14]], iron) +
      poly([[-33.5, 2], [-26, 14], [-33, 11]], iron) +
      stroke("M8 -40 L8 14", "#a19a92", 1.8, 'opacity=".7"') +
      circle(-6, 40, 3, "#9a5a34", 'opacity=".55"') +
      circle(4, -10, 2.4, "#9a5a34", 'opacity=".5"') +
      circle(-30, 30, 2, "#9a5a34", 'opacity=".5"'),
  );
};

const horse = (x, y) => {
  const c = "#a97a4c";
  const d = shade(c, 0.25);
  return tr(
    x,
    y,
    ellipse(2, 44, 48, 6, "#1c2f4a", 'opacity=".2"') +
      // far legs
      path("M-24 8 L-28 42 L-21 42 L-17 10Z", d) +
      path("M18 8 L16 42 L23 42 L25 10Z", d) +
      // body
      path("M-34 -6 Q-36 -22 -18 -22 L20 -22 Q34 -22 34 -6 Q34 12 18 12 L-20 12 Q-34 12 -34 -6Z", c) +
      path("M-30 6 Q-10 14 30 4 L30 8 Q20 14 -20 14Z", d, 'opacity=".6"') +
      // neck + head
      path("M14 -18 Q20 -40 28 -52 Q34 -62 46 -60 Q54 -56 62 -44 Q66 -36 60 -32 Q54 -30 48 -36 L40 -38 Q36 -24 34 -8Z", c) +
      path("M28 -52 Q34 -62 46 -60 Q40 -56 34 -48Z", light(c, 0.2)) +
      poly([[34, -58], [35, -72], [42, -60]], c) + poly([[40, -60], [44, -71], [47, -58]], d) +
      circle(45, -50, 2.4, "#3a2a1c") + circle(59, -38, 1.4, "#3a2a1c") +
      // carved mane
      stroke("M30 -54 Q22 -40 18 -20", d, 5) +
      // near legs
      path("M-16 8 L-18 44 L-10 44 L-8 10Z", c) +
      path("M24 6 L26 44 L33 44 L32 6Z", c) +
      // tail
      stroke("M-34 -10 Q-46 -4 -44 16", d, 5) +
      // wear highlights
      path("M-26 -18 Q0 -24 24 -18", "none", `stroke="${light(c, 0.35)}" stroke-width="3" opacity=".7"`),
  );
};

const cymbal = (x, y, a, s = 1) => {
  const brass = "#c9a24a";
  return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">${ellipse(4, 6, 44, 18, "#1c2f4a", 'opacity=".2"')}${ellipse(0, 0, 44, 18, brass)}${ellipse(0, -2, 40, 15, light(brass, 0.18))}${ellipse(0, -1, 30, 11, "none", `stroke="${shade(brass, 0.15)}" stroke-width="1.2" opacity=".7"`)}${ellipse(0, -1, 20, 7.5, "none", `stroke="${shade(brass, 0.15)}" stroke-width="1.2" opacity=".7"`)}${ellipse(0, -4, 12, 6, shade(brass, 0.12))}${ellipse(-2, -6, 8, 3.2, light(brass, 0.4))}${circle(0, -5, 2, "#5a4a2a")}${path("M-36 -6 Q-10 -16 20 -12", "none", `stroke="#fff3c4" stroke-width="2.5" opacity=".6"`)}${ellipse(14, 6, 6, 2, "#5e8a6a", 'opacity=".35"')}</g>`;
};

const die = (x, y, s, faces) => {
  const bone = "#efe4cc";
  const top = light(bone, 0.25);
  const side = shade(bone, 0.18);
  const pip = (px, py) => circle(px, py, 2.6, "#4a3b2c");
  let b = ellipse(4, 22, 26, 6, "#1c2f4a", 'opacity=".22"');
  b += poly([[-18, -10], [0, -20], [18, -10], [0, 0]], top);
  b += poly([[-18, -10], [0, 0], [0, 24], [-18, 14]], bone);
  b += poly([[0, 0], [18, -10], [18, 14], [0, 24]], side);
  for (const [px, py] of faces.top) b += pip(px, py);
  for (const [px, py] of faces.left) b += pip(px, py);
  for (const [px, py] of faces.right) b += pip(px, py);
  return tr(x, y, b, s);
};

export default {
  file: "68-jamestown-artifacts.svg",
  w: 640,
  h: 400,
  title: "Old objects found at Jamestown: a metal fishhook, a small toy horse, a pair of cymbals, and dice.",
  draw: () =>
    rect(0, 0, 640, 400, vgrad([[0, "#1f3a4f"], [1, "#132838"]])) +
    // case light from above
    poly([[150, 0], [490, 0], [620, 400], [20, 400]], "#fff3d6", 'opacity=".06"') +
    rect(0, 0, 640, 400, rgrad([[0, "#fff3d6", 0.16], [1, "#fff3d6", 0]], { cx: 0.5, cy: 0.1, r: 0.7 })) +
    // display plinth
    rect(0, 322, 640, 78, vgrad([[0, "#24435a"], [1, "#16303f"]])) +
    rect(0, 318, 640, 6, "#35586f") +
    mat(94, 214) +
    mat(244, 214) +
    mat(396, 214) +
    mat(546, 214) +
    tr(102, 210, fishhook(0, 0), 1.25) +
    tr(238, 220, horse(0, 0), 1.08) +
    cymbal(390, 184, -8, 1.1) +
    cymbal(404, 246, 6, 1.0) +
    die(522, 200, 1.35, { top: [[0, -10]], left: [[-13, -0.5], [-5, 3.9], [-13, 10.1], [-5, 14.5]], right: [[5.4, 4.2], [12.6, 9.8]] }) +
    die(572, 250, 1.1, { top: [[-6, -10], [6, -10]], left: [[-9, 7]], right: [[4.5, 3.5], [9, 7], [13.5, 10.5]] }),
};
