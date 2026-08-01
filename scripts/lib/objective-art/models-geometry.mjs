// Number-line and coordinate-plane models: rational numbers on a line,
// integers and absolute value, plotting ordered pairs, the four quadrants with
// reflections, and distance between two points.

import {
  arrow,
  C,
  chip,
  circle,
  coordPlane,
  curveArrow,
  ln,
  numberLine,
  plotPoint,
  T,
} from "./kit.mjs";

const QUADRANTS = [
  [3.9, 3.9, "I"],
  [-3.9, 3.9, "II"],
  [-3.9, -3.9, "III"],
  [3.9, -3.9, "IV"],
];

// ── Rational numbers, fractions and decimals, on one line ───────────────────
export function rationalNumberLine() {
  const nl = numberLine({
    x: 140,
    y: 250,
    w: 920,
    min: -3,
    max: 3,
    step: 0.25,
    labelEvery: 4,
    labelSize: 28,
    labelDy: 48,
  });
  let s = T(600, 58, 30, C.navy, "Fractions and decimals live between the whole numbers", {
    weight: 800,
  });
  s += nl.svg;
  const marks = [
    [-2.5, "−2½"],
    [-0.75, "−0.75"],
    [0.5, "½"],
    [2.25, "2¼"],
  ];
  for (const [v, label] of marks) {
    s += ln(nl.X(v), 212, nl.X(v), 250, { stroke: C.coral, sw: 3 });
    s += circle(nl.X(v), 250, 13, { fill: C.coral, stroke: C.white, sw: 3 });
    s += T(nl.X(v), 200, 30, C.coralInk, label, { weight: 800 });
  }
  s += chip(600, 356, "each mark between the whole numbers is one quarter", { size: 28 });
  s += chip(600, 420, "−2½ < −0.75 < ½ < 2¼", {
    fill: C.greenLight,
    stroke: C.green,
    textFill: C.green,
    size: 30,
  });
  return s;
}

// ── Integers, opposites and absolute value ──────────────────────────────────
export function integers() {
  const nl = numberLine({
    x: 140,
    y: 230,
    w: 920,
    min: -6,
    max: 6,
    step: 1,
    labelSize: 28,
    labelDy: 48,
  });
  let s = T(600, 56, 30, C.navy, "Opposites sit the same distance from 0", { weight: 800 });
  s += T(600, 100, 26, C.muted, "−4 is to the left of 4, so −4 < 4", { weight: 700 });
  s += arrow(nl.X(0), 168, nl.X(-4), 168, { stroke: C.coralInk, sw: 3 });
  s += arrow(nl.X(0), 168, nl.X(4), 168, { stroke: C.tealInk, sw: 3 });
  s += T((nl.X(0) + nl.X(-4)) / 2, 152, 26, C.coralInk, "4 units", { weight: 800 });
  s += T((nl.X(0) + nl.X(4)) / 2, 152, 26, C.tealInk, "4 units", { weight: 800 });
  s += nl.svg;
  s += circle(nl.X(-4), 230, 14, { fill: C.coral, stroke: C.white, sw: 3 });
  s += circle(nl.X(4), 230, 14, { fill: C.teal, stroke: C.white, sw: 3 });
  s += circle(nl.X(0), 230, 10, { fill: C.navy });
  s += curveArrow(nl.X(-4), 296, nl.X(4), 296, 66, { stroke: C.muted, sw: 3 });
  s += T(600, 376, 28, C.muted, "opposites", { weight: 800 });
  s += chip(280, 420, "|−4| = 4", {
    fill: C.coralLight,
    stroke: C.coral,
    textFill: C.coralInk,
    size: 30,
  });
  s += chip(920, 420, "|4| = 4", { size: 30 });
  return s;
}

function planeWithQuadrants() {
  const p = coordPlane({
    cx: 420,
    cy: 230,
    unit: 36,
    min: -5,
    max: 5,
    labelSize: 20,
    labelEvery: 2,
  });
  let s = p.svg;
  for (const [qx, qy, label] of QUADRANTS) {
    s += T(p.X(qx), p.Y(qy) + 8, 24, C.muted, label, { weight: 800 });
  }
  return { svg: s, X: p.X, Y: p.Y };
}

// ── Plotting an ordered pair ────────────────────────────────────────────────
export function coordinatePlaneModel() {
  const p = planeWithQuadrants();
  let s = p.svg;
  const px = p.X(3);
  const py = p.Y(2);
  s += ln(p.X(0), py, px, py, { stroke: C.coral, sw: 3, dash: "9 7" });
  s += ln(px, p.Y(0), px, py, { stroke: C.coral, sw: 3, dash: "9 7" });
  s += plotPoint(px, py, "(3, 2)", { dx: 18, dy: -20 });
  s += T(660, 104, 34, C.navy, "(3, 2)", { weight: 800, anchor: "start" });
  s += T(660, 154, 28, C.muted, "3 right along x, then 2 up along y", {
    weight: 700,
    anchor: "start",
  });
  s += chip(880, 236, "x first, then y", { size: 30 });
  s += T(660, 330, 26, C.tealInk, "the origin is (0, 0)", { weight: 800, anchor: "start" });
  s += T(660, 376, 26, C.coralInk, "the two axes cut the plane into 4 quadrants", {
    weight: 800,
    anchor: "start",
  });
  return s;
}

// ── Ordered pairs in all four quadrants, and reflections ────────────────────
export function quadrants() {
  const p = planeWithQuadrants();
  let s = p.svg;
  const A = [p.X(3), p.Y(2)];
  const B = [p.X(-3), p.Y(2)];
  const D = [p.X(3), p.Y(-2)];
  s += arrow(A[0] - 14, A[1], B[0] + 14, B[1], { stroke: C.teal, sw: 2.5, dash: "8 6", head: 12 });
  s += arrow(A[0], A[1] + 14, D[0], D[1] - 14, {
    stroke: C.amberInk,
    sw: 2.5,
    dash: "8 6",
    head: 12,
  });
  s += plotPoint(A[0], A[1], "A", { dx: 16, dy: -16, fill: C.coral, labelFill: C.coralInk });
  s += plotPoint(B[0], B[1], "B", {
    dx: -16,
    dy: -16,
    fill: C.teal,
    anchor: "end",
    labelFill: C.tealInk,
  });
  s += plotPoint(D[0], D[1], "D", { dx: 16, dy: 30, fill: C.amber, labelFill: C.amberInk });
  s += T(660, 100, 28, C.coralInk, "A (3, 2)", { weight: 800, anchor: "start" });
  s += T(660, 156, 26, C.tealInk, "B (−3, 2) — A reflected across the y-axis", {
    weight: 800,
    anchor: "start",
  });
  s += T(660, 212, 26, C.amberInk, "D (3, −2) — A reflected across the x-axis", {
    weight: 800,
    anchor: "start",
  });
  s += chip(890, 296, "a reflection flips one sign", { size: 28 });
  s += T(660, 382, 26, C.muted, "Quadrants I–IV run counter-clockwise", {
    weight: 800,
    anchor: "start",
  });
  return s;
}

// ── Distance between two points that share a coordinate ─────────────────────
export function distance() {
  const p = planeWithQuadrants();
  let s = p.svg;
  const P = [p.X(-3), p.Y(2)];
  const Q = [p.X(4), p.Y(2)];
  const R = [p.X(4), p.Y(-3)];
  s += ln(P[0], P[1], Q[0], Q[1], { stroke: C.teal, sw: 7 });
  s += ln(Q[0], Q[1], R[0], R[1], { stroke: C.amber, sw: 7 });
  s += plotPoint(P[0], P[1], "P", {
    dx: -16,
    dy: -18,
    fill: C.teal,
    anchor: "end",
    labelFill: C.tealInk,
  });
  s += plotPoint(Q[0], Q[1], "Q", { dx: 16, dy: -18, fill: C.teal, labelFill: C.tealInk });
  s += plotPoint(R[0], R[1], "R", { dx: 16, dy: 12, fill: C.amber, labelFill: C.amberInk });
  // Both length labels clear the axes: "7 units" sits right of the y-axis and
  // "5 units" below the x-axis tick row, or they read as axis labels.
  s += T((P[0] + Q[0]) / 2 + 44, P[1] - 24, 26, C.tealInk, "7 units", { weight: 800 });
  s += T(Q[0] - 16, (Q[1] + R[1]) / 2 + 52, 26, C.amberInk, "5 units", {
    weight: 800,
    anchor: "end",
  });
  s += T(660, 104, 28, C.tealInk, "P(−3, 2) to Q(4, 2)", { weight: 800, anchor: "start" });
  s += T(660, 148, 26, C.muted, "|−3| + |4| = 3 + 4 = 7", { weight: 700, anchor: "start" });
  s += T(660, 220, 28, C.amberInk, "Q(4, 2) to R(4, −3)", { weight: 800, anchor: "start" });
  s += T(660, 264, 26, C.muted, "|2| + |−3| = 2 + 3 = 5", { weight: 700, anchor: "start" });
  s += chip(900, 350, "across 0, add the absolute values", { size: 26 });
  return s;
}

export const GEOMETRY_MODELS = {
  rationalNumberLine,
  integers,
  coordinatePlaneModel,
  quadrants,
  distance,
};
