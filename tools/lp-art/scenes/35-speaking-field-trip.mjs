import { P, SKIN, HAIR, rect, rrect, path, ellipse, circle, g, vgrad, panels, sky, sun, cloud, hills, ground, tree, fence, person, tuft, shade, light, rgrad, stroke } from "../kit.mjs";
import { barn, cow, chicken, fishShape, turtle } from "../lib/b.mjs";

function farm(x, y, w, h) {
  const gy = y + 214;
  return (
    rect(x, y, w, h, vgrad([[0, P.skyTop], [0.7, P.sky], [1, P.skyLow]])) +
    sun(x + w - 40, y + 44, 18) +
    cloud(x + 80, y + 48, 0.6) +
    hills(640, gy + 2, { seed: 4 }).replace(/M0 /g, `M${x} `) +
    ground(640, gy, h, "grass", { seed: 2 }) +
    tree(x + w - 34, gy + 4, 0.6, { seed: 3 }) +
    barn(x + 26, gy + 12, 132, 96) +
    cow(x + 198, gy + 102, 1.05, -1) +
    chicken(x + 46, gy + 108, 1.35, 1) +
    chicken(x + 112, gy + 114, 1.3, -1) +
    fence(x - 10, x + w + 10, gy + 128, 42, "#e9dcc6") +
    tuft(x + 30, y + h - 8, 1.2) + tuft(x + w - 40, y + h - 12)
  );
}

function aquarium(x, y, w, h) {
  const tx = x + 20;
  const ty = y + 34;
  const tw = w - 40;
  const th = 214;
  return (
    rect(x, y, w, h, vgrad([[0, "#163b5c"], [1, "#0d2740"]])) +
    rect(x, ty + th + 6, w, h - th - 40, "#20476a") +
    ellipse(x + w / 2, ty + th / 2, w * 0.7, th * 0.7, rgrad([[0, "#5fc3dc", 0.35], [1, "#5fc3dc", 0]])) +
    rrect(tx - 8, ty - 8, tw + 16, th + 16, 8, "#2c5878") +
    rect(tx, ty, tw, th, vgrad([[0, "#7fd2e6"], [0.6, "#3ea3c6"], [1, "#2a7fa6"]])) +
    path(`M${tx} ${ty + th - 22} Q${tx + tw * 0.3} ${ty + th - 34} ${tx + tw * 0.6} ${ty + th - 24} Q${tx + tw * 0.85} ${ty + th - 16} ${tx + tw} ${ty + th - 26} L${tx + tw} ${ty + th} L${tx} ${ty + th}Z`, "#e3cc90") +
    stroke(`M${tx + 24} ${ty + th - 24} q-8 -30 4 -60 q8 -20 -2 -46M${tx + 36} ${ty + th - 26} q8 -26 -2 -52M${tx + tw - 30} ${ty + th - 22} q-6 -24 4 -48 q6 -16 -2 -30`, P.green, 4) +
    path(`M${tx + tw - 70} ${ty + th - 20} q4 -18 14 -16 q6 -14 16 -6 q12 -4 10 10 q4 10 -4 12Z`, P.coralLight) +
    stroke(`M${tx} ${ty} L${tx + 70} ${ty + th}M${tx + 40} ${ty} L${tx + 110} ${ty + th}`, "#ffffff", 10, 'opacity=".12"') +
    stroke(`M${tx + 10} ${ty + 6} H${tx + tw - 10}`, "#c9f0f8", 3, 'opacity=".8"') +
    fishShape(tx + 46, ty + 42, 1.1, P.orange, 1) +
    fishShape(tx + tw - 40, ty + 56, 1, P.yellow, -1) +
    fishShape(tx + 60, ty + 120, 0.9, P.coral, 1) +
    fishShape(tx + tw - 54, ty + 136, 1.1, P.goldLight, -1) +
    fishShape(tx + 30, ty + 168, 0.8, "#f08bb0", 1) +
    turtle(tx + tw / 2 + 4, ty + 96, 1.15, 1) +
    circle(tx + tw / 2 + 50, ty + 70, 3, "#ffffff", 'opacity=".6"') + circle(tx + tw / 2 + 56, ty + 58, 2, "#ffffff", 'opacity=".6"') +
    person(x + 62, y + h - 12, 116, { pose: "point", facing: 1, skin: SKIN[3], hair: HAIR[0], hairStyle: "puffs", top: P.gold, bottom: "#3e4a5c", sleeve: "short", mouth: "open" }) +
    person(x + w - 62, y + h - 10, 120, { pose: "point", facing: -1, skin: SKIN[0], hair: HAIR[2], hairStyle: "short", top: P.coral, bottom: P.navy, sleeve: "short", mouth: "o" })
  );
}

export default {
  file: "35-speaking-field-trip.svg",
  w: 640,
  h: 400,
  title:
    "Two field trip choices side by side. On the left is a farm with a red barn, a cow, and two chickens behind a fence. On the right is an aquarium with a big glass tank of fish, a sea turtle, and two students looking in.",
  draw: () => panels(640, 400, 2, (i, x, y, w, h) => (i === 0 ? farm(x, y, w, h) : aquarium(x, y, w, h)), { numbered: false, gutter: 16, pad: 12 }),
};
