// Badge library: 37 badges, each a frame (hexagon, circle or shield by family) holding an emblem drawn around the
// origin (about +-24). Earned = solid frame, tinted inner plate, full colour and a check seal. Not yet earned =
// dashed frame, outline-only grey emblem and an empty dashed seal, so the two states differ without colour.
import { arrowHead, at, check, circ, cross, DASH, line, MONO, ngon, NOSTROKE, PAL, path, poly, rect, THIN } from "./core.js";
import { MOTIFS } from "./motifs.js";

const motif = (key, scale = 0.62) => (c) => at(0, 0, scale, MOTIFS[key](c));
const calendar = (filled) => (c) => {
  let cells = "";
  for (let i = 0; i < 35; i += 1) {
    const x = -15 + (i % 7) * 5;
    const y = -9 + Math.floor(i / 7) * 5.6;
    cells += i < filled ? circ(x, y, 2, c.teal, NOSTROKE) : circ(x, y, 1.8, c.white, `stroke="${c.soft}" stroke-width="1"`);
  }
  return rect(-21, -22, 42, 44, c.white, 5) + rect(-21, -22, 42, 9, c.amber, 5) + line(-21, -13, 21, -13, THIN) + cells;
};
const loop = (dotsN) => (c) =>
  path("M13 -9A16 16 0 1 0 14 4", "none", `stroke="${c.teal}" stroke-width="4"`) +
  arrowHead(14, 4, -0.2, 1, 6, `stroke="${c.teal}" stroke-width="4"`) +
  check(0, 0, 8, `stroke="${c.navy}" stroke-width="3.5"`) +
  Array.from({ length: dotsN }, (_, i) => circ((i - (dotsN - 1) / 2) * 9, 22, 3, c.amber)).join("");
const leaf = (c, flip) =>
  path(`M0 0Q${flip * 8} -16 ${flip * 22} -12Q${flip * 14} 4 0 0Z`, c.teal);

export const EMBLEMS = {
  "strand-number-sense": motif("counting"),
  "strand-add-sub": motif("addition"),
  "strand-place-value": motif("place-value"),
  "strand-mult-div": motif("multiplication"),
  "strand-fractions": motif("fractions"),
  "strand-decimals": motif("decimals"),
  "strand-ratios": motif("ratios"),
  "strand-expressions": motif("expressions"),
  "strand-geometry": motif("geometry"),
  "strand-data": motif("data"),
  "strand-number-system": motif("number-system"),
  "strand-functions": motif("linear"),
  "streak-3": calendar(3),
  "streak-7": calendar(7),
  "streak-14": calendar(14),
  "streak-30": calendar(30),
  "remembered-week": loop(1),
  "remembered-month": loop(2),
  "remembered-term": loop(3),
  "misconception-fixed": (c) =>
    rect(-24, -12, 17, 24, c.white, 4, `${DASH} stroke-width="2"`) +
    cross(-15.5, 0, 4, `stroke="${c.coral}" stroke-width="3"`) +
    arrowHead(-1, 0, 1, 0, 5) +
    line(-5, 0, -1, 0) +
    rect(7, -12, 17, 24, c.tealSoft, 4) +
    check(15.5, 0, 5, `stroke="${c.tealInk}" stroke-width="3.5"`),
  "review-keeper": motif("fluency", 0.66),
  "first-independent": (c) =>
    line(-24, 22, 24, 22) +
    rect(-20, 8, 18, 14, c.teal, 3) +
    line(-11, 8, -11, -14) +
    poly([[-11, -14], [6, -9], [-11, -4]], c.amber) +
    path("M6 16Q14 -2 22 8", "none", `${DASH} stroke-width="2"`),
  "growth-spurt": (c) =>
    path("M-22 22H22", "none", "") +
    path("M0 22V-6", "none", `stroke-width="3"`) +
    leaf(c, 1) +
    at(0, -6, 1, leaf(c, -1)) +
    at(0, 8, 1, path("M0 0Q-8 -14 -20 -10Q-12 4 0 0Z", c.blue)) +
    path("M-18 22Q0 12 18 22Z", c.amber),
  "explain-it": (c) =>
    path("M-24 -18H24V10H0L-12 21V10H-24Z", c.white) +
    line(-15, -9, 15, -9, THIN) +
    line(-15, -2, 6, -2, THIN) +
    circ(16, 1, 5, c.teal) +
    check(16, 1, 2.6, `stroke="${c.white}" stroke-width="1.8"`),
  "challenge-taker": (c) =>
    poly([[-26, 22], [-6, -14], [6, 4], [14, -6], [26, 22]], c.blue) +
    poly([[-6, -14], [-11, -5], [-6, -8], [-1, -4]], c.white, THIN) +
    path("M-18 18Q-14 8 -6 8", "none", `${DASH} stroke-width="2" stroke="${c.amber}"`) +
    line(-26, 22, 26, 22),
  "challenge-conquered": (c) =>
    poly([[-26, 22], [-6, -10], [6, 8], [14, -2], [26, 22]], c.blue) +
    line(-6, -10, -6, -24) +
    poly([[-6, -24], [10, -20], [-6, -16]], c.amber) +
    poly(ngon(18, -16, 7, 5), c.amber, THIN) +
    line(-26, 22, 26, 22),
  perseverance: (c) =>
    rect(-24, 10, 12, 12, c.tealSoft, 2) +
    rect(-12, 2, 12, 20, c.tealSoft, 2) +
    rect(0, -6, 12, 28, c.tealSoft, 2) +
    rect(12, -14, 12, 36, c.teal, 2) +
    path("M-22 4L-8 -10L-8 -2L6 -16L6 -8L18 -22", "none", `stroke="${c.amber}" stroke-width="3.2"`) +
    arrowHead(18, -22, 1, -1, 5, `stroke="${c.amber}" stroke-width="3.2"`),
  "mistake-detective": (c) =>
    circ(-4, -4, 16, c.blueSoft) +
    cross(-4, -4, 6, `stroke="${c.coral}" stroke-width="3.5"`) +
    path("M8 8L22 22", "none", `stroke-width="6"`) +
    path("M8 8L22 22", "none", `stroke="${c.amber}" stroke-width="2"`),
  "teach-back": (c) =>
    rect(-24, -22, 34, 28, c.white, 4) +
    poly([[-18, 0], [-8, -14], [2, 0]], c.teal, THIN) +
    line(-18, 0, 2, 0, THIN) +
    circ(17, -6, 6, c.amber) +
    path("M8 22Q8 10 17 10Q26 10 26 22Z", c.blue) +
    line(10, 6, 12, 4, ""),
  "writing-first": (c) =>
    rect(-22, -22, 30, 40, c.white, 4) +
    [-12, -4, 4, 12].map((y) => line(-16, y, 2, y, THIN)).join("") +
    poly([[8, 14], [14, 8], [24, -2], [20, -6], [10, 4], [6, 10]], c.amber) +
    poly([[6, 10], [8, 14], [4, 16]], c.navy, THIN),
  "game-explorer": (c) =>
    rect(-18, -18, 36, 36, c.white, 8, 'transform="rotate(-12)"') +
    circ(-8, -8, 3.4, c.teal, 'transform="rotate(-12)"') +
    circ(8, -8, 3.4, c.teal, 'transform="rotate(-12)"') +
    circ(0, 0, 3.4, c.amber, 'transform="rotate(-12)"') +
    circ(-8, 8, 3.4, c.teal, 'transform="rotate(-12)"') +
    circ(8, 8, 3.4, c.teal, 'transform="rotate(-12)"'),
  "family-partner": (c) =>
    circ(-9, -10, 8, c.blue) +
    path("M-24 20Q-24 4 -9 4Q6 4 6 20Z", c.blue) +
    circ(12, -2, 6, c.teal) +
    path("M2 20Q2 8 12 8Q22 8 22 20Z", c.teal) +
    path("M-26 20H26", "none", ""),
  "two-languages": (c) =>
    path("M-24 -18H8V4H-8L-16 12V4H-24Z", c.white) +
    line(-18, -9, 2, -9, THIN) +
    line(-18, -3, -4, -3, THIN) +
    path("M-2 -6H24V16H18V24L10 16H-2Z", c.tealSoft) +
    [4, 11, 18].map((x) => circ(x, 5, 1.8, c.teal, NOSTROKE)).join(""),
  "checkup-complete": (c) =>
    rect(-18, -20, 36, 44, c.white, 5) +
    rect(-8, -25, 16, 9, c.amber, 3) +
    [-8, 2, 12].map((y) => check(-9, y, 2.8, `stroke="${c.teal}" stroke-width="2.6"`) + line(-2, y, 12, y, THIN)).join(""),
  "steady-week": (c) =>
    Array.from({ length: 7 }, (_, i) => {
      const a = ((-90 + (360 / 7) * i) * Math.PI) / 180;
      return circ(20 * Math.cos(a), 20 * Math.sin(a), 5, c.teal);
    }).join("") + poly(ngon(0, 0, 9, 5), c.amber),
  "hint-wise": (c) =>
    circ(-12, -8, 10, c.amber) +
    circ(-12, -8, 3.6, c.white) +
    path("M-5 -1L20 24M12 16L18 10M17 21L22 16", "none", `stroke-width="4.5"`) +
    path("M-5 -1L20 24", "none", `stroke="${c.amber}" stroke-width="1.8"`),
  comeback: (c) =>
    path("M-14 22V-4A14 14 0 0 1 14 -4V10", "none", `stroke="${c.teal}" stroke-width="4"`) +
    arrowHead(14, 12, 0, 1, 6, `stroke="${c.teal}" stroke-width="4"`) +
    circ(0, 18, 4.6, c.amber, "") +
    path("M-22 22H-6", "none", ""),
};

/** id -> {family}. Family picks the frame shape and plate tint. */
const family = (id) =>
  id.startsWith("strand-") ? "strand" : /^(streak|remembered|steady|comeback|perseverance)/.test(id) ? "habit" : "skill";
export const BADGE_IDS = Object.freeze(Object.keys(EMBLEMS));

const FRAME = {
  strand: (fill, extra) => poly(ngon(48, 46, 40, 6, -90), fill, extra),
  habit: (fill, extra) => circ(48, 46, 39, fill, extra),
  skill: (fill, extra) =>
    path("M48 6L82 18V44C82 66 66 80 48 88C30 80 14 66 14 44V18Z", fill, extra),
};
const PLATE = { strand: PAL.tealSoft, habit: PAL.amberSoft, skill: PAL.blueSoft };

export function badgeSpec(id, earned) {
  const fam = family(id);
  const c = earned ? PAL : MONO;
  const plate = earned
    ? `<g transform="translate(48 46) scale(.82) translate(-48 -46)">${FRAME[fam](PLATE[fam], `stroke-width="2.4"`)}</g>`
    : "";
  const frame = FRAME[fam](earned ? PAL.white : PAL.paper2, earned ? 'stroke-width="3.5"' : `${DASH} stroke-width="3"`);
  const seal = earned
    ? circ(76, 76, 12, PAL.teal, 'stroke-width="2.5"') + check(76, 76, 5.5, `stroke="${PAL.white}" stroke-width="3"`)
    : circ(76, 76, 11, PAL.paper, `${DASH} stroke-width="2.4"`);
  return { vb: [96, 96], c, body: () => frame + plate + at(48, 44, 1, EMBLEMS[id](c)) + seal };
}
export { PAL };
