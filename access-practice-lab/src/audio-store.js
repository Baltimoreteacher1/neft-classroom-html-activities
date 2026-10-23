// Optional on-device storage for speaking recordings (IndexedDB). A learner chooses, per recording,
// to keep it for a teacher conference. Nothing is uploaded; "Delete" removes it; nothing is kept
// unless the learner presses "Keep for my teacher".
const DB = "accessPracticeLab-audio";
const STORE = "takes";
const MAX_KEPT = 12;

const open = () =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("unavailable"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
const tx = async (mode, fn) => {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => (db.close(), resolve(out?.result));
    t.onerror = () => (db.close(), reject(t.error));
  });
};

export const available = () => typeof indexedDB !== "undefined";
export async function keep(take, task) {
  try {
    const all = (await list()).sort((a, b) => a.t.localeCompare(b.t));
    for (const old of all.slice(0, Math.max(0, all.length - MAX_KEPT + 1))) await remove(old.id);
    await tx("readwrite", (s) => s.put({ id: take.id, task, t: new Date().toISOString(), type: take.blob.type, seconds: take.seconds, extension: take.extension, blob: take.blob }));
    return true;
  } catch {
    return false;
  }
}
export async function get(id) {
  try {
    return await tx("readonly", (s) => s.get(id));
  } catch {
    return null;
  }
}
export async function remove(id) {
  try {
    await tx("readwrite", (s) => s.delete(id));
    return true;
  } catch {
    return false;
  }
}
const MAX_AGE_MS = 30 * 864e5;
export async function list() {
  try {
    const rows = await tx("readonly", (s) => s.getAll());
    // Kept recordings are a child's voice: they expire after 30 days unless the learner keeps them again.
    const old = (rows || []).filter((r) => Date.now() - Date.parse(r.t) > MAX_AGE_MS);
    for (const r of old) await remove(r.id);
    return (rows || []).filter((r) => !old.includes(r)).map(({ blob, ...meta }) => meta);
  } catch {
    return [];
  }
}
export async function clearAll() {
  try {
    await tx("readwrite", (s) => s.clear());
    return true;
  } catch {
    return false;
  }
}
/** Object URL for a kept recording, or null. Caller revokes. */
export async function urlFor(id) {
  const row = await get(id);
  return row?.blob ? URL.createObjectURL(row.blob) : null;
}
