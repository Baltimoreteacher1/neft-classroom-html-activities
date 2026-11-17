import { P, SKIN, HAIR, panels, sky, cloud, ground, person, tuft, tr, g, rect, rrect, circle, ellipse, path, poly, stroke, line, vgrad, shade, light, contact } from "../../../access-practice-lab/src/art/kit.js";
import { room, sitDog, frown } from "../lib/e.mjs";

// Three pictures in order. 1: a sad boy outside his house holds an empty leash beside an empty dog house.
// 2: the boy and his mother talk to a worker at the animal shelter. 3: the worker has found the brown puppy
// and the boy hugs it happily. Same boy, mother and worker in every panel.
const BOY = { age: "child", skin: SKIN[3], hair: HAIR[0], hairStyle: "short", top: P.blue, bottom: P.navy, sleeve: "short" };
const MOM = { age: "adult", skin: SKIN[3], hair: HAIR[0], hairStyle: "curly", top: P.coral, bottom: "#3e4a5c" };
const WORKER = { age: "adult", skin: SKIN[1], hair: HAIR[4], hairStyle: "bun", top: P.teal, bottom: "#4e5d6c" };
const PUP = "#9c6436";

const dogHouse = (x, y, s = 1) =>
  tr(
    x,
    y,
    contact(0, 0, 44, 7, 0.22) +
      rect(-36, -46, 72, 46, "#c8704f") +
      rect(10, -46, 26, 46, shade("#c8704f", 0.16)) +
      poly([[-44, -42], [0, -76], [44, -42]], P.navy) +
      poly([[0, -76], [44, -42], [0, -42]], shade(P.navy, 0.25), 'opacity=".6"') +
      path("M-14 0 V-22 A14 14 0 0 1 14 -22 V0Z", "#2b1f18") +
      // empty food bowl
      ellipse(-52, -2, 13, 4, "#1c2f4a", 'opacity=".2"') +
      path("M-64 -8 h24 l-3 8 h-18Z", P.coral) +
      ellipse(-52, -8, 12, 3, shade(P.coral, 0.3)),
    s,
  );

const leash = (hx, hy, gx, gy) =>
  stroke(`M${hx} ${hy} C${hx + 6} ${hy + 40} ${gx - 20} ${gy - 10} ${gx} ${gy}`, P.coral, 3) + circle(gx + 3, gy - 2, 5, "none", `stroke="${P.goldLight}" stroke-width="2.4"`);

const pawSign = (x, y) =>
  g(
    rrect(x - 30, y - 22, 60, 44, 8, "#fbf6ec") +
      rrect(x - 30, y + 20, 60, 3, 2, "#1c2f4a", 'opacity=".12"') +
      ellipse(x, y + 6, 11, 9, P.teal) +
      circle(x - 12, y - 6, 4.5, P.teal) +
      circle(x - 4, y - 12, 4.5, P.teal) +
      circle(x + 5, y - 12, 4.5, P.teal) +
      circle(x + 13, y - 6, 4.5, P.teal),
  );

const counter = (x, y, w) => g(contact(x + w / 2, y, w * 0.55, 5, 0.2) + rect(x, y - 70, w, 70, "#b98457") + rect(x, y - 76, w + 6, 8, "#d4a676") + rect(x + w * 0.65, y - 70, w * 0.35, 70, shade("#b98457", 0.12)));

const outside = (w, h) => {
  const gy = h - 76;
  let b = sky(w, gy + 10) + cloud(w - 50, 70, 0.45);
  // house wall + door on the left
  b += rect(0, 90, 92, gy - 90, "#f1e4cf") + rect(64, 90, 28, gy - 90, shade("#f1e4cf", 0.08)) + poly([[0, 70], [100, 70], [92, 92], [0, 92]], P.coral);
  b += rect(28, gy - 92, 40, 92, P.teal) + circle(60, gy - 46, 2.2, P.goldLight) + rect(24, gy - 96, 48, 6, "#e3d4b8");
  b += ground(w, gy, h - gy, "grass", { seed: 3 });
  b += dogHouse(152, gy + 18, 0.85);
  b += person(74, gy + 52, 132, { ...BOY, pose: "hold", facing: 1, mouth: "flat" }) + frown(74, gy + 52, 132, { facing: 1, skin: BOY.skin });
  b += leash(118, gy - 32, 132, gy + 50);
  b += tuft(16, h - 10) + tuft(w - 14, h - 22, 0.9);
  return b;
};

const shelter = (w, h, found) => {
  const fy = h - 84;
  let b = room(w, h, fy, { wall: "#e6eef0", floor: "tile", base: "#b9c6cc" });
  b += pawSign(w / 2 + 12, 70);
  // worker behind the counter (right)
  b += person(w - 44, fy + 28, 170, { ...WORKER, pose: found ? "wave" : "stand", facing: -1, mouth: found ? "smile" : "open" });
  if (!found) {
    b += counter(w - 92, fy + 30, 100);
    b += person(48, fy + 60, 172, { ...MOM, pose: "point", facing: 1, mouth: "open" });
    b += person(92, fy + 76, 128, { ...BOY, pose: "stand", facing: 1, mouth: "flat" }) + frown(92, fy + 76, 128, { facing: 1, skin: BOY.skin });
  } else {
    b += counter(w - 92, fy + 30, 100);
    b += person(34, fy + 60, 172, { ...MOM, pose: "stand", facing: 1, mouth: "smile" });
    b += person(84, fy + 80, 132, { ...BOY, pose: "hold", facing: 1, mouth: "open" });
    // the brown puppy hugged against the boy's chest; his arm wraps around it
    b += sitDog(112, fy + 4, 0.7, { color: PUP, facing: 1, collar: P.coral, mouth: "open" }).replace(/<ellipse[^>]*\/>/, "");
    b += stroke(`M92 ${fy - 26} Q112 ${fy - 2} 138 ${fy - 18}`, BOY.top, 9) + stroke(`M124 ${fy - 10} Q134 ${fy - 12} 140 ${fy - 20}`, SKIN[3], 7) + circle(141, fy - 21, 5, SKIN[3]);
    const heart = (hx, hy, k) => path(`M${hx} ${hy} c-3 -6 -10 -2 -6 3 l6 6 l6 -6 c4 -5 -3 -9 -6 -3Z`, P.coral, `transform="translate(${hx} ${hy}) scale(${k}) translate(${-hx} ${-hy})"`);
    b += heart(112, fy - 96, 1.4) + heart(140, fy - 112, 1);
  }
  return b;
};

export default {
  file: "35t-puppy-seq.svg",
  w: 640,
  h: 400,
  title:
    "Three pictures in order. 1: A sad boy stands outside his house holding an empty leash next to an empty dog house. 2: The boy and his mother talk to a worker at the animal shelter. 3: The shelter worker has found the brown puppy, and the boy hugs it happily.",
  draw: () => panels(640, 400, 3, (i, x, y, w, h) => tr(x, y, i === 0 ? outside(w, h) : shelter(w, h, i === 2))),
};
