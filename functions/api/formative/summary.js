/* GET /api/formative/summary?code=&unitId=[&round=2]
 *
 * Everything the Formative view needs for one class and unit: the exit ticket with its rubric, the stored scores
 * (teacher and self kept apart), the unit's error catalog, and the weekly error tallies for the last
 * LIMITS.trendWeeks weeks. Teacher credential as /api/formative/score. No student content: opaque ids, levels, counts.
 * Response: { ok, ticket, scores, catalog, errors, weeks }.
 */
import { LIMITS, recentWeeks, ticketIdFor } from "../../../shared/formative/constants.js";
import { fail, loadUnit, requireClassTeacher } from "../../_lib/formative/request.js";
import { readErrors, readScores } from "../../_lib/formative/store.js";
import { handler } from "../../_lib/http.js";

export const onRequest = handler({
  methods: ["GET"],
  rateLimit: { max: 120, ipMax: 600, windowMs: 60_000 },
  async handle(context) {
    const params = new URL(context.request.url).searchParams;
    const auth = await requireClassTeacher(context, params.get("code"));
    if (auth.error) return auth.error;
    const unit = await loadUnit(context.env, params.get("unitId"));
    if (unit.error) return unit.error;
    if (!unit.ticket) return fail("no-exit-ticket", 404);
    const round = Number(params.get("round") || 1);
    if (!Number.isInteger(round) || round < 1 || round > 9) return fail("invalid-round");
    const ticketId = ticketIdFor(unit.unitId, round);
    const weeks = recentWeeks(Date.now(), LIMITS.trendWeeks);
    const [scores, errors] = await Promise.all([
      readScores(context.env.DB, auth.cls.code, ticketId),
      readErrors(context.env.DB, auth.cls.code, unit.unitId, weeks[0]),
    ]);
    return {
      ok: true,
      ticket: { ...unit.ticket, ticketId },
      scores,
      catalog: unit.catalog,
      reteach: unit.reteach,
      errors,
      weeks,
    };
  },
});
