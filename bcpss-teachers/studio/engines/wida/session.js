// Session state for one wida-studio run: answers, flags, modes, support requests, saved on this device.
import { OBJECTIVE_TYPES, isAnswered, isScored, scoreTask, wordCount } from "./check.js";

const SAVE_DELAY = 400;

export function createSession(ctx, collection, { independent = false } = {}) {
  const saved = ctx.mode === "preview" ? {} : ctx.resume()?.state || {};
  const st = {
    mode: saved.mode || (independent ? "independent" : "instructional"),
    index: Math.min(saved.index || 0, collection.tasks.length - 1),
    answers: saved.answers || {},
    flags: saved.flags || {},
    hints: saved.hints || {},
    supports: saved.supports || {},
    tries: saved.tries || {},
    taskMode: saved.taskMode || {},
    plays: saved.plays || {},
    captions: !!saved.captions,
    rubric: saved.rubric || {},
  };
  let timer = null;
  let closed = false;
  const persist = () => {
    if (ctx.mode === "preview" || closed) return;
    ctx.save({ ...st });
  };
  const saveSoon = () => {
    clearTimeout(timer);
    timer = setTimeout(persist, SAVE_DELAY);
  };
  const flush = () => {
    clearTimeout(timer);
    persist();
  };
  if (typeof addEventListener === "function") addEventListener("pagehide", flush);

  const taskById = (id) => collection.tasks.find((t) => t.id === id);

  /** Productive tasks count as done when there is real evidence of work. */
  const productiveDone = (t, r = {}) => {
    if (t.type.startsWith("speak")) return !!(r.said || r.hasRec);
    return wordCount(r.text) >= 3;
  };
  const touched = (t) => {
    const r = st.answers[t.id] || {};
    return OBJECTIVE_TYPES.has(t.type) ? isAnswered(t, r) : t.type.startsWith("speak") ? !!(r.said || r.hasRec || r.position || Object.values(r.plan || {}).some(Boolean) || Object.values(r.checks || {}).some(Boolean)) : wordCount(r.text) > 0 || Object.values(r.exp || r.parts || r.org || {}).some(Boolean);
  };
  const status = (t) => {
    const r = st.answers[t.id] || {};
    if (OBJECTIVE_TYPES.has(t.type)) return isAnswered(t, r) ? "done" : "none";
    if (productiveDone(t, r)) return "done";
    return touched(t) ? "started" : "none";
  };

  return {
    st,
    taskById,
    saveSoon,
    flush,
    status,
    touched,
    answer: (id) => st.answers[id] || {},
    setAnswer(id, r) {
      st.answers[id] = r;
      st.taskMode[id] = st.mode;
      saveSoon();
    },
    addHint(id) {
      st.hints[id] = (st.hints[id] || 0) + 1;
      saveSoon();
    },
    requestSupports(id) {
      if (!st.supports[id]) {
        st.supports[id] = true;
        st.hints[id] = (st.hints[id] || 0) + 1;
        saveSoon();
      }
    },
    supportsRequested: (id) => !!st.supports[id],
    addTry(id) {
      st.tries[id] = (st.tries[id] || 0) + 1;
      saveSoon();
    },
    scoreAll() {
      return Object.fromEntries(collection.tasks.map((t) => [t.id, scoreTask(t, st.answers[t.id] || {})]));
    },
    /** Evidence items for ctx.items. Objective: from the score; productive: completion only, tagged unscored. */
    evidenceItems(loops) {
      const out = [];
      for (const t of collection.tasks) {
        if (!touched(t)) continue;
        const mode = st.taskMode[t.id] || st.mode;
        const tags = [`domain:${collection.domain}`, `mode:${mode}`, `type:${t.type}`];
        if (st.captions && collection.domain === "Listening") tags.push("support:captions");
        if (isScored(t)) {
          const sc = scoreTask(t, st.answers[t.id] || {});
          const loop = loops.get(t.id);
          const lr = loop?.record();
          const ok = mode === "independent" || !lr ? sc.ok : lr.ok;
          out.push({ id: t.id, tries: mode === "independent" ? 1 : Math.max(1, st.tries[t.id] || lr?.tries || 1), hints: st.hints[t.id] || 0, ok, tags: [...new Set([...tags, ...(lr?.tags || [])])] });
        } else out.push({ id: t.id, tries: 1, hints: st.hints[t.id] || 0, ok: productiveDone(t, st.answers[t.id]), tags: [...tags, "unscored"] });
      }
      return out;
    },
    close() {
      clearTimeout(timer);
      closed = true;
    },
    reopen() {
      closed = false;
    },
    reset() {
      for (const k of ["answers", "flags", "hints", "supports", "tries", "taskMode", "plays"]) st[k] = {};
      st.index = 0;
      persist();
    },
  };
}
