// B2 Speaking Studio — on-device IndexedDB recording store, 3-line EN+ES self-check,
// one-tap delete, partner turn prompts from real unit data, and completion-only summary.
// D8 privacy lock: recordings stay on this device and are never uploaded.

export const SPEAKING_DB_NAME = "ewl-speaking-studio-v1";
export const SPEAKING_STORE_NAME = "recordings";
export const D8_ON_DEVICE_NOTICE = "Recordings stay on this device and are never uploaded.";

export const SELF_CHECK_LINES = Object.freeze([
  Object.freeze({
    id: "vocab",
    en: "I used a key vocabulary word.",
    es: "Usé una palabra clave del vocabulario.",
  }),
  Object.freeze({
    id: "sentences",
    en: "I spoke in complete sentences.",
    es: "Hablé en oraciones completas.",
  }),
  Object.freeze({
    id: "ideas",
    en: "I checked my ideas clearly.",
    es: "Revisé mis ideas con claridad.",
  }),
]);

/**
 * Explicit D8 lock guard: rejects any configuration that attempts to upload, sync,
 * or send student recordings off-device.
 */
export function assertOnDeviceOnly(options = {}) {
  if (options && typeof options === "object") {
    const forbidden =
      Boolean(options.upload) ||
      Boolean(options.syncToCloud) ||
      Boolean(options.sendToModel) ||
      Boolean(options.uploadUrl) ||
      Boolean(options.remoteUrl) ||
      Boolean(options.endpoint);
    if (forbidden) {
      throw new Error(
        "D8 lock: speaking recordings must stay on this device and cannot be uploaded.",
      );
    }
  }
  return { ok: true, storage: "indexeddb-local", dbName: SPEAKING_DB_NAME };
}

export function isIndexedDbAvailable() {
  return typeof indexedDB !== "undefined";
}

function openSpeakingDb() {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error("IndexedDB is unavailable in this environment."));
      return;
    }
    const req = indexedDB.open(SPEAKING_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SPEAKING_STORE_NAME)) {
        db.createObjectStore(SPEAKING_STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function runTx(mode, fn) {
  const db = await openSpeakingDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SPEAKING_STORE_NAME, mode);
    const req = fn(tx.objectStore(SPEAKING_STORE_NAME));
    tx.oncomplete = () => {
      db.close();
      resolve(req?.result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error("IndexedDB transaction aborted."));
    };
  });
}

function toMeta(row) {
  return {
    id: row.id,
    unitId: row.unitId || "",
    createdAt: row.createdAt,
    durationSeconds: Number(row.durationSeconds) || 0,
    mimeType: row.mimeType || "audio/webm",
    partnerRole: row.partnerRole || "solo",
    selfCheck: Array.isArray(row.selfCheck) ? row.selfCheck : [],
  };
}

/** Save a recording blob + metadata strictly in on-device IndexedDB. */
export async function saveRecording(record, options = {}) {
  assertOnDeviceOnly(options);
  const id = String(record?.id || `spk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const entry = {
    id,
    unitId: String(record?.unitId || ""),
    createdAt: record?.createdAt || new Date().toISOString(),
    durationSeconds: Math.max(0, Number(record?.durationSeconds) || 0),
    mimeType: String(record?.mimeType || record?.blob?.type || "audio/webm"),
    partnerRole:
      record?.partnerRole === "A" || record?.partnerRole === "B" ? record.partnerRole : "solo",
    selfCheck: Array.isArray(record?.selfCheck) ? [...record.selfCheck] : [],
    blob: record?.blob ?? null,
  };
  await runTx("readwrite", (store) => store.put(entry));
  return toMeta(entry);
}

/** List on-device recording metadata (without audio blobs), newest first. */
export async function listRecordings() {
  if (!isIndexedDbAvailable()) return [];
  const rows = (await runTx("readonly", (store) => store.getAll())) || [];
  return rows.map(toMeta).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

/** Load a single recording (including local blob) for on-device playback. */
export async function getRecording(id) {
  if (!isIndexedDbAvailable() || !id) return null;
  return (await runTx("readonly", (store) => store.get(String(id)))) || null;
}

/** One-tap delete: removes a recording immediately from IndexedDB. */
export async function deleteRecording(id) {
  if (!isIndexedDbAvailable() || !id) return false;
  await runTx("readwrite", (store) => store.delete(String(id)));
  return true;
}

/** Remove all on-device recordings from IndexedDB. */
export async function clearAllRecordings() {
  if (!isIndexedDbAvailable()) return false;
  await runTx("readwrite", (store) => store.clear());
  return true;
}

function extractAuthoredTerms(unitOrDetail) {
  const vocab =
    unitOrDetail?.connections?.[0]?.tier2_tier3_vocab ||
    unitOrDetail?.tier2_tier3_vocab ||
    unitOrDetail?.vocab ||
    [];
  const out = [];
  const seen = new Set();
  for (const item of vocab) {
    const raw = typeof item === "string" ? item : item?.term;
    const term = String(raw || "").trim();
    if (!term) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(term);
    if (out.length >= 4) break;
  }
  return out;
}

/**
 * Partner mode turn-taking prompts derived from real unit data (paper or on-device only).
 * @param {object} unitOrDetail - Full unit detail ({ unit, connections }) or flat unit object.
 * @param {"A"|"B"} role - Partner A or Partner B.
 */
export function buildPartnerTurn(unitOrDetail, role = "A") {
  const unit = unitOrDetail?.unit || unitOrDetail || {};
  const unitId = String(unit.id || "").trim();
  const unitTitle = String(unit.unit_title || unit.title || "Current Unit").trim();
  const essentialQuestion = String(
    unit.essential_question || `What is one big idea from ${unitTitle}?`,
  ).trim();
  const targetWords = extractAuthoredTerms(unitOrDetail);
  const wordPreview = targetWords.slice(0, 2).join(", ");
  const normalizedRole = String(role || "A").toUpperCase() === "B" ? "B" : "A";

  if (normalizedRole === "A") {
    return {
      role: "A",
      partnerLabel: "Partner A (Ask & Listen)",
      unitId,
      unitTitle,
      essentialQuestion,
      targetWords,
      prompt: `Ask your partner: "${essentialQuestion}" Listen carefully for a key word${wordPreview ? ` (${wordPreview})` : ""}, then say one detail you heard.`,
      sentenceStarter: "I heard you explain that ___ because ___.",
      mode: "on-device-or-paper",
    };
  }

  return {
    role: "B",
    partnerLabel: "Partner B (Explain & Connect)",
    unitId,
    unitTitle,
    essentialQuestion,
    targetWords,
    prompt: `Answer the question "${essentialQuestion}" in 2 complete sentences${wordPreview ? ` using ${wordPreview}` : ""}. Then ask Partner A if they want to add one more idea.`,
    sentenceStarter: wordPreview
      ? `One key idea about ${unitTitle} is ___ because ${targetWords[0]} ___.`
      : `One key idea about ${unitTitle} is ___ because ___.`,
    mode: "on-device-or-paper",
  };
}

/**
 * Completion-only teacher summary: returns ONLY { completedCount, lastCompletedAt }.
 * Never exposes audio blobs, transcripts, student names, aliases, or scores.
 */
export function completionSummary(records) {
  const list = Array.isArray(records) ? records : [];
  let completedCount = 0;
  let lastCompletedAt = null;
  let lastMs = -Infinity;

  for (const r of list) {
    if (!r || typeof r !== "object") continue;
    const ts = r.completedAt || r.createdAt || null;
    if (!r.id && !ts) continue;
    completedCount += 1;
    if (typeof ts === "string" && ts.trim()) {
      const parsed = Date.parse(ts);
      if (!Number.isNaN(parsed) && parsed > lastMs) {
        lastMs = parsed;
        lastCompletedAt = ts;
      }
    }
  }

  return { completedCount, lastCompletedAt };
}
