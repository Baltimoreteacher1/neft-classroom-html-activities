import { P, SKIN, HAIR, sky, sun, cloud, hills, ground, tree, person, kid, swings, slide, tuft, flower, fence } from "../../../access-practice-lab/src/art/kit.js";
import { hoop, basketball, handAt } from "../lib/c.mjs";

// Slide mirrored so its ladder is on the right and the line of five waits beside it.
const mirroredSlide = (ladderX, y, h) => `<g transform="translate(${ladderX + 30} 0) scale(-1 1)">${slide(0, y, h, { color: P.coral })}</g>`;

const line = [0, 1, 2, 3, 4]
  .map((i) => {
    const o = kid([3, 1, 0, 4, 2][i], { pose: "stand", facing: -1, sleeve: "short" });
    return person(186 + i * 30, 336 + (i % 2) * 3, [100, 94, 104, 92, 98][i], o);
  })
  .reverse()
  .join("");

const boy1 = { pose: "reach", facing: 1, skin: SKIN[2], hair: HAIR[0], hairStyle: "short", top: P.green, bottom: P.navy, sleeve: "short", mouth: "open" };
const [bx, by] = handAt(536, 378, 108, boy1);

export default {
  file: "35-speaking-playground.svg",
  w: 640,
  h: 400,
  title:
    "A busy playground with a tall slide, two swings, a tree, and a basketball hoop. Five kids wait in a long line for the slide. One girl swings, and the other swing is empty. Two boys play with a ball near the hoop. A teacher stands by the tree.",
  draw: () =>
    sky(640, 260) +
    sun(70, 56, 22) +
    cloud(420, 54, 0.75) +
    cloud(250, 80, 0.5) +
    hills(640, 236, { seed: 7 }) +
    ground(640, 228, 172, "grass", { seed: 11 }) +
    fence(0, 640, 252, 26) +
    tree(330, 312, 1.05, { seed: 5 }) +
    person(364, 318, 150, { pose: "stand", age: "adult", facing: 1, skin: SKIN[4], hair: HAIR[0], hairStyle: "bun", top: P.teal, bottom: "#4e5d6c", skirt: true }) +
    mirroredSlide(150, 340, 170) +
    line +
    swings(408, 340, 140, 136, { seats: 2 }) +
    person(448, 308, 100, { pose: "sit", skin: SKIN[0], hair: HAIR[3], hairStyle: "braid", top: P.purple, bottom: "#3e4a5c", sleeve: "short", mouth: "open" }) +
    hoop(612, 360, 156) +
    person(536, 378, 108, boy1) +
    basketball(bx + 4, by - 10, 10) +
    person(594, 380, 104, { pose: "cheer", facing: -1, skin: SKIN[5], hair: HAIR[0], hairStyle: "curly", top: P.orange, bottom: "#2f4858", sleeve: "short", mouth: "open" }) +
    tuft(30, 390, 1.2) +
    tuft(330, 392) +
    flower(300, 394, 0.9, { color: P.pink }) +
    flower(20, 360, 0.8, { color: P.gold, center: P.coral }),
};
