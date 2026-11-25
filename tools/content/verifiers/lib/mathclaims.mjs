// Sentence-level numeric claim checks. Every function returns results:
//   { status: "ok" | "bad" | "skip", kind, code?, message?, evidence?, reason? }
// "bad" is reported only when the claim is fully decidable in exact arithmetic.

import { dimsClash, evalSide, findRuns, formatDims, sameDims, tokenize } from "./numexpr.mjs";
import * as Q from "./rational.mjs";

// Sentences that quote a wrong or hypothetical computation, ask whether one is right, or only estimate.
const SPEAKER = String.raw`(?:\b[A-Z][a-z]+|\b(?:[Aa]|[Yy]our|[Mm]y|[Tt]he) (?:friend|student|classmate|child|kid|partner|teacher)|\b[Ss]tudents|\b[Cc]hildren|\b[Kk]ids|\bhe|\bshe|\bthey|\bsomeone)\s+(?:says?|said|thinks?|thought|claims?|claimed|wrote|writes|believes?|guess(?:es)?)\b`;
const QUOTED = new RegExp(
  `${SPEAKER}|\\b(?:true or false|false|wrong|incorrect|mistake|slip|myth|careless|error)\\b`,
);
const NEGATED = /\b(not|never|no|isn't|doesn't|don't|cannot|can't|won't|didn't)\b|n't\b/i;
const APPROX =
  /\b(about|approximately|around|estimate[sd]?|estimating|rounds?|rounded|rounding|nearly|almost|close to|roughly|compatible)\b|≈|~/i;
const QUESTION_LEAD =
  /^\s*(is|are|does|do|did|can|could|would|will|who|what|which|why|how)\b[^]*\?\s*$/i;

export const NUM = String.raw`\d+(?:,\d{3})*(?:\.\d+)?`;
const FRAC = String.raw`\d+\/\d+`;
const VALUE = String.raw`(?:${NUM}\s+out\s+of\s+(?:every\s+)?${NUM}|${NUM}\s?(?:%|percent\b)|${NUM}\s${FRAC}|${FRAC}|${NUM})`;

export function splitSentences(text) {
  return String(text)
    .split(/(?<=[.!?])\s+(?=[A-Z“"'(])|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** A stem that quotes someone's work or is negated ("Which ratio is NOT equivalent...") is not a plain claim. */
export const quotedOrNegated = (text) => QUOTED.test(text) || NEGATED.test(text);

/** Why a sentence is exempt from correctness claims, or null. */
export function exemptReason(sentence) {
  if (QUOTED.test(sentence)) return "quoted_or_hypothetical";
  if (NEGATED.test(sentence)) return "negated";
  if (APPROX.test(sentence)) return "approximate";
  if (QUESTION_LEAD.test(sentence)) return "question";
  return null;
}

const toQ = (text) => {
  const t = text.trim().replace(/,/g, "");
  let m = /^(\d+)\s+(\d+)\/(\d+)$/.exec(t);
  if (m) return Q.add(Q.make(BigInt(m[1])), Q.make(BigInt(m[2]), BigInt(m[3])));
  m = /^(\d+)\/(\d+)$/.exec(t);
  if (m) return Q.make(BigInt(m[1]), BigInt(m[2]));
  return Q.fromDecimal(t);
};

/** Exact value of a value phrase ("3 out of 8", "37.5 percent", "3/4", "0.75"), plus how many decimals it was written with. */
export function valueOf(phrase) {
  const p = phrase.trim();
  let m = new RegExp(`^(${NUM})\\s+out\\s+of\\s+(?:every\\s+)?(${NUM})$`).exec(p);
  if (m) {
    const b = toQ(m[2]);
    return Q.isZero(b) ? null : { q: Q.div(toQ(m[1]), b), places: 99 };
  }
  m = new RegExp(`^(${NUM})\\s?(?:%|percent)$`, "i").exec(p);
  if (m)
    return { q: Q.div(toQ(m[1]), Q.make(100n)), places: (m[1].split(".")[1] || "").length + 2 };
  const q = toQ(p);
  return q ? { q, places: (p.split(".")[1] || "").length || (/\//.test(p) ? 99 : 0) } : null;
}

// Within one unit of the last written decimal place: a rounded statement, not an error ("1 / 3 is 0.33").
function roundedOf(exact, shown, places) {
  if (places >= 99 || places === 0 || Q.terminates(exact)) return false;
  const bound = Q.make(1n, 10n ** BigInt(places));
  const diff = Q.sub(exact, shown);
  return Q.cmp(Q.cmp(diff, Q.make(0n)) < 0 ? Q.neg(diff) : diff, bound) < 0;
}

function checkRuns(sentence) {
  const out = [];
  const tokens = tokenize(sentence);
  for (const run of findRuns(tokens)) {
    const at = tokens.indexOf(run[0]);
    if (tokens.slice(Math.max(0, at - 4), at).some((t) => t.t === "blank")) {
      out.push({ status: "skip", kind: "equation", reason: "blank_subject" });
      continue;
    }
    const sides = [[]];
    const rels = [];
    for (const t of run) {
      if (t.t === "eq" || t.t === "cmp") {
        rels.push(t.v);
        sides.push([]);
      } else sides[sides.length - 1].push(t);
    }
    const text = sentence.slice(run[0].i0, run[run.length - 1].i1).trim();
    const skip = (reason) =>
      out.push({ status: "skip", kind: "equation", reason, evidence: { text } });
    if (sides.some((s) => !s.length)) {
      skip("incomplete relation");
      continue;
    }
    const vals = sides.map(evalSide);
    const bad = vals.find((v) => v.skip);
    if (bad) {
      skip(bad.skip);
      continue;
    }
    for (let k = 0; k < rels.length; k += 1) {
      const a = vals[k];
      const b = vals[k + 1];
      const rel = rels[k];
      const evidence = {
        text,
        left: Q.toString(a.q),
        right: Q.toString(b.q),
        leftUnits: formatDims(a.dims),
        rightUnits: formatDims(b.dims),
      };
      if (rel === "=" && dimsClash(a.dims, b.dims)) {
        out.push({
          status: "bad",
          kind: "equation",
          code: "ARITH_UNIT_MISMATCH",
          message: `units differ across "=": ${evidence.leftUnits} vs ${evidence.rightUnits}`,
          evidence,
        });
        continue;
      }
      if (
        rel === "=" &&
        Object.keys(a.dims).length &&
        Object.keys(b.dims).length &&
        !sameDims(a.dims, b.dims)
      ) {
        out.push({
          status: "skip",
          kind: "equation",
          reason: "unit_conversion_or_scale",
          evidence,
        });
        continue;
      }
      const c = Q.cmp(a.q, b.q);
      const holds = {
        "=": c === 0,
        "<": c < 0,
        ">": c > 0,
        "≤": c <= 0,
        "≥": c >= 0,
        "≠": c !== 0,
      }[rel];
      if (holds) {
        out.push({ status: "ok", kind: "equation" });
        continue;
      }
      const tail = sentence.slice(run[run.length - 1].i1);
      if (/^\s*(?:…|\.\.\.)/.test(tail)) {
        out.push({ status: "skip", kind: "equation", reason: "truncated_quote", evidence });
        continue;
      }
      // "85 / 9 is 9 with a remainder of 4" and "the quotient of 85 / 9 is 9": whole-number division, decided by the remainder template.
      const wholeQuotient =
        rel === "=" &&
        Q.isInt(b.q) &&
        Q.cmp(a.q, b.q) > 0 &&
        Q.cmp(a.q, Q.add(b.q, Q.make(1n))) < 0;
      if (
        wholeQuotient &&
        (/^\s*(?:,\s*)?(?:with|r\b|remainder)/i.test(tail) || /\bquotient\b/i.test(sentence))
      ) {
        out.push({ status: "skip", kind: "equation", reason: "whole_number_quotient", evidence });
        continue;
      }
      const shownText = sentence.slice(run[0].i0, run[run.length - 1].i1);
      const places =
        rel === "=" ? ((/\.(\d+)\s*$/.exec(shownText.trim()) || [])[1] || "").length : 0;
      if (rel === "=" && roundedOf(a.q, b.q, places)) {
        out.push({ status: "skip", kind: "equation", reason: "rounded", evidence });
        continue;
      }
      out.push({
        status: "bad",
        kind: "equation",
        code: rel === "=" ? "ARITH_VALUE_MISMATCH" : "ARITH_COMPARISON_FALSE",
        message: `"${text}" is false: ${evidence.left} ${rel} ${evidence.right} does not hold`,
        evidence,
      });
    }
  }
  return out;
}

const RELATION = String.raw`(?:is|are|means|equals|=|is the same as|is equal to|is equivalent to|are equivalent to|is an equivalent fraction (?:for|of|to)|is the same amount as)`;
const VALUE_PAIR = new RegExp(
  `(?<![\\d/.])(${VALUE})\\s+${RELATION}\\s+(${VALUE})(?![\\d/]|\\s?(?:%|percent\\b)|\\s*(?:of\\b|out of\\b|[×x*÷/+-]\\s*\\d))`,
  "gi",
);

// A value phrase starts a claim only at a clause start ("The fraction 2/4 is ..."), never as an operand ("2/3 multiplied by 2/2 equals ...").
const CLAUSE_LEAD =
  /(?:^|[,:;(“"]|\b(?:so|since|because|that|if|then|which|while|but|know|and then|(?:the )?(?:fraction|ratio|decimal|number|percent|percentage|value|amount|rate)))\s*$/i;
const claimPosition = (before) => CLAUSE_LEAD.test(before);

function checkValuePairs(sentence) {
  const out = [];
  for (const m of sentence.matchAll(VALUE_PAIR)) {
    // Plain-number pairs belong to the equation checker; "of"/"and" before the pair means it is an operand, not a claim.
    if (!/[%\/]|percent|out of/i.test(m[1] + m[2]) || !claimPosition(sentence.slice(0, m.index)))
      continue;
    const a = valueOf(m[1]);
    const b = valueOf(m[2]);
    if (!a || !b) continue;
    if (Q.eq(a.q, b.q)) {
      out.push({ status: "ok", kind: "value" });
      continue;
    }
    const evidence = { text: m[0], left: Q.toString(a.q), right: Q.toString(b.q) };
    if (roundedOf(a.q, b.q, b.places))
      out.push({ status: "skip", kind: "value", reason: "rounded", evidence });
    else
      out.push({
        status: "bad",
        kind: "value",
        code: /%|percent/i.test(m[0]) ? "ARITH_PERCENT_WRONG" : "ARITH_VALUE_MISMATCH",
        message: `"${m[0]}" is false: ${evidence.left} is not ${evidence.right}`,
        evidence,
      });
  }
  return out;
}

const RATIO = new RegExp(`(?<![\\d]|\\d\\.)(${NUM})\\s*(?:to|:)\\s*(${NUM})(?!\\d|\\.\\d)`, "g");
export const ratioEquivalent = (a, b, c, d) => Q.eq(Q.mul(a, d), Q.mul(b, c));

export function parseRatio(text) {
  const m = new RegExp(`^\\s*(${NUM})\\s*(?:to|:)\\s*(${NUM})\\s*$`).exec(text);
  return m ? [toQ(m[1]), toQ(m[2])] : null;
}

function checkRatios(sentence) {
  const out = [];
  const found = [...sentence.matchAll(RATIO)].map((m) => ({
    text: m[0],
    a: toQ(m[1]),
    b: toQ(m[2]),
    i: m.index,
  }));
  const fr = [...sentence.matchAll(new RegExp(`(?<![\\d/.])(\\d+)\\/(\\d+)(?![\\d/])`, "g"))].map(
    (m) => ({ text: m[0], a: toQ(m[1]), b: toQ(m[2]), i: m.index }),
  );
  const pairs = found.length === 2 ? found : fr.length === 2 && found.length === 0 ? fr : null;
  if (!pairs || pairs[0].b.n === 0n || pairs[1].b.n === 0n) return out;
  const [x, y] = pairs;
  if (/simplif|simplest form|lowest terms|reduced|reduce/i.test(sentence)) {
    const reversed = new RegExp(
      `${y.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+is\\s+(?:the|its)\\s+(?:simplest form|lowest terms)`,
      "i",
    ).test(sentence);
    const [orig, res] = reversed ? [y, x] : [x, y];
    const equivalent = ratioEquivalent(orig.a, orig.b, res.a, res.b);
    const reduced = Q.isInt(res.a) && Q.isInt(res.b) && Q.gcd(res.a.n, res.b.n) === 1n;
    const evidence = { original: orig.text, result: res.text };
    if (equivalent && reduced) out.push({ status: "ok", kind: "simplify" });
    else
      out.push({
        status: "bad",
        kind: "simplify",
        code: "ARITH_SIMPLIFY_WRONG",
        message: `"${res.text}" is not the simplest form of "${orig.text}" (${equivalent ? "equivalent but not fully reduced" : "not equivalent"})`,
        evidence,
      });
  } else if (/equivalent|same ratio/i.test(sentence) && found.length === 2) {
    const ok = ratioEquivalent(x.a, x.b, y.a, y.b);
    if (ok) out.push({ status: "ok", kind: "ratio" });
    else
      out.push({
        status: "bad",
        kind: "ratio",
        code: "ARITH_RATIO_EQUIV_FALSE",
        message: `"${x.text}" and "${y.text}" are called equivalent but are not`,
        evidence: { first: x.text, second: y.text },
      });
  }
  return out;
}

const RATE_PER = new RegExp(`(${NUM})\\s+([a-z]+?)s?\\s+per\\s+([a-z]+?)s?\\b`, "i");
const RATE_FROM = new RegExp(
  `(${NUM})\\s+([a-z]+?)s?\\s+(?:for|in)\\s+(${NUM})\\s+([a-z]+?)s?\\b`,
  "i",
);

function decideRate(from, per) {
  if (
    !per ||
    !from ||
    per[2].toLowerCase() !== from[2].toLowerCase() ||
    per[3].toLowerCase() !== from[4].toLowerCase()
  )
    return [];
  const count = toQ(from[3]);
  if (Q.isZero(count)) return [];
  const rate = Q.div(toQ(from[1]), count);
  if (Q.eq(rate, toQ(per[1]))) return [{ status: "ok", kind: "rate" }];
  return [
    {
      status: "bad",
      kind: "rate",
      code: "ARITH_RATE_WRONG",
      message: `${from[0]} is ${Q.toString(rate)} ${per[2]} per ${per[3]}, not ${per[1]}`,
      evidence: { from: from[0], per: per[0], exact: Q.toString(rate) },
    },
  ];
}

/** "240 miles in 4 hours" with "60 miles per hour" in the same sentence. */
export function checkRate(sentence) {
  const per = RATE_PER.exec(sentence);
  const from = RATE_FROM.exec(sentence);
  return from && per && from.index !== per.index ? decideRate(from, per) : [];
}

/** A match pair: left "12 dollars for 3 pounds", right "4 dollars per pound". */
export const checkRatePair = (left, right) =>
  decideRate(RATE_FROM.exec(left), RATE_PER.exec(right));

const OF_AND = new RegExp(
  `\\bthe (sum|difference|product|quotient) of (${NUM}(?:\\s${FRAC}|${"/\\d+"})?) and (${NUM}(?:\\s${FRAC}|${"/\\d+"})?) (?:is|equals) (${NUM}(?:\\s${FRAC}|${"/\\d+"})?)(?![\\d/]|\\s*(?:of|[×x*÷/+-]))`,
  "gi",
);
const RECIP = new RegExp(
  `\\bthe reciprocal of (${FRAC}|${NUM}) is (${FRAC}|${NUM})(?![\\d/])`,
  "gi",
);
const COMMON_DEN = new RegExp(
  `(${FRAC}) and (${FRAC}) have a (least )?common denominator of (${NUM})`,
  "gi",
);
const REMAINDER = new RegExp(
  `(?<![\\d.])(${NUM})\\s*[÷/]\\s*(${NUM}) is (${NUM}) with a remainder of (${NUM})`,
  "gi",
);
const EXPANDED = new RegExp(`\\bexpanded form of (${NUM}) is ((?:${NUM}\\s*\\+\\s*)+${NUM})`, "gi");

export function checkTemplates(sentence) {
  const out = [];
  const verdict = (ok, kind, text, evidence) =>
    out.push(
      ok
        ? { status: "ok", kind }
        : {
            status: "bad",
            kind,
            code: "ARITH_VALUE_MISMATCH",
            message: `"${text}" is false`,
            evidence,
          },
    );
  for (const m of sentence.matchAll(OF_AND)) {
    const a = toQ(m[2]);
    const b = toQ(m[3]);
    const z = toQ(m[4]);
    const op = m[1].toLowerCase();
    if (op === "quotient" && Q.isZero(b)) continue;
    const want = {
      sum: Q.add(a, b),
      difference: Q.sub(a, b),
      product: Q.mul(a, b),
      quotient: op === "quotient" ? Q.div(a, b) : null,
    }[op];
    const alt = op === "difference" ? Q.sub(b, a) : null;
    verdict(Q.eq(want, z) || (alt && Q.eq(alt, z)), "template", m[0], {
      expected: Q.toString(want),
      said: Q.toString(z),
    });
  }
  for (const m of sentence.matchAll(RECIP)) {
    const a = toQ(m[1]);
    const b = toQ(m[2]);
    if (!Q.isZero(a))
      verdict(Q.eq(Q.mul(a, b), Q.make(1n)), "template", m[0], {
        product: Q.toString(Q.mul(a, b)),
      });
  }
  for (const m of sentence.matchAll(COMMON_DEN)) {
    const d1 = BigInt(m[1].split("/")[1]);
    const d2 = BigInt(m[2].split("/")[1]);
    const e = BigInt(m[4]);
    const lcm = (d1 * d2) / Q.gcd(d1, d2);
    const ok = m[3] ? e === lcm : e % d1 === 0n && e % d2 === 0n;
    verdict(ok, "template", m[0], { lcm: String(lcm) });
  }
  for (const m of sentence.matchAll(REMAINDER)) {
    const [a, b, q, r] = [m[1], m[2], m[3], m[4]].map((x) => BigInt(x.replace(/,/g, "")));
    if (b !== 0n)
      verdict(q * b + r === a && r < b, "template", m[0], {
        dividend: String(a),
        divisor: String(b),
        quotient: String(a / b),
        remainder: String(a % b),
      });
  }
  for (const m of sentence.matchAll(EXPANDED)) {
    if (/^\s*(?:…|\.\.\.)/.test(sentence.slice(m.index + m[0].length))) continue;
    const parts = m[2].split("+").map((p) => toQ(p));
    verdict(Q.eq(parts.reduce(Q.add), toQ(m[1])), "template", m[0], { parts: m[2] });
  }
  return out;
}

/** All decidable claims in one sentence. Exempt sentences yield a single skip. */
export function checkSentence(sentence) {
  const reason = exemptReason(sentence);
  if (reason)
    return /[=<>≤≥]|\d+\s*(?:%|percent)|\d\s*(?:to|:)\s*\d|\bper\b|\d\/\d|[+×÷]/.test(sentence)
      ? [{ status: "skip", kind: "sentence", reason }]
      : [];
  return [
    ...checkRuns(sentence),
    ...checkValuePairs(sentence),
    ...checkRatios(sentence),
    ...checkRate(sentence),
    ...checkTemplates(sentence),
  ];
}

export const checkText = (text) => splitSentences(text).flatMap(checkSentence);
