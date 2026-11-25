// The block universe the review workflow works on: schema-v2 blocks produced on the fly by migrating what
// loadStudio / loadLessons return. Nothing here is stored; the content hash is always recomputed from the
// content the server loads itself, never taken from a client.
import { BCPSS_UNITS } from "../../../data/bcpss-curriculum-seed.mjs";
import { lessonSetToV2, studioToV2 } from "../../../shared/content-schema/migrate.mjs";
import { UNIT_ID_RE } from "../../../shared/content-schema/review-rules.js";
import { loadLessons } from "../bcpss/lessons.js";
import { loadStudio } from "../bcpss/studio.js";

const UNIT_BY_ID = new Map(BCPSS_UNITS.map((u) => [u.id, u]));
export const UNIT_IDS = Object.freeze(BCPSS_UNITS.map((u) => u.id));
export const unitMeta = (unitId) => UNIT_BY_ID.get(unitId) || null;
export const unitOfBlock = (blockId) => blockId.split(/[:]|-l\d{2}$/)[0];
export const isUnitId = (id) => UNIT_ID_RE.test(id) && UNIT_BY_ID.has(id);

/** Lowercase subject key the schema's required-dimension rule reads ("math", "science", ...). */
export const subjectKey = (unit) => String(unit?.subject || "").toLowerCase();

/** All blocks of one unit, full content: the unit studio first, then its lessons. [] for an unknown unit. */
export async function loadUnitBlocks(unitId) {
  const unit = unitMeta(unitId);
  if (!unit) return [];
  const blocks = [];
  const studio = await loadStudio(unitId);
  if (studio) blocks.push(await studioToV2(unitId, studio));
  const lessons = await loadLessons(unitId);
  if (lessons) blocks.push(...(await lessonSetToV2(lessons)).blocks);
  return blocks;
}

const titleOf = (block, unit) =>
  block.kind === "lesson"
    ? block.content.title || block.id
    : `Unit ${unit.unit_number}: ${unit.unit_title}`;

/** A light row for lists: everything except the content itself. */
function rowOf(block, unit) {
  return {
    id: block.id,
    kind: block.kind,
    unitId: unit.id,
    grade: String(unit.grade),
    subject: subjectKey(unit),
    title: titleOf(block, unit),
    hash: block.provenance.contentHash,
    languages: Object.keys(block.review.translation || {}),
  };
}

// Per-unit row cache. Content only changes with a deploy, which starts new isolates, so a row never goes stale.
const rowCache = new Map();

export function unitRows(unitId) {
  if (!rowCache.has(unitId)) {
    const pending = loadUnitBlocks(unitId)
      .then((blocks) => blocks.map((b) => rowOf(b, unitMeta(unitId))))
      .catch((err) => {
        rowCache.delete(unitId);
        throw err;
      });
    rowCache.set(unitId, pending);
  }
  return rowCache.get(unitId);
}

/** Rows for the units whose grade and subject match (all units when neither is given). */
export async function indexRows({ grade = "", subject = "", unit = "" } = {}) {
  const g = String(grade).toUpperCase();
  const s = String(subject).toLowerCase();
  const ids = BCPSS_UNITS.filter(
    (u) =>
      (!unit || u.id === unit) &&
      (!g || String(u.grade).toUpperCase() === g) &&
      (!s || subjectKey(u) === s),
  ).map((u) => u.id);
  const rows = [];
  for (const id of ids) rows.push(...(await unitRows(id)));
  return rows;
}

/** One full block (content included), or null when the id names nothing. */
export async function loadBlock(blockId) {
  const unitId = unitOfBlock(blockId);
  if (!isUnitId(unitId)) return null;
  const block = (await loadUnitBlocks(unitId)).find((b) => b.id === blockId);
  return block ? { block, unit: unitMeta(unitId) } : null;
}
