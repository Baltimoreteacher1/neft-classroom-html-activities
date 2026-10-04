// Saved activity transitions. A mode change never starts a new attempt.
import { answerOf, isActivityComplete, needsReview } from "./store.js";
export { isActivityComplete, needsReview } from "./store.js";

export const MAX_ATTEMPT_HISTORY = 5;

export function setActivityResult(record, id, result, complete = false) {
  record.results ||= {};
  record.results[id] = result;
  record.complete = (record.complete || []).filter((value) => value !== id);
  if (complete && !needsReview(result)) record.complete.push(id);
}

export function invalidateActivity(record, id) {
  record.complete = (record.complete || []).filter((value) => value !== id);
  if (record.results?.[id]) {
    record.results[id] = { ...record.results[id], evidence: "draft", meaningful: false };
  }
}

export function updateActivityAnswer(record, id, answer) {
  record.answers ||= {};
  if (JSON.stringify(answerOf(record, id)) === JSON.stringify(answer)) return false;
  record.answers[id] = answer;
  invalidateActivity(record, id);
  return true;
}

/** Explicit fresh selected-response attempt; learner-authored text stays intact. */
export function startIndependentAttempt(record, id, date = new Date().toISOString()) {
  record.attemptHistory ||= {};
  const previous = record.attemptHistory[id] || [];
  record.attemptHistory[id] = [...previous, {
    date,
    result: record.results?.[id] ? { ...record.results[id] } : null,
    attempts: record.attempts?.[id] || 0,
    supportUsed: Boolean(record.supportUsed?.[id]),
    complete: isActivityComplete(record, id),
  }].slice(-MAX_ATTEMPT_HISTORY);
  record.answers ||= {};
  // A null entry masks old per-type answer maps without deleting historical data.
  record.answers[id] = null;
  record.attempts ||= {};
  record.attempts[id] = 0;
  record.supportUsed ||= {};
  record.supportUsed[id] = false;
  setActivityResult(record, id, { evidence: "draft", meaningful: false, date });
}
