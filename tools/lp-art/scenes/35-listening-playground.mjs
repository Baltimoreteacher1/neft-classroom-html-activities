import { P, SKIN, HAIR, sky, sun, cloud, hills, ground, tree, fence, slide, swings, bench, person, tuft, flower, ellipse, line } from "../../../access-practice-lab/src/art/kit.js";

export default {
  file: "35-listening-playground.svg",
  w: 640,
  h: 400,
  title: "A playground with a slide, swings, a big tree, and a bench. A child plays at each place.",
  draw: () =>
    sky(640, 250) +
    sun(410, 56, 22) +
    cloud(120, 60, 0.8) +
    cloud(300, 42, 0.55) +
    hills(640, 240, { seed: 6 }) +
    ground(640, 236, 164, "grass", { seed: 9 }) +
    fence(0, 300, 262, 46) +
    // slide with a child sitting at the top, about to slide down
    slide(34, 330, 128, { color: P.coral }) +
    person(62, 204, 96, { pose: "sit", skin: SKIN[4], hair: HAIR[0], hairStyle: "curly", top: P.gold, bottom: P.navy, sleeve: "short", mouth: "open" }) +
    // swings with a child on one seat
    swings(196, 322, 156, 136, { seats: 2 }) +
    person(236, 290, 98, { pose: "sit", skin: SKIN[0], hair: HAIR[3], hairStyle: "long", top: P.purple, bottom: "#3e4a5c", skirt: true, mouth: "smile" }) +
    // big tree with shade underneath; Amir stands in the shade
    ellipse(522, 346, 104, 20, "#2f5a33", 'opacity=".28"') +
    tree(526, 338, 1.3, { seed: 5 }) +
    person(500, 358, 118, { pose: "wave", facing: -1, skin: SKIN[2], hair: HAIR[0], hairStyle: "short", top: P.teal, bottom: P.navy, sleeve: "short" }) +
    // bench with a child sitting and reading
    bench(316, 384, 124) +
    person(372, 358, 100, { pose: "sit", skin: SKIN[3], hair: HAIR[1], hairStyle: "hijab", top: P.coral, bottom: "#4a3f5c", item: `<rect x="-9" y="-12" width="18" height="13" rx="1.5" fill="${P.blue}"/>` }) +
    tuft(24, 388, 1.2) +
    tuft(260, 392) +
    flower(600, 392, 0.9, { color: P.pink }) +
    flower(470, 396, 0.8, { color: P.gold, center: P.coral }),
};
