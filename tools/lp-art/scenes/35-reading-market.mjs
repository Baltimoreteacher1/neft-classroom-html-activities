import { P, SKIN, HAIR, sky, sun, cloud, ground, rect, rrect, path, circle, ellipse, line, stroke, g, stall, person, contact, building, shade, light, haze, vgrad, tuft, tree } from "../kit.mjs";
import { apple, corn, crate, basket } from "../lib/a.mjs";

const SX = 324;
const SW = 228;
const COUNTER = 372 - 52;

function apples() {
  let s = "";
  const rows = [[-12, 7], [0, 8]];
  for (const [dy, n] of rows) {
    for (let i = 0; i < n; i++) {
      const x = SX + 22 + (90 - (dy ? 10 : 0)) / (n - 1) * i + (dy ? 5 : 0);
      s += apple(x, COUNTER - 13 + dy, 7.5);
    }
  }
  return crate(SX + 12, COUNTER, 104, 8) + s;
}

function cornPile() {
  let s = "";
  for (let i = 0; i < 8; i++) s += corn(SX + 130 + i * 11, COUNTER - 4, 0.9, -10 + i * 3);
  return crate(SX + 122, COUNTER, 96, 8) + s;
}

const purse = rrect(-7, 0, 14, 11, 3, P.purple) + stroke("M-4 0 q4 -6 8 0", shade(P.purple, 0.3), 1.4);

export default {
  file: "35-reading-market.svg",
  w: 640,
  h: 400,
  title: "A woman and a boy at a market stand with red apples and yellow corn. The boy holds a basket.",
  draw: () =>
    sky(640, 290) +
    sun(70, 58, 22) +
    cloud(250, 52, 0.7) +
    // a quiet market street behind
    building(-10, 292, 190, 170, { color: haze("#c9a27a", 0.5), windows: [3, 2], door: false, trim: haze(P.ivory, 0.3) }) +
    building(196, 292, 150, 132, { color: haze(P.teal, 0.6), windows: [2, 2], door: false, trim: haze(P.ivory, 0.3) }) +
    building(360, 292, 290, 190, { color: haze(P.brick, 0.55), windows: [4, 2], door: false, trim: haze(P.ivory, 0.3) }) +
    stroke("M0 150 Q160 176 320 150 T640 150", "#8a7a6a", 1.4, 'opacity=".6"') +
    [30, 70, 110, 150, 190, 230, 270, 310, 350, 390, 430, 470, 510, 550, 590, 630].map((x, i) => { const y = 150 + Math.sin((x / 320) * Math.PI) * 13 * (x < 320 ? 1 : -1); return path(`M${x - 8} ${y.toFixed(1)} L${x + 8} ${y.toFixed(1)} L${x} ${(y + 14).toFixed(1)}Z`, haze([P.coral, P.gold, P.teal, P.blue][i % 4], 0.25)); }).join("") +
    ground(640, 288, 112, "pavement", { seed: 5 }) +
    stroke("M0 320 H640M80 288 L60 400M240 288 L232 400M420 288 L428 400", "#a19e96", 1.4, 'opacity=".45"') +
    `<g transform="translate(${SX} 372) scale(1.3) translate(${-SX} -372)">` + stall(SX, 372, SW, { awning: P.coral, goods: cornPile() + apples() }) + "</g>" +
    // Mrs. Osei points at the apples; Kofi holds the basket
    person(132, 384, 168, { pose: "point", age: "adult", skin: SKIN[5], hair: P.gold, hairStyle: "hijab", top: P.teal, bottom: "#3e4a5c", item: purse, itemHand: "back" }) +
    person(236, 386, 116, { pose: "carry", skin: SKIN[5], hair: HAIR[0], hairStyle: "short", top: P.gold, bottom: P.navy, sleeve: "short", item: basket() }) +
    tuft(24, 396, 1.1, "#8f9a7a") +
    tuft(616, 394, 1, "#8f9a7a"),
};
