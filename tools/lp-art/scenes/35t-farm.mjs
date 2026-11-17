import { P, SKIN, HAIR, sky, sun, cloud, hills, ground, tree, pond, fence, person, tuft, flower, path, vgrad } from "../../../access-practice-lab/src/art/kit.js";
import { joints, barn, chicken, cropRows, sunHat } from "../lib/d.mjs";

// Farm tour stops: big red barn with chickens in front; apple orchard behind the barn; vegetable garden next
// to a blue pond; Farmer Amara waving hello.
const farmer = { pose: "wave", age: "adult", skin: SKIN[4], hair: HAIR[0], hairStyle: "braid", top: P.coral, bottom: "#3b6ea5", apron: "#3b6ea5", sleeve: "short", mouth: "open" };
const FX = 352;
const FY = 382;
const FH = 156;

export default {
  file: "35t-farm.svg",
  w: 640,
  h: 400,
  title: "A farm with a big red barn and chickens in front of it. Apple trees with red apples grow behind the barn. A vegetable garden with rows of small plants is next to a blue pond, and a farmer waves hello.",
  draw: () => {
    const J = joints(FX, FY, FH, farmer);
    return (
      sky(640, 250) +
      sun(574, 58, 24) +
      cloud(130, 56, 0.8) +
      cloud(380, 40, 0.6) +
      hills(640, 196, { seed: 5, amp: 30 }) +
      tree(36, 216, 0.62, { kind: "fruit", seed: 2 }) +
      tree(120, 206, 0.6, { kind: "fruit", seed: 3 }) +
      tree(214, 204, 0.64, { kind: "fruit", seed: 5 }) +
      tree(300, 210, 0.6, { kind: "fruit", seed: 7 }) +
      ground(640, 210, 190, "grass", { seed: 8 }) +
      path("M0 210 Q320 200 640 214 L640 226 Q320 214 0 222Z", P.grassDark, 'opacity=".25"') +
      tree(392, 236, 0.66, { kind: "fruit", seed: 9 }) +
      barn(70, 316, 200, 132) +
      fence(400, 640, 262, 30) +
      chicken(66, 352, 1.3, { facing: 1 }) +
      chicken(124, 368, 1.35, { facing: -1, peck: true }) +
      chicken(214, 360, 1.3, { facing: 1, peck: true }) +
      chicken(282, 344, 1.25, { facing: -1 }) +
      cropRows(414, 344, 120, 5, 15) +
      pond(578, 330, 54, 22) +
      person(FX, FY, FH, farmer) +
      sunHat(J.head, J.headR) +
      tuft(24, 392, 1.2) +
      tuft(620, 394, 1.1) +
      flower(300, 392, 0.8, { color: P.gold, center: P.coral }) +
      flower(560, 390, 0.8, { color: P.pink })
    );
  },
};
