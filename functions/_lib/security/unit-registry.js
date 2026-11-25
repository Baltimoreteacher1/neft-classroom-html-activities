import { BCPSS_UNITS } from "../../../data/bcpss-curriculum-seed.mjs";

/**
 * The unit registry the public write endpoints trust: the canonical seed, never the client.
 * A client supplies only a unit id; grade is derived here from the registry.
 */
const UNIT_BY_ID = new Map((BCPSS_UNITS || []).map((u) => [u.id, u]));

/** `{ id, grade }` for a registered unit, else null. Grade is a string ("K", "6"). */
export function registeredUnit(unitId) {
  const unit = UNIT_BY_ID.get(unitId);
  return unit ? { id: unit.id, grade: String(unit.grade) } : null;
}

export const registeredUnitCount = () => UNIT_BY_ID.size;
