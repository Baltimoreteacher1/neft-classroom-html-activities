// The stages of a mission and what each mission type takes from the teacher's source. A stage is built ONLY from
// content the teacher supplied (their objective, question, task, vocabulary, passage, pictures and questions) plus
// structure the player already has (an organizer, stage headings). A stage nothing real can fill is omitted and
// reported by missions.js; generic text is never written to fill it.

import { T } from "./components-kit.js";

export const STAGES = Object.freeze([
  "introduction",
  "visual",
  "investigation",
  "evidence",
  "practice",
  "communication",
  "feedback",
  "revision",
  "reflection",
]);

export const STAGE_LABEL = Object.freeze({
  introduction: T("Mission briefing", "Informe de la misión"),
  visual: T("See it", "Véalo"),
  investigation: T("Investigate", "Investigue"),
  evidence: T("Collect evidence", "Reúna evidencia"),
  practice: T("Practice", "Practique"),
  communication: T("Speak or write", "Hable o escriba"),
  feedback: T("Check your work", "Revise su trabajo"),
  revision: T("Revise", "Revise y corrija"),
  reflection: T("Reflect", "Reflexione"),
});

/** What each stage needs, in the teacher's words (shown in the builder and in the review list). */
export const STAGE_NEEDS = Object.freeze({
  introduction: T("Your objective or a driving question.", "Su objetivo o una pregunta guía."),
  visual: T(
    "A picture, table, math line or diagram.",
    "Una imagen, tabla, línea de matemáticas o diagrama.",
  ),
  investigation: T(
    "A passage, vocabulary, or hands-on questions (sorting, ordering, matching, graphing).",
    "Un texto, vocabulario o preguntas prácticas (clasificar, ordenar, emparejar, graficar).",
  ),
  evidence: T(
    "A passage, picture or table to gather evidence from, or evidence questions.",
    "Un texto, imagen o tabla para reunir evidencia, o preguntas de evidencia.",
  ),
  practice: T("Questions with answers.", "Preguntas con respuestas."),
  communication: T(
    "A speaking or writing task, or written-response questions.",
    "Una tarea oral o escrita, o preguntas de respuesta escrita.",
  ),
  feedback: T(
    "Rubric points on a written response.",
    "Criterios de rúbrica de una respuesta escrita.",
  ),
  revision: T("A find-the-mistake question.", "Una pregunta de encontrar el error."),
  reflection: T(
    "Your reflection question (or a Know / Want / Learned chart).",
    "Su pregunta de reflexión (o una tabla Sé / Quiero saber / Aprendí).",
  ),
});

const F = {
  sci: ["sort", "order", "match", "hotspot", "plot", "numberline"],
};

/**
 * One plan per mission type. `inv` / `evid` / `comm`: question formats that go to that stage (everything else goes to
 * Practice, `error` to Revise). `passage` / `vocab`: the stage that holds the teacher's passage / word list.
 */
export const PLANS = Object.freeze({
  science: {
    label: T("Scientific investigation", "Investigación científica"),
    purpose: T(
      "Ask a question, investigate, collect evidence and explain with a claim.",
      "Hacer una pregunta, investigar, reunir evidencia y explicar con una afirmación.",
    ),
    passage: "evidence",
    vocab: "introduction",
    organizer: "claim-evidence",
    commKind: "explain",
    inv: F.sci,
    evid: ["identify", "fillTable", "multi"],
    comm: ["short"],
  },
  history: {
    label: T("Historical mystery", "Misterio histórico"),
    purpose: T(
      "Read sources like a detective and explain what happened and why.",
      "Leer fuentes como un detective y explicar qué pasó y por qué.",
    ),
    passage: "investigation",
    vocab: "introduction",
    organizer: "cause-effect",
    commKind: "explain",
    inv: ["order", "sort", "match", "hotspot"],
    evid: ["identify", "multi"],
    comm: ["short"],
  },
  math: {
    label: T("Mathematical design challenge", "Desafío de diseño matemático"),
    purpose: T(
      "Use math models to design something and justify the choices.",
      "Usar modelos matemáticos para diseñar algo y justificar las decisiones.",
    ),
    passage: "investigation",
    vocab: "introduction",
    organizer: "claim-evidence",
    commKind: "explain",
    inv: ["numberline", "plot", "hotspot", "sort", "match"],
    evid: ["fillTable", "identify"],
    comm: ["short"],
  },
  reading: {
    label: T("Reading adventure", "Aventura de lectura"),
    purpose: T(
      "Read a text in stages, find what matters and respond in writing.",
      "Leer un texto por etapas, encontrar lo importante y responder por escrito.",
    ),
    passage: "investigation",
    vocab: "introduction",
    organizer: "sequence",
    commKind: "write",
    inv: ["identify", "order", "hotspot", "sort", "match"],
    evid: ["multi"],
    comm: ["short"],
  },
  communication: {
    label: T("Academic communication mission", "Misión de comunicación académica"),
    purpose: T(
      "Build sentences, organize ideas and share them in academic language.",
      "Armar oraciones, organizar ideas y compartirlas en lenguaje académico.",
    ),
    passage: "investigation",
    vocab: "introduction",
    organizer: "compare",
    commKind: "write",
    inv: ["build", "order", "match", "sort"],
    evid: ["identify", "multi"],
    comm: ["short", "build"],
  },
  vocabulary: {
    label: T("Vocabulary expedition", "Expedición de vocabulario"),
    purpose: T(
      "Meet new words, use them, and write with them.",
      "Conocer palabras nuevas, usarlas y escribir con ellas.",
    ),
    passage: "evidence",
    vocab: "investigation",
    organizer: "web",
    commKind: "write",
    inv: ["match", "sort", "blank", "order"],
    evid: ["identify"],
    comm: ["short", "build"],
  },
  escape: {
    label: T("Escape-room review", "Repaso tipo sala de escape"),
    purpose: T(
      "Unlock each step by answering review questions. No timer.",
      "Desbloquear cada paso respondiendo preguntas de repaso. Sin temporizador.",
    ),
    passage: "investigation",
    vocab: "introduction",
    organizer: "web",
    commKind: "explain",
    inv: ["sort", "match", "order", "hotspot", "identify"],
    evid: ["multi", "fillTable"],
    comm: ["short"],
  },
});
export const MISSION_IDS = Object.freeze(Object.keys(PLANS));

/** The stage each source question goes to; `error` always revises, `short` always communicates. */
export function stageOfQuestion(plan, q) {
  if (q.format === "error") return "revision";
  if (q.format === "short" || plan.comm.includes(q.format)) return "communication";
  if (plan.inv.includes(q.format)) return "investigation";
  if (plan.evid.includes(q.format)) return "evidence";
  return "practice";
}

export const STAGE_CAP = Object.freeze({
  investigation: 6,
  evidence: 4,
  practice: 8,
  communication: 3,
  revision: 3,
});
