// Anonymous reading preferences, annotations, vocabulary, and learning evidence.
// All records remain in the existing ACCESS Lab device-local storage contract.
import { PREFIX } from "./store.js";
import { safeJson, storage } from "./util.js";

export const READING_KEY = `${PREFIX}:readingRoom`;
export const LOG_MAX = 60;
const fresh = () => ({
  schema: 1,
  lastRead: null,
  recent: [],
  bookmarks: [],
  settings: { fontScale: 1, lineSpacing: 1.75, width: "comfortable" },
  annotations: {},
  words: [],
  lessons: {},
  conferences: {},
  adventures: {},
  strategies: {},
  log: [],
});

export function loadReadingState() {
  const saved = safeJson(storage.get(READING_KEY), {}) || {};
  const base = fresh();
  return {
    ...base,
    ...saved,
    settings: { ...base.settings, ...(saved.settings || {}) },
    recent: Array.isArray(saved.recent) ? saved.recent.slice(0, 30) : [],
    bookmarks: Array.isArray(saved.bookmarks) ? saved.bookmarks : [],
    annotations: saved.annotations && typeof saved.annotations === "object" ? saved.annotations : {},
    words: Array.isArray(saved.words) ? saved.words.slice(-200) : [],
    lessons: saved.lessons && typeof saved.lessons === "object" ? saved.lessons : {},
    conferences: saved.conferences && typeof saved.conferences === "object" ? saved.conferences : {},
    adventures: saved.adventures && typeof saved.adventures === "object" ? saved.adventures : {},
    strategies: saved.strategies && typeof saved.strategies === "object" ? saved.strategies : {},
    log: Array.isArray(saved.log) ? saved.log.filter((row) => row && row.t && row.title).slice(-LOG_MAX) : [],
  };
}

export function saveReadingState(state) {
  const safe = {
    ...fresh(),
    ...state,
    recent: (state.recent || []).slice(0, 30),
    words: (state.words || []).slice(-200),
  };
  return storage.set(READING_KEY, JSON.stringify(safe));
}

export function clearReadingState() {
  storage.remove(READING_KEY);
}

/**
 * Add one entry to the independent reading log: any text the learner read, in or out of the lab.
 * Returns the new entry, or null when there is no title. Minutes are optional (1–240); the note is the
 * learner's own words. Nothing here is scored.
 */
export function addReadingLog(state, { title = "", minutes = "", note = "" } = {}, now = new Date()) {
  const clean = String(title).trim().slice(0, 80);
  if (!clean) return null;
  const m = Number.parseInt(minutes, 10);
  const entry = {
    t: now.toISOString(),
    title: clean,
    minutes: Number.isFinite(m) && m >= 1 && m <= 240 ? m : null,
    note: String(note).trim().slice(0, 140),
  };
  state.log = [...(state.log || []), entry].slice(-LOG_MAX);
  return entry;
}

/** Texts and minutes in the last `days` days, and how many different days had reading. */
export function readingLogSummary(log = [], now = new Date(), days = 7) {
  const since = now.getTime() - days * 864e5;
  const recent = (Array.isArray(log) ? log : []).filter((row) => Date.parse(row.t) > since);
  return {
    texts: recent.length,
    minutes: recent.reduce((n, row) => n + (row.minutes || 0), 0),
    days: new Set(recent.map((row) => String(row.t).slice(0, 10))).size,
  };
}
