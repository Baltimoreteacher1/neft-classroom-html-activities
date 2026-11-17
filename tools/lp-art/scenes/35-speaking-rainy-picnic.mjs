import { P, SKIN, HAIR, sky, sun, cloud, hills, ground, tree, rain, puddle, person, panels, rect, wallWindow, tuft, flower, contact, bookshelf, PROPS, circle, ellipse, g } from "../../../access-practice-lab/src/art/kit.js";
import { picnicBasket, blanket } from "../lib/c.mjs";

// The same three people in every panel.
const MOM = { age: "adult", skin: SKIN[3], hair: HAIR[0], hairStyle: "bun", top: P.coral, bottom: P.teal, skirt: true };
const GIRL = { skin: SKIN[3], hair: HAIR[0], hairStyle: "puffs", top: P.gold, bottom: P.navy, sleeve: "short" };
const BOY = { skin: SKIN[3], hair: HAIR[0], hairStyle: "short", top: P.blue, bottom: "#3e4a5c", sleeve: "short" };

const basketItem = picnicBasket(0.9);

const p1 = (x, y, w, h) =>
  sky(640, 400) +
  sun(x + w - 40, y + 64, 22) +
  cloud(x + 70, y + 70, 0.5) +
  hills(640, y + 230, { seed: 3 }) +
  tree(x + 40, y + 248, 0.78, { seed: 2 }) +
  ground(640, y + 226, 200, "grass", { seed: 4 }) +
  person(x + 50, y + 330, 100, { ...GIRL, pose: "walk", facing: 1 }) +
  person(x + 104, y + 316, 150, { ...MOM, pose: "hold", facing: 1, item: basketItem }) +
  person(x + 164, y + 366, 96, { ...BOY, pose: "walk", facing: 1 }) +
  flower(x + 20, y + 366, 0.8, { color: P.pink }) +
  tuft(x + 176, y + 364);

const p2 = (x, y, w, h) =>
  sky(640, 400, "storm") +
  cloud(x + 60, y + 72, 0.75, { dark: true }) +
  cloud(x + 150, y + 54, 0.7, { dark: true }) +
  hills(640, y + 230, { seed: 3, color: "#6f9a68", far: 0.55 }) +
  ground(640, y + 226, 200, "grass", { seed: 5 }) +
  rect(x, y + 226, w, 200, "#2c4a5c", 'opacity=".2"') +
  blanket(x + 120, y + 270, 110, 34, { color: P.red, skew: 16 }) +
  ellipse(x + 140, y + 266, 12, 4, "#f4f2ee") +
  circle(x + 104, y + 270, 5, P.red) +
  puddle(x + 46, y + 352, 34, 7) +
  rain(x, y + 40, w, h, { n: 70, seed: 4, color: "#e3eef5", o: 0.75 }) +
  person(x + 30, y + 360, 92, { ...GIRL, pose: "run", facing: -1, mouth: "open" }) +
  person(x + 112, y + 340, 150, { ...MOM, pose: "run", facing: -1, mouth: "open", item: basketItem }) +
  person(x + 170, y + 350, 94, { ...BOY, pose: "run", facing: -1, mouth: "open" });

const p3 = (x, y, w, h) =>
  rect(x, y, w, h, "#f3e2c6") +
  rect(x, y + 214, w, 8, "#e3cda8") +
  wallWindow(x + 50, y + 54, 96, 84, { view: "rain", curtain: P.coralLight }) +
  rain(x + 50, y + 54, 96, 84, { n: 18, seed: 2, color: "#ffffff", o: 0.7 }) +
  ground(640, y + 222, 160, "floor") +
  blanket(x + w / 2, y + 306, 170, 60, { color: P.red, skew: 22 }) +
  person(x + 98, y + 272, 86, { ...BOY, pose: "sit", facing: 1, item: PROPS.cup(P.blue) }) +
  g(`<g transform="translate(${x + 104} ${y + 262})">${basketItem}</g>`) +
  person(x + 164, y + 300, 132, { ...MOM, pose: "sit", facing: -1, item: PROPS.cup(P.gold) }) +
  person(x + 38, y + 314, 96, { ...GIRL, pose: "sit", facing: 1 }) +
  ellipse(x + 104, y + 340, 16, 5, "#f4f2ee") +
  circle(x + 99, y + 337, 4, P.red) +
  circle(x + 108, y + 338, 4, P.green);

export default {
  file: "35-speaking-rainy-picnic.svg",
  w: 640,
  h: 400,
  title:
    "A picture story in three parts. 1: Under a sunny sky, a mother and two children carry a picnic basket to the park. 2: Dark clouds come and rain falls on their picnic blanket, so they run. 3: At home, the family eats the picnic on a blanket on the living room floor while rain falls outside the window.",
  draw: () => panels(640, 400, 3, (i, x, y, w, h) => [p1, p2, p3][i](x, y, w, h)),
};
