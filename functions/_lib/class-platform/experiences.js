/* =============================================================================
 * Compiled experiences (Language Page, class only). An instructor turns their own
 * text into a playable simulation in the Experience Builder
 * (access-practice-lab/src/compiler/) and publishes the validated definition to
 * ONE class; learners open it at /access-practice-lab/simulations/x/<id>.
 *
 * Rules:
 *   - Publishing and unpublishing are teacher routes (requireTeacher: the site
 *     key or that class's passcode). A student key cannot publish.
 *   - The definition is re-validated here with the engine's own validateMission
 *     (access-practice-lab/src/sim/schema.js), capped at 120 KB, and its text is
 *     cleaned. An invalid or oversized definition is refused, never stored.
 *   - What is stored is what learners download: the compiler's notes are dropped
 *     and the instructor's raw source text is dropped unless `showSource` is true.
 *     A definition holds no secret, so `get` needs no key (a learner may open an
 *     assigned link before joining on that device); the id is unguessable.
 *   - Deleting a class deletes its experiences (store.js purge/prune).
 *
 * Routes (/api/class/experience/*):
 *   POST publish   { code, def, id?, showSource? }  teacher -> { id, path, updatedAt }
 *   GET  get?id=                                    anyone  -> { id, title, def, updatedAt }
 *   GET  list?code=                                 teacher -> { experiences: [{ id, title, updatedAt }] }
 *   POST unpublish { code, id }                     teacher
 * ========================================================================== */

import { validateMission } from "../../../access-practice-lab/src/sim/schema.js";
import { cleanText } from "../../../shared/class-platform/contract.js";
import { guardHit, guardOver, parseJson, randomHex } from "./store.js";

export const EXPERIENCE_LIMITS = Object.freeze({
  maxBytes: 120 * 1024,
  maxPerClass: 40,
  publishesPerHour: 60,
  maxString: 6000,
  maxDepth: 12,
});
export const EXPERIENCE_ID_RE = /^x[a-z0-9]{8,12}$/;
export const experiencePath = (id) => `/access-practice-lab/simulations/x/${id}`;
const HOUR_MS = 60 * 60 * 1000;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const BAD_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/** A plain-data copy with control characters removed and every string capped; null when it is not plain JSON. */
export function cleanDefinition(value, depth = 0) {
  if (depth > EXPERIENCE_LIMITS.maxDepth) return null;
  if (typeof value === "string")
    return value.replace(CONTROL, "").slice(0, EXPERIENCE_LIMITS.maxString);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) {
    if (value.length > 400) return null;
    const out = [];
    for (const v of value) {
      const c = cleanDefinition(v, depth + 1);
      if (c === null && v !== null) return null;
      out.push(c);
    }
    return out;
  }
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (BAD_KEYS.has(k) || k.length > 60) return null;
      const c = cleanDefinition(v, depth + 1);
      if (c === null && v !== null) return null;
      out[k] = c;
    }
    return out;
  }
  return null;
}

/**
 * The definition as it will be stored, or why it is refused.
 * @returns {{ ok: true, def: object, json: string } | { ok: false, error: string, status?: number, details?: string[] }}
 */
export function acceptDefinition(raw, { id, showSource = false }) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return { ok: false, error: "invalid-definition" };
  let size = 0;
  try {
    size = JSON.stringify(raw).length;
  } catch {
    return { ok: false, error: "invalid-definition" };
  }
  if (size > EXPERIENCE_LIMITS.maxBytes)
    return { ok: false, error: "definition-too-large", status: 413 };
  const def = cleanDefinition(raw);
  if (!def) return { ok: false, error: "invalid-definition" };
  delete def.compiled;
  if (!showSource) delete def.source;
  else if (def.source)
    def.source = {
      title: cleanText(def.source.title, 160),
      text: String(def.source.text || "").slice(0, 12_000),
    };
  def.id = `x-${id.slice(1)}`;
  const checked = validateMission(def);
  if (!checked.ok)
    return { ok: false, error: "invalid-definition", details: checked.errors.slice(0, 8) };
  return { ok: true, def, json: JSON.stringify(def) };
}

export async function handleExperiences(ctx, action) {
  const { db, body, url, now, method, fail } = ctx;
  const key = `${method} ${action}`;

  if (key === "GET get") {
    const id = url.searchParams.get("id") || "";
    if (!EXPERIENCE_ID_RE.test(id)) return fail("invalid-id");
    const row = await db
      .prepare(
        `SELECT e.experience_id, e.title, e.def_json, e.updated_at FROM class_platform_experience e
         JOIN class_platform_class c ON c.code = e.code WHERE e.experience_id = ? AND c.expires_at >= ?`,
      )
      .bind(id, now)
      .first();
    const def = row ? parseJson(row.def_json, null) : null;
    if (!def) return fail("not-found", 404);
    return { ok: true, id, title: row.title, def, updatedAt: Number(row.updated_at) };
  }

  const auth = await ctx.requireTeacher(
    ctx,
    method === "GET" ? url.searchParams.get("code") : body?.code,
  );
  if (auth.error) return auth.error;
  const { cls } = auth;
  if (cls.app !== "language") return fail("invalid-app");

  if (key === "GET list") {
    const res = await db
      .prepare(
        `SELECT experience_id, title, updated_at FROM class_platform_experience WHERE code = ? ORDER BY updated_at DESC`,
      )
      .bind(cls.code)
      .all();
    return {
      ok: true,
      experiences: (res.results || []).map((r) => ({
        id: r.experience_id,
        title: r.title,
        path: experiencePath(r.experience_id),
        updatedAt: Number(r.updated_at),
      })),
    };
  }

  if (key === "POST publish") {
    const bucket = `xp:${cls.code}`;
    if (await guardOver(db, bucket, EXPERIENCE_LIMITS.publishesPerHour))
      return fail("too-many-publishes", 429);
    let id = body?.id;
    let existing = null;
    if (id !== undefined) {
      if (!EXPERIENCE_ID_RE.test(String(id))) return fail("invalid-id");
      existing = await db
        .prepare(`SELECT code FROM class_platform_experience WHERE experience_id = ?`)
        .bind(id)
        .first();
      // An id that belongs to another class is never overwritten; a draft's local id simply gets a new one.
      if (existing && existing.code !== cls.code) return fail("not-yours", 403);
      if (!existing) id = undefined;
    }
    if (!existing) {
      const count = await db
        .prepare(`SELECT COUNT(*) AS n FROM class_platform_experience WHERE code = ?`)
        .bind(cls.code)
        .first();
      if (Number(count?.n || 0) >= EXPERIENCE_LIMITS.maxPerClass)
        return fail("too-many-experiences", 409);
      id = `x${randomHex(5)}`;
    }
    const accepted = acceptDefinition(body?.def, { id, showSource: body?.showSource === true });
    if (!accepted.ok)
      return new Response(
        JSON.stringify({ ok: false, error: accepted.error, details: accepted.details || [] }),
        { status: accepted.status || 400, headers: { "Content-Type": "application/json" } },
      );
    const title = cleanText(accepted.def.title?.[0], 80) || "Experience";
    await db.batch([
      db
        .prepare(
          `INSERT INTO class_platform_experience (experience_id, code, title, def_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(experience_id) DO UPDATE SET title = excluded.title, def_json = excluded.def_json, updated_at = excluded.updated_at`,
        )
        .bind(id, cls.code, title, accepted.json, now, now),
    ]);
    await guardHit(db, bucket, now, HOUR_MS);
    return { ok: true, id, title, path: experiencePath(id), updatedAt: now };
  }

  if (key === "POST unpublish") {
    const id = String(body?.id || "");
    if (!EXPERIENCE_ID_RE.test(id)) return fail("invalid-id");
    const res = await db
      .prepare(`DELETE FROM class_platform_experience WHERE experience_id = ? AND code = ?`)
      .bind(id, cls.code)
      .run();
    if (!res.meta?.changes) return fail("not-found", 404);
    return { ok: true, id };
  }

  return fail("not-found", 404);
}
