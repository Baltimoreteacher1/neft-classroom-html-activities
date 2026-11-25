// Adapter: Reading Room lessons (content/reading-room/lessons.json). A lesson becomes its reading (paragraphs numbered the
// way the questions refer to them), vocabulary, any table, and every authored question: nothing in `activities` is
// dropped, and the lesson's "connect it to your life" prompt becomes one extra open question.
//   choice, connector, hotText -> choice (multi when the key has two answers)      multi -> multi
//   evidence -> choice/multi over "Paragraph N"      order -> order      sort -> sort      cloze -> blank      short -> short

import { list, noteBlocks, shorten, t, tableBlocks, text } from "./util.js";
import { vocabBlock } from "./vocab-parts.js";

const FILE = "/access-practice-lab/content/reading-room/lessons.json";
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/i;
const NOTE_MAX = 2000;
const EXPLAIN_MAX = 800;
const RUBRIC_MAX = 6;

const qid = (a, i) => `q${i + 1}-${text(a.id)}`.slice(0, 32);
const optionsOf = (choices) => list(choices).map((c) => ({ id: c.id, text: text(c.text) }));

function whyNot(choices, answers) {
  const lines = list(choices)
    .filter((c) => c.why && !answers.includes(c.id))
    .map((c) => `"${text(c.text)}": ${text(c.why)}`);
  return lines.length ? `Why the other choices are not correct:\n${lines.join("\n")}` : "";
}

function evidenceLine(a, paragraphs) {
  const nums = list(a.evidenceIds)
    .map((id) => paragraphs.findIndex((p) => p.id === id) + 1)
    .filter((n) => n > 0);
  return nums.length ? `Evidence: paragraph ${nums.join(", ")}.` : "";
}

/** The explanation shown after answering: rationale, evidence pointer, wrong-choice reasons; the overflow goes to a note. */
function explain(a, paragraphs, reasons, support, number) {
  const full = [text(a.rationale), evidenceLine(a, paragraphs), reasons]
    .filter(Boolean)
    .join("\n\n");
  if (full.length <= EXPLAIN_MAX) return full;
  support.push(`Question ${number}, full explanation:\n${full}`);
  return text(a.rationale).slice(0, EXPLAIN_MAX);
}

function pick(a, options, answers) {
  return answers.length > 1
    ? { format: "multi", options, answers: [...answers] }
    : { format: "choice", options, answer: answers[0] };
}

const BUILD = {
  choice: (a) => pick(a, optionsOf(a.choices), list(a.answerId ? [a.answerId] : a.answerIds)),
  connector: (a) => ({
    ...pick(a, optionsOf(a.choices), [a.answerId]),
    prompt: `${text(a.prompt)}\n\n${text(a.sentence)}`,
  }),
  hotText: (a) => pick(a, optionsOf(a.choices), list(a.answerIds)),
  multi: (a) => ({ format: "multi", options: optionsOf(a.choices), answers: list(a.answerIds) }),
  evidence: (a, ctx) =>
    pick(
      a,
      list(a.paragraphIds).map((id) => ({
        id,
        text: `Paragraph ${ctx.paragraphs.findIndex((p) => p.id === id) + 1}`,
      })),
      list(a.answerIds),
    ),
  order: (a) => ({
    format: "order",
    items: list(a.answerOrder).map((id) => ({
      id,
      text: text(list(a.items).find((i) => i.id === id)?.text),
    })),
  }),
  sort: (a) => {
    const categories = list(a.categories).map((label, n) => ({
      id: `c${n + 1}`,
      label: text(label),
    }));
    return {
      format: "sort",
      categories,
      items: list(a.items).map((i) => ({
        id: i.id,
        text: text(i.text),
        category: categories.find((c) => c.label === text(i.answer))?.id ?? "",
      })),
    };
  },
  cloze: (a) => {
    const blanks = list(a.segments).filter((s) => s.blank);
    const same = blanks.every(
      (s) => s.blank.options.join("\u0001") === blanks[0].blank.options.join("\u0001"),
    );
    let n = 0;
    return {
      format: "blank",
      bank: false,
      text: list(a.segments)
        .map((s) => (s.blank ? `[[${text(s.blank.answer)}]]` : String(s.text ?? "")))
        .join(""),
      lead: same
        ? `Choose from: ${blanks[0].blank.options.join(", ")}.`
        : blanks.map((s) => `Blank ${++n}: ${s.blank.options.join(", ")}.`).join("\n"),
    };
  },
  short: (a) => ({ format: "short", kind: "explain", sample: text(a.model) }),
};

/** The lesson's connect-it prompt becomes an extra question unless an authored question already asks exactly that. */
export const extraPrompt = (lesson) => {
  const tp = text(lesson.transferPrompt);
  return tp && !list(lesson.activities).some((a) => text(a.prompt) === tp) ? tp : "";
};

export const READING_ROOM_TYPES = Object.freeze(Object.keys(BUILD));

function questionFor(a, i, paragraphs) {
  const build = BUILD[a.type];
  if (!build) throw new Error(`unsupported-activity-type:${a.type}`);
  const support = [];
  const core = build(a, { paragraphs });
  const { lead, prompt: own, ...fields } = core;
  const reasons = a.choices ? whyNot(a.choices, list(a.answerId ? [a.answerId] : a.answerIds)) : "";
  const question = {
    type: "question",
    id: qid(a, i),
    prompt: own || [text(a.prompt), lead].filter(Boolean).join("\n\n"),
    hint: text(a.hint),
    frame: text(a.frame),
    skill: text(a.skill).slice(0, 80),
    explanation: a.type === "short" ? "" : explain(a, paragraphs, reasons, support, i + 1),
    ...fields,
  };
  if (a.type === "short") {
    const marks = [...list(a.lookFor), ...list(a.rubric)].map(text).filter(Boolean);
    question.rubric = marks.slice(0, RUBRIC_MAX);
    if (marks.length > RUBRIC_MAX)
      support.push(
        `Question ${i + 1}, more self-check lines:\n${marks.slice(RUBRIC_MAX).join("\n")}`,
      );
    if (a.rationale)
      support.push(`Question ${i + 1}, what a strong answer does: ${text(a.rationale)}`);
  }
  return { question, support };
}

function contentBlocks(lesson, flags) {
  const paragraphs = list(lesson.paragraphs);
  const before = lesson.beforeReading || {};
  const intro = [
    before.essentialQuestion && `Essential question: ${text(before.essentialQuestion)}`,
    before.background && `Think first: ${text(before.background)}`,
    before.hook && `Imagine: ${text(before.hook)}`,
    before.purpose && `Reading purpose: ${text(before.purpose)}`,
  ].filter(Boolean);
  const guiding = paragraphs
    .map((p, n) => p.guidingQuestion && `Paragraph ${n + 1}: ${text(p.guidingQuestion)}`)
    .filter(Boolean);
  const vocab = vocabBlock(
    list(lesson.vocabulary).map((v) => ({ term: text(v.term), def: text(v.definition), es: text(v.spanish), example: text(v.example) })),
  );
  const blocks = [];
  if (intro.length)
    blocks.push({
      type: "text",
      id: "before",
      role: "directions",
      text: `**Before you read**\n\n${intro.join("\n")}`,
    });
  if (vocab.block.items.length) blocks.push(vocab.block, ...noteBlocks("vocab", vocab.extra));
  blocks.push({
    type: "passage",
    id: "reading",
    title: text(lesson.title),
    text: paragraphs.map((p, n) => `(${n + 1}) ${text(p.text)}`).join("\n\n"),
  });
  if (guiding.length)
    blocks.push({
      type: "text",
      id: "guiding",
      role: "body",
      text: `**Think while you read**\n\n${guiding.join("\n")}`,
    });
  for (const key of ["table", "schedule"]) {
    const tb = lesson[key];
    if (tb?.headers && tb?.rows)
      blocks.push(...tableBlocks(key, text(tb.caption), tb.headers.map(text), tb.rows.map((r) => r.map(text)), flags));
  }
  if (lesson.map?.items)
    blocks.push(
      ...tableBlocks("map", text(lesson.map.caption), ["Place", "Symbol"], lesson.map.items.map((i) => [text(i.label), text(i.symbol)]), flags),
    );
  return blocks;
}

function teacherNote(lesson) {
  const g = lesson.teacherGuide || {};
  const e = lesson.editorial || {};
  const c = lesson.connections || {};
  const lines = [
    `Copied from the Reading Room lesson ${lesson.id} (about ${lesson.minutes} minutes). WIDA-aligned original practice; not official WIDA or ACCESS material.`,
    `Review status: ${text(e.status) || "unknown"}. ${text(e.humanReview)}`.trim(),
    lesson.alignmentStatus && `Alignment: ${text(lesson.alignmentStatus)}`,
    lesson.subject && `Subject: ${text(lesson.subject)}. Genre: ${text(lesson.genre)}.`,
    lesson.languageFunction &&
      `Language function: ${text(lesson.languageFunction)} Features: ${list(lesson.languageFeatures).map(text).join("; ")}.`,
    g.languageObjective && `Language objective: ${text(g.languageObjective)}`,
    g.miniLesson && `Mini-lesson: ${text(g.miniLesson)}`,
    list(g.discussion).length && `Discussion: ${list(g.discussion).map(text).join(" | ")}`,
    (c.write || c.speak || c.listen) &&
      `Connections. Write: ${text(c.write)} Speak: ${text(c.speak)} Listen: ${text(c.listen)}`,
    e.factCheck && `Fact check: ${text(e.factCheck)}`,
    lesson.table?.description && `Table description: ${text(lesson.table.description)}`,
    lesson.map?.description && `Map description: ${text(lesson.map.description)}`,
  ].filter(Boolean);
  const kept = [];
  let size = 0;
  for (const line of lines) {
    if (size + line.length + 1 > NOTE_MAX) break;
    kept.push(line);
    size += line.length + 1;
  }
  return { teacher: kept.join("\n"), dropped: lines.length - kept.length };
}

export default {
  family: "reading-room",
  label: t("Reading Room lessons", "Lecciones de la Sala de Lectura"),
  note: t(
    "Copies a Reading Room lesson so you can edit the reading, vocabulary and every question, change hints and sentence frames, and add your own. The original lesson is never changed.",
    "Copia una lección de la Sala de Lectura para que pueda editar la lectura, el vocabulario y cada pregunta, cambiar las pistas y los marcos de oraciones, y agregar las suyas. La lección original nunca cambia.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "vocab",
    "passage",
    "table",
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
        "Reading-room page layout, reading log and progress",
        "Diseño de la página, registro de lectura y progreso de la Sala de Lectura",
      ),
      why: t(
        "These belong to the Reading Room itself and stay there; the copy is a standalone activity.",
        "Pertenecen a la propia Sala de Lectura y se quedan allí; la copia es una actividad independiente.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const file = await fetchJson(FILE);
    return list(file.lessons).map((l) => ({
      id: l.id,
      title: l.title,
      grade: text(l.gradeCluster),
      subject: text(l.subject),
      domain: "Reading",
      description: text(l.summary),
      count: list(l.activities).length + (extraPrompt(l) ? 1 : 0),
    }));
  },

  url: (ref) => `/access-practice-lab/reading-room/${ref}`,

  async extract(ref, { fetchJson }) {
    if (!ID.test(String(ref))) throw new Error("bad-ref");
    const file = await fetchJson(FILE);
    const lesson = list(file?.lessons).find((l) => l.id === ref);
    if (!lesson) throw new Error("bad-source");
    const paragraphs = list(lesson.paragraphs);
    const made = list(lesson.activities).map((a, i) => questionFor(a, i, paragraphs));
    const flags = new Set();
    const blocks = [...contentBlocks(lesson, flags)];
    made.forEach(({ question, support }) =>
      blocks.push(...noteBlocks(question.id, support), question),
    );
    if (extraPrompt(lesson))
      blocks.push({
        type: "question",
        id: "connect",
        format: "short",
        kind: "write",
        prompt: extraPrompt(lesson),
      });
    const note = teacherNote(lesson);
    const objective = [lesson.objectives?.content, lesson.objectives?.language]
      .map(text)
      .filter(Boolean)
      .join(" ");
    return {
      activity: {
        title: text(lesson.title),
        description: text(lesson.summary),
        kind: "interactive",
        template: "interactive-reading",
        context: {
          grade: text(lesson.gradeCluster),
          subject: text(lesson.subject).length <= 40 ? text(lesson.subject) : "",
          curriculum: "Reading Room (WIDA-aligned original practice)",
          objective: objective.slice(0, 400),
          standards: [],
          source: {
            origin: "teacher",
            note: `Copied from Reading Room lesson ${lesson.id}. WIDA-aligned original practice.`,
          },
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
        options: { shuffle: false, revise: true, answerKey: true },
        blocks,
        notes: {
          teacher: note.teacher,
          misconceptions: lesson.teacherGuide?.misconception
            ? [shorten(lesson.teacherGuide.misconception, 300)]
            : [],
        },
      },
      notes: [
        t(
          "Not carried: the family support page, reading-path and support-level labels, text-complexity notes, and the order of the first, second and third question phases (questions stay in their authored order).",
          "No se conserva: la página de apoyo familiar, las etiquetas de ruta de lectura y nivel de apoyo, las notas de complejidad del texto, ni las fases de preguntas primera, segunda y tercera (las preguntas conservan su orden original).",
        ),
        t(
          "Paragraphs are numbered in the reading so questions that say paragraph 2 can be followed. Each paragraph's thinking question is in a Think while you read block.",
          "Los párrafos están numerados en la lectura para poder seguir las preguntas que mencionan el párrafo 2. La pregunta de reflexión de cada párrafo está en un bloque Piense mientras lee.",
        ),
        t(
          "Evidence questions list paragraph numbers as the choices.",
          "Las preguntas de evidencia muestran los números de párrafo como opciones.",
        ),
        ...(flags.has("table-as-text")
          ? [
              t(
                "A table with long cells is shown as lines of text (one line per row) because table cells hold at most 80 characters.",
                "Una tabla con celdas largas se muestra como líneas de texto (una línea por fila) porque las celdas de una tabla admiten como máximo 80 caracteres.",
              ),
            ]
          : []),
        ...(note.dropped
          ? [
              t(
                "Some background lines did not fit in the teacher notes and were left out.",
                "Algunas líneas de contexto no cabían en las notas para docentes y se omitieron.",
              ),
            ]
          : []),
      ],
      source: lesson,
      url: `/access-practice-lab/reading-room/${lesson.id}`,
      sourceTitle: lesson.title,
    };
  },
};
