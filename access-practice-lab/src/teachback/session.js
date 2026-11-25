// Teach It Back: the learner's progress as plain data and the pure moves that change it. No storage, page or network
// here (store.js saves it). One session is one concept journey: learn, plan, teach, feedback, revise, on my own, done.
// Supported and independent tries are kept in separate lists so a summary can never blur them.
import { conceptById, ownChoices } from "./concepts.js";

export const STEPS = ["learn", "plan", "teach", "feedback", "own", "done"];
export const PHASES = ["first", "revise", "own"];
export const MAX_TEXT = 4000;
const MAX_RECORDS = 80;

export const blankState = () => ({ v: 1, session: null, records: { supported: [], independent: [] }, explained: {} });

export const blankSession = (id) => ({
  id,
  step: "learn",
  phase: "first",
  plan: [],
  attempts: [],
  draft: "",
  mode: "type",
  framesUsed: false,
  framesOpen: false,
  audioId: "",
  self: [],
  ownId: "",
});

const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);

/** Reads whatever was stored and returns a state that is always safe to use. */
export function normalizeState(raw) {
  const s = blankState();
  if (!raw || typeof raw !== "object") return s;
  const r = raw.records || {};
  for (const k of ["supported", "independent"]) s.records[k] = Array.isArray(r[k]) ? r[k].slice(-MAX_RECORDS) : [];
  if (raw.explained && typeof raw.explained === "object") s.explained = raw.explained;
  const x = raw.session;
  if (x && typeof x.id === "string") {
    s.session = {
      ...blankSession(x.id),
      step: STEPS.includes(x.step) ? x.step : "learn",
      phase: PHASES.includes(x.phase) ? x.phase : "first",
      plan: list(x.plan),
      attempts: Array.isArray(x.attempts) ? x.attempts : [],
      draft: String(x.draft || "").slice(0, MAX_TEXT),
      mode: x.mode === "record" ? "record" : "type",
      framesUsed: Boolean(x.framesUsed),
      framesOpen: Boolean(x.framesOpen),
      audioId: typeof x.audioId === "string" ? x.audioId : "",
      self: list(x.self),
      ownId: typeof x.ownId === "string" ? x.ownId : "",
    };
  }
  return s;
}

/** The concept being explained right now: the first one, or the "on my own" one. */
export const currentId = (sess) => (sess.phase === "own" ? sess.ownId : sess.id);

/** A try is SUPPORTED when sentence frames were opened or it is a revision after feedback; otherwise INDEPENDENT. */
export const isSupported = (sess) => sess.framesUsed || sess.phase === "revise";

/** The model answer may be shown only once the learner has made a try at that concept. */
export const modelVisible = (sess, conceptId) => sess.attempts.some((a) => a.conceptId === conceptId);

export const attemptsFor = (sess, conceptId) => sess.attempts.filter((a) => a.conceptId === conceptId);

/** Save one finished explanation. Returns the attempt, which is also filed under supported or independent. */
export function recordAttempt(state, { text = "", analysis = null, claimed = [], now = Date.now() } = {}) {
  const sess = state.session;
  const supported = isSupported(sess);
  const attempt = {
    phase: sess.phase,
    conceptId: currentId(sess),
    mode: sess.mode,
    text: String(text).slice(0, MAX_TEXT),
    audioId: sess.mode === "record" ? sess.audioId : "",
    supported,
    frames: sess.framesUsed,
    self: text.trim() ? [] : [...sess.self],
    claimed,
    covered: analysis ? [...analysis.covered] : [],
    words: analysis ? analysis.words : 0,
    t: now,
  };
  sess.attempts.push(attempt);
  const bucket = state.records[supported ? "supported" : "independent"];
  bucket.push({ conceptId: attempt.conceptId, phase: attempt.phase, mode: attempt.mode, words: attempt.words, covered: attempt.covered, self: attempt.self, text: attempt.text, t: now });
  if (bucket.length > MAX_RECORDS) bucket.splice(0, bucket.length - MAX_RECORDS);
  sess.draft = "";
  sess.framesUsed = false;
  sess.framesOpen = false;
  sess.audioId = "";
  sess.self = [];
  return attempt;
}

/** Starts a fresh try at the same concept, with the last text as a starting point (a revision). */
export function startRevision(sess, lastText = "") {
  Object.assign(sess, { phase: "revise", step: "teach", draft: lastText, framesUsed: false, framesOpen: false, audioId: "", self: [] });
}

/** Moves to "on my own": a different concept from the same subject and band, frames closed. False if `id` is not allowed. */
export function startOwn(sess, id) {
  const base = conceptById(sess.id);
  if (!base || !ownChoices(base).some((c) => c.id === id)) return false;
  Object.assign(sess, { phase: "own", ownId: id, step: "learn", draft: "", framesUsed: false, framesOpen: false, audioId: "", self: [], mode: "type" });
  return true;
}

/** Remembers what was explained, and whether any try at it was independent. */
export function markExplained(state, now = Date.now()) {
  const sess = state.session;
  if (!sess) return;
  for (const id of new Set(sess.attempts.map((a) => a.conceptId)))
    state.explained[id] = { t: now, independent: sess.attempts.some((a) => a.conceptId === id && !a.supported) };
}

/** Closes the journey (after marking it) so the learner can pick another idea. */
export function endSession(state, now = Date.now()) {
  markExplained(state, now);
  state.session = null;
}
