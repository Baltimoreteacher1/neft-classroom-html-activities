// Adapter: Language City missions (src/content/city.js, /city/<building>/<mission>). A mission becomes its goal and each
// of its steps in order, keyed exactly as the city keys them:
//   choose -> the sign, menu or line the character says, then a choice over the step's options (its `answer`)
//   build  -> an order question over the words of the step's accepted sentence (the extra tiles are listed in the note)
//   say    -> an open speaking response with the step's frame (never graded)
// Word banks keep their Spanish; the why-line of every option becomes the explanation.

import {
  fitter,
  openQuestion,
  orderQuestion,
  pairOf,
  pickQuestion,
  practiceDraft,
  textBlock,
  whyNot,
} from "./practice-parts.js";
import { list, t, text } from "./util.js";

const load = () => import("../../content/city.js");
const REF = /^([a-z0-9-]+)\/([a-z0-9-]+)$/;

const bankLine = (bank) =>
  list(bank).length
    ? `Word bank: ${bank.map((w) => (w.es ? `${text(w.en)} (${text(w.es)})` : text(w.en))).join(", ")}`
    : "";

function stimulusBlock(step, npc, n, fit) {
  const s = step.stim;
  if (!s) return null;
  if (s.type === "doc")
    return textBlock(
      `st${n}`,
      [`**${pairOf(s.head).en}**`, ...list(s.lines).map((l) => pairOf(l).en)].join("\n"),
      "body",
      fit,
    );
  if (s.type === "speech") return textBlock(`st${n}`, `**${npc}:** "${text(s.en)}"`, "body", fit);
  return null;
}

function stepBlocks(step, npc, n, fit, dropped) {
  const hint = [pairOf(step.hint).en, bankLine(step.bank)].filter(Boolean).join("\n");
  const frame = pairOf(step.frame).en;
  if (step.kind === "choose") {
    const opts = list(step.opts);
    const right = opts.find((o) => o.id === step.answer);
    const others = opts
      .filter((o) => o !== right && o.why)
      .map((o) => `"${text(o.en)}": ${pairOf(o.why).en}`);
    return [
      stimulusBlock(step, npc, n, fit),
      pickQuestion(
        fit,
        {
          id: `s${n}-${step.id}`.slice(0, 32),
          prompt: pairOf(step.ask).en,
          hint,
          frame,
          explanation: [pairOf(right?.why).en, whyNot(others)].filter(Boolean).join("\n\n"),
          skill: text(step.role),
        },
        opts.map((o, i) => ({ id: `o${i + 1}`, text: fit(o.en, 400, "Answer choice") })),
        [`o${opts.indexOf(right) + 1}`],
      ),
    ];
  }
  if (step.kind === "build") {
    const words = list(step.ok?.[0]).map(text);
    const extra = list(step.tiles).map(text);
    for (const w of words) if (extra.includes(w)) extra.splice(extra.indexOf(w), 1);
    if (extra.length)
      dropped.push(
        `Step ${n} (${pairOf(step.intent).en}): extra word tiles on the city page: ${extra.join(", ")}.`,
      );
    const slips = list(step.slips).map((s) => `"${list(s.order).join(" ")}": ${pairOf(s.why).en}`);
    return [
      orderQuestion(
        fit,
        {
          id: `s${n}-${step.id}`.slice(0, 32),
          prompt: `${pairOf(step.intent).en} Put the words in order.`,
          hint,
          frame,
          explanation: [
            `${words.join(" ")}`,
            slips.length ? `Common slips:\n${slips.join("\n")}` : "",
          ]
            .filter(Boolean)
            .join("\n\n"),
          skill: text(step.role),
        },
        words.map((w, i) => ({ id: `w${i + 1}`, text: w })),
      ),
    ];
  }
  return [
    openQuestion(
      fit,
      {
        id: `s${n}-${step.id}`.slice(0, 32),
        prompt: pairOf(step.prompt).en,
        hint,
        frame,
        skill: "speaking",
      },
      { kind: "explain" },
    ),
  ];
}

export default {
  family: "language-city",
  label: t("Language City missions", "Misiones de la Ciudad del Lenguaje"),
  note: t(
    "Copies a city mission (its signs, what the character says, and every step) into a draft you can edit.",
    "Copia una misión de la ciudad (sus letreros, lo que dice el personaje y cada paso) en un borrador que puede editar.",
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
    "frames",
    "explanations",
    "openResponses",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t("The illustrated map and characters", "El mapa ilustrado y los personajes"),
      why: t(
        "Walking into buildings and the character art stay in Language City; the draft keeps the language tasks.",
        "Entrar a los edificios y el arte de los personajes permanecen en la Ciudad; el borrador conserva las tareas de lenguaje.",
      ),
    },
  ],

  async list() {
    const { MISSIONS, buildingOf } = await load();
    return MISSIONS.map((m) => ({
      id: `${m.place}/${m.id}`,
      title: `${pairOf(buildingOf(m.place)?.name).en}: ${pairOf(m.title).en}`,
      grade: "",
      subject: "",
      domain: text(m.use),
      description: pairOf(m.goal).en,
      count: list(m.steps).length,
    }));
  },

  url: (ref) => `/access-practice-lab/city/${ref}`,

  async extract(ref, _deps) {
    const m = REF.exec(String(ref));
    if (!m) throw new Error("bad-ref");
    const { missionOf, buildingOf } = await load();
    const mission = missionOf(m[1], m[2]);
    if (!mission) throw new Error("not-found");
    const building = buildingOf(mission.place);
    const npc = text(building?.npc?.name) || "The character";
    const { fit, overflow } = fitter();
    const dropped = [];
    const blocks = [
      textBlock(
        "goal",
        `**${pairOf(building?.name).en}.** ${pairOf(mission.goal).en}`,
        "directions",
        fit,
      ),
      ...list(mission.steps).flatMap((s, i) => stepBlocks(s, npc, i + 1, fit, dropped)),
    ];
    return {
      activity: practiceDraft(fit, overflow, {
        title: `Language City: ${pairOf(mission.title).en}`,
        description: pairOf(mission.goal).en,
        objective: pairOf(mission.goal).en,
        sourceNote: `Copied from Language City mission ${ref}.`,
        spanish: true,
        blocks,
        teacher: [
          `Copied from Language City mission ${ref} at ${pairOf(building?.name).en} (${npc}). Key Language Use: ${text(mission.use)}.`,
          ...dropped,
        ],
      }),
      notes: [
        t(
          "Not carried: the city map, character art and moods, the Spanish of the questions and signs, and the extra word tiles of the build steps (they are listed in the teacher notes).",
          "No se conserva: el mapa, el arte y los gestos de los personajes, el español de las preguntas y letreros, ni las fichas de palabras adicionales de los pasos de construir (aparecen en las notas para docentes).",
        ),
      ],
      source: mission,
      url: `/access-practice-lab/city/${ref}`,
      sourceTitle: pairOf(mission.title).en,
    };
  },
};
