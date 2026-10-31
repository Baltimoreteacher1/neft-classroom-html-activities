// Spot illustrations (240 x 180 and 280 x 200): empty states, onboarding steps and family scenes.
import { arrowHead, at, check, circ, DASH, line, ngon, NOSTROKE, path, poly, rect, star, THIN } from "./core.js";
import { MOTIFS } from "./motifs.js";

export const SPOT_VB = [240, 180];
export const ONBOARD_VB = [280, 200];
const spark = (x, y, s, fill) =>
  path(`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`, fill, 'stroke-width="1.6"');
const person = (x, y, s, head, body) =>
  at(x, y, s, `<g stroke-width="${Math.round(25 / s) / 10}">${circ(0, -30, 10, head, "stroke-width=\"2.5\"")}${path("M-16 0Q-16 -20 0 -20Q16 -20 16 0Z", body)}</g>`);
const sheet = (x, y, w, h, c, rot = 0) => rect(x, y, w, h, c.white, 8, rot ? `transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"` : "");
const ground = (c, y = 150) => line(20, y, 220, y, `stroke="${c.line}" stroke-width="3"`);

const EMPTY = {
  start: (c) =>
    circ(62, 46, 17, c.amber) +
    path("M10 150Q60 100 120 118T230 90V150Z", c.tealSoft) +
    path("M30 150C70 130 60 108 110 108S150 92 170 82", "none", `stroke="${c.white}" stroke-width="12"`) +
    path("M30 150C70 130 60 108 110 108S150 92 170 82", "none", `${DASH} stroke-width="2.4"`) +
    [[48, 138], [84, 118]].map(([x, y], i) => circ(x, y, 9, i ? c.white : c.teal)).join("") +
    line(170, 82, 170, 40) +
    poly([[170, 40], [200, 50], [170, 60]], c.coral) +
    spark(204, 40, 9, c.teal) +
    spark(120, 34, 6, c.amber),
  "no-results": (c) =>
    [0, 1, 2].map((r) => [0, 1, 2].map((k) => rect(50 + k * 42, 36 + r * 36, 32, 28, c.white, 6, `${DASH} stroke-width="2"`)).join("")).join("") +
    circ(118, 84, 34, c.blueSoft, "") +
    path("M143 109L184 150", "none", 'stroke-width="9"') +
    path("M143 109L184 150", "none", `stroke="${c.amber}" stroke-width="3"`) +
    line(104, 84, 132, 84, 'stroke-width="4"'),
  "all-done": (c) =>
    sheet(54, 64, 112, 76, c, -6) +
    sheet(62, 48, 112, 76, c, 3) +
    [0, 1, 2].map((i) => check(86, 74 + i * 18, 6, `stroke="${c.teal}" stroke-width="3.4"`) + line(104, 74 + i * 18, 150, 74 + i * 18, THIN)).join("") +
    poly(star(182, 52, 18, 8, 5), c.amber) +
    spark(36, 44, 9, c.teal) +
    circ(200, 112, 5, c.blue) +
    rect(24, 104, 10, 10, c.amber, 2, 'transform="rotate(20 29 109)"') +
    path("M196 140q8 -14 16 0", "none", `stroke="${c.teal}" stroke-width="3"`),
  offline: (c) =>
    rect(40, 62, 128, 82, c.white, 10) +
    rect(50, 72, 108, 60, c.blueSoft, 4) +
    [0, 1, 2, 3].map((i) => rect(64 + i * 22, 120 - [12, 22, 32, 42][i], 14, [12, 22, 32, 42][i], i === 3 ? c.amber : c.teal, 2)).join("") +
    path("M24 154H184", "none", 'stroke-width="5"') +
    path("M166 56a14 14 0 0 1 8 -26a20 20 0 0 1 38 4a12 12 0 0 1 -2 22Z", c.white, `${DASH} stroke-width="2.4"`) +
    line(170, 66, 214, 24, `stroke="${c.coral}" stroke-width="4"`),
};
export const EMPTY_KINDS = Object.freeze(Object.keys(EMPTY));
export const emptySpec = (kind) => ({ vb: SPOT_VB, natural: 240, tint: "paper", body: (id, c) => EMPTY[EMPTY[kind] ? kind : "start"](c) });

const ONBOARD = {
  1: (c) =>
    circ(140, 94, 56, c.amber, "") +
    path("M40 150Q90 134 140 150Q190 134 240 150V168H40Z", c.white) +
    path("M140 150V92Q112 80 70 88V146Q112 138 140 150ZM140 150V92Q168 80 210 88V146Q168 138 140 150Z", c.blueSoft) +
    spark(46, 52, 10, c.teal) +
    spark(236, 62, 8, c.teal),
  2: (c) =>
    sheet(82, 30, 116, 146, c) +
    rect(124, 22, 32, 16, c.amber, 5) +
    [0, 1, 2].map((i) => check(104, 72 + i * 28, 6, `stroke="${c.teal}" stroke-width="3.4"`) + line(124, 72 + i * 28, 176, 72 + i * 28, THIN)).join("") +
    circ(46, 118, 20, c.blueSoft) +
    path("M60 132L80 152", "none", 'stroke-width="6"') +
    spark(236, 56, 9, c.amber),
  3: (c) =>
    [0, 1, 2, 3].map((i) => rect(40 + i * 48, 126 - i * 20, 44, 24 + i * 20 + 0, [c.tealSoft, c.tealSoft, c.teal, c.teal][i], 4)).join("") +
    circ(62, 112, 9, c.amber) +
    path("M62 96Q104 52 146 74", "none", `${DASH} stroke-width="2.4"`) +
    arrowHead(146, 74, 1, 0.6, 6) +
    at(212, 32, 0.7, MOTIFS.counting(c)) +
    spark(36, 56, 9, c.teal),
  4: (c) =>
    path("M50 158H230", "none", 'stroke-width="3"') +
    path("M140 158V76", "none", 'stroke-width="4"') +
    path("M140 112Q112 112 100 84Q130 80 140 112Z", c.teal) +
    path("M140 94Q168 94 180 66Q150 62 140 94Z", c.blue) +
    path("M104 158Q140 140 176 158Z", c.amber) +
    poly(ngon(222, 70, 22, 6), c.white) +
    check(222, 70, 8, `stroke="${c.teal}" stroke-width="4"`) +
    spark(60, 70, 10, c.amber),
};
export const ONBOARD_STEPS = Object.freeze([1, 2, 3, 4]);
export const onboardSpec = (step) => ({ vb: ONBOARD_VB, natural: 280, tint: "blueSoft", body: (id, c) => ONBOARD[ONBOARD[step] ? step : 1](c) });

const FAMILY = {
  home: (c) =>
    poly([[56, 84], [120, 32], [184, 84]], c.blue) +
    rect(66, 84, 108, 66, c.white, 4) +
    rect(148, 40, 12, 20, c.navy2, 2) +
    rect(80, 104, 24, 46, c.amber, 4) +
    rect(120, 100, 40, 32, c.tealSoft, 4) +
    line(140, 100, 140, 132, THIN) +
    line(120, 116, 160, 116, THIN) +
    ground(c) +
    spark(206, 44, 9, c.amber),
  together: (c) =>
    person(66, 152, 2.1, c.teal, c.teal) +
    person(180, 152, 1.6, c.amber, c.amber) +
    sheet(94, 112, 62, 46, c, -4) +
    [0, 1, 2].map((i) => circ(110 + i * 15, 135, 4.4, c.blue)).join("") +
    ground(c, 154) +
    spark(122, 40, 10, c.teal),
  routine: (c) =>
    circ(60, 64, 22, c.amber) +
    path("M150 40a26 26 0 1 0 22 40a20 20 0 1 1 -22 -40Z", c.blueSoft) +
    [0, 1, 2, 3, 4, 5, 6].map((i) => circ(40 + i * 26, 128, 10, i < 3 ? c.teal : c.white, i < 3 ? "" : `${DASH} stroke-width="2"`)).join("") +
    [0, 1, 2].map((i) => check(40 + i * 26, 128, 4, `stroke="${c.white}" stroke-width="2.6"`)).join("") +
    line(30, 150, 210, 150, `stroke="${c.line}" stroke-width="3"`),
  celebrate: (c) =>
    person(76, 156, 1.9, c.teal, c.teal) +
    person(170, 156, 1.6, c.amber, c.amber) +
    path("M52 132L34 94M100 132L118 94M150 134L137 100M190 134L204 100", "none", 'stroke-width="4.5"') +
    circ(33, 90, 5, c.teal) +
    circ(119, 90, 5, c.teal) +
    circ(136, 96, 4.5, c.amber) +
    circ(205, 96, 4.5, c.amber) +
    poly(star(120, 40, 24, 11, 5), c.amber) +
    rect(40, 34, 12, 12, c.blue, 2, 'transform="rotate(20 46 40)"') +
    circ(204, 38, 6, c.teal) +
    spark(76, 24, 9, c.amber) +
    spark(180, 20, 8, c.teal) +
    ground(c, 158),
};
export const FAMILY_KINDS = Object.freeze(Object.keys(FAMILY));
export const familySpec = (kind) => ({ vb: SPOT_VB, natural: 240, tint: "amberSoft", body: (id, c) => FAMILY[FAMILY[kind] ? kind : "home"](c) });
