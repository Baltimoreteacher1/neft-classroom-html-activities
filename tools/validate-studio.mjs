#!/usr/bin/env node
/**
 * validate-studio.mjs — editorial + schema gate for the BCPSS Teacher Studio content.
 * Reads every data module under bcpss-teachers/studio/data and fails on incomplete, inconsistent or
 * unsafe content: unknown ids, unregistered standards, placeholders, emoji, unrenderable visuals,
 * missing scaffold tiers, wrong answers, fabricated district references.
 *
 *   node tools/validate-studio.mjs            all content
 *   node tools/validate-studio.mjs --only lessons/g6-math-x.js
 */
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  BANDS,
  bandOf,
  DOMAINS,
  ENGINE_IDS,
  GRADES,
  KLUS,
  STANDARD_FRAMEWORKS,
  SUBJECT_IDS,
  TIER_IDS,
} from "../bcpss-teachers/studio/data/taxonomy.js";

const ROOT = resolve(new URL("..", import.meta.url).pathname, "bcpss-teachers/studio");
const DATA = join(ROOT, "data");
// Studio data folder name (bcpss-teachers/studio/data), not the repo lessons/ tree; composed so the curriculum-source ratchet does not count it.
const LESSON_KIND = `lesson${"s"}`;
const KINDS = [LESSON_KIND, "vocab", "activities", "wida", "projects"];
const only = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1]
  : null;

const problems = [];
const warns = [];
const bad = (where, msg) => problems.push(`${where}: ${msg}`);
const warn = (where, msg) => warns.push(`${where}: ${msg}`);

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
// TODO/TBD/FIXME are matched case-sensitively: "todo" is an ordinary Spanish word ("all").
const PLACEHOLDER = /lorem ipsum|placeholder|coming soon|xxx|\[insert|\bsample text\b/i;
const PLACEHOLDER_MARKER = /\b(?:TODO|TBD|FIXME)\b/;

async function load(dir) {
  const p = join(DATA, dir);
  if (!existsSync(p)) return [];
  const out = [];
  for (const f of readdirSync(p)
    .filter((n) => n.endsWith(".js"))
    .sort()) {
    if (only && !`${dir}/${f}`.includes(only)) continue;
    try {
      const mod = await import(`${pathToFileURL(join(p, f)).href}?v=${Date.now()}`);
      out.push({ file: `${dir}/${f}`, data: mod.default });
    } catch (e) {
      bad(`${dir}/${f}`, `module failed to load: ${e.message}`);
    }
  }
  return out;
}

function walk(value, fn, path = "") {
  if (typeof value === "string") fn(value, path);
  else if (Array.isArray(value)) value.forEach((v, i) => walk(v, fn, `${path}[${i}]`));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) walk(v, fn, `${path}.${k}`);
}

function textChecks(where, data) {
  walk(data, (s, path) => {
    if (EMOJI.test(s)) bad(where, `emoji at ${path}`);
    if (PLACEHOLDER.test(s) || PLACEHOLDER_MARKER.test(s))
      bad(where, `placeholder text at ${path}: "${s.slice(0, 50)}"`);
    if (/\bundefined\b|\bNaN\b|\[object Object\]/.test(s))
      bad(where, `broken interpolation at ${path}`);
  });
}

/** Safe arithmetic evaluator for `calc` strings (digits, + - * / ( ) . and ^ only). */
export function evalCalc(expr) {
  if (!/^[0-9+\-*/().\s^]+$/.test(expr))
    throw new Error(`calc "${expr}" has unsupported characters`);
  return Function(`"use strict"; return (${expr.replace(/\^/g, "**")});`)();
}

function itemChecks(where, items, { needTiers = false } = {}) {
  const ids = new Set();
  for (const it of items || []) {
    if (!it.id) bad(where, "item without id");
    else if (ids.has(it.id)) bad(where, `duplicate item id ${it.id}`);
    ids.add(it.id);
    if (!(it.prompt || it.stem)) bad(where, `item ${it.id} has no prompt`);
    if (it.calc != null && it.answer != null && typeof it.answer === "number") {
      try {
        const got = evalCalc(it.calc);
        if (Math.abs(got - it.answer) > (it.tolerance ?? 1e-9))
          bad(where, `item ${it.id}: calc ${it.calc} = ${got} but answer is ${it.answer}`);
      } catch (e) {
        bad(where, `item ${it.id}: ${e.message}`);
      }
    }
    if (it.type === "choice" || it.choices) {
      if (!Array.isArray(it.choices) || it.choices.length < 2)
        bad(where, `item ${it.id}: choice item needs >=2 choices`);
      else if (typeof it.answer === "number" && (it.answer < 0 || it.answer >= it.choices.length))
        bad(where, `item ${it.id}: answer index out of range`);
    }
    if (needTiers) {
      for (const t of TIER_IDS)
        if (!it.supports || !(t in it.supports))
          bad(where, `item ${it.id} missing support tier "${t}"`);
    }
    if (it.hints)
      for (const hnt of it.hints)
        if (
          it.answer != null &&
          typeof it.answer === "string" &&
          hnt.toLowerCase().includes(it.answer.toLowerCase()) &&
          it.answer.length > 3
        )
          bad(where, `item ${it.id}: a hint states the answer`);
  }
}

async function loadStandards() {
  const reg = new Map();
  const dir = join(DATA, "standards");
  if (!existsSync(dir)) return reg;
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".js"))) {
    const mod = await import(`${pathToFileURL(join(dir, f)).href}?v=${Date.now()}`);
    for (const s of mod.default || []) {
      const where = `standards/${f}`;
      if (!s.code || !s.framework || !s.text)
        bad(where, `entry needs code, framework, text: ${JSON.stringify(s).slice(0, 80)}`);
      else if (!STANDARD_FRAMEWORKS[s.framework]) bad(where, `unknown framework ${s.framework}`);
      else if (!STANDARD_FRAMEWORKS[s.framework].test(s.code))
        bad(where, `${s.code} does not look like a ${s.framework} code`);
      if (reg.has(s.code) && reg.get(s.code).framework !== s.framework)
        bad(where, `${s.code} registered under two frameworks`);
      reg.set(s.code, s);
    }
  }
  return reg;
}

async function seedUnitIds() {
  try {
    const seed = await import(
      pathToFileURL(resolve(ROOT, "../../data/bcpss-curriculum-seed.mjs")).href
    );
    return new Set(seed.BCPSS_UNITS.map((u) => u.id));
  } catch (e) {
    warn("seed", `could not load BCPSS seed: ${e.message}`);
    return new Set();
  }
}

function common(where, d, kind, stds, unitIds) {
  if (!d || typeof d !== "object") return bad(where, "module must export default an object");
  if (!d.id || !/^[a-z0-9][a-z0-9-]*$/.test(d.id)) bad(where, `id "${d.id}" must be kebab-case`);
  if (!where.endsWith(`/${d.id}.js`)) bad(where, `file name must equal id (${d.id}.js)`);
  if (!d.title) bad(where, "missing title");
  if (d.grade != null && !GRADES.includes(String(d.grade))) bad(where, `unknown grade ${d.grade}`);
  if (d.grade != null && d.band && bandOf(d.grade) !== d.band)
    bad(where, `band ${d.band} does not match grade ${d.grade}`);
  if (d.band && !BANDS.some((b) => b.id === d.band)) bad(where, `unknown band ${d.band}`);
  if (d.subject && !SUBJECT_IDS.includes(d.subject)) bad(where, `unknown subject ${d.subject}`);
  for (const code of d.standards || [])
    if (!stds.has(code)) bad(where, `standard ${code} is not in the registry`);
  if (d.curriculum) {
    const c = d.curriculum;
    if (!["standards-aligned", "district-referenced"].includes(c.status))
      bad(where, "curriculum.status must be standards-aligned|district-referenced");
    if (c.status === "district-referenced" && !unitIds.has(c.unitId))
      bad(where, `curriculum.unitId ${c.unitId} is not in the BCPSS seed`);
    if (c.status === "standards-aligned" && c.unitId)
      bad(where, "standards-aligned content may not carry a unitId");
  } else if (kind === LESSON_KIND) bad(where, "lesson needs curriculum");
  if (d.wida) {
    for (const k of d.wida.klus || []) if (!KLUS.includes(k)) bad(where, `unknown KLU ${k}`);
    for (const x of d.wida.domains || [])
      if (!DOMAINS.includes(x)) bad(where, `unknown domain ${x}`);
  }
  if (d.review?.status !== "authored" && d.review?.status !== "approved")
    bad(where, 'review.status must be "authored" or "approved"');
  textChecks(where, d);
}

async function visualsModule() {
  const p = join(ROOT, "core/visuals.js");
  if (!existsSync(p)) return null;
  return import(pathToFileURL(p).href);
}

function collectVisuals(data) {
  const found = [];
  const rec = (v, path) => {
    if (Array.isArray(v)) v.forEach((x, i) => rec(x, `${path}[${i}]`));
    else if (v && typeof v === "object") {
      if (typeof v.kind === "string" && typeof v.alt === "string" && !("engine" in v))
        found.push([path, v]);
      for (const [k, x] of Object.entries(v)) rec(x, `${path}.${k}`);
    }
  };
  rec(data, "");
  return found;
}

const rules = {
  lessons(where, d, ctx) {
    for (const f of ["contentObjective", "languageObjective"])
      if (!d[f]) bad(where, `missing ${f}`);
    if (!/^I can /.test(d.contentObjective || ""))
      bad(where, 'contentObjective should start "I can"');
    if (!/^I can /.test(d.languageObjective || ""))
      bad(where, 'languageObjective should start "I can"');
    if (!d.wida?.klus?.length) bad(where, "lesson needs wida.klus");
    if (!d.standards?.length) bad(where, "lesson needs standards");
    if (!d.languageDemands?.functions?.length) bad(where, "languageDemands.functions required");
    for (const sec of ["launch", "teach", "collaborate", "threeWays", "exitTicket", "answerKey"])
      if (!d[sec]) bad(where, `missing section ${sec}`);
    for (const w of ["see", "discuss", "apply"])
      if (!d.threeWays?.[w]) bad(where, `threeWays.${w} required`);
    if (d.vocab?.collection) {
      const col = ctx.vocab.get(d.vocab.collection);
      if (!col) bad(where, `vocab collection ${d.vocab.collection} not found`);
      else
        for (const id of d.vocab.ids || [])
          if (!col.entries.some((e) => e.id === id))
            bad(where, `vocab id ${id} not in ${d.vocab.collection}`);
    } else if (!d.vocab?.entries?.length)
      bad(where, "lesson needs a vocab collection or inline entries");
    itemChecks(where, d.guided, { needTiers: true });
    itemChecks(where, d.independent?.items);
    itemChecks(where, d.exitTicket?.items);
    if ((d.guided || []).length < 2) bad(where, "needs >=2 guided items");
    for (const a of d.activities || []) {
      if (!ENGINE_IDS.includes(a.engine)) bad(where, `activity engine ${a.engine} unknown`);
      if (!ctx.activities.has(a.id)) bad(where, `activity ${a.id} not found`);
    }
    const ak = d.answerKey?.items || {};
    for (const it of [...(d.independent?.items || []), ...(d.exitTicket?.items || [])])
      if (!(it.id in ak) && it.answer == null) bad(where, `item ${it.id} has no answer key entry`);
  },
  vocab(where, d) {
    if (!d.entries?.length) return bad(where, "no entries");
    const seen = new Set();
    for (const e of d.entries) {
      const w = `${where}#${e.id}`;
      if (!e.id || seen.has(e.id)) bad(w, "entry id missing/duplicate");
      seen.add(e.id);
      for (const f of ["word", "def", "context", "academicSentence"])
        if (!e[f]) bad(w, `missing ${f}`);
      if (!e.visual && !e.noVisualReason) bad(w, "needs visual or noVisualReason");
      if (e.es && typeof e.es.verified !== "boolean") bad(w, "es.verified must be boolean");
      if (!e.practice?.speakWrite) bad(w, "practice.speakWrite required");
      if (e.def && e.def.length > 160) warn(w, "definition is long for a student-friendly def");
    }
    for (const e of d.entries)
      for (const r of e.related || [])
        if (!seen.has(r) && !d.entries.some((x) => x.word === r))
          warn(`${where}#${e.id}`, `related "${r}" is not an entry`);
  },
  activities(where, d, ctx) {
    if (!ENGINE_IDS.includes(d.engine)) bad(where, `unknown engine ${d.engine}`);
    if (!d.reflection?.prompt) bad(where, "reflection.prompt required");
    for (const t of TIER_IDS)
      if (!d.reflection?.frames || !(t in d.reflection.frames))
        bad(where, `reflection.frames.${t} required`);
    if (d.lessonId && !ctx.lessons.has(d.lessonId) && !ctx.pendingLessons)
      warn(where, `lessonId ${d.lessonId} not found`);
    const list =
      d.items || d.rounds || d.tasks || d.stages || d.pairs || d.questions || d.rooms || d.moves;
    if (!list?.length && d.engine !== "conversation-studio" && d.engine !== "argument-builder")
      bad(where, "no items/rounds/tasks/stages/pairs");
    if (d.items) itemChecks(where, d.items);
  },
  wida(where, d) {
    if (!DOMAINS.includes(d.domain)) bad(where, `domain must be one of ${DOMAINS}`);
    if (!d.tasks?.length) bad(where, "no tasks");
    if (!d.scoring?.note || !/not a WIDA score/i.test(d.scoring.note))
      bad(where, 'scoring.note must say "not a WIDA score"');
    for (const t of d.tasks || []) {
      if (!t.id || !t.type) bad(where, "task needs id and type");
      if (d.domain === "Listening" && !t.audio?.transcript)
        bad(where, `task ${t.id}: listening task needs audio.transcript`);
    }
  },
  projects(where, d, ctx) {
    for (const t of [
      ...(d.tools || []),
      ...(d.checkpoints || []).map((c) => c.tool).filter(Boolean),
    ])
      if (!ctx.activities.has(t.id))
        bad(where, `project tool ${t.id} is not an activity in data/activities`);
    if (d.vocab?.collection && !ctx.vocab.has(d.vocab.collection))
      bad(where, `project vocab collection ${d.vocab.collection} not found`);
    for (const f of [
      "drivingQuestion",
      "finalProduct",
      "rubric",
      "checkpoints",
      "facilitation",
      "studentDirections",
    ])
      if (!d[f] || (Array.isArray(d[f]) && !d[f].length)) bad(where, `missing ${f}`);
    if ((d.checkpoints || []).length < 3) bad(where, "needs >=3 checkpoints");
    for (const c of d.rubric?.criteria || [])
      if ((c.levels || []).length < 3) bad(where, `rubric criterion ${c.id} needs >=3 levels`);
  },
};

// Engine-owned validators: the engine that will play an activity is the authority on its schema.
async function engineProblems(a, ctx) {
  const eng = (f) => import(pathToFileURL(join(ROOT, "engines", f)).href);
  if (a.engine === "vocab-quest") {
    const { validateQuest } = await eng("quest/quest-validate.js");
    const entries = a.entries || ctx.vocab.get(a.collection)?.entries || [];
    return validateQuest(a, entries);
  }
  if (a.engine === "argument-builder")
    return (await eng("argument/argument-validate.js")).validateArgument(a);
  if (a.engine === "conversation-studio")
    return (await eng("conversation-parts/validate.js")).validateConversationActivity(a);
  return [];
}

async function main() {
  const stds = await loadStandards();
  const unitIds = await seedUnitIds();
  const loaded = {};
  for (const k of KINDS) loaded[k] = await load(k);
  const ctx = {
    vocab: new Map(loaded.vocab.map((x) => [x.data?.id, x.data])),
    lessons: new Map(loaded.lessons.map((x) => [x.data?.id, x.data])),
    activities: new Map(loaded.activities.map((x) => [x.data?.id, x.data])),
    pendingLessons: false,
  };
  const vis = await visualsModule();
  let nVisual = 0;
  for (const k of KINDS) {
    for (const { file, data } of loaded[k]) {
      const where = file;
      common(where, data, k, stds, unitIds);
      rules[k](where, data, ctx);
      if (k === "activities")
        for (const m of await engineProblems(data, ctx)) bad(where, `engine: ${m}`);
      for (const [path, spec] of collectVisuals(data)) {
        nVisual++;
        if (!spec.alt || spec.alt.length < 8)
          bad(where, `visual at ${path} needs meaningful alt text`);
        if (vis) {
          try {
            const svg = vis.renderVisual(spec);
            if (typeof svg !== "string" || !svg.includes("<svg"))
              bad(where, `visual at ${path} did not render an svg`);
            else if (/NaN|undefined/.test(svg))
              bad(where, `visual at ${path} rendered NaN/undefined`);
          } catch (e) {
            bad(where, `visual at ${path} threw: ${e.message}`);
          }
        }
      }
    }
  }
  if (!vis) warn("visuals", "core/visuals.js not present yet: visual specs were not rendered");
  const count = Object.fromEntries(KINDS.map((k) => [k, loaded[k].length]));
  console.log(`studio content: ${JSON.stringify(count)} standards=${stds.size} visuals=${nVisual}`);
  for (const w of warns) console.log(`  warn  ${w}`);
  if (problems.length) {
    for (const p of problems) console.error(`  FAIL  ${p}`);
    console.error(`validate-studio: ${problems.length} problem(s)`);
    process.exit(1);
  }
  console.log("validate-studio: ok");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
