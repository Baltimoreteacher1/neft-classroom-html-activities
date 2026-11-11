// The printable files for each grade choice, and the grade's name for labels. Grades 6–8 keeps the original file names
// (they are linked from live pages and the PD folder); every other choice adds its id: quick-guide-k.pdf,
// activity-guide-2-3.docx, featured-lesson-backup-4-5.pdf. Names never contain the word "teacher" (Pages gates it).
// Pure: no DOM, so scripts/generate-intro-guide.mjs imports it in Node.
import { GRADE_PICKS } from "../grade-bands.js";
import { DOWNLOADS } from "./data.js";

const DIR = "/access-practice-lab/guides";

/** Every grade choice a teacher can make, in picker order. */
export const PICK_IDS = GRADE_PICKS.map((p) => p.id);
export const DEFAULT_PICK = "6-8";
export const isPick = (id) => PICK_IDS.includes(id);

/** "Grades 4–5" style name for a grade choice (English). */
export const gradeName = (pick) => GRADE_PICKS.find((p) => p.id === pick)?.name[0] || "";

/** The file-name suffix for a grade choice: "" for Grades 6–8, otherwise "-k", "-1", "-2-3", "-4-5". */
export const pickSuffix = (pick) => (pick === DEFAULT_PICK ? "" : `-${pick.toLowerCase()}`);

const pair = (stem, pick) => ({
  pdf: `${DIR}/${stem}${pickSuffix(pick)}.pdf`,
  docx: `${DIR}/${stem}${pickSuffix(pick)}.docx`,
});

/** The three per-grade handouts plus the whole-site directory, for one grade choice. */
export function printFiles(pick) {
  if (pick === DEFAULT_PICK)
    return {
      quickGuide: DOWNLOADS.quickGuide,
      lessonBackup: DOWNLOADS.lessonBackup,
      activityGuide: DOWNLOADS.activityGuide,
      directory: DOWNLOADS.directory,
    };
  return {
    quickGuide: pair("quick-guide", pick),
    lessonBackup: pair("featured-lesson-backup", pick),
    activityGuide: pair("activity-guide", pick),
    directory: DOWNLOADS.directory,
  };
}
