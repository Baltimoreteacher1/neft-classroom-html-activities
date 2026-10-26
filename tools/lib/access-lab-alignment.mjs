// A provenance-aware instructional coverage index for the ACCESS Practice Lab.
// Existing activity focus tags are local author metadata, not WIDA crosswalks.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { allActivities, CONTENT_DIR } from "./access-lab-content.mjs";

const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
const STANDARD_CODES = new Set(["ELD-SI", "ELD-LA", "ELD-MA", "ELD-SC", "ELD-SS"]);
const arrays = (value) =>
  Array.isArray(value) ? value.filter((x) => typeof x === "string" && x.trim()) : [];
const strings = (...values) => [...new Set(values.flatMap(arrays))];

export function suggestLanguageFunction(text, keyUse = "") {
  const s = `${text} ${keyUse}`.toLowerCase();
  if (/cause.?and.?effect|cause|effect|why something happens|\bwhy\b|because|consequence/.test(s))
    return "Explain cause and effect";
  if (/compare|contrast|similar|different/.test(s)) return "Compare or contrast";
  if (/claim|argu|persuad|counterclaim|position/.test(s) || keyUse === "Argue")
    return "Make and support a claim";
  if (/sequence|order|retell|narrat|recount|first.*then/.test(s) || keyUse === "Narrate")
    return "Sequence events or retell";
  if (/summar|main idea|central idea/.test(s)) return "Summarize a main idea";
  if (/classif|categor|group/.test(s)) return "Classify information";
  if (keyUse === "Explain") return "Explain a process or relationship";
  if (keyUse === "Inform") return "Present factual information";
  return "";
}

function clustersFor(band) {
  if (band === "6-8") return { candidates: ["6-8"], basis: "local-band-match" };
  if (band === "3-5")
    return { candidates: ["2-3", "4-5"], basis: "local-band-spans-two-WIDA-clusters" };
  return { candidates: [], basis: "integrated-task-spans-bands" };
}

function makeRecord({
  id,
  title,
  band,
  domains,
  sourceType,
  sourceFile,
  taskType,
  supportTier = "",
  contentArea = "",
  keyUses = [],
  standards = [],
  languageExpectations = [],
  functions = [],
  features = [],
  dimensions = [],
  sentenceComplexity = "",
  discourseOrganization = "",
  academicVocabulary = [],
  taskComplexity = "",
  localFocus = [],
  scaffolds = [],
  responseDemand = "",
}) {
  const cluster = clustersFor(band);
  const explicitFunctions = strings(functions);
  const focusText = [title, ...localFocus].join(" ");
  const candidateFunction =
    explicitFunctions[0] || suggestLanguageFunction(focusText, keyUses[0] || "");
  const gaps = [];
  if (!contentArea) gaps.push("academic-context");
  if (!keyUses.length) gaps.push("key-language-use");
  if (!standards.length) gaps.push("eld-standard");
  if (!languageExpectations.length) gaps.push("language-expectation");
  if (!candidateFunction) gaps.push("language-function");
  if (!features.length) gaps.push("language-features");
  if (!sentenceComplexity) gaps.push("sentence-complexity");
  if (!discourseOrganization) gaps.push("discourse-organization-and-cohesion");
  if (!academicVocabulary.length) gaps.push("academic-vocabulary");
  if (!taskComplexity) gaps.push("task-complexity");
  return {
    id,
    title,
    localGradeBand: band || "Integrated",
    gradeClusterCandidates: cluster.candidates,
    gradeClusterBasis: cluster.basis,
    domains: strings(domains).filter((d) => DOMAINS.includes(d)),
    sourceType,
    sourceFile,
    taskType: taskType || "",
    localSupportTier: supportTier || "Not tagged",
    academicContext: contentArea || "",
    keyUses,
    eldStandards: standards.filter((s) => STANDARD_CODES.has(s)),
    languageExpectations,
    languageFunctions: explicitFunctions,
    suggestedLanguageFunction: candidateFunction,
    functionStatus: explicitFunctions.length
      ? "author-tagged-needs-review"
      : candidateFunction
        ? "suggested-from-local-title-or-focus"
        : "untagged",
    languageFeatures: strings(features),
    languageDimensions: strings(dimensions),
    sentenceComplexity,
    discourseOrganization,
    academicVocabulary: strings(academicVocabulary),
    taskComplexity,
    localLanguageFocus: strings(localFocus),
    scaffoldAvailability: strings(scaffolds),
    responseDemand: responseDemand || "Not tagged",
    alignmentStatus: languageExpectations.length
      ? "expectation-tag-needs-review"
      : standards.length && keyUses.length
        ? "partial-author-tags-needs-review"
        : "local-focus-only-needs-review",
    metadataGaps: gaps,
    alignmentWarning:
      "Local instructional metadata is not an official WIDA alignment. No Language Expectation is verified for this record.",
  };
}

function readJson(root, rel) {
  const path = join(root, rel);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

function activityRecords(root) {
  return allActivities(root).map(({ band, domain, level, activity: a }) => {
    const d = readJson(root, `g${band}/${domain}.json`);
    const tier = d?.levels?.[level]?.tier?.name || level;
    const scaffolds = [];
    if (arrays(a.frames).length) scaffolds.push("sentence-frames");
    if (arrays(a.vocabulary).length) scaffolds.push("vocabulary-preview");
    if (a.model || a.exemplar) scaffolds.push("model-response");
    if (a.audio || a.script || a.dialogue) scaffolds.push("audio-or-script");
    return makeRecord({
      id: a.id,
      title: a.title,
      band,
      domains: [domain],
      sourceType: "activity-bank",
      sourceFile: relative(root, join(root, `g${band}/${domain}.json`)),
      taskType: a.type,
      supportTier: tier,
      contentArea: a.contentArea,
      keyUses: a.keyUses || (a.keyUse ? [a.keyUse] : []),
      standards: a.standards,
      languageExpectations: a.languageExpectations,
      functions: a.languageFunctions || a.functions,
      features: a.languageFeatures || a.features,
      dimensions: a.dimensions,
      sentenceComplexity: a.sentenceComplexity,
      discourseOrganization: a.discourseOrganization,
      academicVocabulary: (a.vocabulary || []).map((v) => (Array.isArray(v) ? v[0] : v)),
      taskComplexity: a.taskComplexity,
      localFocus: [a.skill, ...arrays(a.wida)],
      scaffolds,
      responseDemand: a.responseDemand || a.type,
    });
  });
}

function studioRecords(root) {
  const out = [];
  for (const [file, domain, taskType] of [
    ["studio/speaking.json", "Speaking", "speaking-studio"],
    ["studio/writing.json", "Writing", "writing-studio"],
  ]) {
    const data = readJson(root, file);
    for (const task of data?.tasks || []) {
      const scaffolds = [];
      if (task.vocab?.length || task.sourceTerms?.length) scaffolds.push("vocabulary-preview");
      if (task.organizer || task.planner) scaffolds.push("organizer");
      if (task.stages?.some?.((s) => /frame/i.test(JSON.stringify(s))))
        scaffolds.push("sentence-frames");
      out.push(
        makeRecord({
          id: task.id,
          title: task.title,
          band: task.band,
          domains: [domain],
          sourceType: "studio",
          sourceFile: relative(root, join(root, file)),
          taskType: task.taskType || task.form || taskType,
          contentArea: task.contentArea,
          keyUses: task.keyUse ? [task.keyUse] : [],
          standards: task.standards,
          languageExpectations: task.languageExpectations,
          functions: task.languageFunctions || task.functions,
          features: task.languageFeatures || task.features,
          dimensions: task.dimensions,
          sentenceComplexity: task.sentenceComplexity,
          discourseOrganization: task.discourseOrganization,
          academicVocabulary: [...(task.vocab || []), ...(task.sourceTerms || [])],
          taskComplexity: task.taskComplexity,
          localFocus: [task.prompt, task.scenario],
          scaffolds,
          responseDemand: taskType,
        }),
      );
    }
  }
  return out;
}

function missionRecords(root) {
  const dir = join(root, "missions");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((file) => {
      const m = JSON.parse(readFileSync(join(dir, file), "utf8"));
      const domains = strings((m.phases || []).map((p) => p.skill));
      const scaffolds = [];
      if (m.vocab?.length) scaffolds.push("vocabulary-preview");
      if (Object.values(m.sources || {}).some((s) => s.transcript || s.audio))
        scaffolds.push("audio-or-script");
      return makeRecord({
        id: m.id,
        title: m.title,
        band: m.band,
        domains: domains.length ? domains : DOMAINS,
        sourceType: "integrated-mission",
        sourceFile: relative(root, join(dir, file)),
        taskType: "four-domain-mission",
        contentArea: m.contentArea,
        keyUses: m.keyUses,
        standards: m.standards,
        languageExpectations: m.languageExpectations,
        functions: m.languageFunctions || m.functions,
        features: m.languageFeatures || m.features,
        dimensions: m.dimensions,
        sentenceComplexity: m.sentenceComplexity,
        discourseOrganization: m.discourseOrganization,
        academicVocabulary: m.vocab || [],
        taskComplexity: m.taskComplexity,
        localFocus: [m.summary, ...(m.phases || []).map((p) => p.skill)],
        scaffolds,
        responseDemand: "Integrated listening, reading, speaking and writing",
      });
    });
}

export function buildAlignmentIndex(root = CONTENT_DIR) {
  const records = [...activityRecords(root), ...studioRecords(root), ...missionRecords(root)];
  const count = (test) => records.filter(test).length;
  const counts = {
    total: records.length,
    activityBank: count((r) => r.sourceType === "activity-bank"),
    studios: count((r) => r.sourceType === "studio"),
    missions: count((r) => r.sourceType === "integrated-mission"),
    explicitStandards: count((r) => r.eldStandards.length > 0),
    explicitKeyUses: count((r) => r.keyUses.length > 0),
    explicitExpectations: count((r) => r.languageExpectations.length > 0),
    needsReview: count((r) => r.metadataGaps.length > 0),
  };
  const keyUseCounts = Object.fromEntries(
    ["Narrate", "Inform", "Explain", "Argue"].map((use) => [
      use,
      Object.fromEntries(
        DOMAINS.map((domain) => [
          domain,
          count((r) => r.keyUses.includes(use) && r.domains.includes(domain)),
        ]),
      ),
    ]),
  );
  const standardCounts = Object.fromEntries(
    [...STANDARD_CODES].map((standard) => [
      standard,
      Object.fromEntries(
        DOMAINS.map((domain) => [
          domain,
          count((r) => r.eldStandards.includes(standard) && r.domains.includes(domain)),
        ]),
      ),
    ]),
  );
  return {
    schema: 1,
    framework: "WIDA ELD Standards Framework, 2020 Edition",
    provenance:
      "Generated from author-entered local practice metadata. Suggested functions are search aids only. No generated record is an official or verified WIDA crosswalk.",
    localBandMapping: {
      "3-5": {
        gradeClusterCandidates: ["2-3", "4-5"],
        status: "ambiguous-until-learner-grade-is-known",
      },
      "6-8": { gradeClusterCandidates: ["6-8"], status: "band-match" },
    },
    counts,
    byGradeBand: Object.fromEntries(
      ["3-5", "6-8", "Integrated"].map((band) => [band, count((r) => r.localGradeBand === band)]),
    ),
    byDomain: Object.fromEntries(
      DOMAINS.map((domain) => [domain, count((r) => r.domains.includes(domain))]),
    ),
    keyUseCounts,
    standardCounts,
    records,
  };
}
