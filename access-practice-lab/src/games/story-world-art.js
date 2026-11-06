// Interactive Story World scene art: one original 480x270 vector scene per story. Each scene draws the
// objects its hotspots sit on (hotspot x/y in the content are percentages of this viewBox), so the learner
// taps a real thing in the picture. Same palette and house styles as art.js; no violet, purple or magenta.
import { C, cloud, hill, sky, star, stroke, svg, tree } from "./art.js";

const kid = (x, y, shirt, hair, b, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-9" y="-2" width="18" height="26" rx="7" fill="${shirt}" ${stroke(b, 2.2)}/><path d="M-6 24v14M6 24v14" stroke="${C.navy}" stroke-width="5" stroke-linecap="round"/><circle cy="-12" r="10" fill="${C.sand}" ${stroke(b, 2.2)}/><path d="M-10 -14q10 -12 20 0q-4 -6 -10 -6t-10 6Z" fill="${hair}"/><circle cx="-3" cy="-11" r="1.4" fill="${C.navy}"/><circle cx="3" cy="-11" r="1.4" fill="${C.navy}"/></g>`;
const pot = (x, y, b, sprout = 0) =>
  `<g transform="translate(${x} ${y})"><path d="M-18 0h36l-5 26h-26Z" fill="${C.coralDk}" ${stroke(b, 2.4)}/><rect x="-21" y="-6" width="42" height="9" rx="3" fill="${C.coral}" ${stroke(b, 2.4)}/>${sprout ? `<path d="M0 -6v-${14 * sprout}" stroke="${C.leafDk}" stroke-width="3" stroke-linecap="round"/><path d="M0 -${8 * sprout}q-12 -2 -13 -12q11 1 13 12ZM0 -${12 * sprout}q12 -3 13 -13q-11 2 -13 13Z" fill="${C.leaf}" ${stroke(b, 1.8)}/>` : ""}</g>`;
const rain = (x, y, n) =>
  Array.from(
    { length: n },
    (_, i) =>
      `<path d="M${x + i * 14} ${y + (i % 2) * 6}l-4 12" stroke="${C.sky}" stroke-width="3" stroke-linecap="round"/>`,
  ).join("");
const house = (x, y, w, h, wall, roof, b) =>
  `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" fill="${wall}" ${stroke(b, 2.4)}/><path d="M-6 2L${w / 2} -${h * 0.4}L${w + 6} 2Z" fill="${roof}" ${stroke(b, 2.4)}/></g>`;

const SCENES = {
  // The Kite in the Tree: kite flying, tall tree, brother with stick, picnic bench.
  park: (
    b,
  ) => `${sky("swp", "#cfeefa", "#fdf3da")}${cloud(230, 40, 1)}${cloud(420, 30, 0.7, 0.8)}${hill(170, C.leafLt, 22)}${hill(200, C.leaf, 16, 6)}
    <path d="M120 59Q150 130 108 186" fill="none" stroke="${C.navy}" stroke-width="1.6" stroke-dasharray="3 3"/>
    <g transform="translate(120 59) rotate(-12)"><path d="M0 -26L18 0L0 26L-18 0Z" fill="${C.coral}" ${stroke(b, 2.4)}/><path d="M0 -26V26M-18 0H18" stroke="${C.coralDk}" stroke-width="2"/><path d="M0 26q-6 10 4 16q-8 6 0 12" fill="none" stroke="${C.gold}" stroke-width="3"/></g>
    ${kid(104, 190, C.teal, C.woodDk, b)}
    ${tree(360, 150, 1.9, C.leaf, C.leafDk, b)}<path d="M346 104l10 -6l6 10" fill="none" stroke="${C.coral}" stroke-width="3"/>
    <g transform="translate(250 189)">${kid(0, 0, C.gold, C.navy, b)}<path d="M8 4L46 -58" stroke="${C.woodDk}" stroke-width="5" stroke-linecap="round"/></g>
    <g transform="translate(67 216)"><rect x="-36" y="-14" width="72" height="9" rx="3" fill="${C.wood}" ${stroke(b, 2.2)}/><rect x="-36" y="-2" width="72" height="8" rx="3" fill="${C.wood}" ${stroke(b, 2.2)}/><path d="M-28 6v16M28 6v16" stroke="${C.woodDk}" stroke-width="5"/><circle cx="-8" cy="-20" r="6" fill="${C.coral}" ${stroke(b, 1.8)}/><rect x="6" y="-26" width="16" height="12" rx="3" fill="${C.gold}" ${stroke(b, 1.8)}/></g>
    <path d="M300 60q20 -6 40 0M310 74q16 -5 30 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>`,
  // Leo's Bean Plants: sunny window with watering can, sprouting pot, seed packet, garden door.
  sill: (
    b,
  ) => `<rect width="480" height="270" fill="#fbf1dc"/><rect y="196" width="480" height="74" fill="${C.wood}"/><path d="M0 196H480" stroke="${C.woodDk}" stroke-width="4"/>
    <g transform="translate(60 26)"><rect width="110" height="110" rx="6" fill="${C.skyLt}" ${stroke(b, 3)}/><circle cx="76" cy="34" r="16" fill="${C.gold}"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M76 34l${Math.cos(i) * 26} ${Math.sin(i) * 26}" stroke="${C.gold}" stroke-width="3"/>`).join("")}<path d="M55 0V110M0 55H110" stroke="#fff" stroke-width="6"/><rect x="-8" y="108" width="126" height="10" rx="3" fill="#fff" ${stroke(b, 2)}/></g>
    <g transform="translate(150 132)"><path d="M0 0h34v26h-34Z" fill="${C.teal}" ${stroke(b, 2.4)}/><path d="M34 6l22 -12" stroke="${C.teal}" stroke-width="5" stroke-linecap="round"/><path d="M0 4q-12 4 -2 16" fill="none" stroke="${C.tealDk}" stroke-width="4"/>${rain(56, -4, 2)}</g>
    <path d="M60 140l130 0l70 40" fill="none" stroke="${C.gold}" stroke-width="8" opacity=".25"/>
    ${pot(240, 172, b, 1.4)}
    <g transform="translate(374 200) rotate(-8)"><rect x="-22" y="-26" width="44" height="50" rx="4" fill="#fff" ${stroke(b, 2.4)}/><ellipse cy="-6" rx="10" ry="7" fill="${C.woodDk}"/><path d="M-14 12h28M-14 18h18" stroke="${C.navy}" stroke-opacity=".45" stroke-width="3"/></g>
    ${pot(326, 196, b, 0)}
    <g transform="translate(398 22)"><rect width="56" height="174" rx="4" fill="${C.leafLt}" ${stroke(b, 3)}/><rect x="8" y="10" width="40" height="70" rx="3" fill="${C.skyLt}"/>${tree(28, 76, 0.5, C.leaf, C.leafDk, b)}<circle cx="46" cy="104" r="4" fill="${C.goldDk}"/></g>`,
  // Where Is the Library Book?: backpack, bed, dog with book, window to the library.
  bedroom: (
    b,
  ) => `<rect width="480" height="270" fill="#e9f3f2"/><rect y="186" width="480" height="84" fill="#d8c3a0"/><path d="M0 186H480" stroke="${C.woodDk}" stroke-width="3"/>
    <g transform="translate(118 18)"><rect width="112" height="92" rx="6" fill="${C.skyLt}" ${stroke(b, 3)}/>${house(26, 44, 60, 40, C.sand, C.coralDk, b)}<rect x="48" y="62" width="16" height="22" fill="${C.woodDk}"/><text x="56" y="58" text-anchor="middle" font-size="9" font-weight="800" fill="${C.navy}">LIBRARY</text><path d="M56 0V92M0 46H26" stroke="#fff" stroke-width="5"/></g>
    <g transform="translate(82 200)"><rect x="-26" y="-34" width="52" height="56" rx="12" fill="${C.teal}" ${stroke(b, 2.6)}/><path d="M-26 -14h52" stroke="${C.tealDk}" stroke-width="3"/><path d="M-16 -34q16 -20 32 0" fill="none" stroke="${C.navy}" stroke-width="4"/><rect x="-10" y="-2" width="20" height="14" rx="3" fill="${C.tealLt}"/></g>
    <g transform="translate(288 200)"><rect x="-80" y="-30" width="160" height="34" rx="8" fill="${C.coral}" ${stroke(b, 2.6)}/><rect x="-80" y="-42" width="44" height="18" rx="8" fill="#fff" ${stroke(b, 2.2)}/><rect x="-86" y="-60" width="10" height="80" rx="4" fill="${C.wood}" ${stroke(b, 2.2)}/><path d="M-70 4v14M70 4v14" stroke="${C.woodDk}" stroke-width="6"/><path d="M-60 12q60 10 120 0" stroke="${C.navy}" stroke-opacity=".3" stroke-width="3" fill="none"/></g>
    <g transform="translate(424 70)"><rect x="-30" width="58" height="116" rx="4" fill="${C.wood}" ${stroke(b, 3)}/><circle cx="18" cy="60" r="4" fill="${C.gold}"/></g>
    <g transform="translate(410 172)"><ellipse rx="26" ry="14" fill="${C.goldDk}" ${stroke(b, 2.4)}/><circle cx="-22" cy="-12" r="12" fill="${C.goldDk}" ${stroke(b, 2.4)}/><path d="M-30 -20q-6 8 -2 14" fill="${C.woodDk}"/><rect x="-44" y="-10" width="18" height="12" rx="2" fill="${C.coral}" ${stroke(b, 1.8)}/><circle cx="-24" cy="-14" r="2" fill="${C.navy}"/><path d="M-14 12v12M14 12v12" stroke="${C.goldDk}" stroke-width="6" stroke-linecap="round"/><path d="M26 -4q12 -10 8 -18" fill="none" stroke="${C.goldDk}" stroke-width="5" stroke-linecap="round"/></g>
    ${kid(196, 200, C.coral, C.navy, b, 1.1)}`,
  // Rain Barrels for the Garden: tomato rows, blazing sun, storm cloud, shed with barrels, tomato basket.
  garden: (
    b,
  ) => `${sky("swg", "#d9eef7", "#fbeccb")}<path d="M0 170H480V270H0Z" fill="#c9a676"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${30 + i * 70} ${190 + (i % 2) * 20}l12 10l-6 14" fill="none" stroke="${C.woodDk}" stroke-width="2" opacity=".6"/>`).join("")}
    <g transform="translate(398 51)"><circle r="22" fill="${C.gold}"/>${Array.from({ length: 8 }, (_, i) => `<path d="M0 -30v-10" stroke="${C.goldDk}" stroke-width="4" stroke-linecap="round" transform="rotate(${i * 45})"/>`).join("")}</g>
    <g transform="translate(178 51)">${cloud(0, 0, 1.4, 1).replace(/#fff/g, C.stone)}${rain(-26, 14, 5)}</g>
    <g transform="translate(300 116)"><rect width="76" height="60" fill="${C.sand}" ${stroke(b, 2.6)}/><path d="M-10 4L38 -24L86 4Z" fill="${C.stoneDk}" ${stroke(b, 2.6)}/><path d="M80 4v34" stroke="${C.stoneDk}" stroke-width="4"/>${[0, 1].map((i) => `<g transform="translate(${i * 26 + 18} 34)"><rect x="-11" width="22" height="28" rx="4" fill="${C.teal}" ${stroke(b, 2.2)}/><path d="M-11 8h22M-11 18h22" stroke="${C.tealDk}" stroke-width="2"/></g>`).join("")}<rect x="24" y="30" width="28" height="12" rx="2" fill="${C.woodDk}"/></g>
    ${[60, 100, 140].map((x) => `<g transform="translate(${x} 214)"><path d="M0 0v-30" stroke="${C.leafDk}" stroke-width="3"/><path d="M0 -14q-12 -4 -14 -14q12 2 14 14ZM0 -22q12 -4 14 -14q-12 2 -14 14Z" fill="${C.leaf}"/><circle cx="-6" cy="-6" r="5" fill="${C.coral}" ${stroke(b, 1.6)}/><circle cx="7" cy="-10" r="4.5" fill="${C.coralDk}"/></g>`).join("")}
    <g transform="translate(240 222)"><path d="M-30 -8h60l-8 24h-44Z" fill="${C.wood}" ${stroke(b, 2.4)}/><path d="M-22 -8q22 -30 44 0" fill="none" stroke="${C.woodDk}" stroke-width="4"/>${[-14, 0, 14, -7, 7].map((x, i) => `<circle cx="${x}" cy="${i < 3 ? -10 : -18}" r="7" fill="${C.coral}" ${stroke(b, 1.6)}/>`).join("")}</g>`,
  // Bring Back the Bus Stop: closed stop, road without sidewalk, newspaper, city hall, petition clipboard.
  street: (
    b,
  ) => `${sky("sws", "#d6ecf8", "#f4f1e6")}${cloud(240, 34, 0.9)}${hill(150, C.leafLt, 10)}
    <path d="M0 196Q240 180 480 200V246Q240 228 0 244Z" fill="#5d6f82"/><path d="M0 220Q240 204 480 224" stroke="#fff" stroke-width="3" stroke-dasharray="14 12"/>
    ${kid(232, 206, C.coral, C.navy, b, 0.8)}${kid(262, 204, C.teal, C.woodDk, b, 0.8)}
    <g transform="translate(58 151)"><path d="M0 -40V40" stroke="${C.stoneDk}" stroke-width="5"/><rect x="-22" y="-56" width="44" height="30" rx="5" fill="${C.teal}" ${stroke(b, 2.4)}/><text y="-36" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">BUS</text><path d="M-26 -60l52 38M26 -60l-52 38" stroke="${C.coralDk}" stroke-width="5" stroke-linecap="round"/></g>
    <g transform="translate(158 81) rotate(-6)"><rect x="-30" y="-22" width="60" height="44" rx="3" fill="#fff" ${stroke(b, 2.4)}/><rect x="-24" y="-16" width="22" height="16" fill="${C.stone}"/><path d="M2 -14h22M2 -8h22M2 -2h18M-24 6h48M-24 12h40" stroke="${C.navy}" stroke-opacity=".5" stroke-width="2.4"/></g>
    <g transform="translate(365 40)"><rect x="-46" y="10" width="92" height="56" fill="${C.sand}" ${stroke(b, 2.6)}/><path d="M-54 12L0 -18L54 12Z" fill="${C.stone}" ${stroke(b, 2.6)}/>${[-30, -10, 10, 30].map((x) => `<rect x="${x - 4}" y="22" width="8" height="40" fill="#fff" ${stroke(b, 1.6)}/>`).join("")}<path d="M0 -18v-14l14 5l-14 5" fill="${C.coral}"/></g>
    <g transform="translate(403 184)"><rect x="-20" y="-26" width="40" height="52" rx="4" fill="${C.wood}" ${stroke(b, 2.4)}/><rect x="-15" y="-18" width="30" height="40" fill="#fff"/><rect x="-8" y="-30" width="16" height="8" rx="2" fill="${C.stoneDk}"/>${[-10, -4, 2, 8, 14].map((y) => `<path d="M-11 ${y}h22" stroke="${C.navy}" stroke-opacity=".45" stroke-width="2"/>`).join("")}</g>`,
  // Bread on Elm Street: icy power lines, broken branch, sold-out sign, pizza oven, neighbors in line.
  elm: (
    b,
  ) => `${sky("swe", "#bcd3e6", "#eef3f7")}${[30, 120, 210, 330, 440].map((x, i) => star(x, 20 + (i % 2) * 14, 3, "#fff")).join("")}
    <path d="M0 38Q120 54 240 38T480 38" fill="none" stroke="${C.navy}" stroke-width="3"/><path d="M0 50Q120 66 240 50T480 50" fill="none" stroke="${C.navy}" stroke-width="3"/>${[60, 150, 240, 330, 420].map((x) => `<path d="M${x} ${44}l-3 9l6 0Z" fill="#e6f6ff" stroke="${C.sky}" stroke-width="1.4"/>`).join("")}
    <g transform="translate(70 40)"><path d="M0 0V180" stroke="${C.woodDk}" stroke-width="10"/><path d="M0 30Q30 40 56 54" stroke="${C.woodDk}" stroke-width="7" stroke-linecap="round"/><path d="M56 54l-6 -16M56 54l14 4" stroke="#e6f6ff" stroke-width="3" stroke-linecap="round"/></g>
    ${house(220, 96, 110, 100, C.sand, C.coralDk, b)}<rect x="236" y="140" width="34" height="56" fill="${C.woodDk}"/><rect x="276" y="104" width="38" height="20" rx="3" fill="#fff" ${stroke(b, 2)}/><text x="295" y="118" text-anchor="middle" font-size="8" font-weight="800" fill="${C.coralDk}">SOLD OUT</text><text x="275" y="92" text-anchor="middle" font-size="10" font-weight="800" fill="${C.navy}">BAKERY</text>
    ${house(350, 110, 100, 86, "#f7dcc7", C.stoneDk, b)}<g transform="translate(384 167)"><path d="M-26 22V0a26 26 0 0 1 52 0V22Z" fill="${C.stone}" ${stroke(b, 2.4)}/><path d="M-12 22V8a12 12 0 0 1 24 0V22Z" fill="${C.night}"/><path d="M-6 20q6 -14 12 0" fill="${C.coral}"/><path d="M-2 20q2 -8 4 0" fill="${C.gold}"/></g>
    <rect y="196" width="480" height="74" fill="#dfe6ec"/>${kid(160, 220, C.teal, C.navy, b, 0.8)}${kid(186, 222, C.gold, C.woodDk, b, 0.8)}${kid(212, 220, C.coral, C.navy, b, 0.8)}`,
};

export function storyScene(key, band, label) {
  const draw = SCENES[key] || SCENES.park;
  return svg("0 0 480 270", draw(band), { label, cls: "sw-scene-art" });
}
export const SCENE_KEYS = Object.keys(SCENES);
