import { P, SKIN, HAIR, sky, sun, cloud, hills, ground, tree, person, tuft, flower, ellipse, circle, path, rgrad, stroke, g } from "../kit.mjs";
import { BP, plate, iceCube } from "../lib/b.mjs";

const pencil = `<g transform="translate(-4 -4) rotate(-40)">${"<rect x=\"-1.6\" y=\"-12\" width=\"3.2\" height=\"14\" fill=\"#f2c335\"/><polygon points=\"-1.6,2 1.6,2 0,6\" fill=\"#f0d6b0\"/>"}</g>`;

export default {
  file: "35-speaking-ice-melt.svg",
  w: 640,
  h: 400,
  title:
    "A science experiment outside. Two plates each started with three ice cubes. The plate in the sunshine now has only a puddle of water. The plate in the shade under a tree still has three small ice cubes. A boy writes notes on a clipboard.",
  draw: () =>
    sky(640, 260) +
    cloud(330, 52, 0.7) +
    hills(640, 240, { seed: 5 }) +
    ground(640, 236, 164, "grass", { seed: 3 }) +
    // sunshine on the left
    circle(96, 70, 260, rgrad([[0, "#fff1b8", 0.55], [1, "#fff1b8", 0]])) +
    sun(96, 70, 30) +
    stroke("M130 102 L176 300M108 112 L132 296M150 92 L214 288", "#f6d77a", 4, 'opacity=".45"') +
    ellipse(170, 334, 110, 26, "#fff4c9", 'opacity=".45"') +
    // tree and its shade on the right
    ellipse(492, 340, 150, 34, "#1c3b2a", 'opacity=".28"') +
    tree(510, 318, 1.42, { seed: 8 }) +
    // plate in the sun: only water
    plate(170, 336, 58, 16) +
    ellipse(170, 335, 38, 9, P.waterLight, 'opacity=".9"') +
    ellipse(162, 333, 14, 3, "#ffffff", 'opacity=".7"') +
    // plate in the shade: three small ice cubes
    plate(456, 350, 58, 16) +
    ellipse(456, 350, 30, 6, P.waterLight, 'opacity=".55"') +
    iceCube(434, 352, 1.05) + iceCube(458, 345, 1.05) + iceCube(480, 353, 1.05) +
    person(316, 388, 132, {
      pose: "read",
      skin: SKIN[4],
      hair: HAIR[0],
      hairStyle: "short",
      top: P.teal,
      bottom: "#3e4a5c",
      sleeve: "short",
      facing: 1,
      item: BP.clipboard() + pencil,
      mouth: "flat",
    }) +
    tuft(30, 390, 1.2) + tuft(260, 396) + tuft(610, 392, 1.1) +
    flower(46, 400, 0.8, { color: P.pink }) + flower(590, 398, 0.8, { color: "#ffffff", center: P.gold }),
};
