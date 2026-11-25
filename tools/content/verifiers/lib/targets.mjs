// Loads verifier targets: one per unit, { id, grade, subject, studio, lessons[] }, through the same loaders the site uses.
import { BCPSS_UNITS } from "../../../../data/bcpss-curriculum-seed.mjs";
import { loadLessons } from "../../../../functions/_lib/bcpss/lessons.js";
import { loadStudio } from "../../../../functions/_lib/bcpss/studio.js";

export const allUnitIds = () => BCPSS_UNITS.map((u) => u.id);

export async function loadTarget(unitId) {
  const unit = BCPSS_UNITS.find((u) => u.id === unitId);
  if (!unit) throw new Error(`unknown unit "${unitId}"`);
  const studio = await loadStudio(unitId);
  if (!studio) throw new Error(`no studio content for "${unitId}"`);
  const set = await loadLessons(unitId);
  return {
    id: unitId,
    grade: String(unit.grade),
    subject: unit.subject,
    studio,
    lessons: set?.lessons || [],
  };
}
