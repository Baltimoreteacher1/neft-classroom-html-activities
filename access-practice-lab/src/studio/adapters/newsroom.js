// Adapter: Newsroom story prompts (src/content/newsroom.js, 48 prompts: 24 for grades 3-5, 24 for 6-8). A prompt becomes
// the story assignment in English and Spanish, the reporter's notes (the facts the story is built from), the prompt's own
// reporter questions as open responses, and the story itself as an open writing task with the Newsroom's lead frames
// (src/lang/newsroom.js). Writing is never auto-graded; nothing is reworded.

import { openQuestion } from "./vocab-parts.js";
import { list, noteBlocks, t, text } from "./util.js";

const URL = "/access-practice-lab/newsroom";
const urlFor = (id) => `${URL}/${id}`;
const content = () => import("../../content/newsroom.js");
const kit = () => import("../../lang/newsroom.js");

export default {
  family: "newsroom-prompts",
  label: t("Newsroom story prompts", "Consignas de noticias del Newsroom"),
  note: t(
    "Copies a story assignment with its reporter's notes, its reporter questions and the story writing task with frames.",
    "Copia una consigna de noticia con las notas del reportero, sus preguntas de reportero y la tarea de escribir la noticia con marcos.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "passage",
    "prompts",
    "frames",
    "openResponses",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t(
        "The 5W1H planner, recording and front-page layout",
        "El planificador 5W1H, la grabación y el diseño de portada",
      ),
      why: t(
        "These are Newsroom tools on the device; a copy keeps the assignment, the facts and the writing tasks.",
        "Son herramientas del Newsroom en el dispositivo; una copia conserva la consigna, los datos y las tareas de escritura.",
      ),
    },
  ],

  async list() {
    const { NEWS_PROMPTS } = await content();
    return NEWS_PROMPTS.map((p) => ({
      id: p.id,
      title: text(p.title),
      grade: text(p.b),
      subject: "",
      domain: "Writing",
      description: text(p.kind),
      count: list(p.ask).length + 1,
    }));
  },

  url: urlFor,

  async extract(ref) {
    const [{ NEWS_PROMPTS }, { FRAMES }] = await Promise.all([content(), kit()]);
    const p = NEWS_PROMPTS.find((x) => x.id === ref);
    if (!p) throw new Error("bad-source");
    const asks = list(p.ask).map(text);
    const asksEs = list(p.askEs).map(text);
    const assignment = [
      text(p.seed),
      text(p.seedEs) && `En español: ${text(p.seedEs)}`,
      asks.length && `Questions a reader will ask: ${asks.join(" ")}`,
      asksEs.length && `Preguntas: ${asksEs.join(" ")}`,
    ]
      .filter(Boolean)
      .join("\n\n");
    const notes = list(p.notes).map(text).filter(Boolean);
    const lead = list(FRAMES?.lead)
      .map((f) => text(f[0]))
      .join(" ");
    const blocks = [
      { type: "text", id: "assignment", role: "body", text: assignment },
      ...(notes.length
        ? [{ type: "passage", id: "notes", title: "Reporter's notes", text: notes.join("\n\n") }]
        : []),
      ...asks.map((q, i) =>
        openQuestion({
          id: `ask${i + 1}`,
          prompt: notes.length ? `${q} Use the reporter's notes.` : q,
          kind: "explain",
        }),
      ),
      openQuestion({
        id: "story",
        prompt: `Write the ${text(p.kind)} story: ${text(p.title)}. ${text(p.seed)}`,
        kind: "write",
        frame: lead.slice(0, 300),
      }),
    ];
    return {
      activity: {
        title: `Newsroom: ${text(p.title)}`.slice(0, 120),
        description: `${text(p.kind)} story · grades ${text(p.b)}`,
        kind: "worksheet",
        template: "reading-writing",
        context: {
          grade: text(p.b),
          subject: "",
          curriculum: "Newsroom",
          objective:
            "Plan and write a news story from facts, answering the questions a reader will ask.",
          standards: [],
          source: { origin: "teacher", note: `Copied from Newsroom prompt ${p.id}.` },
        },
        supports: {
          wida: 0,
          hints: false,
          frames: true,
          spanish: Boolean(text(p.seedEs)),
          readAloud: false,
          visuals: false,
          chunk: false,
        },
        options: { shuffle: false, revise: true, answerKey: false },
        blocks: [
          ...blocks,
          ...noteBlocks("news", [
            `Copied from Newsroom prompt ${p.id}. Spanish title: ${text(p.titleEs)}.`,
          ]),
        ],
        notes: { teacher: "", misconceptions: [] },
      },
      notes: [
        t(
          "Not carried: the 5W1H planner, the picture set, recording and the printable front page.",
          "No se conserva: el planificador 5W1H, las imágenes, la grabación ni la portada para imprimir.",
        ),
      ],
      source: { id: p.id, seed: p.seed, ask: p.ask, notes: p.notes, title: p.title },
      url: urlFor(ref),
      sourceTitle: text(p.title),
    };
  },
};
