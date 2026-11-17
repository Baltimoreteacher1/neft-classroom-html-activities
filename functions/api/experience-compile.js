/* =============================================================================
 * POST /api/experience-compile — "Suggest improvements" for the Experience Builder (The Language Page).
 * -----------------------------------------------------------------------------
 * Teacher only: the caller needs the site teacher key (x-teacher-key) or a class's teacher passcode
 * (x-class-teacher + body.code), the same credentials as the class platform's teacher routes.
 *
 * Body: { source, settings, def, code? }
 *   source    the instructor's OWN source text, <= 6,000 characters
 *   settings  band, subject, Key Language Use, topic (anything else is ignored)
 *   def       only def.characters[].{ id, name, role } is read; the rest of the definition is ignored
 * Never sent and never read: learner work, learner names, recordings, class rosters, progress.
 *
 * The model (callModel WITHOUT allowGemini: Claude Haiku, else Workers AI, else nothing) must reply with strict JSON
 * { questions: [{ character, ask, keywords }], lines: [{ character, text }] }. acceptSuggestions()
 * (access-practice-lab/src/compiler/suggest-rules.js, shared with the editor) drops every item that is over 30 words,
 * names an unknown character, brings in score / level / grade wording, or (lines) cannot be traced to the source by
 * the compiler's own traceText rule; a reply that is not that shape is dropped whole.
 *
 * No model → 503 { ok: false, offline: true } and the editor shows its built-in suggestions only.
 * Nothing is stored: no source, no reply, no IP. The only state is the anonymous per-IP-hour and per-day counters
 * of the shared cap guard (Workers Cache API; the IP is hashed before it becomes part of a key).
 * ============================================================================= */
import {
  acceptSuggestions,
  PROMPT_VERSION,
  SUGGEST_LIMITS,
  suggestPrompt,
  validateSuggestRequest,
} from "../../access-practice-lab/src/compiler/suggest-rules.js";
import { isClassCode, normalizeCode } from "../../shared/class-platform/contract.js";
import { liveClass, teacherRole } from "../_lib/class-platform/store.js";
import { badRequest, handler, json, unauthorized } from "../_lib/http.js";
import { callModel, firstJsonObject, modelAvailable } from "../_lib/model-call.js";
import { limitedResponse, overCap } from "./language-guide/guard.js";

/** One instructor revising a draft presses this a handful of times; a school shares one address. */
export const SUGGEST_PER_IP_HOURLY_CAP = 60;
/** Site-wide budget per UTC day. */
export const SUGGEST_DAILY_CAP = 600;

/** The site key, or the passcode of the class named in the body. A missing database only disables the latter. */
async function isTeacher(request, env, body) {
  if (await teacherRole(request, env, null)) return true;
  const code = normalizeCode(body?.code);
  if (!env?.DB || !isClassCode(code) || !request.headers.get("x-class-teacher")) return false;
  try {
    const cls = await liveClass(env.DB, code, Date.now());
    return Boolean(cls && (await teacherRole(request, env, cls)));
  } catch {
    return false;
  }
}

export const onRequest = handler({
  methods: ["POST"],
  rateLimit: { max: 20, windowMs: 60_000 },
  // 6,000 characters of source (up to 4 bytes each), the settings and a dozen character names.
  maxBodyBytes: SUGGEST_LIMITS.source * 4 + 8000,
  async handle({ request, env, body }) {
    const req = validateSuggestRequest(body);
    if (!req.ok) return badRequest(req.error);
    if (!(await isTeacher(request, env, body))) return unauthorized();
    const available = modelAvailable(env);
    if (!available.claude && !available.workersAi) return json({ ok: false, offline: true }, 503);
    if (
      await overCap(request, {
        scope: "experience-compile",
        perIpCap: SUGGEST_PER_IP_HOURLY_CAP,
        dailyCap: SUGGEST_DAILY_CAP,
      })
    )
      return limitedResponse();
    const reply = await callModel(env, { ...suggestPrompt(req), maxTokens: 700 });
    if (!reply) return json({ ok: false, offline: true }, 503);
    const result = acceptSuggestions(firstJsonObject(reply.text), {
      source: req.source,
      characterIds: req.characters.map((c) => c.id),
    });
    if (!result) return json({ ok: false, offline: true, rejected: true }, 503);
    return {
      ok: true,
      source: reply.source,
      promptVersion: PROMPT_VERSION,
      questions: result.questions,
      lines: result.lines,
      dropped: result.dropped,
    };
  },
});
