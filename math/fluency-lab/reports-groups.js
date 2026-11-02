// Flexible grouping and intervention suggestions. A group is a list of learners who share one measured gap,
// one recorded answer pattern, a review that is due, or readiness to extend, on one skill, today. A learner can
// sit in several groups and in none; nothing here is stored on a learner or used as a label.
import { mistakeCategoryLabel } from "./mistake-notes.js";
import { reteachTip } from "./reteach-table.js";
import { RULES, byLabel, isStuck } from "./reports-rows.js";
import { t } from "./i18n.js";
import { findSkill, prerequisites, skillKey } from "./tutor-engine.js";

// Every diagnosis keeps what was counted apart from what is guessed from the counts.
export const diagnosis = (observed, inferred) => ({
  observed: { text: observed },
  inferred: { text: inferred, certainty: "possible" },
});

const BASIS_ORDER = ["misconception", "gap", "review", "extend"];
const TIERS = {
  misconception: [1, 2],
  gap: [1, 2],
  review: [2, 3],
  extend: [4, 5],
  trouble: [1, 3],
};
const gradeSkillTitle = (skill) => skill.title;

// A short practice plan a teacher can drop into the assignment builder.
export function interventionFor({ skill, basis, category = null, measuredGap = false }) {
  const foundation = prerequisites(skill)[0] || null;
  return {
    focus: skillKey(skill),
    focusTitle: gradeSkillTitle(skill),
    prerequisite: foundation ? skillKey(foundation) : null,
    prerequisiteTitle: foundation ? foundation.title : null,
    prerequisiteMeasured: Boolean(measuredGap),
    miniLesson: {
      rule: skill.learn.rule,
      steps: [...skill.learn.steps],
      example: skill.learn.example,
      watch: skill.learn.watch,
    },
    reteach: category ? reteachTip(category) : "",
    practice: {
      keys: [skillKey(skill)],
      tiers: TIERS[basis] || TIERS.trouble,
      count: 5,
      mode: basis === "extend" || basis === "review" ? "adaptive" : "guided",
      target: { score: 70, days: 2 },
    },
  };
}

export function buildGroups(rows) {
  const rowFor = new Map(rows.map((row) => [`${row.learnerId}|${row.key}`, row]));
  const pools = new Map();
  const add = (basis, skill, category, row) => {
    const id = [basis, skillKey(skill), category || ""].join(":");
    const pool = pools.get(id) || {
      id,
      basis,
      skill,
      category,
      members: new Map(),
      count: 0,
    };
    pool.members.set(row.learnerId, row.label);
    pool.count += 1;
    pools.set(id, pool);
  };
  for (const row of rows) {
    for (const mistake of row.mistakes)
      if (mistake.category && !mistake.resolvedAt)
        add("misconception", row.skill, mistake.category, row);
    if (isStuck(row)) {
      for (const foundation of prerequisites(row.skill)) {
        const base = rowFor.get(`${row.learnerId}|${skillKey(foundation)}`);
        if (base && base.independent >= RULES.minIndependent && base.ratio < RULES.gapRatio)
          add("gap", foundation, null, row);
      }
    }
    if (row.due && row.score >= 40) add("review", row.skill, null, row);
    if (row.state === "mastered") add("extend", row.skill, null, row);
  }
  const groups = [];
  const individual = [];
  for (const pool of pools.values()) {
    const labels = [...pool.members.values()].sort(byLabel);
    const pattern = pool.category ? mistakeCategoryLabel(pool.category) : "";
    const title = pool.skill.title;
    const text = {
      misconception: [
        t(
          "{n} learners have saved wrong answers on {skill} that match “{pattern}” ({count} answers in all).",
          { n: labels.length, skill: title, pattern, count: pool.count },
        ),
        t(
          "Possible shared pattern: {pattern}. A matching answer can also be a slip, so look at their work before reteaching.",
        ),
      ],
      gap: [
        t(
          "{n} learners are under 75% correct on {skill} and under 60% correct on a skill that builds on it.",
          { n: labels.length, skill: title },
        ),
        t(
          "Possible gap: the later skill may be hard because {skill} is not yet secure. Test it with a short check first.",
          { skill: title },
        ),
      ],
      review: [
        t("{n} learners have a scheduled review due on {skill}.", {
          n: labels.length,
          skill: title,
        }),
        t("Possible: a short retrieval check will show whether the skill has held."),
      ],
      extend: [
        t("{n} learners are at the mastered level on {skill}.", { n: labels.length, skill: title }),
        t("Possible: ready for harder tiers or a transfer task. Check with one new problem."),
      ],
    }[pool.basis];
    const inferred = text[1].replaceAll("{pattern}", pattern);
    const entry = {
      id: pool.id,
      basis: pool.basis,
      skillKey: skillKey(pool.skill),
      skill: pool.skill,
      category: pool.category,
      learners: labels,
      count: pool.count,
      ...diagnosis(text[0], inferred),
      intervention: interventionFor({
        skill: pool.skill,
        basis: pool.basis,
        category: pool.category,
        measuredGap: pool.basis === "gap",
      }),
    };
    if (labels.length >= 2) groups.push(entry);
    else if (pool.basis === "misconception" || pool.basis === "gap") individual.push(entry);
  }
  const order = (a, b) =>
    b.learners.length - a.learners.length ||
    BASIS_ORDER.indexOf(a.basis) - BASIS_ORDER.indexOf(b.basis) ||
    a.id.localeCompare(b.id);
  return { groups: groups.sort(order), individual: individual.sort(order) };
}

// Group the class by where they are on ONE skill right now. Bands are today's scores, never a learner label.
export function levelGroups(rows, key) {
  const skill = findSkill(key);
  if (!skill) return null;
  const mine = rows.filter((row) => row.key === key);
  const band = (test) =>
    mine
      .filter(test)
      .map((row) => row.label)
      .sort(byLabel);
  const bands = [
    { id: "support", learners: band((row) => row.score < 40), range: "0-39" },
    { id: "building", learners: band((row) => row.score >= 40 && row.score < 70), range: "40-69" },
    { id: "extend", learners: band((row) => row.score >= 70), range: "70-100" },
  ];
  return {
    key,
    skill,
    bands,
    ...diagnosis(
      t("{n} learners have saved evidence on {skill}. Bands use their current score.", {
        n: mine.length,
        skill: skill.title,
      }),
      t(
        "Possible: today's bands can change after the next practice. They describe this skill only.",
      ),
    ),
  };
}
