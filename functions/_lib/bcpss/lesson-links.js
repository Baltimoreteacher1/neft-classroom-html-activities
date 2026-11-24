// Activity-to-lesson links: which lesson companion(s) each Language Studio activity belongs to, which activities each
// lesson practises, and (Grade 6 math) the Reveal Math lessons that teach the same words.
// Data is generated per unit by tools/build-bcpss-activity-lessons.mjs into db/seeds/bcpss/v2/lesson-links/.

import { LESSON_LINK_LOADERS } from "../../../db/seeds/bcpss/v2/index.mjs";

export async function loadLessonLinks(unitId) {
  const load = LESSON_LINK_LOADERS[unitId];
  return load ? (await load()).default : null;
}

/** A copy of the studio whose activities each carry `lessons: [{ id, sequence, title, how, terms? }]`. */
export function withLessonLinks(studio, links) {
  if (!studio || !links) return studio;
  return {
    ...studio,
    activities: studio.activities.map((a, i) => ({
      ...a,
      lessons: links.activities[i]?.lessons ?? [],
    })),
  };
}

/** The reverse links for one lesson: `studio_activities` it practises and the `reveal` lessons that match it. */
export function lessonLinkFields(links, lessonId) {
  const row = links?.lessons.find((l) => l.id === lessonId);
  return { studio_activities: row?.activities ?? [], reveal: row?.reveal ?? [] };
}
