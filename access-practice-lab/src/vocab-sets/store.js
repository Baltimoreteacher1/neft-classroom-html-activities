// Where vocabulary sets live: this device only (localStorage through the lab's storage helper).
// Every write reports whether it reached the disk, so the page can say "saved" only when it is true.
import { safeJson, storage } from "../util.js";
import { cleanSet, newId } from "./model.js";

export const KEY = "accessPracticeLab:v1:vocabSets";

export function readSets() {
  const raw = safeJson(storage.get(KEY), null);
  return (Array.isArray(raw?.sets) ? raw.sets : []).map(cleanSet).filter(Boolean);
}

/** @returns {boolean} false when the browser refused the write and the sets exist only until the tab closes. */
export const writeSets = (sets) => storage.set(KEY, JSON.stringify({ v: 1, sets }));

export const getSet = (id) => readSets().find((s) => s.id === id) || null;

/** Insert or replace by id. Returns { set, saved }. */
export function saveSet(set) {
  const next = { ...set, updated: Date.now() };
  const sets = readSets();
  const at = sets.findIndex((s) => s.id === next.id);
  if (at >= 0) sets[at] = next;
  else sets.unshift(next);
  return { set: next, saved: writeSets(sets) };
}

export function deleteSet(id) {
  return writeSets(readSets().filter((s) => s.id !== id));
}

export function duplicateSet(id, copyWord = "copy") {
  const source = getSet(id);
  if (!source) return null;
  const copy = {
    ...source,
    id: newId(),
    title: `${source.title} (${copyWord})`.slice(0, 80),
    items: source.items.map((i) => ({ ...i, id: newId("w") })),
  };
  return saveSet(copy);
}
