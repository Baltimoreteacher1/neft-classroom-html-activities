// Adapter: Academic Missions (content/missions/<id>.json, 9 missions; the list comes from content/index.json studio.missions).
// A mission becomes its briefing, every source (dispatch audio as a read-aloud script with transcript, reports as
// passages, tables and charts as tables), its vocabulary with Spanish, and every phase task as written: questions with
// their keys and explanations, evidence picks (the statements the file marks as supporting), and the speaking and writing
// tasks as open responses with their frames, model and success criteria. The decision point has no right answer, so it is
// carried as a teacher note, never as a graded question.

import { listenBlocks } from "./listen-blocks.js";
import { matchQuestions, openQuestion, vocabBlock } from "./vocab-parts.js";
import { list, noteBlocks, packLines, t, tableBlocks, text } from "./util.js";

const BASE = "/access-practice-lab/content";
const REF = /^[a-z0-9][a-z0-9-]{0,63}$/;
const urlFor = (id) => `/access-practice-lab/missions/${id}`;

async function missionIds(fetchJson) {
  const index = await fetchJson(`${BASE}/index.json`);
  return list(index?.studio?.missions)
    .map((m) => (typeof m === "string" ? m : m?.id))
    .filter(Boolean);
}

function sourceBlocks(key, s, flags) {
  const title = text(s.title);
  if (s.kind === "audio") {
    const lines = list(s.turns).map((tn) => `${text(tn.speaker)}: ${text(tn.text)}`);
    return listenBlocks(key, title, packLines(lines, 600, "\n"));
  }
  if (s.kind === "passage")
    return [
      {
        type: "passage",
        id: `src-${key}`.slice(0, 32),
        title,
        text: (Array.isArray(s.text) ? s.text : [s.text]).map(text).join("\n\n"),
      },
    ];
  if (s.kind === "table") {
    const tb = s.table || {};
    const rows = list(tb.rows).map((r) => list(r).map((c) => text(c)));
    return tableBlocks(
      `src-${key}`.slice(0, 32),
      [title, text(tb.caption)].filter(Boolean).join(": "), list(tb.headers).map(text), rows, flags);
  }
  if (s.kind === "chart") {
    const c = s.chart || {};
    const unit = text(c.unit);
    const rows = list(c.data).map((d) => [text(d.label), String(d.value ?? "")]);
    return tableBlocks(
      `src-${key}`.slice(0, 32),
      [title, text(c.title) !== title ? text(c.title) : ""].filter(Boolean).join(": "),
      [text(c.xLabel) || "Item", unit ? `Value (${unit})` : "Value"],
      rows,
      flags,
    );
  }
  return [];
}

const idOf = (raw) =>
  text(raw)
    .replace(/[^a-z0-9_-]/gi, "-")
    .slice(0, 32);

function choiceTask(task) {
  const options = list(task.options).map((o, i) => ({
    id: idOf(o.id) || `o${i + 1}`,
    text: text(o.text),
  }));
  return {
    type: "question",
    id: idOf(task.id),
    format: "choice",
    prompt: text(task.q),
    options,
    answer: idOf(task.answer),
    explanation: text(task.explain),
    skill: text(task.skill).slice(0, 80),
  };
}

function evidenceTask(task) {
  const pool = list(task.pool);
  const options = pool.map((o, i) => ({ id: `o${i + 1}`, text: text(o.text) }));
  return {
    type: "question",
    id: idOf(task.id),
    format: "multi",
    prompt: text(task.q),
    options,
    answers: pool.map((o, i) => (o.supports === true ? `o${i + 1}` : "")).filter(Boolean),
    explanation: text(task.explain),
    skill: "evidence",
  };
}

function openTask(task) {
  const tk = task.task || {};
  const guided = tk.stages?.guided || {};
  const prompt = [text(tk.scenario), text(tk.prompt)].filter(Boolean).join(" ");
  const frames = list(guided.frames).map(text).filter(Boolean);
  return openQuestion({
    id: idOf(task.id),
    prompt: `${text(tk.title)}: ${prompt}`.slice(0, 4000),
    kind: task.kind === "write" ? "write" : "explain",
    frame: frames.join(" ").slice(0, 300),
    rubric: list(tk.successCriteria).slice(0, 6),
    sample: guided.model,
  });
}

function teacherLines(m) {
  const lines = [
    `Copied from the Academic Mission "${text(m.title)}" (${text(m.subtitle)}, grades ${text(m.band)}, about ${m.minutes} minutes). Role: ${text(m.role)}.`,
  ];
  for (const p of list(m.phases)) {
    if (p.decision) {
      lines.push(`Decision point (${text(p.title)}): ${text(p.decision.q)}`);
      for (const o of list(p.decision.options))
        lines.push(`- ${text(o.text)}: ${text(o.consequence)}`);
    }
    for (const task of list(p.tasks)) {
      const tk = task.task;
      if (!tk) continue;
      const frames = list(tk.stages?.guided?.frames).map(text).join(" ");
      if (frames.length > 300) lines.push(`Frames for "${text(tk.title)}": ${frames}`);
      if (tk.teacher) {
        const t2 = tk.teacher;
        const look = [...list(t2.listenFor), ...list(t2.lookFor)].map(text);
        if (look.length)
          lines.push(`Look and listen for in "${text(tk.title)}": ${look.join("; ")}`);
        if (list(t2.commonIssues).length)
          lines.push(`Common issues: ${list(t2.commonIssues).map(text).join("; ")}`);
        if (text(t2.followUp)) lines.push(`Follow-up question: ${text(t2.followUp)}`);
      }
    }
  }
  for (const q of list(m.debrief?.teacherQuestions)) lines.push(`Debrief question: ${text(q)}`);
  return lines;
}

/** Every block a mission produces; exported for the adapter test's independent question count. */
export function taskQuestions(m) {
  return list(m.phases).flatMap((p) =>
    list(p.tasks).flatMap((task) => {
      if (task.kind === "question") return [choiceTask(task)];
      if (task.kind === "evidence") return [evidenceTask(task)];
      if (task.kind === "speak" || task.kind === "write") return [openTask(task)];
      return [];
    }),
  );
}

export default {
  family: "missions",
  label: t("Academic Missions", "Misiones académicas"),
  note: t(
    "Copies a mission's sources, vocabulary and every task: questions with keys, evidence picks, and the speaking and writing tasks with frames and a model.",
    "Copia las fuentes, el vocabulario y cada tarea de una misión: preguntas con clave, selección de evidencia y las tareas de hablar y escribir con marcos y un modelo.",
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
        "The decision point and the evidence board",
        "El punto de decisión y el tablero de evidencia",
      ),
      why: t(
        "In the mission a choice unlocks a different source and changes later prompts; a copy is one fixed path, so the choices and their results are in the teacher notes.",
        "En la misión una decisión abre otra fuente y cambia las consignas siguientes; una copia es un solo camino, por eso las opciones y sus resultados están en las notas para docentes.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const ids = await missionIds(fetchJson);
    const out = [];
    for (const id of ids) {
      const m = await fetchJson(`${BASE}/missions/${id}.json`).catch(() => null);
      if (!m) continue;
      out.push({
        id,
        title: text(m.title),
        grade: text(m.band),
        subject: text(m.contentArea),
        domain: "Missions",
        description: text(m.subtitle),
        count: taskQuestions(m).length,
      });
    }
    return out;
  },

  url: urlFor,

  async extract(ref, { fetchJson }) {
    if (!REF.test(ref) || !(await missionIds(fetchJson)).includes(ref)) throw new Error("bad-ref");
    const m = await fetchJson(`${BASE}/missions/${ref}.json`);
    if (!m || m.id !== ref || !Array.isArray(m.phases)) throw new Error("bad-source");
    const flags = new Set();
    const vocab = list(m.vocab)
      .filter((v) => text(v.term) && text(v.def))
      .map((v) => ({ term: text(v.term), def: text(v.def), es: text(v.es), example: "" }));
    const fitted = vocabBlock(vocab);
    const briefing = [text(m.briefing?.scene), text(m.briefing?.goal)].filter(Boolean).join("\n\n");
    const blocks = [
      { type: "text", id: "briefing", role: "body", text: briefing || text(m.summary) },
      fitted.block,
      ...matchQuestions(vocab),
      ...Object.entries(m.sources || {}).flatMap(([key, s]) => sourceBlocks(idOf(key), s, flags)),
      ...taskQuestions(m),
      ...noteBlocks("mission", [...teacherLines(m), ...fitted.extra]),
    ];
    return {
      activity: {
        title: `Mission: ${text(m.title)}`.slice(0, 120),
        description: text(m.summary).slice(0, 400),
        kind: "interactive",
        template: "explore-practice",
        context: {
          grade: text(m.band),
          subject: text(m.contentArea),
          curriculum: "Academic Missions",
          objective: text(m.briefing?.goal).slice(0, 400),
          standards: [],
          source: { origin: "teacher", note: `Copied from Academic Mission ${m.id}.` },
        },
        supports: {
          wida: 0,
          hints: false,
          frames: true,
          spanish: vocab.some((v) => v.es),
          readAloud: true,
          visuals: false,
          chunk: false,
        },
        options: { shuffle: false, revise: true, answerKey: true },
        blocks,
        notes: { teacher: "", misconceptions: [] },
      },
      notes: [
        t(
          "Not carried: the branching decision (its options and results are in the teacher notes), the evidence board, the sources inside each speaking and writing task, the transfer-task sources, and the per-choice prompt changes.",
          "No se conserva: la decisión con ramas (sus opciones y resultados están en las notas para docentes), el tablero de evidencia, las fuentes dentro de cada tarea de hablar y escribir, las fuentes de la tarea de transferencia y los cambios de consigna según la decisión.",
        ),
        t(
          "The Spanish vocabulary glosses come from the mission and have not been reviewed by a native speaker.",
          "Las glosas en español del vocabulario provienen de la misión y no han sido revisadas por un hablante nativo.",
        ),
        ...(flags.has("table-as-text")
          ? [
              t(
                "A table was too large for a table block and is shown as text lines.",
                "Una tabla era demasiado grande para un bloque de tabla y aparece como líneas de texto.",
              ),
            ]
          : []),
      ],
      source: m,
      url: urlFor(ref),
      sourceTitle: text(m.title),
    };
  },
};
