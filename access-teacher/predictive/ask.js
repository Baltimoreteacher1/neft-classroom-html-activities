// "Ask the data": a small, deterministic question parser and evaluator over the studio's own records. No AI
// service and no network: a plain-English (or Spanish domain word) question becomes a list of conditions, and
// each condition is answered with the existing scoring path (recordsOf, comparableSteps, domainProfile). Change
// counts only when it is larger than the reported measurement error; anything that cannot be compared is
// reported as "no comparable result", never guessed.
import { comparableSteps, domainProfile, levelName } from "./interpret.js";
import { recordsOf } from "./records.js";
import { ASSESSMENTS, COMPOSITES, DOMAINS } from "./rules.js";

export const ASK_KEYS = Object.freeze([...DOMAINS, ...COMPOSITES]);
export const DEFAULT_TOP = 5;

const WORDS = [
  ["Listening", /\b(listening|listen|listens|escuchar|escucha|escuchando)\b/],
  ["Speaking", /\b(speaking|speak|speaks|hablar|habla|hablando)\b/],
  ["Reading", /\b(reading|read|reads|leer|lee|lectura|leyendo)\b/],
  ["Writing", /\b(writing|write|writes|escribir|escribe|escritura|escribiendo)\b/],
  ["Overall", /\b(overall|composite|total|general)\b/],
  ["Oral", /\boral\b/],
  ["Literacy", /\bliteracy\b/],
  ["Comprehension", /\bcomprehension\b/],
];
/** The first score key named in the text (by position), or null. */
export function findKey(text) {
  let best = null;
  for (const [key, re] of WORDS) {
    const m = re.exec(text);
    if (m && (!best || m.index < best.index)) best = { key, index: m.index };
  }
  return best?.key || null;
}

const NUM = "(\\d+(?:\\.\\d+)?)";
// Comparator patterns, most specific first. `pre` patterns put the number after the words, `post` before.
const OPS = [
  ["gte", new RegExp(`(?:\\b(?:at least|no less than|al menos)|>=|≥)\\s*${NUM}`)],
  ["lte", new RegExp(`(?:\\b(?:at most|no more than)|<=|≤)\\s*${NUM}`)],
  [
    "gte",
    new RegExp(`${NUM}\\s*(?:or (?:higher|above|more|better|over)|and (?:up|above|higher)|\\+)`),
  ],
  ["lte", new RegExp(`${NUM}\\s*(?:or (?:lower|below|less|under)|and (?:below|under|lower))`)],
  [
    "lt",
    new RegExp(`(?:\\b(?:below|under|less than|lower than|menos de|por debajo de)|<)\\s*${NUM}`),
  ],
  [
    "gt",
    new RegExp(
      `(?:\\b(?:above|over|more than|greater than|higher than|mas de|por encima de)|>)\\s*${NUM}`,
    ),
  ],
];
const OP_WORDS = { lt: "below", lte: "at or below", gt: "above", gte: "at or above" };
const OP_ASK = { lt: "below", lte: "at most", gt: "above", gte: "at least" };
const test = (op, a, b) =>
  op === "lt" ? a < b : op === "lte" ? a <= b : op === "gt" ? a > b : a >= b;

const FILLER =
  /\b(show|me|list|find|which|who|whose|what|students?|kids|learners|are|is|was|were|have|has|had|the|a|an|in|on|at|of|for|with|their|my|class|level|levels|score|scores|result|results|please|all|everyone|estudiantes|alumnos|en|de|los|las|que|son|how|many|cuántos|cuantos|count|number)\b/g;
const isFiller = (text) => !text.replace(FILLER, " ").replace(/[^a-z0-9áéíóúñ]+/g, "").length;

const norm = (q) =>
  String(q || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?!,;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** One clause -> conditions it names (possibly several) plus an optional sort. */
function parseClause(raw) {
  let c = ` ${raw} `;
  const conds = [];
  let sort = null;
  const take = (m) => {
    c = c.replace(m[0], " ");
  };
  let m = c.match(
    /\b(?:grade|grado)\s*(k|\d{1,2})\b|\b(\d{1,2})(?:st|nd|rd|th)\s+grade(?:rs)?\b|\b(kindergarten)\b/,
  );
  if (m) {
    const g = (m[1] || m[2] || m[3]).toLowerCase();
    conds.push({ type: "grade", grade: g === "k" || g === "kindergarten" ? "K" : Number(g) });
    take(m);
  }
  if (
    (m = c.match(/\b(?:not|un)[\s-]?verified\b|\bneeds? (?:to be )?verif\w*|\bsin verificar\b/))
  ) {
    conds.push({ type: "unverified" });
    take(m);
  }
  if (
    (m = c.match(
      /\b(?:no|without|missing|not tested|sin)\b[\w\s]*?\b(?:this|current|este)\s+(?:school\s+)?(?:year|ano)\b/,
    ))
  ) {
    conds.push({ type: "noResultYear" });
    take(m);
  }
  const key = findKey(c);
  if (
    (m = c.match(
      /\b(?:biggest|most|largest|greatest|mayor)\b[\w\s]*?\b(?:growth|gains?|improvement|crecimiento)\b|\b(?:grew|improved|gained) the most\b/,
    ))
  ) {
    const n = c.match(/\b(\d{1,2})\b/);
    sort = { by: "growth", key: key || "Overall", dir: "desc", n: n ? Number(n[1]) : DEFAULT_TOP };
    return { conds, sort, rest: "" };
  }
  m = c.match(
    /\b(lowest|bottom|weakest|top|highest|strongest|best)\s+(\d{1,2})\b|\b(\d{1,2})\s+(lowest|highest|weakest|strongest)\b/,
  );
  if (m) {
    const word = m[1] || m[4];
    sort = {
      by: "level",
      key: key || "Overall",
      dir: /lowest|bottom|weakest/.test(word) ? "asc" : "desc",
      n: Number(m[2] || m[3]),
    };
    return { conds, sort, rest: "" };
  }
  const dom = key && DOMAINS.includes(key) ? key : null;
  const prof =
    c.match(/\bis (?:their |the )?(lowest|weakest|strongest|highest|best)\b/) ||
    c.match(
      /\b(lowest|weakest|strongest|highest|best)\b(?:\s+(?:domain|area|skill))?\s*(?:is|in|at|=)?\s/,
    );
  if (prof && dom && !/\d/.test(c)) {
    conds.push({
      type: "profile",
      key: dom,
      which: /lowest|weakest/.test(prof[1]) ? "need" : "strength",
    });
    return { conds, sort, rest: "" };
  }
  if (
    /\b(grew|grow|growth|improved|improve|gained|went up|increased|rose|crecio|mejoro)\b/.test(c)
  ) {
    conds.push({ type: "growth", key: key || "Overall", dir: "up" });
    return { conds, sort, rest: "" };
  }
  if (/\b(dropped|drop|declined|decline|fell|fall|went down|decreased|slipped|bajo)\b/.test(c)) {
    conds.push({ type: "growth", key: key || "Overall", dir: "down" });
    return { conds, sort, rest: "" };
  }
  for (const [op, re] of OPS) {
    const t = c.match(re);
    if (!t) continue;
    const value = Number(t[1]);
    if (!(value >= 1 && value <= 6)) break;
    conds.push({ type: "threshold", key: key || "Overall", op, value, assumed: !key });
    return { conds, sort, rest: "" };
  }
  if (key && /\b(missing|without|no|sin|not assessed|lacks?)\b/.test(c)) {
    conds.push({ type: "missing", key });
    return { conds, sort, rest: "" };
  }
  return { conds, sort, rest: c.trim(), key };
}

/** Loose hints for the fallback builder: whatever domain, comparison, value and grade the words mention. */
function hintsFrom(text) {
  const g = text.match(/\b(?:grade|grado)\s*(k|\d{1,2})\b/);
  const n = text.match(/\b(\d(?:\.\d)?)\b(?!\s*(?:st|nd|rd|th))/);
  const op = /\b(above|over|more|higher|at least|or higher|greater)\b/.test(text) ? "gte" : "lt";
  return {
    key: findKey(text) || "Writing",
    op,
    value: n && Number(n[1]) >= 1 && Number(n[1]) <= 6 ? Number(n[1]) : 3,
    grade: g ? (g[1] === "k" ? "K" : Number(g[1])) : "",
  };
}

/**
 * Parse a question into { conds, sort, count, all, unknown, understood, hints }. Clauses are joined with "and"
 * (or "y"); a clause that is only a domain word repeats the previous condition for that domain.
 */
export function parseQuestion(question) {
  const q = norm(question);
  const count = /\b(how many|count|number of|cuantos|cuantas)\b/.test(q);
  const conds = [];
  const unknown = [];
  let sort = null;
  const joined = q
    .replace(/\band (?:up|above|higher|over)\b(?!\s*\d)/g, "or higher")
    .replace(/\band (?:below|under|lower)\b(?!\s*\d)/g, "or lower");
  for (const part of joined.split(/\s+(?:and|y|but|plus)\s+/)) {
    const r = parseClause(part);
    conds.push(...r.conds);
    if (r.sort) sort = r.sort;
    if (!r.rest || isFiller(r.rest)) continue;
    const prev = conds.at(-1);
    if (
      r.key &&
      !r.conds.length &&
      prev &&
      "key" in prev &&
      isFiller(r.rest.replace(WORDS.find(([k]) => k === r.key)[1], " "))
    ) {
      conds.push({ ...prev, key: r.key, assumed: false });
      continue;
    }
    if (!r.conds.length) unknown.push(part);
  }
  const all = /\b(all|every|everyone|todos)\b/.test(q) || (count && !unknown.length);
  const understood = Boolean(q) && !unknown.length && (conds.length > 0 || sort != null || all);
  return { conds, sort, count, all, unknown, understood, hints: hintsFrom(q) };
}

/** Canonical question for a parsed query (built from the conditions only, so it never carries a name). */
export function toQuestion(query) {
  const at = (key) => (DOMAINS.includes(key) ? `in ${key.toLowerCase()}` : key.toLowerCase());
  const parts = query.conds.map((c) => {
    if (c.type === "grade") return `grade ${c.grade === "K" ? "k" : c.grade}`;
    if (c.type === "threshold") return `${OP_ASK[c.op]} ${c.value.toFixed(1)} ${at(c.key)}`;
    if (c.type === "growth") return `${c.dir === "up" ? "grew" : "dropped"} ${at(c.key)}`;
    if (c.type === "missing") return `missing ${c.key.toLowerCase()}`;
    if (c.type === "noResultYear") return "no result this year";
    if (c.type === "unverified") return "not verified";
    return c.which === "need" ? `${c.key.toLowerCase()} is their lowest` : `strongest ${at(c.key)}`;
  });
  const s = query.sort;
  if (s)
    parts.push(
      s.by === "growth"
        ? `${s.n === DEFAULT_TOP ? "" : `${s.n} `}biggest growth ${at(s.key)}`
        : `${s.dir === "asc" ? "lowest" : "top"} ${s.n} ${at(s.key)}`,
    );
  const body = parts.join(" and ") || "all students";
  return query.count ? `how many ${body}` : body;
}

/** School year containing a date, e.g. 2024-05-15 -> "2023-24" (years start 1 July). */
export function schoolYearOf(date) {
  const y = date.getUTCMonth() >= 6 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

const scoreOf = (rec, key) => (DOMAINS.includes(key) ? rec.domains[key] : rec.composites[key]);
const lv = (x) => `${x.toFixed(1)} ${levelName(x)}`;
const label = (rec) =>
  `${ASSESSMENTS[rec.assessmentType]?.short || rec.assessmentType} ${rec.academicYear}`;

/** Everything one student's answer needs, computed once. */
export function studentContext(student) {
  const recs = recordsOf(student);
  const annual = recs.filter((r) => ASSESSMENTS[r.assessmentType]?.kind === "annual");
  const record = annual.at(-1) || recs.at(-1) || null;
  return {
    student,
    recs,
    record,
    step: comparableSteps(student).at(-1) || null,
    grade: record?.grade ?? null,
  };
}

/** { state: pass|fail|na, cell, reason, sortValue } for one condition and one student. */
function check(cond, ctx, year) {
  const { record: rec, step } = ctx;
  const na = (reason) => ({ state: "na", reason, cell: "—" });
  if (cond.type === "grade")
    return String(ctx.grade) === String(cond.grade)
      ? { state: "pass", cell: `Grade ${ctx.grade}`, reason: "" }
      : ctx.grade == null
        ? na("no grade on file")
        : { state: "fail" };
  if (cond.type === "unverified") {
    const bad = ctx.recs.filter((r) => !r.sourceVerified);
    return bad.length
      ? {
          state: "pass",
          cell: "Not verified",
          reason: `${bad.map(label).join(", ")} not yet checked against the score report`,
        }
      : { state: "fail" };
  }
  if (cond.type === "noResultYear")
    return ctx.recs.some((r) => r.academicYear === year)
      ? { state: "fail" }
      : {
          state: "pass",
          cell: rec ? `Latest: ${label(rec)}` : "No results",
          reason: `no result in ${year}`,
        };
  if (cond.type === "missing") {
    if (!rec) return { state: "pass", cell: "No results", reason: "no result on file" };
    const s = scoreOf(rec, cond.key);
    if (s.level != null || s.scale != null) return { state: "fail" };
    const why = s.status === "not-assessed" ? "not assessed" : "missing";
    return {
      state: "pass",
      cell: why === "missing" ? "Missing" : "Not assessed",
      reason: `${cond.key} ${why} on ${label(rec)}`,
    };
  }
  if (!rec) return na("no result on file");
  if (cond.type === "threshold") {
    const s = scoreOf(rec, cond.key);
    if (s.level == null) return na(`no ${cond.key} level on ${label(rec)}`);
    const level = Math.round(s.level * 10) / 10;
    return test(cond.op, level, cond.value)
      ? {
          state: "pass",
          cell: lv(level),
          sortValue: level,
          reason: cond.sortOnly
            ? `latest ${cond.key} ${level.toFixed(1)}`
            : `${cond.key} ${level.toFixed(1)} is ${OP_WORDS[cond.op]} ${cond.value.toFixed(1)}`,
        }
      : { state: "fail" };
  }
  if (cond.type === "growth") {
    const row = step?.rows.find((r) => r.key === cond.key);
    if (!row || row.beyondError == null)
      return {
        ...na("no comparable result"),
        cell: "No comparable result",
        why: step?.why || null,
      };
    const span = `${label(step.from)} to ${label(step.to)}`;
    const signed = `${row.scaleChange > 0 ? "+" : ""}${row.scaleChange}`;
    const real = row.beyondError && (cond.dir === "up" ? row.scaleChange > 0 : row.scaleChange < 0);
    return real
      ? {
          state: "pass",
          cell: `${signed} scale points`,
          sortValue: row.scaleChange,
          reason: `${cond.key} ${signed} scale points, ${span}; larger than the measurement error (±${Math.round(1.96 * row.se)})`,
        }
      : { state: "fail" };
  }
  // profile
  const levels = DOMAINS.filter((d) => rec.domains[d].level != null).map((d) => [
    d,
    rec.domains[d].level,
  ]);
  if (levels.length < 2) return na("fewer than two domain levels on file");
  const vals = levels.map(([, v]) => v);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const mine = rec.domains[cond.key].level;
  if (mine == null) return na(`no ${cond.key} level on ${label(rec)}`);
  if (lo === hi || mine !== (cond.which === "need" ? lo : hi)) return { state: "fail" };
  const other = levels.find(([, v]) => v === (cond.which === "need" ? hi : lo));
  const gap = Math.round((hi - lo) * 10) / 10;
  const p = domainProfile(rec);
  const caution =
    p.basis === "scale"
      ? p.clear
        ? ""
        : "; the gap is within measurement error"
      : gap < 1
        ? "; a gap under 1 level may be measurement error"
        : "";
  return {
    state: "pass",
    cell: lv(mine),
    reason: `${cond.key} ${mine.toFixed(1)} is their ${cond.which === "need" ? "lowest" : "strongest"} domain (${gap.toFixed(1)} levels from ${other[0]} ${other[1].toFixed(1)})${caution}`,
  };
}

const COLUMN = {
  grade: () => "Grade",
  unverified: () => "Verification",
  noResultYear: () => "Results",
  missing: (c) => `${c.key} score`,
  threshold: (c) => `${c.key} (latest level)`,
  growth: (c) => `${c.key} change`,
  profile: (c) => `${c.key} (latest level)`,
};

/** Plain-words description of the query, without the count. */
export function describe(query, { year } = {}) {
  const grade = query.conds.find((c) => c.type === "grade");
  const phrase = (c) => {
    if (c.type === "threshold")
      return `whose latest ${c.key} level is ${OP_WORDS[c.op]} ${c.value.toFixed(1)}${c.assumed ? " (Overall assumed)" : ""}`;
    if (c.type === "growth")
      return `whose ${c.key} ${c.dir === "up" ? "grew" : "dropped"} by more than measurement error since their previous comparable result`;
    if (c.type === "missing") return `with no ${c.key} score on their latest result`;
    if (c.type === "noResultYear") return `with no result in ${year || "this school year"}`;
    if (c.type === "unverified") return "with a result not yet marked verified";
    if (c.type === "profile")
      return `whose ${c.which === "need" ? "lowest" : "strongest"} domain is ${c.key}`;
    return "";
  };
  const filters = query.conds.filter((c) => c.type !== "grade").map(phrase);
  const who = grade
    ? `${grade.grade === "K" ? "Kindergarten" : `Grade ${grade.grade}`} students`
    : "Students";
  const base = filters.length ? `${who} ${filters.join(" and ")}` : grade ? who : "All students";
  const s = query.sort;
  if (!s) return base;
  const top =
    s.by === "growth"
      ? `The ${s.n} with the biggest real ${s.key} growth`
      : `The ${s.n} with the ${s.dir === "asc" ? "lowest" : "highest"} latest ${s.key} level`;
  return grade || filters.length ? `${top}, among ${base[0].toLowerCase()}${base.slice(1)}` : top;
}

/**
 * Answer a parsed query over the class. Returns { text, columns, rows: [{ student, cells, reason }], excluded:
 * [{ student, reason }], n }. Students a condition cannot be judged for are listed in `excluded`, never guessed.
 */
export function answerQuery(query, students, { today = new Date() } = {}) {
  const year = schoolYearOf(today);
  const conds = [...query.conds];
  const s = query.sort;
  if (s?.by === "growth" && !conds.some((c) => c.type === "growth" && c.key === s.key))
    conds.push({ type: "growth", key: s.key, dir: "up" });
  if (s?.by === "level" && !conds.some((c) => c.type === "threshold" && c.key === s.key))
    conds.push({ type: "threshold", key: s.key, op: "gte", value: 0, sortOnly: true });
  const columns = [];
  for (const c of conds) {
    const col = COLUMN[c.type](c);
    if (!columns.includes(col)) columns.push(col);
  }
  const rows = [];
  const excluded = [];
  for (const st of students) {
    const ctx = studentContext(st);
    const results = conds.map((c) => ({ c, r: check(c, ctx, year) }));
    if (results.some(({ r }) => r.state === "fail")) continue;
    const na = results.find(({ r }) => r.state === "na");
    if (na) {
      excluded.push({
        student: st,
        reason: `${na.c.key ? `${na.c.key}: ` : ""}${na.r.reason}`,
        why: na.r.why || null,
      });
      continue;
    }
    const cells = Object.fromEntries(columns.map((col) => [col, "—"]));
    for (const { c, r } of results) cells[COLUMN[c.type](c)] = r.cell;
    const sortCond =
      s &&
      results.find(
        ({ c }) =>
          (s.by === "growth" ? c.type === "growth" : c.type === "threshold") && c.key === s.key,
      );
    rows.push({
      student: st,
      record: ctx.record,
      cells,
      reason:
        results
          .map(({ r }) => r.reason)
          .filter(Boolean)
          .join("; ") ||
        (ctx.record ? `Latest result: ${label(ctx.record)}` : "No results on file"),
      sortValue: sortCond?.r.sortValue ?? null,
    });
  }
  let out = rows;
  if (s) {
    const dir = s.dir === "asc" ? 1 : -1;
    out = [...rows]
      .sort(
        (a, b) => dir * (a.sortValue - b.sortValue) || a.student.name.localeCompare(b.student.name),
      )
      .slice(0, s.n);
  }
  return { text: describe(query, { year }), columns, rows: out, excluded, n: out.length, year };
}

/** Build a structured query from the fallback builder's chips. */
export function queryFromChips({ key, op, value, grade }) {
  const conds = [];
  if (grade !== "" && grade != null)
    conds.push({ type: "grade", grade: grade === "K" ? "K" : Number(grade) });
  if (key && OP_WORDS[op] && Number.isFinite(Number(value)))
    conds.push({
      type: "threshold",
      key,
      op,
      value: Math.min(6, Math.max(1, Number(value))),
      assumed: false,
    });
  return {
    conds,
    sort: null,
    count: false,
    all: !conds.length,
    unknown: [],
    understood: true,
    hints: { key, op, value, grade },
  };
}

export const EXAMPLES = Object.freeze([
  "below 3 in writing",
  "grade 6 and below 3 in writing",
  "how many at least 4.5 overall",
  "grew in reading",
  "biggest growth in speaking",
  "writing is their lowest",
  "lowest 5 in writing",
  "missing speaking",
]);
export { OP_ASK, OP_WORDS };

/** RFC 4180 CSV of a header + rows matrix; a cell starting with = + - @ is prefixed with ' so a spreadsheet
 * never runs it as a formula. */
export function tableToCSV(matrix) {
  const cell = (v) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return matrix.map((r) => r.map(cell).join(",")).join("\r\n");
}

/** Grades present in the class (latest result), K first. */
export function gradesIn(students) {
  const gs = new Set(students.map((s) => studentContext(s).grade).filter((g) => g != null));
  return [...gs].sort((a, b) => (a === "K" ? -1 : b === "K" ? 1 : a - b));
}
