/**
 * pathway-counts.mjs — one definition per counted set, derived, never typed.
 *
 * "Pathway" meant three different things across three user-visible surfaces:
 * the hub footer's 214, the launch manifest's 288, and a third reading in
 * validate:notebook-checkpoints. None of them was wrong and none was written
 * down. This module is where they are written down.
 *
 *   HUB_TOTAL     small-group + catch-up + unit projects   — the routes BEYOND
 *                 the 84 core lessons, which the hub counts on its own line.
 *   LESSON_ROUTES core + small-group + catch-up            — every lesson-shaped
 *                 route a student can be sent to. Projects are not lessons.
 *   EVERY_ROUTE   all four.
 *
 * PURE by design: it reads the generated manifest and computes. Nothing here
 * prints or exits, so importing it from a validator cannot run a second gate as
 * a side effect.
 */
import { readFileSync } from "node:fs";

export const MANIFEST_PATH = "data/curriculum-launch-manifest.json";

export function pathwayCounts(path = MANIFEST_PATH) {
  const m = JSON.parse(readFileSync(path, "utf8"));
  const counts = {
    lessons: m.lessonCount,
    smallGroup: m.smallGroupCount,
    catchUp: m.catchUpCount,
    endOfUnit: m.endOfUnitCount,
  };
  return {
    ...counts,
    HUB_TOTAL: counts.smallGroup + counts.catchUp + counts.endOfUnit,
    LESSON_ROUTES: counts.lessons + counts.smallGroup + counts.catchUp,
    EVERY_ROUTE: counts.lessons + counts.smallGroup + counts.catchUp + counts.endOfUnit,
  };
}
