#!/usr/bin/env node
/* =============================================================================
 * warmup-answers.test.mjs — a warm-up's marked answer must be the answer its
 * own stem produces, in BOTH languages, and its distractors must still produce
 * the errors their tags name.
 *
 * WHY THIS GATE EXISTS
 * --------------------
 * Warm-ups were the one item pool with no arithmetic gate on them at all.
 * `validate:math` sweeps lesson answers; `misconception-tags-resolve.test.mjs`
 * sweeps `practice[tier]` and stops there — so a warm-up could carry an
 * unresolvable tag, a tag on the CORRECT choice, a decimal diagnosis on a
 * whole-number problem, or Spanish text still describing the numbers the
 * English stem used to have, and every existing check stayed green. That last
 * one is the expensive shape: the Spanish reader is the student least able to
 * tell that the question and its translation disagree.
 *
 * WHAT IT PROVES, and what it deliberately does not
 * ------------------------------------------------
 *   1. ANSWER. For every stem a recognizer can read, the answer is recomputed
 *      from the stem's OWN numbers with exact rational arithmetic, and
 *      choices[correctIndex] must state it — in English AND in Spanish.
 *      A recognizer that is not sure DECLINES. An undecidable stem is skipped,
 *      never failed: this gate must never make an unverifiable question look
 *      wrong.
 *   2. DISTRACTOR PAIRING. `misconceptionTags` are POSITIONAL. Where the tag
 *      names an error that is computable from the same numbers ("added instead
 *      of multiplied"), the tagged choice must be exactly the value that error
 *      yields. A tag whose error no longer lands on its choice diagnoses
 *      nothing and is worse than no tag, because the pipeline reports it as a
 *      finding.
 *   3. TAG HYGIENE, extended to warm-ups: resolvable, positional length,
 *      never on the correct choice, and no decimal diagnosis on a stem that
 *      states no decimal (the exact rule the practice sweep already holds).
 *   4. BILINGUAL ATOMICITY. The number multiset of every English field must
 *      equal that of its Spanish twin. This is the check that makes "stem and
 *      stemEs change together or not at all" mechanical rather than a promise.
 *
 * Self-tests every recognizer and every detector against known-good AND
 * known-bad fixtures BEFORE sweeping, and FAILS on a zero-match sweep — a
 * recognizer that has quietly stopped matching otherwise reports a clean
 * curriculum, which is this repo's recurring way for a gate to lie.
 * ========================================================================== */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MISCONCEPTIONS, resolveAuthoredTag } from "../engine/core/misconceptions.js";
import { matchesAnswer, parseAnswerValue, Rat } from "../scripts/lib/rational.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");

const R = (n, d = 1) => new Rat(BigInt(n), BigInt(d));
/** Exact rational from a decimal literal — never Number, which cannot hold 0.7. */
function dec(text) {
  const t = String(text).replace(/,/g, "").trim();
  const m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(t);
  if (!m || (!m[2] && !m[3])) return null;
  const frac = m[3] || "";
  const digits = `${m[2] || "0"}${frac}`;
  return new Rat(BigInt(m[1] === "-" ? `-${digits}` : digits), 10n ** BigInt(frac.length));
}

/* ── recognizers ──────────────────────────────────────────────────────────────
 * Each reads a stem and returns { value, why } or null. Narrow on purpose: a
 * recognizer that guesses is worse than one that declines, because a wrong
 * "expected" would send an author to edit a question that was already right.
 * ------------------------------------------------------------------------- */
/* Thousands groups are spelled out rather than written `[\d,]+`, which happily
 * eats the comma AFTER a number: "In 847 ÷ 7, the first step…" parsed as
 * `847 ÷ 7,` and a list's own separators disappeared into its members. */
const N = "(-?\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|-?\\d+(?:\\.\\d+)?)";
const rx = (body, flags = "i") => new RegExp(body, flags);

/* Stems whose ANSWER is not the arithmetic they contain. Each of these shipped
 * as a false positive on the first run, and a false positive here is the
 * expensive direction: it sends an author to "fix" a question that was right.
 *   • "Estimate 412 ÷ 7 by using friendly numbers" — the answer is 420 ÷ 7 = 60.
 *   • "In 1.2 × 0.35, how many decimal places does the product have?" — 3.
 *   • "In 847 ÷ 7, the first step… what digit goes in the hundreds place?" — 1.
 *   • "…scores are 82, 90 and 86. What score gives a mean of 87?" — reverse. */
const META_STEM =
  /\bestimat|\babout\b|\bapproximately\b|decimal places|wh(?:at|ich) digit|first step|to the nearest|\brounds?\b|gives? a mean of|what score|how many (?:full|whole)\b/i;

/* A figure built from OTHER figures, or a solid whose faces are listed, is not
 * the one shape a plane-area recognizer would read out of it. Both shipped as
 * false positives: "a 5 by 4 rectangle joined to a triangle with base 5 and
 * height 4" (total 30) was read as the triangle alone, and "a square pyramid
 * with a base 6 cm by 6 cm and four triangular faces of 15 cm² each" (96) was
 * read as the base alone. */
const COMPOSITE = /joined to|attached|made of|composite|cut out of|total area|left over/i;
const SOLID = /pyramid|prism|\bnet\b|faces|surface area/i;

/* An operator standing between two operands, counted without consuming them —
 * `matchAll` on `N op N` eats its own right operand, so "5 + 3 × 2²" reported
 * ONE operation and this recognizer confidently answered 8 for a stem whose
 * answer is 17. Order of operations is not this recognizer's to do. */
const OPERATORS = /[\d⁰¹²³⁴⁵⁶⁷⁸⁹)](?=\s*[+\-−×x*÷/]\s*[\d(])/g;
/* A number sitting against a lone letter is algebra, not arithmetic: "6a + 4 −
 * 2a" simplifies to 4a + 4, and reading the "4 − 2" out of it answers a
 * question nobody asked. The letter must not begin a word, so "2 cm" and
 * "5 litres" stay arithmetic. */
const ALGEBRAIC = /\d\s*[a-z](?![a-z])/i;

/** "What is 936 ÷ 8?" / "3.6 × 2.5" / "14.6 + 3.85" — ONE binary operation. */
function binaryOp(stem) {
  const s = String(stem);
  if ((s.match(OPERATORS) || []).length !== 1) return null;
  if (ALGEBRAIC.test(s)) return null;
  const all = [...s.matchAll(rx(`${N}\\s*([+\\-−×x*÷/])\\s*${N}`, "gi"))];
  if (all.length !== 1) return null;
  const [, a, op, b] = all[0];
  // A fraction ("3/4") is not a division problem; the fraction recognizer owns it.
  if (op === "/" && !/\s\/\s/.test(all[0][0])) return null;
  const x = dec(a);
  const y = dec(b);
  if (!x || !y) return null;
  const sym = /[+]/.test(op) ? "+" : /[-−]/.test(op) ? "−" : /[×x*]/.test(op) ? "×" : "÷";
  const ops = { a: x, b: y, op: sym };
  if (sym === "+") return { value: x.add(y), why: `${a} + ${b}`, ops };
  if (sym === "−") return { value: x.sub(y), why: `${a} − ${b}`, ops };
  if (sym === "×") return { value: x.mul(y), why: `${a} × ${b}`, ops };
  if (y.n === 0n) return null;
  return { value: x.div(y), why: `${a} ÷ ${b}`, ops };
}

/** "What is 10% of 320?" — including "half of 20" and "1/2 of 60". */
function partOfWhole(stem) {
  const s = String(stem);
  let m = rx(`${N}\\s*%\\s*of\\s*${N}`).exec(s);
  if (m) {
    const p = dec(m[1]);
    const w = dec(m[2]);
    if (p && w) return { value: p.mul(w).div(R(100)), why: `${m[1]}% of ${m[2]}` };
  }
  m = rx(`\\bhalf of\\s*${N}`).exec(s);
  if (m) {
    const w = dec(m[1]);
    // "half of 60" IS 60 ÷ 2, and that is the division a distractor tag names.
    if (w) return { value: w.div(R(2)), why: `half of ${m[1]}`, ops: { a: w, b: R(2), op: "÷" } };
  }
  m = rx(`(\\d+)\\s*/\\s*(\\d+)\\s*of\\s*${N}`).exec(s);
  if (m) {
    const w = dec(m[3]);
    if (!w || !Number(m[2])) return null;
    const unitFraction = Number(m[1]) === 1;
    return {
      value: w.mul(R(m[1], m[2])),
      why: `${m[1]}/${m[2]} of ${m[3]}`,
      ops: unitFraction ? { a: w, b: R(m[2]), op: "÷" } : null,
    };
  }
  return null;
}

/** "l = 6 cm, w = 2 cm and h = 3 cm" → the product. */
function prismDims(stem) {
  const s = String(stem);
  const l = rx(`\\bl\\s*=\\s*${N}`).exec(s);
  const w = rx(`\\bw\\s*=\\s*${N}`).exec(s);
  const h = rx(`\\bh\\s*=\\s*${N}`).exec(s);
  if (!l || !w || !h) return null;
  if (/surface area/i.test(s)) {
    const [a, b, c] = [dec(l[1]), dec(w[1]), dec(h[1])];
    if (!a || !b || !c) return null;
    const sa = a.mul(b).add(a.mul(c)).add(b.mul(c)).mul(R(2));
    return {
      value: sa,
      why: `2(lw + lh + wh) for ${l[1]}, ${w[1]}, ${h[1]}`,
      ops: { dims: [a, b, c] },
    };
  }
  const [a, b, c] = [dec(l[1]), dec(w[1]), dec(h[1])];
  if (!a || !b || !c) return null;
  return {
    value: a.mul(b).mul(c),
    why: `${l[1]} × ${w[1]} × ${h[1]}`,
    ops: { dims: [a, b, c], a, b, op: "×" },
  };
}

/** "a base area of 24 square inches and a height of 5 inches" → the product. */
function baseAreaHeight(stem) {
  const s = String(stem);
  if (!/base area/i.test(s)) return null;
  const ba = rx(`base area of\\s*${N}`).exec(s);
  const h = rx(`height of\\s*${N}`).exec(s);
  if (!ba || !h) return null;
  const a = dec(ba[1]);
  const b = dec(h[1]);
  if (!a || !b) return null;
  if (/volume of\s*[\d,]/i.test(s)) return null; // reverse problem — not this recognizer's
  return {
    value: a.mul(b),
    why: `base area ${ba[1]} × height ${h[1]}`,
    ops: { dims: [a, b], a, b, op: "×" },
  };
}

/** "a triangle with base 12 cm and height 5 cm" → ½bh. */
function triangleArea(stem) {
  const s = String(stem);
  if (!/triangle/i.test(s) || /area of\s*[\d,]/i.test(s)) return null;
  if (COMPOSITE.test(s) || SOLID.test(s)) return null;
  const b = rx(`base\\s*(?:of\\s*)?${N}`).exec(s);
  const h = rx(`height\\s*(?:of\\s*)?${N}`).exec(s);
  if (!b || !h) return null;
  const x = dec(b[1]);
  const y = dec(h[1]);
  if (!x || !y) return null;
  return {
    value: x.mul(y).div(R(2)),
    why: `½ × ${b[1]} × ${h[1]}`,
    ops: { dims: [x, y], a: x, b: y, op: "×", halved: true },
  };
}

/** "a parallelogram with base 9 in and height 4 in" → bh. */
function parallelogramArea(stem) {
  const s = String(stem);
  if (!/parallelogram|rhombus/i.test(s) || /area of\s*[\d,]/i.test(s)) return null;
  if (COMPOSITE.test(s) || SOLID.test(s)) return null;
  const b = rx(`base\\s*(?:of\\s*)?${N}`).exec(s);
  const h = rx(`height\\s*(?:of\\s*)?${N}`).exec(s);
  if (!b || !h) return null;
  const x = dec(b[1]);
  const y = dec(h[1]);
  if (!x || !y) return null;
  return { value: x.mul(y), why: `${b[1]} × ${h[1]}`, ops: { dims: [x, y], a: x, b: y, op: "×" } };
}

/** "a trapezoid with bases 5 cm and 9 cm and height 6 cm" → ½(b₁+b₂)h. */
function trapezoidArea(stem) {
  const s = String(stem);
  if (!/trapezoid/i.test(s) || /area of\s*[\d,]/i.test(s)) return null;
  if (COMPOSITE.test(s)) return null;
  const b = rx(`bases\\s*${N}\\s*(?:cm|in|ft|m|feet|inches|metres|meters)?\\s*and\\s*${N}`).exec(s);
  const h = rx(`height\\s*(?:of\\s*)?${N}`).exec(s);
  if (!b || !h) return null;
  const [p, q, r] = [dec(b[1]), dec(b[2]), dec(h[1])];
  if (!p || !q || !r) return null;
  return { value: p.add(q).mul(r).div(R(2)), why: `½(${b[1]} + ${b[2]}) × ${h[1]}` };
}

/** "a rectangle 8 cm long and 5 cm wide" / "8 ft by 5 ft" → the product. */
function rectangleArea(stem) {
  const s = String(stem);
  if (!/\barea\b/i.test(s) || /area of\s*[\d,]/i.test(s)) return null;
  if (/triangle|trapezoid|parallelogram|hexagon|pentagon|octagon/i.test(s)) return null;
  if (COMPOSITE.test(s) || SOLID.test(s)) return null;
  let m = rx(`${N}\\s*(?:cm|in|ft|m|feet|inches|units?)?\\s*long and\\s*${N}`).exec(s);
  if (!m) m = rx(`${N}\\s*(?:cm|in|ft|m|feet|inches|units?)\\s*by\\s*${N}`).exec(s);
  if (!m) return null;
  const a = dec(m[1]);
  const b = dec(m[2]);
  if (!a || !b) return null;
  return { value: a.mul(b), why: `${m[1]} × ${m[2]}`, ops: { dims: [a, b], a, b, op: "×" } };
}

/* A number TOKEN, with thousands groups spelled out. `[\d,]+` cannot be used
 * here: it eats the list's own separators, so "10, 14, 8, 12 and 16" silently
 * became the four values before the "and" and the mean came out 11 instead of
 * 12 — a wrong expectation, which is the one failure mode this file must not
 * have. Both self-tests below pin it. */
const NUMTOK = "-?\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|-?\\d+(?:\\.\\d+)?";
const LIST_RE = new RegExp(`((?:(?:${NUMTOK})\\s*(?:,\\s*|\\s+and\\s+))+(?:${NUMTOK}))`);
const listOf = (text) => {
  const m = LIST_RE.exec(String(text));
  if (!m) return null;
  const parts = m[1]
    .split(/\s*,\s*|\s+and\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(dec);
  return parts.every(Boolean) && parts.length >= 3 ? parts : null;
};

/** "Find the mean of 10, 14, 8, 12 and 16." */
function meanOf(stem) {
  const s = String(stem);
  if (!/\bmean\b/i.test(s) || /absolute deviation|MAD/i.test(s)) return null;
  const xs = listOf(s);
  if (!xs) return null;
  const sum = xs.reduce((a, b) => a.add(b), R(0));
  return { value: sum.div(R(xs.length)), why: `mean of ${xs.length} values`, ops: { sum } };
}

/** "the median of 4, 8, 6, 10" — sorts first, which is the whole point. */
function medianOf(stem) {
  const s = String(stem);
  if (!/\bmedian\b/i.test(s)) return null;
  const xs = listOf(s);
  if (!xs) return null;
  const sorted = [...xs].sort((a, b) => (a.sub(b).n < 0n ? -1 : 1));
  const mid = sorted.length >> 1;
  const sum = xs.reduce((a, b) => a.add(b), R(0));
  return {
    value: sorted.length % 2 ? sorted[mid] : sorted[mid - 1].add(sorted[mid]).div(R(2)),
    why: `median of ${sorted.length} values`,
    // The two errors a median item diagnoses are both computable from the same
    // list: reporting the MEAN, and reporting the SUM.
    ops: { sum, mean: sum.div(R(xs.length)) },
  };
}

/** "the range of 12, 7, 19, 4 and 15" → max − min. */
function rangeOf(stem) {
  const s = String(stem);
  if (!/\brange\b/i.test(s) || /interquartile/i.test(s)) return null;
  const xs = listOf(s);
  if (!xs) return null;
  const sorted = [...xs].sort((a, b) => (a.sub(b).n < 0n ? -1 : 1));
  return { value: sorted.at(-1).sub(sorted[0]), why: "max − min" };
}

/** "absolute deviations of 3, 1, 5, 2, 4. What is the MAD?" */
function madOf(stem) {
  const s = String(stem);
  if (!/\bMAD\b|mean absolute deviation/i.test(s)) return null;
  if (!/absolute deviations? of/i.test(s)) return null;
  const xs = listOf(s);
  if (!xs) return null;
  const sum = xs.reduce((a, b) => a.add(b), R(0));
  return { value: sum.div(R(xs.length)), why: "mean of deviations", ops: { sum } };
}

/** "Solve: m − 11 = 25" / "6x = 42" / "n / 3 = 8" / "x + 7 = 19". */
function solveLinear(stem) {
  const s = String(stem).replace(/^solve:?\s*/i, "");
  let m = rx(`^\\s*[a-z]\\s*([+\\-−])\\s*${N}\\s*=\\s*${N}\\s*\$`).exec(s);
  if (m) {
    const a = dec(m[2]);
    const b = dec(m[3]);
    if (!a || !b) return null;
    return /[+]/.test(m[1])
      ? { value: b.sub(a), why: `${m[3]} − ${m[2]}` }
      : { value: b.add(a), why: `${m[3]} + ${m[2]}` };
  }
  m = rx(`^\\s*${N}\\s*[a-z]\\s*=\\s*${N}\\s*\$`).exec(s);
  if (m) {
    const a = dec(m[1]);
    const b = dec(m[2]);
    if (!a || !b || a.n === 0n) return null;
    return { value: b.div(a), why: `${m[2]} ÷ ${m[1]}` };
  }
  m = rx(`^\\s*[a-z]\\s*(?:/|÷)\\s*${N}\\s*=\\s*${N}\\s*\$`).exec(s);
  if (m) {
    const a = dec(m[1]);
    const b = dec(m[2]);
    if (!a || !b) return null;
    return { value: b.mul(a), why: `${m[2]} × ${m[1]}` };
  }
  return null;
}

/** "Evaluate 4n + 3 when n = 5." / "Evaluate 30 − 4y when y = 6." */
function evaluateLinear(stem) {
  const s = String(stem);
  let m = rx(`${N}\\s*([a-z])\\s*([+\\-−])\\s*${N}\\s*when\\s*\\2\\s*=\\s*${N}`).exec(s);
  if (m) {
    const [k, c, v] = [dec(m[1]), dec(m[4]), dec(m[5])];
    if (!k || !c || !v) return null;
    const kv = k.mul(v);
    return {
      value: /[+]/.test(m[3]) ? kv.add(c) : kv.sub(c),
      why: `${m[1]}·${m[5]} ${m[3]} ${m[4]}`,
    };
  }
  m = rx(`${N}\\s*([+\\-−])\\s*${N}\\s*([a-z])\\s*when\\s*\\4\\s*=\\s*${N}`).exec(s);
  if (m) {
    const [c, k, v] = [dec(m[1]), dec(m[3]), dec(m[5])];
    if (!c || !k || !v) return null;
    const kv = k.mul(v);
    return {
      value: /[+]/.test(m[2]) ? c.add(kv) : c.sub(kv),
      why: `${m[1]} ${m[2]} ${m[3]}·${m[5]}`,
    };
  }
  // "In the equation y = 5x, what is y when x = 6?"
  m = rx(`y\\s*=\\s*${N}\\s*x\\b[\\s\\S]*?x\\s*=\\s*${N}`).exec(s);
  if (m) {
    const k = dec(m[1]);
    const v = dec(m[2]);
    if (!k || !v) return null;
    return { value: k.mul(v), why: `${m[1]} × ${m[2]}` };
  }
  return null;
}

/** "What is the value of 6²?" / "4³" — a single power with a superscript. */
const SUP = { "⁰": 0, "¹": 1, "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9 };
function power(stem) {
  const s = String(stem);
  if (!/value of/i.test(s)) return null;
  const m = /(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/.exec(s);
  if (!m) return null;
  const e = [...m[2]].reduce((acc, ch) => acc * 10 + SUP[ch], 0);
  if (e > 6) return null;
  return { value: R(Number(m[1]) ** e), why: `${m[1]}^${e}` };
}

/** "What is 3/4 ÷ 1/2?" — one operation between two fractions or a whole. */
function fractionOp(stem) {
  const s = String(stem).replace(/,/g, "");
  const F = "(?:(\\d+)\\s+)?(\\d+)\\s*/\\s*(\\d+)";
  let m = rx(`^\\s*what is\\s*${F}\\s*([÷×x*+\\-−])\\s*${F}\\s*\\?`).exec(s);
  let left;
  let right;
  let op;
  if (m) {
    left = R((Number(m[1] || 0) * Number(m[3]) + Number(m[2])) * 1, Number(m[3]));
    op = m[4];
    right = R((Number(m[5] || 0) * Number(m[7]) + Number(m[6])) * 1, Number(m[7]));
  } else {
    m = rx(`^\\s*what is\\s*(\\d+)\\s*([÷×])\\s*${F}\\s*\\?`).exec(s);
    if (!m) return null;
    // F contributes (whole?, numerator, denominator) at m[3..5] — reading them
    // in any other order silently divides by the wrong fraction.
    left = R(Number(m[1]));
    op = m[2];
    right = R(Number(m[3] || 0) * Number(m[5]) + Number(m[4]), Number(m[5]));
  }
  if (right.n === 0n && /[÷]/.test(op)) return null;
  if (/[÷]/.test(op)) {
    /* "6 ÷ 1/2" is done as 6 × 2, so the error a distractor names is 6 ÷ 2.
     * Only stated for a UNIT fraction, where "the number you multiply by" is
     * unambiguous. */
    const unit = right.n === 1n;
    return {
      value: left.div(right),
      why: "fraction ÷",
      ops: unit ? { a: left, b: R(right.d), op: "×" } : null,
    };
  }
  if (/[×x*]/.test(op)) return { value: left.mul(right), why: "fraction ×" };
  if (/[+]/.test(op)) return { value: left.add(right), why: "fraction +" };
  return { value: left.sub(right), why: "fraction −" };
}

const RECOGNIZERS = [
  ["fraction-op", fractionOp],
  ["prism-dims", prismDims],
  ["base-area-height", baseAreaHeight],
  ["triangle-area", triangleArea],
  ["trapezoid-area", trapezoidArea],
  ["parallelogram-area", parallelogramArea],
  ["rectangle-area", rectangleArea],
  ["mean", meanOf],
  ["median", medianOf],
  ["range", rangeOf],
  ["mad", madOf],
  ["solve-linear", solveLinear],
  ["evaluate-linear", evaluateLinear],
  ["power", power],
  ["percent-of", partOfWhole],
  ["binary-op", binaryOp],
];

/** First recognizer that speaks up wins; order above is most-specific first. */
export function recompute(stem) {
  if (META_STEM.test(String(stem ?? ""))) return null;
  for (const [name, fn] of RECOGNIZERS) {
    let got = null;
    try {
      got = fn(stem);
    } catch {
      got = null;
    }
    if (got?.value) return { ...got, recognizer: name };
  }
  return null;
}

/* ── distractor errors that are computable from the same numbers ───────────── */
const PAIRING = {
  "op-added-instead-of-multiplied": (o) => (o.op === "×" ? o.a.add(o.b) : null),
  "op-multiplied-instead-of-added": (o) => (o.op === "+" ? o.a.mul(o.b) : null),
  "op-divided-instead-of-multiplied": (o) => (o.op === "×" && o.b.n !== 0n ? o.a.div(o.b) : null),
  "op-multiplied-instead-of-divided": (o) => (o.op === "÷" ? o.a.mul(o.b) : null),
  "op-reversed-division": (o) => (o.op === "÷" && o.a.n !== 0n ? o.b.div(o.a) : null),
  "geom-volume-added-dimensions": (o) => (o.dims ? o.dims.reduce((x, y) => x.add(y), R(0)) : null),
  "geom-triangle-area-no-half": (o) =>
    o.halved && o.dims?.length === 2 ? o.dims[0].mul(o.dims[1]) : null,
  "geom-surface-area-as-volume": (o) =>
    o.dims?.length === 3 ? o.dims.reduce((x, y) => x.mul(y), R(1)) : null,
  "measure-area-perimeter-swap": (o) =>
    o.dims?.length === 2 ? o.dims[0].add(o.dims[1]).mul(R(2)) : null,
  "stat-summed-instead-of-averaged": (o) => (o.sum ? o.sum : null),
  "stat-mean-vs-median": (o) => (o.mean ? o.mean : null),
};

/* The operand context comes from the RECOGNIZER that computed the answer, never
 * from a second parse of the stem. The first version re-scanned for a binary
 * operation and read the "1/2" in "What is 1/2 of 60?" as 1 ÷ 2, so
 * "multiplied instead of divided" expected 2 where the distractor correctly
 * says 120. A pairing rule may only ever see the numbers the answer was
 * actually computed from. */
const operands = (computed) => computed.ops || null;

/* ── bilingual number agreement ───────────────────────────────────────────── */
/** Numbers a reader SEES, normalized so 1,472 and 1.472 (es) count the same. */
function numberBag(text) {
  return (
    String(text ?? "")
      .replace(/[.,](?=\d{3}\b)/g, "")
      .match(/\d+(?:[.,]\d+)?/g)
      ?.map((n) => n.replace(",", "."))
      .map((n) => String(Number(n)))
      .sort()
      .join(" ") ?? ""
  );
}

/* ── the hand-derivation ledger ───────────────────────────────────────────────
 * Not every stem is machine-readable, and a recognizer that GUESSES at one is
 * worse than one that declines. But "no recognizer reads it" must not become
 * "nobody checked it" — that is exactly how an answer gets authored by eye.
 *
 * So every question the 2026-08-26 on-ramp pass NEWLY AUTHORED whose stem no
 * recognizer reads is written down here with the arithmetic that produces its
 * answer, computed in code from the stem's own numbers. Each entry pins two
 * things against the live config: the exact answer TEXT, and the multiset of
 * numbers that answer states. Re-wording the answer, or editing the question's
 * numbers without redoing the arithmetic, fails here.
 *
 * Conceptual items with no numeric answer ("Which recipe is more lemony?",
 * "Multiplying by 10 makes the number…") are deliberately absent: there is no
 * arithmetic to record, and listing them would only pad the count.
 * -------------------------------------------------------------------------- */
const HAND_DERIVED = [
  {
    id: "1-1",
    q: 3,
    answer: "15 apples",
    numbers: () => [R(3).mul(R(5))],
    why: "3 bags × 5 apples",
  },
  { id: "1-2", q: 3, answer: "4 slices", numbers: () => [R(8).div(R(2))], why: "half of 8 slices" },
  {
    id: "1-5",
    q: 2,
    answer: "8 cubic cm",
    numbers: () => [R(2).mul(R(2)).mul(R(2))],
    why: "2 × 2 × 2",
  },
  { id: "1-6", q: 3, answer: "17", numbers: () => [R(20).sub(R(3))], why: "20 − 3" },
  {
    id: "2-1",
    q: 3,
    answer: "4 feet",
    numbers: () => [R(40).div(R(10))],
    why: "volume ÷ base area",
  },
  {
    id: "2-7",
    q: 4,
    answer: "8 boxes, 2 left over",
    numbers: () => [R(50 - (50 % 6)).div(R(6)), R(50 % 6)],
    why: "50 ÷ 6 = 8 remainder 2",
  },
  { id: "3-1", q: 1, answer: "4/3", numbers: () => [R(4), R(3)], why: "3/4 flipped" },
  { id: "3-3", q: 1, answer: "$0.50", numbers: () => [R(300, 100).div(R(6))], why: "$3.00 ÷ 6" },
  {
    id: "3-3",
    q: 3,
    answer: "30 miles per gallon",
    numbers: () => [R(120).div(R(4))],
    why: "120 miles ÷ 4 gallons",
  },
  {
    id: "3-8",
    q: 1,
    answer: "about 22 pounds",
    numbers: () => [R(10).mul(R(22, 10))],
    why: "10 kg × 2.2 lb per kg",
  },
  {
    id: "3-9",
    q: 1,
    answer: "120 pages",
    numbers: () => [R(30).mul(R(4))],
    why: "30 pages/min × 4 min",
  },
  {
    id: "5-8",
    q: 2,
    answer: "62 cm²",
    numbers: () => [[10, 10, 6, 6, 15, 15].reduce((a, b) => a.add(R(b)), R(0))],
    why: "every face added",
  },
];

/** The numbers a Rat states the way a student writes them: 1/2 → "0.5", 4 → "4". */
const ratText = (r) => {
  const scaled = Number(r.n) / Number(r.d);
  return String(scaled);
};

function checkLedger(configOf) {
  const out = [];
  for (const entry of HAND_DERIVED) {
    const cfg = configOf(entry.id);
    const question = cfg?.warmup?.questions?.[entry.q - 1];
    if (!question) {
      out.push(
        `${entry.id} Q${entry.q}: the hand-derived ledger names a question that is not there`,
      );
      continue;
    }
    const marked = question.choices?.[question.correctIndex];
    if (marked !== entry.answer) {
      out.push(
        `${entry.id} Q${entry.q}: marked answer is "${marked}", but the ledger derived "${entry.answer}" (${entry.why})`,
      );
      continue;
    }
    const derived = entry.numbers().map(ratText).sort().join(" ");
    if (numberBag(entry.answer) !== derived)
      out.push(
        `${entry.id} Q${entry.q}: "${entry.answer}" states [${numberBag(entry.answer)}] but ${entry.why} gives [${derived}]`,
      );
  }
  return out;
}

/* ── fixtures: prove every detector fires BEFORE trusting a clean sweep ────── */
const selfTests = [];
const T = (label, fn) => selfTests.push([label, fn]);
const eqRat = (got, want) => got && got.value.eq(want);

T("binary division", () => eqRat(recompute("What is 936 ÷ 8?"), R(117)));
T("binary division is exact, not rounded", () => !eqRat(recompute("What is 936 ÷ 8?"), R(118)));
T("decimal product", () => eqRat(recompute("What is 3.6 × 2.5?"), R(9)));
T("decimal product 0.4 × 0.7", () => eqRat(recompute("What is 0.4 × 0.7?"), R(28, 100)));
T("decimal sum", () => eqRat(recompute("What is 14.6 + 3.85?"), R(1845, 100)));
T("decimal difference", () => eqRat(recompute("What is 50 − 23.47?"), R(2653, 100)));
T("percent of", () => eqRat(recompute("What is 10% of 320?"), R(32)));
T("half of", () => eqRat(recompute("What is half of 20?"), R(10)));
T("fraction of", () => eqRat(recompute("What is 1/2 of 60?"), R(30)));
T("prism volume", () =>
  eqRat(
    recompute("What is the volume of a rectangular prism with l = 6 cm, w = 2 cm and h = 3 cm?"),
    R(36),
  ),
);
T("prism surface area", () =>
  eqRat(
    recompute("What is the surface area of a rectangular prism with l = 5 cm, w = 4 cm, h = 3 cm?"),
    R(94),
  ),
);
T("base area × height", () =>
  eqRat(
    recompute(
      "A box has a base area of 24 square inches and a height of 5 inches. What is its volume?",
    ),
    R(120),
  ),
);
T("triangle area halves", () =>
  eqRat(recompute("What is the area of a triangle with base 12 cm and height 5 cm?"), R(30)),
);
T(
  "triangle area is NOT the un-halved product",
  () => !eqRat(recompute("What is the area of a triangle with base 12 cm and height 5 cm?"), R(60)),
);
T("trapezoid area", () =>
  eqRat(
    recompute("What is the area of a trapezoid with bases 5 cm and 9 cm and height 6 cm?"),
    R(42),
  ),
);
T("parallelogram area", () =>
  eqRat(recompute("What is the area of a parallelogram with base 9 in and height 4 in?"), R(36)),
);
T("rectangle area", () =>
  eqRat(recompute("What is the area of a rectangle 8 cm long and 5 cm wide?"), R(40)),
);
T("mean", () => eqRat(recompute("Find the mean of 10, 14, 8, 12 and 16."), R(12)));
T("median sorts first", () =>
  eqRat(
    recompute("Order these values from least to greatest: 12, 7, 15, 9, 11. What is the median?"),
    R(11),
  ),
);
T("median of an even count averages the middles", () =>
  eqRat(recompute("Find the median of 4, 8, 6, 10."), R(7)),
);
T("range", () => eqRat(recompute("What is the range of 12, 7, 19, 4 and 15?"), R(15)));
T("mad", () =>
  eqRat(recompute("A data set has absolute deviations of 3, 1, 5, 2, 4. What is the MAD?"), R(3)),
);
T("solve subtraction", () => eqRat(recompute("Solve: m − 11 = 25"), R(36)));
T("solve addition", () => eqRat(recompute("Solve: n + 15 = 42"), R(27)));
T("solve multiplication", () => eqRat(recompute("Solve: 6x = 42"), R(7)));
T("solve division", () => eqRat(recompute("Solve: n / 3 = 8"), R(24)));
T("evaluate kx + c", () => eqRat(recompute("Evaluate 4n + 3 when n = 5."), R(23)));
T("evaluate c − kx", () => eqRat(recompute("Evaluate 30 − 4y when y = 6."), R(6)));
T("power", () => eqRat(recompute("What is the value of 4³?"), R(64)));
T("fraction division", () => eqRat(recompute("What is 3/4 ÷ 1/2?"), R(3, 2)));
T("whole ÷ unit fraction", () => eqRat(recompute("What is 10 ÷ 1/4?"), R(40)));
T("mixed number division", () => eqRat(recompute("What is 3 1/2 ÷ 1/4?"), R(14)));
T(
  "declines a multi-operator expression — order of operations is not arithmetic",
  () => recompute("Evaluate: 5 + 3 × 2²") === null,
);
T("declines an algebraic simplification", () => recompute("Simplify 6a + 4 − 2a.") === null);
T(
  "declines a grouping question that merely contains numbers",
  () => recompute("Which grouping makes 4 × 25 × 7 easiest to multiply mentally?") === null,
);
T(
  "declines a composite figure",
  () =>
    recompute(
      "A shape is made of a 5 by 4 rectangle joined to a triangle with base 5 and height 4. What is the total area?",
    ) === null,
);
T(
  "declines a pyramid whose faces are listed",
  () =>
    recompute(
      "A square pyramid has a base 6 cm by 6 cm and four triangular faces of 15 cm² each. What is its surface area?",
    ) === null,
);
T(
  "declines an estimation",
  () => recompute("Estimate 412 ÷ 7 by using friendly numbers.") === null,
);
T(
  "declines a place-value question about an expression",
  () => recompute("In 1.2 × 0.35, how many decimal places does the product have?") === null,
);
T("a unit label is not a variable", () => eqRat(recompute("What is 2.5 × 10?"), R(25)));
T(
  "declines prose it cannot read",
  () => recompute("Which of these is a statistical question?") === null,
);
T(
  "declines a two-step rate it must not guess at",
  () =>
    recompute(
      "A printer prints 240 pages in 8 minutes. At that rate, how many pages does it print in 15 minutes?",
    ) === null,
);
T(
  "declines a reverse problem stated as a given",
  () =>
    recompute(
      "A prism has a base area of 10 square feet and a volume of 45 cubic feet. What is its height?",
    ) === null,
);
T("pairing: added-instead-of-multiplied", () => {
  const c = recompute("What is 7 × 40?");
  return PAIRING["op-added-instead-of-multiplied"](operands(c)).eq(R(47));
});
T("pairing: volume added dimensions", () => {
  const s = "What is the volume of a rectangular prism with l = 6 cm, w = 2 cm and h = 3 cm?";
  return PAIRING["geom-volume-added-dimensions"](operands(recompute(s))).eq(R(11));
});
T("pairing: triangle area with no half", () => {
  const s = "What is the area of a triangle with base 12 cm and height 5 cm?";
  return PAIRING["geom-triangle-area-no-half"](operands(recompute(s))).eq(R(60));
});
T("pairing: perimeter for area", () => {
  const s = "What is the area of a rectangle 8 cm long and 5 cm wide?";
  return PAIRING["measure-area-perimeter-swap"](operands(recompute(s))).eq(R(26));
});
T("pairing: summed instead of averaged", () => {
  const s = "Find the mean of 10, 14, 8, 12 and 16.";
  return PAIRING["stat-summed-instead-of-averaged"](operands(recompute(s))).eq(R(60));
});
T("pairing: the mean offered for the median", () => {
  const s = "The values 3, 5, 7, 9 and 16 are already in order. What is the median?";
  return PAIRING["stat-mean-vs-median"](operands(recompute(s))).eq(R(8));
});
T("pairing: summed instead of the middle value", () => {
  const s = "Find the median of 4, 8, 6, 10.";
  return PAIRING["stat-summed-instead-of-averaged"](operands(recompute(s))).eq(R(28));
});
T("pairing: divided instead of multiplied by a unit fraction's denominator", () => {
  const s = "What is 6 ÷ 1/2?";
  return PAIRING["op-divided-instead-of-multiplied"](operands(recompute(s))).eq(R(3));
});
T("the ledger notices a re-worded answer", () => {
  const fake = { warmup: { questions: [{ choices: ["nope"], correctIndex: 0 }] } };
  return checkLedger(() => fake).length === HAND_DERIVED.length;
});
T("the ledger notices arithmetic that no longer matches", () => {
  const bad = {
    warmup: {
      questions: Array.from({ length: 4 }, () => ({ choices: ["15 apples"], correctIndex: 0 })),
    },
  };
  // Every entry now "matches" 1-1 Q3's answer text; only that one should pass.
  return checkLedger(() => bad).length === HAND_DERIVED.length - 1;
});
T(
  "number bag ignores thousands separators",
  () => numberBag("1,472 ÷ 4") === numberBag("1472 ÷ 4"),
);
T("number bag catches a changed number", () => numberBag("936 ÷ 8") !== numberBag("836 ÷ 8"));
T("number bag is order-free", () => numberBag("4 and 12") === numberBag("12 and 4"));

const selfFailures = selfTests.filter(([, fn]) => {
  try {
    return !fn();
  } catch {
    return true;
  }
});
if (selfFailures.length) {
  console.error(
    "warmup-answers SELF-TEST FAILED — the sweep below would report a clean curriculum:",
  );
  for (const [label] of selfFailures) console.error(`  ✗ ${label}`);
  process.exit(1);
}

/* ── the sweep ────────────────────────────────────────────────────────────── */
const DECIMAL_TAGS = new Set(["decimal-place-value"]);
const HAS_DECIMAL = /\d\.\d/;
const problems = [];
let checked = 0;
let verified = 0;
let pairChecked = 0;
let esVerified = 0;
let esUnparsed = 0;
let taggedTotal = 0;
const byRecognizer = {};

const folders = readdirSync(LESSONS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => d.name)
  .sort();

for (const id of folders) {
  const file = join(LESSONS, id, "config.json");
  if (!existsSync(file)) continue;
  let config;
  try {
    config = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    problems.push(`${id}: config.json does not parse (${error.message})`);
    continue;
  }
  const questions = config.warmup?.questions;
  if (!Array.isArray(questions)) continue;

  for (const [i, q] of questions.entries()) {
    const where = `${id} warm-up Q${i + 1}`;
    checked += 1;

    /* 4. BILINGUAL ATOMICITY — Spanish may not describe different numbers. */
    for (const [en, es, field] of [
      [q.stem, q.stemEs, "stem"],
      [q.explanation, q.explanationEs, "explanation"],
    ]) {
      if (es == null) continue;
      if (numberBag(en) !== numberBag(es))
        problems.push(
          `${where}: ${field} and ${field}Es state different numbers — EN[${numberBag(en)}] vs ES[${numberBag(es)}]`,
        );
    }
    if (Array.isArray(q.choicesEs)) {
      if (q.choicesEs.length !== q.choices?.length)
        problems.push(
          `${where}: choicesEs has ${q.choicesEs.length} entries for ${q.choices?.length} choices`,
        );
      else
        q.choices.forEach((c, j) => {
          if (numberBag(c) !== numberBag(q.choicesEs[j]))
            problems.push(
              `${where}: choice ${j + 1} states different numbers in Spanish — EN "${c}" vs ES "${q.choicesEs[j]}"`,
            );
        });
    }

    /* 3. TAG HYGIENE, extended to warm-ups. */
    const tags = q.misconceptionTags;
    if (Array.isArray(tags)) {
      if (Array.isArray(q.choices) && tags.length !== q.choices.length)
        problems.push(
          `${where}: misconceptionTags has ${tags.length} entries for ${q.choices.length} choices — they are positional`,
        );
      tags.forEach((tag, index) => {
        if (tag == null) return;
        taggedTotal += 1;
        const resolved = resolveAuthoredTag(tag);
        if (!resolved) {
          problems.push(`${where}: tag "${tag}" resolves to nothing`);
          return;
        }
        if (!MISCONCEPTIONS[resolved]?.label || !MISCONCEPTIONS[resolved]?.student)
          problems.push(`${where}: "${resolved}" has no student-facing text`);
        if (index === q.correctIndex)
          problems.push(
            `${where}: the CORRECT choice carries tag "${tag}" — a right answer diagnoses nothing`,
          );
        const text = [q.stem, ...(q.choices || []), q.explanation].filter(Boolean).join(" | ");
        if (DECIMAL_TAGS.has(resolved) && !HAS_DECIMAL.test(text))
          problems.push(
            `${where}: "${tag}" is a DECIMAL error but the item states no decimal — "${String(q.stem).slice(0, 60)}"`,
          );
      });
    }

    /* 1. ANSWER — recomputed from the stem's own numbers. */
    const computed = recompute(q.stem);
    if (!computed) continue;
    byRecognizer[computed.recognizer] = (byRecognizer[computed.recognizer] || 0) + 1;
    verified += 1;

    const marked = q.choices?.[q.correctIndex];
    if (matchesAnswer(computed.value, marked) !== true) {
      problems.push(
        `${where}: marked answer "${marked}" is not ${computed.value.n}/${computed.value.d} (${computed.why}) — ${computed.recognizer}`,
      );
      continue;
    }
    /* The Spanish answer is held to the same arithmetic, but `stripUnits` speaks
     * only English — "40 pies cuadrados" and "120 pulg³" parse to nothing, and
     * teaching it Spanish units would be one more lexicon to go stale. When the
     * value is unreadable the guarantee still holds through the number bag
     * checked above: choicesEs[i] states the same numbers as choices[i], and
     * choices[correctIndex] was just recomputed. Only a Spanish answer that DOES
     * parse and disagrees is a defect. */
    const markedEs = q.choicesEs?.[q.correctIndex];
    if (markedEs != null) {
      const statedEs = parseAnswerValue(markedEs);
      if (statedEs === null) esUnparsed += 1;
      else if (matchesAnswer(computed.value, markedEs) !== true)
        problems.push(
          `${where}: the SPANISH marked answer "${markedEs}" is not ${computed.why} — a Spanish reader is graded against a different number`,
        );
      else esVerified += 1;
    }

    /* 2. DISTRACTOR PAIRING. */
    if (!Array.isArray(tags)) continue;
    const ctx = operands(computed);
    if (!ctx) continue;
    tags.forEach((tag, index) => {
      const resolved = resolveAuthoredTag(tag);
      const rule = resolved && PAIRING[resolved];
      if (!rule || index === q.correctIndex) return;
      let expected = null;
      try {
        expected = rule(ctx);
      } catch {
        expected = null;
      }
      if (!expected) return; // the error is not computable here — not a defect
      pairChecked += 1;
      const stated = parseAnswerValue(q.choices[index]);
      if (!stated || !stated.eq(expected))
        problems.push(
          `${where}: choice ${index + 1} "${q.choices[index]}" is tagged "${tag}", but that error yields ` +
            `${expected.n}/${expected.d} here — the tag no longer names this distractor`,
        );
    });
  }
}

problems.push(
  ...checkLedger((id) => JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"))),
);

if (verified === 0)
  problems.push("the sweep recomputed ZERO answers — every recognizer has stopped matching");
if (taggedTotal === 0)
  problems.push("no warm-up misconceptionTags found at all — the tag sweep matched nothing");

if (problems.length) {
  console.error(`warmup answer sweep FAILED — ${problems.length} problem(s):`);
  for (const p of problems.slice(0, 40)) console.error(`  ✗ ${p}`);
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
  process.exit(1);
}

const spread = Object.entries(byRecognizer)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `${k} ${v}`)
  .join(", ");
console.log(
  `PASS warmup-answers: ${verified}/${checked} warm-up answers recomputed and confirmed in both ` +
    `languages (${spread}); ${pairChecked} tagged distractors re-derived; ` +
    `${HAND_DERIVED.length} hand-derived answers re-checked against their ledger arithmetic; ` +
    `${esVerified} Spanish answers parsed and confirmed outright, ${esUnparsed} held by number-bag ` +
    "agreement with their English twin; " +
    `${selfTests.length} detector self-tests passed first`,
);
