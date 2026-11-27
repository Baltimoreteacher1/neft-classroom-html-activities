// Adapter: the Language Page practice activities (content/index.json + content/g<band>/<Domain>.json, the /<Domain>/
// <level>/<id> activity page). One activity becomes its directions, its reading, listening script, picture, table or
// chart, its vocabulary with Spanish, and its ONE task as one question, keyed exactly as the activity page keys it:
//   multipleChoice -> choice      multiSelect -> multi      hotText -> choice/multi over the sentences
//   order -> order (items in the key order)      sort -> sort      cloze -> blank (the choices are listed)
//   constructed -> open response (models and success criteria as sample and self-check, never auto-graded)
//   worksheet -> its sheet as text, plus one open response for the whole sheet (its answer key, when it has one)

import {
  audioBlocks,
  blankFromParts,
  blockId,
  chartBlocks,
  fitter,
  imageBlock,
  openQuestion,
  optionsOf,
  orderQuestion,
  overflowNotes,
  passageBlocks,
  pickQuestion,
  questionBase,
  sortQuestion,
  textBlock,
  vocabItems,
  whyNot,
  withSpanish,
} from "./practice-parts.js";
import { list, t, tableBlocks, text } from "./util.js";

const BASE = "/access-practice-lab/content";
const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/i;
const NOTE_MAX = 2000;

async function locate(id, fetchJson) {
  const index = await fetchJson(`${BASE}/index.json`);
  for (const [band, b] of Object.entries(index.bands || {}))
    for (const [domain, d] of Object.entries(b.domains || {}))
      for (const [level, L] of Object.entries(d.levels || {}))
        if (list(L.activities).some((row) => row[0] === id)) return { band, domain, level };
  return null;
}

const urlFor = (domain, level, id) =>
  `/access-practice-lab/${domain}/${domain === "Model-Test" ? level.replace(/-([^-]+)$/, "/$1") : level}/${id}`;

/** [term, def, es] rows; the Spanish gloss is "palabra: definición", so the word before the colon is kept when long. */
const vocabRows = (a) =>
  list(a.vocabulary).map(([term, def, es]) => {
    const s = text(es);
    return { term, def, es: s.length > 80 && s.includes(":") ? s.split(":")[0] : s };
  });

function feedbackLines(options, answers, feedback) {
  return options
    .filter((o) => !answers.includes(o.id) && text(feedback?.[o.id]))
    .map((o) => `"${o.text}": ${text(feedback[o.id])}`);
}

function itemFeedback(items, feedback) {
  const lines = items
    .filter((i) => text(feedback?.[i.id]))
    .map((i) => `"${text(i.text)}": ${text(feedback[i.id])}`);
  return lines.length ? `Hints for each item:\n${lines.join("\n")}` : "";
}

const sampleOf = (a) =>
  text(a.modelStudent?.text) ||
  Object.values(a.models || {})
    .map(text)
    .filter(Boolean)
    .slice(-1)[0] ||
  text(a.model);

function questionFor(a, domain, fit) {
  const base = {
    id: blockId("q", a.id),
    prompt: text(a.prompt) || text(a.directions),
    hint: withSpanish(text(a.hint), a.promptEs, 400),
    frame: list(a.frames).map(text).join(" / "),
    skill: text(a.skill),
  };
  const correct = text(a.correct);
  switch (a.type) {
    case "multipleChoice":
    case "multiSelect": {
      const options = optionsOf(a.options, fit);
      const answers = a.type === "multiSelect" ? list(a.answers) : [a.answer];
      const why = whyNot(feedbackLines(options, answers, a.distractorFeedback));
      return pickQuestion(
        fit,
        { ...base, explanation: [correct, why].filter(Boolean).join("\n\n") },
        options,
        answers,
      );
    }
    case "hotText": {
      const answers = list(a.answers);
      if (list(a.sentences).length > 8)
        // more sentences than a choice question can hold: the same key as a two-group sort
        return sortQuestion(
          fit,
          { ...base, explanation: correct },
          ["The answer", "Not the answer"],
          list(a.sentences).map((s) => ({
            id: s.id,
            text: s.text,
            label: answers.includes(s.id) ? "The answer" : "Not the answer",
          })),
        );
      const options = optionsOf(a.sentences, fit);
      const why = whyNot(feedbackLines(options, answers, a.distractorFeedback));
      return pickQuestion(
        fit,
        { ...base, explanation: [correct, why].filter(Boolean).join("\n\n") },
        options,
        answers,
      );
    }
    case "order": {
      const byId = new Map(list(a.items).map((i) => [i.id, i]));
      const items = list(a.answer).map((id) => ({ id, text: byId.get(id)?.text }));
      return orderQuestion(fit, { ...base, explanation: correct }, items);
    }
    case "sort": {
      const why = itemFeedback(list(a.items), a.itemFeedback);
      return sortQuestion(
        fit,
        { ...base, explanation: [correct, why].filter(Boolean).join("\n\n") },
        list(a.categories),
        list(a.items).map((i) => ({ id: i.id, text: i.text, label: i.answer })),
      );
    }
    case "cloze": {
      const parts = list(a.segments).map((s) => (s.blank ? s.blank : s.text));
      const made = blankFromParts(parts);
      const why = itemFeedback(
        list(a.segments)
          .filter((s) => s.blank)
          .map((s) => ({ id: s.blank.id, text: s.blank.answer })),
        a.itemFeedback,
      );
      return {
        ...questionBase(fit, {
          ...base,
          prompt: `${base.prompt}\n\n${made.lead}`,
          explanation: [correct, why].filter(Boolean).join("\n\n"),
        }),
        format: "blank",
        bank: false,
        text: fit(made.text, 4000, "Fill-in text"),
      };
    }
    case "worksheet":
      return openQuestion(
        fit,
        { ...base, prompt: text(a.directions) || text(a.title) },
        { kind: "write", sample: list(a.answerKey).map(text).join("\n"), rubric: list(a.writeFor) },
      );
    default:
      return openQuestion(fit, base, {
        kind: domain === "Writing" ? "write" : "explain",
        sample: sampleOf(a),
        rubric: list(a.successCriteria).length ? a.successCriteria : list(a.selfCheck),
      });
  }
}

function stimulusBlocks(a, fit, flags) {
  const out = [];
  const dir = withSpanish(a.directions, a.directionsEs, 4000);
  out.push(textBlock("directions", dir, "directions", fit));
  if (list(a.passage).length)
    out.push(...passageBlocks("passage", a.passageTitle || a.title, a.passage));
  if (text(a.script)) out.push(...audioBlocks("script", `Listen: ${text(a.title)}`, [a.script]));
  for (const [n, pic] of (Array.isArray(a.picture)
    ? a.picture
    : a.picture
      ? [a.picture]
      : []
  ).entries())
    out.push(imageBlock(`img${n + 1}`, pic, fit));
  if (a.table?.headers)
    out.push(
      ...tableBlocks(
        "table",
        text(a.table.caption),
        a.table.headers.map(text),
        list(a.table.rows).map((r) => r.map(text)),
        flags,
      ),
    );
  for (const [n, chart] of (Array.isArray(a.chart) ? a.chart : a.chart ? [a.chart] : []).entries())
    out.push(...chartBlocks(`chart${n + 1}`, chart, flags));
  for (const [n, sec] of list(a.sheet).entries())
    out.push(
      textBlock(
        `sheet${n + 1}`,
        [`**${text(sec.heading)}**`, ...list(sec.items).map(text)].join("\n"),
        "body",
        fit,
      ),
    );
  if (list(a.wordBank).length)
    out.push(textBlock("bank", `Word bank: ${a.wordBank.map(text).join(", ")}`, "body", fit));
  return out.filter(Boolean);
}

function teacherNote(a, where) {
  const tch = a.teacher && typeof a.teacher === "object" ? a.teacher : {};
  const lines = [
    `Copied from The Language Page practice activity ${a.id} (${where}): ${text(a.title)}.`,
    ...Object.entries(tch)
      .filter(([, v]) => typeof v === "string" && text(v))
      .map(([k, v]) => `${k}: ${text(v)}`),
    text(a.teacherNote),
    text(a.support) && `Support: ${text(a.support)}`,
    text(a.extension) && `Extension: ${text(a.extension)}`,
    list(a.wida).length &&
      `WIDA-aligned focus (original practice, not official WIDA material): ${a.wida.map(text).join("; ")}`,
  ].filter(Boolean);
  const kept = [];
  let size = 0;
  for (const line of lines) {
    if (size + line.length + 1 > NOTE_MAX) break;
    kept.push(line);
    size += line.length + 1;
  }
  return { teacher: kept.join("\n"), rest: lines.slice(kept.length) };
}

export default {
  family: "lab-activity",
  label: t("Language Page practice activities", "Actividades de práctica de The Language Page"),
  note: t(
    "Copies one practice activity (its reading or listening, vocabulary and task) into a draft you can edit.",
    "Copia una actividad de práctica (su lectura o audio, vocabulario y tarea) en un borrador que puede editar.",
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
    "rubric",
    "samples",
    "openResponses",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t(
        "Recording, picture taps and the listening player",
        "Grabación, toques en imágenes y el reproductor de audio",
      ),
      why: t(
        "These are part of the activity page itself; the copy keeps the script and the words, not the player.",
        "Son parte de la propia página de la actividad; la copia conserva el guion y las palabras, no el reproductor.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const index = await fetchJson(`${BASE}/index.json`);
    const rows = [];
    for (const [band, b] of Object.entries(index.bands || {}))
      for (const [domain, d] of Object.entries(b.domains || {}))
        for (const [level, L] of Object.entries(d.levels || {}))
          for (const [id, title, type, skill] of list(L.activities))
            rows.push({
              id,
              title: text(title),
              grade: band,
              subject: "",
              domain,
              description: `${domain} · level ${level} · ${text(skill) || text(type)}`,
              count: 1,
            });
    return rows;
  },

  async extract(ref, { fetchJson }) {
    if (!SLUG.test(ref)) throw new Error("bad-ref");
    const at = await locate(ref, fetchJson);
    if (!at) throw new Error("not-found");
    const data = await fetchJson(`${BASE}/g${at.band}/${encodeURIComponent(at.domain)}.json`);
    const a = list(data.levels?.[at.level]?.activities).find((x) => x.id === ref);
    if (!a) throw new Error("bad-source");
    const { fit, overflow } = fitter();
    const flags = new Set();
    const vocab = vocabItems(vocabRows(a), fit);
    const question = questionFor(a, at.domain, fit);
    const stim = stimulusBlocks(a, fit, flags);
    const note = teacherNote(a, `${at.domain}, grades ${at.band}, level ${at.level}`);
    const blocks = [
      ...stim,
      ...(vocab ? [vocab] : []),
      question,
      ...overflowNotes("teacher", [...note.rest, ...overflow]),
    ];
    return {
      activity: {
        title: text(a.title).slice(0, 120),
        description: `${at.domain} practice, grades ${at.band}`.slice(0, 400),
        kind: "interactive",
        template: list(a.passage).length ? "interactive-reading" : "explore-practice",
        context: {
          grade: at.band,
          subject: "",
          curriculum: "The Language Page",
          objective: fit(list(a.wida).map(text).join(" ") || a.skill, 400, "Objective"),
          standards: [],
          source: {
            origin: "teacher",
            note: `Copied from The Language Page activity ${a.id}.`.slice(0, 200),
          },
        },
        supports: {
          wida: 0,
          hints: true,
          frames: list(a.frames).length > 0,
          spanish: Boolean(vocab?.items.some((v) => v.es) || text(a.promptEs)),
          readAloud: Boolean(text(a.script)),
          visuals: false,
          chunk: false,
        },
        options: { shuffle: true, revise: true, answerKey: true },
        blocks,
        notes: { teacher: note.teacher, misconceptions: [] },
      },
      notes: [
        t(
          "Not carried: the recorder, picture-tap answers, scene art, the grade-band tags and the per-level teaching notes beyond what fits in the teacher notes. They stay on the activity page.",
          "No se conserva: la grabadora, las respuestas tocando imágenes, el arte de la escena, las etiquetas de grado y las notas de enseñanza por nivel que no caben en las notas para docentes. Permanecen en la página de la actividad.",
        ),
        ...(flags.has("table-as-text")
          ? [
              t(
                "A table too wide for a table block is written out as text.",
                "Una tabla demasiado ancha para un bloque de tabla aparece como texto.",
              ),
            ]
          : []),
      ],
      source: a,
      url: urlFor(at.domain, at.level, a.id),
      sourceTitle: text(a.title),
    };
  },
};
