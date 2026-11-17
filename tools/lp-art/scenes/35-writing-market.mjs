import { P, SKIN, HAIR, path, sky, sun, cloud, building, ground, person, stall, rect, tuft, light, shade, g, tr, rrect, stroke, PROPS } from "../../../access-practice-lab/src/art/kit.js";
import { produce, tallStand } from "../lib/c.mjs";

const G = 300;
const fruit = tallStand(40, G, 220, P.coral);
const veg = tallStand(366, G, 220, P.green);
// Shopping bag with vegetables, drawn at a hand (figure units).
const veggieBag = g(stroke("M-7 -2 q7 -12 14 0", "#7a5236", 2.2) + `<g transform="translate(0 14)">${rrect(-12, -12, 24, 26, 3, "#e3c48f")}${rect(2, -12, 10, 26, "#cfae78", 'opacity=".8"')}${stroke("M-6 -12 l-2 -10 M-2 -12 l1 -12 M3 -12 l4 -9", P.green, 2.6)}${rect(-9, -16, 6, 6, P.orange, 'rx="2"')}</g>`);

export default {
  file: "35-writing-market.svg",
  w: 640,
  h: 400,
  title:
    "A busy community market with two stands under striped roofs, one selling fruit and one selling vegetables, a seller, and a mother and child carrying a shopping bag.",
  draw: () =>
    sky(640, 260) +
    sun(586, 58, 24) +
    cloud(330, 60, 0.7) +
    building(-10, 230, 150, 120, { color: "#d9b38c", windows: [3, 2], door: false }) +
    building(500, 230, 150, 140, { color: "#9fb7c4", windows: [3, 2], door: false }) +
    ground(640, 228, 172, "pavement") +
    // fruit stand (left), coral stripes, with the seller behind it
    fruit.back +
    person(150, G - 14, 134, { pose: "wave", age: "adult", facing: 1, skin: SKIN[3], hair: HAIR[0], hairStyle: "cap", top: P.teal, apron: "#f4efe6", mouth: "open" }) +
    fruit.roof +
    fruit.front +
    produce(50, G - 52, 70, "apple", { seed: 2 }) +
    produce(124, G - 52, 64, "orange", { seed: 3 }) +
    produce(194, G - 46, 60, "banana") +
    // vegetable stand (right), green stripes
    veg.back +
    veg.roof +
    veg.front +
    produce(374, G - 52, 70, "carrot") +
    produce(446, G - 52, 64, "lettuce", { seed: 4 }) +
    produce(514, G - 52, 64, "tomato", { seed: 5 }) +
    // mother and child carrying a shopping bag between them
    person(286, 376, 156, { pose: "walk", age: "adult", facing: 1, skin: SKIN[1], hair: P.teal, hairStyle: "hijab", top: P.coral, bottom: P.navy, skirt: false, item: veggieBag }) +
    person(352, 382, 104, { pose: "walk", facing: 1, skin: SKIN[1], hair: HAIR[2], hairStyle: "short", top: P.gold, bottom: "#3e4a5c", sleeve: "short", mouth: "open" }) +
    tuft(20, 392) +
    tuft(620, 388),
};
