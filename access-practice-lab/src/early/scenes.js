// Picture scenes for the K–3 bands, drawn in code so the youngest learners get large, clear pictures without adding
// image files to the deploy. Every scene is original EduWonderLab art: a neighborhood with a community garden, a
// school and a park. Content names a scene with `scene: "<id>"`; the validator checks that the id exists here
// (tools/validate-access-lab.mjs) and each scene carries English and Spanish alt text.
// Pure strings, no DOM: Node tools import SCENES to validate content.
//
// Art: the site illustration kit (../art/kit.js, helpers in ../art/j-early.js) in its editorial picture-book style:
// no outlines, a lit and a shade side on every shape, soft contact shadows, one warm light, kit faces for every
// person. Drawn inside noDefs(), so a scene has no ids and many can share a page. Each subject an activity asks
// about (counts, colours, places) is drawn large and in front.

import {
  HAIR,
  P,
  SKIN,
  cat,
  circle,
  cloud,
  contact,
  ellipse,
  flower,
  g,
  house,
  light,
  line,
  mix,
  noDefs,
  path,
  poly,
  puddle,
  rect,
  rrect,
  shade,
  slide,
  stroke,
  swings,
  tr,
  tree,
} from "../art/kit.js";
import {
  H,
  HELD,
  W,
  adultAt,
  apple,
  bananas,
  basketFront,
  bed,
  bigSmile,
  cookie,
  faceAt,
  farHills,
  kidAt,
  lawn,
  leaf,
  noShadow,
  picket,
  plant,
  plate,
  rainfall,
  room,
  sadFace,
  skyFill,
  snowGround,
  snowfall,
  snowyTree,
  soil,
  starfield,
  stopSign,
  sunDisc,
  table,
  tomato,
  wind,
  shelf,
  windowPane,
} from "../art/j-early.js";

const svg = (title, body) =>
  `<svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}" focusable="false"><title>${title}</title><g stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;

/* ------------------------------------------------------------------ cast (one look per recurring character) */

const KID = 150; // a child's height in scene units
const ADULT = 205;
const ANA = {
  hairStyle: "puffs",
  skin: SKIN[3],
  hair: HAIR[0],
  top: P.coral,
  bottom: P.navy,
};
const LEO = {
  hairStyle: "short",
  skin: SKIN[1],
  hair: HAIR[1],
  top: P.blue,
  bottom: "#3e4a5c",
};
const MIA = {
  hairStyle: "long",
  skin: SKIN[0],
  hair: HAIR[3],
  top: P.gold,
  bottom: "#5a6b8c",
  skirt: true,
};
const SAM = {
  hairStyle: "curly",
  skin: SKIN[4],
  hair: HAIR[0],
  top: P.green,
  bottom: P.navy,
};
const NOOR = {
  hairStyle: "hijab",
  skin: SKIN[2],
  hair: P.teal,
  top: P.orange,
  bottom: "#3e4a5c",
};
const BEN = {
  hairStyle: "short",
  skin: SKIN[5],
  hair: HAIR[0],
  top: P.teal,
  bottom: P.navy,
};
const GRANDPA = {
  hairStyle: "bald",
  skin: SKIN[2],
  hair: HAIR[5],
  beard: HAIR[5],
  glasses: true,
  top: P.teal,
  bottom: "#4e5d6c",
};
const TEACHER = {
  hairStyle: "bun",
  skin: SKIN[4],
  hair: HAIR[0],
  top: P.teal,
  bottom: P.navy,
  skirt: true,
};
const MOM = {
  hairStyle: "long",
  skin: SKIN[1],
  hair: HAIR[1],
  top: P.coral,
  bottom: P.navy,
};
const DAD = {
  hairStyle: "short",
  skin: SKIN[3],
  hair: HAIR[0],
  beard: true,
  top: P.navy,
  bottom: "#3e4a5c",
};

const kid = (x, y, look, o = {}) => kidAt(x, y, o.h || KID, { ...look, ...o });
const adult = (x, y, look, o = {}) =>
  adultAt(x, y, o.h || ADULT, { ...look, ...o });

/* ------------------------------------------------------------------ shared settings */

const outdoors = (
  horizon = 290,
  { kind = "day", sun = [560, 72], clouds = [[120, 80, 0.75]] } = {},
) =>
  skyFill(kind, horizon) +
  (sun ? sunDisc(...sun) : "") +
  clouds
    .map(([x, y, s]) => cloud(x, y, s, { dark: kind === "rain" }))
    .join("") +
  farHills(horizon);

/** Lunch tray with an apple, carrots and rice. */
const tray = (x, y) =>
  rrect(x, y - 10, 92, 14, 4, "#d9dee3") +
  rect(x, y - 10, 92, 4, "#eef1f3") +
  circle(x + 22, y - 16, 9, P.red) +
  circle(x + 19, y - 19, 2.4, "#fff", 'opacity=".5"') +
  ellipse(x + 50, y - 13, 14, 6, "#ffffff") +
  stroke(`M${x + 66} ${y - 12}l14 -6M${x + 68} ${y - 9}l14 -6`, P.orange, 4);

/** Milk carton. */
const carton = (x, y) =>
  rect(x, y - 34, 22, 34, "#ffffff") +
  rect(x + 13, y - 34, 9, 34, "#e6ebf0") +
  poly(
    [
      [x, y - 34],
      [x + 11, y - 46],
      [x + 22, y - 34],
    ],
    "#dfe5ea",
  ) +
  rect(x + 3, y - 24, 10, 10, P.blue);

/** Simple oven range with a cooktop at y (front face below). */
const stove = (x, y, w = 200) =>
  contact(x + w / 2, y + 96, w * 0.5, 6, 0.16) +
  rect(x, y, w, 96, "#c9d0d6") +
  rect(x + w * 0.7, y, w * 0.3, 96, shade("#c9d0d6", 0.1)) +
  rrect(x + 22, y + 26, w - 44, 54, 6, "#3e4a5c") +
  rect(x + 30, y + 32, w - 60, 10, "#56657a", 'opacity=".6"') +
  rect(x - 4, y - 6, w + 8, 8, "#e4e8ec");

/** A big yellow school bus facing left. */
function bus(x, y) {
  const Y = "#f2b829";
  let b = contact(x + 160, y, 170, 10, 0.25);
  b += path(
    `M${x} ${y - 30} V${y - 128} Q${x} ${y - 150} ${x + 24} ${y - 150} H${x + 320} V${y - 30}Z`,
    Y,
  );
  b +=
    rect(x, y - 54, 320, 24, shade(Y, 0.16)) +
    rect(x, y - 148, 320, 8, light(Y, 0.25));
  b += rect(x + 2, y - 60, 318, 5, "#2b2f36");
  b +=
    rrect(x + 10, y - 132, 36, 50, 4, "#bfe2f0") +
    rect(x + 10, y - 132, 36, 14, "#ffffff", 'opacity=".35"');
  for (let i = 0; i < 4; i++)
    b +=
      rrect(x + 66 + i * 62, y - 132, 48, 40, 4, "#bfe2f0") +
      path(
        `M${x + 66 + i * 62} ${y - 92} l20 -40 h10 l-20 40Z`,
        "#ffffff",
        'opacity=".3"',
      );
  b += rrect(x + 66, y - 86, 34, 52, 3, "#3e4a5c", 'opacity=".25"');
  b +=
    circle(x + 6, y - 44, 7, "#fff3c4") +
    rect(x - 6, y - 38, 14, 10, "#3e4a5c", 'rx="3"');
  for (const wx of [x + 70, x + 262])
    b += circle(wx, y - 22, 24, "#2b2f36") + circle(wx, y - 22, 10, "#9aa6b2");
  return b;
}

/** Barn with a white trim cross on the doors. */
function barn(x, y, w = 200) {
  const R = "#c0473a";
  let b = contact(x + w / 2, y, w * 0.56, 7, 0.2);
  b +=
    rect(x, y - 150, w, 150, R) +
    rect(x + w * 0.68, y - 150, w * 0.32, 150, shade(R, 0.14));
  b +=
    poly(
      [
        [x - 16, y - 146],
        [x + w / 2, y - 228],
        [x + w + 16, y - 146],
      ],
      "#7d2f28",
    ) +
    poly(
      [
        [x + w / 2, y - 228],
        [x + w + 16, y - 146],
        [x + w / 2, y - 146],
      ],
      shade("#7d2f28", 0.2),
    );
  b +=
    rect(x + w / 2 - 40, y - 96, 80, 96, "#fbf6ec") +
    rect(x + w / 2 - 32, y - 88, 64, 88, R);
  b += stroke(
    `M${x + w / 2 - 32} ${y - 88} L${x + w / 2 + 32} ${y}M${x + w / 2 + 32} ${y - 88} L${x + w / 2 - 32} ${y}`,
    "#fbf6ec",
    6,
  );
  b +=
    rect(x + w / 2 - 18, y - 186, 36, 30, "#fbf6ec") +
    rect(x + w / 2 - 13, y - 181, 26, 20, "#5a2a22");
  return b;
}

/** Black-and-white cow facing right, feet at y. */
function cow(x, y, s = 1) {
  const C = "#ffffff";
  let b = contact(0, 0, 70, 9, 0.2);
  b +=
    rect(-48, -42, 13, 42, shade(C, 0.14)) +
    rect(30, -42, 13, 42, shade(C, 0.14));
  b +=
    rrect(-62, -102, 128, 66, 30, C) +
    path("M-62 -60 Q0 -30 66 -60 V-50 Q0 -24 -62 -50Z", shade(C, 0.1));
  b +=
    rect(-36, -42, 13, 42, C) +
    rect(42, -42, 13, 42, C) +
    rect(-36, -6, 13, 6, P.ink) +
    rect(42, -6, 13, 6, P.ink) +
    rect(-48, -6, 13, 6, P.ink) +
    rect(30, -6, 13, 6, P.ink);
  b +=
    path("M-40 -100 q22 -6 30 14 q-6 20 -30 14 q-16 -12 0 -28Z", P.ink) +
    path("M10 -70 q24 -10 30 12 q-14 16 -30 8Z", P.ink) +
    circle(-30, -58, 9, P.ink);
  b += ellipse(-12, -40, 14, 8, P.pink);
  b += stroke("M-62 -86 q-14 10 -12 34", C, 5) + ellipse(-74, -50, 5, 7, P.ink);
  b +=
    ellipse(84, -98, 26, 30, C) +
    ellipse(90, -76, 22, 14, P.pink) +
    circle(84, -78, 2.6, "#b06a7c") +
    circle(96, -78, 2.6, "#b06a7c");
  b +=
    circle(78, -104, 4, P.ink) +
    circle(98, -104, 4, P.ink) +
    ellipse(60, -118, 12, 6, C, 'transform="rotate(-24 60 -118)"') +
    ellipse(110, -118, 12, 6, C, 'transform="rotate(24 110 -118)"');
  b +=
    poly(
      [
        [70, -126],
        [66, -142],
        [78, -128],
      ],
      "#e8dcc4",
    ) +
    poly(
      [
        [98, -128],
        [104, -142],
        [106, -126],
      ],
      "#e8dcc4",
    );
  return tr(x, y, b, s);
}

/** Yellow hen facing left, feet at y. */
function hen(x, y, s = 1) {
  const Y = "#f2c335";
  let b =
    contact(0, 0, 32, 6, 0.2) + stroke("M-6 -16 V0 M6 -16 V0", P.orange, 3.5);
  b += path("M30 -40 Q46 -60 38 -76 Q30 -58 20 -56Z", shade(Y, 0.15));
  b +=
    ellipse(4, -34, 32, 24, Y) +
    path("M-6 -36 Q14 -46 26 -30 Q12 -18 -6 -36Z", shade(Y, 0.18));
  b +=
    circle(-20, -58, 16, Y) +
    path("M-30 -72 q4 -10 10 -2 q4 -10 10 0 q4 -6 6 4 q-14 2 -26 -2Z", P.red);
  b +=
    poly(
      [
        [-35, -58],
        [-46, -54],
        [-35, -50],
      ],
      P.orange,
    ) +
    ellipse(-30, -48, 3.5, 5, P.red) +
    circle(-24, -61, 2.8, P.ink);
  return tr(x, y, b, s);
}

/** Yellow duck floating, facing right. */
const duck = (x, y, s = 1) => {
  const Y = "#f6cf3c";
  return tr(
    x,
    y,
    ellipse(0, 6, 46, 7, P.waterDark, 'opacity=".35"') +
      path(
        "M-40 -6 Q-44 -30 -22 -24 Q10 -34 30 -10 Q36 6 0 8 Q-34 8 -40 -6Z",
        Y,
      ) +
      path("M-20 -10 Q4 -20 20 -6 Q0 2 -20 -10Z", shade(Y, 0.15)) +
      circle(24, -32, 16, Y) +
      path("M36 -34 L54 -30 L36 -24Z", P.orange) +
      circle(28, -36, 3, P.ink),
    s,
  );
};

/** Green frog sitting, facing left. */
const frog = (x, y, s = 1) => {
  const G = "#5aa64a";
  return tr(
    x,
    y,
    ellipse(-22, -4, 16, 8, shade(G, 0.15)) +
      ellipse(22, -4, 16, 8, shade(G, 0.15)) +
      ellipse(0, -18, 30, 20, G) +
      ellipse(0, -10, 20, 10, "#c8e39a") +
      circle(-14, -36, 10, G) +
      circle(14, -36, 10, G) +
      circle(-14, -37, 6, "#ffffff") +
      circle(14, -37, 6, "#ffffff") +
      circle(-13, -37, 3.4, P.ink) +
      circle(15, -37, 3.4, P.ink) +
      stroke("M-10 -20 q10 8 20 0", shade(G, 0.4), 2.4),
    s,
  );
};

/** Orange fish leaping out of the water, splash below. */
const fish = (x, y, s = 1) => {
  const O = P.orange;
  return tr(
    x,
    y,
    `<g transform="rotate(-24)">${ellipse(0, 0, 34, 16, O)}${path("M-4 -4 Q14 -12 30 -2 Q14 10 -4 -4Z", shade(O, 0.15))}${path("M-30 0 L-52 -16 L-48 0 L-52 16Z", O)}${path("M-6 -14 L8 -26 L14 -12Z", shade(O, 0.12))}${circle(20, -4, 3.2, P.ink)}</g>` +
      ellipse(-10, 46, 34, 6, "#ffffff", 'opacity=".75"') +
      stroke(
        "M-34 40 q-6 -12 -2 -22M18 40 q8 -10 6 -20M-10 38 q0 -12 4 -18",
        "#ffffff",
        3,
        'opacity=".8"',
      ),
    s,
  );
};

/** Fallen log. */
const log = (x, y, w = 130) =>
  contact(x + w / 2, y + 4, w * 0.55, 6, 0.22) +
  rrect(x, y - 30, w, 30, 15, P.bark) +
  rect(x + 10, y - 30, w - 20, 8, light(P.bark, 0.2), 'rx="4"') +
  ellipse(x + w - 10, y - 15, 10, 15, "#d9b07a") +
  ellipse(x + w - 10, y - 15, 5, 8, "#b98457");

/** Snowman with coal eyes, carrot nose and scarf. */
const snowman = (x, y) =>
  contact(x, y, 56, 9, 0.18) +
  circle(x, y - 46, 50, "#ffffff") +
  path(
    `M${x + 10} ${y - 94} A50 50 0 0 1 ${x + 10} ${y + 2} A40 50 0 0 0 ${x + 10} ${y - 94}Z`,
    "#dbe6ee",
  ) +
  circle(x, y - 122, 34, "#ffffff") +
  path(
    `M${x + 8} ${y - 156} A34 34 0 0 1 ${x + 8} ${y - 88} A26 34 0 0 0 ${x + 8} ${y - 156}Z`,
    "#dbe6ee",
  ) +
  rrect(x - 34, y - 96, 68, 13, 6, P.teal) +
  rect(x + 12, y - 92, 13, 38, P.teal, 'rx="5"') +
  circle(x - 11, y - 130, 4, P.ink) +
  circle(x + 11, y - 130, 4, P.ink) +
  path(`M${x} ${y - 122} L${x + 34} ${y - 116} L${x} ${y - 112}Z`, P.orange) +
  circle(x, y - 60, 4, P.ink) +
  circle(x, y - 38, 4, P.ink) +
  stroke(
    `M${x - 46} ${y - 66} l-34 -24 m14 10 l-6 -14M${x + 46} ${y - 66} l34 -24`,
    P.barkDark,
    4,
  );

/** Red mitten lying in the snow. */
const mitten = (x, y, s = 1) =>
  tr(
    x,
    y,
    ellipse(0, 6, 30, 6, "#b8c8d6", 'opacity=".6"') +
      path(
        "M-22 4 Q-28 -30 -6 -38 Q16 -42 20 -14 L26 -24 Q36 -24 30 -8 L22 4Z",
        P.red,
      ) +
      path("M2 -38 Q16 -40 20 -14 L22 4 H4Z", shade(P.red, 0.15)) +
      rect(-24, -2, 48, 10, "#f4efe6", 'rx="4"'),
    s,
  );

/** Red diamond kite with a bow tail. */
const kite = (x, y) =>
  poly(
    [
      [x, y - 46],
      [x + 36, y],
      [x, y + 46],
      [x - 36, y],
    ],
    P.red,
  ) +
  poly(
    [
      [x, y - 46],
      [x + 36, y],
      [x, y],
    ],
    light(P.red, 0.2),
  ) +
  poly(
    [
      [x, y],
      [x + 36, y],
      [x, y + 46],
    ],
    shade(P.red, 0.15),
  ) +
  stroke(`M${x} ${y + 46} q-14 26 -4 44 q10 22 -6 44`, P.ink, 1.6) +
  poly(
    [
      [x - 8, y + 72],
      [x + 6, y + 64],
      [x + 4, y + 78],
    ],
    P.gold,
  ) +
  poly(
    [
      [x - 12, y + 108],
      [x + 2, y + 102],
      [x, y + 116],
    ],
    P.teal,
  );

/** Balloon with a highlight; string runs to (hx, hy). */
const balloon = (x, y, c, hx, hy) =>
  stroke(
    `M${x} ${y + 38} Q${(x + hx) / 2 + 10} ${(y + hy) / 2} ${hx} ${hy}`,
    "#6b7480",
    1.6,
  ) +
  ellipse(x, y, 30, 37, c) +
  path(
    `M${x + 8} ${y - 36} A30 37 0 0 1 ${x + 8} ${y + 36} A22 37 0 0 0 ${x + 8} ${y - 36}Z`,
    shade(c, 0.16),
  ) +
  ellipse(x - 11, y - 14, 7, 11, "#ffffff", 'opacity=".45"') +
  poly(
    [
      [x - 5, y + 41],
      [x + 5, y + 41],
      [x, y + 35],
    ],
    shade(c, 0.1),
  );

/** Chalkboard with simple chalk marks. */
const chalkboard = (x, y, w, h) =>
  rect(x - 8, y - 8, w + 16, h + 16, P.woodDark) +
  rect(x, y, w, h, "#2f5245") +
  rect(x, y, w, h * 0.3, "#3a5f51", 'opacity=".5"') +
  stroke(
    `M${x + 24} ${y + 40} l12 -24 l12 24 m-20 -9 h16M${x + 64} ${y + 16} v24 h10 q8 0 8 -6 q0 -6 -8 -6 h-8M${x + 104} ${y + 18} q-14 -4 -14 10 q0 12 14 10`,
    "#e9efe7",
    3,
    'opacity=".85"',
  ) +
  stroke(
    `M${x + 24} ${y + 70} h${w * 0.5}M${x + 24} ${y + 92} h${w * 0.35}`,
    "#e9efe7",
    3,
    'opacity=".45"',
  ) +
  rect(x + 10, y + h + 6, w - 20, 6, shade(P.woodDark, 0.2));

/** Classroom door with a window, on the floor at y. */
const door = (x, y, w = 120, h = 250) =>
  rect(x - 8, y - h - 8, w + 16, h + 8, "#fbf6ec") +
  rect(x, y - h, w, h, P.wood) +
  rect(x + w * 0.7, y - h, w * 0.3, h, shade(P.wood, 0.14)) +
  rect(x + 16, y - h + 20, w - 32, 80, "#bfe2f0") +
  path(
    `M${x + 16} ${y - h + 100} l30 -80 h14 l-30 80Z`,
    "#fff",
    'opacity=".3"',
  ) +
  circle(x + 18, y - h * 0.45, 7, P.gold);

/* ------------------------------------------------------------------ scenes */

const DRAW = {
  garden: () =>
    outdoors(250) +
    lawn(250) +
    picket(0, 640, 262, 44) +
    bed(40, 300, 170) +
    bed(430, 300, 170) +
    [80, 125, 170].map((x, i) => plant(x, 300, 2 + i, 0.95)).join("") +
    [470, 515, 560].map((x, i) => plant(x, 300, 4 - i, 0.95)).join("") +
    kid(250, 385, ANA, { pose: "hold", facing: -1, item: HELD.can(true) }) +
    adult(380, 385, GRANDPA, { pose: "hold", item: HELD.shovel() }),
  "seed-plant": () =>
    outdoors(230, { clouds: [] }) +
    soil(250) +
    stroke("M360 292 q34 -26 70 0", P.soilDark, 7) +
    plant(330, 300, 0, 2.2) +
    plant(400, 300, 0, 2.2) +
    plant(470, 300, 0, 2.2) +
    ellipse(368, 236, 9, 6, "#a06a35") +
    ellipse(382, 256, 9, 6, "#a06a35") +
    kid(210, 360, ANA, { pose: "hold", item: HELD.shovel() }),
  "seed-water": () =>
    outdoors(230, {
      sun: null,
      clouds: [
        [90, 70, 0.8],
        [440, 60, 0.6],
      ],
    }) +
    soil(250) +
    plant(330, 300, 0, 2.2) +
    plant(410, 300, 0, 2.2) +
    plant(490, 300, 0, 2.2) +
    kid(220, 360, ANA, { pose: "hold", item: HELD.can(true) }),
  "seed-sprout": () =>
    outdoors(230) +
    soil(250) +
    plant(310, 300, 1, 1.5) +
    plant(400, 300, 1, 1.5) +
    plant(500, 300, 2, 1.5) +
    kid(170, 360, ANA, { mouth: "open" }),
  "seed-flower": () =>
    outdoors(230) +
    soil(250) +
    plant(310, 310, 3, 1.75) +
    plant(410, 310, 3, 1.75) +
    plant(520, 310, 4, 1.75) +
    kid(170, 370, ANA, { pose: "hold", item: HELD.basket(P.red) }),
  classroom: () =>
    room(320) +
    chalkboard(170, 40, 300, 140) +
    windowPane(40, 60, 90, 110) +
    table(40, 360, 200, 96) +
    table(330, 360, 200, 96) +
    HELD.book(P.coral).replace(
      "<g>",
      '<g transform="translate(110 248) scale(2.4)">',
    ) +
    rrect(400, 236, 46, 22, 4, P.blue) +
    rect(408, 230, 6, 16, P.red) +
    rect(418, 226, 6, 20, P.gold) +
    rect(428, 230, 6, 16, P.green) +
    adult(580, 390, TEACHER, { pose: "point", facing: -1 }),
  "park-rain": () =>
    outdoors(280, {
      kind: "rain",
      sun: null,
      clouds: [
        [110, 70, 0.9],
        [420, 60, 1],
      ],
    }) +
    lawn(280, { color: "#7aa863" }) +
    tree(530, 300, 1.15, { seed: 3 }) +
    puddle(400, 352, 90) +
    kid(220, 375, SAM, {
      pose: "hold",
      shoes: P.gold,
      item: HELD.umbrella(P.red),
    }) +
    rainfall(),
  breakfast: () =>
    room(330, { wall: "#f6e6cf" }) +
    windowPane(430, 50, 150, 110, "sun") +
    kid(115, 375, LEO, { pose: "hold", facing: 1, mouth: "open" }) +
    adult(530, 385, DAD, { facing: -1, pose: "wave" }) +
    table(190, 380, 260, 100) +
    plate(250, 274, 40, 10) +
    ellipse(250, 266, 30, 12, "#ffffff") +
    ellipse(250, 262, 24, 6, "#e9b866") +
    path("M220 264 Q250 292 280 264Z", "#ffffff") +
    path("M250 264 Q266 286 280 264Z", "#e6ebf0") +
    rect(320, 222, 30, 52, "#e8f1f5", 'opacity=".9"') +
    rect(323, 232, 24, 40, P.orange) +
    rect(337, 232, 10, 40, shade(P.orange, 0.15)) +
    apple(400, 256, 18),
  "bus-stop": () =>
    outdoors(230, { sun: [80, 60] }) +
    rect(0, 230, W, 70, "#d9d5cc") +
    rect(0, 296, W, 8, "#c4bfb4") +
    rect(0, 304, W, 96, "#646b73") +
    stroke("M0 356 H640", "#f3dd8a", 4, 'stroke-dasharray="34 30"') +
    bus(300, 352) +
    rect(206, 120, 8, 180, "#7d8790") +
    rrect(180, 92, 60, 44, 6, P.blue) +
    rrect(194, 102, 32, 20, 4, "#ffffff") +
    rect(196, 106, 10, 7, P.blue) +
    rect(209, 106, 10, 7, P.blue) +
    circle(200, 124, 3, "#ffffff") +
    circle(220, 124, 3, "#ffffff") +
    kid(120, 300, LEO, {
      pose: "hold",
      backpack: P.coral,
      item: HELD.book(P.coral),
    }),
  library: () =>
    room(320, { wall: "#efe3cf" }) +
    shelf(30, 320, 170, 250, 3) +
    shelf(235, 320, 170, 250, 7) +
    shelf(440, 320, 170, 250, 12) +
    ellipse(320, 368, 170, 22, P.teal, 'opacity=".55"') +
    kid(320, 385, MIA, { pose: "hold", h: 165, item: HELD.book(P.blue) }),
  market: () =>
    outdoors(240) +
    rect(0, 240, W, 160, "#d6d1c6") +
    rect(0, 330, W, 70, "#c8c2b6") +
    rect(126, 186, 6, 144, P.woodDark) +
    rect(508, 186, 6, 144, P.woodDark) +
    Array.from({ length: 8 }, (_, i) =>
      path(
        `M${114 + i * 52} 170 h52 v24 a26 9 0 0 1 -52 0Z`,
        i % 2 ? "#fbf6ec" : P.red,
      ),
    ).join("") +
    rect(110, 164, 420, 8, shade(P.red, 0.25)) +
    rect(120, 262, 400, 70, P.wood) +
    rect(120, 262, 400, 8, light(P.wood, 0.25)) +
    rect(320, 270, 200, 62, shade(P.wood, 0.1)) +
    rect(318, 262, 4, 70, shade(P.wood, 0.3)) +
    [168, 214, 260, 190, 238]
      .map((x, i) => apple(x, i < 3 ? 244 : 214, 21))
      .join("") +
    bananas(375, 238, 1.5) +
    bananas(460, 236, 1.5) +
    adult(70, 390, MOM, { pose: "hold", facing: 1, item: HELD.basket(null) }) +
    kid(585, 390, LEO, { facing: -1, pose: "point" }),
  playground: () =>
    outdoors(250, { sun: [80, 62] }) +
    lawn(250) +
    rect(60, 300, 260, 30, "#e2c9a0", 'rx="12"') +
    swings(70, 315, 240, 190, { seats: 2 }) +
    slide(360, 330, 170, { color: P.coral }) +
    kid(520, 385, BEN, { pose: "hold", item: HELD.ball(P.orange) }),
  "garden-walk": () =>
    outdoors(250) +
    lawn(250) +
    house(20, 300, 150, 110, { roof: P.coral }) +
    house(470, 300, 150, 110, {
      color: "#d8e7ee",
      roof: P.navy,
      door: P.coral,
    }) +
    tree(330, 290, 0.9, { seed: 4 }) +
    path("M0 330 H640 V372 H0Z", "#e6d4b2") +
    picket(560, 640, 330, 30) +
    flower(585, 360, 1.3, { color: P.coral }) +
    flower(615, 362, 1.3, { color: P.gold }) +
    adult(260, 390, GRANDPA, { pose: "walk", item: HELD.basket(null) }) +
    kid(390, 390, ANA, { pose: "walk", item: HELD.can() }),
  "garden-share": () =>
    outdoors(250) +
    lawn(250) +
    picket(0, 640, 262, 44) +
    adult(530, 390, GRANDPA, { facing: -1, pose: "wave" }) +
    table(200, 380, 240, 92) +
    plate(320, 284, 92, 14) +
    [262, 302, 342, 382].map((x) => tomato(x, 272, 17)).join("") +
    kid(120, 385, SAM, { pose: "hold", item: HELD.plate() }) +
    kid(450, 390, ANA, { facing: -1, pose: "hold", item: HELD.basket(P.red) }),
  "lunch-share": () =>
    room(330, { wall: "#f3ead9" }) +
    windowPane(250, 60, 140, 100) +
    kid(150, 380, MIA, { pose: "hold" }) +
    kid(490, 380, BEN, { facing: -1, pose: "hold" }) +
    table(200, 385, 240, 96) +
    rrect(226, 262, 70, 24, 5, P.green) +
    rect(226, 262, 70, 6, light(P.green, 0.3), 'rx="3"') +
    ellipse(248, 262, 16, 7, "#ffffff") +
    apple(280, 250, 13) +
    rrect(344, 262, 70, 24, 5, P.blue) +
    rect(344, 262, 70, 6, light(P.blue, 0.3), 'rx="3"') +
    poly(
      [
        [356, 262],
        [400, 262],
        [378, 244],
      ],
      "#f0d79a",
    ) +
    rect(356, 256, 44, 5, "#7fb069"),
  "lost-mitten": () =>
    skyFill("snow", 290) +
    cloud(110, 80, 0.8) +
    farHills(290, "#e8eef3", "#f4f7fa") +
    snowGround(290) +
    snowyTree(500, 330, 1.3) +
    mitten(420, 352, 1.3) +
    kid(200, 380, NOOR, { pose: "think", coat: P.teal, scarf: P.gold }),
  "snow-day": () =>
    skyFill("snow", 290) +
    farHills(290, "#e8eef3", "#f4f7fa") +
    snowGround(290) +
    snowyTree(560, 320, 1.1) +
    snowman(420, 360) +
    kid(200, 385, BEN, {
      hairStyle: "cap",
      hair: P.blue,
      coat: P.red,
      top: P.red,
      shoes: P.navy,
      scarf: P.gold,
      pose: "wave",
    }) +
    snowfall(),
  "wind-kite": () =>
    outdoors(280, { sun: null, clouds: [[110, 80, 0.8]] }) +
    lawn(280) +
    tr(
      520,
      300,
      contact(0, 0, 46, 9, 0.2) +
        path(
          "M-12 0 C-10 -50 0 -90 30 -130 L42 -124 C16 -86 8 -48 12 0Z",
          P.bark,
        ) +
        circle(60, -150, 44, P.leafDark) +
        circle(80, -160, 34, P.leaf) +
        circle(28, -138, 32, P.leaf) +
        circle(66, -176, 22, P.leafLight),
    ) +
    wind(380, 170) +
    wind(170, 240, 0.8) +
    kite(330, 92) +
    stroke("M330 138 Q300 230 238 238", "#6b7480", 1.8) +
    kid(200, 380, MIA, { pose: "reach" }),
  "ice-melt": () =>
    room(330, { wall: "#f6e6cf" }) +
    windowPane(440, 46, 150, 120, "sun") +
    path("M440 170 L590 170 L540 260 L300 260Z", "#fff1bf", 'opacity=".35"') +
    kid(110, 385, LEO, { pose: "point" }) +
    table(200, 385, 300, 100) +
    plate(275, 276, 66, 12) +
    [0, 1, 2]
      .map((i) => {
        const x = 240 + i * 26;
        const y = 252 - (i % 2) * 6;
        return (
          rrect(x, y, 30, 26, 6, "#cfeaf6", 'opacity=".95"') +
          rect(x + 4, y + 4, 10, 6, "#ffffff", 'opacity=".8" rx="2"') +
          rect(x + 20, y, 10, 26, "#9fcfe6", 'opacity=".7" rx="4"')
        );
      })
      .join("") +
    plate(420, 276, 66, 12) +
    ellipse(420, 274, 50, 8, P.water) +
    ellipse(408, 272, 22, 3, P.waterLight),
  "steam-pot": () =>
    room(300, { wall: "#f3ead9" }) +
    stove(150, 250, 280) +
    rect(210, 180, 160, 66, "#9aa6b2") +
    rect(300, 180, 70, 66, shade("#9aa6b2", 0.15)) +
    ellipse(290, 180, 80, 12, "#7d8994") +
    ellipse(290, 182, 70, 8, P.waterLight) +
    rrect(186, 192, 26, 10, 5, "#5d6772") +
    rrect(368, 192, 26, 10, 5, "#5d6772") +
    stroke(
      "M250 162 q-20 -30 0 -54 q20 -24 0 -54M290 166 q-20 -30 0 -54 q20 -24 0 -54M330 162 q-20 -30 0 -54 q20 -24 0 -54",
      "#ffffff",
      11,
      'opacity=".85"',
    ) +
    adult(530, 380, MOM, {
      pose: "hold",
      facing: -1,
      apron: "#fbf6ec",
      item: HELD.spoon(),
    }),
  "plant-parts": () =>
    skyFill("day", 230) +
    sunDisc(90, 70, 34) +
    soil(230) +
    stroke(
      "M320 232 q-14 46 -60 86M320 232 q-4 60 -2 124M320 232 q14 46 58 86M300 280 q-30 12 -52 2M340 290 q26 10 46 0M290 330 q-14 10 -30 8",
      "#ead9b8",
      6,
    ) +
    stroke("M320 232 Q326 160 320 92", P.leafDark, 12) +
    leaf(318, 176, 86, -160, P.leafLight) +
    leaf(322, 140, 86, -20, P.leaf) +
    `<g>${Array.from({ length: 10 }, (_, i) => `<g transform="rotate(${i * 36} 320 74)">${ellipse(320, 40, 12, 26, i % 2 ? "#f2c335" : "#f6d35c")}</g>`).join("")}</g>` +
    circle(320, 74, 18, "#8a5326") +
    circle(315, 69, 6, "#b07a3c"),
  "pond-life": () =>
    outdoors(250) +
    lawn(250) +
    ellipse(320, 330, 300, 72, shade(P.grass, 0.25)) +
    ellipse(320, 326, 290, 64, P.water) +
    ellipse(320, 312, 250, 40, P.waterLight, 'opacity=".45"') +
    stroke(
      "M150 340 h50M380 352 h70M260 360 h40",
      "#ffffff",
      2.4,
      'opacity=".6"',
    ) +
    [
      [60, 300],
      [76, 296],
      [570, 300],
      [588, 304],
    ]
      .map(
        ([x, y]) =>
          stroke(`M${x} ${y} q-2 -40 4 -72`, P.leafDark, 4) +
          rrect(x - 1, y - 92, 9, 26, 4.5, P.barkDark),
      )
      .join("") +
    duck(190, 330, 1.3) +
    log(400, 340, 150) +
    frog(474, 312, 1.2) +
    fish(320, 300, 1.1),
  "farm-friends": () =>
    outdoors(260, { sun: [580, 60] }) +
    lawn(260) +
    barn(40, 320, 200) +
    picket(250, 640, 280, 34) +
    cow(400, 360, 1) +
    hen(570, 370, 1.3),
  "night-moon": () =>
    skyFill("night", 300) +
    starfield(26, 4, 220) +
    circle(470, 100, 76, "#fdf3c8", 'opacity=".12"') +
    circle(470, 100, 50, "#f8edc4") +
    circle(484, 90, 9, "#e6d8a6") +
    circle(456, 116, 7, "#e6d8a6") +
    path("M0 300 Q160 270 330 296 T640 288 V400 H0Z", "#1d3352") +
    rect(0, 312, W, 88, "#172a45") +
    rect(110, 210, 170, 110, "#3a5378") +
    rect(220, 210, 60, 110, "#30476a") +
    poly(
      [
        [96, 214],
        [195, 146],
        [294, 214],
      ],
      "#243a5e",
    ) +
    rect(150, 238, 48, 42, "#f7d469") +
    rect(150, 238, 48, 42, "#fff1bf", 'opacity=".3"') +
    rect(172, 238, 4, 42, "#30476a") +
    path("M150 280 L198 280 L230 330 L120 330Z", "#f7d469", 'opacity=".12"') +
    cat(420, 330, 1.6, { color: "#8a95a3", facing: -1 }),
  lunchroom: () =>
    room(330, { wall: "#f3ead9" }) +
    windowPane(270, 50, 110, 90) +
    kid(130, 380, LEO, { pose: "hold" }) +
    kid(400, 380, MIA, { pose: "hold", facing: -1 }) +
    table(40, 385, 220, 96) +
    table(330, 385, 200, 96) +
    tray(80, 286) +
    tray(360, 286) +
    carton(470, 284) +
    adult(590, 390, TEACHER, { facing: -1, h: 215 }),
  "door-line": () =>
    room(330, { wall: "#f3ead9" }) +
    door(470, 330, 130, 260) +
    kid(110, 385, ANA, { top: P.coral }) +
    kid(210, 385, SAM, { top: P.green }) +
    kid(310, 385, LEO, { top: P.blue }) +
    adult(410, 390, TEACHER, { pose: "point" }),
  "family-dinner": () =>
    room(340, { wall: "#f6e6cf" }) +
    windowPane(270, 40, 100, 80, "night") +
    kid(320, 335, NOOR, { pose: "hold" }) +
    adult(90, 385, MOM, { pose: "hold" }) +
    kid(175, 385, LEO, { pose: "hold" }) +
    kid(470, 385, MIA, { pose: "hold", facing: -1 }) +
    adult(560, 385, DAD, { pose: "hold", facing: -1 }) +
    table(190, 385, 260, 100) +
    plate(240, 282, 26, 7) +
    plate(400, 282, 26, 7) +
    rect(282, 240, 76, 40, P.coral, 'rx="8"') +
    rect(330, 240, 28, 40, shade(P.coral, 0.15), 'rx="6"') +
    ellipse(320, 240, 40, 8, shade(P.coral, 0.3)) +
    rrect(268, 248, 16, 8, 4, shade(P.coral, 0.2)) +
    rrect(356, 248, 16, 8, 4, shade(P.coral, 0.2)) +
    stroke(
      "M306 228 q-8 -12 0 -24M330 228 q-8 -12 0 -24",
      "#ffffff",
      4,
      'opacity=".7"',
    ),
  "kitchen-help": () =>
    room(320, { wall: "#f3ead9" }) +
    windowPane(60, 50, 120, 90) +
    stove(380, 224, 220) +
    rect(440, 198, 90, 26, "#9aa6b2", 'rx="4"') +
    table(40, 380, 220, 92) +
    plate(90, 286, 32, 8) +
    plate(180, 286, 32, 8) +
    stroke("M216 284 l16 -2M216 290 l16 -2", "#9aa6b2", 3) +
    kid(310, 385, MIA, { pose: "hold", facing: -1, item: HELD.plate() }) +
    adult(560, 390, DAD, {
      pose: "hold",
      facing: -1,
      apron: "#fbf6ec",
      item: HELD.basket(P.red),
    }),
  "mail-carrier": () =>
    outdoors(240, { sun: [80, 60] }) +
    rect(0, 240, W, 160, "#d9d5cc") +
    rect(0, 330, W, 70, "#c8c2b6") +
    contact(450, 330, 140, 10, 0.25) +
    rrect(330, 190, 230, 120, 14, P.blue) +
    rect(330, 290, 230, 20, shade(P.blue, 0.2)) +
    rect(330, 190, 230, 8, light(P.blue, 0.25), 'rx="4"') +
    rrect(500, 208, 48, 46, 6, "#bfe2f0") +
    rrect(350, 224, 80, 40, 4, "#ffffff") +
    stroke("M362 236 h56M362 248 h40", P.coral, 5) +
    circle(380, 314, 22, "#2b2f36") +
    circle(380, 314, 9, "#9aa6b2") +
    circle(520, 314, 22, "#2b2f36") +
    circle(520, 314, 9, "#9aa6b2") +
    rect(126, 230, 12, 110, "#7d8790") +
    contact(132, 340, 30, 5, 0.2) +
    path("M94 230 V200 Q94 176 132 176 Q170 176 170 200 V230Z", P.red) +
    path("M132 176 Q170 176 170 200 V230 H132Z", shade(P.red, 0.18)) +
    rect(106, 206, 30, 6, shade(P.red, 0.35)) +
    stroke("M170 202 V184", "#7d8790", 3) +
    rect(170, 178, 16, 10, P.gold) +
    adult(
      250,
      385,
      { ...DAD, beard: false, hairStyle: "cap", hair: P.navy },
      {
        top: P.blue,
        bottom: P.navy,
        pose: "hold",
        item: HELD.letter(),
        backpack: P.bark,
      },
    ) +
    rrect(268, 286, 40, 44, 8, P.bark) +
    rect(268, 286, 40, 10, shade(P.bark, 0.2), 'rx="4"') +
    stroke("M232 236 L290 290", shade(P.bark, 0.2), 5),
  "doctor-visit": () =>
    room(330, { wall: "#e7f1f1", floor: "#d7dde2" }) +
    rect(52, 52, 132, 102, P.teal) +
    rect(60, 60, 116, 86, "#ffffff") +
    rect(108, 74, 20, 58, P.red) +
    rect(89, 93, 58, 20, P.red) +
    contact(540, 345, 90, 7, 0.18) +
    rect(474, 270, 12, 74, "#9aa6b2") +
    rect(594, 270, 12, 74, "#9aa6b2") +
    rrect(460, 240, 160, 34, 10, "#ffffff") +
    rect(460, 266, 160, 8, "#dfe5ea") +
    rect(470, 236, 140, 10, P.tealLight, 'rx="5"') +
    adult(
      230,
      390,
      { ...TEACHER, hairStyle: "long", skin: SKIN[4] },
      { coat: "#ffffff", top: P.teal, skirt: false, pose: "hold", facing: 1, h: 240 },
    ) +
    stroke("M214 212 q-6 44 16 58 q22 -14 16 -58", "#3e4a5c", 3.5) +
    stroke("M230 270 v10", "#3e4a5c", 3.5) +
    circle(230, 286, 8, "#9aa6b2") +
    circle(230, 286, 4, "#5d6772") +
    kid(390, 385, LEO, { top: P.gold, facing: -1, h: 170 }),
  handwash: () =>
    rect(0, 0, W, H, "#e7f1f1") +
    Array.from({ length: 6 }, (_, i) =>
      line(0, 130 + i * 32, W, 130 + i * 32, "#d3e2e3", 2),
    ).join("") +
    rect(0, 320, W, 80, "#d7dde2") +
    rrect(380, 40, 150, 110, 10, "#cfe3ea") +
    path("M392 140 L430 52 L452 52 L414 140Z", "#ffffff", 'opacity=".4"') +
    rrect(470, 196, 26, 40, 6, P.teal) +
    rect(478, 186, 10, 12, "#9aa6b2") +
    rect(360, 246, 200, 22, "#ffffff", 'rx="8"') +
    rect(360, 262, 200, 6, "#dfe5ea") +
    path("M372 268 H548 L536 330 H384Z", "#eef2f4") +
    path("M460 268 H548 L536 330 H460Z", "#dde4e8") +
    stroke("M430 246 V214 Q430 202 418 202 H402", "#9aa6b2", 10) +
    stroke("M404 210 V268", "#7cc3e6", 5, 'opacity=".9"') +
    [
      [446, 222, 10],
      [470, 196, 13],
      [430, 190, 8],
      [488, 166, 9],
    ]
      .map(
        ([x, y, r]) =>
          circle(x, y, r, "#ffffff", 'opacity=".55"') +
          circle(x, y, r, "none", 'stroke="#9fd0ea" stroke-width="2"') +
          circle(x - r * 0.35, y - r * 0.35, r * 0.25, "#ffffff"),
      )
      .join("") +
    kid(345, 385, MIA, { pose: "hold", sleeve: "short", h: 175 }),
  "bedroom-sleep": () =>
    rect(0, 0, W, H, "#33496e") +
    rect(0, 0, W, 330, "#2c4064", 'opacity=".5"') +
    windowPane(420, 50, 150, 120, "night") +
    circle(500, 102, 22, "#f8edc4") +
    circle(510, 96, 20, "#13284a") +
    [[440, 76], [548, 70], [456, 140], [552, 146]].map(([x, y]) => circle(x, y, 2.6, "#fff4cf")).join("") +
    rect(0, 330, W, 70, "#4a3a2e") +
    contact(250, 344, 170, 9, 0.3) +
    rrect(80, 222, 30, 120, 8, P.woodDark) +
    rrect(80, 270, 340, 70, 10, P.wood) +
    rrect(102, 236, 92, 40, 18, "#ffffff") +
    circle(150, 244, 26, SKIN[1]) +
    path("M124 240 a26 22 0 0 1 52 0 q-14 -8 -26 -4 q-14 -6 -26 4Z", HAIR[3]) +
    stroke("M140 248 q5 4 10 0M160 248 q5 4 10 0", P.ink, 2.4) +
    ellipse(145, 258, 5, 3, P.coralLight, 'opacity=".6"') +
    path(
      "M180 250 Q210 236 260 244 H410 Q420 244 420 254 V300 Q300 310 180 300Z",
      P.coral,
    ) +
    path(
      "M180 290 Q300 302 420 290 V304 Q300 314 180 304Z",
      shade(P.coral, 0.2),
    ) +
    stroke(
      "M230 262 h150M240 280 h130",
      light(P.coral, 0.3),
      3,
      'opacity=".6"',
    ),
  "healthy-plate": () =>
    rect(0, 0, W, H, "#f6e6cf") +
    rrect(110, 20, 420, 360, 30, P.teal, 'opacity=".18"') +
    circle(320, 206, 170, "#1c2f4a", 'opacity=".1"') +
    circle(320, 200, 170, "#ffffff") +
    circle(320, 200, 152, "#eef1f3") +
    path("M320 200 L320 52 A148 148 0 0 1 468 200Z", "#a9cf8e") +
    path("M320 200 L468 200 A148 148 0 0 1 320 348Z", "#f1d27e") +
    path("M320 200 L320 348 A148 148 0 0 1 172 200Z", "#ef9f86") +
    path("M320 200 L172 200 A148 148 0 0 1 320 52Z", "#9ec7d8") +
    stroke("M320 52 V348M172 200 H468", "#ffffff", 6) +
    tr(
      390,
      140,
      stroke("M0 20 V0", P.leafDark, 7) +
        circle(-10, -6, 13, P.green) +
        circle(10, -6, 13, P.green) +
        circle(0, -16, 14, light(P.green, 0.15)),
    ) +
    tr(
      420,
      108,
      `<g transform="rotate(30)">${path("M-6 0 L6 0 L0 44Z", P.orange)}${path("M-6 0 l6 -12 l6 12Z", P.leaf)}</g>`,
    ) +
    tr(
      390,
      250,
      rrect(-30, -28, 60, 56, 16, "#e9b866") +
        rrect(-24, -20, 48, 44, 12, "#f6dca0"),
    ) +
    ellipse(424, 300, 22, 10, "#ffffff") +
    apple(250, 262, 24) +
    [
      [200, 290],
      [214, 302],
      [200, 312],
      [226, 290],
    ]
      .map(([x, y]) => circle(x, y, 8, "#8fbf55"))
      .join("") +
    tr(250, 140, ellipse(0, 0, 34, 26, "#ffffff") + circle(4, 2, 12, P.gold)) +
    tr(
      222,
      186,
      `<g transform="rotate(-10)">${ellipse(0, 0, 24, 12, P.coralLight)}${path("M-24 0 L-38 -10 V10Z", P.coralLight)}</g>`,
    ),
  "jump-rope": () =>
    outdoors(260) +
    lawn(260) +
    contact(230, 378, 34, 7, 0.22) +
    noShadow(kid(230, 340, MIA, { pose: "stand", mouth: "open" })) +
    stroke("M211 283 Q130 170 230 132 Q330 170 249 283", P.gold, 4) +
    stroke(
      "M211 283 Q200 372 230 360 Q260 372 249 283",
      P.gold,
      4,
      'opacity=".55"',
    ) +
    kid(470, 385, BEN, { pose: "hold", item: HELD.ball(P.orange) }),
  "shapes-table": () =>
    room(330, { wall: "#f6e6cf" }) +
    table(40, 390, 560, 110) +
    circle(132, 228, 46, shade(P.red, 0.25)) +
    circle(128, 222, 46, P.red) +
    circle(114, 206, 14, "#ffffff", 'opacity=".25"') +
    rect(220, 186, 86, 86, shade(P.blue, 0.25)) +
    rect(214, 180, 86, 86, P.blue) +
    rect(214, 180, 86, 12, light(P.blue, 0.2)) +
    poly(
      [
        [346, 272],
        [398, 180],
        [450, 272],
      ],
      shade(P.green, 0.25),
    ) +
    poly(
      [
        [340, 266],
        [392, 174],
        [444, 266],
      ],
      P.green,
    ) +
    poly(
      [
        [392, 174],
        [444, 266],
        [392, 266],
      ],
      shade(P.green, 0.12),
    ) +
    rect(482, 208, 106, 64, shade(P.yellow, 0.25)) +
    rect(476, 202, 106, 64, P.yellow) +
    rect(476, 202, 106, 10, light(P.yellow, 0.3)),
  "apples-count": () =>
    outdoors(250) +
    lawn(250) +
    [
      [106, 234],
      [160, 234],
      [214, 234],
      [133, 192],
      [187, 192],
    ]
      .map(([x, y]) => apple(x, y, 25))
      .join("") +
    basketFront(60, 240, 200, 96) +
    [
      [406, 234],
      [460, 234],
      [514, 234],
    ]
      .map(([x, y]) => apple(x, y, 25))
      .join("") +
    basketFront(360, 240, 200, 96),
  "measure-pencil": () =>
    rect(0, 0, W, H, P.woodLight) +
    stroke(
      "M0 70 H640M0 170 H640M0 300 H640M0 360 H640",
      shade(P.woodLight, 0.12),
      3,
      'opacity=".5"',
    ) +
    rect(74, 196, 500, 54, "#1c2f4a", 'opacity=".14"') +
    rect(70, 190, 500, 54, "#f3dc8e") +
    rect(70, 190, 500, 8, light("#f3dc8e", 0.3)) +
    stroke(
      Array.from(
        { length: 13 },
        (_, i) => `M${90 + i * 38} 198 V${i % 2 ? 214 : 226}`,
      ).join(""),
      "#5d4a2a",
      3,
    ) +
    stroke(
      Array.from({ length: 12 }, (_, i) => `M${109 + i * 38} 198 V206`).join(
        "",
      ),
      "#5d4a2a",
      2,
    ) +
    rect(90, 278, 228, 28, "#1c2f4a", 'opacity=".14"') +
    rect(90, 270, 228, 28, P.yellow) +
    rect(90, 270, 228, 9, light(P.yellow, 0.3)) +
    rect(90, 289, 228, 9, shade(P.yellow, 0.15)) +
    path("M318 270 L354 284 L318 298Z", "#f0d6b0") +
    path("M342 279.5 L354 284 L342 288.5Z", P.ink) +
    rect(72, 270, 18, 28, P.pink, 'rx="3"') +
    rect(86, 270, 8, 28, "#b9c0c8"),
  "more-less": () =>
    room(330, { wall: "#f6e6cf" }) +
    table(30, 380, 240, 96) +
    table(370, 380, 240, 96) +
    plate(150, 278, 100, 18) +
    [
      [96, 262],
      [150, 262],
      [204, 262],
      [123, 234],
      [177, 234],
      [150, 206],
    ]
      .map(([x, y]) => cookie(x, y, 22))
      .join("") +
    plate(490, 278, 100, 18) +
    cookie(462, 262, 22) +
    cookie(518, 262, 22),
  "feel-happy": () =>
    outdoors(260) +
    lawn(260) +
    balloon(200, 90, P.red, 290, 214) +
    balloon(262, 70, P.blue, 290, 214) +
    balloon(318, 104, P.yellow, 290, 214) +
    kid(240, 390, MIA, { pose: "reach", mouth: "none", h: 190 }) +
    bigSmile(faceAt(240, 390, 190)),
  "feel-sad": () =>
    outdoors(260, {
      sun: null,
      clouds: [
        [110, 80, 0.9],
        [420, 70, 0.7],
      ],
      kind: "rain",
    }) +
    lawn(260) +
    kid(230, 390, LEO, { mouth: "none", h: 195 }) +
    sadFace(faceAt(230, 390, 195), LEO.skin) +
    `<g transform="translate(410 366) scale(1.6) translate(-410 -366)">${
    contact(410, 366, 50, 8, 0.2) +
    ellipse(412, 360, 42, 9, P.pink) +
    circle(400, 344, 22, P.pink) +
    circle(394, 338, 7, "#ffffff", 'opacity=".4"') +
    `<g transform="rotate(-60 430 330)">${poly(
      [
        [416, 322],
        [444, 322],
        [430, 366],
      ],
      "#e2b06f",
    )}${stroke("M420 332 l18 10M424 344 l12 -8", "#c58c4b", 2)}</g>`}</g>`,
  "new-friend": () =>
    room(320, { wall: "#f3ead9" }) +
    chalkboard(40, 40, 220, 130) +
    windowPane(450, 60, 120, 90) +
    kid(170, 385, NOOR, { backpack: P.gold, mouth: "flat" }) +
    rect(160, 230, 6, 44, shade(P.gold, 0.2)) +
    kid(370, 385, BEN, { pose: "wave", facing: -1, mouth: "open" }) +
    adult(540, 390, TEACHER, { facing: -1 }),
  crosswalk: () =>
    outdoors(150, { sun: [560, 50], clouds: [] }) +
    lawn(150, { tufts: 0 }) +
    rect(0, 186, W, 22, "#d9d5cc") +
    rect(0, 208, W, 124, "#646b73") +
    Array.from({ length: 8 }, (_, i) =>
      rect(40 + i * 74, 216, 42, 108, "#f4f4f0"),
    ).join("") +
    rect(0, 332, W, 68, "#d9d5cc") +
    rect(0, 332, W, 6, "#c4bfb4") +
    adult(
      150,
      300,
      { ...MOM, hairStyle: "bun" },
      { top: P.orange, pose: "hold", item: HELD.sign(), h: 190 },
    ) +
    kid(380, 390, LEO, { facing: -1 }) +
    kid(460, 390, ANA, { facing: -1 }) +
    adult(560, 395, DAD, { facing: -1, top: P.green }),
};
const ALT = {
  garden: [
    "A community garden. A child waters plants and a grown-up digs with a shovel.",
    "Un huerto comunitario. Una niña riega las plantas y un adulto cava con una pala.",
  ],
  "seed-plant": [
    "A child digs in the dirt and puts seeds in the ground.",
    "Un niño cava en la tierra y pone semillas en el suelo.",
  ],
  "seed-water": [
    "A child pours water on the seeds from a watering can.",
    "Un niño echa agua a las semillas con una regadera.",
  ],
  "seed-sprout": [
    "Small green sprouts grow out of the dirt.",
    "Pequeños brotes verdes salen de la tierra.",
  ],
  "seed-flower": [
    "The plants are tall with yellow flowers and red tomatoes. A child holds a basket.",
    "Las plantas están altas, con flores amarillas y tomates rojos. Un niño lleva una canasta.",
  ],
  classroom: [
    "A classroom with a board, two tables, a book and a teacher.",
    "Un salón de clases con un pizarrón, dos mesas, un libro y una maestra.",
  ],
  "park-rain": [
    "It is raining in the park. A child holds a red umbrella near a puddle.",
    "Llueve en el parque. Una niña tiene un paraguas rojo cerca de un charco.",
  ],
  breakfast: [
    "A family kitchen. There is a bowl, a glass of juice and an apple on the table.",
    "Una cocina familiar. En la mesa hay un tazón, un vaso de jugo y una manzana.",
  ],
  "bus-stop": [
    "A child with a book waits at the bus stop. A yellow bus is coming.",
    "Un niño con un libro espera en la parada. Viene un autobús amarillo.",
  ],
  library: [
    "A library with tall shelves of books. A child holds a book.",
    "Una biblioteca con estantes altos llenos de libros. Una niña tiene un libro.",
  ],
  market: [
    "A fruit stand at the market with red apples and yellow bananas.",
    "Un puesto de frutas en el mercado con manzanas rojas y plátanos amarillos.",
  ],
  playground: [
    "A playground with a swing and a slide. A child holds a ball.",
    "Un patio de juegos con un columpio y un tobogán. Un niño tiene una pelota.",
  ],
  "garden-walk": [
    "A grandpa and a child walk past houses to the garden. He has a basket and she has a watering can.",
    "Un abuelo y una niña caminan entre casas hacia el huerto. Él lleva una canasta y ella una regadera.",
  ],
  "garden-share": [
    "Neighbors share red tomatoes from the garden on a table.",
    "Los vecinos comparten tomates rojos del huerto en una mesa.",
  ],
  "lunch-share": [
    "Two friends eat lunch at a table at school.",
    "Dos amigos almuerzan en una mesa de la escuela.",
  ],
  "snow-day": [
    "It is snowing. A child in a red coat and a blue hat stands next to a snowman.",
    "Está nevando. Un niño con abrigo rojo y gorro azul está junto a un muñeco de nieve.",
  ],
  "wind-kite": [
    "A windy day. A child flies a red kite and the tree bends in the wind.",
    "Un día con viento. Una niña vuela una cometa roja y el árbol se dobla con el viento.",
  ],
  "ice-melt": [
    "On a sunny table, one dish has ice cubes and another dish has water.",
    "En una mesa soleada, un plato tiene cubos de hielo y otro plato tiene agua.",
  ],
  "steam-pot": [
    "A grown-up cooks at a stove. Steam rises from a pot.",
    "Un adulto cocina en una estufa. Sale vapor de una olla.",
  ],
  "plant-parts": [
    "A plant in soil. It has roots under the ground, a stem, two leaves and a yellow flower.",
    "Una planta en la tierra. Tiene raíces bajo el suelo, un tallo, dos hojas y una flor amarilla.",
  ],
  "pond-life": [
    "A pond with a yellow duck, a green frog and an orange fish.",
    "Un estanque con un pato amarillo, una rana verde y un pez anaranjado.",
  ],
  "farm-friends": [
    "A farm with a red barn, a cow with black spots and a yellow hen.",
    "Una granja con un establo rojo, una vaca con manchas negras y una gallina amarilla.",
  ],
  "night-moon": [
    "It is night. A moon and stars shine over a house with one lit window. A cat sits outside.",
    "Es de noche. La luna y las estrellas brillan sobre una casa con una ventana encendida. Un gato está afuera.",
  ],
  lunchroom: [
    "Two children and a teacher in the lunchroom. Food trays and a milk carton are on the tables.",
    "Dos niños y una maestra en el comedor. Hay bandejas de comida y un cartón de leche en las mesas.",
  ],
  "door-line": [
    "Three children stand in a line at the classroom door. The teacher waits at the end of the line.",
    "Tres niños hacen fila en la puerta del salón. La maestra espera al final de la fila.",
  ],
  "family-dinner": [
    "A family of five eats dinner at a table with a pot of food in the middle.",
    "Una familia de cinco cena en una mesa con una olla de comida en el centro.",
  ],
  "kitchen-help": [
    "A child sets the table with plates while a grown-up cooks and carries a basket.",
    "Una niña pone la mesa con platos mientras un adulto cocina y lleva una canasta.",
  ],
  "mail-carrier": [
    "A mail carrier in a blue uniform carries a bag near a blue mail truck and a red mailbox.",
    "Un cartero con uniforme azul lleva una bolsa cerca de un camión de correo azul y un buzón rojo.",
  ],
  "doctor-visit": [
    "A doctor with a stethoscope and a child at a clinic. A first-aid sign is on the wall.",
    "Una doctora con estetoscopio y un niño en una clínica. Hay un letrero de primeros auxilios en la pared.",
  ],
  handwash: [
    "A child washes hands at a sink. Water runs and soap bubbles float up.",
    "Una niña se lava las manos en un lavabo. Corre el agua y suben burbujas de jabón.",
  ],
  "bedroom-sleep": [
    "A child sleeps in bed. The moon shines through the window.",
    "Una niña duerme en su cama. La luna brilla por la ventana.",
  ],
  "healthy-plate": [
    "A round plate with four colored parts for vegetables, grains, fruit and protein foods.",
    "Un plato redondo con cuatro partes de colores para verduras, granos, frutas y proteínas.",
  ],
  "jump-rope": [
    "A child jumps rope on the grass while a friend holds a ball.",
    "Una niña salta la cuerda en el pasto mientras un amigo tiene una pelota.",
  ],
  "shapes-table": [
    "On a table: a red circle, a blue square, a green triangle and a yellow rectangle.",
    "En una mesa: un círculo rojo, un cuadrado azul, un triángulo verde y un rectángulo amarillo.",
  ],
  "apples-count": [
    "Two baskets of red apples. The left basket has five apples. The right basket has three apples.",
    "Dos canastas de manzanas rojas. La canasta de la izquierda tiene cinco manzanas. La de la derecha tiene tres.",
  ],
  "measure-pencil": [
    "A yellow pencil lies next to a ruler. The pencil is a little longer than half the ruler.",
    "Un lápiz amarillo está junto a una regla. El lápiz es un poco más largo que la mitad de la regla.",
  ],
  "more-less": [
    "Two tables with plates of cookies. The left plate has six cookies. The right plate has two cookies.",
    "Dos mesas con platos de galletas. El plato de la izquierda tiene seis galletas. El de la derecha tiene dos.",
  ],
  "feel-happy": [
    "A smiling child holds three balloons: red, blue and yellow.",
    "Una niña sonriente sostiene tres globos: rojo, azul y amarillo.",
  ],
  "feel-sad": [
    "A child looks sad. An ice cream cone has fallen on the ground.",
    "Un niño se ve triste. Un helado se cayó al suelo.",
  ],
  "new-friend": [
    "A new child with a backpack stands in the classroom. Another child waves hello.",
    "Una niña nueva con mochila está en el salón. Otro niño la saluda con la mano.",
  ],
  crosswalk: [
    "A crossing guard with a stop sign helps two children and a grown-up at the crosswalk.",
    "Una guardia de cruce con una señal de alto ayuda a dos niños y a un adulto en el paso peatonal.",
  ],
  "lost-mitten": [
    "A red mitten lies in the snow near a tree. A child is looking for it.",
    "Un guante rojo está en la nieve cerca de un árbol. Una niña lo busca.",
  ],
};


/** Scene ids the content may name. */
export const SCENES = Object.keys(DRAW);

/** [english alt, spanish alt] for a scene, or null. */
export const sceneAlt = (id) => ALT[id] || null;

/** The scene as an inline <svg> string (alt in the chosen language), or "" when the id is unknown. */
export function sceneSVG(id, lang = "en") {
  if (!DRAW[id]) return "";
  const [en, es] = ALT[id];
  return svg((lang === "es" ? es : en).replace(/"/g, "&quot;"), noDefs(DRAW[id]));
}

/** Pepita, the guide: a round seed with a sprout who reads every direction aloud. */
export function guideSVG({ talking = false } = {}) {
  const seed = "#c98a4b";
  const body = noDefs(
    () =>
      ellipse(60, 114, 30, 4, "#1c2f4a", 'opacity=".16"') +
      stroke("M60 34 Q58 24 60 16", P.leafDark, 4) +
      leaf(60, 18, 30, -160, P.leafLight) +
      leaf(60, 18, 30, -22, P.leaf) +
      ellipse(60, 72, 40, 42, seed) +
      path("M66 30 A40 42 0 0 1 66 114 A30 42 0 0 0 66 30Z", shade(seed, 0.18)) +
      ellipse(44, 46, 14, 8, light(seed, 0.35), 'opacity=".7" transform="rotate(-30 44 46)"') +
      ellipse(60, 80, 27, 25, "#e7b98a") +
      circle(46, 64, 6, P.ink) +
      circle(74, 64, 6, P.ink) +
      circle(48, 62, 2, "#ffffff") +
      circle(76, 62, 2, "#ffffff") +
      stroke("M39 53 q7 -5 13 -1M68 52 q6 -4 13 1", shade(seed, 0.45), 2.4) +
      ellipse(36, 80, 6, 4, P.coralLight, 'opacity=".7"') +
      ellipse(84, 80, 6, 4, P.coralLight, 'opacity=".7"'),
  );
  return `<svg class="early-guide-art${talking ? " is-talking" : ""}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">${body}<ellipse class="early-guide-mouth" cx="60" cy="86" rx="10" ry="5" fill="#7a2f2a"/></svg>`;
}

export const GUIDE_NAME = "Pepita";
