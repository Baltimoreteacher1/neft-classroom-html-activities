import { P, SKIN, HAIR, sky, sun, cloud, ground, rect, rrect, path, circle, ellipse, line, stroke, g, building, person, text, contact, shade, light, vgrad, tuft, PROPS, tr, flower } from "../kit.mjs";
import { pitcher, paperCup, coinJar } from "../lib/a.mjs";

const X = 268;
const W = 316;
const TOP = 300; // counter top
const GROUND = 372;

function canopy() {
  let s = rect(X + 8, 136, 8, TOP - 136, P.woodDark) + rect(X + W - 16, 136, 8, TOP - 136, P.woodDark);
  const n = 7;
  const cw = (W + 16) / n;
  for (let i = 0; i < n; i++) {
    const cx = X - 8 + cw * i;
    s += path(`M${cx.toFixed(1)} 116 h${cw.toFixed(1)} v22 a${(cw / 2).toFixed(1)} 9 0 0 1 ${(-cw).toFixed(1)} 0Z`, i % 2 ? "#fbf6ec" : P.yellow);
  }
  s += rect(X - 10, 110, W + 20, 8, shade(P.gold, 0.15));
  return s;
}

function counter() {
  let s = contact(X + W / 2, GROUND, W * 0.55, 7, 0.22);
  s += rect(X, TOP, W, GROUND - TOP, vgrad([[0, "#f6d77a"], [1, "#e7b94e"]]));
  s += rect(X + W - 34, TOP, 34, GROUND - TOP, shade("#e7b94e", 0.12), 'opacity=".7"');
  s += rect(X - 8, TOP - 8, W + 16, 12, P.wood) + rect(X - 8, TOP - 8, W + 16, 4, light(P.wood, 0.3));
  // Omar's painted sign
  const sx = X + 46;
  const sw = W - 92;
  s += rrect(sx + 2, TOP + 18, sw, 46, 8, "#1c2f4a", 'opacity=".15"') + rrect(sx, TOP + 15, sw, 46, 8, "#fffaf0");
  s += text(X + W / 2, TOP + 47, "Lemonade", { size: 24, fill: P.coral, weight: 700 });
  const lemon = (x, y) => ellipse(x, y, 10, 7.5, P.yellow) + ellipse(x - 2, y - 2, 4, 2.6, "#fff2a8") + ellipse(x + 9, y - 4, 4, 2, P.leaf);
  s += lemon(sx + 18, TOP + 38) + lemon(sx + sw - 18, TOP + 38);
  s += circle(sx + 10, TOP + 22, 3, P.teal) + circle(sx + sw - 10, TOP + 56, 3, P.blue) + circle(sx + sw - 30, TOP + 22, 2.4, P.pink) + circle(sx + 30, TOP + 56, 2.4, P.purple);
  return s;
}

export default {
  file: "35-reading-lemonade.svg",
  w: 640,
  h: 400,
  title: "Two children sell lemonade at a small stand on a sunny day. There is a pitcher of lemonade, paper cups, and a jar of coins.",
  draw: () =>
    sky(640, 300) +
    sun(586, 58, 24) +
    cloud(470, 50, 0.6) +
    // their apartment building
    building(16, 306, 220, 290, { color: P.brick, windows: [3, 5], door: true, trim: P.ivory }) +
    ground(640, 300, 100, "pavement", { seed: 2 }) +
    stroke("M0 330 H640M120 300 L96 400M300 300 L296 400M480 300 L500 400", "#a19e96", 1.4, 'opacity=".5"') +
    canopy() +
    // Zainab and her brother Omar behind the counter
    person(352, 362, 172, { pose: "hold", skin: SKIN[3], hair: HAIR[0], hairStyle: "hijab", top: P.teal, bottom: P.navy, item: PROPS.cup(P.white) }) +
    person(500, 362, 164, { pose: "wave", facing: -1, skin: SKIN[3], hair: HAIR[0], hairStyle: "short", top: P.coral, bottom: P.navy, sleeve: "short", mouth: "open" }) +
    counter() +
    pitcher(306, TOP - 6, 1.25) +
    paperCup(372, TOP - 6, 1.15) +
    paperCup(396, TOP - 6, 1.15) +
    paperCup(420, TOP - 6, 1.15, { full: true }) +
    paperCup(444, TOP - 6, 1.15, { full: true }) +
    coinJar(548, TOP - 6, 1.25) +
    // a flower pot by the building door
    contact(196, 330, 22, 4) + path("M178 304 H214 L210 330 H182Z", P.coral) + rect(176, 300, 40, 6, shade(P.coral, 0.15)) +
    flower(186, 302, 1, { color: P.pink }) + flower(198, 300, 1.15, { color: P.gold, center: P.coral }) + flower(208, 302, 0.95, { color: P.purple }) +
    tuft(250, 396, 1, "#8f9a7a"),
};
