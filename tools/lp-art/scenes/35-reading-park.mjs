import {
  ball,
  bench,
  cloud,
  dog,
  flower,
  ground,
  HAIR,
  hills,
  P,
  pathway,
  person,
  SKIN,
  sky,
  sun,
  tree,
  tuft,
} from "../../../access-practice-lab/src/art/kit.js";

export default {
  file: "35-reading-park.svg",
  w: 640,
  h: 400,
  title:
    "Two children kick a soccer ball on the grass in a park. A brown dog runs nearby, and a grandfather sits on a bench under a tree.",
  draw: () =>
    sky(640, 260) +
    sun(560, 64, 24) +
    cloud(150, 66, 0.9) +
    cloud(400, 48, 0.7) +
    hills(640, 236, { seed: 3 }) +
    tree(70, 238, 0.55, { seed: 4, tone: "#6aa275" }) +
    tree(300, 236, 0.45, { kind: "pine", tone: "#4f8a6a" }) +
    ground(640, 230, 170, "grass") +
    pathway(330, 400, 420, 232, 110, 22) +
    tree(530, 300, 1.25, { seed: 7 }) +
    bench(440, 318, 120) +
    person(500, 292, 150, {
      pose: "sit",
      age: "elder",
      skin: SKIN[3],
      hair: HAIR[5],
      hairStyle: "bald",
      top: P.teal,
      bottom: "#4e5d6c",
      glasses: true,
      beard: HAIR[5],
      facing: -1,
    }) +
    person(140, 340, 128, {
      pose: "kick",
      skin: SKIN[1],
      hair: HAIR[1],
      hairStyle: "short",
      top: P.coral,
      bottom: P.navy,
      sleeve: "short",
      mouth: "open",
    }) +
    ball(226, 346, 11) +
    person(282, 348, 122, {
      pose: "run",
      skin: SKIN[4],
      hair: HAIR[0],
      hairStyle: "puffs",
      top: P.gold,
      bottom: "#3e4a5c",
      sleeve: "short",
      facing: -1,
      mouth: "open",
    }) +
    dog(372, 366, 1.25, { pose: "run", facing: 1 }) +
    tuft(40, 372) +
    tuft(600, 384, 1.2) +
    flower(28, 392, 1, { color: P.pink }) +
    flower(612, 360, 0.9, { color: P.gold, center: P.coral }),
};
