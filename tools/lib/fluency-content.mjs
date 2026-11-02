// Content schema, exact expression evaluator and bank validator for the Math Fluency Lab item bank (Phase 6).
// An item only counts when its complete prompt, answer key, worked solution, feedback and metadata pass, and when its
// answer is PROVEN by a machine-checkable `verify` block evaluated with exact rational arithmetic. Items that cannot be
// proven by computation (conceptual / explanation items) are allowed only as a bounded share and are reported separately
// as "needs human review". Nothing here claims expert or psychometric review.
import { readFileSync } from "node:fs";
import { parseRational, R, Rational } from "../../math/fluency-lab/e8/rational.js";

const root = new URL("../../", import.meta.url);
export const CCSS = JSON.parse(
  readFileSync(new URL("math/fluency-lab/content/ccss-k8.json", root), "utf8"),
);
const CODES = new Map(CCSS.standards.map((s) => [s.code, s]));

export const TYPES = [
  "mc",
  "multi",
  "numeric",
  "fraction",
  "equation",
  "expression",
  "match",
  "sort",
  "numberline",
  "graph",
  "model",
  "error",
  "constructed",
  "explain",
  "application",
];
export const COMPUTATIONAL_TYPES = new Set([
  "numeric",
  "fraction",
  "equation",
  "expression",
  "numberline",
  "graph",
  "model",
]);
export const REPRESENTATIONS = [
  "number",
  "picture",
  "array",
  "number-line",
  "base-ten",
  "fraction-model",
  "tape",
  "double-number-line",
  "ratio-table",
  "balance",
  "tiles",
  "graph",
  "coordinate-plane",
  "table",
  "equation",
  "area-model",
  "geometric-figure",
  "data-display",
  "words",
  "spatial",
];
export const MAX_CONCEPTUAL_SHARE = 0.3;
export const DUP_THRESHOLD = 0.82;

export { evaluate } from "../../math/fluency-lab/e8/exact-eval.js";

import { evaluate } from "../../math/fluency-lab/e8/exact-eval.js";

// ---------------------------------------------------------------- helpers
const isBi = (o) =>
  o && typeof o.en === "string" && o.en.trim() && typeof o.es === "string" && o.es.trim();
const words = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[0-9]+(?:[.,/][0-9]+)*/g, " ")
    .replace(/[^a-záéíóúñü\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
export function stemTokens(item) {
  return new Set(words(item.stem?.en || ""));
}
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const x of a) if (b.has(x)) n += 1;
  return n / (a.size + b.size - n);
};
const eqVal = (a, b) => {
  try {
    return Rational.of(a).eq(Rational.of(b));
  } catch {
    return false;
  }
};
const num = (v) => {
  const r = parseRational(String(v));
  return r;
};

// Validate one item. Returns { errors, warnings, computational }.
export function validateItem(item, { skills = null, misconceptionIds = null } = {}) {
  const errors = [];
  const warnings = [];
  const e = (m) => errors.push(m);
  if (!/^g[0-8]-[a-z0-9-]{3,40}-v\d+$/.test(item.id || ""))
    e("id must look like g3-mult-equal-groups-01-v1");
  if (!Number.isInteger(item.grade) || item.grade < 0 || item.grade > 8)
    e("grade must be 0..8 (0 is Kindergarten)");
  else if (item.id && !item.id.startsWith(`g${item.grade}-`)) e("id prefix must match the grade");
  const std = CODES.get(String(item.standard || "").replace(/\.[a-d]$/, ""));
  if (!std) e(`unknown CCSS standard ${item.standard}`);
  else if (std.grade !== item.grade)
    e(`standard ${item.standard} belongs to grade ${std.grade}, not ${item.grade}`);
  if (std && item.domain !== std.domain) e(`domain must be ${std.domain} for ${item.standard}`);
  if (std && item.cluster !== std.cluster) e(`cluster must be ${std.cluster} for ${item.standard}`);
  if (item.skill != null && skills && !skills.has(item.skill))
    e(`skill ${item.skill} is not in the knowledge graph`);
  if (!TYPES.includes(item.type)) e(`type must be one of ${TYPES.join(", ")}`);
  if (![1, 2, 3, 4].includes(item.dok)) e("dok must be 1-4");
  if (item.dok === 4 && item.investigation !== true)
    e("DOK 4 is reserved for genuine extended investigations (investigation: true)");
  if (![1, 2, 3].includes(item.difficulty)) e("difficulty must be 1-3");
  if (!REPRESENTATIONS.includes(item.representation))
    e(`representation must be one of ${REPRESENTATIONS.join(", ")}`);
  if (!item.objective || item.objective.length < 12) e("objective needed");
  if (!item.concept || item.concept.length < 3) e("concept needed");
  if (!Array.isArray(item.vocabulary)) e("vocabulary must be an array (may be empty)");
  if (!isBi(item.stem)) e("stem needs English and Spanish");
  else {
    if (item.stem.en.length < 12 || item.stem.en.length > 600) e("stem length out of range");
    if (
      item.stem.es === item.stem.en &&
      /[a-z]{4,}/i.test(item.stem.en.replace(/[A-Za-z]*\d[\w.]*/g, ""))
    )
      e("the Spanish stem must be a translation, not a copy");
  }
  if (
    !Array.isArray(item.hints) ||
    item.hints.length !== 3 ||
    item.hints.some((h) => !h?.en || h.en.length < 8)
  )
    e("exactly 3 hints (English) are required");
  if (
    !item.solution ||
    !Array.isArray(item.solution.steps) ||
    !item.solution.steps.length ||
    item.solution.steps.some((s) => !s || s.length < 4) ||
    !item.solution.es
  )
    e("solution needs steps[] and an es summary");
  if (
    !item.scoring ||
    !["exact", "partial", "rubric"].includes(item.scoring.method) ||
    !(item.scoring.points >= 1)
  )
    e("scoring {method, points} needed");
  if (item.provenance?.source !== "original") e("provenance.source must be 'original'");
  if (item.provenance?.reviewed !== false)
    e("provenance.reviewed must be false: no expert review has happened");
  if (!Array.isArray(item.misconceptions)) e("misconceptions must be an array (may be empty)");
  else if (misconceptionIds)
    for (const m of item.misconceptions)
      if (!misconceptionIds.has(m) && !/^[a-z][a-z0-9-]{3,48}$/.test(m))
        e(`bad misconception id ${m}`);
  const v = item.verify;
  if (!v || typeof v !== "object") {
    e("verify block is required");
    return { errors, warnings, computational: false };
  }
  const conceptual = v.kind === "conceptual";
  if (conceptual) {
    if (COMPUTATIONAL_TYPES.has(item.type))
      e(`${item.type} items must be computationally verified, not conceptual`);
    if (!v.note || v.note.length < 10)
      e("conceptual verify needs a note explaining why it needs human review");
  }
  // Type-specific structure and proof of the key.
  const checkExprs = (list, label) => {
    for (const c of list || []) {
      try {
        if (!eqVal(evaluate(c.expr, c.env || {}), evaluate(String(c.equals), c.env || {})))
          e(`${label}: ${c.expr} = ${evaluate(c.expr, c.env || {})}, not ${c.equals}`);
      } catch (err) {
        e(`${label}: ${err.message}`);
      }
    }
  };
  checkExprs(v.checks, "check");
  const t = item.type;
  const needAnswer = () => {
    if (!item.answer || typeof item.answer !== "object") e("answer object needed");
  };
  if (["mc", "multi"].includes(t)) {
    const ch = item.choices;
    if (!Array.isArray(ch) || ch.length < (t === "mc" ? 3 : 4) || ch.length > 6)
      e("choices: 3-5 for mc, 4-6 for multi");
    else {
      const ids = ch.map((c) => c.id);
      if (new Set(ids).size !== ids.length || ids.some((id) => !/^[A-F]$/.test(id)))
        e("choice ids must be unique letters A-F");
      if (
        ch.some(
          (c) => !isBi(c.text) && !(typeof c.text === "string" && /^[-\d.,/%$° ]+$/.test(c.text)),
        )
      )
        e("every choice needs {en,es} text (or a purely numeric text)");
      if (
        new Set(ch.map((c) => (typeof c.text === "string" ? c.text : c.text?.en))).size !==
        ch.length
      )
        e("duplicate choice text");
      needAnswer();
      const keys = t === "mc" ? [item.answer?.correct] : item.answer?.correct;
      if (
        !Array.isArray(keys) ||
        keys.length < (t === "mc" ? 1 : 2) ||
        keys.some((k) => !ids.includes(k))
      )
        e("answer.correct must name valid choice ids");
      else {
        if (t === "mc" && typeof item.answer.correct !== "string")
          e("mc answer.correct must be one id");
        for (const c of ch)
          if (!keys.includes(c.id) && (!c.why || c.why.length < 8))
            e(`wrong choice ${c.id} needs a why (targeted feedback)`);
        if (!conceptual) {
          if (!v.key && !ch.every((c) => c.value !== undefined))
            e("computational mc needs verify.key (expression) and a value on every choice");
          else if (v.key) {
            try {
              const K = evaluate(v.key, v.env || {});
              const matching = ch
                .filter((c) => c.value !== undefined && eqVal(c.value, K))
                .map((c) => c.id);
              if (t === "mc" && (matching.length !== 1 || matching[0] !== item.answer.correct))
                e(
                  `verify.key = ${K}, matching choices [${matching}], keyed ${item.answer.correct}`,
                );
              if (t === "multi") {
                const want = [...keys].sort().join();
                const got = ch
                  .filter((c) => c.value !== undefined && eqVal(c.value, K))
                  .map((c) => c.id)
                  .sort()
                  .join();
                if (want !== got)
                  e(`multi: choices equal to ${K} are [${got}] but keyed [${want}]`);
              }
            } catch (err) {
              e(`verify.key: ${err.message}`);
            }
          }
        }
      }
    }
  } else if (["numeric", "fraction"].includes(t)) {
    needAnswer();
    if (item.answer?.value === undefined || num(item.answer.value) === null)
      e("answer.value must be a number or fraction");
    if (t === "fraction" && !["simplified", "any"].includes(item.answer?.form))
      e("fraction items need answer.form 'simplified' or 'any'");
    if (!conceptual) {
      if (!v.expr) e("verify.expr is required");
      else
        try {
          if (!eqVal(evaluate(v.expr, v.env || {}), item.answer.value))
            e(`verify.expr = ${evaluate(v.expr, v.env || {})}, answer says ${item.answer.value}`);
        } catch (err) {
          e(`verify.expr: ${err.message}`);
        }
    }
  } else if (t === "equation") {
    needAnswer();
    const q = v.solve;
    if (!q?.equation || !q.var || q.value === undefined)
      e("equation items need verify.solve {equation, var, value}");
    else
      try {
        const [l, r] = q.equation.split("=");
        if (!eqVal(evaluate(l, { [q.var]: q.value }), evaluate(r, { [q.var]: q.value })))
          e("the keyed value does not satisfy the equation");
        // A linear equation has exactly one solution: test a different value fails.
        const other = Rational.of(q.value).add(1);
        if (eqVal(evaluate(l, { [q.var]: other }), evaluate(r, { [q.var]: other })) && !q.identity)
          e("the equation is also satisfied by another value; mark identity or fix it");
        if (!String(item.answer?.value).includes(String(q.value)))
          e("answer.value must state the solution value");
      } catch (err) {
        e(`verify.solve: ${err.message}`);
      }
  } else if (t === "expression") {
    needAnswer();
    const q = v.identity;
    if (!q?.a || !q.b || !q.vars) e("expression items need verify.identity {a, b, vars}");
    else
      try {
        const samples = Object.entries(q.vars);
        for (let k = 0; k < (samples[0]?.[1]?.length || 0); k += 1) {
          const env = Object.fromEntries(samples.map(([n, list]) => [n, list[k]]));
          if (!eqVal(evaluate(q.a, env), evaluate(q.b, env)))
            e(`the two expressions differ at ${JSON.stringify(env)}`);
        }
        if ((samples[0]?.[1]?.length || 0) < 4) e("identity needs at least 4 sample values");
      } catch (err) {
        e(`verify.identity: ${err.message}`);
      }
  } else if (t === "numberline") {
    needAnswer();
    const L = item.line;
    if (!L || num(L.min) === null || num(L.max) === null || num(L.step) === null)
      e("numberline needs line {min,max,step}");
    else
      try {
        const p = Rational.of(item.answer.point);
        if (p.lt(Rational.of(L.min)) || p.gt(Rational.of(L.max)))
          e("answer point is outside the number line");
        if (!p.sub(Rational.of(L.min)).div(Rational.of(L.step)).isInteger())
          e("answer point must sit on a tick");
        if (v.expr && !eqVal(evaluate(v.expr, v.env || {}), p))
          e("verify.expr does not equal the point");
        if (!v.expr) e("verify.expr is required");
      } catch (err) {
        e(`numberline: ${err.message}`);
      }
  } else if (t === "graph") {
    needAnswer();
    if (!Array.isArray(item.answer?.points) || !item.answer.points.length || item.grid == null)
      e("graph needs answer.points and grid {xmin,xmax,ymin,ymax}");
    else if (
      item.answer.points.some(
        ([x, y]) =>
          x < item.grid.xmin || x > item.grid.xmax || y < item.grid.ymin || y > item.grid.ymax,
      )
    )
      e("a keyed point is off the grid");
    if (!v.checks?.length) e("graph items need verify.checks proving the points");
  } else if (t === "model") {
    if (!item.visual?.model || !item.visual.params) e("model items need visual {model, params}");
    else if (!Array.isArray(v.solution) || !v.goalFacts)
      e("model items need verify.solution (actions) and verify.goalFacts");
    else v.__model = true;
  } else if (["match", "sort"].includes(t)) {
    const list = t === "match" ? item.pairs : item.bins;
    if (t === "match" && (!Array.isArray(list) || list.length < 3))
      e("match needs at least 3 pairs");
    if (
      t === "sort" &&
      (!Array.isArray(list) ||
        list.length < 2 ||
        list.reduce((n, b) => n + (b.items?.length || 0), 0) < 4 ||
        list.some((b) => !isBi(b.name)))
    )
      e("sort needs at least 2 named bins holding at least 4 items in all");
    if (
      t === "match" &&
      Array.isArray(list) &&
      list.some((p) => !isBi(p.left) && typeof p.left !== "string")
    )
      e("match pairs need left/right");
    if (!conceptual && !v.checks?.length)
      e(`${t} items must prove their key with verify.checks (or be marked conceptual)`);
  } else if (t === "error") {
    if (
      !Array.isArray(item.steps) ||
      item.steps.length < 2 ||
      !Number.isInteger(item.answer?.errorStep) ||
      item.answer.errorStep < 1 ||
      item.answer.errorStep > item.steps.length
    )
      e("error items need steps[] and answer.errorStep (1-based)");
    if (!conceptual && !v.checks?.length)
      e("error items must prove the wrong step with verify.checks");
  } else if (["constructed", "explain", "application"].includes(t)) {
    if (!item.rubric?.criteria?.length || !isBi(item.rubric.sample))
      e(`${t} items need rubric {criteria[], sample{en,es}}`);
    if (t === "application" && !conceptual) {
      if (item.answer?.value === undefined || num(item.answer.value) === null || !v.expr)
        e("application items need a numeric answer.value proven by verify.expr");
      else
        try {
          if (!eqVal(evaluate(v.expr, v.env || {}), item.answer.value))
            e(`verify.expr = ${evaluate(v.expr, v.env || {})}, answer says ${item.answer.value}`);
        } catch (err) {
          e(`verify.expr: ${err.message}`);
        }
    }
    if (t === "explain" && !conceptual && !v.checks?.length)
      e(
        "explain items must either prove the numbers in the sample with verify.checks or be conceptual",
      );
  }
  // Hints never state the keyed answer in the first two rungs.
  const ans = item.answer?.value ?? item.answer?.point;
  if (ans !== undefined && /^-?\d{2,}(\.\d+)?$/.test(String(ans)) && item.hints)
    for (const h of item.hints.slice(0, 2))
      if (new RegExp(`(?<![\\d.])${String(ans).replace(".", "\\.")}(?![\\d.])`).test(h.en))
        e(`a hint gives away the answer ${ans}`);
  if (item.provenance?.source !== "original") e("provenance");
  return { errors, warnings, computational: !conceptual && errors.length === 0 };
}

// Models are verified separately because they need the MathVisualEngine (node-only).
export async function verifyModelItem(item) {
  const errors = [];
  try {
    const { MathVisualEngine } = await import("../../math/fluency-lab/e8/models.js");
    const e = new MathVisualEngine(item.visual.model, item.visual.params);
    if (e.verify().length) errors.push("the starting model fails its own verification");
    for (const a of item.verify.solution) {
      const r = e.dispatch(a);
      if (!r.ok) errors.push(`solution move ${JSON.stringify(a)} refused: ${r.reason?.en}`);
    }
    if (e.verify().length) errors.push("the solved model fails verification");
    const facts = e.derive().facts;
    for (const [k, want] of Object.entries(item.verify.goalFacts)) {
      const got = facts[k];
      const same =
        got instanceof Rational
          ? got.eq(Rational.of(want))
          : String(got) === String(want) || (typeof got === "number" && got === Number(want));
      if (!same) errors.push(`goal fact ${k} is ${got}, expected ${want}`);
    }
  } catch (err) {
    errors.push(`model check failed: ${err.message}`);
  }
  return errors;
}

// ---------------------------------------------------------------- bank-level validation and report
export async function validateBank(items, options = {}) {
  const seen = new Set();
  const counted = [];
  const rejected = [];
  const dupes = [];
  const tokens = [];
  for (const item of items) {
    const { errors, computational } = validateItem(item, options);
    if (item.type === "model" && !errors.length) errors.push(...(await verifyModelItem(item)));
    if (seen.has(item.id)) errors.push(`duplicate id ${item.id}`);
    seen.add(item.id);
    if (!errors.length) {
      const tk = stemTokens(item);
      const near = tokens.find(
        (t) => t.grade === item.grade && jaccard(t.tk, tk) >= DUP_THRESHOLD && t.type === item.type,
      );
      if (near) {
        dupes.push({ id: item.id, of: near.id });
        errors.push(`near-duplicate of ${near.id} (same wording and structure; counted once)`);
      } else tokens.push({ id: item.id, tk, grade: item.grade, type: item.type });
    }
    if (errors.length) rejected.push({ id: item.id, errors });
    else counted.push({ ...item, computational });
  }
  // Conceptual share is bounded per grade.
  const byGrade = {};
  for (const c of counted) (byGrade[c.grade] ||= []).push(c);
  const overConceptual = [];
  for (const [g, list] of Object.entries(byGrade)) {
    const concept = list.filter((c) => !c.computational).length;
    if (concept / list.length > MAX_CONCEPTUAL_SHARE)
      overConceptual.push({ grade: Number(g), share: concept / list.length });
  }
  return { counted, rejected, dupes, overConceptual };
}

export const standardsForGrade = (grade) => CCSS.standards.filter((s) => s.grade === grade);
export const standardInfo = (code) => CODES.get(String(code).replace(/\.[a-d]$/, "")) || null;
