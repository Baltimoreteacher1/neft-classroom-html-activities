import { P, g, tr, rect, rrect, circle, ellipse, path, poly, stroke, line, vgrad, rgrad, shade, light, mix, text } from "../../../access-practice-lab/src/art/kit.js";

// Top-down cafeteria tray on a table: apple, sandwich, carton of milk, carrots (exactly these four foods).
const tray = (x, y, w, h) =>
  g(
    rrect(x + 6, y + 12, w, h, 26, "#1c2f4a", 'opacity=".18"') +
      rrect(x, y, w, h, 26, "#5f8fa6") +
      rrect(x + 4, y + 4, w - 8, h - 8, 22, light("#5f8fa6", 0.12)) +
      // moulded compartments
      rrect(x + 22, y + 22, 300, 150, 18, shade("#5f8fa6", 0.08)) +
      rrect(x + 338, y + 22, w - 360, 150, 18, shade("#5f8fa6", 0.08)) +
      rrect(x + 22, y + 186, 230, h - 208, 18, shade("#5f8fa6", 0.08)) +
      rrect(x + 266, y + 186, w - 288, h - 208, 18, shade("#5f8fa6", 0.08)),
  );

const sandwich = (x, y) => {
  const tri = (pts, c) => poly(pts, c);
  let b = "";
  // two triangle halves, seen from above
  b += tri([[-118, 50], [-6, -44], [-6, 50]], "#c98a4a") + tri([[-112, 46], [-10, -38], [-10, 46]], "#f1d9a6");
  b += tri([[-104, 42], [-14, -30], [-14, 42]], "#f6e3b8");
  b += stroke("M-104 42 Q-70 30 -14 34", "#7fb069", 5) + stroke("M-100 46 Q-60 40 -14 44", "#e0574b", 4, 'opacity=".9"');
  b += tri([[8, -48], [118, -48], [8, 46]], "#c98a4a") + tri([[12, -44], [112, -44], [12, 40]], "#f1d9a6") + tri([[18, -38], [100, -38], [18, 30]], "#f6e3b8");
  b += stroke("M100 -38 Q60 -28 18 -30", "#7fb069", 5) + stroke("M96 -44 Q60 -40 14 -42", "#e8b84a", 4);
  // crumb texture
  for (const [cx, cy] of [[-50, 20], [-30, 5], [-40, 30], [40, -20], [55, -5], [30, 0]]) b += circle(cx, cy, 1.6, "#e2c48c");
  const sh = poly([[-112, 58], [0, -36], [0, 58]], "#1c2f4a", 'opacity=".16"') + poly([[16, -38], [126, -38], [16, 56]], "#1c2f4a", 'opacity=".16"');
  return tr(x, y, sh + b);
};

const apple = (x, y, r = 40) =>
  tr(
    x,
    y,
    ellipse(6, 10, r * 1.02, r * 0.95, "#1c2f4a", 'opacity=".2"') +
      path(`M0 ${-r * 0.78} C${r * 0.7} ${-r * 1.08} ${r * 1.12} ${-r * 0.5} ${r * 1.02} ${r * 0.1} C${r * 0.95} ${r * 0.72} ${r * 0.45} ${r * 1.0} 0 ${r * 0.86} C${-r * 0.45} ${r * 1.0} ${-r * 0.95} ${r * 0.72} ${-r * 1.02} ${r * 0.1} C${-r * 1.12} ${-r * 0.5} ${-r * 0.7} ${-r * 1.08} 0 ${-r * 0.78}Z`, rgrad([[0, "#e55a4a"], [0.7, "#c8372e"], [1, "#9c2621"]], { cx: 0.38, cy: 0.35, r: 0.7 })) +
      ellipse(-r * 0.4, -r * 0.35, r * 0.22, r * 0.12, "#ffffff", `opacity=".45" transform="rotate(-35 ${-r * 0.4} ${-r * 0.35})"`) +
      ellipse(0, -r * 0.62, r * 0.18, r * 0.12, "#7a2520", 'opacity=".55"') +
      stroke(`M0 ${-r * 0.62} Q${r * 0.05} ${-r * 0.9} ${r * 0.16} ${-r * 1.05}`, "#5a3b26", 4) +
      path(`M${r * 0.1} ${-r * 0.88} Q${r * 0.5} ${-r * 1.15} ${r * 0.72} ${-r * 0.82} Q${r * 0.4} ${-r * 0.72} ${r * 0.1} ${-r * 0.88}Z`, P.leaf),
  );

// Milk carton seen from above at a slight angle: gabled top, front face visible.
const milk = (x, y) => {
  let b = ellipse(10, 70, 46, 12, "#1c2f4a", 'opacity=".2"');
  b += rect(-40, -10, 80, 80, "#ffffff") + rect(14, -10, 26, 80, "#e3e8ec");
  b += rect(-40, 22, 80, 30, "#3b7dc4") + rect(14, 22, 26, 30, shade("#3b7dc4", 0.15));
  b += circle(-14, 37, 9, "#ffffff", 'opacity=".9"') + circle(-14, 37, 5, "#3b7dc4");
  b += poly([[-40, -10], [0, -44], [40, -10]], "#f2f4f6") + poly([[0, -44], [40, -10], [14, -10]], "#dfe5ea");
  b += rect(-8, -56, 16, 14, "#f7f8fa") + rect(-8, -46, 16, 3, "#d5dbe0");
  return tr(x, y, b);
};

const carrot = (x, y, a, len = 74) => {
  const b =
    ellipse(5, 8, len * 0.52, 9, "#1c2f4a", 'opacity=".16"') +
    path(`M${-len / 2} -9 Q${-len / 2 - 4} 0 ${-len / 2} 9 L${len / 2} 2 Q${len / 2 + 3} 0 ${len / 2} -2Z`, vgrad([[0, "#f6a14a"], [0.5, P.orange], [1, "#c9651d"]])) +
    stroke(`M${-len * 0.2} -6 l3 4M${len * 0.05} -4 l3 3M${len * 0.25} -2 l2 3`, "#c25f1c", 1.6, 'opacity=".7"') +
    path(`M${-len / 2} -4 l-12 -10 l4 10 l-14 -2 l12 6 l-12 8 l14 -4Z`, P.leaf);
  return `<g transform="translate(${x} ${y}) rotate(${a})">${b}</g>`;
};

export default {
  file: "68-lunch-tray.svg",
  w: 640,
  h: 400,
  title: "A lunch tray with an apple, a sandwich, a carton of milk, and carrots.",
  draw: () =>
    rect(0, 0, 640, 400, vgrad([[0, "#e9dfcd"], [1, "#d8c9ae"]])) +
    // table grain
    stroke("M0 40 Q320 30 640 46M0 120 Q300 112 640 124M0 300 Q320 290 640 306M0 370 Q300 362 640 374", "#c9b590", 2, 'opacity=".5"') +
    rect(0, 0, 640, 400, rgrad([[0, "#fff6e0", 0.55], [1, "#fff6e0", 0]], { cx: 0.3, cy: 0.2, r: 0.8 })) +
    tray(70, 34, 500, 336) +
    sandwich(238, 132) +
    apple(492, 126, 44) +
    milk(196, 268) +
    carrot(420, 252, -12) +
    carrot(436, 284, -4, 80) +
    carrot(418, 316, 6, 70),
};
