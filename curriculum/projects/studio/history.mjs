/** Undo/redo for design edits. Pure; snapshots are JSON strings so they cannot alias live state. */
export function createHistory(initial, limit = 100) {
  let past = [];
  let future = [];
  let present = JSON.stringify(initial);
  let lastTag = null;
  return {
    /** Record a new design. Consecutive edits that share a tag (typing in one field) collapse into one step. */
    record(design, tag = null) {
      const next = JSON.stringify(design);
      if (next === present) return false;
      if (tag === null || tag !== lastTag) {
        past.push(present);
        if (past.length > limit) past.shift();
      }
      present = next;
      future = [];
      lastTag = tag;
      return true;
    },
    breakRun() {
      lastTag = null;
    },
    undo() {
      if (!past.length) return null;
      future.push(present);
      present = past.pop();
      lastTag = null;
      return JSON.parse(present);
    },
    redo() {
      if (!future.length) return null;
      past.push(present);
      present = future.pop();
      lastTag = null;
      return JSON.parse(present);
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    steps: () => ({ undo: past.length, redo: future.length }),
  };
}
