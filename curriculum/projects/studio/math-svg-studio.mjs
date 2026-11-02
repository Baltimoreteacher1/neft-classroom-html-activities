const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const f = (value) => Number.isInteger(value) ? String(value) : Number(value.toFixed(2)).toString();
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const shell = (label, body, height = 300) => `<svg width="720" height="${height}" viewBox="0 0 720 ${height}" role="img" aria-label="${esc(label)}" style="background:white" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const label = (x, y, value, size = 15) => `<text x="${x}" y="${y}" font-family="system-ui,sans-serif" font-size="${size}" fill="#142c3b">${esc(value)}</text>`;

export function makePatternStagesSVG(stage1, stepGrowth, groupingMode = "rows") {
  const start = Math.max(1, n(stage1, 1)), growth = Math.max(1, n(stepGrowth, 1));
  let body = "";
  for (let stage = 1; stage <= 4; stage++) {
    const count = Math.min(72, start + (stage - 1) * growth), y = 32 + (stage - 1) * 62;
    body += label(12, y + 18, `Stage ${stage}: ${count}`);
    for (let i = 0; i < count; i++) body += `<rect x="155" y="${y + Math.floor(i / 18) * 12}" width="10" height="10" fill="${i < start ? "#b53e20" : "#14594f"}" stroke="white"/>`;
    body += label(420, y + 18, groupingMode === "rows" ? `${stage} group${stage === 1 ? "" : "s"} of ${growth} + ${start - growth}` : `${start} start + ${stage - 1} groups of ${growth}`);
  }
  return shell("Four pattern stages with equivalent grouping strategies", body, 290);
}

export function makeDataDistributionSVG(values, centerType = "mean", spreadType = "range") {
  const data = values.map((v) => n(v)).filter(Number.isFinite).sort((a, b) => a - b);
  if (!data.length) return shell("Data display waiting for valid values", label(20, 30, "Enter simulated data values."));
  const lo = data[0], hi = data.at(-1), span = hi - lo || 1, x = (v) => 45 + ((v - lo) / span) * 620;
  const counts = new Map(); let body = "";
  for (const v of data) { const k = counts.get(v) || 0; counts.set(v, k + 1); body += `<circle cx="${x(v)}" cy="${210 - k * 15}" r="6" fill="#14594f"/>`; }
  for (const v of new Set(data)) body += label(x(v) - 6, 235, f(v));
  const mean = data.reduce((a, b) => a + b, 0) / data.length, median = data.length % 2 ? data[(data.length - 1) / 2] : (data[data.length / 2 - 1] + data[data.length / 2]) / 2;
  body += `<line x1="${x(mean)}" y1="35" x2="${x(mean)}" y2="205" stroke="#b53e20" stroke-width="3"/><line x1="${x(median)}" y1="35" x2="${x(median)}" y2="205" stroke="#124f7a" stroke-dasharray="5 4" stroke-width="3"/>`;
  body += label(45, 270, `Mean ${f(mean)} · Median ${f(median)} · Range ${f(hi - lo)} · ${centerType}/${spreadType}`);
  return shell("Dot plot with mean, median and spread summary", body, 290);
}

export function makeDoubleNumberLineSVG(rateA, rateB, targetMultiple, unitLabels = ["games", "points"]) {
  const a = n(rateA, 1), b = n(rateB, 1), t = Math.max(1, n(targetMultiple, 1)); let body = "";
  for (let i = 0; i <= 4; i++) { const x = 100 + i * 145, mult = t * i / 4; body += `<circle cx="${x}" cy="70" r="5" fill="#14594f"/><circle cx="${x}" cy="150" r="5" fill="#b53e20"/>` + label(x - 14, 48, f(mult)) + label(x - 14, 180, f(mult * (i === 0 ? b : a))) + (i ? `<line x1="${x - 145}" y1="70" x2="${x}" y2="70" stroke="#14594f"/><line x1="${x - 145}" y1="150" x2="${x}" y2="150" stroke="#b53e20"/>` : ""); }
  body += label(10, 75, unitLabels[0]) + label(10, 155, unitLabels[1]);
  return shell("Equivalent ratio double number line", body, 220);
}

export function makePercentGridAndBarSVG(originalPrice, discountPct, taxPct) {
  const price = n(originalPrice), discount = Math.max(0, Math.min(100, n(discountPct))), tax = n(taxPct);
  let body = "";
  for (let i = 0; i < 100; i++) body += `<rect x="${20 + (i % 10) * 18}" y="${25 + Math.floor(i / 10) * 18}" width="16" height="16" fill="${i < discount ? "#b53e20" : "#dbece5"}" stroke="#536e65"/>`;
  const subtotal = price * (1 - discount / 100), total = subtotal * (1 + tax / 100), scale = 3;
  body += `<rect x="230" y="70" width="${price * scale}" height="42" fill="#dbece5" stroke="#14594f"/><rect x="230" y="70" width="${subtotal * scale}" height="42" fill="#e4efbb" stroke="#14594f"/>`;
  body += label(230, 55, `Original $${f(price)} → discounted $${f(subtotal)}`) + label(230, 145, `${tax}% tax on $${f(subtotal)} = $${f(subtotal * tax / 100)} → $${f(total)}`) + label(20, 230, `${discount}% shaded on 100-grid`);
  return shell("100-grid and price bar showing discount then tax on discounted subtotal", body, 260);
}

export function makeCompositeFloorAndPrismSVG(rectW, rectL, triB, triH, prismDims) {
  const rw = n(rectW, 1), rl = n(rectL, 1), tb = n(triB, 1), th = n(triH, 1), [pl, pw, ph] = prismDims.map((v) => n(v, 1));
  const body = `<rect x="70" y="65" width="250" height="145" fill="#e4efbb" stroke="#14594f" stroke-width="3"/><path d="M320 210 L500 210 L320 65 Z" fill="#f6cfbb" stroke="#b53e20" stroke-width="3"/><line x1="320" y1="65" x2="320" y2="210" stroke="#124f7a" stroke-dasharray="6 4"/><path d="M320 65 h18 v18 h-18" fill="none" stroke="#124f7a" stroke-width="2"/>${label(155, 135, `${rl} × ${rw} rectangle`)}${label(355, 198, `base ${tb}`)}${label(330, 95, `height ${th}`)}<path d="M540 115 l70 -35 l70 35 v85 l-70 35 l-70 -35 Z" fill="#dbece5" stroke="#14594f" stroke-width="2"/>${label(535, 265, `Storage prism ${pl} × ${pw} × ${ph}`)}`;
  return shell("Composite floor with right-triangle perpendicular height and separate storage prism", body, 290);
}

export function makeOpenTopPrismNetSVG(length, width, height) {
  const l = n(length, 1), w = n(width, 1), h = n(height, 1), sx = Math.min(70 / l, 45 / h), sy = Math.min(42 / w, 70 / h);
  const L = l * sx, W = w * sy, H = h * sy;
  const faces = [[220, 100, L, W], [220, 100 - H, L, H], [220, 100 + W, L, H], [220 - H, 100, H, W], [220 + L, 100, H, W]];
  let body = faces.map(([x, y, fw, fh], i) => `<rect x="${x}" y="${y}" width="${fw}" height="${fh}" fill="${i === 0 ? "#dbece5" : "#e4efbb"}" stroke="#14594f" stroke-width="2"/>`).join("");
  body += `<rect x="220" y="${100 + W + H + 8}" width="${L}" height="${W}" fill="white" stroke="#b53e20" stroke-dasharray="6 4" stroke-width="2"/>`;
  const v = l * w * h, open = l * w + 2 * l * h + 2 * w * h, closed = open + l * w;
  body += label(20, 35, `Five-face net · missing top ${f(l)} × ${f(w)}`) + label(20, 260, `Volume ${f(v)} cubic units · open ${f(open)} sq units · closed ${f(closed)} sq units`);
  return shell("Rectangular prism net with base and four walls, missing top, volume and open versus closed surface area", body, 290);
}

export function makeTwoVariableLinearGraphSVG(optionA, optionB, maxX) {
  const [m1, b1] = optionA.map((v) => n(v)), [m2, b2] = optionB.map((v) => n(v)), xmax = Math.max(1, n(maxX, 8)), ymax = Math.max(m1 * xmax + b1, m2 * xmax + b2, 1), sx = 600 / xmax, sy = 205 / ymax;
  let body = "";
  for (let i = 0; i <= 4; i++) { const x = 70 + 150 * i, val = xmax * i / 4; body += `<line x1="${x}" y1="30" x2="${x}" y2="245" stroke="#d5dfda"/>` + label(x - 7, 265, f(val)); }
  for (const [m, b, color, name] of [[m1, b1, "#14594f", "A"], [m2, b2, "#b53e20", "B"]]) {
    body += `<line x1="70" y1="${245 - b * sy}" x2="670" y2="${245 - (m * xmax + b) * sy}" stroke="${color}" stroke-width="3"/>`;
    for (const xval of [0, xmax / 3, 2 * xmax / 3, xmax]) { const yval = m * xval + b; body += `<circle cx="${70 + xval * sx}" cy="${245 - yval * sy}" r="5" fill="${color}"/>` + label(70 + xval * sx - 12, 233 - yval * sy, `(${f(xval)},${f(yval)})`, 12); }
    body += label(490, name === "A" ? 22 : 42, `Option ${name}: ${f(b)} + ${f(m)}x`);
  }
  const cross = (b2 - b1) / (m1 - m2);
  if (Number.isFinite(cross) && cross >= 0 && cross <= xmax) body += `<circle cx="${70 + cross * sx}" cy="${245 - (m1 * cross + b1) * sy}" r="9" fill="#f0b900" stroke="#142c3b" stroke-width="2"/>` + label(470, 275, `Break-even x=${f(cross)}`);
  return shell("First-quadrant graph of two linear options with zero-usage points and break-even", body, 300);
}

export function makeNumberLineAndBalanceSVG(config = {}) {
  const value = n(config.value), inclusive = config.inclusive !== false, operator = esc(config.operator || "≥");
  const body = `<line x1="80" y1="100" x2="640" y2="100" stroke="#536e65" stroke-width="3"/><line x1="360" y1="100" x2="620" y2="100" stroke="#14594f" stroke-width="7"/><circle cx="360" cy="100" r="11" fill="${inclusive ? "#14594f" : "white"}" stroke="#14594f" stroke-width="3"/><path d="M620 89 l18 11 -18 11" fill="none" stroke="#14594f" stroke-width="3"/>${label(310, 140, `${value} ${operator} · ${inclusive ? "included" : "not included"}`)}<line x1="210" y1="210" x2="510" y2="210" stroke="#142c3b" stroke-width="4"/><path d="M240 210 L270 245 L300 210 M420 210 L450 245 L480 210" fill="none" stroke="#b53e20" stroke-width="3"/>${label(265, 270, "balanced equation model")}`;
  return shell("Inequality number line and equation balance model", body, 290);
}
