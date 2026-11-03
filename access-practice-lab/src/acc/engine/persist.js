// Assessment persistence on top of ACCESS_Storage (IndexedDB "ACCESS_Lab_DB").
//   sessions          the saved sitting (resume, review): one row per set + mode
//   passport_progress one evidence row per item when a sitting is submitted (what teacher reports read)
//   recordings        written by the speaking component, referenced from the session by id
// Sessions written by the first release (localStorage "access.acc.session.*") are imported once, then removed only
// after the IndexedDB write succeeded, so an upgrade can never lose a half-finished sitting.
import { openStorage } from "../storage/access-db.js";

const LEGACY_NS = "access.acc.";
export const sessionId = (setId, mode) => `${setId}:${mode}`;
const legacyKey = (setId, mode) => `${LEGACY_NS}session.${setId}.${mode}`;
const ls = () => {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
};

export async function storage() {
  return openStorage();
}

/**
 * Every save first writes a small synchronous copy to localStorage (the "buffer"), then commits to IndexedDB and
 * removes the copy. A refresh or crash between the two cannot lose the last answer: on load the newer of the buffer and
 * the stored row wins, and a buffer left behind is committed. The first release stored sessions under this same key, so
 * importing a legacy sitting is the same code path.
 */
const readBuffer = (setId, mode) => {
  try {
    const raw = ls()?.getItem(legacyKey(setId, mode));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** @returns {Promise<{ session, tools, prefs } | null>} */
export async function loadSession(setId, mode) {
  const store = await storage();
  let row = null;
  try {
    row = await store.sessions.get(sessionId(setId, mode));
  } catch {}
  const buffered = readBuffer(setId, mode);
  if (buffered && (!row || (buffered.savedAt || 0) > (row.updatedAt || 0))) {
    if (await commit(store, setId, mode, buffered)) ls()?.removeItem(legacyKey(setId, mode));
    return buffered;
  }
  if (buffered) ls()?.removeItem(legacyKey(setId, mode)); // stale copy: the stored row is newer
  return row ? row.data : null;
}

async function commit(store, setId, mode, snapshot) {
  try {
    await store.sessions.put({ id: sessionId(setId, mode), setId, mode, learner: await store.learnerId(), status: snapshot?.session?.status || "active", updatedAt: snapshot.savedAt || Date.now(), data: snapshot });
    return true;
  } catch {
    return false;
  }
}

/** Saves the live snapshot. Returns false (never throws) so the canvas can show "not saved on this device". */
export async function saveSession(setId, mode, snapshot) {
  const stamped = { ...snapshot, savedAt: Date.now() };
  let buffered = false;
  try {
    ls()?.setItem(legacyKey(setId, mode), JSON.stringify(stamped));
    buffered = Boolean(ls());
  } catch {}
  const store = await storage();
  const saved = await commit(store, setId, mode, stamped);
  if (saved && buffered) {
    // Remove the buffer only if it is still the copy we wrote (a newer save may have replaced it meanwhile).
    const now = readBuffer(setId, mode);
    if (now?.savedAt === stamped.savedAt) ls()?.removeItem(legacyKey(setId, mode));
  }
  return saved || buffered;
}

export async function removeSession(setId, mode) {
  try {
    await (await storage()).sessions.remove(sessionId(setId, mode));
    ls()?.removeItem(legacyKey(setId, mode));
    return true;
  } catch {
    return false;
  }
}

/** Evidence for teacher reports: one row per item, written in the same transaction as the final session. */
export async function submitResult(set, mode, snapshot, result) {
  try {
    const store = await storage();
    const learner = await store.learnerId();
    const byId = Object.fromEntries(set.items.map((i) => [i.id, i]));
    const rows = result.rows.map((r) => {
      const item = byId[r.id] || {};
      const meta = item.meta || {};
      return {
        learner,
        setId: set.id,
        sessionId: result.sessionId,
        itemId: r.id,
        domain: r.domain,
        klu: r.klu,
        context: item.context || null,
        grade: set.grade,
        type: r.type,
        mode,
        status: r.status,
        correct: r.correct,
        independent: r.independent,
        supportTier: r.supportTier,
        attempts: r.attempts,
        band: meta.band || null,
        functions: meta.functions || [],
        parallel: meta.parallel || null,
        // A wrong first choice is tagged with the misconception the author wrote for that option.
        misconception: r.correct === false && r.chosen ? meta.misconceptions?.[r.chosen] || null : null,
        selfChecked: r.selfCheck,
        selfTotal: (item.speaking?.checklist || item.constructed?.checklist || []).length || null,
        t: result.submittedAt,
      };
    });
    await store.saveSessionWithEvidence({ session: { id: sessionId(set.id, mode), setId: set.id, mode, learner, status: "submitted", data: snapshot }, rows });
    return true;
  } catch {
    return false;
  }
}
