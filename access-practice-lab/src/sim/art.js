// Living Language Simulation Engine: illustration. Flat 2.5D scenes drawn as inline SVG (no images over the
// network, no libraries): one backdrop per `art` id, the people of a scene standing where their hotspot is, the
// mission map, portraits and the small glyphs on hotspots. Shapes are colored with sim-c-* / sim-s-* classes
// (sim.css maps them to Deep Harbor tokens), so the art follows the design system. Style: editorial picture-book
// flat art with no outlines; form comes from a shade side and a lit edge (the ink and ivory tokens at low
// opacity), soft contact shadows, glowing screens and one warm light from the upper left. Object positions match
// the hotspots, so geometry changes must move the hotspots too. All art is decorative: the meaning is carried by
// the labelled buttons the UI puts on top.
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
  neighbor: { skin: "#e0ac84", hair: "#8a5a2b", style: "ponytail", shirt: "#c8553d", acc: "none" },
  official: { skin: "#5c3a21", hair: "#1b1b1b", style: "short", shirt: "#123a5c", acc: "none" },
  reporter: { skin: "#c68642", hair: "#2b1b12", style: "curly", shirt: "#d28b58", acc: "none" },
  worker: { skin: "#f1c9a5", hair: "#2b1b12", style: "cap", shirt: "#5a9481", acc: "headphones" },
  student: { skin: "#c68642", hair: "#1b1b1b", style: "braids", shirt: "#2e4a94", acc: "none" },
});
export const lookOf = (look) =>
  look && typeof look === "object" ? look : LOOKS[look] || LOOKS.neighbor;

const r = (x, y, w, h, c, rx = 0, o = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="sim-c-${c}"${o ? ` opacity="${o}"` : ""}/>`;
const c = (x, y, rad, cl, o = "") =>
  `<circle cx="${x}" cy="${y}" r="${rad}" class="sim-c-${cl}"${o ? ` opacity="${o}"` : ""}/>`;
const e = (x, y, rx, ry, cl, o = "") =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="sim-c-${cl}"${o ? ` opacity="${o}"` : ""}/>`;
const p = (d, cl, o = "") => `<path d="${d}" class="sim-c-${cl}"${o ? ` opacity="${o}"` : ""}/>`;
const l = (d, cl, w = 3, o = "") =>
  `<path d="${d}" class="sim-s-${cl}" stroke-width="${w}"${o ? ` opacity="${o}"` : ""}/>`;
const rows = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join("");

// Form without outlines: a shade side and a lit edge are the ink and ivory tokens at low opacity, so every tone
// still comes from the design system (and follows it into dark mode).
const shadow = (x, y, rx, ry = rx * 0.16) => e(x, y, rx, ry, "ink", ".16");
/** A soft pool of light (or shade): stacked ellipses fade out toward the edge without a gradient id. */
const soft = (x, y, rx, ry, cl, o = 0.3) =>
  [1, 0.84, 0.68, 0.52, 0.36, 0.2].map((k) => e(x, y, rx * k, ry * k, cl, (o / 6).toFixed(3))).join("");
const box = (x, y, w, h, cl, rx = 0) =>
  r(x, y, w, h, cl, rx) +
  r(x + w * 0.76, y, w * 0.24, h, "ink", Math.min(rx, w * 0.12), ".13") +
  r(x, y, w, Math.min(5, h * 0.14), "ivory", Math.min(rx, 2), ".32");
/** A wall and a floor that recede: warm light from the upper left, a soft shadow where they meet. */
const room = (wall, y, fl) =>
  r(0, 0, 640, 400, wall) +
  soft(150, 30, 420, 230, "ivory", 0.42) +
  r(0, y, 640, 400 - y, fl) +
  r(0, y, 640, 8, "ink", 0, ".1") +
  r(0, y + (400 - y) * 0.55, 640, (400 - y) * 0.45, "ink", 0, ".05") +
  soft(330, y + (400 - y) * 0.42, 300, (400 - y) * 0.32, "ivory", 0.3);
const floor = (y, cl) => r(0, y, 640, 400 - y, cl) + r(0, y, 640, 6, "ink", 0, ".1");
/** A table or bench top on two legs, standing on the floor at `foot`. */
const table = (x, y, w, h, legs, foot, cl = "copper") =>
  shadow(x + w / 2, foot, w * 0.5, 7) +
  legs.map((lx) => r(lx, y + h, 12, foot - y - h, "navy", 2) + r(lx + 7, y + h, 5, foot - y - h, "ink", 1, ".25")).join("") +
  box(x, y, w, h, cl, 6) +
  r(x + 4, y + h - 4, w - 8, 4, "ink", 2, ".18");
const paper = (x, y, w = 44, h = 56) =>
  r(x + 2, y + 3, w, h, "ink", 3, ".12") +
  r(x, y, w, h, "ivory", 3) +
  r(x + w * 0.7, y, w * 0.3, h, "line", 3, ".18") +
  rows(4, (i) => l(`M${x + 6} ${y + 10 + i * 11} H${x + w - 6}`, "line", 2));
/** A screen that glows: dark glass, a soft light spilling onto the wall, a pale reflection. */
const screen = (x, y, w, h, cl = "deep") =>
  soft(x + w / 2, y + h / 2, w * 0.85, h * 0.95, "aqua", 0.24) +
  r(x - 5, y - 5, w + 10, h + 10, "mid", 10) +
  r(x, y, w, h, cl, 6) +
  p(`M${x} ${y + h} L${x + w * 0.42} ${y} H${x + w * 0.6} L${x + w * 0.18} ${y + h}Z`, "ivory", ".07");
const windowPane = (x, y, w, h) =>
  r(x - 6, y - 6, w + 12, h + 12, "ivory", 10) +
  r(x, y, w, h, "sky", 8) +
  soft(x + w * 0.3, y + h * 0.3, w * 0.6, h * 0.5, "ivory", 0.45) +
  p(`M${x} ${y + h} L${x + w * 0.38} ${y} H${x + w * 0.52} L${x + w * 0.14} ${y + h}Z`, "ivory", ".3") +
  l(`M${x} ${y + h / 2} H${x + w} M${x + w / 2} ${y} V${y + h}`, "ivory", 5);

const SCENES = {
  // City Square: skyline, plaza, loudspeaker pole, public board, bent sign.
  square: () =>
    r(0, 0, 640, 400, "sky") +
    soft(540, 62, 70, 70, "gold", 0.3) +
    c(540, 62, 30, "gold") +
    c(531, 53, 12, "ivory", ".4") +
    rows(7, (i) => box(i * 96 - 10, 96 - (i % 3) * 26, 84, 150 + (i % 3) * 26, i % 2 ? "navy" : "mid", 4)) +
    rows(7, (i) => rows(3, (j) => r(i * 96 + 4 + j * 24, 124 - (i % 3) * 20, 12, 16, "wheat", 2, (i + j) % 3 ? "" : ".55"))) +
    r(0, 0, 640, 250, "sky", 0, ".22") +
    floor(230, "sand") +
    soft(380, 312, 320, 70, "ivory", 0.4) +
    rows(6, (i) => l(`M${i * 128 - 40} 400 L${260 + i * 24} 230`, "line", 1.5, ".55")) +
    // loudspeaker pole
    shadow(90, 262, 26) +
    r(86, 110, 8, 150, "navy", 3) +
    r(90, 110, 4, 150, "ink", 2, ".3") +
    p("M66 96 h48 l10 34 h-68 z", "coral") +
    p("M100 96 h14 l10 34 h-24 z", "ink", ".16") +
    r(66, 96, 48, 4, "ivory", 2, ".35") +
    c(90, 114, 9, "ivory") +
    c(90, 114, 4, "ink", ".3") +
    // public board with notes
    shadow(282, 272, 80, 8) +
    r(238, 226, 8, 44, "navy") +
    r(318, 226, 8, 44, "navy") +
    box(214, 126, 136, 100, "copper", 6) +
    r(222, 134, 120, 84, "pearl", 3) +
    rows(6, (i) => r(230 + (i % 3) * 38, 142 + Math.floor(i / 3) * 38, 30, 30, "ink", 2, ".1")) +
    rows(6, (i) => r(228 + (i % 3) * 38, 140 + Math.floor(i / 3) * 38, 30, 30, i % 2 ? "ivory" : "wheat", 2)) +
    rows(6, (i) => c(243 + (i % 3) * 38, 143 + Math.floor(i / 3) * 38, 2.5, "coral")) +
    // bent sign and fallen branch
    shadow(560, 292, 40, 6) +
    l("M560 290 L572 180", "navy", 6) +
    p("M536 150 h70 l-8 34 h-70 z", "teal") +
    p("M578 150 h28 l-8 34 h-28 z", "ink", ".16") +
    l("M500 300 q40 -20 96 6 M540 292 l-10 -16 M566 296 l8 -18", "sage", 6) +
    e(522, 280, 10, 6, "sage") +
    e(574, 276, 9, 5, "sage") +
    // fountain
    shadow(355, 328, 66, 8) +
    p("M300 300 h110 l-14 26 h-82 z", "pearl") +
    p("M370 300 h40 l-14 26 h-26 z", "ink", ".12") +
    e(355, 300, 55, 6, "aqua") +
    l("M355 300 v-26 M355 274 q-16 6 -18 22 M355 274 q16 6 18 22", "aqua", 3),
  // Science Laboratory: screens, weather station strip, bench with a test radio.
  lab: () =>
    room("mint", 250, "sand") +
    p("M380 160 H600 L660 400 H330 Z", "ivory", ".16") +
    windowPane(380, 40, 220, 120) +
    screen(70, 84, 150, 104) +
    l("M84 160 l22 -30 22 14 22 -40 22 26 26 -18", "aqua", 3) +
    paper(232, 104, 30, 96) +
    table(40, 236, 560, 26, [60, 566], 372) +
    // flasks and the test radio
    p("M300 236 v-30 h-6 v-8 h28 v8 h-6 v30 z", "aqua") +
    r(300, 214, 5, 20, "ivory", 2, ".55") +
    p("M350 236 l14 -40 h-6 v-8 h20 v8 h-6 l14 40 z", "coral") +
    p("M372 196 l14 40 h-10 l-10 -40 z", "ink", ".15") +
    box(430, 200, 84, 36, "navy", 6) +
    c(452, 218, 9, "gold") +
    c(449, 215, 3, "ivory", ".6") +
    rows(3, (i) => r(472, 210 + i * 7, 30, 3, "mid", 1.5)) +
    l("M500 200 v-34", "navy", 3),
  // Newsroom: stories on a line, festival poster, answering machine, the fact-check desk.
  newsroom: () =>
    room("pearl", 262, "sand") +
    l("M0 62 Q320 96 640 62", "ink", 1.5) +
    rows(6, (i) => paper(40 + i * 100, 70 + (i % 2) * 8, 40, 50)) +
    // poster
    r(234, 63, 76, 96, "ink", 4, ".12") +
    box(232, 60, 76, 96, "navy", 4) +
    rows(3, (i) => c(252 + i * 18, 96 + (i % 2) * 14, 8, "gold")) +
    r(242, 134, 56, 5, "ivory", 2, ".7") +
    r(242, 143, 38, 4, "ivory", 2, ".5") +
    // shelf with answering machine
    r(440, 186, 150, 6, "ink", 2, ".12") +
    box(440, 176, 150, 10, "copper", 3) +
    box(468, 146, 64, 30, "navy", 5) +
    c(520, 160, 5, "coral") +
    c(520, 160, 10, "coral", ".25") +
    r(476, 154, 30, 6, "mid", 3) +
    // writing desk with the draft
    table(60, 232, 170, 18, [74, 204], 350) +
    paper(104, 188, 46, 44) +
    // fact-check desk
    shadow(320, 352, 300, 10) +
    box(20, 318, 600, 24, "teal", 6) +
    rows(2, (i) => paper(40 + i * 500, 280, 54, 38)),
  // Communication Center: racks of green lights, relay terminal, wall chart, clipboard, whiteboard.
  comms: () =>
    r(0, 0, 640, 400, "deep") +
    soft(320, 110, 360, 160, "mid", 0.6) +
    screen(230, 60, 150, 100, "navy") +
    l("M246 140 h20 v-22 h24 v-14 h24 v-40 h24 v60 h20", "gold", 3) +
    r(421, 66, 120, 86, "ink", 6, ".3") +
    box(418, 62, 120, 86, "ivory", 6) +
    l("M434 86 h70 M434 106 h88 M434 126 h52", "line", 3) +
    box(60, 120, 130, 96, "mid", 8) +
    r(72, 132, 106, 62, "deep", 4) +
    soft(125, 163, 70, 40, "aqua", 0.2) +
    rows(4, (i) => l(`M80 ${144 + i * 12} h${60 + (i % 2) * 24}`, "aqua", 2)) +
    floor(262, "navy") +
    soft(320, 320, 320, 60, "mid", 0.5) +
    rows(
      4,
      (i) =>
        shadow(95 + i * 150, 266, 60, 6) +
        box(40 + i * 150, 232, 110, 30, "mid", 4) +
        rows(6, (j) => {
          const cl = (i + j) % 5 ? "sage" : "gold";
          return c(54 + i * 150 + j * 16, 247, 8, cl, ".25") + c(54 + i * 150 + j * 16, 247, 4, cl);
        }),
    ) +
    box(526, 176, 50, 66, "copper", 4) +
    r(532, 186, 38, 50, "ivory", 2) +
    rows(3, (i) => l(`M538 ${198 + i * 10} h${18 + (i % 2) * 8}`, "line", 2)) +
    r(544, 172, 14, 8, "line", 2) +
    paper(196, 262, 44, 40),
  // Emergency Operations Room: wall map, decision board, microphone, long table, red telephone.
  ops: () =>
    room("sky", 262, "sand") +
    r(253, 34, 140, 104, "ink", 6, ".12") +
    box(250, 30, 140, 104, "ivory", 6) +
    p("M250 100 q40 -40 80 -10 t60 -20 v64 h-140 z", "aqua") +
    p("M250 120 q50 -20 90 -4 t50 -10 v28 h-140 z", "teal", ".35") +
    c(300, 74, 5, "coral") +
    c(300, 74, 10, "coral", ".25") +
    c(350, 62, 5, "navy") +
    r(407, 60, 130, 110, "ink", 6, ".14") +
    box(404, 56, 130, 110, "navy", 6) +
    rows(3, (i) => r(414, 68 + i * 32, 110, 22, i === 1 ? "gold" : "ivory", 4)) +
    rows(3, (i) => r(422, 76 + i * 32, 50 + (i % 2) * 20, 5, i === 1 ? "navy" : "line", 2, ".7")) +
    box(46, 86, 62, 36, "pearl", 4) +
    p("M56 104 q20 -22 42 0 v8 h-42 z", "coral") +
    // microphone on its stand
    l("M218 214 v-80", "navy", 4) +
    c(218, 124, 12, "navy") +
    c(214, 120, 4, "ivory", ".4") +
    table(40, 214, 560, 30, [64, 562], 364) +
    rows(3, (i) => paper(86 + i * 26, 186, 40, 28)) +
    paper(426, 190, 46, 30),
  // General-purpose places for compiled experiences.
  site: () =>
    r(0, 0, 640, 400, "sky") +
    soft(96, 70, 64, 64, "gold", 0.3) +
    c(96, 70, 28, "gold") +
    c(88, 62, 11, "ivory", ".4") +
    p("M0 210 q120 -60 260 -24 t380 -30 v120 h-640 z", "sage", ".45") +
    p("M0 250 q160 -90 320 -20 t320 -30 v200 h-640 z", "sage") +
    shadow(470, 262, 110, 10) +
    box(380, 130, 180, 130, "ivory", 6) +
    p("M366 134 l104 -60 104 60 z", "coral") +
    p("M470 74 l104 60 h-104 z", "ink", ".16") +
    box(450, 196, 40, 64, "navy", 4) +
    rows(2, (i) => r(398 + i * 110, 156, 34, 30, "aqua", 3) + r(400 + i * 110, 158, 10, 26, "ivory", 2, ".4")) +
    floor(260, "sand") +
    l("M470 262 q-60 60 -200 138", "ivory", 18),
  records: () =>
    room("pearl", 262, "sand") +
    rows(
      3,
      (i) =>
        rows(14, (j) => {
          const y = 2 + i * 70 + (j % 3) * 3;
          return r(52 + j * 39, y, 26, 38 - (j % 3) * 3, ["navy", "teal", "coral", "gold", "sage"][(i + j) % 5], 3) + r(70 + j * 39, y, 8, 38 - (j % 3) * 3, "ink", 2, ".14");
        }) +
        r(40, 50 + i * 70, 560, 8, "ink", 3, ".14") +
        box(40, 40 + i * 70, 560, 10, "copper", 3),
    ) +
    table(170, 236, 300, 22, [186, 442], 358) +
    paper(290, 196, 50, 40),
  interview: () =>
    room("mint", 262, "sand") +
    p("M60 180 H260 L320 400 H20 Z", "ivory", ".14") +
    windowPane(60, 50, 200, 130) +
    r(423, 74, 120, 90, "ink", 4, ".12") +
    box(420, 70, 120, 90, "ivory", 4) +
    c(480, 115, 26, "aqua") +
    c(472, 107, 9, "ivory", ".45") +
    rows(
      2,
      (i) =>
        shadow(195 + i * 250, 352, 56, 7) +
        r(160 + i * 250, 280, 10, 70, "navy", 2) +
        r(220 + i * 250, 280, 10, 70, "navy", 2) +
        box(150 + i * 250, 220, 90, 60, i ? "teal" : "coral", 12),
    ) +
    shadow(320, 346, 40, 5) +
    r(314, 264, 12, 80, "navy", 2) +
    box(280, 250, 80, 14, "copper", 5),
  report: () =>
    room("sky", 262, "sand") +
    r(63, 54, 230, 130, "ink", 6, ".12") +
    box(60, 50, 230, 130, "copper", 6) +
    r(70, 60, 210, 110, "pearl", 3) +
    rows(6, (i) => r(82 + (i % 3) * 66, 70 + Math.floor(i / 3) * 50, 52, 38, i % 2 ? "ivory" : "wheat", 2)) +
    rows(6, (i) => c(108 + (i % 3) * 66, 73 + Math.floor(i / 3) * 50, 2.5, "coral")) +
    screen(380, 80, 170, 110) +
    rows(4, (i) => l(`M396 ${104 + i * 18} h${90 + (i % 2) * 40}`, "aqua", 3)) +
    table(330, 232, 270, 22, [346, 572], 354) +
    r(452, 190, 26, 42, "navy") +
    r(440, 228, 50, 6, "navy", 3),
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
  const back =
    r(-40, -80, 80, 96, "sky", 14) +
    soft(-14, -58, 50, 50, "ivory", 0.5) +
    e(0, 16, 46, 14, "ink", ".1");
  return `<svg class="sim-portrait" viewBox="-40 -80 80 96" width="${size}" height="${Math.round(size * 1.2)}" aria-hidden="true" focusable="false">${back}${characterSVG(lookOf(look), mood, 0, 0, 1)}</svg>`;
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

const BUILDING = ["navy", "teal", "coral", "copper", "mid", "sage"];
const ROOF = ["coral", "copper", "navy", "teal", "gold", "navy"];
/** The map of the mission's places: water, land, roads from the first place to the others, one building each. */
export function mapSVG(spots) {
  const at = (s) => [(s.x / 100) * VIEW.w, (s.y / 100) * VIEW.h];
  const [hx, hy] = spots.length ? at(spots[0]) : [320, 200];
  const roads = spots
    .slice(1)
    .map((s) => {
      const [x, y] = at(s);
      const d = `M${hx} ${hy} Q${(hx + x) / 2} ${hy} ${x} ${y}`;
      return l(d, "line", 16, ".5") + l(d, "ivory", 12);
    })
    .join("");
  const buildings = spots
    .map((s, i) => {
      const [x, y] = at(s);
      const k = i % BUILDING.length;
      return (
        e(x, y + 10, 50, 22, "sand") +
        e(x + 6, y + 12, 38, 9, "ink", ".18") +
        box(x - 30, y - 34, 60, 44, BUILDING[k], 5) +
        p(`M${x - 38} ${y - 32} L${x} ${y - 58} L${x + 38} ${y - 32} z`, ROOF[k]) +
        p(`M${x} ${y - 58} L${x + 38} ${y - 32} H${x} z`, "ink", ".18") +
        rows(2, (j) => r(x - 20 + j * 26, y - 24, 14, 14, "wheat", 2)) +
        r(x - 5, y - 4, 10, 14, "ink", 2, ".35")
      );
    })
    .join("");
  const land =
    p("M0 40 q120 -50 250 -10 t390 -20 v330 q-200 70 -380 30 t-260 20 z", "sage", ".35") +
    p("M0 34 q120 -50 250 -10 t390 -20 v330 q-200 70 -380 30 t-260 20 z", "mint") +
    soft(180, 150, 170, 90, "ivory", 0.4);
  return `<svg class="sim-art" viewBox="0 0 ${VIEW.w} ${VIEW.h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${r(0, 0, 640, 400, "aqua")}${land}${l("M40 380 q60 -16 120 0 t120 0 M380 384 q60 -16 120 0 t120 0", "ivory", 3)}${roads}${buildings}</svg>`;
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
// The tonal body under each line glyph (a soft fill in the current colour), so icons read as solid objects.
const BODIES = {
  listen: "M5 10v4h4l5 4V6l-5 4z",
  read: "M7 4h8l3 3v13H7z",
  examine: "M10.5 4.5a6 6 0 1 0 0 12a6 6 0 0 0 0-12z",
  talk: "M4 5h16v10h-8l-5 4v-4H4z",
  task: "M5 19l1-5L16 4l4 4L10 18z",
  go: "M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z",
  done: "M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z",
  lock: "M7 11h10v9H7z",
  map: "M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z",
  journal: "M6 4h12v16H6z",
};
/** A small glyph (24px grid) for a hotspot or a button: a soft tonal body and a line drawing, both in the current colour. Decorative. */
export const glyph = (name) => {
  const k = GLYPHS[name] ? name : "examine";
  return `<svg class="sim-glyph" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="${BODIES[k]}" fill="currentColor" stroke="none" opacity=".18"/><path d="${GLYPHS[k]}"/></svg>`;
};
