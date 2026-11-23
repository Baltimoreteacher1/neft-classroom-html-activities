// The editor's one source of truth: the activity being edited, with undo/redo and change notification.
// Every edit goes through apply(): a function that changes a copy, which is then normalized (so sizes, ids and
// types can never go wrong) and pushed on the undo stack. Typing coalesces under one key, so one Undo removes one
// burst of typing, not one letter.

import { normalizeActivity } from "../core/schema.js";
import { validateActivity } from "../core/validate.js";

const MAX_UNDO = 60;
const COALESCE_MS = 1200;

export function createStore(initial, { now = () => Date.now() } = {}) {
  let current = normalizeActivity(initial);
  const undoStack = [];
  let redoStack = [];
  let lastKey = "";
  let lastAt = 0;
  let report = null;
  const listeners = new Set();
  const emit = (reason) => {
    report = null;
    for (const fn of listeners) fn(current, reason);
  };
  const clone = (a) => JSON.parse(JSON.stringify(a));

  return {
    get: () => current,
    /** Cached validation of the current content. */
    report() {
      report ||= validateActivity(current);
      return report;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /**
     * @param {(draft: object) => void} mutate  changes a copy in place
     * @param {{coalesce?: string, reason?: string}} opts  same `coalesce` within 1.2s = one undo step
     */
    apply(mutate, { coalesce = "", reason = "edit" } = {}) {
      const draft = clone(current);
      mutate(draft);
      const next = normalizeActivity({
        ...draft,
        id: current.id,
        rev: current.rev,
        createdAt: current.createdAt,
        updatedAt: now(),
      });
      if (JSON.stringify(next) === JSON.stringify(current)) return false;
      const t = now();
      const merge =
        coalesce && coalesce === lastKey && t - lastAt < COALESCE_MS && undoStack.length;
      if (!merge) {
        undoStack.push(current);
        if (undoStack.length > MAX_UNDO) undoStack.shift();
      }
      lastKey = coalesce;
      lastAt = t;
      redoStack = [];
      current = next;
      emit(reason);
      return true;
    },
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
    undo() {
      const prev = undoStack.pop();
      if (!prev) return false;
      redoStack.push(current);
      current = prev;
      lastKey = "";
      emit("undo");
      return true;
    },
    redo() {
      const next = redoStack.pop();
      if (!next) return false;
      undoStack.push(current);
      current = next;
      lastKey = "";
      emit("redo");
      return true;
    },
    /** Server-assigned fields after a save: keeps content, adopts the new rev. */
    adoptRev(rev) {
      current = { ...current, rev };
      emit("rev");
    },
    /** Replace everything (restore a revision, switch kind). Undoable. */
    replace(activity, reason = "replace") {
      undoStack.push(current);
      redoStack = [];
      current = normalizeActivity({
        ...activity,
        id: current.id,
        rev: current.rev,
        createdAt: current.createdAt,
      });
      lastKey = "";
      emit(reason);
    },
  };
}
