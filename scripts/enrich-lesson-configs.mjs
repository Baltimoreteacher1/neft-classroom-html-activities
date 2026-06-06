#!/usr/bin/env node
/**
 * Batch-enrich lesson config.json files with:
 * - practice.commonMistake (lesson-specific from keyIdea)
 * - turnAndTalk practice-phase entry where missing
 * - familyNotes overrides for flagship lessons
 * - stretch error-analysis in approaching tier where a tier lacks depth
 *
 * Run: node scripts/enrich-lesson-configs.mjs
 * Idempotent — skips fields that already exist.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const lessonsDir = join(root, "lessons");
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

function keyIdea(config) {
  return (
    config.launch?.conceptIntro?.keyIdea ||
    config.conceptIntro?.keyIdea ||
    config.launch?.conceptIntro?.intro ||
    ""
  );
}

function firstVocab(config) {
  return config.vocabulary?.[0];
}

function deriveCommonMistake(config) {
  const idea = keyIdea(config);
  const vocab = firstVocab(config);
  const title = config.title || "this lesson";

  if (idea) {
    return `A common mistake in ${title} is skipping the key idea: "${idea}" — always check your work against this rule before you submit.`;
  }
  if (vocab?.term && vocab?.definition) {
    return `Students often confuse "${vocab.term}" with everyday words. Remember: ${vocab.definition}`;
  }
  return `A common mistake in ${title} is rushing without checking each step. Slow down and match your work to today's objective.`;
}

function derivePracticeTurnAndTalk(config) {
  const existing = config.turnAndTalk || [];
  if (existing.some((t) => t.phase === "practice")) return null;

  const idea = keyIdea(config);
  const vocab = (config.vocabulary || []).slice(0, 4).map((v) => v.term);
  const talk = existing.find((t) => t.phase === "explore") || existing[0];
  const stemEn = talk?.stems?.[0]?.en || "I solved it by ___ because ___.";
  const stemEs = talk?.stems?.[0]?.es || "Lo resolví por ___ porque ___.";

  return {
    phase: "practice",
    question: `During practice on ${config.title}, what strategy did you use when a problem felt tricky?`,
    kernel: idea || talk?.kernel || `Use today's math vocabulary to explain each step.`,
    stems: [
      { en: stemEn, es: stemEs },
      {
        en: "I knew my answer was reasonable because ___.",
        es: "Supe que mi respuesta era razonable porque ___.",
      },
    ],
    wordBank: vocab.length ? vocab : ["strategy", "check", "explain"],
    listenFor: `Listen for students naming a specific strategy tied to ${config.standard || "the standard"} — not just \"I multiplied.\" They should connect steps to ${idea ? "the key idea" : "the objective"}.`,
    extend: `How would you help a classmate who made the common mistake from today's lesson? Use one vocabulary word.`,
    extendStems: [
      "I would tell them to ___ first because ___.",
      "The mistake happens when you ___ instead of ___.",
    ],
  };
}

function flagshipFamilyNotes(config) {
  const idea = keyIdea(config);
  const vocab = config.vocabulary || [];
  const mission = config.flagship?.mission;

  return {
    learningTonight: {
      en: mission?.objective || plainObjective(config.contentObjective) || config.title,
      es: config.contentObjectiveEs ||
        `Practicar: ${config.title || "la lección de hoy"}`,
    },
    conceptSteps: [
      {
        en: mission?.story?.split(".")[0] + "." || idea,
        es: "Lean la historia de la misión juntos antes de empezar los ejercicios.",
      },
      {
        en: idea || config.contentObjective || "",
        es: "Verifiquen cada paso con la idea clave de la lección.",
      },
    ].filter((s) => s.en),
    watchFor: vocab.slice(0, 3).map((v) => ({
      icon: "👀",
      en: `Listen for "${v.term}" — ${v.definition}`,
      es: `Escucha "${v.termEs || v.term}" — ${v.definitionEs || v.definition}`,
    })),
    tryTogether: {
      titleEn: "Mission practice together",
      titleEs: "Practiquen la misión juntos",
      scenarioEn: mission?.story || config.launch?.narrative?.split(".")[0] + "." || "",
      scenarioEs: "Usen la historia de la misión para conectar la matemática con un problema real.",
      steps: [
        {
          en: "Pick one practice problem and solve it on paper together.",
          es: "Elijan un problema de práctica y resuélvanlo en papel juntos.",
          hint: "Talk through each step aloud.",
          hintEs: "Hablen de cada paso en voz alta.",
        },
        {
          en: idea ? `Check: does your answer follow — ${idea}?` : "Check: does your answer match today's objective?",
          es: idea
            ? `Verifiquen: ¿su respuesta sigue — ${idea}?`
            : "Verifiquen: ¿su respuesta coincide con el objetivo de hoy?",
          hint: "This is the flagship lesson's deepest idea.",
          hintEs: "Esta es la idea más profunda de la lección estrella.",
        },
      ],
    },
    stuckTips: {
      say: [
        { en: "What part of the mission story helps here?", es: "¿Qué parte de la historia de la misión ayuda aquí?" },
        { en: "Let's re-read the key idea together.", es: "Releamos juntos la idea clave." },
      ],
      dontSay: [
        { en: "This flagship lesson is too hard — skip it.", es: "Esta lección estrella es muy difícil — sáltenla." },
      ],
    },
  };
}

function plainObjective(obj) {
  if (!obj) return "";
  return String(obj)
    .replace(/^I can\s+/i, "")
    .replace(/\.$/, "");
}

function needsStretchProblem(tier) {
  if (!Array.isArray(tier) || tier.length === 0) return true;
  return !tier.some(
    (p) =>
      p.type === "error-analysis" ||
      p.type === "open-response" ||
      (p.type === "multiple-choice" && p.stem?.includes("mistake")),
  );
}

function makeStretchProblem(config, tierName) {
  const idea = keyIdea(config);
  const title = config.title || "this lesson";
  return {
    type: "error-analysis",
    title: `${tierName} — Spot the Common Mistake`,
    workedExample: [
      { label: "Read", work: `A student is working on ${title}.` },
      { label: "Attempt", work: idea ? `They ignored the rule: ${idea}` : "They skipped a step in their work." },
      { label: "Check", work: "The answer does not match the math rule from class." },
    ],
    errorStep: 1,
    correctWork: idea
      ? `Follow the key idea: ${idea}`
      : "Re-read the problem and apply each step carefully.",
    hints: [
      "Which step breaks the rule you learned today?",
      idea ? `Remember: ${idea}` : "Check both quantities or both sides of your work.",
    ],
  };
}

const lessonIds = readdirSync(lessonsDir)
  .filter((d) => LESSON_DIR_RE.test(d) && existsSync(join(lessonsDir, d, "config.json")))
  .sort();

let stats = { commonMistake: 0, practiceTT: 0, familyNotes: 0, stretch: 0 };

for (const id of lessonIds) {
  const path = join(lessonsDir, id, "config.json");
  const config = JSON.parse(readFileSync(path, "utf8"));
  let changed = false;

  if (!config.practice) config.practice = {};

  if (!config.practice.commonMistake) {
    config.practice.commonMistake = deriveCommonMistake(config);
    stats.commonMistake++;
    changed = true;
  }

  const practiceTT = derivePracticeTurnAndTalk(config);
  if (practiceTT) {
    config.turnAndTalk = [...(config.turnAndTalk || []), practiceTT];
    stats.practiceTT++;
    changed = true;
  }

  if (id.includes("flagship") && !config.familyNotes) {
    config.familyNotes = flagshipFamilyNotes(config);
    stats.familyNotes++;
    changed = true;
  }

  for (const tier of ["approaching", "onLevel", "extending"]) {
    const items = config.practice[tier];
    if (needsStretchProblem(items)) {
      if (!config.practice[tier]) config.practice[tier] = [];
      // Only add if entire practice section lacks error-analysis in this tier
      const hasEA = config.practice[tier].some(
        (p) => p.type === "error-analysis" || p.type === "open-response",
      );
      if (!hasEA) {
        config.practice[tier].push(makeStretchProblem(config, tier));
        stats.stretch++;
        changed = true;
      }
    }
  }

  if (changed) {
    writeFileSync(path, JSON.stringify(config, null, 2) + "\n", "utf8");
  }
}

console.log(`Enriched ${lessonIds.length} lessons:`, stats);
