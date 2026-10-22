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
import { join } from "node:path";
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
const failures = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);

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
  if (
    /\b(?:always|never|only|none of the above|all of the above)\b/i.test(
      (t.options || [])
        .filter((o) => o.id !== t.answer)
        .map((o) => o.text)
        .join(" "),
    ) === false
  ) {
    /* absolutes in distractors are allowed but not required */
  }
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
    options: [
      { id: "a", text: "x" },
      { id: "b", text: "y", distractor: "opposite" },
      { id: "c", text: "z", distractor: "partial" },
    ],
    answer: "a",
    explain: "e",
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
  failures.length = before;
  if (!scoreClaims({ a: "You are at Level 4 now" }).length)
    throw new Error("self-test: score claim not caught");
  if (scoreClaims({ a: "This is practice, not a WIDA score." }).length)
    throw new Error("self-test: false positive on disclaimer");
}

selfTest();
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
