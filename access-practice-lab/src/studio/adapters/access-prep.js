// Adapter: Access Prep skill-builder sets (content/prep/<skill>.json, /access-prep/<skill>/<set>). One set becomes its
// texts and every one of its steps, keyed as the skill builder keys them (src/prep/<skill>.js):
//   daily-drill     word pairs -> match; listen-and-build, passage and upgrade sentences -> blank (choices listed)
//   data-talk       chart -> table; questions -> choice; the true-sentence builder -> blank; the data sentence -> open
//   extempore-speak facts -> text; the model check -> choice; turns 1-2 -> blank; turn 3 -> open speaking response
//   notes           the talk -> read-aloud; main idea -> choice, details -> multi (over the note cards); questions ->
//                   choice; "say the main idea" -> open
//   raters-eye      the three responses -> order (strongest first); why it is stronger -> multi; the upgrade -> blank
//   task-words      per prompt: the task word -> choice; the answer checklist -> multi; the complete response -> choice
//   text-structures per passage: how it is organized -> choice; its organizer -> blank
//   word-meanings   words -> vocabulary; which meaning each sentence uses -> sort; questions -> choice; the sentence -> open
// Spanish carried: word glosses, set titles in the teacher note, turn prompts as hints; family talk and teacher tips go
// to the teacher note.

import {
  audioBlocks,
  blankFromParts,
  chartBlocks,
  fitter,
  openQuestion,
  orderQuestion,
  passageBlocks,
  pickQuestion,
  practiceDraft,
  questionBase,
  sortQuestion,
  textBlock,
  vocabItems,
  withSpanish,
} from "./practice-parts.js";
import { list, t, text } from "./util.js";

const BASE = "/access-practice-lab/content/prep";
export const PREP_FILES = Object.freeze([
  "notes",
  "data-talk",
  "raters-eye",
  "word-meanings",
  "text-structures",
  "task-words",
  "daily-drill",
  "extempore-speak",
]);
const REF = /^([a-z-]+)\/([a-z0-9-]+)$/;
const loadStructures = async () => (await import("../../prep/model.js")).STRUCTURES;

/** A blank question from fill-in parts, with the choices for each blank listed in the prompt. */
function blankQ(fit, base, parts) {
  const made = blankFromParts(parts);
  if (!made) return null;
  return {
    ...questionBase(fit, { ...base, prompt: `${text(base.prompt)}\n\n${made.lead}`.trim() }),
    format: "blank",
    bank: false,
    text: fit(made.text, 4000, "Fill-in text"),
  };
}

/** A choice over {id, text} options keyed by `answer`, its `why` as the explanation. */
const choiceQ = (fit, id, q, extra = {}) =>
  pickQuestion(
    fit,
    { id, prompt: q.q, explanation: q.why, ...extra },
    list(q.options).map((o, n) => ({ id: `o${n + 1}`, text: fit(o.text, 400, "Answer choice") })),
    [`o${list(q.options).findIndex((o) => o.id === q.answer) + 1}`],
  );

const BUILD = {
  "daily-drill": (s, fit) => [
    vocabItems(
      [
        ...list(s.pairs).map((p) => ({ term: p.word, def: p.def, es: p.es, example: p.ex })),
        ...list(s.cloze?.hints).map((h) => ({ term: h.word, def: h.tip, es: h.es })),
      ],
      fit,
    ),
    {
      ...questionBase(fit, {
        id: "match",
        prompt: "Match each word to its meaning.",
        skill: "vocabulary",
      }),
      format: "match",
      pairs: list(s.pairs).map((p, n) => ({
        id: `p${n + 1}`,
        left: text(p.word),
        right: fit(p.def, 400, "Meaning"),
      })),
    },
    ...audioBlocks("build", "Listen: the sentence", [s.listenBuild?.sentence]),
    blankQ(
      fit,
      {
        id: "listen",
        prompt: "Listen, then choose the words you hear.",
        hint: withSpanish("", s.listenBuild?.es, 400),
      },
      list(s.listenBuild?.parts),
    ),
    blankQ(fit, { id: "passage", prompt: text(s.cloze?.title) }, list(s.cloze?.parts)),
    textBlock("starter", `Starter sentence (everyday): ${text(s.forge?.starter)}`, "body", fit),
    blankQ(
      fit,
      {
        id: "upgrade",
        prompt: `${text(s.forge?.goal)} Choose the strongest academic clauses.`,
        hint: withSpanish("", s.forge?.goalEs, 400),
        explanation: text(s.forge?.model),
      },
      list(s.forge?.parts),
    ),
  ],
  "data-talk": (s, fit, flags) => [
    textBlock("context", s.context, "directions", fit),
    ...chartBlocks("chart", s.chart, flags),
    textBlock(
      "frames",
      `Sentence frames for data:\n${list(s.frames).map(text).join("\n")}`,
      "body",
      fit,
    ),
    ...list(s.questions).map((q, i) => choiceQ(fit, `q${i + 1}`, q, { skill: "reading data" })),
    blankQ(
      fit,
      { id: "build", prompt: "Choose the words that make this sentence true for the graph." },
      list(s.build?.parts),
    ),
    openQuestion(
      fit,
      {
        id: "write",
        prompt: s.write?.prompt,
        hint: list(s.write?.compareWords).length
          ? `Words you can use: ${s.write.compareWords.map(text).join(", ")}`
          : "",
      },
      { kind: "write", sample: s.write?.model },
    ),
  ],
  "extempore-speak": (s, fit) => {
    const sc = s.scene || {};
    const turn = (tn, id) =>
      blankQ(
        fit,
        {
          id,
          prompt: tn?.prompt,
          hint: withSpanish("", tn?.promptEs, 400),
          explanation: text(tn?.model),
        },
        list(tn?.parts),
      );
    return [
      textBlock(
        "scene",
        [`**${text(sc.heading)}**`, ...list(sc.facts).map((f) => text(f[0]))].join("\n"),
        "body",
        fit,
      ),
      textBlock(
        "model",
        `${text(sc.teacherPrompt)}\n\n${text(sc.modelStudent?.name)}: "${text(sc.modelStudent?.text)}"`,
        "body",
        fit,
      ),
      choiceQ(fit, "check", sc.check || {}, { skill: "speaking" }),
      turn(s.turn1, "turn1"),
      turn(s.turn2, "turn2"),
      openQuestion(
        fit,
        {
          id: "turn3",
          prompt: s.turn3?.prompt,
          hint: withSpanish(
            [list(s.turn3?.words).join(", "), list(s.turn3?.connectors).join(", ")]
              .filter(Boolean)
              .join(" · "),
            s.turn3?.promptEs,
            400,
          ),
          frame: list(s.turn3?.frames).map(text).join(" "),
        },
        { kind: "explain", sample: s.turn3?.model },
      ),
    ];
  },
  notes: (s, fit) => {
    const cards = list(s.cards).map((c) => ({ id: c.id, text: fit(c.text, 400, "Note card") }));
    return [
      vocabItems(
        list(s.keyWords).map((k) => ({ term: k.w, def: k.def, es: k.es })),
        fit,
      ),
      textBlock(
        "signal",
        `Signal words: ${list(s.signal).join(", ")}. When you hear these words, a new idea is coming.`,
        "directions",
        fit,
      ),
      ...audioBlocks("talk", `Listen: ${text(s.speaker)}`, list(s.talk)),
      pickQuestion(
        fit,
        {
          id: "main",
          prompt: "Choose the note for the main idea of the talk.",
          skill: "note-taking",
        },
        cards,
        [s.notes?.main],
      ),
      pickQuestion(
        fit,
        {
          id: "details",
          prompt: "Choose the notes for the details that support the main idea.",
          skill: "note-taking",
        },
        cards,
        list(s.notes?.details),
      ),
      ...list(s.questions).map((q, i) => choiceQ(fit, `q${i + 1}`, q, { skill: "listening" })),
      openQuestion(
        fit,
        { id: "say", prompt: "Say the main idea in your own words to a partner." },
        { kind: "explain", sample: s.say },
      ),
    ];
  },
  "raters-eye": (s, fit) => {
    const byId = new Map(list(s.responses).map((r) => [r.id, r]));
    const best = byId.get(list(s.ranking)[0]);
    return [
      textBlock(
        "task",
        withSpanish(`**${text(s.mode)} task:** ${text(s.prompt)}`, s.promptEs, 4000),
        "directions",
        fit,
      ),
      textBlock(
        "responses",
        list(s.responses)
          .map((r) => `Response ${r.id.toUpperCase()}: ${text(r.text)}`)
          .join("\n\n"),
        "body",
        fit,
      ),
      orderQuestion(
        fit,
        {
          id: "rank",
          prompt: "Put the three responses in order, from strongest to weakest.",
          skill: "rating",
        },
        list(s.ranking).map((id) => ({ id: `r${id}`, text: `Response ${id.toUpperCase()}` })),
      ),
      pickQuestion(
        fit,
        {
          id: "why",
          prompt: `Why is Response ${String(best?.id).toUpperCase()} stronger? Check every true reason.`,
          explanation: list(s.features)
            .map((f) => `"${text(f.text)}": ${text(f.why)}`)
            .join("\n"),
          skill: "rating",
        },
        list(s.features).map((f, n) => ({ id: `f${n + 1}`, text: fit(f.text, 400, "Reason") })),
        list(s.features)
          .map((f, n) => (f.right ? `f${n + 1}` : ""))
          .filter(Boolean),
      ),
      blankQ(
        fit,
        {
          id: "upgrade",
          prompt: `Make Response ${String(s.upgrade?.from).toUpperCase()} stronger. Choose the word or connector that makes each part clearer.`,
          explanation: text(s.upgrade?.model),
        },
        list(s.upgrade?.parts),
      ),
    ];
  },
  "task-words": (s, fit) =>
    list(s.prompts).flatMap((p, i) => {
      const n = i + 1;
      const words = list(p.choices).map((c, k) => ({
        id: `w${k + 1}`,
        text: fit(c, 400, "Choice"),
      }));
      return [
        textBlock(`p${n}`, `**Prompt ${n}:** ${text(p.prompt)}`, "body", fit),
        pickQuestion(
          fit,
          {
            id: `word${n}`,
            prompt: "Spot the action word: which words tell you what to do?",
            explanation: `The task word is ${text(p.taskWord)}.`,
            skill: "task words",
          },
          words,
          [`w${list(p.choices).indexOf(p.taskText) + 1}`],
        ),
        pickQuestion(
          fit,
          {
            id: `needs${n}`,
            prompt: "Build the answer checklist: what does a complete answer need?",
            skill: "task words",
          },
          list(p.needs).map((x, k) => ({
            id: `n${k + 1}`,
            text: fit(x.text, 400, "Checklist line"),
          })),
          list(p.needs)
            .map((x, k) => (x.right ? `n${k + 1}` : ""))
            .filter(Boolean),
        ),
        choiceQ(
          fit,
          `answer${n}`,
          { q: "Choose the complete response.", options: p.answers, answer: p.answer, why: p.why },
          { skill: "task words" },
        ),
      ];
    }),
  "text-structures": (s, fit, _flags, STRUCTURES) =>
    list(s.passages).flatMap((p, i) => {
      const n = i + 1;
      const ids = Object.keys(STRUCTURES);
      const parts = list(p.organizer?.parts).flatMap((part, k) => [
        `${k ? "\n" : ""}${text(part.label)}: `,
        part,
      ]);
      return [
        ...passageBlocks(`text${n}`, p.title, [p.text]),
        pickQuestion(
          fit,
          {
            id: `structure${n}`,
            prompt: "How is this text organized?",
            explanation: `Signal words: ${list(p.signals).join(", ")}.`,
            skill: "text structure",
          },
          ids.map((id) => ({ id: `t-${id}`.slice(0, 32), text: text(STRUCTURES[id].en) })),
          [`t-${p.structure}`.slice(0, 32)],
        ),
        blankQ(
          fit,
          {
            id: `organizer${n}`,
            prompt: `Fill in the organizer for "${text(p.title)}".`,
            skill: "text structure",
          },
          parts,
        ),
      ];
    }),
  "word-meanings": (s, fit) => {
    const labels = { everyday: "Everyday meaning", school: "School meaning" };
    return [
      vocabItems(
        list(s.words).map((w) => ({
          term: w.w,
          def: `School: ${text(w.school?.def)} Everyday: ${text(w.everyday?.def)}`,
          es: text(w.es?.school),
          example: text(w.school?.ex),
        })),
        fit,
      ),
      sortQuestion(
        fit,
        {
          id: "sort",
          prompt: "Read each sentence. Which meaning of the word does it use?",
          skill: "multiple-meaning words",
        },
        [labels.everyday, labels.school],
        list(s.sort).map((x, n) => ({ id: `x${n + 1}`, text: x.s, label: labels[x.meaning] })),
      ),
      ...list(s.questions).map((q, i) =>
        choiceQ(fit, `q${i + 1}`, q, { skill: "multiple-meaning words" }),
      ),
      openQuestion(
        fit,
        {
          id: "write",
          prompt: s.write?.prompt,
          hint: list(s.write?.clues).length ? `Clue words: ${s.write.clues.join(", ")}` : "",
        },
        { kind: "write", sample: s.write?.model },
      ),
    ];
  },
};

async function findSet(skill, setId, fetchJson) {
  const data = await fetchJson(`${BASE}/${skill}.json`);
  for (const [band, sets] of Object.entries(data || {})) {
    const set = list(sets).find((x) => x.id === setId);
    if (set) return { band, set };
  }
  return null;
}

export default {
  family: "access-prep",
  label: t("Access Prep skill builders", "Prácticas de destrezas de Access Prep"),
  note: t(
    "Copies one skill-builder set (its texts, word work and every step) into a draft you can edit.",
    "Copia un conjunto de práctica de destrezas (sus textos, trabajo de palabras y cada paso) en un borrador que puede editar.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "passage",
    "table",
    "audio",
    "vocab",
    "prompts",
    "choices",
    "pairs",
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
        "Tiles, play-the-talk controls and the set's progress",
        "Fichas, controles de audio y el progreso del conjunto",
      ),
      why: t(
        "These belong to the skill builder; the draft keeps every text, choice and key of the set.",
        "Pertenecen a la práctica de destrezas; el borrador conserva cada texto, opción y clave del conjunto.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const rows = [];
    for (const skill of PREP_FILES) {
      const data = await fetchJson(`${BASE}/${skill}.json`);
      for (const [band, sets] of Object.entries(data || {}))
        for (const s of list(sets))
          rows.push({
            id: `${skill}/${s.id}`,
            title: `${text(s.title)} (${skill.replace(/-/g, " ")})`,
            grade: band,
            subject: text(s.area),
            domain: "Access Prep",
            description: `${skill.replace(/-/g, " ")} set for grades ${band}`,
            count: 1,
          });
    }
    return rows;
  },

  url: (ref) => (REF.test(ref) ? `/access-practice-lab/access-prep/${ref}` : ""),

  async extract(ref, { fetchJson }) {
    const m = REF.exec(String(ref));
    if (!m || !PREP_FILES.includes(m[1])) throw new Error("bad-ref");
    const found = await findSet(m[1], m[2], fetchJson);
    if (!found) throw new Error("not-found");
    const { band, set } = found;
    const { fit, overflow } = fitter();
    const flags = new Set();
    const structures = m[1] === "text-structures" ? await loadStructures() : null;
    const blocks = BUILD[m[1]](set, fit, flags, structures);
    const vocab = blocks.find((b) => b?.type === "vocab");
    return {
      activity: practiceDraft(fit, overflow, {
        title: `Access Prep: ${text(set.title)}`,
        description: `${m[1].replace(/-/g, " ")} practice, grades ${band}${set.area ? `, ${text(set.area)}` : ""}.`,
        grade: band,
        subject: text(set.area),
        objective: `Build the ${m[1].replace(/-/g, " ")} skill for listening, reading, speaking and writing tasks.`,
        sourceNote: `Copied from Access Prep set ${ref}.`,
        spanish: Boolean(vocab?.items.some((v) => v.es) || set.titleEs),
        blocks,
        teacher: [
          `Copied from Access Prep ${m[1]} set ${set.id} (grades ${band}): ${text(set.title)}${set.titleEs ? ` / ${text(set.titleEs)}` : ""}. WIDA-aligned original practice, not official ACCESS test material.`,
          set.teacherTip?.en && `Teacher tip: ${text(set.teacherTip.en)}`,
          set.familyTalk?.en &&
            `Family talk: ${text(set.familyTalk.en)} (${text(set.familyTalk.es)})`,
        ],
      }),
      notes: [
        t(
          "Not carried: the skill builder's tiles, replay and speed controls, the hint reveals and the progress saved on this device.",
          "No se conserva: las fichas, los controles de repetición y velocidad, las pistas reveladas ni el progreso guardado en este dispositivo.",
        ),
        ...(flags.has("table-as-text")
          ? [
              t(
                "A chart too wide for a table block is written out as text.",
                "Un gráfico demasiado ancho para una tabla aparece como texto.",
              ),
            ]
          : []),
      ],
      source: set,
      url: `/access-practice-lab/access-prep/${ref}`,
      sourceTitle: text(set.title),
    };
  },
};
