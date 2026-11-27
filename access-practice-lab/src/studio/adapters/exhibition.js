// Adapter: Language World exhibitions (src/content/exhibition.js, /exhibition?grades=<band>). The exhibition for one
// grade band becomes its four linked tasks in order, keyed as the exhibition keys them:
//   listen -> the announcement as read-aloud + transcript, choice questions (the option marked ok)
//   read   -> the exhibit card as numbered sentences, choice questions, and evidence questions as a choice over the
//             sentence numbers (the sentence the exhibition names)
//   speak, write (and the write transfer task) -> open responses with the level-A frames, the exhibition's own checks
//             as the self-check and its model as the sample (never graded)
// The glossary words of every task become one vocabulary block with their Spanish.

import {
  audioBlocks,
  fitter,
  openQuestion,
  passageBlocks,
  pickQuestion,
  practiceDraft,
  textBlock,
  vocabItems,
  whyNot,
} from "./practice-parts.js";
import { list, t, text } from "./util.js";

const load = () => import("../../content/exhibition.js");

function choiceQ(q, id, fit, skill) {
  const right = q.options.find((o) => o.ok);
  const why = q.options
    .filter((o) => !o.ok && o.why)
    .map((o) => `"${text(o.text)}": ${text(o.why)}`);
  return pickQuestion(
    fit,
    { id, prompt: q.prompt, explanation: whyNot(why), skill },
    q.options.map((o, n) => ({ id: `o${n + 1}`, text: fit(o.text, 400, "Answer choice") })),
    [`o${q.options.indexOf(right) + 1}`],
  );
}

function evidenceQ(q, id, sentences, fit) {
  return pickQuestion(
    fit,
    { id, prompt: q.prompt, explanation: text(q.why), skill: "evidence" },
    sentences.map((_, n) => ({ id: `s${n + 1}`, text: `Sentence ${n + 1}` })),
    [`s${Number(q.answer) + 1}`],
  );
}

function taskBlocks(ex, fit) {
  const { listen, read, speak, write } = ex.tasks;
  const out = [];
  out.push(textBlock("h-listen", `**Listen.** ${text(listen.objective)}`, "heading", fit));
  out.push(...audioBlocks("listen", "Listen: the announcement", listen.script));
  listen.questions.forEach((q, i) => {
    out.push(choiceQ(q, `l${i + 1}-${q.id}`.slice(0, 32), fit, "listening for details"));
  });
  out.push(textBlock("h-read", `**Read.** ${text(read.objective)}`, "heading", fit));
  out.push(
    ...passageBlocks("card", read.cardTitle, [
      read.sentences.map((s, n) => `(${n + 1}) ${text(s)}`).join(" "),
    ]),
  );
  read.questions.forEach((q, i) => {
    const id = `r${i + 1}-${q.id}`.slice(0, 32);
    out.push(
      q.kind === "evidence"
        ? evidenceQ(q, id, read.sentences, fit)
        : choiceQ(q, id, fit, "reading"),
    );
  });
  out.push(textBlock("h-speak", `**Speak.** ${text(speak.objective)}`, "heading", fit));
  out.push(
    openQuestion(
      fit,
      {
        id: "speak",
        prompt: speak.prompt,
        frame: list(speak.frames?.A).map(text).join(" "),
        hint: list(speak.plan)
          .map(([, q]) => text(q))
          .join(" "),
      },
      { kind: "explain", sample: speak.model, rubric: list(speak.checks).map(([, line]) => line) },
    ),
  );
  out.push(textBlock("h-write", `**Write.** ${text(write.objective)}`, "heading", fit));
  const marks = list(write.feedback).map((f) => text(f.label));
  for (const [id, prompt] of [
    ["write", write.prompt],
    ["write-transfer", write.transfer],
  ])
    if (text(prompt))
      out.push(
        openQuestion(
          fit,
          {
            id,
            prompt,
            frame: list(write.frames?.A).map(text).join(" "),
            hint: list(write.organizer)
              .map(([, label]) => text(label))
              .join(" / "),
          },
          { kind: "write", rubric: marks },
        ),
      );
  return out;
}

export default {
  family: "exhibition",
  label: t("Language World exhibitions", "Exhibiciones de Language World"),
  note: t(
    "Copies an exhibition's four linked tasks (listen, read, speak, write) into a draft you can edit.",
    "Copia las cuatro tareas enlazadas de una exhibición (escuchar, leer, hablar, escribir) en un borrador que puede editar.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "passage",
    "audio",
    "vocab",
    "prompts",
    "choices",
    "answerKeys",
    "hints",
    "frames",
    "explanations",
    "rubric",
    "samples",
    "openResponses",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t(
        "The exhibition map, diagram and support levels",
        "El mapa, el diagrama y los niveles de apoyo",
      ),
      why: t(
        "The draft uses the level-A frames; the map, the diagram and switching support levels stay on the exhibition page.",
        "El borrador usa los marcos del nivel A; el mapa, el diagrama y el cambio de nivel de apoyo permanecen en la página.",
      ),
    },
  ],

  async list() {
    const { EXHIBITIONS } = await load();
    return Object.values(EXHIBITIONS).map((ex) => ({
      id: ex.band,
      title: text(ex.title),
      grade: ex.band,
      subject: "Science",
      domain: "Language World",
      description: text(ex.summary),
      count: Object.values(ex.tasks).reduce((n, tk) => n + list(tk.questions).length, 0) + 3,
    }));
  },

  url: () => "/access-practice-lab/exhibition",

  async extract(ref) {
    const { EXHIBITIONS, EXHIBITION_GLOSSARY } = await load();
    const ex = Object.hasOwn(EXHIBITIONS, String(ref)) ? EXHIBITIONS[ref] : null;
    if (!ex) throw new Error("not-found");
    const { fit, overflow } = fitter();
    const words = [...new Set(Object.values(ex.tasks).flatMap((tk) => list(tk.vocab)))];
    const vocab = vocabItems(
      words
        .filter((w) => EXHIBITION_GLOSSARY[w])
        .map((w) => {
          const [def, es, example] = EXHIBITION_GLOSSARY[w];
          return { term: w, def, es, example };
        }),
      fit,
    );
    return {
      activity: practiceDraft(fit, overflow, {
        title: text(ex.title),
        description: text(ex.summary),
        grade: ex.band,
        subject: "Science",
        objective: Object.values(ex.tasks)
          .map((tk) => text(tk.objective))
          .join(" "),
        sourceNote: `Copied from the Language World exhibition for grades ${ex.band}.`,
        spanish: Boolean(vocab?.items.some((v) => v.es)),
        blocks: [
          textBlock("setting", `${text(ex.setting)}. ${text(ex.summary)}`, "directions", fit),
          vocab,
          ...taskBlocks(ex, fit),
        ],
        teacher: [
          `Copied from the Language World exhibition "${text(ex.title)}" (grades ${ex.band}). ${text(ex.standard)} (WIDA-aligned original practice, not official WIDA material).`,
          "Speak and write use the level-A frames; the exhibition also has level-B and level-C frames.",
        ],
      }),
      notes: [
        t(
          "Not carried: the map and diagram, the level-B and level-C frames, the written-response feedback rules and the revision step.",
          "No se conserva: el mapa y el diagrama, los marcos de los niveles B y C, las reglas de retroalimentación de la escritura ni el paso de revisión.",
        ),
      ],
      source: ex,
      url: "/access-practice-lab/exhibition",
      sourceTitle: text(ex.title),
    };
  },
};
