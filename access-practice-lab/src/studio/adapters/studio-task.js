// Adapter: Speaking and Writing Studio tasks (content/studio/speaking.json, writing.json). A task becomes its
// scenario, its stimulus (listening script with transcript, chart, table or reading), its vocabulary, the authored
// listening checks, a planner, the sentence frames and word bank, and the task itself as an open response with the
// success criteria as its self-check and the authored model as its sample. Nothing is invented; free speech and
// writing are never auto-graded.

import {
  chartRows,
  choiceAt,
  fitNote,
  labActivity,
  passageBlocks,
  textBlocks,
} from "./lab-parts.js";
import { listenBlocks } from "./listen-blocks.js";
import { matchQuestions, openQuestion, vocabBlock } from "./vocab-parts.js";
import { list, noteBlocks, t, tableBlocks, text } from "./util.js";

const BASE = "/access-practice-lab/content/studio";
const REF = /^(spk|wrt)[a-z0-9-]{1,60}$/;
const ORGANIZER = {
  cer: "claim-evidence",
  compare: "compare",
  retell: "sequence",
  narrative: "sequence",
};

const urlFor = (ref) =>
  REF.test(ref) ? `/access-practice-lab/${ref.startsWith("spk") ? "speak" : "write"}/${ref}` : "";

async function tasksOf(fetchJson) {
  const [s, w] = await Promise.all([
    fetchJson(`${BASE}/speaking.json`),
    fetchJson(`${BASE}/writing.json`),
  ]);
  return [
    ...list(s.tasks).map((x) => ({ ...x, mode: "speaking" })),
    ...list(w.tasks).map((x) => ({ ...x, mode: "writing" })),
  ];
}

/** One stimulus (speaking) or source (writing) as blocks. */
function stimulusBlocks(s, id, flags) {
  if (!s) return [];
  if (s.kind === "audio")
    return listenBlocks(
      id,
      `Listen: ${text(s.title) || "the recording"}`,
      list(s.turns).map((x) => `${text(x.speaker)}: ${text(x.text)}`),
    );
  if (s.kind === "chart") {
    const c = chartRows(s.chart);
    return tableBlocks(id, text(s.title) || c.caption, c.headers, c.rows, flags);
  }
  if (s.kind === "table") {
    const tb = s.table || {};
    return tableBlocks(
      id,
      [text(s.title), text(tb.caption)].filter(Boolean).join(": "),
      list(tb.headers).map(text),
      list(tb.rows).map((r) => list(r).map(text)),
      flags,
    );
  }
  const paras = Array.isArray(s.text) ? s.text : [s.text];
  return passageBlocks(id, text(s.title) || "Read", paras);
}

function framesText(task) {
  const g = task.stages?.guided || {};
  const bank = list(task.stages?.supported?.bank).length ? task.stages.supported.bank : g.bank;
  return [
    list(g.frames).length &&
      `Sentence frames:\n${list(g.frames)
        .map((f) => `- ${text(f)}`)
        .join("\n")}`,
    list(bank).length && `Word bank: ${list(bank).map(text).join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function build(task) {
  const flags = new Set();
  const speaking = task.mode === "speaking";
  const stimuli = speaking
    ? stimulusBlocks(task.stimulus, "stim", flags)
    : list(task.sources).flatMap((s, i) => stimulusBlocks(s, `src${i + 1}`, flags));
  const vocab = list(task.vocab).map((v) => ({
    term: text(v.term),
    def: text(v.def),
    es: text(v.es),
    example: "",
  }));
  const fitted = vocab.length ? vocabBlock(vocab) : { block: null, extra: [] };
  const checks = list(task.stimulus?.check).map((c, i) =>
    choiceAt({
      id: `c${i + 1}`,
      prompt: c.q,
      options: c.options,
      answer: c.answer,
      hint: c.hint,
      explanation: c.why,
      skill: c.kind,
    }),
  );
  const plan = list(speaking ? task.planner : task.organizer)
    .map((p) => (text(p.hint) ? `${text(p.label)}: ${text(p.hint)}` : text(p.label)))
    .filter((p) => p.length <= 160)
    .slice(0, 8);
  const kind = ORGANIZER[speaking ? task.taskType : task.form] || "web";
  const frames = framesText(task);
  const main = openQuestion({
    id: "task",
    prompt: text(task.prompt),
    kind: speaking ? "explain" : "write",
    rubric: list(task.successCriteria).slice(0, 6),
    sample: text(task.stages?.guided?.model),
  });
  const blocks = [
    ...textBlocks("scenario", text(task.scenario), "directions"),
    ...stimuli,
    ...(fitted.block ? [fitted.block] : []),
    ...noteBlocks("vocab", fitted.extra),
    ...(vocab.length >= 2 ? matchQuestions(vocab) : []),
    ...checks,
    ...(plan.length >= 2 ? [{ type: "organizer", id: "plan", kind, prompts: plan }] : []),
    ...(frames ? textBlocks("frames", frames) : []),
    main,
  ];
  const tc = task.teacher || {};
  const note = fitNote([
    `Copied from the ${speaking ? "Speaking" : "Writing"} Studio task ${task.id}: ${text(task.title)} (${text(task.time)}).`,
    ...list(tc.listenFor).map((x) => `Listen for: ${text(x)}`),
    ...list(tc.lookFor).map((x) => `Look for: ${text(x)}`),
    ...list(tc.commonIssues).map((x) => `Common issue: ${text(x)}`),
    text(tc.followUp) && `Follow-up question: ${text(tc.followUp)}`,
    ...list(task.revisionPrompts).map((x) => `Revision prompt: ${text(x?.prompt ?? x)}`),
  ]);
  return { blocks, note, flags, vocab };
}

export default {
  family: "studio-task",
  label: t("Speaking and Writing Studio tasks", "Tareas del Estudio de expresión oral y escrita"),
  note: t(
    "Copies a studio task into an activity you can edit: the scenario, the recording or source, the vocabulary, the listening checks, the planner, the frames and the task with its success criteria and model.",
    "Copia una tarea del estudio en una actividad que puede editar: la situación, la grabación o la fuente, el vocabulario, las preguntas de escucha, el planificador, los marcos y la tarea con sus criterios de éxito y su modelo.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "passage",
    "table",
    "audio",
    "vocab",
    "prompts",
    "choices",
    "pairs",
    "answerKeys",
    "hints",
    "explanations",
    "rubric",
    "samples",
    "openResponses",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t(
        "Recording, speaking timer and the guided, supported and independent stages",
        "Grabación, temporizador oral y las etapas guiada, apoyada e independiente",
      ),
      why: t(
        "The studio records and paces the response itself; the copy keeps the guided frames and model as supports.",
        "El estudio graba y marca el ritmo de la respuesta; la copia conserva los marcos guiados y el modelo como apoyos.",
      ),
    },
    {
      what: t("Spanish meanings", "Significados en español"),
      why: t(
        "The Spanish glosses come from the task and have not been reviewed by a native speaker.",
        "Los significados en español provienen de la tarea y no han sido revisados por un hablante nativo.",
      ),
    },
  ],

  async list({ fetchJson }) {
    return (await tasksOf(fetchJson)).map((x) => ({
      id: x.id,
      title: text(x.title),
      grade: text(x.band),
      subject: text(x.contentArea),
      domain: x.mode === "speaking" ? "Speaking" : "Writing",
      description: text(x.scenario),
      count: list(x.stimulus?.check).length + 1,
    }));
  },

  url: urlFor,

  async extract(ref, { fetchJson }) {
    if (!REF.test(ref)) throw new Error("bad-ref");
    const task = (await tasksOf(fetchJson)).find((x) => x.id === ref);
    if (!task) throw new Error("not-found");
    if (!text(task.prompt)) throw new Error("bad-source");
    const { blocks, note, flags, vocab } = build(task);
    const speaking = task.mode === "speaking";
    return {
      activity: labActivity({
        title: text(task.title),
        description: text(task.scenario),
        grade: task.band,
        subject: task.contentArea,
        curriculum: speaking ? "Language Page Speaking Studio" : "Language Page Writing Studio",
        objective: `${text(task.keyUse)}: ${text(task.prompt)}`,
        sourceNote: `Copied from studio task ${task.id}.`,
        template: "build-explain",
        blocks,
        teacher: note.teacher,
        spanish: vocab.some((v) => v.es),
        frames: true,
        readAloud: task.stimulus?.kind === "audio",
      }),
      notes: [
        t(
          "Not carried: the recorder, the speaking time target, stage switching, the scored exemplars and the progress record. They stay in the studio.",
          "No se conserva: la grabadora, el tiempo objetivo para hablar, el cambio de etapas, los ejemplos calificados ni el registro de progreso. Permanecen en el estudio.",
        ),
        ...(flags.has("table-as-text")
          ? [
              t(
                "A table was too large for a table block and is shown as text lines.",
                "Una tabla era demasiado grande para un bloque de tabla y aparece como líneas de texto.",
              ),
            ]
          : []),
        ...(note.dropped
          ? [
              t(
                "Some teacher lines did not fit in the teacher notes and were left out.",
                "Algunas líneas para el docente no cabían en las notas y se omitieron.",
              ),
            ]
          : []),
      ],
      source: task,
      url: urlFor(ref),
      sourceTitle: text(task.title),
    };
  },
};
