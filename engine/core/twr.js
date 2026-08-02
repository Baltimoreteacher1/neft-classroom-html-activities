// Canonical ESOL math-writing derivation.
//
// This module is deliberately pure so the browser, printable HTML, DOCX, and
// PDF workflows all receive the same lesson-specific writing support.

const FIXED_SPANISH = Object.freeze({
  job: "Responde la pregunta. Usa evidencia matemática. Explica cómo la evidencia demuestra tu respuesta.",
  rehearsal: "Di tu respuesta primero: Mi respuesta es ___ porque ___.",
});

const CHECKLIST = Object.freeze([
  Object.freeze({
    en: "I answered the question.",
    es: "Respondí la pregunta.",
  }),
  Object.freeze({
    en: "I used math evidence: numbers, an equation, a model, or a comparison.",
    es: "Usé evidencia matemática: números, una ecuación, un modelo o una comparación.",
  }),
  Object.freeze({
    en: "I explained how the evidence proves my answer.",
    es: "Expliqué cómo la evidencia demuestra mi respuesta.",
  }),
  Object.freeze({
    en: "I used at least two math words.",
    es: "Usé por lo menos dos palabras matemáticas.",
  }),
  Object.freeze({
    en: "I reread complete sentences and punctuation.",
    es: "Volví a leer mis oraciones completas y la puntuación.",
  }),
]);

const SYSTEM_FRAMES = Object.freeze({
  start: Object.freeze([
    Object.freeze({ en: "My answer is ___.", es: "Mi respuesta es ___." }),
    Object.freeze({ en: "I know because ___.", es: "Lo sé porque ___." }),
  ]),
  build: Object.freeze([
    Object.freeze({ en: "My claim is ___.", es: "Mi afirmación es ___." }),
    Object.freeze({ en: "I know because ___.", es: "Lo sé porque ___." }),
    Object.freeze({ en: "So ___.", es: "Entonces ___." }),
  ]),
  explain: Object.freeze([
    Object.freeze({ en: "My claim is ___.", es: "Mi afirmación es ___." }),
    Object.freeze({ en: "My math evidence is ___.", es: "Mi evidencia matemática es ___." }),
    Object.freeze({
      en: "This proves ___ because ___.",
      es: "Esto demuestra ___ porque ___.",
    }),
  ]),
});

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanObjective(value) {
  return cleanText(value)
    .replace(/^I can\s+/i, "")
    .replace(/[.!?]+$/, "");
}

function firstSentence(value) {
  const [sentence = ""] = cleanText(value).split(/(?<=[.!?])\s+/);
  return sentence;
}

function ensureQuestion(value) {
  const question = cleanText(value).replace(/[.!?]+$/, "");
  return question ? `${question}?` : "How can you explain your mathematical thinking?";
}

function selectWritingSource(config) {
  const connectCfg = config.connect || {};
  const connectPrompt = connectCfg.promptQuestion || connectCfg.scenario;
  if (connectPrompt) {
    return {
      phase: "connect",
      question: connectPrompt,
      questionEs: connectCfg.promptQuestionEs || "",
      stems: connectCfg.stems || (connectCfg.prompt ? [{ en: connectCfg.prompt }] : []),
      wordBank: connectCfg.wordBank || [],
    };
  }
  const blocks = Array.isArray(config.turnAndTalk) ? config.turnAndTalk : [];
  return (
    blocks.find((block) => block?.phase === "connect" && block.question) ||
    blocks.find((block) => block?.phase === "explore" && block.question) ||
    blocks.find((block) => block?.question) ||
    null
  );
}

function selectModelSource(config, focusSource) {
  const blocks = Array.isArray(config.turnAndTalk) ? config.turnAndTalk : [];
  return blocks.find((block) => block !== focusSource && block?.kernel) || focusSource || null;
}

function deriveAction(question) {
  const lower = cleanText(question).toLowerCase();
  if (/\bcompare|same|different|greater|less\b/.test(lower)) return "compare";
  if (/\bdescribe\b/.test(lower)) return "describe";
  if (/\bjustify|prove\b/.test(lower)) return "justify";
  return "explain";
}

function normalizeFrame(frame) {
  if (typeof frame === "string") return { en: cleanText(frame), es: "" };
  return {
    en: cleanText(frame?.en),
    es: cleanText(frame?.es),
  };
}

function selectVocabulary(config, source) {
  const authored = Array.isArray(config.vocabulary) ? config.vocabulary : [];
  const requested = new Set(
    (Array.isArray(source?.wordBank) ? source.wordBank : []).map((word) =>
      cleanText(word).toLowerCase(),
    ),
  );
  const ranked = authored.map((word, index) => ({
    word,
    index,
    preferred: requested.has(cleanText(word?.term).toLowerCase()) ? 1 : 0,
  }));
  ranked.sort((a, b) => b.preferred - a.preferred || a.index - b.index);
  return ranked.slice(0, 5).map(({ word }) => ({
    term: cleanText(word?.term),
    termEs: cleanText(word?.termEs),
    definition: cleanText(word?.definition),
    definitionEs: cleanText(word?.definitionEs),
  }));
}

function deriveFocus(config, source) {
  const objective = cleanObjective(config.contentObjective);
  const questionEn = ensureQuestion(
    source?.question ||
      (objective
        ? `How can you show and explain that you can ${objective}`
        : `How can you explain the main idea in ${config.title || "this lesson"}`),
  );
  const questionEs = source?.questionEs ? ensureQuestion(source.questionEs) : "";
  return {
    questionEn,
    questionEs,
    action: deriveAction(questionEn),
    actionMeaning: "Tell how the math evidence proves your answer.",
    jobEn: "Answer the question. Use math evidence. Explain how the evidence proves your answer.",
    jobEs: FIXED_SPANISH.job,
  };
}

function deriveRehearsal(source) {
  const firstAuthored = (Array.isArray(source?.stems) ? source.stems : [])
    .map(normalizeFrame)
    .find((frame) => frame.en);
  return {
    directionEn: "Say your idea to a partner or quietly to yourself before you write.",
    directionEs: "Di tu idea a un compañero o en voz baja antes de escribir.",
    frameEn: firstAuthored?.en || "My answer is ___ because ___.",
    frameEs: firstAuthored?.es || FIXED_SPANISH.rehearsal,
  };
}

function deriveLevels(source) {
  const authored = (Array.isArray(source?.stems) ? source.stems : [])
    .map(normalizeFrame)
    .filter((frame) => frame.en)
    .slice(0, 2);
  const startFrames =
    authored.length >= 2 ? authored : [...authored, ...SYSTEM_FRAMES.start].slice(0, 2);

  return [
    {
      id: "start",
      label: "Start",
      support: "Most language support",
      directionEn: "Complete the frames. Use the word bank.",
      directionEs: "Completa las oraciones. Usa el banco de palabras.",
      frames: startFrames,
    },
    {
      id: "build",
      label: "Build",
      support: "Some language support",
      directionEn: "Write two connected sentences. Use because, so, or but.",
      directionEs: "Escribe dos oraciones conectadas. Usa porque, entonces o pero.",
      frames: SYSTEM_FRAMES.build,
    },
    {
      id: "explain",
      label: "Explain",
      support: "Light language support",
      directionEn: "Write a claim, give math evidence, and explain your reasoning.",
      directionEs: "Escribe una afirmación, da evidencia matemática y explica tu razonamiento.",
      frames: SYSTEM_FRAMES.explain,
    },
  ];
}

function mainConcept(config) {
  const vocabulary = Array.isArray(config.vocabulary) ? config.vocabulary : [];
  const title = cleanText(config.title).toLowerCase();
  return (
    vocabulary.find((word) => title.includes(cleanText(word?.term).toLowerCase())) ||
    vocabulary[0] ||
    null
  );
}

function deriveModel(config, focusSource) {
  const source = selectModelSource(config, focusSource);
  const concept = mainConcept(config);
  const conceptTerm = cleanText(concept?.term) || cleanText(config.title) || "The math idea";
  const conceptDefinition = cleanText(concept?.definition);
  const claim = cleanText(source?.kernel) || `${conceptTerm} means ${conceptDefinition}`;
  const evidence =
    cleanText(source?.listenFor) ||
    (conceptDefinition
      ? `The lesson defines ${conceptTerm.toLowerCase()} as ${conceptDefinition}`
      : "The numbers and model show the relationship.");
  const reasoning = conceptDefinition
    ? `This evidence connects the definition of ${conceptTerm.toLowerCase()} to the mathematical claim.`
    : "This evidence explains how the math supports the claim.";

  return {
    note: "This model shows the parts of an explanation. It does not answer your writing question.",
    claim,
    evidence,
    reasoning,
  };
}

export function deriveTWR(config = {}) {
  const source = selectWritingSource(config);
  const checklist = CHECKLIST.map((item) => ({ ...item }));
  return {
    title: cleanText(config.title),
    languageObjective: firstSentence(config.languageObjective),
    focus: deriveFocus(config, source),
    vocabulary: selectVocabulary(config, source),
    rehearsal: deriveRehearsal(source),
    levels: deriveLevels(source),
    model: deriveModel(config, source),
    checklist,
    teacherCriteria: checklist,
  };
}

export default deriveTWR;
