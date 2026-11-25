// Word encounters: the Language Lens record. One small record per word, kept across every activity, so the lab can say
// "you met this word in Word Lab, chose it in a game, and wrote it in Teach It Back" instead of each activity keeping
// its own private word list.
//
// What it stores: the word, how many times each KIND of encounter happened (saw, heard, chose, said, wrote), which
// activities they came from, and the dates of the tested ones. It never stores student sentences, recordings or
// scores: callers pass words the activity itself named (or words found in a lab word list), and the text they came
// from is dropped.
//
// Honesty rules, enforced here and pinned by tools/word-encounters.test.mjs:
//  * seeing or hearing a word is never counted as using it; `said` and `wrote` are the only productive kinds.
//  * only TESTED encounters (chose, said, wrote) enter the review schedule, and a word's schedule is the ledger's own
//    expanding 1/3/7/14-day rule (`reviewSchedule`), so a word and an error pattern come due the same way.
//  * an encounter made with a support open (frames, word bank, hints) is supported, not independent.
//  * no word is given a level, score, rank or "mastered" flag; the summary lists what happened and nothing else.
//  * merging a backup takes the larger counter per word, so importing the same backup twice changes nothing.
import { safeJson, storage } from "../util.js";
import { ACADEMIC } from "./lexicon.js";
import { dayNumber, reviewSchedule } from "./ledger.js";

export const WORDS_KEY = "accessPracticeLab:v1:word-encounters";
export const MAX_WORDS = 1000;
export const MAX_EVENTS = 8;
/** Receptive kinds first, productive last. */
export const MODES = ["saw", "heard", "chose", "said", "wrote"];
export const PRODUCTIVE = ["said", "wrote"];
/** Kinds that test the learner and so enter the review schedule. */
const TESTED = ["chose", ...PRODUCTIVE];
/** A word met this many times with no productive use yet is offered as "try using it". */
export const TRY_USING_AFTER = 3;
/** Activities allowed to write encounters. Anything else is filed as "other" so a typo cannot invent a new bucket. */
export const SOURCES = [
  "wordlab",
  "vocab-academy",
  "teach-back",
  "claim-check",
  "demand",
  "writing",
  "speaking",
  "reading",
  "arcade",
  "bcpss",
  "family",
  "other",
];

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const count = (v) => Math.max(0, Math.min(100000, Math.trunc(Number(v)) || 0));
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

/** Longest entry: a word or a short phrase ("unit rate", "point of view"). Three words cannot make a sentence. */
export const MAX_ENTRY_WORDS = 3;
const TOKEN = String.raw`\p{L}+(?:['’-]\p{L}+)*`;
const ENTRY = new RegExp(`^${TOKEN}(?: ${TOKEN}){0,${MAX_ENTRY_WORDS - 1}}$`, "u");

/**
 * A trackable entry: a word, or a phrase of up to three words, in letters with an inner hyphen or apostrophe, 2-40 long.
 * Digits, sentence punctuation and anything longer are not an entry.
 */
export function cleanWord(text) {
  if (typeof text !== "string") return "";
  const w = text
    .normalize("NFC")
    .toLowerCase()
    .replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "")
    .replace(/ {2,}/g, " ");
  return w.length >= 2 && w.length <= 40 && ENTRY.test(w) ? w : "";
}

export const blankWords = () => ({ v: 1, words: {} });
const blankRecord = () => ({
  n: Object.fromEntries(MODES.map((m) => [m, 0])),
  s: {},
  first: 0,
  last: 0,
  ev: [],
});

function cleanRecord(raw) {
  if (!isObject(raw)) return null;
  const rec = blankRecord();
  for (const m of MODES) rec.n[m] = count(raw.n?.[m]);
  if (isObject(raw.s))
    for (const [k, v] of Object.entries(raw.s))
      if (SOURCES.includes(k) && count(v)) rec.s[k] = count(v);
  rec.first = count(raw.first);
  rec.last = count(raw.last);
  rec.ev = (Array.isArray(raw.ev) ? raw.ev : [])
    .filter((e) => isObject(e) && dayNumber(e.t) > 0)
    .filter((e) => TESTED.includes(e.m))
    .map((e) => ({ t: String(e.t).slice(0, 10), m: e.m, i: e.i ? 1 : 0, ok: e.ok ? 1 : 0 }))
    .slice(-MAX_EVENTS);
  return MODES.some((m) => rec.n[m]) ? rec : null;
}

/** Always a valid object. Words that fail validation are dropped; the cap keeps the most recently met. */
export function cleanWords(raw) {
  const out = blankWords();
  if (!isObject(raw) || raw.v !== 1 || !isObject(raw.words)) return out;
  const kept = [];
  for (const [w, r] of Object.entries(raw.words)) {
    const word = cleanWord(w);
    const rec = word ? cleanRecord(r) : null;
    if (rec) kept.push([word, rec]);
  }
  kept.sort((a, b) => b[1].last - a[1].last);
  for (const [w, r] of kept.slice(0, MAX_WORDS)) out.words[w] = r;
  return out;
}

export const loadWords = (read = (k) => storage.get(k)) =>
  cleanWords(safeJson(read(WORDS_KEY), null));
export const saveWords = (state, write = (k, v) => storage.set(k, v)) =>
  write(WORDS_KEY, JSON.stringify(cleanWords(state)));

/**
 * Record one encounter of each word. `items` are strings or `{ w, ok }` (ok: false marks a missed `chose`).
 * One call is one encounter per distinct word, however many times it appears in `items`.
 * Returns how many distinct words were recorded; unusable items are skipped, never thrown on.
 */
export function recordEncounters(
  state,
  items,
  { src = "other", mode, supported = false, ok = true, now = Date.now() } = {},
) {
  if (!MODES.includes(mode)) return 0;
  const source = SOURCES.includes(src) ? src : "other";
  const day = isoDay(now);
  const today = dayNumber(now);
  const seen = new Set();
  for (const item of Array.isArray(items) ? items : []) {
    const w = cleanWord(isObject(item) ? item.w : item);
    if (!w || seen.has(w)) continue;
    seen.add(w);
    const rec = (state.words[w] ||= blankRecord());
    rec.n[mode] += 1;
    rec.s[source] = (rec.s[source] || 0) + 1;
    rec.first ||= today;
    rec.last = Math.max(rec.last, today);
    if (TESTED.includes(mode)) {
      const hit = isObject(item) && item.ok !== undefined ? Boolean(item.ok) : Boolean(ok);
      rec.ev = [...rec.ev, { t: day, m: mode, i: supported ? 0 : 1, ok: hit ? 1 : 0 }].slice(
        -MAX_EVENTS,
      );
    }
  }
  const keep = Object.entries(state.words).sort((a, b) => b[1].last - a[1].last);
  if (keep.length > MAX_WORDS) for (const [w] of keep.slice(MAX_WORDS)) delete state.words[w];
  return seen.size;
}

/**
 * One batched read-modify-write for an activity. A failure to store never blocks the learner.
 * `io` is for tests: `{ read, write }`.
 */
export function noteWords(items, opts = {}, io = {}) {
  try {
    const state = loadWords(io.read);
    if (!recordEncounters(state, items, opts)) return false;
    saveWords(state, io.write);
    return true;
  } catch {
    return false;
  }
}

const singular = (token) => (token.length > 3 && token.endsWith("s") ? token.replace(/(?:es|s)$/, "") : token);

/**
 * Distinct entries of `vocabulary` (a Set of words and short phrases) found in `text`. The longest phrase wins at each
 * place, a phrase never crosses a sentence break, and a plural matches its singular entry ("negative numbers" finds
 * "negative number"). The text itself is not kept by anything here.
 */
export function trackedWordsIn(text, vocabulary = ACADEMIC) {
  const found = new Set();
  for (const sentence of String(text ?? "").split(/[^\p{L}'’\s-]+|\n+/u)) {
    const tokens = sentence.split(/[^\p{L}'’-]+/u).map(cleanWord).filter(Boolean);
    for (let i = 0; i < tokens.length; ) {
      let hit = 0;
      for (let n = Math.min(MAX_ENTRY_WORDS, tokens.length - i); n >= 1 && !hit; n--) {
        const gram = tokens.slice(i, i + n);
        const candidates = [gram.join(" "), [...gram.slice(0, -1), singular(gram.at(-1))].join(" ")];
        const match = candidates.find((c) => vocabulary.has(c));
        if (match) {
          found.add(match);
          hit = n;
        }
      }
      i += hit || 1;
    }
  }
  return [...found];
}

/** Incoming backup merged into this device: larger counter per word and source, union of tested dates. Idempotent. */
export function mergeWords(local, incoming) {
  const a = cleanWords(local);
  const b = cleanWords(incoming);
  const out = blankWords();
  for (const w of new Set([...Object.keys(a.words), ...Object.keys(b.words)])) {
    const x = a.words[w];
    const y = b.words[w];
    if (!x || !y) {
      out.words[w] = x || y;
      continue;
    }
    const rec = blankRecord();
    for (const m of MODES) rec.n[m] = Math.max(x.n[m], y.n[m]);
    for (const k of new Set([...Object.keys(x.s), ...Object.keys(y.s)]))
      rec.s[k] = Math.max(x.s[k] || 0, y.s[k] || 0);
    const firsts = [x.first, y.first].filter(Boolean);
    rec.first = firsts.length ? Math.min(...firsts) : 0;
    rec.last = Math.max(x.last, y.last);
    const seen = new Map();
    for (const e of [...x.ev, ...y.ev]) seen.set(`${e.t}|${e.m}|${e.i}|${e.ok}`, e);
    rec.ev = [...seen.values()].sort((p, q) => p.t.localeCompare(q.t)).slice(-MAX_EVENTS);
    out.words[w] = rec;
  }
  return cleanWords(out);
}

const total = (rec, kinds) => kinds.reduce((sum, m) => sum + rec.n[m], 0);
export const isProductive = (rec) => total(rec, PRODUCTIVE) > 0;
/** The schedule position of one word, by the ledger's rule. Null until a tested encounter exists. */
export const wordSchedule = (rec, now = Date.now()) =>
  reviewSchedule(
    rec.ev.map((e) => ({ t: e.t, independent: Boolean(e.i), ok: Boolean(e.ok) })),
    now,
  );

/**
 * What the Lens shows. Plain facts and word lists; no level, score or rank.
 *  met        words only seen or heard so far
 *  tried      words chosen in a task but not yet said or written
 *  said, wrote words used in speaking / in writing (a word can be in both)
 *  independent words used with no support open at least once
 *  tryUsing   met several times, never used: the next thing to do with them
 *  due        tested words whose review day has come, most overdue first
 */
export function lensSummary(state, now = Date.now(), { limit = 12 } = {}) {
  const words = cleanWords(state).words;
  const out = {
    total: 0,
    met: [],
    tried: [],
    said: [],
    wrote: [],
    independent: [],
    tryUsing: [],
    due: [],
    bySource: {},
  };
  for (const [w, rec] of Object.entries(words)) {
    out.total += 1;
    for (const [k, v] of Object.entries(rec.s)) out.bySource[k] = (out.bySource[k] || 0) + v;
    if (rec.n.said) out.said.push(w);
    if (rec.n.wrote) out.wrote.push(w);
    if (rec.ev.some((e) => e.i && e.ok && PRODUCTIVE.includes(e.m))) out.independent.push(w);
    if (!isProductive(rec)) {
      (rec.n.chose ? out.tried : out.met).push(w);
      if (total(rec, MODES.slice(0, 3)) >= TRY_USING_AFTER) out.tryUsing.push(w);
    }
    const sched = wordSchedule(rec, now);
    if (sched?.due)
      out.due.push({
        w,
        daysSince: sched.daysSince,
        interval: sched.interval,
        over: sched.daysSince - sched.interval,
      });
  }
  out.due.sort((p, q) => q.over - p.over || p.w.localeCompare(q.w));
  out.due = out.due.slice(0, limit);
  const cap = Math.max(limit * 4, 48);
  for (const k of ["met", "tried", "said", "wrote", "independent", "tryUsing"])
    out[k] = out[k].sort().slice(0, cap);
  return out;
}
