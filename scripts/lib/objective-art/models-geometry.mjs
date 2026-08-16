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
  path,
  plotPoint,
  poly,
  rect,
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

// ── 3D Solids, Nets, Surface Area and Volume ────────────────────────────────
export function solids() {
  let s = T(600, 48, 30, C.navy, "3D Rectangular Prism & Unfolded 2D Net", { weight: 800 });

  // 1. 3D Isometric Rectangular Prism (Left side, cx=200, cy=240)
  s += poly("80,200 220,200 290,155 150,155", { fill: C.tealLight, stroke: C.teal, sw: 2.5 });
  s += poly("220,200 290,155 290,275 220,320", { fill: C.amberLight, stroke: C.amber, sw: 2.5 });
  s += poly("80,200 220,200 220,320 80,320", { fill: C.coralLight, stroke: C.coral, sw: 2.5 });

  // Hidden rear edges (dashed for true 3D depth perception)
  s += ln(150, 155, 150, 275, { stroke: C.muted, sw: 2, dash: "6 4" });
  s += ln(80, 320, 150, 275, { stroke: C.muted, sw: 2, dash: "6 4" });
  s += ln(290, 275, 150, 275, { stroke: C.muted, sw: 2, dash: "6 4" });

  // Face labels on 3D solid
  s += T(150, 260, 20, C.coralInk, "Front", { weight: 800 });
  s += T(185, 182, 18, C.tealInk, "Top", { weight: 800 });
  s += T(255, 235, 18, C.amberInk, "Right", { weight: 800 });

  // Dimension lines on 3D solid
  s += arrow(80, 342, 220, 342, { stroke: C.navy, sw: 2 });
  s += arrow(220, 342, 80, 342, { stroke: C.navy, sw: 2 });
  s += T(150, 368, 22, C.navy, "l = 8 in", { weight: 800 });

  s += arrow(62, 200, 62, 320, { stroke: C.navy, sw: 2 });
  s += arrow(62, 320, 62, 200, { stroke: C.navy, sw: 2 });
  s += T(42, 266, 22, C.navy, "h = 5 in", { weight: 800 });

  s += arrow(232, 330, 302, 285, { stroke: C.navy, sw: 2 });
  s += arrow(302, 285, 232, 330, { stroke: C.navy, sw: 2 });
  s += T(280, 320, 22, C.navy, "w = 4 in", { weight: 800 });

  s += T(185, 410, 24, C.navy, "3D Solid Prism", { weight: 800 });

  // 2. Connector folding arrow
  s += curveArrow(330, 240, 420, 240, -40, { stroke: C.teal, sw: 3.5 });
  s += T(375, 180, 22, C.tealInk, "Unfold / Fold", { weight: 800 });

  // 3. 2D Net Unfolding (Center, cx=580, cy=240)
  s += rect(530, 90, 100, 60, { fill: C.tealLight, stroke: C.teal, sw: 2 });
  s += T(580, 126, 22, C.tealInk, "Top (1)", { weight: 800 });

  s += rect(530, 150, 100, 70, { fill: C.coralLight, stroke: C.coral, sw: 2 });
  s += T(580, 192, 22, C.coralInk, "Back (2)", { weight: 800 });

  s += rect(470, 150, 60, 70, { fill: C.amberLight, stroke: C.amber, sw: 2 });
  s += T(500, 192, 20, C.amberInk, "L (3)", { weight: 800 });

  s += rect(630, 150, 60, 70, { fill: C.amberLight, stroke: C.amber, sw: 2 });
  s += T(660, 192, 20, C.amberInk, "R (4)", { weight: 800 });

  s += rect(530, 220, 100, 60, { fill: C.tealLight, stroke: C.teal, sw: 2 });
  s += T(580, 256, 22, C.tealInk, "Bottom (5)", { weight: 800 });

  s += rect(530, 280, 100, 70, { fill: C.coralLight, stroke: C.coral, sw: 2 });
  s += T(580, 322, 22, C.coralInk, "Front (6)", { weight: 800 });

  s += T(580, 410, 24, C.navy, "Unfolded 2D Net (6 Faces)", { weight: 800 });

  // 4. Mathematical Readouts & Formulas (Right side, cx=940)
  s += chip(930, 120, "Volume (Space Inside)", {
    fill: C.tealLight,
    stroke: C.teal,
    textFill: C.tealInk,
    size: 26,
  });
  s += T(930, 175, 26, C.navy, "V = length × width × height", { weight: 800 });
  s += T(930, 215, 26, C.tealInk, "V = 8 × 4 × 5 = 160 cu in", { weight: 800 });

  s += chip(930, 275, "Surface Area (All 6 Faces)", {
    fill: C.coralLight,
    stroke: C.coral,
    textFill: C.coralInk,
    size: 26,
  });
  s += T(930, 330, 26, C.navy, "SA = 2(lw + lh + wh)", { weight: 800 });
  s += T(930, 370, 26, C.coralInk, "SA = 2(32 + 40 + 20) = 184 sq in", { weight: 800 });

  s += chip(930, 420, "2D net area = 3D surface area", {
    fill: C.amberLight,
    stroke: C.amber,
    textFill: C.amberInk,
    size: 24,
  });

  return s;
}

// ── Volume of a Rectangular Prism: base area × height ───────────────────────
// A SEPARATE model from solids() on purpose. 6.GR.2 (volume) and 6.GR.4
// (surface area / nets) shared one picture, so lesson 5-10 — volume with
// FRACTIONAL edges, taught as base area × height — opened on a prism beside its
// unfolded net with SA = 2(lw + lh + wh) printed next to it, in 8 × 4 × 5 whole
// inches it never uses. This draws the lesson's own capsule, its base shaded as
// the B in V = Bh, and nothing about surface area.
export function prismVolume() {
  let s = T(600, 48, 30, C.navy, "Volume = base area × height", { weight: 800 });

  // Isometric prism. Base (z = 0) is the shaded quadrilateral; the body rises
  // from it so "stack the base up the height" is the picture, not a caption.
  const baseTop = "150,300 330,300 420,250 240,250"; // the shaded base face
  s += poly("150,180 330,180 420,130 240,130", { fill: "#fff", stroke: C.navy, sw: 2.5 });
  s += poly("330,180 420,130 420,250 330,300", { fill: C.tealLight, stroke: C.navy, sw: 2.5 });
  s += poly("150,180 330,180 330,300 150,300", { fill: C.tealLight, stroke: C.navy, sw: 2.5 });
  s += poly(baseTop, { fill: C.amberLight, stroke: C.amber, sw: 3.5 });

  // Half-unit grid on the base: the 1.5 ft edge is a visible one-and-a-half.
  s += ln(210, 300, 300, 250, { stroke: C.amber, sw: 1.5 });
  s += ln(270, 300, 360, 250, { stroke: C.amber, sw: 1.5 });
  s += ln(150, 275, 330, 275, { stroke: C.amber, sw: 1.5 });

  s += arrow(150, 330, 330, 330, { stroke: C.navy, sw: 2 });
  s += T(240, 392, 24, C.navy, "l = 2 ft", { weight: 800 });
  s += arrow(130, 180, 130, 300, { stroke: C.navy, sw: 2 });
  s += T(96, 246, 24, C.navy, "h = 1 ft", { weight: 800 });
  s += arrow(344, 310, 430, 262, { stroke: C.navy, sw: 2 });
  s += T(424, 320, 24, C.navy, "w = 1.5 ft", { weight: 800 });

  s += chip(760, 130, "Step 1 — shade the base", {
    fill: C.amberLight,
    stroke: C.amber,
    textFill: C.amberInk,
    size: 26,
  });
  s += T(760, 190, 28, C.navy, "B = l × w = 2 × 1.5", { weight: 800 });
  s += T(760, 230, 28, C.amberInk, "B = 3 square feet", { weight: 800 });

  s += chip(760, 296, "Step 2 — stack it up the height", {
    fill: C.tealLight,
    stroke: C.teal,
    textFill: C.tealInk,
    size: 26,
  });
  s += T(760, 356, 28, C.navy, "V = B × h = 3 × 1", { weight: 800 });
  s += T(760, 396, 28, C.tealInk, "V = 3 cubic feet (ft³)", { weight: 800 });

  s += T(760, 446, 24, C.muted, "same as l × w × h = 2 × 1.5 × 1 = 3", { weight: 700 });
  return s;
}

export const GEOMETRY_MODELS = {
  rationalNumberLine,
  integers,
  coordinatePlaneModel,
  quadrants,
  distance,
  solids,
  prismVolume,
};
