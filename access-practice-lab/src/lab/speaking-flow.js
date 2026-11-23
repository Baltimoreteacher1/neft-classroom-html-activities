// Speaking flow: the pure step logic every Speaking task shares. No DOM, no device, no timers: the clock and the
// microphone state come in as arguments, so the whole machine runs in Node and its state is plain JSON.
//
//   PLAN -> READY -> RECORD -> REVIEW -> SELF_CHECK -> DONE
//     |        |         |
//     |        +---------+--> blocked (READY + blocked:true): retry the microphone, or answer by typing -> REVIEW
//     +-- a silent planning window; "I'm ready" opens READY once PLAN_MIN_MS have passed. Nothing starts recording.
//
// A student always has a way forward: a blocked microphone (denied, absent, busy, unsupported, unplugged, or "I can't
// record right now") keeps the same step open with a retry and a typed / tap-to-build answer, and a typed answer
// counts as the speaking attempt, flagged `typed` / `norec`. The typed text itself never enters the flow state (only
// its word count does), so it cannot leak into a saved game, a round report or telemetry.
export const PHASE = Object.freeze({
  PLAN: "PLAN",
  READY: "READY",
  RECORD: "RECORD",
  REVIEW: "REVIEW",
  SELF_CHECK: "SELF_CHECK",
  DONE: "DONE",
});
export const PLAN_MIN_MS = 5000; // "I'm ready" is available from here on
export const PLAN_WINDOW_MS = 10000; // the calm bar fills over this long; it never starts anything by itself
export const TYPED_MIN_WORDS = 3; // a typed answer needs a few words to count as an attempt
export const CHECK_IDS = Object.freeze(["idea", "word", "voice"]);

const phases = Object.values(PHASE);
const clean = (n) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

export const initFlow = () => ({
  phase: PHASE.PLAN,
  since: 0, // when the planning window opened (ms since epoch); 0 = not started yet
  blocked: false, // READY with the microphone unavailable: show the reason, retry and the typed answer
  reason: "", // an AudioGuard block reason, or "declined" for "I can't record right now"
  typed: false, // the attempt was typed, not recorded
  words: 0, // word count of the typed answer (never the text)
  played: false,
  norec: false,
  attempts: 0, // recordings started
  self: {}, // { idea, word, voice } -> boolean once answered
});

/** Sanitize a flow read back from storage; anything unknown becomes the safe default. */
export function normalizeFlow(raw) {
  const base = initFlow();
  if (!raw || typeof raw !== "object") return base;
  const self = {};
  for (const id of CHECK_IDS) if (typeof raw.self?.[id] === "boolean") self[id] = raw.self[id];
  return {
    phase: phases.includes(raw.phase) ? raw.phase : base.phase,
    since: clean(raw.since),
    blocked: raw.blocked === true,
    reason: typeof raw.reason === "string" ? raw.reason.slice(0, 24) : "",
    typed: raw.typed === true,
    words: clean(raw.words),
    played: raw.played === true,
    norec: raw.norec === true,
    attempts: clean(raw.attempts),
    self,
  };
}

// ── the clock ────────────────────────────────────────────────────────────────────────────
export const elapsedMs = (sp, now) => (sp.since > 0 ? Math.max(0, now - sp.since) : 0);
/** The planning window is over for "I'm ready" when minMs have passed (minMs 0 = always: tests, QA, reduced motion). */
export const canReady = (sp, now, minMs = PLAN_MIN_MS) =>
  sp.phase === PHASE.PLAN && (minMs <= 0 || elapsedMs(sp, now) >= minMs);
export const planRemainingMs = (sp, now, minMs = PLAN_MIN_MS) =>
  sp.phase === PHASE.PLAN && minMs > 0 ? Math.max(0, minMs - elapsedMs(sp, now)) : 0;
/** 0..1 for the calm bar. */
export const planRatio = (sp, now, windowMs = PLAN_WINDOW_MS) =>
  Math.min(1, elapsedMs(sp, now) / windowMs);

// ── self-check ──────────────────────────────────────────────────────────────────────────
export const answered = (sp) => CHECK_IDS.every((id) => typeof sp.self[id] === "boolean");
export const selfCheckOf = (sp) =>
  Object.fromEntries(
    CHECK_IDS.map((id) => [id, typeof sp.self[id] === "boolean" ? sp.self[id] : null]),
  );

// ── the reducer ─────────────────────────────────────────────────────────────────────────
const blockedAt = (sp, reason) => ({
  ...sp,
  phase: PHASE.READY,
  blocked: true,
  reason: reason || "failed",
  typed: false,
  words: 0,
  played: false,
});

/**
 * One event -> the next flow. Returns the SAME object when the event changes nothing (so callers can tell).
 * Events: STAMP{now} READY{now,minMs} GUARD{state,reason,hasTake} NOREC RETRY TYPED{words} PLAYED RETAKE
 *         ANSWER{id,v} FINISH RECOVER{recording,hasTake,hasText}
 */
export function reduce(sp, ev) {
  const at = sp.phase;
  switch (ev?.type) {
    case "STAMP":
      return at === PHASE.PLAN && !sp.since && ev.now > 0 ? { ...sp, since: clean(ev.now) } : sp;
    case "READY":
      // A window that never opened (no render has stamped `since`: Node, QA, a resumed save) holds nobody back.
      return at === PHASE.PLAN && (!sp.since || canReady(sp, ev.now, ev.minMs))
        ? { ...sp, phase: PHASE.READY }
        : sp;
    case "GUARD": {
      if (ev.state === "RECORDING" && at === PHASE.READY)
        return {
          ...sp,
          phase: PHASE.RECORD,
          blocked: false,
          reason: "",
          attempts: sp.attempts + 1,
        };
      if (ev.state === "PLAYBACK_READY" && (at === PHASE.READY || at === PHASE.RECORD))
        return ev.hasTake
          ? {
              ...sp,
              phase: PHASE.REVIEW,
              blocked: false,
              reason: "",
              typed: false,
              norec: false,
              words: 0,
              played: false,
              self: {},
            }
          : blockedAt(sp, "failed");
      if (ev.state === "MIC_BLOCKED_FALLBACK" && (at === PHASE.READY || at === PHASE.RECORD))
        return blockedAt(sp, ev.reason);
      if (ev.state === "IDLE" && at === PHASE.RECORD) return { ...sp, phase: PHASE.READY };
      return sp;
    }
    case "NOREC":
      return at === PHASE.READY && !sp.blocked ? blockedAt(sp, "declined") : sp;
    case "RETRY":
      return at === PHASE.READY && sp.blocked ? { ...sp, blocked: false, reason: "" } : sp;
    case "TYPED": {
      const words = clean(ev.words);
      return at === PHASE.READY && sp.blocked && words >= TYPED_MIN_WORDS
        ? { ...sp, phase: PHASE.REVIEW, typed: true, norec: true, words, played: false, self: {} }
        : sp;
    }
    case "PLAYED":
      return at === PHASE.REVIEW ? { ...sp, phase: PHASE.SELF_CHECK, played: true } : sp;
    case "RETAKE":
      if (at !== PHASE.REVIEW && at !== PHASE.SELF_CHECK) return sp;
      return sp.typed
        ? { ...blockedAt(sp, sp.reason || "declined"), norec: false, self: {} }
        : {
            ...sp,
            phase: PHASE.READY,
            blocked: false,
            reason: "",
            played: false,
            norec: false,
            self: {},
          };
    case "ANSWER":
      return at === PHASE.SELF_CHECK &&
        CHECK_IDS.includes(ev.id) &&
        sp.self[ev.id] !== (ev.v === true)
        ? { ...sp, self: { ...sp.self, [ev.id]: ev.v === true } }
        : sp;
    case "FINISH":
      return at === PHASE.SELF_CHECK && answered(sp) ? { ...sp, phase: PHASE.DONE } : sp;
    case "RECOVER":
      return recover(sp, ev);
    default:
      return sp;
  }
}

/**
 * After a reload or a remount the in-memory parts (a take, typed text, a live recording) may be gone. Put the learner
 * back on a step they can finish instead of one that waits for something that no longer exists. Idempotent.
 */
export function recover(sp, { recording = false, hasTake = false, hasText = false } = {}) {
  if (sp.phase === PHASE.RECORD && !recording) return { ...sp, phase: PHASE.READY };
  if ((sp.phase === PHASE.REVIEW || sp.phase === PHASE.SELF_CHECK) && !sp.typed && !hasTake)
    return { ...sp, phase: PHASE.READY, played: false, self: {} };
  if ((sp.phase === PHASE.REVIEW || sp.phase === PHASE.SELF_CHECK) && sp.typed && !hasText)
    return { ...blockedAt(sp, sp.reason || "declined"), self: {} };
  return sp;
}

/** What a finished attempt adds to the round report. No text, no audio: flags and three booleans. */
export const speakReport = (sp) => ({
  typed: sp.typed,
  norec: sp.norec,
  attempts: sp.attempts,
  selfCheck: selfCheckOf(sp),
  languageErrorTag: null, // never invented: only a rule-based detector may name one
});

// ── frames ───────────────────────────────────────────────────────────────────────────────
/** A frame string ("First, ___. Next, ___.") -> one chip per sentence. Frames come from a game's own content. */
export const frameParts = (frame) =>
  String(frame || "")
    .split(/(?<=[.?!])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
/**
 * The chips a support mode shows: A (full) shows every sentence frame, B (starter) the first three words of each,
 * C (none) nothing. `frames` is a string or a list of strings.
 */
export function chipsFor(frames, mode) {
  if (mode === "none") return [];
  const parts = (Array.isArray(frames) ? frames : [frames]).flatMap(frameParts);
  return parts.map((text) =>
    mode === "starter"
      ? text
          .split(/\s+/)
          .slice(0, 3)
          .join(" ")
          .replace(/[.?!,]+$/, "")
      : text,
  );
}
export const countWords = (text) =>
  String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
/** Add a chip to typed text (tap-to-build). */
export const addChip = (text, chip, max = 400) =>
  `${String(text || "").replace(/\s*$/, text ? " " : "")}${chip}`.slice(0, max);

// ── typed answers live only in memory (like a take): never saved, never reported ─────────
const typedAnswers = new Map();
export const typedStore = Object.freeze({
  get: (key) => typedAnswers.get(key) || "",
  set: (key, text) =>
    text ? typedAnswers.set(key, String(text).slice(0, 400)) : typedAnswers.delete(key),
  clear: (key) => typedAnswers.delete(key),
});

// ── the QA hook ──────────────────────────────────────────────────────────────────────────
/**
 * Every remaining action to finish the step through the typed route (a headless browser has no microphone, and this
 * route works the same everywhere). `typedText` must have TYPED_MIN_WORDS words. Games return it from plan().
 */
export function planSteps(sp, typedText = "I can say my idea with a clear word.") {
  const out = [];
  const p = sp.phase;
  const order = [PHASE.PLAN, PHASE.READY, PHASE.RECORD, PHASE.REVIEW, PHASE.SELF_CHECK];
  const from = order.indexOf(p);
  if (from < 0) return out;
  if (p === PHASE.PLAN) out.push({ click: "[data-sp-ready]" });
  if (p === PHASE.PLAN || (p === PHASE.READY && !sp.blocked)) out.push({ click: "[data-sp-nomic]" });
  if (p === PHASE.RECORD) out.push({ click: "[data-sp-stop]" });
  if (p === PHASE.PLAN || p === PHASE.READY)
    out.push({ fill: ["[data-sp-typed]", typedText] }, { click: "[data-sp-typed-done]" });
  if (from <= order.indexOf(PHASE.REVIEW)) out.push({ click: "[data-sp-play]" });
  for (const id of CHECK_IDS)
    if (typeof sp.self[id] !== "boolean" || from < order.indexOf(PHASE.SELF_CHECK))
      out.push({ click: `[data-sp-self="${id}:yes"]` });
  out.push({ click: "[data-sp-finish]" });
  return out;
}
