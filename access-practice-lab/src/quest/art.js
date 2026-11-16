// Language Quest art: original inline SVG, drawn from data. Nothing is a bitmap and nothing comes from outside the lab.
// Scenes are layered (sky, far, near, floor) so a little ambient motion can move layers apart; motion is CSS only and is
// switched off by prefers-reduced-motion and by the lab's own motion setting (quest.css). Every figure used as content
// has a text description supplied by the caller (aria-label / <title> or a visible caption).
import { esc } from "../util.js";

const NAVY = "#1a2f78";
const INK = "#111a3b";
const PAPER = "#fffdf8";

// ── small icons, drawn in a 60 x 60 box around (0,0) ────────────────────────────────────────────────────────────
const G = {
  window: `<rect x="-24" y="-26" width="48" height="52" rx="3" fill="#cfe4f5" stroke="${INK}" stroke-width="3"/><path d="M0 -26V26M-24 0H24" stroke="${INK}" stroke-width="3"/><rect x="-5" y="2" width="10" height="5" fill="#d28b58" stroke="${INK}" stroke-width="2"/>`,
  case: `<rect x="-26" y="-4" width="52" height="30" rx="3" fill="#d9f0ec" fill-opacity=".7" stroke="${INK}" stroke-width="3"/><rect x="-30" y="22" width="60" height="9" rx="2" fill="#59637f"/><path d="M-26 -4L-18 -16H18L26 -4" fill="none" stroke="${INK}" stroke-width="3"/>`,
  badge: `<rect x="-18" y="-28" width="36" height="56" rx="5" fill="#fffdf8" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="-10" r="9" fill="#2e4a94"/><path d="M-11 6H11M-11 14H5" stroke="${INK}" stroke-width="3"/><rect x="-18" y="-28" width="36" height="7" rx="3" fill="#075568"/>`,
  note: `<rect x="-22" y="-22" width="44" height="44" fill="#f5d6a8" stroke="${INK}" stroke-width="3" transform="rotate(-6)"/><path d="M-14 -8H14M-14 2H14M-14 12H4" stroke="${INK}" stroke-width="2.5" transform="rotate(-6)"/>`,
  cup: `<path d="M-18 -16H14V10Q14 24 -2 24Q-18 24 -18 10Z" fill="#fffdf8" stroke="${INK}" stroke-width="3"/><path d="M14 -8H22Q28 -8 28 0Q28 8 20 8H14" fill="none" stroke="${INK}" stroke-width="3"/><path d="M-10 -26Q-6 -32 -10 -38M2 -26Q6 -32 2 -38" stroke="#59637f" stroke-width="2.5" fill="none"/>`,
  fan: `<circle r="26" fill="#e7e3dc" stroke="${INK}" stroke-width="3"/><g fill="#1a2f78"><path d="M0 0C-6 -22 8 -24 6 -4Z"/><path d="M0 0C20 -10 22 6 4 4Z" transform="rotate(120)"/><path d="M0 0C20 -10 22 6 4 4Z" transform="rotate(240)"/></g><circle r="5" fill="#b0261c"/>`,
  board: `<rect x="-28" y="-22" width="56" height="44" rx="3" fill="#fffdf8" stroke="${INK}" stroke-width="3"/><path d="M-18 -10H18M-18 0H18M-18 10H6" stroke="${NAVY}" stroke-width="3"/>`,
  sun: `<circle r="14" fill="#f5d6a8" stroke="#d28b58" stroke-width="3"/><g stroke="#d28b58" stroke-width="3" stroke-linecap="round"><path d="M0 -26V-20M0 20V26M-26 0H-20M20 0H26M-18 -18l4 4M14 14l4 4M18 -18l-4 4M-14 14l-4 4"/></g>`,
  tree: `<rect x="-5" y="4" width="10" height="26" fill="#884326"/><circle cx="0" cy="-8" r="22" fill="#5a9481" stroke="#264e48" stroke-width="3"/><circle cx="-10" cy="-4" r="9" fill="#7fb59f" opacity=".7"/>`,
  factory: `<rect x="-28" y="-6" width="56" height="34" fill="#59637f" stroke="${INK}" stroke-width="3"/><path d="M-28 -6L-14 -20V-6L0 -20V-6L14 -20V-6" fill="#59637f" stroke="${INK}" stroke-width="3"/><rect x="-8" y="10" width="16" height="18" fill="#2a3556"/>`,
  house: `<path d="M-26 -2L0 -26L26 -2Z" fill="#d28b58" stroke="${INK}" stroke-width="3"/><rect x="-20" y="-2" width="40" height="30" fill="#f5d6a8" stroke="${INK}" stroke-width="3"/><rect x="-5" y="10" width="10" height="18" fill="#884326"/>`,
  gears: `<circle r="16" fill="#e7e3dc" stroke="${INK}" stroke-width="3"/><circle r="5" fill="${INK}"/><g stroke="${INK}" stroke-width="7" stroke-linecap="butt"><path d="M0 -24V-18M0 18V24M-24 0H-18M18 0H24M-17 -17l4 4M13 13l4 4M17 -17l-4 4M-13 13l-4 4"/></g>`,
  fox: `<path d="M-24 -6L-18 -28L-4 -14L4 -14L18 -28L24 -6Q24 20 0 26Q-24 20 -24 -6Z" fill="#d28b58" stroke="${INK}" stroke-width="3"/><path d="M-12 8Q0 26 12 8Q0 14 -12 8Z" fill="#fffdf8"/><circle cx="-9" cy="-2" r="3" fill="${INK}"/><circle cx="9" cy="-2" r="3" fill="${INK}"/><circle cx="0" cy="8" r="3.5" fill="${INK}"/>`,
  owl: `<ellipse cx="0" cy="2" rx="22" ry="26" fill="#a0724e" stroke="${INK}" stroke-width="3"/><path d="M-20 -18L-12 -26L-4 -20M20 -18L12 -26L4 -20" fill="#a0724e" stroke="${INK}" stroke-width="3"/><circle cx="-9" cy="-4" r="9" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><circle cx="9" cy="-4" r="9" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><circle cx="-9" cy="-4" r="3.5" fill="${INK}"/><circle cx="9" cy="-4" r="3.5" fill="${INK}"/><path d="M-4 6L0 14L4 6Z" fill="#f2c15b" stroke="${INK}" stroke-width="2"/>`,
  robot: `<rect x="-22" y="-18" width="44" height="40" rx="8" fill="#9aa6d2" stroke="${INK}" stroke-width="3"/><path d="M0 -18V-28" stroke="${INK}" stroke-width="3"/><circle cy="-30" r="4" fill="#f2c15b" stroke="${INK}" stroke-width="2"/><circle cx="-9" cy="-4" r="5" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><circle cx="9" cy="-4" r="5" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><path d="M-10 10H10" stroke="${INK}" stroke-width="3"/>`,
  kite: `<path d="M0 -28L18 -4L0 16L-18 -4Z" fill="#dba3b9" stroke="${INK}" stroke-width="3"/><path d="M0 -28V16M-18 -4H18" stroke="${INK}" stroke-width="2"/><path d="M0 16Q-8 24 0 30Q8 36 0 42" fill="none" stroke="${INK}" stroke-width="2.5"/>`,
  key: `<circle cx="-12" cy="0" r="12" fill="#f2c15b" stroke="${INK}" stroke-width="3"/><circle cx="-12" cy="0" r="4" fill="${PAPER}"/><path d="M0 0H26M18 0V10M26 0V8" stroke="${INK}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  bridge: `<path d="M-30 6Q0 -22 30 6" fill="none" stroke="${INK}" stroke-width="4"/><path d="M-30 6H30" stroke="#884326" stroke-width="7"/><path d="M-20 6V-6M-10 6V-12M0 6V-14M10 6V-12M20 6V-6" stroke="${INK}" stroke-width="2.5"/>`,
  star: `<path d="M0 -26L7 -8L26 -8L11 4L17 24L0 12L-17 24L-11 4L-26 -8L-7 -8Z" fill="#f2c15b" stroke="#884326" stroke-width="3"/>`,
  river: `<path d="M-30 -10Q-15 -20 0 -10T30 -10M-30 4Q-15 -6 0 4T30 4M-30 18Q-15 8 0 18T30 18" fill="none" stroke="#2e4a94" stroke-width="4" stroke-linecap="round"/>`,
  compass: `<circle r="24" fill="${PAPER}" stroke="${INK}" stroke-width="3"/><path d="M0 -18L6 0L0 18L-6 0Z" fill="#b0261c"/><path d="M0 -18L6 0H-6Z" fill="${NAVY}"/><circle r="3" fill="${INK}"/>`,
  bell: `<path d="M-20 14Q-20 -22 0 -22Q20 -22 20 14Z" fill="#d28b58" stroke="${INK}" stroke-width="3"/><path d="M-26 14H26" stroke="${INK}" stroke-width="4"/><circle cy="22" r="5" fill="${INK}"/>`,
  tower: `<path d="M-10 28L-6 -18H6L10 28Z" fill="#59637f" stroke="${INK}" stroke-width="3"/><path d="M-14 -24L0 -30L14 -24" fill="none" stroke="${INK}" stroke-width="3"/><circle cy="-34" r="4" fill="#b0261c"/>`,
  lens: `<circle cx="-4" cy="-4" r="16" fill="#d9f0ec" fill-opacity=".7" stroke="${INK}" stroke-width="4"/><path d="M8 8L24 24" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
  book: `<path d="M-24 -18H0V20H-24ZM24 -18H0V20H24Z" fill="${PAPER}" stroke="${INK}" stroke-width="3"/><path d="M-18 -8H-6M-18 0H-6M6 -8H18M6 0H18" stroke="${NAVY}" stroke-width="2.5"/>`,
  flask: `<path d="M-8 -26H8V-8L24 22Q26 28 18 28H-18Q-26 28 -24 22L-8 -8Z" fill="#d9f0ec" stroke="${INK}" stroke-width="3"/><path d="M-16 14H16L20 24H-20Z" fill="#15969a"/>`,
  pencil: `<path d="M-24 22L-20 8L14 -26L26 -14L-8 20Z" fill="#f2c15b" stroke="${INK}" stroke-width="3"/><path d="M-24 22L-20 8L-8 20Z" fill="#f5d6a8" stroke="${INK}" stroke-width="2"/>`,
  bubble: `<path d="M-26 -18H26Q30 -18 30 -14V8Q30 12 26 12H0L-12 24V12H-26Q-30 12 -30 8V-14Q-30 -18 -26 -18Z" fill="${PAPER}" stroke="${INK}" stroke-width="3"/><path d="M-16 -6H16M-16 2H6" stroke="${NAVY}" stroke-width="3"/>`,
  hammer: `<rect x="-6" y="-8" width="12" height="38" fill="#884326" stroke="${INK}" stroke-width="2.5"/><rect x="-24" y="-24" width="48" height="18" rx="3" fill="#59637f" stroke="${INK}" stroke-width="3"/>`,
  anvil: `<path d="M-28 -6H24L30 -14H16L12 -22H-20V-6Z" fill="#59637f" stroke="${INK}" stroke-width="3"/><path d="M-14 -6H10L6 16H12V24H-16V16H-10Z" fill="#59637f" stroke="${INK}" stroke-width="3"/>`,
  chest: `<rect x="-26" y="-8" width="52" height="32" rx="3" fill="#884326" stroke="${INK}" stroke-width="3"/><path d="M-26 -8Q-26 -24 0 -24Q26 -24 26 -8" fill="#a0724e" stroke="${INK}" stroke-width="3"/><rect x="-5" y="2" width="10" height="10" fill="#f2c15b" stroke="${INK}" stroke-width="2"/>`,
  speaker: `<rect x="-14" y="-24" width="28" height="48" rx="5" fill="#2a3556" stroke="${INK}" stroke-width="3"/><circle cy="-8" r="7" fill="#9aa6d2"/><circle cy="10" r="9" fill="#9aa6d2"/>`,
  radio: `<rect x="-26" y="-14" width="52" height="34" rx="5" fill="#59637f" stroke="${INK}" stroke-width="3"/><circle cx="-10" cy="3" r="9" fill="#9aa6d2" stroke="${INK}" stroke-width="2"/><path d="M6 -2H20M6 6H20" stroke="${INK}" stroke-width="3"/><path d="M14 -14L22 -30" stroke="${INK}" stroke-width="3"/>`,
  flag: `<path d="M-8 28V-26" stroke="${INK}" stroke-width="4"/><path d="M-8 -26H22L14 -14L22 -2H-8Z" fill="#b0261c" stroke="${INK}" stroke-width="2.5"/>`,
};
export const GLYPHS = Object.keys(G);
export const glyphSVG = (name, x = 0, y = 0, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${G[name] || G.star}</g>`;

// ── scene backgrounds ──────────────────────────────────────────────────────────────────────────────────────────
const SKY = {
  lab: ["#dfe8f6", "#f2f5fb"],
  city: ["#cfe4f5", "#fff3d8"],
  forge: ["#3a2415", "#6b3b1c"],
  newsroom: ["#e4eafa", "#f2f5fb"],
  map: ["#f5e6c4", "#fbf0d8"],
  portal: ["#26385f", "#7a6a5a"],
  forum: ["#efe9e4", "#f7f2ec"],
  studio: ["#4a1f35", "#6b2c49"],
  nexus: ["#1f3a5f", "#e8a76a"],
  forest: ["#cfe8d5", "#eef7ea"],
  beach: ["#bfe5f2", "#fbeccb"],
  space: ["#111a3b", "#2a3a78"],
};
const FLOOR = { lab: "#c9d2e4", city: "#b9c3cf", forge: "#2b1a10", newsroom: "#c9cfdc", map: "#e6d3a3", portal: "#4b4038", forum: "#a0724e", studio: "#8a5a3a", nexus: "#2f5d46", forest: "#88b58f", beach: "#ecd9a8", space: "#1a2a59" };

/** Far and near layers carry `data-depth` so quest.css can drift them apart a few pixels when motion is allowed. */
function backdrop(theme, uid) {
  const [a, b] = SKY[theme] || SKY.lab;
  const floor = FLOOR[theme] || FLOOR.lab;
  const far = {
    lab: `<rect x="0" y="0" width="1000" height="360" fill="#e9eef8"/><g stroke="#cdd6e8" stroke-width="2">${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 90} 0V360"/>`).join("")}${Array.from({ length: 5 }, (_, i) => `<path d="M0 ${i * 72}H1000"/>`).join("")}</g><rect x="0" y="0" width="1000" height="40" fill="#cdd6e8"/><g fill="#fffdf8" stroke="#9aa6d2" stroke-width="3"><rect x="120" y="8" width="140" height="22" rx="6"/><rect x="430" y="8" width="140" height="22" rx="6"/><rect x="740" y="8" width="140" height="22" rx="6"/></g><g fill="#d9f0ec" stroke="#9aa6d2" stroke-width="3" opacity=".9"><rect x="80" y="70" width="200" height="12" rx="3"/><rect x="700" y="70" width="220" height="12" rx="3"/></g><g stroke="#9aa6d2" stroke-width="3"><path d="M80 82V120M280 82V120M700 82V120M920 82V120"/></g>`,
    city: `<g fill="#9fb3c8"><rect x="60" y="150" width="90" height="210"/><rect x="170" y="110" width="70" height="250"/><rect x="800" y="130" width="100" height="230"/><rect x="920" y="180" width="60" height="180"/></g><g fill="#c7d4e1"><rect x="430" y="170" width="100" height="190"/><rect x="560" y="140" width="80" height="220"/></g>`,
    forge: `<g stroke="#4a2a15" stroke-width="3" fill="none">${Array.from({ length: 8 }, (_, r) => Array.from({ length: 11 }, (_, c) => `<rect x="${c * 100 - (r % 2) * 50}" y="${r * 48}" width="100" height="48"/>`).join("")).join("")}</g><g fill="#1c1009"><rect x="0" y="0" width="1000" height="70"/><path d="M80 70V30M200 70V20M780 70V34"/></g><ellipse cx="500" cy="300" rx="190" ry="130" fill="#f2862a" opacity=".5"/><ellipse cx="500" cy="300" rx="120" ry="80" fill="#f2c15b" opacity=".6"/>`,
    newsroom: `<rect x="60" y="40" width="880" height="12" fill="#cdd6e8"/><g fill="#b4c1de"><rect x="780" y="80" width="160" height="200" rx="4"/></g><path d="M800 260L860 180L920 260" fill="#59637f"/><rect x="100" y="90" width="320" height="190" rx="4" fill="#c8a778"/><g fill="#fffdf8"><rect x="125" y="115" width="80" height="60" transform="rotate(-3 165 145)"/><rect x="225" y="120" width="80" height="60" transform="rotate(2 265 150)"/><rect x="320" y="112" width="80" height="60" transform="rotate(-1 360 142)"/></g>`,
    map: `<rect x="40" y="30" width="920" height="470" rx="18" fill="#f1dfae" stroke="#a0724e" stroke-width="6"/><path d="M570 30V500" stroke="#2e4a94" stroke-width="46" opacity=".75"/>`,
    portal: `<g fill="#fffdf8">${[[80, 60], [190, 140], [330, 50], [660, 70], [820, 120], [930, 40], [900, 230], [110, 250]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join("")}</g><path d="M240 400V170Q240 40 500 40Q760 40 760 170V400" fill="#0e1736" stroke="#9aa6d2" stroke-width="14"/><ellipse cx="500" cy="250" rx="200" ry="170" fill="#d28b58" opacity=".35"/><path d="M300 330H700L650 250H350Z" fill="#5a9481" opacity=".5"/>`,
    forum: `<rect x="40" y="40" width="920" height="300" fill="#e7ddd1"/><g fill="#a0724e"><rect x="60" y="40" width="30" height="300"/><rect x="910" y="40" width="30" height="300"/></g><rect x="130" y="80" width="150" height="110" fill="#d9f0ec" stroke="#264e48" stroke-width="4"/><rect x="720" y="80" width="150" height="110" fill="#fcefd3" stroke="#884326" stroke-width="4"/>`,
    studio: `<path d="M0 0H200Q180 220 0 260ZM1000 0H800Q820 220 1000 260Z" fill="#b0261c"/><rect x="200" y="30" width="600" height="230" fill="#2a1410" opacity=".5"/><path d="M420 0H580L760 400H240Z" fill="#fff3d8" opacity=".16"/><g stroke="#8a2a1a" stroke-width="3" opacity=".7">${Array.from({ length: 6 }, (_, i) => `<path d="M${30 + i * 30} 0Q${25 + i * 25} 130 ${12 + i * 15} 250"/>`).join("")}</g>`,
    nexus: `<g fill="#fffdf8" opacity=".8">${[[80, 40], [200, 90], [330, 30], [450, 70], [560, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5"/>`).join("")}</g><circle cx="760" cy="150" r="60" fill="#f5d6a8" opacity=".9"/><path d="M0 330Q250 250 500 320T1000 300V420H0Z" fill="#2f5d46"/><g fill="#59637f" stroke="#111a3b" stroke-width="3"><path d="M820 330L832 70H848L860 330Z"/></g><circle cx="840" cy="62" r="7" fill="#b0261c"/>`,
    forest: `<g fill="#5a9481" opacity=".75"><circle cx="120" cy="230" r="90"/><circle cx="300" cy="260" r="80"/><circle cx="820" cy="240" r="95"/></g>`,
    beach: `<rect x="0" y="260" width="1000" height="90" fill="#6bb6d6" opacity=".7"/><circle cx="830" cy="100" r="50" fill="#f5d6a8"/>`,
    space: `<g fill="#fffdf8"><circle cx="90" cy="60" r="3"/><circle cx="260" cy="130" r="2"/><circle cx="520" cy="50" r="3"/><circle cx="740" cy="110" r="2"/><circle cx="900" cy="60" r="3"/></g><circle cx="820" cy="250" r="90" fill="#d28b58"/><circle cx="780" cy="230" r="14" fill="#a0724e"/>`,
  }[theme] || "";
  const near = {
    lab: `<rect x="40" y="350" width="920" height="40" fill="#8a96b3"/><rect x="60" y="390" width="880" height="16" fill="#6a7694"/>`,
    city: `<rect x="0" y="380" width="1000" height="40" fill="#59637f"/><path d="M0 400H1000" stroke="#f2c15b" stroke-width="4" stroke-dasharray="26 22"/>`,
    forge: `<rect x="0" y="420" width="1000" height="140" fill="#2b1a10"/>`,
    newsroom: `<rect x="60" y="380" width="880" height="30" fill="#8a6a45"/>`,
    map: ``,
    portal: `<rect x="0" y="410" width="1000" height="150" fill="#4b4038"/>`,
    forum: `<path d="M120 360Q500 300 880 360V420H120Z" fill="#884326"/>`,
    studio: `<rect x="0" y="400" width="1000" height="160" fill="#8a5a3a"/>`,
    nexus: `<rect x="320" y="400" width="360" height="40" fill="#a0724e"/>`,
    forest: ``,
    beach: ``,
    space: ``,
  }[theme] || "";
  return `<defs><linearGradient id="q-sky-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
  <rect width="1000" height="560" fill="url(#q-sky-${uid})"/>
  <g data-depth="far">${far}</g>
  <rect y="${theme === "map" ? 0 : 400}" width="1000" height="${theme === "map" ? 0 : 160}" fill="${floor}"/>
  <g data-depth="near">${near}</g>`;
}
const DECO = {
  lab: [["window", 140, 170, 1.7], ["case", 300, 330, 2], ["flask", 520, 320, 2], ["fan", 740, 340, 1.8], ["note", 880, 250, 1.1]],
  city: [["house", 150, 340, 2.2], ["factory", 440, 330, 2.2], ["tree", 690, 360, 2], ["sun", 860, 110, 2]],
  forge: [["anvil", 500, 430, 3.2], ["hammer", 720, 400, 2.2], ["gears", 240, 380, 2.2], ["key", 860, 260, 1.4]],
  newsroom: [["board", 290, 230, 2.1], ["pencil", 700, 380, 2.2], ["book", 520, 390, 1.9], ["bubble", 840, 200, 1.6]],
  map: [["house", 140, 440, 1.8], ["tree", 300, 260, 1.8], ["flag", 300, 380, 1.6], ["bridge", 570, 260, 2], ["gears", 780, 170, 1.6], ["star", 860, 80, 1.5]],
  portal: [["bell", 500, 300, 2.6], ["house", 240, 420, 1.9], ["chest", 760, 430, 1.9]],
  forum: [["bubble", 290, 300, 2.2], ["board", 710, 300, 2.2], ["flag", 500, 240, 1.7]],
  studio: [["book", 290, 410, 2.3], ["bubble", 640, 250, 2.2], ["star", 820, 390, 1.7], ["pencil", 500, 430, 2.2]],
  nexus: [["tower", 840, 330, 2.6], ["radio", 420, 410, 2.3], ["speaker", 250, 380, 2.1], ["compass", 620, 400, 1.9]],
  forest: [["tree", 150, 360, 2.4], ["fox", 480, 400, 2.2], ["tree", 860, 350, 2.2]],
  beach: [["sun", 840, 100, 2.4], ["bridge", 300, 340, 1.8]],
  space: [["star", 220, 150, 1.6], ["robot", 500, 380, 2.2]],
};
const deco = (theme) => (DECO[theme] || []).map(([g, x, y, k]) => glyphSVG(g, x, y, k)).join("");
let uidN = 0;
const nextUid = () => `s${++uidN}`;

/** The scene, with object glyphs drawn in it. `marks` = { objectId: "yes" | "no" } puts a check or a cross by finished ones. */
export function sceneSVG(theme, { objects = [], marks = {}, alt = "", extra = "" } = {}) {
  const uid = nextUid();
  const pins = objects
    .filter((o) => o.glyph)
    .map((o) => {
      const mark = marks[o.id];
      return `<g class="q-obj ${mark ? `is-${mark}` : ""}" data-obj="${esc(o.id)}">${glyphSVG(o.glyph, o.x, o.y, 1.5)}<text x="${o.x}" y="${o.y + 62}" text-anchor="middle" class="q-obj-label">${esc(o.label)}</text>${mark ? `<g transform="translate(${o.x + 30} ${o.y - 34})"><circle r="13" fill="${mark === "yes" ? "#17694a" : "#59637f"}"/>${mark === "yes" ? '<path d="M-6 0l4 5 8-10" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="M-6 0h12" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>'}</g>` : ""}</g>`;
    })
    .join("");
  return `<svg class="q-scene q-theme-${theme}" viewBox="0 0 1000 560" role="img" aria-label="${esc(alt)}" preserveAspectRatio="xMidYMid slice">${backdrop(theme, uid)}${objects.length ? "" : `<g class="q-deco">${deco(theme)}</g>`}${pins}${extra}</svg>`;
}

// ── characters ───────────────────────────────────────────────────────────────────────────────────────────────────
const MOUTH = { happy: "M-9 12Q0 22 9 12", think: "M-7 15H7", cheer: "M-10 10Q0 26 10 10Z", ask: "M-6 15Q0 11 6 15" };
const BROWS = { happy: ["M-14 -8Q-9 -12 -4 -8", "M4 -8Q9 -12 14 -8"], think: ["M-14 -10L-4 -7", "M4 -7L14 -10"], cheer: ["M-14 -11Q-9 -15 -4 -11", "M4 -11Q9 -15 14 -11"], ask: ["M-14 -8Q-9 -13 -4 -9", "M4 -9Q9 -13 14 -8"] };
/** An original instructional character: a face, a coat in the role colour and the prop that names the role. */
export function portraitSVG(ch, mood = "happy", { w = 96, label = "" } = {}) {
  const m = MOUTH[mood] ? mood : "happy";
  const l = ch.look;
  return `<svg class="q-portrait q-mood-${m}" viewBox="-40 -52 80 110" width="${w}" height="${Math.round(w * 1.375)}" role="img" aria-label="${esc(label || `${ch.name}, ${ch.role.en}`)}">
  <path d="M-30 58Q-30 24 0 22Q30 24 30 58Z" fill="${l.coat}" stroke="${INK}" stroke-width="3"/>
  <path d="M-8 22L0 34L8 22" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>
  <circle cx="0" cy="-8" r="26" fill="${l.skin}" stroke="${INK}" stroke-width="3"/>
  <path d="M-27 -10Q-28 -40 0 -40Q28 -40 27 -10Q18 -26 0 -24Q-18 -26 -27 -10Z" fill="${l.hair}" stroke="${INK}" stroke-width="3"/>
  <circle cx="-9" cy="-4" r="3.2" fill="${INK}" class="q-eye"/><circle cx="9" cy="-4" r="3.2" fill="${INK}" class="q-eye"/>
  <path d="${BROWS[m][0]}${BROWS[m][1] ? ` ${BROWS[m][1]}` : ""}" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round" transform="translate(0 -4)"/>
  <path d="${MOUTH[m]}" stroke="${INK}" stroke-width="3" fill="${m === "cheer" ? "#fffdf8" : "none"}" stroke-linecap="round"/>
  <g transform="translate(26 36) scale(.62)">${G[ch.prop] || ""}</g></svg>`;
}

// ── Science City model ───────────────────────────────────────────────────────────────────────────────────────────
/** The fictional city, drawn from the picked projects: more trees, white roofs, a park, a wider road, AC boxes. */
export function citySVG(picked = [], metrics = null, alt = "") {
  const uid = nextUid();
  const has = (id) => picked.includes(id);
  const roofs = [0, 1, 2, 3].map((i) => `<rect x="${130 + i * 190}" y="${250 + (i % 2) * 20}" width="130" height="110" fill="#e8e3da" stroke="${INK}" stroke-width="3"/><rect x="${130 + i * 190}" y="${240 + (i % 2) * 20}" width="130" height="16" fill="${has("roofs") ? "#fffdf8" : "#3a4566"}" stroke="${INK}" stroke-width="3"/>`).join("");
  const trees = has("trees") ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<g class="q-grow" style="--d:${i * 70}ms">${glyphSVG("tree", 90 + i * 115, 410, 1)}</g>`).join("") : [0, 1].map((i) => glyphSVG("tree", 120 + i * 700, 410, 0.7)).join("");
  const park = has("park") ? `<rect x="420" y="400" width="190" height="90" rx="14" fill="#7fb59f" stroke="#264e48" stroke-width="3"/>${glyphSVG("tree", 460, 440, 0.8)}${glyphSVG("tree", 570, 440, 0.8)}` : `<rect x="420" y="400" width="190" height="90" fill="#59637f" stroke="${INK}" stroke-width="3"/><path d="M430 445H600" stroke="#fffdf8" stroke-width="3" stroke-dasharray="14 12"/>`;
  const road = `<rect x="0" y="${has("roads") ? 488 : 500}" width="1000" height="${has("roads") ? 72 : 60}" fill="#2a3556"/>`;
  const ac = has("ac") ? [0, 1, 2].map((i) => `<rect x="${170 + i * 190}" y="${222 + (i % 2) * 20}" width="26" height="16" fill="#9aa6d2" stroke="${INK}" stroke-width="2"/>`).join("") : "";
  const t = metrics?.temp;
  const wash = t == null ? "" : `<rect width="1000" height="560" fill="${t >= 95 ? "#d28b58" : t >= 92 ? "#f2c15b" : "#91e2d6"}" opacity="${Math.min(0.28, Math.abs(t - 91) * 0.035 + 0.06)}"/>`;
  const therm = t == null ? "" : `<g transform="translate(930 40)"><rect x="-14" y="0" width="28" height="120" rx="14" fill="#fffdf8" stroke="${INK}" stroke-width="3"/><rect x="-7" y="${120 - Math.max(8, Math.min(108, (t - 80) * 6))}" width="14" height="${Math.max(8, Math.min(108, (t - 80) * 6))}" rx="7" fill="${t >= 95 ? "#b0261c" : t >= 92 ? "#d28b58" : "#15969a"}"/><text y="146" text-anchor="middle" font-size="22" font-weight="700" fill="${INK}">${t}°F</text></g>`;
  return `<svg class="q-scene q-theme-city" viewBox="0 0 1000 560" role="img" aria-label="${esc(alt)}" preserveAspectRatio="xMidYMid slice">${backdrop("city", uid)}${roofs}${ac}${park}${trees}${road}${wash}${therm}</svg>`;
}

// ── Story stage (Build the Perfect Story) ────────────────────────────────────────────────────────────────────────
/** A stage the learner's sentences act out. `shown` lists revealed slot reveals; `say` is the learner's own dialogue. */
export function storyStageSVG(pick, shown = [], say = "", alt = "", animate = false) {
  const uid = nextUid();
  const setting = pick.setting?.id === "beach" ? "beach" : pick.setting?.id === "space" ? "space" : "forest";
  const has = (k) => shown.includes(k);
  const cx = has("attempt") ? 620 : has("approach") ? 520 : has("enter") ? 300 : -120;
  const char = pick.character ? `<g class="q-actor" style="transform:translate(${cx}px,380px)"><g class="q-actor-in">${glyphSVG(pick.character.glyph, 0, 0, 2.2)}</g></g>` : "";
  const prob = pick.problem && has("problem") ? `<g class="q-prop ${has("resolve") ? "is-solved" : "is-problem"}">${glyphSVG(pick.problem.glyph, 760, 300, 2.2)}</g>` : "";
  const star = has("resolve") ? `<g class="q-pop">${glyphSVG("star", 760, 220, 1.5)}</g>` : "";
  const bubble = has("speak") && say ? `<g><rect x="250" y="90" width="500" height="92" rx="16" fill="${PAPER}" stroke="${INK}" stroke-width="4"/><foreignObject x="266" y="98" width="468" height="78"><div xmlns="http://www.w3.org/1999/xhtml" class="q-bubble-text">${esc(say.replace(/^["“]|["”]$/g, ""))}</div></foreignObject></g>` : "";
  return `<svg class="q-scene q-theme-${setting}${animate ? " q-anim" : ""}" viewBox="0 0 1000 560" role="img" aria-label="${esc(alt)}" preserveAspectRatio="xMidYMid slice">${backdrop(setting, uid)}${setting === "forest" ? [0, 1, 2].map((i) => glyphSVG("tree", 90 + i * 380, 360, 1.6)).join("") : ""}${prob}${char}${star}${bubble}</svg>`;
}

// ── Explorers' route grid ────────────────────────────────────────────────────────────────────────────────────────
/** Draws the grid, the planned or walked path and where the walker stopped. */
export function routeSVG(grid, path = [], stop = null, { animate = false, alt = "" } = {}) {
  const cell = 120;
  const W = grid.w * cell;
  const H = grid.h * cell;
  const blocked = new Set((grid.blocked || []).map((b) => b.join(",")));
  const tiles = [];
  for (let y = 0; y < grid.h; y++)
    for (let x = 0; x < grid.w; x++) {
      const k = `${x},${y}`;
      const isBlocked = blocked.has(k);
      const lm = grid.landmarks?.[k];
      const gx = x * cell;
      const gy = y * cell;
      tiles.push(`<rect x="${gx}" y="${gy}" width="${cell}" height="${cell}" fill="${isBlocked ? "#bcd6ec" : "#f1dfae"}" stroke="#a0724e" stroke-width="2"/>`);
      if (isBlocked) tiles.push(`<path d="M${gx + 12} ${gy + 40}q16 -14 32 0t32 0t32 0M${gx + 12} ${gy + 74}q16 -14 32 0t32 0t32 0" fill="none" stroke="#2e4a94" stroke-width="4" stroke-linecap="round"/>`);
      if (lm) {
        const g = { camp: "house", "oak tree": "tree", "red flag": "flag", bridge: "bridge", windmill: "gears", cave: "star" }[lm] || "star";
        tiles.push(glyphSVG(g, gx + cell / 2, gy + cell / 2 - 6, 1.1) + `<text x="${gx + cell / 2}" y="${gy + cell - 8}" text-anchor="middle" class="q-grid-label">${esc(lm)}</text>`);
      }
    }
  const pts = path.map(([x, y]) => `${x * cell + cell / 2},${y * cell + cell / 2}`);
  const line = pts.length > 1 ? `<polyline points="${pts.join(" ")}" fill="none" stroke="#b0261c" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 14"/>` : "";
  const last = path.at(-1) || grid.start;
  const walker = `<g class="q-walker">${animate && pts.length > 1 ? `<animateMotion dur="${Math.max(1, pts.length * 0.45)}s" fill="freeze" path="M${pts.join(" L")}"/>` : ""}<circle r="22" fill="#1a2f78" stroke="${PAPER}" stroke-width="4" ${animate ? "" : `cx="${last[0] * cell + cell / 2}" cy="${last[1] * cell + cell / 2}"`}/><text ${animate ? "" : `x="${last[0] * cell + cell / 2}" y="${last[1] * cell + cell / 2 + 7}"`} text-anchor="middle" fill="#fff" font-size="20" font-weight="700" ${animate ? 'y="7"' : ""}>K</text></g>`;
  const halt = stop ? `<g transform="translate(${stop[0] * cell + cell / 2} ${stop[1] * cell + cell / 2})"><circle r="28" fill="none" stroke="#b0261c" stroke-width="6" stroke-dasharray="6 6"/></g>` : "";
  return `<svg class="q-route" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(alt)}">${tiles.join("")}${line}${halt}${walker}</svg>`;
}

// ── bar chart (with a real table alternative) ───────────────────────────────────────────────────────────────────
export function chartHTML(chart) {
  const rows = chart.rows;
  const max = Math.max(...rows.map((r) => r.value));
  const min = chart.min ?? 0;
  const bar = (r, i) => {
    const pct = Math.max(4, ((r.value - min) / (max - min || 1)) * 100);
    return `<g transform="translate(0 ${i * 52})"><text x="0" y="20" class="q-bar-label">${esc(r.label)}</text><rect x="260" y="4" width="${pct * 5.2}" height="28" rx="4" fill="${NAVY}"/><text x="${260 + pct * 5.2 + 10}" y="25" class="q-bar-val">${r.value}${esc(chart.unit || "")}</text></g>`;
  };
  return `<figure class="q-chart"><figcaption>${esc(chart.title)}</figcaption><svg viewBox="0 0 880 ${rows.length * 52 + 10}" role="img" aria-label="${esc(`${chart.title}. ${rows.map((r) => `${r.label}: ${r.value}${chart.unit || ""}`).join("; ")}.`)}">${rows.map(bar).join("")}</svg><table class="visually-hidden"><caption>${esc(chart.title)}</caption><tbody>${rows.map((r) => `<tr><th scope="row">${esc(r.label)}</th><td>${r.value}${esc(chart.unit || "")}</td></tr>`).join("")}</tbody></table></figure>`;
}

/** A small world badge for cards: the world's theme scene, cropped. */
export const thumbSVG = (theme, alt = "") => sceneSVG(theme, { alt }).replace('class="q-scene', 'class="q-scene q-thumb');
