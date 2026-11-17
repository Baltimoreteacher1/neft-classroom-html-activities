import { P, sky, sun, cloud, rect, ellipse, path, g, vgrad, stroke, arrow, rain, hills, ground, tree, tuft, haze, shade, light, pond, circle } from "../kit.mjs";
import { mountain, vapor } from "../lib/b.mjs";

const T = "#0f5f73";

export default {
  file: "35-reading-water-cycle.svg",
  w: 640,
  h: 400,
  title:
    "A water cycle diagram: the sun heats a lake, arrows show water rising to a cloud, rain falls from the cloud onto a mountain, and water flows back into the lake.",
  draw: () =>
    sky(640, 300) +
    sun(76, 66, 30) +
    mountain(590, 296, 260, 170, { color: haze("#7f9a8a", 0.35) }) +
    mountain(486, 300, 300, 214, { color: "#86998a" }) +
    ground(640, 290, 110, "grass", { seed: 7 }) +
    // river from the mountain back to the lake
    path("M452 300 C430 318 400 316 372 326 C350 334 330 338 300 340 L300 352 C336 350 360 344 384 336 C410 328 440 322 470 302Z", vgrad([[0, P.waterLight], [1, P.water]])) +
    // lake
    ellipse(170, 340, 150, 40, shade(P.grass, 0.3), 'opacity=".45"') +
    ellipse(170, 336, 142, 34, vgrad([[0, P.waterLight], [1, P.water]])) +
    stroke("M100 330h40M180 344h50M130 352h30", "#ffffff", 2.4, 'opacity=".7"') +
    tree(46, 312, 0.45, { seed: 3 }) +
    tree(610, 330, 0.4, { kind: "pine", tone: "#3f7a5c" }) +
    tuft(300, 384, 1.2) + tuft(560, 380) + tuft(40, 388) +
    // sun heating the lake
    stroke("M98 98 L132 278M70 104 L84 276M122 88 L182 270", P.gold, 3, 'stroke-dasharray="8 8" opacity=".85"') +
    // vapour rising
    vapor(176, 290, 90) + vapor(206, 284, 100) + vapor(236, 290, 86) +
    // cloud and rain
    cloud(470, 86, 1.45) +
    rain(410, 112, 140, 110, { n: 26, seed: 4, color: P.waterDark, o: 0.85 }) +
    // cycle arrows
    arrow("M250 196 Q300 110 384 92", T, 6) +
    arrow("M584 104 Q600 150 574 206", T, 6) +
    arrow("M500 362 Q440 380 352 366", T, 6),
};
