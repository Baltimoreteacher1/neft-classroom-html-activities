// Report data for the student report and the family report. Pure: everything comes in as arguments, so every number can be
// recomputed from fixtures. Observed facts (what the learner did) are kept apart from inferred ones (what the evidence
// suggests: mastery state, retention, next skills). A report never states a grade level or predicts a placement.
import { correctedList, retainedList, skillStates, stateLabel } from "./achievements-4.js";
import { mistakeCategoryLabel } from "./mistake-notes.js";
import { findSkill, recommendations } from "./tutor-engine.js";
import { t } from "./i18n.js";

const EARLY_CHECKS = 4;
const MIN_EARLY = 3;
const PROFICIENT_OR_BETTER = new Set(["proficient", "mastered"]);
export const REPORT_AUDIENCES = Object.freeze(["student", "family"]);
export const MAX_ROWS = Object.freeze({
  growth: 5,
  retained: 6,
  corrected: 6,
  next: 3,
  current: 8,
});

// The grade whose skills have the most saved evidence; the higher grade breaks a tie. Used only to scope the report.
export function primaryGrade(tutor) {
  const counts = new Map();
  for (const key of Object.keys(tutor?.records || {})) {
    const skill = findSkill(key);
    if (skill) counts.set(skill.grade, (counts.get(skill.grade) || 0) + 1);
  }
  let best = null;
  for (const [grade, count] of counts)
    if (best === null || count > counts.get(best) || (count === counts.get(best) && grade > best))
      best = grade;
  return best ?? 1;
}

// What the learner did, counted from saved entries (observed). Supported = a hint, a retry or a coached answer.
function observedCounts(record) {
  const recent = record?.recent || [];
  const independent = recent.filter((entry) => entry.independent);
  return {
    independent: independent.length,
    correct: independent.filter((entry) => entry.correct).length,
    supported: recent.length - independent.length,
    days: new Set(independent.map((entry) => new Date(entry.at).toDateString())).size,
  };
}

// Where the learner started: the first growth snapshot when the teacher growth log exists (observed), otherwise a
// starting-point checkup result for that skill (observed).
function startOf(tutor, state, log, api) {
  const found = api?.growthFor && log ? api.growthFor(log, state.key) : null;
  if (found?.start)
    return {
      kind: "snapshot",
      state: found.start.state,
      score: found.start.score,
      at: found.start.at,
      history: found.history || [],
      delta: found.delta,
    };
  const checkup = tutor?.diagnostics?.[state.skill.grade]?.results?.[state.key];
  if (checkup === true || checkup === false)
    return {
      kind: "checkup",
      result: checkup ? "right" : "missed",
      at: tutor.diagnostics[state.skill.grade].at || null,
      history: [],
      delta: null,
    };
  // Otherwise the first few independent checks saved for the skill (observed; only when three or more exist).
  const early = (tutor?.records?.[state.key]?.recent || []).filter((item) => item.independent).slice(0, EARLY_CHECKS);
  if (early.length >= MIN_EARLY) return { kind: "early", right: early.filter((item) => item.correct).length, total: early.length, at: early[0].at, history: [], delta: null };
  return null;
}

export function buildReport({
  tutor,
  rewards = {},
  log = null,
  api = null,
  journal = null,
  grade = null,
  name = "",
  now = Date.now(),
} = {}) {
  const scope = grade ?? primaryGrade(tutor);
  const states = skillStates(tutor, now);
  const rows = [...states.values()]
    .filter((state) => state.skill.grade === scope)
    .map((state) => {
      const record = tutor.records[state.key];
      const start = startOf(tutor, state, log, api);
      const history = (start?.history || []).map((point) => ({
        at: point.at,
        score: point.score,
        state: point.state,
      }));
      return {
        key: state.key,
        title: state.skill.title,
        strand: state.skill.strand,
        state: state.state,
        score: state.score,
        start,
        history,
        observed: observedCounts(record),
      };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  const observed = rows.reduce(
    (sum, row) => ({
      independent: sum.independent + row.observed.independent,
      correct: sum.correct + row.observed.correct,
      supported: sum.supported + row.observed.supported,
    }),
    { independent: 0, correct: 0, supported: 0 },
  );
  const stateCounts = Object.fromEntries(
    ["learning", "developing", "proficient", "mastered"].map((state) => [
      state,
      rows.filter((row) => row.state === state).length,
    ]),
  );

  // Growth from the teacher snapshots when they exist; otherwise a checkup miss that is now proficient or better.
  const growth = rows
    .map((row) => {
      if (row.start?.kind === "snapshot" && row.start.score !== row.score) return { kind: "snapshot", key: row.key, title: row.title, from: row.start.state, to: row.state, fromScore: row.start.score, toScore: row.score, delta: row.score - row.start.score, history: row.history, start: row.start };
      if (row.start?.kind === "checkup" && row.start.result === "missed" && PROFICIENT_OR_BETTER.has(row.state)) return { kind: "checkup", key: row.key, title: row.title, from: "learning", to: row.state, fromScore: null, toScore: row.score, delta: null, history: [], start: row.start };
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => (b.delta ?? -1) - (a.delta ?? -1) || a.title.localeCompare(b.title))
    .slice(0, MAX_ROWS.growth);

  const inScope = (key) => findSkill(key)?.grade === scope;
  const retained = retainedList(log, tutor, states, api, now).filter((row) => inScope(row.key));
  const corrected = correctedList(tutor, api).filter((row) => inScope(row.key));
  const next = recommendations(tutor, scope, now)
    .filter((entry) => !(entry.status.state === "mastered"))
    .slice(0, MAX_ROWS.next)
    .map((entry) => ({
      key: `${entry.skill.grade}:${entry.skill.id}`,
      title: entry.skill.title,
      reason: entry.reason,
      state: entry.status.state,
    }));

  const strategies = new Set(rows.flatMap((row) => tutor.records[row.key]?.strategyTags || []));
  return {
    grade: scope,
    name: String(name || "")
      .trim()
      .slice(0, 40),
    generatedAt: now,
    hasLog: Boolean(log && api),
    rows,
    totals: {
      skills: rows.length,
      ...observed,
      accuracy: observed.independent
        ? Math.round((observed.correct / observed.independent) * 100)
        : null,
      states: stateCounts,
    },
    started: rows
      .filter((row) => row.start)
      .map((row) => ({ key: row.key, title: row.title, start: row.start }))
      .slice(0, MAX_ROWS.current),
    growth,
    retained: retained
      .slice(0, MAX_ROWS.retained)
      .map((row) => ({ key: row.key, title: findSkill(row.key).title, daysHeld: row.daysHeld })),
    corrected: corrected
      .slice(0, MAX_ROWS.corrected)
      .map((row) => ({
        key: row.key,
        title: findSkill(row.key).title,
        category: row.category,
        resolvedAt: row.resolvedAt,
      })),
    next,
    evidence: {
      practiceDays: new Set(Array.isArray(rewards.days) ? rewards.days : []).size,
      strategies: strategies.size,
      explanations: journal?.total ?? null,
      mathWords: journal?.wordsUsed ?? null,
      sessions: (tutor.sessions || []).length,
    },
    counts: { retainedAll: retained.length, correctedAll: corrected.length },
  };
}

// The tutor engine's reasons are plain English strings; map each to a translatable line.
export function reasonLabel(reason) {
  switch (reason) {
    case "Revisit a tricky idea":
      return t("Worth another look: a tricky idea came up");
    case "Time for a memory refresh":
      return t("Time to refresh it, so it stays remembered");
    case "A useful next step from your checkup":
      return t("A useful next step from the starting-point checkup");
    case "Explore something new":
      return t("A new idea to explore");
    case "Keep this skill fresh":
      return t("Keep it fresh with a short visit");
    default:
      return t("Build confidence on your own");
  }
}

export function startLabel(start) {
  if (start.kind === "snapshot") return `${stateLabel(start.state)} (${start.score})`;
  if (start.kind === "early") return t("First checks: {a} of {b} right", { a: start.right, b: start.total });
  return start.result === "right" ? t("Checkup: answered right") : t("Checkup: not yet");
}

export const categoryLabel = (category) => mistakeCategoryLabel(category);
