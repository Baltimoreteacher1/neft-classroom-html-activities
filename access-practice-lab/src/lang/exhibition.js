// Language World engine: pure functions over the saved Science Exhibition state. No DOM, no storage —
// the view loads and saves; tools/access-living-studio.test.mjs drives these directly.
//
// State (one key, `accessPracticeLab:v1:exhibition`, so Passport export/import carries it unchanged):
//   { v: 1, bands: { "6-8": BandState, "3-5": BandState } }
//   BandState = { support: "A"|"B"|"C", tasks: { listen, read, speak, write } }
// A task is "supported" when it was done at Starting/Growing support or any help was opened; otherwise
// "independent". Nothing here is a score: feedback lists what the writing shows and one next move.

import { STEP_ORDER } from "../content/exhibition.js";

export const SUPPORT_LEVELS = ["A", "B", "C"];
export const emptyState = () => ({ v: 1, bands: {} });

export function parseState(raw) {
  try {
    const data = JSON.parse(raw || "");
    if (data && data.v === 1 && data.bands && typeof data.bands === "object") return data;
  } catch {}
  return emptyState();
}

export function bandState(state, band) {
  const b = state.bands[band] || {};
  return {
    support: SUPPORT_LEVELS.includes(b.support) ? b.support : "A",
    tasks: { listen: {}, read: {}, speak: {}, write: {}, ...(b.tasks || {}) },
  };
}

/** Returns a new state with one band's task merged (never drops fields it was not given). */
export function updateTask(state, band, step, patch) {
  const current = bandState(state, band);
  return {
    ...state,
    bands: {
      ...state.bands,
      [band]: {
        ...current,
        tasks: { ...current.tasks, [step]: { ...current.tasks[step], ...patch } },
      },
    },
  };
}

export function setSupport(state, band, level) {
  if (!SUPPORT_LEVELS.includes(level)) return state;
  const current = bandState(state, band);
  return { ...state, bands: { ...state.bands, [band]: { ...current, support: level } } };
}

/** Record that a help item was opened on a step; supported work is never relabelled independent. */
export function noteHelp(state, band, step, item) {
  const task = bandState(state, band).tasks[step];
  const help = [...new Set([...(task.help || []), item])];
  return updateTask(state, band, step, { help });
}

/** Step status from saved work: "new" | "started" | "done". */
export function stepStatus(scenario, task, step) {
  const t = task || {};
  const spec = scenario.tasks[step];
  if (step === "listen" || step === "read") {
    const ids = spec.questions.map((q) => q.id);
    const right = ids.filter((id) => isRight(spec, id, t.answers?.[id])).length;
    if (right === ids.length) return "done";
    return Object.keys(t.answers || {}).length ? "started" : "new";
  }
  if (step === "speak") {
    const checks = Object.values(t.checks || {}).filter(Boolean).length;
    if (t.said && checks >= spec.checks.length - 1) return "done";
    return t.said || checks || Object.values(t.plan || {}).some(Boolean) ? "started" : "new";
  }
  const attempts = t.attempts || [];
  if (attempts.some((a) => a.drafts?.length && a.checked)) return "done";
  return attempts.some((a) => a.drafts?.some((d) => d.text?.trim())) ? "started" : "new";
}

export function isRight(spec, qid, picked) {
  const q = spec.questions.find((x) => x.id === qid);
  if (!q || picked == null || picked === "") return false;
  if (q.kind === "evidence") return Number(picked) === q.answer;
  return Boolean(q.options.find((o) => o.id === picked)?.ok);
}

/** Supported unless done at Expanding with no help opened and (for comprehension) right on the first try. */
export function workKind(task, supportAtWork) {
  if ((task.help || []).length || supportAtWork !== "C") return "supported";
  return "independent";
}

export function progress(scenario, band) {
  const steps = STEP_ORDER.map((step) => ({
    step,
    status: stepStatus(scenario, band.tasks[step], step),
  }));
  const done = steps.filter((s) => s.status === "done").length;
  const next = steps.find((s) => s.status !== "done")?.step || null;
  return { steps, done, next };
}

// ── writing feedback: explainable rules over the learner's own text ──────────

const sentencesOf = (text) =>
  String(text || "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => /[a-z]/i.test(s));
const wordsOf = (text) => String(text || "").match(/[A-Za-z0-9'$]+/g) || [];

/** Longest run of ≥ 8 words copied verbatim from the source sentences (a whole clause, not a shared noun phrase), or "". */
export function copiedRun(text, sources) {
  const norm = (s) => wordsOf(s.toLowerCase()).join(" ");
  const words = wordsOf(String(text).toLowerCase());
  const pool = sources.map(norm).join(" | ");
  let best = "";
  for (let i = 0; i < words.length; i++)
    for (let n = 8; i + n <= words.length; n++) {
      const run = words.slice(i, i + n).join(" ");
      if (!pool.includes(run)) break;
      if (run.length > best.length) best = run;
    }
  return best;
}

/**
 * What a draft shows, quoted from the draft, plus ONE next move (the first rule not yet shown).
 * `sources` are the scenario sentences (copy check). Returns counts, never a grade.
 */
export function evaluateWriting(text, spec, sources = []) {
  const sentences = sentencesOf(text);
  const shows = [];
  const missing = [];
  for (const rule of spec.feedback) {
    const re = new RegExp(rule.test, "i");
    const hit = sentences.find((s) => re.test(s));
    if (hit) shows.push({ id: rule.id, label: rule.label, quote: hit });
    else missing.push({ id: rule.id, label: rule.label, next: rule.next });
  }
  const copied = copiedRun(text, sources);
  const short = sentences.length < spec.minSentences;
  let next = missing[0] || null;
  if (!next && short)
    next = {
      id: "length",
      label: "Develops the idea",
      next: `Add another sentence: the task asks for at least ${spec.minSentences}.`,
    };
  if (!next && copied)
    next = { id: "own-words", label: "Own words", next: "Put the copied part in your own words." };
  return {
    shows,
    next,
    missing: missing.map((m) => m.id),
    words: wordsOf(text).length,
    sentences: sentences.length,
    copied,
  };
}

/** Which rules a revision added or lost compared with the earlier draft. */
export function compareDrafts(before, after) {
  const was = new Set(before.shows.map((s) => s.id));
  const now = new Set(after.shows.map((s) => s.id));
  return {
    added: [...now].filter((id) => !was.has(id)),
    lost: [...was].filter((id) => !now.has(id)),
  };
}

/**
 * The one suggested next step for the Passport and home, with the evidence that triggered it.
 * Explainable by construction: it only reads which steps are done and how.
 */
export function suggestion(scenario, band) {
  const p = progress(scenario, band);
  if (p.next) return { step: p.next, reason: p.done ? "next-step" : "start" };
  const write = band.tasks.write || {};
  const independent = (write.attempts || []).some((a) => a.kind === "independent" && a.checked);
  if (!independent) return { step: "write", reason: "transfer" };
  return null;
}
