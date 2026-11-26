// BCPSS Plan & Respond — small-group reteach plan (intervention builder).
// Eight short steps, assembled from the unit's authored content. Two pathways:
//   content  — the idea is off (the words may be fine): the known misconception, the model, guided reasoning.
//   language — the idea seems right but the words or sentences get in the way: words, mentor sentence, frames.
// Both pathways keep the same task and the same exit ticket. Rigor never drops; only the route to it changes.

import { spiralItems } from "./companion-data.js";

export const PATHWAYS = [
  {
    id: "content",
    label: "The idea is off",
    hint: "Answers show a mix-up about the concept itself",
  },
  {
    id: "language",
    label: "The words get in the way",
    hint: "The idea seems right, but explaining it is hard",
  },
];

const PRACTICE_KINDS = {
  content: ["error_analysis", "sequence", "word_sort", "quiz", "cloze", "read_annotate"],
  language: ["sentence_combine", "unscramble", "cloze", "match", "talk_cards", "write_scaffold"],
};

function pickActivity(studio, pathway) {
  const acts = studio.activities || [];
  for (const kind of PRACTICE_KINDS[pathway]) {
    const i = acts.findIndex((a) => a.kind === kind);
    if (i >= 0) return { index: i + 1, activity: acts[i] };
  }
  return acts.length ? { index: 1, activity: acts[0] } : null;
}

/**
 * @param {object} detail unit detail
 * @param {{ pathway?: "content"|"language", wida?: string, before?: {id:string, unit_title:string}|null, wordCount?: number }} opts
 */
export function buildReteachPlan(detail, opts = {}) {
  const studio = detail?.studio;
  if (!studio) throw new Error("buildReteachPlan: unit has no authored studio content");
  const pathway = opts.pathway === "language" ? "language" : "content";
  const wida = ["1_2", "3_4", "5_6"].includes(opts.wida) ? opts.wida : "3_4";
  const unitId = detail.unit.id;
  const vocab = studio.vocab || [];
  const words = vocab.slice(0, opts.wordCount || (pathway === "language" ? 4 : 3));
  const frames = studio.frames?.[`l${wida}`] || [];
  const m = studio.misconception || {};
  const et = studio.exit_ticket || {};
  const spiral = spiralItems(detail).slice(0, 2);
  const practice = pickActivity(studio, pathway);
  const watch = (studio.watchouts || [])[0];

  const steps = [
    {
      id: "warm",
      title: "Wake up what they know",
      minutes: 3,
      teacher: opts.before
        ? `Connect to the earlier unit "${opts.before.unit_title}". Ask students what they remember, then show the question below.`
        : "Ask students what they already know about the big question before you teach anything new.",
      items: spiral.length
        ? spiral.map((r) => ({ q: r.prompt, a: r.answer, choices: r.options, from: r.from || "" }))
        : [{ q: studio.essential_question, a: "" }],
    },
    {
      id: "words",
      title: "See the key words",
      minutes: pathway === "language" ? 6 : 4,
      teacher:
        "Show each picture first, say the word, have students repeat it, then read the example and the non-example.",
      words: words.map((v) => ({
        term: v.term,
        def: v.def,
        example: v.example,
        nonexample: v.nonexample,
        es: v.es || "",
        cue: v.cue || "",
      })),
      link: { tab: "vocab", label: "Open Visual Vocabulary" },
    },
    pathway === "content"
      ? {
          id: "model",
          title: "Show the idea",
          minutes: 5,
          teacher:
            m.redirect || "Model the idea with a drawing or object before using any symbols.",
          lookFor: m.pattern || "",
          mentor: studio.mentor?.text || "",
        }
      : {
          id: "model",
          title: "Take apart the mentor sentence",
          minutes: 5,
          teacher: "Read the mentor sentence. Point to each colored part and ask its question.",
          mentor: studio.mentor?.text || "",
          chunks: (studio.mentor?.chunks || []).map((c) => ({
            text: c.text,
            role: c.role,
            ask: c.ask,
          })),
        },
    {
      id: "guided",
      title: "Think it through together",
      minutes: 6,
      teacher:
        pathway === "content"
          ? "Answer the big question out loud together. Stop at each step and ask a student what comes next and why, then compare with the model."
          : "Build an answer to the big question together. Students say each part aloud with the frame before anyone writes, then compare with the model.",
      prompt: studio.essential_question,
      model: studio.mentor?.text || "",
      frame: frames[0] || "",
    },
    {
      id: "practice",
      title: "Practice with a partner",
      minutes: practice?.activity?.minutes || 8,
      teacher: practice
        ? practice.activity.tip || practice.activity.mission
        : "Partners practice with the unit activities.",
      activity: practice
        ? {
            index: practice.index,
            title: practice.activity.title,
            mission: practice.activity.mission,
            support: practice.activity.support?.[`l${wida}`] || "",
          }
        : null,
      play: practice
        ? `/bcpss-teachers/language-studio/?unit=${encodeURIComponent(unitId)}&level=l${wida}&a=${practice.index}`
        : "",
    },
    {
      id: "feedback",
      title: "Give quick feedback",
      minutes: 3,
      teacher:
        "Name one thing that is right and one thing to fix. Use the descriptions below to decide what to say.",
      rubric: et.rubric || null,
      watch: watch ? { issue: watch.issue, fix: watch.fix } : null,
    },
    {
      id: "revise",
      title: "Fix and improve",
      minutes: 4,
      teacher:
        "Students revise one sentence of their work using a frame, then read it to a partner.",
      frames,
      connectors: studio.connectors || [],
    },
    {
      id: "fresh",
      title: "Try it alone",
      minutes: 4,
      teacher: "Students answer on their own. Collect it and compare with their first try.",
      prompt: et.prompt || studio.essential_question,
      frame: wida === "5_6" ? "" : et.frame || "",
    },
  ];
  return {
    unit: detail.unit,
    pathway: PATHWAYS.find((p) => p.id === pathway),
    wida,
    minutes: steps.reduce((n, s) => n + (Number(s.minutes) || 0), 0),
    steps,
  };
}
