// Adapter: Misconception Detective cases (src/claimcheck/cases.js, /claim-check/<id>). A case becomes the fictional
// classmate's numbered explanation, then the page's own steps as questions, each keyed by the case:
//   find the wrong line -> choice over the line numbers (the case's `flawed` line)
//   sort the evidence cards -> sort into evidence / assumption / not about this idea (each card's `kind`)
//   pick the replacement statement -> choice over the case's own statements (the one marked correct)
//   explain the mistake and the transfer question -> open responses (never graded)

import {
  fitter,
  openQuestion,
  pickQuestion,
  practiceDraft,
  sortQuestion,
  textBlock,
  vocabItems,
  withSpanish,
} from "./practice-parts.js";
import { list, t, text } from "./util.js";

const loadCases = () => import("../../claimcheck/engine.js");
const FRAME = "The mistake is ___ because ___.";

function questions(c, BUCKETS, fit) {
  const lineOpts = c.lines.map((_, i) => ({ id: `l${i + 1}`, text: `Line ${i + 1}` }));
  const fine = c.lines
    .map((_, i) => (c.whyFine[i] ? `Line ${i + 1}: ${text(c.whyFine[i].en)}` : ""))
    .filter(Boolean);
  const label = (kind) => text(BUCKETS[kind]?.en);
  return [
    pickQuestion(
      fit,
      {
        id: "find",
        prompt: "Tap the line you think is wrong.",
        hint: withSpanish(
          `Look closely at ${text(c.focus.en)}.`,
          `Mira con atención ${text(c.focus.es)}.`,
          400,
        ),
        explanation: [`Line ${c.flawed + 1} has the mistake.`, ...fine].join("\n"),
        skill: text(c.concept),
      },
      lineOpts,
      [`l${c.flawed + 1}`],
    ),
    sortQuestion(
      fit,
      {
        id: "sort",
        prompt: "Sort the evidence cards.",
        explanation: c.cards.map((k) => `"${text(k.en)}": ${text(k.note.en)}`).join("\n"),
        skill: "evidence and assumption",
      },
      ["evidence", "assumption", "offtopic"].map(label),
      c.cards.map((k, n) => ({ id: `k${n + 1}`, text: k.en, label: label(k.kind) })),
    ),
    pickQuestion(
      fit,
      {
        id: "fix",
        prompt: "Which statement should replace the line with the mistake?",
        explanation: withSpanish(c.why.en, c.why.es, 800),
        skill: text(c.concept),
      },
      c.fix.map((f, n) => ({ id: `f${n + 1}`, text: fit(f.en, 400, "Statement") })),
      c.fix.map((f, n) => (f.correct ? `f${n + 1}` : "")).filter(Boolean),
    ),
    openQuestion(
      fit,
      {
        id: "explain",
        prompt: `Explain the mistake in ${text(c.speaker)}'s thinking in one sentence.`,
        frame: FRAME,
      },
      { kind: "write", sample: c.why.en },
    ),
    openQuestion(
      fit,
      {
        id: "transfer",
        prompt: c.transfer.en,
        hint: withSpanish("", c.transfer.es, 400, "En español:"),
      },
      { kind: "explain" },
    ),
  ];
}

export default {
  family: "claim-check",
  label: t("Misconception Detective cases", "Casos del Detective de conceptos erróneos"),
  note: t(
    "Copies a case (the classmate's explanation, the wrong line, the evidence cards and the correct statement) into a draft you can edit.",
    "Copia un caso (la explicación del compañero, la línea equivocada, las tarjetas de evidencia y el enunciado correcto) en un borrador que puede editar.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "vocab",
    "prompts",
    "choices",
    "pairs",
    "answerKeys",
    "hints",
    "frames",
    "explanations",
    "samples",
    "openResponses",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t("Tapping a line in the explanation", "Tocar una línea de la explicación"),
      why: t(
        "The draft asks for the line number instead; the step-by-step case flow stays on the Misconception Detective page.",
        "El borrador pide el número de la línea; el recorrido paso a paso del caso permanece en la página del Detective.",
      ),
    },
  ],

  async list() {
    const { CASES } = await loadCases();
    return CASES.map((c) => ({
      id: c.id,
      title: text(c.title.en),
      grade: c.band,
      subject: c.subject,
      domain: "Reasoning",
      description: text(c.concept),
      count: 5,
    }));
  },

  url: (ref) => `/access-practice-lab/claim-check/${ref}`,

  async extract(ref) {
    const { caseById, BUCKETS } = await loadCases();
    const c = caseById(String(ref));
    if (!c) throw new Error("not-found");
    const { fit, overflow } = fitter();
    const explanation = c.lines.map((l, i) => `${i + 1}. ${text(l.en)}`).join("\n");
    const vocab = vocabItems(
      c.terms.map((tm) => ({ term: tm.w, def: tm.gloss, es: tm.es })),
      fit,
    );
    return {
      activity: practiceDraft(fit, overflow, {
        title: `Misconception Detective: ${text(c.title.en)}`,
        description: `${text(c.speaker)} explains ${text(c.concept)}, and one line is wrong.`,
        grade: c.band,
        subject: c.subject,
        objective: `Find and fix a mistaken idea about ${text(c.concept)}, and tell evidence from assumption.`,
        sourceNote: `Copied from Misconception Detective case ${c.id}.`,
        spanish: true,
        blocks: [
          textBlock("lines", `**${text(c.speaker)} explains:**\n${explanation}`, "body", fit),
          vocab,
          ...questions(c, BUCKETS, fit),
        ],
        teacher: [
          `Copied from Misconception Detective case ${c.id} (grades ${c.band}, ${c.subject}): ${text(c.title.en)}.`,
          `Kind of mistake: ${c.flaw}. The wrong line is line ${c.flawed + 1}.`,
          `Words that show a student named the idea: ${c.accept.join(", ")}.`,
        ],
      }),
      notes: [
        t(
          "Not carried: the Spanish version of the explanation lines and cards, the sentence check that looks for the idea's words, and the case-by-case progress record.",
          "No se conserva: la versión en español de las líneas y tarjetas, la revisión de la oración que busca las palabras de la idea ni el registro de progreso por caso.",
        ),
      ],
      source: c,
      url: `/access-practice-lab/claim-check/${c.id}`,
      sourceTitle: text(c.title.en),
    };
  },
};
