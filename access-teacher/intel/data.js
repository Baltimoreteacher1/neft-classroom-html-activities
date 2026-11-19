// Where the class intelligence panel gets its data. Reuses the Teacher Hub's own stores: the live classes it saved
// (classlink.js, the same class API client the class panel uses) and the Passport roster (roster-store.js). A live
// class is read with the existing roster call; nothing is written except the teacher's explicit "assign".
import { demoClass } from "../../access-practice-lab/src/lang/teacher.js";
import { assignToClass, loadClass, loadIndex, pickActivities, teacherClasses } from "../predictive/classlink.js";
import { readRoster } from "../roster-store.js";

export const SAMPLE_ID = "sample";
/** The sample class's entries are dated January 2026; "now" for it is the day after, so nobody looks idle. */
export const SAMPLE_NOW = Date.parse("2026-01-10T12:00:00Z");
const TTL_MS = 30_000;
const cache = new Map();

/** Structural source list: live classes first, then the Passport roster (one choice per section when several). */
export function listSources(roster = readRoster(), classes = teacherClasses()) {
  const live = classes.map((cls) => ({ id: `live:${cls.code}`, kind: "live", cls, title: cls.title || cls.code }));
  const sections = [...new Set(roster.map((s) => s.section))];
  const shared =
    sections.length > 1
      ? sections.map((section) => ({ id: `section:${section}`, kind: "roster", section }))
      : roster.length
        ? [{ id: "roster", kind: "roster", section: null }]
        : [];
  return [...live, ...shared];
}

/** The source to open first: a live class when there is one, else the roster. */
export const defaultSource = (sources) => sources[0] || null;

/**
 * Everything the model needs for one source: { members, roster, assignments, now, error }.
 * `members` is null unless a live class answered; on a network failure the roster still shows (error says why).
 */
export async function loadSource(source, { roster = readRoster(), force = false, now = Date.now() } = {}) {
  if (source?.id === SAMPLE_ID) return { members: null, roster: demoClass(), assignments: [], now: SAMPLE_NOW, error: "" };
  if (source?.kind === "roster") {
    const students = source.section ? roster.filter((s) => s.section === source.section) : roster;
    return { members: null, roster: students, assignments: [], now, error: "" };
  }
  if (!source) return { members: null, roster: [], assignments: [], now, error: "" };
  const hit = cache.get(source.id);
  if (hit && !force && Date.now() - hit.at < TTL_MS) return { ...hit.data, roster, now };
  const res = await loadClass(source.cls);
  if (!res.ok) return { members: null, roster, assignments: [], now, error: res.error };
  const data = { members: res.students, assignments: res.assignments, error: "" };
  cache.set(source.id, { at: Date.now(), data });
  return { ...data, roster, now };
}

/** The activities an "assign" would add, and the lab's content index (null when it cannot load). */
export async function previewPicks(assignments, spec) {
  try {
    return pickActivities(await loadIndex(), assignments, { ...spec, count: 2 });
  } catch {
    return [];
  }
}

/** One click: add the picks to the live class's assignments through the existing class API. */
export async function assignSpec(source, spec) {
  cache.delete(source.id);
  return assignToClass(source.cls, { ...spec, count: 2 });
}
