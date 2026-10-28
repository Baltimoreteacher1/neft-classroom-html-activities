// Family Setup answers, kept in the lab's existing preferences record (accessPracticeLab:v1:prefs.family).
// Schema v1:  { v: 1, grade: "3-5" | "6-8" | "", who: "together" | "independent" | "", minutes: 0 | 5 | 10 | 15,
//               done: boolean, skipped: boolean }
// Nothing here identifies a child: no name, birthday or email is ever asked for.
export const FAMILY_SCHEMA = 1;
export const GRADES = ["3-5", "6-8"];
export const WHO = ["together", "independent"];
export const MINUTES = [5, 10, 15];

export const DEFAULT_FAMILY = Object.freeze({ v: FAMILY_SCHEMA, grade: "", who: "", minutes: 0, done: false, skipped: false });

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
  };
}

/** Merge a patch into the saved answers. */
export const familyPatch = (prefs, patch) => ({ family: { ...getFamily(prefs), ...patch, v: FAMILY_SCHEMA } });
