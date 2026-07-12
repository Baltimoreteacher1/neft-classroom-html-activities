/**
 * Lesson scoping helper.
 *
 * Lets the all-or-nothing lesson generators (slides, homework, notes) be
 * restricted to a subset of lessons WITHOUT changing their default behavior.
 * The Weekly Prep Autopilot sets `NEFT_LESSON_SCOPE` to a comma-separated list
 * of lesson ids (e.g. "2-1,2-2,2-3-flagship"); when the var is unset or empty,
 * `inScope()` returns true for everything so existing batch runs are untouched.
 *
 * Backward-compatible by construction: no scope => no filtering.
 */

const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

/** Parse NEFT_LESSON_SCOPE into a Set of ids, or null when unscoped. */
export function lessonScope(env = process.env) {
  const raw = (env.NEFT_LESSON_SCOPE || "").trim();
  if (!raw) return null;
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length ? new Set(ids) : null;
}

/** True if `id` should be processed under the current scope (all when unscoped). */
export function inScope(id, scope = lessonScope()) {
  return scope ? scope.has(id) : true;
}

export { LESSON_DIR_RE };
