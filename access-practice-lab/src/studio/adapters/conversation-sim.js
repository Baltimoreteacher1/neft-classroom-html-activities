// Adapter: Conversation Simulator scenarios (SCENARIOS in src/views/conversation.js, /conversation/<scenario>). A scenario
// becomes its topic and each dialogue turn in order: what the partner or teacher says, then a choice over the turn's
// sample responses. The key is the response the simulator rates "High" academic quality; every response's own feedback
// line becomes the explanation. The optional oral rehearsal is one open speaking response.

import {
  audioBlocks,
  fitter,
  openQuestion,
  pickQuestion,
  practiceDraft,
  textBlock,
  whyNot,
} from "./practice-parts.js";
import { list, t, text } from "./util.js";

const load = () => import("../../views/conversation.js");

function turnBlocks(turn, n, fit) {
  const opts = list(turn.options);
  const answers = opts.map((o, i) => (o.academicQuality === "High" ? `o${i + 1}` : "")).filter(Boolean);
  const right = opts.filter((o) => o.academicQuality === "High").map((o) => text(o.feedback));
  const others = opts
    .filter((o) => o.academicQuality !== "High")
    .map((o) => `"${text(o.text)}" (${text(o.academicQuality)}): ${text(o.feedback)}`);
  return [
    ...audioBlocks(`t${n}`, `Turn ${n}: ${text(turn.speaker)}`, [`${text(turn.speaker)}: ${text(turn.speech)}`]),
    pickQuestion(
      fit,
      {
        id: `turn${n}`,
        prompt: `Your goal: ${text(turn.studentGoal)} Which response meets the goal best?`,
        explanation: [...right, whyNot(others)].filter(Boolean).join("\n\n"),
        skill: "academic discussion",
      },
      opts.map((o, i) => ({ id: `o${i + 1}`, text: fit(o.text, 400, "Response") })),
      answers,
    ),
  ];
}

export default {
  family: "conversation-sim",
  label: t("Conversation Simulator scenarios", "Situaciones del Simulador de conversación"),
  note: t(
    "Copies a discussion scenario (each turn and its sample responses with feedback) into a draft you can edit.",
    "Copia una situación de conversación (cada turno y sus respuestas de ejemplo con comentarios) en un borrador que puede editar.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "passage",
    "audio",
    "prompts",
    "choices",
    "answerKeys",
    "explanations",
    "openResponses",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t("The scene picture and the recorder", "La imagen de la escena y la grabadora"),
      why: t(
        "They belong to the simulator page; the draft keeps every turn's words and feedback.",
        "Pertenecen a la página del simulador; el borrador conserva las palabras y los comentarios de cada turno.",
      ),
    },
  ],

  async list() {
    const { SCENARIOS } = await load();
    return SCENARIOS.map((s) => ({
      id: s.id,
      title: text(s.title),
      grade: text(s.grade),
      subject: "",
      domain: "Speaking",
      description: text(s.topic),
      count: list(s.turns).length + 1,
    }));
  },

  url: (ref) => `/access-practice-lab/conversation/${ref}`,

  async extract(ref) {
    const { SCENARIOS } = await load();
    const s = SCENARIOS.find((x) => x.id === String(ref));
    if (!s) throw new Error("not-found");
    const { fit, overflow } = fitter();
    const speakers = Object.values(s.speakers || {}).map(text);
    return {
      activity: practiceDraft(fit, overflow, {
        title: `Conversation: ${text(s.title)}`,
        description: text(s.topic),
        grade: text(s.grade),
        objective: "Rehearse an academic discussion: clarify, present evidence and build an argument.",
        sourceNote: `Copied from Conversation Simulator scenario ${s.id}.`,
        spanish: false,
        blocks: [
          textBlock("topic", `**${text(s.topic)}.** With ${speakers.join(" and ")}.`, "directions", fit),
          ...list(s.turns).flatMap((turn, i) => turnBlocks(turn, i + 1, fit)),
          openQuestion(
            fit,
            {
              id: "rehearse",
              prompt: "Review the responses. Say your favourite one aloud to a partner.",
            },
            { kind: "explain" },
          ),
        ],
        teacher: [
          `Copied from Conversation Simulator scenario ${s.id} (grades ${text(s.grade)}).`,
          "The key on each turn is the response the simulator rates High academic quality; its ratings are practice language, not a score.",
        ],
      }),
      notes: [
        t(
          "Not carried: the scene picture, the read-aloud voices and the recorder. The simulator has no Spanish for these scenarios.",
          "No se conserva: la imagen de la escena, las voces de lectura ni la grabadora. El simulador no tiene español para estas situaciones.",
        ),
      ],
      source: s,
      url: `/access-practice-lab/conversation/${s.id}`,
      sourceTitle: text(s.title),
    };
  },
};
