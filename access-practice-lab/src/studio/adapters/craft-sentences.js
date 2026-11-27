// Adapter: Sentence Lab (src/content/craft-sentences.js, a pure data module, parsed by src/lang/craft-sentence.js).
// Refs are one level of one grade band (`3-5-l2`, the /sentences/<level> page) or one paragraph challenge (`gboss1`).
// Build, combine and expand tasks become order questions over the sentence's own parts (subject, verb, object,
// details, joiners, punctuation), keyed by the annotated answer; fix-it tasks become a choice of the authored
// corrections, explained by the grammar rule. A sentence whose parts repeat, or that accepts another order, becomes
// an open response with the answer as its sample, so no correct sentence is ever marked wrong. Spot-the-error tasks
// are not carried (most repeat as fix-it tasks). Loaded on demand so the Create panel stays light.

import { fitNote, labActivity, withSpanish } from "./lab-parts.js";
import { choiceQuestion, openQuestion } from "./vocab-parts.js";
import { list, t, text } from "./util.js";

const load = () => import("../../content/craft-sentences.js");
const parser = () => import("../../lang/craft-sentence.js");
const LEVEL = /^(3-5|6-8)-l(\d)$/;
const BOSS = /^[gm]boss\d{1,2}$/;

const urlFor = (ref) => {
  const m = LEVEL.exec(String(ref));
  if (m) return `/access-practice-lab/sentences/${m[2]}?grades=${m[1]}`;
  return BOSS.test(ref) ? `/access-practice-lab/sentences/boss/${ref}` : "";
};

function promptOf(task, n) {
  if (task.kind === "c")
    return `Combine the sentences into one: ${list(task.from).join(" / ")}${text(task.hint) ? ` (${text(task.hint)})` : ""}`;
  if (task.kind === "e")
    return `Expand the sentence: ${list(task.from).join(" ")} ${text(task.add)}`;
  return `Build sentence ${n}. Put the parts in order.`;
}

/** One task as a question, or null when it is not carried (spot-the-error). */
function taskQuestion(task, n, M, P) {
  if (task.kind === "s") return null;
  if (task.kind === "f") {
    const [right, ...wrong] = list(task.opts).map(text);
    const rule = M.RULES[task.rule];
    // choices that differ only in capital letters cannot be told apart by the answer check: ask for the fix instead
    if (new Set([right, ...wrong].map((o) => o.toLowerCase())).size <= wrong.length)
      return openQuestion({
        id: `f${n}`,
        prompt: `Fix the sentence. Write it correctly: "${text(task.s)}"`,
        kind: "write",
        rubric: rule ? [rule.rule.en.slice(0, 300)] : [],
        sample: right,
      });
    return choiceQuestion({
      id: `f${n}`,
      prompt: `Fix the sentence: "${text(task.s)}" Which sentence is correct?`,
      answer: right,
      distractors: wrong,
      explanation: rule ? withSpanish(`${rule.name.en}: ${rule.rule.en}`, rule.rule.es, 800) : "",
      skill: rule ? rule.name.en.slice(0, 80) : "grammar",
    });
  }
  const parsed = P.parseSentence(task.a);
  const tiles = P.tilesFor({ ...task, kind: "x" }, parsed).map((x) => text(x.text));
  const contrast = M.CONTRAST[task.c];
  const explanation = contrast
    ? withSpanish(`${parsed.text} ${contrast.text.en}`, contrast.text.es, 800)
    : parsed.text;
  const prompt = promptOf(task, n);
  if (list(task.alt).length || tiles.length < 2 || new Set(tiles).size !== tiles.length)
    return openQuestion({
      id: `b${n}`,
      prompt: `${prompt}\n\nParts: ${[...tiles].sort().join(" | ")}`,
      kind: "write",
      sample: [parsed.text, ...list(task.alt).map(text)].join(" / "),
    });
  return {
    type: "question",
    id: `b${n}`,
    format: "order",
    prompt,
    items: tiles.map((x, i) => ({ id: `i${i + 1}`, text: x })),
    explanation: explanation.slice(0, 800),
    skill: "sentence building",
  };
}

async function source(ref) {
  const M = await load();
  const m = LEVEL.exec(String(ref));
  if (m) {
    const tasks = M.TASKS.filter((x) => x.band === m[1] && x.lv === Number(m[2]));
    const lv = M.LEVELS.find((l) => l.n === Number(m[2]));
    return tasks.length && lv
      ? { M, tasks, band: m[1], title: `Sentence Lab level ${lv.n}: ${lv.en}`, goal: lv.goal }
      : null;
  }
  const boss = BOSS.test(ref) ? M.BOSSES.find((b) => b.id === ref) : null;
  return boss
    ? {
        M,
        tasks: boss.steps,
        band: boss.band,
        title: `Sentence Lab challenge: ${boss.title.en}`,
        goal: boss.intro,
      }
    : null;
}

export default {
  family: "craft-sentences",
  label: t("Sentence Lab levels and challenges", "Niveles y desafíos del Laboratorio de oraciones"),
  note: t(
    "Copies a Sentence Lab level or paragraph challenge into practice you can edit: sentences to build, combine and expand from their parts, and sentences to fix with the grammar rule.",
    "Copia un nivel o un desafío de párrafo del Laboratorio de oraciones en una práctica que puede editar: oraciones para construir, combinar y ampliar a partir de sus partes, y oraciones para corregir con la regla gramatical.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "prompts",
    "choices",
    "answerKeys",
    "explanations",
    "samples",
    "openResponses",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t(
        "Word-by-word tiles, the sentence machine and spot-the-error taps",
        "Fichas palabra por palabra, la máquina de oraciones y tocar el error",
      ),
      why: t(
        "The copy builds from the sentence's parts and keeps the fix-it versions of the errors; the rest stays in the Sentence Lab.",
        "La copia construye con las partes de la oración y conserva las versiones de corregir; lo demás permanece en el Laboratorio de oraciones.",
      ),
    },
    {
      what: t("Spanish grammar notes", "Notas de gramática en español"),
      why: t(
        "The Spanish rule and contrast notes come from the Sentence Lab and have not been reviewed by a native speaker.",
        "Las reglas y notas de contraste en español provienen del Laboratorio y no han sido revisadas por un hablante nativo.",
      ),
    },
  ],

  async list() {
    const M = await load();
    const levels = [];
    for (const band of ["3-5", "6-8"])
      for (const lv of M.LEVELS) {
        const tasks = M.TASKS.filter((x) => x.band === band && x.lv === lv.n);
        if (tasks.length)
          levels.push({
            id: `${band}-l${lv.n}`,
            title: `Sentence Lab level ${lv.n}: ${lv.en} (grades ${band})`,
            grade: band,
            subject: "",
            domain: "Writing",
            description: lv.goal.en,
            count: tasks.filter((x) => x.kind !== "s").length,
          });
      }
    return [
      ...levels,
      ...M.BOSSES.map((b) => ({
        id: b.id,
        title: `Sentence Lab challenge: ${b.title.en} (grades ${b.band})`,
        grade: b.band,
        subject: "",
        domain: "Writing",
        description: b.intro.en,
        count: b.steps.filter((x) => x.kind !== "s").length,
      })),
    ];
  },

  url: urlFor,

  async extract(ref) {
    const src = await source(ref);
    if (!src) throw new Error("not-found");
    const P = await parser();
    const blocks = src.tasks.map((x, i) => taskQuestion(x, i + 1, src.M, P)).filter(Boolean);
    const spots = src.tasks.filter((x) => x.kind === "s");
    const note = fitNote([
      `Copied from ${src.title} (grades ${src.band}): ${src.tasks.length} tasks, ${spots.length} spot-the-error tasks not carried.`,
      ...spots.map((x) => `Spot the error (not carried): ${text(x.s)}`),
    ]);
    return {
      activity: labActivity({
        title: src.title,
        description: text(src.goal?.en),
        grade: src.band,
        curriculum: "Language Page Sentence Lab",
        objective: text(src.goal?.en),
        sourceNote: `Copied from Sentence Lab ${ref}.`,
        template: "build-explain",
        blocks,
        teacher: note.teacher,
        spanish: true,
      }),
      notes: [
        t(
          "Not carried: spot-the-error taps, word-by-word tiles and the sentence machine. Sentences whose parts repeat or that accept another order are open responses with the answer as the sample.",
          "No se conserva: tocar el error, las fichas palabra por palabra ni la máquina de oraciones. Las oraciones con partes repetidas o que aceptan otro orden son respuestas abiertas con la respuesta como ejemplo.",
        ),
      ],
      source: src.tasks,
      url: urlFor(ref),
      sourceTitle: src.title,
    };
  },
};
