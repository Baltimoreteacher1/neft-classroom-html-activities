// Vocabulary Academy reader — reading ids and the library's pure list model. PURE.
//   passage    g4-u01-p1   the lesson's own passage (Exercise E)        "Reading 1" / "Lectura 1"
//   companion  g4-u01-r1   the second, original reading of a lesson     "Reading 2" / "Lectura 2"
// The id's "u01" is the lesson's file number (the same as `g4-u01` the lesson id), not the unit group.
import { SHIPPED_GRADES } from "../contract.js";

const ID_RE = /^g(K|\d{1,2})-u(\d{1,3})-([pr])(\d)$/;

export const lessonUnitId = (grade, n) => `g${grade}-u${String(n).padStart(2, "0")}`;
export const readingId = (grade, n, kind = "passage", num = 1) =>
  `${lessonUnitId(grade, n)}-${kind === "companion" ? "r" : "p"}${num}`;

/** → { id, grade, n, kind, num, unitId, label:[en,es] } or null. Only shipped grades parse. */
export function parseReadingId(id) {
  const m = ID_RE.exec(String(id ?? ""));
  if (!m || !SHIPPED_GRADES.includes(m[1])) return null;
  const n = Number(m[2]);
  if (!n) return null;
  const kind = m[3] === "r" ? "companion" : "passage";
  const num = Number(m[4]);
  return {
    id: String(id),
    grade: m[1],
    n,
    kind,
    num,
    unitId: lessonUnitId(m[1], n),
    label: readingLabel(kind),
  };
}
export const readingLabel = (kind) =>
  kind === "companion" ? ["Reading 2", "Lectura 2"] : ["Reading 1", "Lectura 1"];
/** Where a reading lives in the app, as route segments after /vocabulary-academy. */
export const readingSegments = (id) => ["read", id];

/** The same lesson's other reading, or null. */
export const siblingId = (id) => {
  const p = parseReadingId(id);
  return p ? readingId(p.grade, p.n, p.kind === "passage" ? "companion" : "passage", 1) : null;
};

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/**
 * Bring a lesson passage or a companion reading to ONE shape the reader plays.
 *   kind "passage":   raw = unit.passage
 *   kind "companion": raw = file.reading
 * Questions that cannot be played (fewer than two distinct choices, bad answer index) are dropped. A passage question has
 * no `para`: it is inferred from the question text or the text that best matches the reason and the right answer, so the
 * "show me where in the text" link can still point at a paragraph (it never points at the answer itself).
 */
export function normalizeReading(raw, { unit, kind = "passage" } = {}) {
  if (!isObj(raw) || !Array.isArray(raw.paras) || !raw.paras.length) return null;
  const paras = raw.paras.map((p) => String(p));
  const id = String(raw.id || "");
  const qs = [];
  for (const q of Array.isArray(raw.qs) ? raw.qs : []) {
    const choices = Array.isArray(q?.choices) ? q.choices.map(String) : [];
    if (
      !q?.q ||
      choices.length < 2 ||
      new Set(choices.map((c) => c.toLowerCase())).size !== choices.length
    )
      continue;
    if (!Number.isInteger(q.a) || q.a < 0 || q.a >= choices.length) continue;
    const ev =
      isObj(q.ev) && typeof q.ev.text === "string" && Number.isInteger(q.ev.para)
        ? { para: q.ev.para, text: q.ev.text }
        : null;
    const para = Number.isInteger(q.para) ? q.para : inferPara(paras, q);
    qs.push({
      id: String(q.id || `${id}-q${qs.length + 1}`),
      skill: String(q.skill || ""),
      para,
      q: String(q.q),
      choices,
      a: q.a,
      why: String(q.why || ""),
      ev,
    });
  }
  return {
    id,
    kind,
    unitId: unit?.id || String(raw.unit || ""),
    genre: String(raw.genre || ""),
    title: String(raw.title || ""),
    purpose: String(raw.purpose || ""),
    paras,
    words: Array.isArray(raw.words) ? raw.words.map(String) : [],
    listenOnly: raw.listenOnly === true,
    qs,
    clues: Array.isArray(raw.clues)
      ? raw.clues.filter((c) => isObj(c) && c.word && Number.isInteger(c.para) && c.text)
      : [],
    retellFrame: String(raw.retellFrame || ""),
  };
}

const wordsOfText = (t) =>
  String(t || "")
    .toLowerCase()
    .match(/[a-z]{4,}/g) || [];
/** Which paragraph (0-based) a question points at: "paragraph N" in the stem, else the best word overlap with the reason and right answer. */
export function inferPara(paras, q) {
  const m = /paragraph\s+(\d{1,2})/i.exec(String(q?.q || ""));
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= paras.length) return Number(m[1]) - 1;
  const probe = new Set(wordsOfText(`${q?.why || ""} ${q?.choices?.[q?.a] || ""}`));
  if (!probe.size) return 0;
  let best = 0;
  let top = -1;
  paras.forEach((p, i) => {
    const s = wordsOfText(p).filter((w) => probe.has(w)).length;
    if (s > top) {
      top = s;
      best = i;
    }
  });
  return best;
}

/** One library row per lesson: its passage and, when the file exists, its companion. Pure. */
export function lessonRows({ grade, units, passages = {}, companions = {} }) {
  const rows = [];
  for (const unit of units) {
    for (const r of unit.lessons) {
      if (!r.published) continue;
      const pass = passages[r.id];
      const comp = companions[r.id];
      const readings = [];
      if (pass)
        readings.push({
          id: readingId(grade, r.n, "passage"),
          kind: "passage",
          label: readingLabel("passage"),
          genre: pass.genre,
          title: pass.title,
          words: pass.words || [],
        });
      if (comp)
        readings.push({
          id: readingId(grade, r.n, "companion"),
          kind: "companion",
          label: readingLabel("companion"),
          genre: comp.genre,
          title: comp.title,
          words: comp.words || [],
        });
      rows.push({
        grade,
        u: unit.u,
        n: r.n,
        lessonId: r.id,
        lessonTitle: r.title,
        readings,
        hw: (r.words || []).map((w) => w.hw),
      });
    }
  }
  return rows;
}

/** Filter rows: grade is chosen before rows are built; here genre ("" = all), text search and a finished-only switch. */
export function filterRows(
  rows,
  { genre = "", query = "", done = {}, onlyUnfinished = false } = {},
) {
  const q = String(query).trim().toLowerCase();
  const out = [];
  for (const row of rows) {
    const readings = row.readings.filter((r) => {
      if (genre && r.genre !== genre) return false;
      if (onlyUnfinished && done[r.id]) return false;
      if (!q) return true;
      return [r.title, row.lessonTitle, r.genre, ...row.hw].some((t) =>
        String(t).toLowerCase().includes(q),
      );
    });
    if (readings.length) out.push({ ...row, readings });
  }
  return out;
}

/** Group rows into grade > unit > lessons for display: [{ grade, units:[{ u, rows:[…] }] }]. */
export function groupRows(rows) {
  const order = new Map(SHIPPED_GRADES.map((g, i) => [g, i]));
  const byGrade = new Map();
  for (const row of rows) {
    if (!byGrade.has(row.grade)) byGrade.set(row.grade, new Map());
    const units = byGrade.get(row.grade);
    if (!units.has(row.u)) units.set(row.u, []);
    units.get(row.u).push(row);
  }
  return [...byGrade.entries()]
    .sort((a, b) => order.get(a[0]) - order.get(b[0]))
    .map(([grade, units]) => ({
      grade,
      units: [...units.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([u, rs]) => ({ u, rows: rs.sort((a, b) => a.n - b.n) })),
    }));
}

export const genresOf = (rows) =>
  [...new Set(rows.flatMap((r) => r.readings.map((x) => x.genre)).filter(Boolean))].sort();
