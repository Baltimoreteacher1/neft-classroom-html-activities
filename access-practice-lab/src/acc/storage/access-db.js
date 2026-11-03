// ACCESS_Storage: the versioned, transactional IndexedDB adapter behind the ACCESS Practice Lab.
//
//   database  ACCESS_Lab_DB
//   stores    sessions          one saved sitting per id (resume, review, teacher summaries)
//             recordings        speaking audio blobs + metadata (a child's voice: local only, deletable)
//             passport_progress append-only evidence rows (one per scored or reviewed attempt)
//             settings          small key/value preferences (toolbar, zoom, language, learner id)
//
// Contract (docs: access-practice-lab/PLATFORM.md "Storage"):
//   * Nothing leaves the device. No network calls, no analytics, no recordings in logs.
//   * Records are scoped by a random per-device learner id (no names, no email); a shared device keeps learners apart
//     because every sessions/progress row carries `learner`.
//   * Schema changes are migrations (MIGRATIONS[n] upgrades n-1 -> n), run inside the upgrade transaction; a failed
//     migration aborts the whole upgrade and leaves the previous version intact.
//   * Multi-row writes run in ONE transaction: if any write fails, every write rolls back.
//   * Import never silently overwrites: existing ids are reported as conflicts and kept.
//   * If IndexedDB is unavailable (private mode, blocked), openStorage() returns a memory-backed store with
//     persistent === false so the UI can say "not saved on this device".
export const DB_NAME = "ACCESS_Lab_DB";
export const DB_VERSION = 1;
export const STORES = Object.freeze(["sessions", "recordings", "passport_progress", "settings"]);

export class StorageError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "StorageError";
    this.code = code; // "quota" | "unavailable" | "blocked" | "aborted" | "invalid" | "migration"
    this.cause = cause;
  }
}
const wrap = (e) => {
  if (e instanceof StorageError) return e;
  const name = e?.name || "";
  if (name === "QuotaExceededError") return new StorageError("quota", "This device is out of storage space.", e);
  if (name === "AbortError") return new StorageError("aborted", "The save was cancelled and nothing was changed.", e);
  return new StorageError("unavailable", e?.message || "Storage failed.", e);
};

/** MIGRATIONS[n](db, tx, oldVersion) runs when upgrading to version n. Never edit a shipped migration; add the next one. */
export const MIGRATIONS = {
  1(db) {
    const sessions = db.createObjectStore("sessions", { keyPath: "id" });
    sessions.createIndex("bySet", "setId");
    sessions.createIndex("byLearner", "learner");
    sessions.createIndex("byUpdated", "updatedAt");
    const rec = db.createObjectStore("recordings", { keyPath: "id" });
    rec.createIndex("bySession", "sessionId");
    rec.createIndex("byItem", "itemId");
    rec.createIndex("byCreated", "createdAt");
    const prog = db.createObjectStore("passport_progress", { keyPath: "id" });
    prog.createIndex("byLearner", "learner");
    prog.createIndex("byDomain", "domain");
    prog.createIndex("byItem", "itemId");
    prog.createIndex("byTime", "t");
    db.createObjectStore("settings", { keyPath: "key" });
  },
};

const req = (r) => new Promise((resolve, reject) => ((r.onsuccess = () => resolve(r.result)), (r.onerror = () => reject(r.error))));
const done = (tx) => new Promise((resolve, reject) => ((tx.oncomplete = () => resolve()), (tx.onerror = () => reject(tx.error)), (tx.onabort = () => reject(tx.error || new DOMException("aborted", "AbortError")))));
const rowId = (row) => row.id || `${row.learner}:${row.itemId}:${row.t}`;

/** Everything above the primitives is shared by the IndexedDB store and the memory fallback, so they cannot drift. */
class BaseStorage {
  sessions = {
    put: (rec) => this._put("sessions", { ...rec, updatedAt: rec.updatedAt || Date.now() }),
    get: (id) => this._get("sessions", id),
    bySet: (setId) => this._all("sessions", { index: "bySet", key: setId }),
    list: () => this._all("sessions"),
    remove: (id) => this._delete("sessions", id),
  };
  recordings = {
    put: (rec) => {
      if (!(rec?.blob instanceof Blob) || !rec.id) return Promise.reject(new StorageError("invalid", "A recording needs an id and audio."));
      return this._put("recordings", { createdAt: Date.now(), ...rec });
    },
    get: (id) => this._get("recordings", id),
    has: async (id) => Boolean((await this._get("recordings", id))?.blob?.size),
    remove: (id) => this._delete("recordings", id),
    /** Metadata only: no blobs are held in memory. */
    list: async () => (await this._all("recordings")).map(({ blob, ...meta }) => ({ ...meta, bytes: blob?.size || 0 })),
  };
  progress = {
    add: (row) => this._put("passport_progress", { ...row, id: rowId(row) }),
    list: async (filter = {}) => {
      const rows = filter.learner ? await this._all("passport_progress", { index: "byLearner", key: filter.learner }) : await this._all("passport_progress");
      return rows.sort((a, b) => a.t - b.t);
    },
    clear: () => this._clear("passport_progress"),
  };
  settings = {
    get: async (key, fallback = null) => (await this._get("settings", key))?.value ?? fallback,
    set: (key, value) => this._put("settings", { key, value, updatedAt: Date.now() }),
    remove: (key) => this._delete("settings", key),
  };

  /** One transaction, many writes: all of them or none. */
  async saveSessionWithEvidence({ session, rows = [], recordings = [] }) {
    await this._batch([
      { store: "sessions", op: "put", value: { ...session, updatedAt: Date.now() } },
      ...rows.map((row) => ({ store: "passport_progress", op: "put", value: { ...row, id: rowId(row) } })),
      ...recordings.map((r) => ({ store: "recordings", op: "put", value: { createdAt: Date.now(), ...r } })),
    ]);
  }

  async learnerId() {
    let id = await this.settings.get("learnerId");
    if (!id) {
      id = `L-${[...crypto.getRandomValues(new Uint8Array(6))].map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 8)}`;
      await this.settings.set("learnerId", id);
    }
    return id;
  }

  async usage() {
    const [sessions, recordings, progress, meta] = await Promise.all([this._count("sessions"), this._count("recordings"), this._count("passport_progress"), this.recordings.list()]);
    const est = await globalThis.navigator?.storage?.estimate?.().catch(() => null);
    return { sessions, recordings, progress, recordingBytes: meta.reduce((n, r) => n + r.bytes, 0), quota: est?.quota ?? null, usage: est?.usage ?? null, persistent: this.persistent };
  }

  /** JSON-safe export. Recordings are included only when asked (they are large and are a child's voice). */
  async exportAll({ includeRecordings = false } = {}) {
    const [sessions, progress, settings] = await Promise.all([this._all("sessions"), this._all("passport_progress"), this._all("settings")]);
    const out = { format: "access-lab-export", version: DB_VERSION, exportedAt: new Date().toISOString(), sessions, progress, settings: settings.filter((x) => x.key !== "learnerId"), recordings: [] };
    if (includeRecordings) for (const r of await this._all("recordings")) out.recordings.push({ ...r, blob: undefined, base64: await blobToBase64(r.blob) });
    return out;
  }
  /** Existing ids are kept and reported, never overwritten. All or nothing. */
  async importAll(data) {
    if (data?.format !== "access-lab-export" || !(data.version <= DB_VERSION)) throw new StorageError("invalid", "This file is not a compatible ACCESS Lab export.");
    const ops = [
      ...(data.sessions || []).map((value) => ({ store: "sessions", op: "add-if-absent", value })),
      ...(data.progress || []).map((value) => ({ store: "passport_progress", op: "add-if-absent", value })),
      ...(data.recordings || []).map(({ base64, ...r }) => ({ store: "recordings", op: "add-if-absent", value: { ...r, blob: base64ToBlob(base64, r.mimeType) } })),
    ];
    const results = await this._batch(ops);
    return { added: results.filter(Boolean).length, conflicts: results.filter((r) => !r).length };
  }
  /** Lifecycle control: delete exactly what was chosen. */
  async purge({ sessions = false, recordings = false, progress = false, settings = false } = {}) {
    const names = [sessions && "sessions", recordings && "recordings", progress && "passport_progress", settings && "settings"].filter(Boolean);
    if (names.length) await this._batch(names.map((store) => ({ store, op: "clear" })));
    return names;
  }
  /** Delete saved recordings older than `days`. */
  async expireRecordings(days) {
    const cutoff = Date.now() - days * 864e5;
    const old = (await this.recordings.list()).filter((r) => r.createdAt < cutoff);
    if (old.length) await this._batch(old.map((r) => ({ store: "recordings", op: "delete", key: r.id })));
    return old.length;
  }
}

class IdbStorage extends BaseStorage {
  persistent = true;
  constructor(db) {
    super();
    this.db = db;
    this.db.onversionchange = () => this.db.close(); // another tab is upgrading: let it proceed
  }
  /** Run `fn(stores)` in one transaction. A throw, or any failed request, aborts and rolls every write back. */
  async _tx(names, mode, fn) {
    let tx;
    try {
      tx = this.db.transaction(names, mode);
    } catch (e) {
      throw wrap(e);
    }
    const completed = done(tx);
    completed.catch(() => {});
    const stores = Object.fromEntries(names.map((n) => [n, tx.objectStore(n)]));
    try {
      const out = await fn(stores);
      await completed;
      return out;
    } catch (e) {
      try {
        tx.abort();
      } catch {}
      throw wrap(e);
    }
  }
  _get(store, key) {
    return this._tx([store], "readonly", (s) => req(s[store].get(key)));
  }
  _put(store, value) {
    return this._tx([store], "readwrite", (s) => req(s[store].put(value)));
  }
  _delete(store, key) {
    return this._tx([store], "readwrite", (s) => req(s[store].delete(key)));
  }
  _all(store, { index, key } = {}) {
    return this._tx([store], "readonly", (s) => req(index ? s[store].index(index).getAll(key) : s[store].getAll()));
  }
  _count(store) {
    return this._tx([store], "readonly", (s) => req(s[store].count()));
  }
  _clear(store) {
    return this._tx([store], "readwrite", (s) => req(s[store].clear()));
  }
  _batch(ops) {
    const names = [...new Set(ops.map((o) => o.store))];
    return this._tx(names, "readwrite", async (s) => {
      const results = [];
      for (const o of ops) {
        const keyPath = s[o.store].keyPath;
        if (o.op === "put") results.push(await req(s[o.store].put(o.value)));
        else if (o.op === "add-if-absent") {
          const exists = await req(s[o.store].get(o.value[keyPath]));
          if (exists) results.push(false);
          else (await req(s[o.store].add(o.value)), results.push(true));
        } else if (o.op === "delete") results.push(await req(s[o.store].delete(o.key)));
        else if (o.op === "clear") results.push(await req(s[o.store].clear()));
      }
      return results;
    });
  }
  close() {
    this.db.close();
  }
}

const blobToBase64 = async (blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const base64ToBlob = (b64, type) => {
  const bin = atob(b64 || "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: type || "application/octet-stream" });
};

/** Same interface, memory only. persistent === false tells the UI to warn that nothing is saved. */
class MemoryStorage extends BaseStorage {
  persistent = false;
  data = Object.fromEntries(STORES.map((n) => [n, new Map()]));
  static keyPath = { sessions: "id", recordings: "id", passport_progress: "id", settings: "key" };
  async _get(store, key) {
    return this.data[store].get(key);
  }
  async _put(store, v) {
    this.data[store].set(v[MemoryStorage.keyPath[store]], v);
  }
  async _delete(store, key) {
    this.data[store].delete(key);
  }
  async _all(store, { index, key } = {}) {
    const rows = [...this.data[store].values()];
    const field = { bySet: "setId", byLearner: "learner", byDomain: "domain", byItem: "itemId", bySession: "sessionId" }[index];
    return field ? rows.filter((r) => r[field] === key) : rows;
  }
  async _count(store) {
    return this.data[store].size;
  }
  async _clear(store) {
    this.data[store].clear();
  }
  async _batch(ops) {
    const snapshot = Object.fromEntries(Object.entries(this.data).map(([k, m]) => [k, new Map(m)]));
    try {
      const out = [];
      for (const o of ops) {
        const kp = MemoryStorage.keyPath[o.store];
        if (o.op === "put") (await this._put(o.store, o.value), out.push(true));
        else if (o.op === "add-if-absent") (this.data[o.store].has(o.value[kp]) ? out.push(false) : (await this._put(o.store, o.value), out.push(true)));
        else if (o.op === "delete") (await this._delete(o.store, o.key), out.push(true));
        else if (o.op === "clear") (await this._clear(o.store), out.push(true));
      }
      return out;
    } catch (e) {
      this.data = snapshot;
      throw wrap(e);
    }
  }
  close() {}
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new StorageError("unavailable", "IndexedDB is not available."));
    const open = indexedDB.open(DB_NAME, DB_VERSION);
    open.onupgradeneeded = (e) => {
      const db = open.result;
      try {
        for (let v = e.oldVersion + 1; v <= (e.newVersion || DB_VERSION); v++) MIGRATIONS[v]?.(db, open.transaction, e.oldVersion);
      } catch (err) {
        open.transaction.abort();
        reject(new StorageError("migration", "The saved data could not be upgraded.", err));
      }
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(wrap(open.error));
    open.onblocked = () => reject(new StorageError("blocked", "Close other ACCESS Lab tabs, then reload."));
  });
}

let shared = null;
/** The one storage instance for this page. Falls back to memory when IndexedDB cannot be opened. */
export function openStorage({ force = false } = {}) {
  if (shared && !force) return shared;
  shared = openDb()
    .then((db) => new IdbStorage(db))
    .catch((e) => {
      const mem = new MemoryStorage();
      mem.openError = e;
      return mem;
    });
  return shared;
}
export const _testing = { IdbStorage, MemoryStorage, BaseStorage };
