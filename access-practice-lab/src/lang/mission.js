// "My Next Mission": a deterministic choice of what a learner does next, with a decision record a teacher
// can open. Same inputs always give the same mission. No model is called and no score is produced.
import { OFFICIAL_DOMAINS } from "./official-scores.js";
import { KEY_LANGUAGE_USES } from "./klu.js";

export const MISSION_VERSION = "2026-11-05.1";
/** Planning level used only to ORDER domains when a teacher typed an official level. A domain with no result ranks as middle. */
const UNKNOWN_PLANNING_LEVEL = 3.0;

function priority(domain) {
  const level = domain.official ? domain.official.level : UNKNOWN_PLANNING_LEVEL;
  // Lower planning level and thinner evidence come first; a stale domain (no evidence for 21+ days) outranks a fresh one.
  const stale =
    domain.instructional.daysSinceEvidence != null && domain.instructional.daysSinceEvidence >= 21
      ? -0.3
      : 0;
  const evidence = Math.min(domain.instructional.evidenceCount, 10) / 10;
  return level + evidence + stale;
}

/**
 * Choose the next mission. `tasks` is the task list the caller already has (each `{ id, domain, use }`),
 * `due` the number of spaced-review items due, `lastDomain` the domain of the previous mission, which is
 * skipped when another domain has an equal need so a learner is not sent to one skill every session.
 */
export function chooseNextMission({ dna, readiness, tasks = [], due = 0, lastDomain = null } = {}) {
  const rules = [];
  const ranked = [...dna.domains].sort(
    (a, b) =>
      priority(a) - priority(b) ||
      OFFICIAL_DOMAINS.indexOf(a.domain) - OFFICIAL_DOMAINS.indexOf(b.domain),
  );
  let target = ranked[0];
  if (
    lastDomain &&
    target.domain === lastDomain &&
    ranked[1] &&
    priority(ranked[1]) - priority(target) < 0.5
  ) {
    rules.push(
      `${lastDomain} was the last mission and ${ranked[1].domain} has a similar need, so the learner moves to ${ranked[1].domain}.`,
    );
    target = ranked[1];
  }
  rules.push(
    target.official
      ? `${target.domain} is first because its typed official level (${target.official.level}) is the lowest after evidence is considered.`
      : `${target.domain} is first because it has the least evidence and no official result on file.`,
  );

  const focus =
    readiness.recommendations.find(
      (r) => target.support.forms && r.focus && domainOfCompetency(r, target.domain),
    ) ||
    readiness.recommendations[0] ||
    null;
  const klu =
    KEY_LANGUAGE_USES[
      (target.instructional.evidenceCount + OFFICIAL_DOMAINS.indexOf(target.domain)) %
        KEY_LANGUAGE_USES.length
    ];
  const task =
    tasks.find((t) => t.domain === target.domain && t.use === klu) ||
    tasks.find((t) => t.domain === target.domain) ||
    null;
  rules.push(
    task
      ? `Task ${task.id} matches ${target.domain} and the Key Language Use "${task.use}".`
      : `No ${target.domain} task is available in the list given, so only the target is set.`,
  );
  if (due > 0)
    rules.push(
      `${due} earlier item${due === 1 ? " is" : "s are"} due for review, so the session opens with retrieval.`,
    );

  return {
    version: MISSION_VERSION,
    domain: target.domain,
    keyLanguageUse: klu,
    taskId: task ? task.id : null,
    competency: focus ? focus.competency : null,
    support: {
      condition: target.support.condition,
      name: target.support.conditionName,
      forms: target.support.forms,
      complexity: target.support.complexity,
    },
    cognitiveDemand: target.support.cognitiveDemand,
    opensWithRetrieval: due > 0,
    successCriterion: focus
      ? focus.successCriterion
      : "Finish the task, then show what you learned on a second try.",
    // The record a teacher can inspect: inputs that were read, rules that fired, and the order domains were considered.
    decision: {
      rules: [...rules, ...target.support.rules],
      considered: ranked.map((d) => ({
        domain: d.domain,
        priority: Math.round(priority(d) * 100) / 100,
        officialLevel: d.official ? d.official.level : null,
        evidence: d.instructional.evidenceCount,
      })),
      inputs: { due, lastDomain, tasksOffered: tasks.length },
    },
  };
}

const COMPETENCY_DOMAINS = Object.freeze({
  vocabulary: ["Listening", "Reading", "Speaking", "Writing"],
  discourse: ["Speaking", "Writing"],
  elaborate: ["Speaking", "Writing"],
  argument: ["Speaking", "Writing", "Reading"],
  evidence: ["Reading", "Speaking", "Writing"],
  causes: ["Listening", "Reading", "Speaking"],
  independence: ["Speaking", "Writing"],
  "key-info": ["Listening", "Reading"],
  sequence: ["Listening", "Reading"],
  relationships: ["Reading", "Listening"],
  compare: ["Listening", "Reading"],
});
const domainOfCompetency = (rec, domain) =>
  (COMPETENCY_DOMAINS[rec.competency] || []).includes(domain);
