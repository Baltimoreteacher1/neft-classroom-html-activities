// IndexedDB persistence for engine games: progress per game + round receipts.
//
// Fails soft. Private windows, blocked site data and older WebViews can refuse
// IndexedDB; every call then resolves against an in-memory map and
// `persistent` turns false so the page can say progress stays on this visit only.

const DB_NAME = "eduwonder-engines";
const DB_VERSION = 1;
const MAX_RECEIPTS_PER_GAME = 200;

/** @type {Promise<IDBDatabase | null> | null} */
let dbPromise = null;
const memory = { progress: new Map(), receipts: [] };

export const storeStatus = { persistent: true };

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    let req;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      storeStatus.persistent = false;
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("progress"))
        db.createObjectStore("progress", { keyPath: "gameId" });
      if (!db.objectStoreNames.contains("receipts")) {
        const receipts = db.createObjectStore("receipts", { keyPath: "id", autoIncrement: true });
        receipts.createIndex("gameId", "gameId");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      storeStatus.persistent = false;
      resolve(null);
    };
    req.onblocked = () => {
      storeStatus.persistent = false;
      resolve(null);
    };
  });
  return dbPromise;
}

/**
 * @param {IDBDatabase} db
 * @param {string} store
 * @param {IDBTransactionMode} mode
 * @param {(s: IDBObjectStore) => IDBRequest | void} fn
 */
function run(db, store, mode, fn) {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = () => resolve(undefined);
      tx.onabort = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

/**
 * @param {string} gameId
 * @returns {Promise<Record<string, any> | null>}
 */
export async function loadProgress(gameId) {
  const db = await openDb();
  if (!db) return memory.progress.get(gameId) || null;
  const row = await run(db, "progress", "readonly", (s) => s.get(gameId));
  return row || null;
}

/** @param {Record<string, any> & { gameId: string }} progress */
export async function saveProgress(progress) {
  const db = await openDb();
  if (!db) {
    memory.progress.set(progress.gameId, progress);
    return;
  }
  await run(db, "progress", "readwrite", (s) => s.put(progress));
}

/** @param {Record<string, any> & { gameId: string }} receipt */
export async function addReceipt(receipt) {
  const db = await openDb();
  if (!db) {
    memory.receipts.push(receipt);
    if (memory.receipts.length > MAX_RECEIPTS_PER_GAME) memory.receipts.shift();
    return;
  }
  await run(db, "receipts", "readwrite", (s) => s.add(receipt));
  // Keep only the newest receipts for this game.
  const keys = await run(db, "receipts", "readonly", (s) =>
    s.index("gameId").getAllKeys(receipt.gameId),
  );
  if (Array.isArray(keys) && keys.length > MAX_RECEIPTS_PER_GAME) {
    const stale = keys.slice(0, keys.length - MAX_RECEIPTS_PER_GAME);
    await run(db, "receipts", "readwrite", (s) => {
      for (const k of stale) s.delete(k);
    });
  }
}

/** @param {string} gameId */
export async function listReceipts(gameId) {
  const db = await openDb();
  if (!db) return memory.receipts.filter((r) => r.gameId === gameId);
  const rows = await run(db, "receipts", "readonly", (s) => s.index("gameId").getAll(gameId));
  return Array.isArray(rows) ? rows : [];
}
