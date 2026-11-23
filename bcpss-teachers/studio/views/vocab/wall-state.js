// Word wall reveal state machine. Pure: the view renders from it, tests drive it directly.
//
// Modes
//   definition  stage 0 = word + picture,   stage 1 = definition shown
//   image       stage 0 = picture only,     stage 1 = word shown,  stage 2 = definition shown
// A card at its last stage goes back to stage 0 on the next activation, so a teacher can re-hide it.

export const REVEAL_MODES = {
  definition: { label: "Word first", max: 1 },
  image: { label: "Picture first", max: 2 },
};

export function createWall(ids, { mode = "definition", view = "grid" } = {}) {
  let list = [...ids];
  let m = mode in REVEAL_MODES ? mode : "definition";
  let v = view === "gallery" ? "gallery" : "grid";
  let index = 0;
  const stages = new Map();
  const subs = new Set();
  const emit = () => subs.forEach((fn) => fn(api));
  const max = () => REVEAL_MODES[m].max;
  const clampIndex = () => {
    index = list.length ? Math.min(Math.max(index, 0), list.length - 1) : 0;
  };

  const api = {
    get mode() {
      return m;
    },
    get view() {
      return v;
    },
    get index() {
      return index;
    },
    get ids() {
      return [...list];
    },
    get current() {
      return list[index] ?? null;
    },
    get max() {
      return max();
    },
    stage: (id) => stages.get(id) || 0,
    showWord: (id) => m === "definition" || (stages.get(id) || 0) >= 1,
    showDefinition: (id) => (stages.get(id) || 0) >= max(),
    /** Next stage for one card; wraps to hidden after the last. Returns the new stage. */
    advance(id) {
      if (!list.includes(id)) return 0;
      const next = ((stages.get(id) || 0) + 1) % (max() + 1);
      stages.set(id, next);
      emit();
      return next;
    },
    /** Show a card fully (used while reading aloud). */
    show(id) {
      if (!list.includes(id)) return;
      stages.set(id, max());
      emit();
    },
    /** Advance whatever the gallery is showing (space bar). */
    advanceCurrent() {
      return list.length ? api.advance(list[index]) : 0;
    },
    revealAll() {
      for (const id of list) stages.set(id, max());
      emit();
    },
    hideAll() {
      stages.clear();
      emit();
    },
    setMode(next) {
      if (!(next in REVEAL_MODES) || next === m) return;
      m = next;
      stages.clear();
      emit();
    },
    setView(next) {
      if (next !== "grid" && next !== "gallery") return;
      v = next;
      emit();
    },
    /** Replace the visible id list (filter or sort). Stages of ids that remain are kept. */
    setIds(next) {
      const keep = list[index];
      list = [...next];
      const at = list.indexOf(keep);
      index = at >= 0 ? at : 0;
      clampIndex();
      for (const id of [...stages.keys()]) if (!list.includes(id)) stages.delete(id);
      emit();
    },
    goto(i) {
      if (!list.length) return;
      index = ((i % list.length) + list.length) % list.length;
      emit();
    },
    next() {
      api.goto(index + 1);
    },
    prev() {
      api.goto(index - 1);
    },
    onChange(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    snapshot: () => ({ mode: m, view: v, index, stages: Object.fromEntries(stages) }),
  };
  return api;
}
