// District Wit & Wisdom pacing-guide facts for ELA units 1-3: module dates, introduction, end-of-module task, anchor
// texts, the module's weeks, and the week each lesson companion is suggested for.
// Data is generated per unit by tools/build-bcpss-module-facts.mjs into db/seeds/bcpss/v2/module-facts/.

import { MODULE_FACT_LOADERS } from "../../../db/seeds/bcpss/v2/index.mjs";

export async function loadModuleFacts(unitId) {
  const load = MODULE_FACT_LOADERS[unitId];
  return load ? (await load()).default : null;
}

/** The unit's module facts without the per-lesson placement (that goes onto each lesson). */
export function moduleOf(facts) {
  if (!facts) return null;
  const { lesson_weeks: _placement, ...rest } = facts;
  return rest;
}

/** The suggested week for one lesson: the week row plus why it fits, or null when the unit has no module facts. */
export function lessonWeek(facts, lessonId) {
  const row = facts?.lesson_weeks.find((l) => l.id === lessonId);
  if (!row) return null;
  const week = facts.weeks.find((w) => w.n === row.week);
  return {
    module: facts.module,
    week: row.week,
    label: week?.label ?? null,
    start: week?.start ?? null,
    end: week?.end ?? null,
    lessons: week?.lessons ?? null,
    how: row.how,
    ...(row.terms ? { terms: row.terms } : {}),
  };
}
