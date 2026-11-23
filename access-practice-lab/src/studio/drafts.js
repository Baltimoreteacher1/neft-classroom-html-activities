// Where a teacher's activities live.
//   On this device: accessPracticeLab:v1:studio = { [id]: { activity, updatedAt, link? } } plus up to 8 recoverable
//   revisions per activity under accessPracticeLab:v1:studio-rev:<id>. Saved after every change; nothing leaves the
//   device until the teacher saves to a class or publishes.
//   In a class (optional): the /api/class/activity routes, authenticated exactly like the other teacher class routes
//   (the site key for this tab, or the class's teacher passcode this device remembers).
// No student data is ever stored or sent from here.

import { createTeacherClient, request } from "../../../shared/class-platform/client.js";
import { knownClasses, siteKey } from "../compiler/store.js";
import { safeJson, storage } from "../util.js";
import { SCHEMA_ID, normalizeActivity } from "./core/schema.js";

export const DRAFTS_KEY = "accessPracticeLab:v1:studio";
const REV_KEY = (id) => `accessPracticeLab:v1:studio-rev:${id}`;
export const MAX_LOCAL = 60;
const MAX_REVISIONS = 8;
export const ID_RE = /^s[a-f0-9]{10}$/;

export function newActivityId(rand = (n) => crypto.getRandomValues(new Uint8Array(n))) {
  return `s${Array.from(rand(5), (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

const isEntry = (e) => e && typeof e === "object" && e.activity?.schema === SCHEMA_ID;

export function loadAll() {
  const all = safeJson(storage.get(DRAFTS_KEY), {}) || {};
  return Object.fromEntries(Object.entries(all).filter(([id, e]) => ID_RE.test(id) && isEntry(e)));
}
export const getLocal = (id) => loadAll()[id] || null;

/** Local drafts, newest first, as light summaries for My Activities. */
export function listLocal() {
  return Object.entries(loadAll())
    .map(([id, e]) => ({
      id,
      updatedAt: e.updatedAt || 0,
      link: e.link || null,
      activity: e.activity,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Save one draft on this device. Returns false when the device refused the write (storage full or blocked). */
export function saveLocal(activity, link, now = Date.now()) {
  const all = loadAll();
  const prev = all[activity.id];
  all[activity.id] = {
    activity,
    updatedAt: now,
    link: link === undefined ? prev?.link || null : link,
  };
  const keep = Object.entries(all)
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
    .slice(0, MAX_LOCAL);
  try {
    return storage.set(DRAFTS_KEY, JSON.stringify(Object.fromEntries(keep))) !== false;
  } catch {
    return false;
  }
}

export function deleteLocal(id) {
  const all = loadAll();
  delete all[id];
  storage.set(DRAFTS_KEY, JSON.stringify(all));
  storage.remove(REV_KEY(id));
}

/** Keep a recoverable copy; called on a calm pause in editing, not on every keystroke. */
export function pushRevision(activity, now = Date.now()) {
  const list = revisions(activity.id);
  const json = JSON.stringify(activity);
  if (list[0] && list[0].json === json) return;
  list.unshift({ at: now, json });
  while (list.length > MAX_REVISIONS) list.pop();
  for (let tries = 0; tries < MAX_REVISIONS; tries++) {
    if (storage.set(REV_KEY(activity.id), JSON.stringify(list)) !== false) return;
    list.pop();
  }
}
export const revisions = (id) => {
  const list = safeJson(storage.get(REV_KEY(id)), []);
  return Array.isArray(list) ? list.filter((r) => r && typeof r.json === "string") : [];
};
export const revisionActivity = (rev) => normalizeActivity(safeJson(rev.json, {}));

/** A copy with a new id, ready to edit. The original is untouched. */
export function duplicateActivity(activity, copyLabel = "Copy of") {
  return normalizeActivity({
    ...JSON.parse(JSON.stringify(activity)),
    id: newActivityId(),
    rev: 0,
    title: `${copyLabel} ${activity.title}`.slice(0, 120),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export { knownClasses, siteKey };

/** Teacher calls for one class. `passcode` is used for the call and not stored here. */
export function studioApi({
  code,
  passcode = "",
  fetchImpl = (...a) => fetch(...a),
  key = siteKey,
}) {
  const headers = () => ({
    ...(key() ? { "x-teacher-key": key() } : {}),
    ...(passcode ? { "x-class-teacher": passcode } : {}),
  });
  const post = (path, body) =>
    request(fetchImpl, `activity/${path}`, {
      method: "POST",
      headers: headers(),
      body: { code, ...body },
    });
  const get = (path, q = "") =>
    request(fetchImpl, `activity/${path}?code=${code}${q}`, { headers: headers() });
  const teacher = createTeacherClient({ fetchImpl, code, passcode, siteKey: key });
  return {
    list: () => get("list"),
    get: (id) => get("get", `&id=${id}`),
    save: (activity, baseRev) => post("save", { activity, baseRev }),
    duplicate: (id) => post("duplicate", { id }),
    remove: (id) => post("delete", { id }),
    publish: (id) => post("publish", { id }),
    unpublish: (id) => post("unpublish", { id }),
    revisions: (id) => get("revisions", `&id=${id}`),
    restore: (id, revision) => post("restore", { id, revision }),
    evidence: (id) => get("evidence", `&id=${id}`),
    /** Add the published page to the class's assignments (existing settings route: read, append, write). */
    async assign(id, title) {
      const roster = await teacher.roster();
      if (!roster.ok) return roster;
      const current = roster.settings?.assignments || [];
      if (current.some((a) => a.id === id)) return { ok: true, already: true };
      const next = {
        id,
        title: String(title || "Activity").slice(0, 80),
        path: `/do/${id}`,
        due: null,
      };
      const res = await teacher.settings({
        assignments: [
          ...current.map(({ id: i, title: t, path, due }) => ({ id: i, title: t, path, due })),
          next,
        ],
      });
      return res.ok ? { ok: true } : res;
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

/** Public link for a published activity, on the host the teacher is using. */
export const shareUrl = (id, origin = globalThis.location?.origin || "") => `${origin}/do/${id}`;
