// Family Setup answers, kept in the lab's existing preferences record (accessPracticeLab:v1:prefs.family).
// Schema v1:  { v: 1, grade: "3-5" | "6-8" | "", who: "together" | "independent" | "", minutes: 0 | 5 | 10 | 15,
//               done: boolean, skipped: boolean,
//               trip: null | { skill, stop: 0-6 stops finished, ids: activity ids of the current stop } }
// Nothing here identifies a child: no name, birthday or email is ever asked for.
import { CORE_DOMAINS } from "../util.js";

export const FAMILY_SCHEMA = 1;
export const GRADES = ["3-5", "6-8"];
export const WHO = ["together", "independent"];
export const MINUTES = [5, 10, 15];
export const TRIP_STOPS = 6;

export const DEFAULT_FAMILY = Object.freeze({ v: FAMILY_SCHEMA, grade: "", who: "", minutes: 0, done: false, skipped: false, trip: null, tripWeeks: [] });

function cleanTrip(t) {
  if (!t || typeof t !== "object" || !CORE_DOMAINS.includes(t.skill)) return null;
  const stop = Number.isInteger(t.stop) && t.stop >= 0 && t.stop <= TRIP_STOPS ? t.stop : 0;
  const ids = Array.isArray(t.ids) ? t.ids.filter((id) => typeof id === "string" && id.length <= 80).slice(0, 12) : [];
  return { skill: t.skill, stop, ids };
}

/** Read and sanitize. Unknown or malformed values fall back to defaults; they never throw. */
export function getFamily(prefs) {
  const f = prefs?.family && typeof prefs.family === "object" ? prefs.family : {};
  return {
    v: FAMILY_SCHEMA,
    grade: GRADES.includes(f.grade) ? f.grade : "",
    who: WHO.includes(f.who) ? f.who : "",
    minutes: MINUTES.includes(Number(f.minutes)) ? Number(f.minutes) : 0,
    done: f.done === true,
    skipped: f.skipped === true,
    trip: cleanTrip(f.trip),
    tripWeeks: Array.isArray(f.tripWeeks) ? [...new Set(f.tripWeeks.filter((w) => /^\d{4}-\d{2}-\d{2}$/.test(w)))].slice(-30) : [],
  };
}

/** Merge a patch into the saved answers. */
export const familyPatch = (prefs, patch) => ({ family: { ...getFamily(prefs), ...patch, v: FAMILY_SCHEMA } });

export function tripWeekStreak(weeks, today = new Date()) {
  const monday = (date) => {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  };
  const keys = new Set((weeks || []).map(monday));
  const current = monday(today.toISOString().slice(0, 10));
  const previous = new Date(`${current}T00:00:00Z`);
  previous.setUTCDate(previous.getUTCDate() - 7);
  let cursor = keys.has(current) ? current : previous.toISOString().slice(0, 10);
  let count = 0;
  while (keys.has(cursor)) {
    count++;
    const d = new Date(`${cursor}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7);
    cursor = d.toISOString().slice(0, 10);
  }
  return count;
}
