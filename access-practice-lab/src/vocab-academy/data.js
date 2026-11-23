// Vocabulary Academy — content loader. Core-owned (SPEC §10).
//
// Every loader is async (content is fetched lazily, once, and cached in memory) EXCEPT the pure helpers
// wordsOfUnit / lessonHref / wordHref / gradeHref / vaHref. Every loader is tolerant of missing files: a grade or unit
// that has no published JSON yields null / [] (never a throw), so the UI can say "not published yet" truthfully.
import { BASE } from "../util.js";
import { CONTENT_BASE, GRADES, PLAN, SHIPPED_GRADES, VA_ROUTE, unitFile } from "./contract.js";
import { loadProgress } from "./store.js";

const EMPTY_INDEX = Object.freeze({
  schema: 1,
  totals: { grades: 0, units: 0, words: 0 },
  grades: {},
  words: {},
  missing: true,
});

let doFetch = (url) => fetch(url, { credentials: "same-origin" });
let indexPromise = null;
const gradeCache = new Map();
const unitCache = new Map();
const readingCache = new Map();

/** Test hook: swap the fetch implementation and clear every cache. */
export function configureData({ fetchImpl } = {}) {
  if (fetchImpl) doFetch = fetchImpl;
  resetDataCache();
}
export function resetDataCache() {
  indexPromise = null;
  gradeCache.clear();
  unitCache.clear();
  readingCache.clear();
}

async function fetchJson(url) {
  try {
    const res = await doFetch(url);
    if (!res || !res.ok) return null;
    const type = res.headers?.get?.("content-type") || "";
    // A static host that answers unknown paths with the app shell must not be parsed as content.
    if (type && !/json|javascript|text\/plain|octet-stream/i.test(type)) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const validIndex = (v) => isObject(v) && isObject(v.grades) && isObject(v.words ?? {});

/** The generated index (tools/build-vocab-academy-index.mjs). Never rejects: a missing index is `{ missing: true, grades: {} }`. */
export function getIndex() {
  indexPromise ||= fetchJson(`${CONTENT_BASE}/index.json`).then((json) => {
    if (validIndex(json))
      return { ...json, words: json.words || {}, totals: json.totals || EMPTY_INDEX.totals };
    // Allow a later retry (a flaky first load must not blank the page for the whole session).
    indexPromise = null;
    return EMPTY_INDEX;
  });
  return indexPromise;
}

const normGrade = (g) => {
  const s = String(g ?? "")
    .trim()
    .toUpperCase();
  return GRADES.includes(s) ? s : "";
};
export const isGrade = (g) => normGrade(g) !== "";
export { normGrade };

/** grade.json for grade G (scope + sequence), or null when it has not been published. */
export async function getGrade(g) {
  const grade = normGrade(g);
  if (!grade) return null;
  if (!gradeCache.has(grade)) {
    gradeCache.set(
      grade,
      fetchJson(`${CONTENT_BASE}/g${grade}/grade.json`).then((json) => {
        if (isObject(json) && Array.isArray(json.units ?? [])) return json;
        gradeCache.delete(grade);
        return null;
      }),
    );
  }
  return gradeCache.get(grade);
}

/** A teacher's custom unit id ("cu.reading-a1b2"); the unit itself lives in this device's progress record. */
export const isCustomId = (id) => /^cu\.[a-z0-9-]+$/.test(String(id ?? ""));

/** Parse "g6-u01" / "gK-u03" → { grade, n } or null; "cu.<slug>" → { custom: true, id }. */
export function parseUnitId(id) {
  if (isCustomId(id)) return { custom: true, id: String(id) };
  const m = /^g(K|\d{1,2})-u(\d{1,3})$/.exec(String(id ?? ""));
  return m && normGrade(m[1]) ? { grade: m[1], n: Number(m[2]) } : null;
}

/** A whole unit's id ("g5-unit2": every word of unit 2's lessons) → { grade, u } or null. */
export function parseGroupId(id) {
  const m = /^g(K|\d{1,2})-unit(\d{1,2})$/.exec(String(id ?? ""));
  return m && normGrade(m[1]) && Number(m[2]) > 0 ? { grade: m[1], u: Number(m[2]) } : null;
}
export const groupId = (grade, u) => `g${grade}-unit${Number(u)}`;

/**
 * One record holding every word of a unit's lessons, shaped like a lesson file so practice, games and the unit test
 * can use it unchanged: words, relation groups, shades and analogies are joined; the passage is the first lesson's.
 * Pure. `lessons` are loaded lesson files in lesson order.
 */
export function mergeLessons(grade, unit, lessons) {
  const words = lessons.flatMap((l) => l.words || []);
  const join = (key) => lessons.flatMap((l) => l.relations?.[key] || []);
  return {
    id: groupId(grade, unit.u),
    grade: String(grade),
    n: unit.u,
    group: true,
    title: `Unit ${unit.u}`,
    lessonIds: lessons.map((l) => l.id),
    words,
    relations: { groups: join("groups"), shades: join("shades"), analogies: join("analogies") },
    passage: lessons.find((l) => l.passage?.paras?.length)?.passage || null,
    review: [],
    study: { focus: "none", parts: lessons.flatMap((l) => l.study?.parts || []) },
  };
}

/** The merged record of a whole unit (see mergeLessons), or null. */
export async function getMergedUnit(grade, u) {
  const found = await getUnitGroup(grade, u);
  if (!found || !found.lessons.length) return null;
  return mergeLessons(found.overview.grade, found.unit, found.lessons);
}

/** The unit file for a unit id ("g6-u01"), fetched once and cached; null when it does not exist or is malformed. */
export async function getUnit(unitId) {
  const group = parseGroupId(unitId);
  if (group) return getMergedUnit(group.grade, group.u);
  const parsed = parseUnitId(unitId);
  if (!parsed) return null;
  if (parsed.custom) {
    const unit = loadProgress().custom?.[parsed.id];
    return unit?.custom === true && Array.isArray(unit.words) ? unit : null;
  }
  if (!unitCache.has(unitId)) {
    unitCache.set(
      unitId,
      fetchJson(unitFile(parsed.grade, parsed.n)).then((json) => {
        if (isObject(json) && Array.isArray(json.words) && json.id) return json;
        unitCache.delete(unitId);
        return null;
      }),
    );
  }
  return unitCache.get(unitId);
}

/**
 * A lesson's companion reading file (content/vocab-academy/g<G>/readings/u<NN>.json, spec docs/vocab-academy/readings-spec.md):
 * the parsed file, or null when it does not exist yet (most lessons until the content lands) or is malformed. Fetched once
 * and cached. A 404 is expected and silent.
 */
export function getReading(g, n) {
  const grade = normGrade(g);
  const num = Number(n);
  if (!grade || !Number.isInteger(num) || num < 1) return Promise.resolve(null);
  const key = `${grade}:${num}`;
  if (!readingCache.has(key))
    readingCache.set(
      key,
      fetchJson(`${CONTENT_BASE}/g${grade}/readings/u${String(num).padStart(2, "0")}.json`).then((json) =>
        isObject(json) && isObject(json.reading) && Array.isArray(json.reading.paras) && json.reading.paras.length ? json : null,
      ),
    );
  return readingCache.get(key);
}

/** Published unit summaries of a grade, from the index: [{ id, n, title, theme, strand, file, wordIds, words }]. */
export async function getUnitsOfGrade(g) {
  const grade = normGrade(g);
  if (!grade) return [];
  const index = await getIndex();
  const units = index.grades?.[grade]?.units;
  return Array.isArray(units) ? [...units].sort((a, b) => a.n - b.n) : [];
}

/**
 * What a grade page needs, tolerant of every missing file: the scope (grade.json) merged with what is published.
 *   { grade, scope, planned, units:[{ n, id, title, theme, strand, morphFocus, published, wordCount, words:[{hw,pos}], wordIds }],
 *     publishedCount, shipped, status }
 * `status`: "ready" (every planned unit is published) | "partial" | "writing" (scope exists, no unit file yet) |
 *           "planned" (nothing published, no scope file) | "later" (a grade outside this release, e.g. 9 to 12).
 * A unit is "published" only when the generated index lists its file, so a card never promises a lesson that is not there.
 */
export async function getGradeOverview(g) {
  const grade = normGrade(g);
  if (!grade) return null;
  const shipped = SHIPPED_GRADES.includes(grade);
  const [scope, published] = shipped ? await Promise.all([getGrade(grade), getUnitsOfGrade(grade)]) : [null, []];
  const byN = new Map(published.map((u) => [u.n, u]));
  const scoped = Array.isArray(scope?.units) ? scope.units : [];
  const rows = scoped.map((su) => {
    const pub = byN.get(su.n);
    return {
      n: su.n,
      id: su.id || `g${grade}-u${String(su.n).padStart(2, "0")}`,
      title: pub?.title || su.title,
      theme: pub?.theme || su.theme || "",
      strand: pub?.strand || su.strand || "thematic",
      morphFocus: su.morphFocus || "",
      why: su.why || "",
      published: Boolean(pub),
      wordCount: pub ? pub.wordIds.length : Array.isArray(su.words) ? su.words.length : 0,
      words: pub ? pub.words.map(({ hw, pos }) => ({ hw, pos })) : (su.words || []).map(({ hw, pos }) => ({ hw, pos })),
      wordIds: pub ? pub.wordIds : [],
    };
  });
  // A unit that is published but missing from the scope file still gets a row (the index is the source of truth for "published").
  for (const pub of published)
    if (!rows.some((r) => r.n === pub.n))
      rows.push({
        n: pub.n, id: pub.id, title: pub.title, theme: pub.theme || "", strand: pub.strand || "thematic", morphFocus: "", why: "",
        published: true, wordCount: pub.wordIds.length, words: pub.words.map(({ hw, pos }) => ({ hw, pos })), wordIds: pub.wordIds,
      });
  rows.sort((a, b) => a.n - b.n);
  const planned = scoped.length || PLAN[grade]?.units || 0;
  const publishedCount = published.length;
  const status = !shipped
    ? "later"
    : publishedCount === 0
      ? scope
        ? "writing"
        : "planned"
      : publishedCount >= planned
        ? "ready"
        : "partial";
  return { grade, scope, planned, units: rows, publishedCount, shipped, status };
}

/** One word and its unit: { word, unit } or null. Uses the index to find the unit, so only that unit file is fetched. */
export async function getWord(wordId) {
  const index = await getIndex();
  const where = index.words?.[wordId];
  if (!where?.unit) return null;
  const unit = await getUnit(where.unit);
  const word = unit?.words?.find((w) => w.id === wordId);
  return word ? { word, unit } : null;
}

/** Word records for many ids (unknown ids are skipped), loading each unit once. */
export async function getWords(ids = []) {
  const found = await Promise.all([...new Set(ids)].map((id) => getWord(id)));
  const byId = new Map(found.filter(Boolean).map(({ word }) => [word.id, word]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

/** The words of a loaded unit record (pure). */
export const wordsOfUnit = (unit) => (Array.isArray(unit?.words) ? unit.words : []);

// ── links (pure) ─────────────────────────────────────────────────────────────
/** `/access-practice-lab/vocabulary-academy/<segments…>`; empty segments are dropped, each is URI-encoded. */
export const vaHref = (...segments) =>
  [
    `${BASE}/${VA_ROUTE}`,
    ...segments.filter((s) => s !== "" && s != null).map((s) => encodeURIComponent(String(s))),
  ].join("/");
export const gradeHref = (g) => vaHref("grade", g);
/** A lesson's own URL segment: its number, or a custom list's "cu_<slug>" (dots travel as underscores). */
export const lessonSegment = (n) => (isCustomId(n) ? String(n).replace(".", "_") : Number(n));
/** A lesson page (ten words), or one of its sections (letter a–h: the word list, exercises A–F, the review). */
export const lessonHref = (g, n, letter = "") =>
  vaHref("grade", g, "lesson", lessonSegment(n), letter ? String(letter).toLowerCase() : "");
/** A unit page (a group of lessons), or one of its activities (crossword, test). */
export const unitHref = (g, u, activity = "") => vaHref("grade", g, "unit", Number(u), activity);

// ── units: groups of lessons (pure) ──────────────────────────────────────────
/**
 * How many lessons make one unit in a grade with `count` lessons: four when the lessons divide into fours
 * (12 → 3 units, 20 → 5 units), otherwise three (15 → 5 units, 18 → 6 units). Every unit is the same size.
 */
export const lessonsPerUnit = (count) => (count % 4 === 0 ? 4 : 3);
/** The unit (1-based) that lesson `n` belongs to. */
export const unitOfLesson = (n, count) => Math.ceil(Number(n) / lessonsPerUnit(count));
/** Group a grade's lesson rows (sorted by n) into units: [{ u, first, last, lessons:[row…] }]. */
export function groupLessons(rows) {
  const sorted = [...rows].sort((a, b) => a.n - b.n);
  const size = lessonsPerUnit(sorted.length);
  const units = [];
  for (const row of sorted) {
    const u = unitOfLesson(row.n, sorted.length);
    let unit = units.find((x) => x.u === u);
    if (!unit) units.push((unit = { u, lessons: [] }));
    unit.lessons.push(row);
  }
  for (const unit of units) {
    unit.first = (unit.u - 1) * size + 1;
    unit.last = unit.first + size - 1;
  }
  return units;
}

/** A grade's units with their lesson rows (from getGradeOverview): { overview, units } or null. */
export async function getGradeUnits(g) {
  const overview = await getGradeOverview(g);
  if (!overview) return null;
  return { overview, units: groupLessons(overview.units) };
}

/**
 * Every published lesson file of one unit, loaded: { overview, unit:{u, first, last, lessons}, lessons:[lesson JSON] }
 * or null when the unit does not exist. Lessons that fail to load are left out (the caller says so).
 */
export async function getUnitGroup(g, u) {
  const found = await getGradeUnits(g);
  const unit = found?.units.find((x) => x.u === Number(u));
  if (!unit) return null;
  const lessons = (
    await Promise.all(unit.lessons.filter((r) => r.published).map((r) => getUnit(r.id)))
  ).filter(Boolean);
  return { overview: found.overview, unit, lessons };
}
/**
 * A word's URL segment. Word ids contain dots ("va.cautious.adj"), and the lab's server and link handler treat a path
 * ending in ".<letters>" as a static file (full reload, 404), so the dots travel as underscores: /word/va_cautious_adj.
 * Ids never contain an underscore, so the mapping is exact in both directions.
 */
export const wordSegment = (id) => String(id ?? "").replaceAll(".", "_");
export const wordIdFromSegment = (seg) => String(seg ?? "").replaceAll("_", ".");
export const wordHref = (id) => vaHref("word", wordSegment(id));
