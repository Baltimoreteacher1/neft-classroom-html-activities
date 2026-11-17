import { P, sky, sun, cloud, hills, rain, arrow, path, stroke, vgrad, tree, tuft, ellipse, g } from "../kit.mjs";

// Water cycle (unlabelled; students supply the words): the sun heats a lake, water vapour rises (3 wavy arrows),
// an arrow carries it up to a cloud, rain falls back to the lake, and an arrow runs down the hill into the lake.
const ink = P.navyDeep;

const vapour = (x) =>
  arrow(`M${x} 312 c-12 -14 12 -24 0 -38 c-12 -14 12 -24 0 -38 c-6 -7 0 -12 0 -20 v-10`, ink, 3.6);

export default {
  file: "68-water-cycle.svg",
  w: 640,
  h: 400,
  title: "The sun shines on a lake. Arrows show water rising, a cloud forming, and rain falling back to the lake.",
  draw: () =>
    sky(640, 400) +
    sun(92, 82, 30) +
    hills(640, 262, { seed: 6, far: 0.55, amp: 30 }) +
    // near hill on the right
    path("M420 300 C470 290 500 210 560 180 C570 152 610 160 640 166 V400 H330Z", vgrad([[0, P.grassLight], [0.5, P.grass], [1, P.grassDark]])) +
    path("M560 180 C590 166 615 164 640 166 V200 C610 194 585 200 560 220Z", "#ffffff", 'opacity=".12"') +
    tree(586, 214, 0.42, { kind: "pine", tone: "#3f7d5c" }) +
    tree(618, 204, 0.36, { kind: "pine", tone: "#4f8a6a" }) +
    tree(622, 262, 0.48, { kind: "round", seed: 3 }) +
    // shore and lake
    path("M0 288 C140 282 330 284 440 296 C460 300 468 312 460 330 L448 400 H0Z", "#d9c79a") +
    path("M0 298 C140 292 330 294 428 306 C444 310 448 322 440 338 L424 400 H0Z", vgrad([[0, P.waterLight], [0.4, P.water], [1, P.waterDark]])) +
    stroke("M40 330h70M150 352h90M60 376h60M210 318h60", "#ffffff", 2.4, 'opacity=".55"') +
    tuft(444, 302, 0.9) +
    tuft(462, 342, 1.1) +
    // evaporation
    g(vapour(118) + vapour(178) + vapour(238)) +
    // vapour rises and gathers into the cloud
    arrow("M258 182 C276 126 300 100 334 94", ink, 3.6).replace("<path", '<path stroke-dasharray="9 8"') +
    cloud(408, 90, 1.45) +
    ellipse(408, 112, 74, 12, "#c9dbe5", 'opacity=".7"') +
    // precipitation back to the lake and the hillside
    rain(340, 130, 128, 190, { n: 74, seed: 9, color: P.blue, o: 0.75 }) +
    // runoff down the hill into the lake
    arrow("M600 312 C560 326 520 342 452 344", ink, 4),
};
