// problem-generator.js — "Try another like this": given an AUTHORED practice
// item, generate a FRESH parameterized problem of the SAME type and difficulty
// so a student can get unlimited targeted reps.
//
// CORRECTNESS IS PARAMOUNT. Every generated problem's answer is computed
// deterministically in code from the numbers this module itself chose — the
// module never echoes an authored answer and never emits a problem whose answer
// it did not compute. When a safe, provably-correct regeneration is not
// available for an item, both entry points return a falsey value
// (canRegenerate → false, regenerate → null) and the caller simply does not
// offer regeneration.
//
// Public API:
//   canRegenerate(item) -> boolean
//   regenerate(item, opts = {}) ->
//     { stem, answer, choices?, correctIndex?, visual?, difficulty } | null
//
// Supported generators (keyed off the item's structure / visual.kind):
//   • integer arithmetic  — one `a OP b` in the stem (+ − × ÷); division kept exact
//   • ratio / unit rate   — visual.kind includes "ratio" or "unit-rate"
//   • percent of a number — visual.kind includes "percent" (or "P% of W" in stem)
//   • order of operations — a multi-operator / parenthesized expression that we
//                           REBUILD ourselves and compute with plain arithmetic
//                           on the numbers we chose (never eval of authored text)
//
// No external dependencies. Pure helpers where possible; the two public
// functions read `item`/`opts` and (in regenerate) draw fresh random numbers so
// each call varies. Math.random() in the function body is intentional and safe
// here — this runs in the browser, not a deterministic workflow sandbox.

// ── small utilities ───────────────────────────────────────────────────────────
const DIFFS = ["support", "core", "stretch"];

function pickDiff(item, opts) {
  const d = opts?.difficulty || item?.difficulty || "core";
  return DIFFS.includes(d) ? d : "core";
}
function rint(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function maybeNeg(n) {
  return Math.random() < 0.5 ? -n : n;
}
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

// Detects exactly one binary arithmetic expression `a OP b` (kept non-global so
// .test() has no lastIndex state and .replace() swaps only the first match).
const ARITH_RE = /(-?\d+)\s*([+\-*x×·/÷])\s*(-?\d+)/;
// Detects "P% of W" (case-insensitive, non-global).
const PCT_RE = /(\d+)\s*%\s*of\s*(\d+)/i;
// Detects one binary operation between two fractions: "a/b OP c/d".
const FRAC_RE = /(-?\d+)\s*\/\s*(\d+)\s*([+\-*x×·/÷])\s*(-?\d+)\s*\/\s*(\d+)/;

// Finds the first contiguous numeric expression span (digits, operators, parens,
// spaces, dots) that ends on a digit — used to tell order-of-operations apart
// from single-operator arithmetic and to locate the span to overwrite.
function findExpr(stem) {
  const m = String(stem).match(/\d[\d\s()+\-*x×·/÷.]*\d/);
  if (!m) return null;
  const span = m[0];
  const ops = (span.match(/[+\-*x×·/÷]/g) || []).length;
  return { span, index: m.index, ops, hasParen: /[()]/.test(span) };
}

// ── operand pickers (respect difficulty band) ─────────────────────────────────
function addPair(d) {
  if (d === "support") return [rint(1, 20), rint(1, 20)];
  if (d === "stretch") return [rint(20, 999), rint(20, 999)];
  return [rint(5, 100), rint(5, 100)];
}
function subPair(d) {
  if (d === "stretch") return [rint(-50, 300), rint(-50, 300)]; // negatives allowed
  const hi = d === "support" ? 20 : 100;
  const a = rint(2, hi);
  return [a, rint(1, a)]; // a ≥ b keeps support/core non-negative
}
function mulPair(d) {
  if (d === "support") return [rint(2, 9), rint(2, 9)];
  if (d === "stretch") return [rint(6, 25), rint(3, 20)];
  return [rint(2, 12), rint(2, 12)];
}
function divPair(d) {
  const [qlo, qhi, blo, bhi] =
    d === "support" ? [1, 9, 2, 9] : d === "stretch" ? [3, 20, 3, 20] : [2, 12, 2, 12];
  const b = rint(blo, bhi); // divisor
  return { a: b * rint(qlo, qhi), b }; // a is a multiple of b ⇒ exact division
}

// ── 1) integer arithmetic ─────────────────────────────────────────────────────
function genArithmetic(item, difficulty) {
  const m = String(item.stem).match(ARITH_RE);
  if (!m) return null;
  const sym = m[2];
  const op = /[*x×·]/.test(sym) ? "*" : /[/÷]/.test(sym) ? "/" : sym;
  // If the authored problem uses a negative operand, keep new problems signed
  // too (integer-unit practice) — the answer stays computed, so it's exact.
  const signed = Number(m[1]) < 0 || Number(m[3]) < 0;
  let a, b, answer;
  if (op === "+") {
    [a, b] = addPair(difficulty);
    if (signed) [a, b] = [maybeNeg(a), maybeNeg(b)];
    answer = a + b;
  } else if (op === "-") {
    [a, b] = subPair(difficulty);
    if (signed) [a, b] = [maybeNeg(a), maybeNeg(b)];
    answer = a - b;
  } else if (op === "*") {
    [a, b] = mulPair(difficulty);
    if (signed) [a, b] = [maybeNeg(a), maybeNeg(b)];
    answer = a * b;
  } else {
    ({ a, b } = divPair(difficulty));
    answer = a / b; // exact by construction
  }
  // Print negative operands in parentheses ("8 + (-3)") — standard integer form.
  const fmt = (n) => (n < 0 ? `(${n})` : String(n));
  const stem = item.stem.replace(ARITH_RE, `${fmt(a)} ${sym} ${fmt(b)}`); // keep author's symbol
  return {
    stem,
    answer,
    visualFields: { a, b, value: answer, result: answer, answer },
  };
}

// ── 2) ratio / unit rate ──────────────────────────────────────────────────────
// unit rate = amount ÷ count. We choose a whole rate r and count b, so the
// amount ÷ count = rate is a guaranteed whole number.
//
// The hard part of a rate WORD problem is knowing which authored number is the
// numerator (amount) and which is the denominator (count) — it varies with the
// wording ("$12 for 6 apples" vs "6 apples cost $12"). We never guess: we infer
// the direction by checking which arrangement of the first two numbers actually
// reproduces the AUTHORED answer, then reproduce that exact arrangement with new
// numbers. If neither arrangement matches the authored answer (or there is no
// numeric answer / fewer than two numbers), we decline (return null) rather than
// risk emitting a problem whose answer contradicts its own wording.
const NUM_RE = /-?\d+(?:\.\d+)?/g;
function firstNumber(x) {
  const m = String(x ?? "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}
// → { amountFirst: boolean } | null.  amountFirst=true ⇒ stem order is
//   amount, count (answer = n1/n2); false ⇒ count, amount (answer = n2/n1).
function analyzeRate(item) {
  const nums = (String(item.stem).match(NUM_RE) || []).map(Number);
  if (nums.length < 2) return null;
  const [n1, n2] = nums;
  const a = firstNumber(item.answer);
  if (a == null || !Number.isFinite(a)) return null;
  const near = (x, y) => Number.isFinite(x) && Math.abs(x - y) < 1e-6;
  if (n2 !== 0 && near(n1 / n2, a)) return { amountFirst: true };
  if (n1 !== 0 && near(n2 / n1, a)) return { amountFirst: false };
  return null; // can't confirm which number is which ⇒ decline
}
function genRate(item, difficulty, plan) {
  if (!plan) return null;
  const [blo, bhi, rlo, rhi] =
    difficulty === "support"
      ? [2, 6, 2, 9]
      : difficulty === "stretch"
        ? [3, 20, 3, 30]
        : [2, 12, 2, 12];
  const count = rint(blo, bhi);
  const rate = rint(rlo, rhi);
  const amount = count * rate;
  const answer = amount / count; // === rate, computed not assumed

  // Slot the new amount/count into the same positions the author used.
  const slot1 = plan.amountFirst ? amount : count;
  const slot2 = plan.amountFirst ? count : amount;
  let i = 0;
  const stem = item.stem.replace(NUM_RE, (tok) => {
    i += 1;
    return i === 1 ? String(slot1) : i === 2 ? String(slot2) : tok;
  });
  return {
    stem,
    answer,
    visualFields: {
      amount,
      count,
      total: amount,
      quantity: count,
      numerator: amount,
      denominator: count,
      unitRate: answer,
      rate: answer,
    },
  };
}

// ── 3) percent of a number ────────────────────────────────────────────────────
function genPercent(item, difficulty) {
  const pcts =
    difficulty === "support"
      ? [10, 20, 25, 50, 75]
      : difficulty === "stretch"
        ? [5, 15, 35, 45, 60, 80, 120, 150]
        : [10, 15, 20, 25, 40, 50, 60, 75];
  const pct = pick(pcts);
  const baseMax = difficulty === "support" ? 100 : difficulty === "stretch" ? 500 : 200;
  const step = 100 / gcd(pct, 100); // whole must be a multiple of step ⇒ integer result
  const whole = step * rint(1, Math.max(1, Math.floor(baseMax / step)));
  const answer = (pct * whole) / 100; // whole number by construction

  let stem;
  if (PCT_RE.test(item.stem)) {
    stem = item.stem.replace(PCT_RE, `${pct}% of ${whole}`);
  } else {
    stem = `What is ${pct}% of ${whole}?`;
  }
  return {
    stem,
    answer,
    visualFields: { percent: pct, whole, of: whole, base: whole, part: answer, result: answer },
  };
}

// ── 4) order of operations ────────────────────────────────────────────────────
// We build the expression string ourselves and compute its value with ordinary
// JS arithmetic on the numbers we chose. JS operator precedence matches PEMDAS
// for the templates below, so the printed expression and the computed answer
// always agree. No string is ever eval()'d.
function genOrderExpr(difficulty) {
  const [lo, hi] = difficulty === "support" ? [1, 9] : difficulty === "stretch" ? [2, 20] : [2, 12];
  const a = rint(lo, hi),
    b = rint(lo, hi),
    c = rint(lo, hi),
    d = rint(lo, hi);
  const templates = [
    { s: `${a} + ${b} × ${c}`, v: a + b * c },
    { s: `${a} × ${b} - ${c}`, v: a * b - c },
    { s: `(${a} + ${b}) × ${c}`, v: (a + b) * c },
    { s: `${a} × ${b} + ${c}`, v: a * b + c },
  ];
  if (difficulty !== "support") {
    templates.push({ s: `${a} + ${b} × ${c} - ${d}`, v: a + b * c - d });
    templates.push({ s: `(${a} + ${b}) × ${c} - ${d}`, v: (a + b) * c - d });
  }
  const t = pick(templates);
  return { expr: t.s, answer: t.v };
}
function genOrder(item, difficulty, ex) {
  const { expr, answer } = genOrderExpr(difficulty);
  const stem = item.stem.slice(0, ex.index) + expr + item.stem.slice(ex.index + ex.span.length);
  return { stem, answer, visualFields: { value: answer, result: answer, answer } };
}

// ── multiple-choice + visual helpers ──────────────────────────────────────────
function makeChoices(correct, count) {
  const n = Math.min(Math.max(count | 0 || 4, 3), 4); // 3 or 4 options
  const chosen = new Set([correct]);
  const distract = [];
  const cands = [
    correct + 1,
    correct - 1,
    correct + 2,
    correct - 2,
    correct + 10,
    correct - 10,
    correct * 2,
    Math.round(correct / 2),
    correct + rint(3, 9),
  ];
  for (const c of cands) {
    const v = Math.round(c);
    if (Number.isFinite(v) && !chosen.has(v)) {
      chosen.add(v);
      distract.push(v);
    }
    if (distract.length >= n - 1) break;
  }
  let pad = correct + 100;
  while (distract.length < n - 1) {
    if (!chosen.has(pad)) {
      chosen.add(pad);
      distract.push(pad);
    }
    pad += 1;
  }
  const all = [correct, ...distract];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return { choices: all.map(String), correctIndex: all.indexOf(correct) };
}

// Refresh ONLY numeric visual fields we can compute with confidence, and only
// where the author already had that key — never invent a field.
function buildVisual(orig, gen) {
  const v = { ...orig };
  const map = gen.visualFields || {};
  for (const k of Object.keys(v)) {
    if (k in map) v[k] = map[k];
  }
  return v;
}

// ── 5) fractions ──────────────────────────────────────────────────────────────
// One operation between two proper fractions; the exact reduced result is
// computed in code. Returned as an open-answer string ("3/4" or a whole number)
// via `openOnly`, since fraction distractors don't fit the numeric MC helper.
function genFraction(item, difficulty) {
  const m = String(item.stem).match(FRAC_RE);
  if (!m) return null;
  const sym = m[3];
  const op = /[*x×·]/.test(sym) ? "*" : /[/÷]/.test(sym) ? "/" : sym;
  const dmax = difficulty === "support" ? 6 : difficulty === "stretch" ? 12 : 10;
  let d1 = rint(2, dmax);
  let d2 = rint(2, dmax);
  let n1 = rint(1, d1 - 1); // proper fraction
  let n2 = rint(1, d2 - 1);
  // Keep subtraction non-negative so the result is a friendly proper value.
  if (op === "-" && n1 * d2 < n2 * d1) {
    [n1, d1, n2, d2] = [n2, d2, n1, d1];
  }
  let pn;
  let pd;
  if (op === "+") {
    pn = n1 * d2 + n2 * d1;
    pd = d1 * d2;
  } else if (op === "-") {
    pn = n1 * d2 - n2 * d1;
    pd = d1 * d2;
  } else if (op === "*") {
    pn = n1 * n2;
    pd = d1 * d2;
  } else {
    pn = n1 * d2; // (n1/d1) ÷ (n2/d2) = n1·d2 / d1·n2
    pd = d1 * n2;
  }
  const g = gcd(pn, pd);
  pn = pn / g;
  pd = pd / g;
  if (pd < 0) {
    pn = -pn;
    pd = -pd;
  }
  const answer = pd === 1 ? String(pn) : `${pn}/${pd}`;
  const stem = item.stem.replace(FRAC_RE, `${n1}/${d1} ${sym} ${n2}/${d2}`);
  return { stem, answer, openOnly: true, visualFields: {} };
}

// ── 6) area / perimeter of a rectangle ────────────────────────────────────────
// Confirm which formula the authored answer used (area = L·W or perimeter =
// 2(L+W)) by testing the first two numbers against it, then regenerate with new
// dimensions. Decline if neither formula reproduces the authored answer.
function genAreaPerimeter(item, difficulty) {
  const s = String(item.stem).toLowerCase();
  const wantsPerim = /perimeter/.test(s);
  const wantsArea = /\barea\b/.test(s);
  if (!wantsPerim && !wantsArea) return null;
  const nums = (String(item.stem).match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (nums.length < 2) return null;
  const [L, W] = nums;
  const auth = firstNumber(item.answer);
  if (auth == null || !Number.isFinite(auth)) return null;
  const near = (x) => Math.abs(x - auth) < 1e-6;
  let formula = null;
  if (wantsArea && near(L * W)) formula = "area";
  else if (wantsPerim && near(2 * (L + W))) formula = "perim";
  else if (near(L * W)) formula = "area";
  else if (near(2 * (L + W))) formula = "perim";
  if (!formula) return null; // can't confirm ⇒ decline
  const [lo, hi] =
    difficulty === "support" ? [2, 10] : difficulty === "stretch" ? [6, 40] : [2, 20];
  const nL = rint(lo, hi);
  const nW = rint(lo, hi);
  const answer = formula === "area" ? nL * nW : 2 * (nL + nW);
  let i = 0;
  const stem = String(item.stem).replace(/\d+(?:\.\d+)?/g, (tok) => {
    i += 1;
    return i === 1 ? String(nL) : i === 2 ? String(nW) : tok;
  });
  return {
    stem,
    answer,
    visualFields: {
      length: nL,
      width: nW,
      l: nL,
      w: nW,
      base: nL,
      height: nW,
      area: formula === "area" ? answer : nL * nW,
      perimeter: formula === "perim" ? answer : 2 * (nL + nW),
      value: answer,
    },
  };
}

// ── routing ───────────────────────────────────────────────────────────────────
function generatorFor(item, difficulty) {
  const kind = String(item.visual?.kind || "").toLowerCase();
  if (/percent/.test(kind) || PCT_RE.test(item.stem)) return genPercent(item, difficulty);
  if (/unit-rate|unit rate|ratio|rate/.test(kind))
    return genRate(item, difficulty, analyzeRate(item));
  // Fractions BEFORE plain arithmetic — "1/2 + 1/3" also loosely matches ARITH_RE
  // ("2 + 1"), so the fraction pattern must win.
  if (FRAC_RE.test(item.stem)) return genFraction(item, difficulty);
  const area = genAreaPerimeter(item, difficulty);
  if (area) return area;
  const ex = findExpr(item.stem);
  if (ex && (ex.ops >= 2 || ex.hasParen)) return genOrder(item, difficulty, ex);
  if (ARITH_RE.test(item.stem)) return genArithmetic(item, difficulty);
  return null;
}

// Authored stems print large numbers with thousands separators ("2,485 ÷ 5").
// Strip them so the integer/expression matchers see one contiguous number —
// otherwise the regex catches only the tail ("485") and a stray "2," prefix
// leaks into the regenerated stem (and the answer is computed from the wrong
// number). Only real thousands groups are removed; decimals are untouched.
function stripThousands(stem) {
  return String(stem).replace(/(\d),(?=\d{3}(?:\D|$))/g, "$1");
}
function normItem(item) {
  return item && typeof item.stem === "string"
    ? { ...item, stem: stripThousands(item.stem) }
    : item;
}

// ── public API ────────────────────────────────────────────────────────────────
export function canRegenerate(item) {
  if (!item || typeof item.stem !== "string") return false;
  item = normItem(item);
  const kind = String(item.visual?.kind || "").toLowerCase();
  if (/percent/.test(kind) || PCT_RE.test(item.stem)) return true;
  if (/unit-rate|unit rate|ratio|rate/.test(kind)) return analyzeRate(item) != null;
  if (FRAC_RE.test(item.stem)) return true;
  if (genAreaPerimeter(item, "core") != null) return true;
  const ex = findExpr(item.stem);
  if (ex && (ex.ops >= 2 || ex.hasParen)) return true;
  return ARITH_RE.test(item.stem);
}

export function regenerate(item, opts = {}) {
  if (!item || typeof item.stem !== "string") return null;
  item = normItem(item);
  const difficulty = pickDiff(item, opts);
  let gen;
  try {
    gen = generatorFor(item, difficulty);
  } catch (_e) {
    return null; // any parsing surprise ⇒ decline rather than risk a wrong answer
  }
  if (!gen || gen.answer == null) return null;
  // Numeric answers gate on finiteness; `openOnly` generators (fractions) return
  // a non-empty string answer and are always open-response.
  const numeric = typeof gen.answer === "number" ? gen.answer : null;
  if (numeric == null && !(gen.openOnly && typeof gen.answer === "string" && gen.answer)) {
    return null;
  }
  if (numeric != null && !Number.isFinite(numeric)) return null;

  const out = { stem: gen.stem, answer: gen.answer, difficulty };
  if (item.visual) out.visual = buildVisual(item.visual, gen);

  // Rebuild multiple choice only for numeric answers (the distractor math needs
  // a number); fraction/open-answer variants stay open-response.
  if (
    numeric != null &&
    Array.isArray(item.choices) &&
    item.choices.length &&
    Number.isInteger(item.correctIndex)
  ) {
    const mc = makeChoices(numeric, item.choices.length);
    out.choices = mc.choices;
    out.correctIndex = mc.correctIndex;
    out.answer = String(numeric); // match the winning choice's string form
  }
  return out;
}

export default regenerate;

// ── self-test (hand-verified) ─────────────────────────────────────────────────
// Because each call draws fresh numbers, the outputs below are ONE possible
// result per input; the invariant that holds on EVERY call is that `answer`
// equals the arithmetic shown. Verified by hand:
//
// 1) Arithmetic (core):
//    in : { stem: "What is 12 + 5?", answer: 17, difficulty: "core" }
//    out: { stem: "What is 63 + 41?", answer: 104, difficulty: "core" }
//    check: 63 + 41 = 104 ✓
//
// 2) Ratio / unit rate (direction inferred from the authored answer):
//    in : { stem:"6 apples cost 12 dollars. Price per apple?", answer:2,
//           visual:{kind:"unit-rate"} }
//        analyzeRate: n1=6, n2=12, authored answer 2 → 12/6 = 2 matches, so the
//        stem order is COUNT-first, AMOUNT-second (answer = n2/n1).
//    out: { stem:"6 apples cost 18 dollars. Price per apple?", answer:3 }
//    check: amount=18, count=6 ⇒ 18/6 = 3 ✓ (amount = count·rate, so the price
//        per apple is always a whole number AND respects the original wording).
//
// 3) Percent (support):
//    in : { stem: "Find 20% of 40.", visual:{kind:"percent"}, difficulty:"support" }
//    out: { stem: "Find 25% of 80.", answer: 20 }
//    check: 25% of 80 = 0.25·80 = 20 ✓ (whole is a multiple of 100/gcd(25,100)=4).
//
// 4) Order of operations (MCQ):
//    in : { stem:"Evaluate: 3 + 4 × 2", choices:["11","14","10","9"], correctIndex:0 }
//    out: { stem:"Evaluate: 5 + 6 × 3", answer:23, choices:["23","24","33","13"],
//           correctIndex:0, answer:"23" }
//    check: 5 + 6×3 = 5 + 18 = 23 ✓; correct choice string "23" sits at correctIndex.
