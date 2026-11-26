// Intelligent resource variants: a new copy of an activity with different numbers, a different order, or a different
// story setting. Pure and deterministic: the same seed gives byte-identical output; nothing reads a clock or Math.random.
//
//   makeVariant(activity, { seed, mode: "numbers" | "reorder" | "context" }, deps?)
//     -> { activity, changes[], skipped[], review[], seed, mode, equivalence: "not-claimed", note: {en, es} }
//
// A variant is never claimed to be equivalent to the original (difficulty, reading load and distractors can all
// differ), and the original is never modified. `deps` is for tests and servers: { generate, topics, strict, uid }.

import { hashSeed } from "../core/mathgen/kit.js";
import { normalizeActivity } from "../core/schema.js";
import { validateActivity } from "../core/validate.js";
import { T } from "./inspect-text.js";
import { contextVariant } from "./variants-context.js";
import { numbersVariant } from "./variants-numbers.js";
import { reorderVariant } from "./variants-reorder.js";

export const VARIANT_MODES = Object.freeze(["numbers", "reorder", "context"]);

const NOTE = T(
  "This is a variant, not a copy of the same test: difficulty, reading load and wrong answers may differ from the original. Do not compare scores between versions as if they were equal.",
  "Esto es una variante, no una copia de la misma prueba: la dificultad, la carga de lectura y las respuestas incorrectas pueden diferir del original. No compare los puntajes entre versiones como si fueran iguales.",
);

/** Deterministic by default (so a seed reproduces the bytes); pass deps.uid = schema.uid for random ids. */
const defaultId = (a, seed, mode) => `a${hashSeed(a.id, a.rev, seed, mode).toString(36)}`;

export function makeVariant(activity, options = {}, deps = {}) {
  const { seed, mode } = options;
  if (!Number.isInteger(seed)) throw new TypeError("makeVariant: seed must be an integer");
  if (!VARIANT_MODES.includes(mode)) throw new RangeError(`makeVariant: unknown mode ${mode}`);
  const base = normalizeActivity(structuredClone(activity));
  if (!validateActivity(base).ok)
    throw new Error("makeVariant: the activity has errors; fix them (see inspectResource) first");

  const part =
    mode === "numbers"
      ? numbersVariant(base, seed, deps)
      : mode === "reorder"
        ? reorderVariant(base, seed)
        : contextVariant(base, seed);

  const line = `Variant (${mode}, seed ${seed}) of "${base.title}". Equivalence not claimed. / Variante (${mode}, semilla ${seed}) de «${base.title}». Equivalencia no declarada.`;
  const teacher = [base.notes.teacher, line].filter(Boolean).join("\n");
  const next = normalizeActivity({
    ...base,
    id: deps.uid ? deps.uid("a") : defaultId(base, seed, mode),
    rev: 0,
    createdAt: 0,
    updatedAt: 0,
    title: part.title ?? base.title,
    description: part.description ?? base.description,
    lineage: base.lineage ? { ...base.lineage, variantOf: base.id } : null,
    notes: { ...base.notes, teacher: teacher.length <= 2000 ? teacher : base.notes.teacher },
    blocks: part.blocks,
  });
  const check = validateActivity(next);
  if (!check.ok) throw new Error(`makeVariant: the variant is not valid (${check.errors[0].code})`);
  return {
    activity: next,
    changes: part.changes,
    skipped: part.skipped,
    review: part.review ?? [],
    seed,
    mode,
    equivalence: "not-claimed",
    note: NOTE,
  };
}
