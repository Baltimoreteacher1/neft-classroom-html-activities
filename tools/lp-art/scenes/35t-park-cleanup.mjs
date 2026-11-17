import { P, SKIN, HAIR, sky, sun, cloud, hills, ground, tree, bench, slide, person, flower, tuft, path, ellipse, rrect, stroke, rect, shade, tr } from "../../../access-practice-lab/src/art/kit.js";
import { joints, bin, sapling, shovel, wateringCan, sodaCan } from "../lib/d.mjs";

// Neighbors clean up the park, left to right: a girl drops a can into the trash bag she holds; a boy carries
// a blue recycling bin; two children plant a small tree; a man waters flowers. A bench and a yellow slide behind.
const girl = { pose: "hold", skin: SKIN[0], hair: HAIR[2], hairStyle: "long", top: P.coral, bottom: P.navy, item: sodaCan(1.2), mouth: "smile" };
const boy = { pose: "carry", skin: SKIN[4], hair: HAIR[0], hairStyle: "curly", top: P.gold, bottom: "#3e4a5c" };
const planterA = { pose: "hold", skin: SKIN[1], hair: HAIR[3], hairStyle: "short", top: P.blue, bottom: P.navy };
const planterB = { pose: "hold", facing: -1, skin: SKIN[2], hair: P.coral, hairStyle: "braid", top: P.green, bottom: "#4a3f5c" };
const man = { pose: "hold", age: "adult", skin: SKIN[2], hair: HAIR[5], hairStyle: "short", top: P.navy, bottom: "#6b5a48", beard: HAIR[5], mouth: "smile" };

const trashBag = (x, y) => tr(x, y, path("M-6 0 Q-26 18 -22 46 Q-18 62 0 62 Q18 62 22 46 Q26 18 6 0Z", "#4b5560") + path("M4 0 Q22 18 20 46 Q16 60 4 62 Q14 40 4 0Z", shade("#4b5560", 0.2)) + ellipse(0, 2, 9, 3, "#2f363e") + stroke("M-10 22 q6 -4 10 2", "#6b7682", 1.6, 'opacity=".7"'));

export default {
  file: "35t-park-cleanup.svg",
  w: 640,
  h: 400,
  title: "Neighbors clean up a park. A girl picks up a can and holds a trash bag. A boy carries a blue recycling bin. Two children plant a small tree, and a man waters flowers with a watering can. There is a bench and a yellow slide.",
  draw: () => {
    const gJ = joints(64, 368, 146, girl);
    const bJ = joints(176, 374, 146, boy);
    const aJ = joints(296, 372, 136, planterA);
    const cJ = joints(414, 376, 132, planterB);
    const mJ = joints(508, 386, 172, man);
    const [bx, by] = bJ.hand;
    const [mx, my] = mJ.hand;
    return (
      sky(640, 250) +
      sun(70, 60, 22) +
      cloud(300, 52, 0.7) +
      cloud(500, 72, 0.6) +
      hills(640, 210, { seed: 9 }) +
      tree(560, 222, 0.6, { tone: "#6aa275", seed: 4 }) +
      tree(30, 220, 0.55, { tone: "#6aa275", seed: 6 }) +
      ground(640, 214, 186, "grass", { seed: 5 }) +
      bench(120, 262, 110) +
      slide(390, 260, 100, { color: P.yellow }) +
      ellipse(352, 382, 34, 8, P.soilDark) +
      person(64, 368, 146, girl) +
      trashBag(gJ.backHand[0] - 4, gJ.backHand[1] + 2) +
      person(176, 374, 146, boy) +
      bin((bx + bJ.backHand[0]) / 2 - 27, by + 50, 54, 54, { kind: "recycle", shadow: false }) +
      sapling(352, 384, 1.25) +
      person(296, 372, 136, planterA) +
      person(414, 376, 132, planterB) +
      shovel(cJ.hand[0], cJ.hand[1], 380, 384, { color: P.coral }) +
      flower(574, 392, 1.0, { color: P.pink }) +
      flower(598, 388, 1.1, { color: P.gold, center: P.coral }) +
      flower(622, 394, 0.95, { color: P.purple }) +
      person(508, 386, 172, man) +
      `<g transform="translate(${mx.toFixed(1)} ${my.toFixed(1)}) rotate(24) scale(1.2)">${wateringCan(1, { color: P.teal })}</g>` +
      stroke(`M${mx + 33} ${my + 12} q5 16 4 ${358 - my - 12}M${mx + 37} ${my + 10} q9 16 12 ${362 - my - 10}M${mx + 30} ${my + 14} q2 16 -4 ${354 - my - 14}`, "#5fb3d6", 2.2, 'stroke-dasharray="5 4"') +
      tuft(14, 392, 1.1) +
      tuft(250, 396, 0.9)
    );
  },
};
