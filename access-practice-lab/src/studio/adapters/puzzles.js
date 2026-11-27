// Adapter: Puzzle Den puzzles (content/puzzles/puzzles.json, 61 puzzles). One puzzle becomes one question with the
// puzzle's own hint ladder: a sentence builder becomes an order question (its first accepted sentence is the key), an
// odd-one-out becomes a choice question (its rule is the explanation), and a clue grid becomes a match question whose
// key is the grid's one solution, found by the Puzzle Den's own solver (src/puzzles.js). A grid without exactly one
// solution is not keyed: it becomes an open response so no answer is guessed.

import { gridSolutions } from "../../puzzles.js";
import { openQuestion } from "./vocab-parts.js";
import { list, noteBlocks, t, text } from "./util.js";

const URL = "/access-practice-lab/puzzles";
const TYPE = { order: "Sentence builder", odd: "Odd one out", grid: "Clue grid" };
const urlFor = (id) => `${URL}/${id}`;

async function load(fetchJson) {
  return list((await fetchJson("/access-practice-lab/content/puzzles/puzzles.json"))?.puzzles);
}

const hintOf = (p) => text(list(p.hints)[0]);

function orderQuestion(p) {
  const answer = list(list(p.answers)[0]).map(text);
  return {
    type: "question",
    id: "q1",
    format: "order",
    prompt: `${text(p.prompt)} Put the words in order (the sentence ends with "${text(p.end) || "."}").`,
    items: answer.map((w, i) => ({ id: `w${i + 1}`, text: w })),
    hint: hintOf(p),
    explanation: list(p.answers)
      .map((a) => `${list(a).join(" ")}${text(p.end)}`)
      .join(" / "),
    skill: "sentence building",
  };
}

function oddQuestion(p) {
  const options = list(p.words).map((w, i) => ({ id: `o${i + 1}`, text: text(w) }));
  return {
    type: "question",
    id: "q1",
    format: "choice",
    prompt: text(p.prompt),
    options,
    answer: options[Number(p.answer)]?.id ?? "",
    hint: hintOf(p),
    explanation: text(p.rule),
    skill: "word meaning",
  };
}

function gridQuestion(p) {
  const clues = list(p.clues).map((c) => `- ${text(c.text)}`);
  const prompt = `${text(p.prompt)}\nClues:\n${clues.join("\n")}`;
  const solutions = gridSolutions(p);
  if (solutions.length !== 1)
    return openQuestion({ id: "q1", prompt, hint: hintOf(p), rubric: ["I used every clue."] });
  const [solution] = solutions;
  return {
    type: "question",
    id: "q1",
    format: "match",
    prompt,
    pairs: list(p.people).map((person, i) => ({
      id: `p${i + 1}`,
      left: text(person),
      right: text(solution[person]),
    })),
    hint: hintOf(p),
    explanation: list(p.people)
      .map((person) => `${person}: ${solution[person]}`)
      .join(". "),
    skill: "reading clues",
  };
}

const BUILD = { order: orderQuestion, odd: oddQuestion, grid: gridQuestion };

export default {
  family: "puzzle-den",
  label: t("Puzzle Den puzzles", "Acertijos de la Guarida"),
  note: t(
    "Copies one language puzzle (sentence builder, clue grid or odd one out) with its hints and answer.",
    "Copia un acertijo de lenguaje (construir oraciones, cuadrícula de pistas o la palabra que no pertenece) con sus pistas y su respuesta.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "prompts",
    "choices",
    "pairs",
    "answerKeys",
    "hints",
    "explanations",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t(
        "The second and third hints, and the stars",
        "La segunda y tercera pista, y las estrellas",
      ),
      why: t(
        "A question holds one hint, so the full hint ladder is in the teacher notes; stars are Puzzle Den practice counts and are not copied.",
        "Una pregunta tiene una sola pista, por eso la escalera completa de pistas está en las notas para docentes; las estrellas son conteos de práctica y no se copian.",
      ),
    },
  ],

  async list({ fetchJson }) {
    return (await load(fetchJson)).map((p) => ({
      id: p.id,
      title: text(p.title),
      grade: p.band === "both" ? "" : text(p.band),
      subject: "",
      domain: "Puzzles",
      description: TYPE[p.type] || "",
      count: 1,
    }));
  },

  url: urlFor,

  async extract(ref, { fetchJson }) {
    const p = (await load(fetchJson)).find((x) => x.id === ref);
    if (!p || !BUILD[p.type]) throw new Error("bad-source");
    const q = BUILD[p.type](p);
    const lines = [
      `Copied from Puzzle Den puzzle ${p.id} (${TYPE[p.type]}, grades ${p.band}).`,
      `Hint ladder: ${list(p.hints)
        .map((h, i) => `${i + 1}. ${text(h)}`)
        .join(" ")}`,
      p.type === "order" && list(p.answers).length > 1
        ? `This puzzle accepts ${list(p.answers).length} sentences; the question keys the first. Accept: ${q.explanation}`
        : "",
    ].filter(Boolean);
    return {
      activity: {
        title: `Puzzle: ${text(p.title)}`.slice(0, 120),
        description: TYPE[p.type],
        kind: "interactive",
        template: "build-explain",
        context: {
          grade: p.band === "both" ? "" : text(p.band),
          subject: "",
          curriculum: "Puzzle Den",
          objective: text(p.prompt).slice(0, 400),
          standards: [],
          source: { origin: "teacher", note: `Copied from Puzzle Den puzzle ${p.id}.` },
        },
        supports: {
          wida: 0,
          hints: true,
          frames: false,
          spanish: false,
          readAloud: false,
          visuals: false,
          chunk: false,
        },
        options: { shuffle: true, revise: true, answerKey: true },
        blocks: [q, ...noteBlocks("puzzle", lines)],
        notes: { teacher: "", misconceptions: [] },
      },
      notes: [
        t(
          "Not carried: the second and third hints (they are in the teacher notes), stars, and other accepted word orders beyond the first.",
          "No se conserva: la segunda y tercera pista (están en las notas para docentes), las estrellas y otros órdenes de palabras aceptados además del primero.",
        ),
      ],
      source: p,
      url: urlFor(ref),
      sourceTitle: text(p.title),
    };
  },
};
