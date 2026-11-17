import { P, sky, cloud, path, stroke, vgrad, tree, tuft, ellipse, g, rng, shade, light } from "../../../access-practice-lab/src/art/kit.js";
import { stump } from "../lib/f.mjs";

// Cause and effect after one storm. LEFT: hillside covered in trees and grass; the river beside it stays blue and
// clear. RIGHT: only tree stumps and bare brown soil, cut by deep grooves (gullies) where mud washed down into the
// river, turning that part of the river brown.
const soil = "#a8713f";
const mud = "#9c6b3c";

const leftHill = "M0 330 L0 172 C70 128 180 122 262 170 C296 190 318 236 330 330Z";
const rightHill = "M318 330 C330 250 352 206 394 182 C470 140 572 136 640 168 V330Z";

/** A gully: a wandering carved channel, narrow at the top and wide where it meets the river, with side rills. */
const gully = (x0, y0, x1, seed) => {
  const R = rng(seed);
  const n = 6;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t + (i > 0 && i < n ? (R() - 0.5) * 16 : 0);
    const y = y0 + (330 - y0) * t;
    pts.push([x, y, 2 + t * 13]);
  }
  const L = pts.map(([x, y, w]) => [x - w, y]);
  const Rt = pts.map(([x, y, w]) => [x + w, y]).reverse();
  const poly = (a) => a.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const mid = poly(pts.map(([x, y]) => [x, y]));
  let side = "";
  for (const k of [2, 4]) {
    const [x, y] = pts[k];
    const dir = k === 2 ? -1 : 1;
    side += `M${x.toFixed(1)} ${y.toFixed(1)}q${dir * 14} -10 ${dir * 22} -30`;
  }
  return (
    stroke(side, shade(soil, 0.4), 3.2) +
    path(poly(L) + poly(Rt).replace("M", "L") + "Z", shade(soil, 0.36)) +
    stroke(mid, "#5e3a1f", 3.4, 'opacity=".75"') +
    stroke(poly(Rt.slice().reverse()), light(soil, 0.32), 2, 'opacity=".8"')
  );
};

/** Mud spreading from a gully mouth and drifting downstream in the river. */
const mudFan = (x) => path(`M${x - 16} 327 C${x - 18} 340 ${x + 10} 350 ${x + 44} 350 C${x + 30} 342 ${x + 22} 334 ${x + 16} 327Z`, "#6f4524", 'opacity=".55"');

/** Grass flecks scattered over the green hill. */
const grassFlecks = () => {
  const R = rng(14);
  let d = "";
  for (let i = 0; i < 46; i++) {
    const x = 14 + R() * 290;
    const y = 200 + R() * 120;
    if (y < 170 + Math.abs(x - 150) * 0.25) continue;
    d += `M${x.toFixed(1)} ${y.toFixed(1)}l-2 -6M${x.toFixed(1)} ${y.toFixed(1)}l2 -7`;
  }
  return stroke(d, P.grassDark, 1.6, 'opacity=".6"');
};

/** Pebbles and cracks on the bare soil. */
const soilTexture = () => {
  const R = rng(21);
  let s = "";
  for (let i = 0; i < 26; i++) {
    const x = 360 + R() * 270;
    const y = 190 + R() * 130;
    if (y < 160 + Math.abs(x - 500) * 0.2) continue;
    s += ellipse(x, y, 2 + R() * 3, 1.4 + R() * 1.6, shade(soil, 0.25), 'opacity=".6"');
  }
  return s;
};

export default {
  file: "68c-hillside-erosion.svg",
  w: 640,
  h: 400,
  title:
    "Two hillsides next to a river after a rainstorm. The left hillside is covered with trees and grass, and the river beside it is blue and clear. The right hillside has only tree stumps and bare brown soil, with deep grooves where mud has washed down into the river, turning that part of the river brown.",
  draw: () =>
    sky(640, 330, "morning") +
    cloud(116, 54, 0.9, { tone: "#f4f7f9" }) +
    cloud(330, 40, 0.6, { tone: "#eef2f5" }) +
    cloud(520, 60, 1, { tone: "#e7ecef" }) +
    // LEFT hillside: grass and trees
    path(leftHill, vgrad([[0, P.grassLight], [0.5, P.grass], [1, P.grassDark]])) +
    path("M0 172 C70 128 180 122 262 170 C220 150 120 146 0 196Z", "#ffffff", 'opacity=".14"') +
    grassFlecks() +
    tree(64, 214, 0.5, { seed: 2 }) +
    tree(150, 196, 0.54, { seed: 5, tone: "#4a8a58" }) +
    tree(232, 228, 0.5, { seed: 8 }) +
    tree(104, 284, 0.52, { seed: 3, tone: "#5a9a62" }) +
    tree(196, 304, 0.54, { seed: 6 }) +
    tuft(30, 320, 1.1) +
    tuft(282, 318, 1) +
    // RIGHT hillside: bare soil, stumps, gullies
    path(rightHill, vgrad([[0, light(soil, 0.2)], [0.6, soil], [1, shade(soil, 0.15)]])) +
    soilTexture() +
    gully(452, 176, 404, 3) +
    gully(526, 160, 478, 7) +
    gully(598, 170, 566, 11) +
    stump(414, 214, 1.3) +
    stump(492, 188, 1.25) +
    stump(568, 202, 1.25) +
    stump(538, 270, 1.4) +
    stump(452, 284, 1.4) +
    // river: clear blue on the left, brown with mud on the right
    path("M0 326 H640 V400 H0Z", vgrad([[0, P.waterLight], [1, P.waterDark]])) +
    path("M330 326 H640 V400 H372 C356 376 352 352 330 326Z", vgrad([[0, "#b5844f"], [1, "#8a5a30"]])) +
    path("M330 326 C352 352 356 376 372 400 H392 C372 372 368 350 352 326Z", mix2(), 'opacity=".55"') +
    stroke("M40 354 q15 -6 30 0M150 378 q15 -6 30 0M232 350 q15 -6 30 0", "#ffffff", 2.2, 'opacity=".7"') +
    stroke("M430 360 q15 -5 30 0M540 380 q15 -5 30 0", "#d6b48a", 2, 'opacity=".6"') +
    mudFan(404) +
    mudFan(478) +
    mudFan(566) +
    g(path("M0 322 H330 V330 H0Z", shade(P.grassDark, 0.1)) + path("M318 322 H640 V330 H318Z", shade(soil, 0.25))),
};

function mix2() {
  return "#7c8f7a";
}
