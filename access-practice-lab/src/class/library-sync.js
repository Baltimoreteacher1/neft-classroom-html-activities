// Cross-device teacher library sync: pushes/pulls teacher-saved materials (vocab sets, support configs,
// Book Studio editions, custom pathways) through the existing class platform API (/api/class/library/*).
import { createTeacherClient } from "../../../shared/class-platform/client.js";
import { cleanSet } from "../vocab-sets/model.js";
import { readSets, writeSets } from "../vocab-sets/store.js";
import { safeJson, storage } from "../util.js";

const TEACHER_CLASSES_KEY = "accessPracticeLabClass:v1:teacher-classes";

export function activeTeacherClasses() {
  const list = safeJson(storage.get(TEACHER_CLASSES_KEY), []);
  return Array.isArray(list) ? list.filter((c) => c && typeof c.code === "string" && c.passcode) : [];
}

function clientFor(cls) {
  return createTeacherClient({ code: cls.code, passcode: cls.passcode });
}

/** Merge local vocab sets with the class's server library (last-write-wins by updatedAt). */
export async function syncVocabSets(cls, api = null) {
  const client = api || (cls?.code && cls?.passcode ? clientFor(cls) : null);
  if (!client) return { ok: false, error: "no-class" };
  const local = readSets();
  const payload = local.map((s) => ({
    kind: "vocab_set",
    itemId: s.id,
    title: s.title,
    payload: s,
    updatedAt: s.updated || Date.now(),
  }));
  const res = await client.librarySync(payload, "vocab_set");
  if (!res?.ok) return { ok: false, error: res?.error || "sync-failed" };

  const byId = new Map(local.map((s) => [s.id, s]));
  for (const row of res.items || []) {
    const cleaned = cleanSet(row.payload);
    if (!cleaned) continue;
    const prev = byId.get(cleaned.id);
    if (!prev || (row.updatedAt || 0) >= (prev.updated || 0)) {
      byId.set(cleaned.id, { ...cleaned, updated: row.updatedAt || cleaned.updated || Date.now() });
    }
  }
  const merged = [...byId.values()].sort((a, b) => (b.updated || 0) - (a.updated || 0));
  writeSets(merged);
  return { ok: true, count: merged.length, items: res.items || [] };
}

export async function listClassLibrary(cls, kind = "") {
  if (!cls?.code || !cls?.passcode) return { ok: false, items: [] };
  return clientFor(cls).libraryList(kind);
}

export async function saveLibraryItem(cls, item) {
  if (!cls?.code || !cls?.passcode) return { ok: false, error: "no-class" };
  return clientFor(cls).librarySave(item);
}

export async function deleteLibraryItem(cls, kind, itemId) {
  if (!cls?.code || !cls?.passcode) return { ok: false, error: "no-class" };
  return clientFor(cls).libraryDelete(kind, itemId);
}
