/**
 * Canonical Lesson Resource Registry
 * Builds a unified, 5-phase (Prepare / Teach / Practice / Assess / Share)
 * student-safe resource catalog from the canonical launch manifest, lesson
 * configs, CCSS standards, learning labs, and content graph.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonPath, tryLoadLessonConfig } from "../../tools/lib/curriculum-source.mjs";

export const PHASES = [
  {
    id: "prepare",
    label: "Prepare",
    description: "Objectives, prerequisites, vocabulary, and teaching setup",
  },
  {
    id: "teach",
    label: "Teach",
    description: "Warm-up, visual explanation, guided notes, and interactive models",
  },
  {
    id: "practice",
    label: "Practice",
    description: "Guided, independent, supported, and challenge pathways",
  },
  {
    id: "assess",
    label: "Assess",
    description: "Formative checks, misconception diagnosis, and transfer",
  },
  {
    id: "share",
    label: "Share",
    description: "Student assignments, family practice, and printable packets",
  },
];

export const FLAGSHIP_LESSONS = new Set(["6-5", "5-1", "2-3"]);

const FORBIDDEN_STUDENT_PATH =
  /slides|teacher|answer(?:-|_)?key|gradebook|dashboard|\.docx(?:\?|$|#)|\.pdf(?:\?|$|#)/i;

const RESOURCE_CATALOG_META = {
  readiness: {
    title: "Get Ready Readiness",
    type: "readiness",
    phase: "prepare",
    audience: "student",
    session: "1",
    estimatedMinutes: 10,
    purpose: "Activate prerequisite skills and vocabulary before starting the core lesson.",
    formats: ["Interactive Web"],
    previewKind: "interactive",
    representations: ["Number lines & visual models", "Diagnostic check"],
    scaffoldingLevel: "Prerequisite bridge",
    readingDemand: "Low (chunked prompts + EN/ES)",
    questionCount: 4,
  },
  lesson: {
    title: "Interactive Lesson",
    type: "interactive-lesson",
    phase: "teach",
    audience: "student",
    session: "1",
    estimatedMinutes: 25,
    purpose:
      "Guide students through Notice & Wonder, Concept Intro, Explore, Practice, and Reflect.",
    formats: ["Interactive Web", "SCORM"],
    previewKind: "interactive",
    representations: ["Visual model", "Worked example", "Interactive check"],
    scaffoldingLevel: "Core instruction + WIDA supports",
    readingDemand: "Grade 6 with EN/ES toggle & read-aloud",
    questionCount: 8,
  },
  learningLab: {
    title: "Interactive Learning Lab",
    type: "learning-lab",
    phase: "teach",
    audience: "student",
    session: "1-2",
    estimatedMinutes: 20,
    purpose:
      "Explore the mathematical concept through hands-on manipulation, prediction, and discovery.",
    formats: ["Interactive Web"],
    previewKind: "interactive",
    representations: ["Dynamic manipulative", "Linked numerical & visual"],
    scaffoldingLevel: "Guided inquiry",
    readingDemand: "Moderate with visual cues",
    questionCount: 6,
  },
  guidedNotes: {
    title: "Living Guided Notes",
    type: "guided-notes",
    phase: "teach",
    audience: "student",
    session: "1",
    estimatedMinutes: 15,
    purpose: "Record mathematical reasoning, predictions, and key vocabulary during instruction.",
    formats: ["Interactive Web", "Printable"],
    previewKind: "document",
    representations: ["Structured workspace", "Worked steps", "Self-explanation"],
    scaffoldingLevel: "Structured note-taking",
    readingDemand: "Low–Moderate",
    questionCount: 6,
  },
  studentHelp: {
    title: "Student Help & Worked Examples",
    type: "student-help",
    phase: "prepare",
    audience: "student",
    session: "1-2",
    estimatedMinutes: 8,
    purpose:
      "Provide step-by-step worked examples and plain-language explanations when students get stuck.",
    formats: ["Interactive Web"],
    previewKind: "document",
    representations: ["Step-by-step model", "Vocabulary cards"],
    scaffoldingLevel: "High support",
    readingDemand: "Plain language (EN/ES)",
    questionCount: 3,
  },
  handout: {
    title: "Lesson Reference Handout",
    type: "handout",
    phase: "prepare",
    audience: "student",
    session: "1-2",
    estimatedMinutes: 5,
    purpose: "Keep key formulas, definitions, and a model example visible at students' desks.",
    formats: ["HTML", "Printable"],
    previewKind: "document",
    representations: ["Reference summary", "Diagram"],
    scaffoldingLevel: "Reference anchor",
    readingDemand: "Concise",
    questionCount: 0,
  },
  worksheet: {
    title: "Practice Sheet A (Core)",
    type: "practice-sheet",
    phase: "practice",
    audience: "student",
    session: "1-2",
    estimatedMinutes: 15,
    purpose: "Build fluency and conceptual accuracy on core grade-level problems.",
    formats: ["HTML", "Printable"],
    previewKind: "practice",
    representations: ["Symbolic", "Word problems"],
    scaffoldingLevel: "Grade-level independent",
    readingDemand: "Grade 6 standard",
    questionCount: 8,
  },
  worksheet2: {
    title: "Practice Sheet B (Alternate Set)",
    type: "practice-sheet",
    phase: "practice",
    audience: "student",
    session: "2",
    estimatedMinutes: 15,
    purpose:
      "Provide a fresh parallel problem set for second-day practice, stations, or reassessment.",
    formats: ["HTML", "Printable"],
    previewKind: "practice",
    representations: ["Symbolic", "Contextual application"],
    scaffoldingLevel: "Parallel independent",
    readingDemand: "Grade 6 standard",
    questionCount: 8,
  },
  worksheetLevel0: {
    title: "Supported Practice (Level 0)",
    type: "supported-practice",
    phase: "practice",
    audience: "student",
    session: "1-2",
    estimatedMinutes: 15,
    purpose:
      "Preserve the grade-level objective with visual anchors, sentence frames, and step starters.",
    formats: ["HTML", "Printable"],
    previewKind: "practice",
    representations: ["Visual scaffold", "Step-by-step prompt"],
    scaffoldingLevel: "High scaffold (WIDA/SPED aligned)",
    readingDemand: "Chunked with sentence frames",
    questionCount: 6,
  },
  mstarWorksheet: {
    title: "MSTAR Readiness Practice",
    type: "mstar-practice",
    phase: "practice",
    audience: "student",
    session: "1-2",
    estimatedMinutes: 12,
    purpose: "Target foundational intervention skills aligned to MSTAR Tier 2/3 support.",
    formats: ["HTML", "Printable"],
    previewKind: "practice",
    representations: ["Concrete/visual bridge", "Guided items"],
    scaffoldingLevel: "Targeted intervention",
    readingDemand: "Simplified syntax",
    questionCount: 6,
  },
  exitTicket: {
    title: "Lesson Exit Ticket & Reflection",
    type: "exit-ticket",
    phase: "assess",
    audience: "student",
    session: "1",
    estimatedMinutes: 7,
    purpose: "Check end-of-lesson mastery and surface misconceptions for next-day grouping.",
    formats: ["Interactive Web"],
    previewKind: "assessment",
    representations: ["Quick check", "Reasoning prompt"],
    scaffoldingLevel: "Formative check",
    readingDemand: "Concise",
    questionCount: 3,
  },
  homework: {
    title: "Family Homework Practice",
    type: "family-homework",
    phase: "share",
    audience: "family",
    session: "1-2",
    estimatedMinutes: 15,
    purpose:
      "Offer bilingual, low-friction home practice with plain-language explanations and hints.",
    formats: ["Interactive Web"],
    previewKind: "family",
    representations: ["Plain-language model", "Bilingual hints"],
    scaffoldingLevel: "Home-friendly (EN/ES)",
    readingDemand: "Plain language (FK <= 5)",
    questionCount: 6,
  },
  familyPage: {
    title: "Family Connection Guide",
    type: "family-guide",
    phase: "share",
    audience: "family",
    session: "1-2",
    estimatedMinutes: 5,
    purpose:
      "Explain what students are learning, key vocabulary, and conversation starters for families.",
    formats: ["Web Page"],
    previewKind: "family",
    representations: ["Worked example", "Vocabulary in EN/ES"],
    scaffoldingLevel: "Family overview",
    readingDemand: "Accessible parent guide",
    questionCount: 0,
  },
};

function readJsonSafe(filePath, fallback = null) {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function cleanText(val) {
  if (val && typeof val === "object" && typeof val.en === "string") val = val.en;
  return typeof val === "string" ? val.trim() : "";
}

function buildResourceEntries(lesson, root) {
  const entries = [];
  const resources = lesson.resources || {};
  for (const [key, href] of Object.entries(resources)) {
    if (typeof href !== "string" || !href.startsWith("/")) continue;
    if (FORBIDDEN_STUDENT_PATH.test(`${key} ${href}`)) {
      throw new Error(
        `Forbidden student resource leaked into catalog: ${lesson.id}.${key} -> ${href}`,
      );
    }
    const meta = RESOURCE_CATALOG_META[key];
    if (!meta) continue;
    const diskPath = join(root, href.split("#")[0].replace(/^\//, ""));
    const exists = existsSync(diskPath) || existsSync(join(diskPath, "index.html"));
    entries.push({
      resourceId: `${lesson.id}:${key}`,
      key,
      lessonId: lesson.id,
      unit: lesson.unit,
      session: meta.session,
      title: meta.title,
      type: meta.type,
      phase: meta.phase,
      audience: meta.audience,
      estimatedMinutes: meta.estimatedMinutes,
      purpose: meta.purpose,
      formats: meta.formats,
      href,
      exists,
      preview: {
        kind: meta.previewKind,
        scaffoldingLevel: meta.scaffoldingLevel,
        readingDemand: meta.readingDemand,
        questionCount: meta.questionCount,
        representations: meta.representations,
        deviceSupport: "Desktop, Tablet, Mobile",
      },
      relatedIds: [],
      nextAction:
        meta.phase === "prepare"
          ? "Launch Teach phase"
          : meta.phase === "teach"
            ? "Assign Practice"
            : meta.phase === "practice"
              ? "Check with Exit Ticket"
              : meta.phase === "assess"
                ? "Route to Small Group or Share"
                : "Review Class Completion",
    });
  }

  // Add Practice Studio & Lesson Path entries if present on disk
  const studioPath = `/math/practice-studio/${lesson.id}/`;
  if (existsSync(join(root, studioPath.slice(1), "index.html"))) {
    entries.push({
      resourceId: `${lesson.id}:practiceStudio`,
      key: "practiceStudio",
      lessonId: lesson.id,
      unit: lesson.unit,
      session: "1-2",
      title: "HTML Practice Studio",
      type: "practice-studio",
      phase: "practice",
      audience: "student",
      estimatedMinutes: 15,
      purpose:
        "Interactive self-checking practice with hints, misconception feedback, and adaptive levels.",
      formats: ["Interactive Web"],
      href: studioPath,
      exists: true,
      preview: {
        kind: "practice",
        scaffoldingLevel: "Adaptive hints + EN/ES",
        readingDemand: "Grade 6 with audio & hints",
        questionCount: 8,
        representations: ["Interactive bench", "Multi-step feedback"],
        deviceSupport: "Desktop, Tablet, Mobile",
      },
      relatedIds: [`${lesson.id}:worksheet`],
      nextAction: "Review evidence or try Challenge",
    });
  }

  const challengePath = `/math/practice-studio/${lesson.id}/challenge/`;
  if (existsSync(join(root, challengePath.slice(1), "index.html"))) {
    entries.push({
      resourceId: `${lesson.id}:challengeStudio`,
      key: "challengeStudio",
      lessonId: lesson.id,
      unit: lesson.unit,
      session: "2",
      title: "Challenge Practice Studio",
      type: "challenge-practice",
      phase: "practice",
      audience: "student",
      estimatedMinutes: 15,
      purpose: "Extend conceptual reasoning with non-routine multi-step transfer problems.",
      formats: ["Interactive Web"],
      preview: {
        kind: "practice",
        scaffoldingLevel: "Extension & transfer",
        readingDemand: "Higher reasoning demand",
        questionCount: 6,
        representations: ["Multi-step modeling", "Justification"],
        deviceSupport: "Desktop, Tablet, Mobile",
      },
      href: challengePath,
      exists: true,
      relatedIds: [`${lesson.id}:practiceStudio`],
      nextAction: "Share student reasoning",
    });
  }

  // Wire relatedIds within the lesson
  const allIds = entries.map((e) => e.resourceId);
  for (const entry of entries) {
    entry.relatedIds = allIds.filter((id) => id !== entry.resourceId).slice(0, 4);
  }
  return entries;
}

export function buildCanonicalResourceCatalog(root) {
  const launch = readJsonSafe(join(root, "data/curriculum-launch-manifest.json"));
  if (!launch || !Array.isArray(launch.lessons)) {
    throw new Error("Missing or invalid data/curriculum-launch-manifest.json");
  }
  const standardsRaw = readJsonSafe(join(root, "data/ccss-standards.json"), {});
  const standards = standardsRaw.standards || standardsRaw;
  const contentGraph = readJsonSafe(join(root, "data/content-graph.json"), {});
  const graphLessons = contentGraph?.lessons || {};

  const lessons = launch.lessons.map((lesson, idx) => {
    const config = tryLoadLessonConfig(lesson.id) || {};
    const stdInfo = standards[lesson.standard] || {};
    const graphNode = graphLessons[lesson.id] || {};
    const prevLesson = idx > 0 ? launch.lessons[idx - 1].id : null;
    const nextLesson = idx < launch.lessons.length - 1 ? launch.lessons[idx + 1].id : null;

    const resources = buildResourceEntries(lesson, root);
    const prerequisites =
      Array.isArray(graphNode.prerequisites) && graphNode.prerequisites.length
        ? graphNode.prerequisites
        : prevLesson
          ? [prevLesson]
          : [];
    const nextConnections =
      Array.isArray(graphNode.next) && graphNode.next.length
        ? graphNode.next
        : nextLesson
          ? [nextLesson]
          : [];

    const vocabList = Array.isArray(config.vocabulary)
      ? config.vocabulary
          .map((v) => ({
            term: cleanText(v.term || v.word),
            definition: cleanText(v.definition),
            termEs: cleanText(v.term?.es || v.termEs),
            definitionEs: cleanText(v.definition?.es || v.definitionEs),
          }))
          .filter((v) => v.term)
      : (lesson.vocabulary || []).map((t) => ({
          term: t,
          definition: "",
          termEs: "",
          definitionEs: "",
        }));

    const isFlagship = FLAGSHIP_LESSONS.has(lesson.id);
    const iDoLines = Array.isArray(config.launch?.conceptIntro?.iDo?.lines)
      ? config.launch.conceptIntro.iDo.lines.map(cleanText).filter(Boolean).slice(0, 4)
      : [];
    const instructional = {
      workedExampleLines: iDoLines,
      weDoPrompt: cleanText(
        config.launch?.conceptIntro?.weDo?.prompt ||
          config.launch?.conceptIntro?.weDo?.title ||
          config.launch?.conceptIntro?.weDo,
      ),
      commonMistake: cleanText(config.practice?.commonMistake),
      wordProblem: cleanText(config.revealWordProblem?.prompt || config.revealWordProblem),
      turnAndTalk: cleanText(config.turnAndTalk?.prompt || config.turnAndTalk),
      familyKeyIdea: cleanText(config.familyKeyIdea),
      familyKeyIdeaEs: cleanText(config.familyKeyIdeaEs),
    };

    return {
      id: lesson.id,
      unit: lesson.unit,
      lesson: lesson.lesson,
      title: lesson.title,
      standard: lesson.standard,
      standardDescription: cleanText(stdInfo.description || stdInfo.title || ""),
      objective: lesson.objective,
      languageObjective: lesson.languageObjective,
      timeEstimate: lesson.timeEstimate || "45 minutes",
      sessions: existsSync(lessonPath(`${lesson.id}-part2`, "index.html")) ? ["1", "2"] : ["1"],
      vocabulary: vocabList.slice(0, 8),
      sentenceFrames: lesson.sentenceFrames || [],
      prerequisites,
      nextConnections,
      instructional,
      capabilities: {
        flagshipStudio: isFlagship,
        interactiveTheater: isFlagship || Boolean(resources.some((r) => r.key === "learningLab")),
        livingGuidedNotes: true,
        misconceptionEngine: isFlagship || resources.some((r) => r.key === "practiceStudio"),
        smallGroupComposer: true,
        reasoningDefense: true,
        partnerCollaboration: true,
        variantComparison: resources.filter((r) => r.phase === "practice").length >= 2,
        oneClickAssembly: true,
        bilingualWida: true,
      },
      resources,
    };
  });

  return {
    schemaVersion: 2,
    generatedBy: "scripts/generate-lesson-resource-catalog.mjs",
    phases: PHASES,
    flagshipLessons: [...FLAGSHIP_LESSONS],
    lessonCount: lessons.length,
    resourceCount: lessons.reduce((sum, l) => sum + l.resources.length, 0),
    lessons,
  };
}
