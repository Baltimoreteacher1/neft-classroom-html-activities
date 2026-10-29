// Card faces for Math Match: dot patterns, ten-frames, arrays, base-ten blocks, coins, clocks, fraction bars, number
// lines, hundred grids, tables and line graphs. Every face is drawn from the card's own numbers (a rep such as
// { t: "dots", n: 7 }) and carries data attributes and classes the tests count, so a picture cannot disagree with the
// words that describe it. Faces are decorative inside a button whose aria-label already states them. @fm2 FM-059 FM-036 FM-008
import { escapeHtml } from "../lang.js";
import { PALETTE } from "./base.js";

const {
  ink,
  teal,
  tealSoft,
  mint,
  coral,
  coralSoft,
  gold,
  goldSoft,
  sky,
  skySoft,
  line,
  paper,
  mist,
} = PALETTE;
const art = (body, extra = "") =>
  `<svg class="fm2-art mm-art" viewBox="0 0 120 84" aria-hidden="true" focusable="false" ${extra}>${body}</svg>`;
const cell = (cx, cy, r, cls, fill = teal) =>
  `<circle class="${cls}" cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${ink}" stroke-width="1.5"/>`;
const text = (x, y, value, size = 11, anchor = "middle", fill = ink) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="700" fill="${fill}" font-family="Atkinson Hyperlegible, system-ui, sans-serif">${escapeHtml(value)}</text>`;
const seg = (x1, y1, x2, y2, stroke = ink, width = 1.5) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
const minus = (n) => (n < 0 ? `−${Math.abs(n)}` : String(n));
const centered = (count, step) =>
  Array.from({ length: count }, (_, i) => 60 + (i - (count - 1) / 2) * step);

function dots({ n }) {
  const rows = Math.ceil(n / 5);
  const step = rows > 2 ? 18 : 24;
  const r = rows > 2 ? 7 : 9;
  const out = [];
  for (let row = 0; row < rows; row += 1) {
    const inRow = Math.min(5, n - row * 5);
    const y = 42 + (row - (rows - 1) / 2) * step;
    for (const x of centered(inRow, step)) out.push(cell(x, y, r, "mm-dot"));
  }
  return art(out.join(""));
}

function tenFrame({ n }) {
  const frames = n > 10 ? 2 : 1;
  const out = [];
  for (let f = 0; f < frames; f += 1) {
    const top = frames === 1 ? 24 : 4 + f * 42;
    for (let i = 0; i < 10; i += 1) {
      const x = 15 + (i % 5) * 18;
      const y = top + Math.floor(i / 5) * 18;
      out.push(
        `<rect class="mm-cell" x="${x}" y="${y}" width="18" height="18" fill="${paper}" stroke="${ink}" stroke-width="1.5"/>`,
      );
      if (f * 10 + i < n) out.push(cell(x + 9, y + 9, 6, "mm-counter"));
    }
  }
  return art(out.join(""));
}

function groups({ a, b }) {
  const cluster = (count, top, draw) => {
    const rows = Math.ceil(count / 5);
    return Array.from({ length: count }, (_, i) => {
      const inRow = Math.min(5, count - Math.floor(i / 5) * 5);
      const x = centered(inRow, 15)[i % 5];
      return draw(x, top + Math.floor(i / 5) * 15, rows);
    }).join("");
  };
  const circles = cluster(a, 10, (x, y) => cell(x, y + 6, 6, "mm-circle", teal));
  const top = 10 + Math.ceil(a / 5) * 15 + 6;
  const squares = cluster(
    b,
    top,
    (x, y) =>
      `<rect class="mm-square" x="${x - 5.5}" y="${y}" width="11" height="11" fill="${gold}" stroke="${ink}" stroke-width="1.5"/>`,
  );
  return art(circles + squares);
}

function array({ r, c }) {
  const size = Math.min(100 / c, 66 / r, 16);
  const out = [];
  for (let i = 0; i < r; i += 1)
    for (let j = 0; j < c; j += 1)
      out.push(
        cell(
          60 - (c * size) / 2 + size * (j + 0.5),
          42 - (r * size) / 2 + size * (i + 0.5),
          size * 0.42,
          "mm-array-dot",
          sky,
        ),
      );
  return art(out.join(""));
}

function blocks({ tn, o }) {
  const out = [];
  for (let k = 0; k < tn; k += 1) {
    const x = 4 + k * 10;
    out.push(
      `<rect class="mm-rod" x="${x}" y="12" width="6" height="60" fill="${mint}" stroke="${ink}" stroke-width="1.2"/>`,
    );
    for (let s = 1; s < 10; s += 1) out.push(seg(x, 12 + s * 6, x + 6, 12 + s * 6, ink, 0.8));
  }
  for (let j = 0; j < o; j += 1)
    out.push(
      `<rect class="mm-cube" x="${99 + (j % 2) * 9}" y="${22 + Math.floor(j / 2) * 10}" width="8" height="8" fill="${gold}" stroke="${ink}" stroke-width="1.2"/>`,
    );
  return art(out.join(""));
}

const COIN = { 25: [16, goldSoft], 10: [11, mist], 5: [14, skySoft], 1: [10, coralSoft] };
function coins({ q, d, n, p }) {
  const list = [
    ...Array(q).fill(25),
    ...Array(d).fill(10),
    ...Array(n).fill(5),
    ...Array(p).fill(1),
  ];
  const rows = list.length > 3 ? 2 : 1;
  return art(
    list
      .map((value, i) => {
        const inRow = i < 3 ? Math.min(3, list.length) : list.length - 3;
        const x = centered(inRow, 38)[i % 3];
        const y = rows === 1 ? 42 : 22 + Math.floor(i / 3) * 40;
        const [radius, fill] = COIN[value];
        return `<g class="mm-coin" data-cents="${value}"><circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${ink}" stroke-width="2"/>${text(x, y + 4, `${value}¢`, 11)}</g>`;
      })
      .join(""),
  );
}

function clock({ h, m }) {
  const pos = (len, deg) =>
    [60 + len * Math.sin((deg * Math.PI) / 180), 42 - len * Math.cos((deg * Math.PI) / 180)].map(
      (v) => v.toFixed(1),
    );
  const hourDeg = (h % 12) * 30 + m * 0.5;
  const minDeg = m * 6;
  const [hx, hy] = pos(18, hourDeg);
  const [mx, my] = pos(28, minDeg);
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const [x1, y1] = pos(32, i * 30);
    const [x2, y2] = pos(36, i * 30);
    return seg(x1, y1, x2, y2);
  }).join("");
  const nums = [
    [12, 0],
    [3, 90],
    [6, 180],
    [9, 270],
  ]
    .map(([v, deg]) => {
      const [x, y] = pos(25, deg);
      return text(x, Number(y) + 4, String(v), 11);
    })
    .join("");
  return art(
    `<circle cx="60" cy="42" r="38" fill="${paper}" stroke="${ink}" stroke-width="2.5"/>${ticks}${nums}` +
      `<line class="mm-hour-hand" data-angle="${hourDeg}" x1="60" y1="42" x2="${hx}" y2="${hy}" stroke="${ink}" stroke-width="4.5" stroke-linecap="round"/>` +
      `<line class="mm-min-hand" data-angle="${minDeg}" x1="60" y1="42" x2="${mx}" y2="${my}" stroke="${teal}" stroke-width="3" stroke-linecap="round"/>` +
      `<circle cx="60" cy="42" r="3" fill="${ink}"/>`,
  );
}

function fracBar({ n, d }) {
  const bars = Math.ceil(n / d);
  const height = 22;
  const top = 42 - (bars * height + (bars - 1) * 8) / 2;
  const out = [];
  for (let b = 0; b < bars; b += 1)
    for (let j = 0; j < d; j += 1) {
      const on = b * d + j < n;
      out.push(
        `<rect class="mm-part${on ? " mm-on" : ""}" x="${10 + (100 / d) * j}" y="${top + b * (height + 8)}" width="${100 / d}" height="${height}" fill="${on ? teal : paper}" stroke="${ink}" stroke-width="1.5"/>`,
      );
    }
  return art(out.join(""));
}

function fracLine({ n, d, max }) {
  const unit = 100 / max;
  const out = [seg(10, 46, 110, 46, ink, 2)];
  for (let k = 0; k <= d * max; k += 1) {
    const whole = k % d === 0;
    const x = 10 + (unit * k) / d;
    out.push(seg(x, 46 - (whole ? 7 : 4), x, 46 + (whole ? 7 : 4)));
    if (whole) out.push(text(x, 66, String(k / d), 12));
  }
  out.push(cell(10 + (unit * n) / d, 46, 6, "mm-point", coral));
  return art(out.join(""));
}

function hundredGrid({ k }) {
  const out = [];
  for (let i = 0; i < 100; i += 1)
    out.push(
      `<rect class="mm-hcell${i < k ? " mm-on" : ""}" x="${25 + (i % 10) * 7}" y="${7 + Math.floor(i / 10) * 7}" width="7" height="7" fill="${i < k ? teal : paper}" stroke="${line}" stroke-width="0.8"/>`,
    );
  return art(
    `${out.join("")}<rect x="25" y="7" width="70" height="70" fill="none" stroke="${ink}" stroke-width="1.5"/>`,
  );
}

// A two-row table: heads on the left, values across. Used by ratio, expression, proportion and line tables.
function table(heads, top, bottom) {
  const columns = top.length;
  const first = 36;
  const width = (112 - first) / columns;
  const rowHeight = 24;
  const rows = [heads[0], heads[1]];
  const out = [];
  [top, bottom].forEach((values, r) => {
    const y = 42 - rowHeight + r * rowHeight;
    out.push(
      `<rect x="4" y="${y}" width="${first}" height="${rowHeight}" fill="${tealSoft}" stroke="${ink}" stroke-width="1.5"/>`,
      text(4 + first / 2, y + 17, rows[r], 13),
    );
    values.forEach((value, i) => {
      out.push(
        `<rect class="mm-trow" x="${4 + first + width * i}" y="${y}" width="${width}" height="${rowHeight}" fill="${paper}" stroke="${ink}" stroke-width="1.5"/>`,
        text(4 + first + width * (i + 0.5), y + 17, minus(value), 13),
      );
    });
  });
  return art(out.join(""));
}

function ratioTable({ rows }, ctx) {
  const [denHead, numHead] = ctx.head;
  const height = 17;
  const top = 42 - ((rows.length + 1) * height) / 2;
  const out = [];
  [[denHead, numHead], ...rows].forEach((row, r) => {
    row.forEach((value, c) => {
      const x = 8 + c * 52;
      const y = top + r * height;
      out.push(
        `<rect class="${r ? "mm-trow" : "mm-thead"}" x="${x}" y="${y}" width="52" height="${height}" fill="${r ? paper : tealSoft}" stroke="${ink}" stroke-width="1.5"/>`,
        text(x + 26, y + 13, String(value), r ? 13 : 11),
      );
    });
  });
  return art(out.join(""));
}

function moveLine({ a, s }) {
  const lo = Math.min(a, a + s, 0) - 1;
  const hi = Math.max(a, a + s, 0) + 1;
  const unit = 100 / (hi - lo);
  const x = (v) => 10 + (v - lo) * unit;
  const every = unit >= 17 ? 1 : unit >= 8.5 ? 2 : 5;
  const out = [seg(10, 58, 110, 58, ink, 2)];
  for (let v = lo; v <= hi; v += 1) {
    out.push(seg(x(v), 54, x(v), 62));
    if (v % every === 0) out.push(text(x(v), 76, minus(v), 10));
  }
  const dir = Math.sign(s);
  out.push(
    `<line class="mm-arrow" data-from="${a}" data-to="${a + s}" x1="${x(a)}" y1="34" x2="${x(a + s) - dir * 6}" y2="34" stroke="${coral}" stroke-width="3" stroke-linecap="round"/>`,
    `<polygon points="${x(a + s)},34 ${x(a + s) - dir * 9},29 ${x(a + s) - dir * 9},39" fill="${coral}" stroke="${coral}"/>`,
    seg(x(a), 36, x(a), 53, ink, 1),
    cell(x(a), 58, 5, "mm-start", teal),
    text(x(a), 24, minus(a), 11),
  );
  return art(out.join(""));
}

function lineGraph({ mn, md, b }, { uid }) {
  const u = 7;
  const sx = (v) => 60 + v * u;
  const sy = (v) => 42 - v * u;
  const slope = mn / md;
  const out = [];
  for (let k = -5; k <= 5; k += 1)
    out.push(
      seg(sx(k), sy(-5), sx(k), sy(5), line, 0.7),
      seg(sx(-5), sy(k), sx(5), sy(k), line, 0.7),
    );
  out.push(
    seg(sx(-5), sy(0), sx(5), sy(0), ink, 1.5),
    seg(sx(0), sy(-5), sx(0), sy(5), ink, 1.5),
    text(sx(5) + 9, sy(0) + 4, "x", 10),
    text(sx(0), sy(5) - 3, "y", 10),
  );
  out.push(
    `<clipPath id="mm-clip-${uid}"><rect x="${sx(-5)}" y="${sy(5)}" width="${10 * u}" height="${10 * u}"/></clipPath>`,
    `<line class="mm-graph-line" data-slope="${mn}/${md}" data-b="${b}" clip-path="url(#mm-clip-${uid})" x1="${sx(-5)}" y1="${sy(-5 * slope + b)}" x2="${sx(5)}" y2="${sy(5 * slope + b)}" stroke="${coral}" stroke-width="2.5" stroke-linecap="round"/>`,
    cell(sx(0), sy(b), 3.2, "mm-intercept", coral),
  );
  return art(out.join(""));
}

const GRAPHIC = {
  dots,
  tenframe: tenFrame,
  groups,
  array,
  blocks,
  coins,
  clock,
  fracbar: fracBar,
  fracline: fracLine,
  hgrid: hundredGrid,
  ratiotable: ratioTable,
  move: moveLine,
  lgraph: lineGraph,
  vtable: (r) => table(["n", "out"], r.ns, r.ns.map((n) => (r.a * n) / (r.ad || 1) + r.b)),
  ptable: (r) => table(["x", "y"], r.xs, r.xs.map((x) => (x * r.n) / r.d)),
  ltable: (r) => table(["x", "y"], r.xs, r.xs.map((x) => (r.mn * x) / r.md + r.b)),
};

// `copy` is the card's words in the current language; `ctx` carries what a drawing cannot know alone: a unique id
// (for the graph's clip path) and the ratio table's column headings in the current language.
export function drawFace(rep, copy, ctx = {}) {
  const paint = GRAPHIC[rep.t];
  if (paint) return `<span class="mm-face mm-t-${rep.t}">${paint(rep, { uid: 0, head: [], ...ctx })}</span>`;
  const safe = escapeHtml(copy);
  let body = safe;
  if (rep.t === "frac")
    body = `<span class="mm-frac"><span class="mm-num">${rep.n}</span><span class="mm-den">${rep.d}</span></span>`;
  else if (rep.t === "sci") body = `${escapeHtml(rep.c)} × 10<sup>${minus(rep.e)}</sup>`;
  else if (rep.t === "product10")
    body = `(${rep.a} × 10<sup>${minus(rep.p)}</sup>) × (${rep.b} × 10<sup>${minus(rep.q)}</sup>)`;
  return `<span class="mm-face mm-t-${rep.t}"><span class="mm-text">${body}</span></span>`;
}

export const GRAPHIC_TYPES = Object.keys(GRAPHIC);
