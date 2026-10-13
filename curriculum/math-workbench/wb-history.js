/* Math Workbench — undo/redo history.
 *
 * The first version kept a full JSON snapshot of the page for each of up to 60
 * steps, so a heavy page (400 strokes x 150 points + 120 objects, ~2.4 MB) held
 * ~140 MB of strings. This engine keeps the same user-visible behaviour with
 * structural sharing instead:
 *
 *   - committed ink strokes are never mutated (erasing removes whole strokes),
 *     so a step stores references to them, not copies;
 *   - each object is stored as its own JSON string, and an object that did not
 *     change since the previous step re-uses that exact string;
 *   - the history is capped by step count AND by an estimated byte budget.
 *
 * Behaviour matches the old code: a push identical to the current step is
 * ignored, a push after undo drops the redo tail, the oldest step falls off at
 * the cap, and undo/redo restore exactly what was captured.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WBHist = api;
})(typeof window !== "undefined" ? window : globalThis, () => {
  "use strict";

  const PT_BYTES = 40; // rough heap cost of one {x,y,t} stroke point
  const OBJ_OVERHEAD = 48;

  /** Capture the page. `prev` (optional) lets unchanged objects share strings. */
  function capture(state, prev) {
    const prevMap = prev ? prev.map : null;
    const prevStrokes = prev ? prev.strokeSet : null;
    const objs = [];
    const map = new Map();
    let cost = 96 + state.strokes.length * 8;
    for (const o of state.objects) {
      let s = JSON.stringify(o);
      const old = prevMap && prevMap.get(o.id);
      if (old === s) s = old;
      else cost += s.length + OBJ_OVERHEAD;
      objs.push(s);
      map.set(o.id, s);
    }
    const strokes = state.strokes.slice();
    const strokeSet = new Set(strokes);
    for (const st of strokes) {
      if (!prevStrokes || !prevStrokes.has(st))
        cost += (st.pts ? st.pts.length : 0) * PT_BYTES + 64;
    }
    return { strokes, strokeSet, objs, map, bg: state.bg, pages: state.pages, cost };
  }

  function equal(a, b) {
    if (!a || !b) return false;
    if (a.bg !== b.bg || a.pages !== b.pages) return false;
    if (a.strokes.length !== b.strokes.length || a.objs.length !== b.objs.length) return false;
    for (let i = 0; i < a.strokes.length; i++) if (a.strokes[i] !== b.strokes[i]) return false;
    for (let i = 0; i < a.objs.length; i++) if (a.objs[i] !== b.objs[i]) return false;
    return true;
  }

  /** Fresh arrays/objects for the live page; strokes stay shared (immutable). */
  function restore(entry) {
    return {
      strokes: entry.strokes.slice(),
      objects: entry.objs.map((s) => JSON.parse(s)),
      bg: entry.bg,
      pages: entry.pages,
    };
  }

  function create(opts) {
    const maxEntries = (opts && opts.maxEntries) || 60;
    const maxBytes = (opts && opts.maxBytes) || 12 * 1024 * 1024;
    let steps = [];
    let pos = -1;

    const bytes = () => steps.reduce((n, s) => n + s.cost, 0);
    function trim() {
      // Never drop the current step; drop from the old end first.
      while (steps.length > 1 && (steps.length > maxEntries || bytes() > maxBytes)) {
        steps.shift();
        pos--;
      }
      if (pos < 0) pos = 0;
    }

    return {
      /** Forget everything; optionally seed with the page as the new baseline. */
      reset(state) {
        steps = [];
        pos = -1;
        if (state) {
          steps.push(capture(state, null));
          pos = 0;
        }
      },
      /** Record the page. Returns false when nothing changed since the last step. */
      push(state) {
        const cur = steps[pos];
        const next = capture(state, cur);
        if (equal(cur, next)) return false;
        steps.splice(pos + 1);
        steps.push(next);
        pos = steps.length - 1;
        trim();
        return true;
      },
      undo() {
        if (pos <= 0) return null;
        pos--;
        return restore(steps[pos]);
      },
      redo() {
        if (pos >= steps.length - 1) return null;
        pos++;
        return restore(steps[pos]);
      },
      canUndo: () => pos > 0,
      canRedo: () => pos < steps.length - 1,
      size: () => steps.length,
      bytes,
    };
  }

  return { create, capture, equal, restore };
});
