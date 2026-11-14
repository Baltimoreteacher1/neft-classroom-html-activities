// Network calls for the class social features (peer listening pairs, student-made scenes). Server:
// functions/_lib/class-platform/{pairs,scenes}.js. Rules shared with the server: shared/class-platform/social.js.
// Every call goes through the shared class client, so a network failure is { ok: false, error: "offline" }.
import { API, request, studentHeaders } from "../../../shared/class-platform/client.js";

async function blobFrom(fetchImpl, path, headers) {
  try {
    const res = await fetchImpl(`${API}/${path}`, { headers, credentials: "same-origin" });
    return res.ok ? await res.blob() : null;
  } catch {
    return null;
  }
}

/** A learner's calls (their class link carries the student key). */
export function studentSocial(link, fetchImpl = (...a) => fetch(...a)) {
  const headers = studentHeaders(link);
  const get = (path) => request(fetchImpl, path, { headers });
  const post = (path, body) => request(fetchImpl, path, { method: "POST", headers, body: { code: link.code, ...body } });
  return {
    pairsState: () => get(`pairs/state?code=${link.code}`),
    shareTake: (take) => post("pairs/take", take),
    reply: (takeId, answer, reaction) => post("pairs/reply", { takeId, answer, reaction }),
    landed: (takeId, listenerId, landed) => post("pairs/landed", { takeId, listenerId, landed }),
    deleteTake: (takeId) => post("pairs/delete", { takeId }),
    takeBlob: (takeId) => blobFrom(fetchImpl, `pairs/file?code=${link.code}&takeId=${encodeURIComponent(takeId)}`, headers),
    scenes: () => get(`scenes/list?code=${link.code}`),
    submitScene: (body) => post("scenes/submit", body),
    deleteScene: (sceneId) => post("scenes/delete", { sceneId }),
    sceneAudio: (sceneId) => blobFrom(fetchImpl, `scenes/audio?code=${link.code}&sceneId=${encodeURIComponent(sceneId)}`, headers),
  };
}

/** The teacher's calls: the site key (this tab) or the class passcode, exactly as roster-panel.js sends them. */
export function teacherSocial({ code, passcode, siteKey = () => "", fetchImpl = (...a) => fetch(...a) }) {
  const headers = () => ({
    ...(siteKey() ? { "x-teacher-key": siteKey() } : {}),
    ...(passcode ? { "x-class-teacher": passcode } : {}),
  });
  const get = (path) => request(fetchImpl, path, { headers: headers() });
  const post = (path, body) => request(fetchImpl, path, { method: "POST", headers: headers(), body: { code, ...body } });
  return {
    pairsState: () => get(`pairs/state?code=${code}`),
    configure: (change) => post("pairs/config", change),
    deleteTake: (takeId) => post("pairs/delete", { takeId }),
    takeBlob: (takeId) => blobFrom(fetchImpl, `pairs/file?code=${code}&takeId=${encodeURIComponent(takeId)}`, headers()),
    scenes: () => get(`scenes/list?code=${code}`),
    review: (sceneId, action, note) => post("scenes/review", { sceneId, action, ...(note ? { note } : {}) }),
    deleteScene: (sceneId) => post("scenes/delete", { sceneId }),
    sceneAudio: (sceneId) => blobFrom(fetchImpl, `scenes/audio?code=${code}&sceneId=${encodeURIComponent(sceneId)}`, headers()),
  };
}
