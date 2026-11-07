// Did a learner reach an assignment's mastery target by its deadline? Pure functions over the tutor record.
// "Independent days" counts distinct local days with a first-try correct answer at grade level or above, so
// hinted or picture-first work never counts toward a target.
import { evidence, findSkill, localDay } from "./tutor-engine.js";

export const ASSIGNMENT_STATUSES = Object.freeze(["met", "in-progress", "not-started", "overdue"]);

export function dueStatus(due, now = Date.now()) {
  if (!due) return { state: "none", daysLeft: null };
  const today = localDay(now);
  const left = Math.round(
    (Date.parse(`${due}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000,
  );
  return { state: left < 0 ? "overdue" : left === 0 ? "today" : "upcoming", daysLeft: left };
}

export function independentDays(record, since = 0) {
  return new Set(
    (record?.recent || [])
      .filter(
        (entry) => entry.independent && entry.correct && entry.level >= 1 && entry.at >= since,
      )
      .map((entry) => localDay(entry.at)),
  ).size;
}

export function evaluateTarget(assignment, tutor, { now = Date.now(), since = 0 } = {}) {
  const target = assignment.target || null;
  const rows = (assignment.keys || []).map((key) => {
    const skill = findSkill(key);
    const record = tutor?.records?.[key];
    const score = skill && record?.recent?.length ? evidence(tutor, skill, now).score : null;
    const days = independentDays(record, since);
    const practiced = (record?.recent || []).some((entry) => entry.at >= since);
    const exampleViews = (record?.recent || []).filter(
      (entry) => entry.ex === 1 && entry.at >= since,
    ).length;
    const met = Boolean(target) && score !== null && score >= target.score && days >= target.days;
    const progress = target
      ? Math.min(1, ((score ?? 0) / target.score + Math.min(days, target.days) / target.days) / 2)
      : 0;
    return { key, score, days, practiced, met, progress, exampleViews };
  });
  return {
    rows,
    met: Boolean(target) && rows.length > 0 && rows.every((row) => row.met),
    practiced: rows.some((row) => row.practiced),
  };
}

// Status of one learner on one assignment. Without a target, "met" is never claimed: the status only says
// whether the learner has practised the skills since the assignment was made.
export function learnerStatus(assignment, tutor, options = {}) {
  const result = evaluateTarget(assignment, tutor, options);
  const due = dueStatus(assignment.due, options.now);
  let status = result.practiced ? "in-progress" : "not-started";
  if (result.met) status = "met";
  else if (due.state === "overdue") status = "overdue";
  return { status, due, ...result };
}

export function classStatus(assignment, learners, options = {}) {
  const rows = learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    ...learnerStatus(assignment, learner.tutor, options),
  }));
  const counts = Object.fromEntries(
    ASSIGNMENT_STATUSES.map((name) => [name, rows.filter((row) => row.status === name).length]),
  );
  return { rows, counts, total: rows.length };
}
