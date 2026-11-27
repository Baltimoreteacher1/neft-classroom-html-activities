// Project Studio · the pure core of the universal Create panel. No DOM, no storage, no network: it runs in Node and in
// the browser. It never invents content. Every resource is built from a platform activity the adapters copied
// (src/studio/adapters) using only the transformations and differentiation presets the Activity Studio already ships
// (src/studio/core/transforms.js, differentiate.js), so the HTML, print/PDF and Word outputs all derive from ONE
// lp-activity/1 model (see access-practice-lab/PROJECT-STUDIO.md).

import { applyPreset } from "../studio/core/differentiate.js";
import { assertRigor } from "../studio/core/differentiate-rigor.js";
import { LIMITS, normalizeActivity, questionsOf } from "../studio/core/schema.js";
import { runTransform, transformStatus } from "../studio/core/transforms.js";
import { validateActivity } from "../studio/core/validate.js";
import { applyRecipe, builtinRecipes } from "../studio/x/recipes.js";
import { applyCreateSupports, cleanSupports } from "./supports.js";

const pair = (en, es) => Object.freeze({ en, es });

/**
 * What a teacher can make. `run` is a transformation id from transforms.js (null = the copied activity as it is).
 * `outputs` lists only exports that really exist for that kind (share.js offers print + Word for worksheet/check).
 */
const CORE_FORMATS = [
  {
    id: "interactive",
    run: "toKind:interactive",
    kind: "interactive",
    label: pair("Interactive activity", "Actividad interactiva"),
    hint: pair(
      "Students answer on a screen and get feedback.",
      "Los estudiantes responden en pantalla y reciben comentarios.",
    ),
  },
  {
    id: "worksheet",
    run: "toKind:worksheet",
    kind: "worksheet",
    label: pair("Worksheet", "Hoja de trabajo"),
    hint: pair(
      "A printable page with a separate answer key.",
      "Una página para imprimir con una clave aparte.",
    ),
  },
  {
    id: "game",
    run: "toKind:game",
    kind: "game",
    label: pair("Learning game", "Juego de aprendizaje"),
    hint: pair(
      "The same questions as a game. No timers.",
      "Las mismas preguntas como juego. Sin cronómetro.",
    ),
  },
  {
    id: "vocab",
    run: "vocabPractice",
    kind: "",
    label: pair("Vocabulary practice", "Práctica de vocabulario"),
    hint: pair(
      "Matching and fill-ins from this page's words.",
      "Emparejar y completar con las palabras de esta página.",
    ),
  },
  {
    id: "check",
    run: "exitTicket",
    kind: "",
    label: pair("Exit ticket", "Boleto de salida"),
    hint: pair(
      "A short check built from these questions.",
      "Una revisión corta hecha con estas preguntas.",
    ),
  },
  {
    id: "speaking",
    run: "speakingTask",
    kind: "",
    label: pair("Speaking task", "Tarea oral"),
    hint: pair(
      "Retell or explain the reading aloud, with frames.",
      "Volver a contar o explicar la lectura en voz alta, con marcos.",
    ),
  },
  {
    id: "writing",
    run: "writingTask",
    kind: "",
    label: pair("Writing task", "Tarea de escritura"),
    hint: pair("A short written response with frames.", "Una respuesta escrita corta con marcos."),
  },
];

/**
 * The Activity Studio's ready-made structure recipes (studio/x/recipes.js, lp-recipe/1) as extra formats: each keeps
 * a proven ORDER of parts (passage, words, question types) and fills it only from this page's own passage and words.
 */
const RECIPE_FORMATS = builtinRecipes().map((r) => ({
  id: `recipe:${r.id}`,
  recipe: r.recipe,
  run: null,
  kind: r.recipe.kind,
  group: "recipe",
  label: r.label,
  hint: r.about,
}));

export const FORMATS = Object.freeze([...CORE_FORMATS, ...RECIPE_FORMATS]);

/** What a structure recipe may use from a page: its own title, passages and word list (never its answers). */
export function recipeSource(base) {
  const blocks = base?.blocks || [];
  return {
    topic: String(base?.title || "").slice(0, 80),
    sourceText: blocks
      .filter((b) => b.type === "passage" && b.text)
      .map((b) => (b.title ? `${b.title}\n\n${b.text}` : b.text))
      .join("\n\n"),
    vocab: blocks
      .filter((b) => b.type === "vocab")
      .flatMap((b) => b.items)
      .filter((v) => v.term && v.def)
      .map((v) => ({ term: v.term, def: v.def })),
  };
}

const recipeRuns = new WeakMap();
/** applyRecipe once per (base, recipe): formatStatus and buildResource share the result. */
function runRecipe(base, f) {
  let byId = recipeRuns.get(base);
  if (!byId) recipeRuns.set(base, (byId = new Map()));
  if (!byId.has(f.id)) byId.set(f.id, applyRecipe(f.recipe, recipeSource(base)));
  return byId.get(f.id);
}

const NO_RECIPE = pair(
  "This page has no reading passage or word list for this recipe to use.",
  "Esta página no tiene una lectura ni una lista de palabras para esta receta.",
);

/** The three simple adjustments. Each value maps to an existing differentiation preset (or none). */
export const ADJUST = Object.freeze({
  support: Object.freeze({
    label: pair("Language support", "Apoyo de lenguaje"),
    values: Object.freeze([
      { id: "standard", preset: "", label: pair("Standard", "Estándar") },
      { id: "more", preset: "language-support", label: pair("More support", "Más apoyo") },
    ]),
  }),
  amount: Object.freeze({
    label: pair("Amount of practice", "Cantidad de práctica"),
    values: Object.freeze([
      { id: "shorter", preset: "shorten", label: pair("Shorter", "Más corta") },
      { id: "standard", preset: "", label: pair("Standard", "Estándar") },
      { id: "more", preset: "extend-practice", label: pair("More practice", "Más práctica") },
    ]),
  }),
  challenge: Object.freeze({
    label: pair("Challenge", "Desafío"),
    values: Object.freeze([
      { id: "standard", preset: "", label: pair("Standard", "Estándar") },
      {
        id: "more",
        preset: "increase-challenge",
        label: pair("Add a challenge", "Agregar un desafío"),
      },
    ]),
  }),
});

export const DEFAULT_ADJUST = Object.freeze({
  support: "standard",
  amount: "standard",
  challenge: "standard",
});

export const formatById = (id) => FORMATS.find((f) => f.id === id) || null;

export function cleanAdjust(input) {
  const a = input && typeof input === "object" ? input : {};
  const out = {};
  for (const [key, spec] of Object.entries(ADJUST))
    out[key] = spec.values.some((v) => v.id === a[key]) ? a[key] : DEFAULT_ADJUST[key];
  return out;
}

/**
 * Every format with whether it can be made from this activity and, when not, why (from transformStatus, so the reason
 * a teacher reads is the same one the Activity Studio gives). A format equal to the activity's own kind is available
 * as "keep the kind".
 */
export function formatStatus(base) {
  const status = new Map(transformStatus(base).map((t) => [t.id, t]));
  return FORMATS.map((f) => {
    if (f.recipe) {
      // offered only when every step was filled from this page: a half-empty recipe is not what the teacher chose
      const out = runRecipe(base, f);
      const ok = Boolean(out.activity) && !out.review.some((r) => r.code === "step-unfilled");
      return { ...f, can: ok, reason: ok ? null : NO_RECIPE };
    }
    if (f.kind && f.kind === base.kind) return { ...f, can: true, reason: null };
    const t = status.get(f.run);
    return { ...f, can: Boolean(t?.can), reason: t?.can ? null : t?.reason || null };
  });
}

export const availableFormats = (base) => formatStatus(base).filter((f) => f.can);

/** The format to show first: the page's own kind when it can be kept, else the first that can run. */
export function defaultFormat(base, preferred = []) {
  const can = availableFormats(base);
  for (const id of preferred) if (can.some((f) => f.id === id)) return id;
  return can.find((f) => f.kind === base.kind)?.id || can[0]?.id || "";
}

/**
 * Build one resource: format first, then the adjustments, each through an existing preset.
 * @returns {{ activity, format, adjust, changes: {en,es}[], warnings: {en,es}[], validation }}
 * Never throws for an activity the adapters produced; a format that cannot run returns the base with a warning.
 */
export function buildResource(base, { format, adjust, supports } = {}) {
  const src = normalizeActivity(base);
  const can = availableFormats(src);
  const asked = can.find((x) => x.id === format);
  const f = asked || formatById(defaultFormat(src));
  const early = [];
  if (format && !asked)
    early.push(pair("That format cannot be made from this page, so the closest one is shown.", "Ese formato no se puede hacer con esta página, así que se muestra el más cercano."));
  const adj = cleanAdjust(adjust);
  const changes = [];
  const warnings = early;
  let a = src;
  if (f?.recipe) {
    const out = runRecipe(src, f);
    if (out.activity)
      a = normalizeActivity({ ...out.activity, id: src.id, lineage: src.lineage, title: src.title });
    for (const r of out.review || []) if (r?.en) warnings.push(pair(r.en, r.es || r.en));
  } else if (f && !(f.kind && f.kind === src.kind)) {
    const out = runTransform(src, f.run);
    if (out.ran === false || out.reason)
      warnings.push(
        out.reason ||
          pair(
            "That format could not be made from this page.",
            "No se pudo hacer ese formato con esta página.",
          ),
      );
    else a = out.activity;
    for (const n of out.notes || []) changes.push(n);
  }
  // order: amount, then challenge, then language support (support must never change the task it is applied to)
  for (const key of ["amount", "challenge", "support"]) {
    const preset = ADJUST[key].values.find((v) => v.id === adj[key])?.preset;
    if (!preset) continue;
    const before = a;
    const out = applyPreset(a, preset);
    a = out.activity;
    changes.push(...(out.changes || []));
    warnings.push(...(out.warnings || []));
    if (key === "support") {
      const r = assertRigor(before, a);
      if (!r.ok)
        warnings.push(
          pair(
            "Language support changed a question. Review it before use.",
            "El apoyo de lenguaje cambió una pregunta. Revísela antes de usarla.",
          ),
        );
    }
  }
  const sup = cleanSupports(supports);
  if (sup.level !== "grade" || sup.on.length) {
    const out = applyCreateSupports(a, sup);
    a = out.activity;
    changes.push(...out.changes);
    warnings.push(...out.warnings);
  }
  return {
    activity: a,
    format: f?.id || "",
    adjust: adj,
    supports: sup,
    changes,
    warnings,
    validation: validateActivity(a),
  };
}

/** Outputs that really exist for an activity of this kind (mirrors the Activity Studio share panel). */
export function outputsFor(activity) {
  const printable = activity.kind === "worksheet" || activity.kind === "check";
  return {
    open: true,
    html: true,
    print: printable,
    docx: printable,
    key: printable && activity.options?.answerKey !== false && questionsOf(activity).length > 0,
  };
}

// ── packets ─────────────────────────────────────────────────────────────────

const blockKey = (b) => {
  const { id, ...rest } = b;
  return JSON.stringify(rest);
};

/**
 * Combine several built resources into ONE printable lp-activity (a worksheet), so one PDF and one Word file come from
 * the same model. Each part starts with a heading; identical blocks (the same word list or directions copied from
 * two pages) appear once; nothing is rewritten. Stops at the schema's block limit and reports what did not fit.
 * @param {{ title: string, activity: object }[]} parts
 * @returns {{ activity, included: number, skippedBlocks: number, duplicateBlocks: number }}
 */
export function packetActivity(parts, { title = "Resource packet", id } = {}) {
  const list = (Array.isArray(parts) ? parts : []).filter((p) => p?.activity);
  const seen = new Set();
  const blocks = [];
  const teacher = [];
  const misconceptions = [];
  let skipped = 0;
  let duplicate = 0;
  let included = 0;
  let first = null;
  list.forEach((part, i) => {
    const a = normalizeActivity(part.activity);
    first ||= a;
    const room = LIMITS.blocks - blocks.length;
    if (room < 2) {
      skipped += a.blocks.length;
      return;
    }
    included += 1;
    blocks.push({ type: "text", role: "heading", text: `Part ${i + 1}: ${part.title || a.title}` });
    for (const b of a.blocks) {
      if (b.type !== "question") {
        const key = blockKey(b);
        if (seen.has(key)) {
          duplicate += 1;
          continue;
        }
        seen.add(key);
      }
      if (blocks.length >= LIMITS.blocks) {
        skipped += 1;
        continue;
      }
      blocks.push({ ...b, id: `p${i + 1}${b.id}`.slice(0, 40) });
    }
    if (a.notes.teacher) teacher.push(`Part ${i + 1}: ${a.notes.teacher}`);
    misconceptions.push(...a.notes.misconceptions);
  });
  const activity = normalizeActivity({
    ...(id ? { id } : {}),
    title,
    description: `${included} part${included === 1 ? "" : "s"} assembled in Create.`,
    kind: "worksheet",
    context: first
      ? {
          ...first.context,
          source: { origin: "teacher", note: "Assembled from several resources." },
        }
      : {},
    supports: first?.supports,
    options: { answerKey: true },
    blocks,
    notes: {
      teacher: teacher.join("\n").slice(0, 2000),
      misconceptions: misconceptions.slice(0, 8),
    },
  });
  return { activity, included, skippedBlocks: skipped, duplicateBlocks: duplicate };
}
