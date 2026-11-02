// Drawings for Pattern Detective: the four pattern shapes, the mystery machine, growing tile figures, a
// coordinate graph of the learner's clues and a hundred chart. Every figure is drawn from the round's own numbers
// and described in words. Meaning never rests on colour alone: shapes differ in outline, tiles carry marks.
// @fm2 FM-013 FM-036 FM-059
import { escapeHtml } from "../lang.js";
import { circle, label, line, PALETTE, rect, svg } from "./base.js";

const STAR =
  "M20 3 L24.7 14.2 L36.8 15.2 L27.6 23.1 L30.4 35 L20 28.7 L9.6 35 L12.4 23.1 L3.2 15.2 L15.3 14.2 Z";

// One of the four pattern shapes, decorative (the button or cell that holds it carries the accessible name).
export function symbolSvg(id, size = 40) {
  const ink = PALETTE.ink;
  const body = {
    circle: `<circle cx="20" cy="20" r="15" fill="${PALETTE.sky}" stroke="${ink}" stroke-width="2.5"/>`,
    square: `<rect x="6" y="6" width="28" height="28" rx="3" fill="${PALETTE.coral}" stroke="${ink}" stroke-width="2.5"/>`,
    triangle: `<path d="M20 5 L36 34 L4 34 Z" fill="${PALETTE.mint}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
    star: `<path d="${STAR}" fill="${PALETTE.gold}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
  }[id];
  return `<svg class="pd-sym" viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true" focusable="false">${body}</svg>`;
}

// The mystery machine with its input chute and output chute. `last` shows the most recent probe.
export function machineSvg({ inText, outText, last, name }) {
  const chip = (x, y, text, fill) =>
    `<rect x="${x}" y="${y}" width="84" height="34" rx="17" fill="${fill}" stroke="${PALETTE.ink}" stroke-width="2"/>${label(x + 42, y + 23, text, 17)}`;
  const gear = (x, y, r) =>
    `${circle(x, y, r, PALETTE.goldSoft)}${circle(x, y, r * 0.35, PALETTE.paper)}`;
  const body = [
    rect(100, 20, 120, 100, PALETTE.tealSoft, PALETTE.teal, 14),
    gear(134, 50, 15),
    gear(186, 50, 15),
    label(160, 106, "?", 34, PALETTE.teal),
    line(18, 70, 96, 70, PALETTE.ink, 3),
    `<path d="M88 62 L100 70 L88 78" fill="none" stroke="${PALETTE.ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    line(224, 70, 302, 70, PALETTE.ink, 3),
    `<path d="M294 62 L306 70 L294 78" fill="none" stroke="${PALETTE.ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    label(52, 56, inText, 15, PALETTE.muted),
    label(268, 56, outText, 15, PALETTE.muted),
    last ? chip(10, 82, last.x, PALETTE.paper) + chip(226, 82, last.y, PALETTE.mintSoft) : "",
  ].join("");
  return svg(320, 140, body, name);
}

// A growing tile figure: `b` base tiles (marked with a dot) beside `n` columns of `a` tiles.
export function figureSvg({ a, b, n, name }) {
  const tile = 22;
  const gap = 3;
  const cols = n + (b > 0 ? 1 : 0);
  const rows = Math.max(a, b, 1);
  const width = cols * (tile + gap) + 12;
  const height = rows * (tile + gap) + 12;
  const cells = [];
  let col = 0;
  if (b > 0) {
    for (let r = 0; r < b; r += 1) {
      const x = 6;
      const y = height - 6 - (r + 1) * (tile + gap) + gap;
      cells.push(
        `${rect(x, y, tile, tile, PALETTE.goldSoft, PALETTE.gold, 3)}${circle(x + tile / 2, y + tile / 2, 3.5, PALETTE.gold)}`,
      );
    }
    col = 1;
  }
  for (let c = 0; c < n; c += 1) {
    for (let r = 0; r < a; r += 1) {
      const x = 6 + (col + c) * (tile + gap);
      const y = height - 6 - (r + 1) * (tile + gap) + gap;
      cells.push(rect(x, y, tile, tile, PALETTE.tealSoft, PALETTE.teal, 3));
    }
  }
  return svg(width, height, cells.join(""), name, `width="${Math.min(width, 330)}"`);
}

const NICE = [
  1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000,
  1000000,
];
const stepFor = (span) => NICE.find((s) => span / s <= 6) || NICE.at(-1);
const trim = (n) =>
  Math.abs(n) >= 1000 ? `${Math.round(n / 100) / 10}k` : String(Math.round(n * 100) / 100);

// A coordinate graph (first quadrant unless a clue is negative). Machine A is a circle, machine B a square.
export function graphSvg({ points, xName, yName, name }) {
  const W = 320;
  const H = 250;
  const L = 44;
  const B = 36;
  const T = 14;
  const R = 14;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xmin = Math.min(0, ...xs);
  const ymin = Math.min(0, ...ys);
  const xspan = Math.max(Math.max(1, ...xs) - xmin, 4);
  const yspan = Math.max(Math.max(1, ...ys) - ymin, 4);
  const xs_ = stepFor(xspan);
  const ys_ = stepFor(yspan);
  const xmax = xmin + Math.ceil(xspan / xs_) * xs_ || xs_;
  const ymax = ymin + Math.ceil(yspan / ys_) * ys_ || ys_;
  const px = (x) => L + ((x - xmin) / (xmax - xmin)) * (W - L - R);
  const py = (y) => H - B - ((y - ymin) / (ymax - ymin)) * (H - B - T);
  const parts = [rect(0, 0, W, H, PALETTE.paper, PALETTE.line, 8)];
  for (let x = Math.ceil(xmin / xs_) * xs_; x <= xmax; x += xs_) {
    parts.push(
      line(px(x), T, px(x), H - B, PALETTE.line, 1),
      label(px(x), H - B + 16, trim(x), 11, PALETTE.muted),
    );
  }
  for (let y = Math.ceil(ymin / ys_) * ys_; y <= ymax; y += ys_) {
    parts.push(
      line(L, py(y), W - R, py(y), PALETTE.line, 1),
      label(L - 6, py(y) + 4, trim(y), 11, PALETTE.muted, "end"),
    );
  }
  parts.push(
    line(px(0), T, px(0), H - B, PALETTE.ink, 2),
    line(L, py(0), W - R, py(0), PALETTE.ink, 2),
  );
  parts.push(
    label((L + W - R) / 2, H - 6, xName, 13, PALETTE.ink),
    `<text transform="translate(12 ${(T + H - B) / 2}) rotate(-90)" text-anchor="middle" font-size="13" font-weight="700" fill="${PALETTE.ink}" font-family="Atkinson Hyperlegible, system-ui, sans-serif">${escapeHtml(yName)}</text>`,
  );
  for (const p of points) {
    parts.push(
      p.m
        ? rect(px(p.x) - 6, py(p.y) - 6, 12, 12, PALETTE.coral, PALETTE.ink, 2)
        : circle(px(p.x), py(p.y), 6.5, PALETTE.sky),
    );
  }
  return svg(W, H, parts.join(""), name);
}

// The hundred chart with the uncovered terms ringed and bold. `shown` is a Set of numbers.
export function hundredChartSvg({ shown, name }) {
  const size = 30;
  const cells = [];
  for (let n = 1; n <= 100; n += 1) {
    const col = (n - 1) % 10;
    const row = Math.floor((n - 1) / 10);
    const on = shown.has(n);
    const x = 4 + col * size;
    const y = 4 + row * size;
    cells.push(
      `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${on ? PALETTE.goldSoft : PALETTE.paper}" stroke="${on ? PALETTE.ink : PALETTE.line}" stroke-width="${on ? 3 : 1}"/>`,
      `<text x="${x + size / 2}" y="${y + size / 2 + 5}" text-anchor="middle" font-size="${on ? 14 : 12}" font-weight="${on ? 800 : 400}" fill="${on ? PALETTE.ink : PALETTE.muted}" font-family="Atkinson Hyperlegible, system-ui, sans-serif">${n}</text>`,
    );
  }
  return svg(308, 308, cells.join(""), name);
}
