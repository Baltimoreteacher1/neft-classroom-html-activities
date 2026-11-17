// Original scenes for the story worlds and conversation worlds on the Games & Worlds arcade, so a world
// card never repeats a quick-game picture. Same palette and band house styles as src/games/art.js.
import { C, cloud, hill, sky, star, stroke, svg, tree } from "../games/art.js";

const bubble = (x, y, w, h, fill, b, tail = "l") =>
  `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="16" fill="${fill}" ${stroke(b, 3)}/><path d="${tail === "l" ? `M24 ${h - 2}l-10 22l30 -22` : `M${w - 24} ${h - 2}l10 22l-30 -22`}" fill="${fill}" ${stroke(b, 3)}/><rect x="${w - (w - 18)}" y="${h - 3}" width="${w - 36}" height="6" fill="${fill}"/>${[0, 1].map((i) => `<rect x="18" y="${18 + i * 18}" width="${(w - 36) * (i ? 0.6 : 1)}" height="8" rx="4" fill="${C.navy}" opacity=".35"/>`).join("")}</g>`;

const house = (x, y, w, h, wall, roof, b) =>
  `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" fill="${wall}" ${stroke(b, 2.6)}/><path d="M-8 0L${w / 2} ${-h * 0.45}L${w + 8} 0Z" fill="${roof}" ${stroke(b, 2.6)}/><rect x="${w / 2 - 9}" y="${h - 26}" width="18" height="26" fill="${C.woodDk}"/>${[0, 1].map((i) => `<rect x="${8 + i * (w - 30)}" y="12" width="14" height="14" fill="${C.gold}"/>`).join("")}</g>`;

export const WORLD_SCENES = {
  // Adventure Worlds: a museum hall with a missing compass on a pedestal
  museum: (b) =>
    `<rect width="480" height="270" fill="#f3e6c8"/><path d="M60 92L240 30L420 92Z" fill="${C.sand}" ${stroke(b, 3)}/><rect x="70" y="92" width="340" height="16" fill="${C.paper}" ${stroke(b, 3)}/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${86 + i * 70}" y="108" width="22" height="120" fill="${C.paper}" ${stroke(b, 2.6)}/>`).join("")}<rect x="40" y="228" width="400" height="42" fill="${C.wood}" ${stroke(b, 3)}/><g transform="translate(240 196)"><rect x="-34" y="0" width="68" height="34" fill="${C.stone}" ${stroke(b, 3)}/><rect x="-44" y="-56" width="88" height="56" rx="6" fill="${C.skyLt}" opacity=".85" ${stroke(b, 3)}/><circle cx="0" cy="-28" r="16" fill="none" stroke="${C.coral}" stroke-width="4" stroke-dasharray="6 5"/><text x="0" y="-21" text-anchor="middle" font-size="22" font-weight="800" fill="${C.coralDk}" font-family="system-ui">?</text></g><g transform="translate(360 150) rotate(-20)"><circle r="20" fill="none" stroke="${C.navy}" stroke-width="6"/><rect x="12" y="12" width="30" height="9" rx="4" transform="rotate(45 12 12)" fill="${C.navy}"/></g>`,
  // Language Games: a locked door with glowing clue cards
  vault: (b) =>
    `<rect width="480" height="270" fill="#1b2f48"/>${[60, 150, 330, 420].map((x, i) => star(x, 30 + (i % 2) * 20, 4, C.gold)).join("")}<rect x="170" y="44" width="140" height="196" rx="70" fill="#2c4d6f" ${stroke(b, 3)}/><circle cx="240" cy="142" r="44" fill="${C.stoneDk}" ${stroke(b, 3)}/><circle cx="240" cy="142" r="28" fill="${C.stone}"/>${[0, 60, 120, 180, 240, 300].map((a) => `<rect x="237" y="100" width="6" height="14" fill="${C.gold}" transform="rotate(${a} 240 142)"/>`).join("")}${[
      [70, 90, C.teal, "A"],
      [70, 170, C.coral, "B"],
      [370, 90, C.gold, "C"],
      [370, 170, C.leaf, "D"],
    ]
      .map(
        ([x, y, f, t]) =>
          `<g transform="translate(${x} ${y})"><rect width="44" height="52" rx="8" fill="${f}" ${stroke(b, 2.6)}/><text x="22" y="34" text-anchor="middle" font-size="22" font-weight="800" fill="#fff" font-family="system-ui">${t}</text></g>`,
      )
      .join("")}`,
  // Language Quest: a glowing portal between two worlds
  portal: (b) =>
    `${sky("pq", "#16314a", "#2f6f8f")}${star(70, 40, 4, "#fff")}${star(410, 60, 5, "#fff")}${star(300, 30, 3, "#fff")}${hill(210, "#2b7447", 22)}<ellipse cx="240" cy="140" rx="80" ry="100" fill="${C.gold}" opacity=".25"/><ellipse cx="240" cy="140" rx="62" ry="84" fill="${C.tealLt}" ${stroke(b, 4)}/><ellipse cx="240" cy="140" rx="40" ry="58" fill="${C.teal}" opacity=".6"/>${[0, 1, 2].map((i) => `<path d="M${200 + i * 30} ${100 + i * 20}q10 -10 20 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`).join("")}${tree(90, 200, 1, C.leaf, C.leafDk, b)}${tree(390, 205, 0.9, C.leaf, C.leafDk, b)}`,
  // Signal Quest: an island with a radio tower
  island: (b) =>
    `${sky("si", C.skyLt, "#fdf3da")}${cloud(90, 50, 1)}${cloud(380, 40, 0.8)}<rect y="190" width="480" height="80" fill="#7cc3e6"/><path d="M110 200Q240 120 370 200Z" fill="${C.sand}" ${stroke(b, 3)}/><path d="M150 196Q240 140 330 196Z" fill="${C.leafLt}"/><g transform="translate(240 168)"><path d="M-18 0L0 -110L18 0Z" fill="none" stroke="${C.navy}" stroke-width="4"/><path d="M-12 -30H12M-8 -60H8" stroke="${C.navy}" stroke-width="3"/><circle cy="-114" r="7" fill="${C.coral}"/>${[22, 36, 50].map((r) => `<path d="M${r} -128a${r} ${r} 0 0 0 0 -${r * 0.0001 + 1}" fill="none"/><path d="M${-r * 0.7} ${-114 - r * 0.7}a${r} ${r} 0 0 1 ${r * 1.4} 0" fill="none" stroke="${C.gold}" stroke-width="4" stroke-linecap="round"/>`).join("")}</g>${tree(150, 186, 0.6, C.leaf, C.leafDk, b)}`,
  // Language Adventures: a winding path through story worlds
  path: (b) =>
    `${sky("sp", "#e6f6f4", "#fff3d6")}${cloud(400, 48, 0.9)}${hill(150, "#a8dca8", 26)}${hill(190, C.leafLt, 18, 6)}<path d="M40 270C120 210 80 180 200 170S340 150 300 110S380 70 440 60" fill="none" stroke="${C.sand}" stroke-width="22" stroke-linecap="round"/><path d="M40 270C120 210 80 180 200 170S340 150 300 110S380 70 440 60" fill="none" stroke="${C.goldDk}" stroke-width="3" stroke-dasharray="8 10"/>${[
      [200, 170],
      [300, 110],
      [440, 60],
    ]
      .map(
        ([x, y], i) =>
          `<g transform="translate(${x} ${y - 20})"><path d="M0 0v20" stroke="${C.navy}" stroke-width="3"/><path d="M0 0h22l-6 7l6 7h-22Z" fill="${[C.coral, C.teal, C.gold][i]}" ${stroke(b, 2)}/></g>`,
      )
      .join("")}`,
  // Reality Engine: characters talking in a story frame
  stage: (b) =>
    `${sky("sr2", "#fdf3da", "#e6f6f4")}<rect x="30" y="30" width="420" height="210" rx="18" fill="none" stroke="${C.navy}" stroke-width="3" stroke-dasharray="10 8"/>${hill(215, C.leafLt, 10)}<g transform="translate(150 190)"><circle r="26" cy="-60" fill="${C.wood}" ${stroke(b, 3)}/><rect x="-26" y="-34" width="52" height="60" rx="18" fill="${C.teal}" ${stroke(b, 3)}/></g><g transform="translate(330 190)"><circle r="26" cy="-60" fill="#f1c7a5" ${stroke(b, 3)}/><rect x="-26" y="-34" width="52" height="60" rx="18" fill="${C.coral}" ${stroke(b, 3)}/></g>${bubble(60, 40, 130, 62, "#fff", b, "r")}${bubble(290, 40, 130, 62, C.tealLt, b, "l")}`,
  // Language City: a street of buildings
  city: (b) =>
    `${sky("sc2", C.skyLt, "#fdf3da")}${cloud(380, 44, 0.9)}<rect y="222" width="480" height="48" fill="#51647a"/><path d="M0 244H480" stroke="#fff" stroke-width="4" stroke-dasharray="20 16"/>${house(30, 150, 90, 72, C.paper, C.coral, b)}${house(140, 120, 90, 102, "#e8d7b5", C.teal, b)}${house(250, 140, 90, 82, C.paper, C.gold, b)}${house(360, 130, 90, 92, "#e8d7b5", C.leaf, b)}`,
  // Scenarios: a conversation
  talk: (b) =>
    `${sky("st", "#e6f6f4", "#fff3d6")}${bubble(50, 40, 200, 80, "#fff", b, "l")}${bubble(230, 130, 200, 80, C.tealLt, b, "r")}<circle cx="70" cy="200" r="26" fill="${C.coral}" ${stroke(b, 3)}/><circle cx="410" cy="60" r="26" fill="${C.teal}" ${stroke(b, 3)}/>`,
  // Language Worlds: a map of connected stations
  map: (b) =>
    `<rect width="480" height="270" fill="${C.paper}"/><rect x="16" y="16" width="448" height="238" rx="14" fill="${C.sand}" ${stroke(b, 3)}/><path d="M90 200L180 90L290 170L390 80" fill="none" stroke="${C.navy}" stroke-width="4" stroke-dasharray="10 8"/>${[
      [90, 200, C.teal],
      [180, 90, C.coral],
      [290, 170, C.gold],
      [390, 80, C.leaf],
    ]
      .map(
        ([x, y, f]) =>
          `<circle cx="${x}" cy="${y}" r="22" fill="${f}" ${stroke(b, 3)}/><circle cx="${x}" cy="${y}" r="8" fill="#fff"/>`,
      )
      .join("")}`,
  // Science Exhibition: two bean plants, one in light, one in the dark
  beans: (b) =>
    `<rect width="480" height="270" fill="#fdf3da"/><rect x="250" y="0" width="230" height="270" fill="#20364f"/><circle cx="80" cy="56" r="28" fill="${C.gold}"/>${star(400, 50, 5, "#fff")}${[
      [140, 140, 1],
      [360, 190, 0.45],
    ]
      .map(
        ([x, top, s]) =>
          `<g transform="translate(${x} 0)"><path d="M0 220V${top}" stroke="${s > 0.6 ? C.leaf : "#b9c98a"}" stroke-width="6"/><ellipse cx="-22" cy="${top + 18}" rx="${24 * s + 6}" ry="${10 * s + 4}" fill="${s > 0.6 ? C.leaf : "#b9c98a"}" ${stroke(b, 2)}/><ellipse cx="22" cy="${top + 40}" rx="${24 * s + 6}" ry="${10 * s + 4}" fill="${s > 0.6 ? C.leafDk : "#a7b878"}" ${stroke(b, 2)}/><path d="M-40 220h80l-10 40h-60Z" fill="${C.coral}" ${stroke(b, 3)}/></g>`,
      )
      .join("")}`,
};

export function worldScene(key, band) {
  const draw = WORLD_SCENES[key];
  return draw ? svg("0 0 480 270", draw(band), { cls: `gs-scene pa-scene-${key}` }) : "";
}
