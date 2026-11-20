const DB = "lp_el_program";
const VERSION = 1;
const STORE = "records";
let opening;
const open = () => (opening ||= new Promise((resolve, reject) => {
  const req = indexedDB.open(DB, VERSION);
  req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" }); };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error || new Error("Local program storage could not open."));
}));
export async function listRecords(kind) { const db = await open(); return new Promise((resolve, reject) => { const r = db.transaction(STORE).objectStore(STORE).getAll(); r.onsuccess = () => resolve(r.result.filter((x) => x.kind === kind)); r.onerror = () => reject(r.error); }); }
export async function saveRecord(record) { const db = await open(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).put({ ...record, updatedAt: new Date().toISOString() }); tx.oncomplete = () => resolve(record); tx.onerror = () => reject(tx.error); }); }
export async function removeRecord(id) { const db = await open(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).delete(id); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }); }
export async function replaceRecords(records) { const db = await open(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE, "readwrite"); const store = tx.objectStore(STORE); store.clear(); for (const record of records) store.put(record); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }); }
export async function clearRecords() { await replaceRecords([]); }
