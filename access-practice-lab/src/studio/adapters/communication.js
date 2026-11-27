// Adapter: Culture & Communication Explorer scenarios (src/content/communication.js, /communication/<id>). A scenario
// becomes its situation and audience card, then the page's five steps:
//   Compare      -> choice over the scenario's messages (the one marked best), with every message's reason
//   What if...?  -> sort each part of the message into Changes / Stays the same (each part's own `changes`)
//   Your languages -> open response (the page never checks it; neither does the draft)
//   Your message -> open writing response with the scenario's frames and model message

import {
  fitter,
  openQuestion,
  pairOf,
  pickQuestion,
  practiceDraft,
  sortQuestion,
  textBlock,
  whyNot,
  withSpanish,
} from "./practice-parts.js";
import { list, t, text } from "./util.js";

const load = () => import("../../content/communication.js");
const CARD = [
  ["audience", "Audience"],
  ["purpose", "Purpose"],
  ["setting", "Setting"],
  ["relationship", "Relationship"],
  ["medium", "Medium"],
];

function questions(sc, fit) {
  const best = sc.versions.find((v) => v.best);
  const others = sc.versions
    .filter((v) => v !== best)
    .map((v) => `"${text(v.text)}": ${pairOf(v.why).en}${v.when ? ` ${pairOf(v.when).en}` : ""}`);
  const shift = sc.shift || {};
  const task = sc.task || {};
  const words = list(task.words).map((w) => `${text(w.w)} (${text(w.es)})`);
  return [
    pickQuestion(
      fit,
      {
        id: "compare",
        prompt: "Which message fits this situation?",
        explanation: [pairOf(best?.why).en, whyNot(others)].filter(Boolean).join("\n\n"),
        skill: "register and audience",
      },
      sc.versions.map((v, n) => ({ id: `v${n + 1}`, text: fit(v.text, 400, "Message") })),
      [`v${sc.versions.indexOf(best) + 1}`],
    ),
    sortQuestion(
      fit,
      {
        id: "whatif",
        prompt: `${pairOf(shift.change).en} Which parts of the message change, and which stay the same?`,
        hint: withSpanish("", pairOf(shift.change).es, 400),
        explanation: list(shift.items)
          .map((it) => `${pairOf(it.part).en}: ${pairOf(it.why).en}`)
          .join("\n"),
        skill: "audience",
      },
      ["Changes", "Stays the same"],
      list(shift.items).map((it, n) => ({
        id: `p${n + 1}`,
        text: pairOf(it.part).en,
        label: it.changes ? "Changes" : "Stays the same",
      })),
    ),
    openQuestion(
      fit,
      {
        id: "languages",
        prompt: pairOf(sc.reflect).en,
        hint: withSpanish("", pairOf(sc.reflect).es, 400),
      },
      { kind: "explain" },
    ),
    openQuestion(
      fit,
      {
        id: "message",
        prompt: pairOf(task.prompt).en,
        frame: list(task.frames).map(text).join(" "),
        hint: words.length ? `Words you can use: ${words.join(", ")}` : "",
      },
      { kind: "write", sample: text(task.model) },
    ),
  ];
}

export default {
  family: "communication",
  label: t("Culture & Communication scenarios", "Situaciones de Cultura y comunicación"),
  note: t(
    "Copies a scenario (the situation, its messages, what changes for a new audience, and the writing task) into a draft you can edit.",
    "Copia una situación (el contexto, sus mensajes, lo que cambia con otra audiencia y la tarea de escritura) en un borrador que puede editar.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
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
      what: t(
        "The message dials and read-aloud of your message",
        "Los diales del mensaje y la lectura en voz alta",
      ),
      why: t(
        "These are the Explorer's own tools; the draft keeps the scenario's words and keys.",
        "Son herramientas propias del Explorador; el borrador conserva las palabras y las claves de la situación.",
      ),
    },
  ],

  async list() {
    const { SCENARIOS } = await load();
    return SCENARIOS.map((sc) => ({
      id: sc.id,
      title: pairOf(sc.title).en,
      grade: sc.band,
      subject: "",
      domain: "Communication",
      description: pairOf(sc.situation).en,
      count: 4,
    }));
  },

  url: (ref) => `/access-practice-lab/communication/${ref}`,

  async extract(ref) {
    const { scenarioById } = await load();
    const sc = scenarioById(String(ref));
    if (!sc || sc.id !== String(ref)) throw new Error("not-found");
    const { fit, overflow } = fitter();
    const situation = pairOf(sc.situation);
    const card = CARD.filter(([k]) => sc.card?.[k])
      .map(([k, label]) => `${label}: ${pairOf(sc.card[k]).en}`)
      .concat(sc.card?.register ? [`Register: ${text(sc.card.register)}`] : []);
    return {
      activity: practiceDraft(fit, overflow, {
        title: pairOf(sc.title).en,
        description: situation.en,
        grade: sc.band,
        objective:
          "Choose and write a message that fits its audience, purpose, setting and medium.",
        sourceNote: `Copied from Culture & Communication scenario ${sc.id}.`,
        spanish: true,
        blocks: [
          textBlock("situation", withSpanish(situation.en, situation.es, 4000), "directions", fit),
          textBlock("card", card.join("\n"), "body", fit),
          ...questions(sc, fit),
        ],
        teacher: [
          `Copied from Culture & Communication scenario ${sc.id} (grades ${sc.band}, theme ${text(sc.theme)}).`,
          "The Your languages question is a reflection: the Explorer never checks or records it, and the draft does not grade it.",
        ],
      }),
      notes: [
        t(
          "Not carried: the Spanish of the messages and reasons, the message dials and the written-message checks.",
          "No se conserva: el español de los mensajes y las razones, los diales del mensaje ni las revisiones del mensaje escrito.",
        ),
      ],
      source: sc,
      url: `/access-practice-lab/communication/${sc.id}`,
      sourceTitle: pairOf(sc.title).en,
    };
  },
};
