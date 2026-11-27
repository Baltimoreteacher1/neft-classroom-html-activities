// Adapter: Language Construction Lab (EXPANSION_CHALLENGES and REGISTER_TRANSFORMS in src/views/construction.js,
// /construction). The lab is one page, so it is one source (ref "lab"):
//   each sentence-expansion challenge -> its kernel, each stage's prompt and phrase choices with their register notes,
//     and one open writing response whose sample is the lab's finished sentence (the lab accepts any phrase, so no
//     phrase is marked right or wrong here either)
//   each register transform -> a choice over the lab's rewrites, keyed by the one it marks correct

import {
  fitter,
  openQuestion,
  pickQuestion,
  practiceDraft,
  textBlock,
  whyNot,
} from "./practice-parts.js";
import { list, t, text } from "./util.js";

const load = () => import("../../views/construction.js");

function expansionBlocks(c, n, fit) {
  const stages = list(c.stages);
  const lines = stages.map(
    (s, i) =>
      `${i + 1}. ${text(s.prompt)}\n${list(s.options)
        .map((o) => `- ${text(o.text)} (${text(o.note)})`)
        .join("\n")}`,
  );
  return [
    textBlock(`exp${n}`, `**${text(c.topic)}**\n\nStarting sentence: ${text(c.kernel)}\n\n${lines.join("\n\n")}`, "body", fit),
    openQuestion(
      fit,
      {
        id: `expand${n}`,
        prompt: `Expand the sentence "${text(c.kernel)}" one step at a time, choosing a phrase for each step.`,
        hint: stages.map((s) => text(s.prompt)).join(" "),
        skill: "sentence expansion",
      },
      { kind: "write", sample: text(stages[stages.length - 1]?.target) },
    ),
  ];
}

function registerQuestion(r, n, fit) {
  const opts = list(r.options);
  const why = opts.filter((o) => !o.correct).map((o) => `"${text(o.text)}": ${text(o.reason)}`);
  return pickQuestion(
    fit,
    {
      id: `register${n}`,
      prompt: `Which sentence says this in an academic register? "${text(r.informal)}"`,
      explanation: [opts.find((o) => o.correct)?.reason, whyNot(why)].map(text).filter(Boolean).join("\n\n"),
      skill: "academic register",
    },
    opts.map((o, i) => ({ id: `o${i + 1}`, text: fit(o.text, 400, "Sentence") })),
    opts.map((o, i) => (o.correct ? `o${i + 1}` : "")).filter(Boolean),
  );
}

export default {
  family: "construction-lab",
  label: t("Language Construction Lab", "Laboratorio de construcción del lenguaje"),
  note: t(
    "Copies the lab's sentence-expansion challenges and academic-register rewrites into a draft you can edit.",
    "Copia los retos de expansión de oraciones y las reescrituras de registro académico del laboratorio en un borrador que puede editar.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "prompts",
    "choices",
    "answerKeys",
    "hints",
    "explanations",
    "samples",
    "openResponses",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t("Building the sentence on screen", "Construir la oración en pantalla"),
      why: t(
        "The lab inserts each phrase into the sentence as you go; the draft lists the phrases and asks for the finished sentence.",
        "El laboratorio inserta cada frase en la oración; el borrador muestra las frases y pide la oración terminada.",
      ),
    },
  ],

  async list() {
    const { EXPANSION_CHALLENGES, REGISTER_TRANSFORMS } = await load();
    return [
      {
        id: "lab",
        title: "Language Construction Lab",
        grade: "6-8",
        subject: "Science",
        domain: "Writing",
        description: "Sentence expansion and academic register.",
        count: EXPANSION_CHALLENGES.length + REGISTER_TRANSFORMS.length,
      },
    ];
  },

  url: () => "/access-practice-lab/construction",

  async extract(ref) {
    if (ref !== "lab") throw new Error("not-found");
    const { EXPANSION_CHALLENGES, REGISTER_TRANSFORMS } = await load();
    const { fit, overflow } = fitter();
    return {
      activity: practiceDraft(fit, overflow, {
        title: "Language Construction Lab: expand and formalize",
        description: "Expand short kernel sentences into academic sentences, then choose academic rewrites of informal ones.",
        grade: "6-8",
        subject: "Science",
        objective: "Expand sentences with cause, place and consequence clauses, and shift informal sentences into academic register.",
        sourceNote: "Copied from the Language Construction Lab.",
        spanish: false,
        blocks: [
          ...EXPANSION_CHALLENGES.flatMap((c, i) => expansionBlocks(c, i + 1, fit)),
          ...REGISTER_TRANSFORMS.map((r, i) => registerQuestion(r, i + 1, fit)),
        ],
        teacher: [
          "Copied from the Language Construction Lab (sentence expansion and the academic register transformer).",
          "The lab accepts any phrase at each expansion step and labels each with a register note; the draft keeps those notes and does not mark one phrase right.",
        ],
      }),
      notes: [
        t(
          "Not carried: inserting phrases into the sentence on screen and reading it aloud. The lab has no Spanish for this content.",
          "No se conserva: insertar las frases en la oración en pantalla ni leerla en voz alta. El laboratorio no tiene español para este contenido.",
        ),
      ],
      source: { EXPANSION_CHALLENGES, REGISTER_TRANSFORMS },
      url: "/access-practice-lab/construction",
      sourceTitle: "Language Construction Lab",
    };
  },
};
