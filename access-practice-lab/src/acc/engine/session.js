// AssessmentSession: deterministic state for one sitting. Pure logic (no DOM, injectable clock), so navigation,
// timer, scaffold logging, submission and resume are testable and identical in every view.
//
// Modes
//   summative  Standardized practice: no hints, no feedback until the end, optional timer, explicit submission.
//   formative  Learning: check -> targeted feedback -> support tiers (1 clue, 2 language, 3 mentor model) ->
//              revise -> a FRESH attempt. A scaffolded success is recorded as supported, never as independent.
import { hasResponse, isObjective, scoreItem } from "./scoring.js";
import { MODES } from "./schema.js";

export const TIERS = Object.freeze([
  { tier: 1, key: "clue", label: "Strategic clue" },
  { tier: 2, key: "frame", label: "Language support" },
  { tier: 3, key: "model", label: "Mentor model" },
]);
export const SESSION_VERSION = 1;

export class AssessmentSession {
  constructor(set, options = {}) {
    if (!set?.items?.length) throw new Error("AssessmentSession needs a set with items");
    this.set = set;
    this.mode = MODES.includes(options.mode) ? options.mode : "summative";
    this.now = options.now || (() => Date.now());
    this.config = {
      minutes: options.minutes ?? null, // null = untimed
      navigation: options.navigation || "free", // "free" | "forward-only"
      maxAttempts: options.maxAttempts ?? 3,
    };
    this.id = options.id || `${set.id}-${this.now().toString(36)}`;
    this.index = 0;
    this.responses = {};
    this.marked = new Set();
    this.attempts = {}; // itemId -> [{ n, response, status, correct, tier, t }]
    this.supports = {}; // itemId -> [{ tier, t, attempt }]
    this.awaiting = new Set(); // checked, not yet revised
    this.status = "ready"; // ready | active | paused | submitted | expired
    this.elapsedMs = 0;
    this.resumedAt = null;
    this.result = null;
    this.events = [];
    this.tools = options.tools || null; // toolbar state (highlights, eliminated choices) saved with the session
  }

  // ── items and navigation ──────────────────────────────────────────────────
  get items() {
    return this.set.items;
  }
  get current() {
    return this.items[this.index];
  }
  itemById(id) {
    return this.items.find((i) => i.id === id);
  }
  log(type, data = {}) {
    this.events.push({ type, t: this.now(), ...data });
  }

  start() {
    if (this.status === "submitted") return this;
    if (this.status === "ready" || this.status === "paused") {
      this.status = "active";
      this.resumedAt = this.now();
      this.log(this.elapsedMs ? "resume" : "start");
    }
    return this;
  }
  pause() {
    if (this.status !== "active") return this;
    this.elapsedMs = this.elapsed();
    this.resumedAt = null;
    this.status = "paused";
    this.log("pause");
    return this;
  }
  elapsed() {
    return this.elapsedMs + (this.status === "active" && this.resumedAt ? this.now() - this.resumedAt : 0);
  }
  remainingMs() {
    return this.config.minutes == null ? null : Math.max(0, this.config.minutes * 60000 - this.elapsed());
  }
  /** Call on a timer tick. Expires a timed summative session exactly once. */
  tick() {
    if (this.status === "active" && this.remainingMs() === 0) {
      this.elapsedMs = this.elapsed();
      this.status = "expired";
      this.log("expired");
    }
    return this.status === "expired";
  }
  get locked() {
    return this.status === "submitted" || this.status === "expired";
  }

  goto(i) {
    if (this.locked) return false;
    if (!Number.isInteger(i) || i < 0 || i >= this.items.length) return false;
    if (this.config.navigation === "forward-only" && i < this.index) return false;
    this.index = i;
    this.log("goto", { item: this.current.id });
    return true;
  }
  next() {
    return this.goto(this.index + 1);
  }
  prev() {
    return this.goto(this.index - 1);
  }

  // ── responses ─────────────────────────────────────────────────────────────
  setResponse(itemId, response) {
    const item = this.itemById(itemId);
    if (!item || this.locked) return false;
    if (this.mode === "formative" && this.awaiting.has(itemId)) return false; // revise via newAttempt()
    this.responses[itemId] = response;
    return true;
  }
  answered(itemId) {
    const item = this.itemById(itemId);
    return item ? hasResponse(item, this.responses[itemId]) : false;
  }
  mark(itemId, on = true) {
    if (!this.itemById(itemId) || this.locked) return false;
    on ? this.marked.add(itemId) : this.marked.delete(itemId);
    return true;
  }
  summary() {
    const rows = this.items.map((item, i) => ({ id: item.id, number: i + 1, answered: this.answered(item.id), marked: this.marked.has(item.id) }));
    return {
      total: rows.length,
      answered: rows.filter((r) => r.answered).length,
      unanswered: rows.filter((r) => !r.answered).map((r) => r.number),
      marked: rows.filter((r) => r.marked).map((r) => r.number),
      rows,
    };
  }

  // ── formative cycle: attempt -> feedback -> scaffold -> revision -> fresh attempt ──
  // `attempts[itemId]` holds CHECKED attempts only. The attempt in progress is number checked.length + 1.
  attemptList(itemId) {
    return (this.attempts[itemId] ||= []);
  }
  attemptNo(itemId) {
    return this.attemptList(itemId).length + 1;
  }
  /** Highest support tier ever opened on this item (the ladder unlocks from here). */
  tierEver(itemId) {
    return (this.supports[itemId] || []).reduce((m, s) => Math.max(m, s.tier), 0);
  }
  /** Highest tier opened for the attempt in progress. */
  tierUsed(itemId) {
    const n = this.attemptNo(itemId);
    return (this.supports[itemId] || []).filter((s) => s.attempt === n).reduce((m, s) => Math.max(m, s.tier), 0);
  }
  awaitingRevision(itemId) {
    return this.awaiting.has(itemId);
  }

  /** Formative only. Scores the current response and keeps it as a checked attempt. */
  check(itemId) {
    if (this.mode !== "formative" || this.locked) return null;
    const item = this.itemById(itemId);
    if (!item || !this.answered(itemId)) return null;
    const list = this.attemptList(itemId);
    if (this.awaiting.has(itemId)) return list[list.length - 1]; // never log a second check of the same attempt
    const score = scoreItem(item, this.responses[itemId]);
    const attempt = { n: list.length + 1, response: structuredClone(this.responses[itemId]), status: score.status, correct: score.correct, tier: this.tierUsed(itemId), t: this.now() };
    list.push(attempt);
    this.awaiting.add(itemId);
    this.log("check", { item: itemId, attempt: attempt.n, status: score.status });
    return attempt;
  }
  /** Formative only. Opens a support tier, in order. Returns the support content, or null if unavailable. */
  requestSupport(itemId, tier) {
    if (this.mode !== "formative" || this.locked) return null;
    const item = this.itemById(itemId);
    const def = TIERS.find((t) => t.tier === tier);
    if (!item || !def || !item.support?.[def.key]) return null;
    if (tier > this.tierEver(itemId) + 1) return null; // tiers unlock in order
    const n = this.attemptNo(itemId);
    const list = (this.supports[itemId] ||= []);
    if (!list.some((x) => x.tier === tier && x.attempt === n)) {
      list.push({ tier, t: this.now(), attempt: n });
      this.log("support", { item: itemId, tier, attempt: n });
    }
    return { tier, key: def.key, label: def.label, content: item.support[def.key] };
  }
  /** After feedback and support the learner revises: the response is cleared for the next attempt. */
  newAttempt(itemId) {
    if (this.mode !== "formative" || this.locked || !this.awaiting.has(itemId)) return false;
    if (this.attemptList(itemId).length >= this.config.maxAttempts) return false;
    delete this.responses[itemId];
    this.awaiting.delete(itemId);
    this.log("new-attempt", { item: itemId, attempt: this.attemptNo(itemId) });
    return true;
  }

  // ── submission ────────────────────────────────────────────────────────────
  /** Idempotent: a second call returns the same result and records nothing new. */
  submit() {
    if (this.result) return this.result;
    this.elapsedMs = this.elapsed();
    this.resumedAt = null;
    this.status = "submitted";
    this.result = this.buildResult();
    this.log("submit");
    return this.result;
  }

  buildResult() {
    const rows = this.items.map((item, i) => {
      const score = scoreItem(item, this.responses[item.id]);
      const checked = this.attemptList(item.id);
      const first = checked[0] || null;
      const everSupported = this.tierEver(item.id) > 0;
      // Independent = the first attempt was right with no support (or, in a summative sitting, the answer is right:
      // no support exists there). Success after feedback, a scaffold or a revision is supported, never independent.
      const independent = this.mode === "summative" ? score.correct === true : first ? first.correct === true && first.tier === 0 : false;
      return {
        id: item.id,
        number: i + 1,
        domain: item.domain || null,
        klu: item.klu || null,
        type: item.type,
        status: score.status,
        correct: score.correct,
        marked: this.marked.has(item.id),
        independent,
        supportTier: this.tierEver(item.id),
        supported: everSupported || checked.length > 1,
        attempts: this.mode === "summative" ? (score.status === "unanswered" ? 0 : 1) : checked.length,
        firstAttempt: first ? { correct: first.correct, tier: first.tier } : null,
        // What the learner chose on the first attempt (single-choice items): feeds misconception reporting.
        chosen: ["multiple-choice", "listening-response"].includes(item.type) ? (first ? first.response : this.responses[item.id]) ?? null : null,
        selfCheck: this.tools?.selfCheck?.[item.id]?.length ?? null,
      };
    });
    const objective = rows.filter((r) => isObjective(this.itemById(r.id)));
    const count = (list, fn) => list.filter(fn).length;
    return {
      sessionId: this.id,
      setId: this.set.id,
      mode: this.mode,
      submittedAt: this.now(),
      durationMs: this.elapsedMs,
      total: rows.length,
      objectiveTotal: objective.length,
      correct: count(objective, (r) => r.correct === true),
      independentCorrect: count(objective, (r) => r.independent),
      supportedCorrect: count(objective, (r) => r.correct === true && !r.independent),
      unanswered: count(rows, (r) => r.status === "unanswered"),
      needsReview: count(rows, (r) => r.status === "needs-review"),
      rows,
    };
  }

  // ── persistence ───────────────────────────────────────────────────────────
  serialize() {
    return {
      v: SESSION_VERSION,
      id: this.id,
      setId: this.set.id,
      mode: this.mode,
      config: this.config,
      index: this.index,
      responses: this.responses,
      marked: [...this.marked],
      attempts: this.attempts,
      supports: this.supports,
      awaiting: [...this.awaiting],
      status: this.status === "active" ? "paused" : this.status, // a saved session is never ticking
      elapsedMs: this.elapsed(),
      result: this.result,
      tools: this.tools,
      events: this.events.slice(-200),
    };
  }
  static restore(set, data, options = {}) {
    if (!data || data.setId !== set.id) throw new Error("saved session does not match this set");
    const s = new AssessmentSession(set, { ...options, mode: data.mode, ...data.config, id: data.id });
    Object.assign(s, {
      index: Math.min(Math.max(0, data.index | 0), set.items.length - 1),
      responses: data.responses || {},
      marked: new Set(data.marked || []),
      attempts: data.attempts || {},
      supports: data.supports || {},
      awaiting: new Set(data.awaiting || []),
      status: data.status || "paused",
      elapsedMs: data.elapsedMs || 0,
      result: data.result || null,
      tools: data.tools || null,
      events: data.events || [],
    });
    s.config = { ...s.config, ...data.config };
    return s;
  }
}
