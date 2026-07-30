// small-group-reach.js — measure the one resource this studio cannot make more
// of: the fifteen minutes a teacher spends at the table.
//
// Why this exists: the studio grew across seven feature waves — vocabulary, a
// build stepper, two labs, guided practice, more practice, a check, a transfer
// item, a Prove It ladder, an evidence card, a passport, an annotation dock. Not
// one of those waves measured what it pushed out of reach. In a fixed time
// budget, adding a section subtracts from an unnamed one, and nobody could say
// which, because the studio recorded completions but never arrivals.
//
// So: record the first time a student ARRIVES at each tab, and how long it took
// to reach the first real problem. A completion rate tells you what students
// finished. A reach rate tells you what they ever saw — which is the number that
// decides whether the next wave should add a feature or delete three.
//
// Everything here is device-local and time-only: elapsed milliseconds since the
// studio booted. No timestamps, no wall-clock, nothing that could identify when
// a particular student sat down.

const KEY = "reach";

/**
 * @param {object} store  the small-group device store (nt-sg:<lessonId>)
 * @returns {{mark:(id:string)=>void, markFirstProblem:()=>void, summary:()=>object}}
 */
export function createReachLog(store) {
  const booted = Date.now();
  // Rehydrated so a student who returns tomorrow does not look like they reached
  // everything instantly — the earliest recorded arrival per tab wins.
  const reach = { ...(store?.get?.(KEY) || {}) };
  let firstProblemAt = Number(reach.__firstProblemMs) || null;

  const persist = () => {
    store?.set?.(KEY, { ...reach, __firstProblemMs: firstProblemAt });
  };

  return {
    /** First arrival at a tab, in seconds since boot. Later visits are ignored. */
    mark(id) {
      if (!id || reach[id] != null) return;
      reach[id] = Math.round((Date.now() - booted) / 1000);
      persist();
    },
    /** Called when the student first engages a real practice item. */
    markFirstProblem() {
      if (firstProblemAt != null) return;
      firstProblemAt = Math.round((Date.now() - booted) / 1000);
      persist();
    },
    /**
     * Reach summary for the evidence payload: which tabs were ever opened, and
     * how long the studio took to put a problem in front of the student.
     * Deliberately reports the tab LIST, not just a count — "reached 4 of 7" hides
     * which three nobody ever saw, and that is the actionable part.
     */
    summary() {
      const tabs = Object.keys(reach)
        .filter((id) => !id.startsWith("__"))
        .sort();
      return {
        reachedTabs: tabs,
        reachedCount: tabs.length,
        secondsToFirstProblem: firstProblemAt,
      };
    },
  };
}

export default createReachLog;
