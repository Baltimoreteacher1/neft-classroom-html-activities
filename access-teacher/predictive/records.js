// Canonical assessment records. Annual results (ACCESS, Kindergarten ACCESS) live in the Teacher Hub's own
// official-results store, one per school year, exactly where the hub already keeps them; interim results
// (MODEL Online, MODEL Paper, Kindergarten MODEL) can be given several times a year and live in the studio's
// interim store. Both are read through `recordsOf`, which returns one ScoreRecord shape. Rows written before
// this schema (year, levels, overall) are ACCESS rows and read unchanged. Forecasts are stored elsewhere and
// never touch these records.
import { parseYear } from "../../access-practice-lab/src/lang/official-scores.js";
import {
  ASSESSMENTS,
  COMPOSITES,
  compositeRuleFor,
  DOMAINS,
  isInterim,
  levelVersionOf,
  SCALE_RANGES,
  SCORE_KEYS,
  scaleVersionOf,
} from "./rules.js";

export const SCHEMA_VERSION = 2;
const LEVEL_RE = /^\d(?:\.\d)?$/;

export function newId(prefix = "as") {
  const rand =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${rand}`;
}

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** One stored row (hub or interim) -> ScoreRecord. */
export function fromStored(row, studentId, store = "official") {
  const type =
    row.assessment && ASSESSMENTS[row.assessment]
      ? row.assessment
      : store === "interim"
        ? "MODEL_ONLINE"
        : "ACCESS";
  const year = row.year;
  const scaleVersion = scaleVersionOf(type, year);
  const levelVersion = levelVersionOf(type, year, row.levelVersion);
  const notAssessed = new Set(row.notAssessed || []);
  const prov = row.provenance || {};
  const score = (key) => {
    const level =
      key === "Overall"
        ? num(row.overall)
        : DOMAINS.includes(key)
          ? num(row.levels?.[key])
          : num(row.composites?.[key]);
    const scale = num(row.scale?.[key]);
    const sem = num(row.sem?.[key]);
    const status = notAssessed.has(key)
      ? "not-assessed"
      : level == null && scale == null
        ? "missing"
        : "reported";
    return { level, scale, sem, status, provenance: prov[key] || prov.record || null };
  };
  const domains = Object.fromEntries(DOMAINS.map((d) => [d, score(d)]));
  const composites = Object.fromEntries(COMPOSITES.map((c) => [c, score(c)]));
  // A missing composite scale score may be ILLUSTRATED from reported domain scale scores, never a level.
  const rule = compositeRuleFor(scaleVersion);
  if (rule)
    for (const c of COMPOSITES) {
      if (composites[c].scale != null) continue;
      const w = rule.weights[c];
      const parts = Object.keys(w).map((d) => domains[d].scale);
      if (parts.some((x) => x == null)) continue;
      const value = Object.keys(w).reduce((sum, d) => sum + w[d] * domains[d].scale, 0);
      composites[c] = {
        ...composites[c],
        calculatedScale: Math.round(value),
        calculatedBy: rule.id,
        status: composites[c].level != null ? "reported" : "calculated",
      };
    }
  return {
    assessmentId: row.id || `${store}:${studentId}:${type}:${year}:${row.date || ""}`,
    studentId,
    assessmentType: type,
    administrationDate: row.date || "",
    academicYear: year,
    grade: row.grade ?? null,
    assessmentVersion: row.assessmentVersion || ASSESSMENTS[type].label,
    scaleVersion,
    levelVersion,
    form: row.form || "",
    domains,
    composites,
    sourceType: row.source || (row.provenance ? "csv" : "manual"),
    sourceVerified: row.verified !== false,
    dataQualityFlags: row.flags || [],
    createdAt: row.createdAt || "",
    updatedAt: row.updatedAt || "",
    schemaVersion: row.schema || 1,
    store,
    synthetic: Boolean(row.synthetic),
  };
}

/** Every record for a student, oldest first (by school year, then date). */
export function recordsOf(student) {
  return [
    ...(student.official || []).map((r) => fromStored(r, student.id, "official")),
    ...(student.interim || []).map((r) => fromStored(r, student.id, "interim")),
  ].sort(
    (a, b) =>
      a.academicYear.localeCompare(b.academicYear) ||
      (a.administrationDate || "").localeCompare(b.administrationDate || "") ||
      (isInterim(a.assessmentType) ? -1 : 1) - (isInterim(b.assessmentType) ? -1 : 1),
  );
}
export const latestRecord = (student, filter = () => true) =>
  recordsOf(student).filter(filter).at(-1) || null;

/**
 * Validate a draft typed or imported by a teacher. `draft` holds raw strings:
 * { assessment, year, date, grade, form, levelVersion, scores: { Listening: { level, scale, sem, notAssessed } … } }.
 * Returns { ok, errors, warnings, row } where `row` is the stored shape.
 */
export function validateDraft(draft, { today = new Date() } = {}) {
  const errors = [];
  const warnings = [];
  const type = ASSESSMENTS[draft.assessment] ? draft.assessment : null;
  if (!type)
    errors.push(
      `Assessment "${draft.assessment || ""}" is not one of: ${Object.values(ASSESSMENTS)
        .map((a) => a.short)
        .join(", ")}.`,
    );
  const year = parseYear(draft.year);
  if (!year) errors.push(`School year "${draft.year || ""}" must look like 2025-26.`);
  const nowStart = today.getUTCMonth() >= 6 ? today.getUTCFullYear() : today.getUTCFullYear() - 1;
  if (year && Number(year.slice(0, 4)) > nowStart)
    errors.push(`School year ${year} is in the future.`);
  const date = String(draft.date || "").trim();
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push(`Date "${date}" must be YYYY-MM-DD.`);
  if (date && year) {
    const start = Number(year.slice(0, 4));
    if (date < `${start}-07-01` || date > `${start + 1}-06-30`)
      warnings.push(`Date ${date} is outside school year ${year}.`);
  }
  const gradeRaw = String(draft.grade ?? "")
    .trim()
    .toUpperCase();
  const grade =
    gradeRaw === "" ? null : gradeRaw === "K" || gradeRaw === "0" ? "K" : Number(gradeRaw);
  if (grade !== null && grade !== "K" && !(Number.isInteger(grade) && grade >= 1 && grade <= 12))
    errors.push(`Grade "${draft.grade}" must be K or 1-12.`);
  if (type && grade != null) {
    const kType = type.startsWith("KINDERGARTEN");
    if (kType !== (grade === "K"))
      warnings.push(
        `${ASSESSMENTS[type].short} does not usually go with grade ${grade}. Check the assessment type.`,
      );
  }
  const scaleVersion = type && year ? scaleVersionOf(type, year) : null;
  const range = SCALE_RANGES[scaleVersion] || null;
  const row = {
    id: draft.id || newId(),
    schema: SCHEMA_VERSION,
    assessment: type,
    year,
    date,
    grade,
    form: String(draft.form || "")
      .trim()
      .slice(0, 40),
    levelVersion: type && year ? levelVersionOf(type, year, draft.levelVersion) : null,
    levels: {},
    overall: null,
    composites: {},
    scale: {},
    sem: {},
    notAssessed: [],
    source: draft.source || "manual",
    verified: Boolean(draft.verified),
  };
  let any = 0;
  for (const key of SCORE_KEYS) {
    const s = draft.scores?.[key] || {};
    if (s.notAssessed) {
      row.notAssessed.push(key);
      continue;
    }
    const lv = String(s.level ?? "").trim();
    if (lv) {
      const n = Number(lv);
      if (!LEVEL_RE.test(lv) || n < 1 || n > 6)
        errors.push(`${key} level "${lv}" must be 1.0 to 6.0 with at most one decimal.`);
      else {
        any++;
        if (key === "Overall") row.overall = n;
        else if (DOMAINS.includes(key)) row.levels[key] = n;
        else row.composites[key] = n;
      }
    }
    const sc = String(s.scale ?? "").trim();
    if (sc) {
      const n = Number(sc);
      if (!/^\d{1,4}$/.test(sc)) errors.push(`${key} scale score "${sc}" must be a whole number.`);
      else if (range && (n < range[0] || n > range[1]))
        errors.push(`${key} scale score ${n} is outside ${range[0]}-${range[1]} for this scale.`);
      else {
        any++;
        // Only the 2016 ACCESS range is documented (rules.js SCALE_RANGES); other versions are stored as typed.
        row.scale[key] = n;
      }
    }
    const se = String(s.sem ?? "").trim();
    if (se) {
      const n = Number(se);
      if (!(n > 0 && n < 200))
        errors.push(`${key} measurement error "${se}" must be a positive number.`);
      else row.sem[key] = n;
    }
  }
  if (!any) errors.push("Enter at least one level or scale score.");
  if (row.overall == null && row.scale.Overall == null && any)
    warnings.push("No reported Overall score. Composites are never built by averaging levels.");
  return { ok: !errors.length, errors, warnings: [...new Set(warnings)], row };
}

/** Where a validated row is saved, and whether it would replace one already on file. */
export function placeRow(stores, studentId, row) {
  const store = isInterim(row.assessment) ? "interim" : "official";
  const list = stores[store][studentId] || [];
  const clash =
    store === "official"
      ? list.find((r) => r.year === row.year)
      : list.find((r) => r.assessment === row.assessment && r.date && r.date === row.date);
  return { store, clash: clash || null };
}

/** Save a row (replacing the clash only when `replace`). Returns new stores; never mutates. */
export function saveRow(
  stores,
  studentId,
  row,
  { replace = false, at = new Date().toISOString() } = {},
) {
  const { store, clash } = placeRow(stores, studentId, row);
  if (clash && !replace) return { stores, saved: false, clash };
  const next = { official: { ...stores.official }, interim: { ...stores.interim } };
  const stamped = { ...row, createdAt: clash?.createdAt || at, updatedAt: at };
  const kept = (next[store][studentId] || []).filter((r) => r !== clash);
  next[store][studentId] = [...kept, stamped].sort(
    (a, b) => a.year.localeCompare(b.year) || (a.date || "").localeCompare(b.date || ""),
  );
  return { stores: next, saved: true, clash, store, before: clash ? structuredClone(clash) : null };
}

/** Remove one record by id from whichever store holds it. */
export function removeRow(stores, studentId, id) {
  const next = { official: { ...stores.official }, interim: { ...stores.interim } };
  for (const k of ["official", "interim"]) {
    const list = next[k][studentId];
    if (!list) continue;
    const kept = list.filter(
      (r) =>
        (r.id || `${k}:${studentId}:${r.assessment || "ACCESS"}:${r.year}:${r.date || ""}`) !== id,
    );
    if (kept.length) next[k][studentId] = kept;
    else delete next[k][studentId];
  }
  return next;
}
