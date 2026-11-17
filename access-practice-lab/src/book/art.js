// Book Studio art library: original inline SVG illustrations in the site's editorial picture-book style (no dark
// outlines; form from a lit side and a shade side, soft contact shadows, Deep Harbor palette), drawn with the
// illustration kit in no-defs mode: no ids, no text, no external refs, so any number of copies can sit on one page.
// Characters are 200x300 full body, backgrounds 400x300 (cover-safe), the rest 200x200 on a transparent ground.
// Characters live in src/art/h-book-people.js and backgrounds in src/art/h-book-scenes.js.

import {
  P,
  noDefs,
  shade,
  light,
  mix,
  rect,
  rrect,
  circle,
  ellipse,
  path,
  stroke,
  contact,
} from "../art/kit.js";
import { bookPeople } from "../art/h-book-people.js";
import { bookScenes } from "../art/h-book-scenes.js";

const sq = (b) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g stroke-linecap="round" stroke-linejoin="round">${b}</g></svg>`;
const r1 = (n) => Math.round(n * 10) / 10;
/** Star/burst polygon path. */
const burst = (cx, cy, R, r, n, rot = -90) => {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (180 / n) * i) * Math.PI) / 180;
    const rad = i % 2 ? r : R;
    d += `${i ? "L" : "M"}${r1(cx + rad * Math.cos(a))} ${r1(cy + rad * Math.sin(a))}`;
  }
  return `${d}Z`;
};
/** Soft white sheen stroke (a highlight, not an outline). */
const sheen = (d, w = 5, o = 0.55) => stroke(d, "#ffffff", w, `opacity="${o}"`);
const shadow = (x = 100, y = 182, rx = 56) => contact(x, y, rx, rx * 0.12, 0.2);
const STEEL = "#b8c2c9";
const GLASS = "#cfe8ee";

/* ---------- objects (200x200) ---------- */

const OBJECTS = [
  [
    "obj-book",
    "Book",
    "Libro",
    () =>
      shadow(100, 170, 80) +
      path("M18 54v108q42-6 82 12q40-18 82-12V54z", shade(P.coral, 0.2)) +
      path("M100 60q-32-18-74-12v104q42-6 74 12z", P.ivory) +
      path("M100 60q32-18 74-12v104q-42-6-74 12z", mix(P.ivory, "#e8dcc6", 0.6)) +
      path("M100 60v104q-6-4-12-6V60q6-2 12 0z", "#1c2f4a", 'opacity=".07"') +
      stroke(
        "M40 72q24-4 46 4M40 90q24-4 46 4M40 108q24-4 46 4M40 126q16-3 30 2M114 76q22-8 46-4M114 94q22-8 46-4M114 112q22-8 46-4",
        "#b9c2c8",
        3,
      ) +
      path("M134 46v36l8-6l8 6V44z", P.gold) +
      path("M142 45v31l8 6V44z", shade(P.gold, 0.2)),
  ],
  [
    "obj-magnifier",
    "Magnifying glass",
    "Lupa",
    () =>
      shadow(110, 184, 60) +
      stroke("M122 122l50 50", P.woodDark, 18) +
      stroke("M124 120l48 48", P.wood, 9) +
      circle(84, 84, 52, P.gold) +
      path("M84 32a52 52 0 0 1 0 104a44 44 0 0 0 0-104z", shade(P.gold, 0.2)) +
      circle(84, 84, 42, GLASS) +
      path("M84 42a42 42 0 0 1 30 72a50 50 0 0 0-30-72z", shade(GLASS, 0.1)) +
      sheen("M58 72q8-20 28-24", 7, 0.85),
  ],
  [
    "obj-lightbulb",
    "Light bulb",
    "Foco",
    () =>
      circle(100, 72, 70, "#fff2c2", 'opacity=".45"') +
      path("M100 20a52 52 0 0 0-32 93q8 8 8 26h48q0-18 8-26a52 52 0 0 0-32-93z", P.goldLight) +
      path("M110 21a52 52 0 0 1 22 92q-8 8-8 26h-14q0-22 8-32q22-30-8-86z", P.gold) +
      stroke("M88 136v-28l-10-22M112 136v-28l10-22M88 108q12 10 24 0", P.orange, 3) +
      rrect(76, 136, 48, 14, 4, STEEL) +
      rrect(80, 150, 40, 12, 4, shade(STEEL, 0.1)) +
      rect(108, 136, 16, 26, shade(STEEL, 0.2), 'opacity=".6"') +
      path("M88 162h24l-6 12h-12z", "#3d4652") +
      sheen("M68 62q8-20 28-24", 7, 0.8),
  ],
  [
    "obj-globe",
    "Globe",
    "Globo terráqueo",
    () =>
      shadow(100, 182, 48) +
      path("M64 168h72l-6 14H70z", P.woodDark) +
      rect(64, 166, 72, 5, P.wood) +
      rect(96, 146, 8, 22, P.woodDark) +
      path(
        "M40 86a60 60 0 0 0 120 0",
        "none",
        `stroke="${P.gold}" stroke-width="5" transform="rotate(-20 100 86)"`,
      ) +
      circle(100, 86, 56, P.water) +
      path(
        "M66 50q20 0 24 14q-10 12 4 22q-6 14-22 10q-12-20-24-12q2-20 18-34zM112 40q22 2 34 20q-14-2-16 10q-14 6-20-6q10-10 2-24zM120 96q18-6 30 6q-6 24-26 32q-4-18-4-38zM72 116q10 0 14 10q-6 6-12 4z",
        P.grass,
      ) +
      path("M112 31a56 56 0 0 1 0 110q34-55 0-110z", "#1c2f4a", 'opacity=".16"') +
      sheen("M62 64q8-20 26-28", 6, 0.6),
  ],
  [
    "obj-map",
    "Map",
    "Mapa",
    () =>
      shadow(100, 176, 82) +
      path("M20 50l52-16v120l-52 16z", "#f1dcae") +
      path("M72 34l56 16v120l-56-16z", P.ivory) +
      path("M128 50l52-16v120l-52 16z", shade("#f1dcae", 0.08)) +
      path(
        "M30 70q20-10 30 4q-4 20-20 16q-14 0-10-20zM100 120q16-10 24 4q-2 22-20 18q-10-6-4-22zM142 60q18-6 28 8q-8 18-24 10z",
        P.grass,
      ) +
      path("M150 120q14-6 22 4q-6 12-20 8z", P.waterLight) +
      stroke("M40 130q30 0 40-30t40-40t30 50", P.coral, 3.5, 'stroke-dasharray="7 8"') +
      stroke("M140 104l14 14M154 104l-14 14", P.coral, 5) +
      circle(40, 130, 5.5, P.navy),
  ],
  [
    "obj-trophy",
    "Trophy",
    "Trofeo",
    () =>
      shadow(100, 180, 52) +
      stroke(
        "M62 50q-30 0-24 30q4 18 30 22M138 50q30 0 24 30q-4 18-30 22",
        shade(P.gold, 0.15),
        8,
      ) +
      path("M58 34h84v40q0 46-42 50q-42-4-42-50z", P.gold) +
      path("M112 34h30v40q0 40-34 48q22-30 4-88z", shade(P.gold, 0.2)) +
      rect(64, 34, 72, 7, light(P.gold, 0.3)) +
      rect(92, 122, 16, 24, shade(P.gold, 0.1)) +
      rect(66, 146, 68, 12, P.woodDark) +
      rrect(56, 158, 88, 20, 4, P.navy) +
      rect(118, 158, 26, 20, shade(P.navy, 0.2), 'rx="4"') +
      path(burst(100, 74, 20, 8.5, 5), P.ivory) +
      rrect(82, 164, 36, 8, 2, P.goldLight) +
      sheen("M70 46v28", 6, 0.5),
  ],
  [
    "obj-camera",
    "Camera",
    "Cámara",
    () =>
      shadow(100, 168, 76) +
      path("M72 58l10-16h36l10 16z", STEEL) +
      rrect(134, 46, 22, 14, 3, P.gold) +
      rrect(26, 58, 148, 102, 16, P.navy) +
      rect(26, 80, 148, 56, P.coral) +
      rect(140, 80, 34, 56, shade(P.coral, 0.15)) +
      rect(40, 62, 110, 5, light(P.navy, 0.2), 'rx="2"') +
      circle(100, 108, 42, P.ivory) +
      circle(100, 108, 30, "#2b3440") +
      circle(100, 108, 18, P.teal) +
      circle(100, 108, 8, shade(P.teal, 0.4)) +
      sheen("M86 96q6-8 16-6", 5, 0.8) +
      circle(150, 70, 5, P.goldLight),
  ],
  [
    "obj-microphone",
    "Microphone",
    "Micrófono",
    () =>
      shadow(100, 180, 40) +
      stroke("M62 92q0 42 38 42t38-42", shade(STEEL, 0.25), 6) +
      rect(96, 134, 8, 32, shade(STEEL, 0.2)) +
      rrect(70, 166, 60, 12, 5, "#3d4652") +
      rrect(74, 24, 52, 94, 26, STEEL) +
      path("M108 25q18 4 18 26v40q0 22-18 26z", shade(STEEL, 0.18)) +
      stroke("M80 46h40M78 60h44M78 74h44", shade(STEEL, 0.25), 2) +
      rect(74, 88, 52, 16, P.coral) +
      rect(108, 88, 18, 16, shade(P.coral, 0.2)) +
      sheen("M86 36q-6 8-6 18", 5, 0.75),
  ],
  [
    "obj-pencil",
    "Pencil",
    "Lápiz",
    () =>
      shadow(100, 170, 60) +
      `<g transform="rotate(-45 100 100)">` +
      rect(40, 84, 104, 32, P.gold) +
      rect(40, 84, 104, 10, light(P.gold, 0.25)) +
      rect(40, 106, 104, 10, shade(P.gold, 0.15)) +
      path("M144 84l34 16l-34 16z", "#f1dcae") +
      path("M144 100h34l-34 16z", shade("#f1dcae", 0.15)) +
      path("M166 94l12 6l-12 6z", "#3d4652") +
      rect(26, 82, 16, 36, STEEL) +
      rect(26, 106, 16, 12, shade(STEEL, 0.15)) +
      path("M26 82h-6q-8 0-8 8v20q0 8 8 8h6z", P.coralLight) +
      path("M12 104v6q0 8 8 8h6v-14z", P.coral) +
      "</g>",
  ],
  [
    "obj-heart",
    "Heart",
    "Corazón",
    () =>
      path(
        "M100 172q-74-46-78-96q-2-36 34-42q30-4 44 26q14-30 44-26q36 6 34 42q-4 50-78 96z",
        P.coral,
      ) +
      path("M140 34q36 6 34 42q-4 50-74 96q60-60 40-138z", shade(P.coral, 0.2)) +
      sheen("M46 64q4-16 22-18", 8, 0.6),
  ],
  [
    "obj-star",
    "Star",
    "Estrella",
    () =>
      path(
        "M100 22L120 76.5L178 79.3L132.3 114.5L148 172L100 140L52 172L67.7 114.5L22 79.3L80 76.5Z",
        P.goldLight,
      ) +
      path("M100 22L120 76.5L178 79.3L132.3 114.5L148 172L100 140z", P.gold) +
      path("M100 140L148 172L132.3 114.5z", shade(P.gold, 0.15)) +
      sheen("M72 86l14 0", 5, 0.6),
  ],
  [
    "obj-clock",
    "Clock",
    "Reloj",
    () =>
      shadow(100, 186, 50) +
      stroke("M58 168l-10 14M142 168l10 14", "#3d4652", 6) +
      stroke("M48 54l-10-12M152 54l10-12", "#3d4652", 6) +
      circle(40, 40, 16, P.coral) +
      circle(160, 40, 16, shade(P.coral, 0.15)) +
      circle(100, 106, 70, P.teal) +
      path("M110 37a70 70 0 0 1 0 138a62 62 0 0 0 0-138z", shade(P.teal, 0.2)) +
      circle(100, 106, 56, P.ivory) +
      path("M100 50a56 56 0 0 1 0 112a50 50 0 0 0 0-112z", "#1c2f4a", 'opacity=".06"') +
      stroke(
        "M100 56v10M100 146v10M50 106h10M140 106h10M75 63l4 7M125 63l-4 7M75 149l4-7M125 149l-4-7M57 81l7 4M143 81l-7 4M57 131l7-4M143 131l-7-4",
        P.navy,
        3,
      ) +
      stroke("M100 106V72M100 106l24 14", P.navy, 5) +
      circle(100, 106, 5, P.coral),
  ],
  [
    "obj-question",
    "Question mark",
    "Signo de pregunta",
    () =>
      stroke("M66 72q0-38 36-38t34 36q0 22-22 32q-14 6-14 24v8", shade(P.gold, 0.2), 24) +
      stroke("M64 68q0-38 36-38t34 36q0 22-22 32q-14 6-14 24v8", P.gold, 22) +
      sheen("M74 58q4-14 20-18", 5, 0.6) +
      circle(102, 168, 15, shade(P.gold, 0.2)) +
      circle(100, 166, 15, P.gold),
  ],
  [
    "obj-food-bowl",
    "Bowl of food",
    "Plato de comida",
    () =>
      shadow(100, 176, 56) +
      stroke(
        "M80 54q-8-12 0-24M100 50q-8-12 0-24M120 54q-8-12 0-24",
        "#c9d1d6",
        4,
        'opacity=".8"',
      ) +
      path("M30 96q10-34 70-34t70 34z", "#f6eedd") +
      circle(74, 80, 10, P.grass) +
      circle(122, 76, 9, P.coral) +
      path("M92 84q8-16 22-4z", P.gold) +
      circle(140, 86, 7, P.leaf) +
      circle(56, 90, 6, P.orange) +
      path("M24 96h152q-6 66-76 66T24 96z", P.coral) +
      path("M140 96h36q-6 66-76 66q60-20 40-66z", shade(P.coral, 0.2)) +
      stroke("M44 118q56 20 112 0", P.ivory, 5, 'opacity=".9"') +
      path("M72 162h56l-6 12H78z", shade(P.coral, 0.35)),
  ],
  [
    "obj-house",
    "House",
    "Casa",
    () =>
      shadow(100, 172, 80) +
      rect(128, 36, 20, 40, P.brick) +
      rect(124, 32, 28, 7, shade(P.brick, 0.15)) +
      rect(44, 90, 112, 80, P.wall) +
      rect(120, 90, 36, 80, shade(P.wall, 0.12)) +
      path("M28 98l72-62l72 62z", P.coral) +
      path("M100 36l72 62h-72z", shade(P.coral, 0.18)) +
      rect(44, 98, 112, 4, "#1c2f4a", 'opacity=".1"') +
      rect(86, 118, 30, 52, P.teal) +
      rect(106, 118, 10, 52, shade(P.teal, 0.2)) +
      circle(108, 146, 3, P.goldLight) +
      rect(52, 108, 26, 26, P.ivory) +
      rect(55, 111, 20, 20, "#bfe0ee") +
      rect(124, 108, 26, 26, P.ivory) +
      rect(127, 111, 20, 20, shade("#bfe0ee", 0.08)) +
      stroke("M65 111v20M55 121h20M137 111v20M127 121h20", P.ivory, 2) +
      rect(24, 168, 152, 6, P.grass, 'rx="3"'),
  ],
  [
    "obj-flag",
    "Flag",
    "Bandera",
    () =>
      shadow(50, 182, 22) +
      rect(46, 28, 8, 154, P.woodDark) +
      rect(46, 28, 3, 154, P.wood) +
      circle(50, 26, 7, P.gold) +
      path("M54 40q30-14 60 0t60 0v70q-30 14-60 0t-60 0z", P.tealLight) +
      path("M54 64q30-14 60 0t60 0v22q-30 14-60 0t-60 0z", P.gold) +
      path("M114 40q30 14 60 0v70q-30 14-60 0z", "#1c2f4a", 'opacity=".14"'),
  ],
  [
    "obj-newspaper",
    "Newspaper",
    "Periódico",
    () =>
      shadow(100, 176, 72) +
      path("M158 70h12v90q0 12-12 12", shade("#f1dcae", 0.1)) +
      path("M30 40h128v120q0 12 12 12H42q-12 0-12-12z", P.ivory) +
      path("M136 40h22v120q0 12 12 12h-26z", shade(P.ivory, 0.06)) +
      rrect(44, 52, 100, 14, 2, P.navy) +
      rrect(44, 76, 46, 40, 2, "#bfe0ee") +
      circle(58, 90, 6, P.gold) +
      path("M44 116l16-14l10 8l12-10l8 8v8z", P.grass) +
      stroke(
        "M100 80h44M100 92h44M100 104h44M100 116h30M44 130h100M44 142h100M44 154h70",
        "#b9c2c8",
        3.5,
      ),
  ],
  [
    "obj-key",
    "Key",
    "Llave",
    () =>
      shadow(104, 176, 60) +
      `<g transform="rotate(-35 100 100)">` +
      rect(86, 90, 96, 20, P.gold) +
      rect(86, 102, 96, 8, shade(P.gold, 0.18)) +
      path("M150 110v20h12v-20zM168 110v14h10v-14z", shade(P.gold, 0.1)) +
      circle(58, 100, 36, P.gold) +
      path("M58 64a36 36 0 0 1 0 72a24 24 0 0 0 0-72z", shade(P.gold, 0.2)) +
      circle(58, 100, 14, "#f6eedd") +
      sheen("M34 86q8-12 22-14", 5, 0.7) +
      "</g>",
  ],
  [
    "obj-gift",
    "Gift",
    "Regalo",
    () =>
      shadow(100, 178, 70) +
      rect(36, 90, 128, 86, P.coral) +
      rect(130, 90, 34, 86, shade(P.coral, 0.2)) +
      rrect(28, 66, 144, 28, 4, light(P.coral, 0.1)) +
      rect(28, 88, 144, 6, shade(P.coral, 0.3), 'opacity=".6"') +
      rect(88, 66, 24, 110, P.gold) +
      rect(104, 66, 8, 110, shade(P.gold, 0.18)) +
      path("M100 66q-40-36-50-12q-6 16 50 12z", P.gold) +
      path("M100 66q40-36 50-12q6 16-50 12z", shade(P.gold, 0.12)) +
      circle(100, 64, 7, light(P.gold, 0.2)),
  ],
  [
    "obj-music",
    "Music notes",
    "Notas musicales",
    () =>
      rect(68, 46, 8, 92, P.navy) +
      rect(152, 28, 8, 94, P.navy) +
      path("M68 46l92-20v24l-92 20z", P.navy) +
      path("M68 46l92-20v6l-92 20z", light(P.navy, 0.25)) +
      ellipse(56, 138, 21, 15, P.navy, 'transform="rotate(-20 56 138)"') +
      ellipse(140, 122, 21, 15, P.navy, 'transform="rotate(-20 140 122)"') +
      sheen("M46 132q4-6 10-6M130 116q4-6 10-6", 3.5, 0.6) +
      circle(176, 160, 6, P.gold) +
      circle(30, 70, 5, P.coral) +
      path(burst(176, 70, 9, 3.5, 4), P.tealLight),
  ],
];

/* ---------- nature ---------- */

const NATURE = [
  [
    "nat-tree",
    "Tree",
    "Árbol",
    () =>
      shadow(100, 182, 52) +
      path("M88 182q4-40 0-72h24q-4 32 0 72z", P.bark) +
      path("M100 182q4-40 0-72h12q-4 32 0 72z", P.barkDark) +
      stroke("M98 132l-18-16M104 122l16-14", P.bark, 6) +
      circle(70, 96, 32, shade(P.leaf, 0.15)) +
      circle(130, 96, 32, shade(P.leaf, 0.2)) +
      circle(100, 106, 28, shade(P.leaf, 0.15)) +
      circle(100, 62, 40, shade(P.leaf, 0.12)) +
      circle(66, 90, 26, P.leaf) +
      circle(124, 90, 26, P.leaf) +
      circle(94, 56, 32, P.leaf) +
      ellipse(84, 44, 16, 9, P.leafLight, 'opacity=".7"') +
      ellipse(56, 82, 10, 6, P.leafLight, 'opacity=".6"') +
      circle(76, 88, 5.5, P.red) +
      circle(124, 74, 5.5, P.red) +
      circle(110, 108, 5.5, P.red) +
      circle(74, 86, 1.8, "#ffffff", 'opacity=".6"') +
      circle(122, 72, 1.8, "#ffffff", 'opacity=".6"'),
  ],
  [
    "nat-sun",
    "Sun",
    "Sol",
    () =>
      circle(100, 100, 92, "#fff2c2", 'opacity=".45"') +
      [0, 45, 90, 135, 180, 225, 270, 315]
        .map((a) =>
          path(
            "M100 12l12 26h-24z",
            a < 180 ? P.goldLight : P.gold,
            `transform="rotate(${a} 100 100)"`,
          ),
        )
        .join("") +
      circle(100, 100, 50, P.gold) +
      circle(94, 94, 42, "#f6c04f") +
      circle(86, 84, 18, P.goldLight, 'opacity=".7"'),
  ],
  [
    "nat-cloud",
    "Cloud",
    "Nube",
    () =>
      path(
        "M40 142h120q24 0 24-24t-26-26q-4-34-38-32q-14-24-42-16q-26 8-26 36q-30 2-30 32t18 30z",
        "#bcd3e1",
      ) +
      path(
        "M40 134h116q22 0 22-22t-24-24q-4-32-36-30q-14-22-40-14q-24 8-24 34q-28 2-28 30t14 26z",
        "#e6f0f6",
      ) +
      ellipse(84, 64, 22, 11, "#ffffff") +
      ellipse(128, 70, 16, 8, "#f6fafc"),
  ],
  [
    "nat-rain",
    "Rain",
    "Lluvia",
    () =>
      path(
        "M40 112h120q22 0 22-22t-24-24q-4-30-36-28q-14-22-40-14q-24 8-24 32q-28 2-28 28t10 28z",
        "#aab6c3",
      ) +
      path(
        "M40 104h116q20 0 20-20t-22-22q-4-28-34-26q-14-20-38-12q-22 8-22 30q-26 2-26 26t6 24z",
        "#c9d2dc",
      ) +
      [
        [58, 134],
        [96, 142],
        [134, 134],
        [76, 168],
        [116, 174],
      ]
        .map(
          ([x, y]) =>
            path(`M${x} ${y - 14}q10 14 10 20a10 10 0 0 1-20 0q0-6 10-20z`, P.water) +
            path(`M${x} ${y - 14}q10 14 10 20a10 10 0 0 1-10 10z`, P.waterDark) +
            circle(x - 4, y + 4, 2.2, "#ffffff", 'opacity=".6"'),
        )
        .join(""),
  ],
  [
    "nat-flower",
    "Flower",
    "Flor",
    () =>
      shadow(102, 186, 30) +
      stroke("M100 100q-4 40 2 84", P.leafDark, 6) +
      path("M102 160q30-30 50-20q-20 30-50 20z", P.leaf) +
      path("M100 142q-30-24-50-12q22 26 50 12z", P.leafLight) +
      [0, 60, 120, 180, 240, 300]
        .map((a) =>
          ellipse(
            100,
            58,
            16,
            24,
            a >= 60 && a <= 180 ? shade(P.coral, 0.12) : P.coral,
            `transform="rotate(${a} 100 82)"`,
          ),
        )
        .join("") +
      circle(100, 82, 18, P.gold) +
      circle(96, 78, 8, P.goldLight, 'opacity=".7"') +
      circle(104, 88, 2.5, P.orange) +
      circle(94, 86, 2.5, P.orange),
  ],
  [
    "nat-mountain",
    "Mountain",
    "Montaña",
    () =>
      path("M10 172l56-92l30 46l30-70l64 116z", "#5f8fa0") +
      path("M126 56l64 116h-50l-14-60z", shade("#5f8fa0", 0.2)) +
      path("M66 80l30 46l-14 46H10z", light("#5f8fa0", 0.08)) +
      path("M126 56l16 28l-10 6l-8-8l-8 10l-6-6z", "#ffffff") +
      path("M66 80l14 22l-8 4l-6-6l-6 6l-6-4z", "#f2f6f8") +
      path("M4 172q50-20 96-6t96 6v10H4z", P.grass) +
      path("M4 178q50-12 96-4t96 4v4H4z", P.grassDark),
  ],
  [
    "nat-butterfly",
    "Butterfly",
    "Mariposa",
    () =>
      path("M96 96q-30-60-66-50q-18 6-6 40q10 22 72 14z", P.coral) +
      path("M104 96q30-60 66-50q18 6 6 40q-10 22-72 14z", shade(P.coral, 0.12)) +
      path("M96 104q-50 0-56 30q-4 24 22 26q24-4 34-48z", P.gold) +
      path("M104 104q50 0 56 30q4 24-22 26q-24-4-34-48z", shade(P.gold, 0.12)) +
      circle(58, 74, 9, P.ivory, 'opacity=".85"') +
      circle(142, 74, 9, P.ivory, 'opacity=".85"') +
      circle(66, 136, 6, P.teal) +
      circle(134, 136, 6, P.teal) +
      rrect(92, 64, 16, 96, 8, P.navy) +
      rect(92, 70, 6, 84, light(P.navy, 0.2), 'rx="3"') +
      stroke("M96 66q-8-24-22-30M104 66q8-24 22-30", P.navy, 2.4) +
      circle(73, 35, 4, P.navy) +
      circle(127, 35, 4, P.navy),
  ],
  [
    "nat-leaf",
    "Leaf",
    "Hoja",
    () =>
      path("M40 160q-10-90 70-120q40-14 56-10q4 40-14 80q-30 60-112 50z", P.leafLight) +
      path("M166 30q4 40-14 80q-30 60-112 50q80-30 126-130z", P.leaf) +
      stroke("M24 178l26-26q50-50 100-110", P.leafDark, 4) +
      stroke(
        "M76 128q-6-26 0-46M100 104q20 4 40 0M106 96q-6-26 4-44M124 76q14 4 30 0",
        P.leafDark,
        2.4,
        'opacity=".8"',
      ),
  ],
];

/* ---------- science ---------- */

const SCIENCE = [
  [
    "sci-flask",
    "Flask",
    "Matraz",
    () =>
      shadow(100, 176, 60) +
      path("M80 26h40v50l42 76q8 20-14 20H52q-22 0-14-20l42-76z", "#eaf4f2", 'opacity=".95"') +
      path("M58 118h84l20 34q8 20-14 20H52q-22 0-14-20z", P.tealLight) +
      path("M120 118h22l20 34q8 20-14 20h-24q20-20-4-54z", P.teal) +
      rrect(74, 20, 52, 12, 4, STEEL) +
      circle(84, 146, 7, "#ffffff", 'opacity=".7"') +
      circle(110, 136, 5, "#ffffff", 'opacity=".7"') +
      circle(98, 100, 5, light(P.tealLight, 0.4)) +
      circle(106, 80, 3.5, light(P.tealLight, 0.4)) +
      sheen("M92 40v30", 4, 0.8),
  ],
  [
    "sci-plant",
    "Seedling",
    "Plántula",
    () =>
      shadow(100, 180, 52) +
      stroke("M100 122V70", P.leafDark, 6) +
      path("M100 84q-6-36-46-34q4 34 46 34z", P.leafLight) +
      path("M100 72q8-36 50-34q-4 36-50 34z", P.leaf) +
      stroke("M100 84q-24-6-36-24M100 72q24-6 38-24", P.leafDark, 1.8, 'opacity=".7"') +
      path("M50 118h100l-12 60H62z", P.coral) +
      path("M124 118h26l-12 60h-22z", shade(P.coral, 0.2)) +
      rrect(44, 110, 112, 18, 4, light(P.coral, 0.12)) +
      path("M58 112q42-10 84 0z", P.soilDark),
  ],
  [
    "sci-magnet",
    "Magnet",
    "Imán",
    () =>
      path("M36 76q0-56 64-56t64 56v60h-34V78q0-24-30-24T70 78v58H36z", P.coral) +
      path("M124 28q40 14 40 48v60h-14V80q0-40-26-52z", shade(P.coral, 0.2)) +
      sheen("M48 70q4-30 32-40", 5, 0.45) +
      rect(36, 136, 34, 30, STEEL) +
      rect(130, 136, 34, 30, STEEL) +
      rect(56, 136, 14, 30, shade(STEEL, 0.15)) +
      rect(150, 136, 14, 30, shade(STEEL, 0.15)) +
      stroke(
        "M53 176q0 20 47 20t47-20M30 172q-14 10-14 22M170 172q14 10 14 22",
        P.tealLight,
        3,
        'stroke-dasharray="6 7"',
      ),
  ],
  [
    "sci-thermometer",
    "Thermometer",
    "Termómetro",
    () =>
      path("M84 140V36a16 16 0 0 1 32 0v104a28 28 0 1 1-32 0z", "#f6f3ec") +
      path(
        "M108 22a16 16 0 0 1 8 14v104a28 28 0 0 1-12 46q16-14 10-40V40q0-12-6-18z",
        shade("#f6f3ec", 0.1),
      ) +
      rect(93, 80, 14, 70, P.coral) +
      circle(100, 162, 18, P.coral) +
      circle(105, 166, 10, shade(P.coral, 0.15)) +
      stroke("M122 50h14M122 70h10M122 90h14M122 110h10M122 130h14", P.navy, 3) +
      sheen("M92 156q2-6 8-8", 4, 0.8) +
      sheen("M90 40v70", 3, 0.6),
  ],
  [
    "sci-rocket",
    "Rocket",
    "Cohete",
    () =>
      `<g transform="rotate(30 100 100) translate(0 -8)">` +
      path("M82 148q18 52 18 52t18-52z", P.gold) +
      path("M91 150q9 30 9 30t9-30z", P.coral) +
      path("M74 118l-22 30l26-6z", P.coral) +
      path("M126 118l22 30l-26-6z", shade(P.coral, 0.2)) +
      path("M100 14q34 30 30 104l-8 34H78l-8-34q-4-74 30-104z", "#f6f3ec") +
      path("M100 14q34 30 30 104l-8 34h-12q22-60-10-138z", shade("#f6f3ec", 0.12)) +
      path("M100 14q20 18 26 42H74q6-24 26-42z", P.coral) +
      path("M100 14q20 18 26 42h-14q-2-24-12-42z", shade(P.coral, 0.2)) +
      circle(100, 88, 16, P.navy) +
      circle(100, 88, 11, P.tealLight) +
      sheen("M94 82q4-5 10-4", 3, 0.8) +
      "</g>",
  ],
  [
    "sci-microscope",
    "Microscope",
    "Microscopio",
    () =>
      shadow(100, 186, 66) +
      rrect(40, 166, 120, 18, 6, P.navy) +
      rect(40, 166, 120, 5, light(P.navy, 0.2), 'rx="3"') +
      stroke("M140 166v-54q0-36-40-48", P.navy, 14) +
      stroke("M146 160v-48q0-32-34-46", shade(P.navy, 0.2), 4) +
      rrect(56, 118, 84, 9, 3, STEEL) +
      rrect(80, 113, 30, 5, 2, GLASS) +
      rect(95, 127, 6, 39, shade(STEEL, 0.2)) +
      rrect(91, 98, 10, 14, 2, STEEL, 'transform="rotate(-20 96 105)"') +
      rrect(70, 36, 28, 70, 6, P.tealLight, 'transform="rotate(-20 84 71)"') +
      rect(88, 38, 10, 66, P.teal, 'transform="rotate(-20 84 71)"') +
      rrect(62, 24, 26, 16, 4, P.navy, 'transform="rotate(-20 84 71)"') +
      circle(140, 120, 9, P.gold),
  ],
  [
    "sci-earth",
    "Planet Earth",
    "Planeta Tierra",
    () =>
      circle(100, 100, 72, P.water) +
      path(
        "M56 50q26-8 34 10q-12 16 6 28q-6 20-28 16q-16-20-36-10q0-26 24-44zM118 36q30 4 42 28q-18-2-22 14q-18 6-24-8q14-14 4-34zM126 104q22-8 38 6q-8 30-34 40q-6-22-4-46zM62 130q16 0 22 14q-8 10-20 6q-8-8-2-20z",
        P.grass,
      ) +
      path("M114 30a72 72 0 0 1 0 140q44-70 0-140z", "#1c2f4a", 'opacity=".18"') +
      stroke("M44 124q24 8 30 0M120 160q16-4 24-12", "#ffffff", 5, 'opacity=".6"') +
      sheen("M52 66q10-24 34-34", 6, 0.45),
  ],
  [
    "sci-battery",
    "Battery",
    "Batería",
    () =>
      shadow(96, 158, 74) +
      rrect(160, 78, 16, 44, 4, STEEL) +
      rrect(22, 56, 140, 88, 14, "#f6f3ec") +
      path("M128 56h20q14 0 14 14v60q0 14-14 14h-20z", shade("#f6f3ec", 0.1)) +
      rrect(34, 68, 80, 64, 6, P.grass) +
      rect(34, 68, 80, 8, light(P.grass, 0.2), 'rx="4"') +
      path("M86 64l-20 40h18l-10 34l32-46h-18l10-28z", P.gold),
  ],
];

/* ---------- comic effects ---------- */

const COMIC = [
  [
    "fx-pow",
    "Pow burst",
    "Estallido",
    () =>
      path(burst(100, 100, 92, 58, 12, -80), P.coral) +
      path(burst(104, 104, 92, 58, 12, -80), shade(P.coral, 0.2), 'opacity=".35"') +
      path(burst(100, 100, 60, 38, 10, -70), P.gold) +
      circle(100, 100, 22, P.ivory),
  ],
  [
    "fx-zoom",
    "Zoom lines",
    "Líneas de velocidad",
    () =>
      stroke("M20 70h90M10 100h120M30 130h80", P.tealLight, 7) +
      circle(154, 100, 30, P.gold) +
      path("M164 72a30 30 0 0 1 0 56q16-28 0-56z", shade(P.gold, 0.2)) +
      sheen("M142 88q6-8 14-8", 5, 0.8) +
      circle(22, 160, 8, P.ivory) +
      circle(44, 166, 6, P.ivory) +
      circle(12, 40, 5, P.ivory),
  ],
  [
    "fx-idea",
    "Idea!",
    "¡Idea!",
    () =>
      [-60, -30, 0, 30, 60]
        .map((a) => stroke("M100 34V14", P.gold, 6, `transform="rotate(${a} 100 100)"`))
        .join("") +
      path("M100 54a38 38 0 0 0-24 68q6 6 6 18h36q0-12 6-18a38 38 0 0 0-24-68z", P.goldLight) +
      path("M108 55a38 38 0 0 1 16 67q-6 6-6 18h-10q0-14 6-22q18-24-6-63z", P.gold) +
      rrect(82, 140, 36, 12, 4, STEEL) +
      rrect(86, 152, 28, 10, 4, shade(STEEL, 0.12)) +
      sheen("M86 80q6-12 18-14", 5, 0.8),
  ],
  [
    "fx-question-burst",
    "Question burst",
    "Estallido de pregunta",
    () =>
      path(burst(100, 100, 90, 64, 14, -90), P.tealLight) +
      path(burst(100, 100, 70, 52, 14, -90), P.teal, 'opacity=".35"') +
      stroke("M78 78q0-24 24-24t22 22q0 14-14 20q-10 4-10 16v4", P.ivory, 13) +
      circle(100, 138, 9, P.ivory),
  ],
  [
    "fx-sparkles",
    "Sparkles",
    "Destellos",
    () =>
      path("M96 30q6 48 50 54q-44 6-50 54q-6-48-50-54q44-6 50-54z", P.gold) +
      path("M96 30q6 48 50 54h-50z", P.goldLight) +
      path("M150 110q4 26 26 30q-22 4-26 30q-4-26-26-30q22-4 26-30z", P.coral) +
      path("M150 110q4 26 26 30h-26z", P.coralLight) +
      path("M46 130q3 18 18 20q-15 3-18 20q-3-17-18-20q15-2 18-20z", P.tealLight) +
      circle(160, 46, 5, P.gold) +
      circle(36, 60, 4, P.coral),
  ],
  [
    "fx-arrow-curve",
    "Curved arrow",
    "Flecha curva",
    () =>
      stroke("M32 164q0-110 106-110", shade(P.coral, 0.2), 15) +
      stroke("M30 160q0-110 106-110", P.coral, 14) +
      path("M126 22l52 28l-52 30z", P.coral) +
      path("M126 50h52l-52 30z", shade(P.coral, 0.2)),
  ],
];

const entries = (cat, list, wrap = (s) => s) =>
  list.map(([key, en, es, svg]) => ({
    key,
    cat,
    en,
    es,
    svg: wrap(typeof svg === "function" ? svg() : svg),
  }));

export const ART = Object.freeze(
  noDefs(() => [
    ...entries("character", bookPeople()),
    ...entries("background", bookScenes()),
    ...entries("object", OBJECTS, sq),
    ...entries("nature", NATURE, sq),
    ...entries("science", SCIENCE, sq),
    ...entries("comic", COMIC, sq),
  ]),
);

export const ART_CATS = Object.freeze([
  { id: "character", en: "Characters", es: "Personajes" },
  { id: "background", en: "Backgrounds", es: "Fondos" },
  { id: "object", en: "Objects", es: "Objetos" },
  { id: "nature", en: "Nature", es: "Naturaleza" },
  { id: "science", en: "Science", es: "Ciencia" },
  { id: "comic", en: "Comic effects", es: "Efectos de cómic" },
]);
