import { GRADES } from "../problem-bank.js";
import { recommendations, skillKey } from "../tutor-engine.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Summarize only recent, timestamped local practice; never infer sessions or mastery. */
export function familyWeeklyReport(tutor, grade, { now = Date.now() } = {}) {
  if (!GRADES.some((entry) => entry.grade === Number(grade))) throw new RangeError("Choose a supported grade.");
  const cutoff = now - WEEK_MS;
  const skills = GRADES.find((entry) => entry.grade === Number(grade)).skills;
  const rows = skills.map((skill) => {
    const record = tutor?.records?.[skillKey(skill)];
    const recent = (Array.isArray(record?.recent) ? record.recent : []).filter(
      (entry) =>
        entry &&
        typeof entry.correct === "boolean" &&
        Number.isFinite(entry.at) &&
        entry.at >= cutoff &&
        entry.at <= now,
    );
    const independent = recent.filter((entry) => entry.independent === true && entry.level >= 1);
    const supported = recent.filter((entry) => !entry.independent || entry.level < 1);
    if (!recent.length) return null;
    return {
      key: skillKey(skill),
      title: skill.title,
      checks: independent.length,
      correct: independent.filter((entry) => entry.correct).length,
      supported: supported.length,
      supportedCorrect: supported.filter((entry) => entry.correct).length,
      lastAt: Math.max(...recent.map((entry) => entry.at)),
    };
  }).filter(Boolean).sort((a, b) => b.lastAt - a.lastAt);
  const independent = rows.reduce((sum, row) => sum + row.checks, 0);
  const correct = rows.reduce((sum, row) => sum + row.correct, 0);
  const supported = rows.reduce((sum, row) => sum + row.supported, 0);
  const suggested = recommendations(tutor, Number(grade), now)[0]?.skill?.title || null;
  const due = recommendations(tutor, Number(grade), now)
    .filter((entry) => entry.status.due)
    .slice(0, 3)
    .map((entry) => entry.skill.title);
  return {
    available: rows.length > 0,
    from: cutoff,
    to: now,
    totals: { independent, correct, supported, skills: rows.length },
    skills: rows.slice(0, 5),
    due,
    suggested,
  };
}
