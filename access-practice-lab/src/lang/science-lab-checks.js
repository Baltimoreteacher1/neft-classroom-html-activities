// Science Investigation Lab checks: deterministic rules over the learner's own words. Pure, no DOM, no storage.
// Every note is { id, quote, ask }: `quote` is a character-accurate span of the learner's text, `ask` is a
// question (English or Spanish) naming the part to work on. No check returns a score, level or percentage.
import { ask } from "./science-lab-asks.js";
import {
  AUX,
  BECAUSE,
  COMPARATIVE,
  COMPARE,
  COUNT_WORDS,
  DIRECTION,
  IF_THEN,
  LINKING,
  MEASURE_CUES,
  NEGATION,
  NUMBER_WORDS,
  OPINION,
  WH,
} from "./science-lab-terms.js";
import { contentStems, diffWords, numbersIn, sentences } from "./text.js";

const MAX_TEXT = 8000;
const MAX_QUOTE = 240;

export const isPlain = (x) => Boolean(x) && typeof x === "object" && !Array.isArray(x);

/** Length-preserving fold (accents off, ASCII lower) so match offsets stay valid in the learner's own text. */
const fold = (s) =>
  s.replace(/[À-ſ]/g, (c) => c.normalize("NFD")[0]).replace(/[A-Z]/g, (c) => c.toLowerCase());
export const clean = (t) => (typeof t === "string" ? t.slice(0, MAX_TEXT) : "");
export const blank = (t) => !t.trim();
const both = (m) => [...(Array.isArray(m?.en) ? m.en : []), ...(Array.isArray(m?.es) ? m.es : [])];
const reCache = new Map();

function findTerm(folded, term) {
  let re = reCache.get(term);
  if (!re) {
    const body = fold(String(term))
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\s+/g, "\\s+");
    re = new RegExp(`(?<![a-z0-9])${body}(?![a-z0-9])`);
    reCache.set(term, re);
  }
  const m = re.exec(folded);
  return m ? { start: m.index, end: m.index + m[0].length } : null;
}

/** Earliest hit of any term: { start, end, term } or null. */
function findAny(folded, terms) {
  let best = null;
  for (const term of terms) {
    const hit = term ? findTerm(folded, term) : null;
    if (hit && (!best || hit.start < best.start)) best = { ...hit, term };
  }
  return best;
}

/** A character-accurate span of the learner's text for a note: the sentence holding `span`, else the first sentence. */
function quoteAt(T, span) {
  if (blank(T)) return "";
  const list = sentences(T);
  if (span) {
    const hit = list.find((s) => span.start >= s.start && span.start < s.end);
    if (hit) return hit.text.slice(0, MAX_QUOTE);
    return T.slice(span.start, span.end).slice(0, MAX_QUOTE);
  }
  return (list[0]?.text ?? T.trim()).slice(0, MAX_QUOTE);
}

const LANG = (lang) => (lang === "es" ? "es" : "en");
const done = (notes) => ({ ok: notes.length === 0, notes });
const note = (id, prefix, quote, lang, vars) => ({
  id,
  quote,
  ask: ask(`${prefix}-${id}`, LANG(lang), vars),
});

const plainList = (list) => (Array.isArray(list) ? list.filter(isPlain) : []);
const variablesOf = (c) => plainList(c?.variables);
const valuesOf = (v) => plainList(v?.values);
const rowsOf = (c) => plainList(c?.dataset?.rows);
const labelOf = (x, lang) => String(x?.label?.[LANG(lang)] ?? x?.label?.en ?? x?.id ?? "");
const shortOf = (x, lang) => String(x?.short?.[LANG(lang)] ?? labelOf(x, lang)).toLowerCase();
const measureTerms = (c) => both(c?.measure?.match);

/** Case variables the text names, by the variable's own words or by one of its values. */
function variableHits(F, c) {
  return variablesOf(c)
    .map((v) => ({
      v,
      hit: findAny(F, [...both(v.match), ...valuesOf(v).flatMap((x) => both(x.match))]),
    }))
    .filter((x) => x.hit);
}

/** Variable values the text names: [{ v, val, hit }]. */
function valueHits(F, c) {
  const out = [];
  for (const v of variablesOf(c))
    for (const val of valuesOf(v)) {
      const hit = findAny(F, both(val.match));
      if (hit) out.push({ v, val, hit });
    }
  return out;
}

const leading = (F) => F.replace(/^[\s¿"'“‘(]+/, "");
const startsWithAny = (F, terms) => {
  const L = leading(F);
  const hit = findAny(L, terms);
  return Boolean(hit) && hit.start === 0;
};

// ── the checks ───────────────────────────────────────────────────────────────

/** A testable question names something to change and something to measure, and is not yes/no or opinion. */
export function checkQuestion(text, caseDef, lang = "en") {
  const T = clean(text);
  if (blank(T)) return done([note("empty", "q", "", lang)]);
  const F = fold(T);
  const notes = [];
  const wh = Boolean(findAny(F, WH));
  const isQuestion = /[?？]/.test(T) || startsWithAny(F, WH) || startsWithAny(F, AUX);
  const opinion = findAny(F, OPINION);
  const comparative = findAny(F, COMPARATIVE);
  const outcome = comparative || findAny(F, measureTerms(caseDef));
  if (!isQuestion) notes.push(note("not-question", "q", quoteAt(T), lang));
  if (opinion) notes.push(note("opinion", "q", quoteAt(T, opinion), lang));
  if (isQuestion && !opinion && startsWithAny(F, AUX) && !wh && !comparative)
    notes.push(note("yes-no", "q", quoteAt(T), lang));
  if (!variableHits(F, caseDef).length) notes.push(note("no-variable", "q", quoteAt(T), lang));
  if (!outcome) notes.push(note("no-measure", "q", quoteAt(T), lang));
  return done(notes);
}

/** A prediction has an if/then or because structure, names a case variable, and says which way the result moves. */
export function checkHypothesis(text, caseDef, lang = "en") {
  const T = clean(text);
  if (blank(T)) return done([note("empty", "h", "", lang)]);
  const F = fold(T);
  const notes = [];
  if (!IF_THEN.test(F) && !BECAUSE.test(F)) notes.push(note("no-structure", "h", quoteAt(T), lang));
  const vars = variableHits(F, caseDef);
  if (!vars.length) notes.push(note("no-variable", "h", quoteAt(T), lang));
  if (!findAny(F, DIRECTION))
    notes.push(
      note("no-direction", "h", quoteAt(T, vars[0]?.hit), lang, {
        measure: shortOf(caseDef?.measure, lang),
      }),
    );
  return done(notes);
}

const ids = (list) => [
  ...new Set((Array.isArray(list) ? list : []).filter((x) => typeof x === "string")),
];
const trialCount = (v) => {
  const s = fold(String(v ?? "")).trim();
  const digits = s.match(/\d+/);
  if (digits) return Number(digits[0]);
  return NUMBER_WORDS[s.split(/\s+/)[0]] ?? 0;
};

/**
 * plan = { changed: [variableId], held: [variableId], measure: "text", trials: number | "text", steps?: "text" }.
 * A fair plan changes exactly one variable, holds the others, names a measure, and repeats the test.
 */
export function checkPlan(plan, caseDef, lang = "en") {
  const p = isPlain(plan) ? plan : {};
  const measure = clean(p.measure);
  const steps = clean(p.steps);
  const trials =
    typeof p.trials === "number" || typeof p.trials === "string" ? String(p.trials).trim() : "";
  const known = new Set(variablesOf(caseDef).map((v) => v.id));
  const changed = ids(p.changed).filter((id) => known.has(id));
  const held = ids(p.held).filter((id) => known.has(id));
  if (!changed.length && !held.length && blank(measure) && blank(steps) && !trials)
    return done([note("empty", "p", "", lang)]);
  const anchor = !blank(steps) ? quoteAt(steps) : !blank(measure) ? quoteAt(measure) : "";
  const notes = [];
  if (!changed.length) notes.push(note("change-none", "p", anchor, lang));
  if (changed.length > 1) notes.push(note("change-many", "p", anchor, lang, { n: changed.length }));
  for (const v of variablesOf(caseDef)
    .filter((x) => changed.length && !changed.includes(x.id) && !held.includes(x.id))
    .slice(0, 2))
    notes.push(note("hold-missing", "p", anchor, lang, { variable: labelOf(v, lang) }));
  for (const v of variablesOf(caseDef)
    .filter((x) => changed.includes(x.id) && held.includes(x.id))
    .slice(0, 2))
    notes.push(note("hold-changed", "p", anchor, lang, { variable: labelOf(v, lang) }));
  if (blank(measure)) notes.push(note("measure-missing", "p", anchor, lang));
  else if (
    !/\d/.test(measure) &&
    !findAny(fold(measure), [...MEASURE_CUES, ...measureTerms(caseDef)])
  )
    notes.push(note("measure-vague", "p", quoteAt(measure), lang));
  if (trialCount(trials) < 2) notes.push(note("trials-few", "p", trials || anchor, lang));
  return done(notes);
}

/** A claim answers the investigation question: it names the conditions compared and the result it is about. */
export function checkClaim(text, caseDef, lang = "en") {
  const T = clean(text);
  if (blank(T)) return done([note("empty", "c", "", lang)]);
  const F = fold(T);
  const named = valueHits(F, caseDef);
  const focus = named.filter((n) => n.v.id === caseDef?.focus);
  const focusLabel = shortOf(
    variablesOf(caseDef).find((v) => v.id === caseDef?.focus),
    lang,
  );
  const notes = [];
  if (!named.length) notes.push(note("no-condition", "c", quoteAt(T), lang));
  else if (caseDef?.focus && !focus.length)
    notes.push(
      note("off-question", "c", quoteAt(T, named[0].hit), lang, {
        focus: focusLabel,
      }),
    );
  if (named.length && named.length < 2 && !findAny(F, COMPARE))
    notes.push(note("no-compare", "c", quoteAt(T, named[0].hit), lang));
  if (!findAny(F, [...measureTerms(caseDef), ...COMPARATIVE]))
    notes.push(note("no-outcome", "c", quoteAt(T), lang));
  const miss =
    named.length === 1 && focus.length === 1 && claimContradictsData(F, focus[0], caseDef);
  if (miss)
    notes.push(
      note("data-check", "c", quoteAt(T, focus[0].hit), lang, {
        measure: shortOf(caseDef.measure, lang),
        focus: focusLabel,
      }),
    );
  return done(notes);
}

/** True only when the claim says its one named condition is best and the data's mean says another is better. */
function claimContradictsData(F, chosen, caseDef) {
  if (
    !findAny(F, both(caseDef.bestWords)) ||
    findAny(F, both(caseDef.worstWords)) ||
    NEGATION.test(F)
  )
    return false;
  const mid = caseDef.measure?.id;
  const means = new Map();
  for (const row of rowsOf(caseDef)) {
    const x = row?.measures?.[mid];
    const key = row?.conditions?.[caseDef.focus];
    if (!Number.isFinite(x) || key === undefined) continue;
    const cur = means.get(key) || { sum: 0, n: 0 };
    means.set(key, { sum: cur.sum + x, n: cur.n + 1 });
  }
  if (means.size < 2 || !means.has(chosen.val.id)) return false;
  const avg = (k) => means.get(k).sum / means.get(k).n;
  const all = [...means.keys()].map(avg);
  const best = caseDef.better === "lower" ? Math.min(...all) : Math.max(...all);
  return Math.abs(avg(chosen.val.id) - best) > 1e-9;
}

const norm = (n) => String(Math.round(n * 100) / 100);

/** Every number the case's own data supports: measures, condition numbers, setup numbers, differences and group means. */
function allowedNumbers(caseDef) {
  const out = new Set();
  const mid = caseDef?.measure?.id;
  const rows = rowsOf(caseDef);
  const xs = rows.map((r) => r?.measures?.[mid]).filter(Number.isFinite);
  for (const x of xs) out.add(norm(x));
  for (const a of xs) for (const b of xs) out.add(norm(Math.abs(a - b)));
  const groups = new Map();
  for (const r of rows) {
    const x = r?.measures?.[mid];
    if (!Number.isFinite(x)) continue;
    const key = JSON.stringify(r.conditions);
    groups.set(key, [...(groups.get(key) || []), x]);
    for (const c of Object.values(r.conditions || {}))
      if (/^\d+(?:\.\d+)?$/.test(String(c))) out.add(norm(Number(c)));
  }
  for (const g of groups.values()) out.add(norm(g.reduce((a, b) => a + b, 0) / g.length));
  const prose = [
    caseDef?.dataset?.setup,
    caseDef?.dataset?.note,
    ...variablesOf(caseDef).flatMap((v) => valuesOf(v).map((x) => x.label)),
  ];
  for (const s of prose)
    for (const n of numbersIn(`${s?.en ?? ""} ${s?.es ?? ""}`))
      out.add(norm(Number(n.value.replace("%", ""))));
  return out;
}

/** Numbers in a text that the case's data does not support, as spans of that text. */
function strayNumbers(T, caseDef) {
  const allowed = allowedNumbers(caseDef);
  const words = fold(T);
  return numbersIn(T).filter((n) => {
    if (allowed.has(norm(Number(n.value.replace("%", ""))))) return false;
    if (/[a-z]$/.test(words.slice(Math.max(0, n.start - 1), n.start))) return false;
    const after = words.slice(n.end).match(/^\s*([a-z]+)/)?.[1];
    const before = words.slice(0, n.start).match(/([a-z]+)\s*$/)?.[1];
    return !(COUNT_WORDS.has(after) || before === "row" || before === "fila");
  });
}

/** claim-evidence-reasoning: { claim, evidenceIds: [rowId], text } — a claim, chosen rows, and a linking sentence. */
export function checkReasoning(input, caseDef, lang = "en") {
  const inp = isPlain(input) ? input : {};
  const claim = clean(inp.claim);
  const T = clean(inp.text);
  const rowIds = new Set(rowsOf(caseDef).map((r) => r.id));
  const chosen = ids(inp.evidenceIds).filter((id) => rowIds.has(id));
  const notes = [];
  if (blank(claim)) notes.push(note("no-claim", "r", quoteAt(T), lang));
  if (!chosen.length) notes.push(note("no-evidence", "r", quoteAt(T), lang));
  if (!blank(claim) && chosen.length) notes.push(...evidenceNotes(claim, chosen, caseDef, lang));
  if (blank(T)) notes.push(note("empty", "r", "", lang));
  else notes.push(...linkNotes(T, claim, caseDef, lang, chosen.length > 0));
  for (const source of [T, claim])
    for (const n of strayNumbers(source, caseDef).slice(0, 2))
      notes.push(note("number-not-in-data", "r", n.text, lang, { number: n.text }));
  return done(notes);
}

/** Does the claim's named condition appear in the chosen rows, and are both sides of a comparison covered? */
function evidenceNotes(claim, chosen, caseDef, lang) {
  const named = valueHits(fold(claim), caseDef);
  if (!named.length) return [];
  const rows = rowsOf(caseDef).filter((r) => chosen.includes(r.id));
  const covered = (n) => rows.some((r) => r?.conditions?.[n.v.id] === n.val.id);
  const label = (n) => labelOf(n.val, lang);
  if (!named.some(covered))
    return [
      note("evidence-unrelated", "r", quoteAt(claim, named[0].hit), lang, { a: label(named[0]) }),
    ];
  const same = named.filter((n) => n.v.id === named[0].v.id);
  if (same.length >= 2 && same.some((n) => !covered(n)))
    return [
      note("evidence-one-side", "r", quoteAt(claim, same[0].hit), lang, {
        a: label(same[0]),
        b: label(same[1]),
      }),
    ];
  return [];
}

/** Is there a linking word, is it tied to this claim and this data, and is a number quoted from the rows? */
function linkNotes(T, claim, caseDef, lang, hasEvidence) {
  const F = fold(T);
  const link = findAny(F, LINKING);
  if (!link) return [note("no-link", "r", quoteAt(T), lang)];
  const shared = new Set(contentStems(claim));
  const tied =
    valueHits(F, caseDef).length ||
    findAny(F, measureTerms(caseDef)) ||
    contentStems(T).filter((s) => shared.has(s)).length >= 2;
  const notes = [];
  if (!tied) notes.push(note("link-not-tied", "r", quoteAt(T, link), lang));
  if (hasEvidence && !/\d/.test(T)) notes.push(note("no-number", "r", quoteAt(T), lang));
  return notes;
}

const REVISION_STAGES = ["question", "hypothesis", "claim", "reasoning"];

function asWork(x, stage) {
  if (typeof x === "string") return { stage, text: x };
  return isPlain(x)
    ? { ...x, stage: REVISION_STAGES.includes(x.stage) ? x.stage : stage }
    : { stage, text: "" };
}

function runCheck(work, caseDef, lang) {
  if (work.stage === "question") return checkQuestion(work.text, caseDef, lang);
  if (work.stage === "hypothesis") return checkHypothesis(work.text, caseDef, lang);
  if (work.stage === "reasoning") return checkReasoning(work, caseDef, lang);
  return checkClaim(work.text, caseDef, lang);
}

/**
 * before / after: strings (a claim) or { stage: "question"|"hypothesis"|"claim"|"reasoning", text, claim?, evidenceIds? }.
 * Re-runs the stage's check on both real texts and reports what changed, which issues were fixed, which remain,
 * and which are new. `notes` are the questions that still apply to the revised text.
 */
export function checkRevision(before, after, caseDef, lang = "en") {
  const a = asWork(after, "claim");
  const b = asWork(before, a.stage);
  b.stage = a.stage;
  const was = runCheck(b, caseDef, lang);
  const now = runCheck(a, caseDef, lang);
  const wasIds = was.notes.map((n) => n.id);
  const nowIds = now.notes.map((n) => n.id);
  const sig = (w) =>
    JSON.stringify([clean(w.text).trim(), clean(w.claim).trim(), ids(w.evidenceIds).sort()]);
  const changedWork = sig(a) !== sig(b);
  const notes = [...now.notes];
  if (!changedWork)
    notes.unshift(note("no-change", "v", quoteAt(clean(a.text) || clean(a.claim)), lang));
  const fixed = wasIds.filter((id) => !nowIds.includes(id));
  const remaining = wasIds.filter((id) => nowIds.includes(id));
  return {
    ok: changedWork && now.ok,
    notes,
    changed: changedWork
      ? diffWords(clean(b.text), clean(a.text)).filter((s) => s.op !== "same")
      : [],
    fixed,
    remaining,
    broke: nowIds.filter((id) => !wasIds.includes(id)),
    addressed: remaining.length === 0,
  };
}
