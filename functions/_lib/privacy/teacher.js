// Teacher authorisation for the privacy endpoints. It reuses the class API's credentials exactly:
// `x-teacher-key` (site key, env.TEACHER_KEY) or `x-class-teacher` (the class passcode), checked by
// teacherRole() in class-platform/store.js. No new credential exists here.
//
// Unlike the class API's own requireTeacher, an expired-but-not-yet-swept class can still be deleted:
// the teacher is proving ownership, and refusing would leave the data in place until a sweep.
import { isClassCode, normalizeCode } from "../../../shared/class-platform/contract.js";
import { ensureSchema, teacherRole } from "../class-platform/store.js";
import { clientIp, createRateLimiter, json, tooManyRequests } from "../http.js";

const teacherLimit = createRateLimiter({ max: 60, windowMs: 60_000 });
export const fail = (error, status = 400) => json({ ok: false, error }, status);

/** @returns {{ cls, role } | { error: Response }} */
export async function requireClassTeacher({ request, env }, rawCode) {
  if (!env.DB) return { error: fail("backend-not-configured", 503) };
  if (teacherLimit(clientIp(request))) return { error: tooManyRequests() };
  const code = normalizeCode(rawCode);
  if (!isClassCode(code)) return { error: fail("invalid-code") };
  await ensureSchema(env.DB);
  const cls = await env.DB.prepare("SELECT * FROM class_platform_class WHERE code = ?1")
    .bind(code)
    .first();
  if (!cls) return { error: fail("class-not-found", 404) };
  const role = await teacherRole(request, env, cls);
  return role ? { cls, role } : { error: fail("unauthorized", 401) };
}

/** A deletion failure as a JSON response; says so when the rows are already gone. */
export function deleteFailure(error) {
  console.error("privacy delete failed", error?.stack || error);
  if (error?.deleted)
    return json(
      { ok: false, error: "receipt-write-failed", deleted: true, counts: error.counts },
      500,
    );
  if (/no such table: privacy_deletion_receipt/i.test(String(error?.message)))
    return fail("privacy-migration-missing", 503);
  return fail("internal-error", 500);
}
