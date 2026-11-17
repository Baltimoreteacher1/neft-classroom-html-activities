import { P, SKIN, HAIR, panels, sky, cloud, hills, ground, tree, person, tuft, flower, stroke, circle } from "../../../access-practice-lab/src/art/kit.js";
import { joints, kite, rake } from "../lib/d.mjs";

// Three panels in the same park, same tall tree on the right: 1 the girl flies her red kite while Grandpa
// watches; 2 the kite is caught in the tree and she is sad; 3 Grandpa pulls it down with a long rake, she cheers.
const GIRL = { skin: SKIN[3], hair: HAIR[0], hairStyle: "puffs", top: P.gold, bottom: P.navy, sleeve: "short" };
const GRANDPA = { age: "elder", skin: SKIN[1], hair: HAIR[5], hairStyle: "short", glasses: true, top: P.teal, bottom: "#5a4a3c" };
const GH = 124;
const PH = 178;

// Sad face drawn over a mouthless head (the kit has no frown).
const frown = (J) => {
  const [hx, hy] = J.head;
  const r = J.headR;
  const fx = hx + J.fc * r * 0.28;
  return stroke(`M${fx - r * 0.2} ${hy + r * 0.62} Q${fx} ${hy + r * 0.46} ${fx + r * 0.22} ${hy + r * 0.62}`, "#4a2a1a", r * 0.09) + stroke(`M${fx - r * 0.45} ${hy - r * 0.18} l${r * 0.22} ${-r * 0.1}M${fx + r * 0.48} ${hy - r * 0.18} l${-r * 0.22} ${-r * 0.1}`, "#2a1d17", r * 0.07);
};

// Rake handle passes through the hand and ends with its head at the kite.
const rakeThrough = (hx, hy, tx, ty) => {
  const dx = tx - hx;
  const dy = ty - hy;
  const L = Math.hypot(dx, dy);
  return rake(hx - (dx / L) * 46, hy - (dy / L) * 46, tx, ty) + circle(hx, hy, 6.5, SKIN[1]);
};

const step = (i, x, y, w, h) => {
  const gy = y + h - 40;
  let s = sky(x + w, gy) + cloud(x + 70, y + 86, 0.45) + hills(x + w + 400, gy - 70, { seed: 4 }) + ground(x + w, gy - 64, h, "grass", { seed: 2 + i });
  s += tree(x + w - (i === 0 ? -6 : 30), gy - 40, 1.45, { seed: 3, kind: "round" });
  const kx = x + w - 52;
  const ky = y + 96;
  if (i === 0) {
    const g = { ...GIRL, pose: "reach", mouth: "open" };
    const gp = { ...GRANDPA, pose: "stand", facing: -1 };
    const [hx, hy] = joints(x + 44, gy, GH, g).hand;
    s += person(x + 120, gy + 6, PH, gp) + person(x + 44, gy, GH, g);
    s += stroke(`M${hx} ${hy} Q${x + 52} ${y + 150} ${x + 74} ${y + 96}`, "#4a4f57", 1.2) + kite(x + 74, y + 96, 1.05, { rot: -18 });
  }
  if (i === 1) {
    const g = { ...GIRL, pose: "stand", mouth: "none" };
    const J = joints(x + 58, gy, GH, g);
    s += kite(kx, ky, 1.0, { rot: 32 }) + stroke(`M${kx - 4} ${ky + 20} q-20 40 -40 60`, "#4a4f57", 1.1, 'opacity=".7"');
    s += person(x + 58, gy, GH, g) + frown(J);
  }
  if (i === 2) {
    const gp = { ...GRANDPA, pose: "reach", mouth: "smile" };
    const J = joints(x + 88, gy + 6, PH, gp);
    const [hx, hy] = J.hand;
    s += kite(kx - 12, ky + 18, 1.0, { rot: 14 });
    s += person(x + 88, gy + 6, PH, gp) + rakeThrough(hx, hy, kx - 18, ky + 4);
    s += person(x + 34, gy, GH, { ...GIRL, pose: "cheer", mouth: "open" });
  }
  s += tuft(x + 12, gy + 32, 1) + flower(x + w - 14, gy + 36, 0.7, { color: P.pink });
  return s;
};

export default {
  file: "35t-kite-seq.svg",
  w: 640,
  h: 400,
  title: "Three pictures in order. 1: A girl flies a red kite in the park while her grandfather watches. 2: The wind blows the kite into a tall tree, and the girl looks sad. 3: Her grandfather reaches up with a long rake and pulls the kite out of the tree, and the girl cheers.",
  draw: () => panels(640, 400, 3, step),
};
