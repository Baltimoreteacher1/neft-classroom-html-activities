/**
 * sections.js — class sections, and how a class plan is composed from the
 * shared one.
 *
 * THE ARCHITECTURAL POINT, in one line: the pacing engine never learns what a
 * class is.
 *
 * `resolveYear(baseline, overlay)` in engine.js takes a plain `{date -> overlay}`
 * map. That is the whole seam. Class awareness is achieved by COMPOSING the
 * overlay before it reaches the engine, never by teaching the engine about
 * sections — so `insertAt`, the ripple, absorbers, locked days, closure
 * skipping, refusal-rather-than-truncation and undo are all untouched and stay
 * exactly as validated. Three classes are three overlays over one baseline, not
 * three calendars.
 *
 * THREE LAYERS, and only the third is new:
 *
 *   1. BASELINE      data/pacing-baseline-2026-27.json. The district's original
 *                    plan. Immutable, shared, and not in the database at all.
 *   2. SHARED PLAN   the section-less overlay (`section = ''` in D1). Things
 *                    true of the whole grade: a snow day, a schedule change,
 *                    a district re-pace. Also where every pre-class-awareness
 *                    edit lives, which is what makes the migration a no-op
 *                    rather than a copy.
 *   3. CLASS PLAN    the per-section overlay ('601' | '602' | '603'). Only what
 *                    THIS class did differently.
 *
 * A class plan is therefore a delta on a delta, and the year is never stored
 * three times. Adding a class costs nothing until that class diverges.
 */

/**
 * The canonical class sections.
 *
 * Mirrors SECTIONS in assets/learning-supports/supports-schema.js, which is the
 * roster source of record; tools/pacing-sections.test.mjs pins the two together
 * so this cannot become a second hardcoded list. It is duplicated rather than
 * imported because supports-schema.js is a browser IIFE that the Workers runtime
 * and node test scripts cannot import, and a pinned copy that fails loudly on
 * drift is safer than a runtime dependency that cannot be satisfied.
 */
export const SECTIONS = Object.freeze(["601", "602", "603"]);

/**
 * The shared plan's section id.
 *
 * The empty string, deliberately: it is what `ALTER TABLE ... ADD COLUMN section
 * TEXT NOT NULL DEFAULT ''` gives every pre-existing row, so legacy planner data
 * becomes the shared plan by DOING NOTHING. A sentinel like 'default' or 'all'
 * would have required rewriting every existing row to mean what it already
 * meant, which is a migration that can fail halfway.
 */
export const SHARED = "";

/** True for the shared plan or a real class. Anything else is rejected at the
 *  API boundary rather than quietly written to a section nobody teaches. */
export function isValidSection(section) {
  const s = section == null ? SHARED : String(section);
  return s === SHARED || SECTIONS.includes(s);
}

/** Normalize a section from a query string / stored preference. Unknown values
 *  fall back to the SHARED plan, never to a guessed class — showing 602 to
 *  someone who asked for 604 is worse than showing them the shared plan. */
export function normalizeSection(section) {
  const s = section == null ? SHARED : String(section).trim();
  return SECTIONS.includes(s) ? s : SHARED;
}

/* ── Composition ───────────────────────────────────────────────────────────── */

/**
 * The four fields a planner day can carry. `plan` and `actual` are objects,
 * `note` is text, `locked` is a flag. Kept as a list so the merge below cannot
 * silently miss a field added later — mergeDay() iterates it rather than naming
 * fields inline, and tools/pacing-sections.test.mjs asserts it matches what the
 * API validates.
 */
export const OVERLAY_FIELDS = Object.freeze(["plan", "actual", "note", "locked"]);

/**
 * Merge one shared day and one class day into the effective day.
 *
 * FIELD-LEVEL, not row-level, and the distinction is the whole usability of the
 * feature. A teacher records "601 actually taught 5-3" without restating the
 * plan; a whole-grade snow day sets the shared plan and all three classes see it
 * unless they have said otherwise. Row-level replacement would force the class
 * row to carry a copy of the shared plan, which is exactly the triplication this
 * design exists to avoid.
 *
 * ABSENT (undefined / null) MEANS INHERIT. That is not a new convention — it is
 * already how the overlay works: `rowToOverlay` omits null columns, and
 * `resolveYear` spreads `o.plan` over the baseline plan, so a missing field has
 * always meant "no opinion". Extending it one layer down keeps one rule.
 *
 * The consequence worth stating: a class cannot express "I have NO note where
 * the shared plan has one". In practice a teacher clears their own note, not the
 * grade's, and inventing a tombstone value to express it would complicate every
 * read for a case that has not come up.
 */
export function mergeDay(sharedDay, classDay) {
  if (!classDay) return sharedDay || null;
  if (!sharedDay) return classDay;
  const out = { ...sharedDay };
  for (const field of OVERLAY_FIELDS) {
    const value = classDay[field];
    if (value === undefined || value === null) continue;
    out[field] = value;
  }
  // The newer of the two timestamps, so "when did this day last change?" is
  // answered about the day the teacher is looking at, not about one layer of it.
  if (classDay.updatedAt != null) {
    out.updatedAt = Math.max(Number(sharedDay.updatedAt || 0), Number(classDay.updatedAt));
  }
  return out;
}

/**
 * The overlay a class actually teaches from: the shared overlay with the class
 * overlay merged over it, date by date.
 *
 * Pass the result straight to `resolveYear(baseline, overlay)`. The engine
 * cannot tell the difference, which is the point.
 */
export function effectiveOverlay(sharedOverlay = {}, classOverlay = {}) {
  const out = {};
  for (const [date, day] of Object.entries(sharedOverlay)) out[date] = day;
  for (const [date, day] of Object.entries(classOverlay)) {
    out[date] = mergeDay(out[date], day);
  }
  return out;
}

/**
 * Which layer a given date's value came from, for the UI to say "this is your
 * class's change" versus "this came from the shared plan".
 *
 * Returns "class" | "shared" | "baseline" per field. A planner that cannot tell
 * a teacher which layer they are editing is how someone changes the whole grade
 * while believing they changed their own class.
 */
export function fieldOrigins(sharedDay, classDay) {
  const origins = {};
  for (const field of OVERLAY_FIELDS) {
    const fromClass = classDay && classDay[field] !== undefined && classDay[field] !== null;
    const fromShared = sharedDay && sharedDay[field] !== undefined && sharedDay[field] !== null;
    origins[field] = fromClass ? "class" : fromShared ? "shared" : "baseline";
  }
  return origins;
}
