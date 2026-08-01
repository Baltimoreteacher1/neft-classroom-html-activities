// Algebraic-thinking models: exponents, expressions (distributive area model),
// inequalities on a number line, the pan balance, and plane-figure area.

import { arrow, C, chip, circle, dot, ln, numberLine, path, poly, rect, T } from "./kit.mjs";

// ── Powers and exponents: 2 to the 4th = 16 ─────────────────────────────────
export function exponents() {
  let s = T(300, 176, 100, C.navy, "2", { weight: 800 });
  s += T(356, 126, 54, C.coralInk, "4", { weight: 800 });
  s += T(430, 166, 44, C.muted, "=", { weight: 800 });
  s += T(640, 166, 44, C.navy, "2 × 2 × 2 × 2", { weight: 800 });
  s += ln(505, 196, 775, 196, { stroke: C.muted, sw: 3 });
  s += T(640, 230, 26, C.muted, "4 factors", { weight: 700 });
  s += T(830, 166, 44, C.muted, "=", { weight: 800 });
  s += T(900, 172, 52, C.green, "16", { weight: 800 });
  s += chip(180, 166, "base", { size: 30 });
  s += arrow(242, 166, 262, 166, { stroke: C.teal, sw: 3, head: 12 });
  s += chip(500, 70, "exponent", {
    fill: C.coralLight,
    stroke: C.coral,
    textFill: C.coralInk,
    size: 30,
  });
  s += arrow(430, 94, 376, 114, { stroke: C.coral, sw: 3, head: 12 });
  s += T(430, 320, 38, C.navy, "10", { weight: 800, anchor: "end" });
  s += T(438, 294, 24, C.coralInk, "3", { weight: 800, anchor: "start" });
  s += T(470, 320, 38, C.navy, "= 10 × 10 × 10 = 1,000", { weight: 800, anchor: "start" });
  s += chip(600, 404, "the exponent counts how many times the base is a factor", { size: 28 });
  return s;
}

// ── Distributive property as an area model: 3(x + 5) = 3x + 15 ──────────────
export function expressions() {
  let s = rect(260, 90, 240, 110, { fill: C.tealLight, stroke: C.teal, sw: 3 });
  s += rect(500, 90, 200, 110, { fill: C.amberLight, stroke: C.amber, sw: 3 });
  s += T(380, 160, 40, C.tealInk, "3x", { weight: 800 });
  s += T(600, 160, 40, C.amberInk, "15", { weight: 800 });
  s += ln(260, 74, 500, 74, { stroke: C.muted, sw: 2.5 });
  s += ln(500, 74, 700, 74, { stroke: C.muted, sw: 2.5 });
  for (const x of [260, 500, 700]) s += ln(x, 66, x, 82, { stroke: C.muted, sw: 2.5 });
  s += T(380, 58, 30, C.tealInk, "x", { weight: 800 });
  s += T(600, 58, 30, C.amberInk, "5", { weight: 800 });
  s += ln(244, 90, 244, 200, { stroke: C.muted, sw: 2.5 });
  s += ln(236, 90, 252, 90, { stroke: C.muted, sw: 2.5 });
  s += ln(236, 200, 252, 200, { stroke: C.muted, sw: 2.5 });
  s += T(224, 156, 30, C.navy, "3", { weight: 800, anchor: "end" });
  s += T(760, 132, 40, C.navy, "3(x + 5)", { weight: 800, anchor: "start" });
  s += T(760, 192, 40, C.coralInk, "= 3x + 15", { weight: 800, anchor: "start" });
  s += T(380, 238, 26, C.tealInk, "3 rows of x", { weight: 700 });
  s += T(600, 238, 26, C.amberInk, "3 rows of 5", { weight: 700 });
  s += T(150, 320, 30, C.tealInk, "3 = coefficient", { weight: 800, anchor: "start" });
  s += T(150, 372, 30, C.navy, "x = variable", { weight: 800, anchor: "start" });
  s += T(150, 424, 30, C.amberInk, "15 = constant", { weight: 800, anchor: "start" });
  s += T(470, 320, 30, C.muted, "3x and 15 are terms", { weight: 800, anchor: "start" });
  s += chip(880, 362, "when x = 4:  3(4 + 5) = 27", { size: 28 });
  s += chip(880, 428, "and 3 × 4 + 15 = 27", {
    fill: C.greenLight,
    stroke: C.green,
    textFill: C.green,
    size: 28,
  });
  return s;
}

// ── Inequalities graphed on a number line: x > 3 and x ≤ 5 ──────────────────
export function inequalities() {
  const x = 200;
  const w = 760;
  const a = numberLine({ x, y: 150, w, min: -2, max: 8, step: 1, labelSize: 26, labelDy: 42 });
  const b = numberLine({ x, y: 310, w, min: -2, max: 8, step: 1, labelSize: 26, labelDy: 42 });
  let s = a.svg + b.svg;
  s += ln(a.X(3), 150, x + w + 12, 150, { stroke: C.coral, sw: 9 });
  s += poly(`${x + w + 34},150 ${x + w + 10},137 ${x + w + 10},163`, { fill: C.coral });
  s += dot(a.X(3), 150, 15, C.coral, { open: true });
  s += ln(b.X(5), 310, x - 12, 310, { stroke: C.teal, sw: 9 });
  s += poly(`${x - 34},310 ${x - 10},297 ${x - 10},323`, { fill: C.teal });
  s += dot(b.X(5), 310, 15, C.teal);
  s += chip(300, 76, "x > 3", {
    fill: C.coralLight,
    stroke: C.coral,
    textFill: C.coralInk,
    size: 36,
    minW: 190,
  });
  s += chip(300, 240, "x ≤ 5", { size: 36, minW: 190 });
  s += T(800, 84, 26, C.muted, "open circle — 3 is not a solution", { weight: 700 });
  s += T(800, 248, 26, C.muted, "closed circle — 5 is a solution", { weight: 700 });
  s += chip(600, 414, "the shaded ray shows every solution", { size: 30 });
  return s;
}

// ── Pan balance for x + 3 = 7 ───────────────────────────────────────────────
export function balanceScale() {
  let s = poly("555,410 645,410 600,340", { fill: C.navy });
  s += ln(600, 342, 600, 150, { stroke: C.navy, sw: 8, cap: "butt" });
  s += ln(330, 150, 870, 150, { stroke: C.navy, sw: 9 });
  s += circle(600, 150, 13, { fill: C.amber, stroke: C.navy, sw: 3 });
  for (const hx of [400, 800]) s += ln(hx, 150, hx, 222, { stroke: C.muted, sw: 3 });
  s += path("M 300 222 h 200 l -30 40 h -140 z", { fill: C.navyLight });
  s += path("M 700 222 h 200 l -30 40 h -140 z", { fill: C.navyLight });
  s += rect(312, 158, 64, 64, { fill: C.teal, stroke: C.tealInk, sw: 3, rx: 8 });
  s += T(344, 202, 36, C.white, "x", { weight: 800 });
  for (let i = 0; i < 3; i += 1) {
    s += rect(384 + i * 36, 190, 32, 32, { fill: C.amber, stroke: C.amberInk, sw: 2.5, rx: 5 });
  }
  for (let i = 0; i < 4; i += 1) {
    s += rect(712 + i * 36, 190, 32, 32, { fill: C.amber, stroke: C.amberInk, sw: 2.5, rx: 5 });
  }
  for (let i = 0; i < 3; i += 1) {
    s += rect(730 + i * 36, 158, 32, 32, { fill: C.amber, stroke: C.amberInk, sw: 2.5, rx: 5 });
  }
  s += T(400, 300, 32, C.tealInk, "x + 3", { weight: 800 });
  s += T(800, 300, 32, C.amberInk, "7", { weight: 800 });
  s += T(600, 438, 40, C.navy, "x + 3 = 7", { weight: 800 });
  s += chip(1040, 160, "x = 4", {
    fill: C.greenLight,
    stroke: C.green,
    textFill: C.green,
    size: 32,
  });
  s += chip(1040, 306, "take 3 off both pans", { size: 26 });
  s += chip(150, 200, "the pans stay level", { size: 26 });
  return s;
}

// ── Area of a parallelogram, a triangle and a trapezoid on the same grid ────
export function planeArea() {
  let s = "";
  for (let gx = 60; gx <= 1170; gx += 30) s += ln(gx, 90, gx, 240, { stroke: C.line, sw: 1.4 });
  for (let gy = 90; gy <= 240; gy += 30) s += ln(60, gy, 1170, gy, { stroke: C.line, sw: 1.4 });
  s += poly("120,90 360,90 330,240 90,240", { fill: C.tealLight, stroke: C.teal, sw: 3.5 });
  s += ln(120, 90, 120, 240, { stroke: C.coralInk, sw: 3, dash: "9 7" });
  s += T(134, 172, 26, C.coralInk, "h = 5", { weight: 800, anchor: "start" });
  s += T(210, 272, 26, C.navy, "b = 8", { weight: 800 });
  s += chip(225, 322, "A = b × h = 8 × 5 = 40", { size: 28 });
  s += poly("480,240 720,240 600,90", { fill: C.amberLight, stroke: C.amber, sw: 3.5 });
  s += ln(600, 90, 600, 240, { stroke: C.coralInk, sw: 3, dash: "9 7" });
  s += T(614, 172, 26, C.coralInk, "h = 5", { weight: 800, anchor: "start" });
  s += T(600, 272, 26, C.navy, "b = 8", { weight: 800 });
  s += chip(600, 322, "A = ½ × 8 × 5 = 20", {
    fill: C.amberLight,
    stroke: C.amberInk,
    textFill: C.amberInk,
    size: 28,
  });
  s += poly("900,90 1080,90 1140,240 840,240", { fill: C.coralLight, stroke: C.coral, sw: 3.5 });
  s += ln(900, 90, 900, 240, { stroke: C.coralInk, sw: 3, dash: "9 7" });
  s += T(914, 172, 26, C.coralInk, "h = 5", { weight: 800, anchor: "start" });
  s += T(990, 74, 26, C.navy, "b\u2081 = 6", { weight: 800 });
  s += T(990, 272, 26, C.navy, "b\u2082 = 10", { weight: 800 });
  s += chip(985, 322, "A = ½(6 + 10) × 5 = 40", {
    fill: C.coralLight,
    stroke: C.coral,
    textFill: C.coralInk,
    size: 28,
  });
  s += chip(600, 410, "every area here comes from a base and a height", { size: 30 });
  return s;
}

export const ALGEBRA_MODELS = {
  exponents,
  expressions,
  inequalities,
  balanceScale,
  planeArea,
};
