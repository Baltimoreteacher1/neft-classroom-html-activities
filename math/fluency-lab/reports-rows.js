// Learner records and the per-learner, per-skill rows every teacher report is built from.
// A learner here is a nickname plus a sanitized tutor record; no names are read from files, and a label comes
// only from the file's own "label" field (typed by the teacher) or defaults to "Learner N".
import { REVIEW_LADDER, ladderIndex } from "./mastery-model.js";
import {
  correctedMisconceptions,
  retainedSkills,
  growthFor,
  sanitizeGrowthLog,
} from "./growth-log.js";
import { DAY, emptyTutor, findSkill, evidence, sanitizeTutor } from "./tutor-engine.js";
import { sanitizeFacts } from "./moby/fact-model.js";
import { cleanGreenDays } from "./green-light.js";
import { cleanStudio } from "./studio/adaptive.js";

export const RULES = Object.freeze({
  minIndependent: 2, // independent checks before a skill counts as evidence of a gap
  stuckRatio: 0.6, // below this share correct, a skill is "stuck" (same cut as the class snapshot)
  gapRatio: 0.75, // a prerequisite below this share correct is a measured gap
  overdueDays: 7, // review this many days late counts as overdue (same cut as the mastery model)
  growthStep: 10, // points of score change that count as improved or declined
  supportedHeavy: 0.5, // share of supported answers that marks a skill as mostly supported work
});
export const APP_NAME = "EduWonderLab Fluency Lab";
export const MAX_LEARNERS = 80;

export const byLabel = (a, b) =>
  String(a.label ?? a).localeCompare(String(b.label ?? b), "en", { numeric: true });
const mean = (values) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
export const round1 = (value) => (value === null ? null : Math.round(value * 10) / 10);
export const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : null);
export { mean };

// A learner backup (or a teacher-edited copy of one) becomes a learner. Anything else is refused.
export function parseLearnerFile(value, index = 0) {
  if (
    !value ||
    typeof value !== "object" ||
    value.app !== APP_NAME ||
    value.version !== 2 ||
    value.tutor?.version !== 2
  )
    return null;
  const label =
    typeof value.label === "string"
      ? value.label
          .replace(/[\u0000-\u001f<>]/g, "")
          .trim()
          .slice(0, 40)
      : "";
  const exported = Date.parse(value.exportedAt);
  return {
    id: `file-${index + 1}`,
    label: label || `Learner ${index + 1}`,
    tutor: sanitizeTutor(value.tutor),
    growth: sanitizeGrowthLog(value.play?.growth),
    // fl-teacher: per-fact records (automaticity) and Green Light days travel in the same file; older files have none.
    facts: sanitizeFacts(value.play?.facts),
    greenDays: cleanGreenDays(value.play?.rewards?.greenDays),
    studio: cleanStudio(value.play?.studio),
    exportedAt: Number.isFinite(exported) ? exported : null,
    grade: Number.isInteger(value.grade) ? value.grade : null,
  };
}

export const deviceLearner = ({ id, label, tutor, growth, facts, greenDays, studio }) => ({
  id: `device-${id}`,
  label,
  tutor: sanitizeTutor(tutor || emptyTutor()),
  growth: sanitizeGrowthLog(growth),
  facts: sanitizeFacts(facts),
  greenDays: cleanGreenDays(greenDays),
  studio: cleanStudio(studio),
  exportedAt: null,
  grade: null,
});

// Studio work is reported as observed practice evidence, separate from tutor mastery checks.
export function studioEvidence(learners, grade = null) {
  const bySkill = new Map();
  let explorations = 0;
  let independentAttempts = 0;
  let independentCorrect = 0;
  let supportedAttempts = 0;
  for (const learner of learners) {
    for (const [key, events] of Object.entries(learner.studio?.skills || {})) {
      const skillGrade = Number(key.match(/^(\d+):/)?.[1]);
      if (!Number.isInteger(skillGrade) || (grade !== null && skillGrade !== grade)) continue;
      const row = bySkill.get(key) || { key, learners: new Set(), explorations: 0, independentAttempts: 0, independentCorrect: 0, supportedAttempts: 0 };
      for (const event of events) {
        if (event.kind === "explore") { row.explorations += 1; explorations += 1; row.learners.add(learner.id); }
        if (event.kind !== "try") continue;
        if (event.supported) { row.supportedAttempts += 1; supportedAttempts += 1; }
        else { row.independentAttempts += 1; independentAttempts += 1; if (event.ok) { row.independentCorrect += 1; independentCorrect += 1; } }
        row.learners.add(learner.id);
      }
      bySkill.set(key, row);
    }
  }
  return {
    explorations,
    independentAttempts,
    independentCorrect,
    supportedAttempts,
    skills: [...bySkill.values()].map(({ learners: seen, ...row }) => ({ ...row, learners: seen.size })).sort((a, b) => a.key.localeCompare(b.key, "en", { numeric: true })),
  };
}

// One row per learner per skill with evidence. `grade` narrows to one grade; null keeps every grade.
export function skillRows(learners, { grade = null, now = Date.now() } = {}) {
  const rows = [];
  for (const learner of learners) {
    for (const [key, record] of Object.entries(learner.tutor?.records || {})) {
      const skill = findSkill(key);
      if (!skill || (grade !== null && skill.grade !== grade) || !record.recent?.length) continue;
      const status = evidence(learner.tutor, skill, now);
      const independentAll = status.recent.filter((entry) => entry.independent).length;
      const dueAt = Number.isFinite(record.dueAt) ? record.dueAt : null;
      rows.push({
        learnerId: learner.id,
        label: learner.label,
        key,
        skill,
        strand: skill.strand,
        score: status.score,
        state: status.state,
        independent: status.independent,
        successes: status.successes,
        ratio: status.ratio,
        independentAll,
        supportedAll: status.recent.length - independentAll,
        correctAll: status.recent.filter((entry) => entry.correct).length,
        answers: status.recent.length,
        dueAt,
        due: dueAt !== null && dueAt <= now,
        overdue: dueAt !== null && now - dueAt >= RULES.overdueDays * DAY,
        ladderStep: record.interval > 0 ? ladderIndex(record.interval) : 0,
        interval: record.interval || 0,
        lastAt: record.lastAt || null,
        mistakes: (learner.tutor.mistakes || []).filter((mistake) => mistake.key === key),
      });
    }
  }
  return rows.sort((a, b) => byLabel(a, b) || a.key.localeCompare(b.key));
}

export const isStuck = (row) =>
  row.independent >= RULES.minIndependent && row.ratio < RULES.stuckRatio;

// Per-learner summary: mastery by strand, supported versus independent work, review, growth and retention.
export function learnerSummary(learner, rows, now) {
  const mine = rows.filter((row) => row.learnerId === learner.id);
  const scored = mine.filter((row) => row.score !== null);
  const strands = {};
  for (const strand of new Set(scored.map((row) => row.strand)))
    strands[strand] = round1(
      mean(scored.filter((row) => row.strand === strand).map((row) => row.score)),
    );
  const states = Object.fromEntries(
    ["new", "learning", "developing", "proficient", "mastered"].map((state) => [
      state,
      mine.filter((row) => row.state === state).length,
    ]),
  );
  const independentAnswers = mine.reduce((sum, row) => sum + row.independentAll, 0);
  const supportedAnswers = mine.reduce((sum, row) => sum + row.supportedAll, 0);
  const deltas = [...new Set(mine.map((row) => row.key))]
    .map((key) => growthFor(learner.growth, key))
    .filter((growth) => growth.points > 1)
    .map((growth) => growth.delta);
  return {
    id: learner.id,
    label: learner.label,
    exportedAt: learner.exportedAt,
    skills: mine.length,
    avgScore: round1(mean(scored.map((row) => row.score))),
    states,
    strands,
    independentAnswers,
    supportedAnswers,
    independentShare: percent(independentAnswers, independentAnswers + supportedAnswers),
    due: mine.filter((row) => row.due).length,
    overdue: mine.filter((row) => row.overdue).length,
    retained: retainedSkills(learner.growth, learner.tutor, now).length,
    corrected: correctedMisconceptions(learner.tutor).length,
    growthSkills: deltas.length,
    growthDelta: round1(mean(deltas)),
  };
}

export const LADDER_LABELS = REVIEW_LADDER;
