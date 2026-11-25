// Shared options for the review endpoints. Each route file calls the shared handler() from functions/_lib/http.js
// itself (method list, body cap, rate limit, JSON errors) with these options, which add the teacher gate and
// uniform error mapping: `export const onRequest = handler(reviewRoute({ methods, handle }));`. Auth is the class API's own: x-teacher-key
// against env.TEACHER_KEY (teacherRole in class-platform/store.js). No credential is added here.
import { teacherRole } from "../class-platform/store.js";
import { json } from "../http.js";
import { DecisionError } from "./decide.js";
import { isMissingTable } from "./store.js";

const fail = (error, status, extra = {}) => json({ ok: false, error, ...extra }, status);

/** Null when the caller holds the site teacher key, else the refusing Response. */
export async function requireReviewer({ request, env }) {
  if (!env.TEACHER_KEY) return fail("teacher-key-not-configured", 503);
  return (await teacherRole(request, env, null)) === "site" ? null : fail("unauthorized", 401);
}

/**
 * Returns the handler() options. handle(context) returns a plain object or a Response. `open: true` skips the teacher gate (only the
 * aggregate badge summary uses it: states and counts, no content and no reviewer names).
 */
export function reviewRoute({
  methods,
  maxBodyBytes = 8192,
  rateLimit = { max: 60, ipMax: 300, windowMs: 60_000 },
  open = false,
  handle,
}) {
  return {
    methods,
    maxBodyBytes,
    rateLimit,
    async handle(context) {
      if (!context.env.DB) return fail("backend-not-configured", 503);
      if (!open) {
        const denied = await requireReviewer(context);
        if (denied) return denied;
      }
      try {
        return await handle(context);
      } catch (err) {
        if (err instanceof DecisionError)
          return fail(err.code, err.status, { message: err.message });
        if (isMissingTable(err)) return fail("review-migration-missing", 503);
        throw err;
      }
    },
  };
}

/** Reject unknown body fields (a client can never smuggle a hash, date or actor in beside the allow-list). */
export function allowFields(body, allowed) {
  const extra = Object.keys(body || {}).filter((k) => !allowed.includes(k));
  if (extra.length)
    throw new DecisionError("unexpected-field", `unexpected field: ${extra.join(", ")}`, 400);
}
