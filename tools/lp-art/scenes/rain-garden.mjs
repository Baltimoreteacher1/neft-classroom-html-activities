import { arrow } from "../kit.mjs";
import { rect, rrect, path, circle, ellipse, line, text, vgrad, P, light, shade, mix } from "../lib/g.mjs";
import { soil, pavement, grassEdge, plant, rainCloud, WATER } from "../lib/g.mjs";

// Publisher Figure 1 (reading): rain on pavement (left) and rain in a rain garden (right).
// Every label, arrow and count is fixed by content/publisher/journey.json (alt, passage, speaking model).
const INK = "#17324d";
const BLUE = "#1d4f7c";
const t = (x, y, s, o = {}) => text(x, y, s, { size: 15, anchor: "start", fill: INK, ...o });
const rainDrops = (d) => `<path d="${d}" stroke="${WATER}" stroke-width="3" stroke-linecap="round" fill="none"/>`;

export default {
  file: "publisher/rain-garden.svg",
  w: 720,
  h: 360,
  title: "Rain on pavement and rain in a rain garden",
  grain: false,
  draw: () => {
    let s = "<desc>Left: rain lands on a parking lot and runs along the pavement to a puddle at the school doors. Right: a channel carries water to a shallow bowl with plants, and the water soaks down through soil.</desc>";
    s += rect(0, 0, 720, 360, vgrad([[0, "#e3ecf3"], [1, "#f1f6f9"]]));
    s += rainCloud(170, 46) + rainCloud(540, 46);
    s += rainDrops("M110 82l-8 20M150 86l-8 20M190 82l-8 20M230 86l-8 20") + rainDrops("M480 82l-8 20M520 86l-8 20M560 82l-8 20M600 86l-8 20M640 82l-8 20");
    s += line(360, 20, 360, 340, "#9fb3c4", 2, 'stroke-dasharray="6 6"');
    // LEFT: pavement and school
    s += soil(20, 190, 330, 150, { seed: 4, pebbles: 9 });
    s += pavement(20, 150, 330, 40);
    s += rect(262, 96, 88, 54, vgrad([[0, "#e6b85a"], [1, "#d9a441"]])) + rect(262, 96, 88, 5, shade("#d9a441", 0.15));
    s += rect(288, 112, 36, 38, "#f4ead6") + rect(292, 116, 28, 34, INK) + rect(305, 116, 2, 34, "#2c4a68") + circle(301, 134, 1.6, P.goldLight) + circle(311, 134, 1.6, P.goldLight);
    s += t(256, 90, "School doors");
    s += t(30, 176, "Pavement", { fill: "#ffffff" });
    s += arrow("M60 142 L230 142", WATER, 5);
    s += t(70, 132, "Runoff", { fill: BLUE });
    s += ellipse(300, 152, 46, 7, vgrad([[0, "#5d9bcb"], [1, WATER]])) + ellipse(290, 150.5, 26, 2.2, "#ffffff", 'opacity=".45"');
    s += t(30, 234, "No water soaks in", { fill: "#ffffff" });
    s += t(30, 256, "Ground below stays dry", { fill: "#ffffff", weight: 400 });
    s += t(30, 330, "1. The flood", { fill: "#ffffff" });
    // RIGHT: rain garden
    s += soil(370, 190, 330, 150, { base: "#7a5c3e", seed: 8, pebbles: 9 });
    s += pavement(370, 150, 150, 40) + pavement(680, 150, 20, 40);
    s += path("M520 150 L520 190 Q600 262 680 190 L680 150Z", vgrad([[0, "#654c34"], [1, "#4f3b27"]]));
    s += grassEdge(520, 680, 151, 6);
    for (const [x, h] of [[560, 44], [580, 56], [604, 48], [628, 58], [652, 44]]) s += plant(x, 200, h, { r: 8 });
    s += arrow("M390 172 L515 172", WATER, 5);
    s += t(394, 140, "Channel", { fill: BLUE });
    s += t(540, 128, "Bowl with plants");
    s += arrow("M580 240 L580 278", WATER, 4) + arrow("M620 244 L620 282", WATER, 4);
    s += t(540, 296, "Soil filters the water", { fill: "#ffffff" });
    s += t(540, 316, "Water soaks in", { fill: "#ffffff", weight: 400 });
    s += t(380, 330, "2. The rain garden", { fill: "#ffffff" });
    return s;
  },
};
