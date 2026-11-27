// Adapter: Reading Ladder passages (content/ladder/passages.json, 18 passages; leveled.json holds each passage's easier,
// richer and Spanish versions). A passage becomes the reading, its Spanish version, and its three authored questions with
// their hints and explanations. Nothing is reworded: every question, choice, key and explanation is the file's own.

import { list, noteBlocks, t, text } from "./util.js";

const BASE = "/access-practice-lab/content/ladder";
const URL = "/access-practice-lab/ladder";

async function load(fetchJson) {
  const [data, leveled] = await Promise.all([
    fetchJson(`${BASE}/passages.json`),
    fetchJson(`${BASE}/leveled.json`).catch(() => ({ passages: {} })),
  ]);
  return { passages: list(data?.passages), leveled: leveled?.passages || {} };
}

function question(q, n) {
  const options = list(q.choices).map((c, i) => ({ id: `o${i + 1}`, text: text(c) }));
  return {
    type: "question",
    id: `q${n}`,
    format: "choice",
    prompt: text(q.q),
    options,
    answer: options[Number(q.answer)]?.id ?? "",
    hint: text(q.hint),
    explanation: text(q.why),
    skill: text(q.kind).slice(0, 80),
  };
}

export default {
  family: "reading-ladder",
  label: t("Reading Ladder passages", "Lecturas de la Escalera de lectura"),
  note: t(
    "Copies one ladder passage with its three questions, hints and explanations, plus its Spanish version.",
    "Copia una lectura de la escalera con sus tres preguntas, pistas y explicaciones, y su versión en español.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "passage",
    "prompts",
    "choices",
    "answerKeys",
    "hints",
    "explanations",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t("The ladder's step-up and step-down", "El subir y bajar de escalón de la escalera"),
      why: t(
        "The ladder picks the next passage from a learner's round on this device; a copied passage is one fixed text.",
        "La escalera elige la siguiente lectura según la ronda del estudiante en este dispositivo; una lectura copiada es un texto fijo.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const { passages } = await load(fetchJson);
    return passages.map((p) => ({
      id: p.id,
      title: text(p.title),
      grade: "",
      subject: "",
      domain: "Reading",
      description: `Step ${p.step} · ${text(p.topic)}`,
      count: list(p.questions).length,
    }));
  },

  url: () => URL,

  async extract(ref, { fetchJson }) {
    const { passages, leveled } = await load(fetchJson);
    const p = passages.find((x) => x.id === ref);
    if (!p || !text(p.text)) throw new Error("bad-source");
    const level = leveled[p.id] || {};
    const title = text(p.title);
    const blocks = [{ type: "passage", id: "passage", title, text: text(p.text) }];
    if (text(level.es))
      blocks.push({
        type: "passage",
        id: "passage-es",
        title: `${title} (en español)`.slice(0, 120),
        text: text(level.es),
      });
    blocks.push(...list(p.questions).map((q, i) => question(q, i + 1)));
    const lines = [
      `Copied from the Reading Ladder, step ${p.step} of 6 (${text(p.topic)}). Steps are practice steps ordered by length and sentence complexity, not Lexile, grade or WIDA levels.`,
      text(level.easier) && `Easier version of the same passage: ${text(level.easier)}`,
      text(level.richer) && `Richer version of the same passage: ${text(level.richer)}`,
    ].filter(Boolean);
    blocks.push(...noteBlocks("ladder", lines));
    return {
      activity: {
        title: `Reading Ladder: ${title}`.slice(0, 120),
        description: `Step ${p.step} · ${text(p.topic)}`,
        kind: "interactive",
        template: "interactive-reading",
        context: {
          grade: "",
          subject: "",
          curriculum: "Reading Ladder",
          objective:
            "Read a short passage and answer questions about its details and what it suggests.",
          standards: [],
          source: { origin: "teacher", note: `Copied from Reading Ladder passage ${p.id}.` },
        },
        supports: {
          wida: 0,
          hints: true,
          frames: false,
          spanish: Boolean(text(level.es)),
          readAloud: false,
          visuals: false,
          chunk: false,
        },
        options: { shuffle: false, revise: true, answerKey: true },
        blocks,
        notes: { teacher: "", misconceptions: [] },
      },
      notes: [
        t(
          "Not carried: the ladder's placement and step changes. The easier and richer versions of the passage are in the teacher notes.",
          "No se conserva: la ubicación y los cambios de escalón. Las versiones más fácil y más rica de la lectura están en las notas para docentes.",
        ),
      ],
      source: { passage: p, leveled: level },
      url: URL,
      sourceTitle: title,
    };
  },
};
