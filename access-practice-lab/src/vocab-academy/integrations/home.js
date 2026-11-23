// Vocabulary Academy · the lab home's "Continue" candidate. Pure given a storage reader; reads the one record Core
// keeps under VA_KEY and returns a lab-relative path, so src/home-resume.js can rank it with the other modules.
import { safeJson } from "../../util.js";
import { VA_KEY, VA_ROUTE } from "../contract.js";

const UNIT_ID = /^g(K|\d{1,2})-u(\d{1,3})$/;

/** `{ id, at, path }` for the newest lesson the learner opened, or the program front door; null before any practice. */
export function vocabAcademyResume(read) {
  const progress = safeJson(read(VA_KEY), null);
  if (!progress || typeof progress !== "object" || progress.v !== 1) return null;
  const last = progress.last;
  const m = UNIT_ID.exec(String(last?.unit || ""));
  if (m && /^[a-h]$/i.test(String(last?.lesson || ""))) {
    const letter = String(last.lesson).toLowerCase();
    const finished = progress.units?.[last.unit]?.lessons?.[letter]?.done === true;
    // A finished lesson sends the learner to its lesson page (to pick the next section), not back into the same lesson.
    return {
      id: last.unit,
      at: last.at || progress.lastActive || "",
      path: `${VA_ROUTE}/grade/${m[1]}/lesson/${Number(m[2])}${finished ? "" : `/${letter}`}`,
    };
  }
  if (progress.lastActive) return { id: "start", at: progress.lastActive, path: VA_ROUTE };
  return null;
}
