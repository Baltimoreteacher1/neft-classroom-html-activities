// Class-level change over time: from several uploaded snapshot sets (for example last month's backups and this
// month's) and from the growth logs inside the backups. Counts and averages only; no learner is tracked by name.
import { DAY, localDay } from "./tutor-engine.js";
import { isStuck, learnerSummary, mean, percent, round1, skillRows } from "./reports-rows.js";

const HELD = new Set(["proficient", "mastered"]);

export function snapshotMetrics(learners, { grade = null, now = Date.now() } = {}) {
  const rows = skillRows(learners, { grade, now });
  const summaries = learners
    .map((learner) => learnerSummary(learner, rows, now))
    .filter((summary) => summary.skills);
  const independent = summaries.reduce((sum, item) => sum + item.independentAnswers, 0);
  const supported = summaries.reduce((sum, item) => sum + item.supportedAnswers, 0);
  const stuck = {};
  for (const row of rows) if (isStuck(row)) stuck[row.key] = (stuck[row.key] || 0) + 1;
  return {
    learners: summaries.length,
    skillRecords: rows.length,
    avgScore: round1(
      mean(summaries.map((item) => item.avgScore).filter((score) => score !== null)),
    ),
    proficientShare: percent(rows.filter((row) => HELD.has(row.state)).length, rows.length),
    independentShare: percent(independent, independent + supported),
    dueShare: percent(rows.filter((row) => row.due).length, rows.length),
    stuck,
  };
}

// sets: [{ label, at, learners }]. Returns each set's metrics in date order, the change from the previous set,
// and which skills got easier, stayed stuck, or are newly stuck between the first and last set.
export function compareSnapshotSets(sets, { grade = null } = {}) {
  const ordered = [...sets].sort(
    (a, b) => a.at - b.at || String(a.label).localeCompare(String(b.label)),
  );
  const points = ordered.map((set) => {
    const metrics = snapshotMetrics(set.learners, { grade, now: set.at });
    return { label: set.label, at: set.at, day: localDay(set.at), ...metrics };
  });
  points.forEach((point, index) => {
    const before = points[index - 1];
    point.change =
      before && point.avgScore !== null && before.avgScore !== null
        ? round1(point.avgScore - before.avgScore)
        : null;
  });
  const first = points[0]?.stuck || {};
  const last = points.at(-1)?.stuck || {};
  const keys = new Set([...Object.keys(first), ...Object.keys(last)]);
  const rows = [...keys].map((key) => ({ key, was: first[key] || 0, now: last[key] || 0 }));
  const order = (a, b) => b.was - a.was || b.now - a.now || a.key.localeCompare(b.key);
  return {
    points,
    improved: points.length > 1 ? rows.filter((row) => row.now < row.was).sort(order) : [],
    stillStuck:
      points.length > 1 ? rows.filter((row) => row.was > 0 && row.now >= row.was).sort(order) : [],
    newlyStuck:
      points.length > 1 ? rows.filter((row) => row.was === 0 && row.now > 0).sort(order) : [],
  };
}

// Weekly class average built from the growth logs: at each week's end, every learner's latest known score per
// skill, averaged by learner and then across learners. Needs at least two weeks of snapshots to say anything.
export function growthTrend(learners, { maxPoints = 12 } = {}) {
  const logs = learners
    .map((learner) => learner.growth?.snapshots || [])
    .filter((list) => list.length);
  const times = logs.flat().map((entry) => entry.at);
  if (!times.length) return [];
  const min = Math.min(...times);
  const max = Math.max(...times);
  const weeks = Math.max(1, Math.ceil((max - min + 1) / (7 * DAY)));
  const ends = Array.from({ length: weeks }, (_, index) =>
    Math.min(max, min + (index + 1) * 7 * DAY - 1),
  ).slice(-maxPoints);
  return ends
    .map((end) => {
      const perLearner = logs
        .map((list) => {
          const latest = new Map();
          for (const entry of list)
            if (entry.at <= end && (!latest.has(entry.key) || latest.get(entry.key).at <= entry.at))
              latest.set(entry.key, entry);
          return mean([...latest.values()].map((entry) => entry.score));
        })
        .filter((score) => score !== null);
      return {
        at: end,
        day: localDay(end),
        learners: perLearner.length,
        avgScore: round1(mean(perLearner)),
      };
    })
    .filter((point) => point.learners);
}
