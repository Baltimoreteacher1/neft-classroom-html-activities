import { P, SKIN, HAIR, sky, sun, cloud, hills, ground, tree, bench, person, duck, tuft, flower, g, tr, rect, rrect, circle, ellipse, path, stroke, vgrad, shade, light, haze, contact } from "../../../access-practice-lab/src/art/kit.js";

// A city park: tall trees, a fountain in the middle with a path looping around it, a pond with three ducks.
const stone = "#c9c3b8";
const fountain = (x, y) => {
  let b = contact(0, 6, 92, 14, 0.22);
  // lower basin
  b += ellipse(0, 0, 88, 22, shade(stone, 0.22));
  b += rect(-88, -22, 176, 22, stone) + rect(30, -22, 58, 22, shade(stone, 0.12), 'opacity=".8"');
  b += ellipse(0, -22, 88, 22, light(stone, 0.18));
  b += ellipse(0, -22, 78, 17, vgrad([[0, P.waterDark], [1, P.water]]));
  b += ellipse(-20, -24, 34, 6, P.waterLight, 'opacity=".55"');
  // pedestal + upper bowl
  b += path("M-10 -26 L-7 -80 L7 -80 L10 -26Z", stone) + path("M2 -26 L4 -80 L7 -80 L10 -26Z", shade(stone, 0.15));
  b += path("M-42 -88 Q-38 -72 0 -70 Q38 -72 42 -88Z", stone) + path("M10 -71 Q38 -72 42 -88 L20 -88Z", shade(stone, 0.14));
  b += ellipse(0, -88, 42, 9, light(stone, 0.2)) + ellipse(0, -88, 35, 6.5, P.water);
  b += path("M-4 -92 L-3 -112 L3 -112 L4 -92Z", stone);
  // water arcs and spray
  const jet = "#d9f0f8";
  b += stroke("M0 -114 Q-26 -142 -40 -92M0 -114 Q26 -142 40 -92M0 -114 Q-12 -146 -22 -100M0 -114 Q12 -146 22 -100", jet, 3, 'opacity=".9"');
  b += stroke("M-40 -86 Q-58 -60 -64 -30M40 -86 Q58 -60 64 -30M-28 -84 Q-36 -60 -40 -32M28 -84 Q36 -60 40 -32", jet, 2.4, 'opacity=".75"');
  for (const [dx, dy] of [[-64, -26], [64, -26], [-40, -28], [40, -28], [-6, -118], [6, -120]]) b += circle(dx, dy, 2.2, "#ffffff", 'opacity=".85"');
  return tr(x, y, b);
};

const pondShape = (x, y, rx, ry) =>
  g(
    ellipse(x, y + 4, rx + 10, ry + 7, shade(P.grass, 0.25), 'opacity=".55"') +
      ellipse(x, y, rx + 4, ry + 3, "#b9b09c") +
      ellipse(x, y, rx, ry, vgrad([[0, P.waterLight], [0.6, P.water], [1, P.waterDark]])) +
      stroke(`M${x - rx * 0.6} ${y - ry * 0.3}h${rx * 0.35}M${x + rx * 0.05} ${y + ry * 0.25}h${rx * 0.4}M${x - rx * 0.3} ${y + ry * 0.5}h${rx * 0.2}`, "#ffffff", 2, 'opacity=".6"'),
  );

const reeds = (x, y) =>
  tr(x, y, stroke("M0 0 Q-2 -24 -4 -40M6 0 Q8 -20 10 -34M-6 0 Q-10 -16 -14 -26", P.leafDark, 2.6) + rrect(-6.5, -50, 5, 14, 2.5, "#7a5236") + rrect(7.5, -44, 5, 13, 2.5, "#7a5236"));

export default {
  file: "68-park.svg",
  w: 640,
  h: 400,
  title: "A park with tall trees, a pond with ducks, a fountain, and a path.",
  draw: () =>
    sky(640, 230) +
    sun(520, 56, 22) +
    cloud(120, 58, 0.8) +
    cloud(390, 40, 0.6) +
    // distant city skyline, hazed
    [[180, 60, 70], [214, 44, 96], [252, 56, 62], [420, 50, 84], [462, 40, 58], [496, 46, 76]].map(([x, w, h]) => rect(x, 200 - h, w, h, haze("#7d8fa3", 0.55))).join("") +
    hills(640, 200, { seed: 6, amp: 14 }) +
    tree(150, 206, 0.42, { seed: 2, tone: haze(P.leaf, 0.35) }) +
    tree(520, 204, 0.4, { kind: "pine", tone: haze("#2f6b4f", 0.35) }) +
    ground(640, 196, 204, "grass") +
    // path: a loop around the fountain plaza, joined by a walk from the front
    path("M150 400 C190 340 214 312 236 292 L282 298 C252 322 236 356 228 400Z", "#e8d6b4") +
    ellipse(320, 262, 206, 58, "#e8d6b4") +
    ellipse(320, 262, 206, 58, "none", `stroke="${shade("#e8d6b4", 0.12)}" stroke-width="3" opacity=".6"`) +
    ellipse(320, 262, 158, 38, P.grass) +
    ellipse(320, 262, 112, 26, "#ddd3c0") +
    // tall trees framing the scene
    tree(40, 300, 1.45, { seed: 4 }) +
    tree(604, 292, 1.4, { kind: "oak", seed: 9, tone: "#5a9461" }) +
    tree(176, 232, 0.95, { seed: 12, tone: "#6aa275" }) +
    tree(472, 230, 0.9, { seed: 14, tone: "#5f9a6a" }) +
    fountain(320, 272) +
    // pond with three ducks (front right) and reeds
    bench(410, 318, 92) +
    pondShape(470, 354, 118, 32) +
    reeds(370, 352) +
    reeds(576, 344) +
    duck(430, 352, 1.5, { facing: 1 }) +
    duck(486, 340, 1.3, { facing: -1 }) +
    duck(520, 362, 1.4, { facing: -1 }) +
    // people on the path
    person(176, 352, 128, { pose: "walk", age: "adult", skin: SKIN[4], hair: HAIR[0], hairStyle: "bun", top: P.coral, bottom: "#3e4a5c", facing: 1 }) +
    person(226, 360, 116, { pose: "walk", age: "adult", skin: SKIN[1], hair: HAIR[2], hairStyle: "short", top: P.teal, bottom: P.navy, facing: 1, backpack: P.gold }) +
    tuft(24, 396, 1.2) +
    tuft(286, 396) +
    flower(320, 398, 0.9, { color: P.pink }) +
    flower(304, 394, 0.8, { color: P.gold, center: P.coral }) +
    flower(18, 372, 0.9, { color: P.coralLight }),
};
