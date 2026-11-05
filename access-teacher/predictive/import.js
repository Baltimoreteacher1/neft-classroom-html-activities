// CSV import of historical ACCESS results into the Teacher Hub's official-results store. Pure functions:
// parse -> validate (preview) -> apply (on the teacher's confirmation) -> undo. A value that differs from an
// existing official result is a CONFLICT and is skipped unless the teacher explicitly chooses to replace it;
// identical values are reported as already on file. Every imported level carries its provenance (file, line,
// import id, time), and every import keeps the prior state of each touched result so it can be undone.
import { SCALE_RESET_YEAR } from "../../access-practice-lab/src/lang/dna.js";
import {
  OFFICIAL_DOMAINS,
  parseLevel,
  parseYear,
} from "../../access-practice-lab/src/lang/official-scores.js";
import { IMPORT_PREFIX } from "./store.js";

export const IMPORT_COLUMNS = Object.freeze({
  required: ["student", "year", "domain", "level"],
  optional: ["scale_score"],
});
export const TEMPLATE =
  "student,year,domain,level,scale_score\nStudent A,2023-24,Listening,3.4,331\nStudent A,2023-24,Overall,3.1,\n";
const LABELS = new Map([
  ...OFFICIAL_DOMAINS.map((d) => [d.toLowerCase(), d]),
  ["overall", "Overall"],
  ["overall composite", "Overall"],
  ["composite", "Overall"],
  ["overall score", "Overall"],
]);
const HEADER_ALIASES = {
  scale: "scale_score",
  "scale score": "scale_score",
  scalescore: "scale_score",
  name: "student",
  "student id": "student",
  "school year": "year",
};

/** RFC 4180-style CSV parser: quoted fields, doubled quotes, CRLF. Returns rows of strings. */
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const src = String(text ?? "").replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') ((cell += '"'), i++);
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") (row.push(cell), (cell = ""));
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) (row.push(cell), rows.push(row));
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

const norm = (x) => String(x ?? "").trim();
const key = (studentId, year) => `${studentId}\u0000${year}`;
const valueIn = (result, domain) =>
  (domain === "Overall" ? result?.overall : result?.levels?.[domain]) ?? null;

/** Match a CSV student to a roster student by id, then by alias (case-insensitive, must be unique). */
function matcher(roster) {
  const byId = new Map(roster.map((s) => [s.id, s]));
  const byAlias = new Map();
  for (const s of roster) {
    const k = s.name.trim().toLowerCase();
    byAlias.set(k, byAlias.has(k) ? null : s);
  }
  return (raw) => byId.get(raw) || byAlias.get(raw.toLowerCase()) || null;
}

/**
 * Validate CSV text against the existing store. `roster` is [{ id, name }]; `official` the hub's map
 * { studentId: [{ year, levels, overall }] }. Returns { ok, headerErrors, rows, summary }.
 */
export function validateImport(text, { roster = [], official = {}, today = new Date() } = {}) {
  const table = parseCSV(text);
  const headerErrors = [];
  if (!table.length)
    return { ok: false, headerErrors: ["The file is empty."], rows: [], summary: summarize([]) };
  const header = table[0].map((h) => {
    const k = norm(h).toLowerCase();
    return HEADER_ALIASES[k] || k.replace(/\s+/g, "_");
  });
  for (const col of IMPORT_COLUMNS.required)
    if (!header.includes(col))
      headerErrors.push(
        `Missing column "${col}". Expected: ${[...IMPORT_COLUMNS.required, ...IMPORT_COLUMNS.optional].join(", ")}.`,
      );
  if (headerErrors.length) return { ok: false, headerErrors, rows: [], summary: summarize([]) };
  const col = (r, name) => norm(r[header.indexOf(name)]);
  const match = matcher(roster);
  const nowYear = (() => {
    const d = new Date(today);
    const s = d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
    return `${s}-${String((s + 1) % 100).padStart(2, "0")}`;
  })();
  const seen = new Map();
  const rows = table.slice(1).map((r, i) => {
    const line = i + 2;
    const errors = [];
    const flags = [];
    const student = col(r, "student");
    const rawYear = col(r, "year");
    const rawDomain = col(r, "domain");
    const rawLevel = col(r, "level");
    const rawScale = header.includes("scale_score") ? col(r, "scale_score") : "";
    if (!student) errors.push("Student is missing.");
    const year = parseYear(rawYear);
    if (!rawYear) errors.push("Year is missing.");
    else if (!year) errors.push(`Year "${rawYear}" is not a school year like 2024-25.`);
    else if (year > nowYear) errors.push(`Year ${year} is in the future.`);
    const domain = LABELS.get(rawDomain.toLowerCase()) || null;
    if (!rawDomain) errors.push("Domain is missing.");
    else if (!domain)
      errors.push(`Domain "${rawDomain}" is not Listening, Speaking, Reading, Writing or Overall.`);
    const level = parseLevel(rawLevel);
    if (!rawLevel) errors.push("Level is missing.");
    else if (level === null)
      errors.push(`Level "${rawLevel}" must be 1.0 to 6.0 with at most one decimal.`);
    let scale = null;
    if (rawScale) {
      const n = Number(rawScale);
      if (!/^\d{3}$/.test(rawScale) || n < 100 || n > 600)
        errors.push(`Scale score "${rawScale}" must be a whole number from 100 to 600.`);
      else scale = n;
    }
    const rosterStudent = student ? match(student) : null;
    const studentId = rosterStudent
      ? rosterStudent.id
      : student
        ? `${IMPORT_PREFIX}${student}`
        : null;
    if (student && !rosterStudent)
      flags.push("Not on the roster: kept as imported history under this name.");
    if (year && year >= SCALE_RESET_YEAR)
      flags.push(
        `Post-reset scale (${SCALE_RESET_YEAR} onward): not comparable with earlier years.`,
      );
    let status = errors.length ? "error" : "new";
    if (!errors.length) {
      const dup = key(studentId, year) + domain;
      if (seen.has(dup)) {
        status = "duplicate";
        errors.push(`Duplicate of line ${seen.get(dup)} (same student, year and domain).`);
      } else seen.set(dup, line);
      const existing = (official[studentId] || []).find((x) => x.year === year);
      const current = valueIn(existing, domain);
      if (status === "new" && current != null)
        status = current === level ? "unchanged" : "conflict";
      if (status === "conflict")
        flags.push(
          `An official result is already on file (${current.toFixed(1)}). It is kept unless you choose to replace it.`,
        );
    }
    return {
      line,
      student,
      studentId,
      onRoster: Boolean(rosterStudent),
      year,
      domain,
      level,
      scale,
      status,
      errors,
      flags,
    };
  });
  // Cross-reset comparison flag: one student with rows on both sides of the reset.
  const sides = new Map();
  for (const r of rows.filter((x) => x.year)) {
    const s = sides.get(r.studentId) || new Set();
    s.add(r.year >= SCALE_RESET_YEAR ? "post" : "pre");
    sides.set(r.studentId, s);
  }
  for (const r of rows)
    if (sides.get(r.studentId)?.size === 2)
      r.flags.push(
        "This student has results on both sides of the scale reset; growth across it is not comparable.",
      );
  return {
    ok: !headerErrors.length && rows.some((r) => r.status === "new" || r.status === "conflict"),
    headerErrors,
    rows,
    summary: summarize(rows),
  };
}

function summarize(rows) {
  const count = (s) => rows.filter((r) => r.status === s).length;
  return {
    total: rows.length,
    new: count("new"),
    conflict: count("conflict"),
    unchanged: count("unchanged"),
    duplicate: count("duplicate"),
    error: count("error"),
  };
}

/**
 * Apply a validated preview. Returns { official, log } and never mutates its inputs. Conflicts are applied
 * only when `replaceConflicts` is true. `log.changes` holds the prior result (or null) for each touched
 * student-year, which is exactly what undo restores.
 */
export function applyImport(
  official,
  preview,
  { replaceConflicts = false, importId, at, fileName = "import.csv" },
) {
  const next = structuredClone(official || {});
  const changes = new Map();
  const take = preview.rows.filter(
    (r) => r.status === "new" || (replaceConflicts && r.status === "conflict"),
  );
  for (const r of take) {
    const list = next[r.studentId] || [];
    const idx = list.findIndex((x) => x.year === r.year);
    const k = key(r.studentId, r.year);
    if (!changes.has(k))
      changes.set(k, {
        studentId: r.studentId,
        year: r.year,
        before: idx >= 0 ? structuredClone(list[idx]) : null,
      });
    const result =
      idx >= 0 ? structuredClone(list[idx]) : { year: r.year, levels: {}, overall: null };
    if (r.domain === "Overall") result.overall = r.level;
    else result.levels = { ...result.levels, [r.domain]: r.level };
    if (r.scale != null) result.scale = { ...(result.scale || {}), [r.domain]: r.scale };
    result.provenance = {
      ...(result.provenance || {}),
      [r.domain]: {
        kind: "csv-import",
        importId,
        file: fileName,
        line: r.line,
        at,
        replaced: r.status === "conflict",
      },
    };
    const out = idx >= 0 ? list.map((x, i) => (i === idx ? result : x)) : [...list, result];
    next[r.studentId] = out.sort((a, b) => a.year.localeCompare(b.year));
  }
  return {
    official: next,
    log: { id: importId, at, fileName, applied: take.length, changes: [...changes.values()] },
  };
}

/** Restore every student-year an import touched to its prior state. */
export function undoImport(official, log) {
  const next = structuredClone(official || {});
  for (const c of log.changes) {
    const list = (next[c.studentId] || []).filter((x) => x.year !== c.year);
    const restored = c.before
      ? [...list, c.before].sort((a, b) => a.year.localeCompare(b.year))
      : list;
    if (restored.length) next[c.studentId] = restored;
    else delete next[c.studentId];
  }
  return next;
}
