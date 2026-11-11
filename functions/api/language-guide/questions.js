/* =============================================================================
 * GET /api/language-guide/questions?days=7 — what people typed into Mr. Neft, the Language Page guide.
 * -----------------------------------------------------------------------------
 * Teacher only: the x-teacher-key header must equal env.TEACHER_KEY (a key in the query string would be written
 * into request logs, so it is not accepted). Answers 401 otherwise, and 503 when the PLAN_DOCS store is not bound.
 *
 * Returns { ok, days, total, answered, unanswered, byPage, byLang, byGrades, byDay, top: [{ question, count,
 * unanswered }] } over the anonymous question log kept by POST /api/language-guide (guard.js; 90 days).
 * ============================================================================= */
import { handler, json, unauthorized } from "../../_lib/http.js";
import { sameKey, summarizeQuestions } from "./guard.js";

const MAX_DAYS = 90;

function daysParam(raw) {
  const n = Math.round(Number(raw));
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), MAX_DAYS) : 7;
}

export const onRequest = handler({
  methods: ["GET"],
  rateLimit: { max: 30, windowMs: 60_000 },
  async handle({ request, env }) {
    if (!sameKey(request.headers.get("x-teacher-key"), env?.TEACHER_KEY)) return unauthorized();
    if (!env?.PLAN_DOCS?.list)
      return json({ ok: false, error: "question log store not bound" }, 503);
    const days = daysParam(new URL(request.url).searchParams.get("days"));
    return summarizeQuestions(env.PLAN_DOCS, days);
  },
});
