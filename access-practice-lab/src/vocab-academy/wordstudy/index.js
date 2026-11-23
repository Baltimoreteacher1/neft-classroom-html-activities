// Word Study — public API (SPEC §10): morphDataset(), analyzeWord(word), buildableWords(partIds), isRealDerivation(parts).
// The dataset is fetched once and cached. The other functions are synchronous and use that cache, so call
// `await morphDataset()` first (or `await ready()`); before it has loaded they answer "not loaded" rather than guess.
import { CONTENT_BASE } from "../contract.js";
import * as M from "./model.js";

export { GRADE_ORDER, gradeRank } from "./model.js";
export const MORPH_URL = `${CONTENT_BASE}/morphology.json`;

let dataset = null;
let index = null;
let loading = null;

/** Test hook and offline hook: install a dataset object directly. */
export function setMorphDataset(data) {
  dataset = data && Array.isArray(data.parts) && Array.isArray(data.derivations) ? data : null;
  index = dataset ? M.buildIndex(dataset) : null;
  loading = null;
  return dataset;
}
export const resetMorphDataset = () => setMorphDataset(null);

/** Fetch and cache morphology.json. Resolves to the dataset, or null when it cannot be loaded (never rejects). */
export function morphDataset(fetchImpl) {
  if (dataset) return Promise.resolve(dataset);
  loading ||= (async () => {
    try {
      const res = await (fetchImpl || fetch)(MORPH_URL, { credentials: "same-origin" });
      if (!res.ok) return null;
      const type = res.headers?.get?.("content-type") || "";
      if (type && !/json|javascript|text\/plain|octet-stream/i.test(type)) return null;
      return setMorphDataset(await res.json());
    } catch {
      return null;
    } finally {
      loading = null;
    }
  })();
  return loading;
}
export const ready = morphDataset;
export const getIndex = () => index;

const NOT_LOADED = Object.freeze({ known: false, kind: "unknown", reason: "not-loaded", segments: [] });
/** Split a word into its parts. `known:false` means "I am not sure": only listed words are ever split. */
export const analyzeWord = (word) => (index ? M.analyze(index, word) : { ...NOT_LOADED, word: String(word ?? "") });
/** Real, listed words that can be built from these part ids (base words as "base:kind"). Never anything else. */
export const buildableWords = (partIds, opts) => (index ? M.buildableWords(index, partIds, opts) : []);
/** True only when this exact ordered list of part ids is a derivation in the dataset. */
export const isRealDerivation = (parts) => (index ? M.isRealDerivation(index, parts) : false);
export const findDerivation = (parts) => (index ? M.findDerivation(index, parts) : null);
export const relatedForms = (word) => (index ? M.relatedForms(index, word) : []);
export const partsForGrade = (grade) => (index ? M.partsForGrade(index, grade) : []);
