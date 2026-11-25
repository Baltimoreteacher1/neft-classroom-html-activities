// Shared helpers for differentiate.js and transforms.js. Pure, deterministic, no DOM, no network.

import { hashSeed } from "./mathgen/kit.js";
import { LIMITS, isId, normalizeActivity, questionsOf } from "./schema.js";
import { validateActivity } from "./validate.js";

/** A teacher-visible string in both languages. */
export const pair = (en, es) => ({ en, es });

/** Pick the singular or plural pair and fill `{n}`. `en` and `es` are [one, many]. */
export function plural(n, en, es) {
  const pick = (list) => list[n === 1 ? 0 : 1].replace("{n}", String(n));
  return pair(pick(en), pick(es));
}

export const clone = (value) => structuredClone(value);
export const words = (text) =>
  String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

/** Name used for lineage when an activity was made from scratch: the pointer must still say where a copy came from. */
export const STUDIO_FAMILY = "studio";

/** A fresh activity id in the uid style the server and the lineage code expect: s + 10 hex digits. */
export function newActivityId() {
  const bytes = new Uint8Array(5);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return `s${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** An id for an added block that no existing block uses, derived from `base` so it is stable between runs. */
export function freshId(base, taken) {
  const root =
    String(base)
      .replace(/[^a-z0-9_-]/gi, "")
      .slice(0, 26) || "x";
  let id = root;
  for (let n = 2; taken.has(id) || !isId(id); n++) id = `${root}-${n}`.slice(0, 32);
  taken.add(id);
  return id;
}
export const takenIds = (activity) => new Set(activity.blocks.map((b) => b.id));

export const stableNumber = (...parts) => hashSeed(...parts);

// ── text ────────────────────────────────────────────────────────────────────

const ABBREV = /\b(Mr|Mrs|Ms|Dr|St|vs|e\.g|i\.e)\./g;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * Directions cut into short steps. It only SPLITS: at sentence ends, semicolons, " then ", or existing numbered
 * steps. No word is swapped and none is dropped except the "then" the split lands on. Returns [] when the text is
 * already one step.
 */
export function splitSteps(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return [];
  const numbered = raw.split(/(?:^|\n+)\s*\d{1,2}[.)]\s+/).filter((s) => s.trim());
  const parts =
    numbered.length >= 2 && /(?:^|\n)\s*1[.)]\s/.test(raw)
      ? numbered
      : raw
          .replace(/\s+/g, " ")
          .replace(ABBREV, (m) => m.replace(".", "\u0001"))
          .split(/(?<=[.!?])\s+|\s*;\s*/)
          // "if ... then ..." is one idea: only split on "then" when the sentence is not a condition.
          .flatMap((s) =>
            /\b(?:if|when|unless|whenever)\b/i.test(s) ? [s] : s.split(/,?\s+then\s+/i),
          );
  const steps = parts
    .map((s) =>
      s
        .replace(/\u0001/g, ".")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .map((s) => cap(/[.!?:)]$/.test(s) ? s : `${s}.`));
  return steps.length >= 2 ? steps : [];
}
export const stepsText = (steps) => steps.map((s, i) => `${i + 1}. ${s}`).join("\n\n");

/** How many numbered/short steps a directions text already shows. */
export const stepCount = (text) =>
  String(text ?? "")
    .split(/\n{2,}/)
    .filter((p) => p.trim()).length;

/** Mirrors the player's passage chunking (player/blocks.js#chunksOf): parts of about 120 characters. */
export function passageParts(text) {
  const sentences = String(text ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .flatMap((p) => p.split(/(?<=[.!?])\s+/));
  let parts = 0;
  let len = 0;
  for (const s of sentences) {
    len += (len ? 1 : 0) + s.length;
    if (len >= 120) {
      parts += 1;
      len = 0;
    }
  }
  return parts + (len ? 1 : 0);
}

// ── content lookups ─────────────────────────────────────────────────────────

export const blocksOf = (activity, type) => activity.blocks.filter((b) => b.type === type);
export const vocabItems = (activity) =>
  blocksOf(activity, "vocab").flatMap((b) => b.items.filter((v) => v.term.trim() && v.def.trim()));
export const passageText = (activity) =>
  blocksOf(activity, "passage")
    .map((b) => b.text)
    .join("\n\n");
export const hasSpanishData = (activity) =>
  blocksOf(activity, "vocab").some((b) => b.items.some((v) => v.es.trim()));
export const hasImages = (activity) =>
  blocksOf(activity, "vocab").some((b) => b.items.some((v) => v.image?.src)) ||
  questionsOf(activity).some((q) => q.image?.src) ||
  blocksOf(activity, "image").some((b) => b.src);

/** Words in what a student must read: passages, directions and question prompts (the reading-length number). */
export function readingWords(activity) {
  let n = 0;
  for (const b of activity.blocks) {
    if (b.type === "passage") n += words(b.text);
    else if (b.type === "text" && b.role === "directions") n += words(b.text);
    else if (b.type === "question") n += words(b.prompt);
  }
  return n;
}

// ── lineage and fresh copies ────────────────────────────────────────────────

/** Union the ids a customizer added; makes a lineage for a from-scratch activity so the added items stay findable. */
export function withAdded(activity, ids) {
  if (!ids.length) return activity;
  const l = activity.lineage || {
    family: STUDIO_FAMILY,
    ref: activity.id,
    title: activity.title,
    url: "",
    sourceHash: "",
    variantOf: "",
    tier: "",
  };
  activity.lineage = {
    ...l,
    added: [...new Set([...(l.added || []), ...ids])].slice(0, LIMITS.blocks),
  };
  return activity;
}

/** Set the lineage of a new version: keeps family/ref/title/url/sourceHash, points at the source, lists additions. */
export function versionLineage(source, tier, added) {
  const probe = withAdded(clone(source), added);
  const l = probe.lineage || {
    family: STUDIO_FAMILY,
    ref: source.id,
    title: source.title,
    url: "",
    sourceHash: "",
    added: [],
  };
  return { ...l, variantOf: source.id, tier, added: l.added || [] };
}

const SUFFIX =
  /\s*\((?:Emerging|Developing|Expanding|Extension|Exit Ticket|Word Practice|Speaking Task|Writing Task)\)\s*$/;
export function suffixedTitle(title, suffix) {
  const base = String(title || "").replace(SUFFIX, "");
  const tail = ` (${suffix})`;
  return `${base.slice(0, LIMITS.title - tail.length).trimEnd()}${tail}`;
}

/** Error identities of an activity, to prove a change added none. */
export const errorKeys = (activity) =>
  validateActivity(activity).errors.map((e) => `${e.code}:${e.blockId}`);

/** Errors in `next` that `before` did not have. */
export function newErrors(before, next) {
  const had = new Set(errorKeys(before));
  return validateActivity(next).errors.filter((e) => !had.has(`${e.code}:${e.blockId}`));
}

/** Normalize a working copy into a finished activity (fixed point of normalizeActivity). */
export const finish = (draft) => normalizeActivity(draft);

/** Insert `blocks` after the last question (so teacher-only notes stay at the end), or at the end. */
export function insertAfterQuestions(activity, blocks) {
  let at = -1;
  activity.blocks.forEach((b, i) => {
    if (b.type === "question") at = i;
  });
  activity.blocks.splice(at < 0 ? activity.blocks.length : at + 1, 0, ...blocks);
}
