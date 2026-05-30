// ── The Writing Revolution (TWR) — derivation core ───────────────────────────
// Pure logic (no DOM, no Node APIs) so it can be imported by BOTH the notes
// generator (Node) and the live lesson engine (browser).
//
// Everything here is AUTO-DERIVED from a lesson's existing `config.json` fields
// (contentObjective, languageObjective, vocabulary[], turnAndTalk[], title,
// standard). No new hand-authored content is required per lesson.
//
// TWR Core set produced:
//   1. Kernel sentence  — subject + verb statement of the key concept.
//   2. Sentence expansion — expand the kernel with because / but / so.
//   3. Sentence types   — statement, question, exclamation, command.
//   4. Explain-your-reasoning stems — adapted from turnAndTalk stems.
//
// Output is a plain data object; the generator turns it into print HTML and
// DOCX, the engine turns it into interactive typed-input boxes.

function cleanObjective(text) {
  if (!text) return "";
  // Strip a leading "I can " so the derived sentence reads like a topic phrase.
  return String(text)
    .replace(/^\s*I can\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.]+$/, "");
}

function firstSentence(text) {
  if (!text) return "";
  const m = String(text).split(/(?<=[.!?])\s+/)[0];
  return (m || "").trim();
}

// The main concept noun phrase: prefer the richest vocabulary term (the one
// whose definition is longest is usually the lesson's central idea), else the
// title.
function mainConcept(config) {
  const vocab = Array.isArray(config.vocabulary) ? config.vocabulary : [];
  if (vocab.length) {
    // The lesson's central term is usually the one that echoes the title.
    const title = String(config.title || "").toLowerCase();
    const byTitle = vocab.find(
      (v) => title && v.term && title.includes(v.term.toLowerCase()),
    );
    if (byTitle) return byTitle;
    // Otherwise pick the term with the longest definition (most load-bearing).
    return vocab
      .slice()
      .sort(
        (a, b) =>
          String(b.definition || "").length - String(a.definition || "").length,
      )[0];
  }
  return null;
}

function lowerFirst(s) {
  if (!s) return "";
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// ── 1. Kernel sentence ───────────────────────────────────────────────────────
// A subject + verb sentence stating the lesson's key concept.
export function deriveKernel(config) {
  const concept = mainConcept(config);
  const topic = cleanObjective(config.contentObjective) || config.title || "";
  let en;
  let es;

  if (concept && concept.term) {
    const def = String(concept.definition || "").replace(/[.]+$/, "");
    const defEs = String(concept.definitionEs || "").replace(/[.]+$/, "");
    en = `${capitalize(concept.term)} is ${lowerFirst(def)}.`;
    es =
      concept.termEs && defEs
        ? `${capitalize(concept.termEs)} es ${lowerFirst(defEs)}.`
        : "";
  } else if (topic) {
    en = `Today I can ${lowerFirst(topic)}.`;
    es = "";
  } else {
    en = `${config.title || "This lesson"} is an important math idea.`;
    es = "";
  }

  return {
    en,
    es,
    // What the student is asked to do: write their OWN kernel (subject + verb).
    promptEn: `Write a kernel sentence about ${concept && concept.term ? concept.term.toLowerCase() : config.title || "today's idea"}. Use a subject and a verb.`,
    promptEs: `Escribe una oración base sobre ${concept && concept.termEs ? concept.termEs.toLowerCase() : config.title || "la idea de hoy"}. Usa un sujeto y un verbo.`,
  };
}

// ── 2. Sentence expansion (because / but / so) ───────────────────────────────
export function deriveExpansion(config) {
  const concept = mainConcept(config);
  const subject =
    concept && concept.term
      ? capitalize(concept.term)
      : config.title || "This idea";
  const subjectEs =
    concept && concept.termEs ? capitalize(concept.termEs) : null;

  const kernelEn = `${subject} matters in math`;
  const kernelEs = subjectEs ? `${subjectEs} importa en matemáticas` : null;

  return {
    kernelEn,
    kernelEs,
    conjunctions: [
      {
        word: "because",
        wordEs: "porque",
        frameEn: `${kernelEn} because ___.`,
        frameEs: kernelEs ? `${kernelEs} porque ___.` : "",
      },
      {
        word: "but",
        wordEs: "pero",
        frameEn: `${kernelEn}, but ___.`,
        frameEs: kernelEs ? `${kernelEs}, pero ___.` : "",
      },
      {
        word: "so",
        wordEs: "entonces",
        frameEn: `${kernelEn}, so ___.`,
        frameEs: kernelEs ? `${kernelEs}, entonces ___.` : "",
      },
    ],
  };
}

// ── 3. Sentence types ────────────────────────────────────────────────────────
// Write the math idea as a statement, a question, an exclamation, a command.
export function deriveSentenceTypes(config) {
  const concept = mainConcept(config);
  const term = concept && concept.term ? concept.term.toLowerCase() : null;
  const topic =
    term ||
    cleanObjective(config.contentObjective) ||
    config.title ||
    "this idea";

  return [
    {
      type: "Statement",
      typeEs: "Afirmación",
      hintEn: `Tell one true fact about ${topic}.`,
      hintEs: `Di un hecho verdadero sobre ${topic}.`,
      frameEn: `${capitalize(topic)} ___.`,
      frameEs: "",
    },
    {
      type: "Question",
      typeEs: "Pregunta",
      hintEn: `Ask a question about ${topic}.`,
      hintEs: `Haz una pregunta sobre ${topic}.`,
      frameEn: `How does ___ ?`,
      frameEs: `¿Cómo ___ ?`,
    },
    {
      type: "Exclamation",
      typeEs: "Exclamación",
      hintEn: `Show excitement about ${topic}.`,
      hintEs: `Muestra entusiasmo sobre ${topic}.`,
      frameEn: `Wow, ___ !`,
      frameEs: `¡Guau, ___ !`,
    },
    {
      type: "Command",
      typeEs: "Mandato",
      hintEn: `Tell a partner what to do with ${topic}.`,
      hintEs: `Dile a un compañero qué hacer con ${topic}.`,
      frameEn: `First, ___ .`,
      frameEs: `Primero, ___ .`,
    },
  ];
}

// ── 4. Explain-your-reasoning stems (adapted from turnAndTalk) ───────────────
const FALLBACK_REASON_STEMS = [
  { en: "I know ___ because ___.", es: "Sé que ___ porque ___." },
  { en: "First I ___, then I ___.", es: "Primero ___, luego ___." },
  {
    en: "This is important because ___.",
    es: "Esto es importante porque ___.",
  },
];

export function deriveReasoningStems(config) {
  const tt = Array.isArray(config.turnAndTalk) ? config.turnAndTalk : [];
  const collected = [];
  for (const block of tt) {
    if (!block || !Array.isArray(block.stems)) continue;
    for (const s of block.stems) {
      const en = typeof s === "string" ? s : s && s.en;
      const es = typeof s === "string" ? "" : (s && s.es) || "";
      if (en && !collected.some((c) => c.en === en)) {
        collected.push({ en, es });
      }
    }
  }
  const stems = collected.length ? collected : FALLBACK_REASON_STEMS;
  return stems.slice(0, 3);
}

// ── Bundle everything ────────────────────────────────────────────────────────
export function deriveTWR(config) {
  return {
    title: config.title || "",
    languageObjective: firstSentence(config.languageObjective),
    kernel: deriveKernel(config),
    expansion: deriveExpansion(config),
    sentenceTypes: deriveSentenceTypes(config),
    reasoningStems: deriveReasoningStems(config),
  };
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default deriveTWR;
