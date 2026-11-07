#!/usr/bin/env node
// Grades 6-8 publisher pass: builds the added Listening, Speaking and Writing activities into
// access-practice-lab/content/g6-8/<Domain>.json, and the added Reading Room lessons into
// content/reading-room/lessons.json, from the authored specs in tools/access-g68-content/*.mjs.
//
// Hand-authored activities and lessons are never touched. Bank spec ids become `68p-<id>`, lesson ids become
// `rr68p-<id>`; the builder replaces an entry with that id when it exists and appends it otherwise, so a run is
// idempotent. Added bank activities are listed in strands whose category id ends in `-68p` (rebuilt every run).
// Spec shapes are documented at the top of tools/access-g68-content/README.mjs; the lint rules are in
// tools/lib/access-g68-lint.mjs.
//
//   node tools/build-access-g68-content.mjs           write the files
//   node tools/build-access-g68-content.mjs --check   fail when a written file differs from the specs
//   node tools/build-access-g68-content.mjs --lint    lint the specs only (no files written)
//   G68_ONLY=listening-2.mjs node tools/build-access-g68-content.mjs --lint   lint just those spec files (authoring)
//
// Run `node tools/access-lab-index.mjs` afterwards (content/index.json, alignment index, glossary).
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { GRADE_REASONS } from "../access-practice-lab/src/grade-focus.js";
import { DEFAULTS, lessonDefaults, TIME } from "./lib/access-g68-defaults.mjs";
import { lintLessons, lintSpecs } from "./lib/access-g68-lint.mjs";
import { CONTENT_DIR } from "./lib/access-lab-content.mjs";

const SPEC_DIR = join(import.meta.dirname, "access-g68-content");
const BANK_DOMAINS = ["Listening", "Speaking", "Writing"];
export const PREFIX = "68p-";
export const LESSON_PREFIX = "rr68p-";
export const STRAND_SUFFIX = "-68p";
const GUIDE_FILE = join(CONTENT_DIR, "es-guide.json");
const LESSON_FILE = join(CONTENT_DIR, "reading-room", "lessons.json");
const DOMAIN_FILE = (d) => join(CONTENT_DIR, "g6-8", `${d}.json`);

// Position of the keyed option, cycled per option count so a domain's keys spread evenly (the quality gate runs a
// chi-square over each group). The sequences are fixed permutations, not random, so builds are stable.
const KEY_CYCLE = { 3: [1, 0, 2, 2, 1, 0], 4: [2, 0, 3, 1, 1, 3, 0, 2] };
const letter = (i) => "abcdefgh"[i];

function placeKey(count, n, at) {
  const cycle = KEY_CYCLE[count];
  return cycle ? cycle[at[count]++ % cycle.length] % count : n % count;
}

/** Options with the right answers first in the spec -> shown order with the key(s) at a controlled position. */
function arrange(spec, nRight, position) {
  const opts = spec.opts.map((o) => String(o));
  const why = spec.why || [];
  const right = opts.slice(0, nRight).map((text) => ({ text }));
  const wrong = opts.slice(nRight).map((text, i) => ({ text, why: why[i] }));
  if (nRight === 1) {
    const shown = [...wrong];
    shown.splice(position, 0, right[0]);
    return { shown, keys: [position] };
  }
  // multiSelect: put the right answers at spread-out positions derived from the cycle
  const total = opts.length;
  const keys = [];
  for (let k = 0; k < nRight; k++) keys.push((position + k * 2) % total);
  const uniq = [...new Set(keys)];
  while (uniq.length < nRight)
    for (let i = 0; i < total && uniq.length < nRight; i++) if (!uniq.includes(i)) uniq.push(i);
  uniq.sort((a, b) => a - b);
  const shown = Array(total).fill(null);
  uniq.forEach((pos, i) => {
    shown[pos] = right[i];
  });
  let w = 0;
  for (let i = 0; i < total; i++) if (!shown[i]) shown[i] = wrong[w++];
  return { shown, keys: uniq };
}

const rotate = (list, k) => list.map((_, i) => list[(i + k) % list.length]);
const hash = (s) => [...String(s)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
const firstSentence = (t) => (String(t).match(/^.*?[.!?](?=\s|$)/)?.[0] || String(t)).trim();

function distractors(options, ids, shownWhy) {
  const out = {};
  options.forEach((o, i) => {
    if (!ids.includes(o.id) && shownWhy[i]) out[o.id] = shownWhy[i];
  });
  return out;
}

function expandBank(spec, domain, counters) {
  const id = `${PREFIX}${spec.id}`;
  const type = spec.type || (domain === "Listening" ? "multipleChoice" : "constructed");
  const a = {
    id,
    ...(spec.gw && spec.level !== "A"
      ? { grades: GRADE_REASONS[spec.gw], gradesWhy: spec.gw }
      : {}),
    title: spec.title,
    skill: spec.skill,
    time: spec.time || TIME[domain][spec.level],
    type,
    directions: spec.dir,
    prompt: spec.q,
  };
  if (spec.script) a.script = spec.script;
  if (spec.table) a.table = spec.table;
  if (spec.chart) a.chart = spec.chart;
  if (spec.picture) a.picture = spec.picture;
  if (type === "multipleChoice" || type === "multiSelect") {
    const multi = type === "multiSelect";
    const count = spec.opts.length;
    const position = multi ? counters.n++ % count : placeKey(count, counters.n++, counters.at);
    const { shown, keys } = arrange(spec, multi ? spec.ans : 1, position);
    a.options = shown.map((o, i) => ({ id: letter(i), text: o.text }));
    const keyIds = keys.map(letter);
    if (multi) a.answers = keyIds;
    else a.answer = keyIds[0];
    const d = distractors(
      a.options,
      keyIds,
      shown.map((o) => o.why),
    );
    if (Object.keys(d).length) a.distractorFeedback = d;
  } else if (type === "order") {
    const n = spec.items.length;
    const keyed = spec.items.map((t, i) => ({ id: `s${i + 1}`, text: t }));
    a.items = rotate(keyed, 1 + (hash(id) % (n - 1)));
    a.answer = keyed.map((k) => k.id);
  } else if (type === "cloze") {
    let b = 0;
    a.segments = spec.cloze.map((seg) => {
      if (typeof seg === "string") return { text: seg };
      const [answer, ...wrong] = seg;
      b += 1;
      const opts = [answer, ...wrong];
      return {
        blank: { id: `b${b}`, options: rotate(opts, hash(`${id}${b}`) % opts.length), answer },
      };
    });
  } else if (type === "sort") {
    a.categories = spec.cats;
    a.items = rotate(
      spec.sortItems.map(([text, ci], i) => ({ id: `s${i + 1}`, text, answer: spec.cats[ci] })),
      hash(id) % spec.sortItems.length,
    );
  } else if (type === "hotText") {
    a.sentences = spec.sentences.map((text, i) => ({ id: `s${i + 1}`, text }));
    a.answers = spec.answerIdx.map((i) => `s${i + 1}`);
  }
  const forKey = { Listening: "listenFor", Speaking: "sayFor", Writing: "writeFor" }[domain];
  a[forKey] = spec.focus;
  if (type === "constructed") {
    a.responseLabel = spec.label || DEFAULTS[domain].label;
    a.responsePlaceholder = spec.frames[0];
    a.models = spec.models;
    a.successCriteria = spec.criteria;
    a.modelNotes = Object.fromEntries(
      Object.entries(spec.models).map(([k, v]) => [
        k,
        `Notice this specific move: “${firstSentence(v)}” Borrow the useful language, not the whole answer; a clear short response can meet the goal.`,
      ]),
    );
  }
  if (domain === "Writing") a.wordBank = spec.bank;
  a.vocabulary = spec.vocab;
  a.frames = spec.frames;
  a.correct = spec.correct;
  a.hint = spec.hint;
  a.support = spec.support || DEFAULTS[domain].support;
  if (spec.plan) a.support = `${a.support} Plan: ${spec.plan.join(" | ")}`;
  a.extension = spec.extension || DEFAULTS[domain].extension;
  a.wida = spec.wida;
  a.teacher = { ...DEFAULTS[domain].teacher(spec.skill), ...(spec.teacher || {}) };
  return a;
}

/** Merge the specs of one bank domain into its parsed file. */
export function mergeDomain(data, domain, specs) {
  const out = structuredClone(data);
  const ids = new Set(specs.map((s) => `${PREFIX}${s.id}`));
  const counters = { n: 0, at: { 3: 0, 4: 0 } };
  const built = new Map(specs.map((s) => [s, expandBank(s, domain, counters)]));
  const short = domain.slice(0, 3).toLowerCase();
  for (const lk of ["A", "B", "C"]) {
    const level = out.levels[lk];
    const mine = specs.filter((s) => s.level === lk);
    level.activities = level.activities.filter((a) => !ids.has(a.id));
    level.categories = (level.categories || []).filter((c) => !c.id.endsWith(STRAND_SUFFIX));
    level.activities.push(...mine.map((s) => built.get(s)));
    const strands = new Map();
    for (const s of mine) {
      const key = s.strand || "More practice";
      if (!strands.has(key)) strands.set(key, []);
      strands.get(key).push(`${PREFIX}${s.id}`);
    }
    let n = 0;
    for (const [title, activityIds] of strands) {
      n += 1;
      level.categories.push({
        id: `${short}-${lk.toLowerCase()}-${n}${STRAND_SUFFIX}`,
        title,
        desc: DEFAULTS[domain].strandDesc,
        activityIds,
      });
    }
  }
  return out;
}

// ── Reading Room lessons ─────────────────────────────────────────────────────

function expandQuestion(q, lessonId, position) {
  const base = { id: q.id, phase: q.phase, skill: q.skill, type: q.type, prompt: q.prompt };
  if (q.type === "choice" || q.type === "connector") {
    const { shown, keys } = arrange(q, 1, position);
    const choices = shown.map((o, i) => ({
      id: `choice-${i + 1}`,
      text: o.text,
      ...(o.why ? { why: o.why } : {}),
    }));
    return {
      ...base,
      ...(q.sentence ? { sentence: q.sentence } : {}),
      choices,
      answerId: choices[keys[0]].id,
      rationale: q.rat,
    };
  }
  if (q.type === "multi" || q.type === "hotText") {
    const { shown, keys } = arrange(q, q.ans, position);
    const choices = shown.map((o, i) => ({
      id: `choice-${i + 1}`,
      text: o.text,
      ...(o.why ? { why: o.why } : {}),
    }));
    return { ...base, choices, answerIds: keys.map((k) => choices[k].id), rationale: q.rat };
  }
  if (q.type === "cloze") {
    let b = 0;
    const segments = q.cloze.map((seg) => {
      if (typeof seg === "string") return { text: seg };
      const [answer, ...wrong] = seg;
      b += 1;
      const opts = [answer, ...wrong];
      return {
        blank: {
          id: `b${b}`,
          options: rotate(opts, hash(`${lessonId}${q.id}${b}`) % opts.length),
          answer,
        },
      };
    });
    return { ...base, segments, rationale: q.rat };
  }
  if (q.type === "evidence")
    return { ...base, paragraphIds: q.paragraphIds, answerIds: q.evidence, rationale: q.rat };
  if (q.type === "order") {
    const n = q.items.length;
    const keyed = q.items.map((text, i) => ({ id: `step-${i + 1}`, text }));
    return {
      ...base,
      items: rotate(keyed, 1 + (hash(`${lessonId}${q.id}`) % (n - 1))),
      answerOrder: keyed.map((k) => k.id),
      rationale: q.rat,
    };
  }
  if (q.type === "sort") {
    const items = q.sortItems.map(([text, ci], i) => ({
      id: `item-${i + 1}`,
      text,
      answer: q.cats[ci],
    }));
    return {
      ...base,
      categories: q.cats,
      items: rotate(items, hash(`${lessonId}${q.id}`) % items.length),
      rationale: q.rat,
    };
  }
  // short constructed response
  return { ...base, lookFor: q.lookFor, rubric: q.rubric, frame: q.frame, model: q.model };
}

export function expandLesson(s, index) {
  const id = `${LESSON_PREFIX}${s.id}`;
  const cycle = KEY_CYCLE[3];
  const questions = s.qs.map((q, i) =>
    expandQuestion(
      {
        ...q,
        id: q.id || `q${i + 1}`,
        paragraphIds: q.type === "evidence" ? s.paras.map((_, n) => `p${n + 1}`) : undefined,
      },
      id,
      cycle[(index + i) % cycle.length] % (q.opts?.length || 3),
    ),
  );
  questions.push({
    id: "transfer",
    phase: "third",
    skill: "Transfer the reading strategy",
    type: "short",
    prompt: s.transfer.prompt,
    lookFor: s.transfer.lookFor,
    rubric: s.transfer.lookFor,
    frame: s.transfer.frame,
  });
  return lessonDefaults(s, id, questions);
}

export function mergeLessons(doc, specs) {
  const out = structuredClone(doc);
  const ids = new Set(specs.map((s) => `${LESSON_PREFIX}${s.id}`));
  out.lessons = out.lessons.filter((l) => !ids.has(l.id));
  out.lessons.push(...specs.map(expandLesson));
  return out;
}

// ── files ────────────────────────────────────────────────────────────────────

export async function loadSpecs(kind) {
  if (!existsSync(SPEC_DIR)) return [];
  const files = readdirSync(SPEC_DIR)
    .filter((f) => f.startsWith(`${kind}-`) && f.endsWith(".mjs"))
    .filter((f) => !process.env.G68_ONLY || process.env.G68_ONLY.split(",").includes(f))
    .sort();
  const out = [];
  for (const f of files) out.push(...(await import(pathToFileURL(join(SPEC_DIR, f)).href)).default);
  return out;
}

function indentOf(text) {
  for (const ind of [1, 2])
    if (`${JSON.stringify(JSON.parse(text), null, ind)}\n` === text) return ind;
  return 1;
}
const render = (text, data) => `${JSON.stringify(data, null, indentOf(text))}\n`;

export function mergeGuide(guide, specs) {
  const activities = { ...guide.activities };
  for (const s of specs) activities[`${PREFIX}${s.id}`] = { skill: s.es[0], directions: s.es[1] };
  const sorted = Object.fromEntries(
    Object.entries(activities).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
  return { ...guide, activities: sorted };
}

/** Every target file with the text it should hold: [[path, next, current]]. */
async function plan() {
  const lessons = await loadSpecs("reading");
  const bank = {};
  const all = [];
  for (const d of BANK_DOMAINS) {
    bank[d] = await loadSpecs(d.toLowerCase());
    all.push(...bank[d].map((s) => ({ ...s, domain: d })));
  }
  const problems = [...lintSpecs(all), ...lintLessons(lessons)];
  if (problems.length) {
    const e = new Error(
      `g68 spec lint: ${problems.length} problem(s)\n  ${problems.slice(0, 80).join("\n  ")}`,
    );
    e.problems = problems;
    throw e;
  }
  const out = [];
  for (const d of BANK_DOMAINS) {
    if (!bank[d].length) continue;
    const text = readFileSync(DOMAIN_FILE(d), "utf8");
    out.push([DOMAIN_FILE(d), render(text, mergeDomain(JSON.parse(text), d, bank[d])), text]);
  }
  if (lessons.length) {
    const text = readFileSync(LESSON_FILE, "utf8");
    out.push([LESSON_FILE, render(text, mergeLessons(JSON.parse(text), lessons)), text]);
  }
  if (all.length) {
    const text = readFileSync(GUIDE_FILE, "utf8");
    out.push([GUIDE_FILE, `${JSON.stringify(mergeGuide(JSON.parse(text), all), null, 1)}`, text]);
  }
  return out;
}

/** Built files that differ from what the specs produce now (paths relative to content/). */
export async function staleG68Files() {
  const stale = [];
  for (const [file, next, current] of await plan()) {
    const cmp = file === GUIDE_FILE ? current.replace(/\n$/, "") : current;
    if (next !== cmp) stale.push(file.replace(`${CONTENT_DIR}/`, ""));
  }
  return stale;
}

async function main() {
  const lintOnly = process.argv.includes("--lint");
  const check = process.argv.includes("--check");
  let steps;
  try {
    steps = await plan();
  } catch (e) {
    if (!e.problems) throw e;
    console.error(e.message);
    process.exit(1);
  }
  if (lintOnly) return console.log("build-access-g68-content: specs pass lint");
  let stale = 0;
  for (const [file, next, current] of steps) {
    const cmp = file === GUIDE_FILE ? current.replace(/\n$/, "") : current;
    if (next === cmp) continue;
    if (check) {
      console.error(`STALE ${file} — run node tools/build-access-g68-content.mjs`);
      stale++;
    } else {
      writeFileSync(file, file === GUIDE_FILE && current.endsWith("\n") ? `${next}\n` : next);
      console.log(`wrote ${file}`);
    }
  }
  if (stale) process.exit(1);
  console.log(`build-access-g68-content: ${check ? "current" : "done"}`);
}
if (import.meta.url === `file://${process.argv[1]}`) await main();
