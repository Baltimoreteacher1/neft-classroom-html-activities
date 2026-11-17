// "My saved resources": the Resource Finder's bookmark list, on this device only (no account, nothing uploaded).
// Key: accessPracticeLab:v1:saved  ->  [{ id, title, titleEs, href, savedAt }], newest first, at most 60.
// The title and link are stored with the id so the list still opens if a resource is renamed or the index has not
// loaded yet. A bad or blocked store reads as an empty list.
import { PREFIX } from "../store.js";
import { safeJson, storage } from "../util.js";

export const SAVED_KEY = `${PREFIX}:saved`;
const MAX = 60;

export function readSaved() {
  const list = safeJson(storage.get(SAVED_KEY), []);
  return Array.isArray(list)
    ? list.filter((x) => x && typeof x.id === "string" && typeof x.href === "string")
    : [];
}

export const isSaved = (id) => readSaved().some((x) => x.id === id);

/** Save or unsave a resource; returns true when it is now saved. */
export function toggleSaved({ id, title, titleEs = "", href }) {
  const list = readSaved();
  const at = list.findIndex((x) => x.id === id);
  if (at >= 0) {
    list.splice(at, 1);
    storage.set(SAVED_KEY, JSON.stringify(list));
    return false;
  }
  list.unshift({ id, title, titleEs, href, savedAt: new Date().toISOString() });
  storage.set(SAVED_KEY, JSON.stringify(list.slice(0, MAX)));
  return true;
}
