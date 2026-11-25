// Verifier 1: exact arithmetic over numeric claims in Math and Science unit/lesson payloads.
//
// All arithmetic is exact (BigInt rationals, see lib/rational.mjs); floats are never used. A claim is flagged only when
// it is fully decidable: complete numeric sides, units compared as shapes (in^2 is not in^3), no quotation of a student's
// wrong work, no estimates. Everything else is counted as skipped (info), never guessed.
//
// Claim sources (each decided in lib/mathclaims.mjs or here):
//   - "a op b = c" equations/chains, "<" ">" comparisons, "x is c" after an operator expression (any prose string)
//   - "N of M", percent / out-of / fraction value pairs, equivalent ratios, simplest form, unit rates ("240 miles in 4 hours ... 60 miles per hour")
//   - "the sum|difference|product|quotient of a and b is c", reciprocal, expanded form, common denominator
//   - cloze items (blanks filled with their answers, then checked like prose)
//   - multiple-choice items whose stem is a pure expression, "Compare a and b", or "equivalent to a to b": the keyed option
//     must be right and no distractor may also be right
//   - word_sort categories "Equivalent to a to b" / "Not equivalent ..." and match pairs (rate -> unit rate, value = value)
//   - "area|volume|perimeter ... is <n> <unit>" where the unit's dimension cannot be the quantity's (area in cubic units)
//
// False-positive classes found by hand-reading hits (kept exempt on purpose):
//   - quoted/hypothetical work ("Sam says ...", "True or false"), negations, estimates/rounding, and "?" questions
//   - intentionally wrong text: error_analysis "wrong", vocab "nonexample", multiple-choice distractors
//   - "x is 3 more than ..." style comparatives (the number after "is" is followed by more/less/times), range hyphens "10-20"
//   - quantity labels that merely look like units ("5 in the box") are not units unless nothing follows
//   - rounded statements ("1/3 is 0.33") are info skips, not errors
// Limits: it cannot read word problems that need modeling, and it does not understand unit conversion (cm vs m clashes are
// skipped). A passing run means "no decidable arithmetic claim was wrong", not that the lesson is mathematically sound.

import { FIXTURES } from "./lib/fixtures-a.mjs";
import {
  checkRatePair,
  checkText,
  exemptReason,
  parseRatio,
  quotedOrNegated,
  ratioEquivalent,
  splitSentences,
} from "./lib/mathclaims.mjs";
import { evalSide, formatDims, tokenize } from "./lib/numexpr.mjs";
import * as Q from "./lib/rational.mjs";
import { isMathOrScience, optionLabel, rootOf, walkObjects, walkStrings } from "./lib/walk.mjs";

export const name = "arithmetic";
export const fixtures = FIXTURES["arithmetic"];
export const coverageCodes = ["ARITH_CHECKED"];
const AREA_WORDS = { area: 2, "surface area": 2, volume: 3, perimeter: 1, circumference: 1 };
const NOUN_CLAIM =
  /\b(surface area|area|volume|perimeter|circumference)\b(?:\s+of\s+(?:the|a|an|this|that|each|one)?\s*[^,.;:=?!]{0,40}?)?\s+(?:is|are|=|equals|was)\s+((?:\d[\d,]*(?:\.\d+)?)\s*(?:square|cubic|sq\.?)?\s*[A-Za-z]*(?:\^\s?[23]|[²³])?)/gi;

const bad = (code, path, message, evidence = {}) => ({
  status: "bad",
  code,
  path,
  message,
  evidence,
});

function dimensionClaims(sentence, path) {
  const out = [];
  for (const m of sentence.matchAll(NOUN_CLAIM)) {
    const toks = tokenize(m[2]);
    const q = toks[0];
    if (!q || q.t !== "num" || !Object.keys(q.dims).length) continue;
    const total = Object.values(q.dims).reduce((a, b) => a + b, 0);
    const want = AREA_WORDS[m[1].toLowerCase()];
    if (total === want) out.push({ status: "ok", kind: "dimension" });
    else
      out.push({
        status: "bad",
        kind: "dimension",
        path,
        code: "ARITH_UNIT_MISMATCH",
        message: `${m[1]} must be measured in length^${want}, but "${m[2].trim()}" is length^${total}`,
        evidence: { text: m[0], units: formatDims(q.dims) },
      });
  }
  return out;
}

function proseClaims(text, path) {
  const results = [];
  for (const sentence of splitSentences(text)) {
    if (exemptReason(sentence)) {
      results.push(...checkText(sentence).map((r) => ({ ...r, path })));
      continue;
    }
    results.push(
      ...checkText(sentence).map((r) => ({ ...r, path })),
      ...dimensionClaims(sentence, path),
    );
  }
  return results;
}

const pureValue = (label) => {
  const toks = tokenize(String(label ?? ""));
  if (!toks.length || toks.some((t) => !["num", "op", "lp", "rp", "punct"].includes(t.t)))
    return null;
  const core = toks.filter((t) => t.t !== "punct");
  const v = evalSide(core);
  return v.skip ? null : { ...v, hasOp: core.some((t) => t.t === "op") };
};

const STEM =
  /^(?:what is|solve|find|calculate|compute|evaluate|simplify|how much is|what is the value of)\s+(.+?)\s*[?.:]?\s*$/i;
const COMPARE =
  /^compare\s+(.+?)\s+and\s+(.+?)[.?:]\s*(?:tell\s+)?which\b.*?\b(greater|larger|bigger|less|smaller|lesser)\b/i;
const EQUIV =
  /\bequivalent\s+(?:ratio\s+|fraction\s+)?to\s+(\d+(?:\.\d+)?\s*(?:to|:)\s*\d+(?:\.\d+)?|\d+\/\d+)/i;

const ratioOrFraction = (text) => {
  const r = parseRatio(String(text));
  if (r) return r;
  const m = /^\s*(\d+)\/(\d+)\s*$/.exec(String(text));
  return m ? [Q.make(BigInt(m[1])), Q.make(BigInt(m[2]))] : null;
};

/** Multiple-choice items: decide which options are correct for the stem, then compare with the key. */
function checkChoice(obj, path) {
  const stem = String(obj.q ?? obj.say ?? obj.prompt ?? "");
  const labels = obj.options.map(optionLabel);
  const key = obj.answer;
  if (!stem || key < 0 || key >= labels.length) return [];
  const correctIdx = [];
  let kind = null;
  const expr = STEM.exec(stem.trim());
  const cmpM = COMPARE.exec(stem.trim());
  const eqM = EQUIV.exec(stem);
  if (expr && !quotedOrNegated(stem)) {
    const want = pureValue(expr[1]);
    if (want?.hasOp) {
      kind = "expression";
      labels.forEach((l, i) => {
        const v = pureValue(l);
        if (v && Q.eq(v.q, want.q)) correctIdx.push(i);
      });
      if (labels.every((l) => pureValue(l)))
        return decideChoice(kind, correctIdx, key, path, stem, labels, Q.toString(want.q));
      return [];
    }
  }
  if (cmpM) {
    const a = pureValue(cmpM[1]);
    const b = pureValue(cmpM[2]);
    if (!a || !b) return [];
    const pickMax = /greater|larger|bigger/i.test(cmpM[3]);
    const target = Q.cmp(a.q, b.q) === 0 ? null : pickMax === Q.cmp(a.q, b.q) > 0 ? a : b;
    if (!target) return [];
    kind = "compare";
    if (!labels.every((l) => pureValue(l))) return [];
    labels.forEach((l, i) => {
      if (Q.eq(pureValue(l).q, target.q)) correctIdx.push(i);
    });
    return decideChoice(kind, correctIdx, key, path, stem, labels, Q.toString(target.q));
  }
  if (eqM && !quotedOrNegated(stem)) {
    const base = ratioOrFraction(eqM[1]);
    if (!base || !labels.every((l) => ratioOrFraction(l))) return [];
    kind = "equivalent";
    labels.forEach((l, i) => {
      const r = ratioOrFraction(l);
      if (ratioEquivalent(base[0], base[1], r[0], r[1])) correctIdx.push(i);
    });
    return decideChoice(kind, correctIdx, key, path, stem, labels, eqM[1]);
  }
  return [];
}

function decideChoice(kind, correctIdx, key, path, stem, labels, expected) {
  const evidence = { stem, expected, options: labels, key };
  const out = [];
  if (!correctIdx.includes(key))
    out.push(
      bad(
        "ARITH_KEY_MISMATCH",
        `${path}.answer`,
        `keyed option "${labels[key]}" is not the ${kind} answer (${expected})`,
        evidence,
      ),
    );
  for (const i of correctIdx)
    if (i !== key)
      out.push(
        bad(
          "ARITH_DUPLICATE_CORRECT",
          `${path}.options[${i}]`,
          `distractor "${labels[i]}" is also correct for the ${kind} stem`,
          evidence,
        ),
      );
  if (!out.length) out.push({ status: "ok", kind });
  return out;
}

function checkSort(obj, path) {
  const eqCat = obj.categories.findIndex((c) => /^equivalent to\b/i.test(String(c.name)));
  if (
    eqCat < 0 ||
    obj.categories.filter((c) => /^equivalent to\b/i.test(String(c.name))).length !== 1
  )
    return [];
  const base = ratioOrFraction(
    String(obj.categories[eqCat].name).replace(/^equivalent to\s+/i, ""),
  );
  if (!base) return [];
  const out = [];
  obj.items.forEach((it, i) => {
    const r = ratioOrFraction(it.text);
    const cat = String(obj.categories[it.cat]?.name || "");
    if (!r || !(it.cat === eqCat || /^not equivalent/i.test(cat))) return;
    const equiv = ratioEquivalent(base[0], base[1], r[0], r[1]);
    if (equiv === (it.cat === eqCat)) out.push({ status: "ok", kind: "sort", path });
    else
      out.push(
        bad(
          "ARITH_SORT_WRONG",
          `${path}.items[${i}]`,
          `"${it.text}" is ${equiv ? "" : "not "}equivalent to ${obj.categories[eqCat].name.replace(/^equivalent to\s+/i, "")} but sits in "${cat}"`,
          { item: it.text, category: cat },
        ),
      );
  });
  return out;
}

function checkMatch(obj, path) {
  const out = [];
  obj.pairs.forEach((p, i) => {
    const at = `${path}.pairs[${i}]`;
    const rate = checkRatePair(p.l, p.r)[0];
    if (rate) {
      out.push({ ...rate, path: at });
      return;
    }
    const l = pureValue(p.l);
    const r = pureValue(p.r);
    if (l && r && (l.hasOp || r.hasOp)) {
      if (Q.eq(l.q, r.q)) out.push({ status: "ok", kind: "match", path: at });
      else
        out.push(
          bad(
            "ARITH_MATCH_WRONG",
            at,
            `"${p.l}" and "${p.r}" are paired but ${Q.toString(l.q)} is not ${Q.toString(r.q)}`,
            { l: p.l, r: p.r },
          ),
        );
    }
  });
  return out;
}

function clozeText(obj) {
  if (typeof obj.text !== "string" || !Array.isArray(obj.answers)) return null;
  return obj.text.replace(/\{(\d+)\}/g, (m, n) => String(obj.answers[Number(n) - 1] ?? m));
}

/** verify(target) -> findings. target = { id, grade, subject, studio, lessons } */
export function verify(target) {
  if (!isMathOrScience(target))
    return [
      {
        code: "ARITH_NOT_APPLICABLE",
        severity: "info",
        path: "",
        message: "arithmetic applies to math and science units only",
        evidence: {},
      },
    ];
  const root = rootOf(target);
  const decided = [];
  for (const s of walkStrings(root)) {
    if (s.distractor) continue;
    decided.push(...proseClaims(s.text, s.path));
  }
  for (const { path, obj } of walkObjects(root)) {
    if (obj.kind === "cloze" && obj.payload) {
      const filled = clozeText(obj.payload);
      if (filled) decided.push(...proseClaims(filled, `${path}.payload.text(filled)`));
    }
    if (Array.isArray(obj.options) && Number.isInteger(obj.answer))
      decided.push(...checkChoice(obj, path));
    if (Array.isArray(obj.categories) && Array.isArray(obj.items))
      decided.push(...checkSort(obj, path));
    if (Array.isArray(obj.pairs) && obj.pairs.every((p) => p && typeof p.l === "string"))
      decided.push(...checkMatch(obj, path));
  }
  const findings = [];
  const skipReasons = {};
  const byKind = {};
  let checked = 0;
  for (const r of decided) {
    if (r.status === "skip") skipReasons[r.reason] = (skipReasons[r.reason] || 0) + 1;
    else {
      checked += 1;
      byKind[r.kind] = (byKind[r.kind] || 0) + 1;
    }
    if (r.status === "bad")
      findings.push({
        code: r.code,
        severity: "error",
        path: r.path,
        message: r.message,
        evidence: r.evidence || {},
      });
  }
  findings.push({
    code: "ARITH_CHECKED",
    severity: "info",
    path: "",
    message: `${checked} decidable claims checked`,
    evidence: { n: checked, byKind },
  });
  const skipped = Object.values(skipReasons).reduce((a, b) => a + b, 0);
  if (skipped)
    findings.push({
      code: "ARITH_SKIPPED",
      severity: "info",
      path: "",
      message: `${skipped} claims not decidable or exempt`,
      evidence: { n: skipped, reasons: skipReasons },
    });
  return findings;
}
