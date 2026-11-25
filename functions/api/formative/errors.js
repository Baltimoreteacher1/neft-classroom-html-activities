/* POST /api/formative/errors  { code, unitId, errors: [{ type, count }] }
 *
 * Adds class-wide error tallies for the current week: "this many students slipped on this error type". `type`
 * must be an id from the unit's own error catalog (shared/formative/catalog.js), so free text, names and made-up
 * ids are refused. `count` is a whole number from -50 to 50 (negative undoes a mis-tap; a tally never goes below
 * zero). Teacher credential as /api/formative/score. Aggregates only: nothing names a student.
 * Response: { ok, weekStart }.
 */

import { catalogIds } from "../../../shared/formative/catalog.js";
import { LIMITS } from "../../../shared/formative/constants.js";
import {
  fail,
  hasOnly,
  loadUnit,
  requireClassTeacher,
  screenPII,
} from "../../_lib/formative/request.js";
import { bumpErrors } from "../../_lib/formative/store.js";
import { handler } from "../../_lib/http.js";

const wholeDelta = (n) => Number.isInteger(n) && n !== 0 && Math.abs(n) <= LIMITS.maxErrorDelta;

export const onRequest = handler({
  methods: ["POST"],
  requireObjectBody: true,
  maxBodyBytes: 4 * 1024,
  rateLimit: { max: 120, ipMax: 600, windowMs: 60_000 },
  async handle(context) {
    const { body, env } = context;
    const pii = screenPII(body);
    if (pii) return pii;
    if (!hasOnly(body, ["code", "unitId", "errors"])) return fail("unexpected-field");
    const auth = await requireClassTeacher(context, body.code);
    if (auth.error) return auth.error;
    const unit = await loadUnit(env, body.unitId);
    if (unit.error) return unit.error;
    const list = body.errors;
    if (!Array.isArray(list) || !list.length || list.length > LIMITS.maxErrorsPerCall)
      return fail("invalid-errors");
    const ids = catalogIds(unit.catalog);
    const seen = new Set();
    for (const e of list) {
      const ok =
        hasOnly(e, ["type", "count"]) &&
        ids.has(e.type) &&
        !seen.has(e.type) &&
        wholeDelta(e.count);
      if (!ok) return fail("invalid-errors");
      seen.add(e.type);
    }
    const weekStart = await bumpErrors(env.DB, {
      code: auth.cls.code,
      unitId: unit.unitId,
      deltas: list,
      now: Date.now(),
    });
    return { ok: true, weekStart };
  },
});
