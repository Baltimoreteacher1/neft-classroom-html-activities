// Adapter: Language Choice Boards (content/choice-boards.json, /choice-boards/<narrate|inform|explain|argue>?grades=).
// One board (a grade band x a WIDA Key Language Use) becomes its theme and its nine squares, each an open task with the
// square's own frame and look-for line; a square's listening text becomes a read-aloud block, its reading a passage.
// The squares have no answer key, so every one is an open response: nothing is turned into multiple choice.

import {
  audioBlocks,
  fitter,
  openQuestion,
  pairOf,
  passageBlocks,
  practiceDraft,
  textBlock,
  withSpanish,
} from "./practice-parts.js";
import { list, t, text } from "./util.js";

const FILE = "/access-practice-lab/content/choice-boards.json";
const REF = /^(K|1|2-3|3-5|6-8)-(narrate|inform|explain|argue)$/;
const KLU = { narrate: "Narrate", inform: "Inform", explain: "Explain", argue: "Argue" };

const refOf = (band, klu) => `${band}-${klu.toLowerCase()}`;

function squareBlocks(sq, n, fit) {
  const title = pairOf(sq.title);
  const task = pairOf(sq.task);
  const frame = pairOf(sq.frame);
  const look = pairOf(sq.lookFor);
  return [
    textBlock(
      `h${n}`,
      `Square ${n}: ${title.en} (${text(sq.domain)}, about ${sq.minutes} minutes)`,
      "heading",
      fit,
    ),
    ...(text(sq.listen) ? audioBlocks(`s${n}`, `Listen: ${title.en}`, [sq.listen]) : []),
    ...(text(sq.read) ? passageBlocks(`read${n}`, title.en, [sq.read]) : []),
    openQuestion(
      fit,
      {
        id: `sq${n}`,
        prompt: task.en,
        hint: withSpanish("", task.es, 400),
        frame: frame.en,
        skill: text(sq.domain),
      },
      { kind: sq.domain === "Writing" ? "write" : "explain", rubric: [look.en] },
    ),
  ];
}

export default {
  family: "choice-boards",
  label: t("Language Choice Boards", "Tableros de opciones de lenguaje"),
  note: t(
    "Copies a choice board (nine short tasks with their frames, listening and reading texts) into a draft you can edit.",
    "Copia un tablero de opciones (nueve tareas cortas con sus marcos, textos para escuchar y leer) en un borrador que puede editar.",
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
    "frames",
    "rubric",
    "openResponses",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t("The three-in-a-row board layout", "El tablero de tres en línea"),
      why: t(
        "The draft lists the nine squares in board order; picking three in a row stays on the board page.",
        "El borrador muestra las nueve casillas en el orden del tablero; elegir tres en línea permanece en la página del tablero.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const data = await fetchJson(FILE);
    return Object.entries(data.bands || {}).flatMap(([band, boards]) =>
      Object.entries(boards).map(([klu, b]) => ({
        id: refOf(band, klu),
        title: `${klu} board: ${pairOf(b.theme).en}`,
        grade: band,
        subject: "",
        domain: klu,
        description: `Nine short ${klu.toLowerCase()} tasks for grades ${band}.`,
        count: list(b.squares).length,
      })),
    );
  },

  url: (ref) => {
    const m = REF.exec(ref);
    return m ? `/access-practice-lab/choice-boards/${m[2]}` : "";
  },

  async extract(ref, { fetchJson }) {
    const m = REF.exec(String(ref));
    if (!m) throw new Error("bad-ref");
    const data = await fetchJson(FILE);
    const board = data.bands?.[m[1]]?.[KLU[m[2]]];
    if (!board) throw new Error("not-found");
    const { fit, overflow } = fitter();
    const theme = pairOf(board.theme);
    return {
      activity: practiceDraft(fit, overflow, {
        title: `${KLU[m[2]]} choice board: ${theme.en}`,
        description: `Grades ${m[1]}. Do any three squares in a row: across, down or corner to corner.`,
        grade: m[1],
        objective: `Practice the ${KLU[m[2]]} Key Language Use across listening, reading, speaking and writing.`,
        sourceNote: `Copied from The Language Page choice board ${ref}.`,
        spanish: true,
        blocks: [
          textBlock(
            "intro",
            withSpanish(
              `Theme: ${theme.en}. Pick any three squares in a row: across, down or corner to corner.`,
              theme.es,
              4000,
              "Tema:",
            ),
            "directions",
            fit,
          ),
          ...list(board.squares).flatMap((sq, i) => squareBlocks(sq, i + 1, fit)),
        ],
        teacher: [
          `Copied from the ${KLU[m[2]]} choice board for grades ${m[1]}: ${theme.en}.`,
          "Each square works in class or at home with only the page and paper. Squares are listed in board order (rows of three).",
          text(data.note),
        ],
      }),
      notes: [
        t(
          "Not carried: the board's three-in-a-row tracking and the Spanish versions of the listening and reading texts.",
          "No se conserva: el seguimiento de tres en línea del tablero ni las versiones en español de los textos para escuchar y leer.",
        ),
      ],
      source: board,
      url: `/access-practice-lab/choice-boards/${m[2]}`,
      sourceTitle: theme.en,
    };
  },
};
