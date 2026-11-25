// Adapter: BCPSS curriculum units (the same /api/bcpss/units data the Teacher Hub reads, via core/curriculum.js).
// A unit becomes a vocabulary block, match sets, the unit's own cloze items, its reading with questions, and the
// language exit ticket. Grade, subject, unit and standards are filled from the unit record and marked as curriculum
// metadata; no lesson numbers or standards are invented.

import {
  contextFromUnit,
  fetchUnit,
  fetchUnits,
  GRADES,
  seedFromDetail,
  SUBJECTS,
} from "../core/curriculum.js";
import { choiceQuestion, matchQuestions, openQuestion, vocabBlock } from "./vocab-parts.js";
import { asFetch, list, noteBlocks, shorten, t, text } from "./util.js";

const UNIT_ID = /^[a-zA-Z0-9_-]{2,80}$/;
const BANDS = ["1_2", "3_4", "5_6"];
const DEFAULT_BAND = "3_4";
const NOTE_MAX = 2000;

const exampleByTerm = (conn) =>
  new Map(list(conn?.tier2_tier3_vocab).map((v) => [text(v.term), text(v.example)]));

function clozeQuestions(conn, frame) {
  return list(conn?.interactive_cloze_items)
    .map((c, i) => {
      const sentence = text(c.sentence_with_blank);
      const answer = text(c.answer);
      if (!sentence || !answer) return null;
      return choiceQuestion({
        id: `c${i + 1}`,
        prompt: `Which word completes the sentence?\n\n${sentence}`,
        answer,
        distractors: list(c.distractor_pool).map(text).filter(Boolean),
        hint: text(c.hint),
        frame,
        explanation: `${sentence.replace(/_{3,}/, `**${answer}**`)}`,
        skill: "vocabulary",
      });
    })
    .filter(Boolean);
}

function readingParts(reading, band) {
  if (!reading?.texts) return { blocks: [], questions: [], band: "" };
  const used = reading.texts[band] ? band : DEFAULT_BAND;
  const body = text(reading.texts[used]);
  if (!body) return { blocks: [], questions: [], band: "" };
  const questions = list(reading.questions).map((q, i) => {
    const options = list(q.options).map((o, n) => ({ id: `o${n + 1}`, text: text(o) }));
    const evidence = text(q.evidence?.[used]);
    return {
      type: "question",
      id: `r${i + 1}`,
      format: "choice",
      prompt: text(q.q),
      options,
      answer: options[Number(q.answer)]?.id ?? "",
      explanation: evidence ? `Evidence in the text: "${evidence}"` : "",
      skill: text(q.type).slice(0, 80),
    };
  });
  return {
    blocks: [{ type: "passage", id: "reading", title: text(reading.title), text: body }],
    questions,
    band: used,
  };
}

function exitQuestion(conn) {
  const e = conn?.language_exit_ticket_json;
  if (!text(e?.prompt)) return null;
  const words = list(e.required_vocab).map(text).filter(Boolean);
  return openQuestion({
    id: "exit",
    prompt: text(e.prompt),
    frame: text(e.target_frame),
    rubric: [
      ...list(e.look_fors),
      ...(words.length ? [`Uses the words: ${words.join(", ")}.`] : []),
    ],
    sample: e.model,
  });
}

function teacherNote(detail, conn, band, fixes) {
  const u = detail.unit;
  const rubric = conn?.language_exit_ticket_json?.quick_rubric;
  const lines = [
    `Copied from BCPSS unit ${u.id}: grade ${u.grade} ${u.subject}, ${text(u.curriculum_name)}, unit ${u.unit_number}: ${text(u.unit_title)}.`,
    text(u.unit_summary) && `Unit summary: ${text(u.unit_summary)}`,
    band &&
      `Reading shown: the ${band.replace("_", "-")} version of this unit's reading. The other two levels stay in the unit.`,
    rubric &&
      `Exit ticket levels. Emerging: ${text(rubric.emerging)} Developing: ${text(rubric.developing)} Proficient: ${text(rubric.proficient)}`,
    ...fixes,
    ...list(detail.activities).map(
      (a) =>
        `Day ${a.activity_order} (${text(a.domain)}, ${text(a.activity_type)}): ${text(a.student_prompt)}`,
    ),
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

/** Watch-outs: the short statement goes to the draft's misconceptions list, the fix to the teacher note. */
function watchOuts(conn) {
  const c = conn?.common_language_misconception;
  const pairs = [
    c?.misconception_pattern && [text(c.misconception_pattern), `Redirect: ${text(c.teacher_redirect)}`],
    ...list(conn?.l1_watchouts).map((w) => [text(w.friction_point), `Quick fix: ${text(w.quick_fix)}`]),
  ].filter(Boolean);
  return {
    misconceptions: pairs.slice(0, 8).map(([m]) => shorten(m, 300)),
    fixes: pairs.slice(0, 8).map(([m, fix]) => `Watch-out: ${m} ${fix}`),
  };
}

export default {
  family: "bcpss-unit",
  label: t("BCPSS curriculum units", "Unidades del currículo de BCPSS"),
  note: t(
    "Builds an editable practice set from a BCPSS unit's own vocabulary, fill-in sentences, reading and language exit ticket, with the unit's grade, subject and standards filled in from the curriculum.",
    "Crea un conjunto de práctica editable con el vocabulario, las oraciones para completar, la lectura y el boleto de salida de lenguaje de una unidad de BCPSS, con el grado, la materia y los estándares tomados del currículo.",
  ),
  editable: [
    "title",
    "objective",
    "standards",
    "vocab",
    "passage",
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
        "Language Studio activities, writing lab, family card and ESOL pack",
        "Actividades de Language Studio, laboratorio de escritura, tarjeta familiar y paquete ESOL",
      ),
      why: t(
        "Those are separate interactive tools with their own data. This copy carries the unit's vocabulary, cloze items, reading and exit ticket.",
        "Son herramientas interactivas separadas con sus propios datos. Esta copia incluye el vocabulario, las oraciones para completar, la lectura y el boleto de salida de la unidad.",
      ),
    },
    {
      what: t("Curriculum standards labels", "Etiquetas de estándares del currículo"),
      why: t(
        "Standards that came from the unit stay labelled as curriculum metadata. Any standard you add is labelled as your choice.",
        "Los estándares que vienen de la unidad se mantienen como metadatos del currículo. Cualquier estándar que agregue se marca como elección suya.",
      ),
    },
  ],

  async list({ fetchJson, grade, subject }) {
    const grades = grade ? [grade] : GRADES;
    const subjects = subject ? [subject] : SUBJECTS;
    const fetchFn = asFetch(fetchJson);
    const rows = await Promise.all(
      grades.flatMap((g) => subjects.map((s) => fetchUnits(g, s, fetchFn).catch(() => []))),
    );
    return rows.flat().map((u) => ({
      id: u.id,
      title: text(u.unit_title),
      grade: String(u.grade),
      subject: u.subject,
      domain: "",
      description: text(u.unit_summary),
      count: null,
    }));
  },

  url: () => "",

  async extract(ref, { fetchJson, band = DEFAULT_BAND }) {
    if (!UNIT_ID.test(String(ref))) throw new Error("bad-ref");
    const detail = await fetchUnit(ref, asFetch(fetchJson));
    if (!detail?.unit || detail.unit.id !== ref) throw new Error("bad-source");
    const seed = seedFromDetail(detail);
    const conn = list(detail.connections)[0];
    const examples = exampleByTerm(conn);
    const vocab = seed.vocab.map((v) => ({ ...v, example: examples.get(v.term) || "" }));
    const fitted = vocabBlock(vocab);
    const frame = seed.frames[0] || "";
    const reading = readingParts(detail.reading, BANDS.includes(band) ? band : DEFAULT_BAND);
    const exit = exitQuestion(conn);
    const watch = watchOuts(conn);
    const note = teacherNote(detail, conn, reading.band, watch.fixes);
    const context = contextFromUnit(detail.unit);
    return {
      activity: {
        title: `${text(detail.unit.unit_title)}: vocabulary and language practice`.slice(0, 120),
        description: text(detail.unit.unit_summary).slice(0, 400),
        kind: "interactive",
        template: reading.blocks.length ? "interactive-reading" : "match-sort",
        context,
        supports: {
          wida: 0,
          hints: true,
          frames: true,
          spanish: vocab.some((v) => v.es),
          readAloud: false,
          visuals: false,
          chunk: false,
        },
        options: { shuffle: true, revise: true, answerKey: true },
        blocks: [
          fitted.block,
          ...noteBlocks("vocab", fitted.extra),
          ...matchQuestions(vocab),
          ...clozeQuestions(conn, frame),
          ...reading.blocks,
          ...reading.questions,
          ...(exit ? [exit] : []),
        ],
        notes: { teacher: note.teacher, misconceptions: watch.misconceptions },
      },
      notes: [
        t(
          "Not carried: the Language Studio activities, writing lab, family card, ESOL pack, mentor-sentence unpacking and partner-talk protocol. They stay in the unit.",
          "No se conserva: las actividades de Language Studio, el laboratorio de escritura, la tarjeta familiar, el paquete ESOL, el análisis de la oración modelo ni el protocolo de conversación en parejas. Permanecen en la unidad.",
        ),
        t(
          "Sentence frames use the unit's WIDA levels 3-4 set. The levels 1-2 and 5-6 frames and word banks stay in the unit; use Differentiate to change support.",
          "Los marcos de oraciones usan el conjunto de niveles WIDA 3-4 de la unidad. Los marcos y bancos de palabras de los niveles 1-2 y 5-6 permanecen en la unidad; use Diferenciar para cambiar el apoyo.",
        ),
        ...(reading.band
          ? [
              t(
                "Only one reading level is shown (levels 3-4 by default); the other two stay in the unit.",
                "Solo se muestra un nivel de lectura (niveles 3-4 por defecto); los otros dos permanecen en la unidad.",
              ),
            ]
          : []),
        ...(note.dropped
          ? [
              t(
                "Some day-by-day lines did not fit in the teacher notes and were left out.",
                "Algunas líneas del plan diario no cabían en las notas para docentes y se omitieron.",
              ),
            ]
          : []),
      ],
      source: {
        unit: detail.unit,
        vocab: conn?.tier2_tier3_vocab,
        cloze: conn?.interactive_cloze_items,
        exit: conn?.language_exit_ticket_json,
        reading: detail.reading,
        frames: seed.frames,
        band: reading.band,
      },
      url: "",
      sourceTitle: text(detail.unit.unit_title),
    };
  },
};
