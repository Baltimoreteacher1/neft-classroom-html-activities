// Language Growth Forecast: what a learner looks ready to practice next, read from the constellation.
// It forecasts PRACTICE READINESS, not an ACCESS score. Every recommendation carries the seven parts the
// lab promises (evidence, competency, interpretation, task, scaffold, success criterion, re-evaluation)
// and says plainly when the evidence is not enough to recommend anything.
import { COMPETENCIES, STATE_WORDS } from "./constellation.js";

export const READINESS_VERSION = "2026-11-05.1";

/** Task kinds the lab can set. Each names the interactive tool that carries it. */
export const TASK_KINDS = Object.freeze({
  checkpoint: "a short checkpoint with two different tasks",
  "sentence-architecture": "build and expand a sentence from parts",
  "evidence-builder": "choose and connect evidence to a claim",
  "language-upgrade": "improve a response with detail, precision and cohesion",
  transfer: "show the same skill in a new context",
  independence: "a new task with no supports",
});

const RULES = Object.freeze({
  emerging: {
    task: "checkpoint",
    scaffold: "partial",
    interpretation: (n) =>
      `There is some evidence for "${n.name.toLowerCase()}", but not enough to say how secure it is.`,
    criterion: "Complete two different tasks that use this skill, on two different days.",
    reevaluate: "After two more pieces of evidence on different tasks.",
  },
  building: {
    task: "sentence-architecture",
    scaffold: "partial",
    interpretation: (n) =>
      `"${n.name}" is being built. Success so far needs the frame or the word bank.`,
    criterion: "Three first tries that work with only a word bank, over two days.",
    reevaluate: "After three more first attempts.",
  },
  "with-support": {
    task: "evidence-builder",
    scaffold: "minimal",
    interpretation: (n) =>
      `"${n.name}" works when support is open. The next step is to find out whether it holds with less.`,
    criterion:
      "An attempt on a new prompt with one hint available that scores at least 70% on the first try.",
    reevaluate: "After the next independent attempt, and again after two more.",
  },
  independent: {
    task: "transfer",
    scaffold: "independent",
    interpretation: (n) =>
      `"${n.name}" has been shown on its own. The useful next step is a harder or different context.`,
    criterion: "The same skill shown with no supports in a context the learner has not seen.",
    reevaluate: "After two transfer attempts in different contexts.",
  },
});

/**
 * One recommendation per competency worth acting on, strongest need first, at most `n`.
 * Returns `{ recommendations, insufficient }`: competencies with no evidence are listed, never guessed at.
 */
export function buildReadiness(constellation, { n = 3 } = {}) {
  const order = ["with-support", "building", "emerging", "independent"];
  const recs = [];
  const insufficient = [];
  for (const node of constellation.nodes) {
    if (node.state === "not-started") {
      insufficient.push({
        competency: node.id,
        name: node.name,
        statement: `No evidence for "${node.name.toLowerCase()}" yet, so there is nothing to forecast.`,
      });
      continue;
    }
    const rule = RULES[node.state];
    if (!rule) continue;
    recs.push({
      competency: node.id,
      name: node.name,
      state: node.state,
      evidence: [
        `${node.evidenceCount} piece${node.evidenceCount === 1 ? "" : "s"} of evidence, ${node.independentCount} shown on my own`,
        ...node.recent
          .slice(0, 2)
          .map((r) => `${r.skill} (${r.stage || "supported"}) on ${String(r.at).slice(0, 10)}`),
      ],
      interpretation: rule.interpretation(node),
      task: { kind: rule.task, description: TASK_KINDS[rule.task] },
      scaffold: rule.scaffold,
      successCriterion: rule.criterion,
      reevaluation: rule.reevaluate,
      sufficiency: node.sufficiency,
      stateWords: STATE_WORDS[node.state],
      stretchOpen: node.stretchUnlocked,
      focus: node.remaining[0] || null,
    });
  }
  recs.sort(
    (a, b) =>
      order.indexOf(a.state) - order.indexOf(b.state) || b.evidence.length - a.evidence.length,
  );
  return {
    version: READINESS_VERSION,
    recommendations: recs.slice(0, n),
    insufficient,
    competencies: COMPETENCIES.length,
  };
}
