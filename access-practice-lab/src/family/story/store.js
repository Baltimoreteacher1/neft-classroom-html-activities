// What a family's phone remembers about a story, in its own namespace OUTSIDE `accessPracticeLab:v1:` so Passport
// backup codes and class sync never carry it. Two small records, both removable with one button:
//   :story  the last approved fragment (the same text a link carries), so a refresh or an offline visit still shows it
//   :tries  which talks the family marked "we tried it" for a week, and how it went
// Nothing here is uploaded.
import { storage } from "../../util.js";
import { decodeStory, encodeStory } from "./link.js";

export const FAMILY_PREFIX = "accessPracticeLabFamily:v1";
const STORY_KEY = `${FAMILY_PREFIX}:story`;
const TRIES_KEY = `${FAMILY_PREFIX}:tries`;
const HOWS = ["tried", "easy", "hard", "help"];

const read = (key) => {
  try {
    const v = JSON.parse(storage.get(key) || "null");
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
};

/** The saved story (re-validated on every read), or null. */
export function loadSaved() {
  const saved = read(STORY_KEY);
  return saved ? decodeStory(saved.frag) : null;
}

export function saveStory(story) {
  storage.set(STORY_KEY, JSON.stringify({ frag: encodeStory(story) }));
}

/** Forget the story and the tries on this phone. */
export function clearSaved() {
  storage.remove(STORY_KEY);
  storage.remove(TRIES_KEY);
}

const weekKey = (story) => story.k || "undated";

/** `{ ticks: { <starterId>: true }, how: "tried"|"easy"|"hard"|"help", both: boolean }` for this story's week. */
export function loadTries(story) {
  const all = read(TRIES_KEY) || {};
  const t = all[weekKey(story)] || {};
  const ticks = {};
  for (const id of story.s) if (t.ticks?.[id] === true) ticks[id] = true;
  return { ticks, how: HOWS.includes(t.how) ? t.how : "tried", both: t.both === true };
}

export function saveTries(story, tries) {
  const all = read(TRIES_KEY) || {};
  all[weekKey(story)] = { ticks: tries.ticks, how: tries.how, both: tries.both };
  // Keep the last eight weeks only.
  const keys = Object.keys(all).sort().slice(-8);
  storage.set(TRIES_KEY, JSON.stringify(Object.fromEntries(keys.map((k) => [k, all[k]]))));
}
