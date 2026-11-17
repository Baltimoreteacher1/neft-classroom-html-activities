// Import pipeline for the Data Studio wizard: table (CSV, pasted spreadsheet cells, XLSX rows) -> column
// mapping -> drafts -> validation against the stores -> apply on the teacher's confirmation -> undo. Wide
// tables (one row per student assessment, a column per score, as WIDA AMS exports are laid out) and long
// tables (student, year, domain, level, scale_score) are both accepted. A value that differs from a result
// already on file is a CONFLICT and is skipped unless the teacher chooses to replace it. Every import keeps
// the prior state of each touched result so it can be undone exactly.
import { placeRow, saveRow, validateDraft } from "./records.js";
import { ASSESSMENTS, SCORE_KEYS } from "./rules.js";
import { IMPORT_PREFIX } from "./store.js";

export const TEMPLATE = [
  "student,grade,assessment,year,date,listening_level,listening_scale,speaking_level,speaking_scale,reading_level,reading_scale,writing_level,writing_scale,oral_level,literacy_level,comprehension_level,overall_level,overall_scale",
  "Student A,6,ACCESS,2024-25,2025-02-10,3.4,331,2.8,312,3.1,325,2.6,309,3.1,2.9,3.2,3.0,322",
  "Student A,6,MODEL_ONLINE,2025-26,2025-10-02,3.6,,3.0,,3.3,,2.9,,,,,3.2,",
].join("\n");

/** RFC 4180-style CSV parser: quoted fields, doubled quotes, CRLF. Returns rows of strings. */
export function parseCSV(text, sep = ",") {
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
    else if (c === sep) (row.push(cell), (cell = ""));
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

/** Pasted spreadsheet cells are tab-separated; anything else is read as CSV. */
export const parseTable = (text) =>
  parseCSV(text, /\t/.test(String(text).split(/\r?\n/)[0] || "") ? "\t" : ",");

const KEY_RES = [
  ["Listening", /listen/],
  ["Speaking", /speak/],
  ["Reading", /read/],
  ["Writing", /writ/],
  ["Oral", /oral/],
  ["Literacy", /litera/],
  ["Comprehension", /compre/],
  ["Overall", /overall|composite/],
];
const norm = (x) =>
  String(x ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Field for one header, or null. Score fields are `${Key}:level|scale|sem`. */
export function fieldFor(header) {
  const h = norm(header);
  if (!h) return null;
  if (/^(student|student name|name|alias|full name)$/.test(h)) return "student";
  if (/^(first name|student first name|given name)$/.test(h)) return "firstName";
  if (/^(last name|student last name|surname|family name)$/.test(h)) return "lastName";
  if (/^(student id|state student id|district student id|local student id|wida id|ssid)$/.test(h)) return "studentId";
  if (/^(grade|grade level|tested grade)$/.test(h)) return "grade";
  if (/^(assessment|test|assessment type|test name)$/.test(h)) return "assessment";
  if (/^(year|school year|academic year|test year)$/.test(h)) return "year";
  if (/^(date|test date|administration date|date tested)$/.test(h)) return "date";
  if (/^(form|test form|tier)$/.test(h)) return "form";
  if (/^(cut scores|level version)$/.test(h)) return "levelVersion";
  if (/^domain$/.test(h)) return "domain";
  if (/^(level|proficiency level|pl)$/.test(h)) return "level";
  if (/^(scale|scale score|scalescore|ss)$/.test(h)) return "scale";
  if (/^(sem|standard error)$/.test(h)) return "sem";
  const key = KEY_RES.find(([, re]) => re.test(h))?.[0];
  if (!key) return null;
  if (/\b(sem|error|se)\b/.test(h)) return `${key}:sem`;
  if (/scale|\bss\b/.test(h)) return `${key}:scale`;
  return `${key}:level`;
}

/** Default mapping: column index -> field (or ""). The wizard lets the teacher change any of them. */
export const autoMap = (header) => header.map((x) => fieldFor(x) || "");
export const isLong = (mapping) =>
  mapping.includes("domain") && (mapping.includes("level") || mapping.includes("scale"));

const ASSESSMENT_WORDS = [
  ["KINDERGARTEN_MODEL", /k(indergarten)?\s*model/],
  ["KINDERGARTEN_ACCESS", /k(indergarten)?\s*access/],
  ["MODEL_PAPER", /model.*paper/],
  ["MODEL_ONLINE", /model/],
  ["ACCESS", /access/],
];
export const assessmentOf = (raw, fallback) => {
  const t = String(raw || "").trim();
  if (ASSESSMENTS[t.toUpperCase()]) return t.toUpperCase();
  const n = norm(t);
  return (n && ASSESSMENT_WORDS.find(([, re]) => re.test(n))?.[0]) || fallback;
};

/** Excel stores dates as day counts since 1899-12-30; turn one into YYYY-MM-DD. */
const excelDate = (v) =>
  /^\d{5}(\.\d+)?$/.test(v) ? new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(v)) * 864e5).toISOString().slice(0, 10) : v;

/** Drafts (raw strings) from a table and a mapping. `defaults` { assessment, year } fill blank columns. */
export function draftsFromTable(table, mapping, defaults = {}) {
  const body = table.slice(1);
  const cell = (r, f) => {
    const i = mapping.indexOf(f);
    return i < 0 ? "" : String(r[i] ?? "").trim();
  };
  // A name column wins; otherwise first + last name; otherwise the student ID.
  const studentName = (r) =>
    cell(r, "student") || [cell(r, "firstName"), cell(r, "lastName")].filter(Boolean).join(" ") || cell(r, "studentId");
  const base = (r, line) => ({
    line,
    student: studentName(r),
    assessment: assessmentOf(cell(r, "assessment"), defaults.assessment || "ACCESS"),
    year: cell(r, "year") || defaults.year || "",
    date: excelDate(cell(r, "date")),
    grade: cell(r, "grade"),
    form: cell(r, "form"),
    levelVersion: /2026/.test(cell(r, "levelVersion")) ? "2026-cuts" : defaults.levelVersion || "",
    scores: {},
  });
  if (!isLong(mapping))
    return body.map((r, i) => {
      const d = base(r, i + 2);
      for (const k of SCORE_KEYS)
        d.scores[k] = {
          level: cell(r, `${k}:level`),
          scale: cell(r, `${k}:scale`),
          sem: cell(r, `${k}:sem`),
        };
      return d;
    });
  const groups = new Map();
  body.forEach((r, i) => {
    const d = base(r, i + 2);
    const key = [d.student, d.assessment, d.year, d.date].join("\u0000");
    const g = groups.get(key) || groups.set(key, { ...d, lines: [] }).get(key);
    g.lines.push(i + 2);
    const rawDomain = norm(cell(r, "domain"));
    const k = KEY_RES.find(([, re]) => re.test(rawDomain))?.[0];
    if (!k) {
      g.unknownDomains = [...(g.unknownDomains || []), cell(r, "domain")];
      return;
    }
    g.scores[k] = { level: cell(r, "level"), scale: cell(r, "scale"), sem: cell(r, "sem") };
  });
  return [...groups.values()].map((g) => ({ ...g, line: g.lines[0] }));
}

function matcher(roster) {
  const byId = new Map(roster.map((s) => [s.id, s]));
  const byName = new Map();
  for (const s of roster) {
    const k = s.name.trim().toLowerCase();
    byName.set(k, byName.has(k) ? null : s);
  }
  return (raw) => byId.get(raw) || byName.get(raw.toLowerCase()) || null;
}

const same = (a, b) => {
  const strip = (r) =>
    JSON.stringify([
      r.assessment || "ACCESS",
      r.year,
      r.levels || {},
      r.overall ?? null,
      r.composites || {},
      r.scale || {},
    ]);
  return strip(a) === strip(b);
};

/**
 * Validate drafts against the stores. `roster` [{ id, name }]. Returns { rows, summary }; each row has
 * { line, student, studentId, onRoster, status: new|conflict|unchanged|duplicate|error, errors, warnings, row }.
 */
export function validateDrafts(
  drafts,
  { roster = [], stores = { official: {}, interim: {} }, today = new Date() } = {},
) {
  const match = matcher(roster);
  const seen = new Map();
  const rows = drafts.map((d) => {
    const v = validateDraft(d, { today });
    const errors = [...v.errors];
    const warnings = [...v.warnings];
    if (!d.student) errors.push("Student is missing.");
    if (d.unknownDomains?.length) errors.push(`Unknown domain: ${d.unknownDomains.join(", ")}.`);
    const onRoster = d.student ? match(d.student) : null;
    const studentId = onRoster ? onRoster.id : d.student ? `${IMPORT_PREFIX}${d.student}` : null;
    if (d.student && !onRoster)
      warnings.push("Not on the Teacher Hub roster: kept as imported history under this name.");
    let status = errors.length ? "error" : "new";
    let clash = null;
    if (status === "new") {
      const k = [studentId, v.row.assessment, v.row.year, v.row.date].join("|");
      if (seen.has(k)) {
        status = "duplicate";
        errors.push(`Duplicate of line ${seen.get(k)} (same student, assessment, year and date).`);
      } else seen.set(k, d.line);
    }
    if (status === "new") {
      clash = placeRow(stores, studentId, v.row).clash;
      if (clash) status = same(clash, v.row) ? "unchanged" : "conflict";
      if (status === "conflict")
        warnings.push(
          "A different result is already on file for this assessment and year. It is kept unless you choose to replace it.",
        );
    }
    return {
      line: d.line,
      student: d.student,
      studentId,
      onRoster: Boolean(onRoster),
      status,
      errors,
      warnings,
      row: v.row,
      draft: d,
    };
  });
  const count = (s) => rows.filter((r) => r.status === s).length;
  return {
    rows,
    summary: {
      total: rows.length,
      new: count("new"),
      conflict: count("conflict"),
      unchanged: count("unchanged"),
      duplicate: count("duplicate"),
      error: count("error"),
    },
  };
}

/**
 * Apply a validated preview. Returns { stores, log } and never mutates its inputs. `log.changes` keeps each
 * touched student's prior lists, which is exactly what undo restores.
 */
export function applyImport(
  stores,
  preview,
  { replaceConflicts = false, importId, at, fileName = "import", sourceType = "csv" },
) {
  let next = stores;
  const changes = new Map();
  let applied = 0;
  for (const r of preview.rows) {
    if (!(r.status === "new" || (replaceConflicts && r.status === "conflict"))) continue;
    if (!changes.has(r.studentId))
      changes.set(r.studentId, {
        studentId: r.studentId,
        official: structuredClone(stores.official[r.studentId] ?? null),
        interim: structuredClone(stores.interim[r.studentId] ?? null),
      });
    const row = {
      ...r.row,
      source: sourceType,
      provenance: {
        record: {
          kind: `${sourceType}-import`,
          importId,
          file: fileName,
          line: r.line,
          at,
          replaced: r.status === "conflict",
        },
      },
    };
    const res = saveRow(next, r.studentId, row, { replace: r.status === "conflict", at });
    if (res.saved) ((next = res.stores), applied++);
  }
  return {
    stores: next,
    log: { id: importId, at, fileName, applied, changes: [...changes.values()] },
  };
}

/** Restore every student an import touched to the state before it. */
export function undoImport(stores, log) {
  const next = { official: { ...stores.official }, interim: { ...stores.interim } };
  for (const c of log.changes)
    for (const k of ["official", "interim"]) {
      if (c[k] == null) delete next[k][c.studentId];
      else next[k][c.studentId] = c[k];
    }
  return next;
}

/** CSV of the given ScoreRecords (export). Values only; quoted per RFC 4180. */
export function recordsToCSV(rows) {
  const q = (v) =>
    v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
  const head = [
    "student",
    "assessment",
    "year",
    "date",
    "grade",
    "level_version",
    ...SCORE_KEYS.flatMap((k) => [
      `${k.toLowerCase()}_level`,
      `${k.toLowerCase()}_scale`,
      `${k.toLowerCase()}_status`,
    ]),
    "source",
    "verified",
  ];
  const lines = rows.map(({ name, record: r }) =>
    [
      name,
      r.assessmentType,
      r.academicYear,
      r.administrationDate,
      r.grade ?? "",
      r.levelVersion,
      ...SCORE_KEYS.flatMap((k) => {
        const s = r.domains[k] || r.composites[k];
        return [s.level, s.scale, s.status];
      }),
      r.sourceType,
      r.sourceVerified ? "yes" : "no",
    ]
      .map(q)
      .join(","),
  );
  return [head.join(","), ...lines].join("\n");
}
