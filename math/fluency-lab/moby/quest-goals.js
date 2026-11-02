// Daily and weekly goals for the Moby quests: effort, strategy and improvement goals, never volume or speed.
// A goal only ever moves forward. Missing a day pauses nothing and takes nothing away, and the weekly day-goal adapts
// to the pace the learner has actually shown, with a gentle floor, so it is never a streak to protect.
import { t } from "../i18n.js";
import { localDay } from "../tutor-engine.js";

export const WEEK_FLOOR = 2;
export const WEEK_CEIL = 5;
export const WEEK_DEFAULT = 3;
const DAY_MS = 86400000;

export const weekOf = (time) => {
  const date = new Date(time);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return localDay(date.getTime());
};

export const emptyWeek = () => ({
  days: [],
  repairs: 0,
  reassess: 0,
  explains: 0,
  strategies: 0,
  reviews: 0,
  quests: 0,
});
export const emptyCounters = () => ({
  repairs: 0,
  newStrategies: 0,
  reviewItems: 0,
  explains: 0,
  reassess: 0,
  credited: 0,
});

// Daily goal catalogue. `when` decides whether the goal can be met today from the day's snapshot.
export const DAILY_GOALS = Object.freeze({
  repair: {
    kind: "improvement",
    counter: "repairs",
    when: (snap) => snap.openMistakes >= 1,
    target: (snap) => Math.min(2, snap.openMistakes),
  },
  review: {
    kind: "retention",
    counter: "reviewItems",
    when: (snap) => snap.pool.length >= 1,
    target: () => 3,
  },
  strategy: { kind: "strategy", counter: "newStrategies", when: () => true, target: () => 1 },
  explain: { kind: "effort", counter: "explains", when: () => true, target: () => 2 },
});
const DAILY_ORDER = ["repair", "review", "strategy", "explain"];

export const goalText = (id, target) =>
  ({
    repair: target === 1 ? t("Repair 1 mistake") : t("Repair {n} mistakes", { n: target }),
    review: t("Review {n} facts you mastered last week", { n: target }),
    strategy: t("Try a new strategy"),
    explain: t("Explain {n} answers in your own words", { n: target }),
    days: t("Learn on {n} days this week", { n: target }),
    growth:
      target === 1
        ? t("Repair 1 mistake or pass 1 fresh check")
        : t("Repair a mistake or pass a fresh check {n} times", { n: target }),
    thinking: t("Show your thinking {n} times", { n: target }),
  })[id] || "";

const hash = (text) => {
  let h = 5381;
  for (const char of text) h = ((h * 33) ^ char.charCodeAt(0)) >>> 0;
  return h;
};

// Two goals per day, chosen from the ones that can be met, rotating with the date so they are the same all day.
export function pickDailyGoals(snapshot, day, learner = "0") {
  const open = DAILY_ORDER.filter((id) => DAILY_GOALS[id].when(snapshot));
  const start = hash(`${learner}|${day}`) % open.length;
  return [open[start], open[(start + 1) % open.length]]
    .filter((id, index, all) => all.indexOf(id) === index)
    .map((id) => ({ id, target: DAILY_GOALS[id].target(snapshot) }));
}

export function dailyGoalProgress(defs, counters) {
  return defs.map(({ id, target }) => {
    const have = Math.min(target, counters[DAILY_GOALS[id].counter] || 0);
    return {
      id,
      scope: "day",
      kind: DAILY_GOALS[id].kind,
      text: goalText(id, target),
      target,
      have,
      done: have >= target,
    };
  });
}

const median = (list) => {
  const sorted = [...list].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// The weekly day-goal follows the pace shown in the last (up to) three weeks that had any activity. A quiet week is
// ignored rather than counted, so a break can never lower the floor or make the goal feel like a debt.
export function weeklyTarget(weeks, now) {
  const current = weekOf(now);
  const busy = Object.keys(weeks)
    .filter((week) => week < current && weeks[week].days.length > 0)
    .sort()
    .slice(-3)
    .map((week) => weeks[week].days.length);
  if (!busy.length) return WEEK_DEFAULT;
  return Math.max(WEEK_FLOOR, Math.min(WEEK_CEIL, Math.round(median(busy))));
}

export function weeklyGoalProgress(weeks, now) {
  const week = weeks[weekOf(now)] || emptyWeek();
  const rows = [
    { id: "days", kind: "effort", target: weeklyTarget(weeks, now), have: week.days.length },
    { id: "growth", kind: "improvement", target: 1, have: week.repairs + week.reassess },
    { id: "thinking", kind: "strategy", target: 3, have: week.explains + week.strategies },
  ];
  return rows.map((row) => ({
    ...row,
    scope: "week",
    text: goalText(row.id, row.target),
    have: Math.min(row.target, row.have),
    done: row.have >= row.target,
  }));
}

// A warm line for coming back after time away. It never counts days missed or mentions a lost streak.
export function welcomeBack(lastDay, now) {
  if (!lastDay) return { daysAway: 0, text: t("Welcome! Today's quests are ready when you are.") };
  const daysAway = Math.max(
    0,
    Math.round((new Date(`${localDay(now)}T00:00:00`) - new Date(`${lastDay}T00:00:00`)) / DAY_MS),
  );
  return {
    daysAway,
    text:
      daysAway >= 2
        ? t("Welcome back! Everything you earned is still yours. Let's pick up where you left off.")
        : t("Glad you are here. Today's quests are ready when you are."),
  };
}
