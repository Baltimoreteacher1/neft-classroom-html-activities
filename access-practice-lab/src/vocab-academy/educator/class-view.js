// Small read-only helpers over what the class server returned to the teacher (roster response).
import { assignmentCompletion, studentRows } from "./results.js";
import { vocabAcademyAssignments } from "./assign.js";

export { assignmentCompletion, studentRows };
/** The class's Vocabulary Academy assignments with their parsed stop: [{ a, p }]. */
export const classRows = (roster) => vocabAcademyAssignments(roster?.settings?.assignments || []);
/** A student-openable absolute link for an app-relative assignment path. */
export const absoluteLink = (path) => `${globalThis.location?.origin || ""}${path}`;
