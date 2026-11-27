// Parallel differentiation workspace, the pure half: the version cards the compare panel shows. Everything here comes
// from the differentiation engine (core/differentiate*.js): its tiers, its change records, its rigor check and its
// comparison table, plus wave-1 makeVariant. No DOM, no storage, no network; nothing is invented.
//
// The engine offers four tiers (emerging, developing, expanding, extension) and a "shorten" preset. It has no
// large-print or bilingual-only version (Spanish and pictures are part of the Emerging tier's supports), and the
// way support FADES is across tiers: sentence frames go from full to partial to none. This file reports those facts
// from the engine's own numbers and does not add versions the engine cannot make.

import { applyPreset, assertRigor, compareVersions, makeVersions } from "../core/differentiate.js";
import {
  finish,
  newActivityId,
  pair,
  passageText,
  plural,
  suffixedTitle,
  versionLineage,
  vocabItems,
  blocksOf,
} from "../core/differentiate-util.js";
import { TIERS, questionsOf } from "../core/schema.js";
import { makeVariant } from "../x/variants.js";

export const TIER_TITLE = Object.freeze({
  emerging: pair("More language support", "Más apoyo de lenguaje"),
  developing: pair("Some language support", "Algo de apoyo de lenguaje"),
  expanding: pair("Greater independence", "Mayor independencia"),
  extension: pair("Enrichment", "Enriquecimiento"),
});
export const STANDARD_TITLE = pair("Standard (your activity)", "Estándar (tu actividad)");
export const SHORTER_TITLE = pair("Shorter practice", "Práctica más corta");

const SCAFFOLD_KEYS = [
  "frameCount",
  "wordBank",
  "hints",
  "readAloud",
  "chunk",
  "spanish",
  "visuals",
];

const directionsText = (a) =>
  blocksOf(a, "text")
    .filter((b) => b.role === "directions")
    .map((b) => b.text)
    .join("\n");

/** What provably stayed the same: each line is computed from the two activities, never assumed. */
export function stayedSame(original, version, rigor) {
  const codes = new Set(rigor.problems.map((p) => p.code));
  const out = [];
  const kept = questionsOf(original).length;
  if (kept && !codes.has("dropped") && !codes.has("reordered") && !codes.has("format"))
    out.push(
      plural(
        kept,
        [
          "{n} question is still there.",
          "All {n} original questions are still there, in the same order.",
        ],
        ["{n} pregunta sigue ahí.", "Siguen las {n} preguntas originales, en el mismo orden."],
      ),
    );
  if (!codes.has("prompt") && !codes.has("dropped"))
    out.push(
      pair("Every question is worded the same.", "Todas las preguntas tienen el mismo texto."),
    );
  if (!codes.has("key") && !codes.has("dropped"))
    out.push(
      pair(
        "Answer choices and answer keys are the same.",
        "Las opciones y las claves de respuestas son las mismas.",
      ),
    );
  if (!codes.has("objective"))
    out.push(
      pair(
        "The objective, standards and unit are the same.",
        "El objetivo, los estándares y la unidad son los mismos.",
      ),
    );
  if (passageText(original) && passageText(original) === passageText(version))
    out.push(pair("The reading passage is the same.", "El texto de lectura es el mismo."));
  if (directionsText(original) && directionsText(original) === directionsText(version))
    out.push(
      pair("The directions are worded the same.", "Las instrucciones tienen el mismo texto."),
    );
  const terms = (a) =>
    vocabItems(a)
      .map((v) => v.term)
      .join("|");
  if (terms(original) && terms(original) === terms(version))
    out.push(
      pair("The vocabulary words are the same.", "Las palabras de vocabulario son las mismas."),
    );
  return out;
}

function supportAt(compare, index) {
  const row = (key) => compare.rows.find((r) => r.key === key)?.values[index];
  return Object.fromEntries(SCAFFOLD_KEYS.map((k) => [k, row(k)]));
}

function record({
  key,
  kind,
  title,
  tier = "",
  activity,
  original,
  changes,
  warnings,
  compare,
  index,
  extra = {},
}) {
  const rigor = assertRigor(original, activity);
  return {
    key,
    kind,
    tier,
    title,
    activity,
    changes,
    warnings,
    rigor,
    same: stayedSame(original, activity, rigor),
    support: supportAt(compare, index),
    saved: "",
    ...extra,
  };
}

/** The shorter-practice version, or null (with the engine's reason) when the engine cannot shorten this activity. */
function shorterVersion(original, deps) {
  const shortened = applyPreset(original, "shorten");
  if (!shortened.changes.length) return { card: null, why: shortened.warnings };
  const a = {
    ...shortened.activity,
    id: (deps.newId || newActivityId)(),
    rev: 0,
    createdAt: 0,
    updatedAt: 0,
    title: suffixedTitle(original.title, "Shorter"),
    lineage: versionLineage(original, "", []),
  };
  return {
    card: { activity: finish(a), changes: shortened.changes, warnings: shortened.warnings },
  };
}

/**
 * Standard + one card per engine tier (+ shorter practice when it applies).
 * @param {object} original  the activity being edited (never changed)
 * @param {{newId?: Function, tiers?: string[]}} deps
 * @returns {{ cards: object[], fading: object|null, notes: {en,es}[] }}
 */
export function makeCards(original, deps = {}) {
  const built = makeVersions(original, deps.tiers || TIERS, deps);
  const shorter = shorterVersion(original, deps);
  const all = [
    original,
    ...built.map((v) => v.activity),
    ...(shorter.card ? [shorter.card.activity] : []),
  ];
  const compare = compareVersions(all);
  const standard = {
    key: "standard",
    kind: "standard",
    tier: "",
    title: STANDARD_TITLE,
    activity: original,
    changes: [],
    warnings: [],
    rigor: { ok: true, problems: [] },
    same: [],
    support: supportAt(compare, 0),
    saved: "",
  };
  const cards = [standard];
  built.forEach((v, i) =>
    cards.push(
      record({
        key: v.tier,
        kind: "tier",
        title: TIER_TITLE[v.tier],
        tier: v.tier,
        activity: v.activity,
        original,
        changes: v.changes.slice(1),
        warnings: v.warnings,
        compare,
        index: i + 1,
        extra: { about: v.changes[0] },
      }),
    ),
  );
  if (shorter.card)
    cards.push(
      record({
        key: "shorter",
        kind: "shorter",
        title: SHORTER_TITLE,
        activity: shorter.card.activity,
        original,
        changes: shorter.card.changes,
        warnings: shorter.card.warnings,
        compare,
        index: all.length - 1,
      }),
    );
  return { cards, fading: fadingOf(cards), notes: shorter.card ? [] : shorter.why };
}

/** How support fades across the tiers, from the engine's own counts; null unless it really does fade. */
export function fadingOf(cards) {
  const tiers = cards.filter((c) => c.kind === "tier");
  const values = tiers.map((c) => Number(c.support.frameCount) || 0);
  if (tiers.length < 2 || values[0] <= values[values.length - 1]) return null;
  const falling = values.every((v, i) => i === 0 || v <= values[i - 1]);
  return falling ? { frames: tiers.map((c, i) => ({ title: c.title, count: values[i] })) } : null;
}

/** "Another version of this": makeVariant as a card. Never claimed equivalent; the seed is shown. */
export function variantCard(original, { seed, mode }, deps = {}) {
  const v = makeVariant(original, { seed, mode }, deps);
  const compare = compareVersions([original, v.activity]);
  const rigor = assertRigor(original, v.activity);
  return {
    key: `variant-${mode}-${seed}`,
    kind: "variant",
    tier: "",
    title: pair(`Another version (${mode})`, `Otra versión (${mode})`),
    activity: v.activity,
    changes: v.changes.map((c) => c.message),
    skipped: v.skipped.map((s) => s.reason),
    review: v.review.map((r) => r.message),
    warnings: [],
    rigor: { ok: true, problems: [] }, // differences are the point; equivalence is explicitly not claimed
    same: stayedSame(original, v.activity, rigor),
    support: supportAt(compare, 1),
    seed: v.seed,
    mode: v.mode,
    note: v.note,
    saved: "",
  };
}
