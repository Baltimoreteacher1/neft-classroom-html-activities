// Evidence rules for Family Math 2.0. Every rule here is deterministic: the same history and clock give the
// same level, stars and review date. No randomness, no hidden state. @fm2 FM-022 FM-023 FM-064
export const MAX_LEVEL = 3;
export const WINDOW = 12;
const DAY = 86400000;
export const INTERVALS = [1, 2, 4, 8, 14];

// What one attempt counts for: a clean correct is full evidence, a hinted correct is partial, a miss is none.
export function weight(attempt) {
  if (!attempt.c) return 0;
  if (attempt.h >= 2) return 0.35;
  if (attempt.h === 1) return 0.6;
  return 1;
}

// Recency-weighted mastery in [0, 1]. The newest attempt weighs 1, each older one 0.85 of the next newer.
export function mastery(skill) {
  const recent = (skill?.recent || []).slice(-WINDOW);
  if (!recent.length) return { score: 0, n: 0, reliable: false };
  let top = 0;
  let bottom = 0;
  recent.forEach((attempt, index) => {
    const w = 0.85 ** (recent.length - 1 - index);
    top += w * weight(attempt);
    bottom += w;
  });
  return { score: top / bottom, n: recent.length, reliable: recent.length >= 3 };
}

// Stars: 0 until there is reliable evidence; then 1 (building), 2 (secure), 3 (strong) at 0.5 / 0.75 / 0.9.
export function starsFor(skill) {
  const m = mastery(skill);
  if (!m.reliable) return 0;
  if (m.score >= 0.9) return 3;
  if (m.score >= 0.75) return 2;
  if (m.score >= 0.5) return 1;
  return 0;
}

// Move up after 3 unhinted-correct answers in the last 4 at this level; move down after at most 1 correct in the last 3.
export function levelAfter(skill, level) {
  const here = (skill?.recent || []).filter((a) => a.l === level);
  const lastFour = here.slice(-4);
  const lastThree = here.slice(-3);
  if (lastFour.length >= 4 && lastFour.filter((a) => a.c && a.h === 0).length >= 3) return Math.min(MAX_LEVEL, level + 1);
  if (lastThree.length >= 3 && lastThree.filter((a) => a.c).length <= 1) return Math.max(1, level - 1);
  return level;
}

// Fold one attempt into a skill record: recent window, level, review interval and due time.
export function applyAttempt(skill, attempt, now = Date.now()) {
  const recent = [...(skill?.recent || []), { c: attempt.correct ? 1 : 0, h: Math.min(3, attempt.hints || 0), l: attempt.level, t: now }].slice(-WINDOW);
  const level = skill?.level || attempt.level || 1;
  const next = { ...(skill || {}), recent, level, plays: (skill?.plays || 0) + 1 };
  next.level = levelAfter(next, level);
  const clean = attempt.correct && (attempt.hints || 0) === 0;
  if (clean) next.step = Math.min(INTERVALS.length - 1, (skill?.step ?? -1) + 1);
  else if (!attempt.correct) next.step = 0;
  next.dueAt = now + INTERVALS[next.step ?? 0] * DAY;
  next.lastAt = now;
  return next;
}

export const isDue = (skill, now = Date.now()) => Boolean(skill?.dueAt) && skill.dueAt <= now;
