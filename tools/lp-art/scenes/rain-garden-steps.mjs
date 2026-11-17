import { arrow } from "../../../access-practice-lab/src/art/kit.js";
import { rect, rrect, path, circle, line, text, vgrad, P, light, shade } from "../lib/g.mjs";
import { soil, pavement, grassEdge, plant, WATER } from "../lib/g.mjs";

// Publisher writing support: three numbered steps of a rain garden, left to right.
// 1 a channel guides water off the pavement; 2 the water slows in a shallow bowl with plants;
// 3 soil filters the water as it soaks in. Every label is fixed by content/publisher/journey.json.
const INK = "#17324d";

export default {
  file: "publisher/rain-garden-steps.svg",
  w: 720,
  h: 360,
  title: "The three steps of a rain garden",
  grain: false,
  draw: () => {
    let s = "<desc>Side view in three numbered steps from left to right. Step 1: a small channel guides water off the pavement. Step 2: the water slows in a shallow bowl filled with plants. Step 3: soil filters the water as it soaks down to the ground below.</desc>";
    s += rect(0, 0, 720, 360, vgrad([[0, "#ffffff"], [1, "#f3f7fa"]]));
    // ground
    s += soil(20, 170, 680, 170, { seed: 2, pebbles: 14 });
    s += grassEdge(220, 500, 171, 3);
    s += pavement(20, 150, 200, 20);
    // bowl (step 2)
    s += path("M250 170 Q360 238 470 170 Z", vgrad([[0, "#5a4430"], [1, "#3f2f20"]]));
    s += path("M285 200 Q360 238 435 200 Q360 222 285 200Z", vgrad([[0, "#5d9bcb"], [1, WATER]]));
    s += plant(320, 200, 40, { r: 7 }) + plant(345, 206, 52, { r: 7 }) + plant(372, 206, 46, { r: 7 }) + plant(398, 200, 36, { r: 7 });
    // soil filter (step 3): lighter, sandy layer with grains
    s += soil(500, 170, 200, 50, { base: "#a07f5a", seed: 9, pebbles: 10 }) + soil(500, 220, 200, 60, { base: "#8a6c4c", seed: 11, pebbles: 12 }) + soil(500, 280, 200, 60, { base: "#75593f", seed: 13, pebbles: 16 });
    s += rect(500, 170, 2, 170, "#1c2f4a", 'opacity=".12"');
    // water paths
    s += line(40, 140, 200, 140, WATER, 5) + `<path d="M215 146 Q250 160 275 190" fill="none" stroke="${WATER}" stroke-width="5" stroke-linecap="round"/>`;
    s += arrow("M570 175 L570 314", WATER, 5) + arrow("M620 175 L620 314", WATER, 5);
    // numbers and labels
    for (const [x, n, a, b] of [[120, 1, "A channel guides", "the water"], [360, 2, "The bowl slows", "the water"], [600, 3, "Soil filters the", "water as it soaks in"]]) {
      s += circle(x, 62, 21, "#1c2f4a", 'opacity=".12"') + circle(x, 60, 20, INK) + text(x, 67, String(n), { size: 20, fill: "#ffffff" });
      s += text(x, 102, a, { size: 16, fill: INK }) + text(x, 122, b, { size: 16, fill: INK });
    }
    return s;
  },
};
