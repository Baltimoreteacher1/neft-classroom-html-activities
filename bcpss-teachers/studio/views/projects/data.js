// Project view data: turns project modules into the descriptors the browse and detail views share.
// Pure helpers first (testable in Node), then one loader that talks to the catalog.
import { BANDS, SUBJECT_PROFILE, TIER_IDS } from "../../data/taxonomy.js";

export const FRAMING =
  "Projects are original, standards-aligned plans for several class sessions. Each one has a driving question, checkpoints, a rubric and language supports at four levels. They are not tied to a district unit unless a card says so.";

export const BAND_LABEL = Object.fromEntries(BANDS.map((b) => [b.id, `Grades ${b.label}`]));

/** Session-count buckets for the duration filter. */
export const DURATIONS = [
  { id: "short", label: "Up to 5 sessions", test: (n) => n <= 5 },
  { id: "medium", label: "6 to 8 sessions", test: (n) => n >= 6 && n <= 8 },
  { id: "long", label: "9 or more sessions", test: (n) => n >= 9 },
];
export const DURATION_IDS = DURATIONS.map((d) => d.id);

export const subjectName = (id) => SUBJECT_PROFILE[id]?.short || id;

const list = (v) =>
  Array.isArray(v)
    ? v.filter((x) => typeof x === "string" && x)
    : typeof v === "string" && v
      ? [v]
      : [];

export function sessionsOf(p) {
  if (Number.isFinite(p.sessions) && p.sessions > 0) return p.sessions;
  if (Number.isFinite(p.duration) && Number.isFinite(p.sessionMinutes) && p.sessionMinutes > 0)
    return Math.max(1, Math.round(p.duration / p.sessionMinutes));
  return null;
}

export const durationOf = (sessions) =>
  sessions == null ? "" : DURATIONS.find((d) => d.test(sessions))?.id || "";

/** One loaded project module as a browse descriptor. Returns null for anything that is not a usable project. */
export function describe(p) {
  if (!p || p.kind !== "project" || !p.id || !p.title) return null;
  const subjects = [...new Set([...list(p.subject), ...list(p.subjects)])];
  const sessions = sessionsOf(p);
  const fp = p.finalProduct || {};
  return {
    id: p.id,
    kind: "project",
    title: p.title,
    subtitle: p.subtitle || "",
    drivingQuestion: p.drivingQuestion || "",
    finalProduct: fp.title || "",
    finalDescription: fp.description || "",
    grade: p.grade != null ? String(p.grade) : "",
    band: p.band || "",
    subject: subjects[0] || "",
    subjects,
    sessions,
    sessionMinutes: p.sessionMinutes || null,
    duration: durationOf(sessions),
    standards: list(p.standards),
    curriculum: p.curriculum?.status || "standards-aligned",
    klus: list(p.wida?.klus),
  };
}

export function readFilters(params = {}) {
  const pick = (v, ok) => (typeof v === "string" && ok.includes(v) ? v : "");
  return {
    band: pick(
      params.band,
      BANDS.map((b) => b.id),
    ),
    subject: typeof params.subject === "string" ? params.subject.slice(0, 40) : "",
    duration: pick(params.duration, DURATION_IDS),
    q: typeof params.q === "string" ? params.q.slice(0, 80) : "",
  };
}

const norm = (s) => String(s || "").toLowerCase();

export function filterProjects(items, f) {
  const q = norm(f.q).trim();
  return items.filter((c) => {
    if (f.band && c.band !== f.band) return false;
    if (f.subject && !c.subjects.includes(f.subject)) return false;
    if (f.duration && c.duration !== f.duration) return false;
    if (
      q &&
      ![c.title, c.subtitle, c.drivingQuestion, c.finalProduct, ...c.subjects, ...c.standards].some(
        (v) => norm(v).includes(q),
      )
    )
      return false;
    return true;
  });
}

/** Counts for each facet value given the OTHER active filters, so a pill shows what picking it would leave. */
export function facetCounts(items, f) {
  const count = (key, ids, test) =>
    Object.fromEntries(
      ids.map((id) => [
        id,
        filterProjects(items, { ...f, [key]: id }).filter((c) => test(c, id)).length,
      ]),
    );
  return {
    bands: count(
      "band",
      BANDS.map((b) => b.id),
      (c, id) => c.band === id,
    ),
    durations: count("duration", DURATION_IDS, (c, id) => c.duration === id),
  };
}

const GRADE_RANK = { K: 0 };
const rank = (g) => (g in GRADE_RANK ? GRADE_RANK[g] : Number(g));

/** Stable order: grade, then title. */
export const sortProjects = (items) =>
  [...items].sort((a, b) => rank(a.grade) - rank(b.grade) || a.title.localeCompare(b.title));

/** Subject ids present across the loaded projects, sorted by display name. */
export const subjectsIn = (items) =>
  [...new Set(items.flatMap((c) => c.subjects))].sort((a, b) =>
    subjectName(a).localeCompare(subjectName(b)),
  );

export const readTier = (value) => (TIER_IDS.includes(value) ? value : "dev");

/** Turn a kebab-case id into words for display ("actual-length" -> "actual length"). */
export const words = (id) => String(id || "").replace(/[-_]+/g, " ");

/**
 * Load every project the manifest lists. Resolves to { items, failed } where `failed` holds manifest entries whose
 * module could not be read. A manifest that cannot be read at all throws, so the view can offer a retry.
 */
export async function loadProjects(shell) {
  const entries = await shell.catalog.byKind("project");
  const settled = await Promise.allSettled(entries.map((e) => shell.catalog.project(e.id)));
  const items = [];
  const failed = [];
  settled.forEach((r, i) => {
    const d = r.status === "fulfilled" ? describe(r.value) : null;
    if (d) items.push(d);
    else failed.push(entries[i]);
  });
  return { items: sortProjects(items), failed };
}
