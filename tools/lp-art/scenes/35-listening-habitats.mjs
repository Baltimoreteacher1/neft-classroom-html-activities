import { P, panels, rect, path, ellipse, circle, stroke, poly, tree, tuft, flower, g, vgrad, rgrad, shade, light, haze, rng, sun, contact } from "../../../access-practice-lab/src/art/kit.js";
import { cactus, rock, lilyPad, reeds } from "../lib/a.mjs";

const f = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function desert(x, y, w, h) {
  let s = rect(x, y, w, h, vgrad([[0, "#f6d89a"], [0.6, "#fbe6bd"], [1, "#fdf0d6"]]));
  s += sun(x + w * 0.7, y + 64, 26);
  s += path(`M${x} ${y + 236} Q${x + w * 0.35} ${y + 200} ${x + w * 0.7} ${y + 226} T${x + w} ${y + 214} V${y + h} H${x}Z`, "#efcf96");
  s += path(`M${x} ${y + 262} Q${x + w * 0.5} ${y + 236} ${x + w} ${y + 270} V${y + h} H${x}Z`, "#e6c08a");
  s += path(`M${x} ${y + 300} Q${x + w * 0.4} ${y + 282} ${x + w} ${y + 296} V${y + h} H${x}Z`, "#dcae72");
  s += stroke(`M${x + 14} ${y + 330} q20 -6 40 0M${x + 80} ${y + 346} q20 -6 40 0`, "#c99a5e", 1.6, 'opacity=".6"');
  s += cactus(x + w * 0.52, y + 318, 0.95);
  s += rock(x + w * 0.2, y + 330, 34, 15);
  s += rock(x + w * 0.85, y + 296, 20, 9, "#d2a878");
  return s;
}

function forest(x, y, w, h) {
  let s = rect(x, y, w, h, vgrad([[0, "#cfe6dc"], [1, "#e6f1e6"]]));
  s += tree(x + w * 0.85, y + 250, 0.8, { kind: "pine", tone: haze("#2f6b4f", 0.45) });
  s += tree(x + w * 0.12, y + 246, 0.75, { kind: "pine", tone: haze("#2f6b4f", 0.45) });
  s += rect(x, y + 246, w, h - 246, vgrad([[0, "#6fa25e"], [1, "#4f8545"]]));
  s += tree(x + w * 0.24, y + 300, 1.45, { kind: "pine", tone: "#2f6b4f" });
  s += tree(x + w * 0.74, y + 316, 1.6, { kind: "pine", tone: "#2c6448" });
  s += tree(x + w * 0.5, y + 336, 0.62, { seed: 5, tone: "#5c9a5e" });
  // mushroom and ferns
  s += contact(x + 24, y + 352, 9, 2) + rect(x + 21, y + 342, 6, 10, "#f3ead8") + path(`M${x + 13} ${y + 344} Q${x + 24} ${y + 328} ${x + 35} ${y + 344}Z`, P.coral) + circle(x + 20, y + 338, 1.8, "#ffffff") + circle(x + 27, y + 340, 1.5, "#ffffff");
  s += tuft(x + w - 20, y + 360, 1.2, "#3f7a3f") + tuft(x + 60, y + 368, 1, "#3f7a3f");
  return s;
}

function pond(x, y, w, h) {
  let s = rect(x, y, w, h, vgrad([[0, P.skyTop], [1, P.skyLow]]));
  s += path(`M${x} ${y + 196} Q${x + w / 2} ${y + 176} ${x + w} ${y + 192} V${y + h} H${x}Z`, haze(P.grass, 0.4));
  s += rect(x, y + 206, w, h - 206, vgrad([[0, P.grassLight], [1, P.grass]]));
  s += ellipse(x + w / 2, y + 296, w * 0.62, 66, shade(P.grass, 0.3), 'opacity=".5"');
  s += ellipse(x + w / 2, y + 292, w * 0.6, 62, vgrad([[0, P.waterLight], [1, P.waterDark]]));
  s += stroke(`M${x + 30} ${y + 270} h24M${x + 84} ${y + 318} h30M${x + 50} ${y + 336} h18`, "#ffffff", 2, 'opacity=".7"');
  s += lilyPad(x + 44, y + 296, 18, { bloom: true });
  s += lilyPad(x + 96, y + 278, 15);
  s += lilyPad(x + 104, y + 320, 17, { bloom: true });
  s += lilyPad(x + 60, y + 330, 12);
  s += reeds(x + 18, y + 262, 0.95, { seed: 4 });
  s += reeds(x + w - 16, y + 270, 1.05, { seed: 9 });
  s += tuft(x + 30, y + 372, 1.1) + tuft(x + w - 40, y + 366);
  return s;
}

function arctic(x, y, w, h) {
  const R = rng(17);
  let s = rect(x, y, w, h, vgrad([[0, "#a9c9dc"], [1, "#e3eff5"]]));
  for (let i = 0; i < 22; i++) {
    const sx = x + 8 + R() * (w - 16);
    const sy = y + 50 + R() * 180;
    s += circle(sx, sy, 1.6 + R() * 2, "#ffffff", 'opacity=".95"');
  }
  // iceberg and snowy shore
  s += poly([[x + 22, y + 236], [x + 64, y + 112], [x + 86, y + 150], [x + 104, y + 128], [x + 136, y + 236]], "#ffffff");
  s += poly([[x + 64, y + 112], [x + 86, y + 150], [x + 92, y + 236], [x + 70, y + 236]], "#d6e7f0");
  s += poly([[x + 104, y + 128], [x + 136, y + 236], [x + 108, y + 236]], "#cfe2ec");
  s += path(`M${x} ${y + 226} Q${x + w * 0.4} ${y + 216} ${x + w} ${y + 230} V${y + 252} H${x}Z`, "#f4f9fc");
  s += rect(x, y + 248, w, h - 248, vgrad([[0, "#3d7fa6"], [1, "#24597d"]]));
  s += stroke(`M${x + 20} ${y + 270} h26M${x + 92} ${y + 290} h20M${x + 40} ${y + 352} h30`, "#9cc8de", 2, 'opacity=".8"');
  const floe = (fx, fy, fw) => g(ellipse(fx, fy + 3, fw, 6, "#1d4c6b", 'opacity=".5"') + path(`M${fx - fw} ${fy} L${fx - fw * 0.6} ${fy - 8} H${fx + fw * 0.7} L${fx + fw} ${fy}Z`, "#ffffff") + rect(fx - fw, fy, fw * 2, 3, "#cfe2ec"));
  s += floe(x + 42, y + 304, 24) + floe(x + 112, y + 334, 18) + floe(x + 96, y + 276, 12);
  return s;
}

export default {
  file: "35-listening-habitats.svg",
  w: 640,
  h: 400,
  title:
    "Four habitats side by side: a hot, sandy desert with a cactus, a green forest with tall trees, a pond with lily pads and reeds, and a snowy Arctic with ice and cold water.",
  draw: () => panels(640, 400, 4, (i, x, y, w, h) => [desert, forest, pond, arctic][i](x, y, w, h), { numbered: false, pad: 12, gutter: 10, bg: P.paper }),
};
