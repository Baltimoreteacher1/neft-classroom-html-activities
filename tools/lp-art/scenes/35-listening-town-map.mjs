import { P, rect, rrect, path, poly, circle, ellipse, line, stroke, g, tag, text, tree, road, contact, vgrad, shade, light, rng, bench, pond, tuft, flower } from "../../../access-practice-lab/src/art/kit.js";
import { mapBuilding, emblem } from "../lib/a.mjs";

const TOP = 160; // ground line of the buildings above Oak Street
const BOT = 372; // ground line of the buildings under Oak Street

function grass() {
  const R = rng(21);
  let s = rect(0, 0, 640, 400, vgrad([[0, "#d7e9bd"], [1, "#c4dda6"]]));
  let d = "";
  for (let i = 0; i < 70; i++) {
    const x = R() * 640;
    const y = R() * 400;
    d += `M${x.toFixed(1)} ${y.toFixed(1)}l-2 -5M${(x + 3).toFixed(1)} ${y.toFixed(1)}l2 -5`;
  }
  return s + stroke(d, "#9fc27f", 1.4, 'opacity=".6"');
}

function street() {
  return (
    rect(0, TOP + 2, 640, 14, "#e6e1d6") +
    rect(0, 230, 640, 14, "#e6e1d6") +
    road(640, 176, 54) +
    tag(578, 203, "Oak Street", { size: 15 })
  );
}

function fireStation(x, y, w, h) {
  const c = "#c8473a";
  let s = contact(x + w / 2, y + 1, w * 0.56, 5, 0.22);
  s += poly([[x - 4, y - h], [x + 6, y - h - 12], [x + w - 6, y - h - 12], [x + w + 4, y - h]], shade(c, 0.35));
  s += rect(x, y - h, w, h, c) + rect(x + w * 0.74, y - h, w * 0.26, h, shade(c, 0.14), 'opacity=".7"');
  for (const gx of [x + 12, x + w / 2 + 4]) {
    s += rect(gx, y - 56, w / 2 - 16, 56, "#eef0f2");
    for (let k = 1; k < 6; k++) s += rect(gx, y - 56 + k * 9.4, w / 2 - 16, 1.6, "#c7ccd2");
  }
  s += tag(x + w / 2, y - h + 20, "Fire Station", { size: 14 });
  return s;
}

function school(x, y, w, h) {
  const c = "#d9765a";
  let s = contact(x + w / 2, y + 1, w * 0.56, 5, 0.22);
  s += poly([[x - 6, y - h + 2], [x + w / 2, y - h - 26], [x + w + 6, y - h + 2]], shade(c, 0.35));
  s += rect(x, y - h, w, h, c) + rect(x + w * 0.74, y - h, w * 0.26, h, shade(c, 0.14), 'opacity=".7"');
  for (const wx of [x + 12, x + w - 32]) s += rect(wx - 1.5, y - 44, 23, 22, "#fbe9df") + rect(wx, y - 42.5, 20, 19, vgrad([[0, "#d8eef5"], [1, "#9ccadc"]]));
  s += rect(x + w / 2 - 13, y - 40, 26, 40, "#7a4a2a") + line(x + w / 2, y - 40, x + w / 2, y, "#5a3420", 1.4);
  s += tag(x + w / 2, y - h + 22, "School", { size: 14 });
  return s;
}

function park(x, y, w, h) {
  let s = contact(x + w / 2, y + 2, w * 0.54, 5, 0.2);
  s += rrect(x, y - h, w, h, 12, "#8cc275") + rrect(x + 4, y - h + 4, w - 8, h - 8, 10, "#9fce86");
  s += path(`M${x + w / 2 - 10} ${y} C${x + w / 2 - 14} ${y - 30} ${x + w / 2 + 30} ${y - 46} ${x + w - 4} ${y - 58} V${y - 44} C${x + w / 2 + 34} ${y - 34} ${x + w / 2 + 6} ${y - 22} ${x + w / 2 + 10} ${y}Z`, "#efe2c2");
  s += pond(x + 40, y - 30, 24, 11);
  s += tree(x + 30, y - 62, 0.34, { seed: 2 }) + tree(x + w - 26, y - 56, 0.34, { seed: 6 });
  s += tree(x + w / 2 + 14, y - 70, 0.26, { kind: "blossom", seed: 3 });
  s += flower(x + 74, y - 8, 0.5, { color: P.pink }) + flower(x + 86, y - 6, 0.5, { color: P.gold });
  s += line(x + w / 2 - 30, y - h + 44, x + w / 2 - 30, y - h + 22, P.woodDark, 3);
  s += tag(x + w / 2 - 30, y - h + 18, "Park", { size: 14 });
  return s;
}

export default {
  file: "35-listening-town-map.svg",
  w: 640,
  h: 400,
  title:
    "A town map. Oak Street runs across the middle. Under the street are the school, the park, a building with a star, and a building with a heart. Above the street are a building with a moon, the fire station, and a building with a sun.",
  draw: () =>
    grass() +
    street() +
    // above Oak Street
    tree(46, TOP - 4, 0.36, { seed: 1 }) +
    tree(98, TOP - 2, 0.3, { seed: 9 }) +
    mapBuilding(152, TOP, 112, 112, { color: "#6fa08f", sign: "moon", signColor: P.gold }) +
    fireStation(316, TOP, 116, 116) +
    mapBuilding(450, TOP, 112, 112, { color: P.navy, sign: "sun" }) +
    tree(604, TOP - 2, 0.34, { seed: 4 }) +
    // under Oak Street
    school(18, BOT, 120, 106) +
    park(152, BOT, 148, 118) +
    mapBuilding(318, BOT, 112, 112, { color: "#e3b56a", sign: "star", signColor: P.gold }) +
    mapBuilding(450, BOT, 112, 112, { color: P.teal, sign: "heart", signColor: P.red }) +
    tree(604, BOT - 2, 0.34, { seed: 7 }) +
    tuft(590, 392) +
    tuft(300, 392, 0.8),
};
