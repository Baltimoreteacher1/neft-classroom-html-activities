// Adapter: Reading Path phonics units (content/reading-path/phonics-scope.json, 15 units, each with a decodable book in
// content/reading-path/<unit>.json). A unit becomes its decodable book as a read-aloud script with its transcript, the
// book in Spanish, and the unit's pattern words, sight words and model sentence. The Reading Path has no authored
// questions, so the one task is the page's own: read the book aloud, with the Reading Path's adult routine as the hint.

// The Reading Path's own "Read together" routine for adults (src/reading-path/view.js adultHTML).
const ROUTINE =
  "Hear the sound. Point to each letter. Blend the sounds. Read the page again. Let the learner try each word.";

import { listenBlocks } from "./listen-blocks.js";
import { openQuestion } from "./vocab-parts.js";
import { list, noteBlocks, t, text } from "./util.js";

const BASE = "/access-practice-lab/content/reading-path";
const REF = /^[a-z][a-z-]{0,31}$/;
const urlFor = (id) => `/access-practice-lab/reading-path/${id}`;

async function units(fetchJson) {
  return list((await fetchJson(`${BASE}/phonics-scope.json`))?.units);
}

export default {
  family: "reading-path",
  label: t("Reading Path phonics units", "Unidades de fonética del Camino de lectura"),
  note: t(
    "Copies a unit's decodable book (with read-aloud), its Spanish version, and the unit's pattern and sight words.",
    "Copia el libro decodificable de una unidad (con lectura en voz alta), su versión en español y las palabras del patrón y de uso frecuente.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "passage",
    "audio",
    "prompts",
    "hints",
    "openResponses",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t(
        "Build a Word, Word Machine and Sight Word Match",
        "Construye una palabra, Máquina de palabras y Busca la palabra",
      ),
      why: t(
        "These games are built by the Reading Path from the unit's letters and have no matching block; the unit's words are copied so a teacher can add tasks.",
        "El Camino de lectura arma estos juegos con las letras de la unidad y no tienen un bloque equivalente; se copian las palabras para que el docente agregue tareas.",
      ),
    },
  ],

  async list({ fetchJson }) {
    return (await units(fetchJson)).map((u) => ({
      id: u.id,
      title: `${u.n}. ${text(u.teaches?.en)}`,
      grade: "",
      subject: "",
      domain: "Reading",
      description: text(u.pattern),
      count: 1,
    }));
  },

  url: urlFor,

  async extract(ref, { fetchJson }) {
    if (!REF.test(ref)) throw new Error("bad-ref");
    const unit = (await units(fetchJson)).find((u) => u.id === ref);
    if (!unit) throw new Error("bad-source");
    const book = await fetchJson(`${BASE}/${ref}.json`);
    if (!book || book.unit !== ref || !Array.isArray(book.pages)) throw new Error("bad-source");
    const title = text(book.title?.en);
    const pages = book.pages.map((p) => text(p.en)).filter(Boolean);
    const pagesEs = book.pages.map((p) => text(p.es)).filter(Boolean);
    const words = [
      `Pattern: ${text(unit.teaches?.en)} (${text(unit.teaches?.es)})`,
      list(unit.exampleWords).length && `Pattern words: ${unit.exampleWords.join(", ")}`,
      list(unit.olderWords).length &&
        `More pattern words for older readers: ${unit.olderWords.join(", ")}`,
      list(unit.sightWords).length && `Sight words: ${unit.sightWords.join(", ")}`,
      text(unit.sentence?.en) &&
        `Model sentence: ${text(unit.sentence.en)} (${text(unit.sentence?.es)})`,
    ]
      .filter(Boolean)
      .join("\n");
    const blocks = [
      { type: "text", id: "words", role: "body", text: words },
      ...listenBlocks("book", title, [pages.join(" ")]),
      ...(pagesEs.length
        ? [
            {
              type: "passage",
              id: "book-es",
              title: `${text(book.title?.es) || title} (en español)`.slice(0, 120),
              text: pagesEs.join("\n"),
            },
          ]
        : []),
      openQuestion({ id: "read", prompt: `Read "${title}" aloud.`, kind: "explain", hint: ROUTINE }),
      ...noteBlocks("rp", [
        `Copied from Reading Path unit ${unit.n} (${unit.id}). Review status: ${text(book.reviewStatus) || "unknown"}. Letters taught so far: ${list(unit.graphemes).join(", ")}.`,
      ]),
    ];
    return {
      activity: {
        title: `Reading Path: ${title}`.slice(0, 120),
        description: text(unit.pattern),
        kind: "worksheet",
        template: "reading-writing",
        context: {
          grade: "",
          subject: "",
          curriculum: "Reading Path",
          objective:
            `Read words with the pattern ${text(unit.teaches?.en)} in a decodable book.`.slice(
              0,
              400,
            ),
          standards: [],
          source: { origin: "teacher", note: `Copied from Reading Path unit ${unit.id}.` },
        },
        supports: {
          wida: 0,
          hints: false,
          frames: false,
          spanish: pagesEs.length > 0,
          readAloud: true,
          visuals: false,
          chunk: false,
        },
        options: { shuffle: false, revise: true, answerKey: false },
        blocks,
        notes: { teacher: "", misconceptions: [] },
      },
      notes: [
        t(
          "Not carried: the unit's word games and mini-lesson. The Reading Path has no authored questions, so the only task is reading the book aloud; add tasks in the editor.",
          "No se conserva: los juegos de palabras ni la minilección de la unidad. El Camino de lectura no tiene preguntas escritas, por eso la única tarea es leer el libro en voz alta; agregue tareas en el editor.",
        ),
      ],
      source: { unit, book },
      url: urlFor(ref),
      sourceTitle: title,
    };
  },
};
