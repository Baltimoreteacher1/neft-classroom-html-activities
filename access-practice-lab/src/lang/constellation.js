// Language Growth Constellation: eleven connected academic-language competencies, each read from the
// existing skill graph (skill-graph.js). A node's state comes only from demonstrated evidence and the same
// mastery rules the skill graph already enforces (>= 3 evidence events over >= 2 activities, independent
// success before "independent"). Finishing an activity never moves a node. It is practice evidence, never a
// WIDA level or score.
import { buildSkillGraph, SKILLS } from "./skill-graph.js";

export const CONSTELLATION_VERSION = "2026-11-05.1";
export const STATES = Object.freeze([
  "not-started",
  "emerging",
  "building",
  "with-support",
  "independent",
]);

/** `needs`: competencies that should reach "building" before this node's harder (stretch) tasks open. */
export const COMPETENCIES = Object.freeze([
  {
    id: "key-info",
    name: "Understanding key information",
    you: "I find the key information",
    skills: [
      "listening.main-idea",
      "listening.supporting-details",
      "reading.main-idea",
      "reading.literal-retrieval",
      "reading.main-detail",
    ],
    needs: [],
  },
  {
    id: "sequence",
    name: "Sequencing events",
    you: "I put events in order",
    skills: ["listening.sequence", "reading.sequence", "listening.directions"],
    needs: ["key-info"],
  },
  {
    id: "relationships",
    name: "Identifying relationships",
    you: "I see how ideas connect",
    skills: ["reading.synthesis", "listening.visual-context", "reading.summarization"],
    needs: ["key-info"],
  },
  {
    id: "causes",
    name: "Explaining causes",
    you: "I explain why things happen",
    skills: ["listening.cause-effect", "reading.cause-effect", "speaking.reasoning"],
    needs: ["relationships"],
  },
  {
    id: "compare",
    name: "Comparing ideas",
    you: "I compare ideas",
    skills: ["listening.comparisons", "reading.compare-sources"],
    needs: ["relationships"],
  },
  {
    id: "vocabulary",
    name: "Using precise vocabulary",
    you: "I choose the exact word",
    skills: [
      "listening.vocabulary-context",
      "reading.vocabulary-context",
      "reading.morphology",
      "speaking.vocabulary",
      "writing.vocabulary",
    ],
    needs: [],
  },
  {
    id: "evidence",
    name: "Using evidence",
    you: "I back up my ideas",
    skills: [
      "reading.evidence",
      "reading.evidence-selection-strategy",
      "speaking.evidence",
      "writing.evidence",
    ],
    needs: ["key-info"],
  },
  {
    id: "discourse",
    name: "Organizing academic discourse",
    you: "I organize what I say and write",
    skills: [
      "speaking.organization",
      "speaking.cohesion",
      "writing.organization",
      "writing.transitions",
    ],
    needs: [],
  },
  {
    id: "elaborate",
    name: "Elaborating explanations",
    you: "I add detail that helps",
    skills: [
      "speaking.details",
      "speaking.sentence-expansion",
      "writing.sentence-expansion",
      "writing.clarity",
    ],
    needs: ["vocabulary", "discourse"],
  },
  {
    id: "argument",
    name: "Constructing arguments",
    you: "I make a claim and prove it",
    skills: [
      "speaking.reasoning",
      "writing.central-idea",
      "writing.explain-evidence",
      "reading.explain-evidence",
    ],
    needs: ["evidence", "causes"],
  },
  {
    id: "independence",
    name: "Communicating independently",
    you: "I do it on my own",
    skills: ["writing.independent-production", "speaking.task", "writing.task"],
    needs: ["discourse"],
  },
]);

/** Edges drawn between nodes: every "needs" link plus none invented. */
export const EDGES = Object.freeze(
  COMPETENCIES.flatMap((c) => c.needs.map((from) => ({ from, to: c.id }))),
);

const RANK = Object.fromEntries(STATES.map((s, i) => [s, i]));
const SKILL_NAME = Object.fromEntries(SKILLS.map((s) => [s.id, s.name]));

function nodeState(rows, { minIndependent = 3 } = {}) {
  const seen = rows.filter((r) => r.evidenceCount > 0);
  if (!seen.length) return "not-started";
  const enough = seen.filter((r) => r.status !== "insufficient");
  if (!enough.length) return "emerging";
  const demonstrated = enough.filter((r) => r.status === "demonstrated").length;
  // Independent only when at least half of the evidenced skills are demonstrated on their own,
  // and the node has at least `minIndependent` independent evidence events in total.
  const independentEvents = seen.reduce((n, r) => n + r.independentEvidenceCount, 0);
  if (demonstrated >= Math.ceil(enough.length / 2) && independentEvents >= minIndependent)
    return "independent";
  if (enough.some((r) => r.status === "supported" || r.status === "demonstrated"))
    return "with-support";
  return "building";
}

function describe(state, rows) {
  const seen = rows.filter((r) => r.evidenceCount > 0);
  const strengths = seen.filter((r) => r.status === "demonstrated").map((r) => SKILL_NAME[r.id]);
  const remaining = seen
    .filter((r) => r.status !== "demonstrated")
    .sort((a, b) => (a.masteryEstimate ?? 0) - (b.masteryEstimate ?? 0))
    .map((r) => SKILL_NAME[r.id]);
  const unseen = rows.filter((r) => !r.evidenceCount).map((r) => SKILL_NAME[r.id]);
  const events = seen.reduce((n, r) => n + r.evidenceCount, 0);
  const responses = new Set(seen.flatMap((r) => r.evidence.map((e) => e.activityId))).size;
  const independent = seen.reduce((n, r) => n + r.independentEvidenceCount, 0);
  const supportedMeans = seen.map((r) => r.supportedMastery).filter((v) => v != null);
  const independentMeans = seen.map((r) => r.independentMastery).filter((v) => v != null);
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  return {
    strengths,
    remaining: remaining.length ? remaining : unseen,
    untouched: unseen,
    evidenceCount: events,
    independentCount: independent,
    // Scaffold dependence: how much more often the learner succeeds with help than alone, when both exist.
    scaffoldGap:
      supportedMeans.length && independentMeans.length
        ? Math.round((avg(supportedMeans) - avg(independentMeans)) * 100) / 100
        : null,
    scaffoldReliance: events ? 1 - independent / events : null,
    recent: seen
      .flatMap((r) =>
        r.evidence
          .slice(0, 2)
          .map((e) => ({
            skill: SKILL_NAME[r.id],
            at: e.createdAt,
            stage: e.independenceLevel,
            activity: e.activityId,
          })),
      )
      .sort((a, b) => String(b.at).localeCompare(String(a.at)))
      .slice(0, 4),
    lastEvidenceAt:
      seen
        .map((r) => r.lastEvidenceAt)
        .filter(Boolean)
        .sort()
        .at(-1) || null,
    sufficiency:
      events === 0 ? "none" : events < 3 ? "limited" : state === "emerging" ? "limited" : "enough",
  };
}

/**
 * Build the nodes. `graph` may be passed when the caller already ran buildSkillGraph.
 * Every node stays open for practice (`open: true`); `stretchUnlocked` only gates the harder tier, and a
 * teacher override opens it regardless.
 */
export function buildConstellation(
  entries = [],
  records = {},
  { graph, options = {}, unlocked = [] } = {},
) {
  const g = graph || buildSkillGraph(entries, records, options);
  const byId = new Map(g.map((s) => [s.id, s]));
  const nodes = COMPETENCIES.map((c) => {
    const rows = c.skills.map((id) => byId.get(id)).filter(Boolean);
    const state = nodeState(rows);
    return {
      id: c.id,
      name: c.name,
      you: c.you,
      needs: c.needs,
      state,
      ...describe(state, rows),
      skills: c.skills,
      open: true,
    };
  });
  const index = new Map(nodes.map((n) => [n.id, n]));
  for (const n of nodes) {
    const blockers = n.needs.filter((id) => RANK[index.get(id).state] < RANK.building);
    n.stretchUnlocked = !blockers.length || unlocked.includes(n.id);
    n.teacherUnlocked = unlocked.includes(n.id);
    n.blockedBy = n.stretchUnlocked ? [] : blockers.map((id) => index.get(id).name);
  }
  return { version: CONSTELLATION_VERSION, nodes, edges: EDGES };
}

/** A plain list of the same nodes: the non-graphical alternative and the screen-reader reading. */
export function constellationOutline(constellation) {
  return constellation.nodes.map((n) => ({
    id: n.id,
    label: n.name,
    state: n.state,
    summary: `${n.name}: ${STATE_WORDS[n.state]}${n.evidenceCount ? `, ${n.evidenceCount} piece${n.evidenceCount === 1 ? "" : "s"} of evidence` : ""}.`,
    stretch: n.stretchUnlocked
      ? "Harder tasks are open."
      : `Harder tasks open after: ${n.blockedBy.join(", ")}.`,
  }));
}

export const STATE_WORDS = Object.freeze({
  "not-started": "no evidence yet",
  emerging: "some evidence, not enough to say yet",
  building: "building",
  "with-support": "shown with support",
  independent: "shown on my own",
});
