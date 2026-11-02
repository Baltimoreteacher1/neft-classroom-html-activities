// The rescue log kept in the tutor record, and the caps that stop a rescue from ever becoming a loop. Pure and
// dependency-free so tutor-engine.js can sanitize it without importing the rescue flow.
const DAY = 86400000;
const KEY = /^\d:[a-z0-9-]{1,60}$/;
export const RESCUE_OUTCOMES = Object.freeze(["verified", "not-yet", "declined", "left"]);
export const RESCUE_LIMITS = Object.freeze({
  perSkillPerDay: 1,
  perDay: 3,
  perSession: 2,
  failedPairLimit: 2, // after two unverified rescues of the same skill/prerequisite pair, wait before offering it again
  failedPairDays: 14,
  keep: 40,
});

export function sanitizeRescues(list) {
  return (Array.isArray(list) ? list : [])
    .filter((entry) => entry && KEY.test(entry.goal) && KEY.test(entry.prereq) && Number.isFinite(entry.at) && RESCUE_OUTCOMES.includes(entry.outcome))
    .slice(-RESCUE_LIMITS.keep)
    .map((entry) => ({ goal: entry.goal, prereq: entry.prereq, at: entry.at, outcome: entry.outcome }));
}

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

// Why a rescue may not start right now, or null. An offer the learner declined counts as the day's one try.
export function rescueBlock(history, goalKey, prereqKey, now, sessionCount = 0) {
  const log = Array.isArray(history) ? history : [];
  const today = log.filter((entry) => sameDay(entry.at, now));
  if (today.some((entry) => entry.goal === goalKey)) return "skill-today";
  if (today.length >= RESCUE_LIMITS.perDay) return "day-cap";
  if (sessionCount >= RESCUE_LIMITS.perSession) return "session-cap";
  const failed = log.filter((entry) => entry.goal === goalKey && entry.prereq === prereqKey && entry.outcome === "not-yet" && now - entry.at < RESCUE_LIMITS.failedPairDays * DAY);
  if (failed.length >= RESCUE_LIMITS.failedPairLimit) return "pair-cooldown";
  return null;
}
