// Book Studio storage, on this device only (PLATFORM.md rule 3: nothing is uploaded unless the learner sends a book to
// a joined class). IndexedDB holds books, their media (pictures, recordings, videos) and saved versions. A small
// synchronous recovery copy in localStorage is written on every change, so a crash or a closed tab between autosaves
// loses nothing. A save is reported only after the IndexedDB transaction completes.
import { LIMITS, migrate, normalizeBook } from "./model.js";

const DB = "accessPracticeLab-books";
const VERSION = 1;
const RECOVERY = (id) => `accessPracticeLab:v1:book-recovery:${id}`;
const LAST = "accessPracticeLab:v1:book-last";
const READ_PAGE = (id) => `accessPracticeLab:v1:book-read:${id}`;

let dbPromise = null;
export const available = () => typeof indexedDB !== "undefined";

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!available()) return reject(new Error("unavailable"));
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("books")) db.createObjectStore("books", { keyPath: "id" });
      if (!db.objectStoreNames.contains("media"))
        db.createObjectStore("media", { keyPath: "id" }).createIndex("bookId", "bookId");
      if (!db.objectStoreNames.contains("versions"))
        db.createObjectStore("versions", { keyPath: "vid", autoIncrement: true }).createIndex(
          "bookId",
          "bookId",
        );
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
    req.onblocked = () => reject(new Error("blocked"));
  });
  return dbPromise;
}

async function tx(stores, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(stores, mode);
    let out;
    try {
      out = fn(...[].concat(stores).map((s) => t.objectStore(s)));
    } catch (error) {
      t.abort();
      return reject(error);
    }
    t.oncomplete = () => resolve(out && "result" in out ? out.result : out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error("aborted"));
  });
}

// ── books ────────────────────────────────────────────────────────────────────

/** Every book, newest edit first (pages included; the bookshelf draws real covers). */
export async function listBooks() {
  const rows = (await tx("books", "readonly", (s) => s.getAll())) || [];
  const books = [];
  for (const r of rows) {
    try {
      books.push(migrate(r));
    } catch {}
  }
  return books.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getBook(id) {
  const raw = await tx("books", "readonly", (s) => s.get(id));
  return raw ? migrate(raw) : null;
}

export class ConflictError extends Error {
  constructor(stored) {
    super("conflict");
    this.stored = stored;
  }
}

/**
 * Save a book. `baseRev` is the revision the editor started from; if the stored copy has moved past it (another tab
 * saved), the save is refused with a ConflictError instead of overwriting the other tab's work.
 * Resolves with the saved book (rev incremented) only after the transaction commits.
 */
export async function saveBook(book, { baseRev = null, touch = true } = {}) {
  const clean = normalizeBook(book);
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction("books", "readwrite");
    const store = t.objectStore("books");
    let saved = null;
    const get = store.get(clean.id);
    get.onsuccess = () => {
      const stored = get.result;
      if (stored && baseRev != null && (stored.rev || 0) > baseRev) {
        t.abort();
        reject(new ConflictError(migrate(stored)));
        return;
      }
      saved = {
        ...clean,
        rev: Math.max(clean.rev, stored?.rev || 0) + 1,
        updatedAt: touch ? new Date().toISOString() : clean.updatedAt,
      };
      store.put(saved);
    };
    t.oncomplete = () => {
      clearRecovery(saved.id);
      broadcast({ type: "saved", id: saved.id, rev: saved.rev });
      resolve(saved);
    };
    t.onerror = () => reject(t.error);
    t.onabort = () => {
      if (!saved) return; // already rejected as a conflict
      reject(t.error || new Error("aborted"));
    };
  });
}

/** Delete a book with its media and versions. */
export async function deleteBook(id) {
  await tx(["books", "media", "versions"], "readwrite", (books, media, versions) => {
    books.delete(id);
    for (const [store] of [[media], [versions]]) {
      const req = store.index("bookId").openCursor(IDBKeyRange.only(id));
      req.onsuccess = () => {
        const c = req.result;
        if (c) {
          c.delete();
          c.continue();
        }
      };
    }
  });
  clearRecovery(id);
  try {
    localStorage.removeItem(READ_PAGE(id));
  } catch {}
  broadcast({ type: "deleted", id });
}

// ── media ────────────────────────────────────────────────────────────────────

const urls = new Map();

export async function putMedia(bookId, blob, { name = "", kind = "" } = {}) {
  const id = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  await tx("media", "readwrite", (s) =>
    s.put({
      id,
      bookId,
      blob,
      type: blob.type,
      name: String(name).slice(0, 120),
      kind,
      bytes: blob.size,
      at: new Date().toISOString(),
    }),
  );
  return id;
}

/** Store a picture received from a shared class book under the id every collaborator's book already uses. */
export async function putMediaWithId(id, bookId, blob, { kind = "image" } = {}) {
  await tx("media", "readwrite", (s) =>
    s.put({ id, bookId, blob, type: blob.type, name: "", kind, bytes: blob.size, at: new Date().toISOString() }),
  );
  urls.delete(id);
  return id;
}

export async function getMedia(id) {
  if (!id) return null;
  try {
    return (await tx("media", "readonly", (s) => s.get(id))) || null;
  } catch {
    return null;
  }
}

/** An object URL for a media id (cached for the page's lifetime). */
export async function mediaUrl(id) {
  if (!id) return "";
  if (urls.has(id)) return urls.get(id);
  const row = await getMedia(id);
  if (!row?.blob) return "";
  const url = URL.createObjectURL(row.blob);
  urls.set(id, url);
  return url;
}
export const cachedUrl = (id) => urls.get(id) || "";

/** Copy media rows to another book (duplicate / remix). Returns a map old id → new id. */
export async function copyMedia(ids, toBookId) {
  const map = {};
  for (const id of ids) {
    const row = await getMedia(id);
    if (row?.blob) map[id] = await putMedia(toBookId, row.blob, { name: row.name, kind: row.kind });
  }
  return map;
}

export async function mediaBytes(bookId) {
  const rows =
    (await tx("media", "readonly", (s) => s.index("bookId").getAll(IDBKeyRange.only(bookId)))) ||
    [];
  return rows.reduce((n, r) => n + (r.bytes || 0), 0);
}

// ── versions ─────────────────────────────────────────────────────────────────

export async function saveVersion(book, label = "") {
  await tx("versions", "readwrite", (s) =>
    s.add({
      bookId: book.id,
      at: new Date().toISOString(),
      label: String(label).slice(0, 80),
      rev: book.rev,
      data: JSON.parse(JSON.stringify(book)),
    }),
  );
  const all = await listVersions(book.id);
  const extra = all.slice(LIMITS.versions);
  if (extra.length) await tx("versions", "readwrite", (s) => extra.forEach((v) => s.delete(v.vid)));
}

/** Newest first, without the stored book data. */
export async function listVersions(bookId) {
  const rows =
    (await tx("versions", "readonly", (s) => s.index("bookId").getAll(IDBKeyRange.only(bookId)))) ||
    [];
  return rows
    .sort((a, b) => b.vid - a.vid)
    .map(({ data, ...meta }) => ({ ...meta, pages: data?.pages?.length || 0 }));
}

export async function getVersion(vid) {
  const row = await tx("versions", "readonly", (s) => s.get(vid));
  return row ? migrate(row.data) : null;
}

// ── recovery, last opened, reading position ─────────────────────────────────

export function writeRecovery(book) {
  try {
    localStorage.setItem(RECOVERY(book.id), JSON.stringify({ at: new Date().toISOString(), book }));
    return true;
  } catch {
    return false; // quota: the IndexedDB autosave still runs
  }
}
export function readRecovery(id) {
  try {
    const raw = JSON.parse(localStorage.getItem(RECOVERY(id)) || "null");
    return raw?.book ? { at: raw.at, book: migrate(raw.book) } : null;
  } catch {
    return null;
  }
}
export function clearRecovery(id) {
  try {
    localStorage.removeItem(RECOVERY(id));
  } catch {}
}
export function setLast(id) {
  try {
    localStorage.setItem(LAST, id);
  } catch {}
}
export function getLast() {
  try {
    return localStorage.getItem(LAST) || "";
  } catch {
    return "";
  }
}
export function setReadPage(id, n) {
  try {
    localStorage.setItem(READ_PAGE(id), String(n));
  } catch {}
}
export function getReadPage(id) {
  try {
    return Number(localStorage.getItem(READ_PAGE(id))) || 0;
  } catch {
    return 0;
  }
}

/** Ask the browser to keep this site's storage (so books are not evicted under storage pressure). */
export async function requestPersist() {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) || false;
  } catch {
    return false;
  }
}
export async function estimate() {
  try {
    return (await navigator.storage?.estimate?.()) || null;
  } catch {
    return null;
  }
}

// ── tabs ─────────────────────────────────────────────────────────────────────

const TAB = Math.random().toString(36).slice(2);
let channel = null;
try {
  channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("book-studio") : null;
  channel?.unref?.(); // Node (tests) only: an open channel must not keep the process alive
} catch {}
function broadcast(msg) {
  try {
    channel?.postMessage({ ...msg, tab: TAB });
  } catch {}
}
/** Subscribe to saves/deletes made in other tabs. Returns an unsubscribe function. */
export function onOtherTab(fn) {
  if (!channel) return () => {};
  const h = (e) => e.data?.tab !== TAB && fn(e.data);
  channel.addEventListener("message", h);
  return () => channel.removeEventListener("message", h);
}

/** Announce that this tab is editing a book (presence across this device's tabs). */
export function announceEditing(id) {
  broadcast({ type: "editing", id });
}
