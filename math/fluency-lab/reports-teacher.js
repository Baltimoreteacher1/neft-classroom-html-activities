// Class analysis for the teacher tools. Everything here is computed from learner records the teacher chose to
// open; nothing is sent anywhere. Each finding separates what was OBSERVED (counts of answers) from what is only
// INFERRED (a possible reason, never a diagnosis). Rules and cut points are in RULES (reports-rows.js).
import { mistakeCategoryLabel } from "./mistake-notes.js";
import { diagnosis, buildGroups, interventionFor, levelGroups } from "./reports-groups.js";
import {
  MAX_LEARNERS,
  RULES,
  byLabel,
  isStuck,
  learnerSummary,
  mean,
  percent,
  round1,
  skillRows,
} from "./reports-rows.js";
import { growthTrend } from "./reports-trends.js";
import { reteachTip } from "./reteach-table.js";
import { t } from "./i18n.js";

export { deviceLearner, parseLearnerFile, RULES, skillRows } from "./reports-rows.js";
export { compareSnapshotSets, growthTrend, snapshotMetrics } from "./reports-trends.js";
export { levelGroups, interventionFor } from "./reports-groups.js";

function skillStats(rows) {
  const byKey = new Map();
  for (const row of rows) byKey.set(row.key, [...(byKey.get(row.key) || []), row]);
  return [...byKey.entries()]
    .map(([key, list]) => {
      const checked = list.filter((row) => row.independent >= RULES.minIndependent);
      const independentAnswers = list.reduce((sum, row) => sum + row.independent, 0);
      const successes = list.reduce((sum, row) => sum + row.successes, 0);
      return {
        key,
        skill: list[0].skill,
        learners: list.length,
        checkedLearners: checked.length,
        lowLearners: checked.filter(isStuck).length,
        avgScore: round1(mean(list.filter((row) => row.score !== null).map((row) => row.score))),
        independentAnswers,
        independentWrong: independentAnswers - successes,
        independentAll: list.reduce((sum, row) => sum + row.independentAll, 0),
        supportedAnswers: list.reduce((sum, row) => sum + row.supportedAll, 0),
        due: list.filter((row) => row.due).length,
        overdue: list.filter((row) => row.overdue).length,
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key, "en", { numeric: true }));
}

// Recorded wrong answers that match a named pattern. A match is a pointer, not a diagnosis.
function misconceptionStats(rows) {
  const patterns = new Map();
  for (const row of rows) {
    for (const mistake of row.mistakes) {
      if (!mistake.category) continue;
      const id = `${row.key}|${mistake.category}`;
      const entry = patterns.get(id) || {
        key: row.key,
        skill: row.skill,
        category: mistake.category,
        members: new Map(),
        recorded: 0,
        open: 0,
        corrected: 0,
      };
      entry.members.set(row.learnerId, row.label);
      entry.recorded += 1;
      if (mistake.resolvedAt) entry.corrected += 1;
      else entry.open += 1;
      patterns.set(id, entry);
    }
  }
  const byPattern = [...patterns.values()]
    .map((entry) => {
      const label = mistakeCategoryLabel(entry.category);
      const learners = [...entry.members.values()].sort(byLabel);
      return {
        key: entry.key,
        skill: entry.skill,
        category: entry.category,
        label,
        learners,
        recorded: entry.recorded,
        open: entry.open,
        corrected: entry.corrected,
        reteach: reteachTip(entry.category),
        ...diagnosis(
          t(
            "{count} saved wrong answers from {n} learners on {skill} matched “{pattern}”; {fixed} have since been corrected.",
            {
              count: entry.recorded,
              n: learners.length,
              skill: entry.skill.title,
              pattern: label,
              fixed: entry.corrected,
            },
          ),
          t(
            "Possible pattern: {pattern}. Matching answers can also be slips or guesses, so treat this as a pointer, not a diagnosis.",
            { pattern: label },
          ),
        ),
        intervention: interventionFor({
          skill: entry.skill,
          basis: "misconception",
          category: entry.category,
        }),
      };
    })
    .sort(
      (a, b) =>
        b.learners.length - a.learners.length ||
        b.recorded - a.recorded ||
        a.key.localeCompare(b.key) ||
        a.category.localeCompare(b.category),
    );
  const byCategory = new Map();
  for (const entry of byPattern) {
    const total = byCategory.get(entry.category) || {
      category: entry.category,
      label: entry.label,
      reteach: entry.reteach,
      recorded: 0,
      learners: new Set(),
      skills: 0,
    };
    total.recorded += entry.recorded;
    for (const name of entry.learners) total.learners.add(name);
    total.skills += 1;
    byCategory.set(entry.category, total);
  }
  return {
    byPattern,
    byCategory: [...byCategory.values()]
      .map((entry) => ({ ...entry, learners: entry.learners.size }))
      .sort((a, b) => b.recorded - a.recorded || a.category.localeCompare(b.category)),
  };
}

function troubleSpots(stats, misconceptions) {
  return stats
    .filter((stat) => stat.lowLearners >= 1 && stat.lowLearners * 3 >= stat.checkedLearners)
    .map((stat) => {
      const pattern = misconceptions.byPattern.find((entry) => entry.key === stat.key);
      return {
        ...stat,
        category: pattern?.category || null,
        ...diagnosis(
          t(
            "{low} of {checked} learners with enough independent checks answered under 60% correctly on {skill}; {wrong} of {answers} independent answers were incorrect.",
            {
              low: stat.lowLearners,
              checked: stat.checkedLearners,
              skill: stat.skill.title,
              wrong: stat.independentWrong,
              answers: stat.independentAnswers,
            },
          ),
          pattern
            ? t(
                "Possible: some of these answers match “{pattern}”. The counts do not say why learners missed them.",
                { pattern: pattern.label },
              )
            : t(
                "Possible: the skill needs another look. The counts do not say why learners missed it.",
              ),
        ),
        intervention: interventionFor({
          skill: stat.skill,
          basis: "trouble",
          category: pattern?.category || null,
        }),
      };
    })
    .sort(
      (a, b) =>
        b.lowLearners - a.lowLearners ||
        b.independentWrong - a.independentWrong ||
        a.key.localeCompare(b.key, "en", { numeric: true }),
    );
}

function strandStats(summaries) {
  const strands = new Map();
  for (const summary of summaries)
    for (const [strand, score] of Object.entries(summary.strands))
      strands.set(strand, [...(strands.get(strand) || []), score]);
  return [...strands.entries()]
    .map(([strand, scores]) => ({
      strand,
      learners: scores.length,
      avgScore: round1(mean(scores)),
    }))
    .sort((a, b) => a.avgScore - b.avgScore || a.strand.localeCompare(b.strand));
}

function retentionStats(rows, summaries) {
  const scheduled = rows.filter((row) => row.dueAt !== null);
  const overdueBySkill = new Map();
  for (const row of rows)
    if (row.overdue) overdueBySkill.set(row.key, (overdueBySkill.get(row.key) || 0) + 1);
  return {
    scheduled: scheduled.length,
    due: rows.filter((row) => row.due).length,
    overdue: rows.filter((row) => row.overdue).length,
    ladder: [0, 1, 2, 3, 4].map(
      (step) => scheduled.filter((row) => row.ladderStep === step).length,
    ),
    retainedSkills: summaries.reduce((sum, item) => sum + item.retained, 0),
    correctedPatterns: summaries.reduce((sum, item) => sum + item.corrected, 0),
    mostOverdue: [...overdueBySkill.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
      .slice(0, 5),
  };
}

export function analyzeClass(learnersInput, { grade = null, now = Date.now() } = {}) {
  const learners = learnersInput.slice(0, MAX_LEARNERS);
  const rows = skillRows(learners, { grade, now });
  const summaries = learners
    .map((learner) => learnerSummary(learner, rows, now))
    .filter((summary) => summary.skills)
    .sort(byLabel);
  const stats = skillStats(rows);
  const misconceptions = misconceptionStats(rows);
  const { groups, individual } = buildGroups(rows);
  const independentAnswers = summaries.reduce((sum, item) => sum + item.independentAnswers, 0);
  const supportedAnswers = summaries.reduce((sum, item) => sum + item.supportedAnswers, 0);
  const withGrowth = summaries.filter((item) => item.growthDelta !== null);
  return {
    grade,
    now,
    rows,
    totals: {
      learners: summaries.length,
      skillRecords: rows.length,
      answers: rows.reduce((sum, row) => sum + row.answers, 0),
      independentAnswers,
      supportedAnswers,
      independentShare: percent(independentAnswers, independentAnswers + supportedAnswers),
    },
    learners: summaries,
    skills: stats,
    troubleSpots: troubleSpots(stats, misconceptions),
    misconceptions,
    groups,
    individual,
    strands: strandStats(summaries),
    retention: retentionStats(rows, summaries),
    growth: {
      learners: withGrowth.length,
      avgDelta: round1(mean(withGrowth.map((item) => item.growthDelta))),
      improved: withGrowth.filter((item) => item.growthDelta >= RULES.growthStep).length,
      declined: withGrowth.filter((item) => item.growthDelta <= -RULES.growthStep).length,
      weekly: growthTrend(learners),
    },
    supportHeavy: stats
      .map((stat) => ({
        key: stat.key,
        skill: stat.skill,
        answers: stat.independentAll + stat.supportedAnswers,
        share: percent(stat.supportedAnswers, stat.independentAll + stat.supportedAnswers),
      }))
      .filter((stat) => stat.answers >= 6 && stat.share >= RULES.supportedHeavy * 100)
      .sort((a, b) => b.share - a.share || a.key.localeCompare(b.key, "en", { numeric: true })),
    levelGroupsFor: (key) => levelGroups(rows, key),
  };
}
