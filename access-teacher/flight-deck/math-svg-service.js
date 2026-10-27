const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
const shell = (w, h, body, title = "Math model") => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" style="background:white"><rect width="100%" height="100%" fill="#fff"/><g font-family="Arial,sans-serif" fill="#18364a">${body}</g></svg>`;
function numberLineSVG({ min = -5, max = 5, value = 2, circleType = "closed", arrowDir = "right", label = "Number line" } = {}) {
  min = Number(min); max = Number(max); value = Number(value);
  if (![min, max, value].every(Number.isFinite) || max <= min) throw new RangeError("Use a finite interval with max greater than min.");
  value = Math.max(min, Math.min(max, value)); const left = 48, right = 552, y = 104, x = (n) => left + ((n - min) / (max - min)) * (right - left);
  let ticks = ""; const count = Math.min(20, Math.max(2, max - min));
  for (let i = 0; i <= count; i++) { const n = min + (max - min) * i / count; ticks += `<path d="M${x(n)} ${y - 8}v16" stroke="#7390a2"/><text x="${x(n)}" y="${y + 34}" text-anchor="middle" font-size="13">${esc(Number(n.toFixed(2)))}</text>`; }
  const point = x(value), open = circleType === "open";
  const arrow = arrowDir === "left" ? `M${point} ${y}H${left + 10}l12 -7m-12 7 12 7` : `M${point} ${y}H${right - 10}l-12 -7m12 7-12 7`;
  return shell(600, 180, `<text x="300" y="35" text-anchor="middle" font-size="18" font-weight="700">${esc(label)}</text><path d="M${left} ${y}H${right}" stroke="#38556a" stroke-width="3"/>${ticks}<path d="${arrow}" fill="none" stroke="#167b78" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${point}" cy="${y}" r="9" fill="${open ? "#fff" : "#167b78"}" stroke="#167b78" stroke-width="4"/><text x="${point}" y="${y - 19}" text-anchor="middle" font-size="15" font-weight="700">${esc(value)}</text>`, label);
}
function doubleNumberLineSVG({ topLabel = "Distance", bottomLabel = "Time", ratios = [0, 1, 2, 3], highlightIndex = 1 } = {}) {
  const vals = Array.isArray(ratios) ? ratios.slice(0, 7) : [];
  const body = `<text x="28" y="67" font-size="15" font-weight="700">${esc(topLabel)}</text><text x="28" y="127" font-size="15" font-weight="700">${esc(bottomLabel)}</text><path d="M130 62H570M130 122H570" stroke="#46647a" stroke-width="2"/>` + vals.map((v, i) => { const x = 150 + i * (420 / Math.max(1, vals.length - 1)); return `<path d="M${x} 53v18M${x} 113v18" stroke="#46647a"/><text x="${x}" y="48" text-anchor="middle" font-size="14" font-weight="${i === highlightIndex ? 700 : 400}" fill="${i === highlightIndex ? "#117c78" : "#18364a"}">${esc(v?.top ?? v)}</text><text x="${x}" y="151" text-anchor="middle" font-size="14" font-weight="${i === highlightIndex ? 700 : 400}">${esc(v?.bottom ?? i)}</text>`; }).join("");
  return shell(600, 190, body, "Double number line");
}
function fractionTapeSVG({ parts = 4, shaded = 2, comparisonParts = 0, label = "Fraction tape" } = {}) {
  parts = Math.max(1, Math.min(16, Math.floor(Number(parts) || 1))); shaded = Math.max(0, Math.min(parts, Math.floor(Number(shaded) || 0))); comparisonParts = Math.max(0, Math.min(16, Math.floor(Number(comparisonParts) || 0)));
  const x = 70, y = 78, width = 460, unit = width / parts;
  const cells = Array.from({ length: parts }, (_, i) => `<rect x="${x + i * unit}" y="${y}" width="${unit}" height="46" fill="${i < shaded ? "#a9d9d2" : "#fff"}" stroke="#355469" stroke-width="2"/>`).join("");
  const compare = comparisonParts ? `<text x="300" y="161" text-anchor="middle" font-size="14">Compare with ${comparisonParts} equal parts</text>` : "";
  return shell(600, 190, `<text x="300" y="38" text-anchor="middle" font-size="18" font-weight="700">${esc(label)}</text>${cells}<text x="300" y="145" text-anchor="middle" font-size="15">${shaded} of ${parts} equal parts</text>${compare}`);
}
function coordinatePlaneSVG({ quadrants = 4, points = [], showGrid = true } = {}) {
  const left = 70, top = 30, size = 280, step = 28, mid = left + size / 2, bottom = top + size;
  let grid = ""; if (showGrid) for (let i = 0; i <= 10; i++) { const z = left + i * step; grid += `<path d="M${z} ${top}V${bottom}M${left} ${top + i * step}H${left + size}" stroke="#e5edf0"/>`; }
  const axes = quadrants === 1 ? `<path d="M${left} ${bottom}H${left + size}M${left} ${bottom}V${top}" stroke="#29485c" stroke-width="2"/>` : `<path d="M${mid} ${top}V${bottom}M${left} ${top + size / 2}H${left + size}" stroke="#29485c" stroke-width="2"/>`;
  const dots = points.slice(0, 24).map((p) => { const px = quadrants === 1 ? left + Number(p.x) * step : mid + Number(p.x) * step; const py = quadrants === 1 ? bottom - Number(p.y) * step : top + size / 2 - Number(p.y) * step; if (!Number.isFinite(px + py) || px < left || px > left + size || py < top || py > bottom) return ""; return `<circle cx="${px}" cy="${py}" r="6" fill="${p.isError ? "#c05246" : "#147c78"}"/><text x="${px + 9}" y="${py - 8}" font-size="13">${esc(p.label || `(${p.x}, ${p.y})`)}</text>`; }).join("");
  return shell(440, 360, `${grid}${axes}${dots}<text x="${left + size + 12}" y="${mid + 5}" font-size="14">x</text><text x="${mid + 6}" y="${top - 8}" font-size="14">y</text>`, "Coordinate plane");
}
export const MathSVGService = Object.freeze({ makeNumberLineSVG: numberLineSVG, makeDoubleNumberLineSVG: doubleNumberLineSVG, makeFractionTapeSVG: fractionTapeSVG, makeCoordinatePlaneSVG: coordinatePlaneSVG });
