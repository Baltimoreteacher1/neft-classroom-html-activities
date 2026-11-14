// "What I said": a plain read-back of one spoken take. Pure and on-device. It marks the learner's own words
// (word-bank words and the linking words their purpose uses), lists which ones they used, checks the purpose
// moves, and describes pace as an OBSERVATION. Pace and pauses are never scored, judged or compared with a target
// (PLATFORM.md: the rubric never scores speed or pauses), so nothing here returns good/bad, a band or a goal.
import { bankKey, bankWordsUsed } from "./analyze.js";
import { CONNECTORS } from "./lexicon.js";
import { purposeMoves } from "./purpose.js";
import { findPhrase, wordCount } from "./text.js";

/** Which connector jobs each Key Language Use leans on. Narrate is about order; the others link ideas. */
export const LINK_JOBS = Object.freeze({
  Narrate: ["sequence"],
  Inform: ["sequence", "addition", "example"],
  Explain: ["sequence", "cause"],
  Argue: ["stance", "cause", "evidence", "contrast"],
});
export const linkJobsFor = (keyUse) => LINK_JOBS[keyUse] || LINK_JOBS.Explain;

/** Words per second that a typed transcript can plausibly match (outside this, it is probably not what was said). */
export const PLAUSIBLE_RATE = Object.freeze({ min: 0.7, max: 4.5, minSecondsForLow: 8 });

/** "high" | "low" | "" — how a transcript's length fits the measured speaking time. */
export function transcriptFit(words, speechSeconds) {
  if (!words || !speechSeconds) return "";
  const rate = words / speechSeconds;
  if (rate > PLAUSIBLE_RATE.max) return "high";
  if (rate < PLAUSIBLE_RATE.min && speechSeconds >= PLAUSIBLE_RATE.minSecondsForLow) return "low";
  return "";
}

/** Non-overlapping spans, earlier and longer first; on a tie the earlier list entry (bank) wins. */
function mergeSpans(spans) {
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end || a.rank - b.rank);
  const out = [];
  for (const s of sorted) if (!out.length || s.start >= out.at(-1).end) out.push(s);
  return out;
}

/** The transcript cut into plain and marked pieces, in order, so a view can render it without re-parsing. */
export function markedSegments(text, spans) {
  const t = String(text || "");
  const out = [];
  let at = 0;
  for (const s of mergeSpans(spans)) {
    if (s.start > at) out.push({ text: t.slice(at, s.start), kind: null });
    out.push({ text: t.slice(s.start, s.end), kind: s.kind });
    at = s.end;
  }
  if (at < t.length) out.push({ text: t.slice(at), kind: null });
  return out;
}

/** Linking words used, in the order first said, de-duplicated (a longer phrase hides a word inside it). */
function linksUsed(text, jobs) {
  const spans = [];
  for (const job of jobs)
    for (const p of CONNECTORS[job] || [])
      for (const h of findPhrase(text, p)) spans.push({ ...h, cue: p, kind: "link", rank: 1 });
  const kept = mergeSpans(spans);
  const words = [];
  for (const s of kept) if (!words.includes(s.cue)) words.push(s.cue);
  return { spans: kept, words };
}

/**
 * Pace as an observation. Counted over the stretch from the first to the last sound, so a slow start does not
 * change it. Returns { wpm, longestRun } or { wpm: null, reason } when it cannot be measured honestly.
 */
export function paceObservation(words, audio) {
  if (!audio) return { wpm: null, reason: "no-recording" };
  if (!audio.ok) return { wpm: null, reason: audio.reason || "no-speech" };
  const segs = audio.segments || [];
  const span = segs.length ? segs.at(-1).end - segs[0].start : audio.speechSeconds;
  if (words < 5 || !(span >= 3)) return { wpm: null, reason: "too-short" };
  if (transcriptFit(words, audio.speechSeconds)) return { wpm: null, reason: "mismatch" };
  return {
    wpm: Math.max(5, Math.round((words / span) * 12) * 5),
    longestRun: Math.round(audio.longestRun || 0),
  };
}

/**
 * Everything the "What I said" panel shows for one take.
 * @param {string} transcript the learner's words (from speech recognition or typed)
 * @param {{ keyUse?: string, wordBank?: string[], audio?: object|null }} opts
 */
export function speechFeedback(
  transcript,
  { keyUse = "Explain", wordBank = [], audio = null } = {},
) {
  const text = String(transcript || "");
  const words = wordCount(text);
  const bank = [
    ...new Map(
      (wordBank || [])
        .map(String)
        .filter((w) => bankKey(w))
        .map((w) => [bankKey(w), w]),
    ).values(),
  ];
  const used = bankWordsUsed(text, bank);
  const bankSpans = used.flatMap((w) =>
    findPhrase(text, bankKey(w)).map((h) => ({ ...h, kind: "bank", rank: 0 })),
  );
  const jobs = linkJobsFor(keyUse);
  const links = linksUsed(text, jobs);
  const moves = purposeMoves(text, keyUse, { words });
  return {
    words,
    segments: markedSegments(text, [...bankSpans, ...links.spans]),
    bank: { used, unused: bank.filter((w) => !used.includes(w)), total: bank.length },
    links: {
      words: links.words,
      kind: jobs.length === 1 && jobs[0] === "sequence" ? "order" : "linking",
    },
    moves: moves.moves
      .filter((m) => m.required)
      .map((m) => ({ id: m.id, label: m.label, present: m.present })),
    keyUse: moves.keyUse,
    pace: paceObservation(words, audio),
  };
}
