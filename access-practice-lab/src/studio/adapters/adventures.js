// Adapter: Adventure Worlds missions (src/adventures/worlds/, /adventures/<world>/<mission>?grades=<band>). One mission at
// one grade band becomes its scenes in order, keyed as the adventure engine (src/adventures/checks.js) keys them:
//   story, checkpoint -> text (a story the page reads aloud also gets a read-aloud block)
//   read   -> passage (its glossary joins one vocabulary block, with Spanish)      listen -> read-aloud + transcript
//   clues  -> multi: every clue marked relevant          order -> order (scene items are authored in the right order)
//   choice -> choice; a scene with two correct options becomes a choose-all question, so neither is marked wrong
//   respond -> open writing or speaking response with the scene's frames, word bank and model (never graded)

import {
  audioBlocks,
  fitter,
  openQuestion,
  orderQuestion,
  pairOf,
  passageBlocks,
  pickQuestion,
  practiceDraft,
  textBlock,
  vocabItems,
} from "./practice-parts.js";
import { list, t, text } from "./util.js";

const load = () => import("../../adventures/worlds/index.js");
const REF = /^([a-z0-9-]+)\/([a-z0-9-]+)\/(3-5|6-8)$/;
const en = (v) => pairOf(v).en;

function sceneBlocks(s, n, fit, glossary) {
  const id = `s${n}`;
  switch (s.kind) {
    case "story": {
      const line = s.speaker ? `${text(s.speaker)}: ${en(s.text)}` : en(s.text);
      return s.listen
        ? audioBlocks(id, `Listen: ${text(s.speaker) || "story"}`, [line])
        : [textBlock(id, line, "body", fit)];
    }
    case "checkpoint":
      return [textBlock(id, `**Checkpoint.** ${en(s.text)}`, "body", fit)];
    case "read":
      glossary.push(...list(s.glossary));
      return passageBlocks(id, en(s.title), [en(s.text)]);
    case "listen":
      return audioBlocks(id, `Listen: ${en(s.transcriptLabel)}`, [en(s.script)]);
    case "clues": {
      const opts = s.clues.map((c, i) => ({ id: `c${i + 1}`, text: fit(en(c.text), 400, "Clue") }));
      return [
        pickQuestion(
          fit,
          {
            id,
            prompt: `${en(s.prompt)} Choose every clue that helps.`,
            explanation: s.clues
              .filter((c) => c.why)
              .map((c) => `"${en(c.text)}": ${en(c.why)}`)
              .join("\n"),
            skill: "evidence",
          },
          opts,
          s.clues.map((c, i) => (c.relevant ? `c${i + 1}` : "")).filter(Boolean),
        ),
      ];
    }
    case "choice": {
      const right = s.options.map((o, i) => (o.correct ? `o${i + 1}` : "")).filter(Boolean);
      const q = pickQuestion(
        fit,
        {
          id,
          prompt:
            right.length > 1
              ? `${en(s.prompt)} More than one answer works: choose all that do.`
              : en(s.prompt),
          explanation: s.options
            .filter((o) => o.feedback)
            .map((o) => `"${en(o.text)}": ${en(o.feedback)}`)
            .join("\n"),
          skill: "reasoning",
        },
        s.options.map((o, i) => ({ id: `o${i + 1}`, text: fit(en(o.text), 400, "Answer choice") })),
        right,
      );
      return [q];
    }
    case "order":
      return [
        orderQuestion(
          fit,
          {
            id,
            prompt: en(s.prompt),
            explanation: s.items.map((it, i) => `${i + 1}. ${en(it)}`).join("\n"),
            skill: "sequence",
          },
          s.items.map((it, i) => ({ id: `i${i + 1}`, text: en(it) })),
        ),
      ];
    case "respond":
      return [
        openQuestion(
          fit,
          {
            id,
            prompt: en(s.prompt),
            frame: list(s.frames).map(en).join(" "),
            hint: list(s.wordBank).length ? `Word bank: ${s.wordBank.map(text).join(", ")}` : "",
          },
          { kind: s.mode === "write" ? "write" : "explain", sample: en(s.model) },
        ),
      ];
    default:
      return [];
  }
}

export default {
  family: "adventures",
  label: t("Adventure Worlds missions", "Misiones de Mundos de aventura"),
  note: t(
    "Copies one adventure mission at one grade band (its story, readings, clues, choices and writing) into a draft you can edit.",
    "Copia una misión de aventura de un nivel de grado (su historia, lecturas, pistas, decisiones y escritura) en un borrador que puede editar.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "passage",
    "audio",
    "vocab",
    "prompts",
    "choices",
    "answerKeys",
    "hints",
    "frames",
    "explanations",
    "samples",
    "openResponses",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t(
        "Scene art and the one-scene-per-screen story player",
        "El arte de las escenas y el reproductor de una escena por pantalla",
      ),
      why: t(
        "The draft keeps the words and keys of every scene; the art and the story player stay in Adventure Worlds.",
        "El borrador conserva las palabras y claves de cada escena; el arte y el reproductor permanecen en Mundos de aventura.",
      ),
    },
  ],

  async list() {
    const { WORLDS } = await load();
    return WORLDS.flatMap((w) =>
      w.missions.flatMap((m) =>
        Object.keys(m.bands).map((band) => ({
          id: `${w.id}/${m.id}/${band}`,
          title: `${en(w.title) || w.id}: ${en(m.title)} (grades ${band})`,
          grade: band,
          subject: "",
          domain: text(m.keyUse),
          description: en(m.goal),
          count: m.bands[band].filter((s) =>
            ["clues", "choice", "order", "respond"].includes(s.kind),
          ).length,
        })),
      ),
    );
  },

  url: (ref) => {
    const m = REF.exec(ref);
    return m ? `/access-practice-lab/adventures/${m[1]}/${m[2]}` : "";
  },

  async extract(ref) {
    const m = REF.exec(String(ref));
    if (!m) throw new Error("bad-ref");
    const { worldById } = await load();
    const world = worldById(m[1]);
    const mission = world?.missions.find((x) => x.id === m[2]);
    const scenes = mission?.bands?.[m[3]];
    if (!scenes) throw new Error("not-found");
    const { fit, overflow } = fitter();
    const glossary = [];
    const body = scenes.flatMap((s, i) => sceneBlocks(s, i + 1, fit, glossary));
    const vocab = vocabItems(
      glossary.map((g) => ({ term: g.word, def: g.en, es: g.es })),
      fit,
    );
    return {
      activity: practiceDraft(fit, overflow, {
        title: `${en(mission.title)} (${en(world.title) || world.id})`,
        description: en(mission.goal),
        grade: m[3],
        objective: en(mission.goal),
        sourceNote: `Copied from Adventure Worlds mission ${ref}.`,
        spanish: Boolean(vocab?.items.some((v) => v.es)),
        template: "interactive-reading",
        blocks: [
          textBlock("goal", `**Mission goal:** ${en(mission.goal)}`, "directions", fit),
          vocab,
          ...body,
        ],
        teacher: [
          `Copied from Adventure Worlds: ${en(world.title) || world.id}, mission "${en(mission.title)}", grades ${m[3]}. Key Language Use: ${text(mission.keyUse)}; domains: ${list(mission.domains).join(", ")}.`,
          "Choice scenes with two correct options are written as choose-all questions; the adventure accepts either option.",
        ],
      }),
      notes: [
        t(
          "Not carried: scene art, the Spanish versions of the story and questions, the respond checks that look for connectors and clue words, and the mission book.",
          "No se conserva: el arte de las escenas, las versiones en español de la historia y las preguntas, las revisiones de respuesta que buscan conectores y palabras de pistas, ni el libro de la misión.",
        ),
      ],
      source: scenes,
      url: `/access-practice-lab/adventures/${m[1]}/${m[2]}`,
      sourceTitle: en(mission.title),
    };
  },
};
