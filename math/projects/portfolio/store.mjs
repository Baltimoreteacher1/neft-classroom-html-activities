/**
 * Reads what this device really holds about each project. Read-only: nothing here writes storage.
 * Every access is inside try/catch, so blocked, corrupt or foreign data shows as "nothing saved".
 *
 * Sources, in the order they are trusted for COMPLETION (a record the student created by pressing
 * a completion control) and, separately, for SAVED WORK:
 *   complete  nt-project-complete:v1:<id>   Studio completion record (validated, completion.mjs)
 *             nt-project-complete:v1        legacy page layer, one map keyed by page path
 *   saved     ewl-project-studio:v1:<id>    Studio save
 *             nsr:rec:<code>                shared Save/Resume record of a classic page (by rec.url)
 *             nt-project-reflect:<path> / -rubric:<path> / -peer / -level / -workspace, and the
 *             page's own registry-declared keys
 */
import {
  normalizePath,
  readCompletion,
  readLegacyCompletions,
} from "../../../curriculum/projects/studio/completion.mjs";

const LAYER_KEY = /^nt-project-(reflect|rubric|peer|level|workspace):(\/[^:]*)/;
const text = (v) => (typeof v === "string" ? v.trim() : "");
const plain = (design) =>
  design && typeof design === "object"
    ? Object.fromEntries(
        Object.entries(design)
          .filter(([, v]) => ["string", "number"].includes(typeof v))
          .map(([k, v]) => [k, String(v).slice(0, 200)]),
      )
    : null;

function parse(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** A Studio save is real when it belongs to this mission and the student did something in it. */
function studioSave(project, storage) {
  const saved = parse(storage, project.studioKey);
  if (!saved || typeof saved !== "object" || saved.version !== 1 || saved.projectId !== project.id)
    return null;
  const evidence = Array.isArray(saved.evidence) ? saved.evidence.map(text) : [];
  const checked = Object.values(saved.checked || {}).filter((v) => v === true).length;
  const touched =
    saved.stage > 0 ||
    text(saved.choice) ||
    ["vision", "critique", "revision", "claim"].some((f) => text(saved[f])) ||
    evidence.some(Boolean) ||
    checked ||
    saved.baseline;
  if (!touched) return null;
  return {
    step: Number.isInteger(saved.stage) ? saved.stage + 1 : 1,
    checks: checked,
    context: text(saved.choice),
    vision: text(saved.vision),
    evidence,
    critique: text(saved.critique),
    revision: text(saved.revision),
    claim: text(saved.claim),
    review: Array.isArray(saved.review) ? saved.review.map((v) => v === true) : [],
    design: plain(saved.design),
    firstDesign: plain(saved.baseline?.design),
  };
}

/** Every classic-page record on the device, by normalised page path. */
function scanClassic(storage) {
  const byPath = new Map();
  const at = (path) => {
    if (!byPath.has(path)) byPath.set(path, {});
    return byPath.get(path);
  };
  let keys = [];
  try {
    for (let i = 0; i < storage.length; i += 1) keys.push(storage.key(i));
  } catch {
    keys = [];
  }
  for (const key of keys) {
    try {
      if (key.startsWith("nsr:rec:")) {
        const rec = JSON.parse(storage.getItem(key));
        if (!rec || typeof rec.url !== "string") continue;
        const entry = at(normalizePath(rec.url));
        const when = Date.parse(rec.updatedAt);
        if (entry.updated && !(when > entry.updated)) continue;
        const fields = rec.state?.fields && typeof rec.state.fields === "object" ? rec.state.fields : {};
        entry.updated = Number.isFinite(when) ? when : 0;
        entry.percent = Number(rec.progressPercent) > 0 ? Math.round(Number(rec.progressPercent)) : null;
        entry.answers = Object.values(fields).filter(
          (f) =>
            f && ["input", "textarea"].includes(f.t) && typeof f.v === "string" && f.v.trim(),
        ).length;
        entry.record = true;
        continue;
      }
      const m = key.match(LAYER_KEY);
      if (!m || !storage.getItem(key)) continue;
      const entry = at(normalizePath(m[2]));
      entry.layers = true;
      const value = parse(storage, key);
      if (m[1] === "reflect" && value && typeof value === "object")
        entry.reflections = Object.fromEntries(
          Object.entries(value)
            .filter(([, v]) => text(v))
            .map(([k, v]) => [k, text(v)]),
        );
      if (m[1] === "rubric" && value && typeof value === "object") {
        const scores = Object.values(value).filter((v) => typeof v === "number" && Number.isFinite(v));
        entry.rubricScored = scores.length;
        entry.rubricSum = scores.reduce((a, b) => a + b, 0);
      }
    } catch {
      /* one unreadable record shows nothing */
    }
  }
  return byPath;
}

const hasKey = (storage, key) => {
  try {
    return Boolean(storage.getItem(key));
  } catch {
    return false;
  }
};

/** Everything the page shows, for every registry project, in registry order. */
export function loadPortfolio(data, storage) {
  const classic = scanClassic(storage);
  const legacyDone = readLegacyCompletions(storage);
  return data.projects.map((project) => {
    const studio = studioSave(project, storage);
    const studioDone = readCompletion(project.id, storage);
    const path = project.page ? normalizePath(project.launch) : null;
    const entry = path ? classic.get(path) || null : null;
    const pageKeySaved = project.page && project.pageKeys.some((k) => hasKey(storage, k));
    const legacy =
      entry || pageKeySaved
        ? {
            percent: entry?.percent ?? null,
            updated: entry?.updated || null,
            answers: entry?.answers ?? 0,
            reflections: entry?.reflections || null,
            rubricScored: entry?.rubricScored ?? 0,
            rubricSum: entry?.rubricSum ?? 0,
          }
        : null;
    const legacyRecord = path ? legacyDone.get(path) || null : null;
    const completions = [];
    if (studioDone)
      completions.push({ kind: "studio", at: studioDone.completedAt, record: studioDone });
    if (legacyRecord)
      completions.push({ kind: "classic", at: legacyRecord.completedAt, record: legacyRecord });
    const status = completions.length ? "complete" : studio || legacy ? "in-progress" : "not-started";
    return { project, status, studio, legacy, studioDone, legacyRecord, completions };
  });
}
