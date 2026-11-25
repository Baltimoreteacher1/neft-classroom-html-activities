// Adapter: Vocabulary Academy units (content/vocab-academy/g<K-8>/uNN.json, 157 units, 1,432 words). A unit becomes a
// vocabulary block, match sets, one cloze per word, the unit's reading with its questions, and its open-response
// checks. Every word, meaning, example, Spanish gloss and cloze sentence is copied from the unit file as written.

import { listenBlocks } from "./listen-blocks.js";
import { matchQuestions, openQuestion, vocabBlock } from "./vocab-parts.js";
import { list, noteBlocks, t, text } from "./util.js";

const BASE = "/access-practice-lab/content/vocab-academy";
const REF = /^g(K|[1-8])-u(\d{2})$/;
const NOTE_MAX = 2000;
const GAP = /_{3,}/;

function urlFor(ref) {
  const m = REF.exec(ref);
  return m ? `/access-practice-lab/vocabulary-academy/grade/${m[1]}/lesson/${Number(m[2])}` : "";
}

const startsWith = (term) => `It starts with "${term.slice(0, 1)}".`;

function clozeQuestion(word, n) {
  const sentence = text(word.cloze?.s);
  const fill = text(word.cloze?.f);
  if (!GAP.test(sentence) || !fill) return null;
  const misuse =
    text(word.misuse?.s) && text(word.misuse?.why)
      ? `${text(word.misuse.s)} ${text(word.misuse.why)}`
      : "";
  return {
    type: "question",
    id: `w${n}`,
    format: "blank",
    prompt: `Which word matches this meaning? "${text(word.def)}"`,
    text: sentence.replace(GAP, `[[${fill}]]`),
    bank: false,
    hint: startsWith(fill),
    frame: text(word.frame),
    explanation: `${word.hw}: ${text(word.def)} Example: ${text(word.ex)}`.slice(0, 800),
    misconception: misuse.length <= 400 ? misuse : "",
    skill: "vocabulary",
    overflow: misuse.length > 400 ? misuse : "",
  };
}

function passageParts(unit) {
  const p = unit.passage;
  if (!p?.paras?.length) return { blocks: [], questions: [] };
  const lines = p.paras.map(text);
  const blocks = p.listenOnly
    ? listenBlocks(p.id || "passage", p.title, lines)
    : [{ type: "passage", id: "passage", title: text(p.title), text: lines.join("\n\n") }];
  const questions = list(p.qs).map((q, i) => {
    const options = list(q.choices).map((c, n) => ({ id: `o${n + 1}`, text: text(c) }));
    return {
      type: "question",
      id: `r${i + 1}`,
      format: "choice",
      prompt: text(q.q),
      options,
      answer: options[Number(q.a)]?.id ?? "",
      explanation: text(q.why),
      skill: text(q.skill).slice(0, 80),
    };
  });
  if (p.write?.prompt)
    questions.push(
      openQuestion({
        id: "r-write",
        prompt: text(p.write.prompt),
        kind: "write",
        frame: text(p.write.frame),
      }),
    );
  return { blocks, questions, listenOnly: Boolean(p.listenOnly) };
}

function teacherNote(unit, overflow) {
  const lines = [
    `Copied from Vocabulary Academy unit ${unit.id} (grade ${unit.grade}): ${text(unit.title)}. Theme: ${text(unit.theme)}.`,
    `Review status: ${text(unit.editorial?.status) || "unknown"}.`,
    ...list(unit.editorial?.needsReview).map((n) => `Needs review: ${text(n)}`),
    text(unit.teacher?.overview) && `Overview: ${text(unit.teacher.overview)}`,
    text(unit.teacher?.model) && `Think-aloud model: ${text(unit.teacher.model)}`,
    text(unit.wida?.oral) && `Partner talk: ${text(unit.wida.oral)}`,
    ...overflow.map((o) => `Watch-out sentence too long for the question: ${o}`),
  ].filter(Boolean);
  const kept = [];
  let size = 0;
  for (const line of lines) {
    if (size + line.length + 1 > NOTE_MAX) break;
    kept.push(line);
    size += line.length + 1;
  }
  return { teacher: kept.join("\n"), dropped: lines.length - kept.length };
}

export default {
  family: "vocab-academy",
  label: t("Vocabulary Academy units", "Unidades de Academia de Vocabulario"),
  note: t(
    "Copies a unit's words into a practice set you can edit: change meanings and examples, add or remove words, rewrite the matching, fill-in and reading questions.",
    "Copia las palabras de una unidad en un conjunto de práctica que puede editar: cambie significados y ejemplos, agregue o quite palabras y reescriba las preguntas de emparejar, completar y lectura.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "vocab",
    "passage",
    "audio",
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
    "supports",
  ],
  fixed: [
    {
      what: t(
        "Word pictures, pronunciation and word-family displays",
        "Imágenes de palabras, pronunciación y familias de palabras",
      ),
      why: t(
        "These are drawn by the Vocabulary Academy itself and have no matching block, so they stay in the original unit.",
        "Los dibuja la propia Academia de Vocabulario y no tienen un bloque equivalente, por eso permanecen en la unidad original.",
      ),
    },
    {
      what: t("Spanish meanings", "Significados en español"),
      why: t(
        "The Spanish glosses come from the unit and have not been reviewed by a native speaker; check them before sharing.",
        "Los significados en español provienen de la unidad y no han sido revisados por un hablante nativo; revíselos antes de compartir.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const index = await fetchJson(`${BASE}/index.json`);
    return Object.entries(index.grades || {}).flatMap(([grade, g]) =>
      list(g.units).map((u) => ({
        id: u.id,
        title: u.title,
        grade,
        subject: "",
        domain: "Vocabulary",
        description: text(u.theme),
        count: list(u.wordIds).length,
      })),
    );
  },

  url: urlFor,

  async extract(ref, { fetchJson }) {
    const m = REF.exec(String(ref));
    if (!m) throw new Error("bad-ref");
    const unit = await fetchJson(`${BASE}/g${m[1]}/u${m[2]}.json`);
    if (!unit || unit.id !== ref || !Array.isArray(unit.words)) throw new Error("bad-source");
    const words = unit.words.filter((w) => text(w.hw) && text(w.def));
    const vocab = words.map((w) => ({
      term: text(w.hw),
      def: text(w.def),
      es: text(w.es?.gloss),
      example: text(w.ex),
    }));
    const clozes = words.map((w, i) => clozeQuestion(w, i + 1)).filter(Boolean);
    const overflow = clozes.map((c) => c.overflow).filter(Boolean);
    const passage = passageParts(unit);
    const checks = list(unit.check?.constructed).map((c, i) =>
      openQuestion({
        id: `x${i + 1}`,
        prompt: text(c.prompt),
        rubric: list(c.look),
        sample: c.model,
      }),
    );
    const note = teacherNote(unit, overflow);
    const fitted = vocabBlock(vocab);
    const blocks = [
      fitted.block,
      ...noteBlocks("vocab", fitted.extra),
      ...matchQuestions(vocab),
      ...clozes.map(({ overflow: _o, ...q }) => q),
      ...passage.blocks,
      ...passage.questions,
      ...checks,
    ];
    return {
      activity: {
        title: `Grade ${unit.grade} vocabulary: ${text(unit.title)}`.slice(0, 120),
        description: text(unit.theme),
        kind: "interactive",
        template: "match-sort",
        context: {
          grade: String(unit.grade),
          subject: "",
          curriculum: "Vocabulary Academy",
          objective: list(unit.objectives).map(text).join(" ").slice(0, 400),
          standards: [],
          source: { origin: "teacher", note: `Copied from Vocabulary Academy unit ${unit.id}.` },
        },
        supports: {
          wida: 0,
          hints: true,
          frames: true,
          spanish: vocab.some((v) => v.es),
          readAloud: false,
          visuals: false,
          chunk: false,
        },
        options: { shuffle: true, revise: true, answerKey: true },
        blocks,
        notes: { teacher: note.teacher, misconceptions: [] },
      },
      notes: [
        t(
          "Not carried: word pictures, pronunciation, word families, synonyms and antonyms, second examples, non-examples, the earlier-unit review words, the word-study, word-relationship and sentence-production tasks, and the per-word teaching notes. They stay in the original unit.",
          "No se conserva: las imágenes de las palabras, la pronunciación, las familias de palabras, los sinónimos y antónimos, los segundos ejemplos, los contraejemplos, las palabras de repaso de unidades anteriores, las tareas de estudio de palabras, relaciones de palabras y producción de oraciones, ni las notas de enseñanza por palabra. Permanecen en la unidad original.",
        ),
        t(
          "The Spanish meanings come from the unit and have not been reviewed by a native speaker.",
          "Los significados en español provienen de la unidad y no han sido revisados por un hablante nativo.",
        ),
        ...(overflow.length
          ? [
              t(
                "Some wrong-use sentences were too long for the question's watch-out line; they are in the teacher notes instead.",
                "Algunas oraciones de uso incorrecto eran demasiado largas para la línea de advertencia de la pregunta; aparecen en las notas para docentes.",
              ),
            ]
          : []),
        ...(note.dropped
          ? [
              t(
                "Some background lines did not fit in the teacher notes and were left out.",
                "Algunas líneas de contexto no cabían en las notas para docentes y se omitieron.",
              ),
            ]
          : []),
      ],
      source: unit,
      url: urlFor(ref),
      sourceTitle: text(unit.title),
    };
  },
};
