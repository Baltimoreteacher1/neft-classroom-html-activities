// Mixed-band class packets: the part registry. One place that knows which parts exist, what each needs, and how to
// build its document model from a unit's authored Studio content. The export route and the tests both call buildPart().

import { BCPSS_UNITS } from "../../../data/bcpss-curriculum-seed.mjs";
import { isBand, parseCounts, variantCodes } from "../../../shared/packets/bands.js";
import { buildCover, buildKey, buildStudentPaper } from "./packet-doc.js";
import { buildCardsKit, buildExitKit, buildFamilyKit, buildFramesKit } from "./packet-kits.js";
import { loadFamily, loadStudio } from "./studio.js";

export const PACKET_PARTS = [
  "student",
  "key",
  "cover",
  "kit-cards",
  "kit-frames",
  "kit-exit",
  "kit-family",
];
export const isPacketPart = (p) => PACKET_PARTS.includes(p);

const UNIT_BY_ID = new Map(BCPSS_UNITS.map((u) => [u.id, u]));
export const PACKET_UNIT_IDS = Object.freeze(BCPSS_UNITS.map((u) => u.id));

/** { unit, studio, family } for an authored unit, or null. Reads authored seed content only: no database, no network. */
export async function loadPacketSource(unitId) {
  const unit = UNIT_BY_ID.get(unitId);
  if (!unit) return null;
  const studio = await loadStudio(unitId);
  if (!studio) return null;
  return { unit, studio, family: await loadFamily(unitId) };
}

/**
 * Builds one part. Returns { doc, code } or throws an Error whose `.status` is the HTTP status to answer with.
 * options: band (student), counts (cover; a string or object), esReviewed (Spanish review state; no review dimension exists
 * yet for Studio blocks, so callers pass false and every Spanish gloss prints as a draft translation).
 */
export function buildPart(source, part, { band = null, counts = null, esReviewed = false } = {}) {
  const fail = (message, status = 400) => Object.assign(new Error(message), { status });
  const { unit, studio, family } = source;
  const codes = variantCodes(unit.id);
  switch (part) {
    case "student":
      if (!isBand(band)) throw fail('band must be "1_2", "3_4" or "5_6" for the student paper');
      return { doc: buildStudentPaper(unit, studio, band, codes[band]), code: codes[band] };
    case "key":
      return { doc: buildKey(unit, studio, codes), code: null };
    case "cover": {
      const parsed = parseCounts(counts);
      if (!parsed.ok) throw fail(parsed.error);
      return { doc: buildCover(unit, parsed.counts, codes), code: null };
    }
    case "kit-cards":
      return { doc: buildCardsKit(unit, studio, { esReviewed }), code: null };
    case "kit-frames":
      return { doc: buildFramesKit(unit, studio, codes), code: null };
    case "kit-exit":
      return { doc: buildExitKit(unit, studio), code: null };
    case "kit-family":
      if (!family) throw fail("this unit has no authored family guide yet", 404);
      return { doc: buildFamilyKit(unit, studio, family, { esReviewed }), code: null };
    default:
      throw fail(`unknown part "${part}"`);
  }
}
