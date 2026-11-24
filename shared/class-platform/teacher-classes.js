// The teacher side of "assign this to my class": the classes a teacher opened on this device, and the one way an
// assignment is added to a class. Shared by every Language Page surface that assigns work (Pathways builder, the
// BCPSS Language Studio shelf) so the 30-assignment cap, the duplicate rule and the error reasons live in one place.
import { createTeacherClient } from "./client.js";
import { LIMITS } from "./contract.js";

export const TEACHER_CLASSES_KEY = "accessPracticeLabClass:v1:teacher-classes";
export const MAX_ASSIGNMENTS = LIMITS.maxAssignments;

/** Classes this teacher opened on this device (the same list the class panel keeps). */
export function teacherClasses(read = (k) => globalThis.localStorage?.getItem(k)) {
  try {
    const list = JSON.parse(read(TEACHER_CLASSES_KEY) || "[]");
    return Array.isArray(list)
      ? list.filter((c) => c && typeof c.code === "string" && c.passcode)
      : [];
  } catch {
    return [];
  }
}

/**
 * Add assignments to a class through the existing settings API: one read, one write. An id the class already has is
 * left alone; whatever does not fit under the class cap is reported, never silently dropped.
 * @returns {Promise<{ok:true, added:number, already:number, skipped:number} | {ok:false, reason:string}>}
 */
export async function saveAllToClass(
  cls,
  assignments,
  fetchImpl,
  makeClient = createTeacherClient,
) {
  const api = makeClient({ fetchImpl, code: cls.code, passcode: cls.passcode });
  const roster = await api.roster();
  if (!roster.ok)
    return {
      ok: false,
      reason: roster.httpStatus === 401 ? "passcode" : roster.error || "offline",
    };
  const list = roster.settings?.assignments || [];
  const have = new Set(list.map((a) => a.id));
  const fresh = assignments.filter(
    (a, i) => !have.has(a.id) && assignments.findIndex((b) => b.id === a.id) === i,
  );
  const add = fresh.slice(0, Math.max(0, MAX_ASSIGNMENTS - list.length));
  if (fresh.length && !add.length) return { ok: false, reason: "full" };
  if (add.length) {
    const res = await api.settings({ assignments: [...list, ...add] });
    if (!res.ok) return { ok: false, reason: res.error || "offline" };
  }
  return {
    ok: true,
    added: add.length,
    already: assignments.length - fresh.length,
    skipped: fresh.length - add.length,
  };
}

/**
 * Add ONE assignment to a class's assignments (read the list, append, save).
 * @returns {Promise<{ok:true, already?:boolean} | {ok:false, reason:string}>}
 */
export async function saveToClass(cls, assignment, fetchImpl, makeClient = createTeacherClient) {
  const res = await saveAllToClass(cls, [assignment], fetchImpl, makeClient);
  if (!res.ok) return res;
  return res.added ? { ok: true } : { ok: true, already: true };
}
