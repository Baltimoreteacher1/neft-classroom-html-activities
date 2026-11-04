/**
 * Studio completion record: the one reader/writer of `nt-project-complete:v1:<missionId>`.
 *
 * A student writes one record by explicitly pressing "Mark this mission complete" in the Studio,
 * and only while the Studio's own readiness test passes. Nothing infers completion from partial
 * progress, the Completed Exemplar cannot produce one, and this file never touches any other key:
 * `ewl-project-studio:v1:<id>`, the legacy map `nt-project-complete:v1` and the Save/Resume
 * records are read-only to it. Schema: docs/specs/projects-completion-record.md.
 *
 * Every storage access is inside try/catch, so blocked or corrupt storage degrades to "no record".
 */
export const COMPLETE_VERSION = 1;
export const COMPLETE_SCHEMA = "nt-project-complete";
/** Prefix of the per-mission keys. The legacy page layer owns the exact key `nt-project-complete:v1`. */
export const COMPLETE_PREFIX = "nt-project-complete:v1:";
export const LEGACY_COMPLETE_KEY = "nt-project-complete:v1";
export const completeKeyFor = (id) => `${COMPLETE_PREFIX}${id}`;

/** The Studio's four-item self-review (Publish step). The browser gates pin these to the page's own labels. */
export const SELF_CHECK_ITEMS = [
  "My quantities, units and math match the current design.",
  "My drawing, table, graph or physical model is labeled and ready to include.",
  "I explained the original and revised designs with evidence.",
  "My recommendation includes a reason and a limitation.",
];

/** Text the Studio's "Load Completed Exemplar Project" writes; exemplar work is a demo, never a completion. */
export const EXEMPLAR_REVISION =
  "The model represents idealized measurements; material thickness, build variation and access needs could change a real decision.";
export function isExemplarWork(project, state) {
  return (
    state.revision === EXEMPLAR_REVISION &&
    String(state.claim).startsWith(
      `I recommend ${project.contextDetails[0][0]} because the checked results meet the goal.`,
    )
  );
}

const MAX = 6000;
const str = (value, limit = MAX) => (typeof value === "string" ? value.slice(0, limit) : "");
const isDateString = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const plainDesign = (design) =>
  design && typeof design === "object"
    ? Object.fromEntries(
        Object.entries(design)
          .filter(([, v]) => ["string", "number"].includes(typeof v))
          .map(([k, v]) => [k, String(v).slice(0, 200)]),
      )
    : null;

/**
 * Build the record for a student who pressed "complete". Throws unless the work really is ready:
 * `ready` is the Studio's own progress().ready, which needs every math check, evidence prompt,
 * the revision, the claim and all four self-review boxes.
 */
export function buildCompletionRecord(project, state, { passed, total, ready, prior = null, now = new Date() }) {
  if (!ready) throw new Error("A mission cannot be completed before its work is ready.");
  if (isExemplarWork(project, state)) throw new Error("The exemplar is a demonstration, not student work.");
  const completedAt = now.toISOString();
  const first = prior?.firstCompletedAt || prior?.completedAt || null;
  return {
    schema: COMPLETE_SCHEMA,
    version: COMPLETE_VERSION,
    source: "project-studio",
    missionId: project.id,
    registryId: project.id,
    title: project.title,
    unit: project.unit,
    completedAt,
    ...(first ? { firstCompletedAt: first } : {}),
    evidence: {
      context: str(state.choice, 200),
      vision: str(state.vision),
      prompts: project.evidence.map((prompt, i) => ({ prompt, text: str(state.evidence[i]) })),
      critique: str(state.critique),
      revision: str(state.revision),
      claim: str(state.claim),
      design: plainDesign(state.design),
      firstDesign: plainDesign(state.baseline?.design),
      mathChecks: { passed, total },
    },
    selfCheck: {
      items: SELF_CHECK_ITEMS.map((label, i) => ({ label, checked: state.review?.[i] === true })),
      checked: SELF_CHECK_ITEMS.filter((_, i) => state.review?.[i] === true).length,
      total: SELF_CHECK_ITEMS.length,
    },
  };
}

/** The record if (and only if) it is a complete, internally consistent v1 record for `id`; else null. */
export function validateCompletionRecord(record, id) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return null;
  if (record.schema !== COMPLETE_SCHEMA || record.version !== COMPLETE_VERSION) return null;
  if (record.missionId !== id || record.registryId !== id) return null;
  if (!isDateString(record.completedAt)) return null;
  const e = record.evidence;
  if (!e || typeof e !== "object" || !str(e.claim).trim() || !str(e.revision).trim()) return null;
  if (!Array.isArray(e.prompts) || !e.prompts.length) return null;
  if (e.prompts.some((p) => !str(p?.text).trim())) return null;
  const s = record.selfCheck;
  if (!s || !Array.isArray(s.items) || !s.items.length) return null;
  if (s.items.some((item) => item?.checked !== true) || s.checked !== s.total) return null;
  return record;
}

/** `storage` is injectable for tests; the default is the page's localStorage (which may throw). */
const defaultStorage = () => {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
};

export function readCompletion(id, storage = defaultStorage()) {
  try {
    return validateCompletionRecord(JSON.parse(storage.getItem(completeKeyFor(id))), id);
  } catch {
    return null;
  }
}

/** Returns true only when the record is really stored. */
export function writeCompletion(record, storage = defaultStorage()) {
  try {
    storage.setItem(completeKeyFor(record.missionId), JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/**
 * The legacy page layer's records: one map under `nt-project-complete:v1`, keyed by page path.
 * Returns Map(normalised path -> record) for records that carry a real completion time.
 */
export const normalizePath = (value) => {
  const bare = String(value || "").split("?")[0].split("#")[0].replace(/index\.html$/i, "");
  const rooted = bare.startsWith("/") ? bare : `/${bare}`;
  return rooted.endsWith("/") ? rooted : `${rooted}/`;
};
export function readLegacyCompletions(storage = defaultStorage()) {
  const out = new Map();
  try {
    const all = JSON.parse(storage.getItem(LEGACY_COMPLETE_KEY));
    if (!all || typeof all !== "object" || Array.isArray(all)) return out;
    for (const [path, record] of Object.entries(all))
      if (record && typeof record === "object" && isDateString(record.completedAt))
        out.set(normalizePath(path), record);
  } catch {
    /* unreadable store: no records */
  }
  return out;
}
