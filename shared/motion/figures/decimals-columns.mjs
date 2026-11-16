// Place-value column arithmetic and its drawing, shared by the receipt and the decimal-columns figures.
// Everything is whole hundredths (integers), so no decimal is ever added in floating point.
import { COLOR } from "../tokens.mjs";
import { anim, base, decimalText, f1, fixed, pick, placesOf, scaled, text } from "./decimals-draw.mjs";

export const PLACE = {
  en: ["hundreds", "tens", "ones", "tenths", "hundredths"],
  es: ["centenas", "decenas", "unidades", "décimas", "centésimas"],
};
const WORTH = ["100", "10", "1", "0.1", "0.01"];

/** Digits of an amount in hundredths: `nInt` whole-number columns, then tenths and hundredths. @param {number} c @param {number} nInt */
export const digitsOf = (c, nInt) => Array.from({ length: nInt + 2 }, (_, t) => Math.floor(c / 10 ** (nInt + 1 - t)) % 10);

/** Whole-number columns needed to show every amount. @param {number[]} amounts */
export const intColumns = (amounts) => Math.max(1, ...amounts.map((c) => String(Math.floor(c / 100)).length));

/**
 * @typedef {object} Work
 * @property {number[]} out result digits
 * @property {Array<number | null>} marks the regroup mark above each column (a carry of 1, or the regrouped top digit)
 * @property {number} regroups
 * @property {Array<{ j: number, kind: "carry" | "regroup", a: number, b: number, cin: number, sum: number, mark: number, out: number }>} notes right to left
 */

/**
 * The column method, right to left. Addition carries; subtraction (top at least bottom) regroups from the left.
 * @param {number} ca @param {number} cb @param {"+" | "−"} op @param {number} nInt
 * @returns {Work}
 */
export function columnsWork(ca, cb, op, nInt) {
  const t = digitsOf(ca, nInt);
  const b = digitsOf(cb, nInt);
  const n = t.length;
  const out = Array(n).fill(0);
  /** @type {Work["marks"]} */
  const marks = Array(n).fill(null);
  /** @type {Work["notes"]} */
  const notes = [];
  if (op === "+") {
    let carry = 0;
    for (let j = n - 1; j >= 0; j--) {
      const sum = t[j] + b[j] + carry;
      out[j] = sum % 10;
      if (sum >= 10 && j > 0) {
        marks[j - 1] = 1;
        notes.push({ j, kind: "carry", a: t[j], b: b[j], cin: carry, sum, mark: 1, out: out[j] });
      }
      carry = sum >= 10 ? 1 : 0;
    }
  } else {
    if (ca < cb) throw new RangeError("subtraction needs the larger number on top");
    const cur = [...t];
    const used = [...t];
    for (let j = n - 1; j >= 0; j--) {
      if (cur[j] < b[j]) {
        let d = j - 1;
        while (d >= 0 && cur[d] === 0) d--;
        cur[d] -= 1;
        for (let k = d + 1; k < j; k++) cur[k] = 9;
        cur[j] += 10;
      }
      used[j] = cur[j];
      out[j] = cur[j] - b[j];
    }
    for (let j = 0; j < n; j++) {
      if (used[j] !== t[j]) {
        marks[j] = used[j];
        notes.unshift({ j, kind: "regroup", a: t[j], b: b[j], cin: 0, sum: used[j], mark: used[j], out: out[j] });
      }
    }
    // right to left
    notes.sort((x, y) => y.j - x.j);
  }
  return { out, marks, regroups: notes.length, notes };
}

/** @param {number} c @param {number} ownPlaces @param {number} dp @param {number} nInt @param {number} j */
function cellKind(c, ownPlaces, dp, nInt, j) {
  if (j < nInt) return j === nInt - 1 || c >= 100 * 10 ** (nInt - 1 - j) ? "digit" : "blank";
  const k = j - nInt + 1;
  return k <= ownPlaces ? "digit" : k <= dp ? "annex" : "blank";
}

/** @param {string} lang @param {number} nInt @param {number} j */
const placeName = (lang, nInt, j) => PLACE[lang === "es" ? "es" : "en"][j < nInt ? 3 - nInt + j : 2 + (j - nInt + 1)];
const cap = (/** @type {string} */ s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The sentences that say what happened in each regrouped column, right to left.
 * @param {Work} w @param {number} nInt @param {string} lang
 */
export function columnNotes(w, nInt, lang) {
  return w.notes.map((n) => {
    const place = cap(placeName(lang, nInt, n.j));
    if (n.kind === "carry") {
      const sum = n.cin ? `${n.a} + ${n.b} + ${n.cin} = ${n.sum}` : `${n.a} + ${n.b} = ${n.sum}`;
      return pick(lang, `${place}: ${sum}. Write ${n.out}, regroup 1.`, `${place}: ${sum}. Escribe ${n.out} y reagrupa 1.`);
    }
    return pick(lang, `${place}, regrouped: ${n.mark} − ${n.b} = ${n.out}.`, `${place}, reagrupado: ${n.mark} − ${n.b} = ${n.out}.`);
  });
}

/**
 * The "last digits lined up instead of the points" mistake: the number with fewer decimal places slides right under the other's
 * last place. Null when both are written with the same places (nothing slides, so the mistake does not differ).
 * @param {number} ca @param {number} cb @param {"+" | "−"} op
 */
export function misalign(ca, cb, op) {
  const pa = placesOf(ca);
  const pb = placesOf(cb);
  if (pa === pb) return null;
  const shiftTop = pa < pb;
  const d = Math.abs(pa - pb);
  const top = scaled(ca, 2);
  const bot = scaled(cb, 2);
  const slide = (/** @type {import("../exact.mjs").Rat} */ r) => r.div(scaled(10 ** d, 0));
  const t = shiftTop ? slide(top) : top;
  const b = shiftTop ? bot : slide(bot);
  const wrong = op === "+" ? t.add(b) : t.sub(b);
  const dp = 6;
  return {
    from: fixed(shiftTop ? ca : cb, shiftTop ? pa : pb),
    to: decimalText(shiftTop ? t : b, dp).text,
    value: decimalText(wrong, dp).text,
    sum: `${decimalText(t, dp).text} ${op} ${decimalText(b, dp).text} = ${decimalText(wrong, dp).text}`,
  };
}

/**
 * Draw the columns. withResult false stops after the two numbers (the "line up the points" picture).
 * @param {{ W: number, y: number, lang: string, ca: number, cb: number, cr: number, op: "+" | "−", dp: number, nInt: number, topPlaces: number, botPlaces: number, withResult: boolean, work: Work }} o
 */
export function drawColumns(o) {
  const { W, lang, ca, cb, cr, op, dp, nInt, topPlaces, botPlaces, withResult, work } = o;
  const cols = nInt + dp;
  const G = 28;
  const slot = dp ? 14 : 0;
  const cw = Math.min(54, (W - 24 - G - slot) / cols);
  const total = G + cols * cw + slot;
  const xs = (W - total) / 2;
  /** @param {number} j */
  const cx = (j) => xs + G + (j + 0.5) * cw + (j >= nInt ? slot : 0);
  const px = xs + G + nInt * cw + slot / 2;
  const hasMarks = withResult && work.marks.some((m) => m !== null);
  const yHead = o.y;
  const yMark = yHead + 24;
  const yTop = yMark + (hasMarks ? 28 : 0);
  const yBot = yTop + 32;
  const yRule = yBot + 34;
  const yRes = yRule + 4;
  const yEnd = withResult ? yRes + 34 : yBot + 34;
  const colsShown = Array.from({ length: cols }, (_, j) => j);
  const t = digitsOf(ca, nInt);
  const bt = digitsOf(cb, nInt);
  const r = digitsOf(cr, nInt);
  const DIG = 22;
  let head = "";
  for (const j of colsShown) head += text(cx(j), yHead + 14, WORTH[j < nInt ? 3 - nInt + j : 2 + (j - nInt + 1)], { size: 13, fill: COLOR.muted });
  let still = "";
  if (dp) {
    still += `<line x1="${f1(px)}" y1="${yHead + 22}" x2="${f1(px)}" y2="${f1(yEnd - 6)}" stroke="${COLOR.muted}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    const rows = withResult ? [yTop, yBot, yRes] : [yTop, yBot];
    for (const ry of rows) still += `<circle cx="${f1(px)}" cy="${f1(ry + 19)}" r="2.6" fill="${COLOR.ink}"/>`;
  }
  /** @param {number} ry @param {number[]} d @param {number} c @param {number} own */
  const row = (ry, d, c, own) => {
    let s = "";
    let annex = "";
    for (const j of colsShown) {
      const kind = cellKind(c, own, dp, nInt, j);
      if (kind === "digit") s += text(cx(j), ry + 24, d[j], { size: DIG, weight: 700 });
      else if (kind === "annex") {
        annex += `<rect x="${f1(cx(j) - cw / 2 + 3)}" y="${f1(ry + 2)}" width="${f1(cw - 6)}" height="30" rx="4" fill="none" stroke="${COLOR.error}" stroke-width="1.5" stroke-dasharray="4 3"/>${text(cx(j), ry + 24, 0, { size: DIG, fill: COLOR.muted })}`;
      }
    }
    return { s, annex };
  };
  const top = row(yTop, t, ca, topPlaces);
  const bot = row(yBot, bt, cb, botPlaces);
  let stat = head + still + top.s + bot.s + text(xs + 12, yBot + 24, op, { size: DIG, weight: 700 });
  let moving = "";
  const annexAll = top.annex + bot.annex;
  if (annexAll) moving += anim(0, annexAll);
  if (withResult) {
    stat += `<line x1="${f1(xs + 22)}" y1="${yRule}" x2="${f1(xs + total)}" y2="${yRule}" stroke="${COLOR.ink}" stroke-width="3"/>`;
    const res = row(yRes, r, cr, dp);
    moving += res.annex;
    // right to left: each column's result digit with its regroup mark (and, for subtraction, the struck top digit)
    for (let j = cols - 1, i = 1; j >= 0; j--, i++) {
      const kind = cellKind(cr, dp, dp, nInt, j);
      const m = work.marks[j];
      if (kind === "blank" && m === null) continue;
      let g = kind === "blank" ? "" : text(cx(j), yRes + 24, r[j], { size: DIG, weight: 700 });
      if (m !== null) {
        g += `<rect x="${f1(cx(j) - 13)}" y="${yMark + 2}" width="26" height="20" rx="8" fill="none" stroke="${COLOR.ink}" stroke-width="1.5" stroke-dasharray="3 2"/>${text(cx(j), yMark + 17, m, { size: 13, weight: 700 })}`;
        if (op === "−") g += `<line x1="${f1(cx(j) - 12)}" y1="${yTop + 26}" x2="${f1(cx(j) + 12)}" y2="${yTop + 6}" stroke="${COLOR.error}" stroke-width="2"/>`;
      }
      moving += anim(i, g);
    }
  }
  return { svg: base(stat) + moving, height: yEnd - o.y + 4 };
}
