import { P, SKIN, HAIR, panels, rect, rrect, stroke, vgrad, ground, sky, sun, cloud, wallWindow, person, tree, haze } from "../../../access-practice-lab/src/art/kit.js";
import { bed, blanket, nightstand, alarmClock, sink, mirror, toothbrush, cerealBowl, spoon, busStopSign, cityBus } from "../lib/d.mjs";

// Four panels, same boy (blue shirt): 1 wakes and stretches as the alarm clock rings; 2 brushes his teeth at
// the bathroom sink; 3 eats cereal at the table with his little sister; 4 waits at the bus stop with his
// backpack and waves as the yellow school bus comes.
const BOY = { skin: SKIN[3], hair: HAIR[0], hairStyle: "short", top: P.blue, bottom: P.navy };
const SIS = { skin: SKIN[3], hair: HAIR[0], hairStyle: "puffs", top: P.pink, bottom: "#4a3f5c" };
const BH = 150;

const room = (x, y, w, gy, top, bottom, floor = "floor") => rect(x, y, w, gy - y, vgrad([[0, top], [1, bottom]])) + ground(x + w, gy - 6, 120, floor, { seed: 3 });

const step = (i, x, y, w, h) => {
  const gy = y + h - 44;
  let s = "";
  if (i === 0) {
    s += room(x, y, w, gy, "#dfe9f2", "#cbd9e6") + wallWindow(x + 30, y + 60, 62, 70, { view: "day", curtain: "#e9c46a" });
    s += person(x + 44, gy - 8, 128, { ...BOY, pose: "cheer", mouth: "open" });
    s += bed(x + 2, gy, 104) + rect(x + 10, gy - 24, 92, 24, "#e8e2d6") + blanket(x + 26, gy, 70, P.teal);
    s += nightstand(x + 106, gy, 34) + alarmClock(x + 123, gy - 48, 1.0);
  }
  if (i === 1) {
    let tiles = "";
    for (let yy = gy - 120; yy < gy; yy += 20) tiles += `M${x} ${yy}H${x + w}`;
    s += room(x, y, w, gy, "#eef3f4", "#e2ebee", "tile") + rect(x, gy - 124, w, 118, "#dbe8ec") + stroke(tiles, "#c3d5db", 1);
    s += mirror(x + 104, y + 74, 60, 80) + sink(x + 104, gy);
    s += person(x + 52, gy, BH, { ...BOY, pose: "think", item: toothbrush(1.1), mouth: "o" });
    s += [0, 1, 2].map((k) => `<circle cx="${x + 68 + k * 5}" cy="${gy - 128 - k * 6}" r="${2 + k * 0.6}" fill="#ffffff" opacity=".9"/>`).join("");
  }
  if (i === 2) {
    const top = gy - 50;
    s += room(x, y, w, gy, "#f6e6cf", "#efdcc0") + wallWindow(x + 44, y + 60, 60, 54, { frame: P.ivory });
    s += person(x + 38, top + 62, BH * 0.92, { ...BOY, pose: "hold", item: spoon(1.2), mouth: "smile" });
    s += person(x + 110, top + 58, BH * 0.72, { ...SIS, pose: "hold", facing: -1, item: spoon(1.2), mouth: "open" });
    s += rrect(x + 2, top - 8, w - 4, 12, 3, P.wood) + rect(x + 2, top + 4, w - 4, 66, vgrad([[0, "#9c6e47"], [1, "#b98457"]]));
    s += cerealBowl(x + 60, top - 6, 1.1) + cerealBowl(x + 94, top - 6, 0.95) + rrect(x + 76, top - 30, 12, 24, 2, "#fbf6ec") + rect(x + 76, top - 24, 12, 8, P.blue);
  }
  if (i === 3) {
    s += sky(x + w, gy - 40) + sun(x + 30, y + 74, 14) + cloud(x + 96, y + 70, 0.4);
    s += tree(x + 30, gy - 40, 0.6, { tone: haze(P.leaf, 0.3) }) + ground(x + w, gy - 44, 30, "grass") + ground(x + w, gy - 16, 120, "pavement");
    s += cityBus(x + 96, gy - 4, 190, { kind: "school", color: P.yellow, facing: -1, driver: { skin: SKIN[2], hair: HAIR[1], top: P.navy } });
    s += busStopSign(x + 26, gy + 6, 150);
    s += person(x + 58, gy + 10, BH, { ...BOY, pose: "wave", facing: 1, backpack: P.coral, mouth: "open" });
  }
  return s;
};

export default {
  file: "35t-morning-seq.svg",
  w: 640,
  h: 400,
  title: "Four pictures in order. 1: A boy wakes up in bed and stretches when his alarm clock rings. 2: He brushes his teeth at the bathroom sink. 3: He eats a bowl of cereal at the table with his little sister. 4: He waits at the bus stop with his backpack and waves as the yellow school bus comes.",
  draw: () => panels(640, 400, 4, step),
};
