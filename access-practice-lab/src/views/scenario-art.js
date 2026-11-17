// Real-Life Scenarios art: every scene is drawn as inline SVG from its data. A place (wall, floor and a few props) plus
// characters built from a "look" (skin, hair style, shirt, accessory) and a mood. No images are loaded.
// Style: the site illustration kit (src/art/kit.js), editorial picture-book flat. No outlines; form comes from a lit
// side and a shade side, soft contact shadows and one warm light from the upper left. Figures are the kit's person(),
// so every face on the site belongs to one family. All drawing is id-free (noDefs): thumbnails repeat on a page.
import { P, circle, clock, contact, ellipse, light, mix, noDefs, path, person, rect, rrect, shade, stroke, tree } from "../art/kit.js";
import { bookshelfFlat, box, counter, cross, goodsRow, legTable, papers, plaque, plant, room, shelf, sofa, win } from "../art/l-room.js";

const e = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

/* ------------------------------------------------------------------ places */

const PLACES = {
  office: () =>
    room("#e4ebf3", "#cdbf9f") +
    plaque(40, 64, 124, 78, P.ivory) +
    clock(78, 103, 22) +
    stroke("M116 88h32M116 102h26M116 116h30", "#9aa7b4", 3) +
    plant(590, 200, 1.3) +
    counter(206, 186, 210, 52, P.wood) +
    papers(226, 186) +
    box(330, 168, 46, 18, P.navy, 3) +
    rect(336, 172, 34, 10, P.tealLight, 'opacity=".55"'),
  clinic: () =>
    room("#e2f1ee", "#d5e0da") +
    plaque(40, 58, 94, 76, P.white, 10) +
    cross(87, 96, 44, P.teal) +
    plaque(176, 64, 56, 70, P.ivory, 4) +
    stroke("M186 82h36M186 96h36M186 110h24", "#9aa7b4", 3) +
    contact(286, 258, 110, 6, 0.18) +
    rect(198, 222, 10, 34, "#9aa7b4") +
    rect(366, 222, 10, 34, "#9aa7b4") +
    rrect(186, 196, 200, 30, 12, P.white) +
    rrect(186, 214, 200, 12, 6, mix(P.white, P.tealLight, 0.3)) +
    rrect(194, 186, 58, 16, 8, "#eaf4f2"),
  bus: () => {
    let s = room("#f2dfa6", "#7f8592");
    for (const x of [30, 170, 310])
      s +=
        win(x, 46, 110, 70, "#e9d08a", "#a9d6ea") +
        tree(x + 30, 116, 0.32, { kind: "round", tone: mix(P.leaf, P.skyLow, 0.4) }) +
        rect(x, 104, 110, 12, mix(P.grass, "#a9d6ea", 0.4));
    s += rect(0, 18, 640, 6, "#b9bec7") + rect(0, 18, 640, 2, "#e3e6ea");
    for (const x of [90, 230, 370])
      s +=
        stroke(`M${x} 24v18`, "#8d939d", 2) +
        rrect(x - 7, 42, 14, 10, 5, "none", 'stroke="#8d939d" stroke-width="2.5"');
    s +=
      rrect(36, 162, 92, 70, 18, P.coral) +
      rrect(36, 162, 92, 18, 9, light(P.coral, 0.2)) +
      rect(108, 168, 18, 62, shade(P.coral, 0.15), 'opacity=".7"');
    s += rrect(452, 162, 92, 70, 18, P.coral) + rrect(452, 162, 92, 18, 9, light(P.coral, 0.2));
    s +=
      rect(586, 0, 9, 240, "#b9bec7") + rect(587, 0, 3, 240, "#eef1f4") + contact(590, 240, 14, 3);
    return s;
  },
  store: () =>
    room("#f8ece0", "#d9c6a6") +
    shelf(
      30,
      66,
      180,
      goodsRow(40, 66, [
        [24, 26, P.coral],
        [22, 20, P.teal, 4],
        [28, 30, P.gold],
        [20, 22, P.blue, 4],
        [24, 18, P.green],
      ]),
    ) +
    shelf(
      30,
      120,
      180,
      goodsRow(44, 120, [
        [30, 26, P.navy],
        [22, 22, P.orange, 4],
        [26, 28, P.tealLight],
        [24, 20, P.coralLight],
      ]),
    ) +
    plaque(300, 40, 120, 34, P.teal, 8) +
    stroke("M320 57h80", P.ivory, 4) +
    counter(232, 190, 200, 48, "#8d6b4a") +
    box(252, 168, 52, 22, P.navy, 4) +
    rect(258, 172, 40, 9, P.tealLight, 'opacity=".6"') +
    box(334, 176, 40, 14, P.gold, 4),
  lunch: () =>
    room("#fbefd2", "#e5d4b2") +
    win(54, 40, 120, 80) +
    plaque(380, 46, 160, 74, P.navy, 8) +
    rect(380, 46, 160, 18, P.gold, 'rx="8"') +
    stroke("M396 82h96M396 98h70M396 112h84", P.ivory, 3, 'opacity=".75"') +
    legTable(40, 190, 240, P.wood, 50) +
    rrect(70, 178, 70, 14, 4, P.ivory) +
    circle(90, 182, 6, P.coral) +
    rrect(104, 178, 26, 8, 4, P.green) +
    rrect(170, 178, 70, 14, 4, P.ivory) +
    circle(190, 182, 6, P.gold) +
    rrect(204, 178, 26, 8, 4, P.tealLight),
  classroom: () =>
    room("#e9edf4", "#d6c9a8") +
    plaque(34, 30, 272, 112, P.woodDark, 6) +
    rect(42, 38, 256, 96, "#2f5245") +
    ellipse(120, 60, 90, 22, "#ffffff", 'opacity=".05"') +
    stroke("M62 70H200M62 96H160M212 96h48", "#f4f1e8", 4, 'opacity=".9"') +
    rect(60, 134, 36, 5, P.ivory) +
    plaque(470, 40, 70, 90, P.gold, 6) +
    stroke("M482 62h46M482 80h40M482 98h46", P.navy, 3, 'opacity=".55"') +
    legTable(354, 192, 128, P.woodLight, 50) +
    box(370, 180, 30, 12, P.coral, 2) +
    box(404, 184, 26, 8, P.teal, 2),
  phone: () =>
    room("#f6ebe4", "#d8c3a5") +
    win(330, 64, 96, 70, P.ivory) +
    sofa(30, 156, 180, P.teal) +
    legTable(252, 196, 60, P.woodLight, 40) +
    rrect(268, 172, 26, 24, 5, P.navy) +
    rrect(272, 176, 18, 12, 3, P.tealLight) +
    stroke("M300 170q8 -8 0 -18M308 176q14 -16 0 -32", P.gold, 3) +
    plaque(470, 70, 66, 52, P.coralLight, 4) +
    rect(476, 76, 54, 40, light(P.coralLight, 0.4)) +
    path("M476 116l18 -20l14 12l10 -8l12 16Z", P.leaf),
  library: () =>
    room("#eee8df", "#cbb994") +
    bookshelfFlat(30, 168, 210, 140) +
    win(420, 50, 100, 80) +
    counter(326, 192, 170, 46, P.wood) +
    box(346, 176, 34, 16, P.coral, 2) +
    box(384, 180, 28, 12, P.teal, 2),
  hallway: () => {
    let s = room("#e7ebf1", "#c9c3b6");
    for (let i = 0; i < 4; i++) {
      const x = 20 + i * 50;
      const c = i % 2 ? "#2e5b80" : "#3a6c94";
      s +=
        rrect(x, 40, 46, 152, 3, c) +
        rect(x + 36, 42, 9, 148, shade(c, 0.15)) +
        stroke(`M${x + 8} 54h22M${x + 8} 60h22M${x + 8} 66h22`, shade(c, 0.3), 2) +
        rrect(x + 8, 108, 5, 16, 2, "#d9dde2");
    }
    s += contact(118, 194, 110, 5, 0.16);
    s += plaque(300, 50, 140, 90, "#c9a77a", 6) + rect(308, 58, 124, 74, "#d9bb8f");
    s +=
      box(318, 66, 40, 30, P.ivory, 1) +
      box(366, 70, 52, 24, P.goldLight, 1) +
      box(330, 102, 46, 22, P.tealLight, 1);
    s += circle(338, 68, 3, P.coral) + circle(392, 72, 3, P.teal) + circle(353, 104, 3, P.coral);
    return s;
  },
  playground: () =>
    rect(0, 0, 640, 200, "#bfe0ee") +
    circle(540, 50, 70, "#fff4c9", 'opacity=".2"') +
    circle(540, 50, 44, "#fff4c9", 'opacity=".3"') +
    circle(540, 50, 24, "#f8d77a") +
    path("M0 170Q120 130 260 160T640 150V200H0Z", mix(P.grass, P.skyLow, 0.45)) +
    tree(250, 196, 0.62, { tone: P.leaf }) +
    rect(0, 196, 640, 84, P.grass) +
    rect(0, 196, 640, 8, P.grassDark, 'opacity=".5"') +
    stroke(
      "M30 240l-4 -10M36 240l2 -12M300 258l-4 -10M306 258l3 -11M580 236l-3 -10M586 236l3 -12",
      P.grassDark,
      2,
    ) +
    slideFlat(40, 200) +
    contact(360, 202, 70, 5, 0.18) +
    path("M300 202q60 -96 120 0h-12q-48 -78 -96 0Z", P.coral) +
    path(
      "M318 160q42 -46 84 0",
      "none",
      `stroke="${light(P.coral, 0.35)}" stroke-width="3" opacity=".6"`,
    ),
  pharmacy: () =>
    room("#e2f1ee", "#d5e0da") +
    shelf(
      30,
      54,
      220,
      goodsRow(40, 54, [
        [16, 28, P.coral, 5],
        [16, 22, P.teal, 5],
        [20, 32, P.navy, 5],
        [16, 24, P.gold, 5],
        [18, 30, P.white, 5],
        [16, 22, P.coralLight, 5],
      ]),
    ) +
    shelf(
      30,
      106,
      220,
      goodsRow(44, 106, [
        [22, 26, P.white, 4],
        [16, 22, P.green, 5],
        [24, 28, P.tealLight, 4],
        [18, 24, P.orange, 5],
        [22, 20, P.blue, 4],
      ]),
    ) +
    plaque(380, 44, 70, 70, P.white, 12) +
    cross(415, 79, 44, P.green) +
    counter(290, 190, 220, 46, P.white) +
    rect(290, 196, 220, 8, P.teal, 'opacity=".75"') +
    box(318, 172, 30, 18, P.ivory, 4),
  home: () =>
    room("#f8ece0", "#d8c3a5") +
    win(330, 50, 120, 90, P.ivory) +
    path("M318 38h28q-8 60 4 118h-32Z", P.coral) +
    path("M462 38h-28q8 60 -4 118h32Z", shade(P.coral, 0.08)) +
    rect(312, 32, 156, 7, P.woodDark) +
    sofa(40, 146, 200, P.teal) +
    plant(560, 200, 1.2),
  street: () =>
    rect(0, 0, 640, 200, "#cfe4f0") +
    ellipse(120, 30, 240, 80, "#ffffff", 'opacity=".35"') +
    facade(20, 196, 110, 166, "#d28b58", 2, 4) +
    facade(140, 196, 90, 126, P.coral, 2, 3) +
    facade(250, 196, 120, 176, "#3a6c94", 3, 4) +
    tree(400, 200, 0.6, { tone: P.leaf }) +
    rect(0, 196, 640, 10, "#d9d5cc") +
    rect(0, 206, 640, 74, "#8d939d") +
    rect(0, 206, 640, 6, shade("#8d939d", 0.15)) +
    stroke(
      "M430 228h22M466 228h22M502 228h22M538 228h22M574 228h22M430 252h22M466 252h22M502 252h22M538 252h22M574 252h22",
      "#f2f2ee",
      9,
    ),
};

/** Flat slide (ladder left, chute right) standing on y. */
const slideFlat = (x, y) =>
  contact(x + 60, y + 2, 70, 5, 0.18) +
  rect(x + 66, y - 118, 7, 118, "#8d939d") +
  rect(x + 92, y - 118, 7, 118, "#a8adb5") +
  stroke(
    `M${x + 70} ${y - 98}h24M${x + 70} ${y - 74}h24M${x + 70} ${y - 50}h24M${x + 70} ${y - 26}h24`,
    "#a8adb5",
    4,
  ) +
  rrect(x + 60, y - 124, 44, 9, 3, shade(P.gold, 0.15)) +
  path(
    `M${x + 66} ${y - 116}C${x + 30} ${y - 104} ${x + 20} ${y - 30} ${x - 20} ${y - 10}L${x - 20} ${y}C${x + 26} ${y - 16} ${x + 40} ${y - 92} ${x + 70} ${y - 102}Z`,
    P.gold,
  ) +
  path(
    `M${x + 60} ${y - 112}C${x + 30} ${y - 98} ${x + 18} ${y - 34} ${x - 18} ${y - 14}`,
    "none",
    `stroke="${light(P.gold, 0.4)}" stroke-width="3"`,
  );

/** Street building front with a grid of windows and a darker side. */
function facade(x, y, w, h, c, cols, rows) {
  let s =
    rect(x, y - h, w, h, c) +
    rect(x + w * 0.8, y - h, w * 0.2, h, shade(c, 0.15)) +
    rect(x - 3, y - h - 6, w + 6, 7, shade(c, 0.25));
  const gw = w / cols;
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++) {
      const wx = x + k * gw + gw * 0.26;
      const wy = y - h + 16 + r * 40;
      if (wy + 26 > y - 6) continue;
      s += rect(wx, wy, gw * 0.48, 24, "#e9f3f7") + rect(wx, wy + 12, gw * 0.48, 12, "#b9d7e4");
    }
  return s;
}


/* ------------------------------------------------------------------ characters */

// The figure is the kit's person() at a size where the head (radius 23) is centred 44 units above (x, y), so callers
// that frame a head-and-shoulders view keep working: the bust spans roughly y -80..+60 around the anchor.
const K = 1.77; // person() height / 100
const FEET = 110; // where the feet would stand, below the frame of every caller
const HR = 13 * K; // head radius
const HY = FEET - 87 * K; // head centre (-44)
const KIT_HAIR = {
  short: "short",
  long: "long",
  curly: "curly",
  bun: "bun",
  braids: "braid",
  cap: "cap",
  bald: "bald",
  ponytail: "short",
  afro: "curly",
  hijab: "hijab",
};

/** Hair drawn behind the whole figure for styles the kit has no shape for. */
function hairBehind(style, h) {
  if (style === "afro")
    return (
      circle(-2, HY - HR * 0.22, HR * 1.36, h) +
      circle(-10, HY - HR * 0.7, HR * 0.5, light(h, 0.12), 'opacity=".5"')
    );
  if (style === "ponytail")
    return path(
      `M${-HR * 0.7} ${HY - HR * 0.6}C${-HR * 1.9} ${HY - HR * 0.5} ${-HR * 1.8} ${HY + HR * 1.1} ${-HR * 1.25} ${HY + HR * 1.5}C${-HR * 1.3} ${HY + HR * 0.6} ${-HR * 1.2} ${HY} ${-HR * 0.5} ${HY - HR * 0.1}Z`,
      h,
    );
  if (style === "braids") {
    const b = (x0) =>
      stroke(
        `M${x0} ${HY + 2}C${x0 - 3} ${HY + HR * 0.9} ${x0 + 2} ${HY + HR * 1.4} ${x0} ${HY + HR * 2}`,
        h,
        HR * 0.34,
      ) + circle(x0, HY + HR * 2.05, HR * 0.17, P.gold);
    return b(-HR * 0.95) + b(HR * 0.95);
  }
  return "";
}

/** Brows and mouth per mood, in figure units (eyes at x -0.5 and 13.8, y -42.2; mouth centre x 7, y -32.5). */
const ink = (skin) => shade(skin, 0.6);
const MOOD = {
  neutral: (k) => stroke("M2.5 -31.6Q7 -30.6 11.5 -31.6", ink(k.skin), 2),
  pleased: (k) => stroke("M1.8 -33.2Q7 -27.8 12.4 -33.2", ink(k.skin), 2.2),
  happy: () =>
    path("M0.8 -33.8Q7 -32.6 13.4 -33.8Q12.6 -25.4 7 -25.4Q1.6 -25.4 0.8 -33.8Z", "#7a2f2a") +
    ellipse(7, -27.6, 3.4, 1.7, P.coralLight),
  puzzled: (k) =>
    stroke("M1.5 -31Q4 -33.6 6.5 -31T11.5 -31", ink(k.skin), 2) +
    stroke("M-4.8 -48.6H3.4M9.6 -51.2Q14 -55 18.4 -51.6", k.brow, 2),
  concerned: (k) =>
    stroke("M2.5 -29.4Q7 -34 11.5 -29.4", ink(k.skin), 2.2) +
    stroke("M-4.8 -48.4L3.6 -51.2M9.8 -51.2L18.2 -48.4", k.brow, 2),
  surprised: (k) =>
    ellipse(7, -30.4, 2.8, 3.6, "#7a2f2a") +
    stroke("M-4.6 -50Q-0.5 -53 3.4 -50.6M9.8 -50.6Q14 -53.4 18 -50", k.brow, 2),
};
const MOOD_ALIAS = {
  worried: "concerned",
  sad: "concerned",
  warn: "concerned",
  bad: "concerned",
  confused: "puzzled",
  good: "happy",
  hi: "happy",
  excited: "happy",
  calm: "pleased",
};

function headphones() {
  const c = P.navy;
  return (
    stroke(
      `M${-HR * 0.42} ${HY - 4}C${-HR * 0.55} ${HY - HR * 1.35} ${HR * 0.95} ${HY - HR * 1.4} ${HR * 1.02} ${HY - HR * 0.3}`,
      c,
      4,
    ) +
    stroke(
      `M${-HR * 0.3} ${HY - HR * 0.9}C${0} ${HY - HR * 1.2} ${HR * 0.5} ${HY - HR * 1.2} ${HR * 0.7} ${HY - HR * 0.9}`,
      light(c, 0.4),
      1.2,
      'opacity=".7"',
    ) +
    rrect(-HR * 0.42 - 5.5, HY - 7, 11, 16, 5, c) +
    rrect(-HR * 0.42 - 3, HY - 5, 4, 10, 2, light(c, 0.35)) +
    rrect(HR * 1.02 - 3, HY - HR * 0.42, 6, 12, 3, shade(c, 0.2))
  );
}

/** One character, anchored at the neck (x, y), `s` = scale. A head-and-shoulders figure: head above, torso below. */
export function characterSVG(look = {}, mood = "neutral", x = 0, y = 0, s = 1, flip = false) {
  const {
    skin = "#e0ac84",
    hair = "#2b1b12",
    style = "short",
    shirt = "#2f6f9f",
    acc = "none",
  } = look;
  const st = KIT_HAIR[style] ? style : "short";
  const fig = noDefs(() =>
    person(0, FEET, 100 * K, {
      skin,
      hair,
      hairStyle: KIT_HAIR[st],
      top: shirt,
      bottom: P.navy,
      glasses: acc === "glasses",
      mouth: "none",
    }),
  ).replace(/^<ellipse[^>]*\/>/, ""); // the floor shadow sits below every frame
  const m = MOOD[mood] || MOOD[MOOD_ALIAS[mood]] || MOOD.neutral;
  const brow = st === "bald" ? shade(skin, 0.5) : shade(hair, 0.1);
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">${hairBehind(st, hair)}${fig}${m({ skin, brow })}${acc === "headphones" ? headphones() : ""}</g>`;
}

/* ------------------------------------------------------------------ scenes */

const backdrop = (id) => noDefs(() => (PLACES[id] || PLACES.office)());

/** The full scene picture: place, learner on the left, NPC (and optional second NPC) on the right. */
export function sceneSVG(scene, { mood = "neutral", who = "npc", learner = {}, label = "" } = {}) {
  const npc = scene.npc;
  const npc2 = scene.npc2;
  const speaker = (k) => (who === k ? mood : "neutral");
  const chars = [
    characterSVG(learner, "neutral", 150, 202, 1.35),
    npc2 ? characterSVG(npc2.look, speaker("npc2"), 400, 202, 1.3, true) : "",
    characterSVG(npc.look, speaker("npc"), npc2 ? 500 : 470, 202, 1.35, true),
  ].join("");
  return `<svg class="scn-svg" viewBox="0 0 640 280" width="640" height="280" role="img" aria-label="${e(label || scene.title)}"><title>${e(label || scene.title)}</title>${backdrop(scene.place)}${chars}</svg>`;
}

/** A small place thumbnail for hub cards. */
export const placeThumbSVG = (scene) =>
  `<svg class="scn-thumb" viewBox="0 0 640 280" width="160" height="70" aria-hidden="true" focusable="false">${backdrop(scene.place)}${characterSVG(scene.npc.look, "happy", 470, 202, 1.35, true)}</svg>`;

export const PLACE_IDS = Object.keys(PLACES);
export const LEARNER_LOOKS = [
  { skin: "#c68642", hair: "#2b1b12", style: "short", shirt: "#d28b58", acc: "none" },
  { skin: "#f1c9a5", hair: "#8a5a2b", style: "ponytail", shirt: "#2e4a94", acc: "none" },
  { skin: "#8d5524", hair: "#1b1b1b", style: "curly", shirt: "#5a9481", acc: "glasses" },
  { skin: "#e0ac84", hair: "#1b1b1b", style: "hijab", shirt: "#a24f72", acc: "none" },
  { skin: "#5c3a21", hair: "#1b1b1b", style: "braids", shirt: "#33447c", acc: "none" },
  { skin: "#f5d5b8", hair: "#c9892c", style: "cap", shirt: "#075568", acc: "headphones" },
];
