// Vocab-quest session: the stage progression and the Leitner revisit queue as one serialisable state machine.
// No DOM, no storage. The engine feeds it item records (from createItemLoop.record()) and renders what it returns.
import {
  buildStageItems,
  isClean,
  kindForBox,
  leitnerAnswer,
  leitnerStart,
  makeItem,
  mergeRecord,
  stageResult,
  unlocks,
  wordSummary,
} from "./quest-logic.js";

const fresh = () => ({
  stageIdx: 0,
  pass: 1,
  idx: 0,
  replayed: false,
  replayIds: [],
  results: {},
  done: [],
  lapsed: [],
  queue: [],
  retired: [],
  records: {},
});

export function createSession({
  activity,
  entriesById,
  shuffle,
  history = new Map(),
  seed = "q",
  saved = null,
}) {
  const stages = activity.stages;
  const st = { ...fresh(), ...(saved || {}) };
  const lapsed = new Set(st.lapsed);
  let items = [];

  const stage = () => stages[st.stageIdx];
  const entryIdsOfRevisit = () => {
    const s = stages[4];
    if (s.entryIds?.length) return s.entryIds;
    return [...new Set(stages.slice(0, 4).flatMap((x) => x.entryIds || []))];
  };
  const allEntryIds = () => entryIdsOfRevisit();

  function build() {
    const s = stage();
    if (s.kind === "revisit") return [];
    const all = buildStageItems(activity, entriesById, s, {
      seed: st.pass === 2 ? `${seed}:r` : seed,
      shuffle,
    });
    const list = st.pass === 2 ? all.filter((i) => st.replayIds.includes(i.id)) : all;
    return list.map((i) => (st.pass === 2 ? { ...i, study: false } : i));
  }
  function revisitItem() {
    const head = st.queue[0];
    if (!head) return null;
    const entry = entriesById.get(head.entryId);
    const kind = kindForBox(head.box, entry);
    const ctx = {
      entries: [...entriesById.values()],
      stageId: "revisit",
      seed: `${seed}:rv:${head.entryId}:${head.box}:${head.lapses}`,
      shuffle,
      frames: activity.frames,
    };
    return makeItem(kind, entry, ctx);
  }
  items = build();

  const api = {
    state: st,
    stages,
    stage,
    items: () => items,
    isRevisit: () => stage().kind === "revisit",
    current() {
      if (api.isRevisit()) return revisitItem();
      return items[st.idx] || null;
    },
    position() {
      return api.isRevisit()
        ? {
            i: Math.max(0, allEntryIds().length - st.queue.length),
            n: allEntryIds().length,
            remaining: st.queue.length,
          }
        : { i: Math.min(st.idx, items.length), n: items.length };
    },
    /** Open a stage the learner is allowed to enter. */
    open(i) {
      if (i > 0 && !st.done.includes(i - 1)) return false;
      st.stageIdx = i;
      st.pass = 1;
      st.idx = 0;
      st.replayed = false;
      st.replayIds = [];
      st.results = {};
      st.queue =
        stages[i].kind === "revisit" ? leitnerStart(entryIdsOfRevisit(), { lapsed, history }) : [];
      items = build();
      return true;
    },
    /** rec = {id, tries, hints, ok, tags, movedOn?}. Returns {end}. */
    submit(rec) {
      const id = rec.id;
      st.records[id] = mergeRecord(st.records[id], rec);
      const entryId = String(id).split(".").pop();
      if (api.isRevisit()) {
        const clean = isClean(rec) && !rec.movedOn;
        const out = leitnerAnswer(st.queue, clean);
        st.queue = out.queue;
        if (out.retired) st.retired.push(out.retired);
        return { end: st.queue.length === 0, clean };
      }
      const demonstrated = !!rec.ok && !rec.movedOn;
      st.results[id] = { demonstrated };
      if (!demonstrated || rec.hints > 0) lapsed.add(entryId);
      st.idx += 1;
      return { end: st.idx >= items.length };
    },
    /** After the last item of a stage pass. */
    stageEnd() {
      const res = stageResult(st.results, stage().passMark ?? 0.67);
      const canReplay = !res.passed && !st.replayed && res.retry.length > 0;
      return { res, canReplay, unlocked: unlocks(res, st.replayed) };
    },
    replay() {
      const { res } = api.stageEnd();
      st.replayed = true;
      st.pass = 2;
      st.replayIds = res.retry;
      st.idx = 0;
      items = build();
    },
    /** Mark the current stage complete (unlocks the next). */
    complete() {
      if (!st.done.includes(st.stageIdx)) st.done.push(st.stageIdx);
    },
    isDone: (i) => st.done.includes(i),
    canOpen: (i) => i === 0 || st.done.includes(i - 1),
    allDone: () => st.done.length === stages.length,
    lapsedWords: () => [...lapsed],
    snapshot: () => ({ ...st, lapsed: [...lapsed] }),
    /** Debrief: secure vs needs practice, with the effort behind it. */
    debrief() {
      const flaggedByQueue = new Set(st.retired.filter((r) => r.flagged).map((r) => r.entryId));
      return wordSummary(allEntryIds(), st.records).map((w) => ({
        ...w,
        needsPractice: !w.secure || flaggedByQueue.has(w.entryId),
        secure: w.secure && !flaggedByQueue.has(w.entryId),
      }));
    },
    allEntryIds,
  };
  return api;
}
