import { P, SKIN, HAIR, rect, sky, sun, cloud, hills, ground, rain, puddle, person, umbrella, tuft, flower, tree, line, stroke } from "../kit.mjs";
import { frameCard, handAt, overlay, shorts, boots, kite } from "../lib/c.mjs";

const boy = { pose: "reach", facing: 1, skin: SKIN[4], hair: HAIR[0], hairStyle: "curly", top: P.gold, bottom: SKIN[4], sleeve: "short", mouth: "open" };
const BX = 120;
const BY = 352;
const BH = 142;
const [hx, hy] = handAt(BX, BY, BH, boy);
const KX = 232;
const KY = 104;

const sunny = () =>
  sky(640, 400) +
  sun(64, 70, 26) +
  cloud(240, 196, 0.5) +
  hills(640, 266, { seed: 4 }) +
  tree(260, 268, 0.42, { seed: 2 }) +
  ground(640, 262, 140, "grass", { seed: 3 }) +
  stroke(`M${hx.toFixed(1)} ${hy.toFixed(1)} Q${(hx + 70).toFixed(1)} ${(hy - 60).toFixed(1)} ${KX} ${KY}`, "#4e5d6c", 1.4) +
  kite(KX, KY, 1.15, { color: P.coral, alt: P.teal }) +
  person(BX, BY, BH, boy) +
  overlay(BX, BY, BH, 1, shorts(P.blue)) +
  flower(40, 384, 0.9, { color: P.pink }) +
  flower(268, 380, 0.8, { color: P.gold, center: P.coral }) +
  tuft(190, 388, 1.1);

const girl = { pose: "reach", facing: -1, skin: SKIN[1], hair: HAIR[1], hairStyle: "long", top: P.yellow, coat: P.yellow, skirt: true, bottom: "#e9b52a", mouth: "smile" };
const GX = 470;
const GY = 346;
const GH = 140;
const [ux, uy] = handAt(GX, GY, GH, girl);

const rainy = () =>
  sky(640, 400, "storm") +
  cloud(410, 70, 0.95, { dark: true }) +
  cloud(540, 96, 0.8, { dark: true }) +
  cloud(600, 50, 0.7, { dark: true }) +
  hills(640, 266, { seed: 6, color: "#6f9a68", far: 0.55 }) +
  ground(640, 262, 140, "grass", { seed: 5 }) +
  rect(328, 262, 312, 140, "#2c4a5c", 'opacity=".22"') +
  rain(328, 60, 312, 340, { n: 110, seed: 9, color: "#e3eef5", o: 0.75 }) +
  puddle(548, 364, 64, 13) +
  stroke("M520 366 q8 -5 16 0 M560 360 q8 -5 16 0", "#e3eef5", 1.4, 'opacity=".8"') +
  umbrella(ux, uy, 56, P.teal) +
  person(GX, GY, GH, girl) +
  overlay(GX, GY, GH, -1, boots(P.red)) +
  tuft(360, 390, 1.1, "#4f7c48") +
  tuft(612, 392, 1.2, "#4f7c48");

export default {
  file: "35-speaking-weather.svg",
  w: 640,
  h: 400,
  title:
    "Two weather scenes. On the left, the sun shines in a blue sky and a boy in a T-shirt and shorts flies a kite. On the right, dark clouds drop rain, and a girl in a yellow raincoat and boots holds an umbrella next to a puddle.",
  draw: () => rect(0, 0, 640, 400, P.ivory) + frameCard(14, 14, 298, 372, sunny()) + frameCard(328, 14, 298, 372, rainy()),
};
