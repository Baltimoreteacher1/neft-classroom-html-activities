/* =============================================================================
 * shared/curriculum/instructional-sequence.js
 * -----------------------------------------------------------------------------
 * ONE ordered answer to "what do students meet, in what order?" — and from it,
 * the only supported answer to "what did they learn last?".
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * A warmup is retrieval practice for the lesson taught IMMEDIATELY BEFORE it.
 * Every previous attempt at that relationship derived "immediately before" from
 * the lesson NUMBER — `ids[indexOf(id) - 1]` over folders sorted by (unit,
 * lesson). That is correct only where the district happens to teach in book
 * order, and this district does not:
 *
 *   The Pre-Unit is ASSEMBLED: 1-1 → 2-6 → 2-7 → 6-1 → 6-2. Numeric adjacency
 *   says 2-6 follows 2-5 (interquartile range) and 6-1 follows 5-10 (volume).
 *   Neither student ever sat in those lessons before that day.
 *
 * So adjacency is derived here, from the same three files the teacher-facing
 * surfaces already read, and nowhere else:
 *
 *   data/pacing-unit-ranges.json    → the ORDER OF UNITS the district teaches
 *   data/pacing-unit-lessons.json   → authored membership for ASSEMBLED units
 *   data/curriculum-launch-manifest.json → what exists, and unit membership
 *
 * Changing the district plan in those files changes warmup adjacency. There is
 * deliberately no second array of lesson order anywhere for this to drift from.
 *
 * FIRST TEACHING WINS
 * -------------------
 * A lesson can be SCHEDULED twice. 6-1 and 6-2 are taught in the Pre-Unit in
 * August as fraction-division prerequisites, and Unit 6 owns them again in
 * November; 2-6 and 2-7 likewise sit in the Pre-Unit and in Unit 2.
 *
 * A lesson has exactly ONE warmup, so adjacency cannot be per-occurrence. The
 * sequence therefore places each lesson at its FIRST scheduled position and
 * records the later ones as `repeats`. That is the position the warmup must
 * serve: the first time a class meets the mathematics is the only time the
 * retrieval question "what did we do yesterday?" has a single answer.
 *
 * A consequence worth stating out loud, because it looks like a bug: the lesson
 * before 6-3 is 4-5, not 6-2. Unit 6 opens on 6-3 because 6-1 and 6-2 were
 * taught three months earlier. The same is true of 2-8, whose predecessor is
 * 2-5, not 2-7.
 *
 * SUPPLEMENTARY ENTRIES ARE NOT PREDECESSORS
 * ------------------------------------------
 * Small-group variants, catch-up stations, culminating projects, arcade games,
 * family homework and teacher resources all appear in teacher-facing dropdowns.
 * None of them is a lesson whose mathematics the NEXT lesson should retrieve —
 * a warmup that reviewed "Family Homework" would be nonsense. Membership in the
 * canonical sequence is decided by the launch manifest's own `lessons` family,
 * never by the shape of an id, so a supplementary surface that starts looking
 * like a lesson id cannot sneak in.
 *
 * UNPACED LESSONS
 * ---------------
 * The district plan does not schedule every lesson the curriculum owns. The
 * authored Pre-Unit replaces curriculum unit 1's membership, which leaves the
 * Unit 1 "Math Is…" arc 1-2 … 1-6 on disk, in the manifest, and in no paced
 * unit. They are still real pages a teacher can open, so they are still placed
 * — at the end, flagged `paced: false`, and chained within their OWN unit's
 * manifest order. That is the same single source the paced sequence reads, not
 * a second ordering system: a teacher who runs the Unit 1 arc meets 1-2 after
 * 1-1, and its warmup should say so.
 *
 * Pure functions over plain data: no DOM, no fetch, no filesystem. The browser,
 * the node tools and `npm test` run the identical code.
 * ========================================================================== */

/**
 * @typedef {object} SequenceEntry
 * @property {string} id          canonical lesson id ("2-6")
 * @property {number} index       0-based position in the instructional sequence
 * @property {string} unitKey     the pacing key it is FIRST taught under ("PRE")
 * @property {number} curriculumUnit  the unit that canonically owns it
 * @property {boolean} assembled  true when the unit's membership was authored
 * @property {string[]} repeatUnitKeys  pacing keys that schedule it again, later
 * @property {boolean} paced      false when the district plan schedules no day for it
 */

/**
 * @typedef {object} InstructionalSequence
 * @property {string[]} order            lesson ids, first-teaching order, no duplicates
 * @property {Map<string, SequenceEntry>} entries
 * @property {Array<{id: string, firstUnitKey: string, repeatUnitKey: string}>} repeats
 * @property {string[]} unitKeys         pacing unit keys, in taught order
 * @property {string[]} unpaced          ids the district plan never schedules
 */

/** The manifest families that are NOT canonical instruction. Named so the rule
 *  is greppable and so a new family added to the manifest is a deliberate
 *  decision here rather than a silent inclusion. */
export const SUPPLEMENTARY_FAMILIES = Object.freeze(["smallGroups", "catchUps", "endOfUnit"]);

/**
 * Every id the launch manifest carries that is NOT canonical instruction.
 * Used to prove, in tests and gates, that no supplementary surface ever reaches
 * the sequence — rather than asserting it about a hand-listed sample.
 */
export function supplementaryIds(manifest) {
  const ids = new Set();
  for (const family of SUPPLEMENTARY_FAMILIES) {
    for (const entry of manifest?.[family] || []) if (entry?.id) ids.add(entry.id);
  }
  return ids;
}

/**
 * Build the canonical instructional sequence.
 *
 * @param {object} input
 * @param {object} input.ranges    data/pacing-unit-ranges.json
 * @param {object} input.authored  data/pacing-unit-lessons.json
 * @param {object} input.manifest  data/curriculum-launch-manifest.json
 * @returns {InstructionalSequence}
 */
export function buildInstructionalSequence({ ranges, authored, manifest }) {
  const lessons = manifest?.lessons || [];
  const canonical = new Map(lessons.map((l) => [l.id, l]));

  /* Manifest membership, in manifest order. The manifest is generated in
   * instructional order within a unit and validate:pacing-unit-order pins that,
   * so this is a read, never a sort. */
  const byUnit = new Map();
  for (const lesson of lessons) {
    const key = String(lesson.unit);
    if (!byUnit.has(key)) byUnit.set(key, []);
    byUnit.get(key).push(lesson.id);
  }

  const authoredUnits = authored?.units || {};
  const pacedUnits = [...(ranges?.units || [])].sort((a, b) => a.sequence - b.sequence);

  const order = [];
  const entries = new Map();
  const repeats = [];
  const unitKeys = [];
  const seenCurriculumUnits = new Set();

  for (const paced of pacedUnits) {
    /* MSTAR and any other pacing block that owns no curriculum unit schedules no
     * lesson, so it contributes no adjacency. It is still a real block of days —
     * the lesson after it simply retrieves from the lesson before it. */
    if (paced.curriculumUnit == null) continue;
    const unitKey = String(paced.key);
    const curriculumUnit = Number(paced.curriculumUnit);
    const unitId = String(curriculumUnit);

    const authoredEntry = authoredUnits[unitKey];
    const assembled = Array.isArray(authoredEntry?.lessons) && authoredEntry.lessons.length > 0;

    /* An authored id the curriculum no longer has is DROPPED, not faked — the
     * same rule the hub picker follows, so the two cannot disagree about what
     * the Pre-Unit contains. validate:pacing-unit-order fails on the mismatch,
     * so a silently shortened sequence cannot survive a build. */
    const members = assembled
      ? authoredEntry.lessons.filter((id) => canonical.has(id))
      : byUnit.get(unitId) || [];

    /* A curriculum unit paced twice would duplicate its whole membership. The
     * pacing gate already forbids it; guarded here too because this module is
     * also run against fixtures. */
    if (seenCurriculumUnits.has(unitId) && !assembled) continue;
    seenCurriculumUnits.add(unitId);

    unitKeys.push(unitKey);

    for (const id of members) {
      const already = entries.get(id);
      if (already) {
        /* FIRST TEACHING WINS. Record the repeat so a gate can report it and a
         * reader can see it, but do not move the lesson and do not let it break
         * the adjacency chain of the unit it is repeating inside. */
        already.repeatUnitKeys.push(unitKey);
        repeats.push({ id, firstUnitKey: already.unitKey, repeatUnitKey: unitKey });
        continue;
      }
      const entry = {
        id,
        index: order.length,
        unitKey,
        curriculumUnit: canonical.get(id)?.unit ?? curriculumUnit,
        assembled,
        paced: true,
        repeatUnitKeys: [],
      };
      entries.set(id, entry);
      order.push(id);
    }
  }

  /* WHAT THE PLAN DOES NOT SCHEDULE is appended, never dropped: the curriculum
   * is the authority on what exists, and a lesson missing from the sequence
   * would silently lose its warmup's anchor. Two cases land here — a whole unit
   * the plan forgets, and (the live case) the Unit 1 "Math Is…" arc that the
   * authored Pre-Unit displaced. Both keep their unit's manifest order, so a
   * teacher running that arc still gets honest adjacency inside it. */
  const unpaced = [];
  for (const [unitId, ids] of byUnit) {
    for (const id of ids) {
      if (entries.has(id)) continue;
      entries.set(id, {
        id,
        index: order.length,
        unitKey: `U${unitId}`,
        curriculumUnit: Number(unitId),
        assembled: false,
        paced: false,
        repeatUnitKeys: [],
      });
      order.push(id);
      unpaced.push(id);
      if (!unitKeys.includes(`U${unitId}`) && !seenCurriculumUnits.has(unitId)) {
        unitKeys.push(`U${unitId}`);
      }
    }
    seenCurriculumUnits.add(unitId);
  }

  /* Unit-order adjacency for the unpaced tail, so `getPreviousTaughtLesson` has
   * one lookup rather than a branch that re-derives order at call time. */
  const unitMemberOrder = new Map();
  for (const [unitId, ids] of byUnit) unitMemberOrder.set(unitId, ids);

  return { order, entries, repeats, unitKeys, unpaced, unitMemberOrder };
}

/**
 * The lesson taught immediately before `lessonId` in the instructional sequence.
 *
 * Returns `null` for the first lesson of the course — the honest answer, and the
 * signal that its warmup must be prerequisite retrieval (`kind: "spiral"`)
 * rather than a Previous Lesson Check naming a lesson nobody has taken.
 *
 * Returns `null` for anything that is not in the sequence at all: a
 * supplementary surface, a variant folder, an id the curriculum retired. A
 * caller that gets `null` must not fall back to arithmetic on the id.
 *
 * @param {string} lessonId
 * @param {InstructionalSequence} sequence
 * @returns {string|null}
 */
export function getPreviousTaughtLesson(lessonId, sequence) {
  const entry = sequence?.entries?.get(lessonId);
  if (!entry) return null;

  /* An UNPACED lesson has no position in the district's day-by-day plan, so the
   * lesson physically before it in `order` (the last lesson of the year) is not
   * what a class meeting it would have done yesterday. Its predecessor is the
   * previous member of its OWN unit — the arc it belongs to — read from the same
   * manifest order the paced units use. The arc's first member has none. */
  if (!entry.paced) {
    const members = sequence.unitMemberOrder?.get(String(entry.curriculumUnit)) || [];
    const at = members.indexOf(lessonId);
    return at > 0 ? members[at - 1] : null;
  }

  if (entry.index === 0) return null;

  /* Walk back past anything unpaced. Nothing unpaced can precede a paced lesson
   * in `order` today, but the guard keeps a future plan change from making the
   * predecessor of a real lesson a lesson nobody is scheduled to teach. */
  for (let i = entry.index - 1; i >= 0; i--) {
    const candidate = sequence.entries.get(sequence.order[i]);
    if (candidate?.paced) return candidate.id;
  }
  return null;
}

/**
 * True when this lesson opens the course and therefore legitimately has no
 * previously taught EduWonderLab lesson. Distinct from "not found", which is a
 * defect; this is a real, expected state with its own warmup contract.
 */
export function isCourseOpener(lessonId, sequence) {
  const entry = sequence?.entries?.get(lessonId);
  if (!entry) return false;
  return getPreviousTaughtLesson(lessonId, sequence) === null;
}

/**
 * Base lesson id for a folder name: `4-1-catchup` and `4-1-group2` both belong
 * to `4-1`. Variants inherit their parent's position; they never occupy one.
 */
export function baseLessonId(folderName) {
  const m = String(folderName).match(/^(\d+-\d+)/);
  return m ? m[1] : String(folderName);
}
