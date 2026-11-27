// Content-block components: vocabulary, reading, tables, math, read-aloud, graphic organizers, reflection and
// formative checks. Where a component can be made from the teacher's OWN content (vocabulary -> matching,
// passage -> read-aloud) it is, and `needs` says what it requires; otherwise it starts from a fixture example and
// adds a teacher-only starter note. A content-only component adds a short written question only when the
// activity has no questions yet (so a blank activity stays valid); `config.withQuestion` overrides that.

import { vocabSample } from "../core/fixtures.js";
import {
  T,
  blocksOf,
  define,
  fresh,
  hasQuestions,
  pick,
  sampleBlock,
  sampleQuestion,
  starterNote,
  vocabItems,
  writtenQuestion,
} from "./components-kit.js";
import { KINDS_PAGE } from "./components-kit.js";
import { uid } from "../core/schema.js";

const wantsQuestion = (activity, cfg) => cfg.withQuestion ?? !hasQuestions(activity);
const WITH_QUESTION = {
  key: "withQuestion",
  type: "boolean",
  label: T("Add a written question that uses it", "Agregar una pregunta escrita que lo use"),
};
const NATIVE = (en, es) => ({ alternative: "native", note: T(en, es) });
const key = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();

// ── vocabulary ───────────────────────────────────────────────────────────────

/** A matching question from words that have a meaning. Duplicate words or meanings are left out. */
function matchFrom(items, lang) {
  const seenL = new Set();
  const seenR = new Set();
  const pairs = [];
  for (const v of items) {
    if (seenL.has(key(v.term)) || seenR.has(key(v.def))) continue;
    seenL.add(key(v.term));
    seenR.add(key(v.def));
    pairs.push({ id: uid("p"), left: v.term, right: v.def });
  }
  return {
    type: "question",
    format: "match",
    prompt: pick(
      T("Match each word to its meaning.", "Empareje cada palabra con su significado."),
      lang,
    ),
    pairs: pairs.slice(0, 8),
  };
}
const sampleVocab = () => vocabSample().blocks[0].items.map(({ term, def }) => ({ term, def }));

const vocabList = define({
  id: "vocab-list",
  label: T("Vocabulary list", "Lista de vocabulario"),
  purpose: T(
    "Words with meanings (and Spanish and an example when you add them) that students can read and hear.",
    "Palabras con significados (y español y un ejemplo si los agrega) que los estudiantes pueden leer y escuchar.",
  ),
  category: "vocabulary",
  tags: ["vocabulary", "reading", "language"],
  configurable: [WITH_QUESTION],
  accessibility: T(
    "A plain list; each word can be read aloud when read-aloud support is on. Spanish glosses show only when Spanish support is on.",
    "Una lista simple; cada palabra se puede escuchar si el apoyo de lectura en voz alta está activo. El español solo aparece con el apoyo en español.",
  ),
  printable: NATIVE("Prints as a word table.", "Se imprime como tabla de palabras."),
  build: (a, cfg) => {
    const items = sampleVocab();
    const blocks = [{ type: "vocab", items }];
    if (wantsQuestion(a, cfg)) blocks.push(matchFrom(items, cfg.lang));
    return [...fresh(blocks), starterNote(cfg.lang)];
  },
});

const vocabMatch = define({
  id: "vocab-match",
  label: T("Match my vocabulary words", "Emparejar mis palabras de vocabulario"),
  purpose: T(
    "A matching question made from the words and meanings already in your activity. Nothing is invented.",
    "Una pregunta de emparejar hecha con las palabras y significados que ya están en su actividad. No se inventa nada.",
  ),
  category: "vocabulary",
  tags: ["vocabulary", "matching", "language"],
  needs: { vocab: 2 },
  accessibility: T(
    "Pick a card, then pick its partner: buttons only, no dragging required.",
    "Elija una tarjeta y luego su pareja: solo botones, sin arrastrar.",
  ),
  printable: NATIVE("Prints as lettered matching.", "Se imprime como emparejar con letras."),
  build: (a, cfg) => {
    const items = vocabItems(a);
    if (items.length >= 2) return fresh([matchFrom(items, cfg.lang)]);
    return [...fresh([matchFrom(sampleVocab(), cfg.lang)]), starterNote(cfg.lang)];
  },
});

// ── reading, tables, math, audio ─────────────────────────────────────────────

const passageCheck = define({
  id: "passage-check",
  label: T(
    "Reading passage with a check question",
    "Texto de lectura con pregunta de comprobación",
  ),
  purpose: T(
    "A short text with a question that is answered from the text. Replace the example with your own passage.",
    "Un texto corto con una pregunta que se responde con el texto. Sustituya el ejemplo con su propio texto.",
  ),
  category: "reading",
  tags: ["reading", "passage", "comprehension"],
  accessibility: T(
    "Read-aloud and part-by-part reading are available when those supports are on.",
    "La lectura en voz alta y por partes están disponibles con esos apoyos.",
  ),
  printable: NATIVE("Prints the passage and the question.", "Imprime el texto y la pregunta."),
  build: (_a, cfg) => [
    ...fresh([sampleBlock("p1")]),
    sampleQuestion("choice"),
    starterNote(cfg.lang),
  ],
});

const dataTable = define({
  id: "data-table",
  label: T("Data table", "Tabla de datos"),
  purpose: T(
    "A table students read from; the starter asks one question about it.",
    "Una tabla de la que los estudiantes leen datos; el ejemplo hace una pregunta sobre ella.",
  ),
  category: "table",
  tags: ["table", "math", "ratio", "data"],
  configurable: [WITH_QUESTION],
  accessibility: T(
    "A real table with column headers, in a scrollable region reachable by keyboard.",
    "Una tabla real con encabezados de columna, en una región desplazable alcanzable con el teclado.",
  ),
  printable: NATIVE("Prints as a table.", "Se imprime como tabla."),
  build: (a, cfg) => {
    const blocks = [
      {
        type: "table",
        caption: pick(
          T("Cookies made from cups of flour", "Galletas hechas con tazas de harina"),
          cfg.lang,
        ),
        headers: [
          pick(T("Cups of flour", "Tazas de harina"), cfg.lang),
          pick(T("Cookies", "Galletas"), cfg.lang),
        ],
        rows: [
          ["1", "12"],
          ["2", "24"],
          ["3", "36"],
        ],
      },
    ];
    if (wantsQuestion(a, cfg))
      blocks.push({
        type: "question",
        format: "number",
        prompt: pick(
          T(
            "How many cookies can you make with 4 cups of flour?",
            "¿Cuántas galletas se pueden hacer con 4 tazas de harina?",
          ),
          cfg.lang,
        ),
        answer: "48",
        expr: "4*12",
      });
    return [...fresh(blocks), starterNote(cfg.lang)];
  },
});

const mathDisplay = define({
  id: "math-display",
  label: T("Math expression", "Expresión matemática"),
  purpose: T(
    "A large, readable line of math such as a fraction or an equation, using the studio's math notation.",
    "Una línea grande y legible de matemáticas, como una fracción o una ecuación, con la notación del estudio.",
  ),
  category: "math",
  tags: ["math", "fractions", "equation"],
  configurable: [WITH_QUESTION],
  accessibility: T(
    "Plain text math (no image), so screen readers read it.",
    "Matemáticas en texto simple (sin imagen), así que los lectores de pantalla lo leen.",
  ),
  printable: NATIVE("Prints as a centered line.", "Se imprime como una línea centrada."),
  build: (a, cfg) => {
    const blocks = [{ type: "math", text: "{3/4} + {1/4}", caption: "" }];
    if (wantsQuestion(a, cfg))
      blocks.push({
        type: "question",
        format: "number",
        prompt: pick(T("What is {3/4} + {1/4}?", "¿Cuánto es {3/4} + {1/4}?"), cfg.lang),
        answer: "1",
        expr: "3/4+1/4",
      });
    return [...fresh(blocks), starterNote(cfg.lang)];
  },
});

/** The first whole sentences of the text, up to `max` characters. */
const firstSentences = (text, max = 600) => {
  const out = [];
  let len = 0;
  for (const s of text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)) {
    if (len + s.length > max && out.length) break;
    out.push(s.slice(0, max));
    len += s.length + 1;
  }
  return out.join(" ");
};

const readAloud = define({
  id: "read-aloud",
  label: T("Read-aloud button for my passage", "Botón de lectura en voz alta para mi texto"),
  purpose: T(
    "A listen button that reads the opening sentences of your own passage, with the text one press away.",
    "Un botón para escuchar que lee las primeras oraciones de su propio texto, con el texto a un paso.",
  ),
  category: "reading",
  tags: ["reading", "audio", "listening", "language"],
  needs: { passage: true },
  compatibility: { kinds: KINDS_PAGE, templates: "any" },
  accessibility: T(
    "Uses the device voice; a Show text button keeps the words available when no voice is installed.",
    "Usa la voz del dispositivo; un botón Mostrar texto mantiene las palabras disponibles si no hay voz instalada.",
  ),
  printable: {
    alternative: "none",
    note: T(
      "Paper shows only the label. Print the passage itself so students have the words.",
      "El papel solo muestra la etiqueta. Imprima el texto para que los estudiantes tengan las palabras.",
    ),
  },
  build: (a, cfg) => {
    const p = blocksOf(a, "passage").find((b) => b.text.trim());
    if (p)
      return fresh([
        {
          type: "audio",
          say: firstSentences(p.text),
          label: p.title || pick(T("Listen", "Escuchar"), cfg.lang),
        },
      ]);
    const ex = sampleBlock("p1");
    return [
      ...fresh([
        { type: "audio", say: firstSentences(ex.text), label: ex.title },
        ex,
        sampleQuestion("choice"),
      ]),
      starterNote(cfg.lang),
    ];
  },
});

// ── graphic organizers ───────────────────────────────────────────────────────

const ORGANIZERS = [
  [
    "kwl",
    T("Know / Want to know / Learned chart", "Tabla Sé / Quiero saber / Aprendí"),
    ["reading", "science", "inquiry"],
  ],
  [
    "compare",
    T("Compare and contrast organizer", "Organizador de comparar y contrastar"),
    ["reading", "science", "social studies"],
  ],
  [
    "cause-effect",
    T("Cause and effect organizer", "Organizador de causa y efecto"),
    ["reading", "science", "social studies", "history"],
  ],
  [
    "claim-evidence",
    T(
      "Claim, evidence and reasoning organizer",
      "Organizador de afirmación, evidencia y razonamiento",
    ),
    ["science", "writing", "evidence", "claim"],
  ],
  ["web", T("Idea web", "Mapa de ideas"), ["writing", "vocabulary", "brainstorm"]],
  [
    "sequence",
    T("Sequence organizer", "Organizador de secuencia"),
    ["reading", "history", "steps", "sequencing"],
  ],
];
const ORG_PURPOSE = {
  kwl: T(
    "Students record what they know, want to know and learned.",
    "Los estudiantes anotan lo que saben, quieren saber y aprendieron.",
  ),
  compare: T(
    "Students record what is the same and what is different.",
    "Los estudiantes anotan qué es igual y qué es diferente.",
  ),
  "cause-effect": T(
    "Students pair what happened with why it happened.",
    "Los estudiantes relacionan lo que pasó con por qué pasó.",
  ),
  "claim-evidence": T(
    "Students state a claim, the evidence for it and their reasoning.",
    "Los estudiantes dan una afirmación, la evidencia y su razonamiento.",
  ),
  web: T("Students gather ideas around a topic.", "Los estudiantes reúnen ideas sobre un tema."),
  sequence: T(
    "Students record steps or events in order.",
    "Los estudiantes anotan pasos o sucesos en orden.",
  ),
};
const ORG_FRAME = {
  "claim-evidence": T(
    "I claim ___ because the evidence shows ___.",
    "Afirmo ___ porque la evidencia muestra ___.",
  ),
};

const organizers = ORGANIZERS.map(([kind, label, tags]) =>
  define({
    id: `organizer-${kind}`,
    label,
    purpose: ORG_PURPOSE[kind],
    category: "organizer",
    tags: ["organizer", ...tags],
    configurable: [WITH_QUESTION],
    compatibility: { kinds: KINDS_PAGE, templates: "any" },
    accessibility: T(
      "Each box is a text area with a visible label.",
      "Cada casilla es un área de texto con una etiqueta visible.",
    ),
    printable: NATIVE(
      "Prints as a drawn organizer with writing space.",
      "Se imprime como organizador con espacio para escribir.",
    ),
    build: (a, cfg) => {
      const blocks = [{ type: "organizer", kind, prompts: [] }];
      if (wantsQuestion(a, cfg)) {
        const frame = ORG_FRAME[kind];
        blocks.push(
          writtenQuestion(
            pick(
              kind === "claim-evidence"
                ? T(
                    "Write your claim and the evidence that supports it.",
                    "Escriba su afirmación y la evidencia que la apoya.",
                  )
                : T(
                    "Use your organizer to explain your thinking.",
                    "Use su organizador para explicar su razonamiento.",
                  ),
              cfg.lang,
            ),
            frame ? pick(frame, cfg.lang) : "",
          ),
        );
      }
      return fresh(blocks);
    },
  }),
);

// ── reflection and formative checks ──────────────────────────────────────────

const reflection = define({
  id: "reflection",
  label: T("Reflection prompt", "Pregunta de reflexión"),
  purpose: T(
    "A short written reflection with a sentence frame. Edit the wording to fit your lesson.",
    "Una reflexión escrita corta con marco de oración. Edite el texto para su lección.",
  ),
  category: "reflection",
  tags: ["reflection", "writing", "metacognition"],
  accessibility: T(
    "A labelled text area with a sentence frame.",
    "Un área de texto con etiqueta y un marco de oración.",
  ),
  printable: NATIVE("Prints with ruled writing lines.", "Se imprime con líneas para escribir."),
  build: (_a, cfg) => [
    ...fresh([
      writtenQuestion(
        pick(
          T(
            "What is one thing you learned today? Why does it matter?",
            "¿Qué aprendió hoy? ¿Por qué importa?",
          ),
          cfg.lang,
        ),
        pick(
          T("Today I learned ___. It matters because ___.", "Hoy aprendí ___. Importa porque ___."),
          cfg.lang,
        ),
      ),
    ]),
  ],
});

const exitTicket = define({
  id: "exit-ticket",
  label: T(
    "Exit ticket (explain in your own words)",
    "Boleto de salida (explicar con sus palabras)",
  ),
  purpose: T(
    "A one-question formative check: students explain the main idea. Add your own sample answer to see what good looks like.",
    "Una verificación formativa de una pregunta: los estudiantes explican la idea principal. Agregue su propia respuesta de ejemplo.",
  ),
  category: "formative",
  tags: ["formative", "check", "writing", "explain"],
  compatibility: { kinds: ["check", "interactive", "worksheet"], templates: "any" },
  accessibility: T(
    "A labelled text area with a sentence frame.",
    "Un área de texto con etiqueta y un marco de oración.",
  ),
  printable: NATIVE("Prints with ruled writing lines.", "Se imprime con líneas para escribir."),
  build: (_a, cfg) =>
    fresh([
      writtenQuestion(
        pick(
          T(
            "Explain the main idea of today's lesson in your own words.",
            "Explique con sus palabras la idea principal de la lección de hoy.",
          ),
          cfg.lang,
        ),
        pick(
          T("The main idea is ___ because ___.", "La idea principal es ___ porque ___."),
          cfg.lang,
        ),
      ),
    ]),
});

export const BLOCK_COMPONENTS = [
  vocabList,
  vocabMatch,
  passageCheck,
  readAloud,
  dataTable,
  mathDisplay,
  ...organizers,
  reflection,
  exitTicket,
];
