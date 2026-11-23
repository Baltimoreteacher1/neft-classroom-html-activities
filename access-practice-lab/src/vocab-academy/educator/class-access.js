// The teacher's door to the lab's EXISTING class platform (shared/class-platform/client.js createTeacherClient).
// The Teacher Hub / class panel (src/class/roster-panel.js) keeps the classes this teacher opened on this device, each
// with its passcode, in localStorage; this reads that same list so there is one set of classes, not a second one.
// Authorization is the server's (class passcode or site teacher key); nothing here is a boundary on its own.
import { createTeacherClient } from "../../../../shared/class-platform/client.js";
import { safeJson } from "../../util.js";
import { mergeAssignments } from "./assign.js";

// Same keys as src/class/roster-panel.js (not exported there: requested in the report so this can import them).
export const CLASSES_KEY = "accessPracticeLabClass:v1:teacher-classes";
export const SITE_KEY = "accessPracticeLabClass:v1:site-key";

/** Classes opened on this device: [{ code, passcode, title }]. */
export function savedClasses() {
  try {
    const list = safeJson(localStorage.getItem(CLASSES_KEY), []);
    return (Array.isArray(list) ? list : []).filter((c) => c && typeof c.code === "string");
  } catch {
    return [];
  }
}
const siteKey = () => {
  try {
    return sessionStorage.getItem(SITE_KEY) || "";
  } catch {
    return "";
  }
};
export const classApi = (cls, fetchImpl = (...a) => fetch(...a)) =>
  createTeacherClient({ fetchImpl, code: cls.code, passcode: cls.passcode, siteKey });

/**
 * Add rows to the class's assignments through POST /api/class/settings (the same call the class panel makes).
 * Reads the class's current assignments first so nothing already assigned is lost.
 * @returns {{ ok, added, skipped, error?, httpStatus? }}
 */
export async function assignToClass(api, rows, { due = null } = {}) {
  const roster = await api.roster();
  if (!roster.ok) return { ok: false, added: [], skipped: [], error: roster.error || `http-${roster.httpStatus}`, httpStatus: roster.httpStatus };
  const { list, added, skipped } = mergeAssignments(roster.settings?.assignments || [], rows, due);
  if (!added.length) return { ok: true, added, skipped };
  const saved = await api.settings({ assignments: list });
  return saved.ok ? { ok: true, added, skipped } : { ok: false, added: [], skipped, error: saved.error || `http-${saved.httpStatus}`, httpStatus: saved.httpStatus };
}
