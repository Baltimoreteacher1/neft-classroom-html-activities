// What the student did, per question: first-attempt status, last status, hints, revisions. This is the only thing
// the player ever reports, and it never holds what the student typed or chose.

/** Statuses that finish a question for the student. */
const FINISHING = new Set(["correct", "review"]);

export function createSession(activity, emit) {
  const items = new Map();
  let id = randomId();
  const get = (q) => {
    if (!items.has(q.id))
      items.set(q.id, { q: q.id, first: "", final: "", hints: 0, revised: false, attempts: 0, done: false, shown: false });
    return items.get(q.id);
  };
  return {
    activity,
    get id() {
      return id;
    },
    get,
    /** Record one attempt. The first non-empty status is kept as `first`. */
    attempt(q, status) {
      if (status === "empty") return get(q);
      const r = get(q);
      r.attempts += 1;
      if (!r.first) r.first = status;
      r.final = status;
      r.revised = r.attempts > 1;
      emit({ type: "attempt", question: q.id, status, attempt: r.attempts });
      return r;
    },
    hint(q) {
      const r = get(q);
      r.hints += 1;
      emit({ type: "hint", question: q.id, hints: r.hints });
    },
    /** The student is finished with this question: right, reviewed, or looked at the answer. */
    finish(q, { shown = false } = {}) {
      const r = get(q);
      r.done = true;
      r.shown = shown || r.shown;
      emit({ type: "done", question: q.id, status: r.final, shown: r.shown });
      return r;
    },
    isDone: (q) => get(q).done,
    finishing: (status) => FINISHING.has(status),
    /** The tiny anonymous summary: one row per question the student reached. */
    summary() {
      return [...items.values()]
        .filter((r) => r.attempts > 0 || r.done)
        .map((r) => ({ q: r.q, first: r.first || r.final, final: r.final, hints: r.hints, revised: r.revised }));
    },
    reset() {
      items.clear();
      id = randomId();
    },
  };
}

function randomId() {
  const bytes = new Uint8Array(8);
  try {
    globalThis.crypto.getRandomValues(bytes);
  } catch {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
