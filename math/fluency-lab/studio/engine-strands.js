// Math Discovery Studio engine covering the 22 K–8 strand skills not yet handled by the 17 core engines.
// Every frame is mathematically grounded in the problem's own numbers, strictly bilingual (EN/ES),
// accessible (bilingual aria-label), and answer-free before the final reveal frame.

import { COLORS, L, esc, frame, svgWrap, txt } from "./core.js";

const C = COLORS;

const SHAPE_META = {
  triangle: { sides: 3, corners: 3, es: "triángulo" },
  square: { sides: 4, corners: 4, es: "cuadrado" },
  rectangle: { sides: 4, corners: 4, es: "rectángulo" },
  trapezoid: { sides: 4, corners: 4, es: "trapecio" },
  pentagon: { sides: 5, corners: 5, es: "pentágono" },
  hexagon: { sides: 6, corners: 6, es: "hexágono" },
  octagon: { sides: 8, corners: 8, es: "octágono" },
  cube: { sides: 6, corners: 8, es: "cubo", solid: true },
  "rectangular prism": { sides: 6, corners: 8, es: "prisma recto", solid: true },
  cylinder: { sides: 2, corners: 0, es: "cilindro", solid: true },
  cone: { sides: 1, corners: 1, es: "cono", solid: true },
  sphere: { sides: 0, corners: 0, es: "esfera", solid: true },
};

function polygonPoints(n, cx, cy, r) {
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push([Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))]);
  }
  return pts;
}

function drawShapeSvg(name, highlight, showAnswer, answer) {
  const meta = SHAPE_META[name] || { sides: 4, corners: 4, es: name };
  let body = "";
  if (name === "rectangle") {
    const pts = [[180, 70], [380, 70], [380, 190], [180, 190]];
    body += `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="#e0f2fe" stroke="${C.whole}" stroke-width="3"/>`;
    if (highlight) pts.forEach(([x, y]) => (body += `<circle cx="${x}" cy="${y}" r="7" fill="${C.hundreds}"/>`));
  } else if (name === "trapezoid") {
    const pts = [[210, 70], [350, 70], [400, 190], [160, 190]];
    body += `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="#e0f2fe" stroke="${C.whole}" stroke-width="3"/>`;
    if (highlight) pts.forEach(([x, y]) => (body += `<circle cx="${x}" cy="${y}" r="7" fill="${C.hundreds}"/>`));
  } else if (name === "cube" || name === "rectangular prism") {
    const w = name === "cube" ? 110 : 160;
    const x0 = 280 - w / 2 - 20;
    const y0 = 95;
    const dx = 40;
    const dy = -30;
    body += `<rect x="${x0 + dx}" y="${y0 + dy}" width="${w}" height="100" fill="#f1f5f9" stroke="${C.mute}" stroke-width="2" stroke-dasharray="5 4"/>`;
    body += `<rect x="${x0}" y="${y0}" width="${w}" height="100" fill="#e0f2fe" fill-opacity="0.75" stroke="${C.whole}" stroke-width="3"/>`;
    const corners = [
      [x0, y0], [x0 + w, y0], [x0, y0 + 100], [x0 + w, y0 + 100],
      [x0 + dx, y0 + dy], [x0 + w + dx, y0 + dy], [x0 + dx, y0 + 100 + dy], [x0 + w + dx, y0 + 100 + dy],
    ];
    for (let i = 0; i < 4; i += 1) {
      body += `<line x1="${corners[i][0]}" y1="${corners[i][1]}" x2="${corners[i + 4][0]}" y2="${corners[i + 4][1]}" stroke="${C.whole}" stroke-width="2.5"/>`;
    }
    if (highlight) corners.forEach(([x, y]) => (body += `<circle cx="${x}" cy="${y}" r="6" fill="${C.hundreds}"/>`));
  } else if (name === "sphere") {
    body += `<circle cx="280" cy="130" r="65" fill="#e0f2fe" stroke="${C.whole}" stroke-width="3"/><ellipse cx="280" cy="130" rx="65" ry="20" fill="none" stroke="${C.mute}" stroke-dasharray="5 4"/>`;
  } else if (name === "cylinder") {
    body += `<ellipse cx="280" cy="75" rx="60" ry="18" fill="#dbeafe" stroke="${C.whole}" stroke-width="3"/><line x1="220" y1="75" x2="220" y2="185" stroke="${C.whole}" stroke-width="3"/><line x1="340" y1="75" x2="340" y2="185" stroke="${C.whole}" stroke-width="3"/><ellipse cx="280" cy="185" rx="60" ry="18" fill="#e0f2fe" stroke="${C.whole}" stroke-width="3"/>`;
  } else if (name === "cone") {
    body += `<ellipse cx="280" cy="190" rx="60" ry="16" fill="#e0f2fe" stroke="${C.whole}" stroke-width="3"/><line x1="220" y1="190" x2="280" y2="60" stroke="${C.whole}" stroke-width="3"/><line x1="340" y1="190" x2="280" y2="60" stroke="${C.whole}" stroke-width="3"/>`;
    if (highlight) body += `<circle cx="280" cy="60" r="7" fill="${C.hundreds}"/>`;
  } else {
    const pts = polygonPoints(meta.sides || 4, 280, 130, 68);
    body += `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="#e0f2fe" stroke="${C.whole}" stroke-width="3"/>`;
    if (highlight) pts.forEach(([x, y]) => (body += `<circle cx="${x}" cy="${y}" r="7" fill="${C.hundreds}"/>`));
  }
  body += txt(280, 238, showAnswer ? L(`Count: ${answer}`, `Total: ${answer}`) : L(name, meta.es), { size: 18, fill: showAnswer ? C.part : C.ink });
  return body;
}

function drawEqualSharesSvg(spec, step) {
  const { total, part, mode, unit, answer } = spec;
  let body = "";
  if (mode === "pizza") {
    const cx = 280;
    const cy = 128;
    const r = 74;
    for (let i = 0; i < total; i += 1) {
      const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / total;
      const a1 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / total;
      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const eaten = step >= 1 && i < part;
      const fill = eaten ? "#fed7aa" : step >= 2 ? "#ccfbf1" : "#e0f2fe";
      body += `<path d="M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${fill}" stroke="${C.whole}" stroke-width="2.5"/>`;
    }
    body += txt(280, 234, step === 2 ? L(`Left: ${answer}`, `Quedan: ${answer}`) : L(`${total} equal shares`, `${total} partes iguales`), { size: 18 });
  } else {
    const w = 400 / total;
    for (let i = 0; i < total; i += 1) {
      const x = 80 + i * w;
      body += `<rect x="${x}" y="90" width="${w}" height="56" fill="${step >= 1 ? "#ccfbf1" : "#e0f2fe"}" stroke="${C.whole}" stroke-width="2.5"/>`;
      if (step >= 1) body += txt(x + w / 2, 124, String(unit), { size: 18, fill: C.part });
    }
    body += txt(280, 195, step === 2 ? L(`Total: ${answer}`, `Total: ${answer}`) : L(`${total} equal pieces`, `${total} partes iguales`), { size: 18 });
  }
  return body;
}

function drawDoublesSvg(a, b, step, answer) {
  const small = Math.min(a, b);
  const diff = Math.abs(a - b);
  let body = "";
  const r = 13;
  const gap = 36;
  const x0 = 280 - ((Math.max(a, b) - 1) * gap) / 2;
  for (let i = 0; i < a; i += 1) {
    body += `<circle cx="${x0 + i * gap}" cy="92" r="${r}" fill="${C.whole}"/>`;
  }
  for (let i = 0; i < b; i += 1) {
    const extra = i >= small;
    body += `<circle cx="${x0 + i * gap}" cy="144" r="${r}" fill="${extra ? C.hundreds : C.part}"/>`;
  }
  const label =
    step === 0
      ? `${a} + ${b}`
      : step === 1
        ? diff
          ? `${small} + ${small} + ${diff}`
          : `${small} + ${small}`
        : `${a} + ${b} = ${answer}`;
  body += txt(280, 218, label, { size: 22, fill: step === 2 ? C.part : C.ink });
  return body;
}

function drawClockSvg(spec, step) {
  const cx = 280;
  const cy = 122;
  const r = 82;
  let body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="${C.whole}" stroke-width="3"/>`;
  for (let n = 1; n <= 12; n += 1) {
    const a = -Math.PI / 2 + (n * Math.PI) / 6;
    body += txt(Math.round(cx + (r - 18) * Math.cos(a)), Math.round(cy + (r - 18) * Math.sin(a) + 6), String(n), { size: 14, fill: C.ink });
  }
  const toAngle = (m) => -Math.PI / 2 + (m / 60) * 2 * Math.PI;
  const m1 = spec.startMin ?? 0;
  const m2 = spec.endMin ?? (spec.targetNum || 0) * 5;
  if (step >= 1) {
    const a1 = toAngle(m1);
    const a2 = toAngle(m2);
    const x1 = cx + (r - 30) * Math.cos(a1);
    const y1 = cy + (r - 30) * Math.sin(a1);
    const x2 = cx + (r - 30) * Math.cos(a2);
    const y2 = cy + (r - 30) * Math.sin(a2);
    body += `<line x1="${cx}" y1="${cy}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${C.mute}" stroke-width="3" stroke-linecap="round"/>`;
    body += `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${C.hundreds}" stroke-width="4" stroke-linecap="round"/>`;
  }
  body += `<circle cx="${cx}" cy="${cy}" r="5" fill="${C.ink}"/>`;
  body += txt(280, 236, step === 2 ? L(`${spec.answer} minutes`, `${spec.answer} minutos`) : L("Count by fives", "Cuenta de cinco en cinco"), { size: 18, fill: step === 2 ? C.part : C.ink });
  return body;
}

function drawMentalTensSvg(spec, step) {
  const { base, delta, dir, answer } = spec;
  const h = Math.floor(base / 100);
  const t = Math.floor((base % 100) / 10);
  const o = base % 10;
  const ah = Math.floor(Number(answer) / 100);
  const at = Math.floor((Number(answer) % 100) / 10);
  const ao = Number(answer) % 10;
  const targetCol = delta === 100 ? 0 : 1;
  const cols = [
    { label: L("H", "C"), val: step === 2 ? ah : h, x: 140 },
    { label: L("T", "D"), val: step === 2 ? at : t, x: 280 },
    { label: L("O", "U"), val: step === 2 ? ao : o, x: 420 },
  ];
  let body = "";
  cols.forEach((c, idx) => {
    const active = step >= 1 && idx === targetCol;
    body += `<rect x="${c.x - 55}" y="52" width="110" height="120" rx="10" fill="${active ? "#fef3c7" : "#f8fafc"}" stroke="${active ? C.hundreds : C.rule}" stroke-width="${active ? 3 : 2}"/>`;
    body += txt(c.x, 82, c.label, { size: 16, fill: C.mute });
    body += txt(c.x, 140, String(c.val), { size: 34, fill: active ? C.hundreds : C.ink });
  });
  const op = dir === "more" ? "+" : "−";
  body += txt(280, 224, step === 2 ? `${base} ${op} ${delta} = ${answer}` : `${base} ${op} ${delta} = ?`, { size: 22, fill: step === 2 ? C.part : C.ink });
  return body;
}

function drawScaledGraphSvg(spec, step) {
  const { scale, aSquares, bSquares, answer } = spec;
  let body = "";
  const drawBar = (y, count, label, fill) => {
    body += txt(65, y + 24, label, { size: 16, anchor: "end" });
    const size = Math.min(34, Math.floor(380 / Math.max(count, 1)));
    for (let i = 0; i < count; i += 1) {
      body += `<rect x="${80 + i * (size + 4)}" y="${y}" width="${size}" height="34" rx="4" fill="${fill}" stroke="${C.whole}" stroke-width="2"/>`;
      if (step >= 1) body += txt(80 + i * (size + 4) + size / 2, y + 23, String(scale), { size: 14, fill: C.ink });
    }
  };
  drawBar(68, aSquares, "A", "#dbeafe");
  if (bSquares != null) drawBar(124, bSquares, "B", "#ccfbf1");
  body += txt(280, 206, L(`1 □ = ${scale}`, `1 □ = ${scale}`), { size: 17, fill: C.hundreds });
  if (step === 2) body += txt(280, 238, `= ${answer}`, { size: 22, fill: C.part });
  return body;
}

function drawMixedNumberSvg(spec, step) {
  const { whole, num, den, improper, toMixed, answer } = spec;
  const wholes = Math.min(whole, 5);
  const barW = 72;
  const startX = 280 - ((wholes + 1) * (barW + 10)) / 2;
  let body = "";
  for (let w = 0; w < wholes; w += 1) {
    const x = startX + w * (barW + 10);
    body += `<rect x="${x}" y="82" width="${barW}" height="52" rx="4" fill="#dbeafe" stroke="${C.whole}" stroke-width="2.5"/>`;
    body += txt(x + barW / 2, 114, `${den}/${den}`, { size: 16, fill: C.whole });
  }
  const rx = startX + wholes * (barW + 10);
  body += `<rect x="${rx}" y="82" width="${barW}" height="52" rx="4" fill="#f8fafc" stroke="${C.whole}" stroke-width="2.5"/>`;
  const fillW = Math.round((barW * num) / den);
  body += `<rect x="${rx}" y="82" width="${fillW}" height="52" rx="4" fill="#99f6e4" stroke="${C.part}" stroke-width="2"/>`;
  body += txt(rx + barW / 2, 114, `${num}/${den}`, { size: 16, fill: C.ink });
  const eq =
    step === 0
      ? toMixed
        ? `${improper}/${den}`
        : `${whole} ${num}/${den}`
      : step === 1
        ? toMixed
          ? `${improper} ÷ ${den}`
          : `${whole} × ${den} + ${num}`
        : `${answer}`;
  body += txt(280, 198, eq, { size: 22, fill: step === 2 ? C.part : C.ink });
  return body;
}

function drawAngleSvg(spec, step) {
  const cx = 280;
  const cy = 188;
  const r = 92;
  let body = "";
  if (spec.kind === "triangle") {
    body += `<polygon points="150,196 410,196 290,54" fill="#e0f2fe" stroke="${C.whole}" stroke-width="3"/>`;
    body += txt(215, 184, `${spec.a}°`, { size: 17 });
    body += txt(345, 184, `${spec.b}°`, { size: 17 });
    body += txt(288, 96, step === 2 ? `${spec.answer}°` : "?°", { size: 19, fill: step === 2 ? C.part : C.hundreds });
    body += txt(280, 236, step === 1 ? `${spec.a}° + ${spec.b}° = ${spec.a + spec.b}°` : "180°", { size: 18, fill: step === 1 ? C.ink : C.mute });
  } else if (spec.kind === "vertical") {
    body += `<line x1="150" y1="70" x2="410" y2="190" stroke="${C.whole}" stroke-width="3"/><line x1="150" y1="190" x2="410" y2="70" stroke="${C.whole}" stroke-width="3"/>`;
    body += txt(280, 86, `${spec.a}°`, { size: 18, fill: C.whole });
    body += txt(280, 188, step === 2 ? `${spec.answer}°` : "?°", { size: 19, fill: step === 2 ? C.part : C.hundreds });
  } else if (spec.kind === "circle-turn") {
    body += `<circle cx="${cx}" cy="126" r="72" fill="#e0f2fe" stroke="${C.whole}" stroke-width="3"/>`;
    body += `<line x1="${cx}" y1="126" x2="${cx + 72}" y2="126" stroke="${C.whole}" stroke-width="3"/>`;
    const rad = ((360 / Math.max(2, spec.den || 4)) * Math.PI) / 180;
    body += `<line x1="${cx}" y1="126" x2="${(cx + 72 * Math.cos(rad)).toFixed(1)}" y2="${(126 - 72 * Math.sin(rad)).toFixed(1)}" stroke="${C.hundreds}" stroke-width="3"/>`;
    body += txt(cx, 232, step === 2 ? `360° ÷ ${spec.den} = ${spec.answer}°` : `1/${spec.den} × 360° = ?°`, { size: 18, fill: step === 2 ? C.part : C.ink });
  } else {
    body += `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${C.whole}" stroke-width="3"/>`;
    const rad = ((180 - Math.min(165, Math.max(15, spec.a || 60))) * Math.PI) / 180;
    body += `<line x1="${cx}" y1="${cy}" x2="${(cx + r * Math.cos(rad)).toFixed(1)}" y2="${(cy - r * Math.sin(rad)).toFixed(1)}" stroke="${C.hundreds}" stroke-width="3"/>`;
    body += txt(cx + 42, cy - 26, `${spec.a}°`, { size: 17, fill: C.whole });
    body += txt(cx - 46, cy - 26, step === 2 ? `${spec.answer}°` : "?°", { size: 18, fill: step === 2 ? C.part : C.hundreds });
    if (spec.total) body += txt(280, 232, `${spec.total}°`, { size: 18, fill: C.mute });
  }
  return body;
}

function drawCoordPlaneSvg(spec, step) {
  const quad4 = spec.quad4;
  const x0 = quad4 ? 280 : 150;
  const y0 = quad4 ? 130 : 210;
  const scale = quad4 ? 11 : 16;
  let body = "";
  const min = quad4 ? -9 : 0;
  const max = quad4 ? 9 : 10;
  for (let i = min; i <= max; i += 1) {
    const gx = x0 + i * scale;
    const gy = y0 - i * scale;
    body += `<line x1="${gx}" y1="${y0 - max * scale}" x2="${gx}" y2="${y0 - min * scale}" stroke="#e2e8f0" stroke-width="1"/>`;
    body += `<line x1="${x0 + min * scale}" y1="${gy}" x2="${x0 + max * scale}" y2="${gy}" stroke="#e2e8f0" stroke-width="1"/>`;
  }
  body += `<line x1="${x0 + min * scale}" y1="${y0}" x2="${x0 + max * scale}" y2="${y0}" stroke="${C.ink}" stroke-width="2.5"/>`;
  body += `<line x1="${x0}" y1="${y0 - max * scale}" x2="${x0}" y2="${y0 - min * scale}" stroke="${C.ink}" stroke-width="2.5"/>`;
  const px = x0 + spec.x1 * scale;
  const py = y0 - spec.y1 * scale;
  body += `<circle cx="${px}" cy="${py}" r="6" fill="${C.whole}"/>`;
  body += txt(px + 18, py - 10, `(${spec.x1}, ${spec.y1})`, { size: 14, fill: C.whole });
  if (step >= 1 && spec.x2 != null && spec.y2 != null) {
    const qx = x0 + spec.x2 * scale;
    const qy = y0 - spec.y2 * scale;
    body += `<line x1="${px}" y1="${py}" x2="${qx}" y2="${qy}" stroke="${C.hundreds}" stroke-width="2.5" stroke-dasharray="5 4"/>`;
    if (step === 2) {
      body += `<circle cx="${qx}" cy="${qy}" r="6" fill="${C.part}"/>`;
      body += txt(qx + 18, qy + 16, `(${spec.x2}, ${spec.y2})`, { size: 14, fill: C.part });
    }
  }
  return body;
}

function drawNumberLineSvg(spec, step) {
  let body = `<line x1="60" y1="130" x2="500" y2="130" stroke="${C.ink}" stroke-width="3"/>`;
  body += `<line x1="280" y1="116" x2="280" y2="144" stroke="${C.ink}" stroke-width="2.5"/>`;
  body += txt(280, 168, "0", { size: 16 });
  if (spec.kind === "ineq") {
    const bx = 280 + (spec.bound >= 0 ? 70 : -70);
    body += `<line x1="${bx}" y1="118" x2="${bx}" y2="142" stroke="${C.whole}" stroke-width="2.5"/>`;
    body += txt(bx, 168, String(spec.bound), { size: 16, fill: C.whole });
    if (step >= 1) {
      const rayEnd = spec.dir === "right" ? 490 : 70;
      body += `<line x1="${bx}" y1="130" x2="${rayEnd}" y2="130" stroke="${C.part}" stroke-width="6"/>`;
      body += `<circle cx="${bx}" cy="130" r="8" fill="${spec.inclusive ? C.part : "#ffffff"}" stroke="${C.part}" stroke-width="3"/>`;
    }
    if (step === 2) body += txt(280, 220, spec.answer, { size: 22, fill: C.part });
  } else {
    const vals = spec.values || [];
    const min = Math.min(-1, ...vals);
    const max = Math.max(1, ...vals);
    const span = max - min || 1;
    vals.forEach((v, idx) => {
      const x = 80 + ((v - min) / span) * 400;
      body += `<circle cx="${x.toFixed(1)}" cy="130" r="6" fill="${step >= 1 ? C.whole : C.mute}"/>`;
      if (step >= 1) body += txt(x.toFixed(1), idx % 2 === 0 ? 104 : 162, spec.labels[idx], { size: 14, fill: C.whole });
    });
    if (step === 2) body += txt(280, 224, spec.answer, { size: 17, fill: C.part });
  }
  return body;
}

function drawGenericMathCardSvg(titlePair, eqLine, subLine, highlightStep, answer) {
  let body = `<rect x="48" y="38" width="464" height="184" rx="14" fill="#f8fafc" stroke="${highlightStep === 2 ? C.part : C.whole}" stroke-width="3"/>`;
  body += txt(280, 76, titlePair, { size: 16, fill: C.mute });
  body += txt(280, 128, eqLine, { size: 22, fill: C.ink });
  body += txt(280, 178, highlightStep === 2 ? `= ${answer}` : subLine, { size: 20, fill: highlightStep === 2 ? C.part : C.hundreds });
  return body;
}

function drawPrismSvg(l, w, h, step, answer, midLine = "") {
  let body = `<rect x="170" y="94" width="170" height="90" fill="#dbeafe" stroke="${C.whole}" stroke-width="3"/>`;
  body += `<polygon points="170,94 220,58 390,58 340,94" fill="#e0f2fe" stroke="${C.whole}" stroke-width="2.5"/>`;
  body += `<polygon points="340,94 390,58 390,148 340,184" fill="#bfdbfe" stroke="${C.whole}" stroke-width="2.5"/>`;
  body += txt(255, 208, l, { size: 16, fill: C.whole });
  body += txt(386, 174, w, { size: 16, fill: C.hundreds });
  body += txt(138, 144, h, { size: 16, fill: C.part });
  if (step === 1) body += txt(280, 240, midLine || `V = ${l} × ${w} × ${h}`, { size: 16, fill: C.ink });
  if (step === 2) body += txt(280, 240, `V = ${answer}`, { size: 20, fill: C.part });
  return body;
}

function drawCircleSvg(spec, step) {
  let body = `<circle cx="280" cy="118" r="72" fill="#e0f2fe" stroke="${C.whole}" stroke-width="3"/>`;
  body += `<circle cx="280" cy="118" r="4" fill="${C.ink}"/>`;
  if (spec.hasDiameter) {
    body += `<line x1="208" y1="118" x2="352" y2="118" stroke="${C.hundreds}" stroke-width="3"/>`;
    body += txt(280, 108, `d = ${spec.val}`, { size: 17, fill: C.hundreds });
  } else {
    body += `<line x1="280" y1="118" x2="352" y2="118" stroke="${C.hundreds}" stroke-width="3"/>`;
    body += txt(316, 108, spec.val ? `r = ${spec.val}` : "r = ?", { size: 17, fill: C.hundreds });
  }
  const line = step === 0 ? "C = π × d = 2 × π × r" : step === 1 ? spec.setup : `= ${spec.answer}`;
  body += txt(280, 228, line, { size: 19, fill: step === 2 ? C.part : C.ink });
  return body;
}

function drawRoundSolidSvg(spec, step) {
  let body = "";
  if (spec.solid === "sphere") {
    body += `<circle cx="280" cy="118" r="68" fill="#e0f2fe" stroke="${C.whole}" stroke-width="3"/><ellipse cx="280" cy="118" rx="68" ry="20" fill="none" stroke="${C.mute}" stroke-dasharray="5 4"/>`;
    body += `<line x1="280" y1="118" x2="348" y2="118" stroke="${C.hundreds}" stroke-width="3"/>`;
    body += txt(314, 108, `r = ${spec.r}`, { size: 16, fill: C.hundreds });
  } else if (spec.solid === "cone") {
    body += `<ellipse cx="280" cy="176" rx="58" ry="15" fill="#dbeafe" stroke="${C.whole}" stroke-width="3"/><line x1="222" y1="176" x2="280" y2="54" stroke="${C.whole}" stroke-width="3"/><line x1="338" y1="176" x2="280" y2="54" stroke="${C.whole}" stroke-width="3"/>`;
    body += `<line x1="280" y1="54" x2="280" y2="176" stroke="${C.part}" stroke-width="2.5" stroke-dasharray="4 4"/>`;
    body += txt(252, 124, `h = ${spec.h}`, { size: 15, fill: C.part });
    body += txt(312, 172, `r = ${spec.r}`, { size: 15, fill: C.hundreds });
  } else {
    body += `<ellipse cx="280" cy="68" rx="58" ry="15" fill="#dbeafe" stroke="${C.whole}" stroke-width="3"/><line x1="222" y1="68" x2="222" y2="174" stroke="${C.whole}" stroke-width="3"/><line x1="338" y1="68" x2="338" y2="174" stroke="${C.whole}" stroke-width="3"/><ellipse cx="280" cy="174" rx="58" ry="15" fill="#e0f2fe" stroke="${C.whole}" stroke-width="3"/>`;
    body += txt(368, 124, `h = ${spec.h}`, { size: 15, fill: C.part });
    body += txt(308, 66, `r = ${spec.r}`, { size: 15, fill: C.hundreds });
  }
  const formula = spec.solid === "sphere" ? "V = (4/3) × π × r³" : spec.solid === "cone" ? "V = (1/3) × π × r² × h" : "V = π × r² × h";
  const rNum = Number(spec.r);
  const hNum = Number(spec.h || 0);
  const baseArea = Math.round(3.14 * rNum * rNum * 100) / 100;
  const rCubed = rNum * rNum * rNum;
  const cylVol = Math.round(baseArea * hNum * 100) / 100;
  const fourThirdsR3 = Math.round(((rCubed * 4) / 3) * 100) / 100;
  const step1Line =
    spec.solid === "sphere"
      ? `r³ = ${rCubed}, (4/3) × ${rCubed} = ${fourThirdsR3}`
      : spec.solid === "cone"
        ? `3.14 × ${rNum}² = ${baseArea}, × ${hNum} = ${cylVol}`
        : `3.14 × ${rNum} × ${rNum} = ${baseArea}`;
  body += txt(280, 232, step === 2 ? `V = ${spec.answer}` : step === 1 ? step1Line : formula, { size: step === 1 ? 16 : 19, fill: step === 2 ? C.part : C.ink });
  return body;
}

function drawSamplingSvg(spec, step) {
  let body = `<rect x="70" y="64" width="160" height="96" rx="10" fill="#dbeafe" stroke="${C.whole}" stroke-width="2.5"/>`;
  body += txt(150, 96, L("Sample", "Muestra"), { size: 16, fill: C.mute });
  body += txt(150, 134, `${spec.part} / ${spec.sample}`, { size: 22, fill: C.whole });
  body += `<line x1="242" y1="112" x2="318" y2="112" stroke="${C.hundreds}" stroke-width="3"/>`;
  body += `<polygon points="318,105 330,112 318,119" fill="${C.hundreds}"/>`;
  body += `<rect x="336" y="64" width="160" height="96" rx="10" fill="#ccfbf1" stroke="${C.part}" stroke-width="2.5"/>`;
  body += txt(416, 96, L("Whole group", "Grupo total"), { size: 16, fill: C.mute });
  body += txt(416, 134, step === 2 ? `${spec.answer} / ${spec.pop}` : `? / ${spec.pop}`, { size: 22, fill: C.part });
  if (step >= 1) body += txt(280, 212, `(${spec.part} ÷ ${spec.sample}) × ${spec.pop}`, { size: 18, fill: C.ink });
  return body;
}

function parseNumToken(tok) {
  const s = tok.trim().replaceAll("−", "-");
  const mix = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mix) {
    const sign = Number(mix[1]) < 0 ? -1 : 1;
    return sign * (Math.abs(Number(mix[1])) + Number(mix[2]) / Number(mix[3]));
  }
  const frac = s.match(/^(-?\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return Number(s);
}

export function parse(question, item = {}) {
  const q = String(question || "");
  const answer = String(item.answers?.[0] ?? "");
  if (!answer) return null;

  // 1:shapes-2d3d
  const shapeM = q.match(/How many (corners|sides|faces) does (?:a|an) ([a-z ]+) have\?/i);
  if (shapeM && SHAPE_META[shapeM[2].toLowerCase()]) {
    return { kind: "shape", feature: shapeM[1].toLowerCase(), shape: shapeM[2].toLowerCase(), answer };
  }

  // 1:equal-shares
  const pizzaM = q.match(/cut into (\d+) equal shares\.\s*(\d+) share/i);
  if (pizzaM) return { kind: "shares", mode: "pizza", total: Number(pizzaM[1]), part: Number(pizzaM[2]), answer };
  const ropeM = q.match(/cut into (\d+) equal pieces\.\s*Each piece is (\d+)/i);
  if (ropeM) return { kind: "shares", mode: "rope", total: Number(ropeM[1]), unit: Number(ropeM[2]), answer };

  // 2:doubles-near
  const dblM = q.match(/^What is (\d+) \+ (\d+)\?/i);
  if (dblM && Math.abs(Number(dblM[1]) - Number(dblM[2])) <= 1) {
    return { kind: "doubles", a: Number(dblM[1]), b: Number(dblM[2]), answer };
  }

  // 2:time-five
  const clockHandM = q.match(/minute hand points to the (\d+)/i);
  if (clockHandM) return { kind: "clock", targetNum: Number(clockHandM[1]), startMin: 0, endMin: Number(clockHandM[1]) * 5, answer };
  const elapsedM = q.match(/from \d+:(\d\d) to \d+:(\d\d)/i);
  if (elapsedM) return { kind: "clock", startMin: Number(elapsedM[1]), endMin: Number(elapsedM[2]), answer };

  // 2:mental-tens
  const mentalM = q.match(/What is (10|100) (more|less) than (\d+)\?/i);
  if (mentalM) return { kind: "mental", delta: Number(mentalM[1]), dir: mentalM[2].toLowerCase(), base: Number(mentalM[3]), answer };

  // 3:scaled-graphs
  const barDiffM = q.match(/each square stands for (\d+).*?Class A's bar has (\d+) squares and Class B's bar has (\d+) squares/i);
  if (barDiffM) return { kind: "scaled-graph", scale: Number(barDiffM[1]), aSquares: Number(barDiffM[2]), bSquares: Number(barDiffM[3]), answer };
  const barOneM = q.match(/each square stands for (\d+).*?has (\d+) squares/i);
  if (barOneM) return { kind: "scaled-graph", scale: Number(barOneM[1]), aSquares: Number(barOneM[2]), bSquares: null, answer };

  // 4:mixed-numbers
  const impM = q.match(/Write (\d+)\/(\d+) as a mixed number/i);
  if (impM) {
    const imp = Number(impM[1]);
    const den = Number(impM[2]);
    return { kind: "mixed", toMixed: true, improper: imp, den, whole: Math.floor(imp / den), num: imp % den, answer };
  }
  const mixM = q.match(/Write (\d+) (\d+)\/(\d+) as an improper fraction/i);
  if (mixM) {
    const whole = Number(mixM[1]);
    const num = Number(mixM[2]);
    const den = Number(mixM[3]);
    return { kind: "mixed", toMixed: false, whole, num, den, improper: whole * den + num, answer };
  }

  // 4:angle-measure & 7:angle-facts
  const triM = q.match(/Two angles of a triangle measure (\d+)° and (\d+)°/i);
  if (triM) return { kind: "angle", sub: "triangle", a: Number(triM[1]), b: Number(triM[2]), answer };
  const triAlgM = q.match(/angles of a triangle measure ([^,]+°),\s*([^ ]+°) and ([^.]+°)/i);
  if (triAlgM) return { kind: "angle-alg", terms: [triAlgM[1], triAlgM[2], triAlgM[3]], answer };
  const splitAngM = q.match(/(right|straight) angle \((\d+)°\).*?measures (\d+)°/i);
  if (splitAngM) return { kind: "angle", sub: splitAngM[1].toLowerCase(), total: Number(splitAngM[2]), a: Number(splitAngM[3]), answer };
  const lineAngM = q.match(/straight line\.\s*One measures (\d+)°/i);
  if (lineAngM) return { kind: "angle", sub: "straight", total: 180, a: Number(lineAngM[1]), answer };
  const joinAngM = q.match(/measure (\d+)° and (\d+)°\.\s*What is the measure of the combined angle/i);
  if (joinAngM) return { kind: "angle", sub: "join", a: Number(joinAngM[1]), b: Number(joinAngM[2]), answer };
  const adjCrossM = q.match(/Two lines cross\.\s*One angle measures (\d+)°.*next to it/i);
  if (adjCrossM) return { kind: "angle", sub: "straight", total: 180, a: Number(adjCrossM[1]), answer };
  const vertAngM = q.match(/Two lines cross\.\s*One angle measures (\d+)°/i);
  if (vertAngM) return { kind: "angle", sub: "vertical", a: Number(vertAngM[1]), answer };
  const turnAngM = q.match(/turns through 1\/(\d+) of a full circle/i);
  if (turnAngM) return { kind: "angle", sub: "circle-turn", den: Number(turnAngM[1]), total: 360, a: null, answer };

  // 5:coordinate-plane
  const origMoveM = q.match(/Start at the origin \(0, 0\)\. Move (\d+) units right and (\d+) units up/i);
  if (origMoveM) return { kind: "coord", quad4: false, x1: 0, y1: 0, x2: Number(origMoveM[1]), y2: Number(origMoveM[2]), answer };
  const ptMoveM = q.match(/point is at \((\d+), (\d+)\)\. It moves (\d+) units right and (\d+) units up/i);
  if (ptMoveM) {
    const x1 = Number(ptMoveM[1]);
    const y1 = Number(ptMoveM[2]);
    return { kind: "coord", quad4: false, x1, y1, x2: x1 + Number(ptMoveM[3]), y2: y1 + Number(ptMoveM[4]), answer };
  }
  const distM = q.match(/\((\d+), (\d+)\) and \((\d+), (\d+)\)\. How many units apart/i);
  if (distM) return { kind: "coord", quad4: false, x1: Number(distM[1]), y1: Number(distM[2]), x2: Number(distM[3]), y2: Number(distM[4]), answer };

  // 5:order-ops
  const opsM = q.match(/^Evaluate:\s*(.+?)\.?$/i);
  if (opsM && /[×÷+\-−()]/.test(opsM[1])) return { kind: "order-ops", expr: opsM[1].trim(), answer };

  // 6:order-rational
  const ordM = q.match(/^Order from least to greatest:\s*(.+?)\.?$/i);
  if (ordM) {
    const labels = ordM[1].split(",").map((s) => s.trim());
    const values = labels.map(parseNumToken);
    if (values.every(Number.isFinite)) return { kind: "order-rational", labels, values, answer };
  }

  // 6:equivalent-expressions & 7:like-terms
  const exprM = q.match(/^(?:Combine like terms|Simplify the expression|Factor|Write|Use the distributive property to write)[: ]+(.+)$/i);
  if (exprM && /x/i.test(exprM[1])) {
    const cleaned = exprM[1].replace(/\.$/, "").replace(/ using the greatest common factor| as an equivalent expression.*| without parentheses/i, "").trim();
    return { kind: "algebra-expr", expr: cleaned, answer };
  }

  // 6:write-inequalities
  const ineqM = q.match(/Write an inequality for .+? ([a-z])\./i);
  if (ineqM && /[<>≤≥]/.test(answer)) {
    const boundM = q.match(/(\d+(?:\.\d+)?)/);
    if (boundM) {
      const dir = answer.includes(">") || answer.includes("≥") ? "right" : "left";
      const inclusive = answer.includes("≤") || answer.includes("≥");
      return { kind: "ineq", variable: ineqM[1], bound: Number(boundM[1]), dir, inclusive, answer };
    }
  }

  // 6:volume-fractional
  const prismM = q.match(/rectangular prism is ([0-9/ ]+) ft long, ([0-9/ ]+) ft wide and ([0-9/ ]+) ft tall/i);
  if (prismM) return { kind: "prism", l: prismM[1].trim(), w: prismM[2].trim(), h: prismM[3].trim(), answer };

  // 7:circumference
  const circRM = q.match(/circle has a radius of (\d+(?:\.\d+)?) cm.*circumference/i);
  if (circRM) return { kind: "circle", hasDiameter: false, val: circRM[1], setup: `2 × 3.14 × ${circRM[1]}`, answer };
  const circDM = q.match(/circle has a diameter of (\d+(?:\.\d+)?) cm.*circumference/i);
  if (circDM) return { kind: "circle", hasDiameter: true, val: circDM[1], setup: `3.14 × ${circDM[1]}`, answer };
  const circInvM = q.match(/circumference of a circle is (\d+(?:\.\d+)?) cm.*radius/i);
  if (circInvM) return { kind: "circle", hasDiameter: false, val: null, setup: `${circInvM[1]} ÷ (2 × 3.14)`, answer };

  // 7:sampling
  const sampM = q.match(/random sample of (\d+) .+ found that (\d+) .+ About how many of (\d+)/i);
  if (sampM) return { kind: "sampling", sample: Number(sampM[1]), part: Number(sampM[2]), pop: Number(sampM[3]), answer };

  // 8:scientific-ops
  const sciM = q.match(/scientific notation:\s*(.+)$/i);
  if (sciM) return { kind: "scientific", expr: sciM[1].trim(), answer };

  // 8:volume-round
  const sphM = q.match(/sphere has a radius of (\d+(?:\.\d+)?) cm/i);
  if (sphM) return { kind: "round-solid", solid: "sphere", r: sphM[1], answer };
  const coneM = q.match(/cone has a radius of (\d+(?:\.\d+)?) cm and a height of (\d+(?:\.\d+)?) cm/i);
  if (coneM) return { kind: "round-solid", solid: "cone", r: coneM[1], h: coneM[2], answer };
  const cylM = q.match(/cylinder has a radius of (\d+(?:\.\d+)?) cm and a height of (\d+(?:\.\d+)?) cm/i);
  if (cylM) return { kind: "round-solid", solid: "cylinder", r: cylM[1], h: cylM[2], answer };

  // 8:transformations-move
  const transM = q.match(/^(Rotate|Dilate|Translate|Reflect)\s+\((-?\d+),\s*(-?\d+)\)/i);
  if (transM) {
    const ansPt = answer.match(/\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/);
    return {
      kind: "coord",
      quad4: true,
      action: transM[1].toLowerCase(),
      x1: Number(transM[2]),
      y1: Number(transM[3]),
      x2: ansPt ? Number(ansPt[1]) : null,
      y2: ansPt ? Number(ansPt[2]) : null,
      answer,
    };
  }

  // 8:compare-functions
  const fnM = q.match(/Function A is ([^.]+)\.\s*Function B (?:is|has) ([^.]+)\./i);
  if (fnM) return { kind: "compare-fn", fnA: fnM[1].trim(), fnB: fnM[2].trim(), answer };

  return null;
}

export function frames(spec) {
  const mk = (id, cap, eq, body, alt) =>
    frame({ id, cap, eq, svg: svgWrap(body, alt.en), alt });

  switch (spec.kind) {
    case "shape": {
      const esShape = SHAPE_META[spec.shape]?.es || spec.shape;
      return [
        mk("f0", L(`Look closely at the ${spec.shape}.`, `Observa con atención el ${esShape}.`), "", drawShapeSvg(spec.shape, false, false, spec.answer), L(`Diagram of a ${spec.shape}`, `Diagrama de un ${esShape}`)),
        mk("f1", L(`Mark each ${spec.feature.slice(0, -1)} as you count.`, `Marca cada parte al contar.`), "", drawShapeSvg(spec.shape, true, false, spec.answer), L(`Highlighted features on ${spec.shape}`, `Partes marcadas en el ${esShape}`)),
        mk("f2", L(`The total count is ${spec.answer}.`, `El total es ${spec.answer}.`), `= ${spec.answer}`, drawShapeSvg(spec.shape, true, true, spec.answer), L(`${spec.shape} has ${spec.answer}`, `${esShape} tiene ${spec.answer}`)),
      ];
    }
    case "shares":
      return [
        mk("f0", L(`Start with ${spec.total} equal parts.`, `Comienza con ${spec.total} partes iguales.`), "", drawEqualSharesSvg(spec, 0), L(`${spec.total} equal parts`, `${spec.total} partes iguales`)),
        mk("f1", L("Show the parts described in the problem.", "Muestra las partes del problema."), "", drawEqualSharesSvg(spec, 1), L("Equal shares model", "Modelo de partes iguales")),
        mk("f2", L(`The result is ${spec.answer}.`, `El resultado es ${spec.answer}.`), `= ${spec.answer}`, drawEqualSharesSvg(spec, 2), L(`Result ${spec.answer}`, `Resultado ${spec.answer}`)),
      ];
    case "doubles":
      return [
        mk("f0", L(`Show ${spec.a} and ${spec.b} as two rows.`, `Muestra ${spec.a} y ${spec.b} en dos filas.`), `${spec.a} + ${spec.b}`, drawDoublesSvg(spec.a, spec.b, 0, spec.answer), L(`Counters for ${spec.a} and ${spec.b}`, `Fichas para ${spec.a} y ${spec.b}`)),
        mk("f1", L("Use the matching double first.", "Usa primero el doble igual."), "", drawDoublesSvg(spec.a, spec.b, 1, spec.answer), L("Matching double highlighted", "Doble resaltado")),
        mk("f2", L(`Total: ${spec.a} + ${spec.b} = ${spec.answer}.`, `Total: ${spec.a} + ${spec.b} = ${spec.answer}.`), `${spec.a} + ${spec.b} = ${spec.answer}`, drawDoublesSvg(spec.a, spec.b, 2, spec.answer), L(`Sum equals ${spec.answer}`, `La suma es ${spec.answer}`)),
      ];
    case "clock":
      return [
        mk("f0", L("Each number on the clock stands for 5 minutes.", "Cada número del reloj vale 5 minutos."), "", drawClockSvg(spec, 0), L("Clock face", "Carátula del reloj")),
        mk("f1", L("Count by 5s around the clock to the minute hand.", "Cuenta de 5 en 5 hasta la manecilla."), "", drawClockSvg(spec, 1), L("Minute interval on clock", "Intervalo de minutos en el reloj")),
        mk("f2", L(`That is ${spec.answer} minutes.`, `Son ${spec.answer} minutos.`), `${spec.answer}`, drawClockSvg(spec, 2), L(`${spec.answer} minutes`, `${spec.answer} minutos`)),
      ];
    case "mental":
      return [
        mk("f0", L(`Place ${spec.base} in the place-value chart.`, `Coloca ${spec.base} en la tabla de valor posicional.`), String(spec.base), drawMentalTensSvg(spec, 0), L(`Place value of ${spec.base}`, `Valor posicional de ${spec.base}`)),
        mk("f1", L(`Only the ${spec.delta === 100 ? "hundreds" : "tens"} place changes by 1.`, `Solo cambian las ${spec.delta === 100 ? "centenas" : "decenas"} en 1.`), "", drawMentalTensSvg(spec, 1), L("Highlighted place value column", "Columna resaltada")),
        mk("f2", L(`The new number is ${spec.answer}.`, `El nuevo número es ${spec.answer}.`), `= ${spec.answer}`, drawMentalTensSvg(spec, 2), L(`Result ${spec.answer}`, `Resultado ${spec.answer}`)),
      ];
    case "scaled-graph":
      return [
        mk("f0", L(`Each square stands for ${spec.scale}.`, `Cada cuadro representa ${spec.scale}.`), `1 □ = ${spec.scale}`, drawScaledGraphSvg(spec, 0), L("Scaled bar graph", "Gráfica de barras con escala")),
        mk("f1", L("Count the squares and multiply by the scale.", "Cuenta los cuadros y multiplica por la escala."), "", drawScaledGraphSvg(spec, 1), L("Scaled squares labeled", "Cuadros con escala")),
        mk("f2", L(`The total is ${spec.answer}.`, `El resultado es ${spec.answer}.`), `= ${spec.answer}`, drawScaledGraphSvg(spec, 2), L(`Graph total ${spec.answer}`, `Total de la gráfica ${spec.answer}`)),
      ];
    case "mixed":
      return [
        mk("f0", L(`Each whole has ${spec.den} equal parts.`, `Cada entero tiene ${spec.den} partes iguales.`), "", drawMixedNumberSvg(spec, 0), L("Fraction bars", "Barras de fracciones")),
        mk("f1", L("Group the wholes and the leftover parts.", "Agrupa los enteros y las partes restantes."), "", drawMixedNumberSvg(spec, 1), L("Wholes and fractional part", "Enteros y parte fraccionaria")),
        mk("f2", L(`Equivalent form: ${spec.answer}.`, `Forma equivalente: ${spec.answer}.`), `= ${spec.answer}`, drawMixedNumberSvg(spec, 2), L(`Equivalent form ${spec.answer}`, `Forma equivalente ${spec.answer}`)),
      ];
    case "angle":
      return [
        mk("f0", L("Identify the angle relationship.", "Identifica la relación entre los ángulos."), "", drawAngleSvg({ ...spec, kind: spec.sub }, 0), L("Angle diagram", "Diagrama de ángulos")),
        mk("f1", L("Use the known angle measure to find the missing part.", "Usa el ángulo conocido para hallar el faltante."), "", drawAngleSvg({ ...spec, kind: spec.sub }, 1), L("Known and unknown angles", "Ángulos conocido y desconocido")),
        mk("f2", L(`The missing angle measures ${spec.answer}°.`, `El ángulo faltante mide ${spec.answer}°.`), `${spec.answer}°`, drawAngleSvg({ ...spec, kind: spec.sub }, 2), L(`Angle is ${spec.answer} degrees`, `El ángulo mide ${spec.answer} grados`)),
      ];
    case "angle-alg": {
      const coeff = spec.terms.reduce((sum, t) => {
        const m = t.match(/^(\d*)x/);
        return sum + (m ? (m[1] ? Number(m[1]) : 1) : 0);
      }, 0);
      const eq1 = coeff ? `${coeff}x = 180` : `${spec.terms.join(" + ")} = 180`;
      return [
        mk("f0", L("The three angles of a triangle sum to 180°.", "Los tres ángulos de un triángulo suman 180°."), `${spec.terms.join(" + ")} = 180°`, drawGenericMathCardSvg(L("Triangle angle sum", "Suma de ángulos del triángulo"), `${spec.terms.join(" + ")} = 180°`, L("Combine x-terms", "Combina términos con x"), 0, spec.answer), L("Triangle angle equation", "Ecuación de ángulos del triángulo")),
        mk("f1", L(`Combine like terms: ${eq1}.`, `Combina términos semejantes: ${eq1}.`), eq1, drawGenericMathCardSvg(L("Solve for x", "Resuelve para x"), eq1, L("Divide both sides", "Despeja el valor de x"), 1, spec.answer), L("Solving for x", "Resolviendo para x")),
        mk("f2", L(`x = ${spec.answer}.`, `x = ${spec.answer}.`), `x = ${spec.answer}`, drawGenericMathCardSvg(L("Solution", "Solución"), `x = ${spec.answer}`, "", 2, spec.answer), L(`x equals ${spec.answer}`, `x es igual a ${spec.answer}`)),
      ];
    }
    case "coord":
      return [
        mk("f0", L(`Locate (${spec.x1}, ${spec.y1}) on the coordinate plane.`, `Ubica (${spec.x1}, ${spec.y1}) en el plano coordenado.`), `(${spec.x1}, ${spec.y1})`, drawCoordPlaneSvg(spec, 0), L("Coordinate plane with starting point", "Plano coordenado con punto inicial")),
        mk("f1", L("Follow the horizontal and vertical movement carefully.", "Sigue el movimiento horizontal y vertical."), "", drawCoordPlaneSvg(spec, 1), L("Movement path on plane", "Trayectoria en el plano")),
        mk("f2", L(`Result: ${spec.answer}.`, `Resultado: ${spec.answer}.`), `= ${spec.answer}`, drawCoordPlaneSvg(spec, 2), L(`Final coordinate ${spec.answer}`, `Coordenada final ${spec.answer}`)),
      ];
    case "order-ops": {
      const e = spec.expr.replaceAll("−", "-");
      let mid = spec.expr;
      const paren = e.match(/\((\d+)\s*([+\-])\s*(\d+)\)/);
      if (paren) {
        const val = paren[2] === "+" ? Number(paren[1]) + Number(paren[3]) : Number(paren[1]) - Number(paren[3]);
        const afterParen = e.replace(paren[0], String(val));
        const mul = afterParen.match(/(\d+)\s*×\s*(\d+)/);
        mid = mul
          ? `${paren[1]} ${paren[2] === "-" ? "−" : "+"} ${paren[3]} = ${val}; ${mul[1]} × ${mul[2]} = ${Number(mul[1]) * Number(mul[2])}`
          : `${paren[1]} ${paren[2] === "-" ? "−" : "+"} ${paren[3]} = ${val}`;
      } else {
        const mul = e.match(/(\d+)\s*×\s*(\d+)/);
        if (mul) mid = `${mul[1]} × ${mul[2]} = ${Number(mul[1]) * Number(mul[2])}`;
      }
      return [
        mk("f0", L("Check parentheses first, then × and ÷, then + and −.", "Revisa paréntesis primero, luego × y ÷, luego + y −."), spec.expr, drawGenericMathCardSvg(L("Order of operations", "Orden de operaciones"), spec.expr, L("Find the first step", "Encuentra el primer paso"), 0, spec.answer), L("Order of operations expression", "Expresión de orden de operaciones")),
        mk("f1", L(`First step: ${mid}.`, `Primer paso: ${mid}.`), mid, drawGenericMathCardSvg(L("Evaluate step by step", "Evalúa paso a paso"), mid, L("Keep the rest unchanged", "Mantén lo demás igual"), 1, spec.answer), L("Step by step evaluation", "Evaluación paso a paso")),
        mk("f2", L(`The value is ${spec.answer}.`, `El valor es ${spec.answer}.`), `${spec.expr} = ${spec.answer}`, drawGenericMathCardSvg(L("Result", "Resultado"), spec.expr, "", 2, spec.answer), L(`Value equals ${spec.answer}`, `Valor igual a ${spec.answer}`)),
      ];
    }
    case "order-rational":
      return [
        mk("f0", L("Use 0 as a benchmark on the number line.", "Usa 0 como referencia en la recta numérica."), "", drawNumberLineSvg(spec, 0), L("Number line benchmark", "Recta numérica de referencia")),
        mk("f1", L("Place negatives to the left of 0 and positives to the right.", "Coloca negativos a la izquierda de 0 y positivos a la derecha."), "", drawNumberLineSvg(spec, 1), L("Rational numbers plotted", "Números racionales ubicados")),
        mk("f2", L(`Ordered from least to greatest: ${spec.answer}.`, `De menor a mayor: ${spec.answer}.`), spec.answer, drawNumberLineSvg(spec, 2), L(`Ordered list ${spec.answer}`, `Lista ordenada ${spec.answer}`)),
      ];
    case "algebra-expr":
      return [
        mk("f0", L("Identify the variable terms and constant terms.", "Identifica los términos con variable y las constantes."), spec.expr, drawGenericMathCardSvg(L("Equivalent expressions", "Expresiones equivalentes"), spec.expr, L("Group like terms", "Agrupa términos semejantes"), 0, spec.answer), L("Algebraic expression", "Expresión algebraica")),
        mk("f1", L("Apply the distributive property or combine like terms.", "Aplica la propiedad distributiva o combina términos semejantes."), spec.expr, drawGenericMathCardSvg(L("Combine like terms", "Combina términos semejantes"), spec.expr, L("Keep variable and constant parts separate", "Mantén variables y constantes aparte"), 1, spec.answer), L("Grouping like terms", "Agrupando términos semejantes")),
        mk("f2", L(`Equivalent expression: ${spec.answer}.`, `Expresión equivalente: ${spec.answer}.`), `= ${spec.answer}`, drawGenericMathCardSvg(L("Equivalent form", "Forma equivalente"), spec.expr, "", 2, spec.answer), L(`Equivalent to ${spec.answer}`, `Equivalente a ${spec.answer}`)),
      ];
    case "ineq":
      return [
        mk("f0", L(`Mark the boundary ${spec.bound} on the number line.`, `Marca el límite ${spec.bound} en la recta numérica.`), `${spec.variable}, ${spec.bound}`, drawNumberLineSvg({ ...spec, kind: "ineq" }, 0), L("Number line with boundary", "Recta numérica con límite")),
        mk("f1", L(spec.inclusive ? "Closed circle includes the boundary." : "Open circle excludes the boundary.", spec.inclusive ? "Círculo cerrado incluye el límite." : "Círculo abierto excluye el límite."), "", drawNumberLineSvg({ ...spec, kind: "ineq" }, 1), L("Inequality ray on number line", "Rayo de desigualdad en la recta")),
        mk("f2", L(`The inequality is ${spec.answer}.`, `La desigualdad es ${spec.answer}.`), spec.answer, drawNumberLineSvg({ ...spec, kind: "ineq" }, 2), L(`Inequality ${spec.answer}`, `Desigualdad ${spec.answer}`)),
      ];
    case "prism": {
      const toFrac = (s) => {
        const m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
        if (m) return [Number(m[1]) * Number(m[3]) + Number(m[2]), Number(m[3])];
        const f = s.match(/^(\d+)\/(\d+)$/);
        if (f) return [Number(f[1]), Number(f[2])];
        return [Number(s) * 2, 2];
      };
      const [ln, ld] = toFrac(spec.l);
      const [wn, wd] = toFrac(spec.w);
      const [hn, hd] = toFrac(spec.h);
      const numProd = ln * wn * hn;
      const denProd = ld * wd * hd;
      const midLine = `(${ln}/${ld}) × (${wn}/${wd}) × (${hn}/${hd}) = ${numProd}/${denProd}`;
      return [
        mk("f0", L("Identify length, width, and height of the prism.", "Identifica largo, ancho y alto del prisma."), "", drawPrismSvg(spec.l, spec.w, spec.h, 0, spec.answer), L("Rectangular prism with fractional edges", "Prisma rectangular con aristas fraccionarias")),
        mk("f1", L(`Write as fractions and multiply: ${midLine}.`, `Escribe como fracciones y multiplica: ${midLine}.`), midLine, drawPrismSvg(spec.l, spec.w, spec.h, 1, spec.answer, midLine), L("Volume formula setup", "Fórmula de volumen")),
        mk("f2", L(`Volume = ${spec.answer} cubic ft.`, `Volumen = ${spec.answer} pies cúbicos.`), `V = ${spec.answer}`, drawPrismSvg(spec.l, spec.w, spec.h, 2, spec.answer), L(`Volume is ${spec.answer}`, `El volumen es ${spec.answer}`)),
      ];
    }
    case "circle":
      return [
        mk("f0", L("Relate circumference to radius or diameter with π ≈ 3.14.", "Relaciona la circunferencia con el radio o diámetro usando π ≈ 3.14."), "C = 2πr", drawCircleSvg(spec, 0), L("Circle diagram", "Diagrama de círculo")),
        mk("f1", L("Substitute the given measurement into the formula.", "Sustituye la medida dada en la fórmula."), spec.setup, drawCircleSvg(spec, 1), L("Substituted circle formula", "Fórmula sustituida")),
        mk("f2", L(`Result: ${spec.answer}.`, `Resultado: ${spec.answer}.`), `= ${spec.answer}`, drawCircleSvg(spec, 2), L(`Circle result ${spec.answer}`, `Resultado ${spec.answer}`)),
      ];
    case "sampling":
      return [
        mk("f0", L("Compare the sample part to the sample size.", "Compara la parte de la muestra con el tamaño de la muestra."), `${spec.part} / ${spec.sample}`, drawSamplingSvg(spec, 0), L("Sample proportion", "Proporción de la muestra")),
        mk("f1", L("Scale that same fraction to the whole population.", "Aplica esa misma fracción a todo el grupo."), "", drawSamplingSvg(spec, 1), L("Scaling sample to population", "Escalando la muestra al grupo total")),
        mk("f2", L(`Predicted count: ${spec.answer}.`, `Predicción: ${spec.answer}.`), `≈ ${spec.answer}`, drawSamplingSvg(spec, 2), L(`Prediction ${spec.answer}`, `Predicción ${spec.answer}`)),
      ];
    case "scientific":
      return [
        mk("f0", L("Separate the front numbers from the powers of 10.", "Separa los números del frente de las potencias de 10."), spec.expr, drawGenericMathCardSvg(L("Scientific notation", "Notación científica"), spec.expr, L("Group coefficients & powers of 10", "Agrupa coeficientes y potencias de 10"), 0, spec.answer), L("Scientific notation expression", "Expresión en notación científica")),
        mk("f1", L("Operate on the coefficients and apply exponent rules.", "Opera los coeficientes y aplica las reglas de exponentes."), spec.expr, drawGenericMathCardSvg(L("Apply exponent rules", "Aplica reglas de exponentes"), spec.expr, L("Adjust so front number is 1 to <10", "Ajusta el número entre 1 y <10"), 1, spec.answer), L("Exponent rule step", "Paso de exponentes")),
        mk("f2", L(`In scientific notation: ${spec.answer}.`, `En notación científica: ${spec.answer}.`), `= ${spec.answer}`, drawGenericMathCardSvg(L("Normalized result", "Resultado normalizado"), spec.expr, "", 2, spec.answer), L(`Result ${spec.answer}`, `Resultado ${spec.answer}`)),
      ];
    case "round-solid":
      return [
        mk("f0", L("Identify the solid and its given dimensions.", "Identifica el sólido y sus dimensiones."), "", drawRoundSolidSvg(spec, 0), L(`3D ${spec.solid}`, `Sólido 3D`)),
        mk("f1", L("Substitute r (and h) into the volume formula with π ≈ 3.14.", "Sustituye r (y h) en la fórmula de volumen con π ≈ 3.14."), "", drawRoundSolidSvg(spec, 1), L("Volume formula", "Fórmula de volumen")),
        mk("f2", L(`Volume = ${spec.answer}.`, `Volumen = ${spec.answer}.`), `V = ${spec.answer}`, drawRoundSolidSvg(spec, 2), L(`Volume ${spec.answer}`, `Volumen ${spec.answer}`)),
      ];
    case "compare-fn": {
      const esFn = (s) =>
        s
          .replace(/^a line through (.+) and (.+)$/i, "recta por $1 y $2")
          .replace(/^a rate of change of (.+) and a y-intercept of (.+)$/i, "pendiente $1 e intersección y: $2");
      const lineA = L(`A: ${spec.fnA}`, `A: ${esFn(spec.fnA)}`);
      const lineB = L(`B: ${spec.fnB}`, `B: ${esFn(spec.fnB)}`);
      return [
        mk("f0", L("Find the rate of change (slope) of Function A and Function B.", "Halla la tasa de cambio (pendiente) de A y B."), `A: ${spec.fnA}`, drawGenericMathCardSvg(L("Compare rates of change", "Compara tasas de cambio"), lineA, lineB, 0, spec.answer), L("Two functions to compare", "Dos funciones para comparar")),
        mk("f1", L("Compare the two slopes — larger slope means faster change.", "Compara las dos pendientes — mayor pendiente cambia más rápido."), "", drawGenericMathCardSvg(L("Compare slopes", "Compara pendientes"), lineA, lineB, 1, spec.answer), L("Comparing slopes", "Comparando pendientes")),
        mk("f2", L(`Function ${spec.answer} has the greater rate of change.`, `La función ${spec.answer} tiene mayor tasa de cambio.`), `= ${spec.answer}`, drawGenericMathCardSvg(L("Greater rate of change", "Mayor tasa de cambio"), lineA, "", 2, spec.answer), L(`Function ${spec.answer}`, `Función ${spec.answer}`)),
      ];
    }
    default:
      return [];
  }
}

export function predicts() {
  return [
    {
      at: 2,
      prompt: L("What should we do next to find the answer?", "¿Qué debemos hacer ahora para hallar la respuesta?"),
      choices: [
        {
          label: L("Use the relationship shown in the model to complete the final step", "Usar la relación del modelo para completar el paso final"),
          ok: true,
          why: L("Yes! The model connects the given values directly to the result.", "¡Sí! El modelo conecta los datos directamente con el resultado."),
        },
        {
          label: L("Ignore the labels and add every number in the problem", "Ignorar las etiquetas y sumar todos los números del problema"),
          ok: false,
          why: L("Adding unrelated numbers ignores what each quantity represents.", "Sumar números sin relación ignora lo que representa cada cantidad."),
        },
        {
          label: L("Guess without checking the units or place values", "Adivinar sin revisar las unidades ni el valor posicional"),
          ok: false,
          why: L("Checking units and place values keeps the reasoning accurate.", "Revisar unidades y valor posicional mantiene el razonamiento exacto."),
        },
      ],
    },
  ];
}

export function hints(spec) {
  const list = frames(spec);
  const ans = String(spec.answer || "");
  const safeF1 = list[1] && (!ans || !String(list[1].svg).includes(ans)) ? list[1] : list[0];
  return [
    { text: list[0]?.cap || L("Notice the given quantities.", "Observa las cantidades dadas."), frame: list[0] },
    { text: safeF1?.cap || L("Use the visual model to connect the steps.", "Usa el modelo visual para conectar los pasos."), frame: safeF1 },
    { text: L("Complete the final step using the relationship shown in the model.", "Completa el paso final usando la relación que muestra el modelo."), frame: safeF1 },
  ];
}

export const answer = (spec) => spec.answer;
export const diagnose = () => null;
export const tags = {};
