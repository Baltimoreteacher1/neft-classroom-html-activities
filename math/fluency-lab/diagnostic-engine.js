// Continuous diagnostic. Sits beside placement.js (the short adaptive checkup) and uses the per-answer ability estimate in
// ability.js, so what the lab knows about a learner keeps updating from ordinary practice instead of waiting for
// the next checkup. Observed performance (counts, dates, estimates from the learner's own answers) is kept
// strictly apart from inferred diagnosis (what the prerequisite map suggests): every entry says which with
// `kind: "observed" | "inferred"`, and an inferred entry never carries a made-up estimate.
import { abilityEstimate, emptyAbility, updateAbility } from "./ability.js";
import { tierOf } from "./difficulty-levels.js";
import { t } from "./i18n.js";
import { ALL_SKILLS } from "./problem-bank.js";
import { DAY, evidence, explicitPrerequisites, localDay, prerequisites, skillKey } from "./tutor-engine.js";

export const DIAGNOSTIC = Object.freeze({
  freshDays: 30, // an independent answer this recent counts as current evidence for its skill
  freshAnswers: 3, // independent answers needed before a skill counts as covered
  coveredShare: 0.8, // when this share of a grade is covered, a checkup would only repeat what is known
  recentCheckupDays: 14,
  secureEstimate: 0.8,
  strugglingEstimate: 0.6,
  minAnswers: 2, // fewer answers than this are not an estimate yet
});

const gradeSkills = (grade) => ALL_SKILLS.filter((skill) => skill.grade === grade);
const dateOf = (time) => (Number.isFinite(time) ? localDay(time) : null);

// Old saves have no stored ability: replay the recent answers so they get an estimate too.
function abilityOf(record) {
  if (record?.ability) return record.ability;
  return (record?.recent || []).reduce(
    (ability, entry) => updateAbility(ability, { correct: entry.correct, independent: entry.independent, tier: tierOf(entry) }, entry.at),
    emptyAbility(),
  );
}

// Everything observed about one skill, from the learner's own answers.
export function skillStatus(tutor, skill, now = Date.now()) {
  const record = tutor.records?.[skillKey(skill)];
  const recent = record?.recent || [];
  const independent = recent.filter((entry) => entry.independent);
  const estimate = abilityEstimate(abilityOf(record), now);
  const fresh = independent.filter((entry) => now - entry.at <= DIAGNOSTIC.freshDays * DAY);
  const review = evidence(tutor, skill, now);
  return {
    skill,
    key: skillKey(skill),
    p: estimate.p,
    weight: estimate.weight,
    answers: recent.length,
    independent: independent.length,
    correct: independent.filter((entry) => entry.correct).length,
    freshIndependent: fresh.length,
    recentMisses: independent.slice(-6).filter((entry) => !entry.correct).length,
    lastAt: recent.at(-1)?.at ?? null,
    reviewDueAt: review.reviewDueAt,
    reviewStep: review.reviewStep,
    due: review.due,
    observed: estimate.n >= DIAGNOSTIC.minAnswers,
  };
}

const isSecure = (status) => status.observed && status.p >= DIAGNOSTIC.secureEstimate && status.independent >= 4;
const isStruggling = (status) => status.observed && (status.p < DIAGNOSTIC.strugglingEstimate || status.recentMisses >= 2);

const band = (status) => (isSecure(status) ? "secure" : status.p < 0.5 ? "needs-work" : "building");

// The prerequisites of a struggling skill worth a look. "observed" when the learner's own answers on that
// prerequisite are weak; "inferred" when there is no evidence yet and the map only suggests it.
export function prerequisiteGaps(tutor, skill, now = Date.now()) {
  const goal = skillStatus(tutor, skill, now);
  if (!isStruggling(goal)) return [];
  return prerequisites(skill)
    .filter((candidate) => candidate.grade >= 1)
    .map((candidate) => skillStatus(tutor, candidate, now))
    .filter((status) => !isSecure(status))
    .map((status) => ({
      kind: status.observed ? "observed" : "inferred",
      skill: status.skill,
      key: status.key,
      estimate: status.observed ? status.p : null,
      independent: status.independent,
      correct: status.correct,
      goal: skillKey(skill),
    }))
    .sort((a, b) => (a.kind === b.kind ? (a.estimate ?? 0.5) - (b.estimate ?? 0.5) : a.kind === "observed" ? -1 : 1));
}

function ancestors(skill) {
  const found = new Map();
  const pending = [skill];
  while (pending.length)
    for (const parent of explicitPrerequisites(pending.pop()))
      if (parent.grade >= 1 && !found.has(skillKey(parent))) { found.set(skillKey(parent), parent); pending.push(parent); }
  return [...found.values()];
}

// Observed performance and inferred diagnosis for one grade, kept in separate lists.
export function diagnosticProfile(tutor, grade, now = Date.now()) {
  const skills = gradeSkills(grade);
  const statuses = skills.map((skill) => skillStatus(tutor, skill, now));
  const byKey = new Map(statuses.map((status) => [status.key, status]));
  const observed = statuses.filter((status) => status.observed).map((status) => ({
    kind: "observed",
    key: status.key,
    title: status.skill.title,
    strand: status.skill.strand,
    estimate: status.p,
    band: band(status),
    answers: status.answers,
    independent: status.independent,
    correct: status.correct,
    lastAt: status.lastAt,
  }));
  const inferred = [];
  const seen = new Set();
  const infer = (skill, status, basis) => {
    if (seen.has(skillKey(skill)) || byKey.get(skillKey(skill))?.observed) return;
    seen.add(skillKey(skill));
    inferred.push({ kind: "inferred", key: skillKey(skill), title: skill.title, strand: skill.strand, status, estimate: null, basis });
  };
  for (const status of statuses.filter((entry) => entry.observed)) {
    const basis = [{ key: status.key, estimate: status.p, independent: status.independent, correct: status.correct }];
    if (isSecure(status)) for (const parent of ancestors(status.skill)) if (parent.grade === grade) infer(parent, "likely-secure", basis);
    if (isStruggling(status)) for (const parent of prerequisites(status.skill)) if (parent.grade === grade) infer(parent, "possible-gap", basis);
  }
  const strands = [...new Set(observed.map((entry) => entry.strand))].map((strand) => {
    const rows = observed.filter((entry) => entry.strand === strand);
    return { kind: "observed", strand, skills: rows.length, estimate: Math.round((rows.reduce((sum, row) => sum + row.estimate, 0) / rows.length) * 1000) / 1000 };
  });
  const checkup = tutor.diagnostics?.[grade];
  return {
    grade,
    observed,
    inferred,
    strands,
    coverage: coverage(tutor, grade, now),
    checkup: checkup ? { kind: "observed", at: checkup.at, passed: Object.keys(checkup.results).filter((key) => checkup.results[key]), missed: Object.keys(checkup.results).filter((key) => !checkup.results[key]) } : null,
  };
}

function coverage(tutor, grade, now) {
  const skills = gradeSkills(grade);
  const covered = skills.filter((skill) => skillStatus(tutor, skill, now).freshIndependent >= DIAGNOSTIC.freshAnswers);
  return { covered: covered.length, total: skills.length, keys: covered.map(skillKey) };
}

// Should the app offer a checkup? Not when recent practice already covers the grade, and never twice in
// a fortnight. `reason` is plain language; `evidence` holds the counts and dates behind it.
export function checkupAdvice(tutor, grade, now = Date.now()) {
  const { covered, total, keys } = coverage(tutor, grade, now);
  const took = tutor.diagnostics?.[grade]?.at || 0;
  if (took && now - took < DIAGNOSTIC.recentCheckupDays * DAY) {
    const date = dateOf(took);
    return { offer: false, reason: t("You took a checkup on {date}, so a new one would mostly repeat it.", { date }), evidence: { kind: "observed", lastCheckupAt: took, covered, total } };
  }
  if (total && covered / total >= DIAGNOSTIC.coveredShare)
    return { offer: false, reason: t("Your practice in the last {days} days already covers {covered} of {total} skills here, so a checkup would repeat what we know.", { days: DIAGNOSTIC.freshDays, covered, total }), evidence: { kind: "observed", covered, total } };
  return {
    offer: true,
    reason: t("{missing} of {total} skills here have no recent independent answers, so a short checkup would help.", { missing: total - covered, total }),
    evidence: { kind: "observed", covered, total, skip: keys },
  };
}

const when = (time) => (time ? t("last practiced {date}", { date: dateOf(time) }) : t("not practiced yet"));

// Plain-language next steps, each citing the real counts and dates behind it.
export function nextSteps(tutor, grade, now = Date.now(), limit = 3) {
  const steps = [];
  for (const skill of gradeSkills(grade)) {
    const status = skillStatus(tutor, skill, now);
    const counts = { independent: status.independent, correct: status.correct, lastAt: status.lastAt, reviewDueAt: status.reviewDueAt, reviewStep: status.reviewStep };
    const cite = `${t("{correct} of {total} independent tries right", { correct: status.correct, total: status.independent })}, ${when(status.lastAt)}`;
    if (isStruggling(status)) {
      const gap = prerequisiteGaps(tutor, skill, now)[0];
      if (gap) {
        const summary = `${skill.title}: ${cite}.`;
        steps.push({
          score: 80 + status.recentMisses,
          skill: gap.skill,
          reason: t("{skill} has been slipping, and {prereq} may be the idea underneath it. A short visit there can help.", { skill: skill.title, prereq: gap.skill.title }),
          evidence: { kind: "inferred", summary, goal: status.key, prerequisite: gap.kind === "observed" ? { kind: "observed", estimate: gap.estimate, independent: gap.independent, correct: gap.correct } : { kind: "inferred" }, ...counts },
        });
        continue;
      }
      steps.push({ score: 60 + (1 - status.p) * 20, skill, reason: t("Only {correct} of {total} independent tries were right. Practice with a model can help.", { correct: status.correct, total: status.independent }), evidence: { kind: "observed", summary: cite, ...counts } });
    } else if (status.due) {
      const late = Math.max(0, Math.floor((now - status.reviewDueAt) / DAY));
      steps.push({
        score: 50 + Math.min(20, late),
        skill,
        reason: t("This is due for review. Reviews come back after 1, 3, 7, 14 and 30 days, and this is step {step} of 5.", { step: status.reviewStep }),
        evidence: { kind: "observed", summary: `${t("review due {date}", { date: dateOf(status.reviewDueAt) })}, ${cite}`, ...counts },
      });
    }
  }
  const seen = new Set();
  return steps
    .sort((a, b) => b.score - a.score)
    .filter((step) => !seen.has(skillKey(step.skill)) && seen.add(skillKey(step.skill)))
    .slice(0, limit)
    .map(({ score: _score, ...step }) => step);
}
