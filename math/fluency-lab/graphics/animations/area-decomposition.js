// Area model: 13 x 7 = 10 x 7 + 3 x 7, decimals such as 3.4 x 2, and (x + 3)(x + 5) = x^2 + 8x + 15.
// Config: { kind: "number", a, b, splitA: "auto" | false | number, splitB: same (default false), lang }
//      or { kind: "algebra", a: {x: 1-9, c: 1-9}, b: {x: 1-9, c: 1-9}, lang }.
import { cap, label, line, rect } from "./anim-kit.js";
import { createPlayer } from "./player.js";

const C = {
  title: "Area model: breaking a product into easier partial products",
  whole: "{A} × {B} is the area of a rectangle with sides {A} and {B}.",
  splitA: "Split {A} into {parts}. The rectangle now has parts side by side.",
  splitB: "Split {B} into {parts}. The rectangle now has parts stacked up and down.",
  part: "Find the area of the highlighted part: {aj} × {bi} = {pp}.",
  sum: "Add the areas of all the parts: {sum} = {total}. So {A} × {B} = {total}.",
  sumAlg: "Add the areas of all the parts: {sum}.",
  combine: "Combine like terms: {sum} = {total}. So ({A})({B}) = {total}.",
};
export const KEYS = Object.values(C);

const FRAME = { x: 84, y: 56, w: 368, h: 190, min: 56 };
const XUNIT = 5;
const SCALE = 100;
const fmt = (scaled, scale) => {
  const whole = Math.floor(scaled / scale);
  const frac = String(scaled % scale).padStart(String(scale).length - 1, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : String(whole);
};
const parseDec = (value) => {
  const text = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  const m = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(text);
  if (!m) return null;
  const scaled = Number(m[1]) * SCALE + Number((m[2] || "").padEnd(2, "0"));
  return scaled > 0 ? scaled : null;
};

function autoSplit(scaled) {
  const whole = Math.floor(scaled / SCALE);
  const frac = scaled % SCALE;
  if (whole > 0 && frac > 0) return [whole * SCALE, frac];
  if (frac === 0 && whole >= 10) {
    const p = 10 ** (String(whole).length - 1);
    const lead = Math.floor(whole / p) * p;
    return lead < whole ? [lead * SCALE, (whole - lead) * SCALE] : [scaled];
  }
  return [scaled];
}
function splitFactor(scaled, option, byDefault) {
  if (option === false) return [scaled];
  if (typeof option === "number" || typeof option === "string") {
    const p = parseDec(option);
    if (p && p < scaled) return [p, scaled - p];
  }
  return byDefault === "auto" || option === "auto" ? autoSplit(scaled) : [scaled];
}

export function normalizeConfig(config = {}) {
  if (config.kind === "algebra") {
    const read = (f, dc) => {
      const x = Number.isInteger(f?.x) && f.x >= 1 && f.x <= 9 ? f.x : dc.x;
      const c = Number.isInteger(f?.c) && f.c >= 1 && f.c <= 9 ? f.c : dc.c;
      return { x, c };
    };
    return { kind: "algebra", a: read(config.a, { x: 1, c: 3 }), b: read(config.b, { x: 1, c: 5 }) };
  }
  const a = parseDec(config.a) ?? 1300;
  const b = parseDec(config.b) ?? 700;
  const bothOk = parseDec(config.a) && parseDec(config.b);
  const A = bothOk ? a : 1300;
  const B = bothOk ? b : 700;
  return {
    kind: "number",
    a: A,
    b: B,
    partsA: splitFactor(A, config.splitA ?? "auto", "auto"),
    partsB: splitFactor(B, config.splitB ?? false, false),
  };
}

const termText = (coef, power) => {
  if (power === 0) return String(coef);
  const c = coef === 1 ? "" : String(coef);
  return power === 1 ? `${c}x` : `${c}x²`;
};
function widthsFor(units, total) {
  const sum = units.reduce((s, u) => s + u, 0);
  const raw = units.map((u) => (u / sum) * total);
  const small = raw.filter((w) => w < FRAME.min).length;
  if (!small) return raw;
  const bigUnits = units.filter((_, i) => raw[i] >= FRAME.min).reduce((s, u) => s + u, 0);
  const rest = total - small * FRAME.min;
  return raw.map((w, i) => (w < FRAME.min ? FRAME.min : (units[i] / bigUnits) * rest));
}

// Describe both factors as parts: { text, units, c1, c0 } where value = c1 x + c0 (c1 = 0 for numbers).
function factorsFor(cfg) {
  if (cfg.kind === "algebra") {
    const make = (f) => [
      { text: termText(f.x, 1), units: f.x * XUNIT, c1: f.x, c0: 0 },
      { text: termText(f.c, 0), units: f.c, c1: 0, c0: f.c },
    ];
    return { A: make(cfg.a), B: make(cfg.b), scale: 1, algebra: true };
  }
  const make = (parts) => parts.map((v) => ({ text: fmt(v, SCALE), units: v, c1: 0, c0: v }));
  return { A: make(cfg.partsA), B: make(cfg.partsB), scale: SCALE, algebra: false };
}

function productOf(p, q, algebra) {
  if (!algebra) return { c: p.c0 * q.c0, power: 0, text: fmt(p.c0 * q.c0, SCALE * SCALE) };
  const power = (p.c1 ? 1 : 0) + (q.c1 ? 1 : 0);
  const c = (p.c1 || p.c0) * (q.c1 || q.c0);
  return { c, power, text: termText(c, power) };
}

export function buildModel(config = {}) {
  const cfg = normalizeConfig(config);
  const { A, B, algebra } = factorsFor(cfg);
  const joined = (parts) => parts.map((p) => p.text).join(" + ");
  const wholeA = algebra ? `${termText(cfg.a.x, 1)} + ${cfg.a.c}` : fmt(cfg.a, SCALE);
  const wholeB = algebra ? `${termText(cfg.b.x, 1)} + ${cfg.b.c}` : fmt(cfg.b, SCALE);
  const colW = widthsFor(A.map((p) => p.units), FRAME.w);
  const rowH = widthsFor(B.map((p) => p.units), FRAME.h);
  const colX = colW.map((_, j) => FRAME.x + colW.slice(0, j).reduce((s, v) => s + v, 0));
  const rowY = rowH.map((_, i) => FRAME.y + rowH.slice(0, i).reduce((s, v) => s + v, 0));
  const cells = [];
  for (let i = 0; i < B.length; i += 1) for (let j = 0; j < A.length; j += 1) cells.push({ i, j, ...productOf(A[j], B[i], algebra) });
  const splitsA = A.length > 1;
  const splitsB = B.length > 1;
  const eqSize = (text) => Math.max(14, Math.min(24, 420 / (text.length * 0.6)));

  const exprOf = (done, expand) => {
    if (!expand) return "";
    const pieces = cells.map((c, k) => (k < done ? c.text : `${A[c.j].text} × ${B[c.i].text}`));
    return pieces.join(" + ");
  };
  const scene = ({ aDone, bDone, done = 0, current = null, expr = "", tail = "" }) => {
    const items = [rect("base", FRAME.x, FRAME.y, FRAME.w, FRAME.h, "an-part an-p0", { role: "base" })];
    if (aDone) for (let j = 1; j < A.length; j += 1) items.push(line(`dv${j}`, colX[j], FRAME.y, colX[j], FRAME.y + FRAME.h, "an-split", { from: { a: { y2: FRAME.y }, o: 1 } }));
    if (bDone) for (let i = 1; i < B.length; i += 1) items.push(line(`dh${i}`, FRAME.x, rowY[i], FRAME.x + FRAME.w, rowY[i], "an-split", { from: { a: { x2: FRAME.x }, o: 1 } }));
    cells.forEach((c, k) => {
      if (k < done) items.push(rect(`done${c.i}-${c.j}`, colX[c.j], rowY[c.i], colW[c.j], rowH[c.i], `an-part an-p${1 + (k % 3)}`, { role: "part", from: { o: 0 } }));
    });
    if (current) items.push(rect("hl", colX[current.j], rowY[current.i], colW[current.j], rowH[current.i], "an-highlight", { from: { o: 0 } }));
    if (aDone && bDone)
      cells.forEach((c, k) => {
        // A finished part shows its area; a part still waiting stays blank so narrow parts never hold tiny text.
        if (k >= done) return;
        items.push(
          label(`cell${c.i}-${c.j}`, colX[c.j] + colW[c.j] / 2, rowY[c.i] + rowH[c.i] / 2 + 7, c.text, "an-cell-text", {
            a: { "text-anchor": "middle", "font-size": Math.max(14, Math.min(24, (colW[c.j] - 8) / (c.text.length * 0.62))) },
          }),
        );
      });
    else if (done > 0 || current) {
      // Only reached when a factor is not split: one cell.
      const c = cells[0];
      const text = done > 0 ? c.text : `${A[0].text} × ${B[0].text}`;
      items.push(label("cell0-0", FRAME.x + FRAME.w / 2, FRAME.y + FRAME.h / 2 + 8, text, "an-cell-text", { a: { "text-anchor": "middle", "font-size": 26 } }));
    }
    const topParts = aDone ? A.map((p) => p.text) : [wholeA];
    topParts.forEach((text, j) =>
      items.push(label(`top${aDone ? j : "all"}`, aDone ? colX[j] + colW[j] / 2 : FRAME.x + FRAME.w / 2, FRAME.y - 14, text, "an-head", { a: { "text-anchor": "middle" } })),
    );
    const leftParts = bDone ? B.map((p) => p.text) : [wholeB];
    leftParts.forEach((text, i) =>
      items.push(label(`left${bDone ? i : "all"}`, FRAME.x - 10, bDone ? rowY[i] + rowH[i] / 2 + 7 : FRAME.y + FRAME.h / 2 + 7, text, "an-head", { a: { "text-anchor": "end" } })),
    );
    const eq1 = algebra ? `(${wholeA})(${wholeB})` : `${wholeA} × ${wholeB}`;
    const line1 = `${eq1}${expr ? " =" : ""}`;
    items.push(label("eq1", FRAME.x - 60, FRAME.y + FRAME.h + 38, line1, "an-eqx", { a: { "text-anchor": "start", "font-size": 22 } }));
    const text2 = `${expr}${tail}`;
    if (text2) items.push(label("eq2", FRAME.x - 60, FRAME.y + FRAME.h + 70, text2, "an-eqx", { a: { "text-anchor": "start", "font-size": eqSize(text2) } }));
    return items;
  };

  const steps = [];
  const add = (caption, opts, state) => steps.push({ caption, scene: scene(opts), state });
  add(cap(C.whole, { A: wholeA, B: wholeB }), { aDone: false, bDone: false }, { phase: "whole" });
  if (splitsA) add(cap(C.splitA, { A: wholeA, parts: joined(A) }), { aDone: true, bDone: false }, { phase: "splitA", parts: A.map((p) => p.text) });
  if (splitsB) add(cap(C.splitB, { B: wholeB, parts: joined(B) }), { aDone: true, bDone: true, expr: exprOf(0, true) }, { phase: "splitB", parts: B.map((p) => p.text) });
  cells.forEach((c, k) => {
    const opts = { aDone: splitsA || splitsB, bDone: splitsA || splitsB, done: k + 1, current: { i: c.i, j: c.j }, expr: exprOf(k + 1, true) };
    add(cap(C.part, { aj: A[c.j].text, bi: B[c.i].text, pp: c.text }), opts, { phase: "part", i: c.i, j: c.j, value: c.text, done: k + 1 });
  });
  const partsSum = cells.map((c) => c.text).join(" + ");
  if (!algebra) {
    const total = fmt(cfg.a * cfg.b, SCALE * SCALE);
    const sum = cells.length > 1 ? partsSum : total;
    const showTotal = cells.length > 1 ? ` = ${total}` : "";
    add(cap(C.sum, { A: wholeA, B: wholeB, sum, total }), { aDone: true, bDone: true, done: cells.length, expr: partsSum, tail: showTotal }, { phase: "done", total });
    return finish(steps, cfg, A, B, cells, total);
  }
  const x2 = cfg.a.x * cfg.b.x;
  const x1 = cfg.a.x * cfg.b.c + cfg.a.c * cfg.b.x;
  const k0 = cfg.a.c * cfg.b.c;
  const total = `${termText(x2, 2)} + ${termText(x1, 1)} + ${k0}`;
  add(cap(C.sumAlg, { sum: partsSum }), { aDone: true, bDone: true, done: cells.length, expr: partsSum }, { phase: "sum" });
  add(cap(C.combine, { sum: partsSum, total, A: wholeA, B: wholeB }), { aDone: true, bDone: true, done: cells.length, expr: partsSum, tail: ` = ${total}` }, { phase: "done", total, poly: [x2, x1, k0] });
  return finish(steps, cfg, A, B, cells, total);
}

function finish(steps, cfg, A, B, cells, total) {
  return {
    kind: "area-decomposition",
    title: cap(C.title),
    view: [480, FRAME.y + FRAME.h + 90],
    steps,
    result: { config: cfg, partsA: A.map((p) => p.text), partsB: B.map((p) => p.text), partials: cells.map((c) => ({ i: c.i, j: c.j, c: c.c, power: c.power, text: c.text })), total },
  };
}

export const play = (container, config = {}) => createPlayer(container, buildModel(config), config);
