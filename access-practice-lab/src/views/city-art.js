// Language City art: the map and the six interiors are original inline SVG drawn from data. Characters come from the
// Real-Life Scenarios figure drawer (characterSVG), so the lab keeps one set of faces. No images are loaded.
import { BUILDINGS } from "../content/city-places.js";
import { characterSVG } from "./scenario-art.js";

const NAVY = "#17324D";
const TEAL = "#1FA6A2";
const PAPER = "#F7F4EC";
const AMBER = "#F2C15B";
const e = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

// ── the six buildings, drawn at the origin (top-left) in a 170 x 130 box ─────
const WINDOWS = (xs, y = 46) =>
  xs
    .map(
      (x) =>
        `<rect x="${x}" y="${y}" width="22" height="26" rx="3" fill="#cfe9ee" stroke="${NAVY}" stroke-width="2"/>`,
    )
    .join("");
const DOOR = (x = 72) =>
  `<rect x="${x}" y="82" width="26" height="48" rx="4" fill="${NAVY}"/><circle cx="${x + 20}" cy="108" r="2.5" fill="${AMBER}"/>`;
const FACADES = {
  cafe: `<rect x="10" y="30" width="150" height="100" rx="6" fill="#f3dcc2" stroke="${NAVY}" stroke-width="3"/><path d="M4 30 H166 L156 8 H14z" fill="#D28B58" stroke="${NAVY}" stroke-width="3"/><path d="M22 8 L16 30 M44 8 L40 30 M66 8 L64 30 M88 8 V30 M110 8 L112 30 M132 8 L136 30 M154 8 L158 30" stroke="${PAPER}" stroke-width="6"/>${WINDOWS([24, 124], 50)}${DOOR()}<circle cx="85" cy="68" r="9" fill="${PAPER}" stroke="${NAVY}" stroke-width="2"/><path d="M80 66 h10 v6 a5 5 0 0 1 -10 0z" fill="${NAVY}"/>`,
  library: `<rect x="14" y="36" width="142" height="94" rx="4" fill="#dfe8dc" stroke="${NAVY}" stroke-width="3"/><path d="M6 36 L85 4 L164 36z" fill="#5A9481" stroke="${NAVY}" stroke-width="3"/><path d="M30 44 V130 M60 44 V130 M110 44 V130 M140 44 V130" stroke="${PAPER}" stroke-width="9"/>${DOOR()}<rect x="62" y="48" width="46" height="22" rx="3" fill="${PAPER}" stroke="${NAVY}" stroke-width="2"/><path d="M85 52 V66 M72 54 h9 M89 54 h11" stroke="${NAVY}" stroke-width="2.5"/>`,
  clinic: `<rect x="10" y="22" width="150" height="108" rx="8" fill="#e2f3f0" stroke="${NAVY}" stroke-width="3"/><rect x="62" y="30" width="46" height="46" rx="8" fill="#fff" stroke="${TEAL}" stroke-width="3"/><path d="M85 38 V68 M70 53 H100" stroke="${TEAL}" stroke-width="9"/>${WINDOWS([22, 126], 56)}${DOOR()}<path d="M10 22 H160" stroke="${TEAL}" stroke-width="8"/>`,
  market: `<rect x="10" y="36" width="150" height="94" rx="4" fill="#fbe3d6" stroke="${NAVY}" stroke-width="3"/><path d="M4 36 H166 L158 12 H12z" fill="#F2765A" stroke="${NAVY}" stroke-width="3"/><path d="M30 12 L26 36 M56 12 L54 36 M82 12 V36 M108 12 L110 36 M134 12 L138 36" stroke="${PAPER}" stroke-width="9"/><rect x="22" y="92" width="58" height="30" rx="3" fill="#a87b4f" stroke="${NAVY}" stroke-width="2"/><circle cx="36" cy="88" r="8" fill="#e0453a"/><circle cx="52" cy="86" r="8" fill="${AMBER}"/><circle cx="68" cy="88" r="8" fill="#5A9481"/>${DOOR(112)}<rect x="94" y="48" width="56" height="22" rx="3" fill="${PAPER}" stroke="${NAVY}" stroke-width="2"/><path d="M102 60 h40" stroke="${NAVY}" stroke-width="3"/>`,
  "school-office": `<rect x="14" y="30" width="142" height="100" rx="4" fill="#f6e7b6" stroke="${NAVY}" stroke-width="3"/><path d="M8 30 H162 L150 12 H20z" fill="${AMBER}" stroke="${NAVY}" stroke-width="3"/><path d="M85 12 V-14" stroke="${NAVY}" stroke-width="3"/><path d="M85 -14 L108 -6 L85 2z" fill="${TEAL}" stroke="${NAVY}" stroke-width="2"/>${WINDOWS([26, 122], 46)}${DOOR()}<circle cx="85" cy="58" r="12" fill="${PAPER}" stroke="${NAVY}" stroke-width="2.5"/><path d="M85 58 V50 M85 58 L92 62" stroke="${NAVY}" stroke-width="2.5"/>`,
  station: `<rect x="6" y="40" width="158" height="90" rx="4" fill="#d8e2ea" stroke="${NAVY}" stroke-width="3"/><path d="M0 40 H170 L162 20 H8z" fill="${NAVY}"/><rect x="20" y="50" width="130" height="18" rx="3" fill="${PAPER}" stroke="${NAVY}" stroke-width="2"/><path d="M30 59 h40 M80 59 h20 M110 59 h30" stroke="${NAVY}" stroke-width="3"/><rect x="18" y="86" width="62" height="34" rx="8" fill="${AMBER}" stroke="${NAVY}" stroke-width="3"/><rect x="26" y="92" width="14" height="12" fill="#cfe9ee"/><rect x="46" y="92" width="14" height="12" fill="#cfe9ee"/><circle cx="34" cy="122" r="7" fill="${NAVY}"/><circle cx="66" cy="122" r="7" fill="${NAVY}"/>${DOOR(112)}`,
};

/** The whole city: streets, a park, trees and the six buildings, in a 1000 x 620 box. Decorative: the pins carry the names. */
export function cityMapSVG() {
  const trees = [
    [150, 150],
    [345, 420],
    [655, 410],
    [905, 520],
    [330, 560],
    [660, 555],
    [925, 150],
  ]
    .map(
      ([x, y]) =>
        `<g transform="translate(${x} ${y})"><rect x="-4" y="6" width="8" height="22" fill="#7c5a37"/><circle cx="0" cy="-2" r="20" fill="#5A9481"/></g>`,
    )
    .join("");
  const buildings = BUILDINGS.map((b) => {
    const [px, py] = b.at;
    const x = (px / 100) * 1000 - 85;
    const y = (py / 100) * 620 - 62;
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${FACADES[b.id] || ""}</g>`;
  }).join("");
  return `<svg class="city-map-svg" viewBox="0 0 1000 620" width="1000" height="620" aria-hidden="true" focusable="false"><rect width="1000" height="620" fill="#e9efe2"/><rect y="215" width="1000" height="70" fill="#9fb0bd"/><rect y="470" width="1000" height="60" fill="#9fb0bd"/><rect x="455" y="0" width="60" height="620" fill="#9fb0bd"/><path d="M0 250 H1000 M0 500 H1000" stroke="${PAPER}" stroke-width="5" stroke-dasharray="30 22"/><path d="M485 0 V620" stroke="${PAPER}" stroke-width="5" stroke-dasharray="30 22"/><ellipse cx="500" cy="352" rx="70" ry="44" fill="#cfe9ee" stroke="${TEAL}" stroke-width="4"/><path d="M455 352 q45 -26 90 0" fill="none" stroke="${TEAL}" stroke-width="3"/>${trees}${buildings}</svg>`;
}

// ── interiors ────────────────────────────────────────────────────────────────
const INTERIORS = {
  cafe: {
    wall: "#f6e8d4",
    floor: "#d9bf9c",
    props: `<rect x="40" y="48" width="170" height="86" rx="6" fill="${PAPER}" stroke="#a87b4f" stroke-width="3"/><path d="M52 70 H190 M52 92 H170 M52 112 H150" stroke="#a87b4f" stroke-width="4" stroke-linecap="round"/><rect x="300" y="190" width="170" height="26" rx="8" fill="#a87b4f"/><rect x="316" y="216" width="12" height="38" fill="#7c5a37"/><rect x="442" y="216" width="12" height="38" fill="#7c5a37"/><circle cx="340" cy="182" r="10" fill="${PAPER}" stroke="${NAVY}" stroke-width="2"/><circle cx="410" cy="182" r="10" fill="${PAPER}" stroke="${NAVY}" stroke-width="2"/>`,
  },
  library: {
    wall: "#e6eee3",
    floor: "#cbb994",
    props: `<rect x="24" y="24" width="250" height="150" fill="#7c5a37"/><rect x="32" y="34" width="234" height="30" fill="#a87b4f"/><rect x="32" y="74" width="234" height="30" fill="#a87b4f"/><rect x="32" y="114" width="234" height="30" fill="#a87b4f"/><path d="M46 34 v30 M62 34 v30 M80 34 v30 M120 34 v30 M150 34 v30 M70 74 v30 M90 74 v30 M130 74 v30 M200 74 v30 M60 114 v30 M104 114 v30 M170 114 v30" stroke="${TEAL}" stroke-width="10"/><rect x="340" y="190" width="170" height="40" rx="6" fill="#a87b4f"/>`,
  },
  clinic: {
    wall: "#e2f3f0",
    floor: "#d9e3dd",
    props: `<rect x="40" y="52" width="96" height="76" rx="8" fill="#fff" stroke="${TEAL}" stroke-width="3"/><path d="M88 66 v48 M64 90 h48" stroke="${TEAL}" stroke-width="9"/><rect x="300" y="190" width="190" height="36" rx="10" fill="#fff" stroke="#91e2d6" stroke-width="3"/><rect x="300" y="226" width="12" height="30" fill="#9fb0bd"/><rect x="478" y="226" width="12" height="30" fill="#9fb0bd"/><rect x="200" y="60" width="60" height="70" rx="4" fill="${PAPER}" stroke="${NAVY}" stroke-width="2"/><path d="M210 78 h40 M210 94 h40 M210 110 h26" stroke="${NAVY}" stroke-width="3"/>`,
  },
  market: {
    wall: "#fbe9de",
    floor: "#d9c6a6",
    props: `<rect x="30" y="64" width="190" height="14" fill="#a87b4f"/><rect x="30" y="112" width="190" height="14" fill="#a87b4f"/><circle cx="56" cy="52" r="12" fill="#e0453a"/><circle cx="86" cy="52" r="12" fill="#e0453a"/><circle cx="120" cy="54" r="12" fill="${AMBER}"/><circle cx="150" cy="54" r="12" fill="${AMBER}"/><circle cx="184" cy="54" r="12" fill="#5A9481"/><circle cx="60" cy="100" r="12" fill="#5A9481"/><circle cx="96" cy="100" r="12" fill="${AMBER}"/><circle cx="136" cy="100" r="12" fill="#e0453a"/><rect x="290" y="190" width="200" height="50" rx="6" fill="#8d6b4a"/><rect x="310" y="170" width="54" height="22" rx="3" fill="${PAPER}" stroke="${NAVY}" stroke-width="2"/>`,
  },
  "school-office": {
    wall: "#f5ecc8",
    floor: "#cdbf9f",
    props: `<rect x="40" y="46" width="130" height="80" rx="6" fill="${PAPER}" stroke="${NAVY}" stroke-width="3"/><circle cx="105" cy="86" r="26" fill="#fff" stroke="${NAVY}" stroke-width="3"/><path d="M105 86 V68 M105 86 L119 92" stroke="${NAVY}" stroke-width="3"/><rect x="290" y="190" width="200" height="42" rx="6" fill="#a87b4f"/><rect x="306" y="170" width="64" height="22" rx="3" fill="#fff" stroke="${NAVY}" stroke-width="2"/><rect x="220" y="44" width="40" height="90" rx="3" fill="${TEAL}" stroke="${NAVY}" stroke-width="2"/>`,
  },
  station: {
    wall: "#dde6ec",
    floor: "#9fb0bd",
    props: `<rect x="30" y="40" width="240" height="60" rx="6" fill="${NAVY}"/><path d="M48 62 h90 M48 82 h60 M170 62 h80 M170 82 h50" stroke="${PAPER}" stroke-width="5" stroke-linecap="round"/><rect x="300" y="60" width="120" height="70" rx="8" fill="${AMBER}" stroke="${NAVY}" stroke-width="3"/><rect x="312" y="72" width="38" height="28" fill="#cfe9ee"/><rect x="360" y="72" width="38" height="28" fill="#cfe9ee"/><rect x="40" y="190" width="150" height="26" rx="8" fill="#7c8190"/><rect x="54" y="216" width="10" height="36" fill="#555b69"/><rect x="166" y="216" width="10" height="36" fill="#555b69"/>`,
  },
};

/** A building's inside: the learner on the left, the character on the right. `mood` follows the step. */
export function interiorSVG(place, { npc, learner, mood = "neutral", label = "" }) {
  const room = INTERIORS[place.id] || INTERIORS.cafe;
  const name = label || place.name.en;
  return `<svg class="city-scene-svg" viewBox="0 0 640 280" width="640" height="280" role="img" aria-label="${e(name)}"><title>${e(name)}</title><rect width="640" height="200" fill="${room.wall}"/><rect y="200" width="640" height="80" fill="${room.floor}"/>${room.props}${characterSVG(learner, "neutral", 150, 202, 1.35)}${characterSVG(npc.look, mood, 480, 202, 1.35, true)}</svg>`;
}

/** A small portrait of a building's character for cards and the greeting. */
export const portraitSVG = (npc, mood = "happy") =>
  `<svg class="city-portrait" viewBox="-40 -100 80 130" width="54" height="86" aria-hidden="true" focusable="false">${characterSVG(npc.look, mood, 0, 20, 1)}</svg>`;

/** A small building thumbnail for cards. */
export const facadeThumbSVG = (id) =>
  `<svg class="city-thumb" viewBox="0 -20 170 160" width="102" height="96" aria-hidden="true" focusable="false">${FACADES[id] || ""}</svg>`;

