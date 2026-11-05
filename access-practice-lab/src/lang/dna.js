// Language DNA: one record per domain that keeps THREE things apart and never blends them.
//   official      what a teacher typed from the ACCESS score report (decimals kept, never rounded)
//   instructional what the learner has actually shown in this lab (skill graph evidence)
//   support       the starting support condition and complexity the lab will use next, with the rules fired
// An official level only sets where practice STARTS in a domain. Once there is enough demonstrated evidence
// the evidence moves the condition (one step per rule), and the official number is left exactly as typed.
// Nothing here is a WIDA level, a score or a prediction of one.
import { OFFICIAL_DOMAINS, growth } from "./official-scores.js";
import { SKILLS } from "./skill-graph.js";

export const DNA_VERSION = "2026-11-05.1";

/** ACCESS reset its scale scores for 2025-26 (WIDA, "What to know: WIDA assessments in the 2025-2026 school year"). */
export const SCALE_RESET_YEAR = "2025-26";
/** Levels reported for the first post-reset year still used the 2016 cut scores; new cut scores follow July 2026. */
export const PROVISIONAL_LEVEL_YEARS = Object.freeze(["2025-26"]);

/** The four support conditions, least to most independent. `ledger` maps to the ledger's three stages. */
export const CONDITIONS = Object.freeze([
  { id: "modeled", ledger: "guided", name: "Full modeling", you: "We do it together first" },
  {
    id: "partial",
    ledger: "supported",
    name: "Partial scaffolding",
    you: "I get a frame and a word bank",
  },
  { id: "minimal", ledger: "supported", name: "Minimal prompting", you: "I get one hint if I ask" },
  {
    id: "independent",
    ledger: "independent",
    name: "Independent response",
    you: "I do it on my own",
  },
]);

/** Thresholds are configuration: change them here, and `tools/access-dna.test.mjs` shows the effect. */
export const DNA_CONFIG = Object.freeze({
  startBands: Object.freeze([
    { below: 2.5, condition: 0, complexity: "single clear sentences about familiar things" },
    { below: 3.5, condition: 1, complexity: "short connected sentences with linking words" },
    { below: 4.5, condition: 2, complexity: "a paragraph with several supporting details" },
    { below: 6.01, condition: 2, complexity: "extended, precise academic language" },
  ]),
  minEvidence: 3, // domain evidence events before demonstrated work may move the condition
  fadeAt: 0.7, // independent mean at or above this, with enough independent events, fades one step
  supportAt: 0.4, // overall mean below this adds one step of support
  minIndependent: 3,
});

/** Domain-specific forms the support takes. The cognitive demand is the same in every domain and condition. */
const MODES = Object.freeze({
  Listening: {
    modeled: ["replayable audio with a picture of the scene", "pause points with a question each"],
    partial: ["audio with a listening guide to fill in", "replay allowed"],
    minimal: ["one listen, one replay on request"],
    independent: ["one listen, then answer"],
  },
  Speaking: {
    modeled: [
      "hear a model first",
      "say it with a sentence frame",
      "re-record as many times as I like",
    ],
    partial: ["sentence frame and word bank", "record, listen back, re-record"],
    minimal: ["planning notes only", "record once, then revise if I choose"],
    independent: ["no frame, no bank", "record my best take"],
  },
  Reading: {
    modeled: ["text read aloud with key words glossed", "highlight evidence together"],
    partial: ["glossary and a question guide", "reread with a purpose"],
    minimal: ["glossary on request"],
    independent: ["no glossary, no guide"],
  },
  Writing: {
    modeled: ["a model paragraph and a sentence frame", "build the sentence from word cards"],
    partial: ["sentence frame and word bank", "evidence cards to choose from"],
    minimal: ["a planning organizer only"],
    independent: ["blank page and the prompt"],
  },
});

export const COGNITIVE_DEMAND =
  "grade-level reasoning (explain, compare, argue from evidence), never reduced for language support";

const clampCondition = (i) => Math.max(0, Math.min(CONDITIONS.length - 1, i));
const round1 = (n) => Math.round(n * 10) / 10;

/** The year a result belongs to is "2025-26" style; true when scale scores on either side of the reset are being compared. */
export function comparability(yearA, yearB) {
  const [a, b] = [yearA, yearB].sort();
  const crossesReset = a < SCALE_RESET_YEAR && b >= SCALE_RESET_YEAR;
  const provisional = [yearA, yearB].filter((y) => PROVISIONAL_LEVEL_YEARS.includes(y));
  return {
    scaleScores: crossesReset ? "not-comparable" : "comparable",
    levels: crossesReset || provisional.length ? "interpret-with-caution" : "comparable",
    note: crossesReset
      ? `${a} and ${b} fall on different sides of the ${SCALE_RESET_YEAR} scale reset. Do not treat the scale scores as equivalent; read the change in reported levels with caution.`
      : provisional.length
        ? `${provisional.join(", ")} levels were reported with the 2016 cut scores, before the 2026 standard setting. Check the score report.`
        : "",
  };
}

export function startingCondition(level) {
  if (level == null) return null;
  const band = DNA_CONFIG.startBands.find((b) => level < b.below) || DNA_CONFIG.startBands.at(-1);
  return { condition: band.condition, complexity: band.complexity };
}

function officialFor(domain, results) {
  const rows = (Array.isArray(results) ? results : [])
    .filter((r) => r.levels?.[domain] != null)
    .sort((a, b) => a.year.localeCompare(b.year));
  if (!rows.length) return null;
  const latest = rows.at(-1);
  const prior = rows.at(-2) || null;
  return {
    level: latest.levels[domain], // kept as typed, e.g. 2.4
    year: latest.year,
    source: "official-typed",
    provisionalCutScores: PROVISIONAL_LEVEL_YEARS.includes(latest.year),
    priorLevel: prior ? prior.levels[domain] : null,
    priorYear: prior ? prior.year : null,
    comparability: prior ? comparability(prior.year, latest.year) : null,
  };
}

function instructionalFor(domain, graph, now) {
  const skills = graph.filter((s) => s.domain === domain);
  const seen = skills.filter((s) => s.evidenceCount > 0);
  const events = seen.reduce((n, s) => n + s.evidenceCount, 0);
  const independentEvents = seen.reduce((n, s) => n + s.independentEvidenceCount, 0);
  // One response yields several skill events, so sufficiency counts distinct responses, never skill events.
  const responses = new Set(seen.flatMap((s) => s.evidence.map((e) => e.activityId)));
  const independentResponses = new Set(seen.flatMap((s) => s.evidence.filter((e) => e.independenceLevel === "independent").map((e) => e.activityId)));
  const mean = (key) => {
    const v = seen.map((s) => s[key]).filter((x) => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const independentMean = mean("independentMastery");
  const supportedMean = mean("supportedMastery");
  const overallMean = mean("masteryEstimate");
  const lastAt =
    seen
      .map((s) => s.lastEvidenceAt)
      .filter(Boolean)
      .sort()
      .at(-1) || null;
  const ranked = seen
    .filter((s) => s.status !== "demonstrated")
    .sort((a, b) => (a.masteryEstimate ?? 0) - (b.masteryEstimate ?? 0));
  const unseen = skills.filter((s) => !s.evidenceCount);
  return {
    evidenceCount: events,
    responseCount: responses.size,
    independentResponseCount: independentResponses.size,
    independentEvidenceCount: independentEvents,
    independenceShare: events ? independentEvents / events : null,
    independentMean: independentMean == null ? null : round1(independentMean * 100) / 100,
    supportedMean: supportedMean == null ? null : round1(supportedMean * 100) / 100,
    overallMean,
    scaffoldGap:
      independentMean != null && supportedMean != null
        ? Math.round((supportedMean - independentMean) * 100) / 100
        : null,
    strengths: seen
      .filter((s) => s.status === "demonstrated")
      .map((s) => ({ id: s.id, name: s.name })),
    priorities: [...ranked, ...unseen]
      .slice(0, 3)
      .map((s) => ({ id: s.id, name: s.name, seen: s.evidenceCount > 0 })),
    recent: seen
      .flatMap((s) =>
        s.evidence
          .slice(0, 2)
          .map((e) => ({ skill: s.name, at: e.createdAt, stage: e.independenceLevel })),
      )
      .sort((a, b) => String(b.at).localeCompare(String(a.at)))
      .slice(0, 3),
    lastEvidenceAt: lastAt,
    daysSinceEvidence: lastAt ? Math.floor((now - Date.parse(lastAt)) / 864e5) : null,
    sufficiency: responses.size >= DNA_CONFIG.minEvidence ? "enough" : responses.size ? "limited" : "none",
  };
}

/**
 * Decide the support condition for one domain. Returns the condition plus every rule that fired, so a
 * teacher can see why a task was set the way it was. `override` is a teacher's choice and is applied last.
 */
export function decideSupport(domain, official, instructional, override = null) {
  const rules = [];
  const start = official ? startingCondition(official.level) : null;
  let index;
  let complexity;
  if (start) {
    index = start.condition;
    complexity = start.complexity;
    rules.push(
      `Official ${domain} level ${official.level} (${official.year}) sets the starting condition: ${CONDITIONS[index].name}.`,
    );
  } else {
    index = 1;
    complexity = DNA_CONFIG.startBands[1].complexity;
    rules.push(
      `No official ${domain} result is on file, so practice starts at ${CONDITIONS[index].name} until the lab has evidence.`,
    );
  }
  let basis = official ? "official-start" : "default";
  if (instructional.sufficiency === "enough") {
    basis = "demonstrated";
    if (
      instructional.independentResponseCount >= DNA_CONFIG.minIndependent &&
      instructional.independentMean >= DNA_CONFIG.fadeAt
    ) {
      index += 1;
      complexity = "more demanding language than before (longer, more precise, less scaffolded)";
      rules.push(
        `${instructional.independentResponseCount} independent responses averaging ${Math.round(instructional.independentMean * 100)}% move support one step toward independence.`,
      );
    } else if (
      instructional.overallMean != null &&
      instructional.overallMean < DNA_CONFIG.supportAt
    ) {
      index -= 1;
      rules.push(
        `Evidence averages ${Math.round(instructional.overallMean * 100)}%, so support steps up. The task keeps its reasoning demand.`,
      );
    } else {
      rules.push("Demonstrated evidence does not yet justify a change, so the condition stays.");
    }
  } else {
    rules.push(
      instructional.evidenceCount
        ? `Only ${instructional.evidenceCount} evidence event${instructional.evidenceCount === 1 ? "" : "s"} in ${domain}. That is not enough to move the condition.`
        : `No ${domain} evidence yet.`,
    );
  }
  index = clampCondition(index);
  let overridden = null;
  if (override?.condition) {
    const i = CONDITIONS.findIndex((c) => c.id === override.condition);
    if (i >= 0) {
      index = i;
      overridden = { by: "teacher", note: override.note || "", at: override.at || null };
      rules.push(
        `Teacher set the condition to ${CONDITIONS[i].name}${override.note ? `: ${override.note}` : ""}.`,
      );
    }
  }
  const condition = CONDITIONS[index];
  return {
    condition: condition.id,
    conditionName: condition.name,
    you: condition.you,
    ledgerStage: condition.ledger,
    complexity,
    cognitiveDemand: COGNITIVE_DEMAND,
    forms: MODES[domain][condition.id],
    basis,
    overridden,
    rules,
  };
}

/**
 * The learner's four-domain record. `official` is the list from official-scores.js (typed by a teacher),
 * `graph` the skill graph, `overrides` a map { Domain: { condition, note, at } }.
 */
export function buildLanguageDna({
  official = [],
  graph = [],
  overrides = {},
  now = Date.now(),
} = {}) {
  const domains = OFFICIAL_DOMAINS.map((domain) => {
    const off = officialFor(domain, official);
    const instructional = instructionalFor(domain, graph, now);
    const support = decideSupport(domain, off, instructional, overrides[domain]);
    return { domain, official: off, instructional, support };
  });
  return {
    version: DNA_VERSION,
    domains,
    officialGrowth: growth(official),
    hasOfficial: domains.some((d) => d.official),
  };
}

export const DOMAIN_SKILL_COUNT = Object.freeze(
  Object.fromEntries(OFFICIAL_DOMAINS.map((d) => [d, SKILLS.filter((s) => s.domain === d).length])),
);
