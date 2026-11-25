// Content schema v2: block-level provenance + independent review dimensions.
// Single definition shared by server, client, generators and tests. No Node-only imports (browser safe).
//
// A "block" is { schemaVersion: 2, kind, id, content, provenance, review }.
//   content    the authored payload, byte-for-byte what schema v1 stored (never edited by migration)
//   provenance { origin, generator, generatedAt, sourceRefs[], version, supersedes, contentHash }
//   review     { pedagogy, language_qa, accessibility, bias_sensitivity, math_science_accuracy, translation: { [lang]: dim } }
//              dim = { state, reviewers: [{ name, role, date, actor: "human" }], reviewedHash }

export const SCHEMA_VERSION = 2;
export const KINDS = ["lesson", "unit_studio"];
export const ORIGINS = ["authored", "generated", "imported"];
export const REVIEW_STATES = ["draft", "in_review", "reviewed", "needs_changes", "retired"];
export const DIMENSIONS = [
  "pedagogy",
  "language_qa",
  "accessibility",
  "bias_sensitivity",
  "math_science_accuracy",
];
// Subjects whose numeric claims need the exact-arithmetic review dimension.
export const ACCURACY_SUBJECTS = ["math", "science"];
export const REVIEWER_ROLES = ["author", "pedagogy", "language", "accessibility", "admin"];

// draft -> in_review -> reviewed | needs_changes; reviewed -> in_review on edit; retired is terminal.
export const TRANSITIONS = {
  draft: ["in_review", "retired"],
  in_review: ["reviewed", "needs_changes", "retired"],
  needs_changes: ["in_review", "retired"],
  reviewed: ["in_review", "retired"],
  retired: [],
};

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string" && v.length > 0;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;
const HASH = /^[0-9a-f]{64}$/;

/** Deterministic JSON: object keys sorted, arrays in order. */
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isObj(value)) {
    const keys = Object.keys(value)
      .filter((k) => value[k] !== undefined)
      .sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function contentHash(content) {
  const bytes = new TextEncoder().encode(canonicalJson(content));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const emptyDimension = () => ({ state: "draft", reviewers: [], reviewedHash: null });

export function emptyReview(languages = []) {
  const review = { translation: {} };
  for (const d of DIMENSIONS) review[d] = emptyDimension();
  for (const lang of languages) review.translation[lang] = emptyDimension();
  return review;
}

/** Stored state, except a reviewed dimension whose content changed since review is in_review again. */
export function effectiveState(block, dimension, lang = null) {
  const dim = lang ? block.review?.translation?.[lang] : block.review?.[dimension];
  if (!dim) return "draft";
  if (dim.state === "reviewed" && dim.reviewedHash !== block.provenance?.contentHash) return "in_review";
  return dim.state;
}

export function requiredDimensions(subject, languages = []) {
  const dims = DIMENSIONS.filter((d) => d !== "math_science_accuracy" || ACCURACY_SUBJECTS.includes(subject));
  return { dimensions: dims, translations: languages };
}

/** Publish-ready only when every required dimension is effectively reviewed. */
export function isPublishReady(block, { subject, languages = [] } = {}) {
  const need = requiredDimensions(subject, languages);
  return (
    need.dimensions.every((d) => effectiveState(block, d) === "reviewed") &&
    need.translations.every((l) => effectiveState(block, null, l) === "reviewed")
  );
}

export const REVIEWER_RULES =
  "A reviewer is a human: { name, role, date, actor: 'human' }. No model can approve.";

function checkReviewer(r, at, add) {
  if (!isObj(r)) return add(`${at}: reviewer must be an object`);
  if (!isStr(r.name)) add(`${at}: reviewer name required`);
  if (!REVIEWER_ROLES.includes(r.role)) add(`${at}: reviewer role must be one of ${REVIEWER_ROLES.join(", ")}`);
  if (!isStr(r.date) || !ISO_DATE.test(r.date)) add(`${at}: reviewer date must be ISO`);
  if (r.actor !== "human") add(`${at}: reviewer actor must be "human"`);
}

function checkDimension(dim, at, add) {
  if (!isObj(dim)) return add(`${at}: dimension missing`);
  if (!REVIEW_STATES.includes(dim.state)) return add(`${at}: unknown state "${dim.state}"`);
  if (!Array.isArray(dim.reviewers)) return add(`${at}: reviewers must be an array`);
  dim.reviewers.forEach((r, i) => checkReviewer(r, `${at}.reviewers[${i}]`, add));
  if (dim.state === "reviewed") {
    if (dim.reviewers.length === 0) add(`${at}: reviewed requires a reviewer and date`);
    if (!HASH.test(dim.reviewedHash || "")) add(`${at}: reviewed requires reviewedHash`);
  }
}

/** Structural validation; async because it checks the stored content hash. Returns string[] of problems. */
export async function validateBlock(block) {
  const errors = [];
  const add = (m) => errors.push(m);
  if (!isObj(block)) return ["block must be an object"];
  const id = block.id || "?";
  if (block.schemaVersion !== SCHEMA_VERSION) add(`${id}: schemaVersion must be 2`);
  if (!KINDS.includes(block.kind)) add(`${id}: kind must be one of ${KINDS.join(", ")}`);
  if (!isStr(block.id)) add("block id required");
  if (!isObj(block.content)) add(`${id}: content required`);

  const p = block.provenance;
  if (!isObj(p)) add(`${id}: provenance required`);
  else {
    if (!ORIGINS.includes(p.origin)) add(`${id}: provenance.origin must be one of ${ORIGINS.join(", ")}`);
    if (!(p.generator === null || isStr(p.generator))) add(`${id}: provenance.generator must be string|null`);
    if (p.origin === "generated" && !isStr(p.generator)) add(`${id}: generated blocks name their generator`);
    if (!(p.generatedAt === null || ISO_DATE.test(p.generatedAt || ""))) add(`${id}: provenance.generatedAt must be ISO|null`);
    if (!Array.isArray(p.sourceRefs)) add(`${id}: provenance.sourceRefs must be an array`);
    if (!Number.isInteger(p.version) || p.version < 1) add(`${id}: provenance.version must be a positive integer`);
    if (!(p.supersedes === null || isStr(p.supersedes))) add(`${id}: provenance.supersedes must be string|null`);
    if (!HASH.test(p.contentHash || "")) add(`${id}: provenance.contentHash required`);
    else if (isObj(block.content) && p.contentHash !== (await contentHash(block.content))) {
      add(`${id}: provenance.contentHash does not match content (re-hash on edit)`);
    }
  }

  const r = block.review;
  if (!isObj(r)) add(`${id}: review required`);
  else {
    for (const d of DIMENSIONS) checkDimension(r[d], `${id}.review.${d}`, add);
    if (!isObj(r.translation)) add(`${id}: review.translation must be an object`);
    else for (const [lang, dim] of Object.entries(r.translation)) checkDimension(dim, `${id}.review.translation.${lang}`, add);
  }
  return errors;
}

/** Re-stamp provenance after a content edit; reviewed dimensions then read as in_review (hash mismatch). */
export async function withContent(block, content) {
  const hash = await contentHash(content);
  return {
    ...block,
    content,
    provenance: { ...block.provenance, contentHash: hash, version: block.provenance.version + 1 },
  };
}

/**
 * Apply one human review decision. Pure: returns a new block or throws.
 * `reviewer` must be a human actor; a state change must follow the state machine.
 */
export async function applyReview(block, { dimension, lang = null, state, reviewer }) {
  const errs = [];
  checkReviewer(reviewer, "reviewer", (m) => errs.push(m));
  if (errs.length) throw new Error(`${REVIEWER_RULES} ${errs.join("; ")}`);
  const dim = lang ? block.review.translation?.[lang] : block.review[dimension];
  if (!dim) throw new Error(`unknown review dimension ${lang ? `translation.${lang}` : dimension}`);
  const from = effectiveState(block, dimension, lang);
  if (from !== state && !TRANSITIONS[from]?.includes(state)) {
    throw new Error(`illegal review transition ${from} -> ${state}`);
  }
  const next = {
    state,
    reviewers: [...dim.reviewers, reviewer],
    reviewedHash: state === "reviewed" ? block.provenance.contentHash : null,
  };
  const review = lang
    ? { ...block.review, translation: { ...block.review.translation, [lang]: next } }
    : { ...block.review, [dimension]: next };
  return { ...block, review };
}
