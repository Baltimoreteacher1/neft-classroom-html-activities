/* =============================================================================
 * /api/teacher-auth/* — the single sign-in for every teacher surface.
 * -----------------------------------------------------------------------------
 *   POST   login    { key }   -> sets the HttpOnly session cookie
 *   POST   logout             -> clears it
 *   GET    session            -> { ok, authenticated, teacher }
 *
 * This is the ONLY place a teacher key is ever compared against a request the
 * browser made. Everything downstream reads the signed cookie instead, which is
 * why no page, bundle or URL has to carry the credential.
 *
 * WHAT THIS ENDPOINT MUST NEVER DO, and does not:
 *   - echo the supplied key back, in any field, at any status
 *   - name the environment variable that was or was not matched
 *   - distinguish "no such key" from "key for a teacher who is disabled"
 *   - accept the key from a query string (see below)
 *
 * The key arrives in a POST body, never ?key=. A query string is written to
 * browser history, to the Referer of every subsequent request, to any proxy log
 * in the path, and to the screenshot the teacher takes of the page. The legacy
 * ?key= support elsewhere is retained for non-browser callers only.
 *
 * Rate limited hard: this is the one guessable surface in the system.
 * ========================================================================== */

import {
  badRequest,
  clientIp,
  createRateLimiter,
  handler,
  json,
  tooManyRequests,
} from "../../_lib/http.js";
import {
  acceptedKeys,
  clearedSessionCookie,
  identityForKey,
  mintSession,
  resolveTeacherSession,
  sessionCookie,
} from "../../_lib/teacher-auth.js";

const route = (url) => url.pathname.replace(/^\/api\/teacher-auth\/?/, "").replace(/\/+$/, "");

/**
 * The limiter is on LOGIN ONLY, and that distinction is load-bearing.
 *
 * It was originally declared on the whole handler, which also covers
 * `GET /session` — and every teacher surface calls /session on load to decide
 * whether to show teacher chrome. A teacher opening a dozen lesson pages in a
 * minute would have tripped it, and the pages would have read the 429 as "not
 * signed in" and offered a sign-in link to someone who already was. A spurious
 * lockout in the middle of a lesson, from a guard aimed at password guessing.
 *
 * Ten attempts a minute per IP on the one guessable surface. A teacher who
 * mistypes twice is unaffected; an online guessing run against a human-memorable
 * key is not viable. Reading or ending your own session is not guessing and is
 * not limited.
 *
 * Found by the class-aware planner E2E, which signs in once and then reads
 * /session on every page it visits — exactly what a teacher does.
 */
const loginLimiter = createRateLimiter({ max: 10, windowMs: 60_000 });

export const onRequest = handler({
  methods: ["GET", "POST"],
  maxBodyBytes: 2_000,
  async handle({ request, env, body, data }) {
    const url = new URL(request.url);
    const path = route(url);

    if (request.method === "GET") {
      if (path !== "session") return badRequest("unknown route");
      const teacher = data?.teacher || (await resolveTeacherSession(env, request));
      /*
       * `keys` is a COUNT, never a name and never a value.
       *
       * When sign-in broke in production, every signal available said the
       * system was healthy: the endpoint answered, a wrong key returned a
       * correct 401, and `configured` was true. But `configured` is true when
       * ANY of the three accepted bindings is set, so "the legacy key is set
       * and Alba's is missing" and "all three are set" are the same answer —
       * and the first of those locks a teacher out while reporting health. The
       * count separates them, and it discloses nothing: an attacker learns how
       * many keys exist, which they could already assume.
       */
      return json({
        ok: true,
        configured: acceptedKeys(env).size > 0,
        keys: acceptedKeys(env).size,
        authenticated: Boolean(teacher),
        teacher: teacher || null,
      });
    }

    if (path === "logout") {
      return json({ ok: true, authenticated: false }, 200, {
        "Set-Cookie": clearedSessionCookie(),
      });
    }

    if (path !== "login") return badRequest("unknown route");

    if (loginLimiter(clientIp(request))) return tooManyRequests();

    if (acceptedKeys(env).size === 0) {
      // An ops problem, not a teacher problem. Say so without naming the
      // variables an attacker would then know to look for.
      return json(
        { ok: false, error: "not-configured", message: "Teacher access is not configured." },
        503,
      );
    }

    const identity = identityForKey(env, body?.key);
    if (!identity) {
      return json(
        { ok: false, error: "unauthorized", message: "Teacher key not recognized." },
        401,
      );
    }

    const token = await mintSession(env, identity);
    if (!token) {
      return json(
        { ok: false, error: "not-configured", message: "Teacher access is not configured." },
        503,
      );
    }
    return json({ ok: true, authenticated: true, teacher: identity }, 200, {
      "Set-Cookie": sessionCookie(token),
    });
  },
});
