// Objective scoring. Constructed and speaking responses are never auto-scored: they return `needs-review`, and
// the lab never invents a score for them. Every function is pure so the browser, the tests and the teacher
// reports agree.
import { OBJECTIVE_TYPES } from "./schema.js";

const sameSet = (a, b) => a.length === b.length && [...a].sort().join("\u0000") === [...b].sort().join("\u0000");

export const isObjective = (item) => OBJECTIVE_TYPES.includes(item.type);

/** True when a response has something in it (used for "answered" and unanswered indicators). */
export function hasResponse(item, r) {
  if (r === undefined || r === null) return false;
  switch (item.type) {
    case "multiple-select":
      return Array.isArray(r) && r.length > 0;
    case "dropdown":
      return r && typeof r === "object" && Object.values(r).some(Boolean);
    case "ordering":
      return Array.isArray(r) && r.length > 0;
    case "matching":
    case "drag-drop":
      return r && typeof r === "object" && Object.values(r).some(Boolean);
    case "constructed-response":
      return typeof r === "string" && r.trim().length > 0;
    case "speaking-response":
      return Boolean(r && (r.submitted || r.recordingId));
    default:
      return typeof r === "string" && r.length > 0;
  }
}

/** @returns {{ status: "correct"|"incorrect"|"needs-review"|"unanswered", correct: boolean|null, detail?: object }} */
export function scoreItem(item, response) {
  if (!hasResponse(item, response)) return { status: "unanswered", correct: false };
  switch (item.type) {
    case "multiple-choice":
    case "listening-response":
      return verdict(response === item.answer);
    case "multiple-select":
      return verdict(sameSet(response, item.answer));
    case "dropdown": {
      const blanks = item.dropdown.blanks;
      const detail = Object.fromEntries(Object.keys(blanks).map((k) => [k, response[k] === blanks[k].answer]));
      return { ...verdict(Object.values(detail).every(Boolean)), detail };
    }
    case "ordering":
      return verdict(response.length === item.ordering.answer.length && response.every((id, i) => id === item.ordering.answer[i]));
    case "matching": {
      const answer = item.matching.answer;
      const detail = Object.fromEntries(Object.keys(answer).map((k) => [k, response[k] === answer[k]]));
      return { ...verdict(Object.values(detail).every(Boolean)), detail };
    }
    case "drag-drop": {
      const answer = item.dragDrop.answer;
      const detail = Object.fromEntries(Object.keys(answer).map((k) => [k, response[k] === answer[k]]));
      return { ...verdict(Object.values(detail).every(Boolean)), detail };
    }
    default:
      return { status: "needs-review", correct: null };
  }
}
const verdict = (ok) => ({ status: ok ? "correct" : "incorrect", correct: ok });

/** The distractor note for a wrong multiple-choice / listening answer, if the author wrote one. */
export const distractorNote = (item, response) => item.distractors?.[response] ?? null;

export const wordCount = (text) => (String(text || "").trim().match(/[\p{L}\p{N}'’-]+/gu) || []).length;
