// Adapter: TWR sentence-skill sets (content/twr/<band>/<strategy>.json, three sets per strategy per band). A set
// becomes its Learn step (rule, model, what to notice, with the Spanish rule), its practice items with their own
// keys (choice, select-all, choose-the-joining-word, put-in-order) and its writing task as an open response whose
// self-check is the set's own checklist and whose sample is the set's model. Every item is copied as written.

import { fitNote, labActivity, textBlocks, withSpanish } from "./lab-parts.js";
import { openQuestion } from "./vocab-parts.js";
import { list, t, text } from "./util.js";
import { BAND_TOKEN, STRATEGIES, TWR_BANDS } from "../../twr/registry.js";

const BASE = "/access-practice-lab/content/twr";
const BAND_OF = Object.fromEntries(Object.entries(BAND_TOKEN).map(([band, tok]) => [tok, band]));
const REF = /^(k|g1|g23|g35|g68)-([a-z-]+)-(\d)$/;

function parse(ref) {
  const m = REF.exec(String(ref));
  if (!m || !Object.hasOwn(STRATEGIES, m[2])) return null;
  const band = BAND_OF[m[1]];
  return STRATEGIES[m[2]].bands.includes(band) ? { band, slug: m[2] } : null;
}

const urlFor = (ref) => {
  const p = parse(ref);
  return p ? `/access-practice-lab/twr/${p.slug}/${ref}` : "";
};

const stem = (it) => [text(it.prompt), text(it.text)].filter(Boolean).join("\n\n");
const why = (it) => withSpanish(it.why, it.whyEs, 800);

function itemBlock(it, n) {
  const id = `q${n}`;
  if (it.kind === "choice") {
    const options = list(it.options).map((o, i) => ({ id: `o${i + 1}`, text: text(o.text) }));
    const at = list(it.options).findIndex((o) => o.id === it.answer);
    return {
      type: "question",
      id,
      format: "choice",
      prompt: stem(it),
      options,
      answer: options[at]?.id ?? "",
      explanation: why(it),
    };
  }
  if (it.kind === "pick") {
    const options = list(it.options).map((o, i) => ({ id: `o${i + 1}`, text: text(o.text) }));
    return {
      type: "question",
      id,
      format: "multi",
      prompt: stem(it),
      options,
      answers: list(it.options)
        .map((o, i) => (o.right ? options[i].id : ""))
        .filter(Boolean),
      explanation: why(it),
    };
  }
  if (it.kind === "order")
    return {
      type: "question",
      id,
      format: "order",
      prompt: stem(it),
      items: list(it.lines).map((l, i) => ({ id: `i${i + 1}`, text: text(l) })),
      explanation: why(it),
    };
  if (it.kind === "blanks") {
    const gaps = list(it.parts).filter((p) => p && typeof p === "object");
    const sentence = list(it.parts)
      .map((p) => (p && typeof p === "object" ? `[[${text(p.answer)}]]` : String(p)))
      .join("");
    const choices = gaps.map((g, i) =>
      gaps.length > 1
        ? `Blank ${i + 1}: ${list(g.options).map(text).join(" / ")}`
        : `Choices: ${list(g.options).map(text).join(" / ")}`,
    );
    return {
      type: "question",
      id,
      format: "blank",
      prompt: [stem(it), choices.join("\n")].filter(Boolean).join("\n\n"),
      text: sentence.trim(),
      bank: false,
      explanation: why(it),
    };
  }
  return null;
}

function writeBlock(w) {
  if (!text(w?.prompt)) return null;
  return {
    ...openQuestion({
      id: "write",
      prompt: [withSpanish(w.prompt, w.promptEs, 1200), text(w.text)].filter(Boolean).join("\n\n"),
      kind: "write",
      frame: text(w.frame).slice(0, 300),
      rubric: list(w.checks)
        .map((c) => text(Array.isArray(c.label) ? c.label[0] : c.label))
        .slice(0, 6),
      sample: text(w.model),
    }),
  };
}

export default {
  family: "twr",
  label: t("TWR sentence-skill sets", "Conjuntos de destrezas de oraciones TWR"),
  note: t(
    "Copies a TWR set into an activity you can edit: the rule and model, every practice item with its answer and explanation, and the writing task with its checklist and model.",
    "Copia un conjunto TWR en una actividad que puede editar: la regla y el modelo, cada ejercicio con su respuesta y explicación, y la tarea de escritura con su lista de control y su modelo.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "prompts",
    "choices",
    "answerKeys",
    "frames",
    "explanations",
    "rubric",
    "samples",
    "openResponses",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t(
        "The step-by-step player and its word checks on the writing task",
        "El reproductor paso a paso y la revisión de palabras de la tarea de escritura",
      ),
      why: t(
        "TWR checks a learner's sentence for the words it needs; in the copy those checks become a self-check list, never an automatic grade.",
        "TWR revisa si la oración del estudiante tiene las palabras necesarias; en la copia esas revisiones son una lista de autoevaluación, nunca una calificación automática.",
      ),
    },
    {
      what: t("Spanish explanations", "Explicaciones en español"),
      why: t(
        "The Spanish lines come from the set and have not been reviewed by a native speaker.",
        "Las líneas en español provienen del conjunto y no han sido revisadas por un hablante nativo.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const rows = [];
    for (const band of TWR_BANDS)
      for (const s of Object.values(STRATEGIES)) {
        if (!s.bands.includes(band)) continue;
        const file = await fetchJson(`${BASE}/${band}/${s.slug}.json`);
        for (const set of list(file.sets))
          rows.push({
            id: set.id,
            title: `${s.title[0]}: ${text(set.title)}`,
            grade: band,
            subject: text(set.area),
            domain: "Writing",
            description: text(set.learn?.rule),
            count: list(set.items).length + (set.write?.prompt ? 1 : 0),
          });
      }
    return rows;
  },

  url: urlFor,

  async extract(ref, { fetchJson }) {
    const p = parse(ref);
    if (!p) throw new Error("bad-ref");
    const file = await fetchJson(`${BASE}/${p.band}/${p.slug}.json`);
    const set = list(file.sets).find((s) => s.id === ref);
    if (!set) throw new Error("not-found");
    const strategy = STRATEGIES[p.slug];
    const learn = set.learn || {};
    const learnText = [
      withSpanish(learn.rule, learn.ruleEs, 1600),
      text(learn.model) && `Model: ${text(learn.model)}`,
      text(learn.notice) && `Notice: ${text(learn.notice)}`,
    ]
      .filter(Boolean)
      .join("\n\n");
    const items = list(set.items)
      .map((it, i) => itemBlock(it, i + 1))
      .filter(Boolean);
    if (items.length !== list(set.items).length) throw new Error("bad-source");
    const write = writeBlock(set.write);
    const note = fitNote([
      `Copied from TWR set ${set.id} (${strategy.title[0]}, grade band ${p.band}): ${text(set.title)}.`,
      text(set.teacherTip?.en) && `Teacher tip: ${text(set.teacherTip.en)}`,
      text(set.familyTalk?.en) && `Family talk: ${text(set.familyTalk.en)}`,
    ]);
    return {
      activity: labActivity({
        title: `${strategy.title[0]}: ${text(set.title)}`,
        description: text(strategy.blurb?.[0]),
        grade: p.band,
        subject: text(set.area),
        curriculum: "Language Page TWR (original practice, sentence-first writing method)",
        objective: text(learn.rule),
        sourceNote: `Copied from TWR set ${set.id}.`,
        template: "build-explain",
        blocks: [...textBlocks("learn", learnText), ...items, ...(write ? [write] : [])],
        teacher: note.teacher,
        spanish: Boolean(learn.ruleEs),
        frames: Boolean(write?.frame),
      }),
      notes: [
        t(
          "Not carried: the step-by-step player, the automatic word checks on the writing task (they are a self-check list here) and the progress record.",
          "No se conserva: el reproductor paso a paso, la revisión automática de palabras en la tarea de escritura (aquí es una lista de autoevaluación) ni el registro de progreso.",
        ),
      ],
      source: set,
      url: urlFor(ref),
      sourceTitle: text(set.title),
    };
  },
};
