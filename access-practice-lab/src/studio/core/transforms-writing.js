// speakingTask and writingTask: short productive-language tasks built from a passage (or an audio transcript) that is
// already in the activity. Nothing is invented: the prompts point at the activity's own text, the rubrics describe
// what to look for, and no sample answer is written. Both are written responses, so the studio never scores them
// (check.js returns "review"); the teacher reads or listens. The player shows a text box, so a speaking task asks the
// student to speak to a partner and then jot down the key words they used.

import { challengeItems } from "./differentiate-extension.js";
import { FRAME_BANK } from "./differentiate-frames.js";
import {
  blocksOf,
  clone,
  freshId,
  pair,
  vocabItems,
  words,
} from "./differentiate-util.js";
import { DIRECTION_STEPS, NEEDS, cannot, derive, draftFrom } from "./transforms-base.js";

const MIN_WORDS = 20;

/** True when the activity has a text to speak or write about. Speaking may also use an audio transcript. */
export function writingSource(activity, mode) {
  if (blocksOf(activity, "passage").some((b) => words(b.text) >= MIN_WORDS)) return true;
  return mode === "speaking" && blocksOf(activity, "audio").some((b) => words(b.say) >= MIN_WORDS);
}

/** The block the student reads or hears: the first passage, else the first audio block with a transcript. */
function sourceBlock(activity) {
  const passage = blocksOf(activity, "passage").find((b) => words(b.text) >= MIN_WORDS);
  return passage || blocksOf(activity, "audio").find((b) => words(b.say) >= MIN_WORDS);
}

const firstVocab = (activity) =>
  vocabItems(activity).length ? blocksOf(activity, "vocab")[0] : null;

/** Retell or explain a text out loud (to a partner or the teacher); the box holds the key words. Never auto-graded. */
export function speakingTask(activity, deps = {}) {
  const src = sourceBlock(activity);
  if (!src || !writingSource(activity, "speaking")) return cannot(activity, NEEDS.speakingTask);
  const vocab = firstVocab(activity);
  const a = draftFrom(activity, [], { kind: "interactive", template: "build-explain" });
  a.supports = { ...a.supports, frames: true, hints: true };
  const taken = new Set([src.id, vocab?.id].filter(Boolean));
  const ids = {
    dir: freshId("sp-directions", taken),
    q: freshId("sp-retell", taken),
    note: freshId("sp-note", taken),
  };
  const steps = [
    src.type === "audio" ? "Listen to the audio." : "Read the text.",
    `Tell a partner what it is about.${vocab ? " Use words from the word list." : ""}`,
    "Write three or more key words you used.",
  ];
  const rubric = [
    "Tells what the text is about in the student's own words",
    "Includes at least one detail from the text",
    ...(vocab ? ["Uses words from the word list"] : []),
    "Speaks so a partner can understand",
  ];
  a.blocks = [
    { id: ids.dir, type: "text", role: "directions", text: DIRECTION_STEPS(steps) },
    clone(src),
    ...(vocab ? [clone(vocab)] : []),
    {
      id: ids.q,
      type: "question",
      format: "short",
      kind: "explain",
      prompt:
        "Tell a partner what the text is about, in your own words. Say at least one detail from the text. Then write the key words you used.",
      frame: FRAME_BANK.retell.full,
      sample: "",
      rubric,
      minWords: 3,
      hint: "Look back at the text. What is it mostly about?",
      explanation:
        "Listen to the student retell the text and use the rubric to give feedback. This task is not scored automatically.",
      skill: "speaking",
    },
    {
      id: ids.note,
      type: "note",
      text: "Speaking task: students tell a partner or you, then write the key words they used in the box. The studio never scores speaking. Listen for the rubric points. Sentence help is on the Sentence help button.",
    },
  ];
  return derive(activity, a, {
    suffix: "Speaking Task",
    added: Object.values(ids),
    deps,
    notes: [
      pair(
        "Made a speaking task from your text: students tell a partner what it is about, using a sentence frame, then write key words. It is never scored automatically, and your teacher note explains how to use the rubric.",
        "Se hizo una tarea de expresión oral con tu texto: los estudiantes le cuentan a un compañero de qué trata, con un marco de oración, y luego escriben palabras clave. Nunca se califica automáticamente, y tu nota para el docente explica cómo usar la rúbrica.",
      ),
    ],
  });
}

/** A short writing task from a passage: plan in an organizer, expand a sentence, then write evidence-based. */
export function writingTask(activity, deps = {}) {
  const src = blocksOf(activity, "passage").find((b) => words(b.text) >= MIN_WORDS);
  if (!src) return cannot(activity, NEEDS.writingTask);
  const vocab = firstVocab(activity);
  const a = draftFrom(activity, [], { kind: "interactive", template: "build-explain" });
  a.supports = { ...a.supports, frames: true, hints: true };
  const base = [clone(src), ...(vocab ? [clone(vocab)] : [])];
  const taken = new Set(base.map((b) => b.id));
  const dirId = freshId("wr-directions", taken);
  const orgId = freshId("wr-plan", taken);
  const noteId = freshId("wr-note", taken);
  const { questions } = challengeItems({ ...a, blocks: base }, { taken, frame: true });
  a.blocks = [
    {
      id: dirId,
      type: "text",
      role: "directions",
      text: DIRECTION_STEPS([
        "Read the text.",
        "Plan your ideas in the organizer.",
        "Write your answers. Use details from the text.",
      ]),
    },
    ...base,
    { id: orgId, type: "organizer", kind: "claim-evidence", prompts: [] },
    ...questions,
    {
      id: noteId,
      type: "note",
      text: "Writing task: students plan in the organizer, then write. The studio never scores writing; read each response with its rubric. The sentence frame is on the Sentence help button.",
    },
  ];
  return derive(activity, a, {
    suffix: "Writing Task",
    added: [dirId, orgId, noteId, ...questions.map((q) => q.id)],
    deps,
    notes: [
      pair(
        `Made a writing task from your text: a planning organizer plus ${questions.length} written response${questions.length === 1 ? "" : "s"} with a rubric. Written responses are not scored automatically.`,
        `Se hizo una tarea de escritura con tu texto: un organizador de planificación y ${questions.length} respuesta${questions.length === 1 ? " escrita" : "s escritas"} con rúbrica. Las respuestas escritas no se califican automáticamente.`,
      ),
    ],
  });
}
