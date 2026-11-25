// Teach It Back: saving. One localStorage key (so the Passport export carries it) and one ledger entry per finished
// explanation, so My Language Path and Time Machine can see supported and independent work. Recordings are never in
// this key: only an id that points at the device-only audio store. Nothing here leaves the device.
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { safeJson, storage } from "../util.js";
import { blankSession, normalizeState } from "./session.js";

export const KEY = "accessPracticeLab:v1:teach-back";

export const load = () => normalizeState(safeJson(storage.get(KEY), null));
export const save = (state) => storage.set(KEY, JSON.stringify(state));

export function startSession(state, id) {
  state.session = blankSession(id);
  save(state);
  return state.session;
}

/** One ledger entry for a finished explanation. A failure to write never blocks the learner. */
export function writeLedger(concept, attempt, band) {
  try {
    const ledger = loadLedger();
    const spoken = attempt.mode === "record";
    appendEntry(ledger, {
      src: spoken ? "speaking" : "writing",
      task: `teach-back:${concept.id}`,
      band,
      domain: spoken ? "Speaking" : "Writing",
      use: "Explain",
      stage: attempt.supported ? "supported" : "independent",
      kind: attempt.phase === "revise" ? "revision" : attempt.phase === "own" ? "transfer" : "first",
      supports: { frames: Boolean(attempt.frames), coach: attempt.phase === "revise" },
      m: { words: attempt.words, keyPoints: attempt.covered.length, selfChecked: attempt.self.length, teachBack: 1 },
      confidence: null,
    });
    saveLedger(ledger);
    return true;
  } catch {
    return false;
  }
}
