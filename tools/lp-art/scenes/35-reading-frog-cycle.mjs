import { P, rect, ellipse, circle, arrow, stroke, path, g, vgrad, rgrad, shade, light } from "../kit.mjs";
import { frogEggs, tadpole, frog, lilyPad } from "../lib/a.mjs";

const f = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const CX = 320;
const CY = 204;
const RX = 200;
const RY = 128;
const at = (deg) => [CX + Math.cos((deg * Math.PI) / 180) * RX, CY + Math.sin((deg * Math.PI) / 180) * RY];
// clockwise arc between two angles on the ring
const arc = (a0, a1) => {
  const [x0, y0] = at(a0);
  const [x1, y1] = at(a1);
  return `M${f(x0)} ${f(y0)}A${RX} ${RY} 0 0 1 ${f(x1)} ${f(y1)}`;
};
const bubble = (x, y, r = 62) =>
  g(circle(x + 2, y + 5, r, "#1c2f4a", 'opacity=".1"') + circle(x, y, r, rgrad([[0, "#f4fbfc"], [1, "#d7edf2"]])) + circle(x, y, r, "none", `stroke="#ffffff" stroke-width="4"`));

export default {
  file: "35-reading-frog-cycle.svg",
  w: 640,
  h: 400,
  title:
    "Four stages of a frog's life in a circle with arrows: frog eggs in water, a tadpole with a long tail, a tadpole with four legs, and a grown frog.",
  draw: () => {
    const [ex, ey] = at(-90);
    const [tx, ty] = at(0);
    const [lx, ly] = at(90);
    const [fx, fy] = at(180);
    return (
      rect(0, 0, 640, 400, rgrad([[0, "#eef6ef"], [1, "#dcebe2"]], { cx: 0.5, cy: 0.5, r: 0.7 })) +
      ellipse(CX, CY, RX + 40, RY + 40, vgrad([[0, "#cfe8ee"], [1, "#a9d3e0"]]), 'opacity=".55"') +
      stroke("M200 200 q14 -5 28 0M380 230 q14 -5 28 0M300 150 q14 -5 28 0", "#ffffff", 2, 'opacity=".7"') +
      arrow(arc(-62, -24), P.teal, 6) +
      arrow(arc(26, 64), P.teal, 6) +
      arrow(arc(118, 154), P.teal, 6) +
      arrow(arc(206, 242), P.teal, 6) +
      bubble(ex, ey) +
      frogEggs(ex, ey + 6, 1.25) +
      bubble(tx, ty) +
      tadpole(tx - 16, ty, 1.25) +
      bubble(lx, ly) +
      tadpole(lx - 16, ly - 8, 1.25, { legs: true }) +
      bubble(fx, fy) +
      lilyPad(fx, fy + 32, 50) +
      frog(fx, fy + 30, 1.3)
    );
  },
};
