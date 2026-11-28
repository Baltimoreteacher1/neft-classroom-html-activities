// Adapter: Language Quest missions (content/quest/missions/<id>.json, listed in content/quest/index.json; 17 missions).
// A mission becomes its vocabulary, its reading sources, and the items the activity model can hold as authored: listening
// and reading checks (choice, with the radio script as read-aloud and transcript, and any chart as a table), card sorts,
// timelines (order), and the writing and speaking tasks as open responses with their frame, model and checklist. Item
// kinds that are interactive scenes (forge, explore, compare, choose, ask, route, story, simulate) are named in the
// teacher notes, not imitated.

import { listenBlocks } from "./listen-blocks.js";
import { matchQuestions, openQuestion, vocabBlock } from "./vocab-parts.js";
import { list, noteBlocks, t, tableBlocks, text } from "./util.js";

const BASE = "/access-practice-lab/content/quest";
const REF = /^[a-z0-9][a-z0-9-]{0,63}$/;
const urlFor = (id) => `/access-practice-lab/quest/mission/${id}`;
const bi = (v) => (v && typeof v === "object" ? text(v.en) : text(v));
const idOf = (raw) =>
  text(raw)
    .replace(/[^a-z0-9_-]/gi, "-")
    .slice(0, 32);

function checkItem(it, flags) {
  const options = list(it.options).map((o) => ({ id: idOf(o.id), text: text(o.label) }));
  const pre = [];
  if (text(it.say))
    pre.push(...listenBlocks(idOf(it.id), "Listen", [text(it.transcript) || text(it.say)]));
  if (it.chart) {
    const c = it.chart;
    pre.push(
      ...tableBlocks(
        `ch-${idOf(it.id)}`.slice(0, 32),
        text(c.title),
        ["Item", text(c.unit) ? `Value (${text(c.unit)})` : "Value"],
        list(c.rows).map((r) => [text(r.label), String(r.value ?? "")]),
        flags,
      ),
    );
  }
  const why = list(it.options)
    .filter((o) => o.id !== it.answer && text(o.fb))
    .map((o) => `${text(o.label)}: ${text(o.fb)}`);
  return [
    ...pre,
    {
      type: "question",
      id: idOf(it.id),
      format: "choice",
      prompt: text(it.prompt),
      options,
      answer: idOf(it.answer),
      explanation: [text(it.why), ...why].filter(Boolean).join("\n").slice(0, 800),
      skill: "comprehension",
    },
  ];
}

function sortItem(it) {
  const cats = list(it.categories).map((c) => ({ id: idOf(c.id), label: text(c.label) }));
  return {
    type: "question",
    id: idOf(it.id),
    format: "sort",
    prompt: text(it.prompt),
    categories: cats,
    items: list(it.cards).map((c) => ({
      id: idOf(c.id),
      text: text(c.text),
      category: idOf(c.cat),
    })),
    explanation: list(it.cards)
      .map((c) => `${text(c.text)} ${text(c.why)}`)
      .join("\n")
      .slice(0, 800),
  };
}

function timelineItem(it) {
  const events = [...list(it.events)].sort((a, b) => a.order - b.order);
  return {
    type: "question",
    id: idOf(it.id),
    format: "order",
    prompt: text(it.prompt).replace(/\s*Use the up and down buttons\.?/i, ""),
    items: events.map((e) => ({ id: idOf(e.id), text: text(e.text) })),
    explanation: events
      .map((e) => `${e.order}. ${text(e.text)}`)
      .join(" ")
      .slice(0, 800),
  };
}

function openItem(it) {
  const ladder = it.ladder || {};
  const model = text(ladder.model).replace(/^Model:\s*/i, "");
  return openQuestion({
    id: idOf(it.id),
    prompt: [text(it.prompt), text(it.purpose)].filter(Boolean).join(" "),
    kind: it.kind === "write" ? "write" : "explain",
    frame: text(ladder.frame),
    hint: text(ladder.cue),
    rubric: list(it.kind === "write" ? it.checks : it.selfChecks)
      .map((c) => text(c.label))
      .slice(0, 6),
    sample: model,
  });
}

function readItem(it) {
  return list(it.sources).map((s, i) => ({
    type: "passage",
    id: `${idOf(it.id)}-${i + 1}`.slice(0, 32),
    title: text(s.title),
    text: list(s.text).map(text).join("\n\n"),
  }));
}

/** The blocks of every item the model can hold, plus the names of the items it cannot. */
export function itemBlocks(mission, flags = new Set()) {
  const blocks = [];
  const skipped = [];
  for (const stage of list(mission.stages))
    for (const it of list(stage.items)) {
      if (it.kind === "read") {
        blocks.push({
          type: "text",
          id: `d-${idOf(it.id)}`.slice(0, 32),
          role: "body",
          text: text(it.prompt),
        });
        blocks.push(...readItem(it));
      } else if (it.kind === "check") blocks.push(...checkItem(it, flags));
      else if (it.kind === "sort") blocks.push(sortItem(it));
      else if (it.kind === "timeline") blocks.push(timelineItem(it));
      else if (it.kind === "write" || it.kind === "speak") blocks.push(openItem(it));
      else skipped.push(`${text(stage.title)}: ${it.kind} (${text(it.prompt).slice(0, 160)})`);
    }
  return { blocks, skipped };
}

async function missionIds(fetchJson) {
  const idx = await fetchJson(`${BASE}/index.json`);
  return list(idx?.missions).map((m) => m.id);
}

export default {
  family: "quest-missions",
  label: t("Language Quest missions", "Misiones de Language Quest"),
  note: t(
    "Copies a quest mission's vocabulary, readings, checks, sorts and timelines with their keys, and its writing and speaking tasks with frames and models.",
    "Copia el vocabulario, las lecturas, las revisiones, clasificaciones y líneas de tiempo con su clave, y las tareas de escribir y hablar con marcos y modelos de una misión.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "vocab",
    "passage",
    "table",
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
        "Interactive scenes and the story stage",
        "Escenas interactivas y el escenario del cuento",
      ),
      why: t(
        "Builders, maps, simulations and character conversations run on the Quest engine; the copy lists them in the teacher notes.",
        "Los constructores, mapas, simulaciones y conversaciones con personajes funcionan en el motor de Quest; la copia los nombra en las notas para docentes.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const idx = await fetchJson(`${BASE}/index.json`);
    const out = [];
    for (const m of list(idx?.missions)) {
      const full = await fetchJson(`${BASE}/missions/${m.id}.json`).catch(() => null);
      if (!full) continue;
      out.push({
        id: m.id,
        title: bi(m.title),
        grade: text(m.band),
        subject: "",
        domain: "Quest",
        description: bi(m.objective) || text(m.world),
        count: itemBlocks(full).blocks.filter((b) => b.type === "question").length,
      });
    }
    return out;
  },

  url: urlFor,

  async extract(ref, { fetchJson }) {
    if (!REF.test(ref) || !(await missionIds(fetchJson)).includes(ref)) throw new Error("bad-ref");
    const m = await fetchJson(`${BASE}/missions/${ref}.json`);
    if (!m || m.id !== ref || !Array.isArray(m.stages)) throw new Error("bad-source");
    const flags = new Set();
    const vocab = list(m.vocab)
      .filter((v) => text(v.term) && text(v.def))
      .map((v) => ({ term: text(v.term), def: text(v.def), es: text(v.es), example: "" }));
    const fitted = vocabBlock(vocab);
    const { blocks, skipped } = itemBlocks(m, flags);
    const title = bi(m.title);
    const lines = [
      `Copied from Language Quest mission ${m.id} (${text(m.world)}, grades ${text(m.band)}, about ${m.minutes} minutes). Spanish title: ${text(m.title?.es)}.`,
      text(m.narrative) && `Story: ${text(m.narrative)}`,
      ...list(m.success).map((s) => `Success: ${bi(s)}`),
      ...skipped.map((s) => `Not copied (Quest engine item) ${s}`),
      ...fitted.extra,
    ].filter(Boolean);
    return {
      activity: {
        title: `Quest: ${title}`.slice(0, 120),
        description: bi(m.objective).slice(0, 400),
        kind: "interactive",
        template: "explore-practice",
        context: {
          grade: text(m.band),
          subject: "",
          curriculum: "Language Quest",
          objective: bi(m.objective).slice(0, 400),
          standards: [],
          source: { origin: "teacher", note: `Copied from Language Quest mission ${m.id}.` },
        },
        supports: {
          wida: 0,
          hints: true,
          frames: true,
          spanish: vocab.length > 0 && vocab.every((v) => v.es),
          readAloud: blocks.some((b) => b.type === "audio"),
          visuals: false,
          chunk: false,
        },
        options: { shuffle: false, revise: true, answerKey: true },
        blocks: [
          ...(vocab.length ? [fitted.block, ...matchQuestions(vocab)] : []),
          ...blocks,
          ...noteBlocks("quest", lines),
        ],
        notes: { teacher: "", misconceptions: [] },
      },
      notes: [
        t(
          "Not carried: interactive scene items (builders, maps, simulations, character conversations, choices), endings, the support ladder beyond one frame and model, and the family page. Scene items are named in the teacher notes.",
          "No se conserva: las escenas interactivas (constructores, mapas, simulaciones, conversaciones con personajes, decisiones), los finales, la escalera de apoyos más allá de un marco y un modelo, ni la página familiar. Las escenas se nombran en las notas para docentes.",
        ),
        ...(flags.has("table-as-text")
          ? [
              t(
                "A chart was too large for a table block and is shown as text lines.",
                "Un gráfico era demasiado grande para un bloque de tabla y aparece como líneas de texto.",
              ),
            ]
          : []),
      ],
      source: m,
      url: urlFor(ref),
      sourceTitle: title,
    };
  },
};
