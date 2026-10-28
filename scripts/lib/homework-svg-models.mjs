/**
 * Parameterized inline SVG math visual generators for Family Math Studio (Part 1 & Part 2).
 *
 * Provides the 6 core visual models with explicit width, height, viewBox,
 * clean white surface styling (`style="background:white"`), proper mathematical
 * typography (≤, ≥, ×, ÷, −), and bilingual accessibility attributes:
 *   1. renderTapeDiagramSVG(parts, labels, highlightIndex)
 *   2. renderNumberLineSVG(min, max, step, points, arrows)
 *   3. renderDoubleNumberLineSVG(topLabel, bottomLabel, ticks, missingIndices)
 *   4. renderCoordinatePlaneSVG(quadrants, points, segments)
 *   5. renderFractionBarOrGridSVG(rows, cols, shaded, labels)
 *   6. renderHangerBalanceSVG(leftItems, rightItems, balanced)
 */

function escSvg(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtMinus(val) {
  const s = String(val ?? "");
  return s.replace(/^-/, "−");
}

/**
 * 1. Tape Diagram SVG
 * @param {number|number[]} parts - Number of equal parts or array of relative part weights
 * @param {string[]|{parts?:string[], total?:string, title?:string}} labels - Labels for parts and optional total brace
 * @param {number} highlightIndex - 0-based index of highlighted part (-1 for none)
 */
export function renderTapeDiagramSVG(parts = 4, labels = [], highlightIndex = 0) {
  const partWeights = Array.isArray(parts)
    ? parts.map((n) => Math.max(1, Number(n) || 1))
    : Array.from({ length: Math.max(1, Number(parts) || 4) }, () => 1);
  const count = partWeights.length;
  const partLabels = Array.isArray(labels)
    ? labels
    : Array.isArray(labels?.parts)
      ? labels.parts
      : [];
  const totalLabel =
    !Array.isArray(labels) && labels?.total ? String(labels.total) : `Total (${count} parts)`;
  const captionLabel = !Array.isArray(labels) && labels?.title ? String(labels.title) : "";

  const W = 520;
  const H = 136;
  const startX = 36;
  const totalW = 448;
  const barY = 44;
  const barH = 44;
  const weightSum = partWeights.reduce((a, b) => a + b, 0);

  let cursorX = startX;
  const rects = partWeights
    .map((w, idx) => {
      const segW = (w / weightSum) * totalW;
      const x = cursorX;
      cursorX += segW;
      const isHi = idx === highlightIndex;
      const fill = isHi ? "#1fa6a2" : idx % 2 === 0 ? "#e3f6f5" : "#f8fafc";
      const textFill = isHi ? "#ffffff" : "#12355b";
      const lbl = partLabels[idx] !== undefined ? String(partLabels[idx]) : `Part ${idx + 1}`;
      return `<g class="hw-svg-tape-part"${isHi ? ' data-highlighted="true"' : ""}>
    <rect x="${x.toFixed(1)}" y="${barY}" width="${segW.toFixed(1)}" height="${barH}" fill="${fill}" stroke="#12355b" stroke-width="2"/>
    <text x="${(x + segW / 2).toFixed(1)}" y="${barY + 27}" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="14" font-weight="800" fill="${textFill}">${escSvg(fmtMinus(lbl))}</text>
  </g>`;
    })
    .join("\n  ");

  const midX = startX + totalW / 2;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="hw-model-svg hw-tape-diagram-svg" style="background:white; max-width:100%; height:auto; display:block; margin:0 auto; border-radius:10px; border:1px solid #cbd5e1;" role="img" aria-label="Tape diagram with ${count} parts, ${escSvg(totalLabel)}" xmlns="http://www.w3.org/2000/svg">
  <title>Tape Diagram (${count} parts)</title>
  <path d="M ${startX} 36 L ${startX} 26 L ${midX} 26 L ${midX} 20 L ${midX} 26 L ${startX + totalW} 26 L ${startX + totalW} 36" fill="none" stroke="#0f766e" stroke-width="2" stroke-linecap="round"/>
  <rect x="${midX - 88}" y="4" width="176" height="20" rx="5" fill="#0f766e"/>
  <text x="${midX}" y="18" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="12" font-weight="800" fill="#ffffff">${escSvg(fmtMinus(totalLabel))}</text>
  ${rects}
  <rect x="${startX}" y="${barY}" width="${totalW}" height="${barH}" rx="4" fill="none" stroke="#12355b" stroke-width="2.5"/>
  ${captionLabel ? `<text x="${midX}" y="116" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="13" font-weight="700" fill="#334155">${escSvg(fmtMinus(captionLabel))}</text>` : `<text x="${midX}" y="114" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="12.5" font-weight="700" fill="#475569">Each equal box represents 1 unit part</text>`}
</svg>`;
}

/**
 * 2. Number Line SVG
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} step - Tick step interval
 * @param {Array<{value:number, label?:string, open?:boolean, color?:string}|number>} points - Plotted points
 * @param {Array<{from:number, to:number, label?:string, color?:string}>} arrows - Jump or ray arrows
 */
export function renderNumberLineSVG(min = -5, max = 5, step = 1, points = [], arrows = []) {
  const lo = Number.isFinite(Number(min)) ? Number(min) : -5;
  const hi = Number.isFinite(Number(max)) && Number(max) > lo ? Number(max) : lo + 10;
  const st = Number.isFinite(Number(step)) && Number(step) > 0 ? Number(step) : (hi - lo) / 10;
  const W = 520;
  const H = 132;
  const padX = 44;
  const lineW = W - padX * 2;
  const lineY = 76;

  const toX = (val) => {
    const clamped = Math.max(lo, Math.min(hi, Number(val) || 0));
    return padX + ((clamped - lo) / (hi - lo)) * lineW;
  };

  const ticks = [];
  const maxTicks = 24;
  const actualStep = (hi - lo) / st > maxTicks ? (hi - lo) / 10 : st;
  for (let v = lo; v <= hi + actualStep * 0.001; v += actualStep) {
    const rounded = Math.round(v * 1000) / 1000;
    const x = toX(rounded);
    const isZero = Math.abs(rounded) < 1e-6;
    ticks.push(`<line x1="${x.toFixed(1)}" y1="${lineY - (isZero ? 10 : 7)}" x2="${x.toFixed(1)}" y2="${lineY + (isZero ? 10 : 7)}" stroke="${isZero ? "#0f766e" : "#12355b"}" stroke-width="${isZero ? "2.5" : "1.8"}"/>
  <text x="${x.toFixed(1)}" y="${lineY + 26}" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="12.5" font-weight="${isZero ? "800" : "700"}" fill="${isZero ? "#0f766e" : "#1e293b"}">${escSvg(fmtMinus(rounded))}</text>`);
  }

  const arrowNodes = (Array.isArray(arrows) ? arrows : [])
    .map((a) => {
      const x1 = toX(a.from ?? lo);
      const x2 = toX(a.to ?? hi);
      const mid = (x1 + x2) / 2;
      const color = a.color || "#d97706";
      const dir = x2 >= x1 ? 1 : -1;
      return `<g class="hw-svg-nl-arrow">
    <path d="M ${x1.toFixed(1)} ${lineY - 12} Q ${mid.toFixed(1)} ${lineY - 44} ${x2.toFixed(1)} ${lineY - 14}" fill="none" stroke="${color}" stroke-width="2.5"/>
    <polygon points="${x2.toFixed(1)},${lineY - 12} ${(x2 - dir * 7).toFixed(1)},${lineY - 20} ${(x2 - dir * 3).toFixed(1)},${lineY - 10}" fill="${color}"/>
    ${a.label ? `<text x="${mid.toFixed(1)}" y="${lineY - 34}" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="12" font-weight="800" fill="${color}">${escSvg(fmtMinus(a.label))}</text>` : ""}
  </g>`;
    })
    .join("\n  ");

  const pointNodes = (Array.isArray(points) ? points : [])
    .map((pt) => {
      const obj = typeof pt === "object" && pt !== null ? pt : { value: Number(pt) };
      const x = toX(obj.value);
      const color = obj.color || "#0f766e";
      const fill = obj.open ? "#ffffff" : color;
      const lbl = obj.label !== undefined ? String(obj.label) : fmtMinus(obj.value);
      return `<g class="hw-svg-nl-point">
    <circle cx="${x.toFixed(1)}" cy="${lineY}" r="6.5" fill="${fill}" stroke="${color}" stroke-width="3"/>
    <rect x="${(x - 24).toFixed(1)}" y="${lineY - 34}" width="48" height="20" rx="5" fill="${color}"/>
    <text x="${x.toFixed(1)}" y="${lineY - 20}" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="11.5" font-weight="800" fill="#ffffff">${escSvg(lbl)}</text>
  </g>`;
    })
    .join("\n  ");

  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="hw-model-svg hw-number-line-svg" style="background:white; max-width:100%; height:auto; display:block; margin:0 auto; border-radius:10px; border:1px solid #cbd5e1;" role="img" aria-label="Number line from ${fmtMinus(lo)} to ${fmtMinus(hi)}" xmlns="http://www.w3.org/2000/svg">
  <title>Number Line (${fmtMinus(lo)} to ${fmtMinus(hi)})</title>
  <line x1="${padX - 14}" y1="${lineY}" x2="${W - padX + 14}" y2="${lineY}" stroke="#12355b" stroke-width="2.5"/>
  <polygon points="${padX - 18},${lineY} ${padX - 8},${lineY - 5} ${padX - 8},${lineY + 5}" fill="#12355b"/>
  <polygon points="${W - padX + 18},${lineY} ${W - padX + 8},${lineY - 5} ${W - padX + 8},${lineY + 5}" fill="#12355b"/>
  ${ticks.join("\n  ")}
  ${arrowNodes}
  ${pointNodes}
</svg>`;
}

/**
 * 3. Double Number Line SVG
 * @param {string} topLabel - Label for top quantity
 * @param {string} bottomLabel - Label for bottom quantity
 * @param {Array<{top:string|number, bottom:string|number}|[string|number, string|number]>} ticks - Aligned tick pairs
 * @param {number[]} missingIndices - 0-based tick indices where bottom or top shows '?'
 */
export function renderDoubleNumberLineSVG(
  topLabel = "Quantity A",
  bottomLabel = "Quantity B",
  ticks = [
    { top: 0, bottom: 0 },
    { top: 2, bottom: 5 },
    { top: 4, bottom: 10 },
    { top: 6, bottom: 15 },
  ],
  missingIndices = [],
) {
  const W = 540;
  const H = 148;
  const startX = 118;
  const endX = 496;
  const topY = 48;
  const botY = 98;
  const list =
    Array.isArray(ticks) && ticks.length >= 2
      ? ticks
      : [
          { top: 0, bottom: 0 },
          { top: 1, bottom: 3 },
          { top: 2, bottom: 6 },
          { top: 3, bottom: 9 },
        ];
  const missingSet = new Set(Array.isArray(missingIndices) ? missingIndices : []);

  const tickSvg = list
    .map((t, i) => {
      const x = startX + (i / (list.length - 1)) * (endX - startX);
      const topVal = Array.isArray(t) ? t[0] : t.top;
      const botVal = Array.isArray(t) ? t[1] : t.bottom;
      const isMissing = missingSet.has(i);
      return `<g class="hw-svg-dnl-tick"${isMissing ? ' data-missing="true"' : ""}>
    <line x1="${x.toFixed(1)}" y1="${topY - 8}" x2="${x.toFixed(1)}" y2="${botY + 8}" stroke="${isMissing ? "#d97706" : "#94a3b8"}" stroke-width="1.5" stroke-dasharray="3 2"/>
    <line x1="${x.toFixed(1)}" y1="${topY - 7}" x2="${x.toFixed(1)}" y2="${topY + 7}" stroke="#12355b" stroke-width="2.2"/>
    <line x1="${x.toFixed(1)}" y1="${botY - 7}" x2="${x.toFixed(1)}" y2="${botY + 7}" stroke="#0f766e" stroke-width="2.2"/>
    <text x="${x.toFixed(1)}" y="${topY - 14}" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="13" font-weight="800" fill="#12355b">${escSvg(fmtMinus(topVal))}</text>
    ${
      isMissing
        ? `<rect x="${(x - 22).toFixed(1)}" y="${botY + 11}" width="44" height="22" rx="5" fill="#fef3c7" stroke="#d97706" stroke-width="1.8"/>
    <text x="${x.toFixed(1)}" y="${botY + 26}" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="13" font-weight="900" fill="#b45309">?</text>`
        : `<text x="${x.toFixed(1)}" y="${botY + 25}" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="13" font-weight="800" fill="#0f766e">${escSvg(fmtMinus(botVal))}</text>`
    }
  </g>`;
    })
    .join("\n  ");

  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="hw-model-svg hw-double-number-line-svg" style="background:white; max-width:100%; height:auto; display:block; margin:0 auto; border-radius:10px; border:1px solid #cbd5e1;" role="img" aria-label="Double number line comparing ${escSvg(topLabel)} and ${escSvg(bottomLabel)}" xmlns="http://www.w3.org/2000/svg">
  <title>Double Number Line: ${escSvg(topLabel)} and ${escSvg(bottomLabel)}</title>
  <text x="14" y="${topY + 5}" font-family="Outfit, system-ui, sans-serif" font-size="13" font-weight="800" fill="#12355b">${escSvg(topLabel)}</text>
  <text x="14" y="${botY + 5}" font-family="Outfit, system-ui, sans-serif" font-size="13" font-weight="800" fill="#0f766e">${escSvg(bottomLabel)}</text>
  <line x1="${startX}" y1="${topY}" x2="${endX + 14}" y2="${topY}" stroke="#12355b" stroke-width="2.5"/>
  <polygon points="${endX + 18},${topY} ${endX + 9},${topY - 5} ${endX + 9},${topY + 5}" fill="#12355b"/>
  <line x1="${startX}" y1="${botY}" x2="${endX + 14}" y2="${botY}" stroke="#0f766e" stroke-width="2.5"/>
  <polygon points="${endX + 18},${botY} ${endX + 9},${botY - 5} ${endX + 9},${botY + 5}" fill="#0f766e"/>
  ${tickSvg}
</svg>`;
}

/**
 * 4. Coordinate Plane SVG
 * @param {number} quadrants - 1 for Quadrant I only, 4 for all 4 quadrants
 * @param {Array<{x:number, y:number, label?:string, color?:string}>} points - Ordered pairs to plot
 * @param {Array<{from:[number,number], to:[number,number], label?:string, color?:string}>} segments - Line segments
 */
export function renderCoordinatePlaneSVG(
  quadrants = 4,
  points = [
    { x: 3, y: 4, label: "A(3, 4)" },
    { x: -2, y: 3, label: "B(−2, 3)" },
  ],
  segments = [],
) {
  const W = 320;
  const H = 260;
  const cx = quadrants === 1 ? 56 : 160;
  const cy = quadrants === 1 ? 212 : 130;
  const maxCoord = 5;
  const stepPx = quadrants === 1 ? 30 : 20;
  const minVal = quadrants === 1 ? 0 : -maxCoord;

  const toPx = (x, y) => [cx + x * stepPx, cy - y * stepPx];

  const gridLines = [];
  for (let i = minVal; i <= maxCoord; i++) {
    const [gx] = toPx(i, 0);
    const [, gy] = toPx(0, i);
    const [xStart] = toPx(minVal, 0);
    const [xEnd] = toPx(maxCoord, 0);
    const [, yStart] = toPx(0, minVal);
    const [, yEnd] = toPx(0, maxCoord);
    gridLines.push(
      `<line x1="${gx}" y1="${yEnd}" x2="${gx}" y2="${yStart}" stroke="#e2e8f0" stroke-width="1"/>`,
      `<line x1="${xStart}" y1="${gy}" x2="${xEnd}" y2="${gy}" stroke="#e2e8f0" stroke-width="1"/>`,
    );
  }

  const [axX1] = toPx(minVal, 0);
  const [axX2] = toPx(maxCoord, 0);
  const [, axY1] = toPx(0, minVal);
  const [, axY2] = toPx(0, maxCoord);

  const segSvg = (Array.isArray(segments) ? segments : [])
    .map((s) => {
      const [x1, y1] = toPx(s.from?.[0] ?? 0, s.from?.[1] ?? 0);
      const [x2, y2] = toPx(s.to?.[0] ?? 0, s.to?.[1] ?? 0);
      const col = s.color || "#d97706";
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="2.5" stroke-dasharray="4 2"/>`;
    })
    .join("\n  ");

  const ptSvg = (Array.isArray(points) ? points : [])
    .map((p) => {
      const [px, py] = toPx(Number(p.x) || 0, Number(p.y) || 0);
      const col = p.color || "#0f766e";
      const lbl = p.label || `(${fmtMinus(p.x)}, ${fmtMinus(p.y)})`;
      return `<g class="hw-svg-cp-point">
    <circle cx="${px}" cy="${py}" r="5.5" fill="${col}" stroke="#ffffff" stroke-width="2"/>
    <text x="${px + 8}" y="${py - 7}" font-family="Outfit, system-ui, sans-serif" font-size="12" font-weight="800" fill="#12355b">${escSvg(lbl)}</text>
  </g>`;
    })
    .join("\n  ");

  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="hw-model-svg hw-coordinate-plane-svg" style="background:white; max-width:100%; height:auto; display:block; margin:0 auto; border-radius:10px; border:1px solid #cbd5e1;" role="img" aria-label="Coordinate plane (${quadrants === 1 ? "Quadrant I" : "4 quadrants"})" xmlns="http://www.w3.org/2000/svg">
  <title>Coordinate Plane</title>
  ${gridLines.join("\n  ")}
  <line x1="${axX1}" y1="${cy}" x2="${axX2 + 8}" y2="${cy}" stroke="#12355b" stroke-width="2"/>
  <line x1="${cx}" y1="${axY1}" x2="${cx}" y2="${axY2 - 8}" stroke="#12355b" stroke-width="2"/>
  <text x="${axX2 + 12}" y="${cy + 4}" font-family="Outfit, system-ui, sans-serif" font-size="12" font-weight="800" fill="#12355b">x</text>
  <text x="${cx + 6}" y="${axY2 - 8}" font-family="Outfit, system-ui, sans-serif" font-size="12" font-weight="800" fill="#12355b">y</text>
  <text x="${cx - 12}" y="${cy + 14}" font-family="Outfit, system-ui, sans-serif" font-size="11" font-weight="700" fill="#475569">0</text>
  ${segSvg}
  ${ptSvg}
</svg>`;
}

/**
 * 5. Fraction Bar or Area Grid SVG
 * @param {number} rows - Number of rows (1 for fraction bar, >1 for grid)
 * @param {number} cols - Number of columns
 * @param {number} shaded - Number of shaded cells
 * @param {{title?:string, caption?:string}|string[]} labels - Labels or title/caption metadata
 */
export function renderFractionBarOrGridSVG(rows = 1, cols = 4, shaded = 3, labels = {}) {
  const rCount = Math.max(1, Math.min(10, Number(rows) || 1));
  const cCount = Math.max(1, Math.min(20, Number(cols) || 4));
  const totalCells = rCount * cCount;
  const shadedCount = Math.max(0, Math.min(totalCells, Number(shaded) ?? 3));
  const titleText = Array.isArray(labels)
    ? labels[0] || `${shadedCount} of ${totalCells} shaded`
    : labels?.title || `${shadedCount} of ${totalCells} equal parts shaded`;
  const subText = Array.isArray(labels)
    ? labels[1] || ""
    : labels?.caption || `${shadedCount}/${totalCells} shaded`;

  const W = 480;
  const H = rCount === 1 ? 124 : 180;
  const gridW = rCount === 1 ? 400 : Math.min(360, cCount * 28);
  const gridH = rCount === 1 ? 44 : Math.min(110, rCount * 22);
  const startX = (W - gridW) / 2;
  const startY = 36;
  const cellW = gridW / cCount;
  const cellH = gridH / rCount;

  const cells = [];
  let idx = 0;
  for (let r = 0; r < rCount; r++) {
    for (let c = 0; c < cCount; c++) {
      const isShaded = idx < shadedCount;
      const x = startX + c * cellW;
      const y = startY + r * cellH;
      cells.push(
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cellW.toFixed(1)}" height="${cellH.toFixed(1)}" fill="${isShaded ? "#1fa6a2" : "#f8fafc"}" stroke="#12355b" stroke-width="1.5"/>`,
      );
      idx++;
    }
  }

  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="hw-model-svg hw-fraction-grid-svg" style="background:white; max-width:100%; height:auto; display:block; margin:0 auto; border-radius:10px; border:1px solid #cbd5e1;" role="img" aria-label="Fraction bar or grid: ${escSvg(titleText)}" xmlns="http://www.w3.org/2000/svg">
  <title>${escSvg(titleText)}</title>
  <text x="${W / 2}" y="22" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="13" font-weight="800" fill="#12355b">${escSvg(titleText)}</text>
  ${cells.join("\n  ")}
  <rect x="${startX.toFixed(1)}" y="${startY}" width="${gridW.toFixed(1)}" height="${gridH.toFixed(1)}" fill="none" stroke="#12355b" stroke-width="2.2"/>
  <text x="${W / 2}" y="${startY + gridH + 24}" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="12.5" font-weight="700" fill="#0f766e">${escSvg(subText)}</text>
</svg>`;
}

/**
 * 6. Hanger Balance SVG
 * @param {string[]} leftItems - Items hanging on the left pan (e.g. ["x", "3"])
 * @param {string[]} rightItems - Items hanging on the right pan (e.g. ["11"])
 * @param {boolean} balanced - Whether the beam is level (true) or tilted (false)
 */
export function renderHangerBalanceSVG(
  leftItems = ["x", "+ 4"],
  rightItems = ["12"],
  balanced = true,
) {
  const W = 480;
  const H = 156;
  const cx = W / 2;
  const leftArr = Array.isArray(leftItems) && leftItems.length ? leftItems : ["x", "4"];
  const rightArr = Array.isArray(rightItems) && rightItems.length ? rightItems : ["12"];
  const tilt = balanced ? 0 : 8;
  const leftY = 48 - tilt;
  const rightY = 48 + tilt;
  const leftX = 120;
  const rightX = 360;

  const renderPanItems = (items, centerX, beamY, isLeft) =>
    items
      .map((item, i) => {
        const str = String(item);
        const isVar = /[a-zA-Z]/.test(str);
        const boxW = Math.max(40, str.length * 12 + 20);
        const totalW = items.length * (boxW + 8) - 8;
        const bx = centerX - totalW / 2 + i * (boxW + 8);
        const by = beamY + 34;
        const fill = isVar ? "#0f766e" : "#fef3c7";
        const stroke = isVar ? "#12355b" : "#d97706";
        const textCol = isVar ? "#ffffff" : "#92400e";
        return `<g class="hw-svg-hanger-item" data-side="${isLeft ? "left" : "right"}">
      <line x1="${(bx + boxW / 2).toFixed(1)}" y1="${beamY}" x2="${(bx + boxW / 2).toFixed(1)}" y2="${by}" stroke="#475569" stroke-width="1.8"/>
      <rect x="${bx.toFixed(1)}" y="${by}" width="${boxW}" height="34" rx="${isVar ? 8 : 17}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <text x="${(bx + boxW / 2).toFixed(1)}" y="${by + 22}" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="14" font-weight="800" fill="${textCol}">${escSvg(fmtMinus(str))}</text>
    </g>`;
      })
      .join("\n  ");

  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="hw-model-svg hw-hanger-balance-svg" style="background:white; max-width:100%; height:auto; display:block; margin:0 auto; border-radius:10px; border:1px solid #cbd5e1;" role="img" aria-label="Hanger balance diagram: left side ${escSvg(leftArr.join(" "))} ${balanced ? "equals" : "compared to"} right side ${escSvg(rightArr.join(" "))}" xmlns="http://www.w3.org/2000/svg">
  <title>Hanger Balance (${balanced ? "Balanced =" : "Tilted"})</title>
  <line x1="${cx}" y1="10" x2="${cx}" y2="28" stroke="#12355b" stroke-width="3"/>
  <polygon points="${cx},26 ${cx - 18},48 ${cx + 18},48" fill="#e3f6f5" stroke="#12355b" stroke-width="2.2"/>
  <line x1="${leftX}" y1="${leftY}" x2="${rightX}" y2="${rightY}" stroke="#12355b" stroke-width="4" stroke-linecap="round"/>
  <circle cx="${cx}" cy="48" r="6" fill="#0f766e" stroke="#ffffff" stroke-width="2"/>
  ${renderPanItems(leftArr, leftX, leftY, true)}
  ${renderPanItems(rightArr, rightX, rightY, false)}
  <text x="${cx}" y="138" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="13" font-weight="800" fill="#12355b">${balanced ? "Balanced: Left Side = Right Side (do the same operation to both sides)" : "Unbalanced inequality comparison"}</text>
</svg>`;
}

export const CLIENT_SVG_HELPERS_JS = `
/* ── Inline Parameterized SVG Math Visual Generators (window.FamilyMathSVG) ── */
window.renderTapeDiagramSVG = ${renderTapeDiagramSVG.toString()};
window.renderNumberLineSVG = ${renderNumberLineSVG.toString()};
window.renderDoubleNumberLineSVG = ${renderDoubleNumberLineSVG.toString()};
window.renderCoordinatePlaneSVG = ${renderCoordinatePlaneSVG.toString()};
window.renderFractionBarOrGridSVG = ${renderFractionBarOrGridSVG.toString()};
window.renderHangerBalanceSVG = ${renderHangerBalanceSVG.toString()};
function escSvg(str) {
  return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtMinus(val) {
  return String(val == null ? '' : val).replace(/^-/, '−');
}
window.FamilyMathSVG = {
  renderTapeDiagramSVG: window.renderTapeDiagramSVG,
  renderNumberLineSVG: window.renderNumberLineSVG,
  renderDoubleNumberLineSVG: window.renderDoubleNumberLineSVG,
  renderCoordinatePlaneSVG: window.renderCoordinatePlaneSVG,
  renderFractionBarOrGridSVG: window.renderFractionBarOrGridSVG,
  renderHangerBalanceSVG: window.renderHangerBalanceSVG
};
`;
