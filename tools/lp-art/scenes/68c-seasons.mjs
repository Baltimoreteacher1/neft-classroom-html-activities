import { P, rect, circle, ellipse, stroke, rgrad, vgrad, stars, arrow, tag, text, g } from "../kit.mjs";
import { earth } from "../lib/f.mjs";

// Seasons diagram, accurate first. The Sun sits at the centre of Earth's orbit. Earth is drawn at two opposite
// points of the orbit with its axis tilted 23.5 degrees the SAME way in space both times (north pole leaning right).
// LEFT (June): the northern half leans toward the Sun, so sunlight strikes the north directly.
// RIGHT (December): the same tilt now leans the northern half away from the Sun; sunlight reaches it at a low slant.
// The night side of each Earth faces away from the Sun. Orbit arrows run counterclockwise as seen from above the
// North Pole (near side moving right, far side moving left).
const cx = 320;
const cy = 196;
const rx = 250;
const ry = 66;
const eR = 46;
const tilt = 23.5;
const t = (tilt * Math.PI) / 180;
const pole = (x) => [x + Math.sin(t) * eR * 1.35, cy - Math.cos(t) * eR * 1.35];

const rays = (x0, x1) => {
  const dir = Math.sign(x1 - x0);
  let s = "";
  for (const dy of [-26, -9, 9, 26]) {
    s += arrow(`M${x0} ${cy + dy}H${x1 - dir * 4}`, "#f3cd6f", 3);
  }
  return g(s, 'opacity=".9"');
};

export default {
  file: "68c-seasons.svg",
  w: 640,
  h: 400,
  title:
    "A diagram of the Sun in the center with Earth shown at two places in its orbit. On the left, Earth's tilted axis leans its northern half toward the Sun, and sunlight hits the north directly. On the right, on the opposite side of the orbit, the same tilt now leans the northern half away from the Sun, and sunlight hits the north at a low slant.",
  grain: false,
  draw: () =>
    rect(0, 0, 640, 400, vgrad([[0, "#0c1d36"], [1, "#1a2c50"]])) +
    stars(640, 400, 46, 7) +
    // orbit (far half behind the Sun)
    ellipse(cx, cy, rx, ry, "none", 'stroke="#9fb4cc" stroke-width="2" stroke-dasharray="7 7" opacity=".7"') +
    arrow(`M${cx + 40} ${cy - ry}H${cx - 40}`, "#c9d6e4", 3) +
    // the Sun
    circle(cx, cy, 104, rgrad([[0, "#ffe9a8", 0.55], [1, "#ffe9a8", 0]])) +
    circle(cx, cy, 48, vgrad([[0, "#ffe58a"], [1, P.gold]])) +
    circle(cx - 14, cy - 14, 18, "#fff6cf", 'opacity=".5"') +
    // near half of the orbit passes in front of the Sun
    `<path d="M${cx - rx} ${cy} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}" fill="none" stroke="#9fb4cc" stroke-width="2" stroke-dasharray="7 7" opacity=".7"/>` +
    arrow(`M${cx - 40} ${cy + ry}H${cx + 40}`, "#c9d6e4", 3) +
    rays(cx - 54, 70 + eR + 6) +
    rays(cx + 54, 570 - eR - 6) +
    earth(70, cy, eR, { tilt, nightSide: -1 }) +
    earth(570, cy, eR, { tilt, nightSide: 1 }) +
    text(pole(70)[0] + 10, pole(70)[1] - 2, "N", { size: 14, fill: "#ffffff" }) +
    text(pole(570)[0] + 10, pole(570)[1] - 2, "N", { size: 14, fill: "#ffffff" }) +
    tag(cx, cy + 92, "Sun", { size: 15, fill: "#fbf6ec" }) +
    tag(70, 300, "June", { size: 15, fill: "#fbf6ec" }) +
    tag(570, 300, "December", { size: 15, fill: "#fbf6ec" }),
};
