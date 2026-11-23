// Session.js — deterministic session control for the three flagship games (and any game that wants it).
//
// One explicit state machine, one pausable clock, one event bus, and ArcadeSession, which wires the academic
// prompt (Prompts.js), adaptive selection (Adaptive.js), the Shard economy (Economy.js) and learning evidence
// (Evidence.js) behind a small command surface. Games and UI call commands; they never mutate state directly,
// so animation, answer validation, rewards, timers and persistence cannot race each other.
//
// The existing Studio games keep GameFSM (six lifecycle states). This table is the superset the arcade
// games need; `toStudioState` maps it back so a hub can show either.
import {
  ECONOMY_CONFIG,
  award,
  awardRecovery,
  cleanEconomy,
  consume,
  emptyEconomy,
  emptyStreak,
  isOverdrive,
  purchase,
  shopCatalog,
  streakAfter,
  streakTier,
} from "./Economy.js";
import {
  clearTransfer,
  cleanAdaptive,
  emptyAdaptive,
  layersAllowed,
  pickNext,
  playProfile,
  record as adaptiveRecord,
  targetLevel,
} from "./Adaptive.js";
import { eliminable, evaluate, decoderClue } from "./Prompts.js";
import { cleanRecords, makeRecord, summarize } from "./Evidence.js";
import { levelProfile } from "./WidaLevels.js";

export const STATES = Object.freeze([
  "IDLE",
  "LOADING",
  "SELECT_MODE",
  "SELECT_CONTENT",
  "READY",
  "PLAYING",
  "QUESTION_ACTIVE",
  "ANSWER_EVALUATION",
  "FEEDBACK",
  "RECOVERY",
  "ROUND_COMPLETE",
  "GAME_OVER",
  "RESULTS",
  "SAVE",
  "EXIT",
  "PAUSED",
  "SETTINGS",
  "SHOP",
  "INTERRUPTED",
  "ERROR",
]);
export const OVERLAYS = Object.freeze(["PAUSED", "SETTINGS", "SHOP", "INTERRUPTED"]);
const OVERLAY_HOSTS = [
  "PLAYING",
  "QUESTION_ACTIVE",
  "FEEDBACK",
  "RECOVERY",
  "ROUND_COMPLETE",
  "READY",
  "SELECT_MODE",
];

export const TRANSITIONS = Object.freeze({
  IDLE: ["LOADING", "SELECT_MODE", "READY"],
  LOADING: ["SELECT_MODE", "READY", "ERROR", "EXIT"],
  SELECT_MODE: ["SELECT_CONTENT", "READY", "EXIT", "ERROR"],
  SELECT_CONTENT: ["READY", "SELECT_MODE", "EXIT"],
  READY: ["PLAYING", "SELECT_MODE", "EXIT", "ERROR"],
  PLAYING: ["QUESTION_ACTIVE", "ROUND_COMPLETE", "GAME_OVER", "ERROR"],
  QUESTION_ACTIVE: ["ANSWER_EVALUATION", "ERROR"],
  ANSWER_EVALUATION: ["FEEDBACK", "RECOVERY", "ERROR"],
  FEEDBACK: ["PLAYING", "QUESTION_ACTIVE", "ROUND_COMPLETE", "GAME_OVER", "ERROR"],
  RECOVERY: ["ANSWER_EVALUATION", "QUESTION_ACTIVE", "FEEDBACK", "ERROR"],
  ROUND_COMPLETE: ["PLAYING", "RESULTS", "GAME_OVER"],
  GAME_OVER: ["RESULTS", "READY"],
  RESULTS: ["SAVE", "READY", "EXIT"],
  SAVE: ["EXIT", "RESULTS", "READY", "ERROR"],
  EXIT: ["IDLE"],
  ERROR: ["IDLE", "READY", "EXIT"],
  PAUSED: [],
  SETTINGS: [],
  SHOP: [],
  INTERRUPTED: [], // overlays return to the state that opened them
});

const STUDIO = {
  IDLE: "IDLE",
  SELECT_MODE: "BRIEFING",
  SELECT_CONTENT: "BRIEFING",
  READY: "BRIEFING",
  PLAYING: "PLAYING",
  QUESTION_ACTIVE: "PLAYING",
  ANSWER_EVALUATION: "PLAYING",
  FEEDBACK: "FEEDBACK",
  RECOVERY: "FEEDBACK",
  ROUND_COMPLETE: "ROUND_SUMMARY",
  RESULTS: "ROUND_SUMMARY",
};
export const toStudioState = (s) => STUDIO[s] || "PLAYING";

// ── event bus ───────────────────────────────────────────────────────────────────────────────
export class EventBus {
  constructor() {
    this.map = new Map();
  }
  on(type, fn) {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type).add(fn);
    return () => this.off(type, fn);
  }
  off(type, fn) {
    this.map.get(type)?.delete(fn);
  }
  emit(type, data) {
    for (const fn of [...(this.map.get(type) || []), ...(this.map.get("*") || [])]) {
      try {
        fn(data, type);
      } catch {
        /* a listener must not break the run */
      }
    }
  }
  clear() {
    this.map.clear();
  }
}

// ── state machine ───────────────────────────────────────────────────────────────────────────
export class StateMachine {
  constructor({ initial = "IDLE", bus = new EventBus() } = {}) {
    this.state = initial;
    this.bus = bus;
    this.stack = []; // overlay returns
    this.log = [];
  }
  can(to) {
    if (OVERLAYS.includes(to)) return OVERLAY_HOSTS.includes(this.state);
    return (TRANSITIONS[this.state] || []).includes(to);
  }
  go(to, meta = {}) {
    if (this.state === to) return false;
    if (OVERLAYS.includes(this.state)) {
      // leaving an overlay goes back to its host, or on to a terminal state
      const host = this.stack[this.stack.length - 1];
      if (to !== host && !["EXIT", "ERROR", "RESULTS"].includes(to)) return this.reject(to);
      this.stack.pop();
    } else if (OVERLAYS.includes(to)) {
      if (!this.can(to)) return this.reject(to);
      this.stack.push(this.state);
    } else if (!this.can(to)) {
      return this.reject(to);
    }
    const from = this.state;
    this.state = to;
    this.log.push(`${from}>${to}`);
    if (this.log.length > 60) this.log.shift();
    this.bus.emit("state", { from, to, ...meta });
    return true;
  }
  reject(to) {
    this.bus.emit("rejected", { from: this.state, to });
    return false;
  }
  /** Close the topmost overlay, returning to the state that opened it. */
  back() {
    if (!OVERLAYS.includes(this.state)) return false;
    return this.go(this.stack[this.stack.length - 1]);
  }
  get overlay() {
    return OVERLAYS.includes(this.state) ? this.state : "";
  }
  get host() {
    return this.overlay ? this.stack[this.stack.length - 1] : this.state;
  }
}

// ── clock ───────────────────────────────────────────────────────────────────────────────────
/**
 * A game-mode timer driven by explicit ticks (the render loop passes delta time), never by wall clock, so it
 * is testable and pausable. Reasons hold it ("question", "shop", "pause", "settings"); Chrono Freeze stops the
 * countdown for 10 seconds on top of that. `limitMs: 0` is an untimed run (the clock never expires).
 */
export class GameClock {
  constructor({ limitMs = 0, onExpire = () => {} } = {}) {
    this.limitMs = limitMs;
    this.elapsed = 0;
    this.holds = new Set();
    this.freezeMs = 0;
    this.expired = false;
    this.onExpire = onExpire;
  }
  get timed() {
    return this.limitMs > 0;
  }
  get remaining() {
    return this.timed ? Math.max(0, this.limitMs - this.elapsed) : Infinity;
  }
  get running() {
    return this.timed && !this.expired && this.holds.size === 0;
  }
  get frozen() {
    return this.freezeMs > 0;
  }
  hold(reason) {
    this.holds.add(reason);
  }
  release(reason) {
    this.holds.delete(reason);
  }
  freeze(ms = 10000) {
    this.freezeMs = Math.max(this.freezeMs, ms);
  }
  tick(dt) {
    const d = Math.min(Math.max(0, dt), 250); // a suspended tab must not drain the clock
    if (!this.running) return;
    if (this.freezeMs > 0) {
      this.freezeMs = Math.max(0, this.freezeMs - d);
      return;
    }
    this.elapsed += d;
    if (this.elapsed >= this.limitMs && !this.expired) {
      this.expired = true;
      this.onExpire();
    }
  }
  snapshot() {
    return {
      limitMs: this.limitMs,
      elapsed: this.elapsed,
      freezeMs: this.freezeMs,
      expired: this.expired,
    };
  }
  restore(s) {
    if (s && typeof s === "object") {
      this.limitMs = +s.limitMs || 0;
      this.elapsed = +s.elapsed || 0;
      this.freezeMs = +s.freezeMs || 0;
      this.expired = Boolean(s.expired);
    }
  }
}

// ── seeded random whose state can be saved (a resumed run asks the same next question) ──────
export function makeRng(seed = 1) {
  let t = (Math.floor(seed) || 1) >>> 0;
  const next = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  next.state = () => t;
  next.setState = (s) => {
    t = s >>> 0;
  };
  next.int = (n) => Math.floor(next() * n);
  return next;
}

export const MODES = Object.freeze({
  classic: { id: "classic", timeMs: 0, hearts: 0, label: ["Classic Mastery", "Dominio clásico"] },
  blitz: {
    id: "blitz",
    timeMs: 90000,
    hearts: 0,
    label: ["Blitz Sprint", "Sprint relámpago"],
    optional: true,
  },
  survival: {
    id: "survival",
    timeMs: 0,
    hearts: 3,
    label: ["Endless Survival", "Supervivencia sin fin"],
  },
});

// ── the session ─────────────────────────────────────────────────────────────────────────────
export const SNAPSHOT_VERSION = 1;

export class ArcadeSession {
  /**
   * @param {object} o
   * @param {string} o.gameId  @param {Array} o.pool normalized prompts  @param {string} o.band  @param {string} [o.gradeFocus]
   * @param {number} o.level WIDA practice level 1-6  @param {"classic"|"blitz"|"survival"} [o.mode]
   * @param {boolean} [o.calm] untimed and no heart loss  @param {number} [o.seed]
   * @param {boolean} [o.questionPausesClock] true when the game world stops while a prompt is open
   */
  constructor({
    gameId,
    pool,
    band,
    gradeFocus = "",
    level = 3,
    mode = "classic",
    calm = false,
    seed = Date.now() & 0xffffff,
    questionPausesClock = true,
    domains,
    formats,
  } = {}) {
    if (!gameId) throw new Error("gameId is required");
    if (!Array.isArray(pool) || !pool.length) throw new Error("a prompt pool is required");
    this.gameId = gameId;
    this.pool = pool;
    this.byId = new Map(pool.map((p) => [p.id, p]));
    this.profile = playProfile({ band, gradeFocus, level });
    this.mode = MODES[mode] ? mode : "classic";
    this.calm = Boolean(calm);
    this.timeMs = this.calm ? 0 : MODES[this.mode].timeMs;
    this.maxHearts = this.calm ? 0 : MODES[this.mode].hearts;
    this.hearts = this.maxHearts;
    this.questionPausesClock = questionPausesClock;
    this.domains = domains;
    this.formats = formats;
    this.seed = seed;
    this.rng = makeRng(seed);
    this.runId = `${gameId}-${seed.toString(36)}-${Date.now().toString(36)}`;
    this.seq = 0;
    this.bus = new EventBus();
    this.fsm = new StateMachine({ bus: this.bus });
    this.clock = new GameClock({ limitMs: this.timeMs, onExpire: () => this.onExpire() });
    this.economy = emptyEconomy();
    this.streak = emptyStreak();
    this.adaptive = emptyAdaptive();
    this.records = [];
    this.ticket = null; // the open question
    this.settled = new Map(); // ticket id -> result (idempotent submit)
    this.expiredPending = false;
    this.pulse = null;
    this.questions = 0;
    this.gameState = null; // opaque, owned by the game, saved with the run
    this.startedAt = Date.now();
  }

  // ---- lifecycle -------------------------------------------------------------------------
  /** IDLE -> READY. The UI shows mode/content choices before this; a session built with them skips straight here. */
  ready() {
    if (this.fsm.state === "IDLE") this.fsm.go("READY");
    return this.fsm.state === "READY";
  }
  begin() {
    if (this.fsm.state === "READY" && this.fsm.go("PLAYING")) {
      this.bus.emit("begin", this.view());
      return true;
    }
    return false;
  }
  get state() {
    return this.fsm.state;
  }
  get timed() {
    return this.clock.timed;
  }

  // ---- questions -------------------------------------------------------------------------
  /** Open the next academic question. Returns the ticket, or null when the pool is exhausted or the run is over. */
  ask({ domains = this.domains, formats = this.formats, fresh = null } = {}) {
    if (!["PLAYING", "FEEDBACK", "RECOVERY"].includes(this.fsm.state)) return null;
    if (this.expiredPending || this.over()) return null;
    let choice;
    if (fresh)
      choice = {
        prompt: fresh,
        reason: {
          en: "A fresh try at the same skill.",
          es: "Un nuevo intento con la misma destreza.",
        },
        kind: "pulse",
      };
    else
      choice = pickNext(this.pool, this.adaptive, {
        profile: this.profile,
        rng: this.rng,
        domains,
        formats,
      });
    if (!choice) return null;
    if (choice.clearTransfer) this.adaptive = clearTransfer(this.adaptive, choice.clearTransfer);
    this.seq += 1;
    const t = {
      id: `${this.runId}:q${this.seq}`,
      prompt: choice.prompt,
      reason: choice.reason,
      kind: choice.kind,
      attempt: 1,
      layersOpen: 0,
      scaffolds: [],
      decoder: false,
      hidden: [],
      pulse: fresh ? this.pulse : null,
      firstCorrect: null,
      misconception: "",
      level: targetLevel(this.profile, this.adaptive),
    };
    if (!this.fsm.go("QUESTION_ACTIVE")) return null;
    this.ticket = t;
    if (this.questionPausesClock) this.clock.hold("question");
    this.bus.emit("question", this.publicTicket());
    return this.publicTicket();
  }

  publicTicket() {
    const t = this.ticket;
    if (!t) return null;
    const p = t.prompt;
    return {
      id: t.id,
      prompt: p,
      reason: t.reason,
      kind: t.kind,
      attempt: t.attempt,
      layersOpen: t.layersOpen,
      layersAllowed: layersAllowed(this.adaptive, p, this.profile.level),
      hidden: [...t.hidden],
      scaffolds: [...t.scaffolds],
      decoder: t.decoder,
      revealed: Boolean(t.revealed),
    };
  }

  /** Open the next scaffold layer (free; recorded as help, so the result is "with help"). */
  scaffold(ticketId) {
    const t = this.ticket;
    if (!t || t.id !== ticketId || !["QUESTION_ACTIVE", "RECOVERY"].includes(this.fsm.state))
      return null;
    if (t.layersOpen >= layersAllowed(this.adaptive, t.prompt, this.profile.level)) return null;
    const layer = t.prompt.scaffoldLevels[t.layersOpen];
    if (!layer) return null;
    t.layersOpen += 1;
    t.scaffolds.push(layer.kind);
    if (layer.kind === "eliminate") t.hidden = eliminable(t.prompt, this.rng);
    this.bus.emit("scaffold", { ticket: t.id, layer: layer.kind });
    return { layer, hidden: [...t.hidden] };
  }

  /** Context Decoder upgrade: a prompt-tied clue and up to two wrong options removed. */
  useDecoder(ticketId) {
    const t = this.ticket;
    if (!t || t.id !== ticketId || !["QUESTION_ACTIVE", "RECOVERY"].includes(this.fsm.state))
      return null;
    const r = consume(this.economy, "decoder", `${t.id}:decoder`);
    if (!r.ok) return null;
    this.economy = r.state;
    t.decoder = true;
    const hidden = eliminable(t.prompt, this.rng);
    t.hidden = [...new Set([...t.hidden, ...hidden])];
    this.bus.emit("upgrade", { id: "decoder" });
    return { clue: decoderClue(t.prompt), hidden: [...t.hidden] };
  }

  /** Chrono Freeze: the game-mode timer stops for 10 s. No effect (and no charge) in an untimed run. */
  useFreeze() {
    if (!this.clock.timed || this.clock.expired) return false;
    const r = consume(
      this.economy,
      "freeze",
      `${this.runId}:freeze:${this.seq}:${this.clock.elapsed | 0}`,
    );
    if (!r.ok) return false;
    this.economy = r.state;
    this.clock.freeze(10000);
    this.bus.emit("upgrade", { id: "freeze" });
    return true;
  }

  /** Grapple Save (Syntax Odyssey): spends one so the game can lift the player back to the last safe ledge. */
  useGrapple() {
    const r = consume(
      this.economy,
      "grapple",
      `${this.runId}:grapple:${this.seq}:${this.records.length}:${(this.grapples = (this.grapples || 0) + 1)}`,
    );
    if (!r.ok) return false;
    this.economy = r.state;
    this.bus.emit("upgrade", { id: "grapple" });
    return true;
  }

  /**
   * Submit a response. Idempotent per ticket attempt: a repeated submit returns the first result.
   * Attempt 1 wrong -> RECOVERY (targeted feedback, a second try). Attempt 2 wrong -> answer shown.
   */
  submit(ticketId, response) {
    const t = this.ticket;
    if (!t || t.id !== ticketId)
      return (
        this.settled.get(
          `${ticketId}:${response === undefined ? "" : JSON.stringify(response)}`,
        ) || { ok: false, reason: "stale" }
      );
    const key = `${t.id}:a${t.attempt}`;
    if (this.settled.has(key)) return this.settled.get(key);
    if (!["QUESTION_ACTIVE", "RECOVERY"].includes(this.fsm.state))
      return { ok: false, reason: "state" };
    this.fsm.go("ANSWER_EVALUATION");
    const ev = evaluate(t.prompt, response);
    const attempt = t.attempt;
    if (attempt === 1) t.firstCorrect = ev.correct;
    if (ev.misconception) t.misconception = ev.misconception.note;
    const out = {
      ok: true,
      ticket: t.id,
      attempt,
      correct: ev.correct,
      partial: ev.partial,
      misconception: ev.misconception,
      picked: ev.picked,
      shield: false,
      pay: 0,
      heartLost: false,
      rationale: t.prompt.rationale,
    };
    if (ev.correct) {
      this.afterCorrect(t, out, attempt);
    } else if (attempt === 1) {
      this.afterFirstMiss(t, out);
    } else {
      this.afterReveal(t, out);
    }
    this.settled.set(key, out);
    if (this.settled.size > 80) this.settled.delete(this.settled.keys().next().value);
    return out;
  }

  afterCorrect(t, out, attempt) {
    const independent = attempt === 1 && t.scaffolds.length === 0 && !t.decoder;
    if (attempt === 1) {
      const r = streakAfter(this.streak, true);
      this.streak = r.streak;
      const pace = this.clock.timed ? this.clock.remaining / this.clock.limitMs : 0;
      const a = award(
        this.economy,
        {
          difficulty: t.prompt.difficulty,
          streak: this.streak.streak,
          independent,
          timed: this.clock.timed,
          paced: pace,
        },
        `${t.id}:pay`,
      );
      this.economy = a.state;
      out.pay = a.pay;
    } else if (t.pulse) {
      const a = awardRecovery(
        this.economy,
        { difficulty: t.prompt.difficulty, streak: this.streak.streak, pulse: true },
        `${t.id}:pay2`,
      );
      this.economy = a.state;
      out.pay = a.pay;
    } else {
      const a = awardRecovery(
        this.economy,
        { difficulty: t.prompt.difficulty, streak: this.streak.streak, pulse: false },
        `${t.id}:pay2`,
      );
      this.economy = a.state;
      out.pay = a.pay;
    }
    out.streak = this.streak.streak;
    out.tier = streakTier(this.streak.streak).name;
    out.overdrive = isOverdrive(this.streak.streak);
    this.finishTicket(t, { finalCorrect: true, attempts: attempt, revealed: false });
    this.fsm.go("FEEDBACK");
    this.bus.emit("answer", out);
  }

  afterFirstMiss(t, out) {
    const hasShield = (this.economy.stock.shield || 0) > 0;
    const sr = streakAfter(this.streak, false, { shield: hasShield });
    if (sr.shieldUsed) {
      const c = consume(this.economy, "shield", `${t.id}:shield`);
      if (c.ok) this.economy = c.state;
    }
    this.streak = sr.streak;
    out.shield = sr.shieldUsed;
    out.streak = this.streak.streak;
    if (this.maxHearts && !sr.shieldUsed) {
      this.hearts = Math.max(0, this.hearts - 1);
      out.heartLost = true;
    }
    out.hearts = this.hearts;
    t.attempt = 2;
    // The targeted hint for the second try: the distractor's own feedback, else the item's hint.
    out.recoveryHint =
      out.misconception?.note || t.prompt.scaffoldLevels.find((s) => s.kind === "hint")?.text || "";
    this.fsm.go("RECOVERY");
    this.bus.emit("answer", out);
  }

  afterReveal(t, out) {
    t.revealed = true;
    out.revealed = true;
    out.answer = t.prompt.correctAnswer;
    this.finishTicket(t, { finalCorrect: false, attempts: 2, revealed: true });
    this.fsm.go("FEEDBACK");
    this.bus.emit("answer", out);
  }

  finishTicket(t, { finalCorrect, attempts, revealed }) {
    const rec = makeRecord({
      prompt: t.prompt,
      game: this.gameId,
      mode: this.calm ? "calm" : this.mode,
      level: this.profile.level,
      band: this.profile.band,
      firstCorrect: t.firstCorrect,
      finalCorrect,
      attempts,
      scaffolds: t.scaffolds,
      decoder: t.decoder,
      revealed,
      misconception: t.misconception,
    });
    this.records.push(rec);
    this.adaptive = adaptiveRecord(this.adaptive, t.prompt, rec.outcome, {
      level: this.profile.level,
    });
    this.questions += 1;
    if (this.questionPausesClock) this.clock.release("question");
    this.lastRecord = rec;
  }

  /**
   * Recovery Pulse: after a missed question, spend one for a FRESH prompt on the same skill family. A right
   * answer pays 75% of the usual payout; the original miss stays a miss in the evidence.
   */
  useRecoveryPulse() {
    const t = this.ticket;
    if (!t || !t.revealed || this.fsm.state !== "FEEDBACK") return null;
    const fam = t.prompt.analyticsMetadata?.skillFamily;
    const cand = this.pool.filter(
      (p) =>
        p.analyticsMetadata?.skillFamily === fam &&
        p.id !== t.prompt.id &&
        !this.adaptive.recent.includes(p.id),
    );
    if (!cand.length) return null;
    const c = consume(this.economy, "recovery", `${t.id}:pulse`);
    if (!c.ok) return null;
    this.economy = c.state;
    const fresh = cand[Math.floor(this.rng() * cand.length)];
    this.pulse = true;
    const q = this.ask({ fresh });
    this.pulse = null;
    this.bus.emit("upgrade", { id: "recovery" });
    return q;
  }

  /** After feedback: carry on. Ends the run when the clock expired or hearts are gone. */
  next() {
    if (this.fsm.state !== "FEEDBACK") return this.fsm.state;
    this.ticket = null;
    if (this.hearts === 0 && this.maxHearts) {
      this.fsm.go("GAME_OVER");
      this.bus.emit("gameover", this.view());
      return "GAME_OVER";
    }
    if (this.expiredPending) {
      this.expiredPending = false;
      this.fsm.go("ROUND_COMPLETE");
      return "ROUND_COMPLETE";
    }
    this.fsm.go("PLAYING");
    return "PLAYING";
  }

  over() {
    return Boolean(this.maxHearts && this.hearts === 0);
  }

  onExpire() {
    this.bus.emit("expired", this.view());
    if (
      this.fsm.host === "QUESTION_ACTIVE" ||
      this.fsm.host === "RECOVERY" ||
      this.fsm.state === "ANSWER_EVALUATION"
    )
      this.expiredPending = true;
    else if (this.fsm.state === "PLAYING" || this.fsm.state === "FEEDBACK") {
      this.ticket = null;
      this.fsm.go(this.fsm.state === "FEEDBACK" ? "ROUND_COMPLETE" : "ROUND_COMPLETE");
    } else this.expiredPending = true;
  }

  tick(dtMs) {
    this.clock.tick(dtMs);
  }

  // ---- shop, pause, settings -------------------------------------------------------------
  openShop() {
    if (!this.fsm.go("SHOP")) return false;
    this.clock.hold("shop");
    this.bus.emit("shop", { open: true });
    return true;
  }
  closeShop() {
    if (this.fsm.state !== "SHOP") return false;
    this.clock.release("shop");
    this.fsm.back();
    this.bus.emit("shop", { open: false });
    return true;
  }
  catalog() {
    return shopCatalog(this.economy, { gameId: this.gameId });
  }
  /** Buy an upgrade. Each purchase gets its own transaction id, so a double tap cannot charge twice. */
  buy(
    itemId,
    txId = `${this.runId}:buy:${itemId}:${this.economy.spent}:${this.economy.stock[itemId] || 0}:${this.economy.matrix}`,
  ) {
    const r = purchase(this.economy, itemId, txId, { gameId: this.gameId });
    if (r.ok && !r.duplicate) {
      this.economy = r.state;
      this.bus.emit("purchase", { id: itemId, cost: r.cost });
    }
    return r;
  }
  pause() {
    if (!this.fsm.go("PAUSED")) return false;
    this.clock.hold("pause");
    return true;
  }
  resume() {
    if (this.fsm.state !== "PAUSED") return false;
    this.clock.release("pause");
    return this.fsm.back();
  }
  /** Browser hidden, Chromebook asleep, network lost: hold the clock and mark the run resumable. */
  interrupt() {
    if (this.fsm.overlay) return false;
    if (!this.fsm.go("INTERRUPTED")) return false;
    this.clock.hold("pause");
    return true;
  }
  recover() {
    if (this.fsm.state !== "INTERRUPTED") return false;
    this.clock.release("pause");
    return this.fsm.back();
  }

  // ---- finishing -------------------------------------------------------------------------
  /** End the run: RESULTS. The caller shows the summary, then calls save() and exit(). */
  finish() {
    if (["PLAYING", "FEEDBACK", "ROUND_COMPLETE", "GAME_OVER"].includes(this.fsm.state)) {
      if (this.fsm.state === "PLAYING" || this.fsm.state === "FEEDBACK")
        this.fsm.go("ROUND_COMPLETE");
      if (this.fsm.state === "GAME_OVER" || this.fsm.state === "ROUND_COMPLETE")
        this.fsm.go("RESULTS");
    }
    if (this.fsm.state === "RESULTS") {
      this.bus.emit("results", this.results());
      return true;
    }
    return false;
  }
  results() {
    return {
      game: this.gameId,
      runId: this.runId,
      mode: this.calm ? "calm" : this.mode,
      band: this.profile.band,
      gradeFocus: this.profile.gradeFocus,
      level: this.profile.level,
      shards: this.economy.shards,
      earned: this.economy.earned,
      bestStreak: this.streak.best,
      questions: this.questions,
      evidence: summarize(this.records),
      records: [...this.records],
    };
  }
  /** RESULTS -> SAVE. `write(results)` persists; a failure goes to ERROR with the run still in memory. */
  save(write) {
    if (!this.fsm.go("SAVE")) return false;
    try {
      write?.(this.results());
      this.bus.emit("saved", { runId: this.runId });
      return true;
    } catch (e) {
      this.fsm.go("ERROR");
      this.bus.emit("error", { message: String(e?.message || e) });
      return false;
    }
  }
  exit() {
    this.fsm.go("EXIT");
    this.bus.clear();
    return true;
  }
  /** Restart for a replay: a fresh economy, evidence for this run and adaptive state carried forward. */
  replay({ seed = (this.seed + 1) & 0xffffff } = {}) {
    if (!["RESULTS", "GAME_OVER", "SAVE"].includes(this.fsm.state)) return false;
    const adaptive = this.adaptive;
    this.seed = seed;
    this.rng = makeRng(seed);
    this.runId = `${this.gameId}-${seed.toString(36)}-${Date.now().toString(36)}`;
    this.seq = 0;
    this.economy = emptyEconomy();
    this.streak = emptyStreak();
    this.records = [];
    this.hearts = this.maxHearts;
    this.clock = new GameClock({ limitMs: this.timeMs, onExpire: () => this.onExpire() });
    this.adaptive = { ...adaptive, recent: [], transfer: [] };
    this.ticket = null;
    this.settled.clear();
    this.expiredPending = false;
    this.questions = 0;
    this.gameState = null;
    this.fsm.stack = [];
    this.fsm.state = "READY";
    this.bus.emit("state", { from: "RESULTS", to: "READY", replay: true });
    return true;
  }

  view() {
    return {
      state: this.fsm.state,
      shards: this.economy.shards,
      streak: this.streak.streak,
      tier: streakTier(this.streak.streak).name,
      hearts: this.hearts,
      maxHearts: this.maxHearts,
      remainingMs: this.clock.timed ? this.clock.remaining : null,
      frozenMs: this.clock.freezeMs,
      questions: this.questions,
      accuracy: this.records.length
        ? Math.round(
            (this.records.filter((r) => r.firstCorrect).length / this.records.length) * 100,
          )
        : null,
      level: this.profile.level,
      target: targetLevel(this.profile, this.adaptive),
      mode: this.calm ? "calm" : this.mode,
      support: levelProfile(this.profile.level).support,
    };
  }

  // ---- save / resume ---------------------------------------------------------------------
  serialize() {
    const t = this.ticket;
    return {
      v: SNAPSHOT_VERSION,
      gameId: this.gameId,
      runId: this.runId,
      seed: this.seed,
      rng: this.rng.state(),
      seq: this.seq,
      band: this.profile.band,
      gradeFocus: this.profile.gradeFocus,
      level: this.profile.level,
      mode: this.mode,
      calm: this.calm,
      hearts: this.hearts,
      questions: this.questions,
      state: ["QUESTION_ACTIVE", "RECOVERY", "ANSWER_EVALUATION"].includes(this.fsm.host)
        ? "QUESTION"
        : "PLAYING",
      economy: this.economy,
      streak: this.streak,
      adaptive: this.adaptive,
      records: this.records.slice(-120),
      clock: this.clock.snapshot(),
      ticket: t
        ? {
            id: t.id,
            promptId: t.prompt.id,
            attempt: t.attempt,
            layersOpen: t.layersOpen,
            scaffolds: t.scaffolds,
            decoder: t.decoder,
            hidden: t.hidden,
            firstCorrect: t.firstCorrect,
            misconception: t.misconception,
            kind: t.kind,
            reason: t.reason,
            revealed: Boolean(t.revealed),
          }
        : null,
      gameState: this.gameState,
      savedAt: new Date().toISOString(),
    };
  }

  /** Rebuild a session from a snapshot. Returns null for a corrupt or incompatible one (never a half-built run). */
  static restore(snap, { pool, questionPausesClock = true } = {}) {
    try {
      if (
        !snap ||
        snap.v !== SNAPSHOT_VERSION ||
        typeof snap.gameId !== "string" ||
        !Array.isArray(pool)
      )
        return null;
      const s = new ArcadeSession({
        gameId: snap.gameId,
        pool,
        band: snap.band,
        gradeFocus: snap.gradeFocus,
        level: snap.level,
        mode: snap.mode,
        calm: snap.calm,
        seed: snap.seed,
        questionPausesClock,
      });
      s.runId = String(snap.runId);
      s.rng.setState(snap.rng >>> 0);
      s.seq = +snap.seq || 0;
      s.hearts = Math.max(0, Math.min(s.maxHearts, +snap.hearts || 0));
      s.questions = +snap.questions || 0;
      s.economy = cleanEconomy(snap.economy);
      s.streak = { ...emptyStreak(), ...(snap.streak || {}) };
      s.adaptive = cleanAdaptive(snap.adaptive);
      s.records = cleanRecords(snap.records);
      s.clock.restore(snap.clock);
      s.gameState = snap.gameState ?? null;
      s.fsm.state = "PLAYING";
      if (snap.ticket && s.byId.has(snap.ticket.promptId)) {
        const p = s.byId.get(snap.ticket.promptId);
        s.ticket = {
          id: snap.ticket.id,
          prompt: p,
          reason: snap.ticket.reason || { en: "", es: "" },
          kind: snap.ticket.kind || "resume",
          attempt: snap.ticket.attempt === 2 ? 2 : 1,
          layersOpen: +snap.ticket.layersOpen || 0,
          scaffolds: snap.ticket.scaffolds || [],
          decoder: Boolean(snap.ticket.decoder),
          hidden: snap.ticket.hidden || [],
          firstCorrect: snap.ticket.firstCorrect ?? null,
          misconception: snap.ticket.misconception || "",
          level: s.profile.level,
          revealed: Boolean(snap.ticket.revealed),
        };
        s.fsm.state = s.ticket.attempt === 2 ? "RECOVERY" : "QUESTION_ACTIVE";
        if (s.questionPausesClock) s.clock.hold("question");
      }
      return s;
    } catch {
      return null;
    }
  }
}

export { ECONOMY_CONFIG };
