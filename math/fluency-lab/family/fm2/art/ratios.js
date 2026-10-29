// Ratio and rate drawings for Ratio Recipe Lab: batches of bowls, tape (bar) diagrams, a double number line, a
// first-quadrant graph and a plain ratio table. Every picture is computed from exact rationals; floating point is used
// only to place things on the page. Shapes differ as well as colors (circle, square, triangle), so nothing depends on
// color alone. @fm2 FM-036 FM-056 FM-059
import { escapeHtml } from "../lang.js";
import { cmp, frac, isInt, mul, toDecimalString, toMixedString, toNumber } from "../rational.js";
import { circle, label, line, PALETTE, rect, svg } from "./base.js";

const INK = PALETTE.ink;
const TONES = [
  [PALETTE.teal, PALETTE.tealSoft],
  [PALETTE.coral, PALETTE.coralSoft],
  [PALETTE.mint, PALETTE.mintSoft],
];
const show = (r) => toMixedString(r);
const num = (r) => (typeof r === "number" ? r : toNumber(r));
let uid = 0;

// A small marker: shape 0 circle, 1 square, 2 triangle.
function mark(shape, x, y, size, tone) {
  const [stroke, fill] = TONES[shape % 3];
  if (shape % 3 === 0) return circle(x, y, size, fill, stroke);
  if (shape % 3 === 1) return rect(x - size, y - size, size * 2, size * 2, fill, stroke, 2);
  return `<polygon points="${x},${y - size} ${x + size},${y + size} ${x - size},${y + size}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
}

// A measuring-cup icon used in legends.
export function cupGlyph(x, y, size = 22, fill = PALETTE.skySoft) {
  const w = size;
  const h = size * 1.1;
  return `<path d="M${x} ${y} h${w} l-${w * 0.12} ${h} h-${w * 0.76} z" fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M${x + w} ${y + h * 0.25} q${w * 0.35} ${h * 0.1} 0 ${h * 0.4}" fill="none" stroke="${INK}" stroke-width="2"/>`;
}

// ---- bowls: one tile per batch, the last one partly filled when the batch has a fraction -------------------------------
// rows: [{ per: rational, shape: 0..2, show: boolean }]; `show` false draws the tile without that row's contents.
export function bowlsModel({ batch, rows, caption, aria, maxTiles = 12, perLine = 6, sum = null }) {
  const whole = Math.floor(batch.n / batch.d);
  const rest = frac(batch.n - whole * batch.d, batch.d);
  const drawn = Math.min(whole, maxTiles);
  const tiles = drawn + (rest.n ? 1 : 0);
  const lineCount = Math.max(1, Math.ceil(tiles / perLine));
  const across = Math.max(1, Math.min(perLine, tiles));
  const W = across * 96 + 16;
  const H = lineCount * 96 + (caption ? 34 : 6) + (sum ? 22 : 0);
  let body = "";
  for (let i = 0; i < tiles; i += 1) {
    const x = 12 + (i % perLine) * 96;
    const y = 8 + Math.floor(i / perLine) * 96;
    const partial = i === drawn && rest.n > 0;
    const id = `rl-clip-${(uid += 1)}`;
    const bowl = `M${x} ${y + 26} h84 q0 52 -42 52 q-42 0 -42 -52 z`;
    if (partial) {
      const cut = Math.max(6, Math.round(84 * num(rest)));
      body += `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${cut}" height="96"/></clipPath><path d="${bowl}" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/><g clip-path="url(#${id})"><path d="${bowl}" fill="${PALETTE.goldSoft}" stroke="${INK}" stroke-width="2"/></g>`;
    } else
      body += `<path d="${bowl}" fill="${PALETTE.goldSoft}" stroke="${INK}" stroke-width="2"/>`;
    body += line(x - 4, y + 26, x + 88, y + 26, INK, 3);
    const visible = rows.filter((row) => row.show);
    visible.forEach((row, index) => {
      const cy = y + 40 + index * 16;
      if (partial) return;
      if (isInt(row.per) && row.per.n >= 1 && row.per.n <= 8) {
        const n = row.per.n;
        const gap = Math.min(14, 66 / n);
        const startX = x + 42 - ((n - 1) * gap) / 2;
        for (let k = 0; k < n; k += 1)
          body += mark(row.shape, startX + k * gap, cy, Math.min(5, gap / 2.4));
      } else
        body +=
          mark(row.shape, x + 24, cy, 5) + label(x + 48, cy + 5, show(row.per), 13, INK, "start");
    });
  }
  if (whole > maxTiles)
    body += label(W - 8, H - (caption ? 12 : 4), `+${whole - maxTiles}`, 15, INK, "end");
  if (sum) body += label(W / 2, 96 * lineCount + 22, sum, 16, PALETTE.teal);
  if (caption) body += label(W / 2, H - 8, caption, 16);
  return svg(W, H, body, aria, `style="width:100%;max-width:${Math.max(240, Math.round(W * 1.6))}px"`);
}

// ---- tape diagram: one bar per ingredient, one segment per batch, segment width follows the amount ----------------------
// rows: [{ name, per: rational, shape, show }]
export function tapeModel({ batch, rows, caption, aria, maxSegments = 10 }) {
  const whole = Math.floor(batch.n / batch.d);
  const rest = frac(batch.n - whole * batch.d, batch.d);
  const segments = Math.min(whole, maxSegments);
  const count = segments + (rest.n ? 1 : 0);
  const biggest = rows.reduce((m, r) => Math.max(m, num(r.per)), 1);
  const unit = Math.min(
    64,
    440 /
      Math.max(1, count) /
      Math.max(1, biggest / rows.reduce((m, r) => Math.min(m, num(r.per)), biggest)),
  );
  const leftPad = 8;
  const rowH = 44;
  const W = 560;
  const H = rows.length * rowH + (caption ? 34 : 10);
  let body = "";
  rows.forEach((row, index) => {
    const y = 8 + index * rowH;
    const seg = Math.max(26, (num(row.per) / biggest) * Math.min(88, 440 / Math.max(1, count)));
    for (let i = 0; i < count; i += 1) {
      const frac1 = i === segments && rest.n ? num(rest) : 1;
      const w = Math.max(10, seg * frac1);
      const [stroke, fill] = TONES[row.shape % 3];
      body += `<rect x="${leftPad + i * seg}" y="${y}" width="${w - 2}" height="34" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="2"${frac1 < 1 ? ' stroke-dasharray="4 3"' : ""}/>`;
      if (row.show && frac1 === 1 && seg >= 34)
        body += label(leftPad + i * seg + (seg - 2) / 2, y + 24, show(row.per), 17);
    }
    body += label(W - 6, y + 24, row.name, 16, INK, "end");
  });
  void unit;
  if (whole > maxSegments) body += label(W - 6, H - 10, `+${whole - maxSegments}`, 14, INK, "end");
  if (caption) body += label(W / 2, H - 8, caption, 16);
  return svg(W, H, body, aria);
}

// ---- double number line: batches on top, an amount below, joined by dotted ticks ------------------------------------------
// bottom: { per: rational, name, hide: boolean }  hide=true prints "?" for the amount at the learner's batch.
export function doubleNumberLine({ batch, topName, bottom, aria }) {
  const W = 600;
  const H = 168;
  const x0 = 56;
  const x1 = 548;
  const top = 50;
  const bot = 128;
  const span = cmp(batch, frac(1)) > 0 ? batch : frac(1);
  const at = (value) => x0 + (num(value) / num(span)) * (x1 - x0);
  const marks = [{ v: frac(0) }, { v: frac(1) }];
  if (batch.n && cmp(batch, frac(1)) !== 0) marks.push({ v: batch, own: true });
  marks.sort((a, b) => cmp(a.v, b.v));
  let body = line(x0, top, x1 + 8, top, INK, 3) + line(x0, bot, x1 + 8, bot, INK, 3);
  body +=
    label(8, top - 14, topName, 14, PALETTE.teal, "start") +
    label(8, bot - 18, bottom.name, 14, PALETTE.coral, "start");
  let lastX = -99;
  for (const m of marks) {
    const x = at(m.v);
    body += line(x, top - 8, x, top + 8, INK, 3) + line(x, bot - 8, x, bot + 8, INK, 3);
    body += `<line x1="${x}" y1="${top + 10}" x2="${x}" y2="${bot - 10}" stroke="${PALETTE.line}" stroke-width="2" stroke-dasharray="4 4"/>`;
    const crowded = x - lastX < 38;
    if (!crowded || m.own) {
      body += label(x, top + 32, show(m.v), 19, PALETTE.teal);
      const text = m.v.n === 0 ? "0" : bottom.hide && m.own ? "?" : show(mul(bottom.per, m.v));
      body += label(x, bot + 30, text, 19, PALETTE.coral);
    }
    lastX = x;
  }
  return svg(W, H, body, aria);
}

// ---- first-quadrant graph with the line y = kx, labelled points and the learner's current point ----------------------------
// points: [{ x, y, filled, text }]; current: { x, y } or null. Axis maximums are whole numbers chosen by the caller.
export function coordGraph({
  k,
  xMax,
  yMax,
  xName,
  yName,
  points = [],
  current = null,
  showLine = true,
  aria,
}) {
  const W = 420;
  const H = 320;
  const L = 52;
  const R = 16;
  const T = 14;
  const B = 50;
  const px = (v) => L + (num(v) / xMax) * (W - L - R);
  const py = (v) => H - B - (num(v) / yMax) * (H - T - B);
  const tick = (max) =>
    max <= 10
      ? 1
      : max <= 20
        ? 2
        : max <= 50
          ? 5
          : max <= 100
            ? 10
            : max <= 200
              ? 20
              : max <= 500
                ? 50
                : 100;
  let body = rect(L, T, W - L - R, H - T - B, PALETTE.paper, PALETTE.line, 0);
  for (let v = 0; v <= xMax; v += tick(xMax)) {
    body += `<line x1="${px(v)}" y1="${T}" x2="${px(v)}" y2="${H - B}" stroke="${PALETTE.line}" stroke-width="1"/>${label(px(v), H - B + 20, String(v), 16)}`;
  }
  for (let v = 0; v <= yMax; v += tick(yMax)) {
    body += `<line x1="${L}" y1="${py(v)}" x2="${W - R}" y2="${py(v)}" stroke="${PALETTE.line}" stroke-width="1"/>${label(L - 6, py(v) + 5, String(v), 16, INK, "end")}`;
  }
  body += line(L, H - B, W - R, H - B, INK, 3) + line(L, H - B, L, T, INK, 3);
  body +=
    label((L + W - R) / 2, H - 6, xName, 16) +
    `<text transform="translate(14 ${(T + H - B) / 2}) rotate(-90)" text-anchor="middle" font-size="16" font-weight="700" fill="${INK}" font-family="Atkinson Hyperlegible, system-ui, sans-serif">${escapeHtml(yName)}</text>`;
  if (showLine && k) {
    const endX = Math.min(xMax, yMax / num(k));
    body += `<line x1="${px(0)}" y1="${py(0)}" x2="${px(endX)}" y2="${py(endX * num(k))}" stroke="${PALETTE.teal}" stroke-width="3" stroke-linecap="round"/>`;
  }
  for (const p of points) {
    body += circle(
      px(p.x),
      py(p.y),
      6,
      p.filled === false ? PALETTE.paper : PALETTE.tealSoft,
      PALETTE.teal,
    );
    if (p.text) body += label(px(p.x) + 8, py(p.y) - 10, p.text, 16, INK, "start");
  }
  if (current) {
    const cx = px(current.x);
    const cy = py(current.y);
    body += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${H - B}" stroke="${PALETTE.coral}" stroke-width="2" stroke-dasharray="4 4"/><line x1="${cx}" y1="${cy}" x2="${L}" y2="${cy}" stroke="${PALETTE.coral}" stroke-width="2" stroke-dasharray="4 4"/>`;
    body += `<polygon points="${cx},${cy - 8} ${cx + 8},${cy} ${cx},${cy + 8} ${cx - 8},${cy}" fill="${PALETTE.coralSoft}" stroke="${PALETTE.coral}" stroke-width="3"/>`;
  }
  return svg(W, H, body, aria);
}

// A read-only ratio table as HTML: head is an array of header strings (or null for none), rows an array of [label, ...cells].
export function ratioTableHtml({ caption, head, rows }) {
  const th = head ? `<thead><tr>${head.map((h) => `<th scope="col">${escapeHtml(h)}</th>`).join("")}</tr></thead>` : "";
  const tr = rows.map(([name, ...cells]) => `<tr><th scope="row">${escapeHtml(name)}</th>${cells.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("");
  return `<table class="rl-given"><caption>${escapeHtml(caption)}</caption>${th}<tbody>${tr}</tbody></table>`;
}

export const decimalOrMixed = (r) => toDecimalString(r) ?? toMixedString(r);
