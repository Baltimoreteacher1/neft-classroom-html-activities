#!/usr/bin/env node
/**
 * tools/build-curriculum-manifest.mjs
 * -----------------------------------------------------------------------------
 * Builds the canonical data/curriculum-manifest.json.
 * Single source of truth hydrating the curriculum shell, discovery hub,
 * and in-tool navigation bars.
 *
 * All counts and paths are DERIVED from lesson configs, launch manifests,
 * learning labs, canvas scenes, and on-disk files.
 *
 * Conforms strictly to data/curriculum-manifest.schema.json.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { LESSONS_DIR } from "./lib/curriculum-source.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA_DIR = join(ROOT, "data");

const CANONICAL_LESSON_RE = /^(\d+)-(\d+)$/;

function present(rel) {
  const p = join(ROOT, rel.replace(/^\//, ""));
  if (!existsSync(p)) return false;
  try {
    const st = statSync(p);
    return st.isFile() ? st.size > 0 : existsSync(join(p, "index.html"));
  } catch {
    return false;
  }
}

function loadJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
}

function resourcesFor(id) {
  const dl = (suffix) => `lessons/${id}/downloads/${id}-${suffix}`;
  const res = {
    lesson: { path: `/lessons/${id}/`, file: `lessons/${id}/index.html`, applicable: true },
    guidedNotes: {
      path: `/lessons/${id}/notes.html`,
      file: `lessons/${id}/notes.html`,
      applicable: true,
    },
    guidedNotesPdf: {
      path: `/lessons/${id}/downloads/${id}-notes.pdf`,
      file: dl("notes.pdf"),
      applicable: true,
    },
    guidedNotesDocx: {
      path: `/lessons/${id}/downloads/${id}-notes.docx`,
      file: dl("notes.docx"),
      applicable: true,
    },
    handout: {
      path: `/lessons/${id}/handout.html`,
      file: `lessons/${id}/handout.html`,
      applicable: true,
    },
    worksheet: {
      path: `/lessons/${id}/worksheet.html`,
      file: `lessons/${id}/worksheet.html`,
      applicable: true,
    },
    worksheet2: {
      path: `/lessons/${id}/worksheet-2.html`,
      file: `lessons/${id}/worksheet-2.html`,
      applicable: true,
    },
    worksheetLevel0: {
      path: `/lessons/${id}/worksheet-level-0.html`,
      file: `lessons/${id}/worksheet-level-0.html`,
      applicable: true,
    },
    mstarWorksheet: {
      path: `/lessons/${id}/mstar-worksheet.html`,
      file: `lessons/${id}/mstar-worksheet.html`,
      applicable: true,
    },
    mstarWorksheetPdf: {
      path: `/lessons/${id}/downloads/${id}-mstar-worksheet.pdf`,
      file: `lessons/${id}/downloads/${id}-mstar-worksheet.pdf`,
      applicable: true,
    },
    homework: {
      path: `/lessons/${id}/homework.html`,
      file: `lessons/${id}/homework.html`,
      applicable: true,
    },
    homeworkDocx: {
      path: `/lessons/${id}/homework.docx`,
      file: `lessons/${id}/homework.docx`,
      applicable: true,
    },
    slides: {
      path: `/lessons/${id}/slides.html`,
      file: `lessons/${id}/slides.html`,
      applicable: true,
    },
    familyPage: {
      path: `/lessons/${id}/family/`,
      file: `lessons/${id}/family/index.html`,
      applicable: true,
    },
    teacherNotes: {
      path: `/lessons/${id}/teacher-notes/`,
      file: `lessons/${id}/teacher-notes/index.html`,
      applicable: true,
    },
    studentHelp: {
      path: `/lessons/${id}/student-help/`,
      file: `lessons/${id}/student-help/index.html`,
      applicable: true,
    },
    exitTicket: {
      path: `/lessons/${id}/#reflect`,
      file: `lessons/${id}/index.html`,
      applicable: true,
      inline: true,
    },
  };

  if (present(`lessons/${id}/readiness/index.html`)) {
    res.readiness = {
      path: `/lessons/${id}/readiness/`,
      file: `lessons/${id}/readiness/index.html`,
      applicable: true,
    };
  }

  if (present(`lessons/${id}/bundle/interactive.html`)) {
    res.studentPractice = {
      path: `/lessons/${id}/bundle/student-practice.md`,
      file: `lessons/${id}/bundle/student-practice.md`,
      applicable: true,
    };
    res.printablePacket = {
      path: `/lessons/${id}/bundle/sub-packet.html`,
      file: `lessons/${id}/bundle/sub-packet.html`,
      applicable: true,
    };
    res.activityPack = {
      path: `/lessons/${id}/bundle/activity-pack.html`,
      file: `lessons/${id}/bundle/activity-pack.html`,
      applicable: true,
    };
    res.subPlan = {
      path: `/lessons/${id}/bundle/sub-packet.html`,
      file: `lessons/${id}/bundle/sub-packet.html`,
      applicable: true,
    };
    res.interactive = {
      path: `/lessons/${id}/bundle/interactive.html`,
      file: `lessons/${id}/bundle/interactive.html`,
      applicable: true,
    };
  }

  const resolved = {};
  for (const [key, r] of Object.entries(res)) {
    resolved[key] = {
      ...r,
      exists: r.inline ? true : present(r.file),
    };
  }
  return resolved;
}

const FAMILY_HOMEWORK_ID_RE = /^(\d{1,2})-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const meta = (html, name) =>
  html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, "i"))?.[1]?.trim() ?? "";

function discoverFamilyHomework() {
  const curriculumDir = join(ROOT, "curriculum");
  const entries = [];
  for (const slug of readdirSync(curriculumDir)) {
    const file = join("curriculum", slug, "index.html");
    if (!present(file)) continue;
    const html = readFileSync(join(ROOT, file), "utf8");
    const head = html.slice(0, html.indexOf("</head>") > 0 ? html.indexOf("</head>") : 4000);
    const id = meta(head, "family-homework-id");
    if (!id) continue;
    const match = id.match(FAMILY_HOMEWORK_ID_RE);
    if (!match) continue;
    if (entries.some((e) => e.id === id)) continue;
    const title = (head.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "").split("|")[0].trim();
    if (!title) continue;
    entries.push({
      id,
      kind: "unit-review",
      unit: Number(match[1]),
      title,
      titleEs: meta(head, "family-homework-title-es"),
      resources: {
        lesson: { path: `/curriculum/${slug}/`, file, applicable: true, exists: true },
        homework: { path: `/curriculum/${slug}/`, file, applicable: true, exists: true },
      },
    });
  }
  return entries.sort((a, b) => a.unit - b.unit || a.id.localeCompare(b.id));
}

function arcadeFor(cfg) {
  const projects = Array.isArray(cfg.projects) ? cfg.projects : [];
  const project = projects.find((item) => {
    const href = String(item?.href ?? "").split(/[?#]/)[0];
    return (
      /^\/(?!\/)/.test(href) &&
      /\/(?:games?(?:\/|$)|[^/]*game(?:\/|\.html|$))/i.test(href) &&
      !/graphic-novels|\/games\/3d\//i.test(href) &&
      present(href.slice(1))
    );
  });
  if (!project) return null;
  return {
    title: String(project.title ?? "Lesson arcade"),
    path: String(project.href ?? ""),
  };
}

// Unit titles & big ideas (bilingual)
const UNIT_METADATA = {
  1: {
    title: { en: "Math Is Discovery", es: "Las matemáticas son descubrimiento" },
    bigIdea: {
      en: "Start the year as a doer of math: explore patterns, share reasoning, and build problem-solving habits.",
      es: "Comienza el año siendo protagonista de las matemáticas: explora patrones, comparte razonamientos y desarrolla hábitos para resolver problemas.",
    },
  },
  2: {
    title: { en: "Statistics", es: "Estadística" },
    bigIdea: {
      en: "Collect, display, and summarize data with center, spread, and shape to answer statistical questions.",
      es: "Recolecta, representa y resume datos con centro, dispersión y forma para responder preguntas estadísticas.",
    },
  },
  3: {
    title: { en: "Ratios & Rates", es: "Razones y tasas" },
    bigIdea: {
      en: "Use ratio language, tables, and equivalent ratios to compare quantities and reason about unit rates.",
      es: "Usa lenguaje de razones, tablas y razones equivalentes para comparar cantidades y razonar sobre tasas unitarias.",
    },
  },
  4: {
    title: { en: "Percents", es: "Porcentajes" },
    bigIdea: {
      en: "Understand percent as a rate per hundred, relate fractions, decimals, and percents, and find parts or wholes.",
      es: "Comprende el porcentaje como una tasa por cada cien, relaciona fracciones, decimales y porcentajes, y encuentra partes o enteros.",
    },
  },
  5: {
    title: { en: "Area, Surface Area & Volume", es: "Área, área superficial y volumen" },
    bigIdea: {
      en: "Find area by composing and decomposing shapes, and extend reasoning to 3D nets, surface area, and volume.",
      es: "Calcula el área componiendo y descomponiendo figuras, y extiende el razonamiento a redes 3D, área superficial y volumen.",
    },
  },
  6: {
    title: { en: "Expressions", es: "Expresiones" },
    bigIdea: {
      en: "Divide fractions, analyze factors and multiples, and write, evaluate, and prove equivalent expressions.",
      es: "Divide fracciones, analiza factores y múltiplos, y escribe, evalúa y demuestra expresiones equivalentes.",
    },
  },
  7: {
    title: { en: "Integers & the Coordinate Plane", es: "Enteros y el plano cartesiano" },
    bigIdea: {
      en: "Reason about positive and negative numbers, absolute value, and positions in all four quadrants.",
      es: "Razona sobre números positivos y negativos, valor absoluto y posiciones en los cuatro cuadrantes del plano.",
    },
  },
  8: {
    title: { en: "Equations & Inequalities", es: "Ecuaciones y desigualdades" },
    bigIdea: {
      en: "Understand solutions, use inverse operations, and write, solve, and graph one-step equations and inequalities.",
      es: "Comprende qué es una solución, usa operaciones inversas, y escribe, resuelve y grafica ecuaciones y desigualdades de un paso.",
    },
  },
  9: {
    title: { en: "Two-Variable Relationships", es: "Relaciones de dos variables" },
    bigIdea: {
      en: "Connect changing quantities across tables, graphs, and equations with independent and dependent variables.",
      es: "Conecta cantidades variables en tablas, gráficas y ecuaciones usando variables independientes y dependientes.",
    },
  },
  10: {
    title: { en: "Math Is Synthesis", es: "Las matemáticas son síntesis" },
    bigIdea: {
      en: "Synthesize mathematical concepts through real-world applications, modeling, and deep problem solving.",
      es: "Sintetiza conceptos matemáticos mediante aplicaciones del mundo real, modelado y resolución profunda de problemas.",
    },
  },
};

// Unit capstones on disk
function capstonesForUnit(u) {
  const capstones = {};
  // Readiness & Fluency
  if (present(`curriculum/fluency/`)) {
    capstones.readinessFluency = `/curriculum/fluency/#unit-${u}`;
  }
  // Mission Lab
  const labsData = loadJson("data/learning-labs.json");
  const unitLabs = labsData.labs.filter((l) => l.unit === u);
  if (unitLabs.length > 0) {
    const primaryLab = unitLabs[unitLabs.length - 1]; // Capstone lab
    if (present(primaryLab.href)) {
      capstones.missionLab = primaryLab.href;
    }
  }
  // Unit Review
  const reviewAdventures = [
    `curriculum/unit-${u}-adventure-review/`,
    `curriculum/unit-${u}-test-review/`,
    `math/unit-${u}/projects/`,
  ];
  for (const r of reviewAdventures) {
    if (present(r)) {
      capstones.unitReview = `/${r}`;
      break;
    }
  }
  return capstones;
}

function deriveRepresentations(id, cfg, scenes) {
  const reps = new Set();
  const text = JSON.stringify(cfg).toLowerCase();

  if (
    text.includes("tape-diagram") ||
    text.includes("tape diagram") ||
    text.includes("bar model")
  ) {
    reps.add("tape-diagram");
  }
  if (
    text.includes("double number line") ||
    text.includes("double-number-line") ||
    text.includes("dnl")
  ) {
    reps.add("double-number-line");
  }
  if (
    text.includes("coordinate plane") ||
    text.includes("coordinate-plane") ||
    text.includes("coordinate grid") ||
    text.includes("graph")
  ) {
    reps.add("coordinate-plane");
  }
  if (text.includes("ratio table") || text.includes("table") || text.includes("t-chart")) {
    reps.add("table");
  }

  for (const s of scenes) {
    if (s.lessons && s.lessons.includes(id)) {
      if (s.reps?.includes("line") || s.reps?.includes("dnl")) reps.add("double-number-line");
      if (s.reps?.includes("strip") || s.family === "scale") reps.add("tape-diagram");
      if (s.reps?.includes("table")) reps.add("table");
      if (s.reps?.includes("plane")) reps.add("coordinate-plane");
    }
  }

  // Domain baseline by unit if empty
  const u = cfg.unit;
  if (reps.size === 0) {
    if (u === 3 || u === 4) {
      reps.add("table");
      reps.add("double-number-line");
    } else if (u === 7 || u === 9) {
      reps.add("coordinate-plane");
    } else if (u === 5 || u === 6 || u === 8) {
      reps.add("tape-diagram");
    } else {
      reps.add("table");
    }
  }

  return Array.from(reps);
}

function buildLesson(id, cfg, familyTitlesEs, _launchManifest, scenes, labs, pacingData) {
  const m = id.match(CANONICAL_LESSON_RE);
  const unit = cfg.unit ?? Number(m[1]);
  const lesson = cfg.lesson ?? Number(m[2]);

  // Spanish title and big idea handling with WCAG 3.1.2 gap tracking
  const titleEn = cfg.title || `Lesson ${id}`;
  let titleEs = familyTitlesEs[id] || cfg.titleEs || "";
  let titleEsGap = false;
  if (!titleEs || titleEs.trim() === "") {
    titleEs = titleEn;
    titleEsGap = true;
  }

  const bigIdeaEn =
    cfg.familyKeyIdea ||
    cfg.contentObjective ||
    `Understand key mathematical reasoning in lesson ${id}.`;
  let bigIdeaEs = cfg.familyKeyIdeaEs || "";
  let bigIdeaEsGap = false;
  if (!bigIdeaEs || bigIdeaEs.trim() === "") {
    bigIdeaEs = bigIdeaEn;
    bigIdeaEsGap = true;
  }

  // Standards
  let standardPrimary = cfg.standard || "6.EE.A.1";
  if (id === "3-6" || id === "3-7") {
    standardPrimary = "6.AT.3";
  }
  const standards = [standardPrimary];
  if (Array.isArray(cfg.standards)) {
    for (const s of cfg.standards) {
      if (s && !standards.includes(s)) standards.push(s);
    }
  }

  // Representations
  const representations = deriveRepresentations(id, cfg, scenes);

  // Tools
  const tools = {
    notesStudio: `/curriculum/notes-studio/?lesson=${id}`,
    extraHelp: `/curriculum/extra-help/#lesson-${id}`,
  };

  const sceneForLesson = scenes.find((s) => s.lessons && s.lessons.includes(id));
  if (sceneForLesson && present(`curriculum/math-canvas/index.html`)) {
    tools.mathCanvas = `/curriculum/math-canvas/?lesson=${id}`;
  }

  const labForLesson = labs.find((l) => l.lessons && l.lessons.includes(id));
  if (labForLesson && present(labForLesson.href)) {
    tools.missionLab = labForLesson.href;
  }

  if (present(`lessons/${id}/readiness/index.html`)) {
    tools.fluencyDrill = `/lessons/${id}/readiness/`;
  }

  // Printables
  const printables = {
    practiceSheet: {
      en: `/lessons/${id}/worksheet.html`,
      es: present(`lessons/${id}/worksheet-es.html`)
        ? `/lessons/${id}/worksheet-es.html`
        : `/lessons/${id}/worksheet.html`,
    },
    guidedNotes: {
      en: `/lessons/${id}/notes.html`,
      es: present(`lessons/${id}/notes-es.html`)
        ? `/lessons/${id}/notes-es.html`
        : `/lessons/${id}/notes.html`,
    },
    familyHomework: {
      en: `/lessons/${id}/homework.html`,
      es: `/lessons/${id}/homework.html?lang=es`,
    },
  };

  if (present(`lessons/${id}/worksheet-answer-key.html`)) {
    printables.teacherKey = `/lessons/${id}/worksheet-answer-key.html`;
  } else if (present(`lessons/${id}/teacher-notes/index.html`)) {
    printables.teacherKey = `/lessons/${id}/teacher-notes/`;
  }

  if (present(`lessons/${id}/bundle/sub-packet.html`)) {
    printables.subSummary = `/lessons/${id}/bundle/sub-packet.html`;
  }

  // Scaffolding: WIDA Level 2-3
  const frames = [
    "I know ___ because ___.",
    "First, I ___. Then, I ___.",
    "The model shows ___ so the answer is ___.",
  ];
  if (cfg.supports?.sentenceFrames && Array.isArray(cfg.supports.sentenceFrames)) {
    for (const f of cfg.supports.sentenceFrames) {
      if (f && !frames.includes(f)) frames.push(f);
    }
  }

  const wordBank = Array.isArray(cfg.vocabulary)
    ? cfg.vocabulary.map((v) => (typeof v === "string" ? v : v.term)).filter(Boolean)
    : [];

  const scaffolding = {
    widaLevel2_3: {
      sentenceFrames: frames,
      wordBank,
    },
  };

  // Teacher Tray Data
  const misconceptions = [];
  if (cfg.practice?.commonMistake) {
    misconceptions.push(cfg.practice.commonMistake);
  }
  if (cfg.misconceptions && Array.isArray(cfg.misconceptions)) {
    for (const m of cfg.misconceptions) {
      if (m && !misconceptions.includes(m)) misconceptions.push(m);
    }
  }
  if (misconceptions.length === 0) {
    misconceptions.push(
      `Watch for students calculating procedurally without grounding numbers in the ${representations[0] || "model"}.`,
    );
  }

  // Pacing
  let pacingStr = `Unit ${unit} Sequence`;
  if (pacingData && pacingData.days) {
    const dayEntry = pacingData.days.find((d) => d.plan?.lessonId === id);
    if (dayEntry) {
      pacingStr = `${dayEntry.date} (${dayEntry.dayType || "Core Lesson"})`;
    }
  }

  const teacher = {
    objective: cfg.contentObjective || `Master Grade 6 standards in lesson ${id}.`,
    misconceptions,
    interventionNotes: {
      tier2: `Targeted small-group differentiation with representation bridge and guided scaffolding (Group 1 / Group 2).`,
      tier3: `Intensive prerequisite review focusing on foundational number relationships with concrete manipulatives.`,
    },
    pacing: pacingStr,
  };

  // Discourse prompts
  const discourseEn = [];
  const discourseEs = [];
  if (Array.isArray(cfg.turnAndTalk)) {
    for (const item of cfg.turnAndTalk) {
      if (item.question) discourseEn.push(item.question);
      if (item.questionEs) discourseEs.push(item.questionEs);
    }
  }
  if (discourseEn.length === 0) {
    discourseEn.push(
      "How does this representation help you explain your answer to a classmate?",
      "What mathematical pattern do you notice when the values change?",
    );
  }
  if (discourseEs.length === 0) {
    discourseEs.push(
      "¿Cómo te ayuda este modelo a explicarle tu respuesta a un compañero?",
      "¿Qué patrón matemático notas cuando cambian los valores?",
    );
  }

  const discoursePrompts = {
    en: discourseEn,
    es: discourseEs,
  };

  // Pathways
  const pathways = {};
  if (present(`lessons/${id}-group1/index.html`)) {
    pathways.group1 = `/lessons/${id}-group1/`;
  }
  if (present(`lessons/${id}-group2/index.html`)) {
    pathways.group2 = `/lessons/${id}-group2/`;
  }
  if (present(`lessons/${id}-catchup/index.html`)) {
    pathways.catchup = `/lessons/${id}-catchup/`;
  }

  return {
    id,
    unit,
    lesson,
    title: { en: titleEn, es: titleEs },
    bigIdea: { en: bigIdeaEn, es: bigIdeaEs },
    standards,
    standard: standardPrimary,
    representations,
    tools,
    printables,
    scaffolding,
    teacher,
    discoursePrompts,
    pathways,
    lessonPath: `/lessons/${id}/`,
    titleEs,
    objective: teacher.objective,
    languageObjective: cfg.languageObjective || "",
    topic: cfg.theme || cfg.topic || "",
    flagship: false,
    arcade: arcadeFor(cfg),
    supports: {
      vocabulary: wordBank,
      sentenceFrames: frames,
    },
    resources: resourcesFor(id),
    esGaps: {
      title: titleEsGap,
      bigIdea: bigIdeaEsGap,
    },
  };
}

export function buildManifest() {
  const familyTitlesEs = existsSync(join(DATA_DIR, "family-homework-titles-es.json"))
    ? loadJson("data/family-homework-titles-es.json")
    : {};
  const launchManifest = existsSync(join(DATA_DIR, "curriculum-launch-manifest.json"))
    ? loadJson("data/curriculum-launch-manifest.json")
    : { lessons: [], smallGroups: [], catchUps: [] };
  const scenes = existsSync(join(DATA_DIR, "ewl/canvas-scenes.json"))
    ? loadJson("data/ewl/canvas-scenes.json").scenes || []
    : [];
  const labs = existsSync(join(DATA_DIR, "learning-labs.json"))
    ? loadJson("data/learning-labs.json").labs || []
    : [];
  const pacingData = existsSync(join(DATA_DIR, "pacing-baseline-2026-27.json"))
    ? loadJson("data/pacing-baseline-2026-27.json")
    : null;

  // Enumerate 10 units
  const units = [];
  for (let u = 1; u <= 10; u++) {
    const meta = UNIT_METADATA[u] || {
      title: { en: `Unit ${u}`, es: `Unidad ${u}` },
      bigIdea: { en: `Unit ${u} Big Idea`, es: `Idea fundamental de la Unidad ${u}` },
    };
    units.push({
      number: u,
      title: meta.title,
      bigIdea: meta.bigIdea,
      capstones: capstonesForUnit(u),
    });
  }

  // Enumerate canonical lessons from lessons/<id>/config.json
  const lessonIds = readdirSync(LESSONS_DIR)
    .filter((d) => CANONICAL_LESSON_RE.test(d))
    .filter((d) => existsSync(join(LESSONS_DIR, d, "config.json")))
    .sort((a, b) => {
      const ma = a.match(CANONICAL_LESSON_RE);
      const mb = b.match(CANONICAL_LESSON_RE);
      return Number(ma[1]) - Number(mb[1]) || Number(ma[2]) - Number(mb[2]);
    });

  const lessons = lessonIds.map((id) => {
    const cfg = JSON.parse(readFileSync(join(LESSONS_DIR, id, "config.json"), "utf8"));
    return buildLesson(id, cfg, familyTitlesEs, launchManifest, scenes, labs, pacingData);
  });

  return {
    $schema: "./curriculum-manifest.schema.json",
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    total: lessons.length,
    familyHomework: discoverFamilyHomework(),
    units,
    lessons,
  };
}

function main() {
  const manifest = buildManifest();
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const outPath = join(DATA_DIR, "curriculum-manifest.json");
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(
    `✓ Built canonical curriculum manifest: ${manifest.units.length} units, ${manifest.lessons.length} lessons -> data/curriculum-manifest.json`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
