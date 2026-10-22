// The learner's math journal: short explanations they wrote or said, kept on this device. The page reads the
// writing for four language moves (a math word, a reason, a sequence word, a way to check) and counts them.
// Nothing here marks writing wrong, grades it, or labels a learner; it only shows what the writing already does.
import { allFrameTexts } from "./language-frames.js";
import { allMovePhrases, termsInText } from "./language-terms.js";
import { readJson, writeJson } from "./language-settings.js";

export const MAX_ENTRIES = 120;
export const MAX_TEXT = 400;
// A writing sample must hold at least this many words the learner added beyond the frame and chips to earn credit.
export const OWN_WORDS = 4;
// The progress card shows no figure until the journal holds at least this many entries.
export const MIN_ENTRIES = 3;
const KEY = "ewl-language-journal-v1";
const FUNCTION_IDS = ["notice", "explain", "compare", "check", "fix"];

const plain = (text) =>
  ` ${String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")} `;
const REASON =
  / (because|since|so|therefore|which means|that is why|porque|ya que|por eso|entonces|asi que|por lo tanto|lo cual) /;
const SEQUENCE =
  / (first|then|next|after|finally|last|primero|luego|despues|finalmente|por ultimo) /;
const CHECK =
  / (check|checked|verify|verified|estimate|estimated|inverse|inversa|opposite|comprob\w*|verific\w*|revis\w*|estim\w*|opuest\w*) /;

// Words the learner added beyond the sentence frame and the "what I did" / "ways to check" chips. A filled-in frame
// keeps only its blanks, and a chip phrase counts for nothing, so tapping scaffolds alone earns no credit.
let scaffold = null;
const scaffoldPatterns = () => {
  if (scaffold) return scaffold;
  const split = (value) => plain(value).trim().split(" ").filter(Boolean);
  scaffold = {
    frames: allFrameTexts().map((text) => text.split("___").map(split).filter((part) => part.length)),
    phrases: allMovePhrases().map(split).filter((part) => part.length),
  };
  return scaffold;
};
const find = (words, part, from) => {
  for (let at = from; at + part.length <= words.length; at += 1) if (part.every((word, k) => words[at + k] === word)) return at;
  return -1;
};
const without = (words, part, from = 0, mustStart = false) => {
  const at = find(words, part, from);
  if (at < 0 || (mustStart && at !== 0)) return null;
  return { at, rest: [...words.slice(0, at), ...words.slice(at + part.length)] };
};
export function ownWordCount(text) {
  const { frames, phrases } = scaffoldPatterns();
  let words = plain(text).trim().split(" ").filter(Boolean);
  for (const frame of frames) {
    let rest = words;
    let from = 0;
    let ok = true;
    frame.forEach((part, index) => {
      if (!ok) return;
      const cut = without(rest, part, from, index === 0);
      if (!cut) ok = false;
      else {
        rest = cut.rest;
        from = cut.at;
      }
    });
    if (ok) {
      words = rest;
      break;
    }
  }
  for (const part of phrases) {
    const cut = without(words, part);
    if (cut) words = cut.rest;
  }
  return words.length;
}

export function analyze(text) {
  const clean = String(text || "").trim();
  const flat = plain(clean);
  const terms = termsInText(clean);
  const moves = {
    term: terms.length > 0,
    reason: REASON.test(flat),
    sequence: SEQUENCE.test(flat),
    check: CHECK.test(flat),
  };
  return {
    words: clean ? clean.split(/\s+/).length : 0,
    unfilled: clean.includes("___"),
    terms,
    moves,
    count: Object.values(moves).filter(Boolean).length,
  };
}

const cleanEntry = (entry) => {
  if (!entry || typeof entry !== "object") return null;
  const text = String(entry.text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT);
  if (!text || text.includes("___")) return null;
  const read = analyze(text);
  const at = Number.isFinite(entry.at) ? Math.floor(entry.at) : 0;
  return {
    id: typeof entry.id === "string" && /^[\w-]{1,40}$/.test(entry.id) ? entry.id : `e${at}`,
    at,
    day: /^\d{4}-\d{2}-\d{2}$/.test(String(entry.day)) ? entry.day : "",
    grade: Number.isInteger(entry.grade) && entry.grade >= 1 && entry.grade <= 8 ? entry.grade : 0,
    skill: /^[\w:-]{1,40}$/.test(String(entry.skill)) ? entry.skill : "",
    fn: FUNCTION_IDS.includes(entry.fn) ? entry.fn : "explain",
    level: [1, 2, 3, 4].includes(entry.level) ? entry.level : 2,
    text,
    terms: read.terms,
    moves: read.moves,
    own: ownWordCount(text),
  };
};

export const cleanJournal = (value) =>
  Array.isArray(value) ? value.map(cleanEntry).filter(Boolean).slice(0, MAX_ENTRIES) : [];
export const loadJournal = () => cleanJournal(readJson(KEY, []));
export const saveJournal = (entries) => writeJson(KEY, cleanJournal(entries));

// Returns the saved entry, or null when the text is empty, still has blanks, or is too short to be a sentence.
export function addEntry({ text, skill, grade, fn, level, day }) {
  const entry = cleanEntry({
    id: `e${Date.now().toString(36)}`,
    at: Date.now(),
    day,
    grade,
    skill,
    fn,
    level,
    text,
  });
  if (!entry || entry.text.split(" ").length < 3) return null;
  return saveJournal([entry, ...loadJournal()]) ? entry : null;
}

export function removeEntry(id) {
  saveJournal(loadJournal().filter((entry) => entry.id !== id));
}

export function summarize(entries) {
  const list = cleanJournal(entries);
  const terms = new Set();
  const count = { term: 0, reason: 0, sequence: 0, check: 0 };
  for (const entry of list) {
    entry.terms.forEach((id) => terms.add(id));
    for (const move of Object.keys(count)) if (entry.moves[move]) count[move] += 1;
  }
  return { total: list.length, moves: count, wordsUsed: terms.size, termIds: [...terms] };
}

// The "Academic Language" figure on the progress card is evidence, not a starting score. It stays empty until the
// journal holds MIN_ENTRIES entries. Then it blends how many of the four moves the last 20 entries carried (70%),
// how many different math words they used (20%), and word lookups (10%). An entry earns credit for its moves only
// when the learner added OWN_WORDS or more words beyond the sentence frame and chips.
export function languageEvidence(entries, lookups = 0) {
  const recent = cleanJournal(entries).slice(0, 20);
  if (recent.length < MIN_ENTRIES) return null;
  // Only entries with real added words earn credit for the four moves.
  const earned = (entry) => (entry.own >= OWN_WORDS ? Object.values(entry.moves).filter(Boolean).length : 0);
  const moves = recent.reduce((sum, entry) => sum + earned(entry), 0) / (recent.length * 4);
  const credited = recent.filter((entry) => entry.own >= OWN_WORDS);
  const variety = Math.min(1, summarize(credited).wordsUsed / 12);
  const looked = Math.min(1, lookups / 10);
  return Math.round(100 * (0.7 * moves + 0.2 * variety + 0.1 * looked));
}
