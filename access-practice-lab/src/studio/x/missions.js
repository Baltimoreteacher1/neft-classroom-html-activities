// Missions: ONE `lp-activity/1` with staged sections (briefing, see it, investigate, collect evidence, practice,
// speak or write, check your work, revise, reflect), compiled from the teacher's own topic, objective and source.
//
//   missionTypes()                      the seven mission types with plain purposes
//   missionNeeds(typeId)                what each stage needs from the source (for the builder's second step)
//   readMissionSource(source)           { vocab, passage, questions, visuals, rejected } from an activity / ingest result / parts
//   buildMission(input, deps)           { ok, activity|null, stages[], review[] }
//   missionPackage(activity)            { parts, review } in the shape x/package.js buildPackage expects
//   missionPackageParts(activity)       the part list: interactive + printable companion + teacher notes
//
// input: { type, topic, objective?, question?, task?, rubric? (success points students read; a question's own rubric stays teacher-only), reflection?, source?, support?: "light"|"guided"|"full",
//          lang?, grade?, subject? }. Only existing block types and question formats are used. A stage the source cannot
// fill is OMITTED and listed in review[]; no stage is ever filled with generic text. No timers, no scores, no branching
// (no question format sends a student somewhere else). The player shows content before a question together with it,
// so stages appear as headed groups in that flow and students move forward step by step (the Look back panel keeps
// earlier passages, words, pictures and tables reachable).
//
// deps: { newId?: () => string } for the activity id (tests pass a fixed one).

import { marksOf } from "../core/check.js";
import { convertActivity } from "../core/convert.js";
import { newActivityId, pair } from "../core/differentiate-util.js";
import { LIMITS, cleanBlock, normalizeActivity, questionsOf } from "../core/schema.js";
import { validateActivity } from "../core/validate.js";
import { pick } from "./components-kit.js";
import { buildActivityFromIngest } from "./ingest-build.js";
import { applyRequested, reviewFromValidation } from "./intent-build.js";
import {
  MISSION_IDS,
  PLANS,
  STAGES,
  STAGE_CAP,
  STAGE_LABEL,
  STAGE_NEEDS,
  stageOfQuestion,
} from "./missions-stages.js";

export { MISSION_IDS, STAGES };
/** The bilingual label of a stage id. */
export const stageLabel = (id) => STAGE_LABEL[id];

const SUPPORT = {
  light: { wida: 0, supports: [] },
  guided: { wida: 3, supports: ["frames"] },
  full: { wida: 1, supports: ["frames", "readAloud", "chunk", "visuals"] },
};
const VISUAL_TYPES = new Set(["image", "table", "math", "diagram"]);
const clean = (s, max = 400) =>
  String(s ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
const lines = (v) =>
  (Array.isArray(v) ? v : String(v ?? "").split(/\n+/)).map((s) => clean(s, 300)).filter(Boolean);
const key = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();

export const missionTypes = () =>
  MISSION_IDS.map((id) => ({ id, label: PLANS[id].label, purpose: PLANS[id].purpose }));

/** What every stage needs, and where this mission type puts the teacher's passage and word list. */
export function missionNeeds(typeId) {
  const plan = PLANS[typeId];
  if (!plan) return [];
  return STAGES.map((stage) => ({ stage, label: STAGE_LABEL[stage], needs: STAGE_NEEDS[stage] }));
}

/**
 * The teacher's own content, gathered from an activity (`source.activity`), an ingest result (`source.ingest`, from
 * x/ingest.js) and loose pieces (`source.vocab`, `source.passage`, `source.questions`, `source.blocks`). Questions
 * that fail the studio's own validation are left out and named in `rejected`.
 */
export function readMissionSource(source = {}) {
  const rejected = [];
  let activity = source.activity ? normalizeActivity(source.activity) : null;
  if (!activity && source.ingest?.ok) {
    const built = buildActivityFromIngest(source.ingest, { kind: "interactive" });
    activity = built.activity;
  }
  const blocks = [
    ...(activity?.blocks || []),
    ...(source.blocks || []).map(cleanBlock).filter(Boolean),
  ];
  const seen = new Set();
  const vocab = [];
  for (const v of [
    ...blocks.filter((b) => b.type === "vocab").flatMap((b) => b.items),
    ...(source.vocab || []).map((v) => ({
      term: clean(v?.term, 80),
      def: clean(v?.def, 300),
      es: clean(v?.es, 80),
      example: clean(v?.example, 300),
    })),
  ]) {
    if (!v.term || !v.def || seen.has(key(v.term))) continue;
    seen.add(key(v.term));
    vocab.push({ term: v.term, def: v.def, es: v.es || "", example: v.example || "" });
  }
  const given = source.passage
    ? typeof source.passage === "string"
      ? { title: "", text: source.passage }
      : source.passage
    : null;
  const passage =
    (given && clean(given.text, 12000)
      ? { title: clean(given.title, 120), text: String(given.text) }
      : null) ||
    blocks.find((b) => b.type === "passage" && b.text.trim()) ||
    null;
  const questions = [];
  for (const raw of [...blocks.filter((b) => b.type === "question"), ...(source.questions || [])]) {
    const q = cleanBlock({ ...raw, type: "question" });
    if (!q) continue;
    const probe = validateActivity(normalizeActivity({ kind: "interactive", blocks: [q] }));
    const bad = probe.errors.find((e) => e.blockId === q.id);
    if (bad) rejected.push({ prompt: q.prompt, message: bad.message });
    else questions.push(q);
  }
  const visuals = blocks.filter((b) => VISUAL_TYPES.has(b.type) && (b.type !== "image" || b.src));
  return { vocab, passage, questions, visuals, rejected };
}

function omitted(stage, lang) {
  const label = STAGE_LABEL[stage];
  return {
    code: "stage-omitted",
    stage,
    ...pair(
      `Left out "${label.en}": nothing in your source fits it. It needs: ${STAGE_NEEDS[stage].en}`,
      `Se omitió "${label.es}": nada de su fuente le corresponde. Necesita: ${STAGE_NEEDS[stage].es}`,
    ),
    lang,
  };
}

/** Distribute the source questions over the stages (capped; extras fall through to Practice). */
function allocate(plan, questions, review) {
  const by = Object.fromEntries(STAGES.map((s) => [s, []]));
  for (const q of questions) by[stageOfQuestion(plan, q)].push(q);
  for (const [stage, cap] of Object.entries(STAGE_CAP)) {
    if (by[stage].length <= cap) continue;
    const extra = by[stage].splice(cap);
    if (stage === "practice") {
      review.push({
        code: "capped",
        stage,
        ...pair(
          `Only the first ${cap} practice questions fit in the mission; ${extra.length} were left out.`,
          `Solo caben las primeras ${cap} preguntas de práctica en la misión; se dejaron fuera ${extra.length}.`,
        ),
      });
    } else by.practice.push(...extra);
  }
  by.practice = by.practice.slice(0, STAGE_CAP.practice);
  return by;
}

const short = (prompt, kind) => ({
  type: "question",
  format: "short",
  kind,
  prompt,
  frame: "",
  sample: "",
  rubric: [],
});

/** The body blocks (no heading) of every stage that has real content. */
function stageBodies(plan, input, src, by, t) {
  const body = {};
  const intro = [];
  if (input.objective) intro.push({ type: "text", role: "body", text: input.objective });
  if (input.question) intro.push({ type: "text", role: "body", text: input.question });
  if (intro.length) body.introduction = intro;
  const vocabBlock = src.vocab.length ? [{ type: "vocab", items: src.vocab }] : [];
  const passage = src.passage
    ? [{ type: "passage", title: src.passage.title || "", text: src.passage.text }]
    : [];
  const place = (stage, blocks) => (body[stage] = [...(body[stage] || []), ...blocks]);
  if (vocabBlock.length) place(plan.vocab, vocabBlock);
  if (passage.length) place(plan.passage, passage);
  if (src.visuals.length) body.visual = src.visuals.slice(0, 4);
  if (by.investigation.length) place("investigation", by.investigation);
  const gather = src.passage || src.visuals.length || by.evidence.length;
  if (gather)
    place("evidence", [{ type: "organizer", kind: plan.organizer, prompts: [] }, ...by.evidence]);
  if (by.practice.length) place("practice", by.practice);
  const task = input.task ? [short(input.task, plan.commKind)] : [];
  if (task.length || by.communication.length)
    place("communication", [...task, ...by.communication]);
  // Student-facing success points are the teacher's own `rubric` input. A question's `rubric` is teacher-only in the
  // studio's model (it never reaches a student copy), so it is never copied into what students read.
  const rubric = [...new Map(lines(input.rubric).map((r) => [key(r), r])).values()];
  if (rubric.length && body.communication)
    place("feedback", [
      {
        type: "text",
        role: "body",
        text: `${t(pair("Check your response against these points.", "Compare su respuesta con estos puntos."))}\n${rubric.map((r) => `• ${r}`).join("\n")}`,
      },
    ]);
  if (by.revision.length) place("revision", by.revision);
  if (input.reflection) place("reflection", [short(input.reflection, "explain")]);
  else if (Object.keys(body).length >= 2)
    place("reflection", [{ type: "organizer", kind: "kwl", prompts: [] }]);
  return body;
}

const fail = (code, en, es) => ({
  ok: false,
  activity: null,
  stages: [],
  review: [{ code, ...pair(en, es) }],
});

export function buildMission(input = {}, deps = {}) {
  const plan = PLANS[input.type];
  if (!plan)
    return fail(
      "bad-type",
      "Choose one of the mission types.",
      "Elija uno de los tipos de misión.",
    );
  const lang = input.lang === "es" ? "es" : "en";
  const t = (x) => pick(x, lang);
  const topic = clean(input.topic, 80);
  if (!topic)
    return fail("no-topic", "Type the topic of your mission.", "Escriba el tema de su misión.");
  const review = [];
  const src = readMissionSource(input.source);
  for (const r of src.rejected)
    review.push({
      code: "question-left-out",
      ...pair(
        `A question was left out because a check found a problem: ${r.message} (${clean(r.prompt, 60)})`,
        `Se dejó fuera una pregunta porque una revisión encontró un problema (${clean(r.prompt, 60)}).`,
      ),
    });
  const clear = {
    ...input,
    objective: clean(input.objective),
    question: clean(input.question),
    task: clean(input.task),
    reflection: clean(input.reflection),
  };
  const by = allocate(plan, src.questions, review);
  const bodies = stageBodies(plan, clear, src, by, t);

  const stages = [];
  const blocks = [];
  let n = 0;
  for (const [index, stage] of STAGES.entries()) {
    const content = bodies[stage];
    if (!content?.length) {
      stages.push({ id: stage, built: false, blockIds: [] });
      review.push(omitted(stage, lang));
      continue;
    }
    const prefix = `m${index + 1}`;
    const made = [
      { type: "text", role: "heading", text: `${++n}. ${t(STAGE_LABEL[stage])}` },
      ...content,
    ]
      .map((b, i) => cleanBlock({ ...b, id: i === 0 ? `${prefix}-h` : `${prefix}-${i}` }))
      .filter(Boolean);
    stages.push({ id: stage, built: true, blockIds: made.map((b) => b.id) });
    blocks.push(...made);
  }
  if (blocks.length > LIMITS.blocks) blocks.length = LIMITS.blocks;
  if (!blocks.some((b) => b.type === "question"))
    return {
      ...fail(
        "no-questions",
        "A mission needs at least one question or a writing task. Add questions to your source or type a task.",
        "Una misión necesita al menos una pregunta o una tarea de escritura. Agregue preguntas a su fuente o escriba una tarea.",
      ),
      stages,
      review: [
        ...review,
        {
          code: "no-questions",
          ...pair(
            "A mission needs at least one question or a writing task. Add questions to your source or type a task.",
            "Una misión necesita al menos una pregunta o una tarea de escritura. Agregue preguntas a su fuente o escriba una tarea.",
          ),
        },
      ],
    };

  const builtLabels = stages.filter((s) => s.built).map((s) => t(STAGE_LABEL[s.id]));
  const skipped = stages.filter((s) => !s.built).map((s) => t(STAGE_LABEL[s.id]));
  const notes = [
    `${t(plan.label)}: ${topic}.`,
    `${t(pair("Stages built", "Etapas creadas"))}: ${builtLabels.join(", ")}.`,
    skipped.length
      ? `${t(pair("Left out (nothing in the source fit)", "Omitidas (nada en la fuente les correspondía)"))}: ${skipped.join(", ")}.`
      : "",
    stages.find((s) => s.id === "communication")?.built
      ? t(
          pair(
            "Students type their response; the player reads aloud but does not record speech.",
            "Los estudiantes escriben su respuesta; el reproductor lee en voz alta pero no graba voz.",
          ),
        )
      : "",
    t(
      pair(
        "Students move forward one question at a time; stage headings group the content, and no step is timed.",
        "Los estudiantes avanzan una pregunta a la vez; los encabezados agrupan el contenido y ningún paso tiene tiempo.",
      ),
    ),
  ]
    .filter(Boolean)
    .join(" ");

  const draft = normalizeActivity({
    id: (deps.newId || newActivityId)(),
    title: `${t(plan.label)}: ${topic}`,
    description: clear.objective,
    kind: "interactive",
    template: ["history", "reading", "communication"].includes(input.type)
      ? "interactive-reading"
      : ["vocabulary", "escape"].includes(input.type)
        ? "match-sort"
        : "explore-practice",
    context: {
      grade: clean(input.grade, 8),
      subject: clean(input.subject, 40),
      objective: clear.objective,
      source: { origin: "teacher", note: "Built from the content you gave the mission builder." },
    },
    supports: { hints: true },
    options: { revise: true },
    blocks,
    notes: { teacher: notes, misconceptions: [] },
  });
  const level = SUPPORT[input.support] || SUPPORT.light;
  const supported = applyRequested(draft, level);
  review.push(...supported.review);
  const validation = validateActivity(supported.activity);
  review.push(...reviewFromValidation(validation));
  if (!stages.find((s) => s.id === "revision")?.built)
    review.push({
      code: "stage-native",
      stage: "revision",
      ...pair(
        "Students can change an answer and check again in the player (revision is on). No separate revision task was supplied.",
        "Los estudiantes pueden cambiar una respuesta y volver a comprobar en el reproductor (la corrección está activa). No se aportó una tarea de revisión aparte.",
      ),
    });
  if (
    !stages.find((s) => s.id === "feedback")?.built &&
    questionsOf(supported.activity).some((q) => q.explanation || q.hint)
  )
    review.push({
      code: "stage-native",
      stage: "feedback",
      ...pair(
        "Feedback comes from each question's own hints and explanations. No rubric points were supplied for a separate feedback stage.",
        "La retroalimentación viene de las pistas y explicaciones de cada pregunta. No se aportaron criterios de rúbrica para una etapa aparte.",
      ),
    });
  return { ok: validation.ok, activity: supported.activity, stages, review };
}

/** Words that are both on the printed word list and the answer of a fill-in-the-blank: x/package.js refuses to print those. */
function blankAnswerOnWordList(a) {
  const words = new Set(
    a.blocks.filter((b) => b.type === "vocab").flatMap((b) => b.items.map((v) => key(v.term))),
  );
  return [
    ...new Set(
      questionsOf(a)
        .filter((q) => q.format === "blank" && !q.bank)
        .flatMap((q) => marksOf(q.text).flatMap((m) => m.answers))
        .map(key)
        .filter((w) => words.has(w)),
    ),
  ];
}

/** The parts of a mission package: interactive page, printable companion and teacher notes (with the answer key). */
export function missionPackage(activity) {
  const a = normalizeActivity(activity);
  const paper = convertActivity(a, "worksheet");
  const review = paper.notes.map((n) => ({ code: "paper", ...n }));
  const leaks = blankAnswerOnWordList(a);
  if (leaks.length)
    review.push({
      code: "blank-answer-on-word-list",
      ...pair(
        `The printed copy would show the word list, which gives away the fill-in-the-blank answer "${leaks.join('", "')}", so packaging will refuse it. Turn on the word bank for that question or remove the word from the blank.`,
        `La copia impresa mostraría la lista de palabras, que revela la respuesta "${leaks.join('", "')}" de completar el espacio, así que el paquete se negará. Active el banco de palabras de esa pregunta o cambie la palabra del espacio.`,
      ),
    });
  return {
    parts: [
      { id: "mission", role: "interactive", activity: a, formats: ["html"] },
      { id: "printable", role: "worksheet", activity: paper.activity, formats: ["print"] },
      { id: "teacher-notes", role: "notes", activity: paper.activity, formats: ["print"] },
    ],
    review,
  };
}
export const missionPackageParts = (activity) => missionPackage(activity).parts;
