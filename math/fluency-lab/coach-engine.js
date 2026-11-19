// Unified Adaptive EduWonderLab Math Coach.
// One coaching engine shared across student practice, games, teacher intervention previews,
// and family guided practice.
//
// Core loop: Student Attempt -> Evidence Analysis -> Targeted Hint -> Revision -> New Problem -> Retention Check
// Authority: 100% deterministic math & validated strategy steps (no unverified AI math authority, no student PII).

import { generateProblem } from "./problem-bank.js";
import { AUTHORED } from "./shell/authored/index.js";
import { revealsAnswer } from "./shell/content.js";
import { buildCanonicalSolution, getStrategy } from "./strategy-registry.js";
import { classifyMistake, likelyMistake } from "./mistake-notes.js";
import { pick } from "./studio/core.js";
import { loadCurriculumSettings } from "./curriculum-profiles.js";

const L = (en, es) => ({ en, es: es ?? en });

export const SUPPORT_LADDER_RUNGS = Object.freeze([
  "attention",
  "strategy",
  "visual",
  "partial",
  "full",
]);

const DISCRIMINATING_FOLLOWUPS = Object.freeze({
  regrouping: L(
    "Before trying again, check: when you trade 1 ten for 10 ones, does the total value of the number change?",
    "Antes de intentar de nuevo, revisa: al cambiar 1 decena por 10 unidades, ¿cambia el valor total del número?",
  ),
  "place-value": L(
    "Check the place value of each digit — are ones lined up with ones and tens with tens?",
    "Revisa el valor posicional de cada dígito: ¿están las unidades con unidades y decenas con decenas?",
  ),
  operation: L(
    "Re-read what the problem asks: are we combining equal groups, finding a difference, or sharing equally?",
    "Vuelve a leer qué pide el problema: ¿estamos juntando grupos iguales, hallando una diferencia o repartiendo en partes iguales?",
  ),
  denominator: L(
    "What does the denominator tell us about the size of each piece? Do the pieces need to be the same size before adding?",
    "¿Qué indica el denominador sobre el tamaño de cada parte? ¿Deben ser del mismo tamaño antes de sumar?",
  ),
  decimal: L(
    "Estimate first: is the answer closer to 1, 10, or 100? Let place value guide where the decimal point belongs.",
    "Estima primero: ¿la respuesta está más cerca de 1, 10 o 100? Deja que el valor posicional guíe el punto decimal.",
  ),
  sign: L(
    "Picture 0 on a number line: which direction does each number move from 0?",
    "Imagina el 0 en la recta numérica: ¿en qué dirección se mueve cada número desde 0?",
  ),
  default: L(
    "Explain your first step out loud — what do the numbers in the problem represent?",
    "Explica tu primer paso en voz alta: ¿qué representan los números del problema?",
  ),
});

function inferMisconceptionBucket(category, noteText) {
  const blob = `${category || ""} ${noteText || ""}`.toLowerCase();
  if (/regroup|borrow|carry/.test(blob)) return "regrouping";
  if (/place|align|column|digit/.test(blob)) return "place-value";
  if (/denom|fraction|whole/.test(blob)) return "denominator";
  if (/decim|tenth|hundredth/.test(blob)) return "decimal";
  if (/sign|negat|int/.test(blob)) return "sign";
  if (/add|sub|mul|div|oper/.test(blob)) return "operation";
  return "default";
}

// Build the 5-rung graduated support ladder for a problem.
// Rungs 1–4 NEVER reveal the final answer; Rung 5 (full explanation) is unlocked only after attempts/revision.
export function buildGraduatedLadder(skill, item, { settings = null, allowFull = false } = {}) {
  const activeSettings = settings || loadCurriculumSettings();
  const strategy = getStrategy(skill, activeSettings);
  const solution = buildCanonicalSolution(skill, item, { settings: activeSettings });
  const safeHint = item.hint && !revealsAnswer(item.hint, item) ? item.hint : null;

  const attentionCue = L(
    `Look closely at the quantities and units in: ${item.question}`,
    `Observa con atención las cantidades y unidades en: ${item.questionEs || item.question}`,
  );

  const methodNote = strategy?.activeAlignment?.preferredMethodNote;
  const strategyTextEn = methodNote
    ? `${methodNote}. ${safeHint || strategy.conceptualExplanation.en}`
    : safeHint || strategy?.conceptualExplanation?.en || "Connect the numbers to a visual model before calculating.";
  const strategyTextEs = strategy?.conceptualExplanation?.es || "Conecta los números con un modelo visual antes de calcular.";

  const visualRung = solution.helpLadder.find((r) => r.kind === "visual") || null;
  const stepsRung = solution.helpLadder.find((r) => r.kind === "steps") || null;

  const rungs = [
    {
      level: 1,
      id: "attention",
      label: L("1. Notice what matters", "1. Observa lo importante"),
      text: attentionCue,
      revealsAnswer: false,
    },
    {
      level: 2,
      id: "strategy",
      label: L("2. Strategy reminder", "2. Recordatorio de estrategia"),
      text: L(strategyTextEn, strategyTextEs),
      curriculumProfile: strategy?.activeProfile?.id || "general-standards",
      revealsAnswer: false,
    },
  ];

  if (visualRung?.frames?.length) {
    rungs.push({
      level: 3,
      id: "visual",
      label: L("3. Visual model", "3. Modelo visual"),
      frames: visualRung.frames,
      revealsAnswer: false,
    });
  }

  if (stepsRung?.steps?.length) {
    rungs.push({
      level: 4,
      id: "partial",
      label: L("4. Partially worked example", "4. Ejemplo parcialmente resuelto"),
      steps: stepsRung.steps,
      revealsAnswer: false,
    });
  }

  if (allowFull) {
    rungs.push({
      level: 5,
      id: "full",
      label: L("5. Complete explanation", "5. Explicación completa"),
      steps: solution.workedSteps,
      frames: solution.visualModel.frames,
      answer: solution.correctAnswer,
      revealsAnswer: true,
    });
  }

  return rungs;
}

// Evidence-calibrated error analysis.
// Never assigns a definitive misconception from a single ambiguous wrong answer.
export function analyzeAttempt({
  skill,
  item,
  rawAnswer,
  priorMistakeCategories = [],
  lang = "en",
  settings = null,
}) {
  const key = `${skill.grade}:${skill.id}`;
  const authored = AUTHORED[key];
  let authoredHit = null;
  if (authored?.misconceptions?.length) {
    for (const detector of authored.misconceptions) {
      try {
        if (typeof detector.match === "function" && detector.match(item, rawAnswer)) {
          authoredHit = detector;
          break;
        }
      } catch {
        /* ignore detector edge errors */
      }
    }
  }

  const category = authoredHit?.id || classifyMistake(item, rawAnswer) || "general-slip";
  const noteText = authoredHit?.note || authoredHit?.message || likelyMistake(item, rawAnswer);
  const priorSame = priorMistakeCategories.filter((c) => c === category).length;

  // Require >= 2 observations of the same pattern (1 prior + current) before calling it "confirmed".
  const confidence = priorSame >= 1 ? "confirmed" : "possible";
  const bucket = inferMisconceptionBucket(category, typeof noteText === "object" ? noteText.en : noteText);
  const discriminatingPrompt = DISCRIMINATING_FOLLOWUPS[bucket] || DISCRIMINATING_FOLLOWUPS.default;

  const ladder = buildGraduatedLadder(skill, item, { settings, allowFull: false });
  const recommendedRung = confidence === "confirmed" && ladder.length >= 3 ? ladder[2] : ladder[1] || ladder[0];

  const feedback = noteText
    ? typeof noteText === "object"
      ? noteText
      : L(noteText, noteText)
    : L(
        "This answer does not match the model yet. Let's check the strategy step by step.",
        "Esta respuesta aún no coincide con el modelo. Revisemos la estrategia paso a paso.",
      );

  return {
    skillKey: key,
    category,
    confidence, // "possible" | "confirmed"
    evidenceCount: priorSame + 1,
    feedback: pick(feedback, lang),
    feedbackPair: feedback,
    discriminatingPrompt: pick(discriminatingPrompt, lang),
    discriminatingPromptPair: discriminatingPrompt,
    recommendedRung,
    ladder,
    nextAction: "revise",
    source: "deterministic-math-engine",
  };
}

// Generate a fresh, distinct transfer problem for the same skill after a successful revision.
export function nextTransferProblem(skill, previousItem, rng = Math.random) {
  const prevQ = String(previousItem?.question || "").trim();
  for (let i = 0; i < 12; i += 1) {
    const candidate = generateProblem(skill, rng);
    if (String(candidate?.question || "").trim() !== prevQ) {
      return { ...candidate, isTransferCheck: true };
    }
  }
  return { ...generateProblem(skill, rng), isTransferCheck: true };
}
