import { P, panels, sky, cloud, hills, ground, tree, fence, flower, tuft, swings, slide, ellipse } from "../../../access-practice-lab/src/art/kit.js";
import { raisedBed, canOnGround } from "../lib/d.mjs";

// Two ideas for the same empty space: left a community garden (raised vegetable beds, tall sunflowers,
// a watering can); right a playground (two swings and a yellow slide). No people, no labels.
const back = (x, y, w, h, i) => sky(x + w, y + h * 0.62) + cloud(x + w * (i ? 0.3 : 0.7), y + 64, 0.6) + hills(x + w + 300, y + h * 0.5, { seed: 6 + i }) + (i ? tree(x + w - 40, y + h * 0.56, 0.5, { tone: "#6aa275", seed: 3 }) : "") + ground(x + w, y + h * 0.54, h, "grass", { seed: 3 + i });

const garden = (x, y, w, h) => {
  const gy = y + h - 30;
  return (
    back(x, y, w, h, 0) +
    fence(x - 6, x + w + 6, y + h * 0.6, 30) +
    flower(x + 34, y + h * 0.66, 1.9, { kind: "sunflower" }) +
    flower(x + 70, y + h * 0.68, 2.2, { kind: "sunflower" }) +
    flower(x + w - 60, y + h * 0.66, 2.0, { kind: "sunflower" }) +
    flower(x + w - 28, y + h * 0.68, 1.8, { kind: "sunflower" }) +
    raisedBed(x + 22, gy - 76, 124, { crops: "mix", seed: 3 }) +
    raisedBed(x + 156, gy - 76, 116, { crops: "lettuce", seed: 5 }) +
    raisedBed(x + 60, gy, 150, { crops: "mix", seed: 8 }) +
    canOnGround(x + 236, gy + 2, 1.5, P.blue) +
    tuft(x + 16, gy + 22, 1.1)
  );
};

const playground = (x, y, w, h) => {
  const gy = y + h - 40;
  return (
    back(x, y, w, h, 1) +
    ellipse(x + w / 2, gy - 4, w * 0.48, 22, "#d9c08f", 'opacity=".75"') +
    swings(x + 18, gy - 16, 140, 150, { seats: 2 }) +
    slide(x + 170, gy + 6, 140, { color: P.yellow }) +
    tuft(x + w - 16, gy + 30, 1.1) +
    flower(x + 14, gy + 34, 0.8, { color: P.pink })
  );
};

export default {
  file: "35t-park-choice.svg",
  w: 640,
  h: 400,
  title: "Two ideas for an empty space in the park. On the left side is a community garden with raised beds of vegetables, tall sunflowers, and a watering can. On the right side is a playground with two swings and a yellow slide.",
  draw: () => panels(640, 400, 2, (i, x, y, w, h) => (i ? playground(x, y, w, h) : garden(x, y, w, h)), { numbered: false }),
};
