// Adapter: Daily Language Warm-Up words (content/warmup-early.json, warmup-upper.json): per tier, sixty words of
// the day, each with a meaning, Spanish, an example, a short listening clip and one question about the clip with its
// answer and two wrong choices. Words are offered in sets of ten (the order the warm-up uses them). A set becomes
// the words, matching, and one listening question per word, all copied as written.

import { labActivity, withSpanish } from "./lab-parts.js";
import { listenBlocks } from "./listen-blocks.js";
import { choiceQuestion, matchQuestions, vocabBlock } from "./vocab-parts.js";
import { list, noteBlocks, t, text } from "./util.js";

const FILES = { early: ["K-1", "2-3"], upper: ["3-5", "6-8"] };
const SIZE = 10;
const REF = /^(K-1|2-3|3-5|6-8)-(\d{1,2})$/;

const fileOf = (tier) => (FILES.early.includes(tier) ? "early" : "upper");
const urlJson = (tier) => `/access-practice-lab/content/warmup-${fileOf(tier)}.json`;

async function wordsOf(tier, fetchJson) {
  return list((await fetchJson(urlJson(tier))).tiers?.[tier]).filter(
    (w) => text(w.w) && text(w.def),
  );
}

function clipQuestion(w, n) {
  const q = choiceQuestion({
    id: `c${n}`,
    prompt: text(w.q),
    answer: text(w.a),
    distractors: list(w.x).map(text),
    explanation: withSpanish(`The clip says: ${text(w.clip)}`, w.clipEs, 800),
    skill: "listening",
  });
  return q;
}

export default {
  family: "warmup",
  label: t("Daily Warm-Up word sets", "Conjuntos de palabras del calentamiento diario"),
  note: t(
    "Copies ten warm-up words into practice you can edit: meanings, Spanish, examples, matching, and each word's listening clip with its question.",
    "Copia diez palabras del calentamiento en una práctica que puede editar: significados, español, ejemplos, emparejar y el audio breve de cada palabra con su pregunta.",
  ),
  editable: [
    "title",
    "description",
    "vocab",
    "passage",
    "audio",
    "prompts",
    "choices",
    "pairs",
    "answerKeys",
    "hints",
    "explanations",
  ],
  fixed: [
    {
      what: t(
        "Word pictures, the daily rotation and the quick-write and speaking steps",
        "Imágenes, la rotación diaria y los pasos de escritura rápida y expresión oral",
      ),
      why: t(
        "The warm-up draws its pictures and daily steps itself; the copy keeps the words and the listening questions.",
        "El calentamiento dibuja sus imágenes y pasos diarios; la copia conserva las palabras y las preguntas de escucha.",
      ),
    },
    {
      what: t("Spanish meanings", "Significados en español"),
      why: t(
        "The Spanish comes from the warm-up file and has not been reviewed by a native speaker.",
        "El español proviene del archivo del calentamiento y no ha sido revisado por un hablante nativo.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const rows = [];
    for (const tier of [...FILES.early, ...FILES.upper]) {
      const words = await wordsOf(tier, fetchJson);
      for (let n = 0; n * SIZE < words.length; n++) {
        const set = words.slice(n * SIZE, n * SIZE + SIZE);
        rows.push({
          id: `${tier}-${n + 1}`,
          title:
            `Warm-up words ${tier}, set ${n + 1}: ${set.map((w) => text(w.w)).join(", ")}`.slice(
              0,
              120,
            ),
          grade: tier,
          subject: "",
          domain: "Vocabulary",
          description: set.map((w) => text(w.w)).join(", "),
          count: set.length,
        });
      }
    }
    return rows;
  },

  url: () => "/access-practice-lab/warmup",

  async extract(ref, { fetchJson }) {
    const m = REF.exec(String(ref));
    if (!m) throw new Error("bad-ref");
    const n = Number(m[2]);
    const set = (await wordsOf(m[1], fetchJson)).slice((n - 1) * SIZE, n * SIZE);
    if (!set.length || n < 1) throw new Error("not-found");
    const vocab = set.map((w) => ({
      term: text(w.w),
      def: text(w.def),
      es: text(w.es),
      example: text(w.ex),
    }));
    const fitted = vocabBlock(vocab);
    const clips = set
      .map((w, i) => ({ w, i }))
      .filter(({ w }) => text(w.clip) && text(w.q) && text(w.a) && list(w.x).length)
      .flatMap(({ w, i }) => [
        ...listenBlocks(`w${i + 1}`, `Listen: ${text(w.w)}`, [text(w.clip)]),
        clipQuestion(w, i + 1),
      ]);
    return {
      activity: labActivity({
        title: `Warm-up words ${m[1]}, set ${n}`,
        description: vocab.map((v) => v.term).join(", "),
        grade: m[1],
        curriculum: "Language Page Daily Warm-Up",
        objective: "Learn ten words of the day and answer a question about a short clip for each.",
        sourceNote: `Copied from Daily Warm-Up tier ${m[1]}, words ${(n - 1) * SIZE + 1} to ${(n - 1) * SIZE + set.length}.`,
        template: "match-sort",
        blocks: [
          fitted.block,
          ...noteBlocks("vocab", fitted.extra),
          ...matchQuestions(vocab),
          ...clips,
        ],
        teacher: `Copied from the Daily Warm-Up, tier ${m[1]}, set ${n}. Spanish comes from the warm-up file and needs native review.`,
        spanish: vocab.some((v) => v.es),
        readAloud: true,
      }),
      notes: [
        t(
          "Not carried: word pictures, the daily rotation, the quick-write and speaking steps and the week of practice days.",
          "No se conserva: las imágenes de las palabras, la rotación diaria, los pasos de escritura rápida y expresión oral ni la semana de días de práctica.",
        ),
      ],
      source: set,
      url: "/access-practice-lab/warmup",
      sourceTitle: `Warm-up ${m[1]} set ${n}`,
    };
  },
};
