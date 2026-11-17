import { P, SKIN, HAIR, sky, sun, cloud, house, hills, ground, tree, person, tuft, flower, rect, rrect, path, ellipse, g, text, shade, light, contact, haze, line } from "../../../access-practice-lab/src/art/kit.js";
import { BP } from "../lib/b.mjs";

const SX = 170;
const SW = 230;
const SY = 360; // stand ground
const cups = () => {
  let s = "";
  for (let i = 0; i < 6; i++) s += path(`M${SX + 168 - 10 + i * 0.4} ${SY - 86 - i * 5} h22 l-2 9 h-18Z`, i % 2 ? "#ffffff" : "#f1f3f5");
  return s;
};

export default {
  file: "35-speaking-lemonade.svg",
  w: 640,
  h: 400,
  title:
    "Two kids at a lemonade stand. A sign on the stand says Lemonade 50¢ a cup. A girl stands behind the stand with a pitcher of lemonade and a stack of cups. A boy in front of the stand holds coins in his hand.",
  draw: () =>
    sky(640, 260) +
    sun(574, 58, 24) +
    cloud(160, 52, 0.8) +
    hills(640, 236, { seed: 4 }) +
    house(380, 238, 110, 74, { color: haze(P.wall, 0.3), roof: haze(P.coral, 0.4), door: haze(P.teal, 0.4) }) +
    house(512, 240, 100, 66, { color: haze("#f6d9a8", 0.3), roof: haze(P.navy, 0.4), door: haze(P.coral, 0.4) }) +
    ground(640, 236, 164, "grass", { seed: 9 }) +
    path("M0 330 L640 318 L640 352 L0 366Z", "#e4ddcf") +
    tree(74, 330, 1.25, { seed: 4 }) +
    // girl behind the stand
    person(286, 330, 152, { pose: "hold", skin: SKIN[2], hair: HAIR[0], hairStyle: "long", top: P.teal, bottom: P.navy, sleeve: "short", facing: 1 }) +
    // stand: back posts, counter top and front panel
    rect(SX + 6, SY - 196, 8, 196, P.woodDark) + rect(SX + SW - 14, SY - 196, 8, 196, P.woodDark) +
    rect(SX - 6, SY - 208, SW + 12, 20, P.gold) + rect(SX - 6, SY - 192, SW + 12, 4, shade(P.gold, 0.25)) +
    contact(SX + SW / 2, SY, SW * 0.56, 7, 0.24) +
    rect(SX, SY - 74, SW, 74, "#f6e7b8") +
    rect(SX + SW * 0.72, SY - 74, SW * 0.28, 74, shade("#f6e7b8", 0.12), 'opacity=".7"') +
    rrect(SX - 8, SY - 82, SW + 16, 12, 3, P.wood) +
    // pitcher and cups on the counter
    `<g transform="translate(${SX + 58} ${SY - 98}) scale(1.6)">${BP.pitcher(P.yellow)}</g>` +
    cups() +
    // the sign
    rrect(SX + 18, SY - 58, SW - 36, 42, 6, "#1c2f4a", 'opacity=".14"') +
    rrect(SX + 16, SY - 62, SW - 32, 42, 6, "#ffffff") +
    text(SX + SW / 2, SY - 34, "Lemonade 50¢ a cup", { size: 19, fill: P.ink }) +
    // boy in front with coins
    person(462, 384, 130, {
      pose: "hold",
      facing: -1,
      skin: SKIN[4],
      hair: HAIR[0],
      hairStyle: "curly",
      top: P.blue,
      bottom: "#3e4a5c",
      sleeve: "short",
      item: BP.coins(),
    }) +
    tuft(30, 392, 1.2) + tuft(612, 388) + flower(600, 398, 0.8, { color: P.pink }) + flower(24, 400, 0.8, { color: P.gold, center: P.coral }),
};
