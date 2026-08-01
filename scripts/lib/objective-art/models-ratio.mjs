// Ratio-and-proportion models: ratios, ratio tables (with their graph), rates
// on a double number line, measurement conversion, and percents.

import { arrow, C, chip, circle, curveArrow, ln, numberLine, rect, T, table } from "./kit.mjs";

// ── Ratio 3 : 2 and the equivalent ratio 6 : 4 ──────────────────────────────
export function ratios() {
  let s = "";
  const box = (x, y, size, fill, stroke) => rect(x, y, size, size, { fill, stroke, sw: 3, rx: 8 });
  for (let i = 0; i < 3; i += 1) s += box(300 + i * 82, 76, 72, C.tealLight, C.teal);
  s += T(566, 132, 52, C.navy, ":", { weight: 800 });
  for (let i = 0; i < 2; i += 1) s += box(608 + i * 82, 76, 72, C.coralLight, C.coral);
  s += chip(950, 112, "3 : 2", { size: 34, minW: 170 });

  for (let i = 0; i < 6; i += 1) s += box(300 + i * 60, 238, 52, C.tealLight, C.teal);
  s += T(686, 278, 44, C.navy, ":", { weight: 800 });
  for (let i = 0; i < 2; i += 1) s += box(724 + i * 60, 238, 52, C.coralLight, C.coral);
  s += chip(950, 264, "6 : 4", { size: 34, minW: 170 });

  s += curveArrow(268, 116, 268, 250, -110);
  s += chip(150, 186, "× 2", {
    fill: C.coralLight,
    stroke: C.coral,
    textFill: C.coralInk,
    size: 30,
  });
  s += T(600, 356, 28, C.muted, "read it: 3 to 2, 3 : 2, or 3/2", { weight: 700 });
  s += chip(600, 414, "3 : 2 = 6 : 4", {
    fill: C.greenLight,
    stroke: C.green,
    textFill: C.green,
  });
  return s;
}

// ── Ratio table 1:3 and the straight line its points make ───────────────────
export function ratioTables() {
  let s = table({
    x: 90,
    y: 60,
    colW: 200,
    rowH: 60,
    rows: [
      ["Juice", "Water"],
      ["1", "3"],
      ["2", "6"],
      ["3", "9"],
      ["4", "12"],
    ],
    size: 30,
  });
  s += T(190, 44, 26, C.muted, "cups", { weight: 700 });
  s += T(390, 44, 26, C.muted, "cups", { weight: 700 });
  s += chip(580, 210, "× 3", {
    fill: C.coralLight,
    stroke: C.coral,
    textFill: C.coralInk,
    size: 30,
  });
  s += arrow(520, 210, 546, 210, { stroke: C.coral, sw: 3, head: 12 });

  const ox = 760;
  const oy = 372;
  const ux = 68;
  const uy = 22;
  const X = (v) => ox + v * ux;
  const Y = (v) => oy - v * uy;
  for (let v = 0; v <= 4; v += 1) s += ln(X(v), Y(0), X(v), Y(12), { stroke: C.line, sw: 1.6 });
  for (let v = 0; v <= 12; v += 3) s += ln(X(0), Y(v), X(4), Y(v), { stroke: C.line, sw: 1.6 });
  s += ln(ox, oy + 14, ox, Y(12) - 20, { stroke: C.navy, sw: 3.5 });
  s += ln(ox - 14, oy, X(4) + 20, oy, { stroke: C.navy, sw: 3.5 });
  s += ln(X(0), Y(0), X(4), Y(12), { stroke: C.teal, sw: 4 });
  for (let v = 0; v <= 4; v += 1) s += T(X(v), oy + 34, 24, C.muted, String(v), { weight: 700 });
  for (let v = 0; v <= 12; v += 3) {
    s += T(ox - 16, Y(v) + 8, 24, C.muted, String(v), { weight: 700, anchor: "end" });
  }
  for (const [a, b] of [
    [1, 3],
    [2, 6],
    [3, 9],
    [4, 12],
  ]) {
    s += circle(X(a), Y(b), 10, { fill: C.coral, stroke: C.white, sw: 3 });
  }
  s += T(X(2), oy + 70, 26, C.navy, "Juice (cups)", { weight: 800 });
  s += T(ox - 12, Y(12) - 34, 26, C.navy, "Water (cups)", { weight: 800, anchor: "start" });
  s += T(X(4) + 30, Y(12) + 6, 26, C.coralInk, "(4, 12)", { weight: 800, anchor: "start" });
  s += chip(400, 420, "every pair is 1 to 3", { size: 30 });
  return s;
}

// ── Unit rate on a double number line: $12 for 4 pounds → $3 per pound ──────
export function rates() {
  const x = 220;
  const w = 780;
  let s = rect(x - 8, 118, w / 4 + 16, 214, { fill: C.coralLight, rx: 16 });
  const top = numberLine({ x, y: 150, w, min: 0, max: 12, step: 3, labelSize: 26, labelDy: -26 });
  const bot = numberLine({ x, y: 300, w, min: 0, max: 4, step: 1, labelSize: 26, labelDy: 46 });
  for (let i = 0; i <= 4; i += 1) {
    const px = x + (i * w) / 4;
    s += ln(px, 150, px, 300, { stroke: C.line, sw: 2, dash: "7 7" });
  }
  s += top.svg + bot.svg;
  s += T(x - 46, 158, 28, C.tealInk, "Cost ($)", { weight: 800, anchor: "end" });
  s += T(x - 46, 308, 28, C.amberInk, "Weight (lb)", { weight: 800, anchor: "end" });
  s += T(600, 44, 32, C.navy, "$12 for 4 pounds", { weight: 800 });
  s += chip(x + w / 8, 228, "$3 per 1 pound", {
    fill: C.coralLight,
    stroke: C.coral,
    textFill: C.coralInk,
    size: 30,
  });
  s += chip(600, 424, "12 ÷ 4 = 3, so the unit rate is $3 per pound", {
    fill: C.greenLight,
    stroke: C.green,
    textFill: C.green,
    size: 30,
  });
  return s;
}

// ── Measurement conversion: 12 inches = 1 foot, so 5 ft = 60 in ─────────────
export function measurement() {
  let s = table({
    x: 140,
    y: 60,
    colW: 190,
    rowH: 58,
    rows: [
      ["Feet", "Inches"],
      ["1", "12"],
      ["2", "24"],
      ["3", "36"],
      ["4", "48"],
    ],
    size: 30,
  });
  s += arrow(536, 205, 566, 205, { stroke: C.coral, sw: 3, head: 12 });
  s += chip(620, 205, "× 12", {
    fill: C.coralLight,
    stroke: C.coral,
    textFill: C.coralInk,
    size: 30,
  });
  s += T(812, 202, 40, C.navy, "5 ft ×", { weight: 800, anchor: "end" });
  s += T(884, 174, 32, C.tealInk, "12 in", { weight: 800 });
  s += ln(824, 190, 944, 190, { stroke: C.tealInk, sw: 3.5 });
  s += T(884, 228, 32, C.tealInk, "1 ft", { weight: 800 });
  s += T(968, 202, 40, C.coralInk, "= 60 in", { weight: 800, anchor: "start" });
  s += chip(880, 300, "12 inches = 1 foot", { size: 30 });
  s += chip(600, 414, "5 × 12 = 60, so 5 feet = 60 inches", {
    fill: C.greenLight,
    stroke: C.green,
    textFill: C.green,
    size: 30,
  });
  return s;
}

// ── Percent: 25 of 100 squares shaded, and 25% of 40 = 10 on a percent bar ──
export function percents() {
  const cell = 26;
  const gx = 100;
  const gy = 70;
  let s = "";
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 10; c += 1) {
      const shaded = r * 10 + c < 25;
      s += rect(gx + c * cell, gy + r * cell, cell, cell, {
        fill: shaded ? C.teal : C.white,
        stroke: C.line,
        sw: 1.2,
      });
    }
  }
  s += rect(gx, gy, cell * 10, cell * 10, { stroke: C.navy, sw: 3.5 });
  s += T(gx + cell * 5, 368, 28, C.ink, "25 of 100 squares", { weight: 700 });
  s += chip(gx + cell * 5, 420, "25% = 0.25 = 1/4", { size: 30 });

  const bx = 520;
  const bw = 600;
  s += rect(bx, 150, bw, 62, { fill: C.white, stroke: C.navy, sw: 3 });
  s += rect(bx, 150, bw * 0.25, 62, { fill: C.teal });
  const labels = ["0%", "25%", "50%", "75%", "100%"];
  const values = ["0", "10", "20", "30", "40"];
  for (let i = 0; i <= 4; i += 1) {
    const px = bx + (i * bw) / 4;
    s += ln(px, 142, px, 220, { stroke: C.navy, sw: 2.5 });
    s += T(px, 124, 26, C.navy, labels[i], { weight: 800 });
    s += T(px, 252, 26, C.amberInk, values[i], { weight: 800 });
  }
  s += T(bx - 16, 190, 26, C.muted, "percent", { weight: 800, anchor: "end" });
  s += T(bx - 16, 252, 26, C.muted, "pages", { weight: 800, anchor: "end" });
  s += arrow(760, 300, bx + bw * 0.25, 226, { stroke: C.coralInk, sw: 3 });
  s += chip(830, 320, "25% of 40 pages = 10 pages", {
    fill: C.coralLight,
    stroke: C.coral,
    textFill: C.coralInk,
    size: 28,
  });
  s += chip(820, 412, "0.25 × 40 = 10", {
    fill: C.greenLight,
    stroke: C.green,
    textFill: C.green,
  });
  return s;
}

export const RATIO_MODELS = { ratios, ratioTables, rates, measurement, percents };
