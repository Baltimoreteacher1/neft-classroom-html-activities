// Live class connection. The Teacher Hub's class panel keeps the teacher's classes (code + teacher passcode) in
// this browser; the studio reads that same list, calls the same class API client, and writes assignments in the
// same format, so there is one class system. Students' practice arrives as the summaries their devices already
// send (counts per domain, this week's evidence, assignments done): counts only, never a level or a score.
import { assignableActivities, toAssignment } from "../../access-practice-lab/src/class/assign.js";
import { createTeacherClient } from "../../shared/class-platform/client.js";
import { LIMITS } from "../../shared/class-platform/contract.js";

export const CLASSES_KEY = "accessPracticeLabClass:v1:teacher-classes";
const MAX_ASSIGNMENTS = LIMITS.maxAssignments;

/** The teacher's classes saved by the Teacher Hub on this device: [{ code, passcode, title }]. */
export function teacherClasses() {
  try {
    const list = JSON.parse(localStorage.getItem(CLASSES_KEY) || "[]");
    return Array.isArray(list)
      ? list.filter((c) => c && typeof c.code === "string" && c.passcode)
      : [];
  } catch {
    return [];
  }
}

const client = (cls) => createTeacherClient({ code: cls.code, passcode: cls.passcode });

/** Roster with practice summaries: { ok, students: [{ studentId, alias, lastSeen, summary }], assignments, error }. */
export async function loadClass(cls) {
  const res = await client(cls).roster();
  if (!res.ok)
    return {
      ok: false,
      error: res.error || `HTTP ${res.httpStatus}`,
      students: [],
      assignments: [],
    };
  return {
    ok: true,
    students: (res.students || []).map((s) => ({
      studentId: s.studentId,
      alias: s.alias,
      lastSeen: s.lastSeen || null,
      summary: s.docs?.language?.summary || {},
    })),
    assignments: res.settings?.assignments || [],
  };
}

const norm = (x) =>
  String(x || "")
    .trim()
    .toLowerCase();
/** Class member for a studio student: same name, or the same first name when that is unique in the class. */
export function memberFor(classStudents, name) {
  const n = norm(name);
  const exact = classStudents.find((s) => norm(s.alias) === n);
  if (exact) return exact;
  const first = n.split(/\s+/)[0];
  const byFirst = classStudents.filter((s) => norm(s.alias).split(/\s+/)[0] === first);
  return byFirst.length === 1 ? byFirst[0] : null;
}

/** The lab's support choice (A most help, C least) that fits a reported WIDA level. */
export const supportLevelFor = (level) =>
  level == null ? "B" : level < 2.5 ? "A" : level < 4 ? "B" : "C";

let indexCache = null;
const loadIndex = async () =>
  (indexCache ||= await (await fetch("/access-practice-lab/content/index.json")).json());

/**
 * Pick `count` activities for a domain, band and level that the class has not been given yet, add them to the
 * class's assignments and save. Returns { ok, added: [titles], error }.
 */
export async function assignToClass(cls, { band, domain, level, count = 2 }) {
  const index = await loadIndex();
  const current = await loadClass(cls);
  if (!current.ok) return { ok: false, error: current.error, added: [] };
  const support = supportLevelFor(level);
  const pool = assignableActivities(index, band, domain);
  const fresh = [
    ...pool.filter((r) => r.level === support),
    ...pool.filter((r) => r.level !== support),
  ].filter((r) => !current.assignments.some((a) => a.id === r.id));
  const picks = fresh.slice(0, count);
  if (!picks.length) return { ok: false, error: "nothing-new", added: [] };
  const list = [...current.assignments, ...picks.map(toAssignment)].slice(-MAX_ASSIGNMENTS);
  const res = await client(cls).settings({ assignments: list });
  return res.ok
    ? { ok: true, added: picks.map((p) => p.title) }
    : { ok: false, error: res.error || `HTTP ${res.httpStatus}`, added: [] };
}

/** Assignments done out of the class's current assignments, for one member. */
export function doneCount(member, assignments) {
  const ids = new Set(assignments.map((a) => a.id));
  const done = (member?.summary?.assignmentsDone || []).filter((id) => ids.has(id)).length;
  return { done, total: ids.size };
}
