// Experience Builder: where an instructor's drafts live and how one reaches a class.
//   Drafts: accessPracticeLab:v1:experiences = { [key]: { def, updatedAt, input?, published? } } on this device (the
//   simulation player reads `def` from the same key to play a draft at /simulations/x/<key>). A draft is saved after
//   every change; nothing leaves the device until the instructor publishes.
//   Class: POST /api/class/experience/publish with the class credentials roster-panel.js keeps on this device (the
//   site key for this tab, or the class passcode), then the existing settings route adds the assignment.
// Rules it keeps: no student data is ever sent from here (a definition is instructor material); what is published is
// the student copy (no compiler notes; no raw source text unless "show source" is on); an imported file is DATA and
// is validated before it is kept.
import { createTeacherClient, request } from "../../../shared/class-platform/client.js";
import { BASE, safeJson, storage } from "../util.js";
import { ID_RE, missionIdFor, newExperienceId, studentCopy } from "./compile.js";
import { validateExperience } from "./validate.js";

export const DRAFTS_KEY = "accessPracticeLab:v1:experiences";
export const MAX_DRAFTS = 24;
export const MAX_IMPORT_BYTES = 200 * 1024;
const CLASSES_KEY = "accessPracticeLabClass:v1:teacher-classes"; // written by src/class/roster-panel.js
const SITE_KEY = "accessPracticeLabClass:v1:site-key";
export const ASSIGN_ID_RE = /^[a-z0-9][a-z0-9:_-]{0,39}$/;
export const ASSIGN_PATH_RE = /^\/[\w\-./?=&%]{0,200}$/;

const isEntry = (e) => e && typeof e === "object" && e.def && typeof e.def === "object";
export function loadDrafts(read = (k) => storage.get(k)) {
  const all = safeJson(read(DRAFTS_KEY), {}) || {};
  return Object.fromEntries(Object.entries(all).filter(([k, e]) => ID_RE.test(k) && isEntry(e)));
}
export const getDraft = (key, read) => loadDrafts(read)[key] || null;

/** Save one draft (newest kept when over the cap). Returns false when the device refused the write. */
export function saveDraft(
  key,
  entry,
  { read, write = (k, v) => storage.set(k, v), now = Date.now() } = {},
) {
  const all = loadDrafts(read);
  all[key] = { ...entry, updatedAt: now };
  const keep = Object.entries(all)
    .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
    .slice(0, MAX_DRAFTS);
  try {
    return write(DRAFTS_KEY, JSON.stringify(Object.fromEntries(keep))) !== false;
  } catch {
    return false;
  }
}
export function deleteDraft(key, { read, write = (k, v) => storage.set(k, v) } = {}) {
  const all = loadDrafts(read);
  delete all[key];
  write(DRAFTS_KEY, JSON.stringify(all));
}

export const playPath = (key) => `${BASE}/simulations/x/${key}`;
/** The assignment the class server stores for a published experience: { id, title, path, due }. */
export const assignmentFor = (id, title) => ({
  id,
  title: String(title || "Experience").slice(0, 80),
  path: playPath(id),
  due: null,
});

// ── export / import ──────────────────────────────────────────────────────────
export const EXPORT_KIND = "lp-experience/1";
export const exportDraft = (key, entry) =>
  JSON.stringify({ kind: EXPORT_KIND, key, def: entry.def, input: entry.input || null }, null, 1);

/**
 * Read an exported file. The text is data: it is parsed, size-checked and validated, never run.
 * @returns {{ ok: true, key, entry, report } | { ok: false, error: string }}
 */
export function importDraft(text) {
  if (typeof text !== "string" || !text.trim()) return { ok: false, error: "empty" };
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: "too-large" };
  const data = safeJson(text, null);
  const def = data?.kind === EXPORT_KIND ? data.def : data?.schema ? data : null;
  if (!def || typeof def !== "object" || Array.isArray(def))
    return { ok: false, error: "not-an-experience" };
  const key = newExperienceId();
  const copy = JSON.parse(JSON.stringify(def));
  copy.id = missionIdFor(key);
  const report = validateExperience(copy);
  if (report.errors.some((e) => e.code === "schema"))
    return { ok: false, error: "invalid", report };
  const input =
    data?.input && typeof data.input === "object"
      ? {
          source: {
            title: String(data.input.source?.title || ""),
            text: String(data.input.source?.text || ""),
          },
          settings: data.input.settings || {},
        }
      : null;
  return { ok: true, key, entry: { def: copy, input }, report };
}

// ── class ────────────────────────────────────────────────────────────────────
/** Classes whose passcode this device remembers (opened once in the Teacher Hub or /class/teacher). */
export function knownClasses(
  read = (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
) {
  const list = safeJson(read(CLASSES_KEY), []);
  return Array.isArray(list)
    ? list
        .filter((c) => c && typeof c.code === "string" && /^[A-Z2-9]{6}$/.test(c.code))
        .map((c) => ({
          code: c.code,
          passcode: String(c.passcode || ""),
          title: String(c.title || ""),
        }))
    : [];
}
export const siteKey = () => {
  try {
    return sessionStorage.getItem(SITE_KEY) || "";
  } catch {
    return "";
  }
};

/** The instructor's experience calls for one class, authenticated exactly like the other teacher class routes. */
export function experienceApi({
  code,
  passcode,
  fetchImpl = (...a) => fetch(...a),
  key = siteKey,
}) {
  const headers = () => ({
    ...(key() ? { "x-teacher-key": key() } : {}),
    ...(passcode ? { "x-class-teacher": passcode } : {}),
  });
  const teacher = createTeacherClient({ fetchImpl, code, passcode, siteKey: key });
  return {
    publish: (def, { id, showSource = false } = {}) =>
      request(fetchImpl, "experience/publish", {
        method: "POST",
        headers: headers(),
        body: { code, def: studentCopy(def, { showSource }), showSource, ...(id ? { id } : {}) },
      }),
    unpublish: (id) =>
      request(fetchImpl, "experience/unpublish", {
        method: "POST",
        headers: headers(),
        body: { code, id },
      }),
    list: () => request(fetchImpl, `experience/list?code=${code}`, { headers: headers() }),
    /** Add the experience to the class's assignments through the existing settings route (read, append, write). */
    async assign(id, title) {
      const roster = await teacher.roster();
      if (!roster.ok) return roster;
      const current = roster.settings?.assignments || [];
      const next = assignmentFor(id, title);
      if (!ASSIGN_ID_RE.test(next.id) || !ASSIGN_PATH_RE.test(next.path))
        return { ok: false, error: "invalid-assignment" };
      if (current.some((a) => a.id === id))
        return { ok: true, already: true, assignments: current };
      const res = await teacher.settings({
        assignments: [
          ...current.map(({ id: i, title: t, path, due }) => ({ id: i, title: t, path, due })),
          next,
        ],
      });
      return res.ok ? { ok: true, assignments: res.settings?.assignments || [] } : res;
    },
    async unassign(id) {
      const roster = await teacher.roster();
      if (!roster.ok) return roster;
      const current = roster.settings?.assignments || [];
      if (!current.some((a) => a.id === id)) return { ok: true };
      return teacher.settings({
        assignments: current
          .filter((a) => a.id !== id)
          .map(({ id: i, title: t, path, due }) => ({ id: i, title: t, path, due })),
      });
    },
  };
}

export const fetchPublished = (id, fetchImpl = (...a) => fetch(...a)) =>
  request(fetchImpl, `experience/get?id=${encodeURIComponent(id)}`);
