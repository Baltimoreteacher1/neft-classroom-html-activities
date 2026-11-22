#!/usr/bin/env node
/**
 * Gate for the ACCESS Practice Lab studio content (access-practice-lab/STUDIO-CONTENT.md):
 * speaking tasks, writing tasks, scoring exemplars, adaptive missions, detective patterns.
 *
 * Holds what no render probe can see: answer keys that point at real ids, evidence
 * pools whose quotes are not in the source, exemplar annotations quoting text that is
 * not in the response, practice sentences the detectors do not flag (a detective
 * lesson that "fixes" nothing), proficiency-score language, and Unit-less id clashes.
 * Detectors self-test against known-bad fixtures BEFORE the sweep.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTENT_DIR, REPO_ROOT } from "./lib/access-lab-content.mjs";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const STUDIO_DIR = join(CONTENT_DIR, "studio");
const MISSION_DIR = join(CONTENT_DIR, "missions");
const DETECTIVE_FILE = join(CONTENT_DIR, "detective", "patterns.json");
const KLU = ["Narrate", "Inform", "Explain", "Argue"];
const DIMS = ["Discourse", "Sentence", "Word/Phrase"];
const STANDARDS = ["ELD-LA", "ELD-MA", "ELD-SC", "ELD-SS", "ELD-SI"];
const SPEAK_TYPES = ["retell", "describe", "compare", "explain", "argue", "discuss"];
const WRITE_FORMS = [
  "paragraph",
  "cer",
  "essay",
  "letter",
  "report",
  "summary",
  "narrative",
  "email",
];
const DISTRACTORS = [
  "unsupported",
  "opposite",
  "true-not-asked",
  "overgeneralized",
  "detail-trap",
  "partial",
];
const BANDS = ["early", "building", "strong"];
const SKILLS = ["Listening", "Reading", "Speaking", "Writing", "Decision"];
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const asList = (x) => (Array.isArray(x) ? x : x ? [x] : []);
export const failures = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);
/** Run a detector and return only the failures it added (used by tools/access-studio-elementary.test.mjs). */
export function collect(fn) {
  const before = failures.length;
  fn();
  return failures.splice(before);
}
// Importing this file must not sweep the content or exit: only running it does.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}
function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) strings(v, out);
  else if (value && typeof value === "object")
    for (const v of Object.values(value)) strings(v, out);
  return out;
}

// ── detectors (pure, exported for the self-test) ──────────────────────────────
export function scoreClaims(obj) {
  return strings(obj).filter((s) => SCORE_CLAIM.test(s));
}
export function checkVocab(where, vocab) {
  for (const v of asList(vocab)) {
    if (!v?.term || !v?.def || !v?.es)
      fail(where, `vocab entry needs term/def/es: ${JSON.stringify(v)}`);
    else if (!/^[^:]+:\s*\S/.test(v.es))
      fail(where, `vocab es must be "término: definición" (${v.term})`);
  }
}
export function checkStages(where, stages) {
  if (!stages?.guided?.frames?.length) fail(where, "stages.guided.frames required");
  if (!stages?.guided?.model) fail(where, "stages.guided.model required");
  if (!asList(stages?.supported?.bank).length) fail(where, "stages.supported.bank required");
  if (stages?.independent && Object.keys(stages.independent).length)
    fail(where, "stages.independent must be empty (independent means no scaffolds)");
}

const norm = (x) =>
  String(x || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const tokens = (x) =>
  new Set(
    norm(x)
      .split(" ")
      .filter((w) => w.length > 2),
  );
/** Share of the smaller token set that the other set contains: 1 means one option is contained in the other. */
const overlapShare = (a, b) => {
  const x = tokens(a);
  const y = tokens(b);
  if (!x.size || !y.size) return 0;
  let n = 0;
  for (const w of x) if (y.has(w)) n += 1;
  return n / Math.min(x.size, y.size);
};
export const MIN_EXPLAIN_CHARS = 60;
const ESCAPE_OPTION =
  /\b(?:all|none|both|neither)\s+of\s+the\s+(?:above|these)\b|\bboth\s+[a-d]\s+and\s+[a-d]\b/i;
const BARE_FEEDBACK =
  /^(?:correct|right|yes|good|great|nice|well done|try again|incorrect|wrong)[.!\s]*$/i;
/**
 * Quality rules a question must meet so the learner can learn from it: a real stem, options that are written
 * (not blank), distinct and not "all of the above", and an explanation that teaches rather than confirms.
 * Teacher-created content is not run through this: it only gates the lab's own mission files.
 */
export function checkQuestionQuality(where, t) {
  const options = t.options || [];
  if (norm(t.q).split(" ").filter(Boolean).length < 4)
    fail(where, "question needs a real stem (4+ words)");
  const seen = [];
  for (const o of options) {
    if (!norm(o.text)) {
      fail(where, `option ${o.id} is blank`);
      continue;
    }
    if (ESCAPE_OPTION.test(o.text))
      fail(where, `option ${o.id} is an "all/none/both" escape option`);
    for (const prior of seen) {
      if (norm(prior.text) === norm(o.text))
        fail(where, `options ${prior.id} and ${o.id} are duplicates`);
      else if (overlapShare(prior.text, o.text) >= 0.9 && tokens(prior.text).size > 3)
        fail(where, `options ${prior.id} and ${o.id} are near-duplicates (almost the same words)`);
    }
    seen.push(o);
  }
  const explain = String(t.explain || "");
  if (BARE_FEEDBACK.test(explain.trim()) || explain.trim().length < MIN_EXPLAIN_CHARS)
    fail(
      where,
      `explain must teach why the answer fits (at least ${MIN_EXPLAIN_CHARS} characters, not just "Correct")`,
    );
  const correct = options.find((o) => o.id === t.answer);
  if (correct && overlapShare(explain, t.q) >= 0.95 && tokens(explain).size < 8)
    fail(where, "explain only restates the question");
}
/** An evidence-collection task: a pool with real distractors, distinct statements and teaching feedback. */
export function checkEvidenceQuality(where, t) {
  const pool = asList(t.pool);
  const ids = pool.map((e) => e.id);
  if (new Set(ids).size !== ids.length) fail(where, "duplicate pool statement ids");
  const texts = pool.map((e) => norm(e.text));
  if (new Set(texts).size !== texts.length) fail(where, "duplicate pool statements");
  if (pool.some((e) => !norm(e.text))) fail(where, "blank pool statement");
  if (pool.every((e) => e.supports))
    fail(where, "evidence pool needs at least one statement that does not support");
  if (norm(t.q).split(" ").filter(Boolean).length < 4)
    fail(where, "evidence task needs a real question");
  if (!t.boardLabel) fail(where, "evidence task needs a boardLabel");
  if (String(t.explain || "").trim().length < MIN_EXPLAIN_CHARS)
    fail(
      where,
      `evidence task needs explain: why the supporting statements answer the question (at least ${MIN_EXPLAIN_CHARS} characters)`,
    );
}
export function checkQuestion(where, t, sourceText = "") {
  const ids = (t.options || []).map((o) => o.id);
  if ((t.options || []).length < 3 || (t.options || []).length > 4)
    fail(where, "question needs 3-4 options");
  if (new Set(ids).size !== ids.length) fail(where, "duplicate option ids");
  if (!ids.includes(t.answer)) fail(where, `answer "${t.answer}" is not an option id`);
  if (!t.explain) fail(where, "question needs explain");
  for (const o of t.options || []) {
    if (o.id === t.answer) {
      if (o.distractor) fail(where, `correct option ${o.id} must not carry a distractor tag`);
    } else if (!DISTRACTORS.includes(o.distractor))
      fail(where, `option ${o.id} needs distractor in ${DISTRACTORS}`);
  }
  const lens = (t.options || []).map((o) => o.text.length);
  const correct = (t.options || []).find((o) => o.id === t.answer);
  if (
    correct &&
    lens.length > 2 &&
    correct.text.length === Math.max(...lens) &&
    correct.text.length > 1.6 * (lens.reduce((a, b) => a + b, 0) / lens.length)
  )
    fail(where, "correct option is conspicuously the longest");
  checkQuestionQuality(where, t);
  void sourceText;
}

// ── loaders ───────────────────────────────────────────────────────────────────
const load = (f) => (existsSync(f) ? readJson(f) : null);
const speaking = load(join(STUDIO_DIR, "speaking.json"));
const writing = load(join(STUDIO_DIR, "writing.json"));
const exemplarFiles = existsSync(STUDIO_DIR)
  ? readdirSync(STUDIO_DIR).filter((f) => /^exemplars.*\.json$/.test(f))
  : [];
const exemplars = exemplarFiles.length
  ? { exemplars: exemplarFiles.flatMap((f) => readJson(join(STUDIO_DIR, f)).exemplars || []) }
  : null;
const patterns = load(DETECTIVE_FILE);
const missions = existsSync(MISSION_DIR)
  ? readdirSync(MISSION_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => [f, readJson(join(MISSION_DIR, f))])
  : [];
function checkMissionCoverage() {
  for (const band of ["3-5", "6-8"]) {
    const count = missions.filter(([, mission]) => mission.band === band).length;
    if (count < (band === "3-5" ? 3 : 6))
      fail(
        `missions:coverage`,
        `${band} needs at least ${band === "3-5" ? 3 : 6} original missions (found ${count})`,
      );
  }
}

const seen = new Map();
function claimId(where, id) {
  if (!ID.test(id || "")) fail(where, `bad id "${id}"`);
  if (seen.has(id)) fail(where, `id "${id}" also used by ${seen.get(id)}`);
  seen.set(id, where);
}
function commonTask(where, t) {
  if (!KLU.includes(t.keyUse)) fail(where, `keyUse must be one of ${KLU}`);
  if (!asList(t.standards).length || !t.standards.every((s) => STANDARDS.includes(s)))
    fail(where, "standards invalid");
  if (!asList(t.dimensions).length || !t.dimensions.every((d) => DIMS.includes(d)))
    fail(where, "dimensions invalid");
  if (!t.scenario || !t.prompt || !t.title) fail(where, "title/scenario/prompt required");
  if (asList(t.successCriteria).length < 3) fail(where, "≥3 successCriteria");
  if (asList(t.sourceTerms).length < 3) fail(where, "≥3 sourceTerms");
  checkVocab(where, t.vocab);
  if (asList(t.vocab).length < 3) fail(where, "≥3 vocab");
  checkStages(where, t.stages);
}

const words = (text) =>
  String(text || "")
    .split(/\s+/)
    .filter(Boolean).length;
/** Band 3-5 speaking: shorter turns and a model a younger learner can say; discussions need real discourse moves. */
export function checkElementarySpeaking(w, t) {
  if (t.targetSeconds?.[1] > 120) fail(w, "3-5 speaking: targetSeconds max must be 120 or less");
  if (words(t.stages?.guided?.model) > 140) fail(w, "3-5 speaking: guided model over 140 words");
  if (asList(t.successCriteria).length > 4) fail(w, "3-5 speaking: at most 4 successCriteria");
  if (t.taskType === "discuss") {
    const turns = asList(t.turns);
    for (const u of turns)
      if (!u.partner || !u.voice || words(u.say) < 6)
        fail(w, "3-5 discuss: every partner turn needs partner, voice and a spoken line");
    if (new Set(turns.map((u) => u.expects)).size < 2)
      fail(w, "3-5 discuss: partner turns must ask for at least 2 different discourse moves");
    if (!asList(t.planner).some((p) => /partner|answer|respond|reply/i.test(`${p.id} ${p.label}`)))
      fail(w, "3-5 discuss: planner needs a slot for answering the partner");
  }
}
/** Band 3-5 writing: short, sourced, one idea per organizer slot. */
export function checkElementaryWriting(w, t) {
  const e = t.expected || {};
  if (!(e.minWords >= 25)) fail(w, "3-5 writing: expected.minWords must be at least 25");
  if (!(e.maxWords <= 140)) fail(w, "3-5 writing: expected.maxWords must be 140 or less");
  if (!(e.paragraphs >= 1 && e.paragraphs <= 3))
    fail(w, "3-5 writing: expected.paragraphs must be 1-3");
  if (words(t.stages?.guided?.model) > 130) fail(w, "3-5 writing: guided model over 130 words");
  const sup = asList(t.stages?.supported?.bank).length;
  if (sup < 6 || sup > 12) fail(w, "3-5 writing: supported bank must have 6-12 terms");
  if (!asList(t.teacher?.lookFor).length || !asList(t.teacher?.commonIssues).length)
    fail(w, "3-5 writing: teacher.lookFor and teacher.commonIssues required");
}
/** The 3-5 band must keep its own writing collection and at least one real discussion task. */
export function checkElementaryCoverage(speakingTasks, writingTasks) {
  const w = "coverage:3-5";
  const wr = asList(writingTasks).filter((t) => t.band === "3-5");
  const sp = asList(speakingTasks).filter((t) => t.band === "3-5");
  if (wr.length < 6) fail(w, `3-5 writing needs at least 6 tasks (found ${wr.length})`);
  if (new Set(wr.map((t) => t.form)).size < 4)
    fail(w, "3-5 writing needs at least 4 different forms");
  if (new Set(wr.map((t) => t.keyUse)).size < 3)
    fail(w, "3-5 writing needs at least 3 Key Language Uses");
  if (!sp.some((t) => t.taskType === "discuss"))
    fail(w, "3-5 speaking needs at least 1 discuss task");
}

export function checkSpeakingTask(w, t, { inline = false } = {}) {
  commonTask(w, t);
  if (!SPEAK_TYPES.includes(t.taskType)) fail(w, `taskType must be one of ${SPEAK_TYPES}`);
  if (!inline && !["6-8", "3-5"].includes(t.band)) fail(w, "band");
  if (asList(t.planner).length < 3 || t.planner.length > 5) fail(w, "planner needs 3-5 slots");
  const [lo, hi] = t.targetSeconds || [];
  if (!(lo >= 10 && hi > lo && hi <= 180)) fail(w, "targetSeconds [min,max] invalid");
  if (t.taskType === "discuss") {
    if (!(t.turns?.length >= 2 && t.turns.length <= 4)) fail(w, "discuss needs 2-4 partner turns");
    for (const u of t.turns || [])
      if (!["agree-add", "disagree-evidence", "clarify", "extend"].includes(u.expects))
        fail(w, `turn expects "${u.expects}" invalid`);
  }
  if (t.stimulus?.kind === "audio" && !asList(t.stimulus.turns).length)
    fail(w, "audio stimulus needs turns");
  if (t.stimulus?.kind && t.stimulus.kind !== "none") {
    const body = strings(t.stimulus).join(" ").toLowerCase();
    for (const term of asList(t.sourceTerms))
      if (!body.includes(String(term).toLowerCase()))
        fail(w, `sourceTerm "${term}" not found in stimulus`);
  }
  const model = String(t.stages?.guided?.model || "")
    .split(/\s+/)
    .filter(Boolean).length;
  if (model < 60 || model > 160) fail(w, `guided model is ${model} words (want 60-160)`);
  const frames = asList(t.stages?.guided?.frames).length;
  if (frames < 2 || frames > 5) fail(w, "guided frames: 2-5");
  const bank = asList(t.stages?.supported?.bank).length;
  if (bank < 6 || bank > 12) fail(w, "supported bank: 6-12");
  if (!inline && !t.teacher?.listenFor?.length) fail(w, "teacher.listenFor required");
  if (!inline && t.band === "3-5") checkElementarySpeaking(w, t);
}
export function sweepSpeaking(data, exemplarIds = null) {
  const perType = {};
  for (const t of data?.tasks || []) {
    const w = `speaking:${t.id}`;
    claimId(w, t.id);
    checkSpeakingTask(w, t);
    perType[t.taskType] = (perType[t.taskType] || 0) + 1;
    for (const id of t.teacher?.exemplarIds || [])
      if (exemplarIds && !exemplarIds.has(id)) fail(w, `teacher.exemplarIds: ${id} does not exist`);
  }
  void perType;
}
export function checkWritingTask(w, t, { inline = false } = {}) {
  commonTask(w, t);
  if (!inline && !["6-8", "3-5"].includes(t.band))
    fail(w, `band must be "3-5" or "6-8" (found "${t.band}")`);
  if (!inline && t.band === "3-5") checkElementaryWriting(w, t);
  if (!WRITE_FORMS.includes(t.form)) fail(w, `form must be one of ${WRITE_FORMS}`);
  if (!asList(t.sources).length && !inline) fail(w, "writing tasks need ≥1 source");
  if (asList(t.organizer).length < 3 || t.organizer.length > 5)
    fail(w, "organizer needs 3-5 slots");
  const e = t.expected || {};
  if (!(e.minWords > 0 && e.maxWords > e.minWords)) fail(w, "expected.minWords/maxWords invalid");
  if (!asList(t.revisionPrompts).length && !inline) fail(w, "revisionPrompts required");
  const frames = asList(t.stages?.guided?.frames).length;
  if (frames < 2 || frames > 6) fail(w, "guided frames: 2-6");
  if (asList(t.sources).length) {
    const src = strings(t.sources).join(" ").toLowerCase();
    for (const term of asList(t.sourceTerms))
      if (!src.includes(String(term).toLowerCase()))
        fail(w, `sourceTerm "${term}" not found in sources`);
  }
}
export function sweepWriting(data, exemplarIds = null) {
  for (const t of data?.tasks || []) {
    const w = `writing:${t.id}`;
    claimId(w, t.id);
    checkWritingTask(w, t);
    for (const id of t.teacher?.exemplarIds || [])
      if (exemplarIds && !exemplarIds.has(id)) fail(w, `teacher.exemplarIds: ${id} does not exist`);
  }
}
export function sweepExemplars(data, tasks) {
  const byTask = new Map();
  for (const x of data?.exemplars || []) {
    const w = `exemplar:${x.id}`;
    claimId(w, x.id);
    if (!tasks.has(x.taskId)) fail(w, `taskId ${x.taskId} not found`);
    if (!BANDS.includes(x.practiceBand))
      fail(w, `practiceBand must be one of ${BANDS} (practice anchors, not WIDA levels)`);
    if (!x.response || !x.whyThisBand || !x.nextStep)
      fail(w, "response/whyThisBand/nextStep required");
    for (const a of x.annotations || []) {
      if (!String(x.response).includes(a.quote))
        fail(w, `annotation quote not in response: "${a.quote}"`);
      if (!DIMS.includes(a.dimension) || !a.note) fail(w, "annotation needs dimension+note");
    }
    if (asList(x.annotations).length < 2) fail(w, "≥2 annotations");
    (byTask.get(x.taskId) || byTask.set(x.taskId, new Set()).get(x.taskId)).add(x.practiceBand);
  }
  for (const [id, mod] of tasks)
    if (data && !(byTask.get(id)?.size >= 3))
      fail(`exemplars:${id}`, `needs exemplars for all ${BANDS.length} bands (${mod})`);
}
export function sweepMission(file, m, speakIds, writeIds) {
  const w = `mission:${file}`;
  claimId(w, m.id);
  if (file !== `${m.id}.json`) fail(w, "file name must equal id");
  for (const k of ["title", "subtitle", "role", "icon", "theme", "contentArea", "summary"])
    if (!m[k]) fail(w, `${k} required`);
  if (!asList(m.keyUses).every((k) => KLU.includes(k)) || !asList(m.keyUses).length)
    fail(w, "keyUses invalid");
  if (!asList(m.standards).every((s) => STANDARDS.includes(s)) || !asList(m.standards).length)
    fail(w, "standards invalid");
  if (!m.briefing?.scene || !m.briefing?.goal) fail(w, "briefing.scene/goal required");
  checkVocab(w, m.vocab);
  const sources = m.sources || {};
  const kinds = new Set(Object.values(sources).map((s) => s.kind));
  if (kinds.size < 2) fail(w, "needs ≥2 source kinds");
  for (const [sid, s] of Object.entries(sources)) {
    if (s.kind === "audio" && !asList(s.turns).length) fail(w, `source ${sid}: audio needs turns`);
    if (s.kind === "passage" && !asList(s.text).length)
      fail(w, `source ${sid}: passage needs text`);
    if (s.kind === "chart" && !s.chart?.data?.length) fail(w, `source ${sid}: chart needs data`);
    if (s.kind === "table" && !s.table?.rows?.length) fail(w, `source ${sid}: table needs rows`);
  }
  const phases = asList(m.phases);
  if (phases.length < 4 || phases.length > 7) fail(w, "4-7 phases");
  const skills = new Set(phases.map((p) => p.skill));
  for (const s of ["Listening", "Reading", "Speaking", "Writing", "Decision"])
    if (!skills.has(s)) fail(w, `needs a ${s} phase`);
  const transfers = phases.filter((p) => p.transfer);
  if (transfers.length !== 1 || phases.at(-1) !== transfers[0])
    fail(w, "needs exactly one final transfer phase");
  if (
    transfers[0]?.skill !== "Writing" ||
    asList(transfers[0]?.tasks).length !== 1 ||
    transfers[0]?.tasks[0]?.task?.transfer !== true
  )
    fail(w, "final transfer phase needs one inline transfer writing task");
  let hasSynth = false;
  let hasInfer = false;
  let hasEvidence = false;
  const taskIds = new Set();
  for (const p of phases) {
    const pw = `${w}:${p.id}`;
    if (!SKILLS.includes(p.skill)) fail(pw, "skill");
    for (const u of asList(p.uses)) if (!sources[u]) fail(pw, `uses unknown source ${u}`);
    if (p.skill === "Decision") {
      const d = p.decision;
      if (!d?.q || asList(d.options).length < 2) fail(pw, "decision needs q + ≥2 options");
      for (const o of d?.options || []) {
        if (!o.consequence) fail(pw, `option ${o.id} needs consequence`);
        for (const u of asList(o.unlocks))
          if (!sources[u]) fail(pw, `option ${o.id} unlocks unknown source ${u}`);
      }
    }
    if (p.skill === "Reading" && !asList(p.tasks).some((t) => t.tier === "stretch"))
      fail(pw, "Reading phase needs a stretch question");
    for (const t of asList(p.tasks)) {
      const tw = `${pw}:${t.id}`;
      if (taskIds.has(t.id)) fail(tw, "duplicate task id");
      taskIds.add(t.id);
      if (t.kind === "question") {
        checkQuestion(tw, t);
        if (t.skill === "synthesis") hasSynth = true;
        if (t.skill === "inference") hasInfer = true;
      } else if (t.kind === "evidence") {
        hasEvidence = true;
        const from = sources[t.from];
        if (!from) fail(tw, `evidence from unknown source ${t.from}`);
        const body = strings(from).join(" ");
        checkEvidenceQuality(tw, t);
        if (asList(t.pool).length < 5) fail(tw, "evidence pool ≥5");
        if (asList(t.pool).filter((e) => e.supports).length < 2)
          fail(tw, "evidence pool needs ≥2 supporting statements");
        if (!t.pool?.some((e) => e.supports))
          fail(tw, "evidence pool needs a supporting statement");
        for (const e of t.pool || [])
          if (e.supports && !body.includes(e.text))
            fail(tw, `supporting evidence not verbatim in source: "${e.text}"`);
      } else if (t.kind === "speak") {
        if (t.taskRef ? !speakIds.has(t.taskRef) : !t.task)
          fail(tw, `speak needs taskRef (known) or inline task (${t.taskRef})`);
        if (t.task) {
          claimId(tw, t.task.id);
          checkSpeakingTask(`${tw}:task`, t.task, { inline: true });
        }
      } else if (t.kind === "write") {
        if (t.taskRef ? !writeIds.has(t.taskRef) : !t.task)
          fail(tw, `write needs taskRef (known) or inline task (${t.taskRef})`);
        if (t.task) {
          claimId(tw, t.task.id);
          checkWritingTask(`${tw}:task`, t.task, { inline: true });
        }
      } else fail(tw, `unknown task kind ${t.kind}`);
    }
  }
  // sources reachable only through a decision must be summarised, and no phase may depend on one
  const locked = new Set(
    phases.flatMap((p) => asList(p.decision?.options).flatMap((o) => asList(o.unlocks))),
  );
  for (const id of locked)
    if (!sources[id]?.summary)
      fail(w, `decision-unlocked source ${id} needs a summary (so skipping it is safe)`);
  for (const p of phases)
    for (const u of asList(p.uses))
      if (locked.has(u)) fail(`${w}:${p.id}`, `phase uses decision-locked source ${u}`);
  const boardIds = phases.flatMap((p) =>
    asList(p.decision?.options).flatMap((o) => asList(o.board).map((b) => b.id)),
  );
  if (new Set(boardIds).size !== boardIds.length) fail(w, "duplicate board ids");
  const qs = phases.flatMap((p) => asList(p.tasks)).filter((t) => t.kind === "question");
  const positions = new Set(qs.map((q) => q.options.findIndex((o) => o.id === q.answer)));
  if (qs.length >= 4 && positions.size < 3) fail(w, "correct-answer position barely varies");
  const longest = qs.filter((q) => {
    const c = q.options.find((o) => o.id === q.answer);
    return c && c.text.length >= Math.max(...q.options.map((o) => o.text.length));
  }).length;
  if (qs.length >= 4 && longest / qs.length > 0.5)
    fail(w, `correct option is the longest in ${longest}/${qs.length} questions`);
  const used = new Set(qs.flatMap((q) => q.options.map((o) => o.distractor).filter(Boolean)));
  for (const d of DISTRACTORS) if (!used.has(d)) fail(w, `no question uses distractor type "${d}"`);
  for (const [sid, src] of Object.entries(sources))
    if (src.kind === "passage" && !locked.has(sid)) {
      const n = strings(src.text).join(" ").split(/\s+/).length;
      if (n < 90 || n > 260) fail(w, `passage ${sid} is ${n} words (want ~120-220)`);
    }
  // choices must reach the later tasks: every inline speak/write task covers every flag the decisions can set
  const flags = phases
    .flatMap((p) => asList(p.decision?.options).map((o) => o.flag))
    .filter(Boolean);
  for (const p of phases)
    for (const t of asList(p.tasks))
      if (t.task)
        for (const f of flags) {
          const e = t.task.byFlag?.[f];
          if (!e?.promptAdd || !e?.revisionPrompt)
            fail(`${w}:${t.id}`, `byFlag.${f} needs promptAdd and revisionPrompt`);
          else if (e.promptAdd.split(/\s+/).length > 30)
            fail(`${w}:${t.id}`, `byFlag.${f}.promptAdd is over 30 words`);
          for (const slot of Object.keys(e?.plannerHint || {}))
            if (
              ![...asList(t.task.planner), ...asList(t.task.organizer)].some((x) => x.id === slot)
            )
              fail(`${w}:${t.id}`, `byFlag.${f}.plannerHint slot "${slot}" does not exist`);
        }
  for (const t of asList(phases.flatMap((x) => asList(x.tasks))))
    for (const f of Object.keys(t.task?.byFlag || {}))
      if (!flags.includes(f)) fail(`${w}:${t.id}`, `byFlag.${f} is not a flag any decision sets`);
  if (!hasSynth) fail(w, "needs a synthesis question");
  if (!hasInfer) fail(w, "needs an inference question");
  if (!hasEvidence) fail(w, "needs an evidence task");
}

// ── self-tests ────────────────────────────────────────────────────────────────
function selfTest() {
  const before = failures.length;
  const mark = () => failures.length;
  let n = mark();
  checkQuestion("t", {
    q: "Why does the team compare the two soil covers?",
    options: [
      { id: "a", text: "To see which cover keeps more water" },
      { id: "b", text: "To choose who carries the watering cans", distractor: "true-not-asked" },
      { id: "c", text: "To prove every plant needs the same water", distractor: "overgeneralized" },
    ],
    answer: "a",
    explain:
      "Mateo says the team tested two covers and should compare the numbers before choosing one.",
  });
  if (failures.length !== n)
    throw new Error(`self-test: good question flagged: ${failures.slice(n)}`);
  n = mark();
  checkQuestion("t", {
    options: [
      { id: "a", text: "x", distractor: "opposite" },
      { id: "b", text: "y" },
      { id: "c", text: "z" },
    ],
    answer: "q",
    explain: "",
  });
  if (failures.length - n < 3) throw new Error("self-test: bad question not caught");
  for (const [label, bad] of [
    [
      "duplicate options",
      {
        options: [
          { id: "a", text: "Water is lost" },
          { id: "b", text: "water is lost!", distractor: "opposite" },
          { id: "c", text: "Plants grow", distractor: "partial" },
        ],
      },
    ],
    [
      "all of the above",
      {
        options: [
          { id: "a", text: "Water is lost" },
          { id: "b", text: "All of the above", distractor: "opposite" },
          { id: "c", text: "Plants grow", distractor: "partial" },
        ],
      },
    ],
    ["bare explanation", { explain: "Correct!" }],
    ["short stem", { q: "Why?" }],
  ]) {
    n = mark();
    checkQuestion("t", {
      q: "Why does the team compare the two soil covers?",
      options: [
        { id: "a", text: "To see which cover keeps more water" },
        { id: "b", text: "To choose who carries the watering cans", distractor: "true-not-asked" },
        {
          id: "c",
          text: "To prove every plant needs the same water",
          distractor: "overgeneralized",
        },
      ],
      answer: "a",
      explain:
        "Mateo says the team tested two covers and should compare the numbers before choosing one.",
      ...bad,
    });
    if (failures.length === n) throw new Error(`self-test: ${label} not caught`);
  }
  n = mark();
  checkEvidenceQuality("t", {
    q: "Which details support the plan?",
    boardLabel: "Notes",
    pool: [
      { id: "a", text: "x", supports: true },
      { id: "b", text: "x", supports: true },
    ],
  });
  if (failures.length - n < 3) throw new Error("self-test: bad evidence task not caught");
  failures.length = before;
  if (!scoreClaims({ a: "You are at Level 4 now" }).length)
    throw new Error("self-test: score claim not caught");
  if (scoreClaims({ a: "This is practice, not a WIDA score." }).length)
    throw new Error("self-test: false positive on disclaimer");
}

async function main() {
  selfTest();
  checkMissionCoverage();
  checkElementaryCoverage(speaking?.tasks, writing?.tasks);
  const exemplarIds = new Set((exemplars?.exemplars || []).map((x) => x.id));
  sweepSpeaking(speaking, exemplars ? exemplarIds : null);
  sweepWriting(writing, exemplars ? exemplarIds : null);
  const tasks = new Map([
    ...(speaking?.tasks || []).map((t) => [t.id, "speaking"]),
    ...(writing?.tasks || []).map((t) => [t.id, "writing"]),
  ]);
  sweepExemplars(exemplars, tasks);
  const speakIds = new Set((speaking?.tasks || []).map((t) => t.id));
  const writeIds = new Set((writing?.tasks || []).map((t) => t.id));
  for (const [file, m] of missions) sweepMission(file, m, speakIds, writeIds);

  if (patterns) {
    const { DETECTORS, detect } = await import(
      join(REPO_ROOT, "access-practice-lab/src/lang/errors.js")
    );
    const ids = new Set(DETECTORS.map((d) => d.id));
    for (const [pid, p] of Object.entries(patterns.patterns || {})) {
      const w = `pattern:${pid}`;
      if (!ids.has(pid)) fail(w, "no detector with this id in src/lang/errors.js");
      if (
        !p.lesson?.rule ||
        !p.lesson?.wrong ||
        !p.lesson?.right ||
        !p.lesson?.why ||
        !p.lesson?.check
      )
        fail(w, "lesson rule/wrong/right/why/check required");
      if (p.lesson?.wrong && !detect(p.lesson.wrong).some((f) => f.id === pid))
        fail(w, `lesson.wrong not flagged: "${p.lesson.wrong}"`);
      if (
        p.lesson?.right &&
        detect(p.lesson.right).some((h) => h.id === pid || h.confidence === "high")
      )
        fail(w, `lesson.right is flagged: "${p.lesson.right}"`);
      if (asList(p.practice).length < 6) fail(w, "≥6 practice items");
      if (asList(p.transfer).length < 2) fail(w, "≥2 transfer prompts");
      for (const q of p.practice || []) {
        if (!detect(q.broken).some((f) => f.id === pid))
          fail(w, `${q.id}: broken not flagged by ${pid}: "${q.broken}"`);
        for (const f of q.fixed || []) {
          const hit = detect(f).filter((h) => h.id === pid || h.confidence === "high");
          if (hit.length)
            fail(w, `${q.id}: fixed answer still flagged (${hit.map((h) => h.id)}): "${f}"`);
        }
        if (!asList(q.fixed).length) fail(w, `${q.id}: needs fixed[]`);
      }
      for (const t of p.transfer || [])
        if (!t.context || !t.prompt || !(t.minWords > 0))
          fail(w, `${t.id}: transfer needs context/prompt/minWords`);
    }
    for (const id of ids)
      if (!patterns.patterns?.[id]) fail("patterns", `detector "${id}" has no lesson content`);
  }

  for (const [, data] of [
    ["s", speaking],
    ["w", writing],
    ["e", exemplars],
    ["p", patterns],
    ...missions,
  ]) {
    const claims = scoreClaims(data);
    if (claims.length) fail("score-claim", claims[0]);
  }

  if (failures.length) {
    console.error(`validate:access-studio — FAIL (${failures.length})`);
    for (const f of failures.slice(0, 80)) console.error(`  ✗ ${f}`);
    if (failures.length > 80) console.error(`  … ${failures.length - 80} more`);
    process.exit(1);
  }
  console.log(
    `validate:access-studio — PASS · ${speaking?.tasks?.length || 0} speaking · ${writing?.tasks?.length || 0} writing · ${exemplars?.exemplars?.length || 0} exemplars · ${missions.length} missions · ${Object.keys(patterns?.patterns || {}).length} patterns`,
  );
}

if (isMain) await main();
