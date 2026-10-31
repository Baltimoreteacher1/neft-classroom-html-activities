// Wide header illustrations (640 x 160) and report header strips (640 x 96). Calm tinted panel on the left so a
// title can sit there; the picture lives on the right. Every scene is built only from palette shapes.
import { arrowHead, at, check, circ, DASH, line, ngon, NOSTROKE, path, poly, rect, star, THIN } from "./core.js";
import { MOTIFS } from "./motifs.js";

export const HEADER_VB = [640, 160];
export const REPORT_VB = [640, 96];

/** Four-point sparkle, used sparingly as a highlight. */
const spark = (x, y, s, fill) =>
  path(`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`, fill, 'stroke-width="1.6"');
const hill = (x, w, h, fill, base = 160) => path(`M${x} ${base}Q${x + w / 2} ${base - h * 1.6} ${x + w} ${base}Z`, fill);
const card = (x, y, w, h, fill, rot = 0) => rect(x, y, w, h, fill, 8, rot ? `transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"` : "");
const bars = (x, y, heights, fills, w = 10, gap = 6) =>
  heights.map((h, i) => rect(x + i * (w + gap), y - h, w, h, fills[i % fills.length], 2)).join("");

const SCENES = {
  dashboard: (c) =>
    circ(560, 38, 18, c.amber) +
    hill(330, 220, 70, c.blue) +
    hill(440, 190, 60, c.teal) +
    hill(380, 140, 40, c.tealInk) +
    path("M340 156C400 130 380 96 450 100S500 70 560 50", "none", `stroke="${c.amber}" stroke-width="9"`) +
    path("M340 156C400 130 380 96 450 100S500 70 560 50", "none", `stroke="${c.white}" stroke-width="2" ${DASH}`) +
    line(560, 50, 560, 22) +
    poly([[560, 22], [582, 29], [560, 36]], c.coral) +
    card(340, 24, 84, 56, c.white, -4) +
    bars(358, 62, [10, 18, 28], [c.teal, c.blue, c.amber], 10, 6) +
    card(440, 20, 70, 44, c.white, 3) +
    circ(466, 42, 12, c.tealSoft) +
    path("M466 42V30A12 12 0 0 1 478 42Z", c.teal) +
    line(486, 36, 500, 36, THIN) +
    line(486, 44, 498, 44, THIN),

  practice: (c) =>
    card(350, 28, 110, 104, c.white, -6) +
    [0, 1, 2].map((r) => [0, 1, 2, 3].map((k) => circ(376 + k * 20, 56 + r * 20, 6.5, r === 2 ? c.blue : c.teal)).join("")).join("") +
    path("M366 118H440", "none", `stroke="${c.amber}" stroke-width="5"`) +
    card(470, 40, 120, 96, c.white, 5) +
    [0, 1, 2].map((i) => line(490, 66 + i * 22, 560, 66 + i * 22, THIN) + check(580 - 0, 66 + i * 22, 0.1, NOSTROKE)).join("") +
    [0, 1, 2].map((i) => check(574, 66 + i * 22, 6, `stroke="${c.teal}" stroke-width="3"`)).join("") +
    poly([[486, 138], [570, 52], [582, 64], [498, 150]], c.amber, 'transform="translate(30 -20) rotate(0)"') +
    spark(340, 28, 8, c.amber),

  review: (c) =>
    line(330, 112, 612, 112) +
    [0, 1, 2, 3, 4].map((i) => {
      const x = [350, 390, 450, 530, 600][i];
      return line(x, 106, x, 118, THIN) + circ(x, 112, 5 + i * 2.5, i === 4 ? c.teal : c.white, "");
    }).join("") +
    [0, 1, 2, 3].map((i) => {
      const x1 = [350, 390, 450, 530][i];
      const x2 = [390, 450, 530, 600][i];
      return path(`M${x1} 98Q${(x1 + x2) / 2} ${60 - i * 6} ${x2} 98`, "none", `stroke="${c.amber}" stroke-width="3" ${DASH}`);
    }).join("") +
    card(340, 26, 52, 40, c.white, -8) +
    card(352, 22, 52, 40, c.blueSoft, 2) +
    circ(378, 42, 6, c.teal) +
    arrowHead(600, 98, 0.4, 1, 6, `stroke="${c.amber}" stroke-width="3"`),

  challenge: (c) =>
    poly([[330, 150], [420, 40], [470, 100], [500, 70], [610, 150]], c.blue) +
    poly([[420, 40], [398, 68], [412, 62], [424, 74], [436, 62], [444, 68]], c.white, THIN) +
    path("M350 148C380 120 400 130 420 100S470 110 500 78", "none", `stroke="${c.amber}" stroke-width="4" ${DASH}`) +
    line(420, 40, 420, 14) +
    poly([[420, 14], [442, 21], [420, 28]], c.amber) +
    poly(star(570, 36, 12, 5), c.amber, THIN) +
    spark(340, 34, 8, c.teal) +
    path("M330 150H610", "none", ""),

  games: (c) =>
    path("M350 120H410V80H470V120H530V60H590", "none", `stroke="${c.white}" stroke-width="16"`) +
    path("M350 120H410V80H470V120H530V60H590", "none", `stroke-width="2.5" ${DASH}`) +
    [[350, 120], [410, 80], [470, 120], [530, 60], [590, 60]].map(([x, y], i) => circ(x, y, 11, [c.teal, c.blue, c.amber, c.teal, c.blue][i])).join("") +
    circ(470, 120, 4, c.navy, NOSTROKE) +
    rect(350, 24, 36, 36, c.white, 9, 'transform="rotate(-10 368 42)"') +
    [[358, 32], [378, 32], [368, 42], [358, 52], [378, 52]].map(([x, y]) => circ(x, y, 3, c.navy, NOSTROKE)).join("") +
    poly([[430, 56], [450, 24], [470, 56]], c.teal) +
    rect(490, 26, 28, 28, c.amber, 6) +
    circ(560, 40, 15, c.blue),

  writing: (c) =>
    card(340, 20, 150, 124, c.white, -3) +
    [0, 1, 2, 3, 4].map((i) => line(362, 52 + i * 18, 466, 52 + i * 18, THIN)).join("") +
    rect(358, 36, 52, 10, c.teal, 3) +
    rect(358, 54, 84, 10, c.blue, 3) +
    rect(358, 72, 40, 10, c.amber, 3) +
    path("M520 52H590V92H550L534 108V92H520Z", c.white) +
    line(532, 64, 576, 64, THIN) +
    line(532, 76, 562, 76, THIN) +
    poly([[500, 140], [574, 66], [588, 80], [514, 154]], c.amber) +
    poly([[500, 140], [514, 154], [494, 158]], c.navy, THIN) +
    spark(600, 30, 8, c.teal),

  progress: (c) =>
    bars(350, 140, [24, 42, 60, 80, 100], [c.blueSoft, c.tealSoft, c.teal, c.teal, c.amber], 34, 12) +
    path("M367 90L413 66L459 46L505 26L551 18", "none", `stroke-width="3.5"`) +
    [[367, 90], [413, 66], [459, 46], [505, 26]].map(([x, y], i) => circ(x, y, 7, [c.white, c.white, c.teal, c.teal][i])).join("") +
    poly(star(551, 18, 14, 6, 5), c.amber) +
    path("M340 148H620", "none", `stroke="${c.line}" stroke-width="3"`),

  teacher: (c) =>
    card(336, 16, 170, 110, c.white, 0) +
    bars(358, 98, [24, 40, 56, 34, 48], [c.teal, c.blue], 16, 10) +
    line(352, 100, 492, 100, THIN) +
    path("M358 62L396 48L434 56L474 34", "none", `stroke="${c.amber}" stroke-width="3.5"`) +
    [0, 1, 2, 3, 4, 5].map((i) => [0, 1].map((k) => circ(534 + i * 14, 40 + k * 16, 5, i === 3 && k === 1 ? c.amber : c.teal)).join("")).join("") +
    card(530, 76, 80, 64, c.white, 3) +
    [0, 1, 2].map((i) => check(546, 94 + i * 16, 4, `stroke="${c.teal}" stroke-width="2.4"`) + line(558, 94 + i * 16, 596, 94 + i * 16, THIN)).join("") +
    line(386, 126, 386, 148) +
    line(456, 126, 456, 148),

  family: (c) =>
    poly([[360, 80], [440, 24], [520, 80]], c.blue) +
    rect(372, 80, 136, 62, c.white, 4) +
    rect(484, 36, 14, 24, c.navy2, 2) +
    rect(392, 98, 28, 44, c.amber, 4) +
    rect(440, 96, 44, 30, c.tealSoft, 4) +
    line(462, 96, 462, 126, THIN) +
    line(440, 111, 484, 111, THIN) +
    circ(548, 80, 10, c.teal) +
    path("M532 142Q532 96 548 96Q564 96 564 142Z", c.teal) +
    circ(584, 104, 8, c.amber) +
    path("M572 142Q572 116 584 116Q596 116 596 142Z", c.amber) +
    line(330, 142, 620, 142, `stroke="${c.line}" stroke-width="3"`) +
    spark(600, 40, 9, c.amber),
};
export const HEADER_KINDS = Object.freeze(Object.keys(SCENES));
const TINT = {
  dashboard: "tealSoft",
  practice: "blueSoft",
  review: "amberSoft",
  challenge: "blueSoft",
  games: "tealSoft",
  writing: "amberSoft",
  progress: "blueSoft",
  teacher: "paper",
  family: "amberSoft",
};
/** Subtle left-to-right line texture so the calm half is not flat. */
const texture = (c) =>
  [0, 1, 2].map((i) => path(`M-10 ${150 - i * 18}Q150 ${96 - i * 18} 320 ${150 - i * 18}`, "none", `stroke="${c.white}" stroke-width="3"`)).join("");

/** Soft white discs behind the picture give it a stage without adding a colour. */
const backdrop = (c) =>
  circ(486, 88, 92, c.white, `${NOSTROKE} fill-opacity=".55"`) + circ(486, 88, 64, c.white, `${NOSTROKE} fill-opacity=".6"`) + circ(600, 130, 30, c.white, `${NOSTROKE} fill-opacity=".5"`);

export function headerSpec(kind) {
  const key = SCENES[kind] ? kind : "dashboard";
  return {
    vb: HEADER_VB,
    natural: 640,
    tint: TINT[key],
    body: (id, c) => `<clipPath id="${id("p")}"><rect width="640" height="160" rx="16"/></clipPath><g clip-path="url(#${id("p")})">${texture(c)}${backdrop(c)}<g transform="translate(620 84) scale(1.1) translate(-620 -84)">${SCENES[key](c)}</g></g>`,
  };
}

const disc = (c, ...kids) => circ(64, 46, 34, c.white) + at(64, 46, 1, ...kids);
const REPORTS = {
  student: (c) =>
    disc(c, check(0, 0, 14, `stroke="${c.teal}" stroke-width="6"`)) +
    circ(100, 18, 5, c.amber, NOSTROKE) +
    bars(486, 78, [24, 38, 54, 66], [c.teal, c.blue, c.teal, c.amber], 20, 10) +
    poly(star(596, 24, 14, 6), c.amber, "") +
    path("M400 78H620", "none", `stroke="${c.white}" stroke-width="4"`),
  teacher: (c) =>
    disc(c, rect(-16, -20, 32, 40, c.tealSoft, 4), ...[0, 1, 2].map((i) => line(-9, -9 + i * 9, 9, -9 + i * 9, THIN))) +
    [0, 1, 2, 3, 4, 5, 6].map((i) => [0, 1, 2].map((k) => circ(440 + i * 24, 26 + k * 22, 8, i === 3 && k === 1 ? c.amber : i % 2 ? c.blue : c.teal)).join("")).join(""),
  family: (c) =>
    disc(c, poly([[-18, -2], [0, -20], [18, -2]], c.blue), rect(-13, -2, 26, 18, c.amberSoft, 3)) +
    circ(500, 38, 13, c.teal) +
    path("M476 84Q476 54 500 54Q524 54 524 84Z", c.teal) +
    circ(558, 50, 10, c.amber) +
    path("M540 84Q540 62 558 62Q576 62 576 84Z", c.amber) +
    circ(600, 60, 7, c.blue) +
    path("M588 84Q588 68 600 68Q612 68 612 84Z", c.blue),
};
export const REPORT_KINDS = Object.freeze(Object.keys(REPORTS));
export function reportSpec(kind) {
  const key = REPORTS[kind] ? kind : "student";
  return {
    vb: REPORT_VB,
    natural: 640,
    tint: { student: "tealSoft", teacher: "paper", family: "amberSoft" }[key],
    body: (id, c) =>
      `<clipPath id="${id("p")}"><rect width="640" height="96" rx="14"/></clipPath><g clip-path="url(#${id("p")})">` +
      REPORTS[key](c) +
      `</g>`,
  };
}
export { MOTIFS, at, ngon };
