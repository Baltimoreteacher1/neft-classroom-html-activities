// Language Page side of the class platform (docs/class-platform.md): the opt-in link between this device's lab
// progress and a class, kept in the shared client (shared/class-platform/client.js) so The Language Page and Fluency
// Lab use ONE implementation and ONE /api/class. Nothing here runs until a learner joins; without a link the lab
// stays device-only exactly as before.
//
// The link holds a student key, so it lives OUTSIDE the `accessPracticeLab:v1:` namespace: that namespace is what
// Passport codes, Save/Resume and the class copy carry, and a key must never travel in any of them.
import {
  classInfo,
  cleanLink,
  createSync as createClassSync,
  LINK_KEY,
  studentApi,
} from "../../../shared/class-platform/client.js";
import { KEY_USES } from "../../../shared/class-platform/contract.js";
import { loadLedger } from "../lang/ledger.js";
import { allRecords, isActivityComplete, practiceDays, PREFIX, importProgressData } from "../store.js";
import { safeJson, storage } from "../util.js";
import { applyClassSupport, clearClassSupport } from "./support.js";

export { LINK_KEY };
export const api = studentApi("language");
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const loadLink = () => cleanLink(safeJson(storage.get(LINK_KEY), null));
export function saveLink(link) {
  if (link) storage.set(LINK_KEY, JSON.stringify(cleanLink(link)));
  else storage.remove(LINK_KEY);
}

const DOMAINS = ["Listening", "Speaking", "Reading", "Writing"];

/** Everything the lab keeps for this learner, in the same shape the Save/Resume provider uses (`accessLab: 1`). */
export function makeBackup() {
  const data = {};
  for (const key of storage.keys()) if (key.startsWith(`${PREFIX}:`)) data[key] = storage.get(key);
  return { accessLab: 1, data };
}

export const hasLocalProgress = () => Object.keys(makeBackup().data).some((k) => k !== `${PREFIX}:prefs`);

/** Key Language Use x domain counts from the ledger ({ Narrate: { writing: 2 } }); entries without a use are skipped. */
export function useCounts(entries = loadLedger().entries) {
  const byUse = {};
  for (const e of entries) {
    const domain = String(e?.domain || "").toLowerCase();
    if (!KEY_USES.includes(e?.use) || !DOMAINS.some((d) => d.toLowerCase() === domain)) continue;
    const row = (byUse[e.use] ||= {});
    row[domain] = Math.min(1_000_000, (row[domain] || 0) + 1);
  }
  return byUse;
}

/**
 * What the teacher dashboard and class goal see: counts per domain and per Key Language Use, which assigned
 * activities are done, and this week's activity. Counts and ids only; never a response, a recording or a score.
 */
export function languageSummary({ assignmentIds = [], now = Date.now() } = {}) {
  const domains = {};
  const done = new Set();
  let weekEvidence = 0;
  let lastActivity = 0;
  for (const { domain, record } of allRecords()) {
    const key = domain.toLowerCase();
    if (!DOMAINS.includes(domain)) continue;
    for (const id of assignmentIds) if (isActivityComplete(record, id)) done.add(id);
    for (const result of Object.values(record.results)) {
      if (!result?.date || result.meaningful === false || result.practiced === false) continue;
      domains[key] = Math.min(1_000_000, (domains[key] || 0) + 1);
      const at = Date.parse(result.date);
      if (Number.isFinite(at)) {
        lastActivity = Math.max(lastActivity, at);
        if (now - at <= WEEK_MS) weekEvidence += 1;
      }
    }
  }
  const weekDays = practiceDays().filter((d) => now - Date.parse(`${d}T12:00:00`) <= WEEK_MS).length;
  return {
    domains,
    byUse: useCounts(),
    assignmentsDone: [...done].slice(0, 60),
    weekEvidence: Math.min(100_000, weekEvidence),
    weekDays: Math.min(7, weekDays),
    ...(lastActivity ? { lastActivity: Math.floor(lastActivity) } : {}),
  };
}

let sync = null;
let unsubscribe = null;
let assignments = [];
/** The class's current assignments (from /info), so the summary can say which are done. */
export const setAssignments = (list) => {
  assignments = Array.isArray(list) ? list : [];
};
const isProgressKey = (key) => key.startsWith(`${PREFIX}:`);

/**
 * Start (or return) the sync loop for the linked class. The class copy is MERGED into this device through the lab's
 * own importer (`importProgressData`), which keeps work already here and adds what is missing, so no prompt can lose
 * anything; the merged result then goes back up as the newest copy.
 */
export function startSync({ onStatus, onMerged, fetchImpl = (...a) => fetch(...a) } = {}) {
  if (sync) return sync;
  sync = createClassSync({
    doc: "language",
    loadLink,
    saveLink,
    getBackup: makeBackup,
    getSummary: () => languageSummary({ assignmentIds: assignments.map((a) => a.id) }),
    hasLocalProgress,
    onStatus,
    fetchImpl,
    onRemoteNewer({ data, updatedAt }, decision) {
      try {
        importProgressData(data?.data || {});
      } catch {
        onStatus?.({ state: "error", error: "restore-failed" });
        return;
      }
      sync.acceptRemote(updatedAt);
      onMerged?.(decision);
      if (decision === "ask") sync.keepLocal(updatedAt); // the union is now the newest copy
    },
  });
  unsubscribe = storage.subscribe((key) => {
    if (isProgressKey(key)) sync?.markDirty();
  });
  return sync;
}

export function stopSync() {
  sync?.stop();
  unsubscribe?.();
  sync = null;
  unsubscribe = null;
}

/** Called once at lab start-up: with a link on this device, pull the class copy and keep syncing. No link, no work. */
export async function bootClassSync(fetchImpl = (...a) => fetch(...a)) {
  const link = loadLink();
  if (!link) return null;
  const info = await classInfo(link.code, fetchImpl);
  if (info.ok) setAssignments(info.assignments);
  refreshClassSupport(link, fetchImpl);
  const running = startSync({ fetchImpl });
  running.pull();
  return running;
}

/** Read this learner's starting support and Road week from the class and apply them as defaults (support.js). */
export async function refreshClassSupport(link = loadLink(), fetchImpl = (...a) => fetch(...a)) {
  if (!link) return false;
  const me = await api.whoAmI(link, fetchImpl);
  return me.ok ? applyClassSupport(me) : false;
}

/** Leave the class on this device: the link is forgotten, local progress stays, the class keeps its copy. */
export function leaveClass() {
  stopSync();
  saveLink(null);
  clearClassSupport();
}
