// Recommended next skills for the student app: the tutor's own ranking (tutor-engine recommendations) and the
// curriculum path (skill-path nextSkillAfter), checked against prerequisites so a learner is pointed at the
// foundation first when it is shaky, or when a brand-new skill's same-grade foundation has not been met yet.
import { nextSkillAfter } from "../skill-path.js";
import { evidence, prerequisites, recommendations, skillKey } from "../tutor-engine.js";

// Two or more answers, not yet remembered, and under 3 in 4 right on my own: the foundation needs work first.
const shaky = (ev) => ev.recent.length >= 2 && !ev.secure && ev.ratio < 0.75;

export function foundationFor(tutor, skill) {
  const fresh = !evidence(tutor, skill).recent.length;
  for (const pre of prerequisites(skill)) {
    const ev = evidence(tutor, pre);
    if (shaky(ev)) return pre;
    if (fresh && pre.grade === skill.grade && !ev.recent.length) return pre;
  }
  return null;
}

// [{ skill, reason, forSkill? }] — reason is an English key the app translates; forSkill names the skill a
// foundation is for. `after` puts that skill's next step on the path first; `exclude` holds "grade:id" keys.
export function recommendedNext(tutor, grade, { after = null, exclude = [], limit = 3 } = {}) {
  const out = [];
  const seen = new Set(exclude);
  const add = (skill, reason, forSkill = null) => {
    if (!skill || out.length >= limit || seen.has(skillKey(skill))) return;
    const ev = evidence(tutor, skill);
    if (ev.secure && !ev.due) return;
    seen.add(skillKey(skill));
    out.push({ skill, reason, ...(forSkill ? { forSkill } : {}) });
  };
  const consider = (skill, reason) => {
    if (!skill) return;
    const base = foundationFor(tutor, skill);
    if (base) add(base, "Builds the base for", skill);
    else add(skill, reason);
  };
  if (after) consider(nextSkillAfter(after), "Next on your path");
  for (const row of recommendations(tutor, grade)) consider(row.skill, row.reason);
  return out;
}

// Every reason a recommendation can carry, so the Spanish table can be checked against it.
export const REASONS = [
  "Builds the base for",
  "Next on your path",
  "Revisit a tricky idea",
  "Time for a memory refresh",
  "A useful next step from your checkup",
  "Explore something new",
  "Keep this skill fresh",
  "Build independent confidence",
];
