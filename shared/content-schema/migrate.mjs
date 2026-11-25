// Idempotent v1 <-> v2 migration. Content is never changed: v2 wraps it, v1 is recovered byte-for-byte
// (compared as canonical JSON). Review states the migration cannot honestly carry are refused, not invented.

import { contentHash, emptyReview, SCHEMA_VERSION } from "./v2.mjs";

const LESSON_GENERATOR = "functions/_lib/bcpss/lesson-generator.js";
const ORIGIN_BY_SOURCE = {
  draft_standards_based: "generated",
  authored: "authored",
  teacher_lesson_map: "imported",
};

// v1 only ever stored "pending". A v1 "reviewed" would need a named reviewer and date that v1 never recorded,
// so the migration throws instead of fabricating one.
const V1_STATE = { pending: "draft" };
const V2_STATE = { draft: "pending" };

function v1State(value, at) {
  const state = V1_STATE[value];
  if (!state) throw new Error(`${at}: v1 review state "${value}" needs a human to re-record it in v2`);
  return state;
}

function v1ToV2Review(v1, id) {
  const review = emptyReview(Object.keys(v1.translation || {}));
  review.pedagogy.state = v1State(v1.pedagogy, `${id}.pedagogy`);
  review.language_qa.state = v1State(v1.language_qa, `${id}.language_qa`);
  for (const [lang, value] of Object.entries(v1.translation || {})) {
    review.translation[lang].state = v1State(value, `${id}.translation.${lang}`);
  }
  return review;
}

function v2ToV1Review(review, id) {
  const back = (dim, at) => {
    const value = V2_STATE[dim.state];
    if (!value) throw new Error(`${at}: state "${dim.state}" has no v1 equivalent`);
    return value;
  };
  const translation = {};
  for (const [lang, dim] of Object.entries(review.translation || {})) translation[lang] = back(dim, `${id}.translation.${lang}`);
  return { pedagogy: back(review.pedagogy, `${id}.pedagogy`), language_qa: back(review.language_qa, `${id}.language_qa`), translation };
}

async function block(kind, id, content, provenance, review) {
  return {
    schemaVersion: SCHEMA_VERSION,
    kind,
    id,
    content,
    provenance: { generatedAt: null, version: 1, supersedes: null, ...provenance, contentHash: await contentHash(content) },
    review,
  };
}

/** v1 lesson set `{ version, unit_id, source, lessons[] }` -> v2 set of lesson blocks. */
export async function lessonSetToV2(set) {
  if (set?.schemaVersion === SCHEMA_VERSION) return set;
  const { lessons, ...head } = set;
  const blocks = [];
  for (const lesson of lessons) {
    const { review, ...content } = lesson;
    const origin = ORIGIN_BY_SOURCE[lesson.source];
    if (!origin) throw new Error(`${lesson.id}: unknown lesson source "${lesson.source}"`);
    const provenance = {
      origin,
      generator: origin === "generated" ? LESSON_GENERATOR : null,
      sourceRefs: origin === "authored" ? [`db/seeds/bcpss/v2/lessons-authored/${set.unit_id}.mjs`] : [],
    };
    blocks.push(await block("lesson", lesson.id, content, provenance, v1ToV2Review(review, lesson.id)));
  }
  return { schemaVersion: SCHEMA_VERSION, kind: "lesson_set", head, blocks };
}

export function lessonSetToV1(v2) {
  const lessons = v2.blocks.map((b) => ({ ...b.content, review: v2ToV1Review(b.review, b.id) }));
  return { ...v2.head, lessons };
}

/** v1 unit studio (no review metadata) -> one v2 block. Origin is "imported": v1 never recorded who wrote it. */
export async function studioToV2(unitId, studio) {
  if (studio?.schemaVersion === SCHEMA_VERSION) return studio;
  return block(
    "unit_studio",
    `${unitId}:studio`,
    studio,
    { origin: "imported", generator: null, sourceRefs: [`db/seeds/bcpss/v2/units/${unitId}.mjs`] },
    emptyReview(),
  );
}

export const studioToV1 = (v2) => v2.content;
