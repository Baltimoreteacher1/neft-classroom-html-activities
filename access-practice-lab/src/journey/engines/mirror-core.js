// Growth Mirror core: option building, the ONE target, graduated help. Pure; no DOM, no storage.
import { MISSIONS } from "../curriculum.js";
import { COPY, FALLBACK_FRAMES, FRAME_CUES, HELP_LEDGER_KEY } from "./mirror-copy.js";

export const HELP_KINDS = ["question", "frame", "model"];

export const pair = (p) => ({ en: p[0], es: p[1] });
export const copyOf = (id) => COPY[id] || { label: [id, id], why: ["", ""], ask: ["", ""] };
export const clipText = (t, n = 90) =>
  String(t).length > n
    ? `${String(t)
        .slice(0, n - 1)
        .trimEnd()}…`
    : String(t);

/** Options for analyzeResponse built from a mission task (communicate or show). Same options for every attempt of that task. */
export function analysisOpts(task = {}, keyUse = "Explain", stage = "supported") {
  const bank = (task.evidenceBank || [])
    .map((e) => (typeof e === "string" ? e : e?.text))
    .filter(Boolean);
  return {
    keyUse,
    stage,
    modality: task.mode === "speak" ? "speaking" : "writing",
    sourceTerms: task.sourceTerms || [],
    sourceText: bank,
    wordBank: task.topicTerms || [],
    expected: task.minWords ? { minWords: task.minWords, maxWords: task.minWords * 3 } : undefined,
  };
}

/** The few task fields an analysis needs, kept on a stored record so a later recount uses the same options. */
export const taskOpts = (task) =>
  task
    ? {
        mode: task.mode || "write",
        minWords: task.minWords || 0,
        topicTerms: [...(task.topicTerms || [])],
        sourceTerms: [...(task.sourceTerms || [])],
        evidence: [...(task.evidenceBank || [])].map((e) => (typeof e === "string" ? e : e?.text)).filter(Boolean),
      }
    : null;

export const kluOf = (missionId, opts = {}) => opts.keyUse || MISSIONS[missionId]?.klu || "Explain";

// ── Target ───────────────────────────────────────────────────────────────────────

/**
 * ONE target: the first required move the response does not make (moves are listed in priority order for the
 * Key Language Use). When every move is present, link the ideas (cohesion) or choose a more exact word (precision).
 * With a `pack` ({ improve: { models }, frames }) the result also carries `levels` (the graduated help).
 */
export function pickTarget(analysis, keyUse, band = "6-8", pack = null) {
  const moves = analysis?.purpose?.moves || [];
  const missingMoves = moves.filter((m) => m.required && !m.present);
  let id;
  let kind = "move";
  if (missingMoves.length) id = missingMoves[0].id;
  else {
    const weakLinks =
      (analysis?.cohesion?.variety ?? 0) <= 1 || (analysis?.cohesion?.unlinked || []).length > 0;
    const vague = (analysis?.word?.vague || []).length > 0;
    kind = weakLinks || !vague ? "cohesion" : "precision";
    id = kind;
  }
  const move = moves.find((m) => m.id === id);
  const c = copyOf(id);
  const target = {
    id,
    kind,
    band,
    keyUse: analysis?.purpose?.keyUse || keyUse,
    label: c.label[0],
    labelEs: c.label[1],
    act: move?.act || c.label[0].toLowerCase(),
    ask: move?.ask || c.ask[0],
    askEs: c.ask[1],
    why: pair(c.why),
    missing: missingMoves.map((m) => m.id),
  };
  if (pack) target.levels = helpLevels(target, pack.improve?.models, pack.frames);
  return target;
}

const hasWord = (text, cue) =>
  new RegExp(`(?:^|[^a-z])${cue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[^a-z]|$)`, "i").test(
    text,
  );

/** The mission's own frame that fits the target, else a generic blank frame. Null for none. */
function frameFor(target, frames) {
  const own = [...(frames?.A || []), ...(frames?.B || []), ...(frames?.C || [])];
  const cues = FRAME_CUES[target.id] || [];
  const hit = own.find((f) => cues.some((c) => hasWord(f, c)));
  return hit || FALLBACK_FRAMES[target.id] || null;
}

/**
 * Graduated help for one target. Level 1 is the move's question, level 2 a sentence frame, level 3 the pack's model
 * sentence (skipped when the pack has none for this target). Opening any level is supported practice.
 */
export function helpLevels(target, models, frames) {
  const out = [{ level: 1, kind: "question", text: target.ask, textEs: target.askEs }];
  const frame = frameFor(target, frames);
  if (frame) out.push({ level: 2, kind: "frame", text: frame });
  const model = models?.[target.id];
  if (typeof model === "string" && model.trim()) out.push({ level: 3, kind: "model", text: model });
  return out;
}

/** Ledger `supports` for the help items opened (ids: question | frame | model). */
export const supportsFromHelps = (opened = []) => {
  const set = new Set(
    Array.isArray(opened) ? opened : Object.keys(opened).filter((k) => opened[k]),
  );
  return Object.fromEntries(
    HELP_KINDS.filter((k) => set.has(k)).map((k) => [HELP_LEDGER_KEY[k], true]),
  );
};

/** The spans of the learner's first response worth pointing at for this target (precision and cohesion only). */
export function targetSpans(analysis, target) {
  if (target?.kind === "precision")
    return (analysis.word.vague || []).map((v) => ({ start: v.start, end: v.end, text: v.text }));
  if (target?.kind === "cohesion")
    return (analysis.cohesion.unlinked || []).map((i) => analysis.sentenceList[i]).filter(Boolean);
  return [];
}


/** Counts from one analysis's ledger features: what is on the page, not how well. */
export function featureCounts(analysis) {
  const m = analysis.ledger;
  const made = Object.values(m.moves || {});
  return {
    words: m.words,
    sentences: m.sents,
    linkKinds: m.link,
    cites: m.cites,
    complex: m.complex,
    academic: m.academic,
    movesMade: made.reduce((x, y) => x + y, 0),
    movesRequired: made.length,
    moves: { ...m.moves },
  };
}
