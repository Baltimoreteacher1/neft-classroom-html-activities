/* POST /api/formative/score  { code, unitId, ticketId, scores: [{ studentId, level }] }
 *
 * The teacher's rubric scores for one exit ticket, one tap per alias. `level` is emerging | developing |
 * proficient, or null to clear a mis-tap. Teacher credential: `x-class-teacher` (class passcode) or
 * `x-teacher-key`, the same ones /api/class uses. Every studentId must be on the class roster; every string in
 * the body goes through the PII screen. A call is all-or-nothing. Response: { ok, saved }.
 */
import { isLevel, LIMITS } from "../../../shared/formative/constants.js";
import {
  fail,
  hasOnly,
  loadUnit,
  requireClassTeacher,
  screenPII,
  ticketBelongsTo,
} from "../../_lib/formative/request.js";
import { rosterIds, writeScores } from "../../_lib/formative/store.js";
import { handler } from "../../_lib/http.js";

export const onRequest = handler({
  methods: ["POST"],
  requireObjectBody: true,
  maxBodyBytes: 8 * 1024,
  rateLimit: { max: 240, ipMax: 1200, windowMs: 60_000 },
  async handle(context) {
    const { body, env } = context;
    const pii = screenPII(body);
    if (pii) return pii;
    if (!hasOnly(body, ["code", "unitId", "ticketId", "scores"])) return fail("unexpected-field");
    const auth = await requireClassTeacher(context, body.code);
    if (auth.error) return auth.error;
    const unit = await loadUnit(env, body.unitId);
    if (unit.error) return unit.error;
    if (!unit.ticket || !ticketBelongsTo(body.ticketId, unit.unitId)) return fail("invalid-ticket");
    const list = body.scores;
    if (!Array.isArray(list) || !list.length || list.length > LIMITS.maxScoresPerCall)
      return fail("invalid-scores");
    const roster = await rosterIds(env.DB, auth.cls.code);
    const seen = new Set();
    for (const e of list) {
      const ok =
        hasOnly(e, ["studentId", "level"]) &&
        roster.has(e.studentId) &&
        !seen.has(e.studentId) &&
        (e.level === null || isLevel(e.level));
      if (!ok) return fail("invalid-scores");
      seen.add(e.studentId);
    }
    await writeScores(env.DB, {
      code: auth.cls.code,
      ticketId: body.ticketId,
      unitId: unit.unitId,
      by: "teacher",
      entries: list,
      now: Date.now(),
    });
    return { ok: true, saved: list.length };
  },
});
