/**
 * The puzzles a student has made and solved, kept on this device only. Only the
 * share code is stored (nine characters, no names, no text); everything else is
 * rebuilt from it, so a damaged or hand-edited entry is simply dropped.
 */
import { decodePuzzle, encodePuzzle, normalizeCode } from "./share-code.js";

export const LIBRARY_KEY = "ewl-balance-builder-v1";
export const MAX_PUZZLES = 24;

function read(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(LIBRARY_KEY) || "{}");
    const list = Array.isArray(parsed?.codes) ? parsed.codes : [];
    const seen = new Set();
    const codes = [];
    for (const raw of list) {
      const decoded = typeof raw === "string" ? decodePuzzle(raw) : { ok: false };
      if (!decoded.ok) continue;
      const code = encodePuzzle(decoded.spec);
      if (seen.has(code)) continue;
      seen.add(code);
      codes.push(code);
    }
    return codes.slice(0, MAX_PUZZLES);
  } catch {
    return [];
  }
}

function write(storage, codes) {
  try {
    storage.setItem(LIBRARY_KEY, JSON.stringify({ v: 1, codes }));
    return true;
  } catch {
    return false;
  }
}

/** Saved codes, newest first. Never throws, even when storage is blocked. */
export const loadLibrary = (storage) => read(storage);

export function addToLibrary(storage, code) {
  const decoded = decodePuzzle(code);
  if (!decoded.ok) return read(storage);
  const canonical = encodePuzzle(decoded.spec);
  const next = [canonical, ...read(storage).filter((c) => c !== canonical)].slice(0, MAX_PUZZLES);
  write(storage, next);
  return next;
}

export function removeFromLibrary(storage, code) {
  const target = normalizeCode(code);
  const next = read(storage).filter((c) => normalizeCode(c) !== target);
  write(storage, next);
  return next;
}
