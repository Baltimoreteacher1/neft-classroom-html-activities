import {
  cloud,
  ellipse,
  g,
  ground,
  HAIR,
  haze,
  house,
  P,
  person,
  puddle,
  rain,
  rect,
  SKIN,
  sky,
  stroke,
  tree,
  tuft,
  umbrella,
} from "../../../access-practice-lab/src/art/kit.js";
import { boots, joints, rainHat, umbrellaHeld } from "../lib/d.mjs";

const boy = {
  pose: "hold",
  skin: SKIN[2],
  hair: HAIR[0],
  hairStyle: "short",
  top: P.yellow,
  coat: P.yellow,
  bottom: P.navy,
  mouth: "smile",
};
const BX = 262;
const BY = 352;
const BH = 176;
const J = joints(BX, BY, BH, boy);
const [hx, hy] = J.hand;

const ripples = (x, y) =>
  stroke(
    `M${x - 30} ${y} a30 6 0 1 0 60 0a30 6 0 1 0 -60 0M${x - 14} ${y + 1} a14 3 0 1 0 28 0a14 3 0 1 0 -28 0`,
    "#e8f3fa",
    1.4,
    'opacity=".7"',
  );

export default {
  file: "35-writing-rainy-day.svg",
  w: 640,
  h: 400,
  title:
    "A rainy day: gray clouds, falling rain, and a boy in a yellow raincoat and boots holding a blue umbrella next to a puddle.",
  draw: () =>
    sky(640, 260, "storm") +
    g(
      house(20, 238, 120, 70, {
        color: haze("#d9c9b0", 0.62, "#a2adb5"),
        roof: haze(P.coral, 0.55, "#a2adb5"),
        door: haze(P.teal, 0.5, "#a2adb5"),
      }),
    ) +
    g(
      house(470, 236, 130, 76, {
        color: haze("#c9d3d8", 0.62, "#a2adb5"),
        roof: haze(P.navy, 0.5, "#a2adb5"),
        door: haze(P.coral, 0.5, "#a2adb5"),
      }),
    ) +
    tree(170, 240, 0.6, { tone: haze(P.leaf, 0.45, "#a2adb5") }) +
    tree(420, 238, 0.5, { kind: "pine", tone: haze("#2f6b4f", 0.45, "#a2adb5") }) +
    cloud(110, 70, 1.15, { dark: true }) +
    cloud(360, 44, 1.35, { dark: true }) +
    cloud(545, 82, 1.05, { dark: true }) +
    ground(640, 236, 164, "grass", { seed: 6 }) +
    rect(0, 236, 640, 164, "#5b6f7c", 'opacity=".18"') +
    puddle(440, 366, 92, 18) +
    ripples(420, 364) +
    ripples(470, 370) +
    person(BX, BY, BH, boy) +
    boots(BX, BY, BH, P.teal) +
    rainHat(J.head, J.headR, P.yellow) +
    umbrellaHeld(hx, hy, hx - 14, J.head[1] - J.headR - 64, 96, P.blue) +
    rain(0, 0, 640, 400, { n: 150, seed: 9, o: 0.6 }) +
    ellipse(BX + 4, BY + 1, 40, 6, "#1c2f4a", 'opacity=".12"') +
    tuft(40, 390, 1.2) +
    tuft(612, 384, 1.1) +
    tuft(120, 372, 0.9),
};
