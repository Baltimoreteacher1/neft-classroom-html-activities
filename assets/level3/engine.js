/*!
 * level3/engine.js — Level 3 · Adaptive Small Group runtime (pure logic).
 *
 * No DOM, no network, no storage. Everything here is a pure function over an
 * explicit state object so the whole adaptive loop can be exercised in node
 * (tools/level3-adaptive.test.mjs) instead of only in a browser.
 *
 * The loop is Observe -> Infer -> Adapt -> Verify -> Fade/Change support.
 *
 *   observe(state, event)  append one piece of instructional evidence
 *   infer(state)           classify what the evidence supports, cautiously
 *   adapt(state)           decide the next task + support, with a reason
 *   verify(state)          has the student used the idea in a NEW context?
 *   applyDecision(...)     fold a decision back into state
 *
 * Design rules this file exists to enforce:
 *   - One wrong answer is NEVER a label. A misconception needs corroboration
 *     (CORROBORATION distinct sightings) before it can drive instruction, and
 *     it decays when contradicted.
 *   - Rigor is fixed. `learningTarget` and `standard` are never adapted; only
 *     access, representation, pacing and scaffolding move. A prerequisite
 *     bridge is a detour that MUST return to the grade-level target.
 *   - Support fades on demonstrated success, and can always be restored by
 *     the student or overridden by the teacher.
 *   - Answers are never present here. Checking is delegated to an injected
 *     `checkAnswer` (hash comparison, see assets/level3/checker.js), so no
 *     answer key is reachable from student-visible code.
 */

/** Distinct sightings before evidence may be treated as a working hypothesis. */
export const CORROBORATION = 2;

/** Consecutive successes at a support level before that support fades. */
export const FADE_AFTER = 2;

/** Highest rung of the hint ladder. Rung 5 shows structure, never an answer. */
export const MAX_HINT = 5;

export const CLASSIFICATION = Object.freeze({
  SECURE: "secure",
  DEVELOPING: "developing",
  PREREQUISITE_GAP: "prerequisite-gap",
  MISCONCEPTION: "misconception",
  LANGUAGE_ACCESS: "language-access",
  INTERFACE_ACCESS: "interface-access",
  INSUFFICIENT: "insufficient-evidence",
});

/** Support dimensions the runtime is allowed to move. Never the standard. */
const DEFAULT_SUPPORTS = Object.freeze({
  representation: null, // id from the lesson's representation list
  hintCeiling: 0, // highest hint rung offered proactively
  chunking: 0, // 0 = whole task, 1 = stepped, 2 = heavily stepped
  sentenceFrame: false, // TWR frame for explanations
  vocabSupport: false, // vocabulary card / glossary chips
  readAloud: false,
  language: "en",
});

/**
 * Fresh session state. `config` is the validated Level 3 lesson configuration
 * (data/level3-adaptive.json), NOT the lesson config — rigor fields are copied
 * in once and then treated as immutable.
 */
export function createSession(config, options = {}) {
  const cfg = config || {};
  return {
    lessonId: cfg.lessonId || null,
    // Fixed rigor. Nothing in this module ever writes to these two.
    learningTarget: cfg.learningTarget || "",
    standard: cfg.standard || "",
    studentRef: options.studentRef || null,
    supports: { ...DEFAULT_SUPPORTS, ...(options.supports || {}) },
    // Supports the student pinned ("restore a support that faded too soon")
    // or the teacher overrode. Pinned dimensions are exempt from fading.
    pinned: {},
    teacherOverrides: {},
    evidence: [],
    served: [], // item ids already presented, so nothing repeats
    phase: cfg.diagnostic && cfg.diagnostic.length ? "diagnostic" : "core",
    consecutiveCorrect: 0,
    bridgeReturnTo: null, // set while detoured through a prerequisite bridge
    verified: {}, // misconceptionId -> true once resolved in a NEW context
  };
}

/**
 * OBSERVE — append one piece of evidence. Accepts far more than final
 * correctness: strategy, representation chosen, manipulative moves, the
 * explanation a student typed, hint usage, self-correction, transfer.
 */
export function observe(state, event = {}) {
  const entry = {
    at: typeof event.at === "number" ? event.at : state.evidence.length,
    itemId: event.itemId || null,
    kind: event.kind || "attempt", // attempt|hint|strategy|explanation|manipulative|self-correct|access
    correct: event.correct === true ? true : event.correct === false ? false : null,
    misconception: event.misconception || null,
    prerequisite: event.prerequisite || null,
    representation: event.representation || null,
    hintRung: Number.isFinite(event.hintRung) ? event.hintRung : null,
    selfCorrected: event.selfCorrected === true,
    explanationLength: Number.isFinite(event.explanationLength) ? event.explanationLength : null,
    transfer: event.transfer === true,
    signal: event.signal || null, // access signals: "read-aloud", "translate", "zoom"
  };
  const next = { ...state, evidence: [...state.evidence, entry] };
  if (entry.kind === "attempt") {
    next.consecutiveCorrect = entry.correct ? state.consecutiveCorrect + 1 : 0;
    if (entry.itemId && !next.served.includes(entry.itemId)) {
      next.served = [...next.served, entry.itemId];
    }
  }
  return next;
}

/** Count distinct items on which a given misconception was sighted. */
function sightings(evidence, misconceptionId) {
  const items = new Set();
  for (const e of evidence) {
    if (e.misconception === misconceptionId && e.correct === false) items.add(e.itemId || e.at);
  }
  return items.size;
}

/** Evidence AGAINST a hypothesis: correct work on items that target it. */
function contradictions(evidence, _misconceptionId, itemsTargeting) {
  let n = 0;
  for (const e of evidence) {
    if (e.correct === true && itemsTargeting.has(e.itemId)) n += 1;
  }
  return n;
}

/**
 * INFER — turn evidence into a cautious reading. Returns every classification
 * the evidence actually supports, each with the evidence that produced it, so
 * the teacher panel can always show its work. Ordered most- to least-actionable.
 */
export function infer(state, config = {}) {
  const ev = state.evidence;
  const attempts = ev.filter((e) => e.kind === "attempt");
  const findings = [];

  // Map item -> misconceptions it can detect, so we can count contradictions.
  const targeting = new Map();
  for (const item of allItems(config)) {
    for (const tag of item.targets || []) {
      if (!targeting.has(tag)) targeting.set(tag, new Set());
      targeting.get(tag).add(item.id);
    }
  }

  // --- Misconceptions: only once corroborated, and only if not out-argued.
  const tags = new Set(ev.map((e) => e.misconception).filter(Boolean));
  for (const tag of tags) {
    const seen = sightings(ev, tag);
    const against = contradictions(ev, tag, targeting.get(tag) || new Set());
    if (state.verified[tag]) continue;
    if (seen >= CORROBORATION && seen > against) {
      findings.push({
        type: CLASSIFICATION.MISCONCEPTION,
        id: tag,
        confidence: against === 0 ? "supported" : "mixed",
        evidence: `${seen} sightings on different items${against ? `, ${against} contradicting` : ""}`,
      });
    } else if (seen > 0) {
      // Seen once: explicitly NOT a label. Surfaced as a thing to watch only.
      findings.push({
        type: CLASSIFICATION.INSUFFICIENT,
        id: tag,
        confidence: "watch",
        evidence: `seen once — not enough to act on`,
      });
    }
  }

  // --- Language access: asked for read-aloud/translation, or explanations are
  // thin while the math itself lands. That is access, never a math deficit.
  const accessSignals = ev.filter(
    (e) => e.signal === "read-aloud" || e.signal === "translate",
  ).length;
  const thinExplanations = ev.filter(
    (e) => e.kind === "explanation" && (e.explanationLength ?? 99) < 12,
  ).length;
  const mathLanding = attempts.filter((e) => e.correct).length;
  if (accessSignals >= CORROBORATION || (thinExplanations >= CORROBORATION && mathLanding > 0)) {
    findings.push({
      type: CLASSIFICATION.LANGUAGE_ACCESS,
      id: "language-access",
      confidence: "supported",
      evidence: accessSignals
        ? `${accessSignals} requests for read-aloud or translation`
        : `${thinExplanations} very short explanations alongside correct math`,
    });
  }

  // --- Interface / accessibility need.
  const uiSignals = ev.filter((e) => e.signal === "zoom" || e.signal === "contrast").length;
  if (uiSignals >= CORROBORATION) {
    findings.push({
      type: CLASSIFICATION.INTERFACE_ACCESS,
      id: "interface-access",
      confidence: "supported",
      evidence: `${uiSignals} display adjustments`,
    });
  }

  // --- Prerequisite gap: named directly by an item that probes it.
  const preTags = new Set(ev.map((e) => e.prerequisite).filter(Boolean));
  for (const pre of preTags) {
    const seen = ev.filter((e) => e.prerequisite === pre && e.correct === false).length;
    if (seen >= CORROBORATION) {
      findings.push({
        type: CLASSIFICATION.PREREQUISITE_GAP,
        id: pre,
        confidence: "supported",
        evidence: `${seen} misses on the prerequisite probe`,
      });
    }
  }

  // --- Overall standing on the grade-level target.
  if (attempts.length === 0) {
    findings.push({
      type: CLASSIFICATION.INSUFFICIENT,
      id: "overall",
      confidence: "none",
      evidence: "no attempts yet",
    });
  } else {
    const correct = attempts.filter((e) => e.correct).length;
    const transferred = attempts.some((e) => e.transfer && e.correct);
    const unaided = attempts.filter((e) => e.correct && (e.hintRung ?? 0) === 0).length;
    if (transferred && unaided >= CORROBORATION) {
      findings.push({
        type: CLASSIFICATION.SECURE,
        id: "overall",
        confidence: "supported",
        evidence: `${unaided} unaided successes and transfer to a new context`,
      });
    } else if (correct > 0) {
      findings.push({
        type: CLASSIFICATION.DEVELOPING,
        id: "overall",
        confidence: "supported",
        evidence: `${correct} of ${attempts.length} correct so far`,
      });
    }
  }

  return findings;
}

function allItems(config) {
  const c = config || {};
  return [...(c.diagnostic || []), ...(c.bank || []), ...(c.transfer || []), ...bridgeItems(c)];
}

function bridgeItems(config) {
  const out = [];
  for (const p of config.prerequisites || []) for (const i of p.bridge || []) out.push(i);
  return out;
}

/** The single most actionable finding, or null. */
export function primaryFinding(findings) {
  const order = [
    CLASSIFICATION.MISCONCEPTION,
    CLASSIFICATION.PREREQUISITE_GAP,
    CLASSIFICATION.LANGUAGE_ACCESS,
    CLASSIFICATION.INTERFACE_ACCESS,
    CLASSIFICATION.DEVELOPING,
    CLASSIFICATION.SECURE,
  ];
  for (const t of order) {
    const hit = (findings || []).find((f) => f.type === t);
    if (hit) return hit;
  }
  return null;
}

/**
 * ADAPT — choose the next task and the support to wrap it in.
 *
 * Returns a decision object; it does not mutate. `applyDecision` folds it in.
 * Every decision carries `reason`, which is what the student sees under
 * "Why am I seeing this?" and what the teacher panel shows as evidence.
 */
export function adapt(state, config = {}) {
  const findings = infer(state, config);
  const primary = primaryFinding(findings);
  const supports = { ...state.supports, ...state.teacherOverrides, ...state.pinned };

  // 1. Diagnostic first, but never more than the authored 3 high-information tasks.
  if (state.phase === "diagnostic") {
    const next = (config.diagnostic || []).find((i) => !state.served.includes(i.id));
    if (next) {
      return decision({
        action: "diagnostic",
        item: next,
        supports,
        reason: "Starting with a couple of quick tasks to see what you already have.",
        findings,
      });
    }
    return decision({
      action: "enter-core",
      item: pickCore(state, config, supports),
      supports,
      reason: "Warm-up done — moving to the lesson's grade-level work.",
      findings,
    });
  }

  // 2. Returning from a prerequisite bridge: go straight back to grade level.
  if (state.bridgeReturnTo) {
    const back = allItems(config).find((i) => i.id === state.bridgeReturnTo);
    if (back) {
      return decision({
        action: "return-to-grade-level",
        item: back,
        supports,
        reason: "You've got the piece we backed up for — here's the grade-level task again.",
        findings,
      });
    }
  }

  // 3. Corroborated misconception -> targeted question + representation change.
  if (primary && primary.type === CLASSIFICATION.MISCONCEPTION) {
    const mis = (config.misconceptions || []).find((m) => m.id === primary.id);
    const rep = mis && mis.representation ? mis.representation : supports.representation;
    const item =
      pickTargeting(state, config, primary.id, rep) ||
      pickCore(state, config, { ...supports, representation: rep });
    return decision({
      action: "target-misconception",
      item,
      misconception: primary.id,
      supports: {
        ...supports,
        representation: rep,
        hintCeiling: Math.max(supports.hintCeiling, 4),
      },
      reason: mis && mis.why ? mis.why : "Trying a different model for this idea.",
      findings,
    });
  }

  // 4. Corroborated prerequisite gap -> SHORT bridge, then straight back.
  if (primary && primary.type === CLASSIFICATION.PREREQUISITE_GAP) {
    const pre = (config.prerequisites || []).find((p) => p.id === primary.id);
    const item = (pre && pre.bridge ? pre.bridge : []).find((i) => !state.served.includes(i.id));
    if (item) {
      return decision({
        action: "prerequisite-bridge",
        item,
        bridgeReturnTo: lastGradeLevelItem(state, config),
        supports: { ...supports, chunking: Math.max(supports.chunking, 1) },
        reason: pre && pre.why ? pre.why : "Quick build-up, then straight back to the lesson task.",
        findings,
      });
    }
  }

  // 5. Language access -> add language support. NOT easier math.
  if (primary && primary.type === CLASSIFICATION.LANGUAGE_ACCESS && !supports.sentenceFrame) {
    return decision({
      action: "language-support",
      item: pickCore(state, config, supports),
      supports: { ...supports, sentenceFrame: true, vocabSupport: true, readAloud: true },
      reason:
        "Adding a sentence frame and vocabulary so the words don't get in the way of the math.",
      findings,
    });
  }

  // 6. Secure -> transfer / deeper reasoning, never more of the same.
  if (primary && primary.type === CLASSIFICATION.SECURE) {
    const item = (config.transfer || []).find((i) => !state.served.includes(i.id));
    if (item) {
      return decision({
        action: "transfer",
        item,
        supports: fadeSupports(state, supports),
        reason: "You've shown this — here's one that pushes it somewhere new.",
        findings,
      });
    }
  }

  // 7. Steady success -> fade a support rung.
  if (state.consecutiveCorrect >= FADE_AFTER) {
    const faded = fadeSupports(state, supports);
    if (JSON.stringify(faded) !== JSON.stringify(supports)) {
      return decision({
        action: "fade-support",
        item: pickCore(state, config, faded),
        supports: faded,
        reason: "You've done two in a row — taking one scaffold off. You can always bring it back.",
        findings,
      });
    }
  }

  return decision({
    action: "continue",
    item: pickCore(state, config, supports),
    supports,
    reason: "Keeping going at grade level.",
    findings,
  });
}

function decision(d) {
  return {
    action: d.action,
    item: d.item || null,
    supports: d.supports,
    reason: d.reason,
    misconception: d.misconception || null,
    bridgeReturnTo: d.bridgeReturnTo || null,
    findings: d.findings || [],
    // Rigor is reported back on every decision so a caller can assert it never moved.
    learningTarget: d.learningTarget,
  };
}

function pickCore(state, config, supports) {
  const bank = config.bank || [];
  const unseen = bank.filter((i) => !state.served.includes(i.id));
  const pool = unseen.length ? unseen : bank;
  if (supports && supports.representation) {
    const match = pool.find((i) => i.representation === supports.representation);
    if (match) return match;
  }
  return pool[0] || null;
}

/**
 * Pick an item that probes `tag`. When the misconception names a representation
 * to re-teach through, prefer an item that actually USES that representation —
 * otherwise the runtime announces "here's a double number line" and then hands
 * over a table, which is exactly the mismatch the reason string promises not to.
 */
function pickTargeting(state, config, tag, representation) {
  const pool = (config.bank || []).filter(
    (i) => (i.targets || []).includes(tag) && !state.served.includes(i.id),
  );
  if (representation) {
    const matched = pool.find((i) => i.representation === representation);
    if (matched) return matched;
  }
  return pool[0] || null;
}

function lastGradeLevelItem(state, config) {
  const bankIds = new Set((config.bank || []).map((i) => i.id));
  for (let i = state.evidence.length - 1; i >= 0; i -= 1) {
    const id = state.evidence[i].itemId;
    if (id && bankIds.has(id)) return id;
  }
  const first = (config.bank || [])[0];
  return first ? first.id : null;
}

/** Remove exactly ONE support rung, heaviest first. Pinned dimensions stay. */
function fadeSupports(state, supports) {
  const pinned = state.pinned || {};
  const next = { ...supports };
  const order = ["chunking", "hintCeiling", "sentenceFrame", "vocabSupport"];
  for (const key of order) {
    if (pinned[key] !== undefined) continue;
    if (key === "chunking" && next.chunking > 0) {
      next.chunking -= 1;
      return next;
    }
    if (key === "hintCeiling" && next.hintCeiling > 0) {
      next.hintCeiling -= 1;
      return next;
    }
    if (next[key] === true) {
      next[key] = false;
      return next;
    }
  }
  return next;
}

/**
 * VERIFY — a misconception counts as resolved only when the student succeeds
 * on an item that targets it in a context they have not already seen, without
 * leaning on the top of the hint ladder.
 */
export function verify(state, config, misconceptionId) {
  const targeting = new Set(
    allItems(config)
      .filter((i) => (i.targets || []).includes(misconceptionId))
      .map((i) => i.id),
  );
  const wins = state.evidence.filter(
    (e) =>
      e.kind === "attempt" &&
      e.correct === true &&
      targeting.has(e.itemId) &&
      (e.hintRung ?? 0) < MAX_HINT,
  );
  const contexts = new Set(wins.map((e) => e.itemId));
  return contexts.size >= 1 && wins.some((e) => e.transfer || (e.hintRung ?? 0) === 0);
}

/** Fold a decision back into session state. */
export function applyDecision(state, d) {
  const next = { ...state, supports: d.supports };
  if (d.action === "enter-core" || d.action === "return-to-grade-level") next.phase = "core";
  if (d.action === "prerequisite-bridge") {
    next.phase = "bridge";
    next.bridgeReturnTo = d.bridgeReturnTo;
  }
  if (d.action === "return-to-grade-level") next.bridgeReturnTo = null;
  if (d.item && !next.served.includes(d.item.id)) next.served = [...next.served, d.item.id];
  return next;
}

/** Student pins a support back on (or off). Pinned dimensions never fade. */
export function pinSupport(state, key, value) {
  return {
    ...state,
    pinned: { ...state.pinned, [key]: value },
    supports: { ...state.supports, [key]: value },
  };
}

/** Teacher override — always wins, always reversible. */
export function overrideSupport(state, key, value) {
  const overrides = { ...state.teacherOverrides };
  if (value === null) delete overrides[key];
  else overrides[key] = value;
  // Deliberately does NOT write into state.supports: an override has to be a
  // separate layer, or clearing it would leave the value baked into the base
  // and the runtime could never go back to choosing automatically.
  return { ...state, teacherOverrides: overrides };
}

/**
 * The supports actually in force: automatic choice, then teacher override, then
 * anything the student pinned. Use this for display — reading `state.supports`
 * directly shows the automatic layer only.
 */
export function effectiveSupports(state) {
  return { ...state.supports, ...state.teacherOverrides, ...state.pinned };
}

/** Mark a misconception verified so it stops driving instruction. */
export function markVerified(state, misconceptionId) {
  return { ...state, verified: { ...state.verified, [misconceptionId]: true } };
}

/**
 * The hint ladder. Rung 5 shows a partial structure and NEVER completes the
 * reasoning or states the answer; that is asserted by the test suite.
 */
export function hintAt(item, rung) {
  const ladder = (item && item.hints) || [];
  const idx = Math.max(1, Math.min(MAX_HINT, rung || 1)) - 1;
  return ladder[idx] || ladder[ladder.length - 1] || null;
}

/**
 * Teacher-facing summary. Deliberately non-ranking and non-labelling: it
 * reports what the evidence suggests and what the runtime did about it.
 */
export function teacherSummary(state, config) {
  const findings = infer(state, config);
  const primary = primaryFinding(findings);
  const attempts = state.evidence.filter((e) => e.kind === "attempt");
  return {
    learningTarget: state.learningTarget,
    standard: state.standard,
    suggestion: primary
      ? suggestionFor(primary, config)
      : "Not enough evidence yet — keep watching.",
    evidence: primary ? primary.evidence : "no attempts yet",
    confidence: primary ? primary.confidence : "none",
    representation: effectiveSupports(state).representation,
    supportDirection: supportDirection(state),
    attempts: attempts.length,
    overridden: Object.keys(state.teacherOverrides),
  };
}

function suggestionFor(finding, config) {
  if (finding.type === CLASSIFICATION.MISCONCEPTION) {
    const m = (config.misconceptions || []).find((x) => x.id === finding.id);
    return m ? m.teacherSuggestion || `Current evidence suggests: ${m.label}` : finding.id;
  }
  if (finding.type === CLASSIFICATION.PREREQUISITE_GAP) {
    const p = (config.prerequisites || []).find((x) => x.id === finding.id);
    return p ? `Current evidence suggests a short bridge: ${p.label}` : finding.id;
  }
  if (finding.type === CLASSIFICATION.LANGUAGE_ACCESS)
    return "Current evidence suggests a language-access need, not a math gap — try the frame and vocabulary.";
  if (finding.type === CLASSIFICATION.INTERFACE_ACCESS)
    return "Current evidence suggests a display need — check text size and contrast.";
  if (finding.type === CLASSIFICATION.SECURE)
    return "Current evidence suggests readiness for a transfer task.";
  return "Current evidence suggests continuing at grade level.";
}

function supportDirection(state) {
  const hist = state.evidence.filter((e) => e.kind === "attempt");
  if (!hist.length) return "steady";
  if (state.consecutiveCorrect >= FADE_AFTER) return "fading";
  const recent = hist.slice(-2);
  if (recent.length && recent.every((e) => e.correct === false)) return "increasing";
  return "steady";
}

export default {
  CORROBORATION,
  effectiveSupports,
  FADE_AFTER,
  MAX_HINT,
  CLASSIFICATION,
  createSession,
  observe,
  infer,
  primaryFinding,
  adapt,
  applyDecision,
  verify,
  markVerified,
  pinSupport,
  overrideSupport,
  hintAt,
  teacherSummary,
};
