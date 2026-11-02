// Student-created postcards stay in this browser. Images are canvas-re-encoded before they reach IndexedDB.
const DB = "accessPracticeLab-postcards";
const STORE = "postcards";
const MAX_AGE = 30 * 864e5;
const MAX_ITEMS = 12;
const open = () => new Promise((resolve, reject) => {
  if (!globalThis.indexedDB) return reject(new Error("IndexedDB is unavailable."));
  const req = indexedDB.open(DB, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
const tx = async (mode, run) => {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const result = run(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); resolve(result?.result); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
};
const purgeExpired = async (rows) => {
  const expired = rows.filter((r) => Date.now() - Date.parse(r.created) > MAX_AGE);
  for (const row of expired) await tx("readwrite", (s) => s.delete(row.id));
  return rows.filter((r) => !expired.includes(r));
};
export async function list() {
  try { return await purgeExpired((await tx("readonly", (s) => s.getAll())) || []); }
  catch { return []; }
}
export async function save({ blob, alt, place, keepForTeacher = false }) {
  if (!(blob instanceof Blob) || blob.type !== "image/jpeg" || blob.size > 450_000) throw new Error("Postcard image is too large or not a JPEG.");
  const rows = (await list()).sort((a, b) => a.created.localeCompare(b.created));
  for (const old of rows.slice(0, Math.max(0, rows.length - MAX_ITEMS + 1))) await remove(old.id);
  const postcard = { id: crypto.randomUUID(), created: new Date().toISOString(), alt: String(alt || "").trim().slice(0, 300), place: String(place || "").trim().slice(0, 60), keepForTeacher: Boolean(keepForTeacher), blob };
  await tx("readwrite", (s) => s.put(postcard));
  return postcard.id;
}
export async function get(id) { try { return await tx("readonly", (s) => s.get(id)) || null; } catch { return null; } }
export async function remove(id) { try { await tx("readwrite", (s) => s.delete(id)); return true; } catch { return false; } }
export async function setTeacherShare(id, value) {
  const row = await get(id);
  if (!row) return false;
  row.keepForTeacher = Boolean(value);
  try { await tx("readwrite", (s) => s.put(row)); return true; } catch { return false; }
}
const asDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});
export async function shared() {
  const rows = (await list()).filter((r) => r.keepForTeacher).sort((a, b) => a.created.localeCompare(b.created)).slice(-6);
  return Promise.all(rows.map(async ({ id, created, alt, place, blob }) => ({ id, created, alt, place, image: await asDataUrl(blob) })));
}
export async function clearAll() { try { await tx("readwrite", (s) => s.clear()); return true; } catch { return false; } }
export function downloadUrl(blob) { return URL.createObjectURL(blob); }
