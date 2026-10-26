// Anonymous reading preferences, annotations, vocabulary, and learning evidence.
// All records remain in the existing ACCESS Lab device-local storage contract.
import { PREFIX } from "./store.js";
import { safeJson, storage } from "./util.js";

export const READING_KEY = `${PREFIX}:readingRoom`;
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
