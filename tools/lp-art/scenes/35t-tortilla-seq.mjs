import { P, SKIN, HAIR, panels, person, wallWindow, tr, g, rect, rrect, circle, ellipse, path, poly, stroke, line, vgrad, shade, light, mix, text } from "../../../access-practice-lab/src/art/kit.js";
import { room } from "../lib/e.mjs";

// Three pictures in order. 1: a girl and her grandmother mix dough with a spoon in a big blue bowl next to a bag
// of flour. 2: they roll the dough into balls and flatten them into thin circles with a rolling pin.
// 3: the family sits at the table and shares a big stack of tortillas.
const GIRL = { age: "child", skin: SKIN[2], hair: HAIR[0], hairStyle: "braid", top: P.coral, bottom: P.navy, sleeve: "short" };
const GRAN = { age: "elder", skin: SKIN[2], hair: HAIR[5], hairStyle: "bun", top: P.purple, bottom: "#4a3f5c", glasses: true, apron: "#f4efe6" };
const DAD = { age: "adult", skin: SKIN[3], hair: HAIR[0], hairStyle: "short", top: P.teal, bottom: P.navy };
const DOUGH = "#f3e3c3";
const BLUE = "#3b7dc4";

const tableFront = (w, ty, h) =>
  g(
    rect(0, ty, w, 10, "#c9935e") +
      rect(0, ty + 10, w, h - ty - 10, vgrad([[0, "#a8703f"], [1, "#8a5a32"]])) +
      stroke(`M0 ${ty + 70}H${w}`, "#7a4d2a", 1.2, 'opacity=".5"') +
      // woven table cloth hanging over the front edge
      rect(0, ty + 8, w, 46, "#f4efe6") +
      rect(0, ty + 8, w, 4, shade("#f4efe6", 0.12)) +
      rect(0, ty + 20, w, 5, P.coral) +
      rect(0, ty + 28, w, 3, P.gold) +
      rect(0, ty + 34, w, 5, P.teal) +
      rect(0, ty + 42, w, 3, P.gold) +
      stroke(`M0 ${ty + 54}H${w}`, shade("#f4efe6", 0.2), 2) +
      rect(0, ty + 56, w, 8, "#1c2f4a", 'opacity=".12"'),
  );

const bowl = (x, y, r = 40) =>
  g(ellipse(x, y + 2, r * 0.9, 5, "#1c2f4a", 'opacity=".2"') + path(`M${x - r} ${y - r * 0.62} Q${x - r * 0.9} ${y} ${x} ${y} Q${x + r * 0.9} ${y} ${x + r} ${y - r * 0.62}Z`, BLUE) + path(`M${x + r * 0.25} ${y - 1} Q${x + r * 0.9} ${y} ${x + r} ${y - r * 0.62} L${x + r * 0.55} ${y - r * 0.62}Z`, shade(BLUE, 0.18)) + ellipse(x, y - r * 0.62, r, r * 0.2, light(BLUE, 0.2)) + ellipse(x, y - r * 0.6, r * 0.86, r * 0.14, DOUGH) + ellipse(x - r * 0.2, y - r * 0.64, r * 0.3, r * 0.06, "#fff8e8"));

const flourBag = (x, y) =>
  g(ellipse(x, y + 2, 20, 4, "#1c2f4a", 'opacity=".2"') + path(`M${x - 18} ${y} L${x - 16} ${y - 44} Q${x - 10} ${y - 50} ${x - 4} ${y - 44} Q${x + 4} ${y - 52} ${x + 10} ${y - 44} Q${x + 14} ${y - 50} ${x + 17} ${y - 44} L${x + 19} ${y}Z`, "#f4efe6") + rect(x + 4, y - 44, 15, 44, "#e3dccd", 'opacity=".7"') + ellipse(x, y - 22, 10, 7, "#e2a72e") + ellipse(x, y - 22, 5, 3.4, "#f3cd6f"));

const spoon = (x1, y1, x2, y2) => stroke(`M${x1} ${y1}L${x2} ${y2}`, "#b98457", 4) + ellipse(x2, y2, 4, 6, "#b98457");
const rollingPin = (x, y, w = 58) => g(rrect(x - w / 2, y - 7, w, 14, 7, "#d4a676") + rect(x - w / 2 + 6, y - 5, w - 12, 3, "#e8c79c") + rrect(x - w / 2 - 12, y - 3.5, 13, 7, 3, "#a8703f") + rrect(x + w / 2 - 1, y - 3.5, 13, 7, 3, "#a8703f"));
const ball = (x, y, r = 7) => circle(x, y - r, r, DOUGH) + circle(x - r * 0.3, y - r * 1.3, r * 0.35, "#fff8e8");
const flat = (x, y, rx = 22) => g(ellipse(x, y + 1, rx + 1, rx * 0.22 + 1, "#1c2f4a", 'opacity=".12"') + ellipse(x, y, rx, rx * 0.22, DOUGH) + circle(x - 6, y - 1, 1.2, "#d9b98f") + circle(x + 7, y + 1, 1.2, "#d9b98f"));
const stack = (x, y, n = 9, rx = 34) => {
  let b = ellipse(x, y + 4, rx + 12, 9, "#ffffff") + ellipse(x, y + 4, rx + 12, 9, "none", `stroke="#d8dde2" stroke-width="2"`);
  for (let i = 0; i < n; i++) {
    const yy = y - i * 4.2;
    b += ellipse(x + (i % 2 ? 1 : -1), yy, rx, 7, i % 2 ? "#ead2a2" : "#f0dcb2") + ellipse(x + (i % 2 ? 1 : -1), yy - 1, rx - 2, 5.5, i % 2 ? "#f0dcb2" : "#f5e4c0");
  }
  const top = y - (n - 1) * 4.2;
  for (const [dx, dy] of [[-12, -1], [6, 1], [16, -2], [-2, 2]]) b += ellipse(x + dx, top + dy, 2.2, 1.2, "#c99a5c");
  return g(b);
};

const kitchen = (w, h) => {
  const fy = h - 120;
  return room(w, h, fy, { wall: "#f3dfc4" }) + wallWindow(w / 2 - 34, 60, 68, 56, { view: "day", frame: P.ivory }) + rect(16, 140, w - 32, 6, "#b98457") + [26, 48, 70].map((x, i) => g(rect(x, 112, 14, 28, [P.coral, P.gold, P.teal][i]) + rect(x - 2, 108, 18, 6, shade([P.coral, P.gold, P.teal][i], 0.3)))).join("") + [w - 70, w - 46].map((x) => g(rect(x, 116, 16, 24, "#f4efe6") + rect(x + 2, 112, 12, 4, "#b98457"))).join("");
};

const frame = (i, w, h) => {
  const ty = h - 104;
  let b = kitchen(w, h);
  if (i === 0) {
    b += person(56, ty + 112, 230, { ...GRAN, pose: "hold", facing: 1 });
    b += person(152, ty + 82, 184, { ...GIRL, pose: "hold", facing: -1, mouth: "open" });
    b += tableFront(w, ty, h);
    b += flourBag(26, ty + 4);
    b += bowl(102, ty + 6, 44);
    b += spoon(82, ty - 58, 98, ty - 22);
  }
  if (i === 1) {
    b += person(56, ty + 112, 230, { ...GRAN, pose: "hold", facing: 1 });
    b += person(152, ty + 82, 184, { ...GIRL, pose: "hold", facing: -1, mouth: "smile" });
    b += tableFront(w, ty, h);
    b += flat(70, ty + 4, 26) + rollingPin(70, ty - 4, 54);
    b += ball(124, ty + 6) + ball(140, ty + 4) + ball(156, ty + 7) + ball(132, ty - 4, 6);
    b += flat(112, ty - 6, 20) + flat(166, ty - 10, 18);
  }
  if (i === 2) {
    b += person(36, ty + 100, 206, { ...GRAN, pose: "hold", facing: 1, mouth: "open" });
    b += person(98, ty + 104, 222, { ...DAD, pose: "hold", facing: 1, mouth: "smile" });
    b += person(160, ty + 76, 170, { ...GIRL, pose: "hold", facing: -1, mouth: "open" });
    b += tableFront(w, ty, h);
    b += stack(w / 2, ty + 2, 10, 32);
    b += ellipse(28, ty + 6, 18, 4, "#ffffff") + ellipse(w - 26, ty + 6, 18, 4, "#ffffff") + ellipse(28, ty + 4, 13, 3, "#f0dcb2") + ellipse(w - 26, ty + 4, 13, 3, "#f0dcb2");
  }
  return b;
};

export default {
  file: "35t-tortilla-seq.svg",
  w: 640,
  h: 400,
  title:
    "Three pictures in order. 1: A girl and her grandmother mix dough with a spoon in a big bowl next to a bag of flour. 2: They roll the dough into balls and flatten them into thin circles with a rolling pin. 3: The family sits at the table and shares a big stack of tortillas together.",
  draw: () => panels(640, 400, 3, (i, x, y, w, h) => tr(x, y, frame(i, w, h))),
};
