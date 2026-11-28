// Math Literacy Studio: static math visuals. `renderVisual(spec) -> { svg, alt, summary }`.
// Pure functions: no DOM, no network, no randomness. The same spec always gives byte-identical output (node and browsers).
//
// spec = { kind, alt?, ...args } (the shape of `Problem.visual`). If `alt` is a non-empty string it is used as the alt text,
// otherwise a generated one is returned. `summary` is a complete plain-language description for a screen reader, stating the
// values that are DRAWN. A hidden or unknown value ("?" / null) is drawn as "?" and spoken as "unknown": its number never
// appears in the svg text, alt or summary.
//
// Rational values are numbers or strings ("3/4", "1 1/2", "0.25", "-2"). Impossible arguments throw an Error that names the kind.
// Colors come only from the lab palette (navy, teal, amber, coral, blue, ink, paper, white and tints of them). Text is >= 12 units.
//
// Args per kind (documented in docs/math-literacy/architecture.md; EXTRA optional args are marked +):
//  tenframe     { n, frames=1 }                       n <= 10*frames, frames 1..8
//  counters     { n, perRow=10, shape="circle"|"square"|"triangle"|"star" }   n <= 200
//  bond         { whole, a, b, hide:"whole"|"a"|"b"|null }                    a value of "?" is also hidden; a + b must equal whole
//  placevalue   { hundreds=0, tens=0, ones=0 }        hundreds <= 9, tens <= 20, ones <= 30
//  numberline   { min, max, ticks, marks:[{at,label,hollow}], hops:[{from,to,label}], show:"int"|"frac"|"dec",
//                 + labelTicks:"all"|"ends"|"none" (default "ends" when a mark label is "?", else "all"),
//                 + mixed=false (improper -> mixed numbers), + reduce=true (false: label with the common denominator) }
//                 A mark labelled "?" is drawn at its position but the summary says "unknown".
//  array        { rows, cols, shade?:{rows,cols}, label=true }   the summary never states the total
//  areamodel    { w, h, cutW?, cutH?, labels=true }   parts are drawn at least 20% wide so labels fit; sub-rectangles show "a x b", never the product
//  fracstrip    { parts, shaded, compare?:{parts,shaded} }
//  fracshape    { shape:"circle"|"rect", parts, shaded }
//  clock        { h, m, numerals=true }               h 0..23, m 0..59
//  bar          { title, cats, values, scale=1, orient:"v"|"h", picture=false, unit="", axisLabel, + showValues=false }
//                 scale = value of one gridline (bar mode) or of one symbol (picture mode; half symbols allowed)
//  lineplot     { min, max, step, values, label, + mixed=true }   every value must sit on a tick
//  boxplot      { min, q1, median, q3, max, label, + showValues=false }
//  coord        { xmin, xmax, ymin, ymax, step=1, points:[{x,y,label}], lines:[{m,b}|{p1,p2}|{x}, +label], polys:[{pts:[{x,y,label}],label}], labelAxes:[x,y] }
//  tape         { rows:[{label, parts:[{label,value|"?",n=1}]}], total? }       total "?" is hidden
//  ratiotable   { headers, rows, hide:[[row,col]..] }  zero-based indexes into rows / columns
//  doublenl     { top:{label,values}, bottom:{label,values} }   null or "?" = unknown; ticks are equally spaced
//  table        { headers, rows, caption }
//  shape        { name, labels=false }
//  prism        { l, w, h, units=true, unit="cubes" }  units=true needs whole numbers <= 12; the volume is never printed
//  rect         { w, h, unit, showArea=false, showPerimeter=false, labels:["w","h"]|null }   labels replace the numbers on the sides
//  angle        { deg, label, protractor=false }      a label without digits (x, ?) is a hidden measure; protractor only up to 180
//  circle       { r, show:"radius"|"diameter"|"both", unit, + d }   r or d may be "?"
//  triangle     { a, b, c, right=true, labels:[..], + unit }  right: legs a (bottom) and b (left), hypotenuse c. "?" allowed
//  balance      { left:[token..], right:[token..] }   token = number or text such as "x"; tilts only when every token is a number
//  tiles        { x=0, one=0, negX=0, negOne=0 }      each count <= 12
//  scatter      { xmin, xmax, ymin, ymax, points:[{x,y}], line?:{m,b}, xLabel, yLabel }
//  spinner      { sections:[{label, weight}] }        2..12 sections
//  ruler        { unit:"cm"|"in", length, objectFrom=0, objectTo }   object ends must sit on a tick (mm or 1/16 in)
//  machine      { rule:"x + 3", input, output }       "?" allowed for each; a parseable rule is checked against input and output

const FONT = "Atkinson Hyperlegible, Arial, Helvetica, sans-serif";
const MINUS = "−";
const TIMES = "×";
const DIVIDE = "÷";

/** Lab palette plus light tints of it. The check tool reads this list to prove nothing else is used. */
export const PALETTE = {
  navy: "#17324D",
  teal: "#1FA6A2",
  amber: "#F2C15B",
  coral: "#E8765A",
  blue: "#2F6FB0",
  ink: "#24323F",
  paper: "#F7F4EC",
  white: "#FFFFFF",
  tealL: "#CFEDEB",
  tealM: "#7CC9C5",
  amberL: "#FBEBC0",
  amberM: "#F6D98C",
  coralL: "#F9D9CF",
  coralM: "#F0A795",
  blueL: "#D3E3F3",
  blueM: "#8DB4DA",
  navyL: "#E3E9EF",
  grid: "#C5CFD8",
  mute: "#5B6B79",
};
const P = PALETTE;

/* ---------------------------------------------------------------- errors */

let KIND = "";
function fail(msg) {
  throw new Error(`renderVisual(${KIND}): ${msg}`);
}
const show = (v) => (typeof v === "string" ? JSON.stringify(v) : String(v));
function int(v, name, min, max) {
  let n = v;
  if (typeof n === "string" && /^-?\d+$/.test(n.trim())) n = Number(n);
  if (!Number.isInteger(n)) fail(`${name} must be a whole number, got ${show(v)}`);
  if (min != null && n < min) fail(`${name} must be at least ${min}, got ${n}`);
  if (max != null && n > max) fail(`${name} must be at most ${max}, got ${n}`);
  return n;
}
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const sum = (xs) => xs.reduce((s, x) => s + x, 0);

/* ---------------------------------------------------------------- exact rationals and number text */

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};
class Q {
  constructor(n, d = 1) {
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) fail("a fraction has a zero denominator or is not finite");
    if (d < 0) [n, d] = [-n, -d];
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
    if (!Number.isSafeInteger(this.n) || !Number.isSafeInteger(this.d)) fail("a number is too large");
  }
  add(o) {
    return new Q(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  sub(o) {
    return new Q(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o) {
    return new Q(this.n * o.n, this.d * o.d);
  }
  div(o) {
    return new Q(this.n * o.d, this.d * o.n);
  }
  neg() {
    return new Q(-this.n, this.d);
  }
  cmp(o) {
    return Math.sign(this.n * o.d - o.n * this.d);
  }
  isInt() {
    return this.d === 1;
  }
  num() {
    return this.n / this.d;
  }
}
const Qi = (n) => new Q(n, 1);

function decToQ(s) {
  const m = /^(-?)(\d*)\.(\d+)$/.exec(s);
  return new Q(Number(`${m[1]}${m[2] || "0"}${m[3]}`), 10 ** m[3].length);
}
function qFromNumber(v) {
  if (Number.isInteger(v)) return Qi(v);
  const s = v.toFixed(9).replace(/0+$/, "").replace(/\.$/, "");
  return s.includes(".") ? decToQ(s) : Qi(Number(s));
}
const commas = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
/** A plain number as text: real minus, thousands comma from 4 digits, no exponent. */
function fmtNum(x) {
  let r = Math.round(x * 1e6) / 1e6;
  if (Object.is(r, -0)) r = 0;
  const [i, f] = Math.abs(r).toString().split(".");
  return (r < 0 ? MINUS : "") + commas(i) + (f ? `.${f}` : "");
}
/** A fraction as text; improper stays improper unless `mixed`. */
function fmtQ(q, mixed = false) {
  const n = Math.abs(q.n);
  let s;
  if (q.d === 1) s = commas(String(n));
  else if (mixed && n > q.d) s = `${Math.floor(n / q.d)} ${n % q.d}/${q.d}`;
  else s = `${n}/${q.d}`;
  return (q.n < 0 ? MINUS : "") + s;
}
/** A terminating decimal as text (falls back to a fraction when it does not terminate). */
function fmtDecQ(q) {
  let d = q.d;
  let twos = 0;
  let fives = 0;
  while (d % 2 === 0) {
    d /= 2;
    twos++;
  }
  while (d % 5 === 0) {
    d /= 5;
    fives++;
  }
  if (d !== 1) return fmtQ(q);
  const places = Math.max(twos, fives);
  const scaled = Math.round((Math.abs(q.n) * 10 ** places) / q.d);
  let s = String(scaled).padStart(places + 1, "0");
  if (places) s = `${s.slice(0, -places)}.${s.slice(-places)}`;
  const [i, f] = s.split(".");
  return (q.n < 0 ? MINUS : "") + commas(i) + (f ? `.${f}` : "");
}
const isDecSrc = (...vs) => vs.some((v) => (typeof v === "number" && !Number.isInteger(v)) || (typeof v === "string" && v.includes(".")));
const fmtSmart = (q, dec) => (dec ? fmtDecQ(q) : fmtQ(q));

/** A value given as a number or a string. Returns { q: exact rational, text: the text to display }. */
function val(v, name = "value") {
  if (typeof v === "number") {
    if (!Number.isFinite(v)) fail(`${name} must be a finite number`);
    return { q: qFromNumber(v), text: fmtNum(v) };
  }
  if (typeof v !== "string") fail(`${name} must be a number or a fraction string, got ${show(v)}`);
  const s = v.trim().replace(/−/g, "-").replace(/,/g, "");
  let m;
  let q;
  if ((m = /^(-?)(\d+)$/.exec(s))) q = Qi(Number(m[1] + m[2]));
  else if ((m = /^(-?)(\d+)\/(\d+)$/.exec(s))) {
    if (Number(m[3]) === 0) fail(`${name} has a zero denominator: ${show(v)}`);
    q = new Q(Number(m[1] + m[2]), Number(m[3]));
  } else if ((m = /^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(s))) {
    if (Number(m[4]) === 0) fail(`${name} has a zero denominator: ${show(v)}`);
    q = new Q(Number(m[2]) * Number(m[4]) + Number(m[3]), Number(m[4]));
    if (m[1]) q = q.neg();
  } else if ((m = /^(-?)(\d*)\.(\d+)$/.exec(s))) q = decToQ(s);
  else fail(`${name} must be a number or a fraction string such as "3/4", got ${show(v)}`);
  return { q, text: v.trim().replace(/^-/, MINUS) };
}
function tryVal(v) {
  try {
    return val(v);
  } catch {
    return null;
  }
}
const isHidden = (v) => v === "?" || v === null || v === undefined;

/** A "nice" axis step for a range (1, 2, 5 x 10^k) giving at most `maxTicks` steps. */
function niceStep(range, maxTicks) {
  const raw = range / maxTicks;
  const p = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5, 10]) if (m * p >= raw - 1e-12) return m * p;
  return 10 * p;
}
function niceMultiple(x) {
  for (let p = 1; ; p *= 10) for (const m of [1, 2, 5]) if (m * p >= x) return m * p;
}

const list = (xs) => (xs.length <= 1 ? xs.join("") : xs.length === 2 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------------------------------------------------------- svg primitives */

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const n2 = (n) => {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? "0" : String(r);
};
function el(tag, attrs, inner) {
  let s = `<${tag}`;
  for (const k of Object.keys(attrs)) {
    const v = attrs[k];
    if (v === undefined || v === null || v === false) continue;
    s += ` ${k}="${typeof v === "number" ? n2(v) : esc(v)}"`;
  }
  return inner === undefined ? `${s}/>` : `${s}>${inner}</${tag}>`;
}
const ST = { stroke: P.navy, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" };
const shapeStyle = (fill, o = {}) => ({ fill, ...ST, ...o });
const R = (x, y, w, h, o = {}) => el("rect", { x, y, width: w, height: h, ...o });
const L = (x1, y1, x2, y2, o = {}) => el("line", { x1, y1, x2, y2, ...ST, ...o });
const C = (cx, cy, r, o = {}) => el("circle", { cx, cy, r, ...o });
const PATH = (d, o = {}) => el("path", { d, ...o });
const POLY = (pts, o = {}) => el("polygon", { points: pts.map(([x, y]) => `${n2(x)},${n2(y)}`).join(" "), ...o });
const G = (inner, o = {}) => el("g", o, inner);
/** Text. (x, y) is the visual centre of the line; size is never below 12 units. */
function T(x, y, s, { size = 14, anchor = "middle", fill = P.ink, bold = false, rot = 0, halo = false } = {}) {
  const sz = Math.max(12, size);
  const at = { x, y: y + sz * 0.35, "font-size": sz, "text-anchor": anchor, fill, "font-weight": bold ? 700 : undefined };
  if (halo) Object.assign(at, { stroke: "#FFFFFF", "stroke-width": 4, "paint-order": "stroke", "stroke-linejoin": "round" });
  if (rot) at.transform = `rotate(${rot} ${n2(x)} ${n2(y)})`;
  return el("text", at, esc(s));
}
const tw = (s, size) => String(s).length * size * 0.6;

let DEFS = null;
/** A fill pattern (so meaning is never color alone). Returns a fill value; the pattern is registered for this render. */
function pat(name, bg, fg) {
  const key = `${name}-${bg.slice(1)}-${fg.slice(1)}`;
  const id = `__ID__-${key}`;
  if (!DEFS.has(key)) {
    const base = R(0, 0, 8, 8, { fill: bg });
    let inner;
    if (name === "diag") inner = base + L(0, 0, 0, 8, { stroke: fg, "stroke-width": 2.5 });
    else if (name === "dots") inner = base + C(4, 4, 1.8, { fill: fg });
    else if (name === "cross") inner = base + L(0, 4, 8, 4, { stroke: fg, "stroke-width": 1.5 }) + L(4, 0, 4, 8, { stroke: fg, "stroke-width": 1.5 });
    else inner = base + L(0, 4, 8, 4, { stroke: fg, "stroke-width": 2 });
    DEFS.set(key, el("pattern", { id, width: 8, height: 8, patternUnits: "userSpaceOnUse", patternTransform: name === "diag" ? "rotate(45)" : undefined }, inner));
  }
  return `url(#${id})`;
}

function hash36(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
function wrapSvg(W, H, body, alt, summary) {
  W = Math.round(W);
  H = Math.round(H);
  const id = `mlsv-${hash36(body + alt + summary + W + H)}`;
  const defs = DEFS.size ? `<defs>${[...DEFS.values()].join("")}</defs>` : "";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${id}-t ${id}-d" preserveAspectRatio="xMidYMid meet" font-family="${FONT}">` +
    `<title id="${id}-t">${esc(alt)}</title><desc id="${id}-d">${esc(summary)}</desc>${defs}` +
    `<rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>${body}</svg>`;
  return svg.replaceAll("__ID__", id);
}

/** An arrowhead whose tip is (x, y), pointing along (tx, ty). */
function arrowHead(x, y, tx, ty, size = 10, fill = P.navy) {
  const len = Math.hypot(tx, ty) || 1;
  const ux = tx / len;
  const uy = ty / len;
  const bx = x - ux * size;
  const by = y - uy * size;
  const px = -uy * size * 0.55;
  const py = ux * size * 0.55;
  return POLY([[x, y], [bx + px, by + py], [bx - px, by - py]], { fill, stroke: fill, "stroke-width": 1, "stroke-linejoin": "round" });
}
function wrapWords(s, maxChars, maxLines = 3) {
  const words = String(s).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (cur && `${cur} ${w}`.length > maxChars) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const rest = lines.splice(maxLines - 1).join(" ");
    lines.push(rest);
  }
  return lines;
}

/* ---------------------------------------------------------------- kinds */

const KINDS = {};

/* tenframe */
KINDS.tenframe = (a) => {
  const n = int(a.n, "n", 0);
  const frames = int(a.frames ?? 1, "frames", 1, 8);
  if (n > 10 * frames) fail(`n (${n}) is more than ${frames} ten frame${frames > 1 ? "s" : ""} can hold (${10 * frames})`);
  const cell = 40;
  const gap = 24;
  const pad = 14;
  const per = Math.min(frames, 2);
  const rows = Math.ceil(frames / per);
  const fw = cell * 5;
  const fh = cell * 2;
  const W = pad * 2 + per * fw + (per - 1) * gap;
  const H = pad * 2 + rows * fh + (rows - 1) * gap;
  let body = "";
  let left = n;
  const counts = [];
  for (let f = 0; f < frames; f++) {
    const x0 = pad + (f % per) * (fw + gap);
    const y0 = pad + Math.floor(f / per) * (fh + gap);
    const inFrame = Math.min(10, left);
    left -= inFrame;
    counts.push(inFrame);
    body += R(x0, y0, fw, fh, { fill: "#FFFFFF", stroke: P.navy, "stroke-width": 3 });
    for (let i = 1; i < 5; i++) body += L(x0 + i * cell, y0, x0 + i * cell, y0 + fh, { "stroke-width": 1.5 });
    body += L(x0, y0 + cell, x0 + fw, y0 + cell, { "stroke-width": 1.5 });
    for (let i = 0; i < inFrame; i++) {
      body += C(x0 + (i % 5) * cell + cell / 2, y0 + Math.floor(i / 5) * cell + cell / 2, 15, shapeStyle(P.teal));
    }
  }
  const dots = (c) => `${c} ${plural(c, "dot")}`;
  let summary;
  if (frames === 1) {
    const top = Math.min(n, 5);
    const bottom = Math.max(0, n - 5);
    const topT = top === 5 ? "the top row is full" : top === 0 ? "the top row is empty" : `the top row has ${dots(top)}`;
    const botT = bottom === 0 ? "the bottom row is empty" : bottom === 5 ? "the bottom row is full" : `the bottom row has ${dots(bottom)}`;
    summary = `A ten frame with ${dots(n)}: ${topT} and ${botT}.`;
  } else {
    summary = `${frames} ten frames with ${dots(n)} in all: ${list(counts.map((c, i) => `frame ${i + 1} has ${c === 10 ? "10 (full)" : c === 0 ? "none" : c}`))}.`;
  }
  return { W, H, body, alt: frames === 1 ? `Ten frame with ${dots(n)}` : `${frames} ten frames with ${dots(n)}`, summary };
};

/* counters */
KINDS.counters = (a) => {
  const n = int(a.n, "n", 0, 200);
  const perRow = int(a.perRow ?? 10, "perRow", 1, 20);
  const shape = a.shape ?? "circle";
  const names = { circle: "circles", square: "squares", triangle: "triangles", star: "stars" };
  if (!names[shape]) fail(`shape must be circle, square, triangle or star, got ${show(shape)}`);
  const gapEvery = 5;
  const gaps = Math.floor((perRow - 1) / gapEvery) * 10;
  const cell = Math.floor(clamp((440 - gaps) / perRow, 18, 36));
  const rows = Math.max(1, Math.ceil(n / perRow));
  const pad = 14;
  const W = pad * 2 + perRow * cell + gaps;
  const H = pad * 2 + rows * cell;
  let body = "";
  const half = cell * 0.4;
  const fills = { circle: P.teal, square: P.blueL, triangle: P.coralL, star: P.amber };
  for (let i = 0; i < n; i++) {
    const c = i % perRow;
    const r = Math.floor(i / perRow);
    const cx = pad + c * cell + Math.floor(c / gapEvery) * 10 + cell / 2;
    const cy = pad + r * cell + cell / 2;
    const sty = shapeStyle(fills[shape], { "stroke-width": 2 });
    if (shape === "circle") body += C(cx, cy, half, sty);
    else if (shape === "square") body += R(cx - half, cy - half, half * 2, half * 2, sty);
    else if (shape === "triangle") body += POLY([[cx, cy - half], [cx + half * 1.1, cy + half * 0.85], [cx - half * 1.1, cy + half * 0.85]], sty);
    else {
      const pts = [];
      for (let k = 0; k < 10; k++) {
        const rr = k % 2 === 0 ? half * 1.15 : half * 0.5;
        const ang = -Math.PI / 2 + (k * Math.PI) / 5;
        pts.push([cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)]);
      }
      body += POLY(pts, sty);
    }
  }
  const noun = n === 1 ? names[shape].slice(0, -1) : names[shape];
  let summary;
  if (n === 0) summary = "No counters are shown.";
  else if (n <= perRow) summary = `${n} ${noun} in one row.`;
  else {
    const full = Math.floor(n / perRow);
    const last = n % perRow;
    summary = `${n} ${noun} arranged in rows of ${perRow}: ${full} full ${plural(full, "row")} of ${perRow}${last ? ` and a last row of ${last}` : ""}.`;
  }
  return { W, H, body, alt: n === 0 ? "No counters" : `${n} ${noun} in rows`, summary };
};

/* bond */
KINDS.bond = (a) => {
  const hide = a.hide ?? null;
  if (![null, "whole", "a", "b"].includes(hide)) fail(`hide must be "whole", "a", "b" or null, got ${show(hide)}`);
  const parts = { whole: a.whole, a: a.a, b: a.b };
  const hid = {};
  const vv = {};
  for (const k of ["whole", "a", "b"]) {
    hid[k] = k === hide || parts[k] === "?";
    if (parts[k] === undefined || parts[k] === null) {
      if (!hid[k]) fail(`${k} is required`);
      hid[k] = true;
    } else if (parts[k] !== "?") vv[k] = val(parts[k], k);
  }
  if (vv.whole && vv.a && vv.b && vv.a.q.add(vv.b.q).cmp(vv.whole.q) !== 0) fail(`the parts ${vv.a.text} and ${vv.b.text} do not add up to the whole ${vv.whole.text}`);
  if (!hid.whole && !hid.a && !hid.b) {
    /* all shown: already checked */
  }
  const W = 360;
  const H = 250;
  const pos = { whole: [180, 62], a: [96, 186], b: [264, 186] };
  let body = L(180, 62, 96, 186, { "stroke-width": 3 }) + L(180, 62, 264, 186, { "stroke-width": 3 });
  for (const k of ["whole", "a", "b"]) {
    const [cx, cy] = pos[k];
    if (hid[k]) {
      body += C(cx, cy, 42, { fill: "#FFFFFF", stroke: P.navy, "stroke-width": 3, "stroke-dasharray": "8 6" });
      body += T(cx, cy, "?", { size: 32, bold: true, fill: P.mute });
    } else {
      body += C(cx, cy, 42, shapeStyle(k === "whole" ? P.amberL : P.tealL, { "stroke-width": 3 }));
      const t = vv[k].text;
      body += T(cx, cy, t, { size: t.length > 5 ? 20 : t.length > 3 ? 24 : 30, bold: true, fill: P.navy });
    }
  }
  const txt = (k) => (hid[k] ? "unknown" : vv[k].text);
  const summary = `A number bond. The whole is ${txt("whole")}. The two parts are ${txt("a")} and ${txt("b")}.`;
  return { W, H, body, alt: "Number bond with a whole and two parts", summary };
};

/* placevalue */
KINDS.placevalue = (a) => {
  const h = int(a.hundreds ?? 0, "hundreds", 0, 9);
  const t = int(a.tens ?? 0, "tens", 0, 20);
  const o = int(a.ones ?? 0, "ones", 0, 30);
  if (h + t + o === 0) fail("there are no blocks to show (hundreds, tens and ones are all 0)");
  const colW = [200, 200, 120];
  const W = 520;
  const top = 44;
  const hRows = Math.ceil(h / 3);
  const tRows = Math.ceil(t / 10);
  const oRows = Math.ceil(o / 5);
  const H = top + Math.max(hRows * 64, tRows * 64, oRows * 18, 64) + 20;
  let body = "";
  const heads = ["Hundreds", "Tens", "Ones"];
  let x = 0;
  colW.forEach((w, i) => {
    body += T(x + w / 2, 22, heads[i], { size: 15, bold: true, fill: P.navy });
    if (i > 0) body += L(x, 6, x, H - 6, { stroke: P.grid, "stroke-width": 1.5 });
    x += w;
  });
  for (let i = 0; i < h; i++) {
    const x0 = 22 + (i % 3) * 64;
    const y0 = top + Math.floor(i / 3) * 64;
    body += R(x0, y0, 56, 56, shapeStyle(P.tealL));
    for (let k = 1; k < 10; k++) {
      body += L(x0 + k * 5.6, y0, x0 + k * 5.6, y0 + 56, { stroke: P.tealM, "stroke-width": 0.8 });
      body += L(x0, y0 + k * 5.6, x0 + 56, y0 + k * 5.6, { stroke: P.tealM, "stroke-width": 0.8 });
    }
    body += R(x0, y0, 56, 56, { fill: "none", stroke: P.navy, "stroke-width": 2 });
  }
  for (let i = 0; i < t; i++) {
    const x0 = 220 + (i % 10) * 18;
    const y0 = top + Math.floor(i / 10) * 64;
    body += R(x0, y0, 12, 56, shapeStyle(P.blueL));
    for (let k = 1; k < 10; k++) body += L(x0, y0 + k * 5.6, x0 + 12, y0 + k * 5.6, { stroke: P.blueM, "stroke-width": 0.8 });
    body += R(x0, y0, 12, 56, { fill: "none", stroke: P.navy, "stroke-width": 2 });
  }
  for (let i = 0; i < o; i++) {
    body += R(430 + (i % 5) * 18, top + Math.floor(i / 5) * 18, 12, 12, shapeStyle(P.amber));
  }
  const total = h * 100 + t * 10 + o;
  const bits = [];
  if (h) bits.push(`${h} ${plural(h, "hundred")}`);
  if (t) bits.push(`${t} ${plural(t, "ten")}`);
  if (o) bits.push(`${o} ${plural(o, "one")}`);
  const summary = `Base-ten blocks: ${list(bits)}, which is ${commas(String(total))} in all. Flat squares are hundreds, long rods are tens and small cubes are ones.`;
  return { W, H, body, alt: `Base-ten blocks showing ${commas(String(total))}`, summary };
};

/* numberline */
KINDS.numberline = (a) => {
  const min = val(a.min, "min");
  const max = val(a.max, "max");
  if (min.q.cmp(max.q) >= 0) fail(`min (${min.text}) must be less than max (${max.text})`);
  const ticks = int(a.ticks, "ticks", 1, 120);
  const range = max.q.sub(min.q);
  const step = range.div(Qi(ticks));
  const marksIn = a.marks ?? [];
  const hopsIn = a.hops ?? [];
  if (!Array.isArray(marksIn) || !Array.isArray(hopsIn)) fail("marks and hops must be arrays");
  const dec = isDecSrc(a.min, a.max, ...marksIn.map((m) => m && m.at));
  let mode = a.show;
  if (mode == null) mode = step.isInt() && min.q.isInt() ? "int" : dec ? "dec" : "frac";
  if (!["int", "frac", "dec"].includes(mode)) fail(`show must be "int", "frac" or "dec", got ${show(mode)}`);
  const marks = marksIn.map((m, i) => {
    if (!m || m.at === undefined) fail(`marks[${i}] needs "at"`);
    const at = val(m.at, `marks[${i}].at`);
    if (at.q.cmp(min.q) < 0 || at.q.cmp(max.q) > 0) fail(`marks[${i}].at (${at.text}) is outside ${min.text} to ${max.text}`);
    const label = m.label === undefined || m.label === null || m.label === "" ? null : String(m.label);
    return { at, label, hidden: label === "?", hollow: !!m.hollow };
  });
  const hops = hopsIn.map((h, i) => {
    if (!h || h.from === undefined || h.to === undefined) fail(`hops[${i}] needs "from" and "to"`);
    const from = val(h.from, `hops[${i}].from`);
    const to = val(h.to, `hops[${i}].to`);
    for (const v of [from, to]) if (v.q.cmp(min.q) < 0 || v.q.cmp(max.q) > 0) fail(`hops[${i}] value ${v.text} is outside ${min.text} to ${max.text}`);
    if (from.q.cmp(to.q) === 0) fail(`hops[${i}] starts and ends at ${from.text}`);
    return { from, to, label: h.label === undefined || h.label === null ? "" : String(h.label) };
  });
  const labelTicks = a.labelTicks ?? (marks.some((m) => m.hidden) ? "ends" : "all");
  if (!["all", "ends", "none"].includes(labelTicks)) fail(`labelTicks must be "all", "ends" or "none", got ${show(labelTicks)}`);
  const mixed = !!a.mixed;
  const D = (() => {
    let x = step.d;
    const y = min.q.d;
    return (x * y) / gcd(x, y);
  })();
  const tickText = (q) => {
    if (mode === "int") return q.isInt() ? fmtQ(q) : null;
    if (mode === "dec") return fmtDecQ(q);
    if (a.reduce === false && !q.isInt()) return `${Math.abs(q.n) * (D / q.d)}/${D}`.replace(/^/, q.n < 0 ? MINUS : "");
    return fmtQ(q, mixed);
  };
  const W = 560;
  const x0 = 44;
  const L0 = 472;
  const sp = L0 / ticks;
  const hasHops = hops.length > 0;
  const markLabelsAbove = marks.some((m) => m.label) && !hasHops;
  const markLabelsBelow = marks.some((m) => m.label) && hasHops;
  const axisY = hasHops ? 104 : markLabelsAbove ? 74 : 44;
  const H = axisY + 46 + (markLabelsBelow ? 44 : 0) + 8;
  const xAt = (q) => x0 + (L0 * q.sub(min.q).num()) / range.num();
  const texts = [];
  for (let i = 0; i <= ticks; i++) texts.push(tickText(min.q.add(step.mul(Qi(i)))));
  let k = 1;
  if (labelTicks === "all") {
    const wmax = Math.max(...texts.map((t) => (t ? t.length : 0))) * 8.6 + 12;
    k = Math.max(1, Math.ceil(wmax / sp));
    while (k < ticks && ticks % k !== 0) k++;
  }
  let body = L(x0, axisY, x0 + L0, axisY, { "stroke-width": 3 });
  for (let i = 0; i <= ticks; i++) {
    const x = x0 + i * sp;
    const labelled = labelTicks === "all" ? i % k === 0 && texts[i] : labelTicks === "ends" ? (i === 0 || i === ticks) && texts[i] : false;
    const major = i === 0 || i === ticks || (labelTicks === "all" && i % k === 0);
    body += L(x, axisY - (major ? 9 : 5), x, axisY + (major ? 9 : 5), { "stroke-width": major ? 3 : 2 });
    if (labelled) body += T(x, axisY + 28, texts[i], { size: 15, bold: true, fill: P.navy });
  }
  for (const h of hops) {
    const xa = xAt(h.from.q);
    const xb = xAt(h.to.q);
    const yb = axisY - 8;
    const ph = 34;
    const xm = (xa + xb) / 2;
    body += PATH(`M ${n2(xa)} ${yb} Q ${n2(xm)} ${yb - 2 * ph} ${n2(xb)} ${yb}`, { fill: "none", stroke: P.blue, "stroke-width": 3, "stroke-linecap": "round" });
    body += arrowHead(xb, yb, xb - xm, 2 * ph, 10, P.blue);
    if (h.label) body += T(xm, yb - ph - 12, h.label, { size: 16, bold: true, fill: P.blue, halo: true });
  }
  for (const m of marks) {
    const x = xAt(m.at.q);
    body += C(x, axisY, 8, m.hollow ? shapeStyle("#FFFFFF", { "stroke-width": 3.5 }) : shapeStyle(P.coral, { "stroke-width": 2.5 }));
    if (m.label) {
      const wlab = Math.max(30, tw(m.label, 16) + 14);
      if (markLabelsBelow) {
        const ly = axisY + 66;
        body += POLY([[x, axisY + 42], [x - 6, axisY + 51], [x + 6, axisY + 51]], { fill: P.navy, stroke: P.navy, "stroke-width": 1 });
        body += R(x - wlab / 2, ly - 14, wlab, 28, shapeStyle("#FFFFFF", { rx: 6, "stroke-width": 2 }));
        body += T(x, ly, m.label, { size: 16, bold: true, fill: P.navy });
      } else {
        const ly = axisY - 30;
        body += L(x, axisY - 10, x, ly + 13, { "stroke-width": 1.5 });
        body += R(x - wlab / 2, ly - 14, wlab, 28, shapeStyle("#FFFFFF", { rx: 6, "stroke-width": 2 }));
        body += T(x, ly, m.label, { size: 16, bold: true, fill: P.navy });
      }
    }
  }
  const parts = [`A number line from ${min.text} to ${max.text} divided into ${ticks} equal ${plural(ticks, "part")}`];
  if (labelTicks === "ends") parts[0] += ", with only the end numbers labelled";
  else if (labelTicks === "none") parts[0] += ", with no numbers labelled";
  parts[0] += ".";
  const mk = marks.map((m) => {
    if (m.hidden) return `a ${m.hollow ? "open circle" : "point"} marked with a question mark whose value is unknown`;
    const what = m.hollow ? "an open circle" : "a point";
    return m.label && m.label !== m.at.text ? `${what} labelled ${m.label} at ${m.at.text}` : `${what} at ${m.at.text}`;
  });
  if (mk.length) parts.push(`It shows ${list(mk)}.`);
  const hiddenAt = marks.filter((m) => m.hidden).map((m) => m.at.q);
  const endText = (v) => (hiddenAt.some((q) => q.cmp(v.q) === 0) ? "the point marked with a question mark" : v.text);
  const hp = hops.map((h) => `a hop from ${endText(h.from)} to ${endText(h.to)}${h.label ? ` labelled ${h.label}` : ""}`);
  if (hp.length) parts.push(`It also shows ${list(hp)}.`);
  const alt = `Number line from ${min.text} to ${max.text}${marks.length ? " with marked points" : ""}${hops.length ? " and hops" : ""}`;
  return { W, H, body, alt, summary: parts.join(" ") };
};

/* array */
KINDS.array = (a) => {
  const rows = int(a.rows, "rows", 1, 15);
  const cols = int(a.cols, "cols", 1, 20);
  const label = a.label !== false;
  let sh = null;
  if (a.shade) {
    sh = { rows: int(a.shade.rows, "shade.rows", 1, rows), cols: int(a.shade.cols, "shade.cols", 1, cols) };
  }
  const cell = Math.floor(clamp(Math.min(400 / cols, 320 / rows), 16, 40));
  const ml = 20;
  const mt = label ? 44 : 16;
  const W = ml + cols * cell + 16 + (label ? 96 : 0);
  const H = mt + rows * cell + 16;
  let body = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = ml + c * cell + cell / 2;
      const cy = mt + r * cell + cell / 2;
      const shaded = sh && r < sh.rows && c < sh.cols;
      if (!sh) body += C(cx, cy, cell * 0.36, shapeStyle(P.teal));
      else if (shaded) body += C(cx, cy, cell * 0.36, shapeStyle(P.amber, { "stroke-width": 2.5 }));
      else body += C(cx, cy, cell * 0.36, shapeStyle("#FFFFFF", { stroke: P.teal, "stroke-width": 2 }));
    }
  }
  if (sh) body += R(ml + 2, mt + 2, sh.cols * cell - 4, sh.rows * cell - 4, { fill: "none", stroke: P.navy, "stroke-width": 2.5, "stroke-dasharray": "7 5", rx: 6 });
  if (label) {
    const x1 = ml + 4;
    const x2 = ml + cols * cell - 4;
    body += PATH(`M ${x1} ${mt - 8} V ${mt - 14} H ${x2} V ${mt - 8}`, { fill: "none", stroke: P.navy, "stroke-width": 2 });
    body += T((x1 + x2) / 2, mt - 28, `${cols} ${plural(cols, "column")}`, { size: 15, bold: true, fill: P.navy });
    const bx = ml + cols * cell + 8;
    const y1 = mt + 4;
    const y2 = mt + rows * cell - 4;
    body += PATH(`M ${bx} ${y1} H ${bx + 6} V ${y2} H ${bx}`, { fill: "none", stroke: P.navy, "stroke-width": 2 });
    body += T(bx + 14, (y1 + y2) / 2, `${rows} ${plural(rows, "row")}`, { size: 15, bold: true, fill: P.navy, anchor: "start" });
  }
  let summary = `An array of dots with ${rows} ${plural(rows, "row")} and ${cols} ${plural(cols, "column")}.`;
  if (sh) summary += ` The top-left part, ${sh.rows} ${plural(sh.rows, "row")} by ${sh.cols} ${plural(sh.cols, "column")}, is shaded.`;
  return { W, H, body, alt: `Array with ${rows} rows and ${cols} columns`, summary };
};

/* areamodel */
KINDS.areamodel = (a) => {
  const w = val(a.w, "w");
  const h = val(a.h, "h");
  if (w.q.n <= 0 || h.q.n <= 0) fail("w and h must be positive");
  const dec = isDecSrc(a.w, a.h, a.cutW, a.cutH);
  const cutW = a.cutW == null ? null : val(a.cutW, "cutW");
  const cutH = a.cutH == null ? null : val(a.cutH, "cutH");
  if (cutW && (cutW.q.n <= 0 || cutW.q.cmp(w.q) >= 0)) fail(`cutW (${cutW.text}) must be between 0 and w (${w.text})`);
  if (cutH && (cutH.q.n <= 0 || cutH.q.cmp(h.q) >= 0)) fail(`cutH (${cutH.text}) must be between 0 and h (${h.text})`);
  const labels = a.labels !== false;
  const aspect = clamp(w.q.num() / h.q.num(), 0.5, 2.2);
  let pw = 380;
  let ph = pw / aspect;
  if (ph > 230) {
    ph = 230;
    pw = ph * aspect;
  }
  const wParts = cutW ? [cutW.q, w.q.sub(cutW.q)] : [w.q];
  const hParts = cutH ? [cutH.q, h.q.sub(cutH.q)] : [h.q];
  const frac = (parts, total) => {
    if (parts.length === 1) return [1];
    const f = clamp(parts[0].div(total).num(), 0.2, 0.8);
    return [f, 1 - f];
  };
  const wf = frac(wParts, w.q);
  const hf = frac(hParts, h.q);
  const fmt = (q) => fmtSmart(q, dec);
  const labW = tw(fmt(h.q), 17);
  const ml = Math.max(76, labels ? (cutH ? 66 + labW : 22 + labW) : 76);
  const mt = labels ? (cutW ? 62 : 38) : 16;
  const W = ml + pw + 24;
  const H = mt + ph + 20;
  let body = "";
  const fills = [P.tealL, P.amberL, P.blueL, P.coralL];
  let yy = mt;
  hParts.forEach((hp, ri) => {
    let xx = ml;
    wParts.forEach((wp, ci) => {
      const rw = pw * wf[ci];
      const rh = ph * hf[ri];
      body += R(xx, yy, rw, rh, shapeStyle(fills[(ri * 2 + ci) % 4], { "stroke-width": 2.5 }));
      body += T(xx + rw / 2, yy + rh / 2, `${fmt(wp)} ${TIMES} ${fmt(hp)}`, { size: 16, bold: true, fill: P.navy });
      xx += rw;
    });
    yy += ph * hf[ri];
  });
  if (labels) {
    let xx = ml;
    wParts.forEach((wp, ci) => {
      const rw = pw * wf[ci];
      if (cutW) body += T(xx + rw / 2, mt - 14, fmt(wp), { size: 16, bold: true, fill: P.navy });
      xx += rw;
    });
    const topY = cutW ? mt - 34 : mt - 14;
    if (cutW) body += PATH(`M ${ml} ${mt - 28} V ${mt - 33} H ${ml + pw} V ${mt - 28}`, { fill: "none", stroke: P.navy, "stroke-width": 1.5 });
    body += T(ml + pw / 2, topY - (cutW ? 12 : 0) + (cutW ? 0 : 0), fmt(w.q), { size: 17, bold: true, fill: P.navy });
    let y2 = mt;
    hParts.forEach((hp, ri) => {
      const rh = ph * hf[ri];
      if (cutH) body += T(ml - 12, y2 + rh / 2, fmt(hp), { size: 16, bold: true, fill: P.navy, anchor: "end" });
      y2 += rh;
    });
    if (cutH) {
      body += PATH(`M ${ml - 38} ${mt} H ${ml - 44} V ${mt + ph} H ${ml - 38}`, { fill: "none", stroke: P.navy, "stroke-width": 1.5 });
      body += T(ml - 54, mt + ph / 2, fmt(h.q), { size: 17, bold: true, fill: P.navy, anchor: "end" });
    } else body += T(ml - 12, mt + ph / 2, fmt(h.q), { size: 17, bold: true, fill: P.navy, anchor: "end" });
  }
  const regions = [];
  hParts.forEach((hp) => wParts.forEach((wp) => regions.push(`${fmt(wp)} ${TIMES} ${fmt(hp)}`)));
  let summary = `An area model: a rectangle ${fmt(w.q)} wide and ${fmt(h.q)} tall`;
  const splits = [];
  if (cutW) splits.push(`the width is split into ${fmt(wParts[0])} and ${fmt(wParts[1])}`);
  if (cutH) splits.push(`the height is split into ${fmt(hParts[0])} and ${fmt(hParts[1])}`);
  summary += splits.length ? `, where ${list(splits)}` : "";
  summary += regions.length > 1 ? `. Its ${regions.length} parts are ${list(regions)}.` : `. The rectangle is labelled ${regions[0]}.`;
  return { W, H, body, alt: `Area model of a ${fmt(w.q)} by ${fmt(h.q)} rectangle${regions.length > 1 ? " split into parts" : ""}`, summary };
};

/* fracstrip */
KINDS.fracstrip = (a) => {
  const spec = (s, name) => {
    const parts = int(s.parts, `${name}parts`, 1, 24);
    const shaded = int(s.shaded, `${name}shaded`, 0);
    if (shaded > parts) fail(`${name}shaded (${shaded}) is more than parts (${parts})`);
    return { parts, shaded };
  };
  const s1 = spec(a, "");
  const s2 = a.compare ? spec(a.compare, "compare.") : null;
  const strips = s2 ? [s1, s2] : [s1];
  const ml = s2 ? 84 : 30;
  const sw = 440;
  const sh = 60;
  const W = ml + sw + 30;
  const H = 30 + strips.length * sh + (strips.length - 1) * 34;
  let body = "";
  strips.forEach((s, i) => {
    const y0 = 16 + i * (sh + 34);
    const pw = sw / s.parts;
    for (let p = 0; p < s.parts; p++) body += R(ml + p * pw, y0, pw, sh, shapeStyle(p < s.shaded ? P.teal : "#FFFFFF", { "stroke-width": 2.5 }));
    body += R(ml, y0, sw, sh, { fill: "none", stroke: P.navy, "stroke-width": 3.5 });
    if (s2) body += T(ml - 12, y0 + sh / 2, `Strip ${i ? "B" : "A"}`, { size: 16, bold: true, fill: P.navy, anchor: "end" });
  });
  const desc = (s) => `divided into ${s.parts} equal ${plural(s.parts, "part")} with ${s.shaded} shaded`;
  const summary = s2 ? `Two fraction strips of the same length. Strip A is ${desc(s1)}. Strip B is ${desc(s2)}.` : `A fraction strip ${desc(s1)}.`;
  return { W, H, body, alt: s2 ? "Two fraction strips to compare" : `Fraction strip with ${s1.shaded} of ${s1.parts} parts shaded`, summary };
};

/* fracshape */
KINDS.fracshape = (a) => {
  const shape = a.shape ?? "circle";
  if (!["circle", "rect"].includes(shape)) fail(`shape must be "circle" or "rect", got ${show(shape)}`);
  const parts = int(a.parts, "parts", 1, shape === "circle" ? 16 : 24);
  const shaded = int(a.shaded, "shaded", 0);
  if (shaded > parts) fail(`shaded (${shaded}) is more than parts (${parts})`);
  let body = "";
  let W;
  let H;
  if (shape === "circle") {
    const cx = 130;
    const cy = 130;
    const r = 106;
    W = 260;
    H = 260;
    const pt = (deg) => [cx + r * Math.cos(((deg - 90) * Math.PI) / 180), cy + r * Math.sin(((deg - 90) * Math.PI) / 180)];
    if (parts === 1) body += C(cx, cy, r, shapeStyle(shaded ? P.teal : "#FFFFFF", { "stroke-width": 3.5 }));
    else {
      const ang = 360 / parts;
      for (let i = 0; i < parts; i++) {
        const [x1, y1] = pt(i * ang);
        const [x2, y2] = pt((i + 1) * ang);
        body += PATH(`M ${cx} ${cy} L ${n2(x1)} ${n2(y1)} A ${r} ${r} 0 ${ang > 180 ? 1 : 0} 1 ${n2(x2)} ${n2(y2)} Z`, shapeStyle(i < shaded ? P.teal : "#FFFFFF", { "stroke-width": 2.5 }));
      }
      body += C(cx, cy, r, { fill: "none", stroke: P.navy, "stroke-width": 3.5 });
    }
  } else {
    const rw = 400;
    const rh = 130;
    W = rw + 40;
    H = rh + 40;
    const pw = rw / parts;
    for (let i = 0; i < parts; i++) body += R(20 + i * pw, 20, pw, rh, shapeStyle(i < shaded ? P.teal : "#FFFFFF", { "stroke-width": 2.5 }));
    body += R(20, 20, rw, rh, { fill: "none", stroke: P.navy, "stroke-width": 3.5 });
  }
  const noun = shape === "circle" ? "circle" : "rectangle";
  return { W, H, body, alt: `${cap(noun)} with ${shaded} of ${parts} equal parts shaded`, summary: `A ${noun} divided into ${parts} equal ${plural(parts, "part")} with ${shaded} shaded.` };
};

/* clock */
KINDS.clock = (a) => {
  const h = int(a.h, "h", 0, 23);
  const m = int(a.m, "m", 0, 59);
  const numerals = a.numerals !== false;
  const W = 300;
  const H = 300;
  const cx = 150;
  const cy = 150;
  const r = 124;
  let body = C(cx, cy, r, { fill: "#FFFFFF", stroke: P.navy, "stroke-width": 6 });
  for (let i = 0; i < 60; i++) {
    const ang = (i * 6 * Math.PI) / 180;
    const big = i % 5 === 0;
    const r1 = r - 4;
    const r2 = r - (big ? 17 : 10);
    body += L(cx + r1 * Math.sin(ang), cy - r1 * Math.cos(ang), cx + r2 * Math.sin(ang), cy - r2 * Math.cos(ang), { "stroke-width": big ? 3.5 : 1.5 });
  }
  if (numerals) {
    for (let i = 1; i <= 12; i++) {
      const ang = (i * 30 * Math.PI) / 180;
      body += T(cx + 92 * Math.sin(ang), cy - 92 * Math.cos(ang), String(i), { size: 22, bold: true, fill: P.navy });
    }
  }
  const hand = (deg, len, wid, fill) => {
    const ang = (deg * Math.PI) / 180;
    const ux = Math.sin(ang);
    const uy = -Math.cos(ang);
    const px = Math.cos(ang);
    const py = Math.sin(ang);
    const pts = [
      [cx - 16 * ux, cy - 16 * uy],
      [cx + wid * px, cy + wid * py],
      [cx + len * ux, cy + len * uy],
      [cx - wid * px, cy - wid * py],
    ];
    return POLY(pts, shapeStyle(fill, { "stroke-width": 2 }));
  };
  const hourDeg = ((h % 12) + m / 60) * 30;
  body += hand(hourDeg, 62, 7, P.navy);
  body += hand(m * 6, 100, 4.5, P.blue);
  body += C(cx, cy, 8, shapeStyle(P.navy));
  const hh = h % 12 === 0 ? 12 : h % 12;
  const time = `${hh}:${String(m).padStart(2, "0")}`;
  const next = hh === 12 ? 1 : hh + 1;
  let hourWhere;
  if (m === 0) hourWhere = `points straight at the ${hh}`;
  else if (m < 15) hourWhere = `points just past the ${hh}`;
  else if (m < 45) hourWhere = `points between the ${hh} and the ${next}`;
  else hourWhere = `points almost at the ${next}`;
  const minWhere = m % 5 === 0 ? `points at the ${m / 5 === 0 ? 12 : m / 5}` : `points ${m} minutes past the hour, between the ${Math.floor(m / 5) === 0 ? 12 : Math.floor(m / 5)} and the ${Math.floor(m / 5) + 1}`;
  const summary = `An analog clock showing ${time}. The short hour hand ${hourWhere}; the long minute hand ${minWhere}.${numerals ? "" : " The clock face has tick marks but no numbers."}`;
  return { W, H, body, alt: `Analog clock showing ${time}`, summary };
};

/* bar (bar graph and picture graph) */
KINDS.bar = (a) => {
  if (!Array.isArray(a.cats) || !Array.isArray(a.values)) fail("cats and values must be arrays");
  const cats = a.cats.map(String);
  const vals = a.values.map((v, i) => val(v, `values[${i}]`));
  const n = cats.length;
  if (!n || n !== vals.length) fail("cats and values must have the same non-zero length");
  if (n > 12) fail("at most 12 categories");
  if (vals.some((v) => v.q.n < 0)) fail("values must not be negative");
  const nums = vals.map((v) => v.q.num());
  const scaleQ = a.scale == null ? Qi(1) : val(a.scale, "scale").q;
  if (scaleQ.n <= 0) fail("scale must be positive");
  const scale = scaleQ.num();
  const orient = a.orient ?? "v";
  if (!["v", "h"].includes(orient)) fail(`orient must be "v" or "h", got ${show(orient)}`);
  const picture = !!a.picture;
  const unit = a.unit ? String(a.unit) : "";
  const title = a.title ? String(a.title) : "";
  const axisLabel = a.axisLabel ? String(a.axisLabel) : "";
  const showValues = !!a.showValues;
  const dec = isDecSrc(a.scale, ...a.values);
  const maxV = Math.max(...nums);
  const titleH = title ? 34 : 0;
  let body = "";
  let W;
  let H;
  const slot = clamp(Math.floor(440 / n), 46, 92);
  const maxLen = Math.max(...cats.map((c) => c.length));
  if (picture) {
    for (const v of vals) if (!v.q.div(scaleQ).mul(Qi(2)).isInt()) fail(`value ${v.text} is not a whole or half number of symbols of ${fmtSmart(scaleQ, dec)}`);
    const syms = nums.map((x) => x / scale);
    const maxSyms = Math.max(1, Math.ceil(Math.max(...syms)));
    if (maxSyms > 30) fail("a picture graph can show at most 30 symbols per category");
    const sym = (cx, cy, sz, half) => {
      const r = sz / 2 - 2;
      if (!half) return C(cx, cy, r, shapeStyle(P.teal, { "stroke-width": 2 }));
      return PATH(`M ${n2(cx)} ${n2(cy - r)} A ${r} ${r} 0 0 0 ${n2(cx)} ${n2(cy + r)} Z`, shapeStyle(P.teal, { "stroke-width": 2 })) + C(cx, cy, r, { fill: "none", stroke: P.navy, "stroke-width": 2, "stroke-dasharray": "4 3" });
    };
    const keyY = (h) => h - 22;
    const keyText = `Key: each = ${fmtSmart(scaleQ, dec)}${unit ? ` ${unit}` : ""}`;
    if (orient === "v") {
      const sz = clamp(Math.floor(slot * 0.72), 20, 30);
      const plotH = maxSyms * (sz + 4) + 14;
      const lines = cats.map((c) => wrapWords(c, Math.floor(slot / 7.6)));
      const maxLines = Math.max(...lines.map((l) => l.length));
      const ml = 30;
      const mt = 16 + titleH;
      W = Math.max(300, ml + slot * n + 24);
      H = mt + plotH + 14 + maxLines * 18 + 52;
      if (title) body += T(W / 2, 22, title, { size: 19, bold: true, fill: P.navy });
      body += L(ml, mt + plotH, ml + slot * n, mt + plotH, { "stroke-width": 3 });
      cats.forEach((c, i) => {
        const cx = ml + i * slot + slot / 2;
        const full = Math.floor(syms[i]);
        for (let k = 0; k < full; k++) body += sym(cx, mt + plotH - (k + 0.5) * (sz + 4) - 2, sz + 4, false);
        if (syms[i] > full) body += sym(cx, mt + plotH - (full + 0.5) * (sz + 4) - 2, sz + 4, true);
        lines[i].forEach((ln, li) => {
          body += T(cx, mt + plotH + 18 + li * 18, ln, { size: 14, bold: true, fill: P.navy });
        });
        if (showValues) body += T(cx, mt + plotH - (syms[i] + 0.5) * (sz + 4) - 4, vals[i].text, { size: 14, bold: true });
      });
      body += sym(ml + 12, keyY(H) - 2, 26, false);
      body += T(ml + 30, keyY(H) - 2, keyText.replace("each = ", "each symbol = "), { size: 14, anchor: "start", fill: P.navy });
    } else {
      const labW = clamp(maxLen * 8 + 16, 54, 160);
      const sz = clamp(Math.floor(380 / maxSyms), 16, 30);
      const rowH = Math.max(sz + 10, 34);
      const mt = 14 + titleH;
      W = labW + 20 + maxSyms * sz + 40;
      W = Math.max(W, 320);
      H = mt + n * rowH + 56;
      if (title) body += T(W / 2, 22, title, { size: 19, bold: true, fill: P.navy });
      body += L(labW + 10, mt, labW + 10, mt + n * rowH, { "stroke-width": 3 });
      cats.forEach((c, i) => {
        const cy = mt + i * rowH + rowH / 2;
        body += T(labW, cy, c, { size: 14, bold: true, fill: P.navy, anchor: "end" });
        const full = Math.floor(syms[i]);
        for (let k = 0; k < full; k++) body += sym(labW + 10 + (k + 0.5) * sz + 4, cy, sz, false);
        if (syms[i] > full) body += sym(labW + 10 + (full + 0.5) * sz + 4, cy, sz, true);
        if (showValues) body += T(labW + 10 + (syms[i] + 0.6) * sz + 8, cy, vals[i].text, { size: 14, bold: true, anchor: "start" });
      });
      body += sym(labW - 4, H - 24, 26, false);
      body += T(labW + 14, H - 24, keyText.replace("each = ", "each symbol = "), { size: 14, anchor: "start", fill: P.navy });
    }
  } else {
    const steps0 = Math.max(1, Math.ceil(maxV / scale - 1e-9));
    let gq = scaleQ;
    let steps = steps0;
    if (steps0 > 12) {
      gq = scaleQ.mul(Qi(niceMultiple(steps0 / 10)));
      steps = Math.max(1, Math.ceil(maxV / gq.num() - 1e-9));
    }
    const axisMax = gq.mul(Qi(steps)).num();
    const gtext = (i) => fmtSmart(gq.mul(Qi(i)), dec);
    const tickLab = (i) => steps <= 14 || i % 2 === 0;
    if (orient === "v") {
      const plotH = 250;
      const lines = cats.map((c) => wrapWords(c, Math.floor(slot / 7.4)));
      const maxLines = Math.max(...lines.map((l) => l.length));
      const mt = 20 + titleH;
      const ml = axisLabel ? 82 : 66;
      const plotW = slot * n;
      W = Math.max(320, ml + plotW + 20);
      H = mt + plotH + 14 + maxLines * 18 + 14;
      if (title) body += T(W / 2, 22, title, { size: 19, bold: true, fill: P.navy });
      const yOf = (v) => mt + plotH - (v / axisMax) * plotH;
      for (let i = 0; i <= steps; i++) {
        const y = yOf(gq.mul(Qi(i)).num());
        body += L(ml, y, ml + plotW, y, { stroke: P.grid, "stroke-width": i === 0 ? 0 : 1.25 });
        if (tickLab(i)) body += T(ml - 8, y, gtext(i), { size: 13, anchor: "end", fill: P.navy });
      }
      body += L(ml, mt, ml, mt + plotH, { "stroke-width": 3 });
      body += L(ml, mt + plotH, ml + plotW, mt + plotH, { "stroke-width": 3 });
      if (axisLabel) body += T(18, mt + plotH / 2, axisLabel, { size: 14, bold: true, fill: P.navy, rot: -90 });
      const bw = slot * 0.6;
      cats.forEach((c, i) => {
        const cx = ml + i * slot + slot / 2;
        const top = yOf(nums[i]);
        if (nums[i] > 0) body += R(cx - bw / 2, top, bw, mt + plotH - top, shapeStyle(P.teal, { "stroke-width": 2.5 }));
        if (showValues) body += T(cx, top - 12, vals[i].text, { size: 14, bold: true });
        lines[i].forEach((ln, li) => {
          body += T(cx, mt + plotH + 20 + li * 18, ln, { size: 14, bold: true, fill: P.navy });
        });
      });
    } else {
      const labW = clamp(maxLen * 8 + 16, 54, 160);
      const rowH = clamp(Math.floor(250 / n), 30, 54);
      const plotH = n * rowH;
      const plotW = 340;
      const mt = 18 + titleH;
      const ml = labW + 14;
      W = ml + plotW + 36;
      H = mt + plotH + 34 + (axisLabel ? 28 : 6);
      if (title) body += T(W / 2, 22, title, { size: 19, bold: true, fill: P.navy });
      const xOf = (v) => ml + (v / axisMax) * plotW;
      for (let i = 0; i <= steps; i++) {
        const x = xOf(gq.mul(Qi(i)).num());
        body += L(x, mt, x, mt + plotH, { stroke: P.grid, "stroke-width": i === 0 ? 0 : 1.25 });
        if (tickLab(i)) body += T(x, mt + plotH + 18, gtext(i), { size: 13, fill: P.navy });
      }
      body += L(ml, mt, ml, mt + plotH, { "stroke-width": 3 });
      body += L(ml, mt + plotH, ml + plotW, mt + plotH, { "stroke-width": 3 });
      if (axisLabel) body += T(ml + plotW / 2, mt + plotH + 44, axisLabel, { size: 14, bold: true, fill: P.navy });
      cats.forEach((c, i) => {
        const cy = mt + i * rowH + rowH / 2;
        const right = xOf(nums[i]);
        const bh = rowH * 0.62;
        if (nums[i] > 0) body += R(ml, cy - bh / 2, right - ml, bh, shapeStyle(P.teal, { "stroke-width": 2.5 }));
        if (showValues) body += T(right + 8, cy, vals[i].text, { size: 14, bold: true, anchor: "start" });
        body += T(ml - 10, cy, c, { size: 14, bold: true, fill: P.navy, anchor: "end" });
      });
    }
  }
  const data = cats.map((c, i) => `${c} ${vals[i].text}`);
  let summary = `${picture ? "A picture graph" : "A bar graph"}${title ? ` titled ${title}` : ""}: ${data.join(", ")}.`;
  if (picture) summary += ` Each symbol stands for ${fmtSmart(scaleQ, dec)}${unit ? ` ${unit}` : ""}, and a half symbol stands for half of that.`;
  else {
    const stepTxt = (() => {
      const steps0 = Math.max(1, Math.ceil(maxV / scale - 1e-9));
      const g = steps0 > 12 ? scaleQ.mul(Qi(niceMultiple(steps0 / 10))) : scaleQ;
      return fmtSmart(g, dec);
    })();
    summary += ` The ${orient === "v" ? "vertical" : "horizontal"} axis${axisLabel ? ` is labelled ${axisLabel} and` : ""} goes up in steps of ${stepTxt}.`;
  }
  if (unit && !picture) summary += ` Values are in ${unit}.`;
  return { W, H, body, alt: `${picture ? "Picture graph" : "Bar graph"}${title ? ` titled ${title}` : ""} with ${n} categories`, summary };
};

/* lineplot */
KINDS.lineplot = (a) => {
  const min = val(a.min, "min");
  const max = val(a.max, "max");
  const step = val(a.step, "step");
  if (step.q.n <= 0) fail("step must be positive");
  if (min.q.cmp(max.q) >= 0) fail("min must be less than max");
  const nq = max.q.sub(min.q).div(step.q);
  if (!nq.isInt() || nq.n < 1 || nq.n > 60) fail(`(max - min) / step must be a whole number from 1 to 60, got ${fmtQ(nq)}`);
  const N = nq.n;
  if (!Array.isArray(a.values) || !a.values.length) fail("values must be a non-empty array");
  const dec = isDecSrc(a.min, a.max, a.step);
  const mixed = a.mixed !== false;
  const counts = new Array(N + 1).fill(0);
  a.values.forEach((v, i) => {
    const q = val(v, `values[${i}]`).q;
    const kq = q.sub(min.q).div(step.q);
    if (!kq.isInt() || kq.n < 0 || kq.n > N) fail(`values[${i}] (${show(v)}) is not on a tick between ${min.text} and ${max.text}`);
    counts[kq.n]++;
  });
  const label = a.label ? String(a.label) : "";
  const tickQ = (i) => min.q.add(step.q.mul(Qi(i)));
  const tickT = (i) => (dec ? fmtDecQ(tickQ(i)) : fmtQ(tickQ(i), mixed));
  const W = 560;
  const x0 = 44;
  const L0 = 472;
  const sp = L0 / N;
  const maxStack = Math.max(...counts);
  const vsp = clamp(250 / maxStack, 14, 26);
  const half = Math.min(9, sp * 0.32, vsp * 0.38);
  const axisY = 22 + maxStack * vsp + 14;
  const H = axisY + 54 + (label ? 32 : 0);
  let body = L(x0, axisY, x0 + L0, axisY, { "stroke-width": 3 });
  const wmax = Math.max(...Array.from({ length: N + 1 }, (_, i) => tickT(i).length)) * 8.6 + 12;
  let k = Math.max(1, Math.ceil(wmax / sp));
  while (k < N && N % k !== 0) k++;
  for (let i = 0; i <= N; i++) {
    const x = x0 + i * sp;
    const major = i % k === 0;
    body += L(x, axisY - 7, x, axisY + (major ? 9 : 6), { "stroke-width": major ? 3 : 2 });
    if (major) body += T(x, axisY + 28, tickT(i), { size: 15, bold: true, fill: P.navy });
    for (let j = 0; j < counts[i]; j++) {
      const cy = axisY - 6 - vsp * (j + 0.5) - 2;
      body += L(x - half, cy - half, x + half, cy + half, { "stroke-width": 3 });
      body += L(x - half, cy + half, x + half, cy - half, { "stroke-width": 3 });
    }
  }
  if (label) body += T(x0 + L0 / 2, axisY + 54, label, { size: 15, bold: true, fill: P.navy });
  const nonZero = counts.map((c, i) => [c, i]).filter(([c]) => c > 0);
  const total = sum(counts);
  const summary = `A line plot${label ? ` labelled ${label}` : ""} on a number line from ${tickT(0)} to ${tickT(N)} in steps of ${fmtSmart(step.q, dec)}. X marks: ${list(nonZero.map(([c, i]) => `${c} at ${tickT(i)}`))}. There are ${total} data ${plural(total, "value")} in all.`;
  return { W, H, body, alt: `Line plot of ${total} data values${label ? `: ${label}` : ""}`, summary };
};

/* boxplot */
KINDS.boxplot = (a) => {
  const keys = ["min", "q1", "median", "q3", "max"];
  const v = {};
  for (const k of keys) v[k] = val(a[k], k);
  for (let i = 1; i < keys.length; i++) if (v[keys[i - 1]].q.cmp(v[keys[i]].q) > 0) fail(`${keys[i - 1]} (${v[keys[i - 1]].text}) must not be greater than ${keys[i]} (${v[keys[i]].text})`);
  const nums = Object.fromEntries(keys.map((k) => [k, v[k].q.num()]));
  const label = a.label ? String(a.label) : "";
  let lo = nums.min;
  let hi = nums.max;
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const step = niceStep(hi - lo, 10);
  const axMin = Math.floor(lo / step + 1e-9) * step;
  const axMax = Math.ceil(hi / step - 1e-9) * step;
  const W = 560;
  const x0 = 44;
  const L0 = 472;
  const showV = !!a.showValues;
  const topPad = showV ? 56 : 24;
  const boxY = topPad + 30;
  const axisY = boxY + 62;
  const H = axisY + 52 + (label ? 30 : 0);
  const xOf = (x) => x0 + ((x - axMin) / (axMax - axMin)) * L0;
  let body = L(x0, axisY, x0 + L0, axisY, { "stroke-width": 3 });
  const count = Math.round((axMax - axMin) / step);
  for (let i = 0; i <= count; i++) {
    const t = axMin + i * step;
    const x = xOf(t);
    body += L(x, axisY - 7, x, axisY + 9, { "stroke-width": 2.5 });
    body += T(x, axisY + 28, fmtNum(t), { size: 14, bold: true, fill: P.navy });
  }
  const yb = boxY;
  body += L(xOf(nums.min), yb, xOf(nums.q1), yb, { "stroke-width": 3 });
  body += L(xOf(nums.q3), yb, xOf(nums.max), yb, { "stroke-width": 3 });
  body += L(xOf(nums.min), yb - 14, xOf(nums.min), yb + 14, { "stroke-width": 3.5 });
  body += L(xOf(nums.max), yb - 14, xOf(nums.max), yb + 14, { "stroke-width": 3.5 });
  body += R(xOf(nums.q1), yb - 24, Math.max(1, xOf(nums.q3) - xOf(nums.q1)), 48, shapeStyle(P.tealL, { "stroke-width": 3 }));
  body += L(xOf(nums.median), yb - 24, xOf(nums.median), yb + 24, { stroke: P.navy, "stroke-width": 6, "stroke-linecap": "butt" });
  if (showV) {
    keys.forEach((k, i) => {
      const x = xOf(nums[k]);
      const y = i % 2 === 0 ? 22 : 44;
      body += L(x, y + 10, x, yb - 26, { stroke: P.mute, "stroke-width": 1, "stroke-dasharray": "3 3" });
      body += T(x, y, v[k].text, { size: 14, bold: true, fill: P.navy, halo: true });
    });
  }
  if (label) body += T(x0 + L0 / 2, axisY + 54, label, { size: 15, bold: true, fill: P.navy });
  const summary = `A box plot${label ? ` of ${label}` : ""}: minimum ${v.min.text}, first quartile ${v.q1.text}, median ${v.median.text}, third quartile ${v.q3.text}, maximum ${v.max.text}.`;
  return { W, H, body, alt: `Box plot${label ? ` of ${label}` : ""} from ${v.min.text} to ${v.max.text}`, summary };
};

/* shared frame for coord and scatter */
function plotFrame(o) {
  const { xmin, xmax, ymin, ymax, pw, ph, xt, yt, zero, xLabel, yLabel } = o;
  const ml = o.ml ?? 60;
  const mt = o.mt ?? 22;
  const mr = o.mr ?? 26;
  const mb = o.mb ?? (xLabel ? 66 : 46);
  const W = ml + pw + mr;
  const H = mt + ph + mb;
  const px = (x) => ml + ((x - xmin) / (xmax - xmin)) * pw;
  const py = (y) => mt + ph - ((y - ymin) / (ymax - ymin)) * ph;
  const axisY = zero ? py(clamp(0, ymin, ymax)) : py(ymin);
  const axisX = zero ? px(clamp(0, xmin, xmax)) : px(xmin);
  let body = R(ml, mt, pw, ph, { fill: "#FFFFFF", stroke: P.grid, "stroke-width": 1.5 });
  for (const t of xt) body += L(px(t.v), mt, px(t.v), mt + ph, { stroke: P.grid, "stroke-width": 1.25 });
  for (const t of yt) body += L(ml, py(t.v), ml + pw, py(t.v), { stroke: P.grid, "stroke-width": 1.25 });
  body += L(ml, axisY, ml + pw, axisY, { "stroke-width": 3 });
  body += L(axisX, mt, axisX, mt + ph, { "stroke-width": 3 });
  const originShown = zero && xmin <= 0 && xmax >= 0 && ymin <= 0 && ymax >= 0;
  for (const t of xt) {
    if (!t.label) continue;
    if (originShown && Math.abs(t.v) < 1e-9) continue;
    body += L(px(t.v), axisY - 5, px(t.v), axisY + 5, { "stroke-width": 2 });
    body += T(px(t.v), axisY + 19, t.text, { size: 13, bold: true, fill: P.navy, halo: true });
  }
  for (const t of yt) {
    if (!t.label) continue;
    if (originShown && Math.abs(t.v) < 1e-9) continue;
    body += L(axisX - 5, py(t.v), axisX + 5, py(t.v), { "stroke-width": 2 });
    body += T(axisX - 9, py(t.v), t.text, { size: 13, bold: true, fill: P.navy, anchor: "end", halo: true });
  }
  if (originShown) body += T(axisX - 9, axisY + 15, "0", { size: 13, bold: true, fill: P.navy, anchor: "end", halo: true });
  if (xLabel) body += T(ml + pw / 2, mt + ph + mb - 16, xLabel, { size: 15, bold: true, fill: P.navy });
  if (yLabel) body += T(16, mt + ph / 2, yLabel, { size: 15, bold: true, fill: P.navy, rot: -90 });
  return { W, H, px, py, body, ml, mt, pw, ph };
}
function clipLine(x1, y1, x2, y2, xmin, xmax, ymin, ymax) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = -Infinity;
  let t1 = Infinity;
  const clip = (p, q) => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  if (!(clip(-dx, x1 - xmin) && clip(dx, xmax - x1) && clip(-dy, y1 - ymin) && clip(dy, ymax - y1))) return null;
  return [x1 + t0 * dx, y1 + t0 * dy, x1 + t1 * dx, y1 + t1 * dy];
}
function lineEq(m, b) {
  const mq = m.q;
  const bq = b.q;
  const dec = /\./.test(m.text + b.text);
  const absText = (v) => fmtSmart(v.q.n < 0 ? v.q.neg() : v.q, dec);
  let mt = "";
  if (mq.n !== 0) {
    if (mq.cmp(Qi(1)) === 0) mt = "x";
    else if (mq.cmp(Qi(-1)) === 0) mt = `${MINUS}x`;
    else mt = mq.isInt() || dec ? `${m.text}x` : `(${m.text})x`;
  }
  if (!mt) return `y = ${b.text}`;
  if (bq.n === 0) return `y = ${mt}`;
  return `y = ${mt} ${bq.n > 0 ? "+" : MINUS} ${absText(b)}`;
}
const LINE_STYLES = [
  { stroke: P.blue, "stroke-width": 3.5 },
  { stroke: P.coral, "stroke-width": 3.5, "stroke-dasharray": "10 6" },
  { stroke: P.teal, "stroke-width": 4, "stroke-dasharray": "2 7" },
];

/* coord */
KINDS.coord = (a) => {
  const xminV = val(a.xmin, "xmin");
  const xmaxV = val(a.xmax, "xmax");
  const yminV = val(a.ymin, "ymin");
  const ymaxV = val(a.ymax, "ymax");
  const stepV = val(a.step ?? 1, "step");
  if (stepV.q.n <= 0) fail("step must be positive");
  if (xminV.q.cmp(xmaxV.q) >= 0 || yminV.q.cmp(ymaxV.q) >= 0) fail("xmin must be less than xmax and ymin less than ymax");
  const dec = isDecSrc(a.xmin, a.xmax, a.ymin, a.ymax, a.step);
  const xmin = xminV.q.num();
  const xmax = xmaxV.q.num();
  const ymin = yminV.q.num();
  const ymax = ymaxV.q.num();
  const xr = xmax - xmin;
  const yr = ymax - ymin;
  const s = Math.min(440 / xr, 400 / yr, 56);
  const pw = xr * s;
  const ph = yr * s;
  const ticksFor = (lo, hi, pxPer, minPx) => {
    const first = lo.q.div(stepV.q);
    const k0 = Math.ceil(first.num() - 1e-9);
    const out = [];
    const total = Math.floor(hi.q.div(stepV.q).num() + 1e-9);
    if (total - k0 > 60) fail("step is too small for this window (more than 60 grid lines)");
    const every = Math.max(1, Math.ceil(minPx / (stepV.q.num() * pxPer)));
    for (let i = k0; i <= total; i++) {
      const q = stepV.q.mul(Qi(i));
      out.push({ v: q.num(), text: fmtSmart(q, dec), label: i % every === 0 });
    }
    return out;
  };
  const labelAxes = Array.isArray(a.labelAxes) ? a.labelAxes.map(String) : [];
  const fr = plotFrame({
    xmin, xmax, ymin, ymax, pw, ph,
    xt: ticksFor(xminV, xmaxV, s, 30),
    yt: ticksFor(yminV, ymaxV, s, 20),
    zero: true,
    xLabel: labelAxes[0],
    yLabel: labelAxes[1],
  });
  let body = fr.body;
  const inWin = (x, y, what) => {
    if (x < xmin - 1e-9 || x > xmax + 1e-9 || y < ymin - 1e-9 || y > ymax + 1e-9) fail(`${what} (${fmtNum(x)}, ${fmtNum(y)}) is outside the window`);
  };
  const lineSummaries = [];
  const polySummaries = [];
  const pointSummaries = [];
  const lines = a.lines ?? [];
  lines.forEach((ln, i) => {
    const st = LINE_STYLES[i % LINE_STYLES.length];
    let seg;
    if (ln.m !== undefined) {
      const m = val(ln.m, `lines[${i}].m`);
      const b = val(ln.b ?? 0, `lines[${i}].b`);
      seg = clipLine(xmin, m.q.num() * xmin + b.q.num(), xmax, m.q.num() * xmax + b.q.num(), xmin, xmax, ymin, ymax);
      lineSummaries.push(`a line ${lineEq(m, b)}`);
    } else if (ln.p1 && ln.p2) {
      const p1 = { x: val(ln.p1.x, "p1.x"), y: val(ln.p1.y, "p1.y") };
      const p2 = { x: val(ln.p2.x, "p2.x"), y: val(ln.p2.y, "p2.y") };
      if (p1.x.q.cmp(p2.x.q) === 0 && p1.y.q.cmp(p2.y.q) === 0) fail(`lines[${i}] has two identical points`);
      seg = clipLine(p1.x.q.num(), p1.y.q.num(), p2.x.q.num(), p2.y.q.num(), xmin, xmax, ymin, ymax);
      lineSummaries.push(`a line through (${p1.x.text}, ${p1.y.text}) and (${p2.x.text}, ${p2.y.text})`);
    } else if (ln.x !== undefined) {
      const xv = val(ln.x, `lines[${i}].x`);
      seg = clipLine(xv.q.num(), 0, xv.q.num(), 1, xmin, xmax, ymin, ymax);
      lineSummaries.push(`a vertical line x = ${xv.text}`);
    } else fail(`lines[${i}] needs {m,b}, {p1,p2} or {x}`);
    if (seg) {
      body += L(fr.px(seg[0]), fr.py(seg[1]), fr.px(seg[2]), fr.py(seg[3]), { ...st, "stroke-linecap": "round" });
      if (ln.label) body += T(clamp(fr.px(seg[2]) - 8, fr.ml + 20, fr.ml + pw - 8), clamp(fr.py(seg[3]) + (seg[3] > ymax - yr * 0.1 ? 16 : -14), fr.mt + 12, fr.mt + ph - 8), String(ln.label), { size: 15, bold: true, fill: P.navy, anchor: "end", halo: true });
    }
    if (ln.label) lineSummaries[lineSummaries.length - 1] += ` labelled ${ln.label}`;
  });
  (a.polys ?? []).forEach((pl, i) => {
    if (!Array.isArray(pl.pts) || pl.pts.length < 3) fail(`polys[${i}] needs at least 3 points`);
    const pts = pl.pts.map((p, j) => {
      const x = val(p.x, `polys[${i}].pts[${j}].x`);
      const y = val(p.y, `polys[${i}].pts[${j}].y`);
      inWin(x.q.num(), y.q.num(), `polys[${i}] vertex`);
      return { x, y, label: p.label };
    });
    body += POLY(pts.map((p) => [fr.px(p.x.q.num()), fr.py(p.y.q.num())]), { fill: P.amber, "fill-opacity": 0.55, stroke: P.navy, "stroke-width": 3, "stroke-linejoin": "round" });
    for (const p of pts) {
      body += C(fr.px(p.x.q.num()), fr.py(p.y.q.num()), 5, shapeStyle(P.navy, { "stroke-width": 1.5 }));
      if (p.label) body += T(fr.px(p.x.q.num()) + 10, fr.py(p.y.q.num()) - 12, String(p.label), { size: 15, bold: true, fill: P.navy, anchor: "start", halo: true });
    }
    if (pl.label) {
      const cx = sum(pts.map((p) => fr.px(p.x.q.num()))) / pts.length;
      const cy = sum(pts.map((p) => fr.py(p.y.q.num()))) / pts.length;
      body += T(cx, cy, String(pl.label), { size: 17, bold: true, fill: P.navy, halo: true });
    }
    polySummaries.push(`a polygon${pl.label ? ` labelled ${pl.label}` : ""} with vertices ${list(pts.map((p) => `${p.label ? `${p.label} ` : ""}(${p.x.text}, ${p.y.text})`))}`);
  });
  (a.points ?? []).forEach((p, i) => {
    const x = val(p.x, `points[${i}].x`);
    const y = val(p.y, `points[${i}].y`);
    inWin(x.q.num(), y.q.num(), `points[${i}]`);
    const cx = fr.px(x.q.num());
    const cy = fr.py(y.q.num());
    body += C(cx, cy, 7, shapeStyle(P.coral, { "stroke-width": 2.5 }));
    if (p.label) body += T(cx + 11, cy - 13, String(p.label), { size: 16, bold: true, fill: P.navy, anchor: "start", halo: true });
    pointSummaries.push(`${p.label ? `${p.label} ` : ""}(${x.text}, ${y.text})`);
  });
  const rng = (lo, hi) => `${lo.text} to ${hi.text}`;
  const parts = [`A coordinate grid with x from ${rng(xminV, xmaxV)} and y from ${rng(yminV, ymaxV)}${labelAxes.length ? `, with the axes labelled ${list(labelAxes)}` : ""}.`];
  if (pointSummaries.length) parts.push(`Points: ${pointSummaries.join(", ")}.`);
  if (lineSummaries.length) parts.push(`It also shows ${list(lineSummaries)}.`);
  if (polySummaries.length) parts.push(`It also shows ${list(polySummaries)}.`);
  const kinds = [pointSummaries.length && "points", lineSummaries.length && "lines", polySummaries.length && "polygons"].filter(Boolean);
  return { W: fr.W, H: fr.H, body, alt: `Coordinate grid${kinds.length ? ` with ${list(kinds)}` : ""}`, summary: parts.join(" ") };
};

/* tape */
KINDS.tape = (a) => {
  if (!Array.isArray(a.rows) || !a.rows.length) fail("rows must be a non-empty array");
  if (a.rows.length > 6) fail("at most 6 rows");
  const dec = isDecSrc(...a.rows.flatMap((r) => (r.parts || []).map((p) => p.value)));
  const rows = a.rows.map((r, ri) => {
    if (!Array.isArray(r.parts) || !r.parts.length) fail(`rows[${ri}] needs parts`);
    if (r.parts.length > 8) fail(`rows[${ri}] has more than 8 parts`);
    return {
      label: r.label ? String(r.label) : "",
      parts: r.parts.map((p, pi) => {
        const n = int(p.n ?? 1, `rows[${ri}].parts[${pi}].n`, 1, 12);
        const hidden = isHidden(p.value);
        const v = hidden ? null : val(p.value, `rows[${ri}].parts[${pi}].value`);
        if (v && v.q.n <= 0) fail(`rows[${ri}].parts[${pi}].value must be positive`);
        return { label: p.label ? String(p.label) : "", n, v, hidden };
      }),
    };
  });
  const known = rows.flatMap((r) => r.parts.filter((p) => !p.hidden).map((p) => p.v.q.num()));
  const mean = known.length ? sum(known) / known.length : 1;
  const unitsOf = (p) => (p.hidden ? mean : p.v.q.num());
  const rowUnits = rows.map((r) => sum(r.parts.map((p) => unitsOf(p) * p.n)));
  const maxUnits = Math.max(...rowUnits);
  const labW = Math.max(...rows.map((r) => (r.label ? r.label.length * 9 + 22 : 0)), 0);
  const unitPx = 430 / maxUnits;
  const boxW = (p) => Math.max(36, unitsOf(p) * unitPx);
  const rowPx = rows.map((r) => sum(r.parts.map((p) => boxW(p) * p.n)));
  const maxPx = Math.max(...rowPx);
  const boxH = 46;
  const hasPartLabel = rows.map((r) => r.parts.some((p) => p.label));
  const rowGap = 18;
  const topPad = a.total !== undefined && rows.length === 1 ? 54 : 16;
  const ml = 18 + labW;
  const rowYs = [];
  let y = topPad;
  rows.forEach((_r, i) => {
    rowYs.push(y);
    y += boxH + (hasPartLabel[i] ? 24 : 0) + rowGap;
  });
  const rightPad = a.total !== undefined && rows.length > 1 ? 90 : 20;
  const W = ml + maxPx + rightPad;
  const H = y - rowGap + 18;
  let body = "";
  const fills = [P.tealL, P.amberL, P.blueL, P.coralL];
  let totalAll = Qi(0);
  let anyHidden = false;
  rows.forEach((r, ri) => {
    const y0 = rowYs[ri];
    if (r.label) body += T(ml - 12, y0 + boxH / 2, r.label, { size: 16, bold: true, fill: P.navy, anchor: "end" });
    let x = ml;
    r.parts.forEach((p, pi) => {
      const bw = boxW(p);
      for (let k = 0; k < p.n; k++) {
        if (p.hidden) {
          body += R(x, y0, bw, boxH, { fill: "#FFFFFF", stroke: P.navy, "stroke-width": 2.5, "stroke-dasharray": "7 5" });
          body += T(x + bw / 2, y0 + boxH / 2, "?", { size: 22, bold: true, fill: P.mute });
        } else {
          body += R(x, y0, bw, boxH, shapeStyle(fills[pi % 4], { "stroke-width": 2.5 }));
          body += T(x + bw / 2, y0 + boxH / 2, p.v.text, { size: 18, bold: true, fill: P.navy });
        }
        x += bw;
      }
      if (p.label) body += T(x - (bw * p.n) / 2, y0 + boxH + 14, p.label, { size: 13, bold: true, fill: P.navy });
      if (p.hidden) anyHidden = true;
      else totalAll = totalAll.add(p.v.q.mul(Qi(p.n)));
    });
  });
  let totalText = null;
  if (a.total !== undefined) {
    const totalHidden = isHidden(a.total);
    totalText = totalHidden ? "?" : val(a.total, "total").text;
    if (!totalHidden && !anyHidden) {
      const tq = val(a.total, "total").q;
      const expect = rows.length === 1 ? totalAll : totalAll;
      if (tq.cmp(expect) !== 0) fail(`total (${totalText}) does not equal the sum of the parts (${fmtSmart(expect, dec)})`);
    }
    if (rows.length === 1) {
      const x1 = ml;
      const x2 = ml + rowPx[0];
      const by = rowYs[0] - 12;
      body += PATH(`M ${n2(x1)} ${by + 8} V ${by} H ${n2(x2)} V ${by + 8}`, { fill: "none", stroke: P.navy, "stroke-width": 2.5 });
      body += T((x1 + x2) / 2, by - 16, totalText === "?" ? "Total: ?" : `Total: ${totalText}`, { size: 17, bold: true, fill: P.navy });
    } else {
      const bx = ml + maxPx + 14;
      const y1 = rowYs[0];
      const y2 = rowYs[rows.length - 1] + boxH;
      body += PATH(`M ${bx} ${y1} H ${bx + 8} V ${y2} H ${bx}`, { fill: "none", stroke: P.navy, "stroke-width": 2.5 });
      body += T(bx + 16, (y1 + y2) / 2 - 10, "Total", { size: 15, bold: true, fill: P.navy, anchor: "start" });
      body += T(bx + 16, (y1 + y2) / 2 + 10, totalText, { size: 17, bold: true, fill: P.navy, anchor: "start" });
    }
  }
  const rowSummary = rows.map((r, ri) => {
    const bits = r.parts.map((p) => {
      const v = p.hidden ? "unknown" : p.v.text;
      const lab = p.label ? ` (${p.label})` : "";
      return p.n > 1 ? `${p.n} equal ${plural(p.n, "part")} of ${v}${lab}` : `${v}${lab}`;
    });
    return `${r.label ? `${r.label}` : `Row ${ri + 1}`}: ${bits.join(", ")}`;
  });
  let summary = `A tape diagram with ${rows.length} ${plural(rows.length, "row")}. ${rowSummary.join(". ")}.`;
  if (totalText !== null) summary += ` The total is ${totalText === "?" ? "unknown" : totalText}.`;
  return { W, H, body, alt: `Tape diagram with ${rows.length} ${plural(rows.length, "row")}`, summary };
};

/* ratiotable */
KINDS.ratiotable = (a) => {
  if (!Array.isArray(a.headers) || a.headers.length < 2) fail("headers must be an array of at least 2 column names");
  if (!Array.isArray(a.rows) || !a.rows.length) fail("rows must be a non-empty array");
  const headers = a.headers.map(String);
  const nc = headers.length;
  const hidden = new Set();
  for (const hc of a.hide ?? []) {
    if (!Array.isArray(hc) || hc.length !== 2) fail("hide entries must be [row, column]");
    const r = int(hc[0], "hide row", 0, a.rows.length - 1);
    const c = int(hc[1], "hide column", 0, nc - 1);
    hidden.add(`${r},${c}`);
  }
  const cells = a.rows.map((row, ri) => {
    if (!Array.isArray(row) || row.length !== nc) fail(`rows[${ri}] must have ${nc} values`);
    return row.map((v, ci) => {
      if (hidden.has(`${ri},${ci}`) || isHidden(v)) return null;
      return val(v, `rows[${ri}][${ci}]`).text;
    });
  });
  const cw = clamp(Math.max(...headers.map((h) => Math.min(h.length, 28) * 9 + 30), 120), 120, 220);
  const rh = 46;
  const hh = 54;
  const W = 24 + nc * cw;
  const H = 24 + hh + rh * cells.length;
  let body = "";
  headers.forEach((h, c) => {
    body += R(12 + c * cw, 12, cw, hh, shapeStyle(P.navy, { "stroke-width": 2 }));
    const lines = wrapWords(h, Math.floor(cw / 9.5), 2);
    lines.forEach((ln, li) => {
      body += T(12 + c * cw + cw / 2, 12 + hh / 2 + (li - (lines.length - 1) / 2) * 19, ln, { size: 16, bold: true, fill: "#FFFFFF" });
    });
  });
  cells.forEach((row, r) => {
    row.forEach((t, c) => {
      const x = 12 + c * cw;
      const y = 12 + hh + r * rh;
      if (t === null) {
        body += R(x, y, cw, rh, { fill: "#FFFFFF", stroke: P.navy, "stroke-width": 2 });
        body += R(x + 14, y + 8, cw - 28, rh - 16, { fill: "#FFFFFF", stroke: P.navy, "stroke-width": 2, "stroke-dasharray": "6 4", rx: 5 });
        body += T(x + cw / 2, y + rh / 2, "?", { size: 20, bold: true, fill: P.mute });
      } else {
        body += R(x, y, cw, rh, shapeStyle(r % 2 ? P.navyL : "#FFFFFF", { "stroke-width": 2 }));
        body += T(x + cw / 2, y + rh / 2, t, { size: 20, bold: true, fill: P.navy });
      }
    });
  });
  const rowS = cells.map((row, r) => `Row ${r + 1}: ${list(row.map((t) => (t === null ? "unknown" : t)))}`);
  const summary = `A ratio table with columns ${list(headers)}. ${rowS.join(". ")}.`;
  return { W, H, body, alt: `Ratio table with columns ${list(headers)}`, summary };
};

/* doublenl */
KINDS.doublenl = (a) => {
  const lineIn = (l, name) => {
    if (!l || !Array.isArray(l.values)) fail(`${name} needs { label, values }`);
    return { label: l.label ? String(l.label) : "", vals: l.values.map((v, i) => (isHidden(v) ? null : val(v, `${name}.values[${i}]`))) };
  };
  const top = lineIn(a.top, "top");
  const bot = lineIn(a.bottom, "bottom");
  const n = top.vals.length;
  if (n !== bot.vals.length) fail(`top has ${n} values but bottom has ${bot.vals.length}`);
  if (n < 2 || n > 12) fail("a double number line needs 2 to 12 values on each line");
  const W = 560;
  const x0 = 70;
  const L0 = 420;
  const topY = 82;
  const botY = 178;
  let body = "";
  const xs = Array.from({ length: n }, (_, i) => x0 + (i * L0) / (n - 1));
  body += T(x0 - 30, 20, top.label, { size: 16, bold: true, fill: P.navy, anchor: "start" });
  body += T(x0 - 30, botY + 62, bot.label, { size: 16, bold: true, fill: P.navy, anchor: "start" });
  for (const x of xs) body += L(x, topY, x, botY, { stroke: P.grid, "stroke-width": 1.5, "stroke-dasharray": "5 5" });
  for (const y of [topY, botY]) body += L(x0 - 30, y, x0 + L0 + 30, y, { "stroke-width": 3 });
  const put = (v, x, y) => {
    if (v === null) {
      return R(x - 22, y - 14, 44, 28, { fill: "#FFFFFF", stroke: P.navy, "stroke-width": 2, "stroke-dasharray": "5 4", rx: 5 }) + T(x, y, "?", { size: 18, bold: true, fill: P.mute });
    }
    return T(x, y, v.text, { size: 17, bold: true, fill: P.navy });
  };
  xs.forEach((x, i) => {
    body += L(x, topY - 8, x, topY + 8, { "stroke-width": 3 });
    body += L(x, botY - 8, x, botY + 8, { "stroke-width": 3 });
    body += put(top.vals[i], x, topY - 28);
    body += put(bot.vals[i], x, botY + 30);
  });
  const H = botY + 80;
  const seq = (l) => l.vals.map((v) => (v === null ? "unknown" : v.text)).join(", ");
  const summary = `A double number line with matching ticks. The top line${top.label ? `, ${top.label}` : ""}, shows ${seq(top)}. The bottom line${bot.label ? `, ${bot.label}` : ""}, shows ${seq(bot)}.`;
  return { W, H, body, alt: `Double number line${top.label && bot.label ? ` of ${top.label} and ${bot.label}` : ""}`, summary };
};

/* table */
KINDS.table = (a) => {
  if (!Array.isArray(a.headers) || !a.headers.length) fail("headers must be a non-empty array");
  if (!Array.isArray(a.rows) || !a.rows.length) fail("rows must be a non-empty array");
  const headers = a.headers.map(String);
  const nc = headers.length;
  const caption = a.caption ? String(a.caption) : "";
  const rows = a.rows.map((row, ri) => {
    if (!Array.isArray(row) || row.length !== nc) fail(`rows[${ri}] must have ${nc} values`);
    return row.map((v) => (v === null || v === undefined || v === "" ? "" : typeof v === "number" ? fmtNum(v) : String(v)));
  });
  const colW = headers.map((h, c) => Math.max(66, Math.max(h.length, ...rows.map((r) => r[c].length)) * 9.5 + 28));
  const rh = 38;
  const capH = caption ? 36 : 0;
  const W = 24 + sum(colW);
  const H = 24 + capH + rh * (rows.length + 1);
  let body = "";
  if (caption) body += T(W / 2, 12 + capH / 2 - 2, caption, { size: 17, bold: true, fill: P.navy });
  let x = 12;
  headers.forEach((h, c) => {
    body += R(x, 12 + capH, colW[c], rh, shapeStyle(P.navy));
    body += T(x + colW[c] / 2, 12 + capH + rh / 2, h, { size: 16, bold: true, fill: "#FFFFFF" });
    x += colW[c];
  });
  rows.forEach((row, r) => {
    let xx = 12;
    row.forEach((t, c) => {
      const y = 12 + capH + rh * (r + 1);
      body += R(xx, y, colW[c], rh, shapeStyle(r % 2 ? P.navyL : "#FFFFFF"));
      if (t) body += T(xx + colW[c] / 2, y + rh / 2, t, { size: 16, fill: P.ink, bold: t === "?" });
      xx += colW[c];
    });
  });
  const rowS = rows.map((row, r) => `Row ${r + 1}: ${row.map((t, c) => `${headers[c]} ${t === "" ? "blank" : t === "?" ? "unknown" : t}`).join(", ")}`);
  const summary = `A table${caption ? ` titled ${caption}` : ""} with ${nc} ${plural(nc, "column")} (${headers.join(", ")}) and ${rows.length} ${plural(rows.length, "row")}. ${rowS.join(". ")}.`;
  return { W, H, body, alt: `Table${caption ? ` titled ${caption}` : ""} with columns ${list(headers)}`, summary };
};

/* shape */
const SHAPE_FACTS = {
  triangle: "a triangle: 3 straight sides and 3 corners",
  square: "a square: 4 equal sides and 4 square corners",
  rectangle: "a rectangle: 4 sides with opposite sides equal and 4 square corners",
  circle: "a circle: one round edge with no corners and no straight sides",
  pentagon: "a pentagon: 5 equal straight sides and 5 corners",
  hexagon: "a hexagon: 6 equal straight sides and 6 corners",
  rhombus: "a rhombus: 4 equal sides, with slanted corners that are not square",
  trapezoid: "a trapezoid: 4 straight sides with exactly one pair of parallel sides",
  "half-circle": "a half-circle: one straight side and one curved side",
  "quarter-circle": "a quarter-circle: two straight sides that meet at a square corner, and one curved side",
};
KINDS.shape = (a) => {
  const name = a.name;
  if (!SHAPE_FACTS[name]) fail(`name must be one of ${Object.keys(SHAPE_FACTS).join(", ")}; got ${show(name)}`);
  const labels = !!a.labels;
  const W = 260;
  const H = labels ? 240 : 210;
  const cx = 130;
  const cy = 100;
  const sty = shapeStyle(P.tealL, { "stroke-width": 4 });
  let body;
  const regular = (k, r, start) => POLY(Array.from({ length: k }, (_, i) => [cx + r * Math.cos(((start + (360 / k) * i) * Math.PI) / 180), cy + r * Math.sin(((start + (360 / k) * i) * Math.PI) / 180)]), sty);
  switch (name) {
    case "triangle": body = POLY([[cx, 24], [cx + 92, 172], [cx - 92, 172]], sty); break;
    case "square": body = R(cx - 66, cy - 66, 132, 132, sty); break;
    case "rectangle": body = R(cx - 96, cy - 58, 192, 116, sty); break;
    case "circle": body = C(cx, cy, 76, sty); break;
    case "pentagon": body = regular(5, 82, -90); break;
    case "hexagon": body = regular(6, 80, 0); break;
    case "rhombus": body = POLY([[cx, cy - 66], [cx + 100, cy], [cx, cy + 66], [cx - 100, cy]], sty); break;
    case "trapezoid": body = POLY([[cx - 56, cy - 56], [cx + 56, cy - 56], [cx + 100, cy + 56], [cx - 100, cy + 56]], sty); break;
    case "half-circle": body = PATH(`M ${cx - 90} ${cy + 46} A 90 90 0 0 1 ${cx + 90} ${cy + 46} Z`, sty); break;
    default:
      body = PATH(`M ${cx - 62} ${cy + 66} L ${cx - 62} ${cy - 66} A 132 132 0 0 1 ${cx + 70} ${cy + 66} Z`, sty) + PATH(`M ${cx - 62} ${cy + 44} H ${cx - 40} V ${cy + 66}`, { fill: "none", stroke: P.navy, "stroke-width": 2.5 });
  }
  if (labels) body += T(W / 2, 216, name, { size: 19, bold: true, fill: P.navy });
  return { W, H, body, alt: `A ${name}`, summary: `${cap(SHAPE_FACTS[name])}.` };
};

/* prism */
KINDS.prism = (a) => {
  const units = a.units !== false;
  const dim = (v, name) => {
    const x = val(v, name);
    if (x.q.n <= 0) fail(`${name} must be positive`);
    if (units && (!x.q.isInt() || x.q.n > 12)) fail(`${name} must be a whole number from 1 to 12 when units is true, got ${x.text}`);
    return x;
  };
  const l = dim(a.l, "l");
  const w = dim(a.w, "w");
  const h = dim(a.h, "h");
  const unitGiven = a.unit !== undefined && a.unit !== null && a.unit !== "";
  const unit = unitGiven ? String(a.unit) : units ? "cubes" : "";
  const ln = l.q.num();
  const wn = w.q.num();
  const hn = h.q.num();
  const u = 0.5;
  const v = 0.36;
  const s = Math.min(300 / (ln + u * wn), 210 / (hn + v * wn), 46);
  const x0 = 92;
  const topM = 30;
  const yb = topM + (hn + v * wn) * s;
  const W = x0 + (ln + u * wn) * s + 104;
  const H = yb + 52;
  const fw = ln * s;
  const fh = hn * s;
  const dx = u * wn * s;
  const dy = v * wn * s;
  const sty = (fill) => shapeStyle(fill, { "stroke-width": 3 });
  let body = "";
  body += POLY([[x0, yb - fh], [x0 + fw, yb - fh], [x0 + fw + dx, yb - fh - dy], [x0 + dx, yb - fh - dy]], sty(P.amberL));
  body += POLY([[x0 + fw, yb - fh], [x0 + fw + dx, yb - fh - dy], [x0 + fw + dx, yb - dy], [x0 + fw, yb]], sty(P.blueL));
  body += R(x0, yb - fh, fw, fh, sty(P.tealL));
  if (units) {
    const g = { stroke: P.navy, "stroke-width": 1, "stroke-opacity": 0.55 };
    for (let i = 1; i < ln; i++) {
      body += L(x0 + i * s, yb - fh, x0 + i * s, yb, g);
      body += L(x0 + i * s, yb - fh, x0 + i * s + dx, yb - fh - dy, g);
    }
    for (let j = 1; j < hn; j++) {
      body += L(x0, yb - j * s, x0 + fw, yb - j * s, g);
      body += L(x0 + fw, yb - j * s, x0 + fw + dx, yb - j * s - dy, g);
    }
    for (let k = 1; k < wn; k++) {
      body += L(x0 + (k * dx) / wn, yb - fh - (k * dy) / wn, x0 + fw + (k * dx) / wn, yb - fh - (k * dy) / wn, g);
      body += L(x0 + fw + (k * dx) / wn, yb - fh - (k * dy) / wn, x0 + fw + (k * dx) / wn, yb - (k * dy) / wn, g);
    }
    body += R(x0, yb - fh, fw, fh, { fill: "none", stroke: P.navy, "stroke-width": 3 });
  }
  const lab = (q) => (unit ? `${q.text} ${q.q.cmp(Qi(1)) === 0 && unit === "cubes" ? "cube" : unit}` : q.text);
  body += T(x0 + fw / 2, yb + 24, lab(l), { size: 17, bold: true, fill: P.navy });
  body += T(x0 + fw + dx / 2 + 14, yb - dy / 2 + 18, lab(w), { size: 17, bold: true, fill: P.navy, anchor: "start" });
  body += T(x0 - 12, yb - fh / 2, lab(h), { size: 17, bold: true, fill: P.navy, anchor: "end" });
  const sentence = `A rectangular prism that is ${lab(l)} long, ${lab(w)} wide and ${lab(h)} tall${units ? ", built from 1-unit cubes" : ""}.`;
  return { W, H, body, alt: `Rectangular prism ${l.text} by ${w.text} by ${h.text}`, summary: sentence };
};

/* rect */
const sqUnit = (u) => (!u ? "square units" : /^(mm|cm|m|km|in|ft|yd|mi)$/.test(u) ? `${u}²` : `square ${u}`);
KINDS.rect = (a) => {
  const w = val(a.w, "w");
  const h = val(a.h, "h");
  if (w.q.n <= 0 || h.q.n <= 0) fail("w and h must be positive");
  const unit = a.unit ? String(a.unit) : "";
  const dec = isDecSrc(a.w, a.h);
  const sym = Array.isArray(a.labels) ? a.labels.map(String) : null;
  if (sym && sym.length !== 2) fail("labels must be [widthLabel, heightLabel] or null");
  const aspect = clamp(w.q.num() / h.q.num(), 0.4, 3);
  let rw = 300;
  let rh = rw / aspect;
  if (rh > 190) {
    rh = 190;
    rw = rh * aspect;
  }
  rw = Math.max(rw, 110);
  const ml = 110;
  const mt = 24;
  const showA = !!a.showArea;
  const showP = !!a.showPerimeter;
  const W = ml + rw + 50;
  const H = mt + rh + 56 + (showP ? 34 : 0);
  const wl = sym ? sym[0] : unit ? `${w.text} ${unit}` : w.text;
  const hl = sym ? sym[1] : unit ? `${h.text} ${unit}` : h.text;
  let body = R(ml, mt, rw, rh, shapeStyle(P.tealL, { "stroke-width": 4 }));
  const tick = { "stroke-width": 2 };
  body += L(ml, mt + rh + 12, ml + rw, mt + rh + 12, tick) + L(ml, mt + rh + 6, ml, mt + rh + 18, tick) + L(ml + rw, mt + rh + 6, ml + rw, mt + rh + 18, tick);
  body += L(ml - 12, mt, ml - 12, mt + rh, tick) + L(ml - 18, mt, ml - 6, mt, tick) + L(ml - 18, mt + rh, ml - 6, mt + rh, tick);
  body += T(ml + rw / 2, mt + rh + 34, wl, { size: 18, bold: true, fill: P.navy });
  body += T(ml - 24, mt + rh / 2, hl, { size: 18, bold: true, fill: P.navy, anchor: "end" });
  const areaQ = w.q.mul(h.q);
  const perQ = w.q.add(h.q).mul(Qi(2));
  let areaT = "";
  let perT = "";
  if (showA) {
    areaT = sym ? `${sym[0]} ${TIMES} ${sym[1]}` : `${fmtSmart(areaQ, dec)} ${sqUnit(unit)}`;
    body += T(ml + rw / 2, mt + rh / 2, `Area = ${areaT}`, { size: 18, bold: true, fill: P.navy });
  }
  if (showP) {
    perT = sym ? `2 ${TIMES} (${sym[0]} + ${sym[1]})` : `${fmtSmart(perQ, dec)}${unit ? ` ${unit}` : ""}`;
    body += T(ml + rw / 2, mt + rh + 66, `Perimeter = ${perT}`, { size: 18, bold: true, fill: P.navy });
  }
  const hiddenLab = (t) => /^\s*\?\s*$/.test(t);
  const wd = sym ? (hiddenLab(sym[0]) ? "unknown" : sym[0]) : wl;
  const hd = sym ? (hiddenLab(sym[1]) ? "unknown" : sym[1]) : hl;
  let summary = sym ? `A rectangle with its width labelled ${wd} and its height labelled ${hd}.` : `A rectangle ${wd} wide and ${hd} tall.`;
  if (showA) summary += ` Its area is shown as ${areaT}.`;
  if (showP) summary += ` Its perimeter is shown as ${perT}.`;
  return { W, H, body, alt: sym ? "Rectangle with labelled sides" : `Rectangle ${wl} by ${hl}`, summary };
};

/* angle */
KINDS.angle = (a) => {
  const deg = Number(a.deg);
  if (!Number.isFinite(deg) || deg <= 0 || deg >= 360) fail(`deg must be greater than 0 and less than 360, got ${show(a.deg)}`);
  const prot = !!a.protractor;
  if (prot && deg > 180) fail("a protractor can only show an angle up to 180 degrees");
  const given = a.label !== undefined && a.label !== null && a.label !== "";
  const label = given ? String(a.label) : `${fmtNum(deg)}°`;
  const hidden = given && !/\d/.test(label);
  const numOnly = /^\s*(\d+(?:\.\d+)?)\s*(?:°|degrees?)?\s*$/.exec(label);
  if (given && numOnly && Math.abs(Number(numOnly[1]) - deg) > 1e-9) fail(`label ${show(label)} does not match deg ${deg}`);
  const phi = (deg * Math.PI) / 180;
  const Rr = 186;
  const len1 = prot ? Rr + 34 : 150;
  const len2 = prot ? Rr + 34 : 140;
  const ra = prot ? 46 : 48;
  const P1 = [len1, 0];
  const P2 = [len2 * Math.cos(phi), -len2 * Math.sin(phi)];
  const right = Math.abs(deg - 90) < 1e-9;
  const rl = right ? 58 : deg < 30 ? ra + 44 : ra + 28;
  const LP = [rl * Math.cos(phi / 2), -rl * Math.sin(phi / 2)];
  const lw = tw(label, 20) / 2 + 6;
  const pts = [[0, 0], P1, P2, [LP[0] - lw, LP[1] - 14], [LP[0] + lw, LP[1] + 14]];
  for (let d = 0; d <= deg; d += 10) pts.push([ra * Math.cos((d * Math.PI) / 180), -ra * Math.sin((d * Math.PI) / 180)]);
  if (prot) pts.push([-(Rr + 12), -(Rr + 12)], [Rr + 12, 30], [-(Rr + 12), 30]);
  const minX = Math.min(...pts.map((p) => p[0])) - 22;
  const maxX = Math.max(...pts.map((p) => p[0])) + 22;
  const minY = Math.min(...pts.map((p) => p[1])) - 22;
  const maxY = Math.max(...pts.map((p) => p[1])) + 22;
  const W = maxX - minX;
  const H = maxY - minY;
  const tx = -minX;
  const ty = -minY;
  const X = (x) => x + tx;
  const Y = (y) => y + ty;
  let body = "";
  if (prot) {
    const rr = Rr + 10;
    body += PATH(`M ${X(-rr)} ${Y(0)} A ${rr} ${rr} 0 0 1 ${X(rr)} ${Y(0)} L ${X(rr)} ${Y(26)} L ${X(-rr)} ${Y(26)} Z`, { fill: P.blueL, "fill-opacity": 0.6, stroke: P.blue, "stroke-width": 2.5, "stroke-linejoin": "round" });
    for (let d = 0; d <= 180; d++) {
      const len = d % 10 === 0 ? 17 : d % 5 === 0 ? 12 : 7;
      const c = Math.cos((d * Math.PI) / 180);
      const sn = Math.sin((d * Math.PI) / 180);
      body += L(X(Rr * c), Y(-Rr * sn), X((Rr - len) * c), Y(-(Rr - len) * sn), { "stroke-width": d % 10 === 0 ? 1.8 : 1, "stroke-linecap": "butt" });
    }
    for (let d = 0; d <= 180; d += 10) {
      const c = Math.cos((d * Math.PI) / 180);
      const sn = Math.sin((d * Math.PI) / 180);
      body += T(X((Rr - 30) * c), Y(-(Rr - 30) * sn), String(d), { size: 12, bold: true, fill: P.navy });
      if (d > 0 && d < 180) body += T(X((Rr - 58) * c), Y(-(Rr - 58) * sn), String(180 - d), { size: 12, fill: P.mute });
    }
  }
  body += L(X(0), Y(0), X(P1[0]), Y(0), { "stroke-width": 4.5 });
  body += L(X(0), Y(0), X(P2[0]), Y(P2[1]), { "stroke-width": 4.5 });
  body += arrowHead(X(P1[0]), Y(0), 1, 0, 12);
  body += arrowHead(X(P2[0]), Y(P2[1]), P2[0], P2[1], 12);
  if (right) {
    body += PATH(`M ${X(26)} ${Y(0)} V ${Y(-26)} H ${X(0)}`, { fill: "none", stroke: P.coral, "stroke-width": 3 });
  } else {
    const end = [ra * Math.cos(phi), -ra * Math.sin(phi)];
    body += PATH(`M ${X(ra)} ${Y(0)} A ${ra} ${ra} 0 ${deg > 180 ? 1 : 0} 0 ${n2(X(end[0]))} ${n2(Y(end[1]))}`, { fill: "none", stroke: P.coral, "stroke-width": 3.5 });
  }
  body += C(X(0), Y(0), 5.5, shapeStyle(P.navy));
  body += T(X(LP[0]), Y(LP[1]), label, { size: 20, bold: true, fill: P.navy, halo: true });
  let summary;
  if (hidden) summary = `An angle drawn to scale with its measure not given (labelled ${label}).`;
  else {
    const kind = right ? "a right angle" : deg < 90 ? "an acute angle" : deg === 180 ? "a straight angle" : deg < 180 ? "an obtuse angle" : "a reflex angle";
    summary = `An angle measuring ${fmtNum(deg)} degrees, which is ${kind}.`;
  }
  if (prot) summary += " A protractor is placed on it with its base along one ray and its zero mark on that ray.";
  return { W, H, body, alt: hidden ? "Angle with an unknown measure" : `Angle of ${fmtNum(deg)} degrees`, summary };
};

/* circle */
KINDS.circle = (a) => {
  const mode = a.show ?? "radius";
  if (!["radius", "diameter", "both"].includes(mode)) fail(`show must be "radius", "diameter" or "both", got ${show(mode)}`);
  const unit = a.unit ? String(a.unit) : "";
  let rq = null;
  let dq = null;
  let rh = false;
  let dh = false;
  let rtxt = "";
  let dtxt = "";
  if (a.r !== undefined) {
    if (a.r === "?") rh = true;
    else {
      const v = val(a.r, "r");
      rq = v.q;
      rtxt = v.text;
    }
  }
  if (a.d !== undefined) {
    if (a.d === "?") dh = true;
    else {
      const v = val(a.d, "d");
      dq = v.q;
      dtxt = v.text;
    }
  }
  if (rq && rq.n <= 0) fail("r must be positive");
  if (dq && dq.n <= 0) fail("d must be positive");
  if (rq && dq && dq.cmp(rq.mul(Qi(2))) !== 0) fail(`d (${dtxt}) must be twice r (${rtxt})`);
  const dec = isDecSrc(a.r, a.d);
  if (!rq && dq) {
    rq = dq.div(Qi(2));
    rtxt = fmtSmart(rq, dec);
  }
  if (!dq && rq) {
    dq = rq.mul(Qi(2));
    dtxt = fmtSmart(dq, dec);
  }
  if (!rq && !dq && !rh && !dh) fail("r (radius) or d (diameter) is required");
  const rHidden = rh || !rq;
  const dHidden = dh || !dq;
  const W = 340;
  const H = 300;
  const cx = 170;
  const cy = 150;
  const R0 = 104;
  let body = C(cx, cy, R0, shapeStyle(P.tealL, { "stroke-width": 4 }));
  const u2 = unit ? ` ${unit}` : "";
  const rLab = `r = ${rHidden ? "?" : rtxt + u2}`;
  const dLab = `d = ${dHidden ? "?" : dtxt + u2}`;
  if (mode === "diameter" || mode === "both") {
    body += L(cx - R0, cy, cx + R0, cy, { stroke: P.blue, "stroke-width": 4 });
    body += C(cx - R0, cy, 5, shapeStyle(P.blue)) + C(cx + R0, cy, 5, shapeStyle(P.blue));
    body += T(cx, cy + 24, dLab, { size: 18, bold: true, fill: P.navy, halo: true });
  }
  if (mode === "radius" || mode === "both") {
    const ang = (-55 * Math.PI) / 180;
    const ex = cx + R0 * Math.cos(ang);
    const ey = cy + R0 * Math.sin(ang);
    body += L(cx, cy, ex, ey, { stroke: P.coral, "stroke-width": 4.5 });
    body += C(ex, ey, 5, shapeStyle(P.coral));
    body += T(cx - 38, cy - 54, rLab, { size: 18, bold: true, fill: P.navy, halo: true });
  }
  body += C(cx, cy, 6, shapeStyle(P.navy));
  const what = (nm, hid, t) => (hid ? `${nm} labelled unknown` : `${nm} labelled ${t}${u2}`);
  const pieces = [];
  if (mode !== "diameter") pieces.push(what("the radius", rHidden, rtxt));
  if (mode !== "radius") pieces.push(what("the diameter", dHidden, dtxt));
  return { W, H, body, alt: `Circle with its ${mode === "both" ? "radius and diameter" : mode} drawn`, summary: `A circle with ${list(pieces)}.` };
};

/* triangle */
KINDS.triangle = (a) => {
  const right = a.right !== false;
  const unit = a.unit ? ` ${a.unit}` : "";
  const sides = ["a", "b", "c"].map((k) => {
    const v = a[k];
    if (v === undefined) fail(`${k} is required (use "?" for an unknown side)`);
    if (isHidden(v)) return { hidden: true, n: null, text: "?" };
    if (typeof v === "string") {
      const m = /^\s*(-?[\d.,]+(?:\s+\d+\/\d+|\/\d+)?)/.exec(v);
      const q = m ? tryVal(m[1]) : null;
      if (q) {
        if (q.q.n <= 0) fail(`${k} must be positive`);
        return { hidden: false, n: q.q.num(), q: q.q, text: /[a-z]/i.test(v) ? v.trim() : v.trim() + unit };
      }
      return { hidden: false, n: null, text: v.trim() };
    }
    const q = val(v, k);
    if (q.q.n <= 0) fail(`${k} must be positive`);
    return { hidden: false, n: q.q.num(), q: q.q, text: q.text + unit };
  });
  const [sa, sb, sc] = sides;
  if (sa.q && sb.q && sc.q) {
    if (right) {
      if (sa.q.mul(sa.q).add(sb.q.mul(sb.q)).cmp(sc.q.mul(sc.q)) !== 0) fail(`a right triangle needs a² + b² = c², but ${sa.text}, ${sb.text}, ${sc.text} does not`);
    } else if (!(sa.n + sb.n > sc.n && sa.n + sc.n > sb.n && sb.n + sc.n > sa.n)) fail("the three sides do not make a triangle");
  }
  const customLabels = Array.isArray(a.labels) ? a.labels.map(String) : null;
  if (customLabels && customLabels.length !== 3) fail("labels must have 3 entries");
  const disp = customLabels || sides.map((s) => s.text);
  let pts;
  if (right) {
    let la = sa.n;
    let lb = sb.n;
    const lc = sc.n;
    if (la == null && lb != null && lc != null && lc > lb) la = Math.sqrt(lc * lc - lb * lb);
    if (lb == null && la != null && lc != null && lc > la) lb = Math.sqrt(lc * lc - la * la);
    if (la == null || lb == null) {
      la = la ?? 4;
      lb = lb ?? 3;
      if (sa.n == null && sb.n == null) {
        la = 4;
        lb = 3;
      }
    }
    pts = [[0, lb], [la, lb], [0, 0]];
  } else {
    const known = sides.filter((s) => s.n != null).map((s) => s.n);
    const mean = known.length ? sum(known) / known.length : 1;
    let [x, y, z] = sides.map((s) => s.n ?? mean);
    if (!(x + y > z && x + z > y && y + z > x)) [x, y, z] = [mean, mean, mean];
    const px = (x * x + y * y - z * z) / (2 * x);
    const py = Math.sqrt(Math.max(1e-9, y * y - px * px));
    pts = [[0, 0], [x, 0], [px, py]];
    pts = pts.map(([qx, qy]) => [qx, py - qy]);
  }
  const minX = Math.min(...pts.map((p) => p[0]));
  const maxX = Math.max(...pts.map((p) => p[0]));
  const minY = Math.min(...pts.map((p) => p[1]));
  const maxY = Math.max(...pts.map((p) => p[1]));
  let k = Math.min(300 / (maxX - minX || 1), 210 / (maxY - minY || 1));
  const bw = (maxX - minX) * k;
  const bh = (maxY - minY) * k;
  const ml = 96;
  const mt = 44;
  let bhs = bh;
  if (bh < 70) bhs = 70;
  const ys = bh ? bhs / bh : 1;
  const sp = pts.map(([x, y]) => [ml + (x - minX) * k, mt + (y - minY) * k * ys]);
  k = 0;
  const W = ml + bw + 100;
  const H = mt + bhs + 54;
  let body = POLY(sp, shapeStyle(P.tealL, { "stroke-width": 4 }));
  const cxm = sum(sp.map((p) => p[0])) / 3;
  const cym = sum(sp.map((p) => p[1])) / 3;
  const edges = right ? [[sp[0], sp[1], 0], [sp[0], sp[2], 1], [sp[1], sp[2], 2]] : [[sp[0], sp[1], 0], [sp[0], sp[2], 1], [sp[1], sp[2], 2]];
  for (const [p, q, idx] of edges) {
    const mx = (p[0] + q[0]) / 2;
    const my = (p[1] + q[1]) / 2;
    let nx = -(q[1] - p[1]);
    let ny = q[0] - p[0];
    if (nx * (mx - cxm) + ny * (my - cym) < 0) {
      nx = -nx;
      ny = -ny;
    }
    const nl = Math.hypot(nx, ny) || 1;
    const lw = tw(disp[idx], 18) / 2;
    const off = 12 + Math.abs(nx / nl) * lw + Math.abs(ny / nl) * 12;
    const ex = mx + (nx / nl) * off;
    const ey = my + (ny / nl) * off;
    body += T(ex, ey, disp[idx], { size: 18, bold: true, fill: P.navy, halo: true });
  }
  if (right) {
    const c0 = sp[0];
    body += PATH(`M ${c0[0] + 20} ${c0[1]} V ${c0[1] - 20} H ${c0[0]}`, { fill: "none", stroke: P.coral, "stroke-width": 3 });
  }
  const dd = disp.map((t, i) => (customLabels ? t : sides[i].hidden ? "unknown" : t));
  const summary = right
    ? `A right triangle with its legs labelled ${dd[0]} and ${dd[1]} and its hypotenuse labelled ${dd[2]}. The square corner is between the two legs.`
    : `A triangle with its sides labelled ${list(dd)}.`;
  return { W, H, body, alt: right ? "Right triangle with labelled sides" : "Triangle with labelled sides", summary };
};

/* balance */
KINDS.balance = (a) => {
  if (!Array.isArray(a.left) || !Array.isArray(a.right)) fail("left and right must be arrays of tokens");
  if (a.left.length > 12 || a.right.length > 12) fail("at most 12 tokens on a side");
  if (!a.left.length && !a.right.length) fail("the balance has no tokens");
  const tok = (t) => {
    if (t === null || t === undefined || t === "") fail("a token cannot be empty");
    const v = tryVal(t);
    if (v) return { text: v.text, q: v.q };
    return { text: String(t), q: null };
  };
  const left = a.left.map(tok);
  const right = a.right.map(tok);
  const all = [...left, ...right];
  const numeric = all.every((t) => t.q);
  const sL = numeric ? left.reduce((s, t) => s.add(t.q), Qi(0)) : null;
  const sR = numeric ? right.reduce((s, t) => s.add(t.q), Qi(0)) : null;
  let alpha = 0;
  if (numeric) {
    const c = sR.cmp(sL);
    if (c !== 0) {
      const big = Math.max(Math.abs(sL.num()), Math.abs(sR.num()), 1e-9);
      alpha = c * (5 + 5 * Math.min(1, (Math.abs(sR.num() - sL.num()) / big) * 2));
    }
  }
  const al = (alpha * Math.PI) / 180;
  const cx = 290;
  const pivotY = 70;
  const half = 190;
  const lx = cx - half * Math.cos(al);
  const ly = pivotY - half * Math.sin(al);
  const rx = cx + half * Math.cos(al);
  const ry = pivotY + half * Math.sin(al);
  const rowsNeeded = Math.max(1, Math.ceil(left.length / 4), Math.ceil(right.length / 4));
  const hang = 40 + rowsNeeded * 40;
  const ground = Math.max(ly, ry) + hang + 54;
  const W = 580;
  const H = ground + 30;
  let body = "";
  body += POLY([[cx, pivotY], [cx - 44, ground], [cx + 44, ground]], shapeStyle(P.navyL, { "stroke-width": 3 }));
  body += R(cx - 130, ground, 260, 14, shapeStyle(P.navy, { rx: 5 }));
  const pan = (ex, ey, toks) => {
    const py = ey + hang;
    let s = L(ex, ey, ex - 82, py, { "stroke-width": 2 }) + L(ex, ey, ex + 82, py, { "stroke-width": 2 });
    s += PATH(`M ${n2(ex - 86)} ${n2(py)} Q ${n2(ex - 86)} ${n2(py + 28)} ${n2(ex)} ${n2(py + 28)} Q ${n2(ex + 86)} ${n2(py + 28)} ${n2(ex + 86)} ${n2(py)} Z`, shapeStyle("#FFFFFF", { "stroke-width": 3 }));
    toks.forEach((t, i) => {
      const r = Math.floor(i / 4);
      const inRow = Math.min(4, toks.length - r * 4);
      const x = ex + ((i % 4) - (inRow - 1) / 2) * 42;
      const y = py - 20 - r * 38;
      if (t.q) {
        s += R(x - 19, y - 17, 38, 34, shapeStyle(P.amberL, { rx: 6, "stroke-width": 2.5 }));
        s += T(x, y, t.text, { size: t.text.length > 3 ? 13 : 17, bold: true, fill: P.navy });
      } else {
        s += C(x, y, 19, shapeStyle(P.tealL, { "stroke-width": 2.5 }));
        s += T(x, y, t.text, { size: t.text.length > 3 ? 12 : 17, bold: true, fill: P.navy });
      }
    });
    return s;
  };
  body += pan(lx, ly, left) + pan(rx, ry, right);
  body += L(lx, ly, rx, ry, { "stroke-width": 9 });
  body += C(cx, pivotY, 10, shapeStyle(P.amber, { "stroke-width": 3 }));
  const sideText = (toks) => (toks.length ? list(toks.map((t) => t.text)) : "nothing");
  let summary = `A balance scale with ${sideText(left)} on the left pan and ${sideText(right)} on the right pan. `;
  if (numeric) {
    const c = sL.cmp(sR);
    summary += `The left side totals ${fmtQ(sL)} and the right side totals ${fmtQ(sR)}, so the scale ${c === 0 ? "is level" : c > 0 ? "tilts down on the left" : "tilts down on the right"}.`;
  } else summary += "The scale is level.";
  return { W, H, body, alt: "Balance scale with tokens on each pan", summary };
};

/* tiles */
KINDS.tiles = (a) => {
  const cnt = (v, name) => int(v ?? 0, name, 0, 12);
  const groups = [
    { key: "x", n: cnt(a.x, "x"), text: "x", w: 30, h: 90, neg: false, name: "x-tile" },
    { key: "negX", n: cnt(a.negX, "negX"), text: `${MINUS}x`, w: 30, h: 90, neg: true, name: "negative x-tile" },
    { key: "one", n: cnt(a.one, "one"), text: "1", w: 30, h: 30, neg: false, name: "unit tile" },
    { key: "negOne", n: cnt(a.negOne, "negOne"), text: `${MINUS}1`, w: 30, h: 30, neg: true, name: "negative unit tile" },
  ].filter((g) => g.n > 0);
  if (!groups.length) fail("there are no tiles to show");
  let x = 16;
  let H = 40;
  let body = "";
  const placed = groups.map((g) => {
    const cols = g.h > 30 ? Math.min(g.n, 6) : Math.min(g.n, 4);
    const rows = Math.ceil(g.n / cols);
    const gw = cols * (g.w + 6) - 6;
    const gh = rows * (g.h + 6) - 6;
    const out = { ...g, cols, rows, gw, gh, x0: x };
    x += gw + 40;
    H = Math.max(H, gh + 40);
    return out;
  });
  const W = x - 40 + 16;
  for (const g of placed) {
    const fill = g.neg ? pat("diag", P.coralL, P.coralM) : g.h > 30 ? P.tealL : P.amberL;
    for (let i = 0; i < g.n; i++) {
      const c = i % g.cols;
      const r = Math.floor(i / g.cols);
      const tx0 = g.x0 + c * (g.w + 6);
      const ty0 = 16 + r * (g.h + 6);
      body += R(tx0, ty0, g.w, g.h, shapeStyle(fill, { "stroke-width": 2.5, rx: 3 }));
      body += T(tx0 + g.w / 2, ty0 + g.h / 2, g.text, { size: g.h > 30 ? 19 : 16, bold: true, fill: P.navy, halo: g.neg });
    }
  }
  const summary = `Algebra tiles: ${list(groups.map((g) => `${g.n} ${g.n === 1 ? g.name : `${g.name}s`}`))}. Tall rectangles are x-tiles, small squares are unit tiles, and striped tiles are negative.`;
  return { W, H: H + 16, body, alt: "Algebra tiles", summary };
};

/* scatter */
KINDS.scatter = (a) => {
  const xminV = val(a.xmin, "xmin");
  const xmaxV = val(a.xmax, "xmax");
  const yminV = val(a.ymin, "ymin");
  const ymaxV = val(a.ymax, "ymax");
  const xmin = xminV.q.num();
  const xmax = xmaxV.q.num();
  const ymin = yminV.q.num();
  const ymax = ymaxV.q.num();
  if (xmin >= xmax || ymin >= ymax) fail("xmin must be less than xmax and ymin less than ymax");
  if (!Array.isArray(a.points) || !a.points.length) fail("points must be a non-empty array");
  const xs = niceStep(xmax - xmin, 10);
  const ys = niceStep(ymax - ymin, 8);
  const mk = (lo, hi, step) => {
    const out = [];
    for (let i = Math.ceil(lo / step - 1e-9); i <= Math.floor(hi / step + 1e-9); i++) out.push({ v: i * step, text: fmtNum(Math.round(i * step * 1e6) / 1e6), label: true });
    return out;
  };
  const xLabel = a.xLabel ? String(a.xLabel) : "";
  const yLabel = a.yLabel ? String(a.yLabel) : "";
  const fr = plotFrame({ xmin, xmax, ymin, ymax, pw: 440, ph: 320, xt: mk(xmin, xmax, xs), yt: mk(ymin, ymax, ys), zero: false, xLabel, yLabel, ml: yLabel ? 76 : 62 });
  let body = fr.body;
  const pts = a.points.map((p, i) => {
    const x = val(p.x, `points[${i}].x`);
    const y = val(p.y, `points[${i}].y`);
    const xn = x.q.num();
    const yn = y.q.num();
    if (xn < xmin - 1e-9 || xn > xmax + 1e-9 || yn < ymin - 1e-9 || yn > ymax + 1e-9) fail(`points[${i}] (${x.text}, ${y.text}) is outside the window`);
    return { x, y };
  });
  let lineSum = "";
  if (a.line) {
    const m = val(a.line.m, "line.m");
    const b = val(a.line.b ?? 0, "line.b");
    const seg = clipLine(xmin, m.q.num() * xmin + b.q.num(), xmax, m.q.num() * xmax + b.q.num(), xmin, xmax, ymin, ymax);
    if (seg) body += L(fr.px(seg[0]), fr.py(seg[1]), fr.px(seg[2]), fr.py(seg[3]), { stroke: P.coral, "stroke-width": 4, "stroke-dasharray": "10 6" });
    lineSum = ` A line ${lineEq(m, b)} is drawn on the plot.`;
  }
  for (const p of pts) body += C(fr.px(p.x.q.num()), fr.py(p.y.q.num()), 6.5, shapeStyle(P.blue, { "stroke-width": 2.5 }));
  const listPts = pts.map((p) => `(${p.x.text}, ${p.y.text})`);
  const summary = `A scatter plot of ${pts.length} ${plural(pts.length, "point")}${xLabel ? `, with x showing ${xLabel}` : ""}${yLabel ? ` and y showing ${yLabel}` : ""}. The x axis goes from ${xminV.text} to ${xmaxV.text} and the y axis from ${yminV.text} to ${ymaxV.text}. Points: ${listPts.join(", ")}.${lineSum}`;
  return { W: fr.W, H: fr.H, body, alt: `Scatter plot of ${pts.length} points${xLabel && yLabel ? `: ${yLabel} against ${xLabel}` : ""}`, summary };
};

/* spinner */
KINDS.spinner = (a) => {
  if (!Array.isArray(a.sections) || a.sections.length < 2 || a.sections.length > 12) fail("sections must be an array of 2 to 12 sections");
  const secs = a.sections.map((s, i) => {
    if (!s || s.label === undefined || s.label === null) fail(`sections[${i}] needs a label`);
    const w = val(s.weight ?? 1, `sections[${i}].weight`);
    if (w.q.n <= 0) fail(`sections[${i}].weight must be positive`);
    return { label: String(s.label), w };
  });
  const total = secs.reduce((s, x) => s.add(x.w.q), Qi(0));
  const W = 560;
  const H = 320;
  const cx = 280;
  const cy = 160;
  const r = 124;
  const looks = [
    [P.tealL, null],
    [P.amberL, "diag"],
    [P.blueL, "dots"],
    [P.coralL, "cross"],
    ["#FFFFFF", "hline"],
    [P.tealM, "diag"],
    [P.amberM, "dots"],
    [P.blueM, "cross"],
  ];
  let body = "";
  let start = 0;
  const lbls = [];
  secs.forEach((s, i) => {
    const frac = s.w.q.div(total).num();
    const sweep = frac * 360;
    const p1 = [cx + r * Math.sin((start * Math.PI) / 180), cy - r * Math.cos((start * Math.PI) / 180)];
    const p2 = [cx + r * Math.sin(((start + sweep) * Math.PI) / 180), cy - r * Math.cos(((start + sweep) * Math.PI) / 180)];
    const [bg, pt] = looks[i % looks.length];
    const fill = pt ? pat(pt, bg, bg === "#FFFFFF" ? P.mute : P.navy) : bg;
    body += PATH(`M ${cx} ${cy} L ${n2(p1[0])} ${n2(p1[1])} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${n2(p2[0])} ${n2(p2[1])} Z`, shapeStyle(fill, { "stroke-width": 3 }));
    lbls.push({ label: s.label, mid: start + sweep / 2, sweep });
    start += sweep;
  });
  for (const l of lbls) {
    const ang = (l.mid * Math.PI) / 180;
    const sz = l.label.length > 9 ? 13 : 16;
    if (l.sweep >= 38) {
      const rr = r * 0.7;
      const x = cx + rr * Math.sin(ang);
      const y = cy - rr * Math.cos(ang);
      const wLab = tw(l.label, sz) + 10;
      body += R(x - wLab / 2, y - 12, wLab, 24, { fill: "#FFFFFF", "fill-opacity": 0.92, rx: 5 });
      body += T(x, y, l.label, { size: sz, bold: true, fill: P.navy });
    } else {
      const x = cx + (r + 18) * Math.sin(ang);
      const y = cy - (r + 18) * Math.cos(ang);
      body += T(x, y, l.label, { size: 15, bold: true, fill: P.navy, anchor: Math.sin(ang) >= 0 ? "start" : "end" });
    }
  }
  const mid = lbls[0].mid;
  const ang = (mid * Math.PI) / 180;
  const tipX = cx + r * 0.36 * Math.sin(ang);
  const tipY = cy - r * 0.36 * Math.cos(ang);
  body += L(cx, cy, tipX, tipY, { stroke: P.navy, "stroke-width": 7 });
  body += arrowHead(tipX, tipY, Math.sin(ang), -Math.cos(ang), 20, P.navy);
  body += C(cx, cy, 13, shapeStyle(P.amber, { "stroke-width": 3 }));
  const equal = secs.every((s) => s.w.q.cmp(secs[0].w.q) === 0);
  const names = secs.map((s) => s.label);
  const summary = equal
    ? `A spinner with ${secs.length} equal sections: ${list(names)}.`
    : `A spinner with ${secs.length} sections of different sizes. The sizes are in proportion: ${secs.map((s) => `${s.label} ${s.w.text}`).join(", ")}.`;
  return { W, H, body, alt: `Spinner with ${secs.length} sections`, summary };
};

/* ruler */
KINDS.ruler = (a) => {
  const unit = a.unit ?? "cm";
  if (!["cm", "in"].includes(unit)) fail(`unit must be "cm" or "in", got ${show(unit)}`);
  const length = int(a.length, "length", 1, unit === "cm" ? 30 : 12);
  const per = unit === "cm" ? 10 : 16;
  const from = val(a.objectFrom ?? 0, "objectFrom");
  const hasObj = a.objectTo !== undefined && a.objectTo !== null;
  const to = hasObj ? val(a.objectTo, "objectTo") : null;
  if (hasObj) {
    for (const [v, nm] of [[from, "objectFrom"], [to, "objectTo"]]) {
      if (v.q.n < 0 || v.q.cmp(Qi(length)) > 0) fail(`${nm} (${v.text}) is outside the ruler (0 to ${length})`);
      if (!v.q.mul(Qi(per)).isInt()) fail(`${nm} (${v.text}) is not on a ${unit === "cm" ? "millimeter" : "sixteenth-inch"} mark`);
    }
    if (from.q.cmp(to.q) >= 0) fail("objectTo must be greater than objectFrom");
  }
  const ppu = Math.floor(unit === "cm" ? Math.min(52, 500 / length) : Math.min(100, 500 / length));
  const x0 = 40;
  const lenPx = ppu * length;
  const W = x0 * 2 + lenPx;
  const objH = hasObj ? 92 : 20;
  const rt = objH; // ruler top
  const rh = 78;
  const H = rt + rh + 24;
  let body = R(x0 - 14, rt, lenPx + 28, rh, shapeStyle(P.amberL, { "stroke-width": 3, rx: 6 }));
  const total = length * per;
  for (let i = 0; i <= total; i++) {
    const x = x0 + (i * lenPx) / total;
    let len;
    if (unit === "cm") len = i % 10 === 0 ? 30 : i % 5 === 0 ? 22 : 14;
    else len = i % 16 === 0 ? 32 : i % 8 === 0 ? 26 : i % 4 === 0 ? 20 : i % 2 === 0 ? 14 : 9;
    body += L(x, rt, x, rt + len, { "stroke-width": i % per === 0 ? 2.5 : 1.5, "stroke-linecap": "butt" });
    if (i % per === 0) body += T(x, rt + 52, String(i / per), { size: 17, bold: true, fill: P.navy });
  }
  body += T(x0 + lenPx - 4, rt + rh - 12, unit, { size: 14, bold: true, fill: P.navy, anchor: "end" });
  let summary = `A ruler in ${unit === "cm" ? "centimeters" : "inches"} marked from 0 to ${length}, with ${unit === "cm" ? "millimeter" : "sixteenth-inch"} marks.`;
  if (hasObj) {
    const xa = x0 + (from.q.num() * lenPx) / length;
    const xb = x0 + (to.q.num() * lenPx) / length;
    for (const x of [xa, xb]) body += L(x, 36, x, rt + rh - 4, { stroke: P.coral, "stroke-width": 1.5, "stroke-dasharray": "5 4" });
    body += R(xa, 38, xb - xa, 36, shapeStyle(P.blueL, { "stroke-width": 3, rx: 6 }));
    const fm = unit === "in";
    const ft = fm ? fmtQ(from.q, true) : from.text;
    const tt = fm ? fmtQ(to.q, true) : to.text;
    summary += ` An object sits along the ruler, starting at ${ft} ${unit} and ending at ${tt} ${unit}.`;
  }
  return { W, H, body, alt: `Ruler in ${unit === "cm" ? "centimeters" : "inches"}${hasObj ? " with an object to measure" : ""}`, summary };
};

/* machine */
function evalRule(rule, x) {
  const src = rule.replace(/[−–]/g, "-").replace(/[×*]/g, "*").replace(/[÷]/g, "/").replace(/²/g, "^2").replace(/³/g, "^3");
  const vars = src.match(/[a-z]/gi) || [];
  if (new Set(vars.map((v) => v.toLowerCase())).size > 1) return null;
  const toks = src.match(/\d+\.\d+|\d+|[a-z]|[-+*/^()]|\s+/gi);
  if (!toks || toks.join("") !== src) return null;
  const t = toks.filter((k) => !/^\s+$/.test(k));
  let i = 0;
  let ok = true;
  const peek = () => t[i];
  const isVar = (k) => /^[a-z]$/i.test(k);
  const atom = () => {
    const k = t[i++];
    if (k === undefined) {
      ok = false;
      return Qi(0);
    }
    if (k === "(") {
      const v = expr();
      if (t[i++] !== ")") ok = false;
      return v;
    }
    if (k === "-") return atom().neg();
    if (isVar(k)) return x;
    if (/^\d/.test(k)) return k.includes(".") ? decToQ(k) : Qi(Number(k));
    ok = false;
    return Qi(0);
  };
  const power = () => {
    let b = atom();
    while (peek() === "^") {
      i++;
      const e = atom();
      if (!e.isInt() || e.n < 0 || e.n > 6) {
        ok = false;
        return b;
      }
      let r = Qi(1);
      for (let k = 0; k < e.n; k++) r = r.mul(b);
      b = r;
    }
    return b;
  };
  const term = () => {
    let v = power();
    for (;;) {
      const k = peek();
      if (k === "*" || k === "/") {
        i++;
        const r = power();
        if (k === "/" && r.n === 0) {
          ok = false;
          return v;
        }
        v = k === "*" ? v.mul(r) : v.div(r);
      } else if (k !== undefined && (isVar(k) || k === "(" || /^\d/.test(k))) v = v.mul(power());
      else return v;
    }
  };
  function expr() {
    let v = term();
    for (;;) {
      const k = peek();
      if (k === "+") {
        i++;
        v = v.add(term());
      } else if (k === "-") {
        i++;
        v = v.sub(term());
      } else return v;
    }
  }
  const out = expr();
  return ok && i === t.length ? out : null;
}
KINDS.machine = (a) => {
  const ruleHidden = isHidden(a.rule) || String(a.rule).trim() === "?";
  const inHidden = isHidden(a.input);
  const outHidden = isHidden(a.output);
  const input = inHidden ? null : val(a.input, "input");
  const output = outHidden ? null : val(a.output, "output");
  const rule = ruleHidden ? "?" : String(a.rule).trim().replace(/ \* /g, ` ${TIMES} `).replace(/ \/ /g, ` ${DIVIDE} `).replace(/ - /g, ` ${MINUS} `);
  if (!ruleHidden && input && output) {
    const got = evalRule(String(a.rule), input.q);
    if (got && got.cmp(output.q) !== 0) fail(`the rule ${show(a.rule)} turns ${input.text} into ${fmtQ(got)}, not ${output.text}`);
  }
  const W = 600;
  const H = 250;
  let body = "";
  const bx = 210;
  const by = 62;
  const bw = 180;
  const bh = 112;
  body += L(86, 118, bx - 2, 118, { "stroke-width": 4 }) + arrowHead(bx - 2, 118, 1, 0, 14);
  body += L(bx + bw + 2, 118, 512, 118, { "stroke-width": 4 }) + arrowHead(512, 118, 1, 0, 14);
  body += R(bx, by, bw, bh, shapeStyle(P.navy, { rx: 14, "stroke-width": 3 }));
  body += C(bx + 30, by - 4, 17, { fill: P.tealL, stroke: P.navy, "stroke-width": 7, "stroke-dasharray": "5 4" });
  body += C(bx + bw - 30, by - 4, 17, { fill: P.amberL, stroke: P.navy, "stroke-width": 7, "stroke-dasharray": "5 4" });
  body += T(bx + bw / 2, by + 24, "Rule", { size: 14, bold: true, fill: P.amberM });
  body += T(bx + bw / 2, by + 66, rule, { size: rule.length > 10 ? 22 : 30, bold: true, fill: ruleHidden ? P.amberM : "#FFFFFF" });
  const token = (cx, hidden, v, fill) => {
    let s = "";
    if (hidden) {
      s += R(cx - 38, 88, 76, 60, { fill: "#FFFFFF", stroke: P.navy, "stroke-width": 3, "stroke-dasharray": "8 5", rx: 10 });
      s += T(cx, 118, "?", { size: 32, bold: true, fill: P.mute });
    } else {
      s += R(cx - 38, 88, 76, 60, shapeStyle(fill, { rx: 10, "stroke-width": 3 }));
      s += T(cx, 118, v.text, { size: v.text.length > 5 ? 20 : 28, bold: true, fill: P.navy });
    }
    return s;
  };
  body += token(46, inHidden, input, P.amberL);
  body += token(554, outHidden, output, P.tealL);
  body += T(46, 182, "Input", { size: 16, bold: true, fill: P.navy });
  body += T(554, 182, "Output", { size: 16, bold: true, fill: P.navy });
  const t = (hid, v) => (hid ? "unknown" : v.text);
  const summary = `A function machine. The input is ${t(inHidden, input)}. The rule is ${ruleHidden ? "unknown" : rule}. The output is ${t(outHidden, output)}.`;
  return { W, H, body, alt: "Function machine with an input, a rule and an output", summary };
};

/* ---------------------------------------------------------------- entry point */

/** All supported kinds. */
export const VISUAL_KINDS = Object.keys(KINDS);

/**
 * Render a visual. Throws an Error naming the kind when the arguments are impossible.
 * @param {{kind: string, alt?: string}} spec
 * @returns {{svg: string, alt: string, summary: string}}
 */
export function renderVisual(spec) {
  KIND = "";
  if (!spec || typeof spec !== "object") fail("spec must be an object with a kind");
  const kind = spec.kind;
  KIND = String(kind);
  if (!Object.hasOwn(KINDS, kind)) fail(`unknown kind; expected one of ${VISUAL_KINDS.join(", ")}`);
  DEFS = new Map();
  const r = KINDS[kind](spec);
  const alt = typeof spec.alt === "string" && spec.alt.trim() ? spec.alt.trim() : r.alt;
  const svg = wrapSvg(r.W, r.H, r.body, alt, r.summary);
  DEFS = null;
  return { svg, alt, summary: r.summary };
}

/** Small helpers for the check tool. */
export const __test = { val, fmtQ, fmtDecQ, fmtNum, evalRule, Q };
