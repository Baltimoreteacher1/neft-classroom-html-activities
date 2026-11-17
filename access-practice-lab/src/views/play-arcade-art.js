// Original scenes for the story worlds and conversation worlds on the Games & Worlds arcade, so a world
// card never repeats a quick-game picture. Same art direction and band house styles as src/games/art.js:
// the site illustration kit (no outlines, lit and shade sides, soft contact shadows, one warm light),
// 3-5 Storybook warm light, 6-8 Field Journal cooler with a journal grid.
import {
  P,
  building,
  circle,
  contact,
  ellipse,
  hills,
  kid,
  light,
  line,
  moon,
  path,
  person,
  poly,
  rect,
  rrect,
  shade,
  stars,
  tr,
  tuft,
  cloud as kCloud,
  stroke as kStroke,
  tree as kTree,
  road,
} from "../art/kit.js";
import { chip, lg, magnifier, rg, tile, word } from "../art/i-scene.js";
import { banded, svg } from "../games/art.js";

const W = 480;
const H = 270;
const skyG = (a, b, c, h = H) =>
  rect(
    0,
    0,
    W,
    h,
    lg([
      [0, a],
      [0.6, b],
      [1, c],
    ]),
  );
const lines = (x, y, w, c, n = 2) =>
  Array.from({ length: n }, (_, i) => rrect(x, y + i * 16, w * (i ? 0.6 : 1), 7, 3.5, c)).join("");
/** Speech bubble with a tail on the left or right, lit top band, soft shadow. */
const bubble = (x, y, w, h, fill, tail = "l") => {
  const t =
    tail === "l"
      ? `M${x + 26} ${y + h - 4}l-12 22l34 -22Z`
      : `M${x + w - 26} ${y + h - 4}l12 22l-34 -22Z`;
  return (
    rrect(x + 2, y + 5, w, h, 16, "#1c2f4a", 'opacity=".16"') +
    path(t, shade(fill, 0.08)) +
    rrect(x, y, w, h, 16, fill) +
    rrect(x + 10, y + 3, w - 20, 10, 5, "#ffffff", 'opacity=".35"') +
    lines(x + 18, y + 20, w - 36, shade(fill, 0.3))
  );
};
const flag = (x, y, c) =>
  line(x, y, x, y - 30, P.navyDeep, 3) +
  path(`M${x} ${y - 30}h24l-6 7l6 7h-24Z`, c) +
  path(`M${x} ${y - 23}h18l6 7h-24Z`, shade(c, 0.2), 'opacity=".6"') +
  contact(x, y, 8, 2);
const pot = (x, y, w = 80) =>
  contact(x, y + 40, w * 0.55, 5) +
  path(`M${x - w / 2 + 8} ${y + 6}h${w - 16}l-10 34h${-(w - 36)}Z`, P.coral) +
  path(
    `M${x + 6} ${y + 6}h${w / 2 - 14}l-10 34h-${w / 2 - 28}Z`,
    shade(P.coral, 0.2),
    'opacity=".7"',
  ) +
  rrect(x - w / 2, y - 4, w, 12, 3, light(P.coral, 0.15)) +
  rect(x - w / 2, y + 4, w, 4, shade(P.coral, 0.25)) +
  ellipse(x, y - 3, w / 2 - 6, 3, P.soilDark);
const leaf = (x, y, rx, ry, c, flip = 1) =>
  `<g transform="translate(${x} ${y}) scale(${flip} 1) rotate(-14)">${ellipse(0, 0, rx, ry, c)}${ellipse(-rx * 0.15, -ry * 0.3, rx * 0.6, ry * 0.4, light(c, 0.3), 'opacity=".6"')}${kStroke(`M${-rx} 0H${rx * 0.8}`, shade(c, 0.3), 1)}</g>`;
const column = (x, y, h) =>
  rect(x, y, 22, h, P.ivory) +
  rect(x + 14, y, 8, h, shade(P.ivory, 0.12)) +
  rect(x + 3, y, 3, h, "#ffffff", 'opacity=".7"') +
  rect(x - 3, y + h - 6, 28, 6, shade(P.ivory, 0.08));

export const WORLD_SCENES = {
  // Adventure Worlds: a museum hall with a missing compass on a pedestal
  museum: () =>
    rect(
      0,
      0,
      W,
      H,
      lg([
        [0, "#ecd3a4"],
        [1, "#dcb986"],
      ]),
    ) +
    circle(
      240,
      150,
      200,
      rg([
        [0, "#fff6dc", 0.7],
        [1, "#fff6dc", 0],
      ]),
    ) +
    poly(
      [
        [56, 94],
        [240, 30],
        [424, 94],
      ],
      light(P.stoneDark, 0.1),
    ) +
    poly(
      [
        [240, 30],
        [424, 94],
        [240, 94],
      ],
      shade(P.stoneDark, 0.12),
    ) +
    poly(
      [
        [210, 74],
        [240, 60],
        [270, 74],
      ],
      P.gold,
      'opacity=".6"',
    ) +
    rect(66, 92, 348, 16, P.ivory) +
    rect(66, 104, 348, 4, shade(P.ivory, 0.15)) +
    [0, 1, 2, 3, 4].map((i) => column(86 + i * 70, 108, 120)).join("") +
    rect(
      0,
      228,
      W,
      42,
      lg([
        [0, P.woodLight],
        [1, P.wood],
      ]),
    ) +
    rect(0, 228, W, 4, light(P.woodLight, 0.3)) +
    contact(240, 232, 48, 6, 0.28) +
    rect(206, 196, 68, 36, P.stone) +
    rect(250, 196, 24, 36, shade(P.stone, 0.15)) +
    rect(202, 190, 76, 8, light(P.stone, 0.2)) +
    rrect(196, 136, 88, 56, 5, "#cfe9f0", 'opacity=".75"') +
    rrect(196, 136, 88, 6, 3, "#ffffff", 'opacity=".6"') +
    kStroke("M206 182l22 -36M222 182l14 -22", "#ffffff", 3, 'opacity=".6"') +
    `<circle cx="240" cy="166" r="16" fill="none" stroke="${P.coral}" stroke-width="4" stroke-dasharray="6 5"/>` +
    word(240, 174, "?", 22, P.coral) +
    magnifier(360, 150, 20, 25),
  // Language Games: a locked door with glowing clue cards
  vault: () =>
    rect(
      0,
      0,
      W,
      H,
      lg([
        [0, "#1b3554"],
        [1, "#0f2338"],
      ]),
    ) +
    [60, 150, 330, 420].map((x, i) => circle(x, 30 + (i % 2) * 20, 2.4, P.goldLight)).join("") +
    circle(
      240,
      142,
      130,
      rg([
        [0, P.teal, 0.35],
        [1, P.teal, 0],
      ]),
    ) +
    contact(240, 242, 80, 6, 0.3) +
    rrect(166, 40, 148, 204, 74, "#1c3b5a") +
    rrect(170, 44, 140, 196, 70, "#2c4d6f") +
    circle(240, 146, 46, shade(P.stoneDark, 0.3)) +
    circle(240, 142, 44, P.stoneDark) +
    circle(240, 142, 30, P.stone) +
    circle(232, 134, 12, light(P.stone, 0.4), 'opacity=".6"') +
    [0, 60, 120, 180, 240, 300]
      .map((a) => rrect(237, 100, 6, 14, 2, P.gold, `transform="rotate(${a} 240 142)"`))
      .join("") +
    [
      [70, 90, P.teal, "A"],
      [70, 170, P.coral, "B"],
      [366, 90, P.gold, "C"],
      [366, 170, P.green, "D"],
    ]
      .map(
        ([x, y, f, t]) =>
          circle(
            x + 22,
            y + 26,
            40,
            rg([
              [0, f, 0.35],
              [1, f, 0],
            ]),
          ) +
          tile(x, y, 44, 52, 8, f) +
          word(x + 22, y + 34, t, 22, f === P.gold ? P.navy : "#ffffff"),
      )
      .join(""),
  // Language Quest: a glowing portal between two worlds
  portal: () =>
    skyG("#0f2440", "#1d4a6a", "#2f6f8f") +
    stars(W, 150, 12, 7) +
    hills(W, 210, { color: "#2b6a4a", far: 0.15, seed: 4, amp: 22 }) +
    ellipse(
      240,
      140,
      110,
      128,
      rg([
        [0, P.goldLight, 0.6],
        [1, P.goldLight, 0],
      ]),
    ) +
    contact(240, 236, 70, 7, 0.3) +
    ellipse(242, 144, 64, 86, shade(P.gold, 0.3)) +
    ellipse(240, 140, 64, 86, P.gold) +
    ellipse(
      240,
      140,
      54,
      76,
      lg([
        [0, "#d5f3ee"],
        [1, P.tealLight],
      ]),
    ) +
    ellipse(240, 150, 40, 56, P.teal, 'opacity=".55"') +
    [0, 1, 2]
      .map((i) => kStroke(`M${206 + i * 26} ${104 + i * 22}q12 -12 24 0`, "#ffffff", 3))
      .join("") +
    ellipse(214, 92, 12, 22, "#ffffff", 'opacity=".35" transform="rotate(-20 214 92)"') +
    kTree(90, 214, 0.5, { seed: 3, tone: "#3f7f58" }) +
    kTree(392, 218, 0.46, { kind: "pine", tone: "#2f6b4f" }),
  // Signal Quest: an island with a radio tower
  island: () =>
    skyG("#9fd0ea", "#d6ecf4", "#fbeed4", 196) +
    kCloud(90, 52, 0.7) +
    kCloud(380, 40, 0.55) +
    rect(
      0,
      190,
      W,
      80,
      lg([
        [0, P.waterLight],
        [1, P.waterDark],
      ]),
    ) +
    kStroke("M30 220h40M380 214h50M120 250h40M330 252h60", "#ffffff", 2, 'opacity=".55"') +
    ellipse(240, 202, 140, 10, P.waterLight) +
    path("M110 202Q240 120 370 202Z", "#ecd3a0") +
    path("M240 140Q330 150 370 202H250Z", shade("#ecd3a0", 0.12)) +
    path("M150 196Q240 142 330 196Q240 186 150 196Z", P.grass) +
    kTree(162, 192, 0.42, { kind: "palm" }) +
    `<g transform="translate(240 170)">${contact(0, 2, 22, 4)}${kStroke("M-18 0L0 -110L18 0M-12 -30H12M-8 -60H8M-14 -16L10 -44M-10 -48L6 -74", P.navy, 4)}${circle(0, -114, 8, P.coral)}${circle(-2, -116, 3, light(P.coral, 0.5))}${[
      22, 36, 50,
    ]
      .map((r) => kStroke(`M${-r * 0.7} ${-114 - r * 0.7}a${r} ${r} 0 0 1 ${r * 1.4} 0`, P.gold, 4))
      .join("")}</g>`,
  // Language Adventures: a winding path through story worlds
  path: () =>
    skyG("#bfe0ee", "#e2f1ee", "#fbeed4") +
    kCloud(400, 46, 0.6) +
    hills(W, 150, { color: P.grass, far: 0.5, seed: 6, amp: 26 }) +
    path(
      "M0 190Q120 170 240 186T480 178V270H0Z",
      lg([
        [0, P.grassLight],
        [1, P.grass],
      ]),
    ) +
    kStroke(
      "M40 270C120 210 80 180 200 170S340 150 300 110S380 70 440 60",
      shade("#ecd3a0", 0.15),
      26,
    ) +
    kStroke("M40 270C120 210 80 180 200 170S340 150 300 110S380 70 440 60", "#ecd3a0", 20) +
    kStroke(
      "M40 270C120 210 80 180 200 170S340 150 300 110S380 70 440 60",
      P.gold,
      3,
      'stroke-dasharray="8 10"',
    ) +
    kTree(100, 168, 0.3, { seed: 2 }) +

    flag(200, 168, P.coral) +
    flag(300, 108, P.teal) +
    flag(440, 58, P.gold),
  // Reality Engine: characters talking in a story frame
  stage: () =>
    skyG("#fbeed4", "#f2f2e4", "#e2f1ee") +
    `<rect x="30" y="30" width="420" height="210" rx="18" fill="none" stroke="${P.navy}" stroke-width="2.4" stroke-dasharray="10 8" opacity=".55"/>` +
    path("M30 214Q240 200 450 214V240H30Z", P.grassLight) +
    person(150, 226, 110, kid(3, { top: P.teal, pose: "point", mouth: "open" })) +
    person(330, 226, 110, kid(1, { top: P.coral, facing: -1, pose: "stand" })) +
    bubble(60, 40, 130, 62, P.white, "r") +
    bubble(290, 40, 130, 62, "#cdeee9", "l"),
  // Language City: a street of buildings
  city: () =>
    skyG(P.skyTop, P.sky, "#f6ecd6", 230) +
    kCloud(380, 44, 0.6) +
    rect(0, 150, W, 80, "#a9c4d4", 'opacity=".5"') +
    building(30, 222, 90, 76, {
      color: P.ivory,
      roof: "gable",
      roofColor: P.coral,
      windows: [2, 1],
    }) +
    building(140, 222, 90, 104, {
      color: "#e8d7b5",
      roofColor: P.teal,
      roof: "gable",
      windows: [2, 1],
    }) +
    building(250, 222, 90, 84, {
      color: P.wall,
      roof: "gable",
      roofColor: P.gold,
      windows: [2, 1],
    }) +
    building(360, 222, 90, 96, {
      color: "#e8d7b5",
      roof: "gable",
      roofColor: P.green,
      windows: [2, 1],
    }) +
    road(W, 232, 38),
  // Scenarios: a conversation
  talk: () =>
    skyG("#e2f1ee", "#f4f0e2", "#fbeed4") +
    circle(
      380,
      60,
      160,
      rg([
        [0, "#ffffff", 0.5],
        [1, "#ffffff", 0],
      ]),
    ) +
    bubble(50, 40, 200, 80, P.white, "l") +
    bubble(230, 130, 200, 80, "#cdeee9", "r") +
    [
      [70, 200, P.coral, 1],
      [410, 60, P.teal, 0],
    ]
      .map(
        ([x, y, c, i]) =>
          chip(x, y, 26, c) +
          `<g opacity=".9">${circle(x, y - 6, 9, light(c, 0.55))}${path(`M${x - 15} ${y + 18}a15 13 0 0 1 30 0Z`, light(c, 0.55))}</g>`,
      )
      .join(""),
  // Language Worlds: a map of connected stations
  map: () =>
    rect(
      0,
      0,
      W,
      H,
      lg([
        [0, "#c9955f"],
        [1, "#a87442"],
      ]),
    ) +
    rrect(22, 22, 448, 238, 14, "#1c2f4a", 'opacity=".22"') +
    rrect(16, 16, 448, 238, 14, "#f6ead0") +
    path(
      "M16 200Q120 170 220 210T464 196V240a14 14 0 0 1 -14 14H30a14 14 0 0 1 -14 -14Z",
      "#c8dfc0",
    ) +
    path("M300 16Q330 70 400 60T464 90V30a14 14 0 0 0 -14 -14Z", "#cfe6ee") +
    kStroke("M90 200L180 90L290 170L390 80", P.navy, 4, 'stroke-dasharray="10 8" opacity=".75"') +
    [
      [90, 200, P.teal],
      [180, 90, P.coral],
      [290, 170, P.gold],
      [390, 80, P.green],
    ]
      .map(([x, y, f]) => chip(x, y, 22, f) + circle(x, y, 8, P.ivory))
      .join(""),
  // Science Exhibition: two bean plants, one in light, one in the dark
  beans: () =>
    rect(
      0,
      0,
      250,
      H,
      lg([
        [0, "#fdf0d0"],
        [1, "#f6e2b8"],
      ]),
    ) +
    circle(
      80,
      56,
      90,
      rg([
        [0, "#fff3c4", 0.8],
        [1, "#fff3c4", 0],
      ]),
    ) +
    circle(80, 56, 26, P.gold) +
    circle(76, 52, 20, P.goldLight) +
    rect(
      250,
      0,
      230,
      H,
      lg([
        [0, "#16304f"],
        [1, "#20364f"],
      ]),
    ) +
    circle(400, 50, 2.6, "#fff7d6") +
    circle(440, 90, 1.8, "#fff7d6") +
    circle(310, 40, 1.6, "#fff7d6") +
    rect(0, 236, W, 34, "#e6d2a8") +
    rect(250, 236, 230, 34, "#2a4560") +
    [
      [140, 140, 1, P.leaf],
      [360, 190, 0.45, "#b9c98a"],
    ]
      .map(
        ([x, top, s, c]) =>
          kStroke(`M${x} 214V${top}`, shade(c, 0.15), 6) +
          leaf(x - 24, top + 18, 24 * s + 6, 10 * s + 4, c, -1) +
          leaf(x + 24, top + 40 * s, 24 * s + 6, 10 * s + 4, shade(c, 0.1)) +
          pot(x, 216),
      )
      .join(""),
};

export function worldScene(key, band) {
  const draw = WORLD_SCENES[key];
  return draw
    ? svg(
        "0 0 480 270",
        banded(band, () => draw(band)),
        { cls: `gs-scene pa-scene-${key}` },
      )
    : "";
}
