// Device-local storage. Every read/write is guarded: private windows and blocked storage must not break the page.
import { STORAGE_PREFIX } from "../data/taxonomy.js";

const mem = new Map();
const key = (k) => STORAGE_PREFIX + k;

export function read(k, fallback = null) {
  try {
    const raw = localStorage.getItem(key(k));
    return raw == null ? (mem.has(k) ? mem.get(k) : fallback) : JSON.parse(raw);
  } catch {
    return mem.has(k) ? mem.get(k) : fallback;
  }
}

export function write(k, value) {
  mem.set(k, value);
  try {
    localStorage.setItem(key(k), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(k) {
  mem.delete(k);
  try {
    localStorage.removeItem(key(k));
  } catch {
    /* storage unavailable */
  }
}

export function keys(prefix = "") {
  const out = new Set([...mem.keys()].filter((k) => k.startsWith(prefix)));
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX + prefix)) out.add(k.slice(STORAGE_PREFIX.length));
    }
  } catch {
    /* storage unavailable */
  }
  return [...out];
}

export const update = (k, fn, fallback = null) => {
  const next = fn(read(k, fallback));
  write(k, next);
  return next;
};
