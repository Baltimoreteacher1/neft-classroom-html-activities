// Shared request checks for /api/formative: the PII screen, strict body shapes, the unit lookup, and the two
// credentials (class teacher, joined student). Nothing here stores anything.
import {
  isClassCode,
  isStudentId,
  normalizeCode,
} from "../../../shared/class-platform/contract.js";
import { errorCatalog, reteachActivity } from "../../../shared/formative/catalog.js";
import { TICKET_RE } from "../../../shared/formative/constants.js";
import { buildTicket } from "../../../shared/formative/ticket.js";
import { rejectIfPII } from "../../../shared/privacy/pii.mjs";
import { getUnitDetail } from "../bcpss/db.js";
import {
  ensureSchema,
  liveClass,
  studentFromRequest,
  teacherRole,
} from "../class-platform/store.js";
import { clientIp, createRateLimiter, json, tooManyRequests } from "../http.js";
import { registeredUnit } from "../security/unit-registry.js";

export const fail = (error, status = 400) => json({ ok: false, error }, status);

/**
 * First PII rejection (422) over every string anywhere in `value`, else null. Keys are screened too. A string that is
 * exactly an opaque student id (s + 10 hex) is an identifier, not free text, and is checked against the roster
 * instead: the screen's long-digit-run rule would otherwise refuse about 3% of real ids.
 */
export function screenPII(value, path = "body") {
  if (typeof value === "string") return isStudentId(value) ? null : rejectIfPII(value, path);
  if (Array.isArray(value)) {
    for (const [i, v] of value.entries()) {
      const hit = screenPII(v, `${path}[${i}]`);
      if (hit) return hit;
    }
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      const hit = rejectIfPII(k, `${path}.key`) || screenPII(v, `${path}.${k}`);
      if (hit) return hit;
    }
  }
  return null;
}

/** An object whose keys are all in `allowed`; anything else is a 400 so a stray free-text field is loud. */
export const hasOnly = (obj, allowed) =>
  !!obj &&
  typeof obj === "object" &&
  !Array.isArray(obj) &&
  Object.keys(obj).every((k) => allowed.includes(k));

/** { unitId, catalog, ticket, reteach } for a registered unit, or { error: Response }. */
export async function loadUnit(env, rawUnitId) {
  const unit = registeredUnit(String(rawUnitId ?? ""));
  if (!unit) return { error: fail("unknown-unit", 422) };
  const { detail } = await getUnitDetail(env, unit.id);
  if (!detail) return { error: fail("unknown-unit", 422) };
  const catalog = errorCatalog(detail);
  return {
    unitId: unit.id,
    catalog,
    ticket: buildTicket(detail),
    reteach: Object.fromEntries(catalog.map((e) => [e.id, reteachActivity(e, detail)])),
  };
}

/** The ticket id must belong to the unit and match what the unit's exit ticket produces. */
export const ticketBelongsTo = (ticketId, unitId) =>
  typeof ticketId === "string" &&
  TICKET_RE.test(ticketId) &&
  TICKET_RE.exec(ticketId)[1] === unitId;

/** A live class and the joined student behind `x-class-student`, or { error }. Same rule as /api/class "me". */
export async function requireClassStudent({ request, env }, rawCode, now) {
  if (!env.DB) return { error: fail("backend-not-configured", 503) };
  const code = normalizeCode(rawCode);
  if (!isClassCode(code)) return { error: fail("invalid-code") };
  await ensureSchema(env.DB);
  const cls = await liveClass(env.DB, code, now);
  if (!cls) return { error: fail("class-not-found", 404) };
  const student = await studentFromRequest(request, env.DB, cls);
  return student ? { cls, student } : { error: fail("unauthorized", 401) };
}

// Scoring a class is many small calls from one school IP, so unlike the deletion endpoints' blanket 60/minute
// limiter this one counts only FAILED credentials (guessing a passcode); the handler's own rateLimit bounds the rest.
const failedCredential = createRateLimiter({ max: 30, windowMs: 60_000 });

/** The class and role behind `x-class-teacher` / `x-teacher-key` (the class API's own check), or { error }. */
export async function requireClassTeacher({ request, env }, rawCode) {
  if (!env.DB) return { error: fail("backend-not-configured", 503) };
  const code = normalizeCode(rawCode);
  if (!isClassCode(code)) return { error: fail("invalid-code") };
  await ensureSchema(env.DB);
  const cls = await env.DB.prepare("SELECT * FROM class_platform_class WHERE code = ?1")
    .bind(code)
    .first();
  if (!cls) return { error: fail("class-not-found", 404) };
  const role = await teacherRole(request, env, cls);
  if (role) return { cls, role };
  return {
    error: failedCredential(clientIp(request)) ? tooManyRequests() : fail("unauthorized", 401),
  };
}
