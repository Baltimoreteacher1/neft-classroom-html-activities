// Immersive Reader engine: pure, deterministic, no DOM. Everything the Reader screens decide comes from here so it
// can be tested without a browser.
//
//   parseText     a pasted text → paragraphs, sentences and words with character offsets
//   wordAtChar    a speech-synthesis boundary → the word being spoken
//   schedule      an estimated word-by-word timeline for voices that do not report boundaries
//   chunkStarts   where a long sentence can be read in smaller pieces
//   align         what a learner said out loud → which words of the text were read and which to try again
//   lookupWord    the lab's own word list (meaning, Spanish, cognate and false-friend notes)
//   saved texts and saved words with the lab's 1 → 3 → 7 → 14 day review ladder
//
// Honest by design: the Reader never states a learner's level or score. Speech recognition can miss words, so
// "try again" words are a hint for practice, not a grade.
import { rate } from "./flashcards.js";
import { isStop, sentences as splitSentences, stem, syllables, tokenize } from "./text.js";
export { syllables };

export const LIMITS = Object.freeze({ chars: 6000, texts: 12, bank: 300, title: 60, note: 200 });
export const DEFAULT_PREFS = Object.freeze({ rate: 0.9, spotlight: false, longWords: false, chunks: false });
export const RATES = Object.freeze([0.7, 0.9, 1.05]);

/** A word as a key: lower case, curly apostrophes straightened, edge punctuation removed. */
export const norm = (w) =>
  String(w ?? "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

/** Clean pasted text: line endings, runs of blank lines, edge whitespace, and the length cap (cut at a space). */
export function cleanText(raw, max = LIMITS.chars) {
  let t = String(raw ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\u00a0]+/g, " ")
    .replace(/[ ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (t.length > max) {
    t = t.slice(0, max);
    const cut = Math.max(t.lastIndexOf(" "), t.lastIndexOf("\n"));
    if (cut > max * 0.8) t = t.slice(0, cut);
    t = t.trim();
  }
  return t;
}

/**
 * Paragraphs, sentences and words of a text, every one with its character range in `text`.
 * words[i] = { i, text, norm, start, end, s (sentence index), p (paragraph index), syl }
 * sentences[s] = { s, text, start, end, p, from, to }  (words from..to-1)
 * paragraphs[p] = { p, start, end, from, to }          (sentences from..to-1)
 */
export function parseText(raw) {
  const text = cleanText(raw);
  const paraRanges = [];
  const re = /\n\s*\n/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) paraRanges.push([last, m.index]);
    last = m.index + m[0].length;
  }
  if (last < text.length) paraRanges.push([last, text.length]);
  const paraOf = (pos) => {
    const k = paraRanges.findIndex(([a, b]) => pos >= a && pos < b);
    return k < 0 ? Math.max(0, paraRanges.length - 1) : k;
  };
  const toks = tokenize(text);
  const sents = splitSentences(text).map((s, i) => ({ s: i, text: s.text, start: s.start, end: s.end, p: paraOf(s.start), from: 0, to: 0 }));
  const words = [];
  let si = 0;
  for (const t of toks) {
    while (si < sents.length - 1 && t.start >= sents[si].end) si++;
    const idx = words.length;
    words.push({ i: idx, text: t.text, norm: norm(t.text), start: t.start, end: t.end, s: si, p: sents[si]?.p ?? 0, syl: syllables(t.text) });
  }
  for (const s of sents) {
    const inS = words.filter((w) => w.s === s.s);
    s.from = inS.length ? inS[0].i : 0;
    s.to = inS.length ? inS[inS.length - 1].i + 1 : 0;
  }
  const paragraphs = paraRanges.map(([start, end], p) => {
    const inP = sents.filter((s) => s.p === p);
    return { p, start, end, from: inP.length ? inP[0].s : 0, to: inP.length ? inP[inP.length - 1].s + 1 : 0 };
  });
  return { text, paragraphs, sentences: sents, words };
}

/** The word being spoken when a boundary event reports `charIndex` inside sentence `s`. -1 when none. */
export function wordAtChar(parsed, s, charIndex) {
  const sent = parsed.sentences[s];
  if (!sent) return -1;
  const abs = sent.start + Math.max(0, charIndex);
  for (let i = sent.from; i < sent.to; i++) {
    const w = parsed.words[i];
    if (abs >= w.start && abs < w.end) return i;
    if (w.start >= abs) return i;
  }
  return sent.to > sent.from ? sent.to - 1 : -1;
}

/** Estimated start time (ms from the sentence start) of each word, for voices that never report boundaries. */
export function schedule(parsed, s, speechRate = 0.9) {
  const sent = parsed.sentences[s];
  if (!sent) return [];
  const msPerChar = 1000 / (14 * Math.max(0.4, speechRate));
  let at = 0;
  const out = [];
  for (let i = sent.from; i < sent.to; i++) {
    const w = parsed.words[i];
    out.push({ i, at: Math.round(at) });
    const next = parsed.words[i + 1];
    const gapChars = next && next.s === s ? next.start - w.end : 0;
    const pause = /[,;:]/.test(parsed.text.slice(w.end, w.end + 1)) ? 180 : /[.!?]/.test(parsed.text.slice(w.end, w.end + 1)) ? 0 : 0;
    at += (w.end - w.start + gapChars) * msPerChar + pause;
  }
  return out;
}

const JOINERS = new Set(["and", "but", "or", "because", "so", "which", "that", "when", "while", "although", "if", "after", "before", "until", "since"]);

/** Word indexes where a new piece begins, for sentences longer than 12 words. Pieces are at least 4 words. */
export function chunkStarts(parsed) {
  const starts = new Set();
  for (const s of parsed.sentences) {
    const n = s.to - s.from;
    if (n <= 12) continue;
    let pieceStart = s.from;
    for (let i = s.from + 1; i < s.to; i++) {
      const w = parsed.words[i];
      const prev = parsed.words[i - 1];
      const afterPunct = /[,;:]/.test(parsed.text.slice(prev.end, prev.end + 1));
      const joiner = JOINERS.has(w.norm);
      if ((afterPunct || joiner) && i - pieceStart >= 4 && s.to - i >= 3) {
        starts.add(i);
        pieceStart = i;
      }
    }
  }
  return starts;
}

/** A long word is one with four or more syllables or ten or more letters. */
export const isLong = (w) => w.syl >= 4 || w.norm.length >= 10;

/** Facts about the text for the "About this text" panel. Counts only: no grade level and no score. */
export function textFacts(parsed) {
  const lengths = parsed.sentences.map((s) => s.to - s.from);
  const longest = lengths.length ? Math.max(...lengths) : 0;
  return {
    words: parsed.words.length,
    sentences: parsed.sentences.length,
    longWords: parsed.words.filter(isLong).length,
    longest,
    longestSentence: longest ? lengths.indexOf(longest) : -1,
    chunkable: chunkStarts(parsed).size > 0,
  };
}

// ── reading aloud: match what was said to the text ───────────────────────────
function lev1(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);
}
const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
/** Do a written word and a recognized word count as the same word? */
export function similar(written, said) {
  if (!written || !said) return false;
  if (written === said) return true;
  if (/^\d+$/.test(written) && NUMBER_WORDS[Number(written)] === said) return true;
  if (/^\d+$/.test(said) && NUMBER_WORDS[Number(said)] === written) return true;
  if ((written.endsWith("s") && written.slice(0, -1) === said) || (said.endsWith("s") && said.slice(0, -1) === written)) return true;
  if (written.length >= 5 && said.length >= 5 && lev1(written, said)) return true;
  if (written.length >= 4 && said.length >= 4 && stem(written) === stem(said)) return true;
  return false;
}

/**
 * Which words of the text were read, from the words recognized so far.
 * Reading is sequential: each recognized word is looked for a few words ahead of the last match. Words stepped over
 * are "retry" (try again) unless they are short function words, which recognizers often drop. If the reader jumps far
 * ahead, a long recognized word can re-anchor the match. Words beyond the last match stay "pending".
 * Returns { states[], reached, read, retry, total, practice[] }.
 */
export function align(words, transcript, { window = 6, resync = 30 } = {}) {
  const states = new Array(words.length).fill("pending");
  const spoken = tokenize(transcript).map((t) => norm(t.text)).filter(Boolean);
  let p = 0;
  let misses = 0;
  let reached = -1;
  const take = (hit) => {
    for (let k = p; k < hit; k++) states[k] = isStop(words[k].norm) || words[k].norm.length <= 2 ? "read" : "retry";
    states[hit] = "read";
    p = hit + 1;
    reached = hit;
    misses = 0;
  };
  for (const sw of spoken) {
    let hit = -1;
    for (let j = p; j < Math.min(words.length, p + window); j++) {
      if (similar(words[j].norm, sw)) {
        hit = j;
        break;
      }
    }
    if (hit >= 0) {
      take(hit);
      continue;
    }
    misses++;
    if (misses >= 3 && sw.length >= 4) {
      for (let j = p + window; j < Math.min(words.length, p + resync); j++) {
        if (similar(words[j].norm, sw)) {
          take(j);
          break;
        }
      }
    }
  }
  const practice = [];
  let read = 0;
  let retry = 0;
  for (let i = 0; i < states.length; i++) {
    if (states[i] === "read") read++;
    else if (states[i] === "retry") {
      retry++;
      practice.push(i);
    }
  }
  return { states, reached, read, retry, total: words.length, practice };
}

// ── the lab's own word list ──────────────────────────────────────────────────
let indexed = null;
let indexedFrom = null;
function indexWords(list) {
  if (indexedFrom === list && indexed) return indexed;
  const exact = new Map();
  const byStem = new Map();
  for (const e of list) {
    const k = norm(e.w);
    if (!exact.has(k)) exact.set(k, e);
    const sk = stem(k);
    if (!byStem.has(sk)) byStem.set(sk, e);
  }
  indexed = { exact, byStem };
  indexedFrom = list;
  return indexed;
}

/** The lab word-list entry for a word in a text, allowing common endings (-s, -es, -ed, -ing, -ly). Null if absent. */
export function lookupWord(list, word) {
  const w = norm(word);
  if (!w || !list?.length) return null;
  const { exact, byStem } = indexWords(list);
  if (exact.has(w)) return exact.get(w);
  const tries = [];
  for (const [suf, rep] of [["ies", "y"], ["es", ""], ["s", ""], ["ed", ""], ["ed", "e"], ["ing", ""], ["ing", "e"], ["ly", ""], ["er", ""], ["ers", ""]]) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) tries.push(w.slice(0, -suf.length) + rep);
  }
  const m = w.match(/^(.*?)(\p{L})\2(ed|ing)$/u);
  if (m) tries.push(m[1] + m[2]);
  for (const t of tries) if (exact.has(t)) return exact.get(t);
  if (w.length >= 5 && byStem.has(stem(w))) {
    const e = byStem.get(stem(w));
    if (stem(norm(e.w)) === stem(w)) return e;
  }
  return null;
}

// ── saved texts and saved words ──────────────────────────────────────────────
export const emptyState = () => ({ v: 1, texts: [], bank: {}, prefs: { ...DEFAULT_PREFS } });
const str = (v, max) => String(v ?? "").slice(0, max);

/** Validate whatever is in storage; anything malformed is dropped rather than trusted. */
export function cleanState(raw) {
  const out = emptyState();
  if (!raw || typeof raw !== "object") return out;
  if (Array.isArray(raw.texts))
    out.texts = raw.texts
      .filter((t) => t && typeof t.id === "string" && typeof t.body === "string" && t.body.trim())
      .slice(0, LIMITS.texts)
      .map((t) => ({ id: str(t.id, 24), title: str(t.title, LIMITS.title) || "My text", body: str(t.body, LIMITS.chars), at: Number(t.at) || 0 }));
  if (raw.bank && typeof raw.bank === "object")
    for (const [k, e] of Object.entries(raw.bank).slice(0, LIMITS.bank)) {
      if (!e || typeof e !== "object" || !norm(k)) continue;
      out.bank[norm(k)] = {
        word: str(e.word || k, 40),
        def: str(e.def, 240),
        es: str(e.es, 120),
        ctx: str(e.ctx, 300),
        note: str(e.note, LIMITS.note),
        box: Number.isInteger(e.box) ? Math.max(-1, Math.min(3, e.box)) : -1,
        due: Number.isFinite(e.due) ? e.due : 0,
        seen: Number.isFinite(e.seen) ? e.seen : 0,
        added: Number(e.added) || 0,
      };
    }
  const p = raw.prefs && typeof raw.prefs === "object" ? raw.prefs : {};
  out.prefs = {
    rate: RATES.includes(p.rate) ? p.rate : DEFAULT_PREFS.rate,
    spotlight: p.spotlight === true,
    longWords: p.longWords === true,
    chunks: p.chunks === true,
  };
  return out;
}

/** Save a text (newest first, same text not saved twice, oldest dropped past the cap). Returns { state, id }. */
export function saveText(state, { title = "", body = "" }, now = Date.now()) {
  const text = cleanText(body);
  if (!text) return { state, id: "" };
  const same = state.texts.find((t) => t.body === text);
  if (same) return { state: { ...state, texts: [same, ...state.texts.filter((t) => t !== same)] }, id: same.id };
  const id = `t${now.toString(36)}${state.texts.length}`;
  const entry = { id, title: str(title.trim(), LIMITS.title) || titleFrom(text), body: text, at: now };
  return { state: { ...state, texts: [entry, ...state.texts].slice(0, LIMITS.texts) }, id };
}

/** A title from the first words of a text. */
export const titleFrom = (text) => {
  const first = String(text).trim().split(/\s+/).slice(0, 6).join(" ");
  return str(first.replace(/[.!?,;:]+$/, ""), LIMITS.title) || "My text";
};

export const removeText = (state, id) => ({ ...state, texts: state.texts.filter((t) => t.id !== id) });

/** Save a word with the sentence it came from. A word already saved keeps its review progress. */
export function addWord(state, { word, ctx = "", def = "", es = "", note = "" }, today) {
  const key = norm(word);
  if (!key) return state;
  const old = state.bank[key];
  if (!old && Object.keys(state.bank).length >= LIMITS.bank) return state;
  const entry = old
    ? { ...old, ctx: old.ctx || str(ctx, 300), def: old.def || str(def, 240), es: old.es || str(es, 120), note: note ? str(note, LIMITS.note) : old.note }
    : { word: str(word, 40), def: str(def, 240), es: str(es, 120), ctx: str(ctx, 300), note: str(note, LIMITS.note), box: -1, due: today, seen: 0, added: today };
  return { ...state, bank: { ...state.bank, [key]: entry } };
}

export const removeWord = (state, word) => {
  const bank = { ...state.bank };
  delete bank[norm(word)];
  return { ...state, bank };
};

export const isSaved = (state, word) => Boolean(state.bank[norm(word)]);

/** Saved words that are ready to review, oldest due first. */
export const dueWords = (state, today) =>
  Object.entries(state.bank)
    .filter(([, e]) => e.due <= today)
    .sort((a, b) => a[1].due - b[1].due || a[1].added - b[1].added)
    .map(([key, e]) => ({ key, ...e }));

/** After the learner answers: "I know it" moves up the ladder, "Not yet" comes back tomorrow. */
export function reviewWord(state, word, knew, today) {
  const key = norm(word);
  const e = state.bank[key];
  if (!e) return state;
  return { ...state, bank: { ...state.bank, [key]: { ...e, ...rate(e, knew, today) } } };
}

/** Days until the next saved word is due (at least 1), or 0 when none are saved. */
export function daysUntilNext(state, today) {
  const dues = Object.values(state.bank).map((e) => e.due);
  return dues.length ? Math.max(1, Math.min(...dues) - today) : 0;
}
