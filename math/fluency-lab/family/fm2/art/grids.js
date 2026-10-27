// Grid, array, area-model, tiling, prism and algebra-tile drawings for Array Architect (and any game that needs them).
// Every picture is computed from the numbers it is given, so a model can never disagree with its equation.
// @fm2 FM-036 FM-059
import { circle, label, line, PALETTE, rect, svg } from "./base.js";

const SOFT = [PALETTE.violetSoft, PALETTE.mintSoft, PALETTE.goldSoft, PALETTE.skySoft];
const STRONG = [PALETTE.violet, PALETTE.mint, PALETTE.gold, PALETTE.sky];
const num = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));

// A rows x cols array of tiles or counters with its dimensions written on the top and left.
export function arraySvg(rows, cols, { counters = false, caption = "", maxWidth = 560, labels = true } = {}) {
  const r = Math.max(rows, 0);
  const c = Math.max(cols, 0);
  const size = Math.max(5, Math.min(30, Math.floor(maxWidth / Math.max(c, 4))));
  const left = labels ? 40 : 6;
  const top = labels ? 30 : 6;
  const width = left + Math.max(c, 1) * size + 12;
  const height = top + Math.max(r, 1) * size + 10;
  let body = "";
  if (!r || !c) {
    body = rect(left, top, size * 3, size * 2, "none", PALETTE.line) + label(left + size * 1.5, top + size * 1.2, "0", 14, PALETTE.muted);
  } else {
    for (let i = 0; i < r; i += 1) {
      for (let j = 0; j < c; j += 1) {
        const x = left + j * size;
        const y = top + i * size;
        body += counters
          ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${PALETTE.paper}" stroke="${PALETTE.line}" stroke-width="1"/>${circle(x + size / 2, y + size / 2, size * 0.36, PALETTE.violet)}`
          : `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${PALETTE.violetSoft}" stroke="${PALETTE.violet}" stroke-width="${size > 12 ? 1.5 : 1}"/>`;
      }
    }
    if (labels) body += label(left + (c * size) / 2, top - 10, String(c), 15) + label(left - 10, top + (r * size) / 2 + 5, String(r), 15, PALETTE.ink, "end");
  }
  return svg(width, height, body, caption || `${r} by ${c}`);
}

// A rectangle split in proportion to its parts. rowParts/colParts: [{text, weight}]. regions[i][j]: {id, text}.
export function areaModelSvg({ rowParts, colParts, regions, rowTotal = "", colTotal = "", caption = "" }) {
  const W = 330;
  const H = 170;
  const fit = (parts, span) => {
    const weights = parts.map((p) => Math.max(Math.abs(p.weight) || 1, 0));
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    const floored = weights.map((w) => Math.max(w, sum * 0.2));
    const total = floored.reduce((a, b) => a + b, 0);
    return floored.map((w) => (w / total) * span);
  };
  const widths = fit(colParts, W);
  const heights = fit(rowParts, H);
  const left = 54;
  const top = colParts.length > 1 || colTotal ? 54 : 30;
  let body = "";
  let y = top;
  rowParts.forEach((rp, i) => {
    let x = left;
    colParts.forEach((cp, j) => {
      const k = i * colParts.length + j;
      body += rect(x, y, widths[j], heights[i], SOFT[k % 4], STRONG[k % 4], 3);
      const region = regions?.[i]?.[j];
      if (region) {
        body += label(x + widths[j] / 2, y + heights[i] / 2 + (region.text ? -2 : 6), region.id, 18);
        if (region.text) body += label(x + widths[j] / 2, y + heights[i] / 2 + 16, region.text, 13, PALETTE.muted);
      }
      x += widths[j];
    });
    body += label(left - 8, y + heights[i] / 2 + 5, rp.text, 15, PALETTE.ink, "end");
    y += heights[i];
  });
  let x = left;
  colParts.forEach((cp, j) => {
    body += label(x + widths[j] / 2, top - 8, cp.text, 15);
    x += widths[j];
  });
  if (colTotal) body += line(left, 22, left + W, 22, PALETTE.muted, 2) + label(left + W / 2, 16, colTotal, 14, PALETTE.muted);
  if (rowTotal) body += `<g transform="rotate(-90 12 ${top + H / 2})">${label(12, top + H / 2 + 5, rowTotal, 14, PALETTE.muted)}</g>`;
  return svg(left + W + 12, top + H + 12, body, caption || "Area model");
}

// A tile side `s` laid over an a x b rectangle ("gcf") or a n x n square covered by a x b tiles ("lcm").
export function tilingSvg({ mode, a, b, s, caption = "" }) {
  const maxW = 320;
  const maxH = 200;
  const wUnits = mode === "gcf" ? a : s;
  const hUnits = mode === "gcf" ? b : s;
  const scale = Math.min(maxW / wUnits, maxH / hUnits);
  const tw = mode === "gcf" ? s : a;
  const th = mode === "gcf" ? s : b;
  const left = 36;
  const top = 30;
  const W = wUnits * scale;
  const H = hUnits * scale;
  const across = Math.floor(wUnits / tw);
  const down = Math.floor(hUnits / th);
  let body = rect(left, top, W, H, PALETTE.coralSoft, PALETTE.coral, 2).replace("<rect ", '<rect stroke-dasharray="6 4" ');
  for (let i = 0; i < down; i += 1) {
    for (let j = 0; j < across; j += 1) {
      const k = (i + j) % 2 ? 0 : 1;
      body += rect(left + j * tw * scale, top + i * th * scale, tw * scale, th * scale, SOFT[k], STRONG[k], 2);
    }
  }
  body += label(left + W / 2, top - 10, num(wUnits), 15) + label(left - 8, top + H / 2 + 5, num(hUnits), 15, PALETTE.ink, "end");
  const tileText = mode === "gcf" ? `${s} × ${s}` : `${a} × ${b}`;
  return svg(left + W + 12, top + H + 10, body, caption || `${tileText} tiles on a ${num(wUnits)} by ${num(hUnits)} ${mode === "gcf" ? "floor" : "square"}; ${across * down} fit, the dashed part is a gap`);
}

// Isometric stack of unit cubes: layers x rows x cols.
export function prismSvg(rows, cols, layers, caption = "") {
  const u = 16;
  const cos = Math.cos(Math.PI / 6) * u;
  const sin = Math.sin(Math.PI / 6) * u;
  const px = (x, y) => (x - y) * cos;
  const py = (x, y, z) => (x + y) * sin - z * u;
  const pts = (list) => list.map(([x, y, z]) => `${px(x, y).toFixed(1)},${py(x, y, z).toFixed(1)}`).join(" ");
  let body = "";
  for (let z = 0; z < layers; z += 1) {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const face = (list, fill) => `<polygon points="${pts(list)}" fill="${fill}" stroke="${PALETTE.ink}" stroke-width="1" stroke-linejoin="round"/>`;
        body += face([[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]], PALETTE.mintSoft);
        body += face([[x, y + 1, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]], PALETTE.skySoft);
        body += face([[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]], PALETTE.violetSoft);
      }
    }
  }
  const minX = px(0, rows);
  const maxX = px(cols, 0);
  const minY = py(0, 0, layers);
  const maxY = py(cols, rows, 0);
  const pad = 8;
  const inner = `<g transform="translate(${(pad - minX).toFixed(1)} ${(pad - minY).toFixed(1)})">${body}</g>`;
  return svg(Math.ceil(maxX - minX + pad * 2), Math.ceil(maxY - minY + pad * 2), inner, caption || `Prism: ${layers} layers of ${rows} by ${cols} cubes`);
}

// Algebra tiles: width = w0 + w1 x, height = h0 + h1 x. x^2 tile violet, x tiles mint, unit tiles gold.
export function tilesSvg(w, h, { widthText = "", heightText = "", caption = "" } = {}) {
  const u = 13;
  const X = 4.4 * u;
  const cols = [...Array(w[1] || 0).fill(X), ...Array(w[0] || 0).fill(u)];
  const rows = [...Array(h[1] || 0).fill(X), ...Array(h[0] || 0).fill(u)];
  const left = Math.max(46, heightText.length * 9 + 20);
  const top = 30;
  const W = cols.reduce((a, b) => a + b, 0);
  const H = rows.reduce((a, b) => a + b, 0);
  let body = "";
  let y = top;
  for (const rh of rows) {
    let x = left;
    for (const cw of cols) {
      const big = cw === X && rh === X;
      const long = (cw === X) !== (rh === X);
      const [fill, edge] = big ? [PALETTE.violetSoft, PALETTE.violet] : long ? [PALETTE.mintSoft, PALETTE.mint] : [PALETTE.goldSoft, PALETTE.gold];
      body += rect(x, y, cw, rh, fill, edge, 2);
      if (big) body += label(x + cw / 2, y + rh / 2 + 6, "x²", 18);
      else if (long) body += label(x + cw / 2, y + rh / 2 + 5, "x", 14);
      x += cw;
    }
    y += rh;
  }
  if (!W || !H) body += rect(left, top, 3 * u, 2 * u, "none", PALETTE.line);
  if (widthText) body += label(left + W / 2, top - 10, widthText, 15);
  if (heightText) body += label(left - 8, top + H / 2 + 5, heightText, 15, PALETTE.ink, "end");
  const naturalW = left + Math.max(W, 3 * u) + 14;
  return svg(naturalW, top + Math.max(H, 2 * u) + 10, body, caption || "Algebra tiles", `style="width:${Math.round(naturalW * 1.5)}px;max-width:100%"`);
}
