const DB_NAME = "lp_speaking_tasks";
const STORE = "packs";
const VERSION = 1;

function openDb() {
  if (!globalThis.indexedDB) return Promise.reject(new Error("IndexedDB is not available in this browser."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open the local task-pack store."));
  });
}

async function transact(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    let result;
    try { result = action(store); } catch (error) { db.close(); reject(error); return; }
    tx.oncomplete = () => { db.close(); resolve(result?.result); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error("Task-pack storage failed.")); };
  });
}

export async function listTaskPacks() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => a.title.en.localeCompare(b.title.en)));
    request.onerror = () => reject(request.error || new Error("Could not read local task packs."));
    tx.oncomplete = () => db.close();
    tx.onerror = () => { db.close(); reject(tx.error || new Error("Could not read local task packs.")); };
  });
}

export const saveTaskPack = (pack) => transact("readwrite", (store) => store.put(pack));
export const deleteTaskPack = (id) => transact("readwrite", (store) => store.delete(id));
export const clearTaskPacks = () => transact("readwrite", (store) => store.clear());
