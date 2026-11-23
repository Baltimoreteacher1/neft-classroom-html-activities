// Word Study — evidence + preferences, guarded so the lab also works with no Core model (standalone) or no corpus.
// Results are recorded as dimension "morph" through the Core model API (SPEC §4, §10) for words that are taught in a
// unit; a word the corpus does not teach (most derivations here) records nothing, truthfully. Preferences live in the
// learner's Vocabulary Academy progress (`prefs.wordStudy`) when there is one, else in one small lab key.
import { safeJson, storage } from "../../util.js";

export const WS_KEY = "accessPracticeLab:v1:vocabAcademyWordStudy";
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

let wordMapPromise = null;
/** headword → word id (first teaching), built once from the generated index. Resolves to an empty map when absent. */
function corpusMap() {
  wordMapPromise ||= import("../data.js")
    .then((d) => d.getIndex())
    .then((index) => {
      const map = new Map();
      for (const [id, w] of Object.entries(index?.words || {})) {
        const k = String(w.hw || "").toLowerCase();
        if (k && !map.has(k)) map.set(k, id);
      }
      return map;
    })
    .catch(() => new Map());
  return wordMapPromise;
}
export const resetCorpusMap = () => {
  wordMapPromise = null;
};

/** Preferences: { grade, built:[words], tally:{tool:{n,c}} }. */
export function readPrefs(va) {
  const own = va?.progress?.prefs?.wordStudy;
  if (isObj(own)) return own;
  const stored = safeJson(storage.get(WS_KEY), {});
  return isObj(stored) ? stored : {};
}
export function writePrefs(va, patch) {
  const next = { ...readPrefs(va), ...patch };
  if (isObj(va?.progress)) {
    va.progress.prefs = isObj(va.progress.prefs) ? va.progress.prefs : {};
    va.progress.prefs.wordStudy = next;
    try {
      va.save?.();
    } catch {
      // saving is best effort here; the page keeps working
    }
  } else {
    storage.set(WS_KEY, JSON.stringify(next));
  }
  return next;
}

/**
 * Record one answer about a word's parts. Returns { recorded, wordId? }.
 * Never throws: a missing model, missing index or unknown word just means nothing is recorded.
 */
export async function recordMorph(va, word, ok, { tool = "word-study" } = {}) {
  try {
    const prefs = readPrefs(va);
    const t = isObj(prefs.tally) ? { ...prefs.tally } : {};
    const row = isObj(t[tool]) ? { ...t[tool] } : { n: 0, c: 0 };
    row.n += 1;
    row.c += ok ? 1 : 0;
    t[tool] = row;
    writePrefs(va, { tally: t });
    if (!isObj(va?.progress)) return { recorded: false };
    const id = (await corpusMap()).get(String(word).toLowerCase());
    if (!id) return { recorded: false };
    const model = await import("../model.js");
    model.recordResult(va.progress, { wordId: id, dim: "morph", ok: Boolean(ok), sup: [], type: "word-study" });
    va.save?.();
    return { recorded: true, wordId: id };
  } catch {
    return { recorded: false };
  }
}
