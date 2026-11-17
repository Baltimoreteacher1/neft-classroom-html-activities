import { path, rect, rrect, line, text, vgrad, light, shade } from "../lib/g.mjs";

// Publisher Figure 2 (reading). Data, labels, axis and legend are fixed by content/publisher/journey.json:
// 100 L poured; Pavement 5 / 95, Lawn 55 / 45, Rain garden 85 / 15. Scale: 2.2 units per liter, baseline y 300.
const INK = "#17324d";
const ABS = "#1d5a8a";
const RAN = "#5a6673";
const DATA = [["Pavement", 5, 95, 120], ["Lawn", 55, 45, 320], ["Rain garden", 85, 15, 520]];
const bar = (x, v, c) => {
  const h = v * 2.2;
  const y = 300 - h;
  const r = Math.min(5, h / 2);
  return path(`M${x} 300 V${(y + r).toFixed(1)} Q${x} ${y.toFixed(1)} ${x + r} ${y.toFixed(1)} H${70 + x - r} Q${70 + x} ${y.toFixed(1)} ${70 + x} ${(y + r).toFixed(1)} V300Z`, vgrad([[0, light(c, 0.1)], [1, c]]));
};

export default {
  file: "publisher/absorb-chart.svg",
  w: 720,
  h: 360,
  title: "Water absorbed and water that ran off, by surface",
  grain: false,
  draw: () => {
    let s = "<desc>Bar chart of 100 liters poured on each surface. Pavement: 5 absorbed, 95 ran off. Lawn: 55 absorbed, 45 ran off. Rain garden: 85 absorbed, 15 ran off.</desc>";
    s += rect(0, 0, 720, 360, "#ffffff");
    s += text(360, 26, "Liters out of 100 poured, after ten minutes", { size: 18, fill: INK });
    s += rrect(250, 38, 14, 14, 3, ABS) + text(270, 50, "Absorbed", { size: 14, fill: INK, weight: 400, anchor: "start" });
    s += rrect(360, 38, 14, 14, 3, RAN) + text(380, 50, "Ran off", { size: 14, fill: INK, weight: 400, anchor: "start" });
    for (const v of [25, 50, 75, 100]) {
      const y = 300 - v * 2.2;
      s += line(90, y, 690, y, "#dbe3ea", 1, 'stroke-dasharray="4 4"') + text(80, y + 5, String(v), { size: 14, fill: "#4a5b6c", weight: 400, anchor: "end" });
    }
    s += text(80, 305, "0", { size: 14, fill: "#4a5b6c", weight: 400, anchor: "end" });
    for (const [name, a, r, x] of DATA) {
      s += bar(x, a, ABS) + text(x + 35, 300 - a * 2.2 - 6, String(a), { size: 16, fill: INK });
      s += bar(x + 80, r, RAN) + text(x + 115, 300 - r * 2.2 - 6, String(r), { size: 16, fill: INK });
      s += text(x + 75, 326, name, { size: 16, fill: INK });
    }
    s += line(90, 300, 690, 300, "#8a9aab", 2);
    return s;
  },
};
