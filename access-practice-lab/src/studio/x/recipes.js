// Teacher Resource Recipes (schema `lp-recipe/1`): the STRUCTURE of an activity a teacher liked, reusable for another
// topic. A recipe keeps the kind and template, the differentiation tier, the support settings and the ORDER of the
// activity's parts (block kinds, question formats). It never keeps a topic word, a passage, a question, an answer or an
// image, so nothing from one topic can leak into the next.
//
//   normalizeRecipe(input)               the only way a recipe enters: caps sizes, strips unknown fields (null if not ours)
//   recipeFromActivity(activity, name)   capture the structure of an existing activity
//   applyRecipe(recipe, source, deps)    build a new activity for another topic from the source's own content
//   builtinRecipes()                     six starting recipes, each step one the studio's model can really express
//
// applyRecipe builds with the same machinery as Create (buildActivity, the verified math generators, the challenge
// items of the writing transforms) and then places the results into the recipe's slots. A slot is filled only by a
// compatible component (a "choice" slot by a choice question, a word-list slot by the source's own words with
// meanings). A slot nothing compatible can fill stays empty and is listed in `review[]`; nothing is substituted.
//
// source: { sourceText?, parsed?, vocab?, seed?, terms?, topic?, mathTopics?, grade?, subject?, activityContext? }
// deps:   { newId, seed }

import { challengeItems } from "../core/differentiate-extension.js";
import { makeVersion } from "../core/differentiate.js";
import { pair } from "../core/differentiate-util.js";
import { mathSet } from "../core/mathgen.js";
import { hashSeed } from "../core/mathgen/kit.js";
import {
  FORMATS,
  KINDS,
  TEMPLATES,
  TIERS,
  clip,
  isId,
  normalizeActivity,
  questionsOf,
} from "../core/schema.js";
import { validateActivity } from "../core/validate.js";
import {
  buildFromSource,
  mathTopicsFor,
  prepareSource,
  reviewFromValidation,
  stableIds,
  applyRequested,
} from "./intent-build.js";

export const RECIPE_SCHEMA = "lp-recipe/1";
const MAX_STEPS = 14;
const MAX_COUNT = 8;
const STEP_BLOCKS = [
  "directions",
  "vocab",
  "passage",
  "organizer",
  "math",
  "table",
  "image",
  "audio",
  "text",
  "question",
];
const ORGANIZERS = ["kwl", "compare", "cause-effect", "claim-evidence", "web", "sequence"];
const SUPPORT_FLAGS = ["visuals", "spanish", "readAloud", "frames", "hints", "chunk"];
const LOOK = { interactive: "calm", worksheet: "classic", game: "adventure", check: "calm" };

const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function cleanStep(raw) {
  if (!raw || typeof raw !== "object" || !STEP_BLOCKS.includes(raw.block)) return null;
  const step = { block: raw.block, count: 1 };
  if (raw.block === "question") {
    if (!FORMATS.includes(raw.format)) return null;
    step.format = raw.format;
    if (raw.format === "short" && (raw.variant === "explain" || raw.variant === "write"))
      step.variant = raw.variant;
    step.count = Math.max(1, Math.min(MAX_COUNT, Math.floor(Number(raw.count)) || 1));
  }
  if (raw.block === "organizer")
    step.organizer = ORGANIZERS.includes(raw.organizer) ? raw.organizer : "web";
  return step;
}

/** The only entry point for a recipe. Returns a complete, safe recipe, or null when `input` is not an lp-recipe/1. */
export function normalizeRecipe(input) {
  if (!input || typeof input !== "object") return null;
  if (input.schema !== undefined && input.schema !== RECIPE_SCHEMA) return null;
  const kind = KINDS.includes(input.kind) ? input.kind : "interactive";
  const sup = input.supports && typeof input.supports === "object" ? input.supports : {};
  const body = {
    kind,
    template: TEMPLATES[kind].some((t) => t.id === input.template)
      ? input.template
      : TEMPLATES[kind][0].id,
    tier: TIERS.includes(input.tier) ? input.tier : "",
    supports: {
      wida: [0, 1, 2, 3, 4, 5, 6].includes(Number(sup.wida)) ? Number(sup.wida) : 0,
      ...Object.fromEntries(
        SUPPORT_FLAGS.map((k) => [k, k === "hints" ? sup.hints !== false : sup[k] === true]),
      ),
    },
    steps: list(input.steps, MAX_STEPS * 4)
      .map(cleanStep)
      .filter(Boolean)
      .slice(0, MAX_STEPS),
  };
  return {
    schema: RECIPE_SCHEMA,
    id: isId(input.id) ? input.id : `r${hashSeed(JSON.stringify(body)).toString(36)}`,
    name: clip(input.name, 80).trim() || "My recipe",
    ...body,
  };
}

/** Capture the structure of an activity: order of parts, question formats, supports, kind/template and tier. */
export function recipeFromActivity(activity, name = "") {
  const a = normalizeActivity(activity);
  const steps = [];
  for (const b of a.blocks) {
    let step = null;
    if (b.type === "note") continue;
    if (b.type === "text") step = { block: b.role === "directions" ? "directions" : "text" };
    else if (b.type === "organizer") step = { block: "organizer", organizer: b.kind };
    else if (b.type === "question")
      step = { block: "question", format: b.format, variant: b.format === "short" ? b.kind : "" };
    else step = { block: b.type };
    const last = steps[steps.length - 1];
    if (
      last &&
      step.block === "question" &&
      last.block === "question" &&
      last.format === step.format &&
      last.variant === step.variant
    )
      last.count = Math.min(MAX_COUNT, (last.count || 1) + 1);
    else steps.push({ ...step, count: 1 });
  }
  return normalizeRecipe({
    name,
    kind: a.kind,
    template: a.template,
    tier: a.lineage?.tier || "",
    supports: a.supports,
    steps,
  });
}

// ── applying ────────────────────────────────────────────────────────────────

const STEP_NAME = {
  directions: pair("directions", "instrucciones"),
  vocab: pair("word list", "lista de palabras"),
  passage: pair("reading passage", "texto de lectura"),
  organizer: pair("organizer", "organizador"),
  math: pair("worked example", "ejemplo resuelto"),
  table: pair("table", "tabla"),
  image: pair("picture", "imagen"),
  audio: pair("listen-first audio", "audio para escuchar primero"),
  text: pair("text block", "bloque de texto"),
};
const FORMAT_NAME = {
  choice: pair("multiple choice", "opción múltiple"),
  multi: pair("select all", "selección múltiple"),
  match: pair("matching", "emparejar"),
  sort: pair("sorting", "clasificar"),
  order: pair("ordering", "ordenar"),
  blank: pair("fill in the blank", "completar"),
  number: pair("number answer", "respuesta numérica"),
  short: pair("written response", "respuesta escrita"),
  identify: pair("identify in text", "identificar en el texto"),
  hotspot: pair("picture hotspot", "zona de imagen"),
  numberline: pair("number line", "recta numérica"),
  build: pair("build a sentence", "construir una oración"),
  error: pair("error analysis", "análisis de errores"),
  fillTable: pair("fill the table", "completar la tabla"),
  plot: pair("plot points", "marcar puntos"),
};
const REASON = {
  vocab: pair("it needs words with meanings", "necesita palabras con significados"),
  passage: pair(
    "it needs a reading passage of about 25 words or more",
    "necesita un texto de lectura de unas 25 palabras o más",
  ),
  audio: pair(
    "it needs a reading passage to read aloud",
    "necesita un texto de lectura para leer en voz alta",
  ),
  math: pair(
    "it needs a math topic or typed problems so an answer can be calculated",
    "necesita un tema de matemáticas o problemas escritos para poder calcular una respuesta",
  ),
  own: pair(
    "the studio never makes up your own table, picture or text for you; add it yourself",
    "el estudio nunca inventa por ti una tabla, una imagen o un texto; agrégalo tú",
  ),
  question: pair(
    "this content cannot make a question of that kind that checks correctly",
    "este contenido no puede hacer una pregunta de ese tipo que se compruebe correctamente",
  ),
};
const nameOf = (step) =>
  step.block === "question" ? FORMAT_NAME[step.format] : STEP_NAME[step.block];

function unfilled(index, step, reason, partial) {
  const n = nameOf(step);
  return {
    code: partial ? "step-partial" : "step-unfilled",
    step: index + 1,
    en: partial
      ? `Step ${index + 1} (${n.en}) is only partly filled: ${reason.en}`
      : `Step ${index + 1} (${n.en}) was left empty: ${reason.en}.`,
    es: partial
      ? `El paso ${index + 1} (${n.es}) quedó solo en parte: ${reason.es}`
      : `El paso ${index + 1} (${n.es}) quedó vacío: ${reason.es}.`,
  };
}

/** Short written items the source's own text or words can support (the same ones the writing transforms use). */
function writtenPool(prep) {
  const blocks = [];
  if (prep.parsed.passage)
    blocks.push({ id: "w-passage", type: "passage", title: "", text: prep.parsed.passage });
  if (prep.vocab.length >= 2)
    blocks.push({ id: "w-vocab", type: "vocab", items: prep.vocab.slice(0, 12) });
  if (!blocks.length) return [];
  const tmp = normalizeActivity({ kind: "interactive", blocks });
  return challengeItems(tmp, { taken: new Set(tmp.blocks.map((b) => b.id)) }).questions;
}

/** Leading whole sentences of a passage that fit a listen-first audio block. */
function leadSentences(text, max = 600) {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return { say: s, cut: false };
  const cut = s.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return { say: end > 80 ? cut.slice(0, end + 1) : cut, cut: true };
}

/** A worked example from a question whose answer was CALCULATED (it carries its expression): the problem and its solution. */
function modelFrom(q) {
  if (q.format !== "number" || !q.expr) return null;
  const solve = /^Solve:\s*(.+)$/.exec(q.prompt);
  const answer = /^-?\d+\/\d+$/.test(q.answer) ? `{${q.answer}}` : q.answer;
  const text = q.explanation ? `${q.prompt} ${q.explanation}` : solve ? `${solve[1]} = ${answer}` : "";
  return text && text.length <= 400 ? { type: "math", text, caption: "" } : null;
}

const neutral = {
  interactive: "explore-practice",
  worksheet: "guided",
  game: "quest",
  check: "skill-check",
};

function organizerPrompts(step, prep) {
  if (step.organizer === "web") return prep.vocab.slice(0, 6).map((v) => v.term);
  if (step.organizer === "compare") return prep.parsed.categories.slice(0, 2).map((c) => c.label);
  return [];
}

/** Place the pooled components into the recipe's slots, in order. Returns the raw blocks and what could not be filled. */
function fillSteps(r, prep, pool, directions) {
  const blocks = [];
  const review = [];
  const used = new Set();
  const take = (step) =>
    pool
      .filter(
        (q) =>
          !used.has(q) && q.format === step.format && (!step.variant || q.kind === step.variant),
      )
      .slice(0, step.count);
  r.steps.forEach((step, i) => {
    const miss = (reason, partial) => review.push(unfilled(i, step, reason, partial));
    if (step.block === "directions") return directions ? blocks.push(directions) : miss(REASON.own);
    if (step.block === "vocab")
      return prep.vocab.length
        ? blocks.push({ type: "vocab", items: prep.vocab.slice(0, 12) })
        : miss(REASON.vocab);
    if (step.block === "passage")
      return prep.parsed.passage
        ? blocks.push({ type: "passage", title: "", text: prep.parsed.passage })
        : miss(REASON.passage);
    if (step.block === "organizer")
      return blocks.push({
        type: "organizer",
        kind: step.organizer,
        prompts: organizerPrompts(step, prep),
      });
    if (step.block === "audio") {
      if (!prep.parsed.passage) return miss(REASON.audio);
      const { say, cut } = leadSentences(prep.parsed.passage);
      blocks.push({ type: "audio", say, label: "Listen first" });
      if (cut)
        review.push({
          code: "audio-trimmed",
          step: i + 1,
          en: `Step ${i + 1}: the listen-first audio plays only the first sentences of the passage.`,
          es: `Paso ${i + 1}: el audio para escuchar primero reproduce solo las primeras oraciones del texto.`,
        });
      return;
    }
    if (step.block === "math") {
      const q = pool.find((p) => !used.has(p) && modelFrom(p));
      if (!q) return miss(REASON.math);
      used.add(q);
      return blocks.push(modelFrom(q));
    }
    if (step.block !== "question") return miss(REASON.own);
    const got = take(step);
    got.forEach((q) => used.add(q));
    blocks.push(...got);
    if (!got.length) miss(REASON.question);
    else if (got.length < step.count)
      miss(
        pair(
          `it asked for ${step.count} but the content made ${got.length}.`,
          `pedía ${step.count} pero el contenido hizo ${got.length}.`,
        ),
        true,
      );
  });
  return { blocks, review };
}

const INVALID = {
  code: "bad-recipe",
  en: "This is not a recipe the studio can read (lp-recipe/1).",
  es: "Esta no es una receta que el estudio pueda leer (lp-recipe/1).",
};

/**
 * Build a new activity for another topic from `source`, following the recipe's structure.
 * @returns {{ activity: object|null, review: {code,en,es,step?}[] }}
 *  `activity` passes normalizeActivity and validateActivity (ok), or is null with the reasons in `review`. Steps that
 *  could not be filled are `step-unfilled` / `step-partial` items; their content is never replaced by something else.
 */
export function applyRecipe(recipe, source = {}, deps = {}) {
  const r = normalizeRecipe(recipe);
  if (!r) return { activity: null, review: [INVALID] };
  const topic = String(source.topic || "").slice(0, 80);
  const mathTopics = Array.isArray(source.mathTopics)
    ? source.mathTopics
    : mathTopicsFor(topic, source);
  const prep = prepareSource({ ...source, request: "" }, { terms: source.terms || [], mathTopics });
  const asked = r.steps.reduce((n, s) => n + (s.block === "question" ? s.count : 0), 0);
  const plan = {
    kind: r.kind,
    template: neutral[r.kind],
    terms: source.terms || [],
    topic: "",
    count: 60,
    mathCount: Math.max(12, asked + 6),
    mathTopics,
    supports: [],
    versions: [],
    wida: 0,
  };
  const built = buildFromSource(plan, source, deps, prep).activity;
  const directions = built.blocks.find((b) => b.type === "text" && b.role === "directions");
  const pool = [...questionsOf(built), ...writtenPool(prep)];
  const ex = source.seed?.exitTicket;
  if (ex?.prompt)
    pool.push({
      type: "question",
      format: "short",
      kind: "explain",
      prompt: ex.prompt,
      frame: ex.frame || "",
      sample: "",
      rubric: ["Uses the target frame", `Uses key words: ${(ex.vocab || []).join(", ")}`],
      minWords: 5,
      skill: "explain thinking",
    });

  const { blocks, review: gaps } = fillSteps(r, prep, pool, directions);
  const review = [...prep.review, ...gaps];
  if (!blocks.some((b) => b.type === "question"))
    return {
      activity: null,
      review: [
        ...review,
        {
          code: "no-questions",
          en: "No question could be made from this content, so there is nothing to build yet. Add words with meanings, questions, a passage or a math topic.",
          es: "No se pudo hacer ninguna pregunta con este contenido, así que todavía no hay nada que construir. Agrega palabras con significados, preguntas, un texto o un tema de matemáticas.",
        },
      ],
    };

  const draft = normalizeActivity({
    title: topic ? `${cap(topic)}: ${r.name}` : r.name,
    kind: r.kind,
    template: r.template,
    context: built.context,
    supports: { wida: 0 },
    look: { style: LOOK[r.kind] },
    blocks,
    notes: built.notes,
  });
  const names = SUPPORT_FLAGS.filter((k) => r.supports[k] && k !== "hints");
  const sup = applyRequested(draft, { wida: r.supports.wida, supports: names });
  sup.activity.supports.hints = r.supports.hints;
  const activity = stableIds(normalizeActivity(sup.activity), deps);
  review.push(...sup.review);
  const check = validateActivity(activity);
  if (!check.ok) return { activity: null, review: [...review, ...reviewFromValidation(check)] };
  if (!r.tier) return { activity, review };
  const tiered = makeVersion(activity, r.tier, deps);
  review.push(...tiered.warnings.map((w) => ({ code: "tier-warning", ...w })));
  return { activity: tiered.activity, review };
}

// ── built-in recipes ────────────────────────────────────────────────────────

const dir = { block: "directions" };
const q = (format, count = 1, variant = "") => ({
  block: "question",
  format,
  count,
  ...(variant ? { variant } : {}),
});

const BUILTINS = [
  {
    id: "visual-vocab-practice-exit",
    label: pair(
      "Visual vocabulary, interactive practice, exit ticket",
      "Vocabulario visual, práctica interactiva y boleto de salida",
    ),
    about: pair(
      "A word list (with pictures when you have added them), matching, choice and fill-in practice, then a short written exit response built from the same words. Pictures are shown only if the words already have them.",
      "Una lista de palabras (con imágenes si ya las agregaste), práctica de emparejar, opción y completar, y una respuesta escrita de salida hecha con las mismas palabras. Las imágenes solo se muestran si las palabras ya las tienen.",
    ),
    recipe: {
      kind: "interactive",
      template: "match-sort",
      supports: { visuals: true },
      steps: [
        dir,
        { block: "vocab" },
        q("match"),
        q("choice", 3),
        q("blank", 2),
        q("short", 1, "explain"),
      ],
    },
  },
  {
    id: "science-evidence-writing",
    label: pair(
      "Science investigation, evidence table, writing task",
      "Investigación de ciencias, tabla de evidencia y tarea de escritura",
    ),
    about: pair(
      "Your investigation text, a claim-evidence organizer for the evidence table, then evidence-based written responses. The studio does not write the investigation or its data: add your own text.",
      "Tu texto de la investigación, un organizador de afirmación y evidencia como tabla de evidencia, y respuestas escritas con evidencia. El estudio no escribe la investigación ni sus datos: agrega tu propio texto.",
    ),
    recipe: {
      kind: "worksheet",
      template: "reading-writing",
      supports: { frames: true },
      steps: [
        dir,
        { block: "passage" },
        { block: "organizer", organizer: "claim-evidence" },
        q("short", 1, "explain"),
        q("short", 1, "write"),
      ],
    },
  },
  {
    id: "reading-vocab-comprehension",
    label: pair(
      "Reading passage, vocabulary, comprehension questions",
      "Texto de lectura, vocabulario y preguntas de comprensión",
    ),
    about: pair(
      "Your passage, its word list, then questions made from the text itself: find the words, fill in missing words, put events in order and explain the main idea.",
      "Tu texto, su lista de palabras y preguntas hechas con el propio texto: encontrar las palabras, completar palabras, ordenar sucesos y explicar la idea principal.",
    ),
    recipe: {
      kind: "interactive",
      template: "interactive-reading",
      steps: [
        dir,
        { block: "passage" },
        { block: "vocab" },
        q("identify"),
        q("blank", 2),
        q("order"),
        q("short", 1, "explain"),
      ],
    },
  },
  {
    id: "speaking-frames-response",
    label: pair(
      "Speaking rehearsal, sentence frames, independent response",
      "Ensayo oral, marcos de oraciones y respuesta independiente",
    ),
    about: pair(
      "Hear the first part of your passage, read it with its words, rehearse by explaining it to a partner (a written explanation with a sentence frame), then write an independent response. The studio never scores speaking.",
      "Escuchar la primera parte de tu texto, leerlo con sus palabras, ensayar explicándolo a un compañero (una explicación escrita con un marco de oración) y luego escribir una respuesta independiente. El estudio nunca califica la expresión oral.",
    ),
    recipe: {
      kind: "interactive",
      template: "build-explain",
      supports: { frames: true, readAloud: true },
      steps: [
        dir,
        { block: "audio" },
        { block: "passage" },
        { block: "vocab" },
        q("short", 1, "explain"),
        q("short", 1, "write"),
      ],
    },
  },
  {
    id: "math-model-error-practice",
    label: pair(
      "Math model, error analysis, fresh practice",
      "Modelo matemático, análisis de errores y práctica nueva",
    ),
    about: pair(
      "A worked example with a calculated answer, an error-analysis item, then fresh practice problems. All problems come from the verified math generators or from problems you typed; every answer is calculated.",
      "Un ejemplo resuelto con respuesta calculada, un ítem de análisis de errores y problemas de práctica nuevos. Todos los problemas vienen de los generadores verificados o de problemas que escribiste; cada respuesta se calcula.",
    ),
    recipe: {
      kind: "worksheet",
      template: "guided",
      steps: [dir, { block: "math" }, q("error"), q("number", 3), q("choice", 2)],
    },
  },
  {
    id: "small-group-guided-transfer",
    label: pair(
      "Small-group explanation, guided activity, transfer task",
      "Explicación en grupo pequeño, actividad guiada y tarea de transferencia",
    ),
    about: pair(
      "The explanation text your group reads together, its words, a guided activity (choice, fill-in, ordering) with hints and sentence frames, then a written transfer response. The studio cannot write a new context for the transfer task: it asks for a written response from your own text or words.",
      "El texto de explicación que el grupo lee junto, sus palabras, una actividad guiada (opción, completar, ordenar) con pistas y marcos de oraciones, y una respuesta escrita de transferencia. El estudio no puede escribir un contexto nuevo para la transferencia: pide una respuesta escrita con tu propio texto o palabras.",
    ),
    recipe: {
      kind: "interactive",
      template: "build-explain",
      supports: { frames: true, chunk: true },
      steps: [
        dir,
        { block: "passage" },
        { block: "vocab" },
        q("choice", 2),
        q("blank"),
        q("order"),
        q("short", 1, "write"),
      ],
    },
  },
];

/** Six starting recipes: [{ id, label, about, recipe }] (recipe is normalized; label/about are { en, es }). */
export function builtinRecipes() {
  return BUILTINS.map((b) => ({
    id: b.id,
    label: b.label,
    about: b.about,
    recipe: normalizeRecipe({ ...b.recipe, id: b.id, name: b.label.en }),
  }));
}
