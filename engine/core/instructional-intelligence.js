/**
 * Shared, local-first evidence contract for the existing lesson and practice
 * runtimes. This module coordinates decisions; it does not replace each
 * surface's answer matcher, authored feedback, tutor, or persistence layer.
 *
 * Only observable evidence is classified. A wrong answer without a uniquely
 * supported misconception remains unclear; language difficulty is recorded
 * only when the learner asks for language access or an explanation is actually
 * analyzed by a surface that supports it.
 *
 * @typedef {"correct"|"misconception"|"computational-slip"|"unclear"} EvidenceKind
 * @typedef {"independent"|"supported"} EvidenceCondition
 * @typedef {object} InstructionalEvidence
 * @property {string} activity Stable activity/skill key; never a student name.
 * @property {string|null} itemId Stable, non-identifying task key for transfer checks.
 * @property {EvidenceKind} kind
 * @property {EvidenceCondition} condition
 * @property {"verified"|"high"|"reported"|"insufficient"} confidence
 * @property {string|null} misconception Authored or uniquely inferred tag.
 * @property {"none"|"learner-requested"|"authored-translation"} languageAccess
 * @property {"calculation-check"|"strategy-clarification"|"language-access"|null} learnerSignal
 * @property {number} at
 */

const VERSION = 1;
const MAX_EVENTS = 40;
const VALID_KINDS = new Set(["correct", "misconception", "computational-slip", "unclear"]);

/** Classify an answer without turning absence of evidence into a diagnosis. */
export function analyzeEvidence(input = {}) {
  const misconception = cleanToken(input.misconception);
  const correct = input.correct === true;
  const kind = correct
    ? "correct"
    : misconception
      ? "misconception"
      : input.computationalSlip === true
        ? "computational-slip"
        : "unclear";
  return {
    activity: cleanToken(input.activity) || "practice",
    itemId: cleanToken(input.itemId) || null,
    kind,
    condition:
      input.independent === false || input.supported === true ? "supported" : "independent",
    confidence:
      kind === "correct"
        ? "verified"
        : kind === "misconception" || kind === "computational-slip"
          ? "high"
          : input.learnerSignal || input.languageAccess === "learner-requested"
            ? "reported"
            : "insufficient",
    misconception: kind === "misconception" ? misconception : null,
    languageAccess: normalizeLanguageAccess(input.languageAccess),
    learnerSignal: normalizeLearnerSignal(input.learnerSignal),
    at: Number.isFinite(input.at) ? input.at : Date.now(),
  };
}

/**
 * Pick the next instructional move using existing authored content and models.
 * The caller remains responsible for rendering/remediating that move.
 */
export function decideInstruction(evidence, context = {}) {
  if (!evidence || !VALID_KINDS.has(evidence.kind))
    return { move: "continue", scaffold: "maintain" };
  if (evidence.kind === "misconception") {
    return {
      move: "targeted-repair",
      scaffold: "visual-or-worked-model",
      targetTag: evidence.misconception,
      transferRequired: true,
    };
  }
  if (evidence.kind === "computational-slip") {
    return { move: "check-the-calculation", scaffold: "maintain", transferRequired: true };
  }
  if (evidence.kind === "unclear") {
    if (evidence.learnerSignal === "calculation-check") {
      return { move: "check-the-calculation", scaffold: "maintain", transferRequired: true };
    }
    if (evidence.learnerSignal === "strategy-clarification") {
      return {
        move: "ask-targeted-math-question",
        scaffold: "visual-or-worked-model",
        transferRequired: true,
      };
    }
    if (evidence.learnerSignal === "language-access") {
      return {
        move: "language-access",
        scaffold: "language-access",
        offerTranslation: context.hasAuthoredTranslation === true,
        transferRequired: false,
      };
    }
    return {
      move: "ask-learner-what-would-help",
      scaffold:
        evidence.languageAccess === "learner-requested" ? "language-access" : "diagnostic-question",
      offerTranslation: context.hasAuthoredTranslation === true,
      transferRequired: false,
    };
  }
  return {
    move: context.nextIndependent === true ? "independent-transfer" : "fade-one-support",
    scaffold: context.nextIndependent === true ? "fade" : "maintain",
    transferRequired: false,
  };
}

/** Persist bounded, non-identifying evidence through an activity's state API. */
export function recordInstructionalEvidence(state, input) {
  if (!state || typeof state.get !== "function" || typeof state.set !== "function") return null;
  const evidence = analyzeEvidence(input);
  const current = state.get()?.instructionalEvidence;
  const prior = current?.version === VERSION && Array.isArray(current.events) ? current.events : [];
  const events = [...prior, evidence].slice(-MAX_EVENTS);
  try {
    state.set({ instructionalEvidence: { version: VERSION, events } });
    return evidence;
  } catch {
    // Optional enrichment must never interrupt answering or save/resume.
    return null;
  }
}

/** Read the bounded local evidence record for a shared decision. */
export function readInstructionalEvidence(state) {
  const value = state?.get?.()?.instructionalEvidence;
  if (!value || value.version !== VERSION || !Array.isArray(value.events)) return [];
  return value.events.filter((item) => item && VALID_KINDS.has(item.kind)).slice(-MAX_EVENTS);
}

/** Count independent success after support, which is the fade/transfer signal. */
export function independentRecoveryCount(events, activity) {
  const relevant = (Array.isArray(events) ? events : []).filter(
    (event) => event.activity === activity,
  );
  let successes = 0;
  const countedItems = new Set();
  let sawPriorSupportOrMiss = false;
  for (let i = relevant.length - 1; i >= 0; i -= 1) {
    const event = relevant[i];
    if (event.kind !== "correct" || event.condition !== "independent") {
      sawPriorSupportOrMiss = true;
      break;
    }
    if (event.itemId && countedItems.has(event.itemId)) continue;
    if (event.itemId) countedItems.add(event.itemId);
    successes += 1;
  }
  return sawPriorSupportOrMiss ? successes : 0;
}

function normalizeLanguageAccess(value) {
  return value === "learner-requested" || value === "authored-translation" ? value : "none";
}

function normalizeLearnerSignal(value) {
  return ["calculation-check", "strategy-clarification", "language-access"].includes(value)
    ? value
    : null;
}

function cleanToken(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .slice(0, 100)
    .replace(/[\u0000-\u001f]/g, "");
}
