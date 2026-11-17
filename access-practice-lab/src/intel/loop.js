// The feedback-to-learning loop (Language Intelligence Engine, docs/part2-integration-map.md):
//   response → feedback → practice → revision → transfer → review
// One record per piece of work, each stage saved apart so a supported revision is never read as independent work.
// Every Part 2 surface (Speaking Studio, Writing Studio, Book Studio, ACCESS learning mode, simulations, pathways,
// the Time Machine) writes through this module, so Passport and the teacher see one shape.
//
// Storage: accessPracticeLab:v1:intel = { v: 1, loops: { [id]: Loop } } on this device (it travels in the Passport
// export like every accessPracticeLab: key). A stage that is written also appends a ledger entry (numbers and ids
// only, never text), so the Growth Map and class summary see it without a second store.
//
// Loop = { id, src, band, objective, task: { id, title, prompt, keyUse, domain }, createdAt, updatedAt,
//          stages: {
//            response: { t, text, source: "typed"|"transcript", uncertain, supports, audioId },
//            feedback: { t, feedback, feedbackSource: "local-rule"|"ai" },
//            practice: { t, kind, done },
//            revision: { t, text, supports },
//            transfer: { t, prompt, text, supports, independent },
//            review:   { t, shared, workId, teacher: { comment, decision, at } | null } } }
// Earlier work is never overwritten: a second response to the same task is a NEW loop (`attempt` counts up).
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { safeJson, storage } from "../util.js";

export const INTEL_KEY = "accessPracticeLab:v1:intel";
export const STAGES = Object.freeze([
  "response",
  "feedback",
  "practice",
  "revision",
  "transfer",
  "review",
]);
export const MAX_LOOPS = 120;
export const MAX_TEXT = 6000;
/** Stages that hold the learner's own language (the ones the Time Machine may compare). */
export const TEXT_STAGES = Object.freeze(["response", "revision", "transfer"]);

const uid = () => `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const clip = (v) => String(v ?? "").slice(0, MAX_TEXT);
const usedAny = (supports) => Object.values(supports || {}).some(Boolean);

export function loadIntel(read = (k) => storage.get(k)) {
  const v = safeJson(read(INTEL_KEY), null);
  return v && typeof v === "object" && v.loops && typeof v.loops === "object"
    ? v
    : { v: 1, loops: {} };
}

export function saveIntel(state, write = (k, v) => storage.set(k, v)) {
  const ids = Object.keys(state.loops);
  if (ids.length > MAX_LOOPS) {
    // The oldest loops go first, but one that a teacher has reviewed is kept as long as possible.
    const order = ids.sort((a, b) =>
      String(state.loops[a].updatedAt).localeCompare(String(state.loops[b].updatedAt)),
    );
    const droppable = order.filter((id) => !state.loops[id].stages?.review?.teacher);
    for (const id of [...droppable, ...order].slice(0, ids.length - MAX_LOOPS))
      delete state.loops[id];
  }
  return write(INTEL_KEY, JSON.stringify(state));
}

/**
 * Begin a loop for one piece of work. `task.id` should be stable for the prompt, so later attempts can be compared.
 * @param {{src:string, band?:string, objective?:string, task:{id:string,title?:string,prompt?:string,keyUse?:string,domain?:string}}} init
 */
export function startLoop(state, init, now = new Date().toISOString()) {
  const task = init.task || {};
  const attempt =
    Object.values(state.loops).filter((l) => l.src === init.src && l.task?.id === task.id).length +
    1;
  const loop = {
    id: uid(),
    src: String(init.src || ""),
    band: init.band === "3-5" ? "3-5" : init.band || "6-8",
    objective: init.objective || "",
    attempt,
    task: {
      id: String(task.id || ""),
      title: String(task.title || ""),
      prompt: clip(task.prompt).slice(0, 600),
      keyUse: task.keyUse || "Explain",
      domain: task.domain || "Writing",
    },
    createdAt: now,
    updatedAt: now,
    stages: {},
  };
  state.loops[loop.id] = loop;
  return loop;
}

const LEDGER_KIND = { response: "first", revision: "revision", transfer: "transfer" };

/**
 * Save one stage. Text stages also become a ledger entry: a response is a first attempt, a revision is a revision
 * (supported by feedback by definition), a transfer is independent only when no support was opened.
 * `metrics` are numbers for the ledger (for example analyzeResponse(...).ledger); never text.
 */
export function recordStage(
  state,
  loopId,
  stage,
  data = {},
  { metrics = {}, now = new Date().toISOString(), ledger = true } = {},
) {
  const loop = state.loops[loopId];
  if (!loop || !STAGES.includes(stage)) return null;
  // A response or transfer that already exists is kept as first written; a new try is a new loop.
  if ((stage === "response" || stage === "transfer") && loop.stages[stage]?.text)
    return loop.stages[stage];
  const entry = { ...data, t: now };
  if (TEXT_STAGES.includes(stage)) {
    entry.text = clip(data.text);
    entry.supports = data.supports || {};
    if (stage === "transfer") entry.independent = !usedAny(entry.supports);
  }
  loop.stages[stage] = entry;
  loop.updatedAt = now;
  if (ledger && LEDGER_KIND[stage] && entry.text) {
    const book = loadLedger();
    appendEntry(book, {
      src: `intel:${loop.src}`,
      task: loop.task.id,
      band: loop.band,
      domain: loop.task.domain,
      use: loop.task.keyUse,
      stage: stage === "revision" || usedAny(entry.supports) ? "supported" : "independent",
      kind: LEDGER_KIND[stage],
      attempt: loop.id,
      supports: stage === "revision" ? { ...entry.supports, coach: true } : entry.supports,
      feedbackSource: loop.stages.feedback?.feedbackSource || "local-rule",
      m: { ...metrics, loop: 1 },
    });
    saveLedger(book);
  }
  return entry;
}

export const getLoop = (state, id) => state.loops[id] || null;

/** Loops newest first, optionally narrowed by source, objective or task id. */
export function listLoops(state, { src, objective, taskId } = {}) {
  return Object.values(state.loops)
    .filter(
      (l) =>
        (!src || l.src === src) &&
        (!objective || l.objective === objective) &&
        (!taskId || l.task.id === taskId),
    )
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

/** Which stage comes next for a loop, or "done". Practice is optional and is skipped once a revision exists. */
export function nextStage(loop) {
  const s = loop?.stages || {};
  if (!s.response) return "response";
  if (!s.feedback) return "feedback";
  if (!s.revision) return s.practice ? "revision" : "practice";
  if (!s.transfer) return "transfer";
  if (!s.review) return "review";
  return "done";
}

/** Plain-text digest a learner can share with a teacher (class review queue): each stage labelled, nothing merged. */
export function loopDigest(loop) {
  const s = loop.stages;
  const fb = s.feedback?.feedback;
  const lines = [
    `Task: ${loop.task.title || loop.task.id} (${loop.task.keyUse}, ${loop.task.domain})`,
    s.response &&
      `FIRST RESPONSE${s.response.source === "transcript" ? " (speech turned into words; may contain recognition errors)" : ""}${usedAny(s.response.supports) ? " [with supports]" : " [on my own]"}:\n${s.response.text}`,
    fb &&
      `FEEDBACK SHOWN: Strength: ${fb.strength?.text?.[0] || ""} Next step: ${fb.nextStep?.text?.[0] || ""}`,
    s.revision && `REVISION (after feedback, counted as supported):\n${s.revision.text}`,
    s.transfer &&
      `NEW TASK ${s.transfer.independent ? "[on my own]" : "[with supports]"}: ${s.transfer.prompt || ""}\n${s.transfer.text}`,
  ];
  return lines.filter(Boolean).join("\n\n").slice(0, 3900);
}
