// Adaptive starting-point checkup. The session is a queue the app walks one entry at a time; after every answer
// recordCheckupAnswer() may insert or drop upcoming entries, so the checkup changes with the learner's work:
//   - a first miss never counts on its own: the same skill gets one fresh "second look" item;
//   - two misses on a skill mark it as a gap and probe one foundation skill (any earlier grade), at most
//     MAX_FOUNDATION_PROBES per checkup, following a missed foundation back one more step;
//   - "I'm not sure yet" is evidence of nothing: no credit, no second look, and it is never reported as a gap;
//   - a first-try pass on a skill skips its untested same-grade prerequisites, which are reported as
//     "inferred" and never credited as passes.
// This is a transparent decision rule over a handful of items, not a validated psychometric instrument.
import {
  diagnosticPlan,
  explicitPrerequisites,
  findSkill,
  prerequisites,
  skillKey,
} from "./tutor-engine.js";

export const PURPOSE = Object.freeze({
  initial: "Starting-point checkup",
  second: "Second look",
  foundation: "Foundation check",
});
export const MAX_FOUNDATION_PROBES = 2;

// Authored same-grade ancestors of a skill, transitively. Only authored edges are used: the generator-based
// fallback in prerequisites() is fine for suggesting a foundation, not for crediting unseen skills.
function sameGradeAncestors(skill) {
  const found = new Set();
  const pending = [skill];
  while (pending.length) {
    for (const parent of explicitPrerequisites(pending.pop())) {
      if (parent.grade !== skill.grade || found.has(skillKey(parent))) continue;
      found.add(skillKey(parent));
      pending.push(parent);
    }
  }
  return found;
}

// Harder skills first, so one first-try pass can retire the easier skills it builds on. Ties keep curriculum order.
export function checkupPlan(grade) {
  return diagnosticPlan(grade)
    .map((entry, index) => ({ entry, index, depth: sameGradeAncestors(findSkill(entry.key)).size }))
    .sort((a, b) => b.depth - a.depth || a.index - b.index)
    .map(({ entry }) => ({ ...entry, purpose: PURPOSE.initial }));
}

export const emptyCheckup = () => ({
  recovered: [],
  gaps: [],
  inferred: [],
  unsure: [],
  foundations: {},
  probed: [],
});

// Call after the session has advanced `answered`, with the answered entry at queue[answered - 1].
export function recordCheckupAnswer(session, key, correct, { unsure = false } = {}) {
  const checkup = (session.checkup ||= emptyCheckup());
  const purpose = session.queue[session.answered - 1]?.purpose || PURPOSE.initial;
  const skill = findSkill(key);
  const insert = (entry) => {
    session.queue.splice(session.answered, 0, entry);
    session.target += 1;
  };
  const covered = (candidate) => {
    const candidateKey = skillKey(candidate);
    return (
      candidateKey in session.diagnosticResults ||
      candidateKey in checkup.foundations ||
      session.queue.slice(session.answered).some((entry) => entry.key === candidateKey)
    );
  };
  const probeFoundation = (from) => {
    if (checkup.probed.length >= MAX_FOUNDATION_PROBES) return;
    const next = prerequisites(from).find(
      (candidate) => skillKey(candidate) !== skillKey(from) && !covered(candidate),
    );
    if (!next) return;
    checkup.probed.push(skillKey(next));
    insert({
      key: skillKey(next),
      purpose: PURPOSE.foundation,
      reason: "A short look at an earlier idea this builds on.",
    });
  };

  if (unsure) {
    checkup.unsure.push(key);
    if (purpose !== PURPOSE.foundation) session.diagnosticResults[key] = false;
  } else if (purpose === PURPOSE.foundation) {
    checkup.foundations[key] = correct;
    if (!correct) probeFoundation(skill);
  } else if (purpose === PURPOSE.second) {
    session.diagnosticResults[key] = correct;
    if (correct) checkup.recovered.push(key);
    else {
      checkup.gaps.push(key);
      probeFoundation(skill);
    }
  } else if (correct) {
    session.diagnosticResults[key] = true;
    for (const ancestor of sameGradeAncestors(skill)) {
      const at = session.queue.findIndex(
        (entry, index) =>
          index >= session.answered && entry.key === ancestor && entry.purpose === PURPOSE.initial,
      );
      if (at < 0) continue;
      session.queue.splice(at, 1);
      session.target -= 1;
      checkup.inferred.push(ancestor);
    }
  } else {
    insert({
      key,
      purpose: PURPOSE.second,
      reason: "One miss is not enough to decide. Here is a fresh one.",
    });
  }
}

// What the learner sees at the end: evidence-grouped, no grade level, no score.
export function checkupSummary(session) {
  const checkup = session.checkup || emptyCheckup();
  const titles = (keys) => keys.map((key) => findSkill(key)?.title).filter(Boolean);
  const solid = Object.entries(session.diagnosticResults)
    .filter(([key, ok]) => ok && !checkup.recovered.includes(key))
    .map(([key]) => key);
  return {
    solid: titles(solid),
    secondLook: titles(checkup.recovered),
    gaps: titles(checkup.gaps),
    unsure: titles(checkup.unsure),
    inferred: titles(checkup.inferred),
    foundationGaps: Object.entries(checkup.foundations)
      .filter(([, ok]) => !ok)
      .map(([key]) => findSkill(key))
      .filter(Boolean),
  };
}
