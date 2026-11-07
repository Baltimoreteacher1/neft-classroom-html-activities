/* =============================================================================
 * Class platform — Cloudflare Pages Function (shared by Fluency Lab and The
 * Language Page). Contract: shared/class-platform/contract.js. Storage and
 * auth: functions/_lib/class-platform/store.js. Schema of record:
 * migrations/0011_class_platform.sql. Docs: docs/class-platform.md.
 *
 * Routes (catch-all under /api/class):
 *   GET  /health                                    -> { ok, d1, gated }
 *   GET  /info?code=                                -> title, app, goal meter, assignments
 *   POST /join      { code, alias, studentKey? }    -> { studentId, studentKey, alias }
 *   GET  /progress?code=&doc=        (student)      -> { doc, updatedAt, data } | { doc: null }
 *   POST /progress  { code, doc, updatedAt, data, summary }   (student, last-write-wins)
 *   GET  /me?code=                   (student)      -> { alias, studentId, familyToken }
 *   GET  /digest?code=&student=&token=  (family)    -> one learner's week, read-only
 *   Teacher (x-teacher-key, or x-class-teacher for that class):
 *   POST /create    { app, title }   (site key)     -> { code, teacherPasscode }
 *   GET  /roster?code=                              -> students + summaries + goal
 *   POST /settings  { code, settings }              -> goal, assignments, digest
 *   POST /reset-student  { code, studentId }        -> { studentKey }
 *   POST /remove-student { code, studentId }
 *   POST /delete    { code, confirm }               -> hard delete, everything
 *   /room/* and /audio/* are live rooms and voice notes (see their modules).
 *   /ai/* are the selection-only AI helpers (writing feedback, hint tutor); no class or D1 needed.
 *
 * GRACEFUL DEGRADATION: without the D1 binding every data route is 503 and both
 * apps stay device-only, exactly as before this endpoint existed.
 * ========================================================================== */

import {
  APPS,
  cleanText,
  DOCS,
  goalProgress,
  isClassCode,
  isSecret,
  isStudentId,
  LIMITS,
  lwwAccepts,
  normalizeCode,
  validateAlias,
  validateDocUpload,
  validateSettings,
} from "../../../shared/class-platform/contract.js";
import { handleAi } from "../../_lib/class-platform/ai.js";
import { handleAudio } from "../../_lib/class-platform/audio.js";
import { handleRoom } from "../../_lib/class-platform/rooms.js";
import {
  ensureSchema,
  familyToken,
  guardHit,
  guardOver,
  hashSecret,
  liveClass,
  parseJson,
  pruneExpired,
  purgeStatements,
  RETENTION_MS,
  randomHex,
  randomSecret,
  SCHEMA,
  sameKey,
  studentFromRequest,
  teacherRole,
  touchClass,
} from "../../_lib/class-platform/store.js";
import { clientIp, createRateLimiter, handler, json, tooManyRequests } from "../../_lib/http.js";

export { SCHEMA };

// A class shares one school IP, so ceilings are sized for ~35 students polling.
const throttle = {
  read: createRateLimiter({ max: 900, windowMs: 60_000 }),
  write: createRateLimiter({ max: 400, windowMs: 60_000 }),
  join: createRateLimiter({ max: 80, windowMs: 60_000 }),
  teacher: createRateLimiter({ max: 120, windowMs: 60_000 }),
};
const JOIN_FAIL_MAX = 12; // wrong student keys per class+alias per hour
const HOUR_MS = 60 * 60 * 1000;

const fail = (error, status = 400) => json({ ok: false, error }, status);
const codeOf = (raw) => {
  const code = normalizeCode(raw);
  return isClassCode(code) ? code : null;
};

async function requireClass(db, raw, now) {
  const code = codeOf(raw);
  if (!code) return { error: fail("invalid-code") };
  const cls = await liveClass(db, code, now);
  return cls ? { cls } : { error: fail("class-not-found", 404) };
}

async function requireTeacher(ctx, raw) {
  const { request, env, db, now } = ctx;
  if (throttle.teacher(clientIp(request), now)) return { error: tooManyRequests() };
  const found = await requireClass(db, raw, now);
  if (found.error) return found;
  const role = await teacherRole(request, env, found.cls);
  if (!role) return { error: fail("unauthorized", 401) };
  return { cls: found.cls, role };
}

async function requireStudent(ctx, raw) {
  const found = await requireClass(ctx.db, raw, ctx.now);
  if (found.error) return found;
  const student = await studentFromRequest(ctx.request, ctx.db, found.cls);
  return student ? { cls: found.cls, student } : { error: fail("unauthorized", 401) };
}

const settingsOf = (cls) => parseJson(cls.settings_json, {});

async function summaries(db, code, doc) {
  const res = await db
    .prepare(
      `SELECT student_id, updated_at, summary_json FROM class_platform_doc WHERE code = ? AND doc = ?`,
    )
    .bind(code, doc)
    .all();
  return res.results || [];
}

/* ── route handlers ────────────────────────────────────────────────────────── */

const routes = {
  async "GET info"(ctx) {
    const found = await requireClass(ctx.db, ctx.url.searchParams.get("code"), ctx.now);
    if (found.error) return found.error;
    const { cls } = found;
    const settings = settingsOf(cls);
    const rows = await summaries(ctx.db, cls.code, cls.app);
    const count = await ctx.db
      .prepare(`SELECT COUNT(*) AS n FROM class_platform_student WHERE code = ?`)
      .bind(cls.code)
      .first();
    return {
      ok: true,
      code: cls.code,
      app: cls.app,
      title: cls.title,
      students: Number(count?.n) || 0,
      goal: goalProgress(
        settings.goal,
        rows.map((r) => parseJson(r.summary_json, {})),
      ),
      assignments: settings.assignments || [],
    };
  },

  async "POST join"(ctx) {
    const { db, body, now, request } = ctx;
    if (throttle.join(clientIp(request), now)) return tooManyRequests();
    const found = await requireClass(db, body?.code, now);
    if (found.error) return found.error;
    const { cls } = found;
    const alias = validateAlias(body?.alias);
    if (!alias.ok) return fail(alias.error);
    const existing = await db
      .prepare(`SELECT * FROM class_platform_student WHERE code = ? AND alias = ?`)
      .bind(cls.code, alias.alias)
      .first();
    if (existing) {
      // Rejoin from another device: alias + the student key shown on first join.
      const bucket = `join:${cls.code}:${alias.alias.toLowerCase()}`;
      if (await guardOver(db, bucket, JOIN_FAIL_MAX)) return tooManyRequests(600);
      const key = String(body?.studentKey || "").toUpperCase();
      if (!isSecret(key) || !sameKey(await hashSecret(cls.salt, key), existing.key_hash)) {
        await guardHit(db, bucket, now, HOUR_MS);
        return fail(body?.studentKey ? "wrong-student-key" : "alias-taken", 409);
      }
      await db.batch([
        db
          .prepare(
            `UPDATE class_platform_student SET last_seen_at = ? WHERE code = ? AND student_id = ?`,
          )
          .bind(now, cls.code, existing.student_id),
        touchClass(db, cls.code, now),
      ]);
      return {
        ok: true,
        rejoined: true,
        studentId: existing.student_id,
        studentKey: key,
        alias: existing.alias,
        app: cls.app,
        title: cls.title,
      };
    }
    const count = await db
      .prepare(`SELECT COUNT(*) AS n FROM class_platform_student WHERE code = ?`)
      .bind(cls.code)
      .first();
    if (Number(count?.n) >= LIMITS.maxStudents) return fail("class-full", 409);
    const studentId = `s${randomHex(5)}`;
    const studentKey = randomSecret();
    await db.batch([
      db
        .prepare(
          `INSERT INTO class_platform_student (code, student_id, alias, key_hash, created_at, last_seen_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(cls.code, studentId, alias.alias, await hashSecret(cls.salt, studentKey), now, now),
      touchClass(db, cls.code, now),
    ]);
    return {
      ok: true,
      rejoined: false,
      studentId,
      studentKey,
      alias: alias.alias,
      app: cls.app,
      title: cls.title,
    };
  },

  async "GET progress"(ctx) {
    const auth = await requireStudent(ctx, ctx.url.searchParams.get("code"));
    if (auth.error) return auth.error;
    const doc = ctx.url.searchParams.get("doc");
    if (!DOCS.includes(doc)) return fail("unknown-doc");
    const row = await ctx.db
      .prepare(
        `SELECT updated_at, data FROM class_platform_doc WHERE code = ? AND student_id = ? AND doc = ?`,
      )
      .bind(auth.cls.code, auth.student.student_id, doc)
      .first();
    if (!row) return { ok: true, doc: null };
    return { ok: true, doc, updatedAt: Number(row.updated_at), data: parseJson(row.data, null) };
  },

  async "POST progress"(ctx) {
    const { db, now, request, body } = ctx;
    if (throttle.write(clientIp(request), now)) return tooManyRequests();
    const auth = await requireStudent(ctx, body?.code);
    if (auth.error) return auth.error;
    const upload = validateDocUpload(body, now);
    if (!upload.ok) return fail(upload.error, upload.error === "doc-too-large" ? 413 : 400);
    const { cls, student } = auth;
    const stored = await db
      .prepare(
        `SELECT updated_at FROM class_platform_doc WHERE code = ? AND student_id = ? AND doc = ?`,
      )
      .bind(cls.code, student.student_id, upload.doc)
      .first();
    if (stored && Number(stored.updated_at) === upload.updatedAt)
      return { ok: true, accepted: false, same: true, updatedAt: upload.updatedAt };
    if (!lwwAccepts(stored?.updated_at, upload.updatedAt))
      return json(
        { ok: false, error: "stale", stale: true, updatedAt: Number(stored.updated_at) },
        409,
      );
    await db.batch([
      db
        .prepare(
          `INSERT INTO class_platform_doc (code, student_id, doc, updated_at, received_at, data, summary_json)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(code, student_id, doc) DO UPDATE SET
             updated_at = excluded.updated_at, received_at = excluded.received_at,
             data = excluded.data, summary_json = excluded.summary_json
           WHERE excluded.updated_at > class_platform_doc.updated_at`,
        )
        .bind(
          cls.code,
          student.student_id,
          upload.doc,
          upload.updatedAt,
          now,
          upload.data,
          JSON.stringify(upload.summary),
        ),
      db
        .prepare(
          `UPDATE class_platform_student SET last_seen_at = ? WHERE code = ? AND student_id = ?`,
        )
        .bind(now, cls.code, student.student_id),
      touchClass(db, cls.code, now),
    ]);
    return { ok: true, accepted: true, updatedAt: upload.updatedAt };
  },

  async "GET me"(ctx) {
    const auth = await requireStudent(ctx, ctx.url.searchParams.get("code"));
    if (auth.error) return auth.error;
    const { cls, student } = auth;
    return {
      ok: true,
      code: cls.code,
      app: cls.app,
      title: cls.title,
      studentId: student.student_id,
      alias: student.alias,
      familyToken: await familyToken(cls.salt, student.student_id, student.key_hash),
    };
  },

  async "GET digest"(ctx) {
    const q = ctx.url.searchParams;
    const found = await requireClass(ctx.db, q.get("code"), ctx.now);
    if (found.error) return found.error;
    const { cls } = found;
    const studentId = q.get("student");
    if (!isStudentId(studentId)) return fail("invalid-student");
    const student = await ctx.db
      .prepare(`SELECT * FROM class_platform_student WHERE code = ? AND student_id = ?`)
      .bind(cls.code, studentId)
      .first();
    if (!student) return fail("not-found", 404);
    const expected = await familyToken(cls.salt, student.student_id, student.key_hash);
    if (!sameKey(q.get("token") || "", expected)) return fail("unauthorized", 401);
    const rows = await ctx.db
      .prepare(
        `SELECT doc, updated_at, summary_json FROM class_platform_doc WHERE code = ? AND student_id = ?`,
      )
      .bind(cls.code, studentId)
      .all();
    const docs = {};
    for (const r of rows.results || [])
      docs[r.doc] = { updatedAt: Number(r.updated_at), summary: parseJson(r.summary_json, {}) };
    const settings = settingsOf(cls);
    const classRows = await summaries(ctx.db, cls.code, cls.app);
    return {
      ok: true,
      app: cls.app,
      title: cls.title,
      alias: student.alias,
      docs,
      goal: goalProgress(
        settings.goal,
        classRows.map((r) => parseJson(r.summary_json, {})),
      ),
      assignments: settings.assignments || [],
    };
  },

  async "POST create"(ctx) {
    const { db, env, request, body, now } = ctx;
    if (throttle.teacher(clientIp(request), now)) return tooManyRequests();
    if (!env.TEACHER_KEY) return fail("teacher-not-configured", 503);
    if (!sameKey(request.headers.get("x-teacher-key") || "", env.TEACHER_KEY))
      return fail("unauthorized", 401);
    if (!APPS.includes(body?.app)) return fail("unknown-app");
    const title = cleanText(body?.title, LIMITS.maxTitle);
    if (!title) return fail("missing-title");
    await pruneExpired(db, now);
    const salt = randomHex(16);
    const teacherPasscode = randomSecret();
    let code = null;
    for (let i = 0; i < 6 && !code; i++) {
      const candidate = randomSecret(6);
      const hit = await db
        .prepare(`SELECT 1 AS x FROM class_platform_class WHERE code = ?`)
        .bind(candidate)
        .first();
      if (!hit) code = candidate;
    }
    if (!code) return fail("code-collision", 503);
    await db
      .prepare(
        `INSERT INTO class_platform_class (code, app, title, salt, teacher_hash, settings_json, created_at, last_active_at, expires_at)
         VALUES (?, ?, ?, ?, ?, '{}', ?, ?, ?)`,
      )
      .bind(
        code,
        body.app,
        title,
        salt,
        await hashSecret(salt, teacherPasscode),
        now,
        now,
        now + RETENTION_MS,
      )
      .run();
    return {
      ok: true,
      code,
      teacherPasscode,
      app: body.app,
      title,
      retentionDays: LIMITS.retentionDays,
    };
  },

  async "GET roster"(ctx) {
    const auth = await requireTeacher(ctx, ctx.url.searchParams.get("code"));
    if (auth.error) return auth.error;
    const { cls } = auth;
    const students =
      (
        await ctx.db
          .prepare(
            `SELECT student_id, alias, created_at, last_seen_at FROM class_platform_student WHERE code = ? ORDER BY alias`,
          )
          .bind(cls.code)
          .all()
      ).results || [];
    const docs =
      (
        await ctx.db
          .prepare(
            `SELECT student_id, doc, updated_at, summary_json FROM class_platform_doc WHERE code = ?`,
          )
          .bind(cls.code)
          .all()
      ).results || [];
    const byStudent = new Map(students.map((s) => [s.student_id, {}]));
    for (const d of docs) {
      const entry = byStudent.get(d.student_id);
      if (entry)
        entry[d.doc] = { updatedAt: Number(d.updated_at), summary: parseJson(d.summary_json, {}) };
    }
    const settings = settingsOf(cls);
    return {
      ok: true,
      code: cls.code,
      app: cls.app,
      title: cls.title,
      role: auth.role,
      settings,
      expiresAt: Number(cls.expires_at),
      goal: goalProgress(
        settings.goal,
        docs.filter((d) => d.doc === cls.app).map((d) => parseJson(d.summary_json, {})),
      ),
      students: students.map((s) => ({
        studentId: s.student_id,
        alias: s.alias,
        joinedAt: Number(s.created_at),
        lastSeen: Number(s.last_seen_at),
        docs: byStudent.get(s.student_id) || {},
      })),
    };
  },

  async "POST settings"(ctx) {
    const auth = await requireTeacher(ctx, ctx.body?.code);
    if (auth.error) return auth.error;
    const result = validateSettings(ctx.body?.settings, auth.cls.app);
    if (!result.ok) return fail(result.error);
    const merged = { ...settingsOf(auth.cls), ...result.settings };
    await ctx.db.batch([
      ctx.db
        .prepare(`UPDATE class_platform_class SET settings_json = ? WHERE code = ?`)
        .bind(JSON.stringify(merged), auth.cls.code),
      touchClass(ctx.db, auth.cls.code, ctx.now),
    ]);
    return { ok: true, settings: merged };
  },

  async "POST reset-student"(ctx) {
    const auth = await requireTeacher(ctx, ctx.body?.code);
    if (auth.error) return auth.error;
    if (!isStudentId(ctx.body?.studentId)) return fail("invalid-student");
    const studentKey = randomSecret();
    const res = await ctx.db
      .prepare(`UPDATE class_platform_student SET key_hash = ? WHERE code = ? AND student_id = ?`)
      .bind(await hashSecret(auth.cls.salt, studentKey), auth.cls.code, ctx.body.studentId)
      .run();
    if (!res.meta?.changes) return fail("not-found", 404);
    return { ok: true, studentKey };
  },

  async "POST remove-student"(ctx) {
    const auth = await requireTeacher(ctx, ctx.body?.code);
    if (auth.error) return auth.error;
    const id = ctx.body?.studentId;
    if (!isStudentId(id)) return fail("invalid-student");
    const { db } = ctx;
    const code = auth.cls.code;
    await db.batch([
      db.prepare(`DELETE FROM class_platform_doc WHERE code = ? AND student_id = ?`).bind(code, id),
      db
        .prepare(`DELETE FROM class_platform_audio WHERE code = ? AND student_id = ?`)
        .bind(code, id),
      db
        .prepare(
          `DELETE FROM class_platform_response WHERE student_id = ? AND room_id IN (SELECT room_id FROM class_platform_room WHERE code = ?)`,
        )
        .bind(id, code),
      db
        .prepare(`DELETE FROM class_platform_student WHERE code = ? AND student_id = ?`)
        .bind(code, id),
    ]);
    return { ok: true };
  },

  async "POST delete"(ctx) {
    const auth = await requireTeacher(ctx, ctx.body?.code);
    if (auth.error) return auth.error;
    if (normalizeCode(ctx.body?.confirm) !== auth.cls.code) return fail("confirm-mismatch");
    await ctx.db.batch(purgeStatements(ctx.db, auth.cls.code));
    return { ok: true, deleted: auth.cls.code };
  },
};

export const onRequest = handler({
  methods: ["GET", "POST"],
  maxBodyBytes: Math.ceil(LIMITS.maxAudioBytes * 1.4) + 64 * 1024,
  async handle(context) {
    const { request, env, params, body } = context;
    const parts = Array.isArray(params?.path) ? params.path : [params?.path || ""];
    const seg = parts[0] || "";
    if (seg === "health") return { ok: true, d1: !!env.DB, gated: !!env.TEACHER_KEY };
    const now = Date.now();
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    // The AI helpers need no class and no database: they only select among the apps' own authored ids.
    if (seg === "ai") return handleAi({ request, env, body, now, method, fail }, parts[1] || "");
    if (!env.DB) return fail("backend-not-configured", 503);
    if (method === "GET" ? throttle.read(clientIp(request), now) : false) return tooManyRequests();
    await ensureSchema(env.DB);
    const ctx = {
      request,
      env,
      db: env.DB,
      body,
      url,
      now,
      method,
      requireClass,
      requireTeacher,
      requireStudent,
      fail,
    };
    if (seg === "room") return handleRoom(ctx, parts[1] || "");
    if (seg === "audio") return handleAudio(ctx, parts[1] || "");
    const route = routes[`${method} ${seg}`];
    return route ? route(ctx) : fail("not-found", 404);
  },
});
