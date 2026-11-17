// Answer key for a downloaded activity — TEACHER ONLY. Imported by the gated Teacher Hub (access-teacher/,
// behind the site's auth middleware) and by tests; no student surface imports this module, and the student menu
// (menu.js / run.js) never builds a key. It appends one section to a student document from model.js:
// the correct answer (grade.js correctAnswerText, the one scorer), the correct-answer explanation, sample answers
// by support level, what a strong answer shows, authored keys and the tracker answers.
import { correctAnswerText } from "../grade.js";
import { asList, TIERS } from "../util.js";
import { activityDocument, finish } from "./model.js";
import { labelsFor } from "./labels.js";

const KEY = {
  title: ["Answer key (teacher only)", "Clave de respuestas (solo para docentes)"],
  answer: ["Correct answer", "Respuesta correcta"],
  why: ["Why it is correct", "Por qué es correcta"],
  samples: ["Sample answers", "Respuestas de ejemplo"],
  notes: ["What a strong answer shows", "Qué muestra una buena respuesta"],
  key: ["Key", "Clave"],
  tracker: ["Details to hear", "Detalles que se escuchan"],
  model: ["Model student", "Estudiante modelo"],
};

/** The answer-key blocks for one activity (empty for an activity with nothing to key). */
export function answerKeyBlocks(a, lang = "en") {
  const { S } = labelsFor(lang);
  const k = (key) => S(...KEY[key]);
  const body = [];
  const text = correctAnswerText(a);
  if (text)
    body.push({ t: "label", text: k("answer") }, { t: "p", text, lang: "en", strong: true });
  if (a.correct) body.push({ t: "label", text: k("why") }, { t: "p", text: a.correct, lang: "en" });
  const models = a.models && typeof a.models === "object" ? Object.entries(a.models) : [];
  if (models.length)
    body.push(
      { t: "label", text: k("samples") },
      { t: "list", lang: "en", items: models.map(([lv, m]) => `${TIERS[lv]?.name || lv}: ${m}`) },
    );
  if (a.model) body.push({ t: "label", text: k("samples") }, { t: "p", text: a.model, lang: "en" });
  if (a.modelStudent?.text)
    body.push(
      { t: "label", text: k("model") },
      {
        t: "p",
        text: `${a.modelStudent.name ? `${a.modelStudent.name}: ` : ""}${a.modelStudent.text}`,
        lang: "en",
      },
    );
  const notes =
    a.modelNotes && typeof a.modelNotes === "object" ? Object.entries(a.modelNotes) : [];
  if (notes.length)
    body.push(
      { t: "label", text: k("notes") },
      { t: "list", lang: "en", items: notes.map(([lv, m]) => `${TIERS[lv]?.name || lv}: ${m}`) },
    );
  if (asList(a.answerKey).length)
    body.push(
      { t: "label", text: k("key") },
      { t: "list", items: asList(a.answerKey), lang: "en" },
    );
  if (asList(a.tracker).length)
    body.push(
      { t: "label", text: k("tracker") },
      { t: "list", lang: "en", items: a.tracker.map((r) => asList(r).join(" ")) },
    );
  return body.length ? [{ t: "h", text: k("title") }, ...body] : [];
}

/** The teacher edition: the student document plus the key, on its own page in print. */
export function answerKeyDocument(a, opts = {}) {
  const student = activityDocument(a, opts);
  const key = answerKeyBlocks(a, opts.lang);
  const blocks = student.blocks.filter((b) => b.t !== "link" && b.t !== "honest");
  const lab = labelsFor(opts.lang);
  return finish(lab, {
    ...student,
    blocks: [...blocks, { t: "pagebreak" }, ...key],
    slug: `${student.slug}-answer-key`,
  });
}
