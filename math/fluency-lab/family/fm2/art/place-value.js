// Place-value drawings for Number Builder: ten-frames with counters, base-ten blocks, place-value discs and
// signed chips. Every figure is drawn from the build's own counts. @fm2 FM-036 FM-059
import { PALETTE, circle, label, line, rect, svg } from "./base.js";

const DISC_COLORS = [
  PALETTE.teal,
  PALETTE.sky,
  PALETTE.mint,
  PALETTE.gold,
  PALETTE.coral,
  PALETTE.ink,
];
const SOFT = {
  [PALETTE.teal]: PALETTE.tealSoft,
  [PALETTE.sky]: PALETTE.skySoft,
  [PALETTE.mint]: PALETTE.mintSoft,
  [PALETTE.gold]: PALETTE.goldSoft,
  [PALETTE.coral]: PALETTE.coralSoft,
  [PALETTE.ink]: PALETTE.mist,
};
const sup = (n) =>
  String(n)
    .replace(/-/g, "⁻")
    .replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
const group = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const faceOf = (piece) =>
  piece.kind === "expdisc"
    ? `10${sup(piece.exp)}`
    : piece.value.startsWith("-")
      ? `−${group(piece.value.slice(1))}`
      : piece.kind === "chip"
        ? `+${group(piece.value)}`
        : group(piece.value);
const cellText = (x, y, text, size = 12, fill = PALETTE.ink) => label(x, y, text, size, fill);

export const NB_ICON = `<svg viewBox="0 0 36 36" aria-hidden="true" focusable="false"><rect x="3" y="20" width="9" height="13" rx="2" fill="${PALETTE.sky}"/><rect x="14" y="12" width="9" height="21" rx="2" fill="${PALETTE.teal}"/><rect x="25" y="4" width="9" height="29" rx="2" fill="${PALETTE.mint}"/></svg>`;

// ---------- one piece, drawn in a 56x56 box for the tray ----------
function blockShape(kind, x, y, scale = 1) {
  const full = 48 * scale;
  if (kind === "flat") {
    const cells = Array.from(
      { length: 9 },
      (_, i) =>
        line(
          x + ((i + 1) * full) / 10,
          y,
          x + ((i + 1) * full) / 10,
          y + full,
          PALETTE.teal,
          0.8,
        ) +
        line(
          x,
          y + ((i + 1) * full) / 10,
          x + full,
          y + ((i + 1) * full) / 10,
          PALETTE.teal,
          0.8,
        ),
    ).join("");
    return rect(x, y, full, full, PALETTE.tealSoft, PALETTE.teal, 3) + cells;
  }
  if (kind === "rod") {
    const w = full / 6;
    const marks = Array.from({ length: 9 }, (_, i) =>
      line(x, y + ((i + 1) * full) / 10, x + w, y + ((i + 1) * full) / 10, PALETTE.sky, 0.8),
    ).join("");
    return rect(x, y, w, full, PALETTE.skySoft, PALETTE.sky, 2) + marks;
  }
  if (kind === "unit") return rect(x, y, full / 5, full / 5, PALETTE.mintSoft, PALETTE.mint, 2);
  return rect(x, y, full / 10, full / 10, PALETTE.goldSoft, PALETTE.gold, 1);
}

export function pieceIcon(piece, index = 0, label_ = "") {
  let body;
  if (piece.kind === "counter")
    body =
      circle(28, 28, 20, piece.color === "red" ? PALETTE.coral : PALETTE.gold) +
      (piece.color === "red" ? "" : circle(28, 28, 9, PALETTE.goldSoft, PALETTE.ink));
  else if (piece.kind === "flat") body = blockShape("flat", 4, 4);
  else if (piece.kind === "rod") body = blockShape("rod", 24, 4);
  else if (piece.kind === "unit") body = blockShape("unit", 23, 23);
  else if (piece.kind === "mini") body = blockShape("mini", 26, 26);
  else if (piece.kind === "chip") {
    const neg = piece.value.startsWith("-");
    body = `<circle cx="28" cy="28" r="22" fill="${neg ? PALETTE.coralSoft : PALETTE.mintSoft}" stroke="${neg ? PALETTE.coral : PALETTE.mint}" stroke-width="3" ${neg ? 'stroke-dasharray="5 3"' : ""}/>${cellText(28, 33, faceOf(piece), faceOf(piece).length > 4 ? 12 : 16)}`;
  } else {
    const color = DISC_COLORS[index % DISC_COLORS.length];
    body = `<circle cx="28" cy="28" r="23" fill="${SOFT[color]}" stroke="${color}" stroke-width="3"/>${cellText(28, 32, faceOf(piece), faceOf(piece).length > 5 ? 11 : 13)}`;
  }
  return `<svg class="fm2-art nb-icon" viewBox="0 0 56 56" aria-hidden="true" focusable="false">${body}${label_}</svg>`;
}

// ---------- the mat ----------
function tenFrames(round, counts, name) {
  const seq = round.pieces.flatMap((p) => Array.from({ length: counts[p.id] }, () => p));
  const frames = (round.cap ?? 10) > 10 ? 2 : 1;
  const cell = 46;
  const gap = 28;
  let body = "";
  for (let f = 0; f < frames; f += 1) {
    const ox = f * (cell * 5 + gap);
    for (let i = 0; i < 10; i += 1) {
      const x = ox + (i % 5) * cell;
      const y = Math.floor(i / 5) * cell;
      body += rect(x, y, cell, cell, PALETTE.paper, PALETTE.muted, 0);
      const piece = seq[f * 10 + i];
      if (piece)
        body +=
          circle(
            x + cell / 2,
            y + cell / 2,
            17,
            piece.color === "red" ? PALETTE.coral : PALETTE.gold,
          ) +
          (piece.color === "red"
            ? ""
            : circle(x + cell / 2, y + cell / 2, 7, PALETTE.goldSoft, PALETTE.ink));
    }
  }
  return svg(frames * cell * 5 + (frames - 1) * gap, cell * 2, body, name);
}

function blockMat(round, counts, name) {
  const order = [...round.pieces].sort((a, b) => Number(b.value) - Number(a.value));
  const W = 640;
  const U = 84;
  const GAP = 8;
  let x = 0;
  let y = 0;
  let rowH = 0;
  let body = "";
  const place = (w, h, draw) => {
    if (x > 0 && x + w > W) {
      x = 0;
      y += rowH + 10;
      rowH = 0;
    }
    body += draw(x, y);
    x += w + GAP;
    rowH = Math.max(rowH, h);
  };
  const stack = (kind, size, n, rows) => {
    for (let c = 0; c < n; c += rows) {
      const col = Math.min(rows, n - c);
      place(size, rows * (size + 1), (px, py) => Array.from({ length: col }, (_, i) => (kind === "unit" ? rect(px, py + (i * (size + 1)), size, size, PALETTE.mintSoft, PALETTE.mint, 2) : rect(px, py + (i * (size + 1)), size, size, PALETTE.goldSoft, PALETTE.gold, 1))).join(""));
    }
  };
  for (const p of order) {
    const n = counts[p.id];
    if (p.kind === "flat") for (let i = 0; i < n; i += 1) place(U, U, (px, py) => blockShape("flat", px, py, U / 48));
    else if (p.kind === "rod") for (let i = 0; i < n; i += 1) place(14, U, (px, py) => blockShape("rod", px, py, U / 48));
    else if (p.kind === "unit") stack("unit", 13, n, 6);
    else stack("mini", 7, n, 10);
  }
  return svg(W, y + rowH + 2 || U, body, name);
}

function discChart(round, counts, name) {
  const colW = 92;
  const H = 250;
  const maxN = Math.max(1, ...round.pieces.map((p) => counts[p.id]));
  const step = Math.min(24, 190 / maxN);
  let body = "";
  round.pieces.forEach((p, i) => {
    const x = i * colW;
    const color = DISC_COLORS[i % DISC_COLORS.length];
    body += rect(x + 4, 4, colW - 8, H - 8, PALETTE.mist, PALETTE.line, 8);
    body += cellText(x + colW / 2, 30, faceOf(p), 21, color === PALETTE.gold ? PALETTE.ink : color);
    for (let k = 0; k < counts[p.id]; k += 1)
      body += circle(x + colW / 2, H - 24 - k * step, 17, SOFT[color], color);
    if (p.kind === "expdisc" && p.exp === 0 && round.pieces.some((q) => q.exp < 0)) body += circle(x + colW, 24, 5, PALETTE.ink);
  });
  return svg(round.pieces.length * colW, H, body, name);
}

function chipMat(round, counts, name) {
  const W = 640;
  const items = [];
  const mags = [...new Set(round.pieces.map((p) => p.value.replace("-", "")))];
  const leftover = {};
  for (const m of mags) {
    const pos = round.pieces.find((p) => p.value === m);
    const neg = round.pieces.find((p) => p.value === `-${m}`);
    const pairs = pos && neg ? Math.min(counts[pos.id], counts[neg.id]) : 0;
    for (let i = 0; i < pairs; i += 1) items.push({ pair: [pos, neg] });
    if (pos) leftover[pos.id] = counts[pos.id] - pairs;
    if (neg) leftover[neg.id] = counts[neg.id] - pairs;
  }
  const loose = (negative) =>
    round.pieces
      .filter((p) => p.value.startsWith("-") === negative)
      .flatMap((p) => Array.from({ length: leftover[p.id] ?? counts[p.id] }, () => ({ chip: p })));
  items.push(...loose(false), ...loose(true));
  const chipSvg = (p, cx, cy) => {
    const neg = p.value.startsWith("-");
    const text = faceOf(p);
    return `<circle cx="${cx}" cy="${cy}" r="21" fill="${neg ? PALETTE.coralSoft : PALETTE.mintSoft}" stroke="${neg ? PALETTE.coral : PALETTE.mint}" stroke-width="3" ${neg ? 'stroke-dasharray="5 3"' : ""}/>${cellText(cx, cy + 5, text, text.length > 4 ? 11 : 14)}`;
  };
  let x = 0;
  let y = 0;
  let rowH = 0;
  let body = "";
  for (const item of items) {
    const w = item.pair ? 60 : 48;
    const h = item.pair ? 104 : 48;
    if (x + w > W) {
      x = 0;
      y += rowH + 8;
      rowH = 0;
    }
    if (item.pair)
      body += `<rect x="${x}" y="${y}" width="54" height="100" rx="27" fill="none" stroke="${PALETTE.muted}" stroke-width="2" stroke-dasharray="4 4"/>${chipSvg(item.pair[0], x + 27, y + 27)}${chipSvg(item.pair[1], x + 27, y + 73)}`;
    else body += chipSvg(item.chip, x + 24, y + 24);
    x += w + 6;
    rowH = Math.max(rowH, h);
  }
  return svg(W, y + rowH + 2 || 50, body, name);
}

// `name` is the accessible description of the build in the current language.
export function matSvg(round, counts, name) {
  if (round.kit === "counters") return tenFrames(round, counts, name);
  if (round.kit === "chips") return chipMat(round, counts, name);
  if (round.kit === "discs" || round.kit === "expdiscs")
    return discChart(round, counts, name);
  return blockMat(round, counts, name);
}
