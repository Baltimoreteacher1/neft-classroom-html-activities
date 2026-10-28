import { familyGuidance, householdMission } from "./homework-family-guidance.mjs";
/**
 * Guided family notes content + HTML sections for interactive homework.
 * Derives bilingual EN/ES content from lesson config.json fields.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { qrSvg } from "@eduwonderlab/engine/core/qr-mini.js";
import { DEFAULT_KITCHEN_TABLE } from "../curriculum/family-connections/broadcast/broadcast-content.js";
import { lessonPath } from "../tools/lib/curriculum-source.mjs";
import {
  decimalOperation,
  detectVisualTopic,
  homeworkWorkbenchTool,
  ratioFocus,
  selectAlignedQuickCheckProblems,
  selectMorePracticeProblems,
  selectTieredQuickCheckProblems,
} from "./homework-alignment.mjs";
import {
  getExternalResources,
  renderExternalResourcesSection,
} from "./homework-external-resources.mjs";
import {
  exactConceptVisual,
  exactFamilyMission,
  exactFamilyPowerUp,
  exactFamilySupport,
} from "./homework-family-support.mjs";
import { buildHomeworkGame, renderPlayTab } from "./homework-games.mjs";
import {
  plainObjective,
  polishSpanish,
  spanishKernel,
  spanishKeyIdea,
  translateConceptLine,
  translateFamilyText,
  translateLanguageObjective,
} from "./homework-spanish.mjs";
import { getUnitTheme } from "./homework-themes.mjs";
import { act, actOn, EL, EV, VALUE } from "./lib/homework-actions.mjs";
import { bridgeOf, renderBridgeCard } from "./lib/homework-bridge.mjs";
import { confusedRoundsFor, renderConfusedGrownUp } from "./lib/homework-confused-grownup.mjs";
import { renderDominoDuo } from "./lib/homework-domino-duo.mjs";
import {
  GOAL_TARGET,
  ROUTE_TIMES,
  renderConfidence,
  renderDinnerTalkCard,
  renderFamilyNights,
  renderGoalPips,
  renderMiniConceptSvg,
  renderMysteryChallenge,
  renderShareWin,
  renderStudentPathwayBar,
  renderTeachBack,
  renderTonightStrip,
} from "./lib/homework-experience.mjs";
import {
  renderExperienceBadge,
  renderHero,
  renderMoreSheet,
  renderTopBar,
} from "./lib/homework-hero.mjs";
import { renderPrintHead } from "./lib/homework-print.mjs";
import { choiceFeedbackSpanish } from "./lib/homework-problems.mjs";
import { renderScratchpadHtml } from "./lib/homework-scratchpad.mjs";
import {
  renderQuickOptional,
  renderSessionBanner,
  renderWarmupHuddle,
  SESSIONS,
  sessionOf,
} from "./lib/homework-session-flow.mjs";
import { renderLearnModules, v3Of } from "./lib/homework-v3-learn.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const _root = join(__dirname, "..");
export const familyTitlesEs = JSON.parse(
  readFileSync(join(_root, "data/family-homework-titles-es.json"), "utf8"),
);
/* Spanish for the Math Dominoes tiles that carry words, keyed by the English tile text. */
export const FAMILY_PAIRS_ES = JSON.parse(
  readFileSync(join(_root, "data/family-game-pairs-es.json"), "utf8"),
);

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
export const escAttr = esc;

/**
 * How each extra session names itself wherever a family reads it.
 *
 * `-part2` is the second of the two class days nearly every lesson is taught
 * over. `-part3` exists for lesson 3-2 alone — the one lesson taught over three
 * sections — and it is called "Section 3" because that is the word used with
 * families for it; the hub tile in lessons/3-2-part3/config.json says the same
 * words, and this map is the one place the two are kept in step.
 */
const SESSION_LABELS = { part2: "Session 2", part3: "Section 3" };

// Lesson folder slugs carry internal variant suffixes ("2-1-flagship",
// "2-1-group1", "2-1-catchup"). Those are build/routing details — families
// should only ever see the lesson number, so strip the suffix for any
// human-facing label. The raw id still drives URLs, storage keys, and
// window.LESSON_ID.
export function displayLessonId(lessonId) {
  // `-partN` is NOT a build detail like the others: it is one of the sessions
  // the lesson is taught over, and a family holding several pages for one
  // lesson needs to see which night each belongs to. Kept, but said in words —
  // "Lesson 2-1 · Session 2", never the folder slug "2-1-part2".
  return String(lessonId ?? "")
    .replace(/-(flagship|group\d+|catchup)$/, "")
    .replace(/-(part[23])$/, (_, slug) => ` · ${SESSION_LABELS[slug]}`);
}

/**
 * How the page names itself in its title, description and welcome line.
 *
 * A numbered lesson is "Lesson 6-2". A bridge or review lesson is not: it has
 * no place in the numbered spine, and `6-1-6-2-practice` is a folder slug, not
 * something to show a family — "Lesson 6-1-6-2-practice" is worse than saying
 * nothing. Those pages lead with "Review" and let their own title do the
 * naming ("6.1–6.2 · Extra Practice"), which already says which lessons it
 * covers. A unit review (`1-review`) is the same case: the folder slug is not a
 * lesson number, and the page's own title ("Pre-Unit 1 · Review") already says
 * what it covers.
 */
export function homeworkPageLabel(lessonId) {
  const id = String(lessonId ?? "");
  if (/-(practice|catchup|review)$/.test(id)) return "Review";
  // A bridge lesson's Part 2 is still a review: its own title says which
  // lessons it covers, so naming it "Lesson 6-1-6-2-practice · Part 2" is the
  // folder slug leaking to a family all over again.
  const bridgeSession = /-(?:practice|catchup|review)-(part[23])$/.exec(id);
  if (bridgeSession) return `Review · ${SESSION_LABELS[bridgeSession[1]]}`;
  return `Lesson ${displayLessonId(id)}`;
}

function firstTurnAndTalk(config) {
  const talks = Array.isArray(config.turnAndTalk) ? config.turnAndTalk : [];
  return talks[0] || null;
}

function conceptIntro(config) {
  return config.launch?.conceptIntro || config.explore?.conceptIntro || null;
}

function keyIdea(config) {
  if (config.familyBigIdeaFormat === "simple-visual" && config.familyKeyIdea) {
    return config.familyKeyIdea;
  }
  const exact = exactFamilySupport(config || {});
  if (exact) return exact.capEn;
  if (config.familyNotes?.bigIdea?.en) return config.familyNotes.bigIdea.en;
  const intro = conceptIntro(config);
  if (intro?.keyIdea) return intro.keyIdea;
  if (intro?.intro) return intro.intro;
  const talk = firstTurnAndTalk(config);
  return talk?.kernel || config.contentObjective || "";
}

function keyIdeaEs(config) {
  if (config.familyBigIdeaFormat === "simple-visual" && config.familyKeyIdeaEs) {
    return config.familyKeyIdeaEs;
  }
  const exact = exactFamilySupport(config || {});
  if (exact) return exact.capEs;
  if (config.familyNotes?.bigIdea?.es) return config.familyNotes.bigIdea.es;
  return spanishKeyIdea(config);
}

export function learningTonight(config) {
  const vocab = config.vocabulary || [];
  const en =
    config.familyNotes?.learningTonight?.en ||
    plainObjective(config.contentObjective) ||
    config.title ||
    "tonight's math idea";
  const es =
    config.familyNotes?.learningTonight?.es ||
    config.contentObjectiveEs ||
    translateFamilyText(config.contentObjective, vocab) ||
    `Practicar: ${config.title || "la lección de hoy"}`;
  return { en, es };
}

function completeSentence(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  // A sentence may end inside a closing quote or bracket ('…by 3."'); adding a
  // period after it printed '3.".' on 35 pages.
  return /[.!?…]["'”’)\]]*$/.test(text) ? text : `${text}.`;
}

function splitExplanation(value) {
  const text = completeSentence(value);
  // A leading enumeration ("1. Rewrite any whole number...") is not a sentence.
  // Without this the lead is the string "1." — which is what the fallback
  // concept card rendered for an authored step list, a card reading
  // "We start with 1. / We end with 4." and nothing else.
  const enumerated = text.match(/^(\d{1,2}[.)]\s+)([\s\S]*)$/);
  const prefix = enumerated ? enumerated[1] : "";
  const body = enumerated ? enumerated[2] : text;
  const firstSentence = body.match(/^(.+?[.!?])(?:\s+|$)([\s\S]*)$/);
  if (!firstSentence) return { lead: prefix + body, detail: "" };
  return {
    lead: (prefix + firstSentence[1]).trim(),
    detail: firstSentence[2].trim(),
  };
}

const STEP_CUES = [
  { icon: "🎯", en: "Set up", es: "Plantea" },
  { icon: "🧩", en: "Model", es: "Modela" },
  { icon: "✏️", en: "Solve", es: "Resuelve" },
  { icon: "✅", en: "Check", es: "Revisa" },
];

function stepCue(index, step) {
  if (step?.cue && typeof step.cue === "object") {
    return {
      icon: step.cue.icon || "📌",
      en: step.cue.en || "Step",
      es: step.cue.es || step.cue.en || "Paso",
    };
  }
  if (step?.cueEn) {
    return {
      icon: step.cueIcon || step.icon || "📌",
      en: step.cueEn,
      es: step.cueEs || step.cueEn,
    };
  }
  return STEP_CUES[Math.min(index, STEP_CUES.length - 1)];
}

function renderVocabularyChips(vocab, language) {
  const terms = vocab
    .map((word) => (language === "es" ? word.termEs || word.term : word.term))
    .filter(Boolean);
  if (!terms.length) return "";

  const label = language === "es" ? "Palabras clave" : "Key words";
  return `<div class="learning-words"><span class="learning-words-label">${label}</span><ul class="learning-word-chips" aria-label="${label}">${terms.map((term) => `<li>${esc(term)}</li>`).join("")}</ul></div>`;
}

function _languageTonightEs(config) {
  const vocab = config.vocabulary || [];
  return (
    config.languageObjectiveEs ||
    translateLanguageObjective(config.languageObjective, vocab) ||
    "Usen las palabras del vocabulario al explicar."
  );
}

function buildConceptSteps(config) {
  const custom = config.familyNotes?.conceptSteps;
  if (Array.isArray(custom) && custom.length) {
    return custom.map((step, i) => ({
      ...step,
      stepNum: step.stepNum ?? i + 1,
    }));
  }
  const exact = exactFamilySupport(config || {});
  if (exact) return exact.steps.map((step, i) => ({ ...step, stepNum: i + 1 }));
  const intro = conceptIntro(config);

  const vocab = config.vocabulary || [];
  const lines = [];
  if (intro?.intro) {
    lines.push({
      en: intro.intro,
      es: intro.introEs || polishSpanish(translateConceptLine(intro.intro, vocab), config),
    });
  }
  if (intro?.iDo?.lines) {
    intro.iDo.lines.slice(0, 4).forEach((line, i) => {
      lines.push({
        en: line,
        es: intro.iDo.linesEs?.[i] || polishSpanish(translateConceptLine(line, vocab), config),
      });
    });
  }
  if (lines.length < 2 && intro?.keyIdea) {
    lines.push({ en: intro.keyIdea, es: keyIdeaEs(config) });
  }
  if (lines.length < 2) {
    const talk = firstTurnAndTalk(config);
    if (talk?.kernel) {
      lines.push({
        en: talk.kernel,
        es: spanishKernel(config) || keyIdeaEs(config),
      });
    }
  }
  return lines.slice(0, 4).map((row, idx) => ({
    stepNum: idx + 1,
    en: row.en,
    es: row.es,
  }));
}

function watchForCues(config) {
  const custom = config.familyNotes?.watchFor;
  if (Array.isArray(custom) && custom.length) return custom;

  const vocab = (config.vocabulary || []).slice(0, 3);
  const cues = vocab.map((v) => ({
    icon: "👀",
    en: `Listen for the word "${v.term}" — it means: ${v.definition}`,
    es: `Escucha la palabra "${v.termEs || v.term}" — significa: ${v.definitionEs || v.definition}`,
  }));

  if (cues.length < 2) {
    cues.push({
      icon: "✋",
      en: 'Let your student try first. Ask "What do you notice?" before giving hints.',
      es: 'Deja que tu estudiante intente primero. Pregunta "¿Qué observas?" antes de dar pistas.',
    });
  }
  return cues.slice(0, 3);
}

// Compact, graduated practice ladder for the "Try Together" tab: real problems
// drawn from the lesson's practice tiers, ordered EASIEST → HARDEST so families
// build confidence first, then stretch. We only keep problem shapes that compact
// cleanly to a one-line "question → answer" (multiple-choice, open-response) and
// never include "find the error" / error-analysis here.
function ladderCard(prob) {
  if (!prob || typeof prob !== "object") return null;
  if (prob.type === "multiple-choice") {
    const q = prob.stem || prob.question || "";
    if (!q || !Array.isArray(prob.choices) || !Number.isInteger(prob.correctIndex)) return null;
    const a = prob.choices[prob.correctIndex];
    if (a == null) return null;
    const qEs = prob.stemEs || prob.questionEs || "";
    const choicesEs =
      Array.isArray(prob.choicesEs) && prob.choicesEs.length === prob.choices.length
        ? prob.choicesEs.map((c) => String(c))
        : null;
    const aEs = choicesEs ? choicesEs[prob.correctIndex] : null;
    // Carry the answer choices through so the ladder can render the options the
    // stem refers to ("Which of the following…?"). Without them the family sees
    // a question with no choices and only the reveal — impossible to answer.
    return {
      q,
      qEs,
      a: String(a),
      aEs: aEs != null ? String(aEs) : "",
      choices: prob.choices.map((c) => String(c)),
      choicesEs,
      correctIndex: prob.correctIndex,
      feedback: Array.isArray(prob.choiceFeedback) ? prob.choiceFeedback.map(String) : [],
      feedbackEs: Array.isArray(prob.choiceFeedbackEs) ? prob.choiceFeedbackEs.map(String) : [],
      explanation: String(prob.explanation || ""),
      explanationEs: String(prob.explanationEs || ""),
    };
  }
  if (prob.type === "open-response") {
    const q = prob.prompt || prob.question || prob.stem || "";
    if (!q) return null;
    // `modelAnswer` is the field most lesson configs actually author (202 of
    // 344 open-response items), and the rest state the answer inside
    // `explanation`; without both fallbacks the ladder showed no reveal at all.
    const a =
      prob.modelAnswer ||
      prob.sampleAnswer ||
      prob.answer ||
      prob.exemplar ||
      prob.explanation ||
      "";
    const qEs = prob.promptEs || prob.questionEs || prob.stemEs || "";
    const aEs =
      prob.modelAnswerEs ||
      prob.sampleAnswerEs ||
      prob.answerEs ||
      prob.exemplarEs ||
      prob.explanationEs ||
      "";
    return { q, qEs, a: String(a), aEs: String(aEs) };
  }
  return null;
}

/* The ladder must not repeat the Check tab. It used to read the same practice
   tiers the Quick Check and More Practice sets read, so 774 of 813 ladder items
   on the 166 pages were a Check problem printed a second time (audit
   2026-10-04) — the family met each one twice and the second time it had
   already been answered. Anything the page already shows is excluded, by
   object and by question text, and the ladder then falls back to the lesson's
   other authored checks (connect.check, the exit ticket). A tier that runs out
   stays short: fewer rungs beat a repeated one. */
/* Authored family-only ladder items and Try Together story lines, keyed by
   homework lesson id. Written 2026-10-04 for the lessons whose own authored
   practice is used up by the Check tab, and the 37 lessons whose Try Together
   opened with the placeholder "Use the small example below…". */
const FAMILY_DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const readFamilyData = (name) => {
  const path = join(FAMILY_DATA_DIR, name);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
};
const FAMILY_LADDER = readFamilyData("family-homework-ladder.json");

const ladderKey = (q) =>
  String(q || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 60);

function ladderCandidate(prob) {
  if (!prob || typeof prob !== "object") return prob;
  // connect.check marks its answer with `answer`, not `correctIndex`.
  if (
    !prob.type &&
    Array.isArray(prob.choices) &&
    Number.isInteger(prob.answer ?? prob.correctIndex)
  ) {
    return { ...prob, type: "multiple-choice", correctIndex: prob.correctIndex ?? prob.answer };
  }
  return prob;
}

export function buildTogetherLadder(config = {}) {
  const p = config.practice || {};
  const { warmup, challenge } = selectTieredQuickCheckProblems(p, config);
  const core = [...warmup, ...challenge];
  const shown = [...core, ...selectMorePracticeProblems(p, config, core)];
  const shownKeys = new Set(
    shown.map((x) => ladderKey(x?.stem || x?.question || x?.prompt)).filter(Boolean),
  );
  // `familyCheck`, never `reflect.exitTicket`: this page is the family's, it
  // prints answers, and the exit ticket is the lesson's own end-of-class check.
  // A lesson without a familyCheck simply contributes no item here.
  // validate:family-exit-ticket pins it (scripts/lib/family-content.mjs).
  const extra = [
    ...(Array.isArray(config.connect?.check) ? config.connect.check : []),
    ...(config.familyCheck ? [config.familyCheck] : []),
  ];
  const family = FAMILY_LADDER[config.lessonId] || {};
  // Difficulty ladder: 1★ approaching (scaffolded), 2★ on-level / optional /
  // the lesson's own checks, 3★ extending (stretch).
  const tiers = [
    {
      pools: [family.approaching, p.approaching],
      stars: "★",
      labelEn: "Start easy",
      labelEs: "Empieza fácil",
      take: 2,
    },
    {
      pools: [family.onLevel, p.onLevel, p.optional, extra],
      stars: "★★",
      labelEn: "Keep going",
      labelEs: "Sigan",
      take: 2,
    },
    {
      pools: [family.extending, p.extending],
      stars: "★★★",
      labelEn: "Challenge",
      labelEs: "Reto",
      take: 1,
    },
  ];

  const ladder = [];
  for (const tier of tiers) {
    let taken = 0;
    for (const arr of tier.pools) {
      for (const raw of Array.isArray(arr) ? arr : []) {
        if (taken >= tier.take) break;
        if (shown.includes(raw)) continue;
        const card = ladderCard(ladderCandidate(raw));
        if (!card) continue;
        const key = ladderKey(card.q);
        if (shownKeys.has(key) || ladder.some((x) => ladderKey(x.q) === key)) continue;
        ladder.push({ ...card, stars: tier.stars, tierEn: tier.labelEn, tierEs: tier.labelEs });
        taken += 1;
      }
    }
  }
  return ladder;
}

function stuckTips(config) {
  const exact = exactFamilySupport(config || {});
  if (exact)
    return {
      say: [{ en: exact.capEn, es: exact.capEs }, ...exact.steps.slice(0, 2)],
      dontSay: [
        {
          en: "Use a rule before checking what this question asks.",
          es: "Usa una regla sin revisar qué pide esta pregunta.",
        },
      ],
    };
  const custom = config.familyNotes?.stuckTips;
  if (custom) return custom;

  const topic = detectVisualTopic(config);

  const tipsByTopic = {
    ratios: {
      say: [
        {
          en: "Let's make a ratio table. How do we get from the first batch to the second?",
          es: "Hagamos una tabla de razones. ¿Cómo pasamos de la primera tanda a la segunda?",
        },
        {
          en: "If we double one ingredient, what must we do to the other to keep the taste the same?",
          es: "Si duplicamos un ingrediente, ¿qué debemos hacer al otro para mantener el mismo sabor?",
        },
        {
          en: "Are we multiplying or dividing both numbers by the same value?",
          es: "¿Estamos multiplicando o dividiendo ambos números por el mismo valor?",
        },
      ],
      dontSay: [
        {
          en: "Just add the same number to both columns.",
          es: "Solo suma el mismo número a ambas columnas.",
        },
        {
          en: "Cross multiply and divide.",
          es: "Multiplica en cruz y divide.",
        },
        {
          en: "Don't write down the units, they don't matter.",
          es: "No escribas las unidades, no importan.",
        },
      ],
    },
    exponents: {
      say: [
        {
          en: "Remember, 3⁴ means 3 is multiplied 4 times: 3 × 3 × 3 × 3. What is the base?",
          es: "Recuerda, 3⁴ significa que 3 se multiplica 4 veces: 3 × 3 × 3 × 3. ¿Cuál es la base?",
        },
        {
          en: "Let's write it out as a multiplication chain first.",
          es: "Escribámoslo como una cadena de multiplicación primero.",
        },
        {
          en: "How does the exponent compare to adding 3 four times?",
          es: "¿Cómo se compara el exponente con sumar 3 cuatro veces?",
        },
      ],
      dontSay: [
        {
          en: "3⁴ is just 3 × 4.",
          es: "3⁴ es solo 3 × 4.",
        },
        {
          en: "The exponent is the number you multiply the base by.",
          es: "El exponente es el número por el que multiplicas la base.",
        },
        {
          en: "It doesn't matter what order you multiply.",
          es: "No importa en qué orden multipliques.",
        },
      ],
    },
    equations: {
      say: [
        {
          en: "An equation is like a balanced scale. If we do something to one side, what must we do to the other?",
          es: "Una ecuación es como una balanza equilibrada. Si hacemos algo a un lado, ¿qué debemos hacer al otro?",
        },
        {
          en: "What operation undoes addition? What operation undoes multiplication?",
          es: "¿Qué operación deshace la suma? ¿Qué operación deshace la multiplicación?",
        },
        {
          en: "Let's read the equation like a story: 'some number x plus 5 is 12'. What is the hidden number?",
          es: "Leamos la ecuación como una historia: 'un número x más 5 es 12'. ¿Cuál es el número oculto?",
        },
      ],
      dontSay: [
        {
          en: "Move the number to the other side and change the sign.",
          es: "Mueve el número al otro lado y cambia el signo.",
        },
        {
          en: "Just guess and check until it works.",
          es: "Solo adivina y prueba hasta que funcione.",
        },
        {
          en: "Leave the variable on whatever side it started without balancing.",
          es: "Deja la variable en el lado que comenzó sin equilibrar.",
        },
      ],
    },
    inequalities: {
      say: [
        {
          en: "Does the boundary circle need to be open (not included) or closed (included)?",
          es: "¿El círculo del límite debe estar abierto (no incluido) o cerrado (incluido)?",
        },
        {
          en: "Let's test a number like 0 or 10. Does it make the inequality true?",
          es: "Probemos un número como 0 o 10. ¿Hace que la desigualdad sea verdadera?",
        },
        {
          en: "Which direction should we shade to show all possible answers?",
          es: "¿En qué dirección debemos sombrear para mostrar todas las respuestas posibles?",
        },
      ],
      dontSay: [
        {
          en: "The arrow always points the same way as the inequality sign.",
          es: "La flecha siempre apunta en la misma dirección que el signo de desigualdad.",
        },
        {
          en: "There is only one single correct answer.",
          es: "Solo hay una única respuesta correcta.",
        },
        {
          en: "An inequality is exactly the same as an equation.",
          es: "Una desigualdad es exactamente lo mismo que una ecuación.",
        },
      ],
    },
    expressions: {
      say: [
        {
          en: "What is the difference between a variable (letter) and a coefficient (number multiplied by it)?",
          es: "¿Cuál es la diferencia entre una variable (letra) y un coeficiente (número multiplicado por ella)?",
        },
        {
          en: "Can we group the terms that look alike (like terms)?",
          es: "¿Podemos agrupar los términos que se parecen (términos semejantes)?",
        },
        {
          en: "Let's substitute a number for the variable and evaluate it.",
          es: "Sustituyamos un número en la variable y evaluémoslo.",
        },
      ],
      dontSay: [
        {
          en: "Just combine 3x and 5 to get 8x.",
          es: "Solo combina 3x y 5 para obtener 8x.",
        },
        {
          en: "Solve for x.",
          es: "Resuelve para x.",
        },
        {
          en: "Variables are just placeholder symbols that don't represent values.",
          es: "Las variables son solo símbolos de marcador de posición que no representan valores.",
        },
      ],
    },
    area: {
      say: [
        {
          en: "Let's identify the base and the height. Are they perpendicular (forming a 90-degree L-shape)?",
          es: "Identifiquemos la base y la altura. ¿Son perpendiculares (formando una L de 90 grados)?",
        },
        {
          en: "For a triangle, why do we divide the base × height by 2? How does it relate to a rectangle?",
          es: "Para un triángulo, ¿por qué dividimos la base × altura entre 2? ¿Cómo se relaciona con un rectángulo?",
        },
        {
          en: "Can we decompose this composite shape into smaller rectangles or triangles?",
          es: "¿Podemos descomponer esta figura compuesta en rectángulos o triángulos más pequeños?",
        },
      ],
      dontSay: [
        {
          en: "Use the slanted side as the height.",
          es: "Usa el lado inclinado como la altura.",
        },
        {
          en: "Area is just adding all the sides together.",
          es: "El área es solo sumar todos los lados.",
        },
        {
          en: "You always multiply by 1/2 for every shape.",
          es: "Siempre multiplicas por 1/2 para cada figura.",
        },
      ],
    },
    volume: {
      say: [
        {
          en: "Let's count how many cubes fit in the bottom layer first, then multiply by how many layers tall it is.",
          es: "Contemos cuántos cubos caben en la capa inferior primero, luego multipliquemos por cuántas capas de altura tiene.",
        },
        {
          en: "Volume is the space inside. How does base area relate to the length × width?",
          es: "El volumen es el espacio interior. ¿Cómo se relaciona el área de la base con el largo × ancho?",
        },
        {
          en: "What units do we use for volume? (Cubic units like in³).",
          es: "¿Qué unidades usamos para el volumen? (Unidades cúbicas como in³).",
        },
      ],
      dontSay: [
        {
          en: "Just add length, width, and height.",
          es: "Solo suma el largo, el ancho y la altura.",
        },
        {
          en: "Area and volume are the same thing.",
          es: "El área y el volumen son lo mismo.",
        },
        {
          en: "Use square units for volume.",
          es: "Usa unidades cuadradas para el volumen.",
        },
      ],
    },
    fractions: {
      say: [
        {
          en: "How many halves are in 3 wholes? Let's draw 3 circles and cut each in half.",
          es: "¿Cuántos medios hay en 3 enteros? Dibujemos 3 círculos y cortemos cada uno a la mitad.",
        },
        {
          en: "What does the reciprocal mean? How does dividing by a fraction relate to multiplying by its reciprocal?",
          es: "¿Qué significa el recíproco? ¿Cómo se relaciona dividir por una fracción con multiplicar por su recíproco?",
        },
        {
          en: "Can we write a story problem for this, like sharing food?",
          es: "¿Contamos una historia para esto, como compartir comida?",
        },
      ],
      dontSay: [
        {
          en: "Just flip and multiply without thinking why.",
          es: "Solo voltea y multiplica sin pensar por qué.",
        },
        {
          en: "The answer must always be smaller when you divide.",
          es: "La respuesta siempre debe ser menor cuando divides.",
        },
        {
          en: "Cross multiply the numerators directly.",
          es: "Multiplica en cruz los numeradores directamente.",
        },
      ],
    },
    decimals: {
      say: [
        {
          en: "Let's line up the decimal points. Why is place value important here?",
          es: "Alineemos los puntos decimales. ¿Por qué es importante el valor posicional aquí?",
        },
        {
          en: "If we multiply 0.5 by 0.2, what is a reasonable estimate? Is it larger or smaller than the factors?",
          es: "Si multiplicamos 0.5 por 0.2, ¿cuál es una estimación razonable? ¿Es mayor o menor que los factores?",
        },
        {
          en: "Let's think of decimals as money (cents). What is $1.50 plus $0.25?",
          es: "Pensemos en los decimales como dinero (centavos). ¿Cuánto es $1.50 más $0.25?",
        },
      ],
      dontSay: [
        {
          en: "Line up the numbers to the right like in whole numbers.",
          es: "Alinea los números a la derecha como en los números enteros.",
        },
        {
          en: "Just drop the decimal point down anywhere.",
          es: "Solo baja el punto decimal en cualquier lugar.",
        },
        {
          en: "Adding zeros at the end changes the value.",
          es: "Agregar ceros al final cambia el valor.",
        },
      ],
    },
    factors: {
      say: [
        {
          en: "Let's build a factor tree. What are two numbers that multiply to this number?",
          es: "Hagamos un árbol de factores. ¿Cuáles son dos números que multiplicados dan este número?",
        },
        {
          en: "Is this number prime (only 1 and itself) or composite (has other factors)?",
          es: "¿Este número es primo (solo 1 y sí mismo) o compuesto (tiene otros factores)?",
        },
        {
          en: "What is the Greatest Common Factor? What is the largest factor they share?",
          es: "¿Cuál es el Máximo Común Divisor? ¿Cuál es el factor más grande que comparten?",
        },
      ],
      dontSay: [
        {
          en: "Multiples and factors are the same.",
          es: "Los múltiplos y los factores son lo mismo.",
        },
        {
          en: "Every odd number is prime.",
          es: "Todo número impar es primo.",
        },
        {
          en: "Prime numbers always end in odd digits except 2.",
          es: "Los números primos siempre terminan en dígitos impares excepto el 2.",
        },
      ],
    },
  };

  const pick = tipsByTopic[topic] || {
    say: [
      {
        en: "What do you already know that could help?",
        es: "¿Qué ya sabes que podría ayudarte?",
      },
      {
        en: "Can you draw a picture or table for this?",
        es: "¿Puedes dibujar un dibujo o una tabla para esto?",
      },
      {
        en: "Let's check one step at a time — no rush.",
        es: "Revisemos un paso a la vez — sin prisa.",
      },
    ],
    dontSay: [
      {
        en: "That's wrong — let me just tell you.",
        es: "Está mal — déjame decírtelo yo.",
      },
      {
        en: "I was never good at math either.",
        es: "Yo tampoco era bueno en matemáticas.",
      },
      {
        en: "This should be easy.",
        es: "Esto debería ser fácil.",
      },
    ],
  };

  return pick;
}

/* ------------------------------------------------------------------
   BIG IDEA VISUALS
   Families read these on a phone, at night, often in a second
   language. Every visual below is drawn on a wide 640-unit canvas with
   oversized type (24-72 units) so the picture is legible when the SVG
   is scaled to a 340px phone column. The bilingual caption is NOT
   baked into the SVG — it is returned separately and rendered as HTML
   so the page language toggle can act on it and so the text scales
   with the reader's font settings.
   ------------------------------------------------------------------ */

const CONCEPT_TONES = {
  teal: { bg: "var(--fm-success-tint)", stroke: "var(--fm-m-part)" },
  amber: { bg: "var(--fm-m-unknown-tint)", stroke: "var(--fm-m-unknown-edge)" },
  coral: { bg: "var(--fm-m-unknown-tint)", stroke: "var(--fm-m-unknown-edge)" },
  navy: { bg: "var(--fm-m-whole-tint)", stroke: "var(--fm-primary)" },
};

/**
 * The figure heading, in ONE language.
 *
 * These titles are authored as "English / Espanol". Rendered literally, every
 * family reads the same idea twice inside the picture, which is the duplication
 * the page-level language control exists to remove. A `<span>` does not render
 * inside SVG `<text>`, so the split has to be two positioned `<text>` elements
 * carrying the language classes the page already toggles by class.
 *
 * English shows in English AND bilingual mode; Spanish replaces it only in
 * Spanish mode, because two `<text>` at the same y would otherwise overlap.
 * A title with no " / " (a worked line such as "Data: 2, 3, 3, 4, 8") is
 * language-neutral and renders once.
 */
function conceptHeading(title) {
  if (!title) return "";
  const at = String(title).indexOf(" / ");
  const attrs =
    'x="320" y="48" text-anchor="middle" font-size="27" font-weight="800" fill="var(--fm-primary)"';
  if (at === -1) return `<text ${attrs}>${title}</text>`;
  const en = title.slice(0, at).trim();
  const es = title.slice(at + 3).trim();
  if (!en || !es) return `<text ${attrs}>${title}</text>`;
  return `<text class="concept-title-en" ${attrs}>${en}</text><text class="concept-title-es" lang="es" ${attrs}>${es}</text>`;
}

function conceptFrame({ label, tone = "teal", height, title, body }) {
  const t = CONCEPT_TONES[tone] || CONCEPT_TONES.teal;
  const heading = conceptHeading(title);
  return `
      <svg viewBox="0 0 640 ${height}" class="concept-svg" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">
        <rect x="3" y="3" width="634" height="${height - 6}" rx="22" fill="${t.bg}" stroke="${t.stroke}" stroke-width="3"/>
        ${heading}
        ${body}
      </svg>`;
}

/** A soft white card used to hold a worked line inside a visual. */
function conceptCard(x, y, w, h, extra = "") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2" ${extra}/>`;
}

/**
 * One pack card for the 3-2 unit-rate comparison, worked in four LABELLED
 * steps inside its own boxes.
 *
 * The old card jumped from "$3.00 for 5 pencils" straight to "$0.60 per
 * pencil" with a single "$3.00 / 5 pencils =" line between them. The division
 * that produces the unit rate — and which number is the cost and which is the
 * amount — was left implicit, which is exactly the step a family at the
 * kitchen table needs to see. Each step is now its own box, the fraction is
 * written with its numerator and denominator named, and the denominator
 * division is shown before the 1 is dropped.
 */
function unitRatePack({ x, y, name, badgeFill, cost, count, noun, rate, best }) {
  const cx = x + 16;
  const w = 244;
  const money = (n) => `$${n.toFixed(2)}`;
  const box = (by, bh, fill = "var(--fm-raised)", stroke = "var(--fm-m-whole)") =>
    `<rect x="${cx}" y="${by}" width="${w}" height="${bh}" rx="9" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  const step = (by, n, label) =>
    `<text x="${cx + 10}" y="${by + 18}" font-size="12" font-weight="800" fill="var(--fm-m-part)">STEP ${n} · ${label}</text>`;

  const fracX = cx + 62;
  return `
        ${conceptCard(x, y, 276, 392)}
        <rect x="${cx}" y="${y + 14}" width="90" height="24" rx="6" fill="${badgeFill}"/>
        <text x="${cx + 45}" y="${y + 31}" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-text-inverse)">${name}</text>
        <text x="${cx}" y="${y + 62}" font-size="18" font-weight="800" fill="var(--fm-primary)">${money(cost)} for ${count} ${noun}s</text>

        ${box(y + 76, 82)}
        ${step(y + 76, 1, "Rate as a fraction")}
        <text x="${fracX}" y="${y + 114}" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-primary)">${money(cost)}</text>
        <line x1="${cx + 18}" y1="${y + 122}" x2="${cx + 106}" y2="${y + 122}" stroke="var(--fm-primary)" stroke-width="2.5"/>
        <text x="${fracX}" y="${y + 144}" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-primary)">${count} ${noun}s</text>
        <text x="${cx + 116}" y="${y + 114}" font-size="11" font-weight="700" fill="var(--fm-text-muted)">← cost (top)</text>
        <text x="${cx + 116}" y="${y + 144}" font-size="11" font-weight="700" fill="var(--fm-text-muted)">← units (bottom)</text>

        ${box(y + 164, 82)}
        ${step(y + 164, 2, "Divide both by " + count)}
        <text x="${fracX}" y="${y + 202}" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-m-part)">${money(cost)} ÷ ${count}</text>
        <line x1="${cx + 18}" y1="${y + 210}" x2="${cx + 106}" y2="${y + 210}" stroke="var(--fm-m-part)" stroke-width="2.5"/>
        <text x="${fracX}" y="${y + 232}" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-m-part)">${count} ÷ ${count}</text>
        <text x="${cx + 116}" y="${y + 218}" font-size="11" font-weight="700" fill="var(--fm-m-part)">divide both</text>

        ${box(y + 252, 92, best ? "var(--fm-success-tint)" : "var(--fm-m-whole-tint)", best ? "var(--fm-success)" : "var(--fm-m-whole)")}
        ${step(y + 252, 3, "Unit rate: fraction over 1")}
        <text x="${fracX}" y="${y + 290}" text-anchor="middle" font-size="17" font-weight="800" fill="${best ? "var(--fm-success-ink)" : "var(--fm-primary)"}">${money(rate)}</text>
        <line x1="${cx + 18}" y1="${y + 298}" x2="${cx + 106}" y2="${y + 298}" stroke="${best ? "var(--fm-success)" : "var(--fm-primary)"}" stroke-width="2.5"/>
        <text x="${fracX}" y="${y + 318}" text-anchor="middle" font-size="16" font-weight="800" fill="${best ? "var(--fm-success-ink)" : "var(--fm-primary)"}">1 ${noun}</text>
        <text x="${cx + 116}" y="${y + 306}" font-size="13" font-weight="800" fill="${best ? "var(--fm-success-ink)" : "var(--fm-primary)"}">= ${money(rate)}/${noun}</text>

        <rect x="${cx}" y="${y + 352}" width="${w}" height="26" rx="8" fill="${best ? "var(--fm-success-tint)" : "var(--fm-m-whole-tint)"}" stroke="${best ? "var(--fm-success)" : "var(--fm-m-whole)"}" stroke-width="1.5"/>
        <text x="${cx + w / 2}" y="${y + 370}" text-anchor="middle" font-size="13" font-weight="800" fill="${best ? "var(--fm-success-ink)" : "var(--fm-text-muted)"}">${best ? "★ LOWER unit rate = BETTER BUY!" : "Higher cost for 1"}</text>`;
}

/** One numbered "do this" row inside a visual. */
function conceptRow(y, n, text, color = "var(--fm-primary)") {
  return `${conceptCard(34, y, 572, 62)}
        <circle cx="70" cy="${y + 31}" r="21" fill="${color}"/>
        <text x="70" y="${y + 39}" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-text-inverse)">${n}</text>
        <text x="104" y="${y + 40}" font-size="27" font-weight="700" fill="var(--fm-primary)">${text}</text>`;
}

function conceptVisual(config) {
  const exact = exactConceptVisual(config || {});
  if (exact) return exact;
  const topic = detectVisualTopic(config);
  const lessonId = String(config.lessonId || config.id || "").replace(/^lesson-/, "");
  const baseLesson = lessonId.replace(/-(?:part\d|group\d|catchup)$/, "");

  if (baseLesson === "1-practice") {
    const tapeCells = [0, 1, 2, 3, 4, 5]
      .map((i) => {
        const cx = 74 + i * 82;
        const isWhole = i < 4;
        const fill = isWhole
          ? i % 2 === 0
            ? "var(--fm-m-whole-tint)"
            : "var(--fm-raised)"
          : i % 2 === 0
            ? "var(--fm-m-unknown-tint)"
            : "var(--fm-raised)";
        const stroke = isWhole ? "var(--fm-m-whole)" : "var(--fm-m-unknown-edge)";
        const textFill = isWhole ? "var(--fm-m-whole)" : "var(--fm-m-unknown)";
        const numBg = isWhole ? "var(--fm-m-whole)" : "var(--fm-m-unknown)";
        return `
          <rect x="${cx}" y="120" width="82" height="38" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
          <text x="${cx + 41}" y="144" text-anchor="middle" font-size="15" font-weight="800" fill="${textFill}">¼ yd</text>
          <circle cx="${cx + 41}" cy="176" r="11" fill="${numBg}"/>
          <text x="${cx + 41}" y="180" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-text-inverse)">${i + 1}</text>
          <text x="${cx + 41}" y="196" text-anchor="middle" font-size="11" font-weight="700" fill="var(--fm-text-muted)">Bow ${i + 1}</text>`;
      })
      .join("");

    return {
      svg: conceptFrame({
        label:
          "Unit 1 Practice Test: Dividing 1 1/2 yards by 1/4 yard shows 6 bows with a tape diagram and Keep Change Flip",
        tone: "coral",
        height: 456,
        title: "Dividing Fractions: Tape Diagram & Steps / Dividir fracciones: Diagrama y pasos",
        body: `
        <!-- Tape Diagram Card -->
        ${conceptCard(34, 66, 572, 166)}
        <rect x="52" y="78" width="180" height="22" rx="6" fill="var(--fm-m-part)"/>
        <text x="142" y="94" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-text-inverse)">TAPE DIAGRAM (STRIP)</text>
        <text x="250" y="94" font-size="15" font-weight="800" fill="var(--fm-primary)">Total: 1 ½ yards of ribbon ÷ ¼ yd per bow</text>

        <!-- Brackets above tape -->
        <line x1="74" y1="112" x2="402" y2="112" stroke="var(--fm-m-whole)" stroke-width="2"/>
        <text x="238" y="108" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-m-whole)">1 Whole Yard (4 fourths)</text>
        <line x1="402" y1="112" x2="566" y2="112" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
        <text x="484" y="108" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-m-unknown)">½ Yard (2 fourths)</text>

        <!-- Tape Cells -->
        ${tapeCells}

        <!-- Tape Summary -->
        <text x="320" y="218" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-m-part)">4 fourths + 2 fourths = 6 fourths in all  ➔  6 Whole Bows</text>

        <!-- Check With Numbers Card -->
        ${conceptCard(34, 244, 278, 196)}
        <rect x="48" y="256" width="168" height="22" rx="5" fill="var(--fm-m-whole)"/>
        <text x="132" y="271" text-anchor="middle" font-size="11" font-weight="800" fill="var(--fm-text-inverse)">CHECK WITH NUMBERS</text>
        <text x="50" y="298" font-size="13" font-weight="700" fill="var(--fm-text-muted)">1. Mixed to improper fraction:</text>
        <text x="50" y="320" font-size="17" font-weight="800" fill="var(--fm-primary)">1 ½  =  3/2</text>
        <text x="50" y="348" font-size="13" font-weight="700" fill="var(--fm-text-muted)">2. Keep · Change · Flip:</text>
        <text x="50" y="370" font-size="17" font-weight="800" fill="var(--fm-m-part)">3/2  ×  4/1  =  12/2</text>
        <text x="50" y="398" font-size="13" font-weight="700" fill="var(--fm-text-muted)">3. Divide to simplify:</text>
        <text x="50" y="422" font-size="19" font-weight="800" fill="var(--fm-m-whole)">12/2  =  6 bows</text>

        <!-- Watch For on the Test Card -->
        ${conceptCard(328, 244, 278, 196)}
        <rect x="342" y="256" width="176" height="22" rx="5" fill="var(--fm-m-unknown)"/>
        <text x="430" y="271" text-anchor="middle" font-size="11" font-weight="800" fill="var(--fm-text-inverse)">WATCH FOR ON THE TEST</text>
        <circle cx="348" cy="298" r="4" fill="var(--fm-m-part)"/>
        <text x="360" y="302" font-size="12" font-weight="700" fill="var(--fm-primary)">Turn mixed numbers to fractions 1st</text>
        <circle cx="348" cy="324" r="4" fill="var(--fm-m-whole)"/>
        <text x="360" y="328" font-size="12" font-weight="700" fill="var(--fm-primary)">Flip ONLY the 2nd fraction (divisor)</text>
        <circle cx="348" cy="350" r="4" fill="var(--fm-m-unknown)"/>
        <text x="360" y="354" font-size="12" font-weight="800" fill="var(--fm-m-unknown)">What Leftovers Mean (Q4A &amp; 4B):</text>
        <rect x="342" y="364" width="250" height="62" rx="8" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="1.5"/>
        <text x="352" y="385" font-size="12" font-weight="700" fill="var(--fm-primary)">3 ½ batches = 3 FULL batches.</text>
        <text x="352" y="405" font-size="12" font-weight="700" fill="var(--fm-m-unknown)">The ½ is half a batch, not a cup!</text>`,
      }),
      capEn:
        "Dividing by a fraction asks how many small pieces fit inside the total amount. Convert mixed numbers first, then Keep, Change, Flip.",
      capEs:
        "Dividir entre una fracción pregunta cuántas partes pequeñas caben en el total. Convierte los números mixtos primero y luego Mantén, Cambia, Voltea.",
    };
  }

  if (baseLesson === "3-1") {
    return {
      svg: conceptFrame({
        label:
          "Ratios: 4 cups of water and 2 cups of lemon juice comparing part to part and part to whole",
        tone: "teal",
        height: 410,
        title: "Understand Ratios / ¿Qué es una razón?",
        body: `
        <!-- Part to Part Card -->
        ${conceptCard(34, 68, 276, 172)}
        <text x="172" y="96" text-anchor="middle" font-size="17" font-weight="800" fill="var(--fm-m-part)">PART-TO-PART RATIO</text>
        <g transform="translate(56, 110)">
          <rect x="0" y="0" width="24" height="32" rx="5" fill="var(--fm-m-part)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <rect x="30" y="0" width="24" height="32" rx="5" fill="var(--fm-m-part)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <rect x="60" y="0" width="24" height="32" rx="5" fill="var(--fm-m-part)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <rect x="90" y="0" width="24" height="32" rx="5" fill="var(--fm-m-part)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="57" y="48" text-anchor="middle" font-size="13" font-weight="700" fill="var(--fm-m-whole)">4 Water</text>
        </g>
        <g transform="translate(196, 110)">
          <rect x="0" y="0" width="24" height="32" rx="5" fill="var(--fm-m-unknown)" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
          <rect x="30" y="0" width="24" height="32" rx="5" fill="var(--fm-m-unknown)" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
          <text x="27" y="48" text-anchor="middle" font-size="13" font-weight="700" fill="var(--fm-m-unknown)">2 Juice</text>
        </g>
        <text x="172" y="196" text-anchor="middle" font-size="28" font-weight="800" fill="var(--fm-primary)">4 : 2  or  2 : 1</text>
        <text x="172" y="222" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fm-text-muted)">Water to Lemon Juice</text>

        <!-- Part to Whole Card -->
        ${conceptCard(330, 68, 276, 172)}
        <text x="468" y="96" text-anchor="middle" font-size="17" font-weight="800" fill="var(--fm-m-whole)">PART-TO-WHOLE RATIO</text>
        <g transform="translate(362, 110)">
          <rect x="0" y="0" width="24" height="32" rx="5" fill="var(--fm-m-part)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <rect x="28" y="0" width="24" height="32" rx="5" fill="var(--fm-m-part)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <rect x="56" y="0" width="24" height="32" rx="5" fill="var(--fm-m-part)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <rect x="84" y="0" width="24" height="32" rx="5" fill="var(--fm-m-part)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <rect x="120" y="0" width="24" height="32" rx="5" fill="var(--fm-m-unknown)" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
          <rect x="148" y="0" width="24" height="32" rx="5" fill="var(--fm-m-unknown)" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
          <text x="106" y="48" text-anchor="middle" font-size="13" font-weight="700" fill="var(--fm-primary)">6 Total Cups in Mixture</text>
        </g>
        <text x="468" y="196" text-anchor="middle" font-size="28" font-weight="800" fill="var(--fm-primary)">4 : 6  or  2 : 3</text>
        <text x="468" y="222" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fm-text-muted)">Water to Total Mixture</text>

        <!-- Order Matters Callout -->
        <rect x="34" y="254" width="572" height="136" rx="14" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
        <rect x="52" y="268" width="168" height="26" rx="6" fill="var(--fm-m-unknown)"/>
        <text x="136" y="286" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-text-inverse)">ORDER MATTERS!</text>
        <text x="52" y="322" font-size="18" font-weight="800" fill="var(--fm-primary)">Water to Juice = 4 : 2</text>
        <text x="320" y="322" font-size="18" font-weight="800" fill="var(--fm-m-unknown)">Juice to Water = 2 : 4</text>
        <text x="52" y="354" font-size="15" font-weight="700" fill="var(--fm-text-muted)">Always write numbers in the exact order the question names them!</text>
        <text x="52" y="376" font-size="14" font-weight="700" fill="var(--fm-m-part)">Three ways to write a ratio:  4 to 2   ·   4 : 2   ·   4/2</text>`,
      }),
      capEn:
        "A ratio compares two quantities. The order of numbers must match the order of words in the question.",
      capEs:
        "Una razón compara dos cantidades. El orden de los números debe coincidir con el orden de las palabras.",
    };
  }

  if (baseLesson === "3-2") {
    return {
      svg: conceptFrame({
        label:
          "Rates and Unit Rates: each pack worked step by step — rate as a fraction, divide both by bottom number, unit rate as fraction over 1",
        tone: "amber",
        height: 640,
        title: "Rates & Unit Rates / Tasa y tasa unitaria",
        body: `
        <!-- Each pack worked in three labelled steps; see unitRatePack(). -->
        ${unitRatePack({
          x: 34,
          y: 68,
          name: "PACK A",
          badgeFill: "var(--fm-m-part)",
          cost: 3.0,
          count: 5,
          noun: "pencil",
          rate: 0.6,
          best: true,
        })}
        ${unitRatePack({
          x: 330,
          y: 68,
          name: "PACK B",
          badgeFill: "var(--fm-inverse)",
          cost: 5.2,
          count: 8,
          noun: "pencil",
          rate: 0.65,
          best: false,
        })}

        <!-- Formula Rule Card -->
        <rect x="34" y="476" width="572" height="140" rx="14" fill="var(--fm-success-tint)" stroke="var(--fm-m-part)" stroke-width="2"/>
        <text x="320" y="506" text-anchor="middle" font-size="19" font-weight="800" fill="var(--fm-m-part)">Unit Rate = Rate written as a fraction over 1</text>
        <line x1="60" y1="520" x2="580" y2="520" stroke="var(--fm-success)" stroke-width="2"/>
        <text x="320" y="546" text-anchor="middle" font-size="15" font-weight="700" fill="var(--fm-primary)">1. Write rate as fraction: Cost on TOP, Units on BOTTOM.</text>
        <text x="320" y="572" text-anchor="middle" font-size="15" font-weight="700" fill="var(--fm-primary)">2. Divide BOTH parts by the bottom number.</text>
        <text x="320" y="598" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-m-part)">3. Unit rate is in fraction form over 1: ($0.60 / 1 pencil = $0.60 per pencil).</text>`,
      }),
      capEn:
        "A unit rate is a ratio that compares a quantity to 1 unit. Write the rate as a fraction and divide both parts by the bottom number to get a fraction over 1.",
      capEs:
        "Una tasa unitaria es una razón que compara una cantidad con 1 unidad. Escribe la tasa como fracción y divide ambas partes entre el número de abajo para obtener una fracción sobre 1.",
    };
  }

  if (baseLesson === "3-3") {
    return {
      svg: conceptFrame({
        label:
          "Ratio Table Scaling: apply the same scale factor to each quantity to create an equivalent ratio",
        tone: "teal",
        height: 420,
        title: "Ratio Table Scaling / Tabla de razones",
        body: `
        <!-- Table on Left -->
        <g transform="translate(34, 68)">
          <!-- Headers -->
          <rect x="0" y="0" width="100" height="42" rx="8" fill="var(--fm-primary)"/>
          <text x="50" y="27" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-text-inverse)">Batches</text>
          <rect x="108" y="0" width="116" height="42" rx="8" fill="var(--fm-m-part)"/>
          <text x="166" y="27" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-text-inverse)">Mix (cups)</text>
          <rect x="232" y="0" width="116" height="42" rx="8" fill="var(--fm-m-part)"/>
          <text x="290" y="27" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-text-inverse)">Milk (cups)</text>

          <!-- Row 1 -->
          <rect x="0" y="48" width="100" height="44" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="50" y="79" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-primary)">1</text>
          <rect x="108" y="48" width="116" height="44" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="166" y="79" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-m-part)">2</text>
          <rect x="232" y="48" width="116" height="44" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="290" y="79" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-m-part)">3</text>

          <!-- Row 2 -->
          <rect x="0" y="98" width="100" height="44" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="50" y="129" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-primary)">2</text>
          <rect x="108" y="98" width="116" height="44" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="166" y="129" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-m-part)">4</text>
          <rect x="232" y="98" width="116" height="44" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="290" y="129" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-m-part)">6</text>

          <!-- Row 3 -->
          <rect x="0" y="148" width="100" height="44" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="50" y="179" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-primary)">3</text>
          <rect x="108" y="148" width="116" height="44" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="166" y="179" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-m-part)">6</text>
          <rect x="232" y="148" width="116" height="44" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="290" y="179" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-m-part)">9</text>

          <!-- Row 4 -->
          <rect x="0" y="198" width="100" height="44" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="50" y="229" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-primary)">4</text>
          <rect x="108" y="198" width="116" height="44" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="166" y="229" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-m-part)">8</text>
          <rect x="232" y="198" width="116" height="44" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="290" y="229" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-m-part)">12</text>
        </g>

        <!-- Right Side Rules -->
        <g transform="translate(394, 68)">
          <!-- Multiply Rule -->
          <rect x="0" y="0" width="212" height="114" rx="12" fill="var(--fm-success-tint)" stroke="var(--fm-success)" stroke-width="2"/>
          <text x="16" y="27" font-size="14" font-weight="800" fill="var(--fm-success-ink)">✔ USE THE SAME FACTOR: ×2</text>
          <text x="16" y="54" font-size="15" font-weight="700" fill="var(--fm-primary)">Mix:  2 × 2 = 4</text>
          <text x="16" y="78" font-size="15" font-weight="700" fill="var(--fm-primary)">Milk: 3 × 2 = 6</text>
          <text x="16" y="101" font-size="13" font-weight="700" fill="var(--fm-success-ink)">Both quantities use ×2.</text>

          <!-- Add Contrast Bug -->
          <rect x="0" y="128" width="212" height="114" rx="12" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
          <text x="16" y="156" font-size="14" font-weight="800" fill="var(--fm-m-unknown)">✗ NEVER ADD (+):</text>
          <text x="16" y="184" font-size="14" font-weight="700" fill="var(--fm-primary)">2 + 1 = 3   and   3 + 1 = 4</text>
          <text x="16" y="208" font-size="15" font-weight="800" fill="var(--fm-m-unknown)">3 : 4 ≠ 2 : 3</text>
          <text x="16" y="230" font-size="13" font-weight="700" fill="var(--fm-m-unknown)">Adding breaks the ratio!</text>
        </g>

        <!-- Bottom Summary Card -->
        ${conceptCard(34, 324, 572, 76)}
        <text x="320" y="356" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-m-part)">Equivalent Ratios:  2 : 3  =  4 : 6  =  6 : 9  =  8 : 12</text>
        <text x="320" y="384" text-anchor="middle" font-size="15" font-weight="700" fill="var(--fm-text-muted)">Multiply or divide every quantity in the ratio table by the same scale factor.</text>`,
      }),
      capEn:
        "Multiply or divide BOTH columns by the exact same scale factor to find equivalent ratios in a ratio table.",
      capEs:
        "Multipliquen o dividan AMBAS columnas por el mismo factor para hallar razones equivalentes en una tabla de razones.",
    };
  }

  if (baseLesson === "3-4") {
    const ox = 74;
    const oy = 320;
    const u = 54;
    return {
      svg: conceptFrame({
        label:
          "Graphing Equivalent Ratios: Ordered pairs on a coordinate plane forming a straight ray from the origin (0, 0)",
        tone: "amber",
        height: 420,
        title: "Graphing Equivalent Ratios / Gráfica de razones",
        body: `
        <!-- Coordinate Grid -->
        <g stroke="var(--fm-m-whole)" stroke-width="1.5">
          ${[0, 1, 2, 3, 4].map((i) => `<line x1="${ox + i * u}" y1="${oy - 4 * u}" x2="${ox + i * u}" y2="${oy}"/>`).join("")}
          ${[0, 1, 2, 3, 4].map((i) => `<line x1="${ox}" y1="${oy - i * u}" x2="${ox + 4 * u}" y2="${oy - i * u}"/>`).join("")}
        </g>
        <!-- Axes -->
        <line x1="${ox}" y1="${oy}" x2="${ox + 4 * u + 18}" y2="${oy}" stroke="var(--fm-primary)" stroke-width="3"/>
        <line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy - 4 * u - 18}" stroke="var(--fm-primary)" stroke-width="3"/>
        <!-- Arrowheads -->
        <path d="M${ox + 4 * u + 18} ${oy - 5} L${ox + 4 * u + 28} ${oy} L${ox + 4 * u + 18} ${oy + 5} Z" fill="var(--fm-primary)"/>
        <path d="M${ox - 5} ${oy - 4 * u - 18} L${ox} ${oy - 4 * u - 28} L${ox + 5} ${oy - 4 * u - 18} Z" fill="var(--fm-primary)"/>
        
        <!-- Axis Labels -->
        <text x="${ox + 2 * u}" y="${oy + 38}" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-primary)">Batches (x-axis)</text>
        <text x="${ox - 46}" y="${oy - 2 * u}" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-primary)" transform="rotate(-90 ${ox - 46} ${oy - 2 * u})">Milk Cups (y-axis)</text>

        <!-- Ticks on x-axis -->
        ${[0, 1, 2, 3, 4].map((i) => `<text x="${ox + i * u}" y="${oy + 18}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--fm-text-muted)">${i}</text>`).join("")}
        <!-- Ticks on y-axis (0, 3, 6, 9, 12 cups) -->
        ${[0, 1, 2, 3, 4].map((i) => `<text x="${ox - 12}" y="${oy - i * u + 5}" text-anchor="end" font-size="13" font-weight="700" fill="var(--fm-text-muted)">${i * 3}</text>`).join("")}

        <!-- Straight Ray through Origin -->
        <line x1="${ox}" y1="${oy}" x2="${ox + 3.8 * u}" y2="${oy - 3.8 * u}" stroke="var(--fm-m-part)" stroke-width="4"/>

        <!-- Points Plotted -->
        <circle cx="${ox}" cy="${oy}" r="6" fill="var(--fm-primary)"/>
        <text x="${ox + 10}" y="${oy - 10}" font-size="13" font-weight="800" fill="var(--fm-primary)">(0, 0)</text>
        <circle cx="${ox + u}" cy="${oy - u}" r="7" fill="var(--fm-m-part)" stroke="var(--fm-border)" stroke-width="2"/>
        <text x="${ox + u + 10}" y="${oy - u - 6}" font-size="14" font-weight="800" fill="var(--fm-m-part)">(1, 3)</text>
        <circle cx="${ox + 2 * u}" cy="${oy - 2 * u}" r="7" fill="var(--fm-m-part)" stroke="var(--fm-border)" stroke-width="2"/>
        <text x="${ox + 2 * u + 10}" y="${oy - 2 * u - 6}" font-size="14" font-weight="800" fill="var(--fm-m-part)">(2, 6)</text>
        <circle cx="${ox + 3 * u}" cy="${oy - 3 * u}" r="7" fill="var(--fm-m-part)" stroke="var(--fm-border)" stroke-width="2"/>
        <text x="${ox + 3 * u + 10}" y="${oy - 3 * u - 6}" font-size="14" font-weight="800" fill="var(--fm-m-part)">(3, 9)</text>

        <!-- Right Side Explainer Cards -->
        <g transform="translate(324, 68)">
          <!-- Ordered Pairs Card -->
          ${conceptCard(0, 0, 282, 140)}
          <text x="14" y="26" font-size="16" font-weight="800" fill="var(--fm-primary)">Ordered Pairs from Ratio Table:</text>
          <text x="14" y="54" font-size="15" font-weight="700" fill="var(--fm-m-part)">1 batch : 3 cups  →  (1, 3)</text>
          <text x="14" y="78" font-size="15" font-weight="700" fill="var(--fm-m-part)">2 batches : 6 cups  →  (2, 6)</text>
          <text x="14" y="102" font-size="15" font-weight="700" fill="var(--fm-m-part)">3 batches : 9 cups  →  (3, 9)</text>
          <text x="14" y="126" font-size="13" font-weight="700" fill="var(--fm-text-muted)">(x = across on x-axis, y = up on y-axis)</text>

          <!-- Key Rules Card -->
          <rect x="0" y="152" width="282" height="172" rx="14" fill="var(--fm-success-tint)" stroke="var(--fm-success)" stroke-width="2"/>
          <text x="14" y="178" font-size="16" font-weight="800" fill="var(--fm-success-ink)">✔ 2 BIG CLUES FOR RATIOS:</text>
          <text x="14" y="206" font-size="15" font-weight="800" fill="var(--fm-primary)">1. Starts at the Origin (0, 0)</text>
          <text x="14" y="226" font-size="13" font-weight="600" fill="var(--fm-text-muted)">0 batches need 0 cups of milk.</text>
          <text x="14" y="254" font-size="15" font-weight="800" fill="var(--fm-primary)">2. Forms a Straight Ray</text>
          <text x="14" y="274" font-size="13" font-weight="600" fill="var(--fm-text-muted)">Points line up in a straight path.</text>
          <text x="14" y="304" font-size="14" font-weight="800" fill="var(--fm-success-ink)">If it curves, it is NOT equivalent!</text>
        </g>`,
      }),
      capEn:
        "Plotting equivalent ratios as ordered pairs on a coordinate plane creates a straight ray starting at the origin (0, 0).",
      capEs:
        "Graficar razones equivalentes como pares ordenados en el plano de coordenadas forma un rayo recto que inicia en el origen (0, 0).",
    };
  }

  if (baseLesson === "3-5") {
    return {
      svg: conceptFrame({
        label: "Two cocoa recipes compared using the same amount of milk",
        tone: "teal",
        height: 390,
        title: "Compare cocoa recipes / Comparar recetas de chocolate",
        body: `
        ${conceptCard(34, 70, 572, 96)}
        <text x="54" y="102" font-size="18" font-weight="800" fill="var(--fm-primary)">Chef Reyes: 3 cocoa for 5 milk</text>
        <text x="54" y="134" font-size="18" font-weight="700" fill="var(--fm-m-part)">Multiply both by 7 → 21 cocoa for 35 milk</text>
        ${conceptCard(34, 180, 572, 96)}
        <text x="54" y="212" font-size="18" font-weight="800" fill="var(--fm-primary)">Chef Tran: 4 cocoa for 7 milk</text>
        <text x="54" y="244" font-size="18" font-weight="700" fill="var(--fm-m-whole)">Multiply both by 5 → 20 cocoa for 35 milk</text>
        <rect x="34" y="290" width="572" height="76" rx="14" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
        <text x="320" y="320" text-anchor="middle" font-size="19" font-weight="800" fill="var(--fm-primary)">Same milk: 35 ounces each</text>
        <text x="320" y="348" text-anchor="middle" font-size="18" font-weight="800" fill="var(--fm-m-unknown)">21 &gt; 20, so Reyes has more cocoa.</text>`,
      }),
      capEn:
        "Make the milk amounts equal before comparing the cocoa. Reyes has 21 tablespoons for 35 ounces; Tran has 20 for 35 ounces.",
      capEs:
        "Iguala las cantidades de leche antes de comparar el cacao. Reyes usa 21 cucharadas por 35 onzas; Tran usa 20 por 35 onzas.",
    };
  }

  if (baseLesson === "3-6") {
    return {
      svg: conceptFrame({
        label:
          "Measurement Conversion Ladder: Converting yards to feet to inches using ratios and multiplication",
        tone: "teal",
        height: 420,
        title: "Measurement Conversion Ladder / Conversión de medidas",
        body: `
        <!-- Ladder Top: 3 Unit Boxes -->
        <g transform="translate(44, 68)">
          <!-- Yards -->
          <rect x="0" y="0" width="130" height="60" rx="10" fill="var(--fm-primary)"/>
          <text x="65" y="36" text-anchor="middle" font-size="20" font-weight="800" fill="var(--fm-text-inverse)">Yards (yd)</text>
          
          <!-- Arrow 1: × 3 -->
          <path d="M142 22 L198 22" stroke="var(--fm-m-part)" stroke-width="3"/>
          <path d="M192 16 L202 22 L192 28 Z" fill="var(--fm-m-part)"/>
          <text x="170" y="16" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-m-part)">× 3</text>
          <!-- Reverse Arrow: ÷ 3 -->
          <path d="M198 42 L142 42" stroke="var(--fm-m-unknown-edge)" stroke-width="2.5"/>
          <path d="M148 36 L138 42 L148 48 Z" fill="var(--fm-m-unknown)"/>
          <text x="170" y="58" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-m-unknown)">÷ 3</text>

          <!-- Feet -->
          <rect x="210" y="0" width="130" height="60" rx="10" fill="var(--fm-m-part)"/>
          <text x="275" y="36" text-anchor="middle" font-size="20" font-weight="800" fill="var(--fm-text-inverse)">Feet (ft)</text>

          <!-- Arrow 2: × 12 -->
          <path d="M352 22 L408 22" stroke="var(--fm-m-part)" stroke-width="3"/>
          <path d="M402 16 L412 22 L402 28 Z" fill="var(--fm-m-part)"/>
          <text x="380" y="16" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-m-part)">× 12</text>
          <!-- Reverse Arrow: ÷ 12 -->
          <path d="M408 42 L352 42" stroke="var(--fm-m-unknown-edge)" stroke-width="2.5"/>
          <path d="M358 36 L348 42 L358 48 Z" fill="var(--fm-m-unknown)"/>
          <text x="380" y="58" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-m-unknown)">÷ 12</text>

          <!-- Inches -->
          <rect x="420" y="0" width="130" height="60" rx="10" fill="var(--fm-m-unknown)"/>
          <text x="485" y="36" text-anchor="middle" font-size="20" font-weight="800" fill="var(--fm-text-inverse)">Inches (in)</text>
        </g>

        <!-- Worked Example Card -->
        ${conceptCard(34, 156, 572, 136)}
        <text x="54" y="186" font-size="17" font-weight="800" fill="var(--fm-primary)">Example: Convert 4 yards to inches</text>
        <text x="54" y="216" font-size="16" font-weight="700" fill="var(--fm-m-part)">Step 1: 4 yards × 3 = 12 feet  (ratio of feet to yards = 3:1)</text>
        <text x="54" y="244" font-size="16" font-weight="700" fill="var(--fm-m-part)">Step 2: 12 feet × 12 = 144 inches  (ratio of inches to feet = 12:1)</text>
        <text x="54" y="274" font-size="20" font-weight="800" fill="var(--fm-primary)">Result: <tspan fill="var(--fm-m-part)">4 yards = 144 inches</tspan></text>

        <!-- Rule Card -->
        <g transform="translate(34, 308)">
          <rect x="0" y="0" width="276" height="92" rx="12" fill="var(--fm-success-tint)" stroke="var(--fm-success)" stroke-width="2"/>
          <text x="138" y="34" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-success-ink)">BIGGER → SMALLER</text>
          <text x="138" y="64" text-anchor="middle" font-size="18" font-weight="800" fill="var(--fm-primary)">MULTIPLY  (×)</text>
          <text x="138" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fm-text-muted)">Yards to feet: multiply by 3</text>

          <rect x="296" y="0" width="276" height="92" rx="12" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
          <text x="434" y="34" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-m-unknown)">SMALLER → BIGGER</text>
          <text x="434" y="64" text-anchor="middle" font-size="18" font-weight="800" fill="var(--fm-primary)">DIVIDE  (÷)</text>
          <text x="434" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fm-text-muted)">Inches to feet: divide by 12</text>
        </g>`,
      }),
      capEn:
        "Use equivalent ratios to convert measurements: multiply when going to smaller units, divide when going to larger units.",
      capEs:
        "Usen razones equivalentes para convertir medidas: multipliquen al cambiar a unidades menores, dividan al cambiar a mayores.",
    };
  }

  if (baseLesson === "3-7") {
    return {
      svg: conceptFrame({
        label:
          "Converting Between Measurement Systems: Customary to metric using approximate ratio conversions",
        tone: "amber",
        height: 420,
        title: "Converting Between Systems / Conversión entre sistemas",
        body: `
        <!-- Distance Dual Bar -->
        ${conceptCard(34, 68, 572, 108)}
        <rect x="50" y="80" width="160" height="24" rx="6" fill="var(--fm-primary)"/>
        <text x="130" y="97" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">DISTANCE (mi ↔ km)</text>
        <text x="226" y="97" font-size="16" font-weight="800" fill="var(--fm-m-unknown)">1 mile ≈ 1.61 kilometers</text>
        <g transform="translate(50, 116)">
          <rect x="0" y="0" width="180" height="36" rx="8" fill="var(--fm-m-whole-tint)" stroke="var(--fm-m-whole)" stroke-width="1.5"/>
          <text x="90" y="23" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-m-whole)">5 miles</text>
          <text x="200" y="23" font-size="20" font-weight="800" fill="var(--fm-primary)">×</text>
          <rect x="226" y="0" width="90" height="36" rx="8" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="1.5"/>
          <text x="271" y="23" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-m-unknown)">1.61</text>
          <text x="330" y="23" font-size="20" font-weight="800" fill="var(--fm-primary)">≈</text>
          <rect x="354" y="0" width="168" height="36" rx="8" fill="var(--fm-success-tint)" stroke="var(--fm-success)" stroke-width="1.5"/>
          <text x="438" y="23" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-success-ink)">8.05 kilometers</text>
        </g>

        <!-- Weight Dual Bar -->
        ${conceptCard(34, 188, 572, 108)}
        <rect x="50" y="200" width="160" height="24" rx="6" fill="var(--fm-m-part)"/>
        <text x="130" y="217" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">WEIGHT (kg ↔ lb)</text>
        <text x="226" y="217" font-size="16" font-weight="800" fill="var(--fm-m-unknown)">1 kilogram ≈ 2.20 pounds</text>
        <g transform="translate(50, 236)">
          <rect x="0" y="0" width="180" height="36" rx="8" fill="var(--fm-m-whole-tint)" stroke="var(--fm-m-whole)" stroke-width="1.5"/>
          <text x="90" y="23" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-m-whole)">10 kilograms</text>
          <text x="200" y="23" font-size="20" font-weight="800" fill="var(--fm-primary)">×</text>
          <rect x="226" y="0" width="90" height="36" rx="8" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="1.5"/>
          <text x="271" y="23" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-m-unknown)">2.20</text>
          <text x="330" y="23" font-size="20" font-weight="800" fill="var(--fm-primary)">≈</text>
          <rect x="354" y="0" width="168" height="36" rx="8" fill="var(--fm-success-tint)" stroke="var(--fm-success)" stroke-width="1.5"/>
          <text x="438" y="23" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-success-ink)">22.0 pounds</text>
        </g>

        <!-- Bottom Callout -->
        <rect x="34" y="308" width="572" height="92" rx="14" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
        <text x="320" y="338" text-anchor="middle" font-size="17" font-weight="800" fill="var(--fm-m-unknown)">Notice the wavy ≈ symbol: Between systems, conversions are approximate!</text>
        <text x="320" y="366" text-anchor="middle" font-size="15" font-weight="700" fill="var(--fm-primary)">Set up an equivalent ratio with the conversion factor and multiply or divide.</text>
        <text x="320" y="386" text-anchor="middle" font-size="14" font-weight="600" fill="var(--fm-text-muted)">Ratio benchmarks: 1 mi ≈ 1.61 km   ·   1 kg ≈ 2.2 lb   ·   1 in ≈ 2.54 cm</text>`,
      }),
      capEn:
        "Conversions between measurement systems are approximate (≈). Set up an equivalent ratio with the conversion rate to solve.",
      capEs:
        "Las conversiones entre sistemas son aproximadas (≈). Usen una razón equivalente con la tasa de conversión para resolver.",
    };
  }

  if (baseLesson === "3-8") {
    return {
      svg: conceptFrame({
        label:
          "The Unit Rate Bridge: 2 steps to solve any rate problem by first finding the rate for 1",
        tone: "teal",
        height: 420,
        title: "The Unit Rate Bridge / Resolver con tasa unitaria",
        body: `
        <!-- Problem Header Card -->
        ${conceptCard(34, 68, 572, 60)}
        <text x="320" y="104" text-anchor="middle" font-size="18" font-weight="800" fill="var(--fm-primary)">Problem: 6 movie tickets cost $72. How much do 9 tickets cost?</text>

        <!-- 2-Step Side-by-Side Cards -->
        <g transform="translate(34, 140)">
          <!-- Step 1 -->
          <rect x="0" y="0" width="272" height="152" rx="14" fill="var(--fm-raised)" stroke="var(--fm-m-part)" stroke-width="2"/>
          <rect x="16" y="14" width="144" height="26" rx="6" fill="var(--fm-m-part)"/>
          <text x="88" y="32" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">STEP 1: DIVIDE TO 1</text>
          <text x="16" y="68" font-size="16" font-weight="700" fill="var(--fm-text-muted)">Find the Unit Rate (Cost for 1):</text>
          <text x="16" y="100" font-size="24" font-weight="800" fill="var(--fm-primary)">$72 ÷ 6 tickets =</text>
          <text x="16" y="132" font-size="26" font-weight="800" fill="var(--fm-m-part)">$12 per ticket</text>

          <!-- Step 2 -->
          <rect x="300" y="0" width="272" height="152" rx="14" fill="var(--fm-raised)" stroke="var(--fm-success)" stroke-width="2"/>
          <rect x="316" y="14" width="190" height="26" rx="6" fill="var(--fm-success)"/>
          <text x="411" y="32" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">STEP 2: MULTIPLY TO TARGET</text>
          <text x="316" y="68" font-size="16" font-weight="700" fill="var(--fm-text-muted)">Scale to the target amount:</text>
          <text x="316" y="100" font-size="24" font-weight="800" fill="var(--fm-primary)">$12 × 9 tickets =</text>
          <text x="316" y="132" font-size="26" font-weight="800" fill="var(--fm-success-ink)">$108 for 9 tickets</text>
        </g>

        <!-- Visual Bridge Flow Banner -->
        <g transform="translate(34, 306)">
          <rect x="0" y="0" width="572" height="96" rx="14" fill="var(--fm-success-tint)" stroke="var(--fm-m-part)" stroke-width="2"/>
          <text x="286" y="30" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-m-part)">THE 2-STEP RATIO BRIDGE FLOW</text>
          <text x="64" y="68" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-primary)">6 Tickets ($72)</text>
          <path d="M142 62 L200 62" stroke="var(--fm-m-part)" stroke-width="3"/>
          <path d="M194 56 L204 62 L194 68 Z" fill="var(--fm-m-part)"/>
          <text x="171" y="52" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-m-part)">÷ 6</text>
          <text x="286" y="68" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-m-part)">1 Ticket ($12)</text>
          <path d="M372 62 L430 62" stroke="var(--fm-success)" stroke-width="3"/>
          <path d="M424 56 L434 62 L424 68 Z" fill="var(--fm-success)"/>
          <text x="401" y="52" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-success-ink)">× 9</text>
          <text x="504" y="68" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-success-ink)">9 Tickets ($108)</text>
        </g>`,
      }),
      capEn:
        "The 2-step unit rate bridge: First divide to find the cost of 1, then multiply to find the total for any quantity.",
      capEs:
        "El puente de 2 pasos: Primero dividan para hallar el costo de 1, luego multipliquen por la cantidad total deseada.",
    };
  }

  if (baseLesson === "3-9") {
    return {
      svg: conceptFrame({
        label:
          "Equivalent Ratios: Scaling up with multiplication and scaling down by dividing with tape diagrams",
        tone: "amber",
        height: 420,
        title: "Equivalent Ratios: Scale Up & Down / Razones equivalentes",
        body: `
        <!-- Top Tape Diagrams -->
        ${conceptCard(34, 68, 572, 136)}
        <text x="50" y="94" font-size="15" font-weight="800" fill="var(--fm-primary)">Ratio 2 : 5 (Base Ratio)</text>
        <g transform="translate(50, 102)">
          <rect x="0" y="0" width="46" height="24" rx="5" fill="var(--fm-m-part)"/>
          <rect x="50" y="0" width="46" height="24" rx="5" fill="var(--fm-m-part)"/>
          <rect x="108" y="0" width="46" height="24" rx="5" fill="var(--fm-m-unknown)"/>
          <rect x="158" y="0" width="46" height="24" rx="5" fill="var(--fm-m-unknown)"/>
          <rect x="208" y="0" width="46" height="24" rx="5" fill="var(--fm-m-unknown)"/>
          <rect x="258" y="0" width="46" height="24" rx="5" fill="var(--fm-m-unknown)"/>
          <rect x="308" y="0" width="46" height="24" rx="5" fill="var(--fm-m-unknown)"/>
          <text x="380" y="18" font-size="16" font-weight="800" fill="var(--fm-m-part)">2 parts to 5 parts</text>
        </g>
        <text x="50" y="154" font-size="15" font-weight="800" fill="var(--fm-primary)">Ratio 4 : 10 (Scaled up by 2)</text>
        <g transform="translate(50, 162)">
          <rect x="0" y="0" width="22" height="22" rx="4" fill="var(--fm-m-part)"/>
          <rect x="25" y="0" width="22" height="22" rx="4" fill="var(--fm-m-part)"/>
          <rect x="50" y="0" width="22" height="22" rx="4" fill="var(--fm-m-part)"/>
          <rect x="75" y="0" width="22" height="22" rx="4" fill="var(--fm-m-part)"/>
          <rect x="108" y="0" width="22" height="22" rx="4" fill="var(--fm-m-unknown)"/>
          <rect x="133" y="0" width="22" height="22" rx="4" fill="var(--fm-m-unknown)"/>
          <rect x="158" y="0" width="22" height="22" rx="4" fill="var(--fm-m-unknown)"/>
          <rect x="183" y="0" width="22" height="22" rx="4" fill="var(--fm-m-unknown)"/>
          <rect x="208" y="0" width="22" height="22" rx="4" fill="var(--fm-m-unknown)"/>
          <rect x="233" y="0" width="22" height="22" rx="4" fill="var(--fm-m-unknown)"/>
          <rect x="258" y="0" width="22" height="22" rx="4" fill="var(--fm-m-unknown)"/>
          <rect x="283" y="0" width="22" height="22" rx="4" fill="var(--fm-m-unknown)"/>
          <rect x="308" y="0" width="22" height="22" rx="4" fill="var(--fm-m-unknown)"/>
          <rect x="333" y="0" width="22" height="22" rx="4" fill="var(--fm-m-unknown)"/>
          <text x="380" y="17" font-size="16" font-weight="800" fill="var(--fm-m-part)">4 parts to 10 parts (Equal!)</text>
        </g>

        <!-- Bottom Strategy Cards -->
        <g transform="translate(34, 218)">
          <!-- Scale UP Card -->
          <rect x="0" y="0" width="276" height="184" rx="14" fill="var(--fm-raised)" stroke="var(--fm-success)" stroke-width="2"/>
          <rect x="16" y="14" width="170" height="26" rx="6" fill="var(--fm-success)"/>
          <text x="101" y="32" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-text-inverse)">SCALE UP (MULTIPLY)</text>
          <text x="16" y="68" font-size="16" font-weight="700" fill="var(--fm-text-muted)">Multiply both terms by 3:</text>
          <text x="16" y="104" font-size="28" font-weight="800" fill="var(--fm-primary)">3 : 4  =  9 : 12</text>
          <text x="16" y="136" font-size="15" font-weight="700" fill="var(--fm-success-ink)">3 × 3 = 9   and   4 × 3 = 12</text>
          <text x="16" y="162" font-size="14" font-weight="600" fill="var(--fm-text-muted)">Scale factor is 3.</text>

          <!-- Scale DOWN Card -->
          <rect x="296" y="0" width="276" height="184" rx="14" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <rect x="312" y="14" width="180" height="26" rx="6" fill="var(--fm-m-whole)"/>
          <text x="402" y="32" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-text-inverse)">SCALE DOWN (SIMPLIFY)</text>
          <text x="312" y="68" font-size="16" font-weight="700" fill="var(--fm-text-muted)">Divide both terms by GCF (4):</text>
          <text x="312" y="104" font-size="28" font-weight="800" fill="var(--fm-primary)">12 : 20  =  3 : 5</text>
          <text x="312" y="136" font-size="15" font-weight="700" fill="var(--fm-m-whole)">12 ÷ 4 = 3   and   20 ÷ 4 = 5</text>
          <text x="312" y="162" font-size="14" font-weight="600" fill="var(--fm-text-muted)">3:5 is the simplest form ratio.</text>
        </g>`,
      }),
      capEn:
        "Equivalent ratios describe the same relationship. Multiply both terms to scale up, or divide by a common factor to simplify.",
      capEs:
        "Las razones equivalentes describen la misma relación. Multipliquen ambos términos para agrandar o dividan para simplificar.",
    };
  }

  if (baseLesson === "3-10") {
    return {
      svg: conceptFrame({
        label:
          "Unit Cancellation and Conversion Ratios: Crossing out diagonal matching units to leave target units",
        tone: "teal",
        height: 420,
        title: "Unit Cancellation & Ratios / Conversión de unidades",
        body: `
        <!-- Problem Card -->
        ${conceptCard(34, 68, 572, 54)}
        <text x="320" y="102" text-anchor="middle" font-size="18" font-weight="800" fill="var(--fm-primary)">Problem: Convert 180 inches into yards using conversion ratios</text>

        <!-- Big Dimensional Analysis Display Card -->
        <g transform="translate(34, 134)">
          <rect x="0" y="0" width="572" height="152" rx="14" fill="var(--fm-raised)" stroke="var(--fm-m-part)" stroke-width="2"/>
          
          <!-- Fraction 1: 180 in -->
          <text x="36" y="80" font-size="28" font-weight="800" fill="var(--fm-primary)">180</text>
          <text x="92" y="80" font-size="26" font-weight="800" fill="var(--fm-m-unknown)">in</text>
          <line x1="88" y1="86" x2="118" y2="60" stroke="var(--fm-m-unknown-edge)" stroke-width="3.5"/>

          <text x="134" y="80" font-size="28" font-weight="800" fill="var(--fm-primary)">×</text>

          <!-- Fraction 2: 1 ft / 12 in -->
          <g transform="translate(162, 28)">
            <text x="24" y="32" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-primary)">1 <tspan fill="var(--fm-m-whole)">ft</tspan></text>
            <line x1="22" y1="36" x2="48" y2="14" stroke="var(--fm-m-whole)" stroke-width="3.5"/>
            <line x1="0" y1="52" x2="68" y2="52" stroke="var(--fm-primary)" stroke-width="2.5"/>
            <text x="34" y="82" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-primary)">12 <tspan fill="var(--fm-m-unknown)">in</tspan></text>
            <line x1="32" y1="88" x2="62" y2="64" stroke="var(--fm-m-unknown-edge)" stroke-width="3.5"/>
          </g>

          <text x="254" y="80" font-size="28" font-weight="800" fill="var(--fm-primary)">×</text>

          <!-- Fraction 3: 1 yd / 3 ft -->
          <g transform="translate(282, 28)">
            <text x="24" y="32" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-success-ink)">1 yd</text>
            <line x1="0" y1="52" x2="68" y2="52" stroke="var(--fm-primary)" stroke-width="2.5"/>
            <text x="34" y="82" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-primary)">3 <tspan fill="var(--fm-m-whole)">ft</tspan></text>
            <line x1="32" y1="88" x2="58" y2="64" stroke="var(--fm-m-whole)" stroke-width="3.5"/>
          </g>

          <text x="374" y="80" font-size="28" font-weight="800" fill="var(--fm-primary)">=</text>

          <!-- Result: 5 yards -->
          <rect x="410" y="44" width="144" height="64" rx="12" fill="var(--fm-success-tint)" stroke="var(--fm-success)" stroke-width="2"/>
          <text x="482" y="86" text-anchor="middle" font-size="26" font-weight="800" fill="var(--fm-success-ink)">5 yards</text>

          <text x="286" y="136" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fm-text-muted)">Diagonal cancellation leaves only the target unit: yards!</text>
        </g>

        <!-- Bottom Explanation Card -->
        <g transform="translate(34, 298)">
          <rect x="0" y="0" width="572" height="104" rx="14" fill="var(--fm-success-tint)" stroke="var(--fm-m-part)" stroke-width="2"/>
          <text x="20" y="28" font-size="16" font-weight="800" fill="var(--fm-m-part)">✔ DIAGONAL UNIT CANCELLATION RULE:</text>
          <text x="20" y="56" font-size="15" font-weight="700" fill="var(--fm-primary)">1. Place the unit you want to cancel in the opposite position (top vs bottom).</text>
          <text x="20" y="78" font-size="15" font-weight="700" fill="var(--fm-primary)">2. Calculate the math: (180 × 1 × 1) ÷ (12 × 3) = 180 ÷ 36 = 5 yards.</text>
          <text x="20" y="98" font-size="14" font-weight="700" fill="var(--fm-m-part)">Equivalent conversion ratios guarantee your final answer is accurate.</text>
        </g>`,
      }),
      capEn:
        "Set up conversion ratios so units cancel diagonally across fractions, leaving only the unit you want to find.",
      capEs:
        "Escriban razones de conversión de modo que las unidades se cancelen en diagonal, dejando solo la unidad deseada.",
    };
  }

  if (baseLesson === "4-1") {
    const isPart2 = lessonId.endsWith("-part2");
    if (isPart2) {
      return {
        svg: `<div class="family-specific-model">${conceptFrame({
          label:
            "Percents Greater Than 100%: 100% is one whole, and a puppy at 2.5 times kitten weight is 250%",
          tone: "amber",
          height: 420,
          title: "Percents Greater Than 100% / Porcentajes mayores que 100%",
          body: `
          <!-- Reference Whole Card -->
          ${conceptCard(34, 68, 572, 104)}
          <rect x="52" y="82" width="220" height="24" rx="6" fill="var(--fm-success)"/>
          <text x="162" y="99" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">REFERENCE WHOLE = 100%</text>
          <rect x="52" y="118" width="180" height="38" rx="6" fill="var(--fm-success)" stroke="var(--fm-success)" stroke-width="2"/>
          <text x="142" y="142" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-text-inverse)">Kitten = 1 whole (100%)</text>
          <text x="250" y="142" font-size="14" font-weight="700" fill="var(--fm-primary)">← The base amount compared TO is always 100%</text>

          <!-- Puppy: 2.5 Times Whole Card -->
          ${conceptCard(34, 184, 572, 126)}
          <rect x="52" y="196" width="230" height="24" rx="6" fill="var(--fm-m-whole)"/>
          <text x="167" y="213" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">PUPPY = 2.5 TIMES KITTEN</text>
          <g transform="translate(52, 230)">
            <rect x="0" y="0" width="180" height="38" rx="6" fill="var(--fm-m-whole)" stroke="var(--fm-m-whole)" stroke-width="2"/>
            <text x="90" y="24" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-text-inverse)">1st Whole (100%)</text>
            <rect x="186" y="0" width="180" height="38" rx="6" fill="var(--fm-m-whole)" stroke="var(--fm-m-whole)" stroke-width="2"/>
            <text x="276" y="24" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-text-inverse)">2nd Whole (100%)</text>
            <rect x="372" y="0" width="90" height="38" rx="6" fill="var(--fm-m-whole)" stroke="var(--fm-m-whole)" stroke-width="2"/>
            <text x="417" y="24" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-m-whole)">+50%</text>
          </g>
          <text x="52" y="296" font-size="15" font-weight="800" fill="var(--fm-m-whole)">100% + 100% + 50% = 250% of the kitten's weight</text>

          <!-- Key takeaway callout -->
          <rect x="34" y="322" width="572" height="80" rx="14" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
          <text x="54" y="348" font-size="14" font-weight="800" fill="var(--fm-m-unknown)">💡 MORE THAN ONE WHOLE:</text>
          <text x="54" y="370" font-size="13.5" font-weight="700" fill="var(--fm-primary)">Percents greater than 100% mean more than 1 whole: 2.5 × 100% = 250%.</text>
          <text x="54" y="390" font-size="13.5" font-weight="700" fill="var(--fm-primary)">Check: Is the puppy heavier than the kitten? Yes → percent must exceed 100%.</text>`,
        })}</div>`,
        capEn: "100% is one whole. A percent greater than 100% means more than one whole.",
        capEs: "100% es un entero. Un porcentaje mayor que 100% significa más de un entero.",
      };
    }

    const gridSquares = Array.from({ length: 100 }, (_, i) => {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const isShaded = i < 40;
      const fill = isShaded ? "var(--fm-m-part)" : "var(--fm-raised)";
      const stroke = isShaded ? "var(--fm-m-part)" : "var(--fm-m-whole)";
      return `<rect x="${393 + col * 15}" y="${108 + row * 10}" width="14" height="9" rx="1" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
    }).join("");

    return {
      svg: `<div class="family-specific-model">${conceptFrame({
        label:
          "Understand Percent: scaling ratio 4 out of 10 to 40 out of 100, 100-square grid, and tape diagram percent bar showing 3 of 4 parts as 75%",
        tone: "teal",
        height: 592,
        title: "Understand Percent / ¿Qué es un porcentaje?",
        body: `
        <!-- Scaling Ratio Card -->
        ${conceptCard(34, 68, 276, 206)}
        <rect x="52" y="80" width="168" height="24" rx="6" fill="var(--fm-m-part)"/>
        <text x="136" y="97" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">SCALE RATIO TO 100</text>
        <text x="172" y="122" text-anchor="middle" font-size="15" font-weight="700" fill="var(--fm-primary)">4 out of 10 students</text>
        <g transform="translate(102, 130)">
          <text x="70" y="20" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-m-part)">4 × 10</text>
          <line x1="20" y1="28" x2="120" y2="28" stroke="var(--fm-m-part)" stroke-width="2.5"/>
          <text x="70" y="48" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-m-part)">10 × 10</text>
        </g>
        <text x="172" y="202" text-anchor="middle" font-size="20" font-weight="800" fill="var(--fm-primary)">= 40 / 100</text>
        <rect x="72" y="220" width="200" height="38" rx="8" fill="var(--fm-m-part)"/>
        <text x="172" y="245" text-anchor="middle" font-size="18" font-weight="800" fill="var(--fm-text-inverse)">= 40% (per hundred)</text>

        <!-- 100-Square Grid Card -->
        ${conceptCard(330, 68, 276, 206)}
        <rect x="348" y="80" width="160" height="24" rx="6" fill="var(--fm-m-part)"/>
        <text x="428" y="97" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">100-SQUARE GRID</text>
        <g>${gridSquares}</g>
        <text x="468" y="220" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-m-part)">40 shaded squares = 40%</text>
        <text x="468" y="238" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fm-text-muted)">60 unshaded squares = 60%</text>
        <text x="468" y="256" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fm-primary)">Total: 100 squares = 100%</text>

        <!-- Percent Bar (Tape Diagram) Card -->
        ${conceptCard(34, 286, 572, 142)}
        <rect x="52" y="298" width="220" height="24" rx="6" fill="var(--fm-m-part)"/>
        <text x="162" y="315" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-text-inverse)">PERCENT BAR (TAPE DIAGRAM)</text>
        <text x="288" y="315" font-size="12" font-weight="700" fill="var(--fm-primary)">4 equal parts: each is 25% (100% ÷ 4 = 25%)</text>
        <g transform="translate(52, 332)">
          <rect x="0" y="0" width="134" height="36" rx="2" fill="var(--fm-m-part)" stroke="var(--fm-primary)" stroke-width="2"/>
          <text x="67" y="23" text-anchor="middle" font-family="Outfit, sans-serif" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">25%</text>
          <rect x="134" y="0" width="134" height="36" rx="2" fill="var(--fm-m-part)" stroke="var(--fm-primary)" stroke-width="2"/>
          <text x="201" y="23" text-anchor="middle" font-family="Outfit, sans-serif" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">25%</text>
          <rect x="268" y="0" width="134" height="36" rx="2" fill="var(--fm-m-part)" stroke="var(--fm-primary)" stroke-width="2"/>
          <text x="335" y="23" text-anchor="middle" font-family="Outfit, sans-serif" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">25%</text>
          <rect x="402" y="0" width="134" height="36" rx="2" fill="var(--fm-raised)" stroke="var(--fm-primary)" stroke-width="2"/>
          <text x="469" y="23" text-anchor="middle" font-family="Outfit, sans-serif" font-size="13" font-weight="800" fill="var(--fm-text-muted)">25%</text>
          <rect x="0" y="0" width="536" height="36" rx="4" fill="none" stroke="var(--fm-primary)" stroke-width="2.5"/>
          <line x1="0" y1="36" x2="0" y2="44" stroke="var(--fm-primary)" stroke-width="2"/>
          <text x="0" y="58" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--fm-primary)">0%</text>
          <line x1="134" y1="36" x2="134" y2="42" stroke="var(--fm-m-part)" stroke-width="1.5"/>
          <text x="134" y="55" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--fm-m-part)">25%</text>
          <line x1="268" y1="36" x2="268" y2="42" stroke="var(--fm-m-part)" stroke-width="1.5"/>
          <text x="268" y="55" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--fm-m-part)">50%</text>
          <line x1="402" y1="36" x2="402" y2="46" stroke="var(--fm-m-part)" stroke-width="2.5"/>
          <rect x="382" y="44" width="40" height="18" rx="4" fill="var(--fm-m-part)"/>
          <text x="402" y="57" text-anchor="middle" font-size="11" font-weight="900" fill="var(--fm-text-inverse)">75%</text>
          <line x1="536" y1="36" x2="536" y2="44" stroke="var(--fm-primary)" stroke-width="2"/>
          <text x="536" y="58" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--fm-primary)">100%</text>
          <text x="201" y="80" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-m-part)">3 shaded parts = 3 × 25% = 75% of the whole</text>
          <text x="469" y="80" text-anchor="middle" font-size="11" font-weight="700" fill="var(--fm-text-muted)">1 unshaded = 25%</text>
        </g>

        <!-- Key Rule Callout -->
        <rect x="34" y="440" width="572" height="136" rx="14" fill="var(--fm-success-tint)" stroke="var(--fm-m-part)" stroke-width="2"/>
        <text x="54" y="464" font-size="15" font-weight="800" fill="var(--fm-m-part)">✔ KEY PERCENT RULE:</text>
        <text x="54" y="487" font-size="14" font-weight="700" fill="var(--fm-primary)">Percent literally means "per hundred". Scale any ratio until the bottom number is 100.</text>
        <text x="54" y="507" font-size="14" font-weight="700" fill="var(--fm-primary)">Use a 100-square grid, scaling factors, or a percent bar to model parts of a whole.</text>
        <text x="54" y="527" font-size="14" font-weight="700" fill="var(--fm-primary)">100% stands for 1 whole. Percents can also exceed 100% (e.g. 150% = 1.5 wholes).</text>
        <text x="54" y="548" font-size="13" font-weight="700" fill="var(--fm-m-part)">Equivalent models: 4/10 = 40/100 = 40%  ·  3/4 on a percent bar = 75/100 = 75%</text>`,
      })}</div>`,
      capEn:
        "Percent means per hundred. Use a 100-square grid, ratio scaling, or a percent bar to represent parts of 100%.",
      capEs:
        "Porcentaje significa por cada cien. Usen una cuadrícula de 100, razones o una barra de porcentaje para representar partes de 100%.",
    };
  }

  if (baseLesson === "4-2") {
    const isPart2 = lessonId.endsWith("-part2");
    if (isPart2) {
      return {
        svg: `<div class="family-specific-model">${conceptFrame({
          label:
            "Comparing and Ordering Mixed Forms: Convert 0.68, 3/4, and 71% to percents to order them accurately",
          tone: "navy",
          height: 420,
          title: "Compare & Order Mixed Forms / Compara y ordena formas mixtas",
          body: `
          <!-- Convert All to Percents Card -->
          ${conceptCard(34, 68, 572, 134)}
          <rect x="52" y="82" width="260" height="24" rx="6" fill="var(--fm-m-whole)"/>
          <text x="182" y="99" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">CONVERT ALL VALUES TO PERCENTS</text>
          <g transform="translate(52, 118)">
            <!-- Item 1: Decimal -->
            <rect x="0" y="0" width="168" height="68" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="1.5"/>
            <text x="84" y="24" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-primary)">0.68</text>
            <text x="84" y="44" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fm-text-muted)">68 hundredths</text>
            <text x="84" y="60" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-m-part)">= 68%</text>

            <!-- Item 2: Percent -->
            <rect x="184" y="0" width="168" height="68" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="1.5"/>
            <text x="268" y="24" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-primary)">71%</text>
            <text x="268" y="44" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fm-text-muted)">already percent</text>
            <text x="268" y="60" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-m-part)">= 71%</text>

            <!-- Item 3: Fraction -->
            <rect x="368" y="0" width="168" height="68" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="1.5"/>
            <text x="452" y="24" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-primary)">3/4</text>
            <text x="452" y="44" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fm-text-muted)">scale × 25/25 = 75/100</text>
            <text x="452" y="60" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-m-part)">= 75%</text>
          </g>

          <!-- Compare Percents Scale -->
          ${conceptCard(34, 214, 572, 88)}
          <rect x="52" y="226" width="200" height="24" rx="6" fill="var(--fm-m-whole)"/>
          <text x="152" y="243" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">ORDER THE PERCENTS</text>
          <text x="320" y="284" text-anchor="middle" font-size="20" font-weight="800" fill="var(--fm-m-part)">68%   &lt;   71%   &lt;   75%</text>

          <!-- Final Answer Card -->
          <rect x="34" y="314" width="572" height="88" rx="14" fill="var(--fm-m-whole-tint)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="54" y="338" font-size="14" font-weight="800" fill="var(--fm-m-whole)">✔ FINAL ORDER (IN ORIGINAL FORMS, LEAST TO GREATEST):</text>
          <text x="320" y="376" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-primary)">0.68   &lt;   71%   &lt;   3/4</text>`,
        })}</div>`,
        capEn: "Convert every value to a percent first, order them, then write the original forms.",
        capEs:
          "Conviertan cada valor a porcentaje primero, ordénenlos y luego escriban las formas originales.",
      };
    }

    // Part 1: Three forms of one amount
    return {
      svg: `<div class="family-specific-model">${conceptFrame({
        label: "Three forms of one amount: 1/4 equals 25/100 equals 0.25 equals 25%",
        tone: "teal",
        height: 420,
        title: "Three Forms of One Amount / Tres formas de una misma cantidad",
        body: `
        <!-- 4 Equivalence Cards -->
        <!-- Fraction Card -->
        ${conceptCard(34, 68, 134, 212)}
        <rect x="46" y="80" width="110" height="24" rx="6" fill="var(--fm-m-part)"/>
        <text x="101" y="97" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-text-inverse)">FRACTION</text>
        <text x="101" y="146" text-anchor="middle" font-size="34" font-weight="800" fill="var(--fm-primary)">1/4</text>
        <g transform="translate(61, 168)">
          <rect x="0" y="0" width="80" height="20" rx="3" fill="var(--fm-raised)" stroke="var(--fm-m-part)" stroke-width="1.5"/>
          <rect x="0" y="0" width="20" height="20" rx="3" fill="var(--fm-m-part)"/>
        </g>
        <text x="101" y="210" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fm-text-muted)">1 part of 4</text>
        <text x="101" y="260" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-m-part)">1 ÷ 4 = 0.25</text>

        <!-- Hundredths Card -->
        ${conceptCard(180, 68, 134, 212)}
        <rect x="192" y="80" width="110" height="24" rx="6" fill="var(--fm-m-part)"/>
        <text x="247" y="97" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-text-inverse)">OUT OF 100</text>
        <text x="247" y="146" text-anchor="middle" font-size="28" font-weight="800" fill="var(--fm-primary)">25/100</text>
        <text x="247" y="180" text-anchor="middle" font-size="13" font-weight="700" fill="var(--fm-m-part)">scale × 25</text>
        <text x="247" y="210" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fm-text-muted)">25 hundredths</text>
        <text x="247" y="260" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-m-part)">scale denominator</text>

        <!-- Decimal Card -->
        ${conceptCard(326, 68, 134, 212)}
        <rect x="338" y="80" width="110" height="24" rx="6" fill="var(--fm-m-part)"/>
        <text x="393" y="97" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-text-inverse)">DECIMAL</text>
        <text x="393" y="146" text-anchor="middle" font-size="34" font-weight="800" fill="var(--fm-primary)">0.25</text>
        <text x="393" y="180" text-anchor="middle" font-size="13" font-weight="700" fill="var(--fm-m-part)">2 tenths</text>
        <text x="393" y="210" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fm-text-muted)">5 hundredths</text>
        <text x="393" y="260" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-m-part)">0.25 × 100 = 25%</text>

        <!-- Percent Card -->
        ${conceptCard(472, 68, 134, 212)}
        <rect x="484" y="80" width="110" height="24" rx="6" fill="var(--fm-m-part)"/>
        <text x="539" y="97" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-text-inverse)">PERCENT</text>
        <text x="539" y="146" text-anchor="middle" font-size="34" font-weight="800" fill="var(--fm-primary)">25%</text>
        <text x="539" y="180" text-anchor="middle" font-size="13" font-weight="700" fill="var(--fm-m-part)">per hundred</text>
        <text x="539" y="210" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fm-text-muted)">25 for each 100</text>
        <text x="539" y="260" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-m-part)">same amount!</text>

        <!-- Conversion Pathways Callout -->
        <rect x="34" y="294" width="572" height="108" rx="14" fill="var(--fm-success-tint)" stroke="var(--fm-m-part)" stroke-width="2"/>
        <text x="54" y="318" font-size="15" font-weight="800" fill="var(--fm-m-part)">✔ HOW TO CONVERT BETWEEN FORMS:</text>
        <text x="54" y="342" font-size="14" font-weight="700" fill="var(--fm-primary)">1. Fraction to Decimal: Divide top ÷ bottom (1 ÷ 4 = 0.25, or 3 ÷ 4 = 0.75).</text>
        <text x="54" y="364" font-size="14" font-weight="700" fill="var(--fm-primary)">2. Decimal to Percent: Multiply by 100 (0.25 × 100 = 25%, or 0.75 × 100 = 75%).</text>
        <text x="54" y="386" font-size="13.5" font-weight="700" fill="var(--fm-m-part)">Equivalent ratio &amp; value: 1/4 = 25/100 = 0.25 = 25%</text>`,
      })}</div>`,
      capEn: "Fraction, decimal, and percent can all name the same part of one whole.",
      capEs: "La fracción, el decimal y el porcentaje pueden nombrar la misma parte de un entero.",
    };
  }

  if (baseLesson === "4-3") {
    const isPart2 = lessonId.endsWith("-part2");
    if (isPart2) {
      return {
        svg: `<div class="family-specific-model">${conceptFrame({
          label:
            "Estimating a Percent of a Number: Round 18.5% of 412 cans to 20% of 400 = 80 cans, and track rounding direction",
          tone: "amber",
          height: 420,
          title: "Compatible Numbers & Rounding / Números compatibles y redondeo",
          body: `
          <!-- Card 1: Round to Friendly Numbers -->
          ${conceptCard(34, 68, 276, 218)}
          <rect x="52" y="82" width="230" height="24" rx="6" fill="var(--fm-m-unknown)"/>
          <text x="167" y="99" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">ROUND BOTH NUMBERS</text>
          <text x="172" y="128" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-primary)">18.5% of 412 cans</text>
          <text x="172" y="152" text-anchor="middle" font-size="13" font-weight="700" fill="var(--fm-m-unknown)">18.5% rounds to 20%</text>
          <text x="172" y="172" text-anchor="middle" font-size="13" font-weight="700" fill="var(--fm-m-unknown)">412 rounds to 400</text>
          <rect x="52" y="190" width="240" height="82" rx="8" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="1.5"/>
          <text x="172" y="212" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-m-unknown)">10% of 400 = 40</text>
          <text x="172" y="234" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-m-unknown)">20% of 400 = 40 × 2 = 80</text>
          <text x="172" y="258" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-primary)">Estimate ≈ 80 cans</text>

          <!-- Card 2: Direction Tracking -->
          ${conceptCard(330, 68, 276, 218)}
          <rect x="348" y="82" width="220" height="24" rx="6" fill="var(--fm-m-unknown)"/>
          <text x="458" y="99" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">ROUNDING DIRECTION</text>
          <text x="468" y="130" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fm-primary)">Percent rounded UP:</text>
          <text x="468" y="150" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-success-ink)">18.5% ↑ 20% (makes estimate larger)</text>
          <text x="468" y="180" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fm-primary)">Total rounded DOWN:</text>
          <text x="468" y="200" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-m-unknown)">412 ↓ 400 (makes estimate smaller)</text>
          <rect x="348" y="222" width="240" height="50" rx="8" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="1.5"/>
          <text x="468" y="244" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-primary)">Net effect: close estimate</text>
          <text x="468" y="260" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fm-m-unknown)">runs slightly high</text>

          <!-- Bottom Summary -->
          <rect x="34" y="300" width="572" height="102" rx="14" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
          <text x="54" y="326" font-size="15" font-weight="800" fill="var(--fm-m-unknown)">✔ THE 10% WORKHORSE STRATEGY:</text>
          <text x="54" y="350" font-size="14" font-weight="700" fill="var(--fm-primary)">10% of any number is easy: move the decimal 1 place left (10% of 400 = 40).</text>
          <text x="54" y="372" font-size="14" font-weight="700" fill="var(--fm-primary)">Double it for 20% (40 × 2 = 80). Half it for 5% (40 ÷ 2 = 20).</text>
          <text x="54" y="392" font-size="13" font-weight="700" fill="var(--fm-m-unknown)">Estimating is not guessing — it is smart mental arithmetic with friendly numbers.</text>`,
        })}</div>`,
        capEn:
          "Round to friendly benchmark percents and compatible numbers, then track if the estimate runs high or low.",
        capEs:
          "Redondeen a porcentajes de referencia fáciles y números compatibles, y razonen si la estimación queda alta o baja.",
      };
    }

    // Part 1: Estimate with Benchmarks
    return {
      svg: `<div class="family-specific-model">${conceptFrame({
        label: "Benchmark Estimation: 48% of $61 is close to 50% of $60 = $30",
        tone: "coral",
        height: 420,
        title: "Estimate with Benchmarks / Estima con referentes",
        body: `
        <!-- Benchmark Number Line Card -->
        ${conceptCard(34, 68, 572, 206)}
        <rect x="52" y="80" width="240" height="24" rx="6" fill="var(--fm-m-unknown)"/>
        <text x="172" y="97" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">BENCHMARK LINE FOR $60 WHOLE</text>

        <!-- The line -->
        <line x1="64" y1="160" x2="576" y2="160" stroke="var(--fm-primary)" stroke-width="4"/>

        <!-- Ticks -->
        <!-- 0% -->
        <line x1="64" y1="148" x2="64" y2="172" stroke="var(--fm-primary)" stroke-width="3"/>
        <text x="64" y="142" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-primary)">0%</text>
        <text x="64" y="190" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fm-text-muted)">$0</text>

        <!-- 10% -->
        <line x1="115" y1="152" x2="115" y2="168" stroke="var(--fm-primary)" stroke-width="2"/>
        <text x="115" y="142" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fm-text-muted)">10%</text>
        <text x="115" y="190" text-anchor="middle" font-size="13" font-weight="700" fill="var(--fm-text-muted)">$6</text>

        <!-- 25% -->
        <line x1="192" y1="150" x2="192" y2="170" stroke="var(--fm-primary)" stroke-width="2.5"/>
        <text x="192" y="142" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-m-part)">25% (1/4)</text>
        <text x="192" y="190" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-m-part)">$15</text>

        <!-- 50% -->
        <line x1="320" y1="146" x2="320" y2="174" stroke="var(--fm-m-unknown-edge)" stroke-width="4"/>
        <text x="320" y="140" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-m-unknown)">50% (half)</text>
        <text x="320" y="190" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-m-unknown)">$30</text>

        <!-- 75% -->
        <line x1="448" y1="150" x2="448" y2="170" stroke="var(--fm-primary)" stroke-width="2.5"/>
        <text x="448" y="142" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-m-part)">75% (3/4)</text>
        <text x="448" y="190" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-m-part)">$45</text>

        <!-- 100% -->
        <line x1="576" y1="148" x2="576" y2="172" stroke="var(--fm-primary)" stroke-width="3"/>
        <text x="576" y="142" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-primary)">100%</text>
        <text x="576" y="190" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fm-text-muted)">$60</text>

        <!-- Target pin at 48% (around x: 310) -->
        <polygon points="310,154 304,142 316,142" fill="var(--fm-m-unknown)"/>
        <rect x="220" y="210" width="200" height="52" rx="8" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
        <text x="320" y="230" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-m-unknown)">48% of $61 ≈ 50% of $60</text>
        <text x="320" y="250" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fm-primary)">Estimate ≈ $30</text>

        <!-- Toolkit Callout -->
        <rect x="34" y="286" width="572" height="116" rx="14" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
        <text x="54" y="312" font-size="15" font-weight="800" fill="var(--fm-m-unknown)">💡 BENCHMARK ESTIMATION TOOLKIT:</text>
        <text x="54" y="336" font-size="14" font-weight="700" fill="var(--fm-primary)">10%: Move decimal 1 place left ($60 → $6).</text>
        <text x="54" y="358" font-size="14" font-weight="700" fill="var(--fm-primary)">50%: Half of whole ($60 ÷ 2 = $30).   25%: Half of 50% ($30 ÷ 2 = $15).</text>
        <text x="54" y="380" font-size="14" font-weight="700" fill="var(--fm-primary)">48% of $61 is close to 50% of $60 = $30 (just under $30 because 48% &lt; 50%).</text>
        <text x="54" y="396" font-size="13" font-weight="700" fill="var(--fm-m-unknown)">Quick mental ratio estimate: no long division needed!</text>`,
      })}</div>`,
      capEn: "Use benchmark percents like 10%, 25%, and 50% to make quick mental estimates.",
      capEs:
        "Usen porcentajes de referencia como 10%, 25% y 50% para hacer estimaciones mentales rápidas.",
    };
  }

  if (baseLesson === "4-4") {
    const isPart2 = lessonId.endsWith("-part2");
    if (isPart2) {
      return {
        svg: `<div class="family-specific-model">${conceptFrame({
          label:
            "Comparing with Percents: Comparing Quiz 1 (21 out of 25 = 84%) with Quiz 2 (16 out of 20 = 80%)",
          tone: "navy",
          height: 420,
          title: "Fair Comparison with Percents / Comparación justa con porcentajes",
          body: `
          <!-- Quiz 1 Card -->
          ${conceptCard(34, 68, 276, 218)}
          <rect x="52" y="80" width="140" height="24" rx="6" fill="var(--fm-m-whole)"/>
          <text class="concept-title-en" x="122" y="97" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">QUIZ 1 (OUT OF 25)</text>
          <text class="concept-title-es" lang="es" x="122" y="97" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">PRUEBA 1 (DE 25)</text>
          <text class="concept-title-en" x="172" y="130" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-primary)">21 out of 25 correct</text>
          <text class="concept-title-es" lang="es" x="172" y="130" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-primary)">21 de 25 correctas</text>
          <text class="concept-title-en" x="172" y="156" text-anchor="middle" font-size="15" font-weight="700" fill="var(--fm-m-whole)">Scale denominator to 100:</text>
          <text class="concept-title-es" lang="es" x="172" y="156" text-anchor="middle" font-size="15" font-weight="700" fill="var(--fm-m-whole)">Escala el denominador a 100:</text>
          <text x="172" y="180" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-m-whole)">21 × 4 / 25 × 4 = 84 / 100</text>
          <rect x="62" y="196" width="220" height="42" rx="8" fill="var(--fm-success-tint)" stroke="var(--fm-success)" stroke-width="2"/>
          <text class="concept-title-en" x="172" y="222" text-anchor="middle" font-size="20" font-weight="800" fill="var(--fm-success-ink)">= 84% ★ HIGHER SCORE</text>
          <text class="concept-title-es" lang="es" x="172" y="222" text-anchor="middle" font-size="20" font-weight="800" fill="var(--fm-success-ink)">= 84% ★ MEJOR PUNTAJE</text>

          <!-- Quiz 2 Card -->
          ${conceptCard(330, 68, 276, 218)}
          <rect x="348" y="80" width="140" height="24" rx="6" fill="var(--fm-m-whole)"/>
          <text class="concept-title-en" x="418" y="97" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">QUIZ 2 (OUT OF 20)</text>
          <text class="concept-title-es" lang="es" x="418" y="97" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">PRUEBA 2 (DE 20)</text>
          <text class="concept-title-en" x="468" y="130" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-primary)">16 out of 20 correct</text>
          <text class="concept-title-es" lang="es" x="468" y="130" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-primary)">16 de 20 correctas</text>
          <text class="concept-title-en" x="468" y="156" text-anchor="middle" font-size="15" font-weight="700" fill="var(--fm-m-whole)">Scale denominator to 100:</text>
          <text class="concept-title-es" lang="es" x="468" y="156" text-anchor="middle" font-size="15" font-weight="700" fill="var(--fm-m-whole)">Escala el denominador a 100:</text>
          <text x="468" y="180" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fm-m-whole)">16 × 5 / 20 × 5 = 80 / 100</text>
          <rect x="358" y="196" width="220" height="42" rx="8" fill="var(--fm-m-whole-tint)" stroke="var(--fm-m-whole)" stroke-width="1.5"/>
          <text x="468" y="222" text-anchor="middle" font-size="20" font-weight="800" fill="var(--fm-text-muted)">= 80%</text>

          <!-- Takeaway Callout -->
          <rect x="34" y="300" width="572" height="104" rx="14" fill="var(--fm-m-whole-tint)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text class="concept-title-en" x="54" y="326" font-size="15" font-weight="800" fill="var(--fm-m-whole)">✔ WHY PERCENTS MAKE COMPARISON FAIR:</text>
          <text class="concept-title-es" lang="es" x="54" y="326" font-size="15" font-weight="800" fill="var(--fm-m-whole)">✔ POR QUÉ LOS PORCENTAJES HACEN LA COMPARACIÓN JUSTA:</text>
          <text class="concept-title-en" x="54" y="350" font-size="14" font-weight="700" fill="var(--fm-primary)">You can't compare 21 and 16 directly: the totals differ (25 vs 20).</text>
          <text class="concept-title-es" lang="es" x="54" y="350" font-size="14" font-weight="700" fill="var(--fm-primary)">No se comparan 21 y 16 directo: los totales son distintos (25 y 20).</text>
          <text class="concept-title-en" x="54" y="372" font-size="14" font-weight="700" fill="var(--fm-primary)">Percents put both scores on the same 100-point scale: 84% beats 80%.</text>
          <text class="concept-title-es" lang="es" x="54" y="372" font-size="14" font-weight="700" fill="var(--fm-primary)">Los porcentajes ponen ambos sobre 100: 84% supera a 80%.</text>
          <text x="54" y="392" font-size="13" font-weight="700" fill="var(--fm-m-whole)">Equivalent ratio scaling: 21/25 = 84/100 and 16/20 = 80/100</text>`,
        })}</div>`,
        capEn:
          "Scale both ratios to 100 so different totals can be compared on the same fair scale.",
        capEs:
          "Escalen ambas razones a 100 para comparar totales distintos en una misma escala justa.",
      };
    }

    // Part 1: Find Percent of a Number (Discounts)
    return {
      svg: `<div class="family-specific-model">${conceptFrame({
        label:
          "Find Percent of a Number: $40 backpack with 25% discount gives $10 discount and $30 sale price",
        tone: "teal",
        height: 420,
        title: "Find Percent of a Number / Halla el porcentaje de un número",
        body: `
        <!-- Tape Diagram Card -->
        ${conceptCard(34, 68, 572, 136)}
        <rect x="52" y="80" width="240" height="24" rx="6" fill="var(--fm-m-part)"/>
        <text class="concept-title-en" x="172" y="97" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">TAPE DIAGRAM: $40 BACKPACK</text>
        <text class="concept-title-es" lang="es" x="172" y="97" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">DIAGRAMA: MOCHILA DE $40</text>

        <!-- 4 Blocks of $10 each -->
        <g transform="translate(52, 116)">
          <!-- Block 1: Discount -->
          <rect x="0" y="0" width="130" height="42" rx="6" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="2"/>
          <text x="65" y="26" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-m-unknown)">25% OFF = $10</text>

          <!-- Blocks 2, 3, 4: Sale Price -->
          <rect x="138" y="0" width="125" height="42" rx="6" fill="var(--fm-success-tint)" stroke="var(--fm-success)" stroke-width="2"/>
          <text x="200" y="26" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-success-ink)">$10 (25%)</text>
          <rect x="271" y="0" width="125" height="42" rx="6" fill="var(--fm-success-tint)" stroke="var(--fm-success)" stroke-width="2"/>
          <text x="333" y="26" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-success-ink)">$10 (25%)</text>
          <rect x="404" y="0" width="125" height="42" rx="6" fill="var(--fm-success-tint)" stroke="var(--fm-success)" stroke-width="2"/>
          <text x="466" y="26" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-success-ink)">$10 (25%)</text>
        </g>
        <text class="concept-title-en" x="117" y="180" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-m-unknown)">Discount Part</text>
        <text class="concept-title-es" lang="es" x="117" y="180" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-m-unknown)">Parte de descuento</text>
        <text class="concept-title-en" x="390" y="180" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-success-ink)">Sale Price Part = $30 (75%)</text>
        <text class="concept-title-es" lang="es" x="390" y="180" text-anchor="middle" font-size="12" font-weight="800" fill="var(--fm-success-ink)">Precio de oferta = $30 (75%)</text>

        <!-- Calculation Card -->
        <rect x="34" y="216" width="572" height="188" rx="14" fill="var(--fm-success-tint)" stroke="var(--fm-m-part)" stroke-width="2"/>
        <text class="concept-title-en" x="54" y="242" font-size="15" font-weight="800" fill="var(--fm-m-part)">✔ TWO-STEP DISCOUNT FORMULA:</text>
        <text class="concept-title-es" lang="es" x="54" y="242" font-size="15" font-weight="800" fill="var(--fm-m-part)">✔ FÓRMULA DE DESCUENTO EN DOS PASOS:</text>
        <g transform="translate(54, 258)">
          <text class="concept-title-en" x="0" y="18" font-size="14" font-weight="700" fill="var(--fm-primary)">Step 1: Find the discount (Part = Percent × Whole)</text>
          <text class="concept-title-es" lang="es" x="0" y="18" font-size="14" font-weight="700" fill="var(--fm-primary)">Paso 1: Halla el descuento (Parte = Porcentaje × Total)</text>
          <text x="0" y="40" font-size="15" font-weight="800" fill="var(--fm-m-part)">25% of $40 = 0.25 × 40 = $10 discount</text>
          <text class="concept-title-en" x="0" y="68" font-size="14" font-weight="700" fill="var(--fm-primary)">Step 2: Subtract discount from original price</text>
          <text class="concept-title-es" lang="es" x="0" y="68" font-size="14" font-weight="700" fill="var(--fm-primary)">Paso 2: Resta el descuento del precio original</text>
          <text x="0" y="90" font-size="15" font-weight="800" fill="var(--fm-m-part)">Sale Price = $40 − $10 = $30</text>
          <text class="concept-title-en" x="0" y="118" font-size="13" font-weight="700" fill="var(--fm-text-muted)">The word "of" means multiply: 25% OF $40 → 0.25 × 40 = $10</text>
          <text class="concept-title-es" lang="es" x="0" y="118" font-size="13" font-weight="700" fill="var(--fm-text-muted)">La palabra "de" significa multiplicar: 25% DE $40 → 0.25 × 40 = $10</text>
        </g>`,
      })}</div>`,
      capEn:
        "Part = Percent × Whole. Multiply decimal percent by the whole to find discount, then subtract for sale price.",
      capEs:
        "Parte = Porcentaje × Total. Multipliquen el porcentaje decimal por el total para hallar el descuento y resten.",
    };
  }

  if (baseLesson === "4-5") {
    const isPart2 = lessonId.endsWith("-part2");
    if (isPart2) {
      return {
        svg: `<div class="family-specific-model">${conceptFrame({
          label: "Solving for the Whole with an Equation: 0.15 × b = 6 leads to b = 6 ÷ 0.15 = 40",
          tone: "amber",
          height: 420,
          title: "Solve for the Whole with an Equation / Halla el total con una ecuación",
          body: `
          <!-- Equation Solving Card -->
          ${conceptCard(34, 68, 572, 224)}
          <rect x="52" y="80" width="280" height="24" rx="6" fill="var(--fm-m-unknown)"/>
          <text class="concept-title-en" x="192" y="97" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">EQUATION: PERCENT × WHOLE = PART</text>
          <text class="concept-title-es" lang="es" x="192" y="97" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">ECUACIÓN: PORCENTAJE × TOTAL = PARTE</text>

          <text class="concept-title-en" x="54" y="132" font-size="15" font-weight="700" fill="var(--fm-primary)">Problem: A $6 tip is 15% of the total restaurant bill (b).</text>
          <text class="concept-title-es" lang="es" x="54" y="132" font-size="15" font-weight="700" fill="var(--fm-primary)">Problema: Una propina de $6 es el 15% de la cuenta total (b).</text>

          <!-- Worked Steps -->
          <g transform="translate(54, 150)">
            <text class="concept-title-en" x="0" y="20" font-size="15" font-weight="800" fill="var(--fm-m-unknown)">1. Write the equation:</text>
            <text class="concept-title-es" lang="es" x="0" y="20" font-size="15" font-weight="800" fill="var(--fm-m-unknown)">1. Escribe la ecuación:</text>
            <text x="260" y="20" font-size="17" font-weight="800" fill="var(--fm-primary)">0.15 × b = 6</text>

            <text class="concept-title-en" x="0" y="52" font-size="15" font-weight="800" fill="var(--fm-m-unknown)">2. Divide to undo multiplication:</text>
            <text class="concept-title-es" lang="es" x="0" y="52" font-size="15" font-weight="800" fill="var(--fm-m-unknown)">2. Divide para despejar:</text>
            <text x="260" y="52" font-size="17" font-weight="800" fill="var(--fm-primary)">b = 6 ÷ 0.15</text>

            <text class="concept-title-en" x="0" y="84" font-size="15" font-weight="800" fill="var(--fm-m-unknown)">3. Calculate the missing whole:</text>
            <text class="concept-title-es" lang="es" x="0" y="84" font-size="15" font-weight="800" fill="var(--fm-m-unknown)">3. Calcula el total que falta:</text>
            <text x="260" y="84" font-size="18" font-weight="800" fill="var(--fm-m-part)">b = $40 total bill</text>
          </g>

          <!-- Check & Reason Card -->
          <rect x="34" y="304" width="572" height="98" rx="14" fill="var(--fm-success-tint)" stroke="var(--fm-success)" stroke-width="2"/>
          <text class="concept-title-en" x="54" y="328" font-size="15" font-weight="800" fill="var(--fm-success-ink)">✔ CHECK YOUR WORK (INVERSE OPERATION):</text>
          <text class="concept-title-es" lang="es" x="54" y="328" font-size="15" font-weight="800" fill="var(--fm-success-ink)">✔ COMPRUEBA TU TRABAJO (OPERACIÓN INVERSA):</text>
          <text class="concept-title-en" x="54" y="352" font-size="14" font-weight="700" fill="var(--fm-primary)">Multiply back: 15% of $40 = 0.15 × 40 = $6. ✓ Matches the tip!</text>
          <text class="concept-title-es" lang="es" x="54" y="352" font-size="14" font-weight="700" fill="var(--fm-primary)">Multiplica de regreso: 15% de $40 = 0.15 × 40 = $6. ✓ ¡Coincide!</text>
          <text class="concept-title-en" x="54" y="374" font-size="13" font-weight="700" fill="var(--fm-primary)">Sanity check: 15% is less than 100%, so the whole MUST exceed the part ($40 &gt; $6).</text>
          <text class="concept-title-es" lang="es" x="54" y="374" font-size="13" font-weight="700" fill="var(--fm-primary)">Sentido común: 15% es menor que 100%, así que el total DEBE superar la parte ($40 &gt; $6).</text>
          <text class="concept-title-en" x="54" y="392" font-size="13" font-weight="700" fill="var(--fm-success-ink)">Multiplying by 0.15 would give $0.90 — an obvious red flag for a total bill!</text>
          <text class="concept-title-es" lang="es" x="54" y="392" font-size="13" font-weight="700" fill="var(--fm-success-ink)">Multiplicar por 0.15 daría $0.90 — ¡una señal clara de que algo falló!</text>`,
        })}</div>`,
        capEn:
          "Percent times whole equals part. Divide both sides by the decimal percent to isolate the whole.",
        capEs:
          "Porcentaje por el total es igual a la parte. Dividan ambos lados entre el porcentaje decimal para despejar el total.",
      };
    }

    // Part 1: Find the Missing Whole
    return {
      svg: `<div class="family-specific-model">${conceptFrame({
        label:
          "Find the Missing Whole: 6 beads is 25% of a bag, so the whole bag is 6 divided by 0.25 equals 24 beads",
        tone: "teal",
        height: 420,
        title: "Find the Missing Whole / Halla el entero que falta",
        body: `
        <!-- Tape Diagram Card -->
        ${conceptCard(34, 68, 572, 142)}
        <rect x="52" y="80" width="280" height="24" rx="6" fill="var(--fm-m-part)"/>
        <text class="concept-title-en" x="192" y="97" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">TAPE DIAGRAM: 4 EQUAL 25% BLOCKS</text>
        <text class="concept-title-es" lang="es" x="192" y="97" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fm-text-inverse)">DIAGRAMA: 4 BLOQUES IGUALES DE 25%</text>

        <!-- 4 Blocks of 6 beads -->
        <g transform="translate(52, 116)">
          <rect x="0" y="0" width="130" height="42" rx="6" fill="var(--fm-m-part)"/>
          <text x="65" y="26" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-text-inverse)">PART: 6 (25%)</text>

          <rect x="138" y="0" width="125" height="42" rx="6" fill="var(--fm-m-whole-tint)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="200" y="26" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-m-whole)">6 (25%)</text>

          <rect x="271" y="0" width="125" height="42" rx="6" fill="var(--fm-m-whole-tint)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="333" y="26" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-m-whole)">6 (25%)</text>

          <rect x="404" y="0" width="125" height="42" rx="6" fill="var(--fm-m-whole-tint)" stroke="var(--fm-m-whole)" stroke-width="2"/>
          <text x="466" y="26" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-m-whole)">6 (25%)</text>
        </g>
        <text class="concept-title-en" x="320" y="184" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-m-part)">WHOLE BAG = 4 blocks × 6 beads = 24 beads (100%)</text>
        <text class="concept-title-es" lang="es" x="320" y="184" text-anchor="middle" font-size="14" font-weight="800" fill="var(--fm-m-part)">TOTAL = 4 bloques × 6 cuentas = 24 cuentas (100%)</text>

        <!-- Division Formula Card -->
        <rect x="34" y="222" width="572" height="182" rx="14" fill="var(--fm-success-tint)" stroke="var(--fm-m-part)" stroke-width="2"/>
        <text class="concept-title-en" x="54" y="246" font-size="15" font-weight="800" fill="var(--fm-m-part)">✔ DIVISION FINDS THE WHOLE:</text>
        <text class="concept-title-es" lang="es" x="54" y="246" font-size="15" font-weight="800" fill="var(--fm-m-part)">✔ LA DIVISIÓN HALLA EL TOTAL:</text>
        <g transform="translate(54, 262)">
          <text class="concept-title-en" x="0" y="18" font-size="15" font-weight="700" fill="var(--fm-primary)">Formula: Whole = Part ÷ Percent (as decimal)</text>
          <text class="concept-title-es" lang="es" x="0" y="18" font-size="15" font-weight="700" fill="var(--fm-primary)">Fórmula: Entero = Parte ÷ Porcentaje (en decimal)</text>
          <text x="0" y="44" font-size="17" font-weight="800" fill="var(--fm-m-part)">Whole = 6 ÷ 0.25 = 24 beads</text>
          <text class="concept-title-en" x="0" y="72" font-size="14" font-weight="700" fill="var(--fm-primary)">Check: 25% of 24 = 0.25 × 24 = 6 beads ✓</text>
          <text class="concept-title-es" lang="es" x="0" y="72" font-size="14" font-weight="700" fill="var(--fm-primary)">Comprueba: 25% de 24 = 0.25 × 24 = 6 cuentas ✓</text>
          <text x="0" y="98" font-size="13.5" font-weight="700" fill="var(--fm-m-part)">whole / entero = 6 ÷ 0.25 = 24</text>
          <text class="concept-title-en" x="0" y="120" font-size="13" font-weight="700" fill="var(--fm-text-muted)">Dividing by a decimal smaller than 1 makes the answer LARGER than the part.</text>
          <text class="concept-title-es" lang="es" x="0" y="120" font-size="13" font-weight="700" fill="var(--fm-text-muted)">Dividir entre un decimal menor que 1 hace que la respuesta sea MAYOR que la parte.</text>
        </g>`,
      })}</div>`,
      capEn:
        "When the part and percent are known, divide the part by the percent written as a decimal.",
      capEs:
        "Cuando conoces la parte y el porcentaje, divide la parte entre el porcentaje escrito como decimal.",
    };
  }

  if (topic === "ratios") {
    const cols = ["Batches", "Cups A", "Cups B"];
    const rows = [
      ["1", "2", "3"],
      ["2", "4", "6"],
      ["3", "6", "9"],
    ];
    const colX = [118, 288, 458];
    const head = cols
      .map(
        (c, i) =>
          `<rect x="${colX[i]}" y="70" width="150" height="50" rx="10" fill="var(--fm-primary)"/><text x="${colX[i] + 75}" y="103" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-text-inverse)">${c}</text>`,
      )
      .join("");
    const body = rows
      .map((row, r) =>
        row
          .map((cell, c) => {
            const y = 128 + r * 56;
            return `<rect x="${colX[c]}" y="${y}" width="150" height="50" rx="10" fill="var(--fm-raised)" stroke="var(--fm-m-whole)" stroke-width="2"/><text x="${colX[c] + 75}" y="${y + 36}" text-anchor="middle" font-size="30" font-weight="800" fill="var(--fm-primary)">${cell}</text>`;
          })
          .join(""),
      )
      .join("");
    const arrows = [
      { y: 184, label: "× 2" },
      { y: 240, label: "× 3" },
    ]
      .map(
        (a) =>
          `<text x="86" y="${a.y + 34}" text-anchor="end" font-size="26" font-weight="800" fill="var(--fm-m-unknown)">${a.label}</text>`,
      )
      .join("");
    return {
      svg: conceptFrame({
        label: "Ratio table: 1 batch needs 2 cups of A and 3 cups of B, doubled and tripled",
        tone: "teal",
        height: 400,
        title: "Ratio Table / Tabla de razones",
        body: `${head}${body}${arrows}
        ${conceptCard(60, 306, 520, 62)}
        <text x="320" y="347" text-anchor="middle" font-size="30" font-weight="800" fill="var(--fm-m-part)">2 : 3  =  4 : 6  =  6 : 9</text>`,
      }),
      capEn: "Multiply BOTH columns by the same number. The ratio stays the same.",
      capEs: "Multipliquen LAS DOS columnas por el mismo número. La razón no cambia.",
    };
  }

  if (topic === "exponents") {
    return {
      svg: conceptFrame({
        label: "Two to the third power equals two times two times two, which equals eight",
        tone: "amber",
        height: 380,
        title: "Exponent / Exponente",
        body: `
        <text x="96" y="168" font-size="84" font-weight="800" fill="var(--fm-primary)">2</text>
        <text x="150" y="118" font-size="46" font-weight="800" fill="var(--fm-m-unknown)">3</text>
        <text x="196" y="168" font-size="46" font-weight="700" fill="var(--fm-primary)">=</text>
        <text x="246" y="168" font-size="46" font-weight="800" fill="var(--fm-primary)">2 × 2 × 2</text>
        <text x="478" y="168" font-size="46" font-weight="800" fill="var(--fm-m-part)">= 8</text>
        <path d="M120 184 L120 212" stroke="var(--fm-primary)" stroke-width="2.5" fill="none"/>
        <text x="120" y="238" text-anchor="middle" font-size="21" font-weight="700" fill="var(--fm-primary)">base</text>
        <path d="M164 108 L176 86" stroke="var(--fm-m-unknown-edge)" stroke-width="2.5" fill="none"/>
        <text x="186" y="80" font-size="21" font-weight="700" fill="var(--fm-m-unknown)">exponent</text>
        <rect x="46" y="272" width="548" height="72" rx="16" fill="var(--fm-m-unknown-tint)" stroke="var(--fm-m-unknown-edge)" stroke-width="3"/>
        <text x="320" y="318" text-anchor="middle" font-size="28" font-weight="800" fill="var(--fm-m-unknown)">✗  2 + 2 + 2 = 6  is NOT 2³</text>`,
      }),
      capEn:
        "The exponent tells you how many times to MULTIPLY the base — never how many times to add it.",
      capEs: "El exponente dice cuántas veces MULTIPLICAR la base — nunca cuántas veces sumarla.",
    };
  }

  if (topic === "equations") {
    return {
      svg: conceptFrame({
        label: "Solving n plus 8 equals 20 by subtracting 8 from both sides to get n equals 12",
        tone: "teal",
        height: 400,
        title: "Equation / Ecuación",
        body: `
        ${conceptCard(120, 74, 400, 76)}
        <text x="320" y="128" text-anchor="middle" font-size="48" font-weight="800" fill="var(--fm-primary)">n + 8 = 20</text>
        <path d="M320 156 L320 194" stroke="var(--fm-m-part)" stroke-width="4"/>
        <path d="M308 184 L320 200 L332 184" fill="var(--fm-m-part)"/>
        <text x="344" y="186" font-size="24" font-weight="800" fill="var(--fm-m-part)">− 8 on both sides</text>
        ${conceptCard(120, 208, 400, 76)}
        <text x="320" y="260" text-anchor="middle" font-size="38" font-weight="800" fill="var(--fm-primary)">n + 8 − 8 = 20 − 8</text>
        <rect x="204" y="300" width="232" height="70" rx="35" fill="var(--fm-raised)" stroke="var(--fm-m-part)" stroke-width="4"/>
        <text x="320" y="350" text-anchor="middle" font-size="42" font-weight="800" fill="var(--fm-m-part)">n = 12</text>`,
      }),
      capEn:
        "Whatever you do to one side of the equal sign, do the exact same thing to the other side.",
      capEs: "Lo que hagan a un lado del signo igual, háganlo igual al otro lado.",
    };
  }

  if (topic === "inequalities") {
    const tick = (v) => 74 + (v - 4) * 73;
    const ticks = [4, 5, 6, 7, 8, 9, 10]
      .map(
        (v) =>
          `<line x1="${tick(v)}" y1="212" x2="${tick(v)}" y2="234" stroke="var(--fm-primary)" stroke-width="3"/><text x="${tick(v)}" y="268" text-anchor="middle" font-size="24" font-weight="700" fill="var(--fm-primary)">${v}</text>`,
      )
      .join("");
    return {
      svg: conceptFrame({
        label:
          "x plus 3 is greater than 10 means x is greater than 7, shaded to the right of an open circle at 7",
        tone: "coral",
        height: 340,
        title: "Inequality / Desigualdad",
        body: `
        <text x="320" y="128" text-anchor="middle" font-size="42" font-weight="800" fill="var(--fm-primary)">x + 3 &gt; 10   →   x &gt; 7</text>
        <rect x="${tick(7)}" y="209" width="${592 - tick(7)}" height="14" fill="var(--fm-m-part)" opacity="0.45"/>
        <line x1="46" y1="216" x2="586" y2="216" stroke="var(--fm-primary)" stroke-width="4"/>
        <path d="M578 202 L600 216 L578 230 Z" fill="var(--fm-primary)"/>
        ${ticks}
        <circle cx="${tick(7)}" cy="216" r="15" fill="var(--fm-raised)" stroke="var(--fm-m-unknown-edge)" stroke-width="5"/>
        <text x="${tick(7)}" y="178" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-m-unknown)">open · 7 not included</text>
        <text x="320" y="312" text-anchor="middle" font-size="25" font-weight="800" fill="var(--fm-m-part)">Greater than → shade to the RIGHT →</text>`,
      }),
      capEn: 'An open circle means "not equal to that number." Shade every number that works.',
      capEs:
        'El círculo abierto significa "no incluye ese número". Sombreen todos los números que sirven.',
    };
  }

  if (topic === "properties") {
    const rows = [
      ["Commutative · Conmutativa", "a + b = b + a", "3 + 5 = 5 + 3"],
      ["Associative · Asociativa", "(a + b) + c = a + (b + c)", "(2+3)+4 = 2+(3+4)"],
      ["Distributive · Distributiva", "a(b + c) = a·b + a·c", "4(2 + 3) = 8 + 12"],
    ];
    const body = rows
      .map((r, i) => {
        const y = 68 + i * 108;
        return `${conceptCard(30, y, 580, 96)}
        <text x="50" y="${y + 28}" font-size="21" font-weight="800" fill="var(--fm-m-part)">${r[0]}</text>
        <text x="50" y="${y + 63}" font-size="30" font-weight="800" fill="var(--fm-primary)">${r[1]}</text>
        <text x="590" y="${y + 88}" text-anchor="end" font-size="21" font-weight="700" fill="var(--fm-text-muted)">${r[2]}</text>`;
      })
      .join("");
    return {
      svg: conceptFrame({
        label: "Commutative, associative and distributive properties with number examples",
        tone: "amber",
        height: 408,
        title: "Properties of Operations / Propiedades",
        body,
      }),
      capEn: "These properties let you rearrange or regroup numbers without changing the answer.",
      capEs: "Estas propiedades permiten reacomodar o reagrupar sin cambiar la respuesta.",
    };
  }

  if (topic === "expressions") {
    const legend = [
      ["var(--fm-m-whole)", "3", "coefficient · coeficiente — how many x's"],
      ["var(--fm-m-part)", "x", "variable · variable — the unknown"],
      ["var(--fm-m-unknown)", "5", "constant · constante — a plain number"],
    ]
      .map(([color, sym, label], i) => {
        const y = 216 + i * 50;
        return `<rect x="60" y="${y}" width="38" height="38" rx="10" fill="${color}"/>
        <text x="79" y="${y + 28}" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-text-inverse)">${sym}</text>
        <text x="112" y="${y + 27}" font-size="24" font-weight="700" fill="var(--fm-primary)">${label}</text>`;
      })
      .join("");
    return {
      svg: conceptFrame({
        label: "The expression 3x plus 5 with the coefficient, variable and constant labelled",
        tone: "amber",
        height: 416,
        title: "Expression / Expresión",
        body: `
        ${conceptCard(150, 78, 340, 106)}
        <text x="320" y="154" text-anchor="middle" font-size="70" font-weight="800" fill="var(--fm-primary)"><tspan fill="var(--fm-m-whole)">3</tspan><tspan fill="var(--fm-m-part)">x</tspan> + <tspan fill="var(--fm-m-unknown)">5</tspan></text>
        ${legend}
        <text x="320" y="390" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-m-unknown)">No equal sign → it is an expression, not an equation</text>`,
      }),
      capEn:
        "An expression is a math phrase. It has no equal sign, so there is nothing to solve — you evaluate it.",
      capEs:
        "Una expresión es una frase matemática. No tiene signo igual, así que no se resuelve — se evalúa.",
    };
  }

  if (topic === "area") {
    return {
      svg: conceptFrame({
        label:
          "A parallelogram with base 9 inches and height 6 inches, area equals 54 square inches",
        tone: "teal",
        height: 340,
        title: "Area / Área",
        body: `
        <polygon points="70,232 250,232 312,110 132,110" fill="var(--fm-raised)" stroke="var(--fm-m-part)" stroke-width="3"/>
        <line x1="132" y1="110" x2="132" y2="232" stroke="var(--fm-m-unknown-edge)" stroke-width="4" stroke-dasharray="9 6"/>
        <path d="M132 218 L146 218 L146 232" fill="none" stroke="var(--fm-m-unknown-edge)" stroke-width="3"/>
        <text x="160" y="268" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-primary)">base = 9 in</text>
        <text x="146" y="176" font-size="24" font-weight="800" fill="var(--fm-m-unknown)">6 in</text>
        <text x="340" y="130" font-size="27" font-weight="800" fill="var(--fm-primary)">Area = base × height</text>
        <text x="340" y="190" font-size="34" font-weight="800" fill="var(--fm-primary)">= 9 × 6</text>
        <text x="340" y="248" font-size="36" font-weight="800" fill="var(--fm-m-part)">= 54 in²</text>`,
      }),
      capEn:
        "Height is the straight-up distance, not the slanted side. Area is always in square units.",
      capEs:
        "La altura es la distancia recta hacia arriba, no el lado inclinado. El área siempre va en unidades cuadradas.",
    };
  }

  if (topic === "volume") {
    return {
      svg: conceptFrame({
        label: "A rectangular prism 5 by 3 by 4 with volume 60 cubic inches",
        tone: "coral",
        height: 330,
        title: "Volume / Volumen",
        body: `
        <polygon points="70,240 230,240 288,186 128,186" fill="var(--fm-m-part-tint)" stroke="var(--fm-m-part)" stroke-width="3"/>
        <polygon points="70,240 70,124 128,70 128,186" fill="var(--fm-success-tint)" stroke="var(--fm-m-part)" stroke-width="3"/>
        <polygon points="70,124 128,70 288,70 230,124" fill="var(--fm-raised)" stroke="var(--fm-m-part)" stroke-width="3"/>
        <polygon points="70,124 230,124 230,240 70,240" fill="var(--fm-raised)" stroke="var(--fm-m-part)" stroke-width="3"/>
        <text x="150" y="274" text-anchor="middle" font-size="23" font-weight="800" fill="var(--fm-primary)">5 in</text>
        <text x="56" y="190" text-anchor="end" font-size="23" font-weight="800" fill="var(--fm-primary)">4 in</text>
        <text x="300" y="102" font-size="23" font-weight="800" fill="var(--fm-primary)">3 in</text>
        <text x="350" y="150" font-size="27" font-weight="800" fill="var(--fm-primary)">V = l × w × h</text>
        <text x="350" y="206" font-size="32" font-weight="800" fill="var(--fm-primary)">= 5 × 3 × 4</text>
        <text x="350" y="262" font-size="34" font-weight="800" fill="var(--fm-m-part)">= 60 in³</text>`,
      }),
      capEn: "Volume fills the inside of a solid, so the answer is in cubic units.",
      capEs:
        "El volumen llena el interior del sólido, por eso la respuesta va en unidades cúbicas.",
    };
  }

  if (topic === "surface-area") {
    const faces = [
      [176, 84, "12"],
      [96, 156, "15"],
      [176, 156, "20"],
      [256, 156, "15"],
      [336, 156, "20"],
      [176, 228, "12"],
    ]
      .map(
        ([x, y, v]) =>
          `<rect x="${x}" y="${y}" width="72" height="72" rx="6" fill="var(--fm-raised)" stroke="var(--fm-m-part)" stroke-width="3"/><text x="${x + 36}" y="${y + 47}" text-anchor="middle" font-size="26" font-weight="800" fill="var(--fm-primary)">${v}</text>`,
      )
      .join("");
    return {
      svg: conceptFrame({
        label:
          "A net of six rectangles with areas 12, 15, 20, 15, 20 and 12 adding to a surface area of 94 square inches",
        tone: "amber",
        height: 360,
        title: "Net → Surface Area / Red → Área de superficie",
        body: `${faces}
        <text x="440" y="150" font-size="24" font-weight="800" fill="var(--fm-primary)">Add every face:</text>
        <text x="440" y="196" font-size="17" font-weight="700" fill="var(--fm-primary)">12+15+20+15+20+12</text>
        <text x="440" y="252" font-size="34" font-weight="800" fill="var(--fm-m-part)">= 94 in²</text>
        <text x="320" y="336" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-primary)">A net is the box unfolded flat — 6 faces, 6 areas.</text>`,
      }),
      capEn: "Unfold the box, find the area of each face, then add them all together.",
      capEs: "Desdoblen la caja, hallen el área de cada cara y súmenlas todas.",
    };
  }

  if (topic === "statistics") {
    const dotX = (v) => 62 + (v - 1) * 38;
    const data = [
      [2, 1],
      [3, 2],
      [4, 1],
      [8, 1],
    ];
    const dots = data
      .map(([v, n]) =>
        Array.from(
          { length: n },
          (_, i) =>
            `<circle cx="${dotX(v)}" cy="${196 - i * 34}" r="14" fill="var(--fm-m-part)" stroke="var(--fm-m-part)" stroke-width="2"/>`,
        ).join(""),
      )
      .join("");
    const axis = [1, 2, 3, 4, 5, 6, 7, 8, 9]
      .map(
        (v) =>
          `<line x1="${dotX(v)}" y1="216" x2="${dotX(v)}" y2="230" stroke="var(--fm-primary)" stroke-width="3"/><text x="${dotX(v)}" y="260" text-anchor="middle" font-size="21" font-weight="700" fill="var(--fm-primary)">${v}</text>`,
      )
      .join("");
    const pills = [
      ["Mean · Media", "4"],
      ["Median · Mediana", "3"],
      ["Mode · Moda", "3"],
    ]
      .map(([label, val], i) => {
        const y = 84 + i * 78;
        return `${conceptCard(414, y, 196, 62)}
        <text x="432" y="${y + 27}" font-size="20" font-weight="800" fill="var(--fm-m-part)">${label}</text>
        <text x="432" y="${y + 54}" font-size="26" font-weight="800" fill="var(--fm-primary)">= ${val}</text>`;
      })
      .join("");
    return {
      svg: conceptFrame({
        label: "A dot plot of 2, 3, 3, 4 and 8 with mean 4, median 3 and mode 3",
        tone: "teal",
        height: 330,
        title: "Data: 2, 3, 3, 4, 8",
        body: `${dots}<line x1="40" y1="216" x2="394" y2="216" stroke="var(--fm-primary)" stroke-width="4"/>${axis}${pills}
        <text x="216" y="300" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fm-text-muted)">One dot = one value</text>`,
      }),
      capEn:
        "Mean is the fair share, median is the middle value in order, mode is the one that repeats most.",
      capEs:
        "La media es el reparto justo, la mediana es el valor del medio en orden, la moda es la que más se repite.",
    };
  }

  if (topic === "coordinate-plane") {
    const ox = 96;
    const oy = 296;
    const u = 34;
    const grid = Array.from({ length: 7 }, (_, i) => {
      const gx = ox + i * u;
      const gy = oy - i * u;
      return `<line x1="${gx}" y1="${oy - 6 * u}" x2="${gx}" y2="${oy}" stroke="var(--fm-m-whole)" stroke-width="1.5"/><line x1="${ox}" y1="${gy}" x2="${ox + 6 * u}" y2="${gy}" stroke="var(--fm-m-whole)" stroke-width="1.5"/>`;
    }).join("");
    const nums = [1, 2, 3, 4, 5, 6]
      .map(
        (v) =>
          `<text x="${ox + v * u}" y="${oy + 26}" text-anchor="middle" font-size="18" font-weight="700" fill="var(--fm-text-muted)">${v}</text><text x="${ox - 12}" y="${oy - v * u + 7}" text-anchor="end" font-size="18" font-weight="700" fill="var(--fm-text-muted)">${v}</text>`,
      )
      .join("");
    return {
      svg: conceptFrame({
        label: "Plotting the point 3 comma 4 by moving right 3 then up 4 on a coordinate grid",
        tone: "amber",
        height: 340,
        title: "Coordinate Plane / Plano de coordenadas",
        body: `${grid}
        <line x1="${ox}" y1="${oy}" x2="${ox + 6 * u + 14}" y2="${oy}" stroke="var(--fm-primary)" stroke-width="4"/>
        <line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy - 6 * u - 14}" stroke="var(--fm-primary)" stroke-width="4"/>
        <line x1="${ox}" y1="${oy}" x2="${ox + 3 * u}" y2="${oy}" stroke="var(--fm-m-unknown-edge)" stroke-width="6"/>
        <line x1="${ox + 3 * u}" y1="${oy}" x2="${ox + 3 * u}" y2="${oy - 4 * u}" stroke="var(--fm-m-part)" stroke-width="6"/>
        <circle cx="${ox + 3 * u}" cy="${oy - 4 * u}" r="13" fill="var(--fm-m-unknown)" stroke="var(--fm-primary)" stroke-width="3"/>
        ${nums}
        <text x="${ox + 3 * u + 22}" y="${oy - 4 * u - 12}" font-size="26" font-weight="800" fill="var(--fm-primary)">(3, 4)</text>
        <text x="376" y="132" font-size="26" font-weight="800" fill="var(--fm-m-unknown)">1. Right 3  (x)</text>
        <text x="376" y="182" font-size="26" font-weight="800" fill="var(--fm-m-part)">2. Up 4  (y)</text>
        <text x="376" y="240" font-size="24" font-weight="700" fill="var(--fm-primary)">Always x first,</text>
        <text x="376" y="272" font-size="24" font-weight="700" fill="var(--fm-primary)">then y.</text>`,
      }),
      capEn: "Start at (0, 0). The first number moves across, the second number moves up or down.",
      capEs:
        "Empiecen en (0, 0). El primer número mueve a los lados, el segundo mueve arriba o abajo.",
    };
  }

  if (topic === "number-line") {
    const nx = (v) => 320 + v * 52;
    const ticks = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]
      .map(
        (v) =>
          `<line x1="${nx(v)}" y1="200" x2="${nx(v)}" y2="222" stroke="var(--fm-primary)" stroke-width="3"/><text x="${nx(v)}" y="256" text-anchor="middle" font-size="22" font-weight="700" fill="var(--fm-primary)">${v < 0 ? `−${Math.abs(v)}` : v}</text>`,
      )
      .join("");
    return {
      svg: conceptFrame({
        label:
          "A number line from negative 5 to 5 showing that negative 3 is 3 units from zero, so the absolute value of negative 3 is 3",
        tone: "teal",
        height: 330,
        title: "Number Line / Recta numérica",
        body: `
        <text x="320" y="112" text-anchor="middle" font-size="38" font-weight="800" fill="var(--fm-primary)">|−3| = 3</text>
        <rect x="${nx(-3)}" y="204" width="${nx(0) - nx(-3)}" height="14" fill="var(--fm-m-unknown)" opacity="0.75"/>
        <line x1="40" y1="211" x2="600" y2="211" stroke="var(--fm-primary)" stroke-width="4"/>
        <path d="M32 197 L14 211 L32 225 Z" fill="var(--fm-primary)"/>
        <path d="M608 197 L626 211 L608 225 Z" fill="var(--fm-primary)"/>
        ${ticks}
        <circle cx="${nx(-3)}" cy="211" r="13" fill="var(--fm-m-unknown)" stroke="var(--fm-primary)" stroke-width="3"/>
        <circle cx="${nx(0)}" cy="211" r="13" fill="var(--fm-m-part)" stroke="var(--fm-primary)" stroke-width="3"/>
        <text x="${(nx(-3) + nx(0)) / 2}" y="176" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-m-unknown)">3 units from 0</text>
        <text x="320" y="304" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-primary)">Left of 0 = negative   ·   Right of 0 = positive</text>`,
      }),
      capEn: "Absolute value is only the DISTANCE from zero, so it is never negative.",
      capEs: "El valor absoluto es solo la DISTANCIA desde cero, así que nunca es negativo.",
    };
  }

  if (topic === "fractions") {
    const bars = [0, 1, 2]
      .map((b) => {
        const x0 = 46 + b * 186;
        const cells = [0, 1, 2, 3]
          .map((c) => {
            const cx = x0 + c * 42;
            const n = b * 4 + c + 1;
            return `<rect x="${cx}" y="76" width="42" height="58" fill="${n % 2 ? "var(--fm-raised)" : "var(--fm-success-tint)"}" stroke="var(--fm-m-part)" stroke-width="2.5"/><text x="${cx + 21}" y="113" text-anchor="middle" font-size="20" font-weight="800" fill="var(--fm-m-part)">${n}</text>`;
          })
          .join("");
        return `${cells}<text x="${x0 + 84}" y="160" text-anchor="middle" font-size="21" font-weight="800" fill="var(--fm-primary)">1 foot</text>`;
      })
      .join("");
    return {
      svg: conceptFrame({
        label:
          "Three one-foot bars each cut into four quarter-foot pieces, giving twelve pieces, worked with keep change flip",
        tone: "coral",
        height: 420,
        title: "3 ÷ ¼  —  How many ¼ fit inside 3?",
        body: `${bars}
        <text x="320" y="196" text-anchor="middle" font-size="30" font-weight="800" fill="var(--fm-m-part)">12 pieces</text>
        ${conceptRow(212, 1, "Whole over 1:  3  →  3/1", "var(--fm-m-whole)")}
        ${conceptRow(280, 2, "Keep, Change, Flip:  3/1 × 4/1", "var(--fm-m-part)")}
        ${conceptRow(348, 3, "Multiply across:  12/1 = 12", "var(--fm-m-unknown)")}`,
      }),
      capEn:
        "Dividing by a fraction asks how many of that small piece fit inside. For a positive amount, dividing by a fraction between 0 and 1 makes the result larger.",
      capEs:
        "Dividir entre una fracción pregunta cuántas piezas pequeñas caben adentro. Para una cantidad positiva, dividir entre una fracción entre 0 y 1 aumenta el resultado.",
    };
  }

  if (topic === "decimals") {
    // The three 6.NOS.3 lessons do not share a rule — see decimalOperation().
    // Stating the addition rule on the division lesson was teaching the exact
    // move that lesson exists to replace.
    const op = decimalOperation(config);
    if (op === "divide") {
      // The worked form is the long-division TABLEAU, not an arrow rewrite —
      // families should see the problem the way the student writes it. The
      // bracket is DRAWN (vinculum + hook paths with explicit stroke); the
      // U+27CC bracket glyph is banned — no shipped font renders it
      // (tools/unrenderable-glyphs.test.mjs).
      return {
        svg: conceptFrame({
          label:
            "14.4 divided by 1.2 becomes 144 divided by 12, worked as long division with quotient 12",
          tone: "amber",
          height: 380,
          title: "Dividing Decimals / Dividir decimales",
          body: `
        <text x="320" y="112" text-anchor="middle" font-size="36" font-weight="800" fill="var(--fm-primary)">14.4 ÷ 1.2   →   144 ÷ 12</text>
        <text x="320" y="176" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-m-unknown)">Move BOTH decimal points 1 place</text>
        ${conceptCard(180, 236, 280, 122)}
        <text x="252" y="326" text-anchor="end" font-size="44" font-weight="800" fill="var(--fm-primary)">12</text>
        <path d="M262 272 q-16 30 6 62" stroke="var(--fm-primary)" stroke-width="4" fill="none"/>
        <path d="M262 272 H 420" stroke="var(--fm-primary)" stroke-width="4" fill="none"/>
        <text x="278" y="326" font-size="44" font-weight="800" fill="var(--fm-primary)">144</text>
        <text x="414" y="262" text-anchor="end" font-size="44" font-weight="800" fill="var(--fm-m-part)">12</text>`,
        }),
        capEn:
          "Move the decimal point the same number of places in BOTH numbers, then divide whole numbers.",
        capEs:
          "Muevan el punto decimal el mismo número de lugares en LOS DOS números y luego dividan enteros.",
      };
    }
    if (op === "multiply") {
      return {
        svg: conceptFrame({
          label:
            "1.2 times 0.4 equals 0.48, found by multiplying 12 times 4 and counting two decimal places",
          tone: "amber",
          height: 360,
          title: "Multiplying Decimals / Multiplicar decimales",
          body: `
        ${conceptCard(120, 70, 400, 82)}
        <text x="320" y="126" text-anchor="middle" font-size="44" font-weight="800" fill="var(--fm-primary)">1.2 × 0.4 = 0.48</text>
        ${conceptRow(168, 1, "Multiply like whole numbers:  12 × 4 = 48", "var(--fm-m-whole)")}
        ${conceptRow(236, 2, "Count decimal places:  1 + 1 = 2", "var(--fm-m-part)")}
        ${conceptRow(288, 3, "Put 2 places back in:  48 → 0.48", "var(--fm-m-unknown)")}`,
        }),
        capEn:
          "Count the decimal places in BOTH factors — that is how many places the answer needs.",
        capEs:
          "Cuenten las cifras decimales de LOS DOS factores — esas son las que lleva la respuesta.",
      };
    }
    return {
      svg: conceptFrame({
        label: "Adding 12.50 and 3.75 vertically with the decimal points lined up to get 16.25",
        tone: "amber",
        height: 360,
        title: "Adding & Subtracting Decimals",
        body: `
        ${conceptCard(150, 70, 340, 218)}
        <line x1="352" y1="86" x2="352" y2="272" stroke="var(--fm-m-unknown-edge)" stroke-width="3" stroke-dasharray="8 6"/>
        <text x="348" y="136" text-anchor="end" font-size="42" font-weight="800" fill="var(--fm-primary)">12</text>
        <text x="356" y="136" font-size="42" font-weight="800" fill="var(--fm-primary)">.50</text>
        <text x="348" y="196" text-anchor="end" font-size="42" font-weight="800" fill="var(--fm-primary)">+   3</text>
        <text x="356" y="196" font-size="42" font-weight="800" fill="var(--fm-primary)">.75</text>
        <line x1="196" y1="214" x2="452" y2="214" stroke="var(--fm-primary)" stroke-width="4"/>
        <text x="348" y="266" text-anchor="end" font-size="42" font-weight="800" fill="var(--fm-m-part)">16</text>
        <text x="356" y="266" font-size="42" font-weight="800" fill="var(--fm-m-part)">.25</text>
        <text x="320" y="330" text-anchor="middle" font-size="25" font-weight="800" fill="var(--fm-m-unknown)">Line up the decimal points first — always.</text>`,
      }),
      capEn:
        "Stack the numbers so the decimal points sit in one straight line, then add or subtract as usual.",
      capEs:
        "Acomoden los números para que los puntos decimales queden en una línea recta, y luego sumen o resten.",
    };
  }

  if (topic === "factors") {
    const prime = (x, y, v) =>
      `<circle cx="${x}" cy="${y}" r="27" fill="var(--fm-m-part)"/><text x="${x}" y="${y + 11}" text-anchor="middle" font-size="28" font-weight="800" fill="var(--fm-text-inverse)">${v}</text>`;
    return {
      svg: conceptFrame({
        label: "A factor tree breaking 24 into 4 and 6, then into the primes 2, 2, 2 and 3",
        tone: "teal",
        height: 400,
        title: "Factor Tree / Árbol de factores",
        body: `
        <text x="320" y="98" text-anchor="middle" font-size="46" font-weight="800" fill="var(--fm-primary)">24</text>
        <line x1="298" y1="112" x2="232" y2="158" stroke="var(--fm-primary)" stroke-width="3"/>
        <line x1="342" y1="112" x2="408" y2="158" stroke="var(--fm-primary)" stroke-width="3"/>
        <text x="222" y="192" text-anchor="middle" font-size="38" font-weight="800" fill="var(--fm-primary)">4</text>
        <text x="418" y="192" text-anchor="middle" font-size="38" font-weight="800" fill="var(--fm-primary)">6</text>
        <line x1="208" y1="206" x2="152" y2="248" stroke="var(--fm-primary)" stroke-width="3"/>
        <line x1="236" y1="206" x2="262" y2="248" stroke="var(--fm-primary)" stroke-width="3"/>
        <line x1="404" y1="206" x2="378" y2="248" stroke="var(--fm-primary)" stroke-width="3"/>
        <line x1="432" y1="206" x2="488" y2="248" stroke="var(--fm-primary)" stroke-width="3"/>
        ${prime(140, 282, "2")}${prime(272, 282, "2")}${prime(368, 282, "2")}${prime(500, 282, "3")}
        <text x="320" y="366" text-anchor="middle" font-size="32" font-weight="800" fill="var(--fm-m-part)">24 = 2 × 2 × 2 × 3</text>`,
      }),
      capEn:
        "Keep splitting until every branch ends on a prime number (circled). Those primes are the answer.",
      capEs:
        "Sigan separando hasta que cada rama termine en un número primo (en círculo). Esos primos son la respuesta.",
    };
  }

  if (topic === "division") {
    const pill = (y, n, label, work, bg, stroke, ink) =>
      `<rect x="336" y="${y}" width="272" height="64" rx="14" fill="${bg}" stroke="${stroke}" stroke-width="2.5"/>
        <text x="354" y="${y + 27}" font-size="22" font-weight="800" fill="${ink}">${n}. ${label}</text>
        <text x="354" y="${y + 52}" font-size="21" font-weight="700" fill="var(--fm-primary)">${work}</text>`;
    return {
      svg: conceptFrame({
        label: "Long division of 1,344 by 12 using divide, multiply, subtract and bring down",
        tone: "navy",
        height: 400,
        title: "Long Division:  D · M · S · B",
        body: `
        ${conceptCard(30, 82, 288, 152)}
        <text x="118" y="182" text-anchor="end" font-size="42" font-weight="800" fill="var(--fm-primary)">12</text>
        <path d="M128 128 q-16 30 6 62" stroke="var(--fm-primary)" stroke-width="4" fill="none"/>
        <path d="M128 128 H 296" stroke="var(--fm-primary)" stroke-width="4" fill="none"/>
        <text x="144" y="182" font-size="42" font-weight="800" fill="var(--fm-primary)">1,344</text>
        <text x="290" y="118" text-anchor="end" font-size="42" font-weight="800" fill="var(--fm-m-part)">112</text>
        <text x="174" y="272" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-primary)">Repeat D-M-S-B until</text>
        <text x="174" y="304" text-anchor="middle" font-size="24" font-weight="800" fill="var(--fm-primary)">no digits are left.</text>
        ${pill(76, 1, "Divide", "13 ÷ 12 = 1", "var(--fm-m-whole-tint)", "var(--fm-m-whole)", "var(--fm-m-whole)")}
        ${pill(154, 2, "Multiply", "1 × 12 = 12", "var(--fm-success-tint)", "var(--fm-m-part)", "var(--fm-m-part)")}
        ${pill(232, 3, "Subtract", "13 − 12 = 1", "var(--fm-m-unknown-tint)", "var(--fm-m-unknown)", "var(--fm-m-unknown)")}
        ${pill(310, 4, "Bring down", "bring down the 4", "var(--fm-m-unknown-tint)", "var(--fm-m-unknown)", "var(--fm-m-unknown)")}`,
      }),
      capEn:
        "Four moves, in the same order, every single time: Divide, Multiply, Subtract, Bring down.",
      capEs: "Cuatro pasos, en el mismo orden, siempre: Dividir, Multiplicar, Restar, Bajar.",
    };
  }

  // Fallback. The twelve MPP "Math is ..." lessons in units 1 and 10 are habits
  // of mind, not a single procedure, so there is no topic drawing to reach for.
  // Repeating all four steps here (the old behaviour) only duplicated the
  // guided-steps list directly below it. Show the two ends instead — where the
  // example starts and where it lands — which is the one thing the step list
  // does NOT show at a glance.
  const steps = buildConceptSteps(config);
  const first = steps[0];
  const last = steps.length > 1 ? steps[steps.length - 1] : null;
  if (!first) return { svg: "", capEn: "", capEs: "" };
  const end = (en, es, cls, labelEn, labelEs) => `
      <div class="concept-fallback-step ${cls}">
        <span class="concept-fallback-label"><span class="lang-en">${labelEn}</span><span class="lang-es" lang="es">${labelEs}</span></span>
        <span class="concept-fallback-text lang-en">${esc(splitExplanation(en).lead)}</span>
        <span class="concept-fallback-text lang-es" lang="es">${esc(splitExplanation(es).lead)}</span>
      </div>`;
  return {
    svg: `<div class="concept-fallback-visual">
      ${end(first.en, first.es, "is-start", "We start with", "Empezamos con")}
      ${last ? `<div class="concept-fallback-arrow" aria-hidden="true">→</div>${end(last.en, last.es, "is-end", "We end with", "Terminamos con")}` : ""}
    </div>`,
    capEn: "",
    capEs: "",
  };
}

/* The label arrives as "English / Español". Split it HERE: the build-time
   localizer that handles the other bilingual controls matches
   `<button ... class="help-pop-btn" ...>`, and `[^>]*` cannot cross the `>`
   characters that appear inside this button's own data-help JSON, so some of
   these buttons kept both languages and others did not. */
function helpButton(label, payload) {
  const data = String(JSON.stringify(payload)).replace(/&/g, "&amp;").replace(/'/g, "&#39;");
  return `<button type="button" class="help-pop-btn" data-help='${data}' ${act("openHelpModalFromBtn", EL)}>${splitBilingualLabel(label)}</button>`;
}

/** "🔎 English text / Texto español" -> language-switched spans, icon kept. */
export function splitBilingualLabel(raw) {
  const text = String(raw ?? "");
  if (!text.includes(" / ")) return text;
  const lead = text.match(/^([^\p{L}\p{N}]*)([\s\S]*)$/u);
  const icon = lead ? lead[1] : "";
  const rest = lead ? lead[2] : text;
  const at = rest.indexOf(" / ");
  if (at === -1) return text;
  const en = rest.slice(0, at).trim();
  const es = rest.slice(at + 3).trim();
  if (!en || !es) return text;
  return `${icon}<span class="lang-en">${en}</span><span class="lang-es" lang="es">${es}</span>`;
}

export function selectQuickCheckProblems(practice = {}, config = {}) {
  return selectAlignedQuickCheckProblems(practice, config);
}

/* The hero kicker names the Reveal unit the lesson belongs to. It used to print
   UNIT_THEMES[n].nameEn, a theme list keyed by the PRE-2026-08-10 unit
   numbers, so lesson 6-3 (Numerical and Algebraic Expressions, a music-studio
   lesson) announced "Unit 6 · Culinary & Recipe Lab" over a sound-studio
   example. The unit title comes from the TOC the rest of the site uses. */
const REVEAL_TOC = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "data", "reveal-toc-2025.json"),
    "utf8",
  ),
);
const UNIT_TITLES_ES = {
  1: "Las matemáticas son...",
  2: "Entender el mundo que nos rodea con la estadística",
  3: "Razones y tasas",
  4: "Entender y usar porcentajes",
  5: "Resolver problemas de área, área total y volumen",
  6: "Expresiones numéricas y algebraicas",
  7: "Enteros, números racionales y el plano de coordenadas",
  8: "Ecuaciones y desigualdades",
  9: "Relaciones entre dos variables",
  10: "Las matemáticas son...",
};
export function revealUnitTitle(unit) {
  const n = Number(unit);
  const hit = (REVEAL_TOC.units || []).find((u) => Number(u.unit ?? u.number) === n);
  return { en: hit?.title || "", es: UNIT_TITLES_ES[n] || hit?.title || "" };
}

export function renderWelcomeBanner(config, lessonId) {
  const unit = config.unit || 1;
  const theme = getUnitTheme(unit);
  const unitTitle = revealUnitTitle(unit);
  const themeEmoji = config.themeEmoji || theme.emoji || "🏠";
  const title = config.familyNotes?.sessionTitle || config.title || "Tonight's Lesson";
  const standard = config.standard || "";
  const experience = config.familyNotes?.experience;
  const partner = sessionPartner(lessonId);
  const here = partner ? sessionOf(lessonId) : null;
  const pageLabelEn = here
    ? `Lesson ${here.baseId} · ${SESSIONS[here.session].en}`
    : homeworkPageLabel(lessonId);
  const bigIdea = learningTonight(config);
  const pageLabelEs = pageLabelEn
    .replace(/^Lesson /, "Lección ")
    .replace(/^Review/, "Repaso")
    .replace(/Session (\d): .*$/, (_, n) => SESSIONS[n].es)
    .replace("Session 2", "Sesión 2")
    .replace("Section 3", "Sección 3");

  return `
    ${renderPrintHead({
      unitLabel: {
        en: `Unit ${unit}${unitTitle.en ? ` · ${unitTitle.en}` : ""}`,
        es: `Unidad ${unit}${unitTitle.es ? ` · ${unitTitle.es}` : ""}`,
      },
      lessonTitle: { en: title, es: familyTitlesEs[lessonId] || title },
      pageLabel: { en: pageLabelEn, es: pageLabelEs },
    })}
    ${renderHero({
      unit,
      unitTitle,
      title: { en: title, es: familyTitlesEs[lessonId] || title },
      pageLabel: { en: pageLabelEn, es: pageLabelEs },
      hook: v3Of(config, lessonId).hook,
      topBar: renderTopBar({
        readAloud: {
          en: `${title}. ${v3Of(config, lessonId).hook.en}`,
          es: `${familyTitlesEs[lessonId] || title}. ${v3Of(config, lessonId).hook.es}`,
        },
      }),
      routes: renderQuickPlan(),
      extras: `
        ${renderSessionBanner(lessonId, partner)}
        <p class="hw-hero-bigidea" aria-label="Big idea">
          <span class="hw-hero-bigidea-label"><span class="lang-en">Big idea</span><span class="lang-es" lang="es">Idea principal</span></span>
          <span class="lang-en">${esc(completeSentence(bigIdea.en))}</span><span class="lang-es" lang="es">${esc(completeSentence(bigIdea.es))}</span>
        </p>
        ${renderTonightStrip()}
        ${renderExperienceBadge(experience)}`,
      sheet: renderMoreSheet({ standard }),
    })}`;
}

/* The other night's page for a two-session lesson, or null when the lesson has one night.
   This stays on family homework; the separate classroom lesson exit remains
   intentionally free of a next-day navigation prompt. */
function sessionPartner(lessonId) {
  const here = sessionOf(lessonId);
  if (!here) return null;
  const otherId = here.session === 2 ? here.baseId : `${here.baseId}-part2`;
  if (!existsSync(lessonPath(otherId, "homework.html"))) return null;
  const notesPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "../data/family-homework-notes",
    `${otherId}.json`,
  );
  const notes = existsSync(notesPath) ? JSON.parse(readFileSync(notesPath, "utf8")) : {};
  return { href: `/lessons/${otherId}/homework.html`, learningTonight: notes.learningTonight };
}

/* The start panel: two route cards and one Start button, the hero's action column. */
export function renderQuickPlan() {
  const route = (mode, active, nameEn, nameEs, descEn, descEs) => `
          <button type="button" class="hw-route-option fm-route${active ? " is-active" : ""}" data-route-mode="${mode}" aria-pressed="${active}" ${act("setHomeworkRoute", mode)}>
            <span class="fm-route__title hw-route-copy"><strong><span class="lang-en">${nameEn}</span><span class="lang-es" lang="es">${nameEs}</span></strong></span>
            <span class="fm-chip fm-chip--accent hw-route-time">${ROUTE_TIMES[mode]} <small>min</small></span>
            <span class="fm-route__desc"><span class="lang-en">${descEn}</span><span class="lang-es" lang="es">${descEs}</span></span>
          </button>`;
  return `
      <section class="hw-route-chooser fm-hero__action" aria-labelledby="hw_route_title">
        <h2 id="hw_route_title" class="fm-hero__q"><span class="lang-en">How much time do you have tonight?</span><span class="lang-es" lang="es">¿Cuánto tiempo tienen esta noche?</span></h2>
        <div class="hw-route-options fm-routes" role="group" aria-label="How much time do you have tonight?" data-aria-en="How much time do you have tonight?" data-aria-es="¿Cuánto tiempo tienen esta noche?">${route("quick", true, "Quick Practice", "Práctica rápida", "One example and 2 problems.", "Un ejemplo y 2 problemas.")}${route("full", false, "Keep Going", "Seguir practicando", "Key words, every problem, a game and a home mission.", "Palabras clave, todos los problemas, un juego y una misión en casa.")}
        </div>
        <button type="button" id="hw_start_button" class="fm-btn fm-btn--primary fm-btn--lg fm-btn--block" ${act("startHomework")}><span class="lang-en">Start tonight's math</span><span class="lang-es" lang="es">Empezar la matemática de hoy</span></button>
        <p class="hw-route-promise fm-hero__promise"><span class="lang-en">Optional. No grades. Your choice is saved here.</span><span class="lang-es" lang="es">Opcional. Sin calificaciones. Su elección se guarda aquí.</span></p>
        <p class="hw-route-note fm-sr" id="hw_route_note" aria-live="polite">
          <span class="lang-en">Quick Practice selected: one example and 2 problems. Stop whenever you need.</span>
          <span class="lang-es" lang="es">Práctica rápida seleccionada: un ejemplo y 2 problemas. Pueden parar cuando lo necesiten.</span>
        </p>
        <p id="hw_resume_note" class="fm-hero__resume" role="status" aria-live="polite"></p>
      </section>`;
}

export function renderLearningTonight(config) {
  const { en, es } = learningTonight(config);
  const vocab = (config.vocabulary || []).slice(0, 3);
  const wordsEn = vocab
    .map((v) => v.term)
    .filter(Boolean)
    .join(", ");
  const wordsEs = vocab
    .map((v) => v.termEs || v.term)
    .filter(Boolean)
    .join(", ");

  return `
    <section class="guided-section card section-learn" aria-label="What we are learning tonight">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
        <h2 class="section-title" style="margin:0;">📖 <span class="lang-en">What we're learning tonight</span><span class="lang-es" lang="es">Qué aprendemos hoy</span></h2>
        <button type="button" class="btn-read-aloud" ${act("speakHomeworkText", en, es)} title="Listen / Escuchar" aria-label="Listen to summary">🔊 <span class="lang-en">Listen</span><span class="lang-es" lang="es">Escuchar</span></button>
      </div>
      <div class="bilingual-grid">
        <div class="bilingual-col lang-en">
          <span class="lang-label">English</span>
          <p class="learning-big">${esc(completeSentence(en.charAt(0).toUpperCase() + en.slice(1)))}</p>
          ${wordsEn ? renderVocabularyChips(vocab, "en") : ""}
        </div>
        <div class="bilingual-col lang-es" lang="es">
          <span class="lang-label">Español</span>
          <p class="learning-big">${esc(completeSentence(es))}</p>
          ${wordsEs ? renderVocabularyChips(vocab, "es") : ""}
        </div>
      </div>
    </section>`;
}

/* The grown-up's version, first thing on the page: one question that helps
   and one thing not to say. The full coaching lived only in "If your student
   gets stuck", a collapsed panel near the bottom of the Learn stop. */
function renderParentQuickCard(config) {
  const tips = stuckTips(config) || {};
  const ask = familyGuidance(config).question;
  const avoid = tips.dontSay?.[0];
  const bridge = bridgeOf(config.familyNotes);
  if (!ask && !avoid && !bridge) return "";
  const row = (icon, labelEn, labelEs, tip) =>
    tip
      ? `<li><span aria-hidden="true">${icon}</span> <strong><span class="lang-en">${labelEn}</span><span class="lang-es" lang="es">${labelEs}</span></strong> <span class="lang-en">${esc(tip.en)}</span><span class="lang-es" lang="es">${esc(tip.es || tip.en)}</span></li>`
      : "";
  return `
      <div class="parent-quick-card">
        <p class="parent-quick-title"><span class="lang-en">For the grown-up helping tonight</span><span class="lang-es" lang="es">Para el adulto que ayuda hoy</span></p>
        <ul>
          ${row("💬", "If they get stuck, ask:", "Si se atora, pregunten:", ask)}
          ${row("🚫", "Try not to say:", "Eviten decir:", avoid)}
        </ul>${bridge ? renderBridgeCard(bridge) : ""}
      </div>`;
}

function renderUnit4FamilyBigIdeaVisual(config) {
  const model = config.familyBigIdeaVisual;
  if (!model) return "";
  const bilingual = (en, es) =>
    `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es)}</span>`;

  if (model.type === "percent-grid") {
    const cells = Array.from(
      { length: 100 },
      (_, i) =>
        `<span class="${i < model.filledSquares ? "is-filled" : ""}" aria-hidden="true"></span>`,
    ).join("");
    return `<div class="family-big-idea-visual">
      <div class="family-visual-equation"><strong>${esc(model.ratio)}</strong><span aria-hidden="true">→</span><strong>${esc(model.percent)}</strong></div>
      <div class="family-percent-grid" aria-hidden="true">${cells}</div>
      <p>${bilingual("Each shaded square is 1 out of 100, or 1%.", "Cada cuadro sombreado representa 1 de 100, o 1%.")}</p>
    </div>`;
  }

  if (model.type === "equivalent-forms") {
    return `<div class="family-big-idea-visual family-equivalent-forms">${model.forms
      .map(
        (form, i) =>
          `${i ? '<span class="family-visual-equals" aria-hidden="true">=</span>' : ""}<div class="family-form-card"><span>${bilingual(form.labelEn, form.labelEs)}</span><strong>${esc(form.value)}</strong></div>`,
      )
      .join("")}</div>`;
  }

  if (model.type === "estimate") {
    return `<div class="family-big-idea-visual family-estimate-visual">
      <div class="family-estimate-values"><span>${esc(model.given)}</span><span aria-hidden="true">≈</span><span>${esc(model.friendly)}</span><span aria-hidden="true">≈</span><strong>${esc(model.estimate)}</strong></div>
      <p>${bilingual(model.explanationEn, model.explanationEs)}</p>
    </div>`;
  }

  if (model.type === "discount") {
    return `<div class="family-big-idea-visual family-discount-visual">
      <div class="family-discount-equation">
        <strong>${esc(model.original)} <small style="display:block;">${bilingual("Original (100%)", "Original (100%)")}</small></strong>
        <span aria-hidden="true">−</span>
        <span>${esc(model.savings)} <small style="display:block;">${bilingual(`${model.percent} saved`, `${model.percent} de ahorro`)}</small></span>
        <span aria-hidden="true">=</span>
        <strong class="u-tint-part">${esc(model.salePrice)} <small style="display:block;">${bilingual("Sale price to pay", "Precio de oferta")}</small></strong>
      </div>
      <div class="family-discount-bar" aria-hidden="true">
        <span class="u-ink-unknown" style="display:flex;align-items:center;justify-content:center;">${esc(model.savings)}</span>
        <span class="u-ink-whole" style="display:flex;align-items:center;justify-content:center;">${esc(model.savings)}</span>
        <span class="u-ink-whole" style="display:flex;align-items:center;justify-content:center;">${esc(model.savings)}</span>
        <span class="u-ink-whole" style="display:flex;align-items:center;justify-content:center;">${esc(model.savings)}</span>
      </div>
      <div class="family-discount-labels">
        <span>${bilingual(`${model.percent} off = ${model.savings}`, `${model.percent} de descuento = ${model.savings}`)}</span>
        <span>${bilingual(`Sale price = ${model.salePrice}`, `Precio a pagar = ${model.salePrice}`)}</span>
      </div>
      <p style="margin:12px 0 0;text-align:center;">
        ${bilingual(
          `How it works: 25% of ${model.original} = 0.25 × ${model.original.replace("$", "")} = ${model.savings} off. Then subtract: ${model.original} − ${model.savings} = ${model.salePrice}.`,
          `Cómo funciona: 25% de ${model.original} = 0.25 × ${model.original.replace("$", "")} = ${model.savings} de descuento. Luego resta: ${model.original} − ${model.savings} = ${model.salePrice}.`,
        )}
      </p>
    </div>`;
  }

  if (model.type === "find-whole") {
    return `<div class="family-big-idea-visual family-whole-visual">
      <div class="family-whole-labels">
        <strong>${esc(model.part)} = ${esc(model.percent)}</strong>
        <strong class="u-ink-part">100% = ${esc(model.whole)}</strong>
      </div>
      <div class="family-whole-bar" aria-hidden="true">
        ${Array.from({ length: 10 }, (_, i) => `<span class="${i < model.tenths ? "is-filled" : ""}" style="display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:${i < model.tenths ? "var(--fm-raised)" : "var(--fm-inverse)"};">$7</span>`).join("")}
      </div>
      <div class="family-discount-labels" style="margin-top:6px;">
        <span class="u-ink-part">${bilingual(`6 blocks = ${model.part} (${model.percent})`, `6 bloques = ${model.part} (${model.percent})`)}</span>
        <span class="u-ink-whole">${bilingual(`10 blocks = ${model.whole} (100%)`, `10 bloques = ${model.whole} (100%)`)}</span>
      </div>
      <div class="family-ratio-table-wrap" style="margin:12px auto 0;max-width:340px;overflow-x:auto;" role="region" tabindex="0" aria-label="Ratio table" data-aria-en="Ratio table" data-aria-es="Tabla de razones">
        <table class="fill-table u-bg-raised u-edge" style="width:100%;text-align:center;border-collapse:collapse;margin:0 auto;overflow:hidden;">
          <thead>
            <tr class="u-head u-ink-inverse">
              <th scope="col" style="padding:4px 8px;"><span class="lang-en">Percent</span><span class="lang-es" lang="es">Porcentaje</span></th>
              <th scope="col" style="padding:4px 8px;"><span class="lang-en">Price</span><span class="lang-es" lang="es">Precio</span></th>
              <th scope="col" style="padding:4px 8px;"><span class="lang-en">Step</span><span class="lang-es" lang="es">Paso</span></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="u-ink-part" style="padding:4px 8px;">60%</td>
              <td class="u-ink-part" style="padding:4px 8px;">$42</td>
              <td class="u-ink-muted" style="padding:4px 8px;"><span class="lang-en">Known part</span><span class="lang-es" lang="es">Parte conocida</span></td>
            </tr>
            <tr class="u-tint-part">
              <td class="u-ink-whole" style="padding:4px 8px;">10%</td>
              <td class="u-ink-whole" style="padding:4px 8px;">$7</td>
              <td class="u-ink-whole" style="padding:4px 8px;">÷ 6</td>
            </tr>
            <tr class="u-tint-unknown u-edge-top">
              <td class="u-ink-unknown" style="padding:4px 8px;">100%</td>
              <td class="u-ink-unknown" style="padding:4px 8px;">$70</td>
              <td class="u-ink-unknown" style="padding:4px 8px;">× 10</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style="margin:12px 0 0;text-align:center;">
        ${bilingual(
          `How it works: In a simple ratio table, find 10% first: $42 ÷ 6 = $7. Then scale up to 100%: 10 × $7 = $70. Or divide the part by the percent as a decimal: $42 ÷ 0.60 = $70.`,
          `Cómo funciona: En una tabla de razones simple, halla primero el 10%: $42 ÷ 6 = $7. Luego escala al 100%: 10 × $7 = $70. O divide la parte entre el porcentaje en decimal: $42 ÷ 0.60 = $70.`,
        )}
      </p>
    </div>`;
  }

  return "";
}

export function renderConceptExplainer(config) {
  const steps = buildConceptSteps(config);
  const keyEn = keyIdea(config);
  const keyEs = keyIdeaEs(config);
  const visual = conceptVisual(config);
  // The caption lives in HTML, not inside the <svg>, so the page language
  // toggle can hide one language and so it scales with the reader's own font
  // size — SVG text does neither.
  const caption =
    visual.capEn || visual.capEs
      ? `<figcaption class="concept-visual-caption">${visual.capEn ? `<span class="lang-en">${esc(visual.capEn)}</span>` : ""}${visual.capEs ? `<span class="lang-es" lang="es">${esc(visual.capEs)}</span>` : ""}</figcaption>`
      : "";

  if (config.familyBigIdeaFormat === "simple-visual") {
    return `
    <section class="guided-section card section-visual" aria-label="Visual concept explainer">
      <h2 class="section-title">🎯 <span class="lang-en">The big idea</span><span class="lang-es" lang="es">La idea principal</span></h2>
      <div class="big-idea">
        <div class="family-big-idea-piece">
          <div class="family-big-idea-copy">
            <p class="lang-en">${esc(completeSentence(keyEn))}</p>
            <p class="lang-es" lang="es">${esc(completeSentence(keyEs))}</p>
            <button type="button" class="btn-read-aloud" ${act("speakHomeworkText", keyEn, keyEs)} title="Listen / Escuchar" aria-label="Listen to big idea" data-aria-en="Listen to big idea" data-aria-es="Escuchar la idea principal">🔊 <span class="lang-en">Listen</span><span class="lang-es" lang="es">Escuchar</span></button>
          </div>
          ${renderUnit4FamilyBigIdeaVisual(config)}
        </div>
      </div>
    </section>`;
  }

  return `
    <section class="guided-section card section-visual" aria-label="Visual concept explainer">
      <h2 class="section-title">🎯 <span class="lang-en">The big idea</span><span class="lang-es" lang="es">La idea principal</span></h2>
      <!-- renderLearnTab() strips the <section> wrapper, so the oversized
           "big idea" type scale hangs off this inner div, not off
           .section-visual (which never reaches the page). -->
      <div class="big-idea">
      <div class="key-idea-banner">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
          <div>
            <p class="lang-en"><strong>In one sentence:</strong> ${esc(completeSentence(keyEn))}</p>
            <p class="lang-es" lang="es"><strong>En una frase:</strong> ${esc(completeSentence(keyEs))}</p>
          </div>
          <button type="button" class="btn-read-aloud" ${act("speakHomeworkText", keyEn, keyEs)} title="Listen / Escuchar" aria-label="Listen to big idea" data-aria-en="Listen to big idea" data-aria-es="Escuchar la idea principal">🔊 <span class="lang-en">Listen</span><span class="lang-es" lang="es">Escuchar</span></button>
        </div>
      </div>
      <figure class="concept-visual-wrap">${visual.svg}${caption}<button type="button" class="concept-zoom-btn" ${act("openConceptZoom", EL)}><span class="lang-en">🔍 Tap to enlarge the picture</span><span class="lang-es" lang="es">🔍 Toca para ampliar la imagen</span></button></figure>
      <ol class="guided-steps">
        ${steps
          .map((s, index) => {
            const cue = stepCue(index, s);
            const en = splitExplanation(s.en);
            const es = splitExplanation(s.es);
            const moreDetail =
              en.detail || es.detail
                ? `<details class="step-detail"><summary><span class="lang-en">More detail</span><span class="lang-es" lang="es">Más detalle</span></summary>${en.detail ? `<p class="lang-en">${esc(en.detail)}</p>` : ""}${es.detail ? `<p class="lang-es" lang="es">${esc(es.detail)}</p>` : ""}</details>`
                : "";
            return `
          <li class="guided-step step-color-${s.stepNum}">
            <div class="guided-step-head">
              <span class="guided-step-num step-color-${s.stepNum}" aria-hidden="true">${s.stepNum}</span>
              <div><span class="step-cue-label"><span class="guided-step-icon" aria-hidden="true">${cue.icon}</span><span class="lang-en">${cue.en}</span><span class="lang-es" lang="es">${cue.es}</span></span><span class="step-badge">Step ${s.stepNum} / Paso ${s.stepNum}</span></div>
            </div>
            <p class="step-lead lang-en">${esc(en.lead)}</p>
            <p class="step-lead lang-es" lang="es">${esc(es.lead)}</p>
            ${moreDetail}
          </li>`;
          })
          .join("")}
      </ol>
      <details class="watch-for-drawer">
      <summary class="watch-for-summary"><span class="lang-en">Watch for these (3)</span><span class="lang-es" lang="es">Ten en cuenta (3)</span></summary>
      <ul class="watch-for-list">
        ${watchForCues(config)
          .map(
            (c) => `
          <li>
            <span class="watch-icon">${c.icon}</span>
            <div>
              <p class="lang-en">${esc(c.en)}</p>
              <p class="lang-es" lang="es">${esc(c.es)}</p>
            </div>
          </li>`,
          )
          .join("")}
      </ul>
      </details>
      </div>
    </section>`;
}

export function renderStuckSection(config) {
  const tips = stuckTips(config);

  return `
    <section class="guided-section card section-stuck" aria-label="If your student gets stuck" data-aria-en="If your student gets stuck" data-aria-es="Ayuda si te atoras">
      <h2 class="section-title">💬 <span class="lang-en">If your student gets stuck</span><span class="lang-es" lang="es">Si se atora</span></h2>
      <div class="stuck-grid">
        <div class="stuck-panel stuck-say">
          <h3 class="stuck-heading">✅ <span class="lang-en">What to say</span><span class="lang-es" lang="es">Qué decir</span></h3>
          <ul>
            ${tips.say
              .map(
                (t) =>
                  `<li><p class="lang-en">${esc(t.en)}</p><p class="lang-es" lang="es">${esc(t.es)}</p></li>`,
              )
              .join("")}
          </ul>
        </div>
        <div class="stuck-panel stuck-dont">
          <h3 class="stuck-heading">🚫 <span class="lang-en">What NOT to say</span><span class="lang-es" lang="es">Qué evitar</span></h3>
          <ul>
            ${tips.dontSay
              .map(
                (t) =>
                  `<li><p class="lang-en">${esc(t.en)}</p><p class="lang-es" lang="es">${esc(t.es)}</p></li>`,
              )
              .join("")}
          </ul>
        </div>
      </div>
      <p class="stuck-footer bilingual-block">
        <span class="lang-en">Struggle is part of learning. Short breaks and snacks are allowed!</span>
        <span class="lang-es" lang="es">La dificultad es parte del aprendizaje. ¡Descansos y meriendas están permitidos!</span>
      </p>
    </section>`;
}

export function resolveKitchenTableActivity(config) {
  if (!config) return DEFAULT_KITCHEN_TABLE;
  const activity = getFamilyActivities(config)[0];
  return {
    title: activity.titleEn,
    titleEs: activity.titleEs,
    materials: activity.materialsEn,
    materialsEs: activity.materialsEs,
    steps: activity.steps.map((step) => step.en),
    stepsEs: activity.steps.map((step) => step.es),
    why: activity.talkEn,
    whyEs: activity.talkEs,
  };
}

export function renderCelebration(config = null, _lessonId = "") {
  const tiers = selectTieredQuickCheckProblems(config?.practice || {}, config || {});
  const hasMorePractice =
    selectMorePracticeProblems(config?.practice || {}, config || {}, [
      ...tiers.warmup,
      ...tiers.challenge,
    ]).length > 0;

  return `
    <section class="guided-section card section-celebrate" aria-label="Celebration">
      <h2 class="section-title">🎉 <span class="lang-en">Finished for today</span><span class="lang-es" lang="es">Terminaste por hoy</span></h2>
      ${renderTeachBack(config)}
      ${renderConfidence("after")}
      ${renderFamilyNights()}
      <div class="done-summary" id="hw_done_summary" role="status" aria-live="polite"></div>
      <ol class="done-problem-list" id="hw_done_problems" aria-label="Problems / Problemas"></ol>
      <p class="celebrate-text lang-en">Name one strategy that helped, or one question to ask next time. You can stop here; no adult signature is needed.</p>
      <p class="celebrate-text lang-es" lang="es">Di una estrategia que te ayudó o una pregunta para la próxima vez. Puedes terminar aquí; no necesitas la firma de un adulto.</p>
      <p class="celebrate-sub bilingual-block">
        <span class="lang-en">Answers save automatically on this device. Tap <strong>Check This Problem</strong> anytime.</span>
        <span class="lang-es" lang="es">Las respuestas se guardan solas en este dispositivo. Toquen <strong>Revisar esta pregunta</strong> cuando quieran.</span>
      </p>

      ${renderShareWin()}
      <div class="homework-message-action">
        <a class="btn btn-primary" href="https://home.classdojo.com/" target="_blank" rel="noopener"><span class="lang-en">Open ClassDojo to message Mr. Neft</span><span class="lang-es" lang="es">Abrir ClassDojo para escribir al Sr. Neft</span></a>
        <p><span class="lang-en">Sign in to your family account, open Messages, and choose Mr. Neft. Include this lesson number and your question.</span><span class="lang-es" lang="es">Inicien sesión con su cuenta familiar, abran Mensajes y elijan al Sr. Neft. Incluyan el número de esta lección y su pregunta.</span></p>
      </div>
      <section class="homework-optional-extras" aria-labelledby="homework_extras_title">
      <h3 id="homework_extras_title"><span class="lang-en">Want to do more?</span><span class="lang-es" lang="es">¿Quieren hacer más?</span></h3>
      <p><span class="lang-en">These extras are not required. Photos, recordings and reflections stay on this device. To send anything to Mr. Neft, use ClassDojo.</span><span class="lang-es" lang="es">Estos extras no son obligatorios. Las fotos, grabaciones y reflexiones quedan en este dispositivo. Para enviar algo al Sr. Neft, usa ClassDojo.</span></p>
      <div class="homework-extra-actions">
        <button type="button" class="btn btn-secondary" ${act("hwOpenMorePractice", "check")}><span class="lang-en">➕ ${hasMorePractice ? "Try more practice problems" : "Review practice problems"}</span><span class="lang-es" lang="es">➕ ${hasMorePractice ? "Hacer más ejercicios" : "Repasar los ejercicios"}</span></button>
        <button type="button" class="btn btn-secondary" ${act("switchHomeworkTab", "photobooth")}><span class="lang-en">📸 Open the math work photobooth</span><span class="lang-es" lang="es">📸 Abrir la cabina de fotos</span></button>
        <a class="btn btn-secondary" href="#parent_reflection_input" ${act("hwOpenDetails", "homework_extras_more")}><span class="lang-en">✍️ Write a reflection below</span><span class="lang-es" lang="es">✍️ Escribir una reflexión abajo</span></a>
      </div>
      <!-- The three choices above stay visible (2026-10-02, "visible practice
           options"); the long form, badges and extra activity they lead to
           fold here, so the Done stop opens on how much is finished. -->
      <details class="homework-extras-more" id="homework_extras_more">
      <summary><span class="lang-en">Reflection, voice memo and badges</span><span class="lang-es" lang="es">Reflexión, nota de voz e insignias</span></summary>
      <div data-home-mission></div>
      <script type="module" src="/assets/class-investigation/home-mission.js"></script>
      <div class="parent-signoff-container card-ish">
        <h3 class="signoff-title">🎙️ <span class="lang-en">My Math Voice · Private Local Reflection</span><span class="lang-es" lang="es">Mi Voz Matemática · Reflexión Privada en este Dispositivo</span></h3>
        
        <!-- Active Form -->
        <div id="signoff_form_wrapper">
          <div class="signoff-field checkbox-field">
            <label class="checkbox-label">
              <input type="checkbox" id="parent_reviewed_checkbox" ${actOn("change", "toggleSignoffSubmitBtn", [])} />
              <span class="lang-en">I practiced or discussed an idea from this homework.</span>
              <span class="lang-es" lang="es">Practiqué o comenté una idea de esta tarea.</span>
            </label>
          </div>
          
          <div class="signoff-field text-field">
            <label for="student_name_input">
              <span class="lang-en">Student Name (optional):</span>
              <span class="lang-es" lang="es">Nombre del estudiante (opcional):</span>
            </label>
            <input type="text" id="student_name_input" placeholder="e.g. Alex" ${actOn("input", "updateCertStudentName", [VALUE])} />
          </div>

          <div class="signoff-field text-field">
            <label for="parent_name_input">
              <span class="lang-en">Practice Partner (optional):</span>
              <span class="lang-es" lang="es">Acompañante de práctica (opcional):</span>
            </label>
            <input type="text" id="parent_name_input" placeholder="e.g. Maria Lopez" ${actOn("input", "toggleSignoffSubmitBtn", [])} />
          </div>

          <div class="signoff-field textarea-field">
            <label for="parent_reflection_input">
              <span class="lang-en">One idea that makes sense to me now is... (optional):</span>
              <span class="lang-es" lang="es">Una idea que ahora entiendo mejor es... (opcional):</span>
            </label>
            <div class="hw-voice-chips" data-no-vocab data-no-listen role="group" aria-label="Quick-tap sentence starters">
              <button type="button" class="hw-voice-chip" data-target-input="parent_reflection_input" data-chip-en="The visual model helped me see that" data-chip-es="El modelo visual me ayudó a ver que" ${act("hwInsertVoiceChip", EL)}><span class="lang-en">+ “The visual model helped me see…”</span><span class="lang-es" lang="es">+ «El modelo visual me ayudó a ver…»</span></button>
              <button type="button" class="hw-voice-chip" data-target-input="parent_reflection_input" data-chip-en="I noticed a pattern when I" data-chip-es="Noté un patrón cuando" ${act("hwInsertVoiceChip", EL)}><span class="lang-en">+ “I noticed a pattern when I…”</span><span class="lang-es" lang="es">+ «Noté un patrón cuando…»</span></button>
              <button type="button" class="hw-voice-chip" data-target-input="parent_reflection_input" data-chip-en="I can check my answer by" data-chip-es="Puedo comprobar mi respuesta al" ${act("hwInsertVoiceChip", EL)}><span class="lang-en">+ “I can check my answer by…”</span><span class="lang-es" lang="es">+ «Puedo comprobar mi respuesta…»</span></button>
            </div>
            <textarea id="parent_reflection_input" rows="2" placeholder="One idea that makes sense to me now is... / Una idea que ahora entiendo mejor es..."></textarea>
          </div>

          <div class="signoff-field textarea-field">
            <label for="parent_note_input">
              <span class="lang-en">A question I want to ask Mr. Neft tomorrow in class is... (optional; saved here):</span>
              <span class="lang-es" lang="es">Una pregunta que quiero hacerle al Sr. Neft mañana en clase es... (opcional; guardado aquí):</span>
            </label>
            <div class="hw-voice-chips" data-no-vocab data-no-listen role="group" aria-label="Quick-tap question starters">
              <button type="button" class="hw-voice-chip" data-target-input="parent_note_input" data-chip-en="Can we go over another example of" data-chip-es="¿Podemos repasar otro ejemplo de" ${act("hwInsertVoiceChip", EL)}><span class="lang-en">+ “Can we go over an example of…”</span><span class="lang-es" lang="es">+ «¿Podemos repasar un ejemplo de…»</span></button>
              <button type="button" class="hw-voice-chip" data-target-input="parent_note_input" data-chip-en="How do I know which step comes first when" data-chip-es="¿Cómo sé qué paso va primero cuando" ${act("hwInsertVoiceChip", EL)}><span class="lang-en">+ “How do I know which step comes first…”</span><span class="lang-es" lang="es">+ «¿Cómo sé qué paso va primero…»</span></button>
            </div>
            <textarea id="parent_note_input" rows="2" placeholder="A question I want to ask Mr. Neft tomorrow in class is... / Una pregunta para el Sr. Neft mañana..."></textarea>
          </div>

          <div class="signoff-field feeling-pulse-field" style="margin:12px 0;">
            <label class="feeling-pulse-label" style="display:block;margin-bottom:6px;">
              <span class="lang-en">How did tonight's math feel?</span>
              <span class="lang-es" lang="es">¿Cómo se sintió la matemática de hoy?</span>
            </label>
            <div class="feeling-options" role="radiogroup" aria-label="Tonight feeling" style="display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" class="btn-feeling is-selected u-edge u-tint-sunken" data-feeling="smooth" ${act("selectFeeling", EL, "smooth")} style="padding:6px 12px;">
                <span class="feeling-icon">🟢</span> <span class="lang-en">Smooth sailing</span><span class="lang-es" lang="es">¡Muy bien!</span>
              </button>
              <button type="button" class="btn-feeling u-edge u-tint-sunken" data-feeling="discussion" ${act("selectFeeling", EL, "discussion")} style="padding:6px 12px;">
                <span class="feeling-icon">🟡</span> <span class="lang-en">Needed discussion</span><span class="lang-es" lang="es">Con algo de ayuda</span>
              </button>
              <button type="button" class="btn-feeling u-edge u-tint-sunken" data-feeling="challenge" ${act("selectFeeling", EL, "challenge")} style="padding:6px 12px;">
                <span class="feeling-icon">🔴</span> <span class="lang-en">Tough battle</span><span class="lang-es" lang="es">Nos costó trabajo</span>
              </button>
            </div>
            <input type="hidden" id="family_feeling_input" value="smooth" />
          </div>

          <div class="signoff-field photo-upload-field" style="margin:12px 0;">
            <label for="student_work_photo_input" style="display:block;margin-bottom:6px;">
              <span class="lang-en">📸 Snap photo of student notebook or work (optional):</span>
              <span class="lang-es" lang="es">📸 Foto del cuaderno o trabajo (opcional):</span>
            </label>
            <input type="file" id="student_work_photo_input" accept="image/*" capture="environment" ${actOn("change", "previewWorkPhoto", [EL])} />
            <div id="work_photo_preview_wrap" class="work-photo-preview-wrap" hidden style="margin-top:6px;">
              <img class="u-edge" id="work_photo_preview" alt="Student work preview" style="max-height:120px;display:block;" />
              <button type="button" class="btn btn-sm btn-link text-danger u-ink-look" ${act("clearWorkPhoto")} style="padding:4px 0;"><span class="lang-en">✕ Remove</span><span class="lang-es" lang="es">✕ Quitar</span></button>
            </div>
          </div>

          <div class="signoff-field voice-memo-field" style="margin:12px 0;">
            <label style="display:block;margin-bottom:6px;">
              <span class="lang-en">🎙️ 20-Second Math Strategy Voice Memo (optional):</span>
              <span class="lang-es" lang="es">🎙️ Nota de voz de 20 seg. explicando tu estrategia (opcional):</span>
            </label>
            <div class="voice-memo-controls" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
              <button type="button" id="btn_record_voice" class="btn btn-sm btn-outline-danger u-tint-unknown u-edge" ${act("toggleVoiceRecording")} style="padding:6px 14px;">
                <span id="record_voice_icon">🎙️</span> <span id="record_voice_label"><span class="lang-en">Record Strategy</span><span class="lang-es" lang="es">Grabar explicación</span></span>
              </button>
              <span class="u-ink-look" id="voice_timer" style="display:none;">0:00</span>
              <div id="voice_player_wrap" style="display:none;align-items:center;gap:8px;">
                <audio id="voice_audio_player" controls style="height:32px;max-width:220px;"></audio>
                <button type="button" class="btn btn-sm text-danger u-ink-look" ${act("deleteVoiceRecording")}><span class="lang-en">✕ Delete</span><span class="lang-es" lang="es">✕ Borrar</span></button>
              </div>
            </div>
          </div>

          <button type="button" id="submit_signoff_btn" class="signoff-submit-btn" ${act("saveParentSignoff")}>
            <span class="lang-en">Save reflection on this device</span><span class="lang-es" lang="es">Guardar reflexión en este dispositivo</span>
          </button>
        </div>

        <!-- Confirmed View -->
        <div id="signoff_confirmed_wrapper" hidden>
          <div class="certificate-badge">
            <div class="cert-check">🏆</div>
            <div class="cert-info">
              <h4 class="cert-header">
                <span class="lang-en">Reflection saved on this device</span>
                <span class="lang-es" lang="es">Reflexión guardada en este dispositivo</span>
              </h4>
              <p class="cert-detail"><strong id="display_parent_name"></strong></p>
              <p class="cert-date"><span class="lang-en">Saved on:</span><span class="lang-es" lang="es">Guardado el:</span> <span id="display_signoff_date"></span></p>
              <div id="display_family_streak_box" class="cert-streak-box">
                <p>🔥 <strong id="display_family_streak_text"><span class="lang-en">1-Night Streak</span><span class="lang-es" lang="es">Racha de 1 noche</span></strong></p>
              </div>
              <div id="display_family_feeling_box" class="cert-feeling-box" style="margin:6px 0;">
                <span id="display_family_feeling_badge" class="badge-feeling u-tint-sunken" style="display:inline-block;padding:3px 8px;"></span>
              </div>
              <div id="display_parent_note_box" class="cert-note-box" hidden>
                <p class="cert-note-title"><strong><span class="lang-en">Question draft (not sent):</span><span class="lang-es" lang="es">Borrador de pregunta (no enviado):</span></strong></p>
                <p id="display_parent_note" class="cert-note-content"></p>
              </div>
              <div id="display_parent_reflection_box" class="cert-note-box" hidden>
                <p class="cert-note-title"><strong><span class="lang-en">Family reflection:</span><span class="lang-es" lang="es">Reflexión familiar:</span></strong></p>
                <p id="display_parent_reflection" class="cert-note-content"></p>
              </div>
              <div id="display_family_photo_box" class="cert-photo-box" hidden style="margin-top:8px;">
                <p class="cert-note-title"><strong><span class="lang-en">Student Work Photo:</span><span class="lang-es" lang="es">Foto del trabajo:</span></strong></p>
                <img class="u-edge" id="display_family_photo" alt="Student notebook work" style="max-width:180px;" />
              </div>
              <div id="display_family_voice_box" class="cert-voice-box" hidden style="margin-top:8px;">
                <p class="cert-note-title"><strong><span class="lang-en">Student Voice Memo:</span><span class="lang-es" lang="es">Nota de voz del estudiante:</span></strong></p>
                <audio id="display_family_voice_player" controls style="height:32px;max-width:220px;margin-top:4px;"></audio>
              </div>
            </div>
          </div>
          <div class="cert-actions">
            <button type="button" class="btn btn-secondary print-cert-btn" ${act("hwPrint")}>
              <span class="lang-en">🖨️ Print Certificate</span><span class="lang-es" lang="es">🖨️ Imprimir certificado</span>
            </button>
            <button type="button" class="btn btn-outline-secondary print-cert-btn" ${act("printRefrigeratorSheet")}>
              <span class="lang-en">📄 1-Page Refrigerator Sheet</span><span class="lang-es" lang="es">📄 Hoja familiar (1 pág.)</span>
            </button>
            <button type="button" class="edit-signoff-btn" ${act("editParentSignoff")}>
              <span class="lang-en">Edit reflection</span><span class="lang-es" lang="es">Editar reflexión</span>
            </button>
          </div>
        </div>
      </div>

      <div class="high-five-banner">
        <button type="button" class="btn-high-five" ${act("triggerHighFive")}>
          <span class="high-five-emoji" aria-hidden="true">✋</span>
          <div class="high-five-labels">
            <strong><span class="lang-en">Give a High Five!</span><span class="lang-es" lang="es">¡Dame esos cinco!</span></strong>
            <small><span class="lang-en">Tap to celebrate tonight's math effort!</span><span class="lang-es" lang="es">¡Toca para celebrar el esfuerzo de hoy!</span></small>
          </div>
        </button>
      </div>

      <div class="achievement-shelf" id="achievement_shelf">
        <div class="achievement-badge badge-learn is-unlocked" id="badge_achieve_learn">
          <span class="achieve-icon" aria-hidden="true">📖</span>
          <span class="achieve-name"><span class="lang-en">Concept Explorer</span><span class="lang-es" lang="es">Explorador</span></span>
        </div>
        <div class="achievement-badge badge-vocab" id="badge_achieve_vocab">
          <span class="achieve-icon" aria-hidden="true">📚</span>
          <span class="achieve-name"><span class="lang-en">Vocab Champ</span><span class="lang-es" lang="es">Camp. Vocabulario</span></span>
        </div>
        <div class="achievement-badge badge-practice" id="badge_achieve_practice">
          <span class="achieve-icon" aria-hidden="true">⭐</span>
          <span class="achieve-name"><span class="lang-en">3-Star Hero</span><span class="lang-es" lang="es">Héroe 3 Estrellas</span></span>
        </div>
        <div class="achievement-badge badge-arcade" id="badge_achieve_arcade">
          <span class="achieve-icon" aria-hidden="true">🎮</span>
          <span class="achieve-name"><span class="lang-en">Game Master</span><span class="lang-es" lang="es">Maestro del Juego</span></span>
        </div>
        <div class="achievement-badge badge-streak is-unlocked" id="badge_achieve_streak">
          <span class="achieve-icon" aria-hidden="true">🔥</span>
          <span class="achieve-name"><span class="lang-en">Family Streak</span><span class="lang-es" lang="es">Racha Familiar</span></span>
        </div>
        <div class="achievement-badge badge-mission" id="badge_achieve_mission">
          <span class="achieve-icon" aria-hidden="true">🏡</span>
          <span class="achieve-name"><span class="lang-en">Home Explorer</span><span class="lang-es" lang="es">Explorador del Hogar</span></span>
        </div>
      </div>



      </details>
      </section>

      <!-- Print-Only Certificate Layout -->
      <div class="print-only-certificate" id="print_only_certificate">
        <div class="print-cert-header">
          <h2>EDU WONDERLAB MATH</h2>
          <h3>Family Math Practice Record</h3>
        </div>
        <div class="print-cert-body">
          <p>A personal record of practice for <strong><span id="print_lesson_title"></span></strong>. Saved on this device; not submitted to the teacher.</p>
          <div class="print-cert-signatures">
            <div class="print-sig-block">
              <p class="sig-line" id="print_parent_name"></p>
              <p class="sig-label">Practice partner (optional)</p>
            </div>
            <div class="print-sig-block">
              <p class="sig-line" id="print_signoff_date"></p>
              <p class="sig-label">Date</p>
            </div>
          </div>
          <div class="print-cert-note" id="print_parent_note_wrapper" style="display:none;">
            <p class="note-heading"><strong>Question draft (not sent):</strong></p>
            <p id="print_parent_note" class="note-body"></p>
          </div>
        </div>
      </div>
    </section>`;
}

// coreCount is the number of problems outside the collapsed "more practice"
// block — 6 on every lesson today, but passed in so the copy can't drift if the
// selection changes.
/* Minutes come from the Check stop's own entry in HOMEWORK_TABS, so the tab
   button, the hero total and this paragraph cannot disagree. They did: the hero
   promised 25 minutes across 5 stops, the rail billed Check at 10, and this
   paragraph asked for 15-20 — three numbers for one stop, on one screen. */
export function renderQuickCheckIntro(_coreCount = 6, hasMore = true) {
  /* A Part 2 with authored session practice ships exactly its core set and no
     bonus accordion, so "the extra practice at the bottom" pointed at nothing.
     Only promise it when the page renders it. The goal itself (how many to do
     tonight) lives in the goal card, written once from one number. */
  const extraEn = hasMore ? " The extra practice at the bottom is optional." : "";
  const extraEs = hasMore ? " La práctica extra al final es opcional." : "";
  return `
    <section class="guided-section card section-quick-intro" aria-label="Quick check introduction">
      <h2 class="section-title">✅ Quick check / Repaso rápido</h2>
      <p class="quick-check-time bilingual-block">
        <span class="lang-en">Start with <strong>Basics</strong>. Each problem has a <strong>step-by-step guide</strong>, a <strong>picture to draw on</strong> and a <strong>space for your work</strong>. Tap <strong>Check This Problem</strong> for instant help.<span class="quick-check-extra-copy">${extraEn}</span></span>
        <span class="lang-es" lang="es">Empiecen con las <strong>Básicas</strong>. Cada problema tiene una <strong>guía paso a paso</strong>, un <strong>dibujo para trabajar</strong> y un <strong>espacio para su trabajo</strong>. Toquen <strong>Revisar esta pregunta</strong> para recibir ayuda al instante.<span class="quick-check-extra-copy">${extraEs}</span></span>
      </p>
    </section>`;
}

export function getRealWorldSpotlight(topic) {
  const spotlights = {
    exponents: {
      titleEn: "Computer Memory & Data Storage",
      titleEs: "Memoria de computadoras y almacenamiento",
      factEn:
        "Computers use binary exponents (powers of 2) to store everything! 2¹⁰ = 1,024 bytes (1 KB), and 2³⁰ is over 1 billion bytes (1 GB). When you download a 4 GB game, exponents made it possible!",
      factEs:
        "¡Las computadoras usan potencias de 2 para guardar todo! 2¹⁰ = 1,024 bytes (1 KB) y 2³⁰ es más de mil millones de bytes (1 GB). ¡Cuando descargas un juego de 4 GB, los exponentes lo hacen posible!",
      icon: "💾",
    },
    ratios: {
      titleEn: "Pixar Animation & Video Game Scaling",
      titleEs: "Animación de Pixar y gráficos de videojuegos",
      factEn:
        "Animators at Pixar use equivalent ratios to scale characters across 4K movie screens, tablets, and phones without distorting their proportions. If Woody's hat is 1:4 of his height, it stays 1:4 on any screen size!",
      factEs:
        "Los animadores de Pixar usan razones equivalentes para cambiar de escala los personajes en pantallas de cine 4K, tabletas y teléfonos sin deformarlos. Si el sombrero de Woody mide 1:4 de su estatura, ¡se mantiene 1:4 en cualquier pantalla!",
      icon: "🎬",
    },
    equations: {
      titleEn: "NASA Spacecraft Trajectory & Fuel",
      titleEs: "Trayectoria y combustible de naves de la NASA",
      factEn:
        "Aerospace engineers use one-step and multi-step equations to balance spacecraft weight and fuel. Every kilogram of fuel added requires an exact balance of thrust to reach orbit!",
      factEs:
        "Los ingenieros aeroespaciales usan ecuaciones para equilibrar el peso y el combustible de la nave. ¡Cada kilogramo de combustible requiere un empuje exacto para alcanzar la órbita!",
      icon: "🚀",
    },
    inequalities: {
      titleEn: "Roller Coaster Height & Speed Limits",
      titleEs: "Límites de estatura y velocidad en montañas rusas",
      factEn:
        "Engineers design theme park rides with inequalities! 'Height h ≥ 48 inches' means exactly 48 inches or taller can ride. Speed governors use 'speed s ≤ 65 mph' to keep every turn thrilling yet safe.",
      factEs:
        "¡Los ingenieros diseñan las atracciones con desigualdades! 'Estatura h ≥ 48 pulgadas' significa 48 pulgadas o más. Los reguladores usan 'velocidad s ≤ 65 mph' para que cada curva sea emocionante y segura.",
      icon: "🎢",
    },
    expressions: {
      titleEn: "App Development & In-Game Economies",
      titleEs: "Desarrollo de apps y economías de videojuegos",
      factEn:
        "Game developers write algebraic expressions like '50x + 100' to calculate player score or coin rewards for completing x quests plus a 100-coin daily login bonus!",
      factEs:
        "Los desarrolladores escriben expresiones como '50x + 100' para calcular monedas o puntajes al completar x misiones más un bono diario de 100 monedas.",
      icon: "🕹️",
    },
    statistics: {
      titleEn: "Sports Analytics & Weather Forecasting",
      titleEs: "Analítica deportiva y pronóstico del clima",
      factEn:
        "Meteorologists calculate the median and mean temperature over 30 years to detect climate trends. Baseball scouts use batting averages and median pitch speeds to draft future champions!",
      factEs:
        "Los meteorólogos calculan la mediana y la media de temperatura de 30 años para detectar tendencias del clima. ¡Los entrenadores usan medias de bateo para descubrir futuros campeones!",
      icon: "⚾",
    },
    "coordinate-plane": {
      titleEn: "GPS Navigation & Drone Delivery",
      titleEs: "Navegación GPS y entrega con drones",
      factEn:
        "Every GPS in smartphones and delivery drones uses coordinate geometry (latitude and longitude) just like the (x, y) grid to pinpoint your doorstep within inches!",
      factEs:
        "¡Los teléfonos y drones de reparto usan geometría de coordenadas (latitud y longitud) igual que la cuadrícula (x, y) para llegar a tu puerta con exactitud!",
      icon: "📍",
    },
    "number-line": {
      titleEn: "Deep Sea Oceanography & Elevation",
      titleEs: "Oceanografía marina y elevación",
      factEn:
        "Submarines diving in the Mariana Trench use negative numbers on vertical number lines: −11,000 meters means 11,000 meters below sea level (0)! Mount Everest sits at +8,848 meters.",
      factEs:
        "Los submarinos que bajan a la Fosa de las Marianas usan números negativos: −11,000 metros significa 11,000 metros bajo el nivel del mar (0). ¡El Monte Everest está a +8,848 metros!",
      icon: "🌊",
    },
    fractions: {
      titleEn: "Master Chefs & Medicine Dosages",
      titleEs: "Chefs profesionales y dosis médicas",
      factEn:
        "Pastry chefs divide fractions every day when tripling or halving delicate macaroon recipes (e.g. 3/4 ÷ 2 = 3/8 cup). Pharmacists use fraction division to calculate liquid medicine doses safely!",
      factEs:
        "Los chefs pasteleros dividen fracciones a diario al triplicar o reducir recetas delicadas (ej. 3/4 ÷ 2 = 3/8 taza). ¡Los farmacéuticos las usan para calcular dosis médicas seguras!",
      icon: "🧁",
    },
    area: {
      titleEn: "Solar Panel Fields & Urban Architecture",
      titleEs: "Parques solares y arquitectura urbana",
      factEn:
        "Architects calculate roof area in square meters to determine how many solar panels can fit, maximizing clean energy for hospitals, schools, and homes!",
      factEs:
        "Los arquitectos calculan el área del techo en metros cuadrados para saber cuántos paneles solares caben, ¡maximizando la energía limpia para escuelas y hogares!",
      icon: "☀️",
    },
    volume: {
      titleEn: "Eco-Friendly Packaging & Container Ships",
      titleEs: "Empaque ecológico y barcos de carga",
      factEn:
        "Global shipping companies calculate cubic meters of volume to fit thousands of cargo containers onto mega-ships without wasting a single cubic inch of space or fuel!",
      factEs:
        "Las empresas de transporte calculan metros cúbicos de volumen para acomodar contenedores en barcos gigantes sin desperdiciar ni un centímetro de espacio o combustible.",
      icon: "📦",
    },
    "surface-area": {
      titleEn: "Heat Shield Engineering & Product Packaging",
      titleEs: "Escudos térmicos espaciales y empaques",
      factEn:
        "When space capsules re-enter Earth's atmosphere, engineers calculate the total surface area requiring ceramic heat tiles. Cereal companies design boxes with minimal surface area to save cardboard!",
      factEs:
        "Al regresar a la atmósfera, los ingenieros calculan el área de superficie que necesita baldosas térmicas. ¡Las empresas diseñan cajas con menor superficie para ahorrar cartón!",
      icon: "🛰️",
    },
    decimals: {
      titleEn: "Global Currency Exchange & Digital Banking",
      titleEs: "Tipo de cambio mundial y banca digital",
      factEn:
        "Banks process trillions of dollars every second using exact decimal arithmetic. Aligning tenths and hundredths ensures every penny and centavo is tracked accurately!",
      factEs:
        "Los bancos procesan billones de dólares cada segundo con aritmética decimal exacta. ¡Alinear décimos y centésimos asegura que cada centavo quede registrado!",
      icon: "💳",
    },
    factors: {
      titleEn: "Cybersecurity & RSA Password Encryption",
      titleEs: "Ciberseguridad y encriptación de contraseñas",
      factEn:
        "Every secure website you visit uses prime numbers! Cryptography algorithms multiply two gigantic prime numbers together. Breaking the encryption requires finding the prime factors, which would take supercomputers thousands of years!",
      factEs:
        "¡Cada sitio web seguro usa números primos! Los algoritmos multiplican dos números primos gigantescos. Romper la encriptación requeriría factorizar, ¡lo que tardaría miles de años!",
      icon: "🔐",
    },
  };

  return (
    spotlights[topic] || {
      titleEn: "STEM Careers & Everyday Life",
      titleEs: "Carreras STEM y vida cotidiana",
      factEn:
        "Mathematicians, scientists, and software designers use this exact mathematical model to solve real-world problems every single day!",
      factEs:
        "¡Matemáticos, científicos y desarrolladores usan este mismo modelo para resolver problemas en la vida real todos los días!",
      icon: "💡",
    }
  );
}

export function getTopicMisconception(topic, config) {
  const own = config?.familyNotes?.corner;
  if (own?.watchOut?.en && own?.question?.en)
    return {
      trapEn: own.watchOut.en,
      trapEs: own.watchOut.es,
      coachEn: own.question.en,
      coachEs: own.question.es,
    };
  const exact = exactFamilySupport(config || {});
  if (exact)
    return {
      trapEn: "Using a familiar rule before identifying what this question asks.",
      trapEs: "Usar una regla conocida sin identificar qué pide esta pregunta.",
      coachEn: familyGuidance(config).question.en,
      coachEs: familyGuidance(config).question.es,
    };
  if (topic === "ratios") {
    const strand = RATIO_STRAND_MISCONCEPTIONS[ratioFocus(config)];
    if (strand) return strand;
  }
  const misconceptions = {
    exponents: {
      trapEn: "Multiplying base × exponent (thinking 3⁴ = 12 instead of 3 × 3 × 3 × 3 = 81).",
      trapEs: "Multiplicar base × exponente (pensar que 3⁴ = 12 en vez de 3 × 3 × 3 × 3 = 81).",
      coachEn:
        "Ask: 'What does the little exponent number tell us to do? How many copies are multiplying?'",
      coachEs:
        "Pregunta: '¿Qué nos dice el número exponente pequeño? ¿Cuántas copias se multiplican?'",
    },
    ratios: {
      trapEn: "Adding the same amount to both parts instead of multiplying by the same factor.",
      trapEs: "Sumar la misma cantidad a ambas partes en lugar de multiplicar por el mismo factor.",
      coachEn: "Ask: 'In a recipe, if we double the juice, do we add 2 cups or multiply by 2?'",
      coachEs:
        "Pregunta: 'En una receta, si duplicamos el jugo, ¿sumamos 2 o multiplicamos por 2?'",
    },
    equations: {
      trapEn: "Doing an operation to only one side of the equal sign, unbalancing the equation.",
      trapEs: "Hacer una operación en un solo lado del signo igual, desequilibrando la ecuación.",
      coachEn:
        "Ask: 'If this were a real balance scale, what happens if we only remove blocks from one side?'",
      coachEs:
        "Pregunta: 'Si fuera una balanza real, ¿qué pasa si solo quitamos bloques de un lado?'",
    },
    inequalities: {
      trapEn: "Forgetting whether the boundary number itself is included (> vs ≥).",
      trapEs: "Olvidar si el número límite está incluido o no (> frente a ≥).",
      coachEn:
        "Ask: 'Is there a line underneath the symbol? Does it say greater than, or greater than or equal to?'",
      coachEs:
        "Pregunta: '¿Tiene una línea abajo el símbolo? ¿Dice mayor que, o mayor o igual que?'",
    },
    expressions: {
      trapEn: "Combining unlike terms (like adding 3x + 5 to get 8x).",
      trapEs: "Combinar términos no semejantes (como sumar 3x + 5 y obtener 8x).",
      coachEn:
        "Ask: 'Think of x as apples and numbers as oranges. Can 3 apples and 5 oranges become 8 apples?'",
      coachEs:
        "Pregunta: 'Imagina x como manzanas y números como naranjas. ¿3 manzanas y 5 naranjas pueden ser 8 manzanas?'",
    },
    statistics: {
      trapEn:
        "Finding the middle number without putting data in order from least to greatest first.",
      trapEs: "Buscar el número central sin ordenar primero los datos de menor a mayor.",
      coachEn:
        "Ask: 'Are our numbers in order from smallest to biggest before we find the median?'",
      coachEs:
        "Pregunta: '¿Están los números ordenados de menor a mayor antes de buscar la mediana?'",
    },
    "coordinate-plane": {
      trapEn: "Reversing the x and y coordinates (moving vertical first instead of horizontal).",
      trapEs: "Invertir las coordenadas x e y (moverse en vertical primero en vez de horizontal).",
      coachEn:
        "Ask: 'Remember: Run before you jump! Which letter comes first in the alphabet: x or y?'",
      coachEs: "Pregunta: '¡Corre antes de saltar! ¿Qué letra va primero en el abecedario: x o y?'",
    },
    "number-line": {
      trapEn: "Thinking −8 is greater than −2 because 8 is bigger than 2.",
      trapEs: "Pensar que −8 es mayor que −2 porque 8 es más grande que 2.",
      coachEn:
        "Ask: 'Which temperature is colder: −8° or −2°? Which number sits farther left on the number line?'",
      coachEs:
        "Pregunta: '¿Qué temperatura es más fría: −8° o −2°? ¿Cuál número está más a la izquierda?'",
    },
    fractions: {
      trapEn: "Dividing without taking the reciprocal of the second fraction (Keep-Change-Flip).",
      trapEs: "Dividir sin invertir la segunda fracción (Mantener-Cambiar-Invertir).",
      coachEn:
        "Ask: 'What is the three-word rule for fraction division? Keep the first, Change the sign, Flip the second!'",
      coachEs:
        "Pregunta: '¿Cuál es la regla de 3 pasos? ¡Mantener la primera, Cambiar a multiplicación, Invertir la segunda!'",
    },
    area: {
      trapEn:
        "Confusing area (square units covering the inside) with perimeter (distance around the outside).",
      trapEs:
        "Confundir el área (unidades cuadradas interiores) con el perímetro (distancia alrededor).",
      coachEn:
        "Ask: 'Are we putting a fence around the yard (perimeter) or laying carpet on the floor (area)?'",
      coachEs: "Pregunta: '¿Estamos poniendo una cerca (perímetro) o alfombrando el piso (área)?'",
    },
    volume: {
      trapEn: "Adding the three dimensions instead of multiplying length × width × height.",
      trapEs: "Sumar las tres dimensiones en vez de multiplicar largo × ancho × alto.",
      coachEn:
        "Ask: 'How many cubes are on the bottom layer? How many equal layers are stacked on top?'",
      coachEs: "Pregunta: '¿Cuántos cubos hay en la base? ¿Cuántas capas iguales hay apiladas?'",
    },
    "surface-area": {
      trapEn: "Missing one or more of the 6 rectangular faces when adding them together.",
      trapEs: "Olvidar una o más de las 6 caras rectangulares al sumarlas.",
      coachEn:
        "Ask: 'A cardboard box has 6 faces: top and bottom, front and back, left and right. Did we add all 6?'",
      coachEs:
        "Pregunta: 'Una caja tiene 6 caras: arriba y abajo, frente y atrás, lados. ¿Sumamos las 6?'",
    },
    decimals: {
      trapEn:
        "Lining up digits at the right edge like whole numbers instead of lining up decimal points.",
      trapEs:
        "Alinear los dígitos a la derecha como números enteros en vez de alinear los puntos decimales.",
      coachEn:
        "Ask: 'Are the decimal points standing in a straight vertical line so tenths match tenths?'",
      coachEs:
        "Pregunta: '¿Están los puntos decimales en una línea vertical recta para que décimos coincidan con décimos?'",
    },
    factors: {
      trapEn:
        "Thinking 1 is a prime number (1 only has one factor, but prime numbers need exactly two: 1 and itself).",
      trapEs:
        "Pensar que el 1 es un número primo (el 1 solo tiene un factor, pero los primos necesitan exactamente dos).",
      coachEn: "Ask: 'Does the number have exactly two different factors? What are they?'",
      coachEs: "Pregunta: '¿Tiene el número exactamente dos factores diferentes? ¿Cuáles son?'",
    },
  };

  return (
    misconceptions[topic] || {
      trapEn: "Rushing to compute an answer without drawing or visualizing the problem first.",
      trapEs: "Apurarse a calcular sin dibujar o visualizar el problema primero.",
      coachEn:
        "Ask: 'Can we draw a picture or diagram of what is happening before we write equations?'",
      coachEs:
        "Pregunta: '¿Podemos hacer un dibujo o diagrama de lo que pasa antes de escribir ecuaciones?'",
    }
  );
}

/**
 * Family Activity Corner — hands-on, no-device mini-activities a family can do
 * tonight with things already in the house. Three per topic, each with concrete
 * steps and one talk-about-it question. Collaborative by design: none of these
 * are races or timed (see the no-timed-games rule for this site). Rendered on
 * the Together tab by renderFamilyActivityCorner().
 */
const FAMILY_ACTIVITIES = {
  ratioComparison: [
    {
      icon: "☕",
      titleEn: "Compare two cocoa recipes",
      titleEs: "Compara dos recetas de chocolate",
      materialsEn: "Paper and pencil; no ingredients needed",
      materialsEs: "Papel y lápiz; no hacen falta ingredientes",
      minutes: 5,
      steps: [
        {
          en: "Draw two cards: Reyes uses 3 spoons of cocoa with 5 ounces of milk. Tran uses 4 spoons with 7 ounces.",
          es: "Dibuja dos tarjetas: Reyes usa 3 cucharadas de cacao con 5 onzas de leche. Tran usa 4 cucharadas con 7 onzas.",
        },
        {
          en: "Make the milk match at 35 ounces: multiply Reyes's amounts by 7 and Tran's by 5.",
          es: "Iguala la leche a 35 onzas: multiplica las cantidades de Reyes por 7 y las de Tran por 5.",
        },
        {
          en: "Compare 21 and 20 spoons for the same 35 ounces. Which recipe has more cocoa?",
          es: "Compara 21 y 20 cucharadas para las mismas 35 onzas. ¿Cuál receta tiene más cacao?",
        },
      ],
      talkEn: "Why can't we decide just by looking at 3 and 4 spoons?",
      talkEs: "¿Por qué no basta mirar solo las 3 y 4 cucharadas?",
    },
  ],
  ratios: [
    {
      icon: "🥣",
      titleEn: "Recipe Remix",
      titleEs: "Receta a escala",
      materialsEn: "Any recipe (box, jar, or online screenshot), paper",
      materialsEs: "Cualquier receta (caja, frasco o foto), papel",
      minutes: 10,
      steps: [
        {
          en: "Pick a simple recipe and write down two ingredient amounts, like 2 cups of flour and 3 cups of water.",
          es: "Escojan una receta sencilla y anoten dos cantidades, por ejemplo 2 tazas de harina y 3 tazas de agua.",
        },
        {
          en: "Double the recipe together. Multiply BOTH amounts by 2 and write the new ratio.",
          es: "Dupliquen la receta juntos. Multipliquen LAS DOS cantidades por 2 y escriban la nueva razón.",
        },
        {
          en: "Now cut the original recipe in half. What happens to each amount?",
          es: "Ahora reduzcan la receta original a la mitad. ¿Qué pasa con cada cantidad?",
        },
      ],
      talkEn:
        "If we only doubled the flour and not the water, would the recipe still taste right? Why not?",
      talkEs: "Si solo duplicamos la harina y no el agua, ¿la receta sabría igual? ¿Por qué no?",
    },
    {
      icon: "🛒",
      titleEn: "Better-Buy Detective",
      titleEs: "Detective del mejor precio",
      materialsEn: "Two package sizes of the same food (or a store flyer)",
      materialsEs: "Dos tamaños del mismo producto (o un folleto de la tienda)",
      minutes: 10,
      steps: [
        {
          en: "Find the same item in two sizes — for example, 12 oz for $3 and 20 oz for $4.",
          es: "Busquen el mismo producto en dos tamaños; por ejemplo, 12 oz por $3 y 20 oz por $4.",
        },
        {
          en: "Find the price for ONE ounce of each (price ÷ ounces). That is the unit rate.",
          es: "Calculen el precio de UNA onza de cada uno (precio ÷ onzas). Esa es la tasa unitaria.",
        },
        {
          en: "Decide together: which one is the better buy? Defend your answer with the numbers.",
          es: "Decidan juntos: ¿cuál conviene más? Defiendan su respuesta con los números.",
        },
      ],
      talkEn:
        "Is the bigger package ALWAYS the better deal? How could a store trick someone who doesn't check?",
      talkEs:
        "¿El paquete grande SIEMPRE conviene más? ¿Cómo podría la tienda engañar a quien no revisa?",
    },
    {
      icon: "🚶",
      titleEn: "Family Walking Rate",
      titleEs: "Nuestro ritmo al caminar",
      materialsEn: "A hallway or sidewalk, a phone clock",
      materialsEs: "Un pasillo o la acera, el reloj del teléfono",
      minutes: 10,
      steps: [
        {
          en: "Count how many steps your student takes in one minute of normal walking.",
          es: "Cuenten cuántos pasos da su estudiante en un minuto caminando normal.",
        },
        {
          en: "Write it as a rate: steps per 1 minute. Predict how many steps 5 minutes would take.",
          es: "Escríbanlo como tasa: pasos por 1 minuto. Predigan cuántos pasos serían en 5 minutos.",
        },
        {
          en: "Multiply to check the prediction. Try it with another family member's pace and compare rates.",
          es: "Multipliquen para comprobar la predicción. Prueben con el ritmo de otro familiar y comparen tasas.",
        },
      ],
      talkEn: "Whose rate was faster? How do the numbers prove it?",
      talkEs: "¿Qué ritmo fue más rápido? ¿Cómo lo demuestran los números?",
    },
  ],
  fractions: [
    {
      icon: "🫓",
      titleEn: "Fair-Share Kitchen",
      titleEs: "Cocina de porciones justas",
      materialsEn: "A tortilla, sandwich, or sheet of paper; a butter knife or scissors",
      materialsEs: "Una tortilla, un sándwich o una hoja de papel; un cuchillo sin filo o tijeras",
      minutes: 10,
      steps: [
        {
          en: "Cut (or fold) the tortilla into fourths. Ask: how many 1/4 pieces are in ONE whole?",
          es: "Corten (o doblen) la tortilla en cuartos. Pregunta: ¿cuántos pedazos de 1/4 hay en UNA entera?",
        },
        {
          en: "Now imagine 2 tortillas. How many 1/4 pieces in 2 wholes? Write it as 2 ÷ 1/4.",
          es: "Ahora imaginen 2 tortillas. ¿Cuántos pedazos de 1/4 hay en 2 enteras? Escríbanlo como 2 ÷ 1/4.",
        },
        {
          en: "Check by counting the pieces. Does the answer get bigger or smaller than 2? Talk about why.",
          es: "Comprueben contando los pedazos. ¿La respuesta es mayor o menor que 2? Hablen de por qué.",
        },
      ],
      talkEn: "Why does dividing by a fraction give MORE pieces, not fewer?",
      talkEs: "¿Por qué dividir entre una fracción da MÁS pedazos y no menos?",
    },
    {
      icon: "🍚",
      titleEn: "Measuring-Cup Challenge",
      titleEs: "Reto de la taza medidora",
      materialsEn: "Measuring cups, rice or dry beans, a bowl",
      materialsEs: "Tazas medidoras, arroz o frijoles secos, un tazón",
      minutes: 10,
      steps: [
        {
          en: "Predict: how many 1/3-cup scoops will it take to fill 2 cups?",
          es: "Predigan: ¿cuántas medidas de 1/3 de taza se necesitan para llenar 2 tazas?",
        },
        {
          en: "Scoop and count together. Write the matching division problem: 2 ÷ 1/3.",
          es: "Midan y cuenten juntos. Escriban la división que corresponde: 2 ÷ 1/3.",
        },
        {
          en: "Try it again with 1/2-cup scoops. Which scoop needed more trips? Why?",
          es: "Repitan con medidas de 1/2 taza. ¿Cuál medida necesitó más viajes? ¿Por qué?",
        },
      ],
      talkEn: "Before scooping, how could you KNOW the answer without counting?",
      talkEs: "Antes de medir, ¿cómo podrían SABER la respuesta sin contar?",
    },
    {
      icon: "🧵",
      titleEn: "String Split",
      titleEs: "Cortar la cuerda",
      materialsEn: "String, yarn, or paper strip; ruler; scissors",
      materialsEs: "Cuerda, estambre o tira de papel; regla; tijeras",
      minutes: 10,
      steps: [
        {
          en: "Cut a piece of string 3 feet (or 90 cm) long and measure it together.",
          es: "Corten una cuerda de 3 pies (o 90 cm) y mídanla juntos.",
        },
        {
          en: "Predict how many 1/2-foot (15 cm) pieces you can cut from it. Write the division.",
          es: "Predigan cuántos pedazos de 1/2 pie (15 cm) saldrán. Escriban la división.",
        },
        {
          en: "Cut and count. Compare the count with your division answer.",
          es: "Corten y cuenten. Comparen el conteo con el resultado de la división.",
        },
      ],
      talkEn: "What would happen to the number of pieces if each piece were half as long?",
      talkEs: "¿Qué pasaría con el número de pedazos si cada pedazo midiera la mitad?",
    },
  ],
  decimals: [
    {
      icon: "🧾",
      titleEn: "Receipt Roundup",
      titleEs: "La suma del recibo",
      materialsEn: "Any store receipt, paper, pencil",
      materialsEs: "Cualquier recibo de la tienda, papel, lápiz",
      minutes: 10,
      steps: [
        {
          en: "Each person picks 3 prices from the receipt and estimates the total in their head.",
          es: "Cada persona escoge 3 precios del recibo y estima el total mentalmente.",
        },
        {
          en: "Now add the exact amounts on paper, lining up the decimal points.",
          es: "Ahora sumen las cantidades exactas en papel, alineando los puntos decimales.",
        },
        {
          en: "Compare the estimate with the exact answer. How close were you?",
          es: "Comparen la estimación con la respuesta exacta. ¿Qué tan cerca quedaron?",
        },
      ],
      talkEn: "Why does lining up the decimal points matter when we add money?",
      talkEs: "¿Por qué importa alinear los puntos decimales al sumar dinero?",
    },
    {
      icon: "💵",
      titleEn: "Exact-Change Counter",
      titleEs: "El cambio exacto",
      materialsEn: "A few coins and bills (or paper play money)",
      materialsEs: "Algunas monedas y billetes (o dinero de papel)",
      minutes: 10,
      steps: [
        {
          en: "One person is the cashier. Price an item at something like $3.67.",
          es: "Una persona es el cajero. Pongan un precio como $3.67 a un objeto.",
        },
        {
          en: "Pay with a $5 bill. The student computes the change on paper by subtracting decimals.",
          es: "Paguen con un billete de $5. El estudiante calcula el cambio restando decimales en papel.",
        },
        {
          en: "Count the real coins to check. Switch roles and try a new price.",
          es: "Cuenten las monedas para comprobar. Cambien de papel y prueben otro precio.",
        },
      ],
      talkEn: "What is a quick way to check change without redoing the whole subtraction?",
      talkEs: "¿Cuál es una forma rápida de revisar el cambio sin repetir toda la resta?",
    },
    {
      icon: "⚖️",
      titleEn: "Kitchen-Scale Math",
      titleEs: "Matemáticas con la balanza",
      materialsEn: "Kitchen scale (or nutrition labels), two foods",
      materialsEs: "Balanza de cocina (o etiquetas de alimentos), dos alimentos",
      minutes: 10,
      steps: [
        {
          en: "Weigh two items (or read two label weights), like 1.4 lb and 0.75 lb.",
          es: "Pesen dos artículos (o lean dos etiquetas), por ejemplo 1.4 lb y 0.75 lb.",
        },
        {
          en: "Add the weights on paper. Then find how much heavier one is than the other.",
          es: "Sumen los pesos en papel. Luego calculen cuánto más pesa uno que el otro.",
        },
        {
          en: "Estimate first each time, then compute. Compare estimates with exact answers.",
          es: "Estimen primero cada vez y luego calculen. Comparen las estimaciones con las respuestas exactas.",
        },
      ],
      talkEn: "When is an estimate good enough, and when do we need the exact decimal?",
      talkEs: "¿Cuándo basta una estimación y cuándo necesitamos el decimal exacto?",
    },
  ],
  division: [
    {
      icon: "🍬",
      titleEn: "Snack Divider",
      titleEs: "Reparte la merienda",
      materialsEn: "A bag of small snacks (crackers, grapes, cereal)",
      materialsEs: "Una bolsa de meriendas pequeñas (galletas, uvas, cereal)",
      minutes: 10,
      steps: [
        {
          en: "Count the snacks in the bag — the bigger the number, the better.",
          es: "Cuenten las meriendas de la bolsa; entre más grande el número, mejor.",
        },
        {
          en: "Divide them equally among everyone at the table, one round at a time.",
          es: "Repártanlas en partes iguales entre todos, una ronda a la vez.",
        },
        {
          en: "Write the division problem it matches, including the remainder. Who gets the leftovers?",
          es: "Escriban la división que corresponde, con el residuo. ¿Quién se queda con lo que sobra?",
        },
      ],
      talkEn: "What does the remainder MEAN here? What are fair ways to handle it?",
      talkEs: "¿Qué SIGNIFICA el residuo aquí? ¿Cuáles son formas justas de repartirlo?",
    },
    {
      icon: "🥚",
      titleEn: "Egg-Carton Groups",
      titleEs: "Grupos con el cartón de huevos",
      materialsEn: "An empty egg carton, dry beans or coins",
      materialsEs: "Un cartón de huevos vacío, frijoles secos o monedas",
      minutes: 10,
      steps: [
        {
          en: "Grab a big handful of beans and count them — say you get 74.",
          es: "Tomen un puñado grande de frijoles y cuéntenlos; digamos que salen 74.",
        },
        {
          en: "Fill the carton cups evenly, one bean per cup, around and around.",
          es: "Llenen los espacios del cartón por igual, un frijol por espacio, ronda tras ronda.",
        },
        {
          en: "Write the result as division: 74 ÷ 12. How many in each cup, and how many left over?",
          es: "Escríbanlo como división: 74 ÷ 12. ¿Cuántos en cada espacio y cuántos sobran?",
        },
      ],
      talkEn: "How is dealing beans into cups the same as the division algorithm on paper?",
      talkEs: "¿En qué se parece repartir frijoles a la división escrita en papel?",
    },
    {
      icon: "🎉",
      titleEn: "Party Planner",
      titleEs: "Planificador de fiesta",
      materialsEn: "Paper and pencil",
      materialsEs: "Papel y lápiz",
      minutes: 10,
      steps: [
        {
          en: "Invent a party: 58 guests are coming, and each table seats 8.",
          es: "Inventen una fiesta: vienen 58 invitados y cada mesa tiene 8 asientos.",
        },
        {
          en: "Divide to find how many tables you need. What does the remainder tell you?",
          es: "Dividan para saber cuántas mesas se necesitan. ¿Qué les dice el residuo?",
        },
        {
          en: "Change the numbers (more guests, bigger tables) and solve again together.",
          es: "Cambien los números (más invitados, mesas más grandes) y resuelvan otra vez juntos.",
        },
      ],
      talkEn: "Why do we ROUND UP the number of tables even when the remainder is small?",
      talkEs: "¿Por qué REDONDEAMOS HACIA ARRIBA el número de mesas aunque el residuo sea pequeño?",
    },
  ],
  factors: [
    {
      icon: "🫘",
      titleEn: "Rectangle Factor Hunt",
      titleEs: "Cacería de factores con rectángulos",
      materialsEn: "24 small objects (beans, coins, pasta)",
      materialsEs: "24 objetos pequeños (frijoles, monedas, pasta)",
      minutes: 10,
      steps: [
        {
          en: "Arrange all 24 objects into a rectangle — for example, 4 rows of 6.",
          es: "Acomoden los 24 objetos en un rectángulo; por ejemplo, 4 filas de 6.",
        },
        {
          en: "Find EVERY rectangle you can make with all 24. Each one shows a factor pair!",
          es: "Encuentren TODOS los rectángulos posibles con los 24. ¡Cada uno muestra un par de factores!",
        },
        {
          en: "List the factor pairs you found. Try again with 18 or 30 objects.",
          es: "Anoten los pares de factores que encontraron. Repitan con 18 o 30 objetos.",
        },
      ],
      talkEn:
        "Which numbers make only ONE rectangle (a single row)? What are those numbers called?",
      talkEs:
        "¿Qué números solo forman UN rectángulo (una sola fila)? ¿Cómo se llaman esos números?",
    },
    {
      icon: "👏",
      titleEn: "Clap Together (LCM)",
      titleEs: "Aplaudir juntos (mcm)",
      materialsEn: "Just your hands",
      materialsEs: "Solo sus manos",
      minutes: 5,
      steps: [
        {
          en: "Count out loud together from 1. One person claps on every multiple of 4.",
          es: "Cuenten en voz alta desde 1. Una persona aplaude en cada múltiplo de 4.",
        },
        {
          en: "The other person claps on every multiple of 6.",
          es: "La otra persona aplaude en cada múltiplo de 6.",
        },
        {
          en: "Notice the first number where you BOTH clap. That is the least common multiple!",
          es: "Fíjense en el primer número donde aplauden LOS DOS. ¡Ese es el mínimo común múltiplo!",
        },
      ],
      talkEn: "When will you clap together again after the first time? Do you see a pattern?",
      talkEs: "¿Cuándo volverán a aplaudir juntos después de la primera vez? ¿Ven un patrón?",
    },
    {
      icon: "🚪",
      titleEn: "Prime Detective",
      titleEs: "Detective de primos",
      materialsEn: "Numbers around you: doors, license plates, cabinets",
      materialsEs: "Números a su alrededor: puertas, placas, alacenas",
      minutes: 10,
      steps: [
        {
          en: "Find a number around the house or street — an address, a page number, a jersey.",
          es: "Busquen un número en la casa o la calle: una dirección, una página, una camiseta.",
        },
        {
          en: "Decide together: prime or composite? Prove it by hunting for factors.",
          es: "Decidan juntos: ¿primo o compuesto? Demuéstrenlo buscando factores.",
        },
        {
          en: "Take turns finding numbers for each other. Explain every answer out loud.",
          es: "Túrnense para buscar números. Expliquen cada respuesta en voz alta.",
        },
      ],
      talkEn: "Why does checking factors up to half the number (or its square root) find them all?",
      talkEs: "¿Por qué basta revisar factores hasta la mitad del número para encontrarlos todos?",
    },
  ],
  exponents: [
    {
      icon: "📄",
      titleEn: "Paper-Folding Powers",
      titleEs: "Potencias al doblar papel",
      materialsEn: "One sheet of paper",
      materialsEs: "Una hoja de papel",
      minutes: 5,
      steps: [
        {
          en: "Fold the paper in half and count the layers. Fold again. And again.",
          es: "Doblen la hoja a la mitad y cuenten las capas. Doblen otra vez. Y otra.",
        },
        {
          en: "Record the layers after each fold: 2, 4, 8, 16… Write each as a power of 2.",
          es: "Anoten las capas tras cada doblez: 2, 4, 8, 16… Escriban cada una como potencia de 2.",
        },
        {
          en: "Predict the layers for 7 folds (2⁷) before you run out of paper. Compute it!",
          es: "Predigan las capas con 7 dobleces (2⁷) antes de que el papel no dé más. ¡Calcúlenlo!",
        },
      ],
      talkEn: "Why does the paper get impossible to fold so fast? What does that say about powers?",
      talkEs:
        "¿Por qué tan pronto ya no se puede doblar el papel? ¿Qué nos dice eso de las potencias?",
    },
    {
      icon: "🍚",
      titleEn: "The Doubling Rice Story",
      titleEs: "El arroz que se duplica",
      materialsEn: "A few grains of rice (or draw dots), paper",
      materialsEs: "Unos granos de arroz (o dibujen puntos), papel",
      minutes: 10,
      steps: [
        {
          en: "Start a story: day 1 you get 1 grain of rice, and it doubles every day.",
          es: "Empiecen un cuento: el día 1 reciben 1 grano de arroz, y cada día se duplica.",
        },
        {
          en: "Make a table for days 1-7. Write each amount as a power of 2.",
          es: "Hagan una tabla para los días 1 a 7. Escriban cada cantidad como potencia de 2.",
        },
        {
          en: "Predict day 10 and day 20 WITHOUT listing every day. How big do the numbers get?",
          es: "Predigan el día 10 y el día 20 SIN escribir todos los días. ¿Qué tan grandes se ponen los números?",
        },
      ],
      talkEn:
        "Would you rather have $100 today or 1¢ doubled every day for 3 weeks? Prove your choice!",
      talkEs: "¿Prefieren $100 hoy o 1¢ duplicado cada día por 3 semanas? ¡Demuestren su elección!",
    },
    {
      icon: "📣",
      titleEn: "How a Rumor Grows",
      titleEs: "Cómo crece un rumor",
      materialsEn: "Paper and pencil",
      materialsEs: "Papel y lápiz",
      minutes: 10,
      steps: [
        {
          en: "Imagine one person tells a rumor to 3 friends. Each friend tells 3 more.",
          es: "Imaginen que una persona cuenta un rumor a 3 amigos. Cada amigo se lo cuenta a 3 más.",
        },
        {
          en: "Draw the tree for 3 rounds. Count the people told in each round: 3, 9, 27.",
          es: "Dibujen el árbol de 3 rondas. Cuenten las personas de cada ronda: 3, 9, 27.",
        },
        {
          en: "Write each round as a power of 3. Predict round 5 without drawing it.",
          es: "Escriban cada ronda como potencia de 3. Predigan la ronda 5 sin dibujarla.",
        },
      ],
      talkEn: "3⁴ means 3 × 3 × 3 × 3 — not 3 × 4. How does the rumor tree SHOW that?",
      talkEs: "3⁴ significa 3 × 3 × 3 × 3, no 3 × 4. ¿Cómo lo DEMUESTRA el árbol del rumor?",
    },
  ],
  expressions: [
    {
      icon: "🍔",
      titleEn: "Menu Math Machine",
      titleEs: "La máquina del menú",
      materialsEn: "A takeout menu or grocery flyer, paper",
      materialsEs: "Un menú de comida o folleto del súper, papel",
      minutes: 10,
      steps: [
        {
          en: "Plan a pretend family order: for example, 3 tacos and 2 drinks.",
          es: "Planeen un pedido imaginario: por ejemplo, 3 tacos y 2 bebidas.",
        },
        {
          en: "Write it as an expression with variables: 3t + 2d, where t and d are the prices.",
          es: "Escríbanlo como expresión con variables: 3t + 2d, donde t y d son los precios.",
        },
        {
          en: "Look up the real prices and evaluate the expression. Change the order and re-evaluate.",
          es: "Busquen los precios reales y evalúen la expresión. Cambien el pedido y evalúen de nuevo.",
        },
      ],
      talkEn:
        "What do the variables stand for? Why is writing 3t faster than writing the price 3 times?",
      talkEs:
        "¿Qué representan las variables? ¿Por qué escribir 3t es más rápido que escribir el precio 3 veces?",
    },
    {
      icon: "🎂",
      titleEn: "Age Expressions",
      titleEs: "Expresiones de edades",
      materialsEn: "Paper and pencil",
      materialsEs: "Papel y lápiz",
      minutes: 5,
      steps: [
        {
          en: "Let x stand for the student's age. Write every family member's age using x.",
          es: "Que x sea la edad del estudiante. Escriban la edad de cada familiar usando x.",
        },
        {
          en: "For example, a parent might be x + 27, a little cousin x − 5.",
          es: "Por ejemplo, un padre podría ser x + 27, y un primito x − 5.",
        },
        {
          en: "Substitute the student's real age for x and check every expression.",
          es: "Sustituyan la edad real del estudiante por x y comprueben cada expresión.",
        },
      ],
      talkEn: "What will each expression equal in 10 years? Does the '+ 27' part ever change?",
      talkEs: "¿Cuánto valdrá cada expresión en 10 años? ¿La parte '+ 27' cambia alguna vez?",
    },
    {
      icon: "🧺",
      titleEn: "Laundry Variables",
      titleEs: "Variables en la ropa",
      materialsEn: "A laundry basket (or a drawer of clothes)",
      materialsEs: "Un cesto de ropa (o un cajón)",
      minutes: 10,
      steps: [
        {
          en: "Say each shirt has 4 buttons. Write an expression for the buttons on s shirts: 4s.",
          es: "Digamos que cada camisa tiene 4 botones. Escriban una expresión para los botones de s camisas: 4s.",
        },
        {
          en: "Count the real shirts and evaluate your expression.",
          es: "Cuenten las camisas reales y evalúen su expresión.",
        },
        {
          en: "Invent a two-part expression, like 4s + 2p for shirts and pants pockets, and evaluate it.",
          es: "Inventen una expresión de dos partes, como 4s + 2p para camisas y bolsillos de pantalones, y evalúenla.",
        },
      ],
      talkEn:
        "In 4s + 2p, which numbers are coefficients? What happens if s changes but p doesn't?",
      talkEs: "En 4s + 2p, ¿cuáles números son coeficientes? ¿Qué pasa si s cambia pero p no?",
    },
  ],
  equations: [
    {
      icon: "🧥",
      titleEn: "Hanger Balance",
      titleEs: "La percha en equilibrio",
      materialsEn: "A clothes hanger, 2 plastic bags, small identical objects",
      materialsEs: "Una percha, 2 bolsas plásticas, objetos pequeños iguales",
      minutes: 15,
      steps: [
        {
          en: "Hang a bag on each end of the hanger and hold it up like a balance scale.",
          es: "Cuelguen una bolsa en cada extremo de la percha y sosténganla como balanza.",
        },
        {
          en: "Put 7 coins on one side, and 3 coins plus a 'mystery clip' of coins on the other until it balances.",
          es: "Pongan 7 monedas de un lado, y del otro 3 monedas más un 'clip misterioso' de monedas hasta equilibrar.",
        },
        {
          en: "Write the equation (3 + m = 7) and solve. Check by opening the mystery clip!",
          es: "Escriban la ecuación (3 + m = 7) y resuélvanla. ¡Comprueben abriendo el clip misterioso!",
        },
      ],
      talkEn: "If we add 2 coins to one side only, what happens? What must we do to keep it fair?",
      talkEs:
        "Si agregamos 2 monedas a un solo lado, ¿qué pasa? ¿Qué debemos hacer para que siga justo?",
    },
    {
      icon: "🎒",
      titleEn: "Mystery Bag",
      titleEs: "La bolsa misteriosa",
      materialsEn: "A small bag, dry beans or coins",
      materialsEs: "Una bolsa pequeña, frijoles secos o monedas",
      minutes: 10,
      steps: [
        {
          en: "Secretly put some beans in the bag. Place the bag plus 4 loose beans on the table.",
          es: "Pongan en secreto algunos frijoles en la bolsa. Coloquen la bolsa más 4 frijoles sueltos en la mesa.",
        },
        {
          en: "Give the clue: 'The bag plus these 4 makes 10 in all.' The student writes b + 4 = 10.",
          es: "Den la pista: 'La bolsa más estos 4 hacen 10 en total.' El estudiante escribe b + 4 = 10.",
        },
        {
          en: "Solve, then open the bag to check. Switch roles and make a harder clue.",
          es: "Resuelvan y abran la bolsa para comprobar. Cambien de papel e inventen una pista más difícil.",
        },
      ],
      talkEn: "How did you 'undo' the + 4? What operation undoes adding?",
      talkEs: "¿Cómo 'deshicieron' el + 4? ¿Qué operación deshace la suma?",
    },
    {
      icon: "🏦",
      titleEn: "Savings-Goal Solver",
      titleEs: "Meta de ahorro",
      materialsEn: "Paper and pencil",
      materialsEs: "Papel y lápiz",
      minutes: 10,
      steps: [
        {
          en: "Pick something the student wants that costs real money — say $24.",
          es: "Escojan algo que el estudiante quiera y que cueste dinero real; digamos $24.",
        },
        {
          en: "Count what they have saved — say $9. Write the equation: 9 + n = 24.",
          es: "Cuenten lo que ya tienen ahorrado; digamos $9. Escriban la ecuación: 9 + n = 24.",
        },
        {
          en: "Solve for n together, then plan how to earn it: if a chore pays $3, how many chores?",
          es: "Resuelvan n juntos y planeen cómo ganarlo: si un quehacer paga $3, ¿cuántos quehaceres?",
        },
      ],
      talkEn:
        "The chore question is a NEW equation — 3c = 15. How are the two equations different?",
      talkEs:
        "La pregunta de los quehaceres es una ecuación NUEVA: 3c = 15. ¿En qué se diferencian las dos?",
    },
  ],
  inequalities: [
    {
      icon: "🎢",
      titleEn: "Limit Hunt",
      titleEs: "Cacería de límites",
      materialsEn: "Labels and signs around the house",
      materialsEs: "Etiquetas y letreros de la casa",
      minutes: 10,
      steps: [
        {
          en: "Hunt for real limits: an age rating on a game, a weight limit on a chair, a 'max 10 items' sign.",
          es: "Busquen límites reales: la edad de un videojuego, el peso máximo de una silla, un letrero de 'máximo 10'.",
        },
        {
          en: "Write each one as an inequality, like a ≥ 13 or w ≤ 250.",
          es: "Escriban cada uno como desigualdad, por ejemplo a ≥ 13 o w ≤ 250.",
        },
        {
          en: "For each, name 2 numbers that are allowed and 2 that are not.",
          es: "Para cada una, digan 2 números permitidos y 2 que no.",
        },
      ],
      talkEn: "Is the boundary number itself allowed? How does the symbol tell you?",
      talkEs: "¿El número del límite está permitido? ¿Cómo lo indica el símbolo?",
    },
    {
      icon: "🌡️",
      titleEn: "Weather Watch",
      titleEs: "Vigilando el clima",
      materialsEn: "A weather app or window",
      materialsEs: "Una app del clima o la ventana",
      minutes: 5,
      steps: [
        {
          en: "Look up today's high temperature and this week's forecast.",
          es: "Busquen la temperatura máxima de hoy y el pronóstico de la semana.",
        },
        {
          en: "Write true inequalities about it: 'Every day this week, t > 60.'",
          es: "Escriban desigualdades verdaderas: 'Todos los días de esta semana, t > 60.'",
        },
        {
          en: "Each person writes one true and one FALSE inequality; the others catch the false one.",
          es: "Cada persona escribe una desigualdad verdadera y una FALSA; los demás descubren la falsa.",
        },
      ],
      talkEn: "How many numbers make t > 60 true? Can you list them all?",
      talkEs: "¿Cuántos números hacen verdadera t > 60? ¿Pueden escribirlos todos?",
    },
    {
      icon: "🛍️",
      titleEn: "Budget Boundaries",
      titleEs: "Presupuesto con límites",
      materialsEn: "A store flyer or pantry prices, paper",
      materialsEs: "Un folleto de la tienda o precios de la despensa, papel",
      minutes: 10,
      steps: [
        {
          en: "Set a pretend budget: you may spend AT MOST $15 on snacks (c ≤ 15).",
          es: "Fijen un presupuesto imaginario: pueden gastar MÁXIMO $15 en meriendas (c ≤ 15).",
        },
        {
          en: "Build 3 different snack combos and check each against the inequality.",
          es: "Armen 3 combinaciones distintas de meriendas y compárenlas con la desigualdad.",
        },
        {
          en: "Find a combo that costs EXACTLY $15. Is it allowed? Why?",
          es: "Encuentren una combinación que cueste EXACTAMENTE $15. ¿Está permitida? ¿Por qué?",
        },
      ],
      talkEn: "How would the game change if the rule were c < 15 instead of c ≤ 15?",
      talkEs: "¿Cómo cambiaría el juego si la regla fuera c < 15 en vez de c ≤ 15?",
    },
  ],
  properties: [
    {
      icon: "🍱",
      titleEn: "Snack-Pack Split",
      titleEs: "Reparto de paquetes",
      materialsEn: "Crackers and cheese (or any two small snacks)",
      materialsEs: "Galletas y queso (o dos meriendas pequeñas)",
      minutes: 10,
      steps: [
        {
          en: "Make 4 snack packs, each with 3 crackers and 2 cheese cubes.",
          es: "Armen 4 paquetes, cada uno con 3 galletas y 2 cubos de queso.",
        },
        {
          en: "Count the total two ways: 4 × (3 + 2), or 4 × 3 plus 4 × 2.",
          es: "Cuenten el total de dos maneras: 4 × (3 + 2), o 4 × 3 más 4 × 2.",
        },
        {
          en: "Show that both ways give 20. That is the distributive property on a plate!",
          es: "Demuestren que las dos formas dan 20. ¡Esa es la propiedad distributiva en un plato!",
        },
      ],
      talkEn: "Which way of counting felt easier? When might the other way be easier?",
      talkEs: "¿Qué forma de contar fue más fácil? ¿Cuándo convendría la otra?",
    },
    {
      icon: "🁡",
      titleEn: "Array Flip",
      titleEs: "Voltea el arreglo",
      materialsEn: "About 24 coins, beans, or cereal pieces",
      materialsEs: "Unas 24 monedas, frijoles o piezas de cereal",
      minutes: 5,
      steps: [
        {
          en: "Build a rectangle of 6 rows with 4 objects each. Count: 6 × 4.",
          es: "Armen un rectángulo de 6 filas con 4 objetos cada una. Cuenten: 6 × 4.",
        },
        {
          en: "Turn the whole rectangle sideways. Now it is 4 rows of 6: 4 × 6.",
          es: "Giren todo el rectángulo. Ahora son 4 filas de 6: 4 × 6.",
        },
        {
          en: "Did the total change? Name the property that says it can't.",
          es: "¿Cambió el total? Digan cómo se llama la propiedad que dice que no puede cambiar.",
        },
      ],
      talkEn: "Does turning work for division too? Is 24 ÷ 6 the same as 6 ÷ 24?",
      talkEs: "¿Girar funciona también con la división? ¿24 ÷ 6 es igual que 6 ÷ 24?",
    },
    {
      icon: "🛒",
      titleEn: "Mental-Math Shortcut",
      titleEs: "Atajo de cálculo mental",
      materialsEn: "Paper (a calculator to check)",
      materialsEs: "Papel (una calculadora para comprobar)",
      minutes: 10,
      steps: [
        {
          en: "Pose a store problem: 3 shirts at $4.98 each. No calculator yet!",
          es: "Planteen un problema: 3 camisas a $4.98 cada una. ¡Todavía sin calculadora!",
        },
        {
          en: "Use the shortcut: 3 × 5.00 = 15.00, then take away 3 × 0.02.",
          es: "Usen el atajo: 3 × 5.00 = 15.00, y luego quiten 3 × 0.02.",
        },
        {
          en: "Check on the calculator. Invent another 'almost round' price and do it again.",
          es: "Comprueben con la calculadora. Inventen otro precio 'casi redondo' y repitan.",
        },
      ],
      talkEn: "How did we use 3 × (5 − 0.02)? Why is that allowed?",
      talkEs: "¿Cómo usamos 3 × (5 − 0.02)? ¿Por qué se vale hacerlo?",
    },
  ],
  area: [
    {
      icon: "📐",
      titleEn: "Room Footprint",
      titleEs: "El plano de tu espacio",
      materialsEn: "A ruler or tape measure, paper",
      materialsEs: "Una regla o cinta métrica, papel",
      minutes: 15,
      steps: [
        {
          en: "Measure the length and width of a table, rug, or bed.",
          es: "Midan el largo y el ancho de una mesa, un tapete o una cama.",
        },
        {
          en: "Compute the area together. Draw and label a quick sketch.",
          es: "Calculen el área juntos. Hagan un dibujo rápido con etiquetas.",
        },
        {
          en: "Measure a second surface and compare: which has more area, and by how much?",
          es: "Midan otra superficie y comparen: ¿cuál tiene más área y por cuánto?",
        },
      ],
      talkEn: "Why is area measured in SQUARE units instead of plain inches?",
      talkEs: "¿Por qué el área se mide en unidades CUADRADAS y no en pulgadas simples?",
    },
    {
      icon: "✂️",
      titleEn: "Parallelogram Slide",
      titleEs: "El paralelogramo que se transforma",
      materialsEn: "Paper, scissors, ruler",
      materialsEs: "Papel, tijeras, regla",
      minutes: 10,
      steps: [
        {
          en: "Draw a slanted parallelogram on paper and cut it out.",
          es: "Dibujen un paralelogramo inclinado en papel y recórtenlo.",
        },
        {
          en: "Cut a straight triangle off one end and slide it to the other end.",
          es: "Corten un triángulo recto de un extremo y deslícenlo al otro extremo.",
        },
        {
          en: "Look: it is now a rectangle! Same paper, same area. So area = base × height.",
          es: "Miren: ¡ahora es un rectángulo! Mismo papel, misma área. Por eso área = base × altura.",
        },
      ],
      talkEn: "Why do we use the straight-up height instead of the slanted side?",
      talkEs: "¿Por qué usamos la altura vertical y no el lado inclinado?",
    },
    {
      icon: "🍫",
      titleEn: "Cracker Triangles",
      titleEs: "Triángulos de galleta",
      materialsEn: "Square or rectangular crackers (or sticky notes)",
      materialsEs: "Galletas cuadradas o rectangulares (o notas adhesivas)",
      minutes: 5,
      steps: [
        {
          en: "Take a rectangular cracker. Its area is length × width.",
          es: "Tomen una galleta rectangular. Su área es largo × ancho.",
        },
        {
          en: "Break (or cut) it corner to corner into two triangles.",
          es: "Pártanla (o córtenla) de esquina a esquina en dos triángulos.",
        },
        {
          en: "Each triangle is HALF the rectangle. So triangle area = ½ × base × height. Eat the evidence!",
          es: "Cada triángulo es la MITAD del rectángulo. Por eso el área del triángulo = ½ × base × altura. ¡Cómanse la evidencia!",
        },
      ],
      talkEn: "If a triangle's area is 6 square units, what could its rectangle have been?",
      talkEs: "Si el área de un triángulo es 6 unidades cuadradas, ¿cómo pudo ser su rectángulo?",
    },
  ],
  volume: [
    {
      icon: "🥣",
      titleEn: "Box Hunt",
      titleEs: "Cacería de cajas",
      materialsEn: "Two food boxes (cereal, pasta), ruler",
      materialsEs: "Dos cajas de comida (cereal, pasta), regla",
      minutes: 15,
      steps: [
        {
          en: "Measure the length, width, and height of each box, to the nearest half inch.",
          es: "Midan el largo, el ancho y la altura de cada caja, a la media pulgada más cercana.",
        },
        {
          en: "Compute each volume: V = l × w × h. Fractions are welcome!",
          es: "Calculen cada volumen: V = l × a × h. ¡Las fracciones son bienvenidas!",
        },
        {
          en: "Predict first which box holds more, then let the numbers decide. Were your eyes right?",
          es: "Primero predigan cuál caja cabe más, y luego dejen que los números decidan. ¿Acertaron sus ojos?",
        },
      ],
      talkEn: "Could a taller box have LESS volume than a shorter one? How?",
      talkEs: "¿Podría una caja más alta tener MENOS volumen que una más baja? ¿Cómo?",
    },
    {
      icon: "🧊",
      titleEn: "Ice-Cube Estimate",
      titleEs: "Estimar con cubitos",
      materialsEn: "Ice cubes (or sugar cubes, dice), a small container",
      materialsEs: "Cubitos de hielo (o de azúcar, o dados), un recipiente pequeño",
      minutes: 10,
      steps: [
        {
          en: "Predict: how many cubes will fill the container in neat layers?",
          es: "Predigan: ¿cuántos cubitos llenarán el recipiente en capas ordenadas?",
        },
        {
          en: "Fill the bottom layer and count it. Count how many layers fit.",
          es: "Llenen la primera capa y cuéntenla. Cuenten cuántas capas caben.",
        },
        {
          en: "Multiply layer × layers and compare with your prediction. That is what l × w × h counts!",
          es: "Multipliquen capa × capas y comparen con su predicción. ¡Eso es lo que cuenta l × a × h!",
        },
      ],
      talkEn: "Why does multiplying the bottom layer by the height give the whole volume?",
      talkEs: "¿Por qué multiplicar la primera capa por la altura da todo el volumen?",
    },
    {
      icon: "🎁",
      titleEn: "Build the Half-Inch Box",
      titleEs: "La caja de media pulgada",
      materialsEn: "Paper, ruler, tape, scissors",
      materialsEs: "Papel, regla, cinta adhesiva, tijeras",
      minutes: 15,
      steps: [
        {
          en: "Together, draw a box pattern 3 in long, 2 in wide, 1½ in tall.",
          es: "Juntos, dibujen el patrón de una caja de 3 pulg de largo, 2 de ancho y 1½ de alto.",
        },
        {
          en: "Cut, fold, and tape it into a real box.",
          es: "Corten, doblen y péguenla hasta formar una caja de verdad.",
        },
        {
          en: "Compute its volume with the fraction: 3 × 2 × 1½. What tiny thing fits inside?",
          es: "Calculen su volumen con la fracción: 3 × 2 × 1½. ¿Qué cosita cabe adentro?",
        },
      ],
      talkEn:
        "How is multiplying by 1½ different from multiplying by 2? What did it do to the volume?",
      talkEs: "¿En qué se diferencia multiplicar por 1½ y por 2? ¿Qué le hizo al volumen?",
    },
  ],
  "surface-area": [
    {
      icon: "📦",
      titleEn: "Unfold a Box",
      titleEs: "Desarma una caja",
      materialsEn: "An empty cereal or snack box, scissors",
      materialsEs: "Una caja vacía de cereal o galletas, tijeras",
      minutes: 15,
      steps: [
        {
          en: "Carefully open the box along its seams and flatten it out. That flat shape is a NET.",
          es: "Abran la caja con cuidado por las uniones y aplánenla. Esa figura plana es una PLANTILLA (red).",
        },
        {
          en: "Count the faces and label each one: top, bottom, front, back, sides.",
          es: "Cuenten las caras y márquenlas: arriba, abajo, frente, atrás, lados.",
        },
        {
          en: "Measure and add the area of every face. That total is the surface area!",
          es: "Midan y sumen el área de cada cara. ¡Ese total es el área de superficie!",
        },
      ],
      talkEn: "Which faces are twins (same size)? How can twins make the adding faster?",
      talkEs:
        "¿Qué caras son gemelas (del mismo tamaño)? ¿Cómo ayudan las gemelas a sumar más rápido?",
    },
    {
      icon: "🎁",
      titleEn: "Gift-Wrap Estimator",
      titleEs: "Estimando papel de regalo",
      materialsEn: "A small box, newspaper or wrapping paper, ruler",
      materialsEs: "Una caja pequeña, periódico o papel de regalo, regla",
      minutes: 15,
      steps: [
        {
          en: "Before wrapping, compute the box's surface area: the sum of all 6 face areas.",
          es: "Antes de envolver, calculen el área de superficie de la caja: la suma de las 6 caras.",
        },
        {
          en: "Cut a piece of paper you think will just barely cover it.",
          es: "Corten un pedazo de papel que apenas alcance para cubrirla.",
        },
        {
          en: "Wrap it! Too much overlap or a bald spot? Compare with your computed answer.",
          es: "¡Envuélvanla! ¿Sobró mucho o faltó? Comparen con el resultado calculado.",
        },
      ],
      talkEn: "Why do wrappers need surface area but the box's CONTENTS need volume?",
      talkEs: "¿Por qué envolver usa el área de superficie pero el CONTENIDO usa el volumen?",
    },
    {
      icon: "🎨",
      titleEn: "Paint-Job Planner",
      titleEs: "Plan de pintura",
      materialsEn: "A shoebox (or any box), ruler, paper",
      materialsEs: "Una caja de zapatos (o cualquier caja), regla, papel",
      minutes: 10,
      steps: [
        {
          en: "Pretend you will paint the shoebox. Measure its faces.",
          es: "Imaginen que van a pintar la caja. Midan sus caras.",
        },
        {
          en: "Find the total area to paint — but wait: does the BOTTOM get painted? Decide together.",
          es: "Calculen el área total por pintar. Un momento: ¿se pinta la parte de ABAJO? Decidan juntos.",
        },
        {
          en: "If one jar of paint covers 100 square inches, how many jars do you need?",
          es: "Si un frasco de pintura cubre 100 pulgadas cuadradas, ¿cuántos frascos necesitan?",
        },
      ],
      talkEn: "Painters, wrappers, and box-makers all use surface area. Who else might?",
      talkEs:
        "Pintores, envolvedores y fabricantes de cajas usan el área de superficie. ¿Quién más la usará?",
    },
  ],
  statistics: [
    {
      icon: "📊",
      titleEn: "Family Data Night",
      titleEs: "Noche de datos en familia",
      materialsEn: "Paper and pencil, the whole family",
      materialsEs: "Papel y lápiz, toda la familia",
      minutes: 15,
      steps: [
        {
          en: "Pick a question with NUMBER answers: hours of sleep, shoe size, minutes to get to school.",
          es: "Escojan una pregunta con respuestas NUMÉRICAS: horas de sueño, talla de zapato, minutos a la escuela.",
        },
        {
          en: "Collect an answer from everyone (call a relative to grow the data set!).",
          es: "Reúnan la respuesta de todos (¡llamen a un pariente para tener más datos!).",
        },
        {
          en: "Draw a quick dot plot and find the median together.",
          es: "Hagan un diagrama de puntos rápido y encuentren la mediana juntos.",
        },
      ],
      talkEn: "Is there an outlier in our family data? What is its story?",
      talkEs: "¿Hay un valor atípico en los datos de la familia? ¿Cuál es su historia?",
    },
    {
      icon: "🎲",
      titleEn: "Roll & Record",
      titleEs: "Lanza y registra",
      materialsEn: "One die (or number cards 1-6), paper",
      materialsEs: "Un dado (o tarjetas del 1 al 6), papel",
      minutes: 10,
      steps: [
        {
          en: "Take turns rolling the die 20 times total, tallying each result.",
          es: "Túrnense para lanzar el dado 20 veces en total, anotando cada resultado.",
        },
        {
          en: "Turn the tallies into a dot plot. Describe its shape: flat, bumpy, lopsided?",
          es: "Conviertan el conteo en un diagrama de puntos. Describan su forma: ¿plana, con picos, cargada a un lado?",
        },
        {
          en: "Find the mode and the median of your 20 rolls.",
          es: "Encuentren la moda y la mediana de sus 20 lanzamientos.",
        },
      ],
      talkEn: "If we rolled 100 more times, what do you think the plot would look like? Why?",
      talkEs: "Si lanzáramos 100 veces más, ¿cómo creen que se vería el diagrama? ¿Por qué?",
    },
    {
      icon: "❓",
      titleEn: "Statistical or Not?",
      titleEs: "¿Estadística o no?",
      materialsEn: "Just conversation",
      materialsEs: "Solo conversación",
      minutes: 5,
      steps: [
        {
          en: "Take turns asking questions: 'How old am I?' vs 'How old are the people in our building?'",
          es: "Túrnense haciendo preguntas: '¿Cuántos años tengo?' contra '¿Cuántos años tienen los vecinos del edificio?'",
        },
        {
          en: "For each, decide: statistical (answers VARY) or not (one fixed answer)?",
          es: "Para cada una decidan: ¿es estadística (las respuestas VARÍAN) o no (una sola respuesta)?",
        },
        {
          en: "Keep score together: 5 statistical questions invented = you win as a team.",
          es: "Lleven la cuenta juntos: 5 preguntas estadísticas inventadas = ganan como equipo.",
        },
      ],
      talkEn: "What one word turns a fixed question into a statistical one?",
      talkEs: "¿Qué palabra convierte una pregunta fija en una estadística?",
    },
  ],
  "number-line": [
    {
      icon: "🌍",
      titleEn: "World Temperature Tour",
      titleEs: "Gira de temperaturas del mundo",
      materialsEn: "A weather app, paper",
      materialsEs: "Una app del clima, papel",
      minutes: 10,
      steps: [
        {
          en: "Look up today's temperature in 4 cities — include somewhere freezing (try Reykjavik or Anchorage).",
          es: "Busquen la temperatura de hoy en 4 ciudades; incluyan un lugar helado (prueben Reikiavik o Anchorage).",
        },
        {
          en: "Draw a vertical number line and plot all 4 temperatures, including negatives.",
          es: "Dibujen una recta numérica vertical y ubiquen las 4 temperaturas, incluidas las negativas.",
        },
        {
          en: "Order them from coldest to warmest. Which is closest to zero?",
          es: "Ordénenlas de la más fría a la más cálida. ¿Cuál está más cerca de cero?",
        },
      ],
      talkEn: "Which city's temperature has the greatest absolute value? Is it the warmest?",
      talkEs: "¿Qué ciudad tiene la temperatura con mayor valor absoluto? ¿Es la más cálida?",
    },
    {
      icon: "🏦",
      titleEn: "Money In, Money Out",
      titleEs: "Dinero que entra y sale",
      materialsEn: "Paper and pencil",
      materialsEs: "Papel y lápiz",
      minutes: 10,
      steps: [
        {
          en: "Start a pretend account at $0. Take turns narrating: 'earned $5' (+5), 'bought a snack' (−3).",
          es: "Abran una cuenta imaginaria en $0. Túrnense narrando: 'gané $5' (+5), 'compré una merienda' (−3).",
        },
        {
          en: "Track each move on a number line, one hop at a time.",
          es: "Sigan cada movimiento en una recta numérica, salto por salto.",
        },
        {
          en: "After 6 moves, where did you land? Can the account go BELOW zero? What does that mean?",
          es: "Después de 6 movimientos, ¿dónde quedaron? ¿Puede la cuenta bajar de cero? ¿Qué significa eso?",
        },
      ],
      talkEn: "What real situations use numbers below zero besides money and temperature?",
      talkEs: "¿Qué situaciones reales usan números bajo cero además del dinero y la temperatura?",
    },
    {
      icon: "🪜",
      titleEn: "Hallway Number Line",
      titleEs: "Recta numérica en el pasillo",
      materialsEn: "Painter's tape or paper squares, a marker",
      materialsEs: "Cinta de pintor o cuadros de papel, un marcador",
      minutes: 15,
      steps: [
        {
          en: "Lay a number line on the floor from −5 to 5, with 0 in the middle.",
          es: "Armen una recta numérica en el piso de −5 a 5, con el 0 en el centro.",
        },
        {
          en: "Call out numbers to stand on: '−4!' Then: 'its opposite!' Then: 'a number with absolute value 2!'",
          es: "Digan números para pararse encima: '¡−4!' Luego: '¡su opuesto!' Luego: '¡un número con valor absoluto 2!'",
        },
        {
          en: "Switch callers. Add half steps (−2½) for a challenge.",
          es: "Cambien de locutor. Agreguen medios pasos (−2½) como reto.",
        },
      ],
      talkEn: "Why do −4 and 4 both have the same absolute value? Show it with your feet!",
      talkEs: "¿Por qué −4 y 4 tienen el mismo valor absoluto? ¡Demuéstrenlo con los pies!",
    },
  ],
  "coordinate-plane": [
    {
      icon: "🗺️",
      titleEn: "Treasure-Map Grid",
      titleEs: "Mapa del tesoro",
      materialsEn: "Graph paper (or draw a grid), a small 'treasure'",
      materialsEs: "Papel cuadriculado (o dibujen la cuadrícula), un 'tesoro' pequeño",
      minutes: 15,
      steps: [
        {
          en: "Draw a map of a room as a four-quadrant grid — the room's center is (0, 0).",
          es: "Dibujen el mapa de un cuarto como cuadrícula de cuatro cuadrantes; el centro del cuarto es (0, 0).",
        },
        {
          en: "One person hides the treasure and writes its ordered pair, like (−3, 2).",
          es: "Una persona esconde el tesoro y escribe su par ordenado, por ejemplo (−3, 2).",
        },
        {
          en: "The finder walks it out: 3 left, 2 forward. Swap roles!",
          es: "El buscador lo camina: 3 a la izquierda, 2 hacia adelante. ¡Cambien de papel!",
        },
      ],
      talkEn: "Why does (−3, 2) land somewhere different from (2, −3)? Does order matter?",
      talkEs: "¿Por qué (−3, 2) queda en un lugar distinto que (2, −3)? ¿Importa el orden?",
    },
    {
      icon: "🚢",
      titleEn: "Four-Quadrant Battleship",
      titleEs: "Batalla naval en cuatro cuadrantes",
      materialsEn: "Two pieces of graph paper, pencils, a book to block views",
      materialsEs: "Dos hojas cuadriculadas, lápices, un libro para tapar la vista",
      minutes: 15,
      steps: [
        {
          en: "Each player draws axes from −5 to 5 and secretly marks 3 'ships' (each 2 points long) on grid corners.",
          es: "Cada jugador dibuja ejes de −5 a 5 y marca en secreto 3 'barcos' (de 2 puntos cada uno) en esquinas de la cuadrícula.",
        },
        {
          en: "Take turns calling ordered pairs — '(−2, 4)!' — and answer 'splash' or 'hit'.",
          es: "Túrnense diciendo pares ordenados — '¡(−2, 4)!' — y respondan 'agua' o 'impacto'.",
        },
        {
          en: "Track every guess on your own grid. Play until every ship is found.",
          es: "Anoten cada intento en su propia cuadrícula. Jueguen hasta encontrar todos los barcos.",
        },
      ],
      talkEn:
        "Which quadrant did you avoid guessing in? What sign pattern does each quadrant have?",
      talkEs: "¿En qué cuadrante casi no intentaron? ¿Qué patrón de signos tiene cada cuadrante?",
    },
    {
      icon: "🖼️",
      titleEn: "Secret-Picture Points",
      titleEs: "El dibujo secreto de puntos",
      materialsEn: "Graph paper, pencil",
      materialsEs: "Papel cuadriculado, lápiz",
      minutes: 15,
      steps: [
        {
          en: "One person secretly plans a simple shape (a star, a boat, a letter) and lists its ordered pairs in order.",
          es: "Una persona planea en secreto una figura simple (una estrella, un barco, una letra) y anota sus pares ordenados en orden.",
        },
        {
          en: "Read the pairs aloud one at a time while the other plots and connects them.",
          es: "Lean los pares en voz alta uno por uno mientras la otra persona los ubica y los une.",
        },
        {
          en: "Reveal: did the picture come out right? Swap roles and use all four quadrants.",
          es: "Revelen: ¿salió bien el dibujo? Cambien de papel y usen los cuatro cuadrantes.",
        },
      ],
      talkEn:
        "Where did a wrong point send the drawing? How do coordinates make instructions exact?",
      talkEs:
        "¿A dónde mandó el dibujo un punto equivocado? ¿Cómo hacen exactas las instrucciones las coordenadas?",
    },
  ],
  fallback: [
    {
      icon: "🫙",
      titleEn: "Estimation Jar",
      titleEs: "El frasco de estimar",
      materialsEn: "A clear jar, small objects (pasta, buttons, cereal)",
      materialsEs: "Un frasco transparente, objetos pequeños (pasta, botones, cereal)",
      minutes: 10,
      steps: [
        {
          en: "Fill the jar partway with small objects. Everyone writes a secret estimate.",
          es: "Llenen parte del frasco con objetos pequeños. Cada quien escribe una estimación secreta.",
        },
        {
          en: "Count the objects together in groups of 10 — grouping makes big counts easy.",
          es: "Cuenten los objetos juntos en grupos de 10; agrupar facilita contar cantidades grandes.",
        },
        {
          en: "Compare every estimate to the real count. Whose strategy was strongest? Ask them to teach it.",
          es: "Comparen cada estimación con el conteo real. ¿Qué estrategia fue mejor? Pidan que la expliquen.",
        },
      ],
      talkEn:
        "What information did you use to estimate? What would make your next estimate better?",
      talkEs: "¿Qué información usaron para estimar? ¿Qué mejoraría su próxima estimación?",
    },
    {
      icon: "🃏",
      titleEn: "Target 100",
      titleEs: "Meta 100",
      materialsEn: "A deck of cards (face cards removed) or slips numbered 1-9",
      materialsEs: "Una baraja (sin figuras) o papelitos del 1 al 9",
      minutes: 10,
      steps: [
        {
          en: "Deal 4 cards face up where everyone can see them.",
          es: "Pongan 4 cartas boca arriba donde todos las vean.",
        },
        {
          en: "As a team, combine them with +, −, ×, ÷ to land as close to 100 as you can.",
          es: "En equipo, combínenlas con +, −, ×, ÷ para acercarse lo más posible a 100.",
        },
        {
          en: "Write the expression you built and check it respects order of operations. Deal again!",
          es: "Escriban la expresión que armaron y revisen que respete el orden de las operaciones. ¡Repartan otra vez!",
        },
      ],
      talkEn: "Which operation moved you the most? When did parentheses change everything?",
      talkEs: "¿Qué operación los acercó más? ¿Cuándo lo cambiaron todo los paréntesis?",
    },
    {
      icon: "🍽️",
      titleEn: "Math Around the Table",
      titleEs: "Matemáticas en la mesa",
      materialsEn: "Just conversation at a meal",
      materialsEs: "Solo conversación durante una comida",
      minutes: 5,
      steps: [
        {
          en: "At dinner, each person shares one place they used math today — cooking, shopping, work, games.",
          es: "En la cena, cada persona cuenta dónde usó matemáticas hoy: cocinando, comprando, en el trabajo, en juegos.",
        },
        {
          en: "The student explains what tonight's lesson is about in their own words.",
          es: "El estudiante explica de qué trata la lección de hoy con sus propias palabras.",
        },
        {
          en: "Together, hunt for one place THIS lesson's math shows up in your home.",
          es: "Juntos, busquen un lugar de la casa donde aparezcan las matemáticas de ESTA lección.",
        },
      ],
      talkEn: "Who in our family uses the most math at work? Ask them how!",
      talkEs: "¿Quién de la familia usa más matemáticas en su trabajo? ¡Pregúntenle cómo!",
    },
  ],
};

export function getFamilyActivities(topicOrConfig) {
  const config = typeof topicOrConfig === "object" ? topicOrConfig : null;
  if (config) return [householdMission(config)];
  return FAMILY_ACTIVITIES[topicOrConfig] || FAMILY_ACTIVITIES.fallback;
}

/** One activity card: a friendly accordion with steps and a talk prompt. */
function renderFamilyActivityCard(activity, idx) {
  const stepsHtml = activity.steps
    .map(
      (s, i) => `
        <li class="fam-act-step">
          <span class="fam-act-step-num" aria-hidden="true">${i + 1}</span>
          <div>
            <p class="lang-en">${esc(s.en)}</p>
            <p class="lang-es" lang="es">${esc(s.es)}</p>
          </div>
        </li>`,
    )
    .join("");

  return `
    <details class="fam-act-card" data-family-activity="${idx}"${idx === 0 ? " open" : ""}>
      <summary class="fam-act-summary">
        <span class="fam-act-icon" aria-hidden="true">${activity.icon}</span>
        <span class="fam-act-titles">
          <strong><span class="lang-en">${esc(activity.titleEn)}</span><span class="lang-es" lang="es">${esc(activity.titleEs)}</span></strong>
          <small class="fam-act-meta">
            <span class="fam-act-time">⏱️ ~${activity.minutes} min</span>
            <span class="fam-act-materials"><span class="lang-en">🧰 ${esc(activity.materialsEn)}</span><span class="lang-es" lang="es">🧰 ${esc(activity.materialsEs)}</span></span>
          </small>
        </span>
        <span class="fam-act-chevron" aria-hidden="true">▾</span>
      </summary>
      <div class="fam-act-body">
        <ol class="fam-act-steps">${stepsHtml}</ol>
        <div class="fam-act-talk">
          <strong>💬 <span class="lang-en">Talk about it:</span><span class="lang-es" lang="es">Para conversar:</span></strong>
          <span class="lang-en">${esc(activity.talkEn)}</span>
          <span class="lang-es" lang="es">${esc(activity.talkEs)}</span>
        </div>
        <button type="button" class="fam-mission-complete" data-mission-complete="${idx}" aria-pressed="false" ${act("completeFamilyMission", idx)}>
          <span class="fam-mission-check" aria-hidden="true">✓</span>
          <span class="lang-en">We did this mission</span><span class="lang-es" lang="es">Completamos esta misión</span>
        </button>
      </div>
    </details>`;
}

/**
 * The Family Activity Corner: three hands-on, no-device activities matched to
 * tonight's topic. Lives on the Together tab, after the guided practice.
 */
export function renderFamilyActivityCorner(topic) {
  const acts = getFamilyActivities(topic);
  return `
    <div class="fam-act-corner card-ish" aria-label="Family activity corner" data-aria-en="Family activity corner" data-aria-es="Actividades familiares">
      <div class="fam-act-head">
        <div>
          <span class="fam-act-badge">🏡 <span class="lang-en">FAMILY ACTIVITY CORNER</span><span class="lang-es" lang="es">RINCÓN DE ACTIVIDADES</span></span>
          <p class="fam-act-lead">
            <span class="lang-en">Try the recommended mission. Student: explain; partner: ask one question, then switch. Paper drawings work for every object.</span>
            <span class="lang-es" lang="es">Prueba la misión recomendada. Estudiante: explica; acompañante: haz una pregunta, luego cambien. Puedes dibujar los objetos en papel.</span>
          </p>
        </div>
        ${
          acts.length > 1
            ? `<button type="button" class="family-mission-picker" ${act("pickFamilyMission")}>
          🎲 <span class="lang-en">Pick an alternative</span><span class="lang-es" lang="es">Elegir una alternativa</span>
        </button>`
            : ""
        }
      </div>
      <p class="family-mission-status" id="family_mission_status" aria-live="polite">
        <span class="lang-en">One mission is enough. You can also work solo and explain in writing.</span><span class="lang-es" lang="es">Una misión es suficiente. También puedes trabajar a solas y explicar por escrito.</span>
      </p>
      ${renderFamilyActivityCard(acts[0], 0)}
      ${
        acts.length > 1
          ? `<details class="family-mission-alternatives"><summary><span class="lang-en">Optional alternatives</span><span class="lang-es" lang="es">Alternativas opcionales</span></summary>${acts
              .slice(1)
              .map((a, i) => renderFamilyActivityCard(a, i + 1))
              .join("")}</details>`
          : ""
      }
    </div>`;
}

/**
 * Family Game Break — two built-in interactive games on the Together tab,
 * distinct from the Words tab's term↔definition matcher:
 *   1. Math Dominoes: a chain built from pairs of "math twins" (expression ↔ value).
 *   2. True or False? Family Face-Off: turn-taking statements whose false
 *      halves come from the topic's real misconceptions, each with a why.
 * Collaborative and NEVER timed (site rule). Content is authored per topic
 * below; every pair and statement is checked arithmetic, not generated.
 */
const FAMILY_GAME_PAIRS = {
  // 6.AT.1 — writing a comparison, in the order it is named. No equivalence,
  // no rates, no percent: none of it has been taught on the night this runs.
  "ratios-understand": [
    { a: "3 to 2", b: "3 : 2" },
    { a: "3 red to 5 blue", b: "part to part" },
    { a: "3 red out of 8 in all", b: "part to whole" },
    { a: "the word “to”", b: "the symbol :" },
  ],
  // 6.AT.2 — the rate for ONE.
  "ratios-rate": [
    { a: "$6 for 3 lb", b: "$2 per lb" },
    { a: "120 miles in 2 hours", b: "60 miles per hour" },
    { a: "$5.00 for 10 pencils", b: "50¢ per pencil" },
    { a: "the words “per” and “each”", b: "a rate for 1" },
  ],
  // 6.AT.4 — Unit 4.
  percent: [
    { a: "1/2 as a percent", b: "50%" },
    { a: "0.25", b: "25%" },
    { a: "percent", b: "per 100" },
    { a: "30 out of 100", b: "30%" },
  ],
  // 6.AT.3* — equivalent ratios. This is the bank the whole strand used to
  // share, and it fits the middle of Unit 3 exactly.
  ratios: [
    { a: "2 : 3 doubled", b: "4 : 6" },
    { a: "2 : 5 times 4", b: "8 : 20" },
    { a: "6 : 9 simplified", b: "2 : 3" },
    { a: "3 to 4", b: "3 : 4" },
  ],
  fractions: [
    { a: "2 ÷ 1/4", b: "8" },
    { a: "1/2 of 12", b: "6" },
    { a: "3/6 simplified", b: "1/2" },
    { a: "1 ÷ 1/3", b: "3" },
  ],
  decimals: [
    { a: "0.5 + 0.25", b: "0.75" },
    { a: "1.2 × 10", b: "12" },
    { a: "$5.00 − $3.25", b: "$1.75" },
    { a: "0.30", b: "0.3" },
  ],
  division: [
    { a: "84 ÷ 4", b: "21" },
    { a: "75 ÷ 10", b: "7 R5" },
    { a: "600 ÷ 5", b: "120" },
    { a: "63 ÷ 7", b: "9" },
  ],
  factors: [
    { a: "GCF of 12 and 18", b: "6" },
    { a: "LCM of 4 and 6", b: "12" },
    { a: "A prime number", b: "13" },
    { a: "Factors of 10", b: "1, 2, 5, 10" },
  ],
  exponents: [
    { a: "2³", b: "8" },
    { a: "5²", b: "25" },
    { a: "10⁴", b: "10,000" },
    { a: "3 × 3 × 3", b: "3³" },
  ],
  expressions: [
    { a: "2x when x = 4", b: "8" },
    { a: "Coefficient of 5y", b: "5" },
    { a: "n + n + n", b: "3n" },
    { a: "Constant in 4x + 7", b: "7" },
  ],
  equations: [
    { a: "m + 4 = 10", b: "m = 6" },
    { a: "3k = 21", b: "k = 7" },
    { a: "y − 5 = 2", b: "y = 7" },
    { a: "n ÷ 2 = 8", b: "n = 16" },
  ],
  inequalities: [
    { a: "h ≥ 48: is 48 allowed?", b: "Yes" },
    { a: "t > 60: is 60 allowed?", b: "No" },
    { a: "x < 10: biggest whole number", b: "9" },
    { a: "c ≤ 15: the limit itself", b: "Allowed" },
  ],
  properties: [
    { a: "4 × (3 + 2)", b: "4 × 3 + 4 × 2" },
    { a: "6 × 4", b: "4 × 6" },
    { a: "9 + 0", b: "9" },
    { a: "7 × 1", b: "7" },
  ],
  area: [
    { a: "Rectangle 6 by 4", b: "24 square units" },
    { a: "Triangle b = 6, h = 4", b: "12 square units" },
    { a: "Parallelogram b = 5, h = 3", b: "15 square units" },
    { a: "Square with side 5", b: "25 square units" },
  ],
  volume: [
    { a: "Box 2 × 3 × 4", b: "24 cubic units" },
    { a: "Cube with edge 3", b: "27 cubic units" },
    { a: "Box 5 × 2 × 2", b: "20 cubic units" },
    { a: "Unit cube 1 × 1 × 1", b: "1 cubic unit" },
  ],
  "surface-area": [
    { a: "One face of a cube, edge 2", b: "4 square units" },
    { a: "ALL faces of a cube, edge 2", b: "24 square units" },
    { a: "Faces on a rectangular box", b: "6" },
    { a: "Flattened-out box shape", b: "A net" },
  ],
  statistics: [
    { a: "Median of 3, 5, 7", b: "5" },
    { a: "Mode of 2, 2, 9", b: "2" },
    { a: "Mean of 1, 2, 3, 4", b: "2.5" },
    { a: "Range from 3 to 11", b: "8" },
  ],
  "number-line": [
    { a: "Opposite of −4", b: "4" },
    { a: "|−6|", b: "6" },
    { a: "Greater: −2 or −7", b: "−2" },
    { a: "Distance from −3 to 0", b: "3" },
  ],
  "coordinate-plane": [
    { a: "(3, 2) from the origin", b: "Right 3, up 2" },
    { a: "(−1, 4) lives in…", b: "Quadrant II" },
    { a: "(0, 0) is called…", b: "The origin" },
    { a: "(2, −5) lives in…", b: "Quadrant IV" },
  ],
  fallback: [
    { a: "Half of 50", b: "25" },
    { a: "Double 35", b: "70" },
    { a: "10% of 200", b: "20" },
    { a: "24 ÷ 6", b: "4" },
  ],
};

const FAMILY_TF_QUESTIONS = {
  "ratios-understand": [
    {
      en: "The ratio 2:3 is the same as the ratio 3:2.",
      es: "La razón 2:3 es igual a la razón 3:2.",
      answer: false,
      whyEn: "Order matters in a ratio — 2 cups juice to 3 cups water is not 3 juice to 2 water.",
      whyEs:
        "El orden importa en una razón: 2 tazas de jugo por 3 de agua no es lo mismo que 3 de jugo por 2 de agua.",
    },
    {
      en: "A bowl has 3 apples and 5 oranges. The ratio of apples to oranges is 3:5.",
      es: "Un frutero tiene 3 manzanas y 5 naranjas. La razón de manzanas a naranjas es 3:5.",
      answer: true,
      whyEn: "Apples are named first, so 3 goes first. That is a part-to-part ratio.",
      whyEs:
        "Las manzanas se nombran primero, así que el 3 va primero. Es una razón parte a parte.",
    },
    {
      en: "In that same bowl, the ratio of apples to ALL the fruit is 3:5.",
      es: "En ese mismo frutero, la razón de manzanas a TODA la fruta es 3:5.",
      answer: false,
      whyEn: "All the fruit is 3 + 5 = 8, so apples to all the fruit is 3:8 — part to whole.",
      whyEs: "Toda la fruta es 3 + 5 = 8, así que manzanas a toda la fruta es 3:8 — parte a todo.",
    },
    {
      en: "“12 cookies” by itself is a ratio.",
      es: "“12 galletas” por sí solo es una razón.",
      answer: false,
      whyEn: "A ratio always compares TWO amounts. One number alone is just a count.",
      whyEs: "Una razón siempre compara DOS cantidades. Un solo número es nada más un conteo.",
    },
    {
      en: "“3 to 2” and “3 : 2” are two ways to write the same ratio.",
      es: "“3 a 2” y “3 : 2” son dos maneras de escribir la misma razón.",
      answer: true,
      whyEn: "The colon is just a shorter way to write the word “to.”",
      whyEs: "Los dos puntos son solo una manera más corta de escribir la palabra “a.”",
    },
  ],
  "ratios-rate": [
    {
      en: "A unit rate compares a quantity to exactly 1 of something.",
      es: "Una tasa unitaria compara una cantidad con exactamente 1 de algo.",
      answer: true,
      whyEn: "Miles per 1 hour, dollars per 1 pound — the 1 is what makes it a UNIT rate.",
      whyEs: "Millas por 1 hora, dólares por 1 libra: el 1 es lo que la hace tasa UNITARIA.",
    },
    {
      en: "To find the price for one item, divide the total cost by the number of items.",
      es: "Para hallar el precio de un artículo, divide el costo total entre el número de artículos.",
      answer: true,
      whyEn: "$6 for 3 pounds is $6 ÷ 3 = $2 per pound.",
      whyEs: "$6 por 3 libras es $6 ÷ 3 = $2 por libra.",
    },
    {
      en: "$8 for 4 pounds is a better price per pound than $9 for 3 pounds.",
      es: "$8 por 4 libras es mejor precio por libra que $9 por 3 libras.",
      answer: true,
      whyEn: "$8 ÷ 4 = $2 per pound; $9 ÷ 3 = $3 per pound. $2 is less.",
      whyEs: "$8 ÷ 4 = $2 por libra; $9 ÷ 3 = $3 por libra. $2 es menos.",
    },
    {
      en: "The bigger package is always the better buy.",
      es: "El paquete más grande siempre es la mejor compra.",
      answer: false,
      whyEn:
        "Only the price for ONE unit can answer that — a big box can still cost more per ounce.",
      whyEs:
        "Solo el precio por UNA unidad lo responde: una caja grande puede costar más por onza.",
    },
    {
      en: "“60 miles per hour” and “60 miles every 2 hours” are the same rate.",
      es: "“60 millas por hora” y “60 millas cada 2 horas” son la misma tasa.",
      answer: false,
      whyEn: "60 miles every 2 hours is 60 ÷ 2 = 30 miles per hour — half as fast.",
      whyEs: "60 millas cada 2 horas es 60 ÷ 2 = 30 millas por hora: la mitad de rápido.",
    },
  ],
  percent: [
    {
      en: "Percent means “per 100.”",
      es: "Por ciento significa “por cada 100.”",
      answer: true,
      whyEn: "45% means 45 out of every 100.",
      whyEs: "45% significa 45 de cada 100.",
    },
    {
      en: "25% of a number is the same as 1/4 of it.",
      es: "El 25% de un número es lo mismo que 1/4 de él.",
      answer: true,
      whyEn: "25 out of 100 simplifies to 1/4, so both take the same amount.",
      whyEs: "25 de 100 se simplifica a 1/4, así que ambos toman la misma cantidad.",
    },
    {
      en: "A percent can never be more than 100.",
      es: "Un porcentaje nunca puede ser mayor que 100.",
      answer: false,
      whyEn: "150% just means one and a half times the whole — 150% of 20 is 30.",
      whyEs: "150% significa una vez y media el total: el 150% de 20 es 30.",
    },
    {
      en: "To find 10% of a number, move the decimal point one place to the left.",
      es: "Para hallar el 10% de un número, mueve el punto decimal un lugar a la izquierda.",
      answer: true,
      whyEn: "10% of 80 is 8.0 — and that makes 5% and 20% easy from there.",
      whyEs: "El 10% de 80 es 8.0, y desde ahí el 5% y el 20% salen fácil.",
    },
    {
      en: "Taking 50% off, then 50% off again, is the same as 100% off.",
      es: "Quitar 50%, y luego otro 50%, es lo mismo que quitar 100%.",
      answer: false,
      whyEn: "The second 50% comes off the SMALLER price, so you still pay 25% — never free.",
      whyEs: "El segundo 50% se quita del precio MÁS PEQUEÑO, así que pagas 25%: nunca es gratis.",
    },
  ],
  ratios: [
    {
      en: "The ratio 2:3 is the same as the ratio 3:2.",
      es: "La razón 2:3 es igual a la razón 3:2.",
      answer: false,
      whyEn: "Order matters in a ratio — 2 cups juice to 3 cups water is not 3 juice to 2 water.",
      whyEs:
        "El orden importa en una razón: 2 tazas de jugo por 3 de agua no es lo mismo que 3 de jugo por 2 de agua.",
    },
    {
      en: "To double a recipe, you multiply every ingredient by 2.",
      es: "Para duplicar una receta, se multiplica cada ingrediente por 2.",
      answer: true,
      whyEn: "Equivalent ratios come from multiplying BOTH parts by the same number.",
      whyEs: "Las razones equivalentes salen de multiplicar LAS DOS partes por el mismo número.",
    },
    {
      en: "3:4 and 6:8 describe the same relationship.",
      es: "3:4 y 6:8 describen la misma relación.",
      answer: true,
      whyEn: "Multiply both parts of 3:4 by 2 and you get 6:8 — equivalent ratios.",
      whyEs: "Multiplica las dos partes de 3:4 por 2 y obtienes 6:8: razones equivalentes.",
    },
    {
      en: "To make equivalent ratios you can ADD the same number to both parts.",
      es: "Para hacer razones equivalentes se puede SUMAR el mismo número a las dos partes.",
      answer: false,
      whyEn:
        "That's the classic trap! 2:3 plus 1 each gives 3:4, which is a different relationship. You must MULTIPLY.",
      whyEs:
        "¡Esa es la trampa clásica! 2:3 más 1 en cada parte da 3:4, otra relación. Hay que MULTIPLICAR.",
    },
    {
      en: "A unit rate compares a quantity to exactly 1 of something.",
      es: "Una tasa unitaria compara una cantidad con exactamente 1 de algo.",
      answer: true,
      whyEn: "Miles per 1 hour, dollars per 1 pound — the 1 is what makes it a UNIT rate.",
      whyEs: "Millas por 1 hora, dólares por 1 libra: el 1 es lo que la hace tasa UNITARIA.",
    },
  ],
  fractions: [
    {
      en: "Dividing by a fraction less than 1 gives an answer BIGGER than what you started with.",
      es: "Dividir entre una fracción menor que 1 da un resultado MAYOR que el número original.",
      answer: true,
      whyEn: "2 ÷ 1/4 asks how many quarter-pieces fit in 2 wholes: 8 of them!",
      whyEs: "2 ÷ 1/4 pregunta cuántos cuartos caben en 2 enteros: ¡8!",
    },
    {
      en: "Dividing always makes numbers smaller.",
      es: "Dividir siempre hace los números más pequeños.",
      answer: false,
      whyEn: "Only when dividing by a number bigger than 1. Dividing by 1/2 doubles!",
      whyEs: "Solo al dividir entre un número mayor que 1. ¡Dividir entre 1/2 duplica!",
    },
    {
      en: "There are exactly 6 pieces of size 1/3 in 2 wholes.",
      es: "Hay exactamente 6 pedazos de 1/3 en 2 enteros.",
      answer: true,
      whyEn: "Each whole holds 3 thirds, so 2 wholes hold 6: 2 ÷ 1/3 = 6.",
      whyEs: "Cada entero tiene 3 tercios, así que 2 enteros tienen 6: 2 ÷ 1/3 = 6.",
    },
    {
      en: "To divide by a fraction, you can multiply by its reciprocal (its flip).",
      es: "Para dividir entre una fracción, se puede multiplicar por su recíproco (volteada).",
      answer: true,
      whyEn: "2 ÷ 1/4 = 2 × 4/1 = 8. Keep–Change–Flip works because of what division means.",
      whyEs:
        "2 ÷ 1/4 = 2 × 4/1 = 8. Mantener–Cambiar–Voltear funciona por lo que significa dividir.",
    },
    {
      en: "1/2 and 3/6 are different amounts.",
      es: "1/2 y 3/6 son cantidades diferentes.",
      answer: false,
      whyEn:
        "Fold a paper in half, or in sixths and shade 3 — same amount of paper. They're equivalent.",
      whyEs:
        "Dobla un papel a la mitad, o en sextos y colorea 3: la misma cantidad. Son equivalentes.",
    },
  ],
  decimals: [
    {
      en: "When adding money, you line up the decimal points.",
      es: "Al sumar dinero, se alinean los puntos decimales.",
      answer: true,
      whyEn:
        "Lining up the points lines up the place values — dollars with dollars, cents with cents.",
      whyEs:
        "Alinear los puntos alinea los valores posicionales: dólares con dólares, centavos con centavos.",
    },
    {
      en: "0.5 is smaller than 0.35 because 5 is smaller than 35.",
      es: "0.5 es menor que 0.35 porque 5 es menor que 35.",
      answer: false,
      whyEn: "Classic trap! 0.5 = 0.50, and 50 hundredths beats 35 hundredths.",
      whyEs: "¡Trampa clásica! 0.5 = 0.50, y 50 centésimas es más que 35 centésimas.",
    },
    {
      en: "0.3 and 0.30 are the same number.",
      es: "0.3 y 0.30 son el mismo número.",
      answer: true,
      whyEn:
        "Three tenths equals thirty hundredths — a zero at the END after the decimal changes nothing.",
      whyEs:
        "Tres décimas son treinta centésimas: un cero AL FINAL después del punto no cambia nada.",
    },
    {
      en: "Multiplying a decimal by 10 moves the decimal point one place to the right.",
      es: "Multiplicar un decimal por 10 mueve el punto una posición a la derecha.",
      answer: true,
      whyEn: "1.2 × 10 = 12 — every digit's place value gets ten times bigger.",
      whyEs: "1.2 × 10 = 12: el valor de cada dígito se hace diez veces mayor.",
    },
    {
      en: "$5.00 minus $3.25 is $2.25.",
      es: "$5.00 menos $3.25 son $2.25.",
      answer: false,
      whyEn: "Count up: $3.25 + 75¢ = $4.00, + $1.00 = $5.00. The change is $1.75.",
      whyEs: "Cuenten hacia arriba: $3.25 + 75¢ = $4.00, + $1.00 = $5.00. El cambio es $1.75.",
    },
  ],
  division: [
    {
      en: "In 74 ÷ 12, the remainder tells you how many are left over after equal groups.",
      es: "En 74 ÷ 12, el residuo dice cuántos sobran después de formar grupos iguales.",
      answer: true,
      whyEn: "12 groups of 6 use 72; the remainder 2 is what's left in your hand.",
      whyEs: "12 grupos de 6 usan 72; el residuo 2 es lo que queda en la mano.",
    },
    {
      en: "When a digit is too small to divide, you just skip it.",
      es: "Cuando un dígito es muy pequeño para dividir, simplemente se salta.",
      answer: false,
      whyEn:
        "The trap that breaks long division! The quotient gets a 0 in that place and the digit joins the next one.",
      whyEs:
        "¡La trampa que rompe la división! El cociente lleva un 0 en ese lugar y el dígito se junta con el siguiente.",
    },
    {
      en: "618 ÷ 3 = 206.",
      es: "618 ÷ 3 = 206.",
      answer: true,
      whyEn:
        "6÷3=2, 1 doesn't go so the quotient gets 0 and 1 carries: 18÷3=6. Check: 206 × 3 = 618.",
      whyEs: "6÷3=2, el 1 no alcanza así que va 0 y el 1 pasa: 18÷3=6. Comprueba: 206 × 3 = 618.",
    },
    {
      en: "You can check any division with multiplication.",
      es: "Cualquier división se puede comprobar con una multiplicación.",
      answer: true,
      whyEn: "Quotient × divisor (+ remainder) must rebuild the number you started with.",
      whyEs: "Cociente × divisor (+ residuo) debe reconstruir el número original.",
    },
    {
      en: "If 58 guests sit at tables of 8, you need exactly 7 tables.",
      es: "Si 58 invitados se sientan en mesas de 8, se necesitan exactamente 7 mesas.",
      answer: false,
      whyEn: "7 tables seat 56 — two guests are standing! Round UP to 8 tables.",
      whyEs:
        "7 mesas sientan a 56: ¡dos invitados quedan de pie! Se redondea HACIA ARRIBA a 8 mesas.",
    },
  ],
  factors: [
    {
      en: "1 is a prime number.",
      es: "El 1 es un número primo.",
      answer: false,
      whyEn: "A prime needs exactly TWO different factors. 1 has only one factor: itself.",
      whyEs:
        "Un primo necesita exactamente DOS factores diferentes. El 1 solo tiene uno: él mismo.",
    },
    {
      en: "The greatest common factor of 12 and 18 is 6.",
      es: "El máximo común divisor de 12 y 18 es 6.",
      answer: true,
      whyEn: "Factors of 12: 1,2,3,4,6,12. Of 18: 1,2,3,6,9,18. Biggest shared: 6.",
      whyEs: "Factores de 12: 1,2,3,4,6,12. De 18: 1,2,3,6,9,18. El mayor compartido: 6.",
    },
    {
      en: "The least common multiple of 4 and 6 is 24.",
      es: "El mínimo común múltiplo de 4 y 6 es 24.",
      answer: false,
      whyEn: "24 IS a common multiple, but 12 comes first: 4, 8, 12… and 6, 12… They meet at 12.",
      whyEs:
        "24 SÍ es múltiplo común, pero el 12 llega antes: 4, 8, 12… y 6, 12… Se encuentran en 12.",
    },
    {
      en: "Every whole number bigger than 1 is either prime or can be built from primes.",
      es: "Todo número entero mayor que 1 es primo o se puede construir con primos.",
      answer: true,
      whyEn: "That's prime factorization: 12 = 2 × 2 × 3. Primes are the building blocks.",
      whyEs:
        "Eso es la factorización prima: 12 = 2 × 2 × 3. Los primos son los bloques de construcción.",
    },
    {
      en: "2 is the only even prime number.",
      es: "El 2 es el único número primo par.",
      answer: true,
      whyEn: "Every other even number has 2 as an extra factor, so it can't be prime.",
      whyEs: "Cualquier otro número par tiene al 2 como factor extra, así que no puede ser primo.",
    },
  ],
  exponents: [
    {
      en: "3⁴ means 3 × 4.",
      es: "3⁴ significa 3 × 4.",
      answer: false,
      whyEn: "The #1 exponent trap! 3⁴ = 3 × 3 × 3 × 3 = 81, not 12.",
      whyEs: "¡La trampa #1 de los exponentes! 3⁴ = 3 × 3 × 3 × 3 = 81, no 12.",
    },
    {
      en: "2⁵ = 32.",
      es: "2⁵ = 32.",
      answer: true,
      whyEn: "2, 4, 8, 16, 32 — five doublings.",
      whyEs: "2, 4, 8, 16, 32: cinco duplicaciones.",
    },
    {
      en: "Folding a paper in half 3 times gives 6 layers.",
      es: "Doblar un papel a la mitad 3 veces da 6 capas.",
      answer: false,
      whyEn: "Each fold DOUBLES: 2, 4, 8 layers. That's 2³, not 2 × 3.",
      whyEs: "Cada doblez DUPLICA: 2, 4, 8 capas. Eso es 2³, no 2 × 3.",
    },
    {
      en: "Any number to the power of 1 is itself.",
      es: "Cualquier número elevado a 1 es él mismo.",
      answer: true,
      whyEn: "7¹ means one copy of 7 in the product — just 7.",
      whyEs: "7¹ significa una sola copia del 7 en el producto: solo 7.",
    },
    {
      en: "10³ = 1,000.",
      es: "10³ = 1,000.",
      answer: true,
      whyEn: "10 × 10 × 10 — the exponent counts the zeros for powers of ten.",
      whyEs: "10 × 10 × 10: el exponente cuenta los ceros en las potencias de diez.",
    },
  ],
  expressions: [
    {
      en: "In the expression 3t + 2, the 3 is called a coefficient.",
      es: "En la expresión 3t + 2, el 3 se llama coeficiente.",
      answer: true,
      whyEn: "A coefficient is the number multiplying the variable.",
      whyEs: "El coeficiente es el número que multiplica a la variable.",
    },
    {
      en: "n + n + n is the same as n³.",
      es: "n + n + n es lo mismo que n³.",
      answer: false,
      whyEn: "Adding three copies gives 3n. n³ means n × n × n — multiplying.",
      whyEs: "Sumar tres copias da 3n. n³ significa n × n × n: multiplicar.",
    },
    {
      en: "If x = 4, then 2x + 1 = 9.",
      es: "Si x = 4, entonces 2x + 1 = 9.",
      answer: true,
      whyEn: "Substitute: 2 × 4 = 8, plus 1 is 9.",
      whyEs: "Sustituyan: 2 × 4 = 8, más 1 son 9.",
    },
    {
      en: "2x means 2 + x.",
      es: "2x significa 2 + x.",
      answer: false,
      whyEn: "A number touching a variable means MULTIPLY: 2x is 2 times x.",
      whyEs: "Un número pegado a una variable significa MULTIPLICAR: 2x es 2 por x.",
    },
    {
      en: "An expression like 4s + 2p can have two different variables.",
      es: "Una expresión como 4s + 2p puede tener dos variables diferentes.",
      answer: true,
      whyEn: "Each variable stands for its own quantity — shirts and pants can vary separately.",
      whyEs:
        "Cada variable representa su propia cantidad: camisas y pantalones varían por separado.",
    },
  ],
  equations: [
    {
      en: "An equation stays balanced if you do the same thing to BOTH sides.",
      es: "Una ecuación sigue equilibrada si haces lo mismo en LOS DOS lados.",
      answer: true,
      whyEn: "It works exactly like a balance scale — equal changes keep it level.",
      whyEs: "Funciona igual que una balanza: cambios iguales la mantienen nivelada.",
    },
    {
      en: "To solve m + 4 = 10, you add 4 to both sides.",
      es: "Para resolver m + 4 = 10, se suma 4 a los dos lados.",
      answer: false,
      whyEn: "You UNDO the +4 by subtracting 4: m = 6. Adding would give m + 8 = 14.",
      whyEs: "Se DESHACE el +4 restando 4: m = 6. Sumar daría m + 8 = 14.",
    },
    {
      en: "The solution of 3k = 21 is k = 7.",
      es: "La solución de 3k = 21 es k = 7.",
      answer: true,
      whyEn: "Divide both sides by 3. Check: 3 × 7 = 21. ✓",
      whyEs: "Dividan los dos lados entre 3. Comprueben: 3 × 7 = 21. ✓",
    },
    {
      en: "You can always check a solution by substituting it back into the equation.",
      es: "Siempre se puede comprobar una solución sustituyéndola en la ecuación.",
      answer: true,
      whyEn:
        "If both sides come out equal, the solution is right — the equation's own lie detector.",
      whyEs:
        "Si los dos lados salen iguales, la solución es correcta: el detector de mentiras de la ecuación.",
    },
    {
      en: "An equals sign means 'the answer comes next.'",
      es: "El signo igual significa 'aquí viene la respuesta'.",
      answer: false,
      whyEn: "It means both sides have the SAME VALUE — that's why balancing works.",
      whyEs: "Significa que los dos lados tienen el MISMO VALOR: por eso funciona el equilibrio.",
    },
  ],
  inequalities: [
    {
      en: "x ≥ 48 means 48 itself is allowed.",
      es: "x ≥ 48 significa que el mismo 48 está permitido.",
      answer: true,
      whyEn: "The little line under the symbol means 'or equal to' — exactly 48 works.",
      whyEs: "La rayita bajo el símbolo significa 'o igual a': exactamente 48 sirve.",
    },
    {
      en: "x > 5 and x ≥ 5 mean the same thing.",
      es: "x > 5 y x ≥ 5 significan lo mismo.",
      answer: false,
      whyEn: "They differ at exactly one number: 5 itself. > excludes it, ≥ includes it.",
      whyEs: "Difieren en exactamente un número: el propio 5. > lo excluye, ≥ lo incluye.",
    },
    {
      en: "An inequality like t > 60 has infinitely many solutions.",
      es: "Una desigualdad como t > 60 tiene infinitas soluciones.",
      answer: true,
      whyEn:
        "61, 62, 60.5, 1,000… every number above 60 works. That's why we graph a ray, not a dot.",
      whyEs:
        "61, 62, 60.5, 1,000… todo número mayor que 60 sirve. Por eso se grafica un rayo, no un punto.",
    },
    {
      en: "If you may spend at most $15, then c ≤ 15 describes your budget.",
      es: "Si puedes gastar máximo $15, entonces c ≤ 15 describe tu presupuesto.",
      answer: true,
      whyEn: "'At most' includes the limit — spending exactly $15 is still allowed.",
      whyEs: "'Máximo' incluye el límite: gastar exactamente $15 sigue permitido.",
    },
    {
      en: "On a number line, x > 3 is drawn with a filled-in dot at 3.",
      es: "En la recta numérica, x > 3 se dibuja con un punto relleno en el 3.",
      answer: false,
      whyEn: "An OPEN circle at 3 — because 3 itself is not included in x > 3.",
      whyEs: "Un círculo ABIERTO en el 3, porque el propio 3 no está incluido en x > 3.",
    },
  ],
  properties: [
    {
      en: "4 × (3 + 2) gives the same total as 4 × 3 + 4 × 2.",
      es: "4 × (3 + 2) da el mismo total que 4 × 3 + 4 × 2.",
      answer: true,
      whyEn: "Both count 4 snack packs of 5 items: 20. That's the distributive property.",
      whyEs: "Los dos cuentan 4 paquetes de 5: 20. Esa es la propiedad distributiva.",
    },
    {
      en: "Switching the order changes the answer in multiplication.",
      es: "Cambiar el orden cambia el resultado en la multiplicación.",
      answer: false,
      whyEn:
        "6 × 4 = 4 × 6 — turn the rectangle of beans sideways, same beans. Commutative property.",
      whyEs:
        "6 × 4 = 4 × 6: giren el rectángulo de frijoles, son los mismos frijoles. Propiedad conmutativa.",
    },
    {
      en: "Switching the order changes the answer in subtraction.",
      es: "Cambiar el orden cambia el resultado en la resta.",
      answer: true,
      whyEn:
        "10 − 3 = 7 but 3 − 10 = −7. Subtraction is NOT commutative — that's why the trap matters.",
      whyEs: "10 − 3 = 7 pero 3 − 10 = −7. La resta NO es conmutativa: por eso importa la trampa.",
    },
    {
      en: "Multiplying any number by 1 leaves it unchanged.",
      es: "Multiplicar cualquier número por 1 lo deja igual.",
      answer: true,
      whyEn: "The identity property of multiplication — one copy of the number.",
      whyEs: "La propiedad de identidad de la multiplicación: una sola copia del número.",
    },
    {
      en: "3 × 4.98 can be computed as 3 × 5 minus 3 × 0.02.",
      es: "3 × 4.98 se puede calcular como 3 × 5 menos 3 × 0.02.",
      answer: true,
      whyEn: "Distribute over (5 − 0.02): $15.00 − $0.06 = $14.94. A mental-math superpower!",
      whyEs:
        "Distribuyan sobre (5 − 0.02): $15.00 − $0.06 = $14.94. ¡Un superpoder de cálculo mental!",
    },
  ],
  area: [
    {
      en: "Area is measured in square units.",
      es: "El área se mide en unidades cuadradas.",
      answer: true,
      whyEn: "Area counts the unit squares that cover a surface.",
      whyEs: "El área cuenta los cuadrados unitarios que cubren una superficie.",
    },
    {
      en: "The area of a parallelogram uses the slanted side times the base.",
      es: "El área de un paralelogramo usa el lado inclinado por la base.",
      answer: false,
      whyEn:
        "It uses the straight-up HEIGHT. Cut the triangle off one end, slide it over — it's a rectangle of base × height.",
      whyEs:
        "Usa la ALTURA vertical. Corten el triángulo de un extremo y deslícenlo: queda un rectángulo de base × altura.",
    },
    {
      en: "A triangle's area is half the area of its matching rectangle.",
      es: "El área de un triángulo es la mitad del área de su rectángulo correspondiente.",
      answer: true,
      whyEn:
        "Break a rectangular cracker corner to corner: two equal triangles. Area = ½ × base × height.",
      whyEs:
        "Partan una galleta rectangular de esquina a esquina: dos triángulos iguales. Área = ½ × base × altura.",
    },
    {
      en: "A rectangle 6 by 4 has area 10.",
      es: "Un rectángulo de 6 por 4 tiene área 10.",
      answer: false,
      whyEn: "10 is the half-perimeter trap! Area multiplies: 6 × 4 = 24 square units.",
      whyEs:
        "¡10 es la trampa del semiperímetro! El área multiplica: 6 × 4 = 24 unidades cuadradas.",
    },
    {
      en: "Two rooms can have different shapes but the same area.",
      es: "Dos cuartos pueden tener formas diferentes y la misma área.",
      answer: true,
      whyEn: "A 6 × 4 room and an 8 × 3 room both cover 24 square units.",
      whyEs: "Un cuarto de 6 × 4 y uno de 8 × 3 cubren 24 unidades cuadradas cada uno.",
    },
  ],
  volume: [
    {
      en: "Volume is measured in cubic units.",
      es: "El volumen se mide en unidades cúbicas.",
      answer: true,
      whyEn: "Volume counts the unit cubes that FILL a box — three dimensions.",
      whyEs: "El volumen cuenta los cubos unitarios que LLENAN una caja: tres dimensiones.",
    },
    {
      en: "A taller box always holds more than a shorter box.",
      es: "Una caja más alta siempre cabe más que una más baja.",
      answer: false,
      whyEn:
        "A tall skinny box can lose to a short wide one — multiply all three dimensions and let the numbers decide.",
      whyEs:
        "Una caja alta y flaca puede perder contra una baja y ancha: multipliquen las tres dimensiones y que decidan los números.",
    },
    {
      en: "A box 2 × 3 × 4 holds 24 unit cubes.",
      es: "Una caja de 2 × 3 × 4 contiene 24 cubos unitarios.",
      answer: true,
      whyEn: "Bottom layer: 2 × 3 = 6 cubes. Four layers: 6 × 4 = 24.",
      whyEs: "Primera capa: 2 × 3 = 6 cubos. Cuatro capas: 6 × 4 = 24.",
    },
    {
      en: "Volume = length × width × height works even when an edge is a fraction like 1½.",
      es: "Volumen = largo × ancho × alto funciona aunque una arista sea una fracción como 1½.",
      answer: true,
      whyEn: "3 × 2 × 1½ = 9 cubic units — half-layers count as half.",
      whyEs: "3 × 2 × 1½ = 9 unidades cúbicas: las medias capas cuentan como mitad.",
    },
    {
      en: "Doubling every edge of a box doubles its volume.",
      es: "Duplicar cada arista de una caja duplica su volumen.",
      answer: false,
      whyEn: "It multiplies volume by 2 × 2 × 2 = 8! Try it: 1×1×1 = 1 but 2×2×2 = 8.",
      whyEs: "¡Multiplica el volumen por 2 × 2 × 2 = 8! Pruébenlo: 1×1×1 = 1 pero 2×2×2 = 8.",
    },
  ],
  "surface-area": [
    {
      en: "Surface area is the total area of ALL the faces of a solid.",
      es: "El área de superficie es el área total de TODAS las caras de un sólido.",
      answer: true,
      whyEn: "Unfold the box into its net and add up every face.",
      whyEs: "Desarmen la caja en su plantilla y sumen todas las caras.",
    },
    {
      en: "Surface area and volume measure the same thing.",
      es: "El área de superficie y el volumen miden lo mismo.",
      answer: false,
      whyEn:
        "Surface area is the wrapping paper (square units); volume is what fits inside (cubic units).",
      whyEs:
        "El área de superficie es el papel de regalo (unidades cuadradas); el volumen es lo que cabe adentro (unidades cúbicas).",
    },
    {
      en: "A rectangular box has 6 faces.",
      es: "Una caja rectangular tiene 6 caras.",
      answer: true,
      whyEn: "Top, bottom, front, back, and two sides — and they come in matching pairs.",
      whyEs: "Arriba, abajo, frente, atrás y dos lados: y vienen en pares gemelos.",
    },
    {
      en: "On a cube with edge 2, the total surface area is 24 square units.",
      es: "En un cubo de arista 2, el área de superficie total es 24 unidades cuadradas.",
      answer: true,
      whyEn: "Each face is 2 × 2 = 4, and there are 6 faces: 6 × 4 = 24.",
      whyEs: "Cada cara es 2 × 2 = 4, y hay 6 caras: 6 × 4 = 24.",
    },
    {
      en: "To wrap a gift you need to know its volume.",
      es: "Para envolver un regalo necesitas saber su volumen.",
      answer: false,
      whyEn:
        "Wrapping covers the OUTSIDE — that's surface area. Volume tells you what fits inside.",
      whyEs:
        "Envolver cubre el EXTERIOR: eso es área de superficie. El volumen dice qué cabe adentro.",
    },
  ],
  statistics: [
    {
      en: "A statistical question is one whose answers can vary.",
      es: "Una pregunta estadística es una cuyas respuestas pueden variar.",
      answer: true,
      whyEn: "'How old are the people in our building?' varies. 'How old am I?' has one answer.",
      whyEs:
        "'¿Cuántos años tienen los vecinos?' varía. '¿Cuántos años tengo?' tiene una sola respuesta.",
    },
    {
      en: "The median of 3, 5, 7 is 5.",
      es: "La mediana de 3, 5, 7 es 5.",
      answer: true,
      whyEn: "Line the data up in order; the median is the middle value.",
      whyEs: "Ordenen los datos; la mediana es el valor del medio.",
    },
    {
      en: "The mean and the median are always the same number.",
      es: "La media y la mediana siempre son el mismo número.",
      answer: false,
      whyEn: "For 1, 2, 9: median is 2, mean is 4. One big value drags the mean, not the median.",
      whyEs:
        "Para 1, 2, 9: la mediana es 2, la media es 4. Un valor grande arrastra la media, no la mediana.",
    },
    {
      en: "An outlier is a data value that sits far from the rest.",
      es: "Un valor atípico es un dato que queda lejos de los demás.",
      answer: true,
      whyEn: "Like one cousin who sleeps 12 hours in a family of 8-hour sleepers — it has a story!",
      whyEs: "Como un primo que duerme 12 horas en una familia que duerme 8: ¡tiene su historia!",
    },
    {
      en: "To find the median you must first put the data in order.",
      es: "Para hallar la mediana primero hay que ordenar los datos.",
      answer: true,
      whyEn: "The middle of an unordered list is meaningless — order first, then find the center.",
      whyEs:
        "El medio de una lista desordenada no significa nada: primero ordenar, luego buscar el centro.",
    },
  ],
  "number-line": [
    {
      en: "−7 is less than −2.",
      es: "−7 es menor que −2.",
      answer: true,
      whyEn: "On the number line −7 sits farther LEFT. Owing $7 is worse than owing $2!",
      whyEs: "En la recta, −7 está más a la IZQUIERDA. ¡Deber $7 es peor que deber $2!",
    },
    {
      en: "Only whole numbers belong on a number line.",
      es: "Solo los números enteros van en una recta numérica.",
      answer: false,
      whyEn: "Fractions and decimals have their own spots: −2.5 sits halfway between −2 and −3.",
      whyEs:
        "Las fracciones y los decimales tienen su propio lugar: −2.5 queda a la mitad entre −2 y −3.",
    },
    {
      en: "−4 and 4 are opposites.",
      es: "−4 y 4 son opuestos.",
      answer: true,
      whyEn: "Same distance from zero, opposite sides. Stand on the hallway number line and check!",
      whyEs:
        "Misma distancia del cero, lados opuestos. ¡Párense en la recta del pasillo y compruébenlo!",
    },
    {
      en: "Zero is a negative number.",
      es: "El cero es un número negativo.",
      answer: false,
      whyEn: "Zero is neither positive nor negative — it's the boundary between them.",
      whyEs: "El cero no es positivo ni negativo: es la frontera entre los dos.",
    },
    {
      en: "A bank account can hold a number below zero.",
      es: "Una cuenta bancaria puede tener un número bajo cero.",
      answer: true,
      whyEn: "Overdrawn by $3 is −3 — negative numbers describe owing, cold, and below sea level.",
      whyEs:
        "Un sobregiro de $3 es −3: los negativos describen deudas, frío y bajo el nivel del mar.",
    },
  ],
  "coordinate-plane": [
    {
      en: "(3, 2) and (2, 3) are the same point.",
      es: "(3, 2) y (2, 3) son el mismo punto.",
      answer: false,
      whyEn: "Order matters: (3, 2) is right 3 up 2; (2, 3) is right 2 up 3. Two different spots!",
      whyEs:
        "El orden importa: (3, 2) es 3 a la derecha y 2 arriba; (2, 3) es 2 a la derecha y 3 arriba. ¡Dos lugares distintos!",
    },
    {
      en: "The first number in an ordered pair tells you how far to move left or right.",
      es: "El primer número de un par ordenado dice cuánto moverse a la izquierda o derecha.",
      answer: true,
      whyEn: "x first (across), y second (up/down) — 'you crawl before you climb.'",
      whyEs: "Primero x (horizontal), luego y (vertical): 'primero caminas, luego subes'.",
    },
    {
      en: "(0, 0) is called the origin.",
      es: "(0, 0) se llama el origen.",
      answer: true,
      whyEn: "It's where the two axes cross — every trip starts there.",
      whyEs: "Es donde se cruzan los dos ejes: todo viaje empieza allí.",
    },
    {
      en: "(−1, 4) is in Quadrant IV.",
      es: "(−1, 4) está en el cuadrante IV.",
      answer: false,
      whyEn: "Negative x, positive y → Quadrant II (upper left). Quadrant IV is +x, −y.",
      whyEs: "x negativa, y positiva → cuadrante II (arriba a la izquierda). El IV es +x, −y.",
    },
    {
      en: "The four quadrants are numbered going counterclockwise.",
      es: "Los cuatro cuadrantes se numeran en sentido contrario a las manecillas.",
      answer: true,
      whyEn: "I (top right) → II (top left) → III (bottom left) → IV (bottom right).",
      whyEs:
        "I (arriba derecha) → II (arriba izquierda) → III (abajo izquierda) → IV (abajo derecha).",
    },
  ],
  fallback: [
    {
      en: "Estimating before you solve helps you catch mistakes.",
      es: "Estimar antes de resolver ayuda a detectar errores.",
      answer: true,
      whyEn: "If your estimate says 'about 20' and you get 200, something slipped.",
      whyEs: "Si la estimación dice 'como 20' y sale 200, algo falló.",
    },
    {
      en: "There is only one correct way to solve a math problem.",
      es: "Solo hay una forma correcta de resolver un problema de matemáticas.",
      answer: false,
      whyEn:
        "Draw it, build it, count up, use a rule — different roads to the same answer are the point of math talk!",
      whyEs:
        "Dibujar, construir, contar, usar una regla: distintos caminos a la misma respuesta. ¡De eso se trata hablar de matemáticas!",
    },
    {
      en: "10% of 200 is 20.",
      es: "El 10% de 200 es 20.",
      answer: true,
      whyEn: "10% means one tenth: 200 ÷ 10 = 20.",
      whyEs: "10% significa una décima parte: 200 ÷ 10 = 20.",
    },
    {
      en: "Making a mistake in math means you're bad at math.",
      es: "Equivocarse en matemáticas significa ser malo para las matemáticas.",
      answer: false,
      whyEn: "Mistakes are data! Finding and fixing them is how mathematicians actually work.",
      whyEs:
        "¡Los errores son información! Encontrarlos y corregirlos es como trabajan los matemáticos de verdad.",
    },
    {
      en: "Explaining your thinking out loud helps you understand it better.",
      es: "Explicar tu razonamiento en voz alta ayuda a entenderlo mejor.",
      answer: true,
      whyEn:
        "Teaching someone else is the strongest form of studying — that's why this homework asks families to talk.",
      whyEs:
        "Enseñar a otra persona es la forma más fuerte de estudiar: por eso esta tarea invita a conversar en familia.",
    },
  ],
};

/**
 * SORT IT! — tap a card, tap the bucket it belongs in. Two buckets, six cards,
 * authored per topic. Categorising is the reasoning the practice items rarely
 * ask for out loud, and it is the one game shape where a wrong answer teaches
 * something specific (each card carries its own why).
 */
const FAMILY_SORT_GAMES = {
  // 6.AT.1's whole skill: is this comparing two GROUPS, or a group to the TOTAL?
  "ratios-understand": {
    a: { en: "Part to PART", es: "Parte a PARTE" },
    b: { en: "Part to WHOLE", es: "Parte a TODO" },
    cards: [
      {
        t: "3 boys to 4 girls",
        bucket: 0,
        en: "Two groups compared with each other.",
        es: "Dos grupos comparados entre sí.",
      },
      {
        t: "3 boys out of 7 students",
        bucket: 1,
        en: "One group compared with the whole class.",
        es: "Un grupo comparado con toda la clase.",
      },
      {
        t: "2 cups juice to 5 cups water",
        bucket: 0,
        en: "Juice and water are both parts of the mix.",
        es: "El jugo y el agua son dos partes de la mezcla.",
      },
      {
        t: "2 cups juice in 7 cups of punch",
        bucket: 1,
        en: "Juice compared with all 7 cups of punch.",
        es: "El jugo comparado con las 7 tazas de ponche.",
      },
      {
        t: "5 red marbles to 3 blue marbles",
        bucket: 0,
        en: "Red and blue are two separate parts.",
        es: "Rojas y azules son dos partes distintas.",
      },
      {
        t: "5 red marbles out of 8 marbles",
        bucket: 1,
        en: "Red compared with every marble there is.",
        es: "Las rojas comparadas con todas las canicas.",
      },
    ],
  },
  // 6.AT.2 — spotting whether a rate has already been reduced to "for 1".
  "ratios-rate": {
    a: { en: "Already a rate for 1", es: "Ya es una tasa por 1" },
    b: { en: "NOT yet a rate for 1", es: "TODAVÍA no es tasa por 1" },
    cards: [
      { t: "55 miles per hour", bucket: 0, en: "Per ONE hour.", es: "Por UNA hora." },
      {
        t: "$12 for 4 tickets",
        bucket: 1,
        en: "Divide by 4 to get $3 per ticket.",
        es: "Divide entre 4 para obtener $3 por boleto.",
      },
      { t: "$3 per pound", bucket: 0, en: "Per ONE pound.", es: "Por UNA libra." },
      {
        t: "150 words in 5 minutes",
        bucket: 1,
        en: "Divide by 5 to get 30 words per minute.",
        es: "Divide entre 5 para obtener 30 palabras por minuto.",
      },
      {
        t: "9 miles each gallon",
        bucket: 0,
        en: "“Each” means per ONE.",
        es: "“Cada” significa por UNO.",
      },
      {
        t: "$20 for 8 gallons",
        bucket: 1,
        en: "Divide by 8 to get $2.50 per gallon.",
        es: "Divide entre 8 para obtener $2.50 por galón.",
      },
    ],
  },
  // 6.AT.4 — the same amount wearing three different costumes.
  percent: {
    a: { en: "Equal to 1/4", es: "Igual a 1/4" },
    b: { en: "NOT equal to 1/4", es: "NO es igual a 1/4" },
    cards: [
      { t: "25%", bucket: 0, en: "25 out of 100 = 1/4.", es: "25 de 100 = 1/4." },
      {
        t: "0.25",
        bucket: 0,
        en: "Twenty-five hundredths = 1/4.",
        es: "Veinticinco centésimas = 1/4.",
      },
      {
        t: "25 out of 100",
        bucket: 0,
        en: "That is what the word percent means.",
        es: "Eso es lo que significa la palabra por ciento.",
      },
      {
        t: "2.5%",
        bucket: 1,
        en: "2.5 out of 100 — that is 1/40, ten times smaller.",
        es: "2.5 de 100: eso es 1/40, diez veces más pequeño.",
      },
      {
        t: "1/40",
        bucket: 1,
        en: "Much smaller than one quarter.",
        es: "Mucho más pequeño que un cuarto.",
      },
      {
        t: "4%",
        bucket: 1,
        en: "That flips the fraction — 1/4 is 25%, not 4%.",
        es: "Eso invierte la fracción: 1/4 es 25%, no 4%.",
      },
    ],
  },
  ratios: {
    a: { en: "Equivalent to 2 : 3", es: "Equivale a 2 : 3" },
    b: { en: "NOT equivalent to 2 : 3", es: "NO equivale a 2 : 3" },
    cards: [
      { t: "4 : 6", bucket: 0, en: "Both parts times 2.", es: "Las dos partes por 2." },
      {
        t: "3 : 4",
        bucket: 1,
        en: "That is 2:3 with 1 ADDED to each part — adding breaks a ratio.",
        es: "Eso es 2:3 con 1 SUMADO a cada parte; sumar rompe la razón.",
      },
      { t: "6 : 9", bucket: 0, en: "Both parts times 3.", es: "Las dos partes por 3." },
      { t: "10 : 15", bucket: 0, en: "Both parts times 5.", es: "Las dos partes por 5." },
      {
        t: "3 : 2",
        bucket: 1,
        en: "Same numbers, opposite order — order matters in a ratio.",
        es: "Mismos números, orden opuesto: el orden importa en una razón.",
      },
      {
        t: "5 : 6",
        bucket: 1,
        en: "No single number multiplies 2:3 into 5:6.",
        es: "Ningún número multiplica 2:3 para dar 5:6.",
      },
    ],
  },
  fractions: {
    a: { en: "Answer is MORE than 4", es: "El resultado es MÁS de 4" },
    b: { en: "Answer is LESS than 4", es: "El resultado es MENOS de 4" },
    cards: [
      {
        t: "4 ÷ 1/2",
        bucket: 0,
        en: "8 — dividing by a half doubles.",
        es: "8: dividir entre un medio duplica.",
      },
      {
        t: "4 ÷ 2",
        bucket: 1,
        en: "2 — dividing by a number bigger than 1 shrinks.",
        es: "2: dividir entre un número mayor que 1 reduce.",
      },
      {
        t: "4 ÷ 1/4",
        bucket: 0,
        en: "16 — sixteen quarters fit in 4.",
        es: "16: dieciséis cuartos caben en 4.",
      },
      { t: "4 ÷ 4", bucket: 1, en: "1.", es: "1." },
      {
        t: "4 ÷ 1/3",
        bucket: 0,
        en: "12 — twelve thirds fit in 4.",
        es: "12: doce tercios caben en 4.",
      },
      { t: "4 ÷ 8", bucket: 1, en: "1/2.", es: "1/2." },
    ],
  },
  decimals: {
    a: { en: "Greater than 0.5", es: "Mayor que 0.5" },
    b: { en: "Less than 0.5", es: "Menor que 0.5" },
    cards: [
      {
        t: "0.35",
        bucket: 1,
        en: "35 hundredths is less than 50 hundredths.",
        es: "35 centésimas es menos que 50 centésimas.",
      },
      { t: "0.7", bucket: 0, en: "0.70 beats 0.50.", es: "0.70 es más que 0.50." },
      { t: "0.05", bucket: 1, en: "Only 5 hundredths.", es: "Solo 5 centésimas." },
      { t: "0.51", bucket: 0, en: "Just past a half.", es: "Apenas pasa la mitad." },
      {
        t: "0.499",
        bucket: 1,
        en: "Close, but still under a half.",
        es: "Cerca, pero todavía menos de la mitad.",
      },
      {
        t: "0.8",
        bucket: 0,
        en: "8 tenths is more than 5 tenths.",
        es: "8 décimas es más que 5 décimas.",
      },
    ],
  },
  division: {
    a: { en: "Divides evenly (no remainder)", es: "División exacta (sin residuo)" },
    b: { en: "Leaves a remainder", es: "Deja residuo" },
    cards: [
      { t: "84 ÷ 4", bucket: 0, en: "21 exactly.", es: "21 exacto." },
      { t: "75 ÷ 10", bucket: 1, en: "7 remainder 5.", es: "7 con residuo 5." },
      { t: "144 ÷ 12", bucket: 0, en: "12 exactly.", es: "12 exacto." },
      { t: "50 ÷ 8", bucket: 1, en: "6 remainder 2.", es: "6 con residuo 2." },
      { t: "600 ÷ 5", bucket: 0, en: "120 exactly.", es: "120 exacto." },
      { t: "29 ÷ 3", bucket: 1, en: "9 remainder 2.", es: "9 con residuo 2." },
    ],
  },
  factors: {
    a: { en: "Prime", es: "Primo" },
    b: { en: "Composite", es: "Compuesto" },
    cards: [
      { t: "13", bucket: 0, en: "Only 1 and 13 divide it.", es: "Solo 1 y 13 lo dividen." },
      { t: "21", bucket: 1, en: "3 × 7.", es: "3 × 7." },
      { t: "2", bucket: 0, en: "The only even prime.", es: "El único primo par." },
      {
        t: "51",
        bucket: 1,
        en: "3 × 17 — it looks prime but is not.",
        es: "3 × 17: parece primo pero no lo es.",
      },
      {
        t: "29",
        bucket: 0,
        en: "No factor below 6 divides it.",
        es: "Ningún factor menor que 6 lo divide.",
      },
      {
        t: "1",
        bucket: 1,
        en: "Trick card — 1 is NEITHER. It has one factor, and a prime needs two.",
        es: "Carta trampa: el 1 no es NINGUNO. Tiene un factor, y un primo necesita dos.",
      },
    ],
  },
  exponents: {
    a: { en: "Equals 16", es: "Es igual a 16" },
    b: { en: "Does NOT equal 16", es: "NO es igual a 16" },
    cards: [
      { t: "2⁴", bucket: 0, en: "2 × 2 × 2 × 2 = 16.", es: "2 × 2 × 2 × 2 = 16." },
      { t: "4²", bucket: 0, en: "4 × 4 = 16.", es: "4 × 4 = 16." },
      {
        t: "2 × 4",
        bucket: 1,
        en: "8 — this is the base-times-exponent trap.",
        es: "8: esta es la trampa de base por exponente.",
      },
      { t: "8²", bucket: 1, en: "64.", es: "64." },
      { t: "16¹", bucket: 0, en: "One copy of 16.", es: "Una copia de 16." },
      { t: "4 × 2", bucket: 1, en: "8, not 16.", es: "8, no 16." },
    ],
  },
  expressions: {
    a: { en: "Same as 3n", es: "Igual que 3n" },
    b: { en: "Different from 3n", es: "Diferente de 3n" },
    cards: [
      { t: "n + n + n", bucket: 0, en: "Three copies added.", es: "Tres copias sumadas." },
      { t: "n³", bucket: 1, en: "That is n × n × n.", es: "Eso es n × n × n." },
      {
        t: "n × 3",
        bucket: 0,
        en: "Order does not matter in multiplication.",
        es: "El orden no importa al multiplicar.",
      },
      { t: "3 + n", bucket: 1, en: "Adding 3, not tripling.", es: "Sumar 3, no triplicar." },
      { t: "n(3)", bucket: 0, en: "Also 3 times n.", es: "También 3 por n." },
      {
        t: "3ⁿ",
        bucket: 1,
        en: "3 multiplied by itself n times.",
        es: "3 multiplicado por sí mismo n veces.",
      },
    ],
  },
  equations: {
    a: { en: "x = 5 makes it TRUE", es: "x = 5 la hace VERDADERA" },
    b: { en: "x = 5 makes it FALSE", es: "x = 5 la hace FALSA" },
    cards: [
      { t: "x + 3 = 8", bucket: 0, en: "5 + 3 = 8. ✓", es: "5 + 3 = 8. ✓" },
      { t: "2x = 10", bucket: 0, en: "2 × 5 = 10. ✓", es: "2 × 5 = 10. ✓" },
      {
        t: "x − 1 = 6",
        bucket: 1,
        en: "5 − 1 = 4, not 6. (x = 7)",
        es: "5 − 1 = 4, no 6. (x = 7)",
      },
      { t: "x ÷ 5 = 1", bucket: 0, en: "5 ÷ 5 = 1. ✓", es: "5 ÷ 5 = 1. ✓" },
      {
        t: "3x = 12",
        bucket: 1,
        en: "3 × 5 = 15, not 12. (x = 4)",
        es: "3 × 5 = 15, no 12. (x = 4)",
      },
      { t: "x + 5 = 10", bucket: 0, en: "5 + 5 = 10. ✓", es: "5 + 5 = 10. ✓" },
    ],
  },
  inequalities: {
    a: { en: "8 is allowed", es: "El 8 sí se permite" },
    b: { en: "8 is NOT allowed", es: "El 8 NO se permite" },
    cards: [
      {
        t: "x > 8",
        bucket: 1,
        en: "Greater than 8 excludes 8 itself.",
        es: "Mayor que 8 excluye al propio 8.",
      },
      {
        t: "x ≥ 8",
        bucket: 0,
        en: "The line under the symbol includes 8.",
        es: "La rayita bajo el símbolo incluye al 8.",
      },
      { t: "x < 10", bucket: 0, en: "8 is under 10.", es: "8 es menor que 10." },
      { t: "x ≤ 7", bucket: 1, en: "8 is past the limit.", es: "8 pasa el límite." },
      { t: "x ≥ 9", bucket: 1, en: "8 falls short.", es: "8 no alcanza." },
      {
        t: "x ≤ 8",
        bucket: 0,
        en: "At most 8 includes exactly 8.",
        es: "Máximo 8 incluye exactamente 8.",
      },
    ],
  },
  properties: {
    a: { en: "Always equal", es: "Siempre iguales" },
    b: { en: "Not always equal", es: "No siempre iguales" },
    cards: [
      {
        t: "6 × 4  and  4 × 6",
        bucket: 0,
        en: "Commutative property of multiplication.",
        es: "Propiedad conmutativa de la multiplicación.",
      },
      {
        t: "10 − 3  and  3 − 10",
        bucket: 1,
        en: "7 and −7. Subtraction is not commutative.",
        es: "7 y −7. La resta no es conmutativa.",
      },
      {
        t: "2(5 + 1)  and  2×5 + 2×1",
        bucket: 0,
        en: "Distributive property.",
        es: "Propiedad distributiva.",
      },
      {
        t: "12 ÷ 4  and  4 ÷ 12",
        bucket: 1,
        en: "3 and 1/3. Division is not commutative.",
        es: "3 y 1/3. La división no es conmutativa.",
      },
      {
        t: "9 + 0  and  9",
        bucket: 0,
        en: "Identity property of addition.",
        es: "Propiedad de identidad de la suma.",
      },
      {
        t: "2 + (3 × 4)  and  (2 + 3) × 4",
        bucket: 1,
        en: "14 and 20 — order of operations matters.",
        es: "14 y 20: el orden de las operaciones importa.",
      },
    ],
  },
  area: {
    a: { en: "Measured in square units", es: "Se mide en unidades cuadradas" },
    b: { en: "NOT measured in square units", es: "NO se mide en unidades cuadradas" },
    cards: [
      {
        t: "Carpet for a floor",
        bucket: 0,
        en: "Covering a surface is area.",
        es: "Cubrir una superficie es área.",
      },
      {
        t: "Fence around a yard",
        bucket: 1,
        en: "Distance around is perimeter — plain units.",
        es: "La distancia alrededor es perímetro: unidades simples.",
      },
      {
        t: "Paint for one wall",
        bucket: 0,
        en: "Covering a surface again.",
        es: "Otra vez cubrir una superficie.",
      },
      {
        t: "Ribbon around a gift",
        bucket: 1,
        en: "A length, not a covering.",
        es: "Un largo, no una cobertura.",
      },
      {
        t: "Base × height of a parallelogram",
        bucket: 0,
        en: "Two lengths multiplied give square units.",
        es: "Dos largos multiplicados dan unidades cuadradas.",
      },
      {
        t: "How tall a triangle is",
        bucket: 1,
        en: "One measurement — a length.",
        es: "Una sola medida: un largo.",
      },
    ],
  },
  volume: {
    a: { en: "Volume (cubic units)", es: "Volumen (unidades cúbicas)" },
    b: { en: "Surface area (square units)", es: "Área de superficie (unidades cuadradas)" },
    cards: [
      {
        t: "Cereal that fits in the box",
        bucket: 0,
        en: "What fits inside is volume.",
        es: "Lo que cabe adentro es volumen.",
      },
      {
        t: "Wrapping paper for the box",
        bucket: 1,
        en: "Covering the outside.",
        es: "Cubrir el exterior.",
      },
      { t: "Water a fish tank holds", bucket: 0, en: "Filling a space.", es: "Llenar un espacio." },
      {
        t: "Glass to build the tank",
        bucket: 1,
        en: "The faces themselves.",
        es: "Las caras mismas.",
      },
      {
        t: "l × w × h",
        bucket: 0,
        en: "Three dimensions multiplied.",
        es: "Tres dimensiones multiplicadas.",
      },
      {
        t: "Adding up all 6 faces",
        bucket: 1,
        en: "That is surface area.",
        es: "Eso es área de superficie.",
      },
    ],
  },
  "surface-area": {
    a: { en: "Surface area", es: "Área de superficie" },
    b: { en: "Volume", es: "Volumen" },
    cards: [
      { t: "Paint the outside of a box", bucket: 0, en: "Covering faces.", es: "Cubrir caras." },
      {
        t: "Sand that fills a box",
        bucket: 1,
        en: "Filling the inside.",
        es: "Llenar el interior.",
      },
      {
        t: "Add the areas of all faces",
        bucket: 0,
        en: "The definition of surface area.",
        es: "La definición de área de superficie.",
      },
      {
        t: "Count the unit cubes inside",
        bucket: 1,
        en: "Counting the inside is volume.",
        es: "Contar el interior es volumen.",
      },
      {
        t: "Unfold the box into a net",
        bucket: 0,
        en: "A net shows every face to add.",
        es: "La plantilla muestra cada cara que se suma.",
      },
      {
        t: "Measured in cubic units",
        bucket: 1,
        en: "Cubic units always mean volume.",
        es: "Las unidades cúbicas siempre son volumen.",
      },
    ],
  },
  statistics: {
    a: { en: "Statistical question", es: "Pregunta estadística" },
    b: { en: "Not statistical", es: "No es estadística" },
    cards: [
      {
        t: "How tall are the students in my class?",
        bucket: 0,
        en: "Answers vary from person to person.",
        es: "Las respuestas varían de persona a persona.",
      },
      { t: "How tall am I?", bucket: 1, en: "One fixed answer.", es: "Una sola respuesta fija." },
      {
        t: "How many minutes do people sleep?",
        bucket: 0,
        en: "Varies across people.",
        es: "Varía entre personas.",
      },
      {
        t: "What is my shoe size?",
        bucket: 1,
        en: "One answer about one person.",
        es: "Una respuesta sobre una persona.",
      },
      {
        t: "How long is the bus ride for riders?",
        bucket: 0,
        en: "Different riders, different times.",
        es: "Distintos pasajeros, distintos tiempos.",
      },
      { t: "How many days are in June?", bucket: 1, en: "Always 30.", es: "Siempre 30." },
    ],
  },
  "number-line": {
    a: { en: "Greater than −3", es: "Mayor que −3" },
    b: { en: "Less than −3", es: "Menor que −3" },
    cards: [
      {
        t: "0",
        bucket: 0,
        en: "Zero is right of every negative.",
        es: "El cero está a la derecha de todo negativo.",
      },
      { t: "−7", bucket: 1, en: "Further left than −3.", es: "Más a la izquierda que −3." },
      { t: "−1", bucket: 0, en: "Closer to zero than −3 is.", es: "Más cerca de cero que −3." },
      { t: "−10", bucket: 1, en: "Much further left.", es: "Mucho más a la izquierda." },
      {
        t: "2",
        bucket: 0,
        en: "Positive beats any negative.",
        es: "Un positivo supera a cualquier negativo.",
      },
      {
        t: "−3.5",
        bucket: 1,
        en: "Half a step further left than −3.",
        es: "Medio paso más a la izquierda que −3.",
      },
    ],
  },
  "coordinate-plane": {
    a: { en: "Quadrant II (left, up)", es: "Cuadrante II (izquierda, arriba)" },
    b: { en: "Not in Quadrant II", es: "No está en el cuadrante II" },
    cards: [
      { t: "(−3, 5)", bucket: 0, en: "Negative x, positive y.", es: "x negativa, y positiva." },
      {
        t: "(3, 5)",
        bucket: 1,
        en: "Both positive — Quadrant I.",
        es: "Ambas positivas: cuadrante I.",
      },
      { t: "(−1, 2)", bucket: 0, en: "Left and up.", es: "Izquierda y arriba." },
      {
        t: "(−4, −2)",
        bucket: 1,
        en: "Both negative — Quadrant III.",
        es: "Ambas negativas: cuadrante III.",
      },
      { t: "(−6, 1)", bucket: 0, en: "Left and up again.", es: "Otra vez izquierda y arriba." },
      {
        t: "(2, −5)",
        bucket: 1,
        en: "Right and down — Quadrant IV.",
        es: "Derecha y abajo: cuadrante IV.",
      },
    ],
  },
  fallback: {
    a: { en: "Reasonable estimate", es: "Estimación razonable" },
    b: { en: "Not reasonable", es: "No es razonable" },
    cards: [
      {
        t: "A door is about 7 feet tall",
        bucket: 0,
        en: "About right for a doorway.",
        es: "Más o menos correcto para una puerta.",
      },
      {
        t: "A door is about 70 feet tall",
        bucket: 1,
        en: "That is a seven-story building.",
        es: "Eso es un edificio de siete pisos.",
      },
      {
        t: "A gallon of milk weighs about 8 lb",
        bucket: 0,
        en: "Close to real.",
        es: "Cerca de lo real.",
      },
      {
        t: "A pencil weighs about 5 lb",
        bucket: 1,
        en: "That is a bowling ball.",
        es: "Eso es una bola de boliche.",
      },
      {
        t: "A school bus holds about 50 riders",
        bucket: 0,
        en: "A believable capacity.",
        es: "Una capacidad creíble.",
      },
      {
        t: "A school bus holds about 5,000 riders",
        bucket: 1,
        en: "That is a stadium.",
        es: "Eso es un estadio.",
      },
    ],
  },
};

/**
 * WOULD YOU RATHER? — two defensible-sounding options, a family vote, then the
 * mathematics that settles it. There is no losing move: the point is that a
 * family argues about numbers for two minutes and then checks.
 */
const FAMILY_WYR = {
  "ratios-understand": [
    {
      a: {
        en: "Punch mixed 1 part syrup to 4 parts water",
        es: "Ponche de 1 parte de jarabe por 4 de agua",
      },
      b: {
        en: "Punch mixed 4 parts syrup to 1 part water",
        es: "Ponche de 4 partes de jarabe por 1 de agua",
      },
      en: "Same two numbers, opposite order — and 4:1 is far sweeter. Order is the whole point of a ratio.",
      es: "Los mismos dos números, en orden opuesto: 4:1 es mucho más dulce. El orden es lo esencial de una razón.",
    },
    {
      a: {
        en: "A class with a 1 : 4 teacher-to-student ratio",
        es: "Una clase con razón de 1 : 4 de maestro a estudiantes",
      },
      b: {
        en: "A class with a 1 : 30 teacher-to-student ratio",
        es: "Una clase con razón de 1 : 30 de maestro a estudiantes",
      },
      en: "1 : 4 means one teacher for every 4 students, so there is far more help to go around.",
      es: "1 : 4 significa un maestro por cada 4 estudiantes, así que hay mucha más ayuda disponible.",
    },
  ],
  "ratios-rate": [
    {
      a: { en: "8 oz of juice for $2.00", es: "8 oz de jugo por $2.00" },
      b: { en: "12 oz of juice for $2.70", es: "12 oz de jugo por $2.70" },
      en: "The 12 oz wins: 22.5¢ an ounce against 25¢ an ounce. Always compare the price for ONE.",
      es: "Gana la de 12 oz: 22.5¢ por onza contra 25¢ por onza. Siempre comparen el precio de UNA.",
    },
    {
      a: { en: "A job paying $45 for 5 hours", es: "Un trabajo que paga $45 por 5 horas" },
      b: { en: "A job paying $60 for 8 hours", es: "Un trabajo que paga $60 por 8 horas" },
      en: "The first: $9 an hour against $7.50 an hour. The bigger total is not the better rate.",
      es: "El primero: $9 por hora contra $7.50 por hora. El total mayor no es la mejor tasa.",
    },
  ],
  percent: [
    {
      a: { en: "25% off a $40 jacket", es: "25% de descuento en una chaqueta de $40" },
      b: { en: "$12 off a $40 jacket", es: "$12 de descuento en una chaqueta de $40" },
      en: "Take the $12. 25% of $40 is only $10 — a percent is worth whatever the whole is worth.",
      es: "Tomen los $12. El 25% de $40 son solo $10: un porcentaje vale según el total del que se saca.",
    },
    {
      a: { en: "A 10% raise on $500 a week", es: "Un aumento del 10% sobre $500 por semana" },
      b: { en: "A $40 raise on $500 a week", es: "Un aumento de $40 sobre $500 por semana" },
      en: "Take the 10% — that is $50, ten dollars more than the flat $40. Same idea, opposite answer.",
      es: "Tomen el 10%: son $50, diez dólares más que los $40 fijos. La misma idea, respuesta opuesta.",
    },
  ],
  ratios: [
    {
      a: { en: "A 12 oz drink for $3", es: "Una bebida de 12 oz por $3" },
      b: { en: "A 20 oz drink for $4", es: "Una bebida de 20 oz por $4" },
      en: "The 20 oz is the better buy: 20¢ per ounce beats 25¢ per ounce.",
      es: "La de 20 oz conviene más: 20¢ por onza contra 25¢ por onza.",
    },
    {
      a: { en: "Mix juice 2 parts to 3 parts water", es: "Mezclar jugo 2 partes por 3 de agua" },
      b: { en: "Mix juice 4 parts to 6 parts water", es: "Mezclar jugo 4 partes por 6 de agua" },
      en: "Trick question — they taste identical. 2:3 and 4:6 are equivalent ratios.",
      es: "Pregunta trampa: saben igual. 2:3 y 4:6 son razones equivalentes.",
    },
  ],
  fractions: [
    {
      a: { en: "Half of a large pizza", es: "La mitad de una pizza grande" },
      b: { en: "Three quarters of a small pizza", es: "Tres cuartos de una pizza pequeña" },
      en: "It depends on the whole! A fraction only means something next to the size it is a fraction OF.",
      es: "¡Depende del total! Una fracción solo significa algo junto al tamaño DEL que es fracción.",
    },
    {
      a: { en: "Split 4 candy bars among 8 people", es: "Repartir 4 barras entre 8 personas" },
      b: { en: "Split 3 candy bars among 6 people", es: "Repartir 3 barras entre 6 personas" },
      en: "Same share: both are 1/2 a bar each. 4÷8 = 3÷6 = 1/2.",
      es: "La misma porción: media barra cada quien. 4÷8 = 3÷6 = 1/2.",
    },
  ],
  decimals: [
    {
      a: { en: "Get $0.75 every day for a week", es: "Recibir $0.75 cada día por una semana" },
      b: { en: "Get $5.00 once", es: "Recibir $5.00 una sola vez" },
      en: "The daily deal wins: 7 × $0.75 = $5.25.",
      es: "Gana lo diario: 7 × $0.75 = $5.25.",
    },
    {
      a: { en: "A 0.5 lb slice of cake", es: "Una rebanada de 0.5 lb de pastel" },
      b: { en: "A 0.45 lb slice of cake", es: "Una rebanada de 0.45 lb de pastel" },
      en: "0.5 is bigger — 0.50 vs 0.45. More digits does not mean a bigger number.",
      es: "0.5 es mayor: 0.50 contra 0.45. Más dígitos no significa número más grande.",
    },
  ],
  division: [
    {
      a: {
        en: "Share 100 stickers among 8 friends",
        es: "Repartir 100 calcomanías entre 8 amigos",
      },
      b: { en: "Share 60 stickers among 5 friends", es: "Repartir 60 calcomanías entre 5 amigos" },
      en: "The second: 12 each, versus 12 each with 4 left over. Same share, cleaner split.",
      es: "La segunda: 12 para cada quien, contra 12 y sobran 4. Misma porción, reparto más limpio.",
    },
    {
      a: {
        en: "Ride in a van holding 7, with 50 people",
        es: "Ir en una van de 7, con 50 personas",
      },
      b: {
        en: "Ride in a van holding 9, with 50 people",
        es: "Ir en una van de 9, con 50 personas",
      },
      en: "The 9-seat van: 6 vans instead of 8. Both round UP — nobody rides in a fraction of a van.",
      es: "La van de 9: 6 vans en vez de 8. Las dos redondean HACIA ARRIBA: nadie viaja en una fracción de van.",
    },
  ],
  factors: [
    {
      a: { en: "Get $1 for every factor of 24", es: "Recibir $1 por cada factor de 24" },
      b: { en: "Get $1 for every factor of 30", es: "Recibir $1 por cada factor de 30" },
      en: "Tie! Both have 8 factors. 24: 1,2,3,4,6,8,12,24. 30: 1,2,3,5,6,10,15,30.",
      es: "¡Empate! Ambos tienen 8 factores. 24: 1,2,3,4,6,8,12,24. 30: 1,2,3,5,6,10,15,30.",
    },
    {
      a: { en: "Arrange 36 chairs in a rectangle", es: "Acomodar 36 sillas en rectángulo" },
      b: { en: "Arrange 37 chairs in a rectangle", es: "Acomodar 37 sillas en rectángulo" },
      en: "36 — it has 9 factors, so 9 arrangements. 37 is prime: one long row only.",
      es: "36: tiene 9 factores, así que 9 arreglos. 37 es primo: solo una fila larga.",
    },
  ],
  exponents: [
    {
      a: { en: "$100 today", es: "$100 hoy" },
      b: { en: "1¢ doubled every day for 3 weeks", es: "1¢ duplicado cada día por 3 semanas" },
      en: "Take the penny! Day 21 alone is 2²⁰ cents — over $10,000.",
      es: "¡Toma el centavo! Solo el día 21 son 2²⁰ centavos: más de $10,000.",
    },
    {
      a: { en: "Fold a paper 10 times", es: "Doblar un papel 10 veces" },
      b: { en: "Stack 100 sheets of paper", es: "Apilar 100 hojas de papel" },
      en: "Ten folds wins: 2¹⁰ = 1,024 layers.",
      es: "Ganan los diez dobleces: 2¹⁰ = 1,024 capas.",
    },
  ],
  expressions: [
    {
      a: { en: "Earn 5h dollars for h hours", es: "Ganar 5h dólares por h horas" },
      b: { en: "Earn h + 20 dollars for h hours", es: "Ganar h + 20 dólares por h horas" },
      en: "Depends on h! At h = 5 they tie at 25. Work fewer hours and the +20 wins; more and 5h does.",
      es: "¡Depende de h! En h = 5 empatan en 25. Con menos horas gana el +20; con más gana 5h.",
    },
    {
      a: { en: "3 pizzas at p dollars each", es: "3 pizzas a p dólares cada una" },
      b: { en: "p + p + p dollars", es: "p + p + p dólares" },
      en: "Identical — 3p and p + p + p are the same expression.",
      es: "Idénticas: 3p y p + p + p son la misma expresión.",
    },
  ],
  equations: [
    {
      a: { en: "Solve x + 17 = 42", es: "Resolver x + 17 = 42" },
      b: { en: "Solve 17x = 42", es: "Resolver 17x = 42" },
      en: "The first is friendlier: x = 25. The second gives a fraction, 42/17.",
      es: "La primera es más amable: x = 25. La segunda da una fracción, 42/17.",
    },
    {
      a: { en: "Save $3 a week toward $24", es: "Ahorrar $3 por semana para $24" },
      b: { en: "Save $4 a week toward $24", es: "Ahorrar $4 por semana para $24" },
      en: "$4 a week: 4w = 24 gives 6 weeks, versus 8 weeks at $3.",
      es: "$4 por semana: 4s = 24 da 6 semanas, contra 8 semanas con $3.",
    },
  ],
  inequalities: [
    {
      a: { en: "A ride needing h ≥ 48 inches", es: "Un juego que pide h ≥ 48 pulgadas" },
      b: { en: "A ride needing h > 48 inches", es: "Un juego que pide h > 48 pulgadas" },
      en: "The first, if you are exactly 48 inches — ≥ lets you on, > does not.",
      es: "El primero, si mides exactamente 48 pulgadas: ≥ te deja pasar, > no.",
    },
    {
      a: { en: "Spend at most $20", es: "Gastar máximo $20" },
      b: { en: "Spend less than $20", es: "Gastar menos de $20" },
      en: "'At most' (c ≤ 20) is better — it lets you spend exactly $20.",
      es: "'Máximo' (c ≤ 20) es mejor: te deja gastar exactamente $20.",
    },
  ],
  properties: [
    {
      a: { en: "Compute 4 × 99 the long way", es: "Calcular 4 × 99 a la larga" },
      b: { en: "Compute 4 × 100 − 4", es: "Calcular 4 × 100 − 4" },
      en: "The second — same answer (396) by the distributive property, and you can do it in your head.",
      es: "La segunda: misma respuesta (396) por la propiedad distributiva, y se hace mentalmente.",
    },
    {
      a: { en: "Buy 6 packs of 4 pens", es: "Comprar 6 paquetes de 4 plumas" },
      b: { en: "Buy 4 packs of 6 pens", es: "Comprar 4 paquetes de 6 plumas" },
      en: "Same 24 pens — the commutative property. Pick by price, not by count.",
      es: "Las mismas 24 plumas: propiedad conmutativa. Elijan por precio, no por cantidad.",
    },
  ],
  area: [
    {
      a: { en: "A 6 ft by 4 ft rug", es: "Un tapete de 6 pies por 4" },
      b: { en: "A 5 ft by 5 ft rug", es: "Un tapete de 5 pies por 5" },
      en: "The square one: 25 sq ft versus 24. Same perimeter, more floor covered.",
      es: "El cuadrado: 25 pies² contra 24. Mismo perímetro, más piso cubierto.",
    },
    {
      a: { en: "A triangle with base 10, height 4", es: "Un triángulo de base 10 y altura 4" },
      b: { en: "A rectangle 4 by 4", es: "Un rectángulo de 4 por 4" },
      en: "The triangle: ½ × 10 × 4 = 20 square units, against the rectangle's 16.",
      es: "El triángulo: ½ × 10 × 4 = 20 unidades cuadradas, contra 16 del rectángulo.",
    },
  ],
  volume: [
    {
      a: { en: "A box 2 × 3 × 6", es: "Una caja de 2 × 3 × 6" },
      b: { en: "A box 3 × 3 × 4", es: "Una caja de 3 × 3 × 4" },
      en: "Both hold 36 cubic units — different shapes, same volume.",
      es: "Ambas caben 36 unidades cúbicas: distinta forma, mismo volumen.",
    },
    {
      a: { en: "Double the height of a box", es: "Duplicar la altura de una caja" },
      b: { en: "Double every edge of a box", es: "Duplicar cada arista de una caja" },
      en: "Doubling every edge — that multiplies volume by 8, not 2.",
      es: "Duplicar cada arista: eso multiplica el volumen por 8, no por 2.",
    },
  ],
  "surface-area": [
    {
      a: { en: "Wrap a 2 × 2 × 2 cube", es: "Envolver un cubo de 2 × 2 × 2" },
      b: { en: "Wrap a 1 × 2 × 4 box", es: "Envolver una caja de 1 × 2 × 4" },
      en: "The cube needs less paper: 24 sq units versus 28 — and both hold the same 8 cubic units.",
      es: "El cubo necesita menos papel: 24 unidades² contra 28, y ambos caben lo mismo (8 unidades³).",
    },
    {
      a: { en: "Paint 5 faces of a cube", es: "Pintar 5 caras de un cubo" },
      b: { en: "Paint all 6 faces", es: "Pintar las 6 caras" },
      en: "Five, if it sits on the floor — the bottom face never shows. Real painters count that way.",
      es: "Cinco, si está en el piso: la cara de abajo no se ve. Los pintores de verdad cuentan así.",
    },
  ],
  statistics: [
    {
      a: { en: "Be judged on your MEAN score", es: "Que te evalúen por tu media" },
      b: { en: "Be judged on your MEDIAN score", es: "Que te evalúen por tu mediana" },
      en: "The median, if you had one terrible day — one low outlier drags the mean, not the median.",
      es: "La mediana, si tuviste un mal día: un valor atípico bajo arrastra la media, no la mediana.",
    },
    {
      a: { en: "Ask 5 people a survey question", es: "Preguntar a 5 personas" },
      b: { en: "Ask 500 people the same question", es: "Preguntar a 500 personas lo mismo" },
      en: "500 — more data means the shape of the answer is far more trustworthy.",
      es: "500: más datos hacen que la forma de la respuesta sea mucho más confiable.",
    },
  ],
  "number-line": [
    {
      a: { en: "Owe $5", es: "Deber $5" },
      b: { en: "Owe $12", es: "Deber $12" },
      en: "Owing $5 (−5) is better — it sits further right on the number line, closer to zero.",
      es: "Deber $5 (−5) es mejor: está más a la derecha en la recta, más cerca de cero.",
    },
    {
      a: { en: "A day at −2 °C", es: "Un día a −2 °C" },
      b: { en: "A day at 2 °C", es: "Un día a 2 °C" },
      en: "+2 °C is warmer. Both are 2 from zero — same absolute value, opposite directions.",
      es: "+2 °C es más cálido. Ambos están a 2 del cero: mismo valor absoluto, direcciones opuestas.",
    },
  ],
  "coordinate-plane": [
    {
      a: { en: "Meet a friend at (3, 4)", es: "Ver a un amigo en (3, 4)" },
      b: { en: "Meet a friend at (4, 3)", es: "Ver a un amigo en (4, 3)" },
      en: "Different corners! Order matters: (3,4) is right 3 up 4; (4,3) is right 4 up 3.",
      es: "¡Esquinas distintas! El orden importa: (3,4) es 3 a la derecha y 4 arriba; (4,3) al revés.",
    },
    {
      a: {
        en: "Give directions as 'go left a lot'",
        es: "Dar indicaciones como 've mucho a la izquierda'",
      },
      b: { en: "Give directions as (−6, 2)", es: "Dar indicaciones como (−6, 2)" },
      en: "Coordinates — that is the whole reason the plane exists: exactness.",
      es: "Las coordenadas: para eso existe el plano, para la exactitud.",
    },
  ],
  fallback: [
    {
      a: { en: "Get the answer fast and maybe wrong", es: "Tener la respuesta rápido y quizá mal" },
      b: { en: "Take twice as long and be sure", es: "Tardar el doble y estar seguro" },
      en: "In math class, being sure wins — checking is part of the work, not extra credit.",
      es: "En matemáticas gana estar seguro: comprobar es parte del trabajo, no crédito extra.",
    },
    {
      a: { en: "Explain how you solved it", es: "Explicar cómo lo resolviste" },
      b: { en: "Just write the answer", es: "Solo escribir la respuesta" },
      en: "Explaining — a student who can explain it can still do it next week.",
      es: "Explicar: quien puede explicarlo todavía puede hacerlo la próxima semana.",
    },
  ],
};

/**
 * The arcade's own lookup key, which is FINER than detectVisualTopic().
 *
 * detectVisualTopic answers "which picture does this lesson need", and one
 * picture legitimately serves a whole strand — every 6.AT standard except the
 * algebra ones resolves to "ratios". The games are a different question. The
 * arcade's lead says "four quick games about TONIGHT'S math", and one `ratios`
 * bank spanning 14 lessons across 6 standards and two units could not keep that
 * promise at either end: lesson 3-1 "Understand Ratios" — night one, where the
 * whole skill is writing a comparison in the named order — was handed a memory
 * pair for "1/2 as a percent → 50%" (Unit 4), a unit-rate pair, an equivalent-
 * ratio sorting game and a better-buy dilemma. Three of its four games were
 * mathematics the family had not been taught yet; the 4-x percent lessons got
 * the mirror image, a bank about 2:3 equivalence with percent in one card.
 *
 * So the games key off the STANDARD, and fall back to the visual topic for
 * every strand still served well by one bank. Kept deliberately separate from
 * detectVisualTopic: that function also drives the visual lab, the spotlight,
 * the misconception, the family activities and the external resources, and
 * splitting it would move all of them to chase a games defect.
 *
 * REACHING BACK is fine and reaching FORWARD is not — a game may use what the
 * family has already been taught, never what is still coming. That asymmetry is
 * what tools/validate-family-games.mjs enforces.
 */
// The same strand can contain different operations: these two banks deliberately
// override topic-wide fraction division and one-variable equation games.
FAMILY_GAME_PAIRS["fraction-multiply"] = [
  { a: "½ × 12", b: "6" },
  { a: "¾ × 20", b: "15" },
  { a: "⅔ × 12", b: "8" },
  { a: "⅗ × 20", b: "12" },
  { a: "6/5 × 20", b: "24" },
  { a: "5/3 × 12", b: "20" },
];
FAMILY_TF_QUESTIONS["fraction-multiply"] = [
  {
    en: "¾ of 20 is 15.",
    es: "¾ de 20 es 15.",
    answer: true,
    whyEn: "20 ÷ 4 × 3 = 15.",
    whyEs: "20 ÷ 4 × 3 = 15.",
  },
  {
    en: "Multiplying a positive number by 6/5 makes it larger.",
    es: "Multiplicar un número positivo por 6/5 lo aumenta.",
    answer: true,
    whyEn: "6/5 is greater than 1.",
    whyEs: "6/5 es mayor que 1.",
  },
  {
    en: "To find ⅔ of 12, divide by ⅔.",
    es: "Para hallar ⅔ de 12, divide entre ⅔.",
    answer: false,
    whyEn: "Multiply: ⅔ × 12 = 8.",
    whyEs: "Multiplica: ⅔ × 12 = 8.",
  },
  {
    en: "A fraction factor is always less than 1.",
    es: "Un factor fraccionario siempre es menor que 1.",
    answer: false,
    whyEn: "6/5 is a fraction greater than 1.",
    whyEs: "6/5 es una fracción mayor que 1.",
  },
];
FAMILY_SORT_GAMES["fraction-multiply"] = {
  a: { en: "Product less than 12", es: "Producto menor que 12" },
  b: { en: "Product greater than 12", es: "Producto mayor que 12" },
  cards: [
    ["½ × 12", 0],
    ["¾ × 12", 0],
    ["⅔ × 12", 0],
    ["3/2 × 12", 1],
    ["5/4 × 12", 1],
    ["4/3 × 12", 1],
  ].map(([t, bucket]) => ({
    t,
    bucket,
    en: bucket ? "The factor is greater than 1." : "The factor is between 0 and 1.",
    es: bucket ? "El factor es mayor que 1." : "El factor está entre 0 y 1.",
  })),
};
FAMILY_WYR["fraction-multiply"] = [
  {
    a: { en: "¾ of 20 tokens", es: "¾ de 20 fichas" },
    b: { en: "½ of 24 tokens", es: "½ de 24 fichas" },
    en: "The first gives 15; the second gives 12. Choose and explain with equal groups.",
    es: "La primera da 15; la segunda da 12. Elige y explica con grupos iguales.",
  },
  {
    a: { en: "6/5 of 10 tokens", es: "6/5 de 10 fichas" },
    b: { en: "⅔ of 15 tokens", es: "⅔ de 15 fichas" },
    en: "The first gives 12; the second gives 10. A factor above 1 can enlarge the starting amount.",
    es: "La primera da 12; la segunda da 10. Un factor mayor que 1 puede aumentar la cantidad inicial.",
  },
];
FAMILY_GAME_PAIRS["two-variables"] = [
  { a: "y=2x; x=1", b: "y=2" },
  { a: "y=2x; x=3", b: "y=6" },
  { a: "y=x+5; x=2", b: "y=7" },
  { a: "y=3x; x=4", b: "y=12" },
  { a: "y=2x+1; x=4", b: "y=9" },
  { a: "y=x+4; x=1", b: "y=5" },
];
FAMILY_TF_QUESTIONS["two-variables"] = [
  {
    en: "For y=3x, the pair (2,6) fits.",
    es: "Para y=3x, el par (2,6) cumple.",
    answer: true,
    whyEn: "6 = 3 × 2.",
    whyEs: "6 = 3 × 2.",
  },
  {
    en: "For y=x+4, doubling x always doubles y.",
    es: "Para y=x+4, duplicar x siempre duplica y.",
    answer: false,
    whyEn: "x=2 gives y=6; x=4 gives y=8, not 12.",
    whyEs: "x=2 da y=6; x=4 da y=8, no 12.",
  },
  {
    en: "An ordered pair records both an input and an output.",
    es: "Un par ordenado registra una entrada y una salida.",
    answer: true,
    whyEn: "(x,y) keeps the quantities in order.",
    whyEs: "(x,y) mantiene las cantidades en orden.",
  },
  {
    en: "For y=2x+1, input 3 gives output 6.",
    es: "Para y=2x+1, la entrada 3 da la salida 6.",
    answer: false,
    whyEn: "2 × 3 + 1 = 7.",
    whyEs: "2 × 3 + 1 = 7.",
  },
];
FAMILY_SORT_GAMES["two-variables"] = {
  a: { en: "Fits y=3x", es: "Cumple y=3x" },
  b: { en: "Does not fit y=3x", es: "No cumple y=3x" },
  cards: [
    ["(1,3)", 0],
    ["(2,6)", 0],
    ["(0,0)", 0],
    ["(3,6)", 1],
    ["(2,5)", 1],
    ["(4,7)", 1],
  ].map(([t, bucket]) => ({
    t,
    bucket,
    en: "Multiply the first coordinate by 3 and compare with the second.",
    es: "Multiplica la primera coordenada por 3 y compárala con la segunda.",
  })),
};
FAMILY_WYR["two-variables"] = [
  {
    a: { en: "Pay y=3x dollars for x rides", es: "Pagar y=3x dólares por x viajes" },
    b: { en: "Pay y=2x+5 dollars for x rides", es: "Pagar y=2x+5 dólares por x viajes" },
    en: "For 2 rides, A costs $6 and B costs $9. For 8 rides, A costs $24 and B costs $21. The better choice depends on x.",
    es: "Para 2 viajes, A cuesta $6 y B $9. Para 8 viajes, A cuesta $24 y B $21. La mejor opción depende de x.",
  },
];

const FAMILY_GAME_STANDARD_KEYS = {
  "6.AT.1": "ratios-understand",
  "6.AT.2": "ratios-rate",
  "6.AT.4": "percent",
};

export function familyGameKey(config) {
  const id = String(config.lessonId || config.id || "");
  if (id === "1-2") return "fraction-multiply";
  if (/^9-[1-4](?:-part2)?$/.test(id)) return "two-variables";
  const topic = detectVisualTopic(config);
  if (topic !== "ratios") return topic;
  return FAMILY_GAME_STANDARD_KEYS[String(config.standard || "")] || topic;
}

/* Resolution order is refined key -> visual topic -> fallback. Without the
   middle step a refined key missing from one of the four banks would drop that
   game to the generic bank instead of the strand's own, which is a worse answer
   than the bug being fixed. */
function pickBank(bank, key, topic) {
  return bank[key] || bank[topic] || bank.fallback;
}

function familySortGame(key, topic) {
  return pickBank(FAMILY_SORT_GAMES, key, topic);
}

function familyWyr(key, topic) {
  return pickBank(FAMILY_WYR, key, topic);
}

function familyGamePairs(key, topic) {
  return pickBank(FAMILY_GAME_PAIRS, key, topic).map((pair) => ({
    ...pair,
    aEs: FAMILY_PAIRS_ES[pair.a] || "",
    bEs: FAMILY_PAIRS_ES[pair.b] || "",
  }));
}

function familyTfQuestions(key, topic) {
  return pickBank(FAMILY_TF_QUESTIONS, key, topic);
}

/* Exported for tools/validate-family-games.mjs, which has to read the banks as
   DATA to ask which standards each one is authored for. It reads them here
   rather than keeping its own copy, because a copy drifts from the thing it is
   meant to be checking and then reports on a set nobody ships. */
export const FAMILY_GAME_BANKS = {
  pairs: FAMILY_GAME_PAIRS,
  tf: FAMILY_TF_QUESTIONS,
  sort: FAMILY_SORT_GAMES,
  wyr: FAMILY_WYR,
};

/**
 * The Family Game Break: Math Dominoes (pairs) + True/False Face-Off, rendered on
 * the Together tab. Data ships as a JSON island (window.__HW_FAMGAMES__, `<`
 * escaped) so the game logic in HOMEWORK_TABS_JS stays free of content.
 */
/**
 * THE FAMILY ARCADE — four games behind one picker, one visible at a time.
 * Stacked, four games made the Together tab a scroll; as an arcade they read
 * as a choice, which is what makes a family pick one. Every game is
 * collaborative, replayable and NEVER timed (site rule). Content ships as a
 * JSON island so the engines in HOMEWORK_TABS_JS stay free of mathematics.
 */
const ARCADE_GAMES = [
  { id: "domino", icon: "🧩", en: "Math Dominoes", es: "Dominó matemático" },
  { id: "tf", icon: "🎯", en: "True or False?", es: "¿Verdadero o falso?" },
  { id: "sort", icon: "🗂️", en: "Sort It!", es: "¡A clasificar!" },
  { id: "wyr", icon: "🤔", en: "Would You Rather?", es: "¿Qué prefieres?" },
  // The last two used to be whole tabs of their own ("Play" and "Arcade"), each
  // holding exactly one game. As tabs they read as two more required stops and
  // measured 454 and 374 characters — a tab bar entry apiece for one game. They
  // are games, so they belong in the arcade with the other four.
  { id: "quiz", icon: "⚡", en: "Quick Quiz", es: "Reto rápido" },
  { id: "full", icon: "🕹️", en: "Big Arcade", es: "Sala grande" },
];

export function renderFamilyGameBreak(key, extras = {}, topic = key) {
  const pairs = familyGamePairs(key, topic);
  const tf = familyTfQuestions(key, topic);
  const sort = familySortGame(key, topic);
  const wyr = familyWyr(key, topic);
  const payload = JSON.stringify({ pairs, tf, sort, wyr }).replace(/</g, "\\u003c");
  const games = ARCADE_GAMES.filter(
    (g) => (g.id !== "quiz" || extras.quizHtml) && (g.id !== "full" || extras.arcadeUrl),
  );

  const picker = games
    .map(
      (g, i) => `
        <button type="button" class="fam-arcade-chip${i === 0 ? " is-active" : ""}" data-arcade-game="${g.id}"
          ${act("showArcadeGame", g.id)} aria-pressed="${i === 0 ? "true" : "false"}">
          <span class="fam-arcade-chip-icon" aria-hidden="true">${g.icon}</span>
          <span class="lang-en">${g.en}</span><span class="lang-es" lang="es">${g.es}</span>
        </button>`,
    )
    .join("");

  return `
    <div class="fam-game-break card-ish" id="fam_game_break">
      <script>window.__HW_FAMGAMES__ = ${payload};</script>
      <div class="fam-game-head">
        <span class="fam-game-badge">🎮 FAMILY ARCADE / SALA DE JUEGOS EN FAMILIA</span>
        <p class="fam-game-lead">
          <span class="lang-en">Choose ONE game. Quick Quiz practices this lesson; the other games review related skills. Play together or solo, without a timer.</span>
          <span class="lang-es" lang="es">Elige UN juego. Reto rápido practica esta lección; los demás repasan temas relacionados. Juega acompañado o a solas, sin cronómetro.</span>
        </p>
        <div class="fam-arcade-picker" role="group" aria-label="Choose a game">${picker}</div>
      </div>

      <div class="fam-game-card" id="fam_domino_game" data-arcade-panel="domino">
        <div class="fam-game-card-head">
          <h3 class="fam-game-h3">🧩 <span class="lang-en">Math Dominoes: Build the Chain</span><span class="lang-es" lang="es">Dominó matemático: arma la cadena</span></h3>
          <button type="button" class="btn btn-sm btn-secondary" ${act("resetDominoGame")}>🔄 <span class="lang-en">New Chain</span><span class="lang-es" lang="es">Nueva cadena</span></button>
        </div>
        <p class="fam-game-sub">
          <span class="lang-en">Build a chain. The left side of each domino is the match for the problem on the end of the chain. Tap the domino that fits next.</span>
          <span class="lang-es" lang="es">Armen una cadena. El lado izquierdo de cada ficha es la pareja del problema al final de la cadena. Toquen la ficha que encaja.</span>
        </p>
${renderDominoDuo()}
        <div class="fam-dom-chain" id="fam_dom_chain" role="list" aria-label="Domino chain"></div>
        <p class="fam-dom-hint" id="fam_dom_hint" aria-live="polite"></p>
        <div class="fam-dom-tray" id="fam_dom_tray" role="group" aria-label="Dominoes to place"></div>
        <p class="fam-dom-status" id="fam_dom_status" aria-live="polite"></p>
        <p class="fam-dom-win" id="fam_dom_win" hidden>🎉 <span class="lang-en">Chain complete! The last problem links back to the first domino: a perfect loop.</span><span class="lang-es" lang="es">¡Cadena completa! El último problema conecta con la primera ficha: un círculo perfecto.</span></p>
      </div>

      <div class="fam-game-card" id="fam_tf_game" data-arcade-panel="tf" hidden>
        <div class="fam-game-card-head">
          <h3 class="fam-game-h3">🎯 <span class="lang-en">True or False? Family Face-Off</span><span class="lang-es" lang="es">¿Verdadero o falso? Duelo Familiar</span></h3>
          <button type="button" class="btn btn-sm btn-secondary" ${act("resetTfGame")}>🔄 <span class="lang-en">Play Again</span><span class="lang-es" lang="es">Jugar otra vez</span></button>
        </div>
        <p class="fam-game-sub">
          <span class="lang-en">Take turns — student answers one, then a family member answers the next. Watch for the trick statements!</span>
          <span class="lang-es" lang="es">Por turnos: el estudiante responde una y luego un familiar responde la siguiente. ¡Cuidado con las trampas!</span>
        </p>
        <div class="fam-tf-turn" id="fam_tf_turn" aria-live="polite"></div>
        <p class="fam-tf-statement" id="fam_tf_statement"></p>
        <div class="fam-tf-buttons">
          <button type="button" class="btn fam-tf-btn fam-tf-true" id="fam_tf_true_btn" ${act("answerTf", true)}>✓ <span class="lang-en">TRUE</span><span class="lang-es" lang="es">VERDADERO</span></button>
          <button type="button" class="btn fam-tf-btn fam-tf-false" id="fam_tf_false_btn" ${act("answerTf", false)}>✗ <span class="lang-en">FALSE</span><span class="lang-es" lang="es">FALSO</span></button>
        </div>
        <div class="fam-tf-feedback" id="fam_tf_feedback" hidden aria-live="polite">
          <p class="fam-tf-verdict" id="fam_tf_verdict"></p>
          <p class="fam-tf-why" id="fam_tf_why"></p>
          <button type="button" class="btn btn-primary btn-sm" id="fam_tf_next_btn" ${act("nextTf")}>➔ <span class="lang-en">Next statement</span><span class="lang-es" lang="es">Siguiente</span></button>
        </div>
        <p class="fam-tf-score" id="fam_tf_score" aria-live="polite"></p>
        <div class="fam-tf-done" id="fam_tf_done" hidden></div>
      </div>

      <div class="fam-game-card" id="fam_sort_game" data-arcade-panel="sort" hidden>
        <div class="fam-game-card-head">
          <h3 class="fam-game-h3">🗂️ <span class="lang-en">Sort It!</span><span class="lang-es" lang="es">¡A clasificar!</span></h3>
          <button type="button" class="btn btn-sm btn-secondary" ${act("resetSortGame")}>🔄 <span class="lang-en">Play Again</span><span class="lang-es" lang="es">Jugar otra vez</span></button>
        </div>
        <p class="fam-game-sub">
          <span class="lang-en">Tap a card, then tap the bin it belongs in. Talk it through before you tap!</span>
          <span class="lang-es" lang="es">Toquen una tarjeta y luego el cesto al que pertenece. ¡Conversen antes de tocar!</span>
        </p>
        <div class="fam-sort-cards" id="fam_sort_cards" role="group" aria-label="Cards to sort"></div>
        <div class="fam-sort-bins">
          <button type="button" class="fam-sort-bin" data-bin="0" ${act("dropSortCard", 0)}>
            <span class="fam-sort-bin-label" id="fam_sort_bin0"></span>
            <span class="fam-sort-bin-count" id="fam_sort_bin0_count">0</span>
          </button>
          <button type="button" class="fam-sort-bin" data-bin="1" ${act("dropSortCard", 1)}>
            <span class="fam-sort-bin-label" id="fam_sort_bin1"></span>
            <span class="fam-sort-bin-count" id="fam_sort_bin1_count">0</span>
          </button>
        </div>
        <p class="fam-sort-feedback" id="fam_sort_feedback" aria-live="polite"></p>
        <div class="fam-sort-done" id="fam_sort_done" hidden></div>
      </div>

      <div class="fam-game-card" id="fam_wyr_game" data-arcade-panel="wyr" hidden>
        <div class="fam-game-card-head">
          <h3 class="fam-game-h3">🤔 <span class="lang-en">Would You Rather?</span><span class="lang-es" lang="es">¿Qué prefieres?</span></h3>
          <button type="button" class="btn btn-sm btn-secondary" ${act("resetWyrGame")}>🔄 <span class="lang-en">Start Over</span><span class="lang-es" lang="es">Empezar de nuevo</span></button>
        </div>
        <p class="fam-game-sub">
          <span class="lang-en">Everyone votes and says WHY. Then tap to see what the math says — sometimes it is a tie!</span>
          <span class="lang-es" lang="es">Todos votan y dicen POR QUÉ. Luego toquen para ver qué dicen las matemáticas: ¡a veces es empate!</span>
        </p>
        <div class="fam-wyr-options">
          <button type="button" class="fam-wyr-option" id="fam_wyr_a" ${act("voteWyr", 0)}></button>
          <span class="fam-wyr-or" aria-hidden="true">OR</span>
          <button type="button" class="fam-wyr-option" id="fam_wyr_b" ${act("voteWyr", 1)}></button>
        </div>
        <div class="fam-wyr-reveal" id="fam_wyr_reveal" hidden aria-live="polite">
          <p class="fam-wyr-reveal-title">🔎 <span class="lang-en">What the math says</span><span class="lang-es" lang="es">Lo que dicen las matemáticas</span></p>
          <p class="fam-wyr-why" id="fam_wyr_why"></p>
          <button type="button" class="btn btn-primary btn-sm" id="fam_wyr_next" ${act("nextWyr")}>➔ <span class="lang-en">Next round</span><span class="lang-es" lang="es">Siguiente ronda</span></button>
        </div>
        <p class="fam-wyr-progress" id="fam_wyr_progress" aria-live="polite"></p>
      </div>
${
  extras.quizHtml
    ? `
      <div class="fam-game-card" id="fam_quiz_game" data-arcade-panel="quiz" hidden>
        <div class="fam-game-card-head">
          <h3 class="fam-game-h3">⚡ <span class="lang-en">Quick Quiz</span><span class="lang-es" lang="es">Reto rápido</span></h3>
          <button type="button" class="btn btn-sm btn-secondary" ${act("initHomeworkGame")}>🔄 <span class="lang-en">Play Again</span><span class="lang-es" lang="es">Jugar otra vez</span></button>
        </div>
        <p class="fam-game-sub">
          <span class="lang-en">Reinforce tonight's topic with a quick family game. You ask; your student decides!</span>
          <span class="lang-es" lang="es">Refuercen el tema de hoy con un juego rápido en familia. ¡Ustedes preguntan; su estudiante decide!</span>
        </p>
        ${extras.quizHtml}
      </div>`
    : ""
}${
  extras.arcadeUrl
    ? `
      <div class="fam-game-card" id="fam_full_game" data-arcade-panel="full" hidden>
        <div class="fam-game-card-head">
          <h3 class="fam-game-h3">🕹️ <span class="lang-en">Big Arcade</span><span class="lang-es" lang="es">Sala grande</span></h3>
          <a class="btn btn-sm btn-secondary" href="${esc(extras.arcadeUrl)}" target="_blank" rel="noopener">
            <span class="lang-en">↗ Full screen</span><span class="lang-es" lang="es">↗ Pantalla completa</span>
          </a>
        </div>
        <p class="fam-game-sub">
          <span class="lang-en">The bigger review game for tonight's lesson — sort, match and choose. A wrong answer gives a hint and lets your student try again. No timer.</span>
          <span class="lang-es" lang="es">El juego de repaso más grande para la lección de hoy — clasificar, emparejar y elegir. Si se equivocan, reciben una pista y lo intentan otra vez. Sin cronómetro.</span>
        </p>
        <div class="workbench-frame-wrap">
          <iframe class="arcade-frame" data-src="${esc(extras.arcadeUrl)}" title="Practice Arcade" loading="lazy"></iframe>
        </div>
      </div>`
    : ""
}
    </div>`;
}

export const MATH_TALK_QUESTIONS = [
  {
    qEn: "Can you show me how you see that in your work or a quick sketch?",
    qEs: "¿Puedes mostrarme cómo ves eso en tu trabajo o en un dibujo rápido?",
    followEn: "Follow-up: Point to where each number from the problem shows up.",
    followEs: "Seguimiento: Señala dónde aparece cada número del problema.",
  },
  {
    qEn: "What would happen if we doubled the numbers in this problem?",
    qEs: "¿Qué pasaría si duplicamos los números de este problema?",
    followEn: "Follow-up: Does the relationship stay the same or change?",
    followEs: "Seguimiento: ¿La relación se mantiene igual o cambia?",
  },
  {
    qEn: "What is another way we could solve or explain this together?",
    qEs: "¿De qué otra forma podríamos resolverlo o explicarlo juntos?",
    followEn: "Follow-up: Can we check it using multiplication, a tape diagram, or a number line?",
    followEs: "Seguimiento: ¿Podemos comprobarlo usando otra herramienta o modelo?",
  },
  {
    qEn: "How would you explain this step to a 5th grader who hasn't seen it yet?",
    qEs: "¿Cómo le explicarías este paso a un estudiante de 5.º grado?",
    followEn: "Follow-up: What vocabulary word makes the explanation clearest?",
    followEs: "Seguimiento: ¿Qué palabra de vocabulario hace más clara la explicación?",
  },
  {
    qEn: "What part of this problem feels familiar, and what part feels new?",
    qEs: "¿Qué parte de este problema se siente conocida y qué parte parece nueva?",
    followEn: "Follow-up: What skill from earlier this year helps us here?",
    followEs: "Seguimiento: ¿Qué habilidad aprendida antes nos ayuda aquí?",
  },
  {
    qEn: "Before we calculate, what is a reasonable estimate for the answer?",
    qEs: "¿Antes de calcular, cuál es una estimación razonable para la respuesta?",
    followEn: "Follow-up: Should the answer be bigger or smaller than the starting numbers?",
    followEs: "Seguimiento: ¿La respuesta debe ser mayor o menor que los números iniciales?",
  },
];

/**
 * The Skill Power-Up for a ratio-strand lesson, chosen by what the lesson
 * actually teaches rather than by the shared "ratios" topic. See ratioFocus()
 * in homework-alignment.mjs for why the topic alone is not enough.
 */
const RATIO_STRAND_POWER_UPS = {
  "unit-rate": {
    qEn: "A 12-pack of juice costs $6.00 and an 8-pack costs $4.40. Which is the better buy, and how do you know?",
    qEs: "Un paquete de 12 jugos cuesta $6.00 y uno de 8 cuesta $4.40. ¿Cuál conviene más y cómo lo sabes?",
    choices: [
      {
        en: "The 12-pack — $6.00 ÷ 12 = $0.50 each, and $4.40 ÷ 8 = $0.55 each",
        es: "El de 12 — $6.00 ÷ 12 = $0.50 cada uno, y $4.40 ÷ 8 = $0.55 cada uno",
      },
      {
        en: "The 8-pack — it costs less money in total ($4.40 < $6.00)",
        es: "El de 8 — cuesta menos dinero en total ($4.40 < $6.00)",
      },
      {
        en: "The 12-pack — it has more juices, so more is always the better buy",
        es: "El de 12 — trae más jugos, y más siempre conviene más",
      },
    ],
    correctIndex: 0,
    hintEn:
      "Divide the price by the number of items to get the price for ONE — then the smaller unit price wins.",
    hintEs:
      "Divide el precio entre la cantidad para obtener el precio de UNO — gana el precio unitario menor.",
  },
  percent: {
    qEn: "A jacket is $40 and is marked 25% off. How much do you SAVE?",
    qEs: "Una chaqueta cuesta $40 y tiene 25% de descuento. ¿Cuánto AHORRAS?",
    choices: [
      {
        en: "$10 — because 25% means 25 out of 100, and 1/4 of $40 is $10",
        es: "$10 — 25% es 25 de cada 100, y 1/4 de $40 es $10",
      },
      { en: "$25 — because the percent is 25", es: "$25 — porque el porcentaje es 25" },
      { en: "$15 — because $40 − 25 = $15", es: "$15 — porque $40 − 25 = $15" },
    ],
    correctIndex: 0,
    hintEn: "A percent is a rate out of 100 — it is a PART of the amount, never the amount itself.",
    hintEs:
      "Un porcentaje es una razón por cada 100 — es una PARTE de la cantidad, nunca la cantidad misma.",
  },
  convert: {
    qEn: "There are 3 feet in 1 yard. How many feet are in 7 yards?",
    qEs: "Hay 3 pies en 1 yarda. ¿Cuántos pies hay en 7 yardas?",
    choices: [
      {
        en: "21 feet — multiply by 3 because feet are smaller, so you need more of them",
        es: "21 pies — multiplica por 3 porque los pies son más pequeños, así que necesitas más",
      },
      { en: "About 2.3 feet — divide 7 by 3", es: "Unos 2.3 pies — divide 7 entre 3" },
      { en: "10 feet — add 3 to 7", es: "10 pies — suma 3 a 7" },
    ],
    correctIndex: 0,
    hintEn:
      "Going to a SMALLER unit means more of them, so multiply. Going to a bigger unit means fewer, so divide.",
    hintEs:
      "Ir a una unidad MÁS PEQUEÑA significa más unidades: multiplica. Ir a una más grande significa menos: divide.",
  },
};

const RATIO_STRAND_MISCONCEPTIONS = {
  "unit-rate": {
    trapEn: "Picking the cheaper TOTAL price instead of dividing to compare the price for one.",
    trapEs: "Elegir el precio TOTAL más bajo en lugar de dividir para comparar el precio de uno.",
    coachEn:
      "Ask: 'What does ONE of them cost in each deal? Which number do we divide by to find that?'",
    coachEs:
      "Pregunta: '¿Cuánto cuesta UNO en cada oferta? ¿Entre qué número dividimos para saberlo?'",
  },
  percent: {
    trapEn: "Treating the percent as an amount of money — reading 25% off $40 as $25 off.",
    trapEs: "Tratar el porcentaje como una cantidad de dinero — leer 25% de $40 como $25.",
    coachEn:
      "Ask: '25% of WHAT? A percent is always a part of some amount — which amount is it a part of here?'",
    coachEs:
      "Pregunta: '¿25% de QUÉ? Un porcentaje siempre es parte de una cantidad — ¿de cuál es parte aquí?'",
  },
  convert: {
    trapEn:
      "Multiplying when the new unit is bigger (or dividing when it is smaller), so the answer moves the wrong way.",
    trapEs:
      "Multiplicar cuando la nueva unidad es más grande (o dividir cuando es más pequeña), y el resultado va al revés.",
    coachEn:
      "Ask: 'Is the new unit bigger or smaller? Should our number end up bigger or smaller than we started?'",
    coachEs:
      "Pregunta: '¿La nueva unidad es más grande o más pequeña? ¿El número debe terminar mayor o menor?'",
  },
};

export function getTopicPowerUp(topic, config) {
  const own = config?.familyNotes?.corner?.powerUp;
  if (own?.qEn && Array.isArray(own.choices) && own.choices.length >= 3) return own;
  const exact = exactFamilyPowerUp(config || {});
  if (exact) return exact;
  const title = config?.title || "Tonight's Math";
  if (topic === "ratios") {
    const strand = RATIO_STRAND_POWER_UPS[ratioFocus(config)];
    if (strand) return strand;
  }
  const powerUps = {
    exponents: {
      qEn: "Which statement shows the true meaning of 4³?",
      qEs: "¿Cuál enunciado muestra el significado real de 4³?",
      choices: [
        {
          en: "4 × 4 × 4 = 64",
          es: "4 × 4 × 4 = 64",
        },
        {
          en: "4 × 3 = 12",
          es: "4 × 3 = 12",
        },
        { en: "4 + 4 + 4 = 12", es: "4 + 4 + 4 = 12" },
      ],
      correctIndex: 0,
      hintEn: "The exponent tells how many copies of the base multiply together!",
      hintEs: "¡El exponente dice cuántas copias de la base se multiplican juntas!",
    },
    ratios: {
      qEn: "If a recipe uses 2 cups of lemonade for every 3 cups of seltzer, which mixture tastes identical?",
      qEs: "Si una receta usa 2 tazas de limonada por cada 3 de agua con gas, ¿cuál mezcla sabe idéntica?",
      choices: [
        {
          en: "4 cups lemonade and 6 cups seltzer (scaled by ×2)",
          es: "4 de limonada y 6 de agua con gas (escalado ×2)",
        },
        {
          en: "4 cups lemonade and 5 cups seltzer (+2 to each)",
          es: "4 de limonada y 5 de agua con gas (+2 a cada una)",
        },
        {
          en: "3 cups lemonade and 2 cups seltzer (flipped ratio)",
          es: "3 de limonada y 2 de agua con gas (razón invertida)",
        },
      ],
      correctIndex: 0,
      hintEn: "Equivalent ratios multiply or divide BOTH parts by the exact same factor!",
      hintEs: "¡Las razones equivalentes multiplican o dividen AMBAS partes por el mismo factor!",
    },
    equations: {
      qEn: "To solve x + 7 = 15 while keeping the balance scale level, what must you do?",
      qEs: "Para resolver x + 7 = 15 manteniendo la balanza en equilibrio, ¿qué debes hacer?",
      choices: [
        {
          en: "Subtract 7 from both sides to get x = 8",
          es: "Restar 7 de ambos lados para obtener x = 8",
        },
        {
          en: "Add 7 to both sides to get x = 22",
          es: "Sumar 7 a ambos lados para obtener x = 22",
        },
        { en: "Multiply both sides by 7", es: "Multiplicar ambos lados por 7" },
      ],
      correctIndex: 0,
      hintEn: "Use the inverse operation on both sides to isolate the variable!",
      hintEs: "¡Usa la operación inversa en ambos lados para despejar la incógnita!",
    },
    inequalities: {
      qEn: "Which set of values makes the inequality m ≥ 6 true?",
      qEs: "¿Qué conjunto de valores hace verdadera la desigualdad m ≥ 6?",
      choices: [
        {
          en: "6, 7, 8, 12 (includes 6 because of 'greater than or equal to')",
          es: "6, 7, 8, 12 (incluye el 6 por ser 'mayor o igual que')",
        },
        { en: "7, 8, 9 only (6 is not allowed)", es: "Solo 7, 8, 9 (el 6 no se permite)" },
        {
          en: "1, 2, 3, 4, 5 (strictly less than 6)",
          es: "1, 2, 3, 4, 5 (estrictamente menores que 6)",
        },
      ],
      correctIndex: 0,
      hintEn: "The symbol ≥ has a solid bar underneath, meaning equal to 6 is included!",
      hintEs: "¡El símbolo ≥ tiene una línea abajo, lo que incluye el 6!",
    },
    expressions: {
      qEn: "Which expression is equivalent to 5(y + 3) using the distributive property?",
      qEs: "¿Qué expresión es equivalente a 5(y + 3) usando la propiedad distributiva?",
      choices: [
        {
          en: "5y + 15 (multiply 5 by y and 5 by 3)",
          es: "5y + 15 (multiplica 5 por y y 5 por 3)",
        },
        {
          en: "5y + 3 (multiply only the first term)",
          es: "5y + 3 (multiplica solo el primer término)",
        },
        { en: "y + 15 (forget the 5 on y)", es: "y + 15 (olvida el 5 en la y)" },
      ],
      correctIndex: 0,
      hintEn: "Distribute the outside number to EVERY term inside the parentheses!",
      hintEs: "¡Distribuye el número de afuera a CADA término dentro del paréntesis!",
    },
    statistics: {
      qEn: "What is the best way to describe the median of a data set?",
      qEs: "¿Cuál es la mejor manera de describir la mediana de un conjunto de datos?",
      choices: [
        {
          en: "The exact middle value when all numbers are ordered least to greatest",
          es: "El valor central exacto cuando los números están ordenados de menor a mayor",
        },
        {
          en: "The sum of all numbers divided by the count",
          es: "La suma de todos los números dividida entre el conteo",
        },
        {
          en: "The difference between maximum and minimum values",
          es: "La diferencia entre el valor máximo y el mínimo",
        },
      ],
      correctIndex: 0,
      hintEn: "Order the numbers first! The median splits the data into two equal halves.",
      hintEs: "¡Ordena los números primero! La mediana divide los datos en dos mitades iguales.",
    },
    "coordinate-plane": {
      qEn: "Starting at the origin (0, 0), where is the point (−3, 4) located?",
      qEs: "Empezando en el origen (0, 0), ¿dónde se ubica el punto (−3, 4)?",
      choices: [
        {
          en: "Left 3 units on the x-axis, then Up 4 units on the y-axis (Quadrant II)",
          es: "3 unidades a la izquierda en el eje x, luego 4 arriba en el eje y (Cuadrante II)",
        },
        {
          en: "Right 3 units on the x-axis, then Down 4 units on the y-axis",
          es: "3 unidades a la derecha en el eje x, luego 4 abajo en el eje y",
        },
        {
          en: "Up 3 units on the y-axis, then Left 4 units on the x-axis",
          es: "3 unidades arriba en el eje y, luego 4 a la izquierda en el eje x",
        },
      ],
      correctIndex: 0,
      hintEn: "(x, y): First move horizontally (x), then move vertically (y)!",
      hintEs: "(x, y): ¡Primero muévete en horizontal (x), luego en vertical (y)!",
    },
    "number-line": {
      qEn: "On a horizontal number line, which integer is farthest to the left?",
      qEs: "En una recta numérica horizontal, ¿qué entero está más a la izquierda?",
      choices: [
        {
          en: "−9 (farthest left, so smallest value)",
          es: "−9 (más a la izquierda, por tanto menor valor)",
        },
        { en: "−2 (closer to zero)", es: "−2 (más cerca de cero)" },
        { en: "0 (the center)", es: "0 (el centro)" },
      ],
      correctIndex: 0,
      hintEn: "The farther left a number sits on the number line, the smaller its value!",
      hintEs: "¡Cuanto más a la izquierda esté un número, menor es su valor!",
    },
    fractions: {
      qEn: "How many 1/4-cup scoops fit into 3/2 (1 1/2) cups of rice? (3/2 ÷ 1/4)",
      qEs: "¿Cuántas medidas de 1/4 caben en 3/2 (1 1/2) tazas de arroz? (3/2 ÷ 1/4)",
      choices: [
        { en: "6 scoops (3/2 × 4/1 = 12/2 = 6)", es: "6 medidas (3/2 × 4/1 = 12/2 = 6)" },
        {
          en: "3/8 scoop (multiplied without flipping)",
          es: "3/8 de medida (multiplicado sin invertir)",
        },
        { en: "2 scoops (subtracted denominators)", es: "2 medidas (restando denominadores)" },
      ],
      correctIndex: 0,
      hintEn:
        "Keep the first fraction, Change division to multiplication, Flip the second fraction!",
      hintEs: "¡Mantén la primera fracción, Cambia a multiplicación, Invierte la segunda!",
    },
    area: {
      qEn: "A rectangle has a base of 8 units and a height of 5 units. What is its area?",
      qEs: "Un rectángulo tiene base de 8 unidades y altura de 5 unidades. ¿Cuál es su área?",
      choices: [
        { en: "40 square units (base × height)", es: "40 unidades cuadradas (base × altura)" },
        { en: "26 units (perimeter: 8 + 5 + 8 + 5)", es: "26 unidades (perímetro: 8 + 5 + 8 + 5)" },
        {
          en: "20 square units (divided by 2 by mistake)",
          es: "20 unidades cuadradas (dividido entre 2 por error)",
        },
      ],
      correctIndex: 0,
      hintEn: "Area measures the flat square tiles that cover the surface: Base × Height!",
      hintEs: "¡El área mide las baldosas cuadradas que cubren la superficie: Base × Altura!",
    },
    volume: {
      qEn: "A box measures 4 cm by 3 cm by 5 cm. How many 1-cm unit cubes fill it completely?",
      qEs: "Una caja mide 4 cm por 3 cm por 5 cm. ¿Cuántos cubos de 1 cm la llenan por completo?",
      choices: [
        { en: "60 cubic cm (4 × 3 × 5)", es: "60 cm cúbicos (4 × 3 × 5)" },
        { en: "24 cubic cm (4 + 3 + 5 doubled)", es: "24 cm cúbicos (4 + 3 + 5 duplicado)" },
        { en: "12 cubic cm (bottom layer only)", es: "12 cm cúbicos (solo la capa del fondo)" },
      ],
      correctIndex: 0,
      hintEn: "Volume is the product of 3 dimensions: Length × Width × Height!",
      hintEs: "¡El volumen es el producto de 3 dimensiones: Largo × Ancho × Alto!",
    },
    "surface-area": {
      qEn: "When calculating the total surface area of a rectangular prism, what are you finding?",
      qEs: "Al calcular el área total de la superficie de un prisma rectangular, ¿qué estás hallando?",
      choices: [
        {
          en: "The sum of the areas of all 6 flat faces",
          es: "La suma de las áreas de las 6 caras planas",
        },
        {
          en: "The cubes packing the interior space",
          es: "Los cubos que llenan el espacio interior",
        },
        { en: "The length of the 12 edges", es: "La longitud de las 12 aristas" },
      ],
      correctIndex: 0,
      hintEn:
        "Think of unfolding the 3D cardboard box flat into a 2D net and finding each face's area!",
      hintEs:
        "¡Imagina desdoblar la caja de cartón 3D en una plantilla plana y hallar el área de cada cara!",
    },
    decimals: {
      qEn: "When adding 14.8 + 2.35, what is the crucial alignment rule?",
      qEs: "Al sumar 14.8 + 2.35, ¿cuál es la regla fundamental de alineación?",
      choices: [
        {
          en: "Line up the decimal points so tenths match tenths (14.80 + 2.35 = 17.15)",
          es: "Alinear los puntos decimales para que décimos coincidan con décimos (14.80 + 2.35 = 17.15)",
        },
        {
          en: "Line up digits to the right like whole numbers (giving 14.8 + 2.35 = 38.3)",
          es: "Alinear los dígitos a la derecha como números enteros",
        },
        {
          en: "Drop all decimal points before adding",
          es: "Eliminar los puntos decimales antes de sumar",
        },
      ],
      correctIndex: 0,
      hintEn: "Line up the decimal points vertically, and annex a placeholder zero if helpful!",
      hintEs: "¡Alinea los puntos decimales en columna vertical y añade ceros si te ayuda!",
    },
    factors: {
      qEn: "Which number is prime (having exactly two factors: 1 and itself)?",
      qEs: "¿Qué número es primo (tiene exactamente dos factores: el 1 y sí mismo)?",
      choices: [
        { en: "17 (only 1 × 17 = 17)", es: "17 (solo 1 × 17 = 17)" },
        { en: "9 (composite: 1, 3, 9)", es: "9 (compuesto: 1, 3, 9)" },
        { en: "15 (composite: 1, 3, 5, 15)", es: "15 (compuesto: 1, 3, 5, 15)" },
      ],
      correctIndex: 0,
      hintEn: "A prime number cannot be divided into equal groups other than 1 and itself!",
      hintEs: "¡Un número primo no se puede dividir en grupos iguales excepto entre 1 y sí mismo!",
    },
  };

  return (
    powerUps[topic] || {
      qEn: `What is the key mathematical focus of ${title}?`,
      qEs: `¿Cuál es el enfoque matemático clave de ${title}?`,
      choices: [
        {
          en: "Understand the visual model and reason step by step",
          es: "Comprender el modelo visual y razonar paso a paso",
        },
        {
          en: "Rush to guess the final answer without steps",
          es: "Adivinar la respuesta final sin pasos",
        },
        {
          en: "Ignore units and labels in the problem",
          es: "Ignorar las unidades y etiquetas del problema",
        },
      ],
      correctIndex: 0,
      hintEn: "Take your time to understand the big idea and visual model first!",
      hintEs: "¡Tómense su tiempo para entender la idea principal y el modelo visual primero!",
    }
  );
}

export function renderSkillPowerUp(config, topic = "expressions") {
  const powerUp = getTopicPowerUp(topic, config);
  const correctIdx = powerUp.correctIndex;
  return `
    <section class="guided-section card section-powerup" aria-label="Skill Power-Up Challenge">
      <div class="powerup-header">
        <div class="powerup-title-wrap">
          <span class="powerup-tag">⚡ <span class="lang-en">SKILL POWER-UP · OPTIONAL</span><span class="lang-es" lang="es">RETO DE PODER · OPCIONAL</span></span>
          <h3 class="powerup-question">
            <span class="lang-en">${esc(powerUp.qEn)}</span>
            <span class="lang-es" lang="es">${esc(powerUp.qEs)}</span>
          </h3>
        </div>
        <div class="powerup-badge-star" id="powerup_star_badge"><span class="lang-en">★ 1 Star</span><span class="lang-es" lang="es">★ 1 Estrella</span></div>
      </div>
      <div class="powerup-choices-grid" id="powerup_choices">
        ${powerUp.choices
          .map(
            (c, i) => `
          <button type="button" class="powerup-choice-btn" data-choice-idx="${i}" data-is-correct="${i === correctIdx ? "true" : "false"}"
            data-hint-en="${escAttr(powerUp.hintEn)}" data-hint-es="${escAttr(powerUp.hintEs)}"
            ${act("checkSkillPowerUp", EL, i, correctIdx)}>
            <span class="powerup-letter">${String.fromCharCode(65 + i)}</span>
            <span class="powerup-choice-text">
              <span class="lang-en">${esc(c.en)}</span>
              <span class="lang-es" lang="es">${esc(c.es)}</span>
            </span>
          </button>`,
          )
          .join("")}
      </div>
      <div class="powerup-feedback-box" id="powerup_feedback_box" hidden>
        <div class="powerup-feedback-content" id="powerup_feedback_content"></div>
      </div>
    </section>`;
}

export function renderVocabMatchChallenge(vocabList) {
  if (!Array.isArray(vocabList) || vocabList.length < 2) return "";
  const count = vocabList.length;
  const shuffledDefs = vocabList.map((v, idx) => ({
    term: v.term,
    termEs: v.termEs,
    definition: v.definition,
    definitionEs: v.definitionEs,
    origIdx: idx,
  }));
  if (shuffledDefs.length > 1) {
    const last = shuffledDefs.pop();
    shuffledDefs.unshift(last);
  }

  return `
    <div class="vocab-game-shell card-ish" id="vocab_match_shell" data-vocab-total="${count}">
      <div class="vocab-game-header">
        <div class="vocab-game-title">
          <span class="vocab-game-icon" aria-hidden="true">⚡</span>
          <div>
            <h3 class="vocab-game-h3">
              <span class="lang-en">Match the Words</span>
              <span class="lang-es" lang="es">Empareja las palabras</span>
            </h3>
            <p class="vocab-game-sub bilingual-block">
              <span class="lang-en">Tap a word on the left, then tap its matching definition on the right!</span>
              <span class="lang-es" lang="es">¡Toca una palabra a la izquierda y su significado a la derecha!</span>
            </p>
          </div>
        </div>
        <div class="vocab-game-status">
          <span class="vocab-game-counter">
            <span class="lang-en">Matched: </span><span class="lang-es" lang="es">Emparejadas: </span>
            <strong id="vocab_match_count">0</strong> / ${count}
          </span>
        </div>
      </div>
      <div class="vocab-match-board">
        <div class="vocab-match-col col-terms" aria-label="Vocabulary terms">
          ${vocabList
            .map(
              (v, i) => `
            <button type="button" class="vocab-match-chip chip-term" data-vocab-id="${i}" data-side="term" ${act("selectVocabMatchChip", EL)}>
              <span class="chip-label-en">${esc(v.term)}</span>
              ${v.termEs ? `<span class="chip-label-es" lang="es">${esc(v.termEs)}</span>` : ""}
            </button>`,
            )
            .join("")}
        </div>
        <div class="vocab-match-col col-defs" aria-label="Vocabulary definitions">
          ${shuffledDefs
            .map(
              (v) => `
            <button type="button" class="vocab-match-chip chip-def" data-vocab-id="${v.origIdx}" data-side="def" ${act("selectVocabMatchChip", EL)}>
              <span class="chip-label-en">${esc(v.definition)}</span>
              ${v.definitionEs ? `<span class="chip-label-es" lang="es">${esc(v.definitionEs)}</span>` : ""}
            </button>`,
            )
            .join("")}
        </div>
      </div>
      <div class="vocab-game-win" id="vocab_match_win" hidden>
        <div class="win-banner">
          <span class="win-emoji" aria-hidden="true">🎉</span>
          <div class="win-text">
            <strong><span class="lang-en">Vocab Master! All ${count} words matched!</span><span class="lang-es" lang="es">¡Maestro del Vocabulario! ¡Todas las palabras emparejadas!</span></strong>
            <p><span class="lang-en">Great job connecting the math vocabulary. Explore the flashcards below!</span><span class="lang-es" lang="es">Excelente conectando el vocabulario. ¡Exploren las tarjetas abajo!</span></p>
          </div>
          <button type="button" class="btn btn-sm btn-secondary" ${act("resetVocabMatchGame")}>
            <span class="lang-en">Play Again 🔄</span><span class="lang-es" lang="es">Jugar de nuevo 🔄</span>
          </button>
        </div>
      </div>
    </div>`;
}

/**
 * Word Quiz — the practice that sits between reading a card and matching long
 * definitions: a picture and one short meaning, three words to choose from.
 * Questions are built in the browser from a JSON island, so the page carries
 * the words once.
 */
export function renderVocabQuiz(vocabList, resolveVocabImage, vocabImageAlt) {
  if (!Array.isArray(vocabList) || vocabList.length < 2) return "";
  const items = vocabList.map((v) => ({
    term: v.term || "",
    termEs: v.termEs || v.term || "",
    def: v.definition || "",
    defEs: v.definitionEs || v.definition || "",
    img: resolveVocabImage(v.term || "", v.image) || "",
    alt: vocabImageAlt(v.term || "", v.definition || ""),
  }));
  const island = JSON.stringify(items).replace(/</g, "\\u003c");
  return `
    <div class="vocab-quiz card-ish" id="vocab_quiz">
      <h3 class="vq-title">🎯 <span class="lang-en">Word Quiz</span><span class="lang-es" lang="es">Prueba de palabras</span></h3>
      <div class="vq-stars" id="vocab_quiz_stars" aria-hidden="true"></div>
      <div id="vocab_quiz_play">
        <p class="vq-ask"><span class="lang-en">Which word fits?</span><span class="lang-es" lang="es">¿Qué palabra encaja?</span></p>
        <div class="vq-card">
          <img class="vq-img" id="vocab_quiz_img" alt="" width="200" height="150" hidden />
          <p class="vq-prompt" id="vocab_quiz_prompt"></p>
        </div>
        <div class="vq-choices" id="vocab_quiz_choices"></div>
        <p class="vq-feedback" id="vocab_quiz_feedback" role="status" aria-live="polite"></p>
        <button type="button" class="btn btn-primary vq-next" id="vocab_quiz_next" ${act("nextVocabQuiz")} hidden><span class="lang-en">Next ➔</span><span class="lang-es" lang="es">Siguiente ➔</span></button>
      </div>
      <div class="vq-done" id="vocab_quiz_done" hidden>
        <p class="vq-done-title">🎉 <span class="lang-en">Quiz done!</span><span class="lang-es" lang="es">¡Prueba terminada!</span></p>
        <p class="vq-done-score"><span class="lang-en">First-try stars:</span><span class="lang-es" lang="es">Estrellas al primer intento:</span> <strong id="vocab_quiz_score"></strong></p>
        <button type="button" class="btn btn-secondary" ${act("startVocabQuiz")}><span class="lang-en">Play again 🔄</span><span class="lang-es" lang="es">Jugar de nuevo 🔄</span></button>
      </div>
      <script type="application/json" id="vocab_quiz_data">${island}</script>
    </div>`;
}

export function renderWordsToKnow(vocabList, resolveVocabImage, vocabImageAlt) {
  if (!Array.isArray(vocabList) || vocabList.length === 0) return "";

  const hasVocabGame = vocabList.length >= 2;
  const quizHtml = hasVocabGame ? renderVocabQuiz(vocabList, resolveVocabImage, vocabImageAlt) : "";
  const matchHtml = hasVocabGame ? renderVocabMatchChallenge(vocabList) : "";

  return `
    <section class="guided-section card section-vocab vocab-section" aria-label="Words to know">
      <h2 class="section-title">📚 Words to know / Palabras clave</h2>
      <p class="vocab-family-note bilingual-block">
        <span class="lang-en">1. Tap a card to flip it. 2. Play the quiz. 3. Match the words.</span>
        <span class="lang-es" lang="es">1. Toca una tarjeta para voltearla. 2. Haz la prueba. 3. Empareja las palabras.</span>
      </p>
      <div class="vocab-container">
        ${vocabList
          .map((v, vIdx) => {
            const term = v.term || "";
            const termEs = v.termEs || "";
            const definition = v.definition || "";
            const definitionEs = v.definitionEs || "";
            const visual = v.visual || "";
            const imgSrc = resolveVocabImage(term, v.image);
            const imgAlt = vocabImageAlt(term, definition);
            return `
            <div class="vocab-card" id="vocab_card_${vIdx}" ${act("hwFlipCard")}>
              <div class="vocab-card-inner">
                <div class="vocab-card-front">
                  <div class="vocab-card-top-bar">
                    <button type="button" class="vocab-speak-btn" ${actOn("click", "speakMathWord", [term, termEs], { stop: true })} title="Listen / Escuchar" aria-label="Pronounce ${esc(term)}">🔊 <span class="vocab-btn-label lang-en">Listen</span><span class="vocab-btn-label lang-es" lang="es">Escuchar</span></button>
                  </div>
                  <div class="vocab-thumb-wrap">
                    <img class="vocab-thumb" src="${esc(imgSrc)}" alt="${esc(imgAlt)}" loading="lazy" width="260" height="195" />
                  </div>
                  <div class="vocab-front-body" tabindex="0" role="group" aria-label="${esc(term)}">
                    <h3 class="vocab-term term-text">
                      <span class="lang-en">${esc(term)}</span>
                      <span class="lang-es" lang="es">${esc(termEs || term)}</span>
                    </h3>
                    ${termEs ? `<p class="vocab-es" lang="es">${esc(termEs)}</p>` : ""}
                    ${visual ? `<div class="vocab-visual-hint">💡 ${esc(visual)}</div>` : ""}
                  </div>
                  <button type="button" class="flip-prompt" aria-expanded="false" ${actOn("click", "hwFlipCard", [], { stop: true })}>
                    <span class="flip-icon" aria-hidden="true">↻</span>
                    <span class="lang-en">Tap to see definition of ${esc(term)}</span>
                    <span class="lang-es" lang="es">Toca para ver la definición de ${esc(termEs || term)}</span>
                  </button>
                </div>
                <div class="vocab-card-back" inert>
                  <div class="vocab-back-header">
                    <span class="vocab-back-badge"><span class="lang-en">DEFINITION</span><span class="lang-es" lang="es">DEFINICIÓN</span></span>
                    <h4 class="vocab-back-term">
                      <span class="lang-en">${esc(term)}</span>
                      <span class="lang-es" lang="es">${esc(termEs || term)}</span>
                    </h4>
                    ${termEs ? `<p class="vocab-back-term-es" lang="es">${esc(termEs)}</p>` : ""}
                  </div>
                  <div class="vocab-back-content">
                    <p class="vocab-def">${esc(definition)}</p>
                    ${definitionEs ? `<p class="vocab-def-es" lang="es"><span class="lang-tag">ES</span> ${esc(definitionEs)}</p>` : ""}
                    ${visual ? `<div class="vocab-back-visual"><span class="vocab-visual-icon">📌</span> <span>${esc(visual)}</span></div>` : ""}
                  </div>
                  <div class="vocab-card-back-actions">
                    <button type="button" class="btn btn-sm vocab-btn-gotit" ${actOn("click", "markVocabCardKnown", [vIdx, true], { stop: true })}><span class="lang-en">Got it! 👍</span><span class="lang-es" lang="es">¡Lo sé! 👍</span></button>
                    <button type="button" class="btn btn-sm vocab-btn-review" ${actOn("click", "markVocabCardKnown", [vIdx, false], { stop: true })}><span class="lang-en">Review 🔄</span><span class="lang-es" lang="es">Repasar 🔄</span></button>
                  </div>
                  <button type="button" class="flip-back-prompt" ${actOn("click", "hwFlipCard", [], { stop: true })}>
                    <span class="lang-en">Tap anywhere to flip back <span aria-hidden="true">↺</span></span>
                    <span class="lang-es" lang="es">Toca para voltear <span aria-hidden="true">↺</span></span>
                  </button>
                </div>
              </div>
            </div>`;
          })
          .join("")}
      </div>
      ${quizHtml}
      ${matchHtml}
      <div class="tab-flow-nav">
        <button type="button" class="btn btn-primary flow-next-btn" ${act("goNextHomeworkStop", "words")}>
          <span class="lang-en">Continue ➔</span>
          <span class="lang-es" lang="es">Continuar ➔</span>
        </button>
      </div>
    </section>`;
}

function tabPanelAttrs(id, hidden = false) {
  return `class="tab-panel-inner" data-tab-panel="${id}" id="hw_panel_${id}" role="tabpanel"${hidden ? " hidden" : ""}`;
}

const WORKBENCH_TOOL_COPY = {
  fractions: {
    icon: "📏",
    en: "Fraction Strips",
    es: "Tiras de fracciones",
    actionEn: "Build and compare fraction pieces to represent tonight's question.",
    actionEs: "Construyan y comparen partes para representar la pregunta de hoy.",
  },
  coords: {
    icon: "🧭",
    en: "Coordinate Grid",
    es: "Cuadrícula de coordenadas",
    actionEn: "Plot ordered pairs on the same coordinate grid used in tonight's lesson.",
    actionEs: "Ubiquen pares ordenados en la cuadrícula de la lección de hoy.",
  },
  tapes: {
    icon: "📊",
    en: "Ratio Tape",
    es: "Cinta de razones",
    actionEn: "Scale both parts together to model tonight's equivalent-ratio work.",
    actionEs: "Escalen ambas partes juntas para modelar las razones equivalentes de hoy.",
  },
  decimals: {
    icon: "🔢",
    en: "Decimal Columns",
    es: "Columnas decimales",
    actionEn: "Line up place values for tonight's decimal addition and subtraction.",
    actionEs: "Alineen los valores posicionales para sumar y restar decimales hoy.",
  },
};

function workbenchSpec(config) {
  const id = homeworkWorkbenchTool(config);
  return id ? { id, ...WORKBENCH_TOOL_COPY[id] } : null;
}

export function renderLearnTab(
  config,
  visualLabHtml = "",
  workbenchHtml = "",
  mystery = null,
  caseFileHtml = "",
) {
  const learning = renderLearningTonight(config).replace(/<section[^>]*>|<\/section>/g, "");
  let concept = renderConceptExplainer(config).replace(/<section[^>]*>|<\/section>/g, "");
  const keyEn = keyIdea(config);
  const keyEs = keyIdeaEs(config);
  const topic = detectVisualTopic(config);
  const workbench = workbenchSpec(config);
  const powerUpHtml = renderSkillPowerUp(config, topic);
  const support = exactFamilySupport(config);
  const corner = config?.familyNotes?.corner;
  const spotlight = corner?.spotlight?.titleEn
    ? { icon: "🌎", ...corner.spotlight }
    : support
      ? {
          titleEn: support.titleEn,
          titleEs: support.titleEs,
          factEn: support.steps[0].en,
          factEs: support.steps[0].es,
          icon: "🏡",
        }
      : getRealWorldSpotlight(topic);
  const mis = getTopicMisconception(topic, config);

  // Add Listen button to the Big Idea title
  const listenBtn = ` <button type="button" class="btn-listen-concept" ${act("speakBigIdea", keyEn, keyEs)} title="Listen to Big Idea / Escuchar idea principal" aria-label="Listen to the big idea">🔊 <span class="lang-en">Listen</span><span class="lang-es" lang="es">Escuchar</span></button>`;
  // Inside the heading, not after it: as a sibling it landed in a band of dead
  // space under the title, and the Learn tab strips the <section> wrapper, so
  // there is no container left to position it against.
  if (config.familyBigIdeaFormat !== "simple-visual")
    concept = concept.replace(
      /(<h2[^>]*class="section-title"[^>]*>[\s\S]*?)(<\/h2>)/i,
      (_match, heading, close) => heading + listenBtn + close,
    );

  const spotlightHtml = `
    <div class="real-world-spotlight card-ish">
      <div class="spotlight-badge"><span class="spotlight-icon" aria-hidden="true">${spotlight.icon}</span> <span><span class="lang-en">WHY THIS MATTERS</span><span class="lang-es" lang="es">¿POR QUÉ IMPORTA?</span></span></div>
      <h3 class="spotlight-title">
        <span class="lang-en">${esc(spotlight.titleEn)}</span>
        <span class="lang-es" lang="es">${esc(spotlight.titleEs)}</span>
      </h3>
      <p class="spotlight-text bilingual-block">
        <span class="lang-en">${esc(spotlight.factEn)}</span>
        <span class="lang-es" lang="es">${esc(spotlight.factEs)}</span>
      </p>
    </div>`;

  const misconceptionHtml = `
    <div class="misconception-card card-ish">
      <div class="misconception-head">
        <span class="mis-icon" aria-hidden="true">⚠️</span>
        <div>
          <strong><span class="lang-en">Watch out:</span><span class="lang-es" lang="es">Cuidado con este error común:</span></strong>
          <p class="mis-trap">
            <span class="lang-en">${esc(mis.trapEn)}</span>
            <span class="lang-es" lang="es">${esc(mis.trapEs)}</span>
          </p>
        </div>
      </div>
      <div class="parent-coach-tip">
        <strong>💬 <span class="lang-en">Parent Coach Question:</span><span class="lang-es" lang="es">Pregunta de guía:</span></strong>
        <span class="lang-en">${esc(mis.coachEn)}</span>
        <span class="lang-es" lang="es">${esc(mis.coachEs)}</span>
      </div>
    </div>`;

  /* One drawer for the grown-up: the question to ask and the thing not to say stay
     visible in the summary line; the bridge from "how you learned it", why this
     matters and the common trap are one tap away. They used to be three separate
     blocks in three places on this stop. */
  const ask = familyGuidance(config).question;
  const askPreview = ask
    ? `<span class="lang-en">Ask: ${esc(ask.en)}</span><span class="lang-es" lang="es">Pregunta: ${esc(ask.es || ask.en)}</span>`
    : `<span class="lang-en">Questions to ask, what to avoid, and why this matters.</span><span class="lang-es" lang="es">Preguntas para hacer, qué evitar y por qué importa.</span>`;
  const parentDrawerHtml = `
    <details class="hw-grownup" id="hw_grownup">
      <summary>
        <span class="hw-grownup-icon" aria-hidden="true">👪</span>
        <span class="hw-grownup-text hw-stack">
          <strong class="hw-stack"><span class="lang-en">For the grown-up · 1 minute</span><span class="lang-es" lang="es">Para el adulto · 1 minuto</span></strong>
          <small class="hw-stack">${askPreview}</small>
        </span>
        <span class="hw-grownup-chev" aria-hidden="true">▾</span>
      </summary>
      <div class="hw-grownup-body">
        ${renderParentQuickCard(config)}
        ${spotlightHtml}
        ${misconceptionHtml}
      </div>
    </details>`;

  const workbenchLaunchHtml = workbench
    ? `<div class="workbench-quick-launch card-ish learn-extended-block">
        <div class="wb-launch-content">
          <span class="wb-launch-icon" aria-hidden="true">${workbench.icon}</span>
          <div class="wb-launch-text">
            <strong><span class="lang-en">Tonight's math tool: ${workbench.en}</span><span class="lang-es" lang="es">Herramienta de hoy: ${workbench.es}</span></strong>
            <p><span class="lang-en">${workbench.actionEn}</span><span class="lang-es" lang="es">${workbench.actionEs}</span></p>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-outline-primary wb-launch-btn" ${act("openWorkbench", workbench.id)}>
          <span class="lang-en">Open ${workbench.en} ➔</span>
          <span class="lang-es" lang="es">Abrir ${workbench.es} ➔</span>
        </button>
      </div>`
    : "";

  const bridge = bridgeOf(config?.familyNotes);
  /* The case opens Learn: one short story the tap-to-build model below will solve. A
     lesson may author its own `caseFile` in its sidecar; otherwise its corner mission is
     the case. Nothing is invented here. */
  const caseText = config.familyNotes?.caseFile?.en
    ? config.familyNotes.caseFile
    : familyGuidance(config).mission;
  /* One card per Learn block. The pager shows one card at a time (see initLearnCards);
     an empty block is dropped, so a card never shows a blank page. */
  const learnCard = (en, es, inner) =>
    `<section class="learn-card" data-card-en="${esc(en)}" data-card-es="${esc(es)}" >${inner}</section>`;
  const caseHtml = caseText?.en
    ? `<section class="hw-case" aria-labelledby="hw_case_kicker">
        <p class="hw-case-kicker" id="hw_case_kicker"><span class="lang-en">Tonight's case</span><span class="lang-es" lang="es">Caso de hoy</span></p>
        <p class="hw-case-text"><span class="lang-en">${esc(caseText.en)}</span><span class="lang-es" lang="es">${esc(caseText.es)}</span></p>
      </section>`
    : "";
  const planHtml = `${renderDinnerTalkCard(ask, topic)}
      ${renderStudentPathwayBar(topic, bridge)}
      ${renderConfidence("before")}
      ${renderMysteryChallenge(mystery)}`;
  const toolsHtml = `${workbenchLaunchHtml}
${workbenchHtml}
      <div class="learn-extended-block" id="hw_learn_quick">${parentDrawerHtml}${powerUpHtml}${renderLearnModules(config, config.lessonId || "")}</div>
${renderWarmupHuddle(confusedGrownUpCard(config))}
      <p class="tab-help-row learn-extended-block">${helpButton("💡 Need more help? / ¿Más ayuda?", { titleEn: "The big idea", titleEs: "La idea principal", en: keyEn, es: keyEs })}</p>`;
  return `
    <div ${tabPanelAttrs("learn")}>
      ${caseFileHtml}
      <nav class="learn-jump-row" aria-label="On this page / En esta página">
        <a href="#hw_dinner_talk"><span class="lang-en">60-Sec Talk</span><span class="lang-es" lang="es">Charla 60 s</span></a>
        <a href="#hw_learn_idea"><span class="lang-en">Big idea</span><span class="lang-es" lang="es">Idea principal</span></a>
        ${visualLabHtml.trim() ? '<a href="#hw_learn_try"><span class="lang-en">Touch &amp; try</span><span class="lang-es" lang="es">Toca y prueba</span></a>' : ""}
        <a href="#hw_learn_quick"><span class="lang-en">Quick question</span><span class="lang-es" lang="es">Pregunta rápida</span></a>
      </nav>
      ${learnCard("What we're learning", "Qué aprendemos", `<div class="learn-summary-block">${learning}</div>`)}
      ${learnCard("Tonight's case", "Caso de hoy", caseHtml)}
      ${learnCard("Build it", "Constrúyelo", `<div class="learn-extended-block" id="hw_learn_try">${visualLabHtml}</div>`)}
      ${learnCard("Tonight's plan", "Plan de hoy", planHtml)}
      ${learnCard("Big idea", "Idea principal", `<div class="learn-big-idea-block" id="hw_learn_idea">${concept}</div>`)}
      ${learnCard("Tools and quick question", "Herramientas y pregunta rápida", toolsHtml)}
      <div class="tab-flow-nav">
        <button type="button" class="btn btn-primary flow-next-btn" ${act("goNextHomeworkStop", "learn")}>
          <span class="lang-en">Continue ➔</span>
          <span class="lang-es" lang="es">Continuar ➔</span>
        </button>
      </div>
    </div>`;
}

export function renderWordsTab(vocabList, resolveVocabImage, vocabImageAlt) {
  const inner = renderWordsToKnow(vocabList, resolveVocabImage, vocabImageAlt);
  if (!inner) {
    return `<div ${tabPanelAttrs("words", true)}><p class="lang-en">No vocabulary listed for this lesson.</p><p class="lang-es" lang="es">No hay vocabulario listado para esta lección.</p></div>`;
  }
  return `<div ${tabPanelAttrs("words", true)}>${inner.replace(/<section[^>]*>|<\/section>/g, "")}</div>`;
}

export function renderCheckTab(
  quickCheckIntro,
  warmupHtml,
  challengeHtml = "",
  moreHtml = "",
  coreCount = 6,
  basicHtml = "",
  hasMystery = false,
) {
  const intro = quickCheckIntro.replace(/<section[^>]*>|<\/section>/g, "");

  /* The goal is the number of problems that are actually here. It used to read
     "Complete 3 problems" beside six problems, under a status bar counting
     "0 / 6" — so a family could finish the stated goal and still be told they
     were half done. */
  const starsBar = `
    <div class="hw-goal-card">
      ${renderGoalPips("")}
      <p>
        <span class="lang-en"><strong>Tonight's goal: any <span data-hw-goal-count>${Math.min(GOAL_TARGET, coreCount)}</span> problems.</strong> There are <span data-hw-goal-avail>${coreCount}</span> here, so pick the ones you like. Stop any time. Your work saves itself.</span>
        <span class="lang-es" lang="es"><strong>La meta de hoy: cualquier <span data-hw-goal-count>${Math.min(GOAL_TARGET, coreCount)}</span> problemas.</strong> Aquí hay <span data-hw-goal-avail>${coreCount}</span>, así que escojan los que prefieran. Pueden parar cuando quieran. El trabajo se guarda solo.</span>
      </p>
      <span class="hw-bonus" data-hw-bonus hidden>+<span data-hw-bonus-count>0</span> <span class="lang-en">bonus</span><span class="lang-es" lang="es">extra</span></span>
    </div>
    <div class="stars-milestone-chips" aria-hidden="true">
      ${basicHtml ? '<span class="star-chip">🧱 Basics</span>' : ""}
      <span class="star-chip">🌱 Warm-Up ★</span>
      <span class="star-chip">🚀 Level-Up ★★</span>
      <span class="star-chip">🏆 Victory ★★★</span>
    </div>`;

  const streakBanner = `
    <div class="live-streak-banner" id="hw_streak_banner" hidden>
      <span class="streak-flame" aria-hidden="true">🔥</span>
      <span class="streak-text">
        <span class="lang-en">Streak: <strong id="hw_streak_count">1</strong> in a row! Keep going!</span>
        <span class="lang-es" lang="es">¡Racha: <strong id="hw_streak_count_es">1</strong> seguidas! ¡Sigue así!</span>
      </span>
    </div>`;

  const scratchpadToggle = `
    <div class="scratchpad-inline-toggle">
      <button type="button" class="btn btn-sm btn-secondary scratchpad-toggle-btn" ${act("toggleScratchpad")}>
        ✏️ <span class="lang-en">Open scratchpad</span><span class="lang-es" lang="es">Abrir pizarra</span>
      </button>
    </div>`;

  const goalReachedBanner = `
    <div class="goal-reached-banner" id="goal_reached_banner" role="status" hidden>
      <span class="goal-icon" aria-hidden="true">🌟</span>
      <div class="goal-text">
        <strong><span class="lang-en">That's tonight's goal — done!</span><span class="lang-es" lang="es">¡Esa es la meta de hoy: completa!</span></strong>
        <p>${
          moreHtml
            ? `<span class="lang-en">Great work. Keep going with the extra practice if you want more, or head to <strong>Done</strong> to finish or choose optional extras.</span><span class="lang-es" lang="es">Buen trabajo. Sigan con la práctica extra si quieren más, o vayan a <strong>Listo</strong> para terminar o elegir extras opcionales.</span>`
            : `<span class="lang-en">Great work. Head to <strong>Done</strong> to finish or choose optional extras.</span><span class="lang-es" lang="es">Buen trabajo. Vayan a <strong>Listo</strong> para terminar o elegir extras opcionales.</span>`
        }</p>
      </div>
      <div class="goal-actions">
        ${
          hasMystery
            ? `<button type="button" class="btn btn-sm btn-secondary hw-banner-mystery" hidden ${act("hwOpenMystery")}><span class="lang-en">🔓 Open the mystery challenge</span><span class="lang-es" lang="es">🔓 Abrir el reto misterioso</span></button>`
            : ""
        }
        <button type="button" class="btn btn-sm btn-primary" ${act("switchHomeworkTab", "done")}>
          <span class="lang-en">Teach it back, then claim your certificate ➔</span><span class="lang-es" lang="es">Enséñalo y reclama tu certificado ➔</span>
        </button>
      </div>
    </div>`;

  const tierNo = (n) => (basicHtml ? n + 1 : n);
  const basicBlock = basicHtml
    ? `
      <section class="practice-tier practice-tier-basic" aria-label="Basic practice">
        <div class="practice-tier-head">
          <span class="practice-tier-badge tier-basic">1</span>
          <div class="practice-tier-titles">
            <h3 class="practice-tier-title">
              <span class="lang-en">🧱 Basic practice — build the skill</span>
              <span class="lang-es" lang="es">🧱 Práctica básica — construyan la destreza</span>
            </h3>
            <p class="practice-tier-sub bilingual-block">
              <span class="lang-en">Short, straightforward problems about tonight's skill. Do these first: quick reps make the harder ones easier.</span>
              <span class="lang-es" lang="es">Problemas cortos y directos sobre la destreza de hoy. Háganlos primero: repetir lo básico facilita los más difíciles.</span>
            </p>
          </div>
        </div>
        <section class="problems-container" aria-label="Basic practice problems">${basicHtml}</section>
      </section>`
    : "";

  const warmupBlock = warmupHtml
    ? `
      <section class="practice-tier practice-tier-warmup" aria-label="Warm-up practice">
        <div class="practice-tier-head">
          <span class="practice-tier-badge tier-warmup">${tierNo(1)}</span>
          <div class="practice-tier-titles">
            <h3 class="practice-tier-title">
              <span class="lang-en">🌱 Warm-up — start here</span>
              <span class="lang-es" lang="es">🌱 Calentamiento — empiecen aquí</span>
            </h3>
            <p class="practice-tier-sub bilingual-block">
              <span class="lang-en">Easier problems to practice the idea. Do these first together.</span>
              <span class="lang-es" lang="es">Problemas más fáciles para practicar la idea. Hagan estos primero juntos.</span>
            </p>
            <div class="parent-coach-prompt">
              <strong>💬 <span class="lang-en">Parent Coach:</span><span class="lang-es" lang="es">Guía para familias:</span></strong>
              <span class="lang-en">Ask: "What do you notice first about this problem? Can you draw or write the first step?"</span>
              <span class="lang-es" lang="es">Pregunta: "¿Qué notas primero sobre este problema? ¿Puedes dibujar o escribir el primer paso?"</span>
            </div>
          </div>
        </div>
        <section class="problems-container" aria-label="Warm-up problems">${warmupHtml}</section>
      </section>`
    : "";

  const challengeBlock = challengeHtml
    ? `
      <section class="practice-tier practice-tier-challenge" aria-label="Challenge practice">
        <div class="practice-tier-head">
          <span class="practice-tier-badge tier-challenge">${tierNo(2)}</span>
          <div class="practice-tier-titles">
            <h3 class="practice-tier-title">
              <span class="lang-en">🚀 Level up — a little harder</span>
              <span class="lang-es" lang="es">🚀 Sube de nivel — un poco más difícil</span>
            </h3>
            <p class="practice-tier-sub bilingual-block">
              <span class="lang-en">Try these once the warm-up feels easy. It's okay to use the steps and pictures.</span>
              <span class="lang-es" lang="es">Intenten estos cuando el calentamiento sea fácil. Está bien usar los pasos y los dibujos.</span>
            </p>
          </div>
        </div>
        <section class="problems-container" aria-label="Level-up problems">${challengeHtml}</section>
      </section>`
    : "";

  const more = moreHtml
    ? `
      <details class="more-practice">
        <summary>
          <span class="lang-en">➕ More practice — open for extra problems</span>
          <span class="lang-es" lang="es">➕ Más práctica — abre para más problemas</span>
        </summary>
        <p class="more-practice-note bilingual-block">
          <span class="lang-en">Optional. Only if your student wants more — these are bonus problems.</span>
          <span class="lang-es" lang="es">Opcional. Solo si tu estudiante quiere más — son problemas adicionales.</span>
        </p>
        <section class="problems-container more-practice-container" aria-label="More practice">${moreHtml}</section>
      </details>`
    : "";

  const flowNext = `
    <div class="tab-flow-nav">
      <button type="button" class="btn btn-primary flow-next-btn" ${act("goNextHomeworkStop", "check")}>
        <span class="lang-en">Continue ➔</span>
        <span class="lang-es" lang="es">Continuar ➔</span>
      </button>
    </div>`;

  return `
    <div ${tabPanelAttrs("check", true)}>
      ${intro}
      ${starsBar}
      ${streakBanner}
      ${scratchpadToggle}
      ${goalReachedBanner}
      ${basicBlock}
      ${warmupBlock}
      ${challengeBlock}
      ${renderQuickOptional()}
      ${more}
      ${flowNext}
    </div>`;
}

// Math Workbench tab — embeds the shared whiteboard so families can show their
/**
 * The manipulatives, as a drawer inside Together rather than a tab of their
 * own. They are a tool you reach for while working a problem, not a place you
 * travel to — and as tab 4 of 10 they sat between "Together" and "Check",
 * interrupting the one sequence the page is trying to get a family to walk.
 * Closed by default: a family that needs fraction strips opens them.
 */
export function renderWorkbenchTools(config) {
  const tool = workbenchSpec(config);
  if (!tool) return "";
  return `
    <details class="workbench-drawer" data-workbench-tool="${tool.id}">
      <summary class="workbench-drawer-summary">
        <span class="workbench-drawer-icon" aria-hidden="true">🧮</span>
        <span class="workbench-drawer-text">
          <strong><span class="lang-en">Need to build it? Open ${tool.en}</span><span class="lang-es" lang="es">¿Necesitan construirlo? Abran ${tool.es}</span></strong>
          <small><span class="lang-en">Only the tool for tonight's lesson is included.</span><span class="lang-es" lang="es">Solo se incluye la herramienta de la lección de hoy.</span></small>
        </span>
        <span class="workbench-drawer-chevron" aria-hidden="true">▾</span>
      </summary>
      <div class="workbench-drawer-body">

        <!-- Tool Selection Tabs -->
        <div class="wb-tool-bar" aria-label="Lesson math tool">
          ${
            tool.id === "fractions"
              ? `
          <button type="button" class="wb-tool-tab is-active" id="wb_tab_fractions" ${act("switchWorkbenchTool", "fractions")}>
            <span class="tool-icon">📏</span>
            <span class="tool-name"><span class="lang-en">Fraction Strips</span><span class="lang-es" lang="es">Fracciones</span></span>
          </button>`
              : ""
          }
          ${
            tool.id === "coords"
              ? `
          <button type="button" class="wb-tool-tab is-active" id="wb_tab_coords" ${act("switchWorkbenchTool", "coords")}>
            <span class="tool-icon">🧭</span>
            <span class="tool-name"><span class="lang-en">Coordinate Grid</span><span class="lang-es" lang="es">Coordenadas</span></span>
          </button>`
              : ""
          }
          ${
            tool.id === "tapes"
              ? `
          <button type="button" class="wb-tool-tab is-active" id="wb_tab_tapes" ${act("switchWorkbenchTool", "tapes")}>
            <span class="tool-icon">📊</span>
            <span class="tool-name"><span class="lang-en">Ratio Tape</span><span class="lang-es" lang="es">Cintas de razón</span></span>
          </button>`
              : ""
          }
          ${
            tool.id === "decimals"
              ? `
          <button type="button" class="wb-tool-tab is-active" id="wb_tab_decimals" ${act("switchWorkbenchTool", "decimals")}>
            <span class="tool-icon">🔢</span>
            <span class="tool-name"><span class="lang-en">Decimal Columns</span><span class="lang-es" lang="es">Columnas decimales</span></span>
          </button>`
              : ""
          }
        </div>

        <!-- Tool Stage -->
        <div class="wb-tool-stage card-ish">
          <!-- 1. Fraction Strips Tool -->
          ${
            tool.id === "fractions"
              ? `<div class="wb-panel" id="wb_panel_fractions">
            <div class="tool-controls-row">
              <span class="tool-hint"><span class="lang-en">Tap fraction tiles to add bars and compare lengths:</span><span class="lang-es" lang="es">Toca fichas para añadir barras y comparar longitudes:</span></span>
              <div class="fraction-button-group">
                <button type="button" class="btn btn-sm btn-outline-primary frac-add-btn" ${act("addFractionBar", 1)}>1</button>
                <button type="button" class="btn btn-sm btn-outline-primary frac-add-btn" ${act("addFractionBar", 2)}>1/2</button>
                <button type="button" class="btn btn-sm btn-outline-primary frac-add-btn" ${act("addFractionBar", 3)}>1/3</button>
                <button type="button" class="btn btn-sm btn-outline-primary frac-add-btn" ${act("addFractionBar", 4)}>1/4</button>
                <button type="button" class="btn btn-sm btn-outline-primary frac-add-btn" ${act("addFractionBar", 6)}>1/6</button>
                <button type="button" class="btn btn-sm btn-outline-primary frac-add-btn" ${act("addFractionBar", 8)}>1/8</button>
                <button type="button" class="btn btn-sm btn-outline-primary frac-add-btn" ${act("addFractionBar", 12)}>1/12</button>
                <button type="button" class="btn btn-sm btn-secondary" ${act("clearFractionBars")}>🗑️ <span class="lang-en">Clear</span><span class="lang-es" lang="es">Borrar</span></button>
              </div>
            </div>
            <div class="tool-presets-row">
              <span class="tool-presets-label"><span class="lang-en">⚡ Compare:</span><span class="lang-es" lang="es">⚡ Comparar:</span></span>
              <button type="button" class="wb-preset-btn" ${act("loadFractionComparison", "half")}><span class="lang-en">1/2 = 2/4</span><span class="lang-es" lang="es">1/2 = 2/4</span></button>
              <button type="button" class="wb-preset-btn" ${act("loadFractionComparison", "third")}><span class="lang-en">1/3 = 2/6</span><span class="lang-es" lang="es">1/3 = 2/6</span></button>
              <button type="button" class="wb-preset-btn" ${act("loadFractionComparison", "threefourths")}><span class="lang-en">3/4 = 6/8</span><span class="lang-es" lang="es">3/4 = 6/8</span></button>
            </div>
            <div class="fraction-stage-canvas" id="fraction_stage_canvas">
              <div class="fraction-row ref-row"><div class="frac-tile tile-1"><span class="lang-en">1 Whole (1.0)</span><span class="lang-es" lang="es">1 Entero (1.0)</span></div></div>
            </div>
          </div>`
              : ""
          }

          <!-- 2. Coordinate Grid Tool -->
          ${
            tool.id === "coords"
              ? `<div class="wb-panel" id="wb_panel_coords">
            <div class="tool-controls-row">
              <span class="tool-hint"><span class="lang-en">Click anywhere on the grid or tap a sample point:</span><span class="lang-es" lang="es">Haz clic en la cuadrícula o toca un punto de muestra:</span></span>
              <span class="coord-readout" id="coord_readout">(x: 0, y: 0) — <span class="lang-en">Origin</span><span class="lang-es" lang="es">Origen</span></span>
            </div>
            <div class="tool-presets-row">
              <span class="tool-presets-label"><span class="lang-en">⚡ Sample Points:</span><span class="lang-es" lang="es">⚡ Puntos muestra:</span></span>
              <button type="button" class="wb-preset-btn" ${act("plotCoordPoint", 3, 4)}><span class="lang-en">(3, 4) Quad I</span><span class="lang-es" lang="es">(3, 4) Cuad I</span></button>
              <button type="button" class="wb-preset-btn" ${act("plotCoordPoint", -3, 2)}><span class="lang-en">(-3, 2) Quad II</span><span class="lang-es" lang="es">(-3, 2) Cuad II</span></button>
              <button type="button" class="wb-preset-btn" ${act("plotCoordPoint", -4, -3)}><span class="lang-en">(-4, -3) Quad III</span><span class="lang-es" lang="es">(-4, -3) Cuad III</span></button>
              <button type="button" class="wb-preset-btn" ${act("plotCoordPoint", 4, -2)}><span class="lang-en">(4, -2) Quad IV</span><span class="lang-es" lang="es">(4, -2) Cuad IV</span></button>
              <button type="button" class="wb-preset-btn" ${act("plotCoordPoint", 0, 0)}><span class="lang-en">(0, 0) Origin</span><span class="lang-es" lang="es">(0, 0) Origen</span></button>
            </div>
            <div class="coord-canvas-wrap">
              <svg class="interactive-coord-svg u-bg-raised" id="interactive_coord_svg" viewBox="-120 -120 240 240" ${act("clickCoordGrid", EV)} style="width:100%;max-height:280px;"></svg>
            </div>
          </div>`
              : ""
          }

          <!-- 3. Ratio Tape Diagram Tool -->
          ${
            tool.id === "tapes"
              ? `<div class="wb-panel" id="wb_panel_tapes">
            <div class="tool-presets-row">
              <span class="tool-presets-label"><span class="lang-en">⚡ Quick Ratios:</span><span class="lang-es" lang="es">⚡ Razones rápidas:</span></span>
              <button type="button" class="wb-preset-btn" ${act("loadRatioPreset", 2, 3, 2)}><span class="lang-en">Paint (2 : 3 × 2)</span><span class="lang-es" lang="es">Pintura (2 : 3 × 2)</span></button>
              <button type="button" class="wb-preset-btn" ${act("loadRatioPreset", 1, 4, 3)}><span class="lang-en">Juice (1 : 4 × 3)</span><span class="lang-es" lang="es">Jugo (1 : 4 × 3)</span></button>
              <button type="button" class="wb-preset-btn" ${act("loadRatioPreset", 3, 5, 2)}><span class="lang-en">Recipe (3 : 5 × 2)</span><span class="lang-es" lang="es">Receta (3 : 5 × 2)</span></button>
            </div>
            <div class="tool-controls-row">
              <label class="tape-slider-label">
                <span class="lang-en">Part A (Blue):</span><span class="lang-es" lang="es">Parte A (Azul):</span>
                <input type="range" min="1" max="8" value="3" id="tape_slider_a" ${actOn("input", "updateTapeDiagram", [])} />
                <strong id="tape_val_a">3</strong>
              </label>
              <label class="tape-slider-label">
                <span class="lang-en">Part B (Coral):</span><span class="lang-es" lang="es">Parte B (Coral):</span>
                <input type="range" min="1" max="8" value="4" id="tape_slider_b" ${actOn("input", "updateTapeDiagram", [])} />
                <strong id="tape_val_b">4</strong>
              </label>
              <label class="tape-slider-label">
                <span class="lang-en">Scaling Factor:</span><span class="lang-es" lang="es">Factor de escala:</span>
                <input type="range" min="1" max="5" value="2" id="tape_slider_factor" ${actOn("input", "updateTapeDiagram", [])} />
                <strong id="tape_val_factor">×2</strong>
              </label>
            </div>
            <div class="tape-diagram-render" id="tape_diagram_render"></div>
          </div>`
              : ""
          }

          <!-- 4. Decimal Place Value Tool -->
          ${
            tool.id === "decimals"
              ? `<div class="wb-panel" id="wb_panel_decimals">
            <div class="tool-controls-row">
              <span class="tool-hint"><span class="lang-en">Type numbers to align decimal points vertically:</span><span class="lang-es" lang="es">Escribe números para alinear puntos decimales:</span></span>
            </div>
            <div class="tool-presets-row">
              <span class="tool-presets-label"><span class="lang-en">⚡ Examples:</span><span class="lang-es" lang="es">⚡ Ejemplos:</span></span>
              <button type="button" class="wb-preset-btn" ${act("loadDecimalPreset", "25.40", "8.75")}><span class="lang-en">Add: 25.40 + 8.75</span><span class="lang-es" lang="es">Suma: 25.40 + 8.75</span></button>
              <button type="button" class="wb-preset-btn" ${act("loadDecimalPreset", "14.50", "3.25")}><span class="lang-en">Money: $14.50 + $3.25</span><span class="lang-es" lang="es">Dinero: $14.50 + $3.25</span></button>
              <button type="button" class="wb-preset-btn" ${act("loadDecimalPreset", "12.08", "12.80")}><span class="lang-en">Compare: 12.08 vs 12.80</span><span class="lang-es" lang="es">Comparar: 12.08 vs 12.80</span></button>
            </div>
            <div class="decimal-place-grid">
              <table class="dec-grid-table">
                <thead>
                  <tr><th>Hundreds<br><small>Centenas</small></th><th>Tens<br><small>Decenas</small></th><th>Ones<br><small>Unidades</small></th><th class="dec-pt">.</th><th>Tenths<br><small>Décimos</small></th><th>Hundredths<br><small>Centésimos</small></th><th>Thousandths<br><small>Milésimos</small></th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><input type="text" maxlength="1" class="dg-cell" aria-label="Hundreds" data-aria-en="Hundreds" data-aria-es="Centenas" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" aria-label="Tens" data-aria-en="Tens" data-aria-es="Decenas" value="2" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" aria-label="Ones" data-aria-en="Ones" data-aria-es="Unidades" value="5" /></td>
                    <td class="dec-pt">.</td>
                    <td><input type="text" maxlength="1" class="dg-cell" aria-label="Tenths" data-aria-en="Tenths" data-aria-es="Décimos" value="4" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" aria-label="Hundredths" data-aria-en="Hundredths" data-aria-es="Centésimos" value="0" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" aria-label="Thousandths" data-aria-en="Thousandths" data-aria-es="Milésimos" /></td>
                  </tr>
                  <tr class="op-row">
                    <td><input type="text" maxlength="1" class="dg-cell" aria-label="Hundreds" data-aria-en="Hundreds" data-aria-es="Centenas" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" aria-label="Tens" data-aria-en="Tens" data-aria-es="Decenas" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" aria-label="Ones" data-aria-en="Ones" data-aria-es="Unidades" value="8" /></td>
                    <td class="dec-pt">.</td>
                    <td><input type="text" maxlength="1" class="dg-cell" aria-label="Tenths" data-aria-en="Tenths" data-aria-es="Décimos" value="7" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" aria-label="Hundredths" data-aria-en="Hundredths" data-aria-es="Centésimos" value="5" /></td>
                    <td><input type="text" maxlength="1" class="dg-cell" aria-label="Thousandths" data-aria-en="Thousandths" data-aria-es="Milésimos" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>`
              : ""
          }
        </div>

        <!-- Family Investigation Prompt -->
        <div class="family-workbench-investigation card-ish">
          <span class="investigation-icon" aria-hidden="true">💡</span>
          <div class="investigation-content">
            <strong><span class="lang-en">Family Investigation Challenge:</span><span class="lang-es" lang="es">Desafío de investigación familiar:</span></strong>
            <p><span class="lang-en">Use ${tool.en} to create one example together before solving the practice problems.</span><span class="lang-es" lang="es">Usen ${tool.es} para crear un ejemplo juntos antes de resolver los problemas.</span></p>
          </div>
        </div>
      </div>
    </details>`.replace(/^[ \t]+$/gm, "");
}

/** The body of the "Stuck?" drawer. No longer a tab — see renderHelpDrawer. */
export function renderHelpContent(config) {
  const stuck = renderStuckSection(config).replace(/<section[^>]*>|<\/section>/g, "");
  const tips = stuckTips(config);
  return `
      ${stuck}
      <div class="help-hub card-ish">
        <h3 class="section-title">💡 Quick help topics / Temas de ayuda</h3>
        <ul class="help-topic-list">
          ${tips.say
            .map(
              (t, i) =>
                `<li>${helpButton(`Tip ${i + 1} / Pista ${i + 1}`, { titleEn: "Try saying…", titleEs: "Intenta decir…", en: t.en, es: t.es })}</li>`,
            )
            .join("")}
        </ul>
      </div>`;
}

/**
 * The "learn more online" links, no longer a tab. They ride inside the Stuck?
 * drawer, because a family hunting for a Khan Academy video is a family that is
 * already stuck — and as tab 9 of 10 the paper-version download (the offline
 * path for a family with no device) was the single least discoverable thing on
 * the page.
 */
export function renderMoreContent(config, lessonId) {
  const links = getExternalResources(config, lessonId);
  // Every lesson with a homework page also ships a printable .docx, but nothing
  // linked to it — families without a device at home had no paper path.
  const docxHref = `/lessons/${lessonId}/homework.docx`;
  const hasDocx = existsSync(lessonPath(lessonId, "homework.docx"));
  const offlineCta = hasDocx
    ? `
        <a href="${esc(docxHref)}" download class="ai-lab-cta offline-cta">
          <span class="ai-lab-emoji" aria-hidden="true">🖨️</span>
          <span class="ai-lab-text">
            <span class="lang-en"><strong>No internet at home? Download the paper version</strong> — the same problems in a document you can print or open offline.</span>
            <span class="lang-es" lang="es"><strong>¿No hay internet en casa? Descarga la versión en papel</strong> — los mismos problemas en un documento que puedes imprimir o abrir sin conexión.</span>
          </span>
          <span class="ai-lab-arrow" aria-hidden="true">↓</span>
        </a>`
    : "";
  return `
      <section class="guided-section card section-more" aria-label="Learn more online">
        <h2 class="section-title">🌐 Learn more online / Aprende más en línea</h2>
        <a href="/curriculum/ai-hub/#students" target="_blank" rel="noopener" class="ai-lab-cta">
          <span class="ai-lab-emoji" aria-hidden="true">🤖</span>
          <span class="ai-lab-text">
            <span class="lang-en"><strong>Practice with the AI Learning Lab</strong> — your student can ask questions and get safe, step-by-step help on tonight's topic.</span>
            <span class="lang-es" lang="es"><strong>Practica con el Laboratorio de IA</strong> — tu estudiante puede hacer preguntas y recibir ayuda segura, paso a paso, sobre el tema de hoy.</span>
          </span>
          <span class="ai-lab-arrow" aria-hidden="true">→</span>
        </a>
${offlineCta}
${renderExternalResourcesSection(links)}
      </section>`;
}

/* The Confused Grown-Up reuses authored items, so prefer ones the Check stop is not already asking. */
function confusedGrownUpCard(config) {
  const { warmup, challenge } = selectTieredQuickCheckProblems(config.practice || {}, config);
  const asked = [...(config.familyNotes?.basicPractice || []), ...warmup, ...challenge].map(
    (p) => p.stem,
  );
  return renderConfusedGrownUp(confusedRoundsFor(config, new Set(asked)));
}

/**
 * The Play stop: every game in one arcade. This used to be three separate
 * tabs — a "Play" tab holding one quiz, an "Arcade" tab holding one iframe,
 * and four more games buried at the bottom of Together, where the two that a
 * family reached depended entirely on how far they had scrolled.
 */
export function renderPlayTabPanel(config, lessonId = "") {
  const game = buildHomeworkGame(config);
  const quizHtml = game ? game.html : "";
  const arcadeUrl = lessonId
    ? `/math/games/practice-arcade/?lesson=${encodeURIComponent(lessonId)}`
    : "";
  return `
    <div ${tabPanelAttrs("play", true)}>
      <h2 class="section-title">🎮 <span class="lang-en">Play</span><span class="lang-es" lang="es">Jugar</span></h2>
      <p class="bilingual-block play-intro">
        <span class="lang-en">Pick a game and play as a team. Nothing here is timed, and every game can be replayed as many times as you like.</span>
        <span class="lang-es" lang="es">Escojan un juego y jueguen en equipo. Nada aquí tiene cronómetro, y pueden repetir cada juego cuantas veces quieran.</span>
      </p>
      ${renderFamilyActivityCorner(config)}
      ${renderFamilyGameBreak(familyGameKey(config), { quizHtml, arcadeUrl }, detectVisualTopic(config))}
      <div class="tab-flow-nav">
        <button type="button" class="btn btn-primary flow-next-btn" ${act("goNextHomeworkStop", "play")}>
          <span class="lang-en">Continue ➔</span>
          <span class="lang-es" lang="es">Continuar ➔</span>
        </button>
      </div>
    </div>`;
}

/* Family Coach for one practice problem: three levels in order, each written for
   this problem (see familyCoachLevels in lib/homework-problems.mjs).
   Ask: a question for the grown-up that names the next move, never the answer.
   Show: the first representation or step, with the model when there is one.
   Explain: the worked explanation. It is locked until the family has made a real
   attempt (the page unlocks it; see unlockCoachExplain) and opens on one tap. */
export function renderProblemHintButton(_problem, _visual = "", coach = {}) {
  const levels = coach.levels;
  const ask = levels?.ask || { en: "", es: "" };
  const show = levels?.show || { en: "", es: "" };
  const explain = levels?.explain || { en: "", es: "" };
  const visual = coach.visualSvg
    ? `\n              <div class="coach-step-visual" style="margin:10px 0;">${coach.visualSvg}</div>`
    : "";
  const steps = [
    {
      labelEn: "Ask — a question for the grown-up",
      labelEs: "Pregunta — para el adulto",
      help: `<p class="lang-en">${esc(ask.en)}</p><p class="lang-es" lang="es">${esc(ask.es)}</p>`,
    },
    {
      labelEn: "Show — the first step",
      labelEs: "Muestra — el primer paso",
      help: `<p class="lang-en">${esc(show.en)}</p><p class="lang-es" lang="es">${esc(show.es)}</p>${visual}
              <button type="button" class="coach-scratchpad-btn" ${act("toggleScratchpad")}>✏️ <span class="lang-en">Try it on the scratchpad</span><span class="lang-es" lang="es">Pruébalo en la pizarra</span></button>`,
    },
    {
      labelEn: "Explain — the worked answer",
      labelEs: "Explica — la respuesta resuelta",
      locked: true,
      help: `<p class="lang-en">${esc(explain.en)}</p><p class="lang-es" lang="es">${esc(explain.es)}</p>`,
    },
  ];
  return `
    <details class="problem-coach-ladder" data-coach-levels>
      <summary>
        <span>🪜 <span class="lang-en">Family Coach: Ask, Show, Explain</span><span class="lang-es" lang="es">Guía familiar: Pregunta, Muestra, Explica</span></span>
        <small><span class="lang-en">Ask and Show anytime</span><span class="lang-es" lang="es">Pregunta y Muestra en cualquier momento</span></small>
      </summary>
      <ol class="coach-ladder-list">${steps
        .map(
          (step, index) => `
          <li class="coach-ladder-step${step.locked ? " coach-explain-step" : ""}">
            <button type="button" aria-expanded="false" ${act("revealCoachStep", EL)}${step.locked ? " data-coach-explain disabled" : ""}>
              <span class="coach-step-number">${index + 1}</span>
              <span class="lang-en">${esc(step.labelEn)}</span><span class="lang-es" lang="es">${esc(step.labelEs)}</span>
            </button>
            ${step.locked ? `<small class="coach-explain-lock" data-coach-lock><span class="lang-en">Make one try first. Explain opens after your first answer.</span><span class="lang-es" lang="es">Hagan un intento primero. Explica se abre después de la primera respuesta.</span></small>` : ""}
            <div class="coach-step-help" hidden>${step.help}</div>
          </li>`,
        )
        .join("")}
      </ol>
    </details>`;
}

/**
 * A one-card prompt for the kitchen table, English or Spanish, one click to switch.
 * Every word comes from the lesson's authored family guidance (the question to ask, the
 * household mission, the sentence starter); nothing here is invented, and it never prints
 * the exit ticket (validate:family-exit-ticket).
 */
export function renderFamilyConversationCard(config = null) {
  if (!config) return "";
  const { question, frame, mission } = familyGuidance(config);
  const pane = (lang) => {
    const es = lang === "es";
    const pick = (pair) => (es ? pair.es : pair.en);
    return `<div class="family-talk-pane" data-pane="${lang}" lang="${lang}"${es ? " hidden" : ""}>
        <h3 id="family_talk_title_${lang}">💬 ${es ? "Tarjeta de conversación familiar" : "Family Conversation Card"}</h3>
        <p class="ft-label">${es ? "Pregunten en la mesa" : "Ask at the table"}</p>
        <p class="ft-question">${esc(pick(question))}</p>
        <p class="ft-label">${es ? "Prueben juntos" : "Try it together"}</p>
        <p>${esc(pick(mission))}</p>
        <p class="ft-label">${es ? "Para empezar a hablar" : "To start talking"}</p>
        <p class="ft-frame">${esc(pick(frame))}</p>
      </div>`;
  };
  return `<section class="family-talk" data-family-talk aria-label="Family Conversation Card / Tarjeta de conversación familiar">
      <div class="family-talk-lang" role="group" aria-label="Language / Idioma">
        <button type="button" data-ft-lang="en" aria-pressed="true">EN</button>
        <button type="button" data-ft-lang="es" aria-pressed="false" lang="es">ES</button>
      </div>
      ${pane("en")}
      ${pane("es")}
    </section>`;
}

export function renderDoneTab(config = null, lessonId = "") {
  const inner = renderCelebration(config, lessonId)
    .replace(/^\s*<section[^>]*>/, "")
    .replace(/<\/section>\s*$/, "");
  return `<div ${tabPanelAttrs("done", true)}>${inner}${renderFamilyConversationCard(config)}</div>`;
}

export function renderPhotoboothTab(config = null, lessonId = "") {
  const displayId = displayLessonId(lessonId);
  const title = config?.familyNotes?.sessionTitle || config?.title || "Tonight's Math Work";

  const inner = `
    <section class="guided-section card section-photobooth" aria-label="Math Work Photobooth" data-pb-display-id="${escAttr(displayId)}" data-pb-lesson-line="${escAttr(`Lesson ${displayId}: ${title}`)}">
      <div class="photobooth-header">
        <div class="photobooth-badge">📸 <span class="lang-en">MATH WORK PHOTOBOOTH</span><span class="lang-es" lang="es">CABINA DE FOTOS DEL TRABAJO DE MATEMÁTICAS</span></div>
        <h2 class="section-title">
          <span class="lang-en">Celebrate &amp; Snap Your Math Work!</span>
          <span class="lang-es" lang="es">¡Celebra y toma foto de tu trabajo matemático!</span>
        </h2>
        <p class="photobooth-sub bilingual-block">
          <span class="lang-en">Use this as a photobooth for the work itself: point the camera at tonight's notebook page, the scratchpad or the whiteboard and take the picture — or pose holding it up. Choose a frame, add stickers, then download it, print it, or add it to your optional reflection. The photo is never uploaded; it stays on this device.</span>
          <span class="lang-es" lang="es">Úsenla como cabina de fotos del trabajo: apunten la cámara a la página del cuaderno, al borrador o a la pizarra y tomen la foto, o posen sosteniéndola. Elijan un marco, agreguen calcomanías y luego descárguenla, imprímanla o agréguenla a la reflexión opcional. La foto nunca se sube a internet; se queda en este dispositivo.</span>
        </p>
      </div>

      <div class="photobooth-container">
        <!-- Main Stage / Viewfinder -->
        <div class="pb-stage-wrap">
          <div class="pb-viewfinder card-ish" id="pb_viewfinder">
            <!-- Live Video -->
            <video id="pb_video" autoplay playsinline muted></video>
            
            <!-- Live Frame Overlay -->
            <div class="pb-frame-overlay frame-champion" id="pb_frame_overlay" hidden>
              <div class="pb-frame-header">
                <span class="pb-frame-badge">🏆 <span class="lang-en">MATH CHAMPION</span><span class="lang-es" lang="es">CAMPEÓN DE MATES</span></span>
                <span class="pb-frame-lesson">Lesson ${esc(displayId)}</span>
              </div>
              <div class="pb-frame-footer">
                <span class="pb-frame-title" id="pb_frame_title">${esc(title)}</span>
                <span class="pb-frame-date" id="pb_frame_date">Tonight</span>
              </div>
              <!-- Dynamic Stickers container on the frame -->
              <div class="pb-stickers-layer" id="pb_stickers_layer"></div>
            </div>

            <!-- Captured Preview Canvas & Img -->
            <canvas id="pb_canvas" hidden></canvas>
            <img id="pb_captured_img" alt="Captured math work" hidden />

            <!-- Visual Countdown Overlay -->
            <div class="pb-countdown-overlay" id="pb_countdown" hidden>3</div>

            <!-- Camera Flash Effect -->
            <div class="pb-flash-layer" id="pb_flash" hidden></div>

            <!-- Camera Permissions / Idle Placeholder -->
            <div class="pb-idle-placeholder" id="pb_idle_placeholder">
              <span class="pb-idle-icon" aria-hidden="true">📸</span>
              <p><strong><span class="lang-en">Camera Ready!</span><span class="lang-es" lang="es">¡Cámara lista!</span></strong></p>
              <p class="pb-idle-sub"><span class="lang-en">Tap &ldquo;Start Camera&rdquo; to photograph tonight&rsquo;s work, or use &ldquo;Upload Work&rdquo; below. The photo stays on this device.</span><span class="lang-es" lang="es">Toca &ldquo;Iniciar Cámara&rdquo; para fotografiar el trabajo de hoy, o usa &ldquo;Subir Foto&rdquo;. La foto se queda en este dispositivo.</span></p>
              <button type="button" class="btn btn-primary btn-lg" id="pb_start_btn" ${act("startPhotoboothCamera")}>
                📷 <span class="lang-en">Start Camera</span><span class="lang-es" lang="es">Iniciar Cámara</span>
              </button>
            </div>
          </div>

          <!-- Inline status: camera errors, save hints, attach confirmations.
               Never alert() — a blocked dialog strands the whole homework page. -->
          <p class="pb-status" id="pb_status" role="status" aria-live="polite" hidden></p>

          <!-- Photobooth Controls -->
          <div class="pb-controls-bar">
            <!-- Live Mode Actions -->
            <div class="pb-actions-live" id="pb_actions_live">
              <button type="button" class="btn btn-primary pb-btn-snap" id="pb_snap_btn" ${act("snapPhotoboothPicture")} disabled>
                📸 <span class="lang-en">Take Photo (3s Timer)</span><span class="lang-es" lang="es">Tomar Foto (3s)</span>
              </button>
              <button type="button" class="btn btn-secondary pb-btn-flip" id="pb_flip_btn" ${act("flipPhotoboothCamera")}>
                🔄 <span class="lang-en">Flip Camera</span><span class="lang-es" lang="es">Voltear Cámara</span>
              </button>
              <label class="btn btn-outline-secondary pb-btn-upload" title="Upload an existing photo of your notebook">
                📁 <span class="lang-en">Upload Work</span><span class="lang-es" lang="es">Subir Foto</span>
                <input type="file" id="pb_file_input" accept="image/*" capture="environment" ${actOn("change", "uploadPhotoboothImage", [EL])} style="display:none;" />
              </label>
            </div>

            <!-- Captured Mode Actions -->
            <div class="pb-actions-review" id="pb_actions_review" hidden>
              <button type="button" class="btn btn-secondary" ${act("retakePhotobooth")}>
                🔄 <span class="lang-en">Retake</span><span class="lang-es" lang="es">Repetir</span>
              </button>
              <a class="btn btn-success" id="pb_download_link" download="Math-Work-Photobooth.jpg">
                📥 <span class="lang-en">Download Photo</span><span class="lang-es" lang="es">Descargar Foto</span>
              </a>
              <button type="button" class="btn btn-primary" ${act("printPhotoboothPhoto")}>
                🖨️ <span class="lang-en">Print Photo</span><span class="lang-es" lang="es">Imprimir Foto</span>
              </button>
              <button type="button" class="btn btn-warning" id="pb_attach_btn" ${act("attachPhotoboothToSignoff")}>
                📎 <span class="lang-en">Add to optional reflection</span><span class="lang-es" lang="es">Añadir a la reflexión opcional</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Studio Customizer Sidebar -->
        <div class="pb-customizer card-ish">
          <h3 class="pb-custom-title">🎨 <span class="lang-en">Photobooth Studio</span><span class="lang-es" lang="es">Estudio de Fotos</span></h3>
          
          <!-- Frame Selector -->
          <div class="pb-custom-section">
            <label class="pb-custom-label"><strong><span class="lang-en">Select Frame:</span><span class="lang-es" lang="es">Elegir Marco:</span></strong></label>
            <div class="pb-frame-selector" role="radiogroup" aria-label="Photobooth Frame">
              <button type="button" class="pb-frame-btn is-selected" role="radio" aria-checked="true" data-frame="champion" ${act("setPhotoboothFrame", "champion", EL)}>
                🏆 <span class="lang-en">Champion</span><span class="lang-es" lang="es">Campeón</span>
              </button>
              <button type="button" class="pb-frame-btn" role="radio" aria-checked="false" data-frame="notebook" ${act("setPhotoboothFrame", "notebook", EL)}>
                📝 <span class="lang-en">Notebook</span><span class="lang-es" lang="es">Cuaderno</span>
              </button>
              <button type="button" class="pb-frame-btn" role="radio" aria-checked="false" data-frame="stars" ${act("setPhotoboothFrame", "stars", EL)}>
                ⭐ <span class="lang-en">Gold Star</span><span class="lang-es" lang="es">Estrellas</span>
              </button>
              <button type="button" class="pb-frame-btn" role="radio" aria-checked="false" data-frame="polaroid" ${act("setPhotoboothFrame", "polaroid", EL)}>
                🎞️ <span class="lang-en">Polaroid</span><span class="lang-es" lang="es">Polaroid</span>
              </button>
            </div>
          </div>

          <!-- Stickers & Props -->
          <div class="pb-custom-section">
            <label class="pb-custom-label"><strong><span class="lang-en">Add Stickers:</span><span class="lang-es" lang="es">Agregar Calcomanías:</span></strong></label>
            <div class="pb-stickers-picker">
              <button type="button" class="pb-sticker-chip" data-sticker="🏆" aria-pressed="false" ${act("togglePhotoboothSticker", "🏆")}>🏆 <span class="lang-en">Trophy</span><span class="lang-es" lang="es">Trofeo</span></button>
              <button type="button" class="pb-sticker-chip" data-sticker="💯" aria-pressed="false" ${act("togglePhotoboothSticker", "💯")}>💯 <span class="lang-en">100% Effort</span><span class="lang-es" lang="es">100%</span></button>
              <button type="button" class="pb-sticker-chip" data-sticker="⭐" aria-pressed="false" ${act("togglePhotoboothSticker", "⭐")}>⭐ <span class="lang-en">Math Star</span><span class="lang-es" lang="es">Estrella</span></button>
              <button type="button" class="pb-sticker-chip" data-sticker="🧮" aria-pressed="false" ${act("togglePhotoboothSticker", "🧮")}>🧮 <span class="lang-en">Top ÷ Bottom</span><span class="lang-es" lang="es">Arriba ÷ Abajo</span></button>
              <button type="button" class="pb-sticker-chip" data-sticker="🧠" aria-pressed="false" ${act("togglePhotoboothSticker", "🧠")}>🧠 <span class="lang-en">Big Brain</span><span class="lang-es" lang="es">Cerebro</span></button>
              <button type="button" class="pb-sticker-chip" data-sticker="✋" aria-pressed="false" ${act("togglePhotoboothSticker", "✋")}>✋ <span class="lang-en">High Five</span><span class="lang-es" lang="es">Chócalas</span></button>
              <button type="button" class="pb-sticker-chip" data-sticker="📐" aria-pressed="false" ${act("togglePhotoboothSticker", "📐")}>📐 <span class="lang-en">Math Tools</span><span class="lang-es" lang="es">Herramientas</span></button>
              <button type="button" class="pb-sticker-chip text-danger" ${act("clearPhotoboothStickers")}>🗑️ <span class="lang-en">Clear</span><span class="lang-es" lang="es">Borrar</span></button>
            </div>
          </div>

          <!-- Family Shout-Out Caption -->
          <div class="pb-custom-section">
            <label for="pb_caption_input" class="pb-custom-label"><strong><span class="lang-en">Add Message or Names:</span><span class="lang-es" lang="es">Mensaje o nombres:</span></strong></label>
            <input type="text" id="pb_caption_input" class="form-control" placeholder="e.g. Alex &amp; Mom - We crushed unit rates!" ${actOn("input", "updatePhotoboothCaption", [VALUE])} />
          </div>

          <!-- Helpful Tip -->
          <div class="pb-tip-box">
            <span class="pb-tip-icon" aria-hidden="true">💡</span>
            <p class="pb-tip-text">
              <span class="lang-en">Holding your open notebook or paper up next to your smile makes the best shot! You can also snap a photo of just your written work.</span>
              <span class="lang-es" lang="es">¡Sostener el cuaderno abierto junto a su sonrisa crea la mejor foto! También pueden tomar la foto solo de su trabajo escrito.</span>
            </p>
          </div>
        </div>
      </div>
    </section>`;

  return `<div ${tabPanelAttrs("photobooth", true)}>${inner}</div>`;
}

export function renderRefrigeratorSheet(config = {}, lessonId = "") {
  const displayId = displayLessonId(lessonId);
  const title = config.familyNotes?.sessionTitle || config.title || "Lesson Practice";
  const keyEn = keyIdea(config);
  const keyEs = keyIdeaEs(config);
  const topic = detectVisualTopic(config);
  const miniVisual = renderMiniConceptSvg(topic);
  const dinnerQ = familyGuidance(config).question;
  const dinnerEn = dinnerQ?.en || "How does the visual model show why your answer makes sense?";
  const dinnerEs =
    dinnerQ?.es || "¿Cómo muestra el modelo visual por qué tiene sentido tu respuesta?";
  const watchCues = watchForCues(config).slice(0, 2);
  const quickChecks = (config.practice?.approaching || config.practice?.onLevel || []).slice(0, 2);

  const origin = "https://eduwonderlab.com";
  const hwUrl = `${origin}/lessons/${lessonId}/homework.html`;
  const qr = qrSvg(hwUrl, { size: 84, margin: 1, fg: "var(--fm-primary)" });

  return `
    <div class="refrigerator-sheet-print-container" aria-hidden="true">
      <div class="rf-sheet-page">
      <div class="rf-header">
        <div class="rf-title-group">
          <span class="rf-kicker">EduWonderLab Mathematics · Grade 6 Family Learning Companion 3.0</span>
          <h2 class="rf-title">Lesson ${esc(displayId)}: ${esc(title)}</h2>
          <p class="rf-sub">🏠 <strong><span class="lang-en">1-Page Refrigerator Sheet &amp; Dinner Talk</span><span class="lang-es" lang="es">Hoja Familiar de 1 Página y Charla en Casa</span></strong></p>
        </div>
        <div class="rf-qr-box">
          ${qr}
          <span class="rf-qr-label"><span class="lang-en">Scan for interactive practice &amp; games</span><span class="lang-es" lang="es">Escanea para jugar</span></span>
        </div>
      </div>

      <div class="rf-grid">
        <div class="rf-col-left">
          <div class="rf-card rf-card-bigidea">
            <h3>🎯 <span class="lang-en">The Big Idea &amp; Visual Model</span><span class="lang-es" lang="es">La idea principal y modelo visual</span></h3>
            <p class="rf-key-en"><strong><span class="lang-en">In one sentence:</span><span class="lang-es" lang="es">En una frase:</span></strong> ${esc(completeSentence(keyEn))}</p>
            <p class="rf-key-es" lang="es"><strong>En una frase:</strong> ${esc(completeSentence(keyEs))}</p>
            <div class="rf-visual-summary">${miniVisual.svg}</div>
          </div>

          <div class="rf-card rf-card-dinner">
            <h3>🍽️ <span class="lang-en">Tonight's 60-Second Math Talk</span><span class="lang-es" lang="es">Charla Matemática de 60 Segundos</span></h3>
            <p class="rf-dinner-question">
              <strong><span class="lang-en">Ask your student:</span><span class="lang-es" lang="es">Pregúntale a tu estudiante:</span></strong>
              <span class="lang-en">“${esc(dinnerEn)}”</span>
              <span class="lang-es" lang="es">«${esc(dinnerEs)}»</span>
            </p>
            <ul class="rf-dinner-list">
              ${watchCues.map((c) => `<li>${c.icon} <span>${esc(c.en)}</span><br/><small lang="es">${esc(c.es)}</small></li>`).join("")}
            </ul>
          </div>
        </div>

        <div class="rf-col-right">
          <div class="rf-card rf-card-practice">
            <h3>✏️ <span class="lang-en">Quick Paper Practice</span><span class="lang-es" lang="es">Práctica rápida en papel</span></h3>
            ${quickChecks
              .map(
                (q, idx) => `
              <div class="rf-prob">
                <p class="rf-prob-stem"><strong>#${idx + 1}:</strong> ${esc(q.stem || q.question || "")}</p>
                <div class="rf-workspace">
                  <span class="rf-ws-label"><span class="lang-en">Student Work &amp; Thinking:</span><span class="lang-es" lang="es">Espacio de trabajo del estudiante:</span></span>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>

      <div class="rf-slip">
        <div class="rf-slip-head">
          <span>✂️ <em><span class="lang-en">Tear-off check-in ticket or keep on refrigerator</span><span class="lang-es" lang="es">Boleto desprendible o para el refrigerador</span></em></span>
          <strong>🌟 <span class="lang-en">I talked math with someone at home tonight!</span><span class="lang-es" lang="es">¡Hoy hablé de matemáticas con alguien en casa!</span></strong>
        </div>
        <div class="rf-slip-fields">
          <span><span class="lang-en">Student:</span><span class="lang-es" lang="es">Estudiante:</span> ______________________</span>
          <span><span class="lang-en">Practice partner (optional):</span><span class="lang-es" lang="es">Acompañante de práctica (opcional):</span> ______________________</span>
          <span><span class="lang-en">Date:</span><span class="lang-es" lang="es">Fecha:</span> __________</span>
        </div>
        <div class="rf-sketch-box">
          <span>🎨 <span class="lang-en">Student pride note or optional partner sketch / doodle:</span><span class="lang-es" lang="es">Nota de orgullo del estudiante o dibujo opcional en familia:</span></span>
        </div>
        <div class="rf-slip-mood">
          <span><span class="lang-en">Tonight's math felt:</span><span class="lang-es" lang="es">La matemática de hoy se sintió:</span></span>
          <span>[ &nbsp; ] 🟢 <span class="lang-en">Smooth</span><span class="lang-es" lang="es">Bien</span></span>
          <span>[ &nbsp; ] 🟡 <span class="lang-en">Needed help</span><span class="lang-es" lang="es">Con ayuda</span></span>
          <span>[ &nbsp; ] 🔴 <span class="lang-en">Tough</span><span class="lang-es" lang="es">Difícil</span></span>
        </div>
      </div>
      </div>
    </div>
  `;
}

/**
 * SIX STOPS, ONE ROW, EVERY ONE OF THEM REAL.
 *
 * This was ten tabs, and four of them were not destinations:
 *   Arcade  — 374 characters and an iframe: one game.
 *   Play    — 454 characters: one game.
 *   Workbench — a tool you reach for WHILE working, not a place you go.
 *   Help    — the same, and needed most on the Check stop, which is precisely
 *             where a family could not see it without abandoning their work.
 * Ten tabs also needed a second navigation (a five-stop rail) underneath to
 * explain which of the ten actually mattered — 208px of chrome on a phone
 * before a word of mathematics, and two controls competing for one job.
 *
 * So: the two orphan games moved into the arcade on the Play stop, the
 * workbench moved into Together (where the manipulatives get used), Help
 * became a button that floats over every stop, and the "More" links moved to
 * Done, where a family that wants to keep going is standing. Six stops now
 * mean six things worth doing, the tab bar IS the rail, and `min` is the
 * single source of truth for how long tonight takes.
 */
const HOMEWORK_TABS = [
  { id: "learn", icon: "📖", en: "Learn", es: "Aprender" },
  { id: "words", icon: "📚", en: "Words", es: "Palabras" },
  { id: "check", icon: "✅", en: "Practice", es: "Práctica" },
  { id: "play", icon: "🎮", en: "Play", es: "Jugar" },
  { id: "done", icon: "🎉", en: "Celebrate", es: "Celebrar" },
];

/**
 * Stops that are NOT part of tonight's path.
 *
 * The photobooth used to be stop 7 of 7 — numbered, budgeted at two minutes,
 * and sitting AFTER the stop called "Done", which told a family the homework
 * was not finished until they had taken a photo. It is a tool, not an
 * assignment: a camera with frames and stickers for photographing the work in
 * the notebook, the scratchpad or the whiteboard, whenever they want it. So it
 * keeps its place beside Done and loses its number, its minutes and its claim
 * on the progress track.
 */
const HOMEWORK_EXTRA_TABS = [
  {
    id: "photobooth",
    icon: "📸",
    en: "Photobooth",
    es: "Fotos",
    blurbEn: "Optional — snap a picture of tonight's math work",
    blurbEs: "Opcional: toma una foto del trabajo de matemáticas de hoy",
    ariaEn: "Photobooth — optional. Take a picture of your math work with fun frames and stickers.",
  },
];

export const HOMEWORK_STOP_COUNT = HOMEWORK_TABS.length;

/**
 * One navigation, not two. Each tab carries its own stop number, its own
 * minutes and its own "done" tick, so the bar answers the three questions the
 * separate rail was added to answer — where am I, how long is this, what have
 * we finished — without a second row competing with it for the same job.
 */
export function renderHomeworkTabs(panelsHtml, helpDrawerHtml = "", unit = null) {
  const tabCount = HOMEWORK_TABS.length;
  const scratchpad = renderScratchpadHtml(unit);
  const tabBtn = (t, i) => `
            <button type="button" id="hw_tab_${t.id}" class="homework-tab-btn${i === 0 ? " is-active" : ""}"
              ${i === 0 ? 'aria-current="step"' : ""} aria-controls="hw_panel_${t.id}"
              aria-label="${esc(t.en)} — stop ${i + 1} of ${tabCount}"
              data-aria-en="${esc(t.en)} — stop ${i + 1} of ${tabCount}" data-aria-es="${esc(t.es)} — parada ${i + 1} de ${tabCount}"
              data-tab="${t.id}" data-stop="${i + 1}" ${act("switchHomeworkTab", t.id)}>
              <span class="tab-step" aria-hidden="true">${i + 1}</span>
              <span class="tab-icon" aria-hidden="true">${t.icon}</span>
              <span class="tab-label"><span class="tab-en">${t.en}</span><span class="tab-es" lang="es">${t.es}</span></span>
              <span class="tab-done" aria-hidden="true">✓</span>
            </button>`;
  const extraBtn = (t) => `
            <button type="button" id="hw_tab_${t.id}" class="homework-tab-extra"
              aria-controls="hw_panel_${t.id}"
              aria-label="${esc(t.ariaEn)}" title="${esc(t.ariaEn)}"
              data-tab="${t.id}" ${act("switchHomeworkTab", t.id)}>
              <span class="tab-icon" aria-hidden="true">${t.icon}</span>
              <span class="tab-label"><span class="tab-en">${t.en}</span><span class="tab-es" lang="es">${t.es}</span></span>
              <span class="tab-extra-blurb"><span class="lang-en">${esc(t.blurbEn)}</span><span class="lang-es" lang="es">${esc(t.blurbEs)}</span></span>
            </button>`;

  return `
    <div class="homework-tabs-shell" data-tab-count="${tabCount}">
      <div class="homework-tab-chrome">
        <div class="hw-tab-meta-row"><div id="hw_utility_controls" class="hw-utility-controls"></div>
        </div>
        <nav class="homework-tab-bar" aria-label="Tonight's path" data-aria-en="Tonight's path" data-aria-es="Ruta de hoy">
          ${HOMEWORK_TABS.map(tabBtn).join("")}
          ${HOMEWORK_EXTRA_TABS.map(extraBtn).join("")}
        </nav>
        <div class="homework-tab-track" aria-hidden="true"><span class="homework-tab-track-fill" id="hw_tab_track_fill"></span></div>
      </div>
      <div class="homework-tab-panels" id="hw_tab_panels">
        ${scratchpad}
        ${panelsHtml}
      </div>
      <nav class="hw-stop-nav" aria-label="Stop navigation / Navegación de paradas">
        <button type="button" class="btn btn-outline-primary hw-stop-back" id="hw_stop_back" ${act("hwStopStep", -1)}>
          <span class="lang-en">← Back</span><span class="lang-es" lang="es">← Atrás</span>
        </button>
        <span class="hw-stop-here" id="hw_stop_here" aria-live="polite"></span>
        <button type="button" class="btn btn-primary hw-stop-next" id="hw_stop_next" ${act("hwStopStep", 1)}>
          <span class="lang-en">Next →</span><span class="lang-es" lang="es">Siguiente →</span>
        </button>
      </nav>
    </div>
    ${helpDrawerHtml}`;
}

/**
 * Help, as a button that floats over every stop instead of a tab you have to
 * leave your work to visit. "What do I say when they're stuck" is needed
 * DURING the Check problems; as tab 8 of 10 it was unreachable exactly when it
 * mattered. The "learn more online" links ride along, because a family looking
 * for a video is a family that is already stuck.
 */
export function renderHelpDrawer(stuckHtml, moreHtml) {
  return `
    <button type="button" class="hw-stuck-fab" id="hw_stuck_fab" ${act("toggleHelpDrawer")}
      aria-expanded="false" aria-controls="hw_help_drawer">
      <span class="hw-stuck-fab-icon" aria-hidden="true">💬</span>
      <span class="hw-stuck-fab-label"><span class="lang-en">Stuck?</span><span class="lang-es" lang="es">¿Atorados?</span></span>
    </button>
    <div class="hw-help-drawer" id="hw_help_drawer" role="dialog" aria-modal="true"
      aria-label="If your student gets stuck" data-aria-en="If your student gets stuck" data-aria-es="Ayuda si te atoras" hidden>
      <div class="hw-help-drawer-scrim" ${act("toggleHelpDrawer")}></div>
      <div class="hw-help-drawer-sheet">
        <div class="hw-help-drawer-head">
          <strong><span class="lang-en">If your student gets stuck</span><span class="lang-es" lang="es">Si se atoran</span></strong>
          <button type="button" class="hw-help-drawer-close" ${act("toggleHelpDrawer")} aria-label="Close help" data-aria-en="Close help" data-aria-es="Cerrar ayuda">✕</button>
        </div>
        <div class="hw-help-drawer-body">
          ${stuckHtml}
          ${moreHtml}
        </div>
      </div>
    </div>`;
}

export function renderHelpModal() {
  return `
    <div class="help-modal-overlay" id="help_modal_overlay" hidden ${act("closeHelpModal", EV)}>
      <div class="help-modal" role="dialog" aria-modal="true" aria-labelledby="help_modal_title" ${actOn("click", "hwNoop", [], { stop: true })}>
        <button type="button" class="help-modal-close" ${act("closeHelpModal")} aria-label="Close help" data-aria-en="Close help" data-aria-es="Cerrar ayuda">✕</button>
        <h3 id="help_modal_title" class="help-modal-title"></h3>
        <div class="help-modal-visual" id="help_modal_visual" hidden></div>
        <p class="help-modal-body lang-en" id="help_modal_en"></p>
        <p class="help-modal-body lang-es" lang="es" id="help_modal_es"></p>
        <div class="help-modal-frame" id="help_modal_frame" hidden>
          <span class="help-frame-tag">✏️ Sentence starter / Para empezar</span>
          <span class="help-frame-en lang-en" id="help_modal_frame_en"></span>
          <span class="help-frame-es lang-es" lang="es" id="help_modal_frame_es"></span>
        </div>
      </div>
    </div>`;
}

export const HOMEWORK_TABS_JS = `
function journeyStorageKey() {
  return 'hw_journey_' + (window.LESSON_ID || location.pathname);
}

/* Which stop to reopen on is a fact about ONE lesson, so it is keyed like the
   journey map above. It used to be the single global 'hw_last_tab': a family
   that finished 3-5 on the Done stop then opened 3-6 for the FIRST time landed
   on its celebration + parent sign-off screen, never saw Learn/Words/Together/
   Check/Play, and updateJourneyMap immediately ticked that untouched lesson
   'done'. The old key is cleared on sight so nobody inherits that landing. */
function lastTabStorageKey() {
  return 'hw_last_tab_' + (window.LESSON_ID || location.pathname);
}

/* ── Family Game Break (Together tab) ─────────────────────────────────────
   Two content-free game engines; the content ships as the JSON island
   window.__HW_FAMGAMES__ rendered by renderFamilyGameBreak(). No timers. */
var famDom = { n: 0, next: 1, tries: 0 };
var famTf = { idx: 0, score: 0, answered: 0 };

function famGamesData() {
  var d = window.__HW_FAMGAMES__;
  return d && Array.isArray(d.pairs) && Array.isArray(d.tf) ? d : null;
}

/* Math Dominoes. The pair bank gives n twins {a, b}. Domino k reads
   [ twin of the PREVIOUS problem | this problem ], so the chain closes into a
   loop: each placed domino's right end is a problem, and the next domino must
   carry that problem's twin on its left. Starting point rotates per game. */
function famDomTiles(pairs, start) {
  var n = pairs.length;
  var tiles = [];
  for (var k = 0; k < n; k++) {
    var i = (start + k) % n;
    var prev = (i + n - 1) % n;
    tiles.push({ k: k, left: pairs[prev].b, leftEs: pairs[prev].bEs || '', right: pairs[i].a, rightEs: pairs[i].aEs || '' });
  }
  return tiles;
}

/* The game reports what happens so optional layers (two-player mode) can follow
   along without the game knowing they exist. */
function domAnnounce(type) {
  document.dispatchEvent(new CustomEvent('hw:domino', { detail: { type: type } }));
}

function resetDominoGame() {
  var data = famGamesData();
  var chain = document.getElementById('fam_dom_chain');
  var tray = document.getElementById('fam_dom_tray');
  if (!data || !chain || !tray) return;
  var n = data.pairs.length;
  var tiles = famDomTiles(data.pairs, Math.floor(Math.random() * n));
  famDom = { n: n, next: 1, tries: 0, tiles: tiles };
  var win = document.getElementById('fam_dom_win');
  if (win) win.hidden = true;
  var hint = document.getElementById('fam_dom_hint');
  if (hint) hint.textContent = '';
  chain.innerHTML = '';
  chain.appendChild(dominoTileEl(tiles[0], false));
  chain.appendChild(dominoSlotEl());
  var rest = tiles.slice(1);
  for (var m = rest.length - 1; m > 0; m--) {
    var j = Math.floor(Math.random() * (m + 1));
    var t = rest[m]; rest[m] = rest[j]; rest[j] = t;
  }
  tray.innerHTML = '';
  rest.forEach(function (tile) {
    var btn = dominoTileEl(tile, true);
    btn.addEventListener('click', function () { placeDomino(btn, tile); });
    tray.appendChild(btn);
  });
  updateDominoStatus();
  domAnnounce('reset');
}

function dominoTileEl(tile, isButton) {
  var el = document.createElement(isButton ? 'button' : 'div');
  if (isButton) el.type = 'button'; else el.setAttribute('role', 'listitem');
  el.className = 'fam-dom-tile';
  if (isButton) el.innerHTML = '<span class="hw-sr-only"><span class="lang-en">Domino tile: </span><span class="lang-es" lang="es">Ficha de dominó: </span></span>';
  var l = domHalfEl('fam-dom-half fam-dom-left', tile.left, tile.leftEs);
  var r = domHalfEl('fam-dom-half fam-dom-right', tile.right, tile.rightEs);
  el.appendChild(l);
  el.appendChild(r);
  return el;
}

/* A tile half is English; when it carries words it carries the Spanish too, shown in
   Spanish and bilingual modes. Numerals and symbols have no Spanish and stay one line. */
function domHalfEl(className, en, es) {
  var half = document.createElement('span');
  half.className = className;
  if (!es) { half.textContent = en; return half; }
  var a = document.createElement('span');
  a.className = 'lang-en';
  a.textContent = en;
  var b = document.createElement('span');
  b.className = 'lang-es';
  b.setAttribute('lang', 'es');
  b.textContent = es;
  half.appendChild(a);
  half.appendChild(b);
  return half;
}

function dominoSlotEl() {
  var el = document.createElement('span');
  el.className = 'fam-dom-slot';
  el.setAttribute('aria-hidden', 'true');
  el.textContent = '?';
  return el;
}

function updateDominoStatus() {
  var el = document.getElementById('fam_dom_status');
  if (!el || !famDom.n) return;
  var placed = famDom.next;
  var n = famDom.n;
  setBiText(el,
    'Dominoes placed: ' + placed + ' / ' + n + ' · Wrong tries: ' + famDom.tries,
    'Fichas colocadas: ' + placed + ' / ' + n + ' · Intentos fallidos: ' + famDom.tries);
}

function placeDomino(btn, tile) {
  if (!famDom.n || btn.disabled) return;
  var chain = document.getElementById('fam_dom_chain');
  var hint = document.getElementById('fam_dom_hint');
  if (tile.k !== famDom.next) {
    famDom.tries++;
    btn.classList.remove('is-wrong');
    void btn.offsetWidth;
    btn.classList.add('is-wrong');
    if (hint) setBiText(hint,
      'Not that one. Look at the problem on the end of the chain: which answer is its twin?',
      'Esa no. Mira el problema al final de la cadena: ¿cuál es su pareja?');
    updateDominoStatus();
    domAnnounce('miss');
    return;
  }
  var slot = chain.querySelector('.fam-dom-slot');
  if (slot) slot.remove();
  btn.disabled = true;
  var placed = dominoTileEl(tile, false);
  placed.classList.add('is-new');
  chain.appendChild(placed);
  btn.remove();
  famDom.next++;
  if (hint) hint.textContent = '';
  if (typeof playCorrectSound === 'function') playCorrectSound();
  if (famDom.next >= famDom.n) {
    var win = document.getElementById('fam_dom_win');
    if (win) win.hidden = false;
    if (typeof triggerCelebration === 'function') triggerCelebration();
  } else {
    chain.appendChild(dominoSlotEl());
  }
  updateDominoStatus();
  domAnnounce('placed');
}

/* The page has three language modes (bilingual default / en / es), carried by
   CSS on .lang-en/.lang-es spans — so JS-written text uses the SAME span pair
   and inherits whichever mode the family picked, live. */
function setBiText(el, en, es) {
  if (!el) return;
  el.textContent = '';
  var a = document.createElement('span');
  a.className = 'lang-en';
  a.textContent = en;
  var b = document.createElement('span');
  b.className = 'lang-es';
  b.setAttribute('lang', 'es');
  b.textContent = es;
  el.appendChild(a);
  el.appendChild(b);
}

function renderTfQuestion() {
  var data = famGamesData();
  if (!data) return;
  var q = data.tf[famTf.idx];
  var turnEl = document.getElementById('fam_tf_turn');
  var stEl = document.getElementById('fam_tf_statement');
  var fb = document.getElementById('fam_tf_feedback');
  var doneEl = document.getElementById('fam_tf_done');
  var btnT = document.getElementById('fam_tf_true_btn');
  var btnF = document.getElementById('fam_tf_false_btn');
  if (!q) {
    if (stEl) stEl.textContent = '';
    if (turnEl) turnEl.textContent = '';
    if (btnT) btnT.hidden = true;
    if (btnF) btnF.hidden = true;
    if (fb) fb.hidden = true;
    if (doneEl) {
      doneEl.hidden = false;
      var perfect = famTf.score === data.tf.length;
      var lead = perfect ? '🏆 ' : '🎉 ';
      setBiText(
        doneEl,
        lead + 'Team score: ' + famTf.score + ' out of ' + data.tf.length + (perfect ? ' — perfect game!' : '. Read the whys together and rematch!'),
        lead + 'Resultado del equipo: ' + famTf.score + ' de ' + data.tf.length + (perfect ? ' — ¡puntuación perfecta!' : '. Revisen los porqués y jueguen otra vez.'),
      );
      if (typeof triggerCelebration === 'function' && perfect) triggerCelebration();
    }
    return;
  }
  if (doneEl) doneEl.hidden = true;
  if (btnT) { btnT.hidden = false; btnT.disabled = false; }
  if (btnF) { btnF.hidden = false; btnF.disabled = false; }
  if (fb) fb.hidden = true;
  var who = famTf.idx % 2 === 0;
  var pos = ' · ' + (famTf.idx + 1) + ' / ' + data.tf.length;
  setBiText(
    turnEl,
    (who ? "🧑‍🎓 Student's turn" : "👪 Family member's turn") + pos,
    (who ? '🧑‍🎓 Turno del estudiante' : '👪 Turno de la familia') + pos,
  );
  setBiText(stEl, q.en, q.es);
  updateTfScore();
}

function updateTfScore() {
  var el = document.getElementById('fam_tf_score');
  if (!el) return;
  var tail = famTf.score + ' / ' + famTf.answered;
  setBiText(el, 'Team score: ' + tail, 'Puntos del equipo: ' + tail);
}

function answerTf(saidTrue) {
  var data = famGamesData();
  var q = data && data.tf[famTf.idx];
  if (!q) return;
  var btnT = document.getElementById('fam_tf_true_btn');
  var btnF = document.getElementById('fam_tf_false_btn');
  if (btnT) btnT.disabled = true;
  if (btnF) btnF.disabled = true;
  var right = saidTrue === q.answer;
  famTf.answered++;
  if (right) famTf.score++;
  var verdict = document.getElementById('fam_tf_verdict');
  var why = document.getElementById('fam_tf_why');
  var fb = document.getElementById('fam_tf_feedback');
  if (verdict) {
    setBiText(
      verdict,
      right ? '✅ Correct!' : '❌ Not quite — it was ' + (q.answer ? 'TRUE.' : 'FALSE.'),
      right ? '✅ ¡Correcto!' : '❌ No exactamente — era ' + (q.answer ? 'VERDADERO.' : 'FALSO.'),
    );
    verdict.className = 'fam-tf-verdict ' + (right ? 'is-right' : 'is-wrong');
  }
  setBiText(why, q.whyEn, q.whyEs);
  if (fb) fb.hidden = false;
  if (right && typeof playCorrectSound === 'function') playCorrectSound();
  updateTfScore();
}

function nextTf() {
  famTf.idx++;
  renderTfQuestion();
}

function resetTfGame() {
  famTf = { idx: 0, score: 0, answered: 0 };
  renderTfQuestion();
}

/* ── Arcade picker: one game visible at a time ─────────────────────────── */
function showArcadeGame(id) {
  document.querySelectorAll('[data-arcade-panel]').forEach(function (p) {
    p.hidden = p.dataset.arcadePanel !== id;
  });
  document.querySelectorAll('[data-arcade-game]').forEach(function (c) {
    const on = c.dataset.arcadeGame === id;
    c.classList.toggle('is-active', on);
    c.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  // The two games that used to be tabs boot the same way they did then: the
  // quiz on first view, and the Phaser arcade iframe only once someone asks for
  // it, so it never costs the rest of the page anything.
  if (id === 'quiz' && typeof initHomeworkGame === 'function') initHomeworkGame();
  if (id === 'full') {
    var af = document.querySelector('.arcade-frame');
    if (af && !af.getAttribute('src') && af.dataset.src) af.setAttribute('src', af.dataset.src);
  }
  if (typeof playTabSwitchSound === 'function') playTabSwitchSound();
}

/* ── Sort It! — tap a card, tap a bin ──────────────────────────────────── */
var famSort = { picked: null, placed: 0, right: 0 };

function resetSortGame() {
  const data = famGamesData();
  const wrap = document.getElementById('fam_sort_cards');
  if (!data || !data.sort || !wrap) return;
  famSort = { picked: null, placed: 0, right: 0 };
  setBiText(document.getElementById('fam_sort_bin0'), data.sort.a.en, data.sort.a.es);
  setBiText(document.getElementById('fam_sort_bin1'), data.sort.b.en, data.sort.b.es);
  document.getElementById('fam_sort_bin0_count').textContent = '0';
  document.getElementById('fam_sort_bin1_count').textContent = '0';
  const fb = document.getElementById('fam_sort_feedback');
  if (fb) fb.textContent = '';
  const done = document.getElementById('fam_sort_done');
  if (done) done.hidden = true;

  const cards = data.sort.cards.slice();
  for (var i = cards.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = cards[i]; cards[i] = cards[j]; cards[j] = t;
  }
  wrap.innerHTML = '';
  cards.forEach(function (c, idx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fam-sort-card';
    btn.textContent = c.t;
    btn.dataset.bucket = String(c.bucket);
    btn.dataset.whyEn = c.en;
    btn.dataset.whyEs = c.es;
    btn.dataset.idx = String(idx);
    btn.addEventListener('click', function () { pickSortCard(btn); });
    wrap.appendChild(btn);
  });
}

function pickSortCard(btn) {
  if (btn.classList.contains('is-placed')) return;
  document.querySelectorAll('.fam-sort-card').forEach(function (c) { c.classList.remove('is-picked'); });
  btn.classList.add('is-picked');
  famSort.picked = btn;
  setBiText(
    document.getElementById('fam_sort_feedback'),
    'Now tap the bin where "' + btn.textContent + '" belongs.',
    'Ahora toquen el cesto donde va "' + btn.textContent + '".',
  );
}

function dropSortCard(bin) {
  const data = famGamesData();
  const btn = famSort.picked;
  const fb = document.getElementById('fam_sort_feedback');
  if (!data || !btn) {
    setBiText(fb, 'Tap a card first, then tap a bin.', 'Primero toquen una tarjeta y luego un cesto.');
    return;
  }
  const correct = Number(btn.dataset.bucket) === bin;
  famSort.placed++;
  if (correct) {
    famSort.right++;
    btn.classList.add('is-placed', 'is-right');
    const countEl = document.getElementById('fam_sort_bin' + bin + '_count');
    countEl.textContent = String(Number(countEl.textContent) + 1);
    setBiText(fb, '✅ Yes — ' + btn.dataset.whyEn, '✅ Sí — ' + btn.dataset.whyEs);
    if (typeof playCorrectSound === 'function') playCorrectSound();
  } else {
    btn.classList.add('is-wrong');
    setTimeout(function () { btn.classList.remove('is-wrong'); }, 600);
    setBiText(fb, '❌ Other bin — ' + btn.dataset.whyEn, '❌ El otro cesto — ' + btn.dataset.whyEs);
  }
  btn.classList.remove('is-picked');
  famSort.picked = null;

  const remaining = document.querySelectorAll('.fam-sort-card:not(.is-placed)').length;
  if (remaining === 0) {
    const done = document.getElementById('fam_sort_done');
    if (done) {
      done.hidden = false;
      const tries = famSort.placed;
      setBiText(
        done,
        '🎉 All sorted! You placed 6 cards in ' + tries + ' tries.',
        '🎉 ¡Todo clasificado! Colocaron 6 tarjetas en ' + tries + ' intentos.',
      );
    }
    if (typeof triggerCelebration === 'function') triggerCelebration();
  }
}

/* ── Would You Rather? — vote, then reveal the mathematics ─────────────── */
var famWyr = { idx: 0, voted: false };

function resetWyrGame() {
  famWyr = { idx: 0, voted: false };
  renderWyr();
}

function renderWyr() {
  const data = famGamesData();
  if (!data || !data.wyr) return;
  const round = data.wyr[famWyr.idx];
  const a = document.getElementById('fam_wyr_a');
  const b = document.getElementById('fam_wyr_b');
  const reveal = document.getElementById('fam_wyr_reveal');
  const prog = document.getElementById('fam_wyr_progress');
  if (!round) {
    setBiText(
      prog,
      '🏆 That is every round — start over any time, or argue about the last one a while longer.',
      '🏆 Esas son todas las rondas. Empiecen de nuevo cuando quieran, o sigan discutiendo la última.',
    );
    if (a) a.hidden = true;
    if (b) b.hidden = true;
    if (reveal) reveal.hidden = true;
    return;
  }
  famWyr.voted = false;
  if (a) { a.hidden = false; a.classList.remove('is-chosen'); setBiText(a, round.a.en, round.a.es); }
  if (b) { b.hidden = false; b.classList.remove('is-chosen'); setBiText(b, round.b.en, round.b.es); }
  if (reveal) reveal.hidden = true;
  setBiText(
    prog,
    'Round ' + (famWyr.idx + 1) + ' of ' + data.wyr.length + ' · everyone votes, then say why',
    'Ronda ' + (famWyr.idx + 1) + ' de ' + data.wyr.length + ' · todos votan y dicen por qué',
  );
}

function voteWyr(which) {
  const data = famGamesData();
  const round = data && data.wyr[famWyr.idx];
  if (!round || famWyr.voted) return;
  famWyr.voted = true;
  const chosen = document.getElementById(which === 0 ? 'fam_wyr_a' : 'fam_wyr_b');
  if (chosen) chosen.classList.add('is-chosen');
  setBiText(document.getElementById('fam_wyr_why'), round.en, round.es);
  const reveal = document.getElementById('fam_wyr_reveal');
  if (reveal) reveal.hidden = false;
}

function nextWyr() {
  famWyr.idx++;
  renderWyr();
}

function initFamilyGames() {
  if (!famGamesData() || !document.getElementById('fam_game_break')) return;
  resetDominoGame();
  resetTfGame();
  resetSortGame();
  resetWyrGame();
}

/* ── Family practice paths ──────────────────────────────────────────────
   Each path is a complete, optional experience. Time values are estimates,
   never timers; the student and family can pause or stop at any point. */
var HOMEWORK_ROUTES = {
  quick: { tabs: ['learn', 'check', 'done'], problemLimit: 2 },
  full: { tabs: ['learn', 'words', 'check', 'play', 'done'], problemLimit: 0 }
};
/* Two choices: Quick Practice (the default) and Keep Going, which carries the
   old Learn & practice content and the old Full Studio content. Saved choices and
   links from before the change keep working: "core" is now Keep Going. */
var HOMEWORK_ROUTE_DEFAULT = 'quick';
var HOMEWORK_ROUTE_ALIASES = { core: 'full' };

function normalizeHomeworkRoute(mode) {
  if (Object.prototype.hasOwnProperty.call(HOMEWORK_ROUTE_ALIASES, mode)) mode = HOMEWORK_ROUTE_ALIASES[mode];
  return Object.prototype.hasOwnProperty.call(HOMEWORK_ROUTES, mode) ? mode : HOMEWORK_ROUTE_DEFAULT;
}

function routeStorageKey() {
  return 'hw_route_' + (window.LESSON_ID || location.pathname);
}

function activeHomeworkRoute() {
  return HOMEWORK_ROUTES[normalizeHomeworkRoute(document.body.dataset.homeworkRoute)];
}

function setHomeworkRoute(mode, options) {
  options = options || {};
  mode = normalizeHomeworkRoute(mode);
  var route = HOMEWORK_ROUTES[mode];
  document.body.dataset.homeworkRoute = mode;

  document.querySelectorAll('[data-route-mode]').forEach(function (btn) {
    var active = btn.dataset.routeMode === mode;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  var visibleIndex = 0;
  document.querySelectorAll('.homework-tab-btn').forEach(function (btn) {
    var included = route.tabs.indexOf(btn.dataset.tab) !== -1;
    btn.hidden = !included;
    if (!included) {
      btn.removeAttribute('aria-current');
      return;
    }
    visibleIndex++;
    var step = btn.querySelector('.tab-step');
    if (step) step.textContent = String(visibleIndex);
    var labelEn = btn.querySelector('.tab-en');
    var labelEs = btn.querySelector('.tab-es');
    btn.dataset.ariaEn = (labelEn ? labelEn.textContent : btn.dataset.tab) + ' — stop ' + visibleIndex + ' of ' + route.tabs.length;
    btn.dataset.ariaEs = (labelEs ? labelEs.textContent : btn.dataset.tab) + ' — parada ' + visibleIndex + ' de ' + route.tabs.length;
    btn.setAttribute('aria-label', document.documentElement.lang === 'es' ? btn.dataset.ariaEs : btn.dataset.ariaEn);
  });
  document.querySelectorAll('.homework-tab-extra').forEach(function (btn) {
    btn.hidden = mode !== 'full';
  });
  var shell = document.querySelector('.homework-tabs-shell');
  if (shell) shell.dataset.tabCount = String(route.tabs.length);

  /* Every core problem, in page order (basic practice, then warm-up, then level up). Quick practice is the first two;
     the other paths show them all. problemLimit 0 means "all of them", so the count follows the page instead of a number
     written into this script. */
  var coreProblems = Array.prototype.filter.call(
    document.querySelectorAll(
      '.practice-tier .problem-section, .practice-tier-basic .problem-section, .practice-tier-warmup .problem-section, .practice-tier-challenge .problem-section'
    ),
    function (problem) { return !problem.closest('.more-practice'); }
  );
  if (mode !== 'quick') delete document.body.dataset.quickMore;
  var quickMore = mode === 'quick' && document.body.dataset.quickMore === '1';
  var routeLimit = route.problemLimit > 0 ? Math.min(route.problemLimit, coreProblems.length) : coreProblems.length;
  var limit = quickMore ? coreProblems.length : routeLimit;
  coreProblems.forEach(function (problem, index) { problem.hidden = index >= limit; });
  document.querySelectorAll('.practice-tier, .practice-tier-basic, .practice-tier-warmup, .practice-tier-challenge').forEach(function (tier) {
    if (tier.closest('.more-practice')) return;
    tier.hidden = !tier.querySelector('.problem-section:not([hidden])');
  });
  var more = document.querySelector('.more-practice');
  if (more) more.hidden = mode === 'quick';
  /* Quick practice sets problems aside, never takes them away: one tap shows the rest. */
  var optional = document.getElementById('hw_quick_optional');
  if (optional) {
    var extra = coreProblems.length - routeLimit;
    optional.hidden = !(mode === 'quick' && extra > 0);
    var optionalBtn = document.getElementById('hw_quick_optional_btn');
    if (optionalBtn) optionalBtn.setAttribute('aria-expanded', quickMore ? 'true' : 'false');
    optional.querySelectorAll('[data-hw-quick-more-label]').forEach(function (el) { el.textContent = quickMore ? 'Hide' : 'Show'; });
    optional.querySelectorAll('[data-hw-quick-more-label-es]').forEach(function (el) { el.textContent = quickMore ? 'Ocultar' : 'Mostrar'; });
    optional.querySelectorAll('[data-hw-quick-more-count], [data-hw-quick-more-count-es]').forEach(function (el) { el.textContent = String(extra); });
  }
  document.querySelectorAll('[data-hw-core-count]').forEach(function (el) { el.textContent = String(coreProblems.length); });
  if (typeof hwRenderGoal === 'function') hwRenderGoal(false);

  var note = document.getElementById('hw_route_note');
  if (note) {
    var copy = {
      quick: ['Quick Practice selected: one example and 2 problems. Stop whenever you need.', 'Práctica rápida seleccionada: un ejemplo y 2 problemas. Pueden parar cuando lo necesiten.'],
      full: ['Keep Going selected: everything, plus one home mission and one game. Everything is optional.', 'Seguir practicando seleccionado: todo, más una misión en casa y un juego. Todo es opcional.']
    }[mode];
    setBiText(note, copy[0], copy[1]);
  }

  try {
    localStorage.setItem(routeStorageKey(), mode);
    if (!options.silent) localStorage.setItem(routeStorageKey() + '_chosen', '1');
  } catch (e) {}
  initHomeworkShareLinks();
  var current = document.body.dataset.activeTab;
  if (current && route.tabs.indexOf(current) === -1 && !options.keepTab) switchHomeworkTab(route.tabs[0]);
  else if (current) switchHomeworkTab(current);
  if (!options.silent) {
    var chooser = document.querySelector('.hw-route-chooser');
    if (chooser) chooser.classList.add('route-just-changed');
    setTimeout(function () { if (chooser) chooser.classList.remove('route-just-changed'); }, 450);
  }
}

function restoreHomeworkRoute() {
  var mode = HOMEWORK_ROUTE_DEFAULT;
  try {
    // The page also writes the default when nobody chose, and earlier defaults
    // were "core" and "full". Only a choice the family made (the _chosen flag) counts.
    if (localStorage.getItem(routeStorageKey() + '_chosen') === '1') {
      mode = normalizeHomeworkRoute(localStorage.getItem(routeStorageKey()));
    }
  } catch (e) {}
  var requested = new URLSearchParams(location.search).get('route');
  if (requested && (Object.prototype.hasOwnProperty.call(HOMEWORK_ROUTES, requested) || Object.prototype.hasOwnProperty.call(HOMEWORK_ROUTE_ALIASES, requested))) {
    mode = normalizeHomeworkRoute(requested);
  }
  setHomeworkRoute(mode, { silent: true, keepTab: true });
}

function goNextHomeworkStop(current) {
  var tabs = activeHomeworkRoute().tabs;
  var index = tabs.indexOf(current);
  var next = tabs[Math.min(index + 1, tabs.length - 1)] || tabs[0];
  switchHomeworkTab(next);
}

/* Reveal the requested rung and every earlier rung. A family cannot jump to
   the strongest nudge without also seeing the noticing and strategy prompts. */
function revealCoachStep(btn) {
  var step = btn.closest('.coach-ladder-step');
  var list = step && step.parentElement;
  if (!step || !list) return;
  var steps = Array.from(list.querySelectorAll('.coach-ladder-step'));
  var stop = steps.indexOf(step);
  steps.forEach(function (item, index) {
    if (index > stop) return;
    item.classList.add('is-revealed');
    var help = item.querySelector('.coach-step-help');
    var trigger = item.querySelector('button');
    if (help) help.hidden = false;
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  });
  var help = step.querySelector('.coach-step-help');
  if (help) help.focus && help.focus();
}

/* ── Trackable hands-on mission ───────────────────────────────────────── */
function familyMissionStorageKey() {
  return 'hw_family_mission_' + (window.LESSON_ID || location.pathname);
}

function showFamilyMissionState(index, celebrate) {
  var cards = Array.from(document.querySelectorAll('[data-family-activity]'));
  cards.forEach(function (card, cardIndex) {
    var done = cardIndex === index;
    card.classList.toggle('is-mission-complete', done);
    var btn = card.querySelector('[data-mission-complete]');
    if (btn) {
      btn.classList.toggle('is-complete', done);
      btn.setAttribute('aria-pressed', done ? 'true' : 'false');
    }
  });
  var badge = document.getElementById('badge_achieve_mission');
  if (badge) badge.classList.toggle('is-unlocked', index >= 0);
  var status = document.getElementById('family_mission_status');
  if (status && index >= 0 && cards[index]) {
    var titleEn = cards[index].querySelector('.fam-act-titles .lang-en');
    var titleEs = cards[index].querySelector('.fam-act-titles .lang-es');
    setBiText(
      status,
      'Mission complete: ' + (titleEn ? titleEn.textContent : 'family activity') + '. Home Explorer badge unlocked!',
      'Misión completada: ' + (titleEs ? titleEs.textContent : 'actividad familiar') + '. ¡Insignia de Explorador del Hogar desbloqueada!',
    );
  }
  if (celebrate && index >= 0) {
    if (typeof triggerConfettiBurst === 'function') triggerConfettiBurst(null, null, 45);
    if (typeof playSuccessArpeggio === 'function') playSuccessArpeggio();
  }
}

function pickFamilyMission() {
  var cards = Array.from(document.querySelectorAll('[data-family-activity]'));
  if (!cards.length) return;
  var index = Math.floor(Math.random() * cards.length);
  cards.forEach(function (card, cardIndex) {
    card.open = cardIndex === index;
    card.classList.toggle('is-mission-picked', cardIndex === index);
    if (cardIndex === index) { var alternatives = card.closest('.family-mission-alternatives'); if (alternatives) alternatives.open = true; }
  });
  var titleEn = cards[index].querySelector('.fam-act-titles .lang-en');
  var titleEs = cards[index].querySelector('.fam-act-titles .lang-es');
  setBiText(
    document.getElementById('family_mission_status'),
    "Tonight's mission: " + (titleEn ? titleEn.textContent : 'family activity') + '.',
    'Misión de hoy: ' + (titleEs ? titleEs.textContent : 'actividad familiar') + '.',
  );
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  cards[index].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
}

function completeFamilyMission(index) {
  var current = -1;
  try {
    var saved = localStorage.getItem(familyMissionStorageKey());
    if (saved !== null) current = Number(saved);
  } catch (e) {}
  var next = current === index ? -1 : index;
  try {
    if (next >= 0) localStorage.setItem(familyMissionStorageKey(), String(next));
    else localStorage.removeItem(familyMissionStorageKey());
  } catch (e) {}
  showFamilyMissionState(next, next >= 0);
}

function restoreFamilyMission() {
  var index = -1;
  try {
    var saved = localStorage.getItem(familyMissionStorageKey());
    if (saved !== null) index = Number(saved);
  } catch (e) {}
  showFamilyMissionState(Number.isInteger(index) ? index : -1, false);
}

/* Tonight's Path roadmap: light up the current stop, keep a persistent check
   on every stop the family has visited for THIS lesson. */
/* Progress lives ON the tab bar now, not on a second rail underneath it: each
   tab gets a tick once it has been opened, and the hairline under the bar fills
   to the furthest stop reached. One control, one answer to "where are we". */
/* A stop is ticked when the family moves ON from it. Ticking on arrival put a
   ✓ on Learn the moment any page opened, before anything had been read. */
function updateJourneyMap(tabId, leftTabId) {
  const tabs = Array.from(document.querySelectorAll('.homework-tab-btn')).filter(function (btn) { return !btn.hidden; });
  if (!tabs.length) return;
  let visited = {};
  try { visited = JSON.parse(localStorage.getItem(journeyStorageKey()) || '{}') || {}; } catch (e) {}
  if (leftTabId && !visited[leftTabId]) {
    visited[leftTabId] = true;
    try { localStorage.setItem(journeyStorageKey(), JSON.stringify(visited)); } catch (e) {}
  }
  let furthest = -1;
  tabs.forEach(function (btn, i) {
    const id = btn.dataset.tab;
    const done = !!visited[id];
    btn.classList.toggle('is-done', done);
    if (done || id === tabId) furthest = i;
  });
  const fill = document.getElementById('hw_tab_track_fill');
  if (fill) {
    const pct = furthest <= 0 ? 0 : (furthest / (tabs.length - 1)) * 100;
    fill.style.width = pct + '%';
  }
}

/* Help is a drawer over the current stop, not a place you travel to. Opening it
   never takes a family off the problem they are stuck on. */
function toggleHelpDrawer() {
  const drawer = document.getElementById('hw_help_drawer');
  const fab = document.getElementById('hw_stuck_fab');
  if (!drawer) return;
  const open = drawer.hidden;
  drawer.hidden = !open;
  document.body.classList.toggle('hw-drawer-open', open);
  if (fab) fab.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    drawer.querySelector('.hw-help-drawer-close')?.focus();
  } else if (fab) {
    fab.focus();
  }
}

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  const drawer = document.getElementById('hw_help_drawer');
  if (drawer && !drawer.hidden) toggleHelpDrawer();
});

function syncHomeworkChromeHeights() {
  const status = document.querySelector('.bottom-status-bar');
  const tabBar = document.querySelector('.homework-tab-bar');
  const statusH = status ? Math.ceil(status.getBoundingClientRect().height) : 104;
  const tabH = tabBar ? Math.ceil(tabBar.getBoundingClientRect().height) : 72;
  document.documentElement.style.setProperty('--hw-status-height', statusH + 'px');
  document.documentElement.style.setProperty('--hw-tab-height', tabH + 'px');
  // Tab bar is a sticky TOP bar, so only the BOTTOM chrome needs reserving —
  // but that is the status bar AND the floating pills stacked above it. The
  // status bar now shows only on the Check stop, so on every other stop the
  // reservation was 16px and the two pills sat on top of the panel's own
  // "Next" button: on Together the Stuck? pill covered "Next: Try the
  // problems". Measure the tallest floating control's real top edge instead.
  var floatTop = 0;
  // The math keypad is a bottom-fixed control like the pills, and the tallest
  // one when it is open; left out, the last answer field on a stop sat under it.
  document.querySelectorAll('.hw-stuck-fab, #nsr-root, .mathpad:not([hidden])').forEach(function (el) {
    if (window.getComputedStyle(el).position !== 'fixed') return;
    var r = el.getBoundingClientRect();
    if (r.height) floatTop = Math.max(floatTop, Math.ceil(window.innerHeight - r.top));
  });
  document.body.style.paddingBottom = (Math.max(statusH, floatTop) + 24) + 'px';
}

/* Set once the page has restored its stop. Before that, switching tabs is the
   page booting, not the family moving: focusing and scrolling the tab button
   then opened every homework page ~970px down, past its title and the
   20/30-minute choice. */
var hwTabsBooted = false;

/* Back and Next move through the stops of the family's route, one stop at a time.
   Panels are hidden, never rebuilt, so every answer survives the move. */
function hwStopStep(delta) {
  var tabs = activeHomeworkRoute().tabs;
  var next = tabs[tabs.indexOf(document.body.dataset.activeTab) + delta];
  if (next) switchHomeworkTab(next);
}

/* Learn is a run of cards: one idea, one next action. The pager replaces the stop
   bar while Learn is open; its last Next moves on to the next stop. */
var learnCardIndex = 0;

function learnCardList() {
  var panel = document.querySelector('[data-tab-panel="learn"]');
  if (!panel) return [];
  return Array.from(panel.querySelectorAll(':scope > .learn-card')).filter(function (c) {
    return (c.innerText || '').trim() !== '' || !!c.querySelector('svg, canvas, button, iframe, input');
  });
}

function ensureLearnPager(panel) {
  var pager = document.getElementById('hw_learn_pager');
  if (pager || !panel) return pager;
  pager = document.createElement('div');
  pager.id = 'hw_learn_pager';
  pager.className = 'learn-pager';
  pager.innerHTML =
    '<div class="learn-pager-dots" aria-hidden="true"></div>' +
    '<p class="learn-pager-label" aria-live="polite"><span class="lang-en"></span><span class="lang-es" lang="es"></span></p>' +
    '<div class="learn-pager-actions">' +
    '<button type="button" class="btn btn-outline-primary learn-pager-back" data-act="learnStep" data-args="[-1]"><span class="lang-en">← Back</span><span class="lang-es" lang="es">← Atrás</span></button>' +
    '<button type="button" class="btn btn-primary learn-pager-next" data-act="learnStep" data-args="[1]"><span class="lang-en">Next →</span><span class="lang-es" lang="es">Siguiente →</span></button>' +
    '</div>';
  panel.insertBefore(pager, panel.querySelector(':scope > .learn-card') || panel.firstChild);
  /* Swipe left for the next card, right for the previous one (one listener, on the panel). */
  var touchX = null, touchY = null;
  panel.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
  panel.addEventListener('touchend', function (e) {
    if (touchX === null || document.body.dataset.activeTab !== 'learn') return;
    if (e.target.closest && e.target.closest('input, select, textarea, svg, canvas, .mathpad, [data-no-swipe]')) { touchX = null; return; }
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    touchX = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) learnStep(dx < 0 ? 1 : -1);
  }, { passive: true });
  return pager;
}

/* A link or chip that points into a card that is not showing opens that card first. */
function revealLearnCardFor(el) {
  var card = el && el.closest ? el.closest('.learn-card') : null;
  if (!card || !card.hidden) return;
  var index = learnCardList().indexOf(card);
  if (index >= 0) setLearnCard(index, true);
}

document.addEventListener('click', function (e) {
  var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
  if (!link || link.getAttribute('href').length < 2) return;
  var target = document.getElementById(link.getAttribute('href').slice(1));
  if (target) revealLearnCardFor(target);
}, true);

function learnStep(delta) {
  var cards = learnCardList();
  if (!cards.length) return;
  if (learnCardIndex + delta >= cards.length) {
    if (typeof goNextHomeworkStop === 'function') goNextHomeworkStop('learn');
    return;
  }
  setLearnCard(learnCardIndex + delta, true);
}

function setLearnCard(i, scroll) {
  var panel = document.querySelector('[data-tab-panel="learn"]');
  var cards = learnCardList();
  if (!panel || !cards.length) return;
  learnCardIndex = Math.max(0, Math.min(i, cards.length - 1));
  var pager = ensureLearnPager(panel);
  panel.querySelectorAll(':scope > .learn-card').forEach(function (c) { c.hidden = true; });
  cards.forEach(function (c, k) { c.hidden = k !== learnCardIndex; });
  panel.querySelectorAll('.learn-jump-row').forEach(function (n) { n.hidden = true; });
  var card = cards[learnCardIndex];
  var last = learnCardIndex >= cards.length - 1;
  var dots = pager.querySelector('.learn-pager-dots');
  dots.innerHTML = cards.map(function (c, k) { return '<span class="learn-pager-dot' + (k === learnCardIndex ? ' is-on' : (k < learnCardIndex ? ' is-done' : '')) + '"></span>'; }).join('');
  var label = pager.querySelector('.learn-pager-label');
  label.querySelector('.lang-en').textContent = 'Card ' + (learnCardIndex + 1) + ' of ' + cards.length + ' · ' + (card.dataset.cardEn || '');
  label.querySelector('.lang-es').textContent = 'Tarjeta ' + (learnCardIndex + 1) + ' de ' + cards.length + ' · ' + (card.dataset.cardEs || '');
  var backBtn = pager.querySelector('.learn-pager-back');
  if (learnCardIndex === 0 && document.activeElement === backBtn) pager.querySelector('.learn-pager-next').focus();
  backBtn.hidden = learnCardIndex === 0;
  var next = pager.querySelector('.learn-pager-next');
  next.querySelector('.lang-en').textContent = last ? 'Next stop →' : 'Next: ' + (cards[learnCardIndex + 1].dataset.cardEn || '') + ' →';
  next.querySelector('.lang-es').textContent = last ? 'Siguiente parada →' : 'Siguiente: ' + (cards[learnCardIndex + 1].dataset.cardEs || '') + ' →';
  var stopNav = document.querySelector('.hw-stop-nav');
  if (stopNav) stopNav.hidden = true;
  pager.hidden = false;
  if (scroll && card && card.scrollIntoView) card.scrollIntoView({ block: 'start', behavior: (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'auto' : 'smooth' });
}

function updateStopNav(tabId) {
  var tabs = activeHomeworkRoute().tabs;
  var i = tabs.indexOf(tabId);
  var back = document.getElementById('hw_stop_back');
  var next = document.getElementById('hw_stop_next');
  var here = document.getElementById('hw_stop_here');
  var bar = document.querySelector('.hw-stop-nav');
  if (bar) bar.hidden = tabId === 'learn' && learnCardList().length > 0;
  if (back) back.hidden = i <= 0;
  if (next) next.hidden = i < 0 || i >= tabs.length - 1;
  if (here && i >= 0) here.textContent = (i + 1) + ' / ' + tabs.length;
}

document.addEventListener('DOMContentLoaded', function () {
  if (document.body.dataset.activeTab === 'learn') setLearnCard(0);
});

function switchHomeworkTab(tabId) {
  const leaving = document.body.dataset.activeTab;
  const allTabs = document.querySelectorAll('.homework-tab-btn');
  const tabs = Array.from(allTabs).filter(function (btn) { return !btn.hidden; });
  const extras = document.querySelectorAll('.homework-tab-extra');
  const panels = document.querySelectorAll('[data-tab-panel]');
  let idx = 0;
  extras.forEach(function(btn) {
    const active = btn.dataset.tab === tabId;
    btn.classList.toggle('is-active', active);
    if (active) btn.setAttribute('aria-current', 'step');
    else btn.removeAttribute('aria-current');
  });
  allTabs.forEach(function(btn) {
    if (!btn.hidden) return;
    btn.classList.remove('is-active');
    btn.removeAttribute('aria-current');
  });
  tabs.forEach(function(btn, i) {
    const active = btn.dataset.tab === tabId;
    btn.classList.toggle('is-active', active);
    if (active) {
      idx = i + 1;
      btn.setAttribute('aria-current', 'step');
    } else {
      btn.removeAttribute('aria-current');
    }
  });
  panels.forEach(function(p) {
    p.hidden = p.dataset.tabPanel !== tabId;
  });
  document.body.dataset.activeTab = tabId;
  updateStopNav(tabId);
  if (tabId === 'learn') setLearnCard(learnCardIndex);
  // Practice is inside the Check panel. Recalculate only after that panel is
  // visible so route-aware scoring sees the two or six active core problems
  // instead of treating every problem as hidden behind its tab panel.
  if (tabId === 'check' && typeof updateProgress === 'function') updateProgress();
  // The bottom bar exists on one stop, so its height changes as you move
  // between them, and the floating controls are positioned off that height.
  if (typeof syncHomeworkChromeHeights === 'function') syncHomeworkChromeHeights();
  // "3 of 6" and the minutes left describe tonight's PATH. An extra stop is not
  // on it, so idx is 0 and both readings are left showing the last numbered
  // stop the family was on, rather than reporting "0 of 6" and reading
  // tabs[-1].dataset for the time sum.
  if (idx > 0) {
    const prog = document.getElementById('hw_tab_progress');
    const total = document.querySelector('.homework-tabs-shell')?.dataset.tabCount
      || String(tabs.length);
    if (prog) prog.textContent = idx + ' of ' + total + ' / ' + idx + ' de ' + total;
    const fill = document.getElementById('tab_progress_fill');
    if (fill) fill.style.width = ((idx / parseInt(total, 10)) * 100) + '%';

  }

  if (typeof updateJourneyMap === 'function') updateJourneyMap(tabId, leaving !== tabId ? leaving : '');
  if (typeof playTabSwitchSound === 'function') playTabSwitchSound();
  if (tabId === 'done' && typeof updateCelebrationTab === 'function') {
    updateCelebrationTab();
  }
  if (tabId === 'words' && !window.hwVocabQuizReady && typeof startVocabQuiz === 'function') { startVocabQuiz(); window.hwVocabQuizReady = true; }
  if (tabId === 'play' && !window.hwFamilyGamesReady) { initFamilyGames(); window.hwFamilyGamesReady = true; }
  if (tabId === 'photobooth' && typeof initPhotobooth === 'function') {
    initPhotobooth();
  } else if (typeof stopPhotoboothStream === 'function') {
    stopPhotoboothStream();
  }
  const activeBtn = document.getElementById('hw_tab_' + tabId);
  if (activeBtn && hwTabsBooted) {
    activeBtn.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
    activeBtn.focus({ preventScroll: true });
  }
  try { localStorage.setItem(lastTabStorageKey(), tabId); } catch(e) {}
  if (typeof initHomeworkVocabPopups === 'function') {
    initHomeworkVocabPopups();
  }
}

function openHelpModalFromBtn(btn) {
  try {
    const data = JSON.parse(btn.getAttribute('data-help') || '{}');
    openHelpModal(data);
  } catch(e) {}
}

function openHelpModal(data) {
  const overlay = document.getElementById('help_modal_overlay');
  if (!overlay) return;
  document.getElementById('help_modal_title').textContent =
    (data.titleEn || 'Help') + ' / ' + (data.titleEs || 'Ayuda');
  document.getElementById('help_modal_en').textContent = data.en || '';
  document.getElementById('help_modal_es').textContent = data.es || '';
  var vis = document.getElementById('help_modal_visual');
  if (vis) {
    if (data.visual) { vis.innerHTML = data.visual; vis.hidden = false; }
    else { vis.innerHTML = ''; vis.hidden = true; }
  }
  var frame = document.getElementById('help_modal_frame');
  if (frame) {
    if (data.frameEn || data.frameEs) {
      document.getElementById('help_modal_frame_en').textContent = data.frameEn || '';
      document.getElementById('help_modal_frame_es').textContent = data.frameEs || '';
      frame.hidden = false;
    } else {
      frame.hidden = true;
    }
  }
  overlay.hidden = false;
  document.body.classList.add('help-modal-open');
  overlay.querySelector('.help-modal-close')?.focus();
}

function closeHelpModal(ev) {
  if (ev && ev.target !== ev.currentTarget) return;
  const overlay = document.getElementById('help_modal_overlay');
  if (overlay) overlay.hidden = true;
  document.body.classList.remove('help-modal-open');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeHelpModal();
});

function triggerCelebration() {
  document.querySelector('.section-celebrate')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* The document language has to move WITH the toggle. It used to stay lang="en"
   in Spanish mode, so a screen reader read a fully Spanish page with English
   phonemes and browser auto-translate mis-fired on it. Bilingual stays "en":
   the page's own prose is English and the Spanish half already carries its own
   lang="es" on every .lang-es span. */
function syncDocumentLanguage(mode) {
  document.documentElement.lang = mode === 'es' ? 'es' : 'en';
}

/* English and Spanish are the languages this page is WRITTEN in — every string
   on it is a .lang-en / .lang-es pair. Kreyol, Portugues and Arabic were also
   offered, and picking one set a body class no stylesheet reads: the page
   stayed bilingual, so the buttons promised a translation that does not exist.
   Arabic additionally flipped the document to RTL, mirroring the layout of a
   page still written left-to-right. Removed rather than stubbed, because an
   offer a family cannot use is worse than no offer. */
function setLanguageMode(mode) {
  if (mode !== 'en' && mode !== 'es' && mode !== 'bilingual') mode = 'en';
  try { localStorage.setItem('hw_lang_mode', mode); } catch(e) {}
  document.body.classList.remove('lang-mode-bilingual', 'lang-mode-en', 'lang-mode-es');
  document.body.classList.add('lang-mode-' + mode);
  syncDocumentLanguage(mode);
  document.body.dataset.homeworkLanguage = mode;
  var saveLabel = document.querySelector('.nsr-launcher-label');
  if (saveLabel) saveLabel.textContent = mode === 'es' ? 'Guardar / Continuar' : 'Save / Resume';
  initHomeworkShareLinks();
  document.querySelectorAll('[data-aria-en]').forEach(function (el) { el.setAttribute('aria-label', mode === 'es' ? el.dataset.ariaEs : el.dataset.ariaEn); });
  document.querySelectorAll('[data-title-en]').forEach(function (el) { el.setAttribute('title', mode === 'es' ? el.dataset.titleEs : el.dataset.titleEn); });
  document.querySelectorAll('[data-placeholder-en]').forEach(function (el) { el.setAttribute('placeholder', mode === 'es' ? el.dataset.placeholderEs : el.dataset.placeholderEn); });
  document.querySelectorAll('.lang-toggle-btn').forEach(function(btn) {
    const active = btn.getAttribute('data-lang-mode') === mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  document.querySelectorAll('.hw-hud-lang-btn').forEach(function(btn) {
    const active = btn.getAttribute('data-lang-mode') === mode;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function openConceptZoom(btn) {
  var wrap = btn && btn.closest('.concept-visual-wrap');
  var target = wrap && (wrap.querySelector('svg') || wrap.querySelector('img'));
  if (target && typeof window.openHomeworkLightbox === 'function') {
    window.openHomeworkLightbox(target, btn);
    return;
  }
  var svg = wrap && wrap.querySelector('svg');
  if (!svg || typeof HTMLDialogElement === 'undefined') return;
  var dlg = document.getElementById('hw_concept_zoom');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'hw_concept_zoom';
    dlg.className = 'concept-zoom-dialog';
    dlg.dataset.ariaEn = 'Enlarged picture';
    dlg.dataset.ariaEs = 'Imagen ampliada';
    dlg.setAttribute('aria-label', document.documentElement.lang === 'es' ? dlg.dataset.ariaEs : dlg.dataset.ariaEn);
    dlg.innerHTML = '<button type="button" class="concept-zoom-close" data-aria-en="Close" data-aria-es="Cerrar" aria-label="' + (document.documentElement.lang === 'es' ? 'Cerrar' : 'Close') + '"><span aria-hidden="true">✕</span> <span class="lang-en">Close</span><span class="lang-es" lang="es">Cerrar</span></button><div class="concept-zoom-body"></div>';
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('.concept-zoom-close')) dlg.close();
    });
    document.body.appendChild(dlg);
  }
  var copy = svg.cloneNode(true);
  copy.removeAttribute('width');
  copy.removeAttribute('height');
  dlg.querySelector('.concept-zoom-body').replaceChildren(copy);
  dlg.showModal();
}

function preparePaperPractice() {
  hwNotice("For offline work, print now or choose Save as PDF in the print dialog. Open the saved PDF before disconnecting. This website has not downloaded an offline copy. / Para trabajar sin internet, imprime ahora o elige Guardar como PDF. Abre el PDF guardado antes de desconectarte. Este sitio no ha descargado una copia sin conexión.", 9000);
  printProblemsOnly();
}
window.preparePaperPractice = preparePaperPractice;

var currentVoiceMemoData = '';
var voiceMediaRecorder = null;
var voiceAudioChunks = [];
var voiceRecordTimer = null;
var voiceRecordSeconds = 0;

function toggleVoiceRecording() {
  if (voiceMediaRecorder && voiceMediaRecorder.state === 'recording') {
    voiceMediaRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    hwNotice("Audio recording is not supported in this browser. / La grabación no es compatible en este navegador.");
    return;
  }
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
    voiceAudioChunks = [];
    voiceMediaRecorder = new MediaRecorder(stream);
    voiceMediaRecorder.ondataavailable = function(e) {
      if (e.data && e.data.size > 0) voiceAudioChunks.push(e.data);
    };
    voiceMediaRecorder.onstop = function() {
      clearInterval(voiceRecordTimer);
      var timerEl = document.getElementById('voice_timer');
      if (timerEl) timerEl.style.display = 'none';
      var labelEl = document.getElementById('record_voice_label');
      if (labelEl) labelEl.innerHTML = '<span class="lang-en">Record Again</span><span class="lang-es" lang="es">Grabar otra vez</span>';
      var iconEl = document.getElementById('record_voice_icon');
      if (iconEl) iconEl.textContent = '🎙️';
      stream.getTracks().forEach(function(t) { t.stop(); });

      var blob = new Blob(voiceAudioChunks, { type: 'audio/webm' });
      var reader = new FileReader();
      reader.onload = function(evt) {
        currentVoiceMemoData = evt.target.result;
        var player = document.getElementById('voice_audio_player');
        var wrap = document.getElementById('voice_player_wrap');
        if (player && wrap) {
          player.src = currentVoiceMemoData;
          wrap.style.display = 'inline-flex';
        }
      };
      reader.readAsDataURL(blob);
    };

    voiceMediaRecorder.start();
    voiceRecordSeconds = 0;
    var timerEl = document.getElementById('voice_timer');
    if (timerEl) {
      timerEl.textContent = '0:00';
      timerEl.style.display = 'inline';
    }
    var labelEl = document.getElementById('record_voice_label');
    if (labelEl) labelEl.innerHTML = '<span class="lang-en">Stop (Recording...)</span><span class="lang-es" lang="es">Detener (Grabando...)</span>';
    var iconEl = document.getElementById('record_voice_icon');
    if (iconEl) iconEl.textContent = '⏹️';

    voiceRecordTimer = setInterval(function() {
      voiceRecordSeconds++;
      if (timerEl) {
        var m = Math.floor(voiceRecordSeconds / 60);
        var s = voiceRecordSeconds % 60;
        timerEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      }
      if (voiceRecordSeconds >= 30) {
        if (voiceMediaRecorder && voiceMediaRecorder.state === 'recording') {
          voiceMediaRecorder.stop();
        }
      }
    }, 1000);
  }).catch(function() {
    hwNotice("Microphone access was blocked. Please allow mic permissions to record. / Se bloqueó el acceso al micrófono.");
  });
}
window.toggleVoiceRecording = toggleVoiceRecording;

function deleteVoiceRecording() {
  currentVoiceMemoData = '';
  var player = document.getElementById('voice_audio_player');
  var wrap = document.getElementById('voice_player_wrap');
  if (player && wrap) {
    player.src = '';
    wrap.style.display = 'none';
  }
}
window.deleteVoiceRecording = deleteVoiceRecording;

function toggleSignoffSubmitBtn() {
  var submitBtn = document.getElementById('submit_signoff_btn');
  if (submitBtn) submitBtn.disabled = false;
}

function homeworkShareUrl() {
  /* The lesson page, the route, the language and the class section (the hub's class
     link). A copied link carries nothing else from the address bar: no answers, no
     Canvas or SCORM launch parameters, no tracking. */
  var route = normalizeHomeworkRoute(document.body.dataset.homeworkRoute);
  var url = new URL(window.location.origin + window.location.pathname);
  var section = new URLSearchParams(window.location.search).get('section');
  if (section) url.searchParams.set('section', section);
  url.searchParams.set('route', route);
  url.searchParams.set('lang', document.body.dataset.homeworkLanguage || preferredLanguageMode());
  return url.href;
}

function copyHomeworkLink() {
  var url = homeworkShareUrl();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function() {
      hwNotice("Link copied with your route and language. / Enlace copiado con tu ruta e idioma.");
    }).catch(function() { hwToast('Copy this link: ' + url, 'Copia este enlace: ' + url, 12000); });
  } else hwToast('Copy this link: ' + url, 'Copia este enlace: ' + url, 12000);
}

function startHomework() {
  var last = document.body.dataset.activeTab || 'learn';
  switchHomeworkTab(last);
  var panel = document.getElementById('hw_panel_' + last);
  if (!panel) return;
  panel.scrollIntoView({ block: 'start', behavior: typeof hwReducedMotion === 'function' && hwReducedMotion() ? 'auto' : 'smooth' });
  panel.setAttribute('tabindex', '-1');
  panel.focus({ preventScroll: true });
}

function printProblemsOnly() {
  document.body.classList.add('print-problems-only');
  window.print();
  setTimeout(function() {
    document.body.classList.remove('print-problems-only');
  }, 1000);
}

function printAnswerSheet() {
  document.body.classList.add('print-answer-sheet');
  window.print();
  setTimeout(function() {
    document.body.classList.remove('print-answer-sheet');
  }, 1000);
}
window.printAnswerSheet = printAnswerSheet;

function printRefrigeratorSheet() {
  document.body.classList.add('print-refrigerator-sheet');
  window.print();
  setTimeout(function() {
    document.body.classList.remove('print-refrigerator-sheet');
  }, 1000);
}
window.printRefrigeratorSheet = printRefrigeratorSheet;

function speakHomeworkText(enText, esText) {
  hwVoice.speak(enText, esText);
}
window.speakHomeworkText = speakHomeworkText;
window.speakSectionText = speakHomeworkText;

function selectFeeling(btn, feeling) {
  document.querySelectorAll('.btn-feeling').forEach(function(b) { b.classList.remove('is-selected'); });
  btn.classList.add('is-selected');
  var input = document.getElementById('family_feeling_input');
  if (input) input.value = feeling;
}
window.selectFeeling = selectFeeling;

var currentWorkPhotoData = '';
function previewWorkPhoto(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      try {
        var canvas = document.createElement('canvas');
        var maxDim = 800;
        var w = img.width;
        var h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        currentWorkPhotoData = canvas.toDataURL('image/jpeg', 0.75);
      } catch (err) {
        currentWorkPhotoData = e.target.result;
      }
      var preview = document.getElementById('work_photo_preview');
      var wrap = document.getElementById('work_photo_preview_wrap');
      if (preview && wrap) {
        preview.src = currentWorkPhotoData;
        wrap.hidden = false;
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
window.previewWorkPhoto = previewWorkPhoto;

function clearWorkPhoto() {
  currentWorkPhotoData = '';
  var input = document.getElementById('student_work_photo_input');
  if (input) input.value = '';
  var wrap = document.getElementById('work_photo_preview_wrap');
  if (wrap) wrap.hidden = true;
}
window.clearWorkPhoto = clearWorkPhoto;

function initHomeworkShareLinks() {
  var url = encodeURIComponent(homeworkShareUrl());
  var title = encodeURIComponent(document.title || "Family Math Homework");
  var textBtn = document.getElementById("hw_text_link");
  if (textBtn) textBtn.href = "sms:?&body=" + title + "%20" + url;
  var emailBtn = document.getElementById("hw_email_link");
  if (emailBtn) emailBtn.href = "mailto:?subject=" + title + "&body=" + title + "%0A%0A" + url;
}

function getFamilyStreakCount() {
  /* The certificate and the Family nights card read one record (hw_family_nights_v1). */
  return Math.max(1, hwStreakCount(new Date()));
}

function saveParentSignoff() {
  const nameVal = document.getElementById('parent_name_input')?.value.trim();
  const noteVal = document.getElementById('parent_note_input')?.value.trim();
  const reflVal = document.getElementById('parent_reflection_input')?.value.trim();
  const feelingVal = document.getElementById('family_feeling_input')?.value || 'smooth';
  const lessonId = window.LESSON_ID || 'general';
  const lessonTitle = window.LESSON_TITLE || "Tonight's Lesson";
  
  
  const signoffDate = new Date().toLocaleDateString(undefined, { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
  
  // Signing off counts as a family night.
  hwRecordNight();
  hwRenderNights();

  const payload = {
    parentName: nameVal,
    note: noteVal,
    reflection: reflVal,
    feeling: feelingVal,
    photo: currentWorkPhotoData ? 'present' : '',
    photoData: currentWorkPhotoData || '',
    voiceMemoData: currentVoiceMemoData || '',
    date: signoffDate,
    lessonTitle: lessonTitle
  };
  
  var signoffSaved = false;
  try {
    localStorage.setItem('hw_parent_signoff_' + lessonId, JSON.stringify(payload));
    signoffSaved = true;
  } catch(e) {
    hwFreeSignoffMedia(lessonId);
    try {
      localStorage.setItem('hw_parent_signoff_' + lessonId, JSON.stringify(payload));
      signoffSaved = true;
    } catch(e2) {}
  }
  if (!signoffSaved) {
    hwNotice('This reflection could not be saved on this device. Copy it before leaving. / No se pudo guardar esta reflexión. Cópienla antes de salir.');
    return;
  }

  updateSignoffUI(payload);
}

function updateSignoffUI(data) {
  const nameEl = document.getElementById('display_parent_name');
  if (nameEl) nameEl.textContent = data.parentName;
  
  const dateEl = document.getElementById('display_signoff_date');
  if (dateEl) dateEl.textContent = data.date;
  
  const noteBox = document.getElementById('display_parent_note_box');
  const noteEl = document.getElementById('display_parent_note');
  if (noteBox && noteEl) {
    if (data.note) {
      noteEl.textContent = data.note;
      noteBox.hidden = false;
    } else {
      noteBox.hidden = true;
    }
  }

  const reflBox = document.getElementById('display_parent_reflection_box');
  const reflEl = document.getElementById('display_parent_reflection');
  if (reflBox && reflEl) {
    if (data.reflection) {
      reflEl.textContent = data.reflection;
      reflBox.hidden = false;
    } else {
      reflBox.hidden = true;
    }
  }

  const feelingBadge = document.getElementById('display_family_feeling_badge');
  const feelingBox = document.getElementById('display_family_feeling_box');
  if (feelingBadge && feelingBox) {
    if (data.feeling === 'challenge') {
      feelingBadge.innerHTML = '<span class="lang-en">🔴 Tough battle tonight</span><span class="lang-es" lang="es">🔴 Nos costó trabajo hoy</span>';
      feelingBox.hidden = false;
    } else if (data.feeling === 'discussion') {
      feelingBadge.innerHTML = '<span class="lang-en">🟡 Needed some discussion</span><span class="lang-es" lang="es">🟡 Con algo de ayuda</span>';
      feelingBox.hidden = false;
    } else if (data.feeling === 'smooth') {
      feelingBadge.innerHTML = '<span class="lang-en">🟢 Smooth sailing tonight</span><span class="lang-es" lang="es">🟢 ¡Muy bien hoy!</span>';
      feelingBox.hidden = false;
    } else {
      feelingBox.hidden = true;
    }
  }

  const photoBox = document.getElementById('display_family_photo_box');
  const photoEl = document.getElementById('display_family_photo');
  if (photoBox && photoEl) {
    var photoSrc = data.photoData || currentWorkPhotoData;
    if (photoSrc) {
      photoEl.src = photoSrc;
      photoBox.hidden = false;
    } else {
      photoBox.hidden = true;
    }
  }

  const voiceBox = document.getElementById('display_family_voice_box');
  const voicePlayer = document.getElementById('display_family_voice_player');
  if (voiceBox && voicePlayer) {
    var voiceSrc = data.voiceMemoData || currentVoiceMemoData;
    if (voiceSrc) {
      voicePlayer.src = voiceSrc;
      voiceBox.hidden = false;
    } else {
      voiceBox.hidden = true;
    }
  }

  const streakText = document.getElementById('display_family_streak_text');
  if (streakText) {
    var sc = getFamilyStreakCount();
    streakText.innerHTML = '<span class="lang-en">' + sc + (sc === 1 ? ' Night Streak' : ' Nights Streak') + '</span><span class="lang-es" lang="es">Racha de ' + sc + (sc === 1 ? ' noche' : ' noches') + '</span>';
  }
  
  const formWrap = document.getElementById('signoff_form_wrapper');
  const confWrap = document.getElementById('signoff_confirmed_wrapper');
  if (formWrap) formWrap.hidden = true;
  if (confWrap) confWrap.hidden = false;
  
  const printTitle = document.getElementById('print_lesson_title');
  if (printTitle) printTitle.textContent = data.lessonTitle;
  
  const printName = document.getElementById('print_parent_name');
  if (printName) printName.textContent = data.parentName;
  
  const printDate = document.getElementById('print_signoff_date');
  if (printDate) printDate.textContent = data.date.split(' at ')[0];
  
  const printNoteWrapper = document.getElementById('print_parent_note_wrapper');
  const printNote = document.getElementById('print_parent_note');
  if (printNoteWrapper && printNote) {
    if (data.note) {
      printNote.textContent = data.note;
      printNoteWrapper.style.display = 'block';
    } else {
      printNoteWrapper.style.display = 'none';
    }
  }
  
  const printCert = document.getElementById('print_only_certificate');
  if (printCert) printCert.classList.add('is-signed');
}

function editParentSignoff() {
  const formWrap = document.getElementById('signoff_form_wrapper');
  const confWrap = document.getElementById('signoff_confirmed_wrapper');
  if (formWrap) formWrap.hidden = false;
  if (confWrap) confWrap.hidden = true;
  
  const printCert = document.getElementById('print_only_certificate');
  if (printCert) printCert.classList.remove('is-signed');
}

/* One language at a time. A saved or linked "bilingual" predates the single
   English | Español control, so it falls through to the phone's language, as a
   first visit does. Must match the pre-paint bootstrap in generate-homework-html.mjs. */
function preferredLanguageMode() {
  var requested = new URLSearchParams(location.search).get('lang');
  if (requested === 'en' || requested === 'es' || requested === 'bilingual') return requested;
  try {
    const saved = localStorage.getItem('hw_lang_mode');
    if (saved === 'en' || saved === 'es' || saved === 'bilingual') return saved;
  } catch (e) {}
  try {
    const langs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ''];
    if (langs.some(function (l) { return String(l).toLowerCase().indexOf('es') === 0; })) return 'es';
  } catch (e) {}
  return 'en';
}

function restoreParentSignoff() {
  setLanguageMode(preferredLanguageMode());

  const lessonId = window.LESSON_ID || 'general';
  try {
    const saved = localStorage.getItem('hw_parent_signoff_' + lessonId);
    if (saved) {
      const data = JSON.parse(saved);
      const nameInput = document.getElementById('parent_name_input');
      const noteInput = document.getElementById('parent_note_input');
      const reflInput = document.getElementById('parent_reflection_input');
      const checkbox = document.getElementById('parent_reviewed_checkbox');
      if (nameInput) nameInput.value = data.parentName || '';
      if (noteInput) noteInput.value = data.note || '';
      if (reflInput) reflInput.value = data.reflection || '';
      if (checkbox) checkbox.checked = true;
      toggleSignoffSubmitBtn();
      var extrasMore = document.getElementById('homework_extras_more');
      if (extrasMore) extrasMore.open = true;

      updateSignoffUI(data);
    }
  } catch(e) {}
}

function initHomeworkPage() {
  var utilities = document.getElementById("hw_utility_controls");
  var help = document.getElementById("hw_stuck_fab");
  if (utilities && help) utilities.appendChild(help);
  syncHomeworkChromeHeights();
  window.addEventListener('resize', syncHomeworkChromeHeights);
  restoreHomeworkRoute();
  initHomeworkShareLinks();
  // Measure again once fonts and images have settled: a reading taken mid
  // layout reported the status bar three times its rendered height, and the
  // floating launchers are positioned off that number.
  function placeSaveControl() {
    var save = document.getElementById('nsr-root');
    if (!utilities || !save) return false;
    utilities.appendChild(save);
    var saveLabel = save.querySelector('.nsr-launcher-label');
    if (saveLabel && document.body.dataset.homeworkLanguage === 'es') saveLabel.textContent = 'Guardar / Continuar';
    syncHomeworkChromeHeights();
    return true;
  }
  if (!placeSaveControl()) {
    var saveObserver = new MutationObserver(function () {
      if (document.getElementById('nsr-root')) { saveObserver.disconnect(); placeSaveControl(); }
    });
    saveObserver.observe(document.body, { childList: true, subtree: true });
  }
  window.addEventListener('load', syncHomeworkChromeHeights);
  document.querySelectorAll('[data-tab-panel]').forEach(function(p, i) {
    p.hidden = i > 0;
  });
  try {
    localStorage.removeItem('hw_last_tab');
    // The photobooth is a tool beside Done, never a place to resume: a family that last used it
    // had finished, so they continue at Done.
    let last = localStorage.getItem(lastTabStorageKey());
    if (last === 'photobooth') last = 'done';
    const lastBtn = last ? document.getElementById('hw_tab_' + last) : null;
    if (lastBtn && !lastBtn.hidden) {
      switchHomeworkTab(last);
      setBiText(document.getElementById('hw_resume_note'), 'Welcome back. Your saved plan and answers are on this device. Continue at ' + lastBtn.querySelector('.tab-en').textContent + '.', 'Bienvenidos de nuevo. Su plan y sus respuestas están guardados en este dispositivo. Continúen en ' + lastBtn.querySelector('.tab-es').textContent + '.');
    }
    else switchHomeworkTab('learn');
  } catch(e) {}
  setTimeout(function () { hwTabsBooted = true; }, 0);
  restoreParentSignoff();
  initHomeworkShareLinks();
  var start = document.getElementById('hw_start_button');
  if (start && document.body.dataset.activeTab !== 'learn') setBiText(start, 'Continue this path', 'Continuar esta ruta');
  restoreFamilyMission();
  initHomeworkVocabPopups();
  // Family games initialize when Play is opened.
  // Entrance motion is opt-in and only after boot: its start state is
  // opacity:0, so gating it on this class means a page whose script failed
  // still shows every word instead of an empty cream rectangle.
  document.body.classList.add('hw-motion-ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHomeworkPage);
} else {
  initHomeworkPage();
}

// Tap-to-define vocab glossary. Mirrors the lesson engine's underlineVocabTerms +
// objective-term popup so math words in the family notes/practice get the SAME
// simple EN/ES definition + picture. All term matching (regex source + normalized
// lookup, including prime/composite-style aliases) is precomputed in Node and
// handed over as window.__HW_VOCAB_MATCH__, so the browser only walks text nodes.
function initHomeworkVocabPopups() {
  // The page inlines only this lesson's own entries; the rest of the glossary
  // is one cached file shared by every lesson (window.__HW_VOCAB_SHARED__).
  // __HW_VOCAB_SKIP__ lists the shared entries the lesson entries replace.
  var head = Array.isArray(window.__HW_VOCAB__) ? window.__HW_VOCAB__ : [];
  var shared = Array.isArray(window.__HW_VOCAB_SHARED__) ? window.__HW_VOCAB_SHARED__ : [];
  var skip = Object.create(null);
  (window.__HW_VOCAB_SKIP__ || []).forEach(function(i) { skip[i] = true; });
  var list = head.concat(shared.filter(function(_e, i) { return !skip[i]; }));
  var match = window.__HW_VOCAB_MATCH__ || null;
  var container = document.getElementById('hw_tab_panels');
  if (!container || !list.length || !match || !match.regexSource) return;
  var lookup = match.lookup || {};
  // Mirrors normalizeVocabSurface in engine/core/vocab-match.js, which built the
  // lookup keys: lowercase, collapse spaces, and undo the plural — including the
  // "-y" head that takes "-ies" ("identity properties" -> "identity property").
  function norm(s) {
    var t = String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
    if (/[^aeiou]ies$/.test(t)) return t.replace(/ies$/, 'y');
    return t.replace(/s$/, '');
  }
  // Mirrors surfaceMatchesEntry: an acronym entry answers only to its exact
  // written form, so "MAD" opens the popup and "mad" in a sentence never does.
  function surfaceFits(surface, entry) {
    if (!entry || !entry.cs) return true;
    return String(surface || '').replace(/(?:es|s)$/, '') === String(entry.term);
  }
  var re = new RegExp(match.regexSource, 'gi');
  // Never rewrite inside controls, inputs, the vocab flashcards (already defined
  // there), an already-wrapped term, or the popup itself.
  var EXCL = 'button, a[href], input, textarea, select, option, label, summary, script, style, svg, code, kbd, .obj-term, .obj-popup-backdrop, .vocab-card, .vocab-container, [data-no-vocab]'
    // Headings, badges and chips are LABELS. A dotted underline inside
    // "⚡ SKILL POWER-UP" or "📖 What we're learning tonight" is not an offer of
    // help, it is a heading that has been vandalised — and "POWER" genuinely
    // became a tappable definition button on lesson 6-1 because the bank
    // defines "power" as an exponent.
    + ', h1, h2, h3, h4, .section-title, .fam-game-badge, .fam-game-h3, .step-badge'
    + ', .tier-badge, .spotlight-badge, .workbench-badge, .hw-hero, .hw-hero *'
    + ', .learning-word-chips, .homework-tab-bar, .powerup-badge, .achieve-name';
  var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: function(node) {
      var parent = node.parentElement;
      if (!node.textContent || !node.textContent.trim() || !parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(EXCL)) return NodeFilter.FILTER_REJECT;
      re.lastIndex = 0;
      return re.test(node.textContent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  var nodes = [];
  for (var n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
  // ONCE PER TERM, PER PANEL. The matcher is fed the whole 349-term Grade 6
  // vocabulary bank and used to wrap EVERY occurrence of every hit, which on
  // lesson 6-1 produced 236 dotted-underline buttons — five of them inside one
  // sentence: "we use models to [divide] BOTH ways: a [whole number] divided by
  // a [fraction], and a [fraction] divided by a [whole number]". A page where
  // every other word is a control does not read as helpful, it reads as
  // technical, and the second offer of the same definition helps nobody. The
  // first sighting in each panel keeps the link; the rest stay plain text.
  var seenInPanel = Object.create(null);
  nodes.forEach(function(textNode) {
    var panel = textNode.parentElement && textNode.parentElement.closest('[data-tab-panel]');
    var panelId = (panel && panel.dataset.tabPanel) || '_';
    var text = textNode.textContent;
    var frag = document.createDocumentFragment();
    var cursor = 0, changed = false, m;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      var key = norm(m[0]);
      var idx = Object.prototype.hasOwnProperty.call(lookup, key) ? lookup[key] : -1;
      if (idx < 0 || !surfaceFits(m[0], list[idx])) continue;
      // The matcher's word boundaries are ASCII: JS \\b treats an accented
      // letter as a non-word character, so "rate" matched INSIDE the Spanish
      // "asegurate" (written with an accent) and turned the middle of a Spanish
      // sentence into a definition button. Re-check both edges against Unicode
      // letters before wrapping anything.
      var before = m.index > 0 ? text.charAt(m.index - 1) : '';
      var after = text.charAt(m.index + m[0].length);
      // Escaped twice on purpose: this file is the CSS/JS source, emitted through
      // a template literal, so a single backslash here reaches the page as none.
      if ((before && /\\p{L}/u.test(before)) || (after && /\\p{L}/u.test(after))) continue;
      var seenKey = panelId + '|' + key;
      if (seenInPanel[seenKey]) continue;
      seenInPanel[seenKey] = true;
      frag.appendChild(document.createTextNode(text.slice(cursor, m.index)));
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'obj-term';
      btn.setAttribute('data-term-idx', String(idx));
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.setAttribute('aria-label', document.body.classList.contains('lang-mode-es') ? m[0] + ': abrir definición' : document.body.classList.contains('lang-mode-bilingual') ? m[0] + ': open definition / abrir definición' : m[0] + ': open definition');
      btn.textContent = m[0];
      frag.appendChild(btn);
      cursor = m.index + m[0].length;
      changed = true;
    }
    if (!changed) return;
    frag.appendChild(document.createTextNode(text.slice(cursor)));
    textNode.parentNode.replaceChild(frag, textNode);
  });

  var backdrop = null, lastFocus = null, keyHandler = null;
  function closePopup() {
    var bd = window.__hwVocabBackdrop || backdrop;
    if (!bd) return;
    bd.setAttribute('hidden', '');
    bd.hidden = true;
    bd.style.display = 'none';
    document.body.classList.remove('obj-popup-open');
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus(); } catch(_e) {}
    }
    lastFocus = null;
  }
  window.__closeHwVocabPopup = closePopup;

  function getPopup() {
    if (window.__hwVocabBackdrop && document.body.contains(window.__hwVocabBackdrop)) {
      backdrop = window.__hwVocabBackdrop;
      return backdrop;
    }
    backdrop = document.createElement('div');
    backdrop.className = 'obj-popup-backdrop';
    backdrop.setAttribute('hidden', '');
    backdrop.hidden = true;
    backdrop.style.display = 'none';
    backdrop.innerHTML =
      '<div class="obj-popup" role="dialog" aria-modal="true" aria-labelledby="hw-obj-term">' +
      '<button type="button" class="obj-popup-close" aria-label="Close" data-act="hwCloseVocabPopup">&times;</button>' +
      '<h3 id="hw-obj-term" class="obj-popup-term"></h3>' +
      '<p class="obj-popup-translation"><span class="obj-popup-tr-label">Español:</span> <span class="obj-popup-tr-es" lang="es"></span></p>' +
      '<p class="obj-popup-def"></p>' +
      '<p class="obj-popup-def-es" lang="es"></p>' +
      '<details class="obj-popup-formal" hidden><summary><span class="lang-en">More precisely</span><span class="lang-es" lang="es">Con más precisión</span></summary><p class="obj-popup-formal-en"></p><p class="obj-popup-formal-es" lang="es"></p></details>' +
      '<figure class="obj-popup-visual"><img class="obj-popup-img" alt="" /><figcaption class="obj-popup-example"></figcaption></figure>' +
      '</div>';
    document.body.appendChild(backdrop);
    window.__hwVocabBackdrop = backdrop;
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) {
        e.preventDefault();
        e.stopPropagation();
        closePopup();
      }
    });
    var closeBtn = backdrop.querySelector('.obj-popup-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closePopup();
      });
      closeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closePopup();
      });
    }
    return backdrop;
  }
  function openPopup(entry) {
    if (!entry) return;
    var bd = getPopup();
    bd.querySelector('.obj-popup-term').textContent = entry.term ? String(entry.term) : '';
    var trRow = bd.querySelector('.obj-popup-translation');
    var trEs = bd.querySelector('.obj-popup-tr-es');
    if (entry.termEs) { trEs.textContent = String(entry.termEs); trRow.hidden = false; }
    else { trEs.textContent = ''; trRow.hidden = true; }
    var img = bd.querySelector('.obj-popup-img');
    if (entry.img) { img.src = entry.img; img.alt = entry.imgAlt || ''; img.hidden = false; }
    else { img.removeAttribute('src'); img.alt = ''; img.hidden = true; }
    var ex = bd.querySelector('.obj-popup-example');
    ex.textContent = entry.example ? String(entry.example) : '';
    ex.hidden = !entry.example;
    var fig = bd.querySelector('.obj-popup-visual');
    if (fig) fig.hidden = !entry.img && !entry.example;
    bd.querySelector('.obj-popup-def').textContent = entry.def ? String(entry.def) : '';
    var esEl = bd.querySelector('.obj-popup-def-es');
    if (entry.defEs) { esEl.textContent = String(entry.defEs); esEl.hidden = false; }
    else { esEl.textContent = ''; esEl.hidden = true; }
    var fm = bd.querySelector('.obj-popup-formal');
    if (fm) {
      fm.open = false;
      fm.querySelector('.obj-popup-formal-en').textContent = entry.formal ? String(entry.formal) : '';
      fm.querySelector('.obj-popup-formal-es').textContent = entry.formalEs ? String(entry.formalEs) : '';
      fm.hidden = !entry.formal && !entry.formalEs;
    }
    lastFocus = document.activeElement;
    bd.removeAttribute('hidden');
    bd.hidden = false;
    bd.style.display = 'flex';
    document.body.classList.add('obj-popup-open');
    var cb = bd.querySelector('.obj-popup-close');
    if (cb && cb.focus) cb.focus();
    var closeBtn = bd.querySelector('.obj-popup-close');
    if (closeBtn) closeBtn.setAttribute('aria-label', document.body.classList.contains('lang-mode-es') ? 'Cerrar' : document.body.classList.contains('lang-mode-bilingual') ? 'Close / Cerrar' : 'Close');
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = function(e) {
      if (e.key === 'Escape') { closePopup(); return; }
      if (e.key !== 'Tab') return;
      /* The popup is modal: Tab stays inside it. */
      var items = Array.prototype.filter.call(bd.querySelectorAll('button, summary, [href], [tabindex]:not([tabindex="-1"])'), function (el) { return el.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!bd.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keyHandler);
  }
  if (container.__hwTermClick) container.removeEventListener('click', container.__hwTermClick);
  container.__hwTermClick = function(e) {
    var btn = e.target && e.target.closest ? e.target.closest('.obj-term') : null;
    if (!btn || !container.contains(btn)) return;
    e.preventDefault();
    var idx = Number(btn.getAttribute('data-term-idx'));
    if (Number.isInteger(idx)) openPopup(list[idx]);
  };
  container.addEventListener('click', container.__hwTermClick);
}

/* ── Photobooth Studio with Math Work ─────────────────────────────────── */
/* This is a camera pointed at a notebook page on a family's phone, so every
   path that can fail has to fail politely: a denied permission, a browser with
   no getUserMedia, a tab switch mid-countdown, an iPad that will not download a
   data: URL. Two rules keep it honest — the viewfinder's three states go
   through one renderer (renderPhotoboothStage) rather than six call sites each
   toggling their own flags, and nothing here ever calls alert(), because a
   blocked dialog strands the whole homework page behind it. */
var pbState = {
  stream: null,
  facingMode: 'user',
  frame: 'champion',
  stickers: [],
  caption: '',
  capturedDataUrl: '',
  countdownTimer: null,
  flashTimer: null,
  cameraRequestId: 0,
  downloadUrl: '',
  exportRequestId: 0,
};

function pbEl(id) { return document.getElementById(id); }

function pbSection() { return document.querySelector('.section-photobooth'); }

function pbDisplayId() {
  var sec = pbSection();
  var id = sec ? sec.getAttribute('data-pb-display-id') : '';
  return id || window.LESSON_ID || '';
}

function setPhotoboothStatus(en, es, tone) {
  var box = pbEl('pb_status');
  if (!box) return;
  if (!en && !es) {
    box.hidden = true;
    box.textContent = '';
    return;
  }
  box.className = 'pb-status' + (tone ? ' is-' + tone : '');
  box.textContent = '';
  var spanEn = document.createElement('span');
  spanEn.className = 'lang-en';
  spanEn.textContent = en || '';
  var spanEs = document.createElement('span');
  spanEs.className = 'lang-es';
  spanEs.setAttribute('lang', 'es');
  spanEs.textContent = es || '';
  box.appendChild(spanEn);
  box.appendChild(spanEs);
  box.hidden = false;
}
window.setPhotoboothStatus = setPhotoboothStatus;

/* The single source of truth for what the viewfinder shows: 'idle' (the
   placeholder and its Start Camera button), 'live' (video + frame overlay,
   shutter enabled) or 'captured' (the finished composite + review buttons). */
function renderPhotoboothStage(mode) {
  var isLive = mode === 'live';
  var isShot = mode === 'captured';

  var placeholder = pbEl('pb_idle_placeholder');
  if (placeholder) placeholder.hidden = isLive || isShot;

  var video = pbEl('pb_video');
  if (video) {
    video.hidden = !isLive;
    // Only the selfie camera is mirrored. The rear camera reads the notebook
    // page, and a mirrored preview of writing is unusable.
    if (isLive && pbState.facingMode === 'user') video.classList.add('is-mirrored');
    else video.classList.remove('is-mirrored');
  }

  var overlay = pbEl('pb_frame_overlay');
  if (overlay) overlay.hidden = !isLive;

  var shot = pbEl('pb_captured_img');
  if (shot) shot.hidden = !isShot;

  var live = pbEl('pb_actions_live');
  if (live) live.hidden = isShot;

  var review = pbEl('pb_actions_review');
  if (review) review.hidden = !isShot;

  var snapBtn = pbEl('pb_snap_btn');
  if (snapBtn) snapBtn.disabled = !isLive;

  var flipBtn = pbEl('pb_flip_btn');
  if (flipBtn) flipBtn.disabled = !isLive;
}

function initPhotobooth() {
  var dEl = pbEl('pb_frame_date');
  if (dEl) {
    try {
      dEl.textContent = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch(e) {
      dEl.textContent = 'Tonight';
    }
  }
  var sName = '';
  try {
    var stored = localStorage.getItem('hw_signoff_' + (window.LESSON_ID || location.pathname));
    if (stored) {
      var parsed = JSON.parse(stored);
      if (parsed.student) sName = parsed.student;
    }
  } catch(e) {}
  var capInput = pbEl('pb_caption_input');
  if (capInput && !capInput.value && sName) {
    capInput.value = sName + ' · Math Champion!';
    updatePhotoboothCaption(capInput.value);
  }
  // Re-entering the tab must not resurrect a stale state: if a photo is still
  // held, show it; otherwise show the idle placeholder, never a dead video.
  renderPhotoboothStage(pbState.capturedDataUrl ? 'captured' : 'idle');
}
window.initPhotobooth = initPhotobooth;

function startPhotoboothCamera() {
  if (!window.isSecureContext && location.protocol !== 'file:') {
    setPhotoboothStatus(
      'This page needs a secure (https) connection to open the camera. Use "Upload Work" to pick a photo instead.',
      'Esta página necesita una conexión segura (https) para abrir la cámara. Usen "Subir Foto" para elegir una foto.',
      'warn');
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setPhotoboothStatus(
      'This browser cannot open the camera here. Tap "Upload Work" to pick a photo from your camera roll.',
      'Este navegador no puede abrir la cámara aquí. Toquen "Subir Foto" para elegir una foto del carrete.',
      'warn');
    return;
  }

  // Starting over a running stream leaves the old camera light on, so stop
  // first. stopPhotoboothStream() also clears any countdown still ticking.
  stopPhotoboothStream({ keepStage: true });
  var requestId = pbState.cameraRequestId;

  var startBtn = pbEl('pb_start_btn');
  if (startBtn) startBtn.disabled = true;
  setPhotoboothStatus('Opening the camera…', 'Abriendo la cámara…', 'info');

  var constraints = {
    video: {
      facingMode: pbState.facingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  };

  navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      if (requestId !== pbState.cameraRequestId) {
        stream.getTracks().forEach(function(track) { track.stop(); });
        return;
      }
      pbState.stream = stream;
      var video = pbEl('pb_video');
      if (video) {
        video.srcObject = stream;
        var playing = video.play();
        if (playing && playing.catch) playing.catch(function() {});
      }
      renderPhotoboothStage('live');
      setPhotoboothStatus('', '', '');
      if (startBtn) startBtn.disabled = false;
    })
    .catch(function(err) {
      if (requestId !== pbState.cameraRequestId) return;
      console.warn('Camera access denied or unavailable:', err);
      var name = (err && err.name) || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setPhotoboothStatus(
          'The camera is blocked for this site. Allow camera access in your browser settings, or tap "Upload Work" to choose a photo instead.',
          'La cámara está bloqueada para este sitio. Permitan el acceso en la configuración del navegador, o toquen "Subir Foto" para elegir una foto.',
          'warn');
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setPhotoboothStatus(
          'No camera was found on this device. Tap "Upload Work" to choose a photo of the notebook page.',
          'No se encontró ninguna cámara en este dispositivo. Toquen "Subir Foto" para elegir una foto del cuaderno.',
          'warn');
      } else {
        setPhotoboothStatus(
          'The camera could not start. Tap "Upload Work" to choose a photo of the notebook page instead.',
          'No se pudo iniciar la cámara. Toquen "Subir Foto" para elegir una foto del cuaderno.',
          'warn');
      }
      renderPhotoboothStage(pbState.capturedDataUrl ? 'captured' : 'idle');
      if (startBtn) startBtn.disabled = false;
    });
}
window.startPhotoboothCamera = startPhotoboothCamera;

function cancelPhotoboothCountdown() {
  if (pbState.countdownTimer) {
    clearInterval(pbState.countdownTimer);
    pbState.countdownTimer = null;
  }
  var countdown = pbEl('pb_countdown');
  if (countdown) countdown.hidden = true;
}

function stopPhotoboothStream(opts) {
  pbState.cameraRequestId++;
  var startBtn = pbEl('pb_start_btn');
  if (startBtn) startBtn.disabled = false;
  cancelPhotoboothCountdown();
  if (pbState.stream) {
    try {
      pbState.stream.getTracks().forEach(function(t) { t.stop(); });
    } catch(e) {}
    pbState.stream = null;
  }
  var video = pbEl('pb_video');
  if (video) {
    try { video.srcObject = null; } catch(e) {}
  }
  if (opts && opts.keepStage) return;
  renderPhotoboothStage(pbState.capturedDataUrl ? 'captured' : 'idle');
}
window.stopPhotoboothStream = stopPhotoboothStream;

function flipPhotoboothCamera() {
  pbState.facingMode = (pbState.facingMode === 'user') ? 'environment' : 'user';
  startPhotoboothCamera();
}
window.flipPhotoboothCamera = flipPhotoboothCamera;

function setPhotoboothFrame(frameKey, btn) {
  pbState.frame = frameKey;
  document.querySelectorAll('.pb-frame-btn').forEach(function(b) {
    var on = b === btn;
    b.classList.toggle('is-selected', on);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
  });

  var overlay = pbEl('pb_frame_overlay');
  if (overlay) {
    var wasHidden = overlay.hidden;
    overlay.className = 'pb-frame-overlay frame-' + frameKey;
    overlay.hidden = wasHidden;
  }
  if (pbState.capturedDataUrl) {
    renderPhotoboothComposite();
  }
}
window.setPhotoboothFrame = setPhotoboothFrame;

function togglePhotoboothSticker(emoji) {
  var idx = pbState.stickers.indexOf(emoji);
  if (idx > -1) {
    pbState.stickers.splice(idx, 1);
  } else {
    if (pbState.stickers.length >= 6) {
      pbState.stickers.shift();
    }
    pbState.stickers.push(emoji);
  }
  renderPhotoboothStickers();
  if (pbState.capturedDataUrl) {
    renderPhotoboothComposite();
  }
}
window.togglePhotoboothSticker = togglePhotoboothSticker;

function clearPhotoboothStickers() {
  pbState.stickers = [];
  renderPhotoboothStickers();
  if (pbState.capturedDataUrl) {
    renderPhotoboothComposite();
  }
}
window.clearPhotoboothStickers = clearPhotoboothStickers;

function renderPhotoboothStickers() {
  var layer = pbEl('pb_stickers_layer');
  if (layer) {
    layer.innerHTML = '';
    pbState.stickers.forEach(function(st) {
      var span = document.createElement('span');
      span.className = 'pb-sticker-stamp';
      span.textContent = st;
      layer.appendChild(span);
    });
  }
  document.querySelectorAll('.pb-sticker-chip[data-sticker]').forEach(function(chip) {
    var on = pbState.stickers.indexOf(chip.getAttribute('data-sticker')) > -1;
    chip.classList.toggle('is-selected', on);
    chip.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function updatePhotoboothCaption(val) {
  pbState.caption = val;
  var el = pbEl('pb_frame_title');
  var fallback = pbDisplayId() ? 'Lesson ' + pbDisplayId() : "Tonight's Math Work";
  if (el) el.textContent = val || fallback;
  if (pbState.capturedDataUrl) renderPhotoboothComposite();
}
window.updatePhotoboothCaption = updatePhotoboothCaption;

function snapPhotoboothPicture() {
  var video = pbEl('pb_video');
  if (!pbState.stream || !video) {
    setPhotoboothStatus(
      'Start the camera first, or tap "Upload Work" to choose a photo.',
      'Primero inicien la cámara, o toquen "Subir Foto" para elegir una foto.',
      'warn');
    return;
  }
  if (pbState.countdownTimer) return;

  var countdown = pbEl('pb_countdown');
  var snapBtn = pbEl('pb_snap_btn');
  if (snapBtn) snapBtn.disabled = true;
  setPhotoboothStatus('', '', '');

  var count = 3;
  if (countdown) {
    countdown.textContent = String(count);
    countdown.hidden = false;
  }

  pbState.countdownTimer = setInterval(function() {
    count--;
    if (count > 0) {
      if (countdown) countdown.textContent = String(count);
      return;
    }
    cancelPhotoboothCountdown();
    var flash = pbEl('pb_flash');
    if (flash) {
      flash.hidden = false;
      flash.classList.add('is-active');
      if (pbState.flashTimer) clearTimeout(pbState.flashTimer);
      pbState.flashTimer = setTimeout(function() {
        flash.classList.remove('is-active');
        flash.hidden = true;
      }, 400);
    }
    captureFrameFromVideo(video);
  }, 1000);
}
window.snapPhotoboothPicture = snapPhotoboothPicture;

function captureFrameFromVideo(video) {
  var canvas = pbEl('pb_canvas');
  if (!video || !canvas) return;

  var w = video.videoWidth;
  var h = video.videoHeight;
  // A stream that has not delivered a frame yet reports 0×0. Drawing it would
  // bake a black rectangle and call it the student's work.
  if (!w || !h) {
    setPhotoboothStatus(
      'The camera was not ready. Give it a second and tap "Take Photo" again.',
      'La cámara no estaba lista. Esperen un segundo y toquen "Tomar Foto" otra vez.',
      'warn');
    var snapBtn = pbEl('pb_snap_btn');
    if (snapBtn) snapBtn.disabled = false;
    return;
  }

  canvas.width = w;
  canvas.height = h;
  var ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // The selfie preview is mirrored, so the capture is mirrored to match what
  // the family just saw. The rear camera is not, so writing stays readable.
  if (pbState.facingMode === 'user') {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  pbState.capturedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
  stopPhotoboothStream({ keepStage: true });
  renderPhotoboothComposite();
}

function uploadPhotoboothImage(input) {
  if (!input || !input.files || !input.files[0]) return;
  var file = input.files[0];
  if (file.type && file.type.indexOf('image/') !== 0) {
    setPhotoboothStatus(
      'That file is not a photo. Choose a picture of the notebook page.',
      'Ese archivo no es una foto. Elijan una imagen de la página del cuaderno.',
      'warn');
    input.value = '';
    return;
  }
  setPhotoboothStatus('Loading your photo…', 'Cargando la foto…', 'info');

  var reader = new FileReader();
  reader.onerror = function() {
    setPhotoboothStatus(
      'That photo could not be read. Try choosing it again.',
      'No se pudo leer esa foto. Intenten elegirla de nuevo.',
      'warn');
    input.value = '';
  };
  reader.onload = function(e) {
    var img = new Image();
    img.onerror = function() {
      setPhotoboothStatus(
        'That photo could not be opened. Try a different picture.',
        'No se pudo abrir esa foto. Prueben con otra imagen.',
        'warn');
      input.value = '';
    };
    img.onload = function() {
      var canvas = pbEl('pb_canvas');
      if (!canvas) return;
      var maxDim = 1200;
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      if (!w || !h) {
        setPhotoboothStatus(
          'That photo could not be opened. Try a different picture.',
          'No se pudo abrir esa foto. Prueben con otra imagen.',
          'warn');
        input.value = '';
        return;
      }
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      pbState.capturedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      stopPhotoboothStream({ keepStage: true });
      renderPhotoboothComposite();
      // Without this, picking the same file twice fires no change event and
      // the second upload silently does nothing.
      input.value = '';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
window.uploadPhotoboothImage = uploadPhotoboothImage;

/* Canvas has no text wrapping, so anything that could overflow the frame gets
   measured and ellipsised rather than running off the edge of the photo. */
function pbFitText(ctx, text, maxWidth) {
  var t = String(text == null ? '' : text);
  if (maxWidth <= 0) return '';
  if (ctx.measureText(t).width <= maxWidth) return t;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) {
    t = t.slice(0, -1);
  }
  while (t.length > 1 && t.charAt(t.length - 1) === ' ') t = t.slice(0, -1);
  return t + '…';
}

function renderPhotoboothComposite() {
  if (!pbState.capturedDataUrl) return;
  var img = new Image();
  img.onload = function() {
    var canvas = pbEl('pb_canvas');
    if (!canvas) return;
    var w = img.naturalWidth || img.width;
    var h = img.naturalHeight || img.height;
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    var frameColor = 'var(--fm-m-unknown)';
    if (pbState.frame === 'notebook') frameColor = 'var(--fm-m-whole)';
    else if (pbState.frame === 'stars') frameColor = 'var(--fm-m-whole)';
    else if (pbState.frame === 'polaroid') frameColor = 'var(--fm-raised)';

    var borderW = Math.max(12, Math.round(w * 0.025));
    ctx.lineWidth = borderW;
    ctx.strokeStyle = frameColor;
    ctx.strokeRect(borderW / 2, borderW / 2, w - borderW, h - borderW);

    var pad = borderW + 8;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    var bannerH = Math.max(36, Math.round(h * 0.08));
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, w, bannerH);
    ctx.fillStyle = (pbState.frame === 'polaroid') ? '#0f172a' : '#ffffff';
    ctx.font = 'bold ' + Math.round(bannerH * 0.5) + 'px system-ui, sans-serif';
    var displayId = pbDisplayId();
    var banner = '🏆 MATH CHAMPION' + (displayId ? ' · LESSON ' + displayId.toUpperCase() : '');
    ctx.fillText(pbFitText(ctx, banner, w - pad * 2), pad, bannerH / 2);

    var footH = Math.max(44, Math.round(h * 0.1));
    var footMid = h - footH / 2;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, h - footH, w, footH);

    // Stickers claim the right end of the footer first; the caption is then
    // fitted to whatever is left, so the two can never overlap.
    var stickerW = 0;
    if (pbState.stickers.length) {
      var stickerSize = Math.round(footH * 0.6);
      var stickerStep = Math.round(footH * 0.72);
      ctx.font = stickerSize + 'px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      ctx.textAlign = 'right';
      var stX = w - pad;
      for (var s = pbState.stickers.length - 1; s >= 0; s--) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(pbState.stickers[s], stX, footMid);
        stX -= stickerStep;
      }
      ctx.textAlign = 'left';
      stickerW = pbState.stickers.length * stickerStep;
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.round(footH * 0.42) + 'px system-ui, sans-serif';
    var caption = pbState.caption || "Tonight's Math Work Done Together!";
    ctx.fillText(pbFitText(ctx, caption, w - pad * 2 - stickerW), pad, footMid);

    var compositeUrl = canvas.toDataURL('image/jpeg', 0.9);
    var resImg = pbEl('pb_captured_img');
    if (resImg) resImg.src = compositeUrl;
    currentWorkPhotoData = compositeUrl;
    preparePhotoboothDownload(canvas, compositeUrl);
    renderPhotoboothStage('captured');
    setPhotoboothStatus(
      'Looking good! Download it, print it, or add it to your optional reflection.',
      '¡Se ve muy bien! Descárguenla, imprímanla o agréguenla a la reflexión opcional.',
      'ok');
  };
  img.onerror = function() {
    setPhotoboothStatus(
      'That photo could not be opened. Try taking or choosing it again.',
      'No se pudo abrir esa foto. Intenten tomarla o elegirla de nuevo.',
      'warn');
  };
  img.src = pbState.capturedDataUrl;
}

function retakePhotobooth() {
  pbState.exportRequestId++;
  if (pbState.downloadUrl) URL.revokeObjectURL(pbState.downloadUrl);
  pbState.downloadUrl = '';
  var downloadLink = pbEl('pb_download_link');
  if (downloadLink) downloadLink.removeAttribute('href');
  pbState.capturedDataUrl = '';
  currentWorkPhotoData = '';
  var resImg = pbEl('pb_captured_img');
  if (resImg) resImg.removeAttribute('src');
  var attachBtn = pbEl('pb_attach_btn');
  if (attachBtn) {
    attachBtn.innerHTML = '📎 <span class="lang-en">Add to optional reflection</span><span class="lang-es" lang="es">Añadir a la reflexión opcional</span>';
    attachBtn.disabled = false;
  }
  setPhotoboothStatus('', '', '');
  renderPhotoboothStage('idle');
  startPhotoboothCamera();
}
window.retakePhotobooth = retakePhotobooth;

// Prepare the file before the tap. A synthetic click inside toBlob's async
// callback loses the browser's user gesture and is blocked by some webviews.
function preparePhotoboothDownload(canvas, fallbackUrl) {
  var link = pbEl('pb_download_link');
  if (!link) return;
  var requestId = ++pbState.exportRequestId;
  if (pbState.downloadUrl) URL.revokeObjectURL(pbState.downloadUrl);
  pbState.downloadUrl = '';
  link.href = fallbackUrl;
  link.download = 'Math-Work-Photobooth-' + (window.LESSON_ID || 'night') + '.jpg';
  if (canvas.toBlob && URL.createObjectURL) {
    canvas.toBlob(function(blob) {
      if (!blob || requestId !== pbState.exportRequestId) return;
      pbState.downloadUrl = URL.createObjectURL(blob);
      link.href = pbState.downloadUrl;
    }, 'image/jpeg', 0.92);
  }
}

function downloadPhotoboothPhoto() {
  var link = pbEl('pb_download_link');
  if (link && link.getAttribute('href')) link.click();
}
window.downloadPhotoboothPhoto = downloadPhotoboothPhoto;

function printPhotoboothPhoto() {
  var canvas = pbEl('pb_canvas');
  if (!canvas || !pbState.capturedDataUrl) {
    setPhotoboothStatus(
      'Take or upload a photo first, then print it.',
      'Primero tomen o suban una foto, y luego imprímanla.',
      'warn');
    return;
  }

  // The print sheet is built now and hung directly off <body>. Built in place
  // it would sit inside the tab panel, where "print only this" can only be
  // expressed as visibility:hidden — which leaves every other stop of the
  // homework occupying blank pages behind the photo.
  var existing = pbEl('pb_print_portal');
  if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

  var sec = pbSection();
  var lessonLine = sec ? (sec.getAttribute('data-pb-lesson-line') || '') : '';

  var portal = document.createElement('div');
  portal.id = 'pb_print_portal';
  portal.className = 'pb-print-portal';
  portal.setAttribute('aria-hidden', 'true');

  var inner = document.createElement('div');
  inner.className = 'pb-print-inner';

  var title = document.createElement('h2');
  title.className = 'pb-print-title';
  title.textContent = 'EduWonderLab Family Math Champion · Grade 6';

  var meta = document.createElement('p');
  meta.className = 'pb-print-meta';
  meta.textContent = lessonLine;

  var wrap = document.createElement('div');
  wrap.className = 'pb-print-img-wrap';
  var photo = document.createElement('img');
  photo.className = 'pb-print-img';
  photo.alt = 'Student math work printout';
  wrap.appendChild(photo);

  var cap = document.createElement('p');
  cap.className = 'pb-print-caption';
  cap.textContent = pbState.caption || 'Student Math Notebook & Family Verification';

  var foot = document.createElement('div');
  foot.className = 'pb-print-footer';
  var footLeft = document.createElement('span');
  footLeft.textContent = 'Verified Family Practice · eduwonderlab.com';
  var footRight = document.createElement('span');
  footRight.textContent = new Date().toLocaleDateString();
  foot.appendChild(footLeft);
  foot.appendChild(footRight);

  inner.appendChild(title);
  if (lessonLine) inner.appendChild(meta);
  inner.appendChild(wrap);
  inner.appendChild(cap);
  inner.appendChild(foot);
  portal.appendChild(inner);
  document.body.appendChild(portal);

  var printed = false;
  var go = function() {
    if (printed) return;
    printed = true;
    document.body.classList.add('print-photobooth-only');
    try { window.print(); } catch(e) {}
    setTimeout(function() {
      document.body.classList.remove('print-photobooth-only');
      if (portal.parentNode) portal.parentNode.removeChild(portal);
    }, 600);
  };

  // window.print() is synchronous: fire it before the data: URL has decoded
  // and the sheet prints with an empty box where the photo should be.
  photo.onload = go;
  photo.onerror = go;
  photo.src = canvas.toDataURL('image/jpeg', 0.92);
  setTimeout(go, 2000);
}
window.printPhotoboothPhoto = printPhotoboothPhoto;

function attachPhotoboothToSignoff() {
  if (!currentWorkPhotoData) {
    setPhotoboothStatus(
      'Take or upload a photo first, then add it to the optional reflection.',
      'Primero tomen o suban una foto, y luego agréguenla a la reflexión opcional.',
      'warn');
    return;
  }
  var previewImg = pbEl('work_photo_preview');
  var previewWrap = pbEl('work_photo_preview_wrap');
  var extrasMore = document.getElementById('homework_extras_more');
  if (extrasMore) extrasMore.open = true;
  if (previewImg) previewImg.src = currentWorkPhotoData;
  if (previewWrap) previewWrap.hidden = false;

  var attachBtn = pbEl('pb_attach_btn');
  if (attachBtn) {
    attachBtn.innerHTML = '✅ <span class="lang-en">Attached!</span><span class="lang-es" lang="es">¡Adjuntado!</span>';
  }
  var certPhoto = pbEl('display_family_photo');
  var certPhotoBox = pbEl('display_family_photo_box');
  if (certPhoto) certPhoto.src = currentWorkPhotoData;
  if (certPhotoBox) certPhotoBox.hidden = false;

  setTimeout(function() {
    switchHomeworkTab('done');
    var formEl = pbEl('signoff_form_wrapper');
    if (formEl) {
      editParentSignoff();
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  }, 600);
}
window.attachPhotoboothToSignoff = attachPhotoboothToSignoff;

// Leaving the page with a live camera leaves the indicator light on. Hiding
// the tab (backgrounding the browser on a phone) counts as leaving.
window.addEventListener('pagehide', function() { stopPhotoboothStream({ keepStage: true }); });
document.addEventListener('visibilitychange', function() {
  if (document.hidden) stopPhotoboothStream({ keepStage: true });
});

/* ── Family Conversation Card: EN / ES, follows the page language until the family picks ── */
(function () {
  function initFamilyTalk() {
    var card = document.querySelector('[data-family-talk]');
    if (!card) return;
    var picked = false;
    function show(lang) {
      card.querySelectorAll('[data-pane]').forEach(function (pane) { pane.hidden = pane.dataset.pane !== lang; });
      card.querySelectorAll('[data-ft-lang]').forEach(function (btn) {
        btn.setAttribute('aria-pressed', String(btn.dataset.ftLang === lang));
      });
    }
    function pageLang() { return document.body.classList.contains('lang-mode-es') ? 'es' : 'en'; }
    card.querySelectorAll('[data-ft-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () { picked = true; show(btn.dataset.ftLang); });
    });
    new MutationObserver(function () { if (!picked) show(pageLang()); })
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    show(pageLang());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initFamilyTalk);
  else initFamilyTalk();
})();
`;
