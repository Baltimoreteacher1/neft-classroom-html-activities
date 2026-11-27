// Adapter: Language Worlds missions (src/content/world-missions.js, a pure data module): four worlds (Signal
// Station, Evidence City, Conversation Quest, StoryWorks), eight missions per grade band. A world's missions for one
// band become one activity: each mission's context and source, its question with the authored answer and feedback
// (or, for writing missions, the task with its success criteria) and the independent transfer prompt with its frame.
// Loaded on demand so the Create panel stays light.

import { choiceAt, fitNote, labActivity } from "./lab-parts.js";
import { openQuestion } from "./vocab-parts.js";
import { list, t, text } from "./util.js";

const load = async () => (await import("../../content/world-missions.js")).WORLD_MISSIONS;
const REF = /^([a-z]+(?:-[a-z]+)*)-(\d-\d|K-2|K)$/;

const urlFor = (ref) => {
  const m = REF.exec(String(ref));
  return m ? `/access-practice-lab/worlds/${m[1]}?grades=${m[2]}` : "";
};

function missionBlocks(ms, n) {
  const stem = [text(ms.title), text(ms.context), text(ms.stimulus), text(ms.prompt)]
    .filter(Boolean)
    .join("\n\n");
  const main = list(ms.choices).length
    ? choiceAt({
        id: `m${n}`,
        prompt: stem,
        options: ms.choices,
        answer: ms.answer,
        explanation: ms.feedback,
      })
    : openQuestion({
        id: `m${n}`,
        prompt: stem,
        kind: "write",
        frame: text(ms.frame).slice(0, 300),
        rubric: [text(ms.successCriteria)].filter(Boolean),
      });
  const transfer = text(ms.independent)
    ? [
        openQuestion({
          id: `m${n}-own`,
          prompt: text(ms.independent),
          kind: "explain",
          frame: list(ms.choices).length ? text(ms.frame).slice(0, 300) : "",
        }),
      ]
    : [];
  return [main, ...transfer];
}

export default {
  family: "world-missions",
  label: t("Language Worlds missions", "Misiones de los Mundos del lenguaje"),
  note: t(
    "Copies one world's eight missions for a grade band into an activity you can edit: each source, question, answer and feedback, and the independent transfer prompt with its frame.",
    "Copia las ocho misiones de un mundo para una banda de grados en una actividad que puede editar: cada fuente, pregunta, respuesta y comentario, y la consigna de transferencia independiente con su marco.",
  ),
  editable: [
    "title",
    "description",
    "prompts",
    "choices",
    "answerKeys",
    "frames",
    "explanations",
    "rubric",
    "openResponses",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t(
        "The world map, mission console and sound",
        "El mapa del mundo, la consola de misiones y el sonido",
      ),
      why: t(
        "These are the Language Worlds game layer; the copy keeps every mission's content.",
        "Son la capa de juego de los Mundos del lenguaje; la copia conserva el contenido de cada misión.",
      ),
    },
    {
      what: t("Spanish", "Español"),
      why: t(
        "The missions have no Spanish in the source, so the copy has none either.",
        "Las misiones no tienen español en la fuente, así que la copia tampoco lo tiene.",
      ),
    },
  ],

  async list() {
    return Object.entries(await load()).flatMap(([key, w]) =>
      Object.entries(w.bands || {}).map(([band, ms]) => ({
        id: `${key}-${band}`,
        title: `${text(w.world)} missions, grades ${band}`,
        grade: band,
        subject: "",
        domain: text(w.domain),
        description: list(ms)
          .map((x) => text(x.title))
          .join(", "),
        count: list(ms).length,
      })),
    );
  },

  url: urlFor,

  async extract(ref) {
    const m = REF.exec(String(ref));
    if (!m) throw new Error("bad-ref");
    const world = (await load())[m[1]];
    const missions = list(world?.bands?.[m[2]]);
    if (!missions.length) throw new Error("not-found");
    const note = fitNote([
      `Copied from the ${text(world.world)} world (${text(world.domain)}), grades ${m[2]}: ${missions.length} missions.`,
    ]);
    return {
      activity: labActivity({
        title: `${text(world.world)} missions, grades ${m[2]}`,
        description: missions.map((x) => text(x.title)).join(", "),
        grade: m[2],
        subject: "",
        curriculum: "Language Page Language Worlds",
        objective: `${text(world.domain)}: use the source to answer, then transfer the skill to a new task.`,
        sourceNote: `Copied from Language Worlds ${ref}.`,
        template: "explore-practice",
        blocks: missions.flatMap((x, i) => missionBlocks(x, i + 1)),
        teacher: note.teacher,
        frames: true,
      }),
      notes: [
        t(
          "Not carried: the world map, the mission console, sound and the progress record.",
          "No se conserva: el mapa del mundo, la consola de misiones, el sonido ni el registro de progreso.",
        ),
      ],
      source: missions,
      url: urlFor(ref),
      sourceTitle: `${text(world.world)} ${m[2]}`,
    };
  },
};
