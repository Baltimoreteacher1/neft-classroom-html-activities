// Number-system models: factor trees / GCF / LCM, multi-digit division, the
// three decimal operations, and fraction division.
//
// Every number printed here is checked by scripts/gen-objective-art.test.mjs —
// a figure that disagrees with its own arithmetic is worse than no figure,
// because a student trusts the picture over the paragraph.

import { arrow, C, chip, circle, ln, rect, T } from "./kit.mjs";

// ── Factor trees, GCF and LCM ───────────────────────────────────────────────
// 24 = 2 x 2 x 2 x 3 and 36 = 2 x 2 x 3 x 3, so GCF = 2 x 2 x 3 = 12 and
// LCM = 2 x 2 x 2 x 3 x 3 = 72.
function tree(cx, root, kids, grandkids) {
  const R = 36;
  const rootY = 52;
  const kidY = 162;
  const gkY = 272;
  const kidX = [cx - 100, cx + 100];
  const gkX = [cx - 160, cx - 40, cx + 40, cx + 160];
  let s = "";
  kidX.forEach((kx, i) => {
    s += ln(cx, rootY + R, kx, kidY - R, { stroke: C.muted, sw: 3 });
    gkX.slice(i * 2, i * 2 + 2).forEach((gx) => {
      s += ln(kx, kidY + R, gx, gkY - R, { stroke: C.muted, sw: 3 });
    });
  });
  const node = (x, y, v, kind) => {
    const fill = kind === "root" ? C.navy : kind === "prime" ? C.amber : C.white;
    const stroke = kind === "prime" ? C.amberInk : C.navy;
    const text = kind === "root" ? C.white : kind === "prime" ? C.amberInk : C.navy;
    return (
      circle(x, y, R, { fill, stroke, sw: 3 }) + T(x, y + 12, 34, text, String(v), { weight: 800 })
    );
  };
  s += node(cx, rootY, root, "root");
  kids.forEach((v, i) => (s += node(kidX[i], kidY, v, "composite")));
  grandkids.forEach((v, i) => (s += node(gkX[i], gkY, v, "prime")));
  return s;
}

export function factors() {
  return (
    tree(300, 24, [4, 6], [2, 2, 2, 3]) +
    tree(900, 36, [4, 9], [2, 2, 3, 3]) +
    chip(300, 350, "24 = 2 × 2 × 2 × 3", { fill: C.white, stroke: C.navy, size: 30 }) +
    chip(900, 350, "36 = 2 × 2 × 3 × 3", { fill: C.white, stroke: C.navy, size: 30 }) +
    chip(300, 416, "GCF = 2 × 2 × 3 = 12", {
      fill: C.amberLight,
      stroke: C.amberInk,
      textFill: C.amberInk,
      size: 30,
    }) +
    chip(900, 416, "LCM = 2 × 2 × 2 × 3 × 3 = 72", {
      fill: C.coralLight,
      stroke: C.coral,
      textFill: C.coralInk,
      size: 30,
    })
  );
}

// ── Long division: 4,896 ÷ 12 = 408 ─────────────────────────────────────────
export function longDivision() {
  const col = [300, 346, 392, 438];
  const D = (x, y, v, fill, size = 36) => T(x, y, size, fill, String(v), { weight: 800 });
  let s = "";
  // divisor · bracket · dividend
  s += T(262, 112, 36, C.tealInk, "12", { weight: 800, anchor: "end" });
  s += ln(276, 70, 470, 70, { stroke: C.navy, sw: 3.5 });
  s += `<path d="M 276 68 q 22 30 0 62" fill="none" stroke="${C.navy}" stroke-width="3.5" stroke-linecap="round" />`;
  s += D(col[0], 112, 4, C.navy) + D(col[1], 112, 8, C.navy);
  s += D(col[2], 112, 9, C.navy) + D(col[3], 112, 6, C.navy);
  // quotient 4 0 8
  s += D(col[1], 52, 4, C.coralInk) + D(col[2], 52, 0, C.coralInk) + D(col[3], 52, 8, C.coralInk);
  // 48 - 48 = 0, bring down 9
  s += T(258, 160, 36, C.muted, "−", { weight: 800 });
  s += D(col[0], 160, 4, C.muted) + D(col[1], 160, 8, C.muted);
  s += ln(276, 178, 368, 178, { stroke: C.muted, sw: 3 });
  s += D(col[1], 218, 0, C.navy) + D(col[2], 218, 9, C.navy);
  // 9 - 0 = 9, bring down 6
  s += T(350, 262, 36, C.muted, "−", { weight: 800 });
  s += D(col[2], 262, 0, C.muted);
  s += ln(368, 280, 414, 280, { stroke: C.muted, sw: 3 });
  s += D(col[2], 318, 9, C.navy) + D(col[3], 318, 6, C.navy);
  // 96 - 96 = 0
  s += T(350, 362, 36, C.muted, "−", { weight: 800 });
  s += D(col[2], 362, 9, C.muted) + D(col[3], 362, 6, C.muted);
  s += ln(368, 380, 460, 380, { stroke: C.muted, sw: 3 });
  s += D(col[3], 420, 0, C.green);
  // colour key
  const key = [
    [C.coralInk, "quotient  408"],
    [C.navy, "dividend  4,896"],
    [C.tealInk, "divisor  12"],
    [C.muted, "partial products  48, 0, 96"],
    [C.green, "remainder  0"],
  ];
  key.forEach(([colour, label], i) => {
    const y = 84 + i * 70;
    s += rect(646, y - 24, 28, 28, { fill: colour, rx: 8 });
    s += T(692, y, 30, C.ink, label, { weight: 700, anchor: "start" });
  });
  s += chip(900, 424, "12 × 408 = 4,896", {
    fill: C.greenLight,
    stroke: C.green,
    textFill: C.green,
  });
  return s;
}

// ── Decimal addition on a place-value chart: 12.80 + 3.45 = 16.25 ───────────
export function decimalSum() {
  const widths = [110, 110, 50, 110, 160];
  const x0 = (1200 - widths.reduce((a, b) => a + b, 0)) / 2;
  const xs = [];
  let acc = x0;
  for (const w of widths) {
    xs.push(acc);
    acc += w;
  }
  const right = acc;
  const pointCx = xs[2] + widths[2] / 2;
  const rows = [
    ["Tens", "Ones", ".", "Tenths", "Hundredths"],
    ["1", "2", ".", "8", "0"],
    ["", "3", ".", "4", "5"],
    ["1", "6", ".", "2", "5"],
  ];
  const rowY = [20, 76, 144, 224];
  const rowH = [56, 68, 68, 68];
  let s = ln(pointCx, 8, pointCx, 300, { stroke: C.teal, sw: 3, dash: "8 8" });
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      const isPlaceholder = r === 1 && c === 4;
      s += rect(xs[c], rowY[r], widths[c], rowH[r], {
        fill: r === 0 ? C.navy : isPlaceholder ? C.amberLight : C.white,
        stroke: C.navy,
        sw: 2,
      });
      if (cell) {
        s += T(
          xs[c] + widths[c] / 2,
          rowY[r] + rowH[r] / 2 + (r === 0 ? 10 : 14),
          r === 0 ? 26 : 40,
          r === 0 ? C.white : isPlaceholder ? C.amberInk : C.navy,
          cell,
          { weight: 800 },
        );
      }
    });
  });
  s += T(x0 - 26, 190, 40, C.coralInk, "+", { weight: 800, anchor: "end" });
  s += ln(x0 - 40, 214, right, 214, { stroke: C.coralInk, sw: 4 });
  s += T(right + 24, 130, 26, C.amberInk, "placeholder 0", { weight: 800, anchor: "start" });
  s += arrow(right + 18, 122, xs[4] + widths[4] / 2 + 46, 118, {
    stroke: C.amberInk,
    sw: 2.5,
    head: 11,
  });
  s += arrow(pointCx, 336, pointCx, 302, { stroke: C.tealInk, sw: 3 });
  s += chip(pointCx, 366, "the decimal points line up", { size: 28 });
  s += chip(600, 428, "12.80 + 3.45 = 16.25", {
    fill: C.greenLight,
    stroke: C.green,
    textFill: C.green,
  });
  return s;
}

// ── Decimal multiplication on a hundredths grid: 0.4 × 0.7 = 0.28 ───────────
export function decimalProduct() {
  const cell = 30;
  const gx = 150;
  const gy = 56;
  let s = "";
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 10; c += 1) {
      const inCols = c < 4;
      const inRows = r < 7;
      const fill =
        inCols && inRows ? C.teal : inCols ? C.tealLight : inRows ? C.amberLight : C.white;
      s += rect(gx + c * cell, gy + r * cell, cell, cell, { fill, stroke: C.line, sw: 1.2 });
    }
  }
  s += rect(gx, gy, cell * 10, cell * 10, { stroke: C.navy, sw: 3.5 });
  s += ln(gx, 42, gx + cell * 4, 42, { stroke: C.tealInk, sw: 3 });
  s += ln(gx, 34, gx, 50, { stroke: C.tealInk, sw: 3 });
  s += ln(gx + cell * 4, 34, gx + cell * 4, 50, { stroke: C.tealInk, sw: 3 });
  s += T(gx + cell * 2, 24, 28, C.tealInk, "0.4", { weight: 800 });
  s += ln(136, gy, 136, gy + cell * 7, { stroke: C.amberInk, sw: 3 });
  s += ln(128, gy, 144, gy, { stroke: C.amberInk, sw: 3 });
  s += ln(128, gy + cell * 7, 144, gy + cell * 7, { stroke: C.amberInk, sw: 3 });
  s += T(104, gy + cell * 3.5 + 10, 28, C.amberInk, "0.7", { weight: 800 });
  s += T(gx + cell * 5, 400, 28, C.ink, "28 squares of 100 are shaded twice", { weight: 700 });
  // the same product, written down
  s += T(880, 120, 46, C.navy, "0.4", { weight: 800, anchor: "end" });
  s += T(880, 190, 46, C.navy, "× 0.7", { weight: 800, anchor: "end" });
  s += ln(680, 214, 890, 214, { stroke: C.navy, sw: 3.5 });
  s += T(880, 278, 50, C.coralInk, "0.28", { weight: 800, anchor: "end" });
  s += chip(890, 352, "1 place + 1 place = 2 places", { size: 28 });
  s += chip(890, 424, "0.4 × 0.7 = 0.28", {
    fill: C.greenLight,
    stroke: C.green,
    textFill: C.green,
  });
  return s;
}

// ── Decimal division: 7.2 ÷ 0.9 becomes 72 ÷ 9 = 8 ──────────────────────────
export function decimalQuotient() {
  let s = T(600, 44, 32, C.navy, "Make the divisor a whole number", { weight: 800 });
  // 0.9 ) 7.2
  s += T(300, 232, 46, C.tealInk, "0.9", { weight: 800, anchor: "end" });
  s += ln(314, 190, 486, 190, { stroke: C.navy, sw: 3.5 });
  s += `<path d="M 314 188 q 22 30 0 62" fill="none" stroke="${C.navy}" stroke-width="3.5" stroke-linecap="round" />`;
  s += T(404, 232, 46, C.navy, "7.2", { weight: 800 });
  s += arrow(390, 320, 390, 264, { stroke: C.coralInk, sw: 3 });
  s += chip(390, 356, "× 10", {
    fill: C.coralLight,
    stroke: C.coral,
    textFill: C.coralInk,
    size: 28,
  });
  // same quotient
  s += arrow(556, 214, 676, 214, { stroke: C.muted, sw: 4, head: 16 });
  s += T(616, 186, 26, C.muted, "same quotient", { weight: 700 });
  // 9 ) 72 with quotient 8
  s += T(800, 232, 46, C.tealInk, "9", { weight: 800, anchor: "end" });
  s += ln(814, 190, 966, 190, { stroke: C.navy, sw: 3.5 });
  s += `<path d="M 814 188 q 22 30 0 62" fill="none" stroke="${C.navy}" stroke-width="3.5" stroke-linecap="round" />`;
  s += T(890, 232, 46, C.navy, "72", { weight: 800 });
  s += T(916, 172, 46, C.coralInk, "8", { weight: 800 });
  s += arrow(890, 320, 890, 264, { stroke: C.coralInk, sw: 3 });
  s += chip(890, 356, "× 10", {
    fill: C.coralLight,
    stroke: C.coral,
    textFill: C.coralInk,
    size: 28,
  });
  s += chip(600, 424, "7.2 ÷ 0.9 = 72 ÷ 9 = 8", {
    fill: C.greenLight,
    stroke: C.green,
    textFill: C.green,
  });
  return s;
}

// ── Fraction division on a bar model: 3 ÷ ½ = 6 ─────────────────────────────
export function fractionDivision() {
  const x0 = 230;
  const x1 = 1010;
  const w = x1 - x0;
  let s = ln(x0, 44, x1, 44, { stroke: C.navy, sw: 3 });
  s += ln(x0, 36, x0, 52, { stroke: C.navy, sw: 3 });
  s += ln(x1, 36, x1, 52, { stroke: C.navy, sw: 3 });
  s += T(600, 26, 30, C.navy, "3 wholes", { weight: 800 });
  for (let i = 0; i < 3; i += 1) {
    const cx = x0 + (i + 0.5) * (w / 3);
    s += rect(x0 + i * (w / 3), 62, w / 3, 66, { fill: C.tealLight, stroke: C.teal, sw: 3 });
    s += T(cx, 106, 34, C.tealInk, "1", { weight: 800 });
  }
  for (let i = 0; i < 6; i += 1) {
    const cx = x0 + (i + 0.5) * (w / 6);
    s += rect(x0 + i * (w / 6), 172, w / 6, 66, { fill: C.amberLight, stroke: C.amber, sw: 3 });
    s += T(cx, 216, 34, C.amberInk, "½", { weight: 800 });
    s += T(cx, 276, 28, C.muted, String(i + 1), { weight: 800 });
  }
  s += T(x0 - 24, 108, 28, C.tealInk, "wholes", { weight: 800, anchor: "end" });
  s += T(x0 - 24, 218, 28, C.amberInk, "halves", { weight: 800, anchor: "end" });
  s += chip(600, 336, "6 halves fit inside 3 wholes", { size: 30 });
  s += chip(600, 412, "3 ÷ ½ = 3 × 2 = 6", {
    fill: C.greenLight,
    stroke: C.green,
    textFill: C.green,
  });
  return s;
}

export const NUMBER_MODELS = {
  factors,
  longDivision,
  decimalSum,
  decimalProduct,
  decimalQuotient,
  fractionDivision,
};
