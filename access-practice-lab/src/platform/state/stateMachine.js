/**
 * Deterministic Module State Machine:
 * IDLE -> ACTIVE -> EVALUATING -> FEEDBACK -> COMPLETE
 */

import { logEvent } from "../services/logger.js";

export const STATES = Object.freeze({
  IDLE: "IDLE",
  ACTIVE: "ACTIVE",
  EVALUATING: "EVALUATING",
  FEEDBACK: "FEEDBACK",
  COMPLETE: "COMPLETE",
});

const ALLOWED_TRANSITIONS = Object.freeze({
  IDLE: new Set(["ACTIVE", "EVALUATING", "IDLE"]),
  ACTIVE: new Set(["EVALUATING", "FEEDBACK", "IDLE", "ACTIVE"]),
  EVALUATING: new Set(["FEEDBACK", "ACTIVE", "IDLE"]),
  FEEDBACK: new Set(["COMPLETE", "ACTIVE", "EVALUATING", "IDLE"]),
  COMPLETE: new Set(["IDLE", "ACTIVE", "FEEDBACK"]),
});

export function createStateMachine(moduleName, initialContext = {}) {
  let state = STATES.IDLE;
  let context = { ...initialContext };
  const listeners = new Set();

  function transition(nextState, patch = {}) {
    if (!STATES[nextState]) {
      throw new Error(`Invalid state "${nextState}" in ${moduleName}`);
    }
    const allowed = ALLOWED_TRANSITIONS[state];
    if (!allowed || !allowed.has(nextState)) {
      logEvent("stateMachine", "blocked_transition", { moduleName, from: state, to: nextState });
      return false;
    }
    const prev = state;
    state = nextState;
    context = { ...context, ...patch };
    logEvent("stateMachine", "transition", { moduleName, from: prev, to: nextState });
    for (const fn of listeners) {
      try {
        fn({ state, prev, context });
      } catch {}
    }
    return true;
  }

  return {
    get state() {
      return state;
    },
    get context() {
      return context;
    },
    transition,
    reset(nextContext = {}) {
      state = STATES.IDLE;
      context = { ...initialContext, ...nextContext };
      logEvent("stateMachine", "reset", { moduleName });
      for (const fn of listeners) {
        try {
          fn({ state, prev: state, context });
        } catch {}
      }
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
