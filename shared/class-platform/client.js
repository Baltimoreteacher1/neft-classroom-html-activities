/* =============================================================================
 * Class platform browser client — ONE implementation for both apps (Fluency Lab
 * and The Language Page). Each app supplies only its `doc` name, where it keeps
 * the learner's link, and how it builds its own backup and summary; the network
 * calls, merge rule and sync loop live here.
 * Contract: ./contract.js. Server: functions/api/class. Docs: docs/class-platform.md.
 *
 * Every call takes `fetchImpl` so tests can drive it without a server.
 * ========================================================================== */
import { normalizeCode, validateAlias } from "./contract.js";

export const API = "/api/class";

/** A stored link (class code, student id and key, alias, sync marks) or null when it is not a valid one. */
export function cleanLink(value) {
  if (!value || typeof value !== "object") return null;
  const code = normalizeCode(value.code);
  if (
    code.length !== 6 ||
    !/^s[a-f0-9]{10}$/.test(value.studentId) ||
    !/^[A-Z2-9]{8}$/.test(value.studentKey || "")
  )
    return null;
  const num = (v) => (Number.isInteger(v) && v >= 0 ? v : 0);
  return {
    code,
    studentId: value.studentId,
    studentKey: value.studentKey,
    alias: String(value.alias || "").slice(0, 20),
    title: String(value.title || "").slice(0, 40),
    dirtyAt: num(value.dirtyAt),
    syncedAt: num(value.syncedAt),
    remoteAt: num(value.remoteAt),
  };
}

export const studentHeaders = (link) => ({
  "content-type": "application/json",
  "x-class-student": `${link.studentId}.${link.studentKey}`,
});

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** One JSON call. Never throws: a network failure is { ok: false, httpStatus: 0, error: "offline" }. */
export async function request(fetchImpl, path, { method = "GET", body, headers = {} } = {}) {
  let res;
  try {
    res = await fetchImpl(`${API}/${path}`, {
      method,
      headers: body === undefined ? headers : { "content-type": "application/json", ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      credentials: "same-origin",
    });
  } catch {
    return { ok: false, httpStatus: 0, error: "offline" };
  }
  const data = await readJson(res);
  return {
    ...(data || {}),
    ok: res.ok && data?.ok !== false,
    httpStatus: res.status,
    error: data?.error || (res.ok ? null : `http-${res.status}`),
  };
}

const cleanKey = (key) =>
  String(key)
    .toUpperCase()
    .replace(/[^A-Z2-9]/g, "");

/** Join (or rejoin on another device with `studentKey`). Validates the code and alias before asking the server. */
export function joinClass({ code, alias, studentKey }, fetchImpl = fetch) {
  const clean = normalizeCode(code);
  if (clean.length !== 6) return Promise.resolve({ ok: false, error: "invalid-code" });
  const checked = validateAlias(alias);
  if (!checked.ok) return Promise.resolve({ ok: false, error: checked.error });
  return request(fetchImpl, "join", {
    method: "POST",
    body: {
      code: clean,
      alias: checked.alias,
      ...(studentKey ? { studentKey: cleanKey(studentKey) } : {}),
    },
  });
}

export const classInfo = (code, fetchImpl = fetch) =>
  request(fetchImpl, `info?code=${encodeURIComponent(normalizeCode(code))}`);

/** Everything a signed-in learner's device asks of the class, for one document (`fluency` or `language`). */
export function studentApi(doc) {
  return {
    pull: (link, fetchImpl = fetch) =>
      request(fetchImpl, `progress?code=${link.code}&doc=${doc}`, {
        headers: studentHeaders(link),
      }),
    push: (link, { updatedAt, data, summary }, fetchImpl = fetch) =>
      request(fetchImpl, "progress", {
        method: "POST",
        headers: studentHeaders(link),
        body: { code: link.code, doc, updatedAt, data, summary },
      }),
    whoAmI: (link, fetchImpl = fetch) =>
      request(fetchImpl, `me?code=${link.code}`, { headers: studentHeaders(link) }),
    activeRooms: (link, fetchImpl = fetch) =>
      request(fetchImpl, `room/active?code=${link.code}`, { headers: studentHeaders(link) }),
    roomState: (link, roomId, fetchImpl = fetch) =>
      request(fetchImpl, `room/state?code=${link.code}&roomId=${encodeURIComponent(roomId)}`, {
        headers: studentHeaders(link),
      }),
    roomRespond: (link, body, fetchImpl = fetch) =>
      request(fetchImpl, "room/respond", {
        method: "POST",
        headers: studentHeaders(link),
        body: { code: link.code, ...body },
      }),
    roomWorkspace: (link, body, fetchImpl = fetch) =>
      request(fetchImpl, "room/workspace", {
        method: "POST",
        headers: studentHeaders(link),
        body: { code: link.code, ...body },
      }),
    audioList: (link, fetchImpl = fetch) =>
      request(fetchImpl, `audio/list?code=${link.code}`, { headers: studentHeaders(link) }),
    /** Share one recording (`data` is base64) so the teacher can answer it with a voice note. */
    audioShare: (link, { label, mime, data }, fetchImpl = fetch) =>
      request(fetchImpl, "audio/share", {
        method: "POST",
        headers: studentHeaders(link),
        body: { code: link.code, label, mime, data },
      }),
    audioHeard: (link, audioId, fetchImpl = fetch) =>
      request(fetchImpl, "audio/heard", {
        method: "POST",
        headers: studentHeaders(link),
        body: { code: link.code, audioId },
      }),
    audioDelete: (link, audioId, fetchImpl = fetch) =>
      request(fetchImpl, "audio/delete", {
        method: "POST",
        headers: studentHeaders(link),
        body: { code: link.code, audioId },
      }),
    /** Bytes of one recording or note, fetched with the learner's headers (an <audio src> cannot send them). */
    async audioBlob(link, audioId, fetchImpl = fetch) {
      try {
        const res = await fetchImpl(
          `${API}/audio/file?code=${link.code}&audioId=${encodeURIComponent(audioId)}`,
          { headers: studentHeaders(link), credentials: "same-origin" },
        );
        return res.ok ? await res.blob() : null;
      } catch {
        return null;
      }
    },
  };
}

/**
 * The teacher's calls. `siteKey()` returns the site teacher key (kept for one tab by the page) or ""; `passcode`
 * is the class's own passcode. Either authorizes the class routes; creating a class needs the site key.
 */
export function createTeacherClient({
  fetchImpl = (...a) => fetch(...a),
  code,
  passcode,
  siteKey = () => "",
}) {
  const headers = () => ({
    "content-type": "application/json",
    ...(siteKey() ? { "x-teacher-key": siteKey() } : {}),
    ...(passcode ? { "x-class-teacher": passcode } : {}),
  });
  const call = async (path, body) => {
    try {
      const res = await fetchImpl(
        `${API}/${path}`,
        body === undefined
          ? { headers: headers() }
          : { method: "POST", headers: headers(), body: JSON.stringify({ code, ...body }) },
      );
      const data = await readJson(res);
      return { ...(data || {}), ok: res.ok && data?.ok !== false, httpStatus: res.status };
    } catch {
      return { ok: false, httpStatus: 0, error: "offline" };
    }
  };
  return {
    create: (app, title) => call("create", { app, title }),
    roster: () => call(`roster?code=${code}`),
    settings: (settings) => call("settings", { settings }),
    resetStudent: (studentId) => call("reset-student", { studentId }),
    removeStudent: (studentId) => call("remove-student", { studentId }),
    remove: (confirm) => call("delete", { confirm }),
    openRoom: (kind, config) => call("room/open", { kind, config }),
    control: (roomId, change) => call("room/control", { roomId, ...change }),
    detail: (roomId) => call(`room/detail?code=${code}&roomId=${roomId}`),
    audioList: () => call(`audio/list?code=${code}`),
    audioNote: (note) => call("audio/note", note),
    audioDelete: (audioId) => call("audio/delete", { audioId }),
    /** Bytes of one recording, fetched with the teacher's own headers (an <audio src> cannot send them). */
    async audioBlob(audioId) {
      try {
        const res = await fetchImpl(
          `${API}/audio/file?code=${code}&audioId=${encodeURIComponent(audioId)}`,
          {
            headers: headers(),
          },
        );
        return res.ok ? await res.blob() : null;
      } catch {
        return null;
      }
    },
  };
}

/**
 * After pulling the class copy: what should this device do?
 *   "none"    no class copy, or it is not newer than what this device last saw
 *   "restore" this device has no progress of its own: take the class copy silently
 *   "ask"     both have work: the learner chooses (the current copy is downloaded first, as with a file restore)
 */
export function mergeDecision({ remoteAt, link, hasLocalProgress }) {
  if (!remoteAt || remoteAt <= Math.max(link?.syncedAt || 0, link?.remoteAt || 0)) return "none";
  if (!hasLocalProgress) return "restore";
  return remoteAt > (link?.dirtyAt || 0) ? "ask" : "none";
}

/**
 * The sync loop. `loadLink()/saveLink(link)` are the app's own link storage; `getBackup()` returns its backup object;
 * `getSummary()` its summary; `onRemoteNewer(remote, decision)` is called when the class copy should be restored
 * ("restore") or offered ("ask").
 */
export function createSync({
  doc,
  loadLink,
  saveLink,
  getBackup,
  getSummary,
  hasLocalProgress,
  onRemoteNewer,
  onStatus = () => {},
  fetchImpl = fetch,
  now = () => Date.now(),
  delayMs = 4000,
}) {
  const api = studentApi(doc);
  let timer = null;
  let busy = false;
  const status = (state, detail) => onStatus({ state, ...detail });

  async function push() {
    const link = loadLink();
    if (!link || busy || link.dirtyAt <= link.syncedAt) return;
    busy = true;
    try {
      const res = await api.push(
        link,
        { updatedAt: link.dirtyAt, data: getBackup(), summary: getSummary() },
        fetchImpl,
      );
      if (res.ok) {
        saveLink({ ...link, syncedAt: link.dirtyAt, remoteAt: link.dirtyAt });
        status("synced", { at: link.dirtyAt });
      } else if (res.httpStatus === 409 && res.stale) {
        await pull();
      } else status(res.error === "offline" ? "offline" : "error", { error: res.error });
    } finally {
      busy = false;
    }
  }

  async function pull() {
    const link = loadLink();
    if (!link) return "none";
    const res = await api.pull(link, fetchImpl);
    if (!res.ok) {
      status(res.error === "offline" ? "offline" : "error", { error: res.error });
      return "none";
    }
    if (!res.doc) {
      if (!link.dirtyAt) saveLink({ ...link, dirtyAt: now() });
      schedule(0);
      return "none";
    }
    const decision = mergeDecision({
      remoteAt: res.updatedAt,
      link,
      hasLocalProgress: hasLocalProgress(),
    });
    if (decision !== "none") onRemoteNewer({ data: res.data, updatedAt: res.updatedAt }, decision);
    else if (link.dirtyAt > link.syncedAt) schedule(0);
    else status("synced", { at: res.updatedAt });
    return decision;
  }

  function schedule(ms = delayMs) {
    clearTimeout(timer);
    timer = setTimeout(push, ms);
  }

  return {
    push,
    pull,
    /** Call after every local save. */
    markDirty() {
      const link = loadLink();
      if (!link) return;
      saveLink({ ...link, dirtyAt: Math.max(now(), link.dirtyAt + 1) });
      schedule();
    },
    /** After restoring the class copy: this device now holds exactly that version. */
    acceptRemote(updatedAt) {
      const link = loadLink();
      if (link) saveLink({ ...link, dirtyAt: updatedAt, syncedAt: updatedAt, remoteAt: updatedAt });
      status("synced", { at: updatedAt });
    },
    /** The learner kept this device's copy: it becomes the newest and overwrites the class copy. */
    keepLocal(remoteUpdatedAt = 0) {
      const link = loadLink();
      const at = Math.max(now(), remoteUpdatedAt + 1, (link?.dirtyAt || 0) + 1);
      if (link)
        saveLink({ ...link, dirtyAt: at, remoteAt: Math.max(link.remoteAt, remoteUpdatedAt) });
      schedule(0);
    },
    stop() {
      clearTimeout(timer);
    },
  };
}
