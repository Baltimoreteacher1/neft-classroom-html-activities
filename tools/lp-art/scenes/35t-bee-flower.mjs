import { P, rect, circle, ellipse, path, stroke, g, vgrad, rgrad, shade, light, mix } from "../../../access-practice-lab/src/art/kit.js";
import { bee } from "../lib/d.mjs";

// Close-up: a fuzzy striped bee standing on a big pink flower, yellow pollen on its back legs and body.
const PINK = "#e58fb0";

const flowerHead = (cx, cy) => {
  let back = "";
  let front = "";
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * 360 + 6;
    const r = (a * Math.PI) / 180;
    const px = Math.cos(r) * 112;
    const py = Math.sin(r) * 112;
    const c = Math.sin(r) < 0 ? shade(PINK, 0.1) : PINK;
    const p = ellipse(px, py, 78, 30, c, `transform="rotate(${a.toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)})"`) + ellipse(px * 0.82, py * 0.82, 46, 5, light(PINK, 0.45), `opacity=".7" transform="rotate(${a.toFixed(1)} ${(px * 0.82).toFixed(1)} ${(py * 0.82).toFixed(1)})"`);
    if (Math.sin(r) < 0) back += p;
    else front += p;
  }
  let s = `<g transform="translate(${cx} ${cy}) scale(1.15 .5)">${back}${front}</g>`;
  s += ellipse(cx, cy + 6, 62, 26, "#c97b2c") + ellipse(cx, cy, 60, 24, vgrad([[0, "#f7c94a"], [1, "#e09a2a"]]));
  for (let i = 0; i < 46; i++) {
    const a = i * 2.4;
    const rr = 5 + (i % 10) * 5.2;
    s += circle(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.4, 2, i % 3 ? "#fbe08a" : "#c97b2c");
  }
  return s;
};

const bokeh = () => {
  let s = rect(0, 0, 640, 400, vgrad([[0, "#cfe6c4"], [0.6, "#a8cf96"], [1, "#7fb069"]]));
  const spots = [[70, 70, 40, "#e7f3dc"], [180, 40, 26, "#f6fbef"], [580, 60, 46, "#e7f3dc"], [520, 150, 24, "#f9d6e3"], [60, 250, 34, "#f9d6e3"], [600, 300, 40, "#d8ecc9"], [140, 160, 20, "#fff5d6"]];
  for (const [x, y, r, c] of spots) s += circle(x, y, r, c, 'opacity=".55"');
  s += path("M0 400 Q60 300 150 320 Q90 350 70 400Z", "#6aa05a", 'opacity=".55"') + path("M640 360 Q560 300 500 340 Q570 350 600 400 L640 400Z", "#6aa05a", 'opacity=".55"');
  return s;
};

export default {
  file: "35t-bee-flower.svg",
  w: 640,
  h: 400,
  title: "A close-up picture of a fuzzy striped bee standing on a big pink flower. Clumps of yellow dust from the flower are stuck to the bee's back legs and body.",
  draw: () =>
    bokeh() +
    stroke("M320 300 Q310 360 326 400", P.leafDark, 14) +
    path("M330 360 Q270 330 230 350 Q280 380 330 372Z", P.leaf) +
    flowerHead(320, 286) +
    ellipse(318, 288, 70, 10, "#1c2f4a", 'opacity=".16"') +
    bee(326, 290, 3.0),
};
