// Adapter: Voice Lab (src/content/voice-lab.js, a pure data module). Three kinds of Voice Lab activity carry
// content an activity can hold:
//   retell-<id>  a recording (script + transcript) or short article, its listening checks with keys, its words with
//                Spanish, a planner, frames, and the retell with its success criteria and authored model;
//   ladder-<id>  a picture-talk ladder: three speaking steps, each with a frame and a model line;
//   sounds-<id>  a sound-pair set: word pairs with meanings (matching) and the bilingual mouth tip.
// Read-aloud passages, shadowing lines and key frames have no task or answer of their own, so they are not offered.
// Loaded on demand so the Create panel stays light.

import {
  choiceAt,
  fitNote,
  labActivity,
  passageBlocks,
  textBlocks,
  withSpanish,
} from "./lab-parts.js";
import { listenBlocks } from "./listen-blocks.js";
import { matchQuestions, openQuestion, vocabBlock } from "./vocab-parts.js";
import { list, noteBlocks, t, text } from "./util.js";

const load = () => import("../../content/voice-lab.js");
const REF = /^(retell|ladder|sounds)-([a-z0-9-]+)$/;
const urlFor = (ref) => {
  const m = REF.exec(String(ref));
  return m ? `/access-practice-lab/voice/${m[1]}/${m[2]}` : "";
};

function retell(r) {
  const turns = list(r.turns).length
    ? list(r.turns).map(text)
    : list(r.parts).map((p) => `${text(p.speaker)}: ${text(p.text)}`);
  const stimulus =
    r.mode === "read"
      ? passageBlocks("text", r.title, r.text)
      : listenBlocks("rec", `Listen: ${text(r.title)}`, turns);
  const vocab = list(r.vocab).map(([term, def, es]) => ({
    term: text(term),
    def: text(def),
    es: text(es),
    example: "",
  }));
  const fitted = vocabBlock(vocab);
  const plan = list(r.plan)
    .map(text)
    .filter((p) => p && p.length <= 160)
    .slice(0, 8);
  const frames = list(r.frames?.full).map(text);
  return {
    title: `Retell: ${text(r.title)}`,
    description: `${text(r.genre)}. ${text(r.prompt)}`,
    grade: r.band,
    objective: text(r.prompt),
    blocks: [
      ...stimulus,
      fitted.block,
      ...noteBlocks("vocab", fitted.extra),
      ...(vocab.length >= 2 ? matchQuestions(vocab) : []),
      ...list(r.check).map((c, i) =>
        choiceAt({
          id: `c${i + 1}`,
          prompt: c.q,
          options: c.options,
          answer: c.answer,
          hint: c.hint,
          explanation: c.why,
          skill: c.kind,
        }),
      ),
      ...(plan.length >= 2
        ? [{ type: "organizer", id: "plan", kind: "sequence", prompts: plan }]
        : []),
      ...(frames.length
        ? textBlocks("frames", `Sentence frames:\n${frames.map((f) => `- ${f}`).join("\n")}`)
        : []),
      openQuestion({
        id: "retell",
        prompt: text(r.prompt),
        kind: "explain",
        rubric: list(r.criteria).slice(0, 6),
        sample: text(r.model?.line),
      }),
    ],
    teacher: [
      `Copied from Voice Lab retell ${r.id} (${text(r.genre)}, grades ${text(r.band)}).`,
      ...list(r.listenFor).map((x) => `Listen for: ${text(x)}`),
      text(r.model?.name) && `The model retell is by the character ${text(r.model.name)}.`,
    ],
    spanish: vocab.some((v) => v.es),
    readAloud: r.mode !== "read",
  };
}

function ladder(l) {
  return {
    title: `Picture talk: ${text(l.title)}`,
    description: text(l.alt),
    grade: l.band,
    objective: "Describe a picture, explain what is happening, then propose and justify an idea.",
    blocks: [
      ...textBlocks("picture", `The picture: ${text(l.alt)}`),
      ...list(l.steps).map((s, i) =>
        openQuestion({
          id: `s${i + 1}`,
          prompt: text(s.prompt),
          kind: "explain",
          frame: text(s.frame).slice(0, 300),
          sample: text(s.model?.line),
        }),
      ),
    ],
    teacher: [
      `Copied from Voice Lab picture ladder ${l.id} (grades ${text(l.band)}). The picture itself stays in Voice Lab; the description is in the directions.`,
    ],
    spanish: false,
    readAloud: false,
  };
}

function sounds(s) {
  const pairs = list(s.pairs).flatMap(([w1, m1, w2, m2]) => [
    { term: text(w1), def: text(m1), es: "", example: "" },
    { term: text(w2), def: text(m2), es: "", example: "" },
  ]);
  const [tipEn, tipEs] = list(s.tip);
  const fitted = vocabBlock(pairs);
  return {
    title: `Sound pairs: ${text(s.title)}`,
    description: text(tipEn),
    grade: "",
    subject: "Speaking",
    objective: "Hear and say the difference between two sounds in word pairs.",
    blocks: [
      ...textBlocks("tip", withSpanish(tipEn, tipEs, 4000)),
      fitted.block,
      ...noteBlocks("vocab", fitted.extra),
      ...matchQuestions(pairs),
    ],
    teacher: [
      `Copied from Voice Lab sound set ${s.id}. Pairs: ${list(s.pairs)
        .map((p) => `${p[0]} / ${p[2]}`)
        .join(", ")}.`,
    ],
    spanish: false,
    readAloud: false,
  };
}

export default {
  family: "voice-lab",
  label: t(
    "Voice Lab retells, picture talk and sound pairs",
    "Recuentos, descripción de imágenes y pares de sonidos del Laboratorio de voz",
  ),
  note: t(
    "Copies a Voice Lab activity into one you can edit: a retell with its recording or article, checks, words and model; a picture-talk ladder with frames and models; or a sound-pair set as matching.",
    "Copia una actividad del Laboratorio de voz en una que puede editar: un recuento con su grabación o artículo, preguntas, palabras y modelo; una escalera para hablar de una imagen con marcos y modelos; o un conjunto de pares de sonidos para emparejar.",
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
    "pairs",
    "answerKeys",
    "hints",
    "frames",
    "explanations",
    "rubric",
    "samples",
    "openResponses",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t(
        "Pictures, recording and pronunciation playback",
        "Imágenes, grabación y reproducción de la pronunciación",
      ),
      why: t(
        "Voice Lab draws its pictures and plays and records sound itself; the copy keeps the text, the questions and the models.",
        "El Laboratorio de voz dibuja sus imágenes y reproduce y graba el sonido; la copia conserva el texto, las preguntas y los modelos.",
      ),
    },
    {
      what: t(
        "Read-aloud passages, shadowing lines and key frames",
        "Lecturas en voz alta, líneas para imitar y marcos clave",
      ),
      why: t(
        "These have no task or answer of their own, so Create does not offer them as a source.",
        "No tienen una tarea ni una respuesta propia, así que Create no las ofrece como fuente.",
      ),
    },
  ],

  async list() {
    const v = await load();
    return [
      ...list(v.RETELLS).map((r) => ({
        id: `retell-${r.id}`,
        title: `Retell: ${text(r.title)}`,
        grade: text(r.band),
        subject: "",
        domain: r.mode === "read" ? "Reading" : "Listening",
        description: text(r.prompt),
        count: list(r.check).length + 1,
      })),
      ...list(v.LADDERS).map((l) => ({
        id: `ladder-${l.id}`,
        title: `Picture talk: ${text(l.title)}`,
        grade: text(l.band),
        subject: "",
        domain: "Speaking",
        description: text(l.alt),
        count: list(l.steps).length,
      })),
      ...list(v.SOUND_SETS).map((s) => ({
        id: `sounds-${s.id}`,
        title: `Sound pairs: ${text(s.title)}`,
        grade: "",
        subject: "",
        domain: "Speaking",
        description: text(s.tip?.[0]),
        count: list(s.pairs).length * 2,
      })),
    ];
  },

  url: urlFor,

  async extract(ref) {
    const m = REF.exec(String(ref));
    if (!m) throw new Error("bad-ref");
    const v = await load();
    const pool = { retell: v.RETELLS, ladder: v.LADDERS, sounds: v.SOUND_SETS }[m[1]];
    const item = list(pool).find((x) => x.id === m[2]);
    if (!item) throw new Error("not-found");
    const made = { retell, ladder, sounds }[m[1]](item);
    const note = fitNote(made.teacher);
    return {
      activity: labActivity({
        title: made.title,
        description: made.description,
        grade: made.grade,
        subject: made.subject || "",
        curriculum: "Language Page Voice Lab",
        objective: made.objective,
        sourceNote: `Copied from Voice Lab ${ref}.`,
        template: m[1] === "sounds" ? "match-sort" : "build-explain",
        blocks: made.blocks,
        teacher: note.teacher,
        spanish: made.spanish,
        frames: m[1] !== "sounds",
        readAloud: made.readAloud,
      }),
      notes: [
        t(
          "Not carried: pictures, recording, pronunciation playback and the practice record. A retell's light frames stay in Voice Lab; the full frames are copied.",
          "No se conserva: las imágenes, la grabación, la reproducción de la pronunciación ni el registro de práctica. Los marcos ligeros de un recuento permanecen en el Laboratorio; se copian los marcos completos.",
        ),
      ],
      source: item,
      url: urlFor(ref),
      sourceTitle: text(item.title),
    };
  },
};
