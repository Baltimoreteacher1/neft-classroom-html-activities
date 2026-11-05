// Dimensional identity for the lesson shell: the unit's isometric emblem and the
// unit colour hook. Drawn by the shared illustration library, never hand-pasted.
// The emblem is decoration (aria-hidden); the lesson title and unit label carry
// the meaning for assistive tech.
import { unitEmblem } from "../../tools/lib/iso-art.mjs";

/**
 * The curriculum unit 1-10 a lesson config belongs to, or 0 when it has none.
 * @param {{ unit?: unknown } | null | undefined} config
 */
export function lessonUnit(config) {
  const n = Number(config && config.unit);
  return Number.isInteger(n) && n >= 1 && n <= 10 ? n : 0;
}

/**
 * Tag the page so dimension-lesson.css can pick the unit colour (--dl-unit).
 * @param {{ unit?: unknown } | null | undefined} config
 */
export function markLessonUnit(config) {
  const n = lessonUnit(config);
  if (n) document.body.dataset.dmUnit = String(n);
}

/**
 * A wrapper span around the unit emblem; "" when the lesson has no unit.
 * @param {{ unit?: unknown } | null | undefined} config
 * @param {string} className
 */
export function emblemHtml(config, className) {
  const n = lessonUnit(config);
  return n ? `<span class="${className}" aria-hidden="true">${unitEmblem(n)}</span>` : "";
}
