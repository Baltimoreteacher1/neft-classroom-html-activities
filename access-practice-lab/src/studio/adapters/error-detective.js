// Adapter: Language Error Detective case files (content/detective/patterns.json, /detective/<pattern>). A pattern becomes
// its micro-lesson (rule, a wrong and a right sentence, why, the home-language note, the self-check question), then
// every practice sentence to fix and every transfer task. A fixed sentence has more than one good wording, so each fix
// is an open response with the pattern's own corrected sentence as the sample: it is never auto-graded.

import {
  fitter,
  openQuestion,
  practiceDraft,
  textBlock,
} from "./practice-parts.js";
import { list, t, text } from "./util.js";

const FILE = "/access-practice-lab/content/detective/patterns.json";
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

export default {
  family: "error-detective",
  label: t("Language Error Detective case files", "Casos del Detective de errores de lenguaje"),
  note: t(
    "Copies a case file (the rule, examples, sentences to fix and the writing task) into a draft you can edit.",
    "Copia un caso (la regla, los ejemplos, las oraciones para corregir y la tarea de escritura) en un borrador que puede editar.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "prompts",
    "hints",
    "rubric",
    "samples",
    "openResponses",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t(
        "Finding the pattern in a student's own writing",
        "Encontrar el patrón en la escritura del estudiante",
      ),
      why: t(
        "The Detective reads a learner's own sentences on this device; the draft keeps the case file's lesson and practice.",
        "El Detective lee las oraciones del estudiante en este dispositivo; el borrador conserva la lección y la práctica del caso.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const data = await fetchJson(FILE);
    return Object.entries(data.patterns || {}).map(([id, p]) => ({
      id,
      title: text(p.name),
      grade: "",
      subject: "",
      domain: text(p.category),
      description: text(p.lesson?.rule),
      count: list(p.practice).length + list(p.transfer).length,
    }));
  },

  url: (ref) => `/access-practice-lab/detective/${ref}`,

  async extract(ref, { fetchJson }) {
    if (!ID.test(String(ref))) throw new Error("bad-ref");
    const data = await fetchJson(FILE);
    const p = Object.hasOwn(data.patterns || {}, ref) ? data.patterns[ref] : null;
    if (!p) throw new Error("not-found");
    const { fit, overflow } = fitter();
    const L = p.lesson || {};
    const lesson = [
      `**Rule:** ${text(L.rule)}`,
      `Not yet: ${text(L.wrong)}`,
      `Clear: ${text(L.right)}`,
      `Why it matters: ${text(L.why)}`,
      text(L.l1) && `Home language note: ${text(L.l1)}`,
    ].filter(Boolean);
    const fixes = list(p.practice).map((it, i) =>
      openQuestion(
        fit,
        {
          id: `fix${i + 1}`,
          prompt: `${text(it.prompt) || "Fix the sentence."}\n\n${text(it.broken)}`,
          hint: text(L.check),
          skill: text(p.name),
        },
        { kind: "write", sample: list(it.fixed).map(text).join("\n"), rubric: [L.check] },
      ),
    );
    const transfer = list(p.transfer).map((tr, i) =>
      openQuestion(
        fit,
        {
          id: `transfer${i + 1}`,
          prompt: [text(tr.context), text(tr.prompt)].filter(Boolean).join(" "),
          hint: text(L.check),
          skill: text(p.name),
        },
        { kind: "write", rubric: [L.check] },
      ),
    );
    return {
      activity: practiceDraft(fit, overflow, {
        title: `Error Detective: ${text(p.name)}`,
        description: text(L.rule),
        objective: text(L.rule),
        sourceNote: `Copied from Language Error Detective case file ${ref}.`,
        spanish: false,
        blocks: [
          textBlock("lesson", lesson.join("\n\n"), "directions", fit),
          ...fixes,
          ...transfer,
        ],
        teacher: [
          `Copied from Language Error Detective case file ${ref} (${text(p.category)}): ${text(p.name)}.`,
          "Each fix is an open response: the sample shows the case file's corrected sentence(s); other correct wordings are fine.",
        ],
      }),
      notes: [
        t(
          "Not carried: the pattern detector that reads a student's own writing, the hint ladder and the practice history on this device.",
          "No se conserva: el detector que lee la escritura del estudiante, la escalera de pistas ni el historial de práctica en este dispositivo.",
        ),
      ],
      source: p,
      url: `/access-practice-lab/detective/${ref}`,
      sourceTitle: text(p.name),
    };
  },
};
