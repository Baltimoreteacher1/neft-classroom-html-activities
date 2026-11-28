import { openStorage } from "../acc/storage/access-db.js";
import { storage } from "../util.js";

const SLOT_KEY = "accessPracticeLab:v1:mls:fluency:slot";
export const SLOTS = [1, 2, 3, 4];
const version = 1;
const writes = new Map();

export function activeSlot() {
  const slot = Number(storage.get(SLOT_KEY));
  return SLOTS.includes(slot) ? slot : 1;
}

export function selectSlot(slot) {
  if (SLOTS.includes(slot)) storage.set(SLOT_KEY, String(slot));
}

export function emptyProgress() {
  return { version, index: 0, tries: 0, correct: false, helped: false, finished: false, recent: [] };
}

export function cleanProgress(value, count) {
  if (value?.version !== version) return emptyProgress();
  const bounded = (n, cap) => Number.isInteger(n) && n >= 0 ? Math.min(n, cap) : 0;
  const recent = Array.isArray(value.recent)
    ? value.recent.slice(-12).filter((e) => typeof e?.ok === "boolean").map(({ ok, supported }) => ({ kind: "try", ok, supported: supported === true }))
    : [];
  const index = bounded(value.index, count - 1);
  const correct = value.correct === true;
  return {
    version,
    index,
    tries: bounded(value.tries, 99),
    correct,
    helped: value.helped === true,
    finished: value.finished === true && index === count - 1 && correct,
    recent,
  };
}

function enqueue(key, write) {
  const pending = (writes.get(key) || Promise.resolve()).catch(() => {}).then(write);
  writes.set(key, pending);
  pending.finally(() => { if (writes.get(key) === pending) writes.delete(key); }).catch(() => {});
  return pending;
}

export async function progressFor({ grade, sourceId, seed, level, count, learnerId }, slot) {
  const db = await openStorage();
  // An explicit opaque learner id is an in-app value. Copied activity URLs never select a learner.
  const learner = learnerId || `${await db.learnerId()}:${slot}`;
  const key = `mls:fluency:v1:${learner}:${grade}:${sourceId}:${seed}:${level}:${count}`;
  const journalKey = `mls:fluency-journal:v1:${learner}:${grade}:${sourceId}`;
  await writes.get(key)?.catch(() => {});
  return {
    persistent: db.persistent,
    state: cleanProgress(await db.settings.get(key), count),
    save(state) {
      const snapshot = cleanProgress(state, count);
      return enqueue(key, () => db.settings.set(key, snapshot));
    },
    journal() {
      return db.settings.get(journalKey, "");
    },
    saveExplanation(text) {
      return enqueue(journalKey, () => db.settings.set(journalKey, text.trim().slice(0, 500)));
    },
  };
}
