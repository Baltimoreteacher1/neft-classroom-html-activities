// Weekly word goal: the learner picks how many words to build correctly this week (weeks start Monday).
// It counts correct checks on this device only. It is a practice target, not a score or proficiency measure.
export const GOAL_CHOICES = [10, 20, 30];

const clampCount = (value) => (Number.isInteger(value) && value > 0 ? value : 0);

// Local-date Monday of the week, as YYYY-MM-DD.
export function weekStart(now = new Date()) {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  const pad = (n) => String(n).padStart(2, "0");
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

// Read-only view of the goal for this week. A count from an earlier week reads as zero.
export function weeklyProgress(bandState, now = new Date()) {
  const weekly = bandState?.weekly || {};
  const week = weekStart(now);
  return {
    goal: GOAL_CHOICES.includes(weekly.goal) ? weekly.goal : null,
    count: weekly.week === week ? clampCount(weekly.correct) : 0,
  };
}

export function setWeeklyGoal(bandState, goal, now = new Date()) {
  const weekly = bandState.weekly || {};
  const week = weekStart(now);
  const correct = weekly.week === week ? clampCount(weekly.correct) : 0;
  return {
    ...bandState,
    weekly: { goal: GOAL_CHOICES.includes(goal) ? goal : null, week, correct },
  };
}

export function clearWeeklyGoal(bandState) {
  return { ...bandState, weekly: { ...(bandState.weekly || {}), goal: null } };
}

export function recordWeeklyCorrect(bandState, now = new Date()) {
  const weekly = bandState.weekly || {};
  const week = weekStart(now);
  const correct = weekly.week === week ? clampCount(weekly.correct) : 0;
  return {
    ...bandState,
    weekly: {
      goal: GOAL_CHOICES.includes(weekly.goal) ? weekly.goal : null,
      week,
      correct: correct + 1,
    },
  };
}
