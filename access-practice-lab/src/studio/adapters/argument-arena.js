// Adapter: Argument Arena topics (src/content/craft-arena.js, /arena/<id>). A topic becomes its debate question, the
// six evidence cards (with their sources), and the page's steps:
//   which side each card helps -> sort into the topic's two stances (each card's own `side`)
//   build the argument -> open response with the claim-evidence-reasoning frames
//   answer someone who disagrees -> one open response per side, quoting the topic's own objection
// Arguments are never graded: the sort is the only keyed question, because the cards are the only keyed content.

import {
  fitter,
  openQuestion,
  practiceDraft,
  sortQuestion,
  textBlock,
  withSpanish,
} from "./practice-parts.js";
import { t, text } from "./util.js";

const load = () => import("../../content/craft-arena.js");

export default {
  family: "argument-arena",
  label: t("Argument Arena topics", "Temas de la Arena de argumentos"),
  note: t(
    "Copies a debate topic (its question, evidence cards and the other side's objections) into a draft you can edit.",
    "Copia un tema de debate (su pregunta, tarjetas de evidencia y las objeciones del otro lado) en un borrador que puede editar.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "prompts",
    "pairs",
    "answerKeys",
    "hints",
    "frames",
    "explanations",
    "rubric",
    "openResponses",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t(
        "Dragging cards, recording and the partner rubric",
        "Arrastrar tarjetas, grabar y la rúbrica de pareja",
      ),
      why: t(
        "These are the Arena's own interactions; the draft keeps the question, the cards and the frames.",
        "Son interacciones propias de la Arena; el borrador conserva la pregunta, las tarjetas y los marcos.",
      ),
    },
  ],

  async list() {
    const { TOPICS } = await load();
    return TOPICS.map((tp) => ({
      id: tp.id,
      title: text(tp.title.en),
      grade: tp.band,
      subject: "",
      domain: "Speaking",
      description: text(tp.question.en),
      count: 4,
    }));
  },

  url: (ref) => `/access-practice-lab/arena/${ref}`,

  async extract(ref) {
    const { TOPICS, FRAMES } = await load();
    const tp = TOPICS.find((x) => x.id === String(ref));
    if (!tp) throw new Error("not-found");
    const { fit, overflow } = fitter();
    const side = { y: text(tp.stance.y.en), n: text(tp.stance.n.en) };
    const cards = tp.cards.map((c) => `**${text(c.source)}:** ${text(c.text)}`);
    const frame = ["claim", "evidence", "reasoning"].map((k) => text(FRAMES[k]?.A?.en)).join(" ");
    const rebut = text(FRAMES.agree?.A?.en);
    return {
      activity: practiceDraft(fit, overflow, {
        title: `Argument Arena: ${text(tp.title.en)}`,
        description: text(tp.question.en),
        grade: tp.band,
        objective:
          "Argue a position with a claim, two pieces of evidence and reasoning, then answer the other side.",
        sourceNote: `Copied from Argument Arena topic ${tp.id}.`,
        spanish: true,
        template: "build-explain",
        blocks: [
          textBlock(
            "question",
            `**Debate question:** ${withSpanish(tp.question.en, tp.question.es, 3800)}`,
            "directions",
            fit,
          ),
          textBlock("cards", `**Evidence cards**\n\n${cards.join("\n\n")}`, "body", fit),
          sortQuestion(
            fit,
            {
              id: "sides",
              prompt: "Read all six evidence cards. Which side does each card help?",
              explanation: "Each card supports one side of the question.",
              skill: "evidence",
            },
            [side.y, side.n],
            tp.cards.map((c, n) => ({ id: `e${n + 1}`, text: c.text, label: side[c.side] })),
          ),
          openQuestion(
            fit,
            {
              id: "argue",
              prompt: `Choose a side and write your argument: ${text(tp.question.en)} Use a claim, two evidence cards and your reasoning.`,
              frame,
              hint: withSpanish("", tp.question.es, 400),
            },
            {
              kind: "write",
              rubric: [
                "My claim answers the question.",
                "I used two evidence cards and named their sources.",
                "My reasoning says why the evidence matters.",
              ],
            },
          ),
          ...["y", "n"].map((k) =>
            openQuestion(
              fit,
              {
                id: `rebut-${k}`,
                prompt: `If your side is "${side[k]}", the other side says: "${text(tp.objection[k])}" Answer them.`,
                frame: rebut,
              },
              { kind: "explain" },
            ),
          ),
        ],
        teacher: [
          `Copied from Argument Arena topic ${tp.id} (grades ${tp.band}): ${text(tp.title.en)}.`,
          "The evidence cards were written for practice; some use sample numbers from imagined schools.",
          "The self-check lines on the argument question restate the Arena's own check: a claim, two pieces of evidence and reasoning.",
        ],
      }),
      notes: [
        t(
          "Not carried: the speaking rehearsal and recorder, the printed argument card and the partner rubric.",
          "No se conserva: el ensayo oral y la grabadora, la tarjeta de argumento impresa ni la rúbrica de pareja.",
        ),
      ],
      source: tp,
      url: `/access-practice-lab/arena/${tp.id}`,
      sourceTitle: text(tp.title.en),
    };
  },
};
