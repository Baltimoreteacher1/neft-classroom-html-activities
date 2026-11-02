// Pure checks for the lesson-keyed family homework `v3` block (docs/specs/family-homework-v3.md).
// No file reads here: callers hand in the sidecar, the lesson config and the list of known lesson ids,
// so the same functions run on real data and on the self-test fixtures.
import { evaluateExpression, parseAnswerValue } from "../../scripts/lib/rational.mjs";

export const HOOK_STYLES = ["price-tag", "recipe", "scoreboard", "map", "ticket", "receipt"];
export const MODEL_KINDS = [
  "tape",
  "doubleline",
  "ratiotable",
  "area",
  "grid",
  "numberline",
  "coord",
  "barplot",
  "fraction",
  "balance",
  "none",
];

// Phrases that belong only on a ratio lesson (Unit 3). Seeing one elsewhere is wrong-lesson content.
export const RATIO_SIGNATURES = [
  /3 cups of berries/i,
  /Jordan says 3:5/i,
  /keep the taste\/color the same/i,
  /compost with 6 scoops/i,
  /tazas de bayas/i,
];
const BANNED = [
  [/\b(timer|countdown|count down|stopwatch|beat the clock)\b/i, "timer language"],
  [/\b(co-?pilot|enterprise|engine)\b/i, "internal module word"],
  [/\b(SPED|IEP)\b/, "SPED label"],
  [/\bearn(s|ed)? (a )?points?\b/i, "grading language"],
];
const USTED = /\b(Pregunte|Escuche|Pida|Anime|Evite|Elija|Diga|Dígale|Dele|Observe)\b/;
const OFF_TERMS = [/\bel entero\b/i, /\bdel todo\b/i];

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const str = (v) => (typeof v === "string" ? v.trim() : "");

/**
 * [unit, lesson] for ids such as "4-5" and "4-5-part2". Unit practice and review pages ("1-practice", "1-review")
 * come after every lesson in their unit, and a combined practice ("6-1-6-2-practice") right after its last lesson;
 * both are what a family meets after the lessons they review, so a spiral item may draw on those lessons.
 */
export function lessonOrder(id) {
  const s = String(id);
  const unitPage = /^(\d+)-(practice|review)/.exec(s);
  if (unitPage) return [Number(unitPage[1]), 99];
  const combined = /^(\d+)-\d+-(\d+)-(\d+)-practice/.exec(s);
  if (combined) return [Number(combined[2]), Number(combined[3]) + 0.5];
  const m = /^(\d+)-(\d+)/.exec(s);
  return m ? [Number(m[1]), Number(m[2])] : null;
}
export const isPartTwo = (id) => /-part[23]$/.test(String(id));
export const unitOf = (id) => lessonOrder(id)?.[0] ?? null;

/** True when `from` is a lesson strictly earlier than `id` (a -partN page may also use its own base lesson). */
export function isEarlier(from, id) {
  const a = lessonOrder(from);
  const b = lessonOrder(id);
  if (!a || !b) return false;
  if (a[0] !== b[0]) return a[0] < b[0];
  if (a[1] !== b[1]) return a[1] < b[1];
  return isPartTwo(id) && !isPartTwo(from);
}

/** Every {en, es} pair in the block, with a JSON-pointer-ish path, for language and text lint. */
export function* biPairs(node, path = "v3") {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* biPairs(node[i], `${path}[${i}]`);
  } else if (isObj(node)) {
    if (typeof node.en === "string" && typeof node.es === "string" && !("correct" in node)) {
      yield { path, en: node.en, es: node.es };
    }
    for (const [k, v] of Object.entries(node)) {
      if (k === "en" || k === "es") continue;
      yield* biPairs(v, `${path}.${k}`);
    }
  }
}

/** All strings of the block with their paths (English and Spanish), for the leak and lint sweeps. */
export function* allStrings(node, path = "v3") {
  if (typeof node === "string") yield { path, text: node };
  else if (Array.isArray(node))
    for (let i = 0; i < node.length; i++) yield* allStrings(node[i], `${path}[${i}]`);
  else if (isObj(node))
    for (const [k, v] of Object.entries(node)) yield* allStrings(v, `${path}.${k}`);
}

/** Does `expr` evaluate to `value`? Returns an error message or "". */
export function checkCalc(calc, label) {
  if (!isObj(calc)) return `${label}: calc missing`;
  const exact = evaluateExpression(String(calc.expr ?? ""));
  const want = parseAnswerValue(String(calc.value));
  if (!exact) return `${label}: calc.expr "${calc.expr}" is not arithmetic`;
  if (!want) return `${label}: calc.value "${calc.value}" is not a number`;
  return exact.eq(want) ? "" : `${label}: ${calc.expr} is not ${calc.value}`;
}

/** Does the answer text show `value`? ("$90", "90 dollars", "0.6" all show 90 / 0.6) */
function showsValue(text, value) {
  const want = parseAnswerValue(String(value));
  if (!want) return false;
  const direct = parseAnswerValue(String(text));
  if (direct?.eq(want)) return true;
  for (const m of String(text).matchAll(/-?\d[\d,]*(?:\.\d+)?/g)) {
    const got = parseAnswerValue(m[0].replace(/,/g, ""));
    if (got?.eq(want)) return true;
  }
  return false;
}

const biOk = (o) => isObj(o) && str(o.en) && str(o.es);
const words = (s) => str(s).split(/\s+/).filter(Boolean).length;

/**
 * Validate one lesson's v3 block. `ctx` = { id, config, knownIds:Set }.
 * Returns an array of problem strings (empty = clean).
 */
export function checkV3(v3, ctx) {
  const { id, config = {}, knownIds = new Set() } = ctx;
  const out = [];
  const add = (m) => out.push(`${id}: ${m}`);
  if (!isObj(v3))
    return [`${id}: no v3 block (every lesson needs one; there is no unit-level fallback)`];
  if (v3.version !== 1) add("v3.version must be 1");
  const unit = unitOf(id);
  // A lesson whose standard is a Mathematical Practice (MPP.n) teaches a habit of mind, not a model.
  const mindset = /^MPP/.test(String(config.standard || ""));
  const wantKind = mindset ? "mindset" : "math";
  if (v3.kind !== wantKind) add(`v3.kind must be "${wantKind}" for this lesson`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)+$/.test(str(v3.topicKey)))
    add("topicKey must be a kebab-case slug of 2+ words");
  if (isPartTwo(id) && !/-apply$/.test(str(v3.topicKey)))
    add('a -part page topicKey must end in "-apply"');

  if (!biOk(v3.standardPlain)) add("standardPlain needs en + es");
  const h = v3.hook;
  if (!isObj(h)) add("hook missing");
  else {
    if (!HOOK_STYLES.includes(h.style)) add(`hook.style must be one of ${HOOK_STYLES.join("|")}`);
    for (const k of ["guess", "reveal"]) if (!biOk(h[k])) add(`hook.${k} needs en + es`);
    if (!str(h.en) || !str(h.es)) add("hook en + es required");
    else {
      if (words(h.en) > 45) add(`hook.en is ${words(h.en)} words (max 45)`);
      if (!/\?\s*$/.test(h.en.trim())) add("hook.en must end in a question");
    }
  }
  if (!biOk(v3.classModel?.name)) add("classModel.name needs en + es");
  if (!biOk(v3.kitchenTable)) add("kitchenTable needs en + es");

  const m = v3.model;
  if (!isObj(m) || !MODEL_KINDS.includes(m.kind))
    add(`model.kind must be one of ${MODEL_KINDS.join("|")}`);
  else {
    if (mindset !== (m.kind === "none"))
      add(
        mindset
          ? 'mindset lessons use model.kind "none"'
          : 'model.kind "none" is for mindset lessons only',
      );
    if (m.kind !== "none") {
      if (!isObj(m.data) || Object.keys(m.data).length === 0) add("model.data required");
      if (!biOk(m.alt)) add("model.alt needs en + es");
      else if (!/\d/.test(m.alt.en)) add("model.alt must mention the model's numbers");
    }
  }

  // transfer
  if (mindset) {
    if (v3.transfer) add("mindset lessons have no transfer");
    if (Array.isArray(v3.spiral) && v3.spiral.length) add("mindset lessons have no spiral");
  } else {
    const t = v3.transfer;
    if (!isObj(t) || !biOk(t.stem) || !biOk(t.reasoning))
      add("transfer needs stem + reasoning (en + es)");
    else if (!Array.isArray(t.choices) || t.choices.length !== 3)
      add("transfer needs exactly 3 choices");
    else {
      const right = t.choices.filter((c) => c.correct);
      if (right.length !== 1)
        add(`transfer needs exactly one correct choice (has ${right.length})`);
      for (const c of t.choices) {
        if (!str(c.en) || !str(c.es)) add("transfer choice needs en + es");
        if (!c.correct && !str(c.misconception))
          add(`transfer wrong choice "${c.en}" needs a misconception id`);
      }
      const e = checkCalc(t.calc, "transfer");
      if (e) add(e);
      else if (right[0] && !showsValue(right[0].en, t.calc.value))
        add(`transfer correct choice "${right[0].en}" does not show ${t.calc.value}`);
      else if (t.choices.some((c) => !c.correct && showsValue(c.en, t.calc.value)))
        add("transfer: a wrong choice also shows the right value");
    }
    const sp = v3.spiral;
    if (!Array.isArray(sp) || sp.length !== 2) add("spiral needs exactly 2 items");
    else {
      sp.forEach((s, i) => {
        const p = `spiral[${i}]`;
        if (!knownIds.has(s.from)) add(`${p}.from "${s.from}" is not a lesson id`);
        else if (!isEarlier(s.from, id)) add(`${p}.from "${s.from}" is not earlier than ${id}`);
        if (!biOk(s.q) || !biOk(s.exp)) add(`${p} needs q + exp (en + es)`);
        if (!Array.isArray(s.options) || s.options.length !== 3)
          add(`${p}.options needs 3 strings`);
        else {
          const e = checkCalc(s.calc, p);
          if (e) add(e);
          else {
            const hits = s.options.filter((o) => showsValue(o, s.calc.value));
            if (hits.length !== 1 || s.options[s.correctIdx] !== hits[0])
              add(`${p}: exactly the option at correctIdx must show ${s.calc.value}`);
          }
        }
      });
      if (new Set(sp.map((s) => s.from)).size < 1) add("spiral lists no source lessons");
    }
  }

  // glitch
  if (isPartTwo(id)) {
    const g = v3.glitch;
    if (!isObj(g) || !biOk(g.scenario) || !biOk(g.fix) || !biOk(g.frame))
      add("a -part page needs glitch scenario + fix + frame");
    else {
      if (
        !Array.isArray(g.steps) ||
        g.steps.length !== 3 ||
        g.steps.filter((s) => s.isGlitch).length !== 1
      )
        add("glitch needs 3 steps with exactly one isGlitch");
      const e = mindset ? "" : checkCalc(g.calc, "glitch");
      if (e) add(e);
    }
  } else if (v3.glitch) add("glitch is for -part pages only (use null)");

  // vocab
  const terms = new Set((config.vocabulary || []).map((t) => t.term));
  if (!Array.isArray(v3.vocab) || v3.vocab.length < 3 || v3.vocab.length > 6)
    add("vocab needs 3-6 entries");
  else {
    const seen = new Set();
    for (const v of v3.vocab) {
      if (terms.size && !terms.has(v.term))
        add(`vocab term "${v.term}" is not in this lesson's vocabulary`);
      if (v.term === config.title) add("vocab may not use the lesson title as a term");
      if (seen.has(v.term)) add(`vocab term "${v.term}" repeated`);
      seen.add(v.term);
      for (const k of ["example", "nonExample", "frame"])
        if (!biOk(v[k])) add(`vocab "${v.term}" ${k} needs en + es`);
      if (/I can use .* to explain why/i.test(str(v.frame?.en)))
        add(`vocab "${v.term}" uses the generic frame`);
      if (!/___/.test(str(v.frame?.en)) || !/___/.test(str(v.frame?.es)))
        add(`vocab "${v.term}" frame needs a ___ blank in both languages`);
    }
  }

  // confused grown-up
  const cg = v3.confused;
  if (!Array.isArray(cg) || cg.length !== 3) add("confused needs exactly 3 rounds");
  else
    cg.forEach((r, i) => {
      const p = `confused[${i}]`;
      if (!biOk(r.wrong) || !biOk(r.coach) || !biOk(r.why))
        add(`${p} needs wrong + coach + why (en + es)`);
      if (!str(r.misconception)) add(`${p}.misconception id required`);
      if (!mindset) {
        const e = checkCalc(r.calc, p);
        if (e) add(e);
        else if (
          str(r.coach?.en) &&
          new RegExp(`(^|[^\\d.])${String(r.calc.value).replace(".", "\\.")}([^\\d]|$)`).test(
            r.coach.en,
          )
        )
          add(`${p}.coach states the answer`);
      }
      if (str(r.coach?.en) && !/\?\s*$/.test(r.coach.en.trim()))
        add(`${p}.coach must be a question`);
    });

  // language + text lint over every string
  for (const { path, en, es } of biPairs(v3)) {
    if (en.trim() === es.trim() && /\p{L}{3,}/u.test(en) && words(en) > 2)
      add(`${path}: Spanish is a copy of the English`);
  }
  for (const { path, text } of allStrings(v3)) {
    for (const [re, label] of BANNED) if (re.test(text)) add(`${path}: ${label}`);
    if (USTED.test(text)) add(`${path}: usted form (adults use ustedes, students use tú)`);
    for (const re of OFF_TERMS)
      if (re.test(text)) add(`${path}: off-glossary word for "the whole" (use "el total")`);
    if (/\d %/.test(text)) add(`${path}: percent with a space`);
    if (unit !== 3)
      for (const re of RATIO_SIGNATURES)
        if (re.test(text)) add(`${path}: ratio boilerplate on a non-ratio lesson`);
  }
  return out;
}

/** Strings of 60+ characters that appear on more than `limit` lessons (and not as UI chrome). */
export function sharedLongStrings(byLesson, limit = 3) {
  const seen = new Map();
  for (const [id, v3] of Object.entries(byLesson)) {
    for (const { text } of allStrings(v3)) {
      const t = text.replace(/\s+/g, " ").trim();
      if (t.length < 60) continue;
      if (!seen.has(t)) seen.set(t, new Set());
      seen.get(t).add(id);
    }
  }
  return [...seen]
    .filter(([, s]) => s.size > limit)
    .map(([t, s]) => ({ text: t, lessons: [...s] }));
}
