// Language City art: the map and the six interiors are original inline SVG drawn from data. Characters come from the
// Real-Life Scenarios figure drawer (characterSVG), so the lab keeps one set of faces. No images are loaded.
// Style: the site illustration kit (src/art/kit.js), editorial picture-book flat: no outlines, lit and shade sides,
// soft contact shadows, warm light from the upper left. Everything is id-free (noDefs), since facades repeat on a page.
import { BUILDINGS } from "../content/city-places.js";
import {
  P,
  circle,
  clock,
  contact,
  ellipse,
  light,
  mix,
  noDefs,
  path,
  rect,
  rrect,
  shade,
  stroke,
} from "../art/kit.js";
import {
  bookshelfFlat,
  box,
  counter,
  cross,
  goodsRow,
  legTable,
  papers,
  plaque,
  plant,
  room,
  shelf,
  win,
} from "../art/l-room.js";
import { characterSVG } from "./scenario-art.js";

const e = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

// ── the six buildings, drawn at the origin (top-left) in a 170 x 130 box, ground at y = 130 ─────
const GLASS = "#cfe6ef";
const glass = (x, y, w, h) =>
  rrect(x - 3, y - 3, w + 6, h + 6, 3, P.ivory) +
  rect(x, y, w, h, GLASS) +
  rect(x, y + h * 0.55, w, h * 0.45, "#a9cfdf") +
  path(
    `M${x + w * 0.15} ${y + h}L${x + w * 0.55} ${y}H${x + w * 0.75}L${x + w * 0.35} ${y + h}Z`,
    "#ffffff",
    'opacity=".35"',
  );
const door = (x = 72, c = P.navy) =>
  rrect(x - 3, 79, 32, 51, 4, P.ivory) +
  rrect(x, 82, 26, 48, 3, c) +
  rect(x + 3, 86, 20, 16, light(c, 0.2), 'opacity=".5"') +
  circle(x + 20, 108, 2.2, P.goldLight);
/** Walls: a face with a shade side on the right and a small step at the foot. */
const walls = (x, y, w, h, c) =>
  contact(x + w / 2, 130, w * 0.58, 6, 0.2) +
  rect(x, y, w, h, c) +
  rect(x + w * 0.8, y, w * 0.2, h, shade(c, 0.14)) +
  rect(x - 2, 126, w + 4, 4, shade(c, 0.28));
/** Striped scalloped awning between x0..x1 from y0 to y1. */
function awning(x0, x1, y0, y1, c, n = 7) {
  const w = (x1 - x0) / n;
  let s = path(`M${x0 + 6} ${y0}H${x1 - 6}L${x1} ${y1}H${x0}Z`, c);
  for (let i = 1; i < n; i += 2)
    s += path(
      `M${x0 + i * w + (i - n / 2) * -0.9} ${y0}h${w * 0.9}L${x0 + (i + 1) * w} ${y1}h${-w}Z`,
      P.ivory,
    );
  for (let i = 0; i < n; i++)
    s += path(`M${x0 + i * w} ${y1}a${w / 2} 5 0 0 0 ${w} 0Z`, i % 2 ? P.ivory : shade(c, 0.1));
  return s + rect(x0, y1 - 3, x1 - x0, 3, shade(c, 0.25), 'opacity=".5"');
}
const FACADES = {
  cafe: () =>
    walls(10, 30, 150, 100, "#f3dcc2") +
    awning(4, 166, 10, 32, P.coral) +
    glass(22, 52, 34, 30) +
    glass(118, 52, 30, 30) +
    door() +
    circle(85, 64, 10, P.ivory) +
    path("M79 60h12v6a6 6 0 0 1 -12 0Z", P.coral) +
    stroke("M91 62q4 0 3 4", P.coral, 1.8),
  library: () =>
    walls(14, 38, 142, 92, "#cfdfcb") +
    path("M4 40L85 4L166 40Z", P.teal) +
    path("M85 4L166 40H85Z", shade(P.teal, 0.18)) +
    rect(4, 38, 162, 6, shade(P.teal, 0.3)) +
    [26, 46, 112, 132]
      .map((x) => rect(x, 48, 10, 78, P.ivory) + rect(x + 7, 48, 3, 78, shade(P.ivory, 0.12)))
      .join("") +
    door() +
    rrect(62, 50, 46, 22, 3, P.ivory) +
    path("M85 56q-8 -4 -16 0v12q8 -4 16 0Z", P.coral) +
    path("M85 56q8 -4 16 0v12q-8 -4 -16 0Z", shade(P.coral, 0.15)),
  clinic: () =>
    walls(10, 22, 150, 108, "#eef7f5") +
    rect(10, 22, 150, 8, P.teal) +
    rrect(62, 36, 46, 44, 8, P.white) +
    cross(85, 58, 30, P.teal) +
    glass(22, 58, 30, 32) +
    glass(120, 58, 28, 32) +
    door(),
  market: () =>
    walls(10, 36, 150, 94, "#fbe3d6") +
    awning(4, 166, 12, 38, P.coral, 9) +
    contact(51, 124, 32, 4) +
    box(22, 94, 58, 30, P.wood, 3) +
    circle(36, 90, 8, P.red) +
    circle(52, 88, 8, P.gold) +
    circle(68, 90, 8, P.green) +
    circle(33, 87, 2.4, "#ffffff", 'opacity=".5"') +
    door(112, P.teal) +
    rrect(94, 48, 56, 22, 4, P.ivory) +
    stroke("M104 59h36", P.navy, 3, 'opacity=".6"'),
  "school-office": () =>
    walls(14, 30, 142, 100, "#f6e7b6") +
    path("M8 30H162L150 12H20Z", P.gold) +
    path("M85 12H150L162 30H85Z", shade(P.gold, 0.15)) +
    rect(84, -14, 3, 26, "#8d939d") +
    path("M87 -14L108 -7L87 0Z", P.teal) +
    glass(26, 48, 26, 30) +
    glass(118, 48, 26, 30) +
    door() +
    clock(85, 58, 11),
  station: () =>
    walls(6, 40, 158, 90, "#dbe4eb") +
    path("M0 40H170L160 20H10Z", P.navy) +
    path("M85 20H160L170 40H85Z", shade(P.navy, 0.2)) +
    rrect(20, 50, 130, 18, 3, P.navy) +
    stroke("M30 59h40M80 59h20M110 59h30", P.goldLight, 3) +
    contact(49, 128, 34, 4) +
    rrect(18, 86, 62, 34, 9, P.gold) +
    rrect(18, 86, 62, 8, 4, light(P.gold, 0.25)) +
    rect(26, 94, 14, 12, GLASS) +
    rect(46, 94, 14, 12, GLASS) +
    circle(34, 121, 6.5, P.ink) +
    circle(66, 121, 6.5, P.ink) +
    circle(34, 121, 2.4, "#9aa7b4") +
    circle(66, 121, 2.4, "#9aa7b4") +
    door(112),
};
const facade = (id) => noDefs(() => (FACADES[id] || (() => ""))());

/** The whole city: streets, a park, trees and the six buildings, in a 1000 x 620 box. Decorative: the pins carry the names. */
export function cityMapSVG() {
  return noDefs(() => {
    const ROAD = "#8f9aa4";
    const WALK = "#d9d5cc";
    let s = rect(0, 0, 1000, 620, "#e3ecd9");
    // lawn texture: soft lighter patches
    s +=
      ellipse(200, 120, 220, 80, "#edf3e4") +
      ellipse(820, 120, 200, 80, "#edf3e4") +
      ellipse(500, 380, 200, 70, "#d8e6cb");
    // sidewalks then roads
    s += rect(0, 207, 1000, 86, WALK) + rect(0, 462, 1000, 76, WALK) + rect(447, 0, 76, 620, WALK);
    s += rect(0, 215, 1000, 70, ROAD) + rect(0, 470, 1000, 60, ROAD) + rect(455, 0, 60, 620, ROAD);
    s += rect(0, 279, 1000, 6, shade(ROAD, 0.15)) + rect(0, 524, 1000, 6, shade(ROAD, 0.15));
    s += stroke("M0 250H1000M0 500H1000M485 0V620", "#f3eedf", 4, 'stroke-dasharray="30 22"');
    // crosswalks at the junctions
    for (const [x, y] of [
      [455, 230],
      [455, 482],
    ])
      for (let i = 0; i < 6; i++) s += rect(x - 30, y + i * 8, 22, 5, "#f3eedf", 'opacity=".85"');
    // the park and pond
    s +=
      ellipse(500, 356, 86, 56, P.grass) +
      ellipse(500, 352, 70, 42, P.waterDark) +
      ellipse(500, 349, 66, 38, P.water) +
      ellipse(484, 340, 30, 10, P.waterLight, 'opacity=".7"');
    s += stroke("M466 360q34 -14 68 0", "#ffffff", 2.4, 'opacity=".55"');
    const trees = [
      [150, 160],
      [345, 440],
      [655, 430],
      [905, 540],
      [330, 590],
      [660, 585],
      [925, 165],
      [420, 395],
      [580, 395],
    ];
    // Light map trees (the kit tree is detailed for full scenes; nine of them would triple the map's weight).
    s += trees
      .map(([x, y], i) =>
        i % 4 === 3
          ? contact(x, y, 12, 3) +
            path(`M${x} ${y - 42}L${x + 13} ${y - 6}H${x - 13}Z`, "#2f6b4f") +
            path(`M${x} ${y - 42}L${x + 3} ${y - 6}H${x - 13}Z`, light("#2f6b4f", 0.12))
          : contact(x, y, 14, 3) +
            rect(x - 2, y - 14, 4, 14, P.bark) +
            circle(x + 2, y - 26, 15, shade(P.leaf, 0.16)) +
            circle(x - 1, y - 28, 13, P.leaf) +
            circle(x - 5, y - 33, 6, light(P.leaf, 0.22), 'opacity=".7"'),
      )
      .join("");
    s += BUILDINGS.map((b) => {
      const [px, py] = b.at;
      const x = (px / 100) * 1000 - 85;
      const y = (py / 100) * 620 - 62;
      return `<g class="city-map-building" data-place="${e(b.id)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${(FACADES[b.id] || (() => ""))()}</g>`;
    }).join("");
    return `<svg class="city-map-svg" viewBox="0 0 1000 620" width="1000" height="620" aria-hidden="true" focusable="false">${s}</svg>`;
  });
}

// ── interiors (640 x 280, floor line y = 200) ────────────────────────────────
const INTERIORS = {
  cafe: () =>
    room("#f6e8d4", "#d9bf9c") +
    plaque(40, 48, 170, 86, P.navy, 8) +
    rect(40, 48, 170, 18, P.coral, 'rx="8"') +
    stroke("M56 84H180M56 102H162M56 118H148", P.ivory, 3.4, 'opacity=".8"') +
    plaque(250, 60, 50, 60, P.goldLight, 4) +
    circle(275, 88, 12, P.coral) +
    legTable(300, 190, 170, P.wood, 50) +
    path("M332 176h18l-2 14h-14Z", P.ivory) +
    ellipse(341, 177, 9, 2.4, "#7a4a2a") +
    path("M402 176h18l-2 14h-14Z", P.ivory) +
    ellipse(411, 177, 9, 2.4, "#7a4a2a") +
    plant(590, 200, 1.2),
  library: () =>
    room("#e6eee3", "#cbb994") +
    bookshelfFlat(24, 176, 250, 152) +
    win(420, 50, 100, 80) +
    counter(340, 192, 170, 46, P.wood) +
    box(360, 176, 34, 16, P.teal, 2) +
    box(398, 180, 28, 12, P.coral, 2),
  clinic: () =>
    room("#e2f1ee", "#d5e0da") +
    plaque(40, 52, 96, 76, P.white, 10) +
    cross(88, 90, 44, P.teal) +
    plaque(200, 60, 60, 70, P.ivory, 4) +
    stroke("M210 78h40M210 94h40M210 110h26", "#9aa7b4", 3) +
    contact(395, 258, 110, 6, 0.18) +
    rect(310, 222, 10, 34, "#9aa7b4") +
    rect(478, 222, 10, 34, "#9aa7b4") +
    rrect(300, 196, 190, 30, 12, P.white) +
    rrect(300, 214, 190, 12, 6, mix(P.white, P.tealLight, 0.3)),
  market: () =>
    room("#fbe9de", "#d9c6a6") +
    shelf(
      30,
      70,
      190,
      goodsRow(40, 70, [
        [26, 24, P.red, 12],
        [26, 24, P.red, 12],
        [26, 24, P.gold, 12],
        [26, 24, P.gold, 12],
        [26, 24, P.green, 12],
      ]),
    ) +
    shelf(
      30,
      124,
      190,
      goodsRow(46, 124, [
        [26, 24, P.green, 12],
        [26, 24, P.gold, 12],
        [26, 24, P.red, 12],
        [40, 20, P.wood, 3],
      ]),
    ) +
    counter(290, 190, 200, 48, "#8d6b4a") +
    plaque(310, 166, 54, 22, P.ivory, 3) +
    stroke("M318 177h38", P.navy, 2.4, 'opacity=".6"'),
  "school-office": () =>
    room("#f5ecc8", "#cdbf9f") +
    plaque(40, 46, 130, 80, P.ivory) +
    clock(105, 86, 26) +
    rrect(220, 44, 40, 90, 3, P.teal) +
    rect(250, 46, 8, 86, shade(P.teal, 0.2)) +
    circle(228, 92, 2.5, P.goldLight) +
    counter(290, 190, 200, 42, P.wood) +
    papers(310, 190),
  station: () =>
    room("#dde6ec", "#9fb0bd") +
    plaque(30, 40, 240, 60, P.navy, 6) +
    stroke("M48 62h90M48 82h60M170 62h80M170 82h50", P.goldLight, 5) +
    win(296, 50, 128, 84, P.ivory, "#bfe0ee") +
    rect(296, 118, 128, 16, "#c9c3b8") +
    rrect(306, 70, 100, 50, 10, P.gold) +
    rrect(306, 70, 100, 12, 6, light(P.gold, 0.25)) +
    rect(316, 84, 34, 22, GLASS) +
    rect(358, 84, 34, 22, GLASS) +
    rect(296, 120, 128, 4, "#6b7480") +
    contact(115, 252, 80, 5) +
    rrect(40, 190, 150, 24, 8, "#7c8190") +
    rrect(40, 190, 150, 8, 4, light("#7c8190", 0.25)) +
    rect(54, 214, 10, 36, "#555b69") +
    rect(166, 214, 10, 36, "#555b69"),
};

/** A building's inside: the learner on the left, the character on the right. `mood` follows the step. */
export function interiorSVG(place, { npc, learner, mood = "neutral", label = "" }) {
  const name = label || place.name.en;
  const back = noDefs(() => (INTERIORS[place.id] || INTERIORS.cafe)());
  return `<svg class="city-scene-svg" viewBox="0 0 640 280" width="640" height="280" role="img" aria-label="${e(name)}"><title>${e(name)}</title>${back}<g class="city-room-light" aria-hidden="true"><path d="M0 0h175L340 200H180Z" fill="#fff9de" opacity=".12"/><path d="M0 202h640" stroke="#765e48" stroke-width="2" opacity=".25"/><path d="m155 280 110-78m220 78-110-78M0 246h640" stroke="#896d50" stroke-width="1" opacity=".12"/><ellipse cx="320" cy="247" rx="172" ry="17" fill="#fff6df" opacity=".22"/></g>${characterSVG(learner, "neutral", 150, 202, 1.35)}${characterSVG(npc.look, mood, 480, 202, 1.35, true)}</svg>`;
}

/** A small portrait of a building's character for cards and the greeting. */
export const portraitSVG = (npc, mood = "happy") =>
  `<svg class="city-portrait" viewBox="-40 -100 80 130" width="54" height="86" aria-hidden="true" focusable="false">${characterSVG(npc.look, mood, 0, 20, 1)}</svg>`;

/** A small building thumbnail for cards. */
export const facadeThumbSVG = (id) =>
  `<svg class="city-thumb" viewBox="0 -20 170 160" width="102" height="96" aria-hidden="true" focusable="false">${facade(id)}</svg>`;
