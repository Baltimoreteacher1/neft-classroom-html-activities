import { P, SKIN, HAIR, person, g, tr, rect, rrect, circle, ellipse, path, poly, stroke, line, vgrad, shade, light, mix, contact } from "../kit.mjs";
import { room, wallClock, door } from "../lib/e.mjs";

// A busy middle-school hallway: a long row of lockers on the left, a classroom door with a clock above it,
// a water fountain on the right where one student fills a bottle, and students walking to class with backpacks.
const lockers = (x0, y, n, w, h) => {
  let b = rect(x0 - 4, y - h - 6, n * w + 8, h + 10, "#7f8a96");
  for (let i = 0; i < n; i++) {
    const x = x0 + i * w;
    const c = i % 2 ? "#3f7fb8" : "#2f8c84";
    b += rect(x + 1, y - h, w - 2, h, c) + rect(x + w - 7, y - h, 6, h, shade(c, 0.18)) + rect(x + 1, y - h, 3, h, light(c, 0.2));
    let v = "";
    for (let k = 0; k < 4; k++) v += `M${x + 8} ${y - h + 14 + k * 6}h${w - 18}`;
    v += `M${x + 8} ${y - 34 + 0}h${w - 18}M${x + 8} ${y - 28}h${w - 18}`;
    b += stroke(v, shade(c, 0.35), 2);
    b += rrect(x + w - 14, y - h * 0.52, 5, 18, 2, "#d9dee3") + rect(x + 6, y - h * 0.45, 12, 8, shade(c, 0.12), 'opacity=".7"');
  }
  b += rect(x0 - 4, y, n * w + 8, 8, "#5d6772");
  return b;
};

const fountainUnit = (x, y) => {
  const steel = "#c7ced5";
  let b = contact(x, y, 34, 5, 0.18);
  // bottle filler (upper) + bowl (lower), wall-mounted
  b += rrect(x - 26, y - 190, 52, 78, 6, "#e3e7eb") + rrect(x + 8, y - 190, 18, 78, 6, shade("#e3e7eb", 0.08)) + rrect(x - 20, y - 182, 40, 12, 4, "#5d6772") + rect(x - 4, y - 112, 8, 4, "#8d97a1");
  b += rrect(x - 30, y - 74, 60, 24, 8, steel) + rect(x - 30, y - 74, 60, 6, light(steel, 0.3)) + rrect(x + 6, y - 74, 24, 24, 8, shade(steel, 0.12));
  b += rect(x - 10, y - 50, 20, 34, "#aeb7c0") + rect(x - 18, y - 18, 36, 18, "#9aa4ae");
  return b;
};

const bottle = (c) => rrect(-7, -14, 14, 30, 4, c) + rect(-5, -18, 10, 5, shade(c, 0.3)) + rect(-5, -10, 3, 20, "#ffffff", 'opacity=".35"');

export default {
  file: "68-school-hallway.svg",
  w: 640,
  h: 400,
  title: "A busy school hallway with a row of lockers, students carrying backpacks, a clock, and a water fountain.",
  draw: () =>
    room(640, 400, 290, { wall: "#ece4d3", floor: "tile", base: "#9aa4ae" }) +
    // ceiling light band
    rect(0, 0, 640, 18, "#f8f4ea") + rect(120, 6, 140, 8, "#fffdf3") + rect(400, 6, 140, 8, "#fffdf3") +
    // wall stripe
    rect(0, 104, 640, 10, "#2f8c84", 'opacity=".85"') +
    // student artwork pinned above the lockers (pictures only, no words)
    [[40, "#f6e3b8", P.coral], [104, "#d9ecf2", P.teal], [168, "#fbe1d6", P.gold], [232, "#e3efd9", P.blue]]
      .map(([x, paper, ink], i) => g(rect(x + 2, 40 + (i % 2) * 6, 48, 44, "#1c2f4a", 'opacity=".12"') + rect(x, 38 + (i % 2) * 6, 48, 44, paper) + circle(x + 24, 56 + (i % 2) * 6, 9, ink, 'opacity=".85"') + path(`M${x + 6} ${76 + (i % 2) * 6} l12 -12 l10 8 l14 -14 v18Z`, shade(ink, 0.1), 'opacity=".6"') + circle(x + 24, 40 + (i % 2) * 6, 2.4, P.red)))
      .join("") +
    lockers(20, 286, 9, 34, 160) +
    door(358, 290, 74, 168, { color: "#c8704f" }) +
    wallClock(395, 82, 20, { hr: 10, min: 10 }) +
    fountainUnit(552, 290) +
    // students: one fills a bottle at the fountain (right), three walk to class with backpacks
    person(486, 318, 150, { pose: "point", age: "adult", skin: SKIN[1], hair: HAIR[1], hairStyle: "bun", top: P.purple, bottom: "#3e4a5c", backpack: P.teal, facing: 1, item: tr(0, 0, bottle("#e2a72e")) }) +
    person(118, 344, 150, { pose: "walk", age: "adult", skin: SKIN[4], hair: HAIR[0], hairStyle: "short", top: P.gold, bottom: P.navy, backpack: P.coral, facing: 1 }) +
    person(250, 356, 146, { pose: "walk", age: "adult", skin: SKIN[0], hair: HAIR[3], hairStyle: "long", top: P.teal, bottom: "#4e5d6c", backpack: P.navy, facing: 1 }) +
    person(376, 384, 154, { pose: "walk", age: "adult", skin: SKIN[3], hair: HAIR[0], hairStyle: "curly", top: P.coral, bottom: "#2f4858", backpack: P.blue, facing: -1 }),
};
