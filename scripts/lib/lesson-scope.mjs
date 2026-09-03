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

// ── Which lessons get a family homework page ────────────────────────────────
//
// Core lessons always do. Any OTHER lesson — a bridge/review lesson like
// `6-1-6-2-practice`, a catch-up station — does only when its config opts in
// with `familyHomework`, because those are scheduled by hand: Joel decides a
// given review is worth sending home, and the rest are re-teaches he runs in
// class. Making it a config fact rather than a hardcoded id keeps the next one
// a one-line edit instead of a code change.
//
// It also keeps BOTH generators that answer this question — the page itself,
// and the hub map that links to it — reading ONE predicate. They used to carry
// a copy of the same regex each, and a page generated with no hub entry
// pointing at it is a page nobody can reach, which is invisible from either
// file alone.
// Any lesson-shaped folder EXCEPT a small-group twin. `6-1-group1` and
// `6-1-group2` are the same lesson at another level and the hub resolves their
// rows as MAP[variant] || MAP[parent], so giving one its own homework silently
// diverges the twins from 6-1. A bridge lesson like `6-1-6-2-practice` is not a
// twin of anything — it is its own lesson covering two — so it may key directly.
const FAMILY_HOMEWORK_DIR_RE = /^[0-9][0-9a-z-]*$/;
const GROUP_TWIN_RE = /-group\d+$/;

/**
 * True when `id` should be given a `homework.html` and a hub tile.
 *
 * The opt-in is any truthy `familyHomework` — `true`, or the object form the
 * hub map already understands (`{ title }` to name the tile, `{ href }` to
 * point it elsewhere). `false` and absent both mean no.
 */
export function generatesFamilyHomework(id, config) {
  if (LESSON_DIR_RE.test(id)) return true;
  if (GROUP_TWIN_RE.test(id)) return false;
  return FAMILY_HOMEWORK_DIR_RE.test(id) && Boolean(config?.familyHomework);
}

/**
 * Sort key: unit, then lesson, then variants after the core lesson they belong
 * to. `LESSON_DIR_RE.exec` returns null for a bridge id, so a comparator built
 * on it alone throws the moment one is in the list.
 */
export function familyHomeworkSortKey(id) {
  const m = /^(\d+)-(\d+)/.exec(id);
  if (!m) return [Number.MAX_SAFE_INTEGER, 0, id];
  return [Number(m[1]), Number(m[2]), id];
}

/** Comparator over `familyHomeworkSortKey`. */
export function compareFamilyHomeworkIds(a, b) {
  const ka = familyHomeworkSortKey(a);
  const kb = familyHomeworkSortKey(b);
  return ka[0] - kb[0] || ka[1] - kb[1] || (ka[2] < kb[2] ? -1 : ka[2] > kb[2] ? 1 : 0);
}

export { FAMILY_HOMEWORK_DIR_RE, GROUP_TWIN_RE, LESSON_DIR_RE };
