// Pure decimal arithmetic for the "decimal" family. A decimal is kept as a scaled integer
// (value x 10^places), so every digit, carry and borrow is exact. No floats decide or print
// anything; the exact rationals from core.mjs cross-check sizes and answers.
import { cmp, div, frac, fmtNumber } from "./core.mjs";

export const MAX_INT = 4;
export const MAX_DEC = 3;
export const MAX_COLS = 6;
const DEC = /^(\d{1,4})(?:\.(\d{1,3}))?$/;

const pow10 = (n) => 10 ** n;
export const exact = (scaled, places) => frac(scaled, pow10(places));
/** 56700 with 3 places -> "56.700"; always prints the point when places > 0. */
export function fixed(scaled, places) {
  const s = String(scaled).padStart(places + 1, "0");
  return places ? `${s.slice(0, -places)}.${s.slice(-places)}` : s;
}
export const whole = (n) => fmtNumber(frac(n));
export const digitAt = (n, k) => Math.floor(n / pow10(k)) % 10;
const intLen = (scaled, places) => String(Math.floor(scaled / pow10(places))).length;
const rescale = (d, p) => d.scaled * pow10(p - d.places);
/** Nearest whole number, halves go up. */
const roundWhole = (d) => Math.floor((2 * d.scaled + pow10(d.places)) / (2 * pow10(d.places)));

/** "12.60" -> { places: 2, scaled: 1260, text: "12.60" }, or null. Trailing zeros are kept. */
export function parseDec(text) {
  const m = typeof text === "string" ? DEC.exec(text) : null;
  if (!m) return null;
  const places = (m[2] || "").length;
  const scaled = Number(m[1] + (m[2] || ""));
  return { places, scaled, text: fixed(scaled, places) };
}

// ── Add and subtract ─────────────────────────────────────────────────────────

/** "+46.8" / "-19.35" / "46.8" -> { sign: 1 | -1, d } or null. */
export function parseTerm(text, first) {
  const m = typeof text === "string" ? /^([+\-−])?\s*(\S+)$/.exec(text.trim()) : null;
  const d = m && parseDec(m[2]);
  if (!d) return null;
  const sign = m[1] === "-" || m[1] === "−" ? -1 : 1;
  if (first ? sign < 0 : !m[1]) return null;
  return { sign, d };
}
export const termText = (t, first) => (first ? t.d.text : `${t.sign > 0 ? "+" : "-"}${t.d.text}`);

function columnsOf(A, B, sign, P, W) {
  const cols = [];
  let carry = 0;
  for (let k = 0; k < P + W; k += 1) {
    const da = digitAt(A, k);
    const db = digitAt(B, k);
    let digit;
    let out;
    let eff = da;
    if (sign > 0) {
      const sum = da + db + carry;
      digit = sum % 10;
      out = sum >= 10 ? 1 : 0;
    } else {
      eff = da - carry;
      out = eff < db ? 1 : 0;
      digit = eff + 10 * out - db;
    }
    cols.push({ pos: k, e: k - P, da, db, cin: carry, out, eff, digit });
    carry = out;
  }
  return cols;
}

/** The chain as one operation per sign: aligned strings, columns, running result. Null if invalid. */
export function buildOps(terms) {
  let run = terms[0].d;
  const ops = [];
  for (let i = 1; i < terms.length; i += 1) {
    const { sign, d } = terms[i];
    const P = Math.max(run.places, d.places);
    const A = rescale(run, P);
    const B = rescale(d, P);
    const R = sign > 0 ? A + B : A - B;
    if (R < 0 || !Number.isSafeInteger(R)) return null;
    const W = Math.max(intLen(A, P), intLen(B, P), intLen(R, P));
    if (P + W > MAX_COLS || P < 1) return null;
    ops.push({
      i,
      sign,
      P,
      W,
      A,
      B,
      R,
      left: run.text,
      right: d.text,
      leftPlaces: run.places,
      rightPlaces: d.places,
      annex: run.places !== d.places,
      result: fixed(R, P),
      cols: columnsOf(A, B, sign, P, W),
    });
    run = { places: P, scaled: R, text: fixed(R, P) };
  }
  return ops;
}

/** Round every number to a whole number and combine them: the estimate for the chain. */
export function estimateChain(terms) {
  const parts = terms.map((t) => ({ sign: t.sign, text: t.d.text, rounded: roundWhole(t.d) }));
  return { parts, total: parts.reduce((sum, p) => sum + p.sign * p.rounded, 0) };
}

// ── Multiply ─────────────────────────────────────────────────────────────────

/** Ignore the points, multiply the whole numbers, count places, place the point, check. */
export function multiplyOf(aText, bText, trimTo) {
  const a = parseDec(aText);
  const b = parseDec(bText);
  const A = a.scaled;
  const B = b.scaled;
  const prod = A * B;
  if (!Number.isSafeInteger(prod * 10)) return null;
  const total = a.places + b.places;
  const partials = [];
  for (let k = 0; k < String(B).length; k += 1) {
    const dgt = digitAt(B, k);
    if (dgt) partials.push({ digit: dgt, factor: dgt * pow10(k), value: A * dgt * pow10(k) });
  }
  const show = (scaled, places) => {
    let s = scaled;
    let p = places;
    while (trimTo !== null && p > trimTo && s % 10 === 0) {
      s /= 10;
      p -= 1;
    }
    return fixed(s, p);
  };
  const est = { a: roundWhole(a), b: roundWhole(b) };
  const estimate = frac(est.a * est.b);
  // The point one place too far left, in the right place, and one place too far right.
  const cands = [
    { shift: "smaller", text: show(prod, total + 1), value: exact(prod, total + 1) },
    { shift: "answer", text: show(prod, total), value: exact(prod, total) },
    { shift: "bigger", text: show(prod * 10, total), value: exact(prod * 10, total) },
  ];
  // Distance from the estimate as a ratio >= 1 (exact); the smallest is the nearest.
  const ratio = (c) => (cmp(c, estimate) >= 0 ? div(c, estimate) : div(estimate, c));
  let nearest = 0;
  cands.forEach((c, i) => {
    if (cmp(ratio(c.value), ratio(cands[nearest].value)) < 0) nearest = i;
  });
  return {
    a,
    b,
    A,
    B,
    prod,
    total,
    partials,
    est,
    estimate: est.a * est.b,
    digits: String(prod).padStart(total + 1, "0"),
    placed: fixed(prod, total),
    answer: show(prod, total),
    value: exact(prod, total),
    cands,
    nearest,
  };
}
