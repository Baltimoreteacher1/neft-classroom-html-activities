// Per-step visual models for the "Build the idea" worked example (Level 1 /
// group1 studios only). Each worked step is a short line of math; this module
// derives a small, canonical visual model from that line's OWN stated math —
// an array for a product, a fraction bar for a fraction, a plotted point for an
// ordered pair, a number-line jump for a sum, an equal-groups bar for a rate —
// so support-tier students get a concrete picture beside every step.
//
// Design rule (matches small-group-visual-practice.js): we never *guess* a
// domain chart from scraped numbers. We only draw models whose correctness is
// fixed by the step's explicit operands (a × b, n/d, (x, y), a ÷ b, a ± b). If
// the line has no such relation we return a light "relation card" that simply
// typesets the step's equation with a highlighted result — still a visual
// anchor, never a misleading chart.

import { el, esc } from "./small-group-ui.js";

const num = (t) => Number(String(t).replace(/[$,]/g, ""));
const isInt = (n) => Number.isInteger(n);

// Pull the headline relation out of a worked step. Tries the most specific
// pattern first so "12 = 2 × 2 × 3" reads as a factorization, not a bare "=".
function parseRelation(line) {
  const raw = String(line || "");
  const text = raw.replace(/\s+/g, " ").trim();

  // 1) Ordered pair — "(1, 2)", optionally "right 1, up 2".
  const pair = text.match(/\((\d+)\s*,\s*(\d+)\)/);
  if (pair) return { kind: "point", x: Number(pair[1]), y: Number(pair[2]) };

  // 1b) Mixed → improper conversion — "so 2 1/2 = 5/2". This is the POINT of a
  //     rewrite step, so it outranks any incidental "2 × 2 = 4" inside the line.
  const convert = text.match(/(\d+)\s+(\d+)\/(\d+)\s*=\s*(\d+)\/(\d+)/);
  if (convert) {
    const [, whole, part, den, imp, den2] = convert.map(Number);
    if (den === den2 && whole * den + part === imp)
      return { kind: "convert", whole, part, den, improper: imp };
  }

  // NOTE: we deliberately do NOT model fraction × / ÷ steps (e.g. "7/2 × 4/1")
  // as bars. A bar picture of one fraction times/divided-by another doesn't
  // explain the operation — it reads as clutter. Fraction quantities only earn
  // a visual where the picture IS the idea (the mixed→improper convert above).

  // 3) Factorization — a number equal to a product of 2+ factors, written
  //    either way round ("60 = 6 × 10" or "2 × 2 × 3 × 5 = 60"). We ONLY accept
  //    it when the factors actually multiply to the parent, so a partial slice
  //    of a longer chain can never render a wrong picture.
  const parseChain = (parentTok, chainTok) => {
    const parent = num(parentTok);
    const factors = chainTok
      .split(/[×x*]/)
      .map((t) => num(t))
      .filter(isInt);
    if (!isInt(parent) || factors.length < 2 || factors.some((f) => f <= 0)) return null;
    if (factors.reduce((p, f) => p * f, 1) !== parent) return null;
    return { kind: "split", parent, factors };
  };
  const fwdFactor = text.match(/(\d+)\s*=\s*(\d+(?:\s*[×x*]\s*\d+){1,})/);
  if (fwdFactor) {
    const rel = parseChain(fwdFactor[1], fwdFactor[2]);
    if (rel) return rel;
  }
  const revFactor = text.match(/(\d+(?:\s*[×x*]\s*\d+){1,})\s*=\s*(\d+)/);
  if (revFactor) {
    const rel = parseChain(revFactor[2], revFactor[1]);
    // "a × b = c" (two factors) reads better as an area model — building a
    // product — than as a decomposition tree. Keep the tree for 3+ factors.
    if (rel && rel.factors.length === 2)
      return { kind: "array", a: rel.factors[0], b: rel.factors[1], c: rel.parent };
    if (rel) return rel;
  }

  // 4) Forward product — "a × b = c" (only when a·b really equals c).
  const product = text.match(/(\d+)\s*[×x*]\s*(\d+)\s*=\s*(\d+)/);
  if (product) {
    const a = Number(product[1]);
    const b = Number(product[2]);
    const c = Number(product[3]);
    if (a * b === c) return { kind: "array", a, b, c };
  }

  // 5) Rate / division — "$3 ÷ 5 = $0.60" (verified total ÷ groups = each).
  const quotient = text.match(
    /\$?(\d+(?:\.\d+)?)\s*÷\s*\$?(\d+(?:\.\d+)?)\s*=\s*\$?(\d+(?:\.\d+)?)/,
  );
  if (quotient) {
    const total = num(quotient[1]);
    const groups = num(quotient[2]);
    const each = num(quotient[3]);
    if (groups > 0 && Math.abs(total / groups - each) < 0.01)
      return { kind: "rate", total, groups, each, money: /\$/.test(text) };
  }

  // 6) Sum or difference — "150 + 12 = 162" (verified a ± b = c).
  const addsub = text.match(/(\d+)\s*([+\-−])\s*(\d+)\s*=\s*(\d+)/);
  if (addsub) {
    const a = Number(addsub[1]);
    const b = Number(addsub[3]);
    const c = Number(addsub[4]);
    const minus = addsub[2] !== "+";
    if ((minus ? a - b : a + b) === c) return { kind: "line", a, b, c, minus };
  }

  // 7) Bare product with no result — "You might say 3 × 4". Only on lines with
  //    no "=" at all, so we never model a slice of a false/complex equation.
  if (!text.includes("=")) {
    const bare = text.match(/(\d+)\s*[×x*]\s*(\d+)(?!\s*[×x*])/);
    if (bare) return { kind: "array", a: Number(bare[1]), b: Number(bare[2]), c: null };
  }

  // No clearly-illustrative model applies → no visual. A step earns a picture
  // only when the picture genuinely explains it; anything else is left as text.
  return null;
}

function svg(label, w, h, body) {
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}

// a × b as a labeled area model: one clean rectangle with the two factors on
// its sides and the product beside it. No dot grids (they read as clutter, not
// as a model), so it scales cleanly to large factors too.
function arrayModel({ a, b, c }) {
  const label = `Area model: ${a} by ${b}${c != null ? ` equals ${c}` : ""}`;
  const w = 330;
  const h = 132;
  const rw = 150;
  const rh = 84;
  const x = 30;
  const y = 28;
  const product = c != null ? c : a * b;
  return svg(
    label,
    w,
    h,
    `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="10" fill="color-mix(in srgb,var(--sg) 20%,white)" stroke="var(--sg)" stroke-width="2.5"/>
     <text x="${x + rw / 2}" y="${y - 9}" text-anchor="middle" font-size="19" font-weight="800" fill="var(--sg-deep)">${a}</text>
     <text x="${x - 12}" y="${y + rh / 2 + 6}" text-anchor="end" font-size="19" font-weight="800" fill="var(--sg-deep)">${b}</text>
     <text x="${x + rw + 22}" y="${y + rh / 2 + 7}" font-size="23" font-weight="900" fill="var(--sg-text)">= ${product}</text>`,
  );
}

// One fraction drawn as a single horizontal row: whole-unit tiles + a
// partitioned remainder tile. Integer values (4/1, 28/2 = 14) collapse to a
// single numeral tile instead of a wall of shaded units. Returns {markup, width}
// so the model can flow left-to-right.
// Mixed number → improper fraction: W whole bars (each cut into `den` equal
// parts, all shaded) + a remainder bar with `part` shaded, so students SEE why
// 2 1/2 is 5 halves. States the rewrite plainly in a caption.
function convertModel({ whole, part, den, improper }) {
  const cw = 22;
  const th = 30;
  const y = 40;
  const gap = 8;
  const wholesDrawn = Math.min(whole, 6);
  let x = 16;
  let out = `<text x="16" y="24" font-size="15" font-weight="800" fill="var(--sg-muted)">Rewrite ${whole} ${part}/${den} as ${improper}/${den}</text>`;
  for (let w = 0; w < wholesDrawn; w++) {
    for (let i = 0; i < den; i++)
      out += `<rect x="${x + i * cw}" y="${y}" width="${cw}" height="${th}" fill="var(--sg)" stroke="#fff" stroke-width="1.5"/>`;
    x += den * cw + gap;
  }
  for (let i = 0; i < den; i++)
    out += `<rect x="${x + i * cw}" y="${y}" width="${cw}" height="${th}" fill="${i < part ? "var(--sg)" : "#fff"}" stroke="var(--sg-line)" stroke-width="1.5"/>`;
  x += den * cw + 16;
  out += `<text x="${x}" y="${y + th / 2 + 7}" font-size="21" font-weight="900" fill="var(--sg-deep)">= ${improper}/${den}</text>`;
  return svg(`Rewrite ${whole} and ${part}/${den} as ${improper}/${den}`, x + 96, y + th + 16, out);
}

// n = f1 × f2 (× f3) as a parent node branching into factor leaves.
function splitModel({ parent, factors }) {
  const leaves = factors.slice(0, 5);
  const w = Math.max(260, leaves.length * 70 + 40);
  const h = 132;
  const cx = w / 2;
  let out = `<circle cx="${cx}" cy="26" r="22" fill="var(--sg)"/><text x="${cx}" y="33" text-anchor="middle" font-size="18" font-weight="900" fill="white">${parent}</text>`;
  const gap = (w - 40) / leaves.length;
  leaves.forEach((f, i) => {
    const lx = 20 + gap * i + gap / 2;
    const prime = isPrime(f);
    out += `<line x1="${cx}" y1="46" x2="${lx}" y2="94" stroke="var(--sg-line)" stroke-width="2.5"/>`;
    out += `<circle cx="${lx}" cy="106" r="20" fill="${prime ? "var(--sg-good)" : "color-mix(in srgb,var(--sg-warn) 30%,white)"}" stroke="${prime ? "var(--sg-good)" : "var(--sg-warn)"}" stroke-width="2.5"/>`;
    out += `<text x="${lx}" y="112" text-anchor="middle" font-size="16" font-weight="900" fill="${prime ? "white" : "var(--sg-warn)"}">${f}</text>`;
  });
  return svg(`Factor split: ${parent} into ${leaves.join(", ")}`, w, h, out);
}

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

// Ordered pair (x, y) plotted on a small first-quadrant grid.
function pointModel({ x, y }) {
  const maxN = Math.max(x, y, 3) + 1;
  const size = 128;
  const pad = 24;
  const step = (size - pad) / maxN;
  const ox = pad;
  const oy = size;
  let grid = "";
  for (let i = 0; i <= maxN; i++) {
    const gx = ox + i * step;
    const gy = oy - i * step;
    grid += `<line x1="${ox}" y1="${gy}" x2="${ox + maxN * step}" y2="${gy}" stroke="var(--sg-line)" stroke-width="1"/>`;
    grid += `<line x1="${gx}" y1="${oy}" x2="${gx}" y2="${oy - maxN * step}" stroke="var(--sg-line)" stroke-width="1"/>`;
  }
  const px = ox + x * step;
  const py = oy - y * step;
  const axes = `<line x1="${ox}" y1="${oy}" x2="${ox + maxN * step}" y2="${oy}" stroke="var(--sg-text)" stroke-width="2.5"/><line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy - maxN * step}" stroke="var(--sg-text)" stroke-width="2.5"/>`;
  const path = `<line x1="${ox}" y1="${oy}" x2="${px}" y2="${oy}" stroke="var(--sg)" stroke-width="2.5" stroke-dasharray="4 3"/><line x1="${px}" y1="${oy}" x2="${px}" y2="${py}" stroke="var(--sg)" stroke-width="2.5" stroke-dasharray="4 3"/>`;
  const dot = `<circle cx="${px}" cy="${py}" r="7" fill="var(--sg-deep)"/><text x="${px + 10}" y="${py - 6}" font-size="15" font-weight="800" fill="var(--sg-deep)">(${x}, ${y})</text>`;
  return svg(`Plotted point ${x}, ${y}`, size + 90, size + 16, `${grid}${axes}${path}${dot}`);
}

// total ÷ groups = each → equal-groups bar split into `groups` equal pieces.
function rateModel({ total, groups, each, money }) {
  const g = Math.min(groups, 12);
  const barW = 300;
  const x = 16;
  const y = 34;
  const pieceW = barW / g;
  const fmt = (v) => (money ? `$${v}` : `${v}`);
  let pieces = "";
  for (let i = 0; i < g; i++)
    pieces += `<rect x="${x + i * pieceW}" y="${y}" width="${pieceW}" height="30" fill="${i % 2 ? "color-mix(in srgb,var(--sg) 30%,white)" : "color-mix(in srgb,var(--sg) 55%,white)"}" stroke="var(--sg)" stroke-width="1.5"/>`;
  return svg(
    `Equal groups: ${fmt(total)} shared into ${groups} equal parts of ${fmt(each)}`,
    barW + 40,
    100,
    `<text x="${x}" y="24" font-size="15" font-weight="800" fill="var(--sg-text)">${fmt(total)} total</text>
     ${pieces}
     <text x="${x + barW / 2}" y="${y + 50}" text-anchor="middle" font-size="16" font-weight="800" fill="var(--sg-deep)">${groups} equal parts → ${fmt(each)} each</text>`,
  );
}

// a ± b = c as a jump along a number line.
function lineModel({ a, b, c, minus }) {
  const lo = Math.min(a, c, 0);
  const hi = Math.max(a, c, b);
  const span = hi - lo || 1;
  const w = 340;
  const pad = 24;
  const usable = w - pad * 2;
  const X = (v) => pad + ((v - lo) / span) * usable;
  const y = 60;
  const start = minus ? a : a;
  const endV = c;
  const arcTop = y - 28;
  const midX = (X(start) + X(endV)) / 2;
  return svg(
    `Number line jump: ${a} ${minus ? "minus" : "plus"} ${b} equals ${c}`,
    w,
    92,
    `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="var(--sg-text)" stroke-width="2.5"/>
     <circle cx="${X(start)}" cy="${y}" r="6" fill="var(--sg)"/>
     <text x="${X(start)}" y="${y + 22}" text-anchor="middle" font-size="14" font-weight="800" fill="var(--sg-text)">${a}</text>
     <path d="M ${X(start)} ${y} Q ${midX} ${arcTop} ${X(endV)} ${y}" fill="none" stroke="var(--sg-deep)" stroke-width="2.5"/>
     <text x="${midX}" y="${arcTop - 2}" text-anchor="middle" font-size="14" font-weight="800" fill="var(--sg-deep)">${minus ? "−" : "+"}${b}</text>
     <circle cx="${X(endV)}" cy="${y}" r="7" fill="var(--sg-good)"/>
     <text x="${X(endV)}" y="${y + 22}" text-anchor="middle" font-size="15" font-weight="900" fill="var(--sg-good)">${c}</text>`,
  );
}

const RENDERERS = {
  array: arrayModel,
  convert: convertModel,
  split: splitModel,
  point: pointModel,
  rate: rateModel,
  line: lineModel,
};

// Public: build the visual-model element for one Build step, or null when the
// line carries no drawable math (pure talk/instruction lines).
export function buildStepVisual(line) {
  const relation = parseRelation(line);
  if (!relation) return null;
  const render = RENDERERS[relation.kind];
  if (!render) return null;
  let markup;
  try {
    markup = render(relation);
  } catch {
    return null;
  }
  if (!markup) return null;
  const host = el("figure", "sg-step-visual", markup);
  host.setAttribute("aria-hidden", "false");
  return host;
}
