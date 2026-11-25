/* POST /api/formative/self-score  { code, unitId, ticketId, band, level }
 *
 * A student's own rubric level for an exit ticket, for the older scaffold band only (`band` must be "5_6").
 * Student credential: `x-class-student: <id>.<key>`, as /api/class/progress. The student id comes from the
 * credential, never the body, so a student can only ever write their own row. It is stored as scored_by = 'self',
 * a separate row from the teacher's score, and no response ever returns another student's level.
 * Response: { ok, level }.
 */
import { isLevel, SELF_BAND } from "../../../shared/formative/constants.js";
import {
  fail,
  hasOnly,
  loadUnit,
  requireClassStudent,
  screenPII,
  ticketBelongsTo,
} from "../../_lib/formative/request.js";
import { writeScores } from "../../_lib/formative/store.js";
import { handler } from "../../_lib/http.js";

export const onRequest = handler({
  methods: ["POST"],
  requireObjectBody: true,
  maxBodyBytes: 1024,
  rateLimit: { max: 60, ipMax: 600, windowMs: 60_000 },
  async handle(context) {
    const { body, env } = context;
    const pii = screenPII(body);
    if (pii) return pii;
    if (!hasOnly(body, ["code", "unitId", "ticketId", "band", "level"]))
      return fail("unexpected-field");
    if (body.band !== SELF_BAND) return fail("self-score-not-offered", 403);
    if (!isLevel(body.level)) return fail("invalid-level");
    const now = Date.now();
    const auth = await requireClassStudent(context, body.code, now);
    if (auth.error) return auth.error;
    const unit = await loadUnit(env, body.unitId);
    if (unit.error) return unit.error;
    if (!unit.ticket || !ticketBelongsTo(body.ticketId, unit.unitId)) return fail("invalid-ticket");
    await writeScores(env.DB, {
      code: auth.cls.code,
      ticketId: body.ticketId,
      unitId: unit.unitId,
      by: "self",
      entries: [{ studentId: auth.student.student_id, level: body.level }],
      now,
    });
    return { ok: true, level: body.level };
  },
});
