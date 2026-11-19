// Family Math Companion & Guided Practice Together.
// Powered by the same Strategy Registry, Curriculum Profiles, Adaptive Coach, and Mastery model
// used by students and teachers — so families see the exact same strategy taught in class.

import { ALL_SKILLS, generateProblem, seededRandom } from "../problem-bank.js";
import { buildCanonicalSolution, getStrategy } from "../strategy-registry.js";
import { buildGraduatedLadder } from "../coach-engine.js";
import { learningStage } from "../mastery-model.js";
import { esc, pick } from "../studio/core.js";

const L = (en, es) => ({ en, es: es ?? en });

const COACHING_PROMPTS = Object.freeze({
  "place-value": L(
    "Ask your child to show the number using tens and ones before adding or subtracting.",
    "Pide a tu hijo o hija que muestre el número usando decenas y unidades antes de sumar o restar.",
  ),
  fractions: L(
    "Ask your child why the parts of the whole must be equal in size.",
    "Pregunta a tu hijo o hija por qué las partes del entero deben ser del mismo tamaño.",
  ),
  ratios: L(
    "Ask what stays the same when both quantities in the ratio are multiplied by the same number.",
    "Pregunta qué se mantiene igual cuando multiplicamos ambas cantidades de la razón por el mismo número.",
  ),
  expressions: L(
    "Ask your child how both sides of the equation stay balanced when they undo an operation.",
    "Pregunta a tu hijo o hija cómo se mantienen equilibrados ambos lados de la ecuación al deshacer una operación.",
  ),
  default: L(
    "Ask your child to explain their first step out loud before checking the answer.",
    "Pide a tu hijo o hija que explique su primer paso en voz alta antes de revisar la respuesta.",
  ),
});

function promptBucketFor(skill) {
  const id = skill?.id || "";
  if (/place|tens|100|1000|round|dec/.test(id)) return "place-value";
  if (/frac|mixed|equal-shares/.test(id)) return "fractions";
  if (/ratio|rate|percent|proportion/.test(id)) return "ratios";
  if (/eq|expr|one-step|ineq|eval/.test(id)) return "expressions";
  return "default";
}

export function buildFamilyCompanion({
  skillKey,
  tutorRecord = null,
  lang = "en",
  seed = 23,
} = {}) {
  const [gStr, id] = String(skillKey || "6:ratios").split(":");
  const skill = ALL_SKILLS.find((s) => s.grade === Number(gStr) && s.id === id) || ALL_SKILLS[0];
  const resolvedKey = `${skill.grade}:${skill.id}`;
  const strategy = getStrategy(skill);
  const sampleItem = generateProblem(skill, seededRandom(seed * 7919));
  const solution = buildCanonicalSolution(skill, sampleItem, { lang });
  const ladder = buildGraduatedLadder(skill, sampleItem, { allowFull: false });
  const rec = tutorRecord?.records?.[resolvedKey] || {};
  const stageInfo = learningStage(rec);
  const coachPrompt = COACHING_PROMPTS[promptBucketFor(skill)] || COACHING_PROMPTS.default;

  return {
    skillKey: resolvedKey,
    grade: skill.grade,
    title: pick(strategy.title, lang),
    plainExplanation: pick(strategy.conceptualExplanation, lang),
    visualSvg: solution.visualModel.frames[0]?.svg || "",
    curriculumNote: strategy.activeAlignment.fallbackUsed
      ? pick(
          L(
            "Using verified standards-aligned strategy (publisher mapping pending review).",
            "Usando estrategia verificada alineada con estándares (mapeo editorial en revisión).",
          ),
          lang,
        )
      : strategy.activeAlignment.unit
        ? `${strategy.activeProfile.name[lang] || strategy.activeProfile.name.en} · ${strategy.activeAlignment.unit}`
        : strategy.activeProfile.name[lang] || strategy.activeProfile.name.en,
    helpWithoutSpoiling: [
      pick(coachPrompt, lang),
      pick(
        L(
          "If they get stuck, read Rung 1 or Rung 2 below instead of giving the final number.",
          "Si se atasca, lee el Paso 1 o Paso 2 de abajo en lugar de dar el número final.",
        ),
        lang,
      ),
    ],
    guidedPracticeItem: {
      question: lang === "es" ? sampleItem.questionEs || sampleItem.question : sampleItem.question,
      answer: solution.correctAnswer,
      rungs: ladder.slice(0, 3).map((r) => ({
        label: pick(r.label, lang),
        text: r.text ? pick(r.text, lang) : "",
      })),
    },
    progress: {
      stage: stageInfo.stage,
      stageLabel: pick(stageInfo.label, lang),
      reason: pick(stageInfo.reason, lang),
      nextStep: pick(stageInfo.nextStep, lang),
      insufficientEvidence: stageInfo.insufficientEvidence,
    },
  };
}

export function renderFamilyCompanionHtml(companion, lang = "en") {
  const heading = lang === "es" ? "Guía de estrategias para familias" : "Family Math Companion";
  const sub = lang === "es"
    ? "Qué está aprendiendo, cómo ayudar sin dar la respuesta y práctica guiada juntos."
    : "What your child is learning, how to help without giving away the answer, and guided practice together.";

  return `<section class="fm-companion" data-testid="family-companion" style="margin-top:1.25rem;padding:1rem;border:1px solid #cbd5e1;border-radius:14px;background:#ffffff">
    <h2 style="margin:0 0 .25rem">${esc(heading)}: ${esc(companion.title)}</h2>
    <p style="margin:0 0 .75rem;color:#475569">${esc(sub)}</p>
    <p><strong>${esc(lang === "es" ? "Estrategia:" : "Strategy:")}</strong> ${esc(companion.plainExplanation)}</p>
    <p style="font-size:.9rem;color:#334155"><em>${esc(companion.curriculumNote)}</em></p>
    ${companion.visualSvg ? `<div style="max-width:420px;margin:.75rem 0">${companion.visualSvg}</div>` : ""}
    <div style="padding:.75rem;background:#f8fafc;border-radius:10px;margin:.75rem 0">
      <strong>${esc(lang === "es" ? "Cómo ayudar sin dar la respuesta:" : "How to help without giving away the answer:")}</strong>
      <ul style="margin:.4rem 0 0;padding-left:1.25rem">${companion.helpWithoutSpoiling.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>
    </div>
    <div style="padding:.75rem;border:1px dashed #94a3b8;border-radius:10px;margin:.75rem 0">
      <strong>${esc(lang === "es" ? "Practiquen juntos:" : "Practice Together:")}</strong>
      <p style="margin:.35rem 0">${esc(companion.guidedPracticeItem.question)}</p>
      <details>
        <summary style="cursor:pointer;min-height:44px;display:inline-flex;align-items:center">${esc(lang === "es" ? "Ver pistas para adultos (sin revelar la respuesta)" : "Parent coaching hints (answer-free)")}</summary>
        <ul>${companion.guidedPracticeItem.rungs.map((r) => `<li><strong>${esc(r.label)}:</strong> ${esc(r.text)}</li>`).join("")}</ul>
      </details>
    </div>
    <p style="margin:.5rem 0 0;font-size:.9rem"><strong>${esc(lang === "es" ? "Estado actual:" : "Current stage:")}</strong> ${esc(companion.progress.stageLabel)} — ${esc(companion.progress.reason)}</p>
  </section>`;
}
