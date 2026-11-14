// Class-first sign-in on this device: join, sign back in on another computer, and sign out on a shared one.
// Built on the existing class link (class/link.js) and /api/class: a returning learner signs back in with the class
// code, their nickname and the student key shown once at join (stored hashed, rate-limited, teacher-resettable on the
// server), and the sync loop pulls their class copy down and merges it into this device.
import { classInfo, joinClass } from "../../../shared/class-platform/client.js";
import { isClassCode, normalizeCode } from "../../../shared/class-platform/contract.js";
import { startFresh } from "../reset.js";
import { storage } from "../util.js";
import { loadLink, saveLink, setAssignments, startSync, stopSync } from "./link.js";

/** "device" once a learner chooses to practice on this device only. Cleared with everything else on sign-out. */
export const PROMPT_KEY = "accessPracticeLabClass:v1:prompt";
export const promptChoice = () => storage.get(PROMPT_KEY) || "";
export const setPromptChoice = (value) =>
  value ? storage.set(PROMPT_KEY, value) : storage.remove(PROMPT_KEY);

/** A class code from a query string: `?join=CODE` (short link) or `?class=CODE` (the QR join link). */
export function joinCodeFromSearch(search) {
  const params = new URLSearchParams(search || "");
  const code = normalizeCode(params.get("join") || params.get("class") || "");
  return isClassCode(code) ? code : "";
}

/** The class code inside a scanned QR: a join link (any host; it is never opened) or a bare 6-character code. */
export function codeFromScan(text) {
  const raw = String(text ?? "").trim();
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" || url.protocol === "http:")
      return joinCodeFromSearch(url.search);
  } catch {}
  const code = normalizeCode(raw);
  return raw.length <= 12 && isClassCode(code) ? code : "";
}

/**
 * Join (no key) or sign back in (with the student key), save the link and pull the class copy.
 * `start` returns the running sync loop, so a view can pass its own status callbacks.
 * @returns the server answer plus `info` (class /info or null), `decision` (merge result) and `newKey`
 * (the key to show once, empty on a sign-back-in).
 */
export async function joinAndLink({
  code,
  alias,
  studentKey,
  fetchImpl = (...a) => fetch(...a),
  start,
}) {
  const res = await joinClass({ code, alias, studentKey: studentKey || undefined }, fetchImpl);
  if (!res.ok) return res;
  const clean = normalizeCode(code);
  const info = await classInfo(clean, fetchImpl);
  saveLink({
    code: clean,
    studentId: res.studentId,
    studentKey: res.studentKey,
    alias: res.alias,
    title: (info.ok ? info.title : res.title) || "",
  });
  if (info.ok) setAssignments(info.assignments);
  const sync = start ? start() : startSync({ fetchImpl });
  const decision = await sync.pull();
  return {
    ...res,
    info: info.ok ? info : null,
    decision,
    newKey: res.rejoined ? "" : res.studentKey,
  };
}

/** Send anything not yet in the class. `pending` is true when work on this device still has not reached it. */
export async function flushToClass({ fetchImpl = (...a) => fetch(...a) } = {}) {
  if (!loadLink()) return { pending: false };
  await startSync({ fetchImpl }).push();
  const after = loadLink();
  return { pending: Boolean(after && after.dirtyAt > after.syncedAt) };
}

/**
 * Sign out on this computer: stop syncing FIRST (clearing must never upload an empty copy over the class copy), forget
 * the link, then clear every lab key, recording and setting here so the next learner on a shared cart starts fresh.
 * The class keeps its copy; the learner signs back in with code + nickname + student key.
 */
export async function signOutDevice({ clear = startFresh } = {}) {
  stopSync();
  saveLink(null);
  await clear();
}
