// Trouble-spot rule: a learner has a trouble spot when they missed the SAME item type three times. An item type is a
// skill plus, when the lab recognised it, the named slip (mistake-notes.js). Independent misses on a skill with no
// named slip count as the skill's own type. Misses older than the window, and hinted or coached answers, never
// count. The class list ranks trouble spots by how many learners share one, then by total misses.
// OBSERVED: the counts. Nothing here guesses a cause beyond the slip the lab already named.
import { interventionFor } from "./reports-groups.js";
import { findSkill } from "./tutor-engine.js";

export const TROUBLE_MISSES = 3;
export const TROUBLE_WINDOW_DAYS = 28;
const DAY = 86400000;
const SKILL_TYPE = "";

// One learner's trouble spots: [{ key, category, misses, repaired }]. `category` is "" for the skill's own type.
export function learnerTroubleSpots(tutor, { now = Date.now(), grade = null } = {}) {
  const since = now - TROUBLE_WINDOW_DAYS * DAY;
  const spots = new Map();
  const add = (key, category, repaired) => {
    const skill = findSkill(key);
    if (!skill || (grade !== null && skill.grade !== grade)) return;
    const id = `${key}|${category}`;
    const spot = spots.get(id) || { key, category, misses: 0, open: 0 };
    spot.misses += 1;
    if (!repaired) spot.open += 1;
    spots.set(id, spot);
  };
  const named = new Map();
  for (const mistake of tutor?.mistakes || []) {
    if (!mistake?.category || !(Number(mistake.at) >= since)) continue;
    add(mistake.key, mistake.category, Boolean(mistake.resolvedAt));
    named.set(mistake.key, (named.get(mistake.key) || 0) + 1);
  }
  // A miss already counted under a named slip is not counted again under the skill's own type.
  for (const [key, record] of Object.entries(tutor?.records || {})) {
    const wrong = (record?.recent || []).filter(
      (entry) => entry.independent && !entry.correct && entry.at >= since,
    ).length;
    // Two fresh independent successes in a row settle the skill's own type, as in repair practice.
    const lastTwo = (record?.recent || []).filter((entry) => entry.independent).slice(-2);
    const settled = lastTwo.length === 2 && lastTwo.every((entry) => entry.correct);
    for (let n = 0; n < wrong - (named.get(key) || 0); n += 1) add(key, SKILL_TYPE, settled);
  }
  return [...spots.values()]
    .filter((spot) => spot.misses >= TROUBLE_MISSES)
    .map(({ key, category, misses, open }) => ({ key, category, misses, repaired: open === 0 }));
}

// The class list, most shared first. Repaired spots stay visible but rank below open ones.
export function rankTroubleSpots(learners, { now = Date.now(), grade = null } = {}) {
  const byType = new Map();
  for (const learner of learners) {
    for (const spot of learnerTroubleSpots(learner.tutor, { now, grade })) {
      const id = `${spot.key}|${spot.category}`;
      const entry = byType.get(id) || {
        key: spot.key,
        category: spot.category || null,
        learners: [],
        misses: 0,
        open: 0,
      };
      entry.learners.push(learner.label);
      entry.misses += spot.misses;
      if (!spot.repaired) entry.open += 1;
      byType.set(id, entry);
    }
  }
  return [...byType.values()]
    .map((entry) => {
      const skill = findSkill(entry.key);
      return {
        ...entry,
        skill,
        learners: entry.learners.sort((a, b) => a.localeCompare(b, "en", { numeric: true })),
        intervention: interventionFor({ skill, basis: "trouble", category: entry.category }),
      };
    })
    .sort(
      (a, b) =>
        b.open - a.open ||
        b.learners.length - a.learners.length ||
        b.misses - a.misses ||
        a.key.localeCompare(b.key, "en", { numeric: true }) ||
        String(a.category).localeCompare(String(b.category)),
    );
}
