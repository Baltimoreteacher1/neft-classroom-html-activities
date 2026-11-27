// Adapter: Mentor Text Explorer texts (src/content/craft-mentor.js: 32 short original mentor texts, eight writer's moves,
// two try-it tasks per move and band). A text becomes the mentor text, a sort question that files each marked phrase
// under the writer's move the text marks it with (the key is the author's own marking), and the try-it tasks for every
// move in the text as open writing with their starter frame, model sentence and success criteria. The notes on each move
// (English and Spanish) are carried as the sort explanation and a teacher note. Nothing is reworded.

import { openQuestion } from "./vocab-parts.js";
import { list, noteBlocks, shorten, t, text } from "./util.js";

const MARK = /\{(\w+):([^}]+)\}/g;
const URL = "/access-practice-lab/mentor";
const urlFor = (id) => `${URL}/${id}`;
const content = () => import("../../content/craft-mentor.js");

function sortQuestion(m, item, phrases) {
  const moves = [...new Set(phrases.map((p) => p.move))];
  const name = (id) => text(m.findMove(id)?.name) || id;
  const lines = phrases.map((p) => `"${p.text}" (${name(p.move)}): ${text(p.note[0])}`);
  const why = lines.join("\n");
  return {
    question: {
      type: "question",
      id: "moves",
      format: "sort",
      prompt: `Read "${text(item.title)}". Sort each phrase by the writer's move it shows.`,
      categories: moves.map((id) => ({ id: `c-${id}`.slice(0, 32), label: name(id) })),
      items: phrases.map((p, i) => ({
        id: `i${i + 1}`,
        text: p.text,
        category: `c-${p.move}`.slice(0, 32),
      })),
      hint: shorten(moves.map((id) => `${name(id)}: ${text(m.findMove(id)?.how)}`).join(" "), 400),
      explanation: shorten(why, 800),
      skill: "author's craft",
    },
    overflow: why.length > 800 ? lines : [],
  };
}

function tryQuestions(m, item, moves) {
  return moves.flatMap((move) =>
    list(m.TRY[move]?.[item.band]).map((task) => {
      const prompt = [
        text(task.prompt),
        text(task.base) && `Revise: "${text(task.base)}"`,
        text(task.why) && `Audience and purpose: ${text(task.why)}`,
      ]
        .filter(Boolean)
        .join(" ");
      return openQuestion({
        id: `try-${task.id}`.slice(0, 32),
        prompt,
        kind: "write",
        frame: text(task.start),
        rubric: list(m.MOVE_CRITERIA[move]).map((c) => c[0]),
        sample: task.model,
        hint: text(m.findMove(move)?.how),
      });
    }),
  );
}

export default {
  family: "mentor-texts",
  label: t("Mentor Text Explorer texts", "Textos del Explorador de textos modelo"),
  note: t(
    "Copies a mentor text, a sort of its marked phrases by writer's move, and the try-it writing tasks for those moves.",
    "Copia un texto modelo, una clasificación de sus frases marcadas por recurso del escritor y las tareas de escritura de esos recursos.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "passage",
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
        "Tap-to-reveal highlights and the Writer's Toolbox",
        "Resaltado al tocar y la caja de herramientas",
      ),
      why: t(
        "The explorer highlights each move inside the text and saves collected moves on the device; a copy shows the plain text and lists the moves in a sort question.",
        "El explorador resalta cada recurso dentro del texto y guarda los recursos reunidos en el dispositivo; una copia muestra el texto simple y los recursos en una pregunta de clasificar.",
      ),
    },
  ],

  async list() {
    const m = await content();
    return m.TEXTS.map((x) => ({
      id: x.id,
      title: text(x.title),
      grade: text(x.band),
      subject: "",
      domain: "Writing",
      description: text(m.GENRES.find((g) => g.id === x.genre)?.name),
      count: 1 + m.movesIn(x).reduce((n, mv) => n + list(m.TRY[mv]?.[x.band]).length, 0),
    }));
  },

  url: urlFor,

  async extract(ref) {
    const m = await content();
    const item = m.findText(ref);
    if (!item) throw new Error("bad-source");
    const marks = [...item.text.matchAll(MARK)];
    const phrases = marks.map((mk, i) => ({
      move: mk[1],
      text: text(mk[2]),
      note: list(item.notes[i]),
    }));
    const moves = m.movesIn(item);
    const sorted = sortQuestion(m, item, phrases);
    const genre = m.GENRES.find((g) => g.id === item.genre);
    const lines = [
      `Copied from Mentor Text Explorer text ${item.id} (${text(genre?.name)}, grades ${item.band}). Spanish title: ${text(item.titleEs)}.`,
      ...sorted.overflow.map((l) => `Move note: ${l}`),
      ...phrases.map(
        (p) => `Nota (${text(m.findMove(p.move)?.es)}) sobre "${p.text}": ${text(p.note[1])}`,
      ),
    ];
    return {
      activity: {
        title: `Mentor text: ${text(item.title)}`.slice(0, 120),
        description: `${text(genre?.name)} · ${moves.map((id) => text(m.findMove(id)?.name)).join(", ")}`,
        kind: "interactive",
        template: "build-explain",
        context: {
          grade: text(item.band),
          subject: "",
          curriculum: "Mentor Text Explorer",
          objective: "Name the moves a writer makes and try each move in your own sentence.",
          standards: [],
          source: { origin: "teacher", note: `Copied from Mentor Text Explorer text ${item.id}.` },
        },
        supports: {
          wida: 0,
          hints: true,
          frames: true,
          spanish: false,
          readAloud: false,
          visuals: false,
          chunk: false,
        },
        options: { shuffle: true, revise: true, answerKey: true },
        blocks: [
          { type: "passage", id: "mentor", title: text(item.title), text: item.plain },
          sorted.question,
          ...tryQuestions(m, item, moves),
          ...noteBlocks("mentor", lines),
        ],
        notes: { teacher: "", misconceptions: [] },
      },
      notes: [
        t(
          "Not carried: the in-text highlights, the Writer's Toolbox and the on-device practice checks. The Spanish notes on each move are in the teacher notes.",
          "No se conserva: el resaltado dentro del texto, la caja de herramientas del escritor y las revisiones de práctica en el dispositivo. Las notas en español sobre cada recurso están en las notas para docentes.",
        ),
      ],
      source: { id: item.id, text: item.text, notes: item.notes },
      url: urlFor(ref),
      sourceTitle: text(item.title),
    };
  },
};
