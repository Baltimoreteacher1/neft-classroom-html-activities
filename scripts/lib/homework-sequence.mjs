/**
 * What comes after tonight, from the real curriculum order.
 *
 * The order is `lessons` in data/curriculum-launch-manifest.json (the launch manifest the site's
 * hubs read). A two-session lesson goes Session 1 -> Session 2 (`<id>-part2`) -> the next
 * lesson. Only lessons with a family page count, and Unit 10 is never recommended (it is not
 * taught this year), so a family is never sent to a page that does not exist or to untaught
 * content. Nothing here is chosen by tag or topic similarity.
 */
import { existsSync, readFileSync } from "node:fs";

const read = (rel) => JSON.parse(readFileSync(new URL(`../../${rel}`, import.meta.url), "utf8"));
const MANIFEST = read("data/curriculum-launch-manifest.json").lessons;
const TITLES_ES = read("data/family-homework-titles-es.json");
const hasPage = (id) =>
  existsSync(new URL(`../../data/family-homework-notes/${id}.json`, import.meta.url));
const inUnit10 = (id) => String(id).startsWith("10-");

/** Base lesson ids that have a lesson page, from the launch manifest. */
export const LESSON_PAGE_IDS = new Set(MANIFEST.map((l) => l.id));

/** Family pages in teaching order. */
export const FAMILY_SEQUENCE = MANIFEST.flatMap((l) => [l.id, `${l.id}-part2`]).filter(
  (id) => hasPage(id) && !inUnit10(id),
);

const titleOf = (id) => {
  const base = id.replace(/-part2$/, "");
  const lesson = MANIFEST.find((l) => l.id === base);
  const session2 = id !== base;
  const sidecar = session2 ? read(`data/family-homework-notes/${id}.json`) : null;
  const en = (session2 && sidecar?.sessionTitle) || lesson?.title || base;
  return { en, es: TITLES_ES[id] || TITLES_ES[base] || en };
};

/** The next family page after `lessonId`, or null at the end of the sequence. */
export function nextFamilyPage(lessonId) {
  const i = FAMILY_SEQUENCE.indexOf(lessonId);
  const id = i >= 0 ? FAMILY_SEQUENCE[i + 1] : null;
  if (!id) return null;
  const t = titleOf(id);
  const session2 = /-part2$/.test(id);
  return {
    id,
    href: `/lessons/${id}/homework.html`,
    en: session2 ? `${t.en} (Session 2)` : t.en,
    es: session2 && !TITLES_ES[id] ? `${t.es} (Sesión 2)` : t.es,
  };
}

/** EN/ES title of a family page by id (used for a prerequisite link). */
export const nextFamilyTitle = (id) => {
  const t = titleOf(id);
  return { en: t.en, es: t.es, id };
};
