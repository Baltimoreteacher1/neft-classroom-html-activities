// Statistics models: statistical questions, centre (mean/median/mode), mean
// absolute deviation, box plots, histograms and distribution shapes.
//
// Centre and MAD deliberately share one data set — 3, 5, 5, 6, 11 — so a
// student who meets it in 8.2 recognises it in 8.3.

import { arrow, C, chip, circle, ln, numberLine, rect, T } from "./kit.mjs";

const DATA = [3, 5, 5, 6, 11]; // mean 6, median 5, mode 5, MAD 2

function stack(x, baseY, count, r, gap, fill) {
  let s = "";
  for (let i = 0; i < count; i += 1) s += circle(x, baseY - i * gap, r, { fill });
  return s;
}

// ── A statistical question is one that expects varied answers ───────────────
export function statQuestions() {
  let s = rect(70, 36, 500, 110, { fill: C.coralLight, stroke: C.coral, sw: 3, rx: 18 });
  s += T(320, 84, 30, C.coralInk, "How tall am I?", { weight: 800 });
  s += T(320, 122, 24, C.coralInk, "one answer — not statistical", { weight: 700 });
  s += rect(630, 36, 500, 110, { fill: C.tealLight, stroke: C.teal, sw: 3, rx: 18 });
  s += T(880, 84, 26, C.tealInk, "How tall are students in our class?", { weight: 800 });
  s += T(880, 122, 24, C.tealInk, "many different answers — statistical", { weight: 700 });
  const nl = numberLine({ x: 300, y: 340, w: 600, min: 54, max: 60, step: 1, labelDy: 42 });
  s += nl.svg;
  const counts = { 54: 1, 55: 2, 56: 4, 57: 3, 58: 2, 59: 1, 60: 1 };
  for (const [v, n] of Object.entries(counts)) {
    s += stack(nl.X(Number(v)), 316, n, 11, 26, C.teal);
  }
  s += T(600, 420, 28, C.navy, "Height in inches — 14 students answered", { weight: 800 });
  return s;
}

// ── Mean, median and mode of 3, 5, 5, 6, 11 ─────────────────────────────────
export function centre() {
  const nl = numberLine({ x: 200, y: 230, w: 760, min: 0, max: 12, step: 1, labelDy: 42 });
  let s = T(600, 46, 30, C.navy, `Data: ${DATA.join(", ")}`, { weight: 800 });
  // Both markers start well above the dots — a median line hidden behind the
  // stack it marks tells the student nothing.
  s += ln(nl.X(5), 100, nl.X(5), 224, { stroke: C.teal, sw: 3.5, dash: "9 7" });
  s += ln(nl.X(6), 100, nl.X(6), 224, { stroke: C.coral, sw: 3.5, dash: "9 7" });
  s += rect(nl.X(5) - 26, 156, 52, 76, { stroke: C.amberInk, sw: 3, dash: "8 6", rx: 26 });
  s += nl.svg;
  const counts = { 3: 1, 5: 2, 6: 1, 11: 1 };
  for (const [v, n] of Object.entries(counts)) {
    s += stack(nl.X(Number(v)), 206, n, 12, 28, C.navy);
  }
  s += chip(280, 340, "mean = 30 ÷ 5 = 6", {
    fill: C.coralLight,
    stroke: C.coral,
    textFill: C.coralInk,
  });
  s += chip(600, 340, "median = 5", { size: 30 });
  s += chip(900, 340, "mode = 5", {
    fill: C.amberLight,
    stroke: C.amberInk,
    textFill: C.amberInk,
  });
  s += chip(600, 414, "the outlier 11 pulls the mean above the median", { size: 30 });
  return s;
}

// ── Mean absolute deviation: the average distance from the mean ─────────────
export function meanAbsoluteDeviation() {
  const nl = numberLine({ x: 200, y: 260, w: 760, min: 0, max: 12, step: 1, labelDy: 42 });
  let s = ln(nl.X(6), 74, nl.X(6), 254, { stroke: C.coral, sw: 3.5, dash: "9 7" });
  s += T(nl.X(6), 58, 28, C.coralInk, "mean = 6", { weight: 800 });
  s += nl.svg;
  const rows = [
    [11, 5, 96],
    [3, 3, 136],
    [5, 1, 176],
    [5, 1, 210],
  ];
  for (const [v, d, y] of rows) {
    s += arrow(nl.X(v), y, nl.X(6), y, { stroke: C.tealInk, sw: 3, head: 13 });
    s += T((nl.X(v) + nl.X(6)) / 2, y - 10, 26, C.tealInk, String(d), { weight: 800 });
  }
  s += circle(nl.X(6), 232, 9, { fill: C.coralInk });
  s += T(nl.X(6) + 20, 240, 26, C.coralInk, "0", { weight: 800, anchor: "start" });
  for (const v of DATA) s += circle(nl.X(v), 260, 11, { fill: C.navy });
  s += chip(600, 336, "distances from the mean: 3, 1, 1, 0, 5", { size: 30 });
  s += chip(600, 412, "MAD = (3 + 1 + 1 + 0 + 5) ÷ 5 = 2", {
    fill: C.greenLight,
    stroke: C.green,
    textFill: C.green,
    size: 30,
  });
  return s;
}

// ── Box plot of 10, 12, 14, 15, 18, 20, 22, 24, 26, 28, 30 ──────────────────
export function boxPlot() {
  const set = [10, 12, 14, 15, 18, 20, 22, 24, 26, 28, 30];
  const nl = numberLine({ x: 180, y: 290, w: 840, min: 0, max: 40, step: 5, labelDy: 42 });
  const X = nl.X;
  let s = T(600, 60, 28, C.navy, `Data: ${set.join(", ")}`, { weight: 800 });
  s += ln(X(10), 185, X(14), 185, { stroke: C.navy, sw: 3.5 });
  s += ln(X(26), 185, X(30), 185, { stroke: C.navy, sw: 3.5 });
  s += ln(X(10), 152, X(10), 218, { stroke: C.navy, sw: 3.5 });
  s += ln(X(30), 152, X(30), 218, { stroke: C.navy, sw: 3.5 });
  s += rect(X(14), 140, X(26) - X(14), 90, { fill: C.tealLight, stroke: C.navy, sw: 3.5 });
  s += ln(X(20), 140, X(20), 230, { stroke: C.coral, sw: 6 });
  // min and max sit OUTSIDE their whisker caps; only the three quartile labels
  // share the row above the box, so none of the five can crowd another.
  const marks = [
    [14, "Q1 14"],
    [20, "median 20"],
    [26, "Q3 26"],
  ];
  for (const [v, label] of marks) {
    s += T(X(v), 118, 24, v === 20 ? C.coralInk : C.navy, label, { weight: 800 });
  }
  for (const v of [10, 14, 20, 26, 30]) {
    s += ln(X(v), 232, X(v), 282, { stroke: C.line, sw: 2, dash: "6 6" });
  }
  s += T(X(10) - 16, 194, 24, C.navy, "min 10", { weight: 800, anchor: "end" });
  s += T(X(30) + 16, 194, 24, C.navy, "max 30", { weight: 800, anchor: "start" });
  s += nl.svg;
  for (const v of set) s += circle(X(v), 258, 6, { fill: C.muted });
  s += chip(600, 404, "middle half of the data: IQR = 26 − 14 = 12", { size: 30 });
  return s;
}

// ── Histogram: five equal intervals, no gaps ────────────────────────────────
export function histogram() {
  const bins = [
    ["0–9", 3],
    ["10–19", 7],
    ["20–29", 9],
    ["30–39", 5],
    ["40–49", 2],
  ];
  const x0 = 200;
  const bw = 160;
  const base = 310;
  const unit = 24;
  let s = "";
  for (let v = 0; v <= 10; v += 2) {
    s += ln(x0 - 10, base - v * unit, x0 + bw * 5 + 10, base - v * unit, {
      stroke: C.line,
      sw: 1.6,
    });
    s += T(x0 - 22, base - v * unit + 8, 24, C.muted, String(v), { weight: 700, anchor: "end" });
  }
  bins.forEach(([label, n], i) => {
    const bx = x0 + i * bw;
    s += rect(bx, base - n * unit, bw, n * unit, { fill: C.tealLight, stroke: C.navy, sw: 3 });
    s += T(bx + bw / 2, base - n * unit - 14, 26, C.tealInk, String(n), { weight: 800 });
    s += T(bx + bw / 2, 344, 26, C.navy, label, { weight: 800 });
  });
  s += ln(x0, 60, x0, base, { stroke: C.navy, sw: 3.5 });
  s += ln(x0 - 10, base, x0 + bw * 5 + 10, base, { stroke: C.navy, sw: 3.5 });
  s += T(x0 - 30, 46, 26, C.navy, "Students", { weight: 800, anchor: "start" });
  s += T(x0 + bw * 2.5, 384, 28, C.navy, "Minutes of reading", { weight: 800 });
  s += chip(600, 424, "26 students · 5 equal intervals · no gaps", { size: 30 });
  return s;
}

// ── Three distribution shapes side by side ──────────────────────────────────
export function distributions() {
  const shapes = [
    [220, "Symmetric", "one middle peak", [1, 2, 4, 6, 4, 2, 1], C.teal],
    [600, "Skewed right", "tail stretches right", [6, 5, 3, 2, 1, 1, 1], C.coral],
    [980, "Skewed left", "tail stretches left", [1, 1, 1, 2, 3, 5, 6], C.amberInk],
  ];
  let s = "";
  for (const [cx, title, note, counts, colour] of shapes) {
    s += T(cx, 62, 30, C.navy, title, { weight: 800 });
    s += T(cx, 98, 24, C.muted, note, { weight: 700 });
    const nl = numberLine({
      x: cx - 150,
      y: 300,
      w: 300,
      min: 1,
      max: 7,
      step: 1,
      labelSize: 20,
      labelDy: 34,
      arrows: false,
    });
    s += nl.svg;
    counts.forEach((n, i) => {
      s += stack(nl.X(i + 1), 284, n, 8, 19, colour);
    });
  }
  s += arrow(760, 268, 726, 288, { stroke: C.coralInk, sw: 2.5, head: 11 });
  s += arrow(830, 268, 866, 288, { stroke: C.amberInk, sw: 2.5, head: 11 });
  s += T(795, 258, 24, C.muted, "tails", { weight: 800 });
  s += chip(600, 412, "shape is the story: peak, spread, tail", { size: 30 });
  return s;
}

export const DATA_MODELS = {
  statQuestions,
  centre,
  meanAbsoluteDeviation,
  boxPlot,
  histogram,
  distributions,
};
