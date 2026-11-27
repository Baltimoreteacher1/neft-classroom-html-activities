// Adapter: the numbered grammar practice packs (content/grammar/packs.json, /grammar/<n>). A pack becomes its rule and
// every one of its items (the two check-in items, then the practice items) as a choice question over the item's own
// three sentences, keyed by the pack's `answer`. The pack's why-lines and rule carry their Spanish.

import {
  fitter,
  pickQuestion,
  practiceDraft,
  textBlock,
  withSpanish,
} from "./practice-parts.js";
import { list, t, text } from "./util.js";

const FILE = "/access-practice-lab/content/grammar/packs.json";
const PROMPT = "Choose the correct sentence.";

function itemQuestion(item, id, rule, fit) {
  const options = list(item.choices).map((c, n) => ({
    id: `o${n + 1}`,
    text: fit(c, 400, "Sentence"),
  }));
  return pickQuestion(
    fit,
    {
      id,
      prompt: PROMPT,
      hint: withSpanish(rule.en, rule.es, 400),
      explanation: withSpanish(item.why?.en, item.why?.es, 800),
      skill: "grammar",
    },
    options,
    [options[Number(item.answer)]?.id ?? ""],
  );
}

export default {
  family: "grammar-packs",
  label: t("Grammar practice packs", "Paquetes de práctica de gramática"),
  note: t(
    "Copies a grammar pack (its rule and every choose-the-correct-sentence item) into a draft you can edit.",
    "Copia un paquete de gramática (su regla y cada ítem de elegir la oración correcta) en un borrador que puede editar.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "prompts",
    "choices",
    "answerKeys",
    "hints",
    "explanations",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t("The writing-sample check", "La revisión de la muestra de escritura"),
      why: t(
        "The grammar check-in reads a student's own writing with rule detectors; that stays on the grammar page.",
        "El chequeo de gramática lee la escritura del estudiante con detectores de reglas; eso permanece en la página de gramática.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const data = await fetchJson(FILE);
    return list(data.packs).map((p) => ({
      id: String(p.n),
      title: `Pack ${p.n}: ${text(p.title?.en)}`,
      grade: "",
      subject: "",
      domain: "Grammar",
      description: text(p.rule?.en),
      count: list(p.diagnostic).length + list(p.practice).length,
    }));
  },

  url: (ref) => `/access-practice-lab/grammar/${ref}`,

  async extract(ref, { fetchJson }) {
    const data = await fetchJson(FILE);
    const pack = list(data.packs).find((p) => String(p.n) === String(ref));
    if (!pack) throw new Error("not-found");
    const { fit, overflow } = fitter();
    const rule = { en: text(pack.rule?.en), es: text(pack.rule?.es) };
    const items = [...list(pack.diagnostic), ...list(pack.practice)];
    const blocks = [
      textBlock("rule", `**Rule:** ${withSpanish(rule.en, rule.es, 3900)}`, "directions", fit),
      ...items.map((item, i) => itemQuestion(item, `g${i + 1}`, rule, fit)),
    ];
    return {
      activity: practiceDraft(fit, overflow, {
        title: `Grammar pack ${pack.n}: ${text(pack.title?.en)}`,
        description: rule.en,
        objective: rule.en,
        sourceNote: `Copied from The Language Page grammar pack ${pack.n}.`,
        spanish: Boolean(rule.es),
        blocks,
        teacher: [
          `Copied from grammar pack ${pack.n} (${text(pack.id)}): ${text(pack.title?.en)}.`,
          "Items 1 and 2 are the pack's check-in items; the rest are its practice items.",
          text(data.note),
        ],
      }),
      notes: [
        t(
          "Not carried: the writing-sample detectors and the route from the check-in to a pack.",
          "No se conserva: los detectores de la muestra de escritura ni la ruta del chequeo a un paquete.",
        ),
      ],
      source: pack,
      url: `/access-practice-lab/grammar/${pack.n}`,
      sourceTitle: text(pack.title?.en),
    };
  },
};
