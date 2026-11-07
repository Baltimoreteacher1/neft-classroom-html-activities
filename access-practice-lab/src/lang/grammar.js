// Grammar check-in that routes to numbered practice packs (Quill ELL Starter model).
//
// Two kinds of evidence decide the route: misses on the 14 check-in items (two per pack), and the errors.js
// detectors run over an optional short writing sample. A pack is recommended when either shows a need. The
// route is a practice suggestion, never a level; "check" confidence detector hits are not counted.
// Content: content/grammar/packs.json. Pure logic only; the view draws it.
import { detect } from "./errors.js";

export const GRAMMAR_KEY = "accessPracticeLab:v1:grammar";
export const MIN_SAMPLE_WORDS = 15;

/** The pack each high-confidence errors.js detector points to (several detectors may share one pack). */
export function detectorPackMap(packs) {
  const map = new Map();
  for (const p of packs) for (const id of p.detectors || []) if (!map.has(id)) map.set(id, p.n);
  return map;
}

/** Detector hits in the learner's sample, grouped by pack number: { n: [{ id, text }] }. */
export function sampleNeeds(packs, sample) {
  const words = String(sample || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (words < MIN_SAMPLE_WORDS) return {};
  const map = detectorPackMap(packs);
  const out = {};
  for (const hit of detect(sample)) {
    if (hit.confidence !== "high" || !map.has(hit.id)) continue;
    (out[map.get(hit.id)] ||= []).push({ id: hit.id, text: hit.text });
  }
  return out;
}

/** Check-in misses by pack number: { n: misses }. `answers` maps "n:i" to the chosen index. */
export function checkinMisses(packs, answers = {}) {
  const out = {};
  for (const p of packs)
    p.diagnostic.forEach((item, i) => {
      if (answers[`${p.n}:${i}`] !== item.answer) out[p.n] = (out[p.n] || 0) + 1;
    });
  return out;
}

export const checkinComplete = (packs, answers = {}) =>
  packs.every((p) => p.diagnostic.every((_, i) => Number.isInteger(answers[`${p.n}:${i}`])));

/**
 * The route: packs in their numbered order, each with the reasons it was chosen. Packs already finished stay
 * in the route but are marked done, so the learner sees the whole plan.
 */
export function route(packs, { answers = {}, sample = "", done = {} } = {}) {
  const misses = checkinMisses(packs, answers);
  const hits = sampleNeeds(packs, sample);
  return packs
    .filter((p) => misses[p.n] || hits[p.n])
    .sort((a, b) => a.n - b.n)
    .map((p) => ({
      n: p.n,
      id: p.id,
      misses: misses[p.n] || 0,
      hits: hits[p.n] || [],
      done: Boolean(done[p.n]),
    }));
}

/** The next pack to practise, or null when every routed pack is done. */
export const nextPack = (plan) => plan.find((p) => !p.done) || null;

/** A pack is done when every practice item has been answered right (retries allowed; it is practice). */
export const packDone = (pack, picks = {}) =>
  pack.practice.every((item, i) => picks[i] === item.answer);

/** Saved state, read defensively. */
export function normalizeGrammar(raw) {
  const v = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const ints = (o) =>
    Object.fromEntries(
      Object.entries(o && typeof o === "object" ? o : {}).filter(([, x]) => Number.isInteger(x)),
    );
  const packs = {};
  for (const [n, p] of Object.entries(v.packs && typeof v.packs === "object" ? v.packs : {}))
    if (/^\d+$/.test(n)) packs[n] = { picks: ints(p?.picks), done: p?.done === true };
  return {
    answers: ints(v.answers),
    sample: typeof v.sample === "string" ? v.sample.slice(0, 2000) : "",
    finished: v.finished === true,
    date: typeof v.date === "string" ? v.date : "",
    packs,
  };
}
