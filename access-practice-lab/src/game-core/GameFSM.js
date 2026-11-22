// GameFSM.js — Deterministic Finite State Machine for ACCESS Practice Lab Games & Worlds.
// Enforces explicit lifecycle states: IDLE -> BRIEFING -> PLAYING -> FEEDBACK -> ROUND_SUMMARY -> REPLAY_WEAK_SPOTS
// Includes Pause / Zen Mode toggle (no punitive clocks; anxious learners are never penalized by speed)
// and clean teardown for zero memory leaks.

export const FSM_STATES = Object.freeze({
  IDLE: "IDLE",
  BRIEFING: "BRIEFING",
  PLAYING: "PLAYING",
  FEEDBACK: "FEEDBACK",
  ROUND_SUMMARY: "ROUND_SUMMARY",
  REPLAY_WEAK_SPOTS: "REPLAY_WEAK_SPOTS",
});

// Bidirectional mapping between legacy studio session phases and canonical FSM states
const LEGACY_TO_FSM = Object.freeze({
  idle: FSM_STATES.IDLE,
  start: FSM_STATES.BRIEFING,
  briefing: FSM_STATES.BRIEFING,
  play: FSM_STATES.PLAYING,
  playing: FSM_STATES.PLAYING,
  feedback: FSM_STATES.FEEDBACK,
  transfer: FSM_STATES.ROUND_SUMMARY,
  done: FSM_STATES.ROUND_SUMMARY,
  summary: FSM_STATES.ROUND_SUMMARY,
  replay: FSM_STATES.REPLAY_WEAK_SPOTS,
  weak_spots: FSM_STATES.REPLAY_WEAK_SPOTS,
});

const FSM_TO_LEGACY = Object.freeze({
  [FSM_STATES.IDLE]: "start",
  [FSM_STATES.BRIEFING]: "start",
  [FSM_STATES.PLAYING]: "play",
  [FSM_STATES.FEEDBACK]: "play",
  [FSM_STATES.ROUND_SUMMARY]: "done",
  [FSM_STATES.REPLAY_WEAK_SPOTS]: "play",
});

const VALID_TRANSITIONS = Object.freeze({
  [FSM_STATES.IDLE]: [FSM_STATES.BRIEFING, FSM_STATES.PLAYING, FSM_STATES.REPLAY_WEAK_SPOTS],
  [FSM_STATES.BRIEFING]: [
    FSM_STATES.PLAYING,
    FSM_STATES.REPLAY_WEAK_SPOTS,
    FSM_STATES.ROUND_SUMMARY,
    FSM_STATES.IDLE,
  ],
  [FSM_STATES.PLAYING]: [
    FSM_STATES.FEEDBACK,
    FSM_STATES.PLAYING,
    FSM_STATES.ROUND_SUMMARY,
    FSM_STATES.REPLAY_WEAK_SPOTS,
    FSM_STATES.BRIEFING,
  ],
  [FSM_STATES.FEEDBACK]: [
    FSM_STATES.PLAYING,
    FSM_STATES.ROUND_SUMMARY,
    FSM_STATES.REPLAY_WEAK_SPOTS,
    FSM_STATES.BRIEFING,
  ],
  [FSM_STATES.ROUND_SUMMARY]: [
    FSM_STATES.BRIEFING,
    FSM_STATES.PLAYING,
    FSM_STATES.REPLAY_WEAK_SPOTS,
    FSM_STATES.IDLE,
  ],
  [FSM_STATES.REPLAY_WEAK_SPOTS]: [
    FSM_STATES.FEEDBACK,
    FSM_STATES.PLAYING,
    FSM_STATES.ROUND_SUMMARY,
    FSM_STATES.BRIEFING,
  ],
});

export function toFSMState(phaseOrState, { inFeedback = false, isWeakSpotReplay = false } = {}) {
  if (isWeakSpotReplay && (phaseOrState === "play" || phaseOrState === FSM_STATES.PLAYING)) {
    return inFeedback ? FSM_STATES.FEEDBACK : FSM_STATES.REPLAY_WEAK_SPOTS;
  }
  if (inFeedback && (phaseOrState === "play" || phaseOrState === FSM_STATES.PLAYING)) {
    return FSM_STATES.FEEDBACK;
  }
  if (FSM_STATES[phaseOrState]) return FSM_STATES[phaseOrState];
  return LEGACY_TO_FSM[String(phaseOrState || "").toLowerCase()] || FSM_STATES.BRIEFING;
}

export function toLegacyPhase(fsmState, { hasTransfer = false, transferDone = true } = {}) {
  if (fsmState === FSM_STATES.ROUND_SUMMARY && hasTransfer && !transferDone) return "transfer";
  return FSM_TO_LEGACY[fsmState] || "start";
}

export class GameFSM {
  constructor({
    gameId = "",
    band = "6-8",
    initialState = FSM_STATES.IDLE,
    zenMode = true,
    onTransition = null,
  } = {}) {
    this.gameId = String(gameId || "");
    this.band = band;
    this.state = FSM_STATES[initialState] || toFSMState(initialState);
    this.zenMode = Boolean(zenMode);
    this.paused = false;
    this.weakSpotMode = this.state === FSM_STATES.REPLAY_WEAK_SPOTS;
    this.elapsedMs = 0;
    this._lastTick = 0;
    this._rafId = 0;
    this._listeners = new Set();
    this._cleanups = new Set();
    if (typeof onTransition === "function") this._listeners.add(onTransition);
  }

  getState() {
    return this.state;
  }

  canTransition(nextState) {
    const target = FSM_STATES[nextState] || toFSMState(nextState);
    if (!target) return false;
    if (target === this.state) return true;
    const allowed = VALID_TRANSITIONS[this.state] || [];
    return allowed.includes(target);
  }

  transition(nextState, meta = {}) {
    const target = FSM_STATES[nextState] || toFSMState(nextState);
    if (!target) return this.state;
    const prev = this.state;
    if (!this.canTransition(target) && !meta.force) {
      return this.state;
    }
    this.state = target;
    if (target === FSM_STATES.REPLAY_WEAK_SPOTS) {
      this.weakSpotMode = true;
    } else if (target === FSM_STATES.BRIEFING || target === FSM_STATES.IDLE) {
      this.weakSpotMode = false;
    }
    if (
      target === FSM_STATES.PLAYING ||
      target === FSM_STATES.REPLAY_WEAK_SPOTS ||
      target === FSM_STATES.FEEDBACK
    ) {
      this._lastTick = Date.now();
    }
    const payload = {
      from: prev,
      to: this.state,
      gameId: this.gameId,
      band: this.band,
      zenMode: this.zenMode,
      paused: this.paused,
      weakSpotMode: this.weakSpotMode,
      meta,
    };
    for (const fn of this._listeners) {
      try {
        fn(payload);
      } catch {
        // Keep state transitions deterministic even if a listener fails.
      }
    }
    return this.state;
  }

  togglePause(force) {
    this.paused = typeof force === "boolean" ? force : !this.paused;
    this._lastTick = Date.now();
    for (const fn of this._listeners) {
      try {
        fn({
          from: this.state,
          to: this.state,
          gameId: this.gameId,
          band: this.band,
          zenMode: this.zenMode,
          paused: this.paused,
          weakSpotMode: this.weakSpotMode,
          meta: { action: "pause-toggle" },
        });
      } catch {}
    }
    return this.paused;
  }

  toggleZenMode(force) {
    this.zenMode = typeof force === "boolean" ? force : !this.zenMode;
    for (const fn of this._listeners) {
      try {
        fn({
          from: this.state,
          to: this.state,
          gameId: this.gameId,
          band: this.band,
          zenMode: this.zenMode,
          paused: this.paused,
          weakSpotMode: this.weakSpotMode,
          meta: { action: "zen-toggle" },
        });
      } catch {}
    }
    return this.zenMode;
  }

  subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  registerCleanup(fn) {
    if (typeof fn === "function") this._cleanups.add(fn);
    return () => this._cleanups.delete(fn);
  }

  serialize() {
    return {
      gameId: this.gameId,
      band: this.band,
      state: this.state,
      zenMode: this.zenMode,
      paused: this.paused,
      weakSpotMode: this.weakSpotMode,
      elapsedMs: this.elapsedMs,
    };
  }

  teardown() {
    if (this._rafId && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(this._rafId);
      this._rafId = 0;
    }
    for (const fn of this._cleanups) {
      try {
        fn();
      } catch {}
    }
    this._cleanups.clear();
    this._listeners.clear();
    this.paused = false;
  }
}
