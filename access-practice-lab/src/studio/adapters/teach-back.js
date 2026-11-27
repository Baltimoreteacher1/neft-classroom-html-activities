// Adapter: Teach-Back concepts (src/teachback/concepts.js, a pure data module): a big idea in English and Spanish,
// four terms with glosses and Spanish, three key points each with a sentence frame, an audience to explain it to and
// a model explanation. A concept becomes the idea, the words with matching, one open "finish the key idea" prompt
// per point (its sample is the point itself) and the teach-back explanation, whose self-check is the three points.
// Open responses are never auto-graded. Loaded on demand so the Create panel stays light.

import { fitNote, labActivity, textBlocks, withSpanish } from "./lab-parts.js";
import { matchQuestions, openQuestion, vocabBlock } from "./vocab-parts.js";
import { list, noteBlocks, t, text } from "./util.js";

const load = async () => (await import("../../teachback/concepts.js")).CONCEPTS;
const urlFor = (ref) => `/access-practice-lab/teach-back/${ref}`;
const en = (v) => text(v?.en);

export default {
  family: "teach-back",
  label: t("Teach-Back concepts", "Conceptos para explicar (Teach-Back)"),
  note: t(
    "Copies a Teach-Back concept into an activity you can edit: the big idea, its words with Spanish, a prompt for each key point and the explain-it-to-someone task with its model.",
    "Copia un concepto de Teach-Back en una actividad que puede editar: la idea principal, sus palabras con español, una consigna por cada punto clave y la tarea de explicárselo a alguien con su modelo.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "vocab",
    "prompts",
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
        "The concept picture and the spoken explanation check",
        "La imagen del concepto y la revisión de la explicación oral",
      ),
      why: t(
        "Teach-Back draws its own picture and listens for the key points; in the copy the points are a self-check list, never a grade.",
        "Teach-Back dibuja su propia imagen y escucha los puntos clave; en la copia los puntos son una lista de autoevaluación, nunca una calificación.",
      ),
    },
    {
      what: t("Spanish", "Español"),
      why: t(
        "The Spanish comes from the concept file and has not been reviewed by a native speaker.",
        "El español proviene del archivo de conceptos y no ha sido revisado por un hablante nativo.",
      ),
    },
  ],

  async list() {
    return (await load()).map((c) => ({
      id: c.id,
      title: en(c.title),
      grade: text(c.band),
      subject: text(c.subject),
      domain: "Speaking",
      description: en(c.idea),
      count:
        (list(c.terms).length >= 2 ? Math.ceil(list(c.terms).length / 6) : 0) +
        list(c.points).length +
        1,
    }));
  },

  url: urlFor,

  async extract(ref) {
    const c = (await load()).find((x) => x.id === ref);
    if (!c) throw new Error("not-found");
    const vocab = list(c.terms).map((x) => ({
      term: text(x.w),
      def: text(x.gloss),
      es: text(x.es),
      example: "",
    }));
    const fitted = vocabBlock(vocab);
    const points = list(c.points).map((p, i) =>
      openQuestion({
        id: `p${i + 1}`,
        prompt: `Key idea ${i + 1} of ${list(c.points).length}: finish it in your own words.`,
        kind: "explain",
        frame: text(p.frame).slice(0, 300),
        sample: withSpanish(p.en, p.es, 4000),
      }),
    );
    const explain = openQuestion({
      id: "teach",
      prompt: withSpanish(c.audience?.en, c.audience?.es, 4000),
      kind: "explain",
      rubric: list(c.points)
        .map((p) => text(p.en))
        .slice(0, 6),
      sample: en(c.modelAnswer),
    });
    const note = fitNote([
      `Copied from Teach-Back concept ${c.id} (${text(c.subject)}, grades ${text(c.band)}): ${en(c.title)}.`,
      ...list(c.points).map(
        (p) => `Words that show point ${text(p.id)}: ${list(p.accept).join(", ")}`,
      ),
    ]);
    return {
      activity: labActivity({
        title: `Teach it back: ${en(c.title)}`,
        description: en(c.idea),
        grade: c.band,
        subject: c.subject,
        curriculum: "Language Page Teach-Back",
        objective: en(c.idea),
        sourceNote: `Copied from Teach-Back concept ${c.id}.`,
        template: "build-explain",
        blocks: [
          ...textBlocks("idea", withSpanish(c.idea?.en, c.idea?.es, 4000)),
          fitted.block,
          ...noteBlocks("vocab", fitted.extra),
          ...(vocab.length >= 2 ? matchQuestions(vocab) : []),
          ...points,
          explain,
        ],
        teacher: note.teacher,
        spanish: vocab.some((v) => v.es),
        frames: true,
      }),
      notes: [
        t(
          "Not carried: the concept picture, recording and the automatic listening for key points (the points are a self-check list here).",
          "No se conserva: la imagen del concepto, la grabación ni la escucha automática de los puntos clave (aquí los puntos son una lista de autoevaluación).",
        ),
      ],
      source: c,
      url: urlFor(ref),
      sourceTitle: en(c.title),
    };
  },
};
