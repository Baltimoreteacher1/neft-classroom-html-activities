// Living Language Simulation Engine: illustration. Flat 2.5D scenes drawn as inline SVG (no images over the
// network, no libraries): one backdrop per `art` id, the people of a scene standing where their hotspot is, the
// mission map, portraits and the small glyphs on hotspots. Shapes are colored with sim-c-* / sim-s-* classes
// (sim.css maps them to Deep Harbor tokens), so the art follows the design system. All art is decorative: the
// meaning is carried by the labelled buttons the UI puts on top.
import { characterSVG } from "../views/scenario-art.js";

export const VIEW = { w: 640, h: 400 };
/** Art ids a scene may name. The first five are the flagship's places; the rest are general-purpose rooms. */
export const ART_IDS = Object.freeze([
  "square",
  "lab",
  "newsroom",
  "comms",
  "ops",
  "site",
  "records",
  "interview",
  "report",
]);

/** Named looks a mission may use instead of a look object (compiled experiences use these). */
export const LOOKS = Object.freeze({
  expert: { skin: "#8d5524", hair: "#1b1b1b", style: "curly", shirt: "#0f766e", acc: "glasses" },
  neighbor: { skin: "#e0ac84", hair: "#8a5a2b", style: "ponytail", shirt: "#a24f72", acc: "none" },
  official: { skin: "#5c3a21", hair: "#1b1b1b", style: "short", shirt: "#123a5c", acc: "none" },
  reporter: { skin: "#c68642", hair: "#2b1b12", style: "curly", shirt: "#d28b58", acc: "none" },
  worker: { skin: "#f1c9a5", hair: "#2b1b12", style: "cap", shirt: "#5a9481", acc: "headphones" },
  student: { skin: "#c68642", hair: "#1b1b1b", style: "braids", shirt: "#2e4a94", acc: "none" },
});
export const lookOf = (look) =>
  look && typeof look === "object" ? look : LOOKS[look] || LOOKS.neighbor;

const r = (x, y, w, h, c, rx = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="sim-c-${c}"/>`;
const c = (x, y, rad, cl) => `<circle cx="${x}" cy="${y}" r="${rad}" class="sim-c-${cl}"/>`;
const p = (d, cl) => `<path d="${d}" class="sim-c-${cl}"/>`;
const l = (d, cl, w = 3) => `<path d="${d}" class="sim-s-${cl}" stroke-width="${w}"/>`;
const rows = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join("");
const floor = (y, cl) => r(0, y, 640, 400 - y, cl);
const paper = (x, y, w = 44, h = 56) =>
  r(x, y, w, h, "ivory", 3) +
  rows(4, (i) => l(`M${x + 6} ${y + 10 + i * 11} H${x + w - 6}`, "line", 2));

const SCENES = {
  // City Square: skyline, plaza, loudspeaker pole, public board, bent sign.
  square: () =>
    r(0, 0, 640, 400, "sky") +
    c(540, 62, 30, "gold") +
    rows(7, (i) =>
      r(i * 96 - 10, 96 - (i % 3) * 26, 84, 150 + (i % 3) * 26, i % 2 ? "navy" : "mid", 4),
    ) +
    rows(7, (i) => rows(3, (j) => r(i * 96 + 4 + j * 24, 124 - (i % 3) * 20, 12, 16, "wheat", 2))) +
    floor(230, "sand") +
    rows(6, (i) => l(`M${i * 128 - 40} 400 L${260 + i * 24} 230`, "line", 1.5)) +
    // loudspeaker pole
    r(86, 110, 8, 150, "ink", 3) +
    p("M66 96 h48 l10 34 h-68 z", "coral") +
    c(90, 114, 9, "ivory") +
    // public board with notes
    r(214, 126, 136, 100, "copper", 6) +
    r(222, 134, 120, 84, "pearl", 3) +
    rows(6, (i) =>
      r(228 + (i % 3) * 38, 140 + Math.floor(i / 3) * 38, 30, 30, i % 2 ? "ivory" : "wheat", 2),
    ) +
    r(238, 226, 8, 44, "ink") +
    r(318, 226, 8, 44, "ink") +
    // bent sign and fallen branch
    l("M560 290 L572 180", "ink", 6) +
    p("M536 150 h70 l-8 34 h-70 z", "teal") +
    l("M500 300 q40 -20 96 6 M540 292 l-10 -16 M566 296 l8 -18", "sage", 6) +
    // fountain
    p("M300 300 h110 l-14 26 h-82 z", "pearl") +
    l("M355 300 v-26 M355 274 q-16 6 -18 22 M355 274 q16 6 18 22", "aqua", 3),
  // Science Laboratory: screens, weather station strip, bench with a test radio.
  lab: () =>
    r(0, 0, 640, 400, "mint") +
    r(380, 40, 220, 120, "sky", 8) +
    l("M380 100 H600 M490 40 V160", "ivory", 4) +
    r(70, 84, 150, 104, "deep", 8) +
    l("M84 160 l22 -30 22 14 22 -40 22 26 26 -18", "aqua", 3) +
    paper(232, 104, 30, 96) +
    floor(250, "sand") +
    r(40, 236, 560, 26, "copper", 6) +
    r(60, 262, 14, 110, "ink") +
    r(566, 262, 14, 110, "ink") +
    // flasks and the test radio
    p("M300 236 v-30 h-6 v-8 h28 v8 h-6 v30 z", "aqua") +
    p("M350 236 l14 -40 h-6 v-8 h20 v8 h-6 l14 40 z", "coral") +
    r(430, 200, 84, 36, "navy", 6) +
    c(452, 218, 9, "gold") +
    l("M500 200 v-34", "ink", 3),
  // Newsroom: stories on a line, festival poster, answering machine, the fact-check desk.
  newsroom: () =>
    r(0, 0, 640, 400, "pearl") +
    l("M0 62 Q320 96 640 62", "ink", 2) +
    rows(6, (i) => paper(40 + i * 100, 70 + (i % 2) * 8, 40, 50)) +
    // poster
    r(232, 60, 76, 96, "navy", 4) +
    rows(3, (i) => c(252 + i * 18, 96 + (i % 2) * 14, 8, "gold")) +
    // shelf with answering machine
    r(440, 176, 150, 10, "copper", 3) +
    r(468, 146, 64, 30, "ink", 5) +
    c(520, 160, 5, "coral") +
    floor(262, "sand") +
    // writing desk with the draft
    r(60, 232, 170, 18, "copper", 5) +
    paper(104, 188, 46, 44) +
    r(74, 250, 12, 100, "ink") +
    r(204, 250, 12, 100, "ink") +
    // fact-check desk
    r(20, 318, 600, 24, "teal", 6) +
    rows(2, (i) => paper(40 + i * 500, 280, 54, 38)),
  // Communication Center: racks of green lights, relay terminal, wall chart, clipboard, whiteboard.
  comms: () =>
    r(0, 0, 640, 400, "deep") +
    r(230, 60, 150, 100, "navy", 8) +
    l("M246 140 h20 v-22 h24 v-14 h24 v-40 h24 v60 h20", "gold", 3) +
    r(418, 62, 120, 86, "ivory", 6) +
    l("M434 86 h70 M434 106 h88 M434 126 h52", "line", 3) +
    r(60, 120, 130, 96, "mid", 8) +
    r(72, 132, 106, 62, "deep", 4) +
    rows(4, (i) => l(`M80 ${144 + i * 12} h${60 + (i % 2) * 24}`, "aqua", 2)) +
    floor(262, "navy") +
    rows(
      4,
      (i) =>
        r(40 + i * 150, 232, 110, 30, "mid", 4) +
        rows(6, (j) => c(54 + i * 150 + j * 16, 247, 4, (i + j) % 5 ? "sage" : "gold")),
    ) +
    r(526, 176, 50, 66, "copper", 4) +
    r(532, 186, 38, 50, "ivory", 2) +
    paper(196, 262, 44, 40),
  // Emergency Operations Room: wall map, decision board, microphone, long table, red telephone.
  ops: () =>
    r(0, 0, 640, 400, "sky") +
    r(250, 30, 140, 104, "ivory", 6) +
    p("M250 100 q40 -40 80 -10 t60 -20 v64 h-140 z", "aqua") +
    c(300, 74, 5, "coral") +
    c(350, 62, 5, "navy") +
    r(404, 56, 130, 110, "navy", 6) +
    rows(3, (i) => r(414, 68 + i * 32, 110, 22, i === 1 ? "gold" : "ivory", 4)) +
    r(46, 86, 62, 36, "pearl", 4) +
    p("M56 104 q20 -22 42 0 v8 h-42 z", "coral") +
    l("M218 200 v-66", "ink", 4) +
    c(218, 124, 12, "ink") +
    floor(262, "sand") +
    r(40, 214, 560, 30, "copper", 8) +
    r(64, 244, 14, 120, "ink") +
    r(562, 244, 14, 120, "ink") +
    rows(3, (i) => paper(86 + i * 26, 186, 40, 28)) +
    paper(426, 190, 46, 30),
  // General-purpose places for compiled experiences.
  site: () =>
    r(0, 0, 640, 400, "sky") +
    c(96, 70, 28, "gold") +
    p("M0 250 q160 -90 320 -20 t320 -30 v200 h-640 z", "sage") +
    r(380, 130, 180, 130, "ivory", 6) +
    p("M366 134 l104 -60 104 60 z", "coral") +
    r(450, 196, 40, 64, "navy", 4) +
    rows(2, (i) => r(398 + i * 110, 156, 34, 30, "aqua", 3)) +
    floor(260, "sand") +
    l("M470 262 q-60 60 -200 138", "ivory", 18),
  records: () =>
    r(0, 0, 640, 400, "pearl") +
    rows(
      3,
      (i) =>
        r(40, 40 + i * 70, 560, 10, "copper", 3) +
        rows(14, (j) =>
          r(
            52 + j * 39,
            2 + i * 70,
            26,
            38,
            ["navy", "teal", "coral", "gold", "sage"][(i + j) % 5],
            3,
          ),
        ),
    ) +
    floor(262, "sand") +
    r(170, 236, 300, 22, "copper", 6) +
    paper(290, 196, 50, 40) +
    r(186, 258, 12, 100, "ink") +
    r(442, 258, 12, 100, "ink"),
  interview: () =>
    r(0, 0, 640, 400, "mint") +
    r(60, 50, 200, 130, "sky", 8) +
    l("M60 115 H260 M160 50 V180", "ivory", 4) +
    r(420, 70, 120, 90, "ivory", 4) +
    c(480, 115, 26, "aqua") +
    floor(262, "sand") +
    rows(
      2,
      (i) =>
        r(150 + i * 250, 220, 90, 60, i ? "teal" : "coral", 12) +
        r(160 + i * 250, 280, 10, 70, "ink") +
        r(220 + i * 250, 280, 10, 70, "ink"),
    ) +
    r(280, 250, 80, 14, "copper", 5) +
    r(314, 264, 12, 80, "ink"),
  report: () =>
    r(0, 0, 640, 400, "sky") +
    r(60, 50, 230, 130, "copper", 6) +
    r(70, 60, 210, 110, "pearl", 3) +
    rows(6, (i) =>
      r(82 + (i % 3) * 66, 70 + Math.floor(i / 3) * 50, 52, 38, i % 2 ? "ivory" : "wheat", 2),
    ) +
    r(380, 80, 170, 110, "deep", 8) +
    rows(4, (i) => l(`M396 ${104 + i * 18} h${90 + (i % 2) * 40}`, "aqua", 3)) +
    floor(262, "sand") +
    r(330, 232, 270, 22, "copper", 6) +
    r(346, 254, 12, 100, "ink") +
    r(572, 254, 12, 100, "ink") +
    r(452, 190, 26, 42, "ink"),
};

/**
 * The picture of a scene: its backdrop and the people who stand in it.
 * @param {string} art an ART_IDS id (anything else draws the general "site")
 * @param {{ x:number, y:number, look:object|string, mood?:string }[]} people positions in percent of the picture
 */
export function sceneSVG(art, people = []) {
  const back = (SCENES[art] || SCENES.site)();
  const cast = people
    .map((who) =>
      characterSVG(
        lookOf(who.look),
        who.mood || "neutral",
        (who.x / 100) * VIEW.w,
        (who.y / 100) * VIEW.h + 6,
        0.92,
        who.x > 50,
      ),
    )
    .join("");
  return `<svg class="sim-art" viewBox="0 0 ${VIEW.w} ${VIEW.h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${back}${cast}</svg>`;
}

/** A head-and-shoulders portrait for the dialogue panel and the journal. */
export function portraitSVG(look, mood = "neutral", size = 72) {
  return `<svg class="sim-portrait" viewBox="-40 -80 80 96" width="${size}" height="${Math.round(size * 1.2)}" aria-hidden="true" focusable="false"><rect x="-40" y="-80" width="80" height="96" rx="14" class="sim-c-sky"/>${characterSVG(lookOf(look), mood, 0, 0, 1)}</svg>`;
}

/** Where each place sits on the map, in percent: the mission's own `map`, or an even layout when it has none. */
export function mapSpots(def, sceneIds) {
  const authored = new Map((def.map || []).map((m) => [m.scene, m]));
  const free = sceneIds.filter((id) => !authored.has(id));
  return sceneIds.map((id) => {
    if (authored.has(id)) return { scene: id, x: authored.get(id).x, y: authored.get(id).y };
    const i = free.indexOf(id);
    const perRow = Math.min(3, free.length);
    return {
      scene: id,
      x: ((i % perRow) + 0.5) * (100 / perRow),
      y: 30 + Math.floor(i / perRow) * 40,
    };
  });
}

const BUILDING = ["navy", "teal", "coral", "copper", "mid", "rose"];
/** The map of the mission's places: water, land, roads from the first place to the others, one building each. */
export function mapSVG(spots) {
  const at = (s) => [(s.x / 100) * VIEW.w, (s.y / 100) * VIEW.h];
  const [hx, hy] = spots.length ? at(spots[0]) : [320, 200];
  const roads = spots
    .slice(1)
    .map((s) => {
      const [x, y] = at(s);
      return l(`M${hx} ${hy} Q${(hx + x) / 2} ${hy} ${x} ${y}`, "ivory", 12);
    })
    .join("");
  const buildings = spots
    .map((s, i) => {
      const [x, y] = at(s);
      const cl = BUILDING[i % BUILDING.length];
      return (
        c(x, y + 8, 46, "sand") +
        r(x - 30, y - 34, 60, 44, cl, 5) +
        p(`M${x - 38} ${y - 32} L${x} ${y - 58} L${x + 38} ${y - 32} z`, "ink") +
        rows(2, (j) => r(x - 20 + j * 26, y - 24, 14, 14, "wheat", 2))
      );
    })
    .join("");
  return `<svg class="sim-art" viewBox="0 0 ${VIEW.w} ${VIEW.h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${r(0, 0, 640, 400, "aqua")}${p("M0 40 q120 -50 250 -10 t390 -20 v330 q-200 70 -380 30 t-260 20 z", "mint")}${l("M40 380 q60 -16 120 0 t120 0 M380 384 q60 -16 120 0 t120 0", "ivory", 3)}${roads}${buildings}</svg>`;
}

const GLYPHS = {
  listen: "M5 10v4h4l5 4V6l-5 4z M17 8.5a5 5 0 0 1 0 7",
  read: "M7 4h8l3 3v13H7z M10 10h6 M10 14h6",
  examine: "M10.5 4.5a6 6 0 1 0 0 12a6 6 0 0 0 0-12z M15 15l5 5",
  talk: "M4 5h16v10h-8l-5 4v-4H4z",
  task: "M5 19l1-5L16 4l4 4L10 18z M14 6l4 4",
  go: "M5 12h13 M13 7l5 5-5 5",
  done: "M5 12.5l4.5 4.5L19 7.5",
  lock: "M7 11h10v9H7z M9 11V8a3 3 0 0 1 6 0v3",
  map: "M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z M9 4v14 M15 6v14",
  journal: "M6 4h12v16H6z M9 8h6 M9 12h6 M9 16h3",
};
/** A small line glyph (24px grid) for a hotspot or a button. Decorative. */
export const glyph = (name) =>
  `<svg class="sim-glyph" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="${GLYPHS[name] || GLYPHS.examine}"/></svg>`;
