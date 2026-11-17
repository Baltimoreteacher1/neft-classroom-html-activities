import { P, SKIN, HAIR, sky, sun, cloud, hills, ground, tree, bench, person, dog, ball, swings, tuft, flower, pathway } from "../kit.mjs";

const G = 262;
export default {
  file: "35-writing-park.svg",
  w: 640,
  h: 400,
  title: "A sunny park with a tree, a girl on a swing, a boy kicking a red ball, a brown dog, and a bench.",
  draw: () =>
    sky(640, 280) +
    sun(560, 66, 26) +
    cloud(170, 70, 0.85) +
    cloud(400, 52, 0.65) +
    hills(640, G - 4, { seed: 5 }) +
    tree(330, G - 2, 0.42, { kind: "pine", tone: "#4f8a6a" }) +
    ground(640, G - 8, 150, "grass", { seed: 6 }) +
    pathway(470, 400, 380, G - 6, 120, 20) +
    tree(108, 318, 1.3, { seed: 3 }) +
    bench(30, 352, 128) +
    swings(214, 330, 150, 150, { seats: 2 }) +
    person(254, 300, 112, { pose: "sit", skin: SKIN[3], hair: HAIR[0], hairStyle: "puffs", top: P.coral, bottom: P.navy, sleeve: "short", mouth: "open" }) +
    person(430, 364, 128, { pose: "kick", skin: SKIN[1], hair: HAIR[2], hairStyle: "short", top: P.blue, bottom: "#3e4a5c", mouth: "open" }) +
    ball(498, 360, 12, P.red) +
    dog(574, 372, 1.15, { pose: "run", facing: -1 }) +
    tuft(612, 300) +
    tuft(24, 388, 1.2) +
    tuft(360, 392, 1.1) +
    flower(196, 392, 1, { color: P.pink }) +
    flower(214, 384, 0.8, { color: P.gold, center: P.coral }) +
    flower(622, 392, 0.9, { color: P.coralLight }),
};
