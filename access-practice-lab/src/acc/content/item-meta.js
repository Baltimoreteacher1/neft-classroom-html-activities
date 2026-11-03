// Bank item metadata (Phase 6A). The engine's item schema (engine/schema.js) says what a learner does; `meta` says what the
// task is FOR: which WIDA framework entries it practices, how demanding it is, how it is scored, what each wrong answer
// reveals, and where the content came from. Everything is inspectable and validated; nothing here is a proficiency level.
import { CONTEXT_STANDARD, MODE_OF, mapItem } from "../wida/framework.js";

export const BANK_VERSION = 1;
export const CONTEXTS = Object.freeze(["Mathematics", "Science", "Social Studies", "Language Arts", "Social and Instructional"]);
export const BANDS = Object.freeze(["early", "building", "strong"]); // practice bands, never WIDA levels
export const COGNITIVE = Object.freeze(["recall", "interpret", "analyze", "evaluate", "create"]);
export const DEMANDS = Object.freeze(["low", "moderate", "high"]);
export const RESPONSES = Object.freeze(["select", "order", "match", "classify", "write", "speak"]);
export const SCORING = Object.freeze(["key", "rubric"]);
export const FUNCTIONS = Object.freeze(["Describe", "Sequence events or retell", "Summarize a main idea", "Present factual information", "Explain cause and effect", "Explain a process or relationship", "Compare or contrast", "Classify information", "Interpret data", "Make and support a claim", "Justify a conclusion", "Give directions or instructions"]);
export const FEATURES = Object.freeze(["academic vocabulary", "connectors and transitions", "complex sentences", "noun groups", "verb tenses", "discourse organization", "evidence and elaboration"]);
export const REVIEW_STATUS = Object.freeze(["automated-checks-only", "human-review-requested", "human-reviewed"]);
export const RUBRICS = Object.freeze({ Speaking: "speaking-practice", Writing: "writing-practice" });
export const STIMULUS_TYPES = Object.freeze(["passage", "audio", "image", "table", "prompt"]);

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const inList = (list, v) => list.includes(v);

/** Validates one bank item's `meta` against the item itself and the WIDA catalog. @returns {string[]} errors */
export function validateMeta(item, set) {
  const errs = [];
  const at = (m) => errs.push(`${item.id}: ${m}`);
  const m = item.meta;
  if (!m || typeof m !== "object") return [`${item.id}: meta missing`];
  if (!Number.isInteger(m.rev) || m.rev < 1) at("meta.rev must be a positive integer");
  if (!inList(CONTEXTS, item.context)) at(`context must be one of ${CONTEXTS.join(", ")}`);
  if (m.mode !== MODE_OF[item.domain]) at(`meta.mode must be ${MODE_OF[item.domain]} for ${item.domain}`);
  if (m.standard !== CONTEXT_STANDARD[item.context]) at(`meta.standard must be ${CONTEXT_STANDARD[item.context]} for ${item.context}`);
  if (!inList(BANDS, m.band)) at(`meta.band must be one of ${BANDS.join(", ")}`);
  if (!inList(COGNITIVE, m.cognitive)) at(`meta.cognitive must be one of ${COGNITIVE.join(", ")}`);
  if (!inList(DEMANDS, m.languageDemand)) at(`meta.languageDemand must be one of ${DEMANDS.join(", ")}`);
  if (!inList(RESPONSES, m.response)) at(`meta.response must be one of ${RESPONSES.join(", ")}`);
  if (!inList(SCORING, m.scoring)) at(`meta.scoring must be one of ${SCORING.join(", ")}`);
  if (!Array.isArray(m.functions) || !m.functions.length || !m.functions.every((f) => inList(FUNCTIONS, f))) at("meta.functions: one or more of the controlled list");
  if (!Array.isArray(m.features) || !m.features.length || !m.features.every((f) => inList(FEATURES, f))) at("meta.features: one or more of the controlled list");
  const stim = set.stimuli?.find((s) => s.id === item.stimulus);
  if (!stim) at("every bank item needs a stimulus");
  else if (m.stimulusType !== stim.kind) at(`meta.stimulusType (${m.stimulusType}) must equal the stimulus kind (${stim.kind})`);
  const objective = ["multiple-choice", "multiple-select", "listening-response", "dropdown", "ordering", "matching", "drag-drop"].includes(item.type);
  if (objective && m.scoring !== "key") at("objective items are scored by key");
  if (!objective && m.scoring !== "rubric") at("speaking and writing items are scored by rubric (teacher review)");
  if (m.scoring === "rubric" && m.rubric !== RUBRICS[item.domain]) at(`meta.rubric must be ${RUBRICS[item.domain]}`);
  const map = mapItem({ domain: item.domain, klu: item.klu, context: item.context }, set.grade);
  if (m.wida?.explicit !== map.explicit) at(`meta.wida.explicit must be ${map.explicit} for ${item.domain}/${item.klu}/${item.context} in grade ${set.grade}`);
  if (JSON.stringify(m.wida?.ids || []) !== JSON.stringify(map.ids)) at(`meta.wida.ids must equal the catalog entries ${JSON.stringify(map.ids)}`);
  if (!m.provenance || m.provenance.source !== "original" || !isStr(m.provenance.author)) at('meta.provenance: { source: "original", author }');
  if (!inList(REVIEW_STATUS, m.reviewStatus)) at(`meta.reviewStatus must be one of ${REVIEW_STATUS.join(", ")}`);
  if (m.reviewStatus === "human-reviewed") at("no item may claim human review: none has happened");
  if (!Array.isArray(m.facts)) at("meta.facts: list each factual claim the item relies on (use [] for none)");
  if (objective && ["multiple-choice", "multiple-select", "listening-response"].includes(item.type)) {
    const wrong = item.options.filter((o) => ![].concat(item.answer).includes(o.id));
    for (const o of wrong) {
      if (!isStr(item.distractors?.[o.id])) at(`distractors.${o.id}: a specific note on why this choice is wrong`);
      if (!isStr(m.misconceptions?.[o.id])) at(`meta.misconceptions.${o.id}: a short misconception tag`);
    }
  }
  if (!isStr(item.explanation) && objective) at("explanation required for objective items");
  for (const tier of ["clue", "frame", "model"]) if (!isStr(item.support?.[tier])) at(`support.${tier} required`);
  return errs;
}
