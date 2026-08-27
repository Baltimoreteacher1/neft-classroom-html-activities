// Canonical ESOL math-writing derivation.
//
// This module is deliberately pure so the browser, printable HTML, DOCX, and
// PDF workflows all receive the same lesson-specific writing support.

const FIXED_SPANISH = Object.freeze({
  job: "Responde la pregunta con evidencia matemática.",
  rehearsal: "Mi respuesta es ___ porque ___.",
});

// Three items, each checking a DIFFERENT thing. The old five-item list said
// "explained how the evidence proves my answer" one line after "used math
// evidence", and spent a line on punctuation — a checklist students skim past
// is a checklist that checks nothing.
const CHECKLIST = Object.freeze([
  Object.freeze({
    en: "I answered the question.",
    es: "Respondí la pregunta.",
  }),
  Object.freeze({
    en: "I used math evidence: numbers, an equation, or a model.",
    es: "Usé evidencia matemática: números, una ecuación o un modelo.",
  }),
  Object.freeze({
    en: "I used at least two math words.",
    es: "Usé por lo menos dos palabras matemáticas.",
  }),
]);

// No level repeats another level's line, and no level repeats the rehearsal
// frame — each rung hands the student strictly MORE of the sentence to build
// on their own. Explain has no frames on purpose: light support means writing
// the sentences yourself.
const SYSTEM_FRAMES = Object.freeze({
  start: Object.freeze([
    Object.freeze({ en: "My answer is ___ because ___.", es: "Mi respuesta es ___ porque ___." }),
  ]),
  build: Object.freeze([
    Object.freeze({ en: "My claim is ___.", es: "Mi afirmación es ___." }),
    Object.freeze({ en: "My evidence is ___, so ___.", es: "Mi evidencia es ___, entonces ___." }),
  ]),
  explain: Object.freeze([]),
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
  // A `role: "concept"` entry is the lesson TITLE dressed as a term ("Describe
  // the Data Using the Median"). It is not a word a student can use in a
  // sentence, and telling them to check it off as one of their "two math
  // words" reads as machine output. The small-group generator already
  // excludes this shape for the same reason.
  const authored = (Array.isArray(config.vocabulary) ? config.vocabulary : []).filter(
    (word) => word && word.role !== "concept",
  );
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
        ? `How can you show that you can ${objective}`
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

function deriveModel(config, focusSource) {
  // A model is rendered ONLY when the lesson authored one (a turn-and-talk
  // kernel with a listen-for). The old fallback manufactured a claim from a
  // vocabulary definition and closed with "This evidence connects the
  // definition of <term> to the mathematical claim" — a tautology printed to
  // students on every lesson without an authored model. No model is better
  // than an invented one; every consumer guards on null.
  const source = selectModelSource(config, focusSource);
  const claim = cleanText(source?.kernel);
  const evidence = cleanText(source?.listenFor);
  if (!claim || !evidence) return null;
  return {
    note: "This model shows the parts of an explanation. It does not answer your writing question.",
    claim,
    evidence,
    reasoning: "",
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
    // What the TEACHER scores — not a reprint of the student's checklist. The
    // old teacherCriteria WAS the checklist verbatim, so the "Teacher Copy"
    // told a teacher nothing the student page had not already said.
    teacherCriteria: [
      { en: "The answer to the math question is correct." },
      {
        en: "The evidence is real lesson mathematics (numbers, equation, or model), not restated claim.",
      },
      {
        en: "The support level changed the language scaffolding, never the mathematical expectation.",
      },
    ],
  };
}

export default deriveTWR;
