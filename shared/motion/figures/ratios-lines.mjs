// Number lines for the ratio figures: the double number line (two lines whose matching ticks sit on one vertical, a multiplier arc
// on each line) and the compare line (your colour, the shared white, the reference colour). Positions are floats for geometry only;
// every label is a computed Show.
import { COLOR } from "../tokens.mjs";
import { f1, GREY, inline, PAD, step, tw, tx } from "./ratios-draw.mjs";

/** @typedef {import("./ratios-calc.mjs").Show} Show */
/** @typedef {{ m: number, top: Show, bot: Show, step: number, pri: number, bold?: boolean }} Tick */
/** @typedef {{ from: number, to: number, label: string, step: number }} Arc */

const showWidth = (/** @type {Show} */ s) => (s.t !== undefined ? tw(`${s.pre}${s.t}`, 14, true) : Math.max(String(s.n).length, String(s.d).length) * 14 * 0.6 + 8 + tw(s.pre, 14, true));
const Z = { pre: "", t: "0" };

/** Labels that fit: highest priority first, a label that would touch one already placed is left out (its tick stays). @param {Tick[]} ticks @param {(m: number) => number} xs @param {"top" | "bot"} side */
function placeLabels(ticks, xs, side) {
  /** @type {Array<[number, number]>} */
  const used = [];
  /** @type {Set<Tick>} */
  const ok = new Set();
  for (const t of [...ticks].sort((a, b) => a.pri - b.pri)) {
    const w = showWidth(t[side]);
    const lo = xs(t.m) - w / 2 - 4;
    const hi = xs(t.m) + w / 2 + 4;
    if (used.every(([a, b]) => hi < a || lo > b)) {
      used.push([lo, hi]);
      ok.add(t);
    }
  }
  return ok;
}

/**
 * @param {number} W @param {number} y top of the block
 * @param {{ names: [string, string], ticks: Tick[], arcs: Arc[], M: number, wrong: null | { mTop: number, mBot: number, top: Show, bot: Show, step: number } }} spec
 */
export function dnl(W, y, spec) {
  const gutter = Math.max(tw(spec.names[0], 13, true), tw(spec.names[1], 13, true)) + 8;
  const x0 = PAD + gutter + 8;
  const x1 = W - PAD - 24;
  const xs = (/** @type {number} */ m) => x0 + (m / spec.M) * (x1 - x0);
  const yT = y + 46;
  const yB = yT + 100;
  const ticks = [{ m: 0, top: Z, bot: Z, step: 0, pri: 9 }, ...spec.ticks];
  const wrongTicks = spec.wrong
    ? /** @type {Tick[]} */ ([
        { m: spec.wrong.mTop, top: spec.wrong.top, bot: spec.wrong.bot, step: spec.wrong.step, pri: 20 },
        { m: spec.wrong.mBot, top: spec.wrong.top, bot: spec.wrong.bot, step: spec.wrong.step, pri: 20 },
      ])
    : [];
  const okTop = placeLabels([...ticks, ...(wrongTicks[0] ? [wrongTicks[0]] : [])], xs, "top");
  const okBot = placeLabels([...ticks, ...(wrongTicks[1] ? [wrongTicks[1]] : [])], xs, "bot");
  let svg = `<g>${tx(PAD, yT + 5, spec.names[0], { size: 13, weight: 700, anchor: "start" })}${tx(PAD, yB + 5, spec.names[1], { size: 13, weight: 700, anchor: "start" })}`;
  svg += `<line x1="${f1(x0 - 8)}" y1="${yT}" x2="${f1(x1 + 8)}" y2="${yT}" stroke="${COLOR.ink}" stroke-width="2"/><line x1="${f1(x0 - 8)}" y1="${yB}" x2="${f1(x1 + 8)}" y2="${yB}" stroke="${COLOR.ink}" stroke-width="2"/></g>`;
  for (const t of ticks) {
    const x = xs(t.m);
    let g = `<line x1="${f1(x)}" y1="${yT + 6}" x2="${f1(x)}" y2="${yB - 6}" stroke="${t.bold ? COLOR.ink : GREY}" stroke-width="${t.bold ? 2.5 : 1.2}"/>`;
    g += `<line x1="${f1(x)}" y1="${yT - 6}" x2="${f1(x)}" y2="${yT + 6}" stroke="${COLOR.ink}" stroke-width="2"/><line x1="${f1(x)}" y1="${yB - 6}" x2="${f1(x)}" y2="${yB + 6}" stroke="${COLOR.ink}" stroke-width="2"/>`;
    if (okTop.has(t)) g += inline(x, yT - 20, [{ show: t.top }], 14).svg;
    if (okBot.has(t)) g += inline(x, yB + 22, [{ show: t.bot }], 14).svg;
    svg += step(t.step, g);
  }
  for (const a of spec.arcs) {
    const xa = xs(a.from);
    const xb = xs(a.to);
    const mid = (xa + xb) / 2;
    const head = (/** @type {number} */ yy, /** @type {number} */ dir) => `<path d="M${f1(xb - 4)} ${f1(yy + dir * 7)} L${f1(xb)} ${f1(yy)} L${f1(xb + 4)} ${f1(yy + dir * 7)}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/>`;
    let g = `<path d="M${f1(xa)} ${yT + 8} Q${f1(mid)} ${yT + 34} ${f1(xb)} ${yT + 8}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/>${head(yT + 8, 1)}`;
    g += `<path d="M${f1(xa)} ${yB - 8} Q${f1(mid)} ${yB - 34} ${f1(xb)} ${yB - 8}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/>${head(yB - 8, -1)}`;
    g += tx(mid, yT + 40, a.label, { size: 15, weight: 700, halo: true }) + tx(mid, yB - 32, a.label, { size: 15, weight: 700, halo: true });
    svg += step(a.step, g);
  }
  if (spec.wrong) {
    const w = spec.wrong;
    const xa = xs(w.mTop);
    const xb = xs(w.mBot);
    let g = `<line x1="${f1(xa)}" y1="${yT + 6}" x2="${f1(xb)}" y2="${yB - 6}" stroke="${COLOR.error}" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    g += `<line x1="${f1(xa)}" y1="${yT - 6}" x2="${f1(xa)}" y2="${yT + 6}" stroke="${COLOR.error}" stroke-width="2.5"/><line x1="${f1(xb)}" y1="${yB - 6}" x2="${f1(xb)}" y2="${yB + 6}" stroke="${COLOR.error}" stroke-width="2.5"/>`;
    if (wrongTicks[0] && okTop.has(wrongTicks[0])) g += inline(xa, yT - 20, [{ show: w.top, fill: COLOR.error }], 14).svg;
    if (wrongTicks[1] && okBot.has(wrongTicks[1])) g += inline(xb, yB + 22, [{ show: w.bot, fill: COLOR.error }], 14).svg;
    svg += step(w.step, g);
  }
  return { svg, h: yB + 46 - y };
}

/**
 * The compare line: one shared white line in the middle, your colour above it and the reference colour below it, all positions by
 * the amount of white. A multiplier bracket sits in the gap each colour line shares with the white line.
 * @typedef {{ white: number, whiteShow: Show, color: Show, end: Show, k: Show | null }} Side
 * @param {number} W @param {number} y
 * @param {{ names: [string, string, string], L: number, whiteEnd: Show, mine: Side, ref: Side, stepGiven: number, stepEnd: number }} spec
 */
export function compareLine(W, y, spec) {
  const gutter = Math.max(...spec.names.map((n) => tw(n, 13, true))) + 8;
  const x0 = PAD + gutter + 8;
  const x1 = W - PAD - 30;
  const xs = (/** @type {number} */ white) => x0 + (white / spec.L) * (x1 - x0);
  const yT = y + 44;
  const yM = yT + 70;
  const yB = yM + 70;
  const ink = COLOR.ink;
  const vline = (/** @type {number} */ x, /** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ w) => `<line x1="${f1(x)}" y1="${a}" x2="${f1(x)}" y2="${b}" stroke="${ink}" stroke-width="${w}"/>`;
  let svg = `<g>${tx(PAD, yT + 5, spec.names[0], { size: 13, weight: 700, anchor: "start" })}${tx(PAD, yM + 5, spec.names[1], { size: 13, weight: 700, anchor: "start" })}${tx(PAD, yB + 5, spec.names[2], { size: 13, weight: 700, anchor: "start" })}`;
  for (const yy of [yT, yM, yB]) svg += `<line x1="${f1(x0 - 8)}" y1="${yy}" x2="${f1(x1 + 4)}" y2="${yy}" stroke="${ink}" stroke-width="2"/>`;
  svg += `${vline(x0, yT - 6, yB + 6, 1.2).replace(ink, GREY)}${tx(x0, yM + 22, "0", { size: 14, weight: 700 })}</g>`;
  const same = spec.mine.white === spec.ref.white;
  /** @param {Side} side @param {number} yy colour line y @param {number} dir -1 above the white line, 1 below */
  const given = (side, yy, dir) => {
    const x = xs(side.white);
    let s = vline(x, Math.min(yy, yM), Math.max(yy, yM), 2.5) + vline(x, yy - 6, yy + 6, 2.5);
    s += inline(x, yy + dir * 20, [{ show: side.color }], 14).svg;
    return s;
  };
  svg += step(spec.stepGiven, given(spec.mine, yT, -1) + given(spec.ref, yB, 1));
  // a white label sits on the side of the white line away from the connector that reaches it (yours comes from above, the reference from below)
  const whiteGiven = same ? inline(xs(spec.ref.white), yM + 22, [{ show: spec.ref.whiteShow }], 14).svg : inline(xs(spec.mine.white), yM + 22, [{ show: spec.mine.whiteShow }], 14).svg + inline(xs(spec.ref.white), yM - 14, [{ show: spec.ref.whiteShow }], 14).svg;
  svg += step(spec.stepGiven, whiteGiven);
  /** @param {Side} side @param {number} yy @param {number} dir */
  const finish = (side, yy, dir) => {
    const xe = xs(spec.L);
    const xa = xs(side.white);
    // when the given white is already the common white, the given tick has drawn this label
    let s = vline(xe, Math.min(yy, yM), Math.max(yy, yM), 2.5) + vline(xe, yy - 6, yy + 6, 2.5) + (side.white === spec.L ? "" : inline(xe, yy + dir * 20, [{ show: side.end }], 14).svg);
    if (side.k) {
      const my = (yy + yM) / 2 + (dir < 0 ? -10 : 10);
      s += `<line x1="${f1(xa)}" y1="${f1(my)}" x2="${f1(xe)}" y2="${f1(my)}" stroke="${ink}" stroke-width="2"/><path d="M${f1(xe - 7)} ${f1(my - 4)} L${f1(xe)} ${f1(my)} L${f1(xe - 7)} ${f1(my + 4)}" fill="none" stroke="${ink}" stroke-width="2"/>`;
      s += inline((xa + xe) / 2, my + (dir < 0 ? 16 : -16), [{ t: "×", bold: true }, { show: side.k }], 15, 1).svg;
    }
    return s;
  };
  const endLabel = spec.L === spec.mine.white || spec.L === spec.ref.white ? "" : inline(xs(spec.L) + 8 + showWidth(spec.whiteEnd) / 2, yM, [{ show: spec.whiteEnd }], 14).svg;
  svg += step(spec.stepEnd, finish(spec.mine, yT, -1) + finish(spec.ref, yB, 1) + endLabel);
  return { svg, h: yB + 46 - y };
}
