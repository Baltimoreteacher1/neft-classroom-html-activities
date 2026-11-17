// Connected Learning Engine — pathway progress (key accessPracticeLab:v1:pathways; it travels in the Passport export
// like every accessPracticeLab: key).
//
// What this store holds is CONTEXT, not completion: which pathways the learner started and when, the stage list (so
// the banner on another page can say "Step 3 of 6"), the helps opened at a stage, the family conversation, the book
// started from the hand-off, and when the evidence was shared. Whether a stage is done is always DERIVED from the
// feature that did the work, and only from work done after the pathway was started:
//   record  ACCESS activity result (src/store.js records)         ledger  a ledger entry (Speaking/Writing Studio, labs)
//   loop    a feedback loop with this objective (src/intel/loop.js) sim     the simulation save, mission finished
//   book    a Book Studio book created from this pathway and saved again by the learner in the editor
//   talk    the family conversation card (the family's own tick, with the prompts they used)
// Opening a link never completes anything. Supported and independent work are kept apart in every summary.
import { loadLedger } from "../lang/ledger.js";
import { INTEL_KEY } from "../intel/loop.js";
import { PREFIX, needsReview } from "../store.js";
import { safeJson, storage } from "../util.js";

export const PATHWAYS_KEY = `${PREFIX}:pathways`;
export const SIM_KEY = `${PREFIX}:sim`;
export const MAX_RUNS = 24;
const QUOTE = 220;

export function loadRuns(read = (k) => storage.get(k)) {
  const v = safeJson(read(PATHWAYS_KEY), null);
  return v && typeof v === "object" && v.runs && typeof v.runs === "object"
    ? { v: 1, active: "", ...v }
    : { v: 1, runs: {}, active: "" };
}
export function saveRuns(state, write = (k, v) => storage.set(k, v)) {
  const keys = Object.keys(state.runs);
  if (keys.length > MAX_RUNS)
    for (const k of keys
      .sort((a, b) => String(state.runs[a].openedAt).localeCompare(String(state.runs[b].openedAt)))
      .slice(0, keys.length - MAX_RUNS))
      delete state.runs[k];
  return write(PATHWAYS_KEY, JSON.stringify(state));
}

/**
 * Begin (or reopen) a pathway on this device. The start time is written once and never moved, so "after the pathway
 * was started" always means the same thing. `back` is the route that reopens this pathway.
 */
export function startRun(
  state,
  pathway,
  { back, band = "6-8", now = new Date().toISOString(), sim = {} } = {},
) {
  const run = state.runs[pathway.runKey] || {
    key: pathway.runKey,
    startedAt: now,
    meta: {},
    // The simulation keeps no clock, so what was already finished when the pathway began is noted here.
    base: { sim: Object.fromEntries(Object.entries(sim || {}).filter(([, v]) => simFinished(v)).map(([k]) => [k, true])) },
  };
  Object.assign(run, {
    id: pathway.id,
    objective: pathway.objective,
    title: pathway.title,
    back: back || run.back || "",
    band,
    openedAt: now,
    stages: pathway.stages.map((s) => ({
      id: s.id,
      kind: s.kind,
      title: s.title,
      optional: s.optional,
    })),
  });
  run.meta ||= {};
  state.runs[pathway.runKey] = run;
  state.active = pathway.runKey;
  return run;
}

const metaOf = (run, stageId) => ((run.meta ||= {})[stageId] ||= {});
/** A help was opened at a stage (kept and shown; it makes that stage's work "supported"). */
export function noteSupport(state, runKey, stageId, supportId) {
  const run = state.runs[runKey];
  if (!run) return null;
  const m = metaOf(run, stageId);
  m.supports = { ...(m.supports || {}), [supportId]: true };
  return m;
}
/** The family conversation happened: which prompts were used, and when. */
export function recordTalk(state, runKey, stageId, prompts, now = new Date().toISOString()) {
  const run = state.runs[runKey];
  const used = [...new Set((prompts || []).map(Number).filter((n) => n >= 0 && n < 3))];
  if (!run || !used.length) return null;
  metaOf(run, stageId).talk = { t: now, prompts: used };
  return run.meta[stageId].talk;
}
export function noteBook(state, runKey, stageId, bookId) {
  const run = state.runs[runKey];
  if (run) metaOf(run, stageId).bookId = bookId;
}
export function noteLoop(state, runKey, stageId, loopId) {
  const run = state.runs[runKey];
  if (run) metaOf(run, stageId).loopId = loopId;
}

// ── the evidence snapshot ────────────────────────────────────────────────────────────────────────────────────
/**
 * Everything completion is derived from, read once. Books come from IndexedDB, so the caller passes them in
 * (the view lists them; tests seed them).
 * @returns {{ ledger:object[], loops:object[], record:(band,domain,level)=>object, sim:object, books:object[] }}
 */
export function collectSnapshot({ read = (k) => storage.get(k), books = [] } = {}) {
  const intel = safeJson(read(INTEL_KEY), null);
  return {
    ledger: loadLedger(read).entries,
    loops: Object.values(intel?.loops || {}),
    record: (band, domain, level) => recordFrom(read, band, domain, level),
    sim: safeJson(read(SIM_KEY), {}) || {},
    books,
  };
}
function recordFrom(read, band, domain, level) {
  const key =
    band === "6-8" || !band
      ? `${PREFIX}:${domain}:${level}`
      : `${PREFIX}:g${band}:${domain}:${level}`;
  const r = safeJson(read(key), {}) || {};
  return { complete: Array.isArray(r.complete) ? r.complete : [], results: r.results || {} };
}

/** Book Studio books for the snapshot (empty when IndexedDB is unavailable). */
export async function listPathwayBooks() {
  try {
    const db = await import("../book/db.js");
    if (!db.available()) return [];
    return (await db.listBooks())
      .filter((b) => b.source?.kind === "pathway")
      .map((b) => ({
        id: b.id,
        title: b.title,
        source: b.source,
        rev: b.rev || 0,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        words: bookWords(b),
      }));
  } catch {
    return [];
  }
}
const bookWords = (b) =>
  (b.pages || [])
    .flatMap((p) => p.elements || [])
    .map((e) => String(e.html || "").replace(/<[^>]+>/g, " "))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

/** A simulation save counts only when the mission was finished (an outcome reached), not when it was opened. */
export function simFinished(save) {
  if (!save || typeof save !== "object" || !(save.outcome || save.complete === true)) return null;
  return { t: "", outcome: typeof save.outcome === "string" ? save.outcome : "" };
}

/** True when the stage's work exists but was done BEFORE the pathway started (shown as a note; it does not count). */
export function priorWork(stage, run, snap) {
  if (!run) return false;
  const { type, match } = stage.evidence;
  if (type === "sim") return Boolean(run.base?.sim?.[match.mission]);
  if (type !== "record") return false;
  const rec = snap.record(match.band, match.domain, match.level);
  const res = rec.results?.[match.id];
  return Boolean(res?.date && rec.complete?.includes(match.id) && String(res.date) < String(run.startedAt));
}

const after = (t, start) => !t || String(t) >= String(start);
const supportNames = (supports) =>
  Object.entries(supports || {})
    .filter(([, v]) => v)
    .map(([k]) => k);
const loopText = (loop) =>
  loop?.stages?.transfer?.text ||
  loop?.stages?.revision?.text ||
  loop?.stages?.response?.text ||
  "";
const quoteOf = (text) => {
  const t = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > QUOTE ? `${t.slice(0, QUOTE - 1)}…` : t;
};
const loopEvidence = (loop) => {
  const first = loop.stages?.response || loop.stages?.transfer;
  const supports = supportNames(first?.supports);
  return {
    t: first?.t || loop.createdAt,
    independent: supports.length === 0,
    supports,
    quote: quoteOf(first?.text),
    revised: Boolean(loop.stages?.revision?.text),
    loopId: loop.id,
  };
};

/**
 * What a stage's own feature recorded after the pathway started, or null. Shape:
 * { t, independent: boolean | null, supports: string[], quote, revised?, detail? } — `independent` is null when the
 * feature does not record help (the simulation, a book, the family conversation).
 */
export function stageEvidence(stage, run, snap) {
  if (!run) return null;
  const { type, match } = stage.evidence;
  const start = run.startedAt;
  const meta = run.meta?.[stage.id] || {};
  const objectiveLoops = (src) =>
    snap.loops.filter(
      (l) =>
        l.src === src &&
        l.objective === run.objective &&
        after(l.createdAt, start) &&
        (l.stages?.response?.text || l.stages?.transfer?.text),
    );
  if (type === "record") {
    const rec = snap.record(match.band, match.domain, match.level);
    const res = rec.results?.[match.id];
    if (
      !res ||
      !rec.complete?.includes(match.id) ||
      needsReview(res) ||
      !res.date ||
      !after(res.date, start)
    )
      return null;
    const help = Boolean(res.supportUsed) || res.evidence === "supported" || (res.tries || 1) > 1;
    return {
      t: res.date,
      independent: !help,
      supports: help ? ["help"] : [],
      quote: "",
      tries: res.tries || 1,
    };
  }
  if (type === "ledger") {
    const hit = snap.ledger
      .filter(
        (e) => e.src === match.src && (!match.task || e.task === match.task) && after(e.t, start),
      )
      .sort((a, b) => String(a.t).localeCompare(String(b.t)));
    const loop = match.loopSrc
      ? snap.loops.filter(
          (l) =>
            l.src === match.loopSrc &&
            (!match.task || l.task?.id === match.task) &&
            after(l.createdAt, start) &&
            l.stages?.response?.text,
        )[0]
      : null;
    if (!hit.length && !loop) return null;
    if (loop) return loopEvidence(loop);
    const first = hit.find((e) => e.kind === "first") || hit[0];
    const supports = supportNames(first.supports);
    return {
      t: first.t,
      independent: first.stage === "independent" && !supports.length,
      supports,
      quote: "",
      revised: hit.some((e) => e.kind === "revision"),
    };
  }
  if (type === "sim") {
    const fin = simFinished(snap.sim?.[match.mission]);
    if (!fin || run.base?.sim?.[match.mission]) return null;
    const loop = objectiveLoops("sim")[0];
    return {
      t: fin.t || loop?.createdAt || "",
      independent: null,
      supports: [],
      quote: quoteOf(loopText(loop)),
      outcome: fin.outcome,
    };
  }
  if (type === "book") {
    // The hand-off creates the book (rev 1); it counts once the learner has saved their own work into it.
    const book = snap.books.find((b) => b.source?.id === match.source && (b.rev || 0) >= 2);
    return book
      ? {
          t: book.updatedAt,
          independent: null,
          supports: [],
          quote: "",
          bookId: book.id,
          title: book.title,
        }
      : null;
  }
  if (type === "loop") {
    const loop = snap.loops.filter(
      (l) =>
        l.src === match.src &&
        String(l.task?.id || "").startsWith(match.taskId) &&
        l.objective === run.objective &&
        after(l.createdAt, start) &&
        l.stages?.response?.text,
    )[0];
    if (!loop) return null;
    const ev = loopEvidence(loop);
    // Helps opened in the pathway view count too, even if the loop panel did not see them.
    const extra = supportNames(meta.supports).filter((s) => !ev.supports.includes(s));
    return extra.length ? { ...ev, supports: [...ev.supports, ...extra], independent: false } : ev;
  }
  if (type === "talk")
    return meta.talk
      ? { t: meta.talk.t, independent: null, supports: [], quote: "", prompts: meta.talk.prompts }
      : null;
  return null;
}

/**
 * The ladder: each stage with its state ("done" | "next" | "later") and evidence. `next` is the first stage that is
 * not done and not optional; the pathway is complete when every required stage is done.
 */
export function pathwayState(pathway, run, snap) {
  let nextSeen = false;
  const stages = pathway.stages.map((stage, i) => {
    const evidence = stageEvidence(stage, run, snap);
    let state = evidence ? "done" : "later";
    if (!evidence && !stage.optional && !nextSeen) {
      state = "next";
      nextSeen = true;
    }
    return {
      stage,
      n: i + 1,
      state,
      evidence,
      supportsOpened: supportNames(run?.meta?.[stage.id]?.supports),
    };
  });
  const required = stages.filter((s) => !s.stage.optional);
  return {
    stages,
    total: pathway.stages.length,
    done: stages.filter((s) => s.state === "done").length,
    requiredDone: required.filter((s) => s.state === "done").length,
    requiredTotal: required.length,
    next: stages.find((s) => s.state === "next") || null,
    complete: required.length > 0 && required.every((s) => s.state === "done"),
  };
}

const day = (t) => (t ? String(t).slice(0, 10) : "date not recorded");
/**
 * One labelled plain-text packet for the class review queue: every stage, what was done, when, independent vs
 * supported, and the learner's own words where a loop holds them. English labels (the teacher's queue is English).
 */
export function pathwayDigest(pathway, state, objective) {
  const lines = [
    `PATHWAY: ${pathway.title[0]}`,
    `GOAL: ${objective.student[0]} (${objective.keyUse})`,
    `Steps done: ${state.requiredDone} of ${state.requiredTotal} required`,
  ];
  for (const s of state.stages) {
    const head = `STEP ${s.n} — ${s.stage.feature[0]}: ${s.stage.title[0]}${s.stage.optional ? " (optional)" : ""}`;
    if (!s.evidence) {
      lines.push(`${head}\nNot done yet.`);
      continue;
    }
    const how =
      s.evidence.independent === null
        ? ""
        : s.evidence.independent
          ? " [on my own]"
          : ` [with supports${s.evidence.supports.length ? `: ${s.evidence.supports.join(", ")}` : ""}]`;
    const extra = [
      s.evidence.revised ? "Revised after feedback (the revision counts as supported)." : "",
      s.evidence.outcome ? `Ending reached: ${s.evidence.outcome}.` : "",
      s.evidence.prompts
        ? `Family talk prompts used: ${s.evidence.prompts.map((p) => p + 1).join(", ")}.`
        : "",
      s.evidence.title ? `Book: ${s.evidence.title}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
    lines.push(
      `${head}\nDone ${day(s.evidence.t)}${how}.${extra ? ` ${extra}` : ""}${s.evidence.quote ? `\nMy words: "${s.evidence.quote}"` : ""}`,
    );
  }
  return lines.join("\n\n").slice(0, 3900);
}

/** The pathway to resume: the active run if it still has work left, else the most recently opened unfinished one. */
export function resumeRun(state) {
  const runs = Object.values(state.runs || {});
  return (
    state.runs?.[state.active] ||
    runs.sort((a, b) => String(b.openedAt).localeCompare(String(a.openedAt)))[0] ||
    null
  );
}
