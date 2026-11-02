// Local classroom report summaries. Bands describe task checks only; they are
// not WIDA scores, proficiency levels, or placement decisions.
import { practiceBand } from "./grade.js";
import { needsReview } from "./store.js";

/** Summarize one skill's saved task results without inferring language proficiency. */
export function practiceSummary(results, done = 0, total = 0) {
  const rows = Array.isArray(results) ? results : Object.entries(results || {});
  let score = 0;
  let possible = 0;
  let needsWork = false;
  const strongIndependent = new Set();

  for (const [id, result] of rows) {
    if (result?.practice?.total) {
      score += Number(result.practice.score) || 0;
      possible += Number(result.practice.total) || 0;
    } else if (result?.total) {
      score += Number(result.score) || 0;
      possible += Number(result.total) || 0;
    }
    if (needsReview(result)) needsWork = true;
    if (
      result?.mode === "independent" &&
      ((result?.ok === true && (result.tries || 1) === 1) || result?.practiceBand === "Strong practice response")
    ) strongIndependent.add(id);
  }

  const scoreBand = possible ? practiceBand(score, possible) : "";
  const status = needsWork
    ? "Needs Review"
    : strongIndependent.size >= 2
      ? "Strong Practice"
      : total > 0 && done >= total
        ? "Practice Complete"
        : done || rows.length
          ? "In Progress"
          : "Not Started";

  return {
    score,
    possible,
    scoreBand,
    status,
    percent: possible ? score / possible : null,
  };
}
